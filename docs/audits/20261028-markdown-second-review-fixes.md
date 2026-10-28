# Markdown second-review fixes

All five findings from the second review were addressed:

1. Planning aggregates the complete rolling 30-day completed-sale item window on the server for one product, site and country. It does not use the shared 25-receipt cache or transmit receipt details. Pending, refunded and other-site sales are excluded. The UI shows the window and generation time.
2. Authorized merchandising preparers can generate cost-protected recommendations without receiving raw cost, total cost or margin fields. Existing cost visibility and request-preparation permissions are retained. Derived recommended prices necessarily communicate an allowed price, but no raw cost field is added to the API or the proposal.
3. A private server plan stores a product snapshot, deadline and allowed stages. Submission locks the plan and current product and rejects any row change. Client changes while pending are checked too. Evidence expires after 15 minutes; retrying the same saved plan returns the existing pending request.
4. Expired stock and deadlines beyond the recorded product expiry are rejected both at generation and submission. National ET/KE calendars, rather than browser timezone, define planning days. Missing expiry remains visibly unrecorded; it is not fabricated. This operates on the selected product's recorded expiry, not an independent lot expiry ledger.
5. The selected-price preview separately estimates full-horizon units, remaining stock, revenue at the selected/current price, revenue difference and role-permitted margin. It explicitly assumes unchanged demand and distinguishes its figures from the staged schedule. Approval delays can shorten the remaining window.

## Database application

Saved before execution and applied successfully to staging `utykzifrblpyxlvlknsm`:

- [Server planning and protected submission](../../migrations/20261028_server_markdown_planning.sql)
- [Existing preparation permissions and whole-number regular price](../../migrations/20261028_markdown_preparation_permissions.sql)

Production was not changed. No database application blocker remains. Private plan records have RLS enabled and no direct client grants; public wrappers are invoker functions, anonymous execution is revoked, and internal functions enforce actor/site/country/role checks. Existing pending-request conflict and Operations/Supply Chain/Merchandising/Finance approval guards remain active.

## Verification

- Focused model, calendar, service, generation/submission hook, component and governance regressions passed (44 tests at the first complete run).
- TypeScript passed at the complete-check snapshot; all changed files passed size and whitespace validation.
- Live staging specialist account generated a plan with cost and margin restricted and a separate selected-price summary. At 390px mobile width, document width remained 390px; the stage table scrolled inside its 324px container (706px content). The temporary viewport was reset. No browser proposal was submitted.
- Authenticated-role staging regression passed with 26 synthetic receipts beyond the previous cache page size. It checks exact full-window totals, pending/other-site exclusion, restricted fields, selected-price revenue, wrong-country denial, invalid stages, snapshot mismatch, an actual live cost change, expiry limits and idempotent pending saves. All fixture edits and proposals were rolled back.
- Full repository snapshot: 2,257 passed; 12 failed across six unrelated WMS files (Labels, PackHistory, PackScannerStatusView, PickScannerFlow, PickScannerForm and PutawayProcessModal).
- Advisors retain existing unrelated findings plus the expected informational notice for a deliberately inaccessible private RLS table with no client policies.

Final focused/type/size results and local commit are reported in the completion message. Other chats are modifying and committing this shared checkout concurrently, so broader counts can change during verification.
