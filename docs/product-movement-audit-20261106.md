# Product movement audit — 6 November 2026

Audit findings, not operational policy. No application behavior was changed by this audit.

## Scope and method

Reviewed procurement approval → receiving → putaway → warehouse/store transfer → store intake → POS sale and synchronization. Read current staging function definitions, policies and triggers alongside application code. Ran 57 existing focused checks, three new failure-characterization checks and two rollback-only authenticated database reproductions. These results do not certify every screen, role, driver action, refund or concurrent database transaction.

Environment: staging `utykzifrblpyxlvlknsm`. Origin: Ethiopia, Adama Industrial Warehouse `c1111111-1111-4000-8000-000000000110`. Sale reproduction used an existing open cashier shift at Adama Central Supermarket. No stock, sale, approval, pricing or financial change from the database reproductions survived rollback. No schema migration was needed or applied for this audit.

## Confirmed gaps

### 1. High — stock can be decremented without a sale or adjustment approval

The public `pos_decrement_stock` RPC accepts an authenticated employee who has product-site access. It does not require a saved sale, an approved adjustment, a cashier role or an authenticated performer matching the supplied audit text. A warehouse receiver successfully decremented the existing ETDI001 product by one unit without creating a sale or approval request. The test rolled back the change.

Evidence: `tests/sql/product_movement_audit_direct_stock.sql`; deployed `public.pos_decrement_stock`; persistent definition in `migrations/20261029_pos_offline_sync_idempotency.sql:86`.

Impact: ordinary site access can be used to bypass stock-edit dual control. A legitimate OUT movement can exist without an authorized business event, with caller-supplied attribution/reason.

Fix direction: restrict direct execution and make stock deduction an internal consequence of an authenticated, persisted sale or separately approved inventory operation. Preserve the existing sale idempotency contract.

### 2. High — an expired lot can be sold through the server sale boundary

The atomic sale rebuilds price and approval state from the database, but its product lookup has no expiry-date condition. The stock-finalization helper also has no expiry-date check. The normal product status constraint has no `expired` status, so an active approved lot remains eligible after its expiry date passes.

Reproduction: within a transaction, set the expiry of approved cooking oil at Adama Central Supermarket to yesterday, use its authenticated cashier with an existing open shift, then call `create_pos_sale_atomic`. The server accepted the sale as Completed. Setup, sale, financial rows and stock deduction were rolled back.

Evidence: `tests/sql/product_movement_audit_expired_sale.sql`; deployed `public.create_pos_sale_atomic` and `private.finalize_pos_sale_stock`; catalog lookup in `migrations/20261030_pos_sale_integrity_transaction.sql:101`.

Impact: frontend filtering or expiry labels cannot guarantee expired stock is blocked at sale or offline synchronization.

Fix direction: enforce expiry eligibility inside the locked server transaction and test both online sales and queued-sale synchronization against the defined sale-date policy.

### 3. High — store receiving uses non-atomic balance replacement and unsafe compensation

`processReceivingStockIntake` reads the destination balance and writes `old + received` through a separate product PATCH. `usePOSReceiving` then completes WMS and transfer records through additional requests. Its catch block restores the old balance for any later failure, including refresh failures after completion has already saved.

Two failures were reproduced against the real intake helpers with mocked persistence:

- Start at 10; receive 5; sell 1; fail the later receipt step; rollback restores 10. Correct compensation would leave 9. The intervening sale has effectively been erased from the balance.
- Two clients use the same starting balance of 10 and each receive 5. Both report successful intake but the final balance is 15 rather than 20. This is a stale-read interleaving characterization, not a parallel live database load test.

Evidence: `tests/audits/productMovementGaps.test.ts`; `components/pos-command/hooks/utils/receivingIntake.ts:41` and `:114`; `components/pos-command/hooks/usePOSReceiving.ts:343` and `:440`.

Impact: missing/extra stock under simultaneous receiving, sales, connectivity failures or post-save refresh failures. These errors can be absent from a successful single-user test.

Fix direction: accept the verified shipment, post inventory increments and movements, and update receiving state in one trusted idempotent transaction. Avoid restoring a historical whole balance as compensation.

### 4. Medium — POS sync retry can award loyalty and spending twice

The server sale uses a stable sale ID, but customer loyalty and total-spent updates occur in later calls. Queue removal happens after those updates. If removal fails, the operation remains queued; retry gets the same sale, then applies loyalty and spending again.

Reproduction against the actual `usePosSync` hook: one 1,000-unit sale earns 10 points. Simulate failure removing the queue entry after customer update, then retry. Points become 20 and total spent becomes 2,000 although server sale creation returns the same sale ID.

Evidence: `tests/audits/posLoyaltyRetryGap.test.tsx`; `hooks/usePosSync.ts:127` and `:149`.

Impact: duplicate rewards, incorrect customer spending, and potentially repeated redemptions after device/database failures.

Fix direction: persist sale-linked customer ledger events with uniqueness on sale ID/event kind, or include customer posting in the atomic sale transaction.

## Adama record reconciliation

Read-only findings for PO AAAA0033 / SKU ETDI001:

- Ordered: 20 packs × 48 = 960 units.
- Recorded received: 960 units.
- Completed putaway: 240 + 720 = 960 units.
- Current stocked lots: 240 in A-01-01 and 720 in A-01-02.
- Net stock movements for those two products: 240 and 720, matching their stock.
- Both stocked lots have selling price 0 and approval status pending. This is an observed merchandising hold, not evidence of a receipt failure; the normal sale RPC rejects pending approval.
- The completed RECEIVE row still has `completed_by = NULL` and its legacy line payload has receivedQty 0 / expectedQty 20. Saved PO counts and putaway reconcile, but this row alone is not a reliable source of receipt quantity or accountable completion identity. Do not invent a historical identity to fill it.

No completed ETDI001 sale or warehouse-to-store transfer was demonstrated by the inspected Adama records. Receipt/putaway success does not establish that this SKU has reached sale.

## Additional code findings requiring targeted follow-up

These were identified in code, not reproduced as live business failures during this audit:

- Procurement client/server approval disagreement: the server permits `country_operations_director` in the country tier; the client tier whitelist omits it (`services/purchase-orders.approval.ts:108`). The client also hardcodes the country limit while the server reads country governance configuration.
- Automatic replenishment is attached to the generic client product-update helper (`services/products/products-mutations.ts:368`), whereas POS stock deduction occurs in the server sale RPC. No product trigger or sale-function call to the auto-replenishment helper was present in the inspected deployed path. A sale-driven low-stock replenishment scenario needs explicit end-to-end verification.
- Putaway-to-PO reconciliation matches PO lines by SKU and requires exactly one match, despite receipt lines carrying `poItemId`. A PO with the same SKU on two lines can reach needs_review instead of reconciling automatically. See deployed `private.finalize_po_from_putaway`.

## Verification result and limits

- 57 existing focused regression checks passed across procurement, receiving, putaway, transfer and POS stock behavior.
- Three new characterization tests reproduced the store-receipt balance failures and duplicate loyalty retry. Their passing status means the unsafe current behavior was reproduced, not fixed.
- Two authenticated staging SQL reproductions succeeded; all test transactions rolled back.
- TypeScript checked with `npx tsc --noEmit`.
- No browser walkthrough, physical barcode/label test, driver co-sign test, performance load test or full refund settlement test was performed. These remain outside the evidence above.
