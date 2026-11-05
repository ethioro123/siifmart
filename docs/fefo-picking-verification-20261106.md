# FEFO picking verification — 6 November 2026

This is an implementation and deployment record.

## Delivered behavior

- Every new active PICK allocates physical product rows at the source site and country. Available dated lots are selected by earliest unexpired date; a request spans multiple lots when necessary. Expired, inactive, damaged, quarantined, non-storage and locked-zone stock is excluded.
- Undated stock remains eligible after dated lots. Its FIFO age uses the recorded receiving day, falling back to creation day. The scanner displays missing dates as “Not recorded”; it never pre-fills the worker's physical lot evidence.
- Bin, batch and expiry are shown in the scanner. Positive picks require an explicit physical-lot confirmation and matching batch/date evidence on the trusted server, alongside the existing bin and SKU scans. The old positive-pick RPC cannot bypass this gate.
- Completion rechecks the exact source row, bin, batch, expiry and availability immediately before deduction. Expiry boundaries use the source country's timezone. Stock deduction, PACK creation, assignment updates and completion receipts remain atomic and retry-safe.
- Lots in shared bins retain independent row identities, stock balances, batches, expiries and receiving dates. FEFO reads these rows without combining their stock into one batch.
- Active ordinary picks hold their allocated units against other stock writers and jobs. Online reservations follow the selected FEFO rows and are released during successful deduction. The allocator uses deterministic product locks.
- Before opening the scanner, the assigned worker prepares a fresh server manifest. Untouched legacy jobs are safely replanned; the client receives the authoritative line order and indices. Legacy jobs with existing physical scan evidence require supervisor reconciliation rather than a rewritten physical history.
- Production's missing verified-picking, independent-floor and receiving-audit foundations were restored. New receipt evidence now supplies receiving days to same-day putaway matching.

## Migrations

Staging: `utykzifrblpyxlvlknsm`. Production: `zdgzpxvorwinugjufkvb`.

| Saved migration | Staging | Production |
|---|---|---|
| [20261105_verified_picking_foundation.sql](../migrations/20261105_verified_picking_foundation.sql) | Existing foundation retained | Applied |
| [20261105_fefo_pick_allocation.sql](../migrations/20261105_fefo_pick_allocation.sql) | Applied | Applied |
| [20261106_fefo_reservation_integrity.sql](../migrations/20261106_fefo_reservation_integrity.sql) | Applied | Applied |
| [20261106_verified_fefo_pick_execution.sql](../migrations/20261106_verified_fefo_pick_execution.sql) | Applied | Applied |
| [20261106_receiving_audit_foundation.sql](../migrations/20261106_receiving_audit_foundation.sql) | Applied, existing functions retained | Applied |
| [20261106_picking_floor_control_foundation.sql](../migrations/20261106_picking_floor_control_foundation.sql) | Applied, existing functions retained | Applied |
| [20261106_fefo_expiry_and_completion_integrity.sql](../migrations/20261106_fefo_expiry_and_completion_integrity.sql) | Applied | Applied |
| [20261106_prepare_existing_fefo_picks.sql](../migrations/20261106_prepare_existing_fefo_picks.sql) | Applied | Applied |
| [20261106_trusted_fefo_manifest_updates.sql](../migrations/20261106_trusted_fefo_manifest_updates.sql) | Applied | Applied |
| [20261106_fefo_fifo_and_receipt_indexes.sql](../migrations/20261106_fefo_fifo_and_receipt_indexes.sql) | Applied | Applied |

The follow-up migrations preserve execution history, including corrections and compatibility with the existing immutable-manifest guards.

## Observed checks

- `npx tsc --noEmit`: passed.
- `npx vitest run`: 429 files, **2,747 tests passed**.
- `npm run lint:size`: passed, all checked files within 500 lines.
- `git diff --check`: passed.
- [Rollback-only SQL regression](../tests/sql/fefo_picking.sql) passed on **both environments** using actual RLS, authorization functions, triggers and completion transactions. Production used disposable stock with its existing CEO identity because its warehouses had no eligible stock/picker fixture. All inserted business fixtures rolled back.
- SQL coverage includes earliest-lot splitting, stock holds, no allocation from expired/fully held lots, undated FIFO with creation-date fallback, physical batch/date mismatch rejection, old-RPC bypass rejection, exact shared-bin deductions, expiry-change rejection without stock loss, idempotent completion, online reservation reallocation/release, untouched legacy-manifest preparation, and receiving-day evidence from a new receipt.
- UI/service checks cover empty physical-entry fields, confirmation reset after edits, required positive-pick proof, preparation through the assigned-worker RPC, and synchronized English, Amharic and Afaan Oromoo copy.
- Supabase advisors were reviewed. Missing receipt foreign-key indexes were added. Private evidence tables deliberately retain revoked client grants and default-deny RLS; their [no-policy informational notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) reflects this closed access model. This work does not certify unrelated project advisories.
- An interactive handset/scanner/printer walkthrough was not performed in this pass.
