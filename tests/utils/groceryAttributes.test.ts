import { describe, it, expect } from 'vitest';
import { resolveSmartProductAttributes } from '../../utils/groceryAttributes';

describe('resolveSmartProductAttributes — Smart Grocery Attribute Engine', () => {
    it('infers brand, net content, bale packaging, stock breakdown, and /kg unit price for Juma Ugali Flour', () => {
        const profile = resolveSmartProductAttributes(
            {
                id: 'prod-1',
                name: 'Juma Ugali Flour',
                sku: 'KEGR001',
                category: 'Grains, Pasta & Rice',
                size: '1kg',
                unit: 'PACK',
                packQuantity: 12,
                price: 180,
                stock: 88,
            },
            [],
            'KES'
        );

        expect(profile.brand).toBe('Juma');
        expect(profile.subcategory).toBe('Flour & Baking');
        expect(profile.netContent).toBe('1kg');
        expect(profile.physicalForm).toBe('Flour / Milled Grain');
        expect(profile.packageType).toBe('Bale');
        expect(profile.packQty).toBe(12);
        expect(profile.packBadge).toContain('12');
        expect(profile.stockBreakdown).toBe('7 Bales + 4 pk');
        expect(profile.unitPriceLabel).toBe('KES 180/kg');
        expect(profile.isHalal).toBe(true);
        expect(profile.requiresBatch).toBe(true);
        expect(profile.quickPills.length).toBeGreaterThanOrEqual(4);
    });

    it('infers canned food form, tin can material, /100g unit price, and carton breakdown for Wanchi Tuna', () => {
        const profile = resolveSmartProductAttributes(
            {
                id: 'prod-2',
                name: 'Wanchi Tuna Chunks in Oil',
                sku: 'TS001',
                category: 'Canned Food & Soups',
                size: '330g',
                unit: 'PACK',
                packQuantity: 24,
                price: 330,
                stock: 200,
            },
            [],
            'KES'
        );

        expect(profile.brand).toBe('Wanchi');
        expect(profile.subcategory).toBe('Canned Seafood');
        expect(profile.netContent).toBe('330g');
        expect(profile.packagingMaterial).toBe('Tin Can');
        expect(profile.unitPriceLabel).toBe('KES 100/100g');
        expect(profile.stockBreakdown).toBe('8 Cartons + 8 pk');
        expect(profile.isPerishable).toBe(true);
    });

    it('infers chilled storage, perishable flag, and /L unit price for fresh dairy items', () => {
        const profile = resolveSmartProductAttributes(
            {
                id: 'prod-3',
                name: 'Brookside Fresh Whole Milk 500ml',
                sku: 'KEDA002',
                category: 'Dairy, Eggs & Cheese',
                unit: 'PACK',
                price: 65,
                stock: 30,
            },
            [],
            'KES'
        );

        expect(profile.brand).toBe('Brookside');
        expect(profile.subcategory).toBe('Milk & Cream');
        expect(profile.netContent).toBe('500ml');
        expect(profile.storageType).toBe('Chilled (0-4°C)');
        expect(profile.isPerishable).toBe(true);
        expect(profile.unitPriceLabel).toBe('KES 130/L');
        expect(profile.inboundQcDirective).toContain('0–4°C');
    });

    it('infers serial tracking and non-halal/non-food flags for electronics like Amazon Kindle', () => {
        const profile = resolveSmartProductAttributes(
            {
                id: 'prod-4',
                name: 'Amazon Kindle Paperwhite',
                sku: 'KEEL001',
                category: 'Electronics & Batteries',
                unit: 'UNIT',
                price: 18500,
                stock: 5,
            },
            [],
            'KES'
        );

        expect(profile.brand).toBe('Amazon');
        expect(profile.requiresSerial).toBe(true);
        expect(profile.isHalal).toBe(false);
        expect(profile.isPerishable).toBe(false);
        expect(profile.quickPills.some(p => p.label === 'Serial Tracked')).toBe(true);
    });
});
