import { KnowledgeEntry } from '../RoadmapTypes';

export const GOVERNANCE_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-multi-country-isolation-sop-009',
    title: 'Multi-Country Tenant Isolation & National Sovereignty Policy (SOP-GOV-009)',
    description: 'Absolute data separation across sovereign nations (ET, KE, UG, RW, TZ): Zero cross-border leakage, no currency cross-addition, local price sovereignty, and invisible tenancy for branch staff.',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Multi-Country', 'Tenant Isolation', 'National Sovereignty', 'Currency Separation', 'Zero-Bleed', 'Compliance', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE MULTI-COUNTRY GOVERNANCE DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-GOV-009
POLICY: MULTI-COUNTRY TENANT ISOLATION & NATIONAL SOVEREIGNTY LAW
CLASSIFICATION: MANDATORY — APPLIES TO ALL SOFTWARE, API & OPERATIONAL NODES
TRACEABILITY: .agent/RULES.md (Rules 7 & 8, Multi-Country Sections 1-3)
================================================================================

1. ENTERPRISE ARCHITECTURE: ABSOLUTE MULTI-COUNTRY DATA SEPARATION
--------------------------------------------------------------------------------
1.1 One Platform, Distinct National Realities:
    - SIIFMART operates across multiple sovereign East African nations (Ethiopia HQ ET, Kenya Hub KE, Uganda UG, Rwanda RW, Tanzania TZ).
    - Every database record, KPI dashboard, inventory count, customer ledger, and employee profile MUST be strictly partitioned by country_code.
1.2 Zero Cross-Country Data Leakage:
    - Dashboards, sales KPIs, gross profit, stock counts, orders, shifts, and employee rosters in Kenya must NEVER mix, display, or aggregate Ethiopian data (and vice-versa).
1.3 Zero Arithmetic Cross-Addition:
    - Under no circumstances may 1,000 ETB and 1,000 KSh be added together into a single sum. Monetary figures must be aggregated solely within the active country currency.
1.4 Non-CEO Staff Hard Lockdown:
    - Cashiers, store managers, pickers, and drivers are hard-pinned to their assigned site's country via getUserCountry().
    - Any attempt to tamper with client storage, URL parameters, or network payloads to view or mutate another country is cryptographically blocked.

2. SINGLE GLOBAL COUNTRY SWITCH (CEO-ONLY) & INVISIBLE MULTI-TENANCY
--------------------------------------------------------------------------------
2.1 Executive Switch Exclusivity:
    - Choosing between country instances is performed exclusively by the CEO or super_admin through ONE central global switch in the top navigation.
2.2 Invisible Tenancy for Branch Staff:
    - Non-CEO users (cashiers, store managers, pickers, drivers, branch accountants) must NEVER see country pickers, partition banners, or multi-tenant switches anywhere.
    - To each user, the application is presented 100% as a native, single-nation system (e.g. fully Kenyan website for Kenyan branches). A user should not see or be aware of multi-tenant mechanics.
2.3 Zero Per-Screen Selectors:
    - No country selection chips, dropdowns, or partition switcher banners inside individual settings pages or tabs.
    - All background services and hooks read from and write to the active country partition automatically.

3. NATIONAL PRICE SOVEREIGNTY & TENDER SEGREGATION
--------------------------------------------------------------------------------
3.1 Price Sovereignty:
    - Retail shelf prices are explicitly set and maintained in local currency (KSh in Kenya, ETB in Ethiopia).
    - Live exchange-rate auto-conversion across retail shelf prices is strictly forbidden.
