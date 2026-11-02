# F: Fresh-eyes cross-cutting review (production 1.231, web stamp 2026.11.02f)
Method: Playwright against https://cypressreader.com/<family-path>/ (phone 390, 360x740, fold 884x1000, landscape 844x390; light and dark; themes Cypress, Newsprint, Black & White, Coast, Sepia Rosewood, Aurora), axe-core 4.10.2 on Daily (4 tabs), All Stories, Settings and its sub-pages, reader; keyboard walk-throughs; copy greps.
Clean results (no finding): no horizontal page scroll or clipped-off-screen element on any of the 4 viewports across Daily tabs, All Stories, Settings sub-pages and reader; no UK spellings, "RSS", "rail" or "free" promises in user-facing app strings (only code comments); pluralization templates are guarded; Settings, Add a site, Shortcuts dialogs trap focus, close on Escape and return focus; reader "More" menu traps focus and returns it. Note: "Pure Black" and "E-ink" are not selectable themes in 1.231 (the app offers Cypress, Newsprint, Black & White, Coast, Sepia Rosewood, Aurora); S.theme='oled' falls back to Cypress.

### F1 Cloudflare Web Analytics script is injected on the live site, contradicting the privacy page
- Status: NEW · Severity: Must-fix · Verified: CONFIRMED
- Where: https://cypressreader.com/ , /privacy.html and /<family-path>/ (edge-injected, not in the repo); docs/privacy.html says "no analytics script, or any other script that counts visits" and "The home page makes no third-party requests".
- Now: in a real browser, every page requests static.cloudflareinsights.com/beacon.min.js. On the home page it is not blocked (no CSP), so a visit-counting third party loads. In the app and on privacy.html the page CSP blocks it, producing a console error on every launch. curl of the raw HTML shows nothing, so it is added by Cloudflare at the edge.
- Should: turn off Web Analytics / automatic setup in the Cloudflare dashboard for the zone (and Network Error Logging if not wanted); re-test that the home page makes zero third-party requests, so the privacy claim is true for a Play reviewer.
- Shots: audit/shots/F/home-site-phone-day.png

### F2 Daily cover lead headline shrinks to body-text size, smaller than the quote beneath it
- Status: NEW · Severity: Must-fix · Verified: CONFIRMED
- Where: The Daily > Today cover (`.cfit` in `.dcv-lead`, fitted by fitHero); seen at 360x740 (BBC story, 13.9px vs 27.7px on the same story at 390) and at 390 (The Verge story "Xbox's former COO has 'serious concerns'...", about 14px).
- Now: when the lead headline is long, the fitter shrinks it to roughly 14px while the pull quote under it stays about 24px italic. The main headline of the front page reads as the smallest, weakest text on the screen. 360 wide is the commonest Android width, so many first impressions get this.
- Should: set a floor (for example 22px) and trim or clamp the quote/dek first, or let the headline wrap to 4 lines.
- Shots: audit/shots/F/daily-360-day.png, audit/shots/F/F-searchtab-from-daily-phone-day.png

### F3 Black & White theme: "Headlines" tab text overflows into "Brief"
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: Daily tab strip `#mtabs`, theme eink ("Black & White"), 20px tabs; 360 (cell 83px, text 105px) and 390 (cell 91px, text 105px).
- Now: "Headlines" is wider than its cell and runs straight into "Brief" ("Headlines Brief" reads as one phrase); Today is bold so the row also jumps in weight.
- Should: smaller tab font in this theme or let the strip scroll/shrink to fit; keep the bold-vs-medium width change from shifting neighbors.
- Shots: audit/shots/F/F-eink-tabs-360-day.png, audit/shots/F/F-eink-tabs-390-day.png, audit/shots/F/themes-dark-montage.png

### F4 Closing the reader with the keyboard drops focus to the page top instead of the story that opened it
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: reader `#rd` (role=dialog) close path; opener was a Daily story link (`a.cl`). Also, while the reader is open the Tab loop leaves it to the toast button ("Change them") and the page body.
- Now: Escape closes the reader but document.activeElement becomes BODY; the keyboard user restarts from "Skip to stories". (Other dialogs and the reader More menu do return focus.)
- Should: remember the opener and focus it on close (hard rule in CLAUDE.md section 7); keep toasts out of the modal Tab loop or make the reader inert-around.
- Shots: audit/shots/F/reader-phone-day.png

### F5 Collapsed search box is an invisible keyboard stop
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: `#q` inside `#srch` in the top bar (390 and 884 wide): width 0, opacity 0 until opened.
- Now: Tab lands on "Search stories" with no visible focus ring and nothing appears (focus does not expand it); a screen reader also announces an edit field that cannot be seen.
- Should: `tabindex=-1`/`inert`/`visibility:hidden` while collapsed, or expand on focus.
- Shots: audit/shots/F/F-search-focus-phone-day.png

