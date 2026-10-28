- Smart Rules price parity (2026-10-28): Preview/scenario share validated regular-price proposals and preserve active sale prices; invalid combinations are reported. Nonpositive baseline profit uses absolute movement and unavailable percentages; catalog truncation fails visibly, navigation invalidates in-flight previews, and missing-cost counts include matching records only.
- WMS Operations Tab Isolation & Count Authorization Alignment (2026-10-28): Converted all 13 fulfillment sub-tabs (Docks, Driver, Receive, Pick, Pack, Assign, Labels, Putaway, Replenish, Count, Waste, Returns, Transfer) in `FulfillmentContent.tsx` to dynamic `React.lazy()` imports wrapped in `<React.Suspense>` to prevent single-tab compilation or module fetch failures from cascading to the main Fulfillment module. Aligned Postgres RPC authorization in `migrations/20261028_align_wms_count_authorized_roles.sql` across `start_wms_count_session`, `get_wms_count_session`, `record_wms_count`, `finish_wms_count_session`, and `cancel_wms_count_session` to grant full access to executive and operational roles (`group_ceo`, `country_managing_director`, `country_operations_director`, `warehouse_operations_manager`, `inventory_control_supervisor`, `inventory_controller`, `stock_counter`, etc.) in sync with `fulfillmentTabPermissions.ts`. Applied live to both `supabase-staging` and `supabase-mcp-server`.
- Standardized Pure Region & Facility Operational Codes (2026-10-28): Removed redundant country prefixes (`ET-`, `KE-`) from operational field facilities and regional administrations. Implemented Option A for facilities: `[REGION]-[TYPE]-[NUMBER]` (e.g. `ADD-STR-01`, `ADD-DC-01`, `NRB-WH-01`), and Option B for regional administration offices & regions: pure 3-4 letter uppercase codes (e.g. `ADD`, `ADA`, `NRB`, `MBA`). Sovereign Corporate Headquarters strictly retains `[COUNTRY]-HQ` (`ET-HQ`, `KE-HQ`). Applied live schema and relational data migration `migrations/20261028_standardize_pure_region_and_facility_codes.sql` to both `supabase-staging` and `supabase-mcp-server` (production) with full foreign-key cascades across employees, suppliers, purchase orders, inventory requests, merchandising proposals, tasks, schedules, and quota requests. Updated `utils/siteIdGenerator.ts`, `utils/regionIdGenerator.ts`, `services/regions.service.ts`, `components/settings/regions/CreateRegionModal.tsx`, and comprehensive regression test suites.
- Smart Region ID Generator & Sovereignty Governance (2026-10-28): Enforces unique 3-letter pure territorial codes (Option B: `ADD`, `ADA`, `DIR`, `NRB`, `MBA`) on regional creation. Intelligently computes the next smart advanced unique 3 letters without collision when primary codes (e.g. `ADD`) already exist. Real-time form validation in `CreateRegionModal` surfaces one-click smart suggestions (`Use AAS`, `Use AAB`). Enforced database-level format check (`regions_code_format_check`) and unique index (`idx_regions_upper_code`) via migration `migrations/20261028_enforce_unique_3letter_region_codes.sql`.
- Regional Administration Managers Governance & 7-Layer Alignment (2026-10-28): Completed end-to-end 7-layer audit and alignment across all 12 Regional Administration Manager roles (regional_operations_manager, area_operations_manager, regional_procurement_manager, regional_logistics_manager, regional_finance_manager, regional_merchandising_manager, regional_hr_manager, regional_security_manager, regional_it_manager, regional_compliance_manager, vendor_relations_manager, and cs_manager). Aligned top-bar site switching, sovereign landing routes, sidebar module visibility, dual permission matrices, Maker-Checker segregation, departmental hiring wizard pools, and applied live Postgres RLS migrations across both databases with 86 regression tests passing.
- WMS Operations (RECEIVE, PUTAWAY, PICK, PACK, REPLENISH, COUNT, WASTE, RETURNS, ASSIGN, LABELS) East Hararghe Oromo localization (2026-10-28): Complete English, Amharic, and authentic East Hararghe (Harargee Bahaa - Dire Dawa, Harar, Aweday, Babille) Afaan Oromoo dialect coverage across WMS Receive, Putaway, Pick, Pack, Replenish, Count, Waste, Returns, Assign, and Labels operations. Implements localized terminology for dock receiving, blind count (Lakkoofsa Ija-Cufaa / Mirkaneessa Ija-Cufaa Saanduqaa), variance/discrepancies (Baqiyyaa), shelf storage (Kaawwisa Meeshaa / Bakka Kaa'uu), storage bins and aisles (Iddoo Kuusaa / Daandii Kuusaa), picking routes (Karaa Buqqisaa), pull execution (Buqqisa Meeshaa), short picks (Buqqisa Hir'uu), carton packing (Saamsuu Meeshaa / Hojiiwwan Saamsaa), weigh & seal (Madaaluu fi Saamsuu), tamper security tape (Teepii Nageenyaa), cold chain / ice packs (Daandii Qabbanaa / Paakii Cabbee), bubble cushion wrap (Huubboo Eegumsaa), tote pack handovers (Dabarsa Bakka Qophii), forward-pick replenishment (Deebisanii Guutuu / Guutuu Meeshaa), replenishment matrix (Gabatee Guutuu Meeshaa), optimization strategy (Tarsiimoo Guutuu Qaxalee), bulk storage pallets (Kuusaa Tuulaa / Paaleetii Idilee), inventory audit & cycle counting (Qorannoo Kuusaa & Lakkoofsa Marsaa), spot checks (Sakatta'a Bakkaa), dual-worker variance recounts (Deebisanii Lakkaa'uu), net variance valuation (Gatii Baqiyyaa Qulqulluu), waste & spoilage management (Hoggana Balleessa fi Qisaasa Meeshaa), write-offs (Haqama Meeshaa Miidhamee), waste disposal baskets (Qodaa Balleessaa), total value loss (Gatii Waliigalaa Badde), supervisory quantity amendments (Sirreeffama Supervaayizaraa), goods returns & RMA management (Deebisa Meeshaa / Hoggana Deebisa Meeshaa RMA), order receipt search & scan (Nagahee Ajajaa Iskaani / Barbaadi), customer refunds (Kaffaltii Deebii / Kaffaltii Deebii Waliigalaa), return condition appraisal (Haaraa / kan Saamsame, Saanduqa Baname, Kan Miidhame), return disposition actions (Deebisii Kuusi, Gati / Balleessi, Adda Baasii Tursiisi), return to warehouse inventory requests (Gara Manna-Kuusaatti Deebisi), task assignment & workforce distribution (Ramaddii Hojii / Wiirtuu Ramaddii Hojii, Tarree Hojii, Hojiiwwan Ofiin Ramadi, Ofiin-ramaddii Diigi, Gabatee Hojiiwwan Qajeeltoo, Qorannoo Hojii), and label printing & barcode verification (Mallattoo Meeshaa, Wiirtuu Maxxansa Mallattoo, Baarkoodii fi QR Koodii, Mirkaneessa Iskaanii, Gatii Quncheessaa, Ramaddii Meeshaa, Dura-Ilaalcha Qajeeltoo Iddoo, Dura-Ilaalcha Qajeeltoo Baarkoodii). All components verified strictly under 500 lines.
- Planogram (2026-10-28): store-isolated shelf proposals, honest sales/constraint labels, accessible review dialogs and complete revision approvals. Integrity migration rollback-tested in staging; prerequisite restore and integrity migration applied to production with explicit user approval and verified on 28 October. Physical fixtures/execution remain unimplemented. See docs/planogram-integrity-status.md.
- Smart Rules follow-up (2026-10-28): Missing sales no longer imply low demand; shared constant-volume scenario removes invented elasticity, clears stale results, and guards scope changes. Rule list distinguishes loading/errors with retry; deletion confirms intent and overlap wording distinguishes selected-rule previews from newest-first scenarios. - Pricing Rules & Simulator Governance Audit (2026-10-28): Resolved 8 high and medium pricing automation gaps: evaluated 'Sales < X' using actual 30-day recorded units sold; aligned margin action identifiers to 'Set to Cost + Margin' calculating gross selling margin (Price = Cost / (1 - Margin %)); labeled simulator results as model estimates with explicit assumption disclosure; synchronized simulator scope with execution target fetching; enforced whole-number integers across all merchandising calculations and simulation delta percentages; prevented silent returns and premature modal closures with confirmed save and inline validation; permitted zero threshold values and bounded action percentages; replaced misleading active terminology with 'Enabled' and proposal previews; added bounded pagination, search, and status filters for pricing rules; and added cross-rule category overlap and priority detection.
- Demand Forecast integrity (2026-10-28): One scoped database snapshot aggregates sales and incoming commitments without receipt downloads. Refunded receipts without returned-unit evidence, lot-policy conflicts, fractional packs and unverified/late arrivals block ordering with visible reasons. Procurement receipts share canonical recorded packaging; prices no longer infer pack size. Whole-number forecast values, mobile review cards and idempotent internal store replenishment requests preserve source approval and transfer handover. Migration: `20261028_forecast_snapshot_and_requests.sql` (staging).
- POS Command East Hararghe Oromo localization (2026-10-28): Complete English, Amharic, and East Hararghe (Harargee Bahaa) Afaan Oromoo dialect coverage across all POS Command Center panels, KPIs, reconciliation table, supervisor override velocity, drop safe ledger, stock list, and receiving flows.
- Product edit governance (2026-10-28): existing product edits, thresholds and selling units require distinct regional Operations, Supply Chain and Merchandising approvals. Server records each vote, rejects self/foreign/duplicate approvals and stale proposals, and applies the third vote atomically. CEO direct edits are blocked; existing Finance controls remain. Applied to staging `utykzifrblpyxlvlknsm`. Legacy pending edits without a snapshot need resubmission.
# Feature Registry
- Shared product workspace (2026-10-28): Inventory details, Price Manager, Smart Unit and Procurement catalog now share Overview, Specifications & Packaging, Pricing, Stock Policy, and Changes & History. On-demand scoped proposal/price history, pending-change warnings and country-master reference distinguish local records from country catalog. Shared packaging conversion and precise purchase costs align Procurement; selling prices remain whole and edits retain three regional approvals.
- Price Manager (2026-10-28): server-paged authorized catalog; whole-number selling prices preserved; scoped proposal previews, per-item failure/retry, effective sale margins and explicit missing costs. Unit/stock-policy proposals use narrow patches and the same three regional approvals, including CEO submissions.
- Staging login real names & hierarchical organization (2026-10-28): Replaced all numbered/placeholder staging accounts with authentic Ethiopian, Kenyan, and Executive real names across public.employees, public.users, and auth.users (migration `migrations/20261028_staging_real_employee_names.sql` applied to staging `utykzifrblpyxlvlknsm`). Quick Login is structured by work location (HQ -> Regional Administration -> DCs -> Warehouses -> Retail Stores) and ordered inside each location by organizational hierarchy rank (L1..L10) with Rank badges.
- Pack mobile scanner UX, blind count & history (2026-10-27): mobile-first header with progress bar, prominent scan/error status banners, blind-count thumb steppers (`-1`, `+1`, `+5`, `+10`, `Clear`), one-tap rescan, unpacked/packed tote queue without revealing expected quantities, mobile card history layout with dynamic search and status chips, and a safe bottom-sheet shipping label reprint selector.
- Picking prefix correction (2026-10-27): migration applied to staging `utykzifrblpyxlvlknsm`; server validation honors configured facility prefixes. Rollback-only database regression passed.
# Implementation history; verify current code before relying on older notes.
- Assign workload (2026-10-27): server counts show active jobs and calendar-day completions in the configured timezone; 100 active jobs per person enforced by a serialized database trigger. Scoped reads refresh every 15 seconds. Applied to staging `utykzifrblpyxlvlknsm`; rollback-only capacity, midnight and scope checks passed.
## Active Features
### PO Creator Permissions Aligned With Database Policy (2026-10-23)
- PO creation in the application matches the authenticated insert roles enforced in staging and production (`services/permissions.matrix.ts`, `services/permissions.matrix-base.ts`, `utils/permissions.ts`).
### Purchase Request to PO Workflow (2026-10-23)
- Added country/region-scoped purchase requests for employees, Buyer review with request-owner separation, and handoff to a draft PO.
- The request is transactionally marked converted when the linked draft PO is inserted; existing PO approval controls require a separate approver.
- `migrations/20261023_purchase_requisitions.sql` adds RLS, review RPC, request/PO linking and server-side insert validation.
- PO creation roles remain aligned with the live purchase-order insert policy; `CreatePOModal` checks the same allowlist before creating.
### Device-Aware Appearance (2026-10-23)
- New sessions follow the device's light or dark appearance and update when the system preference changes. A manual theme toggle is saved in browser storage and takes precedence on later visits.
- The document applies the initial theme before the app loads to avoid a flash of the opposite appearance.
- **Files**: `hooks/useTheme.ts`, `contexts/CentralStore.tsx`, `index.html`.
### Functional Reporting and HR-Reviewed Hiring (2026-10-23)
- Country functional directors report through their Group functional executives and coordinate with the Country Managing Director; regional retail and regional supply chain remain separate lines. The Group CIO owns the technology chain, the Group CMO sits under the Group CCO, and country compliance reports through the Group CLCO while audit remains independent under the Board/CAE.
- Hiring eligibility follows the candidate role's primary reporting line. Pending onboarding proposals require sign-off from HR roles or the Group CEO; regional HR approvals continue to be checked against the existing regional boundary.
- Until Board appointments are supported in the app, the Group CEO may appoint all Group C-suite roles, including the Chief Audit Executive.
- These hiring checks are enforced in the application workflow. No database/RLS policy change is included in this update.
- **Files**: `components/org-chart/hooks/orgReportingL1L2Data.ts`, `components/org-chart/hooks/orgReportingL3L5Data.ts`, `components/org-chart/hooks/useOrgTreeLayout.ts`, `components/org-chart/types.ts`, `utils/roleHiring.ts`, `hooks/useEmployeeWizard.ts`, `hooks/useEmployeeActions.ts`, `components/employees/modals/ApproveEmployeeModal.tsx`, `components/employees/wizard/StepReview.tsx`.
### Configurable Purchase Order Approval Authority (2026-10-22)
- Regional PO approval uses each region's saved autonomous limit, including zero. Country leadership sets that limit with a recorded reason; procurement managers cannot change their own authority.
- Regional Procurement Managers may approve another person's PO within their region's limit. Above it, HQ Finance records clearance of the current amount and terms before the Country Commercial Director completes final approval. Finance can view POs but does not issue final procurement approval.
- **Files**: `utils/poApprovalPolicy.ts`, `services/purchase-orders.approval.ts`, `components/procurement/ViewPOModal.tsx`, `migrations/20261022_configurable_po_approval_and_finance_clearance.sql`, `migrations/20261022_po_approval_rpc_uses_configured_limit.sql`, `migrations/20261022_finance_read_only_purchase_orders.sql`.
### Lower Role Reporting Metadata (2026-10-22)
- The Org Matrix composes Levels 1–5, 6–8, and 9–10 explicitly from registries named for their actual levels. This keeps existing lower-role reporting behavior and makes the level boundaries clear for future role changes.
- **Files**: `components/org-chart/hooks/orgReportingLines.ts`, `components/org-chart/hooks/orgReportingL1L5Data.ts`, `components/org-chart/hooks/orgReportingL6L8Data.ts`, `components/org-chart/hooks/orgReportingL9L10Data.ts`.
### Purchase Order Pause and Resume (2026-10-22)
- Closing an unfinished new PO now saves the latest form values immediately, including an item still being entered or edited; the form closes only after the browser confirms storage.
- Resuming restores the supplier, destinations, quantities, totals, and in-progress item. A failed browser save leaves the form open with an error; explicit draft deletion starts a fresh item form.
- **Files**: `components/procurement/CreatePOModal.tsx`, `components/procurement/POItemForm.tsx`, `components/procurement/hooks/usePODraft.ts`, `components/procurement/CreatePOFooter.tsx`, `components/procurement/PODraftBanner.tsx`.
- Pick/Pack discrepancy control (2026-10-27): independent recount, protected original manifest, audited worker reports, independent supervisor reconciliation and database handoff holds. Approved Pick shortages remain limited to the recounted quantity; Pack requires exact original counts. Staging migrations and rollback regressions verified; see `docs/PICK_PACK_DISCREPANCIES.md`.
### Canonical HQ and Regional Department Roles (2026-10-22)
- HQ department leadership uses only `head_of_*` role IDs. Regional leadership uses `regional_operations_manager` and the distinct `regional_*_manager` IDs for each department; active application and Edge Function code has no HQ manager role aliases.
- Employee roles, Auth metadata, role validation, database authorization functions, and RLS policies use the same canonical IDs. Historic IDs occur only in the one-time migration that converted existing records and policies.
- **Files**: `types/auth.ts`, `utils/roles.ts`, `utils/roleDisplay.ts`, `services/auth.rbac.ts`, `services/permissions.matrix.ts`, `supabase/functions/admin-reset-password/index.ts`, `migrations/20261022_canonical_hq_and_regional_manager_roles.sql`.
- **Database**: Migration applied to staging (`utykzifrblpyxlvlknsm`) and production (`zdgzpxvorwinugjufkvb`); the admin password reset function was deployed to both.
- Discrepancy history/review (2026-10-27): scoped job, product and staff audit timelines; immutable independent findings; completion awards deferred until review, with idempotent ledger release and no automatic clawbacks. Applied to staging; rollback regression covers history, scope, review and one-time awards.
### Database-Assigned Purchase Order Numbers (2026-10-22)
- PO creation leaves the display number to the existing database sequence trigger and reads the saved number from the insert response. This prevents globally unique PO numbers from colliding when site-scoped reads hide other orders or submissions overlap.
- **Files**: `services/purchase-orders.service.ts`, `migrations/20261022_atomic_po_number_allocation.sql`.
- **Database**: The existing `generate_po_number()` trigger now allocates the established `AAAA0000` format from a synchronized sequence on staging and production.
- Pack scanner completion crash (2026-10-27): missing next-item lookups return no product; the all-packed status renders without querying an undefined manifest line. Regression covers completed-state rendering and absent lookup scope.
### 10-Level Organizational Role Hierarchy (`Level 1` to `Level 10`) (2026-10-22)
- Upgraded SIIFMART's organizational role hierarchy from the 4-level system (`L1–L4`) to a 10-level enterprise command hierarchy (`L1–L10`):
  - **Level 1 (`L1 Global Exec`)**: Global Executive (`group_ceo`, `CEO`, `ceo`)
  - **Level 2 (`L2 Country Exec`)**: Country Executive (`country_managing_director`, `admin`)
  - **Level 3 (`L3 HQ Heads`)**: Corporate HQ Department Heads (`country_operations_director`, `country_finance_director`, `country_hr_director`, `country_commercial_director`, `country_supply_chain_director`, `country_commercial_director`, `country_technology_director`, `country_compliance_manager`)
  - **Level 4 (`L4 Regional Operations`)**: Regional Operations Manager (`regional_operations_manager`)
  - **Level 5 (`L5 Regional Departments`)**: Regional Department Managers (`regional_procurement_manager`, `regional_finance_manager`, `regional_merchandising_manager`, `regional_hr_manager`, `regional_logistics_manager`, `regional_security_manager`)
  - **Level 6 (`L6 Facility Captain`)**: Facility Captains (`store_manager`, `warehouse_manager`)
  - **Level 7 (`L7 Dept Manager`)**: Functional & Department Managers (`regional_supply_chain_manager`, `inventory_manager`, `regional_security_manager`, `dispatch_supervisor`, `cs_manager`, `vendor_relations_manager`, `manager`)
  - **Level 8 (`L8 Supervisor`)**: Deputy & Shift Supervisors (`assistant_store_manager`, `fleet_maintenance_supervisor`, `shift_supervisor`, `shift_supervisor`)
  - **Level 9 (`L9 Specialist`)**: Corporate, Audit & Planning Specialists (`store_operations_auditor`, `auditor`, `payroll_specialist`, `treasury_officer`, `tax_compliance_officer`, `credit_control_officer`, `accountant`, `data_analyst`, `training_coordinator`, `talent_recruiter`, `hr_generalist`, `merchandising_specialist`, `customs_import_specialist`, `it_support`, `dispatcher`, `buyer`, `demand_planner`, `replenishment_planner`, `inbound_qc_inspector`, `loss_prevention`)
  - **Level 10 (`L10 Frontline`)**: Frontline Store, Warehouse & Fleet Staff (`cashier`, `sales_associate`, `pos`, `merchandiser`, `inventory_specialist`, `customer_service`, `stock_clerk`, `picker`, `packer`, `receiver`, `returns_clerk`, `driver`, `forklift_operator`)
