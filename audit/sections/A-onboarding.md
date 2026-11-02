# Section A: Onboarding and first run (production 1.231, web stamp 2026.11.02f)

Method: fresh Playwright contexts on https://cypressreader.com/<family-path>/?invite=<family-password>, phone 390x844 and fold 884x1000, day and night. Code read in www/index.html (obOpen ~13697, obRender, obClick, obFinish, whatsNew 16148, swEnd 13222) and native/.

## Walkthrough (what a new user sees)
1. Welcome slide (dot 1 of 5): logo, "CyPress", three made-up "Examples" cards, "Your own magazine, built from the sites you love, with every story open in full to page through." Buttons: Skip for now / Get started.
2. "Choose your first edition" (2/5): four ready-made editions (World briefing, Tech morning, Curious mind, Culture vulture) plus "Or build your own" with 33 topic chips, then (below the fold) a sample front page and "Start reading". Next stays disabled until an edition/topic is picked.
3. "Choose your sources" (3/5): per-topic site lists, search box, "Add the first 3".
4. "Make it yours" (4/5): 7 themes, 7 reading fonts, Light or dark.
5. "Your magazine is ready" (5/5): "N sites. A few tips:" five bullets. Button "Open my front page".
6. The Daily, with a "Welcome to CyPress" toast. No What's New dialog on first run (correct: FIRST skips whatsNew).
No runtime permission prompt appears anywhere in first run.

## Tap counts to the first opened story (measured)
| Variant | Path | Taps |
|---|---|---|
| Skip | Skip for now, tap lead story | 2 |
| Returning user (reload) | straight to The Daily, tap lead story | 1 |
| Quick (one topic) | Get started, 1 topic, scroll, Start reading, story | 4 taps + 1 scroll |
| Edition | Get started, edition, Next, Next, Open my front page, story | 6 |
| Build own (3 topics) | Get started, 3 topics, Next, Next, Next, Open, story | 9 |
Skip result: 6 sites (3 Tech + 3 News), toast "We started you with 6 popular sites" with a "Change them" button for about 6 s.

## Timing (cold context, shared IP, so noisy)
- Onboarding dialog visible after load: 1.2 to 2.9 s.
- Final tap to first story visible: Skip 4.4 to 4.8 s (phone), edition path 8.9 s (phone), 12.3 to 15.9 s (fold runs, contention from other reviewers).
- Open to first story total (Skip): 7.3 s and 11.0 s.
- Returning user reload to first story: 1.2 s.
Screens while waiting show a "Setting the type..." skeleton.

## Variant: denied permission (NEEDS-PHONE, from code)
Manifest (native/extras/AndroidManifest.extras.xml): REQUEST_INSTALL_PACKAGES, VIBRATE, POST_NOTIFICATIONS, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK, RECEIVE_BOOT_COMPLETED. No location. Only POST_NOTIFICATIONS is a runtime prompt (Android 13+; CyExtrasPlugin.notifPermission, line ~129). It is never asked during onboarding. It is requested (www/index.html 16622 notifOk) when: the user turns on Alerts or the Morning pack in Settings (16758), taps "Send a test" (16755), or the first time Listen (read aloud) starts (16773 mediaPerm, once). If denied: a toast says "Allow notifications for CyPress in Android settings to ..." and the feature silently stays off; Listen still plays but without lock-screen controls. Nothing blocks reading.

## Findings
### A1 Android Back on the welcome slide silently skips onboarding for good
- Status: NEW · Severity: Must-fix · Verified: CONFIRMED (web, via window.cyBack, the same call MainActivity makes) + NEEDS-PHONE for the real Back press
- Where: first run, onboarding dialog; www/index.html:16495 popstate handler closes any dialog layer (`d.close()`), obOpen:13696 only blocks the `cancel` event (Esc), not close-by-back. Also 5144 `if(!FIRST&&!S.onboarded)S.onboarded=1`.
- Now: Back on any onboarding slide closes the dialog. User lands on The Daily with 4 sites they never chose (feeds=4), `onboarded` unset; on the next launch it is set to 1 so onboarding never returns. A beginner pressing Back on the very first screen (a normal reflex) loses the whole setup.
- Should: Back on step 1 should do nothing or exit the app; Back on later steps should go to the previous step (data-obback).
- Shots: shots/A/A6-back-on-welcome-phone-day.png, shots/A/A6-after-reload-phone-day.png

### A2 "Pick three topics" is wrong: one topic is enough
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: Topics step; obRender step 1 copy, www/index.html:13713; Next/Start reading are enabled with 1 topic (13726).
- Now: "Pick three topics you like · 0 of 3" but one tap enables Next. The counter reads "1 of 3" with Next already active, so it feels like a rule that is not enforced.
- Should: "Pick a few topics you like" (drop the 0 of 3 counter), or really require three.
- Shots: shots/A/A1-step1-phone-day.png, shots/A/A2-fold-night-ob1.png

### A3 Disabled Next gives no visible reason; the quick "Start reading" is hidden below the fold
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: step 1, www/index.html:13726 (hint "Pick an edition or a topic first" sits at the bottom of a scrolling body) and 13713 (Start reading placed after 33 chips and a sample).
- Now: On a 390x844 phone the first screen shows four editions, the chips start, and a greyed Next. The explanation and the one-tap "Start reading" are 2 to 3 screens down. A beginner sees a dead (greyed) button.
- Should: Put the hint next to the greyed Next, or keep a sticky "Start reading" in the footer; shorten the topic list.
- Shots: shots/A/A1-step1-phone-day.png

