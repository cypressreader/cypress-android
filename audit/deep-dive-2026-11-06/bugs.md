# bugs: code defects, accessibility and copy sweep

Auditor: `bugs` (port 8786 not needed: all runs used file:// with tests/mock.js). Line numbers are `www/index.html` on branch claude/handoff-continuation-mx03wy as of 2026-11-06 19:10 (other agents are editing, so lines may drift by a few). Probe scripts are in `/tmp/claude-0/-home-user/adde917f-1a7e-5251-872b-5dbd81b028cb/scratchpad/bugsw/`.

Checked and found **no problem** (so nobody re-checks them): feed text cannot run code (a feed with 12 kinds of script-injection tricks in the headline, byline, category, caption, summary and full text, across Daily, All Stories, Headlines, site view, Saved and the open story, ran nothing); no listeners or timers pile up after opening and closing 6 stories, 6 tab switches or 4 Settings opens; stale search results and stale story fetches are blocked by tokens (`WS.tok`, `my!==tok`); the service worker update flow (`docs/app/sw.js`) is sound; read marks, history, positions and stats are all capped; date parsing handles US/EU/Asia zone names, 2-digit years and foreign weekday names; dialogs have names, modality and focus handling; no icon button lacks a name; no nested buttons or links; no images without alt; arrow keys, Home and End work on both tab bars; US spelling in the app is clean.

---

### B1 · bug · Mastodon and Bluesky accounts show no stories at all
Where: feed reader `parse()` 5987-6021 (the item builder has no fallback when `<title>` is missing), `finishList()` 5482 (`if(!a||!a.title)continue`); handle shortcuts in `socialUrl()` 14240 send `@name@server` and `name.bsky.social` here.
What a user sees/feels: The app invites you to follow people on Mastodon and Bluesky (type their handle), but their posts have no headline, so every post is thrown away. The site shows up empty ("No stories found in this feed yet"), and on refresh the app goes looking for the account on rss2json and Google/Bing News instead.
Recommend: In `parse()`, do what the JSON-feed reader already does: when an item has no title, use the first ~90 characters of its text (`trimWords(text,90)`) as the title. One change at the `title:` field.
Evidence: in-page `parse()` of a 2-post Mastodon-style feed returned 0 stories; the same posts as a JSON Feed returned 1 with title "A titleless post body" (probe `t1.js`).
Confidence: high

### B2 · bug · A damaged library is silently replaced with four sample sites, and the damaged copy is erased
Where: start-up 5183-5186 (`JSON.parse` fails → `S=null` → default TechCrunch/Verge/Ars/BBC set), first `save()` a few seconds later overwrites `folio`.
What a user sees/feels: If the stored library is ever cut short (phone killed mid-write, storage glitch), the app opens with TechCrunch, The Verge, Ars Technica and BBC World instead of their sites, with no message, and within 3 seconds the damaged original (which still held most of their sites and saved stories) is gone for good.
Recommend: When the parse fails but `folio` is not empty, first copy the raw text to `folio-bad` (or IndexedDB), start with an empty list (not the sample sites), and show a toast "Your library couldn't be read. Restore from a backup in Settings > Sites & backup." Two lines.
Evidence: seeded `folio` with a truncated JSON holding "My Precious Site" → after load, feeds = 4 sample sites and `folio` already rewritten; no `folio-bad` key exists (probe `t11.js`).
Confidence: high

### B3 · bug · After midnight the Daily is labeled with tomorrow's evening edition
Where: `edKey()` 8236 (edition day rolls at 5 AM) vs `edition()` 14280, `shortDate()` 14281 and the issue number, computed separately in 10 places (7696, 7722, 8351, 8382, 15486, 15500, 15752, 16164, 17064, 17561, plus `exIssueTag` 14700), all using the calendar day.
What a user sees/feels: Reading at 1:30 AM on Friday, the cover says "Friday Evening Edition · November 6 · No. 310", but it is still Thursday's evening issue; at 5 PM Friday a second, different "Friday Evening Edition" appears. Separately, in summer time the issue number is one behind between midnight and 1 AM (No. 181 on July 1 instead of 182), because the day count is done in milliseconds across a clock change.
Recommend: One helper `edDate()` that returns the edition's date (yesterday before 5 AM, as `edKey` already does) and one `issueNo(d)` using `Date.UTC(y,m,d)` differences; make the cover, mastheads, section bands, PDF export and split-screen sheet call them.
Evidence: B3-friday-evening-at-1-30am.png (clock fixed at 2026-11-06 01:30 New York: `edKey`=2026-11-5e, cover "FRIDAY EVENING EDITION · NOVEMBER 6 · 310"); node check of the day-count formula in New York and London: 2026-07-01 00:30 → 181 (true 182).
Confidence: high

### B4 · bug (accessibility) · Settings loses its name for screen readers after it is opened once
Where: `setBuild()` 10617: `sh.querySelector('h2').id='settitle'` renames the heading that `<dialog id="set" aria-labelledby="set-t">` (5050) points to.
What a user sees/feels: TalkBack announces just "dialog" when Settings opens (from the second open on, and also the first, since the rename happens before the dialog shows), instead of "Settings, dialog".
Recommend: Add `set.setAttribute('aria-labelledby','settitle')` next to the rename (or stop renaming the id).
Evidence: aria reference check: before opening Settings `#set-t` exists ("Settings"); after opening, `DIALOG#set aria-labelledby=set-t MISSING` on every screen (probe `t6.js`).
Confidence: high

### B5 · bug (accessibility) · Tapping a tab sends screen-reader focus back to the top of the page
Where: tab bars `allSeg`/`bmSeg` 13461-13462; the focus fix exists only in the arrow-key handler 16763-16768 (`requestAnimationFrame(...m.focus())`), not for taps or clicks.
What a user sees/feels: On The Daily (Today/Headlines/Brief/Sunday) and All Stories (For you/Top stories/...), a TalkBack user who double-taps a tab lands back on "Skip to stories" at the top of the screen and has to swipe all the way back to the tab bar, every time. Keyboard arrows are fine.
Recommend: Move the "focus the new copy of the chosen tab" step into the shared tab click path (any click on `[role=tab][data-bm]`), so taps, Enter and arrows all keep focus on the tab. Also retry once after the render finishes, not only on the next frame (one fast End→Home run lost focus).
Evidence: 9 of 9 clicks on tabs left `document.activeElement` = BODY "Skip to stories" (probe `t9.js`); arrow keys kept focus in 18 of 19 presses (`t7.js`, `t8.js`).
Confidence: high

### B6 · polish (accessibility) · Heading levels are flat or upside down, so heading navigation is confusing
Where: All Stories sections `listFlow()` (section bands `<h3 class="dsh wsec">` 7824, story cards also `<h3>`; day bands `<h4 class="lr-h">` 7835 come after `<h3>` story titles); All Stories has both an `<h1>` and an `<h2>` reading "All Stories"; Settings preview jumps h2 → h5 ("A story headline in your style").
What a user sees/feels: Jumping by headings in TalkBack, "Last hour" sits at the same level as every story under it, and "Yesterday"/"Latest" sit below the stories they introduce. The section heading also reads its buttons aloud: "Last hour, 10 stories, Mark read".
Recommend: Section and day bands one level above cards (h2 bands, h3 cards), drop the duplicate h2 on All Stories, move the Mark read/fold buttons out of the heading element (beside it), make the preview headline an h3.
Evidence: heading list ALL: H1 All Stories · H2 All Stories · H3 Last hour10 storiesMark read · H3 Alpha story 1 ... (probe `t12.js`); Settings: "h2 -> h5".
Confidence: high

### B7 · polish · A date written without a time ("2026-11-06") is read as 7 PM the day before in the Americas
Where: `pdate()` 5484 (`Date.parse('2026-11-06')` is UTC midnight by the JS spec).
What a user sees/feels: Sites that give only a date (some JSON feeds, sitemaps, learned pages) have their stories filed under "Yesterday" or shown as "19h" old in the morning in the US, and they can miss "Since this morning".
Recommend: In `pdate`, if the string is exactly `YYYY-MM-DD`, parse it as local noon (`new Date(y,m-1,d,12)`), clamped to now.
Evidence: node, New York zone: "2026-11-06" → 2026-11-06T00:00Z = Nov 5, 7 PM local; every other format checked parsed right.
Confidence: medium (parsing verified; not seen on a live site)

### B8 · polish · Headlines sent with escaped tags show the raw tag text
Where: `cleanT()` 5269: the tag-stripping pattern needs a space after the tag name, so `<img/src=...>` or `<br/>` written as text survives.
What a user sees/feels: Rare, but when a site double-escapes a tag in a headline, the card reads `<img/src=x ...> headline...` literally. It is shown as text (safe), just ugly.
Recommend: Strip with `/<\/?[a-z][^>]*>/gi` (any characters up to the closing bracket) in both passes.
Evidence: XSS probe headline came through as "<img/src=x onerror=...> headline one is long" (shown as text, nothing ran).
Confidence: high

### B9 · polish (copy) · Copy sweep: "feed" where it means site, two Title Case outliers, two plural slips
US spelling, "RSS", "rail", "Halcyon", "free" and jargon are clean in user-facing text (hits were code comments, CSS class names, publisher names or diagnostic logs). The app mostly says "site", but these user-facing strings still say "feed":

| String | Line | Suggested replacement |
|---|---|---|
| aria-label "Open feeds and sections" | 5034 | "Open sites and sections" |
| Settings button "Manage feeds" (row is titled "Manage your sites") | 5061, 10425, 10444 | "Manage sites" |
| "Import or export feeds" / "Import or export your feeds file" | 10425, 10444 | "Import or export sites" / "...your list of sites" |
| "Remove feed" | 5073, 6212 | "Remove site" |
| "Add feed" (button) | 11429 | "Add site" |
| "Couldn't add that feed. Try again." | 11320 | "Couldn't add that site. Try again." |
| "No stories found in this feed yet" | 11334 | "No stories from this site yet" |
| "Couldn't find a new feed" / "Fixed X: its feed moved" | 12816, 14263 | "Couldn't find the site's new address" / "Fixed X: the site moved its address" |
| "Feed settings" | 12824 | "Site settings" |
| "No feeds yet." | 12752 | "No sites yet." |
| "⚠ Limited Full-Text Feed: This publisher uses a paywall..." | 12882 | "Short stories only: this site uses a paywall or shares only summaries..." (also drops the Title Case and warning sign) |
| "All your feeds deliver clean full-text stories." | 12887 | "All your sites send whole stories." |
| "Every site in the Add a feed list" | 12581 | "Every site in the Add a site list" |
| "Swipe in from the left edge to open your feeds" / "Tip: with this many feeds, folders help. Manage feeds..." | 12851, 12853 | "...to open your sites" / "with this many sites... Manage sites..." |
| "Your feeds stay under the menu button" | 10383 | "Your sites stay under the menu button" |
| "Feeds in this folder" / "N feeds" | 10924 | "Sites in this folder" / "N sites" |
| "That file has no feeds in it." / "doesn't look like a list of feeds" | 11681, 11666 | "...no sites in it." / "...a list of sites" |
| "Feeds and folders are now A to Z" | 12320 | "Sites and folders are now A to Z" |
| "Feeds list width reset" | 16170 | "Side bar width reset" |
| "N unread in all your feeds" | 8572 | "N unread across your sites" |
| "Feeds last updated at 7:12 PM" | 10389 | "Sites last checked at 7:12 PM" |
| "Only feeds I choose" / "Every feed in another language" | 10560 | "Only sites I choose" / "Every site in another language" |
| "Put feeds in folders to see topics." | 15847 | "Put sites in folders to see topics." |
| "You're offline. Showing what came with the feed." | 9872 | "You're offline. Showing the part the site sent." |
| Settings page title "How It Behaves" (others are sentence case: "Stories & loading", "Sites & backup") | 10447 | "How it behaves" |
| Settings heading "Sync Between Devices" | 10461 | "Sync between devices" |
| "Longest read: 1 minutes." (Almanac, when the longest is 1 min) | 13590 | use `MIN(D.lg.m)` |
| "Catch-up: 3 stories, about 1 minutes" | 17690 | use `MIN(Math.max(1,Math.round(mins)))` |

Also mixed "&" vs "and" in Settings page names ("Stories & loading", "Sites & backup" vs "Motion and battery"): pick one.
Evidence: string extraction script `strs.js` over the app's script and markup (comments excluded).
Confidence: high
