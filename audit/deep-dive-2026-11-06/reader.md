# Reader audit: reading a story (agent `reader`, port 8782)

Setup: mock feed "Harbor" with a rich story (photo with caption and credit, 2 section headings, a quote, bulleted and numbered lists, a footnote, a TALL 600x1000 photo marked TOP/BOTTOM, a table, a photo that fails to load, a code block, a Notes section) plus a long block-quote story. Opened through `openReader` at 390x844, 360x740, 844x390, 1024x1366 and 1812x2176, in Pages and Scroll, in Halcyon light, Halcyon dark, Sepia Rosewood, Black & White, with and without Large print (fs 24 / lh 1.8 / Narrow).
Screenshots: `/tmp/claude-0/-home-user/adde917f-1a7e-5251-872b-5dbd81b028cb/scratchpad/audit/reader/` (scale 2).

Note for the lead: **Pure Black (`oled`) can't be picked any more.** `POLISH_RETIRED` (www/index.html line 5197) maps `oled` to `halcyon`, and it maps `auto` (Light) to `halcyon` too. HANDOFF §1 still lists Pure Black as a live theme. I tested Sepia Rosewood and Black & White in its place.

## Baseline numbers (measured)
| Setup | Body | Line height | Chars per line (avg/max) | Pages |
|---|---|---|---|---|
| Phone 390 Pages | Literata 18px | 30.96px (1.72) | 36 / 39, left-aligned | 10 |
| Phone 360 Pages | 18px | 1.72 | 31 / 36 | 12 |
| Landscape 844x390 Pages | 18px | 1.72 | **62 / 84**, one column | **25** |
| Tablet 1024 Pages (2 columns) | 18px | 1.72 | 42 / 49 | 3 |
| Fold 1812 Pages (2 columns) | 18px | 1.72 | 50 / 56 | 2 |
| Fold 1812 Scroll | 18px, justified | 1.72 | 64 / **80** | — |
| Large print phone | 24px | 43.2px (1.8) | 25 / 28 | 17 |
Paragraph gap is 1em, with no first-line indents. Links use the text color with a 38%-opacity underline, which is good and close to Instapaper. List items use a 1.5 line height (27px), which is tighter than paragraphs at 1.72.

These already work well (verified, nothing to do): going back to the list restores its exact position in both modes (list scroll 1400 → 1400) and focus returns to the card. A failed photo shows a clear "Picture unavailable · Tap to try again" panel. Find in story marks every match and pages to the next one ("1 of 10" → "2 of 10"). Tables and code blocks stay inside the column and are readable. Body size, line height and phone measure are in line with Kindle and Apple News.

---

### R-01 · bug · Small raised and lowered characters are deleted, so "10⁶" reads "106" and footnote numbers join the sentence
Where: list of allowed tags `const OK=new Set('P H2 … CAPTION')` (www/index.html line 5520) has no SUP or SUB. The footnote link is turned into an outside link with target=_blank.
What a user sees/feels: A footnote mark shows as "along the shore.1", a full-size underlined "1" glued to the word. Exponents, chemical formulas and ordinals lose their meaning (10<sup>6</sup> becomes "106", CO<sub>2</sub> becomes "CO2"). Tapping the "1" leaves the app for the website instead of jumping to the note. Its tap area is 7x27px.
Recommend: Add `SUP SUB` to the allowed set. Make links whose address is `#something` inside the same story scroll or page to that spot instead of opening the site. Before: "shore.1" at 18px. After: a raised "¹" at about 0.7em, with a tap area padded to 24px or more.
Evidence: R-footnote-phone-scroll.png; DOM after cleaning: `…along the shore.<a href="https://harbor.test/story-1#fn1" target="_blank">1</a></p>`.
Confidence: high

### R-02 · bug · Tall photos are cropped to a short strip in page-turn mode
Where: `.body img{…max-height:var(--ih);object-fit:cover}` (line 1349). `--ih` is set to 50% of the column height in `layout` (lines 8675/8693).
What a user sees/feels: A portrait photo (600x1000) shows as a 346x198 strip. The top and bottom of the picture are cut off (in the test the head and both labeled bands disappear). Scroll mode shows the whole photo (344x573, contain). The Fold's 2-column pages show it whole too.
Recommend: For pictures taller than they are wide, use `object-fit:contain; width:auto; margin-inline:auto` within the same max-height, so the whole picture shows narrower and centered. Kindle and Apple News never crop a body photo. Before: 346x198 crop. After: about 119x198 full picture, centered. Optionally tapping a photo opens it full screen.
Evidence: R-tall-phone-pages.png (cropped) vs R-tall-phone-scroll.png (whole)
Confidence: high

