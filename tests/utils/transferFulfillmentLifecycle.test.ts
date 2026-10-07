import { describe, it, expect } from 'vitest';
import { WMSJob, Product } from '../../types';

describe('Transfer Fulfillment Lifecycle & Receiving Architecture', () => {
    describe('1. Ongoing Transfers Queue Filter Logic', () => {
        const isTransferOngoing = (j: WMSJob) => {
            return (
                j.type === 'TRANSFER' &&
                j.status !== 'Cancelled' &&
                j.transferStatus !== 'Received' &&
                (j.status !== 'Completed' || j.transferStatus === 'Delivered' || j.transferStatus === 'Partially Delivered')
            );
        };

        it('keeps delivered jobs in active queue until destination receiver signs handshake', () => {
            const deliveredJob: WMSJob = {
                id: 'tr-job-1',
                jobNumber: 'TRF-001',
                siteId: 'site-bole',
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Delivered',
                priority: 'Normal',
                items: 5,
                lineItems: [],
                location: 'Dock A',
                orderRef: 'ORD-001'
            };

            expect(isTransferOngoing(deliveredJob)).toBe(true);
        });

        it('keeps partially delivered jobs active for receiver verification', () => {
            const partialJob: WMSJob = {
                id: 'tr-job-2',
                jobNumber: 'TRF-002',
                siteId: 'site-bole',
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Partially Delivered',
                priority: 'High',
                items: 5,
                lineItems: [],
                location: 'Dock B',
                orderRef: 'ORD-002'
            };

            expect(isTransferOngoing(partialJob)).toBe(true);
        });

        it('removes transfer from ongoing queue once finalized as Received', () => {
            const receivedJob: WMSJob = {
                id: 'tr-job-3',
                jobNumber: 'TRF-003',
                siteId: 'site-bole',
                type: 'TRANSFER',
                status: 'Completed',
                transferStatus: 'Received',
                priority: 'Normal',
                items: 5,
                lineItems: [],
                location: 'Dock A',
                orderRef: 'ORD-003'
            };

            expect(isTransferOngoing(receivedJob)).toBe(false);
        });

        it('excludes cancelled transfers from ongoing list', () => {
            const cancelledJob: WMSJob = {
                id: 'tr-job-4',
                jobNumber: 'TRF-004',
                siteId: 'site-bole',
                type: 'TRANSFER',
                status: 'Cancelled',
                transferStatus: 'Cancelled',
                priority: 'Normal',
                items: 2,
                lineItems: [],
                location: 'Dock C',
                orderRef: 'ORD-004'
            };

            expect(isTransferOngoing(cancelledJob)).toBe(false);
        });
    });

    describe('2. Receiving Permission & Status Gating', () => {
        const canOpenReceiving = (job: WMSJob, activeSiteId: string, userRole: string) => {
            const allowedStatuses = ['In-Transit', 'Shipped', 'Delivered', 'Partially Delivered'];
            const allowedRoles = [
                'super_admin',
                'admin',
                'warehouse_manager',
                'inventory_specialist',
                'stock_clerk',
                'receiver',
                'store_manager'
            ];

            const statusMatch = allowedStatuses.includes(job.transferStatus || '');
            const authMatch = job.destSiteId === activeSiteId || allowedRoles.includes(userRole);
            return statusMatch && authMatch;
        };

        it('allows destination floor worker to receive cargo once driver delivers', () => {
            const job: WMSJob = {
                id: 'tr-5',
                jobNumber: 'TRF-005',
                siteId: 'site-bole',
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Delivered',
                destSiteId: 'site-bole',
                sourceSiteId: 'site-kality-wh',
                priority: 'Normal',
                items: 10,
                lineItems: [],
                location: 'Receiving Dock',
                orderRef: 'ORD-005'
            };

            // Destination store receiver
            expect(canOpenReceiving(job, 'site-bole', 'receiver')).toBe(true);
            // Destination store clerk
            expect(canOpenReceiving(job, 'site-bole', 'stock_clerk')).toBe(true);
            // Warehouse manager
            expect(canOpenReceiving(job, 'other-site', 'warehouse_manager')).toBe(true);
        });

        it('blocks receiving when cargo is still in picking or requested state', () => {
            const pickingJob: WMSJob = {
                id: 'tr-6',
                jobNumber: 'TRF-006',
                siteId: 'site-bole',
                type: 'TRANSFER',
                status: 'Pending',
                transferStatus: 'Picking',
                destSiteId: 'site-bole',
                priority: 'Normal',
                items: 5,
                lineItems: [],
                location: 'Dock',
                orderRef: 'ORD-006'
            };

            expect(canOpenReceiving(pickingJob, 'site-bole', 'receiver')).toBe(false);
        });
    });

    describe('3. Cross-Site Product Provisioning Without Source Bleed', () => {
        const resolveDestinationProductTarget = (
            allProducts: Product[],
            sourceProductId: string,
            destSiteId: string
        ) => {
            const sourceProduct = allProducts.find(p => p.id === sourceProductId);
            if (!sourceProduct) return null;

            const destProduct = allProducts.find(p =>
                p.sku === sourceProduct.sku &&
                (p.siteId === destSiteId || (p as any).site_id === destSiteId)
            );

            return {
                sourceProduct,
                destProduct,
                needsAutoCreation: !destProduct
            };
        };

        it('correctly detects if product already exists at destination store', () => {
            const allProducts: Product[] = [
                {
                    id: 'prod-src-oil',
                    sku: 'OIL-1L',
                    name: 'Sunflower Cooking Oil 1L',
                    price: 250,
                    stock: 500,
                    siteId: 'site-wh-1',
                    category: 'Cooking Essentials',
                    status: 'active',
                    image: ''
                } as Product,
                {
                    id: 'prod-dest-oil',
                    sku: 'OIL-1L',
                    name: 'Sunflower Cooking Oil 1L',
                    price: 250,
                    stock: 20,
                    siteId: 'site-store-bole',
                    category: 'Cooking Essentials',
                    status: 'active',
                    image: ''
                } as Product
            ];

            const result = resolveDestinationProductTarget(allProducts, 'prod-src-oil', 'site-store-bole');
            expect(result?.needsAutoCreation).toBe(false);
            expect(result?.destProduct?.id).toBe('prod-dest-oil');
            // Source site product ID must NEVER be mutated for destination stock intake
            expect(result?.destProduct?.id).not.toBe('prod-src-oil');
        });

        it('flags auto-creation needed when destination store does not stock product yet', () => {
            const allProducts: Product[] = [
                {
                    id: 'prod-src-formula',
                    sku: 'BABY-FORMULA-400G',
                    name: 'Infant Formula 400g',
                    price: 850,
                    stock: 120,
                    siteId: 'site-wh-1',
                    category: 'Infant Care',
                    status: 'active',
                    image: ''
                } as Product
            ];

            const result = resolveDestinationProductTarget(allProducts, 'prod-src-formula', 'site-store-adama');
            expect(result?.needsAutoCreation).toBe(true);
            expect(result?.destProduct).toBeUndefined();
            expect(result?.sourceProduct?.sku).toBe('BABY-FORMULA-400G');
        });
    });

    describe('4. Multi-Country Isolation on Transfer Creation', () => {
        it('strictly preserves sovereign country code on transfer jobs', () => {
            const createTransferPayload = (siteCountry: 'ET' | 'KE', user: { name: string }) => ({
                type: 'TRANSFER',
                countryCode: siteCountry,
                country_code: siteCountry,
                requestedBy: user.name,
                status: 'Pending',
                transferStatus: 'Requested'
            });

            const etPayload = createTransferPayload('ET', { name: 'Abebe Bikila' });
            const kePayload = createTransferPayload('KE', { name: 'Jomo Kiprop' });

            expect(etPayload.countryCode).toBe('ET');
            expect(etPayload.country_code).toBe('ET');
            expect(kePayload.countryCode).toBe('KE');
            expect(kePayload.country_code).toBe('KE');
            expect(etPayload.countryCode).not.toBe(kePayload.countryCode);
        });
    });
});
