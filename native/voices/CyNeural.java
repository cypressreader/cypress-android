package com.cypress.reader;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;
import com.getcapacitor.JSObject;
import com.k2fsa.sherpa.onnx.GeneratedAudio;
import com.k2fsa.sherpa.onnx.OfflineTts;
import com.k2fsa.sherpa.onnx.OfflineTtsConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsVitsModelConfig;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONObject;

/**
 * SPIKE (voices test build only): one on-device neural voice (sherpa-onnx 2.0, Piper LJSpeech, lexicon only, no eSpeak).
 * CyTts finds this class by name; the normal app build does not contain it. Same events as the system voice:
 * ttsStart / ttsBoundary (per sentence) / ttsEnd, fired when the audio is actually heard, not when it is made.
 * One thread makes a sentence and writes it into a 3-second audio buffer, so the next sentence is made while this one plays.
 */
final class CyNeural implements CyTts.Neural {
    private static final String TAG = "CyNeural";
    static final String ID = "cy-neural:en_US-ljspeech-medium";
    private static final String DIR = "voices/en_US-ljspeech-medium/";
    private static final Pattern SENT = Pattern.compile("[^.!?\\n]+(?:[.!?]+[\"'”’)\\]]*|\\n|$)");

    private final Context ctx;
    private final ExecutorService ex = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Object lock = new Object();
    private OfflineTts tts; // worker thread only
    private boolean failed, told;
    private AudioTrack track; // guarded by lock
    private long written; // frames written into track, guarded by lock
    private int gen;
    private final List<Object[]> due = new ArrayList<>(); // {frame, event, JSObject}, guarded by lock

    CyNeural(Context c) {
        ctx = c.getApplicationContext();
    }

    @Override
    public JSONObject voice() throws Exception {
        JSONObject o = new JSONObject();
        o.put("id", ID);
        o.put("name", "English (United States) · New natural voice (test)");
        o.put("lang", "en-US");
        o.put("local", true);
        o.put("q", 500);
        return o;
    }

    @Override
    public void speak(String id, String text, float rate, float volume, boolean add, int pauseMs, Runnable fallback) {
        final int g;
        synchronized (lock) {
            g = add ? gen : ++gen;
        }
        if (!add) dropAudio();
        ex.execute(() -> run(g, id, text == null ? "" : text, rate, volume, add, pauseMs, fallback));
    }

    @Override
    public void stop() {
        synchronized (lock) {
            gen++;
        }
        dropAudio();
    }

    private boolean stale(int g) {
        synchronized (lock) {
            return g != gen;
        }
    }

    private void dropAudio() {
        AudioTrack t;
        synchronized (lock) {
            t = track;
            track = null;
            written = 0;
            due.clear();
        }
        if (t == null) return;
        try {
            t.pause();
            t.flush();
            t.release();
        } catch (Throwable e) {
            Log.w(TAG, "drop: " + e);
        }
    }

    private boolean load() {
        if (tts != null) return true;
        if (failed) return false;
        long t0 = System.currentTimeMillis();
        try {
            OfflineTtsVitsModelConfig v = new OfflineTtsVitsModelConfig();
            v.setModel(DIR + "en_US-ljspeech-medium.onnx");
            v.setTokens(DIR + "tokens.txt");
            v.setLexicon(DIR + "lexicon-en-us.txt");
            OfflineTtsModelConfig m = new OfflineTtsModelConfig();
            m.setVits(v);
            m.setNumThreads(2);
            OfflineTtsConfig c = new OfflineTtsConfig();
            c.setModel(m);
            tts = new OfflineTts(ctx.getAssets(), c);
            toast("New voice loaded in " + secs(System.currentTimeMillis() - t0));
            return true;
        } catch (Throwable e) {
            Log.w(TAG, "load failed: " + e);
            failed = true;
            toast("New voice could not start, using the phone voice");
            return false;
        }
    }

