// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DriverScanner } from '../../components/fulfillment/drivers/DriverScanner';
import { DriverJobBoard } from '../../components/fulfillment/drivers/DriverJobBoard';
import type { WMSJob } from '../../types';

const job: WMSJob = { id: 'shipment-id', jobNumber: 'SHIP01', trackingNumber: 'TRK01', type: 'DISPATCH',
    siteId: 'source', status: 'Pending', priority: 'Normal', transferStatus: 'Packed', assignedTo: 'driver',
    orderRef: 'transfer', items: 2, lineItems: [], location: 'Dock D1' };
afterEach(cleanup);
describe('driver shipment lookup', () => {
    it('opens the matched authorized manifest without changing shipment state', () => {
        const onSelect = vi.fn();
        render(<DriverScanner jobs={[job]} onClose={vi.fn()} onSelect={onSelect} />);
        fireEvent.change(screen.getByLabelText('Shipment or tracking code'), { target: { value: 'TRK01' } });
        fireEvent.click(screen.getByRole('button', { name: 'Open manifest' }));
        expect(onSelect).toHaveBeenCalledWith(job);
        expect(job.transferStatus).toBe('Packed');
        expect(screen.queryByRole('button', { name: /complete delivery/i })).toBeNull();
    });
    it('rejects unrelated codes and preserves lookup input for correction', () => {
        const onSelect = vi.fn();
        render(<DriverScanner jobs={[job]} onClose={vi.fn()} onSelect={onSelect} />);
        fireEvent.change(screen.getByLabelText('Shipment or tracking code'), { target: { value: 'UNKNOWN' } });
        fireEvent.click(screen.getByRole('button', { name: 'Open manifest' }));
        expect(onSelect).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain('No authorized active shipment');
    });
    it('shows staged assignments without a pickup or self-accept bypass', () => {
        render(<DriverJobBoard filteredJobs={[job]} sites={[]} setSelectedJob={vi.fn()} setIsDetailsOpen={vi.fn()} globalSearch="" />);
        expect(screen.getByRole('button', { name: /Awaiting dispatch release/ })).toBeTruthy();
        expect(screen.queryByRole('button', { name: /accept|pick up|release shipment/i })).toBeNull();
    });
});
