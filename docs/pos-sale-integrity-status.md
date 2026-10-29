# POS sale integrity implementation — 30 October 2026

Implementation record, not a policy or certification of all POS workflows.

| Saved migration in migrations/ | Staging | Production |
| --- | --- | --- |
| 20261030_pos_sale_integrity_support.sql | Applied | Applied |
| 20261030_pos_sale_integrity_transaction.sql | Applied, superseded by legacy retry guard | Not required; final replacement applied directly below |
| 20261030_pos_sale_legacy_retry_guard.sql | Applied | Applied |
| 20261030_pos_sale_fulfillment_stock_guard.sql | Applied | Applied |
| 20261030_pos_payment_reference_integrity.sql | Applied | Applied |

Staging project: utykzifrblpyxlvlknsm. Production project: zdgzpxvorwinugjufkvb.

- Rejected sale operations remain in the local queue, including permission, validation and duplicate-key errors. Removal requires successful server posting.
- Store sales and stock movements post in one server transaction. Delivery orders retain WMS ownership of stock deduction.
- Sale IDs serialize retries; stock movements prevent repeated deductions. An existing sale without complete posting evidence is blocked for reconciliation, rather than automatically deducting uncertain historical stock.
- The online fallback saves the sale before changing local state and no longer writes product stock directly.
- Mobile channel/reference/phone reach the saved sale and history. References have country/channel uniqueness and immutable metadata controls. This does not constitute payment-provider settlement verification.
- UUID receipt references replace browser-local terminal IDs/counters; a server unique index protects the new receipt format.
- Database rollback tests cover sale/stock posting, repeat submission, metadata persistence and rejected-sale stock rollback. No test sales remain.
- Hook tests retain and retry rejected queue operations; sale/stock and country-isolation regression checks pass.

Historical mismatches were not automatically repaired. Remaining queued legacy sales needing reconciliation require an authorized investigation. Frontend code is local until deployed; database changes are already applied.
