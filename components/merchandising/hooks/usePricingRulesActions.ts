import { useState } from 'react';
import type { Country } from '../../../utils/localization';
import type { Product, PricingRule } from '../../../types';
import type { PriceChangeInput } from '../../../hooks/useSubmitPriceChanges';
import type { ProductSalesMetrics } from '../../../utils/merchandisingAnalytics';
import { priceManagerService } from '../../../services/price-manager.service';
import { pricingRulesService } from '../../../services/pricing-rules.service';
import { matchRuleProduct, calculateRulePrice, validatePricingRule } from '../utils/ruleEvaluator';
import { logger } from '../../../utils/logger';

interface PricingRulesActionsProps {
   activeCountry: Country;
   activeRegionCode?: string;
   sites: Array<{ id: string }>;
   salesMetricsIndex: Map<string, ProductSalesMetrics>;
   createRule: { mutateAsync: (rule: Omit<PricingRule, 'id'>) => Promise<PricingRule>; isPending: boolean };
   toggleRule: { mutate: (payload: { id: string; isActive: boolean }) => void };
   deleteRule: { mutate: (id: string) => void };
   pricingRules: PricingRule[];
   batch: {
      stagePriceBatch: (changes: PriceChangeInput[], reason: string) => void;
   };
   setIsSubmitting: (sub: boolean) => void;
   addNotification: (type: 'info' | 'alert' | 'success', message: string) => void;
}

