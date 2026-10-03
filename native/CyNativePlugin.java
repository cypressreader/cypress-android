package com.cypress.reader;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
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
import java.net.URI;
import java.util.Locale;

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

    /** Hosts an update may be fetched from: GitHub itself and the two hosts it redirects release files to. */
    private static boolean allowedHost(String h) {
        if (h == null) return false;
        h = h.toLowerCase(Locale.ROOT);
        return h.equals("github.com") || h.equals("objects.githubusercontent.com") || h.equals("release-assets.githubusercontent.com");
    }

    /** https, no credentials, default port, one of the GitHub hosts. */
    private static boolean allowedUrl(String url) {
        try {
            URI u = URI.create(url);
            if (!"https".equalsIgnoreCase(u.getScheme())) return false;
            if (u.getUserInfo() != null) return false;
            if (u.getPort() != -1 && u.getPort() != 443) return false;
            return allowedHost(u.getHost());
        } catch (Throwable t) {
            return false;
        }
    }

    /** The address the page asks for must be a GitHub release file: https://github.com/OWNER/REPO/releases/download/TAG/FILE. */
    private static boolean allowedStart(String url) {
        try {
            if (!allowedUrl(url)) return false;
            URI u = URI.create(url);
            if (!"github.com".equalsIgnoreCase(u.getHost())) return false;
            String path = u.getPath();
            return path != null && path.contains("/releases/download/") && !path.contains("..");
        } catch (Throwable t) {
            return false;
        }
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null || !allowedStart(url)) {
            call.reject("Update address not allowed (only GitHub release files can be installed)");
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
                File out = apkFile();
                File part = new File(out.getPath() + ".part");
                boolean done = false;
                try {
                    // Redirects are followed by hand so that every address on the way is checked, not just the first.
                    String cur = url;
                    int hops = 0;
                    while (true) {
                        if (!allowedUrl(cur)) throw new Exception("address not allowed");
                        con = (HttpURLConnection) URI.create(cur).toURL().openConnection();
                        con.setConnectTimeout(15000);
                        con.setReadTimeout(30000);
                        con.setInstanceFollowRedirects(false);
                        con.setRequestProperty("User-Agent", "CyPress");
                        int code = con.getResponseCode();
                        if (code >= 300 && code < 400) {
                            if (++hops > 5) throw new Exception("too many redirects");
                            String loc = con.getHeaderField("Location");
                            con.disconnect();
                            con = null;
                            if (loc == null) throw new Exception("bad redirect");
                            cur = URI.create(cur).resolve(loc).toString();
                            continue;
                        }
                        if (code != 200) throw new Exception("HTTP " + code);
                        break;
                    }
                    total = con.getContentLength();
                    try (InputStream in = con.getInputStream(); OutputStream os = new FileOutputStream(part)) {
                        byte[] buf = new byte[65536];
                        int n;
                        while ((n = in.read(buf)) > 0) {
                            os.write(buf, 0, n);
                            received += n;
                        }
                    }
                    if (total > 0 && received != total) throw new Exception("incomplete download");
                    if (received < 100000) throw new Exception("file too small");
                    if (out.exists()) out.delete();
                    if (!part.renameTo(out)) throw new Exception("could not save the file");
                    done = true;
                    JSObject r = new JSObject();
                    r.put("size", received);
                    call.resolve(r);
                } catch (Exception e) {
                    call.reject("Download failed: " + e.getMessage());
                } finally {
                    busy = false;
                    if (con != null) con.disconnect();
                    if (!done) part.delete();
                }
            }
        }).start();
    }

    // ---------------------------------------------------------------- checking the downloaded update

    @SuppressWarnings("deprecation")
    private static long codeOf(PackageInfo pi) {
        return Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : (long) pi.versionCode;
    }

    /**
     * The certificates the app is signed with (Android 9 and later): the signers, or for a single-signer app its current
     * key together with any older keys it has rotated from. Null if they cannot be read.
     */
    private static Signature[] signersApi28(PackageInfo pi) {
        SigningInfo si = pi.signingInfo;
        if (si == null) return null;
        Signature[] s = si.hasMultipleSigners() ? si.getApkContentsSigners() : si.getSigningCertificateHistory();
        if (s == null || s.length == 0) s = si.getApkContentsSigners();
        return s;
    }

    @SuppressWarnings("deprecation")
    private static Signature[] signersOf(PackageInfo pi) {
        if (Build.VERSION.SDK_INT >= 28) return signersApi28(pi);
        return pi.signatures;
    }

    /** True when the two sets of certificates have at least one in common. */
    private static boolean overlap(Signature[] a, Signature[] b) {
        if (a == null || b == null) return false;
        for (Signature x : a) {
            for (Signature y : b) {
                if (x.equals(y)) return true;
            }
        }
        return false;
    }

    /** Returns null when the file is a newer build of this same app signed with the same key, otherwise a reason. */
    @SuppressWarnings("deprecation")
    private String problemWithApk(Context c, File f) {
        try {
            PackageManager pm = c.getPackageManager();
            int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
            PackageInfo theirs = pm.getPackageArchiveInfo(f.getAbsolutePath(), flags);
            if (theirs == null) return "UNREADABLE|The downloaded file could not be read as an app";
            if (!c.getPackageName().equals(theirs.packageName)) return "WRONG_APP|The downloaded file is not CyPress";
            PackageInfo mine = pm.getPackageInfo(c.getPackageName(), flags);
            if (codeOf(theirs) <= codeOf(mine)) return "NOT_NEWER|The downloaded file is not a newer version";
            Signature[] a = signersOf(mine);
            Signature[] b = signersOf(theirs);
            boolean have = a != null && a.length > 0 && b != null && b.length > 0;
            if (have) {
                if (!overlap(a, b)) return "BAD_SIGNATURE|The downloaded file is not signed by the same key as this app";
            } else if (Build.VERSION.SDK_INT >= 28) {
                return "UNVERIFIED|Could not check who signed the downloaded file";
            }
            // Before Android 9 reading the signer of an uninstalled file is unreliable; Android's installer still refuses a different key.
            return null;
        } catch (Throwable t) {
            return "UNVERIFIED|Could not check the downloaded file (" + t.getClass().getSimpleName() + ")";
        }
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
            String problem = problemWithApk(c, f);
            if (problem != null) {
                f.delete();
                int bar = problem.indexOf('|');
                call.reject(bar > 0 ? problem.substring(bar + 1) : problem, bar > 0 ? problem.substring(0, bar) : "BAD_APK");
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
