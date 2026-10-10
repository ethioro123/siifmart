import { describe, it, expect } from 'vitest';
import {
    buildPOJobsReceivedMap,
    resolvePOLineItemProgress,
    cleanSku,
    cleanName
} from '../../components/fulfillment/receive/receiveQuantityResolver';
import { WMSJob, Product } from '../../types';

describe('receiveQuantityResolver', () => {
    const mockAllProducts: Product[] = [
        {
            id: 'prod-kindle-1',
            sku: 'KEEL001',
            name: 'Amazon Kindle',
            siteId: 'site-ke-1',
            price: 50000,
            stock: 0,
            category: 'Electronics',
            status: 'active',
            image: ''
        } as Product,
        {
            id: 'prod-tuna-1',
            sku: 'TS001',
            name: 'Wanchi Tuna',
            siteId: 'site-ke-1',
            price: 300,
            stock: 0,
            category: 'Canned Food',
            status: 'active',
            image: ''
        } as Product
    ];

    const mockPutawayJobs: WMSJob[] = [
        {
            id: 'job-1',
            jobNumber: '2F7FMK',
            type: 'PUTAWAY',
            status: 'Pending',
            siteId: 'site-ke-1',
            orderRef: 'po-143',
            items: 1,
            lineItems: [
                {
                    productId: 'prod-kindle-1',
                    sku: 'KEEL001',
                    name: 'Amazon Kindle',
                    expectedQty: 100,
                    pickedQty: 0,
                    status: 'Pending'
                }
            ]
        } as WMSJob,
        {
            id: 'job-2',
            jobNumber: '86W12Q',
            type: 'PUTAWAY',
            status: 'Pending',
            siteId: 'site-ke-1',
            orderRef: 'po-143',
            items: 1,
            lineItems: [
                {
                    productId: 'prod-tuna-1',
                    sku: 'TS001',
                    name: 'Wanchi Tuna',
                    expectedQty: 720,
                    pickedQty: 0,
                    status: 'Pending'
                }
            ]
        } as WMSJob
    ];

    it('builds multi-dimensional received map across sku, id, and name', () => {
        const maps = buildPOJobsReceivedMap(mockPutawayJobs);
        expect(maps.skuMap['KEEL001']).toBe(100);
        expect(maps.skuMap['TS001']).toBe(720);
        expect(maps.nameMap['amazon kindle']).toBe(100);
        expect(maps.nameMap['wanchi tuna']).toBe(720);
        expect(maps.idMap['prod-kindle-1']).toBe(100);
        expect(maps.idMap['prod-tuna-1']).toBe(720);
    });

    it('accurately resolves progress when supplier SKU differs from warehouse SKU via name matching', () => {
        const maps = buildPOJobsReceivedMap(mockPutawayJobs);
        // PO has supplier SKU KE-CN001, but warehouse job was created with TS001
        const poLineItem = {
            id: 'po-item-2',
            productName: 'Wanchi Tuna',
            sku: 'KE-CN001',
            productId: null,
            quantity: 30, // 30 cases * 24 units = 720 sellable units
            packQuantity: 24,
            receivedQty: 0
        };

        const progress = resolvePOLineItemProgress(poLineItem, maps, mockAllProducts);
        expect(progress.jobReceived).toBe(720);
        expect(progress.effectiveReceived).toBe(720);
        expect(progress.expectedSellable).toBe(720);
        expect(progress.remaining).toBe(0);
        expect(progress.isComplete).toBe(true);
        expect(progress.resolvedSku).toBe('TS001');
    });

    it('accurately resolves progress with hyphenated SKU format (KE-EL001 vs KEEL001)', () => {
        const maps = buildPOJobsReceivedMap(mockPutawayJobs);
        const poLineItem = {
            id: 'po-item-1',
            productName: 'Amazon Kindle',
            sku: 'KE-EL001',
            productId: null,
            quantity: 100,
            packQuantity: 1,
            receivedQty: 0
        };

        const progress = resolvePOLineItemProgress(poLineItem, maps, mockAllProducts);
        expect(progress.jobReceived).toBe(100);
        expect(progress.effectiveReceived).toBe(100);
        expect(progress.isComplete).toBe(true);
    });
});
