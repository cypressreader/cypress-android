# Project skills

## Typography (three of twenty-one, from jpoindexter/typography-skills, MIT)

Plain Markdown, read only when a task calls for them. They never ship to the phone, so they cost
nothing at runtime — this is the "pragmatic about tooling that earns its keep" half of CLAUDE.md §3.

| Skill | Why it is here |
|---|---|
| `microtypography` | Rivers, rags, orphans and widows, hyphenation, tracking, quote marks. This is the open World Edition list: sparse last pages on the Fold, justified text with hyphens, `fixOrph`. |
| `editorial-web-typography` | Pull quotes, drop caps, captions, bylines, subheads, figures. The reader and the edition's openers. |
| `typography-layout-systems` | Elam's eight structural systems — for judging a World Edition spread's structure rather than nudging it. |

**Eighteen were deliberately left out**, including the `type` router: with only three installed a
router would point at files that are not here. The rest (typeface selection and pairing, variable
fonts, font loading, tokens, i18n, accessibility, audit, critique) are either irrelevant to a single
no-build HTML file or already covered by the hard rules in CLAUDE.md §7.

**Two of their rules do not apply here, and the project wins:**
- Body size and face are settled — Literata `--serif`, Cormorant `--fd`, `--disp` for headlines,
  system-ui for UI. Do not reopen them off the back of a skill's heuristic.
- They assume a build step and web fonts loaded per page. We are one file on GitHub Pages.

They can disagree with the installed `vectorlab-ux-skills` set, which hands down fixed numbers
(4/8pt rhythm, weight caps) where these ask for a decision with inputs. Say when they conflict and
why one was followed; never average them.

Whole set, if more is ever wanted (do NOT commit the rest — install globally and it is gone with the
container): `git clone https://github.com/jpoindexter/typography-skills`
