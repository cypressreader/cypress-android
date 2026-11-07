# CyPress Reader as an e-reader: feasibility and concept brief

Prepared 2026-11-06 for David. Research only: no repo files were changed.
Line numbers refer to `www/index.html` as it stands on this date (18,101 lines). They will drift, so grep the symbol name first.

---

## The short answer

**No, it isn't a stretch. It's closer than it looks, for one surprising reason: CyPress already *writes* EPUB books.** "Send to Kindle" builds a real EPUB 3 book on the phone (`epubMake`, line 17261). It already has a cover made on the device, a grouped table of contents, chapters, pull quotes, drop caps, a "Your notes" chapter and a colophon. It's zipped by our own code (`zipStore`, line 17173) with no library. "Make a PDF" is also our own code. It writes the PDF file byte by byte (`pdfIssue`, line 14711; the `%PDF-1.4` header is at line 15121).

That means we already understand the EPUB format from the inside. Reading an EPUB is the same process run backwards.

The honest limits:
- **Store-bought Kindle, Apple and Kobo books are locked (DRM). We can't and won't open them.** We can open any DRM-free EPUB. That covers Standard Ebooks, Project Gutenberg, Humble/Tor/indie bundles, many Kobo titles sold without DRM, the user's own files, and our own Kindle books.
- **Reading PDF files is a real stretch** if we use no libraries. Pulling text out of a PDF needs a full PDF engine (what pdf.js does). I'd leave it out.
- **Big books can't go through the paged reader in one piece** (details in section 2). The fix is simple and safe: lay out one chapter at a time. Kindle, Apple Books and Play Books all do the same.

---

## 1. What we already have that a book reader needs

