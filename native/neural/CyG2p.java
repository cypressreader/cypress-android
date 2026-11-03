package com.cypress.reader;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * SPIKE: English text -> Kokoro phonemes, so no word is ever skipped. sherpa-onnx 2.0 drops every word that is not
 * in the lexicon, and the lexicon holds mostly base forms ("minute", not "minutes"). Order per word: lexicon, then
 * plural / past / -ing / possessive rules built on the stem (as Kokoro's own misaki does), then hyphen parts, then
 * spelled-out initialisms, then a rough guess from known pieces. Numbers become words first. Pure Java, no GPL code.
 */
final class CyG2p extends CyText {
    private final HashMap<String, String> lex = new HashMap<>(240000);

    CyG2p(File lexicon) throws Exception {
        try (java.io.InputStream in = new FileInputStream(lexicon)) {
            addMissing(in);
        }
        lex.put("ayem", "ˌAˈɛm"); // "a.m." (clean() writes this; the list only has "pm")
        lex.put("memphis", "mˈɛmfəs");
        lex.put("august", "ˈɔɡəst"); // the month (the list has the rare adjective, aw-GUST)
        lex.put("affect", "əfˈɛkt"); // "prices affect people" (the list has the psychology noun)
        lex.put("affects", "əfˈɛkts"); // the voice's list has an extra p (mˈɛmpfəs); CMU and locals say it without
    }

    /** Adds words not already known. The voice's own list loads first, so it always wins (it matches how Kokoro was trained). */
    void addMissing(java.io.InputStream in) throws Exception {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8), 1 << 16)) {
            for (String l; (l = r.readLine()) != null; ) {
                int sp = l.indexOf(' ');
                if (sp <= 0) continue;
                String k = l.substring(0, sp).toLowerCase(Locale.ROOT);
                if (!lex.containsKey(k)) lex.put(k, l.substring(sp + 1).replace(" ", ""));
            }
        }
    }

    /** Same-spelling words from misaki's us_gold.json (Apache-2.0): word, then TAG=sound (VERB, NOUN, ADJ, ADV, VBD, VBN, VBP). */
    void addHet(java.io.InputStream in) throws Exception {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            for (String l; (l = r.readLine()) != null; ) {
                String[] f = l.split("\t");
                if (f.length < 2) continue;
                HashMap<String, String> e = new HashMap<>(4);
                for (int k = 1; k < f.length; k++) {
                    int q = f[k].indexOf('=');
                    if (q > 0) e.put(f[k].substring(0, q), f[k].substring(q + 1));
                }
                TAGS.put(f[0], e);
                if (!HET.containsKey(f[0]) && (e.containsKey("VERB") || e.containsKey("NOUN")))
                    HET.put(f[0], new String[]{e.get("VERB"), e.get("NOUN")}); // the word-before rules, if the tagger is missing
            }
        }
    }

    private static final HashMap<String, HashMap<String, String>> TAGS = new HashMap<>();
    private opennlp.tools.postag.POSTaggerME tagger;

    /** Grammar tagger (OpenNLP, Apache-2.0) with a model trained on UD English EWT (CC BY-SA 4.0), Penn tags. */
    void setTagger(java.io.InputStream in) throws Exception {
        tagger = new opennlp.tools.postag.POSTaggerME(new opennlp.tools.postag.POSModel(in),
                opennlp.tools.postag.POSTagFormat.CUSTOM);
    }

    private Net net;

    /** g2p_en's model (Apache-2.0, trained on CMUdict) for words in neither list: mostly names. */
    void setNet(java.io.InputStream in) throws Exception {
        net = new Net(in);
    }

    // ------------------------------------------------------------------ text clean-up

    private static final Pattern NUM = Pattern.compile("(\\$)?(\\d{1,3}(?:,\\d{3})+|\\d+)(\\.\\d+)?(st|nd|rd|th|s)?(%)?");
    private static final Pattern TOK = Pattern.compile("[A-Za-z']+(?:-[A-Za-z']+)*|[,.!?;:—…()“”]");
    /** Punctuation the voice was trained with (misaki passes these through); closers attach to the word before. */
    private static final String PUNCT = ",.!?;:—…()“”", OPEN = "(“";
    private static final Pattern DOTS = Pattern.compile("(?<![A-Za-z])((?:[A-Z]\\.){2,})");

    static String clean(String t) {
        t = Normalizer.normalize(t, Normalizer.Form.NFKD).replaceAll("\\p{M}+", ""); // café -> cafe
        t = t.replace('’', '\'').replace('‘', '\'').replace('ʼ', '\'');
        t = WIRE.matcher(t).replaceAll(" "); // wire-service tags in datelines are not read
        t = INITIAL.matcher(t).replaceAll("$1"); // "Debra M. Brown": the dot after an initial is not a full stop
        t = times(t);
        t = places(t);
        t = expand(t);
        t = t.replaceAll("(?<=\\w)\\.js\\b", " J S").replaceAll("(?<![\\w.])\\.NET\\b", "dot net"); // Node.js, .NET
        Matcher d = DOTS.matcher(t); // U.S. -> US (spelled out below), so the dots are not read as sentence ends
        StringBuffer db = new StringBuffer();
        while (d.find()) d.appendReplacement(db, d.group(1).replace(".", ""));
        d.appendTail(db);
        t = db.toString();
        t = t.replace("&", " and ").replace("+", " plus ").replace("@", " at ").replace("...", "…");
        t = t.replaceAll("\\s*[—–]\\s*|\\s+-+\\s+|(?<=[a-z])--(?=[a-z])", "— "); // the voice has its own dash pause
        t = t.replaceAll("(^|[\\s(\\[—])\"", "$1“").replace('"', '”').replace('[', '(').replace(']', ')');
        StringBuffer sb = new StringBuffer();
        Matcher m = NUM.matcher(t);
        while (m.find()) m.appendReplacement(sb, Matcher.quoteReplacement(" " + numWords(m) + " "));
        m.appendTail(sb);
        return sb.toString();
    }


    private static String numWords(Matcher m) {
        String digits = m.group(2), frac = m.group(3), suf = m.group(4);
        boolean money = m.group(1) != null, pct = m.group(5) != null;
        String plain = digits.replace(",", "");
        if (plain.length() > 15) return digits; // leave serial numbers alone
        long n = Long.parseLong(plain);
        String w;
        if (frac == null && !money && !pct && digits.indexOf(',') < 0 && plain.length() == 4 && n >= 1100 && n <= 2099
                && (suf == null || suf.equals("s"))) {
            w = year((int) n);
            if ("s".equals(suf)) w = w.endsWith("y") ? w.substring(0, w.length() - 1) + "ies" : w + "s"; // 1990s
            suf = null;
        } else {
            w = cardinal(n);
        }
        if (money && frac != null && frac.length() == 3) { // $4.50 -> four dollars fifty
            int c = Integer.parseInt(frac.substring(1));
            return w + (n == 1 ? " dollar" : " dollars") + (c == 0 ? "" : " " + under1000(c));
        }
        if (frac != null) {
            StringBuilder b = new StringBuilder(w).append(" point");
            for (char c : frac.substring(1).toCharArray()) b.append(' ').append(ONES[c - '0']);
            w = b.toString();
        }
        if (suf != null && !suf.equals("s")) w = ordinal(w);
        if (pct) w += " percent";
        if (money) w += n == 1 && frac == null ? " dollar" : " dollars";
        return w;
    }

    // ------------------------------------------------------------------ words

    private static boolean stress(char c) {
        return c == 'ˈ' || c == 'ˌ' || c == 'ː';
    }

    private static char last(String ph) {
        for (int i = ph.length() - 1; i >= 0; i--) if (!stress(ph.charAt(i))) return ph.charAt(i);
        return 0;
    }

    private static String plural(String ph) {
        char c = last(ph);
        if ("ptkfθ".indexOf(c) >= 0) return ph + "s";
        if ("szʃʒʧʤ".indexOf(c) >= 0) return ph + "ᵻz";
        return ph + "z";
    }

    private static String past(String ph) {
        char c = last(ph);
        if ("pkfθʃsʧ".indexOf(c) >= 0) return ph + "t";
        if (c == 'd' || c == 't') return ph + "ᵻd";
        return ph + "d";
    }

    private String inflected(String w) {
        int n = w.length();
        if (n < 4) return null;
        String p;
        if (w.endsWith("'s") && (p = lex.get(w.substring(0, n - 2))) != null) return plural(p);
        if (w.endsWith("s'") && (p = lex.get(w.substring(0, n - 1))) != null) return p;
        if (w.endsWith("ies") && (p = lex.get(w.substring(0, n - 3) + "y")) != null) return plural(p);
        if (w.endsWith("s") && !w.endsWith("ss")) {
            if ((p = lex.get(w.substring(0, n - 1))) != null) return plural(p);
            if (w.endsWith("es") && (p = lex.get(w.substring(0, n - 2))) != null) return plural(p);
        }
        if (w.endsWith("ied") && (p = lex.get(w.substring(0, n - 3) + "y")) != null) return past(p);
        if (w.endsWith("ed")) {
            if ((p = lex.get(w.substring(0, n - 1))) != null) return past(p);
            if ((p = lex.get(w.substring(0, n - 2))) != null) return past(p);
            if (w.charAt(n - 3) == w.charAt(n - 4) && (p = lex.get(w.substring(0, n - 3))) != null) return past(p);
        }
        if (w.endsWith("ing") && n > 4) {
            String s = w.substring(0, n - 3);
            if ((p = lex.get(s)) != null || (p = lex.get(s + "e")) != null) return p + "ɪŋ";
            if (n > 5 && w.charAt(n - 4) == w.charAt(n - 5) && (p = lex.get(w.substring(0, n - 4))) != null) return p + "ɪŋ";
        }
        if (w.endsWith("ly") && (p = lex.get(w.substring(0, n - 2))) != null) return p + "li";
        return null;
    }

    private static final HashMap<String, String> DIGRAPH = new HashMap<>();
    static {
        String[] d = {"ph", "f", "sh", "ʃ", "ch", "ʧ", "th", "θ", "ck", "k", "ng", "ŋ", "qu", "kw", "ee", "i", "ea", "i", "oo", "u",
                "ou", "W", "ow", "O", "ai", "A", "ay", "A", "ei", "A", "ey", "A", "oi", "Y", "oy", "Y", "au", "ɔ", "aw", "ɔ", "ie", "i",
                "ar", "ɑɹ", "er", "əɹ", "ir", "ɜɹ", "ur", "ɜɹ", "or", "ɔɹ", "ll", "l", "ss", "s", "tt", "t", "nn", "n", "mm", "m", "rr", "ɹ"};
        for (int i = 0; i < d.length; i += 2) DIGRAPH.put(d[i], d[i + 1]);
    }

    private static final String VOWELS = "AIOQWYaeiouæɐɑɒɔəɘɚɛɜɪʊʌᵻ";

    private static boolean vowelStart(String ph) {
        for (int i = 0; i < ph.length(); i++) {
            char c = ph.charAt(i);
            if (!stress(c)) return VOWELS.indexOf(c) >= 0;
        }
        return false;
    }

    private static final String[] LETTER = {"æ", "b", "k", "d", "ɛ", "f", "ɡ", "h", "ɪ", "ʤ", "k", "l", "m", "n", "ɑ", "p", "k", "ɹ",
            "s", "t", "ʌ", "v", "w", "ks", "j", "z"};

    /** A rough reading for a word nothing else knows (mostly names): longest known pieces, letters in between. */
    private String guess(String w) {
        StringBuilder b = new StringBuilder("ˈ");
        int i = 0, n = w.length();
        while (i < n) {
            int best = -1;
            String bp = null;
            for (int j = n; j >= i + 3; j--) {
                String p = lex.get(w.substring(i, j));
                if (p != null) {
                    best = j;
                    bp = p;
                    break;
                }
            }
            if (bp != null) {
                for (char c : bp.toCharArray()) if (!stress(c)) b.append(c);
                i = best;
            } else {
                String two = i + 2 <= n ? w.substring(i, i + 2) : "";
                String d = DIGRAPH.get(two);
                if (d != null) {
                    b.append(d);
                    i += 2;
                    continue;
                }
                char c = w.charAt(i++);
                boolean end = i == n;
                if (end && c == 'a') b.append("ə");                         // Debra, Priya
                else if (end && c == 'y' && n > 2) b.append("i");             // Kelly
                else if (end && c == 'e' && n > 3 && "aeiou".indexOf(w.charAt(n - 2)) < 0) { /* silent e */ }
                else if (c >= 'a' && c <= 'z') b.append(LETTER[c - 'a']);
            }
        }
        return b.toString();
    }

    String word(String raw, boolean caps) {
        String w = raw.replaceAll("^'+|'+$", "");
        if (w.isEmpty()) return "";
        String p = lex.get(w);
        if (caps && w.length() <= 5 && w.indexOf('-') < 0 && (p == null || SPELL.contains(w))) { // CEO, FBI, US spelled out
            String b = spell(w, "");
            if (!b.isEmpty()) return b;
        }
        if (p != null) return p;
        if ((p = inflected(w)) != null) return p;
        if (w.indexOf('-') > 0) {
            StringBuilder b = new StringBuilder();
            for (String part : w.split("-")) {
                if (part.isEmpty()) continue;
                if (b.length() > 0) b.append(' ');
                b.append(word(part, false));
            }
            return b.toString();
        }
        String bare = w.replace("'", "");
        if (net != null && bare.length() > 1) {
            try {
                String n = net.phonemes(bare);
                if (!n.isEmpty()) return n;
            } catch (Throwable e) {
                // fall through to the rough guess
            }
        }
        return guess(bare);
    }

    /**
     * g2p_en (Kyubyong Park, Apache-2.0): a GRU encoder-decoder trained on CMUdict, ported from its numpy code. Weights are
     * g2p-en.bin: float32 little-endian, the 12 arrays of checkpoint20.npz in order. Output ARPAbet becomes Kokoro symbols.
     */
    static final class Net {
        private static final String[] PH = {"<pad>", "<unk>", "<s>", "</s>", "AA0", "AA1", "AA2", "AE0", "AE1", "AE2", "AH0", "AH1",
                "AH2", "AO0", "AO1", "AO2", "AW0", "AW1", "AW2", "AY0", "AY1", "AY2", "B", "CH", "D", "DH", "EH0", "EH1", "EH2", "ER0",
                "ER1", "ER2", "EY0", "EY1", "EY2", "F", "G", "HH", "IH0", "IH1", "IH2", "IY0", "IY1", "IY2", "JH", "K", "L", "M", "N",
                "NG", "OW0", "OW1", "OW2", "OY0", "OY1", "OY2", "P", "R", "S", "SH", "T", "TH", "UH0", "UH1", "UH2", "UW", "UW0",
                "UW1", "UW2", "V", "W", "Y", "Z", "ZH"};
        private static final int H = 256;
        private final float[] encEmb, encWih, encWhh, encBih, encBhh, decEmb, decWih, decWhh, decBih, decBhh, fcW, fcB;

        Net(java.io.InputStream in) throws Exception {
            java.io.DataInputStream d = new java.io.DataInputStream(new java.io.BufferedInputStream(in, 1 << 16));
            encEmb = read(d, 29 * H); encWih = read(d, 3 * H * H); encWhh = read(d, 3 * H * H); encBih = read(d, 3 * H);
            encBhh = read(d, 3 * H); decEmb = read(d, 74 * H); decWih = read(d, 3 * H * H); decWhh = read(d, 3 * H * H);
            decBih = read(d, 3 * H); decBhh = read(d, 3 * H); fcW = read(d, 74 * H); fcB = read(d, 74);
        }

        private static float[] read(java.io.DataInputStream d, int n) throws Exception {
            byte[] b = new byte[n * 4];
            d.readFully(b);
            float[] f = new float[n];
            java.nio.ByteBuffer.wrap(b).order(java.nio.ByteOrder.LITTLE_ENDIAN).asFloatBuffer().get(f);
            return f;
        }

        private static void cell(float[] x, int xo, float[] h, float[] wih, float[] whh, float[] bih, float[] bhh) {
            float[] gi = new float[3 * H], gh = new float[3 * H];
            for (int r = 0; r < 3 * H; r++) {
                float a = bih[r], b = bhh[r];
                int o = r * H;
                for (int k = 0; k < H; k++) {
                    a += wih[o + k] * x[xo + k];
                    b += whh[o + k] * h[k];
                }
                gi[r] = a;
                gh[r] = b;
            }
            for (int k = 0; k < H; k++) {
                float rr = sig(gi[k] + gh[k]), z = sig(gi[H + k] + gh[H + k]);
                float n = (float) Math.tanh(gi[2 * H + k] + rr * gh[2 * H + k]);
                h[k] = (1 - z) * n + z * h[k];
            }
        }

        private static float sig(float v) {
            return (float) (1 / (1 + Math.exp(-v)));
        }

        String[] arpabet(String w) {
            float[] h = new float[H];
            for (int i = 0; i <= w.length(); i++) {
                int c = i == w.length() ? 2 : w.charAt(i) >= 'a' && w.charAt(i) <= 'z' ? 3 + w.charAt(i) - 'a' : 1;
                cell(encEmb, c * H, h, encWih, encWhh, encBih, encBhh);
            }
            java.util.ArrayList<String> out = new java.util.ArrayList<>();
            int prev = 2;
            for (int s = 0; s < 20; s++) {
                cell(decEmb, prev * H, h, decWih, decWhh, decBih, decBhh);
                int best = 0;
                float bv = -Float.MAX_VALUE;
                for (int p = 0; p < 74; p++) {
                    float v = fcB[p];
                    for (int k = 0; k < H; k++) v += fcW[p * H + k] * h[k];
                    if (v > bv) { bv = v; best = p; }
                }
                if (best == 3) break;
                out.add(PH[best]);
                prev = best;
            }
            return out.toArray(new String[0]);
        }

        String phonemes(String w) {
            return arpa(arpabet(w));
        }
    }

    private static final HashMap<String, String> ARPA = new HashMap<>();
    static {
        String[] a = {"AA", "ɑ", "AE", "æ", "AH", "ʌ", "AO", "ɔ", "AW", "W", "AY", "I", "EH", "ɛ", "ER", "ɜɹ", "EY", "A", "IH", "ɪ",
                "IY", "i", "OW", "O", "OY", "Y", "UH", "ʊ", "UW", "u", "B", "b", "CH", "ʧ", "D", "d", "DH", "ð", "F", "f", "G", "ɡ",
                "HH", "h", "JH", "ʤ", "K", "k", "L", "l", "M", "m", "N", "n", "NG", "ŋ", "P", "p", "R", "ɹ", "S", "s", "SH", "ʃ",
                "T", "t", "TH", "θ", "V", "v", "W", "w", "Y", "j", "Z", "z", "ZH", "ʒ"};
        for (int i = 0; i < a.length; i += 2) ARPA.put(a[i], a[i + 1]);
    }

    /** ARPAbet -> Kokoro (misaki) symbols, as cmu-extra.txt was made: AH0 ə, ER0 əɹ, stress mark just before the vowel. */
    static String arpa(String[] ps) {
        StringBuilder b = new StringBuilder();
        boolean stressed = false;
        for (String p : ps) {
            char d = p.charAt(p.length() - 1);
            String base = Character.isDigit(d) ? p.substring(0, p.length() - 1) : p;
            String v = ARPA.get(base);
            if (v == null) continue;
            if (d == '0' && base.equals("AH")) v = "ə";
            else if (d == '0' && base.equals("ER")) v = "əɹ";
            if (d == '1') { b.append('ˈ'); stressed = true; }
            else if (d == '2') b.append('ˌ');
            b.append(v);
        }
        if (!stressed && b.length() > 0) b.insert(0, 'ˈ');
        return b.toString();
    }

    // Same spelling, two sounds. Forms from misaki's us_gold.json (what Kokoro was trained on); the voice's list holds the first
    // (DEFAULT) one. {word, verb form, noun form}; null = keep the list's.
    private static final HashMap<String, String[]> HET = new HashMap<>();
    private static final java.util.Set<String> VERB_PREV = new java.util.HashSet<>(java.util.Arrays.asList("will", "would", "can",
            "could", "may", "might", "must", "shall", "should", "cannot", "can't", "won't", "wouldn't", "couldn't", "shouldn't",
            "don't", "doesn't", "didn't", "i", "we", "they", "you", "who", "to"));
    private static final java.util.Set<String> NOUN_PREV = new java.util.HashSet<>(java.util.Arrays.asList("a", "an", "the", "this",
            "these", "those", "its", "their", "our", "my", "your", "his", "any", "no", "each", "every", "of", "in", "for", "with"));
    // after "to", only a verb if an object/particle follows: "to record the album", not "rose to record highs"
    private static final java.util.Set<String> AFTER_TO = new java.util.HashSet<>(java.util.Arrays.asList("the", "a", "an", "his",
            "her", "their", "its", "our", "my", "your", "this", "that", "these", "those", "it", "them", "him", "us", "me", "in", "on",
            "with", "at", "for", "from", "up", "down", "out", "off", "by", "and", "or", "than", "as", ",", ".", "!", "?", ";", ":", ""));
    private static final java.util.Set<String> READ_PAST = new java.util.HashSet<>(java.util.Arrays.asList("have", "has", "had",
            "was", "were", "been", "be", "being", "is", "are", "i've", "we've", "you've", "they've", "already", "widely"));
    private static final java.util.Set<String> METAL = new java.util.HashSet<>(java.util.Arrays.asList("poisoning", "pipe", "pipes",
            "paint", "levels", "level", "exposure", "contamination", "service", "lines", "pipelines", "bullet", "bullets"));
    private static final java.util.Set<String> FOUND = new java.util.HashSet<>(java.util.Arrays.asList("found", "detected",
            "elevated", "toxic", "contains", "contained", "containing", "traces", "remove", "removing", "replace", "replacing"));
    private static final java.util.Set<String> WOUND = new java.util.HashSet<>(java.util.Arrays.asList("up", "down", "around",
            "through", "its", "his", "her", "their", "back", "along"));
    // found in real news (2026-11-03 sweep of 172 articles): job titles, noun-before-noun, "were content", "suspects fired"
    private static final java.util.Set<String> TITLE = new java.util.HashSet<>(java.util.Arrays.asList("director", "directors",
            "professor", "professors", "editor", "dean", "justice", "producer", "member", "members", "membership", "degree", "counsel",
            "secretary", "judge", "partner", "partners", "editors", "fellow", "groups", "group"));
    private static final java.util.Set<String> NOUN_NEXT = new java.util.HashSet<>(java.util.Arrays.asList("restrictions", "controls",
            "ban", "bans", "growth", "market", "markets", "duties", "tariffs", "tariff", "license", "licence", "licenses", "sales",
            "data", "prices", "costs", "levels", "movement", "movements", "numbers", "figures", "deal", "deals", "rules", "taxes"));
    private static final java.util.Set<String> BE_PREV = new java.util.HashSet<>(java.util.Arrays.asList("is", "are", "was", "were",
            "be", "been", "seem", "seems", "seemed", "feel", "feels", "felt", "remain", "remains", "remained", "appear", "appears",
            "appeared", "perfectly", "quite", "more", "less", "very"));
    private static final java.util.Set<String> ONE_SUBJ = new java.util.HashSet<>(java.util.Arrays.asList("he", "she", "it", "who",
            "which", "that", "also", "now", "strongly", "still", "police", "one"));
    static {
        String[] h = {"live", "lˈɪv", null, "use", null, "jˈus", "close", "klˈOz", null, "record", "ɹəkˈɔɹd", null,
                "present", "pɹizˈɛnt", null, "object", "əbʤˈɛkt", null, "tear", "tˈɛɹ", null, "wind", "wˈInd", null,
                "content", null, "kˈɑntɛnt", "project", "pɹəʤˈɛkt", null, "increase", null, "ˈɪnkɹˌis", "permit", "pəɹmˈɪt", null,
                "progress", "pɹəɡɹˈɛs", null, "conduct", "kəndˈʌkt", null, "contract", "kəntɹˈækt", null, "produce", null, "pɹˈOdˌus",
                "refuse", null, "ɹˈɛfjˌus", "desert", "dəzˈɜɹt", null, "house", "hˈWz", null, "separate", "sˈɛpəɹˌAt", null,
                "estimate", null, "ˈɛstəmət", "graduate", "ɡɹˈæʤʊˌAt", null, "moderate", "mˈɑdəɹˌAt", null,
                "alternate", "ˈɔltəɹnˌAt", null, "duplicate", "dˈupləkˌAt", null, "delegate", "dˈɛləɡˌAt", null};
        for (int i = 0; i < h.length; i += 3) HET.put(h[i], new String[]{h[i + 1], h[i + 2]});
    }

    /** The context form for a same-spelling word, or null to keep the list's. Small rules, not a full grammar. */
    private static String parent(String t) {
        return t.startsWith("VB") ? "VERB" : t.startsWith("NN") ? "NOUN" : t.startsWith("JJ") ? "ADJ" : t.startsWith("RB") ? "ADV" : t;
    }

    private static String hetero(String w, String prev, String next, String tag) {
        if (w.equals("wind") || w.equals("winds")) return WOUND.contains(next) ? (w.equals("wind") ? "wˈInd" : "wˈIndz") : w.equals("wind") ? "wˈɪnd" : "wˈɪndz"; // weather unless "wind up/down/through"
        if (w.equals("content") && BE_PREV.contains(prev)) return "kəntˈɛnt"; // "they were content"
        if (w.equals("suspects") && !ONE_SUBJ.contains(prev)) return null; // "suspects fired": the list's noun
        if (w.endsWith("ate") && TITLE.contains(next)) return null; // "associate professor": the list's noun
        if (NOUN_NEXT.contains(next) && TAGS.containsKey(w)) return TAGS.get(w).get("NOUN"); // "export restrictions"
        if (tag != null && w.equals("read")) return tag.equals("VBD") || tag.equals("VBN") ? "ɹˈɛd" : null;
        if (tag != null && TAGS.containsKey(w) && !w.equals("used") && !w.equals("lead") && !w.equals("wound")) {
            HashMap<String, String> e = TAGS.get(w);
            if (w.equals("record") && prev.equals("to") && tag.startsWith("VB") && !AFTER_TO.contains(next)) tag = "NN"; // "rose to record highs"
            else if (prev.equals("to") && !w.equals("present") && !tag.startsWith("NN") && e.get("VERB") != null) return e.get("VERB"); // "refusal to deliberate"
            String p = e.get(tag);
            return p != null ? p : e.get(parent(tag)); // null: the list's usual sound
        }
        switch (w) {
            case "read": return READ_PAST.contains(prev) ? "ɹˈɛd" : null;
            case "used": return next.equals("to") ? "jˈust" : null;
            case "lead": return METAL.contains(next) || FOUND.contains(prev) ? "lˈɛd" : null; // "found lead in the pipes"
            case "wound": return WOUND.contains(next) ? "wˈWnd" : null;
            default: break;
        }
        String[] f = HET.get(w);
        if (f == null) return null;
        if (f[0] != null && VERB_PREV.contains(prev) && (!prev.equals("to") || AFTER_TO.contains(next))) return f[0];
        if (f[1] != null && NOUN_PREV.contains(prev)) return f[1];
        return null;
    }

    // "read" alone can't tell "red" from "reed"; the rest of its sentence can (David 2026-11-03: "they read the email" said "reed")
    private static final java.util.Set<String> HABIT = new java.util.HashSet<>(java.util.Arrays.asList("always", "usually", "often",
            "sometimes", "regularly", "rarely", "seldom", "typically", "generally", "daily", "nowadays"));
    private static final java.util.Set<String> SAY = new java.util.HashSet<>(java.util.Arrays.asList("say", "says", "said", "tell",
            "tells", "told", "believe", "believes", "think", "thinks", "claim", "claims", "report", "reports", "allege", "alleges"));
    private static final java.util.Set<String> SPAN = new java.util.HashSet<>(java.util.Arrays.asList("day", "week", "morning",
            "night", "month", "year", "time", "evening", "weekend"));

    private static final java.util.Set<String> NOT_FINITE = new java.util.HashSet<>(java.util.Arrays.asList("to", "will", "would",
            "can", "could", "may", "might", "must", "shall", "should", "do", "does", "did", "have", "has", "had", "be", "been", "being",
            "is", "are", "am", "was", "were", "not", "'s", "'re", "'ve", "'ll", "'d", "please", "and", "or", "“", "\"", "("));
    private static final java.util.Set<String> MODAL_NOW = new java.util.HashSet<>(java.util.Arrays.asList("will", "can", "shall",
            "must", "may", "won't", "can't"));

    /** VBD (past) or VBP (present) for "read" as a sentence's own verb: another past verb in the sentence wins, then a present
     *  one or a habit word, else past (news). "to read", "will read", "was read", "Read the story", "a good read": the tagger's call. */
    private static String readTense(java.util.List<String> low, String[] tags, int i) {
        int s = i, e = i;
        while (s > 0 && ".!?;:".indexOf(low.get(s - 1).charAt(0)) < 0) s--;
        String pv = i > 0 ? low.get(i - 1) : "";
        if (pv.matches("to|will|would|can|could|may|might|must|shall|should|cannot|do|does|did")
                || pv.endsWith("n't") && !pv.matches("(has|have|had|was|were|is|are)n't")) return "VB"; // "cannot read", "didn't read"
        if (s == i || !tags[i].startsWith("VB") || NOT_FINITE.contains(low.get(i - 1)) || low.get(i - 1).endsWith("n't")) return tags[i];
        while (e + 1 < low.size() && ".!?;:".indexOf(low.get(e + 1).charAt(0)) < 0) e++;
        for (int j = s; j < i; j++) if (low.get(j).matches("do|does|did|don't|doesn't|didn't")) return "VB"; // "Did they read it?"
        boolean past = false, now = false;
        for (int j = s; j <= e; j++) {
            String w = low.get(j), g = tags[j];
            if (j == i || g == null || SAY.contains(w)) continue; // "they say they read it" is still past
            if (HABIT.contains(w) || w.equals("every") && j < e && SPAN.contains(low.get(j + 1))) now = true;
            else if (g.equals("VBD")) past = true;
            else if (g.equals("VBZ") || g.equals("VBP") || MODAL_NOW.contains(w)) now = true;
        }
        return past || !now ? "VBD" : "VBP";
    }

    private static final Pattern CONTR = Pattern.compile("(?i)(.+?)(n't|'s|'re|'ve|'ll|'d|'m|')");

    /** Penn tag per token (the tagger's own word split: "judge's" = judge + 's), or null without a tagger. */
    private String[] tags(java.util.List<String> raw) {
        if (tagger == null || raw.isEmpty()) return null;
        try {
            java.util.ArrayList<String> tw = new java.util.ArrayList<>();
            int[] at = new int[raw.size()];
            for (int i = 0; i < raw.size(); i++) {
                String t = raw.get(i);
                if (i == 0 && t.equals("A")) t = "a"; // a capital "A" opening a sentence was tagged as a symbol
                at[i] = tw.size();
                Matcher c = CONTR.matcher(t);
                if (t.length() > 2 && c.matches()) {
                    tw.add(c.group(1));
                    tw.add(c.group(2));
                } else tw.add(t);
            }
            String[] g = tagger.tag(tw.toArray(new String[0]));
            String[] out = new String[raw.size()];
            for (int i = 0; i < out.length; i++) out[i] = g[at[i]];
            return out;
        } catch (Throwable e) {
            return null;
        }
    }


    private static final Pattern MIXED = Pattern.compile("([a-z])([A-Z]{1,4})('s)?");
    // tech words (2026-11-03 sweep of 239 tech articles): exact spelling -> sound; the voice's list has these wrong or not at all
    private static final HashMap<String, String> TECH = new HashMap<>();
    private static final java.util.Set<String> SPELL = new java.util.HashSet<>(java.util.Arrays.asList("us", "led", "fa", "vs", "ide"));
    static {
        String[] t = {"OpenAI", "ˌOpᵊn ˌAˈI", "ChatGPT", "ʧˈæt ʤˌipˌitˈi", "SpaceX", "spˈAs ˈɛks", "FaceTime", "fˈAstˌIm",
                "MagSafe", "mˈæɡsˌAf", "AirTag", "ˈɛɹtˌæɡ", "AirTags", "ˈɛɹtˌæɡz", "HomeKit", "hˈOmkˌɪt", "Bluesky", "blˈuskˌI",
                "Cloudflare", "klˈWdflˌɛɹ", "Gizmodo", "ɡɪzmˈOdO", "Xcode", "ˈɛkskˌOd", "eSIM", "ˈisˌɪm", "NVMe", "ˌɛnvˌiˌɛmˈi",
                "PCIe", "pˌisˌiˌIˈi", "JSON", "ʤˈAsᵊn", "YAML", "jˈæməl", "npm", "ˌɛnpˌiˈɛm", "nginx", "ˈɛnʤən ˈɛks",
                "PostgreSQL", "pˈOstɡɹˌɛs kjˌuˈɛl", "SQLite", "ˌɛskjˌuˈɛl lˈIt", "OAuth", "ˈOˌɔθ", "SUSE", "sˈuzə", "BIOS", "bˈIˌOs",
                "AMOLED", "ˈæmˌOlɛd", "FLAC", "flˈæk", "WebP", "wˈɛb pˈi", "TikTok", "tˈɪktˌɑk", "Tahoe", "tˈɑhO", "iMessage", "ˈImˌɛsɪʤ",
                "LEDs", "ˌɛlˌiˈdiz", "GitHub", "ɡˈɪthˌʌb", "Wi-Fi", "wˈIfˌI", "Linux", "lˈɪnəks", "Ubuntu", "ʊbˈuntu"};
        for (int i = 0; i < t.length; i += 2) TECH.put(t[i], t[i + 1]);
    }
    private static final Pattern ACRS = Pattern.compile("[A-Z]{2,5}s"); // GPUs, LLMs
    private static final Pattern CAMEL = Pattern.compile("[A-Z]+(?![a-z])|[A-Z]?[a-z]+");

    /** Letter names: "gpu" -> G P U. */
    private String spell(String w, String sep) {
        StringBuilder b = new StringBuilder();
        for (char c : w.toLowerCase(Locale.ROOT).toCharArray()) {
            String l = c == 'a' ? "ˈA" : lex.get(String.valueOf(c)); // the list has "a" unstressed
            if (l != null) b.append(b.length() > 0 ? sep : "").append(l);
        }
        return b.toString();
    }

    /** One clip of text -> the phoneme string Kokoro reads. */
    String phonemes(String text) {
        String t = clean(text);
        StringBuilder out = new StringBuilder();
        Matcher m = TOK.matcher(t);
        java.util.ArrayList<String> ph = new java.util.ArrayList<>();
        java.util.ArrayList<String> low = new java.util.ArrayList<>();
        java.util.ArrayList<String> raw = new java.util.ArrayList<>();
        while (m.find()) {
            String tok = m.group();
            raw.add(tok);
            if (PUNCT.indexOf(tok.charAt(0)) >= 0) {
                ph.add(tok);
                low.add(tok);
                continue;
            }
            boolean caps = tok.length() > 1 && tok.equals(tok.toUpperCase(Locale.ROOT)) && !tok.equals(tok.toLowerCase(Locale.ROOT));
            String lw = tok.toLowerCase(Locale.ROOT);
            Matcher mx = MIXED.matcher(tok);
            String fix = TECH.get(tok);
            if (fix != null) {
                ph.add(fix);
            } else if (mx.matches() && lex.get(lw) == null) { // xAI, xAI's: say the letters
                String b = spell(mx.group(1) + mx.group(2), " ");
                ph.add(mx.group(3) != null ? plural(b) : b);
            } else if (ACRS.matcher(tok).matches() && lex.get(lw) == null) {
                ph.add(plural(spell(tok.substring(0, tok.length() - 1), ""))); // GPUs: G P U z
            } else if (!caps && lex.get(lw) == null && tok.indexOf('\'') < 0 && !tok.startsWith("Mc") && tok.substring(1).matches(".*[A-Z].*")) {
                StringBuilder b = new StringBuilder(); // OpenAI, FreeBSD, macOS, ZDNet: the parts, capital runs spelled out
                Matcher cm = CAMEL.matcher(tok);
                while (cm.find()) {
                    String pt = cm.group();
                    String sp = pt.length() == 1 && Character.isLowerCase(pt.charAt(0)) ? spell(pt, "") // i, e
                            : pt.equals(pt.toUpperCase(Locale.ROOT)) && pt.length() <= 4 ? spell(pt, "") : word(pt.toLowerCase(Locale.ROOT), false);
                    if (!sp.isEmpty()) b.append(b.length() > 0 ? " " : "").append(sp);
                }
                ph.add(b.toString());
            } else if (ph.isEmpty() && tok.equals("A")) {
                ph.add("ˈA"); // a sentence that opens with "A" is read "ay", as newsreaders do (David 2026-11-02)
            } else if (tok.length() == 1 && Character.isUpperCase(tok.charAt(0)) && !tok.equals("I")) {
                ph.add(tok.equals("A") ? "ˈA" : lex.getOrDefault(lw, lw)); // an initial (Debra M. Brown, Plan B): the letter's name
            } else ph.add(word(lw, caps));
            low.add(lw);
        }
        String[] tags = tags(raw);
        for (int i = 0; i < ph.size(); i++) {
            String next = i + 1 < ph.size() ? ph.get(i + 1) : "";
            boolean nv = vowelStart(next);
            String het = hetero(low.get(i), i > 0 ? low.get(i - 1) : "", i + 1 < low.size() ? low.get(i + 1) : "",
                    tags == null ? null : low.get(i).equals("read") ? readTense(low, tags, i) : tags[i]);
            if (het != null) ph.set(i, het);
            switch (low.get(i)) { // weak forms, the way Kokoro was trained (misaki)
                case "a": if (i > 0 && raw.get(i).equals("a")) ph.set(i, "ɐ"); break;
                case "an": ph.set(i, "ɐn"); break;
                case "the": ph.set(i, nv ? "ði" : "ðə"); break;
                case "to": ph.set(i, nv ? "tʊ" : "tə"); break;
                default: break;
            }
            String p = ph.get(i);
            if (p.isEmpty()) continue;
            boolean punct = p.length() == 1 && PUNCT.indexOf(p.charAt(0)) >= 0;
            if (punct && OPEN.indexOf(p.charAt(0)) >= 0) {
                out.append(p); // opener sticks to the next word
            } else if (punct) {
                int e = out.length();
                while (e > 0 && out.charAt(e - 1) == ' ') e--;
                out.setLength(e);
                out.append(p).append(' ');
            } else {
                out.append(p).append(' ');
            }
        }
        // a headline or caption with no full stop: end it like a statement, not a voice left hanging
        String r = out.toString().trim();
        int e = r.length();
        while (e > 0 && "”)".indexOf(r.charAt(e - 1)) >= 0) e--;
        if (e > 0 && ".!?…".indexOf(r.charAt(e - 1)) < 0) {
            if (",;:—".indexOf(r.charAt(e - 1)) >= 0) r = r.substring(0, e - 1) + "." + r.substring(e);
            else r = r.substring(0, e) + "." + r.substring(e);
        }
        return r;
    }
}
