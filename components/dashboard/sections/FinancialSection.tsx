import React from 'react';
import { DollarSign, Award, TrendingUp, Package, Activity, Layers } from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { GlassKPICard } from '../widgets/GlassKPICard';
import { DashboardSection } from '../widgets/DashboardSection';
import { EmptyState } from '../widgets/EmptyState';
import WidgetErrorBoundary from '../../WidgetErrorBoundary';
import { formatCompactNumber } from '../../../utils/formatting';
import { DashboardMetrics } from '../../../utils/metrics';

interface FinancialSectionProps {
    metrics: DashboardMetrics;
    revenueBySiteData: any[];
    revenueByCategory: any[];
    accentColor: string;
    chartGridColor: string;
    chartAxisColor: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    currencySymbol: string;
    dateRange: string;
    inventoryValue: number;
}

export const FinancialSection = ({
    metrics,
    revenueBySiteData,
    revenueByCategory,
    accentColor,
    chartGridColor,
    chartAxisColor,
    tooltipBg,
    tooltipBorder,
    tooltipText,
    currencySymbol,
    dateRange,
    inventoryValue
}: FinancialSectionProps) => {
    return (
        <DashboardSection title="Financial Command Center" icon={DollarSign} className="col-span-1 md:col-span-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <WidgetErrorBoundary title="Total Revenue">
                    <GlassKPICard
                        title={dateRange === 'All Time' ? "Total Revenue" : `${dateRange} Revenue`}
                        value={formatCompactNumber(metrics.totalNetworkRevenue, { currency: currencySymbol })}
                        sub="vs. Last Month"
                        icon={DollarSign}
                        color="text-green-400"
                    />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Net Profit">
                    <GlassKPICard
                        title="Net Profit"
                        value={formatCompactNumber(metrics.netProfit, { currency: currencySymbol })}
                        sub="Net Earnings"
                        icon={Award}
                        color="text-emerald-400"
                    />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Profit Margin">
                    <GlassKPICard
                        title="Profit Margin"
                        value={`${metrics.profitMargin.toFixed(1)}%`}
                        sub="Efficiency Rate"
                        icon={TrendingUp}
                        color="text-teal-400"
                    />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Inventory Value">
                    <GlassKPICard
                        title="Network Asset Value"
                        value={formatCompactNumber(inventoryValue, { currency: currencySymbol })}
                        sub={`Valued at Base Cost (Retail: ${formatCompactNumber(metrics.totalNetworkStockValueRetail || 0, { currency: currencySymbol })})`}
                        icon={Package}
                        color="text-blue-400"
                    />
                </WidgetErrorBoundary>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[400px]">
                {/* Revenue Velocity Chart */}
                <div className="lg:col-span-3 glass-panel rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
                    <WidgetErrorBoundary title="Revenue Chart">
                        {revenueBySiteData.length === 0 && <EmptyState message="No revenue data available" />}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity className="text-cyber-primary" size={20} />
                                Revenue Velocity <span className="text-xs font-normal text-gray-500 ml-2">(Top 10 Sites)</span>
                            </h3>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={revenueBySiteData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                <XAxis dataKey="name" stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip contentStyle={{ backgroundColor: tooltipBg, backdropFilter: 'blur(10px)', border: `1px solid ${tooltipBorder}`, borderRadius: '12px' }} itemStyle={{ color: tooltipText, fontSize: '12px' }} />
                                <Area type="monotone" dataKey="revenue" stroke={accentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </WidgetErrorBoundary>
                </div>

                {/* Category Sales Bar Chart */}
                <div className="lg:col-span-1 glass-panel rounded-3xl p-6 flex flex-col overflow-hidden relative">
                    <WidgetErrorBoundary title="Category Performance">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
                            <Layers className="text-yellow-500 dark:text-yellow-400" size={18} />
                            Category Sales
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueByCategory} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: chartAxisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }} itemStyle={{ color: tooltipText }} />
                                    <Bar dataKey="value" fill="#f59e0b" barSize={12} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </WidgetErrorBoundary>
                </div>
            </div>
        </DashboardSection>
    );
};
