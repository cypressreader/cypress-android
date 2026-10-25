package com.cypress.reader;

import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * RemoteViewsService providing swipeable full-bleed card items for the AdapterViewFlipper Top Story widget.
 */
public class CyWidgetService extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new CyFlipperRemoteViewsFactory(this.getApplicationContext(), intent);
    }
}

class CyFlipperRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {

    private final Context mContext;
    private JSONArray mHeadlines;

    public CyFlipperRemoteViewsFactory(Context context, Intent intent) {
        mContext = context;
    }

    @Override
    public void onCreate() {
        mHeadlines = CyExtras.readHeadlines(mContext);
    }

    @Override
    public void onDataSetChanged() {
        mHeadlines = CyExtras.readHeadlines(mContext);
    }

    @Override
    public void onDestroy() {
        mHeadlines = null;
    }

    @Override
    public int getCount() {
        return mHeadlines == null ? 0 : Math.min(mHeadlines.length(), CyWidgets.TOP_N);
    }

    @Override
    public RemoteViews getViewAt(int position) {
        if (mHeadlines == null || position < 0 || position >= mHeadlines.length()) return null;
        JSONObject o = mHeadlines.optJSONObject(position);
        if (o == null) return null;
        return CyWidgets.buildStackCard(mContext, o, position, getCount(), 0, 0, true);
    }

    @Override
    public RemoteViews getLoadingView() {
        return null;
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
