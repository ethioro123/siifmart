import type { Product, PricingRule } from '../../../types';
import type { ProductSalesMetrics } from '../../../utils/merchandisingAnalytics';
import { effectivePrice } from '../../../utils/pricingGovernance';
import { rulePriceProposal } from './ruleProposal';
import { matchRuleProduct } from './ruleEvaluator';

export interface SimulationResult {
   rev: number;
   margin: number | null;
   profitChange: number;
   invalidPrices: number;
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
   let invalidPrices = 0;

   simProducts.forEach(p => {
      const cost = p.costPrice;
      if (cost === undefined || cost <= 0) return;

      const estSales = salesMetricsIndex.get(p.id)?.unitsSold30d ?? p.unitsSold30d;
      if (estSales === undefined || !Number.isFinite(estSales) || estSales < 0) return;

      const currentPrice = effectivePrice(p) ?? p.price;
      const currentRev = Math.round(currentPrice * estSales);
      const currentMarg = Math.round((currentPrice - cost) * estSales);

      totalCurrentRevenue += currentRev;
      totalCurrentMargin += currentMarg;

      const matchingRule = activeRules.filter(rule => rule.isActive).find(r => matchRuleProduct(p, r, { sales30d: estSales }));
      let newPrice = currentPrice;
      if (matchingRule) {
         try {
            const proposal = rulePriceProposal(p, matchingRule);
            newPrice = effectivePrice(proposal) ?? proposal.price;
            if (newPrice !== currentPrice) impactedCount++;
         } catch {
            invalidPrices++;
         }
      }
      totalProjectedRevenue += Math.round(newPrice * estSales);
      totalProjectedMargin += Math.round((newPrice - cost) * estSales);
   });

   // Merchandising Whole-Number Rule: Delta percentages rounded strictly to integers
   const revDeltaPct = totalCurrentRevenue > 0
      ? Math.round(((totalProjectedRevenue - totalCurrentRevenue) / totalCurrentRevenue) * 100)
      : 0;
   const margDeltaPct = totalCurrentMargin > 0
      ? Math.round(((totalProjectedMargin - totalCurrentMargin) / totalCurrentMargin) * 100)
      : null;

   return {
      rev: revDeltaPct,
      margin: margDeltaPct,
      profitChange: Math.round(totalProjectedMargin - totalCurrentMargin),
      invalidPrices,
      impactedCount
   };
}
