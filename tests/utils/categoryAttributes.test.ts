import { describe, it, expect } from 'vitest';
import {
    getCategorySpecGroup,
    getPOItemCategorySpecsSummary,
    CATEGORY_SPEC_GROUPS,
    PRODUCT_CATEGORIES,
    isConsumableCategory,
    isDiscreteGeneralMerch
} from '../../components/procurement/categoryAttributes';

describe('Category-Driven Product Attributes System', () => {
    describe('Category Domain Resolution (getCategorySpecGroup)', () => {
        it('resolves Electronics specs for Kindle, Samsung phones, and Batteries', () => {
            const groupKindle = getCategorySpecGroup('General Merchandise & Apparel', 'Electronics & Batteries');
            expect(groupKindle.id).toBe('electronics');
            expect(groupKindle.badgeLabel).toBe('GS1 Tech Attributes');

            const keys = groupKindle.fields.map(f => f.key);
            expect(keys).toContain('modelNumber');
            expect(keys).toContain('screenSize');
            expect(keys).toContain('storageRam');
            expect(keys).toContain('batteryType');
            expect(keys).toContain('connectivity');
            expect(keys).toContain('voltage');
            expect(keys).toContain('warrantyPeriod');
        });

        it('resolves Apparel specs for Clothing & Accessories', () => {
            const group = getCategorySpecGroup('General Merchandise & Apparel', 'Clothing & Accessories');
            expect(group.id).toBe('apparel');
            expect(group.badgeLabel).toBe('Soft Goods Master');

            const keys = group.fields.map(f => f.key);
            expect(keys).toContain('apparelSize');
            expect(keys).toContain('genderFit');
            expect(keys).toContain('fabricMaterial');
            expect(keys).toContain('careInstructions');
        });

        it('resolves Fresh Produce specs for Fruit & Vegetables', () => {
            const group = getCategorySpecGroup('Fresh Food & Deli', 'Fruit & Vegetables');
            expect(group.id).toBe('fresh_produce');
            expect(group.badgeLabel).toBe('Agri Cold Chain');

            const keys = group.fields.map(f => f.key);
            expect(keys).toContain('origin');
            expect(keys).toContain('grade');
            expect(keys).toContain('ripenessVariety');
            expect(keys).toContain('perishableStorage');
        });

        it('resolves Meat & Poultry specs with mandatory Halal certification field', () => {
            const group = getCategorySpecGroup('Fresh Food & Deli', 'Meat & Poultry');
            expect(group.id).toBe('meat_poultry');
            expect(group.badgeLabel).toBe('Halal Meat Master');

            const halalField = group.fields.find(f => f.key === 'halalCertified');
            expect(halalField).toBeDefined();
            expect(halalField?.options).toContain('100% Certified Halal (Mandatory)');
        });

        it('resolves Non-Alcoholic Beverage specs for Drinks & Beverages', () => {
            const group = getCategorySpecGroup('Pantry & Groceries', 'Drinks & Beverages');
            expect(group.id).toBe('beverages');
            expect(group.badgeLabel).toBe('Non-Alcoholic Halal');

            const keys = group.fields.map(f => f.key);
            expect(keys).toContain('beverageType');
            expect(keys).toContain('containerType');
            expect(keys).toContain('sugarContent');
            expect(keys).toContain('zeroAlcoholGuarantee');
        });

        it('resolves Household & Cleaning specs with chemical safety and formulation', () => {
            const group = getCategorySpecGroup('Household & Cleaning', 'Laundry & Dishwashing');
            expect(group.id).toBe('household_cleaning');
            expect(group.badgeLabel).toBe('Home & Chemical Care');

            const keys = group.fields.map(f => f.key);
            expect(keys).toContain('cleaningForm');
            expect(keys).toContain('surfaceApplication');
            expect(keys).toContain('scentFragrance');
            expect(keys).toContain('hazardSafety');
        });

        it('resolves Baby & Toddler specs with pediatric stage formulation', () => {
            const group = getCategorySpecGroup('Baby & Toddler', 'Baby Food & Formula');
            expect(group.id).toBe('baby_toddler');
            expect(group.badgeLabel).toBe('Pediatric Grade');

            const keys = group.fields.map(f => f.key);
            expect(keys).toContain('babyStage');
            expect(keys).toContain('specialDietFormula');
            expect(keys).toContain('hypoallergenicCert');
        });

        it('resolves Automotive specs for automotive parts and fitment', () => {
            const group = getCategorySpecGroup('Automotive Spare Parts', 'Engine Filters');
            expect(group.id).toBe('automotive_industrial');
            expect(group.badgeLabel).toBe('Technical / OEM Parts');

            const keys = group.fields.map(f => f.key);
            expect(keys).toContain('vehicleFitment');
            expect(keys).toContain('oemPartNumber');
            expect(keys).toContain('partPosition');
        });

        it('falls back to General Merchandise specs for unspecified categories', () => {
            const group = getCategorySpecGroup('Other Items');
            expect(group.id).toBe('general_merchandise');
            expect(group.badgeLabel).toBe('General Master');
        });
    });

    describe('SIIFMART Non-Alcoholic Catalog & Halal Compliance', () => {
        it('guarantees ZERO alcoholic beverages (beer, wine, liquor) across all category definitions and options', () => {
            const allCategoriesStr = JSON.stringify(PRODUCT_CATEGORIES).toLowerCase();
            expect(allCategoriesStr).not.toContain('beer');
            expect(allCategoriesStr).not.toContain('wine');
            expect(allCategoriesStr).not.toContain('liquor');
            expect(allCategoriesStr).not.toContain('spirit');
            expect(allCategoriesStr).not.toContain('alcohol');

            const allGroupsStr = JSON.stringify(CATEGORY_SPEC_GROUPS).toLowerCase();
            expect(allGroupsStr).not.toContain('beer');
            expect(allGroupsStr).not.toContain('wine');
            expect(allGroupsStr).not.toContain('liquor');
            expect(allGroupsStr).not.toContain('vodka');
            expect(allGroupsStr).not.toContain('whiskey');
        });
    });

    describe('getPOItemCategorySpecsSummary', () => {
        it('formats Amazon Kindle 217g electronic specs cleanly', () => {
            const item = {
                productName: 'Kindle Paperwhite',
                brand: 'Amazon',
                category: 'Electronics & Batteries',
                customAttributes: {
                    identity: { modelNumber: 'B08KTZ8249' },
                    categorySpecific: {
                        modelNumber: 'B08KTZ8249',
                        screenSize: '6.8" E-Ink',
                        storageRam: '16GB',
                        connectivity: 'Wi-Fi + Bluetooth',
                        batteryType: 'Built-in Li-Ion (Weeks battery)'
                    }
                }
            };

            const summary = getPOItemCategorySpecsSummary(item);
            expect(summary.domainTitle).toBe('Consumer Electronics & Hardware Specs');
            expect(summary.badgeLabel).toBe('GS1 Tech Attributes');
            expect(summary.specs.length).toBeGreaterThanOrEqual(4);
            expect(summary.summaryText).toContain('Model: B08KTZ8249');
            expect(summary.summaryText).toContain('Display: 6.8" E-Ink');
            expect(summary.summaryText).toContain('Storage & RAM Capacity: 16GB');
        });

        it('formats Men\'s Cotton T-Shirt apparel specs cleanly', () => {
            const item = {
                productName: 'Heavyweight Crewneck',
                brand: 'Gildan',
                category: 'Clothing & Accessories',
                customAttributes: {
                    categorySpecific: {
                        apparelSize: 'L',
                        genderFit: 'Men',
                        fabricMaterial: '100% Cotton',
                        apparelColor: 'Navy'
                    }
                }
            };

            const summary = getPOItemCategorySpecsSummary(item);
            expect(summary.domainTitle).toBe('Apparel, Footwear & Fashion Specs');
            expect(summary.summaryText).toContain('Apparel Size: L');
            expect(summary.summaryText).toContain('Demographic Cut: Men');
            expect(summary.summaryText).toContain('Fiber: 100% Cotton');
            expect(summary.summaryText).toContain('Colorway: Navy');
        });

        it('formats Fresh Beef Ribeye meat specs with Halal certification badge', () => {
            const item = {
                productName: 'Prime Beef Ribeye Steak',
                category: 'Meat & Poultry',
                customAttributes: {
                    categorySpecific: {
                        cutType: 'Bone-In Ribeye',
                        grade: 'Prime / Superior',
                        halalCertified: '100% Certified Halal (Mandatory)',
                        chilledState: 'Fresh Chilled (0°C to 2°C)'
                    }
                }
            };

            const summary = getPOItemCategorySpecsSummary(item);
            expect(summary.badgeLabel).toBe('Halal Meat Master');
            expect(summary.summaryText).toContain('Butchery Cut Type: Bone-In Ribeye');
            expect(summary.summaryText).toContain('Halal Certification: 100% Certified Halal (Mandatory)');
        });

        it('returns empty specs and null summaryText when item has no category-specific attributes', () => {
            const item = {
                productName: 'Generic Box',
                category: 'General Merchandise'
            };
            const summary = getPOItemCategorySpecsSummary(item);
            expect(summary.specs).toEqual([]);
            expect(summary.summaryText).toBeNull();
        });
    });
});
