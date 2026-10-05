import { KnowledgeEntry } from '../RoadmapTypes';

export const FULFILLMENT_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-chain-of-custody-sop-007',
    title: 'Chain of Custody & Acceptance Responsibility Policy (SOP-LOG-007)',
    description: 'The Golden Custody Rule ("You Inspect Before You Accept. The Moment You Accept, You Own It"): Digital Dual-Handshake, variance reporting, driver co-sign, and automated gamification penalties.',
    department: 'logistics',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Chain of Custody', 'Acceptance Responsibility', 'Dual-Handshake', 'Transfer Receiving', 'Discrepancy Penalties', 'Logistics', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE SUPPLY CHAIN LOGISTICS DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-LOG-007
POLICY: CHAIN OF CUSTODY & ACCEPTANCE RESPONSIBILITY LAW
CLASSIFICATION: MANDATORY — ALL WAREHOUSE RECEIVERS, STORE CUSTODIANS & DRIVERS
TRACEABILITY: .agent/RULES.md (Rule 16 & Section 12: Chain of Custody Law)
================================================================================

1. THE GOLDEN CUSTODY RULE: "YOU INSPECT BEFORE YOU ACCEPT. THE MOMENT YOU ACCEPT, YOU OWN IT."
--------------------------------------------------------------------------------
1.1 Acceptance Liability Principle:
    - Custody of any inventory batch, cargo transfer, pallet, or tote is strictly transferred only upon explicit physical inspection and digital certification.
    - The moment an authorized receiving custodian clicks "Confirm Receipt" or signs the transfer manifest, full legal and accounting custody transfers to that receiving site and individual.
    - If a receiver accepts a transfer without noting shortages, seal breaches, or damaged items on the digital manifest, any discrepancy discovered later becomes the direct liability and sole accountability of the accepting receiving custodian and branch. "The driver didn't tell me" or "I didn't have time to count" are legally invalid defenses.

2. DIGITAL DUAL-HANDSHAKE PROTOCOL
--------------------------------------------------------------------------------
2.1 Clean Transfer (Zero Discrepancy):
    - When all physical items, seals, lots, and units match the dispatch manifest in good condition:
    - The receiving custodian signs the single Digital Acceptance Certification.
    - Status immediately transitions to COMPLETED.

2.2 Contested Transfer (Shortages, Damages, Overages):
    - Whenever physical counts or condition do not match the expected shipment:
    - The receiver MUST flag the specific items as 'Damaged' or 'Short' with the verified count.
    - The system invokes the mandatory Digital Dual-Handshake:
        * Receiver signs certifying the physical count received.
        * Delivering Driver MUST co-sign the discrepancy log (via Driver PIN / Signature acknowledgement) confirming that the cargo was handed over short or damaged.
    - Unsigned discrepancy sheets cannot be finalized in the WMS.

3. GAMIFICATION ACCURACY & DISCREPANCY PENALTIES
--------------------------------------------------------------------------------
3.1 Synaptic Accuracy Cascade:
    - Every verified discrepancy immediately triggers an automated CHAIN_OF_CUSTODY_DISCREPANCY event.
    - The system calculates the discrepancy severity rate:
        * Rate = (Discrepant Units / Total Expected Units) * 100
    - A proportional penalty is automatically deducted from the responsible party's warehouse accuracy score and national leaderboard points:
        * Minor Discrepancy (1-5%): -15 to -50 pts, -2.5% to -5% accuracy score.
        * Moderate Discrepancy (6-20%): -50 to -150 pts, -5% to -15% accuracy score.
        * Severe Discrepancy (> 20%): Up to -500 pts and -35% accuracy score drop.
    - Penalty logs are published to the National Enterprise Gamification Leaderboard with public accountability tags.

4. TAMPER-PROOF AUDIT TRAIL
--------------------------------------------------------------------------------
4.1 System Log Immutability:
    - Every custody handshake logs an immutable record to system_logs with:
        * Transfer Manifest ID & Site IDs (Origin & Destination)
        * Delivering Driver Employee ID & Receiving Custodian Employee ID
        * High-precision Server Timestamp
        * Complete Item Breakdown (Expected vs Accepted vs Variance)
        * GPS Coordinates of Handover Location
