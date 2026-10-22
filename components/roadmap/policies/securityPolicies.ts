import { KnowledgeEntry } from '../RoadmapTypes';

export const SECURITY_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-anti-theft-sop-001',
    title: 'Zero-Trust Anti-Theft & Loss Prevention Policy (SOP-SEC-001)',
    description: 'Comprehensive operational directives for cashier tills, branch management, blind shift close, and stock custody across all retail and warehouse sites.',
    department: 'policy',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Anti-Theft', 'Zero-Trust', 'Loss Prevention', 'Blind Reconciliation', 'Cash Security', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE LOSS PREVENTION DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-SEC-001
CLASSIFICATION: CONFIDENTIAL — CENTRAL HQ DIRECTIVE
SCOPE: ALL STORE MANAGERS, CASHIERS, WAREHOUSE LEADS & SUPERVISORS
TRACEABILITY: .agent/RULES.md (Zero-Trust Oversight Model & Anti-Hacking Rules)
================================================================================

1. CORE FOUNDATION: ZERO-TRUST OPERATING MODEL
--------------------------------------------------------------------------------
1.1 Mandate: In retail operations throughout regional nodes and branches, trust is not assumed; compliance is cryptographically and operationally enforced.
1.2 No Local Bypass: Local store managers, shift supervisors, and cashiers have ZERO discretionary bypass authority for cash-sensitive operations, price overrides, void authorizations, or running financial metrics.
1.3 Centralized Oversight: Central HQ (CEO and executive audit teams) retains exclusive visibility over cross-site financial health, running sales tallies, and store asset valuations.

2. REGISTER & CASH-IN-DRAWER CONTROLS
--------------------------------------------------------------------------------
2.1 Real-Time Running Total Concealment (Anti-Skimming Shield):
    - Cashiers and store supervisors are STRICTLY BLINDED from viewing the expected cash-in-drawer balance or running shift total during business hours.
    - POS dashboards display only transaction counts and order volumes, preventing staff from calculating "safe skim amounts" before shift end.

2.2 Blind Shift Reconciliation Protocol:
    - At the end of every cashier shift, the cashier must count the physical cash, coins, and payment slips in the drawer without knowing the target system amount.
    - The cashier inputs their physical count into the POS Close Shift prompt blindly.
    - The system calculates variance server-side:
        * Variance = [Counted Cash] - [Expected System Cash]
    - If Variance != 0, an immutable audit event (BLIND_SHIFT_CLOSE_VARIANCE) is generated immediately, logging:
        * Cashier ID & Name
        * Shift Start & End Timestamps
        * Expected Cash Amount
        * Counted Cash Amount
        * Exact Variance (+/- ETB / KSh)
        * Active Device Fingerprint & GPS Location

2.3 Discrepancy Action Matrix:
    - Variance ±0 to 20 ETB: Recorded on daily audit ledger; monitored for recurring patterns.
    - Variance ±21 to 200 ETB: Mandatory written incident report signed by Cashier and Store Manager submitted to HQ Audit within 4 hours.
    - Variance > 200 ETB or any recurring deficit: Immediate suspension of cashier till access, register cash drawer sealed for forensic recount, and Central HQ security review.

3. PRICING, DISCOUNTS & PROMOTIONAL CONTROLS
--------------------------------------------------------------------------------
3.1 Discretionary Discounts Prohibited:
    - Manual percentage or flat-rate discount sliders are PERMANENTLY DISABLED at all checkout registers.
    - No cashier or store manager has authority to verbally offer or manually enter a discount for friends, relatives, or customers.

3.2 Central Campaign Codes Only:
    - Discounts are valid ONLY through official, alphanumeric promotional codes registered in Central HQ settings.
    - Each applied promotional code is validated in real time against expiry, minimum cart value, and usage limits.
    - Multiple codes per receipt are rejected by default.

3.3 Price Modifications:
    - Product selling prices and cost prices are centrally governed. Store branches CANNOT alter selling prices in the system under any circumstances.
    - Price changes must be initiated by Merchandising / Central HQ and deployed over the network.

