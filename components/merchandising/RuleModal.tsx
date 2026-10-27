import React from 'react';
import { Loader2, Info } from 'lucide-react';
import Modal from '../Modal';
import { GROCERY_CATEGORIES } from '../../constants';
import type { PricingRule } from '../../types';

interface RuleModalProps {
   isOpen: boolean;
   onClose: () => void;
   newRule: Partial<PricingRule>;
   setNewRule: (rule: Partial<PricingRule>) => void;
   handleCreateRule: () => void;
   isSubmitting?: boolean;
   errors?: Record<string, string>;
}

export const RuleModal: React.FC<RuleModalProps> = ({
   isOpen,
   onClose,
   newRule,
   setNewRule,
   handleCreateRule,
   isSubmitting = false,
   errors = {}
}) => {
   const currentAction = newRule.action || 'Decrease Price %';
   const currentCondition = newRule.condition || 'Stock > X';

   return (
      <Modal isOpen={isOpen} onClose={onClose} title="New Pricing Rule">
         <div className="space-y-4">
            <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] flex items-start gap-2.5 text-xs text-[var(--theme-text-secondary)]">
               <Info size={16} className="text-[var(--theme-accent)] shrink-0 mt-0.5" />
               <p className="leading-relaxed">
                  Rules evaluate catalog items to generate price change proposals staged for review. Enabled rules can be simulated or run on-demand.
               </p>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">
                  Rule Name <span className="text-rose-500">*</span>
               </label>
               <input
                  disabled={isSubmitting}
                  className={`w-full bg-[var(--theme-bg-subtle)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium transition-colors ${
                     errors.name ? 'border-rose-500' : 'border-[var(--theme-border)]'
                  }`}
                  placeholder="e.g. Low Stock Dynamic Clearance"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  aria-label="Rule Name"
               />
               {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-1">
               <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">
                  Target Category <span className="text-rose-500">*</span>
               </label>
               <select
                  disabled={isSubmitting}
                  className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium cursor-pointer transition-colors"
                  value={newRule.targetCategory || 'Fresh Produce'}
                  onChange={(e) => setNewRule({ ...newRule, targetCategory: e.target.value })}
                  aria-label="Target Category"
               >
                  <option value="All" className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] font-semibold">
                     All Categories (Catalog-Wide)
                  </option>
                  {Object.entries(GROCERY_CATEGORIES).map(([group, items]) => (
                     <optgroup key={group} label={group} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
                        {items.map(c => (
                           <option key={c} value={c} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">{c}</option>
                        ))}
                     </optgroup>
                  ))}
               </select>
               {errors.targetCategory && <p className="text-[11px] text-rose-500 mt-1">{errors.targetCategory}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Trigger Condition</label>
                  <select
                     disabled={isSubmitting}
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium cursor-pointer transition-colors"
                     value={newRule.condition || 'Stock > X'}
                     onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as any })}
                     aria-label="Trigger Condition"
                  >
                     <option value="Stock > X">Stock &gt; X</option>
                     <option value="Expiry < X Days">Expiry &lt; X Days</option>
                     <option value="Sales < X">Sales &lt; X (30d Units)</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">
                     Threshold Value (X) <span className="text-rose-500">*</span>
                  </label>
                  <input
                     disabled={isSubmitting}
                     type="number"
                     step="1"
                     min="0"
                     className={`w-full bg-[var(--theme-bg-subtle)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-mono font-medium tabular-nums transition-colors ${
                        errors.threshold ? 'border-rose-500' : 'border-[var(--theme-border)]'
                     }`}
                     value={newRule.threshold !== undefined && newRule.threshold !== null ? newRule.threshold : ''}
                     onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Math.round(parseFloat(e.target.value) || 0);
                        setNewRule({ ...newRule, threshold: val });
                     }}
                     placeholder="0"
                     aria-label="Threshold Value"
                  />
                  {errors.threshold && <p className="text-[11px] text-rose-500 mt-1">{errors.threshold}</p>}
               </div>
            </div>
            <p className="text-[11px] text-[var(--theme-text-secondary)] -mt-2">
               {currentCondition === 'Sales < X' && 'Evaluates actual recorded POS units sold over the trailing 30 days.'}
               {currentCondition === 'Stock > X' && 'Triggers when current stock on hand exceeds the integer threshold.'}
               {currentCondition === 'Expiry < X Days' && 'Triggers when calendar days until product expiration is within threshold.'}
            </p>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Action</label>
                  <select
                     disabled={isSubmitting}
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium cursor-pointer transition-colors"
                     value={newRule.action || 'Decrease Price %'}
                     onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                     aria-label="Action"
                  >
                     <option value="Decrease Price %">Decrease Price %</option>
                     <option value="Increase Price %">Increase Price %</option>
                     <option value="Set to Cost + Margin">Set to Cost + Margin %</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">
                     Value (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                     disabled={isSubmitting}
                     type="number"
                     step="1"
                     className={`w-full bg-[var(--theme-bg-subtle)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-mono font-medium tabular-nums transition-colors ${
                        errors.value ? 'border-rose-500' : 'border-[var(--theme-border)]'
                     }`}
                     value={newRule.value !== undefined && newRule.value !== null ? newRule.value : ''}
                     onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Math.round(parseFloat(e.target.value) || 0);
                        setNewRule({ ...newRule, value: val });
                     }}
                     placeholder="0"
                     aria-label="Action Value"
                  />
                  {errors.value && <p className="text-[11px] text-rose-500 mt-1">{errors.value}</p>}
               </div>
            </div>
            <p className="text-[11px] text-[var(--theme-text-secondary)] -mt-2">
               {currentAction === 'Decrease Price %' && 'Discount off retail price. Integer bounds: 1% to 99%.'}
               {currentAction === 'Increase Price %' && 'Markup over retail price. Integer bounds: 1% to 300%.'}
               {currentAction === 'Set to Cost + Margin' && 'Gross selling margin (Price = Cost / (1 - Margin %)). Integer bounds: 5% to 90%.'}
            </p>

            <div className="pt-2">
               <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreateRule}
                  className="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-2"
               >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  <span>{isSubmitting ? 'Saving Rule...' : 'Save & Enable Pricing Rule'}</span>
               </button>
            </div>
         </div>
      </Modal>
   );
};
