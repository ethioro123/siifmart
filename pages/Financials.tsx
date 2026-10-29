import { useApprovalDestination } from '../hooks/useApprovalDestination';
import POFinanceApprovalsTab from '../components/financials/POFinanceApprovalsTab';
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
   useApprovalDestination(params => { const tab=params.get('tab'); if (tab && ['po_approvals','expenses','margin','payroll'].includes(tab)) { state.setActiveTab(tab); if (tab==='payroll') state.setIsPayrollModalOpen(true); } });
   const { user } = useStore();
   const { isRegionalUser, effectiveCountry, regions, activeRegionCode } = useData();

   const isRegionalStaff = isRegionalUser || user?.scopeLevel === 'REGIONAL' || (user as any)?.scope_level === 'REGIONAL' || ['regional_operations_manager', 'area_operations_manager', 'regional_finance_manager'].includes(user?.role || '');

   const targetRegionCode = activeRegionCode || user?.regionCode || (user as any)?.region_code;
   const activeRegion = (regions || []).find(r => r.code === targetRegionCode);
   const autonomousExpenseLimit = activeRegion?.autonomous_expense_limit ?? (effectiveCountry === 'KE' ? 85000 : 35000);

   const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
      <button
         id={`financials-tab-${id}`}
         type="button"
         role="tab"
         aria-selected={state.activeTab === id}
         aria-controls="financials-panel"
         tabIndex={state.activeTab === id ? 0 : -1}
         onClick={() => state.setActiveTab(id)}
         onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') || []);
            const currentIndex = tabs.indexOf(event.currentTarget);
            const nextIndex = event.key === 'Home'
               ? 0
               : event.key === 'End'
                  ? tabs.length - 1
                  : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            tabs[nextIndex]?.focus();
            tabs[nextIndex]?.click();
         }}
         className={`flex min-h-11 items-center gap-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] ${
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
                     <div className="w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 flex items-center justify-center text-[var(--theme-accent)] dark:text-[var(--theme-accent)] shrink-0">
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
                              className="h-full bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] transition-all duration-500 rounded-full"
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

                  <div className="h-9 px-3 flex items-center gap-2 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-xl">
                     <TrendingUp size={14} className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] shrink-0" />
                     <span className="text-xs text-[var(--theme-text-secondary)]">Margin:</span>
                     <span className="text-xs font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-mono tabular-nums">{state.profitMargin.toFixed(1)}%</span>
                  </div>

                  {/* Maker-Checker Sign-off Hub Badge */}
                  {(() => {
                     const pendingExpenses = (state.expenses || []).filter(e => e.status === 'Pending').length;
                     const userRole = state.user?.role?.toLowerCase() || '';
                     const isManager = Boolean(userRole && ['country_finance_director', 'regional_finance_manager', 'country_operations_director', 'regional_operations_manager', 'area_operations_manager', 'country_managing_director', 'managing_director', 'group_ceo'].map(r => r.toLowerCase()).includes(userRole));

                     if (pendingExpenses === 0) return null;

                     return isManager ? (
                        <button
                           type="button"
                           onClick={() => state.setActiveTab('expenses')}
                           className="h-9 px-3 flex items-center gap-1.5 bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl transition-all cursor-pointer shadow-xs"
                           title={`${pendingExpenses} staff expense voucher(s) awaiting manager sign-off`}
                        >
                           <ShieldAlert size={14} className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] shrink-0" />
                           <span className="text-xs font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-mono tabular-nums">
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
                        type="button"
                        onClick={state.handleExportPnL}
                        className="min-h-11 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] px-3.5 rounded-xl text-xs font-medium flex items-center transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
                     >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> JSON
                     </button>
                     <button
                        type="button"
                        onClick={state.handleGenerateReport}
                        className="min-h-11 bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-95 px-3.5 rounded-xl text-xs font-semibold flex items-center transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
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
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] text-xs font-semibold">
                     <span>Autonomous Expense Limit: {effectiveCountry === 'KE' ? 'KES' : 'ETB'} {Number(autonomousExpenseLimit).toLocaleString()}</span>
                  </div>
               }
            />

            {/* Tabs */}
            <div role="tablist" aria-label="Financial sections" className="flex items-center gap-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-1 rounded-xl w-full max-w-full overflow-x-auto shadow-xs">
               {isRegionalStaff ? (
                  <>
                     <TabButton id="drawer" label="Drawer Reconciliation" icon={ShieldCheck} />
                     <TabButton id="petty_cash" label="Petty Cash & Floats" icon={Coins} />
                     <TabButton id="expenses" label="Expense Ledger" icon={CreditCard} />
                     <TabButton id="ap" label="Accounts Payable (3-Way)" icon={Receipt} />
                     <TabButton id="ar" label="Accounts Receivable (B2B)" icon={Users} />
                     <TabButton id="budget" label="Budgets & Gateway" icon={Target} />
                     <TabButton id="payroll" label="Payroll Analysis" icon={Briefcase} />
                     <TabButton id="overview" label="Regional P&L Overview" icon={Activity} />
                  </>
               ) : (
                  <>
                     {user?.role === 'country_finance_director' && <TabButton id="po_approvals" label="PO Approvals" icon={ShieldCheck} />}
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
            <div
               id="financials-panel"
               role="tabpanel"
               aria-labelledby={`financials-tab-${state.activeTab}`}
               tabIndex={0}
               className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)] rounded-xl"
            >
               {state.activeTab === 'po_approvals' && <POFinanceApprovalsTab key={effectiveCountry} />}
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
            </div>

            {/* Modals */}
            <AddExpenseModal />
            <VoidExpenseModal />
            <PayrollModal />
         </div>
      </FinanceProvider>
   );
}
