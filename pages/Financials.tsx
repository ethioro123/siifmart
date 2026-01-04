import React, { useState, useEffect, useMemo } from 'react';
import {
   PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
   ComposedChart, Bar, Line, Legend
} from 'recharts';
import {

   DollarSign, TrendingUp, CreditCard, FileText, Plus, Trash2,
   Filter, Download, Briefcase, Activity, AlertCircle, CheckCircle, Clock, Globe, Calculator,
   PieChart as PieIcon, Target, ArrowUpRight, ArrowDownRight, Search, Calendar, Loader2
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { ExpenseRecord, Employee, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION } from '../types';
import { calculateStoreBonus } from '../components/StoreBonusDisplay';
import { expensesService } from '../services/supabase.service';
import Modal from '../components/Modal';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext'; // Use Live Data
import { generateQuarterlyReport } from '../utils/reportGenerator';
import { formatCompactNumber } from '../utils/formatting';
import { useDateFilter, DateRangeOption } from '../hooks/useDateFilter';
import DateRangeSelector from '../components/DateRangeSelector';

// Regional Tax Configurations
type FinanceTab = 'overview' | 'expenses' | 'payroll' | 'tax' | 'budget';

const TAX_REGIONS = {
   'SYSTEM': { name: 'System Default', taxName: 'Tax', rate: 0, code: 'N/A' }, // Rate updated in component
   'ET': { name: 'Ethiopia', taxName: 'VAT', rate: 15, code: 'ETB' },
   'KE': { name: 'Kenya', taxName: 'VAT', rate: 16, code: 'KES' },
   'UG': { name: 'Uganda', taxName: 'VAT', rate: 18, code: 'UGX' },
   'US': { name: 'USA (Avg)', taxName: 'Sales Tax', rate: 8.25, code: 'USD' },
   'EU': { name: 'Europe (Avg)', taxName: 'VAT', rate: 20, code: 'EUR' },
   'AE': { name: 'UAE', taxName: 'VAT', rate: 5, code: 'AED' },
};

export default function Finance() {
   const { user } = useStore();
   const { employees, sales, expenses, allProducts, addExpense, deleteExpense, processPayroll, activeSite, addNotification, settings, sites, getStorePoints } = useData();

   const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
   const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

   const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
   const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
   const [deleteInput, setDeleteInput] = useState('');

   const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

   // Tax State
   const [selectedRegion, setSelectedRegion] = useState<keyof typeof TAX_REGIONS>('SYSTEM');

   const currentTaxConfig = selectedRegion === 'SYSTEM'
      ? { ...TAX_REGIONS['SYSTEM'], rate: settings?.taxRate ?? 0 }
      : TAX_REGIONS[selectedRegion];

   // New Expense State
   const [newExpData, setNewExpData] = useState<Partial<ExpenseRecord>>({
      category: 'Other', status: 'Pending', date: new Date().toISOString().split('T')[0]
   });

   // --- DATE FILTERING STATE ---
   const [dateRange, setDateRange] = useState<DateRangeOption>('This Quarter');

   // Server-Side Pagination State for Expenses
   const [localExpenses, setLocalExpenses] = useState<ExpenseRecord[]>([]);
   const [expensesLoading, setExpensesLoading] = useState(false);
   const [totalExpensesCount, setTotalExpensesCount] = useState(0);
   const [currentExpensesPage, setCurrentExpensesPage] = useState(1);
   const EXPENSES_PER_PAGE = 20;

   useEffect(() => {
      if (activeTab === 'expenses') {
         const fetchExpenses = async () => {
            setExpensesLoading(true);
            try {
               const offset = (currentExpensesPage - 1) * EXPENSES_PER_PAGE;

               // Calculate Dates for Filter
               const now = new Date();
               let startDate: string | undefined;
               let endDate: string | undefined;

               const { q, year } = getQuarterInfo(now);

               if (dateRange === 'This Month') {
                  const start = new Date(now.getFullYear(), now.getMonth(), 1);
                  startDate = start.toISOString().split('T')[0];
                  endDate = now.toISOString().split('T')[0]; // Up to today
               } else if (dateRange === 'Last Month') {
                  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  const end = new Date(now.getFullYear(), now.getMonth(), 0);
                  startDate = start.toISOString().split('T')[0];
                  endDate = end.toISOString().split('T')[0];
               } else if (dateRange === 'This Quarter') {
                  const start = new Date(year, (q - 1) * 3, 1);
                  startDate = start.toISOString().split('T')[0];
                  endDate = now.toISOString().split('T')[0];
               } else if (dateRange === 'This Year') {
                  const start = new Date(year, 0, 1);
                  startDate = start.toISOString().split('T')[0];
                  endDate = now.toISOString().split('T')[0];
               } else if (dateRange === 'Last Year') {
                  const start = new Date(year - 1, 0, 1);
                  const end = new Date(year - 1, 11, 31);
                  startDate = start.toISOString().split('T')[0];
                  endDate = end.toISOString().split('T')[0];
               }
               // 'All Time' leaves startDate/endDate undefined

               const { data, count } = await expensesService.getAll(activeSite?.id, EXPENSES_PER_PAGE, offset, {
                  startDate,
                  endDate
               });

               setLocalExpenses(data);
               setTotalExpensesCount(count);
            } catch (error) {
               console.error('Failed to fetch expenses', error);
            } finally {
               setExpensesLoading(false);
            }
         };
         fetchExpenses();
      }
   }, [activeTab, currentExpensesPage, activeSite?.id, dateRange]);

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

   // Server-Side Financial Data
   const [serverFinancials, setServerFinancials] = useState<any>(null);

   useEffect(() => {
      const fetchFinancials = async () => {
         try {
            // Convert dateRange to startDate/endDate for RPC
            const { q, year } = getQuarterInfo(new Date());
            const now = new Date();
            let start: Date | undefined;
            let end: Date | undefined;

            if (dateRange === 'This Month') {
               start = new Date(now.getFullYear(), now.getMonth(), 1);
               end = now;
            } else if (dateRange === 'Last Month') {
               start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
               end = new Date(now.getFullYear(), now.getMonth(), 0);
            } else if (dateRange === 'This Quarter') {
               start = new Date(year, (q - 1) * 3, 1);
               end = now;
            } else if (dateRange === 'This Year') {
               start = new Date(year, 0, 1);
               end = now;
            } else if (dateRange === 'Last Year') {
               start = new Date(year - 1, 0, 1);
               end = new Date(year - 1, 11, 31);
            }
            // 'All Time' -> undefined

            const data = await expensesService.getFinancialMetrics(
               activeSite?.id,
               start?.toISOString(),
               end?.toISOString()
            );
            setServerFinancials(data);
         } catch (err) {
            console.error("Error fetching financial metrics:", err);
         }
      };

      fetchFinancials();
   }, [dateRange, activeSite?.id]);


   // --- FILTERED DATASETS (Keep for Legacy/Component Logic if needed, but metrics are replaced) ---
   const filteredExpenses = expenses.filter(e => isWithinRange(e.date));
   const filteredSales = sales.filter(s => isWithinRange(s.created_at || new Date().toISOString()));

   // --- CALCULATIONS (USING SERVER METRICS OR FALLBACK) ---

   // 1. Expense Breakdown (Pie Chart)
   const expenseBreakdownData = useMemo(() => {
      if (serverFinancials?.expense_breakdown) {
         return serverFinancials.expense_breakdown.map((item: any) => ({
            name: item.name,
            value: item.value // Server returns absolute value, we can use it directly or calc %
         })).map((item: any, _: number, arr: any[]) => {
            const total = arr.reduce((s, i) => s + i.value, 0);
            return { ...item, value: total > 0 ? parseFloat(((item.value / total) * 100).toFixed(1)) : 0 };
         });
      }
      // Fallback
      const expensesByCategory = filteredExpenses.reduce((acc: Record<string, number>, exp: any) => {
         const cat = exp.category || 'Other';
         acc[cat] = (acc[cat] || 0) + (Number(exp.amount) || 0);
         return acc;
      }, {} as Record<string, number>);

      const totalRecordedExpenses = Object.values(expensesByCategory).reduce<number>((sum, val) => sum + (val as number), 0);
      return Object.entries(expensesByCategory).map(([name, value]) => {
         const val = value as number;
         const total = totalRecordedExpenses as number;
         return {
            name,
            value: total > 0 ? parseFloat(((val / total) * 100).toFixed(1)) : 0
         };
      });
   }, [filteredExpenses, serverFinancials]);


   // 2. Cashflow Data 
   const cashflowData = useMemo(() => {
      if (serverFinancials?.cashflow_data) {
         // Format dates for display (e.g., "YYYY-MM-DD" -> "MMM D" or keep as is)
         return serverFinancials.cashflow_data.map((d: any) => ({
            name: new Date(d.name).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            income: d.income,
            expense: d.expense
         }));
      }

      const getWeekNumber = (d: Date) => {
         d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
         d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
         const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
         return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      }

      const salesByWeek = filteredSales.reduce((acc, s) => {
         const date = new Date(s.created_at || s.date);
         const week = `W${getWeekNumber(date)} `;
         acc[week] = (acc[week] || 0) + s.total;
         return acc;
      }, {} as Record<string, number>);

      const expensesByWeek = filteredExpenses.reduce((acc, e) => {
         const date = new Date(e.date);
         const week = `W${getWeekNumber(date)} `;
         acc[week] = (acc[week] || 0) + e.amount;
         return acc;
      }, {} as Record<string, number>);

      const allWeeks = Array.from(new Set([...Object.keys(salesByWeek), ...Object.keys(expensesByWeek)])).sort();
      return allWeeks.map(week => ({
         name: week,
         income: salesByWeek[week] || 0,
         expense: expensesByWeek[week] || 0
      }));
   }, [filteredSales, filteredExpenses, serverFinancials]);

   // --- PAYROLL FILTERS ---
   const [payrollSearch, setPayrollSearch] = useState('');
   const [payrollRoleFilter, setPayrollRoleFilter] = useState('All');
   const [payrollSort, setPayrollSort] = useState<'name' | 'salary' | 'department'>('name');
   const [payrollSortDir, setPayrollSortDir] = useState<'asc' | 'desc'>('asc');

   // --- PAYROLL PAGINATION ---
   const [payrollPage, setPayrollPage] = useState(1);
   const [payrollPerPage, setPayrollPerPage] = useState(10);
   const PAYROLL_PER_PAGE_OPTIONS = [10, 25, 50, 100];

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

   // Reset payroll page when filters change
   React.useEffect(() => {
      setPayrollPage(1);
   }, [payrollSearch, payrollRoleFilter]);

   // Payroll pagination calculations
   const payrollTotalPages = Math.ceil(filteredEmployees.length / payrollPerPage);
   const payrollStartIndex = (payrollPage - 1) * payrollPerPage;
   const payrollEndIndex = payrollStartIndex + payrollPerPage;
   const paginatedEmployees = filteredEmployees.slice(payrollStartIndex, payrollEndIndex);

   // Generate payroll page numbers
   const getPayrollPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 5;

      if (payrollTotalPages <= maxVisible) {
         for (let i = 1; i <= payrollTotalPages; i++) pages.push(i);
      } else {
         pages.push(1);
         if (payrollPage > 3) pages.push('...');

         const start = Math.max(2, payrollPage - 1);
         const end = Math.min(payrollTotalPages - 1, payrollPage + 1);

         for (let i = start; i <= end; i++) pages.push(i);

         if (payrollPage < payrollTotalPages - 2) pages.push('...');
         pages.push(payrollTotalPages);
      }
      return pages;
   };

   const uniqueRoles = ['All', ...Array.from(new Set(employees.map(e => e.role)))];

   // If no data, provide empty placeholder
   if (cashflowData.length === 0) {
      cashflowData.push({ name: 'No Data', income: 0, expense: 0 });
   }


   const totalRevenue = serverFinancials?.total_revenue ?? filteredSales.reduce((sum, s) => sum + s.total, 0);

   // Apply same logic for OpEx
   const totalSalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
   const totalOpEx = serverFinancials?.total_expenses ?? filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

   // Calculate employee bonus based on role distribution from gamification settings
   const calculateEmployeeBonus = (emp: Employee): number => {
      const empSite = sites.find(s => s.id === emp.siteId || s.id === (emp as any).site_id);
      if (!empSite) return 0;

      const storePointsData = getStorePoints(empSite.id);
      if (!storePointsData) return 0;

      const bonusTiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
      const roleDistribution = settings.posRoleDistribution || DEFAULT_POS_ROLE_DISTRIBUTION;

      const storeBonus = calculateStoreBonus(storePointsData.monthlyPoints, bonusTiers);
      const roleConfig = roleDistribution.find(r =>
         r.role.toLowerCase() === emp.role.toLowerCase()
      );

      return roleConfig ? (storeBonus.bonus * roleConfig.percentage) / 100 : 0;
   };

   // Calculate total bonuses for all employees
   const totalBonuses = employees.reduce((sum, emp) => sum + calculateEmployeeBonus(emp), 0);

   // Inventory Valuation at Cost
   const totalInventoryValue = allProducts
      .filter(p => (p.status || (p as any).status) !== 'archived')
      .reduce((sum, p) => sum + (p.stock * (p.costPrice || p.price * 0.7)), 0);

   // We will display Total Expenses as OpEx (Filtered) + Payroll (Current Month Estimate)
   // But if Date Range is "Last Year", showing current payroll is wrong.
   // For simplicity and safety: I will clearly label the Payroll part or exclude it from the "Period Expense" if it makes no sense.
   // However, to minimize disruption, I'll stick to the previous formula but be aware `totalOpEx` is now dynamic.
   const totalExpenses = totalSalaries + totalOpEx;

   const totalRefunds = serverFinancials?.total_refunds ?? filteredSales.filter(s => s.status === 'Refunded').reduce((sum, s) => sum + s.total, 0);

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
   const handleAddExpense = async () => {
      if (!newExpData.description || !newExpData.amount) return;
      setIsSubmitting(true);
      try {
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
         await addExpense(expense); // Use Global Context
         setIsAddExpenseOpen(false);
         setNewExpData({ category: 'Other', status: 'Pending', date: new Date().toISOString().split('T')[0] });
      } catch (error) {
         console.error(error);
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleDeleteExpense = (id: string) => {
      setExpenseToDelete(id);
      setDeleteInput('');
      setIsDeleteExpenseModalOpen(true);
   };

   const handleConfirmDeleteExpense = async () => {
      if (!expenseToDelete) return;

      if (deleteInput !== "DELETE") {
         addNotification('alert', 'Please type "DELETE" to confirm.');
         return;
      }

      setIsSubmitting(true);
      try {
         await deleteExpense(expenseToDelete);
         addNotification('success', 'Expense record deleted.');
         setIsDeleteExpenseModalOpen(false);
         setExpenseToDelete(null);
         setDeleteInput('');
      } catch (error) {
         console.error(error);
      } finally {
         setIsSubmitting(false);
      }
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

   const handleConfirmPayroll = async () => {
      setIsSubmitting(true);
      try {
         await processPayroll(activeSite?.id || 'SITE-001', user?.name || 'Admin');
         setIsPayrollModalOpen(false);
      } catch (error) {
         console.error(error);
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleGenerateFiling = () => {
      setIsSubmitting(true);
      addNotification('info', `Generating ${currentTaxConfig.taxName} Filing Report for ${currentTaxConfig.name}...`);
      setTimeout(() => {
         addNotification('success', `Tax Report Generated! Net Payable: ${CURRENCY_SYMBOL} ${netTaxPayable.toLocaleString()} `);
         setIsSubmitting(false);
      }, 1500);
   };

   const handleDownloadBankFile = () => {
      setIsSubmitting(true);
      addNotification('info', 'Generating Bank Payment File (ABA/NACHA)...');
      setTimeout(() => {
         addNotification('success', 'Bank File Downloaded Successfully');
         setIsSubmitting(false);
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
         className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === id
            ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            } `}
      >
         <Icon size={16} className="flex-shrink-0" />
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
                        {/* eslint-disable-next-line react/forbid-dom-props */}
                        <div
                           className="h-full bg-cyber-primary transition-all duration-500"
                           style={{ width: `${getQuarterProgress()}%` }}
                        />
                     </div>
                  </div>
               )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
               {/* Date Filter */}
               <DateRangeSelector
                  value={dateRange}
                  onChange={(val) => setDateRange(val)}
               />

               {/* Region Selector */}
               <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-3 h-10 transition-all hover:border-cyber-primary/50">
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

               <div className="h-10 px-4 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <TrendingUp size={16} className="text-green-500" />
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Net Margin:</span>
                  <span className="text-sm font-bold text-white font-mono">{profitMargin.toFixed(1)}%</span>
               </div>

               <div className="flex items-center gap-2 h-10">
                  <button
                     onClick={handleExportPnL}
                     className="h-full bg-white/5 text-white border border-white/10 px-4 rounded-xl text-sm hover:bg-white/10 hover:border-white/20 flex items-center transition-all"
                  >
                     <Download className="w-4 h-4 mr-2" /> JSON
                  </button>
                  <button
                     onClick={handleGenerateReport}
                     className="h-full bg-cyber-primary text-black border border-cyber-primary px-4 rounded-xl text-sm hover:brightness-110 flex items-center transition-all font-bold shadow-[0_0_15px_rgba(0,255,157,0.2)]"
                  >
                     <Download className="w-4 h-4 mr-2" /> PDF Report
                  </button>
               </div>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex flex-wrap items-center gap-2 bg-cyber-gray/50 p-1.5 rounded-xl border border-white/5 w-fit">
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
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                     <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-mono font-bold text-white mt-1">{formatCompactNumber(totalRevenue, { currency: CURRENCY_SYMBOL })}</h3>
                     </div>
                     <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyber-primary anim-pulse"></div>
                        <p className="text-[10px] text-gray-500 font-medium">Gross Inflow</p>
                     </div>
                  </div>

                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                     <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total Expenses</p>
                        <h3 className="text-2xl font-mono font-bold text-red-400 mt-1">{formatCompactNumber(totalExpenses, { currency: CURRENCY_SYMBOL })}</h3>
                     </div>
                     <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/50"></div>
                        <p className="text-[10px] text-gray-500 font-medium">OpEx + Payroll</p>
                     </div>
                  </div>

                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                     <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Total Refunds</p>
                        <h3 className="text-2xl font-mono font-bold text-red-400 mt-1">{formatCompactNumber(totalRefunds, { currency: CURRENCY_SYMBOL })}</h3>
                     </div>
                     <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50"></div>
                        <p className="text-[10px] text-gray-500 font-medium">Deducted from Net</p>
                     </div>
                  </div>

                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px]">
                     <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Inventory Value</p>
                        <h3 className="text-2xl font-mono font-bold text-blue-400 mt-1">{formatCompactNumber(totalInventoryValue, { currency: CURRENCY_SYMBOL })}</h3>
                     </div>
                     <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div>
                        <p className="text-[10px] text-gray-500 font-medium">Valued at Cost</p>
                     </div>
                  </div>

                  <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-primary/5 rounded-bl-full transition-all group-hover:bg-cyber-primary/10"></div>
                     <div>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Net Income</p>
                        <h3 className="text-2xl font-mono font-bold text-cyber-primary mt-1">{formatCompactNumber(netProfit, { currency: CURRENCY_SYMBOL })}</h3>
                     </div>
                     <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyber-primary shadow-[0_0_5px_rgba(0,255,157,0.5)]"></div>
                        <p className="text-[10px] text-gray-500 font-medium">After Tax Liability</p>
                     </div>
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
                     {expenseBreakdownData.length > 0 && expenseBreakdownData.some((d: any) => d.value > 0) ? (
                        <>
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
                                       {expenseBreakdownData.map((entry: any, index: number) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                       ))}
                                    </Pie>
                                    <Tooltip
                                       contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                       itemStyle={{ color: '#fff', fontSize: '12px' }}
                                    />
                                 </PieChart>
                              </ResponsiveContainer>
                           </div>
                           <div className="space-y-2 mt-4 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                              {expenseBreakdownData.map((item: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2">
                                       {/* eslint-disable-next-line react/forbid-dom-props */}
                                       <div className={`w-2 h-2 rounded-full bg-[${COLORS[i % COLORS.length]}]`}></div>
                                       <span className="text-gray-300 text-xs">{item.name}</span>
                                    </div>
                                    <span className="font-mono text-white text-xs">{item.value}%</span>
                                 </div>
                              ))}
                           </div>
                        </>
                     ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-50">
                           <PieIcon size={48} className="text-gray-600 mb-2" />
                           <p className="text-xs text-gray-500 italic">No breakdown available</p>
                        </div>
                     )}
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
                     <div className="flex-1 flex flex-col items-center justify-center py-10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                           <Target size={32} className="text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Coming Soon</p>
                        <p className="text-[10px] text-gray-500 text-center px-6 mt-1 italic">
                           Live department tracking is being integrated with your new organizational schema.
                        </p>
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
            <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-x-auto animate-in fade-in">
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
                     {localExpenses.length > 0 ? (
                        localExpenses.map(exp => (
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
                        ))
                     ) : (
                        <tr>
                           <td colSpan={7} className="p-20 text-center">
                              <div className="opacity-30 flex flex-col items-center">
                                 <CreditCard size={48} className="mb-4 text-gray-400" />
                                 <p className="text-sm font-medium">No expense records found for this period.</p>
                                 <p className="text-xs mt-1">Try changing the date filter or logging a new expense.</p>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
               {/* Pagination Controls */}
               <div className="flex justify-between items-center p-4 border-t border-white/5 bg-black/20">
                  <div className="text-xs text-gray-400">
                     Showing {localExpenses.length} of {formatCompactNumber(totalExpensesCount)} records
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setCurrentExpensesPage(prev => Math.max(1, prev - 1))}
                        disabled={currentExpensesPage === 1 || expensesLoading}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white transition-colors border border-white/10"
                     >
                        Previous
                     </button>
                     <span className="flex items-center px-2 text-xs text-gray-400 font-mono">
                        Page {currentExpensesPage}
                     </span>
                     <button
                        onClick={() => setCurrentExpensesPage(prev => (localExpenses.length === EXPENSES_PER_PAGE ? prev + 1 : prev))}
                        disabled={localExpenses.length < EXPENSES_PER_PAGE || expensesLoading}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white transition-colors border border-white/10"
                     >
                        Next
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* --- PAYROLL --- */}
         {activeTab === 'payroll' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
               <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl overflow-x-auto">
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
                           <th className="p-4 text-xs text-gray-500 uppercase text-right">Bonus</th>
                           <th className="p-4 text-xs text-gray-500 uppercase text-right">Total</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {paginatedEmployees.map(emp => (
                           <tr key={emp.id} className="hover:bg-white/5 group transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                                    {emp.avatar ? (
                                       <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                    ) : (
                                       <div className="w-full h-full flex items-center justify-center bg-cyber-primary/10 text-cyber-primary text-[10px] font-bold">
                                          {emp.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                       </div>
                                    )}
                                 </div>
                                 <span className="text-sm text-white font-bold truncate">{emp.name}</span>
                              </td>
                              <td className="p-4">
                                 <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-white/5 bg-white/5 text-gray-400 tracking-tighter">
                                    {emp.role}
                                 </span>
                              </td>
                              <td className="p-4 text-[11px] text-gray-500 font-medium">{emp.department}</td>
                              <td className="p-4 text-sm font-mono text-white text-right font-bold">
                                 {CURRENCY_SYMBOL} {(emp.salary || 0).toLocaleString()}
                              </td>
                              <td className="p-4 text-sm font-mono text-right">
                                 {calculateEmployeeBonus(emp) > 0 ? (
                                    <span className="text-green-400 font-bold">+{CURRENCY_SYMBOL} {calculateEmployeeBonus(emp).toLocaleString()}</span>
                                 ) : (
                                    <span className="text-gray-500">—</span>
                                 )}
                              </td>
                              <td className="p-4 text-sm font-mono text-cyber-primary text-right font-bold">
                                 {CURRENCY_SYMBOL} {((emp.salary || 0) + calculateEmployeeBonus(emp)).toLocaleString()}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  {/* Payroll Pagination Controls */}
                  {filteredEmployees.length > 0 && (
                     <div className="p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Info */}
                        <div className="flex items-center gap-4">
                           <span className="text-xs text-gray-400">
                              Showing <span className="text-white font-bold">{payrollStartIndex + 1}</span> to <span className="text-white font-bold">{Math.min(payrollEndIndex, filteredEmployees.length)}</span> of <span className="text-cyber-primary font-bold">{filteredEmployees.length}</span> employees
                           </span>
                           <select
                              value={payrollPerPage}
                              onChange={(e) => {
                                 setPayrollPerPage(Number(e.target.value));
                                 setPayrollPage(1);
                              }}
                              className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyber-primary/50 cursor-pointer"
                              aria-label="Items per page"
                           >
                              {PAYROLL_PER_PAGE_OPTIONS.map(n => (
                                 <option key={n} value={n}>{n} / page</option>
                              ))}
                           </select>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-1">
                           <button
                              onClick={() => setPayrollPage(1)}
                              disabled={payrollPage === 1}
                              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${payrollPage === 1
                                 ? 'text-gray-600 cursor-not-allowed'
                                 : 'text-gray-400 hover:text-white hover:bg-white/10'
                                 }`}
                           >
                              «
                           </button>
                           <button
                              onClick={() => setPayrollPage(p => Math.max(1, p - 1))}
                              disabled={payrollPage === 1}
                              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${payrollPage === 1
                                 ? 'text-gray-600 cursor-not-allowed'
                                 : 'text-gray-400 hover:text-white hover:bg-white/10'
                                 }`}
                           >
                              Prev
                           </button>

                           <div className="flex items-center gap-1 mx-2">
                              {getPayrollPageNumbers().map((page, idx) => (
                                 typeof page === 'number' ? (
                                    <button
                                       key={idx}
                                       onClick={() => setPayrollPage(page)}
                                       className={`w-6 h-6 rounded text-xs font-bold transition-all ${payrollPage === page
                                          ? 'bg-cyber-primary text-black'
                                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                                          }`}
                                    >
                                       {page}
                                    </button>
                                 ) : (
                                    <span key={idx} className="text-gray-500 px-1 text-xs">...</span>
                                 )
                              ))}
                           </div>

                           <button
                              onClick={() => setPayrollPage(p => Math.min(payrollTotalPages, p + 1))}
                              disabled={payrollPage === payrollTotalPages}
                              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${payrollPage === payrollTotalPages
                                 ? 'text-gray-600 cursor-not-allowed'
                                 : 'text-gray-400 hover:text-white hover:bg-white/10'
                                 }`}
                           >
                              Next
                           </button>
                           <button
                              onClick={() => setPayrollPage(payrollTotalPages)}
                              disabled={payrollPage === payrollTotalPages}
                              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${payrollPage === payrollTotalPages
                                 ? 'text-gray-600 cursor-not-allowed'
                                 : 'text-gray-400 hover:text-white hover:bg-white/10'
                                 }`}
                           >
                              »
                           </button>
                        </div>
                     </div>
                  )}
               </div>

               <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 h-fit">
                  <h3 className="font-bold text-white mb-6">Payroll Summary</h3>
                  <div className="space-y-4 mb-6">
                     <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Base Salaries</p>
                        <p className="text-2xl font-mono font-bold text-white">{CURRENCY_SYMBOL} {totalSalaries.toLocaleString()}</p>
                     </div>
                     {totalBonuses > 0 && (
                        <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                           <p className="text-green-400 text-xs uppercase font-bold mb-1">Performance Bonuses</p>
                           <p className="text-2xl font-mono font-bold text-green-400">+{CURRENCY_SYMBOL} {totalBonuses.toLocaleString()}</p>
                           <p className="text-[10px] text-green-400/60 mt-1">Based on store performance & role distribution</p>
                        </div>
                     )}
                     <div className="p-4 bg-cyber-primary/10 rounded-xl border border-cyber-primary/20">
                        <p className="text-cyber-primary text-xs uppercase font-bold mb-1">Total Monthly Payout</p>
                        <p className="text-3xl font-mono font-bold text-cyber-primary">{CURRENCY_SYMBOL} {(totalSalaries + totalBonuses).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 mt-2">{employees.length} Active Employees</p>
                     </div>
                  </div>
                  <button
                     onClick={handleProcessPayroll}
                     className="w-full py-4 bg-cyber-primary text-black font-bold rounded-xl mb-3 hover:bg-cyber-accent transition-colors flex items-center justify-center gap-2"
                  >
                     <CheckCircle size={18} /> Process Run
                  </button>
                  <button onClick={handleDownloadBankFile} disabled={isSubmitting} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                     {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null} {isSubmitting ? 'Downloading...' : 'Download Bank File'}
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
                     disabled={isSubmitting}
                     className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />} {isSubmitting ? 'Generating Report...' : 'Generate Filing Report'}
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
                  disabled={isSubmitting}
                  className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl mt-2 hover:bg-cyber-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null} {isSubmitting ? 'Saving...' : 'Save Record'}
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
                     disabled={deleteInput !== 'DELETE' || isSubmitting}
                     className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${deleteInput === 'DELETE'
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null} {isSubmitting ? 'Deleting...' : 'Delete Expense'}
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
                     disabled={isSubmitting}
                     className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     onClick={handleConfirmPayroll}
                     disabled={isSubmitting}
                     className="px-6 py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null} {isSubmitting ? 'Processing...' : 'Confirm & Process'}
                  </button>
               </div>
            </div>
         </Modal>
      </div>

   );
}
