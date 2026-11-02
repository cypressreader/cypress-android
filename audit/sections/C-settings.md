# Section C - Settings, one by one (production 1.231, web stamp 2026.11.02f)

Method: opened Settings in the live build (390x844 phone, fresh context), walked all 8 hub pages with every "Advanced" fold open, dumped every `.line` row from the DOM (127 rows), then clicked every on-page toggle (60 of 63) and changed every select (23), comparing the saved state `S`, `<html>`/`<body>` classes and the page DOM before and after, and restoring each. Code read: `www/index.html` 10430-10770 (SET_PAGES/SET_GROUPS/setBuild/setReset/startFresh), 12871 (nFeat), 13808 (isOn), 16735-16760 (native-only block). Raw data: `audit/shots/C/dump.json`, `toggles.json`, `dump2.json`.

Structure: hub `#sethome` (Your CyPress card, search box, 9 rows: Look, Reading, The Daily, Listen, Stories & loading, Sites & backup, Motion and battery, Keyboard shortcuts, About CyPress) then `#setpane` pages. Each page has a main part and an "Advanced · N" fold. The old single-scroll Settings (`#setlegacy`, hidden) still holds 23 toggles, 28 retired rows whose saved state is still read. There is no `S.setall` toggle; "Advanced" is the only advanced switch.

## Counts
- Visible rows on web: 127 (63 toggles, 23 selects, 2 sliders, ~11 segmented groups, rest action buttons/rows). Not counted: theme rail, font grid, Aa sheet, search.
- Native-only rows (not rendered on web, NEEDS-PHONE, code at 16735-16760): Story alerts, Alert keywords, Try it, Quiet hours + From/To, Digest notice, Lock-screen headline, Morning pack, Pack time, Open pack, Home-screen widget, Translate headlines (CyTR), App icon = about 13.
- Retired/hidden rows with live state: 28 (SET_HIDE).
- Dead (visible): 0. Dead (hidden, key written/read nowhere): `sfx`, `season` (isOn=0, S.=0); `caps`, `typo` are forced true in isOn (13808) so their switches could never do anything.
- Debug/test leftovers: 4 (Diagnostics fold) + 1 hidden "Photo magazine look (testing)" (`mag3`, hidden but still read in 15 places).
- Duplicates: 5. Confusing labels: about 20. Destructive without full safety: see C6.

## Flag findings

### C1 Developer test tools shipped in Settings
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: About CyPress > Advanced > Diagnostics (fold, 4 rows): "Test my sites on this phone", "Check scrolling", "Test suggested sites", "Copy support info". Code 10470 (`Diagnostics` fold), buttons `#schkb #perfb #catchk #diagb`.
- Now: "Test suggested sites" and "Check scrolling" are developer tools (catalog checker, frame-rate recorder); "Takes a few minutes", output copied to clipboard "to send to the developer". A Play reviewer or user sees engineering tools.
- Should: Remove "Test suggested sites" and "Check scrolling" from the release build; keep "Copy support info" and fold "Test my sites" into a plain "Something not loading?" help row. Recommendation: remove x2, fix x1, keep x1.
- Shots: audit/shots/C/C0-about-phone-day.png

### C2 Hidden "(testing)" setting still alive
- Status: NEW · Severity: Should-fix · Verified: CODE
- Where: `mag3` "Photo magazine look (testing)" in SET_HIDE (10430-10431), read 15 times (6554, 6555, 7774...).
- Now: hidden from the UI, but anyone whose old saved value was on still runs experimental layout/photo-credit code with no way to turn it off.
- Should: delete the flag or migrate it off. Recommendation: remove.
- Shots: none

### C3 Wrong group / stale path text
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED / CODE
- Where: (a) "Tinted photos" (`ptduo`) sits under "Per folder" on Look (Advanced). (b) "Report a problem", "Share anonymous usage counts", "What the counts contain" sit on Sites & backup (Advanced) under heading "Your sites". (c) Native "Digest notice" text says "turned on in Settings, Listening and Alerts" (16746); that page no longer exists (now "The Daily"). (d) "Manage your sites" row has button text "Manage feeds", and "Import or export your feeds file" uses feeds jargon.
- Should: move (a) to Theme extras, (b) to About/Privacy; fix (c) to "Settings, The Daily"; use "sites" consistently (CLAUDE.md copy rule).
- Shots: audit/shots/C/C0-look-phone-day.png, C0-sites-phone-day.png

