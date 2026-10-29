import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useFulfillmentData } from '../components/fulfillment/FulfillmentDataProvider';
import { useGamification } from '../contexts/GamificationContext';
import { useStore } from '../contexts/CentralStore';
import { useNavigate } from 'react-router-dom';
import { generateQuarterlyReport } from '../utils/reportGenerator';
import { getCountryProfile, type Country } from '../utils/localization';
import { calculateMetrics, DashboardMetrics } from '../utils/metrics';
import { formatCompactNumber } from '../utils/formatting';
import DashboardSkeleton from '../components/DashboardSkeleton';
import PointsPerformanceDashboard from '../components/PointsPerformanceDashboard';

// --- Dashboard Widgets & Sections Imports ---
import { SystemTicker } from '../components/dashboard/widgets/SystemTicker';
import { FinancialSection } from '../components/dashboard/sections/FinancialSection';
import { InventorySection } from '../components/dashboard/sections/InventorySection';
import { NetworkSection } from '../components/dashboard/sections/NetworkSection';
import { TelemetrySection } from '../components/dashboard/sections/TelemetrySection';
import { CentralOpsTeamSection } from '../components/dashboard/sections/CentralOpsTeamSection';
import { RegionalCommandSection } from '../components/dashboard/sections/RegionalCommandSection';
import { CatalogGovernanceSection } from '../components/dashboard/sections/CatalogGovernanceSection';
import { CentralOperationsHeader } from '../components/dashboard/CentralOperationsHeader';
import { CentralOpsExecutiveDeck } from '../components/dashboard/CentralOpsExecutiveDeck';
import { SitePerformance, CentralOpsViewMode, FacilityScope } from '../components/dashboard/types';

import { Download, Activity } from 'lucide-react';
import { DesktopDownloadButton } from '../components/dashboard/widgets/DesktopDownloadButton';
import { useDateFilter, DateRangeOption } from '../hooks/useDateFilter';
import FiscalYearDeck from '../components/FiscalYearDeck';
import { logger } from '../utils/logger';
import { useQuery } from '@tanstack/react-query';
import { systemLogsService } from '../services/system-logs.service';

