import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transfersService } from '../../services/transfers.service';
import { inventoryRequestsService } from '../../services/inventory-requests.service';
import { supabase } from '../../lib/supabase';

describe('Step 7: Regional Transfers & Inventory Requests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('transfersService.create - Multi-Country Sovereignty & Inter-Regional Routing', () => {
        it('throws an error if attempting cross-border transfer between different sovereign countries', async () => {
            const mockSites = [
                { id: 'site-et-1', country: 'ET', region_code: 'et_addis' },
                { id: 'site-ke-1', country: 'KE', region_code: 'ke_nairobi' },
            ];

            vi.spyOn(supabase, 'from').mockReturnValue({
                select: vi.fn().mockReturnValue({
                    in: vi.fn().mockResolvedValue({ data: mockSites, error: null })
                })
            } as any);

            await expect(
                transfersService.create({
                    sourceSiteId: 'site-et-1',
                    destSiteId: 'site-ke-1',
                    status: 'Requested',
                    items: [],
                    requestedBy: 'Test Officer'
                } as any)
            ).rejects.toThrow(/Multi-country sovereignty violation/);
        });

        it('detects inter-regional transfers within the same sovereign country (is_inter_region: true)', async () => {
            const mockSites = [
                { id: 'site-addis-hub', country: 'ET', region_code: 'et_addis' },
                { id: 'site-dire-store', country: 'ET', region_code: 'et_dire' },
            ];

            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockImplementation(() => {
                        return Promise.resolve({
                            data: {
                                id: 'tr-inter-123',
                                source_site_id: 'site-addis-hub',
                                dest_site_id: 'site-dire-store',
                                status: 'Requested',
                                source_region_code: 'et_addis',
                                dest_region_code: 'et_dire',
                                country_code: 'ET',
                                is_inter_region: true,
                                order_ref: 'TR-1001'
                            },
                            error: null
                        });
                    })
                })
            });

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: vi.fn().mockReturnValue({
                            in: vi.fn().mockResolvedValue({ data: mockSites, error: null })
                        })
                    } as any;
                }
                if (table === 'transfers') {
                    return { insert: insertMock } as any;
                }
                return {} as any;
            });

            const result = await transfersService.create({
                sourceSiteId: 'site-addis-hub',
                destSiteId: 'site-dire-store',
                status: 'Requested',
                items: [],
                requestedBy: 'Logistics Officer'
            } as any);

            expect(result.isInterRegion).toBe(true);
            expect(result.sourceRegionCode).toBe('et_addis');
            expect(result.destRegionCode).toBe('et_dire');
            expect(insertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    is_inter_region: true,
                    source_region_code: 'et_addis',
                    dest_region_code: 'et_dire',
                    country_code: 'ET'
                })
            );
        });

        it('flags intra-regional transfers as is_inter_region: false', async () => {
            const mockSites = [
                { id: 'site-mombasa-dc', country: 'KE', region_code: 'ke_mombasa' },
                { id: 'site-nyali-store', country: 'KE', region_code: 'ke_mombasa' },
            ];

            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'tr-intra-456',
                            source_site_id: 'site-mombasa-dc',
                            dest_site_id: 'site-nyali-store',
                            status: 'Requested',
                            source_region_code: 'ke_mombasa',
                            dest_region_code: 'ke_mombasa',
                            country_code: 'KE',
                            is_inter_region: false,
                            order_ref: 'TR-1002'
                        },
                        error: null
                    })
                })
            });

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: vi.fn().mockReturnValue({
                            in: vi.fn().mockResolvedValue({ data: mockSites, error: null })
                        })
                    } as any;
                }
                if (table === 'transfers') {
                    return { insert: insertMock } as any;
                }
                return {} as any;
            });

            const result = await transfersService.create({
                sourceSiteId: 'site-mombasa-dc',
                destSiteId: 'site-nyali-store',
                status: 'Requested',
                items: [],
                requestedBy: 'Mombasa Dispatcher'
            } as any);

            expect(result.isInterRegion).toBe(false);
            expect(insertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    is_inter_region: false,
                    source_region_code: 'ke_mombasa',
                    dest_region_code: 'ke_mombasa'
                })
            );
        });
    });

    describe('inventoryRequestsService - Regional Scoping & Auditing', () => {
        it('queries inventory requests filtered by region_code', async () => {
            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                    data: [
                        {
                            id: 'inv-req-1',
                            site_id: 'site-nyali',
                            country_code: 'KE',
                            region_code: 'ke_mombasa',
                            change_type: 'stock_adjustment',
                            product_name: 'Sunflower Oil 5L',
                            requested_by: 'Nyali Supervisor',
                            status: 'pending'
                        }
                    ],
                    error: null
                })
            };

            vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

            const requests = await inventoryRequestsService.getAll(undefined, 'KE', 25, 'ke_mombasa');

            expect(mockQuery.eq).toHaveBeenCalledWith('country_code', 'KE');
            expect(mockQuery.eq).toHaveBeenCalledWith('region_code', 'ke_mombasa');
            expect(requests.length).toBe(1);
            expect(requests[0].regionCode).toBe('ke_mombasa');
        });

        it('auto-resolves region_code from site when creating an inventory request', async () => {
            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'inv-req-new',
                            site_id: 'site-dire-store',
                            country_code: 'ET',
                            region_code: 'et_dire',
                            change_type: 'stock_adjustment',
                            requested_by: 'Store Clerk',
                            status: 'pending'
                        },
                        error: null
                    })
                })
            });

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: { region_code: 'et_dire' },
                                    error: null
                                })
                            })
                        })
                    } as any;
                }
                if (table === 'inventory_requests') {
                    return { insert: insertMock } as any;
                }
                return {} as any;
            });

            const result = await inventoryRequestsService.create({
                siteId: 'site-dire-store',
                productId: 'prod-1',
                productName: 'Habesha Teff 25kg',
                productSku: 'ET-TEFF-25',
                changeType: 'stock_adjustment',
                requestedBy: 'Store Clerk',
                countryCode: 'ET'
            } as any);

            expect(result.regionCode).toBe('et_dire');
            expect(insertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    region_code: 'et_dire',
                    country_code: 'ET'
                })
            );
        });
    });
});
