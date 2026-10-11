import React from 'react';
import {
  Package, Truck, Activity, AlertTriangle, Thermometer,
  ClipboardList, Clock, ArrowRight, CheckCircle, Box, Target, UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ZONES } from '../constants';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import OnboardTalentModal from '../components/employees/OnboardTalentModal';
import NewHireHandoverBanner from '../components/employees/NewHireHandoverBanner';
import { isManagerialRole } from '../utils/roles';
import { METRIC_ROUTES } from '../utils/metrics';
import { native } from '../utils/native';
import { useDateFilter } from '../hooks/useDateFilter';
import DateRangeSelector from '../components/DateRangeSelector';
import SiteRoster from '../components/SiteRoster';
import RosterManager from '../components/RosterManager';
import { Country, getCountryProfile } from '../utils/localization';

// Subcomponents
import DashboardFlowDynamics from '../components/wms-dashboard/DashboardFlowDynamics';
import ZoneOccupancyCard from '../components/wms-dashboard/ZoneOccupancyCard';
import DashboardLeaderboard from '../components/wms-dashboard/DashboardLeaderboard';
import DashboardStreamMonitor from '../components/wms-dashboard/DashboardStreamMonitor';
import { logger } from '../utils/logger';

export default function WMSDashboard() {
  const navigate = useNavigate();
  const { user, theme } = useStore();
  const { movements, addNotification, activeSite, employees, settings, effectiveCountry } = useData();
  const { getLeaderboard } = useGamification();

  // Sovereign country scoping
  const activeCountry: Country = (activeSite?.country || effectiveCountry || settings?.country || 'ET') as Country;
  const countryProfile = getCountryProfile(activeCountry);

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
  const canOnboard = isManagerialRole(user?.role) && ['warehouse_manager', 'logistics_manager', 'inventory_manager', 'dispatch_manager', 'shift_lead', 'super_admin', 'admin', 'operations_manager', 'regional_manager'].includes(user?.role || '');

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

  // Metrics wrapper
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

        {/* Header with Date Filter & Alerts */}
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
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]">
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
              <div className="px-3 py-1.5 bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] dark:text-[#FF453A] text-xs font-medium rounded-xl flex items-center">
                <AlertTriangle size={13} className="mr-1.5" />
                {metrics.active_alerts} Alerts Active
              </div>
              <div className="px-3 py-1.5 bg-[#0071E3]/10 border border-[#0071E3]/20 text-[#0071E3] dark:text-[#2997FF] text-xs font-medium rounded-xl flex items-center">
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

        {/* New Recruit Handover Alert */}
        <NewHireHandoverBanner />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Pending Picks', value: metrics.pendingPicks, sub: `${metrics.criticalPicks} Priority`, icon: ClipboardList, color: 'text-[#FF9500] dark:text-[#FF9F0A]', bg: 'bg-[#FF9500]/10', route: METRIC_ROUTES.picks },
            { title: 'Inbound POs', value: metrics.inboundPOs, sub: 'Dock Schedule', icon: Truck, color: 'text-[#34C759] dark:text-[#30D158]', bg: 'bg-[#34C759]/10', route: METRIC_ROUTES.procurement },
            { title: 'Cycle Time', value: metrics.avgCycleTime, sub: 'Efficiency', icon: Clock, color: 'text-[#0071E3] dark:text-[#2997FF]', bg: 'bg-[#0071E3]/10', route: METRIC_ROUTES.wms },
            { title: 'Pick Accuracy', value: metrics.pickAccuracy, sub: 'Quality Score', icon: CheckCircle, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', route: METRIC_ROUTES.picks },
          ].map((kpi, idx) => (
            <div key={idx} onClick={() => navigate(kpi.route)} className="group relative cursor-pointer">
              <div className="h-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 transition-all hover:border-[#0071E3]/30 shadow-xs">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <kpi.icon size={18} className={kpi.color} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-[var(--theme-text-secondary)] mb-1">{kpi.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[var(--theme-text-primary)] leading-none">{kpi.value}</span>
                    <span className={`text-xs font-semibold ${kpi.color}`}>{kpi.sub}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] text-[#0071E3] dark:text-[#2997FF] font-semibold">View Module</span>
                  <ArrowRight size={14} className="text-[#0071E3] dark:text-[#2997FF] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Charts Area */}
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

        {/* Operational Throughput */}
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 dark:bg-[#2997FF]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
                  Operational Throughput
                </h3>
                <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Real-time throughput analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full shrink-0 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-[#34C759] dark:bg-[#30D158]" />
              <span className="text-xs font-medium text-[var(--theme-text-secondary)]">System Online</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 relative">
            {[
              { label: 'Putaway', key: 'PUTAWAY', sub: 'Inbound Ingest', icon: Package, color: 'text-[#0071E3] dark:text-[#2997FF]', bg: 'bg-[#0071E3]/10 dark:bg-[#2997FF]/10' },
              { label: 'Picking', key: 'PICK', sub: 'Outbound Flow', icon: Target, color: 'text-[#FF9500] dark:text-[#FF9F0A]', bg: 'bg-[#FF9500]/10' },
              { label: 'Packing', key: 'PACK', sub: 'QA Validated', icon: Box, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Dispatch', key: 'DISPATCH', sub: 'Postal Ready', icon: Truck, color: 'text-[#34C759] dark:text-[#30D158]', bg: 'bg-[#34C759]/10' },
              { label: 'Internal', key: 'TRANSFER', sub: 'Cross-Network', icon: ArrowRight, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Audits', key: 'COUNT', sub: 'Purity Check', icon: ClipboardList, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
              { label: 'Compliance', key: 'WASTE', sub: 'Resolution', icon: AlertTriangle, color: 'text-[#FF3B30] dark:text-[#FF453A]', bg: 'bg-[#FF3B30]/10' },
              { label: 'Returns', key: 'RETURNS', sub: 'Reverse Log', icon: ArrowRight, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Resupply', key: 'REPLENISH', sub: 'Buffer Sync', icon: Activity, color: 'text-[#0071E3] dark:text-[#2997FF]', bg: 'bg-[#0071E3]/10' },
            ].map((cluster) => (
              <div
                key={cluster.key}
                className="bg-[var(--theme-bg-subtle)] p-4 rounded-xl border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] hover:border-[#0071E3]/30 transition-all group relative cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-8 h-8 rounded-lg ${cluster.bg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <cluster.icon size={16} className={cluster.color} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-bold font-mono text-[var(--theme-text-primary)]">
                      {warehouseMetrics?.queue_breakdown?.[cluster.key] || 0}
                    </span>
                    <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Jobs</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{cluster.label}</p>
                  <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 truncate">{cluster.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Site Performance Hub */}
        <DashboardLeaderboard
          siteLeaderboard={siteLeaderboard}
          activeSite={activeSite}
          t={t}
        />

        {/* Site Personnel & Scheduling Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs">
            <SiteRoster layout="grid" limit={8} />

            {canOnboard && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(true)}
                  className="h-10 px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                >
                  <UserPlus size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
                  <span>Onboard Facility Staff</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs">
            <RosterManager />
          </div>
        </div>

        {/* Activity Monitor Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <DashboardStreamMonitor
            movements={movements}
            handleViewAllLogs={handleViewAllLogs}
          />

          {/* Global Performance Pulse */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 sm:p-6 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-[var(--theme-text-secondary)] mb-6">Network Load</h4>
                <div className="relative h-36 w-full flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--theme-border)]" />
                  <div className="absolute inset-0 rounded-full border-4 border-[#0071E3] dark:border-[#2997FF] border-t-transparent border-r-transparent" />
                  <div className="text-center relative z-10">
                    <span className="block text-3xl font-bold font-mono text-[var(--theme-text-primary)] leading-none">84%</span>
                    <span className="text-xs font-semibold text-[#34C759] dark:text-[#30D158] mt-1.5 block">Optimal</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => handleQuickAction('receive')}
                  className="w-full h-10 flex items-center justify-between px-4 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <span>Launch Receive</span>
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction('cycle')}
                  className="w-full h-10 flex items-center justify-between px-4 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Audit Systems</span>
                  <Package size={15} className="text-[var(--theme-text-secondary)]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboard Facility Talent Modal */}
      <OnboardTalentModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
      />
    </div>
  );
}
