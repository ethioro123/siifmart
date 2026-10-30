// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../components/UnknownBarcodeModal', () => ({ default: ({ barcode, onClose }: { barcode: string; onClose: () => void }) => <button onClick={onClose}>Review {barcode}</button> }));
import { ReceiveResolutionModal } from '../../components/fulfillment/receive/ReceiveResolutionModal';
describe('receiving barcode resolution', () => {
    it('routes to the shared review flow and retains the unresolved scan when it closes', () => {
        const setResolvingBarcode = vi.fn(), setUnresolvedScans = vi.fn(), refreshData = vi.fn();
        render(<ReceiveResolutionModal resolvingBarcode={{ barcode: 'COFFEE123', qty: 4 }} setResolvingBarcode={setResolvingBarcode} resolutionSearch="" setResolutionSearch={vi.fn()} products={[]} setUnresolvedScans={setUnresolvedScans} addNotification={vi.fn()} refreshData={refreshData} isSubmitting={false} t={key => key} />);
        fireEvent.click(screen.getByRole('button', { name: 'Review COFFEE123' }));
        expect(setResolvingBarcode).toHaveBeenCalledWith(null);
        expect(setUnresolvedScans).not.toHaveBeenCalled();
        expect(refreshData).not.toHaveBeenCalled();
    });
});
