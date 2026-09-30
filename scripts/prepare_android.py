#!/usr/bin/env python3
"""
Runs on GitHub's build machine right after `npx cap add android`.
It adds CyPress's own Android code, launcher icon, install permission and version
number to the freshly generated Android project.

It is strict on purpose: if anything looks different from what it expects, it stops
with a clear message instead of quietly producing a broken app.
"""
import glob
import os
import re
import shutil
import struct
import sys
import xml.etree.ElementTree as ET
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, 'android', 'app')
MAIN = os.path.join(APP, 'src', 'main')
RES = os.path.join(MAIN, 'res')
PKG_DIR = os.path.join(MAIN, 'java', 'com', 'cypress', 'reader')
BUILD = os.environ.get('BUILD_NUMBER', '1').strip() or '1'
LABEL = os.environ.get('APP_LABEL', '').strip() or ('1.0.' + BUILD)
ICON = os.environ.get('ICON', 'tree').strip() or 'tree'
LOGOS = ('tree', 'circuit', 'crimson', 'golden', 'terminal', 'broadsheet', 'midnight', 'rose')

REPO = os.environ.get('GITHUB_REPOSITORY', '').strip()
# Optional extras (notifications, background audio, widget, icon switch, share target).
# EXTRAS=0 builds the core app only. --strip-extras undoes the extras in an already prepared project.
EXTRAS = os.environ.get('EXTRAS', '1').strip().lower() not in ('0', 'false', 'no', 'off')
STRIP_ONLY = '--strip-extras' in sys.argv
NATIVE = os.path.join(ROOT, 'native')
XDIR = os.path.join(NATIVE, 'extras')
MANIFEST = os.path.join(MAIN, 'AndroidManifest.xml')
BACKUP = MANIFEST + '.cy-orig'
GRADLE = os.path.join(APP, 'build.gradle')
WORK_LINE = '\n    implementation "androidx.work:work-runtime:2.9.1"'
ANDROID_NS = '{http://schemas.android.com/apk/res/android}'


def die(msg):
    print('::error::' + msg)
    sys.exit(1)


def say(msg):
    print('  - ' + msg)


def copy(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(src, dst)


def solid_png(path, rgb):
    """Overwrite a PNG with one flat colour, keeping its exact size."""
    with open(path, 'rb') as f:
        head = f.read(33)
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        return False
    w, h = struct.unpack('>II', head[16:24])

    def chunk(tag, data):
        body = tag + data
        return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xFFFFFFFF)

    row = b'\x00' + bytes((w + 7) // 8)          # filter byte + 1-bit pixels, all palette index 0
    raw = zlib.compress(row * h, 9)
    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 1, 3, 0, 0, 0))
           + chunk(b'PLTE', bytes(rgb))
           + chunk(b'IDAT', raw)
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
    return True



# ---------------------------------------------------------------------------------------
# Optional extras. Everything below is kept apart from the core steps so that a problem with
# the extras can be undone (strip_extras) and the core app still builds.
# ---------------------------------------------------------------------------------------
class ExtrasError(Exception):
    pass


def xdie(msg):
    raise ExtrasError(msg)


SHARE_FILTER = """            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>
"""

ALIAS_TMPL = """        <activity-alias
            android:name=".%(name)s"
            android:enabled="%(enabled)s"
            android:exported="true"
            android:icon="@mipmap/ic_launcher_%(logo)s"
            android:roundIcon="@mipmap/ic_launcher_%(logo)s_round"
            android:label="@string/app_name"
            android:targetActivity=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity-alias>
"""


