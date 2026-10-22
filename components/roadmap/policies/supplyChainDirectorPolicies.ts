import { KnowledgeEntry } from '../RoadmapTypes';

export const SUPPLY_CHAIN_DIRECTOR_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-procurement-manager-sop-024',
    title: 'Country Commercial Director Sourcing Authority, PO Governance & Supplier Accountability Policy (SOP-MGT-024)',
    description: 'Defines the purchasing remit of the Country Commercial Director (Level 2, Rank 82): Vendor selection, Purchase Order authorization, landed cost margin protection, 3-way match compliance, and supplier fill-rate accountability.',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Country Commercial Director',
      'Sourcing',
      'Purchase Orders',
      'Landed Cost',
      'Supplier Governance',
      '3-Way Match',
      'Managerial Roles',
      'Captain Owns the Ship',
      'Zero-Trust',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-024
ROLE: HEAD OF PROCUREMENT (LEVEL 3 — HIERARCHY RANK 82)
REPORTS TO: CHIEF EXECUTIVE OFFICER (CEO / SUPER_ADMIN)
SUPERVISES: SOURCING BUYERS, DEMAND PLANNERS & VENDOR EXPEDITERS
TRACEABILITY: .agent/RULES.md (Rule 18: Supervisory Accountability & Anti-Collusion Model)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Country Commercial Director operates at Level 3 (HQ/Procurement Directorate) with a Hierarchy Rank of 82, reporting directly to the CEO.
    - Serves as the chief sourcing and vendor relationship authority of SIIFMART, governing commercial purchase contracts, purchase orders (PO), landed cost calculations, and supplier delivery performance across all national facilities.
1.2 Core Mission:
    - Secure dependable, ethical, and cost-effective supply lines for essential consumer goods (cooking oil, infant formula, coffee, tea, honey, grains, fresh meat); maintain supplier fill rates >= 95%; protect enterprise gross margins; and prevent vendor kickback collusion.

2. WHAT THE HEAD OF PROCUREMENT CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Procurement Suite Governance (/procurement):
    - Full supervisory authority over supplier databases, vendor contracts, purchasing catalogs, and purchase order lifecycles (ACCESS_PROCUREMENT, CREATE_PO, APPROVE_PO, DELETE_PO, MANAGE_SUPPLIERS).
    - Negotiate volume rebates, payment terms, and delivery schedules with authorized national distributors and agricultural cooperatives.
2.2 Landed Cost Transparency & Margin Formulations:
    - Unrestricted visibility into factory-gate prices, freight tariffs, and supplier landed costs (canViewCostPrice = true).
    - Collaborate with Merchandising and Finance (/pricing) to ensure target gross margins are maintained prior to purchase order commitment.
2.3 Dual Tax / VAT Purchasing Gating (SOP-FIN-012):
    - Configure line-item tax calculations on purchase orders (taxOnPurchasing), distinguishing between formal VAT-registered corporate vendors (15% ERCA / 16% KRA) and exempt local smallholder farmers.
2.4 Cross-Facility Sourcing & Replenishment Authority:
    - Multi-site purchasing authority (isMultiSiteRole = true) to issue direct-to-store or centralized DC purchase orders based on real-time network stock telemetry.
    - Authority to adjust reorder triggers and safety stock thresholds (canEditThresholds = true) alongside the Country Operations Director.
2.5 Vendor Returns & RMA Dispute Resolution:
    - Review and approve supplier returns and credit requests (approvalRole = 'country_commercial_director') for defective or short-delivered goods identified at receiving docks.
2.6 Staffing & Sourcing Team Management:
    - Direct supervisory authority to hire, onboard, and assign Sourcing Buyers (buyer) and Demand Planners (demand_planner) under canEmployRole().

3. WHAT THE HEAD OF PROCUREMENT CANNOT DO (ZERO-TRUST PROHIBITIONS)
--------------------------------------------------------------------------------
3.1 Zero Self-Receiving / Dock Sign-Off (Segregation of Duties):
    - Strictly prohibited from receiving or signing off on inbound deliveries at warehouse docks. Receiving must be conducted blindly by independent warehouse receiving custodians (receiver) to prevent phantom shipments.
3.2 Zero Unilateral Payment Disbursement:
    - Cannot disburse funds or execute bank payments to vendors. Payment release is strictly gated by Finance through the 3-Way Match Rule (PO + Dock Receiving Slip + Vendor Invoice).