4. INVENTORY INTEGRITY & LOSS PREVENTION (WMS & STORES)
--------------------------------------------------------------------------------
4.1 Dual-Verification Receiving:
    - Every inbound delivery from suppliers or Central Fulfillment must be barcode-scanned against the PO.
    - Visual approximations ("eyeball counting") are strictly prohibited. The system requires scanning every SKU unit or sealed master pack.

4.2 Blind Cycle Counts:
    - Regular stock checks must be conducted "blind": warehouse counters and store inventory specialists are given list of shelf locations to scan without being shown the expected on-hand quantity.
    - Any discrepancy between scanned units and system inventory triggers an automated review queue before inventory records can be adjusted.

4.3 Mandatory Stock Movement Justification:
    - Any manual stock reduction must require selecting a validated classification:
        * DAMAGED_GOODS (Requires supervisor sign-off and photo proof)
        * EXPIRED_STOCK (Requires lot/batch validation)
        * SUSPECTED_THEFT (Triggers instant incident notification to Central HQ)
        * SHRINKAGE_FOUND (Requires audit review)

5. DEVICE, NETWORK & PHYSICAL ACCESS GEOFENCING
--------------------------------------------------------------------------------
5.1 GPS & Device Authentication:
    - Every employee login captures hardware user-agent, operating system, and GPS coordinates.
    - Logins occurring outside registered branch geofences or during unassigned hours trigger high-priority security notifications.

5.2 Session Inactivity Timeouts:
    - POS terminals lock automatically after 3 minutes of inactivity. Cashiers must re-enter their secure credentials before resuming transactions.
    - Unattended registers left unlocked will result in disciplinary action under the store security guidelines.

5.3 No Cross-Site Access:
    - Personnel credentials are strictly scoped to their assigned branch (siteId).
    - Store personnel cannot query stock, revenue, or customer data belonging to other branches.

6. INCIDENT REPORTING & WHISTLEBLOWER ESCALATIONS
--------------------------------------------------------------------------------
6.1 Direct HQ Escalation Line:
    - Any staff member witnessing internal inventory diversion, sweet-hearting, or till skimming is required to report directly to Central Operations via the confidential reporting portal.