| Need | What we have | Where (symbol, line) | Reuse verdict |
|---|---|---|---|
| Paged reading with a real page turn | Paged reader using CSS columns. The Play Books-style curl is **locked at 1280 ms**. | `openReader` 9838, `layout` 8647, `startTurn` 8749, `mkBox` 8741, `endTurn` 8896, `fitHero` 18001, `fitPage1` 18025 | Reuse as is. Page turn tuning must not change. |
| Scrolling mode | Continuous ("vert") reading, with resume by fraction | `isVert()` branch in `layout` 8656, `rdSetFrac` 13886 | Reuse as is |
| Two columns on wide screens and the Fold | `R.cpv=2` on tablet-wide screens; hinge-aware gap (`hinge()`) | `layout` 8662–8675 | Reuse. Note: the facing-pages "spread" styling was **disabled in 1.77** because it collided at the spine (comment at line 8676). |
| Typography | Literata `--serif`, Cormorant `--fd`, CyPress Display `--disp` (font faces at 3123–3127), plus about 15 bundled fonts in `docs/app/fonts` (EB Garamond, Libre Baskerville, Merriweather, Fraunces, Atkinson Hyperlegible, Lexend…) | CSS 3123+, Aa sheet | Reuse. This is already better than most EPUB apps' font menus. |
| Justified text and hyphenation | `text-align:var(--ta,justify);hyphens:auto;hyphenate-limit-chars` | CSS line 1310 | Reuse. Needs `lang` set from the book's `dc:language` so hyphenation works for non-English books. |
| Aa sheet (theme, font, focus, large print) | Bottom sheet opened from the ... menu (`data-act="aa"`) | `mnMarkup` 12090, theme name 7563 | Reuse as is |
| Themes | `THEME_NAMES` 15996 (includes Black & White `eink`, Mono, High Contrast, Halcyon, Pure Black), `applyTheme` 13030, `twinApply` 12998 | | Reuse. B&W is a natural "e-ink" book theme. |
| Highlights, notes, export | `S.hl` (each highlight stores the whole `art` object). Highlights screen with Markdown export and quote images. | `S.hl` 5191, Highlights screen 11798–11810, `hlText` 11801, `exNotes` (Kindle "Your notes" chapter) | Reuse. A highlight needs a stable `link` for each chapter (see section 2). |
| Text selection bar | `#selbar` (highlight colors, note, share) | markup line 5037 | Reuse |
| Find | "Find in story" marks every match | 17795–17798 | Works within one chapter. Searching the whole book needs a small extra step (search the stored chapter text). |
| Jump to section | ... menu item. Shown when the story has headings (`mnJump` 17799, `rdHeads`). | | Pattern to copy for a "Contents" sheet |
| Progress line with section ticks | `dialTicks` 13900 puts a tick at each h2/h3/h4 | | Reuse within a chapter. For the whole book, ticks would be chapters. |
| Folio (footer line) | `.book[data-folio]` shows "section · title · page" (CSS 311, set at 8725) | | Already a running foot. Change it to "Book title · Chapter · page" for books. |
| Resume position | `S.pos[link]` = page number (8726), capped at 300 entries | | Not good enough for books: page numbers change when the font or size changes. Store a fraction or paragraph index instead (`rdSetFrac` already supports fractions). |
| Listen (read aloud) | `ttsCollect` 10129, `ttsChunk`, `ttsFrom`, word marking `ttsMark`. **Natural voice** (Kokoro, on the phone, works offline: 10346–10352). Lock-screen media controls (`CyMediaService`, `mediaSession` 10072). **Sleep timer** (`SLEEP`, 10028). Hands-free reading continues to the next item (`digEnd` 9997, `syncUpNext` 15914). | | Almost an audiobook player already. "Next item" just needs to mean "next chapter". |
| On-device AI summary | `CySummaryPlugin` (Gemini Nano through ML Kit; text never leaves the phone) | native/extras | Could write a "Previously…" chapter recap (phones that support it only) |
| "Why it matters" box | `whyBox` 13964, built from the feed summary | | Turn off for books, or replace with an epigraph or recap (section 4) |
| Reading time | `readMin`, `rdWords` 7444, `R.words` | | Reuse. Show "minutes left in chapter / book". |
| Reading stats | `S.st.d[day]` = {m: minutes, f: finished, n}. Sunday "Your week" card 15764, Stats screen, Almanac 13564–13578. | | Book minutes would count automatically if the reader's timer runs. Add "chapters finished" and "books finished". |
| Saved / library ideas | `S.saved` (up to 1000, `isSaved` 6207). Back issues store bundles of stories in IndexedDB under `bi:` keys (`biSave` 17376, `biAll`). | | Back issues proves we can keep large bundles on the device. Books need their own store (below). |
| Offline storage | IndexedDB database `cypress` v2, one store `art` with a time index (`idbOpen` 11736, `idbTx` 11737). Full story text cached as `AC` / `folio-art` (11734). The erase-everything path deletes the DB and caches (13825). `navigator.storage.estimate`/`persist` already used (9506, 10390). | | Put books in a **separate database** (e.g. `cypress-books`) so feed cleanup can never touch them. Add it to the erase path. |
| Native decompression | `CompressionStream('deflate-raw')` 15579 and `DecompressionStream` 16711 are already used | | This is exactly what EPUB ZIP entries need. No library. |
| HTML cleaning | `DOMParser` use (5737, 5825, 5948), `clean(n,base)` 5606, `tidy` 9114, `legalBody` 5821 | | Use a **lighter book-only cleaner**. The web cleaner removes "junk" that would wrongly cut book text (short lines, "Chapter" headers, poetry). |
| A fast path for text that's already ready | `openReader` 9862: *"a story that was got ready ahead of time goes straight onto the page: no network, no parsing"* (`AC[a.link].c` → `fastH`) | | **This is the key hook.** A stored, cleaned chapter goes straight onto the page through this existing path. |
| File picker | `<input type="file">` already used for importing a list of sites (line 5066), and it works inside the Android app | | Proven on the phone. An `.epub` picker is the same thing. |
| "Open with CyPress" | `OPML_FILTER` in `scripts/prepare_android.py` 123–133 adds a VIEW intent filter. `CyExtras.handleFile` (CyExtras.java 122–155) reads the file and hands it to the page. | | **The exact precedent for EPUB.** But that path caps files at 2 MB and passes them as text. Books (2–50 MB, binary) need to be copied to app storage and handed over as a file address. About 40 lines of Java plus one manifest filter. |
| Share-to-app | SEND text/plain filter (`SHARE_FILTER` 102) | | Could also accept a shared `.epub` (SEND with a file stream) |
| Sync | User-owned encrypted relay with a sync code (AES-GCM, 13691; copy at 13720) | | Sync **reading position and highlights** for each book, not the book files |
| Send to Kindle / Make a PDF | `exKindle` 17332 → `epubMake` (EPUB 3 + NCX, cover from `exCover`, B&W or color via `exJpeg`). `exPdf` 17148 → `pdfFinish` 17062 → `pdfIssue` 14711 (our own PDF writer). Kindle sends by email through `saveFile` 5139 with an email extra. | | Reusable for "bind this week into a book" and for checking our importer against books we made ourselves |

