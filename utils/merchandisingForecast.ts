import type { Product, PurchaseOrder, SaleRecord } from '../types';
import type { TransferRecord } from '../types/infrastructure';
import { productOrderUnits } from './productControlLogic';
import { orderCostFromSellUnit } from './productCosts';
import { type ProductSalesMetrics } from './merchandisingAnalytics';

export interface ConsolidatedProductInventory {
    sku: string;
    siteId: string;
    primaryProduct: Product;
    lotProductIds: string[];
    onHand: number;
    expiredStock: number;
    availableStock: number;
    reservedStock: number;
    onOrderStock: number;
    inTransitStock: number;
    effectiveInventory: number;
    minThreshold: number;
}

export interface ForecastDemandPoint {
    period: string;
    actual: number | null;
    predicted: number | null;
    confidenceLow?: number | null;
    confidenceHigh?: number | null;
}

export interface ReplenishmentRecommendation {
    product: Product;
    sku: string;
    siteId: string;
    onHand: number;
    onOrder: number;
    inTransit: number;
    reserved: number;
    effectiveStock: number;
    minThreshold: number;
    leadTimeDays: number;
    safetyStock: number;
    reorderPoint: number;
    dailyRunRate: number;
    predictedDemand30d: number;
    suggestedBuySellable: number;
    packSize: number;
    suggestedBuyPacks: number;
    effectiveOrderedUnits: number;
    unitCost: number;
    orderUnitCost: number;
    totalCost: number;
    costUnrecorded: boolean;
    blockedReason?: string;
    reason: string;
    urgency: 'high' | 'medium' | 'normal';
}

export interface ForecastAnalysisSummary {
    chartData: ForecastDemandPoint[];
    confidencePct: number | null;
    confidenceLabel: string;
    hasSalesData: boolean;
    totalHistoricalSales: number;
    recommendations: ReplenishmentRecommendation[];
    criticalCount: number;
    pipelineCoveredCount: number;
    totalProductsEvaluated: number;
}

/**
 * Consolidates inventory records by SKU and Site across distinct lots/batches (Gap 9),
 * respects configured explicit minStock = 0 (Gap 8), and calculates full pipeline
 * inventory including incoming orders, in-transit transfers, and expiry deductions (Gap 7).
 */
