import type { Product } from '../types';
import type { ProductSalesMetrics } from './merchandisingAnalytics';

export interface GlidePathStage {
    stageIndex: number;
    week: string; // e.g. "Week 1", "Week 2"
    dateRangeLabel: string; // e.g. "Oct 28 - Nov 04"
    openingStock: number;
    projectedSales: number;
    closingStock: number;
    stock: number; // Consistently closingStock for plotting drawdown
    price: number; // Whole number integer (cost-capped)
    targetDiscountPct: number;
    actualDiscountPct: number; // Whole number integer based on effective price
    discount: string; // e.g. "10%"
    stageRevenue: number; // Whole number integer
    revenue: number; // Cumulative revenue (whole number integer)
}

export interface MarkdownValidationResult {
    isValid: boolean;
    missingFields: string[];
    reasons: string[];
    hasZeroVelocity: boolean;
}

export interface MarkdownGlidePathSimulation {
    stages: GlidePathStage[];
    initialStock: number;
    totalProjectedSales: number;
    finalRemainingStock: number;
    isFullyCleared: boolean;
    clearancePercentage: number; // Integer: Math.round((totalProjectedSales / initialStock) * 100)
    projectedTotalRevenue: number;
    totalLandedCost: number;
    projectedMarginPct: number; // Integer: Math.round(...)
    durationDays: number;
    numStages: number;
}

/**
 * Validates whether a product has verified stock, landed cost (COGS),
 * retail price, and sales velocity data for markdown modeling.
 */
export const validateMarkdownProduct = (
    product: Product | null,
    metrics?: ProductSalesMetrics | null
): MarkdownValidationResult => {
    if (!product) {
        return {
            isValid: false,
            missingFields: ['product'],
            reasons: ['No product selected.'],
            hasZeroVelocity: false
        };
    }

    const missingFields: string[] = [];
    const reasons: string[] = [];

    // Verified stock
    if (product.stock === undefined || product.stock === null || product.stock <= 0) {
        missingFields.push('stock');
        reasons.push('Zero physical stock on hand. Clearance schedule requires on-hand inventory > 0.');
    }

    // Verified landed cost (COGS)
    if (product.costPrice === undefined || product.costPrice === null || product.costPrice <= 0) {
        missingFields.push('costPrice');
        reasons.push('Missing verified landed cost (COGS). Landed cost from purchase orders is required to protect break-even margins.');
    }

    // Verified retail price
    if (!product.price || product.price <= 0) {
        missingFields.push('price');
        reasons.push('Retail price is unrecorded or invalid.');
    }

    if (product.costPrice && product.price && product.costPrice > product.price) {
        reasons.push('Landed cost exceeds current retail price; pricing is already below break-even.');
    }

    const hasZeroVelocity = !metrics || metrics.dailyRunRate <= 0;

    return {
        isValid: missingFields.length === 0,
        missingFields,
        reasons,
        hasZeroVelocity
    };
};

/**
 * Validates the target exit date: must be present and in the future.
 */
export const validateTargetExitDate = (
    targetExitDate: string,
    now: Date = new Date()
): { isValid: boolean; durationDays: number; errorReason?: string } => {
    if (!targetExitDate || !targetExitDate.trim()) {
        return {
            isValid: false,
            durationDays: 0,
            errorReason: 'Please select a target exit date.'
        };
    }

    const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetDate = new Date(targetExitDate);
    const targetMs = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();

    if (isNaN(targetMs)) {
        return {
            isValid: false,
            durationDays: 0,
            errorReason: 'Invalid date format.'
        };
    }

    const diffDays = Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        return {
            isValid: false,
            durationDays: 0,
            errorReason: 'Target exit date must be in the future (minimum 1 day).'
        };
    }

    return {
        isValid: true,
        durationDays: diffDays
    };
};

/**
 * Calculates a verified clearance glide path with consistent opening stock,
 * projected sales, closing stock, cost-capped actual discounts, and rounded whole numbers.
 */
