package com.cypress.reader;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Log;
import android.os.Build;
import android.widget.RemoteViews;
import java.io.File;
import java.io.FileOutputStream;

/** "Continue listening" home screen widget: the cover, what is (or was last) playing and play/pause.
 *  CyMediaService hands over the title, the picture and the play state; nothing else feeds it. */
public class CyListenWidget extends AppWidgetProvider {
    private static final String TAG = "CyListenWidget";
    private static final String ART = "cy_listen_art.png";

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        draw(c);
    }

    /** Remember what is playing, then redraw. The picture is written only when it changed. */
    private static final java.util.concurrent.ExecutorService IO = java.util.concurrent.Executors.newSingleThreadExecutor();

    /** N4: the picture is scaled and written off the main thread, in order. */
    static void save(Context c, String title, String sub, boolean playing, Bitmap art, boolean artChanged) {
        IO.execute(() -> saveNow(c, title, sub, playing, art, artChanged));
    }

    private static void saveNow(Context c, String title, String sub, boolean playing, Bitmap art, boolean artChanged) {
        try {
            c.getSharedPreferences("cypress", Context.MODE_PRIVATE).edit()
                    .putString("lw_t", title).putString("lw_s", sub).putBoolean("lw_p", playing).apply();
            if (artChanged) {
                File f = new File(c.getFilesDir(), ART);
                if (art == null) f.delete();
                else {
                    Bitmap b = Bitmap.createScaledBitmap(art, 192, Math.max(1, art.getHeight() * 192 / Math.max(1, art.getWidth())), true);
                    try (FileOutputStream o = new FileOutputStream(f)) { b.compress(Bitmap.CompressFormat.PNG, 100, o); }
                }
            }
            draw(c);
        } catch (Throwable t) {
            Log.w(TAG, "save failed: " + t);
        }
    }

    static void draw(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            int[] ids = m.getAppWidgetIds(new ComponentName(c, CyListenWidget.class));
            if (ids == null || ids.length == 0) return;
            SharedPreferences p = c.getSharedPreferences("cypress", Context.MODE_PRIVATE);
            String t = p.getString("lw_t", null);
            boolean playing = p.getBoolean("lw_p", false) && CyMediaService.instance != null;
            RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_listen);
            rv.setTextViewText(R.id.cy_wl_title, t == null || t.isEmpty() ? "The Daily" : t);
            rv.setTextViewText(R.id.cy_wl_sub, t == null ? "Tap play to hear today's stories" : p.getString("lw_s", ""));
            File f = new File(c.getFilesDir(), ART);
            Bitmap art = f.exists() ? BitmapFactory.decodeFile(f.getPath()) : null;
            if (art != null) rv.setImageViewBitmap(R.id.cy_wl_art, art);
            else rv.setImageViewResource(R.id.cy_wl_art, R.drawable.cy_w_mark);
            rv.setImageViewResource(R.id.cy_wl_play, playing ? R.drawable.cy_ic_pause : R.drawable.cy_ic_play);
            rv.setContentDescription(R.id.cy_wl_play, playing ? "Pause" : "Play");
            // the button: pause/resume the running reading; nothing running: open CyPress and start listening
            PendingIntent btn;
            if (CyMediaService.instance != null) {
                Intent i = new Intent(c, CyMediaService.class).setAction(CyMediaService.ACT_TOGGLE);
                int fl = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT; // N6: paused = not foreground, so resume must start it as one
                btn = playing || Build.VERSION.SDK_INT < 26 ? PendingIntent.getService(c, 7411, i, fl) : PendingIntent.getForegroundService(c, 7411, i, fl);
            } else {
                Intent i = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        .putExtra(CyExtras.EXTRA_OPEN_URL, "cypress:view:listen");
                btn = PendingIntent.getActivity(c, 7412, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            }
            rv.setOnClickPendingIntent(R.id.cy_wl_play, btn);
            Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            rv.setOnClickPendingIntent(R.id.cy_wl_root, PendingIntent.getActivity(c, 7413, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
            m.updateAppWidget(ids, rv);
        } catch (Throwable t) {
            Log.w(TAG, "draw failed: " + t);
        }
    }
}
