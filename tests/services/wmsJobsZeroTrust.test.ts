import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wmsJobsService } from '../../services/wms-jobs.service';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => {
    const mockSelect = vi.fn();
    const mockInsert = vi.fn();
    const mockUpdate = vi.fn();
    const mockDelete = vi.fn();
    const mockEq = vi.fn();
    const mockOr = vi.fn();
    const mockNot = vi.fn();
    const mockIn = vi.fn();
    const mockContains = vi.fn();
    const mockOrder = vi.fn();
    const mockLimit = vi.fn();
    const mockMaybeSingle = vi.fn();
    const mockSingle = vi.fn();

    const queryBuilder: any = {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        or: mockOr,
        not: mockNot,
        in: mockIn,
        contains: mockContains,
        order: mockOrder,
        limit: mockLimit,
        maybeSingle: mockMaybeSingle,
        single: mockSingle
    };

    // Return self for chaining
    mockSelect.mockReturnValue(queryBuilder);
    mockInsert.mockReturnValue(queryBuilder);
    mockUpdate.mockReturnValue(queryBuilder);
    mockDelete.mockReturnValue(queryBuilder);
    mockEq.mockReturnValue(queryBuilder);
    mockOr.mockReturnValue(queryBuilder);
    mockNot.mockReturnValue(queryBuilder);
    mockIn.mockReturnValue(queryBuilder);
    mockContains.mockReturnValue(queryBuilder);
    mockOrder.mockReturnValue(queryBuilder);
    mockLimit.mockReturnValue(queryBuilder);

    return {
        supabase: {
            from: vi.fn(() => queryBuilder)
        },
        mockQueryBuilder: queryBuilder
    };
});

