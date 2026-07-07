import React, { createContext, useContext } from 'react';
import type { ExpenseRecord, Employee, Site } from '../../types';

export type FinanceTab = 'overview' | 'expenses' | 'payroll' | 'tax' | 'budget';

export interface FinanceContextType {
    user: any;
    theme: string;
    accentColor: string;
    employees: Employee[];
    sales: any[];
    expenses: ExpenseRecord[];
    allProducts: any[];
    addExpense: (expense: ExpenseRecord) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    processPayroll: (siteId: string, processedBy: string) => Promise<void>;
    activeSite: Site | null;
    addNotification: (type: any, message: string) => void;
    settings: any;
    sites: Site[];
    getStorePoints: (siteId: string) => any;

    activeTab: FinanceTab;
    setActiveTab: (tab: FinanceTab) => void;
    isAddExpenseOpen: boolean;
    setIsAddExpenseOpen: (open: boolean) => void;
    isSubmitting: boolean;
    setIsSubmitting: (sub: boolean) => void;
    isDeleteExpenseModalOpen: boolean;
    setIsDeleteExpenseModalOpen: (open: boolean) => void;
    expenseToDelete: string | null;
    setExpenseToDelete: (id: string | null) => void;
    deleteInput: string;
    setDeleteInput: (val: string) => void;
    isPayrollModalOpen: boolean;
    setIsPayrollModalOpen: (open: boolean) => void;
    selectedRegion: string;
    setSelectedRegion: (region: any) => void;
    currentTaxConfig: { name: string; taxName: string; rate: number; code: string };
    newExpData: Partial<ExpenseRecord>;
    setNewExpData: React.Dispatch<React.SetStateAction<Partial<ExpenseRecord>>>;
    dateRange: string;
    setDateRange: (range: any) => void;
    localExpenses: ExpenseRecord[];
    setLocalExpenses: (expenses: ExpenseRecord[]) => void;
    expensesLoading: boolean;
    setExpensesLoading: (loading: boolean) => void;
    totalExpensesCount: number;
    setTotalExpensesCount: (count: number) => void;
    currentExpensesPage: number;
    setCurrentExpensesPage: (page: number) => void;
    serverFinancials: any;
    setServerFinancials: (financials: any) => void;

    // Computed values
    filteredExpenses: ExpenseRecord[];
    filteredSales: any[];
    expenseBreakdownData: { name: string; value: number }[];
    cashflowData: any[];
    payrollSearch: string;
    setPayrollSearch: (val: string) => void;
    payrollRoleFilter: string;
    setPayrollRoleFilter: (val: string) => void;
    payrollSort: 'name' | 'salary' | 'department';
    setPayrollSort: (val: any) => void;
    payrollSortDir: 'asc' | 'desc';
    setPayrollSortDir: (val: any) => void;
    payrollPage: number;
    setPayrollPage: (page: number) => void;
    payrollPerPage: number;
    setPayrollPerPage: (size: number) => void;
    filteredEmployees: Employee[];
    payrollTotalPages: number;
    payrollStartIndex: number;
    payrollEndIndex: number;
    paginatedEmployees: Employee[];
    getPayrollPageNumbers: () => (number | string)[];
    uniqueRoles: string[];
    totalRevenue: number;
    totalSalaries: number;
    totalOpEx: number;
    calculateEmployeeBonus: (emp: Employee) => number;
    totalBonuses: number;
    totalInventoryValue: number;
    totalExpenses: number;
    totalRefunds: number;
    estimatedTaxLiability: number;
    inputTaxCredit: number;
    netTaxPayable: number;
    netProfit: number;
    profitMargin: number;
    forecastData: any[];
    COLORS: string[];
    TAX_REGIONS: any;
    EXPENSES_PER_PAGE: number;

    // Handlers
    getQuarterProgress: () => number;
    getDateRangeLabels: () => string;
    getQuarterInfo: (d?: Date) => { q: number; year: number; start: Date; end: Date };
    handleAddExpense: () => Promise<void>;
    handleDeleteExpense: (id: string) => void;
    handleConfirmDeleteExpense: () => Promise<void>;
    handleExportPnL: () => void;
    handleProcessPayroll: () => void;
    handleConfirmPayroll: () => Promise<void>;
    handleGenerateFiling: () => void;
    handleDownloadBankFile: () => void;
    handleGenerateReport: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ value: FinanceContextType; children: React.ReactNode }> = ({ value, children }) => {
    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
};
