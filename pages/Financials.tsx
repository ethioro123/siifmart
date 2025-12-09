
import React, { useState } from 'react';
import {
   PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
   ComposedChart, Bar, Line, Legend
} from 'recharts';
import {
   DollarSign, TrendingUp, CreditCard, FileText, Plus, Trash2,
   Filter, Download, Briefcase, Activity, AlertCircle, CheckCircle, Clock, Globe, Calculator,
   PieChart as PieIcon, Target, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { ExpenseRecord } from '../types';
import Modal from '../components/Modal';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext'; // Use Live Data

// --- MOCK FINANCIAL DATA ---
const CASHFLOW_DATA = [
   { name: 'Week 1', income: 450000, expense: 150000 },
   { name: 'Week 2', income: 520000, expense: 180000 },
   { name: 'Week 3', income: 480000, expense: 160000 },
   { name: 'Week 4', income: 600000, expense: 210000 },
];

const BUDGET_VS_ACTUALS = [
   { month: 'Jan', budget: 500000, actual: 480000 },
   { month: 'Feb', budget: 500000, actual: 520000 },
   { month: 'Mar', budget: 550000, actual: 540000 },
   { month: 'Apr', budget: 550000, actual: 510000 },
   { month: 'May', budget: 600000, actual: 620000 },
   { month: 'Jun', budget: 600000, actual: 590000 },
];

const FORECAST_DATA = [
   { month: 'Jul (Est)', low: 580000, high: 650000, projection: 615000 },
   { month: 'Aug (Est)', low: 600000, high: 680000, projection: 640000 },
   { month: 'Sep (Est)', low: 620000, high: 710000, projection: 670000 },
];

const EXPENSE_BREAKDOWN = [
   { name: 'Rent', value: 35 },
   { name: 'Salaries', value: 40 },
   { name: 'Utilities', value: 10 },
   { name: 'Maintenance', value: 15 },
];

const DEPT_BUDGETS = [
   { dept: 'Marketing', allocated: 150000, spent: 120000 },
   { dept: 'Operations', allocated: 300000, spent: 295000 },
   { dept: 'IT/Systems', allocated: 80000, spent: 45000 },
   { dept: 'HR/Admin', allocated: 100000, spent: 90000 },
];

const COLORS = ['#00ff9d', '#3b82f6', '#f59e0b', '#ef4444'];

type FinanceTab = 'overview' | 'expenses' | 'payroll' | 'tax' | 'budget';

// Regional Tax Configurations
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

   // --- CALCULATIONS ---
   const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
   const totalSalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
   const totalOpEx = expenses.reduce((sum, e) => sum + e.amount, 0);
   const totalExpenses = totalSalaries + totalOpEx;
   const totalRefunds = sales.filter(s => s.status === 'Refunded').reduce((sum, s) => sum + s.total, 0);

   // Dynamic Tax Calc
   const taxRateDecimal = currentTaxConfig.rate / 100;
   const estimatedTaxLiability = (totalRevenue - totalRefunds) * taxRateDecimal;
   const inputTaxCredit = totalOpEx * taxRateDecimal; // Claimable tax on expenses
   const netTaxPayable = Math.max(0, estimatedTaxLiability - inputTaxCredit);

   const netProfit = totalRevenue - totalExpenses - netTaxPayable - totalRefunds;
   const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;


   // --- ACTIONS ---
   const handleAddExpense = () => {
      if (!newExpData.description || !newExpData.amount) return;
      const expense: ExpenseRecord = {
         id: `EXP-${Date.now()}`,
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
         addNotification('success', `Tax Report Generated! Net Payable: ${CURRENCY_SYMBOL} ${netTaxPayable.toLocaleString()}`);
      }, 1500);
   };

   const handleDownloadBankFile = () => {
      addNotification('info', 'Generating Bank Payment File (ABA/NACHA)...');
      setTimeout(() => {
         addNotification('success', 'Bank File Downloaded Successfully');
      }, 1500);
   };

   const TabButton = ({ id, label, icon: Icon }: any) => (
      <button
         onClick={() => setActiveTab(id)}
         className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === id
            ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
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
               <p className="text-gray-400 text-sm">Enterprise Resource Planning (ERP) & Accounting.</p>
            </div>
            <div className="flex items-center space-x-3">
               {/* Region Selector */}
               <div className="hidden md:flex items-center bg-black/30 border border-white/10 rounded-xl px-3 py-2 mr-2">
                  <Globe size={14} className="text-gray-400 mr-2" />
                  <select
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
                  <Download className="w-4 h-4 mr-2" /> Export JSON
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
                     <span className="text-green-400 text-xs flex items-center mt-2"><TrendingUp size={12} className="mr-1" /> +12.5%</span>
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
                     <h3 className="font-bold text-white mb-6">Cash Flow Analysis</h3>
                     <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                           <AreaChart data={CASHFLOW_DATA}>
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
                                 data={EXPENSE_BREAKDOWN}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={5}
                                 dataKey="value"
                              >
                                 {EXPENSE_BREAKDOWN.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                 ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="space-y-2 mt-4">
                        {EXPENSE_BREAKDOWN.map((item, i) => (
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
                           <ComposedChart data={BUDGET_VS_ACTUALS}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                              <XAxis dataKey="month" stroke="#666" fontSize={12} />
                              <YAxis stroke="#666" fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                              <Legend />
                              <Bar dataKey="budget" fill="#3b82f6" barSize={20} name="Budget Cap" />
                              <Line type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2} name="Actual Spend" />
                           </ComposedChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Department Budgets */}
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 flex flex-col">
                     <h3 className="font-bold text-white mb-4">Department Utilization</h3>
                     <div className="space-y-6 flex-1">
                        {DEPT_BUDGETS.map((item, i) => {
                           const percent = (item.spent / item.allocated) * 100;
                           const isOver = percent > 100;
                           return (
                              <div key={i}>
                                 <div className="flex justify-between text-xs mb-1">
                                    <span className="text-white font-bold">{item.dept}</span>
                                    <span className={isOver ? 'text-red-400' : 'text-gray-400'}>
                                       {CURRENCY_SYMBOL} {item.spent.toLocaleString()} / {item.allocated.toLocaleString()}
                                    </span>
                                 </div>
                                 <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                                    <div
                                       className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-cyber-primary'}`}
                                       style={{ width: `${Math.min(percent, 100)}%` }}
                                    />
                                 </div>
                                 <div className="text-right mt-1">
                                    <span className={`text-[10px] ${isOver ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                                       {percent.toFixed(1)}% Used {isOver && '(OVERRUN)'}
                                    </span>
                                 </div>
                              </div>
                           );
                        })}
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
                           <AreaChart data={FORECAST_DATA}>
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
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${exp.status === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                 exp.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                 }`}>
                                 {exp.status === 'Paid' && <CheckCircle size={10} />}
                                 {exp.status === 'Pending' && <Clock size={10} />}
                                 {exp.status === 'Overdue' && <AlertCircle size={10} />}
                                 {exp.status}
                              </span>
                           </td>
                           <td className="p-4 text-xs text-gray-500">{exp.approvedBy}</td>
                           <td className="p-4 text-right">
                              <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-600 hover:text-red-400">
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
                  <table className="w-full text-left">
                     <thead className="bg-black/20 border-b border-white/5">
                        <tr>
                           <th className="p-4 text-xs text-gray-500 uppercase">Employee</th>
                           <th className="p-4 text-xs text-gray-500 uppercase">Role</th>
                           <th className="p-4 text-xs text-gray-500 uppercase">Department</th>
                           <th className="p-4 text-xs text-gray-500 uppercase text-right">Salary</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {employees.map(emp => (
                           <tr key={emp.id} className="hover:bg-white/5">
                              <td className="p-4 flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-black/50 overflow-hidden">
                                    <img src={emp.avatar} className="w-full h-full object-cover" />
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
                        type="number"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyber-primary font-mono"
                        value={newExpData.amount || ''}
                        onChange={e => setNewExpData({ ...newExpData, amount: parseFloat(e.target.value) })}
                     />
                  </div>
                  <div>
                     <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Date</label>
                     <input
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
                     className={`px-6 py-2 rounded-lg font-bold transition-all ${deleteInput === 'DELETE'
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                        }`}
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
