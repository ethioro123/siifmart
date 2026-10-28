# Scoped price proposals

Bulk pricing, SKU-wide Product Control updates, and pricing-rule submissions now create one inventory request per SKU and selected location set. A SKU across 100 locations creates one review item and one approval decision. Different SKUs remain separate review units; retries retain failed SKUs, never a partially submitted site set.

The server validates every location's country, territory, SKU, positive recorded cost and whole-number prices. Country and regional boundaries come from authenticated employee records. The selected locations are frozen at submission; new locations are not silently added later. Each submission supports up to 2,000 product locations per SKU. Existing individual proposals are preserved and must be reviewed or rejected before a conflicting scoped proposal can be created.

Private `price_proposal_targets` rows store proposed prices and per-site baseline evidence. They are inaccessible through ordinary table reads/writes. The public submission and paginated review RPCs delegate to explicitly authenticated private helpers. A restrictive request policy prevents partial group visibility across regional boundaries.

Reviewers see one scoped summary and can open a paginated list of all included locations, showing site display codes, original prices, proposed prices, recorded costs and margins. Per-location price history still references the single proposal and preserves the matching location's proposal evidence.

A regional merchandising manager can approve within their region under the existing independent-approver rules. A manager's own proposal escalates. Changes spanning regions require a country commercial director or country managing director. If any location falls below the 15% floor, Country Finance must clear the entire frozen baseline before a separate authorized commercial reviewer approves it. No requester can approve their own submission.

Approval locks every product in a stable order, revalidates every baseline and applies the complete proposal transactionally. Any stale cost/price, unauthorized target or failed update aborts the full decision. Identical pending retries reuse the original request. Overlapping pending proposals are rejected, including attempts to submit an individual edit for a grouped target.

Verification: `tests/sql/grouped_price_proposals.sql` exercises authenticated regional and country decisions, retry reuse, country/region isolation, Finance escalation, stale evidence, atomic application, and per-location history. Frontend service and review tests cover grouping and UI states. No existing pending proposals are silently merged or deleted.
