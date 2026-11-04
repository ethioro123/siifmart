# Live zone label loading — 4 November 2026

The user identified ADA-WH-01 as the facility missing zones on the deployed website. Production had no warehouse_zones rows for that facility, while the local staging database contained its saved Zone A–J layout. A GitHub code deployment does not deploy saved database configuration.

The saved layout was inspected and persisted in migrations/20261104_restore_ada_warehouse_layout.sql before execution. The migration was applied to production zdgzpxvorwinugjufkvb only. Staging utykzifrblpyxlvlknsm was the read-only configuration source and was not changed. The target is resolved by exact country ET, code ADA-WH-01 and Warehouse type, with an exactly-one-site assertion. Existing zone names are preserved and inserts are serialized for repeat safety. New zone identities are database-generated. Occupancy is derived from target facility stock, not imported from staging. No employee, product, stock, order or other facility record is modified.

Production verification confirms ten zones, Zone A–J, attached to Adama Industrial Warehouse (ADA-WH-01, ET). No specialization/category selections were inferred or added; source descriptions and assignments were empty.

A separate application defect put zones in the same Promise.all as job, transfer and barcode-approval reads. Any unrelated failure prevented zones from reaching the UI. Zones now load through a separate authenticated facility/country/user-scoped query, with no previous-facility placeholder data. Request errors are no longer returned as a successful empty layout. Label printing distinguishes loading, unavailable and unconfigured states and offers retry. Configuration callers handle rejected zone reads.

Fifteen targeted tests passed, including facility isolation, failure/empty distinction, retry, saved metadata and print availability. TypeScript, file-size and diff-whitespace checks passed. The code fix must be included in the next website deployment; the production layout restoration is already applied. The live authenticated browser session was not exercised.
