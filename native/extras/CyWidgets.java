package com.cypress.reader;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import java.io.File;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The three home-screen widgets (B67): Top Story 2x2 (CyWidgetProvider), Headlines 4x2 (CyWidgetListProvider)
 * and Ticker 4x1 (CyWidgetTickerProvider). This class builds all of them from the stories CyPress last handed over,
 * and runs the shared 15-minute tick that flips the Top Story (every 30 min) and the Ticker (every 15 min).
 */
final class CyWidgets {

    private static final String TAG = "CyWidgets";
    static final String ACT_TICK = "com.cypress.reader.widget.TICK";
    static final String ACT_NEXT = "com.cypress.reader.widget.NEXT";
    static final String ACT_PREV = "com.cypress.reader.widget.PREV";
    static final String ACT_REFRESH = "com.cypress.reader.widget.REFRESH";
    static final long STEP_MS = 15L * 60L * 1000L;
    static final int TOP_N = 5;
    static final int TICK_N = 5;
    private static final long UPDATING_MS = 3L * 60L * 1000L; // an "updating" state older than this is forgotten
    private static final long STALE_MS = 14L * 60L * 60L * 1000L; // older than a morning-to-evening gap: say so

    private CyWidgets() {
    }

    // ---------------------------------------------------------------- state

    private static SharedPreferences sp(Context c) {
        return CyExtras.prefs(c);
    }

    private static int[] ids(Context c, Class<?> k) {
        try {
            int[] a = AppWidgetManager.getInstance(c).getAppWidgetIds(new ComponentName(c, k));
            return a == null ? new int[0] : a;
        } catch (Throwable t) {
            return new int[0];
        }
    }

    static boolean any(Context c) {
        return ids(c, CyWidgetProvider.class).length > 0
            || ids(c, CyWidgetListProvider.class).length > 0
            || ids(c, CyWidgetTickerProvider.class).length > 0;
    }

    private static boolean cycles(Context c) {
        return ids(c, CyWidgetProvider.class).length > 0 || ids(c, CyWidgetTickerProvider.class).length > 0;
    }

    static boolean isUpdating(Context c) {
        long t = sp(c).getLong("widget_upd", 0L);
        return t > 0 && System.currentTimeMillis() - t < UPDATING_MS;
    }

    static void setUpdating(Context c, boolean on) {
        sp(c).edit().putLong("widget_upd", on ? System.currentTimeMillis() : 0L).apply();
    }

    private static boolean isStale(Context c) {
        long t = sp(c).getLong("widget_ts", 0L);
        return t > 0 && System.currentTimeMillis() - t > STALE_MS;
    }

    /** Called with fresh stories: a new top story starts every cycle again from the first one, and any "updating" ends. */
    static void onNewStories(Context c, JSONArray list) {
        try {
            SharedPreferences p = sp(c);
            String first = list.length() > 0 && list.optJSONObject(0) != null ? list.optJSONObject(0).optString("link", "") : "";
            SharedPreferences.Editor e = p.edit();
            if (!first.equals(p.getString("widget_first", ""))) {
                e.putString("widget_first", first).putInt("widget_top_i", 0).putInt("widget_tick_i", 0);
            }
            e.putLong("widget_ts", System.currentTimeMillis()).putLong("widget_upd", 0L).putInt("widget_pf_n", 0).apply();
        } catch (Throwable t) {
            Log.w(TAG, "new stories: " + t);
        }
    }

    /** The edition name for the Headlines header and the stories the Ticker cycles through. */
    static void saveMeta(Context c, String label, JSONArray breaking) {
        try {
            SharedPreferences.Editor e = sp(c).edit();
            if (label != null) e.putString("widget_ed", label);
            if (breaking != null) {
                JSONArray out = new JSONArray();
                for (int i = 0; i < breaking.length() && out.length() < TICK_N; i++) {
                    JSONObject h = breaking.optJSONObject(i);
                    if (h == null) continue;
                    String t = h.optString("title", "").trim();
                    String link = h.optString("link", "");
                    if (t.length() == 0 || !CyExtras.isHttpUrl(link)) continue;
                    JSONObject o = new JSONObject();
                    o.put("title", t);
                    o.put("link", link);
                    o.put("src", h.optString("src", ""));
                    long dt = h.optLong("date", 0L);
                    if (dt > 0) o.put("date", dt);
                    if (h.optBoolean("brk", false)) o.put("brk", true);
                    if (h.optBoolean("read", false)) o.put("read", true);
                    out.put(o);
                }
                e.putString("widget_breaking", out.toString());
            }
            e.apply();
        } catch (Throwable t) {
            Log.w(TAG, "meta: " + t);
        }
    }

    private static JSONArray tickerStories(Context c) {
        try {
            String s = sp(c).getString("widget_breaking", null);
            JSONArray a = s == null ? new JSONArray() : new JSONArray(s);
            if (a.length() > 0) return a;
        } catch (Throwable t) {
            // fall through to the top stories
        }
        return CyExtras.readHeadlines(c);
    }

    private static int wrap(int i, int n) {
        return n <= 0 ? 0 : ((i % n) + n) % n;
    }

    // ---------------------------------------------------------------- the tick

    /** A random secret kept in the app's private storage; the widget's own button intents carry it. */
    static String tok(Context c) {
        android.content.SharedPreferences p = c.getSharedPreferences("cypress", Context.MODE_PRIVATE);
        String t = p.getString("wtok", null);
        if (t == null) { t = java.util.UUID.randomUUID().toString(); p.edit().putString("wtok", t).apply(); }
        return t;
    }

    static boolean tokOk(Context c, android.content.Intent i) {
        String t = i.getStringExtra("t");
        return t != null && t.equals(tok(c));
    }

    private static PendingIntent tickIntent(Context c, int flags) {
        Intent i = new Intent(c, CyWidgetProvider.class);
        i.setAction(ACT_TICK);
        i.putExtra("t", tok(c));
        return PendingIntent.getBroadcast(c, 60, i, PendingIntent.FLAG_IMMUTABLE | flags);
    }