export function consolidateInventoryBySku(
    products: Product[],
    openPOs: PurchaseOrder[] = [],
    openTransfers: TransferRecord[] = [],
    scopedSiteId?: string
): ConsolidatedProductInventory[] {
    const groups = new Map<string, { primary: Product; lots: Product[] }>();

    for (const p of products || []) {
        if (scopedSiteId && p.siteId !== scopedSiteId) continue;
        if (p.status === 'archived' || p.name?.startsWith('Test') || p.sku?.startsWith('TEST')) {
            continue;
        }

        const skuKey = (p.sku || p.id).trim().toUpperCase();
        const siteKey = p.siteId || scopedSiteId || 'default-site';
        const compositeKey = `${skuKey}__${siteKey}`;

        const existing = groups.get(compositeKey);
        if (!existing) {
            groups.set(compositeKey, { primary: p, lots: [p] });
        } else {
            existing.lots.push(p);
            // Prefer an active lot with recorded cost or higher stock as primary
            if (
                (!existing.primary.costPrice && p.costPrice) ||
                (p.stock && p.stock > (existing.primary.stock || 0))
            ) {
                existing.primary = p;
            }
        }
    }

    const now = new Date();
    const consolidatedList: ConsolidatedProductInventory[] = [];

    for (const { primary, lots } of groups.values()) {
        const siteId = primary.siteId || scopedSiteId || '';
        const sku = primary.sku || primary.id;
        const lotProductIds = lots.map(l => l.id);

        let totalOnHand = 0;
        let totalExpired = 0;

        for (const lot of lots) {
            const stockQty = Math.max(0, lot.stock || 0);
            totalOnHand += stockQty;

            if (lot.expiryDate) {
                const expDate = new Date(lot.expiryDate);
                if (!isNaN(expDate.getTime()) && expDate < now) {
                    totalExpired += stockQty;
                }
            }
        }

        const availableStock = Math.max(0, totalOnHand - totalExpired);

        // Gap 8: Explicit minimum of zero is strictly preserved and never coerced to default 15
        const minThreshold = (typeof primary.minStock === 'number' && !isNaN(primary.minStock))
            ? Math.max(0, Math.round(primary.minStock))
            : 0;

        // Gap 7: Calculate On-Order pipeline from open purchase orders
        let onOrderStock = 0;
        const openPoStatuses = new Set(['Approved', 'Ordered', 'Partially Received']);
        for (const po of openPOs) {
            if (!openPoStatuses.has(po.status)) continue;
            if (siteId && po.siteId !== siteId) continue;

            for (const item of po.lineItems || []) {
                const matchesSku = Boolean(sku && item.sku && item.sku.toUpperCase() === sku.toUpperCase());
                const matchesId = item.productId ? lotProductIds.includes(item.productId) : false;
                if (matchesSku || matchesId) {
                    const orderedUnits = Math.max(0, item.quantity || 0);
                    const packMult = productOrderUnits({ ...primary, ...item, customAttributes: item.customAttributes || { packaging: { packQty: item.packQuantity || 1, caseSize: item.caseSize || 0 } } } as Product);
                    onOrderStock += Math.max(0, orderedUnits * packMult - (item.receivedQty || 0));
                }
            }
        }

        // Gap 7: Calculate In-Transit pipeline from active incoming transfers
        let inTransitStock = 0;
        const activeTransferStatuses = new Set([
            'Shipped', 'Dispatched', 'In-Transit'
        ]);
        for (const transfer of openTransfers) {
            if (!activeTransferStatuses.has(transfer.status || (transfer as any).transferStatus)) continue;
            if (siteId && transfer.destSiteId !== siteId) continue;

            for (const item of transfer.items || []) {
                const matchesSku = Boolean(sku && item.sku && item.sku.toUpperCase() === sku.toUpperCase());
                const matchesId = item.productId ? lotProductIds.includes(item.productId) : false;
                if (matchesSku || matchesId) {
                    const remaining = Math.max(0, (item.quantity || 0) - (item.receivedQty || 0));
                    inTransitStock += remaining;
                }
            }
        }

        const reservedStock = lots.reduce((sum, lot) => sum + Math.max(0, Number(lot.customAttributes?.reserved) || 0), 0);
        const effectiveInventory = (availableStock - reservedStock) + onOrderStock + inTransitStock;

        consolidatedList.push({
            sku,
            siteId,
            primaryProduct: primary,
            lotProductIds,
            onHand: Math.round(totalOnHand),
            expiredStock: Math.round(totalExpired),
            availableStock: Math.round(availableStock),
            reservedStock: Math.round(reservedStock),
            onOrderStock: Math.round(onOrderStock),
            inTransitStock: Math.round(inTransitStock),
            effectiveInventory: Math.round(effectiveInventory),
            minThreshold
        });
    }

    return consolidatedList;
}

/**
 * Computes actual 4-week historical demand from completed sales records (Gap 1).
 */
