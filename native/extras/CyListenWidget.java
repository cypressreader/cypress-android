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
import android.view.View;
import android.widget.RemoteViews;
import java.io.File;
import java.io.FileOutputStream;

/** "Continue listening" home screen widget: the story's picture, what is (or was last) playing, time left, skip back, play/pause and next.
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

    /** N4: the picture is scaled and written off the main thread, in order. pos/dur in ms (dur 0 = unknown). */
    static void save(Context c, String title, String sub, boolean playing, Bitmap art, boolean artChanged, long pos, long dur) {
        IO.execute(() -> saveNow(c, title, sub, playing, art, artChanged, pos, dur));
    }

    private static void saveNow(Context c, String title, String sub, boolean playing, Bitmap art, boolean artChanged, long pos, long dur) {
        try {
            c.getSharedPreferences("cypress", Context.MODE_PRIVATE).edit()
                    .putString("lw_t", title).putString("lw_s", sub).putBoolean("lw_p", playing)
                    .putLong("lw_pos", pos).putLong("lw_dur", dur).apply();
            if (artChanged) {
                File f = new File(c.getFilesDir(), ART);
                if (art == null) f.delete();
                else {
                    // big enough to fill the widget behind its veil
                    int w = Math.min(480, art.getWidth());
                    Bitmap b = Bitmap.createScaledBitmap(art, w, Math.max(1, art.getHeight() * w / Math.max(1, art.getWidth())), true);
                    try (FileOutputStream o = new FileOutputStream(f)) { b.compress(Bitmap.CompressFormat.JPEG, 85, o); }
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
            for (int id : ids) {
                try {
                    m.updateAppWidget(id, build(c, CyWidgets.widthDp(m, id)));
                } catch (Throwable t) {
                    Log.w(TAG, "draw " + id + " failed: " + t);
                }
            }
        } catch (Throwable t) {
            Log.w(TAG, "draw failed: " + t);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, android.os.Bundle o) {
        try {
            m.updateAppWidget(id, build(c, CyWidgets.widthDp(m, id)));
        } catch (Throwable t) {
            Log.w(TAG, "resize failed: " + t);
        }
    }

    private static PendingIntent svc(Context c, String action, int code, boolean fg) {
        Intent i = new Intent(c, CyMediaService.class).setAction(action);
        int fl = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT; // N6: paused = not foreground, so resume must start it as one
        return fg && Build.VERSION.SDK_INT >= 26 ? PendingIntent.getForegroundService(c, code, i, fl) : PendingIntent.getService(c, code, i, fl);
    }

    /** The widget for one width in dp (0 = unknown). */
    static RemoteViews build(Context c, int wDp) {
        SharedPreferences p = c.getSharedPreferences("cypress", Context.MODE_PRIVATE);
        String t = p.getString("lw_t", null);
        boolean live = CyMediaService.instance != null;
        boolean playing = p.getBoolean("lw_p", false) && live;
        long pos = p.getLong("lw_pos", -1L), dur = p.getLong("lw_dur", 0L);
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget_listen);
        rv.setTextViewText(R.id.cy_wl_title, t == null || t.isEmpty() ? "The Daily" : t);
        rv.setTextViewText(R.id.cy_wl_sub, t == null ? "Tap play to hear today's stories" : p.getString("lw_s", ""));
        String kick = "CONTINUE LISTENING";
        boolean prog = t != null && dur > 0 && pos >= 0;
        if (prog) {
            long m = Math.max(0L, dur - pos) / 60000L;
            kick += "  ·  " + (m < 1 ? "UNDER 1 MIN LEFT" : m + " MIN LEFT");
        }
        rv.setTextViewText(R.id.cy_wl_kick, kick);
        File f = new File(c.getFilesDir(), ART);
        Bitmap art = t != null && f.exists() ? BitmapFactory.decodeFile(f.getPath()) : null;
        int[] th = CyWidgets.theme(c);
        if (art != null) {
            // the story's picture fills the widget behind a forest veil: light text, brass play button
            rv.setImageViewBitmap(R.id.cy_wl_bg, art);
            rv.setViewVisibility(R.id.cy_wl_bg, View.VISIBLE);
            rv.setViewVisibility(R.id.cy_wl_veil, View.VISIBLE);
            rv.setViewVisibility(R.id.cy_wl_art, View.GONE);
            rv.setInt(R.id.cy_wl_kick, "setTextColor", c.getColor(R.color.cy_w_brass));
            rv.setInt(R.id.cy_wl_title, "setTextColor", c.getColor(R.color.cy_w_photo_text));
            rv.setInt(R.id.cy_wl_sub, "setTextColor", c.getColor(R.color.cy_w_photo_sub));
            rv.setInt(R.id.cy_wl_rew, "setColorFilter", c.getColor(R.color.cy_w_photo_text));
            rv.setInt(R.id.cy_wl_next, "setColorFilter", c.getColor(R.color.cy_w_photo_text));
            rv.setInt(R.id.cy_wl_play, "setBackgroundResource", R.drawable.cy_w_play_bg);
            rv.setInt(R.id.cy_wl_play, "setColorFilter", c.getColor(R.color.cy_w_forest));
        } else {
            rv.setViewVisibility(R.id.cy_wl_bg, View.GONE);
            rv.setViewVisibility(R.id.cy_wl_veil, View.GONE);
            rv.setViewVisibility(R.id.cy_wl_art, View.VISIBLE);
            rv.setImageViewResource(R.id.cy_wl_art, R.drawable.cy_w_mark);
            if (th != null) { // the app's theme (Android 12+)
                CyWidgets.tintBg(rv, android.R.id.background, th[0]);
                rv.setInt(R.id.cy_wl_rew, "setColorFilter", CyWidgets.ink(c, th));
                rv.setInt(R.id.cy_wl_next, "setColorFilter", CyWidgets.ink(c, th));
                rv.setColorStateList(R.id.cy_wl_prog, "setProgressTintList", android.content.res.ColorStateList.valueOf(CyWidgets.ink(c, th)));
                rv.setColorStateList(R.id.cy_wl_prog, "setProgressBackgroundTintList", android.content.res.ColorStateList.valueOf(th[4]));
            }
            rv.setInt(R.id.cy_wl_kick, "setTextColor", CyWidgets.kicker(c, th));
            rv.setInt(R.id.cy_wl_title, "setTextColor", CyWidgets.ink(c, th));
            rv.setInt(R.id.cy_wl_sub, "setTextColor", CyWidgets.muted(c, th));
        }
        int bar = art != null ? R.id.cy_wl_prog2 : R.id.cy_wl_prog;
        rv.setViewVisibility(R.id.cy_wl_prog, View.GONE);
        rv.setViewVisibility(R.id.cy_wl_prog2, View.GONE);
        if (prog) {
            rv.setViewVisibility(bar, View.VISIBLE);
            rv.setProgressBar(bar, 100, (int) Math.min(100L, pos * 100L / dur), false);
        }
        rv.setImageViewResource(R.id.cy_wl_play, playing ? R.drawable.cy_ic_pause : R.drawable.cy_ic_play);
        rv.setContentDescription(R.id.cy_wl_play, playing ? "Pause" : "Play");
        // the button: pause/resume the running reading; nothing running: open CyPress and start listening
        PendingIntent btn;
        if (live) {
            btn = svc(c, CyMediaService.ACT_TOGGLE, 7411, !playing);
        } else {
            Intent i = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    .putExtra(CyExtras.EXTRA_OPEN_URL, "cypress:view:listen");
            btn = PendingIntent.getActivity(c, 7412, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        }
        rv.setOnClickPendingIntent(R.id.cy_wl_play, btn);
        // skip back and next story only while a reading is under way, and only where they fit
        boolean skips = live && t != null && (wDp == 0 || wDp >= 250);
        rv.setViewVisibility(R.id.cy_wl_rew, skips ? View.VISIBLE : View.GONE);
        rv.setViewVisibility(R.id.cy_wl_next, skips ? View.VISIBLE : View.GONE);
        if (skips) {
            rv.setOnClickPendingIntent(R.id.cy_wl_rew, svc(c, CyMediaService.ACT_REW, 7414, false));
            rv.setOnClickPendingIntent(R.id.cy_wl_next, svc(c, CyMediaService.ACT_NEXT, 7415, false));
        }
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        rv.setOnClickPendingIntent(android.R.id.background, PendingIntent.getActivity(c, 7413, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        return rv;
    }
}
