# D. Google Play readiness (audit of main 1.231, code/CI only; no emulator, no Android SDK here)

Method note: the "Play Store readiness" section the brief mentions is NOT in this worktree's FIXES.md (grep for "Play Store"/"Play" finds nothing relevant; only HANDOFF.md:37-38 and TESTING.md:1190 mention Play/AAB). So every item below was verified fresh. External facts were checked by downloading the real packages: @capacitor/cli 7.6.2 and 8.6.0 templates, @capacitor/android 7.6.10 and 8.6.0, sherpa-onnx-2.0.1.aar (SHA matches build-apk.yml:45), ML Kit translate 17.0.3 and language-id 17.0.6 AARs.

## Blockers (cannot be published as is)

### D1 Target SDK is 35; Play needs 36
- Status: NEW · Severity: Store-blocker · Verified: CODE (templates downloaded and read)
- Where: package.json:5-9 (`@capacitor/*` `^7.0.0`, no lockfile so it floats to 7.6.x), capacitor.config.json (no SDK keys), scripts/prepare_android.py (never sets compileSdk/targetSdk; only `minSdkVersion 26` at :561 via the sherpa block). Capacitor 7.6.2's generated `variables.gradle` = minSdk 23, compileSdk 35, targetSdk 35. Capacitor 8.6.0's = minSdk 24, compileSdk 36, targetSdk 36 (AGP 8.13.0, Gradle 8.14.3, androidx.core 1.17.0).
- Now: the APK/AAB declare targetSdk 35. A new app (or update) targeting below 36 is rejected from 31 Aug 2026.
- Should: migrate to Capacitor 8 (cleanest; the workflow already has JDK 21 and Node 22, which Cap 8 needs): bump all three deps to `^8.0.0` (@capacitor/browser 8.0.5 exists), run the quick tests, build. Things the migration touches:
  - `adjustMarginsForEdgeToEdge: "disable"` (capacitor.config.json:8) no longer exists in Cap 8 (removed; replaced by the built-in SystemBars plugin, `insetsHandling` default `css`, SystemBars.java:56,125). Add `"plugins":{"SystemBars":{"insetsHandling":"disable"}}` so Capacitor does not inject its own insets on top of MainActivity's own padding listener (native/extras/MainActivity.java:49-57, which pads `android.R.id.content` with systemBars+cutout+ime and consumes insets). Needs a phone check on Android 15/16, gesture and 3-button nav, keyboard open.
  - prepare_android.py:462 pins `androidx.core:core:1.15.0` only if absent; harmless (Gradle takes the higher 1.17) but delete the pin.
  - prepare_android.py:455-456 regexes expect `versionCode 1` / `versionName "1.0"`; the Cap 8 template still has exactly that (app/build.gradle:10-11), so it works.
  - minSdk: sherpa block forces 26 (prepare_android.py:561) so Android 7.x is already excluded; fine.
  - Manual alternative (not recommended): append `ext.targetSdkVersion=36; compileSdkVersion=36` to android/variables.gradle in prepare_android.py while staying on Cap 7.6; needs AGP/Gradle that supports API 36 and is unsupported by Capacitor 7, so you would carry the risk.
  - Pin versions: add and commit a package-lock.json (workflow build-apk.yml:172-176 uses `npm ci` only if a lockfile exists). Without it every build can silently pick a new Capacitor minor.

