import React from 'react';
import {
   DollarSign,
   Globe,
   TrendingUp,
   Download,
   Activity,
   Target,
   CreditCard,
   Briefcase,
   FileText,
   ShieldCheck,
   Receipt,
   BookOpen,
   Coins,
   TrendingDown,
   Layers,
   Users,
   ShieldAlert,
   Clock
} from 'lucide-react';
import { useFinancialsState } from '../hooks/useFinancialsState';
import DateRangeSelector from '../components/DateRangeSelector';
import { FinanceProvider } from '../components/financials/FinanceContext';
import OverviewTab from '../components/financials/OverviewTab';
import BudgetTab from '../components/financials/BudgetTab';
import ExpensesTab from '../components/financials/ExpensesTab';
import DrawerReconciliationTab from '../components/financials/DrawerReconciliationTab';
import AccountsPayableTab from '../components/financials/AccountsPayableTab';
import AccountsReceivableTab from '../components/financials/AccountsReceivableTab';
import GeneralLedgerTab from '../components/financials/GeneralLedgerTab';
import PettyCashTab from '../components/financials/PettyCashTab';
import LowMarginQueueTab from '../components/financials/LowMarginQueueTab';
import RoleWorkbenchTab from '../components/financials/RoleWorkbenchTab';
import PayrollTab from '../components/financials/PayrollTab';
import TaxTab from '../components/financials/TaxTab';
import AddExpenseModal from '../components/financials/AddExpenseModal';
import VoidExpenseModal from '../components/financials/VoidExpenseModal';
import PayrollModal from '../components/financials/PayrollModal';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { RegionalScopeBanner } from '../components/regional-ops/RegionalScopeBanner';

