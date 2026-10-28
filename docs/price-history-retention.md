# Product price history retention

Applied on 2026-10-28. This is the selected SIIFMART business retention policy; it is not a statement of a universal statutory minimum.

## Periods and enforcement

- Applied product price history and its approval requests: 10 calendar years from the recorded change/approval. Updates to applied history are prohibited; corrections are new price changes.
- Rejected price proposals: 2 calendar years from rejection (or the available request timestamp for legacy rows). Pending approvals never expire as drafts.
- Unsaved price edits are session-only UI state. There is no persisted price-draft table or cancelled-price status to purge; no new draft persistence was introduced. Session-only drafts are discarded sooner than the proposed 90-day maximum.
- Product-level audit/dispute holds preserve all associated price history and proposals indefinitely until an authorized release. Released records are eligible only when their normal retention period has also elapsed.
- History records have product IDs/name/SKU snapshots independent of a product FK; the existing site FK prevents removal of a site with retained history. Approval requests cannot be removed while a linked history record remains.

Database guards enforce age, immutable applied records and holds independently of the cleanup job. The job runs daily at 03:15 UTC through pg_cron, processing up to 250 history rows and 250 eligible requests per country per run. It uses row locks, SKIP LOCKED, per-product advisory locks and a final hold/age recheck. It is a private maintenance function, with no authenticated or anonymous execution permission. Cleanup counts are logged privately per country. It does not prune sales, sale lines, unrelated proposals, WMS history or other audit logs.

## Audit evidence and access

New actual regular, sale, on-sale or cost changes capture old/new prices, product/site/country, currency, requester, approver, reason, Finance clearance and timestamps where those values are present in the source workflow. A private evidence snapshot retains costs, rounded margin percentages, pricing/proposal baselines, actor IDs and original proposed fields. It is linked to the retained history, and cannot be read or written directly by authenticated/anonymous clients. This prevents floor-role access to historical costs through the general price-history table.

Legacy history is preserved as recorded. Missing historical approvals/costs are not reconstructed from current product values. Sale lines already store the actual sale price and cost independently; this change does not rewrite or prune them.

Country Managing Directors, Country Commercial Directors, Country Finance Directors and Country Compliance Managers can place/release holds within their country; the Group CEO uses authorized country scope. Holds require a meaningful reason, a release requires its own reason, and both actions create audit entries. Hold management derives the actor from auth.uid() and validates the target country. Direct client writes to hold records are not granted.

## Product UI

The product History tab defaults applied-price reads to the most recent 12 calendar months. All retained history removes that date filter; explicit search matches requester, approver, Finance approver, reason, SKU, product name or currency. Reads are scoped by product, site and country, and paginated ten records at a time. Changing period/search resets the page. Search submits explicitly rather than querying on every keypress. Pending and decision history remain a separate section, with their existing bounded pagination.

The audit/dispute hold section appears for server-authorized country leaders. Failed reads do not claim no hold, and hold/release confirmation appears only after a successful save. Existing selling-price notices in POS retain their current workflow; no POS/WMS strings or sales flows were changed.

## Deployment and checks

Saved migrations (each mirrored in `supabase/migrations/`) applied to staging `utykzifrblpyxlvlknsm` and production `zdgzpxvorwinugjufkvb`:

- `migrations/20261028_price_history_retention.sql`
- `migrations/20261028_price_history_read_rpc.sql`
- `migrations/20261028_price_retention_scan_indexes.sql`

Both environments have the active daily cron job, immutable-history trigger, invoker public read/hold wrappers, anonymous execution denied, and no authenticated permission to read private evidence or execute cleanup. No production business records were deleted or repriced during verification. The first scheduled run will remove only eligible expired, non-held records.

`tests/sql/price_history_retention.sql` runs a real authenticated price approval and verifies captured private evidence, history immutability, client maintenance denial, 10-year/2-year cleanup, hold/release, unauthorized release denial, pending preservation, country isolation and recent/all-retained reads. Historical fixture setup temporarily disables only the inventory edit insertion guard in a rolled-back staging transaction; it is re-enabled before all retention assertions. All test changes roll back.

25 focused hook/service/utility/component tests, TypeScript, production build and file-size checks pass. Security advisors flag the intentionally inaccessible private evidence/maintenance-log tables as RLS-without-policy informational entries; no retention-related error/warning was introduced. Existing unrelated advisor findings remain outside this change. Frontend changes still follow normal deployment.
