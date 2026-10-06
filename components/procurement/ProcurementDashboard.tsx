import React from 'react';
import { DollarSign, Package, TrendingUp, Building, Clock, Calendar } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import DateRangeSelector from '../../components/DateRangeSelector';
import { formatCompactNumber } from '../../utils/formatting';
import { Supplier } from '../../types';
import { DateRangeOption } from '../../hooks/useDateFilter';
import { useStore } from '../../contexts/CentralStore';

interface ProcurementMetrics {
    totalSpend: number;
    openPO: number;
    pendingValue: number;
    potentialRevenue: number;
    categoryData: any[];
    trendData: any[];
}

interface ProcurementDashboardProps {
    metrics: ProcurementMetrics;
    dateRange: DateRangeOption;
    setDateRange: (range: DateRangeOption) => void;
    suppliers: Supplier[];
    currencySymbol?: string;
}

export const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({
    metrics, dateRange, setDateRange, suppliers, currencySymbol = 'ETB'
}) => {
    const { theme } = useStore();
    const accentColor = theme === 'dark' ? '#2997FF' : '#0071E3';
    const COLORS = [
        accentColor,
        '#30D158', // Apple Emerald
        '#FF9F0A', // Apple Amber
        '#BF5AF2', // Apple Purple
        '#64D2FF'  // Apple Cyan
    ];

    const KpiCard = ({ title, value, sub, icon: Icon }: any) => (
        <div className="rounded-2xl p-5 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm hover:border-[var(--theme-border-focus)] group transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] flex items-center justify-center text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] transition-colors">
                    <Icon size={18} strokeWidth={2} />
                </div>
            </div>
            <h3 className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider mb-1.5">{title}</h3>
            <div className="text-2xl sm:text-3xl font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums tracking-tight mb-1">{value}</div>
            <p className="text-xs text-[var(--theme-text-secondary)] font-normal">{sub}</p>
        </div>
    );

    const getDateRangeLabels = () => {
        const now = new Date();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        switch (dateRange) {
            case 'This Month': return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
            case 'Last Month': {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;
            }
            case 'This Quarter': {
                const q = Math.floor(now.getMonth() / 3) + 1;
                return `Q${q} ${now.getFullYear()}`;
            }
            case 'This Year': return `${now.getFullYear()}`;
            case 'Last Year': return `${now.getFullYear() - 1}`;
            case 'All Time': return 'Historical Data';
            default: return dateRange;
        }
    };

    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="h-20 rounded-2xl bg-[var(--theme-bg-subtle)] animate-pulse border border-[var(--theme-border-subtle)]" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-32 rounded-2xl bg-[var(--theme-bg-subtle)] animate-pulse border border-[var(--theme-border-subtle)]" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[400px] rounded-2xl bg-[var(--theme-bg-subtle)] animate-pulse border border-[var(--theme-border-subtle)]" />
                    <div className="h-[400px] rounded-2xl bg-[var(--theme-bg-subtle)] animate-pulse border border-[var(--theme-border-subtle)]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Date Analysis Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] flex items-center justify-center text-[var(--theme-accent)]">
                        <Calendar size={18} strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-[var(--theme-text-primary)] font-semibold text-sm">Temporal Analysis</h3>
                        <p className="text-[var(--theme-text-secondary)] text-xs font-mono">{getDateRangeLabels()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[var(--theme-text-secondary)] text-xs font-medium">Period:</span>
                    <DateRangeSelector
                        value={dateRange}
                        onChange={setDateRange}
                        options={[
                            'All Time', 'This Month', 'Last Month', 'This Quarter', 'This Year', 'Last Year',
                            'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025',
                            'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'
                        ]}
                    />
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative z-0">
                <KpiCard
                    title={`Total Spend (${dateRange === 'All Time' ? 'Life' : dateRange.replace('This ', '')})`}
                    value={formatCompactNumber(metrics.totalSpend, { currency: currencySymbol })}
                    sub="Across all categories"
                    icon={DollarSign}
                />
                <KpiCard
                    title="Open Orders"
                    value={metrics.openPO}
                    sub={`Value: ${formatCompactNumber(metrics.pendingValue, { currency: currencySymbol })}`}
                    icon={Package}
                />
                <KpiCard
                    title="Potential Revenue"
                    value={formatCompactNumber(metrics.potentialRevenue, { currency: currencySymbol })}
                    sub="From current PO items"
                    icon={TrendingUp}
                />
                <KpiCard
                    title="Active Vendors"
                    value={suppliers.filter(s => s.status === 'Active').length}
                    sub="Sovereign approved"
                    icon={Building}
                />
                <KpiCard
                    title="On-Time Delivery"
                    value="94.2%"
                    sub="Rolling 30 Days"
                    icon={Clock}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm p-6">
                    <h3 className="font-semibold text-[var(--theme-text-secondary)] mb-6 text-xs uppercase tracking-wider">Spend by Category</h3>
                    <div className="h-[300px] w-full min-w-0 touch-pan-y">
                        <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={300}>
                            <PieChart>
                                <Pie data={metrics.categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value">
                                    {metrics.categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--theme-bg-panel)', border: '1px solid var(--theme-border)', borderRadius: '14px', color: 'var(--theme-text-primary)' }}
                                    itemStyle={{ color: 'var(--theme-text-primary)', fontWeight: 600 }}
                                    labelStyle={{ color: 'var(--theme-text-secondary)', fontWeight: 600 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 flex-wrap mt-4">
                        {metrics.categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-[var(--theme-text-secondary)]">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    ref={(el) => { if (el) el.style.backgroundColor = COLORS[index % COLORS.length]; }}
                                />
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] shadow-sm p-6">
                    <h3 className="font-semibold text-[var(--theme-text-secondary)] mb-6 text-xs uppercase tracking-wider">Monthly Spend Trend</h3>
                    <div className="h-[300px] w-full min-w-0 touch-pan-y">
                        <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={300}>
                            <AreaChart data={metrics.trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.4} vertical={false} />
                                <XAxis dataKey="name" stroke="var(--theme-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--theme-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--theme-bg-panel)', border: '1px solid var(--theme-border)', borderRadius: '14px', color: 'var(--theme-text-primary)' }}
                                    itemStyle={{ color: 'var(--theme-text-primary)', fontWeight: 600 }}
                                    labelStyle={{ color: 'var(--theme-text-secondary)', fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="spend" stroke={accentColor} fillOpacity={0.12} fill={accentColor} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
