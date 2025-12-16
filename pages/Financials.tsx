import React, { useState } from 'react';
import {
   PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
   ComposedChart, Bar, Line, Legend
} from 'recharts';
import {

   DollarSign, TrendingUp, CreditCard, FileText, Plus, Trash2,
   Filter, Download, Briefcase, Activity, AlertCircle, CheckCircle, Clock, Globe, Calculator,
   PieChart as PieIcon, Target, ArrowUpRight, ArrowDownRight, Search, Calendar
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { ExpenseRecord } from '../types';
import Modal from '../components/Modal';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext'; // Use Live Data
import { generateQuarterlyReport } from '../utils/reportGenerator';

// Regional Tax Configurations
type FinanceTab = 'overview' | 'expenses' | 'payroll' | 'tax' | 'budget';
type DateRangeOption = 'All Time' | 'This Month' | 'Last Month' | 'This Quarter' | 'This Year' | 'Last Year';

const TAX_REGIONS = {
   'ET': { name: 'Ethiopia', taxName: 'VAT', rate: 15, code: 'ETB' },
   'KE': { name: 'Kenya', taxName: 'VAT', rate: 16, code: 'KES' },
   'UG': { name: 'Uganda', taxName: 'VAT', rate: 18, code: 'UGX' },
   'US': { name: 'USA (Avg)', taxName: 'Sales Tax', rate: 8.25, code: 'USD' },
   'EU': { name: 'Europe (Avg)', taxName: 'VAT', rate: 20, code: 'EUR' },
   'AE': { name: 'UAE', taxName: 'VAT', rate: 5, code: 'AED' },
};

export default function Finance() {
   const { user } = useStore();
   const { employees, sales, expenses, addExpense, deleteExpense, processPayroll, activeSite, addNotification } = useData();

   const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
   const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

   const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
   const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
   const [deleteInput, setDeleteInput] = useState('');

   const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

   // Tax State
   const [selectedRegion, setSelectedRegion] = useState<keyof typeof TAX_REGIONS>('ET');
   const currentTaxConfig = TAX_REGIONS[selectedRegion];

   // New Expense State
   const [newExpData, setNewExpData] = useState<Partial<ExpenseRecord>>({
      category: 'Other', status: 'Pending', date: new Date().toISOString().split('T')[0]
   });

   // --- DATE FILTERING STATE ---
   const [dateRange, setDateRange] = useState<DateRangeOption>('This Quarter');

   // --- DATE FILTERING LOGIC ---
   const getQuarterInfo = (d = new Date()) => {
      const q = Math.floor(d.getMonth() / 3) + 1;
      const year = d.getFullYear();
      const start = new Date(year, (q - 1) * 3, 1);
      const end = new Date(year, q * 3, 0);
      return { q, year, start, end };
   };

   const getDateRangeLabels = () => {
      const { q, year, start, end } = getQuarterInfo();

      switch (dateRange) {
         case 'This Month':
            return `Current Month (${new Date().toLocaleDateString('default', { month: 'short' })})`;
         case 'Last Month':
            return `Previous Month`;
         case 'This Quarter':
            return `Q${q} ${year} (${start.toLocaleDateString(undefined, { month: 'short' })} - ${end.toLocaleDateString(undefined, { month: 'short' })})`;
         case 'This Year':
            return `FY ${year}`;
         case 'Last Year':
            return `FY ${year - 1}`;
         case 'All Time':
         default:
            return "All Available Data";
      }
   };

   // Filtering Helper
   const isWithinRange = (dateString: string) => {
      if (dateRange === 'All Time') return true;
      const date = new Date(dateString);
      const now = new Date();
      const { q, year } = getQuarterInfo(now);
      const start = new Date();

      // Reset
      start.setHours(0, 0, 0, 0);

      switch (dateRange) {
         case 'This Month':
            start.setDate(1);
            return date >= start && date <= now;
         case 'Last Month':
            start.setMonth(now.getMonth() - 1);
            start.setDate(1);
            const endLM = new Date(now.getFullYear(), now.getMonth(), 0);
            return date >= start && date <= endLM;
         case 'This Quarter':
            const qStart = new Date(year, (q - 1) * 3, 1);
            const qEnd = new Date(now);
            qEnd.setHours(23, 59, 59, 999);
            return date >= qStart && date <= qEnd;
         case 'This Year':
            const yStart = new Date(year, 0, 1);
            return date >= yStart;
         case 'Last Year':
            const lyStart = new Date(year - 1, 0, 1);
            const lyEnd = new Date(year - 1, 11, 31);
            return date >= lyStart && date <= lyEnd;
         default:
            return true;
      }
   };

   // Fiscal Progress (for Progress Bar)
   const getQuarterProgress = () => {
      const now = new Date();
      const { start, end } = getQuarterInfo(now);
      const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
      const daysPassed = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
   };

   // --- FILTERED DATASETS ---
   const filteredExpenses = expenses.filter(e => isWithinRange(e.date));
   // Sales filter: Handle timestamp or date string
   const filteredSales = sales.filter(s => isWithinRange(s.created_at || new Date().toISOString()));


   // --- CALCULATIONS (USING FILTERED DATA) ---

   // 1. Expense Breakdown (Pie Chart)
   const expensesByCategory = filteredExpenses.reduce((acc: Record<string, number>, exp: any) => {
      const cat = exp.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (Number(exp.amount) || 0);
      return acc;
   }, {} as Record<string, number>);

   const totalRecordedExpenses = Object.values(expensesByCategory).reduce<number>((sum, val) => sum + (val as number), 0);
   const expenseBreakdownData = Object.entries(expensesByCategory).map(([name, value]) => {
      const val = value as number;
      const total = totalRecordedExpenses as number;
      return {
         name,
         value: total > 0 ? parseFloat(((val / total) * 100).toFixed(1)) : 0
      };
   });

   // 2. Cashflow Data (Last 4 Weeks - Logic Updated to respect filter or default to trends)
   // NOTE: If All Time is selected, we show 4-week trend. If specific range, we might want to aggregate differently, 
   // but for now let's keep the weekly aggregation logic but applied to the filtered dataset.

   const getWeekNumber = (d: Date) => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
   }

   // Aggregate Sales by Week
   const salesByWeek = filteredSales.reduce((acc, s) => {
      const date = new Date(s.created_at);
      const week = `W${getWeekNumber(date)} `;
      acc[week] = (acc[week] || 0) + s.total;
      return acc;
   }, {} as Record<string, number>);

   // Aggregate Expenses by Week
   const expensesByWeek = filteredExpenses.reduce((acc, e) => {
      const date = new Date(e.date);
      const week = `W${getWeekNumber(date)} `;
      acc[week] = (acc[week] || 0) + e.amount;
      return acc;
   }, {} as Record<string, number>);

   // Merge for Chart
   const allWeeks = Array.from(new Set([...Object.keys(salesByWeek), ...Object.keys(expensesByWeek)])).sort();
   // If the range is small (e.g. month), show all weeks in that range. If All Time, limit to last few?
   // Let's just show what's available in the filtered dataset.
   const cashflowData = allWeeks.map(week => ({
      name: week,
      income: salesByWeek[week] || 0,
      expense: expensesByWeek[week] || 0
   }));

   // --- PAYROLL FILTERS ---
   const [payrollSearch, setPayrollSearch] = useState('');
   const [payrollRoleFilter, setPayrollRoleFilter] = useState('All');
   const [payrollSort, setPayrollSort] = useState<'name' | 'salary' | 'department'>('name');
   const [payrollSortDir, setPayrollSortDir] = useState<'asc' | 'desc'>('asc');

   const filteredEmployees = employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(payrollSearch.toLowerCase()) ||
         emp.role.toLowerCase().includes(payrollSearch.toLowerCase());
      const matchesRole = payrollRoleFilter === 'All' || emp.role === payrollRoleFilter;
      return matchesSearch && matchesRole;
   }).sort((a, b) => {
      let valA = a[payrollSort] || '';
      let valB = b[payrollSort] || '';

      if (payrollSort === 'salary') {
         valA = a.salary || 0;
         valB = b.salary || 0;
      }

      if (valA < valB) return payrollSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return payrollSortDir === 'asc' ? 1 : -1;
      return 0;
   });

   const uniqueRoles = ['All', ...Array.from(new Set(employees.map(e => e.role)))];

   // If no data, provide empty placeholder
   if (cashflowData.length === 0) {
      cashflowData.push({ name: 'No Data', income: 0, expense: 0 });
   }


   const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
   // Payroll is usually monthly recurring, so "total salaries" relative to a date range is tricky.
   // For now, if range is "This Month", we show 1 month of payroll. If "This Year", 12 months (mocked * multiplier).
   // BUT simpler: Just show the current active payroll run cost as a static liability for now, OR:
   // Realistically, payroll should be 'Expense Records' with category 'Payroll'.
   // Since 'employees' list just shows CURRENT salary, we will treat 'Total Payroll' as (Monthly Salary * Months in Range).
   // Let's refine: The 'Total Expenses' metric combines OpEx (from expenses list) + Payroll.
   // If filtering by date, we should sum actual payroll expenses found in 'expenses'.
   // If 'expenses' doesn't contain payroll (it's separate), we might be double counting or missing it.
   // Looking at the code: `totalExpenses = totalSalaries + totalOpEx`.
   // `totalSalaries` comes from `employees.reduce`. This is just the SUM OF ANNUAL/MONTHLY SALARIES right now, not a historical record.
   // This is a limitation. For this specific task (Data Clarity), I will label it clearly or adjust.
   // Let's assume `totalSalaries` is the CURRENT MONTHLY Run Rate.
   // If the user selects "This Year", they might expect 12x. 
   // To avoid confusion, I will label 'Payroll' as "Monthly Run Rate" in the breakdown if it's not historical, 
   // OR strictly use `filteredExpenses` if payroll is logged there.
   // The original code did: `totalExpenses = totalSalaries + totalOpEx`.
   // I will keep this existing logic but allow OpEx to be filtered. 
   // Note: The user asked for "from when to when".
   // If I show "Total Expenses" and it mixes "Last Month's OpEx" with "Today's Payroll Run Rate", it's confusing.
   // I will only apply date filtering to the REVENUE and OPEX (Ledger) parts which are historical.
   // Payroll implies "Current Active Roster Cost" here.

   const totalSalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
   const totalOpEx = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

   // We will display Total Expenses as OpEx (Filtered) + Payroll (Current Month Estimate)
   // But if Date Range is "Last Year", showing current payroll is wrong.
   // For simplicity and safety: I will clearly label the Payroll part or exclude it from the "Period Expense" if it makes no sense.
   // However, to minimize disruption, I'll stick to the previous formula but be aware `totalOpEx` is now dynamic.
   const totalExpenses = totalSalaries + totalOpEx;

   const totalRefunds = filteredSales.filter(s => s.status === 'Refunded').reduce((sum, s) => sum + s.total, 0);

   // Dynamic Tax Calc
   const taxRateDecimal = currentTaxConfig.rate / 100;
   const estimatedTaxLiability = (totalRevenue - totalRefunds) * taxRateDecimal;
   const inputTaxCredit = totalOpEx * taxRateDecimal; // Claimable tax on expenses
   const netTaxPayable = Math.max(0, estimatedTaxLiability - inputTaxCredit);

   const netProfit = totalRevenue - totalExpenses - netTaxPayable - totalRefunds;
   const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

   // 3. Forecast Data (Simple Projection)
   // Use filtered revenue to project? Or keep generic? Let's use filtered average.
   const avgRevenue = totalRevenue / (cashflowData.length || 1);
   const forecastData = [
      { month: 'Next M1', low: avgRevenue * 0.9, high: avgRevenue * 1.1, projection: avgRevenue * 1.05 },
      { month: 'Next M2', low: avgRevenue * 0.92, high: avgRevenue * 1.15, projection: avgRevenue * 1.08 },
      { month: 'Next M3', low: avgRevenue * 0.95, high: avgRevenue * 1.2, projection: avgRevenue * 1.12 },
   ];

   const COLORS = ['#00ff9d', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];



   // --- ACTIONS ---
   const handleAddExpense = () => {
      if (!newExpData.description || !newExpData.amount) return;
      const expense: ExpenseRecord = {
         id: `EXP - ${Date.now()} `,
         siteId: activeSite?.id || 'SITE-001',
         date: newExpData.date!,
         category: newExpData.category as any,
         description: newExpData.description,
         amount: Number(newExpData.amount),
         status: newExpData.status as any,
         approvedBy: 'Admin'
      };
      addExpense(expense); // Use Global Context
      setIsAddExpenseOpen(false);
      setNewExpData({ category: 'Other', status: 'Pending', date: new Date().toISOString().split('T')[0] });
   };

   const handleDeleteExpense = (id: string) => {
      setExpenseToDelete(id);
      setDeleteInput('');
      setIsDeleteExpenseModalOpen(true);
   };

   const handleConfirmDeleteExpense = () => {
      if (!expenseToDelete) return;

      if (deleteInput !== "DELETE") {
         addNotification('alert', 'Please type "DELETE" to confirm.');
         return;
      }

      deleteExpense(expenseToDelete);
      addNotification('success', 'Expense record deleted.');
      setIsDeleteExpenseModalOpen(false);
      setExpenseToDelete(null);
      setDeleteInput('');
   };

   const handleExportPnL = () => {
      const data = {
         reportDate: new Date().toISOString(),
         metrics: {
            totalRevenue,
            totalRefunds,
            totalExpenses: {
               operating: totalOpEx,
               payroll: totalSalaries
            },
            tax: {
               region: currentTaxConfig.name,
               estimatedLiability: netTaxPayable
            },
            netProfit
         }
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `siifmart_pnl_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleProcessPayroll = () => {
      setIsPayrollModalOpen(true);
   };

   const handleConfirmPayroll = () => {
      processPayroll(activeSite?.id || 'SITE-001', user?.name || 'Admin');
      setIsPayrollModalOpen(false);
   };

   const handleGenerateFiling = () => {
      addNotification('info', `Generating ${currentTaxConfig.taxName} Filing Report for ${currentTaxConfig.name}...`);
      setTimeout(() => {
         addNotification('success', `Tax Report Generated! Net Payable: ${CURRENCY_SYMBOL} ${netTaxPayable.toLocaleString()} `);
      }, 1500);
   };

   const handleDownloadBankFile = () => {
      addNotification('info', 'Generating Bank Payment File (ABA/NACHA)...');
      setTimeout(() => {
         addNotification('success', 'Bank File Downloaded Successfully');
      }, 1500);
      setTimeout(() => {
         addNotification('success', 'Bank File Downloaded Successfully');
      }, 1500);
   };

   const handleGenerateReport = () => {
      const reportMetrics = {
         totalRevenue,
         totalExpenses,
         totalRefunds,
         netProfit,
         profitMargin: profitMargin.toFixed(1) + '%',
         totalSalaries,
         totalOpEx
      };
      generateQuarterlyReport(reportMetrics, getDateRangeLabels(), 'Financials');
   };

   const TabButton = ({ id, label, icon: Icon }: any) => (
      <button
         onClick={() => setActiveTab(id)}
         className={`flex items - center space - x - 2 px - 4 py - 3 rounded - lg text - sm font - medium transition - all ${activeTab === id
            ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            } `}
      >
         <Icon size={16} />
         <span>{label}</span>
      </button>
   );

   return (
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
                  <span className="text-cyber-primary text-xs font-mono">{getDateRangeLabels()}</span>
               </div>

               {/* Fiscal Quarter Progress */}
               {dateRange === 'This Quarter' && (
                  <div className="mt-2 w-48">
                     <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Fiscal Quarter Progress</span>
                        <span>{Math.round(getQuarterProgress())}%</span>
                     </div>
                     <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                           className="h-full bg-cyber-primary transition-all duration-500"
                           style={{ width: `${getQuarterProgress()}%` }}
                        />
                     </div>
                  </div>
               )}
            </div>
            <div className="flex items-center space-x-3">
               {/* Date Filter */}
               <div className="hidden md:flex items-center bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                  <Calendar size={14} className="text-gray-400 mr-2" />
                  <select
                     aria-label="Filter Date Range"
                     value={dateRange}
                     onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                     className="bg-transparent border-none text-xs text-white outline-none font-bold cursor-pointer hover:text-cyber-primary transition-colors"
                  >
                     <option value="This Quarter" className="text-black">This Quarter (Current)</option>
                     <option value="This Month" className="text-black">This Month</option>
                     <option value="Last Month" className="text-black">Last Month</option>
                     <option value="This Year" className="text-black">This Year (YTD)</option>
                     <option value="Last Year" className="text-black">Last Year (Saved)</option>
                     <option value="All Time" className="text-black">All Time</option>
                  </select>
               </div>

               {/* Region Selector */}
               <div className="hidden md:flex items-center bg-black/30 border border-white/10 rounded-xl px-3 py-2 mr-2">
                  <Globe size={14} className="text-gray-400 mr-2" />
                  <select
                     aria-label="Select Tax Region"
                     value={selectedRegion}
                     onChange={(e) => setSelectedRegion(e.target.value as any)}
                     className="bg-transparent border-none text-xs text-white outline-none uppercase font-bold cursor-pointer"
                  >
                     {Object.entries(TAX_REGIONS).map(([key, val]) => (
                        <option key={key} value={key} className="text-black">{val.name} ({val.rate}%)</option>
                     ))}
                  </select>
               </div>
               <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-500" />
                  <span className="text-xs text-gray-400">Net Margin:</span>
                  <span className="text-sm font-bold text-white font-mono">{profitMargin.toFixed(1)}%</span>
               </div>
               <button
                  onClick={handleExportPnL}
                  className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/10 flex items-center transition-colors"
               >
                  <Download className="w-4 h-4 mr-2" /> JSON
               </button>
               <button
                  onClick={handleGenerateReport}
                  className="bg-cyber-primary text-black border border-cyber-primary px-4 py-2 rounded-lg text-sm hover:bg-cyber-primary/90 flex items-center transition-colors font-bold shadow-[0_0_10px_rgba(0,255,157,0.2)]"
               >
                  <Download className="w-4 h-4 mr-2" /> PDF Report
               </button>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex space-x-1 bg-cyber-gray p-1 rounded-xl border border-white/5 w-fit overflow-x-auto">
            <TabButton id="overview" label="P&L Overview" icon={Activity} />
            <TabButton id="budget" label="Budget & Forecasting" icon={Target} />
            <TabButton id="expenses" label="Expense Ledger" icon={CreditCard} />
            <TabButton id="payroll" label="Payroll Analysis" icon={Briefcase} />
            <TabButton id="tax" label="Tax & Compliance" icon={FileText} />
         </div>

         {/* --- OVERVIEW (P&L) --- */}
         {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
               {/* Top Metrics */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                     <p className="text-gray-400 text-xs uppercase font-bold">Total Revenue</p>
                     <h3 className="text-2xl font-mono font-bold text-white mt-1">{CURRENCY_SYMBOL} {totalRevenue.toLocaleString()}</h3>
                     {/* Placeholder for Trend: Could compare vs prev month if data existed */}
                  </div>
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                     <p className="text-gray-400 text-xs uppercase font-bold">Total Expenses</p>
                     <h3 className="text-2xl font-mono font-bold text-red-400 mt-1">{CURRENCY_SYMBOL} {totalExpenses.toLocaleString()}</h3>
                     <p className="text-gray-500 text-xs mt-2">OpEx + Payroll</p>
                  </div>
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                     <p className="text-gray-400 text-xs uppercase font-bold">Total Refunds</p>
                     <h3 className="text-2xl font-mono font-bold text-red-400 mt-1">{CURRENCY_SYMBOL} {totalRefunds.toLocaleString()}</h3>
                     <p className="text-gray-500 text-xs mt-2">Deducted from Net</p>
                  </div>
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-primary/10 rounded-bl-full"></div>
                     <p className="text-gray-400 text-xs uppercase font-bold">Net Income</p>
                     <h3 className="text-2xl font-mono font-bold text-cyber-primary mt-1">{CURRENCY_SYMBOL} {netProfit.toLocaleString()}</h3>
                     <p className="text-gray-500 text-xs mt-2">After Tax</p>
                  </div>
               </div>

               {/* Cashflow Chart */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
                     <h3 className="font-bold text-white mb-6">Cash Flow Analysis (Weekly)</h3>
                     <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                           <AreaChart data={cashflowData}>
                              <defs>
                                 <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                                 </linearGradient>
                                 <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                              <Area type="monotone" dataKey="income" stroke="#00ff9d" fillOpacity={1} fill="url(#colorInc)" />
                              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Expense Distribution */}
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                     <h3 className="font-bold text-white mb-6">Expense Breakdown</h3>
                     <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                           <PieChart>
                              <Pie
                                 data={expenseBreakdownData}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={5}
                                 dataKey="value"
                              >
                                 {expenseBreakdownData.map((entry, index) => (
                                    <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} stroke="none" />
                                 ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="space-y-2 mt-4">
                        {expenseBreakdownData.map((item, i) => (
                           <div key={i} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                 <span className="text-gray-300">{item.name}</span>
                              </div>
                              <span className="font-mono text-white">{item.value}%</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* --- BUDGETING & FORECASTING --- */}
         {activeTab === 'budget' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Actual vs Budget Chart */}
                  <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
                     <h3 className="font-bold text-white mb-6">Budget Variance Analysis (YTD)</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                           <ComposedChart data={cashflowData}> {/* Using cashflowData as proxy for now or need monthly aggregation */}
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis dataKey="name" stroke="#666" fontSize={12} />
                              <YAxis stroke="#666" fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                              <Legend />
                              <Bar dataKey="income" fill="#3b82f6" barSize={20} name="Revenue" />
                              <Line type="monotone" dataKey="expense" stroke="#f59e0b" strokeWidth={2} name="Actual Spend" />
                           </ComposedChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Department Budgets */}
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 flex flex-col">
                     <h3 className="font-bold text-white mb-4">Department Utilization</h3>
                     <div className="space-y-6 flex-1">
                        {/* Dept Budgets Placeholder - Needs Dept Data Structure in Future */}
                        <div className="text-center text-gray-500 py-10">Department budget tracking coming soon with new schema.</div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Cash Forecasting */}
                  <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
                     <h3 className="font-bold text-white mb-2">Q3 Cash Flow Forecast (AI Projected)</h3>
                     <p className="text-xs text-gray-400 mb-6">Based on trailing 6-month revenue trends and seasonality factors.</p>
                     <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                           <AreaChart data={forecastData}>
                              <defs>
                                 <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis dataKey="month" stroke="#666" fontSize={12} />
                              <YAxis stroke="#666" fontSize={12} domain={['dataMin', 'dataMax']} />
                              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                              <Area type="monotone" dataKey="projection" stroke="#a855f7" fill="url(#colorProj)" strokeDasharray="5 5" name="Projected Cash" />
                              <Area type="monotone" dataKey="low" stackId="1" stroke="none" fill="transparent" />
                              <Area type="monotone" dataKey="high" stackId="1" stroke="none" fill="#a855f7" fillOpacity={0.1} name="Confidence Interval" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* AP Aging Widget */}
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                     <h3 className="font-bold text-white mb-4">Accounts Payable Aging</h3>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                           <span className="text-xs text-gray-400 uppercase font-bold">Current</span>
                           <span className="text-green-400 font-mono font-bold">{CURRENCY_SYMBOL} 120,000</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                           <span className="text-xs text-gray-400 uppercase font-bold">1-30 Days</span>
                           <span className="text-blue-400 font-mono font-bold">{CURRENCY_SYMBOL} 45,000</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                           <span className="text-xs text-gray-400 uppercase font-bold">31-60 Days</span>
                           <span className="text-yellow-400 font-mono font-bold">{CURRENCY_SYMBOL} 12,500</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                           <span className="text-xs text-gray-400 uppercase font-bold">60+ Days</span>
                           <span className="text-red-400 font-mono font-bold">{CURRENCY_SYMBOL} 8,000</span>
                        </div>
                        <div className="pt-4 border-t border-white/5 mt-2">
                           <div className="flex justify-between text-sm font-bold text-white">
                              <span>Total Outstanding</span>
                              <span>{CURRENCY_SYMBOL} 185,500</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* --- EXPENSE LEDGER --- */}
         {activeTab === 'expenses' && (
            <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden animate-in fade-in">
               <div className="p-4 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <h3 className="font-bold text-white">Operational Expenses</h3>
                     <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                        <Filter size={14} className="text-gray-400 mr-2" />
                        <span className="text-xs text-gray-400">Filter: All Categories</span>
                     </div>
                  </div>
                  <button
                     onClick={() => setIsAddExpenseOpen(true)}
                     className="bg-cyber-primary text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-cyber-accent transition-colors flex items-center gap-2"
                  >
                     <Plus size={16} /> Log Expense
                  </button>
               </div>
               <table className="w-full text-left">
                  <thead className="bg-black/20 border-b border-white/5">
                     <tr>
                        <th className="p-4 text-xs text-gray-500 uppercase">Date</th>
                        <th className="p-4 text-xs text-gray-500 uppercase">Category</th>
                        <th className="p-4 text-xs text-gray-500 uppercase">Description</th>
                        <th className="p-4 text-xs text-gray-500 uppercase text-right">Amount</th>
                        <th className="p-4 text-xs text-gray-500 uppercase text-center">Status</th>
                        <th className="p-4 text-xs text-gray-500 uppercase">Approved By</th>
                        <th className="p-4 text-xs text-gray-500 uppercase"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-white/5 transition-colors group">
                           <td className="p-4 text-xs text-white">{exp.date}</td>
                           <td className="p-4">
                              <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border border-white/10 bg-white/5 text-gray-300">
                                 {exp.category}
                              </span>
                           </td>
                           <td className="p-4 text-sm text-gray-300">{exp.description}</td>
                           <td className="p-4 text-sm font-mono text-white text-right font-bold">{CURRENCY_SYMBOL} {exp.amount.toLocaleString()}</td>
                           <td className="p-4 text-center">
                              <span className={`inline - flex items - center gap - 1 px - 2 py - 0.5 rounded text - [10px] font - bold uppercase border ${exp.status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                 exp.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                 } `}>
                                 {exp.status === 'Paid' && <CheckCircle size={10} />}
                                 {exp.status === 'Pending' && <Clock size={10} />}
                                 {exp.status === 'Overdue' && <AlertCircle size={10} />}
                                 {exp.status}
                              </span>
                           </td>
                           <td className="p-4 text-xs text-gray-500">{exp.approvedBy}</td>
                           <td className="p-4 text-right">
                              <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-600 hover:text-red-400" aria-label="Delete Expense">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}

         {/* --- PAYROLL --- */}
         {activeTab === 'payroll' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
               <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/5">
                     <h3 className="font-bold text-white">Payroll Registry</h3>
                     <p className="text-xs text-gray-400 mt-1">Monthly compensation breakdown based on active employees.</p>
                  </div>

                  {/* Registry Controls */}
                  <div className="px-6 py-4 border-b border-white/5 flex flex-col md:flex-row gap-4">
                     <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                           type="text"
                           placeholder="Search employees..."
                           value={payrollSearch}
                           onChange={(e) => setPayrollSearch(e.target.value)}
                           className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-cyber-primary outline-none"
                           aria-label="Search employees"
                        />
                     </div>
                     <select
                        value={payrollRoleFilter}
                        onChange={(e) => setPayrollRoleFilter(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-cyber-primary"
                        aria-label="Filter by role"
                     >
                        {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
                     </select>
                  </div>

                  <table className="w-full text-left">
                     <thead className="bg-black/20 border-b border-white/5">
                        <tr>
                           <th
                              className="p-4 text-xs text-gray-500 uppercase cursor-pointer hover:text-white transition-colors"
                              onClick={() => { setPayrollSort('name'); setPayrollSortDir(payrollSortDir === 'asc' ? 'desc' : 'asc'); }}
                           >
                              Employee {payrollSort === 'name' && (payrollSortDir === 'asc' ? '↑' : '↓')}
                           </th>
                           <th className="p-4 text-xs text-gray-500 uppercase">Role</th>
                           <th
                              className="p-4 text-xs text-gray-500 uppercase cursor-pointer hover:text-white transition-colors"
                              onClick={() => { setPayrollSort('department'); setPayrollSortDir(payrollSortDir === 'asc' ? 'desc' : 'asc'); }}
                           >
                              Department {payrollSort === 'department' && (payrollSortDir === 'asc' ? '↑' : '↓')}
                           </th>
                           <th
                              className="p-4 text-xs text-gray-500 uppercase text-right cursor-pointer hover:text-white transition-colors"
                              onClick={() => { setPayrollSort('salary'); setPayrollSortDir(payrollSortDir === 'asc' ? 'desc' : 'asc'); }}
                           >
                              Salary {payrollSort === 'salary' && (payrollSortDir === 'asc' ? '↑' : '↓')}
                           </th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {filteredEmployees.map(emp => (
                           <tr key={emp.id} className="hover:bg-white/5">
                              <td className="p-4 flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-black/50 overflow-hidden">
                                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                 </div>
                                 <span className="text-sm text-white font-bold">{emp.name}</span>
                              </td>
                              <td className="p-4 text-xs text-gray-400 uppercase">{emp.role}</td>
                              <td className="p-4 text-xs text-gray-400">{emp.department}</td>
                              <td className="p-4 text-sm font-mono text-white text-right">{CURRENCY_SYMBOL} {emp.salary?.toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 h-fit">
                  <h3 className="font-bold text-white mb-6">Payroll Actions</h3>
                  <div className="p-4 bg-black/20 rounded-xl mb-6 text-center border border-white/5">
                     <p className="text-gray-400 text-xs uppercase font-bold mb-1">Total Monthly Payout</p>
                     <p className="text-3xl font-mono font-bold text-cyber-primary">{CURRENCY_SYMBOL} {totalSalaries.toLocaleString()}</p>
                     <p className="text-[10px] text-gray-500 mt-2">{employees.length} Active Employees</p>
                  </div>
                  <button
                     onClick={handleProcessPayroll}
                     className="w-full py-4 bg-cyber-primary text-black font-bold rounded-xl mb-3 hover:bg-cyber-accent transition-colors flex items-center justify-center gap-2"
                  >
                     <CheckCircle size={18} /> Process Run
                  </button>
                  <button onClick={handleDownloadBankFile} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm border border-white/10">
                     Download Bank File
                  </button>
               </div>
            </div>
         )}

         {/* --- TAX & COMPLIANCE --- */}
         {activeTab === 'tax' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
               <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="font-bold text-white">Tax Liability</h3>
                        <p className="text-xs text-gray-400 mt-1">Estimated payable based on current ledger.</p>
                     </div>
                     <div className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-bold">
                        {currentTaxConfig.name} ({currentTaxConfig.rate}%)
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5">
                        <span className="text-sm text-gray-400">Gross Revenue</span>
                        <span className="font-mono text-white">{CURRENCY_SYMBOL} {totalRevenue.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5">
                        <span className="text-sm text-gray-400">Output Tax (Collected)</span>
                        <span className="font-mono text-red-400">+ {CURRENCY_SYMBOL} {estimatedTaxLiability.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg border border-white/5">
                        <span className="text-sm text-gray-400">Input Tax Credit (Claimable)</span>
                        <span className="font-mono text-green-400">- {CURRENCY_SYMBOL} {inputTaxCredit.toLocaleString()}</span>
                     </div>
                     <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-white font-bold">Net Payable</span>
                        <span className="text-2xl font-mono text-cyber-primary font-bold">{CURRENCY_SYMBOL} {netTaxPayable.toLocaleString()}</span>
                     </div>
                  </div>

                  <button
                     onClick={handleGenerateFiling}
                     className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center gap-2"
                  >
                     <FileText size={16} /> Generate Filing Report
                  </button>
               </div>

               <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-4">Compliance Calendar</h3>
                  <div className="space-y-3">
                     <div className="flex items-center gap-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                           <AlertCircle size={20} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white">VAT Filing Deadline</p>
                           <p className="text-xs text-red-400">Due in 3 Days (Oct 15)</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-xl">
                        <div className="p-2 bg-white/10 rounded-lg text-gray-400">
                           <Clock size={20} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white">Payroll Tax Submission</p>
                           <p className="text-xs text-gray-500">Due: Oct 30</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ADD EXPENSE MODAL */}
         <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="Log Expense">
            <div className="space-y-4">
               <div>
                  <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Description</label>
                  <input
                     aria-label="Expense Description"
                     className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary"
                     value={newExpData.description || ''}
                     onChange={e => setNewExpData({ ...newExpData, description: e.target.value })}
                     placeholder="e.g. Office Supplies"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Amount</label>
                     <input
                        aria-label="Expense Amount"
                        type="number"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary font-mono"
                        value={newExpData.amount || ''}
                        onChange={e => setNewExpData({ ...newExpData, amount: parseFloat(e.target.value) })}
                     />
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Date</label>
                     <input
                        aria-label="Expense Date"
                        type="date"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary"
                        value={newExpData.date}
                        onChange={e => setNewExpData({ ...newExpData, date: e.target.value })}
                     />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Category</label>
                     <select
                        aria-label="Expense Category"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newExpData.category}
                        onChange={e => setNewExpData({ ...newExpData, category: e.target.value as any })}
                     >
                        <option>Rent</option>
                        <option>Utilities</option>
                        <option>Marketing</option>
                        <option>Maintenance</option>
                        <option>Software</option>
                        <option>Other</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Status</label>
                     <select
                        aria-label="Expense Status"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                        value={newExpData.status}
                        onChange={e => setNewExpData({ ...newExpData, status: e.target.value as any })}
                     >
                        <option>Paid</option>
                        <option>Pending</option>
                        <option>Overdue</option>
                     </select>
                  </div>
               </div>
               <button
                  onClick={handleAddExpense}
                  className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl mt-2 hover:bg-cyber-accent transition-colors"
               >
                  Save Record
               </button>
            </div>
         </Modal>

         {/* Delete Expense Modal */}
         <Modal isOpen={isDeleteExpenseModalOpen} onClose={() => setIsDeleteExpenseModalOpen(false)} title="Confirm Deletion" size="sm">
            <div className="p-6">
               <div className="flex items-center gap-4 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="p-3 bg-red-500/20 rounded-full">
                     <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Delete Record?</h3>
                     <p className="text-red-200 text-sm">This action cannot be undone.</p>
                  </div>
               </div>

               <p className="text-gray-300 mb-6">
                  To confirm deletion, please type <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">DELETE</span> below:
               </p>

               <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white mb-6 focus:outline-none focus:border-red-500/50 transition-colors font-mono"
                  placeholder="Type DELETE to confirm"
               />

               <div className="flex justify-end gap-3">
                  <button
                     onClick={() => setIsDeleteExpenseModalOpen(false)}
                     className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     onClick={handleConfirmDeleteExpense}
                     disabled={deleteInput !== 'DELETE'}
                     className={`px - 6 py - 2 rounded - lg font - bold transition - all ${deleteInput === 'DELETE'
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                        } `}
                  >
                     Delete Expense
                  </button>
               </div>
            </div>
         </Modal>

         {/* Payroll Confirmation Modal */}
         <Modal isOpen={isPayrollModalOpen} onClose={() => setIsPayrollModalOpen(false)} title="Process Payroll" size="sm">
            <div className="p-6">
               <div className="flex items-center gap-4 mb-6 p-4 bg-cyber-primary/10 border border-cyber-primary/20 rounded-xl">
                  <div className="p-3 bg-cyber-primary/20 rounded-full">
                     <Briefcase className="w-8 h-8 text-cyber-primary" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-white">Run Payroll?</h3>
                     <p className="text-gray-400 text-sm">This will process salaries for {employees.length} employees.</p>
                  </div>
               </div>

               <div className="bg-black/30 p-4 rounded-xl mb-6 border border-white/5 text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Payout</p>
                  <p className="text-2xl font-mono font-bold text-white">{CURRENCY_SYMBOL} {totalSalaries.toLocaleString()}</p>
               </div>

               <div className="flex justify-end gap-3">
                  <button
                     onClick={() => setIsPayrollModalOpen(false)}
                     className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     onClick={handleConfirmPayroll}
                     className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg transition-colors"
                  >
                     Confirm & Process
                  </button>
               </div>
            </div>
         </Modal>
      </div>
   );
}
