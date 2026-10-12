import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purchaseOrdersService } from '../../services/purchase-orders.service';
import { buildPurchaseOrders } from '../../components/procurement/createPOHelpers';
import { supabase } from '../../lib/supabase';
import type { PurchaseOrder, POItem } from '../../types';

vi.mock('../../lib/supabase', () => ({
    supabase: { from: vi.fn() },
    isSupabaseConfigured: () => true
}));

describe('Purchase Order Creation Attributes Suite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('PO Header Attributes Insertion', () => {
        it('persists complete commercial, logistics, financial, and sovereignty header attributes', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            const mockItemInsert = vi.fn().mockResolvedValue({ error: null });

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: () => ({
                            eq: () => ({
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: { id: 'wh-adama-01', name: 'Adama Central DC', type: 'Distribution Center', region_code: 'et_adama', country: 'ET' },
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === 'purchase_orders') {
                    return {
                        insert: mockInsert,
                        select: () => ({
                            not: () => ({ order: () => ({ limit: vi.fn().mockResolvedValue({ data: [{ po_number: 'AAAA0041' }], error: null }) }) }),
                            eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })
                        })
                    };
                }
                if (table === 'po_items') return { insert: mockItemInsert };
                return {};
            });

            const fullPO: Omit<PurchaseOrder, 'created_at' | 'updated_at'> = {
                id: 'po-full-attr-01',
                poNumber: 'AAAA0042',
                siteId: 'wh-adama-01',
                supplierId: 'sup-oromia-agri',
                supplierName: 'Oromia Agricultural Cooperative',
                date: '2026-10-12',
                status: 'Draft',
                totalAmount: 185500,
                itemsCount: 300,
                expectedDelivery: '2026-10-20',
                shippingCost: 3500,
                taxAmount: 0,
                discount: 1000,
                paymentTerms: 'Net 30',
                incoterms: 'DDP',
                destination: 'Adama Central DC',
                tempReq: 'Ambient',
                shelfLife: '180 days',
                dockSlot: 'DOCK-A02',
                notes: 'Priority harvest batch. Direct delivery to Adama hub.',
                priority: 'High',
                createdBy: 'Abebe Bikila',
                requestedBy: 'Sara Tadesse',
                currency: 'ETB',
                country_code: 'ET',
                region_code: 'et_adama',
                requires_hq_approval: true,
                lineItems: []
            };

            await purchaseOrdersService.create(fullPO, []);

            expect(mockInsert).toHaveBeenCalledTimes(1);
            const payload = mockInsert.mock.calls[0][0];

            expect(payload.id).toBe('po-full-attr-01');
            expect(payload.po_number).toBe('AAAA0042');
            expect(payload.site_id).toBe('wh-adama-01');
            expect(payload.supplier_id).toBe('sup-oromia-agri');
            expect(payload.supplier_name).toBe('Oromia Agricultural Cooperative');
            expect(payload.order_date).toBe('2026-10-12');
            expect(payload.status).toBe('Draft');
            expect(payload.total_amount).toBe(185500);
            expect(payload.items_count).toBe(300);
            expect(payload.shipping_cost).toBe(3500);
            expect(payload.tax_amount).toBe(0);
            expect(payload.discount).toBe(1000);
            expect(payload.currency).toBe('ETB');
            expect(payload.payment_terms).toBe('Net 30');
            expect(payload.incoterms).toBe('DDP');
            expect(payload.destination).toBe('Adama Central DC');
            expect(payload.temp_req).toBe('Ambient');
            expect(payload.shelf_life).toBe('180 days');
            expect(payload.dock_slot).toBe('DOCK-A02');
            expect(payload.expected_delivery).toBe('2026-10-20');
            expect(payload.priority).toBe('High');
            expect(payload.notes).toBe('Priority harvest batch. Direct delivery to Adama hub.');
            expect(payload.created_by).toBe('Abebe Bikila');
            expect(payload.requested_by).toBe('Sara Tadesse');
            expect(payload.country_code).toBe('ET');
            expect(payload.region_code).toBe('et_adama');
            expect(payload.requires_hq_approval).toBe(true);
        });

        it('auto-resolves destination site name, country_code, and region_code from sites table when omitted', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: () => ({
                            eq: () => ({
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: { id: 'wh-nairobi-dc', name: 'Nairobi DC', type: 'Distribution Center', region_code: 'ke_nairobi', country: 'KE' },
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === 'purchase_orders') {
                    return {
                        insert: mockInsert,
                        select: () => ({
                            not: () => ({ order: () => ({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
                            eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })
                        })
                    };
                }
                if (table === 'po_items') return { insert: vi.fn().mockResolvedValue({ error: null }) };
                return {};
            });

            const minimalPO: Omit<PurchaseOrder, 'created_at' | 'updated_at'> = {
                id: 'po-minimal-01',
                siteId: 'wh-nairobi-dc',
                supplierName: 'Kenya Tea Packers Ltd',
                supplierId: 'UNSPECIFIED',
                date: '2026-10-12',
                status: 'Draft',
                totalAmount: 75000,
                itemsCount: 50,
                expectedDelivery: null,
                lineItems: []
            };

            await purchaseOrdersService.create(minimalPO, []);

            expect(mockInsert).toHaveBeenCalledTimes(1);
            const payload = mockInsert.mock.calls[0][0];

            expect(payload.supplier_id).toBeNull();
            expect(payload.destination).toBe('Nairobi DC');
            expect(payload.country_code).toBe('KE');
            expect(payload.region_code).toBe('ke_nairobi');
            expect(payload.currency).toBe('ETB');
        });

        it('strictly blocks PO creation to retail Stores and Online Stores', async () => {
            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: () => ({
                            eq: () => ({
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: { id: 'str-arada-01', name: 'Arada Retail Store', type: 'Store' },
                                    error: null
                                })
                            })
                        })
                    };
                }
                return {};
            });

            const poToStore = {
                siteId: 'str-arada-01',
                supplierName: 'Vendor',
                date: '2026-10-12',
                status: 'Draft' as const,
                totalAmount: 5000,
                itemsCount: 10,
                lineItems: []
            };

            await expect(purchaseOrdersService.create(poToStore as any, [])).rejects.toThrow(
                /Procurement policy violation: Purchase orders can only be sent to a Warehouse or Distribution Center/
            );
        });
    });

    describe('PO Line Item Attributes Insertion', () => {
        it('persists all catalog attributes, packaging, thresholds, and 6-layer custom attributes', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            const mockItemInsert = vi.fn().mockResolvedValue({ error: null });

            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: () => ({
                            eq: () => ({
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: { id: 'wh-harar-01', name: 'Harar Warehouse', type: 'Warehouse', region_code: 'et_dire', country: 'ET' },
                                    error: null
                                })
                            })
                        })
                    };
                }
                if (table === 'purchase_orders') {
                    return {
                        insert: mockInsert,
                        select: () => ({
                            not: () => ({ order: () => ({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
                            eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) })
                        })
                    };
                }
                if (table === 'po_items') return { insert: mockItemInsert };
                return {};
            });

            const validProdUUID = '11111111-2222-3333-4444-555555555555';
            const lineItems: POItem[] = [
                {
                    productId: validProdUUID,
                    productName: 'Harar Roasted Coffee Beans 1kg',
                    sku: 'ET-DIR-COF-001',
                    quantity: 50,
                    unitCost: 600,
                    retailPrice: 850,
                    totalCost: 30000,
                    image: 'https://siifmart.com/images/harar-coffee.jpg',
                    brand: 'Harar Special',
                    size: '1kg',
                    unit: 'Bag',
                    category: 'Beverages',
                    identityType: 'known',
                    packQuantity: 10,
                    caseSize: 20,
                    packageType: 'Carton',
                    description: 'Direct procurement from Dire Dawa roastery',
                    minStock: 25,
                    maxStock: 500,
                    customAttributes: {
                        identity: { variant: 'Dark Roast', modelNumber: 'HR-2026', brand: 'Harar Special' },
                        physical: { netWeight: '1000g', grossWeight: '1050g', color: 'Deep Brown', form: 'Whole Bean' },
                        packaging: { packQty: '10', caseSize: '20', packageType: 'Carton', material: 'Corrugated' },
                        storage: { type: 'Ambient', isPerishable: false, isFragile: false, stackLimit: '8' },
                        commercial: { isWeighted: false, priceType: 'Fixed', isReturnable: true },
                        descriptive: { usage: 'Brewed Beverage', scent: 'Mocha aroma', strength: 'Strong' },
                        categorySpecific: { roastLevel: 'French Roast', elevation: '1900m' }
                    }
                },
                {
                    productId: 'adhoc-sample-item', // Non-UUID treated as ad-hoc
                    productName: 'Local Woven Jute Sacks (Bundles of 50)',
                    sku: 'ADHOC-JUTE-01',
                    quantity: 10,
                    unitCost: 1500,
                    totalCost: 15000,
                    retailPrice: 2200,
                    identityType: 'new',
                    packQuantity: 50,
                    packageType: 'Bale',
                    caseSize: 1
                }
            ];

            await purchaseOrdersService.create({
                id: 'po-items-test-01',
                siteId: 'wh-harar-01',
                supplierName: 'Eastern Harar Exporters',
                date: '2026-10-12',
                status: 'Draft',
                totalAmount: 45000,
                itemsCount: 60,
                lineItems
            } as any, lineItems);

            expect(mockItemInsert).toHaveBeenCalledTimes(1);
            const insertedItems = mockItemInsert.mock.calls[0][0];
            expect(insertedItems).toHaveLength(2);

            // Item 1: Known catalog item
            const item1 = insertedItems[0];
            expect(item1.po_id).toBe('po-items-test-01');
            expect(item1.product_id).toBe(validProdUUID);
            expect(item1.product_name).toBe('Harar Roasted Coffee Beans 1kg');
            expect(item1.sku).toBe('ET-DIR-COF-001');
            expect(item1.quantity).toBe(50);
            expect(item1.unit_cost).toBe(600);
            expect(item1.total_cost).toBe(30000);
            expect(item1.retail_price).toBe(850);
            expect(item1.brand).toBe('Harar Special');
            expect(item1.size).toBe('1kg');
            expect(item1.unit).toBe('Bag');
            expect(item1.category).toBe('Beverages');
            expect(item1.identity_type).toBe('known');
            expect(item1.pack_quantity).toBe(10);
            expect(item1.case_size).toBe(20);
            expect(item1.package_type).toBe('Carton');
            expect(item1.min_stock).toBe(25);
            expect(item1.max_stock).toBe(500);
            expect(item1.custom_attributes.identity.variant).toBe('Dark Roast');
            expect(item1.custom_attributes.storage.type).toBe('Ambient');
            expect(item1.custom_attributes.categorySpecific.roastLevel).toBe('French Roast');

            // Item 2: Ad-hoc item with non-UUID mapped to null
            const item2 = insertedItems[1];
            expect(item2.product_id).toBeNull();
            expect(item2.product_name).toBe('Local Woven Jute Sacks (Bundles of 50)');
            expect(item2.identity_type).toBe('new');
            expect(item2.pack_quantity).toBe(50);
            expect(item2.package_type).toBe('Bale');
        });
    });

    describe('buildPurchaseOrders Helper Attribute Generation', () => {
        const mockSites = [
            { id: 'site-wh-1', name: 'Adama Hub', type: 'Distribution Center', country: 'ET', currency: 'ETB', region_code: 'et_adama' },
            { id: 'site-wh-2', name: 'Dire Dawa Hub', type: 'Warehouse', country: 'ET', currency: 'ETB', region_code: 'et_dire' },
            { id: 'site-wh-ke', name: 'Nairobi DC', type: 'Distribution Center', country: 'KE', currency: 'KSh', region_code: 'ke_nairobi' }
        ];

        it('generates fully populated PO attributes with regional sovereignty and logistics parameters', () => {
            const items: POItem[] = [
                {
                    productName: 'Sunflower Cooking Oil 5L',
                    quantity: 40,
                    unitCost: 1200,
                    totalCost: 48000,
                    retailPrice: 1500,
                    packQuantity: 4,
                    caseSize: 8,
                    packageType: 'Carton'
                }
            ];

            const generated = buildPurchaseOrders({
                destinationSiteIds: ['site-wh-1'],
                processedItems: items,
                quantityDistribution: 'single',
                shippingCost: 2000,
                discountRate: 5,
                taxRate: 0,
                sites: mockSites,
                currencySymbol: 'ETB',
                vendorId: 'sup-oil-123',
                vendorName: 'Habesha Agro Processing',
                expectedDate: '2026-10-25',
                poNotes: 'Urgent cooking oil replenishment',
                paymentTerms: 'Immediate',
                poPriority: 'Urgent',
                userName: 'Admin User',
                poRequestedBy: 'Logistics Lead',
                incoterms: 'CIF',
                tempReq: 'Ambient',
                shelfLife: '365 days',
                dockSlot: 'DOCK-01'
            });

            expect(generated).toHaveLength(1);
            const po = generated[0].po;

            expect(po.siteId).toBe('site-wh-1');
            expect(po.site_id).toBe('site-wh-1');
            expect(po.supplierId).toBe('sup-oil-123');
            expect(po.supplierName).toBe('Habesha Agro Processing');
            expect(po.destination).toBe('Adama Hub');
            expect(po.country_code).toBe('ET');
            expect(po.countryCode).toBe('ET');
            expect(po.region_code).toBe('et_adama');
            expect(po.regionCode).toBe('et_adama');
            expect(po.currency).toBe('ETB');
            expect(po.incoterms).toBe('CIF');
            expect(po.tempReq).toBe('Ambient');
            expect(po.shelfLife).toBe('365 days');
            expect(po.dockSlot).toBe('DOCK-01');
            expect(po.priority).toBe('Urgent');
            expect(po.paymentTerms).toBe('Immediate');
            expect(po.expectedDelivery).toBe('2026-10-25');
            expect(po.notes).toBe('Urgent cooking oil replenishment');
            expect(po.createdBy).toBe('Admin User');
            expect(po.requestedBy).toBe('Logistics Lead');
            expect(po.totalAmount).toBe(47600);
            expect(po.discount).toBe(2400);
            expect(po.shippingCost).toBe(2000);
        });

        it('splits quantity across multiple destination sites while maintaining each site regional sovereignty', () => {
            const items: POItem[] = [
                {
                    productName: 'Rice 25kg Sacks',
                    quantity: 75,
                    unitCost: 2000,
                    totalCost: 150000
                }
            ];

            const generated = buildPurchaseOrders({
                destinationSiteIds: ['site-wh-1', 'site-wh-2'],
                processedItems: items,
                quantityDistribution: 'split',
                shippingCost: 0,
                discountRate: 0,
                taxRate: 0,
                sites: mockSites,
                currencySymbol: 'ETB',
                vendorId: 'sup-rice',
                vendorName: 'Direct Grain Millers',
                expectedDate: '2026-10-30',
                poNotes: 'Split across two regional hubs',
                paymentTerms: 'Net 30',
                poPriority: 'Normal'
            });

            expect(generated).toHaveLength(2);

            const po1 = generated[0];
            expect(po1.po.siteId).toBe('site-wh-1');
            expect(po1.po.region_code).toBe('et_adama');
            expect(po1.items[0].quantity).toBe(38);
            expect(po1.items[0].totalCost).toBe(76000);

            const po2 = generated[1];
            expect(po2.po.siteId).toBe('site-wh-2');
            expect(po2.po.region_code).toBe('et_dire');
            expect(po2.items[0].quantity).toBe(37);
            expect(po2.items[0].totalCost).toBe(74000);

            expect(po1.items[0].quantity + po2.items[0].quantity).toBe(75);
        });
    });
});
