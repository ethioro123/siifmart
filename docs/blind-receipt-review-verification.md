# Blind receipt review verification — 4 November 2026

Implemented for new PO receipts saved through `save_receiving_split`. Existing receipts are not backfilled with invented original counts. Transfer receiving and driver co-sign flows are unchanged.

## Worker and manager flow

- Routine good receipts proceed to putaway automatically, including good partial deliveries. No manager acknowledgment is required for every product.
- The Receiving tab offers **Receiving review** to managers and **My submitted counts** to workers. Queries run only when opened, use 25-row cursor pages, and fetch lot details for one selected receipt.
- Manager view defaults to exceptions; workers default to their submitted counts. The exception filter can be cleared to inspect ordinary receipts.
- Original count, original lot/condition/expiry evidence, counter, and submission time are immutable. Independent managers see ordered units and the count comparison at submission; the original counter's review API response excludes ordered quantities, even when that counter is a manager.
- Damaged/expired/rejected lots, excess counts within the existing configured intake tolerance, worker-reported delivery issues, and pending corrections appear as exceptions. A partial delivery alone is not reported as a confirmed shortage. Counts above the existing intake tolerance remain rejected by the receipt transaction.
- Workers can flag an observed delivery issue with a reason, without being shown an expected count. A manager can record an independent review. Reporting does not itself claim stock is missing or close a partial PO.
- A corrected count requires a reason from the original counter and approval by a different manager. The pending job and PO count change atomically; original evidence and both reasons remain available. Corrections must be positive and remain within the original receiving tolerance.
- Once putaway is assigned or started, this correction path refuses changes. Use the existing inventory adjustment approval workflow for stock that has entered handling.
- Pending count corrections and unreviewed damage/excess exceptions block starting putaway. Normal clean receipts do not. Existing damaged-goods and stock-placement controls continue to apply after acknowledgment.
- Decisions refresh only the receiving review scope, active job queue and orders. No automatic polling or global mount-time review fetch was added.

## Database deployment

All migrations below were saved before execution and successfully applied to **staging `utykzifrblpyxlvlknsm`**. Production was not changed.

| Saved migration in `/migrations/` | Applied |
| --- | --- |
| `20261104_blind_receipt_review.sql` | Yes |
| `20261104_blind_receipt_review_corrections.sql` | Yes |
| `20261104_receipt_exception_review.sql` | Yes |
| `20261104_receipt_exception_detail.sql` | Yes |
| `20261104_receipt_job_guard_json.sql` | Yes |
| `20261104_receipt_decision_qualification.sql` | Yes |
| `20261104_receipt_delivery_issues.sql` | Yes |

The follow-up migrations retain actual deployment history: they integrate reviewed downward corrections with existing evidence guards, make manager action exception-based, and repair JSON operator grouping and PL/pgSQL name qualification detected by the full transaction test.

Private evidence tables have RLS enabled and no client grants or direct policies. Access is restricted to scoped functions in the private schema, with invoker wrappers in public. The security advisor's informational “RLS enabled, no policy” findings for these private tables reflect intentional deny-by-default access. No unrelated advisor changes were made.

## Verification

- `npx tsc --noEmit`.
- 21 component/translation/receiving workflow assertions across `BlindReceiptReview`, `ReceivingModalSteps`, `ReceiveTranslationOromoHararghe`, and `receivingPolicyAndWorkflow`.
- `tests/sql/blind_receipt_review.sql` executed against staging with authenticated roles and real receipt/putaway guards, then rolled back all fixtures. Verified immutable snapshots, receipt retry idempotency, worker response redaction, manager comparison, self-review denial, clean partial intake bypassing the exception queue, routine putaway without acknowledgment, pending-correction hold, atomic downward correction, original snapshot retention, post-start correction rejection, direct count tamper denial, damage hold/review, cross-country denial, and worker-reported issue routing.
- Browser visual review unavailable: computer access to Chrome was not approved. No browser layout or end-to-end UI certification is claimed.
