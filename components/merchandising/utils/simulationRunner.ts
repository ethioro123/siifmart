import type { Product, PricingRule } from '../../../types';
import type { ProductSalesMetrics } from '../../../utils/merchandisingAnalytics';
import { matchRuleProduct, calculateRulePrice } from './ruleEvaluator';

export interface SimulationResult {
   rev: number;
   margin: number;
   impactedCount: number;
}

export function runMerchandisingSimulation(
   simProducts: Product[],
   activeRules: PricingRule[],
   salesMetricsIndex: Map<string, ProductSalesMetrics>
): SimulationResult {
   let totalCurrentRevenue = 0;
   let totalProjectedRevenue = 0;
   let totalCurrentMargin = 0;
   let totalProjectedMargin = 0;
   let impactedCount = 0;

   simProducts.forEach(p => {
      const cost = p.costPrice;
      if (cost === undefined || cost <= 0) return;

      const estSales = salesMetricsIndex.get(p.id)?.unitsSold30d ?? p.unitsSold30d;
      if (estSales === undefined || !Number.isFinite(estSales) || estSales < 0) return;

      const currentRev = Math.round(p.price * estSales);
      const currentMarg = Math.round((p.price - cost) * estSales);

      totalCurrentRevenue += currentRev;
      totalCurrentMargin += currentMarg;

      const matchingRule = activeRules.filter(rule => rule.isActive).find(r => matchRuleProduct(p, r, { sales30d: estSales }));
      if (matchingRule) {
         impactedCount++;
         const newPrice = Math.round(calculateRulePrice(p, matchingRule));
         const elasticityFactor = 1; // Constant-volume scenario, not a demand forecast.
         const projectedSales = Math.round(estSales * elasticityFactor);
         const projRev = Math.round(newPrice * projectedSales);
         const projMarg = Math.round((newPrice - cost) * projectedSales);
         totalProjectedRevenue += projRev;
         totalProjectedMargin += projMarg;
      } else {
         totalProjectedRevenue += currentRev;
         totalProjectedMargin += currentMarg;
      }
   });

   // Merchandising Whole-Number Rule: Delta percentages rounded strictly to integers
   const revDeltaPct = totalCurrentRevenue > 0
      ? Math.round(((totalProjectedRevenue - totalCurrentRevenue) / totalCurrentRevenue) * 100)
      : 0;
   const margDeltaPct = totalCurrentMargin > 0
      ? Math.round(((totalProjectedMargin - totalCurrentMargin) / totalCurrentMargin) * 100)
      : 0;

   return {
      rev: revDeltaPct,
      margin: margDeltaPct,
      impactedCount
   };
}
