import { useState, useMemo } from 'react';
import { ExpenseRecord, Employee } from '../types';
import { expensesService } from '../services/expenses.service';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { DateRangeOption } from '../hooks/useDateFilter';
import { logger } from '../utils/logger';
import { getCountryProfile, Country } from '../utils/localization';
import { isAdminSite } from '../utils/countryAdmin';
import {
   getCountryTaxConfig,
   getQuarterInfo,
   getDateRangeLabels,
   isWithinRange,
   calculateEmployeeBonus,
   calculateApAging,
   computeWeeklyCashflow
} from './financialsHelpers';
import {
   exportPnLReportJson,
   exportTaxDeclarationFile,
   exportBankDisbursementFile,
   generateQuarterlyPdf
} from './financialsExportHelpers';
import { useFinancialPayrollState } from './useFinancialPayrollState';
import { useFinancialsDataFetch } from './useFinancialsDataFetch';

const EXPENSES_PER_PAGE = 20;

export function useFinancialsState() {
   const { user, theme } = useStore();
   const accentColor = 'var(--theme-accent)';
   const {
      employees,
      sales,
      allSales,
      expenses,
      allProducts,
      allOrders,
      addExpense,
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

   // Zero-Trust Void Modal State (Soft-void replacing hard delete)
   const [isVoidExpenseModalOpen, setIsVoidExpenseModalOpen] = useState(false);
   const [expenseToVoid, setExpenseToVoid] = useState<ExpenseRecord | null>(null);

   // Legacy compatibility modal hooks
   const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
   const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
   const [deleteInput, setDeleteInput] = useState('');

   const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

   // Sovereign Country Tax Configuration
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

   // Data fetching effects extracted to sub-hook
   useFinancialsDataFetch({
      activeTab,
      currentExpensesPage,
      expensesPerPage: EXPENSES_PER_PAGE,
      dateRange,
      isCountryAdmin,
      activeSiteId: activeSite?.id,
      activeCountry,
      setLocalExpenses,
      setTotalExpensesCount,
      setExpensesLoading,
      setServerFinancials
   });

   const localGetDateRangeLabels = () => getDateRangeLabels(dateRange);
   const localIsWithinRange = (dateString: string) => isWithinRange(dateString, dateRange);

   const getQuarterProgress = () => {
      const now = new Date();
      const { start, end } = getQuarterInfo(now);
      const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
      const daysPassed = (now.getTime() - start.getTime()) / (1000 * 3600 * 24);
      return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
   };

   // Resolve active datasets
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

   // Expense Breakdown
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

   // Cashflow Trend
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

   // Bonus and Salary Calculations
   const localCalculateEmployeeBonus = (emp: Employee) => calculateEmployeeBonus(emp, sites, getStorePoints, settings);

   const totalRevenue = useMemo(() => {
      if (serverFinancials?.total_revenue !== undefined) return serverFinancials.total_revenue;
      return filteredSales.reduce((sum, s) => sum + (s.total || (s as any).total_amount || 0), 0);
   }, [filteredSales, serverFinancials]);

   const totalSalaries = useMemo(() => {
      return employees.reduce((sum, emp) => {
         if ((emp.status || 'Active') === 'Terminated') return sum;
         return sum + (Number(emp.salary) || 0);
      }, 0);
   }, [employees]);

   const totalOpEx = useMemo(() => {
      if (serverFinancials?.total_expenses !== undefined) return serverFinancials.total_expenses;
      return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
   }, [filteredExpenses, serverFinancials]);

   const totalBonuses = useMemo(() => {
      return employees.reduce((sum, emp) => sum + localCalculateEmployeeBonus(emp), 0);
   }, [employees, filteredSales]);

   const totalInventoryValue = useMemo(() => {
      return (allProducts || []).reduce((sum, p) => {
         const pAny = p as any;
         const qty = isCountryAdmin
            ? (pAny.inventory ? Object.values(pAny.inventory).reduce((a: any, b: any) => a + b, 0) : (p.stock || 0))
            : (pAny.inventory?.[activeSite?.id || ''] ?? (p.stock || 0));
         return sum + ((qty as number) * (pAny.cost_price || p.costPrice || 0));
      }, 0);
   }, [allProducts, isCountryAdmin, activeSite?.id]);

   const totalExpenses = totalOpEx + totalSalaries + totalBonuses;
   const totalRefunds = serverFinancials?.total_refunds ?? 0;

   // Sovereign Tax Compliance Engine
   const estimatedTaxLiability = useMemo(() => {
      const rate = (currentTaxConfig.rate || 15) / 100;
      return (totalRevenue - totalRefunds) * rate;
   }, [totalRevenue, totalRefunds, currentTaxConfig.rate]);

   const inputTaxCredit = useMemo(() => {
      const rate = (currentTaxConfig.rate || 15) / 100;
      return totalOpEx * (rate / (1 + rate));
   }, [totalOpEx, currentTaxConfig.rate]);

   const netTaxPayable = Math.max(0, estimatedTaxLiability - inputTaxCredit);
   const netProfit = totalRevenue - totalRefunds - totalExpenses - netTaxPayable;
   const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

   // Accounts Payable Aging & Forecasting
   const apAging = useMemo(() => calculateApAging(allOrders), [allOrders]);

   const forecastData = useMemo(() => {
      const historicalPoints = cashflowData.slice(-6);
      const avgRevenue = historicalPoints.length > 0
         ? historicalPoints.reduce((acc: number, p: any) => acc + (p.revenue || p.income || 0), 0) / historicalPoints.length
         : 10000;

      const growthRate = 1.05;
      return [
         { name: 'Month +1', projectedRevenue: Math.round(avgRevenue * Math.pow(growthRate, 1)), confidenceLow: Math.round(avgRevenue * 0.95), confidenceHigh: Math.round(avgRevenue * 1.1) },
         { name: 'Month +2', projectedRevenue: Math.round(avgRevenue * Math.pow(growthRate, 2)), confidenceLow: Math.round(avgRevenue * 0.92), confidenceHigh: Math.round(avgRevenue * 1.15) },
         { name: 'Month +3', projectedRevenue: Math.round(avgRevenue * Math.pow(growthRate, 3)), confidenceLow: Math.round(avgRevenue * 0.88), confidenceHigh: Math.round(avgRevenue * 1.22) }
      ];
   }, [cashflowData]);

   const COLORS = [
      accentColor,
      'var(--theme-status-info)',
      'var(--theme-status-warning)',
      'var(--theme-status-danger)',
      'var(--theme-status-success)',
      'var(--theme-text-muted)'
   ];

   // Zero-Trust Expense Creation (Strictly Pending, Captures Creator)
   const handleAddExpense = async () => {
      if (!newExpData.description || !newExpData.amount) return;
      setIsSubmitting(true);
      try {
         const expensePayload: any = {
            siteId: activeSite?.id || 'SITE-0001',
            countryCode: activeCountry,
            date: newExpData.date || new Date().toISOString().split('T')[0],
            category: (newExpData.category as any) || 'Other',
            description: newExpData.description,
            amount: Number(newExpData.amount),
            status: 'Pending',
            createdById: user?.id || user?.employeeId,
            createdByName: user?.name || 'Staff Member',
            creatorUser: {
               id: user?.id || user?.employeeId || 'STAFF-001',
               name: user?.name || 'Staff Member',
               role: user?.role || 'staff'
            },
            thresholdLimit: settings?.expenseApprovalLimit || 50000
         };

         const saved = await expensesService.create(expensePayload);
         setLocalExpenses(prev => [saved, ...prev]);
         setIsAddExpenseOpen(false);
         setNewExpData({ category: 'Other', status: 'Pending', date: new Date().toISOString().split('T')[0] });
         addNotification('success', `Expense submitted (${saved.escalatedToCeo ? 'Escalated to CEO' : 'Pending Approval'}).`);
      } catch (error: any) {
         logger.error('useFinancialsState', 'caught error', error as Error);
         addNotification('alert', error?.message || 'Failed to log expense');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Maker/Checker Expense Approval
   const handleApproveExpense = async (id: string) => {
      setIsSubmitting(true);
      try {
         const approverUser = {
            id: user?.id || user?.employeeId || 'FIN-MGR-001',
            name: user?.name || 'Country Finance Director',
            role: user?.role || 'country_finance_director',
            countryCode: user?.country_code || (user as any)?.countryCode || (user as any)?.country || effectiveCountry || 'ET'
         };
         const updated = await expensesService.approve(id, approverUser);
         setLocalExpenses(prev => prev.map(e => e.id === id ? updated : e));
         addNotification('success', `Expense approved by ${approverUser.name}`);
      } catch (error: any) {
         logger.error('useFinancialsState', 'Failed to approve expense', error as Error);
         addNotification('alert', error?.message || 'Failed to approve expense');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Expense Rejection
   const handleRejectExpense = async (id: string, reason?: string) => {
      setIsSubmitting(true);
      try {
         const rejectorUser = {
            id: user?.id || user?.employeeId || 'FIN-MGR-001',
            name: user?.name || 'Country Finance Director',
            role: user?.role || 'country_finance_director',
            reason
         };
         const updated = await expensesService.reject(id, rejectorUser);
         setLocalExpenses(prev => prev.map(e => e.id === id ? updated : e));
         addNotification('info', `Expense marked as rejected by ${rejectorUser.name}`);
      } catch (error: any) {
         logger.error('useFinancialsState', 'Failed to reject expense', error as Error);
         addNotification('alert', error?.message || 'Failed to reject expense');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Zero-Trust Soft-Void Action (Replaces Delete)
   const handleTriggerVoidExpense = (exp: ExpenseRecord | string) => {
      const record = typeof exp === 'string'
         ? localExpenses.find(e => e.id === exp) || ({ id: exp, amount: 0, category: 'Other', description: '' } as ExpenseRecord)
         : exp;
      setExpenseToVoid(record);
      setIsVoidExpenseModalOpen(true);
   };

   const handleConfirmVoidExpense = async (reason: string) => {
      if (!expenseToVoid) return;
      setIsSubmitting(true);
      try {
         const voided = await expensesService.voidExpense(expenseToVoid.id, {
            reason,
            voidedById: user?.id || user?.employeeId || 'FIN-MGR-001',
            voidedByName: user?.name || 'Country Finance Director'
         });
         setLocalExpenses(prev => prev.map(e => e.id === expenseToVoid.id ? voided : e));
         setIsVoidExpenseModalOpen(false);
         setExpenseToVoid(null);
         addNotification('success', `Expense #${expenseToVoid.id.slice(0, 8)} voided successfully.`);
      } catch (error: any) {
         logger.error('useFinancialsState', 'Failed to void expense', error as Error);
         addNotification('alert', error?.message || 'Failed to void expense');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleDeleteExpense = (id: string) => handleTriggerVoidExpense(id);
   const handleConfirmDeleteExpense = () => handleConfirmVoidExpense('Administrative Correction');

   // Reporting & Disbursements
   const handleExportPnL = () => {
      exportPnLReportJson({
         activeCountry,
         currencySymbol,
         totalRevenue,
         totalRefunds,
         totalOpEx,
         totalSalaries,
         currentTaxConfig,
         netTaxPayable,
         netProfit,
         profitMargin
      });
   };

   const handleProcessPayroll = () => setIsPayrollModalOpen(true);

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
      try {
         const filename = exportTaxDeclarationFile({
            activeCountry,
            currencySymbol,
            currentTaxConfig,
            totalRevenue,
            totalRefunds,
            totalOpEx,
            estimatedTaxLiability,
            inputTaxCredit,
            netTaxPayable
         });
         addNotification('success', `Exported sovereign tax declaration: ${filename}`);
      } catch (error) {
         logger.error('useFinancialsState', 'Failed to export tax filing', error as Error);
         addNotification('alert', 'Failed to generate tax filing');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleDownloadBankFile = () => {
      setIsSubmitting(true);
      try {
         const filename = exportBankDisbursementFile({
            activeCountry,
            currencySymbol,
            employees,
            calculateEmployeeBonus: localCalculateEmployeeBonus
         });
         addNotification('success', `Generated bulk bank disbursement file: ${filename}`);
      } catch (error) {
         logger.error('useFinancialsState', 'Failed to export bank file', error as Error);
         addNotification('alert', 'Failed to export bank disbursement file');
      } finally {
         setIsSubmitting(false);
      }
   };

   const localGetQuarterInfo = (d = new Date()) => getQuarterInfo(d);

   const handleGenerateReport = () => {
      generateQuarterlyPdf({
         totalRevenue,
         totalExpenses,
         totalRefunds,
         netProfit,
         profitMargin,
         totalSalaries,
         totalOpEx,
         dateRangeLabel: localGetDateRangeLabels()
      });
   };

   return {
      user, theme, accentColor, employees, sales, expenses, allProducts, addExpense, deleteExpense: handleDeleteExpense, processPayroll,
      activeSite, addNotification, settings, sites, getStorePoints, activeTab, setActiveTab, isAddExpenseOpen,
      setIsAddExpenseOpen, isSubmitting, setIsSubmitting, isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen,
      expenseToDelete, setExpenseToDelete, deleteInput, setDeleteInput, isVoidExpenseModalOpen, setIsVoidExpenseModalOpen,
      expenseToVoid, setExpenseToVoid, isPayrollModalOpen, setIsPayrollModalOpen,
      effectiveCountry: activeCountry, countryProfile, currencySymbol, currentTaxConfig, newExpData, setNewExpData,
      dateRange, setDateRange, localExpenses, setLocalExpenses, expensesLoading, setExpensesLoading, totalExpensesCount,
      setTotalExpensesCount, currentExpensesPage, setCurrentExpensesPage, serverFinancials, setServerFinancials,
      filteredExpenses, filteredSales, expenseBreakdownData, cashflowData, ...payroll, totalRevenue, totalSalaries,
      totalOpEx, calculateEmployeeBonus: localCalculateEmployeeBonus, totalBonuses, totalInventoryValue, totalExpenses,
      totalRefunds, estimatedTaxLiability, inputTaxCredit, netTaxPayable, netProfit, profitMargin, forecastData, COLORS,
      EXPENSES_PER_PAGE, apAging, getQuarterProgress, getDateRangeLabels: localGetDateRangeLabels,
      getQuarterInfo: localGetQuarterInfo, handleAddExpense, handleDeleteExpense, handleConfirmDeleteExpense,
      handleTriggerVoidExpense, handleConfirmVoidExpense,
      handleApproveExpense, handleRejectExpense, handleExportPnL, handleProcessPayroll, handleConfirmPayroll,
      handleGenerateFiling, handleDownloadBankFile, handleGenerateReport
   };
}
