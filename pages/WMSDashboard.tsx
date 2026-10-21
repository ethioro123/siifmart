import React from 'react';
import {
  Box, Activity, Users2, LayoutGrid, Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import OnboardTalentModal from '../components/employees/OnboardTalentModal';
import NewHireHandoverBanner from '../components/employees/NewHireHandoverBanner';
import { isManagerialRole } from '../utils/roles';
import { native } from '../utils/native';
import { useDateFilter } from '../hooks/useDateFilter';
import { Country, getCountryProfile } from '../utils/localization';

// WMS Dashboard Subcomponents
import WMSHeaderBar from '../components/wms-dashboard/WMSHeaderBar';
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
  const { user } = useStore();
  const { movements, addNotification, activeSite, sites, employees, settings, effectiveCountry } = useData();
  const { getLeaderboard } = useGamification();

  // Sovereign country scoping
  const activeCountry: Country = (activeSite?.country || effectiveCountry || settings?.country || 'ET') as Country;
  const countryProfile = getCountryProfile(activeCountry);

  // Sovereign country warehouse facilities
  const countryWarehouses = React.useMemo(() => {
    return sites.filter(s =>
      (s.country || 'ET').toUpperCase() === activeCountry.toUpperCase() &&
      (s.type === 'Warehouse' || s.type === 'Distribution Center')
    );
  }, [sites, activeCountry]);

  // Selected warehouse state for multi-warehouse HQ inspection
  const isCurrentSiteWarehouse = activeSite?.type === 'Warehouse' || activeSite?.type === 'Distribution Center';
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string>('');

  const effectiveWarehouse = React.useMemo(() => {
    if (isCurrentSiteWarehouse) return activeSite;
    if (selectedWarehouseId) {
      const match = countryWarehouses.find(w => w.id === selectedWarehouseId);
      if (match) return match;
    }
    return countryWarehouses[0] || activeSite;
  }, [isCurrentSiteWarehouse, activeSite, selectedWarehouseId, countryWarehouses]);

  // Active Panel State (Apple Segmented Control)
  const [activeTab, setActiveTab] = React.useState<ActivePanel>('flow');

  // Apple HIG Theme-aware colors for Charts
  const inboundColor = 'var(--theme-accent)';
  const outboundColor = 'var(--theme-status-warning)';

  // Date Filter
  const { dateRange, setDateRange, startDate, endDate } = useDateFilter('This Quarter');

  // Server metrics state
  const [warehouseMetrics, setWarehouseMetrics] = React.useState<any>(null);
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

  // Sovereign metrics fetch: scoped strictly to country and effective warehouse
  React.useEffect(() => {
    const fetchMetrics = async () => {
      setRefreshing(true);
      try {
        const { stockMovementsService } = await import('../services/supabase.service');
        const targetSiteId = effectiveWarehouse?.id;
        const simplifiedStart = startDate ? startDate.toISOString().split('T')[0] : undefined;

        const metricsData = await stockMovementsService.getAnalytics(
          targetSiteId,
          simplifiedStart,
          undefined,
          activeCountry
        );

        if (metricsData) {
          setWarehouseMetrics(metricsData);
        }
      } catch (e: any) {
        logger.error('WMSDashboard', "Warehouse metrics fetch failed:", e);
      } finally {
        setRefreshing(false);
      }
    };
    fetchMetrics();
  }, [effectiveWarehouse?.id, activeCountry, dateRange, startDate, endDate]);

  const INBOUND_OUTBOUND_DATA = warehouseMetrics?.flow_data || [];
  const FAST_MOVERS = warehouseMetrics?.fast_movers || [];

  // Metrics wrapper for Master Command Deck
  const metrics = React.useMemo(() => {
    const completedJobs = warehouseMetrics?.job_stats?.completed || 0;
    const hasActivity = completedJobs > 0;

    return {
      totalRevenue: 0,
      active_alerts: warehouseMetrics?.active_alerts || 0,
      inboundPOs: warehouseMetrics?.inbound_pos || 0,
      pendingPicks: warehouseMetrics?.job_stats?.pending_picks || 0,
      completedJobs: completedJobs,
      criticalPicks: warehouseMetrics?.job_stats?.critical_picks || 0,
      avgCycleTime: hasActivity ? (warehouseMetrics?.job_stats?.avg_cycle_time || '--') : '--',
      pickAccuracy: hasActivity ? (warehouseMetrics?.job_stats?.pick_accuracy || '0%') : 'N/A',
    };
  }, [warehouseMetrics]);

  // Real cold chain telemetry from actual database zones
  const coldZone = React.useMemo(() => {
    return warehouseMetrics?.zone_data?.find((z: any) =>
      z.type?.toLowerCase() === 'cold' || (z.temperature && z.temperature.trim() !== '')
    );
  }, [warehouseMetrics?.zone_data]);

  // Operational throughput completion percentage
  const networkLoadPercent = React.useMemo(() => {
    const total = warehouseMetrics?.job_stats?.total || 0;
    const completed = warehouseMetrics?.job_stats?.completed || 0;
    if (total === 0) return 100;
    return Math.min(100, Math.round((completed / total) * 100));
  }, [warehouseMetrics?.job_stats]);

  // Site-Specific Gamification Data scoped to effective warehouse
  const siteLeaderboard = React.useMemo(() => {
    const targetSiteId = effectiveWarehouse?.id;
    if (!targetSiteId) return [];
    const siteStaff = employees.filter(emp => emp.siteId === targetSiteId);
    const pointsData = getLeaderboard(targetSiteId, 'week');

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
  }, [employees, getLeaderboard, effectiveWarehouse?.id]);

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
        <WMSHeaderBar
          countryProfile={countryProfile}
          activeCountry={activeCountry}
          refreshing={refreshing}
          isCurrentSiteWarehouse={isCurrentSiteWarehouse}
          effectiveWarehouse={effectiveWarehouse}
          countryWarehouses={countryWarehouses}
          onSelectWarehouse={setSelectedWarehouseId}
          activeAlerts={metrics.active_alerts}
          coldZone={coldZone}
          totalZonesCount={warehouseMetrics?.zone_data?.length || 0}
          canOnboard={canOnboard}
          onOpenOnboardModal={() => setIsOnboardModalOpen(true)}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* ===== NEW RECRUIT HANDOVER BANNER ===== */}
        <NewHireHandoverBanner />

        {/* ===== MASTER WAREHOUSE COMMAND DECK (Hero Metric Cards) ===== */}
        <WarehouseCommandDeck
          metrics={metrics}
          dateRange={dateRange}
        />

        {/* ===== PANEL NAVIGATION TABS (Apple Segmented Control) ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-[var(--theme-border)]">
          <div role="group" aria-label="Warehouse dashboard panels" className="inline-flex items-center p-1 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] shadow-2xs gap-1 overflow-x-auto no-scrollbar">
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
                aria-pressed={activeTab === tab.id}
                className={`min-h-11 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                  activeTab === tab.id
                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-2xs border border-[var(--theme-border)]'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                }`}
              >
                <tab.icon size={13} className={activeTab === tab.id ? 'text-[var(--theme-accent)]' : ''} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--theme-status-success)] animate-pulse" />
            <span>WMS Core Synced</span>
            {effectiveWarehouse?.code && <span>• [{effectiveWarehouse.code}]</span>}
          </div>
        </div>

        {/* ===== PANEL CONTENT ===== */}

        {/* 1. Fulfillment & Flow Panel */}
        {activeTab === 'flow' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DashboardFlowDynamics
                data={INBOUND_OUTBOUND_DATA}
                inboundColor={inboundColor}
                outboundColor={outboundColor}
                t={t}
              />
              <div className="lg:col-span-1">
                <NetworkLoadCard
                  onQuickAction={handleQuickAction}
                  loadPercent={networkLoadPercent}
                />
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
            activeSite={effectiveWarehouse}
            t={t}
          />
        )}

        {/* 4. All Panels (Wall-to-Wall Floor Command) */}
        {activeTab === 'all' && (
          <div className="space-y-8">
            {/* Section 1: Inbound & Storage Dynamics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <Activity size={14} className="text-[var(--theme-accent)]" />
                <span>Flow Dynamics &amp; Spatial Density</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardFlowDynamics
                  data={INBOUND_OUTBOUND_DATA}
                  inboundColor={inboundColor}
                  outboundColor={outboundColor}
                  t={t}
                />
                <ZoneOccupancyCard
                  warehouseMetrics={warehouseMetrics}
                  fastMovers={FAST_MOVERS}
                  t={t}
                />
              </div>
            </div>

            {/* Section 2: Queue & Job Throughput */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <Box size={14} className="text-[var(--theme-accent)]" />
                <span>Operational Queue &amp; Fulfillment Stages</span>
              </div>
              <OperationalThroughputCard
                queueBreakdown={warehouseMetrics?.queue_breakdown}
              />
            </div>

            {/* Section 3: Facility Personnel & Scheduling */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <Users2 size={14} className="text-[var(--theme-accent)]" />
                <span>Facility Personnel &amp; Electronic Roster</span>
              </div>
              <FacilityRosterSection
                canOnboard={canOnboard}
                onOpenOnboardModal={() => setIsOnboardModalOpen(true)}
                siteLeaderboard={siteLeaderboard}
                activeSite={effectiveWarehouse}
                t={t}
              />
            </div>

            {/* Section 4: Live Inventory Stream & Diagnostics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <Cpu size={14} className="text-[var(--theme-accent)]" />
                <span>Ledger Stream Monitor &amp; Network Health</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <DashboardStreamMonitor
                  movements={movements}
                  handleViewAllLogs={handleViewAllLogs}
                />
                <div className="lg:col-span-1">
                  <NetworkLoadCard
                    onQuickAction={handleQuickAction}
                    loadPercent={networkLoadPercent}
                  />
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
