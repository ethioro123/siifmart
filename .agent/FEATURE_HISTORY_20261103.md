# 3 November 2026 feature history

- 2026-11-03: Area operations now uses explicit store assignments, scoped server metrics, a dedicated store overview, narrow read and transfer-request permissions, and database guards against region-wide or sensitive writes. Four migrations applied to staging and production.
- 2026-11-03: Regional governance transitions now check signed-in roles in database triggers; expense approvals use configured limits and a guarded decision RPC; warehouse leadership uses verified employee assignments; regional totals use exact country-local server aggregates. Five migrations applied to staging and production.
- 2026-11-03: Permanent employee, facility, PO and transfer deletion is blocked by database grants and triggers in staging and production. Employee deletion preserves photos; termination proposals no longer auto-approve for the CEO. Lifecycle closure and retention workflows remain pending.

- 2026-11-03: PO creation now offers detailed kitchen/dining categories and everyday household essentials from the shared catalog, with matching specification and count-based handling; pet and animal supplies remain excluded.

- Lifecycle rollout: independent offboarding, facility closure, unexecuted-record cancellation, investigation holds, preserved history, active-session guards and audited own-draft discard are implemented. Production and staging share the final restricted definitions. Deployment and verification: `docs/lifecycle-controls-verification-20261103.md`. No automatic history purge is enabled.

- 2026-11-03: Dynamic Afaan Oromoo (`or`) mobile typography engine implemented. Synchronizes `document.documentElement` and `document.body` with `lang`, `data-language`, and `lang-or` class. Dynamic fluid font scaling (`styles/theme-typography-oromo.css`) scales mobile typography by 11-18% using clamp calculations, tighter letter-spacing (`-0.024em`), automatic hyphenation, and specialized responsive rules for buttons, badges, navigation tabs, table headers, and modal actions, while preserving 16px touch inputs against mobile auto-zoom. Provided `utils/oromoTypography.ts` and `hooks/useDynamicText.ts`.

- 2026-11-03: Inbound receiving barcode verification engine added to split intake (`useReceiveBarcodeCheck`, `ReceiveSplitCard`). Entering or scanning a barcode immediately validates against the database and catalog, informing the worker with verified product name, SKU, and status (Registered to this product, OK to add automatically, or Conflict with another product) with synchronized `en`, `am`, and `or` translations. Scoped product query to `site_id` without invalid `country_code` column reference.

- 2026-11-03: Calibrated transfer request creation permissions in `guard_wms_transfer_approval` to include store managers, replenishment planners, and operations leadership while auto-populating `country_code` and requester fields. Applied migration `20261103_guard_wms_transfer_creation_roles.sql` to staging. Safe logging applied in `products-replenish.ts`.

- Remaining deletion-security gaps: current active UUID identity replaces stale role/email shortcuts; scoped avatar uploads retain earlier versions; product references, personnel documents, receiving evidence, warehouse attribution and general logs are protected; unused zero-stock cleanup is audited; ordinary public-table TRUNCATE grants are removed. Final migrations applied to staging and production; verification: `docs/remaining-deletion-security-verification-20261103.md`.

- Location label empty state (4 November): hide unusable location selectors, previews and print actions until facility zones exist; allow narrow-screen selector stacking and preview toolbar wrapping; translate live status in en/am/or.

- Location label correction (4 November): restored visible zone, aisle, bay and preview controls at user request, retaining responsive spacing and existing configured-zone print validation.

- Brand startup screen (4 November): centered SIIFMART identity, soft theme-aware ambient light, transform/opacity reveal and indeterminate loading motion from first HTML paint through authentication startup. Removed timer-generated progress percentages; retained error/retry behavior with translated copy and reduced-motion/forced-color fallbacks. No minimum display delay or new animation dependency.

- Startup restoration (4 November): restored the previous logo and loading screen at the user’s request; removed the animated brand startup implementation.

- Neutral zone names (4 November): standard zone names now use Zone A–J rather than fixed receiving, fast-pick, packing or outbound purposes. Existing storage classes, temperatures, zone types, stock, IDs and configurable picking/putaway flags are preserved. Migration `migrations/20261104_neutral_warehouse_zone_names.sql` applied to staging (utykzifrblpyxlvlknsm; 300 matching defaults) and production (zdgzpxvorwinugjufkvb; five matching defaults); custom names preserved. Live verification found no disabled picking/putaway flags in either environment.

- Zone and aisle specializations (4 November): optional descriptive metadata in Create/Configure Zone, with aisle descriptions scoped to the selected zone and facility aisle count. Zone management cards show the zone description; location identifiers, scanning, printed labels, routing and movement permissions stay independent. Empty descriptions can be cleared. Added translated field copy in en/am/or, mutation hooks and persistence/error regressions. Migration `migrations/20261104_zone_aisle_specializations.sql` applied to staging (utykzifrblpyxlvlknsm) and production (zdgzpxvorwinugjufkvb); nullable zone description and validated aisle metadata reuse existing zone RLS.

- Specialization configuration clarity (4 November): Configure Zone separates whole-zone specialization from individual aisle specializations in distinct labeled sections. Saved aisle descriptions can be selected for editing; changing either scope leaves the other unchanged. Guidance and examples are translated in en/am/or; both sections use the existing zone save action.
