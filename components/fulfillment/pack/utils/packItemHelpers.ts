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
    // Fall back to item's own unit/size when product not found
    const unit = prod?.unit || item.unit;
    const size = prod?.size || item.size;
    if (unit && size) {
        const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
        const sizeNum = parseFloat(size as string) || 0;
        if (isWeightVol && sizeNum > 1) {
            const expected = item.expectedQty || (item as any).quantity || 0;
            return expected * sizeNum;
        }
    }
    return null;
};
