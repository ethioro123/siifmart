import { useEffect } from 'react';
import { expensesService } from '../services/expenses.service';
import { getDateRangeBounds } from './financialsHelpers';
import { logger } from '../utils/logger';
import { ExpenseRecord } from '../types';
import { DateRangeOption } from './useDateFilter';

interface UseFinancialsDataFetchParams {
    activeTab: string;
    currentExpensesPage: number;
    expensesPerPage: number;
    dateRange: DateRangeOption;
    isCountryAdmin: boolean;
    activeSiteId?: string;
    activeCountry: string;
    setLocalExpenses: (expenses: ExpenseRecord[]) => void;
    setTotalExpensesCount: (count: number) => void;
    setExpensesLoading: (loading: boolean) => void;
    setServerFinancials: (data: any) => void;
}

export function useFinancialsDataFetch({
    activeTab,
    currentExpensesPage,
    expensesPerPage,
    dateRange,
    isCountryAdmin,
    activeSiteId,
    activeCountry,
    setLocalExpenses,
    setTotalExpensesCount,
    setExpensesLoading,
    setServerFinancials
}: UseFinancialsDataFetchParams) {
    // 1. Fetch Paginated Expenses (Country & Site Scoped)
    useEffect(() => {
        if (activeTab === 'expenses') {
            const fetchExpenses = async () => {
                setExpensesLoading(true);
                try {
                    const offset = (currentExpensesPage - 1) * expensesPerPage;
                    const { startDate, endDate } = getDateRangeBounds(dateRange);
                    const querySiteId = isCountryAdmin ? undefined : activeSiteId;

                    const { data, count } = await expensesService.getAll(querySiteId, expensesPerPage, offset, {
                        startDate,
                        endDate,
                        countryCode: activeCountry
                    });

                    setLocalExpenses(data);
                    setTotalExpensesCount(count);
                } catch (error) {
                    logger.error('useFinancialsDataFetch', 'Failed to fetch expenses', error as Error);
                } finally {
                    setExpensesLoading(false);
                }
            };
            fetchExpenses();
        }
    }, [activeTab, currentExpensesPage, activeSiteId, isCountryAdmin, dateRange, activeCountry, expensesPerPage]);

    // 2. Fetch Server Financial Metrics with Country Isolation
    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const { startDate, endDate } = getDateRangeBounds(dateRange);
                const querySiteId = isCountryAdmin ? undefined : activeSiteId;
                const data = await expensesService.getFinancialMetrics(
                    querySiteId,
                    startDate ? `${startDate}T00:00:00.000Z` : undefined,
                    endDate ? `${endDate}T23:59:59.999Z` : undefined,
                    activeCountry
                );
                setServerFinancials(data);
            } catch (err) {
                logger.error('useFinancialsDataFetch', 'Error fetching financial metrics:', err);
            }
        };

        fetchFinancials();
    }, [dateRange, activeSiteId, isCountryAdmin, activeCountry]);
}
