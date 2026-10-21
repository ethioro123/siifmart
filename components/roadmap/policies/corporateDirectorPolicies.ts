import { KnowledgeEntry } from '../RoadmapTypes';

export const CORPORATE_DIRECTOR_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-regional-manager-sop-020',
    title: 'Regional Manager Operational Authority, Zero-Trust Guardrails & Supervisory Accountability Policy (SOP-MGT-020)',
    description: 'Defines the legal, operational, and financial scope of the Regional Manager (Level 2, Rank 95): Multi-site oversight, hiring authority, stock transfer approvals, zero-trust prohibitions, and "Captain Owns the Ship" liability.',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Regional Manager',
      'Managerial Roles',
      'Supervisory Accountability',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Multi-Site',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-020
ROLE: REGIONAL MANAGER (LEVEL 2 — HIERARCHY RANK 95)
REPORTS TO: CHIEF EXECUTIVE OFFICER (CEO / SUPER_ADMIN)
SUPERVISES: STORE MANAGERS, WAREHOUSE MANAGERS, REGIONAL LEADS & SITE TEAMS
TRACEABILITY: .agent/RULES.md (Rule 18: Supervisory Accountability & Zero-Trust Model)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Regional Manager operates at Level 2 (Executive/Regional Directorate) with a Hierarchy Rank of 95, reporting directly to the CEO.
    - Serves as the executive operational leader responsible for all Retail Stores, Warehouses, and Distribution Centers within an assigned national geographic territory (e.g., Addis Ababa Regional Cluster, Oromia Cluster, or Nairobi Metro Cluster).
1.2 Core Mission:
    - Deliver enterprise profitability, zero stockouts of staple goods, strict adherence to national Halal / non-alcoholic catalog compliance, sub-0.3% shrinkage rates, and uncompromising Zero-Trust security across all regional nodes.

2. WHAT THE REGIONAL MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Multi-Site Operational Governance:
    - Seamlessly inspect, switch between, and audit all facilities within their assigned territory without requesting permission (isMultiSiteRole = true).
    - Access real-time Central Operations telemetry (/admin), WMS Fulfillment (/wms-ops), Inventory Network View (/network-inventory), Sales History (/sales), and Staff Rosters (/employees).
2.2 Inventory Rebalancing & Inter-Branch Transfers:
    - Authorize and execute inter-store and DC-to-store stock transfers (TRANSFER) to balance inventory, relieve overstock, and prevent expiration of FEFO batches.
    - Mandate emergency blind cycle counts across any store or warehouse exhibiting suspicious inventory movements or inventory discrepancies.
2.3 Staffing, Hiring & Team Allocation:
    - Authority to recruit, interview, hire, and onboard Level 3 Site Leadership (Store Managers, Warehouse Managers, Assistant Managers, Shift Leads) and Level 4 staff (Cashiers, Pickers, Receivers, Drivers) under canEmployRole().
    - Authorize temporary staff redeployments between branches during holidays, supply chain surges, or emergency coverage.
2.4 Cost Price & Margin Transparency:
    - Full visibility into product landed cost prices, supplier margins, and branch gross profitability (canViewCostPrice = true) to maintain regional financial health.
2.5 Dual-Control Sign-Off:
    - Authorize secondary reviews on shift cash variances, large damage write-offs, and contested delivery manifests that exceed site manager thresholds.

3. WHAT THE REGIONAL MANAGER CANNOT DO (ZERO-TRUST PROHIBITIONS)
--------------------------------------------------------------------------------
3.1 Zero Autonomous Retail Price Alterations:
    - Cannot modify retail shelf prices or alter POS barcode pricing. Pricing is strictly centralized under HQ Merchandising.
3.2 Zero Discretionary Discounts:
    - Cannot create local discount codes, verbal price cuts, or promotional vouchers. All campaigns must be deployed centrally via HQ.
3.3 Zero Cross-Border Tenant Access:
    - Hard-pinned to their sovereign country (country_code). A Regional Manager in Ethiopia (ET) has zero technical or operational authority to access Kenya (KE) facilities or data.
3.4 Zero Live Cash Skimming / Blind Balance Access:
    - Deliberately blinded from viewing live expected cash drawer totals during active cashier shifts (Anti-Skimming Shield).
3.5 Zero Unilateral Shrinkage Write-Offs:
    - Cannot unilaterally write off missing inventory or erase shrinkage. All variance approvals must be submitted through inventory_requests for Central HQ Audit sign-off.