### C4 Duplicated controls
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: Keyboard shortcuts (hub row AND About row `#kbopen`); Reading page "Reading settings > Open" (Aa sheet) vs "Text size" A/A vs "Type preset" vs Advanced "Headline font"; "Reset appearance and reading settings" (About) vs "Reset this section" (each page); Light/Dark in "Light, dark or Dynamic" plus a second Light/Dark inside "Dynamic look"; "Pictures" (all/save/none) vs "Only on Wi-Fi" vs "Offline mode" vs "Keep photos for offline".
- Should: drop the About copy of Keyboard shortcuts; keep one text-size control on the page; keep. Others: keep with clearer labels.
- Shots: audit/shots/C/C0-read-phone-day.png, C0-about-phone-day.png

### C5 Labels a beginner cannot parse
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: "Theme layouts", "Text on photos" (default option has an empty value), "Cover title style", "Photo pages", "Feature spread", "Page marks", "Edition endings", "Bookmark ribbons", "Group duplicate stories", "Narrow screen layout", "Story layout on big screens", "Hide the side bar", "Followed phrases", "What CyPress learned", "Voice timing", "Space for stored stories", "Connect your private relay" (relay is jargon), and the two unlabeled per-folder selects named only "Tech" and "World".
- Should: plain-language rewrite with an example in the hint; label the folder selects "Theme for Tech".
- Shots: audit/shots/C/C0-look-phone-day.png, C0-daily-phone-day.png

### C6 Destructive actions
- Status: NEW · Severity: Nice-to-have (all have a guard) · Verified: CONFIRMED (dialogs opened and cancelled; none confirmed)
- Where / Now:
  - Erase everything and start over (`#fresh`, 13783): confirm "Erase everything?" then a second "Save a backup first?"; no undo after (wipes localStorage, IndexedDB, caches). Good. Recommendation: keep.
  - Clear downloaded stories (`#clr`): confirm "28 downloaded stories will be removed"; no undo, harmless (re-download). Keep.
  - Reset appearance and reading settings (`#resetlookb`): confirm plus Undo toast. Keep.
  - Reset this section (every page): tap twice ("Tap again to confirm", 4 s) plus Undo toast. Keep.
  - Restore backup (`#bki`/`#fj`, 16825): confirm "Replace everything with this backup?" with counts plus Undo toast (CODE; file picker not drivable here).
  - Delete natural voice (`#nvdel`, 10366): confirm (native only, NEEDS-PHONE).
  - Voice timing Reset: no confirm, toast only; low risk.
- Should: nothing blocking; "Erase" could also say it cannot touch sync relay data.
- Shots: audit/shots/C/C-confirm-fresh-phone-day.png, C-confirm-clr-phone-day.png, C-confirm-resetlookb-phone-day.png

### C7 Settings with no visible effect on web (verification gaps)
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED (no change seen) / CODE
- Where: toggles that changed saved state only, no DOM change on The Daily: sysfs, mag, toc, disc, trend, must, seal, tidy, alm, dgon, dgwk, queue, skippay, ttscap, autoWeb, autoReader, cont, pfwifi, pfpow, pfshort, group, dtap, hideDeals, fcheck, curl, intro, cine, lowfx, haptic, shortlinks. Selects: dgwd, spm, rlay, sidehs, arf, capn, acmb, pics, bid, dynm, mast. All are read elsewhere (reader, TTS, timers, wide screens, native, monthly/December), so none dead, but they need the phone/reader/wide-screen pass. Also the "Smoother scrolling" revert leaves only setT diff (default depends on touch).
- Should: owner device test list; consider hiding rows that do nothing on this device (Hide the side bar on a phone is shown but tablet-only).
- Shots: none

