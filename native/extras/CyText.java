package com.cypress.reader;

import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * English reading rules shared by both voices: titles (Gov. -> Governor), month names, AP state names in datelines,
 * initials, wire-service tags. The natural voice (CyG2p) also uses the times and number words; phone voices read
 * those well themselves, so phone() leaves them as written.
 */
class CyText {
    static final Pattern WIRE = Pattern.compile("\\((?:AP|Reuters|AFP|CNN)\\)\\s*[—–-]*\\s*");

    static final Pattern INITIAL = Pattern.compile("(?<=[A-Z][a-z]{1,30} )([A-Z])\\.(?=\\s+[A-Z][a-z])");

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
    // tech: 16GB, 3.5GHz, 5,000mAh; attached only for W/nm/ms ("65W", "3nm") so "Route 9 W" stays
    private static final Pattern UNIT2 = Pattern.compile("\\b(\\d+(?:[.,]\\d+)*)(?:\\s?(GB|TB|MB|KB|GHz|MHz|mAh|kWh|Gbps|Mbps)|(W|Wh|nm|ms))\\b");
    private static final Pattern MODEL = Pattern.compile("\\b([A-Z]{2,5}) ([1-9]\\d)(0[1-9]|[1-9]\\d)\\b(?![.,]\\d)"); // RTX 5090: fifty ninety
    private static final Pattern TITLE = Pattern.compile("\\b(Gov|Sen|Rep|Gen|Lt|Col|Sgt|Capt|Cmdr|Adm|Prof|Supt|Mt|Ft|Jr|Sr|St|No|vs)\\.(?=\\s*(\\S)?)");
    private static final HashMap<String, String> WORDS = new HashMap<>();
    static {
        String[] w = {"Jan", "January", "Feb", "February", "Mar", "March", "Apr", "April", "Jun", "June", "Jul", "July", "Aug", "August",
                "Sep", "September", "Sept", "September", "Oct", "October", "Nov", "November", "Dec", "December",
                "km", "kilometer", "kph", "kilometers per hour", "mph", "miles per hour", "kg", "kilogram", "lb", "pound", "lbs", "pound",
                "ft", "foot", "mi", "mile", "cm", "centimeter", "mm", "millimeter", "oz", "ounce", "°", "degree", "°F", "degree Fahrenheit",
                "°C", "degree Celsius", "GB", "gigabyte", "TB", "terabyte", "MB", "megabyte", "KB", "kilobyte", "GHz", "gigahertz",
                "MHz", "megahertz", "mAh", "milliamp-hour", "kWh", "kilowatt-hour", "Gbps", "gigabits per second",
                "Mbps", "megabits per second", "W", "watt", "Wh", "watt-hour", "nm", "nanometer", "ms", "millisecond", "Gov", "Governor", "Sen", "Senator", "Rep", "Representative", "Gen", "General", "Lt", "Lieutenant",
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
        m = UNIT2.matcher(t);
        while (m.find()) {
            String k = m.group(2) != null ? m.group(2) : m.group(3), u = WORDS.get(k), one = m.group(1);
            if (!one.equals("1") && !u.endsWith("hertz")) u = u.contains(" per ") ? u : u + "s";
            m.appendReplacement(b, Matcher.quoteReplacement(one + " " + u));
        }
        m.appendTail(b);
        t = MODEL.matcher(b.toString()).replaceAll("$1 $2 $3");
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

    static final String[] ONES = {"zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
            "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"};
    static final String[] TENS = {"", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"};

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

    // ------------------------------------------------------------------ the reader's own fixes ("Fix how words are said")

    private static volatile String userSrc = "";
    private static volatile Pattern userP;
    private static volatile HashMap<String, String> userM;

    /** "word\tsay it like" lines from the page; parsed only when the list changes. */
    static void userWords(String src) {
        if (src == null || src.equals(userSrc)) return;
        HashMap<String, String> m = new HashMap<>();
        for (String line : src.split("\n")) {
            int tab = line.indexOf('\t');
            if (tab <= 0) continue;
            String w = line.substring(0, tab).trim(), say = line.substring(tab + 1).trim();
            if (!w.isEmpty() && !say.isEmpty()) m.put(w.toLowerCase(java.util.Locale.ROOT), say);
        }
        java.util.List<String> keys = new java.util.ArrayList<>(m.keySet());
        keys.sort((x, y) -> y.length() - x.length()); // "New Orleans" before "New"
        StringBuilder r = new StringBuilder();
        for (String k : keys) r.append(r.length() > 0 ? "|" : "").append(Pattern.quote(k));
        userM = m;
        userP = keys.isEmpty() ? null : Pattern.compile("(?<![\\p{L}\\p{N}])(?:" + r + ")(?![\\p{L}\\p{N}])",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
        userSrc = src;
    }

    /** Swaps in the reader's spellings (whole words, any case; "Nguyen's" -> "win's"). */
    static String user(String t) {
        Pattern p = userP;
        HashMap<String, String> m = userM;
        if (p == null || m == null) return t;
        StringBuffer b = new StringBuffer();
        Matcher x = p.matcher(t);
        while (x.find()) {
            String say = m.get(x.group().toLowerCase(java.util.Locale.ROOT));
            x.appendReplacement(b, Matcher.quoteReplacement(say == null ? x.group() : say));
        }
        x.appendTail(b);
        return b.toString();
    }

    /** What a phone voice reads (English only). */
    static String phone(String t) {
        t = user(t);
        t = WIRE.matcher(t).replaceAll(" ");
        t = INITIAL.matcher(t).replaceAll("$1");
        return expand(places(t));
    }

    /**
     * Word starts in said (row 0), where each one starts in orig (row 1), 1 if the word is unchanged (row 2), so word
     * highlights land on the text the page sent. Rewritten words point at the first original word they replaced.
     * Null when the text is too long to line up cheaply (then the original text is read).
     */
    static int[][] align(String orig, String said) {
        int[] a = starts(orig), b = starts(said);
        int n = a.length, m = b.length, p = 0, q = 0;
        while (p < n && p < m && word(orig, a, p).equals(word(said, b, p))) p++;
        while (q < n - p && q < m - p && word(orig, a, n - 1 - q).equals(word(said, b, m - 1 - q))) q++;
        int x = n - p - q, y = m - p - q;
        if ((long) (x + 1) * (y + 1) > 2_000_000) return null;
        int[] d = new int[(x + 1) * (y + 1)]; // longest common run of words, from the back
        for (int i = x - 1; i >= 0; i--)
            for (int j = y - 1; j >= 0; j--)
                d[i * (y + 1) + j] = word(orig, a, p + i).equals(word(said, b, p + j)) ? d[(i + 1) * (y + 1) + j + 1] + 1
                        : Math.max(d[(i + 1) * (y + 1) + j], d[i * (y + 1) + j + 1]);
        int[][] r = new int[3][m];
        for (int k = 0; k < p; k++) r[1][k] = a[k];
        for (int k = 0; k < q; k++) r[1][m - 1 - k] = a[n - 1 - k];
        for (int k = 0; k < m; k++) r[0][k] = b[k];
        for (int k = 0; k < m; k++) r[2][k] = k < p || k >= m - q ? 1 : 0;
        int i = 0, j = 0;
        while (j < y) {
            if (i < x && word(orig, a, p + i).equals(word(said, b, p + j))) {
                r[1][p + j] = a[p + i];
                r[2][p + j] = 1;
                i++;
                j++;
            } else if (i < x && d[(i + 1) * (y + 1) + j + 1] == d[i * (y + 1) + j]) { // one word rewritten as another
                r[1][p + j] = a[p + i];
                i++;
                j++;
            } else if (i < x && d[(i + 1) * (y + 1) + j] == d[i * (y + 1) + j]) { // original word dropped
                i++;
            } else {
                r[1][p + j] = p + i < n ? a[p + i] : orig.length();
                j++;
            }
        }
        return r;
    }

    /** A position in said -> the same place in orig. */
    static int at(int[][] r, int pos) {
        int lo = 0, hi = r[0].length - 1;
        if (hi < 0) return 0;
        while (lo < hi) {
            int mid = (lo + hi + 1) >>> 1;
            if (r[0][mid] <= pos) lo = mid;
            else hi = mid - 1;
        }
        return r[1][lo] + (r[2][lo] == 1 ? Math.max(0, pos - r[0][lo]) : 0);
    }

    private static int[] starts(String s) {
        int c = 0;
        for (int i = 0; i < s.length(); i++) if (!Character.isWhitespace(s.charAt(i)) && (i == 0 || Character.isWhitespace(s.charAt(i - 1)))) c++;
        int[] r = new int[c];
        c = 0;
        for (int i = 0; i < s.length(); i++) if (!Character.isWhitespace(s.charAt(i)) && (i == 0 || Character.isWhitespace(s.charAt(i - 1)))) r[c++] = i;
        return r;
    }

    private static String word(String s, int[] st, int k) {
        int e = st[k];
        while (e < s.length() && !Character.isWhitespace(s.charAt(e))) e++;
        return s.substring(st[k], e);
    }
}
