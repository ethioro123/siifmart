import { describe, it, expect } from 'vitest';
import {
    extractProductAttributesFromPOItem,
    mergeCustomAttributes
} from '../../utils/productAttributes';

describe('PO Creation → Receiving → Putaway → Inventory Attributes Pipeline', () => {
    it('extracts all 6 layers of custom attributes and packaging fields from a PO line item', () => {
        const poLineItem = {
            productId: 'prod-123',
            productName: 'Premium Ethiopian Yirgacheffe Coffee 500g',
            sku: 'ET-GROC-001',
            quantity: 10,
            unitCost: 450,
            retailPrice: 650,
            brand: 'Yirgacheffe Select',
            size: '500g',
            unit: 'Bag',
            category: 'Beverages',
            image: 'https://cdn.example.com/coffee.png',
            packQuantity: 12,
            packageType: 'Carton',
            caseSize: 24,
            description: 'Variant: Dark Roast | Arabica 100% | High Altitude',
            minStock: 20,
            maxStock: 200,
            customAttributes: {
                identity: { variant: 'Dark Roast', modelNumber: 'YRG-2026', subcategory: 'Whole Bean' },
                physical: { netWeight: '500g', grossWeight: '520g', form: 'Whole Bean', color: 'Dark Brown' },
                packaging: { packQty: '12', caseSize: '24', packageType: 'Carton', packagingLevel: 'two_tier' },
                storage: { type: 'Ambient', isPerishable: true, isLightSensitive: true, stackLimit: '5' },
                commercial: { isWeighted: false, sellBy: 'Unit', priceType: 'Fixed', isReturnable: true },
                descriptive: { usage: 'Espresso / Pour Over', scent: 'Floral & Citrus', flavor: 'Bergamot' },
                categorySpecific: { roastLevel: 'Dark', altitude: '2200m', beanType: '100% Arabica' }
            }
        };

        const extracted = extractProductAttributesFromPOItem(poLineItem);

        expect(extracted.brand).toBe('Yirgacheffe Select');
        expect(extracted.size).toBe('500g');
        expect(extracted.unit).toBe('Bag');
        expect(extracted.category).toBe('Beverages');
        expect(extracted.image).toBe('https://cdn.example.com/coffee.png');
        expect(extracted.packQuantity).toBe(12);
        expect(extracted.packageType).toBe('Carton');
        expect(extracted.caseSize).toBe(24);
        expect(extracted.minStock).toBe(20);
        expect(extracted.maxStock).toBe(200);

        expect(extracted.customAttributes?.identity?.variant).toBe('Dark Roast');
        expect(extracted.customAttributes?.storage?.isPerishable).toBe(true);
        expect(extracted.customAttributes?.categorySpecific?.roastLevel).toBe('Dark');
    });

    it('deep merges custom attributes into partial existing inventory records without dropping data', () => {
        const existingInventoryAttrs = {
            identity: { subcategory: 'Coffee' },
            storage: { type: 'Ambient' },
            packaging: { unitSize: '500g' }
        };

        const incomingPOAttrs = {
            identity: { variant: 'Medium Roast', modelNumber: 'MR-01' },
            storage: { isPerishable: true, isLightSensitive: true },
            categorySpecific: { roastLevel: 'Medium' }
        };

        const merged = mergeCustomAttributes(existingInventoryAttrs, incomingPOAttrs);

        // Retains existing subcategory and storage type
        expect(merged?.identity?.subcategory).toBe('Coffee');
        expect(merged?.storage?.type).toBe('Ambient');
        expect(merged?.packaging?.unitSize).toBe('500g');

        // Merges incoming variant, model, storage conditions, and category specifics
        expect(merged?.identity?.variant).toBe('Medium Roast');
        expect(merged?.identity?.modelNumber).toBe('MR-01');
        expect(merged?.storage?.isPerishable).toBe(true);
        expect(merged?.storage?.isLightSensitive).toBe(true);
        expect(merged?.categorySpecific?.roastLevel).toBe('Medium');
    });

    it('safely handles missing or null attributes without crashing', () => {
        const bareItem = {
            productName: 'Simple Item',
            quantity: 5,
            unitCost: 100
        };

        const extracted = extractProductAttributesFromPOItem(bareItem);
        expect(extracted.brand).toBe('');
        expect(extracted.packQuantity).toBe(1);
        expect(extracted.unit).toBe('UNIT');
        expect(extracted.customAttributes).toBeNull();

        const merged = mergeCustomAttributes(null, null);
        expect(merged).toBeNull();
    });
});
