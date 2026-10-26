package com.cypress.reader;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * RemoteViewsService providing swipeable full-bleed card items for the AdapterViewFlipper Top Story widget.
 */
public class CyWidgetService extends RemoteViewsService {

    private static final String TAG = "CyWidget";

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new CyFlipperRemoteViewsFactory(this.getApplicationContext(), intent);
    }
}

class CyFlipperRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {

    private static final String TAG = "CyWidget";
    private final Context mContext;
    private JSONArray mHeadlines;

    public CyFlipperRemoteViewsFactory(Context context, Intent intent) {
        mContext = context;
    }

    @Override
    public void onCreate() {
        try {
            mHeadlines = CyExtras.readHeadlines(mContext);
        } catch (Throwable t) {
            Log.e(TAG, "CyFlipperRemoteViewsFactory.onCreate failed", t);
            mHeadlines = new JSONArray();
        }
    }

    @Override
    public void onDataSetChanged() {
        try {
            mHeadlines = CyExtras.readHeadlines(mContext);
        } catch (Throwable t) {
            Log.e(TAG, "CyFlipperRemoteViewsFactory.onDataSetChanged failed", t);
            mHeadlines = new JSONArray();
        }
    }

    @Override
    public void onDestroy() {
        mHeadlines = null;
    }

    @Override
    public int getCount() {
        try {
            if (mHeadlines == null || mHeadlines.length() == 0) return 0;
            return Math.min(mHeadlines.length(), CyWidgets.TOP_N);
        } catch (Throwable t) {
            Log.e(TAG, "CyFlipperRemoteViewsFactory.getCount failed", t);
            return 0;
        }
    }

    @Override
    public RemoteViews getViewAt(int position) {
        try {
            if (mHeadlines == null || position < 0 || position >= mHeadlines.length()) {
                return CyWidgets.buildStaticCard(mContext);
            }
            JSONObject o = mHeadlines.optJSONObject(position);
            if (o == null) {
                return CyWidgets.buildStaticCard(mContext);
            }
            RemoteViews card = CyWidgets.buildStackCard(mContext, o, position, getCount(), 0, 0, true);
            return card != null ? card : CyWidgets.buildStaticCard(mContext);
        } catch (Throwable t) {
            Log.e(TAG, "CyFlipperRemoteViewsFactory.getViewAt(" + position + ") failed", t);
            return CyWidgets.buildStaticCard(mContext);
        }
    }

    @Override
    public RemoteViews getLoadingView() {
        try {
            return CyWidgets.buildStaticCard(mContext);
        } catch (Throwable t) {
            return null;
        }
    }

    @Override
    public int getViewTypeCount() {
        return 1;
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }
}
