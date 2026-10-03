package com.cypress.reader;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.Icon;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
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
    /** True after stopForeground(DETACH) while paused: the notification stays but can be swiped away. */
    private boolean detached = false;
    /** Set once shutdown() ran: late posted updates must not revive this instance. */
    private boolean dead = false;
    /** The page was already asked to pause (focus loss, headphones out); do not ask twice, a second "toggle" would resume. */
    private boolean pauseAsked = false;
    private MediaSession session;
    private String artFor = "";
    private Bitmap art = null;
    private final Handler uiHandler = new Handler(Looper.getMainLooper());

    /** A stop() right before a start()/update() (the page moving to the next story) must not tear the service down. */
    private static final long SHUTDOWN_DELAY_MS = 3000L;
    /** A reading that stays paused this long is closed so the service does not linger. */
    private static final long PAUSED_TIMEOUT_MS = 10L * 60L * 1000L;
    private Runnable pendingShutdown;
    private Runnable pausedTimeout;

    private AudioManager audioMgr;
    private AudioFocusRequest focusReq;
    private boolean focusHeld = false;
    private boolean noisyRegistered = false;

    private final AudioManager.OnAudioFocusChangeListener focusListener = new AudioManager.OnAudioFocusChangeListener() {
        @Override
        public void onAudioFocusChange(int change) {
            if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                focusHeld = false;
                pauseForInterruption();
            }
        }
    };

    private final BroadcastReceiver noisyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                pauseForInterruption();
            }
        }
    };

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
        else if (playing) start(c, title, subtitle, true, image); // a pause with nothing running needs no service
    }

    static void stop(Context c) {
        CyMediaService s = instance;
        if (s != null) s.requestShutdown();
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
            if (ACT_START.equals(a)) {
                cancelShutdown();
                pauseAsked = false;
                String t = intent.getStringExtra("title");
                String s = intent.getStringExtra("subtitle");
                if (t != null) title = t;
                if (s != null) subtitle = s;
                playing = intent.getBooleanExtra("playing", true);
                String im = intent.getStringExtra("image");
                if (im != null) loadArt(im);
                goForeground(); // always: startForegroundService() requires it within a few seconds
                enterPlayState();
                refreshSession();
            } else if (!foregrounded && !detached) {
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
                stopSpeech();
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
        stopSpeech();
        shutdown();
    }

    @Override
    public void onDestroy() {
        if (instance == this) instance = null;
        cancelShutdown();
        cancelPausedTimeout();
        unregisterNoisy();
        abandonFocus();
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

    /** Safe to call from any thread: the service's state is only touched on the main thread. */
    void apply(final String t, final String s, final boolean p, final String image) {
        runOnMain(new Runnable() {
            @Override
            public void run() {
                applyNow(t, s, p, image);
            }
        });
    }

    private void runOnMain(Runnable r) {
        if (Looper.myLooper() == Looper.getMainLooper()) r.run();
        else uiHandler.post(r);
    }

    private void applyNow(String t, String s, boolean p, String image) {
        if (dead) {
            // this instance already shut down before the update arrived; a playing update starts a fresh service
            if (p) start(getApplicationContext(), t, s, true, image);
            return;
        }
        cancelShutdown();
        pauseAsked = false;
        if (t != null) title = t;
        if (s != null) subtitle = s;
        playing = p;
        if (image != null) loadArt(image);
        try {
            enterPlayState();
            refreshSession();
        } catch (Throwable e) {
            Log.w(TAG, "update failed: " + e);
        }
    }

    /**
     * Brings notification, audio focus and timers in line with the current playing flag. Playing: ongoing foreground
     * notification, audio focus, headphones-unplugged pause. Paused: the notification is detached and can be swiped
     * away, focus is given back, and the service closes itself after a while.
     */
    private void enterPlayState() {
        if (playing) {
            cancelPausedTimeout();
            if (!foregrounded) {
                try {
                    goForeground(); // also re-promotes after a pause
                } catch (Throwable e) {
                    Log.w(TAG, "could not go foreground: " + e);
                    notifyNow();
                }
            } else {
                notifyNow();
            }
            requestFocus();
            registerNoisy();
        } else {
            unregisterNoisy();
            abandonFocus();
            if (foregrounded) {
                try {
                    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_DETACH);
                } catch (Throwable e) {
                    Log.w(TAG, "detach failed: " + e);
                }
                foregrounded = false;
            }
            detached = true;
            notifyNow(); // repost without the ongoing flag
            schedulePausedTimeout();
        }
    }

    private void notifyNow() {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.notify(NOTIF_ID, buildNotification());
        } catch (Throwable e) {
            Log.w(TAG, "notify failed: " + e);
        }
    }

    // ------------------------------------------------------------ delayed shutdown, pause timeout

    /** stop() from the page: shut down in a moment, unless a start or update arrives first. */
    void requestShutdown() {
        runOnMain(new Runnable() {
            @Override
            public void run() {
                cancelShutdown();
                pendingShutdown = new Runnable() {
                    @Override
                    public void run() {
                        pendingShutdown = null;
                        shutdown();
                    }
                };
                uiHandler.postDelayed(pendingShutdown, SHUTDOWN_DELAY_MS);
            }
        });
    }

    private void cancelShutdown() {
        if (pendingShutdown != null) {
            uiHandler.removeCallbacks(pendingShutdown);
            pendingShutdown = null;
        }
    }

    private void schedulePausedTimeout() {
        cancelPausedTimeout();
        pausedTimeout = new Runnable() {
            @Override
            public void run() {
                pausedTimeout = null;
                if (!playing) shutdown();
            }
        };
        uiHandler.postDelayed(pausedTimeout, PAUSED_TIMEOUT_MS);
    }

    private void cancelPausedTimeout() {
        if (pausedTimeout != null) {
            uiHandler.removeCallbacks(pausedTimeout);
            pausedTimeout = null;
        }
    }

    // ------------------------------------------------------------ audio focus, headphones, speech

    /** Another app took the audio, or the headphones came out: pause once, the way the notification button would. */
    private void pauseForInterruption() {
        if (!playing || pauseAsked) return;
        pauseAsked = true;
        stopSpeech(); // the phone's speech engine keeps talking by itself otherwise, even if the page is asleep
        CyExtras.emitMediaAction("toggle");
        playing = false;
        try {
            enterPlayState();
            refreshSession();
        } catch (Throwable e) {
            Log.w(TAG, "pause failed: " + e);
        }
    }

    private void stopSpeech() {
        try {
            CyTts t = CyTts.existing();
            if (t != null) t.stop();
        } catch (Throwable e) {
            Log.w(TAG, "stop speech failed: " + e);
        }
    }

    @SuppressWarnings("deprecation")
    private void requestFocus() {
        if (focusHeld) return;
        try {
            if (audioMgr == null) audioMgr = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioMgr == null) return;
            int r;
            if (Build.VERSION.SDK_INT >= 26) {
                if (focusReq == null) {
                    AudioAttributes aa = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build();
                    focusReq = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(aa)
                        .setOnAudioFocusChangeListener(focusListener, uiHandler)
                        .build();
                }
                r = audioMgr.requestAudioFocus(focusReq);
            } else {
                r = audioMgr.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
            }
            focusHeld = r == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        } catch (Throwable e) {
            Log.w(TAG, "audio focus failed: " + e);
        }
    }

    @SuppressWarnings("deprecation")
    private void abandonFocus() {
        try {
            if (audioMgr != null && (focusHeld || focusReq != null)) {
                if (Build.VERSION.SDK_INT >= 26) {
                    if (focusReq != null) audioMgr.abandonAudioFocusRequest(focusReq);
                } else {
                    audioMgr.abandonAudioFocus(focusListener);
                }
            }
        } catch (Throwable e) {
            Log.w(TAG, "abandon focus failed: " + e);
        }
        focusHeld = false;
    }

    private void registerNoisy() {
        if (noisyRegistered) return;
        try {
            registerReceiver(noisyReceiver, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
            noisyRegistered = true;
        } catch (Throwable e) {
            Log.w(TAG, "noisy receiver failed: " + e);
        }
    }

    private void unregisterNoisy() {
        if (!noisyRegistered) return;
        try {
            unregisterReceiver(noisyReceiver);
        } catch (Throwable e) {
            // not registered
        }
        noisyRegistered = false;
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
                    if (foregrounded || detached) notifyNow();
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
        cancelShutdown();
        cancelPausedTimeout();
        unregisterNoisy();
        abandonFocus();
        try {
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        } catch (Throwable t) {
            // ignore
        }
        try {
            // a detached (paused) notification is not removed by stopForeground
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(NOTIF_ID);
        } catch (Throwable t) {
            // ignore
        }
        foregrounded = false;
        detached = false;
        dead = true;
        if (instance == this) instance = null; // a start() right now makes a fresh service instead of using this one
        stopSelf();
    }

    private void goForeground() {
        Notification n = buildNotification();
        // Android 14 requires the foreground service type; it exists from API 29.
        int type = Build.VERSION.SDK_INT >= 29 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
        ServiceCompat.startForeground(this, NOTIF_ID, n, type);
        foregrounded = true;
        detached = false;
    }

    private void createSession() {
        session = new MediaSession(this, "CyPress");
        session.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                if (!playing) CyExtras.emitMediaAction("toggle");
            }

            @Override
            public void onPause() {
                if (playing) CyExtras.emitMediaAction("toggle");
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
                stopSpeech();
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
            .setOngoing(playing)
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
