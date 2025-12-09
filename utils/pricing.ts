
/**
 * Smart Pricing Engine & Financial Utilities
 * Automated pricing, profit analysis, multi-currency
 */

import { Product, PricingRule, SaleRecord, ExpenseRecord } from '../types';

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

// ============================================================================
// PROFIT ANALYSIS
// ============================================================================

export interface ProfitAnalysis {
    revenue: number;
    cogs: number; // Cost of Goods Sold
    grossProfit: number;
    grossMargin: number; // Percentage
    netProfit: number;
    netMargin: number; // Percentage
}

/**
 * Calculate profit metrics for a period
 */
export function calculateProfitAnalysis(
    sales: SaleRecord[],
    expenses: ExpenseRecord[],
    products: Product[]
): ProfitAnalysis {
    // Calculate revenue
    const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);

    // Calculate COGS (Cost of Goods Sold)
    let cogs = 0;
    for (const sale of sales) {
        for (const item of sale.items) {
            const product = products.find(p => p.id === item.id);
            const costPrice = product?.costPrice || product?.price || 0;
            cogs += costPrice * item.quantity;
        }
    }

    // Calculate gross profit
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate net profit
    const netProfit = grossProfit - totalExpenses;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
        revenue: Math.round(revenue * 100) / 100,
        cogs: Math.round(cogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMargin: Math.round(grossMargin * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netMargin: Math.round(netMargin * 100) / 100
    };
}

/**
 * Calculate profit per product
 */
