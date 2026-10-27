package com.cypress.reader;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Ticker widget (4x1): one breaking story at a time, a new one every 15 minutes. */
public class CyWidgetTickerProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        try {
            for (int id : appWidgetIds) {
                try {
                    manager.updateAppWidget(id, CyWidgets.buildTicker(context));
                } catch (Throwable t) {
                    // one bad widget must not stop the others
                }
            }
            CyWidgets.arm(context, false);
        } catch (Throwable t) {
            // never crash
        }
    }

    @Override
    public void onEnabled(Context context) {
        CyWidgets.arm(context, false);
    }

    @Override
    public void onDisabled(Context context) {
        CyWidgets.arm(context, false);
    }
}
