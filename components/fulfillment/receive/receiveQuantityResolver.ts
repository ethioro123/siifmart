import { WMSJob, Product } from '../../../types';
import { convertToSellableUnits } from '../../procurement/utils';

export interface POJobsReceivedMaps {
    skuMap: Record<string, number>;
    idMap: Record<string, number>;
    nameMap: Record<string, number>;
    jobSkuMap: Record<string, string>;
}

export interface POLineItemProgress {
    dbReceived: number;
    jobReceived: number;
    effectiveReceived: number;
    expectedSellable: number;
    remaining: number;
    isComplete: boolean;
    resolvedSku: string;
    resolvedProductId?: string;
    product?: Product;
}

export const cleanSku = (s?: string) => s ? s.replace(/[-\s]/g, '').toUpperCase() : '';
export const cleanName = (s?: string) => s ? s.trim().toLowerCase() : '';

/**
 * Builds an index of quantities received across PUTAWAY jobs for a specific PO,
 * indexed multi-dimensionally by SKU, Product ID, and normalized Product Name.
 */
export function buildPOJobsReceivedMap(poJobs: WMSJob[]): POJobsReceivedMaps {
    const skuMap: Record<string, number> = {};
    const idMap: Record<string, number> = {};
    const nameMap: Record<string, number> = {};
    const jobSkuMap: Record<string, string> = {};

    poJobs.forEach(job => {
        if (job.type !== 'PUTAWAY') return;
        job.lineItems?.forEach((ji: any) => {
            const expected = ji.expectedQty || (ji as any).quantity || 0;
            if (expected <= 0) return;

            if (ji.sku) {
                const k = cleanSku(ji.sku);
                skuMap[k] = (skuMap[k] || 0) + expected;
            }
            if (ji.productId) {
                idMap[ji.productId] = (idMap[ji.productId] || 0) + expected;
            }
            if (ji.name) {
                const nk = cleanName(ji.name);
                nameMap[nk] = (nameMap[nk] || 0) + expected;
            }
            if (ji.productId && ji.sku) {
                jobSkuMap[ji.productId] = ji.sku;
            }
        });
    });

    return { skuMap, idMap, nameMap, jobSkuMap };
}

/**
 * Resolves the received quantity and completeness for a single PO line item
 * across both database persisted state and active PUTAWAY jobs.
 */
export function resolvePOLineItemProgress(
    item: any,
    maps: POJobsReceivedMaps,
    allProducts: Product[] = []
): POLineItemProgress {
    const dbReceived = Number(item.receivedQty || item.received_qty || 0);
    const expectedSellable = convertToSellableUnits(item.quantity, item);

    const itemSku = cleanSku(item.sku);
    const itemName = cleanName(item.productName || item.name);

    // Find matching catalog product by ID, SKU, or Name
    const product = allProducts.find(p => 
        (item.productId && p.id === item.productId) ||
        (itemSku && cleanSku(p.sku) === itemSku) ||
        (itemName && cleanName(p.name) === itemName)
    );

    const prodSku = product?.sku ? cleanSku(product.sku) : '';
    const prodId = product?.id || item.productId;

    // Collect received units across SKU, Product ID, Catalog Product SKU/ID, and Name
    const skuQty = itemSku ? (maps.skuMap[itemSku] || 0) : 0;
    const prodSkuQty = prodSku ? (maps.skuMap[prodSku] || 0) : 0;
    const idQty = item.productId ? (maps.idMap[item.productId] || 0) : 0;
    const prodIdQty = prodId ? (maps.idMap[prodId] || 0) : 0;
    const nameQty = itemName ? (maps.nameMap[itemName] || 0) : 0;

    const jobReceived = Math.max(skuQty, prodSkuQty, idQty, prodIdQty, nameQty);
    const effectiveReceived = Math.max(dbReceived, jobReceived);
    const remaining = Math.max(0, expectedSellable - effectiveReceived);

    return {
        dbReceived,
        jobReceived,
        effectiveReceived,
        expectedSellable,
        remaining,
        isComplete: remaining <= 0,
        resolvedSku: maps.jobSkuMap[item.productId || ''] || maps.jobSkuMap[prodId || ''] || product?.sku || item.sku || '',
        resolvedProductId: prodId,
        product
    };
}