- Enforced `Levels 1–8` (`level <= 8`) as the managerial/supervisory boundary across `canEmployRole`, `recruitmentService.canManageHiring`, `useEmployeeWizard`, and default egress-optimized Org Matrix loading, while `Levels 9–10` (`level >= 9`) are non-managerial specialists and frontline staff.
- Aligned all RBAC route guards (`ROLE_PERMISSIONS`, `canAccessRoute`), module permissions (`PERMISSIONS`, `canAccessModule`, `hasPermission`), granular action permissions (`ACTION_PERMISSIONS`), WMS fulfillment tab visibility (`getVisibleFulfillmentTabs`), Zero-Trust runtime policy mappings (`mapUserRoleToManagedRole`), frontline quota fast-track (`LEVEL_10_FRONTLINE_ROLES`, `isDirectOnboardingAuthorized`), and 4-eyes hiring/PO approval guards (`recruitment.service.ts`, `purchase-orders.approval.ts`) with the 10-level hierarchy (`L1–L10`) while preserving Segregation of Duties (`group_ceo`/`ceo` L1 sovereign total access vs. `admin`/`country_managing_director` L2 dock self-receiving prohibition).
- Updated Org Matrix swimlanes, KPIs, toolbar level filters, and Staging Quick Login panels (`CountryQuickLoginPanel`, `KenyanQuickLogin`) to support `L1` through `L10`.
- Added employee-level primary and functional manager assignment during onboarding, persisted both links in Supabase, displayed named reporting lines in the Org Matrix, and added database guards against self-reporting, primary-line cycles, and cross-country/region links, and aligned RLS site scope for group, country, regional, and site roles.
- **Files**: `types/auth.ts`, `utils/roles.ts`, `utils/permissions.ts`, `services/permissions.matrix.ts`, `services/permissions.matrix-audit.ts`, `services/auth.rbac.ts`, `utils/fulfillmentTabPermissions.ts`, `services/zeroTrustPolicies.service.ts`, `services/headcountQuota.service.ts`, `utils/employeeOnboardingGovernance.ts`, `services/recruitment.service.ts`, `services/purchase-orders.approval.ts`, `components/org-chart/hooks/orgRoles.ts`, `components/org-chart/hooks/orgReportingTypes.ts`, `components/org-chart/hooks/orgReportingLines.ts`, `components/org-chart/hooks/orgReportingL1L3Data.ts`, `components/org-chart/hooks/orgReportingL4Data.ts`, `components/org-chart/hooks/useOrgTreeLayout.ts`, `components/org-chart/types.ts`, `components/org-chart/matrix/OrgMatrixView.tsx`, `components/org-chart/matrix/OrgMatrixCard.tsx`, `components/org-chart/matrix/OrgMatrixSwimlane.tsx`, `components/employees/modals/AddEmployeeWizard.tsx`, `components/employees/wizard/StepDetails.tsx`, `components/org-chart/drawer/EmployeeDetailDrawer.tsx`, `components/org-chart/OrgChartContainer.tsx`, `components/OrgChart.tsx`, `pages/Employees.tsx`, `services/employees.service.ts`, `migrations/20261022_employee_reporting_relationships.sql`, `components/org-chart/matrix/OrgMatrixGuide.tsx`, `components/org-chart/matrix/OrgMatrixKPIs.tsx`, `components/org-chart/matrix/orgMatrixIcons.tsx`, `components/org-chart/controls/OrgChartToolbar.tsx`, `hooks/useEmployeeWizard.ts`, `utils/stagingQuickLogin.ts`, `components/login/CountryQuickLoginPanel.tsx`, `components/login/KenyanQuickLogin.tsx`.
- Atomic Pack handoff (2026-10-27): assigned-verifier RPC completes Pack and creates one unassigned dispatch in a single transaction; Pack History can recover older completed jobs whose client-side handoff failed. Direct floor-worker dispatch INSERT remains denied. Staging rollback tests cover active completion and reported-job recovery.
### Purchase Order Creation, Pricing & Governance Harmonization (2026-10-22)
- Fixed PO list header projections (`priority, incoterms, temp_req, shelf_life, dock_slot, destination`) and added on-demand `getById` hydration in `CreatePOModal` so editing a PO from the list never wipes out `po_items` or metadata; preserved original `poNumber`, `date`, `status`, `siteId`, and `createdBy` on edit and restricted inbound dock assignment on unapproved POs.
- Fixed Supplier Catalog ("Add to Order") and Merchandising AI Forecast ("Create PO") entry points via dedicated `initialProduct` and `initialDraft` props so prefilled orders do not overwrite saved PO drafts or force one-off vendor mode.
- Restored the multi-warehouse quantity allocation selector (`Full Qty Per Hub` vs `Split Across Hubs`), split freight cost evenly in split mode, and reflected multi-hub totals accurately in `POTotalsSummary` and `CreatePOFooter`.
- Unified `computeCostPerSellUnit` across `SellingAttributes`, `ItemPreviewCard`, and `POItemOrderDetails`, scaled catalog per-unit cost to case/pack order cost, enforced whole-number pricing/cost/totals globally (no decimal points for African currencies), simplified the Beverage Category option from `'100% Pure Fruit Juice'` to `'Juice'`, prevented sequential SKU collisions across custom items in the same PO, merged duplicate catalog line items, and added an unsaved item form guard.
- Scoped `CreatePOModal` warehouses, suppliers, and deduplicated catalog products by active country and regional scope; enforced `regionalAutonomousPoLimit` (`requiresHqApproval = true`) and aligned `private.procurement_supplier_scope`, `private.guard_procurement_supplier_write`, and `private.procurement_site_scope` with `public.normalize_role()`.
- **Files**: `components/procurement/CreatePOModal.tsx`, `components/procurement/hooks/useCreatePOData.ts`, `components/procurement/createPOHelpers.ts`, `components/procurement/POSupplierLogistics.tsx`, `components/procurement/POItemForm.tsx`, `components/procurement/POItemOrderDetails.tsx`, `components/procurement/CatalogSearch.tsx`, `components/procurement/SellingAttributes.tsx`, `components/procurement/ItemPreviewCard.tsx`, `components/procurement/BuyingAttributes.tsx`, `components/procurement/CategorySpecificAttributes.tsx`, `components/procurement/DynamicPhysicalAttributesSection.tsx`, `components/procurement/DynamicStorageHandlingSection.tsx`, `components/procurement/POItemsTable.tsx`, `components/procurement/POTotalsSummary.tsx`, `components/procurement/CreatePOFooter.tsx`, `components/procurement/PurchaseOrdersList.tsx`, `components/procurement/SupplierManagement.tsx`, `pages/Procurement.tsx`, `components/merchandising/ForecastTab.tsx`, `services/purchase-orders.read.ts`, `services/purchase-orders.service.ts`, `services/suppliers.service.ts`, `migrations/20261022_align_po_creation_supplier_and_role_scope.sql`, `tests/utils/poCreationFlowFixes.test.ts`.
- **Database**: Applied `20261022_align_po_creation_supplier_and_role_scope.sql` to both linked Supabase projects (`supabase-staging` and `supabase-mcp-server`).
- Pack recovery lookup (2026-10-27): main Pack screen accepts a completed job number for scoped, authorized dispatch-handoff recovery without requiring History navigation.
### POS Effective Price History and Cart Revalidation (2026-10-21)
- POS records each effective selling-price change with the previous/current price, product snapshot, site/country, timestamp, and authenticated actor. Site-scoped RLS protects history; review receipts are stored per authenticated cashier.
- Catalog updates that change a cart line surface the old and current prices. Checkout stays blocked until the cashier explicitly applies the current price.
- The terminal header opens a paginated, responsive history view; review acknowledgements persist across terminals for that cashier.
- Files: `components/pos/hooks/usePOSPriceHistory.ts`, `components/pos/modals/PriceUpdatesModal.tsx`, `components/pos/POSCartPanel.tsx`, `services/product-price-history.service.ts`, `migrations/20261021_product_price_history.sql`, `tests/components/pos/utils/priceUpdates.test.ts`.
- Database: `product_price_history`, `product_price_history_reviews`, effective-price trigger functions, scoped RLS policies, and `count_unreviewed_product_price_history` on the linked SIIFMART project.
- Personal job history (2026-10-27): restrictive database reads limit floor staff to their own completed jobs; scoped manager history remains available. On-demand queries filter completed_by and discard stale history across account/site/country changes. Staging SQL and hook regressions pass.
### Sales History Reliability and Return Handoff (2026-10-21)
- Sales list rows include item counts and customer names without loading full line-item details.
- Search supports receipt, cashier, customer, and exact sale ID online and offline; stale fetches cannot replace newer filters.
- Offline fallback remains constrained to the authorized country and site, and CSV export quotes fields and neutralizes spreadsheet formulas.
- The return action opens the POS return flow with the receipt reference prefilled; refund authorization remains in POS.
- Files: `pages/SalesHistory.tsx`, `pages/POSTerminal.tsx`, `pages/sales-history/components/SalesToolbar.tsx`, `pages/sales-history/components/SalesDetailModal.tsx`, `pages/sales-history/utils/salesCsv.ts`, `services/sales.service.ts`, `types/sales.ts`.
- Blind POS receiving (2026-10-27): pending cards hide expected counts; destination Store/Dark Store reads use scoped redacted manifests before arrival. Existing arrival scrubbing protects counting; one authorized receiver owns the verified count and receipt, including variances. Applied to staging with API/RLS/arrival/recount rollback checks.
### HQ and Regional Merchandising Proposals (2026-10-21)
- Added Merchandising Specialist and Regional Merchandising Manager to the role hierarchy and administration assignment flow.
- Scoped product, price, planogram, and campaign preparation to assigned countries or regions. Merchandising leads approve product and price proposals; Finance independently signs off below-floor prices.
- Approval RPCs apply product proposals atomically. Campaign approvals record a plan; POS discount activation is a separate workflow.
- Staging includes one HQ specialist, one regional specialist, and one regional merchandising lead in each country for quick-login testing; these fixtures are excluded from production.
- Files: `components/merchandising/`, `hooks/useSubmitMerchandisingChanges.ts`, `services/merchandising-campaigns.service.ts`, `services/inventory-requests.service.ts`, `migrations/20261021_merchandising_*.sql`.
- WMS-only receipt sync (2026-10-27): POS receiving skips transfers-table synchronization when no persisted transfer exists. Actual transfer RPC failures propagate without a fallback PATCH; confirmed WMS receipts are not mistaken for missing transfer records.
### Warehouse and DC Online Operations (2026-10-22)
- Online sales are an operating channel of existing active warehouses and distribution centers. Removed the standalone Online Store/Dark Store facility option, quick-login category, employee directory filter, retail routing, regional counts, and site-code generation.
- Legacy site IDs are closed and hidden from operational site reads; their staff, inventory, shift, and replenishment references are retained for history. A database trigger blocks creation or reopening of that facility type.
- `/online-store` is an authenticated staff desk for entering delivery orders and reviewing each warehouse or DC queue in Ethiopia or Kenya. Facility changes clear the order draft, and query caches include the user, country, and facility. Payment remains unpaid until collected; tax and delivery charges require manual confirmation.
- Order intake now identifies incomplete customer, delivery, or item details beside Save and displays any RPC rejection at the same point; the button only locks while a save is in progress. This replaces a silent disabled button when required fields were missing.
- Warehouse leadership accepts an entered order through an authenticated database transition that checks available stock, reserves it, and creates a linked WMS PICK job atomically. Existing PICK → PACK → DISPATCH handles fulfillment. A completed online PICK debits stock, records its movement, and releases the reservation. Driver shipment details use the scoped address and phone.
- Staging Quick Login already includes warehouse manager, picker, packer, dispatcher, and driver workers in both countries.
- **Files**: `pages/OnlineStoreManagement.tsx`, `services/online-store.service.ts`, `components/fulfillment/useJobCompletion.ts`, `components/OutboundJobModal.tsx`, `migrations/20261021_warehouse_online_fulfillment.sql`, `migrations/20261021_internal_online_order_intake.sql`, `tests/security/warehouse-online-fulfillment.sql`.
- **Database**: `20261022_retire_online_store_sites.sql`, `20261022_online_operations_fulfillment_foundation.sql`, and `20261022_online_operations_warehouse_dc.sql` are applied to staging (`utykzifrblpyxlvlknsm`) and production (`zdgzpxvorwinugjufkvb`). Guest checkout RPC privileges are revoked. Both public endpoints are closed. After explicit user approval, production `storefront-api` version 2 was deployed with JWT verification and the staff-only 410 handler; an unauthenticated public request returned 401.
- Blind receipt summary correction (2026-10-27): summaries show confirmed physical quantities without treating hidden expected quantities as zero. Receipt variance status comes from server verification, not the redacted client manifest.
### Regional Administration & Corporate HQ Role Access Harmonization (2026-10-20)
- Unblocked all regional roles (`regional_manager`, `regional_procurement_lead`, `regional_finance_officer`, `regional_hr_officer`, `regional_logistics_lead`, `regional_security_supervisor`) across route guards, sidebar navigation, global Cmd+K search, and settings tabs regardless of whether their active facility is an Administration hub, Warehouse, or Store.
- Fixed dynamic `scopeLevel` (`'HQ' | 'REGIONAL'`) and regional boundary resolution for shared general roles (`accountant`, `buyer`, `hr`, `hr_generalist`, `talent_recruiter`, `payroll_specialist`, `training_coordinator`, `it_support`, `auditor`, `store_operations_auditor`, `treasury_officer`, `tax_compliance_officer`, `credit_control_officer`, `demand_planner`, `replenishment_planner`, `vendor_relations_manager`, `customs_import_specialist`, `inbound_qc_inspector`, `regional_supply_chain_manager`, `inventory_manager`, `regional_security_manager`, `merchandiser`, `data_analyst`, `cs_manager`). When assigned to National HQ they operate country-wide (`scopeLevel = 'HQ'`); when assigned to Regional Administration or a regional facility they automatically lock to their region (`scopeLevel = 'REGIONAL'`, `canSwitchRegion = false`).
- Unified Corporate HQ Directorate role aliases (`head_of_*`, `*_head`, `*_manager`, and `country_managing_director`) across RBAC, sidebar, governance approvals, and staff profile guards, and enabled regional functional leads and managers to hire, fast-track, and approve territorial teams within their regional boundary.
- **Files**: `components/ProtectedRoute.tsx`, `components/Sidebar.tsx`, `utils/roleSegregation.ts`, `utils/userCountry.ts`, `contexts/hooks/useCountryScoping.ts`, `utils/permissions.ts`, `services/permissions.matrix.ts`, `services/auth.rbac.ts`, `services/auth.service.ts`, `utils/roles.ts`, `utils/employeeGovernance.ts`, `utils/employeeOnboardingGovernance.ts`, `hooks/useEmployeeWizard.ts`, `hooks/useEmployeeActions.ts`, `components/employees/wizard/StepIdentity.tsx`, `components/staff-profile/tabs/SettingsTab.tsx`, `components/topbar/RegionBadge.tsx`, `components/topbar/LocationBadge.tsx`, `pages/Settings.tsx`, `pages/Procurement.tsx`.
- POS stock row simplification (2026-10-27): product/SKU, price, stock and Details/label actions replace repeated attributes, timestamps and attribution columns. Detailed information remains in Product Details; low/out-of-stock labels remain visible.
### Pet Supplies Category Decommissioning (2026-10-20)
- Removed 'Pet Supplies' and its subcategories ('Dog Food & Accessories', 'Cat Food & Accessories', 'Small Pet Supplies') from catalog categories, SKU generation prefixes, procurement specification groups, packaging configurations, and POS classification utilities.
- Any unmapped or legacy references gracefully fall back to 'general_merchandise'.
- **Files**: `constants/categories.ts`, `components/procurement/categoryAttributes.ts`, `components/procurement/categorySpecGroups.ts`, `components/procurement/categoryPackaging.ts`, `utils/skuGenerator.ts`, `components/pos/utils/posUtils.ts`, `components/pos/hooks/usePOSProductFilters.ts`, `tests/utils/categoryAttributes.test.ts`, `tests/services/categoryAttributesPO.test.ts`.
- Product details readability (2026-10-27): restrained product overview with price/stock and explicit sale-readiness text; specifications, pricing, locations, stock policies/activity and description expand on demand. Existing cost access rules and product actions remain intact.
### Procurement Administration Support Scope (2026-10-20)
- Buyers and vendor support at HQ prepare supplier and purchase records within their country. Regional Administration staff work within their assigned region and can read country-shared suppliers but edit only region-assigned suppliers.
- Supplier creation now persists before the form closes. New suppliers remain pending independent lead verification; a purchase order cannot be approved against an unverified supplier. Procurement leads retain purchase order decision rights.
- **Database**: Four procurement migrations applied to SIIFMART Staging and linked production: `20261020_procurement_administration_scope.sql`, `20261020_procurement_supplier_region_and_verification.sql`, `20261020_require_verified_supplier_for_po_approval.sql`, and `20261020_supplier_creator_separation.sql`.
- **Files**: `services/suppliers.service.ts`, `hooks/useSupplierMutations.ts`, procurement screens, and role permissions.
- Product detail completeness (2026-10-28): restored stock valuation, expanded packaging/storage/tracking and all category specifications in readable sections; cost-based valuation stays permission-restricted and negative margins remain visible.
### Executive Governance & Role Hierarchy Anti-Tamper Hardening (2026-10-20)
- Fixed sovereign role classification flaw where Country Managing Director (`admin`, Level 98) was misclassified as a sovereign CEO (`isSovereignCEO`). Sovereign universal override authority is strictly restricted to Global CEO (`group_ceo` / `ceo`, Level 100).
- Subordinate roles (including Country MD and HR) can no longer adjust, propose compensation changes for, or directly edit the Global CEO's profile or salary.
- Self-compensation adjustments and self-promotions are blocked across the board under zero-trust anti-fraud policy.
- Subordinate roles cannot adjust compensation, edit sensitive profile fields, or approve change requests for employees of equal or superior hierarchy rank.
- Enforced 4-eyes separation of duties across salary requests and employee profile change requests: requesters cannot approve their own submissions.
- **Files**: `utils/employeeGovernance.ts`, `components/StaffProfileView.tsx`, `components/staff-profile/tabs/SettingsTab.tsx`, `components/staff-profile/modals/AdjustSalaryModal.tsx`, `components/staff-profile/tabs/settings/GovernanceApprovalBadge.tsx`, `components/employees/SalaryApprovalQueueModal.tsx`, `components/employees/modals/EmployeeChangeApprovalModal.tsx`, `components/employees/recruitment/CandidateApprovalModal.tsx`, `services/salary-requests.service.ts`, `services/employee-changes.service.ts`, `services/recruitment.service.ts`, `utils/employeeOnboardingGovernance.ts`, `tests/services/employeeGovernance.test.ts`.
- Human location identity (2026-10-28): Product Details and Pack use Zone/Aisle/Bay identities instead of numeric location-label payloads; genuine product barcodes remain separate and label encoding/printing is unchanged.
### HR Administration Support Scope (2026-10-20)
- HR Generalist is available as an HQ or regional Administration staff role. Generalists can review employee cases and submit scoped profile change requests; HR leads retain approval and disciplinary decisions. Existing recruiting, training, and payroll support profiles use the same country or region boundary.
- HR directory and case reads are scoped through the assigned Administration office. Requisition insertion no longer has an unscoped bypass. Payroll specialists can prepare scoped runs, while HR certification, finance approval, and disbursement require the corresponding lead role.
- Training coordinators can save territorial training records, and recruiters can save territorial candidates. Candidate HR and Finance approvals are restricted to their respective leads; the recruitment service reports failed server saves instead of claiming a local success.
- **Files**: `migrations/20261020_hr_administration_directory_scope.sql`, `migrations/20261020_hr_generalist_and_record_boundaries.sql`, `migrations/20261020_hr_generalist_case_preparation.sql`, `migrations/20261020_allow_hr_generalist_employee_role.sql`, `migrations/20261020_hr_training_recruitment_support.sql`, role catalog/access and recruitment files, `tests/security/hr-administration-scope.sql`.
- **Database**: Five migrations applied to SIIFMART Staging and production; rollback boundary regression passed on Staging.
- Modal width correction (2026-10-28): removed conflicting max-w-full so selected panel widths apply. Browser regression verifies Product Details at 672px maximum desktop width and within a 390px mobile viewport.
### Finance Administration Support Scope (2026-10-20)
- Accountants and treasury officers assigned to HQ Administration can work with site-based finance records across their country; when assigned to a regional Administration office, their scope follows that region. Existing site staff retain site scope. Regional finance leads use their existing regional boundary.
- Finance policies distinguish read, preparation, reconciliation, approval, and period close. Support staff can prepare pending invoices, expenses, and unposted journals and reconcile tender records. Budget approvals, period changes, posted journals, credit decisions, and payment-run creation stay with designated leads. Country-only customer credit data remains HQ scoped for accountants.
- Expense and payment-run policies now enforce country and site/region boundaries. Finance AP and budget screens show records from the database-authorized area, and tender reconciliation requires an explicit authorized site.
- **Database**: All five finance migrations applied to SIIFMART Staging and the linked production project. The rollback-only regional/HQ RLS regression passed on Staging.
- **Files**: `migrations/20261020_finance_administration_support_scope.sql`, `migrations/20261020_finance_records_least_privilege.sql`, `migrations/20261020_finance_payment_run_lead_creation.sql`, `migrations/20261020_finance_journal_preparation_boundary.sql`, `migrations/20261020_finance_support_site_directory.sql`, `components/financials/AccountsPayableTab.tsx`, `components/financials/BudgetTab.tsx`, `components/financials/TenderReconciliationModal.tsx`, `services/permissions.matrix.ts`, `tests/security/finance-administration-scope.sql`
- Product detail logic (2026-10-28): retains every loaded lot/bin with country boundaries and explicit partial-history labels; on-hand stock, missing locations and sale blockers are distinct. Stock-policy forms reject inverted min/max limits before save/request.
### Warehouse Zero-Trust Governance & RBAC Harmonization (2026-10-20)
- All warehouse positions (`packer`, `receiver`, `forklift_operator`, `stock_clerk`, `returns_clerk`, `inbound_qc_inspector`, `dispatch_supervisor`, `regional_supply_chain_manager`, `fleet_maintenance_supervisor`, `replenishment_planner`) are now registered under the `warehouse` Zero-Trust managed role profile in `services/zeroTrustPolicies.service.ts` and counted in `RoleSettings.tsx`.
- `returns_clerk` is registered in `FLOOR_WORKER_ROLES` to allow assignment and execution of reverse logistics tasks without rejection.
- Packing local safeguards now propagate item-save failures, defer local success until persistence, lock repeated scanner/completion submissions, restrict catalog lookup to the job facility, and remove copying estimated weight into physical readings. Atomic packing migration remains unapplied due to approval-review usage limit; see `docs/audits/20261024-packing.md`. Static SoD picking/packing permission conflicts are reconciled to rely on transaction-level 4-eyes attestation guards (`guard_pack_completion_attestation`), eliminating false-positive audit log alarms while preserving dual-control pack verification.
- `receiver` is granted `procurement.receive` in `ACTION_PERMISSIONS` and `PERMISSIONS.RECEIVE_PO` for direct dock PO intake.
- `stock_clerk` is aligned in `auth.rbac.ts` to include `'warehouse'` in `ROLE_PERMISSIONS`.
- **Files**: `services/zeroTrustPolicies.service.ts`, `components/settings/RoleSettings.tsx`, `utils/fulfillmentRoles.ts`, `utils/fulfillmentTabPermissions.ts`, `services/permissions.service.ts`, `services/permissions.matrix.ts`, `utils/permissions.ts`, `services/auth.rbac.ts`
### Warehouse Worker Sovereign Role Landing Routes (2026-10-20)
- Warehouse workers now route directly to their sovereign operational tab upon login (e.g. receivers land on `/wms-ops?tab=RECEIVE`, pickers on `?tab=PICK`, packers on `?tab=PACK`, forklift operators on `?tab=PUTAWAY`, drivers on `?tab=DRIVER`, and dispatchers on `?tab=DOCKS`). `pages/Fulfillment.tsx` and `components/ProtectedRoute.tsx` synchronize and preserve role tabs cleanly without redirect loops.
- **Files**: `utils/roleDashboard.ts`, `pages/Fulfillment.tsx`, `components/ProtectedRoute.tsx`, `utils/fulfillmentTabPermissions.ts`, `tests/utils/roleDashboard.test.ts`, `tests/utils/regionalOperations.test.ts`
### Workforce Job Titles and App Login Separation (2026-10-20)
- Employee job titles can now be entered and edited independently from the system access profile. Onboarding can create an active workforce record without creating app credentials; password policy checks and temporary-password storage apply only when app login is enabled. The existing `employees.job_title` column supports this change, so no database migration was needed.
- **Files**: `components/employees/wizard/StepIdentity.tsx`, `components/employees/wizard/StepRole.tsx`, `components/employees/wizard/StepDetails.tsx`, `components/employees/wizard/StepReview.tsx`, `components/staff-profile/tabs/SettingsTab.tsx`, `components/staff-profile/tabs/settings/ProfileRoleDeptCard.tsx`, `hooks/useEmployeeWizard.ts`
### Notification Accuracy (2026-10-20)
- Shared popup cards retain the source severity and message without guessing diagnoses or recovery advice. Notification history stays in memory within the current user/site/country session; old device-wide history is removed. The activity badge counts unread events and pending tasks, and history is labeled Recent events.
- Cached POS stock estimates no longer generate stock warnings. Queued sales are distinguished from server saves; failed PO writes no longer appear as successful local orders. Site-load errors do not guess a network cause, and refresh requests no longer announce unconfirmed completion.
- Local expense/payroll, promotion, discount-code, and hold-state changes no longer announce an unconfirmed save or payment. Stock adjustment for an unknown product cannot report success.
- **Files**: `components/notifications/NotificationCard.tsx`, `contexts/hooks/useNotificationState.ts`, `components/TopBar.tsx`, `components/topbar/ActivityCenter.tsx`, `contexts/hooks/useSaleActions.ts`, `contexts/hooks/usePOActions.ts`, `contexts/hooks/useDataInitialization.ts`, `contexts/DataContext.tsx`
### Transfer Discrepancy Handling (2026-10-19)
- POS and warehouse transfer receipts now keep damaged units out of saleable stock and putaway, while retaining the recorded count and condition for follow-up. POS sends line-level variance details to the linked WMS/transfer records. Warehouse transfer details expose resolution for quantity and damage-condition variances; the resolution flow no longer adds nonexistent shortage units to stock and now exposes claim submission with role-gated actions.
- **Files**: `components/pos-command/hooks/usePOSReceiving.ts`, `components/pos-command/hooks/utils/receivingIntake.ts`, `components/fulfillment/transfer/TransferReceiving.tsx`, `components/fulfillment/transfer/TransferLineItemRow.tsx`, `components/fulfillment/DiscrepancyResolutionModal.tsx`
- **Database**: `discrepancy_resolutions` and `discrepancy_claims` have site-scoped authenticated policies restored after tenant hardening removed the former global policies. Higher-impact resolution actions and claim writes are role-gated in both UI and RLS.
### Store Drop Safe Ledger & Cash Skim Custody (2026-10-19)
- Zero-Trust mid-day cash safe drops and drop safe ledger tracking (SOP-POS-002, SOP-FIN-012). Stores surplus cash in sealed tamper-evident deposit bags, synchronizes in real time with Supabase `pos_cash_drops` via websockets, handles multi-bag armored transport transit handshakes with manifest tracking, provides instant manual refresh, and records tamper-proof audit trails in `system_logs`.
- **Files**: `components/pos-command/modals/SafeLedgerModal.tsx`, `services/cash-drops.service.ts`, `components/pos/modals/CashDropModal.tsx`, `tests/services/posZeroTrust.test.ts`
- **Database**: `pos_cash_drops` with RLS policies `pos_cash_drops_insert`, `pos_cash_drops_read`, `pos_cash_drops_update`.
- **Root Cause Fixed**: Enhanced with explicit column projection (Rule 10), sovereign country code normalization (`country_code.toUpperCase()`), robust numeric handling for PostgreSQL `numeric` types, real-time live channel subscription, and tamper-proof audit logging upon armored transit release.
### Transfer Receipt Stock Intake Fix (2026-10-19)
  - Store transfer receipt no longer halts with "Inventory intake failed" (403 / RLS 42501 on products). The destination product is now looked up from the database (branch users have an empty global product cache, so receipt wrongly tried to INSERT products that already existed). Genuinely missing products are created at zero stock by a guarded server function, then stock is added.
  - Files: components/pos-command/hooks/utils/receivingIntake.ts, components/pos-command/hooks/usePOSReceiving.ts, services/products/products-transfer-receipt.ts, services/products.service.ts, tests/services/receivingIntake.test.ts
  - Database: RPC `ensure_transfer_receipt_product` (manager at destination, SKU on open transfer, same country, audit in system_logs); `products_update` RLS no longer reads `auth.users`; `products.pos_received_at/by` columns restored. Migrations: 20261019_transfer_receipt_destination_product_stub, 20261019_fix_products_update_rls_auth_users, 20261019_restore_products_pos_received_columns
  - Follow-up: accepting the verified transfer failed with `42883 jsonb -> bigint` in trigger `private.guard_transfer_receipt_verification` (bigint WITH ORDINALITY index); fixed by migration 20261019_fix_transfer_receipt_guard_jsonb_index_cast.
  - Root Cause: stale-cache product lookup, plus `products_update` RLS referencing `auth.users` (permission denied for every non-CEO update) and receiving writes to columns missing from the live schema
