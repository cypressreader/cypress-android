# World Edition — the automatic build

David's goal (2026-11-26): set the look up once, then it runs twice a day on its own. He has a job and
a kid; there is no step in here that waits for him. That is the hard requirement, and it decides every
call below — **reliability beats cleverness, and the fallback is always yesterday's edition, never a
broken one.**

## Where it runs

A scheduled GitHub Action, twice a day. It writes `www/world-edition.json`, copies it to
`docs/app/world-edition.json` (done by hand today — the script does it), commits and pushes. GitHub
Pages serves it; the app fetches it in the background and uses it from the next open. No key ever reaches
the phone.

**Corrected 2026-11-26.** This section used to say the app already fetched the edition from Pages. It did not.
`capacitor.config.json` has `webDir: "www"` and no remote server, so the APK serves its own bundled files and
`fetch('world-edition.json')` read the copy INSIDE the app - an edition was only ever as fresh as the last build.
The app was changed that day (`weEdition`/`weRefresh`, guard `tests/edition_live.js`) so the sentence above is now
true: the bundled copy stays the fallback, the live one is used from the NEXT open so an issue never changes under
a reader, an older date is ignored, the check runs at most once every three hours, and it is skipped offline, on
data saver, on a metered connection and in battery saver. **The file still has to be published, which needs the
merge to `main`.** The API key lives in GitHub Secrets.

Because the edition is built ahead of time into a file, **the cost is fixed no matter how many readers
there are.** If the app called the API itself the cost would scale with users and the key would ship
inside the APK. That decision is already made and it is the right one.

## The passes

| # | Pass | Who does it | Cost | On failure |
|---|---|---|---|---|
| 0 | Gather: feeds, pick candidates, fetch each page, `extract` → `tidy` → `junkClean` | Code | free | drop that story |
| 1 | Gate: too short, no paragraphs, paywalled, extraction failed | Code | free | drop that story |
| 2 | Editorial: running order, sections, standfirsts, pull quotes, what leads | Model | ~$0.03/edition | fall back to today's heuristics |
| 3 | Pronunciation list for reading aloud (20–40 terms → spoken form) | Model (Haiku) | pennies | ship without it |
| 4 | Photo clearance: look at each candidate picture, reject ads, burned-in logos, watermarks, collages | Model (vision) | <$0.01/edition | reject it (conservative) |
| 5 | Cover: compose the SVG from the lead story | Model | ~$0.01/edition | last edition's shapes, new palette |
| 6 | Verify: `tests/layout/check.js` + `tests/layout/paint.js` on the real edition | Code | free | **do not publish** |
| 7 | Publish: write both JSON copies, commit, push | Code | free | — |

**Pass 0 runs the app's own code, it does not reimplement it.** Load `www/index.html` in headless
Playwright and call `extract`/`tidy`/`junkClean` in the page, exactly as the probes in this session did.
Zero duplication, and the pipeline cleans text the same way the reader does, forever.

**Pass 4 fills in data the app already expects.** `wePhotoOk` already refuses a picture with no credit, under the
minimum size, missing any flag in `WE_CLEAR`, or showing people under an accusing headline (`WE_ACCUSE`). Those
clearance flags have to come from somewhere, and a pair of eyes on each candidate is what makes that automatic. Cheap
code checks run first (size, aspect ratio, ad-network URLs); only the survivors cost a look. **Be conservative: when
unsure, reject.** A picture is never required - the story runs without one.

**Pass 6 is what makes going away safe.** The layout check already opens the edition at phone and Fold
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

## The cover checklist (pass 4), as applied for real on 2026-11-26

Cheap code checks first - 4 of the 7 photos in the edition were eliminated for size alone, before a single look:

1. **HTTPS, credited, 1,600 px on the long edge.** (`WE_BIG`. Inline pictures only need 600.)
2. **Nothing painted on the picture**: advertisement, broadcaster bug, burned-in caption, watermark, collage, screenshot.
3. **The existing clearance list** - logo, text, child, body, grief, mugshot (`WE_CLEAR`) - and no face under a headline
   carrying an accusation word (`WE_ACCUSE`).
4. **NEW - not a handout from the subject of the story.** The Microsoft operations-centre photo is credited "Microsoft"
   on a story about Microsoft's own outage. That is the subject's picture of itself: fine inside, never the cover.
5. **NEW - no identifiable private individual as the subject of the frame.** The ProPublica portrait is a clean,
   beautiful photograph of a named man in a story about his cancer care. Right inside the story where its own
   publisher ran it; wrong on the front of an aggregated magazine. **The cover needs a stricter test than the inside
   pages** - that is the general rule, and it is the one a size-and-logo check will never catch.
6. **When unsure, reject.** A story runs perfectly well without a picture, and the drawn cover is always there.

**The lead follows the picture.** Among stories strong enough to lead, prefer one with a cover-worthy photograph - the
way magazines have always chosen a cover. On 2026-11-26 that moved the cover from the Nvidia story (no usable picture
anywhere) to the Colombia car bomb (AFP, 1,920 px, clean), and it needed **no app change at all**: `cover.lead` and
`cover.photo` are data, and `wePhotoOk` already said yes.

## Build order

1. **Passes 0, 1, 5, 6 with no model at all.** That alone makes it automatic, with zero model risk.
2. Pass 2, the editorial pass — the biggest visible lift.
3. Pass 4, the cover.
4. Pass 3, pronunciation. **Reading aloud already ships** (the Listen button, the phone's own voice; natural
   downloadable voices are a separate track), so this helps today - it is last only because it is the smallest win.

Keep tuning the look by hand in `www/index.html` while this is built: the look lives in the CSS, and no
pipeline can settle a design that is not settled.

## Two limits worth knowing

- **Claude cannot generate images**, and the credit is Anthropic's, so it cannot buy another company's
  image model either. The covers are drawn shapes; the model composes the SVG.
- **THE PHOTO COVER ALREADY EXISTS AND IS THE FIRST CHOICE.** (Correcting an error made earlier in this file: issue
  30's "never a picture of the event or of anyone in it" governs what the DRAWN art may depict, not cover policy.)
  `renderWE` picks in this order: `wePhotoOk(c.photo,...)` passes -> **photograph**; else `c.art` -> **drawn**; else
  **typographic**. Three states, and the drawn one is the fallback issue 30 calls "the third cover state".
- **So "photo from the lead story" (David, 2026-11-26) needs no app change.** Today's cover is drawn only because no
  photo cleared. The edition file says why: *"logo placeholder, baked-in text, broadcaster mark, under 1,600 px, a
  face beside 'scandal'."* Every photo in the file carries `by: "MJ"` - a person cleared them by hand. **That hand is
  the only thing standing between this and an automatic cover**, which is pass 4.
- **Two jobs, then, not one.** (a) Pass 4 clears photos automatically, so one passes more often. (b) The editorial
  pass should weigh *whether a story has a cover-worthy picture* when choosing the lead - which is how magazines
  actually pick a lead, and it is David's "if it has a logo on it, use another story", in the right place.
- **A magazine looks intentional because it repeats.** Fixed grid, fixed furniture, same folio in the
  same corner. Let the model *choose* which of the three page shapes suits a story; never let it invent
  a new one. Variety comes from the content and the art, not from the layout rules moving.