    /** ViewFlipper handles page rotation natively in the launcher; cancel any legacy 15-minute wake alarm. */
    static void arm(Context c, boolean force) {
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            PendingIntent old = tickIntent(c, PendingIntent.FLAG_NO_CREATE);
            if (old != null) {
                am.cancel(old);
                old.cancel();
            }
        } catch (Throwable t) {
            Log.w(TAG, "arm failed: " + t);
        }
    }

    static void tick(Context c) {
        arm(c, false);
    }

    /** The Top Story's arrows: turn the flipper on the home screen right away (it keeps turning by itself afterwards). */
    static void flip(Context c, int dir) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            for (int id : ids(c, CyWidgetProvider.class)) {
                RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_top);
                if (dir < 0) rv.showPrevious(R.id.cy_flipper);
                else rv.showNext(R.id.cy_flipper);
                m.partiallyUpdateAppWidget(id, rv);
            }
        } catch (Throwable t) {
            Log.w(TAG, "flip failed: " + t);
        }
    }

    // ---------------------------------------------------------------- refresh

    static void refreshAll(Context c) {
        refreshTop(c);
        refreshList(c);
        refreshTicker(c);
    }

    static void refreshTop(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            for (int id : ids(c, CyWidgetProvider.class)) {
                try {
                    pushTop(c, m, id);
                } catch (Throwable t) {
                    Log.w(TAG, "top refresh " + id + ": " + t); // one bad widget must not stop the others
                }
            }
        } catch (Throwable t) {
            Log.w(TAG, "top refresh: " + t);
        }
    }

    static void refreshTicker(Context c) {
        try {
            int[] a = ids(c, CyWidgetTickerProvider.class);
            if (a.length > 0) AppWidgetManager.getInstance(c).updateAppWidget(a, buildTicker(c));
        } catch (Throwable t) {
            Log.w(TAG, "ticker refresh: " + t);
        }
    }

    static void refreshList(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            for (int id : ids(c, CyWidgetListProvider.class)) {
                try {
                    m.updateAppWidget(id, buildList(c, widthDp(m, id), heightDp(m, id)));
                } catch (Throwable t) {
                    Log.w(TAG, "list refresh " + id + ": " + t);
                }
            }
        } catch (Throwable t) {
            Log.w(TAG, "list refresh: " + t);
        }
    }

    /** The widget's height on this home screen in dp (the smaller of portrait and landscape, so it always fits). */
    static int heightDp(AppWidgetManager m, int id) {
        try {
            Bundle o = m.getAppWidgetOptions(id);
            if (o == null) return 0;
            int a = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0);
            int b = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
            if (a > 0 && b > 0) return Math.min(a, b);
            int h = Math.max(a, b);
            if (h > 0) return h;
            if (Build.VERSION.SDK_INT >= 31) {
                java.util.ArrayList<android.util.SizeF> sz = o.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES);
                if (sz != null && !sz.isEmpty() && sz.get(0) != null) return Math.round(sz.get(0).getHeight());
            }
            return 0;
        } catch (Throwable t) {
            return 0;
        }
    }

    // ---------------------------------------------------------------- refresh on tap, pictures, reboot

    /** "Tap to refresh": the tap asks the phone to read the feeds now (and shows "Updating…" meanwhile) instead of just opening the app. */
    static PendingIntent refreshIntent(Context c, int code) {
        Intent i = new Intent(c, CyWidgetProvider.class);
        i.setAction(ACT_REFRESH);
        i.putExtra("t", tok(c));
        return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static void refreshNow(Context c) {
        try {
            setUpdating(c, true);
            refreshAll(c);
            CyExtras.runNow(c);
        } catch (Throwable t) {
            Log.w(TAG, "refresh failed: " + t);
        }
    }

    /** After a restart or an app update: alarms are gone and widgets may hold old pictures, so start the cycle again and redraw. */
    static void onBoot(Context c) {
        try {
            arm(c, true);
            refreshAll(c);
            ensurePics(c);
        } catch (Throwable t) {
            Log.w(TAG, "boot failed: " + t);
        }
    }

    /**
     * B83: if a picture the Headlines widget wants is not on the phone yet (the first download came while the phone had no network,
     * or the widget was added before the app had run), fetch it in the background, trying again later with a growing wait.
     */
    static void ensurePics(Context c) {
        try {
            final Context app = c.getApplicationContext();
            JSONArray h = CyExtras.readHeadlines(app);
            boolean missing = false;
            for (int i = 0; i < h.length() && i < TOP_N; i++) {
                JSONObject o = h.optJSONObject(i);
                if (o == null) continue;
                String u = o.optString("img", "");
                if (u.length() == 0) continue;
                File f = CyWidgetProvider.imageFile(app, u);
                if (f == null || !f.isFile()) {
                    missing = true;
                    break;
                }
            }
            if (!missing) return;
            SharedPreferences p = sp(app);
            long now = System.currentTimeMillis();
            int n = p.getInt("widget_pf_n", 0);
            long wait = Math.min(30L * 60L * 1000L, 60000L << Math.min(n, 5)); // 1, 2, 4, 8, 16, 30 minutes
            if (now - p.getLong("widget_pf_t", 0L) < wait) return;
            p.edit().putInt("widget_pf_n", n + 1).putLong("widget_pf_t", now).apply();
            CyExtras.IMG_EXEC.submit(new Runnable() {
                @Override
                public void run() {
                    try {
                        if (CyWidgetProvider.fetchImages(app, CyExtras.readHeadlines(app))) { refreshList(app); refreshTop(app); }
                    } catch (Throwable t) {
                        Log.w(TAG, "picture retry failed: " + t);
                    }
                }
            });
        } catch (Throwable t) {
            Log.w(TAG, "pictures check failed: " + t);
        }
    }

    // ---------------------------------------------------------------- shared look (A1)

    private static int col(Context c, int id) {
        return c.getResources().getColor(id, null); // API 23+; follows the phone's day / night setting
    }

    // The app's theme on the widgets (Android 12+): the app hands over its background, text, accent, quiet-text and line colors.
    // Nothing handed over (the Halcyon theme, or an older Android) = the widgets' own cream and green, as before.
    private static final int T_BG = 0, T_INK = 1, T_ACC = 2, T_MUT = 3, T_LN = 4;

    static void saveTheme(Context c, JSONObject t) {
        try {
            sp(c).edit().putString("widget_theme", t == null ? "" : t.toString()).apply();
        } catch (Throwable e) {
            Log.w(TAG, "theme: " + e);
        }
    }

    /** {background, text, accent, quiet text, line} or null for the widgets' own look. */
    private static int[] theme(Context c) {
        try {
            if (Build.VERSION.SDK_INT < 31) return null;
            String s = sp(c).getString("widget_theme", "");
            if (s.length() == 0) return null;
            JSONObject o = new JSONObject(s);
            String[] k = {"bg", "ink", "a1", "mut", "ln"};
            int[] out = new int[k.length];
            for (int i = 0; i < k.length; i++) out[i] = android.graphics.Color.parseColor(o.getString(k[i])) | 0xFF000000;
            return out;
        } catch (Throwable e) {
            return null;
        }
    }

    /** Recolors a rounded card background, keeping its corners. Only called when theme() is not null (Android 12+). */
    private static void tintBg(RemoteViews rv, int id, int color) {
        if (Build.VERSION.SDK_INT >= 31) rv.setColorStateList(id, "setBackgroundTintList", android.content.res.ColorStateList.valueOf(color));
    }

    private static int ink(Context c, int[] th) { return th != null ? th[T_INK] : col(c, R.color.cy_w_ink); }
    private static int kicker(Context c, int[] th) { return th != null ? th[T_ACC] : col(c, R.color.cy_w_kicker); }
    private static int muted(Context c, int[] th) { return th != null ? th[T_MUT] : col(c, R.color.cy_w_muted); }

    /** "12 MIN", "2H", "3D", or "" when the story has no date. */
    static String ageLabel(long ms) {
        if (ms <= 0) return "";
        long m = (System.currentTimeMillis() - ms) / 60000L;
        if (m < 1) return "JUST NOW";
        if (m < 60) return m + " MIN";
        long h = m / 60;
        if (h < 24) return h + "H";
        return (h / 24) + "D";
    }

    /** Fills w x h from the middle of src (like centerCrop), with rounded corners of radius r pixels (0 = square). */
    private static Bitmap cropFill(Bitmap src, int w, int h, float r) {
        Bitmap.Config cfg = (r > 0f) ? Bitmap.Config.ARGB_8888 : Bitmap.Config.RGB_565;
        Bitmap out = Bitmap.createBitmap(Math.max(1, w), Math.max(1, h), cfg);
        Canvas cv = new Canvas(out);
        float sc = Math.max((float) w / src.getWidth(), (float) h / src.getHeight());
        Matrix m = new Matrix();
        m.setScale(sc, sc);
        m.postTranslate((w - src.getWidth() * sc) / 2f, (h - src.getHeight() * sc) / 2f);
        BitmapShader sh = new BitmapShader(src, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
        sh.setLocalMatrix(m);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        p.setShader(sh);
        cv.drawRoundRect(new RectF(0, 0, w, h), r, r, p);
        return out;
    }

    /** Decodes the downloaded picture file at about the size wanted; null if there is none or it cannot be read. */
    private static Bitmap decodeFor(Context c, String url, int wantW, int wantH, Bitmap.Config cfg) {
        try {
            File f = CyWidgetProvider.imageFile(c, url);
            if (f == null || !f.isFile()) return null;
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(f.getAbsolutePath(), o);
            if (o.outWidth <= 0 || o.outHeight <= 0) return null;
            int s = 1;
            while (o.outWidth / (s * 2) >= wantW && o.outHeight / (s * 2) >= wantH) s *= 2;
            BitmapFactory.Options d = new BitmapFactory.Options();
            d.inSampleSize = s;
            d.inPreferredConfig = cfg;
            return BitmapFactory.decodeFile(f.getAbsolutePath(), d);
        } catch (Throwable t) {
            Log.w(TAG, "picture decode failed: " + t);
            return null;
        }
    }

    /**
     * Hero photo cropped to the card's shape.
     * Memory-safe downsampling and dimension bounds eliminate TransactionTooLargeException.
     */
    private static Bitmap hero(Context c, String url, int wDp, int hDp, boolean fullBleed) {
        return hero(c, url, wDp, hDp, fullBleed, 480f);
    }

    private static Bitmap hero(Context c, String url, int wDp, int hDp, boolean fullBleed, float cap) {
        try {
            float dens = c.getResources().getDisplayMetrics().density;
            int tw = Math.round((wDp > 0 ? wDp : 260) * dens);
            int th = Math.round((hDp > 0 ? hDp : 170) * dens);
            float k = Math.min(1f, cap / Math.max(tw, th)); // cap the bitmap so a widget update stays small
            tw = Math.max(1, Math.round(tw * k));
            th = Math.max(1, Math.round(th * k));
            Bitmap src = decodeFor(c, url, tw, th, Bitmap.Config.RGB_565);
            if (src == null) src = decodeFor(c, url, tw, th, Bitmap.Config.ARGB_8888);
            if (src == null) return null;
            float r = fullBleed ? (Build.VERSION.SDK_INT < 31 ? 20f * dens * k : 0f) : (10f * dens * k);
            return cropFill(src, tw, th, r);
        } catch (Throwable t) {
            Log.w(TAG, "hero failed: " + t);
            return null;
        }
    }

    /** The widget's width in dp (the smaller of portrait and landscape, so it always fits); 0 if unknown. */
    static int widthDp(AppWidgetManager m, int id) {
        try {
            Bundle o = m.getAppWidgetOptions(id);
            if (o == null) return 0;
            int a = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
            int b = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0);
            if (a > 0 && b > 0) return Math.min(a, b);
            int w = Math.max(a, b);
            if (w > 0) return w;
            if (Build.VERSION.SDK_INT >= 31) {
                java.util.ArrayList<android.util.SizeF> sz = o.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES);
                if (sz != null && !sz.isEmpty() && sz.get(0) != null) return Math.round(sz.get(0).getWidth());
            }
            return 0;
        } catch (Throwable t) {
            return 0;
        }
    }

    private static PendingIntent flipIntent(Context c, int dir) {
        Intent i = new Intent(c, CyWidgetProvider.class);
        i.setAction(dir < 0 ? ACT_PREV : ACT_NEXT);
        i.putExtra("t", tok(c));
        return PendingIntent.getBroadcast(c, dir < 0 ? 101 : 102, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    // ---------------------------------------------------------------- Top Story (AdapterViewFlipper Deck)

    static RemoteViews buildTop(Context c) {
        return buildTop(c, 0, 0, 0);
    }

    static RemoteViews buildTop(Context c, int wDp, int hDp) {
        return buildTop(c, 0, wDp, hDp);
    }

    static RemoteViews buildTop(Context c, int appWidgetId, int wDp, int hDp) {
        return buildTop(c, appWidgetId, wDp, hDp, true);
    }

    /** Sends the Top Story with a photo on every page; if this phone refuses an update that large, again with the first photo only. */
    static void pushTop(Context c, AppWidgetManager m, int id) {
        int w = widthDp(m, id), h = heightDp(m, id);
        try {
            m.updateAppWidget(id, buildTop(c, id, w, h, true));
        } catch (Throwable t) {
            Log.w(TAG, "top with all photos refused, first photo only: " + t);
            m.updateAppWidget(id, buildTop(c, id, w, h, false));
        }
    }

    static RemoteViews buildTop(Context c, int appWidgetId, int wDp, int hDp, boolean allPics) {
        try {
            RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_top);
            JSONArray h = CyExtras.readHeadlines(c);
            boolean upd = isUpdating(c), stale = isStale(c);
            java.util.ArrayList<JSONObject> valid = new java.util.ArrayList<>();
            for (int i = 0; i < h.length() && valid.size() < TOP_N; i++) {
                JSONObject o = h.optJSONObject(i);
                if (o == null || o.optString("title", "").length() == 0) continue;
                valid.add(o);
            }
            int pages = valid.size();
            if (pages == 0) {
                rv.setViewVisibility(R.id.cy_flipper, View.GONE);
                rv.setViewVisibility(R.id.cy_wt_empty, View.VISIBLE);
                rv.setTextViewText(R.id.cy_wt_empty_t, upd ? "Updating…" : "Open CyPress to load your stories");
                PendingIntent open = CyExtras.openIntent(c, null, 300);
                rv.setOnClickPendingIntent(android.R.id.background, open);
                rv.setOnClickPendingIntent(R.id.cy_wt_empty, open);
                return rv;
            }

            rv.setViewVisibility(R.id.cy_flipper, View.VISIBLE);
            rv.setViewVisibility(R.id.cy_wt_empty, View.GONE);
            rv.setViewVisibility(R.id.cy_wt_upd, upd ? View.VISIBLE : View.GONE);

            // Previous and Next immediate flip controls
            rv.setOnClickPendingIntent(R.id.cy_wt_prev, flipIntent(c, -1));
            rv.setOnClickPendingIntent(R.id.cy_wt_next, flipIntent(c, 1));

            int[] th = theme(c);
            if (th != null) {
                tintBg(rv, android.R.id.background, th[T_BG]);
                rv.setInt(R.id.cy_wt_empty_t, "setTextColor", th[T_MUT]);
            }
            // Simple ViewFlipper: pages are added directly. Every page carries its photo (later pages a little smaller);
            // allPics=false is the fallback for a phone that refuses the larger update.
            rv.removeAllViews(R.id.cy_flipper);
            for (int i = 0; i < pages; i++) {
                JSONObject o = valid.get(i);
                if (!allPics && i > 0 && o.has("img")) {
                    o = new JSONObject(o.toString());
                    o.remove("img");
                }
                rv.addView(R.id.cy_flipper, buildStackCard(c, o, i, pages, wDp, hDp, false));
            }

            PendingIntent open = stale ? refreshIntent(c, 305) : CyExtras.openIntent(c, null, 300);
            rv.setOnClickPendingIntent(android.R.id.background, open);
            rv.setOnClickPendingIntent(R.id.cy_wt_empty, open);
            return rv;
        } catch (Throwable t) {
            Log.e(TAG, "buildTop failed: " + t, t);
            return buildFallbackTop(c);
        }
    }

    /** Safe fallback layout for Top Story if inflation or data loading encounters any error. */
    static RemoteViews buildFallbackTop(Context c) {
        try {
            RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_top);
            rv.setViewVisibility(R.id.cy_flipper, View.GONE);
            rv.setViewVisibility(R.id.cy_wt_empty, View.VISIBLE);
            rv.setTextViewText(R.id.cy_wt_empty_t, "Open CyPress to load your stories");
            PendingIntent open = CyExtras.openIntent(c, null, 300);
            rv.setOnClickPendingIntent(android.R.id.background, open);
            rv.setOnClickPendingIntent(R.id.cy_wt_empty, open);
            return rv;
        } catch (Throwable t) {
            Log.e(TAG, "buildFallbackTop failed", t);
            return new RemoteViews(c.getPackageName(), R.layout.cy_widget_top);
        }
    }

    /** Static fallback editorial card for CyFlipperRemoteViewsFactory. */
    static RemoteViews buildStaticCard(Context c) {
        try {
            RemoteViews card = new RemoteViews(c.getPackageName(), R.layout.cy_widget_card);
            card.setViewVisibility(R.id.cy_card_img, View.GONE);
            card.setViewVisibility(R.id.cy_card_scrim, View.GONE);
            card.setViewVisibility(R.id.cy_card_fallback, View.VISIBLE);
            card.setTextViewText(R.id.cy_card_folio, "CYPRESS");
            card.setViewVisibility(R.id.cy_card_folio, View.VISIBLE);
            card.setTextViewText(R.id.cy_card_src, "DAILY EDITION");
            card.setViewVisibility(R.id.cy_card_src, View.VISIBLE);
            card.setInt(R.id.cy_card_src, "setTextColor", col(c, R.color.cy_w_brass));
            card.setTextViewText(R.id.cy_card_head, "Open CyPress to read stories");
            card.setInt(R.id.cy_card_head, "setTextColor", col(c, R.color.cy_w_paper));
            card.setOnClickFillInIntent(R.id.cy_card_root, CyExtras.fillInOpenIntent(null));
            return card;
        } catch (Throwable t) {
            Log.e(TAG, "buildStaticCard failed", t);
            return new RemoteViews(c.getPackageName(), R.layout.cy_widget_card);
        }
    }

    /** One full-bleed card item in the AdapterViewFlipper deck. */
    static RemoteViews buildStackCard(Context c, JSONObject o, int position, int total, int wDp, int hDp, boolean inCollection) {
        try {
            RemoteViews card = new RemoteViews(c.getPackageName(), R.layout.cy_widget_card);
            String src = o.optString("src", "").trim();
            String age = ageLabel(o.optLong("date", 0L));
            String kick = src.toUpperCase(Locale.getDefault());
            if (age.length() > 0) kick = kick.length() > 0 ? kick + "  ·  " + age : age;
            if (isStale(c)) kick = "TAP TO REFRESH";

            Bitmap pic = hero(c, o.optString("img", ""), wDp, hDp, true, position == 0 ? 480f : 360f);
            int[] th = theme(c);
            if (pic != null) {
                card.setImageViewBitmap(R.id.cy_card_img, pic);
                card.setViewVisibility(R.id.cy_card_img, View.VISIBLE);
                card.setViewVisibility(R.id.cy_card_scrim, View.VISIBLE);
                card.setViewVisibility(R.id.cy_card_fallback, View.GONE);
                card.setInt(R.id.cy_card_src, "setTextColor", col(c, R.color.cy_w_brass));
                card.setInt(R.id.cy_card_head, "setTextColor", col(c, R.color.cy_w_photo_text));
            } else {
                card.setViewVisibility(R.id.cy_card_img, View.GONE);
                card.setViewVisibility(R.id.cy_card_scrim, View.GONE);
                card.setViewVisibility(R.id.cy_card_fallback, View.VISIBLE);
                card.setInt(R.id.cy_card_src, "setTextColor", col(c, R.color.cy_w_brass));
                card.setInt(R.id.cy_card_head, "setTextColor", col(c, R.color.cy_w_paper));
                if (th != null) { // a story with no photo sits on the theme's own page color
                    tintBg(card, R.id.cy_card_fallback, th[T_BG]);
                    card.setInt(R.id.cy_card_src, "setTextColor", th[T_ACC]);
                    card.setInt(R.id.cy_card_head, "setTextColor", th[T_INK]);
                    card.setInt(R.id.cy_card_sun, "setColorFilter", th[T_ACC]);
                    card.setInt(R.id.cy_card_bar, "setBackgroundColor", th[T_ACC]);
                }
            }

            boolean compact = hDp > 0 && hDp < 140;
            boolean expanded = hDp >= 220;
            card.setTextViewText(R.id.cy_card_folio, "CYPRESS  ·  " + (position + 1) + " / " + Math.max(1, total));
            card.setViewVisibility(R.id.cy_card_folio, compact || (wDp > 0 && wDp < 200) ? View.GONE : View.VISIBLE);
            card.setTextViewText(R.id.cy_card_src, kick);
            card.setViewVisibility(R.id.cy_card_src, kick.length() == 0 ? View.GONE : View.VISIBLE);
            card.setTextViewText(R.id.cy_card_head, o.optString("title", ""));
            card.setTextViewTextSize(R.id.cy_card_head, TypedValue.COMPLEX_UNIT_SP, compact ? 16f : (expanded ? 20f : 19f));
            card.setInt(R.id.cy_card_head, "setMaxLines", compact ? 2 : (expanded ? 4 : 3));

            String link = o.optString("link", "");
            if (inCollection) {
                card.setOnClickFillInIntent(R.id.cy_card_root, CyExtras.fillInOpenIntent(link));
            } else {
                card.setOnClickPendingIntent(R.id.cy_card_root, CyExtras.openIntent(c, link, 310 + position));
            }
            return card;
        } catch (Throwable t) {
            Log.e(TAG, "buildStackCard failed: " + t, t);
            return buildStaticCard(c);
        }
    }

    // ---------------------------------------------------------------- 4x3 / 4x4 Magazine Spread (cy_widget_list)

    static RemoteViews buildList(Context c, int heightDp) {
        return buildList(c, 0, heightDp);
    }

    /** Wide and short: the picture beside the headline, with the next headline underneath. */
    private static RemoteViews buildListWide(Context c, java.util.ArrayList<JSONObject> stories, int widthDp, int heightDp, boolean upd, boolean stale, int[] th) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_list_wide);
        JSONObject lead = stories.get(0);
        String src = lead.optString("src", "").trim().toUpperCase(Locale.getDefault());
        String age = (upd || stale) ? "" : ageLabel(lead.optLong("date", 0L));
        String kick = stale ? "TAP TO REFRESH" : (age.length() > 0 ? (src.length() > 0 ? src + "  ·  " + age : age) : src);
        rv.setTextViewText(R.id.cy_wlw_src, kick);
        rv.setTextViewText(R.id.cy_wlw_head, lead.optString("title", ""));
        rv.setInt(R.id.cy_wlw_head, "setMaxLines", heightDp > 0 && heightDp < 110 ? 2 : 3);
        boolean next = stories.size() > 1 && heightDp >= 110;
        rv.setViewVisibility(R.id.cy_wlw_next, next ? View.VISIBLE : View.GONE);
        if (next) rv.setTextViewText(R.id.cy_wlw_next, "Next: " + stories.get(1).optString("title", ""));
        int picH = Math.max(40, (heightDp > 0 ? heightDp : 120) - 16);
        Bitmap pic = hero(c, lead.optString("img", ""), Math.round((widthDp > 0 ? widthDp : 300) * 0.42f), picH, false, 360f);
        if (pic != null) {
            rv.setImageViewBitmap(R.id.cy_wlw_img, pic);
            rv.setViewVisibility(R.id.cy_wlw_img, View.VISIBLE);
        } else {
            rv.setViewVisibility(R.id.cy_wlw_img, View.GONE);
        }
        rv.setInt(R.id.cy_wlw_src, "setTextColor", kicker(c, th));
        rv.setInt(R.id.cy_wlw_head, "setTextColor", ink(c, th));
        rv.setInt(R.id.cy_wlw_next, "setTextColor", muted(c, th));
        if (th != null) tintBg(rv, android.R.id.background, th[T_BG]);
        ensurePics(c);
        PendingIntent open = stale ? refreshIntent(c, 391) : CyExtras.openIntent(c, lead.optString("link", ""), 401);
        rv.setOnClickPendingIntent(android.R.id.background, open);
        return rv;
    }

    static RemoteViews buildList(Context c, int widthDp, int heightDp) {
        JSONArray h = CyExtras.readHeadlines(c);
        boolean upd = isUpdating(c), stale = isStale(c);
        int[] th = theme(c);
        java.util.ArrayList<JSONObject> stories = new java.util.ArrayList<>();
        for (int i = 0; i < h.length() && stories.size() < 3; i++) {
            JSONObject o = h.optJSONObject(i);
            if (o != null && o.optString("title", "").trim().length() > 0) stories.add(o);
        }
        // A layout for each size: wide and short = picture beside the headline; a small square = one story; otherwise the full spread.
        boolean narrow = widthDp > 0 && widthDp < 230;
        if (!stories.isEmpty() && !narrow && heightDp > 0 && heightDp < 150) {
            try {
                return buildListWide(c, stories, widthDp, heightDp, upd, stale, th);
            } catch (Throwable t) {
                Log.w(TAG, "wide headlines failed, using the spread: " + t);
            }
        }
        boolean single = narrow || (heightDp > 0 && heightDp < 150);
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_list);
        if (th != null) {
            tintBg(rv, android.R.id.background, th[T_BG]);
            rv.setInt(R.id.cy_wsp_bottom, "setBackgroundColor", th[T_BG]);
            rv.setInt(R.id.cy_wsp_hrule, "setBackgroundColor", th[T_LN]);
            rv.setInt(R.id.cy_wsp_vrule, "setBackgroundColor", th[T_LN]);
            rv.setInt(R.id.cy_wl_empty_t, "setTextColor", th[T_MUT]);
        }
        if (stories.isEmpty()) {
            rv.setViewVisibility(R.id.cy_wsp_hero, View.GONE);
            rv.setViewVisibility(R.id.cy_wsp_hrule, View.GONE);
            rv.setViewVisibility(R.id.cy_wsp_bottom, View.GONE);
            rv.setViewVisibility(R.id.cy_wl_empty, View.VISIBLE);
            rv.setTextViewText(R.id.cy_wl_empty_t, upd ? "Updating…" : "Open CyPress to load headlines");
            PendingIntent open = stale ? refreshIntent(c, 391) : CyExtras.openIntent(c, null, 390);
            rv.setOnClickPendingIntent(android.R.id.background, open);
            rv.setOnClickPendingIntent(R.id.cy_wl_empty, open);
            return rv;
        }

        rv.setViewVisibility(R.id.cy_wsp_hero, View.VISIBLE);
        rv.setViewVisibility(R.id.cy_wsp_hrule, single ? View.GONE : View.VISIBLE);
        rv.setViewVisibility(R.id.cy_wsp_bottom, single ? View.GONE : View.VISIBLE);
        rv.setViewVisibility(R.id.cy_wl_empty, View.GONE);
        if (narrow) rv.setTextViewText(R.id.cy_wsp_hero_pill, "CYPRESS"); // the edition name does not fit a small square

        // 1. Lead Hero Story (Top 60%)
        JSONObject lead = stories.get(0);
        String leadSrc = lead.optString("src", "").trim();
        String leadAge = (upd || stale) ? "" : ageLabel(lead.optLong("date", 0L));
        String leadKick = leadSrc.toUpperCase(Locale.getDefault());
        if (leadAge.length() > 0) leadKick = leadKick.length() > 0 ? leadKick + "  ·  " + leadAge : leadAge;
        if (stale) leadKick = "TAP TO REFRESH";
        rv.setTextViewText(R.id.cy_wsp_hero_src, leadKick);
        rv.setTextViewText(R.id.cy_wsp_hero_head, lead.optString("title", ""));

        String ed = sp(c).getString("widget_ed", "");
        if (!narrow) rv.setTextViewText(R.id.cy_wsp_hero_pill, ("CYPRESS  ·  " + (ed.length() > 0 ? ed : "THE FRONT PAGE")).toUpperCase(Locale.getDefault()));

        int heroW = widthDp > 0 ? widthDp : 360;
        int heroH = heightDp > 0 ? Math.round(heightDp * (single ? 1f : 0.6f)) : 150;
        Bitmap leadPic = hero(c, lead.optString("img", ""), heroW, heroH, false);
        if (leadPic != null) {
            rv.setImageViewBitmap(R.id.cy_wsp_hero_img, leadPic);
            rv.setViewVisibility(R.id.cy_wsp_hero_img, View.VISIBLE);
            rv.setViewVisibility(R.id.cy_wsp_hero_scrim, View.VISIBLE);
            rv.setViewVisibility(R.id.cy_wsp_hero_fallback, View.GONE);
            rv.setInt(R.id.cy_wsp_hero_src, "setTextColor", col(c, R.color.cy_w_brass));
            rv.setInt(R.id.cy_wsp_hero_head, "setTextColor", col(c, R.color.cy_w_photo_text));
        } else {
            rv.setViewVisibility(R.id.cy_wsp_hero_img, View.GONE);
            rv.setViewVisibility(R.id.cy_wsp_hero_scrim, View.GONE);
            rv.setViewVisibility(R.id.cy_wsp_hero_fallback, View.VISIBLE);
            rv.setInt(R.id.cy_wsp_hero_src, "setTextColor", col(c, R.color.cy_w_brass));
            rv.setInt(R.id.cy_wsp_hero_head, "setTextColor", col(c, R.color.cy_w_paper));
            if (th != null) {
                tintBg(rv, R.id.cy_wsp_hero_fallback, th[T_BG]);
                rv.setInt(R.id.cy_wsp_hero_src, "setTextColor", th[T_ACC]);
                rv.setInt(R.id.cy_wsp_hero_head, "setTextColor", th[T_INK]);
                rv.setInt(R.id.cy_wsp_hero_sun, "setColorFilter", th[T_ACC]);
            }
        }
        rv.setOnClickPendingIntent(R.id.cy_wsp_hero, stale ? refreshIntent(c, 391) : CyExtras.openIntent(c, lead.optString("link", ""), 401));

        // 2. Secondary Brief 1 (Bottom Left)
        if (stories.size() > 1) {
            JSONObject b1 = stories.get(1);
            String b1Src = b1.optString("src", "").trim().toUpperCase(Locale.getDefault());
            String b1Age = (upd || stale) ? "" : ageLabel(b1.optLong("date", 0L));
            String b1Kick = b1Age.length() > 0 ? (b1Src.length() > 0 ? b1Src + "  ·  " + b1Age : b1Age) : b1Src;
            rv.setTextViewText(R.id.cy_wsp_b1_src, b1Kick);
            rv.setTextViewText(R.id.cy_wsp_b1_head, b1.optString("title", ""));
            rv.setInt(R.id.cy_wsp_b1_src, "setTextColor", kicker(c, th));
            rv.setInt(R.id.cy_wsp_b1_head, "setTextColor", ink(c, th));
            rv.setViewVisibility(R.id.cy_wsp_b1, View.VISIBLE);
            rv.setOnClickPendingIntent(R.id.cy_wsp_b1, stale ? refreshIntent(c, 391) : CyExtras.openIntent(c, b1.optString("link", ""), 402));
        } else {
            rv.setViewVisibility(R.id.cy_wsp_b1, View.GONE);
        }

        // 3. Secondary Brief 2 (Bottom Right)
        if (stories.size() > 2) {
            JSONObject b2 = stories.get(2);
            String b2Src = b2.optString("src", "").trim().toUpperCase(Locale.getDefault());
            String b2Age = (upd || stale) ? "" : ageLabel(b2.optLong("date", 0L));
            String b2Kick = b2Age.length() > 0 ? (b2Src.length() > 0 ? b2Src + "  ·  " + b2Age : b2Age) : b2Src;
            rv.setTextViewText(R.id.cy_wsp_b2_src, b2Kick);
            rv.setTextViewText(R.id.cy_wsp_b2_head, b2.optString("title", ""));
            rv.setInt(R.id.cy_wsp_b2_src, "setTextColor", kicker(c, th));
            rv.setInt(R.id.cy_wsp_b2_head, "setTextColor", ink(c, th));
            rv.setViewVisibility(R.id.cy_wsp_b2, View.VISIBLE);
            rv.setViewVisibility(R.id.cy_wsp_vrule, View.VISIBLE);
            rv.setOnClickPendingIntent(R.id.cy_wsp_b2, stale ? refreshIntent(c, 391) : CyExtras.openIntent(c, b2.optString("link", ""), 403));
        } else {
            rv.setViewVisibility(R.id.cy_wsp_b2, View.GONE);
            rv.setViewVisibility(R.id.cy_wsp_vrule, View.GONE);
        }

        ensurePics(c);
        PendingIntent bgOpen = stale ? refreshIntent(c, 391) : CyExtras.openIntent(c, null, 390);
        rv.setOnClickPendingIntent(android.R.id.background, bgOpen);
        return rv;
    }

    /** The Headlines widget's first story: big photo, brass kicker, serif headline over the fade. */
    private static RemoteViews featureCard(Context c, JSONObject o, int idx, int wDp, int hDp, boolean inCollection, boolean stale) {
        RemoteViews f = new RemoteViews(c.getPackageName(), R.layout.cy_widget_feature);
        String src = o.optString("src", "").trim();
        String age = ageLabel(o.optLong("date", 0L));
        String kick = src.toUpperCase(Locale.getDefault());
        if (age.length() > 0) kick = kick.length() > 0 ? kick + "  ·  " + age : age;
        f.setTextViewText(R.id.cy_wf_src, kick);
        f.setViewVisibility(R.id.cy_wf_src, kick.length() == 0 ? View.GONE : View.VISIBLE);
        f.setTextViewText(R.id.cy_wf_head, o.optString("title", ""));
        Bitmap pic = hero(c, o.optString("img", ""), wDp, hDp, false);
        if (pic != null) {
            f.setImageViewBitmap(R.id.cy_wf_img, pic);
            f.setViewVisibility(R.id.cy_wf_img, View.VISIBLE);
            f.setViewVisibility(R.id.cy_wf_scrim, View.VISIBLE);
            f.setViewVisibility(R.id.cy_wf_sun_box, View.GONE);
            f.setInt(R.id.cy_wf_frame, "setBackgroundResource", R.drawable.cy_w_photo_frame);
            f.setInt(R.id.cy_wf_src, "setTextColor", col(c, R.color.cy_w_brass));
            f.setInt(R.id.cy_wf_head, "setTextColor", col(c, R.color.cy_w_photo_text));
        } else {
            f.setViewVisibility(R.id.cy_wf_img, View.GONE);
            f.setViewVisibility(R.id.cy_wf_scrim, View.GONE);
            f.setViewVisibility(R.id.cy_wf_sun_box, View.VISIBLE);
            f.setInt(R.id.cy_wf_frame, "setBackgroundResource", R.drawable.cy_w_frame);
            f.setInt(R.id.cy_wf_src, "setTextColor", col(c, R.color.cy_w_kicker));
            f.setInt(R.id.cy_wf_head, "setTextColor", col(c, R.color.cy_w_ink));
        }
        if (o.optBoolean("read", false)) f.setFloat(R.id.cy_wf_head, "setAlpha", 0.7f);
        String link = o.optString("link", "");
        if (inCollection) {
            f.setOnClickFillInIntent(R.id.cy_wf_root, CyExtras.fillInOpenIntent(link));
        } else {
            f.setOnClickPendingIntent(R.id.cy_wf_root, stale ? refreshIntent(c, 391) : CyExtras.openIntent(c, link, 400 + idx));
        }
        return f;
    }

    /** A standard story row in the Headlines widget: photo or sun ornament fallback. */
    private static RemoteViews rowCard(Context c, JSONObject o, int idx, int k, int total, boolean pics, boolean feature, boolean inCollection, boolean stale) {
        RemoteViews row = new RemoteViews(c.getPackageName(), R.layout.cy_widget_row);
        float dens = c.getResources().getDisplayMetrics().density;
        String src = o.optString("src", "").trim().toUpperCase(Locale.getDefault());
        String age = ageLabel(o.optLong("date", 0L));
        String kick = age.length() > 0 ? (src.length() > 0 ? src + "  ·  " + age : age) : src;
        row.setTextViewText(R.id.cy_wr_src, kick);
        row.setViewVisibility(R.id.cy_wr_src, kick.length() == 0 ? View.GONE : View.VISIBLE);
        row.setTextViewText(R.id.cy_wr_head, o.optString("title", ""));
        row.setInt(R.id.cy_wr_head, "setMaxLines", pics ? 2 : 1);
        if (k == 0 && !feature) row.setTextViewTextSize(R.id.cy_wr_head, TypedValue.COMPLEX_UNIT_SP, 16f);
        Bitmap b = null;
        if (pics) {
            int px = Math.round(52f * dens);
            Bitmap raw = decodeFor(c, o.optString("img", ""), px, px, Bitmap.Config.RGB_565);
            if (raw == null) raw = decodeFor(c, o.optString("img", ""), px, px, Bitmap.Config.ARGB_8888);
            if (raw != null) b = cropFill(raw, px, px, 10f * dens);
        }
        if (b != null) {
            row.setImageViewBitmap(R.id.cy_wr_img, b);
            row.setViewVisibility(R.id.cy_wr_img, View.VISIBLE);
            row.setViewVisibility(R.id.cy_wr_sun_box, View.GONE);
        } else {
            row.setViewVisibility(R.id.cy_wr_img, View.GONE);
            row.setViewVisibility(R.id.cy_wr_sun_box, pics ? View.VISIBLE : View.GONE);
        }
        row.setViewVisibility(R.id.cy_wr_rule, k == total - 1 ? View.GONE : View.VISIBLE);
        if (o.optBoolean("read", false)) {
            row.setFloat(R.id.cy_wr_head, "setAlpha", 0.55f);
            row.setFloat(R.id.cy_wr_src, "setAlpha", 0.55f);
            row.setFloat(R.id.cy_wr_img, "setAlpha", 0.6f);
        }
        String link = o.optString("link", "");
        if (inCollection) {
            row.setOnClickFillInIntent(R.id.cy_wr_root, CyExtras.fillInOpenIntent(link));
        } else {
            row.setOnClickPendingIntent(R.id.cy_wr_root, stale ? refreshIntent(c, 391) : CyExtras.openIntent(c, link, 400 + idx));
        }
        return row;
    }

    // ---------------------------------------------------------------- Ticker 4x1

    static RemoteViews buildTicker(Context c) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_ticker);
        JSONArray h = tickerStories(c), pics = CyExtras.readHeadlines(c);
        boolean upd = isUpdating(c), stale = isStale(c);
        float dens = c.getResources().getDisplayMetrics().density;
        int[] th = theme(c);
        if (th != null) {
            tintBg(rv, android.R.id.background, th[T_BG]);
            rv.setInt(R.id.cy_wk_empty, "setTextColor", th[T_MUT]);
        }
        rv.removeAllViews(R.id.cy_wk_flip);
        int pages = 0;
        for (int i = 0; i < h.length() && pages < TICK_N; i++) {
            JSONObject o = h.optJSONObject(i);
            if (o == null || o.optString("title", "").length() == 0) continue;
            RemoteViews pg = new RemoteViews(c.getPackageName(), R.layout.cy_widget_ticker_page);
            String kick = stale ? "TAP TO REFRESH" : (upd ? "UPDATING…" : (o.optBoolean("brk", false) ? "BREAKING" : "LATEST"));
            String age = (upd || stale) ? "" : ageLabel(o.optLong("date", 0L));
            String src = o.optString("src", "").trim().toUpperCase(Locale.getDefault());
            if (!stale && !upd && src.length() > 0) kick = kick + "  ·  " + src;
            if (age.length() > 0) kick = kick + "  ·  " + age;
            pg.setTextViewText(R.id.cy_wq_src, kick);
            pg.setInt(R.id.cy_wq_src, "setTextColor", kicker(c, th));
            pg.setTextViewText(R.id.cy_wq_head, o.optString("title", ""));
            pg.setInt(R.id.cy_wq_head, "setTextColor", ink(c, th));
            pg.setFloat(R.id.cy_wq_head, "setAlpha", upd ? 0.5f : (o.optBoolean("read", false) ? 0.6f : 1f));
            String link = o.optString("link", "");
            String img = o.optString("img", "");
            for (int k = 0; img.length() == 0 && k < pics.length(); k++) {
                JSONObject q = pics.optJSONObject(k);
                if (q != null && link.equals(q.optString("link", ""))) img = q.optString("img", "");
            }
            Bitmap b = null;
            if (img.length() > 0) {
                int px = Math.round(52f * dens);
                Bitmap raw = decodeFor(c, img, px, px, Bitmap.Config.RGB_565);
                if (raw == null) raw = decodeFor(c, img, px, px, Bitmap.Config.ARGB_8888);
                if (raw != null) b = cropFill(raw, px, px, 10f * dens);
            }
            if (b != null) {
                pg.setImageViewBitmap(R.id.cy_wq_img, b);
                pg.setViewVisibility(R.id.cy_wq_img, View.VISIBLE);
                pg.setViewVisibility(R.id.cy_wq_sun_box, View.GONE);
                pg.setViewVisibility(R.id.cy_wq_bar, View.GONE);
            } else {
                pg.setViewVisibility(R.id.cy_wq_img, View.GONE);
                pg.setViewVisibility(R.id.cy_wq_sun_box, View.VISIBLE);
                pg.setViewVisibility(R.id.cy_wq_bar, View.GONE);
            }
            pg.setOnClickPendingIntent(R.id.cy_wq_root, stale ? refreshIntent(c, 511) : CyExtras.openIntent(c, link, 510 + i));
            rv.addView(R.id.cy_wk_flip, pg);
            pages++;
        }
        if (pages == 0) {
            rv.setViewVisibility(R.id.cy_wk_flip, View.GONE);
            rv.setViewVisibility(R.id.cy_wk_empty, View.VISIBLE);
            rv.setTextViewText(R.id.cy_wk_empty, upd ? "Updating…" : "Open CyPress to load headlines");
            rv.setOnClickPendingIntent(android.R.id.background, CyExtras.openIntent(c, null, 500));
        } else {
            rv.setViewVisibility(R.id.cy_wk_flip, View.VISIBLE);
            rv.setViewVisibility(R.id.cy_wk_empty, View.GONE);
        }
        return rv;
    }

    // ---------------------------------------------------------------- test pictures

    /**
     * Draws the widgets the way a home screen would (the same RemoteViews, applied in this app) and returns them as JPEGs (base64),
     * so the device test can look at them. A widget that cannot be built or applied is reported as "<name>_error".
     */
    static JSONObject probe(Context ctx) {
        final Context c = ctx.getApplicationContext(); // like a home screen: plain Android views, not the app's own styled ones
        JSONObject out = new JSONObject();
        String[] names = {"top-4x3", "top-4x3-page3", "top-2x2", "headlines-4x3", "headlines-4x1", "headlines-2x2", "ticker"};
        int[][] sz = {{300, 226, 0}, {300, 226, 2}, {146, 146, 1}, {300, 226, 0}, {300, 120, 0}, {146, 146, 0}, {300, 64, 0}};
        float d = c.getResources().getDisplayMetrics().density;
        for (int i = 0; i < names.length; i++) {
            try {
                int w = sz[i][0], h = sz[i][1];
                RemoteViews rv = i < 3 ? buildTop(c, 0, w, h, true) : (i < 6 ? buildList(c, w, h) : buildTicker(c));
                View v = rv.apply(c, new android.widget.FrameLayout(c));
                android.widget.ViewFlipper f = v.findViewById(R.id.cy_flipper);
                if (f != null && sz[i][2] > 0 && f.getChildCount() > sz[i][2]) {
                    f.setInAnimation(null);
                    f.setOutAnimation(null);
                    f.setDisplayedChild(sz[i][2]);
                }
                int pw = Math.round(w * d), ph = Math.round(h * d);
                v.measure(View.MeasureSpec.makeMeasureSpec(pw, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(ph, View.MeasureSpec.EXACTLY));
                v.layout(0, 0, pw, ph);
                Bitmap b = Bitmap.createBitmap(pw, ph, Bitmap.Config.ARGB_8888);
                Canvas cv = new Canvas(b);
                cv.drawColor(0xFF51656D);
                v.draw(cv);
                java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
                b.compress(Bitmap.CompressFormat.JPEG, 88, bo);
                out.put(names[i], android.util.Base64.encodeToString(bo.toByteArray(), android.util.Base64.NO_WRAP));
            } catch (Throwable t) {
                try { out.put(names[i] + "_error", String.valueOf(t)); } catch (Throwable e) { /* nothing to report with */ }
            }
        }
        return out;
    }
}
