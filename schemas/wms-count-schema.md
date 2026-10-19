# WMS Blind Count Schema Addendum

These objects were added to the linked production and staging databases by the listed WMS migrations. The referenced `sites`, `employees`, `products`, `inventory_requests`, and `system_config` columns were confirmed against the live schema before applying them.

## `public.wms_count_sessions`

- `id uuid primary key`
- `site_id uuid not null references sites(id)`
- `country_code varchar(10) not null`
- `count_type text` (`Cycle` or `Spot`)
- `status text` (`Active`, `Completed`, or `Cancelled`)
- `created_by uuid references employees(id)`
- `created_at`, `completed_at`, `cancelled_at`: `timestamptz`
- One active session is allowed per site.
- Row-level security is enabled; browser roles have no direct table grants.

## `public.wms_count_items`

- `id uuid primary key`
- `session_id uuid references wms_count_sessions(id)`
- `product_id uuid references products(id)`
- `product_name`, `product_sku`: `text`
- `location text`
- `expected_qty numeric`: server-only snapshot; never returned by the count RPCs
- `first_count_qty`, `recount_qty`: `numeric`
- `first_counter_id`, `recount_counter_id`: `uuid references employees(id)`
- `recounts_done integer`
- `inventory_request_id uuid references inventory_requests(id)`
- Row-level security is enabled; browser roles have no direct table grants.

## Authenticated RPCs

- `start_wms_count_session(uuid, text) returns uuid`
- `get_wms_count_session(uuid) returns jsonb`
- `record_wms_count(uuid, uuid, numeric) returns jsonb`
- `finish_wms_count_session(uuid) returns jsonb`
- `cancel_wms_count_session(uuid) returns void`

These functions verify the authenticated employee and site scope. Expected quantities remain inside Postgres. A variance produces a pending HQ inventory request after the configured independent recount; stock changes remain under the existing approval workflow.

## PACK Attestation

`public.wms_jobs.pack_security_seal_serial text` records the seal serial. `guard_pack_completion_attestation()` blocks completion with incomplete line quantities and enforces the country policy for required seals. Completed PACK verification is immutable.

## Applied Migrations

- `migrations/20261019_secure_persisted_wms_counts.sql`
- `migrations/20261019_fix_wms_count_response_states.sql`
- `migrations/20261019_prioritize_uncounted_wms_products.sql`
- `migrations/20261019_guard_wms_count_session_actions.sql`
- `migrations/20261019_guard_pack_completion_attestation.sql`
- `migrations/20261019_restore_pack_handoff_on_production.sql`
