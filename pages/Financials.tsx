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
   Users
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

export default function Finance() {
   const state = useFinancialsState();

   const TabButton = ({ id, label, icon: Icon }: { id: any; label: string; icon: any }) => (
      <button
         onClick={() => state.setActiveTab(id)}
         className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            state.activeTab === id
               ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24] font-bold shadow-sm'
               : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white hover:bg-stone-200/40 dark:hover:bg-white/5'
         }`}
      >
         <Icon size={14} className="flex-shrink-0" />
         <span>{label}</span>
      </button>
   );

   return (
      <FinanceProvider value={state}>
         <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h2 className="text-2xl font-bold text-[#1E3F27] dark:text-white flex items-center gap-2">
                     <DollarSign className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                     Financial Command Center
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                     <p className="text-stone-500 dark:text-gray-400 text-sm">Enterprise Resource Planning (ERP) & Zero-Trust Accounting.</p>
                     <span className="text-stone-300 dark:text-gray-600 text-xs">|</span>
                     <span className="text-[#2C5E3B] dark:text-[#A9CBA2] text-xs font-mono">{state.getDateRangeLabels()}</span>
                  </div>

                  {/* Fiscal Quarter Progress */}
                  {state.dateRange === 'This Quarter' && (
                     <div className="mt-2 w-48">
                        <div className="flex justify-between text-[10px] text-stone-500 dark:text-gray-400 mb-1">
                           <span>Fiscal Quarter Progress</span>
                           <span>{Math.round(state.getQuarterProgress())}%</span>
                        </div>
                        <div className="h-1 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden">
                           <div
                              className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] transition-all duration-500"
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
                  <div className="flex items-center bg-white/90 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 h-10 transition-all hover:border-[#2C5E3B]/50">
                     <Globe size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] mr-2" />
                     <span className="text-xs font-bold text-[#1E3F27] dark:text-white uppercase tracking-wider">
                        {state.currentTaxConfig.taxName} ({state.currentTaxConfig.rate}%)
                     </span>
                  </div>

                  <div className="h-10 px-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                     <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                     <span className="text-[10px] text-stone-500 dark:text-gray-400 uppercase font-bold">Net Margin:</span>
                     <span className="text-sm font-bold text-[#1E3F27] dark:text-white font-mono">{state.profitMargin.toFixed(1)}%</span>
                  </div>

                  <div className="flex items-center gap-2 h-10">
                     <button
                        onClick={state.handleExportPnL}
                        className="h-full bg-white/80 dark:bg-white/5 text-[#2C4D35] dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-emerald-950/20 px-4 rounded-xl text-sm hover:bg-stone-100 dark:hover:bg-white/10 flex items-center transition-all"
                     >
                        <Download className="w-4 h-4 mr-2" /> JSON
                     </button>
                     <button
                        onClick={state.handleGenerateReport}
                        className="h-full woody-btn-primary flex items-center"
                     >
                        <Download className="w-4 h-4 mr-2" /> PDF Report
                     </button>
                  </div>
               </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 p-1.5 rounded-xl w-fit">
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
