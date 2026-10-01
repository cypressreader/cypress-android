package com.cypress.reader;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.JSObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Static helper hub for the optional CyPress extras (icon switch, share target, notifications,
 * background sync, widget). Everything here is defensive: nothing throws into the caller unless
 * the method says so.
 */
public final class CyExtras {

    static final String TAG = "CyExtras";
    static final String PREFS = "cy_extras";
    static final String CH_MEDIA = "cy_media";
    static final String CH_ALERTS = "cy_alerts";
    static final String CH_PACK = "cy_pack";
    static final String CH_DIGEST = "cy_digest";
    static final String EXTRA_OPEN_URL = "cy_open_url";
    static final String PACK_URL = "cypress:pack";
    static final String DIGEST_URL = "cypress:digest";
    static final String WORK_NAME = "cy_bg_sync";
    static final String WORK_NOW = "cy_bg_sync_now";
    static final String ICON_TREE = "com.cypress.reader.IconTree";
    static final String ICON_CIRCUIT = "com.cypress.reader.IconCircuit";
    static final String FILE_ITEMS = "bg_items.json";
    static final String FILE_PACK = "pack.json";

    /** The loaded plugin instance (null until Capacitor has loaded it). */
    static volatile CyExtrasPlugin plugin;

    private static final Object LOCK = new Object();
    private static JSObject pendingShare;
    private static String pendingOpen;

    private CyExtras() {}

    // ---------------------------------------------------------------- events

