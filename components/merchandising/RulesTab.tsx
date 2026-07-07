import React from 'react';
import { BrainCircuit, ArrowRight, Loader2, Play, Power, Trash2, Plus, RefreshCw } from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';

export const RulesTab: React.FC = () => {
   const {
      pricingRules,
      runPricingRule,
      isSubmitting,
      toggleRuleStatus,
      deleteRule,
      setIsRuleModalOpen,
      simResult,
      handleRunSimulation,
      isSimulating
   } = useMerchandising();

   return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
         <div className="lg:col-span-2 space-y-4">
            {pricingRules.map(rule => (
               <div
                  key={rule.id}
                  className="glass-panel p-6 flex items-center justify-between group hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 hover:scale-[1.005] duration-300"
               >
                  <div className="flex items-start gap-4">
                     <div
                        className={`p-3 rounded-xl ${
                           rule.isActive
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : 'bg-stone-100 dark:bg-gray-500/10 text-stone-500 dark:text-gray-400'
                        }`}
                     >
                        <BrainCircuit size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-[#1E3F27] dark:text-white text-lg flex items-center gap-2">
                           {rule.name}
                           {rule.isActive && (
                              <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full uppercase border border-green-500/20 dark:border-green-500/10 font-semibold">
                                 Active
                              </span>
                           )}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-sm text-stone-500 dark:text-stone-400 font-mono">
                           <span className="bg-stone-100 dark:bg-black/35 px-2 py-1 rounded-xl text-[#1E3F27] dark:text-[#EAE5D9] border border-[#E2DCCE]/50 dark:border-emerald-950/20 font-medium">
                              IF {rule.condition.replace('X', rule.threshold.toString())}
                           </span>
                           <ArrowRight size={14} className="text-stone-400 dark:text-stone-500" />
                           <span className="bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] px-2 py-1 rounded-xl border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 font-medium">
                              {rule.action} {rule.value}%
                           </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                           Applies to: <span className="text-[#1E3F27] dark:text-white font-medium">{rule.targetCategory}</span>
                        </p>
                     </div>
                  </div>
                  <button
                     onClick={() => runPricingRule(rule)}
                     disabled={isSubmitting}
                     className="p-3 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 hover:bg-[#2C5E3B] dark:hover:bg-[#A9CBA2] text-stone-600 dark:text-stone-400 hover:text-white dark:hover:text-[#1E3B24] rounded-xl transition-all border border-[#E2DCCE] dark:border-white/10 group-hover:border-[#2C5E3B]/50 dark:group-hover:border-[#A9CBA2]/50 disabled:opacity-50"
                     aria-label="Run Rule Now"
                     title="Run Rule Now"
                  >
                     {isSubmitting ? (
                        <Loader2 size={20} className="animate-spin text-[#2C5E3B] dark:text-[#A9CBA2]" />
                     ) : (
                        <Play size={20} />
                     )}
                  </button>
                  <div className="flex flex-col gap-2 ml-2">
                     <button
                        onClick={() => toggleRuleStatus(rule.id)}
                        className={`p-2 rounded-lg border transition-all ${
                           rule.isActive
                              ? 'bg-green-500/10 border-green-500/20 dark:border-green-500/10 text-green-600 dark:text-green-400'
                              : 'bg-stone-100 dark:bg-gray-500/10 border-[#E2DCCE] dark:border-white/10 text-stone-500 dark:text-gray-400'
                        }`}
                        title={rule.isActive ? 'Deactivate Rule' : 'Activate Rule'}
                     >
                        <Power size={16} />
                     </button>
                     <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/10 rounded-lg transition-all"
                        title="Delete Rule"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
            ))}

            <button
               onClick={() => setIsRuleModalOpen(true)}
               className="w-full py-4 border border-dashed border-[#E2DCCE] dark:border-emerald-950/40 rounded-2xl text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:border-[#2C5E3B]/50 dark:hover:border-[#A9CBA2]/50 transition-all flex items-center justify-center gap-2 font-semibold"
            >
               <Plus size={20} /> Create New Automation Rule
            </button>
         </div>

         <div className="glass-panel p-6">
            <h3 className="text-[#1E3F27] dark:text-white font-bold mb-4">Rule Simulator</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">Test how rules affect your margins before activating them.</p>
            <div className="space-y-4">
               <div className="p-4 bg-stone-50/50 dark:bg-black/35 rounded-2xl border border-[#E2DCCE]/50 dark:border-emerald-950/20">
                  <p className="text-xs text-stone-400 dark:text-stone-500 uppercase mb-1">Projected Impact</p>
                  <div className="flex justify-between items-center">
                     <span className="text-stone-700 dark:text-stone-300 text-sm">Revenue</span>
                     <span
                        className={`text-sm font-mono font-bold ${
                           simResult && simResult.rev > 0 ? 'text-green-600 dark:text-green-400' : 'text-stone-700 dark:text-stone-300'
                        }`}
                     >
                        {simResult ? `${simResult.rev > 0 ? '+' : ''}${simResult.rev}% ` : '--'}
                     </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                     <span className="text-stone-700 dark:text-stone-300 text-sm">Margin</span>
                     <span
                        className={`text-sm font-mono font-bold ${
                           simResult && simResult.margin < 0 ? 'text-red-600 dark:text-red-400' : 'text-stone-700 dark:text-stone-300'
                        }`}
                     >
                        {simResult ? `${simResult.margin > 0 ? '+' : ''}${simResult.margin}% ` : '--'}
                     </span>
                  </div>
               </div>
               <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="woody-btn-secondary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  {isSimulating ? <RefreshCw className="animate-spin" size={16} /> : 'Run Simulation'}
               </button>
            </div>
         </div>
      </div>
   );
};
