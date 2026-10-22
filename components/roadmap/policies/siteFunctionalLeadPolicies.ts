import { KnowledgeEntry } from '../RoadmapTypes';

export const SITE_FUNCTIONAL_LEAD_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-security-manager-sop-030',
    title: 'Security & Loss Prevention Manager Surveillance, Asset Protection & Anti-Theft Policy (SOP-MGT-030)',
    description: 'Codifies the asset protection mandate of the Security & LP Manager (Level 3, Rank 70): CCTV surveillance, exit gate pass enforcement, unannounced blind audits, theft investigation, and anti-collusion oversight.',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Security Manager',
      'Loss Prevention',
      'Surveillance',
      'Exit Gate Pass',
      'Anti-Theft',
      'Audit Trail',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-030
ROLE: SECURITY & LOSS PREVENTION MANAGER (LEVEL 3 — HIERARCHY RANK 70, MATRIX RANK 35)
REPORTS TO: HEAD OF OPERATIONS (LEVEL 3, RANK 95) / REGIONAL OPERATIONS MANAGER
SUPERVISES: SECURITY GUARDS, SURVEILLANCE MONITORS & LOSS PREVENTION AUDITORS
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 3, Rule 5, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Security & LP Manager operates at Level 3 (Functional Site/Regional Security) with Hierarchy Rank 70 and Matrix Rank 35, reporting to the Head of Operations.
    - Serves as the chief asset protection and loss prevention authority for retail facilities and warehouse distribution hubs, governing physical security, CCTV surveillance, exit gate passes, and fraud investigations.
1.2 Core Mission:
    - Maintain an impenetrable physical and digital security perimeter; enforce the Exit Gate Pass verification protocol (SOP-SEC-001); conduct unannounced blind asset audits; investigate cashier override spikes (> 3%); and eliminate internal theft cartels.

2. WHAT THE SECURITY & LP MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Surveillance & Physical Access Governance:
    - Unrestricted supervisory control over CCTV camera feeds, access control doors, perimeter alarms, and visitor registries across assigned facilities.
    - Direct security guards stationed at store entrances, staff locker checkpoints, and loading dock bays.
2.2 Exit Gate Pass Protocol & Vehicle Inspection (SOP-SEC-001 & SOP-SEC-004):
    - Enforce mandatory exit gate pass scanning for all outbound customer vehicles, transfer trucks, and staff dismissals.
    - Inspect physical cargo against digital manifests prior to authorizing gate departure.
2.3 Loss Prevention Auditing & Tamper-Proof Log Inspection:
    - Full read access to system_logs security telemetry: drawer open events without sale, price lookup frequency, void spikes, and off-hours logins.
    - Conduct unannounced blind physical inspections of high-shrink commodity shelves and storage cages (cooking oil, infant formula, coffee, cosmetics, electronics, fresh meat).
2.4 Fraud Investigation & Evidence Preservation:
    - Detain suspects, preserve video footage, take employee statements, and compile formal fraud dockets for HQ Legal and police referral.

3. WHAT THE SECURITY & LP MANAGER CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 Separation of Duties — Zero Operational Access (Anti-Collusion):
    - STRICTLY PROHIBITED from operating cash registers, processing sales, handling store cash vaults, or performing inventory adjustments in the database.
3.2 No Unilateral Seizure or Confiscation without 4-Eyes Sign-Off:
    - Cannot impound stock or detain staff without logging an incident report and co-signing with the on-duty Store/Warehouse Manager.
3.3 No Tampering with CCTV or Audit Logs:
    - Zero administrative permission to delete, alter, or disable surveillance recordings or digital audit footprints.

4. WHAT THE SECURITY & LP MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 Physical Security Perimeter Integrity:
    - Accountable for 100% operational uptime of CCTV cameras, dock access readers, and alarm systems.
4.2 High-Shrink Commodity Protection (Rule 17):
    - Guarantee zero unexplained shrinkage in locked storage cages (infant formula, coffee, electronics, fresh meat). Ensure zero alcohol presence in any facility.
4.3 Investigation SLA (< 48 Hours):
    - 100% of cash drawer discrepancies > 500 ETB/KSh or cashier override spikes > 3% must be investigated within 48 hours.
4.4 Exit Gate Pass Compliance:
    - 100% enforcement: zero vehicles permitted to depart facilities without a verified, scanned digital gate pass.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Cryptographic Audit Trail:
    - All security incident reports, gate scans, and log reviews capture investigator ID, timestamp, facility ID, and GPS coordinates into system_logs.
5.2 Disciplinary Matrix:
    - Tier 1 (Delayed Investigation or Gate Log Lapses): Formal reprimand and security refresher training.
    - Tier 2 (Security Breaches or Negligent Surveillance): Forfeiture of security bonus and internal affairs review.
    - Tier 3 (Theft Collusion, Bribe Solicitation, or Log Tampering): Immediate termination and criminal prosecution.
