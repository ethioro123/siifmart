# Buying-to-selling deep audit — 6 November 2026

## Scope and evidence

This second pass reviewed procurement, receipt reconciliation, putaway, assignment, FEFO picking, packing, dispatch/transfer intake, sale posting, supplier invoices/payment runs, customer receivables and returns. It concentrates on handoffs, authority and partial failures. It found nine additional gaps; this audit does not implement their fixes.

Database reproductions used staging project `utykzifrblpyxlvlknsm`, with Adama fixtures, authenticated employee roles and rollback transactions. Privileged setup was used only for synthetic operational fixtures; the actions under test ran as authenticated employees. No lasting stock, sale, invoice or payment changes were made. No migrations were applied by this audit.

Application reproductions exercise the real service/hook with mocked persistence responses. They establish application behavior under the stated responses, rather than proving a normal UI user can bypass every database policy. In particular, the mixed-country payment-run test does not demonstrate an executed cross-border payout.

## Findings

### 1. High — supplier matching and approval can be supplied by the invoice maker

**Stage:** PO/receipt → supplier invoice → payable approval.

An authenticated Adama regional finance manager inserted an invoice already marked `Matched` and `Approved`, with their own ID as both creator and approver, no receiving-record reference and no override reason. Invoice lines supplied fabricated PO and receipt snapshots of 10,000 units against PO AAAA0033, whose actual recorded receipt was 960 units. The database accepted the invoice and lines.

The invoice service derives matching from client-supplied snapshots and writes match/status fields. The inspected invoice triggers and policies do not independently validate these snapshots against trusted PO/receipt records or enforce a different approver. This establishes an approval bypass, not an executed payment.

**Evidence:** `tests/sql/deep_audit_vendor_invoice_authority.sql`; `services/accounts-payable.service.ts:144`; live invoice policies/triggers and PO receipt data.

**Correction needed:** trusted matching against identified PO/receipt lines, protected approval fields and independent approval of variances and invoices.

### 2. High — an overreceipt becomes saleable stock without independent variance approval

**Stage:** dispatch/arrival → blind count → store inventory.

A synthetic transfer arrival manifest recorded 5 units. The destination manager counted 7 and called the normal verified acceptance operation. Acceptance completed the transfer and posted 7 units to destination stock. It returned `hasDiscrepancy=true`, but no separate variance authorization was required.

The recently fixed intake transaction remains atomic and retry-safe. The remaining gap is the authority to post the excess quantity: recording a discrepancy alone does not authorize the additional stock. Only this overage scenario was reproduced; a physical driver co-sign workflow was not exercised.

**Evidence:** `tests/sql/deep_audit_transfer_overreceipt.sql`; deployed `public.record_transfer_receipt_count` and `private.accept_verified_transfer`.

**Correction needed:** preserve blind counting and routine acceptance, while requiring independently recorded resolution before disputed quantities become available stock.

### 3. High — WMS Order Release marks an order delivered instead of creating picking work

**Stage:** pending order → warehouse pick queue.

`WMSSettings` passes the data context's `releaseOrder` handler into `WMSPickControlTab`. That hook writes `fulfillmentStatus: 'Delivered'`; it never calls the service's order-release operation that creates picking work. The tab then announces that the order was released to the pick queue. The hook reproduction confirms the delivered update and absence of the service release call.

This can produce a delivered status without a pick/pack handoff while the pending release flag remains unchanged. No existing live Adama pending order was changed to demonstrate it.

**Evidence:** `tests/audits/deepOrderReleaseGap.test.tsx`; `components/settings/WMSSettings.tsx:434`; `components/settings/components/WMSPickControlTab.tsx:78`; `contexts/hooks/useSaleActions.ts:273`; `services/sales.service.ts:364`.

**Correction needed:** connect this control to a trusted, idempotent release operation and announce success only after the actual pick-queue handoff.

### 4. High — failed PO line saves can leave an empty document or erase its previous lines

**Stage:** purchase draft creation/editing.

Two real-service failure tests reproduce separate partial writes. Creation saves the header before inserting lines; a rejected line insert leaves the header behind. Draft editing deletes existing lines before inserting their replacements; a failed replacement leaves the draft with no lines. Both operations report an error, but their earlier writes have already succeeded.

These are simulated request failures, not destructive tests against the user's PO.

**Evidence:** first two cases in `tests/audits/deepDocumentFailures.test.ts`; `services/purchase-orders.service.ts:124`, `:200`, `:233`.

**Correction needed:** save the header and line replacement in one transaction, preserving existing lines on failure.

### 5. High — payment-run assembly can sum invoices from different countries/currencies

**Stage:** approved supplier invoices → payment run.

The payment-run service selects by invoice IDs without constraining their country/currency, then sums the returned amounts and labels the result with caller-supplied country/currency. A service test returning an ET/ETB invoice for 100 and a KE/KES invoice for 100 produced one ET/ETB run for 200.

