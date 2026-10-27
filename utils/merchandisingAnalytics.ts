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

    const EXCLUDED_STATUSES = new Set([
        'Pending', 'pending',
        'Refunded', 'refunded',
        'Cancelled', 'cancelled',
        'Draft', 'draft',
        'Void', 'void',
        'Rejected', 'rejected'
    ]);

    for (const order of orders) {
        if (!order.status || EXCLUDED_STATUSES.has(order.status)) continue;

        // Multi-Country Sovereignty: Kenya and Ethiopia data never query or merge across borders
        const orderCountry = order.countryCode || (order as any).country_code || (order as any).country;
        const productCountry = (product as any).countryCode || (product as any).country_code || (product as any).country;
        if (productCountry && orderCountry && productCountry.toUpperCase() !== orderCountry.toUpperCase()) {
            continue;
        }

        // Zero-Trust Site Isolation: Prevent another location's sales from inflating this location's forecast
        const orderSiteId = order.siteId || (order as any).site_id;
        const productSiteId = product.siteId || (product as any).site_id;
        if (productSiteId && orderSiteId && productSiteId !== orderSiteId) {
            continue;
        }

        const orderDate = new Date(order.date || order.createdAt || (order as { created_at?: string }).created_at || 0).getTime();
        const ageMs = nowMs - orderDate;

        if (ageMs < 0 || ageMs > ms30d) continue;

        for (const item of order.items || []) {
            const matchesId = item.id === product.id || item.productId === product.id;
            const matchesSku = !!product.sku && item.sku === product.sku;

            if (matchesId || matchesSku) {
                const qty = item.quantity || 0;
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

    const dailyRunRate = Number((unitsSold30d / 30).toFixed(2));
    const stock = Math.max(0, product.stock || 0);
    const daysOfSupply = dailyRunRate > 0 ? Math.round(stock / dailyRunRate) : (stock > 0 ? 999 : 0);

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

    const stockoutRisk = stock > 0 && daysOfSupply < 7;
    const needsMarkdown = (daysOfSupply > 60 || effectiveVelocity === 'Low') && stock > 20;

    return {
        productId: product.id,
        unitsSold7d,
        unitsSold30d,
        revenue30d: Number(revenue30d.toFixed(2)),
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