**Android permissions:** none new. Opening a file from the picker or "Open with" gives a one-time read grant. No storage permission and no location.

**APK size:** no change if we use no libraries. Only about 40 lines of Java and one intent filter.

---

## 2. What's missing

### 2a. Opening the file (EPUB = a ZIP of web pages)
- **ZIP reader** (about 60–80 lines): find the end-of-directory record, walk the central directory, then for each file either take the bytes as they are (stored) or pipe them through `new DecompressionStream('deflate-raw')`. We already have the mirror-image writer (`zipStore`) and `crc32`. Read files lazily, one chapter at a time, so a 40 MB illustrated book never sits in memory whole.
- **The book's structure:** `META-INF/container.xml` → the OPF file (`DOMParser` with `application/xml`) → metadata (title, author, language, cover), manifest, **spine** (reading order). Contents comes from the EPUB 3 `nav.xhtml` or the EPUB 2 `toc.ncx`. All of this is native browser APIs.
- **Chapters:** parse each XHTML file with `DOMParser`, then:
  - remove scripts, forms, iframes and event handlers
  - rewrite image `src` to blob URLs taken from the ZIP
  - rewrite internal links to chapter#anchor jumps
  - turn `epub:type="noteref"` footnotes into pop-up notes
- **Book CSS:** ignore it by default and use our house typography, which is the whole point. Offer an "Use the book's own style" switch, the way Apple Books does. Embedded fonts can load through `new FontFace(name, arrayBuffer)` when that switch is on.
- **Other formats:**
  - Plain text and Markdown: easy (split chapters on headings or "Chapter" lines).
  - Our own Kindle EPUBs: free, since they're EPUBs.
  - Web articles turned into a book: already exists (`epubMake`).
  - **PDF:** skip. There's no native text extraction, and pdf.js would break the no-libraries rule. Android could hand PDFs to another app.
  - **MOBI/AZW/KFX:** no.
- **DRM:** no. Be upfront in the UI: "Books bought from Kindle, Apple or Kobo stores are locked to their apps. CyPress opens DRM-free books."

### 2b. Large books and the paged reader (the biggest technical point)
How pagination works today:
- The paged reader lays out the **whole story** as CSS columns (`layout`, 8668–8681).
- It counts pages from `scrollWidth`. If a story comes out at **more than 400 pages**, it **falls back to one plain column** (guard at 8684, `R.np>400`).
- **Every page turn clones the whole story view** (`mkBox` 8742: `$('.view').cloneNode(true)`) and then removes the off-page parts (`cutOf`).

A 100,000-word novel is about 400 phone pages, and every turn would copy all of it. So:
- **Rule: one chapter (spine item) at a time.** Split any chapter over about 8–10k words into parts at paragraph or heading boundaries.
- At the last page of a chapter, the next chapter loads through the fast path. The end-of-story flow (`finShow` 7721, `R.ctx` list) already moves to the "next story". For a book, that means the next chapter, and it should feel seamless.
- `fitHero`/`fitPage1`/`fitWhy` assume a news story (hero image, title block, "Why it matters"). Books need these to do nothing, or a dedicated chapter-opener style. **Gate them with a flag (e.g. `curA.book`), and don't retune them.**
- Memory: keep only the open chapter's DOM plus the cover and contents. Revoke blob URLs on close.

