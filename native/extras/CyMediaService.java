package com.cypress.reader;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.Icon;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Foreground service that keeps the app alive while the web page reads articles aloud, and shows
 * lock-screen / notification controls. Uses framework MediaSession + Notification.MediaStyle.
 * Button presses are sent to the web page as the "mediaAction" event.
 */
public class CyMediaService extends Service {

    private static final String TAG = "CyMediaService";
    static final int NOTIF_ID = 7301;
    static final String ACT_START = "com.cypress.reader.media.START";
    static final String ACT_TOGGLE = "com.cypress.reader.media.TOGGLE";
    static final String ACT_NEXT = "com.cypress.reader.media.NEXT";
    static final String ACT_PREV = "com.cypress.reader.media.PREV";
    static final String ACT_STOP = "com.cypress.reader.media.STOP";

    /** The running service, so updates do not need to start anything. */
    static volatile CyMediaService instance;

    private String title = "CyPress";
    private String subtitle = "";
    private boolean playing = true;
    private boolean foregrounded = false;
    private MediaSession session;
    private String artFor = "";
    private Bitmap art = null;
    private final Handler uiHandler = new Handler(Looper.getMainLooper());

    // ------------------------------------------------------------ API used by the plugin

    static void start(Context c, String title, String subtitle, boolean playing, String image) {
        CyMediaService s = instance;
        if (s != null) {
            s.apply(title, subtitle, playing, image);
            return;
        }
        Intent i = new Intent(c, CyMediaService.class);
        i.setAction(ACT_START);
        i.putExtra("title", title);
        i.putExtra("subtitle", subtitle);
        i.putExtra("playing", playing);
        i.putExtra("image", image == null ? "" : image);
        ContextCompat.startForegroundService(c, i);
    }

    static void update(Context c, String title, String subtitle, boolean playing, String image) {
        CyMediaService s = instance;
        if (s != null) s.apply(title, subtitle, playing, image);
        else start(c, title, subtitle, playing, image);
    }

    static void stop(Context c) {
        CyMediaService s = instance;
        if (s != null) s.shutdown();
        else c.stopService(new Intent(c, CyMediaService.class));
    }

    // ------------------------------------------------------------ service lifecycle

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        CyExtras.ensureChannels(this);
        try {
            createSession();
        } catch (Throwable t) {
            Log.w(TAG, "media session failed: " + t);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String a = intent == null ? null : intent.getAction();
        try {
            if (ACT_START.equals(a) || !foregrounded) {
                if (intent != null && ACT_START.equals(a)) {
                    String t = intent.getStringExtra("title");
                    String s = intent.getStringExtra("subtitle");
                    if (t != null) title = t;
                    if (s != null) subtitle = s;
                    playing = intent.getBooleanExtra("playing", true);
                    String im = intent.getStringExtra("image");
                    if (im != null) loadArt(im);
                }
                goForeground();
                refreshSession();
            }
            if (ACT_TOGGLE.equals(a)) {
                CyExtras.emitMediaAction("toggle");
            } else if (ACT_NEXT.equals(a)) {
                CyExtras.emitMediaAction("next");
            } else if (ACT_PREV.equals(a)) {
                CyExtras.emitMediaAction("prev");
            } else if (ACT_STOP.equals(a)) {
                CyExtras.emitMediaAction("stop");
                shutdown();
            }
        } catch (Throwable t) {
            Log.w(TAG, "start command failed: " + t);
            shutdown();
        }
        return START_NOT_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // The app was swiped away: stop reading and remove the notification.
        shutdown();
    }

    @Override
    public void onDestroy() {
        instance = null;
        try {
            if (session != null) {
                session.setActive(false);
                session.release();
                session = null;
            }
        } catch (Throwable t) {
            // ignore
        }
        super.onDestroy();
    }

    // ------------------------------------------------------------ internals

    void apply(String t, String s, boolean p, String image) {
        if (t != null) title = t;
        if (s != null) subtitle = s;
        playing = p;
        if (image != null) loadArt(image);
        try {
            if (!foregrounded) {
                goForeground();
            } else {
                android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.notify(NOTIF_ID, buildNotification());
            }
            refreshSession();
        } catch (Throwable e) {
            Log.w(TAG, "update failed: " + e);
        }
    }

    /** Shows the story's picture on the lock screen and in the notification; the app logo until (or unless) it loads. */
    private void loadArt(String url) {
        final String want = url == null ? "" : url;
        if (art != null && want.equals(artFor)) return;
        artFor = want;
        if (art == null) art = appLogo();
        if (want.length() == 0 || !(want.startsWith("http://") || want.startsWith("https://"))) {
            art = appLogo();
            return;
        }
        new Thread(() -> {
            Bitmap b = null;
            try {
                b = fetchBitmap(want);
            } catch (Throwable t) {
                Log.w(TAG, "cover picture failed: " + t);
            }
            final Bitmap got = b;
            uiHandler.post(() -> {
                if (!want.equals(artFor)) return;
                art = got != null ? got : appLogo();
                try {
                    if (foregrounded) {
                        android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                        if (nm != null) nm.notify(NOTIF_ID, buildNotification());
                    }
                    refreshSession();
                } catch (Throwable t) {
                    Log.w(TAG, "cover refresh failed: " + t);
                }
            });
        }).start();
    }

