# CyPress for Android

The source for the CyPress Android app. You don't need to build anything by hand.
Every time a file in this repository changes, GitHub builds a new signed app
(the "Build CyPress APK" workflow under the Actions tab) and posts it under **Releases**.

- `www/index.html` is the whole CyPress app. Replace it to update the app.
- `whats-new.txt` is the note people see when an update is available.
- `scripts/prepare_android.py` and `native/` add the Android-only pieces.

**Keep this repository public.** Phones download updates straight from its Releases page without signing in, so a private repository would break the in-app Update button.

Nothing private is stored here. The signing key lives in this repository's encrypted Secrets.