The normal UI's country filtering reduces accidental exposure, but is not a trusted integrity check. Inspected payment-run constraints do not establish invoice/run country or currency membership. This application test does not prove that a branch employee can read both countries, nor that money was transferred.

**Evidence:** third case in `tests/audits/deepDocumentFailures.test.ts`; `services/accounts-payable.service.ts:286`–`:328`; inspected payment-run constraints/policies.

**Correction needed:** enforce country, currency, invoice eligibility and membership inside one trusted payment-run operation.

### 6. Medium — payment-run creation reports success after invoice association fails

**Stage:** payment-run header → included invoices.

The service saves the run, then updates the invoices' `payment_run_id` in a separate request without checking its returned error. A rejected association still returns the new run and records `PAYMENT_RUN_CREATED`. Its stated invoice count/total can therefore disagree with its actual linked invoices.

**Evidence:** fourth case in `tests/audits/deepDocumentFailures.test.ts`; `services/accounts-payable.service.ts:325`.

**Correction needed:** create the run and associate validated invoices atomically; propagate failures before reporting completion.

### 7. Medium — assignment can report success without the authorization record needed to work

**Stage:** manager assignment → worker execution.

The assignment hook first updates the job's assignee/status, then writes `job_assignments`. If the second request fails, it logs a warning and still reports success. The hook reproduction confirms that behavior. Deployed pick and putaway authorization functions require a matching assignment-history row, so the displayed assignment can be unusable to its worker.

**Evidence:** `tests/audits/deepAssignmentGap.test.tsx`; `components/fulfillment/useJobActions.ts:85`; deployed `private.authorized_pick` and `private.place_putaway_stock`.

**Correction needed:** atomically persist job assignment and the execution authorization record.

### 8. Medium — repeated SKU lines cannot automatically reconcile despite explicit line identity

**Stage:** completed putaway → PO receipt reconciliation.

A rollback fixture contained two PO lines of the same SKU, matching completed placements, explicit distinct `poItemId` values and stock-movement evidence. `finalize_po_from_putaway` returned `needs_review`. The function first requires exactly one PO line matching the SKU and ignores the supplied line identity when resolving this ambiguity.

The outcome is a blocked reconciliation requiring review, not a silent stock loss. Distinct valid PO lines for the same SKU need a reliable identity-based path.

**Evidence:** `tests/sql/deep_audit_duplicate_sku_po.sql`; deployed `private.finalize_po_from_putaway`.

**Correction needed:** reconcile against the trusted PO-item ID, retaining ambiguity checks for legacy lines without one.

### 9. Medium — customer receivables aging silently excludes invoices beyond page one

**Stage:** credit sale → outstanding debt reporting.

`getAgingReport` calls the paginated invoice list with its default limit of 25 and treats that page as the whole report. A service test with 26 invoices of 100 each reports 2,500 outstanding rather than 2,600. This understates debt once there are more than 25 relevant invoices.

**Evidence:** `tests/audits/deepReceivablesGap.test.ts`; `services/accounts-receivable.service.ts:10`, `:56`.

**Correction needed:** aggregate the complete eligible country-scoped set on the server while retaining bounded pagination for the displayed invoice list.

## Checks that held

The four earlier fixes were rechecked through rollback-only staging regressions: direct stock mutation is denied to a receiver; an expired lot cannot be sold through the atomic sale RPC; transfer intake remains atomic with idempotent retry and site/count gates; stock/customer spending/loyalty posting remains atomic and idempotent.

Inspection also found existing controls in FEFO planning, verified picking, and fulfillment-return submission/decision functions: stock locking/reservation accounting, lot/bin checks, quantity caps, return replay protection and independent return decisions. This is evidence for those inspected paths, not certification of every operation.

## Verification and limits

- Seven persisted SQL regression/reproduction scripts executed against staging and rolled back: four prior-fix checks and three new gap reproductions.
- New application characterization tests cover seven scenarios across four files. A passing characterization test means the documented gap still exists; it is not a claim that the behavior is correct.
- The broader focused suite passed 61 tests across 15 files, covering picking, packing/count controls, return hooks/HQ OTP, supplier matching, forecasting, transfer governance and audit characterizations. `npx tsc --noEmit` and `git diff --check` passed. The existing count/pack test emitted a local-storage environment warning without failing.
- This was source/service/database testing. Browser interaction, physical scanning/driver handover, bank/mobile-money payouts, complete refund settlement, offline reconnection and concurrent multi-device load were not exercised end to end. No claim is made that this list exhausts every workflow gap.

## Recommended repair order

First close invoice approval/matching authority and disputed transfer stock posting. Then repair order release and transactional PO/payment/assignment handoffs. Finally correct repeated-SKU reconciliation and complete-set receivables totals. Routine, matching operations can remain automatic; discrepancies need recorded independent resolution.