### Reliable Staff Shift Scheduling & Roster Management (2026-10-19)
- Staff shift scheduling in `RosterManager` guarantees synchronized UUID assignment between client cache and Supabase `staff_schedules`. Fixes staff reassignment updates to persist `employee_id` and `employee_name`, adds national boundary scoping (`country_code`), enforces shift start/end validation (`startTime < endTime`), introduces submit loading state with double-click prevention, and adds deletion confirmation.
- **Files**: `components/RosterManager.tsx`, `contexts/RosterContext.tsx`, `services/schedules.service.ts`, `tests/services/schedules.service.test.ts`
- **Database**: `staff_schedules` with RLS policies `staff_schedules_insert_scoped`, `staff_schedules_update_scoped`, `staff_schedules_delete_scoped`.
- **Root Cause Fixed**: Client generated an ephemeral UUID while Supabase generated a different database UUID, causing immediate edit/delete calls to fail on the wrong ID. Also, `schedulesService.update` omitted employee fields, preventing reassignment.
- Local staging and production now use separate persisted Supabase Auth sessions even though both reach the API through `/supabase-proxy`. Roster queries wait for a restored user and cache by user, site, and country; the weekly planner also waits for a user and scopes its cache by user.

### Blind Store Transfer Receipt Accountability (2026-10-19)
- An authorized receiver enters one blind physical count, accepts the quantities and condition, and takes custody in one receipt flow. POS transfer receipt uses the same count RPC before completing a WMS job and restores the saved count when resuming after a partial failure. A product missing at the destination must be created by an authorized catalog user; a failed or RLS-blocked create cannot be mistaken for successful stock intake. Variances are recorded without requiring a second employee or driver co-signature. Public WMS and transport rows strip expected and delivered quantities after arrival; the count RPC compares against a private arrival manifest and binds the accepted count and receiver identity.
- **Files**: `components/fulfillment/transfer/TransferReceiving.tsx`, `components/fulfillment/transfer/CustodyHandshakeModal.tsx`, `components/pos-command/hooks/usePOSReceiving.ts`, `components/pos-command/hooks/utils/receivingIntake.ts`, `components/pos-command/hooks/utils/verifyPOSTransferReceipt.ts`, `hooks/useTransferReceiptVerification.ts`, `services/transfer-receipt-verification.service.ts`, `migrations/20261019_independent_transfer_receipt_recount.sql`, `migrations/20261019_transfer_receipt_measure_units.sql`, `migrations/20261019_guard_transfer_receipt_condition_attestation.sql`, `migrations/20261019_private_transfer_receipt_manifest.sql`, `migrations/20261019_single_receiver_transfer_accountability.sql`, `migrations/20261019_fix_transfer_receipt_verification_jsonb_index_cast.sql`
- **Database**: `transfer_receipt_verifications` and `private.transfer_receipt_manifests`; direct table access is revoked and RPCs validate employee role/site scope.
- **Root Cause Fixed**: The previous variance path required multiple employees and a driver sign-off. Receipt now records one authorized employee's blind count and accountability while preserving the private server-side variance check.

