import { describe,it,expect } from 'vitest';
import { isApprovalReviewRoute } from '../../utils/approvalReviewRoute';
describe('approval review destination scope',()=>{
  it('recognizes regional departmental and procurement review destinations',()=>{
    expect(isApprovalReviewRoute('regional_supply_chain_manager','pricing','/pricing','?tab=reviews')).toBe(true);
    expect(isApprovalReviewRoute('regional_finance_manager','pricing','/pricing','?tab=reviews')).toBe(true);
    expect(isApprovalReviewRoute('regional_procurement_manager','procurement','/procurement','?tab=orders')).toBe(true);
  });
  it('does not allow unrelated roles, modules, tabs or spoofed query parameters',()=>{
    expect(isApprovalReviewRoute('picker','pricing','/pricing','?tab=reviews')).toBe(false);
    expect(isApprovalReviewRoute('regional_supply_chain_manager','pricing','/pricing','?tab=rules')).toBe(false);
    expect(isApprovalReviewRoute('regional_supply_chain_manager','finance','/pricing','?tab=reviews')).toBe(false);
    expect(isApprovalReviewRoute('regional_supply_chain_manager','pricing','/pricing','?tab=rules&tab=reviews')).toBe(false);
  });
});
