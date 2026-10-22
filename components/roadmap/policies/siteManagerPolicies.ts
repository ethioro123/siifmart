import { KnowledgeEntry } from '../RoadmapTypes';

export const SITE_MANAGER_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-store-manager-sop-026',
    title: 'Store Manager Retail Governance, Shift Balancing & Zero-Trust Accountability Policy (SOP-MGT-026)',
    description: 'Codifies the retail operational mandate of the Store Manager (Level 3, Rank 80): Single-facility scope, POS Command oversight, dual-sign shift reconciliation, blind receiving custody, and the Captain Owns the Ship doctrine.',
    department: 'stores',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Store Manager',
      'Retail Operations',
      'POS Command',
      'Shift Balancing',
      'Blind Receiving',
      'Cash Drops',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-026
ROLE: STORE MANAGER (LEVEL 3 — HIERARCHY RANK 80, MATRIX RANK 30)
REPORTS TO: HEAD OF OPERATIONS (LEVEL 2, RANK 90)
SUPERVISES: ASSISTANT MANAGERS, SHIFT LEADS, CASHIERS & STORE CLERKS
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 4, Rule 6, Rule 15, Rule 16, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Store Manager operates at Level 3 (Site Leadership) with Hierarchy Rank 80 and Matrix Rank 30, reporting directly to the Head of Operations.
    - Serves as the primary operational and fiscal custodian of an individual retail store facility. Holds on-the-ground operational command over cashier lines, customer service, shelf merchandising, blind inbound receiving, cash vaults, and shift reconciliations.
1.2 Core Mission:
    - Enforce flawless daily retail store execution; maintain retail shrinkage <= 0.50%; ensure 100% daily drawer-to-safe cash balancing; guarantee blind receiving integrity; uphold non-alcoholic/halal catalog purity; and enforce Zero-Trust loss prevention standards under the "Captain Owns the Ship" doctrine.

2. WHAT THE STORE MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Store Operational Suite & POS Command Access:
    - Full supervisory access to the retail operational modules within their assigned store facility:
      * POS Terminal & POS Command (/pos, /pos-dashboard)
      * Shift Reconciliation & Drawer Management (/pos-dashboard -> Shifts)
      * Sales History & Customer Ledger (/sales, /customers)
      * Single-Site Store Inventory & Shelf Replenishment (/inventory)
      * Local Store Employee Rosters & Attendance (/employees)
2.2 Shift Balancing & Safe Drop Governance (SOP-POS-002 & SOP-FIN-012):
    - Supervise shift opening float verification, mid-day cash safe drops, and end-of-day (EOD) Z-Report drawer reconciliations.
    - Perform the mandatory manager dual-sign closure on cashier shifts, verifying reported cash, Telebirr/CBE Birr (ET), or M-Pesa (KE) digital tenders.
2.3 Supervisory POS Overrides & 4-Eyes Counter Approvals:
    - Authorize high-risk register exceptions using authenticated Manager PIN, capturing manager ID, GPS, and structured reason codes:
      * Customer returns and exchanges with original receipt scan.
      * Line-item or cart transaction voids exceeding cashier threshold.
      * Unknown barcode resolution and temporary shelf price verification (SOP-POS-005).
      * No-sale cash drawer kicks for change balancing or cash inspection.
2.4 Blind Inbound Receiving & Transfer Inspection (SOP-WMS-003 & Rule 4):
    - Supervise store dock receiving of goods transfers from central Distribution Centers or regional warehouses.
    - Enforce blind count verification (system expected quantities hidden from receiving floor clerks).
    - Sign the Digital Dual-Handshake manifest alongside the delivery driver upon completion of inspection (Rule 16).
2.5 Floor Workforce Management & Task Allocation (Rule 15):
    - Direct store floor workers across operational tasks: cashiering, shelf restocking, zone organization, and customer checkout queue management.
    - Reassign floor workers dynamically to relieve bottlenecked checkout lanes or restock fast-moving grocery essentials.
2.6 Facility Security & Physical Vault Custody:
    - Keyholder authority for facility opening, closing, perimeter alarm activation, and physical drop safe combination management.

3. WHAT THE STORE MANAGER CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 No Cross-Site or Cross-Border Access (Rule 1, Rule 6 & Rule 7):
    - STRICTLY PROHIBITED from accessing inventory, sales telemetry, employee rosters, or financial performance of other retail branches or central warehouses (isMultiSiteRole = false).
    - Strictly locked to the single assigned retail site (siteId = user.siteId). Zero access to foreign country tenants or multi-country switches.
