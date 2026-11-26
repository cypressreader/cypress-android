# World Edition — the automatic build

David's goal (2026-11-26): set the look up once, then it runs twice a day on its own. He has a job and
a kid; there is no step in here that waits for him. That is the hard requirement, and it decides every
call below — **reliability beats cleverness, and the fallback is always yesterday's edition, never a
broken one.**

## Where it runs

A scheduled GitHub Action, twice a day. It writes `www/world-edition.json`, copies it to
`docs/app/world-edition.json` (done by hand today — the script does it), commits and pushes. GitHub
Pages serves it; the app fetches `world-edition.json` at `renderWE`. Nothing changes on the phone, and
no key ever reaches it. The API key lives in GitHub Secrets.

Because the edition is built ahead of time into a file, **the cost is fixed no matter how many readers
there are.** If the app called the API itself the cost would scale with users and the key would ship
inside the APK. That decision is already made and it is the right one.

## The passes

| # | Pass | Who does it | Cost | On failure |
|---|---|---|---|---|
| 0 | Gather: feeds, pick candidates, fetch each page, `extract` → `tidy` → `junkClean` | Code | free | drop that story |
| 1 | Gate: too short, no paragraphs, paywalled, extraction failed | Code | free | drop that story |
| 2 | Editorial: running order, sections, standfirsts, pull quotes, what leads | Model | ~$0.03/edition | fall back to today's heuristics |
| 3 | Pronunciation list for play mode (20–40 terms → spoken form) | Model (Haiku) | pennies | ship without it |
| 4 | Cover: compose the SVG from the lead story | Model | ~$0.01/edition | last edition's shapes, new palette |
| 5 | Verify: `tests/layout/check.js` + `tests/layout/paint.js` on the real edition | Code | free | **do not publish** |
| 6 | Publish: write both JSON copies, commit, push | Code | free | — |

**Pass 0 runs the app's own code, it does not reimplement it.** Load `www/index.html` in headless
Playwright and call `extract`/`tidy`/`junkClean` in the page, exactly as the probes in this session did.
Zero duplication, and the pipeline cleans text the same way the reader does, forever.

**Pass 5 is what makes going away safe.** The layout check already opens the edition at phone and Fold
width, turns every page, and reports text-on-text, blank pages, truncation, wrong labels, page ghosts
and a missing end mark. It is the robot that looks at the magazine so David does not have to. It
already runs in CI (`.github/workflows/layout-check.yml`).

## The rule that makes model output safe to ship unattended

**Code validates everything the model returns, and falls back silently when it fails.** Ask for
structured output, then check it:

- A pull quote must appear **verbatim** in that story's text. If it does not, throw it away and use the
  existing sentence-picking rule. (This also stops a quote being invented.)
- A standfirst over its length limit is cut or replaced by the publisher's.
- The running order must name only stories that survived pass 1.
- A cover SVG must parse, use only the allowed shapes, and only palette variables.
- A pronunciation entry must be for a term that actually appears in the edition.

Nothing unvalidated reaches the page. A model pass that fails costs the edition some polish, never its
correctness.

## Stop conditions

- Fewer than 10 stories survive the gate → keep the edition already live.
- Layout or paint check reports a problem → do not publish, open an issue so David finds out.
- Never replace a good edition with a worse one.

## Cost, measured

Haiku 5.5 is $0.10/$0.50 per million tokens in/out; Sonnet 5.5 $2/$10. Real stories measured this
session: PBS 1,128 words, NPR 686. Sixty editions a month at 18 stories:

- Editorial pass (headlines, standfirsts and opening paragraphs only, ~5k tokens in): **~$2/month on
  Sonnet**, ~$4 on Opus.
- Pronunciation + cover + the occasional messy-story rescue on Haiku: **~$1/month**.
- **Total under $5 of a $100 monthly credit.** Batch (50% off) and caching are not worth the complexity
  at this size.

**Do not run every story through a model to clean it.** Code already does that deterministically, for
free, testably, and without rewording a journalist. Send the model only the stories the messy list
flags (`curl -s 'https://cypressreader.com/api/insights?messy=list'`) — about one in twenty.

## Build order

1. **Passes 0, 1, 5, 6 with no model at all.** That alone makes it automatic, with zero model risk.
2. Pass 2, the editorial pass — the biggest visible lift.
3. Pass 4, the cover.
4. Pass 3, pronunciation — **only once play mode ships.** A spoken-form list is useless until there is
   something speaking.

Keep tuning the look by hand in `www/index.html` while this is built: the look lives in the CSS, and no
pipeline can settle a design that is not settled.

## Two limits worth knowing

- **Claude cannot generate images**, and the credit is Anthropic's, so it cannot buy another company's
  image model either. The covers are drawn shapes; the model composes the SVG. That is the route.
- **A magazine looks intentional because it repeats.** Fixed grid, fixed furniture, same folio in the
  same corner. Let the model *choose* which of the three page shapes suits a story; never let it invent
  a new one. Variety comes from the content and the art, not from the layout rules moving.