### R-03 · looks · A phone turned sideways reads like a ticker: 84-character lines, about 6 lines a page, 25 pages
Where: `layout` → `vwOK=innerWidth>=700&&Math.min(innerWidth,innerHeight)>=600` (line 8670) blocks 2 columns whenever the screen is under 600px tall. The `fitPage1` first page is also affected.
What a user sees/feels: In landscape the story becomes one 736px-wide column. Lines run up to 84 characters (comfortable is 45–75), and each page holds about 4–6 lines under the bar. Page 1 is only the headline. Page 2 is only the "From the publisher" box. Page 3 is only a small photo. The story takes 25 page turns where portrait takes 10. The "Sites" tab also sits over the left margin.
Recommend: When the window is at least 700px wide but short (a sideways phone), use 2 columns. That gives about 38 characters per line and halves the pages. Hide the reader bar until a center tap. Keep the existing Fold safety by testing `screen` shape rather than the window. If 2 columns are too risky, at least cap the column at about 34em (≈ 65 characters) and center it.
Evidence: R-landscape-4pages.png (pages 1–4), R-landscape-p1..p4.png; measured cpl 62 avg / 84 max, np 25
Confidence: high

### R-04 · looks · Long quoted passages are set as giant centered pull quotes
Where: CSS line 4310–4311: every `blockquote` (except social embeds) gets centered, italic, display font (`--disp`), max-width 30em, with rules above and below.
What a user sees/feels: A one-line quote looks good. But a quoted letter, statement or excerpt (very common in news) becomes 18 centered lines of 26px condensed italic on a phone. That is hard to read, and it looks like a design flourish rather than quoted text.
Recommend: Keep the pull-quote look only for short single-paragraph quotes (for example under 160 characters, set by a class from the cleaner). Set longer quotes like Apple News or Instapaper do: left-aligned body serif at 0.95–1em, regular or italic, with a 3px brass left rule and 16px left padding, and no centering. Before: 18 centered display-italic lines. After: about 9 left-aligned body lines with a rule.
Evidence: R-blockquote-long.png (text-align center, 26.1px display italic, 18 lines)
Confidence: high

### R-05 · missing · Large print enlarges only the paragraphs; everything around them stays small
Where: AA_PRE "Large print" (line 7526) only sets `S.fs/S.lh/S.rw`. The header, byline, caption, publisher box, table, end card and bar use fixed px sizes.
What a user sees/feels: With Large print on, the body is 24px. But the headline stays 32px, the byline and date 13px, photo captions 13px, the "From the publisher" note 17px, its label 11px, table cells 13.5px, the "Next up" label 11px and the site name in the bar 12px. Someone who needs large print still can't read the captions, the date or the table.
Recommend: Express these sizes in `em` of the reading size (or multiply by `--fs/18`). With Large print: caption 13→17px, byline 13→17px, labels 11→14px, table 13.5→18px, publisher note 17→22px, headline 32→38px. This matches Kindle and Apple Books, where the size setting scales every text element.
Evidence: R-largeprint-p1.png; measured sizes with Large print vs default are identical for title, meta, kick, why, cap, td, endNext
Confidence: high

### R-06 · bug · The "Aa" sheet's sample paragraph uses a different font from the story
Where: `aaSync` sample (line 7565) sets the sample with `FONTS[fontKey()]||'var(--serif)'`, which resolves outside the story column.
What a user sees/feels: The sheet says "watch this passage adapt", but in Halcyon the sample is in Inter (sans) while the story is Literata (serif). In Black & White the sample is Atkinson Hyperlegible while the story is Libre Baskerville. Only Sepia Rosewood matches.
Recommend: Set the sample's font from the live body text, for example `getComputedStyle(document.querySelector('.cols .body p')).fontFamily`, or give the sample the same class or variables as `.cols .body p`. Before: sans sample over a serif story. After: an identical face.
Evidence: R-aa-sample-font.png (Halcyon), R-aa-sample-font-bw.png; computed: sample `Inter` vs body `Literata`; sample `Atkinson Hyperlegible` vs body `Libre Baskerville`
Confidence: high