### Persisted Blind WMS Counts, Independent Pack Checks, and Safe Scan Handoffs (2026-10-19)
- Count sessions and blind expected quantities are stored behind authenticated, site-scoped database functions. Sessions resume after refresh; variance recounts require another authenticated employee and final adjustments remain pending HQ approval. Receive split counts start empty in blind mode, pick requires an explicit quantity, pack quantities start empty, and required seal serials are checked by Postgres before completion. Production PICK completion can now create its PACK job using the same idempotent RPC already present in staging.
- **Files**: `components/fulfillment/CountTab.tsx`, `components/fulfillment/count/CountOperations.tsx`, `components/fulfillment/count/CountHeader.tsx`, `components/fulfillment/receive/ReceiveSplitModal.tsx`, `components/fulfillment/pick/PickScanner.tsx`, `components/fulfillment/pack/`, `services/wms-counts.service.ts`, `services/wms-jobs.service.ts`, `services/wms-jobs.mapper.ts`, `utils/fulfillmentTabPermissions.ts`, `utils/receivingPolicy.ts`, `services/config.service.ts`, `migrations/20261019_secure_persisted_wms_counts.sql`, `migrations/20261019_fix_wms_count_response_states.sql`, `migrations/20261019_prioritize_uncounted_wms_products.sql`, `migrations/20261019_guard_wms_count_session_actions.sql`, `migrations/20261019_guard_pack_completion_attestation.sql`, `migrations/20261019_restore_pack_handoff_on_production.sql`
- **Database**: Count records are function-only for authenticated clients. PACK completion requires every line quantity to match and, where enabled, a seal serial. Variances create pending `inventory_requests`; the count workflow never writes stock directly.
- **Root Cause**: Count state was local-only, the second-counter modal accepted public employee codes, several scanners copied expected quantities, obsolete `standard` receiving settings were treated as verified, and production lacked the PICK→PACK RPC.