### 2c. Reading state
- **Each chapter is a "story" with a stable link**, e.g. `book:<bookId>/<spineIndex>` (bookId = hash of `dc:identifier` + title). Highlights (`S.hl[].art.link`), `S.pos`, `S.read` and stats then work unchanged.
- Opening a highlight from the Highlights screen calls `openReader({...h.art,html:''})` (11808). The book link must route to the book store, never to the network. Make `openReader` skip `getFull`/`online()` for `book:` links: one guard near line 9862.
- **Book position:** store chapter index + fraction (not page number), so it survives font changes. Book-wide percentage comes from word counts computed at import.
- **Sync:** add book positions and highlights to the encrypted sync payload. Book files stay on each device. Match books across devices by `dc:identifier`.
- **Bookmarks:** a small list per book (chapter + fraction + a snippet). "Save" in the ... menu could mean "bookmark this page" inside a book.
- **Contents sheet:** a new sheet copied from the Jump to section / ... menu pattern. It must follow the a11y rules: `role="dialog"`, focus trap, return focus.
- **Dictionary:** nothing exists yet. The privacy-first option is the Android text "Process text" / "Define" intent, which sends the word to a dictionary app already on the phone with no network. A web lookup (Wiktionary) would be a third-party request and must be disclosed. I'd skip it or make it opt-in.
- **Cover art:** the OPF `cover-image` manifest item (EPUB 3) or `<meta name="cover">` (EPUB 2). If there's none, draw a typographic cover. `exCover` already draws one in canvas with the house fonts.
- **Library screen:** new (section 3).
- **Stats:** minutes already accrue through the reader timer. Add "chapters" and "books finished" to the Sunday card and the Almanac.

### 2d. Getting files in on Android
- **In-app:** `<input type="file" accept=".epub,application/epub+zip,text/plain,text/markdown">`. This already works in the WebView (we use it for OPML).
- **"Open with CyPress" from Files, email or Downloads:** add an `EPUB_FILTER` beside `OPML_FILTER` in `prepare_android.py`, with `application/epub+zip`. Some file apps label EPUBs as `application/octet-stream`, so also add a `pathPattern` for `.*\\.epub`. Then extend `CyExtras.handleFile` so that instead of the 2 MB text read it copies the stream into the app's files folder and emits `{book: "<capacitor file url>"}`. The page fetches that as a Blob. Device-only: log in TESTING.md.
- **Web version:** the file picker works. Storage limits are the browser's.

---

## 3. Where it would live without getting in the way

Today's navigation: the side panel holds The Daily, All Stories, Saved, Highlights, History, Stats and Back issues (`data-sel` values `today all saved notes hist stats bi`, around line 6218). `render0` (6565) routes on `S.sel`, with prefixes `f:` folder, `s:` site, `k:` saved search.

**Option A, "Books" in the side panel, next to Saved (recommended).**
- `S.sel='books'` shows a bookshelf. `S.sel='b:<id>'` shows one book's "edition front" (cover, contents, continue button).
- It adds one `render0` branch and one side-panel row. Nothing in feeds, refresh, ranking, unread counts or the Daily changes.
- The row shows only when you have at least one book, or behind a single Settings switch, "Books (beta)". New users see zero change.

**Option B, a book as a special "site" or folder.**
- Chapters would show up as stories in All Stories.
- **Not recommended.** It would pollute ranking, unread badges, "quiet sites", refresh logic and search, and break "nothing else changes".

**Option C, a "Keep reading" / "Today's chapter" slot in The Daily (recommended as an add-on to A).**
- One card, placed after the cover section using the existing `sh()` / `DAYDEK` section pattern.
- It appears only when a book is in progress and the user hasn't turned it off. It looks like a newspaper's serial-fiction column.
- Low risk. The Daily is locked in parts (HANDOFF §1), so this slot must not change the existing sections, their order or `jumpTop`.

**Option D (later, if wanted), opening a book from "Up Next" or the widget.** It reuses the existing hands-free queue.

**Recommendation:** A + C. Import lives in the Books empty state ("Open a book file") and in Android's "Open with". **Don't add it to the Add a site dialog**: it's a different job, and that dialog has a11y history (the nested form dead end).

---

## 4. The beauty bar

### What the best apps do well, and where they fall short (from what I know of them)
- **Kindle (app and devices):**
  - Good: Bookerly typography, X-Ray, Word Wise, Whispersync, Page Flip, "Popular highlights", the quiet e-ink calm.
  - Bad: closed format, DRM, ads (Special Offers), a store-first home screen, weak control over layout and fonts, generic covers in lists.