    private void run(int g, String id, String text, float rate, float volume, boolean add, int pauseMs, Runnable fallback) {
        if (stale(g)) return;
        if (!load()) {
            main.post(fallback);
            return;
        }
        try {
            int sr = tts.sampleRate();
            AudioTrack t = track(sr, volume);
            if (t == null) {
                main.post(fallback);
                return;
            }
            if (add && pauseMs > 0) write(g, t, new float[sr * pauseMs / 1000]);
            at("ttsStart", id, -1, -1);
            float speed = Math.max(.5f, Math.min(2.5f, rate));
            Matcher mt = SENT.matcher(text);
            while (mt.find()) {
                String s = mt.group().trim();
                if (s.isEmpty() || !s.matches("(?s).*[\\p{L}\\p{N}].*")) continue;
                if (stale(g)) return;
                long t0 = System.currentTimeMillis();
                GeneratedAudio a = tts.generate(s, 0, speed);
                float[] pcm = a.getSamples();
                if (!told && pcm.length > 0) {
                    told = true;
                    long ms = System.currentTimeMillis() - t0;
                    toast("First sentence made in " + secs(ms) + String.format(java.util.Locale.US, " (%.1f× faster than speaking it)", pcm.length * 1000f / sr / Math.max(1, ms)));
                }
                if (stale(g)) return;
                int st = mt.start() + mt.group().indexOf(s.charAt(0));
                at("ttsBoundary", id, st, st + s.length());
                write(g, t, pcm);
            }
            at("ttsEnd", id, -1, -1);
        } catch (Throwable e) {
            Log.w(TAG, "speak failed: " + e);
            if (!stale(g)) {
                JSObject o = new JSObject();
                o.put("id", id);
                o.put("error", "neural");
                CyExtras.emit("ttsError", o, false);
            }
        }
    }

    private AudioTrack track(int sr, float volume) {
        synchronized (lock) {
            if (track == null) {
                try {
                    track = new AudioTrack.Builder()
                        .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                        .setAudioFormat(new AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_FLOAT).setSampleRate(sr).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
                        .setBufferSizeInBytes(sr * 4 * 3)
                        .setTransferMode(AudioTrack.MODE_STREAM)
                        .build();
                    // start after 0.1 s of sound, not when the 3 s buffer is full (short last sentences would never play)
                    if (android.os.Build.VERSION.SDK_INT >= 31) track.setStartThresholdInFrames(sr / 10);
                    track.play();
                    written = 0;
                } catch (Throwable e) {
                    Log.w(TAG, "audio: " + e);
                    track = null;
                    return null;
                }
            }
            try {
                track.setVolume(volume);
            } catch (Throwable e) {
                // keep the old volume
            }
            return track;
        }
    }

    /** Blocks while the buffer is full; stop() flushes the track, which lets it return. */
    private void write(int g, AudioTrack t, float[] pcm) {
        int off = 0;
        while (off < pcm.length && !stale(g)) {
            int n = t.write(pcm, off, pcm.length - off, AudioTrack.WRITE_BLOCKING);
            if (n <= 0) return;
            off += n;
            synchronized (lock) {
                if (track == t) written += n;
            }
        }
    }

    /** Queues an event for the moment the audio written so far has been heard. */
    private void at(String event, String id, int start, int end) {
        JSObject o = new JSObject();
        o.put("id", id);
        if (start >= 0) {
            o.put("start", start);
            o.put("end", end);
        }
        boolean kick;
        synchronized (lock) {
            kick = due.isEmpty();
            due.add(new Object[] { written, event, o });
        }
        if (kick) main.post(poll);
    }

    private final Runnable poll = new Runnable() {
        @Override
        public void run() {
            List<Object[]> fire = new ArrayList<>();
            boolean more;
            synchronized (lock) {
                long pos = 0;
                try {
                    if (track != null) pos = track.getPlaybackHeadPosition() & 0xffffffffL;
                } catch (Throwable e) {
                    // released
                }
                while (!due.isEmpty() && (long) due.get(0)[0] <= pos) fire.add(due.remove(0));
                more = !due.isEmpty();
            }
            for (Object[] e : fire) {
                JSObject o = (JSObject) e[2];
                o.put("ts", System.currentTimeMillis());
                CyExtras.emit((String) e[1], o, false);
            }
            main.removeCallbacks(this);
            if (more) main.postDelayed(this, 60);
        }
    };

    private void toast(String s) {
        main.post(() -> {
            try {
                Toast.makeText(ctx, s, Toast.LENGTH_LONG).show();
            } catch (Throwable e) {
                // ignore
            }
        });
    }

    private static String secs(long ms) {
        return String.format(java.util.Locale.US, "%.1f s", ms / 1000f);
    }
}
