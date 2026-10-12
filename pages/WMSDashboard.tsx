import React from 'react';
import {
  Box, AlertTriangle, Thermometer, UserPlus,
  Activity, Users2, LayoutGrid, Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ZONES } from '../constants';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import OnboardTalentModal from '../components/employees/OnboardTalentModal';
import NewHireHandoverBanner from '../components/employees/NewHireHandoverBanner';
import { isManagerialRole } from '../utils/roles';
import { native } from '../utils/native';
import { useDateFilter } from '../hooks/useDateFilter';
import DateRangeSelector from '../components/DateRangeSelector';
import { Country, getCountryProfile } from '../utils/localization';

// WMS Dashboard Subcomponents
import WarehouseCommandDeck from '../components/wms-dashboard/WarehouseCommandDeck';
import OperationalThroughputCard from '../components/wms-dashboard/OperationalThroughputCard';
import NetworkLoadCard from '../components/wms-dashboard/NetworkLoadCard';
import DashboardFlowDynamics from '../components/wms-dashboard/DashboardFlowDynamics';
import ZoneOccupancyCard from '../components/wms-dashboard/ZoneOccupancyCard';
import DashboardStreamMonitor from '../components/wms-dashboard/DashboardStreamMonitor';
import FacilityRosterSection from '../components/wms-dashboard/FacilityRosterSection';
import { logger } from '../utils/logger';

type ActivePanel = 'flow' | 'storage' | 'team' | 'all';