def edit_manifest():
    """Launcher entry moves from MainActivity to two switchable aliases; MainActivity becomes a share target."""
    if not os.path.isfile(MANIFEST):
        xdie('android/app/src/main/AndroidManifest.xml is missing.')
    if os.path.isfile(BACKUP):
        shutil.copyfile(BACKUP, MANIFEST)          # start from the pristine copy: idempotent
    else:
        shutil.copyfile(MANIFEST, BACKUP)
    s = open(MANIFEST, encoding='utf-8').read()
    if '<application' not in s:
        xdie('The generated AndroidManifest.xml has no <application> element.')

    starts = [m for m in re.finditer(r'<activity\b[^>]*>', s)
              if re.search(r'android:name\s*=\s*"\.MainActivity"', m.group(0))]
    if len(starts) != 1:
        xdie('Expected exactly one <activity android:name=".MainActivity"> in the manifest, found %d.' % len(starts))
    st = starts[0]
    if st.group(0).rstrip().endswith('/>'):
        xdie('MainActivity is declared as an empty element; expected an intent-filter inside it.')
    end = s.find('</activity>', st.end())
    if end < 0:
        xdie('Could not find the end of the MainActivity element.')
    body = s[st.end():end]

    filters = list(re.finditer(r'[ \t]*<intent-filter\b[^>]*>.*?</intent-filter>[ \t]*\n?', body, re.S))
    launcher = [m for m in filters
                if 'android.intent.action.MAIN' in m.group(0) and 'android.intent.category.LAUNCHER' in m.group(0)]
    if len(launcher) != 1:
        xdie('Expected exactly one MAIN/LAUNCHER intent-filter on MainActivity, found %d.' % len(launcher))
    body = body[:launcher[0].start()] + body[launcher[0].end():]
    if 'android.intent.action.SEND' not in body:
        body = body.rstrip() + '\n\n' + SHARE_FILTER + '        '
    aliases = '\n'.join(ALIAS_TMPL % {'name': 'Icon' + l.capitalize(), 'logo': l, 'enabled': 'true' if ICON == l else 'false'} for l in LOGOS)
    close = end + len('</activity>')
    s = s[:st.end()] + body + '</activity>\n\n' + aliases + s[close:]
    open(MANIFEST, 'w', encoding='utf-8').write(s)
    check_manifest()


def check_manifest():
    """Prove the edited manifest is well-formed and has the structure the app code relies on."""
    try:
        root = ET.parse(MANIFEST).getroot()
    except ET.ParseError as e:
        xdie('The edited AndroidManifest.xml is not valid XML: %s' % e)
    app = root.find('application')
    if app is None:
        xdie('No <application> in the edited manifest.')

    def has(el, kind, value):
        for f in el.findall('intent-filter'):
            if any(x.get(ANDROID_NS + 'name') == value for x in f.findall(kind)):
                return True
        return False

    mains = [a for a in app.findall('activity') if a.get(ANDROID_NS + 'name') == '.MainActivity']
    if len(mains) != 1:
        xdie('MainActivity went missing from the edited manifest.')
    if has(mains[0], 'category', 'android.category.LAUNCHER') or has(mains[0], 'category', 'android.intent.category.LAUNCHER'):
        xdie('MainActivity still has a LAUNCHER filter.')
    if not has(mains[0], 'action', 'android.intent.action.SEND'):
        xdie('MainActivity has no share (SEND) filter.')
    found = {}
    for a in app.findall('activity-alias'):
        found[a.get(ANDROID_NS + 'name')] = a
    for name, logo in (('.Icon' + l.capitalize(), l) for l in LOGOS):
        a = found.get(name)
        if a is None:
            xdie('Alias %s is missing.' % name)
        if a.get(ANDROID_NS + 'targetActivity') != '.MainActivity':
            xdie('Alias %s does not point to MainActivity.' % name)
        if a.get(ANDROID_NS + 'icon') != '@mipmap/ic_launcher_' + logo:
            xdie('Alias %s has the wrong icon.' % name)
        if not (has(a, 'action', 'android.intent.action.MAIN') and has(a, 'category', 'android.intent.category.LAUNCHER')):
            xdie('Alias %s has no MAIN/LAUNCHER filter.' % name)
        want = 'true' if ICON == logo else 'false'
        if a.get(ANDROID_NS + 'enabled') != want:
            xdie('Alias %s has the wrong enabled state.' % name)


def adaptive_xml(logo, suffix):
    return ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@color/ic_launcher_bg_%s"/>\n'
            '    <foreground android:drawable="@mipmap/ic_launcher_%s_foreground"/>\n'
            '</adaptive-icon>\n' % (logo, logo))


def install_extra_icons():
    """Both logos, under names the launcher aliases point at."""
    for logo in LOGOS:
        src_root = os.path.join(ROOT, 'icons', logo)
        n = 0
        for d in sorted(glob.glob(os.path.join(src_root, 'mipmap-*dpi'))):
            dname = os.path.basename(d)
            for base in ('ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground'):
                src = os.path.join(d, base + '.png')
                if not os.path.isfile(src):
                    xdie('Missing icon file icons/%s/%s/%s.png' % (logo, dname, base))
                copy(src, os.path.join(RES, dname, base.replace('ic_launcher', 'ic_launcher_' + logo, 1) + '.png'))
                n += 1
        if n < 15:
            xdie('Icon set "%s" is incomplete (%d files).' % (logo, n))
        bgx = open(os.path.join(src_root, 'values', 'ic_launcher_background.xml'), encoding='utf-8').read()
        with open(os.path.join(RES, 'values', 'ic_launcher_bg_%s.xml' % logo), 'w', encoding='utf-8') as f:
            f.write(bgx.replace('name="ic_launcher_background"', 'name="ic_launcher_bg_%s"' % logo))
        for suffix in ('', '_round'):
            path = os.path.join(RES, 'mipmap-anydpi-v26', 'ic_launcher_%s%s.xml' % (logo, suffix))
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(adaptive_xml(logo, suffix))
    if not os.path.isfile(os.path.join(RES, 'values', 'ic_launcher_background.xml')):
        xdie('The launcher background colour resource is missing.')


