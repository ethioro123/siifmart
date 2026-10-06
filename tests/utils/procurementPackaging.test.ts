import { describe, it, expect } from 'vitest';
import {
    convertToSellableUnits,
    getPOItemPackagingSummary,
    inferBulkPackaging,
    formatPackBadge,
    formatPOItemDescription
} from '../../components/procurement/utils';

describe('Procurement Packaging & Sellable Units', () => {
    describe('inferBulkPackaging', () => {
        it('infers 12 pk Bale for flour items where wholesale cost exceeds retail price', () => {
            const item = {
                productName: 'Juma Ugali Flour 1kg',
                quantity: 12,
                unitCost: 4200,
                retailPrice: 400
            };
            const result = inferBulkPackaging(item);
            expect(result.unitsPerOrderUnit).toBe(12);
            expect(result.packageType).toBe('Bale');
        });

        it('infers 24 cans Carton/Case for beverages with bulk unit cost', () => {
            const item = {
                productName: 'Neon Soda Drink 330ml',
                quantity: 5,
                unitCost: 1920,
                retailPrice: 100
            };
            const result = inferBulkPackaging(item);
            expect(result.unitsPerOrderUnit).toBe(24);
            expect(result.packageType).toBe('Carton');
        });

        it('detects pattern from name like 12x1kg', () => {
            const item = {
                productName: 'Premium Sugar 12x1kg Bale',
                quantity: 10,
                unitCost: 3600
            };
            const result = inferBulkPackaging(item);
            expect(result.unitsPerOrderUnit).toBe(12);
            expect(result.packageType).toBe('Bale');
        });

        it('returns 1 for ordinary consumer products with no bulk indicators', () => {
            const item = {
                productName: 'Hand Towel',
                quantity: 1,
                unitCost: 150,
                retailPrice: 200
            };
            const result = inferBulkPackaging(item);
            expect(result.unitsPerOrderUnit).toBe(1);
        });
    });

    describe('convertToSellableUnits', () => {
        it('converts 12 bales of Juma Ugali Flour (12 pk/bale) to 144 sellable units', () => {
            const item = {
                sku: 'KE-GR001',
                productName: 'Juma Ugali Flour 1kg',
                quantity: 12,
                unitCost: 4200,
                retailPrice: 400,
                customAttributes: {
                    packaging: {
                        packQty: '12',
                        caseSize: '',
                        packageType: 'Bale',
                        unitSize: '1kg'
                    }
                }
            };
            const sellableQty = convertToSellableUnits(12, item);
            expect(sellableQty).toBe(144);
        });

        it('converts PO AAAA0142 item even when customAttributes was missing from legacy DB', () => {
            // Unmigrated DB record from probe: null customAttributes, cost 4200, retail 400
            const item = {
                sku: 'KE-GR001',
                productName: 'Juma Ugali Flour 1kg',
                quantity: 12,
                unitCost: 4200,
                retailPrice: 400,
                unit: 'kg',
                size: '1kg'
            };
            const sellableQty = convertToSellableUnits(12, item);
            expect(sellableQty).toBe(144);
        });

        it('converts multi-tier case orders (5 cases of 4 packs of 6 = 120 units)', () => {
            const item = {
                productName: 'Canned Beans',
                quantity: 5,
                unitCost: 1800,
                customAttributes: {
                    packaging: {
                        caseSize: '4',
                        packQty: '6',
                        packageType: 'Case'
                    }
                }
            };
            const sellableQty = convertToSellableUnits(5, item);
            expect(sellableQty).toBe(120);
        });
    });

    describe('getPOItemPackagingSummary (PO AAAA0142 Scenario)', () => {
        it('produces full packaging summary for PO AAAA0142 Juma Ugali Flour', () => {
            const poItem = {
                sku: 'KE-GR001',
                productName: 'Juma Ugali Flour 1kg',
                quantity: 12,
                unitCost: 4200,
                retailPrice: 400,
                brand: 'Juma',
                size: '1kg',
                unit: 'kg',
                category: 'Pantry & Groceries'
            };

            const summary = getPOItemPackagingSummary(poItem);

            expect(summary.sellableQty).toBe(144);
            expect(summary.manifestQty).toBe(12);
            expect(summary.manifestUnitName).toBe('Bales');
            expect(summary.hasMultiplier).toBe(true);
            expect(summary.unitsPerOrderUnit).toBe(12);
            expect(summary.costPerSellableUnit).toBe(350);
            expect(summary.packBadge).toContain('Bale');
            expect(summary.packDetail).toContain('12 Bales');
        });

        it('handles formatPackBadge cleanly for bales, cartons, and cases', () => {
            expect(formatPackBadge({ packQuantity: 12, packageType: 'Bale' })).toBe('12 pk/Bale');
            expect(formatPackBadge({ caseSize: 4, packageType: 'Case' })).toBe('4 packs/case (Case)');
            expect(formatPackBadge({ packQuantity: 6, caseSize: 4, packageType: 'Carton' })).toBe('6 units × 4 packs (Carton)');
        });
    });

    describe('formatPOItemDescription', () => {
        it('does NOT append physical net weight to discrete general merchandise (e.g. Amazon Kindle 217g -> Amazon Kindle)', () => {
            const kindle = {
                brand: 'Amazon',
                productName: 'Kindle',
                category: 'Electronics & Batteries',
                size: '217',
                unit: 'g',
                customAttributes: {
                    physical: {
                        netWeight: '217',
                        sizeType: 'g'
                    }
                }
            };
            expect(formatPOItemDescription(kindle)).toBe('Amazon Kindle');
        });

        it('appends pack size for consumable groceries where size differentiates the SKU', () => {
            const flour = {
                brand: 'Juma',
                productName: 'Ugali Flour',
                category: 'Pantry & Groceries',
                size: '1',
                unit: 'kg',
                customAttributes: {
                    physical: {
                        netWeight: '1',
                        sizeType: 'kg'
                    }
                }
            };
            expect(formatPOItemDescription(flour)).toBe('Juma Ugali Flour 1kg');
        });
    });
});
