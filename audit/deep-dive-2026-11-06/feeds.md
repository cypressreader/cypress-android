# feeds — browsing screens and their look (auditor: feeds, port 8783)

How I tested: the real app (`www/index.html`, version 2026.11.06h / 1.272) in Chromium with mock sites seeded with realistic and ugly data:
Courier (40 stories, all with photos), Ledger (30, no photos), Solo (1 story), Wire (200 stories, every other one with a photo),
Longform (20, very long headlines, no summaries, no site description), Brokenpix (15, every photo returns 404). Photos are
generated test pictures with a face in the upper third and a grid, so crops can be judged. Widths 360, 390, 412, 768, 1024,
Fold inner 1812x2176, landscape 844x390; card sizes Compact/Medium/Large; Cards/Columns; list view.
Themes: `THEME_NAMES` has 43 entries but 36 are retired and silently map to a survivor (`POLISH_RETIRED`, line 5197); the picker
offers 7: Cypress (`halcyon`), Coast, Newsprint (`press`), Sepia Rosewood, Black & White (`eink`), High Contrast, Aurora. Each
was checked in light and dark (`S.sch`), which goes through `twinApply`.
Contrast was measured two ways: computed colors on flat surfaces (WCAG formula, opacity included), and on photos by
screenshotting the area with the text hidden. Screenshots are in `audit/feeds/` (scale 2 unless noted).
Theme comparison strips: `THEMES_daily_strip.png`, `THEMES_all_strip.png` (7 themes, light row on top, dark row below, scale 1).

---

### F01 · bug · Section titles slide over the docked Daily tabs while you scroll
Where: The Daily (Today) and Headlines, every theme, phone and tablet. CSS `www/index.html` line 3010 `.bmseg.dtabs{position:sticky;…z-index:4}` and line 4341 `#grid .dsh{position:relative;z-index:4}`. Same z-index, and the heading comes later in the page, so it paints on top.
What a user sees/feels: as "THE FRONT PAGE" or "Next up" scrolls up under the Today / Headlines / Brief / Sunday bar, the big heading is drawn across the tab labels for a moment ("Today" and "THE FRONT PAGE" printed on top of each other). It looks broken every time you scroll the Daily.
Recommend: give the docked tab bar a higher layer than section headings (e.g. `.bmseg.dtabs{z-index:6}`). One-line CSS change; nothing else moves.
Evidence: `F01_heading_over_tabs_phone.png` (390, scrolled 960 px). Reproduced at 1024 ("Next up" over the tabs) and in all 7 themes (contact sheets).
Confidence: high

