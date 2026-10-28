import { describe, expect, it } from 'vitest';
import {
  APPROVAL_INBOX_ROLES,
  APPROVAL_QUEUES,
  approvalSummaryLabel,
  isSpecialistClearance,
  getQueueClearanceBadge,
  getQueueReviewType
} from '../../utils/unifiedApprovalInbox';
import { approvalInbox } from '../../utils/translations/approvalInbox';

describe('approval inbox contract', () => {
  it('enables reviewers across departments while excluding floor workers', () => {
    for (const role of [
      'regional_operations_manager',
      'regional_procurement_manager',
      'regional_hr_manager',
      'regional_finance_manager',
      'regional_supply_chain_manager',
      'country_managing_director',
      'country_commercial_director',
      'country_finance_director',
      'group_ceo',
      'group_cfo',
      'buyer'
    ]) expect(APPROVAL_INBOX_ROLES.has(role)).toBe(true);

    for (const role of ['cashier', 'picker', 'driver', 'packer']) {
      expect(APPROVAL_INBOX_ROLES.has(role)).toBe(false);
    }
  });

  it('labels a partial total explicitly', () => {
    expect(approvalSummaryLabel(0, 1)).toContain('0+');
    expect(approvalSummaryLabel(0, 1)).toContain('unavailable');
    expect(approvalSummaryLabel(1, 0)).toBe('1 approval task awaiting your review');
  });

  it('uses local allowlisted review destinations', () => {
    expect(APPROVAL_QUEUES.inventory.href).toBe('/inventory?tab=pending');
    expect(Object.values(APPROVAL_QUEUES).every(q => q.href.startsWith('/') && !q.href.startsWith('//'))).toBe(true);
  });

  it('provides all global WMS/POS notices in every supported language', () => {
    for (const value of Object.values(approvalInbox)) {
      const entry = value as Record<'en' | 'am' | 'or', string>;
      for (const language of ['en', 'am', 'or'] as const) {
        expect(typeof entry[language]).toBe('string');
        expect(entry[language].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('distinguishes specialist clearances from final line approvals', () => {
    const specialistKeys = [
      'po_finance',
      'price_finance',
      'candidate_hr',
      'candidate_finance',
      'margin',
      'payroll_attestation',
      'payroll_hr',
      'payroll_finance'
    ];
    for (const key of specialistKeys) {
      expect(isSpecialistClearance(key)).toBe(true);
      expect(getQueueReviewType(key)).toBe('specialist_clearance');
      expect(APPROVAL_QUEUES[key].reviewType).toBe('specialist_clearance');
    }

    const lineApprovalKeys = [
      'purchase_orders',
      'expenses',
      'price',
      'product',
      'planogram',
      'headcount',
      'transfers',
      'inventory'
    ];
    for (const key of lineApprovalKeys) {
      expect(isSpecialistClearance(key)).toBe(false);
      expect(getQueueReviewType(key)).toBe('final_line_approval');
      expect(APPROVAL_QUEUES[key].reviewType).toBe('final_line_approval');
    }
  });

  it('assigns calibrated governance badges to every queue', () => {
    for (const [key, config] of Object.entries(APPROVAL_QUEUES)) {
      expect(config.clearanceBadge).toBeDefined();
      expect(config.governanceScope).toBeDefined();
      expect(getQueueClearanceBadge(key)).toBe(config.clearanceBadge);
    }
  });
});
