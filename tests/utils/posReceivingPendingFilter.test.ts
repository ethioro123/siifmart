import { describe, it, expect } from 'vitest';

describe('POS Command Receiving Pending Filter', () => {
    const activeSiteId = '4b8e7cd9-5af3-4bdd-b561-11d8fa7730af'; // Kileleshwa store

    const filterPendingTransfers = (items: any[]) => {
        return items.filter(t => {
            if (String(t.destSiteId) !== String(activeSiteId)) return false;

            const transferStatus = String(t.transferStatus || '').toLowerCase().replace(/[-_]/g, '');
            const jobStatus = String(t.status || '').toLowerCase().replace(/[-_]/g, '');

            // Exclude already received or completed transfers
            if (['received', 'completed'].includes(transferStatus)) return false;

            // Exclude rejected, cancelled, draft, or unapproved transfers
            if (['rejected', 'cancelled', 'draft'].includes(transferStatus)) return false;
            if (['cancelled', 'rejected', 'completed'].includes(jobStatus)) return false;

            // Only shipments that are ready or in-transit/delivered should appear in store receiving
            return (
                ['intransit', 'dispatched', 'delivered', 'partiallydelivered', 'shipped'].includes(transferStatus) ||
                (jobStatus === 'pending' && ['intransit', 'dispatched', 'shipped', 'delivered'].includes(transferStatus)) ||
                ['staged', 'delivered'].includes(jobStatus)
            );
        });
    };

    it('strictly excludes rejected transfer 5OHHVC even when status is Pending', () => {
        const transfers = [
            {
                id: 'dc8efad6-4609-4ee6-bc9f-1d3006b24d4d',
                jobNumber: '5OHHVC',
                destSiteId: activeSiteId,
                status: 'Pending',
                transferStatus: 'Rejected'
            }
        ];

        const result = filterPendingTransfers(transfers);
        expect(result).toHaveLength(0);
    });

    it('strictly excludes cancelled transfers', () => {
        const transfers = [
            {
                id: 'job-cancelled-1',
                jobNumber: 'CAN001',
                destSiteId: activeSiteId,
                status: 'Cancelled',
                transferStatus: 'In-Transit'
            },
            {
                id: 'job-cancelled-2',
                jobNumber: 'CAN002',
                destSiteId: activeSiteId,
                status: 'Pending',
                transferStatus: 'Cancelled'
            }
        ];

        const result = filterPendingTransfers(transfers);
        expect(result).toHaveLength(0);
    });

    it('strictly excludes transfers for other destination stores', () => {
        const otherSiteId = 'b74b26ff-da36-4381-912c-63c2b45b5d16'; // Eastleigh WH
        const transfers = [
            {
                id: 'job-other-1',
                jobNumber: 'OTH001',
                destSiteId: otherSiteId,
                status: 'Pending',
                transferStatus: 'In-Transit'
            }
        ];

        const result = filterPendingTransfers(transfers);
        expect(result).toHaveLength(0);
    });

    it('includes legitimate in-transit and dispatched shipments for the destination store', () => {
        const transfers = [
            {
                id: 'valid-1',
                jobNumber: 'TRF001',
                destSiteId: activeSiteId,
                status: 'Pending',
                transferStatus: 'In-Transit'
            },
            {
                id: 'valid-2',
                jobNumber: 'TRF002',
                destSiteId: activeSiteId,
                status: 'In-Progress',
                transferStatus: 'Dispatched'
            },
            {
                id: 'valid-3',
                jobNumber: 'TRF003',
                destSiteId: activeSiteId,
                status: 'Pending',
                transferStatus: 'Delivered'
            }
        ];

        const result = filterPendingTransfers(transfers);
        expect(result).toHaveLength(3);
        expect(result.map(r => r.jobNumber)).toEqual(['TRF001', 'TRF002', 'TRF003']);
    });
});