3.2 Tender & Gateway Segregation:
    - M-Pesa / Airtel Money strictly for Kenya; Telebirr / CBE Birr strictly for Ethiopia; MTN MoMo for Uganda.
    - POS checkout strictly hides foreign tenders. Cross-border tender processing is blocked.`
  },
  {
    id: 'policy-multi-country-sku-sop-010',
    title: 'Multi-Country SKU & Cross-Border Scan Rejection Policy (SOP-INV-010)',
    description: 'Country-prefixed SKU namespace (ET-, KE-, UG-), universal category taxonomy, and automated cross-border barcode scan rejection at POS and WMS docks.',
    department: 'warehouses',
    type: 'policy',
    priority: 'high',
    status: 'active',
    isStarred: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['SKU Architecture', 'Cross-Border Rejection', 'FEFO', 'Catalog Sovereignty', 'Merchandising', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE MERCHANDISING & WMS DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-INV-010
POLICY: MULTI-COUNTRY SKU & CROSS-BORDER SCAN REJECTION
CLASSIFICATION: MANDATORY — APPLIES TO ALL MERCHANDISERS, RECEIVERS & CASHIERS
TRACEABILITY: .agent/RULES.md (Multi-Country Section 4: SKU Architecture)
================================================================================

1. COUNTRY-PREFIXED SKU NAMESPACE
--------------------------------------------------------------------------------
1.1 Namespace Pattern:
    - Ethiopia: ET-[CAT][SEQ] (e.g. ET-FR001, ET-BV004)
    - Kenya: KE-[CAT][SEQ] (e.g. KE-FR001, KE-DY002)
    - Uganda: UG-[CAT][SEQ] (e.g. UG-SN001)
1.2 Collision Prevention:
    - Guarantees zero database collision and provides instant physical identification on carton shipping labels and box tags.

2. CROSS-BORDER SCANNER REJECTION
--------------------------------------------------------------------------------
2.1 Hardware Intercept:
    - Scanning an Ethiopian item (e.g. ET-BV002) at a Kenyan POS or WMS Putaway dock instantly halts with a critical border security alert:
      "Foreign SKU Detected: Item belongs to Ethiopia market."
2.2 Physical Boundary Protection:
    - Prevents accidental shelf-stocking, untracked inventory bleeding, or illegal unregistered imports.

3. UNIVERSAL ROTATION & MARGIN ENGINE
--------------------------------------------------------------------------------
3.1 Category Taxonomy:
    - Universal category codes (FR: Fresh Produce, DY: Dairy, MT: Meat, BV: Beverages, SN: Snacks, CL: Cleaning).
3.2 Universal FEFO Engine:
    - First-Expired, First-Out lot tracking across all sovereign distribution hubs.
3.3 Margin Protection & Perishable Markdowns:
    - Landed Cost + Target Margin % = Base Retail Shelf Price.
    - Automated markdown ladder: T-3 days (10% off), T-1 day (25% off), Expiry Day (50% off).`
  },
  {
    id: 'policy-dual-tax-controllability-sop-012',
    title: 'Dual Tax / VAT Controllability & Exempt Vendor Purchasing Policy (SOP-FIN-012)',
    description: 'Independent country-level toggles for tax on purchasing and sales, enabling legal, automated purchasing from informal smallholders and non-VAT vendors.',
    department: 'finance',
    type: 'policy',
    priority: 'high',
    status: 'active',
    isStarred: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Tax Controllability', 'VAT', 'Purchasing', 'Informal Vendors', 'Exempt Smallholders', 'Finance', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE FISCAL COMPLIANCE & PROCUREMENT DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-FIN-012
POLICY: DUAL TAX / VAT CONTROLLABILITY & EXEMPT PURCHASING
CLASSIFICATION: MANDATORY — APPLIES TO PROCUREMENT LEADS, AUDIT & FINANCE
TRACEABILITY: .agent/RULES.md (Rule 13 & Section 9: Dual Tax Framework)
================================================================================

1. EMERGING MARKET FISCAL REALITY
--------------------------------------------------------------------------------
1.1 Mixed Procurement Channels:
    - SIIFMART procures both from formal corporate FMCG distributors (VAT-registered) and informal regional farmers/smallholders (unregistered / VAT-exempt).
1.2 Prohibition of Hardcoded Tax:
    - Hardcoding automatic tax calculation on Purchase Orders or POS checkout without checking country-level config toggles is strictly prohibited.

2. DUAL INDEPENDENT TAX TOGGLES IN SYSTEMCONFIG
--------------------------------------------------------------------------------
2.1 Independent Country Gating:
    - Every country configuration in SystemConfig must independently maintain:
        * taxOnPurchasing: boolean (Enables/disables VAT calculation on vendor POs and DC receiving).
        * taxOnSelling: boolean (Enables/disables sales VAT calculation at POS checkout).
2.2 Non-Bleed Rule:
    - Disabling tax on purchasing in Ethiopia (due to manual paper invoicing or agricultural exemptions) must NEVER alter tax behavior in Kenya (KRA ETR compliance).

3. PROCUREMENT AUDIT INTEGRITY
--------------------------------------------------------------------------------
3.1 3-Way Match Verification:
    - PO vs Goods Receiving Slip vs Vendor Invoice must balance according to the active tax setting applied at creation time.
3.2 Tax Exemption Certificates:
    - Vendor profiles must store VAT exemption certificates or informal supplier affidavits where taxOnPurchasing is bypassed.`
  },
  {
    id: 'policy-zero-trust-hq-approval-sop-013',
    title: 'Zero-Trust HQ Central Approval & 4-Eyes Governance Policy (SOP-GOV-013)',
    description: 'Mandatory central oversight: Zero autonomous branch overrides, centralized stock adjustment approvals, 4-Eyes dual control, and tamper-proof logging.',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Zero-Trust', '4-Eyes Principle', 'HQ Oversight', 'Inventory Requests', 'Audit Trail', 'Governance', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE CORPORATE GOVERNANCE DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-GOV-013
POLICY: ZERO-TRUST CENTRAL HQ APPROVAL & 4-EYES PRINCIPLE
CLASSIFICATION: MANDATORY — APPLIES TO ALL BRANCH MANAGERS & EXECUTIVES
TRACEABILITY: .agent/RULES.md (Zero-Trust Oversight Model Rules 1-6)
================================================================================

1. ZERO AUTONOMOUS BRANCH AUTHORITY
--------------------------------------------------------------------------------
1.1 No Unilateral Powers:
    - Branch managers, shift leads, and cashiers CANNOT unilaterally adjust stock balances, write off shrinkage, approve large refunds, void sales, alter product prices, or create discount rules.
1.2 HQ Inventory Requests Workflow:
    - All inventory adjustments must be submitted as pending inventory_requests.
    - Adjustments remain in PENDING status and do not alter ledger stock until formally signed off by Central HQ Audit.

2. 4-EYES PRINCIPLE (DUAL-CONTROL DUAL SIGN-OFF)
--------------------------------------------------------------------------------
2.1 High-Risk Action Matrix:
    - Refunds exceeding the threshold (> 200 ETB / 500 KSh): Requires Cashier + Store Manager dual sign-off.
    - Manual Cash Drawer Kick Without Sale: Requires supervisory authorization and mandatory reason logging.
    - Stock Transfer Discrepancy: Requires Delivering Driver + Receiving Custodian Digital Dual-Handshake.
    - System Configuration Changes: Requires Branch + HQ OTP dual authorization.

3. TAMPER-PROOF AUDIT TRAIL
--------------------------------------------------------------------------------
3.1 Universal Audit Logging:
    - Every sensitive operational event (drawer open, price lookup, void, count variance, transfer acceptance) logs immutably to system_logs with:
        * Employee ID & Role
        * Physical Site ID & Country Code
        * Device Fingerprint & IP Address
        * GPS Coordinates of Terminal
        * Microsecond Server Timestamp
3.2 Immutable Historical Log:
    - Audit logs cannot be modified, truncated, or deleted by any branch user.`
  },
  {
    id: 'policy-manager-accountability-sop-018',
    title: 'Manager & Supervisory Accountability Law (SOP-GOV-018)',
    description: 'The "Captain Owns the Ship" doctrine across all 16 managerial roles: Mandatory supervisory footprint, shift variance co-signing, 4-Eyes anti-collusion separation, and override velocity audit thresholds.',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Manager Accountability', 'Captain Owns Ship', 'Supervisory Co-Liability', 'Dual-Sign', 'Override Velocity', 'Governance', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE MANAGEMENT ACCOUNTABILITY DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-GOV-018
POLICY: MANAGER & SUPERVISORY ACCOUNTABILITY LAW ("THE CAPTAIN OWNS THE SHIP")
CLASSIFICATION: MANDATORY — APPLIES TO ALL 16 MANAGERIAL & SUPERVISORY ROLES
TRACEABILITY: .agent/RULES.md (Rule 18 & Section 14: Manager Accountability Law)
================================================================================

1. THE CORE DIRECTIVE: "THE CAPTAIN OWNS THE SHIP"
--------------------------------------------------------------------------------
1.1 Shared Operational Liability:
    - Holding floor workers, cashiers, and drivers accountable without holding managers equally accountable is strictly unacceptable.
    - Under the Captain's Responsibility Doctrine: Any operational loss, unexplained shrinkage, unverified cash deficit, or procedural failure occurring during a shift or under a supervisor's stamp is co-attributed to the on-duty manager.
1.2 Scope Across All 16 Management Roles:
    - Retail Store Leadership: store_manager, assistant_manager, shift_lead, store_supervisor.
    - Fulfillment Leadership: warehouse_manager.
    - Logistics Leadership: logistics_manager, dispatch_manager.
    - Inventory Leadership: inventory_manager.
    - Corporate & Regional Directors: regional_manager, operations_manager, finance_manager, hr_manager, procurement_manager, supply_chain_manager, security_manager, cs_manager.

2. MANDATORY IMMUTABLE SUPERVISORY FOOTPRINT
--------------------------------------------------------------------------------
2.1 No Anonymous Approvals:
    - Every supervisory action (price override, line void, drawer kick, refund approval, job reassignment, PO approval) must capture:
        * managerId & managerEmployeeId (Authenticated user identity)
        * managerName & managerRole
        * Mandatory structured reasonCode (Free-text or blank overrides are computationally prohibited)
        * terminalId, deviceFingerprint, GPS coordinates, and server timestamp.
2.2 Structured Reason Enforcement:
    - Overrides require selecting an authorized enum code (e.g. DEFECTIVE_PACKAGING, SHELF_PARITY_REFUND, REROUTE_URGENT_SLA).

3. SHIFT CO-LIABILITY & JOINT CHAIN OF CUSTODY
--------------------------------------------------------------------------------
3.1 Blind Shift Close Co-Sign:
    - When a cashier closes a drawer with an unverified cash variance (> 20 ETB / 50 KSh), the on-duty shift supervisor MUST co-sign the discrepancy log.
    - Supervisors cannot claim ignorance of cash skimming occurring under their direct supervision.
3.2 Inbound Manifest & Transfer Co-Liability:
    - If a warehouse supervisor signs off on an inbound shipment without physical verification that is later found short or damaged, the supervisor shares direct liability under SOP-LOG-007.

4. OVERRIDE VELOCITY AUDIT GATING
--------------------------------------------------------------------------------
4.1 Anti-Collusion Threshold:
    - An abnormal supervisory override rate (> 3% of store shift transactions) automatically triggers an immediate Central HQ Loss Prevention audit flag to detect cashier-supervisor collusion or sweethearting.
4.2 Anti-Collusion Separation of Duties (4-Eyes Check):
    - Managers cannot approve POs, expenses, or inventory adjustments that they personally originated or counted. All store-level stock adjustments remain strictly gated to Central HQ Audit review via inventory_requests.`
  },
  {
    id: 'policy-non-alcoholic-catalog-sop-019',
    title: 'Non-Alcoholic / Halal Catalog Compliance Policy (SOP-MER-019)',
    description: 'Strict enterprise-wide prohibition of alcohol, liquor, beer, wine, and spirits across the product catalog, category taxonomy, SOP examples, and risk tiers.',
    department: 'policy',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Non-Alcoholic', 'Zero-Liquor', 'Halal Compliance', 'Catalog Sovereignty', 'Merchandising', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE MERCHANDISING COMPLIANCE DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MER-019
POLICY: NON-ALCOHOLIC / HALAL CATALOG COMPLIANCE LAW
CLASSIFICATION: MANDATORY — APPLIES TO ALL MERCHANDISERS, BUYERS & DEVELOPERS
TRACEABILITY: .agent/RULES.md (Rule 17 & Section 13: Non-Alcoholic Catalog Law)
================================================================================

1. ZERO-ALCOHOL ENTERPRISE MANDATE
--------------------------------------------------------------------------------
1.1 Absolute Prohibition:
    - SIIFMART operates strictly as an alcohol-free, halal-compliant enterprise.
    - We do NOT sell liquor, beer, wine, spirits, or alcoholic beverages under any circumstances in any operating country (ET, KE, UG, RW, TZ).
1.2 Legal & Ethical Foundation:
    - Our retail outlets, warehouses, and distribution hubs strictly exclude all alcoholic beverages from our supply chains, inventory, and point-of-sale registers.

2. TAXONOMY & CATALOG LOCKDOWN
--------------------------------------------------------------------------------
2.1 Category Prohibitions:
    - The category taxonomy and master product catalog must NEVER contain categories for liquor, beer, wine, or spirits.
    - Any legacy or imported data must be automatically sanitized and remapped to non-alcoholic categories (e.g. 'Beverages').
2.2 Vendor Onboarding Restriction:
    - Procurement buyers are strictly forbidden from creating supplier accounts or purchase orders for breweries, distilleries, or alcohol distributors.

3. PROHIBITION IN EXAMPLES, MOCK DATA & SOPS
--------------------------------------------------------------------------------
3.1 Engineering & Documentation Cleanliness:
    - Developers, agents, and administrators must NEVER use liquor, beer, wine, or spirits as examples in documentation, SOPs, cycle count risk tiers, test cases, or mock databases.
    - High-value or high-shrink examples must strictly use commodities like edible cooking oil, infant milk formula, premium coffee/tea, honey, electronics, cosmetics, or fresh meat.`
  },
  {
    id: 'policy-dual-control-salary-sop-024',
    title: 'Dual-Control Compensation & Salary Governance Policy (SOP-GOV-024)',
    description: 'Strict 4-Eyes Separation of Duties for employee compensation: HR proposes adjustments with mandatory business justification, while Finance Manager or Executive Office authorizes before database mutation.',
    department: 'hr',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['HR Governance', 'Separation of Duties', 'Dual Control', '4-Eyes Principle', 'Payroll Security', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE COMPENSATION & FISCAL GOVERNANCE DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-GOV-024
POLICY: DUAL-CONTROL SALARY ADJUSTMENT & 4-EYES COMPENSATION LAW
CLASSIFICATION: MANDATORY — APPLIES TO ALL HR, FINANCE & EXECUTIVE PERSONNEL
TRACEABILITY: .agent/RULES.md (Rule 1 & Zero-Trust SoD Mandate)
================================================================================

1. ZERO UNILATERAL HR AUTHORITY (SEPARATION OF DUTIES)
--------------------------------------------------------------------------------
1.1 Absolute Ban on Direct HR Salary Mutation:
    - Under Zero-Trust and Separation of Duties (SoD), human resources personnel (hr, hr_manager) CANNOT unilaterally edit employee base salaries, bonus structures, or compensation fields directly in the database.
    - The legacy permission 'employees.edit_salary' is strictly revoked from HR roles and replaced with 'employees.propose_salary'.
1.2 4-Eyes Governance Queue:
    - All salary changes proposed by HR must be submitted as a formal SalaryChangeRequest through the central Dual-Control Salary Approval Queue (salary_requests).
    - Proposed adjustments remain strictly in 'pending' status until formally approved by Finance or Executive leadership.

2. DUAL-SIGN OFF & AUTHORIZATION TIERS
--------------------------------------------------------------------------------
2.1 Approver Role Boundaries:
    - Approval authority ('employees.approve_salary') is strictly restricted to:
        * Finance Manager (finance_manager)
        * Chief Executive Officer (CEO)
        * Super Administrator (super_admin)
2.2 Mandatory Justification Requirement:
    - Every proposed compensation adjustment must be accompanied by a structured business rationale (e.g. annual merit increase, role promotion, market benchmarking).
    - Unsubstantiated or zero-justification submissions are automatically rejected.
2.3 Anti-Collusion Self-Approval Prevention:
    - A manager or HR representative cannot approve their own salary adjustment request, even if they possess executive or finance credentials. Another independent authorized sign-off is mandatory.

3. NATIONAL CURRENCY & IMMUTABLE AUDIT LOGGING
--------------------------------------------------------------------------------
3.1 Sovereign Currency Integrity:
    - Salary change proposals record and enforce the sovereign currency of the employee's assigned facility (ETB in Ethiopia, KSh in Kenya, USh in Uganda).
3.2 Tamper-Proof Audit Trail:
    - Every action (proposal, approval, rejection with reason) generates an immutable, non-repudiable audit event in system_logs with timestamp, authenticated user ID, role, and delta metrics.`
  }
];