### Outbound Dispatch and Destination Receipt Handoff (2026-10-19)
- Outbound dispatch assigns a source-site driver or named external carrier, reserves a dock, and records the release before a driver can log arrival. Arrival captures delivered quantities and a reason for shortages without accepting the destination receipt or changing inventory. The destination receiver inspects the arrived transfer and confirms receipt; Postgres synchronizes the linked transport record. Partial receipts keep the inbound dock occupied until acceptance. The scanner looks up an authorized mission and does not bypass dispatch.
- **Files**: `components/fulfillment/DocksTab.tsx`, `components/fulfillment/docks/`, `components/fulfillment/drivers/`, `components/fulfillment/transfer/TransferReceiving.tsx`, `hooks/useShipmentWorkflow.ts`, `hooks/useInboundDockAssignment.ts`, `services/wms-jobs.service.ts`, `utils/shipmentWorkflow.ts`, `utils/fulfillmentTabPermissions.ts`, `migrations/20261019_fix_dispatch_receiving_handoffs.sql`, `migrations/20261019_guard_transfer_receipt_after_arrival.sql`, `migrations/20261019_align_transfer_transport_record_status.sql`, `migrations/20261019_merge_wms_dispatch_policies.sql`
- **Database**: All four migrations applied to SIIFMART Staging and production. Production trigger, private-function grants, and RLS policy definitions verified; the rollback-only handoff regression passed on Staging.

### Live Staging Quick Login (2026-10-19)
- Desktop and mobile Quick Login now load all active staging test employees, including the 168 added role-coverage accounts, with live counts and search by role, employee or facility. Removed the obsolete fixed roster and frontend passwords. A loopback-only Vite bridge keeps the staging executive credential in ignored server configuration; a JWT-protected staging-only function verifies executive authority and returns the selected test employee's session using a one-time token. Country/site permissions remain those of the selected employee. Credential handover fields are unchanged.
- **Files**: `components/LoginPage.tsx`, `components/login/`, `hooks/useStagingQuickLogin.ts`, `services/staging-quick-login.service.ts`, `utils/stagingQuickLogin.ts`, `dev/stagingQuickLoginPlugin.ts`, `dev/stagingQuickLoginPolicy.ts`, `supabase/functions/staging-quick-login/`, `docs/STAGING_QUICK_LOGIN.md`, related service/component/policy tests and `tests/e2e/staging-quick-login.spec.ts`
- **Deployment**: `staging-quick-login` deployed to SIIFMART Staging only, with JWT verification enabled. Private local credentials are excluded from Git and the client bundle.
- Local Quick Login presents representative facilities, explicitly including Piassa Heritage Supermarket (`ET-ADD-STR-02`) and CMC Summit Supermarket (`ET-ADD-STR-03`) while excluding Bishoftu (`ET-ADA-STR-02`), and deduplicating roles at multi-staff sites. The underlying staging sites and employees remain available for broader testing.

