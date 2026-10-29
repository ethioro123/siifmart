# Fulfillment integrity verification — 30 October 2026

This records the implemented fixes and observed checks; it does not change project rules.

## Result

- Split receiving saves the physical count, downstream putaway jobs and receipt audit in one transaction. The same request returns the original job IDs; stale counts and changed retry payloads are rejected. Failed multi-split receipts leave no partial work.
- Return intake uses exact server receipt lookup at the current site and country, original sale-line IDs, remaining eligible quantities and server-calculated credit based on the original paid total. Pending and approved requests reserve their quantities. Intake and decision retries are deduplicated.
- Returns has Intake, Pending review and History views, bounded pages, in-flight controls and error recovery. An independent authorized financial approver records the credit decision. CEO and country managing director can review from WMS Returns → Pending review under their existing access. Sealed restock proposals create pending inventory adjustments; goods on hold are not silently returned to sellable stock.
- Credit approval does not record cash/card payment or mark a sale financially refunded. Payment settlement remains a separate finance operation. The legacy POS return notification now reports a saved review request instead of an issued refund.
- Direct receiving and return submissions use the existing independent-floor-stage ledger. Receiving the PO prevents the same employee from being assigned its putaway.
- Completing a job closes assigned, accepted, in-progress and paused assignments in the same transaction. Putaway completion requires stock-placement evidence. Generic completion does not fabricate picked quantities from expected quantities.
- Maintenance reconciles saved assignments instead of recreating jobs from ordered quantities. Supervisor reset/cancel preserves history and only accepts unstarted pending work. Failed putaway-job creation throws instead of inserting a local replacement.
- Active WMS and transfer sources load in cursor pages of 25 per source, with destination blind projections taking precedence and explicit selected columns. Delivered transfers awaiting receipt remain eligible. History loads only on request. Failed reads have visible retry controls.
- A receipt-number trigger variable conflict found during staging regression was corrected without bypassing receipt numbering.

## Saved migrations and application

All eight files below were applied to **staging `utykzifrblpyxlvlknsm`**. Production was not changed by this work. The follow-up migrations preserve the recorded execution sequence.

| Saved file | Applied migration version |
|---|---|
| [20261030_fulfillment_receipt_integrity.sql](../migrations/20261030_fulfillment_receipt_integrity.sql) | 20261029165707 |
| [20261030_fulfillment_return_requests.sql](../migrations/20261030_fulfillment_return_requests.sql) | 20261029165718 |
| [20261030_fulfillment_safe_maintenance.sql](../migrations/20261030_fulfillment_safe_maintenance.sql) | 20261029165906 |
| [20261030_fulfillment_retry_integrity.sql](../migrations/20261030_fulfillment_retry_integrity.sql) | 20261029170257 |
| [20261030_receipt_sequence_variable_scope.sql](../migrations/20261030_receipt_sequence_variable_scope.sql) | 20261029170319 |
| [20261030_fulfillment_intake_stage_separation.sql](../migrations/20261030_fulfillment_intake_stage_separation.sql) | 20261029170630 |
| [20261030_fulfillment_paused_assignment_closure.sql](../migrations/20261030_fulfillment_paused_assignment_closure.sql) | 20261029170926 |
| [20261030_fulfillment_return_read_performance.sql](../migrations/20261030_fulfillment_return_read_performance.sql) | Verified applied; see staging migration history |

## Verification

- `npx tsc --noEmit`: passed.
- `npx vitest run`: **379 files, 2,491 tests passed**.
- `npm run lint:size`: passed; all checked source files within 500 lines.
- `git diff --check`: passed.
- [Staging rollback regression](../tests/sql/fulfillment_receipt_returns_integrity.sql): passed using actual authenticated claims, RLS and triggers. Tests cover receipt idempotency, stale counts, multi-split rollback, blank receipt rejection, changed return retries, overreturns, cross-country denial, self-review denial, requester visibility, credit arithmetic, unchanged stock/payment state, independent receiving/putaway workers, supervisor maintenance and paused-assignment closure. All fixtures rolled back.
- Service/hook/UI regressions cover unconfirmed responses, propagated failures, retry identity, no eager return history, exact lookup, required counts/reasons, damaged-goods hold, language parity, keyset cursors and masked projection precedence.
- Security/performance advisors were reviewed. New return-list RLS identity evaluation and foreign-key indexing notices were resolved. The private receipt ledger deliberately has no direct client grants or RLS policies; new indexes may show unused until workload exercises them. Existing broader-project notices remain, including the explicitly scoped blind receiving views ([advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)); this pass does not certify the full project's security configuration.
- No interactive device/printer walkthrough was performed in this pass.
