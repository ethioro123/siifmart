import { describe, it, expect } from 'vitest';

describe('POS Command Receiving History Filter', () => {
    const kileleshwaSiteId = '4b8e7cd9-5af3-4bdd-b561-11d8fa7730af';

    const buildReceivingHistory = (jobs: any[], historicalJobs: any[], transfers: any[], activeSiteId: string) => {
        const map = new Map<string, any>();
        for (const j of historicalJobs || []) map.set(j.id, j);
        for (const j of jobs || []) map.set(j.id, j);
        const combinedJobs = Array.from(map.values());

        const wmsTransferJobs = combinedJobs
            .filter(j => j.type === 'TRANSFER' || j.type === 'DISPATCH')
            .filter(j => {
                if (j.type === 'TRANSFER') return true;
                return !combinedJobs.some(p => p.type === 'TRANSFER' && (p.id === j.orderRef || p.jobNumber === j.orderRef));
            })
            .map(j => ({
                id: j.id,
                type: j.type,
                sourceSiteId: j.sourceSiteId || j.source_site_id || j.siteId,
                destSiteId: j.destSiteId || j.dest_site_id,
                status: j.status,
                transferStatus: j.transferStatus || j.status,
                items: j.lineItems || j.line_items || [],
                orderRef: j.orderRef,
                jobNumber: j.jobNumber,
                createdAt: j.createdAt,
                assignedTo: j.assignedTo,
                receivedAt: j.receivedAt || j.received_at || j.completedAt || j.completed_at || null,
                updatedAt: j.updatedAt
            }));

        const allTransferSources = [
            ...(transfers || []),
            ...wmsTransferJobs.filter(wj =>
                !(transfers || []).some(t => t.id === wj.id)
            )
        ];

        return allTransferSources.filter(t => {
            if (String(t.destSiteId) !== String(activeSiteId)) return false;
            const transferStatus = String(t.transferStatus || '').toLowerCase();
            const jobStatus = String(t.status || '').toLowerCase();
            const hasExplicitReceivedAt = Boolean(t.receivedAt || t.received_at);

            // Exclude cancelled or rejected transfers from receiving history
            if (['rejected', 'cancelled'].includes(transferStatus) || ['rejected', 'cancelled'].includes(jobStatus)) {
                return false;
            }

            return transferStatus === 'received' || (hasExplicitReceivedAt && transferStatus !== 'delivered');
        }).sort((a, b) => {
            const dateA = new Date(a.receivedAt || a.updatedAt || 0).getTime();
            const dateB = new Date(b.receivedAt || b.updatedAt || 0).getTime();
            return dateB - dateA;
        });
    };

    it('correctly includes completed transfer RTPA1Y loaded from historicalJobs for Kileleshwa', () => {
        // live active jobs backlog is empty because RTPA1Y is completed
        const activeJobs: any[] = [];

        // historical jobs contains completed transfer RTPA1Y and child dispatch
        const historicalJobs = [
            {
                id: '52083ba4-0efc-4d7c-a2c0-883ca9bfb697',
                jobNumber: 'RTPA1Y',
                type: 'TRANSFER',
                status: 'Completed',
                transferStatus: 'Received',
                destSiteId: kileleshwaSiteId,
                receivedAt: '2026-10-16T12:19:16.570Z',
                lineItems: [{ sku: 'TS001', name: 'Wanchi Tuna', expectedQty: 200, receivedQty: 200 }]
            },
            {
                id: 'd1108841-d86f-456f-879a-378290a4063b',
                jobNumber: 'RTPA1Y',
                orderRef: '52083ba4-0efc-4d7c-a2c0-883ca9bfb697',
                type: 'DISPATCH',
                status: 'Completed',
                transferStatus: 'Delivered',
                destSiteId: kileleshwaSiteId
            }
        ];

        const history = buildReceivingHistory(activeJobs, historicalJobs, [], kileleshwaSiteId);

        expect(history).toHaveLength(1);
        expect(history[0].jobNumber).toBe('RTPA1Y');
        expect(history[0].transferStatus).toBe('Received');
        expect(history[0].receivedAt).toBe('2026-10-16T12:19:16.570Z');
    });

    it('excludes rejected and cancelled transfers from history', () => {
        const historicalJobs = [
            {
                id: 'job-rejected-1',
                jobNumber: '5OHHVC',
                type: 'TRANSFER',
                status: 'Cancelled',
                transferStatus: 'Rejected',
                destSiteId: kileleshwaSiteId
            }
        ];

        const history = buildReceivingHistory([], historicalJobs, [], kileleshwaSiteId);
        expect(history).toHaveLength(0);
    });

    it('excludes history for other store destinations', () => {
        const historicalJobs = [
            {
                id: 'job-other-store',
                jobNumber: 'XYZ999',
                type: 'TRANSFER',
                status: 'Completed',
                transferStatus: 'Received',
                destSiteId: 'some-other-store-id',
                receivedAt: '2026-10-16T10:00:00.000Z'
            }
        ];

        const history = buildReceivingHistory([], historicalJobs, [], kileleshwaSiteId);
        expect(history).toHaveLength(0);
    });
});
