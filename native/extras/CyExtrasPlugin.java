package com.cypress.reader;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
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

    @Override
    protected void handleOnDestroy() {
        if (CyExtras.plugin == this) CyExtras.plugin = null;
        super.handleOnDestroy();
    }

    /** Called by CyExtras.emit(). */
    void emitEvent(String event, JSObject data, boolean retain) {
        notifyListeners(event, data, retain);
    }

    private static String msg(Throwable t) {
        String m = t.getMessage();
        return t.getClass().getSimpleName() + (m == null ? "" : ": " + m);
    }

    /** Richer touch feedback. Resolves {ok:true} only when this phone's motor supports every effect used; otherwise {ok:false} and the web app buzzes as before. */
    @PluginMethod
    public void haptic(PluginCall call) {
        JSObject r = new JSObject();
        r.put("ok", false);
        try {
            String k = call.getString("k", "soft");
            Vibrator v = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (Build.VERSION.SDK_INT >= 30 && v != null && v.hasVibrator()) {
                int[] ids;
                switch (k) {
                    case "tick": ids = new int[] { VibrationEffect.Composition.PRIMITIVE_TICK }; break;
                    case "deep": ids = new int[] { VibrationEffect.Composition.PRIMITIVE_THUD, VibrationEffect.Composition.PRIMITIVE_THUD }; break;
                    case "mile": ids = new int[] { VibrationEffect.Composition.PRIMITIVE_CLICK, VibrationEffect.Composition.PRIMITIVE_CLICK, VibrationEffect.Composition.PRIMITIVE_THUD }; break;
                    default: ids = new int[] { VibrationEffect.Composition.PRIMITIVE_TICK, VibrationEffect.Composition.PRIMITIVE_LOW_TICK }; break;
                }
                boolean[] ok = v.arePrimitivesSupported(ids);
                boolean all = true;
                for (boolean b : ok) all &= b;
                if (all) {
                    float[] sc = k.equals("deep") ? new float[] { 1f, .6f } : k.equals("mile") ? new float[] { .6f, .6f, 1f } : k.equals("tick") ? new float[] { .4f } : new float[] { .5f, .8f };
                    VibrationEffect.Composition c = VibrationEffect.startComposition();
                    for (int i = 0; i < ids.length; i++) c.addPrimitive(ids[i], sc[i], i == 0 ? 0 : 45);
                    v.vibrate(c.compose());
                    r.put("ok", true);
                }
            }
        } catch (Throwable t) {
            // fall through: the web app buzzes instead
        }
        call.resolve(r);
    }

    @PluginMethod
    public void features(PluginCall call) {
        try {
            call.resolve(CyExtras.obj("{\"features\":[\"share\",\"media\",\"alerts\",\"pack\",\"widget\",\"back\",\"tts\",\"ttsSleep\",\"dsave\",\"dataSaver\",\"haptic\"]}"));
        } catch (Throwable t) {
            call.reject("features failed: " + msg(t));
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
            CyMediaService.posMs = call.getData().optLong("pos", -1L);
            CyMediaService.durMs = call.getData().optLong("dur", 0L);
            CyMediaService.rate = (float) call.getData().optDouble("rate", 1.0);
            CyMediaService.canNext = call.getData().optBoolean("next", true);
            CyMediaService.canPrev = call.getData().optBoolean("prev", true);
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
            CyMediaService.posMs = call.getData().optLong("pos", -1L);
            CyMediaService.durMs = call.getData().optLong("dur", 0L);
            CyMediaService.rate = (float) call.getData().optDouble("rate", 1.0);
            CyMediaService.canNext = call.getData().optBoolean("next", true);
            CyMediaService.canPrev = call.getData().optBoolean("prev", true);
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

    /** "Erase everything": stops the hourly job and removes what the phone side keeps (alert words, the
     *  widget's headlines and pictures, page-check tags, the last fetched stories), then redraws the widgets empty. */
    @PluginMethod
    public void wipe(PluginCall call) {
        try {
            Context c = getContext();
            CyExtras.schedule(c, new JSONObject());
            for (String n : new String[] { "cypress", "cy_ui", "cy_feedcache" }) c.getSharedPreferences(n, Context.MODE_PRIVATE).edit().clear().commit();
            CyExtras.prefs(c).edit().clear().commit();
            for (String n : new String[] { CyExtras.FILE_ITEMS, CyExtras.FILE_PACK, "bg_seen.json" }) new File(c.getFilesDir(), n).delete();
            File[] cs = c.getCacheDir().listFiles();
            if (cs != null) for (File f : cs) if (f.isFile() && f.getName().startsWith("cyw_")) f.delete();
            try { CyWidgets.refreshAll(c); } catch (Throwable t) { /* no widgets placed */ }
            call.resolve();
        } catch (Throwable t) {
            call.reject("wipe failed: " + msg(t));
        }
    }

    /** The phone's own savers: Battery Saver, a metered connection (a hotspot counts) and Data Saver.
     *  The page holds background downloads and heavy effects while they are on. */
    @PluginMethod
    public void deviceState(PluginCall call) {
        JSObject r = new JSObject();
        try {
            Context c = getContext();
            android.os.PowerManager pm = (android.os.PowerManager) c.getSystemService(Context.POWER_SERVICE);
            r.put("powerSave", pm != null && pm.isPowerSaveMode());
            android.net.ConnectivityManager cm = (android.net.ConnectivityManager) c.getSystemService(Context.CONNECTIVITY_SERVICE);
            r.put("metered", cm != null && cm.isActiveNetworkMetered());
            r.put("dataSaver", cm != null && Build.VERSION.SDK_INT >= 24
                && cm.getRestrictBackgroundStatus() == android.net.ConnectivityManager.RESTRICT_BACKGROUND_STATUS_ENABLED);
        } catch (Throwable t) {
            // leave whatever was filled in
        }
        call.resolve(r);
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

    // B48: the widget's save button stashes a link; the app picks it up and saves the story
    @PluginMethod
    public void widgetSaved(PluginCall call) {
        try {
            Context c = getContext();
            android.content.SharedPreferences p = c.getSharedPreferences("cypress", Context.MODE_PRIVATE);
            String link = p.getString("widget_save", null);
            if (link != null) p.edit().remove("widget_save").apply();
            call.resolve(CyExtras.obj("{\"link\":\"" + (link == null ? "" : link.replace("\\", "\\\\").replace("\"", "\\\"")) + "\"}"));
        } catch (Throwable t) {
            call.reject("widgetSaved failed: " + msg(t));
        }
    }

    @PluginMethod
    public void widgetUpdate(PluginCall call) {
        try {
            Context c = getContext();
            JSONObject in = new JSONObject(call.getData().toString());
            JSONArray h = in.optJSONArray("headlines");
            CyExtras.saveHeadlines(c, h == null ? new JSONArray() : h);
            CyWidgets.saveMeta(c, in.has("edition") ? in.optString("edition", "") : null, in.optJSONArray("breaking"));
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
    public void ttsSleepAt(PluginCall call) {
        try {
            long stopAt = call.getData().optLong("stopAt", 0L);
            CyTts.get(getContext()).sleepAt(stopAt);
            call.resolve();
        } catch (Throwable t) {
            call.reject("ttsSleepAt failed: " + msg(t));
        }
    }

    @PluginMethod
    public void ttsSpeak(PluginCall call) {
        try {
            String id = call.getString("id", "");
            String text = call.getString("text", "");
            float rate = (float) call.getData().optDouble("rate", 1.0);
            float pitch = call.getFloat("pitch", 1f);
            float volume = call.getFloat("volume", 1f);
            String voice = call.getString("voice", "");
            boolean add = call.getBoolean("add", false);
            // optional sleep deadline, epoch milliseconds; 0 or missing means none
            long stopAt = call.getData().optLong("stopAt", 0L);
            CyTts.get(getContext()).speak(id, text, rate, pitch, volume, voice, add, stopAt, call.getInt("pause", 0));
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
