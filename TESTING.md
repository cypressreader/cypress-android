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

## Preview 1.104: Fold reader and feed fixes
Must verify on the Fold:
- Every story opens on page 1 (header 1 / N); only the Continue reading row resumes.
- Wide reader: page 1 left column holds the picture, kicker, headline and byline; the text and drop cap start at the top of column 2 with nothing above them.
- Opening and closing a story: the side menu stays the same width behind it, no floating picture, a quick fade. (The close fade uses the browser's page-transition fade, which needs checking in the Android app.)
- Folder title (Tech) is not cut off at the top; Cards never show three across in a narrow pane.
- Engadget and TechCrunch stories: no "may receive a commission" line, no bare "Image Credits:" line.

## Preview 1.105
- Wide reader, page 1: picture, kicker, headline and byline in column 1; story text and drop cap start at the top of column 2 on every story (check a TechCrunch story with no standfirst and a BBC one with a bold standfirst). If "At a glance" cannot fit beside the picture it is left out on that page.
- Cards in a narrow pane: never three across.
- A single site or a folder opens straight onto its stories in Card and List views (no tall "Section" banner).

## Preview 1.106 (branch preview/polish-106)
Must verify on a real phone / the Fold:
- Android: the launcher icon is the tree crest (deep-green frame, tinted version on Android 13+) and the app starts from it after updating over an older build that had another icon chosen. Share-to-CyPress still works. No icon picker in Settings.
- Wide reader: swipe through a long story; no blank page, no half-empty column; page 1 column 2 starts with the story text; "The story so far" sits a few paragraphs in.
- Settings → Appearance & Theme: Dynamic | Paper | Obsidian switch, the photo-color toggle, and the advanced palettes (renamed: Tempest, Bastion, Synapse, Apex, Strata, Eclipse, Aether, Neon, Scarlet Dawn, Duel, Paragon). A saved old choice (for example the former Highstorm) keeps its look under the new name.
- Pull quotes and story endings look clean; no ornaments.

## Batch 2 (preview/polish-106): half-folded foldable
Must verify on the Fold: open a story and half-fold the phone like a laptop (tabletop). The story text should sit on the top half and the page controls on the bottom half, and it should follow when you fold or unfold. (Tested here only with a simulated two-segment screen.)

## Batch 3 (preview/polish-106): reading experience
Must verify on a real phone: open a story and leave the phone idle past the screen timeout (screen should stay on; lock/unlock and switch apps, it should release and re-acquire). Scroll a long story in Scroll mode: thin line at the top fills left to right; no line in paged (Folio) mode. Android 13+: with themed icons on, the app icon is tinted (new monochrome icon); long-press the icon and see The Daily shortcut (may need reinstall of the web app / APK).

## Batch 4 (preview/polish-106): tactile
Must verify on the Fold: (1) fully open inner screen, Scroll mode: picture keeps its shape, text shows; half-fold like a laptop still splits the story (top) and controls (bottom). (2) Feed card swipe: right = Read/Unread (green), left = Save/Unsave (gold); a small vibration tick when you pass the release point. (3) Split screen with a notes/messaging app: drag a card with a mouse or S Pen and drop; title and link arrive (touch long-press keeps the quick menu). (4) Stories whose first letter is A, T, V or W: the big first letter sits close to the text.

## Mode switch (preview/polish-106)
Must verify on the Fold (inner screen): open a story in Scroll, switch to Pages, then back to Scroll (also with a half-fold and unfold in between): picture keeps its shape and the text is all there.

## Batch 5 (preview/polish-106)
Must verify on the Fold/phone: switch Paper > Obsidian > Midnight: the status bar colour follows immediately with no one-step lag. Settings > Reading > Focus reading: on/off in both Scroll and Pages; check the page count still looks right and highlights/read-aloud still work.

## Focus reading fix + read-aloud after leaving a story (preview/polish-106)
Must verify on a phone (web app and APK): Focus reading on: text flows in normal lines, in Scroll and Pages. Start Read aloud, press Back to the feed: audio carries on and the floating pill shows; pause/resume/stop from the pill; browse and open another story (the old audio stops). Web app only: audio may still stop when the browser hides the page or the screen locks; that is the browser, the APK is the reliable case.

## Read aloud with Focus reading; back while listening (preview/polish-106)
Must verify on a phone: Focus reading on + Read aloud: words are spoken whole and the highlight follows them. Start Read aloud, then Back / edge-swipe: the story closes straight to the feed, audio carries on, the pill shows, and no prompt or picture view appears. If a prompt still shows, note its exact wording and which app draws it (it is not from CyPress).

## Batch 6 (preview/polish-106)
Must verify on a phone: (1) read aloud, back to feed, tap Play on the pill: the story opens and audio resumes, nothing else opens. (2) Notices appear top-centre as a pill with a small vibration on Save; check it clears the status bar/camera cut-out and is tappable for Undo. (3) Pull to refresh: fill follows the pull; stronger tick at the threshold. (4) Sync on: go offline, save/mark stories, go online: sync runs by itself within a few seconds. (5) A busy feed with no reads for 30 days shows the pause suggestion on All stories (feeds get their 30-day clock from the first time this version runs).

## Swipe on text stories + resume from the pill (preview/polish-106)
Must verify on a phone: in every feed layout (cards, list, Daily, wire/columns), swipe a text-only story right (Read/Unread, green) and left (Save/Unsave, gold) with the tick at the release point; horizontal strips still scroll normally. Read aloud 2-3 minutes in, Back, Pause on the pill, Play: the story opens and speech continues from the same spot with the highlight on that word.

## Swipe release on text rows (preview/polish-106)
Must verify on the Fold/phone, in every layout: swipe a text-only story left past the gold mark and let go: it saves (toast + star); right past the green mark: read/unread toggles; a short swipe does nothing. If it still does not act, note which layout and which row type.

## Batch 7 (preview/polish-106): Daily podcast player, status strip, exports
Must verify on a phone (APK for background audio): (1) Daily cover: status strip reads "N stories left • ~Xm ⌄" with Play Daily on the right, readable on light and dark covers; tapping the left side opens the drawer, tapping Play Daily starts the Daily without opening it. (2) The dock appears above the tab bar; headline/publisher, play-pause, back 15s, previous/next story, thin progress line. Tap it: chapter drawer with scrubber (ticks at each story), queue, speed 1x/1.25x/1.5x/2x. Seek and jump keep the read-along highlight when you open the story ("Open this story"). (3) Lock screen / Bluetooth: play, pause, next, previous, seek bar. (4) Leave the app for several minutes: it keeps reading through all stories. (5) Frosted panels on Daily covers and featured cards: text readable over dark, bright and busy photos. (6) Export a PDF and an e-book to an e-ink reader or viewer: type size/spacing, pull quote, footers.

## Batch 8 (preview/polish-106): store compliance, player look, one Share
Must verify on the APK/phone: (1) Share on a story (card menu and reader menu): the share sheet gets the card picture and a message "Read this in CyPress: <link>" (APK: new native text field with the picture); in Messages/WhatsApp the card shows without a second link preview. No "Gift this story" anywhere. (2) A paywalled story shows only its preview plus the link to the original (no hidden text appears). (3) Daily player: thumbnail in the dock and list, 2px top progress line, Now Playing sheet blur/aurora, equalizer on the playing row, two-column layout on the open Fold.

## Short share links (preview/polish-106)
Must verify on the APK/phone: Share a story with Settings > Sync and Backup > Shorten shared links on: the message reads "Read this in CyPress: https://is.gd/..." next to the card; the Share button shows a spinner briefly. Switch it off, or go offline/airplane mode: the message carries the publisher's own address. Check the short link opens the CyPress share page (uses the live site worker, docs/worker/SHORT-LINKS.md).

## Halcyon theme (preview/polish-106)
Must verify on the phone: Settings > Look > Halcyon. Light phone shows cream paper with a green masthead; dark phone shows ink-green with brass. Switching the phone's dark mode while the app is open flips it. Check small text (source labels, times, drawer, Daily player) is comfortable outdoors. Cormorant Garamond headlines need a connection the first time they load.

## Phone polish (preview/polish-106)
Must verify on the phone/APK: story cards at 190px minimum width (check a narrow phone shows sensible columns); reader buttons easy to tap and the bottom of the page clear of the gesture bar; the lead picture is shorter so text starts sooner; the installed app / browser top bar is deep green (the preview site still shows its orange preview marker on purpose).

## Homepage live demo (docs/demo.html)
Must verify on a phone and a desktop browser at cypressreader.com: tap "Try it live" in the phone frame; it opens The Daily with made-up stories; tapping a story opens the reader with text; All stories shows picture cards; no Settings or Add feed; any outside link says "This is a demo"; "Close the demo" returns to the picture. Check it does not change your own web app data (open cypressreader.com/app before and after). Light and dark follow your device.

## Tablet page for phone visitors (docs/tablet.html)
Must verify on a real phone: on cypressreader.com under the phone demo, tap "See the tablet layout, live"; the page opens with the tablet layout (sidebar and columns) shrunk to fit; rotating sideways makes it bigger; pinch-to-zoom works and does not trap scrolling; "Back to the site" returns home. Also check it on an iPhone (Safari) and an Android phone (Chrome).

## Batch 1.107 (preview): location and sunset removed, Daily and All Stories tidy-up
Implemented, unverified on a phone. Must verify on the APK/phone:
(1) **No location anywhere.** After installing the new APK, App info > Permissions must not list Location, and no location prompt may appear in Settings, the Add dialog or "Near you". (The permission lines are gone from both native manifests; this needs the next APK build to take effect.)
(2) **Near you.** Add a feed > Near you: type "Leeds", "Lyon, France", "Pune", "Sydney NSW"; Find news (or Enter on the keyboard) shows Google and Bing results in the phone's language; Add puts the feed in a "Local" folder; "Save to my places" keeps the place (up to 10), Remove forgets it, saved places survive closing the app.
(3) **Light or dark.** Settings > Look: no "After sunset", "Weather in the sky" or "Exact sunset time" rows. "Light or dark" has As the theme is / Always light / Always dark / Follow my phone. Anyone who had After sunset on should land on Follow my phone. Dynamic look has no "Match daylight".
(4) **Search box.** Tap Search at the bottom, type nothing, close the keyboard with the keyboard's own hide button, then scroll: the box should go away. Also: close the keyboard, then tap The Daily or All: the box should go away. (Uses the on-screen keyboard height; cannot be checked on a desktop.)
(5) **Long press.** Press and hold on a feed in the sidebar, on settings labels and on buttons: no text highlights. Reader text and text boxes still select.
(6) **Pull to refresh.** The growing tree sits in the middle of the top bar on a phone, with the bar's own color behind it (check Halcyon and a light theme), and the small leaf by the title stays hidden while it shows.
(7) **Feed settings on a phone.** "Refresh this site" shows the full-width choice under its name with "Check less often to save battery" under it; Stop following says what it does; the confirmation reads Remove and "You can undo this right after or add it back later."
(8) **Feed text size and Story card size.** Compact/Comfortable/Large changes The Daily's headings too; Story card size buttons read Compact, Medium, Large and the headline grows with them.
(9) **ABC News.** Removed from the starter list (it showed no stories on the phone).
(10) **Shared-link page** (docs/s.html): open a real shared link on a phone; it should be green and brass, show the tree badge and read "CyPress Reader". The worker in docs/worker/share-worker.js changed (preview picture and names), so it has to be pasted into Cloudflare again before the short links show the new wording.

## Reader blank column, row headlines, tall photos (preview, 1.107)
Implemented, unverified on a tablet: (1) open stories with a very long headline on a tablet in Halcyon dark (e.g. a TechCrunch story): the headline should be the narrow serif at a moderate size and the text should start right after the byline, with no empty column. I could not reproduce the blank column here, so the fix (letting a tall header run into the next column) is a best guess; send a screenshot if it still happens. (2) The Daily on a tablet: row headlines show in full, no tall stretched photo cards, All Stories column headlines are not oversized.

## Polish pass (preview, 1.107)
Implemented, checked in a desktop browser only for: reader header across the top on a tablet, the Well grid staying on screen, the solid Daily tab bar. Not checked on a device: rank-badge spacing in All stories "Also new", the cover edition line spacing, Settings cover previews, the Quick looks fade at the right edge, the stories-left pill chevron, the vertical spine text on wide screens, the "Loading the full article" note going away once text shows, and the "Filed under" tags no longer showing "Read". Also check justified text breaks long words with hyphens on the phone.

## The Well on tablets (preview, 1.107)
Implemented, unverified on a tablet: The Well ("Pictures from your sites") now uses equal picture frames. Check at about 780, 1000 and 1100 px wide (or a real tablet), light and dark: no single tall portrait setting the row height, captions line up, and nothing runs past the screen edge. Expected: two columns (3:2) below 1000 px, with a wide first picture when there are three; three or four equal 4:5 columns from 1000 px.

## Preview batch 2 (1.107): quote link, reader page view, Why it matters
Implemented, checked in a desktop browser (touch tap, 820/1100/390 px) but not on a real device: (1) Daily quote: tap anywhere on the big quote; it opens that story. (2) Reader on a tablet with a photo story: page 1 shows the title block in the left column and the text in the right column from the top (no page that shows only a line or two at the bottom); the title block no longer spans the full width. (3) Stories that "do not load in full": FIXES.md 13 is probably the same bug as (2); if some stories still show only a short text, send the publisher names. (4) "Why it matters" box above the text: check light, dark, a high-contrast theme and Halcyon, at small and large reader text sizes; it must not show when the article starts with the same sentence.

## Reading sheet (FIXES 17, preview 1.107)
Implemented, checked in a desktop browser (390 and 820 px) but not on a real phone. In an open story: (1) tap the round "Aa" button at the bottom right or the "Aa" in the top bar: a short sheet slides up, the story stays visible above it. (2) Theme, Font, Focus reading, Text size, Reading style and Line spacing all change the story live and match Settings. (3) Close with the X, Escape, a swipe down on the top of the sheet, or by tapping the story. (4) With the mini-player showing, the button and sheet sit above it. (5) Large system text sizes: nothing clipped. (6) TalkBack: choices read as selected / not selected, focus returns to the button you used.

## Hide the side bar on tablets (FIXES 20, preview 1.107)
Implemented, checked in a desktop browser at 768, 900 and 1100 px but not on a real tablet or fold. Settings → Look → "Hide the side bar": Never (default), When held upright, or Always (phones are not affected). Rotating the tablet should hide or show it by itself in "In portrait or on a square screen" (also a fold opened flat). With it on, feeds, The Daily and All Stories use the whole screen. A small "Feeds" tab on the left edge, or a swipe from the left edge, slides your feeds over the page; Escape, the X, or tapping the page closes it. Check: portrait and landscape, a fold open and half-folded, Back gesture does not trap you, TalkBack cannot reach the hidden side bar, the Daily tab bar spans the full width.

Side bar update (FIXES 20): with the side bar hidden, the menu (three lines) button at the top left opens your feeds; the old "Feeds" edge tab is gone from list screens (it stays inside an open story). About 4 minutes after launch, on a big screen with the setting on Never, a one-time tip offers "Hide it" (sets Always). Check on a tablet and a fold: the tip does not appear over an open story or dialog, appears only once, and the hamburger is reachable with TalkBack ("Feeds", expanded / collapsed). Tapping the folder arrows, color dots or × buttons in the open side bar must NOT close it (only picking a feed or section does).

## Tablet room: bigger lead headline + Large print (FIXES 21, preview 1.107)
Must verify on a real tablet. (1) Headlines and Today: on a tablet 900 px or wider the lead story's headline and summary are larger (they grow with the width, and still follow Story card size). Check a long headline does not overflow the photo card, held sideways and upright, with the side bar shown and hidden. (2) Reader: the "Aa" sheet has a new Large print switch (text 24 px, roomier lines; turning it off restores your earlier size and spacing). Check pages do not cut text mid-line at Large print on a tablet and on a phone. (3) Very wide screens (1200 px and up): the reader's page area is capped so lines stay readable.

## Tablet list: two columns, whole-word summaries, tinted picture slot (FIXES 22, preview 1.107)
On a tablet / unfolded Fold, All Stories in list view (and the Daily rows): with the side bar hidden or on a screen about 900 px wide or more, rows should sit in two columns; section headings span both. Row summaries end in "…" instead of being cut mid-word. A row whose picture is slow or missing shows a tinted block (or the brand letter) instead of a blank gap. Check phones still show one column. Implemented, unverified on a real device (checked here only with sample stories at 1080 and 1440 px).
Part 2 (same entry): on a tablet, a story card with its picture above the headline (Wild Card, wire "Cards" view) has a picture no taller than about 170 px, and the pinned section name under the title bar is a slim strip. Check on the Fold that the pinned name is still readable and does not cover the first story. Unverified on a real device.


**Pure Black theme + side-bar tip (2026-10-19):** on the phone, pick Pure Black (Settings → Look, Essentials) and check the background is true black and text/labels are readable; with Follow my phone set to a light phone it should fall back to Light. On a tablet, tap "Hide it" in the one-time tip and check the side bar hides only in portrait.

**FIXES 23 (2026-10-19):** on the tablet, Compact: the first (lead) story should be a short row with a small picture, not a tall empty box. Medium/Large: no source name hidden under the picture of 3-up or feature cards (picture used to grow over it). Reproduced and checked with test pictures in a desktop browser at 800-1280 px; not seen on the real tablet yet.

**FIXES 24 + Aa buttons (2026-10-19):** (1) In a story, the ... menu starts with Text and appearance; it opens the same bottom sheet, and Esc/close returns focus to the ... button; there are no Aa buttons in the bar or floating. Check on the phone and tablet. (2) Tablets: a story alone at the end of a row stretches across it; wide pictures crop toward the top third; source names are 11.5 px. Checked in a desktop browser with test photos only.
**FIXES 25:** feed lead ("Cover story"/"The lead") picture should span the full column in Cards view on a wide tablet.

**FIXES 26:** on the tablet, a story with no picture beside picture stories (Cards view) shows a tinted tile with the source's first letter at the picture height. Seen only with test data in a desktop browser.

- **Near you "Added" bug (preview):** with one Google/Bing News place already in your feeds, search a different place in Add a feed → Near you. It must show "Add", not "Added to …". Old cause: `nUrl` dropped the `?q=` part, so all searches looked identical.

- **Bug-hunt fixes (preview):** (a) All Stories pills (Smart / Top stories / Quick reads / Deep reads) centered on tablets; (d) reader: "Loading the full article…" disappears once the text shows. Check on tablet and phone.

- **Empty space in short card rows (preview):** on a tablet/wide screen, a row with only two or three picture cards (strip or three-across block) now fills the width instead of leaving the right side blank. Check All Stories, Smart view.

- **Blank right half in Cards view (preview):** in All Stories → Smart with Cards view on a tablet, a short row of picture cards (2 or 3 cards) should now stretch across the width instead of sitting in the left half. Cause: the card rows used "as many 190 px columns as fit" and left empty columns. Now empty columns collapse (`auto-fit`) and the short-row filler also runs on these rows. Unverified: could not reproduce the exact row from the demo data.

- **Return-to-feed stall (preview):** with a big feed (hundreds of stories), opening a story and going back should no longer freeze for a moment. Cause: the 0.15 s cross-fade used on close took a snapshot of the whole page. It is now skipped when the feed has more than 40 cards on screen (small lists keep it). Check on the phone and in Chrome.

- **Return-to-feed, part 2 (preview):** read part of a story (scroll it a little), then go back to All Stories. The feed should not redraw or flicker; the story's small progress bar updates in place. Daily and other views still redraw as before.

- **No fade when closing a story (preview):** going back to the feed is now instant (no cross-fade between the story and the feed). Check there is no stutter or flash, in Chrome and on the phone.

- **Same place after going back (preview):** scroll a long way down All Stories, open a story, go back: the story that was at the top of the screen should be at the same spot again, even if pictures loaded or the list moved meanwhile. Scrolling yourself right after returning cancels the correction.

- **Cookie text in "Why it matters" (preview):** open the Ars Technica story "Disney found a way to buy Character.AI without buying its lawsuits": the box should no longer contain cookie-banner wording (or should not show at all).
- **Debug note (preview only):** add `?dbg=1` to the preview address to see a small black note each time the whole feed is rebuilt (count + time). Use it while opening/closing stories to see whether a rebuild happens when cards move.

- **List no longer jumps while scrolling (preview):** All Stories (Smart, Cards view): scroll down and back up, open stories and return. Cards should stay put (no sliding, no sudden jumps). Cause: lazily drawn cards (`content-visibility:auto`, guessed 260 px) changed height when they scrolled into view; turned off for `#grid.wire`. Watch for slower scrolling on the phone; if so, tell me.

- **Feed no longer squeezed while a story is open (preview):** on a mid-width window or tablet (roughly 500-900 px wide, not split view), open a story and go back: the list should return at the same height and spot with no flash. Cause: while reading, the sidebar column came back and squeezed the hidden feed to ~220 px, so the whole list re-wrapped twice. Now the feed keeps its width (`--mw`, `rdFreeze`).

- **Page turn (curl) like Google Play Books (preview, confirmed by the user on a tablet):** paper rolls over a moving fold, follows the finger, settles slowly after letting go, both directions. Still worth a check on a low-end phone and a long story with pictures (the plain flip is used for Reduce motion, 400+ pages, many pictures).

- **Page turn adapts to the device (preview, after 1.112):** in the APK the curl was not smooth on the user's tablet. Now it starts with fewer slices (20) and, if turns run under about 38 frames per second, it automatically uses fewer slices and finally the plain flip, remembered on the device. Check on the tablet: turn pages a few times (tap and drag); it should get smoother within a few turns. If it ends up on the plain flip, tell me: that means the tablet is too slow even for 8 slices and I need to cut the cost another way.

- **First page turn no longer hitches (preview):** in 1.114 the first one or two turns after opening a story dropped frames (up to 120 ms). The app now prepares the turn quietly about 3 seconds after a story opens. Open a story, wait a few seconds, then turn the page: the first turn should be as smooth as the later ones. Also check that turning pages in the first 3 seconds still works, and that nothing flickers while you read.

- **New page turn (1.116, confirmed by the user on a tablet in the browser):** check in the APK on the tablet and on a phone: turn pages by dragging slowly, flicking and tapping, both directions. Look for smooth frames (no tearing or blank patches), the bubble before the flip, and a soft landing. If it stutters on a phone, the app steps down to fewer slices automatically; tell me which phone.

## Audit batch 1 (unverified)
- Android: share a story/backup, wait 2+ days (or set the phone clock), confirm old files in cache/share are cleared.
- Reader: open a story that needs the full article; the loading line should count "trying source 2 of 4" etc.
- Feed with a video: video card still shows and plays.

## Audit batch 2 (unverified)
- Web: open /app/?view=today and /app/?view=brief once online; DevTools > Application > Cache shows one /app/ page, not one per shortcut. Go offline, reload a shortcut: app still opens.
- Restore a backup made with your own relay: relay address shows in the confirm box and is kept. A backup with an http:// relay: relay is dropped.

## Step 0 measurement (unverified)
- Use the app for a day (include a cold open in the morning, tap Daily stories straight away). Settings > Copy diagnostics, paste it: "Story opening" shows ready/stored/network counts and times; "Preload" shows netKind, connection.type and the cap. If connection.type is undefined and netKind is unknown, the Fold is capped at 6 stories.

## Share = link only (unverified)
- Android: open a story, Share. The share sheet should offer text "Read this in CyPress: https://cypressreader.com/s/..." and no picture. Send it to Discord/Messages/WhatsApp: the app's own preview should appear once, and the link should open the CyPress page with "Read the full story".

## Settings reorganized (unverified on device)
- Settings on phone and tablet: Feeds and Stories holds Manage feeds and Import or export feeds; Downloads and Storage holds Get stories ready, Wi-Fi, offline, back issues. Android: Morning pack and Pack time show under Downloads and Storage.
- Turn Story alerts, Morning pack, Keep back issues, Daily digest off: their extra rows (keywords/Test, Pack time/Open, days, edition) disappear; on: they return.
- Switches look like real switches, flip with a tap, and TalkBack still reads On/Off.
- Shorten shared links is under About and Help > More Options > Sharing.

## Search button stays pale (unverified)
- Halcyon (and other dark-header themes) on a phone: tap the magnifier, then the search box opens; the round button keeps the header color (no pale circle). Also check the other round header buttons after a tap.

## Daily section headers (unverified on device)
- Halcyon light and dark, phone and tablet: each Today section shows trees with a sun (morning) or moon (evening), the VOL/number/No. row, the big caps title and the small tagline. Check long titles wrap and nothing is clipped; check the "In this issue" links still jump to the right section.

## Theme renames and Light/dark tiles (unverified on device)
- Settings > Look and Layout: Light or dark is the first thing on the page. Tap Phone, Light, Dark, Theme: the app changes at once, the caption changes, TalkBack reads it as a selected option. Arrow keys move between tiles.
- Advanced Color Palettes > Plain & Simple: Cypress first, then Light & Dark, Black & White. Black & White + Dark gives a true black page.

## Settings search and folder switch (unverified on device)
- Settings search: type "make text bigger", "dark mode", "stop notifications at night", "too much mobile data", "add a website"; the right setting is first or near the top.
- Theme by folder: switch it off, the folder looks go away; switch it on, they return.

## Settings decluttering (unverified on device)
- Every Settings page: the common settings are visible, the rest are under Advanced. Open Advanced on Look, Reading, Feeds, Downloads: nothing is lost, Reset this section is at the bottom of it.
- Battery and Motion: Custom shows the seven detail switches; Full, Calm or Off hide them.
- Settings home: each row shows its current value.

## Settings audit pass (unverified on device)
- Downloads and Storage > Pictures: Show all / Save data on mobile / No pictures. No pictures hides every photo; the other two bring them back.
- Settings > Look > Advanced shows The Daily group (Trending strip, Must reads); Reading > Advanced shows Websites and Moving between stories; Feeds > Advanced shows Filtering, Adding sites, Kindle.

## Front page style and magazine group (unverified on device)
- Look > Advanced > Front page style: Varied, Classic, Quiet each change the front page at once (Varied is the default).
- Reading > Advanced > Magazine look: turn Magazine touches off; Photo pages and Feature spread disappear.

## Read-aloud sentence highlight (confirmed better on Samsung Z Fold; still try a second voice)
- Samsung Z Fold, Android app: open a story, Listen. The whole sentence being read is shaded and moves on to the next sentence when the voice does, on every voice you try (Samsung, Google). No single-word marker any more in the app.
- Check the voice does not sound choppier than before (each sentence is now its own spoken piece). The page should still scroll or turn by itself.
- Browser (Brave): same, after about two seconds if the voice sends no word timings.

## Cheap fixes from the diagnostics (unverified on device)
- Plugged in on Wi-Fi: Settings > Copy diagnostics shows "cap 60 of 40" (it was 40 of 40); stories prepared goes above 40.
- Open a story, switch apps for a minute, come back: Copy diagnostics no longer lists a huge wait for that open.
- After a refresh where many feeds failed at once (e.g. a Wi-Fi switch), most of them recover on their own about 15 seconds later.

## Stored-story budgets (unverified on device)
- Settings > Downloads and Storage: Keep 50 / 100 / 200 ready. Copy diagnostics shows "saved N · today N · rolling N of 100".
- Save a few stories, use the app for a day: saved and today never drop; rolling stays at the chosen number and the oldest (read ones first) are replaced.
- Turn on "Fill up only while charging": unplugged on Wi-Fi it stops at 50; plug in and it fills up to your number.

## Page turn: book curl in every story (unverified on device)
- Open a short story (about 5 pages) and a long, picture-heavy one in the same session and turn pages in both: every turn is the bowed book page, never the old flat card. Turn forward and back.
- Settings > Copy diagnostics shows a "Page turns" line, e.g. "strips default · flat here no · last 12: curl 16, curl 16 ...". If a story ever turns flat, the line says why (too heavy, slow on this story, reduced motion).
- A very heavy story should show fewer strips (e.g. "curl 8") rather than "flat". Send me the Page turns line if you still see a flat turn.

## Page 1: no empty column before the story text (unverified on device)
- Open a story with a picture and a "Why it matters" box on the Fold (two pages side by side): the story text starts right under the box on page 1, no big empty space and no need to turn the page first.
- Stories without a box, or where the box fits under the picture, still start the text at the top of the right column.

## All stories: New tag, magazine look, quote cards (unverified on device)
- Pull to refresh on All stories until the "N new stories - tap to load" pill appears, then tap it: the list re-ranks, scrolls to the top, and the stories that were waiting show a small "New" tag. Switching to another list clears the tags.
- Phone: lead cards are taller with a bigger headline; photo cards show more of the picture while the white text stays easy to read on bright photos; cards with no picture show a faint big initial behind the headline.
- Section headers (Last hour, This morning ...): story count sits above the title, a short bar under the line. Check the pinned header while scrolling is not too tall.
- A date heading ("Thursday, October 22") sits under the filter chips. Top stories / Quick reads / Deep reads keep their own headings.
- About every fifth card on the phone can be a centered quote card with "Read the story": tapping it opens the story. No quote cards on a tablet or wide window (by design). Look for double quote marks or odd cut-offs.
- Light, dark and a few themes (Cypress, Black & White) still look right with the above.

## Short sites read ahead first (unverified on device)
- Add a site whose feed only carries a few lines (a teaser feed), refresh, then on Wi-Fi leave the list open for a minute: its stories should open with the full text ready (no wait). Settings > Copy diagnostics slow-open counts should not get worse.
- Paywalled sites are not fetched ahead beyond what the app did before.

## Tracking tags removed from outgoing links; Short sites first switch (unverified on device)
- Open a story whose link has "?utm_source=..." (most newsletter-style feeds), then "Open in browser" / "Open the original story": the address in the browser has no utm_/fbclid tags. Share a story as a plain link (turn off short links): the same. Links with other parameters (a search term, an id) are left alone.
- Settings > Downloads and Storage: "Short sites first" is on by default, greyed out when "Get stories ready in advance" is Off, and has its own spoken name for a screen reader.

## Slow story: "Read it on the site" after 10 seconds (unverified on device)
- Open a story from a slow site (9to5google, lifehacker, The Atlantic were slow in the 2026-10-22 diagnostics). While "Loading the full article…" counts the seconds, after 10 seconds a "Read it on the site" button appears next to it. Tap it: the site opens inside the reader (same as the globe button), and the text version is still reachable with the same button.
- A story that loads in under 10 seconds never shows the button.

## Junk button hides a whole box (unverified on device)
- In a story that has a sign-up or promo box (a heading with a bullet list under it), long-press the heading, drag the handle down to the last bullet, then tap Junk: the whole box disappears ("Hidden. Thanks...") and Undo brings it back. Before this fix it said "Could not find that block" unless you selected a single bullet.
- Selecting most of the story and tapping Junk shows "That is too much of the story to hide" and hides nothing.

## Junk hides the whole box; many more sign-up phrases (unverified on device)
- Long-press ONE word inside a sign-up box (heading + bullets, a promo card) and tap Junk: the whole box goes in one step, Undo brings it back. A stray line in the middle of the story still hides just that line.
- Open stories from a few sites that have sign-up boxes, account prompts, "Already have an account?", "Thanks for reading ... Subscribe for free", Medium member boxes, "Listen on Spotify" rows: they should be gone. Tell me about any story paragraph that disappeared by mistake (send Settings, Junk log / the story link).

## Stubborn story: slow routes now start alongside the search (1.125, branch)
- Open a story from a site that blocks the app. Expect: no flash of the "Couldn't get the full story" message, one wait, then either the full story or the final message with a **Try again** button.
- Total wait should be shorter than before (was: syndication search up to 34 s, then 30 s more).
- At 16 s the loading note no longer says 'Blocked' with a Try again button while routes are still running; it says the app is still trying other routes. 'Try again' appears only when everything has failed.

## Feed descriptions, Preview and shorter setup (1.125, branch)
- Setup step 2: each topic shows 8 sites with a one-line description, the first 3 ticked, 'Show N more' below. 'Add the first 3' replaces 'Add all'. Check on a phone that two topics fit without a wall and that the tick circles stay readable.
- Add a feed > Browse topics: well-known sites show a description; 'Preview' (was 'How often does it post?') shows how often and the 3 latest headlines. Needs real network: try a site that blocks the app and confirm 'Couldn't check this one'.
- Not done: search box inside setup step 2; sites outside the first 8 of each topic have no description yet (they show their address).

- [ ] Setup step 2 search box: type a site name (e.g. "scientific"), tap a result, clear the box; the topic lists return with the pick kept and the count right. Check the keyboard doesn't cover results on a phone.

- [ ] Magazine pass 3 (side preview): Saved opens with a photo masthead and mixed layouts; a search/topic page has a photo masthead; lead photos show a small "Photo: name" only when the feed gives a credit; a big-number card appears in long lists; section underline colors vary. Check text is readable on every masthead photo, in light and dark themes.
- [ ] Settings > Magazine and digest > 'Photo magazine look (testing)': turning it off puts feed, folder, Saved and search pages back exactly as before (no photo cover, no full-width picture story, no colored bands, no credits, no big-number card); turning it on brings them back without restarting.
- [ ] Scroll a long feed or folder page at normal speed and fast: full-width picture stories should already show their photo as they come into view (no plain colored block, no pop, no flicker). Compare with the switch off.

- [ ] Daily return speed (2026-10-23): open a feed, then tap The Daily in the menu. The menu should close at once and the Daily appear right after, not 2 s later.
- [ ] Daily page cache (2026-10-23, side preview): feed -> The Daily should reopen fast with no cover flicker; mark a story read or pull to refresh, then reopen: it must show the change (fresh build); scroll to the bottom of a restored Daily: more sections must still load.
- [ ] Deep reads tile view (2026-10-23, side preview): All Stories > tiles > Deep reads shows a mix of big cards, pairs, strips, quotes and a number card, each with a minutes badge; check phone and tablet, and with Compact card size (old list).
- [ ] List view variety (2026-10-23, side preview): in list view every 9 rows has two big-picture rows and a quote row; check feeds, folders, All Stories tabs and Saved; Compact card size should stay plain rows; tap, star and keyboard still work on the new rows.
- [ ] List view pairs, day headings and picture fade-in (2026-10-24, side preview): two small pictures side by side every 5 rows, day headings in date-ordered lists, pictures easing in; check no empty gaps while pictures load and nothing looks stuck faded.

- [ ] (branch magazine) Cards with no picture: no faint letter, no empty top; ordinary ones have a bigger headline; the opener card shows the strongest sentence as a brass-edged pull-quote. Also summaries from feeds that run two paragraphs together now keep a space ("fraud. Federal"). Check Guardian/AP stories in All Stories, Cards and Columns views, light and dark.

- [ ] (branch magazine) Tidy-index list view: every list row is the same plain row (no big first row, no picture pairs, no quote rows), small spaced-caps day headings, the same day layout for All Stories/folders as other lists. Tile view unchanged. Check list view in All Stories, a folder, Daily tabs; light and dark.

- [ ] (branch magazine) List view: brass dot on stories you have not opened (read ones keep the existing dim); day headings show "4 of 12 read" once you have read some (counts update when the list redraws). Check dot alignment with the source line and the heading count on a phone, light and dark.

- [ ] (branch magazine) List view page: greeting line, "In this list" contents with numbered chapters (All = by folder; folder/smart folder = by feed; one feed = by section or day), "In brief" paragraph after the 4th story, Quick vs Long reads after the 10th. Only with 8+ stories; Saved/Search stay plain. Verified in a desktop browser with demo data (jump scroll, brief). Not verified: Quick/Long block (needs stories with reading times), real folders, phone feel, dark themes, screen reader on the contents buttons.

- [ ] (branch magazine) List page: tap a chapter heading to fold/unfold it (caret turns, In brief inside it folds too; fold state lasts until the app is closed). Check on phone: tap target size, screen reader says expanded/collapsed.

- [ ] Story banner (2026-10-24, branch magazine-sections): open the same long story (e.g. a Cloudflare blog post) 5 times; the "Couldn't get the full story / Trying another way" banner must NOT appear when the full text is shown. Daily "Also in this issue" must not repeat cover/front-page stories.

- [ ] "Teach CyPress" (2026-10-24, branch magazine-sections): Add > paste wondermind.com > Teach. Expect a list of real story headlines (not menu items), a feed named "Wondermind" with pictures, and no story marked new again on later refreshes. Needs the real phone/APK for fetch reliability; try one more site with no feed.

- [ ] Teach preview (2026-10-24): after Teach, a dialog shows the found stories with pictures and a "Put it in this folder" menu (with New folder). The feed must land in the folder you pick.

- [ ] Teach + sitemap (2026-10-24): teach emergencemagazine.org; the dialog shows "Also check the site's sitemap". After adding, the feed should list stories with real dates (not only the homepage ones), titles and pictures filling in over the first refreshes. Check the feed still loads when a site has no sitemap.

- [ ] Find feeds on the web (2026-10-24, branch): Add a feed > type a feeling or topic (happy, calm, birdwatching); the web results appear by themselves, and for topics the catalog covers (tech news, android) a "Search the web" row is offered. Expect "From the web" results with "about N stories a day · newest Xh ago" (filling in within a few seconds), quiet feeds marked "Quiet: no new stories since …". Needs the APK (Feedly has no browser access, the browser relays often fail). Check Add works from these rows and the privacy page line is present.

- [ ] Phone app no longer uses public relays (2026-10-24, branch): with a few slow or blocking sites, refresh on the APK. Feeds should still load straight from the sites (a blocked one may fall back to rss2json/news search as before). Check Settings > Feed health for any feed that loaded before and now fails.
- [ ] Web app offline (2026-10-24, branch): open the web app once, go offline, reopen: the app opens from the saved copy; on a very slow connection it opens within ~4 s.
- [ ] Feeds only re-download when changed (2026-10-24, branch): on the APK, refresh twice a minute apart (not pull-to-refresh). Feed health for a big site (e.g. a WordPress blog) should say "unchanged since the last check" on the second refresh and keep its stories, not show "Not loading". If every feed turns to "Not loading" after the second refresh, the Android HTTP bridge mishandles 304 replies: revert the conditional-request part of `fetchText1`.
- [ ] Pictures on mobile data (2026-10-24, branch): with Wi-Fi off and downloads set to Wi-Fi only, new stories without a picture in the feed stay without one (no full article pages fetched); on Wi-Fi they fill in as before.
- [ ] Undo for restore and reset (2026-10-24, branch): Settings > restore a backup, then tap Undo on "Backup restored": your previous feeds come back. Reset appearance, then Undo: theme and fonts return.
- [ ] Quiet feeds keep their own stories (2026-10-24, branch): a blog that posts monthly shows its real stories (Feed health: "Working (quiet lately)"), not news-search stand-ins.
- [ ] Podcast episode (Android): play an episode, lock the phone; the lock screen and notification shade show the episode title, feed and artwork, with play/pause and back 15 / forward 30 that work.
- [ ] Podcast episode: play for a minute, force-close the app, reopen the same episode; it offers the saved spot ("Resume at ...") and starts from there. At 95% the story turns to read.
- [ ] Podcast episode: start an episode while "Listen" (read aloud) is playing and the reverse; only one of them plays at a time.
- [ ] Translate story (Android Chrome and the app WebView): on a story in another language, ••• > Translate story translates in place (or offers Google Translate where the phone can't); "Show original" switches back; nothing is sent unless you choose Open.
- [ ] Share a link to CyPress (Android share sheet, from Chrome): the "Shared with CyPress" box asks "Follow this site" or "Save to read later" (plus Read it now / Cancel); keyboard focus lands in the box and returns after it closes.
- [ ] Save to read later, then offline: share or paste (Add a feed > Save a link to read later) an article link while online, wait a few seconds, turn on airplane mode, open Saved; the story shows its title and picture and opens with full text. A page that can't be read still saves with its title.
- [ ] Followed phrases alert (Android): add a phrase in Settings > Stories > Followed phrases, turn on Story alerts; when a new matching story arrives in the background one notification arrives, none during quiet hours, and the same story never alerts twice. In the open app a refresh shows one notice with the count.
- [ ] Launcher shortcuts (Android, D6): long-press the CyPress icon; three shortcuts show with green round icons: "Play the Daily" (opens the app and starts playing the Daily within a few seconds, also from a cold start), "Saved" (opens Saved stories) and "Search" (opens search with the keyboard). Each works both when the app was closed and when it was already open in the background. Drag one to the home screen and tap it.
- [ ] Share links open in the app (Android, D6). FIRST: copy the "Signing certificate SHA-256" from the "Build CyPress APK" job summary (or the release notes) into `docs/.well-known/assetlinks.json` (replace the REPLACE_WITH_... placeholder; keep the colons), push, and check https://cypressreader.com/.well-known/assetlinks.json shows it. Re-paste `docs/worker/share-worker.js` into Cloudflare (it adds the short-link lookup the app uses). Then install the new APK (Android checks the link at install), and in Android Settings > Apps > CyPress > Open by default, "cypressreader.com" shows as verified. Tap a short link (cypressreader.com/s/xxxxxxx) and a long one in a chat app: CyPress opens that story in its reader, not the browser. With the app already open, a second link opens the second story.
- [ ] Content Security Policy inside the APK (E2): after installing, the app starts normally (no blank page), feeds refresh, pictures and videos show (YouTube plays after the tap), the site view ("View the site in the app") still shows the site with its own styling, read aloud and the update check work, sharing works, and the Android back button still closes panels first (the Capacitor bridge is not blocked). If anything is blank, connect Chrome's chrome://inspect and look for "Refused to" messages in the console.
- [ ] Maskable icon (web app): in Chrome on Android, Install / Add to Home Screen from cypressreader.com/app/; the home-screen icon shows the whole tree crest inside the circle (nothing clipped). The Android APK icon is unchanged (its adaptive icon was already padded).
- [ ] Fold layout (2026-10-24, branch): inner screen upright shows a shorter first picture and a 2-column grid; held sideways, stories open beside the list (title hidden in the narrow list, tabs show where you are). Outer screen and phones unchanged.
- [ ] Teaser strips and topic codes (2026-10-24, branch): a story page with "FOR SUBSCRIBERS" headline links and pictures mid-article shows none of them; a MarketWatch story shows the feed summary, not "fcode|i/bks" lines.
- [ ] Fold sideways scrolls (2026-10-24, branch): open Fold held sideways, Reading style Automatic: a story opened beside the list scrolls; rotate upright and it turns pages again; choosing Pages keeps pages.
- [ ] Side by side in the APK (2026-10-24, branch; David: works in the browser, nothing happened in the app): open Fold, install the new APK, hold it sideways in the app: stories open beside the list, same as the browser. Rotate back upright and it returns to one column; rotate a few times in a row and it keeps up. If it still does nothing, open Settings > Developer and diagnostics > Copy support info and send the "Side by side:" line (it says the window size, whether it is allowed, and what the app thinks of the touch screen).

## Side by side diagnostics: "your setting" (2026-10-24)
- Copy support info "Side by side:" line now says `your setting automatic / switched on / switched off`. On the Fold (859x847) every condition passed but "allowed false": the stored setting was switched off. Check Settings > Look > Side-by-side reading is on.

## Side by side only when wider than tall (2026-10-24)
- Fold unfolded is ~859x847 either way. Side-by-side now needs width > height even when the setting is switched on. Check: held sideways = list + story; held upright = single column; rotate back and forth, open a story in each.

## Side-by-side reading is now a 3-way choice (2026-10-24)
- Settings > Look > Side-by-side reading: Only when held sideways (default) / Always on big screens / Off. Old on/off values carry over (on = Always, off = Off). Check each on the Fold, upright and sideways; "Side by side:" line names `your setting`.

## Sideways test uses the whole display (2026-10-24)
- 1.138: "Only when held sideways" was on upright too: window 859x847 is wider than tall in both holds (status bar). Now uses screen.width vs screen.height. Check upright = single column, sideways = split. If still wrong, send the Side by side line (shows `display WxH sideways true/false orientation`) from BOTH holds.

## David's phone report (2026-10-24, 1.139)
- Web feed search "happy": works. Page-turn overlap on the Fold: not seen again. Photo-less monogram/blank tiles: not seen yet (nothing to judge).

## Jumping pictures while scrolling All Stories (2026-10-24, screen recording)
- Seen: a row of four small cards collapses into one full-width card mid-scroll and the rest reflow below (looks like a full redraw, or late picture sizes). Not reproducible in the browser demo. Added a "Jumps:" line to Copy support info (shifts over 0.02 with the card class, plus the last redraw times and whether a finger was down). After a scroll that jumps, send the line.

## Startup lag on All Stories + "Slowest frames" line (2026-10-24, 1.139)
- Reopening on All Stories: 39 s of 72 s blocked (56 busy spells, longest 3.1 s), no feeds failing. Added a "Slowest frames:" line to Copy support info (Chrome long-animation-frame: duration, uptime second, the script position that held it up, "mostly drawing" if rendering). After a laggy start, copy support info and send it; map the `@position` to a symbol with `node scripts/export-context.js`.

## Jumps line now names who redrew (2026-10-24, after 1.141)
- 1.141 report: 5 redraws in 16 s, one "while touching" at 16 s, only 1 layout shift. `quietRender` already refuses to redraw when scrolled past 500 px, so another caller redraws. The Jumps line now shows `by <callers> top <scroll px>` per redraw. Send it after a jumpy scroll.

## Hold back redraws while scrolling deep (2026-10-24, after 1.142)
- 1.142 report: redraws "while touching" at 57,000-64,000 px down, one after a feed fetch (2.25 s freeze at readText). `render()` now skips itself when main scrolled within 600 ms, is past 500 px, S.sel unchanged and no story open; counted as "redraws held back while scrolling" in the Jumps line. Check: scroll All Stories far down while a refresh runs: cards should not jump; new stories show on the next visit to the top. If something looks stale after scrolling (a read mark, a setting), tell me.

## Saves and read marks no longer redraw the list (2026-10-24, after 1.143)
- 1.143 report: longest freeze 0.8 s (was 2.7 s); 8 redraws in 9 s at the top, unnamed caller = `setTimeout(render,280)` after a swipe, and the star tap also called `render()`. Now `cardMarks(a)` updates just that card (read look, star). Still redraws in the Saved list or when read stories are hidden. Check: swipe a card to save / mark read, tap a star, in All Stories, the Daily and Saved: the card changes, nothing else moves; unsaving in Saved removes the card; with "hide read" on, a read card goes away.

## Background refresh waits while a story is open (2026-10-24, after 1.144)
- 1.144 report: opening a story at 11 s (843 ms), then at 12 s `quietRender` rebuilt the whole list behind it (3.2 s, scrolled 83,159 px): "stories load slow, pages flip slow". quietRender's deep-scroll guard excluded an open reader. Now it re-checks every 2 s until the story is closed, then applies the usual rules. Check: open stories right after launch / during a refresh: they open and turn pages without stalls; after closing, the list is where you left it; new stories appear when you are back near the top.

## 1.146 — calmer first minute (implemented, unverified on device)
- Open the app on the Fold, scroll and open stories in the first minute: no 1 s freezes. Copy support info: "Busy spells" total should be well under 1.145's 20 s in 55 s; Slowest frames now say "mostly script" or "mostly drawing" correctly.
- Jumps line: each shift should end with "after …" naming what happened just before it.

## 1.147 — fast redraws far down a list (implemented, unverified on device)
- Scroll far down All Stories on the Fold, then tap All in the menu: should take well under 1 s (1.146: 5.2 s). The list should come back at the same spot.
- Tablet layout: the last row of a grid still has no empty columns (fixOrph now applies its widening in one go).

- **Reader loading lines (preview, 2026-10-24):** open a story from a slow site. Under "Loading the full article…" six shimmering lines now show until the text arrives, then vanish. Check that they don't upset the page count in the paged reader and that they stop with Reduce motion / Battery saver. Desktop browser only so far.

## Polish pass build (2026-10-25, preview; rollback branch backup/pre-polish-2026-10-25)
Implemented, checked in a desktop browser only. On a real phone check:
- **Widgets (A1-A5):** picker previews on Android 12+ (old PNG previews on 11-); Top Story is 3x2, resizes, photo cropped not stretched, scrim keeps the headline readable, chevrons flip stories and the "1 / 5" counter; no-photo card light + dark; corners follow the phone's radius; Headlines row counts at 2/3/4/5 cells tall, read rows dimmed, "Updating…" state; Ticker brass bar and "12 MIN" ages; dark mode turns the mark brass; serif fonts on Samsung and Pixel.
- **Themed icon (K4/M4):** Android 13+ with Themed icons on: tinted, centered, not clipped.
- **Exports (H):** grouped contents, story openers and pull quotes in the Kindle app and on an e-ink Kindle; drop cap falls back cleanly on an older Kindle; Letter paper on a US phone, A4 elsewhere; "Your notes" page.
- **Themes/covers (B, N, M):** vector mark crisp and brass in the drawer; theme rail swipe; Aurora's slow light line on a low-end phone; cold start without Orbitron/Cormorant in the startup font link.
- **Settings/menus (D, J, I, E3):** brass tab bar slide; 48 px hit areas by thumb (drawer, toast Undo, switches); whole-row tap on About rows; Add a site against real sites; Android back closes the "On this phone" sheet and the Add dialog.
- **Reader (F, G, J5):** page-turn tick vibration; Slide drag feel; hold on the page edge shows pages left; Android back closes the story sheet; drop cap + small caps in the Cypress font; "Follow <site>" from a full-coverage story.

- **Polish build, round 2 (K1-K7, E1/E2/E5):** edition seal on every edition ending (5 AM / 5 PM copy); ribbon drop and reduce motion; "I have 10 minutes" order with page turns; seasonal touches; Almanac "Share as image" via the Android share sheet; tidy-up card with real quiet/failing sites (failing = 4 failed loads in a row); Android back with these sheets open; light top bar with the system status bar; card shadows while scrolling on a low-end phone; The Daily redraw on the Fold (desktop 46 ms vs 27 ms before the build).

## Text and appearance sheet restyle (2026-10-25, unverified on device)
- Open a story, "..." > Text. Sheet should match the "..." sheet: brass grip, theme tiles wrap (no sideways scroll), segmented choices with brass-tinted selection. Check phone portrait, Fold, light and dark themes.

## Review-fix batch after Muse's 1.148 review (2026-10-25, unverified on device)
- One reading-time rule (`readMin` now = `minsOf`): the same story should show the same minutes in Daily, Brief, Sunday, lists and Saved; totals still change when full text replaces an excerpt.
- Loader line only moves forward (source 1, 2, 3...) while two routes run at once.
- Reader text: `_italic_`, `__bold__` and bold-with-link render as styling, not as literal characters (reader-service text).
- "Mark all as read" hidden on Saved, History, Stats. Saved footer says "All caught up" when every story is read.
- Settings search finds theme names (Cypress, Sepia, Midnight, Aurora...).

## Dynamic theme fixes (2026-10-25, unverified on device)
- Dynamic + "Match my phone": switch the phone between dark and light while the app is open (and after leaving it in the background). Page tint, tab bar and accent should change to day or night colors at once, not stay dark.
- Tapping Dynamic from another theme should respond immediately (no long freeze); light/dark switches still show the sunrise/sunset animation.

## Dynamic switch speed and stronger tint (2026-10-25, unverified on device)
- Settings > Light, dark or Dynamic: with Dynamic on, tap Light/Dark (and Match my phone): colors should change at once with no sunrise/sunset animation; the list redraws after Settings closes (diagnostics should no longer show a 1-2 s `set.onclick` frame).
- Dynamic page and tab tint is richer (dark and light): check text stays readable on Daily and All Stories.

## On-device Translate story (ML Kit) (2026-10-25, NOT built or run: native code unverified)
- New `native/extras/CyTranslatePlugin.java` (+ ML Kit `translate` and `language-id` gradle lines added/removed with the extras in `scripts/prepare_android.py`). Only compiled against stand-in stubs here; the first real compile is the APK workflow. If the extras fail to compile, look here first.
- On the phone: open a story in another language > "..." > Translate. Expect: no Google Translate dialog; text translates in place; "Show original" restores. First time per language downloads a pack (~30 MB): test once on Wi-Fi, once offline (expect the "Couldn't download the language pack" toast). Check APK size grew only a few MB.

## Translated headlines (2026-10-25, unverified on device; Android app only)
- Feed settings (open a feed's settings) > "Translate headlines": Follow my setting / Translate / Don't translate. Settings > Feeds and Stories > "Translate headlines": Only feeds I choose / Every feed in another language. Neither row shows in a browser.
- Turn it on for a German feed: on-screen headlines and short descriptions should switch to English a moment after they appear (a few at a time while scrolling), with a small "TRANSLATED" tag; tapping a story opens it with the original headline and the story already translated (no Google pop-up). Remembered after a restart (`folio-trc`).
- Each translated card gets a small globe badge with the language (e.g. DE) next to the site name; tapping it flips that card between translation and original without opening the story.
- Check scrolling stays smooth with a translated feed on screen, and that English stories in the same feed are left alone.

## 1.154 Widgets "Couldn't add widget" fix — implemented, unverified; needs a real phone
Cause (by reading, not by running): the widget layouts used a plain `<View>`, which Android refuses to build inside a widget, so all three previews and the widgets themselves failed. Now every one is an `<ImageView>`.
- [ ] Remove old CyPress widgets, open the widget list: Top Story, Headlines and Ticker show their previews (no "Couldn't add widget").
- [ ] Add each one: it fills in with stories, the arrows and taps work.

## Translate story: headline, "Why it matters" and picture captions — implemented, unverified (phone only)
- [ ] Open a foreign-language story, tap Translate: the big headline, the "Why it matters" box and the picture caption ("Foto: …") now translate along with the text; "Original" brings all of them back. Check a long translated headline still fits the page.

## 1.155 Widgets redesign — implemented, unverified; real phone only (could not be compiled here: if the build fails, read the compile error in native/extras/CyWidgets.java first)
- [ ] Top Story turns to the next story by itself about every 7 seconds; the two round arrows (top right) turn it at once; tapping the photo opens that story.
- [ ] Ticker (4x1): a picture tile on the left (brass bar when no picture), turns every 6 seconds; tap opens the story.
- [ ] Headlines at 4x2: two rows, small pictures; make it taller (4x3 or more): a big photo story on top plus rows with larger pictures.
- [ ] Light and dark phone, Z Fold folded and unfolded. Widget picker previews are still the old stills (not redrawn yet).

- [ ] Settings > Feeds and Stories > Translate headlines, and a site's own settings: the small print says it uses Google's translator built into the app and may be wrong.

## "New stories" pill: calmer — implemented, unverified
- [ ] Leave the app open on All Stories during an automatic refresh: no pill while sites are still loading; one pill with the full count when it is done.
- [ ] Tap the pill: no new pill for 30 minutes, however many stories arrive. After 30 minutes the next screen redraw shows one again.
- [ ] Pull to refresh: no pill afterwards (the new stories are simply in the list); the 30-minute clock restarts.

## 1.156 Widgets: StackView Card Deck & Editorial Fallbacks — implemented, unverified (real phone)
- [ ] **Top Story Card Stack (StackView)**: Swipe up/down on the cards to flick through stories. Check that tapping any card deep-links directly into the reader for that article.
- [ ] **Editorial Typography Fallbacks**: For stories without images in Top Story, Headlines, and Ticker, verify the celestial brass sun ornament (`cy_w_sun.xml`) renders crisp and centered alongside the serif display headline and kicker.
- [ ] **Full-Bleed Imagery & Scrim**: For stories with photos, verify the dark gradient scrim (`#0c2619`) keeps the white kicker and headline readable.
- [ ] **Memory & Performance**: Verify widgets never crash or drop out due to `TransactionTooLargeException` (downsampled to 480px max bound in `RGB_565`).
- [ ] **Headlines Broadsheet**: On Android 12+ (API 31+), verify Headlines scrolls smoothly via `ListView` and tapping any row opens that specific story.

## 1.157 Widgets Overhaul (4x3 Magazine Spread, AdapterViewFlipper, Zero Borders) — implemented, unverified (real phone)
- [ ] **4x3 Magazine Spread (`cy_widget_list`)**: Drop onto home screen. Verify top 60% is full-bleed hero with scrim and 2–3 line serif title. Verify bottom 40% cream card renders two secondary story briefs side-by-side with high-contrast timestamps.
- [ ] **Top Story Deck (`cy_widget_top`)**: Verify cards fill 100% edge-to-edge with flat transitions (AdapterViewFlipper). Tap arrows top-right to flip immediately. Tap card to deep-link directly into article reader.
- [ ] **No Double Borders**: Verify widgets have zero nested inner card frames; content touches the launcher's widget corner radius directly.
- [ ] **Typographic Fallbacks**: For articles lacking photos, verify the rich dark-forest card (`#0c2619`) with antique brass sun ornament and cream serif type renders centered and clean.
- [ ] **Compact Ticker (`cy_widget_ticker`)**: Verify 4x1 tile has high-contrast brass kickers (`#8c6b2d`) on cream and flips smoothly between headlines.

## 1.158 Top Story Widget Inflation Fix (AdapterViewFlipper & CyWidgetService) — implemented, unverified (real phone)
- [ ] **Top Story Launcher Placement (`cy_widget_top`)**: Drag "CyPress Top Story" onto the home screen from the widget picker. Confirm it places immediately without "Couldn't add widget" error.
- [ ] **Item Streaming via RemoteViewsService**: Confirm cards cycle smoothly in `AdapterViewFlipper` without IPC `TransactionTooLargeException` crashes.
- [ ] **Empty & Error Graceful Fallback**: With no cached headlines or flight mode, confirm widget displays clean fallback "Open CyPress to load your stories" with brass sun ornament instead of failing.
- [ ] **Deep-Linking**: Tap card in `AdapterViewFlipper` to confirm fill-in intent properly navigates into the story in CyPress Reader.
- [ ] **Logcat Diagnostics**: Filter logcat by `CyWidget` tag; verify zero unhandled exceptions or inflation failures.

## 1.159 Top Story widget simplified (plain ViewFlipper) — implemented, unverified (real phone)
- [x] **Placement** (verified by David, flips on its own): Drag "CyPress Top Story" onto the home screen. Confirm no "Couldn't add widget" error (1.158 still failed).
- [ ] **Flipping**: Pages cycle; only page 1 has a photo (Binder size limit). Tap opens the story in CyPress Reader.
- [ ] **If it STILL fails**: set `android:previewLayout` aside; if still failing, ship Top Story as the empty-state layout only.

## 1.160 Richer haptics (native VibrationEffect.Composition) — implemented, unverified (real phone, API 30+)
- [ ] **Save pluck**: save a story; feel a soft two-step tick. Unsave: no buzz. Settings > Haptics off: silence.
- [ ] **Edition finished**: reach the end of an edition; feel a deeper double thump.
- [ ] **Pull-to-refresh tick** and swipe-hit tick still fire (lighter than before).
- [ ] **Fallback**: on an older/cheap-motor phone the old single buzz still plays; no error in logcat.
- [ ] **1.160 Long-read drop cap**: open a long story (feature length) in Classic and a dark theme; the big first letter is an accent color, readable, and the page count/turn is unchanged. Briefs and regular stories unchanged.
- [ ] **1.160 Predictive back (Android 14+)**: open a story, start a slow back swipe from the edge: the story shrinks/rounds under your finger; release early and it springs back; complete the swipe and it closes. Check a dialog (Settings) and the Daily root still behave. Page turns in the reader must be unaffected. Android 13 and older: normal back, no animation.
- [ ] **1.160 Back issues**: use the Daily on two different editions/days; at the end of The Daily a "Back issues" list shows earlier editions (collapsible); tapping a headline opens that story. Storage stays small (titles/links only). Keyboard: summary toggles with Enter/Space.

## Green top bar blank-page fix (after 1.160)
- [ ] Settings → Green top bar ON: page keeps stories and top bar (was blank: html class `gtop` clashed with the photo viewer's `.gtop` style; now `gbar`). Toggle off and on again; force close and reopen.

## Theme switch lag + Coast/Newsprint (preview, unversioned)
- Settings > Theme: tapping a theme (and light/dark) should feel instant; the list redraws after Settings closes. Before: 1.6-2 s freezes on the Fold.
- Coast light looks bluer; Dim, Midnight, Light & Dark, Pure Black are gone and anyone who had one now sees Cypress.

## After 1.162 fixes (preview, unverified on phone)
- Page turns: the learned strip count (`cy_curl`) used to reset on every version bump, so the first turns after an update ran 16 strips; now kept across updates. Fold: after updating, page flips should feel as smooth as before; check the "Page turns" line in diagnostics.
- Newsprint: Daily cover quote and intro lines were bold because only Playfair 700/900 was loaded; 400 and italic 400 now added. Check the cover quote reads light and italic.

## Return-to-feed scroll snap (branch claude/theme-six-handoff-96ztep, unverified)
- All Stories, tiles, scroll far, open a story, go back, start scrolling: your place should stay put (no jump). Check on the Fold too.

## Late-story redraw jumps (branch claude/theme-six-handoff-96ztep, unverified)
- Scroll down a feed while it is refreshing; new stories arriving should not move the card you are looking at.

## Tap to go to top (branch claude/theme-six-handoff-96ztep, unverified)
- Scroll down in All Stories, tap the title bar (not a button): list glides to the top. Open the side menu and tap All Stories again: also top.

## Lock-screen / shade player: time + jump buttons (branch claude/theme-six-handoff-96ztep, unverified, needs APK)
- Read a story or play the Daily aloud, pull down the shade: elapsed/total bar shows; buttons for Back 15 s and Forward 30 s appear (Android 13+ shows them beside prev/next) and move the reading. Bar stays in step after pause/resume and speed changes.

## Notification time left (post-1.165, branch only)
- Read something aloud with the screen locked / shade down: the notification header should show a live countdown (time left) while playing, and "N min left" while paused. Updates when you skip, seek, pause or change speed. Java not compiled here: check the APK build.

## Read aloud skips extras (post-1.165, branch only)
- Open a story that has "The story so far" timeline, "Why it matters" and the related deck: read aloud should speak only the headline and article text, never those blocks.

## Player pause + skip buttons (post-1.167, branch only)
- Read one story aloud: notification/lock-screen player shows NO skip back/forward when nothing is queued; Pause then Play work from the shade and lock screen; time still shows.
- Read a Daily/Digest queue: skip buttons appear (next from the first story, previous from the second on).

## Post-1.168 (branch only): notification Back 15 / Forward 30 buttons
Implemented, unverified: Back 15 and Forward 30 are now real notification buttons (were session-only custom actions, vanished once skip buttons were hidden). Order: [Prev] Back15 Play/Pause Fwd30 [Next] Stop. Check they show with and without a queue, and that each seeks.

## Deep-check fixes (branch only)
Implemented, unverified: Back issues around midnight (no duplicate evening issue), no list redraw while a story is open, offline start smoother, 1.169 widget/notification crash guards. Check: read at 11 PM then open Back issues after midnight.

## Post-1.169 fixes (unbumped, branch claude/theme-six-handoff-96ztep)
- Widgets: tap "Tap to refresh" with no network or no feeds: "Updating…" must clear on its own. A broken widget must not blank the others.
- Restart the phone / update the app: widgets come back (boot receiver now runs async).
- Translate privacy line: check the merged APK manifest / a network capture for ML Kit usage pings (disclosed on privacy.html now).
- Back issues storage is slimmer (160-char text cap): old stories still open from Back issues.
- Reading position is dropped least-recently-read first; streak counts across a daylight-saving change.
- Tiles grid: no layout hitch on redraw (`fixOrph` now skipped when the grid is unchanged); last odd card still widens to fill the row.

## 1.171 scroll-jump gate + place keeper
- All Stories/Daily tiles: scroll far down, stop on a headline for 10+ s while feeds refresh: the page must not move. Then scroll to top: new stories appear.
- Change a setting (card size, theme) while scrolled down: it still applies right away.
- If a jump still happens, send the "Jumps:" line from Copy support info right after.

## Post-1.171 (branch, unbumped)
- Scroll far down the Daily/All Stories, tap the already-highlighted docked tab: no redraw, no jump. Tap a different docked tab: switches and starts at the top. Unverified on phone.
- Light mode in Coast, Newsprint and Sepia Rosewood: the Daily cover is the dark plate with light, readable text (headline, wordmark, edition line). Cypress light: "From the margin · …" labels readable (dark brass).
- After any scroll jump, Copy support info: the Jumps line now ends with "moved by code …" naming what moved the page.
- Long hard fling (coasting several seconds) on a feed: you stay where the fling stops (place keeper no longer pulls you back).
- Headlines tab: "HEADLINES" masthead in the theme's serif (capitals); "In this issue" shows count and minutes only when there is a single section. Black & White: Daily cover white in light, pure black (no green) in dark.
- 1.172: app opens with correct fonts in airplane mode (fresh install); scrolling and tab switching feel faster on the Fold; pull-to-refresh still hides the title while the tree shows; Columns view headline sizes unchanged; Daily cover number sits inside the frame; plate-theme covers use theme accent for quote bar/underline.
- Post-1.172 (branch): side bar in every theme, light and dark: logo stands out (Aurora light = deep green, not mint; Coast/Newsprint/Rosewood dark = badge with accent ring); active row clearly tinted with 4 px bar.
- Post-1.172 (branch): side-bar logo is the same size in every theme (badge themes: tree fills the badge); "CyPress" not clipped. App icon: brass-gold tree on Cypress green (launcher square/round, themed icon, Android 12 splash green), web install icon too.

- [ ] Aurora then any other theme (Settings > themes): page background must change right away, no restart needed (repaint nudge + html color follows --bg).

- [ ] 1.174 jump check: if the feed jumps, Copy support info right after; the "unexplained" entry now says how far apart scroll events were and whether the page height changed (long gap = a fling during a freeze; height change = layout shift above you).

- [ ] 1.174 look batch (phone): brass marker on the active bottom tab; round letter chip for the source on cards and rows (no more site icons on cards); a site's feed: photo cards show the headline under the photo with a progress ring; "In brief" as a timeline (3+ stories) or one quiet line (1-2); top-bar title appears as the big masthead scrolls away; thin brass line under the top bar grows as you read; loading blocks tinted brass; "New since ..." header after 1 h away is a brass hairline marker.

- [ ] 1.174 part 2 (phone): All Stories heading + section headers look the same everywhere; source names readable on photos; faint big letter on cards without a photo; side menu "Your sites"; Settings page chips, full descriptions, switches; two-line drop cap and highlights at story end; tip toast disappears when you scroll.

## Post-1.174 fixes from David's 2026-10-27 recording (implemented, unverified on phone)
- Excerpts keep spaces between paragraphs ("El-Sayed. Sign up", not "El-SayedSign up"); only newly fetched stories show it.
- A lead card whose photo fails to load no longer shows "Photo: …" over its label; Guardian credits read "Photo: Kent Nishimura/…" (not "Photo: graph:").
- Plain (no-photo) cream cards keep a readable source label (cream label only on photo cards).
- All Stories: the top bar title stays hidden while the big "All Stories" heading is on screen and fades in once it scrolls away. The site-feed reading hairline (`fpBar`, was shadowed by the reader's `fpSync`) now works too.
- Side menu "Your sites" list removed (make a folder instead).
- Cypress theme: the active bottom tab (The Daily/All/Saved/Search) is brass (label, marker and a soft brass pill behind the icon), not deeper green.
- Shrinking title: on All Stories and a site's feed, the big heading shrinks and fades as it scrolls under the top bar, and the bar's title rises in as it disappears (scroll-linked CSS, off with reduced motion; older WebViews just swap the titles).
- 1.175 batch (motion only at Motion "full", off in battery saver/reduced motion): cards rise in when you switch views; lead photo slow zoom + gentle parallax; no-photo lead card has a slowly drifting brass glow; reader drop cap fills with ink; Cypress top bar is frosted glass; bottom-tab highlight slides between tabs; All Stories section labels stick under the top bar; quote cards on every no-photo card with a quote; monthly backup reminder toast (first one 30 days after this update).
- Drop cap is a real two-line letter again in page and scroll mode (1.174's `initial-letter` was ignored on the span and left a tiny letter).
- Developing row (under the All Stories heading) restyled to match: brass label and counts, hairline chips in the headline font, soft red ping.
- Hands-free reading: story ... menu → "Hands-free reading". Scroll mode scrolls at your reading speed; page mode turns a page every (words on page ÷ reading speed). Any tap, key or swipe in the story stops it (toast says on/off).
- Developing dot is round and its ping is no longer cut off. Headlines ticker restyled like the showroom (green line, brass "Latest" label, sans type, brass times). Folder/site story columns: brass time, short accent rule, lighter 3-line summary.

- [ ] (2026-10-27, unbumped 1.175) Hands-free speed pill: start Hands-free reading from the ... menu; − / + changes speed (0.5× to 3×, remembered) without stopping; × stops; tapping the story still stops. Check both scrolling and page-turn reading, and that the pill clears the bottom gesture bar.
- [ ] (2026-10-27) Hands-free speeds are separate for scrolling and page turns; 1× in both should match your own reading pace (long stories no longer flip too fast); scrolling should glide smoothly.
- [ ] (2026-10-27) Feed page: as the big title shrinks on scroll, the top bar title grows in at the same pace (they swap places).
- [ ] (2026-10-27) Save a story, go offline, open it from Saved: text and photos come from the device (including stories that opened in Site view).
- [ ] (2026-10-27) Story bar: tapping the site name opens that site's page. Hands-free hint shows only the first 3 times and sits above the speed pill.
- [ ] (2026-10-27) Feed lead with no photo: plain band gone on single sites; folders show the source site's name on its pattern.
- [ ] (2026-10-27) All Stories new arrivals: no floating pill. Top bar shows a small second line "N new stories" (tap loads), and a quiet note "N new stories since you opened this · Show" sits at the top of the list. Check it fits beside the top bar icons on the phone.
- [ ] 2026-10-27 (unbumped, branch -4xsmdy): "N new stories" line under the top bar title fits on a narrow phone (shows "N new" under 380px wide, never runs under the icons). Daily cover big issue number counts up from 0 on first open, not on every refresh; no animation with reduced motion.
- [ ] 2026-10-27 (unbumped, -4xsmdy): All Stories: while scrolling, only the slim section label line pins under the top bar, same as in folders (no big duplicate). On a phone with a small display size, story rows after "New since" are full-width lines, not squeezed side-by-side pairs.

## 1.176 picks (2026-10-28, implemented, unverified on phone)
- Read aloud: with "Read photo captions" Off (default), the voice skips the text under pictures; On reads them.
- Daily: "Surprise me" button beside Catch me up opens a random unread story (last 5 days).
- Settings > Bigger buttons: round buttons, bottom tabs, switches and hands-free controls grow; nothing overlaps on the phone or Fold.
- Manage feeds: header counts "N you never open"; such a site's row adds "You haven't opened any of its latest stories".
- Feed settings: "Reading voice" and "Reading speed" for one site; read one of its stories aloud and hear the change; other sites keep the main setting.
- Saved: a story read and saved over 30 days ago moves to the "Archive" chip; All count drops; a fully archived list shows "All caught up".
- Daily cover headline rises in word by word the first time each day (not with Reduce motion or battery saver); no clipped letters (g, y, p).
- Appearance > Tinted photos: photos in feed, cover and story turn two-tone in the theme colors; switching theme recolors them.
- Review fixes: a site with its own reading speed keeps the word highlight in step; side menu Saved count leaves out archived stories; tinted photos in Dynamic/Light/Sepia Rosewood use the ink and page colors (not one flat color); headline rise carries on smoothly if stories finish loading mid-animation.

## After 1.176 (recording 2026-10-28, preview, unverified on phone)
- Fling to the end of a folder (Science): the top bar stays put, no gap above the "Earlier" label, no stretch bounce. Pull-to-refresh at the top still works.
- Fast fling through All Stories: no blank white or flat-color cards, no jump as cards fill in; scrolling stays smooth on the Fold.

## Picks after 1.177 (preview, unverified on phone)
- All Stories: a card from the last 6 hours whose headline names a Developing topic shows a small red dot before its headline (pulses only with micro motion on).
- Open the app after 3+ days away: about 10 s later a "Welcome back" note offers Catch me up; tapping it opens the catch-up.

## Car mode (unbumped, after 1.178)
- [ ] Start a listen, open the player, tap the car button: player fills the screen, only headline, time and big Previous / Play / Next show.
- [ ] Screen stays on while Car mode is up; after closing the player it can sleep again (unless a story is open).
- [ ] Car mode is remembered next time the player opens; tapping the car button again goes back to the normal player.

## Feed scroll stutter (unbumped, after 1.178)
- [ ] All Stories / a folder in Cards view: fling, pause a second, fling again: no hitch on the second fling (it used to freeze 140-180 ms writing the whole library).
- [ ] Scroll partway down a folder, swipe the app away to the background, reopen: you're back at the same story.
- [ ] Fast flings down a long folder in Cards view: cards further down arrive drawn with photos (no white boxes, page doesn't lurch as it grows).
- [ ] Tapping folders in the side bar feels quicker (was ~320 ms on the Fold).

## 1.180 picks
- [ ] Open Fold held upright, Side-by-side = "When held sideways or on a square screen": stories open beside the list.
- [ ] Finish a story with related reads: heading reads "More on <names>" when they share names, else "Related reads".
- [ ] A story other sites also covered: the "other sources cover this" box shows up to two of their headlines.
- [ ] The Daily cover: soft seasonal color at the top, "· Fall" in the edition line (Seasonal touches on).
- [ ] Saturday/Sunday: The Daily's long-read section is called "Weekend Reads" with up to 9 stories.

## Side by side "Sideways" setting (1.181)
- [ ] Open Fold, setting Sideways: held upright = one column (no side by side); turned sideways = list + story side by side. Setting Always: side by side both ways.

## Feed scroll glide + stutter (1.182)
- [ ] Fold, All stories, tiles, 300+ cards: flick down hard and lift: the feed keeps gliding and slows down (no dead stop). Run Settings > scroll check: fixOrph should be gone from "scripts that ran longest"; long tasks well under 65.
- [ ] Swipe a card left/right still saves / marks read, and a slightly diagonal swipe doesn't scroll the page.
- [ ] Car mode: switch to another app and back: screen still stays on.
- [ ] Developing red dot appears on matching cards far down the feed.

## Scroll jitter round 2 (1.183)
- [ ] Fold, a feed with 300+ cards: scroll steadily for 20+ seconds on Wi-Fi while charging (read-ahead on): no hitches mid-scroll. Scroll check: no `extract`/`parse` jobs while recording, no "pressSync" in scripts.

## Scroll jitter round 3 (unreleased, after 1.183) — implemented, unverified on phone
- David's 1.183 scroll check on the Fold: `fixOrph` 2.1 s + picture-drift observer 1.4 s of 4.5 s script. `fixOrph` now skips sections whose cards haven't changed (it re-measured every section's last row each pass: 627 → 27 ms headless, 400 stories); drift observer measures in the next frame instead of inside its callback.
- Check on the Fold (859x847, All Stories, tiles, Medium): long flings feel smooth; run a scroll check and compare against 1.183 (17% frames over 20 ms, worst 492 ms). On a tablet-width grid, the last row of each section still fills all columns; big-card pictures still drift.

## Scroll round 4 (1.185) — implemented, unverified
- With a feed set to Translate: scroll a long feed fast on the Fold; translated headlines still appear as cards come into view, no hitches at scroll pauses.
- Pictures in cards are already there when they scroll in; big opener pictures still show without a blank flash.

## Scroll round 5 (1.186) — implemented, unverified
- Fold, tiles, Medium cards, pictures on: scroll a long feed fast; photos scroll in without hitches (scroll check: compare 1.185, 1% slow frames, worst 183 ms).
- Card photos don't flicker or flash when a card is tapped, zooms, or fades in.

## Scroll round 6 (1.187) — implemented, unverified
- In the Android app with all your feeds, scroll a long feed with short pauses for a minute; no hitches when you start scrolling again after a pause (scroll check: compare 1.186, 4% slow frames, worst 167 ms).
- Stories still get saved for offline reading (the "ready" mark appears) after you stop scrolling; a pull-to-refresh still finishes promptly.

## Scroll round 7 (1.189, 2026-10-28) — implemented, unverified
- Fling up and down a feed with photos many times: no catch when photos come back into view (card photos no longer decode "sync").
- Scroll for 30+ s while feeds refresh: the list never redraws mid-scroll; new stories appear after you stop for ~3 s.
- Short pauses (1-2 s) between flings: next fling starts smoothly (background saves/reading wait for a 3 s rest).

## Scroll round 8 (1.190, 2026-10-28) — implemented, unverified
- Fast fling down All (tiles, medium) on the open Fold: fewer stalls as photos come in; only the big lead/hero/tall cards' photos drift, all others hold still.
- Scroll check report now has a "photos loaded" line (publisher photo sizes vs the size shown); send it so we know if big photos are the remaining cost.

## Scroll round 9 (1.191, 2026-10-28) — implemented, unverified
- Feed with a huge publisher photo (the 8087px one in f:g17907000001694): the photo appears a moment after its card, then scrolling past it repeatedly never stalls. Scroll check "photos loaded" largest should read 1600px or less.
- Photos still look sharp on the open Fold (shrunk copies are 1600px wide).

## Photo shrink round 2 (after 1.191, unverified)
- Every feed photo wider than 1600px is now shrunk (was only >6 MP). Fold scroll check: "photos loaded" largest should read ≤1600px; slow frames (1.191: 1%, worst 92 ms) should drop. Watch for a brief blank on big photos as they load.

## Scroll round 11 (after 1.192, unverified)
- Photo shrinking (resize + re-encode) now runs in a background worker; the pre-loading pass for upcoming pictures waits for a scroll pause. All Stories fling check: 1.192 had 19% slow frames, shrink 1341 ms of main-thread script, aheadImgs 392 ms.

## Lighter feed photos + decode ahead (branch -9l5kv7, preview, unverified)
- [ ] All Stories: fast first fling on the Fold has fewer hiccups than 1.194; photos still look sharp (not blurry) in tiles, lead cards and list rows; opening a story still shows the full photo.
- 1.195 result: lighter photos looked less detailed on the Fold -> reverted on branch (1600 cap again); jump-catcher fix confirmed (onscroll 0 ms).

## 1.197 picks (implemented, unverified on a phone)
- Long-press a card: the menu shows the story's first 3 lines above the actions, and still fits on screen (short phones, landscape).
- Settings > Appearance > Quick setup: Simple / Magazine / Power each change the front page; Undo restores; the matching one stays highlighted.
- Fold side by side: the top bar shows the page title once you scroll (no logo there now); the topic chips fade at the right edge; the empty right side is the page color, not white.
- Evening (after 7 pm): top and bottom bars look close to the page color, no gray slab.
- A site's settings: the report card line reads sensibly for a busy site and a quiet one.
- Restore a backup: the confirm shows the counts and date.
- List rows (The Daily, Next up): green offline mark at the bottom right doesn't cover "Also from".

## All Stories lazy cards (branch after 1.198, unverified on phone)
- [x] Fold 1.199 (David): scrolling feels better; small stutter only on the FIRST pass through All Stories, gone after
- [x] Open a story deep in All Stories, go back: same place in the list
- [x] Blank patches only at the fastest possible fling (accepted)

## Photo unpacking ahead (branch after 1.199, unverified on phone)
- [ ] Fold: fresh open, All Stories, one normal-speed pass down: first-pass stutter less than 1.199? Scroll check: fewer slow frames with script 0 / big "before drawing"
- [ ] Memory: js heap and app stays smooth after a long scroll (decoded photos cost memory)
- [x] 1.200 decode-ahead VERIFIED 2026-10-29 (18% vs 31%, heap flat): fresh open -> All Stories first pass, scroll check vs 1.199 (31% frames >20 ms); watch memory. Keep if better, remove `_dc` decode in cvAhead if worse.

## Deep pass (2026-10-29, branch claude/theme-six-handoff-dc0p8i) — implemented, unverified on a phone
- [ ] Widgets still appear in the widget picker; refresh / next / previous taps still work after the update (P1 secret token; old widgets redraw on their next update)
- [ ] Erase everything: two questions; after erase, widgets are empty, no alerts fire, app starts fresh (B13)
- [ ] Background refresh with 61+ sites: later sites show up in widget / pack over a few hours (B12)
- [ ] Battery Saver on: no background story downloads, effects calm down (P7); phone hotspot counts as metered with "Only on Wi-Fi"
- [ ] Open a .opml file from Files with "Open with CyPress": import preview appears (D3)
- [ ] App updates still download from GitHub (P5 HTTPS-only rule for our own addresses)
- [ ] Reader: Tight/Normal/Roomy and Large print visibly change line spacing on the folded phone (B1); text slider to 34 px; Letter spacing row; Find in story in the ... menu; tap a highlight to edit; "Listen from here" in the selection bar; Resume offer on a half-read story in Pages mode
- [ ] All Stories: Sections button and tapping the pinned name; fold a section; Offline tab; back-to-top arrow; tap current bottom tab glides up
- [ ] Look: site names readable on Cards-view picture cards (B2); solid docked tab bar (B3); shorter top story unfolded (V2); folded Daily cover (V4); Headlines top (V6)
- [ ] V7 uneven card pairs: send a screenshot if you still see a hole under a short card

## Focus highlight on first tap (2026-10-29, branch claude/theme-six-handoff-dc0p8i) — implemented, unverified on a phone
- [ ] Open a story, tap the eye right away: one paragraph on screen is highlighted (also after the full story finishes loading), without scrolling or hands-free reading
- [ ] One "Focus" button in the reader bar (the eye "Hide" button is gone): tap it, only the Focus button stays in the top corner; tap it again (or the middle of the page) to bring the controls back; open another story: focus is off
- [ ] Focus highlight is calmer: a small scroll keeps the same paragraph lit; it moves on only once you're clearly past it (short paragraphs too)
- [ ] In focus mode a "Hands-free" play button sits next to Focus: tap starts hands-free reading (highlight follows), tap again stops; a tap on the story still stops it
- [ ] The Hands-free button shows play when stopped and pause while running
- [ ] Hands-free and Focus corner buttons look equally solid; 1x hands-free speed feels the same on a photo-heavy story and a plain one; focus highlight starts near the middle of the screen (a bit above), not near the top

## Round 3 (2026-10-29, unreleased, branch claude/theme-six-handoff-dc0p8i) — implemented, unverified on phone
- [ ] Daily tabs (Today/Edition/Brief/Week): tap feels quicker; slide-in still goes the right way; docked tab bar sits right under the header after scrolling down
- [ ] All Stories > Sections near the top of the page: every section is listed; picking a far one loads it and lands on its heading (no overshoot); scrolling during the jump is not pulled back
- [ ] Tablet/Fold, story open: the side "Feeds" tab opens the feeds panel; feeds in it can be tapped; tapping outside closes it and the story stays
- [ ] Listen to a story: a "− 1.0× + ×" pill shows at the bottom in the theme's colors; − / + change the voice speed within a moment; × stops reading; hands-free still shows its own speed pill
- [ ] Android: Listen to a long story, switch to another app for 10+ minutes: reading carries on to the end of the story (was cutting off after a few minutes). Also note whether it moves on to the next story when "Play next story" is on
- [ ] Play Daily: says "Welcome to Cypress Reader…", then reads; while it plays, tabs, side bar and buttons all respond; note how long it takes to start

## Round 4 (2026-10-29, branch claude/theme-six-handoff-dc0p8i, unreleased) — implemented, unverified on phone
- [ ] Play the Daily, minimize the app (screen off too) for 10+ minutes: it moves on to story 2, 3, … without reopening the app. Cause fixed: between stories the app stopped its media notification (`ttsStop` wrapper → `mediaStop`), Android then froze the minimized app and refused to restart the notification from the background. Now it stays "playing" through the handoff (`DIG.on&&R.digOpen`).
- [ ] Same for Up Next (story ends, the next one starts while minimized).
- [ ] The notification's Stop button still stops the Daily and removes the notification; the end of the Daily / Up Next removes it.
- [ ] (round 4b) David 2026-10-29 on 1.205: after story 1 the notification timer kept running with no sound; opening the app restarted the next story from its start = the page was frozen (native speech kept going, the page that hands over to the next story did not run). Cause: a minimized web view's page is marked hidden and frozen when it isn't audible (our keep-alive track is pure silence). Fix: `MainActivity.onStop` re-tells the web view it is visible while `CyMediaService.isPlaying()` (re-checked every 15 s; told GONE again once playback stops). Check: Daily runs through 3+ stories minimized and with the screen off; after it ends, battery use while minimized looks normal.
- [ ] (round 4c) Halcyon, a single site's page, Cards view: story photos' rounded corners sit inside rounded card corners (no square white corners). Fix: `#grid .card.cu` radius 0 → 15px.

## 1.206 picks (implemented, unverified on phone)
- In brief (a site's page): only stories of 3 min or less; tinted panel; photo strip on top (2+ photos); round photo or site initial on each line; site name in its color. Tap a strip square or a line: opens the story.
- Photos load as a soft blur in their main color, then sharpen (no flicker on scroll-back).
- Tall portrait photos crop toward the top; tiny/blurry photos show two-tone in the card's color.
- Dark themes: feed photos slightly dimmed (setting "dim photos" on). Faint edge on photos over white.
- Black & White: cards, photos and In brief all square.
- Reader: caption/credit line under the top photo when the site sends one; hidden when the same photo repeats in the story.
- P12: a story whose feed lists 2+ photos shows "+N photos" on its card; in the reader, "See all N photos" under the top photo opens the photo viewer; swipe through, Back/Escape closes and returns focus.
- In brief photo strip: a story whose photo fails to load leaves no blank square (its line shows the site initial instead).
- Photo crops: with no face found (Android has no face finder), wide card crops never aim below the upper third; heads should no longer be cut off (re-measured once after update).

## Big photos in pages mode (branch, unreleased)
- [ ] Fold open, pages mode: a wide photo runs across BOTH pages at the top; headline + boxes under it on the left, story text starts under it on the right; page 2 has no gap. Tall photos stay whole on the left page.
- [ ] Fold cover / phone, pages mode: top photo is the same size as in scroll mode (no longer the short strip).
- [ ] Settings > story layout still lets you pick the other photo layouts.
- [ ] Page turns (phone and Fold open): the lifting page never gets cut off at the top/bottom of the screen or along a straight line; still curls like a page.
- [ ] Page turn on the Fold (Brave): the photo curls WITH the page (no flat photo floating over the curl), no parts of the page vanishing mid-turn.
- [ ] Two-page view, short story (1 min): story text starts on page 1, right side, under the photo (not on page 2).

## Smooth page turn pass (branch, unreleased)
- [ ] Fold open + closed, app and Brave: tap-turn starts moving instantly (no pause), runs smooth to the end; swipe-drag turn follows the finger smoothly.
- [ ] Turn quickly several pages in a row: still smooth (the next turn is prepared ~1 s after each page lands).
- [ ] Reading a page: nothing faint/ghosted visible over the text (the prepared turn sits invisibly on top); links and text selection still work.
- [ ] Page-edge stack on the right hides during a turn and comes back after.

## Page-turn prep in small steps (branch claude/theme-six-handoff-dakini, unreleased)
- [ ] Open a long story in pages mode, turn several pages quickly in a row: no stall after a turn lands; the next tap starts moving at once.
- [ ] Scroll/tap the toolbar right after a turn: nothing feels stuck.
- [ ] (same branch) Open several stories in pages mode on the phone and the Fold: opens feel quicker; the first page, the photo and the "Why it matters" box look the same as before; turning pages still looks the same mid-story and near the end.
- [ ] With Hands-free on in a story, a toast still sits above the Hands-free bar; on a narrow phone the bottom tabs hide while a story is open.
- [ ] TalkBack in a story in pages mode: the page is read once (the hidden copies of the next page turn are skipped), and swiping through links never lands on invisible ones.

## Story open restyle (branch claude/theme-six-handoff-h8bzos, 2026-10-30, unreleased)
- [ ] Open stories from the Daily and All Stories on the phone and the Fold: opens feel a touch quicker; on the Fold the sidebar still slides away while reading and the "Feeds" tab still brings it back; closing returns to the same spot.
- [ ] Open a story from the Daily's "listen" / background read-aloud (the hidden reader): the sidebar and feed stay as they were.
- [ ] (same branch, after 1.213) Switch between the Daily, All Stories and a site's feed: the cards still rise in gently on each switch; the top bar title and masthead look the same; switching feels a touch quicker.

## List view redesign + blur fix (branch claude/theme-six-handoff-h8bzos, preview 421dd63, unreleased)
- [x] (VERIFIED phone video 1.216) List view (All Stories, a site's feed): photos are sharp, not blurred.
- [ ] Rows: time on a thin line at the left with the star under it; headline first; square photo on the right; a faint tint of the photo's color behind the row (Halcyon and Halcyon Dark).
- [x] (VERIFIED phone video 1.216) Every fifth story is a big-photo feature with a small time label on the photo; Compact size keeps plain rows.
- [ ] Tap the star in a row still saves; tapping the row opens the story; TalkBack reads each row once (time label is hidden from it).

## Column view picks C2+C4+C6 (2026-10-30, shipped 1.215; layout VERIFIED in phone video 1.216; Halcyon Dark not seen)
- All Stories > Columns: each time group's columns open with a short photo + 2-line summary (one per column); other stories with a photo show a small square on the right; group names sit in a filled band with the count and Mark read. Check Halcyon light/dark, phone portrait + Fold open, Large print (1 column: the second photo just follows in order).

## In brief photo row stretches (2026-10-30, branch -2djkfy, unverified on phone)
- [x] (VERIFIED on phone 2026-10-30, 1.216) Daily "In brief · The short ones": with 3 or 2 photos the row is filled edge to edge (same height as with 4); if photos fail to load the rest widen; if all fail the row disappears, leaving no empty band.

## List tint, no star, a photo atop every column, cover re-fit (2026-10-30, branch -2djkfy, phone video 2026-10-30: list tint + no star + photo atop every column VERIFIED; TalkBack, Halcyon Dark, cover re-fit still open)
- [ ] List view: each row with a photo has a visible wash of the photo's color fading in from the right (it never showed in 1.215: the row divider rule hid it); the thin divider under each row is still there. No star in any list row; Save still works from the story's menu.
- [ ] Columns view on the Fold (3 columns): every column opens with a photo + 2-line summary, including the middle one; 2 columns: both do. Columns stay roughly even in height; rotating re-deals cleanly.
- [ ] Open a story from the Daily and come back: the cover headline does not jump or re-size.

## 1.218 tablet cover headline + full-width list features (2026-10-30, branch -2djkfy, unverified on phone)
- Fold unfolded, Halcyon, the Daily: the cover headline is large (not tiny print); the photo band above it is a bit shorter but still a real picture
- Fold unfolded, All Stories in List view: big-photo feature stories run across both columns, with no empty gap beside them
- A story that only partly loads says "Partial story"

## 1.219 text-only stories share a row; Fold close re-fit (2026-10-30, branch -2djkfy, unverified on phone)
- Fold, All Stories in Cards view: stories without a photo sit two or three to a line, with no tall, half-empty full-width card
- Open the app on the inner screen (List, Columns and Cards in turn), close the Fold: within about a second the feed on the cover screen looks like the normal phone layout (no wide-screen spacing, no squeezed columns, no oversized headlines). Then unfold again and check the reverse
- Same with a story open when you close the Fold, then go back to the feed

## 1.220 no half-empty rows after new stories load (2026-10-30, branch -2djkfy, unverified on phone)
- Fold unfolded, All Stories in Cards view: load new stories (tap the new-stories button or refresh). The rows in "Last hour" fill the full width, with no blank half next to two small cards

## 1.221 no empty third column on a site or folder page (2026-10-30, branch -mmwk66, unverified on phone)
- Fold unfolded, open a single site or a folder in Cards view and scroll: every row of short text headlines (time and minutes on top, no photo) fills the full width; two stories split it in half, one story spans it

## 1.222 final-pass fixes (2026-10-31, branch -mmwk66, unverified on phone)
- [ ] Fin page: hardware Back returns to the Daily (F-02), and the Undo message after "Mark all as read" is visible above it (F-01)
- [ ] Read aloud: "Best available" voice speaks with a real voice; no "No voices" message when voices exist (R-05, R-08)
- [ ] The Daily's photo cover shows the photo full-bleed behind the headline, in Halcyon and Newsprint, day and night (T-01); photo not drawn twice on the phone (T-02)
- [ ] Reader header: is there faint ghost text behind it? (T-08, left unfixed until confirmed on a phone)
- [ ] Add a site: pasted address defaults to Unfiled, or to the folder currently open (F-11)

## 1.223 ghost text + stray line (implemented, unverified on phone)
- [ ] Open any long story in pages mode, wait 3 seconds: no faint words from the next page behind the text or the "Why it matters" box (T-08)
- [ ] Turn pages right after opening: the first turn is still smooth (the pre-built turn is now fully hidden instead of 1% visible)
- [ ] Ars Technica story: no "Size Small Standard Large Width" line at the end

## Polish review preview (branch claude/polish-review, side preview https://cypressreader.github.io/cypress-preview/polish/app/) — implemented, unverified on phone
- [ ] Reader: bar shows Back · site · "N min" (total on page 1, then "N min left") · More; 2px progress rule under the bar; Save/Listen hidden under 760px (they are in More)
- [ ] Reader: kicker is site · section; byline is name · "Today, 3:21 PM" or "Oct 30" · N min; credit under the photo; dek instead of the "Why it matters" box; At a glance only when it adds rows
- [ ] Reader: doubled lead photo hidden when the body repeats it (Ars Technica story); left-aligned text on narrow columns; ending page with Next up photo, Save/Share/Open site, related; controls hide after the first page turn, middle tap shows them 3 s
- [ ] Story options sheet: Save/Share/Listen/Text, then "This story", "Send to", "<site>" groups; long-press a card for the compact menu
- [ ] The Daily: section heads without ornament/Vol. line and with "N stories · M min"; photo cards photo-above/text-below except the lead; list rows with age right and brass unread dot; sticky tab strip (no docked clone); tips as inline cards; skeleton shaped like the page; phone cover masthead band (F-01, from an unverified partial commit: check the cover closely)
- [ ] Side bar = folders with "N unread"; Saved tab has Saved · Highlights · History header; "Your reading stats" on the Daily back cover
- [ ] Settings: six tiles home; Aa sheet "Reading" with presets; theme picker in families; Add a site preview with last 3 headlines and "Follow <site>"
- [ ] Speed: story opens with feed text + pale bars + hairline; slow-site note at 8 s with "Read the preview"; text-only prefetch on mobile data; fonts load as files (headline face preload)
- [ ] Look: brass only for kicker/drop cap/links in Cypress dark; labels ≥ 11px; toasts above the bottom bar, 3 s / 6 s
