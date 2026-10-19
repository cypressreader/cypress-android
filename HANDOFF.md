# HANDOFF — live session memory (read first, update silently after every finished task)

Last updated: 2026-10-17 · Branch: `claude/cool-darwin-nkj7it` (pushed; last preview publish = commit `73e7813`) · App version in code: web `2026.10.17a`, Android label `1.107` (not released).
Nothing from 1.107 is merged to `main` or built. **The user must say "build"/"merge" to ship.**

## 1. Working & locked ("Do Not Break": verified here, don't change core logic without asking)
- **Halcyon theme (`halcyon` light / `halcyond` dark)**: website palette (cream `#f3ecdc`, green `#123524`/`#0c2619`, brass `#c9a24a`/`#b08d3e`), follows the phone via `twinApply`. Every story headline uses the narrow display serif (`--disp`, "CyPress Display") with `!important` (the user's explicit choice over Cormorant). Dark brass labels on cream use `#7d5f14` for legibility; on photo cards labels stay light.
- **The Daily**: section headers show the name once (`sh()`), plain one-line intros (`DAYDEK`), no drop cap on intros, "Vol. 26 · No. 290" edition line (volume = last two digits of the year), "Next up" keeps its name but looks like "Since this morning" (`nrLH`/`nrLC`), "In this issue" links land at section tops (`jumpTop`), cover's outlined number has its own space (`.dcv-num` in flow).
- **Headlines**: list view and tile view share "The front page" first section; section headings use the big serif style.
- **All Stories**: title case header; larger centered chips (fit at 360/390 px); Top stories / Quick reads / Deep reads open with `tabMast` headings in both views.
- **Story card size** buttons are Compact | Medium | Large and drive headline size via `--csz`. **Cards|Columns (wire) view only exists when size is Medium or Large and the view button is on tiles** (by design: `nrMode()` is off for Compact and list view).
- **Location removed**: no Android location permission, no geolocation code, no Nominatim/Open-Meteo requests. "Near you" = typed place (any country), up to 10 saved places (`S.places`), uses the phone's language (`locLang`). Old settings migrate (night/autodark/geo/wx deleted at boot).
- **Sunset/night mode and weather animation removed**. Light or dark choices: As the theme is / Always light / Always dark / Follow my phone (`S.sch`). The sunrise/sunset "sky" transition animation remains (no weather).
- **Excerpts end on whole words** (`trimWords`, `sumOf`), never on "a/the/of…".
- **Opaque docked Daily tab bar** (`#mtabs`), pull-to-refresh tree has no box and is centered on phones (`#pts`), Search closes itself after the keyboard (search code near `openSearch`), long-press doesn't highlight menu text.
- **Reader**: title block spans both columns above the text on tablets (`.cols>.hsf.hs-top{column-span:all}`; `fitPage1` skips when spanned); justified text uses hyphenation.
- **Site**: homepage, privacy page, `docs/s.html` (green/brass, self-hosted fonts), live demo (`docs/demo.html`, generated), tablet page. US spelling across site, demo stories and release notes.
- Tests that pass: `tests/syntax.js`, `st5`, `st18`, `st27`, `st29`, `control`. Pre-existing failures (also fail on main, not ours): `st26` ("Advanced palettes count 41"), `deep2` (waits for `[data-oblg="circuit"]`), `deep3` ("update only once", fold-posture crash). `deep3` has the weather block removed.

## 2. Architectural & styling rules
- Session memory tooling: `scripts/turn-counter.js` + `UserPromptSubmit` hook (counts in `.git/turn-counter.json`, nudges from message 8); `.claude/settings.json` deny-list mirrors `.claudeignore`. Needs a fresh session to take effect.
- Single-file app. Edit only `www/index.html`; the hook copies to `docs/app/index.html` and rebuilds `docs/demo.html`. Don't read those two copies.
- Fonts: Literata body (`--serif`), Cormorant Garamond (`--fd`), narrow display serif `--disp` for headlines. Colors are theme variables (`--bg --pn --ink --mut --ln --a1 --a2 --logo`); Halcyon palette as above. Photo cards = white text over dark overlay; row/list cards = `--ink`/`--mut`.
- `#grid.list .card…` list styles are strong; to override on list view add `#grid.list` selectors and avoid fighting them (a forced hero card in list view failed).
- CSS-only fixes preferred; JS layout code (`fitPage1`, `fitHero`, `layout`) is delicate.
- Customer-facing: "CyPress Reader", American spelling, plain language, no publisher names, no "free"/ads promises, letters signed "Cy". Slogan: "The art of staying informed."
- Every new third-party request must be on `docs/privacy.html` (Near you sends the typed place to Google News and Bing News; that is disclosed).
- Preview flow: commit → push branch → `scripts/publish-preview.sh claude/cool-darwin-nkj7it`. Preview repo is `cypressreader/cypress-preview` (separate; never touch production).
- Pasted briefs from other AIs say "repo cypress-preview, branch experiment/daily-redesign": we apply them in THIS repo/branch and publish with the script instead.

## 3. Dead ends & solved bugs (do not repeat)
- **Forced hero card for the front page in list view**: its headline and source stayed invisible whatever was overridden. Solved by making list view's front page a normal row (and the Daily lead in list view a normal row, `#grid.list .card:is(.nr-hero,.nr-lead)`).
- **Cards/Columns "gone"**: not a bug. Story card size was on Compact (first button after the reorder) or the view button on list. Medium/Large + tiles brings it back.
- **Reader blank column / heavy sans title / tall photo strip**: tall portrait photos stretched `.nr-colr` and list-view hero cards (fixed with max-height / list-row rules); a tall reader header pushed text away (fixed by letting the header span columns). The user's heavy-sans reader title could not be reproduced; if it returns, ask which text style and headline font are set (`S.font`, `S.hfont`, `applyHf`).
- **`<form>` inside the Add dialog**: nested forms are dropped by the parser; Near-you uses a div + Enter handler.
- **Weather/sunset tests**: removed with the features (`deep3` weather block, st18 twin-night block, ngt/ngeo asserts).
- **ABC News feed** (`abcnews.com/abcnews/topstories`): loads and parses here (25 stories) but the user saw none; unresolved, device-only (`TESTING.md`). If still empty, remove from the starter list.
- **Reader justification rivers**: fixed with hyphens + stricter threshold; check on phone.
- Mistakes to avoid: `pkill -f` kills your own shell; backgrounded `git stash`; a stray `cat > $UNSET/x` hangs a command; my local test server dies between commands; tests that use port 8765 collide with a manual server; don't commit `cypress-gemini-audit/`.
- Verified root causes: card summaries were cut mid-word by `text.slice(0,170)` in the feed parser (now `trimWords`); the `.src .sn{flex:1}` pushed topic tags to the far edge; `#mtabs` background was 92% translucent; `.dcv-lead h2` line-height .88 clipped descenders; Today lead in list view inherited `.card.list` grid with a 4:5 hero ratio.

## 3b. Batch 2 notes (this session)
- Reader page view bug (FIXES 14): `.cols>.hsf.hs-top{column-span:all}` (added in the polish pass) made a full-width title block that left one or two lines of text on page 1. Removed it and the matching `fitPage1` skip. Do not re-add a spanning header in the paged reader.
- Daily quote link (FIXES 12): `.cvlead`/`a[data-i]` rules give links `position:relative;overflow:hidden;contain:layout paint`, which clipped a stretched `::after` overlay. `.dpq .dpq-a` overrides them.
- "Why it matters" (FIXES 15): `whyBox()` in `mnotes()`; uses `a.summary`, fuzzy duplicate check (first ~80 chars).
- Quick browser repro recipe: load `docs/demo.html` in Playwright (`tests/mock` gives `PW`), set `cur[0].img` to a 1600x1000 data URL, `openReader(cur[0])`.

## 3c. Visual-Test repo (AI Studio) notes (2026-10-19)
- Repo `cypressreader/Visual-Test` (clone path `/home/user/cypressreader/visual-test`, read only): `docs/app/test.html` = raw AI Studio enhanced build; `index.html.original` = our stamped preview (rename to `.html` to run it, a `.original` file is shown as text); `index.html` = original plus unrequested edits (multi-word settings search, "App updates" card, `nativeSetup()`). The merged page `cymail-e026e.web.app/test-visual.html` is NOT in the repo.
- Findings: theme pills call missing `setTheme` (only change the attribute, not saved); "Close Story" and sheet drag call missing `closeReader` (app uses `closeRd`); drawer handle wiped when the sheet is rebuilt; font pills only restyle the current story; bionic duplicates Focus reading and bloats HTML; hover/touch preload bypasses data-saver (`dpOk`); 1.2 s timer for the reading pill; tablet reader text is clipped at the right edge and the drop cap swallows two letters in test.html; banner covers the bottom UI; OLED low contrast and not in `THEME_NAMES`/`twinApply`. Our reader reveals text in about 50-110 ms (AI Studio claims 420 ms).
- **The user said: do NOT port the visual enhancements yet.** First get the working repo, examine it, then review together. Review notes for later: fix items 6 (panel drag-to-close; `sdown` is swipe-down-to-close-the-reader, not a sheet handler), 8 (register OLED in `THEME_NAMES`/`twinApply`), 9 (drop the fake storage breakdown; real total only).
- Good ideas the user may approve later: pure-black OLED theme, swipe color wash, reading presets, Clear image cache button, bottom reading sheet (now FIXES 17), "Updated since this morning" badge.

## 4. Active state & next 3 tasks (updated 2026-10-19)
**Where we are:** branch `claude/cool-darwin-nkj7it`, preview published at commit `4fcefcd` (app code is current; later commits are notes only). Built and on the preview, waiting for the user to check on a device: FIXES 11 (The Well tablets), 12 (Daily quote opens its story), 14 (reader page view; also likely fixes 13), 15 (Why it matters box). FIXES 1-10 are done or checked. **Queued, not started: 16, 17, 19, 20 (20 = hide side bar on tablets, build with 19).** Nothing is merged or built; the user must say "build".

**Next 3 tasks (when the user says start the batch):**
1. (DONE 2026-10-19, unverified on device) FIXES 18: make the "Why it matters" label/bar and `.mnotes` readable in dark themes (lighter accent or mix toward `--ink`, aim 4.5:1); check light, dark, E-Ink, Halcyon.
2. FIXES 16: one uniform story row (picture left, time always right-aligned, brand-colored tile for rows with no picture, big picture cards unchanged except time bottom-right). Six places put the picture on the right (see FIXES 16). Then FIXES 17 (reading sheet that reuses `#aapop` settings) and FIXES 19 (tablet pass: size bands, container queries, throwaway screenshot script at 600/768/900/1100; ask the user for tablet screenshots).
3. On "build": merge into `main`, confirm `APP_LABEL` 1.107 matches `whats-new.txt` and the workflow, remind about pasting `docs/worker/share-worker.js` into Cloudflare, and the `TESTING.md` items.

**Open questions for the user:** narrow serif for all headlines or Cormorant; Compact label wording; ABC News keep or remove; bring back a pure-black theme (a "black" theme was retired earlier); a warm evening tint (clock-based) is close to the removed "after sunset" mode; the Visual-Test review (above).
**Working notes:** the user wants fixes queued in `FIXES.md` one at a time and built later, not built immediately. The reading-quote tap bug root cause: other link rules gave `a[data-i]` `overflow:hidden; contain:layout paint`, clipping a stretched overlay (fixed with `.dpq .dpq-a`). Do not re-add a full-width title block (`column-span:all`) in the paged reader. The turn-counter hook now works in a fresh session.
