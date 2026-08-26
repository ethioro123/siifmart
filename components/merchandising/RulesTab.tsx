import React from 'react';
import { BrainCircuit, ArrowRight, Loader2, Play, Power, Trash2, Plus, RefreshCw, Zap, Sparkles } from 'lucide-react';
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
         {/* Left: Active Automation Rules List */}
         <div className="lg:col-span-2 space-y-4">
            {pricingRules.map(rule => (
               <div
                  key={rule.id}
                  className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[#2C5E3B]/40 group"
               >
                  <div className="flex items-start gap-4">
                     <div
                        className={`p-3 rounded-2xl border transition-colors shrink-0 ${
                           rule.isActive
                              ? 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30'
                              : 'bg-[#FAF8F5] text-stone-400 dark:bg-black/30 dark:text-stone-500 border-[#E2DCCE] dark:border-white/10'
                        }`}
                     >
                        <BrainCircuit size={22} />
                     </div>
                     <div>
                        <div className="flex items-center gap-2.5">
                           <h3 className="font-bold text-[#1E3F27] dark:text-white text-sm sm:text-base">
                              {rule.name}
                           </h3>
                           {rule.isActive ? (
                              <span className="text-[10px] bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] px-2.5 py-0.5 rounded-full uppercase border border-emerald-200 dark:border-emerald-950/30 font-black tracking-wider">
                                 Active
                              </span>
                           ) : (
                              <span className="text-[10px] bg-stone-100 text-stone-500 dark:bg-black/30 dark:text-stone-400 px-2.5 py-0.5 rounded-full uppercase border border-stone-200 dark:border-white/10 font-bold tracking-wider">
                                 Paused
                              </span>
                           )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs font-mono">
                           <span className="bg-[#FAF8F5] dark:bg-black/30 px-2.5 py-1 rounded-xl text-[#1E3F27] dark:text-[#EAE5D9] border border-[#E2DCCE] dark:border-white/10 font-bold">
                              IF {rule.condition.replace('X', rule.threshold.toString())}
                           </span>
                           <ArrowRight size={13} className="text-stone-400" />
                           <span className="bg-emerald-50 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-950/30 font-bold">
                              {rule.action} {rule.value}%
                           </span>
                        </div>

                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 font-medium">
                           Applies to: <span className="text-[#1E3F27] dark:text-white font-bold">{rule.targetCategory}</span>
                        </p>
                     </div>
                  </div>

                  {/* Rule Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                     <button
                        type="button"
                        onClick={() => runPricingRule(rule)}
                        disabled={isSubmitting}
                        className="p-2.5 bg-emerald-50 hover:bg-[#2C5E3B] text-[#2C5E3B] hover:text-white dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] dark:hover:bg-[#A9CBA2] dark:hover:text-[#18201B] rounded-2xl transition-all border border-emerald-200 dark:border-emerald-950/30 disabled:opacity-50 cursor-pointer shadow-sm"
                        aria-label="Run Rule Now"
                        title="Execute Rule Immediately"
                     >
                        {isSubmitting ? (
                           <Loader2 size={16} className="animate-spin" />
                        ) : (
                           <Play size={16} />
                        )}
                     </button>
                     <button
                        type="button"
                        onClick={() => toggleRuleStatus(rule.id)}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                           rule.isActive
                              ? 'bg-emerald-50 border-emerald-200 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] dark:border-emerald-950/30'
                              : 'bg-[#FAF8F5] border-[#E2DCCE] text-stone-400 dark:bg-black/30 dark:border-white/10 dark:text-stone-500'
                        }`}
                        title={rule.isActive ? 'Deactivate Rule' : 'Activate Rule'}
                     >
                        <Power size={16} />
                     </button>
                     <button
                        type="button"
                        onClick={() => deleteRule(rule.id)}
                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-2xl transition-colors cursor-pointer"
                        title="Delete Rule"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
            ))}

            <button
               type="button"
               onClick={() => setIsRuleModalOpen(true)}
               className="w-full py-4 border-2 border-dashed border-[#E2DCCE] dark:border-emerald-950/40 hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] rounded-3xl text-stone-500 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] hover:bg-emerald-50/40 dark:hover:bg-[#2C5E3B]/10 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer"
            >
               <Plus size={16} />
               <span>Create New Automation Rule</span>
            </button>
         </div>

         {/* Right: Rule Simulator Card */}
         <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E2DCCE]/60 dark:border-white/5">
                  <div className="p-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-900/30">
                     <Sparkles size={16} />
                  </div>
                  <h3 className="text-xs font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">Rule Simulator</h3>
               </div>
               <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 leading-relaxed">
                  Test how rules affect your revenue and profit margins across affected catalog SKUs before activating them network-wide.
               </p>

               <div className="p-4 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 space-y-3">
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Projected Portfolio Impact</p>
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-stone-600 dark:text-stone-400 font-bold">Revenue</span>
                     <span
                        className={`font-mono font-black ${
                           simResult && simResult.rev > 0 ? 'text-emerald-700 dark:text-[#A9CBA2]' : 'text-stone-700 dark:text-stone-300'
                        }`}
                     >
                        {simResult ? `${simResult.rev > 0 ? '+' : ''}${simResult.rev}% ` : '--'}
                     </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-stone-600 dark:text-stone-400 font-bold">Margin Delta</span>
                     <span
                        className={`font-mono font-black ${
                           simResult && simResult.margin < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-[#A9CBA2]'
                        }`}
                     >
                        {simResult ? `${simResult.margin > 0 ? '+' : ''}${simResult.margin}% ` : '--'}
                     </span>
                  </div>
               </div>
            </div>

            <div className="pt-5 border-t border-[#E2DCCE]/60 dark:border-white/5">
               <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="woody-btn-primary w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
               >
                  {isSimulating ? <RefreshCw className="animate-spin" size={15} /> : <Zap size={15} />}
                  <span>{isSimulating ? 'Simulating Elasticity...' : 'Run Simulation'}</span>
               </button>
            </div>
         </div>
      </div>
   );
};