def extras_files():
    java = sorted(glob.glob(os.path.join(XDIR, '*.java')))
    res = []
    for f in glob.glob(os.path.join(XDIR, 'res', '**', '*'), recursive=True):
        if os.path.isfile(f):
            res.append(os.path.relpath(f, os.path.join(XDIR, 'res')))
    return java, sorted(res)


def apply_extras():
    print('Adding the optional extras')
    java, res = extras_files()
    names = [os.path.basename(f) for f in java]
    for need in ('MainActivity.java', 'CyExtras.java', 'CyExtrasPlugin.java', 'CyMediaService.java',
                 'CyBgWorker.java', 'CyWidgetProvider.java'):
        if need not in names:
            xdie('native/extras/%s is missing.' % need)
    if not os.path.isfile(os.path.join(XDIR, 'AndroidManifest.extras.xml')):
        xdie('native/extras/AndroidManifest.extras.xml is missing.')
    if not res:
        xdie('native/extras/res is empty.')

    # gradle first (it has an anchor that may be missing), then the manifest, then copy files
    if not os.path.isfile(GRADLE):
        xdie('android/app/build.gradle is missing.')
    g = open(GRADLE, encoding='utf-8').read()
    anchor = "implementation project(':capacitor-android')"
    if anchor not in g:
        xdie("build.gradle has no \"%s\" line to attach the WorkManager dependency to." % anchor)
    if 'androidx.work:work-runtime' not in g:
        g = g.replace(anchor, anchor + WORK_LINE, 1)
        open(GRADLE, 'w', encoding='utf-8').write(g)
    say('added the WorkManager library')

    edit_manifest()
    say('launcher icon switch (2 aliases) and share target added to the manifest')

    for f in java:
        copy(f, os.path.join(PKG_DIR, os.path.basename(f)))
    for rel in res:
        copy(os.path.join(XDIR, 'res', rel), os.path.join(RES, rel))
    copy(os.path.join(XDIR, 'AndroidManifest.extras.xml'), os.path.join(APP, 'src', 'release', 'AndroidManifest.xml'))
    say('added %d extras code files and %d resource files' % (len(java), len(res)))

    install_extra_icons()
    say('installed both launcher icons for the switcher')


def strip_extras():
    """Puts the project back to the core-only state (what EXTRAS=0 would have produced)."""
    print('Removing the optional extras')
    java, res = extras_files()
    for f in java:
        name = os.path.basename(f)
        if name == 'MainActivity.java':
            continue
        dst = os.path.join(PKG_DIR, name)
        if os.path.isfile(dst):
            os.remove(dst)
    core_main = os.path.join(NATIVE, 'MainActivity.java')
    if not os.path.isfile(core_main):
        die('Missing native/MainActivity.java.')
    copy(core_main, os.path.join(PKG_DIR, 'MainActivity.java'))
    copy(os.path.join(NATIVE, 'AndroidManifest.release.xml'), os.path.join(APP, 'src', 'release', 'AndroidManifest.xml'))

    for rel in res:
        dst = os.path.join(RES, rel)
        if os.path.isfile(dst):
            os.remove(dst)
    for sub in ('drawable', 'layout', 'xml'):
        d = os.path.join(RES, sub)
        if os.path.isdir(d) and not os.listdir(d):
            os.rmdir(d)
    for pat in tuple('mipmap*/ic_launcher_%s*' % l for l in LOGOS) + tuple('values/ic_launcher_bg_%s.xml' % l for l in LOGOS):
        for f in glob.glob(os.path.join(RES, pat)):
            if os.path.isfile(f):
                os.remove(f)

    if os.path.isfile(GRADLE):
        g = open(GRADLE, encoding='utf-8').read()
        if WORK_LINE in g:
            open(GRADLE, 'w', encoding='utf-8').write(g.replace(WORK_LINE, '', 1))

    if os.path.isfile(BACKUP):
        shutil.copyfile(BACKUP, MANIFEST)
        os.remove(BACKUP)
    say('project is back to the core app')


def flag_extras_failed():
    envf = os.environ.get('GITHUB_ENV')
    if envf:
        with open(envf, 'a', encoding='utf-8') as f:
            f.write('EXTRAS_FAILED=1\n')


print('Preparing the Android project (build %s, icon "%s")' % (BUILD, ICON))

