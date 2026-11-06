# firstrun audit: brand-new user, first 10 minutes + empty/error states
App 1.272 (web stamp 2026.11.06h), served from www/ on port 8781, Chromium at 390x844 and 360x740. Fake feeds + no seeded storage for the setup walk. Screenshots are in `firstrun/` (named FRnn_*). Test scripts: scratchpad/audit/fr*.js.
Not reproducible in a browser (needs phone): the real Android feed path (no relays), TTS, widgets.

### FR01 · bug · The page title is cut off to "The Da…" / "All Sto…" / "Highlig…" on most pages
Where: top bar `#ttl` (`.ttl{overflow:hidden;text-overflow:ellipsis}`), the icon row in `.top` (www/index.html ~5034). Measured at 360: title needs 96px, gets 72px.
What a user sees/feels: As soon as the top bar has four icons (mark read, view switch, refresh, search), the page name is chopped: "The Da…" on Headlines/Brief/Sunday, "All Sto…" on All Stories, "Highlig…" on Highlights. Only Today and Saved/History/Stats happen to fit. It looks broken on the first screens a new user visits.
Recommend: Give the title priority: either drop the least-used icon into the "..." area on narrow phones (under ~400px), or shrink the title font one step when it would be cut. Smallest version: hide the view-switch icon below 400px wide (it is also in Settings), or let `#ttl` flex-shrink last.
Evidence: FR01_title_cut_headlines_390.png, FR01_title_cut_brief_360.png, FR01_title_cut_all_390.png, FR01_title_cut_highlights_390.png
Confidence: high

### FR02 · bug · Opening Search pushes its own button off the right edge of the screen
Where: search mode of the top bar, button `#sb` (aria-label "Search"). Measured: at 390 wide the button spans x=373..417, at 360 wide x=357..401, so 27px / 41px are off-screen. The text box ends at 367/351.
What a user sees/feels: A stray half-circle "(" is clipped at the right edge. The tap target for submitting/closing the search is mostly off-screen, so it looks glitchy and the thing you would tap is not there.
Recommend: When search is open, hide the other header icons (refresh, view switch) or make the input flex so the button ends at or before the 16px gutter.
Evidence: FR02_search_button_clipped_390.png, FR02_search_button_clipped_360.png
Confidence: high

### FR03 · polish · Two different things are called "Offline", and the status pill covers the content under it
Where: floating "Offline" pill under the top bar (shown when the phone has no connection) and the "Offline" filter chip at the end of the All Stories chip row.
What a user sees/feels: When offline, a small "Offline" pill floats over the top edge of the tab row / chip row and hides part of the chips. The same word is also a chip that filters to saved-ahead stories, which for a new user is always empty ("No stories are saved on this phone yet…") with no button to turn that on. The chip is also half cut off at the right edge at 390 and 360 (shows "O"), and nothing says it scrolls. On the Daily page being offline is otherwise silent until you press refresh ("You're offline").
Recommend: Rename the chip "Saved ahead" (or "Ready offline"), and move the pill into normal flow or just above the tab bar so it never covers anything. In the Offline empty state add a button "Turn on Get stories ready in advance" (it points to a setting but gives no way there).
Evidence: FR03_offline_pill_over_tabs.png, FR03_offline_chip_same_word.png
Confidence: high

### FR04 · looks · Tips slide in after a delay and shove the page down (including on screens where they make no sense)
Where: `tip()` / `tipPlace()` (~12862-12869); the card-swipe tip (4.5 s) and the "The Daily has four views" tip (1.5 s).
What a user sees/feels: A few seconds after arriving, a tip card inserts above the tabs/list and pushes everything down by about 100-150px, right when the user may be about to tap. The "four views" tip appeared while I was already looking at Sunday, i.e. after I had found the views. The swipe-a-card tip also appeared above an empty "No matches" search result where there is no card to swipe.
Recommend: (1) Do not show a tip over an empty/no-results state. (2) Reserve the space or overlay the tip (a thin strip pinned above the bottom tab bar) instead of inserting it above content. (3) Show the "four views" tip on first arrival at the Daily, not after tab changes.
Evidence: FR04_tip_pushes_down_sunday.png, FR04_tip_on_no_results.png
Confidence: high

### FR05 · bug · "Because you read TechCrunch" for a user who has read nothing
Where: Add a site > For you (reason line under each suggestion; builder near www/index.html 14235).
What a user sees/feels: On day one, with zero stories opened (Stats says 0), every suggestion says "Because you read TechCrunch". It is untrue and feels like the app is watching. The tile on the Add a site screen also says "Picked from what you already read".
Recommend: Change both to "Because you follow TechCrunch" and "Picked from the sites you follow". (If it is really reading-based when history exists, switch wording by whether history is empty.)
Evidence: FR05_because_you_read.png
Confidence: high

