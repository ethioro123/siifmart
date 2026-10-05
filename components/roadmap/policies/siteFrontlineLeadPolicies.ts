import { KnowledgeEntry } from '../RoadmapTypes';

export const SITE_FRONTLINE_LEAD_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-assistant-manager-sop-033',
    title: 'Assistant Manager Store Deputy, Floor Operations & Supervisory Overrides Policy (SOP-MGT-033)',
    description: 'Codifies the deputy leadership mandate of the Assistant Manager (Level 3, Rank 65): Register floor supervision, mid-day safe drops, cashier overrides, shelf merchandising, customer dispute triage, and shift lead direction.',
    department: 'stores',
    type: 'policy',
    priority: 'high',
    status: 'active',
    isStarred: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Assistant Manager',
      'Store Deputy',
      'Floor Operations',
      'POS Overrides',
      'Safe Drops',
      'Shift Leadership',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-033
ROLE: ASSISTANT MANAGER (LEVEL 3 — HIERARCHY RANK 65, MATRIX RANK 40)
REPORTS TO: STORE MANAGER (LEVEL 3, RANK 80) / WAREHOUSE MANAGER
SUPERVISES: SHIFT LEADS, STORE SUPERVISORS, CASHIERS & FLOOR CLERKS
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 3, Rule 4, Rule 15, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Assistant Manager operates at Level 3 (Site Deputy Leadership) with Hierarchy Rank 65 and Matrix Rank 40, reporting directly to the Store Manager.
    - Acts as second-in-command of the facility, directing day-to-day retail floor operations, supervising cashier lines, executing supervisory POS overrides, and ensuring seamless customer checkout flow.
1.2 Core Mission:
    - Maintain checkout wait times < 3 minutes; execute supervisory overrides within strict fraud thresholds (< 3%); supervise mid-day cash drops; enforce floor worker interchangeability; and uphold store security during assigned deputy shifts.

2. WHAT THE ASSISTANT MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Retail Suite & POS Command Operational Access:
    - Full operational access to assigned store systems:
      * POS Terminal & POS Command (/pos, /pos-dashboard)
      * Live Register Monitoring & Shift Dashboards
      * Sales Records & Customer Management (/sales, /customers)
      * Store Shelf Inventory & Replenishment (/inventory)
2.2 Supervisory POS Register Overrides (4-Eyes Principle):
    - Authorize cashier exceptions using authenticated Manager PIN with structured reason codes:
      * Customer returns with original receipt verification.
      * Cashier item voids and transaction cancels.
      * Unknown barcode resolution and price verification (SOP-POS-005).
      * No-sale drawer kicks for change verification or register inspection.
2.3 Mid-Day Cash Safe Drops & Float Auditing:
    - Execute and co-sign mandatory mid-day cash drops when register cash exceeds the safety limit (5,000 ETB / KSh).
    - Witness and co-sign shift opening float handovers.
2.4 Floor Workforce Deployment & Interchangeability (Rule 15):
    - Direct store floor workers across cashiering, stocking, shelf recovery, and cart collection.
    - Deploy floor workers dynamically to relieve checkout bottlenecks during peak retail hours.

3. WHAT THE ASSISTANT MANAGER CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 No Unilateral Policy or Price Alterations:
    - CANNOT edit base product prices, create custom store discounts, or change tax/VAT parameters.
3.2 No Standalone EOD Shift Closures or Safe Wipe:
    - Cannot execute final EOD safe balancing or deposit transfers without Store Manager co-signature or Central HQ verification.
3.3 Single-Site Lockdown & No Cross-Site Access:
    - Confined strictly to assigned facility (siteId = user.siteId). Zero access to other branches or executive margins.
3.4 Delivery Mission Assignment Lockout (Rule 15):
    - STRICTLY PROHIBITED from dispatching store floor workers to external vehicle delivery missions.

4. WHAT THE ASSISTANT MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 Shift Register Balancing & Cash Variance:
    - Under the Captain Owns the Ship doctrine, the Assistant Manager is directly co-accountable for any drawer discrepancies (> 50 ETB/KSh) occurring during their supervisory shift.
4.2 Override Velocity Compliance (< 3.0%):
    - Ensure total void and return override velocity remains strictly below 3.0% on their watch.
4.3 Customer Queue Speed (Wait Times < 3 Minutes):
    - Maintain average cashier queue wait times under 3 minutes through dynamic staff re-allocation.
