import { describe, it, expect } from 'vitest';
import type { Product } from '../../types';

describe('Inventory Duplicate & Ghost On-Order Deduplication', () => {
    const makeProduct = (overrides: Partial<Product>): Product => ({
        id: 'p_1',
        name: 'Juma Ugali Flour 1kg',
        sku: 'KEGR001',
        category: 'Grains, Pasta & Rice',
        price: 550,
        stock: 144,
        location: 'A-01-01',
        siteId: 'site-ke-2',
        status: 'active',
        unit: 'Bale',
        ...overrides
    } as Product);

    describe('Ghost On-Order Filter Logic', () => {
        const filterVisibleProducts = (products: Product[], allProducts: Product[]) => {
            return products.filter(product => {
                const isGhostOnOrder = (product.location === 'On Order' || !product.location) && (!product.stock || product.stock === 0);
                if (!isGhostOnOrder) return true;

                const cleanSku = product.sku ? product.sku.replace(/[-\s]/g, '').toUpperCase() : '';
                const siteId = product.siteId || (product as any).site_id;

                const hasRealProduct = allProducts.some(p =>
                    p.id !== product.id &&
                    (p.sku ? p.sku.replace(/[-\s]/g, '').toUpperCase() : '') === cleanSku &&
                    (p.siteId === siteId || (p as any).site_id === siteId) &&
                    ((p.stock !== undefined && p.stock > 0) || (p.location && p.location !== 'On Order'))
                ) || products.some(p =>
                    p.id !== product.id &&
                    (p.sku ? p.sku.replace(/[-\s]/g, '').toUpperCase() : '') === cleanSku &&
                    (p.siteId === siteId || (p as any).site_id === siteId) &&
                    ((p.stock !== undefined && p.stock > 0) || (p.location && p.location !== 'On Order'))
                );

                return !hasRealProduct;
            });
        };

        it('filters out 0-stock On-Order ghost row when active physical stock row exists for the same SKU at the site', () => {
            const realProduct = makeProduct({
                id: 'real-1',
                sku: 'KEGR001',
                stock: 144,
                location: 'A-01-01',
                siteId: 'site-ke-2'
            });

            const ghostProduct = makeProduct({
                id: 'ghost-1',
                sku: 'KEGR001',
                stock: 0,
                location: 'On Order',
                siteId: 'site-ke-2'
            });

            const rawProducts = [ghostProduct, realProduct];
            const visible = filterVisibleProducts(rawProducts, rawProducts);

            expect(visible).toHaveLength(1);
            expect(visible[0].id).toBe('real-1');
            expect(visible[0].stock).toBe(144);
            expect(visible[0].location).toBe('A-01-01');
        });

        it('handles hyphenated vs unhyphenated SKU comparison (e.g. KE-GR-001 vs KEGR001)', () => {
            const realProduct = makeProduct({
                id: 'real-1',
                sku: 'KEGR001',
                stock: 144,
                location: 'A-01-01',
                siteId: 'site-ke-2'
            });

            const ghostProduct = makeProduct({
                id: 'ghost-1',
                sku: 'KE-GR-001',
                stock: 0,
                location: 'On Order',
                siteId: 'site-ke-2'
            });

            const rawProducts = [ghostProduct, realProduct];
            const visible = filterVisibleProducts(rawProducts, rawProducts);

            expect(visible).toHaveLength(1);
            expect(visible[0].id).toBe('real-1');
        });

        it('preserves an On-Order record if it is the ONLY record for that SKU at that site (no real stock yet)', () => {
            const newInboundProduct = makeProduct({
                id: 'new-inbound-1',
                sku: 'KENEW001',
                stock: 0,
                location: 'On Order',
                siteId: 'site-ke-2'
            });

            const rawProducts = [newInboundProduct];
            const visible = filterVisibleProducts(rawProducts, rawProducts);

            expect(visible).toHaveLength(1);
            expect(visible[0].id).toBe('new-inbound-1');
        });

        it('does not filter out a 0-stock product if it has an assigned warehouse bin (physical out-of-stock item)', () => {
            const outOfStockPhysical = makeProduct({
                id: 'bin-empty-1',
                sku: 'KEGR002',
                stock: 0,
                location: 'B-02-04',
                siteId: 'site-ke-2'
            });

            const rawProducts = [outOfStockPhysical];
            const visible = filterVisibleProducts(rawProducts, rawProducts);

            expect(visible).toHaveLength(1);
            expect(visible[0].id).toBe('bin-empty-1');
        });

        it('does not filter across different sites (Site A stock does not hide Site B new PO placeholder)', () => {
            const siteAProduct = makeProduct({
                id: 'site-a-1',
                sku: 'KEGR001',
                stock: 100,
                location: 'A-01-01',
                siteId: 'site-ke-1'
            });

            const siteBPlaceholder = makeProduct({
                id: 'site-b-ghost',
                sku: 'KEGR001',
                stock: 0,
                location: 'On Order',
                siteId: 'site-ke-2'
            });

            const rawProducts = [siteAProduct, siteBPlaceholder];
            const visible = filterVisibleProducts(rawProducts, rawProducts);

            expect(visible).toHaveLength(2);
        });
    });

    describe('getOtherLocationsForSku Logic', () => {
        const getOtherLocations = (sku: string, currentProductId: string, allProducts: Product[], currentSiteId?: string) => {
            if (!sku) return { count: 0, locations: [], details: [] };

            const cleanSku = sku.replace(/[-\s]/g, '').toUpperCase();
            const sameSkuProducts = allProducts.filter(p =>
                (p.sku ? p.sku.replace(/[-\s]/g, '').toUpperCase() : '') === cleanSku &&
                p.id !== currentProductId &&
                p.location &&
                p.location.trim() !== '' &&
                p.location !== 'On Order' &&
                (p.stock !== undefined && p.stock > 0) &&
                (currentSiteId ? (p.siteId === currentSiteId || (p as any).site_id === currentSiteId) : true)
            );

            const locationMap: Record<string, any> = {};
            sameSkuProducts.forEach(p => {
                if (p.location && !locationMap[p.location]) {
                    locationMap[p.location] = {
                        location: p.location,
                        stock: p.stock,
                        siteId: p.siteId || (p as any).site_id || null,
                        productId: p.id
                    };
                }
            });

            const details = Object.values(locationMap);
            const uniqueLocations = details.map(d => d.location);

            return {
                count: uniqueLocations.length,
                locations: uniqueLocations.slice(0, 3),
                details
            };
        };

        it('never includes On-Order placeholders in other locations count', () => {
            const realProduct1 = makeProduct({
                id: 'p-1',
                sku: 'KEGR001',
                stock: 144,
                location: 'A-01-01',
                siteId: 'site-ke-2'
            });

            const ghostPlaceholder = makeProduct({
                id: 'ghost-1',
                sku: 'KEGR001',
                stock: 0,
                location: 'On Order',
                siteId: 'site-ke-2'
            });

            const allProducts = [realProduct1, ghostPlaceholder];
            const otherLocs = getOtherLocations('KEGR001', 'p-1', allProducts, 'site-ke-2');

            // Should be 0 other locations, NOT "+1 other location"
            expect(otherLocs.count).toBe(0);
            expect(otherLocs.locations).toHaveLength(0);
        });

        it('includes legitimate secondary physical warehouse locations holding stock', () => {
            const primaryBay = makeProduct({
                id: 'bay-1',
                sku: 'KEGR001',
                stock: 100,
                location: 'A-01-01',
                siteId: 'site-ke-2'
            });

            const overflowBay = makeProduct({
                id: 'bay-2',
                sku: 'KEGR001',
                stock: 44,
                location: 'A-01-02',
                siteId: 'site-ke-2'
            });

            const allProducts = [primaryBay, overflowBay];
            const otherLocs = getOtherLocations('KEGR001', 'bay-1', allProducts, 'site-ke-2');

            expect(otherLocs.count).toBe(1);
            expect(otherLocs.locations).toContain('A-01-02');
        });
    });
});
