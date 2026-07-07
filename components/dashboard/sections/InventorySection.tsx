import React from 'react';
import { Box, ShoppingCart, Undo, Clock, Truck, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { GlassKPICard } from '../widgets/GlassKPICard';
import { DashboardSection } from '../widgets/DashboardSection';
import { TopProductsWidget } from '../widgets/TopProductsWidget';
import WidgetErrorBoundary from '../../WidgetErrorBoundary';
import { formatCompactNumber } from '../../../utils/formatting';
import { DashboardMetrics, METRIC_ROUTES } from '../../../utils/metrics';

interface InventorySectionProps {
    metrics: DashboardMetrics;
    activeAlerts: number;
    stockStatusData: any[];
    topProducts: any[];
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    currencySymbol: string;
    navigate: (route: string) => void;
}

export const InventorySection = ({
    metrics,
    activeAlerts,
    stockStatusData,
    topProducts,
    tooltipBg,
    tooltipBorder,
    tooltipText,
    currencySymbol,
    navigate
}: InventorySectionProps) => {
    return (
        <DashboardSection title="Inventory & Logistics Hub" icon={Box} className="col-span-1 md:col-span-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <WidgetErrorBoundary title="Active Orders">
                    <GlassKPICard
                        title="Active Orders"
                        value={metrics.pendingPicks + metrics.inProgressPacks}
                        sub="Pending Fulfillment"
                        icon={ShoppingCart}
                        color="text-purple-400"
                    />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Return Rate">
                    <GlassKPICard
                        title="Return Rate"
                        value={`${metrics.returnRate.toFixed(1)}%`}
                        sub={`${formatCompactNumber(metrics.totalReturnedValue, { currency: currencySymbol })} Refunded`}
                        icon={Undo}
                        color="text-rose-400"
                    />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Cycle Time">
                    <GlassKPICard
                        title="Avg. Cycle Time"
                        value={metrics.avgCycleTime || '0m'}
                        sub="Processing Speed"
                        icon={Clock}
                        color="text-blue-400"
                    />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary title="Inbound POs">
                    <GlassKPICard
                        title="Inbound POs"
                        value={metrics.pendingPOs}
                        sub="Pending Shipments"
                        icon={Truck}
                        color="text-orange-400"
                    />
                </WidgetErrorBoundary>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[400px]">
                {/* Stock Health */}
                <div className="lg:col-span-1 glass-panel rounded-3xl p-6 relative flex flex-col">
                    <WidgetErrorBoundary title="Stock Health">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-sm">
                            <PieChartIcon className="text-purple-500 dark:text-purple-400" size={16} />
                            Stock Health
                        </h3>
                        <div className="flex-1 w-full min-h-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stockStatusData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                        {stockStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, fontSize: '12px' }} itemStyle={{ color: tooltipText }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{metrics.stockCount > 0 ? '100%' : '0%'}</span>
                            </div>
                        </div>
                    </WidgetErrorBoundary>
                </div>

                {/* Critical Alerts */}
                <div className="lg:col-span-1 glass-panel rounded-3xl p-6 relative flex flex-col justify-between group">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                        <AlertTriangle className="text-red-500 dark:text-red-400" size={16} />
                        Critical Alerts
                    </h3>
                    <div>
                        <p className="text-4xl font-mono font-bold text-gray-900 dark:text-white">{activeAlerts}</p>
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{metrics.lowStockCount} Low Stock Items</p>
                        <p className="text-xs text-red-500 dark:text-red-400">{metrics.outOfStockCount} Out of Stock</p>
                    </div>
                    <button onClick={() => navigate(METRIC_ROUTES.lowStock)} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-colors">
                        View Alerts
                    </button>
                </div>

                {/* Top Products */}
                <div className="lg:col-span-2">
                    <WidgetErrorBoundary title="Top Products">
                        <TopProductsWidget products={topProducts} />
                    </WidgetErrorBoundary>
                </div>
            </div>
        </DashboardSection>
    );
};
