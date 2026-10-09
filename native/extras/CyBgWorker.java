package com.cypress.reader;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.util.Xml;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.io.StringReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONObject;
import org.xmlpull.v1.XmlPullParser;

/**
 * Hourly background sync: fetches the configured feeds, stores the newest items, posts keyword
 * alerts and the morning pack, and refreshes the home-screen widget.
 */
public class CyBgWorker extends Worker {

    private static final String TAG = "CyBgWorker";
    private static final String UA = "Mozilla/5.0 (Linux; Android) CyPress/1.0 RSS reader";
    private static final int MAX_PER_FEED = 30;
    private static final int MAX_TOTAL = 300;
    private static final int MAX_FEEDS = 60;
    private static final int MAX_BYTES = 2 * 1024 * 1024;
    private static final int SEEN_CAP = 2000;
    private static final int ALERTS_PER_RUN = 5;
    private static final long RECENT_MS = 6L * 3600L * 1000L;
    /** With quiet hours on, stories from the whole quiet stretch can still raise an alert once it ends. */
    private static final long QUIET_RECENT_MS = 14L * 3600L * 1000L;
    private static final String FILE_SEEN = "bg_seen.json";

    static class Item {
        String feedId = "";
        String feedTitle = "";
        String title = "";
        String link = "";
        String summary = "";
        String img = "";
        long date = 0;
    }

    public CyBgWorker(Context context, WorkerParameters params) {
        super(context, params);
    }

    @Override
    public Result doWork() {
        try {
            run(getApplicationContext(), this);
        } catch (Throwable t) {
            Log.w(TAG, "sync failed: " + t);
        }
        return Result.success();
    }

    // ------------------------------------------------------------------ main flow

    static void run(Context ctx, CyBgWorker worker) throws Exception {
        JSONObject cfg = CyExtras.readConfig(ctx);
        if (!CyExtras.anyEnabled(cfg)) return;
        JSONObject alerts = cfg.optJSONObject("alerts");
        JSONObject pack = cfg.optJSONObject("pack");
        JSONObject widget = cfg.optJSONObject("widget");
        boolean alertsOn = alerts != null && alerts.optBoolean("enabled", false);
        boolean packOn = pack != null && pack.optBoolean("enabled", false);
        boolean widgetOn = widget != null && widget.optBoolean("enabled", false);
        JSONObject digest = cfg.optJSONObject("digest");
        boolean digestOn = digest != null && digest.optBoolean("enabled", false);
        boolean quiet = inQuiet(cfg.optJSONObject("quiet"));
        JSONObject qcfg = cfg.optJSONObject("quiet");
        boolean quietOn = qcfg != null && qcfg.optBoolean("enabled", false);
        JSONArray feeds = cfg.optJSONArray("feeds");
        File dir = ctx.getFilesDir();

        List<Item> old = loadItems(dir);
        List<Item> all = new ArrayList<Item>();
        List<Item> fresh = new ArrayList<Item>();
        List<String> feedOrder = new ArrayList<String>();
        Set<String> urlsInUse = new HashSet<String>();

        for (int i = 0; i < feeds.length() && i < MAX_FEEDS; i++) {
            if (worker != null && worker.isStopped()) return; // the system wants us to stop: keep what is stored as it is
            JSONObject f = feeds.optJSONObject(i);
            if (f == null) continue;
            String id = f.optString("id", "");
            String url = f.optString("url", "");
            String title = f.optString("title", "");
            feedOrder.add(id);
            urlsInUse.add(url);
            boolean haveOld = false;
            for (Item o : old) if (id.equals(o.feedId)) {
                haveOld = true;
                break;
            }
            List<Item> got = fetchFeed(ctx, id, title, url, haveOld);
            if (got == null || got.isEmpty()) {
                for (Item o : old) if (id.equals(o.feedId)) all.add(o); // keep what we had (also after "304 not modified")
            } else {
                all.addAll(got);
                fresh.addAll(got);
            }
        }
        pruneFeedCache(ctx, urlsInUse);
        sortNewestFirst(all);
        while (all.size() > MAX_TOTAL) all.remove(all.size() - 1);
        saveItems(dir, all);

        if (alertsOn && !quiet) {
            try {
                doAlerts(ctx, dir, alerts, fresh, all, quietOn);
            } catch (Throwable t) {
                Log.w(TAG, "alerts failed: " + t);
            }
        }
        if (digestOn && !quiet) {
            try {
                doDigest(ctx, digest, all);
            } catch (Throwable t) {
                Log.w(TAG, "digest failed: " + t);
            }
        }
        if (packOn) {
            try {
                doPack(ctx, dir, pack, all, feedOrder, !quiet);
            } catch (Throwable t) {
                Log.w(TAG, "pack failed: " + t);
            }
        }
        if (widgetOn) {
            try {
                JSONArray h = new JSONArray();
                for (Item it : all) {
                    if (it.title.length() == 0) continue;
                    JSONObject o = new JSONObject();
                    o.put("title", it.title);
                    o.put("link", it.link);
                    o.put("src", it.feedTitle);
                    o.put("img", it.img);
                    h.put(o);
                    if (h.length() >= CyWidgetProvider.MAX) break;
                }
                // pictures are fetched before the worker finishes, so the system does not stop it half-way
                if (h.length() > 0) CyExtras.saveHeadlines(ctx, h, true);
                CyExtras.updateWidgets(ctx);
            } catch (Throwable t) {
                Log.w(TAG, "widget failed: " + t);
            }
        }
    }