### R-07 · looks · The first page on a phone shows only 2 lines of the actual story
Where: first page (`fitPage1`/`fitHero`), `whyBox` (line 13964), and the caption under the hero.
What a user sees/feels: At 360x740 and 390x844 the first page is the headline, byline, a labeled "From the publisher" box (about 120px), the photo (210–231px), and a two-line caption with credit. The story itself starts at about 86% of the page height, so only 2 lines are visible. "From the publisher" also reads a bit like a sponsor note.
Recommend: Set the publisher description as a plain standfirst directly under the headline (italic, 19px, `--mut` color, no box, no label), the way Apple News and The Atlantic do. Cap the phone hero at 16:9 (about 195px at 346 wide). Put the credit on the same line as the caption. Before: 2 lines of story on page 1. After: about 6–7 lines.
Evidence: R-firstpage-360.png, R-listen.png (390 first page)
Confidence: high

### R-08 · bug · In Scroll mode, tapping the lower part of the screen jumps a whole screenful
Where: reader click handler (line 10832): `if(isVert()){if(y<.2)go(-1);else if(y>.72)go(1);…}` → `vScrollBy`
What a user sees/feels: In Scroll mode a tap in the bottom 28% of the screen jumps the text down by a screenful (measured 1500 → 2185px), and a tap in the top 20% jumps back. People tap to stop a fling, to dismiss something, or by accident while holding the phone, and lose their place. Instapaper, Matter, Readwise Reader and Apple News treat a tap in a scrolling article as "show or hide controls" only.
Recommend: In Scroll mode, make every plain tap call `fpeek()` (show/hide controls). Keep the paging taps for Pages mode only, or make tap-to-scroll an opt-in in "More reading settings".
Evidence: measured with touchscreen.tap(195,700) on 390x844: scrollTop 1500 → 2185
Confidence: high

### R-09 · looks · Section headings change size and style between modes and devices, and get huge in Scroll on tablet and Fold
Where: `.cols .body h2` (`.cpre/.cin` chapter styling in Scroll), and h3.
What a user sees/feels: The same heading "A long road to a vote" is 24px in Pages, 30px in phone Scroll, and 46px in tablet/Fold Scroll. On tablet and Fold that is nearly the headline's 53px. In Scroll it also gets an invented "01 / 02" number and a teal underline, with about 150px of empty space above. The "Notes" h3 in Pages is bold Literata 24px, which is heavier than the h2 above it.
Recommend: Use one scale everywhere: h2 = 1.3em of body (≈ 23–24px at 18px) and h3 = 1.1em, both in the display face. Drop the "01/02" numbers for news stories, or keep them only for long reads with 4 or more sections. Use a top margin of 1.6em. Before: 46px heading under a 53px headline. After: 24px heading, so the hierarchy is clear (headline ≫ heading > body).
Evidence: R-subheads-tablet-scroll.png; computed h2 24.3 / 30 / 46px, h3 24px bold Literata (Pages)
Confidence: high

### R-10 · looks · The end page is half empty, offers "open the website" twice, and makes it the loudest button
Where: end of story `rfoot` (lines 7416–7418)
What a user sees/feels: The last page holds a thin rule, "Harbor · November 6", the Next up card, three small buttons (Save / Share / Open site, 34px tall), and a big teal "Read original on harbor.test ↗" button. The bottom 55% of the page is blank. "Open site" and "Read original" do the same thing, and the teal one, which takes you out of the app, is the strongest element on the page, stronger than Next up.
Recommend: Remove "Open site" from the row (keep one website link, styled as a quiet text link). Make Next up the primary block: photo, title in 24px display, and a full-width card with a 48px-tall tap area. Make the action buttons at least 44px tall. Fill the space with the up-to-3 related reads (already coded), or pull the end block onto the last text page when it fits. Remove the empty rule above the colophon.
Evidence: R-endcard-phone.png; button sizes Save 63x34, Share 70x34, Open site 93x34
Confidence: high