if not os.path.isdir(APP):
    die('The Android project was not created. The "npx cap add android" step must run first.')

if STRIP_ONLY:
    strip_extras()
    print('Done.')
    sys.exit(0)

# 1. CyPress's native code -------------------------------------------------------------
os.makedirs(PKG_DIR, exist_ok=True)
for name in ('MainActivity.java', 'CyNativePlugin.java', 'CyFileProvider.java'):
    src = os.path.join(ROOT, 'native', name)
    if not os.path.isfile(src):
        die('Missing native/%s in the repository. Upload the whole folder, including native.' % name)
    copy(src, os.path.join(PKG_DIR, name))
say('added the CyPress Android code')

copy(os.path.join(ROOT, 'native', 'cy_paths.xml'), os.path.join(RES, 'xml', 'cy_paths.xml'))
copy(os.path.join(ROOT, 'native', 'AndroidManifest.release.xml'),
     os.path.join(APP, 'src', 'release', 'AndroidManifest.xml'))
say('added the install permission and file sharing')

# 2. version number ----------------------------------------------------------------------
gradle = os.path.join(APP, 'build.gradle')
if not os.path.isfile(gradle):
    die('Could not find android/app/build.gradle. Capacitor may have changed its project layout.')
g = open(gradle, encoding='utf-8').read()
g2, n1 = re.subn(r'versionCode\s*=?\s*\d+', 'versionCode %s' % BUILD, g, count=1)
g2, n2 = re.subn(r'versionName\s*=?\s*"[^"]*"', 'versionName "%s"' % LABEL, g2, count=1)
if n1 != 1 or n2 != 1:
    die('Could not set the version number in build.gradle (versionCode found: %d, versionName found: %d).' % (n1, n2))
# make sure the AndroidX helpers CyPress uses are available (harmless if they already are)
anchor = "implementation project(':capacitor-android')"
if anchor in g2 and 'androidx.core:core:' not in g2:
    g2 = g2.replace(anchor, anchor + '\n    implementation "androidx.core:core:1.15.0"', 1)
    say('added the AndroidX core library')
open(gradle, 'w', encoding='utf-8').write(g2)
say('version set to %s (build number %s)' % (LABEL, BUILD))

# 3. launcher icon -------------------------------------------------------------------------
icons = os.path.join(ROOT, 'icons', ICON)
if not os.path.isdir(icons):
    die('There is no icon set called "%s". In build-apk.yml, ICON must be one of: tree, circuit, crimson, golden, terminal, broadsheet, midnight, rose.' % ICON)
removed = 0
for pat in ('mipmap*/ic_launcher*', 'drawable*/ic_launcher*', 'values/ic_launcher_background.xml'):
    for f in glob.glob(os.path.join(RES, pat)):
        if os.path.isfile(f):
            os.remove(f)
            removed += 1
for src in glob.glob(os.path.join(icons, '**', '*'), recursive=True):
    if os.path.isfile(src):
        copy(src, os.path.join(RES, os.path.relpath(src, icons)))
if not os.path.isfile(os.path.join(RES, 'mipmap-xxxhdpi', 'ic_launcher.png')):
    die('The launcher icon was not installed.')
say('launcher icon installed (%s), replaced %d default files' % (ICON, removed))

# 4. plain deep-green launch screen (instead of the default Capacitor logo) -----------------------------
count = 0
for f in glob.glob(os.path.join(RES, '**', 'splash*.png'), recursive=True):
    if solid_png(f, (0x13, 0x3A, 0x28)):
        count += 1
say('launch screen images recolored: %d' % count)

# 5. tell the web app which GitHub repository to check for updates ---------------------------
index = os.path.join(ROOT, 'www', 'index.html')
if not os.path.isfile(index):
    die('www/index.html is missing.')
h = open(index, encoding='utf-8').read()
if "const CP_REPO='';" not in h:
    die('www/index.html does not look like the CyPress app (no update marker). Upload the latest index.html.')
if REPO:
    h = h.replace("const CP_REPO='';", "const CP_REPO='%s';" % REPO, 1)
    open(index, 'w', encoding='utf-8').write(h)
    say('updates will be read from github.com/%s' % REPO)
else:
    say('no repository name given, so in-app updates are off in this build')

# 6. optional extras: if anything about them goes wrong they are removed again and the core app is built
if EXTRAS:
    try:
        apply_extras()
    except Exception as e:
        print('::warning title=Optional extras skipped::%s' % e)
        try:
            strip_extras()
        except Exception as e2:
            die('Could not undo the optional extras (%s). Set EXTRAS to 0 in the workflow.' % e2)
        flag_extras_failed()
else:
    say('optional extras are switched off (EXTRAS=0)')

print('Done.')
