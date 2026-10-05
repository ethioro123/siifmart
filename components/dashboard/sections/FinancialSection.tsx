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
                        swatch="silk"
                    />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Net Profit">
                    <GlassKPICard
                        title="Net Profit"
                        value={formatCompactNumber(metrics.netProfit, { currency: currencySymbol })}
                        sub="Net Earnings"
                        icon={Award}
                        swatch="slate"
                    />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Profit Margin">
                    <GlassKPICard
                        title="Profit Margin"
                        value={`${metrics.profitMargin.toFixed(1)}%`}
                        sub="Efficiency Rate"
                        icon={TrendingUp}
                        swatch="graphite"
                    />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Inventory Value">
                    <GlassKPICard
                        title="Network Asset Value"
                        value={formatCompactNumber(inventoryValue, { currency: currencySymbol })}
                        sub={`Valued at Base Cost (Retail: ${formatCompactNumber(metrics.totalNetworkStockValueRetail || 0, { currency: currencySymbol })})`}
                        icon={Package}
                        swatch="obsidian"
                    />
                </WidgetErrorBoundary>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[400px]">
                {/* Revenue Velocity Chart */}
                <div className="lg:col-span-3 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-8 relative overflow-hidden group shadow-sm">
                    <WidgetErrorBoundary title="Revenue Chart">
                        {revenueBySiteData.length === 0 && <EmptyState message="No revenue data available" />}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                                <Activity className="text-[var(--theme-text-primary)]" size={20} />
                                Revenue Velocity <span className="text-xs font-normal text-[var(--theme-text-muted)] ml-2">(Top 10 Sites)</span>
                            </h3>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={revenueBySiteData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                <XAxis dataKey="name" stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, (dataMax: number) => Math.max(dataMax, 1000)]} tickFormatter={(val) => val === 0 ? '0' : `${val >= 1000 ? (val / 1000).toLocaleString() : val}k`} />
                                <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} itemStyle={{ color: tooltipText, fontSize: '12px' }} />
                                <Area type="monotone" dataKey="revenue" stroke={accentColor} strokeWidth={2.5} fillOpacity={0.08} fill={accentColor} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </WidgetErrorBoundary>
                </div>

                {/* Category Sales Bar Chart */}
                <div className="lg:col-span-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 flex flex-col overflow-hidden relative shadow-sm">
                    <WidgetErrorBoundary title="Category Performance">
                        <h3 className="font-bold text-[var(--theme-text-primary)] mb-4 flex items-center gap-2 text-sm">
                            <Layers className="text-[var(--theme-text-primary)]" size={18} />
                            Category Sales
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={revenueByCategory} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: chartAxisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px' }} itemStyle={{ color: tooltipText }} />
                                    <Bar dataKey="value" fill={accentColor} barSize={12} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </WidgetErrorBoundary>
                </div>
            </div>
        </DashboardSection>
    );
};