### F6 Bottom "Search" tab: title collapses to "T…" / "Sa…" and the tab is not highlighted
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: bottom bar Search button; top bar title and search field.
- Now: tapping Search opens a small inline field in the top bar and ellipsizes the screen title to "T…" (Daily) or "Sa…" (Saved). The bottom bar keeps "The Daily"/"Saved" highlighted, not Search. From Saved it silently searches only Saved and keeps showing "Nothing saved yet". It does not feel like going to a Search screen.
- Should: hide the title (or the check-all button) while searching; show Search as the active tab; say what is being searched ("Search saved stories") or search everywhere.
- Shots: audit/shots/F/F-searchtab-from-daily-phone-day.png, audit/shots/F/msse.png

### F7 Light / Dark / Dynamic choice uses aria-pressed on role="radio"
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: Settings > Look, `button[data-sch]` (www/index.html:10553). axe: aria-allowed-attr, critical, 4 nodes, light and dark.
- Now: radios also carry `aria-pressed`, which is not allowed on role=radio; screen readers may announce both states.
- Should: keep `aria-checked` only (radiogroup pattern), drop `aria-pressed`.
- Shots: audit/shots/F/settings-Look-phone-day.png (see settings-* files)

### F8 Landmark and separator markup errors (axe)
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: feeds-list resizer `#sbh` (www/index.html:4983, role=separator with tabindex but no aria-valuenow: axe critical aria-required-attr; a focusable separator is a slider and needs valuenow/min/max); `<aside role="navigation">` (aria-allowed-role); `.drg` landmark with no unique name (Daily, dark); heading-order skips in Settings sub-pages (`.spsm h5`, `#sp-stories`, `#sp-sites`, `#sp-about` h4 after h2).
- Now: appears on every screen scan; harmless to sight, noisy to a reviewer running an accessibility scan.
- Should: add valuenow (or role=slider), use `<nav aria-label>`, name the second landmark, fix heading levels.
- Shots: none (axe output)

### F9 Reader top bar: spoken names differ from visible labels, buttons are small
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: reader header on landscape and fold: visible "Listen" has aria-label "Read aloud"; visible "Save" is "Save story". Buttons 50x38 with 9px labels.
- Now: voice control ("tap Listen") fails; 9px caption and 38px height are below comfortable size.
- Should: accessible name starts with the visible word ("Listen to story"), buttons at least 44px high, labels at least 11px.
- Shots: audit/shots/F/reader9s-land-day.png, audit/shots/F/mreader.png

### F10 Phone landscape: the first reader page shows only a small photo
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: reader at 844x390 (still the same 9 seconds after opening). Header takes about 85px, the footer line "BBC WORLD · RUSSIAN BOMBING KILLS 24 PEOPLE… · 1" overlaps the progress rule.
- Now: page 1 is a 190px photo centered in an otherwise blank panel; no headline or text is visible until the reader swipes; the progress rule runs through the footer caption.
- Should: in short landscape show headline and first lines beside the photo (or hide the photo), move the caption off the rule.
- Shots: audit/shots/F/reader9s-land-day.png

### F11 Many controls are under 44px
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: feeds drawer: color dot `.frc` 10x10, folder chevron 26x26, feed rows 22px tall, resizer 9px wide; Daily: "Catch me up" and "Surprise me" 28px high, "N stories left" 34px, toast action "Change them" 31px; Settings: switches 52x32, segmented buttons (Simple/Full/Everything, Automatic/Pages/Scroll, Calm/Off) 34px, chevron-only rows 24x48.
- Now: easy to mis-tap, especially the 10px color dot beside a feed name. ("Bigger buttons" exists as an option but is off by default.)
- Should: 44px hit areas (padding or `::after`) without changing the look.
- Shots: audit/shots/F/after-skip-phone-day.png, audit/shots/F/drawer-phone-day.png

### F12 Contrast below 4.5:1 in several themes
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: All Stories "Developing" label `.wtr-k` 11px (4.18 Cypress light, 4.23 Coast light, 4.49 Rosewood light, passes in dark); Headlines tab button icon `button[data-edin="edin-front"] > i` 13px (2.97 Cypress, 3.08 Newsprint, 3.15 Coast, 3.39 Rosewood light, 4.35 Rosewood dark); picture-less hero card in dark Black & White, Newsprint and Aurora: white text on a mid-gray or green tile (source name, section, byline, time) 3.1 to 4.5. Look preview cover date 1.15 and Gazette cover lines 2.1 (preview thumbnails only).
- Now: small text is hard to read in sunlight or for low vision; scanners flag them.
- Should: darken the label/icon colors, and darken the tile or use dark text when the tile is mid-tone.
- Shots: audit/shots/F/theme-eink-all-dark.png, audit/shots/F/all-phone-day.png

