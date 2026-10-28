import type { Product } from '../types';
import type { ForecastSnapshot } from '../services/merchandising-forecast.service';
import type { ProductSalesMetrics } from './merchandisingAnalytics';
import { consolidateInventoryBySku, buildReplenishmentQueue } from './merchandisingForecast';
import { productOrderUnits } from './productControlLogic';
const key = (sku: string) => sku.trim().toUpperCase();

/** Consume server aggregates from one snapshot. No receipt details or personal data. */
export function analyzeForecastSnapshot(snapshot: ForecastSnapshot) {
    const consolidated = consolidateInventoryBySku(snapshot.products, [], [], undefined, new Date(snapshot.asOf));
    const metrics = new Map<string, ProductSalesMetrics>();
    const weeklyActuals = [0, 0, 0, 0];
    const uncertain = new Set<string>();
    const pipelineReview = new Set(snapshot.awaitingSkus.map(key));
    for (const bucket of snapshot.demand) {
        if (bucket.refund_uncertain) uncertain.add(key(bucket.sku));
        if (bucket.age_days < 28 && bucket.age_days >= 0) weeklyActuals[3 - Math.floor(bucket.age_days / 7)] += bucket.units;
    }
    for (const item of consolidated) {
        const buckets = snapshot.demand.filter(bucket => key(bucket.sku) === key(item.sku));
        const units30 = Math.round(buckets.reduce((sum, bucket) => sum + bucket.units, 0));
        const units7 = Math.round(buckets.filter(bucket => bucket.age_days < 7).reduce((sum, bucket) => sum + bucket.units, 0));
        // Ratios are transient only; all exposed merchandising metrics and quantities are integers.
        const daysOfSupply = units30 ? Math.round(Math.max(0, item.availableStock - item.reservedStock) * 30 / units30) : 999;
        const stockoutDate = Date.parse(snapshot.asOf) + Math.min(30, daysOfSupply) * 86400000;
        let confirmed = 0;
        for (const incoming of snapshot.incoming.filter(bucket => key(bucket.sku) === key(item.sku))) {
            const conversion = productOrderUnits({ ...item.primaryProduct, unit: incoming.unit, size: incoming.size,
                packQuantity: incoming.pack_quantity, caseSize: incoming.case_size, customAttributes: incoming.custom_attributes || undefined } as Product);
            const remaining = Math.max(0, Math.round(incoming.order_quantity * conversion - incoming.received_units));
            if (!remaining) continue;
            const arrival = incoming.expected_delivery ? Date.parse(`${incoming.expected_delivery}T23:59:59Z`) : NaN;
            if (Number.isFinite(arrival) && arrival >= Date.parse(snapshot.asOf) && arrival <= stockoutDate) confirmed += remaining;
            else pipelineReview.add(key(item.sku));
        }
        item.onOrderStock = confirmed;
        item.effectiveInventory += confirmed;
        metrics.set(item.primaryProduct.id, {
            productId: item.primaryProduct.id, unitsSold7d: units7, unitsSold30d: units30, revenue30d: 0,
            dailyRunRate: Math.round(units30 / 30), daysOfSupply, effectiveVelocity: units30 >= 40 ? 'High' : units30 >= 10 ? 'Medium' : 'Low',
            hasOrderHistory: units30 > 0, stockoutRisk: units30 > 0 && daysOfSupply < 7, needsMarkdown: false,
        });
    }
    const recommendations = buildReplenishmentQueue(consolidated, metrics);
    for (const item of consolidated) {
        const sku = key(item.sku);
        const reasons = [item.policyConflict, uncertain.has(sku) ? 'Refunded receipts lack net returned quantities. Demand is incomplete; reconcile returns before ordering.' : undefined,
            pipelineReview.has(sku) ? 'An existing transfer or purchase order has unverified, overdue or late arrival timing. Review it before ordering again.' : undefined].filter(Boolean);
        if (!reasons.length) continue;
        let recommendation = recommendations.find(row => key(row.sku) === sku);
        if (!recommendation) {
            // Keep unresolved products visible even when incomplete evidence produces no buying deficit.
            recommendation = buildReplenishmentQueue([{ ...item, effectiveInventory: -1 }], metrics)[0];
            if (!recommendation) continue;
            recommendation.suggestedBuySellable = 0; recommendation.suggestedBuyPacks = 0;
            recommendation.effectiveOrderedUnits = 0; recommendation.totalCost = 0;
            recommendations.push(recommendation);
        }
        recommendation.blockedReason = [...reasons, recommendation.blockedReason].filter(Boolean).join(' ');
    }
    return { consolidated, recommendations, weeklyActuals: weeklyActuals.map(Math.round), totalSales: Math.round(weeklyActuals.reduce((a, b) => a + b, 0)), uncertainCount: uncertain.size };
}
