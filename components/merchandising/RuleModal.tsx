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
               <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Rule Name</label>
               <input
                  className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold"
                  placeholder="e.g. Low Stock Dynamic Clearance"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  aria-label="Rule Name"
               />
            </div>
            <div className="space-y-1">
               <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Target Category</label>
               <select
                  className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold cursor-pointer"
                  value={newRule.targetCategory}
                  onChange={(e) => setNewRule({ ...newRule, targetCategory: e.target.value })}
                  aria-label="Target Category"
               >
                  {Object.entries(GROCERY_CATEGORIES).map(([group, items]) => (
                     <optgroup key={group} label={group} className="bg-stone-100 dark:bg-[#18201B] text-stone-900 dark:text-stone-300">
                        {items.map(c => (
                           <option key={c} value={c} className="bg-white dark:bg-[#18201B] text-stone-900 dark:text-stone-100">{c}</option>
                        ))}
                     </optgroup>
                  ))}
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Trigger Condition</label>
                  <select
                     className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold cursor-pointer"
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
                  <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Threshold Value (X)</label>
                  <input
                     type="number"
                     className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold"
                     value={newRule.threshold || ''}
                     onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                     placeholder="0"
                     aria-label="Threshold Value"
                  />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Action</label>
                  <select
                     className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold cursor-pointer"
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
                  <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold tracking-wider block">Value (%)</label>
                  <input
                     type="number"
                     className="w-full bg-[#FAF8F5] dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none font-bold"
                     value={newRule.value || ''}
                     onChange={(e) => setNewRule({ ...newRule, value: parseFloat(e.target.value) })}
                     placeholder="0"
                     aria-label="Action Value"
                  />
               </div>
            </div>
            <div className="pt-2">
               <button
                  type="button"
                  onClick={handleCreateRule}
                  className="woody-btn-primary w-full py-2.5 rounded-2xl text-xs font-black cursor-pointer shadow-sm"
               >
                  Activate Automation Rule
               </button>
            </div>
         </div>
      </Modal>
   );
};
