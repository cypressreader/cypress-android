package com.cypress.reader;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;
import android.widget.RemoteViews;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Top Story widget (2x2): one big story in the Type cover look, flipped by the arrows and every 30 minutes.
 * This class also receives the shared tick and the arrow taps for the other widgets; pictures for the Headlines
 * widget are fetched below. The layouts and the cycling live in CyWidgets.
 */
public class CyWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "CyWidget";
    static final String ACT_SAVE = "com.cypress.reader.widget.SAVE";
    static final int MAX = 6;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        try {
            RemoteViews rv = CyWidgets.buildTop(context);
            for (int id : appWidgetIds) manager.updateAppWidget(id, rv);
            CyWidgets.arm(context, false);
        } catch (Throwable t) {
            // a broken widget must never crash the app
        }
    }

    @Override
    public void onEnabled(Context context) {
        CyWidgets.arm(context, false);
    }

    @Override
    public void onDisabled(Context context) {
        CyWidgets.arm(context, false);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        try {
            String a = intent == null ? null : intent.getAction();
            if (ACT_SAVE.equals(a)) {
                String link = intent.getStringExtra("link");
                if (link != null && link.length() > 0) {
                    context.getSharedPreferences("cypress", Context.MODE_PRIVATE)
                        .edit().putString("widget_save", link).apply();
                }
            } else if (CyWidgets.ACT_TICK.equals(a)) {
                CyWidgets.tick(context);
            } else if (CyWidgets.ACT_REFRESH.equals(a)) {
                CyWidgets.refreshNow(context);
            } else if (CyWidgets.ACT_NEXT.equals(a)) {
                CyWidgets.flip(context, 1);
            } else if (CyWidgets.ACT_PREV.equals(a)) {
                CyWidgets.flip(context, -1);
            }
        } catch (Throwable t) {
            Log.w(TAG, "receive failed: " + t);
        }
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
