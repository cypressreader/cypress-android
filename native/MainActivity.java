package com.cypress.reader;

import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * The app's main activity. Keeps the app clear of the system bars and lets the web page handle the
 * Back button first (window.cyBack), so Back closes a story or panel before it leaves the app.
 * Kept in the core build so it works even when the optional extras are switched off.
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "CyMainActivity";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private OnBackPressedCallback backCallback;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CyNativePlugin.class);
        super.onCreate(savedInstanceState);

        // Keep the app out from under the status bar, camera cut-out, navigation bar and keyboard.
        View root = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets b = insets.getInsets(
                WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
                    | WindowInsetsCompat.Type.ime());
            v.setPadding(b.left, b.top, b.right, b.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        // First colour behind the bars, until the page picks one to match its theme.
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
            == Configuration.UI_MODE_NIGHT_YES;
        getWindow().getDecorView().setBackgroundColor(night ? 0xFF133A28 : 0xFF133A28);

        try {
            installBackHook();
        } catch (Throwable t) {
            Log.w(TAG, "back hook failed: " + t);
        }

    }

    /**
     * Back button handling.
     *
     * Capacitor's BridgeActivity registers its own OnBackPressedCallback (web history back / exit).
     * Callbacks added later run first, so this one (added after super.onCreate) gets priority. It asks
     * the page "window.cyBack && window.cyBack()". If the page returns true it handled the press
     * (closed a panel etc.) and we do nothing. Otherwise we do what would have happened without us:
     * go back in the web history if there is any, else temporarily disable THIS callback and re-dispatch
     * the press so Capacitor's callback (or the default finish) runs. The callback is re-enabled
     * afterwards; because it is disabled during the re-dispatch there is no loop. A 1.5 s watchdog
     * covers a page that never answers.
     */
    private void installBackHook() {
        backCallback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                askPageThenGoBack();
            }
        };
        getOnBackPressedDispatcher().addCallback(this, backCallback);
    }

    private void askPageThenGoBack() {
        WebView wv = null;
        try {
            wv = getBridge().getWebView();
        } catch (Throwable t) {
            // no bridge yet
        }
        if (wv == null) {
            defaultBack(null);
            return;
        }
        final WebView web = wv;
        final AtomicBoolean answered = new AtomicBoolean(false);
        final Runnable watchdog = new Runnable() {
            @Override
            public void run() {
                if (answered.compareAndSet(false, true)) defaultBack(web);
            }
        };
        handler.postDelayed(watchdog, 1500);
        try {
            web.evaluateJavascript("window.cyBack&&window.cyBack()", new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    handler.removeCallbacks(watchdog);
                    if (!answered.compareAndSet(false, true)) return;
                    if ("true".equals(value)) return; // the page handled it
                    defaultBack(web);
                }
            });
        } catch (Throwable t) {
            handler.removeCallbacks(watchdog);
            if (answered.compareAndSet(false, true)) defaultBack(web);
        }
    }

    private void defaultBack(WebView web) {
        try {
            if (web != null && web.canGoBack()) {
                web.goBack();
                return;
            }
            backCallback.setEnabled(false);
            try {
                getOnBackPressedDispatcher().onBackPressed();
            } finally {
                backCallback.setEnabled(true);
            }
        } catch (Throwable t) {
            try {
                moveTaskToBack(true);
            } catch (Throwable t2) {
                finish();
            }
        }
    }
}