export function computeWeeklyDemand(
    salesHistory: SaleRecord[],
    siteId?: string,
    countryCode?: string,
    now = new Date()
): { weeklyActuals: number[]; totalSales: number } {
    const msWeek = 7 * 24 * 60 * 60 * 1000;
    const nowMs = now.getTime();
    const weeklyActuals = [0, 0, 0, 0]; // [W1 (oldest: 22-28d), W2 (15-21d), W3 (8-14d), W4 (1-7d)]
    let totalSales = 0;

    for (const sale of salesHistory || []) {
        if (sale.status !== 'Completed') continue;

        // Border and Site isolation
        const sCountry = sale.countryCode || (sale as any).country_code || (sale as any).country;
        if (countryCode && sCountry && countryCode.toUpperCase() !== sCountry.toUpperCase()) continue;

        const sSiteId = sale.siteId || (sale as any).site_id;
        if (siteId && siteId !== sSiteId) continue;

        const saleDate = new Date(sale.date || (sale as any).createdAt || (sale as any).created_at || 0).getTime();
        const ageMs = nowMs - saleDate;

        if (!Number.isFinite(saleDate) || ageMs < 0 || ageMs >= 4 * msWeek) continue;

        const weekIndexFromNow = Math.floor(ageMs / msWeek); // 0 = 0-7d, 1 = 8-14d, 2 = 15-21d, 3 = 22-28d
        if (weekIndexFromNow >= 0 && weekIndexFromNow < 4) {
            const chartIndex = 3 - weekIndexFromNow; // 0 = oldest (W1), 3 = most recent (W4)
            for (const item of sale.items || []) {
                const qty = Number(item.quantity);
                if (!Number.isFinite(qty) || qty <= 0) continue;
                weeklyActuals[chartIndex] += qty;
                totalSales += qty;
            }
        }
    }

    return { weeklyActuals: weeklyActuals.map(Math.round), totalSales: Math.round(totalSales) };
}

/**
 * Builds a descriptive weekly-average baseline; predictive accuracy has not been measured.
 * Strictly avoids synthetic multipliers based on inventory stock.
 */
export function generateDemandChartData(
    weeklyActuals: number[],
    totalSales: number,
    asOf = new Date()
): { chartData: ForecastDemandPoint[]; confidencePct: number | null; confidenceLabel: string } {
    const label = (index: number) => {
        const date = new Date(asOf.getTime() + (index - 4) * 7 * 86400000);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };
    if (totalSales === 0) {
        return {
            chartData: [
                { period: label(1), actual: 0, predicted: null },
                { period: label(2), actual: 0, predicted: null },
                { period: label(3), actual: 0, predicted: null },
                { period: label(4), actual: 0, predicted: null },
                { period: label(5), actual: null, predicted: null },
                { period: label(6), actual: null, predicted: null },
                { period: label(7), actual: null, predicted: null },
                { period: label(8), actual: null, predicted: null }
            ],
            confidencePct: null,
            confidenceLabel: 'No POS History'
        };
    }

    const mean = weeklyActuals.reduce((a, b) => a + b, 0) / weeklyActuals.length;
    // Four observations cannot establish predictive accuracy. Use a transparent baseline.
    return {
        chartData: [
            ...weeklyActuals.map((actual, i) => ({ period: label(i + 1), actual, predicted: null })),
            ...Array.from({ length: 4 }, (_, i) => ({ period: label(i + 5), actual: null, predicted: Math.round(mean) })),
        ],
        confidencePct: null,
        confidenceLabel: 'Baseline · accuracy not validated',
    };
}

/**
 * Builds replenishment recommendations based on real demand, pipeline orders,
 * lead time, MOQs, and accurate pack conversion (Gap 5, 6, 7, 8, 9, 12).
 */
