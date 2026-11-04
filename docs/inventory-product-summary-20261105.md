# One inventory row per product — 5 November 2026

Inventory Stock now returns one row per normalized SKU within each authorized facility and country. Different products with no SKU remain separate. Active and archived records remain separate, and archived products are excluded unless explicitly requested.

Grouping occurs in PostgreSQL before filters, count and pagination. Inventory totals include all visible location/lot records; searching a secondary bin still finds the product. Stock filters and stock-health status use product totals. Empty receiving placeholders no longer create extra product rows.

Desktop and mobile show the product total and number of stocked physical locations. Opening product details provides a lazy, 25-record paginated stock-by-location-and-batch panel, scoped to the selected facility/country and authenticated user. The panel retains zero-stock records and lots as evidence. It loads only after expansion.

Product IDs and source-record stock remain intact. The aggregate quantity is stored separately in the frontend summary metadata, so adjustment/edit actions continue using the actual selected location record. The adjustment dialog identifies its location and lot and states that it does not adjust the product total. No physical stock, batch, location or catalog records were merged or deleted.

New labels are synchronized in English, Amharic and Afaan Oromoo.

## Database rollout

Saved before execution and applied to both staging `utykzifrblpyxlvlknsm` and production `zdgzpxvorwinugjufkvb`:

- `migrations/20261105_inventory_product_summary.sql`: explicit-projection location and grouped-summary views, with security-invoker RLS and authenticated read-only grants.
- `migrations/20261105_inventory_summary_stock_status.sql`: align grouped low-stock status with configured thresholds and the existing ten-unit default.

Live staging verification returned Bullo Dishes ETDI001 once at Adama Industrial Warehouse: 960 total units, two stocked locations, with the original representative location stock still 240. No deployment blocker.

## Verification

- Complete Vitest suite: 426 files, 2,729 tests passed.
- TypeScript, file-size and whitespace checks passed.
- SQL rollback regression passed after both migrations: one summary for multiple lots/locations and an empty placeholder, correct sum and location count, searchable secondary bin, original records retained, invoker RLS country isolation and no anonymous SELECT grant. Fixtures rolled back.
- Service/UI regressions cover grouped query scope and pagination, distinct source versus total quantities, bounded requests, on-demand location evidence, query errors and location-specific adjustment identity.
- Security advisor ran without findings referencing the new views. Browser rendering was not manually verified.