export function usePricingRulesActions({
   activeCountry,
   activeRegionCode,
   sites,
   salesMetricsIndex,
   createRule,
   toggleRule,
   deleteRule,
   pricingRules,
   batch,
   setIsSubmitting,
   addNotification
}: PricingRulesActionsProps) {
   const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
   const [newRule, setNewRule] = useState<Partial<PricingRule>>({
      targetCategory: 'Fresh Produce',
      condition: 'Stock > X',
      threshold: 50,
      action: 'Decrease Price %',
      value: 10,
      isActive: true
   });
   const [ruleValidationErrors, setRuleValidationErrors] = useState<Record<string, string>>({});
   const [simResult, setSimResult] = useState<{ rev: number; margin: number } | null>(null);
   const [isSimulating, setIsSimulating] = useState(false);

   const handleCreateRule = async () => {
      const validation = validatePricingRule(newRule);
      if (!validation.isValid) {
         setRuleValidationErrors(validation.errors);
         addNotification('alert', 'Please fix validation errors before saving rule.');
         return;
      }
      setRuleValidationErrors({});

      try {
         await createRule.mutateAsync({
            name: (newRule.name || '').trim(),
            targetCategory: newRule.targetCategory || 'Fresh Produce',
            condition: newRule.condition || 'Stock > X',
            threshold: Math.round(Number(newRule.threshold) || 0),
            action: (newRule.action as any) === 'Set Margin %' || newRule.action?.includes('Margin')
               ? 'Set to Cost + Margin'
               : (newRule.action || 'Decrease Price %'),
            value: Math.round(Number(newRule.value) || 0),
            isActive: true
         });
         setIsRuleModalOpen(false);
         setNewRule({ targetCategory: 'Fresh Produce', condition: 'Stock > X', action: 'Decrease Price %', isActive: true });
      } catch (err) {
         logger.error('usePricingRulesActions', 'Failed to save pricing rule', err as Error);
      }
   };

   const runPricingRule = async (rule: PricingRule) => {
      setIsSubmitting(true);
      try {
         const changes: PriceChangeInput[] = [];
         const ruleProducts = await priceManagerService.getMatchingTargets(activeCountry, {
            sites: activeRegionCode ? (sites.length ? sites.map(site => site.id) : ['no-matching-regional-sites']) : []
         });

         ruleProducts.forEach(p => {
            const unitsSold30d = salesMetricsIndex.get(p.id)?.unitsSold30d ?? (p.unitsSold30d ?? 0);
            if (matchRuleProduct(p, rule, { sales30d: unitsSold30d })) {
               // Merchandising Whole-Number Rule: Prices must strictly be integers rounded to the nearest whole number
               const newPrice = Math.round(calculateRulePrice(p, rule));
               if (newPrice > 0 && newPrice !== p.price) {
                  changes.push({ product: p, proposal: { price: newPrice, costPrice: p.costPrice, salePrice: p.salePrice, isOnSale: p.isOnSale } });
               }
            }
         });

         const unavailableCosts = (rule.action === 'Set to Cost + Margin' || rule.action.includes('Margin'))
            ? ruleProducts.filter(p => p.costPrice === undefined || p.costPrice <= 0).length
            : 0;
         if (unavailableCosts) addNotification('info', `Skipped ${unavailableCosts} product records whose costs are unavailable.`);

         if (changes.length) {
            batch.stagePriceBatch(changes, `Rule '${rule.name}'`);
            if (!rule.isActive) {
               addNotification('info', `Preview generated ${changes.length} proposals from paused rule '${rule.name}' for review.`);
            }
         } else {
            addNotification('info', `Rule '${rule.name}' matched no products needing a price change.`);
         }
      } catch (e) {
         logger.error('usePricingRulesActions', 'caught error', e as Error);
         addNotification('alert', 'Failed to run pricing rule');
      } finally {
         setIsSubmitting(false);
      }
   };

   const toggleRuleStatus = (id: string) => {
      const rule = pricingRules.find(r => r.id === id);
      if (rule) toggleRule.mutate({ id, isActive: !rule.isActive });
   };

   const deleteRuleById = (id: string) => deleteRule.mutate(id);

   const handleRunSimulation = async () => {
      setIsSimulating(true);
      try {
         const simProducts = await priceManagerService.getMatchingTargets(activeCountry, {
            sites: activeRegionCode ? (sites.length ? sites.map(site => site.id) : ['no-matching-regional-sites']) : []
         });
         const activeRules = await pricingRulesService.getAllActive(activeCountry);

         let totalCurrentRevenue = 0, totalProjectedRevenue = 0, totalCurrentMargin = 0, totalProjectedMargin = 0, impactedCount = 0;

         simProducts.forEach(p => {
            const cost = p.costPrice;
            if (cost === undefined || cost <= 0) return;

            const recordedSales = salesMetricsIndex.get(p.id)?.unitsSold30d;
            const estSales = (recordedSales !== undefined && recordedSales > 0)
               ? recordedSales
               : (p.salesVelocity === 'High' ? 35 : p.salesVelocity === 'Medium' ? 18 : 6);

            const currentRev = Math.round(p.price * estSales);
            const currentMarg = Math.round((p.price - cost) * estSales);

            totalCurrentRevenue += currentRev;
            totalCurrentMargin += currentMarg;

            const matchingRule = activeRules.find(r => matchRuleProduct(p, r, { sales30d: estSales }));
            if (matchingRule) {
               impactedCount++;
               const newPrice = Math.round(calculateRulePrice(p, matchingRule));
               const elasticityFactor = newPrice < p.price ? 1.25 : 0.88;
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

         setSimResult({ rev: revDeltaPct, margin: margDeltaPct });
         addNotification('success', `Simulation modeled on ${simProducts.length} target records: ${impactedCount} affected products.`);
      } catch (err) {
         logger.error('usePricingRulesActions', 'simulation failed', err as Error);
         addNotification('alert', 'Simulation failed to fetch catalog targets');
      } finally {
         setIsSimulating(false);
      }
   };

   return {
      isRuleModalOpen,
      setIsRuleModalOpen,
      newRule,
      setNewRule,
      ruleValidationErrors,
      setRuleValidationErrors,
      isCreatingRule: createRule.isPending,
      simResult,
      setSimResult,
      isSimulating,
      setIsSimulating,
      handleCreateRule,
      runPricingRule,
      toggleRuleStatus,
      deleteRuleById,
      handleRunSimulation
   };
}
