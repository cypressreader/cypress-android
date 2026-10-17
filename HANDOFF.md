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

## 4. Active state & next 3 tasks
**Where we are:** the 1.107 preview batch is published and waiting for the user's review. The user was investigating (a) "Cards and columns is gone" (answered: Story card size must be Medium/Large, view button on tiles; user has not replied), (b) a possible heavy-sans reader title, (c) The Well on tablets (queued as FIXES.md item 11, not started). Then the user asked for this HANDOFF/CLAUDE.md/.claudeignore setup (done).

**Next 3 tasks (in order):**
1. Wait for the user's feedback on the preview. If they still can't find Cards/Columns, ask for a screenshot of Settings > Look and Layout > Story card size and the view button; consider keeping Cards|Columns available on Compact or relabeling Compact ("Compact list, no columns").
2. FIXES.md item 11: The Well on tablets (one huge tall portrait next to two small photos; unify frames at ~780/1000/1100 px, light and dark). Check `wellHtml`, `wellJudge`, `.dwell-g.n3/.n4` (a first fix to column sizing already exists).
3. When the user says "build": merge `claude/cool-darwin-nkj7it` into `main` (docs-only paths don't trigger Android builds; `www/`, `native/`, workflow changes do), confirm `APP_LABEL` 1.107 matches `whats-new.txt` and the workflow, and remind them to paste `docs/worker/share-worker.js` into Cloudflare and to check `TESTING.md` items on a real phone.

**Open questions for the user:** keep the narrow serif for all headlines or switch to Cormorant per the Halcyon brief; Compact label wording; ABC News keep or remove.