export const calculateMarkdownGlidePath = (params: {
    product: Product;
    targetExitDate: string;
    metrics?: ProductSalesMetrics | null;
    now?: Date;
}): MarkdownGlidePathSimulation | null => {
    const { product, targetExitDate, metrics, now = new Date() } = params;

    const prodValidation = validateMarkdownProduct(product, metrics);
    if (!prodValidation.isValid) return null;

    const dateValidation = validateTargetExitDate(targetExitDate, now);
    if (!dateValidation.isValid) return null;

    const durationDays = dateValidation.durationDays;
    const initialStock = Math.round(product.stock);
    const retailPrice = Math.round(product.price);
    const costPrice = Math.round(product.costPrice || 0);

    // Dynamic stage calculation from deadline
    let numStages: number;
    let stageDurationDays: number;

    if (durationDays <= 7) {
        numStages = Math.max(2, durationDays);
        stageDurationDays = durationDays / numStages;
    } else {
        numStages = Math.max(2, Math.min(8, Math.round(durationDays / 7)));
        stageDurationDays = durationDays / numStages;
    }

    const nominalDiscounts = [0, 10, 20, 35, 50, 60, 70, 75];
    const stages: GlidePathStage[] = [];

    let currentOpeningStock = initialStock;
    let cumulativeRevenue = 0;
    const dailyRunRate = metrics?.dailyRunRate && metrics.dailyRunRate > 0 ? metrics.dailyRunRate : 0;

    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let i = 0; i < numStages; i++) {
        const targetDiscountPct = nominalDiscounts[i] ?? Math.min(50, Math.round((i / (numStages - 1)) * 50));

        // Price calculation: cannot go below landed cost (COGS)
        const unconstrainedPrice = Math.round(retailPrice * (1 - (targetDiscountPct / 100)));
        const effectivePrice = Math.max(costPrice, unconstrainedPrice);

        // Actual discount reflects cost floor
        const actualDiscountPct = Math.round(((retailPrice - effectivePrice) / retailPrice) * 100);

        // Date range calculation
        const stageStartDays = Math.round(i * stageDurationDays);
        const stageEndDays = Math.round((i + 1) * stageDurationDays);
        const stageStartDate = new Date(startDate.getTime() + stageStartDays * 86400000);
        const stageEndDate = new Date(startDate.getTime() + stageEndDays * 86400000);

        const formatDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const dateRangeLabel = `${formatDate(stageStartDate)} - ${formatDate(stageEndDate)}`;

        // Demand estimation: baseline velocity scaled by price concession depth
        const velocityMultiplier = actualDiscountPct > 0 ? 1 + (actualDiscountPct / 100) * 1.5 : 1;
        const projectedDailySales = dailyRunRate * velocityMultiplier;
        const expectedDemand = Math.round(projectedDailySales * stageDurationDays);

        // Actual stage sales cannot exceed current on-hand stock
        const projectedSales = Math.min(currentOpeningStock, Math.max(0, expectedDemand));
        const closingStock = currentOpeningStock - projectedSales;
        const stageRevenue = Math.round(projectedSales * effectivePrice);
        cumulativeRevenue += stageRevenue;

        stages.push({
            stageIndex: i,
            week: durationDays <= 7 ? `Day ${i + 1}` : `Week ${i + 1}`,
            dateRangeLabel,
            openingStock: currentOpeningStock,
            projectedSales,
            closingStock,
            stock: closingStock,
            price: effectivePrice,
            targetDiscountPct,
            actualDiscountPct,
            discount: `${actualDiscountPct}%`,
            stageRevenue,
            revenue: cumulativeRevenue
        });

        currentOpeningStock = closingStock;
    }

    const finalRemainingStock = currentOpeningStock;
    const totalProjectedSales = initialStock - finalRemainingStock;
    const isFullyCleared = finalRemainingStock === 0;
    const clearancePercentage = initialStock > 0 ? Math.round((totalProjectedSales / initialStock) * 100) : 0;
    const projectedTotalRevenue = cumulativeRevenue;
    const totalLandedCost = Math.round(totalProjectedSales * costPrice);
    const projectedMarginPct = projectedTotalRevenue > 0
        ? Math.round(((projectedTotalRevenue - totalLandedCost) / projectedTotalRevenue) * 100)
        : 0;

    return {
        stages,
        initialStock,
        totalProjectedSales,
        finalRemainingStock,
        isFullyCleared,
        clearancePercentage,
        projectedTotalRevenue,
        totalLandedCost,
        projectedMarginPct,
        durationDays,
        numStages
    };
};
