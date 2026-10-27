import { Product, PricingRule, SaleRecord } from '../../../types';
import type { ProductSalesMetrics } from '../../../utils/merchandisingAnalytics';

export interface RuleEvaluationContext {
   now?: number;
   sales30d?: number;
   salesMetrics?: ProductSalesMetrics;
   salesRecords?: SaleRecord[];
}

export const matchRuleProduct = (
   p: Product,
   rule: PricingRule,
   contextOrNow: number | RuleEvaluationContext = Date.now()
): boolean => {
   const now = typeof contextOrNow === 'number' ? contextOrNow : (contextOrNow.now ?? Date.now());
   const target = (rule.targetCategory || '').trim().toLowerCase();
   const cat = (p.category || '').trim().toLowerCase();
   const matchesCategory = !target || target === 'all' || cat === target || (Boolean(cat) && (cat.startsWith(target + ' > ') || cat.startsWith(target + ' › ')));
   if (!matchesCategory) return false;

   const cond = rule.condition || '';
   const threshold = rule.threshold ?? 0;
   if (!Number.isFinite(threshold)) return false;

   if (cond.includes('Stock >') || cond.includes('Stock > X')) {
      return (p.stock || 0) > threshold;
   }
   if (cond.includes('Stock <') || cond.includes('Stock < X')) {
      return (p.stock || 0) < threshold;
   }
   if (cond.includes('Expiry') || cond.includes('Days')) {
      if (p.expiryDate) {
         const expiry = new Date(p.expiryDate);
         expiry.setHours(23, 59, 59, 999);
         const diffDays = (expiry.getTime() - now) / (1000 * 3600 * 24);
         return Number.isFinite(diffDays) && diffDays >= 0 && diffDays <= threshold;
      }
      return false;
   }
   if (cond.includes('Sales') || cond.includes('Velocity')) {
      // Evaluate recorded sales over last 30 days vs threshold
      let unitsSold30d: number | undefined;

      if (typeof contextOrNow === 'object') {
         if (contextOrNow.sales30d !== undefined) {
            unitsSold30d = contextOrNow.sales30d;
         } else if (contextOrNow.salesMetrics?.unitsSold30d !== undefined) {
            unitsSold30d = contextOrNow.salesMetrics.unitsSold30d;
         } else if (contextOrNow.salesRecords && contextOrNow.salesRecords.length > 0) {
            const cutoff = now - 30 * 24 * 60 * 60 * 1000;
            let sum = 0;
            for (const s of contextOrNow.salesRecords) {
               const saleTime = new Date(s.date || s.created_at || '').getTime();
               const siteId = p.siteId || p.site_id;
               if (siteId && (s.siteId || s.site_id) !== siteId) continue;
               if (s.status !== 'Completed' && String(s.status).toLowerCase() !== 'completed') continue;
               if (saleTime >= cutoff && saleTime <= now && Array.isArray(s.items)) {
                  for (const item of s.items) {
                     if (item.id === p.id || item.productId === p.id || (p.sku && item.sku === p.sku)) {
                        sum += item.quantity || 0;
                     }
                  }
               }
            }
            unitsSold30d = sum;
         }
      }

      if (unitsSold30d === undefined && p.unitsSold30d !== undefined) {
         unitsSold30d = p.unitsSold30d;
      }

      // If recorded sales data was provided/found, compare directly with threshold
      if (unitsSold30d !== undefined) {
         return Number.isFinite(unitsSold30d) && unitsSold30d >= 0 && unitsSold30d < threshold;
      }

      // Missing sales coverage cannot establish that sales were below the threshold.
      return false;
   }
   return false;
};

export const calculateRulePrice = (p: Product, rule: PricingRule): number => {
   const action = rule.action || 'Decrease Price %';
   const val = rule.value || 0;
   const cost = p.costPrice;

   let calculatedPrice = p.price;
   if (action.includes('Decrease')) {
      calculatedPrice = cost !== undefined && cost > 0 ? Math.max(cost, p.price * (1 - (val / 100))) : p.price * (1 - (val / 100));
   } else if (action.includes('Increase')) {
      calculatedPrice = p.price * (1 + (val / 100));
   } else if (action.includes('Margin') || action === 'Set to Cost + Margin') {
      if (cost === undefined || cost <= 0) return p.price;
      const targetMargin = Math.min(90, Math.max(5, val));
      calculatedPrice = cost / (1 - (targetMargin / 100));
   }

   // Merchandising Whole-Number Invariant: Never allow fractions. Always round to nearest whole number.
   return Math.round(calculatedPrice);
};