export function calculateProductProfit(
    product: Product,
    sales: SaleRecord[]
): { unitProfit: number; totalProfit: number; margin: number } {
    const costPrice = product.costPrice || product.price * 0.6; // Assume 40% margin if no cost
    const unitProfit = product.price - costPrice;
    const margin = (unitProfit / product.price) * 100;

    // Calculate total profit from sales
    const totalSold = sales.reduce((sum, sale) => {
        const item = sale.items.find(i => i.id === product.id);
        return sum + (item?.quantity || 0);
    }, 0);

    const totalProfit = unitProfit * totalSold;

    return {
        unitProfit: Math.round(unitProfit * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        margin: Math.round(margin * 100) / 100
    };
}

// ============================================================================
// BREAK-EVEN ANALYSIS
// ============================================================================

export interface BreakEvenAnalysis {
    breakEvenUnits: number;
    breakEvenRevenue: number;
    currentUnits: number;
    unitsToBreakEven: number;
}

/**
 * Calculate break-even point
 */
export function calculateBreakEven(
    product: Product,
    fixedCosts: number,
    sales: SaleRecord[]
): BreakEvenAnalysis {
    const sellingPrice = product.price;
    const variableCost = product.costPrice || product.price * 0.6;
    const contributionMargin = sellingPrice - variableCost;

    // Break-even units = Fixed Costs / Contribution Margin
    const breakEvenUnits = contributionMargin > 0
        ? Math.ceil(fixedCosts / contributionMargin)
        : 0;

    const breakEvenRevenue = breakEvenUnits * sellingPrice;

    // Current units sold
    const currentUnits = sales.reduce((sum, sale) => {
        const item = sale.items.find(i => i.id === product.id);
        return sum + (item?.quantity || 0);
    }, 0);

    const unitsToBreakEven = Math.max(0, breakEvenUnits - currentUnits);

    return {
        breakEvenUnits,
        breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
        currentUnits,
        unitsToBreakEven
    };
}

// ============================================================================
// MULTI-CURRENCY SUPPORT
// ============================================================================

export interface ExchangeRate {
    from: string;
    to: string;
    rate: number;
    lastUpdated: Date;
}

/**
 * Convert amount between currencies
 */
export function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRates: ExchangeRate[]
): number {
    if (fromCurrency === toCurrency) return amount;

    // Find exchange rate
    const rate = exchangeRates.find(r =>
        r.from === fromCurrency && r.to === toCurrency
    );

    if (!rate) {
        // Try reverse rate
        const reverseRate = exchangeRates.find(r =>
            r.from === toCurrency && r.to === fromCurrency
        );

        if (reverseRate) {
            return Math.round((amount / reverseRate.rate) * 100) / 100;
        }

        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    return Math.round((amount * rate.rate) * 100) / 100;
}

/**
 * Get current exchange rates (mock - in production, fetch from API)
 */
export function getCurrentExchangeRates(): ExchangeRate[] {
    return [
        { from: 'USD', to: 'ETB', rate: 55.5, lastUpdated: new Date() },
        { from: 'USD', to: 'KES', rate: 130.0, lastUpdated: new Date() },
        { from: 'EUR', to: 'ETB', rate: 60.2, lastUpdated: new Date() },
        { from: 'EUR', to: 'KES', rate: 141.0, lastUpdated: new Date() },
        { from: 'ETB', to: 'KES', rate: 2.34, lastUpdated: new Date() },
    ];
}

// ============================================================================
// PRICING OPTIMIZATION
// ============================================================================

export interface PriceOptimization {
    currentPrice: number;
    optimalPrice: number;
    expectedRevenue: number;
    expectedProfit: number;
    priceElasticity: number;
}

/**
 * Calculate optimal price point
 * Uses price elasticity of demand
 */
export function calculateOptimalPrice(
    product: Product,
    sales: SaleRecord[],
    priceElasticity: number = -1.5 // Typical elasticity
): PriceOptimization {
    const currentPrice = product.price;
    const costPrice = product.costPrice || currentPrice * 0.6;

    // Calculate current demand
    const currentDemand = sales.reduce((sum, sale) => {
        const item = sale.items.find(i => i.id === product.id);
        return sum + (item?.quantity || 0);
    }, 0);

    // Optimal price = Cost / (1 + 1/elasticity)
    // This maximizes profit given the elasticity
    const optimalPrice = costPrice / (1 + 1 / priceElasticity);

    // Estimate new demand at optimal price
    const priceChange = (optimalPrice - currentPrice) / currentPrice;
    const demandChange = priceElasticity * priceChange;
    const newDemand = currentDemand * (1 + demandChange);

    // Calculate expected revenue and profit
    const expectedRevenue = optimalPrice * newDemand;
    const expectedProfit = (optimalPrice - costPrice) * newDemand;

    return {
        currentPrice: Math.round(currentPrice * 100) / 100,
        optimalPrice: Math.round(optimalPrice * 100) / 100,
        expectedRevenue: Math.round(expectedRevenue * 100) / 100,
        expectedProfit: Math.round(expectedProfit * 100) / 100,
        priceElasticity
    };
}

// ============================================================================
// BUNDLE PRICING
// ============================================================================

export interface Bundle {
    id: string;
    name: string;
    productIds: string[];
    bundlePrice: number;
    discount: number; // Percentage
}

/**
 * Calculate bundle price with discount
 */
export function calculateBundlePrice(
    products: Product[],
    discountPercentage: number
): number {
    const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
    const bundlePrice = totalPrice * (1 - discountPercentage / 100);
    return Math.round(bundlePrice * 100) / 100;
}

/**
 * Suggest product bundles based on purchase patterns
 */
export function suggestBundles(
    sales: SaleRecord[],
    minSupport: number = 0.1 // 10% of transactions
): { products: string[]; frequency: number }[] {
    const itemSets: Map<string, number> = new Map();

    // Find frequently bought together items
    for (const sale of sales) {
        const itemIds = sale.items.map(i => i.id).sort();

        // Generate all pairs
        for (let i = 0; i < itemIds.length; i++) {
            for (let j = i + 1; j < itemIds.length; j++) {
                const key = `${itemIds[i]},${itemIds[j]}`;
                itemSets.set(key, (itemSets.get(key) || 0) + 1);
            }
        }
    }

    // Filter by minimum support
    const minTransactions = sales.length * minSupport;
    const bundles: { products: string[]; frequency: number }[] = [];

    for (const [key, count] of itemSets.entries()) {
        if (count >= minTransactions) {
            bundles.push({
                products: key.split(','),
                frequency: count
            });
        }
    }

    // Sort by frequency
    return bundles.sort((a, b) => b.frequency - a.frequency);
}

// ============================================================================
// TAX CALCULATIONS
// ============================================================================

export interface TaxCalculation {
    subtotal: number;
    taxAmount: number;
    total: number;
    taxRate: number;
}

/**
 * Calculate tax for a sale
 */
export function calculateTax(
    subtotal: number,
    taxRate: number,
    taxExemptItems: number = 0
): TaxCalculation {
    const taxableAmount = subtotal - taxExemptItems;
    const taxAmount = taxableAmount * (taxRate / 100);
    const total = subtotal + taxAmount;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
        taxRate
    };
}

/**
 * Calculate tax by jurisdiction (for multi-location)
 */
export function calculateTaxByJurisdiction(
    subtotal: number,
    jurisdiction: string
): TaxCalculation {
    // Tax rates by jurisdiction (example)
    const taxRates: Record<string, number> = {
        'ETB': 15,    // Ethiopia VAT
        'KES': 16,    // Kenya VAT
        'UGX': 18,    // Uganda VAT
        'TZS': 18,    // Tanzania VAT
        'USD': 0,     // Export (no tax)
    };

    const taxRate = taxRates[jurisdiction] || 15;
    return calculateTax(subtotal, taxRate);
}