3.6 Zero Alcohol / Non-Halal Products (Rule 17):
    - Strictly prohibited from introducing, approving, or stocking alcohol, beer, wine, spirits, or non-halal meat in any regional facility under any circumstances.
3.7 Zero Audit Trail Tampering:
    - Cannot delete, alter, or purge immutable audit records in system_logs.

4. WHAT THE REGIONAL MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP")
--------------------------------------------------------------------------------
4.1 The "Captain Owns the Ship" Doctrine (Rule 18):
    - The Regional Manager is held strictly accountable for all failures, shrinkage, cash shortfalls, and procedural lapses occurring in their region.
    - If a branch manager or cashier engages in theft, collusion, or unreceipted sales, the Regional Manager's supervisory oversight is formally investigated.
4.2 Mandatory 7-Day Stock Count Enforcement (SOP-OPS-017):
    - Enforces that every store and DC in the region completes its mandatory Tuesday 3-Tier Weekly Blind Cycle Count.
    - Overdue counts automatically place regional replenishment requests on administrative hold and penalize the Regional Manager's leaderboard score.
4.3 Shift Cash Variance & Daily EOD Reconciliations:
    - Ensures 100% daily submission of End-of-Day (EOD) Z-Reports and blind drawer reconciliations across every POS register in the region.
    - Any unresolved cash deficit exceeding tolerance triggers direct co-attribution to the Regional Manager.
4.4 Override Velocity Monitoring (< 3% Ceiling):
    - Ensures managerial override velocity (voids, price checks, returns) remains strictly below 3% of total regional transactions. Override velocities > 3% trigger automated Central HQ alerts.
