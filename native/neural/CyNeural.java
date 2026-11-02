package com.cypress.reader;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.net.ConnectivityManager;
import android.net.wifi.WifiManager;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import android.widget.Toast;
import com.getcapacitor.JSObject;
import com.k2fsa.sherpa.onnx.GeneratedAudio;
import com.k2fsa.sherpa.onnx.OfflineTts;
import com.k2fsa.sherpa.onnx.OfflineTtsConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsKokoroModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * SPIKE (neural voices step 1): one English Kokoro voice through sherpa-onnx >= 2.0 (no eSpeak, Apache-2.0).
 * Only built into the test APK (spike-tts.yml); CyTts finds it by name, so the normal app never needs it.
 * Voice files download on first use, Wi-Fi only, into app-private storage. Any failure: CyTts uses the phone's voice.
 */
final class CyNeural implements CyTts.Neural {
    private static final String TAG = "CyNeural";
    /** Pinned revision, so the files can never change under us. No espeak-ng-data is fetched. */
    private static final String BASE =
            "https://huggingface.co/csukuangfj/kokoro-int8-multi-lang-v1_0/resolve/57adb37fc0e8d4bd430cfc1b8f8c2294945b9af2/";
    private static final String[] FILES = {"tokens.txt", "lexicon-us-en.txt", "voices.bin", "model.int8.onnx"};
    private static final long[] SIZES = {687L, 5956885L, 28200960L, 114202993L};
    private static final int SID = 3; // af_heart (US English, female)

    private static final class Clip {
        final int g;
        final String id;
        final float[] pcm;
        final int rate, start, end, pauseMs;
        final float vol;
        final boolean first, last;
        Clip(int g, String id, float[] pcm, int rate, int start, int end, int pauseMs, float vol, boolean first, boolean last) {
            this.g = g; this.id = id; this.pcm = pcm; this.rate = rate; this.start = start; this.end = end;
            this.pauseMs = pauseMs; this.vol = vol; this.first = first; this.last = last;
        }
    }

    private final Context ctx;
    private final File dir;
    private final ExecutorService synth = Executors.newSingleThreadExecutor();
    private final LinkedBlockingQueue<Clip> clips = new LinkedBlockingQueue<>(3); // bounded: synthesis stays ~3 sentences ahead
    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile int gen = 0;
    private volatile OfflineTts tts;
    private volatile boolean broken = false, downloading = false, warned = false;
    private AudioTrack track;
    private int trackRate = 0;

    CyNeural(Context c) {
        ctx = c.getApplicationContext();
        dir = new File(ctx.getFilesDir(), "voices/kokoro-en");
        Thread t = new Thread(this::playLoop, "CyNeuralPlay");
        t.setDaemon(true);
        t.start();
    }

    @Override
    public boolean ready() {
        if (broken) return false;
        for (int i = 0; i < FILES.length; i++) {
            File f = new File(dir, FILES[i]);
            if (!f.isFile() || f.length() != SIZES[i]) return false;
        }
        return true;
    }

    @Override
    public void voice(org.json.JSONArray arr) throws Exception {
        JSObject o = new JSObject();
        o.put("id", CyTts.NEURAL_ID);
        o.put("name", "English (United States) · Natural voice (test)" + (ready() ? "" : downloading ? " · downloading" : " · downloads 150 MB on Wi-Fi"));
        o.put("lang", "en-US");
        o.put("local", true);
        o.put("q", 0); // never picked by "Best available"; only when chosen by hand
        arr.put(o);
    }