export default function WMSDashboard() {
  const navigate = useNavigate();
  const { user, theme } = useStore();
  const { movements, addNotification, activeSite, employees, settings, effectiveCountry } = useData();
  const { getLeaderboard } = useGamification();

  // Sovereign country scoping
  const activeCountry: Country = (activeSite?.country || effectiveCountry || settings?.country || 'ET') as Country;
  const countryProfile = getCountryProfile(activeCountry);

  // Active Panel State (Apple Segmented Control)
  const [activeTab, setActiveTab] = React.useState<ActivePanel>('flow');

  // Apple HIG Theme-aware colors for Charts
  const chartStroke = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const chartText = theme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)';
  const inboundColor = theme === 'dark' ? '#2997FF' : '#0071E3';
  const outboundColor = theme === 'dark' ? '#FF9F0A' : '#FF9500';

  // Date Filter
  const { dateRange, setDateRange, startDate, endDate } = useDateFilter('This Quarter');

  // Server metrics state
  const [warehouseMetrics, setWarehouseMetrics] = React.useState<any>(null);
  const [inventoryMetrics, setInventoryMetrics] = React.useState<any>(null);
  const [financialMetrics, setFinancialMetrics] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = React.useState(false);
  const canOnboard = isManagerialRole(user?.role) && [
    'warehouse_manager', 'logistics_manager', 'inventory_manager',
    'dispatch_manager', 'shift_lead', 'super_admin', 'admin',
    'operations_manager', 'regional_manager'
  ].includes(user?.role || '');

  // Translate helper
  const t = (key: string) => {
    if (key === 'pos.cashSales') return 'Cash';
    if (key === 'pos.cardSales') return 'Card';
    if (key === 'pos.mobileSales') return 'Mobile Money';
    if (key === 'posCommand.salesAmount') return 'Sales';
    if (key === 'posCommand.unknownProduct') return 'Unknown Product';
    if (key === 'posCommand.newProduct') return 'New Product';
    return key;
  };

  React.useEffect(() => {
    const fetchMetrics = async () => {
      setRefreshing(true);
      try {
        const { stockMovementsService, productsService } = await import('../services/supabase.service');
        const siteId = activeSite?.id;

        const startISO = startDate ? startDate.toISOString() : undefined;
        const endISO = endDate ? endDate.toISOString() : undefined;
        const simplifiedStart = startDate ? startDate.toISOString().split('T')[0] : undefined;

        const [wmRes, imRes, fmRes] = await Promise.allSettled([
          stockMovementsService.getAnalytics(siteId, simplifiedStart),
          productsService.getMetrics(siteId),
          productsService.getFinancialMetrics(siteId, startISO, endISO)
        ]);

        if (wmRes.status === 'fulfilled') setWarehouseMetrics(wmRes.value);
        if (imRes.status === 'fulfilled') setInventoryMetrics(imRes.value);
        if (fmRes.status === 'fulfilled') setFinancialMetrics(fmRes.value);

      } catch (e: any) {
        logger.error('WMSDashboard', "Dashboard metrics fetch failed:", e);
      } finally {
        setRefreshing(false);
      }
    };
    fetchMetrics();
  }, [activeSite?.id, dateRange, startDate, endDate]);

  const INBOUND_OUTBOUND_DATA = warehouseMetrics?.flow_data || [];
  const FAST_MOVERS = warehouseMetrics?.fast_movers || [];

  // Metrics wrapper for Master Command Deck
  const metrics = React.useMemo(() => {
    const completedJobs = warehouseMetrics?.job_stats?.completed || 0;
    const hasActivity = completedJobs > 0;

    return {
      totalRevenue: financialMetrics?.total_revenue || inventoryMetrics?.total_revenue || 0,
      active_alerts: inventoryMetrics?.active_alerts || 0,
      inboundPOs: inventoryMetrics?.inbound_pos || 0,
      pendingPicks: warehouseMetrics?.job_stats?.pending_picks || 0,
      completedJobs: completedJobs,
      criticalPicks: warehouseMetrics?.job_stats?.critical_picks || 0,
      avgCycleTime: hasActivity ? (warehouseMetrics?.job_stats?.avg_cycle_time || '--') : '--',
      pickAccuracy: hasActivity ? (warehouseMetrics?.job_stats?.pick_accuracy || '0%') : 'N/A',
    };
  }, [warehouseMetrics, inventoryMetrics, financialMetrics]);

  // Site-Specific Gamification Data
  const siteLeaderboard = React.useMemo(() => {
    if (!activeSite?.id) return [];
    const siteStaff = employees.filter(emp => emp.siteId === activeSite.id);
    const pointsData = getLeaderboard(activeSite.id, 'week');

    const fullList = siteStaff.map(emp => {
      const existingPoints = pointsData.find(wp => wp.employeeId === emp.id);
      if (existingPoints) return existingPoints;

      return {
        id: `temp-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        siteId: emp.siteId,
        level: 1,
        levelTitle: 'Novice',
        weeklyPoints: 0,
        totalPoints: 0,
        todayPoints: 0,
        monthlyPoints: 0,
        averageAccuracy: 0,
        averageTimePerJob: 0,
        achievements: [],
        rank: 999
      };
    });

    return fullList.sort((a, b) => b.weeklyPoints - a.weeklyPoints).map((worker, idx) => ({
      ...worker,
      rank: idx + 1
    }));
  }, [employees, getLeaderboard, activeSite?.id]);

  const handleViewAllLogs = () => {
    navigate('/inventory');
    addNotification('info', "Switching to Audit Log View...");
  };

  const handleQuickAction = (action: string) => {
    if (native.isNative()) {
      native.vibrate(30);
    }

    switch (action) {
      case 'cycle':
        navigate('/inventory');
        setTimeout(() => addNotification('info', "Navigate to 'Stock Ops' tab to start Cycle Count"), 500);
        break;
      case 'receive':
        navigate('/procurement');
        break;
      case 'staff':
        if (canOnboard) {
          setIsOnboardModalOpen(true);
        } else {
          addNotification('info', "Staff onboarding managed by facility supervisor.");
        }
        break;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 bg-transparent relative transition-colors duration-200 w-full max-w-full overflow-hidden">
      <div className="space-y-6">

        {/* ===== TOP BAR (Apple Minimalist Operations Header) ===== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--theme-border)]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[#0071E3] dark:text-[#2997FF] rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                <Box size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">
                    Warehouse Operations Center
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20">
                    {countryProfile.name} ({activeCountry})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--theme-text-secondary)] text-xs font-medium mt-1">
                  <span className={`w-2 h-2 rounded-full ${refreshing ? 'bg-[#FF9500] animate-pulse' : 'bg-[#34C759]'}`} />
                  <span>{refreshing ? 'Synchronizing Operational Data...' : `Operational Command Node • ${activeSite?.name || 'Central Facility'}`}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] dark:text-[#FF453A] text-xs font-medium rounded-xl flex items-center shadow-2xs">
                <AlertTriangle size={13} className="mr-1.5" />
                {metrics.active_alerts} Alerts Active
              </div>
              <div className="px-3 py-1.5 bg-[#0071E3]/10 border border-[#0071E3]/20 text-[#0071E3] dark:text-[#2997FF] text-xs font-medium rounded-xl flex items-center shadow-2xs">
                <Thermometer size={13} className="mr-1.5" />
                Zone C: -4°C
              </div>
            </div>

            {canOnboard && (
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(true)}
                className="h-9 px-3.5 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
                title="Onboard warehouse pickers, packers, receivers, drivers & operators"
              >
                <UserPlus size={14} />
                <span>Onboard Talent</span>
              </button>
            )}

            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>

        {/* ===== NEW RECRUIT HANDOVER BANNER ===== */}
        <NewHireHandoverBanner />

        {/* ===== MASTER WAREHOUSE COMMAND DECK (Hero Metric Cards) ===== */}
        <WarehouseCommandDeck
          metrics={metrics}
          dateRange={dateRange}
        />

        {/* ===== PANEL NAVIGATION TABS (Apple Segmented Control) ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-[var(--theme-border)]">
          <div className="inline-flex items-center p-1 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] shadow-2xs gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'flow', label: 'Fulfillment & Flow', icon: Activity },
              { id: 'storage', label: 'Zones & Capacity', icon: Box },
              { id: 'team', label: 'Roster & Team', icon: Users2 },
              { id: 'all', label: 'All Panels', icon: LayoutGrid },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ActivePanel)}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-2xs border border-[var(--theme-border)]'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                }`}
              >
                <tab.icon size={13} className={activeTab === tab.id ? 'text-[#0071E3] dark:text-[#2997FF]' : ''} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#34C759] dark:bg-[#30D158] animate-pulse" />
            <span>WMS Core Synced</span>
            {activeSite?.code && <span>• [{activeSite.code}]</span>}
          </div>
        </div>

        {/* ===== PANEL CONTENT ===== */}

        {/* 1. Fulfillment & Flow Panel */}
        {activeTab === 'flow' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DashboardFlowDynamics
                data={INBOUND_OUTBOUND_DATA}
                chartStroke={chartStroke}
                chartText={chartText}
                theme={theme}
                inboundColor={inboundColor}
                outboundColor={outboundColor}
                t={t}
              />
              <div className="lg:col-span-1">
                <NetworkLoadCard onQuickAction={handleQuickAction} />
              </div>
            </div>

            <OperationalThroughputCard
              queueBreakdown={warehouseMetrics?.queue_breakdown}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <DashboardStreamMonitor
                movements={movements}
                handleViewAllLogs={handleViewAllLogs}
              />
              <div className="lg:col-span-1 hidden lg:block">
                <ZoneOccupancyCard
                  warehouseMetrics={warehouseMetrics}
                  mockZones={MOCK_ZONES}
                  fastMovers={FAST_MOVERS}
                  t={t}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Zones & Capacity Panel */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ZoneOccupancyCard
                  warehouseMetrics={warehouseMetrics}
                  mockZones={MOCK_ZONES}
                  fastMovers={FAST_MOVERS}
                  t={t}
                />
              </div>
              <div className="lg:col-span-2">
                <DashboardStreamMonitor
                  movements={movements}
                  handleViewAllLogs={handleViewAllLogs}
                />
              </div>
            </div>

            <OperationalThroughputCard
              queueBreakdown={warehouseMetrics?.queue_breakdown}
            />
          </div>
        )}

        {/* 3. Roster & Team Panel */}
        {activeTab === 'team' && (
          <FacilityRosterSection
            canOnboard={canOnboard}
            onOpenOnboardModal={() => setIsOnboardModalOpen(true)}
            siteLeaderboard={siteLeaderboard}
            activeSite={activeSite}
            t={t}
          />
        )}

        {/* 4. All Panels (Wall-to-Wall Floor Command) */}
        {activeTab === 'all' && (
          <div className="space-y-8">
            {/* Section 1: Inbound & Storage Dynamics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <Activity size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
                <span>Flow Dynamics &amp; Spatial Density</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardFlowDynamics
                  data={INBOUND_OUTBOUND_DATA}
                  chartStroke={chartStroke}
                  chartText={chartText}
                  theme={theme}
                  inboundColor={inboundColor}
                  outboundColor={outboundColor}
                  t={t}
                />
                <ZoneOccupancyCard
                  warehouseMetrics={warehouseMetrics}
                  mockZones={MOCK_ZONES}
                  fastMovers={FAST_MOVERS}
                  t={t}
                />
              </div>
            </div>

            {/* Section 2: Queue & Job Throughput */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <Box size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
                <span>Operational Queue &amp; Fulfillment Stages</span>
              </div>
              <OperationalThroughputCard
                queueBreakdown={warehouseMetrics?.queue_breakdown}
              />
            </div>

            {/* Section 3: Facility Personnel & Scheduling */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <Users2 size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
                <span>Facility Personnel &amp; Electronic Roster</span>
              </div>
              <FacilityRosterSection
                canOnboard={canOnboard}
                onOpenOnboardModal={() => setIsOnboardModalOpen(true)}
                siteLeaderboard={siteLeaderboard}
                activeSite={activeSite}
                t={t}
              />
            </div>

            {/* Section 4: Live Inventory Stream & Diagnostics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <Cpu size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
                <span>Ledger Stream Monitor &amp; Network Health</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <DashboardStreamMonitor
                  movements={movements}
                  handleViewAllLogs={handleViewAllLogs}
                />
                <div className="lg:col-span-1">
                  <NetworkLoadCard onQuickAction={handleQuickAction} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onboard Facility Talent Modal */}
      <OnboardTalentModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
      />
    </div>
  );
}
