package com.cypress.reader;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.drawable.Icon;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

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

    // ------------------------------------------------------------ API used by the plugin

    static void start(Context c, String title, String subtitle, boolean playing) {
        CyMediaService s = instance;
        if (s != null) {
            s.apply(title, subtitle, playing);
            return;
        }
        Intent i = new Intent(c, CyMediaService.class);
        i.setAction(ACT_START);
        i.putExtra("title", title);
        i.putExtra("subtitle", subtitle);
        i.putExtra("playing", playing);
        ContextCompat.startForegroundService(c, i);
    }

    static void update(Context c, String title, String subtitle, boolean playing) {
        CyMediaService s = instance;
        if (s != null) s.apply(title, subtitle, playing);
        else start(c, title, subtitle, playing);
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

    void apply(String t, String s, boolean p) {
        if (t != null) title = t;
        if (s != null) subtitle = s;
        playing = p;
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
            MediaMetadata md = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, title)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, subtitle)
                .build();
            session.setMetadata(md);
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