    /** Starts the one-time download on an unmetered network. Returns at once. */
    @Override
    public void fetch() {
        if (broken || downloading || ready()) return;
        boolean metered = true;
        try {
            ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
            metered = cm == null || cm.isActiveNetworkMetered();
        } catch (Throwable t) {
            // assume metered
        }
        if (metered) {
            if (!warned) toast("The natural voice downloads on Wi-Fi only. Using the phone’s voice for now.");
            warned = true; // once per app run, not once per paragraph
            return;
        }
        downloading = true;
        toast("Downloading the natural voice (150 MB). Using the phone’s voice until it’s ready.");
        new Thread(() -> {
            String err = null;
            PowerManager.WakeLock wl = null;
            WifiManager.WifiLock wf = null;
            try {
                // keep the CPU and Wi-Fi up while the screen is off: 150 MB takes minutes on a phone
                wl = ((PowerManager) ctx.getSystemService(Context.POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "cypress:voice");
                wl.acquire(30 * 60 * 1000L);
                wf = ((WifiManager) ctx.getSystemService(Context.WIFI_SERVICE)).createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "cypress:voice");
                wf.acquire();
            } catch (Throwable t) {
                Log.w(TAG, "locks: " + t);
            }
            try {
                if (!dir.isDirectory() && !dir.mkdirs()) throw new Exception("no folder");
                for (int i = 0; i < FILES.length; i++) {
                    File f = new File(dir, FILES[i]);
                    if (f.isFile() && f.length() == SIZES[i]) continue;
                    File part = new File(dir, FILES[i] + ".part");
                    for (int tries = 0; ; tries++) {
                        try {
                            get(FILES[i], part, SIZES[i]);
                            break;
                        } catch (Throwable t) {
                            Log.w(TAG, FILES[i] + " try " + tries + ": " + t);
                            if (tries >= 5) throw t;
                            Thread.sleep(2000L << tries); // 2, 4, 8, 16, 32 s; the .part file is kept and resumed
                        }
                    }
                    if (!part.renameTo(f)) throw new Exception("could not save " + FILES[i]);
                }
            } catch (Throwable t) {
                err = t.getClass().getSimpleName() + (t.getMessage() == null ? "" : ": " + t.getMessage());
                Log.w(TAG, "download failed: " + err);
            } finally {
                try {
                    if (wf != null && wf.isHeld()) wf.release();
                    if (wl != null && wl.isHeld()) wl.release();
                } catch (Throwable t) {
                    // ignore
                }
            }
            downloading = false;
            toast(err == null ? "The natural voice is ready. It is used from the next story you play."
                     : "The natural voice didn’t download (" + (err.length() > 90 ? err.substring(0, 90) : err) + "). Choose it again on Wi-Fi to continue where it stopped.");
        }, "CyNeuralGet").start();
    }

    /** Downloads one file into part, continuing from what part already holds. */
    private static void get(String name, File part, long size) throws Exception {
        long have = part.isFile() ? part.length() : 0;
        if (have > size) {
            part.delete();
            have = 0;
        }
        if (have == size) return;
        HttpURLConnection c = (HttpURLConnection) new URL(BASE + name).openConnection();
        c.setConnectTimeout(20000);
        c.setReadTimeout(60000);
        c.setRequestProperty("Accept-Encoding", "identity"); // byte ranges must match the file on disk
        if (have > 0) c.setRequestProperty("Range", "bytes=" + have + "-");
        try {
            int code = c.getResponseCode();
            boolean append = have > 0 && code == 206;
            if (code != 200 && code != 206) throw new Exception("HTTP " + code + " for " + name);
            try (InputStream in = c.getInputStream(); FileOutputStream out = new FileOutputStream(part, append)) {
                byte[] buf = new byte[1 << 16];
                for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            }
        } finally {
            c.disconnect();
        }
        if (part.length() != size) throw new Exception(name + " stopped at " + part.length() / 1048576 + " of " + size / 1048576 + " MB");
    }

    private OfflineTts engine() {
        OfflineTts t = tts;
        if (t != null) return t;
        long t0 = System.currentTimeMillis();
        OfflineTtsKokoroModelConfig k = new OfflineTtsKokoroModelConfig();
        k.setModel(new File(dir, "model.int8.onnx").getPath());
        k.setVoices(new File(dir, "voices.bin").getPath());
        k.setTokens(new File(dir, "tokens.txt").getPath());
        k.setLexicon(new File(dir, "lexicon-us-en.txt").getPath());
        OfflineTtsModelConfig m = new OfflineTtsModelConfig();
        m.setKokoro(k);
        m.setNumThreads(Math.max(1, Math.min(4, Runtime.getRuntime().availableProcessors() / 2)));
        m.setProvider("cpu");
        OfflineTtsConfig cfg = new OfflineTtsConfig();
        cfg.setModel(m);
        t = new OfflineTts(null, cfg);
        Log.i(TAG, "model loaded in " + (System.currentTimeMillis() - t0) + " ms, rate " + t.sampleRate());
        tts = t;
        return t;
    }