4.4 Halal & Non-Alcoholic Floor Compliance (Rule 17):
    - Ensure zero alcoholic products or non-halal items are stocked, sold, or displayed.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Shift Audit Trail:
    - Every supervisory PIN entry, override, safe drop, and task assignment logs to system_logs with user ID, timestamp, and device GPS.
5.2 Disciplinary Matrix:
    - Tier 1 (Override Velocity > 3% or Long Queues): Operational coaching and register monitoring.
    - Tier 2 (Repeated Shift Variances or Unverified Drops): Formal reprimand, loss of supervisory bonus, and LP investigation.
    - Tier 3 (Register Collusion, Unauthorized Voids, or Theft): Immediate termination and legal action.
================================================================================`
  },
  {
    id: 'policy-shift-lead-sop-034',
    title: 'Shift Lead Operational Continuity, Frontline Supervision & Register Balancing Policy (SOP-MGT-034)',
    description: 'Codifies the frontline shift supervision mandate of the Shift Lead (Level 3, Rank 60): Frontline register support, shift opening/closing floats, low-tier overrides, aisle tidiness, break scheduling, and task cross-execution.',
    department: 'stores',
    type: 'policy',
    priority: 'high',
    status: 'active',
    isStarred: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Shift Lead',
      'Frontline Supervision',
      'Register Balancing',
      'Shift Handover',
      'Frontline Overrides',
      'Cross-Functional',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-034
ROLE: SHIFT LEAD (LEVEL 3 — HIERARCHY RANK 60, MATRIX RANK 42)
REPORTS TO: ASSISTANT MANAGER (LEVEL 3, RANK 65) / STORE MANAGER
SUPERVISES: CASHIERS, STOCK CLERKS & SALES ASSOCIATES (DURING SHIFT)
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 2, Rule 15, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Shift Lead operates at Level 3 (Frontline Shift Leadership) with Hierarchy Rank 60 and Matrix Rank 42, reporting to the Assistant Manager.
    - Serves as the active frontline leader on the sales floor or warehouse staging dock during a designated shift (morning, afternoon, or evening), governing register operations, staff rotations, and floor execution.
1.2 Core Mission:
    - Maintain 100% floor operational continuity; enforce cashier shift opening and closing procedures; assist cashiers with low-tier exceptions; uphold aisle merchandising standards; and maintain zero register cash variance.

2. WHAT THE SHIFT LEAD CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Shift Execution & Frontline Operational Access:
    - Frontline operational access to assigned store/warehouse tools:
      * POS Terminal & Shift Dashboard (/pos, /pos-dashboard)
      * Single-Site Inventory & Stock Levels (/inventory)
      * Shift Roster & Break Schedule Management
2.2 Frontline Low-Tier Register Overrides:
    - Authorize minor register exceptions with PIN and reason code:
      * Low-value item voids (customer change of mind prior to tender).
      * Barcode rescan verification and unknown barcode escalation.
      * Register paper roll replacement and peripheral connectivity resets.
2.3 Shift Opening Float Verification & Drawer Handover:
    - Count and verify opening cash drawer floats alongside assigned cashiers.
    - Supervise end-of-shift blind cash counts and safe envelope preparation.
2.4 Hands-On Cross-Functional Floor Execution (Rule 15):
    - Lead by example: actively cashier during peak queue spikes, stock shelves, organize checkout lanes, and assist customers.

3. WHAT THE SHIFT LEAD CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 No High-Value Overrides or Cash Refunds:
    - CANNOT approve customer cash refunds, transactions voids > threshold, or safe drops without Assistant/Store Manager presence.
3.2 No Alteration of Shift Records or Prices:
    - Cannot modify completed shift records, alter shelf prices, or adjust inventory balances in the database.
3.3 Single-Site Restriction:
    - Confined strictly to assigned facility during active shift hours.

4. WHAT THE SHIFT LEAD IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 Shift Punctuality & Register Float Accuracy:
    - Ensure all registers open on time (08:00) with verified opening floats. Accountable for drawer balance precision during their supervised shift.
4.2 Floor Presentation & Aisle Recovery:
    - Ensure shelves are restocked, aisles are unobstructed, and price tags are clean and visible before handing over shift.
4.3 Zero Unattended Cash:
    - Ensure cash drawers are locked at all times and cashiers do not abandon active registers.
4.4 Halal Catalog Standards (Rule 17):
    - 100% compliance: zero alcohol or prohibited items handled or displayed.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Shift Audit Trail:
    - Opening float confirmations, overrides, and shift handovers log to system_logs.
5.2 Disciplinary Matrix:
    - Tier 1 (Shift Tardiness or Float Discrepancy): Formal coaching and shift review.
    - Tier 2 (Repeated Drawer Shortages or Poor Floor Standards): Written reprimand and suspension of lead duties.
    - Tier 3 (Theft, Drawer Siphoning, or Collusion): Immediate termination and legal referral.
================================================================================`
  },
  {
    id: 'policy-store-supervisor-sop-035',
    title: 'Store Supervisor Floor Standards, Shelf Compliance & Merchandising Policy (SOP-MGT-035)',
    description: 'Codifies the retail merchandising mandate of the Store Supervisor (Level 3, Rank 55): Shelf planograms, price tag integrity, FEFO shelf rotation, front-facing presentation, register relief, and aisle safety standards.',
    department: 'stores',
    type: 'policy',
    priority: 'medium',
    status: 'active',
    isStarred: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Store Supervisor',
      'Merchandising',
      'Planograms',
      'Price Tags',
      'FEFO Rotation',
      'Shelf Integrity',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-035
ROLE: STORE SUPERVISOR (LEVEL 3 — HIERARCHY RANK 55, MATRIX RANK 41)
REPORTS TO: ASSISTANT MANAGER (LEVEL 3, RANK 65) / STORE MANAGER
SUPERVISES: STOCK CLERKS, MERCHANDISERS & SALES ASSOCIATES
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 2, Rule 15, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Store Supervisor operates at Level 3 (Merchandising & Floor Supervision) with Hierarchy Rank 55 and Matrix Rank 41, reporting to the Assistant Manager.
    - Serves as the custodian of sales floor presentation, shelf planograms, price tag compliance, and stock replenishment across all store departments (produce, grocery, dairy, household, meat).
1.2 Core Mission:
    - Maintain 100% price tag accuracy (shelf label matches register scan); enforce strict FEFO shelf rotation (front-facing nearest expiry); maintain impeccable aisle hygiene; and provide checkout relief during rush hours.

2. WHAT THE STORE SUPERVISOR CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Merchandising Suite & Floor Tools:
    - Full operational access to store floor modules:
      * Store Shelf Inventory & Stock Locations (/inventory)
      * Label & Barcode Tag Printing Hub (/wms-ops -> LABELS)
      * POS Register Relief Operation (/pos)
2.2 Shelf Replenishment & Planogram Enforcement:
    - Direct stock clerks in replenishing depleted shelf facings from backroom stock.
    - Enforce approved planogram layouts and eye-level product positioning for high-margin items.
2.3 Price Tag Auditing & Label Replacement:
    - Conduct daily price verification sweeps with handheld scanners, printing replacement price tags immediately when price updates are pushed from HQ.
2.4 Cross-Functional Floor Labor Execution (Rule 15):
    - Perform all floor duties: shelf recovery, customer greeting, stock staging, cart wrangling, and emergency cashiering.

3. WHAT THE STORE SUPERVISOR CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 No Self-Override or Price Creation:
    - CANNOT perform managerial overrides on their own cashier transactions (separation of duties).
    - Cannot fabricate new retail prices or modify system inventory counts.
3.2 No Unauthorized Waste Write-Offs:
    - Cannot dispose of damaged or expired stock without logging a waste ticket and presenting items to the Store Manager for sign-off.
3.3 Single-Site Restriction:
    - Confined strictly to assigned retail branch.

4. WHAT THE STORE SUPERVISOR IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 Price Tag Integrity (100% Parity):
    - 100% price accuracy: zero instances of shelf price tag mismatching POS checkout price. Discrepancies are penalized under the floor audit scoring system.
4.2 FEFO Shelf Rotation (Zero Expired Items on Shelf):
    - Enforce First-Expired, First-Out rotation on all grocery, dairy, and infant formula shelves. Any expired product discovered on customer shelves is a direct supervisory violation.
4.3 Aisle Safety & Spill Response:
    - Maintain spotless aisle safety: wet spills cordoned and cleaned within 2 minutes.
4.4 Halal Merchandising Purity (Rule 17):
    - Absolute guarantee that zero alcoholic beverages or non-halal items are stocked or displayed.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Shelf Audit Logging:
    - Daily price sweeps, label print logs, and aisle check-offs are recorded digitally.
5.2 Disciplinary Matrix:
    - Tier 1 (Price Tag Misalignment or Missing Labels): Mandatory relabeling sweep and counseling.
    - Tier 2 (Expired Stock on Shelf or FEFO Neglect): Formal reprimand and loss of merchandising bonus.
    - Tier 3 (Deliberate Price Tampering or Pilferage): Immediate termination and legal referral.
================================================================================`
  }
];
