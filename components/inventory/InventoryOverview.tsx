import React from 'react';
import {
    TrendingUp, RefreshCw, AlertTriangle, XCircle, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { formatCompactNumber } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';
import { Product, ServerMetrics } from '../../types';
import { useStore } from '../../contexts/CentralStore';

interface InventoryOverviewProps {
    totalInventoryValueCost: number;
    totalInventoryValueRetail: number;
    serverMetrics: ServerMetrics | null;
    filteredProducts: Product[];
    categoryData: Array<{ name: string; value: number }>;
    abcData: Array<{ name: string; value: number; color?: string }>;
    stockTurnoverRate?: number;
    deadStockValue?: number;
    lowStockCount?: number;
    currencySymbol?: string;
}

const getCOLORS = (theme: string) => [
    theme === 'dark' ? '#A9CBA2' : '#2C5E3B', // Class A (Forest / Soft Sage)
    theme === 'dark' ? '#7A9E83' : '#4D6E56', // Class B (Muted Green / Slate)
    '#d97706',                               // Class C (Amber)
    '#ef4444'                                // Fallback
];

interface MetricCardProps {
    title: string;
    value: string | number;
    sub: string;
    icon: React.ElementType;
    color?: 'emerald' | 'amber' | 'red';
}

const MetricCard = ({ title, value, sub, icon: Icon, color = 'emerald' }: MetricCardProps) => {
    const isAmber = color === 'amber';
    const isRed = color === 'red';

    return (
        <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-5 shadow-sm transition-all hover:border-[#2C5E3B]/40 group">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-2xl border ${
                    isRed
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/30'
                        : isAmber
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                            : 'bg-emerald-50 text-[#2C5E3B] dark:bg-[#2C5E3B]/20 dark:text-[#A9CBA2] border-emerald-200 dark:border-emerald-950/30'
                }`}>
                    <Icon size={18} />
                </div>
            </div>
            <div>
                <p className="text-[10px] text-stone-500 dark:text-gray-400 font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black font-mono text-[#1E3F27] dark:text-white mt-0.5">{value}</h3>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">{sub}</p>
            </div>
        </div>
    );
};

export const InventoryOverview: React.FC<InventoryOverviewProps> = ({
    totalInventoryValueRetail,
    categoryData,
    abcData,
    stockTurnoverRate = 0,
    deadStockValue = 0,
    lowStockCount = 0,
    currencySymbol
}) => {
    const { theme } = useStore();
    const colors = getCOLORS(theme);

    // Calculate real dynamic velocity (Zero fake magic numbers)
    const displayTurnRate = stockTurnoverRate > 0 ? `${stockTurnoverRate.toFixed(1)}x` : '0.0x';
    const activeCurrency = currencySymbol || CURRENCY_SYMBOL;
    const hasInventory = categoryData.length > 0 || abcData.some(d => (d.value || 0) > 0);

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Potential Revenue"
                    value={formatCompactNumber(totalInventoryValueRetail, { currency: activeCurrency })}
                    sub="Retail On-Hand Valuation"
                    icon={TrendingUp}
                    color="emerald"
                />
                <MetricCard
                    title="Stock Turn Rate"
                    value={displayTurnRate}
                    sub="Annualized Velocity"
                    icon={RefreshCw}
                    color="emerald"
                />
                <MetricCard
                    title="Low Stock SKUs"
                    value={lowStockCount}
                    sub="Below Minimum Threshold"
                    icon={AlertTriangle}
                    color="amber"
                />
                <MetricCard
                    title="Dead Stock Value"
                    value={formatCompactNumber(deadStockValue, { currency: activeCurrency })}
                    sub="> 90 Days Slow Moving"
                    icon={XCircle}
                    color={deadStockValue > 0 ? "red" : "emerald"}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Value by Category */}
                <div className="lg:col-span-2 bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        <h3 className="text-xs font-black text-[#1E3F27] dark:text-[#A9CBA2] uppercase tracking-wider">
                            Inventory Valuation by Category
                        </h3>
                    </div>
                    {categoryData.length > 0 ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="barGradientWoody" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={theme === 'dark' ? '#A9CBA2' : '#2C5E3B'} stopOpacity={0.9} />
                                            <stop offset="100%" stopColor={theme === 'dark' ? '#A9CBA2' : '#2C5E3B'} stopOpacity={0.35} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(169, 203, 162, 0.06)' : 'rgba(44, 94, 59, 0.06)'} vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: theme === 'dark' ? '#7A9E83' : '#4D6E56', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: theme === 'dark' ? '#7A9E83' : '#4D6E56', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme === 'dark' ? '#18201B' : '#ffffff',
                                            border: `1px solid ${theme === 'dark' ? '#2c5e3b' : '#E2DCCE'}`,
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: theme === 'dark' ? '#EAE5D9' : '#1E3F27',
                                            boxShadow: '0 4px 16px rgba(34,50,38,0.08)'
                                        }}
                                        cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(44,94,59,0.03)' }}
                                    />
                                    <Bar dataKey="value" fill="url(#barGradientWoody)" radius={[8, 8, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#E2DCCE] dark:border-white/10 rounded-2xl">
                            <BarChart3 size={36} className="text-stone-300 dark:text-gray-600 mb-2" />
                            <p className="text-xs font-bold text-stone-500 dark:text-gray-400">No Category Valuation</p>
                            <p className="text-[11px] text-stone-400 dark:text-gray-500 mt-0.5">Stock is currently empty for this facility</p>
                        </div>
                    )}
                </div>

                {/* ABC Analysis */}
                <div className="bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <PieIcon size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            <h3 className="text-xs font-black text-[#1E3F27] dark:text-[#A9CBA2] uppercase tracking-wider">
                                ABC Classification (Pareto)
                            </h3>
                        </div>
                        {hasInventory ? (
                            <div className="h-[180px]">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <PieChart>
                                        <Pie
                                            data={abcData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={52}
                                            outerRadius={72}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {abcData.map((entry, index) => {
                                                const segmentColor = entry.color || colors[index % colors.length];
                                                return (
                                                    <Cell key={`cell-${index}`} fill={segmentColor} stroke="none" />
                                                );
                                            })}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: theme === 'dark' ? '#18201B' : '#ffffff',
                                                border: `1px solid ${theme === 'dark' ? '#2c5e3b' : '#E2DCCE'}`,
                                                borderRadius: '14px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: theme === 'dark' ? '#EAE5D9' : '#1E3F27'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[180px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#E2DCCE] dark:border-white/10 rounded-2xl">
                                <PieIcon size={32} className="text-stone-300 dark:text-gray-600 mb-2" />
                                <p className="text-xs font-bold text-stone-500 dark:text-gray-400">No SKUs to Classify</p>
                                <p className="text-[11px] text-stone-400 dark:text-gray-500 mt-0.5">Add products to populate ABC Pareto</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-[#E2DCCE]/60 dark:border-white/5">
                        {abcData.map((item, i) => {
                            const markerColor = item.color || colors[i % colors.length];
                            return (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <span
                                            style={{ backgroundColor: markerColor }}
                                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                        />
                                        <span className="text-stone-600 dark:text-stone-300 font-bold">{item.name}</span>
                                    </div>
                                    <span className="font-mono text-[#1E3F27] dark:text-white font-black">{item.value} SKUs</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default InventoryOverview;