### A4 Five onboarding steps and a 33-chip topic list before the first story
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: obRender steps 1 to 4. Theme + font + Light/dark step (4) shows 7 themes and 7 fonts to someone who has not seen a story yet.
- Now: Edition path needs 6 taps and the user chooses theme and font blind. The only fast route is "Skip for now", which does not say it picks sites for you until afterwards.
- Should: Move Look (step 4) to Settings or after the first story; make Skip's label say what it does ("Start with popular sites").
- Shots: shots/A/A2-night-phone-ob3.png

### A5 "Skip for now" picks sites without asking, then explains
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: obQuick(['Tech','News'],true), www/index.html:13696 area.
- Now: Skip adds 6 sites (Tech + News), then a 6-second toast "We started you with 6 popular sites / Change them". Honest but easy to miss; the label "Skip for now" implies nothing is chosen. Welcome toast also stacks behind it.
- Should: Rename button, or keep the toast until dismissed.
- Shots: shots/A/A2-skip-phone-day-front.png, shots/A/A2-skip-phone-night-front.png

### A6 In-app Tips list says the opposite swipe directions (see E3)
- Status: KNOWN-RECHECK (still present) · Severity: Must-fix · Verified: CODE
- Where: www/index.html:12812 TIPLIST. Full detail in E3.

### A7 What's New matches the build (1.231); first run correctly skips it
- Status: NEW (informational) · Severity: Nice-to-have · Verified: CONFIRMED
- Where: CHANGES at 13798 equals the 1.231 section at the end of whats-new.txt (Report a problem; Share anonymous usage counts). Forced S.ver to an old value and reloaded: dialog "What's New / CyPress 1.231" with two bullets and "Got it" appears about 2 s after the front page.
- Now: Text is accurate. But the two bullets are about reporting and telemetry, wording like "send it straight to the developer" and "usage counts" is the first thing a returning user sees after an update; fine. Uses straight quotes inside text ("What the counts contain") while the app elsewhere uses curly quotes; trivial.
- Should: No change needed.
- Shots: shots/A/A4-whatsnew-phone-day.png

### A8 Jargon and wording a beginner will meet
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED (words on screen) / CODE
- Where: "edition" (step 1 title, explained in one sentence: ok), "My Feeds" (sidebar, www/index.html drawer), "Feeds and backup" (Settings), "Smart order" / "Smart: best first" (Settings, All stories sort), "sources" vs "sites" used for the same thing on step 3 vs step 5 ("Choose your sources" then "6 sites"), "Tap the logo to switch it" (tip 4, unclear what it switches; the Tips list says "between the tree and the circuit board"), "Free to read" in site blurbs (BBC/Guardian rows) conflicts with the no-"free" copy rule.
- RSS: no user-visible "RSS" found (only in code comments and Bing URLs). "rail": only in CSS class names.
- Should: One word (sites) everywhere; replace "feed" with "site" in My Feeds / Feeds and backup; rename "Smart" to "Best first"; drop "Free to read".
- Shots: shots/A/A5-drawer-phone-day.png, shots/A/A5-settings-phone-day.png

### A9 Daily cover on first open has no photo two days out of three
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: coverTreat(), www/index.html:17527 rotates photo/type/min by day number.
- Now: On the review day a first-time user sees a text-only cover (CYPRESS, big outlined "306", headline in the middle). In the first day-mode capture the lead headline was rendered much smaller (about 14 px) than in the night capture of the same cover (about 22 px); likely the headline-reveal animation or long-title fit was mid-way, not confirmed.
- Should: Show the photo cover on first open when the lead has a photo.
- Shots: shots/A/A1-first-front-phone-day.png, shots/A/A2-skip-phone-night-front.png

### A10 In-app self-update permission is a Play Store policy problem
- Status: NEW · Severity: Store-blocker · Verified: CODE (policy judgement; NEEDS-PHONE to see the prompt)
- Where: native/AndroidManifest.release.xml:6 and native/extras/AndroidManifest.extras.xml:7 (REQUEST_INSTALL_PACKAGES); www/index.html nativeUpdateCheck/nativeSetup 16796 to 16806 (checks GitHub 5 s after launch); FOREGROUND_SERVICE_MEDIA_PLAYBACK and RECEIVE_BOOT_COMPLETED also need Play declarations.
- Now: The app can install its own updates outside Google Play. Play does not allow apps distributed there to self-update or hold REQUEST_INSTALL_PACKAGES except as a package installer.
- Should: Play build variant without REQUEST_INSTALL_PACKAGES and without the update bar; declare foreground service and boot use.
- Shots: none

### A11 Swipe directions in onboarding match the app (E3 sub-check)
- Status: KNOWN-RECHECK (fixed in onboarding, still wrong in Tips list) · Severity: n/a · Verified: CONFIRMED
- Where: obtips line 13725: "Swipe a story right to mark it read, left to save it."
- Now: Real touch swipes (CDP touch events): right swipe on a card gave read=true, "Marked as read"; left swipe gave saved=true. Matches the onboarding tip and the TIPQ toast.
- Should: nothing.
- Shots: shots/A/A3-swipe-right-result.png

### A12 Other observations
- Fold width (884 px): onboarding is a centered 620 px modal over the app with the drawer visible behind; no layout break, large empty space on the welcome slide. Night looks correct (dark green, gold buttons). shots/A/A2-fold-day-ob0.png, A2-fold-night-ob1.png.
- Sample "Examples" cards on the welcome slide are not tappable (fine), labeled Examples.
- "Sunday" tab is present on a Monday (The Daily tabs Today / Headlines / Brief / Sunday); a beginner may wonder. Nice-to-have.
- First-run back arrow: step Back button exists on steps 2 to 5 and works.
