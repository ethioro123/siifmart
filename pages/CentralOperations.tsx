import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useFulfillmentData } from '../components/fulfillment/FulfillmentDataProvider';
import { useGamification } from '../contexts/GamificationContext';
import { useStore } from '../contexts/CentralStore';
import { useNavigate } from 'react-router-dom';
import { generateQuarterlyReport } from '../utils/reportGenerator';
import { productsService } from '../services/supabase.service';
import {
    Activity, DollarSign, Box, Map as MapIcon, Download, Radio, Zap
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { calculateMetrics, DashboardMetrics } from '../utils/metrics';
import { formatCompactNumber } from '../utils/formatting';
import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import DashboardSkeleton from '../components/DashboardSkeleton';
import PointsPerformanceDashboard from '../components/PointsPerformanceDashboard';

// --- Dashboard Widgets & Sections Imports ---
import { CyberClock } from '../components/dashboard/widgets/CyberClock';
import { EthiopianDateWidget } from '../components/dashboard/widgets/EthiopianDateWidget';
import { SystemTicker } from '../components/dashboard/widgets/SystemTicker';
import { SystemLoadWidget } from '../components/dashboard/widgets/SystemLoadWidget';
import { ActivityLogWidget } from '../components/dashboard/widgets/ActivityLogWidget';
import { DashboardSection } from '../components/dashboard/widgets/DashboardSection';
import { FinancialSection } from '../components/dashboard/sections/FinancialSection';
import { InventorySection } from '../components/dashboard/sections/InventorySection';
import { NetworkSection } from '../components/dashboard/sections/NetworkSection';
import { SitePerformance } from '../components/dashboard/types';

import { useDateFilter, DateRangeOption } from '../hooks/useDateFilter';
import DateRangeSelector from '../components/DateRangeSelector';
import FiscalYearDeck from '../components/FiscalYearDeck';

export default function CentralOperations() {
    const { sites, employees, allSales, allOrders, allProducts, systemLogs, storePoints } = useData();
    const { jobs } = useFulfillmentData();
    const { workerPoints } = useGamification();
    const { loading, theme } = useStore();
    const navigate = useNavigate();
    const accentColor = theme === 'dark' ? '#A9CBA2' : '#2C5E3B';

    // --- SERVER-SIDE METRICS ---
    const [serverMetrics, setServerMetrics] = useState<any>(null); // Inventory Snapshot
    const [serverFinancials, setServerFinancials] = useState<any>(null); // Date-Filtered Financials

    // Default to 'This Quarter' as requested
    const defaultRange: DateRangeOption = 'This Quarter';
    const { dateRange, setDateRange, isWithinRange, startDate: filterStartDate, endDate: filterEndDate } = useDateFilter(defaultRange);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // 1. Fetch Inventory Snapshot (Always current)
                const invData = await productsService.getMetrics();
                setServerMetrics(invData);

                // 2. Fetch Financials (Filtered by Date)
                const startStr = filterStartDate ? filterStartDate.toISOString() : undefined;
                const endStr = filterEndDate ? filterEndDate.toISOString() : undefined;

                const finData = await productsService.getFinancialMetrics(undefined, startStr, endStr);
                setServerFinancials(finData);
            } catch (err) {
                console.error('Failed to load server metrics:', err);
            }
        };
        fetchMetrics();
    }, [dateRange, filterStartDate, filterEndDate]);

    // --- REPORT GENERATION ---
    const handleGenerateReport = () => {
        const filteredMetrics = calculateMetrics(
            allSales.filter(s => isWithinRange(s.date)),
            allProducts,
            jobs.filter(j => isWithinRange(j.createdAt || '')),
            allOrders.filter(o => isWithinRange(o.date || o.createdAt || '')),
            employees,
            [],
            undefined
        );
        generateQuarterlyReport(filteredMetrics, dateRange, 'Operations');
    };

    // --- FILTERED DATA ---
    const filteredSales = useMemo(() => (allSales || []).filter(s => isWithinRange(s.date)), [allSales, dateRange]);
    const filteredOrders = useMemo(() => (allOrders || []).filter(o => isWithinRange(o.createdAt || new Date().toISOString())), [allOrders, dateRange]);

    // --- AGGREGATED METRICS (Using Filtered Data) ---
    const metrics: DashboardMetrics = useMemo(() => {
        try {
            return calculateMetrics(
                filteredSales,
                allProducts || [],
                jobs || [],
                filteredOrders,
                employees || [],
                [],
                undefined
            ) as DashboardMetrics;
        } catch (err) {
            console.error("Error calculating metrics:", err);
            return {
                totalNetworkRevenue: 0,
                netProfit: 0,
                profitMargin: 0,
                transactionCount: 0,
                activeAlerts: 0,
                totalEmployees: 0,
                totalNetworkStockValue: 0,
                avgBasket: 0,
                stockCount: 0,
                lowStockCount: 0,
                outOfStockCount: 0,
                pickAccuracy: '0%',
                returnRate: 0,
                totalReturnedValue: 0
            } as unknown as DashboardMetrics;
        }
    }, [filteredSales, allProducts, jobs, filteredOrders, employees]);

    const totalSites = sites?.length || 0;
    const activeAlerts = serverMetrics?.active_alerts !== undefined ? serverMetrics.active_alerts : (metrics?.activeAlerts || 0);
    const inventoryValue = serverMetrics?.total_value_cost || metrics?.totalNetworkStockValue || 0;

    // Stock Status Data (Server-Side Snapshot)
    const stockStatusData = useMemo(() => {
        if (serverMetrics) {
            return [
                { name: 'Optimal', value: serverMetrics.total_count - (serverMetrics.low_stock_count + serverMetrics.out_of_stock_count), color: '#10b981' },
                { name: 'Low Stock', value: serverMetrics.low_stock_count, color: '#f59e0b' },
                { name: 'Out of Stock', value: serverMetrics.out_of_stock_count, color: '#ef4444' },
            ].filter(d => d.value > 0);
        }

        // Fallback
        const goodStock = (allProducts || []).filter(p => p.stock >= 10 && p.status !== 'out_of_stock').length;
        const lowStock = (allProducts || []).filter(p => (p.stock < 10 && p.stock > 0) || p.status === 'low_stock').length;
        const outStock = (allProducts || []).filter(p => p.stock === 0 || p.status === 'out_of_stock').length;

        return [
            { name: 'Optimal', value: goodStock, color: '#10b981' },
            { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
            { name: 'Out of Stock', value: outStock, color: '#ef4444' },
        ].filter(d => d.value > 0);
    }, [allProducts, serverMetrics]);

    // --- SITE PERFORMANCE (Filtered) ---
    const sitePerformance: SitePerformance[] = useMemo(() => {
        if (!sites || !filteredSales || !employees || !allProducts) return [];

        const operationalSites = sites.filter(s => s.type !== 'Administration' && s.type !== 'HQ' && s.type !== 'Administrative');

        return operationalSites.map(site => {
            const siteSales = filteredSales.filter(s => s.siteId === site.id);
            const revenue = siteSales.reduce((sum, s) => sum + s.total, 0);
            const staffCount = employees.filter(e => e.siteId === site.id).length;
            const lowStock = allProducts.filter(p => p.siteId === site.id && p.status === 'low_stock').length;

            return {
                ...site,
                revenue,
                staffCount,
                lowStock,
                transactionCount: siteSales.length
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [sites, filteredSales, employees, allProducts]);

    const revenueBySiteData = useMemo(() => {
        if (!sitePerformance) return [];
        return sitePerformance.slice(0, 10).map(site => ({
            name: site.name.length > 15 ? site.name.substring(0, 12) + '...' : site.name,
            revenue: site.revenue,
            transactions: site.transactionCount
        }));
    }, [sitePerformance]);

    const revenueByCategory = useMemo(() => {
        if (!filteredSales) return [];
        const categoryData = new Map();
        filteredSales.forEach(sale => {
            (sale.items || []).forEach(item => {
                const cat = item.category || 'Other';
                const val = (item.price * item.quantity);
                categoryData.set(cat, (categoryData.get(cat) || 0) + val);
            });
        });
        return Array.from(categoryData)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [filteredSales]);

    // --- TOP PRODUCTS (Filtered) ---
    const topProducts = useMemo(() => {
        if (!filteredSales) return [];
        const productStats = new Map<string, { name: string, sales: number, count: number }>();

        filteredSales.forEach(sale => {
            if (sale.status !== 'Completed') return;
            (sale.items || []).forEach(item => {
                const current = productStats.get(item.id) || { name: item.name, sales: 0, count: 0 };
                productStats.set(item.id, {
                    name: item.name,
                    sales: current.sales + (item.price * item.quantity),
                    count: current.count + item.quantity
                });
            });
        });

        return Array.from(productStats.values())
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
    }, [filteredSales]);

    // --- COLORS & CHART STYLES ---
    const isDark = theme === 'dark';
    const chartAxisColor = isDark ? '#555' : '#9ca3af';
    const chartGridColor = isDark ? '#222' : '#e5e7eb';
    const tooltipBg = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)';
    const tooltipBorder = isDark ? '#333' : '#e5e7eb';
    const tooltipText = isDark ? '#fff' : '#111827';

    // --- LOADING STATE ---
    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen p-6 pb-20 animate-in fade-in duration-700 bg-transparent">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-cyber-primary/10 rounded-lg border border-cyber-primary/20">
                            <Zap className="text-cyber-primary" size={20} />
                        </div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-500">
                            CENTRAL<span className="text-cyber-primary">OPS</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 font-medium flex items-center gap-2">
                        <Radio size={14} className="text-[#A9CBA2] dark:text-[#2C5E3B] animate-pulse" />
                        <span className="text-xs font-mono text-gray-400">LIVE FEED CONNECTED</span>
                    </p>
                </div>

                <div className="flex items-center gap-6 mt-4 md:mt-0 h-full">
                    <DateRangeSelector
                         value={dateRange}
                         onChange={setDateRange}
                         className="hidden xl:block"
                    />

                    <EthiopianDateWidget />

                    <CyberClock />

                    <div className="text-right px-6 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-white/10 h-[46px] flex flex-col justify-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-none mb-0.5">Active Sites</p>
                        <p className="text-xl font-mono font-bold text-gray-900 dark:text-white leading-none">{totalSites}</p>
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        className="hidden md:flex items-center gap-2 woody-btn-primary h-[46px]"
                    >
                        <Download size={18} />
                        <span className="hidden lg:inline">Report</span>
                    </button>
                </div>
            </div>

            {/* --- SYSTEM TICKER --- */}
            <SystemTicker />

            {/* --- FISCAL YEAR DECK (Condition: Year View) --- */}
            {(dateRange === 'This Year' || dateRange === 'Last Year') && (
                <div className="max-w-[1700px] mx-auto mb-6">
                    <FiscalYearDeck
                        year={dateRange === 'Last Year' ? new Date().getFullYear() - 1 : new Date().getFullYear()}
                        currentQuarter={dateRange === 'Last Year' ? 4 : Math.floor(new Date().getMonth() / 3) + 1}
                        metrics={{
                            q1: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() < 3 }).reduce((a, b) => a + b.total, 0), { currency: '$' }), label: 'Revenue', trend: '+10%' },
                            q2: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() >= 3 && d.getMonth() < 6 }).reduce((a, b) => a + b.total, 0), { currency: '$' }), label: 'Revenue' },
                            q3: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() >= 6 && d.getMonth() < 9 }).reduce((a, b) => a + b.total, 0), { currency: '$' }), label: 'Revenue' },
                            q4: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() >= 9 }).reduce((a, b) => a + b.total, 0), { currency: '$' }), label: 'Revenue' }
                        }}
                    />
                </div>
            )}

            {/* --- BENTO GRID LAYOUT --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-[1700px] mx-auto">

                {/* 1. FINANCIAL COMMAND CENTER */}
                <FinancialSection
                    metrics={metrics}
                    revenueBySiteData={revenueBySiteData}
                    revenueByCategory={revenueByCategory}
                    accentColor={accentColor}
                    chartGridColor={chartGridColor}
                    chartAxisColor={chartAxisColor}
                    tooltipBg={tooltipBg}
                    tooltipBorder={tooltipBorder}
                    tooltipText={tooltipText}
                    currencySymbol={CURRENCY_SYMBOL}
                    dateRange={dateRange}
                    inventoryValue={inventoryValue}
                />

                {/* 2. INVENTORY & LOGISTICS HUB */}
                <InventorySection
                    metrics={metrics}
                    activeAlerts={activeAlerts}
                    stockStatusData={stockStatusData}
                    topProducts={topProducts}
                    tooltipBg={tooltipBg}
                    tooltipBorder={tooltipBorder}
                    tooltipText={tooltipText}
                    currencySymbol={CURRENCY_SYMBOL}
                    navigate={navigate}
                />

                {/* 3. NETWORK & RESOURCE MANAGEMENT */}
                <NetworkSection
                    metrics={metrics}
                    sitePerformance={sitePerformance}
                    allSales={allSales}
                    currencySymbol={CURRENCY_SYMBOL}
                />

                {/* 4. OPERATIONAL PERFORMANCE & GAMIFICATION */}
                <PointsPerformanceDashboard
                    workerPoints={workerPoints}
                    storePoints={storePoints}
                />

                {/* 5. SYSTEM MONITORING & AUDIT */}
                <DashboardSection title="System Monitoring & Audit" icon={Activity} className="col-span-1 md:col-span-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                        <WidgetErrorBoundary title="System Load">
                            <SystemLoadWidget />
                        </WidgetErrorBoundary>
                        <WidgetErrorBoundary title="Live Activity Log">
                            <ActivityLogWidget logs={systemLogs} />
                        </WidgetErrorBoundary>
                    </div>
                </DashboardSection>
            </div>

        </div>
    );
}