    private static Bitmap fetchBitmap(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        try {
            c.setConnectTimeout(6000);
            c.setReadTimeout(8000);
            c.setInstanceFollowRedirects(true);
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36");
            if (c.getResponseCode() != 200) return null;
            InputStream in = c.getInputStream();
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n, total = 0;
            while ((n = in.read(buf)) > 0) {
                total += n;
                if (total > 4000000) return null;
                bo.write(buf, 0, n);
            }
            byte[] data = bo.toByteArray();
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(data, 0, data.length, o);
            int sample = 1;
            while (o.outWidth / sample > 800 || o.outHeight / sample > 800) sample *= 2;
            o.inJustDecodeBounds = false;
            o.inSampleSize = sample;
            Bitmap b = BitmapFactory.decodeByteArray(data, 0, data.length, o);
            if (b == null) return null;
            int big = Math.max(b.getWidth(), b.getHeight());
            if (big > 480) {
                float f = 480f / big;
                b = Bitmap.createScaledBitmap(b, Math.max(1, Math.round(b.getWidth() * f)), Math.max(1, Math.round(b.getHeight() * f)), true);
            }
            return b;
        } finally {
            c.disconnect();
        }
    }

    /** The CyPress app icon as a picture, for stories that have none. */
    private Bitmap appLogo() {
        try {
            Drawable d = getPackageManager().getApplicationIcon(getPackageName());
            Bitmap b = Bitmap.createBitmap(256, 256, Bitmap.Config.ARGB_8888);
            Canvas cv = new Canvas(b);
            d.setBounds(0, 0, 256, 256);
            d.draw(cv);
            return b;
        } catch (Throwable t) {
            Log.w(TAG, "app logo failed: " + t);
            return null;
        }
    }

    void shutdown() {
        try {
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        } catch (Throwable t) {
            // ignore
        }
        foregrounded = false;
        stopSelf();
    }

    private void goForeground() {
        Notification n = buildNotification();
        // Android 14 requires the foreground service type; it exists from API 29.
        int type = Build.VERSION.SDK_INT >= 29 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
        ServiceCompat.startForeground(this, NOTIF_ID, n, type);
        foregrounded = true;
    }

    private void createSession() {
        session = new MediaSession(this, "CyPress");
        session.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                CyExtras.emitMediaAction("toggle");
            }

            @Override
            public void onPause() {
                CyExtras.emitMediaAction("toggle");
            }

            @Override
            public void onSkipToNext() {
                CyExtras.emitMediaAction("next");
            }

            @Override
            public void onSkipToPrevious() {
                CyExtras.emitMediaAction("prev");
            }

            @Override
            public void onStop() {
                CyExtras.emitMediaAction("stop");
                shutdown();
            }
        });
        session.setActive(true);
        refreshSession();
    }

    private void refreshSession() {
        if (session == null) return;
        try {
            long actions = PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE
                | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_STOP;
            PlaybackState ps = new PlaybackState.Builder()
                .setActions(actions)
                .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                    PlaybackState.PLAYBACK_POSITION_UNKNOWN, playing ? 1f : 0f)
                .build();
            session.setPlaybackState(ps);
            MediaMetadata.Builder mb = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, title)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, subtitle);
            if (art != null) {
                mb.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, art);
                mb.putBitmap(MediaMetadata.METADATA_KEY_ART, art);
            }
            session.setMetadata(mb.build());
        } catch (Throwable t) {
            Log.w(TAG, "session refresh failed: " + t);
        }
    }

    private PendingIntent actionIntent(String action, int code) {
        Intent i = new Intent(this, CyMediaService.class);
        i.setAction(action);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private Notification.Action action(int icon, String label, String action, int code) {
        return new Notification.Action.Builder(Icon.createWithResource(this, icon), label, actionIntent(action, code)).build();
    }

    @SuppressWarnings("deprecation")
    private Notification buildNotification() {
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, CyExtras.CH_MEDIA)
            : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.cy_ic_notif)
            .setContentTitle(title)
            .setContentText(subtitle)
            .setContentIntent(CyExtras.openIntent(this, null, 80))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(Notification.CATEGORY_TRANSPORT)
            .setColor(0xFF133A28);
        if (art != null) b.setLargeIcon(art);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_LOW);
        b.addAction(action(R.drawable.cy_ic_prev, "Previous", ACT_PREV, 81));
        b.addAction(action(playing ? R.drawable.cy_ic_pause : R.drawable.cy_ic_play, playing ? "Pause" : "Play", ACT_TOGGLE, 82));
        b.addAction(action(R.drawable.cy_ic_next, "Next", ACT_NEXT, 83));
        b.addAction(action(R.drawable.cy_ic_stop, "Stop", ACT_STOP, 84));
        Notification.MediaStyle style = new Notification.MediaStyle().setShowActionsInCompactView(0, 1, 2);
        if (session != null) style.setMediaSession(session.getSessionToken());
        b.setStyle(style);
        return b.build();
    }
}