4.2 Non-Repudiation:
    - Dual digital signatures are cryptographically bound to the audit record and cannot be edited, purged, or overridden.`
  },
  {
    id: 'policy-floor-worker-roles-sop-008',
    title: 'Floor Worker Interchangeability & Delivery Lockdown Policy (SOP-OPS-008)',
    description: 'Cross-functional floor interchangeability across warehouse roles (pick, pack, receive, count) and strict lockdown barring floor workers from delivery missions.',
    department: 'warehouses',
    type: 'policy',
    priority: 'high',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Floor Workers', 'Interchangeability', 'Cross-Functional', 'Delivery Lockdown', 'WMS', 'Roles', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & LOGISTICS DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-OPS-008
POLICY: FLOOR WORKER INTERCHANGEABILITY & DELIVERY LOCKDOWN LAW
CLASSIFICATION: MANDATORY — ALL WMS OPERATORS, STORE MANAGERS & DISPATCHERS
TRACEABILITY: .agent/RULES.md (Rule 15 & Section 11: Floor Worker Interchangeability)
================================================================================

1. FLOOR WORKER 100% CROSS-FUNCTIONAL INTERCHANGEABILITY
--------------------------------------------------------------------------------
1.1 Unified Floor Workforce:
    - In retail distribution centers and branch storerooms, floor workers are a single agile workforce.
    - The following role titles are 100% interchangeable across ALL internal floor jobs:
        * picker, packer, receiver, inventory_specialist, forklift_operator, stock_clerk
    - A worker designated as a "picker" can be assigned to or perform PUTAWAY, RECEIVE, COUNT, TRANSFER, REPLENISH, WASTE, or RETURNS without administrative role changes.
1.2 Driver Internal Floor Authorization:
    - Verified drivers (driver) are cross-trained and fully authorized to perform all internal floor jobs during non-transit windows (e.g. assisting in staging, sorting, loading, or bin replenishment).

2. STRICT DELIVERY MISSION LOCKDOWN
--------------------------------------------------------------------------------
2.1 Delivery Boundary Mandate:
    - Floor workers (pickers, packers, receivers, inventory specialists, stock clerks) are STRICTLY BARRED from accepting, being assigned to, or executing external delivery missions (DRIVER, DELIVERY, DISPATCH).
    - Delivery missions involve public transit, motor vehicles, cross-city transit liability, and cargo custody.
2.2 Verified Driver Exclusivity:
    - Only verified employees possessing valid commercial driving licenses, active vehicle insurance, and transit bonding (driver role) may accept delivery assignments.
2.3 Software-Enforced Guardrails:
    - The WMS job assignment engine (useJobActions, AssignAvailableWorkers, DriverJobBoard) programmatically rejects any attempt to assign a delivery mission to non-driver floor staff with a hard block:
      "Assignment Rejected: Delivery missions are strictly locked to verified drivers."`
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
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Inventory', 'Cycle Counts', 'Shrinkage', 'Warehouse Security', 'Stock Audit', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
INVENTORY ANTI-SHRINKAGE & VERIFICATION DIRECTIVE
WORKFLOW CODE: SOP-WMS-003
ROLE: WAREHOUSE MANAGERS, INVENTORY SPECIALISTS & AUDITORS
TRACEABILITY: .agent/RULES.md (Zero-Trust Blind Audits & Inventory Requests)
================================================================================

1. MANDATORY SCANNING PROTOCOL
--------------------------------------------------------------------------------
1.1 All stock movements (receiving, picking, packing, transfer, bin putaway) MUST be scanned with the barcode hardware scanner.
1.2 Manual keyboard entry of SKU codes is restricted and automatically flagged on the audit exception log.

2. WEEKLY ROTATIONAL BLIND CYCLE COUNTS
--------------------------------------------------------------------------------
2.1 Every branch must conduct blind rotational cycle counts covering 100% of high-value SKUs every 7 days.
2.2 Handheld scanner interfaces must NOT display the system expected quantity to the counter to prevent counters from writing down expected figures instead of physically counting units.

3. DISCREPANCY THRESHOLDS & ESCALATION
--------------------------------------------------------------------------------
3.1 Shrinkage < 0.2% of category value: Re-count conducted by a second independent stock clerk. If verified, adjusted with reason INTERNAL_SHRINKAGE.
3.2 Shrinkage >= 0.2% or high-value items (> 1,000 ETB / 2,500 KSh): Shelf location immediately locked for dispatch. WMS manager and Central Security notified for stock reconciliation and CCTV review.`
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
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['POS', 'Shift Close', 'Blind Reconciliation', 'Cashier Workflow', 'Cash Drawer', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
STANDARD OPERATING PROCEDURE: BLIND SHIFT RECONCILIATION
WORKFLOW CODE: SOP-POS-002
ROLE: POS CASHIERS & STORE SHIFT SUPERVISORS
TRACEABILITY: .agent/RULES.md (Zero-Trust Daily Cash & Shift Reconciliation)
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
2. Separate currency by denomination banknotes and coins.
3. Group and tally card merchant slips and electronic mobile-money (Telebirr / CBE Birr / M-Pesa) reference receipts.
4. Calculate total physical cash on hand using the till counting sheet.

STEP 3: BLIND TERMINAL ENTRY
1. On the POS Terminal shift close screen, the system will prompt:
   "ENTER TOTAL PHYSICAL CASH COUNTED IN DRAWER".
2. Note: The screen will deliberately NOT show the target amount or current system revenue.
3. Enter the exact counted cash figure in sovereign currency.
4. Enter total count of transaction slips.
5. Click [Submit Blind Count & Finalize Shift].

STEP 4: SERVER EVALUATION & AUDIT LOGGING
1. The server compares the submitted physical count against total recorded cash receipts minus starting float and refunds.
2. If exact match: System displays confirmation: "Shift Reconciled (Zero Variance)".
3. If discrepancy detected:
   - Variance is recorded instantly to the enterprise audit log table with event tag BLIND_SHIFT_CLOSE_VARIANCE.
   - The discrepancy amount is transmitted to Central Operations.
   - Cashier and supervisor must print the duplicate shift summary receipt, sign both copies, and deposit one copy inside the sealed night-drop deposit bag.

STEP 5: SAFE DEPOSIT
1. Deposit all cash matching the counted figure into the store drop-safe.
2. Under no circumstances may cash be stored in unmonitored drawers or carried off premises.`
  }
];