### F02 · bug · The page title is cut to "The Da…" / "All S…" on phones
Where: top bar `#ttl` in `.top`; four icon buttons (Mark all read `#mr`, Cards/Columns `#vw`, Refresh `#ref`, Search `#srch`). `#vw` is hidden only on Today (`render0`, line 6573), so every other screen loses ~44 px.
What a user sees/feels: on Headlines, Brief, Sunday, All Stories (after scrolling) and site pages the title shows "The Da…", "All Sto…", "Longf…". Measured title room: 72 px at 360 wide, 102 px at 390 (needs 103 for "The Daily", a 1-pixel miss), 61 px for a site name at 390. The masthead is the first thing a reader sees and it looks truncated.
Recommend: on phones, show at most three icons in the bar. Smallest version: move "Mark all as read" (already in each section's "Mark read") or the Cards/Columns toggle into the "…" / view menu below 480 px. Alternative: let the title shrink its font one step (e.g. 22→19 px) before it ellipsizes.
Evidence: `F02_title_truncated_390.png`, `F02_title_truncated_360_all.png`; measurements in method notes (scrollWidth vs clientWidth: 96/72 at 360, 103/102 at 390).
Confidence: high

### F03 · looks · Daily cover: a long headline turns its column into a tower of one-word lines and spills off the cover
Where: The Daily cover `dayCoverHtml` (line 15480), the three bottom columns ("After dinner / Late word / And then"). Also the moon art overlaps the source label.
What a user sees/feels: when a story in a cover column has a long headline, it wraps word by word down the cover (12+ lines), the long word is clipped ("Supercalifragilisti"), and the cover runs past its frame and the Play Daily bar. The moon disc also sits behind the left edge of the source label ("BROKENPIX").
Recommend: clamp the column headlines to 3 lines with an ellipsis (`-webkit-line-clamp:3`) and allow breaking only real long words; keep the moon clear of the label (move it up/right, or start the label below it). Before: tower of text. After: three tidy lines per column, all columns the same height.
Evidence: `F03_cover_column_tower.png` (390).
Confidence: high

### F04 · looks · On phones the lead story's headline is the same size as the smallest story
Where: CSS line 4338 `.card h3 … font-size:calc(clamp(1.15rem,4vw,1.7rem)*var(--csz))`. Below about 460 px wide, 4vw is under the 1.15rem floor, so every headline is exactly 18.4 px. The bigger lead size (line 4778) only applies to `.nr-hero`, not to the Front Page lead (`.nr-lead`).
What a user sees/feels: the Front Page lead has a photo 330 px tall but its headline is 18 px, the same as the small rows below it. Nothing tells the eye "this is the big one". Measured: min = max = 18.4 px for all story headlines on the Daily at 360 and 412.
Recommend: give lead/hero cards their own phone size, e.g. `.card:is(.nr-lead,.lead,.nr-hero) h3{font-size:calc(1.6rem*var(--csz))}` (about 26 px), keep rows at 18 px, and use 15–16 px for third-level items. Three clear steps instead of one.
Evidence: `F04_lead_vs_row_same_size.png` (390).
Confidence: high

### F05 · bug · A site page shows three different numbers for the same thing
Where: single-site and folder pages, masthead (`mastHtml` / site cover), the "Averages … · N waiting" line, and the list meta line. `render0` caps the list (`cur.slice(0,80)`, then grouping), the masthead counts all unread.
What a user sees/feels: Wire (200 stories) says "62 UNREAD" on the cover, "62 waiting" under it, and "70 stories · 70 unread" one line below. The Tech folder says "61 UNREAD", "61 waiting", "55 stories · 50 unread". It reads like an error and makes the reader doubt the counts.
Recommend: show one count. Drop the "N stories · N unread" line on site/folder pages (the cover already has it), or say what it is ("Showing the newest 70").
Evidence: `F05_counts_disagree.png` (Wire site, 390).
Confidence: high (cause of the gap: medium)

### F06 · looks · Photo crops cut people in half on wide and narrow frames
Where: story card images (Fold/tablet single-column cards in All Stories, Compact thumbnails, Daily cover, Sunday cover). Images are center-cropped (`object-fit:cover`, center position).
What a user sees/feels: on the Fold, All Stories cards are about 1450 x 170 px, so a normal 3:2 photo becomes a thin strip: only the eyes of the face survive, and the body is gone. On the Daily and Sunday covers (tall frames) a landscape photo keeps only its middle 40%, so a subject left or right of center is sliced off. Compact square thumbnails do the same to off-center subjects.
Recommend: (1) never let a card photo be wider than about 2:1 (`aspect-ratio:16/9` or `max-height` relative to width on wide cards); (2) bias crops upward where faces usually are: `object-position:50% 30%` for card photos. Before: "eyes in a letterbox". After: the full head and shoulders.
Evidence: `F06_fold_photo_bands.png` (1812x2176, scale 1), compact and cover crops visible in `F03_cover_column_tower.png` and `F07_download_badge_over_text.png`.
Confidence: high

### F07 · bug · The "saved for offline" badge sits on top of the "Also from …" line
Where: story rows with an image on the left (Daily Next up, Compact size, Headlines rows); `span.rdy.pop` is absolutely placed at the bottom right and the `.also` line runs the full width under it.
What a user sees/feels: "Also from Longform, Wire, L[icon]ger": the round download icon covers part of the site names. On Headlines it covers the word "effect" in the summary.
Recommend: reserve room for it (`padding-right:28px` on `.also` and the summary in cards that show `.rdy`), or put the badge on the time line, which has space to its right.
Evidence: `F07_download_badge_over_text.png` (measured: badge 262–284 x 483–505, also-line 112–376 x 482–500), Headlines example visible in `F08_noimage_lead_block.png`.
Confidence: high

### F08 · looks · A lead story without a photo becomes a huge blank green slab with a giant letter
Where: no-image / broken-image cards (`.noimg`, the big `data-ini` letter) when they land in a lead or hero slot: Headlines "The front page", Daily front page, All Stories first card.
What a user sees/feels: a 300–450 px block of plain gradient with a large "B" in the corner, and the headline in small type at the bottom. It looks like a photo that failed to load (it often is). On tiles the big letter also runs into the headline.
Recommend: when the lead has no photo, lay it out as a type-only lead: no image box, a big headline (about 30 px), the summary as a deck, a thin rule. Keep the letter only in small thumbnails.
Evidence: `F08_noimage_lead_block.png` (Headlines, 390), landscape `F13_landscape_chrome.png`.
Confidence: high

### F09 · polish · Time stamps come in five formats, one of them reads like "1 million"
Where: card times (`27m`, `1h`), read times (`2 min read`), Play Daily bar (`' left'+' • ~'+mins+'m'`, line 7788), site-page kicker "The lead · 1m ago" shown in capitals, list rows "COURIER · 2 MIN 9m", Sunday "in 9 h 27 min".
What a user sees/feels: "36 stories left • ~106m", "THE LEAD · 1M AGO", "2 MIN 9m" next to each other. "1M AGO" reads like one month or one million, and "~106m" makes you do maths.
Recommend: one style everywhere: "27 min", "1 hr", "1 hr 45 min", "2-min read"; never uppercase a time (wrap times in a span with `text-transform:none`). Use "·" consistently (the Play bar uses "•").
Evidence: `F09_time_format_1M_AGO.png`; full list from the page in method notes.
Confidence: high

### F10 · looks · On 768–1024 px tablets cards get squeezed to 2–3 words per line
Where: Headlines two-column rows with a side photo (768), Daily front page tiles (1024), Next up rows.
What a user sees/feels: "Council weigh / a plan for / cheaper rent" and "Officials said / the..." in narrow columns next to a photo, while the "+2 SOURCES" badge drops onto its own line. At 1024 the three tiles under the lead have headlines at 26 px in ~130 px columns, so each line holds two words.
Recommend: below about 260 px of text width, put the photo on top instead of beside the text, or scale the headline down with the tile width (container query units, e.g. `font-size:clamp(17px,9cqi,24px)`).
Evidence: `F10_768_headlines.png`, `F10_tablet_squeezed_tiles.png`, `F10_tablet_headlines_squeeze.png`.
Confidence: high

### F11 · looks · On the Fold the browsing screens use a single giant column, with very long lines and gaps
Where: All Stories and site pages at 1812x2176; Daily front page.
What a user sees/feels: All Stories cards stretch the full 1450 px; the summary runs as one ~180-character line (comfortable reading is 60–75). On the Daily, "Next up" ends early and leaves an empty block beside the three tiles; the cover is a 720 px poster with empty cream on both sides while the tabs above spread across 1500 px.
Recommend: on wide screens use 2–3 columns for All Stories (the Headlines page already does), cap text inside a card at ~68ch, and let the right-hand Daily column carry more items (or span the tiles under it).
Evidence: `F06_fold_photo_bands.png`, `F11_fold_daily_gaps.png` (scale 1).
Confidence: high

### F12 · looks · Contrast misses: "+N sources" pill, Aurora chips, and the Saved shelf label
Where: `span.pw` (the "+N sources" pill, drawn at 72% opacity); Aurora light active filter chip ("For you"); Saved shelf header label "SAVED" on its photo.
What a user sees/feels: small 11–12 px text that is harder to read than it should be.
Measured (WCAG, needs 4.5:1 at this size):
- "+N sources" pill: 3.43:1 Cypress dark, 3.2:1 Aurora light, 3.9–4.1:1 Coast and Rosewood dark.
- Aurora light active chip "For you" (white on green): 4.26:1; "Friday, November 6", "16 stories", "Mark read": 4.04–4.26:1.
- Saved shelf "SAVED" label: 1.96:1. It uses the dark brass for cream pages (#7d5f14) on a dark photo; the rule in HANDOFF says light brass on dark.
Recommend: draw the pill at full opacity (drop `opacity:.72`, pick a solid muted fill instead); darken Aurora's light-mode green one step (about #00703a); give the shelf label the light brass (#e2c27a) like other labels on photos.
Evidence: `F12_halcyon_dark_sources_pill.png`, `F12_aurora_light_chips_pills.png`, `F12_saved_kicker_on_photo.png`.
Confidence: high (pill, shelf), medium (Aurora values are 0.2–0.5 under the line)

### F13 · looks · Landscape phone: the top bars take a third of the screen
Where: 844x390 landscape: side panel (128 px), title bar (~75 px) and docked tabs (~50 px) all stay.
What a user sees/feels: only about 260 px of height is left for stories; on Headlines the first screen is a title, a heading and the top of one blank card.
Recommend: in landscape on phones, hide the title bar on scroll (keep the tabs), or merge the title into the tab row; collapse the side panel to icons.
Evidence: `F13_landscape_chrome.png`.
Confidence: high

### F14 · polish · Headlines break words with hyphens ("win-ter")
Where: CSS line 4331 `… .card h3 {… overflow-wrap:anywhere; hyphens:auto}`. Most visible in Sepia Rosewood, whose wider headline face breaks more often.
What a user sees/feels: "Sailors weigh win- / ter flood defenses". Newspapers never hyphenate headlines; it looks like a typesetting error.
Recommend: `hyphens:manual` for headlines (keep auto for body text in the reader), and keep `overflow-wrap:anywhere` only as a last resort for single very long words.
Evidence: `F16_rosewood_hyphenated_headline.png`; also visible in `THEMES_all_strip.png` (Rosewood column).
Confidence: high

### F15 · polish · "The Well" picture captions are cut mid-phrase and do not name the story
Where: The Daily, "The Well — Pictures from your sites" (tablet and Fold).
What a user sees/feels: each picture is captioned with the story's summary cut off without an ellipsis ("…rising costs for families across the"). A story with no summary is captioned only with the site name ("Longform"). You can't tell which story a picture belongs to.
Recommend: caption with the headline (one or two lines), site name above it; drop the summary.
Evidence: `F15_well_captions.png` (1024).
Confidence: high

### F16 · polish · Too many unlabeled dots
Where: card headers: a colored square/dot before the site name (site color), a red dot after the "+N sources" pill (means "Developing", visible only to screen readers via `aria-label`), red dot in the Developing strip; side panel "31 · 6 min" next to site names (unlabeled).
What a user sees/feels: two or three dots per card that mean different things, plus a square on some cards and a dot on others for the same site color. The side panel's "6 min" next to a count has no label, so it's unclear whether it is reading time or last update.
Recommend: keep one marker per meaning: the site color as a thin bar or a small square, always the same shape; replace the red "developing" dot on cards with the word ("Developing") in the kicker, or drop it on cards since the strip at the top already says it; label the side panel number ("6 min to read" in a tooltip, or remove it).
Evidence: `F07_download_badge_over_text.png` (square + pill), `F12_aurora_light_chips_pills.png` (dot), side panel in the run screenshots.
Confidence: medium (meaning of the side panel minutes inferred, not confirmed)

### F17 · polish · A site with one story gets a bare page
Where: single-site view with fewer than 3 stories (cover needs `cur.length>=3`, `render0`).
What a user sees/feels: Solo shows one card at the top and an empty screen: no site name banner, no "that's everything" note.
Recommend: always show the small site masthead (mark, name, "1 story"), and an end note ("That's everything from Solo this week").
Evidence: Solo view in the run (390); same layout as `F05` minus the cover.
Confidence: high

Checked and fine (no finding): pull-to-refresh tree in all themes (title hides on phones as designed, tree color follows theme); side panel in light/dark; empty Saved state; read stories (lighter headline + "✓ Read"); dark-mode body and label contrast on flat surfaces in all 7 themes (no failures other than F12); no horizontal page overflow at any width.

---

## Design recommendations: from feed list to magazine

These are things a reader would feel. Ordered by impact.

### R1. A real type scale: three headline sizes, not one
Before: every story headline on a phone is 18 px; the lead with a big photo looks like a row with a picture (F04). Section titles come in four styles ("THE FRONT PAGE" engraved caps, "Next up" big condensed with a thick rule, "16 STORIES / Last hour" with a kicker, "The front page" in a bold serif on Headlines).
After: Lead 28–32 px display serif, tight leading (1.05); secondary 20 px; rows 16–17 px. One section-title style for the whole app: small-caps kicker + display title + hairline rule.
```css
#grid{--h1:clamp(1.75rem,7.5vw,2.6rem);--h2:1.25rem;--h3:1.05rem}
.card:is(.nr-lead,.nr-hero,.lead) h3{font-size:calc(var(--h1)*var(--csz,1))}
.card.nr-row h3{font-size:calc(var(--h3)*var(--csz,1))}
```

### R2. Typographic leads when there's no photo
Before: a 450 px green slab with a giant initial (F08).
After: the story set like a newspaper "no art" lead: kicker, 30 px headline across the full width, 2-line deck in italic, byline, hairline rule. It looks intentional and fills the space with words instead of a placeholder.
```
 COURIER · 35 MIN
 Sailors weigh winter flood defenses
 Officials said the plan would take effect next
 spring, though critics argued…
 By Jane Doe ─────────────────────────────
```

### R3. One quiet metadata line instead of scattered bits
Before: source + pill + dot at the top, time alone on its own right-aligned line, "2 min read" elsewhere, "Also from…" on another line, an icon on top of that (F07, F09). A typical card spends ~40 px on a lone "1h".
After: kicker on top ("COURIER"), headline, deck, then one line: "By Jane Doe · 27 min · 2-min read · +3 sources". This removes 25–40 px per card, so each phone screen shows about one more story, and every card has the same rhythm.

### R4. Crop like a photo editor
Before: center crops; thin wide strips on the Fold; faces cut at the frame edge (F06).
After: one ratio family (3:2 for leads, 4:3 or 1:1 for thumbnails, never thinner than 16:9), with focus biased to the upper third. `img{object-position:50% 30%}` plus `aspect-ratio` on wide cards fixes most of it with two lines.

### R5. Use the width on tablets and the Fold like a magazine spread
Before: All Stories is a single 1450 px column; summaries run 180 characters; the Daily cover floats in empty cream (F11).
After: a 12-column grid: lead spans 8 columns with a 4-column "Next up" rail, then rows of 3 cards; text measure capped at ~68 characters; the Daily cover sits next to "In this issue" rather than alone.
```
┌──────────── lead (8) ───────────┐┌ next up (4) ┐
│ photo 3:2                       ││ • story     │
│ Big headline                    ││ • story     │
└─────────────────────────────────┘│ • story     │
┌─ card ─┐┌─ card ─┐┌─ card ─┐     └─────────────┘
```

### R6. Calmer chrome on the first screen
Before: on a phone, title bar + four icons + tab bar + filter chips + "Developing" strip + section kicker all come before the first story; the title is cut (F02); in landscape the bars take a third of the screen (F13).
After: title bar with at most three icons, hides on scroll-down and comes back on scroll-up; the tab bar stays. The first story starts within the top 40% of the screen.

### R7. Make each theme a different edition, not a different tint
Before: all 7 themes share the same card shapes, radii, shadows and badge pills; mostly the background tint changes (see `THEMES_all_strip.png`); Black & White and High Contrast look identical in light mode.
After: give each theme one signature beyond color: Newsprint = no rounded corners, hairline column rules, no card shadows; Cypress = brass rules and small caps kickers; Coast = sans headlines with generous white space; High Contrast = thicker rules and bold labels, so it is visibly different from Black & White. Small CSS per theme (`--rad`, `--rule`, `--shadow`) instead of new layouts.

### R8. Fewer badges, more words
Before: "+4 SOURCES" pills on most cards, red dots, download icons, ribbons, "✓ READ" text (F16).
After: one discreet marker per meaning; "+4 sources" as plain small text in the metadata line; read stories shown only by a lighter headline; saved stories only by the ribbon. The headline becomes the loudest thing on every card again.
