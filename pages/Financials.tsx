import React from 'react';
import { DollarSign, Globe, TrendingUp, Download, Activity, Target, CreditCard, Briefcase, FileText } from 'lucide-react';
import { useFinancialsState } from '../hooks/useFinancialsState';
import DateRangeSelector from '../components/DateRangeSelector';
import { FinanceProvider } from '../components/financials/FinanceContext';
import OverviewTab from '../components/financials/OverviewTab';
import BudgetTab from '../components/financials/BudgetTab';
import ExpensesTab from '../components/financials/ExpensesTab';
import PayrollTab from '../components/financials/PayrollTab';
import TaxTab from '../components/financials/TaxTab';
import AddExpenseModal from '../components/financials/AddExpenseModal';
import DeleteExpenseModal from '../components/financials/DeleteExpenseModal';
import PayrollModal from '../components/financials/PayrollModal';

export default function Finance() {
   const state = useFinancialsState();

   const TabButton = ({ id, label, icon: Icon }: { id: any; label: string; icon: any }) => (
      <button
         onClick={() => state.setActiveTab(id)}
         className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${state.activeTab === id
            ? 'bg-[#224429] dark:bg-[#EAE5D9] text-[#FAF8F5] dark:text-[#1E3B24]'
            : 'text-stone-500 dark:text-[#7A9E83] hover:text-[#1E3F27] dark:hover:text-white hover:bg-stone-200/20 dark:hover:bg-white/5'
            } `}
      >
         <Icon size={16} className="flex-shrink-0" />
         <span>{label}</span>
      </button>
   );

   return (
      <FinanceProvider value={state}>
         <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                     <DollarSign className="text-cyber-primary" />
                     Financial Command Center
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                     <p className="text-gray-400 text-sm">Enterprise Resource Planning (ERP) & Accounting.</p>
                     <span className="text-gray-600 text-xs">|</span>
                     <span className="text-cyber-primary text-xs font-mono">{state.getDateRangeLabels()}</span>
                  </div>

                  {/* Fiscal Quarter Progress */}
                  {state.dateRange === 'This Quarter' && (
                     <div className="mt-2 w-48">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                           <span>Fiscal Quarter Progress</span>
                           <span>{Math.round(state.getQuarterProgress())}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                           <div
                              className="h-full bg-cyber-primary transition-all duration-500"
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

                  {/* Region Selector */}
                  <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-3 h-10 transition-all hover:border-cyber-primary/50">
                     <Globe size={14} className="text-gray-400 mr-2" />
                     <select
                        aria-label="Select Tax Region"
                        value={state.selectedRegion}
                        onChange={(e) => state.setSelectedRegion(e.target.value as any)}
                        className="bg-transparent border-none text-xs text-white outline-none uppercase font-bold cursor-pointer"
                     >
                        {Object.entries(state.TAX_REGIONS).map(([key, val]: any) => (
                           <option key={key} value={key} className="text-black">{val.name} ({val.rate}%)</option>
                        ))}
                     </select>
                  </div>

                  <div className="h-10 px-4 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                     <TrendingUp size={16} className="text-green-500" />
                     <span className="text-[10px] text-gray-400 uppercase font-bold">Net Margin:</span>
                     <span className="text-sm font-bold text-white font-mono">{state.profitMargin.toFixed(1)}%</span>
                  </div>

                  <div className="flex items-center gap-2 h-10">
                     <button
                        onClick={state.handleExportPnL}
                        className="h-full bg-white/5 text-[#2C4D35] dark:text-[#A9CBA2] border border-[#E2DCCE] dark:border-emerald-950/20 px-4 rounded-xl text-sm hover:bg-stone-200/20 dark:hover:bg-white/10 flex items-center transition-all"
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
               <TabButton id="budget" label="Budget & Forecasting" icon={Target} />
               <TabButton id="expenses" label="Expense Ledger" icon={CreditCard} />
               <TabButton id="payroll" label="Payroll Analysis" icon={Briefcase} />
               <TabButton id="tax" label="Tax & Compliance" icon={FileText} />
            </div>

            {/* Render Active Tab */}
            {state.activeTab === 'overview' && <OverviewTab />}
            {state.activeTab === 'budget' && <BudgetTab />}
            {state.activeTab === 'expenses' && <ExpensesTab />}
            {state.activeTab === 'payroll' && <PayrollTab />}
            {state.activeTab === 'tax' && <TaxTab />}

            {/* Modals */}
            <AddExpenseModal />
            <DeleteExpenseModal />
            <PayrollModal />
         </div>
      </FinanceProvider>
   );
}
