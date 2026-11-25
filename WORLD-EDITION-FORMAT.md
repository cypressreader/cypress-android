# World Edition: the edition file

The World Edition tab reads one file, `world-edition.json`, which sits beside the app
(`www/world-edition.json`, copied to `docs/app/world-edition.json` like `index.html`).
Today it is a hand-made sample for Tuesday, November 24, 2026. The daily pipeline will
later write a file in this same format. The app code is `renderWE` in `www/index.html`.

The rule behind the format: **the pipeline reads the edition first and decides; the app only
enforces.** Anything a phone cannot judge (is there a logo in the photo, is this a heavy day,
which shape fits) is decided upstream and written into the file. The app never guesses.

## Top level

| Field | Type | Meaning |
|---|---|---|
| `format` | number | `1`. Raise it when a change would break an older app. |
| `date` | `YYYY-MM-DD` | The edition's date, shown on the cover. |
| `issue` | number | Issue number, shown as "No. 1". |
| `sampled` | number | How many outlets were counted. Used in "8 of 25 outlets". |
| `sample` | boolean | `true` only for a hand-made sample. Stories without a count then say "Chosen by hand for this sample edition". Leave out in real editions. |
| `method` | string[] | The paragraphs of "How this edition was picked". Printed as written. |
| `editions` | Edition[] | One per region. Order is the order in the edition switcher. |

## Edition

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Short id (`us`, `int`). Remembered on the phone as the reader's choice. |
| `name` | string | Shown under the masthead: "US Edition". |
| `regions` | string[] | Country codes (`US`, `GB`) whose readers get this edition as the first guess. The app reads the country from the phone's language setting, never from location. |
| `fallback` | boolean | `true` on the one edition used when no `regions` match. |
| `cover` | Cover | See below. |
| `sections` | Section[] | The ten sections, always all ten, always in the same order. A section that ran short has fewer stories; an absent one has `"stories": []` and is skipped, keeping its number. |

## Cover

| Field | Type | Meaning |
|---|---|---|
| `lead` | `[section, story]` | Index of the lead story. Its headline is the cover. |
| `mood` | `"ordinary"` or `"heavy"` | Heavy day: no photo, no shape, gray accent. |
| `shape` | string or `null` | A name from the fixed library: `ring arc rise fall wave grid bar split cross plus tri square diamond peak dip ripple rays bars stack zigzag frame half spiral horizon` (24). Shown only on a type day that is not heavy. Unknown names show nothing. |
| `accent` | `{night, day}` or `null` | Two `#rrggbb` colors, sampled from the lead photo upstream and adjusted to be readable on each look. `null` uses the house color for the weekday. |
| `photo` | Photo or `null` | The best photo among all outlets' versions of the lead story, or `null`. |
| `logo` | string | Where the name sits today: `top` (big "CyPress" with "The World Edition" under it), `corner` (small, bottom right, for photo days) or `ghost` (very large and faint behind the page). The art director sets it; it should move from day to day. |
| `photoNote` | string | Optional. Why there is no photo. For people, not read by the app. |

### Photo

The photo is shown from the publisher's own address. It is never copied and never stored.

| Field | Type | Meaning |
|---|---|---|
| `url` | string | Must be `https`. |
| `credit` | string | The publisher's own credit line. Empty means no photo. |
| `w`, `h` | number | Pixel size as the pipeline measured it. The app measures again when the photo arrives. |
| `focus` | `[x, y]` | The focal point of the crop, in percent from the left and top. The app crops around it. Missing means the center, which the art director should never rely on. |
| `by` | string | Optional. Who chose the photo and crop. For people, not read by the app. |
| `people` | boolean | `false` only if no identifiable person is in the picture. Anything else counts as `true`. |
| `clear` | string[] | Each check the pipeline passed: `logo`, `text`, `child`, `body`, `grief`, `mugshot`. A missing name fails. |

The app shows the photo only if **all** of this holds, and otherwise shows the type cover:
the day is not heavy; `url` is https; `credit` is not empty; the long side is 1,600 px or
more (declared, and measured again on arrival); all six `clear` checks are present; and not
(`people` with an accusation word in the headline: scandal, charged, accused, alleged,
indicted, arrested, convicted, guilty, suspect, fraud). The cover is complete as a type cover
first; a photo that is late by more than 6 seconds, fails to load, or arrives too small is
dropped and the cover does not change.

## Section and story

Section: `{ "name": "Home", "stories": [Story] }`. The first story is the section's lead.

| Field | Type | Meaning |
|---|---|---|
| `t` | string | The publisher's own headline, word for word. Never shortened. |
| `o` | string | The outlet's name, for the credit. |
| `l` | string | Link to the story. |
| `n` | number | Optional. How many of `sampled` outlets reported it. |
| `why` | string | Optional. Replaces the automatic "Reported by n of N outlets checked". |
| `dek` | string | Optional. The publisher's own summary line **from its feed**, not a sentence taken from the article and never written by us. Shown under a section's lead. |
| `photo` | Photo | Optional. Same object and same checklist as the cover photo. Used when the story is its section's lead: the section then opens with the photo. No photo, or one that fails, gives a type opener. |
| `region` | string | Optional. A label above the headline, used by "Around the world". |
| `kind` | string | `article`, `clip` (a broadcast segment), `meter` (needs a subscription), `short` (cut short), `lang` (another language). Everything opens in the reader. Only `article` will ever be read aloud by play mode. The app does not use this field yet. |

## Not in the file

No article text, no audio, no copied photos, no per-reader data. The file is the same for
everyone who reads that edition.

## What the phone does by itself (not in the file)

- **Stories made ready.** When the World Edition tab is shown, the phone fetches and stores each
  story of the edition in the background, one at a time, under the same network rules as the
  Daily (Wi-Fi, not Data Saver or Battery Saver, not while offline). A stored story opens at once.
  A story behind a paywall or meter is never stored past the gate. A story that fails to store
  loads when it is opened.
- **Pull quote.** For a section's lead, once its story is stored, the phone shows the first
  complete quoted sentence of 10 to 36 words, word for word. If none qualifies there is no pull
  quote. Nothing is ever written for it, and the file never carries a sentence from a story.

## Who decides what (issue 29)

The art director (MJ) picks every photo, crop (`focus`), accent, shape and logo placement and
writes them in this file. The app renders those picks and enforces the checklist; it chooses
nothing itself. On a type day with no `accent`, the app falls back to the house color for the
weekday.

## Pages (issue 28)

The edition is paged, not scrolled: cover, contents, one opener page per section, a second
page for a section's other stories, then the method page. One page shows at a time on a
phone; two side by side from 600 px of width. The order of pages follows the file.
