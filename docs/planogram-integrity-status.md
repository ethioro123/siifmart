# Planogram integrity status — 28 October 2026

The screen manages store-level shelf positions. Zone/aisle/bay identifiers and physical capacity were removed from the UI because the current data model does not record them. Product dimensions, facings, physical fixture assignments, implementation tasks and compliance evidence remain future functionality.

## Implemented corrections

- Store selection filters strictly by retail store and country. An empty store never falls back to another store's products.
- All seven placement groups remain available. Unassigned products stay in their own tray.
- Sales candidates require recorded history; safety, capacity and category suitability are explicitly subject to in-store assessment. No automatic safety claim is made from product names.
- Suggested moves start unselected, require a physical suitability acknowledgement, and reset on reopening. Native dialogs support keyboard focus and Escape; list tables scroll on narrow screens.
- Submission locks cover swaps, single moves, suggestions and store controls. Pending-load failures block submission and offer retry. Cache keys include the employee identity.
- Reviewers see the complete revision before recording a departmental vote.
- Database submission verifies active employee, role, authorized store and country, unique products, changed positions and overlapping pending proposals.
- Grouped approvals validate each member's baseline, scope, requester separation, current approver eligibility and values. A failure rolls back the entire decision. Rejections and approvals lock the same revision.

## Database deployment

- `migrations/20261028_planogram_integrity.sql`: applied to SIIFMART Staging (`utykzifrblpyxlvlknsm`). Production application is pending.
- `migrations/20261028_restore_product_edit_foundation.sql`: saved but not applied. Production lacks `private.product_edit_votes`, the baseline/approval columns and the helper functions its existing product approval RPC references. Staging already has these prerequisites.
- Automatic approval review rejected the production foundation restore because it changes shared product-edit tables, RLS policies, triggers and security functions. Explicit approval is needed before applying that restore and then the integrity migration to production (`zdgzpxvorwinugjufkvb`).

## Verification

- Focused planogram tests cover empty-store isolation, archived products, site aliases, missing sales evidence, pending proposals and the absence of unsupported safety claims.
- Dialog tests cover explicit selection, physical suitability acknowledgement, confirmation payload and reopening/reset behavior.
- `tests/sql/planogram_integrity.sql` passed on staging inside a transaction that is rolled back. It verifies country rejection, duplicate prevention, no application before all three votes, complete two-product application, stale baseline rejection and rollback of partial application.
- TypeScript, application build and file-size checks passed during this work. Existing test import logging and build bundle-size/browser-data warnings remain unrelated.
- Staging security advisors still return existing project-wide findings; this change does not claim to resolve those unrelated findings.
