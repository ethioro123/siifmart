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

const getCOLORS = (_theme: string) => [
    '#10b981', // Class A (Emerald)
    '#3b82f6', // Class B (Blue)
    '#f59e0b', // Class C (Amber)
    '#ef4444'  // Fallback
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
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-sm transition-all duration-150 hover:bg-[var(--theme-bg-card-hover)] group">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl border ${
                    isRed
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : isAmber
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
                    <Icon size={18} />
                </div>
            </div>
            <div>
                <p className="text-[10px] text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black font-mono text-[var(--theme-text-primary)] mt-0.5">{value}</h3>
                <p className="text-[11px] text-[var(--theme-text-muted)] font-medium mt-0.5">{sub}</p>
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
                <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs">
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 size={16} className="text-[var(--theme-text-primary)]" />
                        <h3 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                            Inventory Valuation by Category
                        </h3>
                    </div>
                    {categoryData.length > 0 ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.6} vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--theme-text-secondary)', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--theme-text-secondary)', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--theme-bg-panel)',
                                            border: '1px solid var(--theme-border)',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: 'var(--theme-text-primary)',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                                        }}
                                        cursor={{ fill: 'rgba(128,128,128,0.05)' }}
                                    />
                                    <Bar dataKey="value" fill="var(--theme-text-primary)" radius={[4, 4, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--theme-border)] rounded-2xl">
                            <BarChart3 size={36} className="text-[var(--theme-text-muted)] mb-2" />
                            <p className="text-xs font-bold text-[var(--theme-text-secondary)]">No Category Valuation</p>
                            <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">Stock is currently empty for this facility</p>
                        </div>
                    )}
                </div>

                {/* ABC Analysis */}
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <PieIcon size={16} className="text-emerald-500" />
                            <h3 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
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
                                                backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                                                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: theme === 'dark' ? '#F5F5F7' : '#1D1D1F'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[180px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-[var(--theme-border)] rounded-2xl">
                                <PieIcon size={32} className="text-[var(--theme-text-muted)] mb-2" />
                                <p className="text-xs font-bold text-[var(--theme-text-secondary)]">No SKUs to Classify</p>
                                <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">Add products to populate ABC Pareto</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-[var(--theme-border)]">
                        {abcData.map((item, i) => {
                            const markerColor = item.color || colors[i % colors.length];
                            return (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <span
                                            style={{ backgroundColor: markerColor }}
                                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                        />
                                        <span className="text-[var(--theme-text-secondary)] font-bold">{item.name}</span>
                                    </div>
                                    <span className="font-mono text-[var(--theme-text-primary)] font-bold">{item.value} SKUs</span>
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
