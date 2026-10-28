import { describe, expect, it } from 'vitest';
import { APPROVAL_INBOX_ROLES, APPROVAL_QUEUES, approvalSummaryLabel } from '../../utils/unifiedApprovalInbox';
import { approvalInbox } from '../../utils/translations/approvalInbox';
describe('approval inbox contract', () => {
  it('enables reviewers across departments while excluding floor workers', () => {
    for(const role of ['regional_operations_manager','regional_procurement_manager','regional_hr_manager','regional_finance_manager','regional_supply_chain_manager','buyer']) expect(APPROVAL_INBOX_ROLES.has(role)).toBe(true);
    for(const role of ['cashier','picker','driver','packer']) expect(APPROVAL_INBOX_ROLES.has(role)).toBe(false);
  });
  it('labels a partial total explicitly', () => {
    expect(approvalSummaryLabel(0,1)).toContain('0+'); expect(approvalSummaryLabel(0,1)).toContain('unavailable');
    expect(approvalSummaryLabel(1,0)).toBe('1 approval task awaiting your review');
  });
  it('uses local allowlisted review destinations', () => {
    expect(APPROVAL_QUEUES.inventory.href).toBe('/inventory?tab=pending');
    expect(Object.values(APPROVAL_QUEUES).every(q => q.href.startsWith('/') && !q.href.startsWith('//'))).toBe(true);
  });
  it('provides all global WMS/POS notices in every supported language', () => {
    for(const value of Object.values(approvalInbox)) for(const language of ['en','am','or'] as const) expect(typeof value[language]).toBe('string');
  });
});
