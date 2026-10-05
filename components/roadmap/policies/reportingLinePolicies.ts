import { KnowledgeEntry } from '../RoadmapTypes';

export const REPORTING_LINE_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-dual-control-reporting-lines-sop-036',
    title: 'Enterprise Dual-Control Reporting Lines, Supervisory Hierarchy & Cross-Functional Matrix Standard (SOP-ORG-036)',
    description: 'Codifies the 4-tier organizational hierarchy (L1-L4), dual-line reporting matrix (Solid-Line Operational vs Dotted-Line Functional Governance), escalation thresholds, 4-Eyes dual sign-offs, and supervisory accountability under Rule 18 ("The Captain Owns the Ship").',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-03T00:00:00.000Z',
    updatedAt: '2026-10-03T00:00:00.000Z',
    tags: [
      'Reporting Lines',
      'Dual-Matrix',
      'Organizational Hierarchy',
      'Supervisory Accountability',
      'Captain Owns the Ship',
      '4-Eyes Principle',
      'Zero-Trust',
      'Chain of Command',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-ORG-036
POLICY: ENTERPRISE DUAL-CONTROL REPORTING LINES & CROSS-FUNCTIONAL MATRIX STANDARD
GOVERNANCE: 4-TIER HIERARCHY, SOLID-LINE SUPERVISION & DOTTED-LINE GOVERNANCE
TRACEABILITY: .agent/RULES.md (Rule 1: Zero-Trust, Rule 18: Supervisory Accountability, Rule 12: Chain of Custody)
================================================================================

1. EXECUTIVE MANDATE & DUAL-MATRIX ARCHITECTURE
--------------------------------------------------------------------------------
1.1 Dual-Dimension Organizational Structure:
    - To eliminate operational bottlenecks while enforcing strict Zero-Trust corporate governance, SIIFMART operates under an advanced Dual-Line Matrix structure:
      a) SOLID LINE (Direct Operational / Supervisory Chain of Command):
         * Controls shift rostering, attendance, task assignment, daily physical oversight, floor discipline, and primary performance reviews.
      b) DOTTED LINE (Functional / Governance / Compliance Chain of Command):
         * Controls fiscal integrity, inventory reconciliations, quality assurance, safety standards, anti-theft audits, and statutory compliance.
1.2 Four-Tier Hierarchy Levels (L1 to L4):
    - LEVEL 1 (Executive C-Suite): Chief Executive Officer (CEO / Super Admin).
      * Overall strategic vision, multi-country tenancy governance, national capital allocation, and executive approvals.
    - LEVEL 2 (Corporate & Regional Directorates): Regional Managers, Operations Managers, Finance Managers, HR Managers, Procurement Managers, Supply Chain Managers.
      * Multi-site cluster governance, corporate budget controls, cross-functional policy enforcement, and executive escalations.
    - LEVEL 3 (Facility Operations Managers & Floor Supervisors): Store Managers, Warehouse Managers, Logistics Managers, Inventory Managers, Security Managers, Dispatch Managers, Assistant Managers, Shift Leads, Store Supervisors, Fleet Maintenance Supervisors.
      * Facility-level "Captain of the Ship" accountability, shift opening/closing sign-offs, register overrides, dock handshakes, and team leadership.
    - LEVEL 4 (Specialists, Frontline Operators & Staff): Cashiers, Pickers, Packers, Receivers, Drivers, Inventory Specialists, Sourcing Buyers, Planners, Accountants, Payroll Specialists.
      * Task execution, barcode scanning, POS checkout, cycle counts, fleet transit, and transactional data fidelity.

2. AUTHORITATIVE SOLID-LINE REPORTING CHANNELS (CHAIN OF COMMAND)
--------------------------------------------------------------------------------
2.1 Executive & Regional Leadership (L1 -> L2):
    - CEO (super_admin) directs:
      * Regional Manager (Multi-site cluster leadership)
      * Finance Manager (Treasury, accounting, audits, taxation)
      * HR Manager (Talent, compensation, training, labor compliance)
      * Procurement Manager (Sourcing, vendor relations, import customs, QC)
      * Supply Chain Manager (Network logistics, inventory modeling, replenishment)
2.2 Store Operations Directorate (L2 -> L3 -> L4):
    - Operations Manager directs Store Managers across retail facilities.
    - Store Manager directs:
      * Assistant Manager (Deputy floor command & supervisory escalations)
      * Store Supervisor (Merchandising, pricing tags, shelf compliance)
      * Merchandiser (Facing, shelf displays, promotional placement)
      * Returns Clerk (Customer returns triage and reverse logistics staging)
    - Assistant Manager directs Shift Leads across opening, mid, and closing shifts.
    - Shift Lead directs frontline retail staff:
      * Cashiers (POS checkout, drawer tenders, receipt issuance)
      * Sales Associates (Customer guidance, queue management, stock replenishment)
2.3 Warehouse & Distribution Operations (L2 -> L3 -> L4):
    - Operations Manager & Supply Chain Manager direct Warehouse Managers.
    - Warehouse Manager directs warehouse floor specialists:
      * Inbound Receivers (Dock unloading, blind counts, pallet staging)
      * Order Pickers (FEFO batch picking, picking cart assembly)
      * Order Packers (Validation scanning, carton sealing, shipping labels)
      * Forklift Operators (High-bay putaway, pallet replenishment)
