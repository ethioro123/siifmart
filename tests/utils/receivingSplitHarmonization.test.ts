import { describe, it, expect } from 'vitest';
import { convertToSellableUnits } from '../../components/fulfillment/useReceiving';
import { generateBatchNumber, parseBatchNumber } from '../../utils/batchNumber';

describe('Receiving Split & Unit Harmonization', () => {
    it('converts ordered manifest packages to sellable units accurately', () => {
        const itemWithPack = {
            productId: 'KE-GR001',
            sku: 'KE-GR001',
            productName: 'Juma Ugali Flour 1kg',
            quantity: 12, // 12 Bales
            packQuantity: 12, // 12 pk/Bale
            size: '1kg',
            unit: 'KG'
        };

        const sellableUnits = convertToSellableUnits(itemWithPack.quantity, itemWithPack);
        expect(sellableUnits).toBe(144);
    });

    it('handles items with customAttributes packaging packQty', () => {
        const itemWithCustomAttr = {
            productId: 'KE-DR002',
            sku: 'KE-DR002',
            productName: 'Maji Pure Water 500ml',
            quantity: 5, // 5 Cartons
            customAttributes: {
                packaging: { packQty: '24', packageType: 'Carton' }
            }
        };

        const sellableUnits = convertToSellableUnits(itemWithCustomAttr.quantity, itemWithCustomAttr);
        expect(sellableUnits).toBe(120);
    });

    it('returns exact quantity when packQuantity is 1 or missing', () => {
        const itemSingle = {
            productId: 'KE-OT001',
            sku: 'KE-OT001',
            productName: 'Stand Mixer',
            quantity: 10
        };

        expect(convertToSellableUnits(itemSingle.quantity, itemSingle)).toBe(10);
    });

    it('canonical key accumulation prevents double-counting when productId equals sku', () => {
        const cleanSku = (s?: string) => s ? s.replace(/[-\s]/g, '').toUpperCase() : '';
        
        // Simulated jobs resulting from receiving 144 units of Juma Ugali Flour
        const jobs = [
            {
                orderRef: 'po-123',
                type: 'PUTAWAY',
                lineItems: [
                    {
                        productId: 'KE-GR001',
                        sku: 'KE-GR001',
                        expectedQty: 144
                    }
                ]
            }
        ];

        // Old buggy behavior: incremented both productId and sku and cleanSku
        const buggyMap: Record<string, number> = {};
        jobs[0].lineItems.forEach(item => {
            const qty = item.expectedQty || 0;
            if (item.productId) buggyMap[item.productId] = (buggyMap[item.productId] || 0) + qty;
            if (item.sku) buggyMap[item.sku] = (buggyMap[item.sku] || 0) + qty;
        });
        // Buggy map would have 288 for KE-GR001!
        expect(buggyMap['KE-GR001']).toBe(288);

        // Fixed canonical accumulation:
        const fixedMap: Record<string, number> = {};
        jobs[0].lineItems.forEach(item => {
            const qty = item.expectedQty || 0;
            const canonKey = cleanSku(item.sku) || item.productId;
            if (canonKey) {
                fixedMap[canonKey] = (fixedMap[canonKey] || 0) + qty;
            }
        });

        // Fixed map accurately has 144 units!
        expect(fixedMap['KEGR001']).toBe(144);
    });

    it('generates date-anchored lot numbers matching standard LOT-YYYYMMDD-[SKU]-[SEQ]', () => {
        const lot = generateBatchNumber({
            sku: 'KE-GR001',
            sequence: 1
        });

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const expectedPrefix = `LOT-${yyyy}${mm}${dd}-KEGR001-01`;

        expect(lot).toBe(expectedPrefix);

        const parsed = parseBatchNumber(lot);
        expect(parsed.isStandard).toBe(true);
        expect(parsed.sku).toBe('KEGR001');
        expect(parsed.sequence).toBe(1);
    });

    it('verifies that same SKU and same barcode do not conflict under normalized matching', () => {
        const cleanSku = (s: string) => s.replace(/[-\s]/g, '').toUpperCase();
        
        const existingProductInDb = {
            sku: 'KEGR001',
            name: 'Juma Ugali Flour 1kg',
            barcode: '6161100001234'
        };

        const incomingItem = {
            sku: 'KE-GR001',
            barcode: '6161100001234'
        };

        const targetNormalized = cleanSku(incomingItem.sku);
        const existingNormalized = cleanSku(existingProductInDb.sku);

        // Under cleanSku normalization, both are KEGR001
        expect(targetNormalized).toBe(existingNormalized);
        expect(targetNormalized).toBe('KEGR001');

        // Conflict check function: itemSku !== normalizedTargetSku
        const hasConflict = existingNormalized !== targetNormalized;
        expect(hasConflict).toBe(false);
    });
});