    @Override
    public void speak(String id, String text, float rate, float volume, int pauseMs, boolean add) {
        if (!add) flush();
        final int g = gen;
        synth.execute(() -> {
            try {
                int lead = 0;
                while (lead < text.length() && Character.isWhitespace(text.charAt(lead))) lead++;
                String body = text.substring(lead).trim();
                if (body.isEmpty()) {
                    put(new Clip(g, id, new float[0], 24000, 0, 0, 0, volume, true, true));
                    return;
                }
                OfflineTts t = engine();
                List<int[]> spans = CyTts.split(body, 220); // a sentence or two per clip: first sound comes quickly
                for (int i = 0; i < spans.size(); i++) {
                    if (g != gen) return;
                    int[] sp = spans.get(i);
                    long t0 = System.currentTimeMillis();
                    GeneratedAudio a = t.generate(body.substring(sp[0], sp[1]), SID, rate);
                    float[] s = a.getSamples();
                    Log.i(TAG, "clip " + i + ": " + (System.currentTimeMillis() - t0) + " ms for "
                            + (s.length * 1000L / Math.max(1, a.getSampleRate())) + " ms of audio");
                    if (!put(new Clip(g, id, s, a.getSampleRate(), lead + sp[0], lead + sp[1],
                            i == 0 && add ? pauseMs : 0, volume, i == 0, i == spans.size() - 1))) return;
                }
            } catch (Throwable e) {
                // a model that will not load or speak: stop trying for this app run, the phone's voice takes over
                Log.w(TAG, "synthesis failed: " + e);
                broken = true;
                if (g == gen) CyTts.emitEvent("ttsError", id, "neural");
            }
        });
    }

    private boolean put(Clip c) throws InterruptedException {
        while (c.g == gen) if (clips.offer(c, 200, TimeUnit.MILLISECONDS)) return true;
        return false;
    }

    private void flush() {
        gen++;
        clips.clear();
        synchronized (this) {
            if (track != null) {
                try {
                    track.pause();
                    track.flush();
                    written = 0;
                } catch (Throwable t) {
                    // ignore
                }
            }
        }
    }

    @Override
    public void stop() {
        flush();
    }

    private void playLoop() {
        while (true) {
            try {
                Clip c = clips.take();
                if (c.g != gen) continue;
                AudioTrack tr;
                synchronized (this) {
                    if (track == null || trackRate != c.rate) {
                        if (track != null) track.release();
                        int min = AudioTrack.getMinBufferSize(c.rate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_FLOAT);
                        track = new AudioTrack.Builder()
                                .setAudioAttributes(new AudioAttributes.Builder()
                                        .setUsage(AudioAttributes.USAGE_MEDIA)
                                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                                .setAudioFormat(new AudioFormat.Builder().setSampleRate(c.rate)
                                        .setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
                                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
                                .setBufferSizeInBytes(Math.max(min, c.rate / 5 * 4))
                                .setTransferMode(AudioTrack.MODE_STREAM).build();
                        trackRate = c.rate;
                    }
                    tr = track;
                    tr.setVolume(c.vol);
                    if (tr.getPlayState() != AudioTrack.PLAYSTATE_PLAYING) tr.play();
                }
                if (c.first) CyTts.emitEvent("ttsStart", c.id, null);
                if (c.pauseMs > 0) write(tr, new float[c.rate * c.pauseMs / 1000], c.g);
                if (c.end > c.start) CyTts.emitRange(c.id, c.start, c.end); // sentence highlight (no word timings)
                write(tr, c.pcm, c.g);
                if (c.last && c.g == gen) {
                    // wait until the sound has actually played before telling the page this text is done
                    long frames = tr.getPlaybackHeadPosition() & 0xffffffffL;
                    long need = written;
                    while (c.g == gen && frames < need) {
                        Thread.sleep(25);
                        frames = tr.getPlaybackHeadPosition() & 0xffffffffL;
                    }
                    if (c.g == gen) CyTts.emitEvent("ttsEnd", c.id, null);
                }
            } catch (Throwable t) {
                Log.w(TAG, "play: " + t);
            }
        }
    }

    /** Frames written since the last flush (flush resets the play head to zero). */
    private volatile long written = 0;

    private void write(AudioTrack tr, float[] pcm, int g) {
        for (int o = 0; o < pcm.length && g == gen; ) {
            int n = tr.write(pcm, o, Math.min(4096, pcm.length - o), AudioTrack.WRITE_BLOCKING);
            if (n <= 0) break;
            o += n;
            written += n;
        }
        if (g != gen) {
            // stopped while a write was blocked: drop what that write slipped into the buffer
            synchronized (this) {
                try {
                    tr.pause();
                    tr.flush();
                } catch (Throwable t) {
                    // ignore
                }
                written = 0;
            }
        }
    }

    private void toast(String s) {
        main.post(() -> {
            try {
                Toast.makeText(ctx, s, Toast.LENGTH_LONG).show();
            } catch (Throwable t) {
                // ignore
            }
        });
    }
}
