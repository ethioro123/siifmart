import { describe, it, expect } from 'vitest';
import {
    CATEGORY_SPEC_GROUPS,
    CategorySpecGroup
} from '../../components/procurement/categorySpecGroups';
import {
    getCategorySpecGroup,
    getCategoryAttributes,
    PRODUCT_CATEGORIES,
    isDiscreteGeneralMerch,
    getPOItemCategorySpecsSummary
} from '../../components/procurement/categoryAttributes';
import { getPOItemPhysicalSummary } from '../../components/procurement/physicalUtils';
import { buildPurchaseOrders } from '../../components/procurement/createPOHelpers';
import type { POItem, Product, Site } from '../../types';

describe('PO Category-Specific Attributes System', () => {
    describe('Category Spec Group Mapping Across All Catalog Domains', () => {
        it('maps Electronics and hardware to simple, focused electronics attributes', () => {
            expect(getCategorySpecGroup('Electronics').id).toBe('electronics');
            expect(getCategorySpecGroup('Consumer Electronics').id).toBe('electronics');
            expect(getCategorySpecGroup('Consumer Electronics & Tech').id).toBe('electronics');
            expect(getCategorySpecGroup('Tech').id).toBe('electronics');
            expect(getCategorySpecGroup('Smartphones').id).toBe('electronics');
            expect(getCategorySpecGroup('Computers & Laptops').id).toBe('electronics');
            expect(getCategorySpecGroup('Audio, Headphones & Speakers').id).toBe('electronics');
            expect(getCategorySpecGroup('Batteries, Chargers & Power Banks').id).toBe('electronics');
        });

        it('maps every food, grocery, personal care, and general category to its dedicated spec group', () => {
            // Fresh & Chilled
            expect(getCategorySpecGroup('Fruit & Vegetables').id).toBe('fresh_produce');
            expect(getCategorySpecGroup('Fresh Produce').id).toBe('fresh_produce');
            expect(getCategorySpecGroup('Dairy, Eggs & Fridge').id).toBe('dairy_eggs');
            expect(getCategorySpecGroup('Meat & Poultry').id).toBe('meat_poultry');
            expect(getCategorySpecGroup('Seafood').id).toBe('meat_poultry');
            expect(getCategorySpecGroup('Bakery & Bread').id).toBe('bakery_deli');
            expect(getCategorySpecGroup('Deli & Prepared Meals').id).toBe('bakery_deli');

            // Pantry & Dry Goods
            expect(getCategorySpecGroup('Grains, Pasta & Rice').id).toBe('pantry_groceries');
            expect(getCategorySpecGroup('Sauces, Oils & Condiments').id).toBe('pantry_groceries');
            expect(getCategorySpecGroup('Baking & Dessert Needs').id).toBe('pantry_groceries');
            expect(getCategorySpecGroup('Canned Food & Soups').id).toBe('pantry_groceries');
            expect(getCategorySpecGroup('Spices & Seasonings').id).toBe('pantry_groceries');
            expect(getCategorySpecGroup('Snacks & Confectionery').id).toBe('confectionery_snacks');
            expect(getCategorySpecGroup('Drinks & Beverages').id).toBe('beverages');

            // Frozen
            expect(getCategorySpecGroup('Frozen Food').id).toBe('frozen_food');
            expect(getCategorySpecGroup('Ice Cream & Desserts').id).toBe('frozen_food');

            // Non-Food, Household, Baby & Personal
            expect(getCategorySpecGroup('Baby Food & Formula').id).toBe('baby_toddler');
            expect(getCategorySpecGroup('Nappies, Wipes & Toiletries').id).toBe('baby_toddler');
            expect(getCategorySpecGroup('Cosmetics & Skin Care').id).toBe('health_beauty');
            expect(getCategorySpecGroup('Dental & Oral Care').id).toBe('health_beauty');
            expect(getCategorySpecGroup('Cleaning Products & Tools').id).toBe('household_cleaning');
            expect(getCategorySpecGroup('Tissues, Paper & Foils').id).toBe('household_cleaning');
            expect(getCategorySpecGroup('Dog Food & Accessories').id).toBe('general_merchandise');

            // General Merchandise, Apparel & Homewares
            expect(getCategorySpecGroup('Clothing & Accessories').id).toBe('apparel');
            expect(getCategorySpecGroup('Stationery, Office & Books').id).toBe('stationery_toys');
            expect(getCategorySpecGroup('Toys & Recreation').id).toBe('stationery_toys');
            expect(getCategorySpecGroup('Homewares, Kitchen & Dining').id).toBe('homewares_kitchen');
            expect(getCategorySpecGroup('Automotive').id).toBe('automotive_industrial');
        });

        it('falls back to "general_merchandise" for unclassified or blank categories', () => {
            expect(getCategorySpecGroup('').id).toBe('general_merchandise');
            expect(getCategorySpecGroup('Miscellaneous Unmapped Goods').id).toBe('general_merchandise');
        });
    });

    describe('Tailored Attributes for Every Category', () => {
        it('keeps electronics simple with only necessary fields (Model, Serial/IMEI, Specs, Plug, Warranty)', () => {
            const fields = getCategoryAttributes('Electronics');
            const fieldKeys = fields.map(f => f.key);
            expect(fieldKeys).toEqual([
                'deviceType',
                'modelNumber',
                'serialNumberTracking',
                'specsSummary',
                'plugType',
                'warrantyPeriod'
            ]);
            expect(fields.length).toBe(6);
        });

        it('provides relevant attributes for Fresh Produce (variety, grade, farm origin, cold chain)', () => {
            const fields = getCategoryAttributes('Fruit & Vegetables');
            const keys = fields.map(f => f.key);
            expect(keys).toContain('produceVariety');
            expect(keys).toContain('grade');
            expect(keys).toContain('origin');
            expect(keys).toContain('storageTemp');
            expect(keys).toContain('shelfLifeDays');
        });

        it('provides relevant attributes for Meat & Seafood (protein, cut, Halal, thermal state)', () => {
            const fields = getCategoryAttributes('Meat & Poultry');
            const keys = fields.map(f => f.key);
            expect(keys).toContain('proteinType');
            expect(keys).toContain('cutType');
            expect(keys).toContain('halalCertified');
            expect(keys).toContain('thermalState');
        });

        it('provides relevant attributes for Pantry & Groceries (commodity type, grade, Halal, origin)', () => {
            const fields = getCategoryAttributes('Grains, Pasta & Rice');
            const keys = fields.map(f => f.key);
            expect(keys).toContain('commodityType');
            expect(keys).toContain('processingGrade');
            expect(keys).toContain('dietaryCert');
            expect(keys).toContain('origin');
        });

        it('provides relevant attributes for Homewares & Kitchen (item class, material, durability, safety)', () => {
            const fields = getCategoryAttributes('Homewares, Kitchen & Dining');
            const keys = fields.map(f => f.key);
            expect(keys).toContain('itemClass');
            expect(keys).toContain('materialType');
            expect(keys).toContain('durabilityCare');
            expect(keys).toContain('capacitySize');
            expect(keys).toContain('foodSafetyCert');
        });

        it('provides relevant attributes for Apparel (sizing, demographic cut, fabric, colorway)', () => {
            const fields = getCategoryAttributes('Clothing & Accessories');
            const keys = fields.map(f => f.key);
            expect(keys).toContain('apparelSize');
            expect(keys).toContain('genderFit');
            expect(keys).toContain('fabricMaterial');
            expect(keys).toContain('apparelColor');
        });

        it('provides relevant attributes for Household & Cleaning (category, format, scent, hazard)', () => {
            const fields = getCategoryAttributes('Cleaning Products & Tools');
            const keys = fields.map(f => f.key);
            expect(keys).toContain('cleaningCategory');
            expect(keys).toContain('cleaningForm');
            expect(keys).toContain('scentFragrance');
            expect(keys).toContain('hazardSafety');
        });

        it('provides relevant attributes for Baby & Toddler (stage/category, diaper size/count, hypoallergenic)', () => {
            const fields = getCategoryAttributes('Baby Food & Formula');
            const keys = fields.map(f => f.key);
            expect(keys).toContain('babyCategory');
            expect(keys).toContain('stageOrSize');
            expect(keys).toContain('hypoallergenicCert');
        });
    });

    describe('Taxonomy & Categorization Rules', () => {
        it('includes all primary catalog domains in PRODUCT_CATEGORIES', () => {
            const keys = Object.keys(PRODUCT_CATEGORIES);
            expect(keys).toContain('Consumer Electronics & Tech');
            expect(keys).toContain('Fresh Food & Deli');
            expect(keys).toContain('Pantry & Groceries');
            expect(keys).toContain('Frozen Food');
            expect(keys).toContain('Baby & Toddler');
            expect(keys).toContain('Health & Beauty');
            expect(keys).toContain('Household & Cleaning');
            expect(keys).not.toContain('Pet Supplies');
            expect(keys).toContain('General Merchandise & Apparel');
        });

        it('identifies discrete general merchandise vs food consumables', () => {
            expect(isDiscreteGeneralMerch('Electronics')).toBe(true);
            expect(isDiscreteGeneralMerch('Homewares, Kitchen & Dining')).toBe(true);
            expect(isDiscreteGeneralMerch('Clothing & Accessories')).toBe(true);
            expect(isDiscreteGeneralMerch('Dairy, Eggs & Fridge')).toBe(false);
            expect(isDiscreteGeneralMerch('Fruit & Vegetables')).toBe(false);
        });
    });

    describe('Category Specs Summary Generation', () => {
        it('generates concise summary text for electronics line items', () => {
            const poItem = {
                category: 'Electronics',
                customAttributes: {
                    identity: { modelNumber: 'SM-A146P' },
                    categorySpecific: {
                        modelNumber: 'SM-A146P',
                        serialNumberTracking: 'Mandatory Serial / IMEI Scan',
                        specsSummary: '64GB ROM / 4GB RAM',
                        warrantyPeriod: '12 Months Official Manufacturer'
                    }
                }
            };

            const summary = getPOItemCategorySpecsSummary(poItem);
            expect(summary.domainTitle).toBe('Electronics & Hardware Specs');
            expect(summary.summaryText).toContain('Model: SM-A146P');
            expect(summary.summaryText).toContain('Key Specifications: 64GB ROM / 4GB RAM');
            expect(summary.summaryText).toContain('Warranty Coverage: 12 Months Official Manufacturer');
        });

        it('generates concise summary text for food/pantry line items', () => {
            const poItem = {
                category: 'Grains, Pasta & Rice',
                customAttributes: {
                    categorySpecific: {
                        commodityType: 'Rice, Grains & Pulses',
                        processingGrade: 'Extra Long Basmati',
                        dietaryCert: '100% Certified Halal',
                        origin: 'Punjab'
                    }
                }
            };

            const summary = getPOItemCategorySpecsSummary(poItem);
            expect(summary.domainTitle).toBe('Pantry, Grains & Cooking Essentials');
            expect(summary.summaryText).toContain('Commodity: Rice, Grains & Pulses');
            expect(summary.summaryText).toContain('Variety: Extra Long Basmati');
            expect(summary.summaryText).toContain('Dietary & Halal Status: 100% Certified Halal');
        });

        it('returns null summary text when no category-specific attributes are populated', () => {
            const poItem = {
                category: 'Electronics',
                customAttributes: { categorySpecific: {} }
            };
            const summary = getPOItemCategorySpecsSummary(poItem);
            expect(summary.summaryText).toBeNull();
        });
    });

    describe('End-to-End PO Item Building with Category Attributes', () => {
        const mockSite: Site = {
            id: 'site-nbi-dc',
            code: 'NBI-DC',
            name: 'Nairobi Central DC',
            type: 'Distribution Center',
            address: 'Industrial Area, Nairobi',
            status: 'Active',
            country: 'KE',
            region_code: 'ke_nairobi'
        };

        it('preserves category attributes in PO line items across different categories', () => {
            const homewareItem: POItem = {
                productId: 'CUSTOM-KITCHEN-01',
                productName: 'Stainless Steel Stock Pot 10L',
                sku: 'KE-HOME-0001',
                brand: 'Prestige',
                category: 'Homewares, Kitchen & Dining',
                quantity: 20,
                unitCost: 3500,
                retailPrice: 4800,
                totalCost: 70000,
                unit: 'piece',
                identityType: 'new',
                description: 'Class: Cookware | Material: Stainless Steel | 10L',
                customAttributes: {
                    identity: {
                        variant: '10 Litre',
                        subcategory: 'Cookware, Pots & Pans'
                    },
                    categorySpecific: {
                        itemClass: 'Cookware, Pots & Pans',
                        materialType: 'Food-Grade Stainless Steel',
                        durabilityCare: 'Dishwasher Safe Only',
                        capacitySize: '10 Litre',
                        foodSafetyCert: 'FDA / LFGB Food Contact Safe (BPA Free)',
                        warrantyPeriod: '12 Months Manufacturer Warranty'
                    }
                }
            };

            const builtOrders = buildPurchaseOrders({
                destinationSiteIds: ['site-nbi-dc'],
                processedItems: [homewareItem],
                quantityDistribution: 'single',
                shippingCost: 1500,
                discountRate: 0,
                taxRate: 0,
                sites: [mockSite],
                currencySymbol: 'KSh',
                vendorId: 'sup-home-goods',
                vendorName: 'Kenya Kitchen Supplies Ltd',
                expectedDate: '2026-10-30',
                poNotes: 'Stock pots replenishment',
                paymentTerms: 'Net 30',
                poPriority: 'Normal'
            });

            expect(builtOrders).toHaveLength(1);
            const { po, items } = builtOrders[0];
            expect(po.country_code).toBe('KE');
            expect(items).toHaveLength(1);

            const savedItem = items[0];
            expect(savedItem.category).toBe('Homewares, Kitchen & Dining');
            expect(savedItem.customAttributes?.categorySpecific?.itemClass).toBe('Cookware, Pots & Pans');
            expect(savedItem.customAttributes?.categorySpecific?.materialType).toBe('Food-Grade Stainless Steel');
            expect(savedItem.customAttributes?.categorySpecific?.capacitySize).toBe('10 Litre');
            expect(savedItem.customAttributes?.categorySpecific?.warrantyPeriod).toBe('12 Months Manufacturer Warranty');
        });
    });

    describe('Dynamic Category-Aware Physical Attribute Summaries', () => {
        it('formats dynamic physical summary for Apparel (Size, Colorway, Material)', () => {
            const apparelItem = {
                category: 'Clothing & Accessories',
                customAttributes: {
                    identity: { variant: 'L' },
                    physical: {
                        color: 'Jet Black',
                        netWeight: '250',
                        sizeType: 'g'
                    },
                    categorySpecific: {
                        apparelSize: 'L',
                        fabricMaterial: '100% Combed Cotton'
                    }
                }
            };

            const summary = getPOItemPhysicalSummary(apparelItem);
            expect(summary.domainId).toBe('apparel');
            expect(summary.sizeOrVolume).toBe('L');
            expect(summary.colorOrFinish).toBe('Jet Black');
            expect(summary.materialOrContainer).toBe('100% Combed Cotton');
            expect(summary.specBadge).toBe('Size: L • Jet Black • 100% Combed Cotton • 250 g');
        });

        it('formats dynamic physical summary for Beverages (Volume, Container, Gross Weight)', () => {
            const beverageItem = {
                category: 'Drinks & Beverages',
                customAttributes: {
                    physical: {
                        netWeight: '500',
                        sizeType: 'ml',
                        grossWeight: '0.55'
                    },
                    categorySpecific: {
                        containerType: 'PET Plastic Bottle'
                    }
                }
            };

            const summary = getPOItemPhysicalSummary(beverageItem);
            expect(summary.domainId).toBe('beverages');
            expect(summary.sizeOrVolume).toBe('500 ml');
            expect(summary.materialOrContainer).toBe('PET Plastic Bottle');
            expect(summary.specBadge).toBe('Vol: 500 ml • PET Plastic Bottle • Gross: 0.55 kg');
        });

        it('formats dynamic physical summary for Electronics (Dimensions, Net Weight, Finish)', () => {
            const electronicsItem = {
                category: 'Electronics',
                customAttributes: {
                    physical: {
                        dims: '14.6 × 7.0 × 0.8',
                        netWeight: '172',
                        sizeType: 'g',
                        color: 'Space Gray'
                    }
                }
            };

            const summary = getPOItemPhysicalSummary(electronicsItem);
            expect(summary.domainId).toBe('electronics');
            expect(summary.colorOrFinish).toBe('Space Gray');
            expect(summary.dimensionsFormatted).toBe('14.6 × 7.0 × 0.8 cm');
            expect(summary.specBadge).toBe('Dims: 14.6 × 7.0 × 0.8 cm • 172 g • Space Gray');
        });

        it('formats dynamic physical summary for Homewares & Kitchen (Capacity, Material, Dimensions)', () => {
            const homewaresItem = {
                category: 'Homewares, Kitchen & Dining',
                customAttributes: {
                    physical: {
                        dims: '28 × 28 × 18',
                        netWeight: '2.4',
                        sizeType: 'kg'
                    },
                    categorySpecific: {
                        capacity: '10 Litre',
                        material: 'Food-Grade Stainless Steel'
                    }
                }
            };

            const summary = getPOItemPhysicalSummary(homewaresItem);
            expect(summary.domainId).toBe('homewares_kitchen');
            expect(summary.sizeOrVolume).toBe('10 Litre');
            expect(summary.materialOrContainer).toBe('Food-Grade Stainless Steel');
            expect(summary.specBadge).toBe('Cap: 10 Litre • Food-Grade Stainless Steel • Dims: 28 × 28 × 18 cm • 2.4 kg');
        });

        it('formats default physical summary for Consumables & Groceries (Net, Gross, Form)', () => {
            const groceryItem = {
                category: 'Pantry Groceries',
                customAttributes: {
                    physical: {
                        netWeight: '1',
                        sizeType: 'kg',
                        grossWeight: '1.08',
                        form: 'Powder'
                    }
                }
            };

            const summary = getPOItemPhysicalSummary(groceryItem);
            expect(summary.netWeightFormatted).toBe('1 kg');
            expect(summary.grossWeightFormatted).toBe('1.08 kg');
            expect(summary.specBadge).toBe('Net: 1 kg • Gross: 1.08 kg • Powder');
        });
    });
});