6.2 Non-Retaliation Guarantee:
    - Reports submitted to Central HQ are processed under executive whistleblower protections with complete identity anonymization.`
  },
  {
    id: 'policy-preventing-theft-overcharging-004',
    title: 'Policy on Preventing Theft and Overcharging (SOP-SEC-004)',
    description: 'Mandatory rules prohibiting cash pocketing, informal price inflation, unreceipted sales, shortchanging, and ghost surcharges across all retail stores.',
    department: 'policy',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Overcharging', 'Anti-Theft', 'Zero-Trust', 'Receipt Mandate', 'Fair Pricing', 'Cashier Compliance', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE COMPLIANCE & INTEGRITY DIRECTIVE
POLICY: PREVENTING THEFT AND OVERCHARGING
DIRECTIVE CODE: SOP-SEC-004
CLASSIFICATION: MANDATORY — APPLIES TO ALL STORES & CASHIERS
TRACEABILITY: .agent/RULES.md (Shelf-to-Till Parity & Anti-Fraud Oversight)
================================================================================

1. ZERO TOLERANCE STATEMENT
--------------------------------------------------------------------------------
1.1 Mandate: Overcharging customers, shortchanging cash change, quoting inflated prices, or pocketing unreceipted funds constitutes gross criminal misconduct.
1.2 Penalties: Any employee caught engaging in theft, price inflation, or receipt evasion will face immediate termination with cause, forfeiture of accrued bonuses, and formal referral to local law enforcement.

2. OVERCHARGING VECTORS & TECHNICAL MITIGATIONS
--------------------------------------------------------------------------------
2.1 Prohibition of Manual Price Entry:
    - Register terminals strictly lock unit prices to the Central HQ Master Database.
    - Cashiers CANNOT edit, type over, or adjust retail unit prices on the till.
    - If a barcode does not scan, the cashier must look up the SKU in the verified catalog. Manual "Open Item" or arbitrary amount entry is disabled.

2.2 Prohibition of Ghost Surcharges & Payment Fees:
    - Charging extra fees for electronic payment methods (Telebirr, CBE Birr, M-Pesa, debit cards) is strictly forbidden.
    - The price displayed on the register screen and customer-facing monitor is the ONLY lawful price payable by the customer.
    - Cashiers who demand "cash handling fees" or informal tips will be dismissed immediately.

2.3 Shelf-to-Till Price Parity:
    - The shelf tag price must match the system scan price at all times.
    - Under the SIIFMART Fair Price Guarantee: If a customer is scanned an amount higher than the shelf price, the customer is entitled to the lower shelf price plus a 10% corrective refund, with the discrepancy logged against store management.

3. UNRECEIPTED SALES & CASH POCKETING PREVENTION
--------------------------------------------------------------------------------
3.1 The "Receipt Mandate" (No Receipt = Free Purchase):
    - Every transaction, without exception, must be finalized in the POS terminal and a printed official receipt handed to the customer.
    - Prominent signage must be displayed at every till stating in the sovereign national language:
      "ATTENTION CUSTOMERS: DEMAND YOUR OFFICIAL PRINTED RECEIPT. IF THE CASHIER FAILS TO HAND YOU A SYSTEM RECEIPT BEFORE YOU LEAVE, YOUR ITEMS ARE FREE. REPORT EVASION TO HQ."

3.2 Cash Drawer Kick Security:
    - Till cash drawers are electronically locked and kick open ONLY upon printing an authorized transaction receipt.
    - Manual drawer releases (using key overrides) are strictly monitored via CCTV and trigger an automated security exception flag if performed without an active till supervisor session.

3.3 Sweethearting & Off-System Passing:
    - Passing merchandise over or around scanners without barcode verification ("sweethearting" to friends or accomplices) is monitored via overhead computer-vision CCTV audits and cashier void-rate trackers.
    - Cashiers with abnormal void ratios (> 3% of transactions) are automatically placed on audit watch.

4. SHORTCHANGING & CASH ACCURACY DIRECTIVES
--------------------------------------------------------------------------------
4.1 Verbal Currency Announcement:
    - Cashiers must verbally announce amounts in three distinct steps:
      1. "Your total is [Amount] [Currency]."
      2. "Received from you [Amount] [Currency]."
      3. "Your change is [Amount] [Currency]."
    - Cash change must be counted out in front of the customer onto the counter or directly into their hand, alongside the receipt.

4.2 Coin & Small Denomination Stocking:
    - Store managers are required to maintain adequate small denomination currency in store floats to eliminate "rounding excuses" or refusing small change to customers.

5. AUDIT & MYSTERY SHOPPER SURVEILLANCE
--------------------------------------------------------------------------------
5.1 Central HQ Mystery Shoppers:
    - Central Operations deploys anonymous mystery shoppers weekly across all store branches.
    - Audits test:
      * Exact price charged vs shelf label
      * Immediate receipt issuance
      * Correct change return without request
      * Absence of informal digital payment requests
5.2 Personal Digital Payment Diversion:
    - Requesting a customer to transfer funds to a cashier's personal account instead of the official SIIFMART merchant till is treated as direct embezzlement.`
  },
  {
    id: 'policy-pos-theft-control-cashiers-005',
    title: 'POS Theft Control: Cashier Operational Directive (SOP-POS-005)',
    description: 'Comprehensive operational directives for cashier till security, running total concealment, blind shift closure, and discrepancy enforcement.',
    department: 'pos',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2025-12-20T20:24:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['POS', 'Cashier', 'Anti-Theft', 'Blind Close', 'Loss Prevention', 'Cash Drawer', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
POS THEFT CONTROL: CASHIER OPERATIONAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-POS-005
CLASSIFICATION: MANDATORY — ALL POS OPERATORS & CASHIERS
TRACEABILITY: .agent/RULES.md (Shift Reconciliations & Drawer Governance)
================================================================================

1. REGISTER ASSIGNMENT & ACCOUNTABILITY
--------------------------------------------------------------------------------
1.1 Designated Till Assignment: Each cashier is assigned a designated physical cash drawer and unique login PIN.
1.2 No Till Sharing: Sharing of till logins or allowing another cashier to ring sales on your drawer is strictly prohibited and treated as a security breach.
1.3 Drawer Handoff Protocol: Floating cashiers are prohibited. Drawer handoffs require a full shift close count before the next cashier can log in.

2. RUNNING TOTAL CONCEALMENT (ANTI-SKIMMING)
--------------------------------------------------------------------------------
2.1 Shielded Metrics: During active sales shifts, the terminal deliberately conceals the expected cash-in-drawer balance and cumulative tender breakdowns.
2.2 Focus on Accuracy: Cashiers must focus on ringing items accurately without tracking variance targets.

3. DRAWER SECURITY & EXCESS CASH DROPS
--------------------------------------------------------------------------------
3.1 Threshold Drops: When cash in drawer exceeds the national threshold (20,000 ETB / 50,000 KSh), the cashier must request a supervisory "Cash Drop" to deposit excess currency into the drop-safe.
3.2 Dual Authentication: Cash drops are logged with two-party authentication (Cashier + Supervisor) and signed deposit slips.

4. BLIND SHIFT CLOSE MANDATE
--------------------------------------------------------------------------------
4.1 Physical Count: At end of shift, cashier performs a physical currency count and inputs the counted total into the terminal.
4.2 Server Evaluation: The system evaluates variance server-side against expected totals. Any variance produces a permanent BLIND_SHIFT_CLOSE_VARIANCE event.`
  },
  {
    id: 'playbook-ethiopia-staff-startup-ops-006',
    title: 'Startup Employee Operations Playbook (HR-OPS-006)',
    description: 'Operational framework for managing retail, cashier, and warehouse employees: Wase guarantor protocols, zero-shrinkage bonuses, anti-cartel rotation, and software-enforced neutrality.',
    department: 'hr',
    type: 'workflow',
    priority: 'high',
    status: 'active',
    isStarred: true,
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Staff Management', 'Wase', 'Incentives', 'Culture', 'Playbook', 'HR', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
STARTUP EMPLOYEE OPERATIONS PLAYBOOK
STANDARD OPERATING PROCEDURE: HR-OPS-006
APPLIES TO: FOUNDERS, REGIONAL OPERATIONS MANAGERS, HR & STORE LEADS
TRACEABILITY: .agent/RULES.md (Workforce Governance & Anti-Collusion Model)
================================================================================

1. THE COMPENSATION EQUATION: "MAKE HONESTY PROFITABLE"
--------------------------------------------------------------------------------
1.1 Weekly Team Zero-Shrinkage Pool: If a store/shift records zero cash variances and zero inventory shrinkage over the week, a direct bonus is distributed to the shift team.
1.2 Peer Accountability: Peer policing organically replaces supervisor policing when individual theft destroys the entire team's bonus.
1.3 Emergency Salary Advance Buffer: Official micro-advance protocol for acute emergencies to prevent staff from dipping into till drawers informally.

2. THE TRADITIONAL GUARANTOR (WASE / ዋስ) & LEGAL VETTING
--------------------------------------------------------------------------------
2.1 Mandatory Institutional/Property Guarantor: No cashier, driver, or warehouse custodian may handle cash or inventory without a vetted legal guarantor (Wase) with notarized liability documents.
2.2 Verified Identity & Residence: Capture verified National ID / Passport, police clearance certificate, and verified residential coordinates.
2.3 Separation of Kinship (Anti-Collusion): Strictly prohibit hiring relatives, spouses, or close social circle members into the same branch or shift. Collusion is the primary vector for retail leakage.

3. "LET THE SOFTWARE BE THE BOSS" (SYSTEM-ENFORCED NEUTRALITY)
--------------------------------------------------------------------------------
3.1 Eliminating Interpersonal Conflict: Avoid direct human confrontation that leads to social friction or mediation pressure (Shimgilina). Rely on immutable system logic.
3.2 Shield of Honor: "If the till is short, our system proves who was on it. If you ring everything honestly, no one can ever falsely accuse you."

4. ANTI-CARTEL JOB ROTATION
--------------------------------------------------------------------------------
4.1 Quarterly Branch Transfers: Rotate cashiers and store managers between branches every 3 to 6 months to prevent informal arrangements with local merchants or brokers (Delalas).
4.2 Randomized Shift Lead Pairings: Vary opening/closing supervisor combinations so routines never become predictable.`
  }
];
