# Unified approval inbox

The global header and an opening-page notice show the signed-in reviewer's pending tasks. `/approvals` groups them by workflow and links directly to the relevant tabs or HR approval modals. Floor roles do not issue an inbox query. This expands the regional product inbox; the existing oldest-five product card remains available.

## Coverage

- Procurement: purchase orders within the live approval RPC authority and configured regional limit, buyer purchase-request review and product-suggestion sourcing review.
- Finance: above-limit PO finance clearance, expenses, margin exceptions, below-margin price finance sign-off, candidate compensation, salary adjustments and payroll finance certification.
- HR: hiring requisitions, offered-candidate vetting, employee onboarding, headcount quotas, employee profile changes, payroll HR certification and regional payroll attestation.
- Transfers: warehouse transfer picking release through the current WMS workflow.
- Inventory and merchandising: non-edit inventory requests, product edits, price changes, whole planogram revisions and campaign proposals.
- Leave is checked when the backend table, grants and scopes are available. It is explicitly unavailable when they are absent.

Counts represent review steps. One request can need distinct departmental decisions; one shelf revision counts once for each department still awaiting a vote. Requests already handled by that department and self-requests are excluded where the workflow uses maker/checker. The inbox does not execute approvals or change approval authority.

## Security and freshness

`get_my_approval_inbox(text)` is read-only, security invoker, with an empty search path and no anonymous execution. It derives the active employee from `auth.uid()` and uses explicit country and workflow scope filters on top of caller RLS. Only the CEO may request a country different from their home country. Each queue is independently checked; missing tables, columns, functions or grants produce a null count and unavailable status. Those entries never silently become zero or contribute to the known total. Unexpected errors fail the whole read and cached totals are hidden.

One summary request returns bounded workflow metadata and counts, without employee records, salaries, PO line items or amounts. Cache keys include employee, role, country, region and site. Refresh occurs on mount, page navigation, window focus, reconnect, successful React Query mutations, known salary/payroll events and manual refresh. Country-filtered realtime subscriptions cover the already-published inventory requests, purchase orders and WMS jobs. Other workflows refresh on the next entry/focus/manual refresh; this feature does not add polling or change publication membership. Header/entry copy has synchronized English, Amharic and Oromo translations for POS/WMS surfaces.

## Verified environment gaps

Production has no `leave_requests` table. Staging has the table and RLS but lacks authenticated SELECT permission; its regional payroll schema also lacks `regional_attested_by_id`. These queues are unavailable rather than zero-filled. No permissions or tables were created to bypass those gaps. Termination proposals and photo-change queues currently have service/local-log fallback paths without a reliable shared persisted queue; they are not included in verified totals. The feature covers all requested business areas, not nonexistent backend approval processes. Existing approval RPC/UI inconsistencies remain governed by their current endpoints; the PO counter uses the actual narrower approval RPC roles.

## Deployment and verification

Saved migration: `migrations/20261028_unified_approval_inbox.sql`, mirrored in `supabase/migrations/20261028105242_unified_approval_inbox.sql`. Applied to staging (`utykzifrblpyxlvlknsm`) and production (`zdgzpxvorwinugjufkvb`) on 2026-10-28. Both are invoker functions with anonymous execution denied. Authenticated read-only smoke checks ran for existing employee roles; production currently has only an active Group CEO in these checks. No production business records were created.

`tests/sql/unified_approval_inbox.sql` runs authenticated, rolled-back staging fixtures for regional PO thresholds, above-limit finance clearance, buyer review, HR headcount, expenses, transfer release, requester exclusion and cross-country/region isolation. The preceding product inbox regression covers grouping and departmental vote removal. Component/service/utility/hook tests cover partial/error/loading states, destinations, refresh subscriptions, navigation/mutations and cache isolation. UI deployment follows the normal application release process; database application does not deploy frontend code.

Final checks: all 30 focused tests, the repository-wide type check, production build and file-size checks passed. The earlier concurrent DriverHeader translator-signature error was resolved in the intervening driver work. Existing project security-advisor findings do not reference the new invoker RPC.

## Review navigation correction

Operational-site and clean-mobile guards previously redirected valid regional review links even when the role already had permission for the destination module. The guard now recognizes allowlisted role/module/path/tab review entries and still requires the existing module permission. Other tabs and unauthorized roles retain their normal restrictions; database authorization is unchanged. Finance payroll entry now opens the existing Payroll review modal. Route regression tests cover regional supply-chain product reviews at stores and warehouses, regional procurement PO reviews, regional finance expense reviews and denial of unrelated roles/tabs. Live browser verification was unavailable because browser/computer-use permissions were disabled.

## Merchandising Proposals review

Each proposal now has an independent Review proposal action, including completed requests and proposals the signed-in employee cannot approve. Review opens a shared modal with the before/after details and departmental progress; only a separate eligible approval action can submit a vote. Ineligible reviewers see the reason (requester, already voted, role, pending finance or completed status). Single-product approvals also open review before confirmation. Whole shelf revisions use the shared application modal rather than depending on native dialog.showModal(), and server failures remain visible in the open review for retry. Selected review state clears when the employee or country changes. Seven actual Proposals-component regressions cover opening, close, review-only states, complete shelf loading, explicit approval and failure retention. No database or approval-authority changes were made.

Price approval routing now follows `regional-price-approval-workflow.md`: one regional/country commercial decision, with Country Finance clearance and country escalation below the margin floor. The old three-way price-vote descriptions above apply only to the preceding implementation; catalog/layout decisions remain unchanged.