### D2 Self-updater and REQUEST_INSTALL_PACKAGES must be removed from the Play build
- Status: NEW · Severity: Store-blocker · Verified: CODE
- Where / exact scope:
  - Manifests: native/AndroidManifest.release.xml:5-6 and native/extras/AndroidManifest.extras.xml:6-7 (`REQUEST_INSTALL_PACKAGES` line plus its comment). The `<provider CyFileProvider>` (release.xml:13-21, extras.xml:27-35) must STAY: `shareFile`/`shareText` use it (CyNativePlugin.java:321). Only drop `<cache-path name="apk" .../>` in native/cy_paths.xml:3.
  - Native: native/CyNativePlugin.java: `apkFile()` :46-51, the `apk` entry of the cleanup loop in `load()` :56, `canInstall` in `info()` :76,:80, `progress()` :89-97 (and fields `received/total/busy`), `allowedHost/allowedUrl/allowedStart` :99-129, `download()` :131-205, `codeOf/signersApi28/signersOf/overlap` :207-240, `problemWithApk()` :242-264, `install()` :266-298; then the now-unused imports (Signature, SigningInfo, Settings, HttpURLConnection, URI, InputStream, OutputStream, Locale). Keep `info()` (used by diagInfo and fontScale), `shareFile`, `shareText`, `setBars`. Also the class doc :31-37.
  - Web: www/index.html `let NU...` through `nativeAppLine` (about :16551-16595: `nUpdBar`, `nShowNotes`, `nativeUpdateCheck` (api.github.com call at :16564), `nativeUpdateNow`, `nativeAppLine`), in `nativeSetup()` the "App updates" section and its `#appv/#appchk/#appnotes` handlers and the snav "App" button (:16797-16806 area, keep `nativeExtras()`, `nativeBars` and the visibilitychange/theme hooks that share the same function), CSS `#upd` (:1276-1277), the `CP_REPO` constant (:5082). Do not touch CyNeural's GitHub voice download (native/neural/CyNeural.java:41; data files, not code).
  - CI: prepare_android.py:515-523 injects `CP_REPO`; build-apk.yml:191-197 FAILS the build when the placeholder is still there, so a Play variant needs the check conditional (e.g. `PLAY=1` skips it). The sideload APK keeps everything as is.
  - Docs/copy: docs/privacy.html:50 ("Updates (Android)... isn't on the Play Store") and the in-app privacy sheet (www/index.html:5023 "GitHub. The Android app checks about once a day...") must describe the Play build correctly (see D4/D5); docs/index.html:248-254 sideload instructions stay for the website APK.
- Should: build the Play bundle from a stripped variant (a `PLAY=1` switch in prepare_android.py that deletes the above and writes a Play manifest without the permission). Simply leaving the code and removing the permission is not enough: Play's "Device and Network Abuse" policy forbids an app that updates itself by any method other than Play, and a code path that downloads and fires `application/vnd.android.package-archive` will be flagged. Having the permission at all requires a Play Console declaration (core-function justification) that this app cannot meet.
- Note the web code gates all of this on `CyN()` and `CP_REPO`, so with the constant left empty the UI shows "Updates aren't set up in this build" (:16560) if you only blank it; remove the section instead.

### D3 The AAB step is optional, silent on failure, and builds the sideload variant
- Status: NEW (KNOWN: HANDOFF.md:38 task 1 "confirm AAB artifact appears") · Severity: Store-blocker · Verified: CODE (not run)
- Where: .github/workflows/build-apk.yml:265-287.
- Now: `continue-on-error: true` (:268); if `bundleRelease` or `jarsigner` fails the job stays green, `AAB_OK` is never set (:279), and the upload step (:281-286) is skipped without any message, so nobody finds out. The AAB is built from the same prepared tree as the sideload APK: targetSdk 35, REQUEST_INSTALL_PACKAGES, updater code, `CP_REPO` set. No check on the result: `$AAB` may be empty (`find | head -1`), no `jarsigner -verify`, no `bundletool validate`, no versionCode check as the APK step has (:258-262). It also runs AFTER the APK `rm -f` of the keystore (:263) and re-creates it: fine.
- Should (exact changes): (1) for the Play bundle remove `continue-on-error`; add `test -s cypress.aab` and `jarsigner -verify -certs cypress.aab`, fail with `::error::` if either is missing; make the upload step unconditional on that path. Keep the sideload APK publish independent only if you want APKs even when Play packaging breaks, but then emit `::error`/`GITHUB_STEP_SUMMARY` loudly instead of a silent skip. (2) Build it from the PLAY variant (D2) with targetSdk 36 (D1). Because prepare_android.py edits `www/index.html` and android/ in place (:515-523), do the Play build in a second job or `git checkout www` and re-run the prepare script with `PLAY=1` after the APK is signed. (3) Sign with explicit `-sigalg SHA256withRSA -digestalg SHA-256` for a predictable result. (4) Add `bundletool validate --bundle=cypress.aab` (download bundletool jar in the step) and check `aapt2 dump badging`-equivalent version: `versionCode` == `$BUILD_NUMBER`. (5) Upload the AAB to Play manually or with a Play API step (needs a service account, not present). (6) The workflow still runs a "Publish the release" that deletes and recreates the GitHub release each run (:323); unrelated to Play but means the AAB artifact (30-day retention, :287) is the only copy.
- versionCode: `BUILD_NUMBER = github.run_number` (build-apk.yml:39, prepare_android.py:24,455) is monotonic and far below Play's 2,100,000,000 cap, so it is valid for Play. Risk: the number is tied to this repository's run counter; moving the repo or re-creating the workflow resets it and Play would then reject every upload (version codes can never go down). The release-number guard at :67-89 checks GitHub release tags only, not Play. Record the first Play versionCode in HANDOFF.md. APK and AAB from one run share the same code, which is fine.

