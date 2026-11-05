import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purchaseOrdersService } from '../../services/purchase-orders.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../services/system-logs.service',()=>({systemLogsService:{create:vi.fn().mockResolvedValue({})}}));

vi.mock('../../lib/supabase', () => {
    const mockFrom = vi.fn();
    const mockRpc = vi.fn();
    return {
        supabase: {
            from: mockFrom,
            rpc: mockRpc
        },
        isSupabaseConfigured: () => true
    };
});

describe('purchaseOrdersService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(supabase.rpc).mockImplementation((async (name: string, args: Record<string, unknown>) => ({ data: name === 'purchase_order_items_safe' ? [] : { id: args.p_id, po_number: 'AAAA0099' }, error: null })) as unknown as typeof supabase.rpc);
    });

    describe('create()', () => {
        it('assigns country_code and currency correctly for Kenya tenant', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'purchase_orders') {
                    return {
                        insert: mockInsert,
                        select: vi.fn().mockReturnValue({
                            not: vi.fn().mockReturnValue({
                                order: vi.fn().mockReturnValue({
                                    limit: vi.fn().mockResolvedValue({ data: [], error: null })
                                })
                            }),
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'po-kenya-1',
                                        country_code: 'KE',
                                        currency: 'KSh',
                                        total_amount: 50000,
                                        status: 'Draft',
                                        po_items: []
                                    },
                                    error: null
                                }),
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'po-kenya-1',
                                        country_code: 'KE',
                                        currency: 'KSh',
                                        total_amount: 50000,
                                        status: 'Draft',
                                        po_items: []
                                    },
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === 'po_items') {
                    return {
                        insert: vi.fn().mockResolvedValue({ error: null })
                    };
                }
                return {};
            });

            const poData = {
                id: 'po-kenya-1',
                siteId: 'site-nairobi-1',
                supplierId: 'sup-1',
                supplierName: 'Nairobi Supplier Ltd',
                date: '2026-09-29',
                status: 'Draft' as const,
                totalAmount: 50000,
                itemsCount: 10,
                expectedDelivery: '2026-10-05',
                countryCode: 'KE',
                currency: 'KSh',
                lineItems: []
            };

            await purchaseOrdersService.create(poData as any, []);

            expect(supabase.rpc).toHaveBeenCalledWith('save_purchase_order_document', expect.objectContaining({p_create:true}));
            const insertedPayload = (vi.mocked(supabase.rpc).mock.calls[0][1] as unknown as {p_header: Record<string, unknown>}).p_header;
            expect(insertedPayload.country_code).toBe('KE');
            expect(insertedPayload.currency).toBe('KSh');
            expect(insertedPayload.site_id).toBe('site-nairobi-1');
        });

        it('defaults country_code to ET and currency to ETB for Ethiopia tenant', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'purchase_orders') {
                    return {
                        insert: mockInsert,
                        select: vi.fn().mockReturnValue({
                            not: vi.fn().mockReturnValue({
                                order: vi.fn().mockReturnValue({
                                    limit: vi.fn().mockResolvedValue({ data: [], error: null })
                                })
                            }),
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'po-ethiopia-1',
                                        country_code: 'ET',
                                        currency: 'ETB',
                                        total_amount: 120000,
                                        status: 'Draft',
                                        po_items: []
                                    },
                                    error: null
                                }),
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'po-ethiopia-1',
                                        country_code: 'ET',
                                        currency: 'ETB',
                                        total_amount: 120000,
                                        status: 'Draft',
                                        po_items: []
                                    },
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === 'po_items') {
                    return {
                        insert: vi.fn().mockResolvedValue({ error: null })
                    };
                }
                return {};
            });

            const poData = {
                id: 'po-ethiopia-1',
                siteId: 'site-addis-1',
                supplierId: 'sup-2',
                supplierName: 'Addis Ababa Wholesale',
                date: '2026-09-29',
                status: 'Draft' as const,
                totalAmount: 120000,
                itemsCount: 25,
                expectedDelivery: '2026-10-10',
                lineItems: []
            };

            await purchaseOrdersService.create(poData as any, []);

            expect(supabase.rpc).toHaveBeenCalledWith('save_purchase_order_document', expect.objectContaining({p_create:true}));
            const insertedPayload = (vi.mocked(supabase.rpc).mock.calls[0][1] as unknown as {p_header: Record<string, unknown>}).p_header;
            expect(insertedPayload.country_code).toBe('ET');
            expect(insertedPayload.currency).toBe('ETB');
        });

        it('rejects PO creation if destination site is a retail Store', async () => {
            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: { id: 'store-1', name: 'Bole Retail Store', type: 'Store' },
                                    error: null
                                })
                            })
                        })
                    };
                }
                return {};
            });

            const poData = {
                id: 'po-store-1',
                siteId: 'store-1',
                supplierName: 'Wholesale Supplier',
                date: '2026-09-29',
                status: 'Draft' as const,
                totalAmount: 10000,
                itemsCount: 5,
                lineItems: []
            };

            await expect(purchaseOrdersService.create(poData as any, [])).rejects.toThrow(
                /Procurement policy violation: Purchase orders can only be sent to a Warehouse or Distribution Center/
            );
        });

        it('accepts PO creation if destination site is a Warehouse or Distribution Center', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: { id: 'wh-1', name: 'Nairobi Central Hub', type: 'Distribution Center' },
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === 'purchase_orders') {
                    return {
                        insert: mockInsert,
                        select: vi.fn().mockReturnValue({
                            not: vi.fn().mockReturnValue({
                                order: vi.fn().mockReturnValue({
                                    limit: vi.fn().mockResolvedValue({ data: [], error: null })
                                })
                            }),
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'po-dc-1',
                                        country_code: 'KE',
                                        currency: 'KSh',
                                        total_amount: 10000,
                                        status: 'Draft',
                                        po_items: []
                                    },
                                    error: null
                                }),
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'po-dc-1',
                                        country_code: 'KE',
                                        currency: 'KSh',
                                        total_amount: 10000,
                                        status: 'Draft',
                                        po_items: []
                                    },
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === 'po_items') {
                    return {
                        insert: vi.fn().mockResolvedValue({ error: null })
                    };
                }
                return {};
            });

            const poData = {
                id: 'po-dc-1',
                siteId: 'wh-1',
                supplierName: 'Wholesale Supplier',
                date: '2026-09-29',
                status: 'Draft' as const,
                totalAmount: 10000,
                itemsCount: 5,
                lineItems: []
            };

            await purchaseOrdersService.create(poData as any, []);
            expect(supabase.rpc).toHaveBeenCalledWith('save_purchase_order_document', expect.objectContaining({p_create:true}));
        });
    });

    describe('Zero-Trust & Chain of Custody: delete() & cancel()', () => {
        it('soft-cancels PO instead of executing hard SQL DELETE', async () => {
            const mockDelete = vi.fn();
            vi.mocked(supabase.rpc).mockImplementation((async (name: string) => ({ data: name === 'purchase_order_items_safe' ? [] : { po_id: 'po-to-delete', status: 'Cancelled' }, error: null })) as unknown as typeof supabase.rpc);

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'purchase_orders') {
                    return {
                        delete: mockDelete,
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'po-to-delete',
                                        status: 'Cancelled',
                                        notes: 'Initial order notes',
                                        po_items: []
                                    },
                                    error: null
                                }),
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'po-to-delete',
                                        status: 'Cancelled',
                                        notes: 'Initial order notes',
                                        po_items: []
                                    },
                                    error: null
                                })
                            })
                        })
                    };
                }
                return {};
            });

            const result = await purchaseOrdersService.delete('po-to-delete');

            expect(supabase.rpc).toHaveBeenCalledWith(
                'discard_own_purchase_order_draft',
                expect.objectContaining({ p_po_id: 'po-to-delete', p_reason: 'Deleted by manager' })
            );
            expect(mockDelete).not.toHaveBeenCalled();
            expect(result.status).toBe('Cancelled');
        });
    });
});


describe('purchase order delivery preflight', () => {
    it('rejects conflicting requirements before creating a header or writing items', async () => {
        vi.clearAllMocks();
        vi.mocked(supabase.rpc).mockImplementation((async (name: string, args: Record<string, unknown>) => ({ data: name === 'purchase_order_items_safe' ? [] : { id: args.p_id, po_number: 'AAAA0099' }, error: null })) as unknown as typeof supabase.rpc);
        const po = { tempReq: 'Ambient', shelfLife: '7' } as Parameters<typeof purchaseOrdersService.create>[0];
        await expect(purchaseOrdersService.create(po, [{ customAttributes: { storage: { type: 'Chilled', isPerishable: true, shelfLifeDays: '14' } } }])).rejects.toThrow('Chilled');
        expect(supabase.from).not.toHaveBeenCalled();
    });
});