2.4 Logistics & Transport Directorate (L2 -> L3 -> L4):
    - Supply Chain Manager directs Logistics Manager.
    - Logistics Manager directs:
      * Dispatch Manager (Fleet routing, trip manifests, dock departures)
      * Fleet Maintenance Supervisor (Vehicle health, fuel cards, roadworthiness)
    - Dispatch Manager directs:
      * Transport Drivers (External deliveries, branch transfers, custody manifests)
      * Dispatchers (Route sequencing, driver dispatch, live transit monitoring)
2.5 Supply Chain & Inventory Integrity Directorate (L2 -> L3 -> L4):
    - Supply Chain Manager directs:
      * Demand Planner (AI sales forecasting, seasonal safety stocks)
      * Replenishment Planner (Velocity analysis, DC-to-store transfer triggers)
      * Inventory Manager (Discrepancy audits, shrink mitigation, batch aging)
    - Inventory Manager directs:
      * Inventory Specialists (Cycle counts, zone audits, discrepancy deep-dives)
      * Stock Clerks (Bin labeling, physical consolidation, shelf restocking)
2.6 Finance Directorate (L2 -> L4):
    - Finance Manager directs:
      * Senior Internal Auditor (Unannounced branch audits, till audits, compliance)
      * Financial Accountant (General ledger, bank reconciliations, vendor payables)
      * Treasury Officer (Liquidity management, cash-in-transit, bank drops)
      * Tax Compliance Officer (KRA / ERCA / URA tax filings, VAT withholding)
      * Credit Control Officer (Corporate debtor aging, credit collections)
      * Data Analyst (Operational KPI telemetry, margin analysis, trend models)
2.7 Human Resources Directorate (L2 -> L4):
    - HR Manager directs:
      * HR Generalist (Employee records, contracts, onboarding)
      * Talent Recruiter (Candidate sourcing, interviews, background checks)
      * Training Coordinator (Floor worker training, safety certifications, onboarding)
      * Payroll Specialist (Bi-weekly payroll preparation, benefits, deductions)

3. DOTTED-LINE FUNCTIONAL GOVERNANCE & 4-EYES ESCALATIONS
--------------------------------------------------------------------------------
3.1 Cashiers -> Finance Manager (Fiscal Dotted Line):
    - While daily shift tasks are supervised by the Shift Lead, Cashiers have a strict Dotted Line to Finance.
    - Cash drawer opening floats, mid-shift drops, and EOD Z-Reports sync directly to the Central Finance ledger. Cash variances exceeding $5.00 / 500 ETB / 500 KSh require Finance notification.
3.2 Inbound Receivers -> Inbound QC / Procurement (Integrity Dotted Line):
    - While reporting operationally to the Warehouse Manager, Receivers maintain a Dotted Line to Procurement QC.
    - Any discrepancy between supplier PO and physical delivery must be flagged to Procurement immediately. Shortages cannot be resolved informally.
3.3 Transport Drivers -> Fleet Maintenance Supervisor (Safety Dotted Line):
    - While dispatched daily by the Dispatch Manager, Drivers report on a Dotted Line to the Fleet Maintenance Supervisor for pre-trip vehicle condition checklists, tire/brake checks, and fuel card logs.
3.4 Inventory Specialists -> Internal Auditor (Independent Audit Dotted Line):
    - Inventory Specialists execute blind counts under the Inventory Manager, but report variance sheets on a Dotted Line to the Internal Auditor to prevent intra-facility concealment of stock shrink.
3.5 Payroll Specialist -> Finance Manager (Dual-Sign Compensation Dotted Line):
    - Under SOP-GOV-024, payroll runs and salary adjustments prepared by HR require co-authorization and release of funds by the Finance Manager before disbursement.

4. THE "CAPTAIN OWNS THE SHIP" DOCTRINE (RULE 18 COMPLIANCE)
--------------------------------------------------------------------------------
4.1 On-Duty Responsibility:
    - Every supervisory leader (L2 Director, L3 Facility Manager, L3 Shift Lead) is legally and operationally the "Captain" of their operational unit.
    - Shortages, unaccounted voids, unauthorized write-offs, or unrecorded damages on their watch are co-attributed to the on-duty supervisor's record.
4.2 Supervisory Override Velocity:
    - Shift leads and store managers must not abuse supervisory PIN overrides. If an individual supervisor's override rate exceeds 3% of branch transactions, an automated Central HQ audit flag is raised.
4.3 Zero Unilateral HQ-Bypassing Authority:
    - No supervisor or manager may unilaterally edit catalog retail prices, adjust physical inventory without blind counting, or delete system logs. Every high-risk workflow requires 4-Eyes dual sign-off.

5. MULTI-COUNTRY TENANCY & NATIONAL SOVEREIGNTY (RULES 7 & 8)
--------------------------------------------------------------------------------
5.1 Absolute Territorial Scoping:
    - All supervisory chains of command terminate cleanly at the sovereign national border.
    - Kenyan store managers, warehouse leads, and drivers report exclusively through the Kenyan national operations hierarchy (KE).
    - Ethiopian store managers, warehouse leads, and drivers report exclusively through the Ethiopian national operations hierarchy (ET).
    - Under no circumstances may a facility manager in Nairobi supervise staff or sign manifests for a facility in Addis Ababa, or vice-versa.
    - Cross-country visibility and global consolidation are strictly reserved for the CEO (Level 1) via the single global switch.
================================================================================`
  }
];
