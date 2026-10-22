import { describe, it, expect } from 'vitest';
import { DEFAULT_ROADMAP_POLICIES } from '../components/roadmap/defaultRoadmapPolicies';
import { INVENTORY_AUDIT_POLICIES } from '../components/roadmap/policies/inventoryAuditPolicies';

describe('Roadmap Policies Registry', () => {
  it('includes SOP-OPS-017 Weekly Cycle Counting & Anti-Theft Protocol', () => {
    const weeklyCountPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-weekly-cycle-count-sop-017'
    );
    expect(weeklyCountPolicy).toBeDefined();
    expect(weeklyCountPolicy?.title).toContain('SOP-OPS-017');
    expect(weeklyCountPolicy?.content).toContain('3-TIER PERPETUAL WEEKLY CYCLE COUNT MODEL');
    expect(weeklyCountPolicy?.content).toContain('7-DAY DISCOVERY PRINCIPLE');
    expect(weeklyCountPolicy?.content).toContain('MANDATORY BLIND PHYSICAL COUNTING');
    expect(weeklyCountPolicy?.content).toContain('4-EYES PRINCIPLE');
    expect(weeklyCountPolicy?.isStarred).toBe(true);
    expect(weeklyCountPolicy?.priority).toBe('critical');
  });

  it('guarantees all default roadmap policy IDs are 100% unique', () => {
    const ids = DEFAULT_ROADMAP_POLICIES.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('enforces all policies have complete metadata and content', () => {
    for (const policy of DEFAULT_ROADMAP_POLICIES) {
      expect(policy.id).toBeTruthy();
      expect(policy.title).toBeTruthy();
      expect(policy.description).toBeTruthy();
      expect(policy.department).toBeTruthy();
      expect(policy.type).toBeTruthy();
      expect(policy.priority).toBeTruthy();
      expect(policy.status).toBe('active');
      expect(policy.content?.length).toBeGreaterThan(100);
      expect(Array.isArray(policy.tags)).toBe(true);
      expect(policy.tags.length).toBeGreaterThan(0);
    }
  });

  it('verifies INVENTORY_AUDIT_POLICIES export consistency', () => {
    expect(INVENTORY_AUDIT_POLICIES.length).toBeGreaterThan(0);
    expect(INVENTORY_AUDIT_POLICIES[0].id).toBe('policy-weekly-cycle-count-sop-017');
  });

  it('includes SOP-MGT-020 Regional Manager Operational Authority & Accountability Policy', () => {
    const regionalManagerPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-regional-manager-sop-020'
    );
    expect(regionalManagerPolicy).toBeDefined();
    expect(regionalManagerPolicy?.title).toContain('SOP-MGT-020');
    expect(regionalManagerPolicy?.title).toContain('Regional Operations Manager');
    expect(regionalManagerPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(regionalManagerPolicy?.content).toContain('WHAT THE REGIONAL OPERATIONS MANAGER CAN DO');
    expect(regionalManagerPolicy?.content).toContain('WHAT THE REGIONAL OPERATIONS MANAGER CANNOT DO');
    expect(regionalManagerPolicy?.content).toContain('isMultiSiteRole = true');
    expect(regionalManagerPolicy?.priority).toBe('critical');
    expect(regionalManagerPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-021 Head of Operations Operational Authority & Accountability Policy', () => {
    const opsManagerPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-operations-manager-sop-021'
    );
    expect(opsManagerPolicy).toBeDefined();
    expect(opsManagerPolicy?.title).toContain('SOP-MGT-021');
    expect(opsManagerPolicy?.title).toContain('Country Operations Director');
    expect(opsManagerPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(opsManagerPolicy?.content).toContain('Central Operations Control Room');
    expect(opsManagerPolicy?.content).toContain('Enterprise Fulfillment SLA Performance');
    expect(opsManagerPolicy?.priority).toBe('critical');
    expect(opsManagerPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-022 Head of Finance Fiscal Authority & Accountability Policy', () => {
    const finManagerPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-finance-manager-sop-022'
    );
    expect(finManagerPolicy).toBeDefined();
    expect(finManagerPolicy?.title).toContain('SOP-MGT-022');
    expect(finManagerPolicy?.title).toContain('Country Finance Director');
    expect(finManagerPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(finManagerPolicy?.content).toContain('Daily Shift Reconciliation & Z-Report Sign-Off');
    expect(finManagerPolicy?.content).toContain('Procurement PO Financial Authorization');
    expect(finManagerPolicy?.department).toBe('finance');
    expect(finManagerPolicy?.priority).toBe('critical');
    expect(finManagerPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-023 Head of Human Resources Workforce Governance & Accountability Policy', () => {
    const hrManagerPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-hr-manager-sop-023'
    );
    expect(hrManagerPolicy).toBeDefined();
    expect(hrManagerPolicy?.title).toContain('SOP-MGT-023');
    expect(hrManagerPolicy?.title).toContain('Country HR Director');
    expect(hrManagerPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(hrManagerPolicy?.content).toContain('Wase / Guarantor Bypass');
    expect(hrManagerPolicy?.content).toContain('Anti-Cartel Rotation Execution');
    expect(hrManagerPolicy?.department).toBe('hr');
    expect(hrManagerPolicy?.priority).toBe('critical');
    expect(hrManagerPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-024 Head of Procurement Sourcing Authority & Accountability Policy', () => {
    const procManagerPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-procurement-manager-sop-024'
    );
    expect(procManagerPolicy).toBeDefined();
    expect(procManagerPolicy?.title).toContain('SOP-MGT-024');
    expect(procManagerPolicy?.title).toContain('Country Commercial Director');
    expect(procManagerPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(procManagerPolicy?.content).toContain('Zero Self-Receiving');
    expect(procManagerPolicy?.content).toContain('Supplier Fill Rate');
    expect(procManagerPolicy?.priority).toBe('critical');
    expect(procManagerPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-025 Head of Supply Chain Logistics Authority & Accountability Policy', () => {
    const scmPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-supply-chain-manager-sop-025'
    );
    expect(scmPolicy).toBeDefined();
    expect(scmPolicy?.title).toContain('SOP-MGT-025');
    expect(scmPolicy?.title).toContain('Country Supply Chain Director');
    expect(scmPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(scmPolicy?.content).toContain('Inter-Facility Transit Loss');
    expect(scmPolicy?.content).toContain('Zero Custody Handshake Bypass');
    expect(scmPolicy?.department).toBe('logistics');
    expect(scmPolicy?.priority).toBe('critical');
    expect(scmPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-026 Store Manager Retail Governance & Zero-Trust Accountability Policy', () => {
    const storeMgrPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-store-manager-sop-026'
    );
    expect(storeMgrPolicy).toBeDefined();
    expect(storeMgrPolicy?.title).toContain('SOP-MGT-026');
    expect(storeMgrPolicy?.title).toContain('Store Manager');
    expect(storeMgrPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(storeMgrPolicy?.content).toContain('Supervisory Override Velocity Ceiling (< 3.0%)');
    expect(storeMgrPolicy?.content).toContain('Blind Inbound Receiving & Transfer Inspection');
    expect(storeMgrPolicy?.content).toContain('Delivery Mission Assignment Lockout');
    expect(storeMgrPolicy?.department).toBe('stores');
    expect(storeMgrPolicy?.priority).toBe('critical');
    expect(storeMgrPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-027 Warehouse Manager Fulfillment Governance & Inventory Custody Policy', () => {
    const whMgrPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-warehouse-manager-sop-027'
    );
    expect(whMgrPolicy).toBeDefined();
    expect(whMgrPolicy?.title).toContain('SOP-MGT-027');
    expect(whMgrPolicy?.title).toContain('Warehouse Manager');
    expect(whMgrPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(whMgrPolicy?.content).toContain('Warehouse Inventory Shrinkage & Loss Ceiling');
    expect(whMgrPolicy?.content).toContain('FEFO Compliance & Cold-Chain Monitoring');
    expect(whMgrPolicy?.department).toBe('warehouses');
    expect(whMgrPolicy?.priority).toBe('critical');
    expect(whMgrPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-028 Logistics Manager Transport Governance & Chain of Custody Policy', () => {
    const logMgrPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-logistics-manager-sop-028'
    );
    expect(logMgrPolicy).toBeDefined();
    expect(logMgrPolicy?.title).toContain('SOP-MGT-028');
    expect(logMgrPolicy?.title).toContain('Logistics Manager');
    expect(logMgrPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(logMgrPolicy?.content).toContain('Delivery Lockdown Breach Strictly Prohibited');
    expect(logMgrPolicy?.content).toContain('In-Transit Shrinkage & Loss Ceiling');
    expect(logMgrPolicy?.department).toBe('logistics');
    expect(logMgrPolicy?.priority).toBe('critical');
    expect(logMgrPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-029 Inventory Manager Stock Integrity & Variance Reconciliation Policy', () => {
    const invMgrPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-inventory-manager-sop-029'
    );
    expect(invMgrPolicy).toBeDefined();
    expect(invMgrPolicy?.title).toContain('SOP-MGT-029');
    expect(invMgrPolicy?.title).toContain('Inventory Manager');
    expect(invMgrPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(invMgrPolicy?.content).toContain('Weekly Blind Cycle Count Governance');
    expect(invMgrPolicy?.content).toContain('Inventory Record Accuracy (IRA >= 98.5%)');
    expect(invMgrPolicy?.department).toBe('warehouses');
    expect(invMgrPolicy?.priority).toBe('critical');
    expect(invMgrPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-030 Security & LP Manager Asset Protection Policy', () => {
    const secPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-security-manager-sop-030'
    );
    expect(secPolicy).toBeDefined();
    expect(secPolicy?.title).toContain('SOP-MGT-030');
    expect(secPolicy?.title).toContain('Security & Loss Prevention Manager');
    expect(secPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(secPolicy?.content).toContain('Exit Gate Pass Protocol');
    expect(secPolicy?.content).toContain('Separation of Duties — Zero Operational Access');
    expect(secPolicy?.department).toBe('admin');
    expect(secPolicy?.priority).toBe('critical');
    expect(secPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-031 Dispatch Manager Dock Operations Policy', () => {
    const dispatchPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-dispatch-manager-sop-031'
    );
    expect(dispatchPolicy).toBeDefined();
    expect(dispatchPolicy?.title).toContain('SOP-MGT-031');
    expect(dispatchPolicy?.title).toContain('Dispatch Manager');
    expect(dispatchPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(dispatchPolicy?.content).toContain('Delivery Lockdown Breach Strictly Prohibited');
    expect(dispatchPolicy?.content).toContain('Dock Departure Turnaround (<= 30 Minutes)');
    expect(dispatchPolicy?.department).toBe('logistics');
    expect(dispatchPolicy?.priority).toBe('critical');
    expect(dispatchPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-032 Customer Service Manager Support Governance Policy', () => {
    const csPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-cs-manager-sop-032'
    );
    expect(csPolicy).toBeDefined();
    expect(csPolicy?.title).toContain('SOP-MGT-032');
    expect(csPolicy?.title).toContain('Customer Service Manager');
    expect(csPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(csPolicy?.content).toContain('Return Policy Oversight & Goodwill Store Credit');
    expect(csPolicy?.content).toContain('Escalation Resolution SLA (< 4 Hours)');
    expect(csPolicy?.department).toBe('stores');
    expect(csPolicy?.priority).toBe('critical');
    expect(csPolicy?.isStarred).toBe(true);
  });

  it('includes SOP-MGT-033 Assistant Manager Store Deputy Policy', () => {
    const asstMgrPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-assistant-manager-sop-033'
    );
    expect(asstMgrPolicy).toBeDefined();
    expect(asstMgrPolicy?.title).toContain('SOP-MGT-033');
    expect(asstMgrPolicy?.title).toContain('Assistant Manager');
    expect(asstMgrPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(asstMgrPolicy?.content).toContain('Supervisory POS Register Overrides (4-Eyes Principle)');
    expect(asstMgrPolicy?.content).toContain('Mid-Day Cash Safe Drops & Float Auditing');
    expect(asstMgrPolicy?.department).toBe('stores');
    expect(asstMgrPolicy?.priority).toBe('high');
  });

  it('includes SOP-MGT-034 Shift Lead Operational Continuity Policy', () => {
    const shiftLeadPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-shift-lead-sop-034'
    );
    expect(shiftLeadPolicy).toBeDefined();
    expect(shiftLeadPolicy?.title).toContain('SOP-MGT-034');
    expect(shiftLeadPolicy?.title).toContain('Shift Lead');
    expect(shiftLeadPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(shiftLeadPolicy?.content).toContain('Frontline Low-Tier Register Overrides');
    expect(shiftLeadPolicy?.content).toContain('Shift Opening Float Verification & Drawer Handover');
    expect(shiftLeadPolicy?.department).toBe('stores');
    expect(shiftLeadPolicy?.priority).toBe('high');
  });

  it('includes SOP-MGT-035 Store Supervisor Merchandising Policy', () => {
    const supervisorPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-store-supervisor-sop-035'
    );
    expect(supervisorPolicy).toBeDefined();
    expect(supervisorPolicy?.title).toContain('SOP-MGT-035');
    expect(supervisorPolicy?.title).toContain('Store Supervisor');
    expect(supervisorPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
    expect(supervisorPolicy?.content).toContain('Price Tag Auditing & Label Replacement');
    expect(supervisorPolicy?.content).toContain('FEFO Shelf Rotation (Zero Expired Items on Shelf)');
    expect(supervisorPolicy?.department).toBe('stores');
    expect(supervisorPolicy?.priority).toBe('medium');
  });

  it('includes SOP-GOV-024 Dual-Control Compensation & Salary Governance Policy', () => {
    const salaryPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-dual-control-salary-sop-024'
    );
    expect(salaryPolicy).toBeDefined();
    expect(salaryPolicy?.department).toBe('hr');
    expect(salaryPolicy?.priority).toBe('critical');
    expect(salaryPolicy?.content).toContain('DUAL-CONTROL SALARY ADJUSTMENT');
    expect(salaryPolicy?.content).toContain('ZERO UNILATERAL HR AUTHORITY');
  });

  it('includes SOP-ORG-036 Enterprise Dual-Control Reporting Lines Standard', () => {
    const reportingPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-dual-control-reporting-lines-sop-036'
    );
    expect(reportingPolicy).toBeDefined();
    expect(reportingPolicy?.title).toContain('SOP-ORG-036');
    expect(reportingPolicy?.title).toContain('Enterprise Dual-Control Reporting Lines');
    expect(reportingPolicy?.department).toBe('admin');
    expect(reportingPolicy?.priority).toBe('critical');
    expect(reportingPolicy?.isStarred).toBe(true);
    expect(reportingPolicy?.content).toContain('DUAL-MATRIX ARCHITECTURE');
    expect(reportingPolicy?.content).toContain('SOLID LINE');
    expect(reportingPolicy?.content).toContain('DOTTED LINE');

    expect(reportingPolicy?.content).toContain('CAPTAIN OWNS THE SHIP');
  });

  it('includes SOP-MER-037 Corporate Merchandising & Zero-Trust Pricing Policy', () => {
    const merchPolicy = DEFAULT_ROADMAP_POLICIES.find(
      p => p.id === 'policy-corporate-merchandising-sop-037'
    );
    expect(merchPolicy).toBeDefined();
    expect(merchPolicy?.title).toContain('SOP-MER-037');
    expect(merchPolicy?.title).toContain('Corporate Merchandising');
    expect(merchPolicy?.department).toBe('admin');
    expect(merchPolicy?.priority).toBe('critical');
    expect(merchPolicy?.isStarred).toBe(true);
    expect(merchPolicy?.content).toContain('CORPORATE ADMINISTRATION');
    expect(merchPolicy?.content).toContain('ZERO-TRUST STORE FLOOR PRICING LOCKDOWN');
    expect(merchPolicy?.content).toContain('DUAL-CONTROL MARGIN GOVERNANCE');
  });
});