4.5 Authenticated Accountability Footprint:
    - Every supervisory override, transfer approval, or disciplinary sign-off must capture:
        * Authenticated managerId and Role
        * High-precision Server Timestamp
        * Hardware Fingerprint & GPS Coordinates
        * Mandatory Structured Reason Code`
  },
  {
    id: 'policy-operations-manager-sop-021',
    title: 'Operations Manager Operational Authority, Central Oversight & Facility Accountability Policy (SOP-MGT-021)',
    description: 'Defines the operational remit of the Operations Manager (Level 2, Rank 90): Central Operations control room leadership, cross-facility fulfillment SLAs, WMS queue balancing, emergency reallocations, and enterprise execution accountability.',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Operations Manager',
      'HQ Operations',
      'Central Operations',
      'Fulfillment SLAs',
      'Managerial Roles',
      'Captain Owns the Ship',
      'Zero-Trust',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-021
ROLE: OPERATIONS MANAGER (LEVEL 2 — HIERARCHY RANK 90)
REPORTS TO: REGIONAL MANAGER & CHIEF EXECUTIVE OFFICER (CEO)
SUPERVISES: CENTRAL OPS TEAM (DATA_ANALYST, SECURITY_MANAGER, CS_MANAGER, STORE_OPERATIONS_AUDITOR) & DIRECT SUPERVISORY LINE TO ALL STORE & WAREHOUSE MANAGERS
TRACEABILITY: .agent/RULES.md (Rule 18: Supervisory Accountability & Zero-Trust Model)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Operations Manager operates at Level 2 (Executive/Operations Directorate) with a Hierarchy Rank of 90.
    - Serves as the commanding operational officer of the Central Operations Control Room (/admin), orchestrating day-to-day fulfillment, dock velocity, network inventory flow, and operational continuity across all retail branches and warehouse hubs.
1.2 Core Mission:
    - Guarantee enterprise execution velocity, sub-hour fulfillment turnaround, zero dock bottlenecks, strict FEFO inventory hygiene, and immediate response to operational exceptions.
1.3 Central Operations Team Architecture:
    - data_analyst: Central Ops dashboards, shift velocity metrics, gross margin telemetry.
    - security_manager (Level 3): Loss prevention, CCTV incident reports, security guards dispatch.
    - cs_manager (Level 3) & customer_service: Customer complaints, refund reviews, loyalty desk.
    - Direct reporting line to all store_managers and warehouse_managers.
    - store_operations_auditor: Conducts unannounced store walkthroughs, planogram/merchandising checks, and cash handling spot audits.

2. WHAT THE OPERATIONS MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Central Operations Control Room Leadership (/admin):
    - Direct command of the enterprise telemetry bridge, live network throughput monitors, and active mission queues.
    - Authority to intervene in stuck order batches, rebalance picking waves across facilities, and escalate facility bottlenecks to regional leadership.
2.2 WMS Fulfillment & Mission Control Authority (/wms-ops):
    - Full supervisory access across all warehouse fulfillment tabs: Docks, Receive, Putaway, Pick, Pack, Replenish, Count, Waste, Returns, and Dispatch.
    - Authorize amendments to completed picks (PickAmendModal) when stock anomalies occur.
    - Approve unknown barcode verifications and supervisory PIN overrides for high-priority items.
2.3 Inventory Network Visibility & Safety Stock Thresholds:
    - Multi-site inventory access across all national facilities (isMultiSiteRole = true).
    - Authority to adjust facility-level low stock warning thresholds and reorder triggers (canEditThresholds = true) to prevent regional stockouts of core commodities (cooking oil, infant formula, coffee, rice, flour).
2.4 Workforce Scheduling & Cross-Site Balancing:
    - Authorize temporary cross-site task shifts (e.g., assigning available staff to receiving docks when container shipments surge).
    - Interview, hire, and onboard Level 3 managers and Level 4 workers under canEmployRole().
2.5 Margin & Landed Cost Visibility:
    - Full access to supplier landed costs and operational margins (canViewCostPrice = true) to ensure logistics and handling expenses do not erode gross profitability.
2.6 Unannounced Field Audits & Cash Spot Verification:
    - Full authority to dispatch store_operations_auditor for surprise branch inspections, verifying shelf planograms, price tag synchronization, zero-alcohol catalog compliance (Rule 17), and blind register cash counts.

3. WHAT THE OPERATIONS MANAGER CANNOT DO (ZERO-TRUST PROHIBITIONS)
--------------------------------------------------------------------------------
3.1 Zero Autonomous Shelf Price Alterations:
    - Cannot modify retail selling prices, create custom promos, or alter POS catalog pricing. Pricing is strictly reserved for HQ Merchandising.
3.2 Zero Cross-Border Data Access:
    - Pinned strictly to their sovereign national operating environment (country_code: 'ET' or 'KE').
3.3 Zero Live Cash Drawer Peeking:
    - Strictly blinded from active cash drawer balances during cashier shifts to prevent collusion or skimming.
3.4 Zero Unilateral Inventory Eradication:
    - Cannot unilaterally write off stock, adjust inventory levels down, or declare shrinkage directly. All write-offs must be submitted through inventory_requests for HQ Internal Audit sign-off.
3.5 Zero Non-Halal / Alcohol Introduction (Rule 17):
    - Strictly barred from approving, receiving, or transferring alcoholic beverages or non-halal items under any circumstances.
3.6 Zero Delivery Lockdown Violation (Rule 15):
    - Strictly barred from assigning non-driver floor staff (pickers, packers, receivers) to delivery missions. Deliveries remain locked to verified drivers.
3.7 Zero Audit Trail Deletion:
    - Cannot purge, modify, or disable audit records in system_logs.

4. WHAT THE OPERATIONS MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP")
--------------------------------------------------------------------------------
4.1 Enterprise Fulfillment SLA Performance:
    - Accountable for maintaining overall fulfillment SLA compliance (>= 98.5% on-time pick, pack, and dock dispatch).
    - Every delayed dispatch or staging backlog is logged and co-attributed to the Operations Manager.
4.2 Dock Safety, Quality & Cold-Chain Integrity:
    - Accountable for operational hygiene across receiving docks, pallet racking, and cold storage units.
    - Perishable temperature excursions or handling damage due to neglected putaway queues trigger direct supervisory investigation.
4.3 Supervisory Override Velocity Monitoring (< 3% Ceiling):
    - Ensures that supervisory overrides across all operational departments do not exceed 3% of total operations. Overriding above 3% triggers an automated executive audit alert.
4.4 Discrepancy Co-Sign & Escalation Compliance:
    - Enforces the Digital Dual-Handshake (SOP-LOG-007) and Chain of Custody compliance across all transit lines.
    - Unsigned transfer discrepancies or delayed receipt reporting directly penalize the Operations Manager's operational score.
4.5 Authenticated Audit Footprint:
    - Every mission reassignment, wave cancellation, or supervisory override must capture:
        * Authenticated managerId and Role
        * High-precision Server Timestamp
        * Hardware Fingerprint & GPS Coordinates
        * Mandatory Structured Reason Code`
  },
  {
    id: 'policy-finance-manager-sop-022',
    title: 'Finance Manager Fiscal Authority, Zero-Trust Cash Reconciliation & Financial Accountability Policy (SOP-MGT-022)',
    description: 'Defines the fiscal and fiduciary remit of the Finance Manager (Level 2, Rank 85): Daily HQ Z-Report sign-offs, tender gateway governance, procurement PO spend approval, tax compliance, and anti-skimming accountability.',
    department: 'finance',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Finance Manager',
      'Fiscal Governance',
      'Shift Reconciliation',
      'Cash Security',
      'Tax Compliance',
      'Managerial Roles',
      'Captain Owns the Ship',
      'Zero-Trust',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-022
ROLE: FINANCE MANAGER (LEVEL 2 — HIERARCHY RANK 85)
REPORTS TO: CHIEF EXECUTIVE OFFICER (CEO / SUPER_ADMIN)
SUPERVISES: ACCOUNTANTS, FINANCIAL AUDITORS, TREASURY OFFICERS, TAX COMPLIANCE OFFICERS, CREDIT CONTROL OFFICERS, PAYROLL SPECIALISTS & SITE CASH CLERKS
TRACEABILITY: .agent/RULES.md (Rule 18: Supervisory Accountability & Zero-Trust Cash Oversight)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Finance Manager operates at Level 2 (Executive/Finance Directorate) with a Hierarchy Rank of 85, reporting directly to the CEO.
    - Serves as the chief fiduciary and fiscal officer of SIIFMART, governing daily store cash reconciliations, digital payment gateway settlements, procurement payables, tax compliance, and gross margin integrity across all enterprise nodes.
1.2 Core Mission:
    - Ensure 100% reconciliation of every Birr / Shilling collected, zero uninvestigated cash drawer variances, prompt vendor settlements, accurate tax remittances, and protection of company solvency.

2. WHAT THE FINANCE MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Financial Suite Leadership (/finance):
    - Full access and supervisory command over enterprise financial dashboards: revenue ledgers, operational expenses, gross profit analytics, and financial data exports (EXPORT_FINANCIAL_DATA).
    - Authorize operational expenses, recurring utility payouts, and store petty cash replenishments.
2.2 Mandatory Daily Shift Reconciliation & Z-Report Sign-Off:
    - Review, verify, and approve daily End-of-Day (EOD) Z-Reports and blind shift cash reconciliations across every register and branch (ShiftReconciliationTable).
    - Authority to formally clear, flag, or freeze cashier drawers exhibiting recurring variances.
2.3 Procurement PO Financial Authorization:
    - Review and approve supplier Purchase Orders (APPROVE_PO) alongside Procurement leadership to ensure all inventory purchases align with cash flow limits and supplier credit terms.
    - Enforce the 3-Way Match Rule: PO Quantity/Price == Receiving Manifest Count == Supplier Invoice before disbursing payment.
2.4 Cost Price Transparency & Merchandising Margin Governance:
    - Unrestricted access to supplier landed costs, distributor discounts, and category margins (canViewCostPrice = true).
    - Review and co-approve price updates (APPROVE_PRICE_CHANGE) to safeguard enterprise gross margins against inflation.
2.5 Sovereign Tax & Dual VAT Controllability:
    - Configure and manage sovereign tax parameters (ERCA 15% VAT for Ethiopia, KRA 16% VAT for Kenya) in FinanceSettings.
    - Control country-level dual tax calculation toggles for purchasing (taxOnPurchasing) and sales (taxOnSelling) in compliance with national law.
2.6 Payroll & Compensation Oversight:
    - Review and authorize staff payroll disbursements and incentive bonuses (PROCESS_PAYROLL) in collaboration with HR.
2.7 Specialized Finance Team Supervisory Authority:
    - Direct supervisory command and task assignment over specialized Level 4 finance officers:
        * Treasury Officer (treasury_officer): Daily POS shift drawer cash and digital mobile money tender reconciliation (Telebirr, CBE Birr, M-Pesa), bank deposit matching, and cash discrepancy ticketing.
        * Tax Compliance Officer (tax_compliance_officer): Sovereign VAT filing preparations (ERCA Form 21, KRA VAT 3), withholding tax certificates, and fiscal audit compliance.
        * Credit Control Officer (credit_control_officer): B2B credit accounts, institutional customer limits, aged debtor ledgers, and supplier credit term governance.

3. WHAT THE FINANCE MANAGER CANNOT DO (ZERO-TRUST PROHIBITIONS)
--------------------------------------------------------------------------------
3.1 Zero Live Cash Till Operation:
    - Cannot operate an active POS checkout register or kick a cash drawer for personal handling. Cash custody must remain isolated to bonded cashiers.
3.2 Zero Cross-Border Currency Pooling:
    - Strictly prohibited from mixing, adding, or pooling Ethiopian Birr (ETB) and Kenyan Shillings (KSh). Every ledger must remain 100% sovereign and isolated.
3.3 Zero Unilateral Capital Write-Offs:
    - Cannot write off bad debts, inventory shrinkage, or capital assets without CEO joint approval (4-Eyes Principle).
3.4 Zero Silent Ledger Alteration:
    - Cannot edit, overwrite, or delete historical journal entries, shift records, or sales transactions. Corrective actions must use offset entries with full audit logs.
3.5 Zero Tax Law Arbitrary Waivers:
    - Cannot waive or adjust fiscal tax calculations for commercial transactions without documented government exemption certification.
3.6 Zero Non-Halal / Alcohol Commercial Approvals (Rule 17):
    - Strictly barred from authorizing purchase orders, expenses, or invoices for alcoholic beverages or non-halal items.
3.7 Zero Audit Trail Deletion:
    - Cannot modify, purge, or bypass system_logs.

4. WHAT THE FINANCE MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP")
--------------------------------------------------------------------------------
4.1 100% Daily Drawer Reconciliation (Zero-Tolerance for Lapsed Audits):
    - Accountable for ensuring every store register completes its daily EOD Z-Report and blind drawer count within 12 hours of store closing.
    - Every unverified cash deficit > 50 ETB / 100 KSh must be audited and assigned an incident resolution ticket within 24 hours.
4.2 National Tax Compliance & Fiscal Integrity:
    - Held personally accountable for enterprise compliance with sovereign tax authorities (ERCA in Ethiopia, KRA in Kenya).
    - Any tax penalty resulting from uncalibrated POS tax rates or misreported VAT is directly attributed to the Finance Manager.
4.3 Anti-Skimming & Fraud Alert Escalation:
    - Accountable for monitoring cashier void velocities, excessive returns, and digital transaction reference uniqueness to block mobile-money fraud.
4.4 Override Velocity & Supervisory Accountability:
    - Ensures financial overrides and manual journal entries maintain < 3% velocity.
    - Every financial sign-off, PO approval, or shift clearance must capture:
        * Authenticated managerId and Role
        * High-precision Server Timestamp
        * Hardware Fingerprint & GPS Coordinates
        * Mandatory Structured Reason Code`
  },
  {
    id: 'policy-hr-manager-sop-023',
    title: 'HR Manager Workforce Governance, Guarantor Vetting & Anti-Collusion Accountability Policy (SOP-MGT-023)',
    description: 'Defines the workforce remit of the HR Manager (Level 2, Rank 85): Institutional Guarantor (Wase) vetting, anti-collusion kinship separation, quarterly branch rotation, staff credentialing, and disciplinary oversight.',
    department: 'hr',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'HR Manager',
      'Workforce Governance',
      'Guarantor Vetting',
      'Wase Protocol',
      'Anti-Collusion',
      'Staff Rotation',
      'Managerial Roles',
      'Captain Owns the Ship',
      'Zero-Trust',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-023
ROLE: HUMAN RESOURCES MANAGER (LEVEL 2 — HIERARCHY RANK 85)
REPORTS TO: CHIEF EXECUTIVE OFFICER (CEO / SUPER_ADMIN)
SUPERVISES: HR GENERALISTS, TRAINING COORDINATORS, RECRUITERS & SITE TIMEKEEPERS
TRACEABILITY: .agent/RULES.md (Rule 18: Supervisory Accountability & Anti-Collusion Model)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Human Resources Manager operates at Level 2 (Executive/HR Directorate) with a Hierarchy Rank of 85, reporting directly to the CEO.
    - Serves as the chief workforce guardian of SIIFMART, responsible for talent acquisition, staff verification, legal guarantor bonding, anti-cartel rotation, performance reviews, and labor compliance across all retail stores, distribution centers, and headquarters.
1.2 Core Mission:
    - Build a disciplined, honest, and high-performing retail and logistics workforce; enforce mandatory guarantor vetting before custody handover; prevent informal theft syndicates through kinship separation; and guarantee equitable staff welfare.

2. WHAT THE HR MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Enterprise Workforce Administration (/employees):
    - Full supervisory command over employee records, role assignments, onboarding wizards, and staff status activations (ACCESS_EMPLOYEES, ADD_EMPLOYEE, EDIT_EMPLOYEE).
    - Initiate formal disciplinary proceedings and execute employee terminations (TERMINATE_EMPLOYEE) for roles strictly below their hierarchy level.
2.2 Hiring & Staff Promotion Authority:
    - Authorized to hire and onboard Level 3 Site Leadership (Store Managers, Warehouse Managers, Assistant Managers, Shift Leads) and Level 4 staff under canEmployRole().
    - Promote qualified internal candidates from floor roles (Pickers, Packers, Cashiers) into supervisory tracks based on verified accuracy scores on the National Gamification Leaderboard.
2.3 Shift Roster & Labor Allocation Oversight:
    - Audit and approve branch shift schedules (MANAGE_SHIFTS) to ensure adequate cashier coverage, warehouse floor headcount, and licensed driver availability across operating hours.
2.4 Cross-Site Workforce Deployment & Rotation:
    - Execute mandatory quarterly rotations of cashiers, stock clerks, and store managers between branches to eliminate informal merchant collusion.
2.5 Total Workforce Transparency & Geolocation Oversight:
    - Authorized to inspect employee work profiles, geofence compliance, and clock-in coordinates across all branches (canViewLocation = true for all roles below CEO).
2.6 Payroll & Compensation Collaboration:
    - Co-manage employee salary structures, overtime calculations, emergency advance buffers, and team zero-shrinkage bonus pools in conjunction with the Finance Manager.

3. WHAT THE HR MANAGER CANNOT DO (ZERO-TRUST PROHIBITIONS)
--------------------------------------------------------------------------------
3.1 Zero Kinship / Family Collusion Placement:
    - Strictly prohibited from assigning spouses, siblings, parents, or first-degree relatives to the same store, warehouse, or shift roster (Anti-Collusion Law).
3.2 Zero Wase / Guarantor Bypass:
    - Absolutely barred from activating POS cashier credentials or warehouse inventory access for any candidate lacking a fully executed, notarized legal guarantor (Wase in Ethiopia / verified guarantor in Kenya).
3.3 Zero Autonomous Inventory or Price Powers:
    - Zero authority to modify inventory counts, approve stock write-offs, alter product prices, or issue discount codes.
3.4 Zero Live Cash Handling / Drawer Access:
    - Barred from operating cashier drawers, ringing customer sales, or handling physical till floats.
3.5 Zero Cross-Border Deployment:
    - Pinned to the active country domain (country_code). Cannot transfer personnel across international borders without CEO authorization and formal immigration clearance.
3.6 Zero Unilateral Peer / Superior Actions:
    - Cannot hire, promote, discipline, or terminate Level 1 leadership (CEO) or fellow Level 2 Directors (Regional Manager, Operations Manager, Finance Manager).
3.7 Zero Audit Trail Deletion:
    - Cannot modify, purge, or suppress employee disciplinary records or geofence violation logs in system_logs.

4. WHAT THE HR MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP")
--------------------------------------------------------------------------------
4.1 100% Guarantor (Wase) File Audit Compliance:
    - Held personally accountable for complete background files (National ID / Passport, verified residence, police clearance, notarized guarantor assets) for every cash-handling and inventory-custody employee.
    - If an employee absconds with cash or inventory and their guarantor file is discovered incomplete or unverified, the HR Manager is directly liable for negligence.
4.2 Anti-Cartel Rotation Execution (Quarterly Cadence):
    - Accountable for maintaining the 90-to-180-day branch rotation schedule for all cashiers and store supervisors. Lapsed rotations trigger automated alerts to Central Operations.
4.3 Shift Headcount Minimums & Punctuality:
    - Ensures no store opens without bonded cashiers and no DC operates without licensed forklift operators and verified drivers.
4.4 Team Zero-Shrinkage Incentive Distribution:
    - Ensures monthly team shrinkage bonuses are calculated accurately and distributed on time, making honesty more profitable than collusion.
4.5 Authenticated Supervisory Audit Footprint:
    - Every hiring decision, branch transfer, disciplinary action, or termination must capture:
        * Authenticated managerId and Role
        * High-precision Server Timestamp
        * Hardware Fingerprint & GPS Coordinates
        * Mandatory Structured Reason Code`
  }
];