3.3 Zero Non-Halal / Alcohol Onboarding (Rule 17):
    - Absolutely barred from negotiating, issuing purchase orders for, or onboarding alcoholic beverages (beer, wine, spirits) or non-halal items under any circumstances.
3.4 Zero Autonomous Shelf Price Alterations:
    - Cannot modify retail selling prices in POS. Retail prices are governed by Merchandising and Finance.
3.5 Zero Live Cash Till Access:
    - Barred from operating POS checkout registers or touching physical store cash floats.
3.6 Zero Cross-Border Vendor Commingling:
    - Pinned to the active country domain (country_code). Ethiopian supplier contracts and Birr purchase orders cannot be applied to Kenyan operations (and vice-versa).
3.7 Zero Audit Trail Deletion:
    - Cannot delete historical purchase orders, edit approved contract terms, or purge audit logs in system_logs.

4. WHAT THE HEAD OF PROCUREMENT IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP")
--------------------------------------------------------------------------------
4.1 Supplier Fill Rate & Continuity of Staple Goods (>= 95% SLA):
    - Accountable for maintaining an enterprise-wide supplier order fulfillment rate of >= 95%.
    - Out-of-stock events on essential high-velocity staples (cooking oil, infant formula, coffee, flour, sugar) due to delinquent purchase orders are directly attributed to the Country Commercial Director.
4.2 Landed Cost Budget Variance:
    - Held personally accountable for purchase price variance (PPV). Unbudgeted price increases accepted without executive approval trigger formal financial review.
4.3 Vendor Discrepancy & Credit Note Settlement (7-Day SLA):
    - Ensures all shortages and damaged goods logged during blind receiving docks are settled with vendor credit notes within 7 calendar days.
4.4 Ethical Sourcing & Anti-Kickback Standards:
    - Held strictly liable for vendor integrity. Any informal procurement arrangement, vendor kickback, or unapproved price inflation leads to immediate termination and legal referral.