3.2 No Unilateral Inventory Ledger Adjustments or Shrinkage Write-Offs:
    - CANNOT unilaterally write off damaged, expired, or missing stock in the database.
    - All inventory adjustments must be submitted as an inventory_request with attached photos and reason codes for Central HQ / Head of Operations review and approval.
3.3 No Price Tampering or Custom Discount Creation:
    - CANNOT alter base retail shelf prices, modify system tax/VAT configurations, or create ad-hoc promotional discounts. All retail pricing is centrally deployed by Merchandising & HQ Finance.
3.4 No Supplier Cost or Central Margin Visibility:
    - STRICTLY RESTRICTED from viewing upstream landed supplier costs, factory purchase rates, or enterprise margin formulas (canViewCostPrice = false).
3.5 Delivery Mission Assignment Lockout (Rule 15):
    - STRICTLY PROHIBITED from assigning retail store floor staff (cashiers, stock clerks, customer service) to external vehicle delivery or dispatch missions.
3.6 Zero Local Shift Retention:
    - STRICTLY PROHIBITED from storing shift reconciliation data, cash counts, or transactions in browser localStorage. All shift states must sync live to Supabase.

4. WHAT THE STORE MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 Retail Store Shrinkage Ceiling:
    - Accountable for maintaining net retail inventory shrinkage <= 0.50% of monthly store sales turnover.
    - Shrinkage exceeding 0.75% triggers an immediate formal audit by the Security & Loss Prevention Manager and Regional Operations Manager.
4.2 Shift Cash Variance & Reconciliation Integrity:
    - 100% daily drawer balancing across all physical cash registers and digital payment terminals.
    - Under the Captain Owns the Ship doctrine, any cash drawer variance exceeding 50 ETB / 50 KSh is co-attributed to the on-duty Store Manager who co-signed the shift closure.
4.3 Supervisory Override Velocity Ceiling (< 3.0%):
    - Accountable for monitoring and minimizing cashier transaction overrides, voids, and returns.
    - Branch override velocity must remain strictly below 3.0% of total transaction volume. Override velocity exceeding 3.0% triggers automated Central HQ fraud telemetry alerts.
4.4 Chain of Custody & Receiving Accountability (Rule 16):
    - "You inspect before you accept. The moment you accept, you own it."
    - The Store Manager is directly accountable for any receiving discrepancies discovered after signing the transfer manifest. Shortages or damages not recorded on the manifest upon driver handover are billed to the store's variance ledger.
4.5 Halal Catalog & Non-Alcoholic Purity Guarantee (Rule 17):
    - Absolute guarantee that zero alcoholic beverages (beer, wine, liquor) or non-halal items are stocked, merchandised, or sold at the store.
4.6 Daily EOD HQ Z-Report Synchronization:
    - Ensure all active cashier registers are closed, balanced, reconciled, and synced to Central HQ before evening facility lockup.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Cryptographic & GPS Footprint:
    - Every supervisory approval, shift co-sign, safe drop, and override captures authenticated manager ID, role, client timestamp, site ID, and device GPS coordinates into system_logs.
5.2 Disciplinary Matrix:
    - Tier 1 (Override Velocity > 3% or Repeated Cash Variances): Mandatory retraining and HQ operational counseling.
    - Tier 2 (Unexplained Shrinkage > 0.75% or Unverified Safe Drops): Formal written reprimand, loss of quarterly store performance bonus, and comprehensive loss prevention audit.
    - Tier 3 (Price Manipulation, Falsified Counts, or Collusion): Immediate suspension, revocation of POS credentials, and referral to Legal/Internal Affairs.
