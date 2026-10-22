import { KnowledgeEntry } from './RoadmapTypes';
import { SECURITY_POLICIES } from './policies/securityPolicies';
import { FULFILLMENT_POLICIES } from './policies/fulfillmentPolicies';
import { INVENTORY_AUDIT_POLICIES } from './policies/inventoryAuditPolicies';
import { GOVERNANCE_POLICIES } from './policies/governancePolicies';
import { ARCHITECTURE_POLICIES } from './policies/architecturePolicies';
import { MANAGER_ROLE_POLICIES } from './policies/managerRolePolicies';
import { REPORTING_LINE_POLICIES } from './policies/reportingLinePolicies';
import { CORPORATE_MERCHANDISING_POLICIES } from './policies/corporateMerchandisingPolicies';

/**
 * DEFAULT_ROADMAP_POLICIES
 * Complete, highly organized, and traceable enterprise SOPs & operational policies
 * codified directly from the SIIFMART Master Rule Book (.agent/RULES.md).
 * 
 * Traceable SOP Registry:
 * - SOP-SEC-001: Zero-Trust Anti-Theft & Loss Prevention Policy
 * - SOP-POS-002: Blind Shift Reconciliation Step-by-Step SOP
 * - SOP-WMS-003: Warehouse & Store Inventory Anti-Shrinkage Protocol
 * - SOP-SEC-004: Policy on Preventing Theft and Overcharging
 * - SOP-POS-005: POS Theft Control: Cashier Operational Directive
 * - HR-OPS-006: Startup Employee Operations Playbook (Wase & Anti-Cartel)
 * - SOP-LOG-007: Chain of Custody & Acceptance Responsibility Policy
 * - SOP-OPS-008: Floor Worker Interchangeability & Delivery Lockdown Policy
 * - SOP-GOV-009: Multi-Country Tenant Isolation & National Sovereignty Policy
 * - SOP-INV-010: Multi-Country SKU & Cross-Border Scan Rejection Policy
 * - SOP-OPS-011: Sovereign Time, Calendar & Linguistic Purity Policy
 * - SOP-FIN-012: Dual Tax / VAT Controllability & Exempt Vendor Purchasing Policy
 * - SOP-GOV-013: Zero-Trust HQ Central Approval & 4-Eyes Governance Policy
 * - SOP-SYS-014: Synaptic Neural Mesh Operational Propagation Standard
 * - SOP-SYS-015: Mandatory Logic Config-Gating & Country Scoping Policy
 * - SOP-UX-016: Header Ergonomics & Heavy Action Hierarchy Standard
 * - SOP-OPS-017: Weekly Cycle Counting, Zero-Trust Discrepancy Control & Anti-Theft
 * - SOP-GOV-018: Manager & Supervisory Accountability Law ("The Captain Owns the Ship")
 * - SOP-MER-019: Non-Alcoholic / Halal Catalog Compliance Policy
 * - SOP-MGT-020: Regional Operations Manager Operational Authority & Supervisory Accountability Policy
 * - SOP-MGT-021: Head of Operations Operational Authority & Accountability Policy
 * - SOP-MGT-022: Head of Finance Fiscal Authority & Financial Accountability Policy
 * - SOP-MGT-023: Head of Human Resources Workforce Governance & Anti-Collusion Policy
 * - SOP-MGT-024: Head of Procurement Sourcing Authority & Supplier Accountability Policy
 * - SOP-MGT-025: Head of Supply Chain Logistics Authority & Network Accountability Policy
 * - SOP-MGT-026: Store Manager Retail Governance & Zero-Trust Accountability Policy
 * - SOP-MGT-027: Warehouse Manager Fulfillment Governance & Inventory Custody Policy
 * - SOP-MGT-028: Logistics Manager Transport Governance & Chain of Custody Policy
 * - SOP-MGT-029: Inventory Manager Stock Integrity & Variance Reconciliation Policy
 * - SOP-MGT-030: Security & LP Manager Surveillance, Asset Protection & Anti-Theft Policy
 * - SOP-MGT-031: Dispatch Manager Dock Operations, Route Sequencing & Delivery Lockdown Policy
 * - SOP-MGT-032: Customer Service Manager Support Governance & Return Oversight Policy
 * - SOP-MGT-033: Assistant Manager Store Deputy & Supervisory Overrides Policy
 * - SOP-MGT-034: Shift Lead Operational Continuity & Frontline Supervision Policy
 * - SOP-MGT-035: Store Supervisor Floor Standards, Shelf Compliance & Merchandising Policy
 * - SOP-ORG-036: Enterprise Dual-Control Reporting Lines, Supervisory Hierarchy & Cross-Functional Matrix Standard
 * - SOP-MER-037: Corporate Merchandising, Central Price Administration & Zero-Trust Pricing Policy
 */
export const DEFAULT_ROADMAP_POLICIES: KnowledgeEntry[] = [
  ...SECURITY_POLICIES,
  ...FULFILLMENT_POLICIES,
  ...INVENTORY_AUDIT_POLICIES,
  ...GOVERNANCE_POLICIES,
  ...ARCHITECTURE_POLICIES,
  ...MANAGER_ROLE_POLICIES,
  ...REPORTING_LINE_POLICIES,
  ...CORPORATE_MERCHANDISING_POLICIES
];

export {
  SECURITY_POLICIES,
  FULFILLMENT_POLICIES,
  INVENTORY_AUDIT_POLICIES,
  GOVERNANCE_POLICIES,
  ARCHITECTURE_POLICIES,
  MANAGER_ROLE_POLICIES,
  REPORTING_LINE_POLICIES,
  CORPORATE_MERCHANDISING_POLICIES
};
export { SITE_MANAGER_POLICIES } from './policies/siteManagerPolicies';
export { SITE_FUNCTIONAL_LEAD_POLICIES } from './policies/siteFunctionalLeadPolicies';
export { SITE_FRONTLINE_LEAD_POLICIES } from './policies/siteFrontlineLeadPolicies';



