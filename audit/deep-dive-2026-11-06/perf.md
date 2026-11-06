# perf — speed and battery on a low-end Android phone

How I measured: Playwright + Chromium, phone viewport 390x844, CPU slowed 4x (CDP `Emulation.setCPUThrottlingRate`, budget-phone stand-in). Mock sites serve made-up feeds with photos (2 in 3 stories) and article pages with a meta photo tag. The "Android" runs fake `window.Capacitor` so the app fetches sites directly, as the APK does; that avoids the web relay-race artifacts that HANDOFF lists as a dead end. Two sizes: 6 sites x 30 stories, and 30 sites x 100 stories. All the scripts are in `/tmp/claude-0/-home-user/adde917f-1a7e-5251-872b-5dbd81b028cb/scratchpad/perfw/` (h.js is the harness; launchcpu.js, dup2.js, tabs.js, savecost.js, ac.js, idle.js, mem.js, scroll.js, cov.js). A/B runs used patched copies of www/index.html served from the scratchpad (ports 8797-8799), never the repo.

Not re-proposed (HANDOFF section 3 / archive dead ends): fixOrph in rAF, sticky nv, cutOf, endTurn, read-ahead timer storm on the web relays, preloading Inter, close-from-Daily, smaller feed photos, DOM windowing.

---

### P1 · speed · Opening the app with many sites downloads hundreds of whole article pages just to look for photos, keeping the phone busy for about 1.5 minutes
Where: `enrich()` (www/index.html ~L6143, `.filter(a=>!a.img).slice(0,20)`) → `og()` (~L6104)
What a user sees/feels: For about 1.5 minutes after opening, the phone runs warm, the battery drains, and taps can feel sticky. With 30 sites, the app downloads and reads 600 full article pages only to find photos for stories that have none. Most of those stories never reach the screen.
Recommend: Look up photos for at most the 5 newest photo-less stories per site, not 20. Better still, look up only the stories the Daily or the first page of All Stories will show. A card without a photo already has a designed fallback, so the rest can stay photo-less. This is a one-number change.
Evidence (30 sites x 100 stories, 4x, Android mode; `launchcpu.js` and `dup2.js`):
- Today: 814 article downloads in the first 100 s, and 600 of them (74%) are photo lookups. The main thread is busy 8.6, 5.9, 4.7, 4.3, 3.4, 3.5, 3.3, 3.2, 1.7, 1.3 s in each 10 s window, about **40 s of phone work in the first 100 s**. After that it still sits at 3% CPU while idle (0.32 s per 10 s).
- With the cap at 5 (plus P2): **312 downloads, about 18 s of phone work**, and the main thread is quiet after about 80 s. Idle CPU drops to 0.01 s per 10 s.
- The first 10 s look the same (8.6 s both ways), so launch speed is unchanged. The gain is the next 90 s of battery and data.
Confidence: high (the trade-off is fewer filled-in photos for no-photo sites, so check on the phone with a photo-less site such as Hacker News)

### P2 · bug · Read-ahead downloads stories again even though they are already saved on the phone
Where: `pump()` ~L9760-9764 (`const a=PF.q.shift();PF.run++;getFull(a.link,true)`), queued by `prefetch()` ~L9551
What a user sees/feels: Wasted data and battery. `prefetch()` checks "already saved?" only when it queues a story. By the time `pump()` takes the story off the queue, the photo lookup or the Daily preload has often saved it already, and pump downloads it a second time.
Recommend: Check again when the story is taken off the queue: `const a=PF.q.shift();if(acHas(a.link))continue;PF.run++;`
Evidence: getFull calls from pump for stories already saved (`acHas` was true at call time): **28 of 77** (6x30 run) and **39 of 173** (30x100 run). The page itself was downloaded twice for 25-88 links per launch. The fix is in the A/B copy behind P1's numbers.
Confidence: high

