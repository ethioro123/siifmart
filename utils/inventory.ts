
/**
 * Advanced Inventory Management Utilities
 * FEFO, Reorder Points, Stock Forecasting, ABC Analysis
 */
import { Product, SaleRecord, CartItem, StockMovement } from '../types';

export * from './inventoryForecasting';

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


