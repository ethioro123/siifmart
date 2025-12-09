
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie
} from 'recharts';
import {
  Package, Truck, Activity, AlertTriangle, Thermometer,
  ClipboardList, Clock, ArrowRight, CheckCircle, Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ZONES } from '../constants';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext'; // Live Data
import ManagerDashboardBanner from '../components/ManagerDashboardBanner';
import ClickableKPICard from '../components/ClickableKPICard';
import { calculateMetrics, METRIC_ROUTES } from '../utils/metrics';
import { native } from '../utils/native';

export default function WMSDashboard() {
  const navigate = useNavigate();
  const { user } = useStore();
  const { movements, sales, addNotification, jobs, products, orders, employees, activeSite } = useData(); // Live Data Connection

  // Calculate metrics using shared utility
  const metrics = calculateMetrics(
    sales,
    products,
    jobs,
    orders,
    employees,
    movements,
    activeSite?.id
  );

  // --- CALCULATE FLOW DATA ---
  // Group by simple "Day of Week" simulation for demo continuity
  // In a real app, we would group timestamps properly
  const INBOUND_OUTBOUND_DATA = [
    { name: 'Mon', inbound: movements.filter(m => m.type === 'IN').length + 12, outbound: movements.filter(m => m.type === 'OUT').length + 15 },
    { name: 'Tue', inbound: 20, outbound: 18 },
    { name: 'Wed', inbound: 15, outbound: 22 },
    { name: 'Thu', inbound: 30, outbound: 25 },
    { name: 'Fri', inbound: 18, outbound: 19 },
    { name: 'Sat', inbound: 9, outbound: 12 },
    { name: 'Sun', inbound: 5, outbound: 4 },
  ];

  // Calc Fast Movers from Sales
  const itemSales = sales.flatMap(s => s.items).reduce((acc: any, item) => {
    acc[item.name] = (acc[item.name] || 0) + item.quantity;
    return acc;
  }, {});

  const FAST_MOVERS = Object.keys(itemSales).map(key => ({
    name: key,
    moved: itemSales[key],
    trend: '+5%'
  })).sort((a, b) => b.moved - a.moved).slice(0, 4);

  const handleViewAllLogs = () => {
    navigate('/inventory'); // Direct to Audit Logs tab logic if implemented, or general inventory
    addNotification('info', "Switching to Audit Log View...");
  };

  const handleQuickAction = (action: string) => {
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
    <div className="space-y-6">
      {/* Manager Quick Access Banner */}
      <ManagerDashboardBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Box className="text-cyber-primary" />
            Warehouse Operations Center
          </h2>
          <p className="text-gray-400 text-sm">Real-time logistics monitoring and capacity planning.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center animate-pulse">
            <AlertTriangle size={12} className="mr-2" />
            2 Critical Stock Alerts
          </div>
          <div className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center">
            <Thermometer size={12} className="mr-2" />
            Zone C: -4°C (Optimal)
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['warehouse_manager', 'picker', 'dispatcher', 'super_admin'].includes(user?.role || '') && (
          <ClickableKPICard
            title="Pending Picks"
            value={metrics.pendingPicks}
            sub={`${metrics.criticalPicks} Critical`}
            icon={ClipboardList}
            color="text-yellow-400"
            bg="bg-yellow-500/10"
            route={METRIC_ROUTES.picks}
          />
        )}

        {['warehouse_manager', 'inventory_specialist', 'dispatcher', 'super_admin'].includes(user?.role || '') && (
          <ClickableKPICard
            title="Inbound POs"
            value={metrics.inboundPOs}
            sub="Arriving Today"
            icon={Truck}
            color="text-blue-400"
            bg="bg-blue-500/10"
            route={METRIC_ROUTES.procurement}
          />
        )}

        {['warehouse_manager', 'super_admin'].includes(user?.role || '') && (
          <ClickableKPICard
            title="Avg Cycle Time"
            value={metrics.avgCycleTime}
            sub="-30s vs last week"
            icon={Clock}
            color="text-cyber-primary"
            bg="bg-cyber-primary/10"
            route={METRIC_ROUTES.wms}
          />
        )}

        {['warehouse_manager', 'picker', 'dispatcher', 'super_admin'].includes(user?.role || '') && (
          <ClickableKPICard
            title="Pick Accuracy"
            value={metrics.pickAccuracy}
            sub="0.2% Error Rate"
            icon={CheckCircle}
            color="text-purple-400"
            bg="bg-purple-500/10"
            route={METRIC_ROUTES.picks}
          />
        )}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Inbound vs Outbound Flow */}
        <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-cyber-primary" />
              Flow Velocity (Items)
            </h3>
            <div className="flex space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-cyber-primary rounded mr-2"></div>
                <span className="text-gray-400">Inbound</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-400">Outbound</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={0}>
              <BarChart data={INBOUND_OUTBOUND_DATA} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="inbound" fill="#00ff9d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Capacity Overview */}
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Storage Density</h3>
          <div className="space-y-6">
            {MOCK_ZONES.map((zone) => {
              const percent = (zone.occupied / zone.capacity) * 100;
              let color = 'bg-cyber-primary';
              if (percent > 90) color = 'bg-red-500';
              else if (percent > 75) color = 'bg-yellow-400';

              return (
                <div key={zone.id}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white font-medium">{zone.name}</span>
                    <span className="text-gray-400">{percent.toFixed(0)}% Full</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden border border-white/5">
                    <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 text-right">
                    {zone.occupied} / {zone.capacity} slots
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <h4 className="text-sm font-bold text-white mb-3">Fast Movers (Top 4)</h4>
            <div className="space-y-3">
              {FAST_MOVERS.length > 0 ? FAST_MOVERS.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 truncate pr-2">{item.name}</span>
                  <div className="flex items-center">
                    <span className="font-mono text-white mr-3">{item.moved}</span>
                    <span className={`text-[10px] ${item.trend.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {item.trend}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-500 italic">No sales data yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Operational Queue Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Stream - LIVE */}
        <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Operational Feed</h3>
            <button
              onClick={handleViewAllLogs}
              className="text-xs text-cyber-primary hover:underline"
            >
              View All Logs
            </button>
          </div>
          <div className="space-y-0">
            {movements.slice(0, 4).map((move, i) => (
              <div key={i} className="flex items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded transition-colors cursor-pointer group">
                <div className={`w-2 h-2 rounded-full mr-4 group-hover:scale-125 transition-transform ${move.type === 'IN' ? 'bg-green-400' : 'bg-blue-500'}`}></div>
                <div className="flex-1">
                  <p className="text-sm text-white">
                    <span className={`font-bold ${move.type === 'IN' ? 'text-green-400' : 'text-blue-400'}`}>{move.type}</span> {move.productName} ({move.quantity})
                  </p>
                  <p className="text-xs text-gray-500">{move.date} • by {move.performedBy}</p>
                </div>
                <ArrowRight size={14} className="text-gray-600 group-hover:text-white" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleQuickAction('cycle')}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-cyber-primary/20 border border-white/5 hover:border-cyber-primary/50 transition-all group text-left"
            >
              <div className="flex items-center">
                <Package className="text-gray-400 group-hover:text-cyber-primary mr-3" size={18} />
                <span className="text-sm text-white">Start Cycle Count</span>
              </div>
              <ArrowRight size={14} className="text-gray-600 group-hover:text-cyber-primary" />
            </button>
            <button
              onClick={() => handleQuickAction('receive')}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/50 transition-all group text-left"
            >
              <div className="flex items-center">
                <Truck className="text-gray-400 group-hover:text-blue-500 mr-3" size={18} />
                <span className="text-sm text-white">Receive PO</span>
              </div>
              <ArrowRight size={14} className="text-gray-600 group-hover:text-blue-500" />
            </button>
            <button
              onClick={() => handleQuickAction('staff')}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/50 transition-all group text-left"
            >
              <div className="flex items-center">
                <Activity className="text-gray-400 group-hover:text-purple-500 mr-3" size={18} />
                <span className="text-sm text-white">Staff Performance</span>
              </div>
              <ArrowRight size={14} className="text-gray-600 group-hover:text-purple-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
