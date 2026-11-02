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
final class CyG2p {
    private final HashMap<String, String> lex = new HashMap<>(240000);

    CyG2p(File lexicon) throws Exception {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(lexicon), StandardCharsets.UTF_8), 1 << 16)) {
            for (String l; (l = r.readLine()) != null; ) {
                int sp = l.indexOf(' ');
                if (sp <= 0) continue;
                String k = l.substring(0, sp).toLowerCase(Locale.ROOT);
                if (!lex.containsKey(k)) lex.put(k, l.substring(sp + 1).replace(" ", ""));
            }
        }
    }

    // ------------------------------------------------------------------ text clean-up

    private static final Pattern NUM = Pattern.compile("(\\$)?(\\d{1,3}(?:,\\d{3})+|\\d+)(\\.\\d+)?(st|nd|rd|th|s)?(%)?");
    private static final Pattern TOK = Pattern.compile("[A-Za-z']+(?:-[A-Za-z']+)*|[,.!?;:]");
    private static final Pattern DOTS = Pattern.compile("(?<![A-Za-z])((?:[A-Z]\\.){2,})");

    static String clean(String t) {
        t = Normalizer.normalize(t, Normalizer.Form.NFKD).replaceAll("\\p{M}+", ""); // café -> cafe
        t = t.replace('’', '\'').replace('‘', '\'').replace('ʼ', '\'');
        Matcher d = DOTS.matcher(t); // U.S. -> US (spelled out below), so the dots are not read as sentence ends
        StringBuffer db = new StringBuffer();
        while (d.find()) d.appendReplacement(db, d.group(1).replace(".", ""));
        d.appendTail(db);
        t = db.toString();
        t = t.replace("&", " and ").replace("+", " plus ").replace("@", " at ").replace("…", ".");
        t = t.replaceAll("\\s*[—–]\\s*|\\s+-+\\s+", ", ");
        StringBuffer sb = new StringBuffer();
        Matcher m = NUM.matcher(t);
        while (m.find()) m.appendReplacement(sb, Matcher.quoteReplacement(" " + numWords(m) + " "));
        m.appendTail(sb);
        return sb.toString();
    }

    private static final String[] ONES = {"zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
            "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"};
    private static final String[] TENS = {"", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"};

    static String under1000(int n) {
        StringBuilder b = new StringBuilder();
        if (n >= 100) {
            b.append(ONES[n / 100]).append(" hundred");
            n %= 100;
            if (n == 0) return b.toString();
            b.append(' ');
        }
        if (n < 20) return b.append(ONES[n]).toString();
        b.append(TENS[n / 10]);
        if (n % 10 != 0) b.append(' ').append(ONES[n % 10]);
        return b.toString();
    }

    static String cardinal(long n) {
        if (n < 1000) return under1000((int) n);
        String[] big = {"", " thousand", " million", " billion", " trillion"};
        StringBuilder b = new StringBuilder();
        int g = 0;
        while (n > 0 && g < big.length) {
            int part = (int) (n % 1000);
            if (part != 0) b.insert(0, under1000(part) + big[g] + (b.length() > 0 ? " " : ""));
            n /= 1000;
            g++;
        }
        return b.toString();
    }

    static String year(int y) {
        if (y % 1000 < 10 && y % 1000 != 0 || y == 2000) return cardinal(y); // 2000, 2005
        int hi = y / 100, lo = y % 100;
        return under1000(hi) + (lo == 0 ? " hundred" : lo < 10 ? " oh " + ONES[lo] : " " + under1000(lo));
    }

    static String ordinal(String w) {
        int sp = w.lastIndexOf(' ');
        String head = w.substring(0, sp + 1), last = w.substring(sp + 1);
        switch (last) {
            case "one": return head + "first";
            case "two": return head + "second";
            case "three": return head + "third";
            case "five": return head + "fifth";
            case "eight": return head + "eighth";
            case "nine": return head + "ninth";
            case "twelve": return head + "twelfth";
            default: return head + (last.endsWith("y") ? last.substring(0, last.length() - 1) + "ieth" : last + "th");
        }
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
        if (caps && w.length() <= 5 && w.indexOf('-') < 0 && (p == null || w.equals("us"))) { // CEO, FBI, US spelled out
            StringBuilder b = new StringBuilder();
            for (char c : w.toCharArray()) {
                String l = lex.get(String.valueOf(c));
                if (l != null) b.append(l);
            }
            if (b.length() > 0) return b.toString();
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
        return guess(w.replace("'", ""));
    }

    /** One clip of text -> the phoneme string Kokoro reads. */
    String phonemes(String text) {
        String t = clean(text);
        StringBuilder out = new StringBuilder();
        Matcher m = TOK.matcher(t);
        java.util.ArrayList<String> ph = new java.util.ArrayList<>();
        java.util.ArrayList<String> low = new java.util.ArrayList<>();
        while (m.find()) {
            String tok = m.group();
            if (",.!?;:".indexOf(tok.charAt(0)) >= 0) {
                ph.add(tok);
                low.add(tok);
                continue;
            }
            boolean caps = tok.length() > 1 && tok.equals(tok.toUpperCase(Locale.ROOT)) && !tok.equals(tok.toLowerCase(Locale.ROOT));
            String lw = tok.toLowerCase(Locale.ROOT);
            ph.add(word(lw, caps));
            low.add(lw);
        }
        for (int i = 0; i < ph.size(); i++) {
            String next = i + 1 < ph.size() ? ph.get(i + 1) : "";
            boolean nv = vowelStart(next);
            switch (low.get(i)) { // weak forms, the way Kokoro was trained (misaki)
                case "a": ph.set(i, "ɐ"); break;
                case "an": ph.set(i, "ən"); break;
                case "the": ph.set(i, nv ? "ði" : "ðə"); break;
                case "to": ph.set(i, nv ? "tʊ" : "tə"); break;
                default: break;
            }
            String p = ph.get(i);
            if (p.isEmpty()) continue;
            if (",.!?;:".indexOf(p.charAt(0)) >= 0 && p.length() == 1) {
                int e = out.length();
                while (e > 0 && out.charAt(e - 1) == ' ') e--;
                out.setLength(e);
                out.append(p).append(' ');
            } else {
                out.append(p).append(' ');
            }
        }
        return out.toString().trim();
    }
}
