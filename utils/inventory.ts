
/**
 * Advanced Inventory Management Utilities
 * FEFO, Reorder Points, Stock Forecasting, ABC Analysis
 */

import { Product, SaleRecord, CartItem, StockMovement } from '../types';

// ============================================================================
// BATCH & EXPIRY MANAGEMENT (FEFO)
// ============================================================================

export interface Batch {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    productId: string;
}

/**
 * Select batches using FEFO (First Expired, First Out) logic
 * Returns array of batches to pick from, prioritizing earliest expiry
 */
export function selectBatchesFEFO(
    productId: string,
    quantityNeeded: number,
    allBatches: Batch[]
): { batchNumber: string; quantity: number }[] {
    // Filter batches for this product
    const productBatches = allBatches.filter(b => b.productId === productId);

    // Sort by expiry date (earliest first)
    const sortedBatches = [...productBatches].sort((a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    const selected: { batchNumber: string; quantity: number }[] = [];
    let remaining = quantityNeeded;

    for (const batch of sortedBatches) {
        if (remaining <= 0) break;

        const takeQty = Math.min(batch.quantity, remaining);
        selected.push({
            batchNumber: batch.batchNumber,
            quantity: takeQty
        });
        remaining -= takeQty;
    }

    return selected;
}

/**
 * Get expiry alerts categorized by urgency
 */
export function getExpiryAlerts(
    products: Product[]
): { urgent: Product[]; warning: Product[]; info: Product[] } {
    const now = new Date();
    const urgent: Product[] = [];
    const warning: Product[] = [];
    const info: Product[] = [];

    for (const product of products) {
        if (!product.expiryDate) continue;

        const expiryDate = new Date(product.expiryDate);
        const daysUntilExpiry = Math.floor(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 1) {
            urgent.push(product); // Expires today or tomorrow
        } else if (daysUntilExpiry <= 7) {
            warning.push(product); // Expires within a week
        } else if (daysUntilExpiry <= 30) {
            info.push(product); // Expires within a month
        }
    }

    return { urgent, warning, info };
}

/**
 * Check if product is expired
 */
export function isExpired(product: Product): boolean {
    if (!product.expiryDate) return false;
    return new Date(product.expiryDate) < new Date();
}

// ============================================================================
// REORDER POINT CALCULATION
// ============================================================================

/**
 * Calculate reorder point for a product
 * Formula: (Average Daily Sales × Lead Time) + Safety Stock
 */
export function calculateReorderPoint(
    product: Product,
    salesHistory: SaleRecord[],
    leadTimeDays: number = 7,
    safetyStockDays: number = 3
): number {
    // Calculate average daily sales
    const dailySales = calculateAverageDailySales(product.id, salesHistory);

    // Reorder Point = (Average Daily Sales × Lead Time) + Safety Stock
    const reorderPoint = (dailySales * leadTimeDays) + (dailySales * safetyStockDays);

    return Math.ceil(reorderPoint);
}

/**
 * Calculate average daily sales for a product
 */
export function calculateAverageDailySales(
    productId: string,
    salesHistory: SaleRecord[],
    days: number = 30
): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevantSales = salesHistory.filter(sale =>
        new Date(sale.date) >= cutoffDate
    );

    let totalQuantity = 0;
    for (const sale of relevantSales) {
        const item = sale.items.find(i => i.id === productId);
        if (item) totalQuantity += item.quantity;
    }

    return totalQuantity / days;
}

/**
 * Check if product should be reordered
 */
export function shouldReorder(product: Product, reorderPoint: number): boolean {
    return product.stock <= reorderPoint;
}

/**
 * Calculate optimal order quantity (Economic Order Quantity - EOQ)
 */
export function calculateEOQ(
    annualDemand: number,
    orderingCost: number,
    holdingCostPerUnit: number
): number {
    if (holdingCostPerUnit === 0) return 0;

    // EOQ = sqrt((2 × Annual Demand × Ordering Cost) / Holding Cost per Unit)
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
    return Math.ceil(eoq);
}

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
// DEAD STOCK IDENTIFICATION
// ============================================================================

export interface DeadStockItem {
    product: Product;
    daysSinceLastSale: number;
    stockValue: number;
}

/**
 * Identify dead stock (products not sold in X days)
 */
export function identifyDeadStock(
    products: Product[],
    salesHistory: SaleRecord[],
    daysThreshold: number = 90
): DeadStockItem[] {
    const now = new Date();
    const deadStock: DeadStockItem[] = [];

    for (const product of products) {
        // Find last sale of this product
        let lastSaleDate: Date | null = null;

        for (const sale of salesHistory) {
            const item = sale.items.find(i => i.id === product.id);
            if (item) {
                const saleDate = new Date(sale.date);
                if (!lastSaleDate || saleDate > lastSaleDate) {
                    lastSaleDate = saleDate;
                }
            }
        }

        // Calculate days since last sale
        const daysSinceLastSale = lastSaleDate
            ? Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
            : Infinity;

        // If no sales in threshold period, mark as dead stock
        if (daysSinceLastSale >= daysThreshold && product.stock > 0) {
            deadStock.push({
                product,
                daysSinceLastSale,
                stockValue: product.stock * (product.costPrice || product.price)
            });
        }
    }

    // Sort by stock value descending
    return deadStock.sort((a, b) => b.stockValue - a.stockValue);
}

// ============================================================================
// STOCK VELOCITY ANALYSIS
// ============================================================================

export type StockVelocity = 'High' | 'Medium' | 'Low';

/**
 * Calculate stock velocity (how fast product sells)
 */
export function calculateStockVelocity(
    product: Product,
    salesHistory: SaleRecord[],
    days: number = 30
): StockVelocity {
    const dailySales = calculateAverageDailySales(product.id, salesHistory, days);

    // Calculate turnover rate
    const turnoverRate = product.stock > 0 ? dailySales / product.stock : 0;

    // Classify velocity
    if (turnoverRate >= 0.1) return 'High';   // Sells 10%+ of stock daily
    if (turnoverRate >= 0.03) return 'Medium'; // Sells 3-10% of stock daily
    return 'Low';                               // Sells <3% of stock daily
}

/**
 * Calculate days of inventory remaining
 */
export function calculateDaysOfInventory(
    product: Product,
    salesHistory: SaleRecord[]
): number {
    const dailySales = calculateAverageDailySales(product.id, salesHistory);

    if (dailySales === 0) return Infinity;

    return Math.ceil(product.stock / dailySales);
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
function calculateDemandStdDev(
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
