import { describe, expect, it } from 'vitest';
import { PRODUCT_APPROVAL_ROLES, productApprovalLink } from '../../utils/approvalInbox';
describe('product approval entry points', () => {
  it('matches the three departmental vote roles', () => {
    expect([...PRODUCT_APPROVAL_ROLES]).toEqual(['regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager']);
    expect(PRODUCT_APPROVAL_ROLES.has('area_operations_manager')).toBe(false);
    expect(PRODUCT_APPROVAL_ROLES.has('buyer')).toBe(false);
  });
  it('opens the Reviews tab for the full queue', () => {
    expect(productApprovalLink()).toBe('/pricing?tab=reviews');
  });
  it('opens the complete layout instead of a single sibling request', () => {
    const link = new URL(productApprovalLink({ revisionId: 'layout-1', requestId: 'request-1' }), 'https://local.invalid');
    expect(link.searchParams.get('tab')).toBe('reviews');
    expect(link.searchParams.get('revisionId')).toBe('layout-1');
    expect(link.searchParams.has('requestId')).toBe(false);
  });
  it('encodes individual request links without allowing extra filter parameters', () => {
    const link = new URL(productApprovalLink({ revisionId: null, requestId: 'a&revisionId=wrong' }), 'https://local.invalid');
    expect(link.searchParams.get('requestId')).toBe('a&revisionId=wrong');
    expect(link.searchParams.has('revisionId')).toBe(false);
  });
});
