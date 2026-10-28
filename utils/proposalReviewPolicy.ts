import { isPriceProposal } from './priceApproval';
import type { PendingInventoryChange, Product } from '../types';
import { canVoteProductEdit, PRODUCT_EDIT_APPROVERS } from './productEditApproval';
import { checkRequiresFinanceSignoff } from './pricingGovernance';

export function proposalApprovalBlock(request: PendingInventoryChange, actor: { id?: string; role?: string; name?: string; email?: string } | null | undefined, product?: Partial<Product>): string | undefined {
  if (isPriceProposal(request)) return request.priceApprovalRoute?.canApprove ? undefined : request.priceApprovalRoute?.block || 'Price approval is unavailable for your role, country or region.';
  if (request.status !== 'pending') return 'This proposal is no longer pending.';
  if (!actor?.role || !(actor.role in PRODUCT_EDIT_APPROVERS)) return 'Only the assigned regional Operations, Supply Chain or Merchandising role can record a departmental approval.';
  const requester = request.requestedBy?.trim().toLowerCase();
  if (request.requestedByEmployeeId === actor.id || (requester && [actor.name,actor.email,actor.id].some(value => value?.trim().toLowerCase() === requester))) return 'You cannot approve a proposal you requested.';
  if (!canVoteProductEdit(request,actor.role,actor.id)) return 'Your department has already recorded its approval, or your employee identity is unavailable.';
  if (checkRequiresFinanceSignoff(request.proposedChanges,product).requiresFinance && !request.financeApprovedByEmployeeId) return 'Finance sign-off is required before regional approval.';
  return undefined;
}
