import { describe, expect, it } from 'vitest';
import { isStockReview } from '../../utils/inventoryReviewRouting';
import type { PendingInventoryChange } from '../../types';
const request = (changeType: PendingInventoryChange['changeType'], adjustmentReason = '') => ({ changeType, adjustmentReason }) as PendingInventoryChange;
describe('Inventory review ownership', () => {
    it('excludes new-product approvals and merchandising proposals', () => {
        expect(isStockReview(request('create'))).toBe(false);
        expect(isStockReview(request('edit', 'PRICE_CHANGE: proposed price'))).toBe(false);
        expect(isStockReview(request('edit', 'MERCHANDISING: product details'))).toBe(false);
    });
    it('retains stock corrections, deletion requests and existing product edits', () => {
        expect(isStockReview(request('stock_adjustment'))).toBe(true);
        expect(isStockReview(request('delete'))).toBe(true);
        expect(isStockReview(request('edit'))).toBe(true);
    });
});
