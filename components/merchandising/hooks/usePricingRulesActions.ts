import { useEffect, useRef, useState } from 'react';
import type { Country } from '../../../utils/localization';
import type { Product, PricingRule } from '../../../types';
import type { PriceChangeInput } from '../../../hooks/useSubmitPriceChanges';
import type { ProductSalesMetrics } from '../../../utils/merchandisingAnalytics';
import { priceManagerService } from '../../../services/price-manager.service';
import { pricingRulesService } from '../../../services/pricing-rules.service';
import { matchRuleProduct, calculateRulePrice, validatePricingRule } from '../utils/ruleEvaluator';
import { runMerchandisingSimulation } from '../utils/simulationRunner';
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

   const scope = `${activeCountry}:${activeRegionCode || ''}:${sites.map(site => site.id).sort().join(',')}`;
   const scopeRef = useRef(scope);
   scopeRef.current = scope;
   useEffect(() => { setSimResult(null); }, [scope, pricingRules]);

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
            action: (newRule.action as string) === 'Set Margin %' || newRule.action?.includes('Margin')
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
      const requestScope = scope;
      setIsSubmitting(true);
      try {
         const changes: PriceChangeInput[] = [];
         const ruleProducts = await priceManagerService.getMatchingTargets(activeCountry, {
            sites: activeRegionCode ? (sites.length ? sites.map(site => site.id) : ['no-matching-regional-sites']) : []
         });

         const recordedMetrics = rule.condition === 'Sales < X'
            ? await priceManagerService.getRuleSalesMetrics(ruleProducts, activeCountry) : new Map<string, ProductSalesMetrics>();
         if (scopeRef.current !== requestScope) return;
         ruleProducts.forEach(p => {
            const unitsSold30d = recordedMetrics.get(p.id)?.unitsSold30d;
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
      const requestScope = scope;
      setSimResult(null);
      setIsSimulating(true);
      try {
         const simProducts = await priceManagerService.getMatchingTargets(activeCountry, {
            sites: activeRegionCode ? (sites.length ? sites.map(site => site.id) : ['no-matching-regional-sites']) : []
         });
         const activeRules = await pricingRulesService.getAllActive(activeCountry);
         const recordedMetrics = await priceManagerService.getRuleSalesMetrics(simProducts, activeCountry);

         if (scopeRef.current !== requestScope) return;
         const result = runMerchandisingSimulation(simProducts, activeRules, recordedMetrics);
         setSimResult(result);
         addNotification('info', `Constant-volume scenario: ${result.impactedCount} product records affected. Products without recorded sales or costs are excluded.`);
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
