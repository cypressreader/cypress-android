package com.cypress.reader;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;

/** Headlines widget (4x2, resizable): three or four top stories, more when it is taller. Refreshed on every new edition. */
public class CyWidgetListProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        try {
            for (int id : appWidgetIds) {
                try {
                    manager.updateAppWidget(id, CyWidgets.buildList(context, CyWidgets.widthDp(manager, id), CyWidgets.heightDp(manager, id)));
                } catch (Throwable t) {
                    // one bad widget must not stop the others
                }
            }
        } catch (Throwable t) {
            // never crash
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        try {
            manager.updateAppWidget(appWidgetId, CyWidgets.buildList(context, CyWidgets.widthDp(manager, appWidgetId), CyWidgets.heightDp(manager, appWidgetId)));
        } catch (Throwable t) {
            // never crash
        }
    }
}
