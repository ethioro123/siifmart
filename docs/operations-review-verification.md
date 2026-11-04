# Operations Review — 4 November 2026

## Entry and coverage

WMS Operations now offers one **Operations overview** control above the operation tabs. Authorized managers open it without changing the current worker tab. No review-domain query runs before it opens. The manager-specific Receive review button is consolidated into this entry; workers retain **My submitted counts** under Receive.

The default view is **Active work**, with in-progress jobs ordered first. **Exceptions** is a separate filter for recorded issues; an empty exception list does not mean no work is running. Operation filters cover Receive, Putaway, Pick, Pack, Dispatch (including driver jobs), Transfers, Replenishment, Counts and adjustments, Returns, Waste and Labels. Active work and History are deliberate separate views. Queues return 25 headers per page. Evidence, lines, discrepancy reports and review notes are bounded and loaded for one selected record.

The workspace reads the actual persisted receipt, WMS job, stock request, return, count-session and transfer records. It does not derive a complete operational history from the currently loaded job cache. Completed jobs with unresolved Pick/Pack reconciliation or findings remain visible in exceptions; native reconciliation plus findings remove those reports from the exception queue.

## Decisions and handoffs

- **Receive:** embeds the existing blind-receipt review for the exact submission. Original-counter redaction, independent correction approval and exception-based putaway holds are unchanged.
- **Pick/Pack:** shows first count, recount, original manifest quantity, reconciliation and findings. Eligible independent supervisors use the existing trusted reconciliation/findings RPCs from this workspace. Confirmed-handling-error responsibility assignment remains in the original detailed audit workflow.
- **Returns:** eligible existing credit reviewers see the credit amount and currency and can invoke the existing return-credit decision with a reason. An approved credit is not payment settlement; restock still uses inventory approval.
- **Stock/Waste/count variances:** shows the exact persisted adjustment. Open stock approval links to that request, including requests outside the first Inventory list page. Existing approval hooks and server controls retain authority. Linked count-session adjustments can be opened directly from evidence.
- **Putaway, Dispatch, Transfers, Replenishment and other jobs:** review evidence centrally and open the existing operation controls. WMS job handoffs fetch the exact selected job, recheck scope, then open its existing tab/detail controls. Standalone transfer records open transfer controls. No new generic button clears a transport hold or replaces driver co-sign.
- **Review notes:** independent, reasoned, append-only observations tied to the reviewed state fingerprint. Stale evidence is rejected, retries deduplicate, and notes never approve stock, clear operational holds, settle financial transactions or change task status. Routine work never requires these notes; the note form is collapsed behind an explicitly optional action.

Pending transport quantities stay in the original handover workflow. The generic receiving-job fallback omits expected quantity. Count-session expected quantities are shown only after completion and excluded for the manager who performed either count.

All new WMS labels have English, Amharic and Oromo entries. Reading failures do not display cached rows as current or claim that exceptions are zero. Native controls remain permission-dependent; opening this workspace does not grant new operational approval powers.

## Database deployment

Saved before execution and applied to **staging `utykzifrblpyxlvlknsm`**:

| File in `/migrations/` | Applied |
| --- | --- |
| `20261104_operations_review_workspace.sql` | Yes |
| `20261104_operations_review_evidence.sql` | Yes |
| `20261104_operations_review_final_scope.sql` | Yes |
| `20261104_operations_review_retry_identity.sql` | Yes |

Production was not changed. Private review notes use RLS, no direct client table grants, append-only enforcement and scoped private functions behind invoker wrappers. Site/country scope and active manager identity come from trusted employee/site records. Regional/HQ roles at an Administration anchor automatically include only their existing authorized sites within the active country. Branch managers remain locked to the selected authorized facility, even when their stored scope_level says REGIONAL. Every queue row shows its actual site and evidence/actions use that site. Source-specific decision RPCs retain their existing checks.

## Verification

- `npx tsc --noEmit`.
- 20 component regressions across OperationsReview, BlindReceiptReview, InventoryStockReviews and ReceivingModalSteps: shared entry is lazy, floor workers have no manager entry, default active-work filtering, all operation choices, explicit history, cached rows hidden after failure, exact receipt adapter, complete translations, existing blind count behavior and exact linked stock review outside the current list.
- `tests/sql/operations_review_workspace.sql` ran on staging under authenticated role claims and rolled back every fixture. It covered ten actual operation queues, unresolved Pick visibility, independent action evidence, append-only/idempotent review notes, changed-reason retry rejection, notes retaining holds, stale-state rejection, native reconciliation/findings, removal of reconciled/reviewed reports from exceptions, receiving fallback redaction, and denied floor/cross-country access.
- The earlier blind-receipt transaction regression remains the reference for locked original counts and independent pre-putaway corrections.
- Browser visual verification was unavailable in this session because Chrome computer access was not approved earlier. No browser layout certification is claimed.

The security advisor reported only the expected informational no-policy notice for the new private notes table: direct client access is deliberately denied. [Supabase advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Active receiving visibility follow-up

The live job AAAA0033 was verified as In-Progress at Adama Industrial Warehouse. The original default Exceptions filter hid routine activity, and querying only the Adama Administration anchor omitted the warehouse entirely. The regional manager query now returns this job from the authorized portfolio. A partial submitted count no longer suppresses the parent RECEIVE job while it remains active.

Saved before execution and applied to staging `utykzifrblpyxlvlknsm`:

- `migrations/20261104_operations_overview_active_scope.sql`
- `migrations/20261104_operations_overview_site_name_type.sql`

The second file casts the existing varchar site name to the helper's declared text result, as found by the live query check. `tests/sql/operations_overview_active_scope.sql` passed with authenticated identities and rolled back all fixtures: administration-to-warehouse visibility, active receiving after partial submission, actual-facility evidence, bounded pages, facility-only branch visibility, denied anchor manipulation, and country isolation. Eleven focused OperationsReview/BlindReceiptReview component checks passed. TypeScript passed. No active job or stock was changed by these checks.
