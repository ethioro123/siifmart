# 07 · Approvals, tasks and notifications

[Handbook](../SIIFMART_DESIGN_STANDARD.md) · Edition 29 October 2026

## Keep attention compact and review complete

The application must tell an authorized employee that work needs attention without turning every module into an expanded approval dashboard. The default entry point is a compact labeled control with an actionable count and a predictable destination. Keep the full queue and detailed evidence in their dedicated views.

Product approvals use this compact treatment wherever they appear, including Merchandising and Regional Operations. Do not reintroduce a large preview card in another module. On smaller screens an icon and count may be sufficient visually if the accessible name explains the purpose and state. A visible label should remain where space permits.

## Count semantics

A count means work the current employee can meaningfully review at the current workflow step, under the authorized country and territory. It must not include a request just because the employee can read the underlying record. Exclude self-approval and already-completed decisions where the server's workflow requires it.

Treat first load as checking. Treat failure as unavailable with a recovery action. An old cached count must not be presented as a newly verified count after refresh fails. If a partial inbox is supported, distinguish available queues from unavailable ones and avoid a misleading total that looks complete.

Realtime and refresh should update the count without rebuilding the page, shifting the toolbar or announcing every background event. Keep identity, role, country and relevant territory in cache boundaries. Navigation can reuse fresh results; it should not trigger repeated identical requests merely because a page opened.

## Queue anatomy

A queue item needs business identity, requester, workflow state, scope, submission age and a visible review action. Price proposals identify the SKU and affected locations. Purchase orders identify their business reference and monetary context. Employee requests identify only the personal information required by the authorized reviewer.

Filters should describe understandable states such as “Needs my review,” “Awaiting clearance” and “Completed,” where supported by the actual workflow. Do not invent a workflow category to match a visual design. Sorting can prioritize age or urgency only when that priority is defined and based on real evidence.

Deep links must open the exact record or complete revision and preserve read-only review when the current employee lacks approval authority. “Review” must never silently apply an approval. If the record is no longer accessible or already completed, show that state with a route back to the queue.

## Scoped proposals

One coherent proposal should represent one coherent decision. For SKU pricing across a region or country, use one proposal per SKU and selected location set. Store site-level evidence as detail rather than generating a queue item for every site. Different products can remain independent review units when that makes approval and retry precise.

The summary must state the scope and number of locations without pretending the anchor site's UUID describes the whole group. The review must expose the included locations, display site codes, baseline prices/costs, proposed prices and material margin exceptions. Paginate large evidence lists, preserving the total and complete-scope consequence.

Freeze the selected scope at submission. Adding a new site later must not silently extend an already-reviewed decision. A retry should reuse the same pending proposal when its evidence is identical. If a competing edit exists, explain the conflict instead of silently merging incompatible requests or multiplying rows.

## Decision evidence

Place the affected object, before/after values and important exceptions near the approval action. A low-margin exception belongs in the review, not only in raw JSON. Keep specialist clearance distinct from final approval. Show whether a prerequisite is awaiting action, recorded or invalidated by changed evidence.

Actor and reviewer authority come from the server. The interface may explain the reason approval is blocked, but a hidden button or role label is not authorization. Do not hardcode a stale matrix of roles and financial limits into a reusable visual component. Read the current route and policy result from the authoritative workflow.

Price workflows retain independent commercial approval and Country Finance clearance where required by the current margin policy. Other domains follow their own configured authority and separation rules. A country-wide selection must not be sliced into apparently independent regional approvals when its transaction contract is all-or-none.

## Confirmation and completion

The final action should name the actual decision and scope. “Approve price change” in a review that clearly states “30 locations” is better than a generic “Confirm” with hidden consequences. If another employee completed the request, refresh the actual state and prevent a duplicate decision.

Pending, approved and applied are separate states unless the server contract makes approval and application atomic. Do not announce complete success when only submission succeeded. For atomic scoped pricing, a stale target or failed update must leave all included locations unchanged and present a recovery route. Preserve the review evidence rather than clearing the screen after an error.

Rejection requires the actual reason where policy requires it. Keep that reason in the record and give the requester a route to understand what needs revision. Do not use a generic negative toast as the only record of a consequential decision.

## Notifications and tasks have different jobs

A notification reports an observed event or points to work. A task is an assigned work item with an owner, status and persistence. Keep the notification center focused on reading, opening the linked record and managing notification state. Task assignment belongs in its dedicated authorized workflow, not as an unrelated form inside a read-oriented bell panel.

A task is created only after confirmed persistence; completing a local row is not completion of the task. Task status, assignee, country/site and relevant permissions must survive reload and identity changes correctly. An assignment toast should not imply the recipient was notified through an external channel unless that delivery was actually confirmed.

Avoid notification storms. Group related observed events where the product supports it, keep counts meaningful, and reserve intrusive presentation for events that truly demand immediate attention. “Unread” and “requires approval” must remain distinct concepts.

## Acceptance scenarios

Test a requester, an eligible reviewer, a different region, a different country, a completed request and an employee whose role changed. Open review from the module, inbox and a direct link. Verify unavailable counts, failed evidence loading, changed baselines and duplicate submissions. Confirm that a group counts once while location-level audit history remains complete. A badge is accepted when its count, destination and authority agree.
