# Next batch — DELIVERED as the mega-prompt 2026-10-10 ~09:20 PDT. Do not add here; use the BACKLOG section at the bottom.

David asked 2026-10-10 ~07:35 PDT to bank changes into ONE prompt, delivered when he says ready. Add items below; do not send until he asks.

# BACKLOG — banked AFTER the mega-push (do not fold into the running prompt)

## B1. Related Reads opens the wrong story
In the end-of-article area, tapping a story under RELATED READS navigates to the wrong story — tapping the AI story opened the NEXT UP (Neanderthal) story instead. Tap targets in the end-of-article cards resolve to the wrong story. (Reported 2026-10-10 on the preview; repro: end of TechCrunch article.)

## B2. Share generates super-long links (parity regression)
Sharing a story from the experiment produces a very long cypressreader.com/s/ URL. Production main had already solved this (short share links) — the experiment regressed. Find the main-app fix and re-apply it. (Reported 2026-10-10.)

## B3. Image retry ("Tap to try again") produces a duplicate
Tapping "Tap to try again" on a failed "PICTURE UNAVAILABLE" box loads the picture but renders it twice (same image in two slots) instead of replacing the placeholder. Dedupe on retry — one image, in the right slot. (Reported 2026-10-10 on the preview; repro: Anthropic/BBC World article.)

## B4. Compare Coverage compares a story with itself / repeats stories
In the Full Coverage view, the COMPARE WITH side-by-side cards can both show the same version (BBC World twice) instead of two different sources' versions (e.g., BBC World vs The Verge). The compare picker should default to two different sources, never the story against itself. Root cause looks like a clustering bug: "ALSO COVERED BY 1 OTHER SOURCE" can list the story itself as the other source (same outlet, same timestamp) — duplicates aren't being bundled, so a story counts as its own coverage. Additionally, the same stories are repeated across three sections — THE STORY SO FAR, ALSO COVERED BY N OTHER SOURCES, and the compare cards all list the identical stories. Consolidate so each story appears once with its role clear. (Reported 2026-10-10 on the preview. David likes the Full Coverage view itself — preserve it, fix the logic.)

