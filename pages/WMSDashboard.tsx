
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import {
  Package, Truck, Activity, AlertTriangle, Thermometer,
  ClipboardList, Clock, ArrowRight, CheckCircle, Box, User, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ZONES } from '../constants';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext'; // Live Data
import ManagerDashboardBanner from '../components/ManagerDashboardBanner';
import ClickableKPICard from '../components/ClickableKPICard';
import { calculateMetrics, METRIC_ROUTES } from '../utils/metrics';
import { native } from '../utils/native';
import WorkerPointsDisplay, { LeaderboardWidget } from '../components/WorkerPointsDisplay';
import { Trophy, Target, Award, Crown } from 'lucide-react';
import { useDateFilter, DateRangeOption } from '../hooks/useDateFilter'; // Import hook
import DateRangeSelector from '../components/DateRangeSelector';
import SiteRoster from '../components/SiteRoster';
import RosterManager from '../components/RosterManager';

export default function WMSDashboard() {
  const navigate = useNavigate();
  const { user } = useStore();
  // Restore variables needed for UI (myPoints, movements for log list)
  const { movements, addNotification, activeSite, workerPoints, getLeaderboard, employees } = useData();

  // --- DATE FILTER ---
  // Using startDate and endDate from the hook to pass to server metrics
  const { dateRange, setDateRange, isWithinRange, startDate, endDate } = useDateFilter('This Quarter');

  // Server metrics state
  const [warehouseMetrics, setWarehouseMetrics] = React.useState<any>(null);
  const [inventoryMetrics, setInventoryMetrics] = React.useState<any>(null); // For KPI cards
  const [financialMetrics, setFinancialMetrics] = React.useState<any>(null); // For Revenue
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      setRefreshing(true);
      try {
        const { stockMovementsService, productsService } = await import('../services/supabase.service');
        const siteId = activeSite?.id;

        const startISO = startDate ? startDate.toISOString() : undefined;
        const endISO = endDate ? endDate.toISOString() : undefined;

        // stockMovementsService only supports 'start' date string (approx)
        const simplifiedStart = startDate ? startDate.toISOString().split('T')[0] : undefined;

        // Use Promise.allSettled for maximum resilience - one failure won't blockothers
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

  // Metrics wrapper: Map server data to UI expected keys
  const metrics = React.useMemo(() => {
    // Check if we have any completed jobs to avoid misleading "100%" accuracy or "0m" cycle time
    const completedJobs = warehouseMetrics?.job_stats?.completed || 0;
    const hasActivity = completedJobs > 0;

    return {
      // Inventory Metrics (from get_inventory_metrics / financial_metrics)
      totalRevenue: financialMetrics?.total_revenue || inventoryMetrics?.total_revenue || 0,
      active_alerts: inventoryMetrics?.active_alerts || 0,
      inboundPOs: inventoryMetrics?.inbound_pos || 0,

      // Warehouse Metrics (from get_warehouse_metrics / job_stats)
      pendingPicks: warehouseMetrics?.job_stats?.pending_picks || 0,
      completedJobs: completedJobs,
      criticalPicks: warehouseMetrics?.job_stats?.critical_picks || 0,
      avgCycleTime: hasActivity ? (warehouseMetrics?.job_stats?.avg_cycle_time || '--') : '--',
      pickAccuracy: hasActivity ? (warehouseMetrics?.job_stats?.pick_accuracy || '0%') : 'N/A',
    };
  }, [warehouseMetrics, inventoryMetrics, financialMetrics]);

  // Get current user points (Client-side from Context is fine for personal gamification)
  const myPoints = workerPoints.find(wp => wp.employeeId === user?.id || wp.employeeName === user?.name);

  // --- SITE-SPECIFIC GAMIFICATION DATA ---
  const siteLeaderboard = React.useMemo(() => {
    if (!activeSite?.id) return [];

    // 1. Get all employees specifically for this warehouse
    const siteStaff = employees.filter(emp => emp.siteId === activeSite.id);

    // 2. Get the active leaderboard points for this site
    const pointsData = getLeaderboard(activeSite.id, 'week');

    // 3. Merge: Ensure every site employee is present in the list
    const fullList = siteStaff.map(emp => {
      const existingPoints = pointsData.find(wp => wp.employeeId === emp.id);
      if (existingPoints) return existingPoints;

      // Fallback for workers with no points yet this week
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
        rank: 999 // Will be re-ranked below
      };
    });

    // 4. Final Sorting and Re-ranking
    return fullList.sort((a, b) => b.weeklyPoints - a.weeklyPoints).map((worker, idx) => ({
      ...worker,
      rank: idx + 1
    }));
  }, [employees, getLeaderboard, activeSite?.id]);


  const handleViewAllLogs = () => {
    navigate('/inventory'); // Direct to Audit Logs tab logic if implemented, or general inventory
    addNotification('info', "Switching to Audit Log View...");
  };

  const handleQuickAction = (action: string) => {
    // ... existing quick action logic
    // Haptic feedback for PDA
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
    <div className="space-y-8 dark:bg-[#050507] bg-[#f8f9fa] -m-8 p-8 min-h-screen relative transition-colors duration-500">
      {/* Background Depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] dark:bg-cyber-primary/5 bg-cyber-primary/2 rounded-full blur-[150px] -mr-96 -mt-96 opacity-40" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] dark:bg-blue-500/5 bg-blue-500/2 rounded-full blur-[120px] -ml-72 -mb-72 opacity-30" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Manager Quick Access Banner */}
        <ManagerDashboardBanner />

        {/* Header with Date Filter & Alerts */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 dark:border-white/[0.08] border-black/[0.05]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-cyber-primary/20 rounded-xl border border-cyber-primary/30 shadow-[0_0_15px_rgba(0,255,157,0.2)]">
                <Box className="text-cyber-primary animate-pulse-slow" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold dark:text-white text-slate-900 tracking-tight uppercase">Warehouse Operations Center</h1>
                <div className="flex items-center gap-2 dark:text-gray-500 text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-cyber-primary animate-ping' : 'bg-cyber-primary opacity-40'}`}></span>
                  {refreshing ? 'Synchronizing Operational Data...' : 'Operational Command Node'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 p-1.5 dark:bg-white/[0.05] bg-white border dark:border-white/[0.1] border-black/[0.05] rounded-2xl shadow-sm">
              <div className="px-5 py-2.5 dark:bg-white/[0.02] bg-red-500/[0.03] border dark:border-white/[0.05] border-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center">
                <AlertTriangle size={14} className="mr-2.5 opacity-40" />
                {metrics.active_alerts} Alerts Active
              </div>
              <div className="px-5 py-2.5 dark:bg-white/[0.02] bg-blue-500/[0.03] border dark:border-white/[0.05] border-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center">
                <Thermometer size={14} className="mr-2.5 opacity-40" />
                Zone C: -4°C
              </div>
            </div>

            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>

        {/* KPI Grid - Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Pending Picks', value: metrics.pendingPicks, sub: `${metrics.criticalPicks} Priority`, icon: ClipboardList, color: 'text-yellow-400', bg: 'bg-yellow-500/10', route: METRIC_ROUTES.picks },
            { title: 'Inbound POs', value: metrics.inboundPOs, sub: 'Dock Schedule', icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', route: METRIC_ROUTES.procurement },
            { title: 'Cycle Time', value: metrics.avgCycleTime, sub: 'Efficiency', icon: Clock, color: 'text-cyber-primary', bg: 'bg-cyber-primary/10', route: METRIC_ROUTES.wms },
            { title: 'Pick Accuracy', value: metrics.pickAccuracy, sub: 'Quality Score', icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', route: METRIC_ROUTES.picks },
          ].map((kpi, idx) => (
            <div key={idx} onClick={() => navigate(kpi.route)} className="group relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl -z-10 transition-opacity opacity-0 group-hover:opacity-100 duration-500" />
              <div className={`h-full dark:bg-white/[0.06] bg-white backdrop-blur-2xl border dark:border-white/[0.12] border-black/[0.05] rounded-[2.5rem] p-7 transition-all duration-500 hover:translate-y-[-4px] dark:hover:border-white/[0.2] hover:border-black/10 dark:hover:bg-white/[0.08] hover:bg-white/90 shadow-sm dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)] hover:shadow-xl`}>
                <div className="flex items-start justify-between mb-5">
                  <div className={`p-4 rounded-2xl ${kpi.bg} border dark:border-white/[0.05] border-black/[0.02] shadow-inner transition-transform duration-500 group-hover:scale-110`}>
                    <kpi.icon size={22} className={kpi.color} />
                  </div>
                </div>
                <div>
                  <h3 className="dark:text-gray-500 text-slate-400 text-[10px] font-bold uppercase tracking-[0.25em] mb-2">{kpi.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold dark:text-white text-slate-900 tracking-tight leading-none">{kpi.value}</span>
                    <span className={`text-[11px] font-bold ${kpi.color} opacity-60`}>{kpi.sub}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t dark:border-white/5 border-black/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] dark:text-gray-500 text-slate-500 font-bold uppercase tracking-widest">View Module</span>
                  <ArrowRight size={14} className="dark:text-gray-600 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inbound vs Outbound Flow */}
          <div className="lg:col-span-2 dark:bg-white/[0.06] bg-white backdrop-blur-2xl border dark:border-white/[0.12] border-black/5 rounded-[2.5rem] p-8 relative overflow-hidden shadow-sm transition-colors duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 dark:bg-cyber-primary/5 bg-cyber-primary/2 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="flex items-center justify-between mb-10 relative">
              <div>
                <h3 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-cyber-primary rounded-full shadow-[0_0_10px_rgba(0,255,157,0.3)]" />
                  Flow Dynamics
                </h3>
                <p className="dark:text-gray-500 text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest opacity-60">Daily item movement velocity</p>
              </div>
              <div className="flex items-center gap-6 p-2 dark:bg-white/[0.05] bg-slate-50 border dark:border-white/[0.1] border-black/[0.05] rounded-2xl shadow-sm transition-colors">
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl">
                  <div className="w-2.5 h-2.5 bg-cyber-primary rounded-sm opacity-60" />
                  <span className="text-[10px] font-bold dark:text-gray-500 text-slate-400 uppercase tracking-widest">Inbound</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm opacity-60" />
                  <span className="text-[10px] font-bold dark:text-gray-500 text-slate-400 uppercase tracking-widest">Outbound</span>
                </div>
              </div>
            </div>
            <div className="h-[340px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={INBOUND_OUTBOUND_DATA} barGap={12}>
                  <defs>
                    <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff9d" stopOpacity={1} />
                      <stop offset="100%" stopColor="#00ff9d" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    fontWeight={800}
                    tickLine={false}
                    axisLine={false}
                    dy={15}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    fontWeight={800}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-cyber-dark/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">{payload[0].payload.date}</p>
                            <div className="space-y-2">
                              {payload.map((entry: any, i: number) => (
                                <div key={i} className="flex items-center justify-between gap-8">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill === 'url(#inboundGradient)' ? '#00ff9d' : '#3b82f6' }} />
                                    <span className="text-xs font-bold text-white uppercase tracking-tight">{entry.name}</span>
                                  </div>
                                  <span className="text-sm font-black text-white">{entry.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar name="Inbound" dataKey="inbound" fill="url(#inboundGradient)" radius={[6, 6, 0, 0]} />
                  <Bar name="Outbound" dataKey="outbound" fill="url(#outboundGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Storage Density & Velocity */}
          <div className="flex flex-col gap-6">
            <div className="dark:bg-white/[0.06] bg-white backdrop-blur-2xl border dark:border-white/[0.1] border-black/[0.05] rounded-[2.5rem] p-10 flex-1 shadow-sm transition-colors duration-500">
              <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-8 flex items-center gap-4">
                <Thermometer className="dark:text-cyber-primary text-cyber-primary opacity-60" size={20} />
                Spatial Density
              </h3>
              <div className="space-y-7">
                {(warehouseMetrics?.zone_data?.length > 0 ? warehouseMetrics.zone_data : MOCK_ZONES).slice(0, 4).map((zone: any) => {
                  const percent = (zone.occupied / zone.capacity) * 100;
                  let colorClass = 'from-cyber-primary to-emerald-400';
                  if (percent > 90) colorClass = 'from-red-500 to-orange-500';
                  else if (percent > 75) colorClass = 'from-yellow-400 to-orange-400';

                  return (
                    <div key={zone.id} className="group cursor-help">
                      <div className="flex justify-between items-end mb-2.5 px-0.5">
                        <div>
                          <span className="text-xs font-bold dark:text-white text-slate-900 uppercase tracking-wider">{zone.name}</span>
                          <p className="text-[9px] dark:text-gray-500 text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-60">Automated Racking</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[11px] font-bold ${percent > 90 ? 'text-red-400' : 'dark:text-cyber-primary text-cyber-primary'}`}>{percent.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full dark:bg-black/20 bg-slate-100 rounded-full h-2 overflow-hidden border dark:border-white/5 border-black/[0.03]">
                        <div
                          className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,255,157,0.2)]`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="dark:bg-white/[0.06] bg-white backdrop-blur-2xl border dark:border-white/[0.1] border-black/[0.05] rounded-[2.5rem] p-10 shadow-sm transition-colors duration-500">
              <h4 className="text-[10px] font-bold dark:text-gray-500 text-slate-400 uppercase tracking-[0.3em] mb-6">Velocity Ranking</h4>
              <div className="space-y-4">
                {FAST_MOVERS.length > 0 ? FAST_MOVERS.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 dark:bg-white/[0.02] bg-slate-50/50 rounded-2xl border dark:border-white/[0.05] border-black/[0.03] group hover:dark:bg-white/[0.05] hover:bg-slate-100/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl dark:bg-white/[0.03] bg-white flex items-center justify-center font-bold dark:text-gray-600 text-slate-400 text-[10px] border dark:border-white/[0.05] border-black/[0.05] group-hover:text-cyber-primary group-hover:dark:border-cyber-primary/20 group-hover:border-cyber-primary/10 transition-colors">
                        0{i + 1}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold dark:text-gray-200 text-slate-900 truncate block group-hover:dark:text-white group-hover:text-cyber-primary transition-colors">{item.name}</span>
                        <p className="text-[9px] dark:text-gray-500 text-slate-400 font-bold uppercase tracking-tighter mt-0.5 opacity-60">SKU Fast-Tracked</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right shrink-0">
                      <div className="text-right">
                        <span className="block text-xs font-black dark:text-white text-slate-900">{item.moved}</span>
                        {item.trend && <span className="text-[9px] font-bold text-cyber-primary">{item.trend}</span>}
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest text-center py-4">Scanning Network...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Operational Pipeline - Premium Breakdown */}
        <div className="dark:bg-white/[0.04] bg-white backdrop-blur-2xl border dark:border-white/[0.08] border-black/[0.05] rounded-[2.5rem] p-10 relative overflow-hidden shadow-sm transition-colors duration-500">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-full bg-cyber-primary/5 blur-[120px] rounded-full translate-x-1/2" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 relative transition-colors duration-500">
            <div>
              <h3 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-4 uppercase tracking-tight">
                <div className="p-3 dark:bg-white/[0.03] bg-white border dark:border-white/10 border-black/5 rounded-2xl shadow-sm">
                  <Activity className="text-cyber-primary" size={24} />
                </div>
                Operational Throughput
              </h3>
              <p className="dark:text-gray-500 text-slate-400 text-xs mt-2 font-bold uppercase tracking-widest opacity-60">Real-time throughput analysis</p>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 dark:bg-white/[0.03] bg-white border dark:border-white/10 border-black/5 rounded-2xl shrink-0 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-cyber-primary opacity-60" />
              <span className="text-[10px] font-bold dark:text-white text-slate-600 uppercase tracking-widest">System Online</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 relative">
            {[
              { label: 'Putaway', key: 'PUTAWAY', sub: 'Inbound Ingest', icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Picking', key: 'PICK', sub: 'Outbound Flow', icon: Target, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'Packing', key: 'PACK', sub: 'QA Validated', icon: Box, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Dispatch', key: 'DISPATCH', sub: 'Postal Ready', icon: Truck, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Internal', key: 'TRANSFER', sub: 'Cross-Network', icon: ArrowRight, iconColor: 'text-pink-400', bg: 'bg-pink-500/10' },
              { label: 'Audits', key: 'COUNT', sub: 'Purity Check', icon: ClipboardList, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Compliance', key: 'WASTE', sub: 'Resolution', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Returns', key: 'RETURNS', sub: 'Reverse Log', icon: ArrowRight, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Resupply', key: 'REPLENISH', sub: 'Buffer Sync', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            ].map((cluster, i) => (
              <div
                key={cluster.key}
                className="dark:bg-white/[0.03] bg-white backdrop-blur-md p-6 rounded-[2rem] border dark:border-white/5 border-black/[0.05] dark:hover:border-white/10 hover:border-black/10 dark:hover:bg-white/[0.05] hover:bg-slate-50 transition-all duration-500 hover:translate-y-[-4px] group relative cursor-pointer shadow-sm hover:shadow-md overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6 relative">
                  <div className={`p-3 rounded-2xl ${cluster.bg} border dark:border-white/5 border-black/[0.02] transition-transform duration-500 group-hover:scale-110`}>
                    <cluster.icon size={18} className={cluster.color || cluster.iconColor} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold dark:text-white text-slate-900 group-hover:text-cyber-primary transition-colors">
                      {warehouseMetrics?.queue_breakdown?.[cluster.key] || 0}
                    </span>
                    <span className="text-[8px] font-bold dark:text-gray-500 text-slate-400 uppercase tracking-widest">Jobs</span>
                  </div>
                </div>
                <div className="relative">
                  <p className="text-xs font-bold dark:text-white text-slate-900 uppercase tracking-wider">{cluster.label}</p>
                  <p className="text-[9px] dark:text-gray-500 text-slate-400 font-bold uppercase tracking-tight mt-1 truncate opacity-60">{cluster.sub}</p>
                </div>
              </div>
            ))}

            {/* Hub Placeholder - will be rendered after the grid */}
          </div>
        </div>

        {/* Site Performance Elite Hub - Expansive Command View */}
        <div className="dark:bg-white/[0.04] bg-white backdrop-blur-2xl p-10 rounded-[3rem] border dark:border-white/10 border-black/[0.05] shadow-xl relative overflow-hidden group transition-all mt-6">
          {/* Background Accents */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] dark:bg-cyber-primary/5 bg-cyber-primary/2 rounded-full blur-[120px] -mr-64 -mt-64 transition-opacity opacity-50" />

          <div className="relative">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-2xl font-black dark:text-white text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                  <div className="p-4 rounded-2xl dark:bg-yellow-400/10 bg-yellow-400/5 border dark:border-yellow-400/20 border-black/5 shadow-inner">
                    <Trophy size={32} className="text-yellow-400" />
                  </div>
                  Performance Elite Hub
                </h3>
                <p className="dark:text-gray-500 text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-[0.3em] opacity-60">Site Command: {activeSite?.name || 'Central Network'}</p>
              </div>
              <div className="flex items-center gap-4 px-6 py-3 dark:bg-white/[0.05] bg-slate-50 rounded-2xl border dark:border-white/5 border-black/5 shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold dark:text-gray-500 text-slate-400 uppercase tracking-widest leading-none mb-1">Live Feed</span>
                  <span className="text-xs font-black dark:text-cyber-primary text-cyber-primary uppercase">Operational Pulse Active</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
              </div>
            </div>

            {/* Top 5 Performers - Command Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
              {siteLeaderboard.slice(0, 5).map((worker: any, idx: number) => {
                const configurations = [
                  {
                    rank: 1,
                    border: 'dark:border-yellow-400/40 border-yellow-400/20',
                    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.15)] dark:shadow-[0_0_60px_rgba(251,191,36,0.1)]',
                    crown: true,
                    medal: '🥇',
                    bg: 'from-yellow-400 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  },
                  {
                    rank: 2,
                    border: 'border-slate-400/30',
                    glow: 'shadow-lg',
                    crown: false,
                    medal: '🥈',
                    bg: 'from-slate-400 to-slate-500'
                  },
                  {
                    rank: 3,
                    border: 'border-amber-600/30',
                    glow: 'shadow-lg',
                    crown: false,
                    medal: '🥉',
                    bg: 'from-amber-600 to-orange-700'
                  },
                  {
                    rank: 4,
                    border: 'border-gray-500/20',
                    glow: 'shadow-lg',
                    crown: false,
                    medal: '🏅',
                    bg: 'from-gray-500 to-gray-600'
                  },
                  {
                    rank: 5,
                    border: 'border-gray-700/20',
                    glow: 'shadow-lg',
                    crown: false,
                    medal: '🏅',
                    bg: 'from-gray-700 to-gray-800'
                  }
                ];
                const config = configurations[idx];

                return (
                  <div key={worker.id} className={`relative flex flex-col p-6 rounded-[2rem] dark:bg-white/[0.03] bg-white border ${config.border} ${config.glow} transition-all hover:translate-y-[-8px] hover:dark:bg-white/[0.05] group/card overflow-hidden`}>
                    {/* Rank Number Graphic */}
                    <div className="absolute top-4 right-6 text-5xl font-black opacity-5 dark:text-white text-slate-900 italic select-none">#{config.rank}</div>

                    <div className="flex flex-col items-center text-center mb-8 relative">
                      <div className="relative mb-6">
                        <div className={`w-24 h-24 rounded-2xl dark:bg-black/40 bg-slate-100 flex items-center justify-center border-2 border-white/10 overflow-hidden relative shadow-2xl transition-transform group-hover/card:scale-110 duration-700`}>
                          <User size={40} className="dark:text-white text-slate-600 opacity-40" />
                          <div className={`absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent`} />
                        </div>
                        <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r ${config.bg} text-[10px] font-black text-white shadow-xl whitespace-nowrap`}>
                          LVL {worker.level}
                        </div>
                        {config.crown && <Crown size={24} className="absolute -top-4 -right-2 text-yellow-400 rotate-12 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />}
                      </div>
                      <h4 className="text-xl font-black dark:text-white text-slate-900 truncate w-full mb-1 tracking-tight">{worker.employeeName}</h4>
                      <p className="text-[10px] dark:text-gray-500 text-slate-400 font-bold uppercase tracking-[0.2em]">{worker.levelTitle}</p>
                    </div>

                    {/* Operational Scorecard */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      <div className="p-4 rounded-2xl dark:bg-white/[0.02] bg-slate-50 border dark:border-white/5 border-black/[0.03]">
                        <p className="text-[8px] dark:text-gray-500 text-slate-400 font-black uppercase tracking-widest mb-1.5">Efficiency</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold dark:text-white text-slate-900">{worker.averageAccuracy || '98'}</span>
                          <span className="text-[9px] font-bold text-cyber-primary">%</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl dark:bg-white/[0.02] bg-slate-50 border dark:border-white/5 border-black/[0.03]">
                        <p className="text-[8px] dark:text-gray-500 text-slate-400 font-black uppercase tracking-widest mb-1.5">Velocity</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold dark:text-white text-slate-900">{worker.averageTimePerJob || '4.2'}</span>
                          <span className="text-[9px] font-bold text-cyber-primary">MNS</span>
                        </div>
                      </div>
                    </div>

                    {/* Weekly Performance Bar */}
                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-[9px] dark:text-gray-500 text-slate-400 font-black uppercase tracking-widest mb-1.5">Weekly Target</span>
                        <span className="text-sm font-black dark:text-white text-slate-900">{worker.weeklyPoints.toLocaleString()} <span className="text-[9px] text-cyber-primary">PTS</span></span>
                      </div>
                      <div className="h-3 dark:bg-black/40 bg-slate-100 rounded-lg overflow-hidden border dark:border-white/5 border-black/[0.02] p-0.5">
                        <div
                          className={`h-full rounded-md bg-gradient-to-r ${config.bg} relative`}
                          style={{ width: `${Math.min(100, (worker.weeklyPoints / 2500) * 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                      </div>
                    </div>

                    {/* Achievement Preview */}
                    <div className="mt-6 flex gap-2 overflow-hidden items-center justify-center opacity-70 group-hover/card:opacity-100 transition-opacity">
                      {(worker.achievements || []).slice(0, 4).map((ach: any, i: number) => (
                        <div key={i} className="w-8 h-8 rounded-lg dark:bg-white/5 bg-slate-50 border dark:border-white/10 border-black/5 flex items-center justify-center text-xs grayscale group-hover/card:grayscale-0 transition-all" title={ach.name}>
                          {ach.icon || '🏆'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Site Personnel & Scheduling Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
              {/* Modern Site Roster Section */}
              <div className="dark:bg-white/[0.02] bg-slate-50 border dark:border-white/5 border-black/5 rounded-[3rem] p-10 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent" />
                <SiteRoster layout="grid" limit={8} className="relative z-10" />

                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => navigate('/employees')}
                    className="px-8 py-3 dark:bg-white/5 bg-white border dark:border-white/10 border-black/10 rounded-2xl text-[10px] font-black dark:text-gray-400 text-slate-500 uppercase tracking-[0.3em] hover:text-cyber-primary hover:dark:border-white/20 hover:border-black/20 transition-all flex items-center gap-3"
                  >
                    Access Personnel Database
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Advanced E-Rostering Section */}
              <div className="dark:bg-white/[0.02] bg-slate-50 border dark:border-white/5 border-black/5 rounded-[3rem] p-10 relative overflow-visible group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent" />
                <RosterManager className="relative z-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Activity Monitor Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Live Stream */}
          <div className="lg:col-span-3 dark:bg-white/[0.06] bg-white backdrop-blur-2xl border dark:border-white/[0.1] border-black/[0.05] rounded-[2.5rem] p-10 shadow-sm transition-colors duration-500">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-bold dark:text-white text-slate-900 uppercase tracking-tight">Stream Monitor</h3>
                <p className="text-[10px] dark:text-gray-500 text-slate-400 mt-2 uppercase font-bold tracking-[0.2em] opacity-60">Real-time execution log</p>
              </div>
              <button
                onClick={handleViewAllLogs}
                className="px-6 py-2.5 dark:bg-white/[0.05] bg-white border dark:border-white/[0.1] border-black/[0.05] rounded-2xl text-[10px] font-bold dark:text-gray-300 text-slate-600 uppercase tracking-widest hover:text-cyber-primary hover:dark:border-white/[0.2] hover:border-black/10 transition-all shadow-sm"
              >
                Full Archive
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
              {movements.slice(0, 10).map((move, i) => (
                <div key={i} className="flex items-center group py-3 px-4 border-b dark:border-white/5 border-black/5 last:border-0 hover:dark:bg-white/[0.03] hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
                  <div className={`w-1 h-8 rounded-full mr-5 transition-all group-hover:h-4 ${move.type === 'IN' ? 'bg-cyber-primary' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold dark:text-white text-slate-900 truncate max-w-[140px] tracking-tight group-hover:text-cyber-primary transition-colors">{move.productName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${move.type === 'IN' ? 'bg-cyber-primary/10 text-cyber-primary' : 'bg-blue-500/10 text-blue-500'}`}>{move.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] dark:text-gray-500 text-slate-400 font-bold uppercase tracking-widest opacity-60">{move.type} • {move.performedBy}</p>
                      <span className="text-[10px] dark:text-gray-600 text-slate-500 font-bold italic">{move.date?.includes(',') ? move.date.split(',')[0] : move.date || 'Live'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Performance Pulse */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="dark:bg-white/[0.06] bg-white backdrop-blur-2xl border dark:border-white/[0.1] border-black/[0.05] rounded-[2.5rem] p-8 flex-1 flex flex-col justify-between group overflow-hidden relative shadow-sm transition-colors duration-500">
              <div>
                <h4 className="text-[10px] font-bold dark:text-gray-500 text-slate-400 uppercase tracking-widest mb-6">Network Load</h4>
                <div className="relative h-40 w-full flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 dark:border-white/5 border-black/5 shadow-inner" />
                  <div className="absolute inset-0 rounded-full border-4 border-cyber-primary border-t-transparent border-r-transparent opacity-60" />
                  <div className="text-center relative z-10">
                    <span className="block text-4xl font-bold dark:text-white text-slate-900 leading-none tracking-tight">84%</span>
                    <span className="text-[9px] font-bold text-cyber-primary uppercase tracking-widest mt-2 block">Optimal</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <button
                  onClick={() => handleQuickAction('receive')}
                  className="w-full flex items-center justify-between p-4 bg-cyber-primary text-black rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-cyber-primary/90 transition-all active:scale-95 shadow-sm"
                >
                  Launch Receive
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => handleQuickAction('cycle')}
                  className="w-full flex items-center justify-between p-4 dark:bg-white/[0.03] bg-white border dark:border-white/10 border-black/5 dark:text-white text-slate-700 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:dark:bg-white/[0.06] hover:bg-slate-50 transition-all shadow-sm"
                >
                  Audit Systems
                  <Package size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
