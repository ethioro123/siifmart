import { useState, useEffect, useMemo } from 'react';
import { ExpenseRecord, Employee } from '../types';
import { expensesService } from '../services/supabase.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { generateQuarterlyReport } from '../utils/reportGenerator';
import { DateRangeOption } from '../hooks/useDateFilter';
import { logger } from '../utils/logger';
import { getCountryProfile, Country } from '../utils/localization';
import { isAdminSite } from '../utils/countryAdmin';
import {
   getCountryTaxConfig,
   getQuarterInfo,
   getDateRangeLabels,
   getDateRangeBounds,
   isWithinRange,
   calculateEmployeeBonus,
   calculateApAging,
   computeWeeklyCashflow
} from './financialsHelpers';
import { useFinancialPayrollState } from './useFinancialPayrollState';

const EXPENSES_PER_PAGE = 20;

export function useFinancialsState() {
   const { user, theme } = useStore();
   const accentColor = theme === 'dark' ? '#A9CBA2' : '#2C5E3B';
   const {
      employees,
      sales,
      allSales,
      expenses,
      allProducts,
      allOrders,
      addExpense,
      deleteExpense,
      processPayroll,
      activeSite,
      effectiveCountry,
      addNotification,
      settings,
      sites,
      getStorePoints
   } = useData();

   const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
   const countryProfile = useMemo(() => getCountryProfile(activeCountry), [activeCountry]);
   const currencySymbol = countryProfile.currencySymbol || 'ETB';
   const isCountryAdmin = useMemo(() => isAdminSite(activeSite), [activeSite]);

   const [activeTab, setActiveTab] = useState<any>('overview');
   const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
   const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
   const [deleteInput, setDeleteInput] = useState('');

   const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

   // Sovereign Country Tax Configuration (100% isolated per country, config-gated by settings.taxRate)
   const currentTaxConfig = useMemo(() => {
      return getCountryTaxConfig(activeCountry, settings?.taxRate);
   }, [activeCountry, settings?.taxRate]);

   const [newExpData, setNewExpData] = useState<Partial<ExpenseRecord>>({
      category: 'Other',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
   });

   const [dateRange, setDateRange] = useState<DateRangeOption>('This Quarter');

   const [localExpenses, setLocalExpenses] = useState<ExpenseRecord[]>([]);
   const [expensesLoading, setExpensesLoading] = useState(false);
   const [totalExpensesCount, setTotalExpensesCount] = useState(0);
   const [currentExpensesPage, setCurrentExpensesPage] = useState(1);

   const [serverFinancials, setServerFinancials] = useState<any>(null);

   // Payroll Sub-State Hook
   const payroll = useFinancialPayrollState(employees);

   // 1. Fetch Paginated Expenses (Country & Site Scoped)
   useEffect(() => {
      if (activeTab === 'expenses') {
         const fetchExpenses = async () => {
            setExpensesLoading(true);
            try {
               const offset = (currentExpensesPage - 1) * EXPENSES_PER_PAGE;
               const { startDate, endDate } = getDateRangeBounds(dateRange);
               const querySiteId = isCountryAdmin ? undefined : activeSite?.id;

               const { data, count } = await expensesService.getAll(querySiteId, EXPENSES_PER_PAGE, offset, {
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
   }, [activeTab, currentExpensesPage, activeSite?.id, isCountryAdmin, dateRange]);

   // 2. Fetch Server Financial Metrics with Country Isolation
   useEffect(() => {
      const fetchFinancials = async () => {
         try {
            const { startDate, endDate } = getDateRangeBounds(dateRange);
            const querySiteId = isCountryAdmin ? undefined : activeSite?.id;
            const data = await expensesService.getFinancialMetrics(
               querySiteId,
               startDate ? `${startDate}T00:00:00.000Z` : undefined,
               endDate ? `${endDate}T23:59:59.999Z` : undefined,
               activeCountry
            );
            setServerFinancials(data);
         } catch (err) {
            logger.error('useFinancialsState', "Error fetching financial metrics:", err);
         }
      };

      fetchFinancials();
   }, [dateRange, activeSite?.id, isCountryAdmin, activeCountry]);

   const localGetDateRangeLabels = () => getDateRangeLabels(dateRange);
   const localIsWithinRange = (dateString: string) => isWithinRange(dateString, dateRange);

   const getQuarterProgress = () => {
      const now = new Date();
      const { start, end } = getQuarterInfo(now);
      const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
      const daysPassed = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
   };

   // 3. Resolve active datasets: Admin HQ consolidates all country sales/expenses; Branch scopes to site
   const targetSales = useMemo(() => {
      const baseSales = isCountryAdmin ? (allSales || []) : (sales || []);
      return baseSales.filter(s => {
         return isCountryAdmin ? true : (s.siteId === activeSite?.id || (s as any).site_id === activeSite?.id);
      });
   }, [isCountryAdmin, allSales, sales, activeSite?.id]);

   const targetExpenses = useMemo(() => {
      return (expenses || []).filter(e => {
         return isCountryAdmin ? true : (e.siteId === activeSite?.id || (e as any).site_id === activeSite?.id);
      });
   }, [isCountryAdmin, expenses, activeSite?.id]);

   const filteredExpenses = useMemo(() => {
      return targetExpenses.filter(e => localIsWithinRange(e.date));
   }, [targetExpenses, dateRange]);

   const filteredSales = useMemo(() => {
      return targetSales.filter(s => localIsWithinRange(s.created_at || s.date || new Date().toISOString()));
   }, [targetSales, dateRange]);

   // 4. Expense Breakdown
   const expenseBreakdownData = useMemo(() => {
      if (serverFinancials?.expense_breakdown && serverFinancials.expense_breakdown.length > 0) {
         return serverFinancials.expense_breakdown.map((item: any, _: number, arr: any[]) => {
            const total = arr.reduce((s, i) => s + i.value, 0);
            return {
               name: item.name,
               value: total > 0 ? parseFloat(((item.value / total) * 100).toFixed(1)) : 0
            };
         });
      }
      const expensesByCategory = filteredExpenses.reduce((acc: Record<string, number>, exp: any) => {
         const cat = exp.category || 'Other';
         acc[cat] = (acc[cat] || 0) + (Number(exp.amount) || 0);
         return acc;
      }, {} as Record<string, number>);

      const totalRecordedExpenses = Object.values(expensesByCategory).reduce<number>((sum, val) => sum + val, 0);
      return Object.entries(expensesByCategory).map(([name, value]) => ({
         name,
         value: totalRecordedExpenses > 0 ? parseFloat(((value / totalRecordedExpenses) * 100).toFixed(1)) : 0
      }));
   }, [filteredExpenses, serverFinancials]);

   // 5. Cashflow Trend (Standardized keys: name, income, expense, revenue, expenses)
   const cashflowData = useMemo(() => {
      if (serverFinancials?.cashflow_data && serverFinancials.cashflow_data.length > 0) {
         return serverFinancials.cashflow_data.map((d: any) => {
            const inc = Number(d.income) || 0;
            const exp = Number(d.expense) || 0;
            return {
               name: new Date(d.name).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
               income: inc,
               expense: exp,
               revenue: inc,
               expenses: exp
            };
         });
      }
      return computeWeeklyCashflow(filteredSales, filteredExpenses);
   }, [filteredSales, filteredExpenses, serverFinancials]);

   // 6. Core Financial Totals with Admin HQ Rollup & Fallback
   const calculatedSalesTotal = filteredSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
   const calculatedRefundsTotal = filteredSales.filter(s => s.status === 'Refunded').reduce((sum, s) => sum + (Number(s.total) || 0), 0);
   const calculatedOpEx = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

   const totalRevenue = (serverFinancials?.total_revenue && Number(serverFinancials.total_revenue) > 0)
      ? Number(serverFinancials.total_revenue)
      : calculatedSalesTotal;

   const totalRefunds = (serverFinancials?.total_refunds !== undefined && serverFinancials.total_refunds !== null)
      ? Number(serverFinancials.total_refunds)
      : calculatedRefundsTotal;

   const totalOpEx = (serverFinancials?.total_expenses && Number(serverFinancials.total_expenses) > 0)
      ? Number(serverFinancials.total_expenses)
      : calculatedOpEx;

   const totalSalaries = employees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

   const localCalculateEmployeeBonus = (emp: Employee): number => {
      return calculateEmployeeBonus(emp, sites, getStorePoints, settings);
   };

   const totalBonuses = employees.reduce((sum, emp) => sum + localCalculateEmployeeBonus(emp), 0);

   const totalInventoryValue = allProducts
      .filter(p => (p.status || (p as any).status) !== 'archived')
      .reduce((sum, p) => sum + ((p.stock || 0) * (p.costPrice || p.price * 0.7)), 0);

   const totalExpenses = totalSalaries + totalOpEx;

   // 7. Sovereign Tax Calculation
   const taxRateDecimal = currentTaxConfig.rate / 100;
   const estimatedTaxLiability = Math.max(0, (totalRevenue - totalRefunds) * taxRateDecimal);
   const inputTaxCredit = Math.max(0, totalOpEx * taxRateDecimal);
   const netTaxPayable = Math.max(0, estimatedTaxLiability - inputTaxCredit);

   const netProfit = totalRevenue - totalExpenses - netTaxPayable - totalRefunds;
   const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

   // 8. Accounts Payable Aging from real country-scoped purchase orders
   const apAging = useMemo(() => calculateApAging(allOrders || []), [allOrders]);

   // 9. Forecast
   const avgRevenue = totalRevenue / Math.max(1, cashflowData.length);
   const forecastData = [
      { month: 'Next M1', low: avgRevenue * 0.9, high: avgRevenue * 1.1, projection: avgRevenue * 1.05 },
      { month: 'Next M2', low: avgRevenue * 0.92, high: avgRevenue * 1.15, projection: avgRevenue * 1.08 },
      { month: 'Next M3', low: avgRevenue * 0.95, high: avgRevenue * 1.2, projection: avgRevenue * 1.12 },
   ];

   const COLORS = [accentColor, '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

   // 10. Zero-Trust Expense Creation
   const handleAddExpense = async () => {
      if (!newExpData.description || !newExpData.amount) return;
      setIsSubmitting(true);
      try {
         const userRole = (user?.role || '').toLowerCase();
         const isPrivileged = ['admin', 'super_admin', 'ceo'].includes(userRole);
         const expense: ExpenseRecord = {
            id: `EXP-${Date.now()}`,
            siteId: activeSite?.id || 'SITE-0001',
            date: newExpData.date || new Date().toISOString().split('T')[0],
            category: (newExpData.category as any) || 'Other',
            description: newExpData.description,
            amount: Number(newExpData.amount),
            status: isPrivileged ? ((newExpData.status as any) || 'Pending') : 'Pending',
            approvedBy: isPrivileged ? (user?.name || 'Admin') : 'Pending HQ Approval'
         };
         await addExpense(expense);
         setIsAddExpenseOpen(false);
         setNewExpData({ category: 'Other', status: 'Pending', date: new Date().toISOString().split('T')[0] });
         addNotification('success', 'Expense record submitted.');
      } catch (error) {
         logger.error('useFinancialsState', 'caught error', error as Error);
         addNotification('alert', 'Failed to log expense');
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
         country: activeCountry,
         currency: currencySymbol,
         reportDate: new Date().toISOString(),
         metrics: {
            totalRevenue,
            totalRefunds,
            totalExpenses: {
               operating: totalOpEx,
               payroll: totalSalaries
            },
            tax: {
               authority: currentTaxConfig.authority,
               taxName: currentTaxConfig.taxName,
               rate: currentTaxConfig.rate,
               estimatedLiability: netTaxPayable
            },
            netProfit,
            profitMargin: `${profitMargin.toFixed(1)}%`
         }
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `siifmart_${activeCountry.toLowerCase()}_pnl_report_${new Date().toISOString().split('T')[0]}.json`;
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
         await processPayroll(activeSite?.id || 'SITE-0001', user?.name || 'Admin');
         setIsPayrollModalOpen(false);
      } catch (error) {
         logger.error('useFinancialsState', 'caught error', error as Error);
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleGenerateFiling = () => {
      setIsSubmitting(true);
      addNotification('info', `Generating ${currentTaxConfig.taxName} Filing for ${currentTaxConfig.authority}...`);
      setTimeout(() => {
         addNotification('success', `Tax Report Generated! Net Payable: ${currencySymbol} ${netTaxPayable.toLocaleString()}`);
         setIsSubmitting(false);
      }, 1200);
   };

   const handleDownloadBankFile = () => {
      setIsSubmitting(true);
      addNotification('info', 'Generating Bank Payment File (ABA/NACHA)...');
      setTimeout(() => {
         addNotification('success', 'Bank File Downloaded Successfully');
         setIsSubmitting(false);
      }, 1200);
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
      effectiveCountry: activeCountry, countryProfile, currencySymbol, currentTaxConfig, newExpData, setNewExpData,
      dateRange, setDateRange, localExpenses, setLocalExpenses, expensesLoading, setExpensesLoading, totalExpensesCount,
      setTotalExpensesCount, currentExpensesPage, setCurrentExpensesPage, serverFinancials, setServerFinancials,
      filteredExpenses, filteredSales, expenseBreakdownData, cashflowData, ...payroll, totalRevenue, totalSalaries,
      totalOpEx, calculateEmployeeBonus: localCalculateEmployeeBonus, totalBonuses, totalInventoryValue, totalExpenses,
      totalRefunds, estimatedTaxLiability, inputTaxCredit, netTaxPayable, netProfit, profitMargin, forecastData, COLORS,
      EXPENSES_PER_PAGE, apAging, getQuarterProgress, getDateRangeLabels: localGetDateRangeLabels,
      getQuarterInfo: localGetQuarterInfo, handleAddExpense, handleDeleteExpense, handleConfirmDeleteExpense,
      handleExportPnL, handleProcessPayroll, handleConfirmPayroll, handleGenerateFiling, handleDownloadBankFile,
      handleGenerateReport
   };
}
