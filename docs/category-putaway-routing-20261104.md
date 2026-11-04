# Category-directed Smart Putaway — 4 November 2026

Configure Zone now has accepted catalog categories and per-aisle category assignments. Aisles select only categories accepted by the parent zone. Removing a zone category removes its corresponding aisle assignments in the unsaved form; saving persists both together. Database constraints validate aisle keys 01–99 and parent/child membership.

The catalog stores controlled category strings rather than category IDs. Matching uses the product's saved category; free-text specialization descriptions remain display metadata. Explicit category aisles, then assigned zones, rank before inferred locations and legacy defaults. Assigned aisles/zones reject other categories; unassigned aisles use their parent zone rules.

Routing preserves facility scope, SKU/batch/expiry separation, lock, putaway permission, quarantine, storage class, occupancy/capacity and worker-reported full-bin checks. Numeric temperatures such as 4°C and -18°C are recognized. Physical bin scanning is still required. Suggestions neither post stock nor establish physical bin capacity. No suitable suggestion continues to request warehouse-lead guidance.

Zones without accepted categories retain existing storage and legacy default routing behavior. No category assignments were guessed from names. Labels, location codes, stock and specialization descriptions remain unchanged. Category assignments guide advisory routing; final stock posting retains its existing server controls.

## Deployment and verification

Saved migration: migrations/20261104_category_putaway_assignments.sql.

- Applied to staging: utykzifrblpyxlvlknsm.
- Applied to production: zdgzpxvorwinugjufkvb.
- Existing warehouse-zone RLS remains; no broader access policies were introduced. Private immutable validator has explicit execute grants.
- Ten read-only validator/constraint assertions in tests/sql/category_putaway_assignments.sql passed in both environments.
- 41 targeted Vitest checks passed across ranking, snapshots, configuration and persistence/error handling.
- TypeScript, file-size and diff-whitespace checks passed.
- Unrelated concurrent print-preview changes were preserved.