### P3 · speed · Every warm start redraws the whole Daily a second time about 0.5 s after it first appears, and the "Inside" box visibly changes
Where: boot tail ~L16925 `acReady.then(()=>render());`
What a user sees/feels: Stories appear, then about half a second later the page freezes for roughly 0.4-0.5 s while it is rebuilt. The first tap usually lands right then. The "Inside" box also changes its wording in front of you, from "180 unread in all your feeds / Your 30 best stories…" to "30 stories in this edition / Catch me up / Surprise me / More".
Recommend: Draw the Daily once, correctly. Either draw the cache-dependent "Inside" block as a placeholder of fixed size and fill in only that block when `acReady` resolves, or skip the full `render()` when the open view shows nothing that depends on saved articles. Smallest version: replace the full `render()` with a refresh of just that section.
Evidence (`ac.js`, warm start, 4x): the re-render starts at **1.73-1.94 s** and takes **390-520 ms**. The text inside `#grid` changes, and the exact before/after strings are in the run output. In the plain cold trace the same work shows as a 552 ms task at 2.0 s.
Confidence: high

### P4 · speed · Every tab tap first rewrites your whole library to storage, so taps get slower as the library grows
Where: tab handlers ~L16144 (`S.sel=k;save();render()`) and ~L13463 (`save();…render()`); `save()` ~L5261 → `SAVE0` ~L5240 (`JSON.stringify(S)` plus `localStorage.setItem`, synchronous)
What a user sees/feels: With a well-used library (saved stories with text, thousands of read marks), each tab tap waits an extra 50-70 ms before anything moves. Launch also rewrites the library about 20 times in the first 30 s.
Recommend: In the two tab handlers use the existing `saveSoon()` (1.2 s debounce, already flushed on hide and pagehide) instead of `save()`. Remembering which tab is open does not need an instant write. Optional: make `save()` itself go through `saveSoon()` unless called with a "now" flag.
Evidence (`savecost.js`, 4x): library with 100 saved stories, 3,000 read marks and 500 positions = **1.55 MB; one save() = 46-74 ms**. Tab tap response (Event Timing) with that library: **240-344 ms**, against 176-304 ms with a small library. Storage writes in the first 30 s of a 6-site launch: **20 full `folio` writes** (233 KB total even for a tiny library).
Confidence: high

### P5 · speed · Switching tabs takes 0.2-0.3 s on a budget phone, and part of it measures the side bar, which is hidden on phones
Where: `side()` wrapper → `fitSide()` ~L17954-17962 (`ov()` reads `scrollWidth`/`clientWidth` on every `#side-list .fr`), called on every `render0`; then `feedHead()` ~L6554 forces layout again
What a user sees/feels: Tapping The Daily, All, Headlines or Brief takes a noticeable moment, rated "needs improvement" by Google's tap-responsiveness measure.
Recommend: On narrow screens with the drawer closed, skip `fitSide()` in the `side()` wrapper and run it when the drawer opens. The ResizeObserver and fonts.ready calls stay as they are. That removes one of the two forced layouts per tab switch.
Evidence (`tabs.js`, `tabtrace.js`, `tabprof.js`, 4x): tap response **200-304 ms** (6 sites) and **152-376 ms** (30 sites; Brief is worst at 340-376 ms). About 65% is the browser's own restyle, layout and paint of about 2,000 new elements, which is close to the CSS-size floor HANDOFF already notes. Of the forced work: `fitSide` restyle+layout **15-36 ms** per switch, then `feedHead` layout **36-56 ms** on top. An empty Saved tab still costs 64-80 ms of `render()`.
Confidence: high for the measurements, medium for the gain (about 10% of a tab switch)

### P6 · battery · While you look at the Daily, the background preload redraws the whole page every few seconds
Where: `dpRun()` worker ~L8486 (`…&&(got%4===0||!DPRE.q.length))render();`)
What a user sees/feels: For the first half-minute or so after opening, the Daily rebuilds itself every 3-4 s. Each rebuild is a 0.1-0.25 s freeze, so a tap or a pull that lands during one feels late. It also costs battery.
Recommend: Redraw once when the preload queue empties, and at most every 15-20 s while it runs. Better: update only the reading-time labels that changed instead of calling `render()`.
Evidence (`rcount.js`, `rdiff.js`): **7 full redraws in 25 s** from `worker<dpRun`, taking **111-255 ms each** at 4x (6-site run). Each one did change the visible text (reading times), so they are not empty, just too frequent.
Confidence: high

