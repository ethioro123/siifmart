# Application failure audit — 5 November 2026

## Findings and corrections

The initial automated run had one failing test and one unhandled exception. The quick-login host test still rejected private Wi-Fi staging hosts after paired mobile access was introduced. Its expectations now cover development staging availability while retaining production/public-host rejection. The scanner-focus exception was emitted from an earlier DriverScanner version during concurrent mobile-scanner edits; its current guarded scroll handler passed the focused driver tests and the complete suite. Those concurrent edits were preserved.

A separate authentication-cache review found that getCurrentAuthUser could return an old cached employee after an online database lookup failed, restore an offline profile without any current session, accept a mismatched offline identity after a failed lookup, or accept a database employee with a different auth ID. Six focused regression tests reproduced four failures before the implementation change.

The service now requires a current session identity; offline cache reuse requires matching auth and employee identities. Online lookups must return an active employee with the matching auth ID. Failures return no profile instead of reviving a previous employee. Existing matching-session offline access remains covered. New warnings use the project logger without logging employee emails or profile contents.

Read-only staging and production checks confirmed zero active employee/auth-user ID mismatches for matching email addresses. No database records, schema, grants or policies were changed.

## Final verification

- Full Vitest run: 413 files, 2,662 tests passed; no unhandled errors reported.
- TypeScript: npx tsc --noEmit passed.
- Production build: npm run build passed, including generated PWA assets.
- File-size and whitespace checks passed.
- Existing non-blocking build warnings remain for large chunks and older Browserslist data; no dependency upgrades or speculative performance changes were made.
- This is automated and source-level verification, not a claim that every live user workflow was exercised in an authenticated browser.
