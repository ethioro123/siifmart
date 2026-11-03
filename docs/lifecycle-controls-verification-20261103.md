# Record lifecycle implementation verification — 3 November 2026

This records implemented behavior and deployment evidence. It does not establish statutory retention periods or certify unrelated application modules.

## Entry points and implemented scope

Approvals → Record lifecycle and retained history opens the request, review, investigation-hold and history workspace. Queries start when opened; records, targets and history use pages of 25. Employee and facility deletion dialogs link to Approvals. Transfer manifest deletion now opens cancellation reviews, with synchronized English, Amharic and Afaan Oromoo labels.

- Employees: a manager above the target employee's level submits offboarding evidence. An independent regional HR manager, country HR director or group CHRO above the target's level applies it. Handover evidence, effective date, assigned facility leadership, open cash drawers and active warehouse assignments are checked at execution. Profiles and supporting history remain; refresh sessions are revoked, and protected operational tables reject inactive actors. Routine requests cannot remove group leadership.
- Facilities: a regional operations manager or country operations leadership requests closure. Separate country operations, country finance and managing-director accounts clear it in sequence. Final execution checks current stock, staff, tills, jobs, POs, transfers, expenses, vendor invoices and receivables. Unresolved dependencies keep the facility open. Closed sites reject new operational writes. Reopening and reinstatement require a separate reviewed workflow; direct status edits cannot reactivate these records.
- POs: only unapproved, unexecuted Draft/Pending orders are eligible for cancellation review. An independent procurement lead decides. Receipts, invoices and warehouse evidence block cancellation. The preparer can separately discard their own unsubmitted draft through a checked RPC; the cancelled record and audit event remain. No executive ownership bypass exists for draft discard.
- Transfers: an independent authorized operations/logistics reviewer can cancel unapproved and unexecuted outgoing transfers. The caller must be authorized at the source, and both endpoints must be in the same country. Approved, dispatched or received work requires return/reconciliation rather than this cancellation path.
- Warehouse drafts: unassigned Pending drafts without execution, child work or mirrored transfer evidence can be cancelled through review. The persisted job remains Cancelled.
- Holds: authorized compliance/audit staff can place an investigation hold. It blocks lifecycle application and draft discard. A different authorized compliance reviewer must release it. Placement and release identities, roles, times and reasons remain available.

Requester, reviewer and compliance identities are derived from active employee records. Client-supplied role/name/country values do not confer authority. Requests lock targets and preserve the reviewed state; changed state is rejected. Requester withdrawal and terminal-history views preserve evidence. Audit events cannot be updated or deleted through the application.

No automatic purge or retention duration was introduced for this new ledger. Existing price-history retention remains separate. Permanent erasure, board-level leadership changes, reinstatement/reopening and legal retention schedules are not provided by this routine workflow. This rollout covers the entities above; it is not an audit of every legacy supplier/customer/catalog deletion route or every token-authorized endpoint outside the protected operational tables.

## Environments

- Staging: `utykzifrblpyxlvlknsm`.
- Production: `zdgzpxvorwinugjufkvb`.
- The earlier `20261103_protect_operational_record_history.sql` was already applied to both environments.
- Final affected function definitions match between environments, including request, decision, target lookup, withdrawal, holds, draft discard, scope and transition/dependency guards.
- RLS is enabled on requests, events and holds. Authenticated users have SELECT only; direct INSERT/UPDATE/DELETE/TRUNCATE privileges are absent. Anonymous execution is absent on all six lifecycle command/query RPCs.

## Saved migration application status

All paths below are relative to `migrations/`. Apply the final production sequence in the order shown by the first five rows, then the three `final_*` rows; the other rows document staging iterations superseded by those final definitions.

| Saved SQL file | Staging | Production |
|---|---|---|
| `20261103_lifecycle_request_foundation.sql` | Applied | Applied |
| `20261103_lifecycle_request_commands.sql` | Applied | Applied |
| `20261103_lifecycle_review_execution.sql` | Applied | Applied |
| `20261103_lifecycle_workspace_queries.sql` | Applied | Applied |
| `20261103_lifecycle_session_read_protection.sql` | Applied | Applied |
| `20261103_lifecycle_workspace_result_types.sql` | Applied | Skipped; superseded by final restricted lookup |
| `20261103_lifecycle_dependency_race_guards.sql` | Applied | Included in final restricted lookup |
| `20261103_lifecycle_warehouse_draft_reviews.sql` | Applied | Included in final review governance and lookup |
| `20261103_lifecycle_investigation_holds.sql` | Applied | Included in final review governance |
| `20261103_lifecycle_target_least_privilege.sql` | Applied | Included in final restricted lookup |
| `20261103_lifecycle_target_identity_qualification.sql` | Applied | Included in final restricted lookup |
| `20261103_lifecycle_outgoing_transfer_scope.sql` | Applied | Included in final restricted lookup |
| `20261103_lifecycle_final_restricted_lookup.sql` | Applied | Applied |
| `20261103_lifecycle_final_review_governance.sql` | Applied | Applied |
| `20261103_lifecycle_own_draft_discard.sql` | Applied | Included in final own-draft discard |
| `20261103_lifecycle_own_draft_actor_qualification.sql` | Applied | Included in final own-draft discard |
| `20261103_lifecycle_final_own_draft_discard.sql` | Applied | Applied |

Automatic approval review rejected the intermediate production `lifecycle_workspace_result_types` application because installing an older broader definition before the restrictions would risk regression. It was not retried unchanged. Final restricted, idempotent definitions were first validated in staging and then applied directly to production. No deployment blocker remains.

## Verification

- `npx tsc --noEmit`: passed.
- `npm run lint:size`: passed; the growing factual feature registry was split into a linked 3 November history file, preserving prior entries.
- `git diff --check`: passed.
- 22 Vitest checks passed across `recordLifecycleWorkspace`, `recordLifecycle`, `terminations` and transfer translation parity.
- 27 live staging SQL assertions passed in `tests/sql/record_lifecycle_security.sql` and `tests/sql/record_lifecycle_cancellations.sql`. Every fixture and action rolled back. Checks cover cross-country denial, self-approval, stale evidence, missing handover, direct API bypass, audit mutation denial, inactive actors, staged closure, live dependencies, closed-site work, RLS request/event access, investigation hold/release, PO receiving evidence, replay, transfer/warehouse cancellation and preparer-only draft discard.
- Production checks were schema, grant, RLS and function-definition verification; no business employee was offboarded and no operating facility/order/transfer was changed as a deployment test.
- Supabase security advisors were inspected before and after deployment. The explicitly authenticated SECURITY DEFINER lifecycle endpoints are intentional: they own atomic protected-ledger writes and validate active identity, authority, scope, independence and record state. Anonymous execution and direct ledger writes are revoked. Advisor notices for these authenticated endpoints are not a claim that the project has no other security advisories. Existing unrelated advisor findings were not remediated by this rollout.
- UI behavior was tested with React Testing Library; a full browser/device visual and accessibility review was not performed.
