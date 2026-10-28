import type { Product, SaleRecord } from '../types';

/**
 * Pure merchandising analytics engine: evaluates real POS order history,
 * daily run-rate, days of supply, and velocity without hardcoded multipliers.
 */

export interface ProductSalesMetrics {
    productId: string;
    unitsSold7d: number;
    unitsSold30d: number;
    revenue30d: number;
    dailyRunRate: number;
    daysOfSupply: number;
    effectiveVelocity: 'High' | 'Medium' | 'Low';
    hasOrderHistory: boolean;
    stockoutRisk: boolean;
    needsMarkdown: boolean;
}

export const computeProductSalesMetrics = (
    product: Product,
    orders: SaleRecord[] = [],
    now: Date = new Date()
): ProductSalesMetrics => {
    const nowMs = now.getTime();
    const ms7d = 7 * 24 * 60 * 60 * 1000;
    const ms30d = 30 * 24 * 60 * 60 * 1000;

    let unitsSold7d = 0;
    let unitsSold30d = 0;
    let revenue30d = 0;
    let matchedOrderCount = 0;

    for (const order of orders) {
        // Partial refunds lack line-level returned quantities here; never count their gross units.
        if (order.status !== 'Completed') continue;
        const orderCountry = order.countryCode || order.country_code;
        const productCountry = (product as { countryCode?: string; country_code?: string }).countryCode || (product as { countryCode?: string; country_code?: string }).country_code;
        if (productCountry && orderCountry && productCountry.toUpperCase() !== orderCountry.toUpperCase()) continue;
        if (product.siteId && (order.siteId || order.site_id) !== product.siteId) continue;

        const orderDate = new Date(order.date || order.createdAt || (order as { created_at?: string }).created_at || 0).getTime();
        const ageMs = nowMs - orderDate;

        if (!Number.isFinite(orderDate) || ageMs < 0 || ageMs > ms30d) continue;

        for (const item of order.items || []) {
            const matchesId = item.id === product.id || item.productId === product.id;
            const matchesSku = !!product.sku && item.sku === product.sku;

            if (matchesId || matchesSku) {
                const qty = Number(item.quantity);
                if (!Number.isFinite(qty) || qty <= 0) continue;
                const itemPrice = item.salePrice && item.salePrice > 0 ? item.salePrice : item.price || 0;

                unitsSold30d += qty;
                revenue30d += qty * itemPrice;
                matchedOrderCount++;

                if (ageMs <= ms7d) {
                    unitsSold7d += qty;
                }
            }
        }
    }

    const dailyRunRate = Math.round(unitsSold30d / 30);
    const stock = Math.max(0, product.stock || 0);
    const daysOfSupply = unitsSold30d > 0 ? Math.round(stock * 30 / unitsSold30d) : (stock > 0 ? 999 : 0);

    let effectiveVelocity: 'High' | 'Medium' | 'Low';
    if (matchedOrderCount > 0) {
        if (unitsSold30d >= 40) {
            effectiveVelocity = 'High';
        } else if (unitsSold30d >= 10) {
            effectiveVelocity = 'Medium';
        } else {
            effectiveVelocity = 'Low';
        }
    } else {
        effectiveVelocity = (product.salesVelocity as 'High' | 'Medium' | 'Low') || 'Low';
    }

    const stockoutRisk = matchedOrderCount > 0 && daysOfSupply < 7;
    const needsMarkdown = (daysOfSupply > 60 || effectiveVelocity === 'Low') && stock > 20;

    return {
        productId: product.id,
        unitsSold7d: Math.round(unitsSold7d),
        unitsSold30d: Math.round(unitsSold30d),
        revenue30d: Math.round(revenue30d),
        dailyRunRate,
        daysOfSupply,
        effectiveVelocity,
        hasOrderHistory: matchedOrderCount > 0,
        stockoutRisk,
        needsMarkdown
    };
};

/**
 * Builds a fast lookup map of metrics by productId for all catalog products.
 */
export const buildCatalogSalesMetricsIndex = (
    products: Product[],
    orders: SaleRecord[],
    now: Date = new Date()
): Map<string, ProductSalesMetrics> => {
    const map = new Map<string, ProductSalesMetrics>();
    for (const p of products) {
        map.set(p.id, computeProductSalesMetrics(p, orders, now));
    }
    return map;
};
