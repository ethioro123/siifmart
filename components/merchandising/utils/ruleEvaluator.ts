import { Product, PricingRule } from '../../../types';

export const matchRuleProduct = (p: Product, rule: PricingRule): boolean => {
   const target = (rule.targetCategory || '').trim().toLowerCase();
   const cat = (p.category || '').trim().toLowerCase();
   const matchesCategory = !target || target === 'all' || cat === target || cat.includes(target) || target.includes(cat);
   if (!matchesCategory) return false;

   const cond = rule.condition || '';
   const threshold = rule.threshold || 0;

   if (cond.includes('Stock >') || cond.includes('Stock > X')) {
      return (p.stock || 0) > threshold;
   }
   if (cond.includes('Stock <') || cond.includes('Stock < X')) {
      return (p.stock || 0) < threshold;
   }
   if (cond.includes('Expiry') || cond.includes('Days')) {
      if (p.expiryDate) {
         const diffDays = (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
         return diffDays <= threshold;
      }
      return threshold >= 10;
   }
   if (cond.includes('Sales') || cond.includes('Velocity')) {
      return p.salesVelocity === 'Low' || (p.salesVelocity === 'Medium' && threshold >= 10);
   }
   return true;
};

export const calculateRulePrice = (p: Product, rule: PricingRule): number => {
   const action = rule.action || 'Decrease Price %';
   const val = rule.value || 0;
   const cost = p.costPrice || (p.price * 0.7);

   if (action.includes('Decrease')) {
      return Math.max(cost, p.price * (1 - (val / 100)));
   }
   if (action.includes('Increase')) {
      return p.price * (1 + (val / 100));
   }
   if (action.includes('Margin')) {
      const targetMargin = Math.min(90, Math.max(5, val));
      return cost / (1 - (targetMargin / 100));
   }
   return p.price;
};
