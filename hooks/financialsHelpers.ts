import { Employee, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION } from '../types';
import { calculateStoreBonus } from '../components/StoreBonusDisplay';
import { DateRangeOption } from './useDateFilter';

export const TAX_REGIONS: any = {
    'SYSTEM': { name: 'System Default', taxName: 'Tax', rate: 0, code: 'N/A' },
    'ET': { name: 'Ethiopia', taxName: 'VAT', rate: 15, code: 'ETB' },
    'KE': { name: 'Kenya', taxName: 'VAT', rate: 16, code: 'KES' },
    'UG': { name: 'Uganda', taxName: 'VAT', rate: 18, code: 'UGX' },
    'US': { name: 'USA (Avg)', taxName: 'Sales Tax', rate: 8.25, code: 'USD' },
    'EU': { name: 'Europe (Avg)', taxName: 'VAT', rate: 20, code: 'EUR' },
    'AE': { name: 'UAE', taxName: 'VAT', rate: 5, code: 'AED' },
};

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
