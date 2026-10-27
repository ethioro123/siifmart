# Markdown clearance planner fixes

The planner now generates calendar-day stages from the selected deadline. It uses recorded stock/cost and the available 30-day sales baseline; discounts no longer assume an unmeasured demand uplift. Stock, projected sales, stage/cumulative revenue, discounts and margin are whole numbers. Cumulative demand is rounded once per boundary, avoiding extra units caused by independently rounding each stage. Dates reject impossible values and use calendar arithmetic across timezones and daylight saving.

A bounded searchable product catalog includes facility names to distinguish matching SKUs. Branch searches stay facility-scoped; HQ and regional users retain their existing authorized catalog scope. The stage table provides exact opening stock, projected sales, closing stock, price, actual discount and revenue. The optional chart shows stock only. Summary cards stack on small screens and the table scrolls inside its own region.

One selected price can be proposed through the existing price-governance mutation. Later stages are not scheduled or activated. Pending checks fail closed, synchronous locks prevent repeat clicks, scope changes/unmount cancel checks before submission, and successful saves remain locked until explicit product/approval refresh. Inputs or refreshed records invalidate stale plans. Selection and proposal feedback are scoped to user, country, site and region.

Cost-restricted accounts are still blocked from generating a cost-protected plan. No inferred cost is substituted, no privileges are expanded, and existing supervisory/Finance approvals remain mandatory. The forecast uses available history, which is not a guarantee that a complete 30-day history is loaded. Product expiry is displayed for review; this is not an automatic expiry-aware stock disposal engine.

## Database migration

[20261028_markdown_proposal_guard.sql](../../migrations/20261028_markdown_proposal_guard.sql) was saved before execution and applied successfully to staging `utykzifrblpyxlvlknsm`. Production was not changed. No application blocker remains.

The internal trigger takes a transaction advisory lock for pending product edits. A markdown request cannot race an existing pending edit, and another edit cannot race a pending markdown request. The lookup is country/site/product scoped with a partial index. The function is private and not directly executable by clients; existing RLS and approval triggers remain in force.

## Verification

- Focused planner/model/hook/governance regressions: 34 passed, including scope cancellation, duplicate clicks, failed/pending checks and refresh after approval status changes.
- Model regressions: 14 passed under `America/Los_Angeles` as well as the default test environment.
- Staging rollback regression `tests/database/markdown-proposal-guard.sql` passed. It verifies duplicate markdown and competing edits in either insertion order, plus another product remaining independent. It exercises authenticated actor claims with privileged row access to avoid false passes from RLS filtering. No real price or approval was applied.
- Live desktop staging: verified catalog loading, facility labels, product details and cost-restricted validation. No browser proposal was submitted. Live mobile viewport testing was unavailable; responsive layouts and accessible controls were checked in component tests/source.
- Supabase advisors reported no finding naming the new markdown function/index; unrelated existing findings remain.
- Full repository/type/size results are reported in the completion message because other chats are modifying this shared checkout concurrently.
