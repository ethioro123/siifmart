
import React from 'react';
import {
    DollarSign, TrendingUp, RefreshCw, AlertTriangle, XCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { formatCompactNumber } from '../../utils/formatting';
import { CURRENCY_SYMBOL } from '../../constants';
import { Product, ServerMetrics } from '../../types';

interface InventoryOverviewProps {
    totalInventoryValueCost: number;
    totalInventoryValueRetail: number;
    serverMetrics: ServerMetrics | null;
    filteredProducts: Product[];
    categoryData: any[];
    abcData: any[];
}

import { useStore } from '../../contexts/CentralStore';

const getCOLORS = (theme: string) => [
    theme === 'dark' ? '#A9CBA2' : '#2C5E3B', // Class A (Forest / Soft Sage)
    theme === 'dark' ? '#7A9E83' : '#4D6E56', // Class B (Muted Green / Slate)
    '#d97706',                               // Class C (Amber)
    '#ef4444'                                // Fallback
];

const MetricCard = ({ title, value, sub, icon: Icon, trend }: any) => (
    <div className="glass-panel overflow-hidden group rounded-2xl p-5 relative transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 group-hover:bg-[#2C5E3B]/10 dark:group-hover:bg-[#A9CBA2]/10 transition-colors text-[#2C5E3B] dark:text-[#A9CBA2]">
                <Icon size={20} />
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${trend > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'} `}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <div>
            <p className="text-secondary text-xs font-bold uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-mono font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
            <p className="text-xs text-secondary mt-1">{sub}</p>
        </div>
    </div>
);

export const InventoryOverview: React.FC<InventoryOverviewProps> = ({
    totalInventoryValueCost,
    totalInventoryValueRetail,
    serverMetrics,
    filteredProducts,
    categoryData,
    abcData
}) => {
    const { theme } = useStore();
    const colors = getCOLORS(theme);

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Potential Revenue"
                    value={formatCompactNumber(totalInventoryValueRetail, { currency: CURRENCY_SYMBOL })}
                    sub="Retail Valuation"
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Stock Turn Rate"
                    value={`${serverMetrics?.stock_turnover_rate || 0}x`}
                    sub="Annualized Ratio"
                    icon={RefreshCw}
                />
                <MetricCard
                    title="Low Stock SKUs"
                    value={serverMetrics?.low_stock_count ?? filteredProducts.filter(p => p.status === 'low_stock').length}
                    sub="Requires Action"
                    icon={AlertTriangle}
                />
                <MetricCard
                    title="Dead Stock Value"
                    value={formatCompactNumber(serverMetrics?.dead_stock_value || 0, { currency: CURRENCY_SYMBOL })}
                    sub="> 90 Days No Move"
                    icon={XCircle}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Value by Category */}
                <div className="lg:col-span-2 glass-panel p-6">
                    <h3 className="text-xs font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest mb-6 select-none">
                        Valuation by Category
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={categoryData}>
                                <defs>
                                    <linearGradient id="barGradientWoody" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={theme === 'dark' ? '#A9CBA2' : '#2C5E3B'} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={theme === 'dark' ? '#A9CBA2' : '#2C5E3B'} stopOpacity={0.4} />
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
                                        color: theme === 'dark' ? '#EAE5D9' : '#1E3F27',
                                        boxShadow: '0 4px 16px rgba(34,50,38,0.08)'
                                    }}
                                    cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(44,94,59,0.03)' }}
                                />
                                <Bar dataKey="value" fill="url(#barGradientWoody)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ABC Analysis */}
                <div className="glass-panel p-6">
                    <h3 className="text-xs font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest mb-6 select-none">
                        ABC Classification
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={abcData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {abcData.map((entry: any, index: number) => {
                                        const segmentColor = index === 0 && entry.color ? entry.color : colors[index % colors.length];
                                        return (
                                            <Cell key={`cell-${index}`} fill={segmentColor} stroke="none" />
                                        );
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: theme === 'dark' ? '#18201B' : '#ffffff',
                                        border: `1px solid ${theme === 'dark' ? '#2c5e3b' : '#E2DCCE'}`,
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        color: theme === 'dark' ? '#EAE5D9' : '#1E3F27',
                                        boxShadow: '0 4px 16px rgba(34,50,38,0.08)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-4">
                        {abcData.map((item: any, i: number) => {
                            const markerColor = i === 0 && item.color ? item.color : colors[i % colors.length];
                            return (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            animate={{ backgroundColor: markerColor }}
                                            className="w-2.5 h-2.5 rounded-full"
                                        />
                                        <span className="text-secondary text-xs font-semibold">{item.name}</span>
                                    </div>
                                    <span className="font-mono text-gray-900 dark:text-white font-bold text-xs">{item.value} SKUs</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
