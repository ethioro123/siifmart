# Release 3.6.2 verification — 6 November 2026

The release fixes inconsistent version reporting and prevents a missing desktop installer or an HTML fallback from being downloaded as a binary. Installer availability is checked only when the user requests a download, and failures appear in the download dialog. Existing installer URLs retain their actual published version; no new native installers were built or published.

The initial automated suite reported 16 failures across six files. These fixtures still expected direct employee reads, client-derived authorization, local fallback writes or payroll success without a workplace after earlier trusted-command repairs. Updated tests exercise confirmed server responses and propagate authorization/save failures. Application access controls were preserved. A settings-test teardown also required explicit query-client cleanup to prevent a React callback from running after its browser environment was removed.

The package, login footer, desktop fallback label and generated version metadata now use the package version, 3.6.2. Playwright starts its local web server on the configured port, and a new startup check verifies the displayed version and absence of uncaught browser errors.

Verification:

- Vitest: 463 files, 2,832 tests passed, with no unhandled errors.
- TypeScript: `npx tsc --noEmit` passed.
- Production build: `npm run build` passed; `dist/version.json` reports 3.6.2. Existing chunk-size and Browserslist-data warnings remain nonfatal.
- Playwright: four checks passed (signed-out startup, responsive modal, PACK label and scanner navigation). Two live staging roster sign-in checks were skipped because the opt-in login configuration was absent.
- Source file-size and whitespace checks passed.

This verification covers the automated suite and listed browser checks; it does not claim that every live employee workflow was manually exercised. No database migrations or production database changes were made in this release pass. Earlier workflow migration rollout details remain in their respective verification documents.
