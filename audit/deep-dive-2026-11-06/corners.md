# corners: audit of the rarely checked parts (CyPress 1.272, www/index.html, mock feeds, 390x844 unless noted)
Screenshots: /tmp/claude-0/-home-user/adde917f-1a7e-5251-872b-5dbd81b028cb/scratchpad/audit/corners/
Exported files I opened (PDF, EPUB, OPML, backup JSON, Markdown) are in .../scratchpad/c/dl/.
Worst first. IDs are C01 to C18.

### C01 · bug · Reading shortcuts N and P turn pages, but the Keyboard shortcuts sheet says "next / previous story"
Where: Keyboard shortcuts dialog (#kbh, line ~5070); key handler ~12487 (`$('#nx').click()`, `$('#pv').click()`). `#nx` and `#pv` are the hidden "Next page" / "Previous page" buttons built at ~9846.
What a user sees/feels: With a keyboard or Bluetooth keys connected, pressing N inside a story moves one page forward (or does nothing on a one-page story), never to the next story. The sheet promises the opposite. The ← → row already covers page turns, so N/P are doubled up and the promised story-to-story keys do not exist.
Recommend: Smallest fix: make N/P call the same "next story / previous story" the Next up bar uses (or the existing story-queue next), and keep ← → for pages. If that is more than wanted, change the sheet row to "N P next / previous page" and drop the arrow row duplicate. Also the position slider (#dial, ~13913) uses the same hidden buttons on arrow keys, so check it after any change.
Evidence: 22_kbd.png (sheet). Measured in a 3-page story: ArrowRight pg 0 to 1; n pg 1 to 2; n again stays 2; p pg 2 to 1; same story title throughout.
Confidence: high
(Everything else in the sheet works: J K Enter S M R / on the list, ← → F S Esc in the reader, ? toggles the sheet.)

### C02 · bug · The Kindle book repeats the opening paragraph; the PDF does not
Where: `exStory` / `epubMake` (~17094, ~17173); the PDF path dedupes, the EPUB path does not.
What a user sees/feels: In the EPUB, the italic summary line under the headline and the first paragraph (with the drop cap) are the same sentence, so the story seems to start twice. The PDF of the same story shows the summary once and starts the body at paragraph 2.
Recommend: Apply the same "drop the first block if it equals/starts the summary" rule the PDF uses to the EPUB blocks (`.dek` + `.first`). Same story in the PDF is the reference.
Evidence: dl/ep/OEBPS/s1.xhtml (`<p class="dek">Paragraph 0 ...</p>` then `<p class="first">...Paragraph 0 ...`); 07_pdf_pages.png shows the PDF version without the repeat. Mock feeds use the first paragraph as the summary, which is also common with real feeds.
Confidence: high
Also seen: the Kindle cover (10_kindle_cover.png) is top-heavy, with the lower two thirds empty white. Optional polish: center the title block or add the story photo when there is one.

### C03 · bug · The website and share page still promise themes the app retired
Where: docs/index.html lines ~262 ("Dozens of themes."), ~270 ("In the app there are many more, from Typewriter to Deep Sea."); docs/s.html promo ("Dozens of themes, from newsprint to neon"). App: `POLISH_RETIRED` (~5197) maps Typewriter, Deep Sea, Cyber and about 30 others to Cypress or Aurora.
What a user sees/feels: A visitor installs expecting Typewriter, Deep Sea, neon. The Look page offers 7 paper/color themes plus Pure Black and Dynamic. Typewriter and Deep Sea are named on the home page and cannot be found.
Recommend: Home page: "A handful of hand-made themes. Try one here." and "In the app there are more, from Coast to Aurora." (use real names: Coast, Aurora, Sepia Rosewood, High Contrast). Share page bullet: "Themes for day and night, from newsprint to Aurora." Keep "Each theme has a light and a dark version" (true).
Evidence: 38_share_page_phone.png (the "neon" bullet), 11_settings / theme tiles list (Cypress, Newsprint, Black & White, High Contrast, Coast, Sepia Rosewood, Aurora).
Confidence: high

### C04 · bug · Copy points to Settings pages that no longer exist (app and privacy page)
Where: app: `Settings, Read aloud` (~10352), `Settings, Motion and Sound` (~16068), `Settings, Stories, Order of stories` (~16201, the one-time "All list is sorted smartly" bar, whose Change it button also uses the old `SETP='feeds'` route), `Settings, Listening and Alerts` (~16808, Digest notice). docs/privacy.html: "Shorten shared links ... (Settings, Backup, Sync and About)" and "usage counts (Settings, Feeds and backup)", "Erase everything in Settings".
What a user sees/feels: He is told to open a page by a name that is not on the Settings list. Current names: Look, Reading, The Daily, Listen, Stories & loading, How It Behaves, Sites & backup, Motion and battery, About CyPress. "Shorten shared links" is now under About CyPress > Sharing and Kindle; the usage-counts switch is not under "Feeds and backup".
Recommend: Replace with the real names: Listen, Motion and battery, Stories & loading (Order of stories), Listen (Digest). Privacy page: "Settings, About CyPress" for shared links; check where "Share anonymous usage counts" really lives and name that page. Test the "Change it" button from the sorted-smartly bar once (not opened here, needs a fresh upgrade state; medium).
Evidence: 13_about.png and 12_sites.png (real page names); grep lines above.
Confidence: high for the stale names; medium for the Change it button.

### C05 · bug · Tips list describes a long-press menu the app no longer has, and hard-codes swipe directions
Where: `TIPLIST` (~12851), quick-action menu `qaOpen` (~13340). Swipe directions are settable (`S.swl`, `S.swr`).
What a user sees/feels: Tip says "Press and hold a card for quick actions: save, share, mark above as read, pause a site, more or less like this." The real menu is Save, Mark as read, Share, Hide <site> for today, Open in browser, Add to a collection, Don't show me stories about. "Mark above as read", "pause a site" and "more/less like this" are not there (the code for `above` still exists but is not offered). The swipe tip and the first-run tip say right = read, left = save even after he changes it in Settings. The tip icons are color emoji (hand, book, link) beside one line-art arrow, which clashes with the rest of the app.
Recommend: Rewrite the long-press line to match the menu; word the swipe tip from `S.swl/S.swr`; use the app's line icons. If "Mark above as read" is wanted back, it is one menu line (`qaDo` already handles it).
Evidence: 33_tips.png; code reading of the menu at ~13340.
Confidence: high

### C06 · missing · The only way to reach a site's or folder's settings on a phone is a press-and-hold nobody is told about
Where: sidebar `#side-list` (~6225, CSS ~822/831): the × and the per-site actions are `display:none` on touch (`@media(hover:none)`); settings open from `HOLDQ` long-press (~13394). Tips (C05) never mention long-pressing a site in the side bar.
What a user sees/feels: On a touch screen the sidebar shows no menu, dots or gear next to a site or folder (30_sidebar.png). To rename a site, change its folder, set Refresh this site (hourly, 6 hours, daily, hand only), pause it or delete a folder, he must guess to hold the row. The refresh-rate, pause and per-site rules are all behind that gesture (28_fset_top.png, `#fset` Advanced).
Recommend: Add one visible way in: a small "..." at the end of each row (or a "Site settings" line in Settings > Manage your sites, which exists but opens a different list). Cheapest: add a Tips line "Press and hold a site or folder in the side bar for its settings", plus a first-use hint.
Evidence: 30_sidebar.png, 32_foset.png, 28_fset_top.png.
Confidence: high

### C07 · polish · Kindle address box: a typo closes the box and loses what was typed; any email is accepted
Where: `kindleAddr` (~17715).
What a user sees/feels: He types a mistyped address and taps Save. The box closes, a toast says "That doesn't look like an email address" and he has to start the whole send again. Also the box says the address must end in @kindle.com but `me@gmail.com` is accepted and the book is mailed to it.
Recommend: Keep the box open with an inline message. Require `@kindle.com` or `@free.kindle.com` (or one line "That doesn't end in @kindle.com. Use it anyway?").
Evidence: 06_kindle_ask.png (good copy about the approved-sender list), 08_kindle_bad.png (after the bad entry the box is gone), code line 17718-17719.
Confidence: high

### C08 · looks · "Highlights" page title is cut to "Highlig..." on a 390px phone
Where: header `#ttl` (H1, ellipsis); at 390px it is 102px wide because four 44-50px icons sit beside it. The Highlights page has no big title below, so this is the only title.
What a user sees/feels: The page name is cut off. The same happens to docked titles ("All Sto..." once the list is scrolled) and any long folder or site name; at 360px the room is only 72px.
Recommend: Drop the Mark-all-read icon to the overflow on narrow phones, or give `#ttl` `flex:1` and let the icons shrink (36px targets), or put a normal-size title under the bar on pages that lack one.
Evidence: 58_highlights.png, 61_longpress.png (scrolled All list), measured: scrollWidth 114 vs clientWidth 102.
Confidence: high

### C09 · looks · Add a site > Near you: the results area is two rows tall, place names squeeze to one letter, "Remove" looks like the main action
Where: `localHtml` (~11507) inside the Add dialog `#pop`.
What a user sees/feels: After typing a place only 1 to 2 results are visible; the rest hide under a fade. The page keeps the top "Search, or paste a site address" box beside the Town box, so there are two inputs. With a saved place "Zürich 北京" the name wraps to two characters per line because the "Added to Local" label and a dark Remove button take the width. In phone landscape (844x300) the whole list area is blank, so Near you, Starter packs and Import are unreachable until he scrolls an invisible region.
Recommend: Hide the top search box while a sub-page (Near you, Packs) is open, give the list the dialog's free height, put "Added to Local" under the name, and style Remove as a quiet text button.
Evidence: 19_near1.png, 21_near3.png, 47_land_add.png (844x300), 47b_land390_add.png (844x390, one row visible). Flow itself works: typed place, Find news, Save to my places, Add, Remove; empty input says "Type a town, city or region first."
Confidence: high

### C10 · polish · Per-site sheet: a missing period joins two sentences, and a dropdown is cut off
Where: `#fset` Translate headlines row; "Follow my setting" select.
What a user sees/feels: "Shows its headlines and stories in your language, on your phone Uses Google's translator, built into the app." (no full stop). The select shows "Follow my se" at 390px and 300px. The same sheet says "feed" (Feed settings, Pause this feed, Remove feed) while the rest of the app says "site".
Recommend: Add the period or split the sentence; widen the select or shorten to "Same as all"; use "site" throughout.
Evidence: 28_fset_top.png, 44_w300_fset.png.
Confidence: high

### C11 · missing · Sharing a story is link only; a ready "share as picture" card exists in the code but is not hooked up
Where: `shareStory` (~17843) copies/shares "Read this in CyPress: <link>"; `articleCard` (~15627) draws a 1080x1350 card but nothing calls it; `shareUrl` (~15607) is also unused.
What a user sees/feels: Highlights have Share as image (nice, 59_quote_image.png) and the Almanac too, but a story only has a link. When "Shorten shared links" is off or the service is slow, the message still says "Read this in CyPress:" followed by the publisher's own address, which does not open CyPress at all.
Recommend: Wire `articleCard` into the Share menu as "Share as picture" after improving it (60_article_card_unused.png is a plain gradient with fallback fonts and a lot of empty space). When the CyPress short link is not available, drop the "Read this in CyPress:" lead and send the title plus the plain address. Delete the dead `shareUrl`.
Evidence: 59_quote_image.png (good), 60_article_card_unused.png, 04_share.png (web build only says "Link copied").
Confidence: high

### C12 · polish · "Report junk text" in the story menu does nothing on first tap; the pop-up calls the same thing "Hide text"
Where: story menu item `data-act="junk"` (~12100); selection pop-up (Hide text).
What a user sees/feels: He taps Report junk text in the menu and gets a toast "Select the text first, then choose Report junk text". The menu has closed, so he must select text, then find the item again; the selection pop-up that appears instead has "Hide text".
Recommend: One name ("Hide text" or "Report junk"). In the menu, show the item disabled with a small hint until text is selected, or remove it from the menu since the selection pop-up has it.
Evidence: 64_junk.png, 65_selpop.png.
Confidence: high

### C13 · polish · Swipe actions have no Undo
Where: `swEnd` (~13262).
What a user sees/feels: A right swipe marks read and a left swipe saves, with a good colored label (26_swipe_right_full.png "Read" green, 27_swipe_left_full.png "Save" gold). A slip while scrolling is easy; the toast ("Marked as read", "Saved") has no Undo, while Mark all as read, highlight removal and folder delete all do. A short swipe (60px) correctly does nothing. Swipe does not work with a mouse (by design, but a desktop user gets no hint; J K M S cover it).
Recommend: Pass an undo callback to the two toasts.
Evidence: 25 to 27 swipe screenshots; toast text only.
Confidence: high

### C14 · missing · No timed light/dark schedule
Where: Settings > Look > "Light, dark or Dynamic" (`SCH_OPTS` ~10542): Phone, Light, Dark, Dynamic only.
What a user sees/feels: Magazine and night readers expect "dark after 8pm". Sunset mode was removed on purpose (HANDOFF), so Phone/Always are the only choices; fine on Android where the phone can do it, but Dynamic's own "Light/Dark/Match my phone" row is the only other lever.
Recommend: Only if wanted: a From/To time pair under Dark (the Quiet hours control for alerts already has the same UI). Otherwise ignore.
Evidence: 55_sched0.png, 56_sched_dynamic.png.
Confidence: high that it is absent; whether it is wanted is David's call.

### C15 · missing · Export as Markdown covers highlights only, and the file breaks on titles with * [ ] < >
Where: `hlMarkdown` (~14376).
What a user sees/feels: Highlights export is tidy, but there is no "copy / save this story as Markdown or plain text" for readers who file articles in Obsidian or Notes. In the file, a title like "A *starred* [title]" is not escaped; a two-line note puts line 2 outside the "Note:" paragraph; dates are "11/6/2026" (ambiguous).
Recommend: Escape `*_[]<>` in titles; indent note continuation lines; use "November 6, 2026". A per-story "Save as Markdown" next to PDF and Kindle is one function built from `exStory` blocks.
Evidence: dl/h.md output (in my run), 58_highlights.png.
Confidence: high

### C16 · polish · Sync set-up is a developer task described in plain-looking words
Where: Settings > Sites & backup > Sync Between Devices, `#rl` dialog (14_relay.png) and `syncUi` (~13717).
What a user sees/feels: The section opens "No CyPress account needed", then asks him to create a Cloudflare account, make a Worker, paste about 250 lines of code, create a KV namespace and a "binding". That is honest and well explained, but it is beyond a general reader, and it is the only way to keep two devices in step besides a manual backup file. It says "free Cloudflare account" (the no-"free"-promises rule is for marketing pages but this reads like a promise). Headings "Sync Between Devices" and "How It Behaves" are title case, while every other section is sentence case. The relay box names a publisher (TechCrunch).
Recommend: Put a plain "Move to a new phone: Back up, then Restore" line above the Cloudflare option so most people never open it; say "a Cloudflare account (the basic plan costs nothing today)" or drop "free"; sentence-case the two headings.
Evidence: 12_sites.png, 14_relay.png.
Confidence: high

### C17 · polish · What's New only shows the current version's notes; the dialog has no explicit role
Where: `whatsNew` (~16195), `CHANGES` (~13831).
What a user sees/feels: Someone who skipped two builds sees only the last build's bullets (9 lines for 1.272). A few lines use the word "web version" and "outside helper sites" that mean nothing to Android readers. The dialog is a plain `<dialog>` with `aria-labelledby` but no `role="dialog"` (CLAUDE.md section 7 asks for it).
Recommend: Show every version since `S.ver` (the whats-new.txt sections are already ordered). Add the role.
Evidence: 57_whatsnew.png (text dump in my run).
Confidence: medium (I did not install an older build; I read the code and opened the dialog with an old version stamp).

### C18 · polish · The backup file includes the private sync-service address
Where: `makeBackup` (~16886) deletes `key`, `sync*` and `imt` but not `relay`; restore handles `d.relay` through `safeRelay`.
What a user sees/feels: Settings says "Anyone who has your address can use it, so keep it private", yet a backup file he emails himself or drops into cloud storage contains it. The backup copy says nothing about that.
Recommend: Leave the address out of the file, or say in "Back up everything" that the file includes the sync service address.
Evidence: code only. Keys in my test backup did not include `relay` because none was set.
Confidence: medium

## Checked and fine (no action)
- Share: web copies the link and says "Link copied"; short-link failure falls back to the plain address. docs/s.html renders the packed link (Arabic title right-aligned and readable, long title wraps, fallbacks work) (38_share_page_*.png).
- Make a PDF: 3-page file, cover band, drop cap, running header/footer, quote colophon, 1 story = single column (07_pdf_pages.png). Reads well.
- Send to Kindle: valid EPUB 3 with cover, nav, colophon; web flow saves the file then opens a mail draft; the address box copy explains the Amazon approved-sender step.
- Backup/restore: backup file saves; a wrong JSON says "That file isn't a CyPress backup"; a real one asks "Replace everything with this backup?" with counts and date and offers Undo after reload. OPML import shows "Import 1 feed? ... 1 already in your list will be skipped" (15_restore_ask.png, 16_opml.png); export OPML keeps folders.
- Mark all as read: confirm box, "Marked 24 stories as read", Undo works (23_markall.png, 24_markall2.png).
- Find in story: counter "1 of 1", highlight, Esc closes only the bar (35_find1.png).
- Folders: delete asks Keep the feeds / Delete folder and feeds and offers Undo (31_delfolder.png); folder sheet is clear (32_foset.png).
- Side panel in all three hide modes at 1024x1366, 1812x2176, 1366x1024: Never = pinned 225-290px; portrait-only hides on portrait/square and stays on landscape; Always hides everywhere; the menu button opens a 300px overlay in each (53_*.png, 54_tab_sideopen_always.png). The overlay has no dimmed scrim behind it (minor).
- 300px wide phone (stress for large text): no horizontal scroll on Daily, All, Settings, per-site sheet (42_w300_*, 44_w300_fset.png, 45_w300_sites.png). Root font-size changes do nothing because the CSS is in px; real Android font scale cannot be emulated here, so large-text behavior of the chrome is unverified.
- Long unbroken word, CJK headline, Arabic headline: wrap without overflow in list and reader (39_rtl_list.png, 41_longword_reader.png). Arabic/Hebrew titles are right-aligned in the reader; mixed cards keep the source label left. Arabic body text in the reader not verified (my article override did not take effect).
- Privacy sheet (in app) and docs/privacy.html: otherwise thorough and match what the app does (relay, Near you, share link service, usage counts, reports, Kindle needs no request). Homepage: no stale price, analytics or update claims ("Updates arrive inside the app" matches).
- Widget and notification copy read: clear; only the Digest notice path is stale (C04).
- docs/tablet.html: loads the demo in a tablet frame on phone and desktop with no script errors.
- Sunday, Add a site and Settings home were out of scope here (others are editing them).

## Top 10 (one line each)
1. C01 Reading keys N/P turn pages, sheet says next/previous story.
2. C02 Kindle book prints the opening paragraph twice (PDF does not).
3. C03 Website and share page promise "dozens of themes, Typewriter to Deep Sea, neon"; the app has about 9.
4. C04 App and privacy page send people to Settings pages that no longer exist (Read aloud, Motion and Sound, Feeds and backup...).
5. C05 Tips describe a long-press menu (mark above, pause a site) that is gone; swipe tip ignores custom directions; emoji icons.
6. C06 Site and folder settings (refresh rate, pause, folder, delete) are reachable only by an unadvertised press-and-hold on touch.
7. C07 Kindle address typo closes the box; any email accepted.
8. C08 "Highlights" title cut to "Highlig..." on 390px; docked titles cut too.
9. C09 Near you results area is two rows tall, place names squeeze to one letter, two search boxes at once.
10. C11/C13 Story share has no picture option (card code unused) and swipe save/read has no Undo.
