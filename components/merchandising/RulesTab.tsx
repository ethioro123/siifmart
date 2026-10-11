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
                  className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[var(--theme-accent)]/40 group"
               >
                  <div className="flex items-start gap-4">
                     <div
                        className={`p-3 rounded-2xl border transition-colors shrink-0 ${
                           rule.isActive
                              ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]/20'
                              : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                        }`}
                     >
                        <BrainCircuit size={22} />
                     </div>
                     <div>
                        <div className="flex items-center gap-2.5">
                           <h3 className="font-semibold text-[var(--theme-text-primary)] text-sm sm:text-base leading-tight">
                              {rule.name}
                           </h3>
                           {rule.isActive ? (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full uppercase border border-emerald-500/20 font-semibold tracking-wider">
                                 Active
                              </span>
                           ) : (
                              <span className="text-[10px] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] px-2.5 py-0.5 rounded-full uppercase border border-[var(--theme-border)] font-medium tracking-wider">
                                 Paused
                              </span>
                           )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs font-mono">
                           <span className="bg-[var(--theme-bg-subtle)] px-2.5 py-1 rounded-xl text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-medium">
                              IF {rule.condition.replace('X', rule.threshold.toString())}
                           </span>
                           <ArrowRight size={13} className="text-[var(--theme-text-secondary)]" />
                           <span className="bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] px-2.5 py-1 rounded-xl border border-[var(--theme-accent)]/20 font-semibold">
                              {rule.action} {rule.value}%
                           </span>
                        </div>

                        <p className="text-xs text-[var(--theme-text-secondary)] mt-2 font-medium">
                           Applies to: <span className="text-[var(--theme-text-primary)] font-semibold">{rule.targetCategory}</span>
                        </p>
                     </div>
                  </div>

                  {/* Rule Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                     <button
                        type="button"
                        onClick={() => runPricingRule(rule)}
                        disabled={isSubmitting}
                        className="p-2.5 bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)] text-[var(--theme-accent)] hover:text-white rounded-2xl transition-all border border-[var(--theme-accent)]/20 disabled:opacity-50 cursor-pointer shadow-sm"
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
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                        }`}
                        title={rule.isActive ? 'Deactivate Rule' : 'Activate Rule'}
                     >
                        <Power size={16} />
                     </button>
                     <button
                        type="button"
                        onClick={() => deleteRule(rule.id)}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-2xl transition-colors cursor-pointer"
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
               className="w-full py-4 border border-dashed border-[var(--theme-border)] hover:border-[var(--theme-accent)] rounded-3xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-all flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
               <Plus size={16} />
               <span>Create New Automation Rule</span>
            </button>
         </div>

         {/* Right: Rule Simulator Card */}
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex items-center gap-3 pb-3 mb-4 border-b border-[var(--theme-border)]">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                     <Sparkles size={18} />
                  </div>
                  <div>
                     <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Rule Simulator</h3>
                     <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Pre-flight impact testing</p>
                  </div>
               </div>
               <p className="text-xs text-[var(--theme-text-secondary)] mb-5 leading-relaxed">
                  Test how rules affect your revenue and profit margins across affected catalog SKUs before activating them network-wide.
               </p>

               <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-3">
                  <p className="text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">Projected Portfolio Impact</p>
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-[var(--theme-text-secondary)] font-medium">Revenue</span>
                     <span
                        className={`font-mono font-semibold tabular-nums ${
                           simResult && simResult.rev > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--theme-text-primary)]'
                        }`}
                     >
                        {simResult ? `${simResult.rev > 0 ? '+' : ''}${simResult.rev}% ` : '--'}
                     </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-[var(--theme-text-secondary)] font-medium">Margin Delta</span>
                     <span
                        className={`font-mono font-semibold tabular-nums ${
                           simResult && simResult.margin < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                     >
                        {simResult ? `${simResult.margin > 0 ? '+' : ''}${simResult.margin}% ` : '--'}
                     </span>
                  </div>
               </div>
            </div>

            <div className="pt-5 border-t border-[var(--theme-border)] mt-4">
               <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-[var(--theme-accent)] hover:opacity-90 text-white disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
               >
                  {isSimulating ? <RefreshCw className="animate-spin" size={15} /> : <Zap size={15} />}
                  <span>{isSimulating ? 'Simulating Elasticity...' : 'Run Simulation'}</span>
               </button>
            </div>
         </div>
      </div>
   );
};
