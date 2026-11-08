package com.cypress.reader;

import android.content.Context;
import android.content.SharedPreferences;
import android.media.MediaDescription;
import android.media.browse.MediaBrowser;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Bundle;
import android.service.media.MediaBrowserService;
import java.util.ArrayList;
import java.util.List;

/** The only exported media service: Android Auto and the system media controls browse here.
 *  It holds no playback; buttons go to the shared session, which starts CyMediaService (private) itself. */
public class CyAutoBrowser extends MediaBrowserService {

    @Override
    public void onCreate() {
        super.onCreate();
        MediaSession s = CyMediaService.sharedSession(this);
        if (s.getController().getPlaybackState() == null) {
            s.setPlaybackState(new PlaybackState.Builder()
                .setActions(CyMediaService.VOICE_ACTIONS | PlaybackState.ACTION_PLAY)
                .setState(PlaybackState.STATE_STOPPED, 0, 0f).build());
        }
        s.setActive(true);
        setSessionToken(s.getSessionToken());
    }

    /** Who may browse: Android Auto, Android Automotive, Assistant, the phone's media controls and this app. */
    @Override
    public BrowserRoot onGetRoot(String pkg, int uid, Bundle hints) {
        if (getPackageName().equals(pkg) || uid == android.os.Process.SYSTEM_UID
                || "com.google.android.projection.gearhead".equals(pkg) || "com.android.car.media".equals(pkg)
                || "com.google.android.googlequicksearchbox".equals(pkg) || "com.android.systemui".equals(pkg)) {
            return new BrowserRoot("root", null);
        }
        return null;
    }

    /** One short list: what was playing last (saved by the player for the widget) and The Daily. */
    @Override
    public void onLoadChildren(String parent, Result<List<MediaBrowser.MediaItem>> result) {
        List<MediaBrowser.MediaItem> out = new ArrayList<>();
        if ("root".equals(parent)) {
            SharedPreferences p = getSharedPreferences("cypress", Context.MODE_PRIVATE);
            String t = p.getString("lw_t", null), sub = p.getString("lw_s", "");
            if (t != null && !"CyPress".equals(t)) out.add(item("now", t, sub == null || sub.isEmpty() ? "Continue listening" : sub));
            out.add(item("daily", "The Daily", "Today's stories, read aloud"));
        }
        result.sendResult(out);
    }

    private static MediaBrowser.MediaItem item(String id, String t, String sub) {
        MediaDescription d = new MediaDescription.Builder().setMediaId(id).setTitle(t).setSubtitle(sub).build();
        return new MediaBrowser.MediaItem(d, MediaBrowser.MediaItem.FLAG_PLAYABLE);
    }
}