### Recoverable Employee Onboarding Drafts (2026-10-19)
- Shared HR, POS, and WMS onboarding now saves candidate progress automatically, flushes pending progress when the wizard closes or the page leaves, and provides a country-scoped saved-drafts drawer for resuming or deleting work. Drafts remain on the current device; candidate passwords are stripped when saving and cleared from legacy drafts on read, so they must be entered again after resuming.
- **Files**: `hooks/useEmployeeWizard.ts`, `hooks/useEmployeeDrafts.ts`, `utils/employeeDrafts.ts`, `components/employees/modals/AddEmployeeWizard.tsx`, `components/employees/OnboardTalentModal.tsx`, `components/employees/wizard/EmployeeDraftsDrawer.tsx`
- **Database**: None

### Staging Operational Role Coverage (2026-10-19)
- Filled 168 missing employee slots in staging across four warehouses, four distribution centers, twelve retail stores and four online/dark stores. Each WMS site has active coverage for 17 operational roles; each POS site has coverage for 12. Existing employees satisfy coverage and remain unchanged. Added employees are labelled `[TEST]`, use country-scoped employee codes and linked Auth/profile records, and have unique random password hashes, empty wallets in the site's currency, no invented salary/identity facts and pending credential handover. A staging migration-history guard prevents these fictitious records from being seeded into main.
- **Files**: `migrations/20261019_staging_complete_site_role_coverage.sql`, `migrations/20261019_staging_fixture_quota_cleanup.sql`, `tests/security/staging-site-role-coverage.sql`
- **Database**: Applied to SIIFMART Staging only, as explicitly selected by the user.

### Supervised Fulfillment Points and Mobile Startup (2026-10-19)
- Supervisor points awards save totals and their audit in one invoker RPC, with employee/site checks, completed-job attribution, duplicate-job protection, and stale-total rejection. Audit policies now match existing manager scope. The verified missing audit for PACK VYUU9L was recovered without changing its 95-point balance. Warehouse mobile startup uses role permissions while the site is loading, including redirects from stale POS URLs.
- **Files**: `services/gamification.service.ts`, `contexts/GamificationContext.tsx`, `utils/roleDashboard.ts`, `components/ProtectedRoute.tsx`, `migrations/20261019_fix_supervised_points_awards.sql`, `migrations/20261019_reconcile_pack_points_audit.sql`, `tests/security/`, `tests/services/gamification.service.test.ts`, `tests/components/ProtectedRoute.test.tsx`, `tests/utils/roleDashboard.test.ts`
- **Database**: Points migrations applied to staging and main; the main project also received the existing WMS recursion/log actor migration already present in staging.

### Floor-Friendly PACK Scanner (2026-10-19)
- The bottom action in PACK job details starts the full-screen scanner after the job is moved to In-Progress, matching the PICK modal-to-scanner handoff. The job modal closes while scanning and returns to its item step when the scanner closes or all lines are verified, ready for carton and label steps. Item scanning is only available in the full-screen scanner; the item list has no duplicate camera button or barcode input, and scan progress is resumed from the bottom action. Other steps use the shared bottom action for navigation and completion. Product identity and required quantities are large and glanceable, the scanner fits without vertical scrolling, scans must match a line in the job, and only the exact required quantity can be confirmed.
- **Files**: `components/fulfillment/pack/PackJobModal.tsx`, `components/fulfillment/pack/PackScanner.tsx`, `components/fulfillment/pack/PackScannerStatusView.tsx`, `components/fulfillment/pack/components/PackJobFooter.tsx`, `components/fulfillment/pack/components/PackJobItemCard.tsx`, `components/fulfillment/pack/steps/Step1PackDetails.tsx`, `components/fulfillment/pack/steps/Step1PackItems.tsx`, `components/fulfillment/pack/steps/Step2BoxPrep.tsx`, `components/fulfillment/pack/steps/Step3WeighSeal.tsx`, `components/fulfillment/pack/steps/Step4PrintFinish.tsx`, `components/fulfillment/pack/components/PackModalsContainer.tsx`, `utils/packScanValidation.ts`, `tests/utils/packScanValidation.test.ts`, `playwright.config.ts`, `tests/e2e/pack-scanner.spec.ts`, `tests/e2e/pack-flow-harness.html`, `tests/e2e/pack-flow-harness.tsx`
- **Database**: None

### PACK Shipping Label Output (2026-10-19)
- Standard pack printing produces a fixed-height 4 × 6 shipping label for one carton, independent of carton size. The label includes packed item names, SKUs, and picked quantities while keeping destination, handling, job reference, and tracking codes visible on the same page. Reprints retain supported media sizes; the unsupported tiny size maps to the compact layout. Removed the item-row action because it generated a misleading shipping label for one SKU. Text is escaped and missing origin addresses are left blank rather than fabricated.
- **Files**: `components/fulfillment/pack/hooks/usePackLabelPrint.ts`, `components/fulfillment/pack/steps/Step4PrintFinish.tsx`, `components/fulfillment/pack/components/PackJobItemCard.tsx`, `components/fulfillment/pack/PackJobModal.tsx`, `components/fulfillment/pack/steps/Step1PackItems.tsx`, `components/fulfillment/pack/components/PackModalsContainer.tsx`, `components/fulfillment/pack/PackDetailsModal.tsx`, `utils/labels/PackLabelGenerator.ts`, `utils/labels/packShippingLabelTemplate.ts`, `tests/utils/packLabelGenerator.test.ts`, `tests/e2e/pack-label-output.spec.ts`
- **Database**: None

### Secure PICK-to-PACK Handoff (2026-10-19)
- Completing a PICK creates its PACK through an idempotent database function that verifies the authenticated employee, active WMS role, completed-by identity, and country/site scope. The resulting PACK is unassigned for an independent worker. Database guards enforce one floor stage per employee for each order within its country (receiving, putaway, picking, packing, count, replenishment, waste and returns); manual/automatic assignment uses server eligibility. Order identity and assignment attribution are retained. Failed handoffs state that PICK persisted and are caught by the scanner handler.
- **Files**: `migrations/20261019_create_pack_after_completed_pick.sql`, `services/wms-jobs.service.ts`, `components/fulfillment/useJobCompletion.ts`, `components/fulfillment/PickTab.tsx`, `tests/services/wmsJobsZeroTrust.test.ts`
- **Database**: Applied to Staging (`utykzifrblpyxlvlknsm`)
- **Root Cause**: The client attempted a direct insert into `wms_jobs` after persisting the completed PICK; RLS rejected the follow-up job and the scanner handler left an unhandled rejection.

### SKU-Identity Product Labels and Country-Scoped Worker IDs (2026-10-19)
- Product label barcodes and human-readable codes now use the product SKU consistently across label preview, batch printing, shelf tags, and inbound putaway labels. Catalog barcodes remain available as scan aliases, not as the printed product identity.
- Employee code allocation uses an atomic country-specific database sequence so RLS-filtered site lists and concurrent hires cannot issue IDs from a stale local maximum.
- **Files**: `components/LabelPrintModal.tsx`, `components/fulfillment/ReceiveTab.tsx`, `components/fulfillment/assign/AssignLabelHub.tsx`, `services/employees.service.ts`, `hooks/useEmployeeWizard.ts`, `utils/labels/ProductLabelGenerator.ts`, `utils/labels/InboundPutawayLabelGenerator.ts`, `utils/labels/ShelfTagGenerator.ts`, `migrations/20261019_employee_id_sequence_allocator.sql`
- **Database**: Added private `public.employee_id_sequences` and authorized `reserve_next_employee_code(text)` RPC. Applied to production; staging remains unchanged.

### WMS Worker Sovereign Landing Page (2026-10-19)
- All WMS workers and operators now land directly on their primary working tab upon opening Fulfillment (Pickers -> Pick, Packers -> Pack, Drivers -> Driver, Forklift Operators -> Putaway, Receivers & QC -> Receive, Stock Clerks & Inventory Specialists -> Count, Replenishment Planners -> Replenish, Returns Clerks -> Returns, Dispatchers -> Assign, Warehouse Managers -> Docks) instead of defaulting to Receive.
- Synced the active operational tab with URL search parameters (`/wms-ops?tab=...`), preserving active state across reloads.
- Mobile segmented controls dynamically elevate the worker's main working tab into the primary 1-tap quick buttons, eliminating unnecessary menu navigation on mobile scanners.
- **Files**: `utils/fulfillmentTabPermissions.ts`, `pages/Fulfillment.tsx`, `components/fulfillment/FulfillmentContent.tsx`, `components/fulfillment/TabSelectors.tsx`, `tests/utils/fulfillmentTabPermissions.test.ts`
- **Database**: None

### Floor-Friendly Picking Scan Flow (2026-10-19)
- Scanner content now fits the handheld viewport without an internal vertical scroll; duplicate picked history and redundant quantity confirmation are removed. Product scans require an exact current-line SKU or barcode, and location scans require a valid app label code for the assigned bay. The app's location QR payload and official location URL remain accepted.
- **Files**: `components/fulfillment/pick/PickScanner.tsx`, `components/fulfillment/pick/steps/Step2PickCollect.tsx`, `components/fulfillment/pick/components/PickScannerHeader.tsx`, `components/fulfillment/pick/components/PickScannerInstructionPanel.tsx`, `components/fulfillment/pick/components/PickScannerForm.tsx`, `components/fulfillment/pick/components/PickScannerSubmitButton.tsx`, `components/fulfillment/pick/components/PickScannerSummary.tsx`, `utils/locationEncoder.ts`, `utils/pickScanValidation.ts`, `tests/utils/pickScanValidation.test.ts`
- **Database**: None

### Guided Pick Scanning (2026-10-19)
- The primary pick action now opens the scanner directly. The scanner keeps the current step and item progress visible, anchors scan controls for mobile use, and carries validated barcode scans through to the matching pick line. The alternate entry point is labeled as a guided scanner.
- **Files**: `components/fulfillment/pick/PickJobModal.tsx`, `components/fulfillment/pick/PickScanner.tsx`, `components/fulfillment/pick/steps/Step2PickCollect.tsx`, `components/fulfillment/pick/components/PickScannerHeader.tsx`, `components/fulfillment/pick/components/PickScannerForm.tsx`, `components/fulfillment/pick/components/PickScannerSubmitButton.tsx`
- **Root Cause**: The primary action stopped at a pick list, the scanner showed an incorrect step label, mobile controls scrolled out of view, and validated barcodes were passed to the parent in a format its lookup did not consistently accept.

### Fulfillment Role-Specific Tab Permissions (2026-10-19)
- Floor workers can access the shared Receive, Putaway, Pick, and Pack operations; only drivers receive the Driver tab. Inventory Specialists can prepare transfer drafts, while warehouse managers and explicitly authorized higher leadership roles approve them. Other specialist tabs remain limited to their authorized roles. WMS roles missing the Fulfillment sidebar or explicit route permission were added, and all route roles have a non-empty role-appropriate tab set. Fleet maintenance also gets read-only inventory access needed for its WMS duties. Fulfillment content checks the selected tab and returns to an allowed tab if the role changes.
- **Files**: `utils/fulfillmentTabPermissions.ts`, `components/fulfillment/FulfillmentContent.tsx`, `components/Sidebar.tsx`, `utils/permissions.ts`, `services/permissions.matrix.ts`
- **Root Cause**: Floor worker roles were spread across tabs without distinction by responsibility; some WMS titles lacked navigation or explicit route access; tab bodies rendered from selected state without an access check.

