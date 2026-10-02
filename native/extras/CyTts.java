package com.cypress.reader;

import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Text to speech for the web app, using the phone's own engine. The web view in this app has no
 * speechSynthesis, so a small shim in the page calls these methods and gets start, word and end events back.
 * Everything here catches everything: a broken speech engine must never crash the app.
 */
final class CyTts {
    private static final String TAG = "CyTts";
    private static CyTts inst;

    static synchronized CyTts get(Context c) {
        if (inst == null) inst = new CyTts(c.getApplicationContext());
        return inst;
    }

    private static final class Job {
        String id;
        String text;
        float rate = 1f, pitch = 1f, volume = 1f;
        String voice;
        int remaining = 0;
        Job(String id, String text) {
            this.id = id;
            this.text = text;
        }
    }

    /** One piece of a job. */
    private static final class Piece {
        final String uid;
        final Job job;
        final int offset;
        Piece(String uid, Job job, int offset) {
            this.uid = uid;
            this.job = job;
            this.offset = offset;
        }
    }

    private final Object lock = new Object();
    private final Object initLock = new Object();
    private final Context appCtx;
    private volatile TextToSpeech tts;
    private volatile boolean ready = false, failed = false;
    private int gen = 0;
    private int seq = 0;
    private static final class Wait {
        final Runnable run, fail;
        Wait(Runnable run, Runnable fail) {
            this.run = run;
            this.fail = fail;
        }
    }
    private final List<Wait> waiting = new ArrayList<>();
    private final List<Piece> pieces = new ArrayList<>();

    private CyTts(Context c) {
        appCtx = c;
        create();
    }

    /** (Re)creates the engine. The init callback waits for this method to finish assigning it. */
    private void create() {
        synchronized (lock) {
            ready = false;
            failed = false;
        }
        try {
            synchronized (initLock) {
                tts = new TextToSpeech(appCtx, status -> onEngineInit(status));
            }
        } catch (Throwable t) {
            Log.w(TAG, "init failed: " + t);
            engineFailed();
        }
    }

    private void onEngineInit(int status) {
        TextToSpeech t;
        synchronized (initLock) {
            t = tts; // waits until create() has assigned it
        }
        boolean ok = status == TextToSpeech.SUCCESS && t != null;
        if (ok) {
            try {
                t.setOnUtteranceProgressListener(listener); // before anything can be spoken
            } catch (Throwable e) {
                Log.w(TAG, "listener failed: " + e);
                ok = false;
            }
        }
        if (!ok) {
            engineFailed();
            return;
        }
        List<Wait> run;
        synchronized (lock) {
            ready = true;
            failed = false;
            run = new ArrayList<>(waiting);
            waiting.clear();
        }
        for (Wait w : run) {
            try {
                w.run.run();
            } catch (Throwable e) {
                Log.w(TAG, "queued call failed: " + e);
            }
        }
    }

    private void engineFailed() {
        List<Wait> run;
        synchronized (lock) {
            ready = false;
            failed = true;
            run = new ArrayList<>(waiting);
            waiting.clear();
        }
        try {
            TextToSpeech t = tts;
            if (t != null) t.shutdown();
        } catch (Throwable e) {
            // ignore
        }
        tts = null;
        for (Wait w : run) {
            try {
                if (w.fail != null) w.fail.run();
            } catch (Throwable e) {
                Log.w(TAG, "fail callback: " + e);
            }
        }
    }

    /** Drops a dead engine and starts a new one. */
    private void restart() {
        try {
            TextToSpeech t = tts;
            if (t != null) t.shutdown();
        } catch (Throwable e) {
            // ignore
        }
        tts = null;
        create();
    }

    boolean isFailed() {
        return failed;
    }

    /** Run now if the engine is ready, later if it is still starting, and start a new engine if the last one failed. */
    private void whenReady(Runnable r, Runnable onFail) {
        boolean now = false, again = false;
        synchronized (lock) {
            if (failed) {
                again = true;
            } else if (ready) {
                now = true;
            } else {
                waiting.add(new Wait(r, onFail));
                return;
            }
        }
        if (now) {
            r.run();
        } else if (again) {
            synchronized (lock) {
                waiting.add(new Wait(r, onFail));
            }
            restart();
        }
    }

    // ---------------------------------------------------------------- voices

