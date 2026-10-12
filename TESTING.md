# Real-device testing checklist

Things that could not be reproduced in a desktop browser and need a check on a real phone. Tick them off after trying them on the Android app (and, where noted, the web app in a phone browser).

## Open items

- [ ] **Nav badge stuck after "I have 5 minutes".**
  1. Open The Daily and tap "I have 5 minutes", then read or skip through the short list.
  2. Go back to the main lists.
  3. Check that the badge on the nav (the unread count) shows the real unread count, not the number from before.
  - Expected: the badge matches the number of unread stories.
  - Where: Android app and the web app on a phone.

- [ ] **"Why am I seeing this?" popover clipped near the screen edge.**
  1. On a story card near the right edge (and near the bottom), tap the small "i".
  2. Check the whole explanation is visible, with nothing cut off by the screen edge or the bottom bar.
  3. Try it on a card in the first column and the last column, in portrait and landscape.
  - Expected: the popover stays fully inside the screen.
  - Where: Android app and the web app on a phone.

## Must verify on a device before the next release

- [ ] **"Read it now" from a cold start.** Fully close CyPress (swipe it away from recent apps), then in another app (Chrome, for example) use Share, then CyPress.
  1. The "Shared with CyPress" box should appear on top, with Read it now, Add as a feed, Save the link for later and Cancel.
  2. Tap Read it now. The story should open in the reader.
  3. Repeat right after installing an update (so the What's New box is also waiting) and on a brand-new install (so set-up is waiting). The share box should appear once those are closed, never hidden underneath.
  - What is already checked: the app-side path was simulated in a desktop browser with a pretend pending share, and a bug where What's New or set-up covered the share box was found and fixed. What is not checked: Android handing the shared text to the app when it starts from cold. That needs a real phone.

- [ ] **The Daily downloads its edition ahead of time (Wi-Fi only).** Open The Daily on Wi-Fi with "Get stories ready in advance" set to anything but Off.
  1. Within a few seconds stories start getting a small check mark, one at a time with a pause between, and Quick Briefs and Deep Dives fill in as real reading times arrive (the page only redraws when you are at the top and not touching the screen).
  2. **Off switch:** set "Get stories ready in advance" to Off, then open The Daily. Nothing should download.
  3. **Wi-Fi only:** switch to mobile data (turn Wi-Fi off) before opening The Daily. Nothing should download, even if "Only on Wi-Fi" is off in Settings. Then start on Wi-Fi and turn Wi-Fi off a few stories in: it should stop after the story in progress.
  4. **Other stops:** it must not run in Offline mode, with Data saver on, or when the phone is in battery saver or the app's low-battery mode. It must stop when you leave The Daily (open All, Saved and so on) and when the edition changes (at 5:00 AM or 5:00 PM).
  5. **Failures:** a story that can't be downloaded stays under "Also in this edition", the page never breaks or waits on it, and it is not tried again until the next edition.
  6. Keep an eye on mobile data and battery use over a day on a real phone.
  - What is already checked: all of the above was exercised in a desktop browser with the download faked and the connection type, settings and page changed on the fly. Android's real connection type, battery saver and background limits are not checked.

## Added with recent changes (worth a look too)

- [ ] Tapping "Read on the original site" on a Subscriber Preview card opens a Chrome Custom Tab (Android app only).
- [ ] Sharing a link into CyPress shows "Read it now", and it opens the story in the reader.
- [ ] The Daily shows the right edition for the time of day (Morning from 5:00 AM, Evening from 5:00 PM) and ends with "You're all caught up".
- [ ] **Stories get ready sooner (Wi-Fi only).** On Wi-Fi, switch to a different feed and wait a few seconds: the first stories (nearest the top) should get their small ready check mark soon after, without opening anything. Scroll a screen or two and stop: the next ones below should start getting ready.
- [ ] **Stubborn sites.** On Wi-Fi, a site that usually shows only a short excerpt (for example a news site that cuts stories off) should, for its first few stories, open as the full text when you tap them, because the saved-copy, Morss and partner-copy routes ran quietly in the background.
- [ ] **Stops correctly.** With mobile data, Data saver, battery saver or low battery (20% or less, not charging), or "Get stories ready in advance" set to Off, none of the above should download anything. "Only on Wi-Fi" is now on by default.

## Experiment branch (experiment/daily-redesign): must verify on a real phone

- [ ] **Vibration (Settings, Battery and motion, "Gentle vibration").** A soft tap when you save a story, a tick the moment a pull to refresh is ready to let go, a deeper pulse when the Fin. page appears, and a longer double pulse on a milestone. Turn the switch off: nothing should vibrate. Needs the new VIBRATE permission in the build. - Not checked: only the web side exists in this environment; a desktop browser has no vibrator.
- [ ] **Pull to refresh tree.** Pull down on a list: the tree should draw itself line by line as you pull, fill softly at "Release to refresh", and keep swaying while stories load. Check it on a slow drag and a fast flick, and with Reduce motion on. - Not checked: real touch dragging.
- [ ] **Edition notice on the lock screen (Android app).** Turn on the digest and its notice, wait for the morning or evening slot. The notice should read "The Morning Edition is ready" with the cover headline, source and story count when expanded, and the headline should show on the lock screen. Turn off "Show the cover headline on the lock screen": the lock screen should then only say "Open CyPress to read it". - Not checked: no Android build or device here; the Java was reviewed but not compiled.
- [ ] **Launcher icon.** The default tree icon should now sit on a deep green background with a soft glow and a thin green ring, whole inside circle, squircle and square launcher shapes. The themed (monochrome) icon on Android 13+ should still look right. - Not checked: only a drawn preview in a desktop browser; no Android build here.
- [ ] **Tablet two-pane Today.** On a tablet (or a window 900px wide or more) the cover stays on the left while the stories scroll on the right. Rotate the tablet and resize a split-screen window: it should switch between the two layouts. Phones must look as before.
- [ ] **Milestones.** After reading to the end of stories on a 7-day streak (or the 10th, 50th, 100th finished story) a small card should appear once and go away by itself. - Not checked: real streak history.
- [ ] **Welcome edition.** On a brand-new install, finish set-up: Today should show a short "How this works" card under the cover until you tap Got it or reach Fin.
- [ ] **Export this edition (PDF) on Android.** On Today tap "Export this edition as a PDF": the share sheet should offer the PDF; open it in a PDF viewer and check the text is selectable, pages are two columns with a cover and contents. Check an edition with and without cover photo. Non-Western scripts print as "?" (standard PDF fonts only). - Not checked: the Android share sheet and a real PDF viewer (the file itself was checked with desktop PDF tools).
- [ ] **Back issues (off by default).** Settings, "Keep back issues": turn on, read Today for half a minute, then open Back issues in the menu: today's edition should appear as a cover. Change "Keep back issues for" and confirm old issues disappear. Open an issue offline and read a story. Turn the switch off: the menu entry goes away.
- [ ] **PDF pictures (Android app and the installed web app).** Export an edition and check each story page opens with its lead picture, the contents list has full headlines and page numbers, and nothing collides with the page edges. In the web app a few sites block their pictures from being copied; those stories simply have no picture. - Not checked: real phone PDF viewers (checked with desktop PDF tools only).
- [ ] **Continuous reading.** In scroll mode, read to the end of a story and keep dragging up: a hint should say "Keep pulling for the next story", then "Release for the next story", and on release the next story slides in. In page mode, turn the last page once (a hint appears) and again: the next story opens. Check it never fires by accident while scrolling normally, and that "Continuous reading" in Settings turns it off. The next story's text should already be stored (it is fetched quietly on Wi-Fi). - Not checked: real touch dragging and Wi-Fi/data rules (desktop wheel and button simulation only).

## Correction round, clusters 15–19 (experiment/daily-redesign) — must verify on a real phone
- [ ] Daily cover rotates photo / type / minimal across days, never the same look two days running; text legible in all three.
- [ ] Story hub: "Also covered by" teaser and "Full coverage" menu item open it; focus trap, Back/Escape return to the story; tapping a card always opens the article.
- [ ] Send to Kindle: share sheet opens pre-addressed to the saved Kindle address with the PDF attached (Android app); on the web build it downloads the PDF and opens a blank email. Amazon must have the sender on its approved list.
- [ ] Sidebar reading-time labels do not squeeze source names on a narrow sidebar.
- [ ] Calm reading preset: cream paper, Atkinson Hyperlegible, wide spacing; on an e-ink / low-refresh display.
- [ ] Jump to section in paged mode lands on the right page (long articles with real headings).
- [ ] Gift this story: share sheet shows the card image (quote vs headline versions) and it looks right.
- [ ] Text only mode: no picture requests on mobile data (check network), reader and lists stay usable.
- [ ] Pick up where you left off: only stories with >25% read or 60+ seconds appear, max 3, next edition only, thumbs-down hides.

## Build 75d57b1 and after (experiment/daily-redesign) — must verify on a real phone
- [ ] **Sidebar time labels (item 1).** Narrow the sidebar / use a small phone in landscape: source name stays whole on line 1, "N · M min" sits quieter on line 2; never a stubbed name. Check real widths and large system font.
- [ ] **Reader ··· menu (item 2).** Four labelled groups (Settings / Share / View / Story); the whole menu fits a phone without scrolling in portrait and landscape; every item reachable by TalkBack.
- [ ] **Smart card cropping (item 3).** On the phone WebView check whether face detection exists (cards with people should keep faces in frame); where it does not, portraits should be top-biased. Look at cards from BBC, Verge and a portrait-heavy source.
- [ ] **End-of-article card (item 4).** In page mode on a real phone, the end card never overlaps text and there is no blank page after it; also in scroll mode and with Large reader text.
- [ ] **Article image fallback (item 5).** BBC stories: no grey boxes. The exact cause of the original grey boxes was not confirmed here; if one still appears, note the story and the network.
- [ ] **Headlines WIRE label (item 6).** The "WIRE" label no longer overlaps the ticker at phone widths and with Large list text.
- [ ] **Cover photo vs typographic (item 7).** A story whose photo fails to load shows the designed typographic cover (never an empty void); a deliberate typographic cover still looks intentional.
- [ ] **Feed text size (item 8).** Settings → Look → Feed text size (next to Story card size): Compact / Comfortable / Large on a phone and a tablet, across Today, All stories, Headlines, Columns. Display type (masthead, section titles, cover headline) must not change; Large is one column; nothing clips. (Automated test only checks All stories.)
- [ ] **Checkmarks (item 9).** The small ready check (offline-ready) and the read state are distinct; no story shows read that you did not open. Check after a refresh and after an offline session.
- [ ] **Today cover (item 10).** No empty void on the cover on a real phone; admin actions (Export PDF, Share cover, Send to Kindle, Catch me up) reachable.
- [ ] **Polish nits (item 11).** Quote of the day names the person quoted; The Well does not repeat a cover story; Sunday week panel fits on a phone.
- [ ] **Page-mode column voids (item 12).** Open five or six long articles on a tablet (portrait and landscape): columns are filled; partial gaps beside a tall table or code block are known and acceptable.
- [ ] **One-letter tiles (item 13).** Folder and source tiles with a single letter look optically centred on the phone's font rendering.
- [ ] **Article picture shows once.** Open stories from several sources on a slow connection: the lead picture never appears twice, even briefly (it now sits in the body); a story whose text lacks the picture still shows it at the top.
- [ ] **Brief lead picture.** Daily → Brief: the lead picture fills its frame on phone and tablet and keeps faces in frame. The reported "small strip" was not reproduced here with synthetic pictures; confirm on real stories.
- [ ] **Quote of the day speaker.** Daily → Brief: the quote is attributed to the person quoted (outlet shown after it); only when no story has a named speaker does it show the outlet alone.
- [ ] **PDF magazine redesign.** Export an edition from your real feeds on the phone (Today → Export PDF, and Send to Kindle) and open it in the Kindle app / a PDF viewer: the cover photo fills the page; contents entries and "Up next" cards jump to the right pages and the bookmark list opens; "Read at …" links open the story; features alternate full-bleed and half-bleed openers; the back page ends with the CyPress mark. Check real publisher photos crop well (faces, tall images), accented and non-Latin text (non-Western-European letters still print as "?"), and a long edition (20+ stories). Stories section shows thumbnail, headline, opening lines and source only (full text is kept for the longest pieces, 600+ words).
- [ ] **PDF from your real feeds (second pass).** Export from your phone and check: a drop cap's word is whole when you select or copy the text (e.g. "Trump said", not "rump said"); no words run together beside links or italics; long headlines in Contents are never cut and page numbers stay clear of them; each "Read at …" green button is easy to tap and opens the story. Checked here with real BBC, TechCrunch and The Verge pages through poppler; not checked in the Android PDF viewer or Kindle.

## Phase 2 batch (experiment/daily-redesign) — must verify on a real device
- [ ] **YouTube inline.** A story with a video shows a Play card; tapping plays inline (Android app and Safari). A video whose uploader disabled embedding falls back to "Opens in YouTube". Check the privacy page lists the YouTube requests.
- [ ] **End mark.** The colophon at the end of a story is the CyPress logo in the theme's colour, in a few themes (light, dark, cyber, sepia).
- [ ] **Hero margin.** The lead picture has air below it in every reader layout (Automatic, Photo on top, Hero spread, Classic) on phone and tablet.
- [ ] **Clean extraction.** Open BBC, TechCrunch, The Verge, Ars Technica and Guardian stories: no photo-credit lines, "View image in fullscreen", cookie lists or author/date rows in the text; a short or cluttered result offers "View the site here".
- [ ] **Android hamburger.** On a real Android phone (and in the Android app) the menu button never overlaps "The Daily" or any title, in all themes. (Not reproduced in desktop Chromium; the icon box is now fixed.)
- [ ] **Feed text size** sits beside Story card size (Settings → Look and Layout).
- [ ] **Drawer, promos, ghosting.** The reader's edge tab says "Feeds"; its drawer has a header and a close button; event ads and sponsored posts (e.g. TechCrunch Disrupt countdowns) never appear as stories; scroll the feed and open the drawer over a paged article on Android: no duplicate offset text. The empty rounded box under the byline is now the "At a glance" note.
- [ ] **Toolbar labels.** Back / Save / Listen / More sit inside their buttons on a tablet, in a few themes.
- [ ] **Performance and loading (Safari macOS and iOS, Android).** Scrolling a long feed and turning pages feel smooth (this pass was measured in Chromium only; Safari could not be measured here). Pull to refresh: the logo fills as fast as the feeds load. A slow BBC story shows seconds and the route being tried, and after 16 s offers View the site here.
- [ ] **Story position.** "Story N of M" appears in the pinned section bar under the header while scrolling, is not tappable, and nothing floats over the cards.
- [ ] **Magazine layout.** On a wide screen (tablet landscape / desktop), no big empty void under the headline and no half-hidden box at the page edge.
- [ ] **PDF faces.** Export from your real feeds: no headless or chin-only crops on the cover, openers or cards; pictures that would be cut heavily appear whole on a blurred background; opener text is fully inside the page on your PDF viewer / Kindle.

## Phase 3 — instant open (preloading): must verify on a real phone
- On Wi-Fi + charging: open Daily, wait ~1 min, go to airplane mode, tap several Daily stories: each opens instantly with full text, no "Loading".
- On mobile data (Wi-Fi off): nothing is fetched ahead; data-saver on Wi-Fi also holds back bulk downloads.
- Read story 1 on Wi-Fi, then open 2–4 immediately: they appear instantly. Scroll All Stories: stories just below the screen open instantly.
- Low battery (<20%, not charging): only a few stories are fetched ahead.
- Check scroll stays smooth on a low-end phone while background fetching runs.

## Release blockers from device testing (preview 7c1bd69)
- [ ] **Hamburger vs "The Daily" (Android).** Could NOT be reproduced here (Chromium at 320–412px with Android UA, all 30 themes: menu button 14–52px, title starts at 62px, no overlap). Added defences: text auto-sizing off (`text-size-adjust:100%`), 4px extra title margin, menu button above the title in stacking order. Implemented, unverified: confirm on the phone; if it still overlaps, send the screenshot plus Android font-size and display-size settings.
- [ ] **"N min left" pill.** In scroll mode the card now stops above the pill; in page mode the pill sits below the text area (checked at 320/360/412px). Confirm on the phone, also with large system font.
- [ ] **Hamburger vs title, round 2 (Android, feed/folder headers).** Your screenshots show the title starting ~20px from the left edge, i.e. the browser laid the title out as if the menu button took no space (simulated here by forcing the button out of the flow: reproduces the exact picture). Added a measured safety net (`hdrClear`) that pushes the title clear of the button whenever they would touch; normal layouts are untouched. Root cause of the browser behaviour is unknown. Implemented, unverified on the phone. NB: the screenshots show no orange preview bar, so check the address is the preview site (…/cypress-preview/app/), not production.
- [ ] **Page-turn flick (found by the flaky `deep` gesture tests).** A drag that pauses before the finger lifts no longer counts as a flick (speed is ignored if the last movement was over 120ms before release). On a real phone: a quick flick still turns the page; a slow drag that rests, then lets go before halfway, springs back.

## Release 1 "Stop the bleeding" — must verify on a real phone
- [ ] **B14 Export PDF, Android.** Tap Export PDF on Daily: the share sheet ("Save or share") opens with a real PDF (open it from Drive/Files). The JS side is tested (the file handed to the native share is a valid PDF); the Android share sheet itself is not testable here. Web: if a browser ignores the automatic download, the "ready" note's Save PDF button must deliver it (tested in Chromium only; please also try Safari/Firefox).
- [ ] **B22 Wrong-feed stories.** With a feed that is offline (e.g. Zen Habits), its folder view shows no stories from other sites. Cause found by code reading and a mock test of the Google News / Bing fallbacks; not reproduced with the real feeds.
- [ ] **B23 Added feeds.** Add a feed from the list and by pasting an address: the note says "Added X to “Folder”", Open takes you to it, the folder picker is visible when the dialog opens.
- [ ] **B27 Brief links.** In Daily > Brief, tap each "Three to know" link: opens in the in-app reader, never the browser.
- [ ] **B28 Themes.** Typewriter (light): the edition progress line is readable on days the Minimal cover shows; the theme list shows exactly one selected theme.
- [ ] **B29 Slider.** With TalkBack, "Position in story" announces a percentage that follows your position.
- [ ] **B30 Stats.** Open ~4 stories and read them to the end: Stats says 4 opened, 4 read to the end.
- [ ] **B37 Grid holes (VISIBLE DESIGN CHANGE).** A two-column rows block ending on one card now shows that card full width. Check on your phone at the 515 dp setting; if the holes you saw are elsewhere, send a screenshot of the surrounding cards.
- [ ] **B41 First-run picker.** One selected state (check); tap again clears it completely.
- [ ] **Item 13 (magazine layout)** NOT changed: could not reproduce an orphaned opening paragraph. At about 900×700 the left column has ~200px of empty space under the title while "At a glance" sits at the top of the right column. Send the screenshot/viewport if this is what you meant.

## Hotfix: Export PDF in the Android app — must verify on the phone
- [ ] **Export PDF (Galaxy Z Fold).** Daily > Export PDF: the Android share sheet opens carrying the PDF (try "Save to Drive"/"Files", and send it to yourself). The "ready" note says "Pick where to save or send it" (never "downloads"); its Save PDF button reopens the share sheet.
- [ ] **If it still fails, the screen now says why.** A failure note shows the real reason, e.g. "Couldn't share the file: Share failed: IllegalArgumentException: … (while making the file shareable (authority com.cypress.reader.cyfiles))". The step in brackets names where it broke: reading the request, decoding the file, writing to the cache, making it shareable (the FileProvider), or opening the share sheet. A share that never answers is reported after 25 s with the file size. Tap Copy and send me the text.
- [ ] **Kindle send** goes through the same route: "Send to Kindle" opens the share sheet with the address filled in.
- Not testable here: the real Android share sheet, the FileProvider, and large-file limits of the bridge. The JS side is covered by tests/pdf_export_native.js (mocked bridge: resolves, rejects, absent, never answers, Kindle).

## Release 2 "Read anything well" — must verify on a real phone
- [ ] **B11/B12 Bot-checked sites (Android).** Open stories from The Hill, CBS News and HowStuffWorks: they should load, retrying quietly if the first answer is a bot check (HTTP 202/429). On the phone the app's own browser headers may differ from what Chromium sends: confirm The Hill stops answering 429. If a site still refuses, the note should say "Blocked ... bot check", not "slow".
- [ ] **B12 View the site here.** On a story that cannot load, tap View the site here: it shows "trying route N of M", then either the page or a clear message with Try again, within about 30 seconds (never an endless "Loading site…").
- [ ] **B2 Share links.** Share a story: a toast says "Making a short link…", then the link is https://cypressreader.com/s/<7 letters>. The worker answers fine from here (HTTP 200 with a code), and the app code was unchanged since 1.21, so the long links David saw may come from a slow phone connection (previous wait 3.5 s, now 6 s plus one retry). If you still get a long link the toast now says why.
- [ ] **B9 New Scientist.** Could NOT be reproduced here (the site refuses this server with HTTP 406). Fixed what could be shown: the counter no longer says "last page" on page 1 (any short or cut-off story). Added conservative New Scientist cleanup rules. Check a New Scientist story: the "Truncated source text" note and the two-column split (headline/photo on one side, text on the other) need a real look.
- [ ] **B10 Generic extractor.** Measured, no change: a second Readability-style finder matched the current one on 76 of 83 usable cached pages, did worse on 7, better on none. See the report.
- [ ] **Item 4 Junk text.** Read a CNBC story: no "Notice of Right to Opt-Out…", "Allow Sale of My Personal Info", "News Tips", "Ad Choices". Guardian live blog: no "25m ago" / "15.45 EDT" or "UP NEXT" inside the text. The CNBC sample could not be fetched here, so the rules were built from your PDF's text and tested on a synthetic page.
- [ ] **B51 Photo credit.** Engadget story with "Fadfebrian/Getty Images": the credit is not the first line.
- [ ] **B4 Full coverage.** Open a story with other sources: the compare picker starts on a different source, and no story appears twice.
- [ ] **B3 Picture retry.** On a story whose first picture fails, tap Tap to try again: one picture appears. Could only be reproduced in one variant here (lead photo failing inline).
- [ ] **B21 Drop cap.** A story that opens in capitals shows a drop cap with normal-case text.
- [ ] **Item 14 PDF crops.** NOT reproduced: the PDF already frames photos with the face-aware framing and letterboxes heavy crops (tests/pdf_crops.js passes, and your exhibit shows no headless crops). The browser FaceDetector is missing on most Android phones, so on the phone it falls back to the detail-based point; look at the exported PDF's photos.
- [ ] **Item 15 Opener text clipped.** NOT reproduced: in your exhibit PDF the opener text starts at 48 pt from the left edge, and no text clipped at the left edge in the app at 360/412/820/1100 px. Send a screenshot if it persists.
- [ ] **B22 follow-up.** Folder "Lifestyle" IN BRIEF holds no hard news from other sites. Saved Google-News/Bing stand-in stories from other sites are dropped at start (the next refresh brings the right ones).

## Instant open — must verify on a real phone
- [ ] **Airplane-mode tap.** On Wi-Fi, open the app (any screen), wait about two minutes, then switch to airplane mode and force-close and reopen CyPress. Open Daily and tap several stories: each should open at once with full text and no "Loading". Tested here with the network switched off in Chromium (206 ms, zero requests); the phone's real WebView storage is the part to confirm.
- [ ] **Wi-Fi only.** On mobile data (Wi-Fi off) nothing should be downloaded ahead. The app decides this from `navigator.connection.type`; some Android WebViews do not report it, in which case the app treats the network as unknown and takes at most 6 stories. Check which happens on your phone.
- [ ] **Whole edition.** After a few minutes on Wi-Fi with the screen on, all ~40 Daily stories show the "saved" mark. On a low battery (not charging, under about half) only a few are saved.
- [ ] **Read-ahead.** Read a story; the next one opens instantly. Close the story before it finishes loading: nothing keeps downloading for it.
- [ ] **Pictures stay lazy.** The save does not fetch pictures (the "offline photos" setting is separate and unchanged). The next story's lead picture may appear a moment after the text, since pictures are no longer warmed up ahead (this changed in 1.72).
- [ ] **No scroll hitches** on a low-end phone while the edition downloads.

## Covers + B60–B63 — must verify on a real phone
- [ ] **Type cover.** Settings > cover picker: "Type" is listed with a preview. Choose it: the Daily cover is the big typographic one every day, also on a story with no photo. (Automatic still rotates photo / type / minimal.)
- [ ] **Every cover style at Type's scale.** Flip through the picker styles on your phone (and a tablet/fold): each should fill about the whole screen edge to edge with a big headline. These were tuned by screenshot in Chromium only (412 and 1100 px wide); check that no headline or masthead is cut off, and that the first story cards below are still reachable by scrolling.
- [ ] **B60 joined words.** Re-open the story that showed "companysaid": it should read "company said". Stories may still show words glued if the publisher really sent them glued with no spacing at all (the app only fixes the cases where an element sat between two words).
- [ ] **B61 story-open jump.** Tap stories on the phone, with and without a slow connection: the story should appear steady with no sliding text or late pushing down when the picture arrives. Reproduced here only as a 159 px jump on a wide screen (fixed); the phone case was not seen here.
- [ ] **B62 Wire ticker (NOT reproduced here).** Chromium draws it cleanly. Likely cause on a phone: a very wide moving layer. It is now 4 short headlines (under 3000 px wide). Check Headlines on the phone: if glyphs still look scrambled, send a screenshot.
- [ ] **B63 My Feeds arrows (NOT reproduced here).** The arrows expand and collapse on a touch tap in every phone width I tried (320 to 820 px). I made the arrow's tappable area 44 x 44 px and removed double-tap delay. If it still does nothing on the phone, send the phone's font size / zoom settings and a screen recording.
