# CyPress — Project Operating Rules

## What this is
CyPress is a privacy-first, magazine-style RSS reader. Free, no accounts, no ads. All user data stays on the user's device. Web app + native Android wrapper (Capacitor, `com.cypress.reader`, sideloaded APK, not on the Play Store). Hosted on GitHub Pages (static). There is no CyPress backend — anything server-side must go through the optional user-deployed Cloudflare Worker relay.

## Repo layout
- `www/index.html` — the app. Single file: CSS, then markup, then one inline script. **This is the source of truth.**
- `docs/app/index.html` — deployed copy. Must stay identical to `www/index.html`. A PostToolUse hook in `.claude/settings.json` copies it automatically after edits — verify with `diff` before pushing.
- `docs/index.html` — marketing site. Privacy page at `docs/privacy.html`.
- `docs/app/sw.js` — service worker.
- `tests/` — run one test with `node tests/stNN.js` (e.g. `node tests/st19.js`).
- `whats-new.txt` — update alongside version bumps.
- Android build checks the inline script: do NOT split `www/index.html` into modules.

## Map of `www/index.html` (line numbers drift — grep the symbol, then read only surrounding lines)
- CSS: reader `.body`, `.tbl`, `.dropcap` near top third; effects `#fxl`; themes as `:root[data-theme=X]`.
- Feed list and cards: `render()`, `waterline()`.
- Dynamic theme: `dynApply`, `dynSet`.
- Themes: `THEME_NAMES`, `effTheme()`, `twinApply()`, `applyTheme()` (light/dark twins).
- Reader pipeline: `fromPage` and the `getFull*` functions; end symbols use `--sym` and `.endmark`.
- Version: `APP_VERSION`, `APP_LABEL`; also update `whats-new.txt`.

## Token & scope discipline
1. **Minimal scope**: patch only the specific lines/files needed. No multi-theme audits, broad repo scans, or unprompted refactoring.
2. **Never read `www/index.html` whole.** Grep for the symbol, then read only the lines around it (cut long lines). Don't re-read a file already read this session. Don't spawn agents or workflows for routine edits.
3. **Testing policy**: never write new automated test suites or test scripts unprompted. Only run existing lightweight checks strictly required to verify the immediate fix. If you believe extensive testing is warranted, do NOT run it — instead ask: "I patched the fix, but [specific risk in plain English]. Run tests, or skip and keep moving?" Never run audits/tests without explicit approval.
4. **Replies and debriefs**: brief. Skip recaps of what the user already knows. Keep push and status debriefs concise.

## Verification honesty (non-negotiable)
- Never report a fix as complete based on the code change alone. If this environment can't verify it (needs a real phone, real TTS voices, real Play Store, etc.), say so explicitly and add a `TESTING.md` entry. A fix you couldn't verify is "implemented, unverified" — never "done".
- When disagreeing with a requested change, bring measurements, not opinions. Test the claim on real data first, then recommend.

## Release workflow
- Work on feature branches and push for review. **Await the `build` command to ship.** Nothing is released without it.
- After each work item: summarize what changed and which files were touched. If anything is unclear, make the reasonable fix and note the assumption — don't stop to ask.
- The `/ship` command runs the standard pre-push flow. The `reviewer` subagent is available on demand for pre-push audits of significant changes — invoke it by name when the diff touches accessibility, privacy, or core flows.

## Communication
- Explain in plain language. The maintainer is technical but prefers plain-English explanations over jargon. Lead with what it means, then the detail.
- When presenting options, give the trade-off in one line each, then a clear recommendation.

## Versioning
- Web build stamp is date-based (e.g. `2026.10.08h`), shown in Settings → About and Help.
- Android uses separate release numbering (e.g. `1.63`).
- Keep the two consistent everywhere both appear (notably "What's New" dialogs). Never invent a third scheme.

## Hard rules — accessibility (do not regress)
- No nested interactive elements (links containing buttons or vice versa).
- Every icon-only button needs a unique accessible name.
- Dialogs: `role="dialog"`, focus trap, focus-in on open, focus return on close.
- Selection state must be exposed (`aria-pressed` / radiogroup); tabs need arrow-key navigation; every control keyboard-operable.

## Hard rules — privacy (do not regress)
- Every third-party network request (fonts, analytics, favicons, proxies, update checks) must be disclosed on the privacy page. Prefer eliminating the request over disclosing it. Never add tracking without explicit approval.

## Hard rules — feeds & content
- The open RSS ecosystem still serves HTTP content. Do not blanket-ban cleartext; keep first-party traffic HTTPS-only and degrade gracefully with publisher HTTP.
- Copy: plain language, no jargon (no "RSS", no "rail"); title-case theme names; watch pluralization ("1 story").

## Hard rules — performance
- Stay fast on low-end devices. Stagger background work, throttle re-renders, respect offline / data-saver / low-power modes.

## Device testing
- Anything touching audio, widgets, sharing, background refresh, or install/update flows needs a real phone to verify. Add such items to `TESTING.md` as must-verify-on-device — never skip silently.