export default function CentralOperations() {
    const { sites, employees, allSales, allOrders, allProducts, systemLogs: contextLogs, storePoints, effectiveCountry, settings, regions } = useData();
    const { jobs, transfers } = useFulfillmentData();
    const { workerPoints } = useGamification();
    const { loading } = useStore();
    const navigate = useNavigate();

    const accentColor = 'var(--theme-accent)';


    const activeCountry = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = useMemo(() => getCountryProfile(activeCountry), [activeCountry]);
    const currencySymbol = countryProfile.currencySymbol || 'ETB';

    // Interactive View Modes & Facility Scoping
    const [viewMode, setViewMode] = useState<CentralOpsViewMode>('executive');
    const [facilityScope, setFacilityScope] = useState<FacilityScope>('all');

    // On-demand Telemetry fetching: only load heavy audit logs when the user actually views Telemetry
    const { data: fetchedLogs } = useQuery({
        queryKey: ['systemLogs', 'centralOperations'],
        queryFn: () => systemLogsService.getAll(),
        staleTime: 1000 * 60 * 10,
        enabled: viewMode === 'telemetry' || viewMode === 'all',
    });
    const systemLogs = fetchedLogs || contextLogs || [];

    // Default to 'This Quarter' as requested
    const defaultRange: DateRangeOption = 'This Quarter';
    const { dateRange, setDateRange, isWithinRange } = useDateFilter(defaultRange);

    // --- FACILITY SCOPING LOGIC ---
    const baseSites = useMemo(() => {
        return (sites || []).filter(s => s.type !== 'Administration' && s.type !== 'HQ' && s.type !== 'Administrative');
    }, [sites]);

    const scopedSites = useMemo(() => {
        if (facilityScope === 'store') {
            return baseSites.filter(s => s.type === 'Store');
        }
        if (facilityScope === 'warehouse') {
            return baseSites.filter(s => s.type === 'Warehouse' || s.type === 'Distribution Center');
        }
        return baseSites;
    }, [baseSites, facilityScope]);

    const scopedSiteIds = useMemo(() => new Set(scopedSites.map(s => s.id)), [scopedSites]);

    // --- FILTERED DATA (Date & Facility Scoped) ---
    const filteredSales = useMemo(() => {
        return (allSales || []).filter(s =>
            isWithinRange(s.date) && (facilityScope === 'all' || scopedSiteIds.has(s.siteId))
        );
    }, [allSales, isWithinRange, facilityScope, scopedSiteIds]);

    const filteredOrders = useMemo(() => {
        return (allOrders || []).filter(o => isWithinRange(o.createdAt || new Date().toISOString()));
    }, [allOrders, isWithinRange]);

    const scopedProducts = useMemo(() => {
        if (facilityScope === 'all') return allProducts || [];
        return (allProducts || []).filter(p => !p.siteId || scopedSiteIds.has(p.siteId));
    }, [allProducts, facilityScope, scopedSiteIds]);

    // --- REPORT GENERATION ---
    const handleGenerateReport = () => {
        const filteredMetrics = calculateMetrics(
            filteredSales, scopedProducts,
            jobs.filter(j => isWithinRange(j.createdAt || '')),
            filteredOrders, employees, [], undefined
        );
        generateQuarterlyReport(filteredMetrics, dateRange, 'Operations');
    };

    // --- AGGREGATED METRICS ---
    const metrics: DashboardMetrics = useMemo(() => {
        try {
            return calculateMetrics(
                filteredSales, scopedProducts, jobs || [],
                filteredOrders, employees || [], [], undefined
            ) as DashboardMetrics;
        } catch (err) {
            logger.error('CentralOperations', "Error calculating metrics:", err);
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
    }, [filteredSales, scopedProducts, jobs, filteredOrders, employees]);

    const activeAlerts = metrics?.activeAlerts || 0;
    const inventoryValue = metrics?.totalNetworkStockValue || 0;

    const pendingEscalatedPOCount = useMemo(() => {
        return (allOrders || []).filter(o =>
            (o.status === 'Pending' || o.status === 'Draft') &&
            ((o.totalAmount || 0) > 150000 || (o as any).requiresHqApproval)
        ).length;
    }, [allOrders]);

    const interRegionTransfersCount = useMemo(() => {
        return (transfers || []).filter(t =>
            (t as any).isInterRegion && t.status !== 'Completed' && t.status !== 'Cancelled'
        ).length;
    }, [transfers]);

    // Stock Status Data (Scoped to Country & Facility Catalog)
    const stockStatusData = useMemo(() => {
        const goodStock = scopedProducts.filter(p => p.stock >= 10 && p.status !== 'out_of_stock').length;
        const lowStock = scopedProducts.filter(p => (p.stock < 10 && p.stock > 0) || p.status === 'low_stock').length;
        const outStock = scopedProducts.filter(p => p.stock === 0 || p.status === 'out_of_stock').length;

        return [
            { name: 'Optimal', value: goodStock, color: 'var(--theme-status-success)' },
            { name: 'Low Stock', value: lowStock, color: 'var(--theme-status-warning)' },
            { name: 'Out of Stock', value: outStock, color: 'var(--theme-status-danger)' },
        ].filter(d => d.value > 0);

    }, [scopedProducts]);

    // --- SITE PERFORMANCE ---
    const sitePerformance: SitePerformance[] = useMemo(() => {
        if (!scopedSites || !filteredSales || !employees || !scopedProducts) return [];

        return scopedSites.map(site => {
            const siteSales = filteredSales.filter(s => s.siteId === site.id);
            const revenue = siteSales.reduce((sum, s) => sum + s.total, 0);
            const staffCount = employees.filter(e => e.siteId === site.id).length;
            const lowStock = scopedProducts.filter(p => p.siteId === site.id && p.status === 'low_stock').length;

            return {
                ...site,
                revenue,
                staffCount,
                lowStock,
                transactionCount: siteSales.length
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [scopedSites, filteredSales, employees, scopedProducts]);

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

    // --- TOP PRODUCTS ---
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

    // Chart styling follows the same tokens as the rest of the workspace.
    const chartAxisColor = 'var(--theme-text-muted)';
    const chartGridColor = 'var(--theme-border-subtle)';
    const tooltipBg = 'var(--theme-bg-card)';
    const tooltipBorder = 'var(--theme-border)';
    const tooltipText = 'var(--theme-text-primary)';


    // --- LOADING STATE ---
    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 pb-24 animate-in fade-in duration-500 bg-transparent max-w-[1700px] mx-auto">
            {/* Modern Executive Header */}
            <CentralOperationsHeader
                activeCountry={activeCountry}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                facilityScope={facilityScope}
                onFacilityScopeChange={setFacilityScope}
                totalSitesCount={baseSites.length}
                filteredSitesCount={scopedSites.length}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onGenerateReport={handleGenerateReport}
            />

            {/* System Telemetry Ticker */}
            <SystemTicker />

            {/* Fiscal Year Deck (Condition: Year View & Financial/All Mode) */}
            {(dateRange === 'This Year' || dateRange === 'Last Year') && (viewMode === 'financial' || viewMode === 'all') && (
                <div className="mb-6">
                    <FiscalYearDeck
                        year={dateRange === 'Last Year' ? new Date().getFullYear() - 1 : new Date().getFullYear()}
                        currentQuarter={dateRange === 'Last Year' ? 4 : Math.floor(new Date().getMonth() / 3) + 1}
                        metrics={{
                            q1: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() < 3; }).reduce((a, b) => a + b.total, 0), { currency: currencySymbol }), label: 'Revenue', trend: '+10%' },
                            q2: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() >= 3 && d.getMonth() < 6; }).reduce((a, b) => a + b.total, 0), { currency: currencySymbol }), label: 'Revenue' },
                            q3: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() >= 6 && d.getMonth() < 9; }).reduce((a, b) => a + b.total, 0), { currency: currencySymbol }), label: 'Revenue' },
                            q4: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() >= 9; }).reduce((a, b) => a + b.total, 0), { currency: currencySymbol }), label: 'Revenue' }
                        }}
                    />
                </div>
            )}

            {/* --- DOMAIN ROUTING VIEWS --- */}
            {viewMode === 'executive' && (
                <CentralOpsExecutiveDeck
                    metrics={metrics}
                    currencySymbol={currencySymbol}
                    sitePerformance={sitePerformance}
                    revenueBySiteData={revenueBySiteData}
                    topProducts={topProducts}
                    allProducts={allProducts || []}
                    accentColor={accentColor}
                    chartGridColor={chartGridColor}
                    chartAxisColor={chartAxisColor}
                    tooltipBg={tooltipBg}
                    tooltipBorder={tooltipBorder}
                    tooltipText={tooltipText}
                    dateRange={dateRange}
                    inventoryValue={inventoryValue}
                    pendingEscalatedPOCount={pendingEscalatedPOCount}
                    interRegionTransfersCount={interRegionTransfersCount}
                />
            )}

            {viewMode === 'financial' && (
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
                    currencySymbol={currencySymbol}
                    dateRange={dateRange}
                    inventoryValue={inventoryValue}
                />
            )}

            {viewMode === 'inventory' && (
                <InventorySection
                    metrics={metrics}
                    activeAlerts={activeAlerts}
                    stockStatusData={stockStatusData}
                    topProducts={topProducts}
                    tooltipBg={tooltipBg}
                    tooltipBorder={tooltipBorder}
                    tooltipText={tooltipText}
                    currencySymbol={currencySymbol}
                    navigate={navigate}
                />
            )}

            {viewMode === 'network' && (
                <div className="space-y-8">
                    <NetworkSection
                        metrics={metrics}
                        sitePerformance={sitePerformance}
                        allSales={allSales}
                        currencySymbol={currencySymbol}
                    />
                    <PointsPerformanceDashboard
                        workerPoints={workerPoints}
                        storePoints={storePoints}
                        currencySymbol={currencySymbol}
                    />
                </div>
            )}

            {viewMode === 'team' && (
                <CentralOpsTeamSection
                    employees={employees}
                    sites={scopedSites}
                    activeCountry={activeCountry}
                    currencySymbol={currencySymbol}
                />
            )}

            {viewMode === 'regional' && (
                <RegionalCommandSection
                    regions={regions}
                    sites={sites}
                    employees={employees}
                    allSales={allSales}
                    allOrders={allOrders}
                    transfers={transfers}
                    activeCountry={activeCountry}
                    currencySymbol={currencySymbol}
                />
            )}

            {viewMode === 'catalog' && (
                <CatalogGovernanceSection
                    activeCountry={activeCountry}
                    currencySymbol={currencySymbol}
                />
            )}

            {viewMode === 'telemetry' && (
                <TelemetrySection
                    systemLogs={systemLogs}
                    activeCountry={activeCountry}
                />
            )}

            {viewMode === 'all' && (
                <div className="space-y-12">
                    <CentralOpsTeamSection
                        employees={employees}
                        sites={scopedSites}
                        activeCountry={activeCountry}
                        currencySymbol={currencySymbol}
                    />

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
                        currencySymbol={currencySymbol}
                        dateRange={dateRange}
                        inventoryValue={inventoryValue}
                    />

                    <InventorySection
                        metrics={metrics}
                        activeAlerts={activeAlerts}
                        stockStatusData={stockStatusData}
                        topProducts={topProducts}
                        tooltipBg={tooltipBg}
                        tooltipBorder={tooltipBorder}
                        tooltipText={tooltipText}
                        currencySymbol={currencySymbol}
                        navigate={navigate}
                    />

                    <NetworkSection
                        metrics={metrics}
                        sitePerformance={sitePerformance}
                        allSales={allSales}
                        currencySymbol={currencySymbol}
                    />

                    <RegionalCommandSection
                        regions={regions}
                        sites={sites}
                        employees={employees}
                        allSales={allSales}
                        allOrders={allOrders}
                        transfers={transfers}
                        activeCountry={activeCountry}
                        currencySymbol={currencySymbol}
                    />

                    <PointsPerformanceDashboard
                        workerPoints={workerPoints}
                        storePoints={storePoints}
                        currencySymbol={currencySymbol}
                    />

                    <TelemetrySection
                        systemLogs={systemLogs}
                        activeCountry={activeCountry}
                    />
                </div>
            )}

            {/* --- BOTTOM UTILITIES & ACTIONS (Get App & Executive Report) --- */}
            <div className="mt-12 p-5 sm:p-6 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                            SIIFMART Central Operations Suite
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            Download native desktop workstation or generate periodic operational intelligence reports
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <DesktopDownloadButton />

                    <button
                        onClick={handleGenerateReport}
                        className="flex items-center gap-2 px-4 py-2.5 h-[42px] rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-90 text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                        title="Generate Operational Performance Report"
                    >
                        <Download size={16} />
                        <span>Executive Report</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
