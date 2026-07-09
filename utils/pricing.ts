/**
 * Smart Pricing Engine & Financial Utilities
 * Automated pricing, profit analysis, multi-currency
 */

import { Product, PricingRule, SaleRecord } from '../types';

// Re-export analytics, helpers, and types from separate file
export * from './pricingAnalytics';

// ============================================================================
// AUTOMATED PRICING ENGINE
// ============================================================================

/**
 * Execute all active pricing rules and return updated products
 */
export function executePricingRules(
    products: Product[],
    rules: PricingRule[],
    sales: SaleRecord[]
): Product[] {
    const updatedProducts = [...products];

    for (const rule of rules) {
        if (!rule.isActive) continue;

        for (let i = 0; i < updatedProducts.length; i++) {
            const product = updatedProducts[i];

            // Check if rule applies to this product's category
            if (product.category !== rule.targetCategory && rule.targetCategory !== 'All') continue;

            // Evaluate condition
            const shouldApply = evaluateCondition(product, rule, sales);

            if (shouldApply) {
                updatedProducts[i] = applyPricingAction(product, rule);
            }
        }
    }

    return updatedProducts;
}

function evaluateCondition(
    product: Product,
    rule: PricingRule,
    sales: SaleRecord[]
): boolean {
    switch (rule.condition) {
        case 'Stock > X':
            return product.stock > rule.threshold;

        case 'Expiry < X Days':
            if (!product.expiryDate) return false;
            const daysUntilExpiry = Math.floor(
                (new Date(product.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return daysUntilExpiry < rule.threshold;

        case 'Sales < X':
            const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const productSales = sales.filter(s =>
                new Date(s.date) >= last30Days &&
                s.items.some(i => i.id === product.id)
            ).length;
            return productSales < rule.threshold;

        default:
            return false;
    }
}

function applyPricingAction(product: Product, rule: PricingRule): Product {
    let newPrice = product.price;

    switch (rule.action) {
        case 'Decrease Price %':
            newPrice = product.price * (1 - rule.value / 100);
            break;

        case 'Increase Price %':
            newPrice = product.price * (1 + rule.value / 100);
            break;

        case 'Set to Cost + Margin':
            if (product.costPrice) {
                newPrice = product.costPrice * (1 + rule.value / 100);
            }
            break;
    }

    // Round to 2 decimal places
    newPrice = Math.round(newPrice * 100) / 100;

    return {
        ...product,
        salePrice: newPrice,
        isOnSale: newPrice < product.price
    };
}

// ============================================================================
// DYNAMIC PRICING
// ============================================================================

export interface DynamicPricingFactors {
    demandMultiplier: number; // 0.8 - 1.5
    competitorMultiplier: number; // 0.9 - 1.1
    inventoryMultiplier: number; // 0.7 - 1.2
    timeMultiplier: number; // 0.8 - 1.3
}

/**
 * Calculate dynamic price based on multiple factors
 */
export function calculateDynamicPrice(
    product: Product,
    factors: DynamicPricingFactors
): number {
    const basePrice = product.costPrice || product.price;

    // Apply all multipliers
    const dynamicPrice = basePrice *
        factors.demandMultiplier *
        factors.competitorMultiplier *
        factors.inventoryMultiplier *
        factors.timeMultiplier;

    // Ensure minimum margin
    const minPrice = basePrice * 1.1; // At least 10% margin
    const maxPrice = basePrice * 3; // Maximum 300% markup

    return Math.round(Math.max(minPrice, Math.min(maxPrice, dynamicPrice)) * 100) / 100;
}

/**
 * Calculate demand multiplier based on sales velocity
 */
export function calculateDemandMultiplier(
    product: Product,
    sales: SaleRecord[]
): number {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSales = sales.filter(s =>
        new Date(s.date) >= last7Days &&
        s.items.some(i => i.id === product.id)
    );

    const totalSold = recentSales.reduce((sum, sale) => {
        const item = sale.items.find(i => i.id === product.id);
        return sum + (item?.quantity || 0);
    }, 0);

    // High demand: increase price
    if (totalSold > 50) return 1.3;
    if (totalSold > 20) return 1.15;
    if (totalSold > 10) return 1.05;

    // Low demand: decrease price
    if (totalSold < 2) return 0.85;
    if (totalSold < 5) return 0.95;

    return 1.0;
}

/**
 * Calculate competitor multiplier
 */
export function calculateCompetitorMultiplier(product: Product): number {
    if (!product.competitorPrice) return 1.0;

    const priceDiff = product.price - product.competitorPrice;
    const percentDiff = (priceDiff / product.competitorPrice) * 100;

    // If we're more expensive, decrease price
    if (percentDiff > 10) return 0.95;
    if (percentDiff > 5) return 0.98;

    // If we're cheaper, we can increase price
    if (percentDiff < -10) return 1.05;
    if (percentDiff < -5) return 1.02;

    return 1.0;
}

/**
 * Calculate inventory multiplier
 */
export function calculateInventoryMultiplier(product: Product): number {
    const stockLevel = product.stock;

    // Overstocked: decrease price to move inventory
    if (stockLevel > 100) return 0.85;
    if (stockLevel > 50) return 0.95;

    // Low stock: increase price
    if (stockLevel < 5) return 1.2;
    if (stockLevel < 10) return 1.1;

    return 1.0;
}

/**
 * Calculate time-based multiplier (happy hour, etc.)
 */
export function calculateTimeMultiplier(hour: number, dayOfWeek: number): number {
    // Weekend premium (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 1.05;
    }

    // Happy hour discount (14:00 - 16:00)
    if (hour >= 14 && hour < 16) {
        return 0.9;
    }

    // Peak hours premium (18:00 - 20:00)
    if (hour >= 18 && hour < 20) {
        return 1.1;
    }

    return 1.0;
}

