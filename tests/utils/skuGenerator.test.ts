import { describe, it, expect } from 'vitest';
import { generateSKU, isValidSKU, extractCategoryFromSKU } from '../../utils/skuGenerator';

describe('Multi-Country SKU Generator', () => {
    it('generates legacy SKUs when no country is provided for backward compatibility', () => {
        const sku = generateSKU('Fruit & Vegetables', []);
        expect(sku).toBe('FR001');

        const nextSku = generateSKU('Fruit & Vegetables', [{ sku: 'FR001' }, { sku: 'FR002' }]);
        expect(nextSku).toBe('FR003');
    });

    it('generates Ethiopia country-prefixed SKU (ET-CAT-SEQ)', () => {
        const ethSku = generateSKU('Fruit & Vegetables', [], undefined, 'ET');
        expect(ethSku).toBe('ET-FR001');

        const nextEthSku = generateSKU(
            'Fruit & Vegetables',
            [{ sku: 'ET-FR001' }, { sku: 'ET-FR002' }],
            undefined,
            'ET'
        );
        expect(nextEthSku).toBe('ET-FR003');
    });

    it('generates Kenya country-prefixed SKU (KE-CAT-SEQ)', () => {
        const kenyaSku = generateSKU('Drinks & Beverages', [], undefined, 'KE');
        expect(kenyaSku).toBe('KE-BV001');

        const nextKenyaSku = generateSKU(
            'Drinks & Beverages',
            [{ sku: 'KE-BV001' }, { sku: 'KE-BV002' }],
            undefined,
            'KE'
        );
        expect(nextKenyaSku).toBe('KE-BV003');
    });

    it('generates Uganda country-prefixed SKU (UG-CAT-SEQ)', () => {
        const ugandaSku = generateSKU('Dairy, Eggs & Fridge', [], undefined, 'UG');
        expect(ugandaSku).toBe('UG-DY001');
    });

    it('guarantees zero collision across countries: sequences increment independently per market', () => {
        const mixedCatalog = [
            { sku: 'ET-FR001' },
            { sku: 'ET-FR002' },
            { sku: 'ET-FR003' },
            { sku: 'KE-FR001' }
        ];

        // Next Kenya Fruit & Veg SKU should be KE-FR002 (not affected by ET's 3 items)
        const nextKenya = generateSKU('Fruit & Vegetables', mixedCatalog, undefined, 'KE');
        expect(nextKenya).toBe('KE-FR002');

        // Next Ethiopia Fruit & Veg SKU should be ET-FR004
        const nextEthiopia = generateSKU('Fruit & Vegetables', mixedCatalog, undefined, 'ET');
        expect(nextEthiopia).toBe('ET-FR004');
    });

    it('validates both legacy and multi-country SKU formats via isValidSKU', () => {
        // Legacy formats
        expect(isValidSKU('FR001')).toBe(true);
        expect(isValidSKU('FR-001')).toBe(true);
        expect(isValidSKU('BV045')).toBe(true);

        // Multi-country formats
        expect(isValidSKU('KE-FR001')).toBe(true);
        expect(isValidSKU('ET-FR001')).toBe(true);
        expect(isValidSKU('UG-DY002')).toBe(true);
        expect(isValidSKU('RW-MT003')).toBe(true);
        expect(isValidSKU('TZ-SN010')).toBe(true);

        // Invalid formats
        expect(isValidSKU('')).toBe(false);
        expect(isValidSKU('12345')).toBe(false);
        expect(isValidSKU('INVALID-LONG-SKU-12345')).toBe(false);
    });

    it('extracts category correctly from both legacy and country-prefixed SKUs', () => {
        expect(extractCategoryFromSKU('FR001')).toBe('Fruit & Vegetables');
        expect(extractCategoryFromSKU('KE-FR001')).toBe('Fruit & Vegetables');
        expect(extractCategoryFromSKU('ET-DY005')).toBe('Dairy, Eggs & Fridge');
        expect(extractCategoryFromSKU('UG-BV010')).toBe('Drinks & Beverages');
        expect(extractCategoryFromSKU('UNKNOWN')).toBe(null);
    });
});