4.5 Authenticated Supervisory Audit Footprint:
    - Every PO creation, price negotiation approval, contract award, or supplier cancellation must capture:
        * Authenticated managerId and Role
        * High-precision Server Timestamp
        * Hardware Fingerprint & GPS Coordinates
        * Mandatory Structured Reason Code`
  },
  {
    id: 'policy-supply-chain-manager-sop-025',
    title: 'Country Supply Chain Director End-to-End Logistics Authority, Fleet Governance & Network Accountability Policy (SOP-MGT-025)',
    description: 'Defines the macro logistics remit of the Country Supply Chain Director (Level 2, Rank 82): DC network throughput, inter-facility transfer routing, transit loss control, cold-chain compliance, and fleet safety accountability.',
    department: 'logistics',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Country Supply Chain Director',
      'Logistics',
      'Fleet Management',
      'Cold Chain',
      'Transit Security',
      'Chain of Custody',
      'Managerial Roles',
      'Captain Owns the Ship',
      'Zero-Trust',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-025
ROLE: HEAD OF SUPPLY CHAIN (LEVEL 3 — HIERARCHY RANK 82)
REPORTS TO: COUNTRY MANAGING DIRECTOR / CHIEF EXECUTIVE OFFICER (CEO)
SUPERVISES: LOGISTICS MANAGERS, DISPATCH MANAGERS, FLEET CONTROLLERS & TRANSIT DEPUTIES
TRACEABILITY: .agent/RULES.md (Rule 18: Supervisory Accountability & Rule 16: Chain of Custody)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Country Supply Chain Director operates at Level 3 (HQ/Supply Chain Directorate) with a Hierarchy Rank of 82, reporting to the Country Managing Director and CEO.
    - Serves as the macro supply chain architect and fleet logistics commander of SIIFMART, governing inter-facility freight routes, distribution center staging velocity, vehicle fleet telematics, cold-chain integrity, and transit security across all national logistics corridors.
1.2 Core Mission:
    - Eliminate stockouts through rapid inter-facility freight deployment; maintain transit shrinkage below 0.1%; safeguard cold-chain integrity for fresh meat, dairy, and perishables; and enforce uncompromising Chain of Custody across every cargo transfer.

2. WHAT THE HEAD OF SUPPLY CHAIN CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Macro Network Visibility & Flow Optimization (/network-inventory):
    - Full command over the national Network View, monitoring macro inventory levels, regional warehouse capacity, and transfer pipelines.
    - Authority to balance stock between distribution centers and dispatch bulk replenishment to high-velocity store clusters.
2.2 WMS Logistics & Outbound Dispatch Authority (/wms-ops):
    - Command over cross-docking operations, loading bays, transit staging docks, and outbound dispatch queues.
    - Authority to optimize delivery routes, establish carrier dispatch schedules, and mandate emergency multi-drop delivery manifests.
2.3 Carrier Contract & Fleet Telematics Management:
    - Authority to evaluate, onboard, and manage internal fleet assets and external commercial transport carriers.
    - Inspect real-time GPS fleet telematics, geofence corridor adherence, engine runtimes, and transit velocity across all delivery trucks and vans.
2.4 Freight Landed Cost Analysis:
    - Full visibility into transportation expenses, fuel surcharges, demurrage fees, and handling cost per kilometer (canViewCostPrice = true).
2.5 Staffing & Logistics Leadership:
    - Direct supervisory authority to hire, onboard, and evaluate Logistics Managers (regional_supply_chain_manager), Dispatch Managers (dispatch_supervisor), and Fleet Controllers under canEmployRole().

3. WHAT THE HEAD OF SUPPLY CHAIN CANNOT DO (ZERO-TRUST PROHIBITIONS)
--------------------------------------------------------------------------------
3.1 Zero Custody Handshake Bypass (SOP-LOG-007):
    - Strictly prohibited from bypassing the Digital Dual-Handshake or forcing receiving custodians to accept contested shipments without driver co-signatures.
3.2 Zero Floor Worker Delivery Violation (Rule 15 & SOP-OPS-008):
    - Absolutely barred from dispatching non-driver floor staff (pickers, packers, receivers) on external delivery missions. Delivery missions are strictly locked to certified drivers.
3.3 Zero Non-Halal / Alcohol Logistics (Rule 17):
    - Strictly forbidden from arranging freight, cross-docking, storage, or transit for alcoholic beverages or non-halal products under any circumstances.
3.4 Zero Unrecorded Off-Manifest Transit:
    - Cannot move goods off-manifest or allow informal "trunk-swaps" between vehicles. Every inter-facility transit requires a cryptographically validated Transfer ID.
3.5 Zero Cross-Border Cargo Commingling:
    - Pinned to the active country domain (country_code). Domestic Ethiopian cargo cannot cross into Kenya without formal customs clearance, export declarations, and separate cross-border manifests.
3.6 Zero Autonomous Retail Price Alterations:
    - Cannot modify retail shelf prices or create promotional discounts in POS.
3.7 Zero Audit Trail Deletion:
    - Cannot delete transfer manifests, alter driver delivery signatures, or purge transit anomaly logs in system_logs.

4. WHAT THE HEAD OF SUPPLY CHAIN IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP")
--------------------------------------------------------------------------------
4.1 Inter-Facility Transit Loss Ceiling (< 0.1%):
    - Accountable for maintaining transit shrinkage below 0.1% of shipped cargo value. Shortages or damages occurring between dispatch and receiving are directly investigated under the Country Supply Chain Director's supervision.
4.2 Network-Wide Essential Staple Availability (>= 98%):
    - Accountable for ensuring distribution centers maintain active buffer stocks of high-demand staple goods (cooking oil, infant formula, coffee, tea, honey, grains, fresh meat) to guarantee store replenishment.
4.3 Cold-Chain & Perishable Temperature Compliance (100%):
    - Held personally liable for cold-chain integrity during transport. Any batch spoiled due to unmonitored reefer breakdowns or delayed transit is co-attributed to the Country Supply Chain Director.
4.4 Fleet Roadworthiness & Driver Safety Compliance:
    - Ensures 100% of fleet vehicles have active inspections and commercial transit insurance, and all assigned drivers possess verified commercial licenses.
4.5 Authenticated Supervisory Audit Footprint:
    - Every inter-facility transfer order, route deviation approval, or carrier contract award must capture:
        * Authenticated managerId and Role
        * High-precision Server Timestamp
        * Hardware Fingerprint & GPS Coordinates
        * Mandatory Structured Reason Code`
  }
];

