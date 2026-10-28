import type { ProductApprovalInboxItem } from '../types/approvalInbox';
export const PRODUCT_APPROVAL_ROLES = new Set([
  'regional_operations_manager', 'regional_supply_chain_manager', 'regional_merchandising_manager'
]);
export const PRODUCT_APPROVAL_INBOX_KEY = 'regional-product-approval-inbox';
export function productApprovalLink(item?: Pick<ProductApprovalInboxItem, 'revisionId' | 'requestId'>): string {
  const params = new URLSearchParams({ tab: 'reviews' });
  if (item?.revisionId) params.set('revisionId', item.revisionId);
  else if (item?.requestId) params.set('requestId', item.requestId);
  return '/pricing?' + params.toString();
}