================================================================================`
  },
  {
    id: 'policy-warehouse-manager-sop-027',
    title: 'Warehouse Manager Fulfillment Governance, Dock Oversight & Inventory Custody Policy (SOP-MGT-027)',
    description: 'Codifies the warehouse operational charter of the Warehouse Manager (Level 3, Rank 80): WMS operations, blind PO receiving, FEFO putaway/picking, transfer staging, floor worker interchangeability, and dock security.',
    department: 'warehouses',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Warehouse Manager',
      'WMS Fulfillment',
      'Blind Receiving',
      'FEFO Allocation',
      'Cross-Functional Labor',
      'Transfer Staging',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-027
ROLE: WAREHOUSE MANAGER (LEVEL 3 — HIERARCHY RANK 80, MATRIX RANK 31)
REPORTS TO: HEAD OF OPERATIONS (LEVEL 2, RANK 90)
SUPERVISES: RECEIVERS, PICKERS, PACKERS, FORKLIFT OPERATORS & INVENTORY SPECIALISTS
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 4, Rule 6, Rule 15, Rule 16, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Warehouse Manager operates at Level 3 (Site Leadership) with Hierarchy Rank 80 and Matrix Rank 31, reporting directly to the Head of Operations.
    - Exercises complete on-site operational command over warehouse fulfillment centers and distribution hubs (DCs), governing inbound receiving, inventory storage, FEFO putaway, outbound order picking, pack staging, and inter-facility transfer dispatch.
1.2 Core Mission:
    - Maintain warehouse inventory accuracy >= 99.0%; enforce blind receiving protocols; ensure strict FEFO rotation to eliminate expired stock; protect goods in custody; enforce floor worker interchangeability; and lock down external vehicle delivery boundaries.

2. WHAT THE WAREHOUSE MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 WMS Suite & Fulfillment Command Access:
    - Full supervisory control over warehouse operations modules within their assigned facility:
      * WMS Dashboard & Operational Telemetry (/wms-dashboard)
      * Fulfillment Task Management (/wms-ops -> RECEIVE, PUTAWAY, PICK, PACK, DOCKS, REPLENISH, COUNT, WASTE, RETURNS, ASSIGN, LABELS)
      * Single-Site Warehouse Stock & Bin Zones (/inventory, /inventory -> Zones)
      * Purchase Order Inbound Receiving View (/procurement -> ViewPOModal)
2.2 Inbound Vendor PO Receiving & Inspection (SOP-WMS-003 & Rule 4):
    - Direct receiving dock operations, verifying supplier deliveries against PO packing slips via blind counting (system expected quantities hidden).
    - Approve Return-to-Warehouse and vendor discrepancy memos (approvalRole = 'warehouse_manager') when short-deliveries or defective pallets arrive.
2.3 Outbound Transfer Staging & Digital Dual-Handshake Manifests (Rule 16):
    - Supervise order staging and loading for store replenishment transfer trailers.
    - Issue digital transfer manifests and co-sign the Chain of Custody handover alongside verified dispatch drivers.
2.4 Floor Worker Labor Allocation & Interchangeability (Rule 15):
    - Dynamically cross-assign floor personnel across all warehouse floor jobs: RECEIVE, PUTAWAY, PICK, PACK, REPLENISH, COUNT, WASTE, RETURNS, and LABELS.
    - Deploy drivers to perform internal floor jobs during loading lulls.
2.5 Bin Architecture & Reorder Threshold Governance:
    - Configure warehouse storage zones, pallet racking allocations, and cold-chain storage parameters (canEditThresholds = true).
    - Authorize internal replenishment moves from bulk reserve to active pick faces.

3. WHAT THE WAREHOUSE MANAGER CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 No Single-Party Stock Adjustments or Shrinkage Write-Offs (Rule 1):
    - CANNOT unilaterally write off damaged, stolen, or expired warehouse inventory.
    - Any discrepancy exceeding tolerance must route through inventory_requests for Head of Operations / Central HQ sign-off.
3.2 Single-Facility Lockdown & Zero Supplier Cost Tampering:
    - Strictly confined to their assigned warehouse facility (siteId = user.siteId). Cannot view or alter other warehouses or retail store balances.
    - Cannot modify supplier contracted prices, vendor invoices, or payment terms.
3.3 Floor Worker Delivery Lockdown Violation Prohibited (Rule 15):
    - STRICTLY PROHIBITED from dispatching or assigning warehouse floor workers (pickers, packers, receivers, forklift operators) to external delivery or transit missions. External delivery is exclusively reserved for verified drivers.
3.4 No Overriding Blind Receiving Guards:
    - STRICTLY PROHIBITED from displaying expected PO quantities to receiving dock workers or bypass barcode scanning mandates.

4. WHAT THE WAREHOUSE MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 Warehouse Inventory Shrinkage & Loss Ceiling:
    - Accountable for maintaining net warehouse inventory shrinkage <= 0.20% of facility inventory throughput.
4.2 Blind Receiving Accuracy & Vendor Discrepancy Capture:
    - Ensure 100% of inbound PO shipments undergo blind barcode verification. Shortages not caught at the receiving dock become warehouse liability.
4.3 Outbound Order Fulfillment Accuracy (>= 99.5%):
    - Maintain packing and shipping accuracy >= 99.5% with zero wrong-SKU transfer errors.
4.4 FEFO Compliance & Cold-Chain Monitoring:
    - Enforce strict First-Expired, First-Out picking for all date-sensitive consumables (infant formula, cooking oil, dairy, fresh meat). Maintain continuous temperature logs for chill/freeze zones.
4.5 Halal Integrity Guarantee (Rule 17):
    - 100% halal catalog compliance. Zero storage, cross-docking, or staging of alcoholic beverages or non-halal goods.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Cryptographic Event Logging:
    - Every dock sign-off, pick amend, return authorization, and task assignment logs authenticated manager ID, site ID, timestamp, and device GPS.
5.2 Disciplinary Matrix:
    - Tier 1 (Picking Errors > 0.5% or Cold-Chain Log Lapses): Operational review and supervisor retraining.
    - Tier 2 (Shrinkage > 0.20% or Unrecorded Transfer Shortages): Formal reprimand, deduction from warehouse accuracy bonus, and loss prevention audit.
    - Tier 3 (Theft Collusion, Rubber-Stamping PO Receipts, or Delivery Lockdown Breach): Immediate termination and legal referral.
================================================================================`
  },
  {
    id: 'policy-logistics-manager-sop-028',
    title: 'Logistics Manager Transport Governance, Fleet Oversight & Chain of Custody Policy (SOP-MGT-028)',
    description: 'Codifies the transport operational charter of the Logistics Manager (Level 3, Rank 80): Fleet dispatch, driver routing, inter-site transit corridors, cold-chain in-transit telemetry, and strict Delivery Lockdown enforcement.',
    department: 'logistics',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Logistics Manager',
      'Fleet Operations',
      'Driver Dispatch',
      'Delivery Lockdown',
      'Chain of Custody',
      'Transit Security',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-028
ROLE: LOGISTICS MANAGER (LEVEL 3 — HIERARCHY RANK 80, MATRIX RANK 32)
REPORTS TO: HEAD OF SUPPLY CHAIN (LEVEL 2, RANK 82) / HEAD OF OPERATIONS
SUPERVISES: DISPATCH MANAGERS, FLEET CONTROLLERS, ROUTE PLANNERS & DRIVERS
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 6, Rule 15, Rule 16, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Logistics Manager operates at Level 3 (Site/Corridor Leadership) with Hierarchy Rank 80 and Matrix Rank 32, reporting to the Head of Supply Chain.
    - Governs inter-facility transport logistics, distribution fleet operations, driver route scheduling, vehicle maintenance, and in-transit cargo security across all national supply corridors.
1.2 Core Mission:
    - Guarantee safe, on-time, and zero-shrinkage transit of enterprise goods between central distribution centers and retail store branches; enforce strict Delivery Lockdown (Rule 15); and execute the Digital Dual-Handshake Chain of Custody (Rule 16).

2. WHAT THE LOGISTICS MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Logistics Command Suite & Fleet Operations:
    - Full supervisory access to fulfillment and dispatch modules:
      * Fleet Dispatch & Driver Job Board (/wms-ops -> DRIVER, DOCKS, ASSIGN)
      * Cross-Dock & Transfer Manifest Tracking (/wms-ops -> TRANSFER)
      * Route Scheduling, Vehicle Tracking & Fleet Telemetry
2.2 Driver Assignment & Delivery Mission Authority (Rule 15):
    - Assign verified, licensed company drivers and dedicated vehicles to delivery routes and inter-site transfer missions.
    - Authorize drivers to assist with internal warehouse floor tasks (loading, unloading, putaway) during staging intervals.
2.3 Chain of Custody Dual-Sign Governance (Rule 16):
    - Enforce the Digital Dual-Handshake protocol for every transfer trip. Ensure driver digital signatures are captured at departure from the DC and at arrival at the receiving retail store.
    - Require co-signatures on any transit discrepancy reports prior to releasing drivers from duty.
2.4 In-Transit Cold-Chain & Cargo Security Oversight:
    - Monitor real-time vehicle GPS coordinates, route geofencing, and refrigerated trailer temperature logs for perishable commodities (dairy, poultry, fresh meat).
2.5 Fleet Maintenance & Fuel Consumption Auditing:
    - Authorize vehicle preventative maintenance schedules, fuel card allocations, and vehicle inspection checklists.

3. WHAT THE LOGISTICS MANAGER CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 Delivery Lockdown Breach Strictly Prohibited (Rule 15):
    - STRICTLY PROHIBITED from assigning floor workers (pickers, packers, receivers, inventory clerks) to vehicle delivery missions. Delivery jobs are locked exclusively to verified drivers.
3.2 No Unauthorized Cross-Border Vehicle Movement:
    - Cannot route domestic fleet vehicles across national borders (ET <-> KE) without corporate customs manifests and Super Admin authorization.
3.3 No Unilateral In-Transit Cargo Loss Write-Offs (Rule 1):
    - CANNOT write off stolen, damaged, or lost in-transit inventory without formal investigation, police report (if theft), and Central HQ approval.
3.4 No Alteration of Store Pricing or Cash Vaults:
    - Zero access to retail pricing, store cash drawers, or POS terminal configurations.

4. WHAT THE LOGISTICS MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 In-Transit Shrinkage & Loss Ceiling:
    - Accountable for maintaining in-transit cargo shrinkage and damage <= 0.10% of total goods transported value.
4.2 On-Time In-Full Delivery (OTIF >= 95.0%):
    - Maintain network on-time delivery rate >= 95.0% across all store replenishment runs.
4.3 Chain of Custody Discrepancy Accountability (Rule 16):
    - Under the "You inspect before you accept" doctrine, the logistics division is accountable for any shortages or damages occurring between DC departure and store handover that lack co-signed receiving notations.
4.4 Fleet Safety & Compliance (Zero Unlicensed Drivers):
    - 100% compliance with commercial driver licensing, mandatory rest intervals, and zero vehicle safety infractions.
4.5 Halal Catalog Compliance (Rule 17):
    - Strict enforcement of halal standards across all transport vehicles. Zero transport or mixing of alcoholic products or non-halal items.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Telemetry & Handshake Audit Trail:
    - All dispatch orders, driver co-signatures, GPS waypoints, and transit variance logs are permanently recorded in system_logs and transfer manifests.
5.2 Disciplinary Matrix:
    - Tier 1 (Route Deviations or Delayed Handshakes): Written counseling and driver route re-evaluation.
    - Tier 2 (In-Transit Loss > 0.10% or Delivery Lockdown Violation): Formal reprimand, penalty on logistics performance bonus, and comprehensive fleet audit.
    - Tier 3 (Fuel Fraud, Falsified Handshakes, or Cargo Siphoning): Immediate dismissal and criminal prosecution.
================================================================================`
  },
  {
    id: 'policy-inventory-manager-sop-029',
    title: 'Inventory Manager Stock Integrity, Cycle Counting & Variance Reconciliation Policy (SOP-MGT-029)',
    description: 'Codifies the stock governance charter of the Inventory Manager (Level 3, Rank 80): Weekly blind cycle counts, inventory record accuracy (IRA >= 98.5%), FEFO waste audit, reorder threshold optimization, and HQ reconciliation.',
    department: 'warehouses',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Inventory Manager',
      'Stock Integrity',
      'Weekly Cycle Count',
      'Blind Audit',
      'IRA Accuracy',
      'FEFO Compliance',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-029
ROLE: INVENTORY MANAGER (LEVEL 3 — HIERARCHY RANK 80, MATRIX RANK 33)
REPORTS TO: HEAD OF OPERATIONS (LEVEL 2, RANK 90) / HEAD OF SUPPLY CHAIN
SUPERVISES: INVENTORY SPECIALISTS, CYCLE COUNTERS, STOCK AUDITORS & WASTE CONTROLLERS
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 4, Rule 6, Rule 15, Rule 16, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Inventory Manager operates at Level 3 (Functional Leadership) with Hierarchy Rank 80 and Matrix Rank 33, reporting to the Head of Operations.
    - Governs enterprisewide physical stock integrity, inventory valuation consistency, weekly blind cycle count schedules (SOP-OPS-017), waste write-off investigations, and safety stock parameter optimization.
1.2 Core Mission:
    - Maintain enterprise Inventory Record Accuracy (IRA) >= 98.5%; eliminate stockouts through dynamic reorder thresholds; execute rigorous blind stock audits; minimize perishable waste via strict FEFO enforcement; and uphold the Zero-Trust reconciliation model.

2. WHAT THE INVENTORY MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Inventory Suite & Stock Command Access:
    - Full supervisory access to inventory analytics and audit tools:
      * Enterprise & Site Stock Ledgers (/inventory)
      * Zone and Bin Configuration (/inventory -> Zones)
      * Weekly Cycle Count Hub (/wms-ops -> COUNT)
      * Waste, Expiry & Spoilage Auditing (/wms-ops -> WASTE)
      * Inter-Facility Transfer Auditing (/wms-ops -> TRANSFER)
2.2 Weekly Blind Cycle Count Governance (SOP-OPS-017 & Rule 4):
    - Schedule and direct weekly cycle counting across all store and warehouse facilities.
    - Enforce blind count protocols: system expected on-hand counts are strictly hidden from counters to prevent rubber-stamping.
    - Mandate independent recounts for any item variance exceeding +/- 1.0% or 1,000 ETB / KSh.
2.3 Inventory Threshold & Safety Stock Optimization:
    - Authority to adjust reorder points, safety stock quantities, and maximum stock ceilings (canEditThresholds = true) across national catalogs based on sales velocity.
2.4 Waste, Damage & Expiry Investigation:
    - Inspect reported damages, spoilage, and expiry write-off requests.
    - Verify adherence to FEFO markdown ladders (T-3 days: 10% off; T-1 day: 25% off; Expiry: 50% off / donate).
2.5 Cross-Functional Floor Task Coordination (Rule 15):
    - Assign inventory specialists and stock clerks to counting, shelf auditing, and replenishment tasks across all site zones.

3. WHAT THE INVENTORY MANAGER CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 No Unilateral Stock Adjustments or Write-Off Approvals (Rule 1):
    - CANNOT unilaterally wipe inventory, alter stock balances, or approve their own adjustment requests in the database.
    - All inventory reconciliations must submit an inventory_request for Head of Operations / Central HQ dual-approval (4-Eyes Principle).
3.2 No Disclosing System Expected Quantities (Rule 4):
    - STRICTLY PROHIBITED from printing, sharing, or displaying expected on-hand numbers to counting staff prior to count submission.
3.3 No Cross-Country Stock Manipulation (Rule 7 & Rule 8):
    - Confined strictly to the active sovereign country catalog (ET or KE). Zero ability to blend or reallocate cross-border stock.
3.4 Delivery Mission Assignment Lockout (Rule 15):
    - STRICTLY PROHIBITED from assigning inventory audit staff to external vehicle delivery missions.

4. WHAT THE INVENTORY MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 Inventory Record Accuracy (IRA >= 98.5%):
    - Accountable for maintaining enterprisewide physical-to-system inventory record accuracy >= 98.5%.
4.2 Perishable Waste & Expiry Ceiling (<= 0.30%):
    - Ensure net perishable stock write-offs remain <= 0.30% of total retail turnover through rigorous FEFO monitoring.
4.3 100% Audit Resolution within 24 Hours:
    - Ensure all cycle count discrepancies exceeding 1,000 ETB / KSh undergo documented root-cause investigation within 24 hours of count submission.
4.4 High-Shrink Commodity Auditing (Rule 17):
    - Maintain 100% weekly audit frequency for high-value and high-shrink commodities: cooking oil, infant formula, coffee, tea, honey, grains, fresh meat, cosmetics, and electronics.
4.5 Zero Alcohol / Halal Compliance Guarantee:
    - 100% assurance that catalog databases, stock zones, and audit sheets contain zero alcoholic beverages.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Audit Trail & System Logging:
    - Every count schedule, variance report, threshold update, and inventory request is permanently recorded in system_logs with user ID, timestamp, and site identifier.
5.2 Disciplinary Matrix:
    - Tier 1 (Audit Lapses or IRA < 98.0%): Mandatory audit re-evaluation and corrective action plan.
    - Tier 2 (Unreported Discrepancies or Waste > 0.30%): Formal reprimand, forfeiture of inventory bonus, and external HQ physical audit.
    - Tier 3 (Stock Falsification, Ghost Receiving, or Write-Off Collusion): Immediate termination and prosecution.
================================================================================`
  }
];
