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
import com.k2fsa.sherpa.onnx.GenerationConfig;
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
    /** Our own pre-release (voice-files.yml), so the files never change under us and nothing comes from Hugging Face. */
    // Kokoro v1.0. Full = fp32; Compact = the same model at half precision (near-identical sound). int8 was robotic and slower.
    private static final String BASE = "https://github.com/cypressreader/cypress-android/releases/download/voice-files-1/";
    private static final String[] FILES = {"tokens.txt", "lexicon-us-en.txt", "voices.bin"};
    private static final long[] SIZES = {687L, 5956885L, 28200960L};
    /** Voice size: "phone" (no download, the phone's own voice), "compact" or "full". */
    private static final String[] TIERS = {"compact", "full"};
    private static final String[] MODELS = {"model.half.onnx", "model.onnx"};
    private static final long[] MSIZES = {163421292L, 325560556L};
    // SHA-256 of each file (SIZES.txt in the release): a damaged download of the right size is thrown away
    private static final String[] SHAS = {"6ebb6bb288f20f3ae8d004d3c2ca27697da27c037d75e81a60e2a6a663f95425", "7daaab53a181be9885b853a8582bf1838186317e5dadacbcef9c426d6fa0da14", "1c5a5b983d3d50d8586d437a51f3faa2da7919ce76a013c081e65671a3447c29"};
    private static final String[] MSHAS = {"59f6e71cc7c35c4e501105bae1751b94a4c781e439d42c3af794377070bcf1d6", "b40f62b166ac8164b0627ef48a0b358eda0985e272fb03ef5252e7206305da11"};
    private static final String OFF_WIFI = "left Wi-Fi";

    private static String sha(File f) throws Exception {
        java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
        try (InputStream in = new java.io.FileInputStream(f)) {
            byte[] b = new byte[1 << 16];
            for (int n; (n = in.read(b)) > 0; ) md.update(b, 0, n);
        }
        StringBuilder sb = new StringBuilder();
        for (byte x : md.digest()) sb.append(String.format("%02x", x));
        return sb.toString();
    }
    private static final int SID = 3; // af_heart (US English, woman): the plain NEURAL_ID
    /** American voices in the same voices.bin (no extra download), best-rated first in Kokoro's own VOICES.md grades.
     *  British ones are left out: CyG2p writes American sounds. {speaker id, name}. */
    private static final String[][] VOICES = {{"3", "Heart (woman)"}, {"2", "Bella (woman)"}, {"6", "Nicole (woman, soft)"},
            {"1", "Aoede (woman)"}, {"5", "Kore (woman)"}, {"9", "Sarah (woman)"}, {"16", "Michael (man)"}, {"14", "Fenrir (man)"},
            {"18", "Puck (man)"}};

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
    private volatile CyG2p g2p;
    private volatile boolean broken = false, downloading = false, warned = false;
    private volatile String tier;
    private volatile long got = 0, need = 0; // download progress, bytes
    private AudioTrack track;
    private int trackRate = 0;

    CyNeural(Context c) {
        ctx = c.getApplicationContext();
        dir = new File(ctx.getFilesDir(), "voices/kokoro-en");
        // the test build downloaded model.onnx before sizes existed: that phone is on Full; everyone else starts on the phone's voice
        tier = prefs().getString("tier", new File(dir, MODELS[1]).length() == MSIZES[1] ? "full" : "phone");
        Thread t = new Thread(this::playLoop, "CyNeuralPlay");
        t.setDaemon(true);
        t.start();
    }

    private android.content.SharedPreferences prefs() {
        return ctx.getSharedPreferences("cy_voice", Context.MODE_PRIVATE);
    }

    /** 0 = Compact, 1 = Full, -1 = phone's voice. */
    private int ti() {
        return java.util.Arrays.asList(TIERS).indexOf(tier);
    }

    private long total(int t) {
        long n = MSIZES[t];
        for (long z : SIZES) n += z;
        return n;
    }

    @Override
    public boolean ready() {
        int t = ti();
        if (broken || t < 0) return false;
        for (int i = 0; i < FILES.length; i++) {
            File f = new File(dir, FILES[i]);
            if (!f.isFile() || f.length() != SIZES[i]) return false;
        }
        return new File(dir, MODELS[t]).length() == MSIZES[t];
    }

    @Override
    public JSObject info() {
        JSObject o = new JSObject();
        o.put("tier", tier);
        o.put("ready", ready());
        o.put("downloading", downloading);
        o.put("got", got);
        o.put("need", need);
        o.put("compact", total(0));
        o.put("full", total(1));
        return o;
    }

    /** Sets the voice size. Drops the other size's model (and every file for "phone"), then downloads on Wi-Fi. */
    @Override
    public synchronized void tier(String t) {
        if (!"phone".equals(t) && !java.util.Arrays.asList(TIERS).contains(t)) return;
        if (!t.equals(tier)) {
            tier = t;
            prefs().edit().putString("tier", t).apply();
            flush();
            synth.execute(() -> { // on the synthesis thread, so nothing is mid-sentence when the model goes
                OfflineTts o = tts;
                tts = null;
                g2p = null;
                broken = false;
                try {
                    if (o != null) o.release();
                } catch (Throwable e) {
                    Log.w(TAG, "release: " + e);
                }
                int k = ti();
                File[] fs = dir.listFiles();
                if (fs != null) for (File f : fs) {
                    String n = f.getName();
                    if (k < 0 || (n.startsWith("model") && !n.startsWith(MODELS[k]))) f.delete(); // keeps a .part of this size to resume
                }
                emitInfo();
            });
        }
        warned = false;
        if (ti() >= 0) fetch();
    }

    private void emitInfo() {
        CyExtras.emit("ttsNeural", info(), false);
    }

    @Override
    public void voice(org.json.JSONArray arr) throws Exception {
        if (ti() < 0) return; // voice size "phone": no natural voices on offer
        String st = ready() ? "" : downloading ? " · downloading" : " · downloads on Wi-Fi";
        for (String[] v : VOICES) {
            JSObject o = new JSObject();
            o.put("id", v[0].equals(String.valueOf(SID)) ? CyTts.NEURAL_ID : CyTts.NEURAL_ID + ":" + v[0]);
            o.put("name", "English (United States) · Natural " + v[1] + st);
            o.put("lang", "en-US");
            o.put("local", true);
            o.put("q", 0); // never picked by "Best available"; only when chosen by hand
            arr.put(o);
        }
    }

    /** Starts the one-time download on an unmetered network. Returns at once. */
    @Override
    public void fetch() {
        final int tk = ti();
        if (broken || downloading || tk < 0 || ready()) return;
        boolean metered = true;
        try {
            ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
            metered = cm == null || cm.isActiveNetworkMetered();
        } catch (Throwable t) {
            // assume metered
        }
        if (metered) {
            if (!warned) toast("The natural voice downloads on Wi-Fi only. Using the phone’s voice for now.");
            emitInfo();
            warned = true; // once per app run, not once per paragraph
            return;
        }
        downloading = true;
        need = total(tk);
        got = 0;
        toast("Downloading the natural voice (" + need / 1000000 + " MB). Using the phone’s voice until it’s ready.");
        emitInfo();
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
                new File(dir, "model.int8.onnx").delete(); // the first test's smaller model, no longer used
                new File(dir, "model.int8.onnx.part").delete();
                for (int i = 0; i <= FILES.length; i++) {
                    String name = i < FILES.length ? FILES[i] : MODELS[tk];
                    long size = i < FILES.length ? SIZES[i] : MSIZES[tk];
                    File f = new File(dir, name);
                    if (f.isFile() && f.length() == size) {
                        got += size;
                        continue;
                    }
                    File part = new File(dir, name + ".part");
                    long base = got;
                    for (int tries = 0; ; tries++) {
                        try {
                            get(name, part, size, base, tk);
                            break;
                        } catch (Throwable e) {
                            Log.w(TAG, name + " try " + tries + ": " + e);
                            if (tries >= 5 || ti() != tk || OFF_WIFI.equals(e.getMessage())) throw e;
                            Thread.sleep(2000L << tries); // 2, 4, 8, 16, 32 s; the .part file is kept and resumed
                        }
                    }
                    if (!sha(part).equals(i < FILES.length ? SHAS[i] : MSHAS[tk])) {
                        part.delete();
                        throw new Exception(name + " arrived damaged");
                    }
                    if (!part.renameTo(f)) throw new Exception("could not save " + name);
                    got = base + size;
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
            emitInfo();
            if (ti() != tk) { // the size changed (or Delete) while downloading: say nothing, fetch the new size
                if (ti() >= 0) fetch();
                return;
            }
            toast(err == null ? "The natural voice is ready. It is used from the next story you play."
                     : "The natural voice didn’t download (" + (err.length() > 90 ? err.substring(0, 90) : err) + "). Choose it again on Wi-Fi to continue where it stopped.");
        }, "CyNeuralGet").start();
    }

    /** Downloads one file into part, continuing from what part already holds. */
    private void get(String name, File part, long size, long base, int t) throws Exception {
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
                long last = 0;
                for (int n; (n = in.read(buf)) > 0; ) {
                    if (ti() != t) throw new Exception("size changed");
                    out.write(buf, 0, n);
                    long now = System.currentTimeMillis();
                    if (now - last > 700) { // progress for Settings, a few times a second at most
                        last = now;
                        ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
                        if (cm != null && cm.isActiveNetworkMetered()) throw new Exception(OFF_WIFI); // the part file is kept and resumed on Wi-Fi
                        got = base + part.length();
                        emitInfo();
                    }
                }
            }
        } finally {
            c.disconnect();
        }
        if (part.length() != size) throw new Exception(name + " stopped at " + part.length() / 1048576 + " of " + size / 1048576 + " MB");
    }

    private OfflineTts engine() throws Exception {
        OfflineTts t = tts;
        if (t != null) return t;
        long t0 = System.currentTimeMillis();
        OfflineTtsKokoroModelConfig k = new OfflineTtsKokoroModelConfig();
        k.setModel(new File(dir, MODELS[Math.max(0, ti())]).getPath());
        k.setVoices(new File(dir, "voices.bin").getPath());
        k.setTokens(new File(dir, "tokens.txt").getPath());
        // no lexicon for sherpa: CyG2p turns text into phonemes itself, so unknown words are never skipped
        CyG2p g = new CyG2p(new File(dir, "lexicon-us-en.txt"));
        try (java.io.InputStream in = ctx.getAssets().open("cmu-extra.txt")) {
            g.addMissing(in); // 76k names and rarer words from the CMU Pronouncing Dictionary (BSD-style, see CMUDICT-LICENSE.txt)
        } catch (Throwable e) {
            Log.w(TAG, "cmu-extra: " + e);
        }
        try (java.io.InputStream in = ctx.getAssets().open("misaki-het.txt")) {
            g.addHet(in); // ~690 same-spelling words (record, increase, ...): verb and noun sounds
        } catch (Throwable e) {
            Log.w(TAG, "misaki-het: " + e);
        }
        try (java.io.InputStream in = ctx.getAssets().open("en-pos.bin")) {
            g.setTagger(in); // grammar: verb or noun, past or present ("they read it yesterday")
        } catch (Throwable e) {
            Log.w(TAG, "en-pos: " + e);
        }
        try (java.io.InputStream in = ctx.getAssets().open("g2p-en.bin")) {
            g.setNet(in); // names and new words no list knows
        } catch (Throwable e) {
            Log.w(TAG, "g2p-en: " + e);
        }
        g2p = g;
        OfflineTtsModelConfig m = new OfflineTtsModelConfig();
        m.setKokoro(k);
        m.setNumThreads(Math.max(1, Math.min(4, Runtime.getRuntime().availableProcessors() / 2)));
        m.setProvider("cpu");
        OfflineTtsConfig cfg = new OfflineTtsConfig();
        cfg.setModel(m);
        cfg.setSilenceScale(1f); // the default 0.2 shortens the voice's own pauses
        t = new OfflineTts(null, cfg);
        Log.i(TAG, "model loaded in " + (System.currentTimeMillis() - t0) + " ms, rate " + t.sampleRate());
        tts = t;
        return t;
    }

    @Override
    public void speak(String id, String voice, String text, float rate0, float pitch, float volume, int pauseMs, boolean add) {
        // Section rhythm. The page marks sections by pitch (a neural voice can't change pitch): headline 1.08 with speed x1.06,
        // subhead 1.05 with x1.03, a quote without its own voice 1.18. Here a headline is read a little slower and weightier,
        // a subhead a touch slower, a quote a touch slower too, so they stand apart from the body.
        final float rate = pitch >= 1.15f ? rate0 * 0.97f : pitch >= 1.07f ? rate0 / 1.06f * 0.92f : pitch >= 1.04f ? rate0 / 1.03f * 0.96f : rate0;
        if (!add) flush();
        final int g = gen;
        int sid = SID;
        try {
            int c = voice == null ? -1 : voice.lastIndexOf(':');
            if (c > CyTts.NEURAL_ID.length() - 1) sid = Integer.parseInt(voice.substring(c + 1));
        } catch (Throwable e) {
            // keep Heart
        }
        final int speaker = sid;
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
                List<int[]> spans = sentences(body); // whole sentences: a cut mid-sentence ends with a falling voice
                for (int i = 0; i < spans.size(); i++) {
                    if (g != gen) return;
                    int[] sp = spans.get(i);
                    long t0 = System.currentTimeMillis();
                    String piece = body.substring(sp[0], sp[1]);
                    String ph = g2p.phonemes(piece);
                    float[] s = new float[0];
                    int sr = 24000;
                    if (!ph.isEmpty()) { // nothing speakable (only symbols): an empty clip still keeps start/end events in order
                        GenerationConfig gc = new GenerationConfig();
                        gc.setSid(speaker);
                        gc.setSpeed(rate);
                        gc.setSilenceScale(1f);
                        gc.setPhonemeCodepoints(new int[][]{ph.codePoints().toArray()});
                        GeneratedAudio a = t.generateWithConfig(piece, gc);
                        sr = a.getSampleRate();
                        s = trim(a.getSamples(), sr, piece, rate, true); // each piece is one sentence: it always needs its breath (the page adds more between paragraphs)
                    }
                    Log.i(TAG, "clip " + i + ": " + (System.currentTimeMillis() - t0) + " ms for " + (s.length * 1000L / sr) + " ms of audio");
                    if (!put(new Clip(g, id, s, sr, lead + sp[0], lead + sp[1],
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

    private static final java.util.regex.Pattern END = java.util.regex.Pattern.compile("[.!?…]+[\"'”’)\\]]*(?=\\s)");
    private static final java.util.Set<String> ABBR = new java.util.HashSet<>(java.util.Arrays.asList(
            "mr", "mrs", "ms", "dr", "st", "jr", "sr", "vs", "no", "gov", "sen", "rep", "gen", "lt", "col", "sgt", "prof", "inc", "co",
            "jan", "feb", "mar", "apr", "aug", "sept", "sep", "oct", "nov", "dec", "mt", "ft"));

    /** [start,end) of each sentence; one longer than 380 characters is cut at its last comma/semicolon, else a space. */
    static List<int[]> sentences(String t) {
        List<int[]> out = new java.util.ArrayList<>();
        java.util.regex.Matcher m = END.matcher(t);
        int from = 0;
        while (m.find()) {
            int ws = m.start();
            while (ws > from && Character.isLetter(t.charAt(ws - 1))) ws--;
            String w = t.substring(ws, m.start()).toLowerCase(java.util.Locale.ROOT);
            if (t.charAt(m.start()) == '.' && (ABBR.contains(w) || w.length() == 1)) continue; // Dr. Smith, J. Smith, U.S.
            add(out, t, from, m.end());
            from = m.end();
        }
        add(out, t, from, t.length());
        return out;
    }

    private static void add(List<int[]> out, String t, int a, int b) {
        while (a < b && Character.isWhitespace(t.charAt(a))) a++;
        while (b - a > 380) {
            int cut = -1;
            for (int k = a + 380; k > a + 120 && cut < 0; k--) if (",;:".indexOf(t.charAt(k - 1)) >= 0) cut = k;
            for (int k = a + 380; k > a + 120 && cut < 0; k--) if (t.charAt(k - 1) == ' ') cut = k;
            if (cut < 0) cut = a + 380;
            out.add(new int[]{a, cut});
            a = cut;
            while (a < b && Character.isWhitespace(t.charAt(a))) a++;
        }
        if (b > a) out.add(new int[]{a, b});
    }

    /**
     * Even breaths: the voice leaves uneven silence at both ends of each sentence. Cut it (keeping 40 ms so soft endings
     * like "s" stay whole) and add a pause that fits how the sentence ends: a full stop gets a breath, a cut
     * mid-sentence (very long sentence) almost none.
     */
    static float[] trim(float[] s, int sr, String text, float rate, boolean gapAfter) {
        final float thr = 0.004f;
        int a = 0, b = s.length;
        while (a < b && Math.abs(s[a]) < thr) a++;
        while (b > a && Math.abs(s[b - 1]) < thr) b--;
        if (a >= b) return s;
        int keep = sr / 25;
        a = Math.max(0, a - keep);
        b = Math.min(s.length, b + keep);
        String t = text.trim().replaceAll("[\"'”’)\\]]+$", "");
        char e = t.isEmpty() ? '.' : t.charAt(t.length() - 1);
        int ms = e == '?' || e == '!' ? 380 : e == '.' ? 330 : e == '…' ? 480 : ",;:".indexOf(e) >= 0 ? 160 : 60;
        int gap = !gapAfter ? sr / 20 : (int) (sr * ms / 1000L / Math.max(0.7f, Math.min(2f, rate)));
        float[] out = new float[b - a + gap]; // the tail of zeros is the pause
        System.arraycopy(s, a, out, 0, b - a);
        return out;
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
                Clip c = clips.poll(50, TimeUnit.MILLISECONDS);
                if (c == null) {
                    AudioTrack t0 = track;
                    if (t0 != null) checkMark(t0); // a short last sentence may not have been reached during its write
                    continue;
                }
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
                if (c.pauseMs > 0) write(tr, new float[c.rate * c.pauseMs / 1000], c.g);
                // tell the page when this sentence is HEARD, not when it is handed to the speaker: the page keeps its place
                // (pause/resume, time left) from these reports
                final Clip cc = c;
                setMark(tr, written, () -> {
                    if (cc.g != gen) return;
                    if (cc.first) CyTts.emitEvent("ttsStart", cc.id, null);
                    if (cc.end > cc.start) CyTts.emitRange(cc.id, cc.start, cc.end); // sentence highlight (no word timings)
                });
                write(tr, c.pcm, c.g);
                if (c.last && c.g == gen) {
                    // wait until the sound has actually played before telling the page this text is done
                    long frames = tr.getPlaybackHeadPosition() & 0xffffffffL;
                    long need = written;
                    while (c.g == gen && frames < need) {
                        checkMark(tr);
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

    private long markAt = -1;
    private Runnable markRun;

    /** Runs r once the speaker has played up to frame at (an earlier mark still waiting runs now). Play thread only. */
    private void setMark(AudioTrack tr, long at, Runnable r) {
        if (markRun != null) markRun.run();
        markAt = at;
        markRun = r;
        checkMark(tr);
    }

    private void checkMark(AudioTrack tr) {
        if (markRun == null) return;
        long head;
        try {
            head = tr.getPlaybackHeadPosition() & 0xffffffffL;
        } catch (Throwable t) {
            head = Long.MAX_VALUE;
        }
        if (head < markAt) return;
        Runnable r = markRun;
        markRun = null;
        r.run();
    }

    /** Frames written since the last flush (flush resets the play head to zero). */
    private volatile long written = 0;

    private void write(AudioTrack tr, float[] pcm, int g) {
        for (int o = 0; o < pcm.length && g == gen; ) {
            int n = tr.write(pcm, o, Math.min(4096, pcm.length - o), AudioTrack.WRITE_BLOCKING);
            if (n <= 0) break;
            o += n;
            written += n;
            checkMark(tr);
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
