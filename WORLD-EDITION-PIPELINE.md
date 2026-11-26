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

## What is built (2026-11-26)

Three scripts, one browser, no model. Each one calls the app's own code rather than a copy of it, so there is
no second reader to keep in step.

| Step | File | What it does |
|---|---|---|
| Open the app | `scripts/edition/app.js` | Serves `www/` and opens it in a headless browser. Shared by the rest; `--fixtures` answers off-site addresses from local copies so the whole path runs offline. |
| Pass 0, pick | `scripts/edition/pick.js` | Reads the feeds, groups the headlines with the app's own `group()`, counts how many separate outlets carried each story, and fills each section's fixed number of places, biggest story first. Feed addresses come from the app's own catalogue (`CAT`); the desks — which outlets each section reads — are the only new list, at the top of the file. |
| Pass 1, gate | `scripts/edition/gather.js` | Opens every candidate through the app's `getFull()` and drops what cannot be read, is gated, or has under 3 paragraphs / 120 words. `--candidates` takes the picked list. |
| Pass 7, write | `scripts/edition/compose.js` | Writes `world-edition.json` and the `docs/app/` copy from what survived. Only with `--write`; under 10 stories it writes nothing and says the live edition stays. |

Three things learned building it, all of them load-bearing:

- **A feed reader is judged by its headers.** Fetching the feeds from Node with our own user agent was refused
  by 19 of 73 outlets — BBC, NPR, The Guardian, Ars Technica, Wired all answered 403. The same addresses
  fetched through the open browser answer normally. 17 still refuse a cloud address outright (BBC, The
  Guardian, Ars Technica, The Verge, Wired, ESPN); the app has relays for exactly this and the pipeline will
  need them too, or the scheduled Action will run with a third of its desks silent.
- **One story per outlet per section.** A desk whose other feeds go quiet otherwise fills its whole section
  from whichever outlet publishes most often — Space.com twice in Science & Health, one of them an almanac
  item. A section that cannot be filled from different outlets runs short, which the method page allows.
- **The same event arrives under several mastheads** and grouping only merges headlines close enough to each
  other: "FCC says SpaceX can deploy…" (AP) and "SpaceX gets FCC approval…" (Engadget) stayed two groups. So a
  candidate is grouped *with the stories already accepted* before it is taken, by the same `group()` — one
  detector, never two. Near-misses can still slip through; that is pass 2's job, not a second clusterer's.

Still missing before this runs by itself: photographs (pass 4 — nothing is printed uncleared, so every page is
type today), the International desk, pass 2's editorial judgement, and the scheduled Action, which cannot
publish anything until the edition is merged to `main`.

## The rules the picking follows (2026-11-26)

Written after watching real editions come out wrong. Each one is in `pick.js`, `photos.js` or `compose.js`,
and each exists because something specific reached a page that should not have.

**Counting**

1. **Newsrooms, not mastheads.** Two feeds of one outlet are one voice. And a story arriving under four
   mastheads with the *same headline word for word* is one newsroom's copy syndicated four times — the wire.
   Identical headlines count once. Without this, every outlet added makes the front page more a measure of how
   widely AP sells than of what mattered.
2. **Today, not yesterday.** A story gains a point if it broke in the last six hours and loses one once it is
   over a day old. The edition prints twice a day; this is what stops the evening's issue being the morning's.
3. **No outlet speaks more than twice** in one edition, and never twice in one section.

**Where a story belongs**

4. **A news desk refuses sport.** Section-by-source finds what matters and does not know where it belongs: on
   26 November it filed a tennis result in World, Aaron Rodgers in Culture and an ammunition plant in
   Business, purely because of whose feed they came down. Home, World, Business, Culture, Explainer, the
   archive and the Long read now refuse a headline that is plainly sport.
5. **Sport is major events only** (David, 2026-11-26: "A random team winning a random game doesn't matter for
   99% of readers. Now a sport related major story like Kobe Bryant dying or Messi retiring does matter
   because that's a major story affecting all of sports."). The Sport desk takes two kinds and nothing else:
   something was **won** — a World Cup, a Super Bowl, Wimbledon, a championship, a medal, a world record — or a
   **career** ended, was banned, or was sold for a record. Fixture reports, injury news, rankings, fantasy
   columns, odds, previews and recaps are refused, which is most of what a sports feed publishes. A death goes
   to the Obituary page, where a magazine prints one. The section runs short on a day when nothing was won,
   which is the honest answer.
6. **A desk can be a kind of story** rather than a place — Obituary, Explainer, Review and From the archive
   read every feed and match the headline instead.
7. **Not a story at all:** a price cut filed as news, a paid showroom listing, a newsletter round-up, a
   how-to-watch listing, a feed's own furniture ("Saved Stories"), and a headline carrying a bare web address,
   which breaks mid-word when printed word for word.
8. **Google's masthead comes off.** A relayed headline arrives as "Headline - BBC"; the edition prints the
   publisher's own words, so the appended masthead is removed when it names that outlet.

**Pictures**

9. **Ask the others who were there.** A story whose own page has nothing printable is not a story without a
   picture: the grouping already knows which other newsrooms covered it, and up to two of their pages are read
   for the picture the publisher put at the top. On 26 November this found nine of thirty pictures.
10. **Biggest is not best.** A share card (an address saying og, social, share, card, twitter — usually with the
   headline printed across it) is penalised; a figure with the caption the publisher wrote under it is
   preferred; a landscape between 1.2 and 2.2 to 1 opens a page and a portrait fights it; and size counts with
   a ceiling, because 4,000px is not twice as good as 2,000.
11. **The lead follows the picture.** The most reported story leads — unless it has no cover-size photograph
    and another story within one newsroom of it does. That is how a magazine has always chosen its cover.
12. **Nothing is printed uncleared.** Code can measure and reject; only a look can clear. Six marks are
    required and when unsure the answer is no.

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
