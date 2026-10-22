import { describe, it, expect } from 'vitest';
import {
    computeSellUnitsPerOrderUnit,
    computeCostPerSellUnit,
    deduplicateCatalogProducts,
    buildPurchaseOrders,
    resolveOrderUnitLabels
} from '../../components/procurement/createPOHelpers';
import { buildPOItem } from '../../components/procurement/buildPOItem';
import { CATEGORY_SPEC_GROUPS } from '../../components/procurement/categorySpecGroups';
import { formatPriceValue } from '../../utils/formatting';
import type { Product, POItem, PurchaseOrder } from '../../types';

describe('PO Creation Flow Fixes & Helpers', () => {
    it('computes cost per sell unit consistently for weight, volume, and count items', () => {
        // 10kg bag for 14,000 ETB sold by KG -> 1,400 ETB/kg
        expect(computeCostPerSellUnit(14000, '10', 'kg', 'KG', 1, 0)).toBe(1400);
        // 10kg bag for 14,000 ETB sold by G -> 1.4 ETB/g
        expect(computeCostPerSellUnit(14000, '10', 'kg', 'G', 1, 0)).toBeCloseTo(1.4, 4);
        // 20L container for 26,000 ETB sold by L -> 1,300 ETB/L
        expect(computeCostPerSellUnit(26000, '20', 'L', 'L', 1, 0)).toBe(1300);
        // Case of 24 units for 1,200 ETB sold by UNIT -> 50 ETB/unit
        expect(computeCostPerSellUnit(1200, '500', 'ml', 'UNIT', 24, 0)).toBe(50);
        // 2-tier master case (4 packs x 6 units = 24 units) for 2,400 ETB -> 100 ETB/unit
        expect(computeSellUnitsPerOrderUnit('500', 'ml', 'UNIT', 6, 4)).toBe(24);
        expect(computeCostPerSellUnit(2400, '500', 'ml', 'UNIT', 6, 4)).toBe(100);
    });

    it('deduplicates catalog products by SKU and enforces country isolation', () => {
        const products: Product[] = [
            { id: 'p-store', name: 'Sunflower Oil 5L', sku: 'ET-GRO-0001', siteId: 'site-store-1', price: 900, costPrice: 700, category: 'Groceries', stock: 5 } as Product,
            { id: 'p-wh', name: 'Sunflower Oil 5L', sku: 'ET-GRO-0001', siteId: 'site-wh-1', price: 900, costPrice: 680, category: 'Groceries', stock: 120 } as Product,
            { id: 'p-ke', name: 'Kenya Tea 500g', sku: 'KE-BEV-0001', siteId: 'site-ke-wh', price: 400, costPrice: 300, category: 'Beverages', stock: 50 } as Product
        ];

        const countrySiteIds = new Set(['site-store-1', 'site-wh-1']);
        const deduped = deduplicateCatalogProducts(products, ['site-wh-1'], countrySiteIds, 'ET');

        expect(deduped).toHaveLength(1);
        expect(deduped[0].id).toBe('p-wh');
        expect(deduped[0].costPrice).toBe(680);
    });

    it('splits shipping cost across hubs in split mode and flags requiresHqApproval when regional cap is exceeded', () => {
        const items: POItem[] = [
            {
                productId: 'prod-1',
                productName: 'Basmati Rice 5kg',
                sku: 'ET-GRO-0010',
                quantity: 10,
                unitCost: 1000,
                totalCost: 10000,
                retailPrice: 1300,
                identityType: 'known'
            }
        ];

        const sites = [
            { id: 'wh-1', name: 'Addis Central WH', country: 'ET', currency: 'ETB', region_code: 'ET-ADD' },
            { id: 'wh-2', name: 'Bole Logistics Hub', country: 'ET', currency: 'ETB', region_code: 'ET-ADD' }
        ];

        const splitPOs = buildPurchaseOrders({
            destinationSiteIds: ['wh-1', 'wh-2'],
            processedItems: items,
            quantityDistribution: 'split',
            shippingCost: 500,
            discountRate: 0,
            taxRate: 0,
            sites,
            currencySymbol: 'ETB',
            vendorId: 'sup-1',
            vendorName: 'Abyssinia Foods',
            expectedDate: '2026-11-01',
            poNotes: 'Split order',
            paymentTerms: 'Net 30',
            poPriority: 'Normal',
            userName: 'Regional Buyer',
            isRegionalUser: true,
            regionalAutonomousPoLimit: 4000
        });

        expect(splitPOs).toHaveLength(2);
        // 10 items split across 2 hubs -> 5 each (5,000 subtotal each) + 250 shipping each = 5,250 each
        expect(splitPOs[0].po.shippingCost).toBe(250);
        expect(splitPOs[1].po.shippingCost).toBe(250);
        expect(splitPOs[0].po.totalAmount).toBe(5250);
        expect(splitPOs[1].po.totalAmount).toBe(5250);
        // 5,250 > 4,000 regionalAutonomousPoLimit -> requiresHqApproval = true
        expect(splitPOs[0].po.requiresHqApproval).toBe(true);
    });

    it('preserves original PO number, date, status, and site when editing an existing PO', () => {
        const existingPO: PurchaseOrder = {
            id: 'po-existing-1',
            poNumber: 'AAAB0042',
            po_number: 'AAAB0042',
            siteId: 'wh-1',
            supplierId: 'sup-1',
            supplierName: 'Abyssinia Foods',
            date: '2026-10-01',
            status: 'Pending',
            totalAmount: 5000,
            itemsCount: 5,
            expectedDelivery: null,
            lineItems: [],
            createdBy: 'Original Creator',
            dockSlot: undefined
        };

        const items: POItem[] = [
            {
                productId: 'prod-1',
                productName: 'Basmati Rice 5kg',
                sku: 'ET-GRO-0010',
                quantity: 6,
                unitCost: 1000,
                totalCost: 6000,
                retailPrice: 1300,
                identityType: 'known'
            }
        ];

        const updated = buildPurchaseOrders({
            destinationSiteIds: ['wh-1'],
            processedItems: items,
            quantityDistribution: 'per-store',
            shippingCost: 0,
            discountRate: 10,
            taxRate: 15,
            editingPO: existingPO,
            sites: [{ id: 'wh-1', name: 'Addis Central WH', country: 'ET', currency: 'ETB' }],
            currencySymbol: 'ETB',
            vendorId: 'sup-1',
            vendorName: 'Abyssinia Foods',
            expectedDate: '2026-11-05',
            poNotes: 'Updated qty',
            paymentTerms: 'Net 30',
            poPriority: 'High',
            userName: 'Current Editor'
        });

        expect(updated).toHaveLength(1);
        expect(updated[0].po.id).toBe('po-existing-1');
        expect(updated[0].po.poNumber).toBe('AAAB0042');
        expect(updated[0].po.date).toBe('2026-10-01');
        expect(updated[0].po.status).toBe('Pending');
        expect(updated[0].po.createdBy).toBe('Original Creator');
        expect(updated[0].po.dockSlot).toBeUndefined();
    });

    it('builds custom PO items with auto-filled GS1/storage defaults and clean order unit labels', async () => {
        expect(resolveOrderUnitLabels('single', false, false, 0, 1)).toEqual({
            orderUnitName: 'Unit',
            unitSuffix: '(1:1 individual units)'
        });
        expect(resolveOrderUnitLabels('two_tier', true, false, 4, 6)).toEqual({
            orderUnitName: 'Master Case',
            unitSuffix: '(master cases — 4 inner packs × 6 units = 24 units/case)'
        });
        // Short label 'ea' should also resolve count-based cost per sell unit
        expect(computeCostPerSellUnit(1200, '500', 'g', 'ea', 24, 0)).toBe(50);

        const result = await buildPOItem({
            products: [],
            existingItems: [],
            editingItem: null,
            country: 'ET',
            productType: 'new',
            currentProductToAdd: '',
            currentQty: 10,
            currentCost: 450,
            currentRetailPrice: 600,
            customItemName: 'Basmati Rice',
            customItemBrand: 'Royal',
            selectedMainCategory: 'Grains, Pasta & Rice',
            customItemSize: '500',
            customItemUnit: 'UNIT',
            customItemImage: '',
            customAttributes: {
                identity: { variant: '', type: '', subcategory: '', modelNumber: '' },
                physical: { netWeight: '500', grossWeight: '0.55', volume: '', unit: '', sizeType: 'g', dims: '', color: '', form: '', texture: '' },
                packaging: { unitSize: '', packQty: '1', caseSize: '', packagingLevel: 'single', material: '', isBreakable: false, packageType: '' },
                storage: { type: '', isPerishable: false, stackLimit: '', isHazardous: false, isFragile: false, isLightSensitive: false, inboundQcDirective: '', shelfLifeDays: '' },
                commercial: { isWeighted: false, sellBy: 'Unit', priceType: 'Fixed', isBundleEligible: false, isReturnable: true },
                descriptive: { usage: '', audience: '', ingredients: '', keyFeatures: '', scent: '', flavor: '', strength: '' },
                categorySpecific: {}
            },
            caseSize: 0,
            pkgType: ''
        });

        expect(result.errors).toBeUndefined();
        expect(result.item).toBeDefined();
        expect(result.item?.size).toBe('500g');
        expect(result.item?.customAttributes?.packaging?.material).toBe('Paper / Cardboard');
        expect(result.item?.customAttributes?.storage?.inboundQcDirective).toBeTruthy();
    });

    it('enforces whole-number pricing globally (no decimal points) and uses concise "Juice" beverage option', async () => {
        const beverageField = CATEGORY_SPEC_GROUPS.beverages.fields.find(f => f.key === 'beverageType');
        expect(beverageField?.options).toContain('Juice');
        expect(beverageField?.options).not.toContain('100% Pure Fruit Juice');

        expect(formatPriceValue(1299.78)).toBe('1,300');
        expect(formatPriceValue(520.4)).toBe('520');

        const itemRes = await buildPOItem({
            products: [
                { id: 'prod-1', name: 'Mango Juice 1L', sku: 'ET-BEV-0001', price: 185.6, costPrice: 120.4, category: 'Beverages', stock: 10 } as Product
            ],
            existingItems: [],
            editingItem: null,
            country: 'ET',
            productType: 'catalog',
            currentProductToAdd: 'prod-1',
            currentQty: 5,
            currentCost: 120.4,
            currentRetailPrice: 185.6,
            customItemName: 'Mango Juice 1L',
            customItemBrand: 'Rani',
            selectedMainCategory: 'Beverages',
            customItemSize: '1L',
            customItemUnit: 'UNIT',
            customItemImage: '',
            customAttributes: {},
            caseSize: 0,
            pkgType: ''
        });

        expect(itemRes.item?.unitCost).toBe(120);
        expect(itemRes.item?.retailPrice).toBe(186);
        expect(itemRes.item?.totalCost).toBe(600);
    });
});
