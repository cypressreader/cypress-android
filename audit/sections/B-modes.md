# Section B: the whole app, mode by mode (CyPress 1.231, production web build)
Tested with Playwright Chromium, phone 390x844 and fold 884x1000, new browser contexts, "Skip for now" on the welcome. Shots in audit/shots/B/.
Method notes: "remove all sites" was done by clearing S.feeds in the page (UI removal of one site was tested separately). Headless Chromium has 0 speech voices.

## Numbers
| Measure | Result |
|---|---|
| Fresh browser, welcome screen visible | 1.7 s (0.8 s warm) |
| Tap "Skip for now" to first story visible (Daily cover) | 3.9-4.0 s (feeds fetched live) |
| Cold total (open link to first story) | 4.9-5.9 s |
| Return visit (cached) to first story | 0.13 s |
| Story open, tap to text visible | 93-253 ms (first open 253, then ~95) |
| Mode switches (tap to 2 frames drawn) | Headlines 90, Brief 82, Sunday 117, Today 95, All 59, Saved 48, The Daily 51 ms |
No performance finding: all fast. First launch 4 s with nothing on screen but the welcome gone is the only slow part (see B3).

## Verdict
No store-blockers found in modes. Core flows work: Daily (Today/Headlines/Brief/Sunday), All Stories, reader with paging, highlights + find in story, search, add site by address and by words, move site, remove site (with confirm), saved, empty states, offline reading, fold layout. Findings below are polish and trust issues.

### B1 Daily "four views" tip repeats on every screen
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: Brief, Sunday, All Stories, Saved, Search all show "Tip: The Daily has four views. Today is your personal front page, Brief is a quick list, Headlines..." until Dismiss is pressed.
- Now: A tip about The Daily appears on top of Saved and Search, where it makes no sense, and pushes content down (Saved empty state sits under it).
- Should: Show it once, only inside The Daily, and drop it after the first mode switch.
- Shots: B/B-Brief-phone-day.png, B/B-Saved-phone-day.png, B/B-Search-phone-day.png

### B2 Numbers disagree between modes
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: Headlines masthead says "96 NEW TODAY, 6 SOURCES"; Brief says "82 new stories, 6 sources"; All Stories says "152 stories, 150 unread"; badges say 99+.
- Now: A reader who compares them sees three different "new today" counts.
- Should: Same definition and count wherever "new today" appears, or different words for different things.
- Shots: B/B-Headlines-phone-day.png, B/B-Brief-phone-day.png

### B3 Slow to a first story on a brand-new install, nothing to look at
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: welcome "Skip for now" then ~4 s before the first cover (network fetch of ~10 sites).
- Now: after Skip the Daily shows for about 4 s with the cover filling in; welcome tiles are labeled EXAMPLES with an empty ring icon in front of each label (looks like a missing logo).
- Should: Show a short "Getting your stories" state; give the ring a real icon or remove it.
- Shots: B/B-start-phone-day.png (also scratchpad welcome: ring icons in example tiles)

### B4 Saving a story from the phone reader is hidden inside "More"
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: reader bar on phone width shows only Back, full screen, More. Save/Share/Listen are inside More (fold width shows Save/Listen/More directly). Empty Saved screen says "Tap the star on any story".
- Now: a beginner looks for the star the empty state promised and does not find it on the reader bar. After Save the More sheet stays open and I saw no confirmation toast.
- Should: Star on the reader bar (or reword the empty state to "Open a story, tap More, then Save"); close the sheet or show "Saved" after saving.
- Shots: B/B-readermore-phone-day.png, B/B-reader-phone-day.png, B/B-savemenu-phone-day.png

### B5 Bad site address takes about 30 seconds to fail, error uses "feed" wording
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: Add a site, type http://notarealsite-zzzqq.example/feed.xml, Add site. "Checking this site..." ~8 s; "No feed found yet" ~16 s; final error ~30 s: "We reached for that address but couldn't find a feed on it... Try the site's feed link directly (it often ends in /feed or .xml)".
- Now: long wait, then a message with technical talk a beginner cannot act on.
- Should: Give up faster (about 10 s) and say "We couldn't find stories at that address. Check the spelling, or try the site's name instead."
- Shots: B/B-addbroken-phone-day.png

### B6 Offline: no visible offline notice, and Add a site says "No feed found yet"
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: setOffline(true). All Stories and reader keep working from saved stories (good, text loaded, 3,392 characters). No offline banner visible on the list. Add a site with npr.org shows "No feed found yet. You can still try Add."
- Now: the add dialog blames the address when the real cause is no connection.
- Should: "You're offline. Connect and try again." in Add a site, and a small offline note on the list.
- Shots: B/B-offline-phone-day.png, B/B-offlineadd-phone-day.png, B/B-offlinereader-phone-day.png

### B7 Following a site from search creates a real folder named "Unfiled", listed twice in the picker
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED (fresh context: folders go from Tech, News to Tech, News, Unfiled with the new site inside)
- Where: Add a site, type npr.org, Follow. `followSite` calls `quickAdd(url,title,c||'Other')` (www/index.html ~11392-11397) and the category came through as "Unfiled". The site settings Folder menu then lists "Unfiled" twice (the real folder and the built-in no-folder choice).
- Should: A site with no category goes to no folder; never create a folder named Unfiled.
- Shots: B/B-afteradd-phone-day.png, B/B-movesite-phone-day.png

