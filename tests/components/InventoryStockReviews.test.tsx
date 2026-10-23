// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InventoryPending } from '../../components/inventory/InventoryPending';
import type { PendingInventoryChange } from '../../types';
vi.mock('../../components/inventory/components/InventoryChangeDiff', () => ({ DetailedComparison: () => <div>Request comparison</div> }));
vi.mock('../../components/inventory/components/InventoryHistoryTable', () => ({ InventoryHistoryTable: () => <div>Preserved review history</div> }));
afterEach(cleanup);
const change = { id: 'real-request', productName: 'Diaper', productSku: 'ET001', changeType: 'stock_adjustment', status: 'pending', adjustmentQty: 2, adjustmentType: 'OUT', requestedBy: 'Worker' } as PendingInventoryChange;
function setup(canApprove = true) {
    const approve = vi.fn(), reject = vi.fn();
    render(<InventoryPending pendingChanges={[change]} allProducts={[]} canApprove={canApprove} isSubmitting={false} onApproveChange={approve} onRejectChange={reject} />);
    return { approve, reject };
}
describe('Inventory Stock Reviews', () => {
    it('has no new-product approval section and reviews a persisted stock request', () => {
        const { approve } = setup();
        expect(screen.queryByText(/New Products Awaiting Approval/)).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Review request' }));
        fireEvent.click(screen.getByRole('button', { name: 'Approve stock request' }));
        expect(approve).toHaveBeenCalledWith(change);
    });
    it('requires a rejection reason and preserves history', () => {
        const { reject } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'Review request' }));
        expect((screen.getByRole('button', { name: 'Reject request' }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.change(screen.getByLabelText('Rejection reason'), { target: { value: 'Count requires review' } });
        fireEvent.click(screen.getByRole('button', { name: 'Reject request' }));
        expect(reject).toHaveBeenCalledWith(change, 'Count requires review');
        fireEvent.click(screen.getByRole('button', { name: 'Review history' }));
        expect(screen.getByText('Preserved review history')).toBeTruthy();
    });
    it('does not expose decision buttons to read-only staff', () => {
        setup(false); fireEvent.click(screen.getByRole('button', { name: 'Review request' }));
        expect(screen.queryByRole('button', { name: 'Approve stock request' })).toBeNull();
    });
});
