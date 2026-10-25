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

    private static PendingIntent tickIntent(Context c, int flags) {
        Intent i = new Intent(c, CyWidgetProvider.class);
        i.setAction(ACT_TICK);
        return PendingIntent.getBroadcast(c, 60, i, PendingIntent.FLAG_IMMUTABLE | flags);
    }

    /** Makes sure one 15-minute alarm is waiting while a Top Story or Ticker is on a home screen; cancels it when none is. */
    static void arm(Context c, boolean force) {
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            if (!cycles(c)) {
                PendingIntent old = tickIntent(c, PendingIntent.FLAG_NO_CREATE);
                if (old != null) {
                    am.cancel(old);
                    old.cancel();
                }
                return;
            }
            if (!force && tickIntent(c, PendingIntent.FLAG_NO_CREATE) != null) return;
            PendingIntent pi = tickIntent(c, PendingIntent.FLAG_UPDATE_CURRENT);
            long at = SystemClock.elapsedRealtime() + STEP_MS;
            if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME, at, pi);
            else am.set(AlarmManager.ELAPSED_REALTIME, at, pi);
        } catch (Throwable t) {
            Log.w(TAG, "arm failed: " + t);
        }
    }

    static void tick(Context c) {
        try {
            SharedPreferences p = sp(c);
            int n = p.getInt("widget_tc", 0) + 1;
            SharedPreferences.Editor e = p.edit().putInt("widget_tc", n);
            e.putInt("widget_tick_i", p.getInt("widget_tick_i", 0) + 1);
            if (n % 2 == 0) e.putInt("widget_top_i", p.getInt("widget_top_i", 0) + 1); // the Top Story flips every 30 minutes
            e.apply();
            refreshTop(c);
            refreshTicker(c);
        } catch (Throwable t) {
            Log.w(TAG, "tick failed: " + t);
        }
        arm(c, true);
    }

    /** The Top Story's arrows. */
    static void flip(Context c, int dir) {
        try {
            SharedPreferences p = sp(c);
            p.edit().putInt("widget_top_i", p.getInt("widget_top_i", 0) + dir).apply();
            refreshTop(c);
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
            for (int id : ids(c, CyWidgetProvider.class)) m.updateAppWidget(id, buildTop(c, widthDp(m, id), heightDp(m, id)));
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
            for (int id : ids(c, CyWidgetListProvider.class)) m.updateAppWidget(id, buildList(c, heightDp(m, id)));
        } catch (Throwable t) {
            Log.w(TAG, "list refresh: " + t);
        }
    }

    /** The widget's height on this home screen in dp (the smaller of portrait and landscape, so it always fits). */
    static int heightDp(AppWidgetManager m, int id) {
        try {
            Bundle o = m.getAppWidgetOptions(id);
            int a = o == null ? 0 : o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0);
            int b = o == null ? 0 : o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
            if (a > 0 && b > 0) return Math.min(a, b);
            return Math.max(a, b);
        } catch (Throwable t) {
            return 0;
        }
    }

    // ---------------------------------------------------------------- refresh on tap, pictures, reboot

    /** "Tap to refresh": the tap asks the phone to read the feeds now (and shows "Updating…" meanwhile) instead of just opening the app. */
    static PendingIntent refreshIntent(Context c, int code) {
        Intent i = new Intent(c, CyWidgetProvider.class);
        i.setAction(ACT_REFRESH);
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
            for (int i = 0; i < h.length() && i < 4; i++) {
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
                        if (CyWidgetProvider.fetchImages(app, CyExtras.readHeadlines(app))) refreshList(app);
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
        Bitmap out = Bitmap.createBitmap(Math.max(1, w), Math.max(1, h), Bitmap.Config.ARGB_8888);
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

    /** The Top Story photo, cropped to the widget's shape. Below Android 12 the corners are rounded here (12+ rounds the widget itself). */
    private static Bitmap hero(Context c, String url, int wDp, int hDp) {
        try {
            float dens = c.getResources().getDisplayMetrics().density;
            int tw = Math.round((wDp > 0 ? wDp : 250) * dens);
            int th = Math.round((hDp > 0 ? hDp : 160) * dens);
            float k = Math.min(1f, 720f / Math.max(tw, th)); // keep the bitmap well inside the RemoteViews size budget
            tw = Math.max(1, Math.round(tw * k));
            th = Math.max(1, Math.round(th * k));
            Bitmap src = decodeFor(c, url, tw, th, Bitmap.Config.ARGB_8888);
            if (src == null) return null;
            float r = Build.VERSION.SDK_INT < 31 ? 20f * dens * k : 0f;
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
            int a = o == null ? 0 : o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
            int b = o == null ? 0 : o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0);
            if (a > 0 && b > 0) return Math.min(a, b);
            return Math.max(a, b);
        } catch (Throwable t) {
            return 0;
        }
    }

    // ---------------------------------------------------------------- Top Story (resizable, 3x2 by default)

    static RemoteViews buildTop(Context c) {
        return buildTop(c, 0, 0);
    }

    static RemoteViews buildTop(Context c, int wDp, int hDp) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_top);
        JSONArray h = CyExtras.readHeadlines(c);
        int n = Math.min(h.length(), TOP_N);
        int i = wrap(sp(c).getInt("widget_top_i", 0), n);
        JSONObject o = n > 0 ? h.optJSONObject(i) : null;
        boolean upd = isUpdating(c);
        if (o == null || o.optString("title", "").length() == 0) {
            // designed empty state: the mark and "Updating…" (or what to do), no arrows
            rv.setViewVisibility(R.id.cy_wt_body, View.GONE);
            rv.setViewVisibility(R.id.cy_wt_empty, View.VISIBLE);
            rv.setTextViewText(R.id.cy_wt_empty_t, upd ? "Updating…" : "Open CyPress to load your top stories");
            PendingIntent open = CyExtras.openIntent(c, null, 300);
            rv.setOnClickPendingIntent(android.R.id.background, open);
            rv.setOnClickPendingIntent(R.id.cy_wt_empty, open);
            return rv;
        }
        String link = o.optString("link", "");
        String src = o.optString("src", "").trim();
        String age = ageLabel(o.optLong("date", 0L));
        String kick = src.toUpperCase(Locale.getDefault());
        if (age.length() > 0) kick = kick.length() > 0 ? kick + "  ·  " + age : age;
        Bitmap pic = hero(c, o.optString("img", ""), wDp, hDp);
        if (pic != null) {
            rv.setImageViewBitmap(R.id.cy_wt_img, pic);
            rv.setViewVisibility(R.id.cy_wt_img, View.VISIBLE);
            rv.setViewVisibility(R.id.cy_wt_scrim, View.VISIBLE);
            rv.setViewVisibility(R.id.cy_wt_frame, View.GONE);
            rv.setInt(R.id.cy_wt_src, "setTextColor", col(c, R.color.cy_w_brass));
            rv.setInt(R.id.cy_wt_head, "setTextColor", col(c, R.color.cy_w_photo_text));
            rv.setInt(R.id.cy_wt_pos, "setTextColor", col(c, R.color.cy_w_photo_sub));
        }
        rv.setTextViewText(R.id.cy_wt_src, kick);
        rv.setViewVisibility(R.id.cy_wt_src, kick.length() == 0 ? View.GONE : View.VISIBLE);
        rv.setTextViewText(R.id.cy_wt_head, o.optString("title", ""));
        boolean many = n > 1;
        rv.setViewVisibility(R.id.cy_wt_prev, many ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.cy_wt_next, many ? View.VISIBLE : View.GONE);
        rv.setTextViewText(R.id.cy_wt_pos, isStale(c) ? "TAP TO REFRESH" : (many ? (i + 1) + " / " + n : "CYPRESS"));
        rv.setViewVisibility(R.id.cy_wt_upd, upd ? View.VISIBLE : View.GONE);
        float alpha = upd ? 0.5f : (o.optBoolean("read", false) ? 0.6f : 1f);
        rv.setFloat(R.id.cy_wt_head, "setAlpha", alpha);
        PendingIntent story = isStale(c) ? refreshIntent(c, 311) : CyExtras.openIntent(c, link, 310 + i);
        rv.setOnClickPendingIntent(android.R.id.background, story);
        rv.setOnClickPendingIntent(R.id.cy_wt_head, story);
        rv.setOnClickPendingIntent(R.id.cy_wt_src, story);
        rv.setOnClickPendingIntent(R.id.cy_wt_prev, step(c, ACT_PREV, 301));
        rv.setOnClickPendingIntent(R.id.cy_wt_next, step(c, ACT_NEXT, 302));
        return rv;
    }

    private static PendingIntent step(Context c, String action, int code) {
        Intent i = new Intent(c, CyWidgetProvider.class);
        i.setAction(action);
        return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    // ---------------------------------------------------------------- Headlines 4x2

    /**
     * A3: two rows with pictures from 140dp tall, three from 190dp, four from 250dp, five from 330dp;
     * under 140dp three one-line rows without pictures. The first row's headline is a little larger.
     */
    static RemoteViews buildList(Context c, int heightDp) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_list);
        JSONArray h = CyExtras.readHeadlines(c);
        boolean pics = heightDp >= 140; // was 170: pictures from two cells tall
        int want = heightDp >= 330 ? 5 : (heightDp >= 250 ? 4 : (heightDp >= 190 ? 3 : (pics ? 2 : 3)));
        float dens = c.getResources().getDisplayMetrics().density;
        java.util.ArrayList<JSONObject> rows = new java.util.ArrayList<>();
        java.util.ArrayList<Integer> at = new java.util.ArrayList<>();
        for (int i = 0; i < h.length() && rows.size() < want; i++) {
            JSONObject o = h.optJSONObject(i);
            if (o == null || o.optString("title", "").length() == 0) continue;
            rows.add(o);
            at.add(i);
        }
        rv.removeAllViews(R.id.cy_wl_list);
        for (int k = 0; k < rows.size(); k++) {
            JSONObject o = rows.get(k);
            RemoteViews row = new RemoteViews(c.getPackageName(), R.layout.cy_widget_row);
            String src = o.optString("src", "").trim();
            row.setTextViewText(R.id.cy_wr_src, src.toUpperCase(Locale.getDefault()));
            row.setViewVisibility(R.id.cy_wr_src, src.length() == 0 ? View.GONE : View.VISIBLE);
            row.setTextViewText(R.id.cy_wr_head, o.optString("title", ""));
            row.setInt(R.id.cy_wr_head, "setMaxLines", pics ? 2 : 1);
            if (k == 0) row.setTextViewTextSize(R.id.cy_wr_head, TypedValue.COMPLEX_UNIT_SP, 16f);
            Bitmap b = null;
            if (pics) {
                int px = Math.round(48f * dens);
                Bitmap raw = decodeFor(c, o.optString("img", ""), px, px, Bitmap.Config.ARGB_8888);
                if (raw != null) b = cropFill(raw, px, px, 10f * dens);
            }
            if (b != null) {
                row.setImageViewBitmap(R.id.cy_wr_img, b);
                row.setViewVisibility(R.id.cy_wr_img, View.VISIBLE);
            } else {
                row.setViewVisibility(R.id.cy_wr_img, View.GONE);
            }
            row.setViewVisibility(R.id.cy_wr_rule, k == rows.size() - 1 ? View.GONE : View.VISIBLE);
            if (o.optBoolean("read", false)) {
                row.setFloat(R.id.cy_wr_head, "setAlpha", 0.55f);
                row.setFloat(R.id.cy_wr_src, "setAlpha", 0.55f);
                row.setFloat(R.id.cy_wr_img, "setAlpha", 0.6f);
            }
            row.setOnClickPendingIntent(R.id.cy_wr_root, CyExtras.openIntent(c, o.optString("link", ""), 400 + at.get(k)));
            rv.addView(R.id.cy_wl_list, row);
        }
        int shown = rows.size();
        rv.setViewVisibility(R.id.cy_wl_list, shown == 0 ? View.GONE : View.VISIBLE);
        rv.setViewVisibility(R.id.cy_wl_empty, shown == 0 ? View.VISIBLE : View.GONE);
        boolean upd = isUpdating(c);
        rv.setTextViewText(R.id.cy_wl_empty_t, upd ? "Updating…" : "Open CyPress to load your headlines");
        String ed = sp(c).getString("widget_ed", "");
        rv.setTextViewText(R.id.cy_wl_ed, upd ? "UPDATING…" : (isStale(c) ? "TAP TO REFRESH" : (ed.length() > 0 ? ed : "The art of staying informed.").toUpperCase(Locale.getDefault())));
        if (pics) ensurePics(c);
        PendingIntent open = isStale(c) ? refreshIntent(c, 391) : CyExtras.openIntent(c, null, 390);
        rv.setOnClickPendingIntent(android.R.id.background, open);
        rv.setOnClickPendingIntent(R.id.cy_wl_head, open);
        rv.setOnClickPendingIntent(R.id.cy_wl_empty, open);
        return rv;
    }

    // ---------------------------------------------------------------- Ticker 4x1

    static RemoteViews buildTicker(Context c) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_ticker);
        JSONArray h = tickerStories(c);
        int n = Math.min(h.length(), TICK_N);
        int i = wrap(sp(c).getInt("widget_tick_i", 0), n);
        JSONObject o = n > 0 ? h.optJSONObject(i) : null;
        boolean upd = isUpdating(c);
        if (o == null || o.optString("title", "").length() == 0) {
            rv.setTextViewText(R.id.cy_wk_src, "CYPRESS");
            rv.setTextViewText(R.id.cy_wk_time, "");
            rv.setTextViewText(R.id.cy_wk_head, upd ? "Updating…" : "Open CyPress to load headlines");
            rv.setInt(R.id.cy_wk_head, "setTextColor", col(c, R.color.cy_w_muted));
            rv.setOnClickPendingIntent(android.R.id.background, CyExtras.openIntent(c, null, 500));
            return rv;
        }
        boolean stale = isStale(c);
        String kick = stale ? "TAP TO REFRESH" : (upd ? "UPDATING…" : (o.optBoolean("brk", false) ? "BREAKING" : "LATEST"));
        String age = (upd || stale) ? "" : ageLabel(o.optLong("date", 0L));
        rv.setTextViewText(R.id.cy_wk_src, kick);
        rv.setTextViewText(R.id.cy_wk_time, age.length() > 0 ? "  ·  " + age : "");
        rv.setTextViewText(R.id.cy_wk_head, o.optString("title", ""));
        rv.setFloat(R.id.cy_wk_head, "setAlpha", upd ? 0.5f : (o.optBoolean("read", false) ? 0.6f : 1f));
        PendingIntent story = stale ? refreshIntent(c, 511) : CyExtras.openIntent(c, o.optString("link", ""), 510 + i);
        rv.setOnClickPendingIntent(android.R.id.background, story);
        rv.setOnClickPendingIntent(R.id.cy_wk_head, story);
        return rv;
    }
}
