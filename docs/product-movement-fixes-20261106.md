# Product movement fixes — 6 November 2026

Factual implementation and verification record for the four confirmed findings in `product-movement-audit-20261106.md`.

## Applied database changes

All four migrations were saved under `/migrations/` before execution and applied to staging `utykzifrblpyxlvlknsm`. Production was not changed.

| Saved migration | Result |
| --- | --- |
| `20261106_guard_pos_stock_and_expiry.sql` | Revokes PUBLIC/anon/authenticated execution of the low-level stock writer. The trusted sale transaction retains owner execution. New sales require a non-expired catalog lot inside the locked transaction. |
| `20261106_atomic_sale_customer_posting.sql` | Adds a private sale-keyed customer posting ledger and posts customer spending/earned/redeemed points in the sale transaction. Reads loyalty configuration from the database. Sale replay returns the existing sale without another customer posting. |
| `20261106_atomic_verified_transfer_intake.sql` | Adds a private job-keyed posting ledger and one authorized receipt RPC. Uses recorded arrival and saved verified physical counts, posts destination lot stock and IN movements, accepts WMS/linked transfer state, and records confirmation in one transaction. The transition guard requires this transaction's posting record. |
| `20261106_verify_transfer_intake_identity.sql` | Verifies current transfer product identity against the recorded arrival and uses the posting ledger's primary key in the protected product-update path. |

No past stock balance, loyalty balance, receipt, sale or approval was recalculated. Existing accepted receipts without the new ledger are blocked from reposting rather than credited again. Customer posting rejects cross-country/currency financial history instead of summing it into the legacy single-currency summary. Private posting ledgers have RLS enabled and no client data grants.

## Client changes

- Store receiving calls `transferIntakeService.accept(jobId)`. The server owns physical count, destination, performer, stock and acceptance state.
- Removed the old helper that replaced whole balances and restored historical stock during compensation. There is no client rollback of an accepted receipt.
- A post-save refresh failure leaves the confirmed receipt intact and does not claim that persistence failed. Partial arrivals can enter the existing receiving UI.
- `usePosSync` and the no-queue fallback no longer write customer spending/loyalty separately. Redemption intent travels with the sale; the server validates it and computes earned points from trusted settings and actual persisted sale values.
- Existing translated receipt success/failure copy is reused. No new visible UI labels were introduced.

## Database regressions

All tests below ran against staging inside transactions ending in ROLLBACK. Inventory, sales, customer/configuration fixtures and movement changes did not persist.

- `tests/sql/product_movement_audit_direct_stock.sql`: receiver cannot execute the low-level stock writer; stock remains unchanged.
- `tests/sql/product_movement_audit_expired_sale.sql`: an authenticated cashier with an open shift cannot sell an expired approved lot.
- `tests/sql/product_movement_atomic_intake.sql`: unverified counts rejected; two different shipments each add their full count; repeating acceptance returns the identical confirmation without extra inventory/movements; broken later line rolls back earlier stock and its posting record; old direct completion denied; a foreign-site receiver cannot access accepted receipt confirmation.
- `tests/sql/product_movement_sale_loyalty.sql`: valid sale still deducts stock through the trusted path; sale retry preserves one deduction, one customer posting and one earned/redeemed adjustment; invalid redemption leaves no sale or stock deduction; public stock-helper and anonymous receipt grants are denied.

## Application regressions

`tests/audits/productMovementGaps.test.tsx` now verifies the corrected receiving flow, including a post-commit refresh failure alongside an intervening sale, rejected intake, no direct product/WMS writes, and partial-arrival entry.

`tests/audits/posLoyaltyRetryGap.test.tsx` now verifies that a queue-removal failure followed by sale replay does not issue a second client customer update.

`tests/services/receivingIntake.test.ts` checks the trusted receipt RPC contract, mismatched confirmations, and failure propagation without fallback PATCH requests. Existing procurement, putaway, transfer, sale and sync recovery regressions are included in the focused verification run. 68 focused checks passed across 17 files. `npx tsc --noEmit` passed. The security advisor reported only the expected INFO entries for the two private deny-by-default posting tables; no new access grants were added to clear those informational entries.

## Limits

No browser/physical scanner walkthrough, production deployment, long-running concurrency load test, or historical balance correction was performed. Additional audit observations about procurement-role alignment, automatic replenishment and duplicate-SKU PO reconciliation are separate follow-up items; this change addresses the four confirmed reproduced gaps.
