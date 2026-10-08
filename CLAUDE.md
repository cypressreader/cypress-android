# Project Operating Rules: Token & Scope Discipline

1. Minimal Scope:
- Patch only the specific lines or files needed to fulfill the request.
- Do not perform multi-theme audits, broad repository scans, or unprompted refactoring.

2. Testing & Auditing Policy:
- Never write new automated test suites, matrix audits, or test scripts on your own.
- Only run existing lightweight checks strictly required to verify the immediate fix works.
- If you genuinely believe an extensive test or cross-feature audit is necessary, do NOT run it. Instead, you must justify it first by clearly explaining:
  a) Exactly what might break if we skip testing.
  b) Why the risk is high enough to justify the token cost.
- Format the request simply: 'I patched the fix, but [explain specific risk in plain English]. Would you like me to run tests for this, or skip it and keep moving?'
- Never run audits or tests without explicit user approval.

3. Release & Workflow:
- Keep push and status debriefs concise.
- Await the 'build' command to ship.

4. Token-Saving Habits:
- Reply briefly; skip recaps of what the user already knows.
- Never read `www/index.html` whole. Grep for the symbol, then read only the lines around it (cut long lines).
- Don't re-read a file already read this session. Don't spawn agents or workflows for routine edits.
- After editing `www/index.html`, copy it to `docs/app/index.html` (they must stay identical).

## Map of `www/index.html` (single file: CSS, then markup, then one inline script; line numbers drift, grep the name)
- App is one file; Android build checks its inline script. Do not split it into modules.
- CSS: reader `.body`, `.tbl`, `.dropcap` near the top third; effects `#fxl`; themes as `:root[data-theme=X]`.
- Feed list and cards: `render()`, `waterline()`.
- Dynamic theme: `dynApply`, `dynSet`.
- Themes: `THEME_NAMES`, `effTheme()`, `twinApply()`, `applyTheme()` (light/dark twins).
- Reader pipeline: `fromPage` and the `getFull*` functions; end symbols use `--sym` and `.endmark`.
- Version: `APP_VERSION`, `APP_LABEL`; also update `whats-new.txt`.
- Other files: `docs/index.html` marketing site, `docs/app/sw.js`, `tests/` (run one test with `node tests/stNN.js`).
