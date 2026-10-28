import type { PendingInventoryChange } from '../types';
export function isPriceProposal(request: Pick<PendingInventoryChange,'proposedChanges'>): boolean {
  return ['price','costPrice','salePrice','isOnSale'].some(key => Object.prototype.hasOwnProperty.call(request.proposedChanges || {},key));
}
export function priceApprovalLabel(request: PendingInventoryChange): string {
  return request.priceApprovalRoute?.requiresCountry ? 'Country commercial approval' : 'Regional merchandising or country commercial approval';
}
