
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

const COLORS = ['#00ff9d', '#3b82f6', '#f59e0b', '#ef4444'];

const MetricCard = ({ title, value, sub, icon: Icon, trend }: any) => (
    <div className="glass-panel overflow-hidden group rounded-2xl p-5 relative transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 group-hover:bg-cyber-primary/10 transition-colors text-cyber-primary">
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
                <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-6">Valuation by Category</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#00ff9d" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ABC Analysis */}
                <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-6">ABC Classification</h3>
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
                                    {abcData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-4">
                        {abcData.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        animate={{ backgroundColor: COLORS[i % COLORS.length] }}
                                        className="w-2 h-2 rounded-full"
                                    />
                                    <span className="text-gray-300">{item.name}</span>
                                </div>
                                <span className="font-mono text-white font-bold">{item.value} SKUs</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