    /** Send an event to the web page if the plugin is loaded. Never throws. */
    static void emit(String event, JSObject data, boolean retain) {
        try {
            final CyExtrasPlugin p = plugin;
            if (p == null) return;
            // Callbacks can arrive on any thread; listeners are touched on the main thread only.
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    p.emitEvent(event, data, retain);
                } catch (Throwable t) {
                    Log.w(TAG, "emit failed: " + t);
                }
            });
        } catch (Throwable t) {
            Log.w(TAG, "emit failed: " + t);
        }
    }

    static void emitMediaAction(String action) {
        try {
            JSObject o = new JSObject();
            o.put("action", action);
            emit("mediaAction", o, false);
        } catch (Throwable t) {
            Log.w(TAG, "media action failed: " + t);
        }
    }

    // ---------------------------------------------------------------- incoming intents

    private static final Pattern URL_RE = Pattern.compile("https?://[^\\s<>\"']+");

    /** Reads a share (ACTION_SEND text) and/or a notification/widget tap (cy_open_url) from an intent. */
    static void handleIntent(Intent intent) {
        try {
            if (intent == null) return;
            if ((intent.getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) return;

            if (Intent.ACTION_SEND.equals(intent.getAction())) {
                String type = intent.getType();
                CharSequence cs = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
                String text = cs == null ? "" : cs.toString().trim();
                if ((type == null || type.startsWith("text/")) && text.length() > 0) {
                    JSObject d = new JSObject();
                    d.put("text", text);
                    Matcher m = URL_RE.matcher(text);
                    if (m.find()) d.put("url", m.group());
                    CharSequence subj = intent.getCharSequenceExtra(Intent.EXTRA_SUBJECT);
                    if (subj != null && subj.toString().trim().length() > 0) d.put("title", subj.toString().trim());
                    synchronized (LOCK) {
                        pendingShare = d;
                    }
                    emit("sharedContent", d, true);
                }
                intent.removeExtra(Intent.EXTRA_TEXT);
                intent.removeExtra(Intent.EXTRA_SUBJECT);
            }

            String url = intent.getStringExtra(EXTRA_OPEN_URL);
            if (url != null && url.length() > 0) {
                synchronized (LOCK) {
                    pendingOpen = url;
                }
                JSObject o = new JSObject();
                o.put("url", url);
                emit("notificationOpen", o, true);
                intent.removeExtra(EXTRA_OPEN_URL);
            }
        } catch (Throwable t) {
            Log.w(TAG, "handleIntent failed: " + t);
        }
    }

    static JSObject takePendingShare() {
        synchronized (LOCK) {
            JSObject d = pendingShare;
            pendingShare = null;
            return d == null ? new JSObject() : d;
        }
    }

    static String takePendingOpen() {
        synchronized (LOCK) {
            String u = pendingOpen;
            pendingOpen = null;
            return u;
        }
    }

    // ---------------------------------------------------------------- launcher icon

    static boolean isAliasEnabled(Context c, String cls) throws Exception {
        PackageManager pm = c.getPackageManager();
        ComponentName cn = new ComponentName(c, cls);
        int st = pm.getComponentEnabledSetting(cn);
        if (st == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) return true;
        if (st == PackageManager.COMPONENT_ENABLED_STATE_DISABLED) return false;
        // DEFAULT: whatever the manifest says
        ActivityInfo ai = pm.getActivityInfo(cn, PackageManager.MATCH_DISABLED_COMPONENTS);
        return ai.enabled;
    }

    static final String[] ICONS = {"tree", "circuit", "crimson", "golden", "terminal", "broadsheet", "midnight", "rose",
        "tree3d", "circuit3d", "crimson3d", "golden3d", "terminal3d", "broadsheet3d", "midnight3d", "rose3d"};

    /** One line such as "tree:off circuit:ON" so the app can show exactly what Android has enabled. */
    static String iconStates(Context c) {
        StringBuilder b = new StringBuilder();
        for (String i : ICONS) {
            String st;
            try {
                st = isAliasEnabled(c, aliasOf(i)) ? "ON" : "off";
            } catch (Throwable t) {
                st = "missing";
            }
            if (b.length() > 0) b.append(' ');
            b.append(i).append(':').append(st);
        }
        return b.toString();
    }

    static String aliasOf(String icon) {
        return "com.cypress.reader.Icon" + Character.toUpperCase(icon.charAt(0)) + icon.substring(1);
    }

    static String getIcon(Context c) throws Exception {
        for (String i : ICONS) {
            if (isAliasEnabled(c, aliasOf(i))) return i;
        }
        return "tree";
    }

    static String setIcon(Context c, String icon) throws Exception {
        boolean known = false;
        for (String i : ICONS) if (i.equals(icon)) known = true;
        if (!known) throw new IllegalArgumentException("unknown icon: " + icon);
        PackageManager pm = c.getPackageManager();
        ComponentName on = new ComponentName(c, aliasOf(icon));
        // Every alias must exist (throws NameNotFoundException if the manifest edit was not applied).
        pm.getActivityInfo(on, PackageManager.MATCH_DISABLED_COMPONENTS);
        // Enable the new one BEFORE disabling the others, so there is always a launcher entry.
        pm.setComponentEnabledSetting(on, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
        for (String i : ICONS) {
            if (i.equals(icon)) continue;
            try {
                ComponentName other = new ComponentName(c, aliasOf(i));
                pm.getActivityInfo(other, PackageManager.MATCH_DISABLED_COMPONENTS);
                pm.setComponentEnabledSetting(other, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
            } catch (PackageManager.NameNotFoundException ignored) {
                // A 3D set that was not built into this version; nothing to disable.
            }
        }
        return icon;
    }

    // ---------------------------------------------------------------- notifications

    static boolean notificationsEnabled(Context c) {
        try {
            return NotificationManagerCompat.from(c).areNotificationsEnabled();
        } catch (Throwable t) {
            return false;
        }
    }

    static void ensureChannels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            NotificationChannel media = new NotificationChannel(CH_MEDIA, "Reading aloud", NotificationManager.IMPORTANCE_LOW);
            media.setShowBadge(false);
            nm.createNotificationChannel(media);
            nm.createNotificationChannel(new NotificationChannel(CH_ALERTS, "Keyword alerts", NotificationManager.IMPORTANCE_DEFAULT));
            nm.createNotificationChannel(new NotificationChannel(CH_PACK, "Morning pack", NotificationManager.IMPORTANCE_DEFAULT));
            nm.createNotificationChannel(new NotificationChannel(CH_DIGEST, "Digest", NotificationManager.IMPORTANCE_LOW));
        } catch (Throwable t) {
            Log.w(TAG, "channels failed: " + t);
        }
    }

    /** PendingIntent that opens the app, optionally telling the web page which link to open. */
    static PendingIntent openIntent(Context c, String url, int requestCode) {
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (url != null && url.length() > 0) i.putExtra(EXTRA_OPEN_URL, url);
        return PendingIntent.getActivity(c, requestCode, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** Posts a notification. Returns false if notifications are off or posting failed. */
    static boolean post(Context c, String channel, int id, String title, String text, String openUrl, String group, boolean summary) {
        try {
            if (!notificationsEnabled(c)) return false;
            ensureChannels(c);
            NotificationCompat.Builder b = new NotificationCompat.Builder(c, channel)
                .setSmallIcon(R.drawable.cy_ic_notif)
                .setColor(0xFF133A28)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(openIntent(c, openUrl, id));
            if (group != null) {
                b.setGroup(group);
                if (summary) b.setGroupSummary(true);
            }
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return false;
            nm.notify(id, b.build());
            return true;
        } catch (Throwable t) {
            Log.w(TAG, "post failed: " + t);
            return false;
        }
    }

    // ---------------------------------------------------------------- files / json helpers

    static String readFile(File f) {
        FileInputStream in = null;
        try {
            if (!f.exists()) return null;
            in = new FileInputStream(f);
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
            return new String(bo.toByteArray(), "UTF-8");
        } catch (Throwable t) {
            return null;
        } finally {
            try {
                if (in != null) in.close();
            } catch (Throwable t) {
                // ignore
            }
        }
    }

    static boolean writeFile(File f, String content) {
        FileOutputStream os = null;
        try {
            File tmp = new File(f.getPath() + ".tmp");
            os = new FileOutputStream(tmp);
            os.write(content.getBytes("UTF-8"));
            os.close();
            os = null;
            if (f.exists()) f.delete();
            return tmp.renameTo(f);
        } catch (Throwable t) {
            return false;
        } finally {
            try {
                if (os != null) os.close();
            } catch (Throwable t) {
                // ignore
            }
        }
    }

    /** Builds a JSObject from a JSON string; empty object on failure. */
    static JSObject obj(String json) {
        try {
            return new JSObject(json);
        } catch (Throwable t) {
            return new JSObject();
        }
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    // ---------------------------------------------------------------- background sync config

    /** Keeps only what the worker understands and stores it. Returns the sanitized config. */
    static JSONObject saveConfig(Context c, JSONObject in) throws Exception {
        JSONObject out = new JSONObject();
        JSONArray feeds = new JSONArray();
        JSONArray inFeeds = in.optJSONArray("feeds");
        if (inFeeds != null) {
            for (int i = 0; i < inFeeds.length() && feeds.length() < 100; i++) {
                JSONObject f = inFeeds.optJSONObject(i);
                if (f == null) continue;
                String url = f.optString("url", "");
                if (!(url.startsWith("http://") || url.startsWith("https://"))) continue;
                JSONObject o = new JSONObject();
                o.put("id", f.optString("id", url));
                o.put("url", url);
                o.put("title", f.optString("title", ""));
                feeds.put(o);
            }
        }
        out.put("feeds", feeds);

        JSONObject a = in.optJSONObject("alerts");
        JSONObject ao = new JSONObject();
        ao.put("enabled", a != null && a.optBoolean("enabled", false));
        JSONArray kw = new JSONArray();
        if (a != null && a.optJSONArray("keywords") != null) {
            JSONArray k = a.optJSONArray("keywords");
            for (int i = 0; i < k.length() && kw.length() < 100; i++) {
                String s = k.optString(i, "").trim();
                if (s.length() > 0) kw.put(s);
            }
        }
        ao.put("keywords", kw);
        JSONArray ids = a == null ? null : a.optJSONArray("feedIds");
        if (ids != null) {
            JSONArray io = new JSONArray();
            for (int i = 0; i < ids.length(); i++) io.put(ids.optString(i, ""));
            ao.put("feedIds", io);
        } else {
            ao.put("feedIds", JSONObject.NULL);
        }
        out.put("alerts", ao);

        JSONObject p = in.optJSONObject("pack");
        JSONObject po = new JSONObject();
        po.put("enabled", p != null && p.optBoolean("enabled", false));
        int hour = p == null ? 7 : p.optInt("hour", 7);
        po.put("hour", Math.max(0, Math.min(23, hour)));
        int count = p == null ? 10 : p.optInt("count", 10);
        po.put("count", Math.max(1, Math.min(50, count)));
        out.put("pack", po);

        JSONObject w = in.optJSONObject("widget");
        JSONObject wo = new JSONObject();
        wo.put("enabled", w != null && w.optBoolean("enabled", false));
        out.put("widget", wo);

        prefs(c).edit().putString("bg_config", out.toString()).apply();
        return out;
    }

    static JSONObject readConfig(Context c) {
        try {
            String s = prefs(c).getString("bg_config", null);
            return s == null ? null : new JSONObject(s);
        } catch (Throwable t) {
            return null;
        }
    }

    static boolean anyEnabled(JSONObject cfg) {
        if (cfg == null) return false;
        JSONArray feeds = cfg.optJSONArray("feeds");
        if (feeds == null || feeds.length() == 0) return false;
        JSONObject a = cfg.optJSONObject("alerts");
        JSONObject p = cfg.optJSONObject("pack");
        JSONObject w = cfg.optJSONObject("widget");
        JSONObject dg = cfg.optJSONObject("digest");
        return (dg != null && dg.optBoolean("enabled", false))
            || (a != null && a.optBoolean("enabled", false))
            || (p != null && p.optBoolean("enabled", false))
            || (w != null && w.optBoolean("enabled", false));
    }

    /** (Re)schedules the hourly sync, or cancels it when nothing needs it. */
    static void schedule(Context c, JSONObject cfg) {
        WorkManager wm = WorkManager.getInstance(c);
        if (!anyEnabled(cfg)) {
            wm.cancelUniqueWork(WORK_NAME);
            return;
        }
        Constraints cons = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(CyBgWorker.class, 60, TimeUnit.MINUTES)
            .setConstraints(cons)
            .build();
        wm.enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, req);
    }

    static void runNow(Context c) {
        OneTimeWorkRequest req = new OneTimeWorkRequest.Builder(CyBgWorker.class).build();
        WorkManager.getInstance(c).enqueueUniqueWork(WORK_NOW, ExistingWorkPolicy.KEEP, req);
    }

    // ---------------------------------------------------------------- widget

    static void saveHeadlines(Context c, JSONArray headlines) {
        try {
            JSONArray out = new JSONArray();
            for (int i = 0; i < headlines.length() && out.length() < 3; i++) {
                JSONObject h = headlines.optJSONObject(i);
                if (h == null) continue;
                String t = h.optString("title", "").trim();
                if (t.length() == 0) continue;
                JSONObject o = new JSONObject();
                o.put("title", t);
                o.put("link", h.optString("link", ""));
                out.put(o);
            }
            prefs(c).edit().putString("widget_headlines", out.toString()).apply();
        } catch (Throwable t) {
            Log.w(TAG, "saveHeadlines failed: " + t);
        }
    }

    static JSONArray readHeadlines(Context c) {
        try {
            String s = prefs(c).getString("widget_headlines", null);
            return s == null ? new JSONArray() : new JSONArray(s);
        } catch (Throwable t) {
            return new JSONArray();
        }
    }

    static void updateWidgets(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            int[] ids = m.getAppWidgetIds(new ComponentName(c, CyWidgetProvider.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews rv = CyWidgetProvider.build(c);
            m.updateAppWidget(ids, rv);
        } catch (Throwable t) {
            Log.w(TAG, "widget update failed: " + t);
        }
    }
}
