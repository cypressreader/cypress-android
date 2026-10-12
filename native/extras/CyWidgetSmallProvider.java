package com.cypress.reader;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/** B48: small widget — headline-only, the top story. */
public class CyWidgetSmallProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        try {
            JSONArray h = CyExtras.readHeadlines(context);
            JSONObject o = h.length() > 0 ? h.optJSONObject(0) : null;
            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.cy_widget_small);
            if (o != null && o.optString("title", "").length() > 0) {
                rv.setTextViewText(R.id.cy_ws_head, o.optString("title", ""));
                String src = o.optString("src", "").trim();
                rv.setTextViewText(R.id.cy_ws_src, src.toUpperCase(java.util.Locale.getDefault()));
                if (o.optBoolean("read", false)) rv.setFloat(R.id.cy_ws_head, "setAlpha", 0.45f);
                rv.setOnClickPendingIntent(R.id.cy_ws_root, CyExtras.openIntent(context, o.optString("link", ""), 200));
            } else {
                rv.setTextViewText(R.id.cy_ws_head, "Open CyPress to load headlines");
                rv.setViewVisibility(R.id.cy_ws_src, View.GONE);
                rv.setOnClickPendingIntent(R.id.cy_ws_root, CyExtras.openIntent(context, null, 201));
            }
            for (int id : appWidgetIds) manager.updateAppWidget(id, rv);
        } catch (Throwable t) { /* never crash */ }
    }
}
