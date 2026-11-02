# Audit harness (shared by all reviewers)
Target: PRODUCTION build on main, CyPress 1.231 (web stamp 2026.11.02f). Live production web build: https://cypressreader.com/<family-path>/ (family-only; the URL `https://cypressreader.com/<family-path>/?invite=<family-password>` signs a fresh browser in and redirects to the app). A new browser context = a brand-new user with cleared data.
Offline sample content (no network, made-up stories): serve this worktree's docs/ folder and open /demo.html.

```js
// node script; Playwright is preinstalled (require('playwright')), Chromium launches with no extra install.
const {chromium}=require('playwright');
const b=await chromium.launch({proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
const PHONE={viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,ignoreHTTPSErrors:true};
const FOLD ={viewport:{width:884,height:1000},deviceScaleFactor:2,isMobile:true,hasTouch:true,ignoreHTTPSErrors:true}; // approximates Fold inner screen; real Fold = owner's phone
const ctx=await b.newContext({...PHONE,colorScheme:'light'}); // 'dark' for night
const p=await ctx.newPage(); await p.goto('https://cypressreader.com/<family-path>/?invite=<family-password>'); await p.waitForTimeout(12000);
// app globals are reachable in p.evaluate: S (settings), items, render(), openReader(a), $()
```
Rules
- NEVER press Send in "Report a problem" and never turn on "Share anonymous usage counts" (both write to the owner's live server). Don't share stories.
- The production feed fetcher allows ~120 requests/min per IP and 5 reviewers share one IP: reuse pages, don't reload in tight loops. If you hit "Too many requests", wait a minute.
- Never read www/index.html whole (2 MB). `grep -n` the symbol, then read about 100 lines around it (`sed -n 'A,Bp' | cut -c1-400`). docs/app/index.html is the same file; don't read it.
- No git commands. Don't edit anything outside audit/. Write screenshots to audit/shots/<your-section>/ as PNG, named <ID>-<phone|fold>-<day|night>.png.
- Native-only behavior (Android permissions, widgets, notifications, lock-screen audio, install/update, back button in the Android shell) can't run here: there is no emulator. Read the native code (native/, scripts/prepare_android.py) to describe it and mark the finding NEEDS-PHONE.
- Each finding in your section file:
  ### <ID> <short title>
  - Status: NEW or KNOWN-RECHECK (still present / fixed / changed) · Severity: Store-blocker | Must-fix | Should-fix | Nice-to-have · Verified: CONFIRMED (seen running) | CODE (from code only) | NEEDS-PHONE
  - Where: screen + code location (file:line)
  - Now: what happens
  - Should: what should happen
  - Shots: relative paths