### D4 Live privacy page states the app is not on the Play Store, and describes GitHub updates
- Status: NEW · Severity: Store-blocker · Verified: CONFIRMED (live curl of https://cypressreader.com/privacy.html, same text in docs/privacy.html:50)
- Where: privacy.html "Updates (Android)" paragraph: "About once a day the Android app asks GitHub for the newest release. If you accept an update, the app downloads it from GitHub and asks Android to install it. CyPress Reader isn't on the Play Store, so this is how updates reach you." Also docs/index.html:248-249 ("it is not from the Play Store").
- Should: reviewers compare the policy with the Play build. For the Play build the app does neither, so the paragraph must say updates come through Google Play and (for the sideload APK) the GitHub check applies. Reword and keep "Last updated" current (page says October 29, 2026).

### D5 In-app privacy sheet disagrees with what the app does
- Status: NEW · Severity: Store-blocker (a false statement in a privacy disclosure shown to users) · Verified: CODE
- Where: www/index.html:5023 (`<dialog id="prv">`).
  - "Nothing else: No accounts. No tracking. No ads. No analytics." sits one screen below a bullet that describes the opt-in weekly usage counts (`/api/stats`, :12700). Say "No analytics unless you turn on anonymous usage counts" or equivalent; privacy.html is careful here, this sheet is not.
  - "Google's icon and font services. Site icons and some theme fonts. They see the site's name or your internet address": there is NO Google icon/favicon service call left in the code (grep: `s2/favicons` appears only in an exclusion regex at :5886; no `gstatic` fetch; fonts.googleapis.com only at :9926 for optional reading fonts; `cdn.jsdelivr.net` for the OpenDyslexic font at :9923 is NOT named in this sheet though privacy.html names it). Reword to "Google Fonts (only if you pick an extra font) and jsDelivr (dyslexia font)".
  - Missing from the sheet but on the web page and live in the app: Google Translate fallback (`translate.google.com`, :12145) and the Google translation language-pack download (ML Kit `com.google.mlkit:translate 17.0.3`, scripts/prepare_android.py:46); rss2json (api.rss2json.com); YouTube thumbnails/player (i.ytimg.com, youtube-nocookie.com); the short-link service for Share (cypressreader.com `/api/short`, :15502). Add one line each or "Read the full privacy page" must be prominent.
  - "GitHub. The Android app checks about once a day for a new version": remove for the Play build (D2).

### D6 No developer name or contact email anywhere
- Status: NEW · Severity: Store-blocker (Play Console requires a public support email; policy must identify the developer) · Verified: CONFIRMED
- Where: live privacy page ends "Ask on the CyPress Reader support page" linking https://github.com/cypressreader/cypress-android/issues (docs/privacy.html:75, docs/index.html:298). No `mailto:`, no legal name, no postal/entity info in docs/ (grep for mailto/@ returns nothing). The Report-a-problem server stores messages "read only by the developer" (privacy page) but gives no way to reach a person.
- Should: add a monitored email (can be a forwarding alias on the domain) and the developer/organisation name to privacy.html, the footer of docs/index.html and the Play listing. GitHub Issues requires a GitHub account and is public, so it is not an acceptable sole support channel for a general audience. Note: personal Play accounts created after Nov 2023 also need a closed test with 12+ testers for 14 days (HANDOFF.md:38) and the developer's real name/address get shown on the listing unless an organisation account is used.

## Must-fix before submission

### D7 Auto Backup is on: app data can leave the phone, contradicting "all data stays on your device"
- Status: NEW · Severity: Must-fix · Verified: CODE (template downloaded)
- Where: the Capacitor template manifest has `android:allowBackup="true"` (templates 7.6.2 and 8.6.0 both); neither native/AndroidManifest.release.xml nor extras.xml nor prepare_android.py overrides it (grep for allowBackup in repo: none). The web app's whole state (feeds, saved stories, notes, history, sync code, the user's own relay address) lives in WebView localStorage/IndexedDB under the app data directory, which Auto Backup uploads to the user's Google Drive on Android 6-11 and via device-to-device transfer/cloud backup on 12+.
- Should: either set `android:allowBackup="false"` (add to the `<application>` tag in both manifests; also `tools:replace` if the merger complains) or add `dataExtractionRules`/`fullBackupContent` that exclude `webview`/`databases`/`shared_prefs` for cloud backup, OR keep it and say so honestly in privacy.html and the Data safety form. Because the sync code is inside that data, excluding it is the safer choice. NEEDS-PHONE to confirm restore behaviour either way.

