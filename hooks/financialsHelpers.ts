import { Employee, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION, PurchaseOrder } from '../types';
import { calculateStoreBonus } from '../components/StoreBonusDisplay';
import { DateRangeOption } from './useDateFilter';
import { Country, getCountryProfile } from '../utils/localization';

export interface CountryTaxConfig {
    name: string;
    taxName: string;
    rate: number;
    code: string;
    authority: string;
}

export interface ApAgingSummary {
    current: number;
    days1to30: number;
    days31to60: number;
    days60Plus: number;
    totalOutstanding: number;
}

export function getCountryTaxConfig(country?: Country, settingsTaxRate?: number): CountryTaxConfig {
    const profile = getCountryProfile(country || 'ET');
    const effectiveRate = typeof settingsTaxRate === 'number' && settingsTaxRate >= 0
        ? settingsTaxRate
        : profile.taxRate;

    return {
        name: profile.name.replace(/\s*\(.*\)/, '').trim(),
        taxName: profile.code === 'ET' ? 'VAT (ERCA)' : profile.code === 'KE' ? 'VAT (KRA)' : 'VAT',
        rate: effectiveRate,
        code: profile.currencySymbol,
        authority: profile.taxAuthority
    };
}

export const getQuarterInfo = (d = new Date()) => {
    const q = Math.floor(d.getMonth() / 3) + 1;
    const year = d.getFullYear();
    const start = new Date(year, (q - 1) * 3, 1);
    const end = new Date(year, q * 3, 0);
    return { q, year, start, end };
};

export const getDateRangeLabels = (dateRange: DateRangeOption) => {
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

export function getDateRangeBounds(dateRange: DateRangeOption): { startDate?: string; endDate?: string } {
    const now = new Date();
    const { q, year } = getQuarterInfo(now);

    if (dateRange === 'This Month') {
        return {
            startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
        };
    }
    if (dateRange === 'Last Month') {
        return {
            startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
            endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
        };
    }
    if (dateRange === 'This Quarter') {
        return {
            startDate: new Date(year, (q - 1) * 3, 1).toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
        };
    }
    if (dateRange === 'This Year') {
        return {
            startDate: new Date(year, 0, 1).toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
        };
    }
    if (dateRange === 'Last Year') {
        return {
            startDate: new Date(year - 1, 0, 1).toISOString().split('T')[0],
            endDate: new Date(year - 1, 11, 31).toISOString().split('T')[0]
        };
    }
    return {};
}

export const isWithinRange = (dateString: string, dateRange: DateRangeOption) => {
    if (dateRange === 'All Time') return true;
    const date = new Date(dateString);
    const now = new Date();
    const { q, year } = getQuarterInfo(now);
    const start = new Date();
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

export const calculateEmployeeBonus = (
    emp: Employee,
    sites: any[],
    getStorePoints: (siteId: string) => any,
    settings: any
): number => {
    const empSite = sites.find(s => s.id === emp.siteId || s.id === (emp as any).site_id);
    if (!empSite) return 0;

    const storePointsData = getStorePoints(empSite.id);
    if (!storePointsData) return 0;

    const bonusTiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
    const roleDistribution = settings.posRoleDistribution || DEFAULT_POS_ROLE_DISTRIBUTION;

    const storeBonus = calculateStoreBonus(storePointsData.monthlyPoints, bonusTiers);
    const roleConfig = roleDistribution.find((r: any) =>
        r.role.toLowerCase() === emp.role.toLowerCase()
    );

    return roleConfig ? (storeBonus.bonus * roleConfig.percentage) / 100 : 0;
};

export function calculateApAging(orders: PurchaseOrder[]): ApAgingSummary {
    const now = Date.now();
    const summary: ApAgingSummary = {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days60Plus: 0,
        totalOutstanding: 0
    };

    const payableOrders = (orders || []).filter(po => {
        const status = po.status || '';
        return ['Approved', 'Ordered', 'Partially Received', 'Received', 'Pending'].includes(status);
    });

    for (const po of payableOrders) {
        const amount = Number(po.totalAmount ?? (po as any).total_amount ?? 0);
        if (amount <= 0) continue;

        const poDate = po.date ? new Date(po.date).getTime() : now;
        const ageInDays = Math.floor((now - poDate) / (1000 * 3600 * 24));

        if (ageInDays <= 30) {
            summary.current += amount;
        } else if (ageInDays <= 60) {
            summary.days1to30 += amount;
        } else if (ageInDays <= 90) {
            summary.days31to60 += amount;
        } else {
            summary.days60Plus += amount;
        }
        summary.totalOutstanding += amount;
    }

    return summary;
}

export function computeWeeklyCashflow(filteredSales: any[], filteredExpenses: any[]) {
    const getWeekNumber = (d: Date) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const salesByWeek = filteredSales.reduce((acc, s) => {
        const date = new Date(s.created_at || s.date || new Date());
        const week = `W${getWeekNumber(date)}`;
        acc[week] = (acc[week] || 0) + (Number(s.total) || 0);
        return acc;
    }, {} as Record<string, number>);

    const expensesByWeek = filteredExpenses.reduce((acc, e) => {
        const date = new Date(e.date || new Date());
        const week = `W${getWeekNumber(date)}`;
        acc[week] = (acc[week] || 0) + (Number(e.amount) || 0);
        return acc;
    }, {} as Record<string, number>);

    const allWeeks = Array.from(new Set([...Object.keys(salesByWeek), ...Object.keys(expensesByWeek)])).sort();
    if (allWeeks.length === 0) {
        return [{ name: 'Current Period', income: 0, expense: 0, revenue: 0, expenses: 0 }];
    }

    return allWeeks.map(week => {
        const income = salesByWeek[week] || 0;
        const expense = expensesByWeek[week] || 0;
        return {
            name: week,
            income,
            expense,
            revenue: income,
            expenses: expense
        };
    });
}
