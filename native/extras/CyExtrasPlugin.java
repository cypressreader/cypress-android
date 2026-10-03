package com.cypress.reader;

import android.content.Context;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The optional extras, exposed to the web app as the "CyExtras" plugin.
 * Every method catches everything and rejects with a message; nothing here may crash the app.
 */
@CapacitorPlugin(
    name = "CyExtras",
    permissions = { @Permission(strings = { "android.permission.POST_NOTIFICATIONS" }, alias = "notifications") }
)
public class CyExtrasPlugin extends Plugin {

    @Override
    public void load() {
        CyExtras.plugin = this;
    }

    /** Called by CyExtras.emit(). */
    void emitEvent(String event, JSObject data, boolean retain) {
        notifyListeners(event, data, retain);
    }

    private static String msg(Throwable t) {
        String m = t.getMessage();
        return t.getClass().getSimpleName() + (m == null ? "" : ": " + m);
    }

    @PluginMethod
    public void features(PluginCall call) {
        try {
            call.resolve(CyExtras.obj("{\"features\":[\"icon\",\"share\",\"media\",\"alerts\",\"pack\",\"widget\",\"back\",\"tts\",\"ttsSleep\",\"dsave\",\"dataSaver\"]}"));
        } catch (Throwable t) {
            call.reject("features failed: " + msg(t));
        }
    }

    // ---- launcher icon

    @PluginMethod
    public void setAppIcon(PluginCall call) {
        try {
            String icon = call.getString("icon", "tree");
            String now = CyExtras.setIcon(getContext(), icon);
            JSObject r = new JSObject();
            r.put("icon", now);
            call.resolve(r);
        } catch (Throwable t) {
            call.reject("setAppIcon failed: " + msg(t));
        }
    }

    @PluginMethod
    public void getAppIcon(PluginCall call) {
        try {
            JSObject r = new JSObject();
            r.put("icon", CyExtras.getIcon(getContext()));
            r.put("states", CyExtras.iconStates(getContext()));
            call.resolve(r);
        } catch (Throwable t) {
            call.reject("getAppIcon failed: " + msg(t));
        }
    }

    // ---- share target / notification taps

    @PluginMethod
    public void getPendingShare(PluginCall call) {
        try {
            call.resolve(CyExtras.takePendingShare());
        } catch (Throwable t) {
            call.reject("getPendingShare failed: " + msg(t));
        }
    }

    @PluginMethod
    public void getPendingOpen(PluginCall call) {
        try {
            JSObject r = new JSObject();
            String u = CyExtras.takePendingOpen();
            if (u != null) r.put("url", u);
            call.resolve(r);
        } catch (Throwable t) {
            call.reject("getPendingOpen failed: " + msg(t));
        }
    }

    // ---- notifications permission

