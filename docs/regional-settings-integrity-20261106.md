# Regional Administration — 6 November 2026

## Changes

- Preserved a saved zero autonomous expense limit in both list and single-record reads. Removed inconsistent fallback amounts from the editor and cards.
- Regional Settings loads a dedicated, country-filtered, paginated site and manager directory. It no longer builds country-wide management choices from the active-site/region cache. Errors are displayed instead of being turned into missing assignments.
- Region and directory query keys include the authenticated actor and selected country. A delayed response for the previous country cannot overwrite the current country's list. Country changes close existing editors.
- Manager selection requires an active Regional Operations Manager whose employee region (or home-site fallback) matches the region. New regions can be staffed after creation through the employee workflow.
- Hub selection excludes country HQ, inactive sites, hubs assigned to another region and other-region facilities. Operational-site allocation cannot move designated hubs through the generic checkbox list.
- Added database relationship guards and uniqueness indexes. Region edits cannot take another region's hub or link a wrong-region manager. Changing a designated hub or manager's underlying placement/status requires first changing the regional designation.
- Budget totals are calculated by a database aggregate rather than downloading order amounts. The private aggregate verifies active employee identity, allowed role, country and region before returning only the summary. Its public wrapper is an invoker function. Missing identity, ordinary floor roles and out-of-scope requests are denied.
- Summaries and approval-time budget enforcement include older orders whose region is obtained from their site when the order has no explicit region. Stored order region takes precedence. Totals remain country-filtered and use the country's business month.
- Replaced the unsupported two-person-limit-change claim with factual country-scope and audit-log wording. This change does not introduce a new approval workflow for governance-limit edits.
- Fixed missing flex/grid display classes and moved both forms onto the shared accessible modal with pending-close protection.

## Rollout

`migrations/20261106_regional_settings_integrity.sql` applied successfully to:

- Staging: `utykzifrblpyxlvlknsm`
- Production: `zdgzpxvorwinugjufkvb`

Production has ten regions with no designated Regional Operations Manager. A live check using both employee region and home-site fallback found no eligible active candidates for those vacancies. No employee roles or placements were invented or changed.

## Verification

- 13 targeted tests passed across service, directory pagination, eligibility, country-response isolation and the regional editor. Tests cover zero limits, wrong-region rejection, protected hub choices and requests for server-side summaries.
- TypeScript passed.
- Transactional SQL checks passed in both environments. Staging used 1,005 fixture orders to verify complete totals beyond the ordinary REST row limit, including legacy orders without explicit region codes. Production used three temporary fixture orders. All fixtures, changes and audit rows were rolled back.
- SQL checks verified zero-limit persistence, rejection of hub theft/moves and missing-identity budget access. Where regional/floor/manager fixtures exist (staging), they also verified wrong-region manager rejection and denial of other-region, other-country and unauthorized-role budgets. Production lacks the corresponding employee fixtures, so those actor checks are not claimed as exercised there.
- Security advisors were read for both environments; they did not name the new summary functions. Existing advisor findings were not declared resolved.
- Browser visual inspection and hosted frontend deployment were not performed. Frontend source is updated in the local checkout.
