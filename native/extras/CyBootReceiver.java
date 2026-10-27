package com.cypress.reader;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** B83: after the phone restarts or CyPress is updated, the widgets' cycling alarm is gone; start it again and redraw them. */
public class CyBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(final Context context, Intent intent) {
        try {
            String a = intent == null ? null : intent.getAction();
            if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) {
                // keep the process alive until the restart work is done (it runs off the main thread)
                final PendingResult pr = goAsync();
                CyExtras.IMG_EXEC.submit(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            CyWidgets.onBoot(context);
                        } catch (Throwable t) {
                            // never crash on boot
                        } finally {
                            pr.finish();
                        }
                    }
                });
            }
        } catch (Throwable t) {
            // never crash on boot
        }
    }
}
