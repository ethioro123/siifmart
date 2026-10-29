import React, { useMemo } from 'react';
import {
   BrainCircuit,
   ArrowRight,
   Loader2,
   Play,
   Power,
   Trash2,
   Plus,
   RefreshCw,
   Zap,
   Sparkles,
   Search,
   AlertTriangle,
   ChevronLeft,
   ChevronRight,
   Info
} from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';
import { detectRuleConflicts } from './utils/ruleEvaluator';

export const RulesTab: React.FC = () => {
   const {
      pricingRules, pricingRulesMutating, pricingRulesLoading, pricingRulesError, retryPricingRules,
      pricingRulesTotalCount,
      pricingRulesPage,
      setPricingRulesPage,
      pricingRulesTotalPages,
      pricingRulesSearch,
      setPricingRulesSearch,
      pricingRulesStatus,
      setPricingRulesStatus,
      runPricingRule,
      isSubmitting,
      toggleRuleStatus,
      deleteRule,
      setIsRuleModalOpen,
      simResult, currencySymbol,
      handleRunSimulation,
      isSimulating
   } = useMerchandising();

   const conflicts = useMemo(() => detectRuleConflicts(pricingRules), [pricingRules]);

   const fromRecord = pricingRulesTotalCount === 0 ? 0 : (pricingRulesPage - 1) * 25 + 1;
   const toRecord = Math.min(pricingRulesPage * 25, pricingRulesTotalCount);

   return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
         {/* Left: Pricing Rules List & Filters */}
         <div className="lg:col-span-2 space-y-4">
            {/* Header info & explanation of manual review workflow */}
            <div className="p-4 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
               <div>
                  <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Pricing Rules & Proposals</h3>
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                     Rules evaluate catalog items to generate price change proposals staged for review.
                  </p>
               </div>
               <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(true)}
                  className="px-3.5 py-2 bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-90 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm transition-all"
               >
                  <Plus size={15} />
                  <span>Create Rule</span>
               </button>
            </div>

            {/* Overlap & Conflict Warning Banner */}
            {conflicts.length > 0 && (
               <div className="p-3.5 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-semibold">
                     <AlertTriangle size={15} className="shrink-0" />
                     <span>Rule Overlap Detected ({conflicts.length})</span>
                  </div>
                  <p className="text-[var(--theme-text-secondary)] leading-relaxed">
                     Multiple enabled rules target overlapping categories. This page shows potential category overlap. The scenario uses newest enabled rule first; individual previews test only the selected rule. Review existing proposals before submitting.
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[var(--theme-text-secondary)] font-mono">
                     {conflicts.slice(0, 3).map((c, idx) => (
                        <li key={idx}>
                           &quot;{c.ruleName}&quot; may overlap &quot;{c.conflictingRuleName}&quot; on {c.targetCategory}
                        </li>
                     ))}
                  </ul>
               </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--theme-bg-card)] p-3 rounded-2xl border border-[var(--theme-border)]">
               <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
                  <input
                     type="text"
                     aria-label="Search pricing rules"
                     placeholder="Search rules by name..."
                     value={pricingRulesSearch}
                     onChange={(e) => {
                        setPricingRulesSearch(e.target.value);
                        setPricingRulesPage(1);
                     }}
                     className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
                  />
               </div>
               <div className="flex items-center gap-1 shrink-0">
                  {(['all', 'enabled', 'paused'] as const).map(status => (
                     <button
                        aria-pressed={pricingRulesStatus === status}
                        key={status}
                        type="button"
                        onClick={() => {
                           setPricingRulesStatus(status);
                           setPricingRulesPage(1);
                        }}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-xl capitalize transition-colors cursor-pointer ${
                           pricingRulesStatus === status
                              ? 'bg-[var(--theme-accent)] text-white shadow-sm'
                              : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)]'
                        }`}
                     >
                        {status}
                     </button>
                  ))}
               </div>
            </div>

            {/* Rules List */}
            {pricingRulesLoading ? <p role="status" className="p-4 text-[var(--theme-text-secondary)]">Loading pricing rules…</p> : pricingRulesError ? (
               <div role="alert" className="p-4 text-[var(--theme-text-primary)]">
                  <p>Could not load pricing rules: {pricingRulesError}</p>
                  <button type="button" onClick={retryPricingRules} className="min-h-11 px-4 rounded-xl border border-[var(--theme-border)]">Retry</button>
               </div>
            ) : pricingRules.length === 0 ? (
               <div className="p-8 text-center bg-[var(--theme-bg-card)] rounded-3xl border border-[var(--theme-border)] text-[var(--theme-text-secondary)] space-y-2">
                  <BrainCircuit size={28} className="mx-auto text-[var(--theme-text-secondary)]/50" />
                  <p className="text-xs font-medium">No pricing rules match current filters.</p>
               </div>
            ) : (
               pricingRules.map(rule => (
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
                                 <span className="text-[10px] bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] px-2.5 py-0.5 rounded-full uppercase border border-[var(--theme-status-success-border)] font-semibold tracking-wider">
                                    Enabled
                                 </span>
                              ) : (
                                 <span className="text-[10px] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] px-2.5 py-0.5 rounded-full uppercase border border-[var(--theme-border)] font-medium tracking-wider">
                                    Paused
                                 </span>
                              )}
                           </div>

                           <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs font-mono">
                              <span className="bg-[var(--theme-bg-subtle)] px-2.5 py-1 rounded-xl text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-medium">
                                 {rule.condition === 'Sales < X'
                                    ? `IF Sales (30d) < ${rule.threshold} units`
                                    : `IF ${rule.condition.replace('X', rule.threshold.toString())}`}
                              </span>
                              <ArrowRight size={13} className="text-[var(--theme-text-secondary)]" />
                              <span className="bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] px-2.5 py-1 rounded-xl border border-[var(--theme-accent)]/20 font-semibold">
                                 {rule.action === 'Set to Cost + Margin'
                                    ? `Set gross selling margin to ${rule.value}%`
                                    : `${rule.action} ${rule.value}%`}
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
                           disabled={isSubmitting || isSimulating || pricingRulesMutating}
                           className="px-3 py-2 bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)] text-[var(--theme-accent)] hover:text-white rounded-2xl transition-all border border-[var(--theme-accent)]/20 disabled:opacity-50 cursor-pointer shadow-sm text-xs font-medium flex items-center gap-1.5"
                           aria-label={`Preview proposals for rule ${rule.name}`}
                           title={rule.isActive ? 'Generate & preview price proposals' : 'Preview proposals (test paused rule)'}
                        >
                           {isSubmitting ? (
                              <Loader2 size={15} className="animate-spin" />
                           ) : (
                              <Play size={15} />
                           )}
                           <span>{rule.isActive ? 'Preview' : 'Test'}</span>
                        </button>
                        <button
                           type="button"
                           disabled={isSubmitting || isSimulating || pricingRulesMutating}
                           aria-label={rule.isActive ? `Pause ${rule.name}` : `Enable ${rule.name}`}
                           onClick={() => toggleRuleStatus(rule.id)}
                           className={`min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)] p-2.5 rounded-2xl border transition-all cursor-pointer ${
                              rule.isActive
                                 ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'
                                 : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                           }`}
                           title={rule.isActive ? 'Pause Rule' : 'Enable Rule'}
                        >
                           <Power size={16} />
                        </button>
                        <button
                           type="button"
                           disabled={isSubmitting || isSimulating || pricingRulesMutating}
                           aria-label={`Delete ${rule.name}`}
                           onClick={() => { if (window.confirm(`Delete pricing rule "${rule.name}"? Existing price proposals will remain.`)) deleteRule(rule.id); }}
                           className="min-h-11 min-w-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)] p-2.5 bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] rounded-2xl transition-colors cursor-pointer"
                           title="Delete Rule"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
               ))
            )}

            {/* Pagination Controls */}
            {pricingRulesTotalCount > 0 && (
               <div className="flex items-center justify-between pt-2 px-1 text-xs text-[var(--theme-text-secondary)]">
                  <span>
                     Showing {fromRecord}-{toRecord} of {pricingRulesTotalCount} rules
                  </span>
                  <div className="flex items-center gap-2">
                     <button
                        type="button"
                        disabled={pricingRulesPage <= 1}
                        onClick={() => setPricingRulesPage(Math.max(1, pricingRulesPage - 1))}
                        className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] disabled:opacity-40 hover:bg-[var(--theme-bg-subtle)] cursor-pointer disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                     >
                        <ChevronLeft size={16} />
                     </button>
                     <span className="font-mono px-2 py-0.5 rounded bg-[var(--theme-bg-subtle)]">
                        Page {pricingRulesPage} of {pricingRulesTotalPages}
                     </span>
                     <button
                        type="button"
                        disabled={pricingRulesPage >= pricingRulesTotalPages}
                        onClick={() => setPricingRulesPage(Math.min(pricingRulesTotalPages, pricingRulesPage + 1))}
                        className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] disabled:opacity-40 hover:bg-[var(--theme-bg-subtle)] cursor-pointer disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                     >
                        <ChevronRight size={16} />
                     </button>
                  </div>
               </div>
            )}
         </div>

         {/* Right: Rule Simulator Card */}
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
               <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--theme-border)]">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                        <Sparkles size={18} />
                     </div>
                     <div>
                        <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">Rule Simulator</h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Pre-flight impact testing</p>
                     </div>
                  </div>
                  <span className="text-[10px] bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                     Model Estimate
                  </span>
               </div>

               <p className="text-xs text-[var(--theme-text-secondary)] mb-4 leading-relaxed">
                  Tests how enabled rules affect revenue and margins across catalog targets before staging proposals for review.
               </p>

               {/* Disclose assumptions */}
               <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-[11px] text-[var(--theme-text-secondary)] space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--theme-text-primary)]">
                     <Info size={13} className="text-[var(--theme-accent)]" />
                     <span>Simulation Assumptions</span>
                  </div>
                  <p className="leading-relaxed">
                     Uses the same catalog target scope as proposal previews. Holds recorded 30-day sales volume constant; it does not predict demand. Products without recorded sales or costs are excluded. Individual previews test one rule; this scenario uses the newest enabled matching rule.
                  </p>
                  <p className="text-[10px] text-[var(--theme-text-secondary)]/80 italic">
                     * All calculations strictly adhere to whole-number merchandising policy.
                  </p>
               </div>

               <p className="text-xs text-[var(--theme-text-secondary)] mb-3">Active sale prices are preserved. Invalid proposals are excluded. Profit percentage change is unavailable when current gross profit is zero or negative.</p>
               {simResult && <p role="status" className="text-sm text-[var(--theme-text-primary)] mb-3">Gross profit change: {currencySymbol} {simResult.profitChange > 0 ? '+' : ''}{simResult.profitChange}. Selling price changes: {simResult.impactedCount}. Invalid proposals: {simResult.invalidPrices}.</p>}
               {/* Projection Results */}
               <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">
                     <span>Estimated Impact</span>
                     <span>Estimate Only</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-[var(--theme-text-secondary)] font-medium">Est. Revenue Delta</span>
                     <span
                        className={`font-mono font-semibold tabular-nums ${
                           simResult && simResult.rev > 0 ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'text-[var(--theme-text-primary)]'
                        }`}
                     >
                        {simResult ? `${simResult.rev > 0 ? '+' : ''}${Math.round(simResult.rev)}%` : '--'}
                     </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-[var(--theme-text-secondary)] font-medium">Est. Gross Profit Delta</span>
                     <span
                        className={`font-mono font-semibold tabular-nums ${
                           !simResult || simResult.margin === null ? 'text-[var(--theme-text-primary)]' : simResult.profitChange < 0 ? 'text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]' : 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]'
                        }`}
                     >
                        {simResult ? simResult.margin === null ? 'Not available' : `${simResult.margin > 0 ? '+' : ''}${simResult.margin}%` : '--'}
                     </span>
                  </div>
               </div>
            </div>

            <div className="pt-5 border-t border-[var(--theme-border)] mt-4">
               <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating || isSubmitting || pricingRulesMutating}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
               >
                  {isSimulating ? <RefreshCw className="animate-spin" size={15} /> : <Zap size={15} />}
                  <span>{isSimulating ? 'Calculating scenario…' : 'Run Simulation'}</span>
               </button>
            </div>
         </div>
      </div>
   );
};
