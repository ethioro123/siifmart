import { describe, it, expect } from 'vitest';
import { generateSKU, isValidSKU, extractCategoryFromSKU } from '../../utils/skuGenerator';

describe('Multi-Country SKU Generator', () => {
    it('generates legacy SKUs when no country is provided for backward compatibility', () => {
        const sku = generateSKU('Fruit & Vegetables', []);
        expect(sku).toBe('FR001');

        const nextSku = generateSKU('Fruit & Vegetables', [{ sku: 'FR001' }, { sku: 'FR002' }]);
        expect(nextSku).toBe('FR003');
    });

    it('generates Ethiopia country-prefixed SKU without hyphens (ETCATSEQ)', () => {
        const ethSku = generateSKU('Fruit & Vegetables', [], undefined, 'ET');
        expect(ethSku).toBe('ETFR001');

        const nextEthSku = generateSKU(
            'Fruit & Vegetables',
            [{ sku: 'ETFR001' }, { sku: 'ETFR002' }],
            undefined,
            'ET'
        );
        expect(nextEthSku).toBe('ETFR003');

        // Handles legacy hyphenated catalog items seamlessly
        const fromLegacySku = generateSKU(
            'Fruit & Vegetables',
            [{ sku: 'ET-FR001' }, { sku: 'ET-FR002' }],
            undefined,
            'ET'
        );
        expect(fromLegacySku).toBe('ETFR003');
    });

    it('generates Kenya country-prefixed SKU without hyphens (KECATSEQ)', () => {
        const kenyaSku = generateSKU('Drinks & Beverages', [], undefined, 'KE');
        expect(kenyaSku).toBe('KEBV001');

        const nextKenyaSku = generateSKU(
            'Drinks & Beverages',
            [{ sku: 'KEBV001' }, { sku: 'KEBV002' }],
            undefined,
            'KE'
        );
        expect(nextKenyaSku).toBe('KEBV003');
    });

    it('generates Uganda country-prefixed SKU without hyphens (UGCATSEQ)', () => {
        const ugandaSku = generateSKU('Dairy, Eggs & Fridge', [], undefined, 'UG');
        expect(ugandaSku).toBe('UGDY001');
    });

    it('guarantees zero collision across countries: sequences increment independently per market', () => {
        const mixedCatalog = [
            { sku: 'ETFR001' },
            { sku: 'ET-FR002' },
            { sku: 'ETFR003' },
            { sku: 'KEFR001' }
        ];

        // Next Kenya Fruit & Veg SKU should be KEFR002 (not affected by ET's 3 items)
        const nextKenya = generateSKU('Fruit & Vegetables', mixedCatalog, undefined, 'KE');
        expect(nextKenya).toBe('KEFR002');

        // Next Ethiopia Fruit & Veg SKU should be ETFR004
        const nextEthiopia = generateSKU('Fruit & Vegetables', mixedCatalog, undefined, 'ET');
        expect(nextEthiopia).toBe('ETFR004');
    });

    it('validates both legacy, hyphenated, and unhyphenated SKU formats via isValidSKU', () => {
        // Legacy formats
        expect(isValidSKU('FR001')).toBe(true);
        expect(isValidSKU('FR-001')).toBe(true);
        expect(isValidSKU('BV045')).toBe(true);

        // Unhyphenated multi-country formats (new standard)
        expect(isValidSKU('KEFR001')).toBe(true);
        expect(isValidSKU('ETFR001')).toBe(true);
        expect(isValidSKU('UGDY002')).toBe(true);
        expect(isValidSKU('RWMT003')).toBe(true);
        expect(isValidSKU('TZSN010')).toBe(true);

        // Hyphenated multi-country formats (backward compatibility)
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

    it('extracts category correctly from legacy, hyphenated, and unhyphenated SKUs', () => {
        expect(extractCategoryFromSKU('FR001')).toBe('Fruit & Vegetables');
        expect(extractCategoryFromSKU('KEFR001')).toBe('Fruit & Vegetables');
        expect(extractCategoryFromSKU('KE-FR001')).toBe('Fruit & Vegetables');
        expect(extractCategoryFromSKU('ETDY005')).toBe('Dairy, Eggs & Fridge');
        expect(extractCategoryFromSKU('ET-DY005')).toBe('Dairy, Eggs & Fridge');
        expect(extractCategoryFromSKU('UGBV010')).toBe('Drinks & Beverages');
        expect(extractCategoryFromSKU('UG-BV010')).toBe('Drinks & Beverages');
        expect(extractCategoryFromSKU('UNKNOWN')).toBe(null);
    });
});