### P7 · speed · Launch numbers (the baseline the fixes above improve)
Where: whole boot; the main inline script runs as one block
What a user sees/feels: On a budget phone the first picture appears after about 1.3 s and stories after about 2 s. With 30 sites on a first run, stories take 3.7 s.
Recommend: Nothing new for the first paint itself; HANDOFF already calls it near its floor. **Measured and rejected: minifying the file.** A comment-stripped, minified copy (2.53 → 2.19 MB) gave first paint 1.18-1.27 s against 1.18-1.45 s and stories 1.78-2.10 s against 1.64-2.17 s, inside the noise. Do not spend a session on a build-time minifier.
Evidence (`boot.js`, `ab.js`, 4x): warm start: page ready 1.15-1.42 s, first paint 1.18-1.45 s, first story 1.64-2.17 s, main script block 640-760 ms. Cold first run, 6 sites: first paint 1.41 s, first story 1.98 s. Cold first run, 30 sites: first story 3.74 s. File makeup: 2.53 MB = CSS 834 KB (of which 232 KB is the two base64 tree-mark SVGs on one line, ~L708) + JS 1.61 MB (187 KB of it is comments) + markup 86 KB. Coverage over a broad session (all tabs, a story, 4 themes, menu) used **43% of CSS bytes** and ran about 45% of JS bytes.
Confidence: high

### P8 · polish · Two timers wake the phone 3.5 times a second forever, even with nothing happening
Where: `setInterval(…,400)` ~L5323 (scroll-anchor keeper `PKA`) and `setInterval(…,1000)` ~L10126 (`tminiSync` check)
What a user sees/feels: Nothing visible. These wake-ups add a little to standby battery while the app is open on screen.
Recommend: Start the 400 ms timer only while `PKA` is set and clear it when `PKA` is cleared. Start the 1 s timer only while audio or the mini player is active.
Evidence (`idle.js`, 30 s of idle after settling): 114 timer wake-ups (75 from the 400 ms timer, 30 from the 1 s timer). Their CPU cost is tiny (0.05 s per 30 s), so this is a small battery item, not a speed item.
Confidence: high

### P9 · polish · A large font file is loaded at launch that nothing on the first screen uses
Where: `:root{--serif:'Newsreader',…}` ~L26, before the theme overrides it
What a user sees/feels: Nothing visible. It is about 130 KB of extra reading from storage during launch.
Recommend: Leave it unless launch work is being trimmed anyway. If so, give `--serif` the default theme's font, so the first style pass does not ask for Newsreader.
Evidence (`res.js`): 7 font files (330 KB) are requested in the first 4 s, including Newsreader-normal-400-latin (132 KB). After launch, no visible text uses Newsreader (`fontuse.js`). All bundled fonts use `font-display:swap`, so there is no invisible-text wait.
Confidence: medium

### P10 · polish (web only) · The web app downloads the whole 2.5 MB app again on every open to check for updates
Where: docs/app/sw.js fetch handler (`net=fetch(r)…` then compares old and new text)
What a user sees/feels: About 840 KB of compressed data per web launch, plus a 2.5 MB text comparison in the background. The Android app is not affected.
Recommend: Low priority, because the web app is family-only and kept for tests. If it matters: send `If-None-Match`/`cache:'no-cache'` so the server answers 304 when nothing changed, and compare ETags instead of whole texts.
Evidence: code read; not measured on a device.
Confidence: medium

---

### Healthy (measured, no action)
- **Memory:** opening and closing 20 stories took the heap from 5.9 to 8.2 MB after garbage collection, with DOM nodes flat (6,883 → 6,885) and listeners 513 → 565. No leak.
- **Scrolling All Stories (30 sites, 4x):** median frame 17 ms, 95th percentile 17 ms, 2-5 frames over 50 ms in 15 s of wheel scrolling. All Stories draws in pages of 20-35 cards, so there is never a 500-card DOM; the HANDOFF windowing dead end stands.
- **Images on the Daily:** 20 images in the page, 16 `loading=lazy`, 19 `decoding=async`; 6 requested in the first 4 s, 28 after a 10 s scroll.
- **Storage while scrolling:** 2 localStorage writes in 10 s of scrolling (the article-cache save already waits for a still finger).
- **Story open (pre-read story, 4x):** tap to text 460-630 ms (first open 990 ms).
