import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, TrendingUp, ShoppingCart, Box, ArrowRight,
    AlertTriangle, Package, Warehouse, Store, Activity,
    ShieldAlert, Building2, Layers, Truck, ArrowRightLeft
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
    pendingEscalatedPOCount?: number;
    interRegionTransfersCount?: number;
    pendingHeadcountQuotasCount?: number;
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
    inventoryValue,
    pendingEscalatedPOCount = 0,
    interRegionTransfersCount = 0,
    pendingHeadcountQuotasCount = 0
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

                <WidgetErrorBoundary title="Corporate Escalations">
                    <GlassKPICard
                        title="Corporate Escalations"
                        value={pendingEscalatedPOCount + interRegionTransfersCount + pendingHeadcountQuotasCount}
                        sub={`${pendingEscalatedPOCount} POs • ${interRegionTransfersCount} Transfers • ${pendingHeadcountQuotasCount} Quotas`}
                        icon={ShieldAlert}
                        swatch="graphite"
                        route={pendingHeadcountQuotasCount > 0 ? "/employees" : pendingEscalatedPOCount > 0 ? "/procurement" : "/transfers"}
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
                                        ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)] shadow-xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                Revenue ({currencySymbol})
                            </button>
                            <button
                                onClick={() => setChartMode('transactions')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                                    chartMode === 'transactions'
                                        ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)] shadow-xs'
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

                {/* Corporate Governance & Escalations Digest (4 cols) */}
                <div className="lg:col-span-4 p-6 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-sm">
                                <ShieldAlert className="text-[var(--theme-status-warning-text)]" size={16} />
                                Corporate Governance & Escalations
                            </h3>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-status-success-bg)] animate-pulse" />
                                HQ Level
                            </span>
                        </div>

                        <div className="space-y-3">
                            {/* High-Value Regional Procurement Escalation */}
                            <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                                        <Building2 size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                                            {pendingEscalatedPOCount} Regional PO Escalations
                                        </p>
                                        <p className="text-[11px] text-[var(--theme-text-muted)]">
                                            Exceeds regional autonomous ceiling (&gt; 150k)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/procurement')}
                                    className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] active:scale-[0.98] transition-colors cursor-pointer"
                                    title="Review High-Value POs"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>

                            {/* Inter-Regional Dispatches & Logistics */}
                            <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]">
                                        <ArrowRightLeft size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)]">
                                            {interRegionTransfersCount} Inter-Regional Dispatches
                                        </p>
                                        <p className="text-[11px] text-[var(--theme-text-muted)]">
                                            Cross-territory stock rebalancing in-transit
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/fulfillment')}
                                    className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] active:scale-[0.98] transition-colors cursor-pointer"
                                    title="View Inter-Region Transfers"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>

                            {/* Sovereign Catalog Governance */}
                            <div className="p-3.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between hover:border-[var(--theme-border-focus)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[var(--theme-accent)] border border-[var(--theme-border-accent)]">
                                        <Layers size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[var(--theme-accent)] text-[var(--theme-accent)]">
                                            {allProducts.length} Sovereign Master SKUs
                                        </p>
                                        <p className="text-[11px] text-[var(--theme-text-muted)]">
                                            Central pricing & margin compliance active
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/catalog')}
                                    className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] active:scale-[0.98] transition-colors cursor-pointer"
                                    title="Manage Master Catalog"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--theme-border)] flex items-center justify-between text-xs font-semibold text-[var(--theme-text-secondary)]">
                        <span>Territorial Governance: Active</span>
                        <button
                            onClick={() => navigate('/regional-ops')}
                            className="text-[var(--theme-accent)] hover:underline flex items-center gap-1 text-[11px] font-bold active:scale-[0.98] cursor-pointer"
                        >
                            Open Regional Ops <ArrowRight size={11} />
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
                        {sitePerformance.length === 0 ? (
                            <div className="py-8 text-center text-xs text-[var(--theme-text-muted)]">
                                No facility revenue recorded for this period
                            </div>
                        ) : (
                            sitePerformance.slice(0, 5).map((site, index) => {
                                const percent = Math.min(100, Math.round((site.revenue / maxSiteRevenue) * 100));
                                return (
                                    <div key={site.id} className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]">
                                        <div className="flex justify-between items-center mb-1 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                                                    index === 0 ? 'bg-[var(--theme-accent)] text-[var(--theme-text-primary)] shadow-xs' :
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
                            })
                        )}
                    </div>
                </div>

                {/* Fast Moving Inventory (6 cols) */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[var(--theme-text-primary)] flex items-center gap-2 text-sm">
                            <Package className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]" size={16} />
                            Fast-Moving SKUs & Packaging
                        </h3>
                        <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-muted)]">
                            Sellable Units Displayed
                        </span>
                    </div>

                    <div className="space-y-3">
                        {topProducts.length === 0 ? (
                            <div className="py-8 text-center text-xs text-[var(--theme-text-muted)]">
                                No fast-moving inventory recorded for this period
                            </div>
                        ) : (
                            topProducts.slice(0, 5).map((prod, i) => {
                                const matchedProduct = allProducts.find(p => p.name === prod.name);
                                const sizeBadge = matchedProduct ? formatProductSize(matchedProduct) : '';
                                const packagingDesc = matchedProduct
                                    ? formatPackagingDescription(matchedProduct, prod.count)
                                    : '';

                                return (
                                    <div key={i} className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                                i === 0 ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-text-primary)] shadow-xs' :
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
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