    /** Returns {"voices":[...],"ready":bool}. Empty while the engine is still starting. */
    JSObject voices() {
        JSObject out = new JSObject();
        JSONArray arr = new JSONArray();
        boolean rdy;
        synchronized (lock) {
            rdy = ready;
        }
        try {
            if (rdy && tts != null) {
                Set<Voice> vs = tts.getVoices();
                if (vs != null) {
                    List<Voice> list = new ArrayList<>(vs);
                    for (Voice v : list) {
                        if (v == null || v.getLocale() == null) continue;
                        if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                        JSONObject o = new JSONObject();
                        o.put("id", v.getName());
                        String q = (v.getQuality() >= Voice.QUALITY_HIGH ? " ★" : "") + (v.isNetworkConnectionRequired() ? " (online)" : "");
                        o.put("name", v.getLocale().getDisplayName() + " · " + shortName(v.getName()) + q);
                        o.put("lang", v.getLocale().toLanguageTag());
                        o.put("local", !v.isNetworkConnectionRequired());
                        o.put("q", v.getQuality());
                        arr.put(o);
                    }
                }
            }
            out.put("voices", arr);
            out.put("ready", rdy);
            out.put("failed", failed);
        } catch (Throwable t) {
            Log.w(TAG, "voices failed: " + t);
        }
        return out;
    }

    private static String shortName(String n) {
        if (n == null) return "";
        int i = n.indexOf("-x-");
        String s = i >= 0 ? n.substring(i + 3) : n;
        return s.replace("-local", "").replace("-network", "");
    }

    // ---------------------------------------------------------------- speaking

    /**
     * add = false starts a new reading (anything still playing is replaced); add = true queues this text
     * behind what is already playing, so a whole story can be handed over at once and carry on with the app asleep.
     */
    void speak(String id, String text, float rate, float pitch, float volume, String voice, boolean add) {
        Job job = new Job(id, text == null ? "" : text);
        job.rate = clamp(rate, .3f, 3f);
        job.pitch = clamp(pitch, .5f, 2f);
        job.volume = clamp(volume, 0f, 1f);
        job.voice = voice;
        final int g;
        synchronized (lock) {
            g = add ? gen : ++gen;
        }
        whenReady(() -> start(job, g, false, add), () -> emit("ttsError", id, "engine"));
    }

    private static float clamp(float v, float lo, float hi) {
        return v != v ? 1f : Math.max(lo, Math.min(hi, v));
    }

    private boolean stale(int g) {
        synchronized (lock) {
            return g != gen;
        }
    }

