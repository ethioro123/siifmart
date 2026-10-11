import React from 'react';
import { Map as MapIcon, Users, ShoppingBag, Truck, Package } from 'lucide-react';
import { GlassKPICard } from '../widgets/GlassKPICard';
import { DashboardSection } from '../widgets/DashboardSection';
import WidgetErrorBoundary from '../../WidgetErrorBoundary';
import { formatCompactNumber } from '../../../utils/formatting';
import { DashboardMetrics } from '../../../utils/metrics';
import { SitePerformance } from '../types';

interface NetworkSectionProps {
    metrics: DashboardMetrics;
    sitePerformance: SitePerformance[];
    allSales: any[];
    currencySymbol: string;
}

export const NetworkSection = ({
    metrics,
    sitePerformance,
    allSales,
    currencySymbol
}: NetworkSectionProps) => {
    return (
        <DashboardSection title="Network & Resource Management" icon={MapIcon} className="col-span-1 md:col-span-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Site Matrix */}
                <div className="lg:col-span-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 overflow-hidden flex flex-col relative h-[400px] shadow-sm">
                    <WidgetErrorBoundary title="Network Performance">
                        <h3 className="font-bold text-[var(--theme-text-primary)] mb-6 flex items-center gap-2">
                            <MapIcon className="text-[var(--theme-accent)]" size={20} />
                            Network Performance
                        </h3>
                        <div className="overflow-y-auto custom-scrollbar pr-2">
                            <div className="space-y-3">
                                {sitePerformance.map((site) => (
                                    <div key={site.id} className="flex items-center justify-between p-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] rounded-xl transition-all duration-200 border border-[var(--theme-border)] group hover:border-[var(--theme-border-focus)] active:scale-[0.99] cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20">
                                                <Package size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[var(--theme-text-primary)] text-sm">{site.name}</p>
                                                <p className="text-xs text-[var(--theme-text-secondary)] font-mono">{site.type} • {site.staffCount} Staff</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-bold text-[var(--theme-text-primary)] text-sm tabular-nums">{formatCompactNumber(site.revenue, { currency: currencySymbol })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </WidgetErrorBoundary>
                </div>

                {/* KPIs */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WidgetErrorBoundary title="Staff Efficiency">
                        <GlassKPICard
                            title="Staff Efficiency"
                            value={formatCompactNumber(metrics.totalEmployees > 0 ? metrics.totalNetworkRevenue / metrics.totalEmployees : 0, { currency: currencySymbol })}
                            sub="Rev. Per Employee"
                            icon={Users}
                            swatch="silk"
                        />
                    </WidgetErrorBoundary>
                    <WidgetErrorBoundary title="Active Staff">
                        <GlassKPICard
                            title="Active Staff"
                            value={metrics.activeEmployees || 0}
                            sub="Currently On-Site"
                            icon={Users}
                            swatch="slate"
                        />
                    </WidgetErrorBoundary>
                    <WidgetErrorBoundary title="Basket Size">
                        <GlassKPICard
                            title="Avg Basket Size"
                            value={(allSales?.reduce((acc, sale) => acc + (sale.items?.reduce((iAcc: number, i: any) => iAcc + i.quantity, 0) || 0), 0) / (allSales?.length || 1)).toFixed(1) || "0"}
                            sub="Items Per Order"
                            icon={ShoppingBag}
                            swatch="graphite"
                        />
                    </WidgetErrorBoundary>
                    <WidgetErrorBoundary title="Inbound Velocity">
                        <GlassKPICard
                            title="Arrival Rate"
                            value="8.2"
                            sub="Shipments / Day"
                            icon={Truck}
                            swatch="obsidian"
                        />
                    </WidgetErrorBoundary>
                </div>
            </div>
        </DashboardSection>
    );
};
