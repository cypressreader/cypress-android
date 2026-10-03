package com.cypress.reader;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Home-screen widget: top stories as photo cards, one at a time with a peek at the next. It switches by itself
 * every few seconds and with the arrow buttons; tapping a card opens that story in CyPress.
 */
public class CyWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "CyWidget";
    static final String ACT_NEXT = "com.cypress.reader.widget.NEXT";
    static final String ACT_PREV = "com.cypress.reader.widget.PREV";
    static final int MAX = 6;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        try {
            RemoteViews rv = build(context);
            for (int id : appWidgetIds) manager.updateAppWidget(id, rv);
        } catch (Throwable t) {
            // a broken widget must never crash the app
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        try {
            String a = intent == null ? null : intent.getAction();
            boolean next = ACT_NEXT.equals(a);
            if (!next && !ACT_PREV.equals(a)) return;
            AppWidgetManager m = AppWidgetManager.getInstance(context);
            int[] ids = m.getAppWidgetIds(new ComponentName(context, CyWidgetProvider.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.cy_widget);
            if (next) rv.showNext(R.id.cy_w_flip);
            else rv.showPrevious(R.id.cy_w_flip);
            m.partiallyUpdateAppWidget(ids, rv);
        } catch (Throwable t) {
            Log.w(TAG, "switch failed: " + t);
        }
    }

    private static PendingIntent switchIntent(Context c, String action, int code) {
        Intent i = new Intent(c, CyWidgetProvider.class);
        i.setAction(action);
        return PendingIntent.getBroadcast(c, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    static RemoteViews build(Context c) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget);
        JSONArray h = CyExtras.readHeadlines(c);
        int n = Math.min(h.length(), MAX);
        rv.removeAllViews(R.id.cy_w_flip);
        int shown = 0;
        for (int i = 0; i < n; i++) {
            JSONObject o = h.optJSONObject(i);
            if (o == null || o.optString("title", "").length() == 0) continue;
            JSONObject nx = n > 1 ? h.optJSONObject((i + 1) % n) : null;
            rv.addView(R.id.cy_w_flip, page(c, o, nx, i));
            shown++;
        }
        rv.setViewVisibility(R.id.cy_w_empty, shown == 0 ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.cy_w_arrows, shown > 1 ? View.VISIBLE : View.GONE);
        rv.setOnClickPendingIntent(R.id.cy_w_prev, switchIntent(c, ACT_PREV, 71));
        rv.setOnClickPendingIntent(R.id.cy_w_next, switchIntent(c, ACT_NEXT, 72));
        rv.setOnClickPendingIntent(R.id.cy_w_title, CyExtras.openIntent(c, null, 90));
        rv.setOnClickPendingIntent(R.id.cy_w_root, CyExtras.openIntent(c, null, 91));
        return rv;
    }

    private static RemoteViews page(Context c, JSONObject o, JSONObject next, int i) {
        RemoteViews p = new RemoteViews(c.getPackageName(), R.layout.cy_widget_page);
        String src = o.optString("src", "").trim();
        p.setTextViewText(R.id.cy_wp_src, src.toUpperCase(Locale.getDefault()));
        p.setViewVisibility(R.id.cy_wp_src, src.length() == 0 ? View.GONE : View.VISIBLE);
        p.setTextViewText(R.id.cy_wp_head, o.optString("title", ""));
        Bitmap b = null;
        try {
            File f = imageFile(c, o.optString("img", ""));
            if (f != null && f.isFile()) {
                BitmapFactory.Options opt = new BitmapFactory.Options();
                opt.inPreferredConfig = Bitmap.Config.RGB_565;
                b = BitmapFactory.decodeFile(f.getAbsolutePath(), opt);
            }
        } catch (Throwable t) {
            Log.w(TAG, "picture failed: " + t);
        }
        if (b != null) {
            p.setImageViewBitmap(R.id.cy_wp_img, b);
            p.setViewVisibility(R.id.cy_wp_img, View.VISIBLE);
        } else {
            p.setViewVisibility(R.id.cy_wp_img, View.GONE);
        }
        String nt = next == null ? "" : next.optString("title", "");
        if (nt.length() > 0) {
            p.setTextViewText(R.id.cy_wp_next, "Next  ›  " + nt);
            p.setViewVisibility(R.id.cy_wp_next, View.VISIBLE);
            p.setOnClickPendingIntent(R.id.cy_wp_next, CyExtras.openIntent(c, next.optString("link", ""), 120 + i));
        } else {
            p.setViewVisibility(R.id.cy_wp_next, View.GONE);
        }
        p.setOnClickPendingIntent(R.id.cy_wp_root, CyExtras.openIntent(c, o.optString("link", ""), 100 + i));
        return p;
    }

    // ---------------------------------------------------------------- pictures

    /** Where the downloaded, shrunk picture for this address is kept. */
    static File imageFile(Context c, String url) {
        if (url == null || url.length() == 0) return null;
        return new File(c.getCacheDir(), "cyw_" + Integer.toHexString(url.hashCode()) + ".jpg");
    }

    /** True if the file is a picture Android can read (a cached file may be broken or cut short). */
    private static boolean decodes(File f) {
        try {
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(f.getAbsolutePath(), o);
            return o.outWidth > 0 && o.outHeight > 0;
        } catch (Throwable t) {
            return false;
        }
    }

    /**
     * Downloads any story pictures the widget does not have yet. Call from a background thread, one call at a time
     * (CyExtras.IMG_EXEC). Each picture is written to a .tmp file and renamed when complete, and old pictures are
     * deleted only after every download succeeded.
     */
    static boolean fetchImages(Context c, JSONArray list) {
        boolean any = false;
        boolean complete = true; // every picture the widget wants is on disk
        try {
            java.util.HashSet<String> keep = new java.util.HashSet<>();
            for (int i = 0; i < list.length() && i < MAX; i++) {
                JSONObject o = list.optJSONObject(i);
                if (o == null) continue;
                String u = o.optString("img", "");
                File f = imageFile(c, u);
                if (f == null) continue;
                keep.add(f.getName());
                if (f.isFile()) {
                    if (decodes(f)) continue;
                    f.delete(); // broken: fetch it again
                }
                File tmp = new File(f.getPath() + ".tmp");
                try {
                    Bitmap b = download(u);
                    if (b == null) {
                        complete = false;
                        continue;
                    }
                    boolean wrote;
                    FileOutputStream out = new FileOutputStream(tmp);
                    try {
                        wrote = b.compress(Bitmap.CompressFormat.JPEG, 82, out);
                    } finally {
                        out.close();
                    }
                    // a file under 1 KB or one Android cannot read is not a picture: never let it replace anything
                    if (wrote && tmp.length() >= 1024 && decodes(tmp) && tmp.renameTo(f)) {
                        any = true;
                    } else {
                        tmp.delete();
                        complete = false;
                    }
                } catch (Throwable t) {
                    tmp.delete();
                    complete = false;
                    Log.w(TAG, "picture download failed: " + t);
                }
            }
            // Old pictures go only after the new set is complete, so a failed refresh never leaves the widget bare.
            // A picture that can never be fetched must not keep the cache growing, hence the cap.
            File[] all = c.getCacheDir().listFiles();
            java.util.ArrayList<File> stale = new java.util.ArrayList<>();
            if (all != null) {
                for (File f : all) {
                    String nm = f.getName();
                    if (nm.startsWith("cyw_") && !keep.contains(nm)) stale.add(f);
                }
            }
            if (complete || stale.size() > 24) {
                for (File f : stale) f.delete();
            }
        } catch (Throwable t) {
            Log.w(TAG, "pictures failed: " + t);
        }
        return any;
    }

    private static Bitmap download(String url) throws Exception {
        if (!(url.startsWith("http://") || url.startsWith("https://"))) return null;
        HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
        try {
            con.setConnectTimeout(6000);
            con.setReadTimeout(8000);
            con.setInstanceFollowRedirects(true);
            con.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36");
            if (con.getResponseCode() != 200) return null;
            InputStream in = con.getInputStream();
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int r, total = 0;
            while ((r = in.read(buf)) > 0) {
                total += r;
                if (total > 5000000) return null;
                bo.write(buf, 0, r);
            }
            byte[] data = bo.toByteArray();
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(data, 0, data.length, o);
            int sample = 1;
            while (o.outWidth / sample > 1000 || o.outHeight / sample > 1000) sample *= 2;
            o.inJustDecodeBounds = false;
            o.inSampleSize = sample;
            Bitmap b = BitmapFactory.decodeByteArray(data, 0, data.length, o);
            if (b == null) return null;
            int big = Math.max(b.getWidth(), b.getHeight());
            if (big > 640) {
                float f = 640f / big;
                b = Bitmap.createScaledBitmap(b, Math.max(1, Math.round(b.getWidth() * f)), Math.max(1, Math.round(b.getHeight() * f)), true);
            }
            return b;
        } finally {
            con.disconnect();
        }
    }
}