    private void start(Job job, int g, boolean retried, boolean add) {
        try {
            if (stale(g)) return;
            TextToSpeech t = tts;
            if (t == null) {
                emit("ttsError", job.id, "engine");
                return;
            }
            // Speak the trimmed text, but report word positions in the text the page sent.
            int lead = 0;
            while (lead < job.text.length() && Character.isWhitespace(job.text.charAt(lead))) lead++;
            String text = job.text.substring(lead).trim();
            if (text.isEmpty()) {
                emit("ttsEnd", job.id, null);
                return;
            }
            t.setSpeechRate(job.rate);
            t.setPitch(job.pitch);
            boolean voiceSet = false;
            if (job.voice != null && !job.voice.isEmpty()) {
                try {
                    Set<Voice> vs = t.getVoices();
                    if (vs != null) {
                        for (Voice v : vs) {
                            if (job.voice.equals(v.getName())) {
                                voiceSet = t.setVoice(v) == TextToSpeech.SUCCESS;
                                break;
                            }
                        }
                    }
                } catch (Throwable e) {
                    Log.w(TAG, "setVoice failed: " + e);
                }
            }
            if (!voiceSet) {
                try {
                    t.setLanguage(Locale.getDefault());
                } catch (Throwable e) {
                    Log.w(TAG, "setLanguage failed: " + e);
                }
            }
            int max = 3500;
            try {
                max = Math.max(500, Math.min(3500, TextToSpeech.getMaxSpeechInputLength() - 200));
            } catch (Throwable e) {
                // keep the default
            }
            List<int[]> spans = split(text, max);
            int run;
            synchronized (lock) {
                if (!add) pieces.clear();
                job.remaining = spans.size();
                run = ++seq;
            }
            for (int i = 0; i < spans.size(); i++) {
                if (stale(g)) return;
                int[] sp = spans.get(i);
                String uid = job.id + "@" + run + "#" + i;
                Piece p = new Piece(uid, job, lead + sp[0]);
                synchronized (lock) {
                    pieces.add(p);
                }
                Bundle b = new Bundle();
                b.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, job.volume);
                int r = t.speak(text.substring(sp[0], sp[1]), (i == 0 && !add) ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, b, uid);
                if (r != TextToSpeech.SUCCESS) {
                    try {
                        t.stop();
                    } catch (Throwable e) {
                        // ignore
                    }
                    synchronized (lock) {
                        pieces.clear();
                        job.remaining = 0;
                    }
                    if (!retried && i == 0 && !add) {
                        // the engine may have died (for example after an update): start a new one and try once more
                        final int g2;
                        synchronized (lock) {
                            g2 = ++gen;
                        }
                        restart();
                        whenReady(() -> start(job, g2, true, false), () -> emit("ttsError", job.id, "engine"));
                    } else {
                        emit("ttsError", job.id, "speak");
                    }
                    return;
                }
            }
        } catch (Throwable e) {
            Log.w(TAG, "start failed: " + e);
            emit("ttsError", job.id, "speak");
        }
    }

    /** Split at sentence ends, or at spaces, so no piece is longer than max. Returns [start,end) pairs. */
    static List<int[]> split(String text, int max) {
        List<int[]> out = new ArrayList<>();
        int n = text.length(), i = 0;
        while (i < n) {
            int end = Math.min(n, i + max);
            if (end < n) {
                int cut = -1;
                for (int k = end; k > i + max / 2; k--) {
                    char c = text.charAt(k - 1);
                    if (c == '.' || c == '!' || c == '?' || c == '\n') {
                        cut = k;
                        break;
                    }
                }
                if (cut < 0) {
                    for (int k = end; k > i + max / 2; k--) {
                        if (Character.isWhitespace(text.charAt(k - 1))) {
                            cut = k;
                            break;
                        }
                    }
                }
                if (cut > 0) end = cut;
            }
            out.add(new int[] { i, end });
            i = end;
        }
        return out;
    }

    void stop() {
        synchronized (lock) {
            gen++;
            waiting.clear();
            pieces.clear();
        }
        try {
            TextToSpeech t = tts;
            if (t != null && ready) t.stop();
        } catch (Throwable t) {
            Log.w(TAG, "stop failed: " + t);
        }
    }

    // ---------------------------------------------------------------- events back to the page

    private Piece find(String uid) {
        synchronized (lock) {
            for (Piece p : pieces) if (p.uid.equals(uid)) return p;
        }
        return null;
    }

    private void emit(String event, String id, String extra) {
        try {
            JSObject o = new JSObject();
            o.put("id", id);
            if (extra != null) o.put("error", extra);
            CyExtras.emit(event, o, false);
        } catch (Throwable t) {
            Log.w(TAG, "emit failed: " + t);
        }
    }

    private final UtteranceProgressListener listener = new UtteranceProgressListener() {
        @Override
        public void onStart(String uid) {
            try {
                Piece p = find(uid);
                if (p != null && uid.endsWith("#0")) emit("ttsStart", p.job.id, null);
            } catch (Throwable t) {
                Log.w(TAG, "onStart: " + t);
            }
        }

        @Override
        public void onDone(String uid) {
            try {
                Piece p = find(uid);
                if (p == null) return;
                boolean last;
                synchronized (lock) {
                    p.job.remaining--;
                    last = p.job.remaining <= 0;
                    pieces.remove(p);
                }
                if (last) emit("ttsEnd", p.job.id, null);
            } catch (Throwable t) {
                Log.w(TAG, "onDone: " + t);
            }
        }

        @Override
        public void onError(String uid) {
            onError(uid, -1);
        }

        @Override
        public void onError(String uid, int code) {
            try {
                Piece p = find(uid);
                if (p == null) return;
                synchronized (lock) {
                    p.job.remaining = 0;
                    pieces.remove(p);
                }
                emit("ttsError", p.job.id, "engine" + code);
            } catch (Throwable t) {
                Log.w(TAG, "onError: " + t);
            }
        }

        @Override
        public void onRangeStart(String uid, int start, int end, int frame) {
            try {
                Piece p = find(uid);
                if (p == null) return;
                JSObject o = new JSObject();
                o.put("id", p.job.id);
                o.put("start", p.offset + start);
                o.put("end", p.offset + end);
                CyExtras.emit("ttsBoundary", o, false);
            } catch (Throwable t) {
                Log.w(TAG, "onRangeStart: " + t);
            }
        }
    };
}
