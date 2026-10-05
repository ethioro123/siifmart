import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ROADMAP_POLICIES,
  SECURITY_POLICIES,
  FULFILLMENT_POLICIES,
  INVENTORY_AUDIT_POLICIES,
  GOVERNANCE_POLICIES,
  ARCHITECTURE_POLICIES,
  MANAGER_ROLE_POLICIES,
  REPORTING_LINE_POLICIES,
  CORPORATE_MERCHANDISING_POLICIES
} from '../../components/roadmap/defaultRoadmapPolicies';

describe('Roadmap Policies Registry & Traceability', () => {
  it('contains all traceable standard operating procedures', () => {
    const totalExpected =
      SECURITY_POLICIES.length +
      FULFILLMENT_POLICIES.length +
      INVENTORY_AUDIT_POLICIES.length +
      GOVERNANCE_POLICIES.length +
      ARCHITECTURE_POLICIES.length +
      MANAGER_ROLE_POLICIES.length +
      REPORTING_LINE_POLICIES.length +
      CORPORATE_MERCHANDISING_POLICIES.length;
    expect(DEFAULT_ROADMAP_POLICIES.length).toBe(totalExpected);
  });

  it('aggregates policies from all modular domains correctly', () => {
    expect(SECURITY_POLICIES.length).toBe(4);
    expect(FULFILLMENT_POLICIES.length).toBe(4);
    expect(INVENTORY_AUDIT_POLICIES.length).toBe(1);
    expect(GOVERNANCE_POLICIES.length).toBe(7);
    expect(ARCHITECTURE_POLICIES.length).toBe(4);
    expect(MANAGER_ROLE_POLICIES.length).toBeGreaterThanOrEqual(6);
    expect(REPORTING_LINE_POLICIES.length).toBe(1);
    expect(CORPORATE_MERCHANDISING_POLICIES.length).toBe(1);
    expect(DEFAULT_ROADMAP_POLICIES).toEqual([
      ...SECURITY_POLICIES,
      ...FULFILLMENT_POLICIES,
      ...INVENTORY_AUDIT_POLICIES,
      ...GOVERNANCE_POLICIES,
      ...ARCHITECTURE_POLICIES,
      ...MANAGER_ROLE_POLICIES,
      ...REPORTING_LINE_POLICIES,
      ...CORPORATE_MERCHANDISING_POLICIES
    ]);
  });


  it('verifies every policy has valid metadata and substantial content', () => {
    const validDepts = ['stores', 'warehouses', 'admin', 'pos', 'logistics', 'hr', 'finance', 'general', 'policy', 'workflow'];
    const validTypes = ['idea', 'policy', 'workflow', 'note', 'improvement'];
    const validPriorities = ['low', 'medium', 'high', 'critical'];

    DEFAULT_ROADMAP_POLICIES.forEach(policy => {
      expect(policy.id).toBeTruthy();
      expect(policy.title.trim().length).toBeGreaterThan(10);
      expect(policy.description.trim().length).toBeGreaterThan(20);
      expect(policy.content && policy.content.length).toBeGreaterThan(100);
      expect(validDepts).toContain(policy.department);
      expect(validTypes).toContain(policy.type);
      expect(validPriorities).toContain(policy.priority);
      expect(policy.tags.length).toBeGreaterThan(0);
      expect(policy.status).toBe('active');
    });
  });

  it('ensures each policy includes a traceable reference to .agent/RULES.md', () => {
    DEFAULT_ROADMAP_POLICIES.forEach(policy => {
      expect(policy.content).toContain('TRACEABILITY: .agent/RULES.md');
    });
  });

  it('verifies existence of critical SOP codes in the registry', () => {
    const expectedCodes = [
      'SOP-SEC-001',
      'SOP-POS-002',
      'SOP-WMS-003',
      'SOP-SEC-004',
      'SOP-POS-005',
      'HR-OPS-006',
      'SOP-LOG-007',
      'SOP-OPS-008',
      'SOP-GOV-009',
      'SOP-INV-010',
      'SOP-OPS-011',
      'SOP-FIN-012',
      'SOP-GOV-013',
      'SOP-SYS-014',
      'SOP-SYS-015',
      'SOP-UX-016',
      'SOP-OPS-017',
      'SOP-GOV-018',
      'SOP-MER-019',
      'SOP-MGT-020'
    ];

    expectedCodes.forEach(code => {
      const match = DEFAULT_ROADMAP_POLICIES.some(p =>
        p.title.includes(code) ||
        (p.content && p.content.includes(code))
      );
      expect(match).toBe(true);
    });
  });
});