================================================================================`
  },
  {
    id: 'policy-dispatch-manager-sop-031',
    title: 'Dispatch Manager Dock Operations, Route Sequencing & Delivery Lockdown Policy (SOP-MGT-031)',
    description: 'Codifies the outbound shipping mandate of the Dispatch Manager (Level 3, Rank 70): Dock staging, route optimization, vehicle load verification, strict Delivery Lockdown enforcement, and transfer manifest sign-off.',
    department: 'logistics',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Dispatch Manager',
      'Outbound Logistics',
      'Dock Scheduling',
      'Delivery Lockdown',
      'Driver Assignment',
      'Manifest Sign-Off',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-031
ROLE: DISPATCH MANAGER (LEVEL 3 — HIERARCHY RANK 70, MATRIX RANK 34)
REPORTS TO: LOGISTICS MANAGER (LEVEL 3, RANK 75) / HEAD OF OPERATIONS
SUPERVISES: DOCK CONTROLLERS, FLEET DISPATCHERS & STAGING COORDINATORS
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 15, Rule 16, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Dispatch Manager operates at Level 3 (Operational Dispatch Leadership) with Hierarchy Rank 70 and Matrix Rank 34, reporting to the Logistics Manager.
    - Governs outbound dock bays, truck staging lanes, trailer loading sequences, departure schedules, and verified driver mission assignments for all store transfers and customer deliveries.
1.2 Core Mission:
    - Enforce strict dock departure turnaround (<= 30 min); verify vehicle load manifests; enforce the Delivery Lockdown (Rule 15); and guarantee the Digital Dual-Handshake Chain of Custody (Rule 16).

2. WHAT THE DISPATCH MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Dock Command & Dispatch Suite Access:
    - Full operational authority over fulfillment dispatch modules:
      * Outbound Staging & Departures (/wms-ops -> DOCKS, DRIVER, ASSIGN)
      * Vehicle Route Sequencing & Load Optimization
      * Digital Transfer Manifest Issuance & Verification (/wms-ops -> TRANSFER)
2.2 Verified Driver Mission Assignment (Rule 15):
    - Assign scheduled routes and delivery orders to authorized, verified company drivers.
    - Authorize idle drivers to perform warehouse floor support tasks during staging periods.
2.3 Chain of Custody Dual-Sign Departure Manifests (Rule 16):
    - Perform final physical verification of pallet count, temperature seals, and cargo strapping.
    - Co-sign the digital departure manifest alongside the assigned driver prior to dock release.
2.4 Dock Bay Safety & Turnaround Optimization:
    - Schedule dock bay arrival slots for supplier inbound trucks and company outbound fleets to prevent dock yard congestion.

3. WHAT THE DISPATCH MANAGER CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 Delivery Lockdown Breach Strictly Prohibited (Rule 15):
    - STRICTLY PROHIBITED from assigning warehouse floor workers (pickers, packers, receivers, inventory specialists) to vehicle delivery missions. Delivery is exclusively locked to verified drivers.
3.2 No Unauthorized Shipments or Unmanifested Cargo:
    - CANNOT release any vehicle from the dock without an electronically validated, digitally co-signed transfer manifest.
3.3 No Modification of Retail Prices or Inventory Balances:
    - Zero permission to alter product prices, write off stock, or adjust inventory balances in the database.

4. WHAT THE DISPATCH MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 Dock Departure Turnaround (<= 30 Minutes):
    - Maintain average vehicle loading and dispatch turnaround <= 30 minutes from staging completion.
4.2 Zero Unmanifested Cargo Infractions:
    - 100% manifest accuracy: zero short-shipments or extra pallets dispatched without digital documentation.
4.3 Delivery Lockdown Enforcement:
    - 100% compliance: zero unauthorized or non-driver personnel assigned to external delivery missions.
4.4 Halal & Non-Alcoholic Cargo Verification (Rule 17):
    - Verify that all dispatched pallets comply 100% with halal standards and contain zero alcoholic items.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Dispatch Audit Footprint:
    - Every vehicle release, manifest signature, driver assignment, and departure timestamp logs to system_logs.
5.2 Disciplinary Matrix:
    - Tier 1 (Dock Delays or Staging Errors): Workflow re-evaluation and dock counseling.
    - Tier 2 (Delivery Lockdown Violation or Unverified Departures): Formal reprimand, loss of dispatch bonus, and audit investigation.
    - Tier 3 (Fictitious Manifests, Ghost Dispatching, or Smuggling): Immediate dismissal and criminal charges.
================================================================================`
  },
  {
    id: 'policy-cs-manager-sop-032',
    title: 'Customer Service Manager Support Governance, Escalations & Return Oversight Policy (SOP-MGT-032)',
    description: 'Codifies the customer experience mandate of the CS Manager (Level 3, Rank 70): Customer complaints, escalation triage, return authorization audits, refund policy enforcement, and customer satisfaction SLA governance.',
    department: 'stores',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: [
      'Customer Service Manager',
      'Escalations',
      'Customer Returns',
      'Refund Audit',
      'Customer Satisfaction',
      'SLA Governance',
      'Captain Owns the Ship',
      'Zero-Trust',
      'Managerial Roles',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MGT-032
ROLE: CUSTOMER SERVICE MANAGER (LEVEL 3 — HIERARCHY RANK 70, MATRIX RANK 36)
REPORTS TO: HEAD OF OPERATIONS (LEVEL 2, RANK 90) / STORE MANAGER
SUPERVISES: CUSTOMER SERVICE REPRESENTATIVES & HELPDESK AGENTS
TRACEABILITY: .agent/RULES.md (Rule 1, Rule 3, Rule 17, Rule 18)
================================================================================

1. EXECUTIVE MANDATE & ROLE CHARTER
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Customer Service Manager operates at Level 3 (Functional Support Leadership) with Hierarchy Rank 70 and Matrix Rank 36, reporting to the Head of Operations.
    - Governs retail customer support channels, service desk operations, customer return escalations, warranty dispute resolutions, and customer satisfaction SLAs across national retail channels.
1.2 Core Mission:
    - Maintain customer satisfaction CSAT >= 90%; resolve escalated customer tickets within 4 hours; enforce retail return policies without compromising fraud prevention; and audit return abuse.

2. WHAT THE CUSTOMER SERVICE MANAGER CAN DO (AUTHORIZED POWERS)
--------------------------------------------------------------------------------
2.1 Customer Service Suite & CRM Access:
    - Supervisory control over customer engagement modules:
      * Customer Directory & Order History (/customers, /sales)
      * Support Escalation Desk & Feedback Ticketing
      * Return Dispute Resolution & Store Credit Approvals
2.2 Return Policy Oversight & Goodwill Store Credit:
    - Review escalated customer return claims for damaged, missing, or substandard merchandise.
    - Authorize goodwill store credits or replacement orders up to the authorized threshold (1,000 ETB / KSh) with mandatory photo proof and reason codes.
2.3 Customer Experience & Service SLA Monitoring:
    - Track frontline service response times, first-contact resolution rates, and cashier customer interaction quality.
2.4 Return Abuse & Serial Refunder Auditing:
    - Flag suspicious repeat return patterns, fraudulent receipt re-use, and serial returners for investigation by the Loss Prevention Manager.

3. WHAT THE CUSTOMER SERVICE MANAGER CANNOT DO (STRICT PROHIBITIONS & ZERO-TRUST GUARDRAILS)
--------------------------------------------------------------------------------
3.1 No Direct Cash Drawer Access or Cash Payouts:
    - CANNOT perform physical cash register payouts directly to customers. All approved refunds must execute via POS cashiers with dual supervisory sign-off.
3.2 No Override of Perishable Food Safety Disposals:
    - Strictly prohibited from accepting or restringing returned perishable items (dairy, fresh meat, opened food). Defective food items must be condemned to waste.
3.3 No Manual Point Inflation or Balance Manipulation:
    - Cannot fabricate customer loyalty point balances or alter pricing databases.

4. WHAT THE CUSTOMER SERVICE MANAGER IS ACCOUNTABLE FOR ("CAPTAIN OWNS THE SHIP" — RULE 18)
--------------------------------------------------------------------------------
4.1 Escalation Resolution SLA (< 4 Hours):
    - Accountable for resolving 95% of customer escalation tickets within 4 business hours.
4.2 Customer Satisfaction Ceiling (CSAT >= 90%):
    - Maintain enterprisewide customer satisfaction rating >= 90% across retail and delivery feedback surveys.
4.3 Return Fraud Prevention:
    - Guarantee that 100% of customer return credits have verified receipt scans and documented reason codes. Net customer return credits must remain <= 1.0% of retail sales.
4.4 Halal & Ethical Service Standard (Rule 17):
    - Ensure courteous, dignified, and strictly halal customer communications. Zero promotion or endorsement of non-compliant products.

5. AUDIT TRAIL, GPS FOOTPRINT & DISCIPLINARY MATRIX
--------------------------------------------------------------------------------
5.1 Customer Audit Logging:
    - Every dispute resolution, credit authorization, and ticket closure is logged in system_logs with user ID, customer ID, ticket number, and reason code.
5.2 Disciplinary Matrix:
    - Tier 1 (SLA Breaches or Ticket Backlogs): Supervisory review and agent re-assignment.
    - Tier 2 (Unverified Credits > Threshold or High Return Rates): Formal reprimand, loss of service bonus, and audit review.
    - Tier 3 (Fictitious Customer Accounts, Kickback Schemes, or Credit Siphoning): Immediate termination and legal referral.
================================================================================`
  }
];
