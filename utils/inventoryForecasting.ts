import { Product, SaleRecord } from '../types';
import { calculateAverageDailySales, calculateReorderPoint } from './inventory';

// ============================================================================
// STOCK FORECASTING
// ============================================================================

/**
 * Forecast demand for next period using simple moving average
 */
export function forecastDemand(
    productId: string,
    salesHistory: SaleRecord[],
    periods: number = 7
): number {
    const recentSales = salesHistory
        .slice(0, periods)
        .map(sale => {
            const item = sale.items.find(i => i.id === productId);
            return item ? item.quantity : 0;
        });

    if (recentSales.length === 0) return 0;

    const average = recentSales.reduce((sum, qty) => sum + qty, 0) / recentSales.length;
    return Math.ceil(average);
}

/**
 * Forecast with trend (Linear regression)
 */
export function forecastWithTrend(
    productId: string,
    salesHistory: SaleRecord[],
    periodsAhead: number = 7
): number {
    const quantities: number[] = [];

    for (let i = 0; i < Math.min(30, salesHistory.length); i++) {
        const sale = salesHistory[i];
        const item = sale.items.find(it => it.id === productId);
        quantities.push(item ? item.quantity : 0);
    }

    if (quantities.length < 2) return quantities[0] || 0;

    // Simple linear regression
    const n = quantities.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = quantities;

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Forecast for future period
    const forecast = slope * (n + periodsAhead) + intercept;
    return Math.max(0, Math.ceil(forecast));
}

// ============================================================================
// ABC ANALYSIS
// ============================================================================

export type ABCClass = 'A' | 'B' | 'C';

export interface ABCAnalysisResult {
    productId: string;
    class: ABCClass;
    value: number;
    percentageOfTotal: number;
    cumulativePercentage: number;
}

/**
 * Perform ABC analysis on products
 * A items: Top 20% of products by value (typically 80% of revenue)
 * B items: Next 30% of products (typically 15% of revenue)
 * C items: Bottom 50% of products (typically 5% of revenue)
 */
export function performABCAnalysis(
    products: Product[],
    salesHistory: SaleRecord[]
): ABCAnalysisResult[] {
    // Calculate value for each product (sales quantity × price)
    const productValues = products.map(product => {
        const totalSold = salesHistory.reduce((sum, sale) => {
            const item = sale.items.find(i => i.id === product.id);
            return sum + (item ? item.quantity : 0);
        }, 0);

        return {
            productId: product.id,
            value: totalSold * product.price
        };
    });

    // Sort by value descending
    productValues.sort((a, b) => b.value - a.value);

    // Calculate total value
    const totalValue = productValues.reduce((sum, pv) => sum + pv.value, 0);

    // Assign ABC classes
    const results: ABCAnalysisResult[] = [];
    let cumulativeValue = 0;

    for (const pv of productValues) {
        cumulativeValue += pv.value;
        const percentageOfTotal = totalValue > 0 ? (pv.value / totalValue) * 100 : 0;
        const cumulativePercentage = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 0;

        let abcClass: ABCClass;
        if (cumulativePercentage <= 80) {
            abcClass = 'A';
        } else if (cumulativePercentage <= 95) {
            abcClass = 'B';
        } else {
            abcClass = 'C';
        }

        results.push({
            productId: pv.productId,
            class: abcClass,
            value: pv.value,
            percentageOfTotal,
            cumulativePercentage
        });
    }

    return results;
}

/**
 * Get ABC class for a single product
 */
export function getABCClass(
    product: Product,
    salesHistory: SaleRecord[],
    totalValue: number
): ABCClass {
    const totalSold = salesHistory.reduce((sum, sale) => {
        const item = sale.items.find(i => i.id === product.id);
        return sum + (item ? item.quantity : 0);
    }, 0);

    const productValue = totalSold * product.price;
    const percentageOfTotal = totalValue > 0 ? (productValue / totalValue) * 100 : 0;

    if (percentageOfTotal >= 5) return 'A';
    if (percentageOfTotal >= 1) return 'B';
    return 'C';
}

// ============================================================================
// CYCLE COUNTING
// ============================================================================

export interface CycleCountSchedule {
    productId: string;
    priority: 'High' | 'Medium' | 'Low';
    nextCountDate: Date;
    frequency: number; // days between counts
}

/**
 * Generate cycle count schedule based on ABC classification
 */
export function generateCycleCountSchedule(
    products: Product[],
    salesHistory: SaleRecord[]
): CycleCountSchedule[] {
    const abcResults = performABCAnalysis(products, salesHistory);
    const now = new Date();
    const schedule: CycleCountSchedule[] = [];

    for (const result of abcResults) {
        let frequency: number;
        let priority: 'High' | 'Medium' | 'Low';

        // A items: Count monthly
        // B items: Count quarterly
        // C items: Count semi-annually
        switch (result.class) {
            case 'A':
                frequency = 30;
                priority = 'High';
                break;
            case 'B':
                frequency = 90;
                priority = 'Medium';
                break;
            case 'C':
                frequency = 180;
                priority = 'Low';
                break;
        }

        const nextCountDate = new Date(now);
        nextCountDate.setDate(nextCountDate.getDate() + frequency);

        schedule.push({
            productId: result.productId,
            priority,
            nextCountDate,
            frequency
        });
    }

    return schedule;
}

// ============================================================================
// STOCK OPTIMIZATION
// ============================================================================

/**
 * Calculate optimal stock level
 */
export function calculateOptimalStock(
    product: Product,
    salesHistory: SaleRecord[],
    leadTimeDays: number = 7,
    serviceLevel: number = 0.95 // 95% service level
): number {
    const dailySales = calculateAverageDailySales(product.id, salesHistory);
    const reorderPoint = calculateReorderPoint(product, salesHistory, leadTimeDays);

    // Calculate standard deviation of demand
    const stdDev = calculateDemandStdDev(product.id, salesHistory);

    // Safety stock = Z-score × StdDev × sqrt(Lead Time)
    const zScore = serviceLevel >= 0.95 ? 1.65 : 1.28; // 95% or 90% service level
    const safetyStock = zScore * stdDev * Math.sqrt(leadTimeDays);

    // Optimal stock = Average demand during lead time + Safety stock
    const optimalStock = (dailySales * leadTimeDays) + safetyStock;

    return Math.ceil(optimalStock);
}

/**
 * Calculate standard deviation of demand
 */
export function calculateDemandStdDev(
    productId: string,
    salesHistory: SaleRecord[],
    days: number = 30
): number {
    const quantities: number[] = [];

    for (let i = 0; i < Math.min(days, salesHistory.length); i++) {
        const sale = salesHistory[i];
        const item = sale.items.find(it => it.id === productId);
        quantities.push(item ? item.quantity : 0);
    }

    if (quantities.length === 0) return 0;

    const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const squaredDiffs = quantities.map(q => Math.pow(q - mean, 2));
    const variance = squaredDiffs.reduce((sum, sd) => sum + sd, 0) / quantities.length;

    return Math.sqrt(variance);
}