    // ------------------------------------------------------------------ alerts

    private static void doAlerts(Context ctx, File dir, JSONObject alerts, List<Item> fresh, List<Item> all, boolean quietOn) throws Exception {
        Set<String> seen = loadSeen(dir);
        boolean seeded = CyExtras.prefs(ctx).getBoolean("alerts_seeded", false);
        if (!seeded) {
            // First run: remember what is already there, do not notify about it.
            for (Item it : all) if (it.link.length() > 0) seen.add(it.link);
            saveSeen(dir, seen);
            CyExtras.prefs(ctx).edit().putBoolean("alerts_seeded", true).apply();
            return;
        }

        List<String> kws = new ArrayList<String>();
        JSONArray ka = alerts.optJSONArray("keywords");
        if (ka != null) {
            for (int i = 0; i < ka.length(); i++) {
                String k = ka.optString(i, "").trim().toLowerCase(Locale.ROOT);
                if (k.length() > 0) kws.add(k);
            }
        }
        Set<String> scope = null; // feeds whose every new story raises an alert (null = none picked)
        JSONArray ids = alerts.optJSONArray("feedIds");
        if (ids != null) {
            scope = new HashSet<String>();
            for (int i = 0; i < ids.length(); i++) scope.add(ids.optString(i, ""));
        }

        long now = System.currentTimeMillis();
        List<Item> hits = new ArrayList<Item>();
        for (Item it : fresh) {
            if (it.link.length() == 0 || seen.contains(it.link)) continue;
            if (it.date <= 0 || now - it.date > (quietOn ? QUIET_RECENT_MS : RECENT_MS)) continue;
            // An alert when the story is from a site picked for alerts, or when a keyword matches. Neither set: no alerts.
            boolean hit = scope != null && scope.contains(it.feedId);
            if (!hit && !kws.isEmpty()) {
                String hay = (it.title + " " + it.summary).toLowerCase(Locale.ROOT);
                for (String k : kws) {
                    if (hay.contains(k)) {
                        hit = true;
                        break;
                    }
                }
            }
            if (hit) hits.add(it);
        }
        sortNewestFirst(hits);

        int shown = 0;
        for (Item it : hits) {
            if (shown >= ALERTS_PER_RUN) break;
            int id = 20000 + (Math.abs(it.link.hashCode() % 20000));
            String text = it.feedTitle.length() > 0 ? it.feedTitle : "New article";
            if (it.summary.length() > 0) text = text + "\n" + it.summary;
            if (CyExtras.post(ctx, CyExtras.CH_ALERTS, id, it.title, text, it.link, "cy_alerts_group", false)) shown++;
        }
        int rest = hits.size() - shown;
        if (shown > 0 && rest > 0) {
            CyExtras.post(ctx, CyExtras.CH_ALERTS, 7303, "CyPress alerts", "+" + rest + " more matching articles",
                null, "cy_alerts_group", true);
        }

        for (Item it : fresh) if (it.link.length() > 0) seen.add(it.link);
        saveSeen(dir, seen);
    }

    private static Set<String> loadSeen(File dir) {
        Set<String> s = new LinkedHashSet<String>();
        try {
            String raw = CyExtras.readFile(new File(dir, FILE_SEEN));
            if (raw != null) {
                JSONArray a = new JSONArray(raw);
                for (int i = 0; i < a.length(); i++) s.add(a.optString(i, ""));
            }
        } catch (Throwable t) {
            // start empty
        }
        return s;
    }

    private static void saveSeen(File dir, Set<String> seen) {
        try {
            int drop = seen.size() - SEEN_CAP;
            JSONArray a = new JSONArray();
            for (String s : seen) {
                if (drop > 0) {
                    drop--;
                    continue;
                }
                a.put(s);
            }
            CyExtras.writeFile(new File(dir, FILE_SEEN), a.toString());
        } catch (Throwable t) {
            Log.w(TAG, "seen save failed: " + t);
        }
    }