### C8 Page header focus box
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: every sub-page title (e.g. "About CyPress") shows a dark focus rectangle around the heading on open (`#settitle` receives programmatic focus).
- Should: use a subtler ring or focus the Back button.
- Shots: audit/shots/C/C0-about-phone-day.png

## Full inventory
Columns: page | group | label | control | key | default | what it does (hint text; traced to isOn/S reads, counts in grep) | verified | flag. "Default" blank = see control (select first/current option). Toggles verified by clicking in the live build; CONFIRMED means page DOM/classes changed; CODE means state saved and read elsewhere (reader, TTS, native, timers).

| page | group | label | control | key | default | effect | verified | flag |
|---|---|---|---|---|---|---|---|---|
| look | - | Quick setup | segmented buttons | 3 options |  | The full printed look: a cover, contents, pull quotes and timelines | CODE |  |
| look | Fine-tune | Light, dark or Dynamic | segmented buttons | 7 options |  | Switches between light and dark when your phone does. | CONFIRMED (earlier presets/themes visibly changed; see shots) |  |
| look | Fine-tune | Dynamic look | select | #dynm | sys | Light or dark for the Dynamic theme | CONFIRMED-state only (needs Dynamic theme) |  |
| look | Fine-tune | Cover style | select | #cvs |  | How the front page cover is laid out. No photo today? You’ll get the Type cover | CONFIRMED |  |
| look | Fine-tune | Green top bar | toggle | S.gtop / data-tg | on | Keeps the forest-green bar across the top in the Cypress themes. Off gives a light bar tha | CONFIRMED (page DOM/class changed) |  |
| look | Theme extras (Advanced) | Theme layouts | toggle | S.tlay / data-tg | on | Each theme gets its own magazine styling: newspaper rules, terminal prompts, manuscript or | CONFIRMED (page DOM/class changed) | CONFUSING label |
| look | Theme extras (Advanced) | Text on photos | select | #scrim |  | Makes headlines easier to read on busy or bright pictures | CONFIRMED | CONFUSING (blank/default option unnamed) |
| look | Theme extras (Advanced) | Cover title style | select | #mast | clean | Auto looks at each cover photo and picks the style that reads best on it. Or choose one fo | CODE (state set; cover not on screen) | CONFUSING |
| look | Per folder (Advanced) | Theme by folder | toggle | S.fthon / data-tg | on | Give a folder its own look. It applies while you browse or read that folder | CONFIRMED (page DOM/class changed) |  |
| look | Per folder (Advanced) | Tech | select | # |  |  | CODE | CONFUSING (unlabeled select; folder name only) |
| look | Per folder (Advanced) | World | select | # |  |  | CODE | CONFUSING (unlabeled select; folder name only) |
| look | Per folder (Advanced) | Tinted photos | toggle | S.ptduo / data-tg | on | Tints every photo in the theme’s two colors, so the page looks like one printed magazine | CONFIRMED (page DOM/class changed) | WRONG GROUP (sits under "Per folder") |
| read | - | Reading settings | button/row | #aaopen |  | Size, font, spacing, width and page turn, with a live sample | CODE (action button) | DUPLICATE of Text size / Type preset / Headline font |
| read | - | Reading style | segmented buttons | 3 options |  | Turn pages like a magazine, or scroll down. Automatic scrolls on narrow screens and when a | CONFIRMED (earlier presets/themes visibly changed; see shots) |  |
| read | - | Text size | segmented buttons | 2 options |  | Use the buttons to make reading text bigger or smaller | CONFIRMED (earlier presets/themes visibly changed; see shots) | DUPLICATE of Aa sheet size |
| read | - | Type preset | segmented buttons | 4 options |  | One tap sets font, spacing and alignment together | CONFIRMED (earlier presets/themes visibly changed; see shots) |  |
| read | Text details (Advanced) | Headline font | select | #hfn | serif | Titles and headlines across the app | CONFIRMED |  |
| read | Text details (Advanced) | Compact reading on phones | toggle | S.pcomp / data-tg | on | Uses more of the screen: narrower margins, tighter lines, even left edge and a smaller fir | CONFIRMED (page DOM/class changed) |  |
| read | Text details (Advanced) | Follow my phone’s text size | toggle | S.sysfs / data-tg | on | The reader scales with the text size set in your phone’s settings | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| read | Text details (Advanced) | Bold word starts | toggle | S.focusr / data-tg | on | Bolds the first letters of every word so your eye can skim along the line. Helps some peop | CONFIRMED (page DOM/class changed) |  |
| read | Text details (Advanced) | Dim photos in dark themes | toggle | S.pdim / data-tg | on | Softens bright pictures in stories when the page is dark, so they don’t glare | CONFIRMED (page DOM/class changed) |  |
| read | Page details (Advanced) | Justify text | toggle | S.just / data-tg | on | Even edges, like a printed page | CONFIRMED (page DOM/class changed) |  |
| read | Page details (Advanced) | Author and site notes | select | #bfs | fold | Bios and site blurbs at the start or end of a story. Fold tucks them into a small note you | CONFIRMED |  |
| read | Page details (Advanced) | Swipe down to close a story | toggle | S.sdown / data-tg | on | Pull a story down to go back to the list | CONFIRMED (page DOM/class changed) |  |
| read | Magazine extras (Advanced) | Magazine touches | toggle | S.mag / data-tg | on | Drop caps and pull quotes in longer stories | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| read | Magazine extras (Advanced) | Photo pages | toggle | S.fbleed / data-tg | on | Stories with many big photos give some of them a whole page | CONFIRMED (page DOM/class changed) | CONFUSING |
| read | Magazine extras (Advanced) | Feature spread | toggle | S.spread / data-tg | on | One big story per issue with an oversized headline | CONFIRMED (page DOM/class changed) | CONFUSING |
| read | Magazine extras (Advanced) | Pull quotes | toggle | S.pqc / data-tg | on | A line pulled out big between sections, from stories and from your own highlights | CONFIRMED (page DOM/class changed) |  |
| read | Magazine extras (Advanced) | Page marks | toggle | S.folio / data-tg | on | A small running line at the foot of each page, and a mark at the end of every story | CONFIRMED (page DOM/class changed) | CONFUSING |
| read | Magazine extras (Advanced) | Table of contents | toggle | S.toc / data-tg | on | An “In this issue” list on The Daily, with page numbers you can tap | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| read | Magazine extras (Advanced) | Story timeline | toggle | S.tline / data-tg | on | When several sites cover the same story, see who reported it first and how it developed | CONFIRMED (page DOM/class changed) |  |
| read | Magazine extras (Advanced) | At-a-glance box | toggle | S.mnote / data-tg | on | On a hero or split opening, a small box with the source, date, reading time and who else c | CONFIRMED (page DOM/class changed) |  |
| read | Magazine extras (Advanced) | You might also like | toggle | S.disc / data-tg | on | At the end of a story, a few links from sites you don’t follow yet that match its subject, | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| daily | Front page | Magazine cover on The Daily | toggle | S.cover / data-tg | on | A full-page cover with the day’s top story | CONFIRMED (page DOM/class changed) |  |
| daily | Front page | Story card size | segmented buttons | 3 options |  | How much of each story shows in the list | CONFIRMED (earlier presets/themes visibly changed; see shots) |  |
| daily | Front page | Feed text size | segmented buttons | 3 options |  | How big the words are in your feeds and The Daily. Separate from Story card size and from  | CONFIRMED (earlier presets/themes visibly changed; see shots) |  |
| daily | The Daily | Trending strip | toggle | S.trend / data-tg | on | A row of stories that several sources covered at once, at the top of The Daily | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| daily | The Daily | Must reads | toggle | S.must / data-tg | on | On wide screens, a ranked list of your top stories next to the front page | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| daily | The Daily | Edition endings | toggle | S.seal / data-tg | on | A brass seal and a closing line at the end of each edition, brief and long-reads list | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) | CONFUSING (brass seal) |
| daily | The Daily | Bookmark ribbons | toggle | S.rib / data-tg | on | A brass ribbon on stories you saved, and a thin line showing how far you read | CONFIRMED (page DOM/class changed) | CONFUSING |
| daily | The Daily | I have 10 minutes | toggle | S.ten / data-tg | on | A button on The Daily that builds a short issue to fit the time you have | CONFIRMED (page DOM/class changed) |  |
| daily | The Daily | Monthly tidy-up note | toggle | S.tidy / data-tg | on | Once a month at most, a note about sites that went quiet or never load | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| daily | The Daily | Year almanac | toggle | S.alm / data-tg | on | A card on The Daily from December 1 to January 15 with your year in reading | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| daily | Digest | Daily digest | toggle | S.dgon / data-tg | on | A daily issue with a cover story, your topics, saved stories and what you missed. Works of | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| daily | Digest | Digest edition | select | #dgwhen | morning | Offer the morning issue, the evening issue, or both on The Daily | CONFIRMED |  |
| daily | Digest | Weekly review | toggle | S.dgwk / data-tg | on | A longer issue with your reading stats | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| daily | Digest | Weekly review day | select | #dgwd | 0 | The day the weekly issue comes out | CODE |  |
| daily | Digest | Read today’s digest | button/row | #dgopen |  | Opens today’s digest right now | CODE (action button) |  |
| daily | Layout (Advanced) | Covers for sites, folders and topics | toggle | S.covers / data-tg | on | Open any site, folder or topic with its own magazine cover | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| daily | Layout (Advanced) | Side-by-side reading | select | #spm | off | Stories open next to the list on big screens | CODE (wide screens only) |  |
| daily | Layout (Advanced) | Front page style | segmented buttons | 3 options |  | A mix of big photos, headline lists, strips and quotes that changes by feed and day. Choos | CONFIRMED (earlier presets/themes visibly changed; see shots) |  |
| daily | Layout (Advanced) | Narrow screen layout | select | #nrw | auto | Big headlines and a bottom bar on the cover screen | CONFIRMED | CONFUSING |
| daily | Layout (Advanced) | Story layout on big screens | select | #rlay | auto | How the first pages of a story are laid out when the screen is wide. Automatic picks per s | CODE (reader, big screens) | CONFUSING |
| daily | Layout (Advanced) | Hide the side bar | select | #sidehs | off | On tablets, give your stories the whole screen. A small tab or a swipe from the left edge  | CODE (tablet only) | CONFUSING ("side bar") |
| listen | - | Voice | select | #voice |  | The voice that reads stories aloud | CODE |  |
| listen | - | Natural voice | select | #nvz |  |  | CONFIRMED (state; starts a download) |  |
| listen | - | Speaking speed | slider | #rate |  | How fast stories are read aloud | CODE |  |
| listen | - | Volume | slider | #vol |  | How loud stories are read aloud | CODE |  |
| listen | - (Advanced) | Keep playing | toggle | S.queue / data-tg | on | When one story finishes, read the next one in the list | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| listen | - (Advanced) | Skip subscriber sites | toggle | S.skippay / data-tg | on | Play the Daily leaves out sites that need a subscription, so everything you hear is the fu | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| listen | - (Advanced) | Second voice for quotes | select | #qv |  | Reads quoted speech in a different voice | CONFIRMED |  |
| listen | - (Advanced) | Voice timing | button/row | #vtreset |  | If the highlighted word seems to run ahead of or behind the voice, this clears what CyPres | CODE (action button) | CONFUSING |
| listen | - (Advanced) | Read photo captions | toggle | S.ttscap / data-tg | on | Off: the voice skips the small text under pictures | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| stories | Your stories | Order of feeds and folders | select | #fsrt |  | As you added them, or A to Z in the sidebar and lists | CONFIRMED |  |
| stories | Your stories | Order of stories | select | #srt | smart | Best stories first, newest first, or grouped by the site they come from | CONFIRMED |  |
| stories | Your stories | Hide stories I’ve read | toggle | S.hideRead / data-tg | on | Stories you’ve opened disappear from the list | CONFIRMED (page DOM/class changed) |  |
| stories | Your stories | Hide unread counts | toggle | S.hideCount / data-tg | on | A small dot beside sites and folders with something new, instead of numbers. Also hides “u | CONFIRMED (page DOM/class changed) | OK |
| stories | Filters | Muted words | button/row | #mut |  | Hide stories that mention them | CODE (action button) |  |
| stories | Filters | Followed phrases | button/row | #fwe |  | Stories that mention them move up and are marked. With story alerts on, new ones send a no | CODE (action button) | CONFUSING |
| stories | Filters | Topics you follow | button/row | #sfb |  | Collect stories by keyword, from every site | CODE (action button) |  |
| stories | When a story is cut short | Open the website when a story is cut short | toggle | S.autoWeb / data-tg | on | If a story is only a preview, such as behind a paywall, show the website in the app instea | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| stories | When a story is cut short | Use reader view on websites | toggle | S.autoReader / data-tg | on | When a website is open, switch to the clean reader view whenever CyPress can make one | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| stories | When a story is cut short | Continuous reading | toggle | S.cont / data-tg | on | Keep pulling past the end of a story (or turn the last page again) to flow straight into t | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| stories | Downloads | Get stories ready in advance | select | #pfm | 100 | Keeps your newest stories downloaded, so they open instantly and work offline. When new on | CONFIRMED |  |
| stories | Downloads | Only on Wi-Fi | toggle | S.pfwifi / data-tg | on | Stories are only downloaded ahead of time on Wi-Fi, never on mobile data | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| stories | Downloads | Refresh automatically | select | #arf | 0 | How often new stories are fetched while the app is open | CODE (timer) |  |
| stories | Downloads | Offline mode | toggle | S.offline / data-tg |  | Read only what is already stored on this device. Nothing new downloads | CODE (not toggled: writes to disk/server or network) |  |
| stories | Pictures | Pictures | select | #pics | all | Photos load as usual. | CODE (state only; no image change seen) |  |
| stories | Pictures | Keep photos for offline | toggle | S.offimg / data-tg |  | Saves the photos of your 100 newest unread stories, plus every story you’ve starred, on th | CODE (not toggled: writes to disk/server or network) |  |
| stories | Back issues | Keep back issues | toggle | S.bi / data-tg | on | Off by default. Keeps each edition’s text, only from stories already stored on this device | CONFIRMED (page DOM/class changed) |  |
| stories | Back issues | Keep back issues for | select | #bid | 90 | Older issues are removed automatically | CODE |  |
| stories | Your stories (Advanced) | Limit per site | select | #capn | 8 | The most stories one site can show on The Daily and All Stories, so a busy site can’t crow | CODE |  |
| stories | Your stories (Advanced) | Group duplicate stories | toggle | S.group / data-tg | on | One card when several sites cover it | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) | CONFUSING wording |
| stories | Your stories (Advanced) | Double-tap a card to save it | toggle | S.dtap / data-tg | on | Opening a story waits a moment so the app can tell the difference | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| stories | Filters (Advanced) | Hide deals and shopping | toggle | S.hideDeals / data-tg | on | Hide stories that are really ads, like “30% off” or “best deals” roundups. It’s a best gue | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| stories | Filters (Advanced) | What’s hidden | button/row | #dealsee |  |  | CODE (action button) |  |
| stories | Filters (Advanced) | What CyPress learned | button/row | #lrnsee |  | The sites and headline words your “More like this” and “Less like this” taps have taught i | CODE (action button) | CONFUSING |
| stories | Downloads (Advanced) | Fill up only while charging | toggle | S.pfpow / data-tg | on | Off: all of them download on Wi-Fi. On: 50 stories download on Wi-Fi, and the rest wait un | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| stories | Downloads (Advanced) | Short sites first | toggle | S.pfshort / data-tg | on | Sites that only send a few lines get their full stories downloaded first | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| stories | Storage (Advanced) | Space for stored stories | select | #acmb | 60 | 15 stories, 0.0 MB stored | CODE | CONFUSING |
| stories | Storage (Advanced) | Clear downloaded stories | button/row | #clr |  | Frees space. Your feeds and saved stories stay | CODE (action button) | DESTRUCTIVE: confirm; no undo (re-downloadable) |
| sites | Your sites | Manage your sites | button/row | #mgb |  | Rename, recolor or fix broken sites | CODE (action button) | INCONSISTENT: row says sites, button says "Manage feeds" |
| sites | Your sites | Import or export your feeds file | button/row | #exp |  | Move your sites to or from another app | CODE (action button) | CONFUSING ("feeds file") |
| sites | Backup | Back up everything | button/row | #bke |  | One file with your feeds, saved stories, highlights and settings. Keep a copy somewhere sa | CODE (action button) | Restore: confirm + Undo toast (CODE) |
| sites | Your sites (Advanced) | Check sites before adding | toggle | S.fcheck / data-tg | on | Looks at a few stories first and warns you if a site mostly posts links, hasn’t posted lat | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| sites | Your sites (Advanced) | Report a problem | button/row | #rpb |  | Tell the developer what went wrong. You see everything that is sent before you send it | CODE (action button) | WRONG GROUP (under Sites & backup; belongs in About) |
| sites | Your sites (Advanced) | Share anonymous usage counts | toggle | S.ustat / data-tg |  | Off unless you turn it on. Once a week, sends counts like your app version, theme and how  | CODE (not toggled: writes to disk/server or network) | WRONG GROUP (Sites & backup); keep, move to Privacy/About |
| sites | Your sites (Advanced) | What the counts contain | button/row | #ustv |  | See exactly what would be sent from this device | CODE (action button) | WRONG GROUP |
| motion | - | Motion | segmented buttons | 4 options |  | All the movement CyPress has: page curl, slow zooms, rising headlines and small animations | CONFIRMED (earlier presets/themes visibly changed; see shots) |  |
| motion | - | Animated themes | toggle | S.cyfx / data-tg | on | Rain, aurora lights, fireflies and other moving extras some themes have. They pause while  | CONFIRMED (page DOM/class changed) |  |
| motion | - | Smoother scrolling | toggle | S.smooth / data-tg | on | No blurs or soft shadows, and stories load as you scroll. On by default in Safari and on t | CONFIRMED (page DOM/class changed) |  |
| motion | Customize motion | Bending page turn | toggle | S.curl / data-tg | on | Pages curl and bend as they turn, and follow your finger. Off gives a simple flat turn | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| motion | Customize motion | Blend colors between sites | toggle | S.sitecol / data-tg | on | When the next story is from a different site, the page colors fade from one to the next | CONFIRMED (page DOM/class changed) |  |
| motion | Customize motion | Time-of-day glow | toggle | S.tod / data-tg | on | A faint warm glow in the evening and a cool one late at night | CONFIRMED (page DOM/class changed) |  |
| motion | Customize motion | Slow zoom on covers | toggle | S.czoom / data-tg | on | The cover photo drifts closer, slowly | CONFIRMED (page DOM/class changed) |  |
| motion | Customize motion | Living covers | toggle | S.clive / data-tg | on | Cover headlines rise into place one line at a time | CONFIRMED (page DOM/class changed) |  |
| motion | Customize motion | Small animations | toggle | S.micro / data-tg | on | Star pop, read fade, sliding messages, growing logo when you pull to refresh | CONFIRMED (page DOM/class changed) |  |
| motion | Customize motion | Launch animation | toggle | S.intro / data-tg | on | The logo drifts in and settles into place when the app opens. It never covers the screen o | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| motion | Customize motion | Cinematic long reads | toggle | S.cine / data-tg | on | Long stories scrolled down the page open with a full-width photo; pictures drift gently ag | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| motion | - (Advanced) | Pause effects on low battery | toggle | S.lowfx / data-tg | on | Below 20% and not charging, animations and rain pause until you charge | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| motion | - (Advanced) | Gentle vibration | toggle | S.haptic / data-tg | on | A soft tap when you save a story, a tick when a pull to refresh is ready, and a deeper pul | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| motion | - (Advanced) | Bigger buttons | toggle | S.bigtap / data-tg | on | Larger round buttons, bottom tabs and switches, easier to tap | CONFIRMED (page DOM/class changed) |  |
| about | The app | CyPress updates | button/row | #webupd |  | You have version 1.231 | CODE (action button) |  |
| about | - | Tips and gestures | button/row | #tipsb |  | Everything you can do with a swipe, a press or a tap | CODE (action button) |  |
| about | - | See your year | button/row | #almb |  | Your Almanac: stories finished, minutes read, favorite sites and a best quote | CODE (action button) |  |
| about | - | Privacy | button/row | #prvb |  | What stays on this device and what doesn’t | CODE (action button) |  |
| about | - | Keyboard shortcuts | button/row | #kbopen |  | For a keyboard on your tablet or computer. Press ? any time | CODE (action button) | DUPLICATE (hub row + About row) |
| about | - | Redo setup | button/row | #obagain |  | Pick topics and sources, keep everything else | CODE (action button) |  |
| about | Sharing and Kindle | Shorten shared links | toggle | S.shortlinks / data-tg | on | When you share a story, its link is made short by CyPress's own link service. If it is off | CODE (state saved; effect is elsewhere, e.g. reader/TTS/native) |  |
| about | Sharing and Kindle | Kindle books | select | #kmode | bw | Black and white suits e-ink Kindles. Color suits the Kindle Colorsoft, Kobo Clara Color an | CONFIRMED (Kindle sheet) |  |
| about | Sharing and Kindle | Your Kindle address | button/row | #kset |  | Not set yet. You are asked the first time you send | CODE (action button) |  |
| about | Diagnostics (Advanced) | Copy support info | button/row | #diagb |  | Version, device and recent errors, for sending to the developer. Contains no feed addresse | CODE (action button) | keep (support) - move out of "Diagnostics" jargon |
| about | Diagnostics (Advanced) | Test my sites on this phone | button/row | #schkb |  | Tries each of your sources the way CyPress does and writes a report you can send to the de | CODE (action button) | DEBUG-ish - keep only inside a support flow |
| about | Diagnostics (Advanced) | Check scrolling | button/row | #perfb |  | Records how smooth scrolling is while you scroll for about 15 seconds, then copies a repor | CODE (action button) | DEBUG - remove from release |
| about | Diagnostics (Advanced) | Test suggested sites | button/row | #catchk |  | Checks every suggested site and copies a list of any that no longer load. Takes a few minu | CODE (action button) | DEBUG - remove from release (developer catalog checker) |
| about | Reset (Advanced) | Reset appearance and reading settings | button/row | #resetlookb |  | Theme, fonts, cover style and the reading and effect switches go back to their defaults. Y | CODE (action button) | DESTRUCTIVE: confirm + Undo toast; DUPLICATE of per-page "Reset this section" |
| about | Reset (Advanced) | Erase everything and start over | button/row | #fresh |  | Removes your feeds, saved stories and settings from this device | CODE (action button) | DESTRUCTIVE: 2 confirms + optional backup; no undo (by design) |