- **Kobo (app; Libra/Clara/Sage devices):**
  - Good: very fine typography controls (line spacing, margins, weight), reading stats ("Reading Life"), Pocket integration (now gone), OverDrive, a pleasant page feel on e-ink.
  - Bad: busy app UI, store prompts.
- **Apple Books:**
  - Good: the most "beautiful" mainstream reader: curl animation, themes with personality ("Quiet", "Paper", "Bold", "Calm", "Focus"), reading goals, a continuous scroll option, and publisher-designed fixed layouts that are lovely.
  - Bad: Apple-only, slow with big libraries.
- **Google Play Books:**
  - Good: the page curl we already copied, "Bubble Zoom" for comics, dictionary/translate, good EPUB uploads (DRM-free).
  - Bad: plain design, upload goes to Google's cloud (a privacy cost).
- **Readwise Reader:**
  - Good: highlights first, Ghostreader AI, EPUB plus web in one inbox, export everywhere.
  - Bad: subscription and cloud, utilitarian design.
- **Instapaper / Matter:**
  - Good: lovely article typography and text-to-speech (Matter's voice). Matter treats reading as a feed.
  - Bad: thin or no real book support, cloud accounts.
- **Libby:**
  - Good: warm library experience, good audiobook player, "tags" shelves.
  - Bad: everything is DRM loans. We can't integrate with it, and shouldn't pretend to.
- **BookFusion / Moon+ Reader / Yomu / Leaf:**
  - Good: power features (Moon+ has dozens of gestures, auto-scroll, sync via your own Dropbox; Yomu has a clean Apple-style shelf; BookFusion has cloud sync and a web reader).
  - Bad: settings overload (Moon+) and a "utility" look.
- **E-ink devices (Kobo Libra, Boox, reMarkable):**
  - Good: no glow, no notifications, physical page buttons, reMarkable's handwritten margin notes.
  - Bad: slow, and Boox's Android looks generic.

**The gap we can fill:** no top reader treats a book as a *beautifully printed edition*. They all show a book as a scrolling grid of covers plus a plain page of text. CyPress's identity is "magazine-style, typeset, private". That's our edge: typesetting and the sense of an occasion, not feature count.

### 12 ideas that go further

1. **Every book as an "edition".** Opening a book shows its own front page:
   - a full-bleed cover
   - a typeset title page in CyPress Display (`--disp`) with author, year and publisher
   - a brass rule and a contents list styled like the Daily's "In this issue"
   - "Continue from Chapter 7 · 14 min left in chapter".

   It reuses `exCover` drawing and the Daily cover styles (`dayCoverHtml`/`.dcov`), not new design.
2. **Chapter openers as section fronts.**
   - Each chapter begins on a new page with a sunken start: chapter number in small caps, title in the display face, a drop cap (the reader already does drop caps).
   - Typographic touches: a chapter epigraph set like a pull quote, and an ornament between scene breaks (`<hr>` → a centered ❦ or the cypress mark).
3. **Running heads and folios done properly.** Book title on the left page, chapter on the right in the two-column view, page number in the folio. Instead of "page 212", it says *"8 min left in chapter"*, a reading-time folio like Kindle's, but typeset. It's a small change to `bk.dataset.folio` (8725).
4. **Today's chapter (the newspaper serial).** An opt-in Daily slot gives you the next chapter as "today's installment", like Dickens in a newspaper. It's paced by your chosen minutes per day. The Sunday edition summarizes the week's installments. No other reader does this, and it fits our identity exactly.
5. **"Previously…" instead of "Why it matters".** If you come back after 3+ days, a short recap of the last chapter appears in the Why-it-matters box spot. It's written on the phone by Gemini Nano (`CySummaryPlugin`) on phones that support it. Otherwise it shows the last paragraph you read and your last highlight. Fully private.
6. **The commonplace book.** Book highlights and notes collect into a beautifully typeset "Commonplace book", grouped by book, with margin-note styling. It exports as Markdown (exists), as a PDF (`pdfIssue`), or as an EPUB to Kindle (`epubMake` already has a "Your notes" chapter). Quote cards for sharing already exist (`quoteImage`).
7. **Audiobook mode.** "Listen" with the on-device Natural voice, continuing chapter to chapter, with lock-screen controls and the sleep timer, all already built. Add "end of chapter" as a sleep-timer choice, plus a full-screen "now playing" with the cover. Private and offline, unlike Kindle/Audible-style voices. The word-highlight while listening (`ttsMark`) is the "Immersion Reading" Kindle charges for.
8. **Bind this week into a book.** One button on the Sunday edition turns the week's long reads into a proper book in your library, with a cover, contents and colophon. It reuses `epubMake`, but saves to the library instead of email. Back issues become a shelf of "Sunday Editions".
9. **Public-domain shelf ("The Reading Room").** A hand-picked shelf of 50–100 classics with direct download links built into the app, so there's **no catalog browsing request at all**. Sources:
   - **Standard Ebooks** (beautifully produced). Note: their OPDS catalog feed is restricted to Patrons Circle members, but single-book downloads are free on the website. Verified 2026-11-06 at standardebooks.org/feeds.
   - **Project Gutenberg**.

   **Privacy:** downloading sends your IP address to that site. It must go on `docs/privacy.html` and should be said in a single line on the shelf ("Downloads come straight from Standard Ebooks"). No tracking, no account.
10. **E-ink calm mode.** On the Black & White theme, use no page-curl animation (the locked curl is untouched; this only *skips* it in this theme) and a crisp instant page change. It also hides the progress line and clock. It makes Boox/Android e-ink tablets feel native. Respects reduced-motion.
11. **A two-page spread on the Fold.** When the Fold is open in landscape, show true facing pages with a gutter shadow, a running head on each page and the folio outside. Honest note: the spread styling was **disabled in 1.77** for spine collisions, so treat this as a separate careful task after the MVP. Two columns already work.
12. **Import your Kindle highlights.** A Kindle device keeps `My Clippings.txt`, and the Kindle app can export notebooks. Import those into the Commonplace book, even for books you can't open in CyPress. It brings your reading life together on your own device, with no Amazon account connection.

Smaller touches:
- "Book finished" gets a typeset end page with the colophon (we already make one for Kindle books) and your stats for the book (days, minutes, highlights).
- It counts in the Almanac.
- The progress line shows chapter ticks for the whole book.

---

## 5. Effort, risk and what must not change

### Phases (rough sizes, in Claude sessions of about 8 turns)
- **Phase 0, prototype (1–2 sessions, feature branch, web preview):**
  - ZIP reader + OPF/spine/nav parsing
  - a book-only cleaner
  - store chapters in a new `cypress-books` IndexedDB
  - open chapter N through the `openReader` fast path with a `book:` link
  - a "next chapter" handoff.

  Test with a Standard Ebooks novel and one of our own Kindle EPUBs. **Measure:** page-turn smoothness on a 10k-word chapter, and the time to open a 300k-word book.
- **Phase 1, MVP (3–5 sessions):**
  - Books shelf (Option A) with covers, and the edition front page
  - Contents sheet (a11y-compliant)
  - position by fraction for each book, bookmarks
  - footnote pop-ups, images
  - highlights + Find in the current chapter
  - Listen across chapters
  - stats minutes / books finished
  - Android "Open with" + file picker (APK build; TESTING.md entries)
  - plain text / Markdown import
  - erase path updated
  - US-spelling copy
  - whats-new + version bump.
- **Phase 2, delight (4–8 sessions, pick and choose):**
  - chapter-opener styling, running heads/reading-time folio
  - Today's chapter in the Daily
  - "Previously…" recap
  - Commonplace book
  - audiobook now-playing + sleep to end of chapter
  - Bind this week
  - Reading Room shelf (+ privacy page)
  - e-ink calm mode
  - Kindle clippings import
  - sync of book positions
  - Fold spread (last, riskiest).

### Risks (honest)
- **Big books in a one-file app:** fine *if* we lay out one chapter at a time and keep only that chapter in the DOM. Laying out a whole book at once would hit the 400-page guard (8684) and make every turn clone the whole book (`mkBox`). This is the one rule that must not be broken.
- **Memory:** illustrated books (comics, cookbooks, art books) can be 50–200 MB. Read ZIP entries lazily and store image Blobs, not base64. Fixed-layout (pre-paginated) EPUBs, mostly children's and comics: don't support them in v1. Say so.
- **The delicate layout code:** `fitPage1`/`fitHero`/`fitWhy`/`fillVoids` are tuned for news stories. Book chapters should skip them through one flag, not change them. Any change there is Opus work.
- **The web cleaner eating book text:** use a separate, simple book cleaner. Don't route books through `clean`/`junkDom`/`legalClean`/`footerish`/`textQuality`, which reject or cut "junk-looking" text.
- **Storage eviction:** call `navigator.storage.persist()` when the first book is added. Show the space used in Settings (that code exists at 10390).
- **Messy real-world EPUBs:** broken XHTML (fall back to the `text/html` parser), odd encodings, missing nav. Test with 10 varied files.
- **Device-only checks** (list for TESTING.md): "Open with" from Files/Gmail/Downloads, file picker, large-book memory on a low-end phone, Listen across chapters on the lock screen, Fold layout.

### What must not change
- Page turn: Play Books style, tap turns 1280 ms. **Locked; don't retune** (HANDOFF §4).
- Reader rules in HANDOFF §1: no spanning title block in the paged reader, justified text with hyphens, Aa sheet from the ... menu, "Why it matters" stays for stories (`whyBox`), return-to-feed freezing (`rdFreeze`, `rdAnchorSave/Restore`, `patchProg`).
- The Daily's locked structure (`sh()`, `DAYDEK`, cover number, `jumpTop`).
- No windowing of the feed DOM (dead end); no rebuilding the "Flip through pages" magazine view (`mgp`, removed).
- Privacy promises:
  - zero tracking, no accounts
  - every new third-party request disclosed on `docs/privacy.html`
  - no location
  - books never uploaded anywhere (sync carries only encrypted positions and highlights to the user's own relay).
- Copy rules: never "RSS"; US spelling; "CyPress Reader"; no "free" promises (don't market the Reading Room as "free books"; say "classic books in the public domain").
- Single-file app: all new code goes into `www/index.html`. No modules, no libraries.

---

## Executive summary
1. Making CyPress an e-reader is not a stretch: it already **writes** EPUB books (`epubMake`, 17261) and PDFs (`pdfIssue`, 14711) with its own code.
2. Reading EPUB is the reverse: a ZIP reader using the browser's built-in `DecompressionStream` (already used at 16711) plus `DOMParser`. No libraries, no change to APK size.
3. About 70% of a great book reader exists: page curl, scroll mode, house fonts, themes incl. Black & White, hyphenation, highlights/notes/export, Find, sleep timer, offline Natural voice with lock-screen controls.
4. The key hook: `openReader` already has a "ready ahead of time" fast path (9862). A stored book chapter can go straight onto the page through it.
5. The key limit: the paged reader lays out a whole story and clones it on every turn (`mkBox` 8742), and gives up past 400 pages (8684). So books must load **one chapter at a time**, as all top readers do.
6. Android "Open with CyPress" has an exact precedent (the OPML filter + `CyExtras.handleFile`). Books need about 40 lines of Java to pass large binary files.
7. DRM: store-bought Kindle/Apple/Kobo books can't be opened. DRM-free EPUBs (Standard Ebooks, Gutenberg, indie, your own) can. PDF reading is a stretch; leave it out.
8. Best placement: a "Books" row in the side panel next to Saved (`S.sel='books'`), plus an opt-in "Today's chapter" card in the Daily. Feeds, refresh and ranking stay untouched.
9. Our edge over Kindle and Apple Books is typeset occasion, not feature count: each book as an "edition" with a title page, chapter openers, running heads and a reading-time folio.
10. Standout ideas: newspaper-serial "Today's chapter", private on-device "Previously…" recaps, a Commonplace book, offline audiobook mode, "Bind this week into a book", a curated public-domain Reading Room (privacy page must disclose it).
11. Plan: prototype 1–2 sessions → MVP 3–5 → delight 4–8, each on a feature branch, with device checks logged in TESTING.md.
12. Must not change: the locked 1280 ms page turn, `fitPage1`/`fitHero` tuning (books skip them through a flag), the Daily's structure, and the privacy and copy rules.
