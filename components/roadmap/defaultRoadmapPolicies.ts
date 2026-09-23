import { KnowledgeEntry } from './RoadmapTypes';

export const DEFAULT_ROADMAP_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-anti-theft-sop-001',
    title: 'Zero-Trust Anti-Theft & Loss Prevention Policy (SOP-SEC-001)',
    description: 'Comprehensive operational directives for cashier tills, branch management, blind shift close, and stock custody across all SIIFMART retail and warehouse sites.',
    department: 'policy',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-04T05:15:00.000Z',
    tags: ['Anti-Theft', 'Zero-Trust', 'Loss Prevention', 'Blind Reconciliation', 'Cash Security', 'SOP'],
    content: `================================================================================
SIIFMART ENTERPRISE LOSS PREVENTION DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-SEC-001
CLASSIFICATION: CONFIDENTIAL — CENTRAL HQ DIRECTIVE
SCOPE: ALL STORE MANAGERS, CASHIERS, WAREHOUSE LEADS & SUPERVISORS
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
        * Exact Variance (+/- ETB)
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
    - Any staff member witnessing internal inventory diversion, sweet-hearting (passing items without scanning), or till skimming is required to report directly to Central Operations via the confidential reporting portal.
6.2 Non-Retaliation Guarantee:
    - Reports submitted to Central HQ are processed under executive whistleblower protections with complete identity anonymization.`
  },
  {
    id: 'workflow-blind-shift-close-002',
    title: 'Blind Shift Reconciliation Step-by-Step SOP (SOP-POS-002)',
    description: 'Standard operating workflow for closing POS cash drawers, counting tender, and resolving audit variances without compromising zero-trust security.',
    department: 'pos',
    type: 'workflow',
    priority: 'high',
    status: 'active',
    isStarred: false,
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-04T05:15:00.000Z',
    tags: ['POS', 'Shift Close', 'Blind Reconciliation', 'Cashier Workflow', 'Cash Drawer'],
    content: `================================================================================
STANDARD OPERATING PROCEDURE: BLIND SHIFT RECONCILIATION
WORKFLOW CODE: SOP-POS-002
ROLE: POS CASHIERS & STORE SHIFT SUPERVISORS
================================================================================

PURPOSE:
To guarantee complete accountability of cash collected during each shift and prevent internal shrinkage by eliminating cashier pre-knowledge of drawer targets.

PROCEDURAL STEPS:

STEP 1: SUSPEND REGISTER TRANSACTIONS
1. Ring out the final customer in queue.
2. In the POS Terminal, select [Close Shift / Command Center].
3. Ensure no unfinalized or pending offline sales remain queued in the local sync buffer.

STEP 2: PHYSICAL TENDER TALLY (DRAWER REMOVAL)
1. In the presence of the shift supervisor (or under active CCTV coverage), remove the cash till drawer.
2. Separate currency by denomination:
   - 200 ETB banknotes
   - 100 ETB banknotes
   - 50 ETB banknotes
   - 10 ETB / 5 ETB banknotes and coins
3. Group and tally card merchant slips and electronic mobile-money (Telebirr / CBE Birr) reference receipts.
4. Calculate total physical cash on hand using the till counting sheet.

STEP 3: BLIND TERMINAL ENTRY
1. On the POS Terminal shift close screen, the system will prompt:
   "ENTER TOTAL PHYSICAL CASH COUNTED IN DRAWER".
2. Note: The screen will deliberately NOT show the target amount or current system revenue.
3. Enter the exact counted cash figure in Ethiopian Birr (ETB).
4. Enter total count of transaction slips.
5. Click [Submit Blind Count & Finalize Shift].

STEP 4: SERVER EVALUATION & AUDIT LOGGING
1. The server compares the submitted physical count against total recorded cash receipts minus starting float and refunds.
2. If exact match: System displays green confirmation: "Shift Reconciled (Zero Variance)".
3. If discrepancy detected:
   - Variance is recorded instantly to the enterprise audit log table with event tag BLIND_SHIFT_CLOSE_VARIANCE.
   - The discrepancy amount is transmitted to Central Operations.
   - Cashier and supervisor must print the duplicate shift summary receipt, sign both copies, and deposit one copy inside the sealed night-drop deposit bag.

STEP 5: SAFE DEPOSIT
1. Deposit all cash matching the counted figure into the store drop-safe.
2. Under no circumstances may cash be stored in unmonitored drawers or carried off premises.`
  },
  {
    id: 'policy-shrinkage-cycle-count-003',
    title: 'Warehouse & Store Inventory Anti-Shrinkage Protocol (SOP-WMS-003)',
    description: 'Physical inventory verification, blind cycle counting rules, and loss investigation thresholds for stock clerks and warehouse managers.',
    department: 'warehouses',
    type: 'policy',
    priority: 'high',
    status: 'active',
    isStarred: false,
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-04T05:15:00.000Z',
    tags: ['Inventory', 'Cycle Counts', 'Shrinkage', 'Warehouse Security', 'Stock Audit'],
    content: `================================================================================
INVENTORY ANTI-SHRINKAGE & VERIFICATION DIRECTIVE
WORKFLOW CODE: SOP-WMS-003
ROLE: WAREHOUSE MANAGERS, INVENTORY SPECIALISTS & AUDITORS
================================================================================

1. MANDATORY SCANNING PROTOCOL
- All stock movements (receiving, picking, packing, transfer, bin putaway) MUST be scanned with the barcode hardware scanner.
- Manual keyboard entry of SKU codes is restricted and automatically flagged on the audit exception log.

2. WEEKLY ROTATIONAL BLIND CYCLE COUNTS
- Every branch must conduct blind rotational cycle counts covering 100% of high-value SKUs every 7 days.
- Handheld scanner interfaces must NOT display the system expected quantity to the counter to prevent counters from writing down expected figures instead of physically counting units.

3. DISCREPANCY THRESHOLDS & ESCALATION
- Shrinkage < 0.2% of category value: Re-count conducted by a second independent stock clerk. If verified, adjusted with reason INTERNAL_SHRINKAGE.
- Shrinkage >= 0.2% or high-value items (> 1,000 ETB): Shelf location immediately locked for dispatch. WMS manager and Central Security notified for stock reconciliation and CCTV review.`
  },
  {
    id: 'policy-preventing-theft-overcharging-004',
    title: 'Policy on Preventing Theft and Overcharging',
    description: 'Mandatory rules prohibiting cash pocketing, informal price inflation, unreceipted sales, shortchanging, and ghost surcharges across all retail stores (SOP-SEC-004).',
    department: 'policy',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T05:25:00.000Z',
    tags: ['Overcharging', 'Anti-Theft', 'Zero-Trust', 'Receipt Mandate', 'Fair Pricing', 'Cashier Compliance', 'SOP'],
    content: `================================================================================
SIIFMART ENTERPRISE COMPLIANCE & INTEGRITY DIRECTIVE
POLICY: PREVENTING THEFT AND OVERCHARGING
DIRECTIVE CODE: SOP-SEC-004
CLASSIFICATION: MANDATORY — APPLIES TO ALL STORES & CASHIERS
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
    - Charging extra fees for electronic payment methods (Telebirr, CBE Birr, debit cards) is strictly forbidden.
    - The price displayed on the register screen and customer-facing monitor is the ONLY lawful price payable by the customer.
    - Cashiers who demand "cash handling fees" or informal tips will be dismissed immediately.

2.3 Shelf-to-Till Price Parity:
    - The shelf tag price must match the system scan price at all times.
    - Under the SIIFMART Fair Price Guarantee: If a customer is scanned an amount higher than the shelf price, the customer is entitled to the lower shelf price plus a 10% corrective refund, with the discrepancy logged against store management.

3. UNRECEIPTED SALES & CASH POCKETING PREVENTION
--------------------------------------------------------------------------------
3.1 The "Receipt Mandate" (No Receipt = Free Purchase):
    - Every transaction, without exception, must be finalized in the POS terminal and a printed official receipt handed to the customer.
    - Prominent signage must be displayed at every till stating in Amharic, Oromo, and English:
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
      1. "Your total is [Amount] Birr."
      2. "Received from you [Amount] Birr."
      3. "Your change is [Amount] Birr."
    - Cash change must be counted out in front of the customer onto the counter or directly into their hand, alongside the receipt.

4.2 Coin & Small Denomination Stocking:
    - Store managers are required to maintain adequate small denomination currency (5, 10, 50 Birr notes) in store floats to eliminate "rounding excuses" or refusing small change to customers.

5. AUDIT & MYSTERY SHOPPER SURVEILLANCE
--------------------------------------------------------------------------------
5.1 Central HQ Mystery Shoppers:
    - Central Operations deploys anonymous mystery shoppers weekly across all store branches.
    - Audits test:
      * Exact price charged vs shelf label
      * Immediate receipt issuance
      * Correct change return without request
      * Absence of informal digital payment requests (e.g. asking customer to send funds to a personal account instead of the store's merchant QR code)
5.2 Personal Digital Payment Diversion:
    - Requesting a customer to transfer funds to a cashier's personal Telebirr or bank account instead of the official SIIFMART merchant till is treated as direct embezzlement.

6. CUSTOMER WHISTLEBLOWER HOTLINE
--------------------------------------------------------------------------------
6.1 Customer Direct Line:
    - Every receipt footer includes a QR code and hotline:
      "Overcharged or denied a receipt? Call Central HQ Loss Prevention: [HQ Hotline] / WhatsApp: [HQ Line]."
6.2 Customer Rewards for Integrity Violations:
    - Customers who report verified overcharging or personal payment diversion receive a 500 ETB store credit reward funded by branch forfeiture.`
  },
  {
    id: 'policy-pos-theft-control-cashiers-005',
    title: 'POS theft control: cashiers',
    description: 'Comprehensive operational directives for cashier till security, running total concealment, blind shift closure, and discrepancy enforcement.',
    department: 'pos',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2025-12-20T20:24:00.000Z',
    updatedAt: '2026-09-04T05:25:00.000Z',
    tags: ['POS', 'Cashier', 'Anti-Theft', 'Blind Close', 'Loss Prevention', 'Cash Drawer'],
    content: `================================================================================
POS THEFT CONTROL: CASHIER OPERATIONAL DIRECTIVE
POLICY: CASHIER SECURITY, FLOAT HANDLING & TILL INTEGRITY
================================================================================

1. REGISTER ASSIGNMENT & ACCOUNTABILITY
- Each cashier is assigned a designated physical cash drawer and unique login PIN.
- Sharing of till logins or allowing another cashier to ring sales on your drawer is strictly prohibited and treated as a security breach.
- Floating cashiers are prohibited. Drawer handoffs require a full shift close count before the next cashier can log in.

2. RUNNING TOTAL CONCEALMENT (ANTI-SKIMMING)
- During active sales shifts, the terminal deliberately conceals the expected cash-in-drawer balance and cumulative tender breakdowns.
- Cashiers must focus on ringing items accurately without tracking variance targets.

3. DRAWER SECURITY & EXCESS CASH DROPS
- When cash in drawer exceeds 20,000 ETB, the cashier must request a supervisory "Cash Drop" to deposit excess currency into the drop-safe.
- Cash drops are logged with two-party authentication (Cashier + Supervisor) and signed deposit slips.

4. BLIND SHIFT CLOSE MANDATE
- At end of shift, cashier performs a physical currency count and inputs the counted total into the terminal.
- The system evaluates variance server-side against expected totals. Any variance produces a permanent BLIND_SHIFT_CLOSE_VARIANCE event.`
  },
  {
    id: 'playbook-ethiopia-staff-startup-ops-006',
    title: 'Startup Employee Operations Playbook (Ethiopia Retail & Tech)',
    description: 'Operational framework for managing retail, cashier, and warehouse employees in Ethiopia: Wase guarantor protocols, zero-shrinkage bonuses, anti-cartel rotation, and software-enforced neutrality (HR-OPS-001).',
    department: 'hr',
    type: 'workflow',
    priority: 'high',
    status: 'active',
    isStarred: true,
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T05:35:00.000Z',
    tags: ['Ethiopia', 'Staff Management', 'Startup', 'Wase', 'Incentives', 'Culture', 'Playbook', 'HR'],
    content: `================================================================================
STARTUP EMPLOYEE OPERATIONS PLAYBOOK (ETHIOPIA RETAIL & TECH)
DOCUMENT CODE: HR-OPS-001
APPLIES TO: FOUNDERS, REGIONAL MANAGERS, HR & STORE LEADS
================================================================================

1. THE COMPENSATION EQUATION: "MAKE HONESTY PROFITABLE"
--------------------------------------------------------------------------------
1.1 Inflation Realities: When living costs rise rapidly, low fixed wages create temptation. Pair a dependable base salary with performance incentives:
    - Weekly Team Zero-Shrinkage Pool: If a store/shift records zero cash variances and zero inventory shrinkage over the week, a direct bonus is distributed to the shift team.
    - Peer Accountability: Peer policing organically replaces supervisor policing when individual theft destroys the entire team's bonus.
1.2 Emergency Salary Advance Buffer: Establish an official micro-advance protocol for acute emergencies (family medical bills, rent deadlines) to prevent staff from dipping into till drawers informally.

2. THE TRADITIONAL GUARANTOR (WASE / ዋስ) & LEGAL VETTING
--------------------------------------------------------------------------------
2.1 Mandatory Institutional/Property Guarantor:
    - No cashier, driver, or warehouse custodian may handle cash or inventory without a vetted legal guarantor (Wase) with notarized liability documents.
2.2 Verified Identity & Residence:
    - Capture Kebele ID, police clearance certificate, and verified residential location.
2.3 Separation of Kinship (Anti-Collusion):
    - Strictly prohibit hiring relatives, spouses, or close social circle members into the same branch or shift (e.g. cashier + supervisor from the same family). Collusion is the primary vector for retail leakage.

3. "LET THE SOFTWARE BE THE BOSS" (SYSTEM-ENFORCED NEUTRALITY)
--------------------------------------------------------------------------------
3.1 Eliminating Interpersonal Conflict:
    - Direct human confrontation often leads to social friction or mediation pressure (Shimgilina).
    - Rely on immutable system logic: The POS terminal simply does not have a button to override prices or conceal a discrepancy.
3.2 The "Shield of Honor" Framing:
    - Present the system to employees as their protection: "If the till is short, our system proves who was on it. If you ring everything honestly, no one can ever falsely accuse you."

4. ANTI-CARTEL JOB ROTATION
--------------------------------------------------------------------------------
4.1 Quarterly Branch Transfers:
    - Rotate cashiers and store managers between branches every 3 to 6 months to prevent informal arrangements with local merchants or brokers (Delalas).
4.2 Randomized Shift Lead Pairings:
    - Vary opening/closing supervisor combinations so routines never become predictable.

5. DRIVE TOWARDS CASHLESS (TELEBIRR & CBE BIRR FIRST)
--------------------------------------------------------------------------------
5.1 Eliminate Physical Paper Currency:
    - Lower physical cash in-store directly reduces skimming temptation, counterfeit risk, and street robbery exposure.
5.2 Cashless Fast-Track Lanes:
    - Offer priority checkout lanes for digital payments.
    - Award small milestone bonuses to cashiers whose digital transaction volume exceeds 70%.

6. DIGNITY, BRANDED PRIDE & CAREER LADDERS
--------------------------------------------------------------------------------
6.1 Professional Status:
    - Equip staff with branded uniforms, digital ID smart badges, and Android handheld scanners to foster modern tech pride.
    - Upgrade job titles: e.g. "Terminal Operations Specialist" and "Logistics Inventory Controller."
6.2 Transparent Internal Growth:
    - Show clear advancement tracks from entry-level cashier/picker -> Shift Supervisor -> Regional Inventory Controller -> Central HQ Operations.

7. DAILY 10-MINUTE MORNING ALIGNMENT (QAL-MEBALEBAT)
--------------------------------------------------------------------------------
7.1 Shift Kickoff Routine:
    - Quick uniform and attendance inspection.
    - Review previous day's accuracy and customer feedback.
    - Reiterate integrity commitments: Every customer gets a receipt; every Birr is accounted for.
    - Give immediate public recognition to top performers.`
  }
];
