import { describe, it, expect } from 'vitest';
import {
    formatProductSize,
    formatPackagingDescription,
    formatStockDisplay,
    getSellUnit,
    getEffectivePackageSize
} from '../../utils/units';

describe('formatProductSize - Unit Prevention and Clean Display', () => {
    it('prevents double-unit suffixes like 1kgkg or 500gg', () => {
        // String size already contains unit suffix
        expect(formatProductSize({ size: '1kg', unit: 'KG' })).toBe('1kg');
        expect(formatProductSize({ size: '500g', unit: 'G' })).toBe('500g');
        expect(formatProductSize({ size: '250ml', unit: 'ML' })).toBe('250ml');
        expect(formatProductSize({ size: '2L', unit: 'L' })).toBe('2L');
        expect(formatProductSize({ size: '1 kg', unit: 'KG' })).toBe('1 kg');
    });

    it('attaches unit suffix when size is numeric only', () => {
        expect(formatProductSize({ size: '500', unit: 'G' })).toBe('500g');
        expect(formatProductSize({ size: 1, unit: 'KG' })).toBe('1kg');
        expect(formatProductSize({ size: 750, unit: 'ML' })).toBe('750ml');
    });

    it('respects physical customAttributes over sell unit', () => {
        expect(formatProductSize({
            size: '500',
            unit: 'KG',
            customAttributes: { physical: { sizeType: 'g' } }
        })).toBe('500g');

        expect(formatProductSize({
            size: '500g',
            unit: 'KG',
            customAttributes: { physical: { sizeType: 'g' } }
        })).toBe('500g');
    });

    it('handles count-based units gracefully without attaching PCS to numbers', () => {
        expect(formatProductSize({ size: '24', unit: 'PCS' })).toBe('24');
        expect(formatProductSize({ size: '10', unit: 'UNIT' })).toBe('10');
    });

    it('returns empty string for null, undefined, or empty sizes', () => {
        expect(formatProductSize(null)).toBe('');
        expect(formatProductSize(undefined)).toBe('');
        expect(formatProductSize({ size: '' })).toBe('');
    });
});

describe('formatPackagingDescription - Packaging Hierarchy and Case Breakdown', () => {
    it('formats exact multiple of case/bale packs', () => {
        const product = {
            packQuantity: 12,
            packageType: 'Bale'
        };
        // 144 sellable units / 12 per bale = 12 Bales
        expect(formatPackagingDescription(product, 144)).toBe('12 Bales');
        // 12 sellable units / 12 per bale = 1 Bale
        expect(formatPackagingDescription(product, 12)).toBe('1 Bale');
        // 24 sellable units = 2 Bales
        expect(formatPackagingDescription(product, 24)).toBe('2 Bales');
    });

    it('formats partial case/bale packs with remainder sellable units', () => {
        const product = {
            packQuantity: 12,
            packageType: 'Bale'
        };
        // 15 units = 1 Bale + 3 pk
        expect(formatPackagingDescription(product, 15)).toBe('1 Bale + 3 pk');
        // 25 units = 2 Bales + 1 pk
        expect(formatPackagingDescription(product, 25)).toBe('2 Bales + 1 pk');
        // Less than 1 pack
        expect(formatPackagingDescription(product, 6)).toBe('6 pk (12/Bale)');
    });

    it('formats static packaging specification when currentQty is omitted', () => {
        expect(formatPackagingDescription({ packQuantity: 12, packageType: 'Bale' })).toBe('12/Bale');
        expect(formatPackagingDescription({ packQuantity: 24, packageType: 'Case' })).toBe('24/Case');
        expect(formatPackagingDescription({ packQuantity: 6, packageType: 'Box' })).toBe('6/Box');
    });

    it('reads packaging from customAttributes when top-level fields are absent', () => {
        const product = {
            customAttributes: {
                packaging: { packQty: '24', packageType: 'Carton' }
            }
        };
        expect(formatPackagingDescription(product)).toBe('24/Carton');
        expect(formatPackagingDescription(product, 48)).toBe('2 Cartons');
    });

    it('returns empty string if no packaging or packQuantity <= 1', () => {
        expect(formatPackagingDescription({ packQuantity: 1 })).toBe('');
        expect(formatPackagingDescription({})).toBe('');
        expect(formatPackagingDescription(null)).toBe('');
    });
});

describe('formatStockDisplay - Sellable Units vs Loose Bulk', () => {
    it('formats discrete prepackaged 1kg products as sellable units (NOT loose bulk)', () => {
        const product = {
            name: 'Juma Ugali Flour 1kg',
            size: '1kg',
            unit: 'KG',
            packQuantity: 12,
            packageType: 'Bale'
        };
        // Sellable units with physical size
        expect(formatStockDisplay(12, product)).toBe('12 pk (1kg)');
        expect(formatStockDisplay(144, product)).toBe('144 pk (1kg)');

        // With packaging breakdown
        expect(formatStockDisplay(12, product, { showPackaging: true })).toBe('12 pk (1kg) • 1 Bale');
        expect(formatStockDisplay(144, product, { showPackaging: true })).toBe('144 pk (1kg) • 12 Bales');
        expect(formatStockDisplay(15, product, { showPackaging: true })).toBe('15 pk (1kg) • 1 Bale + 3 pk');
    });

    it('formats prepackaged items of other sizes (500g, 2kg, 750ml)', () => {
        const tea = {
            name: 'Buna Tea 400g',
            size: '400g',
            unit: 'G',
            packQuantity: 1
        };
        expect(formatStockDisplay(20, tea)).toBe('20 ea (400g)');

        const oil = {
            name: 'Vera Cooking Oil 1L',
            size: '1L',
            unit: 'L',
            packQuantity: 1
        };
        expect(formatStockDisplay(210, oil)).toBe('210 ea (1L)');
    });

    it('formats genuine loose bulk items directly in unit of measure', () => {
        const onions = {
            name: 'Sha Red Onions KG',
            unit: 'KG',
            customAttributes: {
                commercial: { sellBy: 'Weight' }
            }
        };
        expect(formatStockDisplay(105, onions)).toBe('105 kg');

        const looseRice = {
            name: 'Bulk Basmati Rice',
            unit: 'KG',
            customAttributes: {
                commercial: { isWeighted: true }
            }
        };
        expect(formatStockDisplay(42.5, looseRice)).toBe('42.5 kg');
    });

    it('supports compact option for tight spaces', () => {
        const product = {
            size: '1kg',
            unit: 'KG',
            packQuantity: 12
        };
        expect(formatStockDisplay(12, product, { compact: true })).toBe('12 pk');
    });
});
