import React from 'react';
import Modal from '../Modal';
import { GROCERY_CATEGORIES } from '../../constants';
import type { PricingRule } from '../../types';

interface RuleModalProps {
   isOpen: boolean;
   onClose: () => void;
   newRule: Partial<PricingRule>;
   setNewRule: (rule: Partial<PricingRule>) => void;
   handleCreateRule: () => void;
}

export const RuleModal: React.FC<RuleModalProps> = ({
   isOpen,
   onClose,
   newRule,
   setNewRule,
   handleCreateRule,
}) => {
   return (
      <Modal isOpen={isOpen} onClose={onClose} title="New Pricing Automation Rule">
         <div className="space-y-4">
            <div className="space-y-1">
               <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Rule Name</label>
               <input
                  className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium transition-colors"
                  placeholder="e.g. Low Stock Dynamic Clearance"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  aria-label="Rule Name"
               />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Target Category</label>
               <select
                  className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium cursor-pointer transition-colors"
                  value={newRule.targetCategory}
                  onChange={(e) => setNewRule({ ...newRule, targetCategory: e.target.value })}
                  aria-label="Target Category"
               >
                  {Object.entries(GROCERY_CATEGORIES).map(([group, items]) => (
                     <optgroup key={group} label={group} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">
                        {items.map(c => (
                           <option key={c} value={c} className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)]">{c}</option>
                        ))}
                     </optgroup>
                  ))}
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Trigger Condition</label>
                  <select
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium cursor-pointer transition-colors"
                     value={newRule.condition}
                     onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as any })}
                     aria-label="Trigger Condition"
                  >
                     <option value="Stock > X">Stock &gt; X</option>
                     <option value="Expiry < X Days">Expiry &lt; X Days</option>
                     <option value="Sales < X">Sales &lt; X</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Threshold Value (X)</label>
                  <input
                     type="number"
                     step="1"
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-mono font-medium tabular-nums transition-colors"
                     value={newRule.threshold || ''}
                     onChange={(e) => setNewRule({ ...newRule, threshold: Math.round(parseFloat(e.target.value) || 0) })}
                     placeholder="0"
                     aria-label="Threshold Value"
                  />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Action</label>
                  <select
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-medium cursor-pointer transition-colors"
                     value={newRule.action}
                     onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                     aria-label="Action"
                  >
                     <option value="Increase Price %">Increase Price %</option>
                     <option value="Decrease Price %">Decrease Price %</option>
                     <option value="Set Margin %">Set Margin %</option>
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--theme-text-secondary)] block mb-1">Value (%)</label>
                  <input
                     type="number"
                     step="1"
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] font-mono font-medium tabular-nums transition-colors"
                     value={newRule.value || ''}
                     onChange={(e) => setNewRule({ ...newRule, value: Math.round(parseFloat(e.target.value) || 0) })}
                     placeholder="0"
                     aria-label="Action Value"
                  />
               </div>
            </div>
            <div className="pt-2">
               <button
                  type="button"
                  onClick={handleCreateRule}
                  className="w-full py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors"
               >
                  Activate Automation Rule
               </button>
            </div>
         </div>
      </Modal>
   );
};