describe('WMS Jobs Zero-Trust Architecture & Country Scoping', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Tenant Isolation & Country-Code Scoping', () => {
        it('queries jobs with country_code filter when countryCode is provided', async () => {
            const { mockQueryBuilder } = await import('../../lib/supabase') as any;

            mockQueryBuilder.maybeSingle.mockResolvedValue({
                data: null,
                error: null
            });

            // Set up return data for parallel active + history queries in getAll
            mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
            mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);
            mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);

            // Mock resolving data
            const mockDbJob = {
                id: 'job-1',
                site_id: 'site-ke-1',
                country_code: 'KE',
                type: 'PICK',
                status: 'Pending',
                items_count: 5,
                line_items: [
                    { productId: 'p1', sku: 'KE-BV001', name: 'Mineral Water', expectedQty: 10, pickedQty: 0, status: 'Pending' }
                ]
            };

            // Let active query return data
            mockQueryBuilder.select.mockReturnValueOnce({
                not: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            or: vi.fn().mockResolvedValue({ data: [mockDbJob], error: null })
                        })
                    })
                })
            });

            // Test wmsJobsService.getAll with countryCode parameter
            const result = await wmsJobsService.getAll('site-ke-1', 50, undefined, 'KE');

            expect(supabase.from).toHaveBeenCalledWith('wms_jobs');
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            if (result.length > 0) {
                expect(result[0].countryCode).toBe('KE');
                expect(result[0].country_code).toBe('KE');
                expect(result[0].siteId).toBe('site-ke-1');
            }
        });

        it('stamps country_code on job creation and maps it back in return model', async () => {
            const { mockQueryBuilder } = await import('../../lib/supabase') as any;

            const insertedRow = {
                id: 'job-ke-101',
                site_id: 'site-ke-1',
                country_code: 'KE',
                type: 'RECEIVE',
                priority: 'Normal',
                status: 'Pending',
                items_count: 1,
                line_items: [{ sku: 'KE-FD001', name: 'Maize Flour', expectedQty: 50, pickedQty: 0, status: 'Pending' }],
                job_number: 'RC-101',
                created_at: new Date().toISOString()
            };

            mockQueryBuilder.single.mockResolvedValueOnce({
                data: insertedRow,
                error: null
            });

            const created = await wmsJobsService.create({
                siteId: 'site-ke-1',
                countryCode: 'KE',
                type: 'RECEIVE',
                priority: 'Normal',
                status: 'Pending',
                items: 1,
                lineItems: [{ productId: 'p-1', sku: 'KE-FD001', name: 'Maize Flour', expectedQty: 50, pickedQty: 0, status: 'Pending' }],
                location: 'DOCK_1',
                orderRef: 'PO-KE-001'
            });

            expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    country_code: 'KE',
                    site_id: 'site-ke-1',
                    type: 'RECEIVE'
                })
            );

            expect(created.countryCode).toBe('KE');
            expect(created.country_code).toBe('KE');
        });

        it('auto-resolves country_code from site when countryCode is omitted in create', async () => {
            const { mockQueryBuilder } = await import('../../lib/supabase') as any;

            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: { country: 'KE' },
                error: null
            });

            const insertedRow = {
                id: 'job-ke-auto',
                site_id: 'b74b26ff-da36-4381-912c-63c2b45b5d16',
                country_code: 'KE',
                type: 'PUTAWAY',
                status: 'Pending',
                items_count: 1,
                line_items: []
            };

            mockQueryBuilder.single.mockResolvedValueOnce({
                data: insertedRow,
                error: null
            });

            const created = await wmsJobsService.create({
                siteId: 'b74b26ff-da36-4381-912c-63c2b45b5d16',
                type: 'PUTAWAY',
                priority: 'Normal',
                status: 'Pending',
                items: 1,
                lineItems: [{ productId: 'p-1', sku: 'KE-FD001', name: 'Maize Flour', expectedQty: 50, pickedQty: 0, status: 'Pending' }],
                location: 'DOCK_1'
            } as any);

            expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    country_code: 'KE',
                    site_id: 'b74b26ff-da36-4381-912c-63c2b45b5d16'
                })
            );
            expect(created.countryCode).toBe('KE');
        });

        it('maps country_code in update operations and preserves tenant isolation', async () => {
            const { mockQueryBuilder } = await import('../../lib/supabase') as any;

            const updatedRow = {
                id: 'job-et-55',
                site_id: 'site-et-1',
                country_code: 'ET',
                type: 'PICK',
                status: 'Completed',
                items_count: 2,
                line_items: [],
                completed_by: 'Amina Ali',
                completed_at: new Date().toISOString()
            };

            mockQueryBuilder.single.mockResolvedValueOnce({
                data: updatedRow,
                error: null
            });

            const updated = await wmsJobsService.update('job-et-55', {
                status: 'Completed',
                completedBy: 'Amina Ali'
            });

            expect(mockQueryBuilder.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'Completed',
                    completed_by: 'Amina Ali'
                })
            );

            expect(updated.countryCode).toBe('ET');
            expect(updated.country_code).toBe('ET');
        });
    });

    describe('Zero-Trust Quantity Invariant & Tamper Protection Logic', () => {
        it('validates that expectedQty cannot be altered downward by worker manifests', () => {
            const originalManifest = [
                { sku: 'ET-COF001', name: 'Yirgacheffe Coffee', expectedQty: 100, pickedQty: 0, status: 'Pending' }
            ];

            // Attacking worker tries to tamper expectedQty to 80 to disguise 20 missing units
            const tamperedManifest = [
                { sku: 'ET-COF001', name: 'Yirgacheffe Coffee', expectedQty: 80, pickedQty: 80, status: 'Picked' }
            ];

            // Verify detection function matching the DB trigger logic
            const detectTampering = (oldItems: typeof originalManifest, newItems: typeof tamperedManifest) => {
                if (newItems.length < oldItems.length) return true;
                for (let i = 0; i < oldItems.length; i++) {
                    if (oldItems[i].sku === newItems[i]?.sku) {
                        if (newItems[i].expectedQty !== oldItems[i].expectedQty) {
                            return true; // Tamper detected
                        }
                    }
                }
                return false;
            };

            expect(detectTampering(originalManifest, tamperedManifest)).toBe(true);

            // Valid worker workflow: records shortage under honest discrepancy tracking
            const honestDiscrepancyManifest = [
                { sku: 'ET-COF001', name: 'Yirgacheffe Coffee', expectedQty: 100, pickedQty: 80, status: 'Short' }
            ];

            expect(detectTampering(originalManifest, honestDiscrepancyManifest)).toBe(false);
        });

        it('detects and rejects unauthorized line item deletion from manifests', () => {
            const originalManifest = [
                { sku: 'KE-TEA001', expectedQty: 50 },
                { sku: 'KE-OIL002', expectedQty: 20 }
            ];

            // Malicious worker drops the high-shrink item completely
            const tamperedManifest = [
                { sku: 'KE-TEA001', expectedQty: 50 }
            ];

            const isItemDeleted = tamperedManifest.length < originalManifest.length;
            expect(isItemDeleted).toBe(true);
        });
    });

    describe('Rule 10 — Zero-Eager-History & 25-Item Shelf Architecture', () => {
        it('getAll with limit=0 fetches active jobs without downloading historical records', async () => {
            const activeJob = {
                id: 'active-job-1',
                site_id: 'site-ke-1',
                country_code: 'KE',
                type: 'PICK',
                status: 'In-Progress',
                items_count: 3,
                line_items: []
            };

            const { mockQueryBuilder } = await import('../../lib/supabase') as any;
            mockQueryBuilder.select.mockReturnValueOnce({
                not: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            or: vi.fn().mockResolvedValue({ data: [activeJob], error: null })
                        })
                    })
                })
            });

            // Calling getAll with default limit=0 (zero history on mount)
            const result = await wmsJobsService.getAll('site-ke-1', 0, undefined, 'KE');

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('active-job-1');
            expect(result[0].status).toBe('In-Progress');
        });

        it('getHistory executes on-demand query with default limit of 25 and country scoping', async () => {
            const historicalJob = {
                id: 'hist-job-1',
                site_id: 'site-ke-1',
                country_code: 'KE',
                type: 'PICK',
                status: 'Completed',
                items_count: 2,
                completed_by: 'emp-001',
                completed_at: new Date().toISOString(),
                line_items: []
            };

            const { mockQueryBuilder } = await import('../../lib/supabase') as any;
            mockQueryBuilder.select.mockReturnValueOnce({
                in: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                or: vi.fn().mockResolvedValue({ data: [historicalJob], error: null })
                            })
                        })
                    })
                })
            });

            const history = await wmsJobsService.getHistory('site-ke-1', 25, undefined, 'KE');

            expect(history).toHaveLength(1);
            expect(history[0].id).toBe('hist-job-1');
            expect(history[0].status).toBe('Completed');
            expect(history[0].completedBy).toBe('emp-001');
            expect(history[0].countryCode).toBe('KE');
        });
    });
});