### B8 No way to make a new folder from a site's settings or the sidebar
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: Folders can only be created while adding a site (Name and folder, New folder name). The Folder menu in a site's settings (right-click or long-press the site) lists only existing folders. Moving a site works (tested, moved NPR into News).
- Should: Add "New folder..." to that menu, or a visible "New folder" in the sidebar.
- Shots: B/B-newfolder-phone-day.png, B/B-namefolder-phone-day.png

### B9 "Site" and "feed" used interchangeably
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: "Add a site" and "Remove feed" (www/index.html:5025 Feed settings), "Your feeds", "Manage feeds", "Import or export your feeds file", "Teach CyPress a site that has no feed", "Order of feeds and folders". The words RSS and rail do not appear in text I read on screen.
- Should: One word. "Site" matches the main button.
- Shots: B/B-holdmenu-phone-day.png

### B10 Find in story counter is clipped
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: reader, More, Find in story. "1 of 4" runs under the clear (x) button and reads "Iof 4".
- Shots: B/B-findinstory-phone-day.png

### B11 Highlight pop-up: unclear words and lingering toast
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: selecting text shows colored dots (no words), Note, Listen from here, Copy, Share, Follow, Junk. "Junk" and "Follow" are unclear at a glance. A "Highlighted" toast stays over the next paragraph for several seconds.
- Works: highlight saved, found again under Highlights ("1 highlight", Export as Markdown, Share as image, Remove).
- Shots: B/B-select-phone-day.png, B/B-highlight-phone-day.png, B/B-highlights-phone-day.png

### B12 Search from Saved silently searches only Saved
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: opening Search while on Saved gave "No matches. Nothing matches 'ukraine'" (scope chips All / Unread / Saved are there but Saved is preselected; header title shrinks to "Sa..."). From All Stories the same word gives 12 stories from 3 sites. No-results text is good: "Try a shorter word, or a different one." with "Clear the search".
- Should: Start on All unless the person chose Saved.
- Shots: B/B-search-ukraine-phone-day.png, B/B-search-none-phone-day.png, B/B-saved-phone-day.png

### B13 Sunday issue on a new install is nearly empty
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: Sunday tab: "Not enough long reads yet", week card "<1 min spent reading", all zeros. Explains itself but is the least inviting first view.
- Shots: B/B-Sunday-phone-day.png

### B14 Read aloud: only the failure path testable here
- Status: NEW · Severity: Should-fix (verify) · Verified: NEEDS-PHONE
- Where: reader More, Listen (and Brief "Listen", "Listen from here"). Headless Chromium has 0 voices; the app shows a toast "No voices are installed, so reading aloud isn't available. Add one in your system settings (search for 'text to speech')." The Play/Pause/Stop controls exist (labels: Play or pause, Pause reading aloud, Stop hands-free reading, Playback settings) but stayed hidden. Start, pause, stop, lock-screen and sleep timer need a phone.
- Shots: B/B-listen-phone-day.png

### B15 Third-party script blocked by the page policy on load
- Status: NEW · Severity: Should-fix (check) · Verified: CONFIRMED (console)
- Where: every load: "Loading the script 'https://static.cloudflareinsights.com/beacon.min.js/...' violates the following Content Security Policy" plus one 401 and one 404 resource error. Looks like Cloudflare analytics auto-injected on the web host. The policy blocks it, but it should not be requested at all on a no-tracking product (and the web copy is not the APK).
- Should: Turn Cloudflare Web Analytics off for the host; confirm the 401/404 URLs.

### B16 Widgets (native only)
- Status: NEW · Severity: n/a · Verified: NEEDS-PHONE (CODE read)
- Where: native/extras/AndroidManifest.extras.xml registers three receivers: CyWidgetProvider (4x3, rotating big story photos with back/forward arrows, resizable), CyWidgetListProvider (top story plus next headlines), CyWidgetTickerProvider (breaking stories one at a time). Descriptions in res/values/cy_widget_strings.xml are plain language. Need a phone for preview image, refresh, tap-through, empty widget before first open.

### B17 Themes and fold width
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: Mono and Black & White themes put "Headlines" and "Brief" nearly touching in the Daily tab row. Themes (mono, eink, typewriter, solar, cyber, halcyon, sage) otherwise render a readable cover. Fold width: permanent sidebar, reader becomes two columns with Save/Listen/More on the bar, no horizontal scroll (page width = window width), night mode correct.
- Shots: B/B-daily-fold-day.png, B/B-allstories-fold-day.png, B/B-reader-fold-day.png, B/B-daily-fold-night.png, B/B-reader-phone-night.png (if present), B/B-daily-phone-night.png

### Passed
- Empty states: no sites ("No sites yet / Add a few sites you like..." with Add a site and Pick sites), no saved ("Nothing saved yet" with Browse today's stories), no search results.
- Pluralization seen: "1 highlight", "2 saved", "12 stories", "10 new stories", "2 STORIES": all correct. No "1 stories" found.
- Remove site asks "Remove 'NPR Topics: News'? You can undo this right after or add it back later." (good).
- Reader paging works by keyboard and by tapping the page edges (tap on a picture opens a gallery).