export function buildReplenishmentQueue(
    consolidatedItems: ConsolidatedProductInventory[],
    salesMetricsIndex: Map<string, ProductSalesMetrics>
): ReplenishmentRecommendation[] {
    const recommendations: ReplenishmentRecommendation[] = [];

    for (const item of consolidatedItems) {
        const { primaryProduct: p, onHand, onOrderStock, inTransitStock, reservedStock, effectiveInventory, minThreshold } = item;
        const metrics = salesMetricsIndex.get(p.id);

        const runRate = (metrics?.unitsSold30d || 0) / 30;
        const unitsSold30d = metrics?.unitsSold30d || 0;
        const leadTimeDays = Math.max(0, Math.round(p.customAttributes?.logistics?.leadTimeDays || 0));
        const leadTimeDemand = Math.round(runRate * leadTimeDays);

        const safetyStock = minThreshold;
        const reorderPoint = Math.max(minThreshold, leadTimeDemand);
        const predictedDemand30d = Math.round(unitsSold30d);
        let targetInventory = Math.max(minThreshold, predictedDemand30d + leadTimeDemand);
        if (p.maxStock !== undefined && p.maxStock > 0) targetInventory = Math.min(targetInventory, p.maxStock);

        // Calculate replenish deficit based on effective net inventory
        let deficit = 0;
        if (effectiveInventory < targetInventory) {
            deficit = Math.max(0, targetInventory - effectiveInventory);
        }

        // Apply Minimum Order Quantity (MOQ)
        const moq = Math.max(0, Math.round(p.customAttributes?.procurement?.moq || 0));
        let suggestedBuySellable = deficit > 0 ? (moq > 0 ? Math.max(moq, deficit) : deficit) : 0;

        // Merchandising Whole-Number Rule
        suggestedBuySellable = Math.round(suggestedBuySellable);

        if (suggestedBuySellable <= 0) continue;

        // Gap 5: Calculate pack multipliers accurately for PO creation
        const packSize = productOrderUnits(p);
        if (!Number.isFinite(packSize) || packSize <= 0) continue;
        const suggestedBuyPacks = Math.ceil(suggestedBuySellable / packSize);
        const effectiveOrderedUnits = Math.round(suggestedBuyPacks * packSize);
        const blockedReason = p.maxStock !== undefined && p.maxStock > 0 && effectiveInventory + effectiveOrderedUnits > p.maxStock
            ? 'Supplier pack or minimum order would exceed the recorded maximum stock. Review policy before ordering.' : undefined;

        // Gap 6: Unsupported cost guessing (70% or 50) is strictly eliminated
        const unitCost = (typeof p.costPrice === 'number' && p.costPrice > 0) ? p.costPrice : 0;
        const costUnrecorded = unitCost === 0;
        const orderUnitCost = orderCostFromSellUnit(unitCost, packSize);
        const totalCost = Math.round(suggestedBuyPacks * orderUnitCost * 100) / 100;

        // Gap 12: Factual reasoning based strictly on observed data
        let reason = '';
        let urgency: 'high' | 'medium' | 'normal' = 'normal';

        if (onHand <= minThreshold) {
            reason = `Below Min Stock (${onHand} on hand vs ${minThreshold} min)`;
            urgency = 'high';
        } else if (effectiveInventory <= reorderPoint) {
            reason = `Pipeline Deficit (Net Stock ${effectiveInventory} vs ${reorderPoint} ROP)`;
            urgency = 'high';
        } else if (metrics?.effectiveVelocity === 'High') {
            reason = `High POS Velocity (${unitsSold30d} sold / 30d, ${metrics.daysOfSupply}d supply left)`;
            urgency = 'medium';
        } else {
            reason = `Buffer Replenishment (Target ${targetInventory}, Net ${effectiveInventory})`;
            urgency = 'normal';
        }

        recommendations.push({
            product: p,
            sku: item.sku,
            siteId: item.siteId,
            onHand,
            onOrder: onOrderStock,
            inTransit: inTransitStock,
            reserved: reservedStock,
            effectiveStock: effectiveInventory,
            minThreshold,
            leadTimeDays,
            safetyStock,
            reorderPoint,
            dailyRunRate: runRate,
            predictedDemand30d,
            suggestedBuySellable,
            packSize,
            suggestedBuyPacks,
            effectiveOrderedUnits,
            unitCost,
            orderUnitCost,
            totalCost,
            costUnrecorded,
            blockedReason,
            reason,
            urgency
        });
    }

    // Sort by urgency, then lowest effective stock ratio
    return recommendations.sort((a, b) => {
        const uA = a.urgency === 'high' ? 2 : a.urgency === 'medium' ? 1 : 0;
        const uB = b.urgency === 'high' ? 2 : b.urgency === 'medium' ? 1 : 0;
        if (uA !== uB) return uB - uA;
        return a.effectiveStock - b.effectiveStock;
    });
}