    // ------------------------------------------------------------------ quiet hours and digest

    /** True when the current hour is inside the quiet window. A window such as 22 to 7 wraps past midnight. */
    static boolean inQuiet(JSONObject q) {
        try {
            if (q == null || !q.optBoolean("enabled", false)) return false;
            int from = q.optInt("from", 22), to = q.optInt("to", 7);
            int h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
            if (from == to) return false;
            return from < to ? (h >= from && h < to) : (h >= from || h < to);
        } catch (Throwable t) {
            return false;
        }
    }

    /**
     * Tells you when a digest is ready. The digest itself is put together in the app, from what is already stored,
     * so this only posts a short notice once per slot and day.
     */
    private static void doDigest(Context ctx, JSONObject dg, List<Item> all) {
        Calendar cal = Calendar.getInstance();
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        String today = String.format(Locale.US, "%04d-%02d-%02d",
            cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH));
        String when = dg.optString("when", "morning");
        int mh = Math.max(0, Math.min(11, dg.optInt("morningHour", 7)));
        int eh = Math.max(12, Math.min(19, dg.optInt("eveningHour", 18)));
        boolean week = dg.optBoolean("weekly", false) && (cal.get(Calendar.DAY_OF_WEEK) - 1) == dg.optInt("weekday", 0);
        String slot = null, title = null;
        int nid = 7305;
        if (week && hour >= mh && hour < eh && !today.equals(CyExtras.prefs(ctx).getString("dg_w", ""))) {
            slot = "dg_w";
            nid = 7307;
            title = "Your week in review is ready";
        } else if (("morning".equals(when) || "both".equals(when)) && hour >= mh && hour < mh + 5
            && !today.equals(CyExtras.prefs(ctx).getString("dg_m", ""))) {
            slot = "dg_m";
            title = "Your morning digest is ready";
        } else if (("evening".equals(when) || "both".equals(when)) && hour >= eh && hour < eh + 5
            && !today.equals(CyExtras.prefs(ctx).getString("dg_e", ""))) {
            slot = "dg_e";
            nid = 7306;
            title = "Your evening digest is ready";
        }
        if (slot == null) return;
        long since = System.currentTimeMillis() - ("dg_w".equals(slot) ? 7L * 86400000L : 24L * 3600000L);
        int n = 0;
        for (Item it : all) if (it.date >= since) n++;
        if (n == 0) return;
        boolean ok;
        // The app records the day's cover headline in the digest settings; if it is fresh, the notice carries it.
        JSONObject cv = dg.optJSONObject("cover");
        String head = cv == null ? "" : cv.optString("t", "").trim();
        boolean fresh = head.length() > 0 && System.currentTimeMillis() - cv.optLong("at", 0) < 36L * 3600000L;
        if (fresh && !"dg_w".equals(slot)) {
            int ec = cv.optInt("n", 0);
            String edName = "dg_e".equals(slot) ? "The Evening Edition" : "The Morning Edition";
            String src = cv.optString("f", "").trim();
            String big = head + (src.length() > 0 ? "\n" + src : "")
                + "\n" + (ec > 0 ? ec + (ec == 1 ? " story" : " stories") + " in your edition." : n + " new " + (n == 1 ? "story" : "stories") + " to catch up on.");
            ok = CyExtras.postEdition(ctx, CyExtras.CH_DIGEST, nid, edName + " is ready", head, big, CyExtras.DIGEST_URL, dg.optBoolean("lock", true));
        } else {
            ok = CyExtras.post(ctx, CyExtras.CH_DIGEST, nid, title,
                n + " new " + (n == 1 ? "story" : "stories") + " to catch up on", CyExtras.DIGEST_URL, null, false);
        }
        if (ok) {
            android.content.SharedPreferences.Editor ed = CyExtras.prefs(ctx).edit().putString(slot, today);
            if ("dg_w".equals(slot)) ed.putString("dg_m", today); // the weekly issue replaces that day's morning notice
            ed.apply();
        }
    }

    // ------------------------------------------------------------------ morning pack

    private static void doPack(Context ctx, File dir, JSONObject pack, List<Item> all, List<String> feedOrder, boolean notify) throws Exception {
        Calendar cal = Calendar.getInstance();
        String today = String.format(Locale.US, "%04d-%02d-%02d",
            cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH));
        int hour = pack.optInt("hour", 7);
        if (cal.get(Calendar.HOUR_OF_DAY) < hour) return;

        File pf = new File(dir, CyExtras.FILE_PACK);
        String existing = CyExtras.readFile(pf);
        if (existing != null) {
            try {
                JSONObject ex = new JSONObject(existing);
                if (today.equals(ex.optString("date", ""))) {
                    // Already built today. It may still be waiting for the quiet hours to end before it is announced.
                    JSONArray xi = ex.optJSONArray("items");
                    if (notify && xi != null && xi.length() > 0 && !today.equals(CyExtras.prefs(ctx).getString("pack_notified", ""))) {
                        announcePack(ctx, today, xi.length());
                    }
                    return;
                }
            } catch (Throwable t) {
                // rebuild
            }
        }

        int count = Math.max(1, Math.min(50, pack.optInt("count", 10)));
        Map<String, List<Item>> byFeed = new LinkedHashMap<String, List<Item>>();
        for (String id : feedOrder) if (!byFeed.containsKey(id)) byFeed.put(id, new ArrayList<Item>());
        for (Item it : all) {
            List<Item> l = byFeed.get(it.feedId);
            if (l != null && it.title.length() > 0 && it.link.length() > 0) l.add(it);
        }
        JSONArray items = new JSONArray();
        Set<String> used = new HashSet<String>();
        for (int round = 0; items.length() < count; round++) {
            boolean any = false;
            for (List<Item> l : byFeed.values()) {
                if (round < l.size()) {
                    any = true;
                    Item it = l.get(round);
                    if (used.add(it.link)) {
                        items.put(toJson(it));
                        if (items.length() >= count) break;
                    }
                }
            }
            if (!any) break;
        }

        JSONObject out = new JSONObject();
        out.put("date", today);
        out.put("items", items);
        CyExtras.writeFile(pf, out.toString());
        if (notify && items.length() > 0) announcePack(ctx, today, items.length());
    }

    private static void announcePack(Context ctx, String today, int n) {
        boolean ok = CyExtras.post(ctx, CyExtras.CH_PACK, 7302, "Your morning pack is ready",
            n + " stories picked from your feeds", CyExtras.PACK_URL, null, false);
        if (ok) CyExtras.prefs(ctx).edit().putString("pack_notified", today).apply();
    }

    // ------------------------------------------------------------------ storage

    private static JSONObject toJson(Item it) throws Exception {
        JSONObject o = new JSONObject();
        o.put("feedId", it.feedId);
        o.put("feedTitle", it.feedTitle);
        o.put("title", it.title);
        o.put("link", it.link);
        o.put("date", it.date);
        o.put("summary", it.summary);
        o.put("img", it.img);
        return o;
    }

    private static List<Item> loadItems(File dir) {
        List<Item> out = new ArrayList<Item>();
        try {
            String raw = CyExtras.readFile(new File(dir, CyExtras.FILE_ITEMS));
            if (raw == null) return out;
            JSONArray a = new JSONArray(raw);
            for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.optJSONObject(i);
                if (o == null) continue;
                Item it = new Item();
                it.feedId = o.optString("feedId", "");
                it.feedTitle = o.optString("feedTitle", "");
                it.title = o.optString("title", "");
                it.link = o.optString("link", "");
                if (!CyExtras.isHttpUrl(it.link)) it.link = "";
                it.summary = o.optString("summary", "");
                it.img = o.optString("img", "");
                it.date = o.optLong("date", 0);
                out.add(it);
            }
        } catch (Throwable t) {
            // ignore
        }
        return out;
    }

    private static void saveItems(File dir, List<Item> items) throws Exception {
        JSONArray a = new JSONArray();
        for (Item it : items) a.put(toJson(it));
        CyExtras.writeFile(new File(dir, CyExtras.FILE_ITEMS), a.toString());
    }

    private static void sortNewestFirst(List<Item> l) {
        Collections.sort(l, new Comparator<Item>() {
            @Override
            public int compare(Item a, Item b) {
                return Long.compare(b.date, a.date);
            }
        });
    }

    // ------------------------------------------------------------------ fetching

    /** Reads at most MAX_BYTES, then reports end-of-stream. */
    private static class LimitedInputStream extends FilterInputStream {
        private int left;

        LimitedInputStream(InputStream in, int limit) {
            super(in);
            left = limit;
        }

        @Override
        public int read() throws IOException {
            if (left <= 0) return -1;
            int b = super.read();
            if (b >= 0) left--;
            return b;
        }

        @Override
        public int read(byte[] buf, int off, int len) throws IOException {
            if (left <= 0) return -1;
            int n = super.read(buf, off, Math.min(len, left));
            if (n > 0) left -= n;
            return n;
        }
    }

    private static final String FEED_PREFS = "cy_feedcache";

    private static SharedPreferences feedCache(Context ctx) {
        return ctx.getSharedPreferences(FEED_PREFS, Context.MODE_PRIVATE);
    }

    /** Forgets the stored ETag / Last-Modified of feeds that are no longer configured. Keys are "e|url" and "m|url". */
    private static void pruneFeedCache(Context ctx, Set<String> urls) {
        try {
            SharedPreferences sp = feedCache(ctx);
            SharedPreferences.Editor ed = null;
            for (String k : sp.getAll().keySet()) {
                if (k.length() < 3 || !urls.contains(k.substring(2))) {
                    if (ed == null) ed = sp.edit();
                    ed.remove(k);
                }
            }
            if (ed != null) ed.apply();
        } catch (Throwable t) {
            // ignore
        }
    }

    private static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
        return bo.toByteArray();
    }

    /** Makes a story link absolute against the feed address and keeps only http(s) links; "" if it cannot be one. */
    private static String resolveLink(String base, String link) {
        if (link == null) return "";
        String l = link.trim();
        if (l.length() == 0) return "";
        if (CyExtras.isHttpUrl(l)) return l;
        if (l.startsWith("//")) return "https:" + l;
        int colon = l.indexOf(':');
        int slash = l.indexOf('/');
        if (colon >= 0 && (slash < 0 || colon < slash)) return ""; // some other scheme (javascript:, file:, ...)
        try {
            String r = new URL(new URL(base), l).toString();
            return CyExtras.isHttpUrl(r) ? r : "";
        } catch (Throwable t) {
            return "";
        }
    }

    /**
     * Returns the newest items of one feed, or null if it could not be fetched or has not changed since last time
     * (HTTP 304). With conditional = true the stored ETag / Last-Modified are sent, so the caller must already hold
     * this feed's earlier items.
     */
    static List<Item> fetchFeed(Context ctx, String feedId, String feedTitle, String url, boolean conditional) {
        HttpURLConnection con = null;
        InputStream in = null;
        try {
            SharedPreferences fc = feedCache(ctx);
            String etag = conditional ? fc.getString("e|" + url, null) : null;
            String lastMod = conditional ? fc.getString("m|" + url, null) : null;
            String cur = url;
            int hops = 0;
            while (true) {
                URL u = new URL(cur);
                String proto = u.getProtocol();
                if (!"http".equals(proto) && !"https".equals(proto)) return null;
                con = (HttpURLConnection) u.openConnection();
                con.setConnectTimeout(12000);
                con.setReadTimeout(12000);
                con.setInstanceFollowRedirects(false);
                con.setRequestProperty("User-Agent", UA);
                con.setRequestProperty("Accept", "application/rss+xml, application/atom+xml, application/feed+json, application/json, application/xml, text/xml, */*");
                if (etag != null) con.setRequestProperty("If-None-Match", etag);
                if (lastMod != null) con.setRequestProperty("If-Modified-Since", lastMod);
                int code = con.getResponseCode();
                if (code == HttpURLConnection.HTTP_NOT_MODIFIED) return null; // nothing new since last time
                if (code >= 300 && code < 400 && hops < 5) {
                    String loc = con.getHeaderField("Location");
                    con.disconnect();
                    con = null;
                    if (loc == null) return null;
                    cur = new URL(u, loc).toString();
                    hops++;
                    continue;
                }
                if (code != 200) return null;
                break;
            }
            String newEtag = con.getHeaderField("ETag");
            String newMod = con.getHeaderField("Last-Modified");
            in = new LimitedInputStream(con.getInputStream(), MAX_BYTES);
            List<Item> items = parseBody(readAll(in), con.getContentType());
            List<Item> kept = new ArrayList<Item>();
            for (Item it : items) {
                it.link = resolveLink(cur, it.link);
                if (it.link.length() == 0) continue;
                it.feedId = feedId;
                it.feedTitle = feedTitle;
                kept.add(it);
            }
            items = kept;
            sortNewestFirst(items);
            while (items.size() > MAX_PER_FEED) items.remove(items.size() - 1);
            SharedPreferences.Editor ed = fc.edit();
            if (newEtag != null && !items.isEmpty()) ed.putString("e|" + url, newEtag);
            else ed.remove("e|" + url);
            if (newMod != null && !items.isEmpty()) ed.putString("m|" + url, newMod);
            else ed.remove("m|" + url);
            ed.apply();
            return items;
        } catch (Throwable t) {
            Log.w(TAG, "feed failed " + url + ": " + t);
            return null;
        } finally {
            try {
                if (in != null) in.close();
            } catch (Throwable t) {
                // ignore
            }
            if (con != null) con.disconnect();
        }
    }

    /** JSON Feed when the body is JSON that says so, otherwise RSS / Atom. */
    static List<Item> parseBody(byte[] data, String contentType) {
        int i = 0;
        if (data.length >= 3 && (data[0] & 0xFF) == 0xEF && (data[1] & 0xFF) == 0xBB && (data[2] & 0xFF) == 0xBF) i = 3;
        while (i < data.length && (data[i] == ' ' || data[i] == '\n' || data[i] == '\r' || data[i] == '\t')) i++;
        if (i < data.length && data[i] == '{') {
            try {
                String body = new String(data, i, data.length - i, StandardCharsets.UTF_8);
                boolean jf = (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("feed+json"))
                    || body.contains("jsonfeed.org/version");
                if (jf) return parseJsonFeed(body);
            } catch (Throwable t) {
                Log.w(TAG, "json feed failed: " + t);
            }
            return new ArrayList<Item>(); // JSON, but not a feed
        }
        return parseFeed(data);
    }

    private static String jstr(JSONObject o, String key) {
        Object v = o.opt(key);
        if (v == null || v == JSONObject.NULL) return "";
        return String.valueOf(v);
    }

    /** JSON Feed 1.x: items[] with title, url / external_url, date_published, summary / content_text, image. */
    static List<Item> parseJsonFeed(String body) {
        List<Item> items = new ArrayList<Item>();
        try {
            JSONObject root = new JSONObject(body);
            JSONArray arr = root.optJSONArray("items");
            if (arr == null) return items;
            for (int i = 0; i < arr.length() && items.size() < 100; i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o == null) continue;
                Item it = new Item();
                String html = jstr(o, "content_html");
                String text = jstr(o, "content_text");
                String sum = jstr(o, "summary");
                it.summary = clean(sum.length() > 0 ? sum : (text.length() > 0 ? text : html), 300);
                it.title = clean(jstr(o, "title"), 300);
                if (it.title.length() == 0) it.title = clean(it.summary, 120);
                String link = jstr(o, "url");
                if (link.length() == 0) link = jstr(o, "external_url");
                if (link.length() == 0) {
                    String id = jstr(o, "id");
                    if (id.startsWith("http")) link = id;
                }
                it.link = link.trim();
                String d = jstr(o, "date_published");
                if (d.length() == 0) d = jstr(o, "date_modified");
                it.date = parseDate(d);
                String img = fixUrl(jstr(o, "image"));
                if (img.length() == 0) img = fixUrl(jstr(o, "banner_image"));
                if (img.length() == 0 && html.length() > 0) {
                    Matcher m = IMG_RE.matcher(html);
                    if (m.find()) img = fixUrl(m.group(1));
                }
                it.img = img;
                if (it.title.length() > 0 && it.link.length() > 0) items.add(it);
            }
        } catch (Throwable t) {
            Log.w(TAG, "json feed parse stopped early: " + t);
        }
        return items;
    }

    /** What an XML parse produced, and whether it stopped on an error before the end of the document. */
    private static final class Parsed {
        final List<Item> items = new ArrayList<Item>();
        boolean broken = false;
    }

    /** A "&" that does not start an entity such as &amp; or &#39; (a common mistake in feeds). */
    private static final Pattern BARE_AMP = Pattern.compile("&(?!(?:[A-Za-z][A-Za-z0-9]{0,31}|#[0-9]{1,7}|#[xX][0-9A-Fa-f]{1,6});)");
    private static final Pattern XML_ENC = Pattern.compile("^\\s*<\\?xml[^>]*encoding\\s*=\\s*[\"']([A-Za-z0-9._:-]+)[\"']");

    /** RSS 2.0 and Atom. Keeps what was parsed if the XML breaks half-way; then repairs stray ampersands and tries once more. */
    static List<Item> parseFeed(byte[] data) {
        Parsed r = parseXml(new ByteArrayInputStream(data), null);
        if (!r.broken) return r.items;
        try {
            Charset cs = StandardCharsets.UTF_8;
            String head = new String(data, 0, Math.min(data.length, 200), StandardCharsets.ISO_8859_1);
            Matcher m = XML_ENC.matcher(head);
            if (m.find()) {
                try {
                    cs = Charset.forName(m.group(1));
                } catch (Throwable e) {
                    // keep UTF-8
                }
            }
            String txt = new String(data, cs);
            String fixed = BARE_AMP.matcher(txt).replaceAll("&amp;");
            if (!fixed.equals(txt)) {
                Parsed r2 = parseXml(null, new StringReader(fixed));
                if (r2.items.size() > r.items.size()) return r2.items;
            }
        } catch (Throwable t) {
            Log.w(TAG, "feed repair failed: " + t);
        }
        return r.items;
    }

    private static final Pattern IMG_RE = Pattern.compile("<img[^>]+src\\s*=\\s*[\"']([^\"']+)[\"']", Pattern.CASE_INSENSITIVE);

    /** One pass of the pull parser over a stream (encoding from the XML declaration) or a reader (already decoded). */
    private static Parsed parseXml(InputStream in, Reader reader) {
        Parsed res = new Parsed();
        List<Item> items = res.items;
        try {
            XmlPullParser p = Xml.newPullParser();
            p.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false);
            if (reader != null) p.setInput(reader);
            else p.setInput(in, null);
            defineEntities(p);

            Item cur = null;
            String rawHtml = "";
            String summaryTxt = "";
            String guidLink = "";
            int ev = p.getEventType();
            while (ev != XmlPullParser.END_DOCUMENT) {
                if (ev == XmlPullParser.START_TAG) {
                    String n = p.getName();
                    if ("item".equals(n) || "entry".equals(n)) {
                        cur = new Item();
                        rawHtml = "";
                        summaryTxt = "";
                        guidLink = "";
                    } else if (cur != null) {
                        if ("title".equals(n)) {
                            String t = readText(p);
                            if (cur.title.length() == 0) cur.title = clean(t, 300);
                        } else if ("link".equals(n)) {
                            String href = p.getAttributeValue(null, "href");
                            String rel = p.getAttributeValue(null, "rel");
                            String t = readText(p);
                            if (cur.link.length() == 0) {
                                if (href != null) {
                                    if (rel == null || "alternate".equals(rel)) cur.link = href.trim();
                                } else {
                                    cur.link = t.trim();
                                }
                            }
                        } else if ("guid".equals(n) || "id".equals(n)) {
                            String t = readText(p).trim();
                            if (guidLink.length() == 0 && t.startsWith("http")) guidLink = t;
                        } else if ("pubDate".equals(n) || "published".equals(n) || "updated".equals(n) || "dc:date".equals(n)) {
                            String t = readText(p);
                            if (cur.date == 0) cur.date = parseDate(t);
                        } else if ("description".equals(n) || "summary".equals(n)) {
                            String t = readText(p);
                            if (summaryTxt.length() == 0) summaryTxt = t;
                            if (rawHtml.length() < 40000) rawHtml = rawHtml + " " + t;
                        } else if ("content".equals(n) || "content:encoded".equals(n)) {
                            String t = readText(p);
                            if (t.length() > 0) {
                                if (rawHtml.length() < 40000) rawHtml = rawHtml + " " + t;
                                if (summaryTxt.length() == 0) summaryTxt = t;
                            }
                        } else if ("media:content".equals(n) || "media:thumbnail".equals(n)) {
                            String u = p.getAttributeValue(null, "url");
                            String type = p.getAttributeValue(null, "type");
                            String medium = p.getAttributeValue(null, "medium");
                            readText(p);
                            boolean isImg = "media:thumbnail".equals(n)
                                || (type != null && type.startsWith("image"))
                                || "image".equals(medium)
                                || (type == null && medium == null && looksLikeImage(u));
                            if (cur.img.length() == 0 && isImg) cur.img = fixUrl(u);
                        } else if ("enclosure".equals(n)) {
                            String u = p.getAttributeValue(null, "url");
                            String type = p.getAttributeValue(null, "type");
                            readText(p);
                            if (cur.img.length() == 0 && ((type != null && type.startsWith("image")) || (type == null && looksLikeImage(u)))) {
                                cur.img = fixUrl(u);
                            }
                        }
                    }
                } else if (ev == XmlPullParser.END_TAG) {
                    String n = p.getName();
                    if (cur != null && ("item".equals(n) || "entry".equals(n))) {
                        if (cur.img.length() == 0 && rawHtml.length() > 0) {
                            Matcher m = IMG_RE.matcher(rawHtml);
                            if (m.find()) cur.img = fixUrl(m.group(1));
                        }
                        if (cur.link.length() == 0) cur.link = guidLink;
                        cur.summary = clean(summaryTxt, 300);
                        if (cur.title.length() > 0 && cur.link.length() > 0) items.add(cur);
                        cur = null;
                    }
                }
                ev = p.next();
            }
        } catch (Throwable t) {
            Log.w(TAG, "parse stopped early: " + t);
            res.broken = true;
        }
        return res;
    }

    private static void defineEntities(XmlPullParser p) {
        String[][] e = {
            { "nbsp", " " }, { "mdash", "\u2014" }, { "ndash", "\u2013" }, { "hellip", "\u2026" },
            { "rsquo", "\u2019" }, { "lsquo", "\u2018" }, { "rdquo", "\u201D" }, { "ldquo", "\u201C" },
            { "copy", "\u00A9" }, { "middot", "\u00B7" }, { "bull", "\u2022" }
        };
        for (String[] kv : e) {
            try {
                p.defineEntityReplacementText(kv[0], kv[1]);
            } catch (Throwable t) {
                // not supported: ignore
            }
        }
    }

    /** Text of the current element including nested text; leaves the parser on its END_TAG. */
    private static String readText(XmlPullParser p) throws Exception {
        StringBuilder sb = new StringBuilder();
        int depth = 1;
        while (depth > 0) {
            int ev = p.next();
            if (ev == XmlPullParser.START_TAG) depth++;
            else if (ev == XmlPullParser.END_TAG) depth--;
            else if (ev == XmlPullParser.TEXT) {
                if (sb.length() < 20000) sb.append(p.getText());
            } else if (ev == XmlPullParser.END_DOCUMENT) break;
        }
        return sb.toString();
    }

    private static boolean looksLikeImage(String u) {
        if (u == null) return false;
        String l = u.toLowerCase(Locale.ROOT);
        int q = l.indexOf('?');
        if (q > 0) l = l.substring(0, q);
        return l.endsWith(".jpg") || l.endsWith(".jpeg") || l.endsWith(".png") || l.endsWith(".webp") || l.endsWith(".gif");
    }

    private static String fixUrl(String u) {
        if (u == null) return "";
        u = u.trim();
        if (u.startsWith("//")) u = "https:" + u;
        return (u.startsWith("http://") || u.startsWith("https://")) ? u : "";
    }

    private static final Pattern TAGS = Pattern.compile("(?s)<[^>]*>");
    private static final Pattern NUM_ENT = Pattern.compile("&#(x[0-9a-fA-F]+|[0-9]+);");

    /** Strips HTML, decodes common entities, collapses whitespace, caps the length. */
    static String clean(String s, int max) {
        if (s == null) return "";
        String t = TAGS.matcher(s).replaceAll(" ");
        Matcher m = NUM_ENT.matcher(t);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String g = m.group(1);
            String rep = " ";
            try {
                int cp = g.charAt(0) == 'x' ? Integer.parseInt(g.substring(1), 16) : Integer.parseInt(g);
                rep = new String(Character.toChars(cp));
            } catch (Throwable e) {
                // keep a space
            }
            m.appendReplacement(sb, Matcher.quoteReplacement(rep));
        }
        m.appendTail(sb);
        t = sb.toString()
            .replace("&nbsp;", " ").replace("&quot;", "\"").replace("&apos;", "'")
            .replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&");
        t = t.replaceAll("\\s+", " ").trim();
        if (t.length() > max) t = t.substring(0, max - 1).trim() + "\u2026";
        return t;
    }

    // ------------------------------------------------------------------ dates

    private static final String[] DATE_FORMATS = {
        "EEE, dd MMM yyyy HH:mm:ss Z",
        "EEE, d MMM yyyy HH:mm:ss Z",
        "dd MMM yyyy HH:mm:ss Z",
        "d MMM yyyy HH:mm:ss Z",
        "EEE, dd MMM yyyy HH:mm Z",
        "EEE, d MMM yyyy HH:mm Z",
        "EEE, dd MMM yyyy HH:mm:ss",
        "EEE MMM dd HH:mm:ss Z yyyy"
    };

    /** Milliseconds since epoch, or 0 if the date is missing or unreadable. */
    static long parseDate(String in) {
        if (in == null) return 0;
        String s = in.trim();
        if (s.length() == 0) return 0;
        try {
            if (s.matches("^\\d{4}-\\d{2}-\\d{2}.*")) {
                String t = s.length() == 10 ? s + "T00:00:00Z" : s.replace(' ', 'T');
                t = t.replaceFirst("\\.\\d+", "");
                if (t.endsWith("Z") || t.endsWith("z")) t = t.substring(0, t.length() - 1) + "+0000";
                t = t.replaceFirst("([+-]\\d{2}):(\\d{2})$", "$1$2");
                if (t.matches(".*T\\d{2}:\\d{2}:\\d{2}$")) t = t + "+0000";
                SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.US);
                return f.parse(t).getTime();
            }
        } catch (Throwable t) {
            // fall through to the RFC 822 formats
        }
        for (String fmt : DATE_FORMATS) {
            try {
                SimpleDateFormat f = new SimpleDateFormat(fmt, Locale.US);
                return f.parse(s).getTime();
            } catch (Throwable t) {
                // try the next one
            }
        }
        return 0;
    }
}
