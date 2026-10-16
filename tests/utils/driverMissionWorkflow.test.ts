import { describe, it, expect } from 'vitest';

export function filterDriverAvailableJobs(
    filteredJobs: any[],
    user: any,
    employees: any[],
    globalSearch: string = ''
): any[] {
    const canSeeGlobalQueue = ['super_admin', 'admin', 'manager', 'regional_manager', 'operations_manager', 'warehouse_manager', 'dispatcher'].includes((user?.role || '').toLowerCase());
    const currentEmployee = employees.find(e => (user?.email && e.email === user.email) || (user?.name && e.name?.toLowerCase() === user.name.toLowerCase()) || (e.id === user?.id));
    const employeeId = currentEmployee?.id || user?.id;

    let baseJobs = filteredJobs.filter(j => {
        if (j.type !== 'DISPATCH' && j.type !== 'TRANSFER' && j.type !== 'DRIVER') return false;
        if (j.status === 'Cancelled' || j.transferStatus === 'Cancelled' || j.transferStatus === 'Rejected') return false;

        // If it's a TRANSFER, suppress it if a child DISPATCH job exists, and only allow if packed/ready
        if (j.type === 'TRANSFER') {
            const hasChildDispatch = filteredJobs.some(d =>
                d.type === 'DISPATCH' &&
                (d.orderRef === j.id || d.orderRef === j.jobNumber) &&
                d.status !== 'Cancelled'
            );
            if (hasChildDispatch) return false;

            const isReadyToShip = ['Packed', 'Approved', 'Ready', 'In-Transit', 'Shipped'].includes(j.transferStatus || '');
            if (!isReadyToShip) return false;
        }

        const isUnassigned = !j.assignedTo && j.status === 'Pending';
        const isNotPickedUp = j.transferStatus !== 'In-Transit' && j.transferStatus !== 'Shipped' && j.transferStatus !== 'Delivered' && j.transferStatus !== 'Received' && j.status !== 'Completed';
        return isUnassigned || (j.assignedTo === employeeId && isNotPickedUp) || (canSeeGlobalQueue && j.assignedTo && isNotPickedUp);
    });

    return baseJobs;
}

export function computeJobTotalUnits(job: any): number {
    if (job.lineItems && Array.isArray(job.lineItems) && job.lineItems.length > 0) {
        return job.lineItems.reduce((sum: number, it: any) => sum + (it.packedQty || it.expectedQty || it.quantity || it.pickedQty || 1), 0);
    }
    return job.items || job.items_count || 0;
}

describe('Driver Hub Mission Board Filtering & Deduplication', () => {
    const mockDriver = { id: 'DRV-001', name: 'John Driver', email: 'driver@siifmart.com', role: 'driver' };
    const mockEmployees = [mockDriver];

    it('suppresses parent TRANSFER job when a child DISPATCH job is present (prevents duplicate RTPA1Y)', () => {
        const jobs = [
            {
                id: 'trf-rtpa1y',
                jobNumber: 'RTPA1Y',
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Packed',
                lineItems: [
                    { sku: 'TS001', expectedQty: 200 },
                    { sku: 'KEEL001', expectedQty: 53 },
                    { sku: 'KEGR001', expectedQty: 88 },
                ]
            },
            {
                id: 'disp-rtpa1y',
                jobNumber: 'RTPA1Y',
                orderRef: 'trf-rtpa1y',
                type: 'DISPATCH',
                status: 'Pending',
                transferStatus: 'Packed',
                lineItems: [
                    { sku: 'TS001', expectedQty: 200 },
                    { sku: 'KEEL001', expectedQty: 53 },
                    { sku: 'KEGR001', expectedQty: 88 },
                ]
            }
        ];

        const available = filterDriverAvailableJobs(jobs, mockDriver, mockEmployees);
        expect(available.length).toBe(1);
        expect(available[0].id).toBe('disp-rtpa1y');
        expect(available[0].type).toBe('DISPATCH');
    });

    it('excludes rejected transfers (5OHHVC regression)', () => {
        const jobs = [
            {
                id: 'trf-5ohhvc',
                jobNumber: '5OHHVC',
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Rejected',
                lineItems: [{ sku: 'TS001', expectedQty: 1 }]
            }
        ];

        const available = filterDriverAvailableJobs(jobs, mockDriver, mockEmployees);
        expect(available.length).toBe(0);
    });

    it('excludes transfers in draft, requested, or picking state that are not packed/ready', () => {
        const jobs = [
            {
                id: 'trf-draft',
                jobNumber: 'DRAFT01',
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Draft'
            },
            {
                id: 'trf-picking',
                jobNumber: 'PICK01',
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Picking'
            }
        ];

        const available = filterDriverAvailableJobs(jobs, mockDriver, mockEmployees);
        expect(available.length).toBe(0);
    });

    it('computes accurate physical cargo units instead of line item array length', () => {
        const job = {
            id: 'disp-rtpa1y',
            jobNumber: 'RTPA1Y',
            type: 'DISPATCH',
            items: 3, // Array length
            lineItems: [
                { sku: 'TS001', expectedQty: 200 },
                { sku: 'KEEL001', expectedQty: 53 },
                { sku: 'KEGR001', expectedQty: 88 },
            ]
        };

        const totalUnits = computeJobTotalUnits(job);
        expect(totalUnits).toBe(341);
    });
});