    private void resolveNotif(PluginCall call) {
        JSObject r = new JSObject();
        // Below Android 13 there is no runtime permission; the user can still switch notifications off in Settings.
        r.put("granted", CyExtras.notificationsEnabled(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void notifStatus(PluginCall call) {
        try {
            resolveNotif(call);
        } catch (Throwable t) {
            call.reject("notifStatus failed: " + msg(t));
        }
    }

    @PluginMethod
    public void notifPermission(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT < 33 || CyExtras.notificationsEnabled(getContext())) {
                resolveNotif(call);
                return;
            }
            requestPermissionForAlias("notifications", call, "notifPermissionResult");
        } catch (Throwable t) {
            call.reject("notifPermission failed: " + msg(t));
        }
    }

    @PermissionCallback
    public void notifPermissionResult(PluginCall call) {
        try {
            JSObject r = new JSObject();
            r.put("granted", CyExtras.notificationsEnabled(getContext()));
            call.resolve(r);
        } catch (Throwable t) {
            call.reject("notifPermission failed: " + msg(t));
        }
    }

    // ---- media (reading aloud)

    @PluginMethod
    public void mediaStart(PluginCall call) {
        try {
            String title = call.getString("title", "CyPress");
            String sub = call.getString("subtitle", "");
            CyMediaService.start(getContext(), title, sub, true, call.getString("image", ""));
            call.resolve();
        } catch (Throwable t) {
            call.reject("mediaStart failed: " + msg(t));
        }
    }

    @PluginMethod
    public void mediaUpdate(PluginCall call) {
        try {
            String title = call.getString("title", "CyPress");
            String sub = call.getString("subtitle", "");
            boolean playing = call.getBoolean("playing", true);
            CyMediaService.update(getContext(), title, sub, playing, call.getString("image", ""));
            call.resolve();
        } catch (Throwable t) {
            call.reject("mediaUpdate failed: " + msg(t));
        }
    }

    @PluginMethod
    public void mediaStop(PluginCall call) {
        try {
            CyMediaService.stop(getContext());
            call.resolve();
        } catch (Throwable t) {
            call.reject("mediaStop failed: " + msg(t));
        }
    }

    // ---- background sync

    @PluginMethod
    public void bgConfigure(PluginCall call) {
        try {
            Context c = getContext();
            JSONObject in = new JSONObject(call.getData().toString());
            JSONObject cfg = CyExtras.saveConfig(c, in);
            CyExtras.schedule(c, cfg);
            call.resolve();
        } catch (Throwable t) {
            call.reject("bgConfigure failed: " + msg(t));
        }
    }

    @PluginMethod
    public void bgItems(PluginCall call) {
        try {
            int limit = call.getInt("limit", 100);
            if (limit < 1) limit = 1;
            String s = CyExtras.readFile(new File(getContext().getFilesDir(), CyExtras.FILE_ITEMS));
            JSONArray src = s == null ? new JSONArray() : new JSONArray(s);
            JSONArray out = new JSONArray();
            for (int i = 0; i < src.length() && i < limit; i++) out.put(src.get(i));
            JSONObject o = new JSONObject();
            o.put("items", out);
            call.resolve(CyExtras.obj(o.toString()));
        } catch (Throwable t) {
            call.reject("bgItems failed: " + msg(t));
        }
    }

    @PluginMethod
    public void packGet(PluginCall call) {
        try {
            String s = CyExtras.readFile(new File(getContext().getFilesDir(), CyExtras.FILE_PACK));
            if (s == null) s = "{\"date\":\"\",\"items\":[]}";
            call.resolve(CyExtras.obj(s));
        } catch (Throwable t) {
            call.reject("packGet failed: " + msg(t));
        }
    }

    @PluginMethod
    public void bgRunNow(PluginCall call) {
        try {
            CyExtras.runNow(getContext());
            call.resolve();
        } catch (Throwable t) {
            call.reject("bgRunNow failed: " + msg(t));
        }
    }

    @PluginMethod
    public void alertsTest(PluginCall call) {
        try {
            boolean shown = CyExtras.post(getContext(), CyExtras.CH_ALERTS, 7390,
                "CyPress alerts are working", "You will see matching headlines like this one.", null, null, false);
            JSObject r = new JSObject();
            r.put("shown", shown);
            call.resolve(r);
        } catch (Throwable t) {
            call.reject("alertsTest failed: " + msg(t));
        }
    }

    // ---- widget

    @PluginMethod
    public void widgetUpdate(PluginCall call) {
        try {
            Context c = getContext();
            JSONObject in = new JSONObject(call.getData().toString());
            JSONArray h = in.optJSONArray("headlines");
            CyExtras.saveHeadlines(c, h == null ? new JSONArray() : h);
            CyExtras.updateWidgets(c);
            call.resolve();
        } catch (Throwable t) {
            call.reject("widgetUpdate failed: " + msg(t));
        }
    }

    // ---- text to speech (the web view has no speechSynthesis of its own)

    @PluginMethod
    public void ttsVoices(PluginCall call) {
        try {
            call.resolve(CyTts.get(getContext()).voices());
        } catch (Throwable t) {
            call.reject("ttsVoices failed: " + msg(t));
        }
    }

    @PluginMethod
    public void ttsSpeak(PluginCall call) {
        try {
            String id = call.getString("id", "");
            String text = call.getString("text", "");
            float rate = call.getFloat("rate", 1f);
            float pitch = call.getFloat("pitch", 1f);
            float volume = call.getFloat("volume", 1f);
            String voice = call.getString("voice", "");
            boolean add = call.getBoolean("add", false);
            // optional sleep deadline, epoch milliseconds; 0 or missing means none
            long stopAt = call.getData().optLong("stopAt", 0L);
            CyTts.get(getContext()).speak(id, text, rate, pitch, volume, voice, add, stopAt);
            call.resolve();
        } catch (Throwable t) {
            call.reject("ttsSpeak failed: " + msg(t));
        }
    }

    @PluginMethod
    public void ttsStop(PluginCall call) {
        try {
            CyTts.get(getContext()).stop();
            call.resolve();
        } catch (Throwable t) {
            call.reject("ttsStop failed: " + msg(t));
        }
    }
}