### Server-Verified POS Sales (2026-10-19)
- POS sales now use one trusted database transaction that recalculates line prices, tax, discounts, and cash change from database records. Authenticated browser inserts into `sales` and `sale_items` are denied, and financial sale fields cannot be edited after creation.
- **Files**: `services/sales.service.ts`, `contexts/hooks/useSaleActions.ts`, `hooks/usePosSync.ts`, `components/pos/hooks/usePOSCheckoutActions.ts`, `migrations/20261019_secure_pos_sale_authority.sql`
- **Database**: Applied to staging (`utykzifrblpyxlvlknsm`) and production (`zdgzpxvorwinugjufkvb`)
- **Root Cause**: The browser wrote sale totals and item prices directly, so a modified client could tamper with persisted transaction values.

### Fulfillment Auth-Ready Data Loading (2026-10-18)
- Fulfillment table reads and realtime subscriptions wait for a signed-in employee profile. Logout clears cached fulfillment items so the client does not issue anonymous requests or retain the prior user's view.
- **Files**: `components/fulfillment/FulfillmentDataProvider.tsx`
- **Root Cause**: The provider mounted globally and began loading after site selection, before Supabase Auth session restoration had populated the user profile.

### Notification Cards - Clearer Issue Guidance and Responsive Presentation (2026-10-18)
- Error notifications now recognize common account, permission, barcode, duplicate SKU, inventory, pricing, validation, missing-record, connection, and data-service signals. Guidance avoids claiming that unsaved work will sync or assuming a specific approval path.
- Notifications expose optional technical details on demand, use clearer status hierarchy, fit mobile safe areas, and honor reduced-motion preferences. Auto-dismiss pauses while the page is hidden.
- **Files**: `components/notifications/NotificationCard.tsx`, `components/notifications/NotificationContainer.tsx`
- **Root Cause**: Generic string heuristics offered unverified recovery promises, while optional diagnostic details were not visible and mobile placement/motion ignored device preferences.

### Mobile User Menu Refresh (2026-10-18)
- Expands the mobile account panel to a safe-area-aware, scrollable card with a clearer identity header, visible close control, larger touch targets, and more readable performance and job summaries. Desktop placement remains a compact anchored menu.
- **Files**: `components/topbar/UserMenu.tsx`
- **Database**: None

### Accurate Session Warning Messages (2026-10-19)
- MFA requirements now show a verification warning only when an enrolled factor requires step-up verification (`nextLevel === 'aal2'`), and `store_manager` no longer defaults to requiring MFA. Short-lived access tokens no longer trigger a misleading countdown because Supabase refreshes them automatically; only the app's inactivity sign-out warns users to save work.
- **Files**: `hooks/useSessionManager.ts`, `services/zeroTrustPolicies.service.ts`, `components/settings/RoleSettings.tsx`, `contexts/CentralStore.tsx`
- **Database**: None

### Store Bonus & Leaderboard Modernization (2026-10-19)
- Modernized StoreBonusDisplay and LeaderboardWidget using Apple Design System tokens (`var(--theme-bg-card)`, `var(--theme-border)`, `var(--theme-text-primary)`). Added active site fallback initialization so new branches display live tier progression (Starting/Bronze) rather than an unhelpful "Unavailable" error state. Added dedicated empty state to LeaderboardWidget and removed decorative UI emojis.
- **Files**: `components/StoreBonusDisplay.tsx`, `components/WorkerPointsDisplay.tsx`, `components/gamification/LeaderboardWidget.tsx`, `pages/POSCommand.tsx`, `tests/utils/storeGamification.test.ts`
- **Database**: None

### Mobile Web Deployment Recovery (2026-10-18)
- Prevents a stale service-worker or mobile browser asset cache from causing repeat reloads after a deployment. A chunk failure now clears only SIIFMART Workbox caches and retries once; HTML navigations no longer use an unversioned runtime cache.
- **Files**: `index.tsx`, `vite.config.ts`
- **Database**: None

### Mobile-Friendly Staff Profile (2026-10-18)
- Profile sections use a swipeable mobile tab strip, touch-sized controls, and a persistent mobile photo action. The self-profile page and overview use responsive spacing and semantic theme tokens.
- **Files**: `pages/Profile.tsx`, `components/StaffProfileView.tsx`, `components/staff-profile/StaffProfileHeader.tsx`, `components/staff-profile/StaffProfileNavigation.tsx`, `components/staff-profile/tabs/OverviewTab.tsx`, `hooks/useStaffProfile.ts`
- **Database**: None

### Fulfillment Mobile Active-Job Focus (2026-10-18)
- Receive, putaway, pick, and pack queues use denser mobile spacing and place in-progress work first. Receive keeps the active purchase order expanded while collapsing other order details; secondary mobile sort/count controls are reduced or hidden.
- **Files**: `components/fulfillment/FulfillmentContent.tsx`, `components/fulfillment/TabSelectors.tsx`, `components/fulfillment/ReceiveTab.tsx`, `components/fulfillment/receive/ReceiveList.tsx`, `components/fulfillment/PutawayTab.tsx`, `components/fulfillment/putaway/PutawayList.tsx`, `components/fulfillment/PickTab.tsx`, `components/fulfillment/pick/PickList.tsx`, `components/fulfillment/PickHeader.tsx`, `components/fulfillment/PackTab.tsx`, `components/fulfillment/pack/PackList.tsx`, `components/fulfillment/pack/PackHeader.tsx`, `components/fulfillment/putaway/PutawayHeader.tsx`
- **Database**: None

### Quick Login Visual Theming & Role Filter Chips
- **Status**: ✅ IMPLEMENTED (2026-10-20)
- Visual distinction by facility site types (Stores in Emerald, Warehouses in Amber, Distribution Centers in Cyan, Regional Admin in Violet, HQ in Purple) with matching site header accents and badges.
- Uniform role color theming across all sites (Cashiers in Emerald, Pickers in Orange, Packers in Amber, Receivers in Cyan, Drivers in Blue, Inventory in Yellow, Managers in Indigo, Finance in Teal, etc.).
- One-click popular role filter chips (`Cashier`, `Picker`, `Packer`, `WH Mgr`, `Store Mgr`, `Driver`, `Receiver`, `Inventory`, `Admin`) with live counts and active indicator lights.
- Search with instant clear ("X") button, active filter counters, and unified mobile & desktop experience.
- **Files Modified**:
  - `components/login/quickLoginTheme.ts`
  - `components/login/CountryQuickLoginPanel.tsx`
  - `components/login/KenyanQuickLogin.tsx`
  - `tests/components/quickLoginTheming.test.tsx`
  - `tests/components/KenyanQuickLogin.test.tsx`

### HR Payroll Attestation & Termination Submission Hardening (2026-10-18)
- Regional payroll attestation now derives signer identity and role from the authenticated employee record and enforces country/site-region scope in Postgres; termination requests no longer persist sensitive backups in browser storage and failed submissions surface as errors.
- **Files**: `services/payroll-runs.service.ts`, `services/terminations.service.ts`, `types/payroll-run.ts`, `pages/Employees.tsx`, `migrations/20261018_secure_regional_payroll_attestation.sql`
- **Root Cause**: Client-supplied signer fields and local fallback behavior could create false or unverifiable HR records.
- **Database**: `public.payroll_runs` regional attestation columns and `attest_payroll_regional_hr` RPC (migration not yet applied).

### Three-Level Facility Hierarchy & 55-Role Canonical Workforce Filtering
- **Status**: ✅ IMPLEMENTED (2026-10-18)
- Establishes 3 facility levels (`HQ`, `Regional Administration`, `Operation Sites` -> `Store`, `Warehouse`, `Distribution Center`) and all 55 canonical `SYSTEM_ROLES` per country (`ET` and `KE`) across Staging Database, Quick Login panels, and Employee Directory filtering.
- **Files Modified**:
  - `migrations/20261018_staging_three_tier_facilities_and_roles.sql`
  - `components/login/stagingAccounts.json`
  - `components/login/CountryQuickLoginPanel.tsx`
  - `utils/roleSegregation.ts`
  - `services/employees.service.ts`
  - `hooks/useEmployeeData.ts`
  - `components/employees/DirectoryHeader.tsx`
  - `components/employees/WorkforceScopeBadge.tsx`
  - `tests/utils/stagingAccounts.test.ts`
- **Database**: `public.sites`, `public.employees`, `public.users`, `auth.users`, `auth.identities`

### Fulfillment Module - Completed By Display
- **Status**: ✅ FIXED (2026-02-05)
- Shows who completed each job and when in all history tabs
- **Files Modified**:
  - `services/supabase.service.ts` - Added field mappings in `wmsJobsService.update`
  - `contexts/DataContext.tsx` - Fixed to use camelCase field names
  - `pages/Fulfillment.tsx` - UI displays completedBy and completedAt
  - `types.ts` - WMSJob interface includes completedBy/completedAt
- **Database**: `wms_jobs.completed_by`, `wms_jobs.completed_at`
- **Root Cause Fixed**: DataContext was passing snake_case fields (`completed_by`) to update function, but service only maps camelCase (`completedBy`)

### WMS Jobs Service
- **Field Mappings** (2026-02-05)
  - Maps snake_case DB fields to camelCase frontend fields
  - Includes: completedBy, completedAt, assignedTo, orderRef, etc.
  - File: `services/supabase.service.ts` (wmsJobsService)

### WMS RLS and Audit Actor Hardening (2026-10-19)
- Removed the recursive policy dependency between WMS jobs and job assignments using a private helper scoped to the authenticated actor; site and country checks remain on WMS job rows.
- Bound client-created system log actors to the verified auth user/employee ID before the insert policy runs.
- **Root Cause Fixed**: The WMS SELECT/UPDATE policies queried `job_assignments`, whose policies queried `wms_jobs`; the audit service supplied a display name where the RLS policy required an actor ID.
- **Database**: `wms_jobs`, `job_assignments`, `system_logs`; migration applied to SIIFMART Staging.
- **Regression Verification**: Authenticated WMS and assignment reads, update policy planning, and a rollback-only system log insert completed without recursion or RLS rejection.

### Fulfilment Transfer Units (2026-10-18)
- Clearance planner uses a bounded searchable catalog and server-owned whole-number stages from the complete country/site/product 30-day completed-sales aggregate; private cost checks allow preparers to plan without exposing cost or margins. Expiry/deadline checks, national calendar dates, a locked live-product snapshot and idempotent pending submission protect the workflow. Selected-price revenue/stock impact is separate from the staged scenario; a responsive stage table leads to one guarded price proposal under existing approvals, with no automatic schedule activation. Scope changes reset local state; pending checks fail closed, concurrent submissions lock, and failed saves remain retryable. A staging database guard serializes clearance requests against competing pending edits per country, site and product.
- Standardized transfer, bulk distribution, Smart Replenish, picking, and receiving quantity labels and precision against product unit and package attributes. Picking uses protected scan receipts and atomic, idempotent completion for exact-lot stock deduction, assignment/parent updates and PACK creation. Partial/zero shortages require reasons; all-short jobs create no PACK. Manual scan bypasses are removed; source country, bin and lot/expiry are rechecked, and online reservations remain protected. Mobile collection/scanning has one primary action and no quantity overflow.
- Kept measured quantities alongside stock-unit quantities through the WMS job line-item JSON and mapper; measured receipts convert back to inventory stock units before applying stock.
- **Root Cause Fixed**: Transfer allocation screens hardcoded generic integer units, inconsistent package-size conversion mixed stock counts with physical measures, and pick completion used package quantity as the measured-pick denominator.
- **Files Modified**: `components/fulfillment/transfer/`, `components/fulfillment/useJobCompletion.ts`, `services/wms-jobs.mapper.ts`, `types/product.ts`, `types/wms.ts`
- **Database**: No schema change; transfer unit details remain in `wms_jobs.line_items` JSON.
- **Regression Coverage**: `tests/utils/transferQuantity.test.ts`

