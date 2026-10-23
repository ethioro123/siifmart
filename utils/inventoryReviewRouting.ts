import type { PendingInventoryChange } from '../types';
/** Inventory owns physical stock reviews. Catalog and merchandising have their own workflows. */
export function isStockReview(change: PendingInventoryChange): boolean {
    if (/^(PRICE_CHANGE|MERCHANDISING:)/.test(change.adjustmentReason || '')) return false;
    return change.changeType === 'stock_adjustment' || change.changeType === 'delete' || change.changeType === 'edit';
}