## B6. Commerce content elevated to cover story
A WIRED "LG Promo Codes and Coupons for October 2026" affiliate article was shown as the COVER STORY of the Tech feed. Promo/coupon/deal/affiliate/commerce content must never be a cover story — and ideally never styled as editorial at all. Filter or hard-demote commerce content from cover-story eligibility (same family as B-item 7b's event-ad card). (Reported 2026-10-10 on the preview.)

## B7. Unified ad-blindness pass (David approved 2026-10-10)
Instead of whack-a-mole per instance: one pass over every surface — feed ranking, cover stories, drawers, cards, Brief — to detect and consistently handle advertising in all its disguises: event promos (TechCrunch Disrupt countdown card), coupon/deal/affiliate roundups (WIRED LG coupons cover story), sponsored posts. Rules: commerce/promo content is never a cover story, never styled as an editorial card, and demoted or labeled everywhere else. Evidence instances: Phase 2 item 7b, B6.

## B8. "N min left" pill covers footer text
The reading-time pill ("1 min left") floats directly over the footer bar text (e.g., covering "PROPUBLICA · WATCH: …"). David likes the feature — just offset/reposition the pill so it never obscures content. (Reported 2026-10-10 on the preview.)

## B9. New Scientist articles load/paginate oddly
New Scientist was not among the six publishers cleaned up in Phase 2 item 4 and it shows: the page header reads "1 / 3 · last page" (contradictory), the body is flagged "TRUNCATED SOURCE TEXT", and the two-column page split separates headline/image from body awkwardly. Extend the publisher-specific cleanup to New Scientist. (Reported 2026-10-10 on the preview, screenshot saved.)

## B10. Generic article extraction as fallback (the "safe path", David approved 2026-10-10)
Add a Readability-style generic article extractor as the DEFAULT for publishers without hand-written rules, instead of writing per-publisher cleanup forever. Keeps the existing hand-written rules for the big publishers (they stay the quality ceiling); the generic extractor raises the floor so custom feeds and uncovered publishers (e.g. B9's New Scientist) come out readable with zero per-site work. Measure against current output before considering any wider unification — do not replace what already works.

## B11. thehill.com rate-limits the app's fetcher (shows "TAKING TOO LONG")
The Hill opens fine in a real browser but the app shows "TAKING TOO LONG / site is slow to answer". Root cause verified 2026-10-10: thehill.com returns HTTP 429 to non-browser user agents (plain curl got 429 in 0.9s; a browser UA got 200 in 3.2s). The app's fetcher is being throttled as a bot and the app misreports it as slowness. Fix: send a browser-like user agent when fetching thehill.com (and audit other publishers for the same 429 behavior); surface "blocked" distinctly from "slow".

## B12. Fetch gives up too easily on bot-protected sites; retry/back-out-then-return succeeds
HowStuffWorks article: first load pulled only a partial story, then "taking too long" gave up; "open in app" gave a blank page; backing out and re-entering loaded the full story instantly. Root cause verified 2026-10-10: howstuffworks.com answers bot-style requests with HTTP 202 (a bot-challenge page, not the article) — the fetcher can't get the real content on the first attempt. CBS News instance (video, 2026-10-10): the app cycled "trying route 1 of 4" for ~16s and failed, the "View the site here" fallback ALSO hung on "Loading site..." — yet backing out and re-entering loaded the full 3-page article instantly. cbsnews.com verified fast and not bot-blocking (200 in 0.9s either UA), so this is a fetch-pipeline flaw, not site slowness: something about the first attempt fails where the retry succeeds. Fix family: smarter fetch resilience — retry with backoff, don't cache partial/blank results as final, never show a blank page without an honest state, fix or replace the broken site-view fallback, and distinguish "blocked by bot check" from "slow". (Reported 2026-10-10 on the preview.)

## B13. Remove the "Story N of M new" pill entirely (production 1.68)
Phase 2 item 12 was supposed to turn this into a quiet pinned-bar note, but on production 1.68 the "Story 2 of 8 new" pill still floats over article text in the reader and over cards in the feed — and it stays permanently, never dismissing. David's call 2026-10-11: we don't need it at all — remove it, don't restyle it. (Reported 2026-10-10 on production, screenshots saved.)

## B14. Export PDF does nothing — shows "typesetting" then silently fails
Tapping Export PDF shows a typesetting indicator, then it goes away and nothing happens — no PDF, no download, no error. Reproduced on web production 2026-10-10 (MJ live check, logged-out, Today edition): clicking "Export PDF" under the edition cover shows "Typesetting your edition…", then a persistent toast "Your edition is saved as a PDF" — but no download starts, no tab opens, no file materializes after 60s+ of waiting; second attempt identical. The success toast is misleading. (Reported 2026-10-10; environment — web vs Android app — still to confirm from David.)

## B15. "Your Kindle address" dialog copy confuses which address goes in the field
The dialog mixes two different addresses in one paragraph: the field wants the Kindle's @kindle.com address, but the text also talks about "the address you will send from" (a separate Amazon-side approved-sender step). David couldn't tell which one to type. Split them: label the field clearly ("Your Kindle's @kindle.com address") and move the approved-sender note to a separate hint. (Reported 2026-10-10.)

## B16. Shared cover image renders the yellow edition line garbled
Using "Share cover" produces a cover image where the yellow "THE EVENING EDITION · NO 283" line comes out distorted — letters look squished/overlapping and unreadable ("THE EVNN G ED TION"). Looks like a font-rendering bug in the cover image generation pipeline (canvas/SVG text rendering). Everything else on the cover renders fine. (Reported 2026-10-10, screenshot saved.)

## B17. Wire ticker headlines aren't tappable
The WIRE ticker scrolls headlines, but tapping one does nothing — no way to open the story you just saw scrolling by. Ticker items should be tappable to open the corresponding story. (Reported 2026-10-10.)

## B18. Milestone badge text touches the circle edge
In the "7 day streak" milestone badge, the "DAY STREAK" text inside the circle touches/overflows the circle's edges — the text is too wide for the badge. Shrink the text or enlarge the badge so it sits comfortably inside. (Reported 2026-10-10, screenshot saved.)

## B19. Stats box isn't clickable — most-covered story should open on tap
The stats card ("534 new today · 62 sources · 8 saved, unread · MOST COVERED: …") has no tappable elements. Tapping the most-covered story should open it (and ideally the stat blocks could deep-link to their views). (Reported 2026-10-10, screenshot saved.)

## B20. "In this issue" labels aren't tappable and "Saved / Missed" is unclear
The "IN THIS ISSUE · 34 stories · about 102 minutes · Front page · Saved · Missed" strip isn't tappable — "Saved" and "Missed" look like filters but do nothing. Also the meaning of "Saved" and "Missed" isn't self-evident; the copy needs to explain itself (e.g., "3 saved by you · 12 you haven't opened"). (Reported 2026-10-10, screenshot saved.)

## B21. Drop cap collides with first-line caps — doubled letter, shouty lede
When an article's first line arrives in caps, the reader renders the drop cap PLUS the caps run: "A MAN HAS DIED AFTER ENTERING A tiger enclosure…" — the initial "A" appears twice and the first words shout in caps before dropping to normal case. The cleaner should normalize: drop cap plus normal-case text, never both treatments at once. Separately, the drop cap's layout against wrapped lines looks off — the big "A" hangs awkwardly beside the indented second line ("tiger enclosure…") with a gap that doesn't feel designed. Review drop-cap sizing, float, and line clearance. Also TTS: the isolated drop-cap letter is read as a separate letter — "S amsung" instead of "Samsung". When building the spoken text, merge the drop cap back onto its word. (Reported 2026-10-10/11, screenshots saved.)

## B22. Stories landing in the wrong feeds (hard news in Lifestyle)
The Lifestyle feed is showing stories like "Trump weighs joining the fight against Houthis after Riyadh airport attack" and "Christa Pike discharged from the hospital and back in prison" — hard news/politics/crime, not lifestyle. MJ audit 2026-10-11: the default production feed list has NO Lifestyle feed at all (just The Daily, All stories, and a Developers folder with 4 tech blogs) — so the Lifestyle feed is part of David's personal setup, not a default. David's drawer screenshot confirms his Lifestyle folder holds exactly 4 feeds, all legitimately lifestyle (Life Kit, Lifehacker, The Art of Manliness, Zen Habits) — so the news stories are being mixed in by the app's classifier/aggregator, not by a bad source. Fix the story-to-feed assignment so folder views only show their own feeds' stories. (Reported 2026-10-11, screenshots saved.)

## B23. Added feeds vanish — "Added" says nothing about where they went
Adding a feed (e.g., "Riverside County news (Google News)" via Near you) shows "Added", but the feed is nowhere to be found afterward. The "Name and folder" destination picker sits collapsed and easy to miss, so the feed lands in a default location the user never chose and can't find. The confirmation should say where it went ("Added to …") and offer to open it, and the folder picker shouldn't be hidden. (Reported 2026-10-11, screenshot saved.)

## B24. Read-aloud word highlighting lags the voice by a few seconds
During listen mode, the highlighted words drift out of sync with the spoken audio — off by a few seconds. The highlight timing needs to track the TTS position properly. (Reported 2026-10-11, screenshot saved.)

## B25. TTS prosody pass — make the system voice sound directed, not robotic (improvement)
The voice itself is fixed (system TTS), but delivery can improve a lot: SSML pauses at paragraph/section breaks, emphasis on headlines and quotes, rate/pitch shifts per section (brisker for headlines, slower for deep reads), building on the existing two-voice setup (story voice + quote voice). Goal: the same Google voice sounding like a broadcast read instead of a flat robot. David judges by ear on his phone. (Requested 2026-10-11.)

## B26. Deep Reads and Sunday sections scroll stuttery; other sections are smooth
Scrolling the Deep Reads section is noticeably janky while other sections scroll fine — and David confirmed the Sunday tab stutters too, likely because it's full of long reads. So it's something about long-article rendering (taller cards, images, layout work), not the device. Profile and smooth it out. (Reported 2026-10-11.)

## B27. Brief-tab story link escapes to the external site
Tapping "Dwarf Fortress uses version control now" in the Brief tab navigated straight to the external site (simonwillison.net), leaving the app, instead of opening the in-app reader. (Found in MJ's production audit 2026-10-11.)

## B28. Theme picker issues: Typewriter white-on-white + multiple pressed states
In the Typewriter theme, the edition progress text ("0 of 40 read · 3 of 15 min") renders white-on-white and is unreadable. Separately, the theme grid shows multiple "pressed" states at once (one per group), so it's unclear which theme is actually active — the true active theme only shows in the sidebar. (Found in MJ's production audit 2026-10-11; all other 50 themes looked polished.)

## B29. "Position in story" slider stuck at 50
The position-in-story slider reads 50 at both the top and bottom of articles — it doesn't track scroll position. (Found in MJ's production audit 2026-10-11.)

## B30. Stats accuracy: inflated "opened" count, "read to the end" never registers
Stats showed "8 stories opened" after ~4 were deliberately opened, and "0 read to the end" despite articles being scrolled fully to the bottom. Tighten the counting. (Found in MJ's production audit 2026-10-11.)

## B31. Copy and search nits from the audit
- Daily footer says "All 40 stories, finished. That is a proper read." even when 0 stories are read — static copy that misleads.
- "0 of 40 read · 3 of 15 min" — the "3 of 15 min" phrasing is confusing.
- The no-voices Listen message says "Add one in Android Settings > Text-to-speech output" even on desktop web — platform-aware copy needed.
- Article "Filed under" tags can include a junk tag "Name" (bad extracted metadata).
- Settings search returns "Nothing matches 'notification'" — the search index misses real settings. (All found in MJ's production audit 2026-10-11.)

## B32. Trim the reader More menu from 16 items to 10 (David-approved spec)
The More menu is a 16-item junk drawer. Cut: "Show my feeds" (drawer/back covers it), "Full screen" (reader is already full screen on phones), "Translate in browser" (native browser feature), and one of "View the site here" / "Site view for this source" (duplicates — keep one, and it needs the B12 site-view fix). Merge: "Copy link" into "Share" (share sheet already has copy). "Gift this story": DON'T cut — fix it properly. Currently it sends only the image with no link (recipient gets ~5 words, no way to read). The fix David wants: share the Cypress short link with the gift picture set as the link's preview image (og:image), so the recipient sees exactly one picture (the gift card) + the link — no picture/link/preview triple stack. Requires hosting the gift picture at a public URL so messaging apps can fetch it for the preview. Keep: Reading settings, Playback settings, Share, Open in browser, one site-view item, Full coverage, Jump to section, Add to Up Next, Mark as unread, Report junk text. Constraint from David: don't break anything — every kept behavior must still work. (Approved 2026-10-11; gift-story direction decided 2026-10-11.)

## PENDING DECISION — Featured themes dozen
Theme picker restructure (David-approved direction): fix the pressed-state bug (B28), keep a tight Featured row, move everything else behind "Browse all themes". Still needed: David picks the ~12 themes for Featured. He knows his own taste best (he uses Curious Mind on his phone). Remind him when the next batch prompt is being written. (2026-10-11.)

## B33. Image-led Daily cards unreadable — text fights the photo
Cards with background images (e.g., the BBC "Ukraine strikes Yandex data centre" card) render headline text directly over the photo with no scrim — the words clash with the picture and are hard to read. Put a dark gradient behind the text or set the text on a solid panel. (Reported 2026-10-11, screenshot saved.)

## B34. Card headers truncate for no reason ("BBC NE…", "2 MIN RE…")
Daily card header rows cut source names and read times to stubs ("BBC NE…", "THE GUA…", "2 MIN RE…", "1 MIN …") despite whitespace to spare. Let the full source name and read time fit instead of truncating. Also on All Stories cards: the red "N sources" badge is clipped mid-label ("3 so", "8 s" instead of "3 sources", "8 sources") — the badge needs room for its full text and must not collide with the timestamp. Same truncation disease on the Stats screen's Top sources list ("The Guardi…", "New York Ti…", 2026-10-11 screenshot) — fix the pattern everywhere, not just cards. (Reported 2026-10-11, screenshots saved.)

## B35. Add-feed dialog has no Done button — X is the only exit
After adding feeds, the dialog offers no way to finish: the only exit is the X (or Cancel), which reads as abandoning rather than completing. Add a Done button that confirms what was added ("3 feeds added to Tech") and closes the dialog. Refinement from tester feedback: once the feed is added, the bottom "Add feed" button itself should change to "Done" — leaving it saying "Add feed" after the add is confusing. (Reported 2026-10-11, screenshot saved.)

## B37. Feed grid leaves big blank holes — looks broken, not designed
When scrolling feed views, the card grid has large empty gaps (full card-sized blank areas, circled in David's screenshots). This isn't deliberate magazine whitespace — it's holes where cards should be. Likely a grid/masonry layout bug or unfilled lazy-load placeholders. Fill the grid properly. (Reported 2026-10-11, screenshots saved.)

## B38. Bring all cover styles to the designed level of polish (David-approved direction)
The Magazine cover is the benchmark. The weaker styles need the magazine furniture: giant overlaid masthead, edition line, chip-style source kicker, bottom gradient scrim, numbered secondary stories (01/02/03). For deliberate departures (Poster, Broadcast, Cinema), don't stamp on magazine furniture — instead give each its own art direction executed with equal care. David approved mockup directions 2026-10-11 (in workspace/imagine_media/): Poster = Swiss-poster discipline (deep green field, letterspaced serif masthead, gold rules, giant headline, pull-quote, section-labeled teasers — typography is the art); Broadcast = premium newscast graphics (neon photo, glowing chip masthead, lower-third headline band, live ticker with secondary stories); Cinema = auteur title card (letterboxed still, quiet top bar, kicker + centered serif headline below). Also: Automatic currently rotates through all 24 styles daily, so users only see the designed cover by luck — restrict the rotation to top-tier styles. Drop the Elegant italic title style (fights the brand). Parallax verified present on all tested styles, so motion parity is already there. Also: every cover style should be big and full-bleed like the flagship — no small or thumbnail-sized covers. If any style renders small, scale it up to the flagship's presence. Confirmed example: Chapters renders as a small white card with a thumbnail row (screenshot 2026-10-11) — it must go full-bleed too. Split journal also confirmed as a floating card with margins rather than full-bleed (screenshot 2026-10-11) — photo and paper panel should bleed edge to edge. Separate defect in Split journal: the headline text is oversized and clips mid-word ("Avenge", "Dooms", "Exclusi", "Magi...") inside an ugly grey box — text must fit its container and never clip mid-word. (Reported 2026-10-11, screenshot saved.) Clean also confirmed as a floating card with margins rather than full-bleed (screenshot 2026-10-11) — goes full-bleed under the same spec. Counter-example that's nearly there: Top plays already renders big and dramatic (screenshot 2026-10-11) — use it as the scale reference for the others. (Decided 2026-10-11.)

## B39. Cinematic longform article view (David-approved)
Make longform stories feel cinematic when scrolling, inspired by Apple News / Nat Geo features (David's reference video, 2026-10-11): truly full-bleed photos instead of inset rectangles, scroll-linked transitions where images drift at a different speed than text, display typography for section breaks instead of plain subheads, floating captions. Needs fallback rules: stories with one image (lead with it full-bleed, then clean typographic rhythm), stories with no images (typographic treatment carries it — drop caps, pull quotes, section display type — never a broken-looking gap where a photo would be). (Decided 2026-10-11.)

## B36. Quick Looks are buy-blind — no preview of what each one does
The Quick Looks picker (8 options: Newspaper, Magazine, Night reader, Gallery, Modern, Cyber, Cinema, Simple) says "one tap sets the theme and cover together," but the names don't tell you what the combo looks like — you have to tap each one to see. Add a thumbnail preview per Quick Look showing its theme + cover. Also note: tapping one changes your whole theme, not just the cover, which is surprising. (Reported 2026-10-11; MJ verified each look's theme+cover mapping on desktop, where transitions were smooth — David's jerky-transition report may be phone-specific and needs a device check.)

## 1. YouTube inline playback
Replace the "YOUTUBE VIDEO / Opens in YouTube" card with a tap-to-play inline YouTube embed player in the article — video plays in place, no leaving the app. Use YouTube's official embed player. Fallback: when the uploader has disabled embedding, keep the "Opens in YouTube" card.

## 2. App logo as the end mark in all themes
The end-of-article colophon currently shows a generic flourish icon that has nothing to do with CyPress. Replace it with the actual app logo in every theme, using the per-theme icon variants David provided. The end mark should read as the brand signature, not decoration.

## 3. Hero image needs bottom margin
In the article reader, the hero image's bottom edge touches directly against the source label row below it (e.g. the lime-green Verge image sitting right on top of "THE VERGE" with no gap). Give the hero image proper bottom margin so it breathes before the meta block in all reader layouts.

## 4. Sure-fire clean article rendering (pairs with Round 3's fetch-time extraction)
Harden the cleaning pipeline so articles render as story text + images only — no ads, no boilerplate — as reliably as possible:
- Per-publisher extraction rules for the main feeds (TechCrunch, The Verge, Ars Technica, BBC, etc.); hand-tuned beats generic.
- Make "Report junk text" a learning loop: user reports become new publisher rules over time.
- Purity check: if a cleaned article comes out suspiciously short, empty, or ad-heavy, don't render junk — fall back to "View the site here" with an honest note.
- Honest limit: 100% isn't achievable (publishers change markup, some fight readers); the goal is the cleanest reliable render plus graceful fallback.

## 6. Feed text size row is buried
The "Feed text size" row (Compact/Comfortable/Large) works but lives inside the "More Options" overflow in Look and Layout, where nobody will find it. Move it up next to "Story card size" so the three text/density controls sit together.

## 7. Mystery drawer tab, dead box, and text ghosting in article view
In article view there is an unlabeled ">" tab on the left edge; tapping it pulls out a drawer with no header or explanation of what it is. Problems observed on a real phone (video evidence):
(a) The drawer has no label or stated purpose — give it a proper header/tab label so its function is clear, or remove it if it serves no purpose.
(b) Its content can be promo junk: it showed a "THE NUMBER $100" card that is actually a TechCrunch event advertisement ("lock in your pass savings") dressed up as an editorial card. Promo/ad content from feeds must never be styled as editorial cards.
(c) Text ghosting: article text visibly renders doubled (two offset layers of the same paragraphs) when the drawer overlays the paginated article — and the same ghosting happens in feed scrolling on Android (cover headlines and section headers render as duplicate offset copies mid-scroll, likely stale parallax/animation layers). Fix the compositing so no duplicate text layers ever paint.
Also: below the byline there is a large empty rounded box that renders nothing and does nothing when tapped — either render its intended content or remove the dead space. No mystery UI, no dead zones.

## 8. Reader toolbar labels overflow their buttons
In the article reader toolbar, the text labels (Back, Save, Listen, More) render outside/above their pill button boxes instead of inside them — the label sits on the button's top border, half hanging out. Fix the icon+label layout so labels sit inside the buttons or elegantly beneath the icons, in all themes, phone and tablet.

## 9. PWA smoothness on Android and Safari
The PWA feels janky on Safari (macOS MacBook; check iOS Safari too). Do a performance pass over scrolling, page turns, tab switches, and animations on Safari (macOS + iOS) and Android — find and fix the jank.

## 10. Slow refresh indicator on Safari macOS
On Safari on the MacBook, the tree/logo refresh indicator at top left fills very slowly during feed refresh. Investigate: are stories actually loading slowly on Safari desktop, or is the progress indicator miscalibrated? Fix whichever is wrong.

## 11. Article body loads very slowly on Safari macOS
On Safari (MacBook), opening a story can sit at "Loading the full article..." for a long time before the text arrives — no progress feedback, no fallback meanwhile. (Repro: BBC News story from the News feed; articles load fine on Android.) Make extraction fast on Safari desktop, show real progress, and if it fails, fail honestly per item 4 — show the "read on site" fallback instead of hanging.

## 12. "Story 1 of 5 new" pill does nothing and floats
In the article reader, the "Story 1 of 5 new" pill indicator looks tappable but does nothing when tapped. Either make it open the story queue / navigate between the new stories, or style it as a non-interactive indicator. Also: in feed scrolling it detaches and floats over random cards mid-scroll instead of staying anchored — pin it where it belongs.

## 13. Magazine article layout orphans the opening paragraph
In the two-column magazine article layout (wide screens), the article's first paragraph gets stranded at the bottom of the left column below a huge empty void, while the remaining text runs in the right column — reading order jumps headline → void → bottom-left → top-right. Balance the columns so the text flows in natural reading order with no orphaned paragraph and no giant void.

## 14. PDF image crops cut heads off
The PDF export crops photos to fit without regard for faces — wide strips leave headless torsos (two suits with no heads; Vance reduced to a chin; a torso with a hand). Apply face-aware cropping to the PDF export (same as the feed cards): keep faces in frame; where no face is found, fall back to a sensible center-weighted crop. Never ship a headless crop.

## 15. Full-bleed feature opener clips text at the left page edge
On full-bleed feature openers, the text block is shifted left off the page: headline ("ontroversial…", "FK Jr", "uinea-Bissau"), kicker ("E GUARDIAN"), and lede ("wborns") all lose their first letters at the page edge. Keep all opener text inside the page margins.

## B40. Two-page magazine spread for tablet landscape (David-approved)
New reading form alongside scroll and flip: on tablet landscape, show facing pages like an open magazine — left page the visual moment (full photo, big headline), right page the reading (columns, drop cap, pull quote), swipe turns both at once with a subtle spine shadow. Portrait tablets keep single-page flip. Mockup: workspace/imagine_media/media-generation-two-page-spread-tablet-0-3144f9f1-8611-408a-a236-0ec9a33758fd.webp. (Decided 2026-10-11.)

## B41. Feed picker selection state is ambiguous — dot vs highlighted square disagree
In the first-run feed picker, selecting a feed (e.g., CNN) shows BOTH a dot next to it and a highlighted square; tapping again removes the square but the dot stays. The user can't tell whether the feed is selected or not. Two indicators must never disagree — use one clear selected state (e.g., a checkmark), and if the dot means something else (unread/new), it needs to be visually distinct from selection. (Reported 2026-10-11.)

## B42. Masthead descender collides with the edition line
On photo covers, the "CyPress" masthead's descender (the tail of the "y") overlaps the "SUNDAY MORNING EDITION" text below it. Add proper spacing between the masthead and the edition line so descenders never collide with the text beneath. (Reported 2026-10-11, screenshot saved.)

## B43. Swap the Brief and Headlines tab order
Reorder the Daily tabs to Today, Headlines, Brief, Sunday. Headlines is the quick scan and should come before the deeper Brief read. (Requested 2026-10-11.)

## B44. Group feed folders under a collapsible "My Feeds" drawer section (David-approved)
In the navigation drawer, put all feed folders (News, Science, Gaming, Design, Culture, Lifestyle, etc.) under their own collapsible "My Feeds" header, styled like the "The Daily" and "All stories" headers. Collapsed by default to keep the drawer tidy; expands to show folders with counts. Mockup: workspace/imagine_media/media-generation-drawer-my-feeds-mockup-0-68b55a8b-ed77-4aa3-aeef-072de0b803cb.webp. (Decided 2026-10-11.)

## B45. Add-feed flow leaves users guessing (tester feedback 2026-10-11)
Four gaps in one flow: (1) after tapping "add feed" the menu just closes with no confirmation — show a clear "Feed added" popup naming the feed and where it went (pairs with B23); (2) search didn't find CTV/Global but they were addable anyway — a dead-end search that secretly works is confusing, investigate the misses; (3) when search finds nothing, don't leave a dead end — offer the manual path explicitly ("select a folder and tap 'add feed' to add it manually") so users know a miss isn't a refusal; (4) the keyboard auto-opens when the add-feed menu opens, squishing and covering the clickable options — only open the keyboard when the user taps the search field. (Reported 2026-10-11.)

## B46. Feed search overhaul (David-approved)
Make finding feeds actually work: (1) bigger search index so common outlets (CTV, Global) show up; (2) paste-a-URL adding with automatic RSS feed discovery — if the site has a feed, you're in, no search needed; (3) fuzzy matching for typos, abbreviations, and partial names; (4) "did you mean" suggestions on misses before falling back to manual add; (5) OPML import for bringing a whole feed list from another reader; (6) category/topic search — typing "home decor" should return feeds *about* home decor, not just feeds with those words in the name (feeds need topic tags or a topic-to-feeds mapping); (7) click-one-headline training — for sites with no feed at all, user opens the site, taps one headline, and the app derives the pattern and builds a feed from it (Reading Desk technique); learned pattern syncs so other devices can reuse it; (8) URL-pattern shortcuts — YouTube channels, subreddits, GitHub repos etc. map straight to their official free feeds, no scraping needed; (9) change monitoring — tap any element (price, stock status) to get a feed entry each time it changes, via on-device background checks; (10) re-serve generated feeds over home Wi-Fi so other devices can subscribe. Scoping: Android-first (native fetch, no server, no cost); web version only where free via the existing relay — no new web features that cost money or strain the relay. (Decided 2026-10-11.)

## B47. Marketing site pass — cypressreader.com (David-approved)
The copy is honest and plain-spoken; keep that voice. Improvements: (1) hero should lead with the flagship Daily cover, not a laptop screenshot — it's the app's most impressive visual; (2) tighten the iPhone install instructions — currently a wall of text that reads as "this is complicated"; tuck edge cases behind a "trouble?" expander; (3) "Dozens of themes" is said twice — keep it once; (4) give newcomers one clear call-to-action per device instead of burying "Get CyPress" mid-page in a three-way split. (Decided 2026-10-11.)

## B48. Android widget improvements (David-approved)
(1) Make widget stories swipeable — swipe left/right to change stories instead of the tiny prev/next buttons that are easy to miss. (2) Fix the "Next ›" teaser truncating mid-word with a hard "..." — fade it out or truncate cleanly. (3) Verify taps: tapping the card opens the story, arrows (until swipes replace them) cycle stories. (4) Multiple widget sizes — small headline-only and large multi-story options alongside the current medium card. (5) Read state — already-read stories dim or get a checkmark so the widget doesn't resurface them. (6) Save from the widget — a save button right on the card. (7) Edition freshness — a small "N new" badge so users know there's fresh content without opening the app. (Decided 2026-10-11.)

---

# ROUND 3 — predictive preloading ("instant open"). SEPARATE prompt, delivered alongside the batch, not mixed into it. RE-TARGETED 2026-10-11: preview workflow retired — this now aims at main/production.

```
Predictive article preloading ("instant open") — PRODUCTION. Work in a working branch off main, ship target is the production web app + Android app. The experiment/preview branch is retired: do not use it, do not publish a preview.

SEQUENCING: this touches the fetch + extraction pipeline. Build it AFTER the batch's fetch items land (B9 New Scientist, B10 generic extractor, B11 thehill.com, B12 fetch resilience, Item 4 clean-rendering), or coordinate so nothing collides. Fetch-time extraction here must reuse whatever those items put in place, not reimplement it.

AUDIT FIRST: document the existing performance infrastructure on main — the Wi-Fi Daily pre-download, all prefetch/caching paths, and what makes page turns feel fast today. Round 3 audit work may already exist from October 9; if you find it, review and reuse it instead of starting over. Only add what is missing or change what is necessary; do not reimplement what already works.

Then build what's missing:
1. Extend the Daily pre-download to fetch FULL article text, run extraction + cleaning at fetch time, and cache the cleaned HTML. When the user taps a story, the tap path does zero network, zero parsing, zero cleaning — it renders from cache.
2. Read-ahead queue: while the user reads article N, article N+1 (next in their current queue — edition order, feed order, or All Stories Smart rank) pre-downloads, extracts, and cleans in the background, so advancing is instant.
3. All Stories viewport lookahead: pre-download the next N stories by Smart rank as the user scrolls, before they tap.

Gating (non-negotiable): Wi-Fi only for the bulk pre-download; prefer idle/charging; cap by age and count; images stay lazy (text first, pictures on demand). Never burn mobile data or battery for this.

Verify with a test that taps a pre-downloaded story and asserts zero network requests on the tap path. Run the relevant tests.

REPORT: self-report progress as you go (task N of M plus percentage); stop and report if blocked. Commit and push the working branch, then report back with the branch name, commit hash, and test results — DO NOT merge to main, release, or publish. David reviews your report and gives the ship word himself.
```

## B49. Wide-layout breakage on foldable/tablet landscape (David-approved)
Device reference: David's Galaxy Z Fold 8 Ultra — unfolded main display 8.0", 2504×2256, 10:9 aspect (nearly square); folded cover display 6.5", 2520×1080, 21:9. The Fold is the PRIMARY test device, but the fix must be responsive, not hard-coded to 10:9: use width-based breakpoints that behave across common tablet ratios (16:10, 16:9, 4:3, 3:2), and the layout must survive fold/unfold transitions and rotation cleanly (recompute layout on configuration change — stale layouts are likely part of this bug).
On wide landscape screens the magazine/feed layouts don't reflow — text blocks stack and overlap instead of rearranging. Observed 2026-10-11 (videos, production 1.68 on David's Z Fold 8 Ultra unfolded): DAILY — headlines overlapping headlines, "The Front Page" title over the "In this issue" list, drop caps detached from and overlapping their paragraphs ("T he stories...", "T his live blog..."), cover-story headline colliding with photo and body text. NEWS FEED — cover story headline rendered at giant display size wrapping over many lines and overlapping neighbors, header text colliding ("TRENDING..." over story counts and kicker), drop-cap "N" detached from the "News" title, and description text with words glued together ("liveGet", "appor", "podcastLabor" — extractor needs whitespace cleanup). Phone portrait is fine; the wide-layout breakpoint is broken on both surfaces. Fix so every element has its own space at wide widths, and clean whitespace in extracted descriptions. (Decided 2026-10-11.)

## B50. Two-pane reading on wide screens — as an option (David-approved)
On wide screens (unfolded foldable, tablet landscape), offer an optional two-pane layout: story list on the left, open article on the right, so tapping a story doesn't take over the whole screen. Must be opt-in (a toggle), not the default — David wants it as a choice. Design must target the real unfolded ratio (10:9, nearly square — 2504×2256) rather than 16:9; two portrait-ish panes side by side is the natural shape here. Mockup: workspace/imagine_media/media-generation-mockup-two-pane-reading-0-36e55fd0-28c3-49f9-9529-ff1fda45e223.webp (illustrative concept — generic wide tablet, not the exact 10:9 Fold ratio). (Decided 2026-10-11.)

## B51. Photo credit leaks into the article body as the opening line (David-approved)
In the article reader, the photo credit line (e.g., "Fadfebrian/Getty Images" on an Engadget story) renders as text above the story body — it reads as the article's opening line before the lede paragraph. Image credits/captions must be attached to their photo (caption under the image) or dropped, never injected as the first line of the story text. Screenshot: workspace/user/files/AISelect_20261011_181644_1_05qg.jpg. (Reported 2026-10-11.)

## B52. Reading-progress pill should not float — fold it into the bottom bar (David-approved)
The floating "N min left" / "Finished" pill still overlaps content (the B8 reposition didn't hold — screenshot shows "Finished" sitting on top of the footer headline text). David doesn't want the pill at all: the reading state should live inside the existing bottom reader bar (the "BBC NEWS · headline… · 5" footer), not as a separate floating element. Remove the floating pill; show finished/time-left as part of the bottom bar. Screenshots: workspace/cypress-qa-assets/b52-finished-pill-overlap.jpg, workspace/cypress-qa-assets/b52-finished-pill-footer.jpg. (Reported 2026-10-11, production 1.69.)

## B14 follow-up (HOT): Export PDF still does not download on Android (reported 2026-10-11, production 1.69, David's Z Fold 8 Ultra)
The R1 web hardening (link kept in page, blob kept for minutes, "ready" + Save PDF button) did not fix the native path — on the real phone, Export PDF still delivers no file. Claude could not test the Android share sheet; now we have device evidence it's still broken there. Needs investigation of the native save/share path specifically (WebView download handling / share-sheet handoff), verified on a real device or emulator before shipping again.

## B22 follow-up: IN BRIEF still puts hard news in Lifestyle (reported 2026-10-11, production 1.69)
The R1 onSite filter covered the Google News/Bing headline-search fallbacks, but the IN BRIEF section ("Earlier on, 10 from Lifestyle") still surfaces hard news: "Pope Leo XIV to undergo lung surgery", "Hurricane Simon nears Mexico…", "Justice Department investigates TV networks…". The IN BRIEF aggregation path needs the same keep-only-the-feed's-own-stories treatment. Screenshot: workspace/cypress-qa-assets/b22f-inbrief-lifestyle-hardnews.jpg.

## B23 follow-up: add-feed dialog shows blank folder destination when pasting a link (reported 2026-10-11, production 1.69)
When adding via a pasted address, the "Name and folder" section gives no visible indication of which folder the feed will land in — the destination information is blank. The dialog should show/confirm the target folder before adding, not just the post-add toast. Screenshot: workspace/cypress-qa-assets/b23f-addfeed-blank-folder.jpg.

## B53. Add-feed dialog Back button is hard to see and oddly placed (reported 2026-10-11, production 1.69)
In the "Add a feed" dialog, the "‹ Back" link under the search hint is faint and sits in a weird spot above "Starter packs" — easy to miss, unclear what it goes back to. Make it visible and put it where back navigation belongs. Screenshot: workspace/cypress-qa-assets/b53-addfeed-back-button.jpg.

## B54. Remove the "Story N of M" position note from the pinned section header (David-approved)
The sticky section bar that pins under the app header while scrolling a feed shows "Story 6 of 20" (the `<em class="wpos">` note in `#wpin`, rendered by wireChrome). David doesn't want it — same verdict as the floating pill. Remove just the position note; keep the section name and story count ("This morning · 10 stories"), which are useful orientation. (Reported 2026-10-11, production 1.69.)

## B55. PDF edition looks like a textbook — needs a design pass (reported 2026-10-11, production 1.70)
David on the exported PDF: "it just looks very much like a textbook still." The edition object should feel designed and magazine-like — the features read as dense textbook columns with little visual relief. Direction: typography, hierarchy, and rhythm that feel like a finished magazine edition, not a printout. Reference "before": workspace/cypress-release2-assets/b14f-pdf-junk-text.pdf (same file also exhibits the R2 Item 4 junk-text issues; this item is the design layer on top once extraction is clean).

## B56. Cover style picker ignores taps on some styles (reported 2026-10-12, production 1.70, video)
Settings → Look and Layout → Cover style: tapping Splitscreen, Chapters, Journal did not move the selection (checkmark stayed on Poster); only "Automatic" took. Every style thumbnail must select on tap with visible feedback.

## B57. Clear History tap does nothing visible (reported 2026-10-12, production 1.70, video)
History tab → "Clear History": tapping it produced no visible effect — no confirmation, no clearing. Either clear with an undo/toast or show a confirmation dialog; a dead button is the worst option.

## B58. Saved "TIME I HAVE" filter doesn't apply (reported 2026-10-12, production 1.70, video)
Saved shelf → "TIME I HAVE" chip → tapping "15 min" closed the dropdown but the filter stayed on "Any" ("All 10" still shown). The selection must actually filter the list.

## B59. "The story so far" groups unrelated stories (false-positive clustering) (reported 2026-10-12, screenshots)
The Verge's "Android is the best and worst thing about Googlebooks" shows a "THE STORY SO FAR" timeline containing Mental Floss's "The Best—And Worst—States for Teachers in 2026" — a completely unrelated story. The clustering matched on shared "best/worst" headline wording. Second exhibit (same morning): BBC's "Why the US is bringing back firing squads" bundles YES! Magazine's "Bringing Our Kids Back to Just Schools" and PC Gamer's "The studio behind Star Wars Zero Company is bringing back some of its furloughed staff" — matched on "bringing back". The similarity threshold is too loose: stories should only be bundled when they're actually the same story (same event/topic, overlapping entities), not when headlines share generic phrasing. Distinct from B4 (self-matching/duplicates) — this is the inverse failure: unrelated stories bundled together. Screenshots: workspace/user/files/1791814534978_43_kuhs.jpg, workspace/user/files/1791818082572_47_c1qg.jpg.

## B60. Words joined in article body text — "companysaid" (reported 2026-10-12, production 1.72 build 91, video)
The Next Web story "Google launches $180 Fitbit Edge with a bigger screen and AI coach" renders "...the Pixel Watch 5, the companysaid on Monday." — "company" and "said" are jammed into one word. The fetch-time cleaner is dropping the space at an inline-element boundary (likely around a link). Check other stories for the same word-join pattern; the join probably happens wherever an inline tag boundary falls between two words with no surrounding whitespace. Evidence: workspace/cypress-qa/evidence/b60-wordjoin-tnw-1.72.png (text renders before hero image), b60-wordjoin-tnw-1.72b.png (after image pops in); source video workspace/user/media_library/video/c0/c0bb85f6d5d8e942f00137b08af497fd4238ef92df9e78228093ff25eeaee092.mp4 (~13s).

## B61. Story-open transition visibly resizes and stutters (reported 2026-10-12, production 1.72 build 91, video)
Tapping a story in the Tech feed: during the open animation the story view renders mid-transition over the feed with text wrapping mid-word and elements overlapping, then settles ~0.4s later; the animation stutters on device. Two contributors visible in frame analysis: (1) the lead picture is no longer pre-warmed (instant-open round trade-off) — text renders first, the hero image pops in ~0.15s+ later and pushes content down (confirmed: frame at 13.15s shows text with empty image slot, frame at 13.3s shows the image loaded); (2) the transition itself reflows text as the panel expands. Fix direction: reserve the image's aspect-ratio space so the pop-in can't shift layout, and/or make the open transition cheaper (fade instead of a reflowing slide). Evidence: workspace/cypress-qa/evidence/b61-transition-resize-1.72.png (mid-transition, headline wrapping mid-word over feed); source video workspace/user/media_library/video/c0/c0bb85f6d5d8e942f00137b08af497fd4238ef92df9e78228093ff25eeaee092.mp4 (~1.7s).

## B62. WIRE ticker renders garbled text on the Headlines tab (reported 2026-10-12, production 1.73, video)
On the Headlines tab, the WIRE ticker shows scrambled/overlapping glyphs instead of clean scrolling headlines (frames ~32-50s: "WIRE" followed by garbled text like "An sirgle nespaper Nezls..."). Possibly the same stale-layer text ghosting as R3 item 14c, or a broken ticker animation. Evidence: workspace/user/media_library/video/9f/9fed7d8cd4c13a1ccd1b7e561fac95a74a651088a50398b470e166a6da6ce5cc.mp4 (~32-50s).

## B63. "My Feeds" drawer section does not expand on tap (reported 2026-10-12, production 1.74, David's Z Fold 8 Ultra)
The R3 collapsible "My Feeds" drawer section (B44) shows with its chevron but tapping it does nothing — the feed folders never expand. Reproduces on 1.74 right after updating. The R3 agent reported PASS, so the tap handler is likely unbound or the toggle targets the wrong element on device.

## B64. David rejects artificial magazine skeuomorphism in reader (2026-10-12, 1.76)
David on the B40 two-page spread: "The line thing also looks terrible. I honestly prefer how the reading on tablet mode looked before... Making it look artificially like a magazine is ugly." The spine shadow and fake book-fold have to go. If a two-page spread returns, it must be a clean layout, not a skeuomorphic book imitation. (1.77 disables the spread entirely.)

## VERIFIED 2026-10-12: 1.77 spread disable works on device
David confirmed: "The screen is back to normal in terms of turning the page with latest update." The B40 magazine spread is off, reader back to clean layout. Direct-coding workflow continues (his condition to revert to prompt-pasting was not triggered).

## B65. PDF export slow with unclear progress feedback (2026-10-12, 1.77)
David: "It takes a while to make it. I'm not sure if it even does it the first pass or because I click it more than once." The PDF DOES get generated (39-story morning edition verified), but generation is slow and there's no clear progress indication — so he taps multiple times unsure if the first tap worked. Needs: (1) faster generation if possible, (2) clear "working on it" feedback after first tap, (3) disable the button while generating to prevent double-taps.

## B66. Redesign export: per-story + saved-stories PDF/EPUB, drop edition export (2026-10-12, David's redesign)
REMOVE the edition-level "Send to Kindle" and "Send PDF" from the Daily — too many things can go wrong with a 39-story export.

REPLACE WITH:
1. Per-story actions: "Send to Kindle" and "Save as PDF" on individual stories.
2. Saved stories: multi-select → "Make PDF" generates a custom mini-edition from your picks, with an auto-generated cover based on the selected stories.
3. Kindle: send as EPUB (not PDF — PDF is miserable on e-ink), with an e-ink-optimized cover.

FORMATTING REQUIREMENTS (David):
- Fonts must be readable, not tiny (PDFs tend to render small — fix the base font size).
- Strip ALL ads and non-story elements (nav, popups, "sign in" prompts, related-story widgets, etc.).
- KEEP pictures that are related to the story.
- TWO EPUB versions for Kindle: (a) black-and-white optimized (for e-ink Kindles), (b) color (for color Kindles and color e-readers like Kobo Clara Colour).

## PENDING: Deep QA audit of Claude's batch once live (David requested 2026-10-12)
When the new version ships (covers + B60-B63), N.O.A. to do a deep audit — go through it thoroughly, catch anything missed, and add findings to the bank for the next batch.

## B67. Redesign Android home-screen widgets (2026-10-12, David requested)
Current widgets look bad (monotone dark-green wash, dead empty space, cluttered). Replace with 3 widgets designed from research (Google News, NYT, Apple News, Android guidelines):
1. Top Story (2x2): one big story using the "Type" cover language (outlined edition number, serif headline, sage bg).
2. Headlines (4x2 resizable): 3-4 stories, clean 3-role type hierarchy, light + dark, taller = more stories.
3. Ticker Row (4x1): one breaking story, glanceable.
Design mockups: workspace/your_files/widget-designs/cypress-widgets.html
Principles: one job per widget, no dead space, 48dp tap targets, dark mode designed not inverted.

### B67 behavior (David-approved 2026-10-12):
- Top Story (2x2): cycles through top 4-5 stories, auto-advances every 30 min, manual arrows to flip.
- Headlines (4x2): 3-4 stories, no cycling, refreshes on new edition.
- Ticker (4x1): cycles breaking stories every 15 min.
- All refresh immediately on new edition publish (morning/evening). Show "updating" shimmer while refreshing, never stale headlines.

## B68. Cover style names may not match their new looks (2026-10-12, David noted)
After the 1.80 cover redesign, some covers look different enough from their old selves that their names no longer fit. Review all cover styles against their names — rename any whose look has drifted far from what the name promises. David specifically: "some of the covers might need new names because they look different now than they used to."

## B69. PDF export leaks "FOR SUBSCRIBERS" paywall text into stories (2026-10-12, David found)
Exporting the evening edition to PDF, stories contain raw "FOR SUBSCRIBERS" markers jammed against headlines (e.g., "FOR SUBSCRIBERS Attack on Saudi airport dials up pressure on D.C."). These are paywall labels from the source article that should be stripped in the export. 30 instances found in CyPress-2026-10-12-evening PDF. Screenshot: workspace/user/files/14926_0_luwn.jpg. Full PDF: workspace/user/files/CyPress-2026-10-12-evening_2_1dag.pdf

## B70. Export PDF needs multiple taps to start (2026-10-12, David found)
Tapping "Export PDF" does nothing the first time (or first few times) — David has to tap it multiple times before the export actually begins. Should work on the first tap.

## B71. Saved Stories share is all-or-nothing (2026-10-12, David found)
In Saved Stories, sharing only offers one story or all 10 — there's no way to pick a custom subset (e.g., 4 specific stories out of the saved bunch). Add multi-select so David can choose exactly which saved stories to share/export. (Related to B66's multi-select mini-edition PDF.)

## B72. Send to Kindle appears dead (2026-10-12, David found)
Tapping "Send to Kindle" does nothing — no dialog, no feedback, no error. David tapped it multiple times with zero response. Either it's broken or it's failing silently. Needs fixing + visible feedback. (Related to B66's per-story Kindle EPUB redesign.)

## B73. WIRE ticker stories aren't tappable (2026-10-12, David found)
Tapping a story in the WIRE ticker does nothing — the story doesn't open. The ticker headlines should be tappable to open their stories.

## B74. Split cover: small photo + huge text looks unbalanced (2026-10-12, David found)
On the split-style cover, the photo renders small while the headline text is oversized — the proportions look odd and unbalanced. The image and text areas need better balance. Screenshot: workspace/user/files/1791859647715_3_qbs3.jpg

## B75. Cover picker previews don't match the redesigned covers (2026-10-12, David found)
The style previews/thumbnails in the cover picker still show the OLD looks — they weren't updated when the covers were redesigned in 1.80. David: "The styles are different from the new looks." The picker previews must be regenerated to match what each cover actually looks like now.

## B76. Journal cover masthead cut off on tablet (2026-10-12, David found)
The Journal cover looks fine on phone, but on tablet the "CyPress" masthead is cut off mid-word ("CyPr" visible, rest clipped). Covers must be verified at BOTH phone and tablet sizes — this one only works at phone width. Screenshot: workspace/user/files/1791864558498_4_nmjh.jpg

## B77. Cover font choices losing elegance (2026-10-12, David noted)
David: "Font choices for CyPress on a lot of these covers is questionable. It's losing the elegance." The Type style is the 10/10 benchmark — other covers' typography should be reviewed against that standard. Audit all cover styles' font choices (masthead, headlines, kickers) and bring them up to Type's level of elegance. Screenshot example: workspace/user/files/1791864662731_5_v01b.jpg

## B78. Covers must look like top magazines, not PowerPoint defaults (2026-10-12, David noted)
David on the Collage cover: "Looks bad. Like some Microsoft PowerPoint default picture. I need these covers to look like covers from top magazines. Not the default settings that come with PowerPoint 98." Design bar for ALL covers: TIME, NYT Magazine, The Economist, Wired — not clip-art energy. Review every cover style against this bar. Screenshot: workspace/user/files/1791864730425_6_9evx.jpg

## B76. Web's cover-style dropdown is missing the 8 new cover styles (2026-10-12, assistant found)
The web version's backup cover-style dropdown only lists 17 styles — it's missing Type and the 7 other new styles (titleseq, chapters, journal, plays, fact, collage, italic) that shipped in 1.80. The Android picker has all 25, so this is web-only. Not urgent, but the web list should match the real style set. (Related to B75's stale cover previews.)
