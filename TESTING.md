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
## 1.79 — My Feeds + scroll stutter — must verify on a real phone
- [ ] **My Feeds opens.** In the side menu, tap My Feeds (the label or the arrow): the folders appear; tap again: they hide; it stays that way after closing and reopening the app. Reproduced from your recording (the open state was undone straight away) and fixed; tested with touch taps at 360 to 884 px wide.
- [ ] **Deep reads and Sunday scroll.** Scroll both on the phone: they should now feel like Smart and Top. Measured here only as style work (about 5 to 7 times less per scroll with the effect removed). Chromium on this server could not show the stutter itself, so the phone is the real check. If it still stutters, say which part of the page (images, the quote cards, the top).

## 1.80 Cover headlines and design rules — must verify on a real phone
- [ ] **Look at every cover style** (Settings > cover picker) on your phone, in a few themes, with a long headline on top: nothing cut off mid-word or ending in "...", no text on text, no text over a small picture, story boxes readable. Checked here by 21 styles x phone and tablet widths, with a headline-fit test (long headline, one very long word) and a rules test; and by eye on screenshots in the default look and two other themes. Your own device fonts/zoom (515 dp width, font 4/8) were not tested.
- [ ] **Poster and Italic Mix now have no photo** (type-only, by design: a photo you cannot see is gone). Say if you want a photo back in either.
- [ ] **Faces (rule 6).** Covers now show a wide photo WHOLE (full width, over a blurred copy of itself) whenever filling the space would cut away more than about a fifth of it; tested here with a photo of two people (one at the right edge) on a flag, in 21 styles at 360, 412 and 820 px: at least one full face is always visible, and both in nearly all. A phone's own face finder is no longer needed for this. Check with your Musk/Trump photo on Photo, Split, Block and Spotlight. Old note:  Covers keep the existing focal point (face-aware where the phone has a face detector; most Android phones do not, so it falls back to the most detailed area of the photo). No face detector runs on this server, so partial faces could not be tested. Send a cover where a face is cut in half and I will add a rule for it.
- [ ] The video you tried to send did not reach me (cut-off zip). Screenshots of the worst combinations (theme and cover style named) would let me check them directly.

## 1.81 — Wire ticker, Gallery, picture dedupe, cover names — must verify on a real phone
- [ ] WIRE ticker: on All Stories / Headlines, tap a headline in the moving strip; that story should open. (Works in the automated test with a real tap; not tried on a phone.)
- [ ] Open the Ars Technica "Claude AI submitted false murder tip" story: the phone-icon photo should appear once, not twice in a row. Unverified: only a made-up page was tested, the real page markup was not reproduced.
- [ ] Cover masthead: set the cover to Photo and text (formerly Side by side) and Gallery on a tablet or wide screen; "CyPress" must sit fully inside its column, never cut off at the right edge. (Could not reproduce the cut-off on 1.80; the masthead now shrinks to fit as a safety net.)
- [ ] Gallery cover on a wide screen: the headline stays inside its text column with space at the right.
- [ ] Cover picker: names read Photo and text and Journal; descriptions match the layouts.

## 1.82 Phase 1 fixes — must verify on a real phone
- [ ] Photo and text cover (tablet / unfolded): photo is clearly the bigger half, headline and "CyPress" are not oversized next to it. On a phone this style shows as Full photo (it needs a wide screen).
- [ ] Cards: source names ("BBC News"), "N sources" badges and "Also from…" lines show in full (they wrap onto a second line on very narrow cards). Stats → Top sources shows full names.
- [ ] Milestone badge (streak or finished-stories): number and label sit comfortably inside the circle. Try a 7-day streak and 1,000 stories if you can trigger them.
- [ ] Share cover: the gold "THE EVENING EDITION · NO." line and the CYPRESS name are clean (letters not squished or overlapping).
- [ ] Settings → Cover style (plain list) shows the same 25 styles and names as the picker.
- [ ] Re-check from the batch that were already fixed in earlier releases and pass in automated tests only: Related reads opens the right story, short share links, image retry shows one picture, Compare coverage, no ads as cover story, 202/429 sites (thehill.com, howstuffworks.com) load, Saved "Time I have" filter, Clear history asks and says so, trimmed More menu (11 actions), "Story N of M" gone, reading progress inside the bar, side-by-side reading toggle (off by default), Brief links stay in the app.

