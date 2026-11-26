# OpenType features — lookup table

Rutter calls OpenType "the Swiss Army knife of font formats": more than a container
for many glyphs, it carries programmable substitutions. This is the tag lookup.

**Rule: prefer the high-level CSS property over `font-feature-settings`.** The
standard properties participate in the cascade and inherit sensibly;
`font-feature-settings` replaces the whole list, so a child setting one feature
silently drops every other. Same trap as `font-variation-settings` — Stocks calls it
"the inheritance problem" (§88).

## Figures

| Want | Tag | CSS |
|---|---|---|
| Lining (cap-height, uniform) | `lnum` | `font-variant-numeric: lining-nums` |
| Oldstyle / text figures | `onum` | `font-variant-numeric: oldstyle-nums` |
| Tabular (uniform width) | `tnum` | `font-variant-numeric: tabular-nums` |
| Proportional width | `pnum` | `font-variant-numeric: proportional-nums` |
| Slashed zero | `zero` | `font-variant-numeric: slashed-zero` |
| Proper fractions | `frac` | `font-variant-numeric: diagonal-fractions` |
| Ordinals (1st, 2nd) | `ordn` | `font-variant-numeric: ordinal` |
| Superscript / superior | `sups` | `font-variant-position: super` |
| Subscript / inferior | `subs` | `font-variant-position: sub` |

Lining + tabular is the combination for data tables. Oldstyle + proportional is the
combination for running prose. See `ui-component-typography`.

## Capitals

| Want | Tag | CSS |
|---|---|---|
| Small caps | `smcp` | `font-variant-caps: small-caps` |
| Small caps incl. capitals | `c2sc` + `smcp` | `font-variant-caps: all-small-caps` |
| Petite caps | `pcap` | `font-variant-caps: petite-caps` |
| Titling caps (for all-cap display) | `titl` | `font-variant-caps: titling-caps` |

**Titling caps** are the underused one: capitals redrawn for large sizes, usually
lighter and more delicate than text capitals, because text caps look clumsy scaled
up. Use for all-caps display settings when the family provides them.

Real small caps require a `smcp` set in the font. Without one the browser may
synthesize them by scaling capitals, which yields visibly too-light strokes. Verify.

## Ligatures and alternates

| Want | Tag | CSS |
|---|---|---|
| Standard ligatures (fi, fl) | `liga` | `font-variant-ligatures: common-ligatures` |
| Discretionary ligatures | `dlig` | `font-variant-ligatures: discretionary-ligatures` |
| Historical ligatures | `hlig` | `font-variant-ligatures: historical-ligatures` |
| Contextual alternates | `calt` | `font-variant-ligatures: contextual` |
| Swashes | `swsh` | `font-variant-alternates: swash(<name>)` |
| Stylistic set *n* | `ss01`…`ss20` | `font-variant-alternates: styleset(<name>)` |
| Stylistic alternates | `salt` | `font-variant-alternates: stylistic(<name>)` |

Standard ligatures are on by default and should usually stay on — but **turn them
off for anything letter-spaced**, since a tracked `fi` ligature looks broken. They
also interfere with some search and selection behavior in code contexts.

Discretionary ligatures and swashes are display devices. In running text they become
the "flourishes that stick out" Santa Maria warns about.

## Turning features off

```css
/* disable standard ligatures for a tracked all-caps run */
.eyebrow { font-variant-ligatures: no-common-ligatures; letter-spacing: .08em; }
```

## Availability caveats

A tag does nothing if the font doesn't ship that feature. Stocks notes that font
delivery services vary in which features they include, and that shipping OpenType
features "dramatically increases the number of glyphs and therefore the total file
size." So:

1. Verify the feature exists in the file you are actually serving.
2. If you subset, confirm the subset kept the feature.
3. Budget for it — see `font-loading-and-performance`.

## Sources

- Rutter, *Web Typography* — OpenType as "the Swiss Army knife of font formats";
  programmable automatic substitutions; the figure, capital, ligature, swash, and
  contextual-alternate families.
- Stocks, *Universal Principles of Typography* — §68 harness the power of OpenType;
  §69 alternates; §70 ligatures; §71 numerals; §72 swashes; §73 proper fractions;
  §74 small caps; §75 stylistic sets; §83 OpenType features on the web; §88 the
  inheritance problem; and the file-size cost of shipping features.
- Lupton, *Thinking with Type* 3e — the four figure styles and their uses.
- MDN — [`font-variant-numeric`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric),
  [`font-variant-caps`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-caps),
  [`font-variant-ligatures`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-ligatures),
  [`font-variant-alternates`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-alternates),
  [`font-feature-settings`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings).
