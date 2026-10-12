package com.cypress.reader;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;

/** B48: large widget — several top stories as a tappable list. */
public class CyWidgetLargeProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        try {
            JSONArray h = CyExtras.readHeadlines(context);
            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.cy_widget_large);
            rv.removeAllViews(R.id.cy_wl_list);
            int n = Math.min(h.length(), 4);
            for (int i = 0; i < n; i++) {
                JSONObject o = h.optJSONObject(i);
                if (o == null || o.optString("title", "").length() == 0) continue;
                RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.cy_widget_large_row);
                row.setTextViewText(R.id.cy_wlr_head, o.optString("title", ""));
                String src = o.optString("src", "").trim();
                row.setTextViewText(R.id.cy_wlr_src, src.toUpperCase(java.util.Locale.getDefault()));
                row.setViewVisibility(R.id.cy_wlr_src, src.length() == 0 ? View.GONE : View.VISIBLE);
                if (o.optBoolean("read", false)) row.setFloat(R.id.cy_wlr_head, "setAlpha", 0.45f);
                row.setOnClickPendingIntent(R.id.cy_wlr_root, CyExtras.openIntent(context, o.optString("link", ""), 210 + i));
                rv.addView(R.id.cy_wl_list, row);
            }
            rv.setOnClickPendingIntent(R.id.cy_wl_root, CyExtras.openIntent(context, null, 220));
            for (int id : appWidgetIds) manager.updateAppWidget(id, rv);
        } catch (Throwable t) { /* never crash */ }
    }
}