### FR06 · polish · A partial story offers the same action three times with three names
Where: Reader when only a preview could be fetched (~9455 and ~9900): chip "Open on site", button "Open site", and big button "Read original on techcrunch.com ↗".
What a user sees/feels: One screen, three buttons that all do the same thing, called "Open on site", "Open site", "Read original on…". Plus Save and Share. A beginner wonders if they differ. The same thing also happens for "couldn't reach the site".
Recommend: Keep the top chip as "Open on site" and the large bottom button; remove the middle "Open site" (or rename all to one phrase). Also the toast says Try "Open on site" while the button next to Share is "Open site".
Evidence: FR06_three_open_site_buttons.png
Confidence: high

### FR07 · polish · Stats on day one shows odd numbers and a wrong hint
Where: Stats page (`hbar`, `fmtMin` ~15685, "Put feeds in folders to see topics" ~15847).
What a user sees/feels: With 0 stories opened it says "under a minute read this week" (as if you read something). The empty chart shows seven day labels and no hint. "Top topics: Put feeds in folders to see topics" is shown even though setup already put the sites in a folder (Tech). "When you read: Steady through the day" is shown with no data. "Top sources" (sites elsewhere). The tiles are also big and bold for zeros.
Recommend: When 0 opened: show "0 min" / "Nothing yet", hide "Steady through the day", and word it "Top sites". For topics say "Topics appear after you read a few stories" when folders exist.
Evidence: FR07_stats_empty.png
Confidence: high

### FR08 · polish · Empty pages keep working-looking buttons that do nothing
Where: top bar on Saved, History, Highlights (mark-all-read check, view switch, refresh, search) and the filter chips on All Stories when there are no sites or all sites fail.
What a user sees/feels: On an empty Saved/Highlights page there are four icons in the bar: mark read (nothing to mark), view switch (nothing to switch), refresh (refreshing a saved list?), search. They look like they should do something; tapping gives nothing. With zero sites, the All Stories page still shows "For you / Top stories / Quick reads / Deep reads / Offline" over a "No sites here yet" message.
Recommend: Hide or disable mark-read, view switch and refresh on Saved/History/Highlights when empty; hide the chip row when there are no stories and no sites.
Evidence: FR08_dead_buttons_empty_highlights.png, FR08_dead_buttons_empty_saved.png, FR14_zero_sites_all.png
Confidence: medium (taps not exhaustively tried; icons are present and visually active)

### FR09 · looks · "Add a site" shows barely one result on a phone
Where: Add a site dialog `#dlg` at 390x844 and 360x740.
What a user sees/feels: The title, search box and hint text take the top ~270px, the footer (Cancel / Add site) and "More ways to add" bar take the bottom ~230px, so inside For you only about 1.3 suggestions are visible and the list fades out mid-card. On the main menu, "Near you" is cut in half by the fade at both sizes. Opening "More ways to add" grows the dialog and cuts the next item again. There is also a 50px empty band between the hint and the first option. Two "Add" actions (row "Add" and footer "Add site") sit on screen together.
Recommend: On phones make the dialog full height, remove the empty band, and put "More ways to add" as the last rows of the same list instead of a separate accordion. In suggestion lists hide the footer "Add site" button (it is for the typed address).
Evidence: FR09_add_site_cramped_360.png, FR09_add_site_more_390.png
Confidence: high

