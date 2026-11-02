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
        try (java.io.InputStream in = new FileInputStream(lexicon)) {
            addMissing(in);
        }
        lex.put("ayem", "ˌAˈɛm"); // "a.m." (clean() writes this; the list only has "pm")
        lex.put("memphis", "mˈɛmfəs"); // the voice's list has an extra p (mˈɛmpfəs); CMU and locals say it without
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

    /** Same-spelling words from misaki's us_gold.json (Apache-2.0): word, verb form, noun form ("-" = none). */
    void addHet(java.io.InputStream in) throws Exception {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            for (String l; (l = r.readLine()) != null; ) {
                String[] f = l.split("\t");
                if (f.length != 3 || HET.containsKey(f[0])) continue; // the hand-checked table wins
                HET.put(f[0], new String[]{f[1].equals("-") ? null : f[1], f[2].equals("-") ? null : f[2]});
            }
        }
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
        t = t.replaceAll("\\((?:AP|Reuters|AFP|CNN)\\)\\s*[—–-]*\\s*", " "); // wire-service tags in datelines are not read
        t = times(t);
        t = places(t);
        t = expand(t);
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

    // ------------------------------------------------------------------ times, dates, units, titles

    private static final Pattern AMPM = Pattern.compile("\\b(\\d{1,2})(?::([0-5]\\d))?\\s?([AaPp])\\.?[Mm](?:\\.(?!\\s*$))?(?![A-Za-z])");
    private static final Pattern CLOCK = Pattern.compile("\\b(\\d{1,2}):([0-5]\\d)\\b(?![:\\d])");

    /** 9 a.m. -> nine ayem, 3:30 p.m. -> three thirty pm, 5:00 -> five o'clock, 7:05 -> seven oh five. */
    static String times(String t) {
        StringBuffer b = new StringBuffer();
        Matcher m = AMPM.matcher(t);
        while (m.find()) m.appendReplacement(b, clock(m.group(1), m.group(2), true)
                + (Character.toLowerCase(m.group(3).charAt(0)) == 'a' ? " ayem" : " pm"));
        m.appendTail(b);
        t = b.toString();
        b = new StringBuffer();
        m = CLOCK.matcher(t);
        while (m.find()) m.appendReplacement(b, Matcher.quoteReplacement(clock(m.group(1), m.group(2), false)));
        m.appendTail(b);
        return b.toString();
    }

    private static String clock(String h, String mm, boolean ampm) {
        String w = under1000(Integer.parseInt(h));
        int n = mm == null ? 0 : Integer.parseInt(mm);
        if (n == 0) return mm == null || ampm ? w : w + " o'clock";
        return w + (n < 10 ? " oh " + ONES[n] : " " + under1000(n));
    }

    private static final String MON = "January|February|March|April|May|June|July|August|September|October|November|December";
    private static final Pattern MONABBR = Pattern.compile("\\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)(?:\\.|(?=\\s+\\d{1,2}\\b))");
    private static final Pattern DAY = Pattern.compile("\\b(" + MON + ")\\s+([1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?\\b(?![\\d:])");
    private static final Pattern UNIT = Pattern.compile("\\b(\\d+(?:[.,]\\d+)*)\\s?(km|kph|mph|kg|lbs?|ft|mi|cm|mm|oz|°[FC]?)(?![A-Za-z])(?:\\.(?!\\s*$|\\s+[A-Z]))?");
    private static final Pattern TITLE = Pattern.compile("\\b(Gov|Sen|Rep|Gen|Lt|Col|Sgt|Capt|Cmdr|Adm|Prof|Supt|Mt|Ft|Jr|Sr|St|No|vs)\\.(?=\\s*(\\S)?)");
    private static final HashMap<String, String> WORDS = new HashMap<>();
    static {
        String[] w = {"Jan", "January", "Feb", "February", "Mar", "March", "Apr", "April", "Jun", "June", "Jul", "July", "Aug", "August",
                "Sep", "September", "Sept", "September", "Oct", "October", "Nov", "November", "Dec", "December",
                "km", "kilometer", "kph", "kilometers per hour", "mph", "miles per hour", "kg", "kilogram", "lb", "pound", "lbs", "pound",
                "ft", "foot", "mi", "mile", "cm", "centimeter", "mm", "millimeter", "oz", "ounce", "°", "degree", "°F", "degree Fahrenheit",
                "°C", "degree Celsius", "Gov", "Governor", "Sen", "Senator", "Rep", "Representative", "Gen", "General", "Lt", "Lieutenant",
                "Col", "Colonel", "Sgt", "Sergeant", "Capt", "Captain", "Cmdr", "Commander", "Adm", "Admiral", "Prof", "Professor",
                "Supt", "Superintendent", "Mt", "Mount", "Ft", "Fort", "Jr", "Junior", "Sr", "Senior", "vs", "versus"};
        for (int i = 0; i < w.length; i += 2) WORDS.put(w[i], w[i + 1]);
    }

    /** Jan. -> January, Nov. 2 -> November second, 5 km -> five kilometers, Gov. -> Governor, St. Louis / Main St., No. 5. */
    static String expand(String t) {
        StringBuffer b = new StringBuffer();
        Matcher m = MONABBR.matcher(t);
        while (m.find()) m.appendReplacement(b, WORDS.get(m.group(1)));
        m.appendTail(b);
        t = b.toString();
        b = new StringBuffer();
        m = DAY.matcher(t);
        while (m.find()) m.appendReplacement(b, m.group(1) + " " + ordinal(under1000(Integer.parseInt(m.group(2)))));
        m.appendTail(b);
        t = b.toString();
        b = new StringBuffer();
        m = UNIT.matcher(t);
        while (m.find()) {
            String u = WORDS.get(m.group(2)), one = m.group(1);
            if (!one.equals("1")) u = u.startsWith("foot") ? "feet" : u.contains(" per ") ? u : u.replaceFirst("^(\\S+)", "$1s");
            m.appendReplacement(b, Matcher.quoteReplacement(one + " " + u));
        }
        m.appendTail(b);
        t = b.toString();
        b = new StringBuffer();
        m = TITLE.matcher(t);
        while (m.find()) {
            String a = m.group(1), nx = m.group(2), w = WORDS.get(a);
            if (a.equals("St")) w = nx != null && Character.isUpperCase(nx.charAt(0)) ? "Saint" : "Street";
            else if (a.equals("No")) w = nx != null && Character.isDigit(nx.charAt(0)) ? "number" : null; // "No. I won't" stays
            boolean end = nx == null || (a.endsWith("r") && Character.isUpperCase(nx.charAt(0))); // "Lee Jr. He said"
            m.appendReplacement(b, Matcher.quoteReplacement(w == null ? m.group() : end ? w + "." : w)); // keep a sentence-end dot
        }
        m.appendTail(b);
        return b.toString();
    }

    private static final String STATES = "Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|"
            + "Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|"
            + "Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|"
            + "Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|"
            + "Washington|West Virginia|Wisconsin|Wyoming|D\\.C\\.|DC|Puerto Rico";
    private static final HashMap<String, String> AP = new HashMap<>(); // AP-style state abbreviations used in datelines
    static {
        String[] a = {"Ala", "Alabama", "Ariz", "Arizona", "Ark", "Arkansas", "Calif", "California", "Colo", "Colorado",
                "Conn", "Connecticut", "Del", "Delaware", "Fla", "Florida", "Ga", "Georgia", "Ill", "Illinois", "Ind", "Indiana",
                "Kan", "Kansas", "Ky", "Kentucky", "La", "Louisiana", "Md", "Maryland", "Mass", "Massachusetts", "Mich", "Michigan",
                "Minn", "Minnesota", "Miss", "Mississippi", "Mo", "Missouri", "Mont", "Montana", "Neb", "Nebraska", "Nev", "Nevada",
                "N.H", "New Hampshire", "N.J", "New Jersey", "N.M", "New Mexico", "N.Y", "New York", "N.C", "North Carolina",
                "N.D", "North Dakota", "Okla", "Oklahoma", "Ore", "Oregon", "Pa", "Pennsylvania", "R.I", "Rhode Island",
                "S.C", "South Carolina", "S.D", "South Dakota", "Tenn", "Tennessee", "Vt", "Vermont", "Va", "Virginia",
                "Wash", "Washington", "W.Va", "West Virginia", "Wis", "Wisconsin", "Wyo", "Wyoming"};
        for (int i = 0; i < a.length; i += 2) AP.put(a[i], a[i + 1]);
    }
    private static final Pattern APST = Pattern.compile("(?<=\\b[A-Z][A-Za-z.'-]{1,30}, )(W\\.Va|[NRS]\\.[A-Z]|[A-Z][a-z]{1,4})\\.(?=\\s*(\\S)?)");
    // not in a list of states ("Texas, Georgia") or after a date/opener ("On Tuesday, Florida")
    private static final Pattern CITY = Pattern.compile("\\b([A-Z][A-Za-z.'-]+), (?=(?:" + STATES + ")\\b(?!'))");
    private static final Pattern NOT_CITY = Pattern.compile("(?:" + STATES + "|" + "January|February|March|April|May|June|July|August|"
            + "September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Today|Yesterday|Meanwhile|However|Instead)");

    /** "Memphis, Tenn." -> "Memphis Tennessee": no comma pause inside a place name, AP abbreviations read in full. */
    static String places(String t) {
        t = t.replace("Washington, D.C.", "Washington D.C.");
        StringBuffer b = new StringBuffer();
        Matcher m = APST.matcher(t);
        while (m.find()) {
            String w = AP.get(m.group(1)), nx = m.group(2);
            if (w == null) w = m.group();
            else if (nx == null || Character.isUpperCase(nx.charAt(0))) w += "."; // sentence end
            m.appendReplacement(b, Matcher.quoteReplacement(w));
        }
        m.appendTail(b);
        t = b.toString();
        b = new StringBuffer();
        m = CITY.matcher(t);
        while (m.find()) m.appendReplacement(b, Matcher.quoteReplacement(m.group(1) + (NOT_CITY.matcher(m.group(1)).matches() ? ", " : " ")));
        m.appendTail(b);
        return b.toString();
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
                String l = c == 'a' ? "ˈA" : lex.get(String.valueOf(c)); // the list has "a" unstressed
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
    private static String hetero(String w, String prev, String next) {
        switch (w) {
            case "read": return READ_PAST.contains(prev) ? "ɹˈɛd" : null;
            case "used": return next.equals("to") ? "jˈust" : null;
            case "lead": return METAL.contains(next) ? "lˈɛd" : null;
            case "wound": return next.equals("up") || next.equals("down") ? "wˈWnd" : null;
            default: break;
        }
        String[] f = HET.get(w);
        if (f == null) return null;
        if (f[0] != null && VERB_PREV.contains(prev) && (!prev.equals("to") || AFTER_TO.contains(next))) return f[0];
        if (f[1] != null && NOUN_PREV.contains(prev)) return f[1];
        return null;
    }

    private static final Pattern MIXED = Pattern.compile("([a-z])([A-Z]{1,4})('s)?");

    /** One clip of text -> the phoneme string Kokoro reads. */
    String phonemes(String text) {
        String t = clean(text);
        StringBuilder out = new StringBuilder();
        Matcher m = TOK.matcher(t);
        java.util.ArrayList<String> ph = new java.util.ArrayList<>();
        java.util.ArrayList<String> low = new java.util.ArrayList<>();
        while (m.find()) {
            String tok = m.group();
            if (PUNCT.indexOf(tok.charAt(0)) >= 0) {
                ph.add(tok);
                low.add(tok);
                continue;
            }
            boolean caps = tok.length() > 1 && tok.equals(tok.toUpperCase(Locale.ROOT)) && !tok.equals(tok.toLowerCase(Locale.ROOT));
            String lw = tok.toLowerCase(Locale.ROOT);
            Matcher mx = MIXED.matcher(tok);
            if (mx.matches() && lex.get(lw) == null) { // xAI, xAI's: say the letters
                StringBuilder b = new StringBuilder();
                for (char c : (mx.group(1) + mx.group(2)).toLowerCase(Locale.ROOT).toCharArray()) {
                    String l = c == 'a' ? "ˈA" : lex.get(String.valueOf(c)); // the list has "a" unstressed
                    if (l != null) b.append(b.length() > 0 ? " " : "").append(l);
                }
                ph.add(mx.group(3) != null ? plural(b.toString()) : b.toString());
            } else if (ph.isEmpty() && tok.equals("A")) {
                ph.add("ˈA"); // a sentence that opens with "A" is read "ay", as newsreaders do (David 2026-11-02)
            } else ph.add(word(lw, caps));
            low.add(lw);
        }
        for (int i = 0; i < ph.size(); i++) {
            String next = i + 1 < ph.size() ? ph.get(i + 1) : "";
            boolean nv = vowelStart(next);
            String het = hetero(low.get(i), i > 0 ? low.get(i - 1) : "", i + 1 < low.size() ? low.get(i + 1) : "");
            if (het != null) ph.set(i, het);
            switch (low.get(i)) { // weak forms, the way Kokoro was trained (misaki)
                case "a": if (i > 0) ph.set(i, "ɐ"); break;
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