### R-11 · polish · Too many hyphenated line endings on phones, sometimes three in a row
Where: `rdVars` sets `--hlc:'9 4 4'` for left-aligned text (line 8626); `.cols .body p{hyphens:auto}` (line 1346)
What a user sees/feels: Left-aligned phone text breaks words like "recon-nect", "ware-houses", "indus-trial" and "thou-sands" often (4 of 21 lines on one page). In one paragraph three lines in a row end in a hyphen ("internationaliza- / infrastruc- / responsibil-"). With ragged-right text this buys almost nothing and slows reading.
Recommend: On left-aligned text, only split long words: `--hlc:'12 5 5'` (or `hyphens:manual` below 640px). Keep `auto` for justified columns. Before: about 19% of lines hyphenated. After: under 5%.
Evidence: R-scrollbar-phone.png, mont pages (R-select.png shows "recon-/ware-")
Confidence: high

### R-12 · polish · Scroll mode on the Fold and tablets uses 80-character justified lines with visible gaps
Where: Scroll column `--rdmw` 700px (`rdxRw`, line ~8622), justified when `chars` is high
What a user sees/feels: On the Fold in Scroll the column is 700px of 18px text: lines run up to 80 characters (64 on average), and justified spacing opens gaps ("ending a / debate…", "would reshape how the waterfront"). Long lines make it hard to find the start of the next line.
Recommend: Cap the Scroll measure at about 36em of body size (≈ 650px at 18px, about 70 characters), or raise the size to 20px on screens over 1000px wide, as Apple News does on iPad. Keep justification only when hyphenation is on and lines are 60–70 characters.
Evidence: R-subheads-tablet-scroll.png (tablet), m_H (Fold) measured cpl 64/80
Confidence: medium (whether the gaps look this bad depends on the phone's hyphenation dictionary)

### R-13 · looks · The Listen player covers the line being read
Where: compact read-aloud pill (Pause / − / 1.0× / + / ×), bottom of the reader
What a user sees/feels: The floating pill sits over the last text line on the page ("front i… ades,"), which is where the voice arrives as the page fills. The compact player also has no "back 15 seconds / previous paragraph" button (the code has `#pbk/#pbn` but they are not in the pill), and Pocket and Apple News both lead with it.
Recommend: While reading aloud, reserve the pill's height at the bottom of the page (`padding-bottom` on the book, about 64px), or float the pill over the bottom margin and tick strip only. Add a "previous paragraph" button left of Pause. All buttons are already 44x44, which is good.
Evidence: R-listen-player.png (with a fake voice, since headless Chrome has no voices)
Confidence: medium (fake voice; the current-word highlight could not be verified)

### R-14 · polish · Several reader controls are smaller than a comfortable thumb target
Where: reader bar, Aa sheet, end page, footnotes
What a user sees/feels: On a phone: Back 40x40, More 40x40, the site name "Harbor" 69x30 (24px tall on tablet and landscape), Aa close button 34x34, end-page buttons 34px tall, footnote link 7x27. Android recommends 48dp and Apple 44pt.
Recommend: Give the bar buttons 44x44, with the visible circle staying 40 if wanted and a padded hit area. Make the site name and end buttons at least 44px tall and the Aa close button 44x44.
Evidence: measured sizes listed above (`#sheet .bar`, `#aapop`, `.rfoot`)
Confidence: high

### R-15 · polish · Pages after the first keep an empty band at the top where the bar was
Where: Pages mode with the bar auto-hidden (`fauto`), `.book` top offset
What a user sees/feels: From page 2 on, the bar is hidden but its space stays: a blank ~52px strip above the page card (about 6% of a 844px screen, or 13% in landscape). Kindle and Play Books use that space for text.
Recommend: When the bar is hidden in Pages mode, let the page card start about 12px from the top (under the status bar) and lay out with that height. Or keep the bar visible. Either way, don't leave a blank band.
Evidence: R-page2-topband-360.png, mont pages
Confidence: medium (the layout may intentionally keep the height stable so pages don't reflow when the bar comes back; if so, the trade-off is about one extra page per story)

### R-16 · polish · Find in story skips the headline and the publisher note
Where: Find in story (`#rfq`, around line 17800)
What a user sees/feels: Searching "plan" finds 10 matches in the body but not the headline ("…waterfront plan…") or the "From the publisher" text, so "1 of 10" starts on the body's first paragraph.
Recommend: Include `.tt` and `.whyit p` in the searched nodes.
Evidence: R-find.png, R-find2.png
Confidence: high
