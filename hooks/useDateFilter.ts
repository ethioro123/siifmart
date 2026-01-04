
import { useState, useCallback, useMemo } from 'react';

export type DateRangeOption =
    | 'All Time' | 'This Month' | 'Last Month' | 'This Quarter' | 'This Year' | 'Last Year'
    | 'Q1 2025' | 'Q2 2025' | 'Q3 2025' | 'Q4 2025'
    | 'Q1 2024' | 'Q2 2024' | 'Q3 2024' | 'Q4 2024';

export function useDateFilter(defaultRange: DateRangeOption = 'This Quarter') {
    const [dateRange, setDateRange] = useState<DateRangeOption>(defaultRange);

    const getQuarterInfo = (d = new Date()) => {
        const q = Math.floor(d.getMonth() / 3) + 1;
        const year = d.getFullYear();
        const start = new Date(year, (q - 1) * 3, 1);
        const end = new Date(year, q * 3, 0); // Last day of previous month from next quarter start
        end.setHours(23, 59, 59, 999);
        return { q, year, start, end };
    };

    const isWithinRange = useCallback((dateString: string) => {
        if (!dateString) return false;
        if (dateRange === 'All Time') return true;

        const date = new Date(dateString);
        const now = new Date();
        const { q, year } = getQuarterInfo(now);

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        switch (dateRange) {
            case 'This Month':
                start.setDate(1);
                return date >= start && date <= end;
            case 'Last Month':
                start.setMonth(now.getMonth() - 1);
                start.setDate(1);
                end.setDate(0); // Last day of previous month
                return date >= start && date <= end;
            case 'This Quarter':
                const qInfo = getQuarterInfo(now);
                return date >= qInfo.start && date <= qInfo.end;
            case 'This Year':
                start.setMonth(0, 1);
                return date >= start && date <= end;
            case 'Last Year':
                start.setFullYear(year - 1, 0, 1); // Jan 1st last year
                end.setFullYear(year - 1, 11, 31); // Dec 31st last year
                return date >= start && date <= end;
            default:
                return true;
        }
    }, [dateRange]);

    const rangeStrings = useMemo(() => {
        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const { year } = getQuarterInfo(now);

        switch (dateRange) {
            case 'This Month':
                start.setDate(1);
                return { start, end };
            case 'Last Month':
                start.setMonth(now.getMonth() - 1);
                start.setDate(1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                return { start, end };
            case 'This Quarter':
                const qInfo = getQuarterInfo(now);
                return { start: qInfo.start, end: qInfo.end };
            case 'This Year':
                start.setMonth(0, 1);
                return { start, end };
            case 'Last Year':
                start.setFullYear(year - 1, 0, 1);
                end.setFullYear(year - 1, 11, 31);
                end.setHours(23, 59, 59, 999);
                return { start, end };
            case 'All Time':
            default:
                return { start: undefined, end: undefined };
        }
    }, [dateRange]);

    const { start: startDate, end: endDate } = rangeStrings;

    return {
        dateRange,
        setDateRange,
        isWithinRange,
        startDate,
        endDate
    };
}
