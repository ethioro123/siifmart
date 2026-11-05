# Employee and product workflow repairs — 6 November 2026

The twelve findings in the [employee investigation](employee-and-product-workflow-audit-20261106.md) have been addressed in application code and staging database controls. Production has not been changed by this repair.

## Changes

| Finding | Implemented repair |
| --- | --- |
| Executive appointments | Trusted employee writes enforce the canonical role hierarchy, country/site scope and independent HR activation. Non-CEO hires start pending approval. |
| Floor-role password resets | The deployed reset handler verifies an active administrative actor, scope and superior authority. Self, peer and superior resets are denied. Passwords require 12–128 characters. |
| Payroll status/totals tampering | Direct payroll mutations are revoked. Trusted commands calculate saved roster totals and enforce the payroll state machine. |
| Invented HR/Finance signatures | Signatures use authenticated employee IDs, independent of the maker and each other. Names supplied by clients do not grant authority. |
| Personnel privacy | Operational directory reads mask confidential fields. Base-table projections and personnel audit access are restricted. |
| Self-attested metrics | Employees cannot directly change their own performance/attendance metrics. Profile copy describes a recorded metric without claiming verification. |
| Cross-country schedules | Schedule writes bind employee identity, active status, site and country on the server. |
| Split employee review writes | Profile decisions and application of approved changes are atomic. Server-generated diffs, original values and independent department signatures prevent stale or replayed decisions. Salary review remains compatible with these guards. |
| Premature payroll payment | Preparation creates an approved, unpaid expense transactionally. Recording a completed payment requires an independent authorized actor, reference and evidence. UI success follows the saved response. |
| Wrong-period payroll lookup | Latest-run lookup filters the requested period on the server and returns no unrelated fallback. |
| Unpersisted attendance | A scoped attendance table and trusted idempotent clock commands replace local success and fabricated duration fallbacks. Duration derives from saved server times. |
| Missing regional attestation | The regional HR attestation command is deployed and uses scoped authenticated authority. |

Payroll signatures and preparation verify that the current roster still matches the saved salary snapshot. Finance limits apply to approval. Legacy payroll runs without trusted snapshots and identities must be rejected and recreated through the reviewed workflow.

The payroll download now exports an approved saved **review CSV**. It does not generate bank payment instructions from mutable phone numbers or placeholder recipients. Bank-compatible instructions require verified recipient data that this workflow does not yet provide. Settlement is an evidence-backed human record of a completed payment; there is no automated bank integration or independent bank confirmation.

Attendance persistence is available through the service contract. This change does not add a new clocking screen or derive performance scores from attendance.

## Deployment

All nine migrations below were saved before execution and successfully applied to **staging `utykzifrblpyxlvlknsm`**. None was applied to production in this repair.

- `migrations/20261106_employee_authority_and_privacy.sql`
- `migrations/20261106_trusted_payroll_workflow.sql`
- `migrations/20261106_atomic_employee_reviews.sql`
- `migrations/20261106_verified_employee_attendance.sql`
- `migrations/20261106_salary_review_compatibility.sql`
- `migrations/20261106_employee_workflow_scope_followup.sql`
- `migrations/20261106_employee_review_evidence.sql`
- `migrations/20261106_payroll_financial_limits.sql`
- `migrations/20261106_payroll_review_export.sql`

The staging `admin-reset-password` Edge Function is ACTIVE version 2 with JWT verification. The deployed bundle was retrieved after deployment to verify its handler, policy and shared authority module. No real password reset was sent.

## Verification

- Application regressions: **109 tests passed across 17 files**, covering employee authority, salary reviews, payroll commands/export, selective loading, access/handover, shifts and selected warehouse operations.
- Staging rollback SQL: **10 checks passed**: employee authority/privacy, payroll, reviews/attendance, hiring/salary, roster staleness, retained audit controls, order release, transfer overreceipt, warehouse intake and atomic product intake. Fixtures and business mutations were rolled back.
- TypeScript: `npx tsc --noEmit`; whitespace: `git diff --check`.
- An additional existing sale/loyalty rollback check could not be rerun because the SQL connector confirmation expired on both attempts. It is not counted among the ten passing checks.
- Advisor review still reports pre-existing advisory categories. This repair does not claim to clear the project's entire security backlog. New private implementation tables deliberately deny direct client access.

These checks do not certify browser/device interaction, physical scanning, external payment settlement or multi-device races. No real payroll payment, promotion or credential change was performed. The original vulnerable reproductions are historical evidence in commit `297e91d7`; the current `employee_fixed_*` SQL scripts test the repaired boundaries.
