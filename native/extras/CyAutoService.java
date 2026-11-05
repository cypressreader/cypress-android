package com.cypress.reader;

import android.media.MediaDescription;
import android.media.browse.MediaBrowser;
import android.os.Bundle;
import android.service.media.MediaBrowserService;
import java.util.ArrayList;
import java.util.List;

/** Android Auto's list for CyPress: The Daily first, then your folders. Picking one plays it aloud
 *  through the app's one media session (CyMediaService.sharedSession). */
public class CyAutoService extends MediaBrowserService {

    private static final String ROOT = "cy_root";

    @Override
    public void onCreate() {
        super.onCreate();
        setSessionToken(CyMediaService.sharedSession(this).getSessionToken());
    }

    @Override
    public BrowserRoot onGetRoot(String pkg, int uid, Bundle hints) {
        return new BrowserRoot(ROOT, null);
    }

    @Override
    public void onLoadChildren(String parentId, Result<List<MediaBrowser.MediaItem>> result) {
        List<MediaBrowser.MediaItem> out = new ArrayList<>();
        if (ROOT.equals(parentId)) {
            out.add(item("daily", "The Daily", "Today’s top stories, read aloud"));
            for (String n : CyExtras.folders(this)) out.add(item("folder:" + n, n, "Folder"));
        }
        result.sendResult(out);
    }

    private static MediaBrowser.MediaItem item(String id, String title, String sub) {
        return new MediaBrowser.MediaItem(new MediaDescription.Builder()
            .setMediaId(id).setTitle(title).setSubtitle(sub).build(), MediaBrowser.MediaItem.FLAG_PLAYABLE);
    }
}
