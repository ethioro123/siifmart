import React from 'react';
import {
  Package, Truck, Activity, AlertTriangle, Thermometer,
  ClipboardList, Clock, ArrowRight, CheckCircle, Box, ChevronRight, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ZONES } from '../constants';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';

import ClickableKPICard from '../components/ClickableKPICard';
import { METRIC_ROUTES } from '../utils/metrics';
import { native } from '../utils/native';
import { useDateFilter } from '../hooks/useDateFilter';
import DateRangeSelector from '../components/DateRangeSelector';
import SiteRoster from '../components/SiteRoster';
import RosterManager from '../components/RosterManager';

// Subcomponents
import DashboardFlowDynamics from '../components/wms-dashboard/DashboardFlowDynamics';
import ZoneOccupancyCard from '../components/wms-dashboard/ZoneOccupancyCard';
import DashboardLeaderboard from '../components/wms-dashboard/DashboardLeaderboard';
import DashboardStreamMonitor from '../components/wms-dashboard/DashboardStreamMonitor';

export default function WMSDashboard() {
  const navigate = useNavigate();
  const { user, theme } = useStore();
  const { movements, addNotification, activeSite, employees } = useData();
  const { getWorkerPoints, getLeaderboard } = useGamification();

  // Theme-aware colors for Charts
  const chartStroke = theme === 'dark' ? 'rgba(169, 203, 162, 0.1)' : 'rgba(44, 94, 59, 0.1)';
  const chartText = theme === 'dark' ? 'rgba(169, 203, 162, 0.5)' : 'rgba(44, 94, 59, 0.6)';
  const inboundColor = theme === 'dark' ? '#A9CBA2' : '#2C5E3B';
  const outboundColor = theme === 'dark' ? '#E2C899' : '#8C6239';

  // --- DATE FILTER ---
  const { dateRange, setDateRange, startDate, endDate } = useDateFilter('This Quarter');

  // Server metrics state
  const [warehouseMetrics, setWarehouseMetrics] = React.useState<any>(null);
  const [inventoryMetrics, setInventoryMetrics] = React.useState<any>(null);
  const [financialMetrics, setFinancialMetrics] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Translate helper (in case page translations aren't globally bound, fallback to clean keys)
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
        console.error("Dashboard metrics fetch failed:", e);
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

  // --- SITE-SPECIFIC GAMIFICATION DATA ---
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
        navigate('/employees');
        break;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 bg-transparent relative transition-colors duration-500 w-full max-w-full overflow-hidden">
      {/* Background Depth & Organic Flows */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#2C5E3B]/10 dark:bg-[#1E3F27]/5 rounded-full blur-[150px] -mr-96 -mt-96 opacity-40 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-600/10 dark:bg-amber-700/3 rounded-full blur-[120px] -ml-72 -mb-72 opacity-30 animate-pulse-slow" />
      </div>

      <div className="relative z-10 space-y-8">

        {/* Header with Date Filter & Alerts */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E2DCCE]/40 dark:border-white/[0.04]">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-gradient-to-tr from-[#1E3F27] via-[#2C5E3B] to-amber-700 rounded-2xl shadow-[0_8px_20px_rgba(44,94,59,0.2)]">
                <Box className="text-white animate-pulse-slow" size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold dark:text-[#EAE5D9] text-[#1E3F27] tracking-tight uppercase">Warehouse Operations Center</h1>
                <div className="flex items-center gap-2 text-[#4D6E56] dark:text-[#7A9E83] text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-amber-600 animate-ping' : 'bg-[#2C5E3B] opacity-60'}`}></span>
                  {refreshing ? 'Synchronizing Operational Data...' : 'Operational Command Node'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 p-1.5 bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl shadow-sm backdrop-blur-md">
              <div className="px-5 py-2.5 bg-red-500/[0.03] dark:bg-red-500/[0.02] border border-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center">
                <AlertTriangle size={14} className="mr-2.5 opacity-60" />
                {metrics.active_alerts} Alerts Active
              </div>
              <div className="px-5 py-2.5 bg-amber-600/[0.03] dark:bg-amber-600/[0.02] border border-amber-600/10 text-amber-700 dark:text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center">
                <Thermometer size={14} className="mr-2.5 opacity-60" />
                Zone C: -4°C
              </div>
            </div>

            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Pending Picks', value: metrics.pendingPicks, sub: `${metrics.criticalPicks} Priority`, icon: ClipboardList, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/5', route: METRIC_ROUTES.picks },
            { title: 'Inbound POs', value: metrics.inboundPOs, sub: 'Dock Schedule', icon: Truck, color: 'text-emerald-700 dark:text-[#A9CBA2]', bg: 'bg-emerald-500/10 dark:bg-emerald-500/5', route: METRIC_ROUTES.procurement },
            { title: 'Cycle Time', value: metrics.avgCycleTime, sub: 'Efficiency', icon: Clock, color: 'text-[#2C5E3B] dark:text-[#A9CBA2]', bg: 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10', route: METRIC_ROUTES.wms },
            { title: 'Pick Accuracy', value: metrics.pickAccuracy, sub: 'Quality Score', icon: CheckCircle, color: 'text-yellow-600 dark:text-[#E2C899]', bg: 'bg-yellow-500/10 dark:bg-yellow-500/5', route: METRIC_ROUTES.picks },
          ].map((kpi, idx) => (
            <div key={idx} onClick={() => navigate(kpi.route)} className="group relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2C5E3B]/5 to-transparent rounded-3xl -z-10 transition-opacity opacity-0 group-hover:opacity-100 duration-500" />
              <div className="h-full bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 lg:backdrop-blur-2xl rounded-3xl p-5 sm:p-6 md:p-7 transition-all duration-500 hover:translate-y-[-4px] hover:border-[#CFC6B4] dark:hover:border-emerald-800/30 hover:bg-white dark:hover:bg-[#1C2620] shadow-sm dark:shadow-[0_24px_80px_rgba(5,8,6,0.65)] hover:shadow-xl">
                <div className="flex items-start justify-between mb-5">
                  <div className={`p-4 rounded-2xl ${kpi.bg} border border-[#E2DCCE]/50 dark:border-emerald-950/10 shadow-inner transition-transform duration-500 group-hover:scale-110`}>
                    <kpi.icon size={22} className={kpi.color} />
                  </div>
                </div>
                <div>
                  <h3 className="text-[#4D6E56] dark:text-[#7A9E83] text-[10px] font-bold uppercase tracking-[0.25em] mb-2">{kpi.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight leading-none">{kpi.value}</span>
                    <span className={`text-[11px] font-bold ${kpi.color} opacity-80`}>{kpi.sub}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#E2DCCE]/40 dark:border-white/[0.04] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] text-[#4D6E56] dark:text-[#7A9E83] font-bold uppercase tracking-widest">View Module</span>
                  <ArrowRight size={14} className="text-[#4D6E56] dark:text-[#A9CBA2] group-hover:translate-x-1 transition-transform" />
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

        {/* Operational Pipeline */}
        <div className="bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 lg:backdrop-blur-2xl rounded-3xl p-5 sm:p-8 lg:p-10 relative overflow-hidden shadow-sm transition-colors duration-500">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="hidden lg:block absolute top-0 right-0 w-[500px] h-full bg-[#2C5E3B]/5 blur-[120px] rounded-full translate-x-1/2" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 relative">
            <div>
              <h3 className="text-xl font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-4 uppercase tracking-tight">
                <div className="p-3 bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl shadow-sm">
                  <Activity className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={24} />
                </div>
                Operational Throughput
              </h3>
              <p className="text-[#4D6E56] dark:text-[#7A9E83] text-xs mt-2 font-bold uppercase tracking-widest opacity-60">Real-time throughput analysis</p>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-[#FAF8F5]/80 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl shrink-0 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] opacity-80" />
              <span className="text-[10px] font-bold text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest">System Online</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 relative">
            {[
              { label: 'Putaway', key: 'PUTAWAY', sub: 'Inbound Ingest', icon: Package, color: 'text-emerald-700 dark:text-[#A9CBA2]', bg: 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10' },
              { label: 'Picking', key: 'PICK', sub: 'Outbound Flow', icon: Target, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Packing', key: 'PACK', sub: 'QA Validated', icon: Box, color: 'text-yellow-600 dark:text-[#E2C899]', bg: 'bg-yellow-500/10' },
              { label: 'Dispatch', key: 'DISPATCH', sub: 'Postal Ready', icon: Truck, color: 'text-emerald-600 dark:text-[#7A9E83]', bg: 'bg-emerald-500/10' },
              { label: 'Internal', key: 'TRANSFER', sub: 'Cross-Network', icon: ArrowRight, iconColor: 'text-stone-500', bg: 'bg-stone-500/10' },
              { label: 'Audits', key: 'COUNT', sub: 'Purity Check', icon: ClipboardList, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Compliance', key: 'WASTE', sub: 'Resolution', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
              { label: 'Returns', key: 'RETURNS', sub: 'Reverse Log', icon: ArrowRight, color: 'text-amber-700 dark:text-amber-600', bg: 'bg-amber-600/10' },
              { label: 'Resupply', key: 'REPLENISH', sub: 'Buffer Sync', icon: Activity, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((cluster) => (
              <div
                key={cluster.key}
                className="bg-[#FAF8F5]/80 dark:bg-black/20 backdrop-blur-md p-4 sm:p-6 rounded-2xl md:rounded-[2rem] border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-800/30 hover:bg-[#FAF8F5] dark:hover:bg-[#1C2620]/65 transition-all duration-500 hover:translate-y-[-4px] group relative cursor-pointer shadow-sm hover:shadow-md overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6 relative">
                  <div className={`p-3 rounded-2xl ${cluster.bg} border border-[#E2DCCE]/40 dark:border-emerald-950/10 transition-transform duration-500 group-hover:scale-110`}>
                    <cluster.icon size={18} className={cluster.color || cluster.iconColor} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] group-hover:text-[#2C5E3B] group-hover:dark:text-[#A9CBA2] transition-colors">
                      {warehouseMetrics?.queue_breakdown?.[cluster.key] || 0}
                    </span>
                    <span className="text-[8px] font-bold text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest">Jobs</span>
                  </div>
                </div>
                <div className="relative">
                  <p className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">{cluster.label}</p>
                  <p className="text-[9px] text-[#4D6E56] dark:text-[#7A9E83] font-bold uppercase tracking-tight mt-1 truncate opacity-60">{cluster.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Site Performance elite Hub */}
        <DashboardLeaderboard
          siteLeaderboard={siteLeaderboard}
          activeSite={activeSite}
          t={t}
        />

        {/* Site Personnel & Scheduling Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E2DCCE] dark:border-white/5 rounded-2xl md:rounded-[3rem] p-5 sm:p-8 lg:p-10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#2C5E3B]/20 to-transparent" />
            <SiteRoster layout="grid" limit={8} className="relative z-10" />

            <div className="mt-10 flex justify-center">
              <button
                onClick={() => navigate('/employees')}
                className="px-8 py-3 bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 rounded-2xl text-[10px] font-black text-[#4D6E56] dark:text-gray-400 uppercase tracking-[0.3em] hover:text-[#2C5E3B] hover:dark:border-white/20 hover:border-black/20 transition-all flex items-center gap-3 cursor-pointer"
              >
                Access Personnel Database
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E2DCCE] dark:border-white/5 rounded-2xl md:rounded-[3rem] p-5 sm:p-8 lg:p-10 relative overflow-visible group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#2C5E3B]/20 to-transparent" />
            <RosterManager className="relative z-10" />
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
            <div className="bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 lg:backdrop-blur-2xl rounded-3xl p-5 sm:p-6 lg:p-8 flex-1 flex flex-col justify-between group overflow-hidden relative shadow-sm transition-colors duration-500">
              <div>
                <h4 className="text-[10px] font-bold text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest mb-6">Network Load</h4>
                <div className="relative h-40 w-full flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-stone-200 dark:border-white/5 shadow-inner" />
                  <div className="absolute inset-0 rounded-full border-4 border-[#2C5E3B] dark:border-[#A9CBA2] border-t-transparent border-r-transparent opacity-60" />
                  <div className="text-center relative z-10">
                    <span className="block text-4xl font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] leading-none tracking-tight">84%</span>
                    <span className="text-[9px] font-bold text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest mt-2 block">Optimal</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <button
                  onClick={() => handleQuickAction('receive')}
                  className="w-full flex items-center justify-between p-4 bg-[#224429] dark:bg-[#EAE5D9] hover:bg-[#1B3520] dark:hover:bg-[#DFD9CA] text-[#FAF8F5] dark:text-[#1E3B24] rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  Launch Receive
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => handleQuickAction('cycle')}
                  className="w-full flex items-center justify-between p-4 bg-white/80 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm cursor-pointer"
                >
                  Audit Systems
                  <Package size={16} className="text-[#4D6E56] dark:text-[#7A9E83]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
