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
                <div className="lg:col-span-2 glass-panel rounded-3xl p-6 overflow-hidden flex flex-col relative h-[400px]">
                    <WidgetErrorBoundary title="Network Performance">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <MapIcon className="text-blue-500 dark:text-blue-400" size={20} />
                            Network Performance
                        </h3>
                        <div className="overflow-y-auto custom-scrollbar pr-2">
                            <div className="space-y-3">
                                {sitePerformance.map((site) => (
                                    <div key={site.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-all duration-300 border border-gray-200 dark:border-white/5 group hover:border-gray-300 dark:hover:border-white/20 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-x-1 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${site.type === 'Warehouse' ? 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                                                <Package size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{site.name}</p>
                                                <p className="text-xs text-gray-500 font-mono">{site.type} • {site.staffCount} Staff</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-bold text-green-400 text-sm">{formatCompactNumber(site.revenue, { currency: currencySymbol })}</p>
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
                            color="text-pink-400"
                        />
                    </WidgetErrorBoundary>
                    <WidgetErrorBoundary title="Active Staff">
                        <GlassKPICard
                            title="Active Staff"
                            value={metrics.activeEmployees || 0}
                            sub="Currently On-Site"
                            icon={Users}
                            color="text-purple-400"
                        />
                    </WidgetErrorBoundary>
                    <WidgetErrorBoundary title="Basket Size">
                        <GlassKPICard
                            title="Avg Basket Size"
                            value={(allSales?.reduce((acc, sale) => acc + (sale.items?.reduce((iAcc: number, i: any) => iAcc + i.quantity, 0) || 0), 0) / (allSales?.length || 1)).toFixed(1) || "0"}
                            sub="Items Per Order"
                            icon={ShoppingBag}
                            color="text-orange-400"
                        />
                    </WidgetErrorBoundary>
                    <WidgetErrorBoundary title="Inbound Velocity">
                        <GlassKPICard
                            title="Arrival Rate"
                            value="8.2"
                            sub="Shipments / Day"
                            icon={Truck}
                            color="text-cyan-400"
                        />
                    </WidgetErrorBoundary>
                </div>
            </div>
        </DashboardSection>
    );
};