## 1.85 Feeds — must verify on a real phone
- [ ] Add a feed → type **ctv**, **nyt**, **wapo**, **gurdian**, **home decor**, **knitting**, **sleep**: sensible results; adding one puts it in the folder named under it and shows "Added to …".
- [ ] A word that matches nothing (for example **ctvv**) shows "Did you mean …" and the add-it-yourself instructions straight away (not only after the web check ends).
- [ ] Paste a site address (a blog, a news site, a Medium or Substack page, a WordPress or Blogger site): "Found a feed on that site" appears with "will be added to “<your folder>”"; change the folder menu and the line changes; adding puts it in that folder (no new "Other" folder).
- [ ] The Back button (inside Browse topics and the other lists) is clearly visible and easy to tap with a thumb.
- [ ] Settings → Import/Export or Add a feed → **Import a feed list (OPML)**: pick a real OPML file from your other reader (Feedly, Inoreader, NetNewsWire…). The preview counts look right, folders are kept, and Undo works. (The Android file picker cannot be driven here.)
- [ ] The Lifestyle folder (Life Kit, Lifehacker, The Art of Manliness, Zen Habits): after a refresh, no hard news (Pope, hurricanes, Justice Department…). If Life Kit is unreachable it stays empty/offline instead of showing NPR news.
- [ ] 734 feeds were "verified" from this server; some may behave differently from your phone (publisher bot checks). If a newly added feed shows no stories, tell me which one so it can be fixed or removed.
- Not in this phase: click-one-headline training changes, change monitoring, and serving feeds over Wi-Fi (items 7, 9 and 10 of B46; "Teach CyPress" and "Watch a page" already exist from an earlier release).

