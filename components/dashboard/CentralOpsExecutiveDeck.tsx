import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, TrendingUp, ShoppingCart, Box, ArrowRight,
    AlertTriangle, Package, Warehouse, Store, Activity
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { GlassKPICard } from './widgets/GlassKPICard';
import { DashboardMetrics } from '../../utils/metrics';
import { SitePerformance } from './types';
import { formatCompactNumber } from '../../utils/formatting';
import { formatProductSize, formatPackagingDescription } from '../../utils/units';
import { Product } from '../../types/product';
import WidgetErrorBoundary from '../WidgetErrorBoundary';

interface CentralOpsExecutiveDeckProps {
    metrics: DashboardMetrics;
    currencySymbol: string;
    sitePerformance: SitePerformance[];
    revenueBySiteData: { name: string; revenue: number; transactions: number }[];
    topProducts: { name: string; sales: number; count: number }[];
    allProducts: Product[];
    accentColor: string;
    chartGridColor: string;
    chartAxisColor: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    dateRange: string;
    inventoryValue: number;
}

export const CentralOpsExecutiveDeck: React.FC<CentralOpsExecutiveDeckProps> = ({
    metrics,
    currencySymbol,
    sitePerformance,
    revenueBySiteData,
    topProducts,
    allProducts,
    accentColor,
    chartGridColor,
    chartAxisColor,
    tooltipBg,
    tooltipBorder,
    tooltipText,
    dateRange,
    inventoryValue
}) => {
    const navigate = useNavigate();
    const [chartMode, setChartMode] = useState<'revenue' | 'transactions'>('revenue');

    const topSite = sitePerformance[0];
    const maxSiteRevenue = topSite ? Math.max(topSite.revenue, 1) : 1;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Hero KPI Quad - Semantic Design Tokens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <WidgetErrorBoundary title="Total Revenue">
                    <GlassKPICard
                        title={dateRange === 'All Time' ? "Network Revenue" : `${dateRange} Revenue`}
                        value={formatCompactNumber(metrics.totalNetworkRevenue, { currency: currencySymbol })}
                        sub={`Avg Basket: ${formatCompactNumber(metrics.avgBasket || 0, { currency: currencySymbol })}`}
                        icon={DollarSign}
                        swatch="silk"
                        trend="+12.4%"
                    />
                </WidgetErrorBoundary>

                <WidgetErrorBoundary title="Operating Profit">
                    <GlassKPICard
                        title="Net Operating Profit"
                        value={formatCompactNumber(metrics.netProfit, { currency: currencySymbol })}
                        sub={`${metrics.profitMargin.toFixed(1)}% Operating Margin`}
                        icon={TrendingUp}
                        swatch="slate"
                        trend={`${metrics.profitMargin.toFixed(0)}% Margin`}
                    />
                </WidgetErrorBoundary>

                <WidgetErrorBoundary title="Fulfillment Velocity">
                    <GlassKPICard
                        title="Fulfillment Pipeline"
                        value={metrics.pendingPicks + metrics.inProgressPacks}
                        sub={`${metrics.pendingPOs} Inbound POs • ${metrics.avgCycleTime || '14m'} avg cycle`}
                        icon={ShoppingCart}
                        swatch="graphite"
                        route="/fulfillment"
                    />
                </WidgetErrorBoundary>

                <WidgetErrorBoundary title="Supply Chain Health">
                    <GlassKPICard
                        title="Network Asset Value"
                        value={formatCompactNumber(inventoryValue, { currency: currencySymbol })}
                        sub={`${metrics.lowStockCount} Low • ${metrics.outOfStockCount} Out of Stock`}
                        icon={Box}
                        swatch="obsidian"
                        route="/inventory"
                    />
                </WidgetErrorBoundary>
            </div>

            {/* 2. Primary Bento Grid: Revenue Velocity & Operational Command Digest */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Revenue Velocity Chart (8 cols) */}
                <div className="lg:col-span-8 p-6 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                        <div>
                            <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-base">
                                <Activity className="text-[var(--theme-accent)]" size={18} />
                                Operational Velocity Trend
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Top facilities volume and velocity across the active national network
                            </p>
                        </div>
                        <div className="flex items-center gap-1 bg-[var(--theme-bg-subtle)] p-1 rounded-xl shrink-0 border border-[var(--theme-border)]">
                            <button
                                onClick={() => setChartMode('revenue')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                                    chartMode === 'revenue'
                                        ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                Revenue ({currencySymbol})
                            </button>
                            <button
                                onClick={() => setChartMode('transactions')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                                    chartMode === 'transactions'
                                        ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                Transactions
                            </button>
                        </div>
                    </div>

                    <div className="h-[280px] w-full min-h-[280px] min-w-0 relative overflow-hidden">
                        <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={280}>
                            <AreaChart data={revenueBySiteData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke={chartAxisColor}
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke={chartAxisColor}
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    tickFormatter={(val) =>
                                        chartMode === 'revenue'
                                            ? val === 0 ? '0' : `${val >= 1000 ? (val / 1000).toLocaleString() : val}k`
                                            : val.toLocaleString()
                                    }
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        border: `1px solid ${tooltipBorder}`,
                                        borderRadius: '14px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                                    }}
                                    itemStyle={{ color: tooltipText, fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(value: any) => [
                                        chartMode === 'revenue'
                                            ? `${currencySymbol} ${Number(value).toLocaleString()}`
                                            : `${Number(value).toLocaleString()} orders`,
                                        chartMode === 'revenue' ? 'Revenue' : 'Transactions'
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={chartMode === 'revenue' ? 'revenue' : 'transactions'}
                                    stroke={accentColor}
                                    strokeWidth={2.5}
                                    fillOpacity={0.08}
                                    fill={accentColor}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Operational Command Digest (4 cols) */}
                <div className="lg:col-span-4 p-6 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-sm">
                                <AlertTriangle className="text-amber-500" size={16} />
                                Operational Alert Digest
                            </h3>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Real-time
                            </span>
                        </div>

                        <div className="space-y-3">
                            {/* Stock Discrepancy Alert */}
                            <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                        <Box size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                             {metrics.lowStockCount + metrics.outOfStockCount} Inventory Alerts
                                        </p>
                                        <p className="text-[11px] text-[var(--theme-text-muted)]">
                                             {metrics.outOfStockCount} critical out-of-stock items
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/inventory')}
                                    className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] active:scale-[0.98] transition-colors cursor-pointer"
                                    title="Go to Inventory"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>

                            {/* Inbound Freight Alert */}
                            <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        <Warehouse size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                            {metrics.pendingPOs} Inbound Shipments
                                        </p>
                                        <p className="text-[11px] text-[var(--theme-text-muted)]">Awaiting dock receiving & QC</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/procurement')}
                                    className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] active:scale-[0.98] transition-colors cursor-pointer"
                                    title="Go to Procurement"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>

                            {/* Order Fulfillment Pipeline */}
                            <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                        <ShoppingCart size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                            {metrics.pendingPicks} Picks / {metrics.inProgressPacks} Packs
                                        </p>
                                        <p className="text-[11px] text-[var(--theme-text-muted)]">Active WMS packing lines</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/fulfillment')}
                                    className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] active:scale-[0.98] transition-colors cursor-pointer"
                                    title="Go to Fulfillment"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--theme-border)] flex items-center justify-between text-xs font-semibold text-[var(--theme-text-secondary)]">
                        <span>Staff On-Duty: {metrics.activeEmployees || 0}</span>
                        <button
                            onClick={() => navigate('/employees')}
                            className="text-[var(--theme-accent)] hover:underline flex items-center gap-1 text-[11px] font-bold active:scale-[0.98] cursor-pointer"
                        >
                            View Roster <ArrowRight size={11} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Secondary Grid: Top Facilities & Fast Moving SKUs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Facilities Table/Cards (6 cols) */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-sm">
                            <Store className="text-[var(--theme-accent)]" size={16} />
                            Top Network Hubs by Revenue
                        </h3>
                        <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-muted)]">
                            {sitePerformance.length} Sites Monitored
                        </span>
                    </div>

                    <div className="space-y-3">
                        {sitePerformance.slice(0, 5).map((site, index) => {
                            const percent = Math.min(100, Math.round((site.revenue / maxSiteRevenue) * 100));
                            return (
                                <div key={site.id} className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                                    <div className="flex justify-between items-center mb-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                                                index === 0 ? 'bg-[var(--theme-accent)] text-white shadow-xs' :
                                                'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                            }`}>
                                                {index + 1}
                                            </span>
                                            <span className="font-bold text-[var(--theme-text-primary)]">{site.name}</span>
                                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] font-mono border border-[var(--theme-border)]">
                                                {site.type}
                                            </span>
                                        </div>
                                        <span className="font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">
                                            {formatCompactNumber(site.revenue, { currency: currencySymbol })}
                                        </span>
                                    </div>
                                    <div className="w-full bg-[var(--theme-border)] h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--theme-accent)] rounded-full transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Fast Moving Inventory (6 cols) */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-sm">
                            <Package className="text-emerald-600 dark:text-emerald-400" size={16} />
                            Fast-Moving SKUs & Packaging
                        </h3>
                        <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-muted)]">
                            Sellable Units Displayed
                        </span>
                    </div>

                    <div className="space-y-3">
                        {topProducts.slice(0, 5).map((prod, i) => {
                            const matchedProduct = allProducts.find(p => p.name === prod.name);
                            const sizeBadge = matchedProduct ? formatProductSize(matchedProduct) : '';
                            const packagingDesc = matchedProduct
                                ? formatPackagingDescription(matchedProduct, prod.count)
                                : '';

                            return (
                                <div key={i} className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                            i === 0 ? 'bg-emerald-600 text-white shadow-xs' :
                                            'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                        }`}>
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold text-[var(--theme-text-primary)] truncate">
                                                    {prod.name}
                                                </p>
                                                {sizeBadge && (
                                                    <span className="text-[11px] px-1.5 py-0.5 rounded font-mono font-semibold bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] shrink-0">
                                                        {sizeBadge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-[var(--theme-text-muted)] font-mono mt-0.5">
                                                {prod.count} sellable units {packagingDesc ? `• (${packagingDesc})` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">
                                            {formatCompactNumber(prod.sales, { currency: currencySymbol })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