export interface RuleConflict {
   ruleId: string;
   ruleName: string;
   conflictingRuleId: string;
   conflictingRuleName: string;
   targetCategory: string;
   reason: string;
}

export const detectRuleConflicts = (rules: PricingRule[]): RuleConflict[] => {
   const conflicts: RuleConflict[] = [];
   const activeRules = rules.filter(r => r.isActive);

   for (let i = 0; i < activeRules.length; i++) {
      for (let j = i + 1; j < activeRules.length; j++) {
         const r1 = activeRules[i];
         const r2 = activeRules[j];

         const cat1 = (r1.targetCategory || '').trim().toLowerCase();
         const cat2 = (r2.targetCategory || '').trim().toLowerCase();

         // Check category overlap: either identical, or one is 'all'
         const categoryOverlaps = !cat1 || !cat2 || cat1 === 'all' || cat2 === 'all' || cat1 === cat2 || cat1.startsWith(cat2 + ' > ') || cat2.startsWith(cat1 + ' > ') || cat1.startsWith(cat2 + ' › ') || cat2.startsWith(cat1 + ' › ');
         if (!categoryOverlaps) continue;

         conflicts.push({
            ruleId: r1.id,
            ruleName: r1.name,
            conflictingRuleId: r2.id,
            conflictingRuleName: r2.name,
            targetCategory: r1.targetCategory === r2.targetCategory ? r1.targetCategory : `${r1.targetCategory} / ${r2.targetCategory}`,
            reason: `Rules "${r1.name}" and "${r2.name}" both target ${r1.targetCategory === r2.targetCategory ? `"${r1.targetCategory}"` : 'overlapping categories'}. When both match, the first rule in priority order applies.`
         });
      }
   }
   return conflicts;
};

export interface RuleValidationResult {
   isValid: boolean;
   errors: Record<string, string>;
}

export const validatePricingRule = (rule: Partial<PricingRule>): RuleValidationResult => {
   const errors: Record<string, string> = {};

   if (!rule.name || !rule.name.trim()) {
      errors.name = 'Rule name is required';
   }

   if (!rule.targetCategory || !rule.targetCategory.trim()) {
      errors.targetCategory = 'Target category is required';
   }

   if (rule.threshold === undefined || rule.threshold === null || isNaN(Number(rule.threshold))) {
      errors.threshold = 'Threshold value is required';
   } else if (Number(rule.threshold) < 0) {
      errors.threshold = 'Threshold must be 0 or greater';
   } else if (!Number.isInteger(Number(rule.threshold))) {
      errors.threshold = 'Threshold must be a whole number';
   }

   if (!['Stock > X', 'Expiry < X Days', 'Sales < X'].includes(rule.condition || 'Stock > X')) {
      errors.condition = 'Select a supported trigger';
   }
   const action = rule.action || 'Decrease Price %';
   if (!['Decrease Price %', 'Increase Price %', 'Set to Cost + Margin'].includes(action)) {
      errors.action = 'Select a supported pricing action';
   }
   const val = rule.value;

   if (val === undefined || val === null || isNaN(Number(val))) {
      errors.value = 'Value is required';
   } else if (!Number.isInteger(Number(val))) {
      errors.value = 'Value must be a whole number';
   } else {
      const numVal = Number(val);
      if (action.includes('Decrease')) {
         if (numVal < 1 || numVal > 99) {
            errors.value = 'Discount percentage must be between 1% and 99%';
         }
      } else if (action.includes('Increase')) {
         if (numVal < 1 || numVal > 300) {
            errors.value = 'Price increase percentage must be between 1% and 300%';
         }
      } else if (action.includes('Margin') || action === 'Set to Cost + Margin') {
         if (numVal < 5 || numVal > 90) {
            errors.value = 'Target gross margin must be between 5% and 90%';
         }
      }
   }

   return {
      isValid: Object.keys(errors).length === 0,
      errors
   };
};

