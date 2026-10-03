# CyPress for Android

The source for the CyPress Android app. You don't need to build anything by hand.
Every time a file in this repository changes, GitHub builds a new signed app
(the "Build CyPress APK" workflow under the Actions tab) and posts it under **Releases**.

- `www/index.html` is the whole CyPress app. Replace it to update the app.
- `whats-new.txt` is the note people see when an update is available.
- `scripts/prepare_android.py` and `native/` add the Android-only pieces.

**Keep this repository public.** Phones download updates straight from its Releases page without signing in, so a private repository would break the in-app Update button.

Nothing private is stored here. The signing key lives in this repository's encrypted Secrets.

## How builds and releases work

- Each push to `main` (except changes to `README.md` or `docs/`) runs one build. Builds are queued one at a time, so two quick pushes never publish out of order.
- Before anything is built, the workflow checks that the script inside `www/index.html` parses, and that the new build number is not lower than the newest release. A failure stops the run with a message and nothing is published.
- If the full build fails, it is tried once more. If it fails again the run fails and **nothing is published**: phones keep the version they have.
- Emergency option: run the workflow by hand (Actions, then "Build CyPress APK", then "Run workflow") and tick **allow_degraded**. That builds the core app without the optional extras (notifications, background audio, widget, icon switch) and publishes it as a **pre-release** with a notice at the top of its notes. Phones are never offered a pre-release as an update.
- The build number (and Android version code) is the workflow run number. It must only ever go up, because phones install an update only when its number is higher. Do not delete the newest release and do not reset the repository's run counter.

### Dependency versions

`package.json` allows any 7.x release of the Capacitor packages. For fully repeatable builds, run `npm install` once on a computer with network access and commit the `package-lock.json` it creates; the workflow then uses `npm ci` automatically. To freeze the versions, also replace the `^7.x.y` ranges in `package.json` with the exact versions from that lock file.