### D8 Signing: Play App Signing, upload key, and the deep-link fingerprint
- Status: NEW · Severity: Must-fix · Verified: CODE
- Where: build-apk.yml:57-65,230-263 (secrets `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, alias `cypress`, one keystore for both APK and AAB); docs/.well-known/assetlinks.json (single SHA-256 `D1:AF:03:...2A:8D`); prepare_android.py:109-121 (autoVerify filter for cypressreader.com/s/).
- Should / decisions: Play requires enrolling in Play App Signing. Choose one: (a) at first upload use "export and upload the existing key" (PEPK tool) so Google signs with the SAME key the sideload APK uses: sideload users and Play users have identical certificates, assetlinks needs no change, and a user can move between channels; but it uploads the private key to Google. (b) let Google generate the app signing key and keep the current keystore only as the upload key: Play installs then carry a different certificate than the sideload APK (an APK installed over a Play install, or the reverse, fails with INSTALL_FAILED_UPDATE_INCOMPATIBLE), and assetlinks.json must list BOTH SHA-256 fingerprints (the Play one is shown under Play Console > Release > Setup > App signing) or share links `https://cypressreader.com/s/...` will stop opening in the Play build. Either way, record the decision in HANDOFF.md and add the Play fingerprint to assetlinks.json. The jarsigner AAB step (build-apk.yml:277) is correct as an upload-key signing method (alias `cypress`); back up the keystore (losing it with option (b) can be recovered through Play upload-key reset; with option (a) never lose it).
- Also: the signing check at :57-65 hard-fails builds when secrets are missing; fine.

### D9 Foreground service and permission declarations (Play Console)
- Status: NEW · Severity: Must-fix · Verified: CODE; behaviour NEEDS-PHONE
- Where / table (merged manifest also gets INTERNET from the Capacitor template and ACCESS_NETWORK_STATE/WAKE_LOCK/RECEIVE_BOOT_COMPLETED from WorkManager 2.9.1, prepare_android.py:44):
  | Permission | Used for | Verdict |
  |---|---|---|
  | INTERNET | feeds, stories | needed |
  | ACCESS_NETWORK_STATE | `ConnectivityManager` in CyExtrasPlugin.java:246, CyNeural.java:7 | needed (comes via WorkManager; declare explicitly if you want it visible) |
  | POST_NOTIFICATIONS | new-story alerts, morning pack, player notification; runtime request via `notifPermission` (CyExtrasPlugin.java:133-139) | needed; asked on first use of the feature, not at launch |
  | FOREGROUND_SERVICE + FOREGROUND_SERVICE_MEDIA_PLAYBACK | read-aloud / Daily audio with lock-screen controls, `CyMediaService` declared `foregroundServiceType="mediaPlayback"` (extras.xml:37-40; startForeground with type MEDIA_PLAYBACK at CyMediaService.java:209-210, :579-580) | needed; Play Console requires a foreground-service declaration with a short video showing the feature. Service is started only from a foreground user action (CyExtrasPlugin.java:168 -> `CyMediaService.start`, wrapped in try/catch at :130), never from the boot receiver or a background worker, which is the Android 14-16 restriction that matters. |
  | RECEIVE_BOOT_COMPLETED | CyBootReceiver re-schedules WorkManager alerts/pack/widget | needed (receiver only enqueues work, no FGS start) |
  | VIBRATE | haptics, user can turn off | normal permission, fine |
  | REQUEST_INSTALL_PACKAGES | self-updater | REMOVE (D2) |
  No location, contacts, storage, camera, microphone, phone, SMS or exact-alarm permission. `AlarmManager` in CyWidgets.java:174-176 only CANCELS a legacy alarm. Nothing unused except the updater permission.
- Should: complete Data safety (see D17), the foreground-service declaration, and notification-permission explanations. `queries` TTS_SERVICE (extras.xml:20-24) is fine (package visibility).

### D10 Release-hygiene checks: debug code, test hooks, placeholders
- Status: NEW · Severity: Nice-to-have (clean) · Verified: CODE (grep)
- Findings: `console.log/debug/info` count in www/index.html = 0. No `debugger`, no debug query switches. `window.__*` hooks (`__CYBOOT`, `__nvOffer`, `__ttsSleep`) are app plumbing, not test hooks. `VOICES_TEST` is read only in prepare_android.py:562-568 and set only in .github/workflows/spike-tts.yml:26 (a separate test app `com.cypress.reader.tts`); build-apk.yml never sets it, so release is `com.cypress.reader` with no suffix. Native: only two `Log.i` in native/neural/CyNeural.java:342,392 (timings, no personal data); `Log.w` elsewhere. Nothing `android:debuggable` or `testOnly`. No lorem/TODO in user-visible text. The release build has no minify/shrink (template `minifyEnabled false`), so Play will warn "no deobfuscation file/native debug symbols"; harmless, but you may enable R8 later. Cosmetic: prepare_android.py:4b comment says "dark navy" but writes `#123524` (green) for the Android 12 splash; capacitor.config.json backgroundColor is `#0E1220` (navy). Pick one so cold start does not flash two colors (NEEDS-PHONE).
- Identity checks: applicationId `com.cypress.reader` (capacitor.config.json:2; package dir prepare_android.py:23); launcher label `CyPress` (capacitor.config.json `appName`) while product name elsewhere is "CyPress Reader": Play title can be "CyPress Reader" but the label under the icon stays "CyPress" (short, fine). versionName = `APP_LABEL` 1.231 (build-apk.yml:41 and www/index.html:13797 agree, prepare_android.py:456 writes it; workflow warns on mismatch :260). Adaptive icon with monochrome layer present (icons/tree/mipmap-anydpi-v26/ic_launcher.xml:4-5). Widget receivers carry hard-coded English labels (extras.xml:53,64,75), fine.

## Should-fix

### D11 Cleartext policy
- Status: NEW · Severity: Should-fix · Verified: CODE
- Where: extras.xml:26 (`usesCleartextTraffic="true"` + `networkSecurityConfig=@xml/cy_network`); native/extras/res/xml/cy_network.xml: base-config allows cleartext, but cypressreader.com, github.com, githubusercontent.com, github.io are forced HTTPS. capacitor.config.json:5 `allowMixedContent: true`. native/AndroidManifest.release.xml:12 (the core-only fallback) has `usesCleartextTraffic="true"` and NO network security config, so in a degraded/EXTRAS=0 build our own hosts are not protected. Not a Play rejection by itself (Play only warns in the pre-launch report); justification for CLAUDE.md §7 "allow cleartext HTTP from publishers" is sound.
- Should: keep for feeds, but (1) add the same `networkSecurityConfig` to the core manifest or never ship the core build to Play; (2) after removing the updater, `github.com`/`githubusercontent.com` stay only for the Natural voice download (https, CyNeural.java:41), keep them; (3) consider setting `allowMixedContent:false` since the WebView page is https://localhost-style and loads publisher images; test before changing (images from http publishers would stop). Put a one-sentence "why" in the Play review notes.

### D12 16 KB page-size compatibility
- Status: NEW · Severity: Should-fix (verify on the real bundle) · Verified: CONFIRMED for libraries; the packaged AAB itself is unchecked
- Evidence: I downloaded sherpa-onnx-2.0.1.aar (sha matches build-apk.yml:45) and read the ELF program headers: arm64-v8a `libonnxruntime.so`, `libsherpa-onnx-jni.so`, `libsherpa-onnx-c-api.so`, `libsherpa-onnx-cxx-api.so` all have LOAD segments `p_align = 0x4000` (16 KB). ML Kit `libtranslate_jni.so` (translate 17.0.3) and `liblanguage_id_l2c_jni.so` (language-id 17.0.6) arm64 libs are also 0x4000. The app ships arm64-v8a only (prepare_android.py:561 `abiFilters 'arm64-v8a'`), so no 32-bit/x86 libs matter. Google requires 16 KB support for apps targeting Android 15+ on Play from 1 Nov 2025, i.e. already in force.
- Remaining checks (cannot run here, no SDK): on the built AAB/APK run `zipalign -c -P 16 -v 4 cypress.apk` (the workflow aligns with `-p 4`, build-apk.yml:240, which is only 4 KB page alignment of the APK; for the Play AAB bundletool does the alignment when `useLegacyPackaging` is false, the AGP default for minSdk >= 23); `llvm-readelf -lW` on each extracted `.so`; Android Studio APK Analyzer shows "16 KB alignment" warnings; and test on an Android 15+ emulator image with 16 KB pages. Change the APK `zipalign` to `-P 16` for the sideload build as well.
- arm64-only note: Play's device catalog hides the app from x86/32-bit-only devices and Chromebooks/emulators; intended, mention in listing notes.

### D13 Android 16 (API 36) behaviour changes likely to bite
- Status: NEW · Severity: Should-fix · Verified: CODE; all NEEDS-PHONE
- Edge-to-edge: already enforced since targetSdk 35; the app handles it natively (MainActivity.java:49-57 pads content, so web safe-area is not needed). At 36 the `windowOptOutEdgeToEdgeEnforcement` escape hatch is gone; with Cap 8 add the `SystemBars.insetsHandling: disable` config (D1) and test status/nav bar colors (`setBars`, CyNativePlugin.java:371), display cut-out, keyboard (ime inset), landscape and Fold inner screen.
- Predictive back: `enableOnBackInvokedCallback="true"` is already set (release.xml:12, extras.xml:26) and an `OnBackPressedCallback` handles back (MainActivity.java:161-200). At target 36 predictive back cannot be disabled and `onBackPressed`/KEYCODE_BACK are no longer called. The callback is always enabled and asks the page asynchronously (`cyBack()` JS round-trip, 1.5 s watchdog, :201-232) before deciding; the system cannot play the back-to-home preview when the callback is enabled, and a page that answers late will make exit feel laggy. Check: back from reader, from a dialog, from the root (should leave the app), gesture-swipe preview, 3-button nav.
- Foreground service rules (Android 14-16): fine, see D9 (only started from foreground, correct type, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` declared, no `onTimeout` needed for mediaPlayback).
- Large screens / orientation: no `screenOrientation` or `resizeableActivity=false` anywhere in prepare_android.py/manifests (grep), so Android 16's "ignore orientation/resizability restrictions on >=600dp" does not hurt; Fold inner screen already designed.
- Background work: Android 16 tightens JobScheduler/WorkManager runtime quotas; alerts/morning pack/widget refresh (CyBgWorker via WorkManager, CyExtras.java:550-569) may run less often; add to TESTING.md as device-verify.
- Other: Android 16 intent-redirection hardening only affects Intents built from extras; the SEND/VIEW filters (prepare_android.py:100-135) parse data, not nested intents. `exported="true"` receivers: see D14.

### D14 Exported broadcast receiver without need
- Status: NEW · Severity: Should-fix · Verified: CODE
- Where: native/extras/AndroidManifest.extras.xml:43-44 `CyBootReceiver` `android:exported="true"` with BOOT_COMPLETED and MY_PACKAGE_REPLACED. Both are system broadcasts delivered to non-exported receivers, so `exported="false"` is correct and removes an externally triggerable entry point (the handler does check the action, CyBootReceiver.java:13, so low risk). The three widget providers must stay exported (launcher binds them). Play's pre-launch report flags exported components lacking permission.

### D15 "Report a problem" sends more than the page says
- Status: NEW · Severity: Should-fix (privacy copy) · Verified: CODE
- Where: `diagInfo()` www/index.html:12679-12685 includes `host(f.url)` for up to 8 failing feeds (the host names of sites the user follows) plus the user-agent, screen size and feed counts; the sentence on privacy.html says "the details shown in the box (app version, screen size, browser details, theme, number of sites and recent error messages)". The box does show everything before Send (good), but the policy list omits "names of sites that failed to load", while the same page promises usage counts never contain "your sites". Add the words or drop the hostnames from `diagInfo`. Usage-counts payload (`usePack`, :12694) matches the policy (buckets, no site names) - OK.

### D16 Content/policy risk to decide before listing
- Status: NEW · Severity: Should-fix (judgement call) · Verified: CODE (policy reading)
- Where: full-text helpers Jina (r.jina.ai) and Morss.it plus Google News "same story elsewhere" (disclosed on privacy.html) re-host publishers' article text in-app; the app also strips ads/promos (ADDOM/ADPATH :5482). Play's Intellectual Property and Deceptive Behavior policies and the Play "news app" declaration (Console > App content > News apps) apply. Mitigations already present: no paywall circumvention claim, publisher attribution. Consider limiting Jina/Morss to the sideload build or confirming the text is shown with a link back, and fill the News app declaration.

### D17 Data safety form answers (to prepare)
- Status: NEW · Severity: Should-fix · Verified: CODE
- Declare: App info and performance -> Diagnostics/crash logs (opt-in "Report a problem", error messages) and "other app performance data" (opt-in weekly counts), not linked to identity, optional, processed by developer (Cloudflare Worker, `/api/stats`, `/api/report`, docs/worker/share-worker.js, retention ~13 months); Web browsing history is NOT collected by us, but search words go to Feedly/Google News/Bing (Near you text, "Finding new feeds") - those are user-initiated third-party transfers, list as shared if the form asks; Share short links (story URL stored by our worker); Google ML Kit (translation packs, SDK telemetry the policy already mentions); optional user sync to the user's own Cloudflare Worker (encrypted). Data is encrypted in transit. Deletion: usage counts carry no ID so nothing to delete; state that. Answer the backup question consistently with D7.

### D18 Host-by-host privacy comparison (everything the code can contact, besides the publishers' own sites)
| Host | Code | Disclosed on live privacy.html | In-app sheet |
|---|---|---|---|
| cypressreader.com `/feed` (fetcher), `/api/short`, `/api/stats`, `/api/report` | :5317, :15502, :12692,:12700 | yes (relay, share, counts, report) | counts/report yes, short link no |
| api.allorigins.win, api.codetabs.com, corsproxy.io | :5343-5348, only `if(!NATIVE)` | yes, "web version" | yes (generic "relay") |
| api.rss2json.com | grep x2 | yes | no |
| r.jina.ai, morss.it | grep | yes | yes |
| news.google.com, www.bing.com | Near you / full-story search | yes | yes |
| cloud.feedly.com | add-feed search | yes | yes |
| translate.google.com | :12145 | yes | no |
| Google ML Kit language packs | prepare_android.py:46 | yes | no |
| i.ytimg.com, www.youtube-nocookie.com, www.youtube.com | video | yes | no |
| fonts.googleapis.com (:9926), cdn.jsdelivr.net (:9923) | optional fonts | yes | partly (see D5) |
| api.github.com (:16564), github.com release download, github.com/cypressreader/... voice files (CyNeural.java:41) | updater, voice | yes | yes |
| www.google.com | no fetch found (only a favicon exclusion regex) | n/a | claims "Google's icon services" (false) |
| web.archive.org | in tests/privacy_hosts.js list but not used by the app | n/a | n/a |
- Relays are web-only (confirmed: public relays are added only when `!NATIVE`, comment at :5338 "public relays are for the web version only: the Android app goes straight to the site"). The Android app never contacts allorigins/codetabs/corsproxy.
- Not disclosed anywhere: nothing else found; the real mismatches are D4, D5, D6, D15 and the missing Auto Backup statement (D7).
- tests/privacy_hosts.js (run in CI, build-apk.yml:101) only checks that a keyword appears anywhere on docs/privacy.html; it does not check the in-app sheet, and it would pass the false "isn't on the Play Store" text. Extend it to check the in-app sheet's host list.

### D19 Store listing assets and process (non-code)
- Status: NEW · Severity: Nice-to-have · Verified: n/a
- Needed: 512x512 icon (source icons/tree/ is up to 192 px launcher PNGs plus vector; export a 512 from brand/), 1024x500 feature graphic, 2-8 phone screenshots (docs/shots has phone-daily.jpg, etc.), short/long description in US English with no "free" claim per CLAUDE.md §7, content rating questionnaire, target audience (not child-directed), News app declaration, Ads = none, closed test per D6. Add the Play badge/link to docs/index.html only after approval.

## Summary counts
Store-blockers: 6 (D1-D6). Must-fix: 3 (D7-D9). Should-fix: 7 (D11-D17). Nice-to-have/clean: D10, D19.