### Sites Service - Allowlist Update Pattern
- **Status**: ✅ FIXED (2026-07-09)
- Rewrote `sitesService.update()` from dangerous `{ ...object }` spread + denylist to explicit allowlist
- **Root Cause Fixed**: camelCase-only fields (`bayCount`, `siteNumber`, `barcodePrefix`) were being sent to Supabase as unrecognized column names → 400 Bad Request
- **Also Fixed**: `zoneCount`, `aisleCount`, `binCount` were silently dropped (deleted but never mapped to snake_case)
- **Files Modified**: `services/sites.service.ts`
- **Pattern**: All service update methods should follow this allowlist pattern (see RULES.md "Service Field Mapping")

### Gamification System - Premium Aesthetic Redesign
- **Status**: Historical (2026-07-09); verify current implementation
- Earlier redesign note. Its palette is superseded by the current semantic-token and accessibility standards in `docs/APPLE_DESIGN_GUIDE.md`.
- **Files Modified**: `WarehouseTab.tsx`, `POSTab.tsx`, `POSRoleDistributionList.tsx`, `POSPointRulesList.tsx`
---
## How to Use This Registry

### For AI Assistants:
1. **Before modifying a feature**: Check this registry for history, then verify current code and policy
2. **After implementing a feature**: Add an entry with date, description, and affected files
3. **Before reverting/restoring code**: Check if the file contains registered features
4. **After fixing a significant bug**: Document the root cause and fix pattern

### Entry Format:
```markdown
- **Feature Name** (YYYY-MM-DD)
  - Description of what it does
  - Files: list of affected files
  - Database: any DB columns/tables involved
  - Root Cause: (for bug fixes) what caused the issue
```

### Site Product Suggestions and PO Preparation Roles (2026-10-23)
- Added a site-scoped product suggestion queue for operational employees to report unmet customer or operational demand without supplier or cost details; Procurement/category reviewers can send suitable suggestions to sourcing, decline them, or mark duplicates. Suggestions do not create catalog products or POs.
- Allowed demand and replenishment planners to prepare scoped draft POs; approval remains a separate, maker-checker controlled action.
- Removed required price estimates from stock requests so requesters provide item and quantity while Procurement fills sourcing and price during PO preparation.
- Files: pages/PurchaseRequests.tsx, types/productSuggestion.ts, services/product-suggestions.service.ts, hooks/useProductSuggestions.ts, types/purchaseRequisition.ts, utils/permissions.ts, services/permissions.matrix.ts, components/ProtectedRoute.tsx, migrations/20261023_product_suggestions_and_po_preparer_roles.sql.

### Regional department support staging accounts (2026-10-23)
- Two additional support employees per existing regional administration department, with country/region scope and department manager reporting links.
- Auth identities use random server-side passwords and existing local staging one-time-token quick login.
- Regional quick login lists every office; other facility types retain representative-site selection.
- Migration: `migrations/20261023_seed_regional_department_support.sql` (staging only).

### Global Group CEO assignment correction (2026-10-23)
- Group CEO has no country facility or region assignment; database constraint prevents reassignment to country facilities.
- Country employee directory uses the same explicit facility filter for ET and KE, excluding unassigned global leadership.
- Migration: `migrations/20261023_correct_group_ceo_global_assignment.sql`.

### Procurement receiving facility selection (2026-10-23)
- New orders default only to the signed-in employee’s eligible receiving hub; HQ and regional staff choose their destination explicitly.
- Saved and existing orders never fall back silently to the first warehouse when their destination is unavailable.
- Staging quick login includes every warehouse and distribution center so receiving teams can access the selected facility.

### Procurement assignment boundaries (2026-10-23)
- Order lists, receiving destinations, and catalog fallback use employee-assigned regional/site scope and deny missing assignments.
- Database procurement guards prevent regional or site staff from accessing orders beyond their assignment; regional supplier access requires the matching region.
- Policy persisted in `rules/02-country-and-operations.md`; migration `migrations/20261023_enforce_procurement_assignment_boundaries.sql` (staging).

### Receiving hub region heading (2026-10-23)
- Procurement receiving dropdown identifies the worker’s assigned region rather than the country HQ label. National/global views derive the visible hubs’ regions; missing names use region codes.

### Device appearance following (2026-10-23)
- Appearance defaults to the device setting and follows live light/dark changes. Login, header and user menu provide explicit device/light/dark choices.
- Legacy theme toggles no longer pin users permanently to an old manual choice; explicit new preferences persist with matching first-paint initialization.

### Profile appearance control (2026-10-23)
- User menu appearance uses labeled Device/Light/Dark buttons with a visible selected state, keyboard focus, and consistent theme tokens. Changing appearance keeps the menu open.

### Profile dropdown refinement (2026-10-23)
- Compact identity summary, expandable activity/achievements, consistent preference groups and pinned sign-out action with responsive sizing. Country controls appear only for authorized executives.
- Close control is available on desktop and mobile; Escape closes the dropdown and returns focus to its trigger.

### Purchase request workspace (2026-10-23)
- Separate stock/suggestion views, clearer forms and item quantities, assigned-workspace context, next-step guidance, and searchable status-filtered history.
- Review notes remain separate per request; receiving options stay within the requester’s assigned region and active facilities.

### Responsive top bar priorities (2026-10-23)
- Header adapts to measured available width, including sidebar changes. Compact views retain navigation, search, notifications and profile, with workplace/region controls in an overflow panel.
- Long profile names and secondary appearance/search controls yield space before overlap; appearance and refresh remain available in the profile menu.
### PO attribute consistency and pricing handoff (2026-10-23)
- Live delivery checks align order temperature and minimum remaining days with item storage and total product shelf life; conflicting temperature groups require separate orders.
- New product handling requirements require confirmation, packaging counts require entry, and unbranded identity is explicit. Category preview suggestions are labeled and advanced catalog specifications are read only.
- Procurement no longer requires retail pricing; catalog snapshots retain approved prices/specifications. Inventory Stock Reviews excludes new-product approvals and merchandising proposals, preserves stock requests/history and existing product edits, and removes synthetic product decisions. Catalog readiness remains separate from physical stock; stock lists show missing selling prices instead of obsolete product-review badges. Stock browsing uses readable mobile cards, explicit bin/facility labels, touch-sized actions, clearer search/filter controls and a scoped results heading. Bulk distribution adds source-scoped selection, same-country destinations, a per-product allocation summary and submission progress controls. Store destinations are explicitly selected per product, start unchecked, support search/select-shown/clear, discard quantities on deselection, and require positive quantities before submission. Multi-product distribution uses a compact product-by-store matrix, batch product selection, shared store columns, zero-to-exclude cells and collapsed review details. Transfer approvals atomically create or reuse one PICK per transfer; database duplicate protection covers legacy creation paths, and unused reported duplicates are cancelled with an audit record. Task assignment uses a compact searchable queue, eligible-first team list, keyboard-selectable job rows, explicit assignment actions and a collapsed workload overview.
- Migration: `migrations/20261023_po_item_delivery_and_pricing_integrity.sql` (SIIFMART Staging).
### PO form responsive layout (2026-10-23)
- Mobile PO editor uses the available screen height, safe-area footer spacing, and independently scrolling content.
- Total and action buttons stack on narrow screens; physical attributes use readable mobile columns, and supplier cards no longer stretch to match logistics.
### Procurement validation guidance (2026-10-23)
- Failed order/item validation lists specific missing fields, links to them, opens collapsed details, and focuses the first issue.
### HQ finance PO approvals (2026-10-23)
- Finance has a country-scoped, paginated PO Approvals queue using current regional limits and clearance terms, with on-demand inspection and audited clearance; draft/pending POs expose authorized clearance action while final procurement approval remains separate.
### Sidebar outside dismissal (2026-10-23)
- Navigation closes on outside mouse/touch/pen interaction at all screen sizes, while internal interactions and the menu toggle retain their behavior.
### PO receiving manifest handoff (2026-10-23)
- Receiving loads authoritative PO item details on request instead of treating summary-only orders as empty; read errors offer retry.
- PO inspection names the receiving facility and workflow, with receiving navigation only for authorized staff at that destination.
- Fulfillment forwards loaded warehouse zones into its operational context; label rendering tolerates missing zones during facility loading and enables configured bay labels when they arrive. Label printing now requires a unique facility-scoped product match, bounds copies to 1–1000 integers, serializes print requests, preserves previews on errors, resets on facility changes, and requires configured local zones for bay labels. Print notifications describe dialog handoff rather than physical output. Receiving scans preserve blind counts without exposing remaining PO quantities, restrict barcode lookup to the receiving facility, open ordered/partial receipts, and initialize blind counts empty. Receipt saves have duplicate-submit guards; incoming lots no longer overwrite existing-stock batch/expiry, and partial-save failures no longer claim nothing was recorded. Putaway now preserves committed placements when completion fails, supports retrying recorded short placements, validates exact item identifiers and decimal counts, resets scans per line, prefers source lots, and removes automatic cross-site catalog creation on page load. Priority/date sorting uses actual priority and creation timestamps. Driver summaries deduplicate loaded missions and describe loaded data rather than unverified shift totals. Driver history is origin-facility scoped; incident saves require an active local manager and a persisted task confirmation. Arrival submissions are locked and preserve physical-count drafts during background updates. Dock planning uses one inbound list with optional bay assignment and one Dispatch queue with loading, transport and release controls; blind receiving stays in Receive. Inbound history is facility-scoped and uses receipt status rather than approval as arrival evidence. Dock mutations reject overlapping saves, distinguish persisted actions from refresh errors, and use 44px mobile controls.
- Fulfillment assignment reads use paginated active-job IDs without the WMS join; assignment failures no longer discard the loaded operational queues.
- Receiving modals use one bottom progression/save action per step, readable step labels, valid counts for every retained split, and unsaved review wording.
- Receiving printing separates counted quantity from copy count, preserves lot/expiry and condition, marks draft labels unsaved, respects price-tag policy, and retains failed reprints for retry.
- Receiving print preview renders actual generated label HTML; fixed thermal page sizes prevent growing labels and trailing blank pages.
- Receipt confirmation reloads authoritative PO lines, resolves the exact line ID, checks destination/status, and throws on failed validation so unsaved counts remain open.
- Receiving creates only zero-stock site placeholders and links existing visible masters; it does not attempt national catalog registration or bypass master-data RLS. Manifest totals count each putaway job once (duplicate client-state jobs no longer double the received units); floor roles can create/read internal site jobs and placeholders under RLS.
- Mobile Putaway cards open the job modal before start/resume, matching desktop and supporting keyboard activation. Putaway uses one bottom scan/completion action; routing is review-only, step labels have readable fallbacks, and stale items/invalid quantities are rejected before stock posting.
- Putaway mobile layouts wrap long job/product references, stack footer actions, reserve bottom safe-area space, and constrain scanner content to the viewport.
- Putaway posts stock through a job-authorized atomic server operation, retaining general product-edit restrictions and preventing duplicate placement retries. Assignment scope checks use an indexed private lookup; automatic completion awards are server-calculated and deduplicated, while manual awards remain supervisor-only. Live site-only Putaway routing consolidates matching lots, ranks category/storage alternatives, excludes unavailable zones and worker-reported full bins, and preserves physical bin scans. Final PO receipt reconciliation uses assigned completed Putaway jobs and stock audit evidence; blind workers receive status only, and partial deliveries cannot be closed as fully received; planogram integrity fixes strictly scoped.
- Regional product approval inbox: scoped departmental counts in the header and landing pages, grouped shelf revisions, focused review links and live refresh; see `docs/regional-product-approval-inbox.md`.
