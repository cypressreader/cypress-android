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
