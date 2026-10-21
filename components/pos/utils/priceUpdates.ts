import type { CartItem, Product } from '../../../types';

const PRICE_UPDATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function getPriceUpdateTimestamp(product: Product): number | null {
    const value = product.priceUpdatedAt || product.price_updated_at;
    if (!value) return null;

    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
}

export function getEffectiveRetailPrice(product: Pick<Product, 'price' | 'salePrice' | 'isOnSale'>): number {
    return product.isOnSale && product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
}

export function getRecentPriceUpdates(products: Product[], siteId?: string, now = Date.now()): Product[] {
    if (!siteId) return [];
    const cutoff = now - PRICE_UPDATE_WINDOW_MS;

    return products.filter(product => {
        const timestamp = getPriceUpdateTimestamp(product);
        const productSiteId = product.siteId || product.site_id;
        return productSiteId === siteId && timestamp !== null && timestamp > cutoff;
    });
}

export interface StaleCartPriceChange {
    itemId: string;
    productName: string;
    oldPrice: number;
    currentPrice: number;
}

export function getStaleCartPriceChanges(cart: CartItem[], products: Product[]): StaleCartPriceChange[] {
    return cart.flatMap(item => {
        const currentProduct = products.find(product => product.id === item.id);
        if (!currentProduct) return [];
        const currentPrice = getEffectiveRetailPrice(currentProduct);
        return Math.abs(currentPrice - item.price) > 0.0001
            ? [{ itemId: item.id, productName: item.name, oldPrice: item.price, currentPrice }]
            : [];
    });
}
