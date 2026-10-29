# Counter Control delivery — 30 October 2026

Core controls now use trusted database operations: authenticated opening, stable counter ownership, sale-to-shift attribution, immutable blind counts, independent supervisor review, separate Finance reconciliation, pending cash-drop requests, confirmed custody and bank-manifest audit events. Both POS closing screens use the same translated blind form (English, Amharic, Oromo). No browser verification was used.

## Database application

All files below were saved before execution and applied successfully to staging project `utykzifrblpyxlvlknsm`. Production was not changed.

| Saved migration under `/migrations/` | Status |
|---|---|
| `20261030_trusted_counter_control.sql` | Applied |
| `20261030_counter_opening_defaults.sql` | Applied; final role and opening-default guards applied |
| `20261030_counter_control_guards.sql` | Applied |
| `20261030_counter_drop_custody.sql` | Applied |
| `20261030_pending_cash_drop_constraints.sql` | Applied |
| `20261030_pending_cash_drop_statuses.sql` | Applied |
| `20261030_confirmed_drop_bank_custody.sql` | Applied |
| `20261030_counter_actor_boundary.sql` | Applied |

## Verification

- 26 focused service, UI and responsibility tests passed.
- TypeScript and file-size checks passed.
- Live staging regression `tests/sql/trusted_counter_control.sql` passed: 30 attributed cash sales, supervisor-confirmed drop, bank transfer, correct drawer total, immutable retry, direct-update denial, duplicate opening denial, negative-count denial, independent review and Finance role separation. All test writes rolled back.
- The final full-suite run passed 2,453 tests and failed 16 tests in concurrently changing POS sync, payroll, leave, inventory-query and stock-notification areas. Counter-specific tests passed.

## Limits

Historical shifts without complete sale attribution and refunded receipts without a cash-refund ledger are flagged and cannot be automatically reconciled as balanced. They need an audited reconciliation workflow with documentary evidence. Existing duplicate open shifts were preserved by the preceding assignment migration.

The temporary automatic approval-review usage limit cleared; all listed migrations were applied. No deployment to production or Git push was performed.
