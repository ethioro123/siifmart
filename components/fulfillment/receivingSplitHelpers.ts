import { Product } from '../../types';
import { productsService } from '../../services/supabase.service';
import { categoryZonesService } from '../../services/category-zones.service';
import { logger } from '../../utils/logger';

export const cleanSku = (s?: string) => (s ? s.replace(/[-\s]/g, '').toUpperCase() : '');

export interface MatchProductParams {
    prodId?: string;
    prodSku?: string;
    productName?: string;
    incomingBarcodes: string[];
    targetSiteId: string;
    allProducts: Product[];
    products?: Product[];
}

export async function findMatchingProduct(params: MatchProductParams): Promise<{
    localProduct?: Product;
    globalProduct?: Product;
}> {
    const { prodId, prodSku, productName, incomingBarcodes, targetSiteId, allProducts, products } = params;

    const matchProduct = (p: Product) => {
        if (prodId && p.id === prodId) return true;
        if (prodSku && cleanSku(p.sku) === cleanSku(prodSku)) return true;
        if (incomingBarcodes.length > 0) {
            if (p.barcode && incomingBarcodes.includes(p.barcode.trim())) return true;
            if (Array.isArray(p.barcodes) && p.barcodes.some((b: string) => incomingBarcodes.includes(b.trim()))) return true;
        }
        if (productName && p.name && p.name.trim().toLowerCase() === productName.trim().toLowerCase()) return true;
        return false;
    };

    let localProduct = allProducts.find(
        p => (p.siteId === targetSiteId || (p as any).site_id === targetSiteId) && matchProduct(p)
    );

    if (!localProduct && products) {
        localProduct = products.find(
            p => (p.siteId === targetSiteId || (p as any).site_id === targetSiteId) && matchProduct(p)
        );
    }

    let globalProduct = allProducts.find(matchProduct);
    if (!globalProduct && products) {
        globalProduct = products.find(matchProduct);
    }

    if (!localProduct && targetSiteId && prodSku) {
        try {
            localProduct = (await productsService.getBySKU(prodSku, targetSiteId)) || undefined;
        } catch {
            // ignore
        }
    }

    if (!localProduct && !globalProduct) {
        try {
            if (prodId && prodId.length === 36 && !prodId.startsWith('variant-')) {
                globalProduct = await productsService.getById(prodId);
            }
            if (!globalProduct && prodSku) {
                globalProduct = (await productsService.getBySKU(prodSku)) || undefined;
            }
            if (!globalProduct && incomingBarcodes.length > 0) {
                const bcProds = await productsService.getByBarcode(incomingBarcodes[0]);
                globalProduct = (Array.isArray(bcProds) ? bcProds[0] : bcProds) || undefined;
            }
        } catch {
            logger.warn('receivingSplitHelpers', 'Could not fetch product from DB in receivePOSplit');
        }
    }

    return { localProduct, globalProduct };
}

export async function resolveSmartPutawayLocation(
    existingProduct: Product | undefined,
    itemCategory: string | undefined,
    targetSiteId: string
): Promise<string> {
    if (existingProduct?.location && existingProduct.location !== 'On Order' && existingProduct.location !== 'Receiving Dock') {
        return existingProduct.location;
    }

    if (targetSiteId && itemCategory) {
        try {
            const categoryMappings = await categoryZonesService.getMappings(targetSiteId);
            const match = categoryMappings.find(m => m.category.toLowerCase() === itemCategory.toLowerCase());
            if (match?.defaultZone) {
                logger.info('receivingSplitHelpers', `🎯 Smart Routing: Category "${itemCategory}" mapped to zone "${match.defaultZone}"`);
                return match.defaultZone;
            }
        } catch {
            logger.warn('receivingSplitHelpers', 'Category routing lookup failed (using fallback logic)');
        }
    }

    return '';
}
