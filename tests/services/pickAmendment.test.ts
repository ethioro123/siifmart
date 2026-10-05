import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    pickAmendmentService,
    PickAmendParams,
} from '../../services/pick-amendment.service';
import { wmsJobsService } from '../../services/wms-jobs.service';
import { inventoryRequestsService } from '../../services/inventory-requests.service';
import { systemLogsService } from '../../services/system-logs.service';
import { WMSJob } from '../../types';

vi.mock('../../services/wms-jobs.service', () => ({
    wmsJobsService: {
        update: vi.fn().mockResolvedValue({ id: 'job-1' }),
    },
}));

vi.mock('../../services/inventory-requests.service', () => ({
    inventoryRequestsService: {
        create: vi.fn().mockResolvedValue({ id: 'inv-req-1' }),
    },
}));

vi.mock('../../services/system-logs.service', () => ({
    systemLogsService: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
    },
}));

describe('Zero-Trust Pick Amendment Service (Step 3)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockPickJob: WMSJob = {
        id: 'job-pick-100',
        jobNumber: '100',
        type: 'PICK',
        status: 'In-Progress',
        siteId: 'WH-001',
        countryCode: 'ET',
        priority: 'Normal',
        items: 2,
        location: 'Zone A - Bay 01',
        orderRef: 'ORD-1001',
        lineItems: [
            {
                name: 'Organic Honey 500g',
                sku: 'ET-DY001',
                productId: 'prod-honey-1',
                expectedQty: 10,
                pickedQty: 10,
                status: 'Picked',
            } as any,
            {
                name: 'Highland Coffee 1kg',
                sku: 'ET-BV004',
                productId: 'prod-coffee-4',
                expectedQty: 5,
                pickedQty: 5,
                status: 'Picked',
            } as any,
        ],
        notes: 'Initial pick batch',
    };

    const mockPackJob: WMSJob = {
        id: 'job-pack-200',
        jobNumber: '200',
        type: 'PACK',
        status: 'Pending',
        orderRef: 'job-pick-100',
        siteId: 'WH-001',
        countryCode: 'ET',
        priority: 'Normal',
        items: 2,
        location: 'Pack Station 02',
        lineItems: [
            {
                name: 'Organic Honey 500g',
                sku: 'ET-DY001',
                productId: 'prod-honey-1',
                expectedQty: 10,
                pickedQty: 0,
                status: 'Pending',
            } as any,
            {
                name: 'Highland Coffee 1kg',
                sku: 'ET-BV004',
                productId: 'prod-coffee-4',
                expectedQty: 5,
                pickedQty: 0,
                status: 'Pending',
            } as any,
        ],
        notes: '',
    };

    it('rejects amendment when requested by non-manager floor worker (Zero Autonomous Authority)', async () => {
        const params: PickAmendParams = {
            job: mockPickJob,
            lines: [
                {
                    index: 0,
                    sku: 'ET-DY001',
                    name: 'Organic Honey 500g',
                    originalPicked: 10,
                    amendedPicked: 7,
                },
            ],
            reasonCode: 'BIN_SHORTAGE',
            reasonNotes: 'Only 7 jars found on bin A1',
            currentUser: {
                id: 'emp-picker-1',
                name: 'Dawit Picker',
                role: 'picker', // Floor worker role
            },
        };

        await expect(pickAmendmentService.executeAmendment(params)).rejects.toThrow(
            /Zero-Trust Security Violation: Only verified supervisors or managers/
        );
        expect(wmsJobsService.update).not.toHaveBeenCalled();
        expect(inventoryRequestsService.create).not.toHaveBeenCalled();
    });

    it('rejects amendment when structured reason code or notes are missing (Rule 18)', async () => {
        const params: any = {
            job: mockPickJob,
            lines: [
                {
                    index: 0,
                    sku: 'ET-DY001',
                    name: 'Organic Honey 500g',
                    originalPicked: 10,
                    amendedPicked: 6,
                },
            ],
            reasonCode: '',
            reasonNotes: '',
            currentUser: {
                id: 'emp-mgr-1',
                name: 'Sara Manager',
                role: 'warehouse_manager',
            },
        };

        await expect(pickAmendmentService.executeAmendment(params)).rejects.toThrow(
            /Zero-Trust Validation Violation/
        );
    });

    it('successfully amends pick quantities, files inventory adjustment request to Central HQ, and logs audit', async () => {
        const params: PickAmendParams = {
            job: mockPickJob,
            lines: [
                {
                    index: 0,
                    sku: 'ET-DY001',
                    name: 'Organic Honey 500g',
                    productId: 'prod-honey-1',
                    originalPicked: 10,
                    amendedPicked: 6, // 4 units short
                },
            ],
            reasonCode: 'BIN_SHORTAGE',
            reasonNotes: 'Physical bin count variance confirmed by supervisor',
            currentUser: {
                id: 'emp-mgr-1',
                name: 'Sara Manager',
                role: 'warehouse_manager',
            },
            gpsLocation: 'GPS: 9.0300, 38.7400',
            linkedPackJob: mockPackJob,
        };

        const result = await pickAmendmentService.executeAmendment(params);

        expect(result.success).toBe(true);
        expect(result.amendedLinesCount).toBe(1);
        expect(result.inventoryRequestsSubmitted).toBe(1);
        expect(result.packJobUpdated).toBe(true);

        // 1. Check Pick Job Update
        expect(wmsJobsService.update).toHaveBeenCalledWith(
            'job-pick-100',
            expect.objectContaining({
                hasAmendment: true,
                notes: expect.stringContaining('[PICK AMENDED by Sara Manager (warehouse_manager, ID: emp-mgr-1)'),
            })
        );

        // 2. Check Inventory Request creation (Rule 1: All stock adjustments route to HQ)
        expect(inventoryRequestsService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                productSku: 'ET-DY001',
                adjustmentType: 'IN', // Delta is negative (-4), so previously deducted units return to system
                adjustmentQty: 4,
                siteId: 'WH-001',
                countryCode: 'ET',
                requestedBy: 'Sara Manager',
                status: 'pending',
            })
        );

        // 3. Check PACK Job preservation (Rule: never erase original expected demand)
        expect(wmsJobsService.update).toHaveBeenCalledWith(
            'job-pack-200',
            expect.objectContaining({
                hasDiscrepancy: true,
                lineItems: expect.arrayContaining([
                    expect.objectContaining({
                        sku: 'ET-DY001',
                        expectedQty: 10, // Original expected qty PRESERVED
                        originalExpectedQty: 10,
                        pickedQty: 6, // Actual amended picked qty
                        shortageQty: 4,
                        hasDiscrepancy: true,
                    }),
                ]),
            })
        );

        // 4. Check Tamper-Proof Audit Logging (Rule 5 & Rule 18)
        expect(systemLogsService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'PICK_AMENDMENT_SUPERVISORY_OVERRIDE',
                module: 'Fulfillment',
                user_name: 'Sara Manager',
                details: expect.stringContaining('emp-mgr-1'),
            })
        );
    });
});