export default function Finance() {
   const state = useFinancialsState();
   const { user } = useStore();
   const { isRegionalUser, effectiveCountry } = useData();

   const isRegionalStaff = isRegionalUser || user?.scopeLevel === 'REGIONAL' || (user as any)?.scope_level === 'REGIONAL' || [
      'regional_manager',
      'regional_finance_officer'
   ].includes(user?.role || '');

   const TabButton = ({ id, label, icon: Icon }: { id: any; label: string; icon: any }) => (
      <button
         onClick={() => state.setActiveTab(id)}
         className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            state.activeTab === id
               ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs border border-[var(--theme-border)] font-semibold'
               : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]/50'
         }`}
      >
         <Icon size={14} className="shrink-0" />
         <span>{label}</span>
      </button>
   );

   return (
      <FinanceProvider value={state}>
         <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-[var(--theme-text-primary)] flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 dark:bg-[#2997FF]/15 flex items-center justify-center text-[#0071E3] dark:text-[#2997FF] shrink-0">
                        <DollarSign size={18} />
                     </div>
                     Financial Command Center
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                     <p className="text-[13px] text-[var(--theme-text-secondary)]">Enterprise Resource Planning (ERP) & Zero-Trust Accounting.</p>
                     <span className="text-[var(--theme-border)] text-xs">|</span>
                     <span className="text-xs font-mono text-[var(--theme-text-secondary)] tabular-nums">{state.getDateRangeLabels()}</span>
                  </div>

                  {/* Fiscal Quarter Progress */}
                  {state.dateRange === 'This Quarter' && (
                     <div className="mt-2.5 w-48">
                        <div className="flex justify-between text-[11px] text-[var(--theme-text-secondary)] mb-1">
                           <span>Fiscal Quarter Progress</span>
                           <span className="font-mono tabular-nums">{Math.round(state.getQuarterProgress())}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden">
                           <div
                              className="h-full bg-[#0071E3] dark:bg-[#2997FF] transition-all duration-500 rounded-full"
                              ref={(el) => { if (el) el.style.width = `${state.getQuarterProgress()}%`; }}
                           />
                        </div>
                     </div>
                  )}
               </div>
               <div className="flex flex-wrap items-center gap-3">
                  <DateRangeSelector
                     value={state.dateRange}
                     onChange={(val) => state.setDateRange(val)}
                  />

                  {/* Sovereign Tax Authority Badge (Invisible Tenancy: Auto-Derived, No Dropdown) */}
                  <div className="flex items-center bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 h-9 shadow-xs">
                     <Globe size={14} className="text-[var(--theme-text-secondary)] mr-2 shrink-0" />
                     <span className="text-xs font-medium text-[var(--theme-text-primary)] uppercase tracking-wider">
                        {state.currentTaxConfig.taxName} ({state.currentTaxConfig.rate}%)
                     </span>
                  </div>

                  <div className="h-9 px-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                     <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                     <span className="text-xs text-[var(--theme-text-secondary)]">Margin:</span>
                     <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{state.profitMargin.toFixed(1)}%</span>
                  </div>

                  {/* Maker-Checker Sign-off Hub Badge */}
                  {(() => {
                     const pendingExpenses = (state.expenses || []).filter(e => e.status === 'Pending').length;
                     const userRole = state.user?.role;
                     const isManager = Boolean(userRole && ['head_of_finance', 'finance_head', 'finance_manager', 'country_managing_director', 'admin', 'super_admin', 'CEO', 'ceo'].includes(userRole));

                     if (pendingExpenses === 0) return null;

                     return isManager ? (
                        <button
                           type="button"
                           onClick={() => state.setActiveTab('expenses')}
                           className="h-9 px-3 flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all cursor-pointer shadow-xs"
                           title={`${pendingExpenses} staff expense voucher(s) awaiting manager sign-off`}
                        >
                           <ShieldAlert size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                           <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                              {pendingExpenses} Pending Sign-Off{pendingExpenses > 1 ? 's' : ''}
                           </span>
                        </button>
                     ) : (
                        <button
                           type="button"
                           onClick={() => state.setActiveTab('expenses')}
                           className="h-9 px-3 flex items-center gap-1.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl transition-all cursor-pointer shadow-xs"
                           title={`${pendingExpenses} expense voucher(s) submitted and awaiting manager review`}
                        >
                           <Clock size={14} className="text-[var(--theme-text-secondary)] shrink-0" />
                           <span className="text-xs font-medium text-[var(--theme-text-secondary)] font-mono tabular-nums">
                              {pendingExpenses} In Review
                           </span>
                        </button>
                     );
                  })()}

                  <div className="flex items-center gap-2 h-9">
                     <button
                        onClick={state.handleExportPnL}
                        className="h-full bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] px-3.5 rounded-xl text-xs font-medium flex items-center transition-colors shadow-xs"
                     >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> JSON
                     </button>
                     <button
                        onClick={state.handleGenerateReport}
                        className="h-full bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white px-3.5 rounded-xl text-xs font-semibold flex items-center transition-all shadow-xs"
                     >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> PDF Report
                     </button>
                  </div>
               </div>
            </div>

            {/* Adaptive Regional Territory Lens */}
            <RegionalScopeBanner
               moduleName="Financials"
               guardrailBadge={
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#0071E3] dark:text-[#2997FF] text-xs font-semibold">
                     <span>Max Petty Cash Float: {effectiveCountry === 'KE' ? 'KES 25,000' : 'ETB 50,000'}</span>
                  </div>
               }
            />

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-1 rounded-xl w-fit max-w-full overflow-x-auto shadow-xs">
               {isRegionalStaff ? (
                  <>
                     <TabButton id="drawer" label="Drawer Reconciliation" icon={ShieldCheck} />
                     <TabButton id="petty_cash" label="Petty Cash & Floats" icon={Coins} />
                     <TabButton id="expenses" label="Expense Ledger" icon={CreditCard} />
                     <TabButton id="ar" label="Accounts Receivable (B2B)" icon={Users} />
                     <TabButton id="overview" label="Regional P&L Overview" icon={Activity} />
                  </>
               ) : (
                  <>
                     <TabButton id="overview" label="P&L Overview" icon={Activity} />
                     <TabButton id="expenses" label="Expense Ledger" icon={CreditCard} />
                     <TabButton id="drawer" label="Drawer Reconciliation" icon={ShieldCheck} />
                     <TabButton id="ap" label="Accounts Payable (3-Way)" icon={Receipt} />
                     <TabButton id="ar" label="Accounts Receivable (B2B)" icon={Users} />
                     <TabButton id="gl" label="General Ledger & Close" icon={BookOpen} />
                     <TabButton id="petty_cash" label="Petty Cash & Floats" icon={Coins} />
                     <TabButton id="budget" label="Budgets & Gateway" icon={Target} />
                     <TabButton id="margin" label="Margin Protection" icon={TrendingDown} />
                     <TabButton id="workbenches" label="Role Workbenches" icon={Layers} />
                     <TabButton id="payroll" label="Payroll Analysis" icon={Briefcase} />
                     <TabButton id="tax" label="Tax & Compliance" icon={FileText} />
                  </>
               )}
            </div>

            {/* Render Active Tab */}
            {state.activeTab === 'overview' && <OverviewTab />}
            {state.activeTab === 'expenses' && <ExpensesTab />}
            {state.activeTab === 'drawer' && <DrawerReconciliationTab />}
            {state.activeTab === 'ap' && <AccountsPayableTab />}
            {state.activeTab === 'ar' && <AccountsReceivableTab />}
            {state.activeTab === 'gl' && <GeneralLedgerTab />}
            {state.activeTab === 'petty_cash' && <PettyCashTab />}
            {state.activeTab === 'budget' && <BudgetTab />}
            {state.activeTab === 'margin' && <LowMarginQueueTab />}
            {state.activeTab === 'workbenches' && <RoleWorkbenchTab />}
            {state.activeTab === 'payroll' && <PayrollTab />}
            {state.activeTab === 'tax' && <TaxTab />}

            {/* Modals */}
            <AddExpenseModal />
            <VoidExpenseModal />
            <PayrollModal />
         </div>
      </FinanceProvider>
   );
}
