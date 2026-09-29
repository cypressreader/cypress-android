package com.cypress.reader;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.Window;
import androidx.core.content.FileProvider;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;

/**
 * CyPress's own small bridge between the web app and Android:
 *  - info():       which version is installed
 *  - download():   fetch a new APK from GitHub
 *  - progress():   how far the download is
 *  - install():    hand the APK to Android's installer
 *  - shareFile()/shareText(): the share sheet (backups, images, links)
 *  - setBars():    colour the status and navigation bars to match the current theme
 */
@CapacitorPlugin(name = "CyNative")
public class CyNativePlugin extends Plugin {

    private volatile long received = 0;
    private volatile long total = 0;
    private volatile boolean busy = false;

    private File apkFile() {
        File dir = new File(getContext().getCacheDir(), "apk");
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, "cypress-update.apk");
    }

    @Override
    public void load() {
        // tidy up old downloads
        try {
            File d = new File(getContext().getCacheDir(), "apk");
            File[] fs = d.listFiles();
            if (fs != null) {
                for (File f : fs) {
                    if (System.currentTimeMillis() - f.lastModified() > 2L * 24 * 3600 * 1000) f.delete();
                }
            }
        } catch (Exception e) {
            // ignore
        }
    }

    @PluginMethod
    public void info(PluginCall call) {
        try {
            Context c = getContext();
            PackageInfo pi = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : (long) pi.versionCode;
            boolean can = Build.VERSION.SDK_INT < 26 || c.getPackageManager().canRequestPackageInstalls();
            JSObject r = new JSObject();
            r.put("versionCode", code);
            r.put("versionName", pi.versionName);
            r.put("canInstall", can);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("info failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void progress(PluginCall call) {
        JSObject r = new JSObject();
        r.put("received", received);
        r.put("total", total);
        r.put("busy", busy);
        call.resolve(r);
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null || !url.startsWith("https://")) {
            call.reject("bad url");
            return;
        }
        if (busy) {
            call.reject("already downloading");
            return;
        }
        busy = true;
        received = 0;
        total = 0;
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection con = null;
                try {
                    File out = apkFile();
                    File part = new File(out.getPath() + ".part");
                    con = (HttpURLConnection) java.net.URI.create(url).toURL().openConnection();
                    con.setConnectTimeout(15000);
                    con.setReadTimeout(30000);
                    con.setInstanceFollowRedirects(true);
                    con.setRequestProperty("User-Agent", "CyPress");
                    int code = con.getResponseCode();
                    if (code != 200) throw new Exception("HTTP " + code);
                    total = con.getContentLength();
                    InputStream in = con.getInputStream();
                    OutputStream os = new FileOutputStream(part);
                    byte[] buf = new byte[65536];
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        os.write(buf, 0, n);
                        received += n;
                    }
                    os.close();
                    in.close();
                    if (total > 0 && received != total) throw new Exception("incomplete download");
                    if (received < 100000) throw new Exception("file too small");
                    if (out.exists()) out.delete();
                    if (!part.renameTo(out)) throw new Exception("could not save the file");
                    JSObject r = new JSObject();
                    r.put("size", received);
                    call.resolve(r);
                } catch (Exception e) {
                    call.reject("Download failed: " + e.getMessage());
                } finally {
                    busy = false;
                    if (con != null) con.disconnect();
                }
            }
        }).start();
    }

    @PluginMethod
    public void install(PluginCall call) {
        try {
            Context c = getContext();
            File f = apkFile();
            if (!f.exists()) {
                call.reject("NO_FILE");
                return;
            }
            if (Build.VERSION.SDK_INT >= 26 && !c.getPackageManager().canRequestPackageInstalls()) {
                Intent s = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + c.getPackageName()));
                s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(s);
                call.reject("NEEDS_PERMISSION");
                return;
            }
            Uri uri = FileProvider.getUriForFile(c, c.getPackageName() + ".cyfiles", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Install failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void shareFile(PluginCall call) {
        try {
            String name = call.getString("name", "cypress-file");
            String b64 = call.getString("data", "");
            String mime = call.getString("mime", "application/octet-stream");
            byte[] bytes = android.util.Base64.decode(b64, android.util.Base64.DEFAULT);
            File dir = new File(getContext().getCacheDir(), "share");
            if (!dir.exists()) dir.mkdirs();
            File f = new File(dir, name.replaceAll("[^A-Za-z0-9._-]", "_"));
            FileOutputStream os = new FileOutputStream(f);
            os.write(bytes);
            os.close();
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".cyfiles", f);
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType(mime);
            i.putExtra(Intent.EXTRA_STREAM, uri);
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent ch = Intent.createChooser(i, "Save or share");
            ch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(ch);
            call.resolve();
        } catch (Exception e) {
            call.reject("Share failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void shareText(PluginCall call) {
        try {
            String title = call.getString("title", "");
            String text = call.getString("text", "");
            String url = call.getString("url", "");
            String body = text;
            if (url.length() > 0) body = (text.length() > 0 ? text + "\n" : "") + url;
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("text/plain");
            if (title.length() > 0) i.putExtra(Intent.EXTRA_SUBJECT, title);
            i.putExtra(Intent.EXTRA_TEXT, body);
            Intent ch = Intent.createChooser(i, null);
            ch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(ch);
            call.resolve();
        } catch (Exception e) {
            call.reject("Share failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setBars(final PluginCall call) {
        final String color = call.getString("color", "#F3F1EA");
        final boolean light = call.getBoolean("light", true);
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Window w = getActivity().getWindow();
                    w.getDecorView().setBackgroundColor(Color.parseColor(color));
                    WindowInsetsControllerCompat ctl = WindowCompat.getInsetsController(w, w.getDecorView());
                    ctl.setAppearanceLightStatusBars(light);
                    ctl.setAppearanceLightNavigationBars(light);
                } catch (Exception e) {
                    // ignore
                }
                call.resolve();
            }
        });
    }
}
