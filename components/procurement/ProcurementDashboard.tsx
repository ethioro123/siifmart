import React from 'react';
import { DollarSign, Package, TrendingUp, Building, Clock, Calendar } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import DateRangeSelector from '../../components/DateRangeSelector';
import { formatCompactNumber } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';
import { Supplier } from '../../types';
import { DateRangeOption } from '../../hooks/useDateFilter';

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
}

const COLORS = ['#00ff9d', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({
    metrics, dateRange, setDateRange, suppliers
}) => {

    const KpiCard = ({ title, value, sub, icon: Icon, color }: any) => (
        <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                {/* <div className="text-xs text-green-400 font-mono bg-green-500/10 px-2 py-1 rounded">+12.5%</div> */}
            </div>
            <h3 className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">{title}</h3>
            <div className="text-2xl font-bold text-white tracking-tight mb-1">{value}</div>
            <p className="text-xs text-gray-500">{sub}</p>
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
            default: return dateRange; // For specific quarters like Q1 2025
        }
    };

    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="h-20 bg-black/60 backdrop-blur-2xl border border-white/5 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="h-32 bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl animate-pulse" />
                    <div className="h-32 bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl animate-pulse" />
                    <div className="h-32 bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl animate-pulse" />
                    <div className="h-32 bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl animate-pulse" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[400px] bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl animate-pulse" />
                    <div className="h-[400px] bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Date Analysis Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/60 backdrop-blur-2xl p-4 rounded-xl border border-white/5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyber-primary/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-cyber-primary" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Temporal Analysis</h3>
                        <p className="text-gray-400 text-[10px]">{getDateRangeLabels()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Period:</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-0">
                <KpiCard
                    title={`Total Spend (${dateRange === 'All Time' ? 'Life' : dateRange.replace('This ', '')})`}
                    value={formatCompactNumber(metrics.totalSpend, { currency: CURRENCY_SYMBOL })}
                    sub="Across all categories"
                    icon={DollarSign}
                    color="text-cyber-primary"
                />
                <KpiCard title="Open Orders" value={metrics.openPO} sub={`Value: ${formatCompactNumber(metrics.pendingValue, { currency: CURRENCY_SYMBOL })}`} icon={Package} color="text-blue-400" />
                <KpiCard title="Potential Revenue" value={formatCompactNumber(metrics.potentialRevenue, { currency: CURRENCY_SYMBOL })} sub="From current PO items" icon={TrendingUp} color="text-green-400" />
                <KpiCard title="Active Vendors" value={suppliers.filter(s => s.status === 'Active').length} sub="Top rated first" icon={Building} color="text-yellow-400" />
                <KpiCard title="On-Time Delivery" value="94.2%" sub="Last 30 Days" icon={Clock} color="text-purple-400" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-6">Spend by Category</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie data={metrics.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {metrics.categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '#333' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 flex-wrap mt-4">
                        {metrics.categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                                <div
                                    className={`w-2 h-2 rounded-full ${[
                                        'bg-[#00ff9d]',
                                        'bg-[#3b82f6]',
                                        'bg-[#f59e0b]',
                                        'bg-[#ec4899]',
                                        'bg-[#8b5cf6]'
                                    ][index % 5]
                                        }`}
                                ></div>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-6">Monthly Spend Trend</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={metrics.trendData}>
                                <defs>
                                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '#333' }} />
                                <Area type="monotone" dataKey="spend" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
