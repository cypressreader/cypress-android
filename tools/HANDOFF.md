# CyPress: handoff notes for a new working session

CyPress is a single-file HTML RSS reader (`www/index.html`) built into a signed Android app (Capacitor 7) by GitHub Actions, and also served as an iPhone web app. Owner: Dave.

## Standing rules from Dave
- Do NOT build or push app changes (anything outside `docs/**` and `README.md`) until he says "build". A push to `main` that touches anything else starts an APK build and a release.
- Test thoroughly and proactively; use the browser when something can't be reached from the sandbox.
- Keep the app and Settings intuitive. Give percentage-done updates while working.
- Build reports must cover: what was built, honest limits, update steps, decisions needed.
- Commit messages end with the attribution lines the session gives you.

## Release process
1. Edit the app, mirror it to `www/index.html` and `docs/app/index.html` (same file).
2. Bump `APP_VERSION` and `APP_LABEL` in the app, the `CHANGES` list, `whats-new.txt` (new section with the label) and `APP_LABEL` in `.github/workflows/build-apk.yml`.
3. Run the test sweep (below), then one commit, push to `main`.
4. Actions builds and publishes a release. Update on the phone: Settings, App updates, Check for updates, Update now.
The line `const CP_REPO='';` must stay in the app: the build fills in the repo name.

## Web and sharing
- Domain `cypressreader.com` (Cloudflare registrar, auto-renew on). A Cloudflare Worker named `cypress-share` is attached to the root domain.
- Worker source: `docs/worker/share-worker.js`. It serves `/s/<payload>` (shared story pages with preview tags), `/get` (latest APK), `/feed?u=` (feed fetcher for the web app, same-site requests only, plain text out), and proxies everything else from GitHub Pages (`docs/`), so the site and web app at `/app/` appear under the domain.
- To deploy a Worker change: Cloudflare dashboard, Workers, cypress-share, Edit code. Paste the source as one line (comments removed), then Deploy. The editor needs auto-closing brackets/quotes off, and Cmd+A then Delete to clear.
- Pages (`docs/`) is public. `docs/**` and `README.md` are ignored by the build workflow, so website-only pushes do not build the APK.
- Share links: the app compresses the story into the URL after `/s/`. The page `docs/s.html` decodes it.

## Tests (`tools/tests`)
Playwright scripts that load the app from `/mnt/user-data/outputs/cypress.html` (adjust paths at the top of each file; the mock lives in `mock.js` / `mock2.js`). Full sweep: `bash runall.sh` (about 14 minutes). Also: `audit.js`, `deep*.js`, `web.js` (web app as served from cypressreader.com), `worker_test2.mjs` (Worker), `shr4.js` (share), `menu.js`, `fonts.js`, `pk.js` (dropdown picker).
Known stale checks (not bugs): st5 reports 4 failures (add-feed chips removed earlier; packs reuse an existing matching folder); st10 prints `bad 6` on 1.13 and later.
Do not use `pkill -f` with text that appears in your own command line. Do not poll with `setInterval` inside the mock (fake-clock tests hang).

## Account and access notes
- The GitHub account was renamed to `cypressreader`. Older sessions were bound to the old name `davealmaguer-hub`; pushes still worked through GitHub's redirect, but the API did not.
- Cloudflare account id `cbc8ef24792cbf676d3717119cf1abb6`. The built-in browser pane on Dave's Mac is signed in to Cloudflare and GitHub.
