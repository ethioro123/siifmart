import { KnowledgeEntry } from '../RoadmapTypes';

export const INVENTORY_AUDIT_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-weekly-cycle-count-sop-017',
    title: 'Weekly Cycle Counting, Zero-Trust Discrepancy Control & Retail Anti-Theft Protocol (SOP-OPS-017)',
    description: 'Mandatory 3-Tier Perpetual Weekly Cycle Count (Class-A High-Shrink, Anomaly-Triggered, Rotating Batch), 100% Blind Physical Verification, 4-Eyes Recount, Shift Roster Correlation, and HQ-Approved Stock Adjustments.',
    department: 'warehouses',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Weekly Count',
      'Cycle Count',
      'Zero-Trust',
      'Anti-Theft',
      'Blind Count',
      '4-Eyes Principle',
      'Shrinkage',
      'Loss Prevention',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE OPERATIONAL POLICY: INVENTORY AUDITING & ANTI-THEFT
STANDARD OPERATING PROCEDURE: SOP-OPS-017
POLICY: WEEKLY CYCLE COUNTING, ZERO-TRUST DISCREPANCY CONTROL & ANTI-THEFT
CLASSIFICATION: MANDATORY — ALL STORE MANAGERS, WAREHOUSE RECEIVERS & INVENTORY LEADS
APPLIES TO: ALL RETAIL STORES & DISTRIBUTION CENTERS (ETHIOPIA ET & KENYA KE)
TRACEABILITY: .agent/RULES.md (Zero-Trust Model, Blind Audits & Synaptic Mesh)
================================================================================

1. EXECUTIVE PURPOSE & THE 7-DAY DISCOVERY PRINCIPLE
--------------------------------------------------------------------------------
1.1 The 7-Day Window Mandate:
    - Traditional quarterly or monthly stock takes allow theft, collusion, and barcode-swapping to remain undetected for up to 90 days. By then, CCTV archives are wiped, shift rosters have cycled, and losses become untraceable.
    - This policy mandates a Weekly Cycle Count across all facilities to compress the theft discovery window down to a maximum of 7 days, localizing missing items to specific cashier shifts and delivery manifests.
1.2 Scope of Accountability:
    - Applies to all retail outlets, fulfillment warehouses and cold-chain hubs across all operating countries.

2. THE 3-TIER PERPETUAL WEEKLY CYCLE COUNT MODEL
--------------------------------------------------------------------------------
2.1 TIER 1 — High-Shrink & Class-A SKUs (Counted Every 7 Days):
    - Top 10-15% of SKUs representing 80% of shrinkage risk (e.g., premium cooking oil, infant milk formula, premium coffee/tea, electronics, high-end cosmetics, fresh meat).
    - Cadence: Every Tuesday before store opening (30-45 minutes total duration).
    - Quota: 50 to 150 designated High-Risk SKUs per facility.

2.2 TIER 2 — Anomaly & Exception Triggers (Real-Time Dynamic Queue):
    - Automatic POS Negative Stock Trigger: Any SKU whose on-hand balance drops to <= 0.
    - Automatic WMS Short-Pick Trigger: Any item flagged as "Short Pick" or "Not Found" during order fulfillment.
    - High-Void Trigger: Any item with >= 3 line-voids during a cashier shift.
    - Cadence: Automatically enqueued into the active week's mandatory audit batch.

2.3 TIER 3 — Rotating Department Batch (Perpetual 25% Coverage Per Week):
    - Week 1: Beverages, Dairy & Chilled Foods
    - Week 2: Dry Grocery, Pantry, Grains & Confectionery
    - Week 3: Personal Care, Household Goods & Cleaning Chemicals
    - Week 4: Backroom Overstock, Bulk Pallets & Staging Bins
    - Result: 100% of entire store and warehouse catalog audited every 30 days without operational fatigue or store closure.

3. MANDATORY BLIND PHYSICAL COUNTING
--------------------------------------------------------------------------------
3.1 Zero Expected Visibility:
    - Counting terminals, mobile scanners, and WMS tablets (CountOperations) strictly CONCEAL system expected quantities from the counter.
    - The screen displays only: Product Image, SKU Code, Item Title, and Shelf/Aisle Location.
    - Rubber-stamping (writing down system quantities without physically verifying) is computationally impossible.
3.2 Physical Barcode Verification:
    - Manual typing of SKU codes is prohibited for scannable units. The physical barcode on the packaging must be scanned to expose barcode-switching scams.
3.3 Tamper-Proof Event Logging:
    - Every count entry records: Employee ID, Device Fingerprint, Timestamp, GPS Coordinates, and Shift ID to system_logs.

4. 4-EYES PRINCIPLE & DISCREPANCY ESCALATION
--------------------------------------------------------------------------------
4.1 Tolerance Thresholds:
    - Class A High-Risk (Infant Formula, Cooking Oil, Electronics): Zero Tolerance (0 units variance). Any discrepancy triggers immediate recount and escalation.
    - General FMCG Goods: Maximum tolerance of <= 1% unit velocity or <= 2 units.
4.2 Mandatory 4-Eyes Blind Recount:
    - Any item exceeding tolerance triggers a second blind count assigned to a different staff member or shift lead.
    - The second counter is blind to both the system quantity and the first counter's entry.
4.3 Zero Autonomous Branch Authority:
    - Branch Managers and Warehouse Leads CANNOT unilaterally adjust inventory records or write off shrinkage.
    - All verified variances must be submitted through inventory_requests for Central HQ Audit Sign-Off.

5. THEFT INVESTIGATION & SHIFT ROSTER CORRELATION
--------------------------------------------------------------------------------
5.1 7-Day Shift Audit Packet:
    - When a shortage is approved, the system generates an audit packet correlating:
        * Cashiers who processed sales or voids for that SKU during the 7-day window.
        * Floor workers assigned to replenish or count that aisle.
        * Inbound delivery manifests received during that week.
5.2 CCTV Targeted Forensic Review:
    - Loss Prevention uses the precise 7-day window and shelf coordinates for forensic video review, eliminating blind searches.

6. SYNAPTIC NEURAL MESH CASCADE
--------------------------------------------------------------------------------
6.1 Downstream Synapses:
    - Financials: Approved shrinkage accrues immediately to the branch Shrinkage Loss Ledger.
    - POS: Prevents phantom sales of out-of-stock items.
    - Gamification: Stores with clean weekly counts earn National Leaderboard Accuracy Points; repeated unverified shortages penalize branch accuracy ratings.
    - Central Operations: Consecutive weekly variances flag high-risk telemetry warnings to executive management.

7. MULTI-COUNTRY CONFIG-GATING SCHEMA
--------------------------------------------------------------------------------
7.1 Country Isolation:
    - All thresholds (tolerance units, value limits, high-shrink category rosters) are strictly partitioned per country in countryConfigs[countryCode].
    - Defaults for Ethiopia (ET) and Kenya (KE) are managed independently.`
  }
];