### FR10 · polish · "Manage your sites" calls them feeds, sources and sites in one screen; a dead connection is blamed on the site
Where: Manage dialog `#mng` (opened from "Check my sites"); tip text "Manage feeds in Settings" (TIPQ ~12853); toast "Unfollowed N feeds"; menu aria-label "Open feeds and sections"; "Purge limited feeds…", "Suggest feeds to clean up", "Retry feeds that aren't working", "Always open this source in site view".
What a user sees/feels: Title says sites, subtitle says "3 feeds · 3 need attention", checkbox says "source", and each red line says "Not loading: What TechCrunch sent wasn't a readable feed" even though the real problem here is that nothing could connect. For a non-developer "readable feed" is jargon and wrong when the phone has no network. Each failing site also has four buttons (Settings, Retry, Repair, Remove) with no hint which to try first; "Settings" is unclear.
Recommend: Use "sites" everywhere in user text (including tips, toast and the menu's accessible name). Reword the error: if no site at all answered, say "Couldn't connect. Check your connection, then Retry." Make Retry the highlighted button and tuck Repair/Settings under a "More" link.
Evidence: FR10_manage_feeds_wording.png
Confidence: high

### FR11 · polish · What's New for existing users leads with five setup changes they will never see
Where: `CHANGES` (www/index.html ~13831), dialog `#wn`.
What a user sees/feels: A user updating from an older version gets: "Setup is shorter…", "'Skip for now' is now 'Start with popular sites'", "Theme and font are chosen in Settings, not during setup", plus "outside helper sites for a feed" and "The privacy sheet…". They already finished setup, so the first screens of the list are noise, and "feed"/"helper sites" are jargon. The straight quotes ("Pick a few topics you like") do not match the curly quotes used elsewhere. (New users correctly never see the dialog; verified.)
Recommend: Order by what a reader notices, put the setup items last or drop them, and rewrite in plain words: "The web version only uses outside helper sites if CyPress's own connection fails." Use curly quotes.
Evidence: FR11_whatsnew_old_setup_items.png
Confidence: high

### FR12 · polish · Setup step 2 says "Pick a topic first" while the big edition cards above it already move you on
Where: `obRender` step 1 (~13763); bottom bar shows "Back / Pick a topic first / Next(disabled)".
What a user sees/feels: The screen offers four ready-made editions (tap one to start) and below them topics. The bar's grayed Next with "Pick a topic first" suggests the topics are the only way. Once a topic is picked, the bar shows three buttons side by side (Back, Start reading, Choose sites); at 360 wide they fill the whole bar. The line "Start reading uses 3 popular sites for each" refers to a button that does not exist until a topic is chosen. The step is called "Topics" in code but its heading says "Choose your first edition", and the first heading wraps to two lines.
Recommend: Change the grayed hint to "Pick an edition or a topic". Use only two bar buttons: Back and one primary ("Choose sites"); put "Start reading" as a text link under the topics.
Evidence: FR12_setup_step1_390.png, FR12_setup_pick_topic_360.png
Confidence: high

### FR13 · polish · "sources" vs "sites" and a plural that does not match one site
Where: Headlines counts ("3 SOURCES"), Brief ("3 sources", "TODAY IN NUMBERS"), Daily intro `DAYDEK` front: "Start here: these are stories several of your sources are covering." (~8307), Stats "Top sources".
What a user sees/feels: The product says "site" (Add a site, My Sites), but the Daily, Headlines and Brief say "sources". With one site followed the Daily still says "several of your sources are covering" (verified with one site: it printed that line). Also the Brief tab is called "Brief" but its heading is "The Briefing".
Recommend: Replace "sources" with "sites" in these strings; use "Start here: stories more than one of your sites are covering" and hide the line when only one site exists. Name the tab and the page the same ("Brief").
Evidence: FR13_sources_vs_sites.png
Confidence: high

### FR14 · polish · Zero sites: two buttons that both add sites, and a full chip row with nothing to filter
Where: "No sites yet" / "No sites here yet" empty states (Daily, All Stories).
What a user sees/feels: Buttons "Add a site" and "Pick sites". They sound the same (one opens the Add dialog, the other the setup picker). The All Stories view still shows its filter chips and the "Offline" chip above the message.
Recommend: One primary button "Add a site"; make "Pick sites" read "Browse popular sites" so the difference is clear. Hide filter chips when there are no sites.
Evidence: FR14_zero_sites_all.png
Confidence: medium (only checked the visual state)

### FR15 · missing · Before setup is done, the web app already fetches sites the user never picked
Where: first load with no storage: the app's default list (TechCrunch, The Verge, Ars Technica, BBC World) is fetched through a public relay (api.allorigins.win) while the welcome screen is still showing (requests logged before the first tap). The side bar behind the dialog also lists those five sites.
What a user sees/feels: Nothing visible, but a new user who has chosen nothing has already sent requests for four publishers to a third party. That sits badly with the "privacy-first, zero tracking" promise and the rule that every outside request be disclosed. After setup, the picked 3 sites replace them.
Recommend: Do not fetch until setup finishes (or start with an empty list on first run). Then privacy.html needs no extra explanation for these requests.
Evidence: request log in fr4.js output (4 allorigins requests before any tap). No screenshot.
Confidence: medium (web build only; the Android build goes direct and I could not run it)

### FR16 · polish · The reader's "..." menu has 17 choices at once
Where: Reader "..." sheet (`data-act` menu), 390x844.
What a user sees/feels: Save/Share/Listen/Text on top, then Hands-free reading, Playback settings, Full coverage, Find in story, Add to Up Next, Translate, Browser, Site view, PDF, Kindle, Mark as unread, Report junk text, Report a problem, More/Less like this. "Listen" and "Hands-free reading" read like the same thing; "Text" is the button the notes call "Aa". It needs scrolling for first-time readers.
Recommend: Fold PDF/Kindle/Browser into one "Send to…" row, merge Listen + Hands-free under Listen, and keep Report items in a "Something wrong?" row.
Evidence: r_menu.png (firstrun/r_menu.png)
Confidence: medium
