package com.cypress.reader;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

/** Home-screen widget: the top three headlines. Tapping a row opens it in CyPress. */
public class CyWidgetProvider extends AppWidgetProvider {

    private static final int[] ROWS = { R.id.cy_w_row1, R.id.cy_w_row2, R.id.cy_w_row3 };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        try {
            RemoteViews rv = build(context);
            for (int id : appWidgetIds) manager.updateAppWidget(id, rv);
        } catch (Throwable t) {
            // a broken widget must never crash the app
        }
    }

    static RemoteViews build(Context c) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.cy_widget);
        JSONArray h = CyExtras.readHeadlines(c);
        int shown = 0;
        for (int i = 0; i < ROWS.length; i++) {
            JSONObject o = i < h.length() ? h.optJSONObject(i) : null;
            String title = o == null ? "" : o.optString("title", "");
            if (title.length() == 0) {
                rv.setViewVisibility(ROWS[i], View.GONE);
                continue;
            }
            shown++;
            rv.setViewVisibility(ROWS[i], View.VISIBLE);
            rv.setTextViewText(ROWS[i], title);
            rv.setOnClickPendingIntent(ROWS[i], CyExtras.openIntent(c, o.optString("link", ""), 92 + i));
        }
        rv.setViewVisibility(R.id.cy_w_empty, shown == 0 ? View.VISIBLE : View.GONE);
        rv.setOnClickPendingIntent(R.id.cy_w_title, CyExtras.openIntent(c, null, 90));
        rv.setOnClickPendingIntent(R.id.cy_w_root, CyExtras.openIntent(c, null, 91));
        return rv;
    }
}
