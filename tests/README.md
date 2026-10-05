# CyPress tests

Browser tests for the single-file app (`www/index.html`), run with Playwright's Chromium.

    npm i -g playwright && npx playwright install chromium   # once
    tests/run.sh                                             # whole suite, about ten minutes
    node tests/layout.js                                     # just the messy-data layout test
    APP=/path/to/index.html tests/run.sh                     # test another copy

* `layout.js` renders the Daily tabs, Edition, Week, All stories and a folder at nine widths with ugly data
  (no pictures, broken pictures, very long headlines, unbroken words) and fails on sideways overflow, headline
  slivers, empty gaps in rows, and oversized quote blocks. `WIDTHS=412,768 SCEN=noimg` narrows a run.
* `boot.js` / `feat_run.js` run the app's script under stubs (`extract.js` prepares it).
* `st*.js`, `deep*.js`, `native.js`, `spt.js` are feature and regression tests on phone, tablet and fold sizes.
* `mock*.js` fake the network and feeds. Screenshots and scratch files go to `$OUT` (default `/tmp/t`).
* The app version string in `mock*.js` and `deep3.js` must match `APP_VERSION` in `www/index.html`,
  otherwise the "what's new" dialog gets in the way. Bump it when you bump the version.