### F13 Jargon in settings: "relay", "worker", "OPML", Cloudflare steps
- Status: NEW · Severity: Should-fix · Verified: CODE
- Where: www/index.html:5013 ("Move your feeds to or from another reader (OPML file)"), 5023 ("Your own sync relay.", "goes through a relay"), 5032-5038 (dialog "Relay setup", "A relay is a tiny service", "Paste your worker address (it ends in workers.dev)", "add a KV namespace", "Your relay is running older code"), 9861 ("Set up a relay"), 12913 and 13640 messages.
- Now: Sites & backup uses terms the copy rules forbid; non-technical users hit them in Settings.
- Should: plain words (for example "your own sync service", "your address"), drop "OPML" for "a list of your sites", keep the technical steps behind a "For tinkerers" link.
- Shots: audit/shots/F/settings-Sitesbackup-phone-day.png

### F14 Native dialogs have no accessible name
- Status: NEW · Severity: Should-fix · Verified: CODE
- Where: www/index.html:4991-5032: `<dialog id=dlg|set|mng|cvpk|kbh|foset|fset|pwd|cln|tips|pkd|sf|rl>` have a visible `<h2>` but no `aria-label`/`aria-labelledby` (only `prv` and `shr` have one; `rd` and `mn` are fine).
- Now: TalkBack/screen readers announce "dialog" without the title.
- Should: `aria-labelledby` pointing at each heading (focus trap and Escape already work).
- Shots: none

### F15 First launch contacts four public proxy sites and logs a stream of console errors
- Status: NEW · Severity: Should-fix · Verified: CONFIRMED
- Where: fetchText1 hedging (www/index.html:5349-5356), web build, first 12 seconds with default feeds.
- Now: besides the CyPress fetcher, requests go to api.allorigins.win, corsproxy.io (401), api.codetabs.com and morss.it (CORS blocked) for the default sites, plus 404s from cypressreader.com/feed for wp-json story URLs. Each starts 650ms after the first route if it has not answered, so the feed list is shared with up to four outside services on any slow start. They are named on privacy.html, but there were 7 to 20 console errors per launch. Native app behavior not tested (NEEDS-PHONE).
- Should: confirm the native build never uses them; on web, make them opt-in or longer-delay; stop probing wp-json when the fetcher 404s.
- Shots: none (see console)

### F16 "Tip: The Daily has four views" shows on All Stories, Brief and Sunday
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: tip card above the All Stories title and above Brief/Sunday content (390, 360, fold, landscape).
- Now: a tip about the Daily tabs sits on screens where the tabs are not what you are reading, and pushes the content down on every visit until dismissed.
- Should: show it once on Today only, or auto-dismiss after the first view.
- Shots: audit/shots/F/theme-eink-all-dark.png, audit/shots/F/m360.png

### F17 Truncated labels in Settings header and summaries
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: Settings hub: "Evening Edition · Cypre…" (360, fold, landscape), "Clean co…", "ready ahead on Wi-…".
- Now: the card title and sub-lines are cut with an ellipsis even on a 390 phone.
- Should: wrap to two lines or shorten ("Cypress theme").
- Shots: audit/shots/F/reader-360-day.png (this is the Settings screen), audit/shots/F/settings-phone-day.png

### F18 Onboarding sample tiles: cut-off labels and an empty ring
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: first screen of onboarding: "EXAMPLE · PLA…", "EXAMPLE · HEAL…"; an empty circle before each label looks like a loading spinner; gold small caps on blue/brown/green tiles (low contrast).
- Now: first impression looks slightly unfinished. (Onboarding is covered by another reviewer; listed only for the visual.)
- Should: shorter labels ("EXAMPLE"), fill or remove the ring, lighter label color.
- Shots: audit/shots/F/home-phone-day.png

### F19 Add a site: option cards cut off at the bottom of the list
- Status: NEW · Severity: Nice-to-have · Verified: CONFIRMED
- Where: Add a site dialog at 390x844; the "Near you" card is sliced mid-card above "More ways to add", with no scroll hint.
- Now: looks clipped; the options list scrolls inside a fixed box.
- Should: show a fade/scrollbar hint or give the list room.
- Shots: audit/shots/F/msse.png

### F20 Public insights page names themes that do not exist in the app
- Status: NEW · Severity: Nice-to-have · Verified: CODE
- Where: docs/insights.html:132 theme labels `halcyon:'Halcyon'`, `oled:'Pure Black'`, `eink:'E-ink'`, `rosewood:'Rosewood…'`; the app's picker says "Cypress", "Black & White", "Sepia Rosewood" and has no Pure Black.
- Now: "Halcyon" appears as a visible label outside the app; names differ from what users see.
- Should: use the app's names (THEME_NAMES, www/index.html:15947).
- Shots: none
