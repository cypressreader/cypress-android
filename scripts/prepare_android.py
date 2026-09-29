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
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, 'android', 'app')
MAIN = os.path.join(APP, 'src', 'main')
RES = os.path.join(MAIN, 'res')
PKG_DIR = os.path.join(MAIN, 'java', 'com', 'cypress', 'reader')
BUILD = os.environ.get('BUILD_NUMBER', '1').strip() or '1'
ICON = os.environ.get('ICON', 'tree').strip() or 'tree'
REPO = os.environ.get('GITHUB_REPOSITORY', '').strip()


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


print('Preparing the Android project (build %s, icon "%s")' % (BUILD, ICON))

if not os.path.isdir(APP):
    die('The Android project was not created. The "npx cap add android" step must run first.')

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
g2, n2 = re.subn(r'versionName\s*=?\s*"[^"]*"', 'versionName "1.0.%s"' % BUILD, g2, count=1)
if n1 != 1 or n2 != 1:
    die('Could not set the version number in build.gradle (versionCode found: %d, versionName found: %d).' % (n1, n2))
# make sure the AndroidX helpers CyPress uses are available (harmless if they already are)
anchor = "implementation project(':capacitor-android')"
if anchor in g2 and 'androidx.core:core:' not in g2:
    g2 = g2.replace(anchor, anchor + '\n    implementation "androidx.core:core:1.15.0"', 1)
    say('added the AndroidX core library')
open(gradle, 'w', encoding='utf-8').write(g2)
say('version set to 1.0.%s (build number %s)' % (BUILD, BUILD))

# 3. launcher icon -------------------------------------------------------------------------
icons = os.path.join(ROOT, 'icons', ICON)
if not os.path.isdir(icons):
    die('There is no icon set called "%s". In build-apk.yml, ICON must be tree or circuit.' % ICON)
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

# 4. plain launch screen (instead of the default Capacitor logo) -----------------------------
count = 0
for f in glob.glob(os.path.join(RES, '**', 'splash*.png'), recursive=True):
    night = 'night' in f
    if solid_png(f, (0x14, 0x17, 0x1C) if night else (0xF3, 0xF1, 0xEA)):
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

print('Done.')
