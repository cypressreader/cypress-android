package com.cypress.reader;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;

/** The Daily widget (4x2): progress through this edition and the next story to read. Built in CyWidgets.buildDaily. */
public class CyDailyWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            try {
                manager.updateAppWidget(id, CyWidgets.buildDaily(context, CyWidgets.widthDp(manager, id), CyWidgets.heightDp(manager, id)));
            } catch (Throwable t) {
                // one bad widget must not stop the others
            }
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle newOptions) {
        try {
            manager.updateAppWidget(id, CyWidgets.buildDaily(context, CyWidgets.widthDp(manager, id), CyWidgets.heightDp(manager, id)));
        } catch (Throwable t) {
            // never crash
        }
    }
}
