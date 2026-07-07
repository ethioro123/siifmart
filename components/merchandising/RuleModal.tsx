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
      <Modal isOpen={isOpen} onClose={onClose} title="New Automation Rule">
         <div className="space-y-4">
            <div>
               <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Rule Name</label>
               <input
                  className="woody-input"
                  placeholder="e.g. Low Stock Clearance"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  aria-label="Rule Name"
               />
            </div>
            <div>
               <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Target Category</label>
               <select
                  className="woody-input"
                  value={newRule.targetCategory}
                  onChange={(e) => setNewRule({ ...newRule, targetCategory: e.target.value })}
                  aria-label="Target Category"
               >
                  {Object.entries(GROCERY_CATEGORIES).map(([group, items]) => (
                     <optgroup key={group} label={group} className="bg-stone-100 dark:bg-[#1E2822] text-stone-900 dark:text-stone-300">
                        {items.map(c => (
                           <option key={c} value={c} className="bg-white dark:bg-[#1E2822] text-stone-900 dark:text-stone-100">{c}</option>
                        ))}
                     </optgroup>
                  ))}
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Trigger Condition</label>
                  <select
                     className="woody-input"
                     value={newRule.condition}
                     onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as any })}
                     aria-label="Trigger Condition"
                  >
                     <option className="bg-white dark:bg-[#1E2822]">Stock &gt; X</option>
                     <option className="bg-white dark:bg-[#1E2822]">Expiry &lt; X Days</option>
                     <option className="bg-white dark:bg-[#1E2822]">Sales &lt; X</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Threshold (X)</label>
                  <input
                     type="number"
                     className="woody-input"
                     value={newRule.threshold || ''}
                     onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                     aria-label="Threshold Value"
                  />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Action</label>
                  <select
                     className="woody-input"
                     value={newRule.action}
                     onChange={(e) => setNewRule({ ...newRule, action: e.target.value as any })}
                     aria-label="Action"
                  >
                     <option className="bg-white dark:bg-[#1E2822]">Increase Price</option>
                     <option className="bg-white dark:bg-[#1E2822]">Decrease Price</option>
                     <option className="bg-white dark:bg-[#1E2822]">Set Margin</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs text-stone-400 dark:text-stone-500 uppercase font-bold mb-1 block">Value (%)</label>
                  <input
                     type="number"
                     className="woody-input"
                     value={newRule.value || ''}
                     onChange={(e) => setNewRule({ ...newRule, value: parseFloat(e.target.value) })}
                     aria-label="Action Value"
                  />
               </div>
            </div>
            <button
               onClick={handleCreateRule}
               className="woody-btn-primary w-full mt-4"
            >
               Activate Rule
            </button>
         </div>
      </Modal>
   );
};