## 1.84 Export redesign — must verify on a real phone
- [ ] Open a story → ··· menu → **Save as PDF**: one tap. A note says it is working, then the Android share sheet opens with a PDF. The PDF opens in your PDF app; text is easy to read (not tiny); the headline has no "FOR SUBSCRIBERS"; pictures from the story are in it.
- [ ] Open a story → ··· menu → **Send to Kindle** (first time): the Kindle address question appears (the field wants the @kindle.com address; the approved-sender note is a separate line). Save it, then your email app opens with an EPUB attached and your Kindle address filled in. Send it and check it arrives on the Kindle (Amazon may take a few minutes; the sending email address must be on Amazon's approved list).
- [ ] Settings → Stories → **Kindle books**: try both Black and white and Color. On an e-ink Kindle the black and white book should have grey pictures and a high-contrast cover; on a colour Kindle/Kobo the colour book keeps colour. Check the type size is comfortable and the contents (Go to) works.
- [ ] Saved → **Pick stories**: tap 2 or 3 stories (a check appears, the story does not open), then **Make PDF**: a mini-edition with a cover, contents and the full stories. Also try Send to Kindle from the same bar, Share links, Pick all and Done.
- [ ] Today (the Daily): there is no Export PDF or Send to Kindle any more; Catch me up and Share cover are still there.
- [ ] Tap Save as PDF / Send to Kindle twice quickly: only one file is made and the buttons are greyed while it works.
- [ ] A story that only has its summary stored (never opened): the note says to open it once first.
- Honest limits: the share sheet, the email hand-off and how the EPUB looks on a real Kindle cannot be tested in this environment (the EPUB passes the official EPUBCheck validator with no errors or warnings). The old "tap Export PDF several times" problem could not be reproduced here; the new buttons answer immediately and ignore a second tap, but only a phone can confirm.

## 1.83 Cover picker previews — must verify on a real phone
- [ ] Settings → Cover style → open the picker on the phone: every tile should look like the real cover (not an old design). Check Poster and Italic mix (no photo), Chapters (title, four stories, one photo), Top plays (numbered list), Journal, Gallery, Type.
- [ ] The tiles scroll smoothly (each is a full cover drawn small, 25 of them); the picker opens without a noticeable pause on your Z Fold.
- [ ] Quick looks (the 8 small thumbnails in Settings) still look right.
- [ ] On the unfolded screen the previews use the wide layouts (Photo and text, Triptych).

## 1.86 Read aloud sync and pauses — implemented, unverified; must verify on a real phone (needs real voices)
- [ ] Android app, any story, tap Read aloud with the phone's own voice: the highlighted word should match the spoken word within about half a second, and stay that way for the whole story (before: seconds behind). Try Rate 1.0, 1.5 and 2.0.
- [ ] Try two or three different voices (Settings → Voice). Some engines report words late or early; note which and how far off.
- [ ] Listen for breaths: a clear pause after the headline, after subheadings, and between paragraphs; none in the middle of a paragraph. Pauses should shrink at faster rates.
- [ ] Skip paragraph/sentence, pause and resume, and changing the rate mid-story still land on the right word.
- [ ] Lock the screen or minimise the app while reading: speech continues, and the highlight is on the right word when you come back.
- [ ] Two-voice quotes (Settings → Quote voice) still switch voices; no double pause around quotes.
- [ ] In a desktop browser (Chrome/Edge/Safari): highlight follows, paragraph breaths are audible.

## 1.87 Home-screen widgets (B67) — implemented, unverified; must verify on a real phone
Android only; nothing here could be built or run in the dev environment (the app is compiled by the release build). If the release build fails, read the compile error first: the widget code is the newest Java.
- [ ] Remove any old CyPress widget from the home screen, then add each of the three from the widget list: "CyPress Top Story" (2x2), "CyPress Headlines" (4x2), "CyPress Ticker" (4x1). They should all show stories after opening CyPress once.
- [ ] Top Story: big faint number top right, gold source line, serif headline, "1 of 5" and two arrows at the bottom. Arrows flip stories; tapping the headline opens that story; it flips by itself after about 30 minutes.
- [ ] Headlines: make it taller and shorter. Short = 3 rows without pictures; medium = 3 rows with pictures; tall = 4 rows with pictures. No empty gap at the bottom at any size. Tapping a row opens that story; tapping the CyPress title opens the app.
- [ ] Ticker: one story, kicker says BREAKING (or LATEST if nothing is breaking), changes about every 15 minutes (Android may delay this in battery saver or Doze; note how late it runs).
- [ ] New edition: when the morning or evening edition arrives (or after pulling to refresh and leaving the app) all three switch to the new top story and go back to the first one. Watch for the quiet "Updating…" and that old headlines are not shown as new.
- [ ] Light and dark: switch the phone's dark mode; check all three are readable, no green wash, no clipped text. If a widget keeps the old colours, note it (a widget may need one update to repaint).
- [ ] Tap targets: arrows and rows feel at least thumb-sized; the screen reader reads "Previous story" and "Next story".
- [ ] Phone left alone overnight: widgets do not show yesterday's headlines as if current (after about 14 hours they say "Tap to refresh").
- [ ] Reboot the phone: the Top Story and Ticker keep flipping afterwards.
- [ ] Z Fold: unfolded and folded home screens both lay the widgets out sensibly.
- [ ] Read stories are dimmed on all three. (The old Save button on the widget card is gone from the new design.)

## 1.89 Instant opens — must verify on a real phone
- [ ] Wi-Fi: read a story to its end (scroll or turn to the last page), wait about 10 seconds, then tap Next up or a Related read: it should open with no loading note. Try with Airplane mode switched on after waiting: it should still open.
- [ ] Mobile data only: reach the end of a story; nothing should be downloaded in the background (check data use in Android settings if you can). Same with Data saver on.
- [ ] Tapping any story in a list: the reading panel appears at once; the text arrives a moment later with a quick fade, no jumping. Try a story with a big top picture on slow Wi-Fi: the text must not jump down when the picture arrives.
- [ ] Cold start (swipe the app away, open it): time to the first story. Note whether it feels faster than 1.87 on the Z Fold, and whether anything looks empty for a moment (the feed refresh now starts a moment after the first screen).
- [ ] Words: re-open the Next Web and Vox stories that showed "companysaid" / "Bloomberghas" and a few others; no joined words. (Words glued by the publisher itself with no element between them cannot be told apart and are left as they are.)
- [ ] The full-edition Wi-Fi pre-download from earlier releases is unchanged (it is already in main; see 1.72 notes). Still must be checked on a phone on and off charge, per its own items.

## 1.90 Deep-dive criticals — must verify on a real phone
- [ ] Read aloud (phone's own voice): pause, wait, resume, repeat a few times at rates 1.0 and 1.5. Nothing should be skipped: the first word after resuming is the one you were on.
- [ ] Sleep timer: start reading aloud, set a 1-minute timer, turn the screen off and put the phone down. Reading must stop at about a minute (and the lock-screen controls disappear). Repeat with the app in the background. Then set a timer, change it to Off, and confirm reading carries on.
- [ ] Widgets (Android only, none of this could be run here): the Headlines widget at a normal 4x2 size shows small pictures beside the stories; after a restart of the phone the Top Story and Ticker keep flipping and the pictures are still there; switch off Wi-Fi, add the widget, switch Wi-Fi back on: the pictures appear within a few minutes. Leave the phone for 14+ hours without opening CyPress (or turn off background refresh): the widgets say Tap to refresh, and tapping shows Updating… and then new stories (not just opening the app).
- [ ] PDF of a story with a big first letter: copy its text from your PDF viewer or have it read aloud; the lines come out in order.
- [ ] A story with a quoted letter or long quote written as a block (for example a Van Gogh letter on a WordPress site): Save as PDF and Send to Kindle keep every quoted paragraph. A short story with a quote still shows its pull quote in the PDF.
- [ ] Feeds: refresh with many feeds (30+) on mobile and Wi-Fi: no stall; a feed that is gone for good stops being retried on every refresh (pull to refresh still tries it). Import an OPML file with more than 300 feeds: the dialog says only the first 300 are taken.
- [ ] Cyber Dawn and Pixel themes: the headings use Rajdhani and Silkscreen (check once on Wi-Fi after choosing the theme).
- [ ] Privacy: please check in the Cloudflare dashboard (Analytics and Logs → Web Analytics) that automatic installation of the web analytics script is OFF for cypressreader.com. A check of the live pages found no such script (home, app and a share page), but the dashboard setting could not be seen here. If it is on, tell me and the privacy page will be changed back to name it.

## Preview: flagship audio and reader (branch preview/flagship-audio) — must verify on a real phone
- [ ] Feed rhythms: List (flat index, hairlines, tracked small-caps source, muted time), Cards (12px framed cards, no shadows), Headlines → Cards (big lead headline over small companions) and Columns (ruled serif columns). Check them on the phone and tablet in a light and a dark theme.
- [ ] Reader: the header (kicker, display title, byline with the author and a reading time counted from the text), the 700px measure when scrolling down, and the new drop cap on a feature story.
- [ ] Quiet sweep and callouts: open stories that carry a newsletter box or a "Related reading" list. The box should fade out about 0.3 s after the text appears; the list becomes a callout card. Tell me about any real text that disappears.
- [ ] Photo tint: with Settings → "Tint pages with photo colors" on, a story with a photo takes a faint color on the page (a 4% breath; it is skipped whenever it would cost legibility). Check a dark theme and Sepia.
- [ ] Lock screen: start Listen, lock the phone, and use play, pause and skip from the lock screen and from Bluetooth headphones. (Already built in 1.86; unchanged here.)
- [ ] Read-aloud highlight: already driven by the voice's own word reports with the clock only as a fallback (1.86); unchanged here. If it still runs ahead, Settings → Reading → Voice timing → Reset.

## 1.93 Settings and reader UX — must verify on a real phone
- [ ] Reader "Aa" button: open any story, tap Aa. A−/A+, Auto/Pages/Scroll, Tight/Normal/Roomy and the sepia switch should reflow the story live without closing it; Escape (keyboard) or a tap on the story closes the popover; TalkBack should read each button with its own name and say which pill is selected. Check it does not cover the reader bar buttons on a small phone and that it is easy to reach with one thumb.
- [ ] Settings → Reading and Listening: the sample passage at the top follows font, size, spacing and alignment. Fonts are real Google fonts only on a phone; I could only test with fallbacks here.
- [ ] Settings → About and Help: "Developer and diagnostics" holds the four developer rows; each still works. "Reset appearance and reading settings" asks first, then resets look and reading only; check feeds, folders, Saved, highlights and sync are untouched.
- Not changed: Settings already had a search box (Search settings on the Settings home page) and per-page "Reset this section", so I did not add a second search box.
- [ ] Editorial cards and covers (1.93): scroll the Daily and All stories on the phone and tablet. Check the small-caps kicker is readable on every card (cards on a brand color or photo use white; light rows use the brand color), the footer line (author, minutes, age), and "+N sources". Open several cover styles, especially the light ones (Gazette, Gallery, Index, Cinema): the new masthead rule is white and the masthead has a dark shadow, so look for a lost rule or a smudged masthead. Check the numbered cover lines (01, 02, 03) do not double up or shift the text on styles that already number their own lines. Look at a feed pull-quote and the "Developing" bar.

## 1.92 Pictures, covers, general finder, long reads — must verify on a real phone
- [ ] B100/B101 pictures: open the MakeUseOf story with the nine screenshots (and a few other how-to stories) on your phone, once with Wi-Fi and once on data. Every screenshot should be in the story, in order, each with its caption tied to it, none as a tiny thumbnail, no "Credit:" line floating loose. I reproduced the cause here (the backup reading service path threw away picture-only blocks, and lazy-load addresses were skipped) and it is fixed and tested on real MakeUseOf page source, but I cannot see your phone's network path. If a story still loses pictures, tap Share log and send me the "page read:" line for it.
- [ ] Verge: a Verge story that used to show "[Image: …]" as text now shows the picture or nothing. I could not find that exact text on the pages I fetched (they use plain figures), so it is fixed by general rule; please tell me if you still see it.
- [ ] B102 covers on your tablet and the Fold (unfolded): flip through all 25 styles in Settings → cover picker. Every picture should run the full width of the cover with the text above or below it. Real photos matter here (the test pictures were plain gradients); look especially at Journal, Gallery, Spotlight, Magazine, Broadcast, Plays, Fact and Rail.
- [ ] B99 (web cover-style dropdown): already fixed in 1.8x (the plain list is built from the same table as the picker); the live site has all 25. If you still see fewer, tell me the browser and I will look.
- [ ] B104: scroll the Daily on the phone and the tablet. Only the big lead and hero pictures should drift; all other cards hold still. Then find the MCU story card whose headline was cut off at the top; it should now show the whole headline (I could not match that exact card, so I tested every image card type with a very long MCU-style headline and with text enlarged).
- [ ] B103: open a long story with a section divider, and one with a "Related story" box: the small ornament above should be the tree mark, in a light and a dark theme.
- [ ] B10 general finder: it only steps in when the usual finder finds nothing or clearly less. On 156 real pages the general finder raised average recall against Mozilla Readability from 0.899 to 0.913 and precision from 0.904 to 0.914, with no page getting worse; 3 pages improved a lot, the rest are unchanged. If a story that used to read fine now shows extra junk (comments, sidebars), tap Share log: the log says "found by the general-purpose finder" when it is the new finder.
- [ ] B39 cinematic long reads, on the phone: open a long story with several landscape photos in Scroll mode. Check the full-width photos, the gentle drift (pictures should slide slightly against the text, never overlap it), the floating captions, the numbered display headings, and that scrolling stays smooth on your phone. On Android, watch for any ghost or doubled copy of text while scrolling (the cover once had that); if you see one, turn off Settings → Magazine and digest → Cinematic long reads and tell me. Also check a story with one picture, and a story with none.
## 1.91 Remaining opens — must verify on a real phone
- [ ] Colophon: Save a story as PDF and open the last page: oval gold badge, CYPRESS in gold letters, thin rule, "The art of staying informed.", one quotation (never a lone word on its last line), "This selection was made <date> · Get the app at cypressreader.com/app". Send a Kindle book in black and white and open the last page on the e-ink Kindle: all black, readable, quote and badge present. The quotation is one of the 116 in your quote bank, picked at random each time; export a few and check that none ends with a single word alone on its last line.
- [ ] Slogan: look at the Daily cover (Type), the PDF cover, the share picture, Settings → About and Help, the website (cypressreader.com), and the Headlines widget header when no edition name is set. No "Read what matters. Then stop." anywhere.
- [ ] Reader pictures: open the Big Think story at https://cypressreader.com/s/TRTHMbJ on your phone and your tablet, in Pages and in Scroll. Pictures and their captions sit in their own space, no text over a picture, nothing cut off at the right edge. (Fixed against a copy of that story's feed text; I could not load the live page because the site blocked this environment.)
- [ ] Covers: Collage, Italic mix and Plays look more like magazine covers (same headline face as Type). The fonts here are the real Google fonts only on a phone; I could only judge them with fallback fonts in the test browser, so please look at all 25 styles once. B77/B78 is a judgement call; tell me which still look wrong.
- [ ] Photo cards: on the Daily, headlines over bright photos are readable at a glance.
- [ ] Teach CyPress with New folder chosen puts the feed in the new folder.
- [ ] Read aloud: if the highlight looks early or late, Settings → Read aloud → Voice timing → Reset clears it.
- [ ] B26 (stutter in Deep reads and Sunday): not reproducible here at 4x slowed CPU (no slow frames), and the 1.79 fix is still in. Please scroll Deep reads and the Sunday issue on the Z Fold and say if it still stutters.
- [ ] Wording (B96): skim Settings, the Daily, the reader menu, a failed story load and the read-aloud messages for anything that still sounds off. Things to look at specifically: Saved's pick bar says Save as PDF; a story that will not load says "View the site in the app"; the loading line says "trying source 2 of 5"; the end of a story says "Turn the last page again to go on to the next story". The wording list is checked by an automatic test (copy_consistency).

## Preview: feed layout by pane width (branch preview/flagship-audio)
Must verify on the Fold (folded and unfolded), a tablet and a phone:
- Cards: image on top of every story; 1 column when narrow, 2 once the feed pane is about 475px wide.
- Single-site lead story: stacked (picture above headline) until the pane is about 640px wide, then a 55/45 side-by-side split; the headline never becomes a tall narrow column.
- Columns: 1, 2 or 3 newspaper columns with thin rules, depending on the pane width, at any display zoom.
- List: index rows with source, headline, one-line deck, time and a star.
- Stories saved with a cookie or privacy notice are cleaned or re-fetched when opened (try the Ars Technica Martin Shkreli story).
- Unfolded Fold (square-ish, under 720px wide): the left menu is about 188px wide.

## Preview 1.103: limited feeds, deal filter, reader cleanup
Must verify on the device and with real publishers:
- A deal roundup ("Save up to 20 percent on gift cards…") never appears in Tech, All Stories or a cover. Watch for real headlines wrongly hidden (for example "price drops to $5" in a market story).
- A paywalled feed (for example the Wall Street Journal) shows a small lock in the side menu; its stories show "Subscriber"; a feed of short teasers gets "Teaser" once stories have been opened.
- Add feed: typing a paywalled address shows the amber warning before you add it; a normal site does not.
- Manage feeds → "Purge limited feeds…" and the side-menu chip list the flagged feeds, with the reason, and remove only the ticked ones; Undo brings them back.
- Reader: affiliate notes and buy boxes are gone; "Read original on <site> ↗" opens the publisher outside the app.
- Subscriber-only stories are no longer pulled from the Internet Archive.
