import { WMSJob, Product } from '../../../../types';
import { isWeightBased, isVolumeBased } from '../../../../utils/units';

/**
 * Find a product matching a line item, with robust fallback:
 * 1. productId exact match
 * 2. Site-scoped SKU match
 * 3. Any-site SKU fallback
 */
export const getProductForItem = (item: any, job: WMSJob, products: Product[]): Product | undefined => {
    const targetSiteId = job.siteId || (job as any).site_id;
    if (item.productId) {
        const byId = products.find(p => p.id === item.productId);
        if (byId) return byId;
    }
    return products.find(p => p.sku === item.sku && (p.siteId === targetSiteId || p.site_id === targetSiteId))
        || products.find(p => p.sku === item.sku);
};

/**
 * Calculate the total measure quantity for a line item.
 * Falls back to item.unit + item.size when product catalogue lookup fails.
 * Returns null for non-weight/volume items or when size data is unavailable.
 */
export const getItemMeasureQty = (
    item: any,
    job: WMSJob,
    products: Product[],
    product?: Product | null
): number | null => {
    if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
        return (item as any).requestedMeasureQty;
    }
    const prod = product !== undefined ? product : getProductForItem(item, job, products);
    const customAttrs = prod?.customAttributes || (prod as any)?.custom_attributes;
    const sellBy = customAttrs?.commercial?.sellBy || '';
    const isWeighted = customAttrs?.commercial?.isWeighted === true;

    // Only return measure quantity if the item is a loose bulk item sold by weight/volume
    if (sellBy === 'Weight' || sellBy === 'Volume' || isWeighted) {
        return item.expectedQty || (item as any).quantity || null;
    }
    return null;
};
