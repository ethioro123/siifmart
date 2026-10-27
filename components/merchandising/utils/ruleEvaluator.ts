import { Product, PricingRule } from '../../../types';

export const matchRuleProduct = (p: Product, rule: PricingRule): boolean => {
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
         const diffDays = (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
         return Number.isFinite(diffDays) && diffDays >= 0 && diffDays <= threshold;
      }
      return false;
   }
   if (cond.includes('Sales') || cond.includes('Velocity')) {
      return p.salesVelocity === 'Low' || (p.salesVelocity === 'Medium' && threshold >= 10);
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
   } else if (action.includes('Margin')) {
      if (cost === undefined || cost <= 0) return p.price;
      const targetMargin = Math.min(90, Math.max(5, val));
      calculatedPrice = cost / (1 - (targetMargin / 100));
   }

   // Merchandising Whole-Number Invariant: Never allow fractions. Always round to nearest whole number.
   return Math.round(calculatedPrice);
};