### Not in the table
- Theme rail (`#thm`, themes incl. Halcyon, per-theme twin), Light/Dark/Dynamic radio (`#schv`), Aa sheet and font grid (`#fgrid`), Quick setup presets: CONFIRMED visibly changing look in earlier toggles; presets Simple/Full/Everything CODE.
- Retired hidden rows (state still read): Sepia paper, Newsprint grain, Living Dynamic theme, Tint the app from cover photo, Reduce motion (`rmo`, still the Motion Off switch), Interface sounds (`sfx` DEAD), Seasonal touches (`season` DEAD, `szn` read), Paper texture, Line spacing, Page margins (moved into Aa sheet), Polished typography (`typo` forced true), Sepia reading page (still in Aa sheet), Tint pages with photo colors, Page-turn sound/tick, Photo magazine look (testing), Section covers, Tidy photo captions (`caps` forced true), Varied story layout / Quiet layout (replaced by Front page style), Light rays, Pull quotes on The Daily, End-of-story mark, Single-key shortcuts (now in the shortcuts sheet), Text only, Data saver (merged into Pictures).
- Not touched on purpose: Share anonymous usage counts, Report a problem > Send, Keep photos for offline and Offline mode (network/storage), Erase/Clear/Reset confirmations were cancelled.
- Side effect: changing "Natural voice" from Phone to Compact in the test started a voice-pack request, then was set back.
