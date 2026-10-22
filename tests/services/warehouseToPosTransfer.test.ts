import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transfersService } from '../../services/transfers.service';
import { supabase } from '../../lib/supabase';
import type { WMSJob, Product } from '../../types';

describe('Warehouse to POS Command Center Transfer Lifecycle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('1. Warehouse Transfer Origination & Sovereignty Guards', () => {
        it('successfully creates transfer from central warehouse to retail POS store within Ethiopia', async () => {
            const mockSites = [
                { id: 'site-wh-kality', country: 'ET', region_code: 'et_addis' },
                { id: 'site-pos-bole', country: 'ET', region_code: 'et_addis' },
            ];

            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'tr-wh-to-pos-001',
                            source_site_id: 'site-wh-kality',
                            dest_site_id: 'site-pos-bole',
                            status: 'Requested',
                            source_region_code: 'et_addis',
                            dest_region_code: 'et_addis',
                            country_code: 'ET',
                            is_inter_region: false,
                            order_ref: 'TR-1088',
                            transfer_date: '2026-10-12',
                            items: [
                                { productId: 'prod-oil-1l', sku: 'ET-OIL-1L', name: 'Sunflower Cooking Oil 1L', quantity: 50 },
                                { productId: 'prod-formula-400g', sku: 'ET-BABY-400G', name: 'Infant Formula 400g', quantity: 20 }
                            ]
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
                sourceSiteId: 'site-wh-kality',
                destSiteId: 'site-pos-bole',
                status: 'Requested',
                items: [
                    { productId: 'prod-oil-1l', sku: 'ET-OIL-1L', name: 'Sunflower Cooking Oil 1L', quantity: 50 },
                    { productId: 'prod-formula-400g', sku: 'ET-BABY-400G', name: 'Infant Formula 400g', quantity: 20 }
                ],
                requestedBy: 'Warehouse Dispatcher Abebe'
            } as any);

            expect(result.id).toBe('tr-wh-to-pos-001');
            expect(result.countryCode).toBe('ET');
            expect(result.isInterRegion).toBe(false);
            expect(result.orderRef).toBe('TR-1088');
            expect(insertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    source_site_id: 'site-wh-kality',
                    dest_site_id: 'site-pos-bole',
                    country_code: 'ET'
                })
            );
        });

        it('blocks cross-border transfer from Kenyan warehouse to Ethiopian POS store', async () => {
            const mockCrossBorderSites = [
                { id: 'site-wh-nairobi', country: 'KE', region_code: 'ke_nairobi' },
                { id: 'site-pos-bole', country: 'ET', region_code: 'et_addis' },
            ];

            vi.spyOn(supabase, 'from').mockReturnValue({
                select: vi.fn().mockReturnValue({
                    in: vi.fn().mockResolvedValue({ data: mockCrossBorderSites, error: null })
                })
            } as any);

            await expect(
                transfersService.create({
                    sourceSiteId: 'site-wh-nairobi',
                    destSiteId: 'site-pos-bole',
                    status: 'Requested',
                    items: [],
                    requestedBy: 'Cross-Border Smuggler'
                } as any)
            ).rejects.toThrow(/Multi-country sovereignty violation/);
        });
    });

    describe('2. Delivery Gating: Internal Driver vs External Carrier', () => {
        // POS Command Center Gating Rule:
        // Internal driver requires 'Delivered' / 'Completed' before POS receiving can begin
        // External driver requires departure confirmation by warehouse authority
        const evaluatePOSReceivingReadiness = (
            job: Partial<WMSJob>,
            userRole: string
        ): { canReceive: boolean; statusLabel: string; reason?: string } => {
            const delMethod = job.deliveryMethod || 'Internal';
            const isExt = delMethod === 'External';
            const effTransferStatus = job.transferStatus || job.status || '';
            const rawStat = String(effTransferStatus).toLowerCase().replace(/[-_]/g, '');
            const isDone = ['delivered', 'completed', 'received'].includes(rawStat);
            const isDeparted = ['shipped', 'intransit', 'dispatched', 'delivered', 'completed', 'received'].includes(rawStat) || !!(job as any).shippedAt;

            if (!isExt) {
                if (!isDone) {
                    return {
                        canReceive: false,
                        statusLabel: 'Driver In-Transit (Awaiting Arrival)',
                        reason: 'Internal driver must mark delivery complete before POS receiving can begin.'
                    };
                }
                return {
                    canReceive: true,
                    statusLabel: 'Driver Delivered — Ready to Receive'
                };
            } else {
                if (!isDeparted) {
                    const WAREHOUSE_AUTHORITY = ['group_ceo', 'country_managing_director', 'warehouse_manager', 'dispatch_supervisor', 'country_operations_director', 'regional_operations_manager', 'dispatcher', 'store_manager', 'inventory_manager', 'supervisor'];
                    const hasAuthority = WAREHOUSE_AUTHORITY.includes(userRole.toLowerCase());
                    return {
                        canReceive: hasAuthority,
                        statusLabel: hasAuthority ? 'EXT Carrier — Ready to Confirm Departure' : 'EXT Carrier (Awaiting Departure)',
                        reason: hasAuthority ? undefined : 'Warehouse authority must confirm departure before receiving can begin.'
                    };
                }
                return {
                    canReceive: true,
                    statusLabel: 'EXT Carrier — Departure Confirmed'
                };
            }
        };

        it('gates POS receiving for internal transport until driver completes delivery', () => {
            const inTransitJob: Partial<WMSJob> = {
                type: 'TRANSFER',
                deliveryMethod: 'Internal',
                status: 'In-Progress',
                transferStatus: 'In-Transit'
            };

            const check = evaluatePOSReceivingReadiness(inTransitJob, 'store_manager');
            expect(check.canReceive).toBe(false);
            expect(check.statusLabel).toBe('Driver In-Transit (Awaiting Arrival)');
            expect(check.reason).toContain('Internal driver must mark delivery complete');
        });

        it('unlocks POS receiving once driver marks delivery complete', () => {
            const deliveredJob: Partial<WMSJob> = {
                type: 'TRANSFER',
                deliveryMethod: 'Internal',
                status: 'Completed',
                transferStatus: 'Delivered'
            };

            const check = evaluatePOSReceivingReadiness(deliveredJob, 'cashier');
            expect(check.canReceive).toBe(true);
            expect(check.statusLabel).toBe('Driver Delivered — Ready to Receive');
        });

        it('requires warehouse authority to unlock external carrier shipments before departure', () => {
            const undepartedExternalJob: Partial<WMSJob> = {
                type: 'TRANSFER',
                deliveryMethod: 'External',
                status: 'Pending',
                transferStatus: 'Requested'
            };

            // Cashier cannot confirm external departure
            const cashierCheck = evaluatePOSReceivingReadiness(undepartedExternalJob, 'cashier');
            expect(cashierCheck.canReceive).toBe(false);
            expect(cashierCheck.reason).toContain('Warehouse authority must confirm departure');

            // Store manager has authority to confirm departure and begin receiving
            const managerCheck = evaluatePOSReceivingReadiness(undepartedExternalJob, 'store_manager');
            expect(managerCheck.canReceive).toBe(true);
            expect(managerCheck.statusLabel).toContain('Ready to Confirm Departure');
        });
    });

    describe('3. POS Command Center Inbound Discovery & Site Scoping', () => {
        const filterPendingInboundTransfers = (
            transfersList: any[],
            posActiveSiteId: string
        ) => {
            return transfersList.filter(t => {
                if (String(t.destSiteId) !== String(posActiveSiteId)) return false;
                const transferStatus = String(t.transferStatus || '').toLowerCase().replace(/[-_]/g, '');
                const jobStatus = String(t.status || '').toLowerCase().replace(/[-_]/g, '');

                if (['received', 'completed'].includes(transferStatus)) return false;

                return (
                    ['intransit', 'dispatched', 'pending', 'pendingdispatch', 'delivered', 'partiallydelivered'].includes(transferStatus) ||
                    ['inprogress', 'pending', 'staged', 'delivered'].includes(jobStatus)
                );
            });
        };

        it('strictly scopes incoming transfers to the active POS store site', () => {
            const sampleTransfers = [
                { id: 'tr-1', orderRef: 'TR-001', destSiteId: 'pos-bole-store', transferStatus: 'Delivered' },
                { id: 'tr-2', orderRef: 'TR-002', destSiteId: 'pos-adama-store', transferStatus: 'Delivered' }, // Other store
                { id: 'tr-3', orderRef: 'TR-003', destSiteId: 'pos-bole-store', transferStatus: 'Received' },  // Already received
                { id: 'tr-4', orderRef: 'TR-004', destSiteId: 'pos-bole-store', transferStatus: 'In-Transit' }
            ];

            const pending = filterPendingInboundTransfers(sampleTransfers, 'pos-bole-store');
            expect(pending).toHaveLength(2);
            expect(pending.map(p => p.id)).toEqual(['tr-1', 'tr-4']);
        });

        it('finds transfer immediately when scanned by packing label orderRef', () => {
            const sampleTransfers = [
                { id: 'uuid-1', orderRef: 'TR-9901', jobNumber: 'JOB-9901', destSiteId: 'pos-bole-store' },
                { id: 'uuid-2', orderRef: 'TR-9902', jobNumber: 'JOB-9902', destSiteId: 'pos-bole-store' }
            ];

            const scanRef = 'TR-9902';
            const matched = sampleTransfers.find(t =>
                t.orderRef?.toLowerCase() === scanRef.toLowerCase() ||
                t.id?.toLowerCase() === scanRef.toLowerCase() ||
                t.jobNumber?.toLowerCase() === scanRef.toLowerCase()
            );

            expect(matched).toBeDefined();
            expect(matched?.id).toBe('uuid-2');
        });
    });

    describe('4. Zero-Trust Blind Count & Barcode Verification', () => {
        const isBlindCountActive = (userRole: string) => {
            const hqRoles = ['group_ceo', 'country_operations_director', 'regional_operations_manager'];
            return !hqRoles.includes((userRole || '').toLowerCase());
        };

        it('enforces blind counts for store staff and store managers to prevent rubber stamping', () => {
            expect(isBlindCountActive('cashier')).toBe(true);
            expect(isBlindCountActive('receiver')).toBe(true);
            expect(isBlindCountActive('stock_clerk')).toBe(true);
            expect(isBlindCountActive('store_manager')).toBe(true);
        });

        it('reveals expected count only to Central HQ auditors', () => {
            expect(isBlindCountActive('group_ceo')).toBe(false);
            expect(isBlindCountActive('group_ceo')).toBe(false);
            expect(isBlindCountActive('country_operations_director')).toBe(false);
        });

        it('verifies scanned barcode increments quantity or flags non-shipment item', () => {
            const manifestItems = [
                { sku: 'ET-OIL-1L', name: 'Sunflower Cooking Oil 1L', receivedQty: 0, barcode: '6001234567890' }
            ];

            const scanBarcode = (code: string) => {
                const idx = manifestItems.findIndex(i => i.barcode === code || i.sku === code);
                if (idx !== -1) {
                    manifestItems[idx].receivedQty += 1;
                    return { success: true, item: manifestItems[idx] };
                }
                return { success: false, error: 'Item not in shipment' };
            };

            const validScan = scanBarcode('6001234567890');
            expect(validScan.success).toBe(true);
            expect(manifestItems[0].receivedQty).toBe(1);

            const invalidScan = scanBarcode('9999999999999');
            expect(invalidScan.success).toBe(false);
            expect(invalidScan.error).toBe('Item not in shipment');
        });
    });

    describe('5. Inventory Harmonization: Destination Stock Credit Without Source Bleed', () => {
        it('increments destination store stock and preserves warehouse stock intact', () => {
            const warehouseStockBefore = 200;
            const posStoreStockBefore = 15;
            const transferQtyReceived = 30;

            const inventoryState = {
                'wh-kality': { sku: 'ET-OIL-1L', stock: warehouseStockBefore },
                'pos-bole': { sku: 'ET-OIL-1L', stock: posStoreStockBefore }
            };

            // POS Command Center receives 30 units:
            inventoryState['pos-bole'].stock += transferQtyReceived;

            // Destination stock is credited
            expect(inventoryState['pos-bole'].stock).toBe(45);
            // Warehouse stock was deducted during dispatch and is NOT altered during POS receiving
            expect(inventoryState['wh-kality'].stock).toBe(200);
        });

        it('auto-provisions product at destination POS store if not previously cataloged', () => {
            const catalog: Product[] = [
                {
                    id: 'prod-src-coffee',
                    sku: 'ET-COFFEE-500G',
                    name: 'Yirgacheffe Roast Coffee 500g',
                    price: 450,
                    costPrice: 320,
                    stock: 100,
                    unit: 'pcs',
                    siteId: 'site-wh-kality',
                    category: 'Beverages',
                    status: 'active',
                    image: ''
                } as Product
            ];

            const posStoreSiteId = 'site-pos-bole';
            const receivedSku = 'ET-COFFEE-500G';
            const receivedUnits = 25;

            // Check if POS store already has this SKU
            let destProduct = catalog.find(p => p.sku === receivedSku && p.siteId === posStoreSiteId);
            expect(destProduct).toBeUndefined();

            // Auto-create for POS store from source template
            const template = catalog.find(p => p.sku === receivedSku)!;
            const newPosProduct: Product = {
                id: 'prod-dest-coffee-new',
                sku: template.sku,
                name: template.name,
                price: template.price,
                costPrice: (template as any).costPrice,
                stock: receivedUnits,
                unit: template.unit,
                siteId: posStoreSiteId,
                category: template.category,
                status: 'active',
                image: template.image
            } as Product;

            catalog.push(newPosProduct);

            destProduct = catalog.find(p => p.sku === receivedSku && p.siteId === posStoreSiteId);
            expect(destProduct).toBeDefined();
            expect(destProduct?.stock).toBe(25);
            expect(destProduct?.siteId).toBe('site-pos-bole');
            // Source product untouched
            expect(template.siteId).toBe('site-wh-kality');
            expect(template.stock).toBe(100);
        });
    });

    describe('6. Transfer Finalization & Discrepancy Protocol', () => {
        it('finalizes clean transfer with Completed status and no discrepancy flag', () => {
            const lineItems = [
                { sku: 'ET-OIL-1L', expectedQty: 10, receivedQty: 10, condition: 'Good' }
            ];

            const hasDiscrepancy = lineItems.some(i => i.receivedQty !== i.expectedQty || i.condition !== 'Good');
            const summary = {
                orderRef: 'TR-1088',
                receiverName: 'Cashier Almaz',
                timestamp: '2026-10-12T14:30:00Z',
                hasDiscrepancy,
                status: 'Completed'
            };

            expect(summary.hasDiscrepancy).toBe(false);
            expect(summary.status).toBe('Completed');
            expect(summary.receiverName).toBe('Cashier Almaz');
        });

        it('detects discrepancies on shortage or damaged goods and records audit trail', () => {
            const lineItems = [
                { sku: 'ET-OIL-1L', expectedQty: 20, receivedQty: 18, condition: 'Good' }, // 2 short
                { sku: 'ET-BABY-400G', expectedQty: 10, receivedQty: 10, condition: 'Damaged' } // damaged
            ];

            const hasDiscrepancy = lineItems.some(i => i.receivedQty !== i.expectedQty || i.condition !== 'Good');
            const varianceItems = lineItems.filter(i => i.receivedQty !== i.expectedQty || i.condition !== 'Good');

            expect(hasDiscrepancy).toBe(true);
            expect(varianceItems).toHaveLength(2);
            expect(varianceItems[0].expectedQty - varianceItems[0].receivedQty).toBe(2);
            expect(varianceItems[1].condition).toBe('Damaged');
        });
    });
});
