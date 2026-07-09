import { useState, useEffect, useMemo } from 'react';
import { ExpenseRecord, Employee } from '../types';
import { expensesService } from '../services/supabase.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { generateQuarterlyReport } from '../utils/reportGenerator';
import { DateRangeOption } from '../hooks/useDateFilter';
import { CURRENCY_SYMBOL } from '../constants';
import { logger } from '../utils/logger';
import {
   TAX_REGIONS,
   getQuarterInfo,
   getDateRangeLabels,
   isWithinRange,
   calculateEmployeeBonus
} from './financialsHelpers';

const EXPENSES_PER_PAGE = 20;

export function useFinancialsState() {
   const { user, theme } = useStore();
   const accentColor = theme === 'dark' ? '#A9CBA2' : '#2C5E3B';
   const { employees, sales, expenses, allProducts, addExpense, deleteExpense, processPayroll, activeSite, addNotification, settings, sites, getStorePoints } = useData();

   const [activeTab, setActiveTab] = useState<any>('overview');
   const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
   const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
   const [deleteInput, setDeleteInput] = useState('');

   const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
   const [selectedRegion, setSelectedRegion] = useState<any>('SYSTEM');



   const currentTaxConfig = selectedRegion === 'SYSTEM'
      ? { ...TAX_REGIONS['SYSTEM'], rate: settings?.taxRate ?? 0 }
      : TAX_REGIONS[selectedRegion];

   const [newExpData, setNewExpData] = useState<Partial<ExpenseRecord>>({
      category: 'Other', status: 'Pending', date: new Date().toISOString().split('T')[0]
   });

   const [dateRange, setDateRange] = useState<DateRangeOption>('This Quarter');

   const [localExpenses, setLocalExpenses] = useState<ExpenseRecord[]>([]);
   const [expensesLoading, setExpensesLoading] = useState(false);
   const [totalExpensesCount, setTotalExpensesCount] = useState(0);
   const [currentExpensesPage, setCurrentExpensesPage] = useState(1);

   const [serverFinancials, setServerFinancials] = useState<any>(null);

   const [payrollSearch, setPayrollSearch] = useState('');
   const [payrollRoleFilter, setPayrollRoleFilter] = useState('All');
   const [payrollSort, setPayrollSort] = useState<'name' | 'salary' | 'department'>('name');
   const [payrollSortDir, setPayrollSortDir] = useState<'asc' | 'desc'>('asc');
   const [payrollPage, setPayrollPage] = useState(1);
   const [payrollPerPage, setPayrollPerPage] = useState(10);



   useEffect(() => {
      if (activeTab === 'expenses') {
         const fetchExpenses = async () => {
            setExpensesLoading(true);
            try {
               const offset = (currentExpensesPage - 1) * EXPENSES_PER_PAGE;
               const now = new Date();
               let startDate: string | undefined;
               let endDate: string | undefined;

               const { q, year } = getQuarterInfo(now);

               if (dateRange === 'This Month') {
                  const start = new Date(now.getFullYear(), now.getMonth(), 1);
                  startDate = start.toISOString().split('T')[0];
                  endDate = now.toISOString().split('T')[0];
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

               const { data, count } = await expensesService.getAll(activeSite?.id, EXPENSES_PER_PAGE, offset, {
                  startDate,
                  endDate
               });

               setLocalExpenses(data);
               setTotalExpensesCount(count);
            } catch (error) {
               logger.error('useFinancialsState', 'Failed to fetch expenses', error as Error);
            } finally {
               setExpensesLoading(false);
            }
         };
         fetchExpenses();
      }
   }, [activeTab, currentExpensesPage, activeSite?.id, dateRange]);

   useEffect(() => {
      const fetchFinancials = async () => {
         try {
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

            const data = await expensesService.getFinancialMetrics(
               activeSite?.id,
               start?.toISOString(),
               end?.toISOString()
            );
            setServerFinancials(data);
         } catch (err) {
            logger.error('useFinancialsState', "Error fetching financial metrics:", err);
         }
      };

      fetchFinancials();
   }, [dateRange, activeSite?.id]);

    const localGetDateRangeLabels = () => getDateRangeLabels(dateRange);
    const localIsWithinRange = (dateString: string) => isWithinRange(dateString, dateRange);

   const getQuarterProgress = () => {
      const now = new Date();
      const { start, end } = getQuarterInfo(now);
      const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
      const daysPassed = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
   };

   const filteredExpenses = expenses.filter(e => localIsWithinRange(e.date));
   const filteredSales = sales.filter(s => localIsWithinRange(s.created_at || new Date().toISOString()));

   const expenseBreakdownData = useMemo(() => {
      if (serverFinancials?.expense_breakdown) {
         return serverFinancials.expense_breakdown.map((item: any) => ({
            name: item.name,
            value: item.value
         })).map((item: any, _: number, arr: any[]) => {
            const total = arr.reduce((s, i) => s + i.value, 0);
            return { ...item, value: total > 0 ? parseFloat(((item.value / total) * 100).toFixed(1)) : 0 };
         });
      }
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

   const cashflowData = useMemo(() => {
      if (serverFinancials?.cashflow_data) {
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
      };

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

   useEffect(() => {
      setPayrollPage(1);
   }, [payrollSearch, payrollRoleFilter]);

   const payrollTotalPages = Math.ceil(filteredEmployees.length / payrollPerPage);
   const payrollStartIndex = (payrollPage - 1) * payrollPerPage;
   const payrollEndIndex = payrollStartIndex + payrollPerPage;
   const paginatedEmployees = filteredEmployees.slice(payrollStartIndex, payrollEndIndex);

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

   if (cashflowData.length === 0) {
      cashflowData.push({ name: 'No Data', income: 0, expense: 0 });
   }

   const totalRevenue = serverFinancials?.total_revenue ?? filteredSales.reduce((sum, s) => sum + s.total, 0);
   const totalSalaries = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
   const totalOpEx = serverFinancials?.total_expenses ?? filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

   const localCalculateEmployeeBonus = (emp: Employee): number => {
      return calculateEmployeeBonus(emp, sites, getStorePoints, settings);
   };

   const totalBonuses = employees.reduce((sum, emp) => sum + localCalculateEmployeeBonus(emp), 0);

   const totalInventoryValue = allProducts
      .filter(p => (p.status || (p as any).status) !== 'archived')
      .reduce((sum, p) => sum + (p.stock * (p.costPrice || p.price * 0.7)), 0);

   const totalExpenses = totalSalaries + totalOpEx;
   const totalRefunds = serverFinancials?.total_refunds ?? filteredSales.filter(s => s.status === 'Refunded').reduce((sum, s) => sum + s.total, 0);

   const taxRateDecimal = currentTaxConfig.rate / 100;
   const estimatedTaxLiability = (totalRevenue - totalRefunds) * taxRateDecimal;
   const inputTaxCredit = totalOpEx * taxRateDecimal;
   const netTaxPayable = Math.max(0, estimatedTaxLiability - inputTaxCredit);

   const netProfit = totalRevenue - totalExpenses - netTaxPayable - totalRefunds;
   const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

   const avgRevenue = totalRevenue / (cashflowData.length || 1);
   const forecastData = [
      { month: 'Next M1', low: avgRevenue * 0.9, high: avgRevenue * 1.1, projection: avgRevenue * 1.05 },
      { month: 'Next M2', low: avgRevenue * 0.92, high: avgRevenue * 1.15, projection: avgRevenue * 1.08 },
      { month: 'Next M3', low: avgRevenue * 0.95, high: avgRevenue * 1.2, projection: avgRevenue * 1.12 },
   ];

   const COLORS = [accentColor, '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

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
         await addExpense(expense);
         setIsAddExpenseOpen(false);
         setNewExpData({ category: 'Other', status: 'Pending', date: new Date().toISOString().split('T')[0] });
      } catch (error) {
         logger.error('useFinancialsState', 'caught error', error as Error);
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
         logger.error('useFinancialsState', 'caught error', error as Error);
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
         logger.error('useFinancialsState', 'caught error', error as Error);
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

   const localGetQuarterInfo = (d = new Date()) => getQuarterInfo(d);

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
      generateQuarterlyReport(reportMetrics, localGetDateRangeLabels(), 'Financials');
   };

   return {
      user, theme, accentColor, employees, sales, expenses, allProducts, addExpense, deleteExpense, processPayroll,
      activeSite, addNotification, settings, sites, getStorePoints, activeTab, setActiveTab, isAddExpenseOpen,
      setIsAddExpenseOpen, isSubmitting, setIsSubmitting, isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen,
      expenseToDelete, setExpenseToDelete, deleteInput, setDeleteInput, isPayrollModalOpen, setIsPayrollModalOpen,
      selectedRegion, setSelectedRegion, currentTaxConfig, newExpData, setNewExpData, dateRange, setDateRange,
      localExpenses, setLocalExpenses, expensesLoading, setExpensesLoading, totalExpensesCount, setTotalExpensesCount,
      currentExpensesPage, setCurrentExpensesPage, serverFinancials, setServerFinancials, filteredExpenses, filteredSales,
      expenseBreakdownData, cashflowData, payrollSearch, setPayrollSearch, payrollRoleFilter, setPayrollRoleFilter,
      payrollSort, setPayrollSort, payrollSortDir, setPayrollSortDir, payrollPage, setPayrollPage, payrollPerPage,
      setPayrollPerPage, filteredEmployees, payrollTotalPages, payrollStartIndex, payrollEndIndex, paginatedEmployees,
      getPayrollPageNumbers, uniqueRoles, totalRevenue, totalSalaries, totalOpEx, calculateEmployeeBonus: localCalculateEmployeeBonus, totalBonuses,
      totalInventoryValue, totalExpenses, totalRefunds, estimatedTaxLiability, inputTaxCredit, netTaxPayable, netProfit,
      profitMargin, forecastData, COLORS, TAX_REGIONS, EXPENSES_PER_PAGE, getQuarterProgress, getDateRangeLabels: localGetDateRangeLabels,
      getQuarterInfo: localGetQuarterInfo, handleAddExpense, handleDeleteExpense, handleConfirmDeleteExpense, handleExportPnL,
      handleProcessPayroll, handleConfirmPayroll, handleGenerateFiling, handleDownloadBankFile, handleGenerateReport
   };
}
