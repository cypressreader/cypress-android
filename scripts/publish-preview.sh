#!/usr/bin/env bash
# Publish a branch of CyPress to the separate PREVIEW site (never to production).
#
#   scripts/publish-preview.sh <branch> [--dry-run] [--out <dir>]
#
# What it does
#   1. Reads the branch from git (your working tree is not touched).
#   2. Takes the app exactly as the branch builds it: www/index.html is the source of truth,
#      copied over docs/app/ (manifest, service worker, icons) like the normal www -> docs/app convention.
#   3. Stamps it as "CyPress Preview": own page title (with branch and commit), own manifest name,
#      own theme colour, own service-worker cache, and a thin orange bar along the top edge.
#   4. Force-pushes ONLY that stamped copy to the main branch of the `preview` remote
#      (cypressreader/cypress-preview), which GitHub Pages serves from /docs.
#
# It never pushes to `origin`, never touches production main, and refuses to run against a
# `preview` remote that is not the cypress-preview repo.
#
#   --dry-run   build and stamp into a folder, but do not push (used for checking)
#   --out DIR   where --dry-run writes the site (default: a temp folder that is printed)
set -euo pipefail

die() { echo "publish-preview: $*" >&2; exit 1; }

BRANCH="${1:-}"; [ -n "$BRANCH" ] && [ "${BRANCH#-}" = "$BRANCH" ] || die "usage: $0 <branch> [--dry-run] [--out <dir>]"
shift
DRY=0; OUT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --out) OUT="${2:?--out needs a folder}"; shift ;;
    *) die "unknown option $1" ;;
  esac
  shift
done

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# Resolve the branch (local first, then origin's copy).
REF=""
for c in "$BRANCH" "origin/$BRANCH"; do
  if git rev-parse --verify --quiet "$c^{commit}" >/dev/null; then REF="$c"; break; fi
done
[ -n "$REF" ] || die "branch '$BRANCH' not found (try: git fetch origin $BRANCH)"
SHA="$(git rev-parse --short "$REF")"
STAMP="$(date -u '+%Y-%m-%d %H:%M') UTC"

URL=""
if [ "$DRY" = 0 ]; then
  URL="$(git remote get-url preview 2>/dev/null)" || die "no 'preview' remote. Run: git remote add preview https://github.com/cypressreader/cypress-preview.git"
  case "$URL" in
    *cypress-preview*) ;;
    *) die "the 'preview' remote ($URL) is not the cypress-preview repo; refusing to push" ;;
  esac
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/src"
git archive "$REF" www docs/app | tar -x -C "$WORK/src"

SITE="$WORK/site"
if [ "$DRY" = 1 ] && [ -n "$OUT" ]; then SITE="$OUT"; rm -rf "$SITE"; fi
mkdir -p "$SITE/docs/app"
cp -R "$WORK/src/docs/app/." "$SITE/docs/app/"
cp "$WORK/src/www/index.html" "$SITE/docs/app/index.html"   # www/ is the source of truth

BRANCH="$BRANCH" SHA="$SHA" STAMP="$STAMP" SITE="$SITE" python3 - <<'PY'
import json, os, re
site = os.environ["SITE"] + "/docs/app"
branch, sha, stamp = os.environ["BRANCH"], os.environ["SHA"], os.environ["STAMP"]
COLOR = "#d9480f"   # preview orange, different from production's #14171c

p = site + "/index.html"
h = open(p, encoding="utf-8").read()
h = h.replace("<title>CyPress</title>", "<title>CyPress Preview · %s</title>" % sha, 1)
h = h.replace('<meta name="apple-mobile-web-app-title" content="CyPress">', '<meta name="apple-mobile-web-app-title" content="CyPress Preview">', 1)
h = h.replace('<meta name="theme-color" content="#14171c">', '<meta name="theme-color" content="%s">' % COLOR, 1)
bar = ('<div aria-hidden="true" title="CyPress Preview: %s @ %s, %s" style="position:fixed;top:0;left:0;right:0;height:3px;'
       'background:%s;z-index:2147483647;pointer-events:none"></div>' % (branch, sha, stamp, COLOR))
assert "</body>" in h
h = h.replace("</body>", bar + "</body>", 1)
open(p, "w", encoding="utf-8").write(h)

m = site + "/manifest.webmanifest"
d = json.load(open(m, encoding="utf-8"))
d["name"] = "CyPress Preview"
d["short_name"] = "CyPress Preview"
d["description"] = "PREVIEW build (%s @ %s). Not the real app." % (branch, sha)
d["theme_color"] = COLOR
open(m, "w", encoding="utf-8").write(json.dumps(d, indent=2))

s = site + "/sw.js"
t = open(s, encoding="utf-8").read()
t = re.sub(r"const V = '[^']*';", "const V = 'cyp-preview-%s';" % sha, t, 1)
open(s, "w", encoding="utf-8").write(t)
PY

# A tiny front door so the plain site address opens the preview app.
cat > "$SITE/docs/index.html" <<'HTML'
<!doctype html><meta charset="utf-8"><title>CyPress Preview</title>
<meta http-equiv="refresh" content="0; url=app/"><a href="app/">Open the CyPress preview</a>
HTML
: > "$SITE/docs/.nojekyll"
printf 'Preview of %s @ %s (%s)\n' "$BRANCH" "$SHA" "$STAMP" > "$SITE/docs/PREVIEW.txt"

if [ "$DRY" = 1 ]; then
  [ -n "$OUT" ] || { mkdir -p /tmp/cypress-preview-dry && rm -rf /tmp/cypress-preview-dry/* && cp -R "$SITE/." /tmp/cypress-preview-dry/ && SITE=/tmp/cypress-preview-dry; }
  echo "dry run: stamped site is in $SITE/docs (serve that folder to look at it)"
  exit 0
fi

cd "$SITE"
git init -q -b main
git add -A
git -c user.name="$(git -C "$ROOT" config user.name || echo preview)" -c user.email="$(git -C "$ROOT" config user.email || echo preview@example.invalid)" \
  commit -q -m "Preview of $BRANCH @ $SHA ($STAMP)"
git push --force "$URL" main

SLUG="$(printf '%s' "$URL" | sed -E 's#^.*github.com[:/]([^/]+)/([^/.]+)(\.git)?$#\1 \2#')"
OWNER="${SLUG% *}"; REPO="${SLUG#* }"
echo
echo "Published $BRANCH @ $SHA to the preview site."
echo "Open (GitHub Pages can take a minute to refresh): https://${OWNER}.github.io/${REPO}/app/"
