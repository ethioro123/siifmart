import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ShoppingCart, CreditCard, Clock, Lock, LogOut, Printer,
  TrendingUp, DollarSign, Archive, RotateCcw, Package, Scan,
  Truck, Plus, Minus, AlertTriangle, CheckCircle, RefreshCcw, Search, List, Users, Loader2,
  Target, Trophy, Award, Zap, Star, Smartphone, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOL } from '../constants';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext'; // Use Live Data
import { formatCompactNumber, formatDateTime } from '../utils/formatting';
import Modal from '../components/Modal';
import { Product } from '../types';
import { productsService } from '../services/supabase.service';
import { LeaderboardWidget } from '../components/WorkerPointsDisplay';
import StoreBonusDisplay from '../components/StoreBonusDisplay';
import { useDateFilter, DateRangeOption } from '../hooks/useDateFilter'; // Import Hook
import DateRangeSelector from '../components/DateRangeSelector';
import SiteRoster from '../components/SiteRoster';
import RosterManager from '../components/RosterManager';

const KPICard = ({ title, value, sub, icon: Icon, color, onClick }: any) => (
  <div
    onClick={onClick}
    className={`bg-cyber-gray border border-white/5 rounded-2xl p-6 group transition-all ${onClick ? 'cursor-pointer hover:border-cyber-primary/50 hover:bg-white/5' : 'hover:border-white/10'
      }`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-mono text-gray-500 bg-black/20 px-2 py-1 rounded border border-white/5">TODAY</span>
    </div>
    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
    <p className="text-2xl font-bold text-white font-mono mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    {onClick && (
      <p className="text-[10px] text-cyber-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to view details →
      </p>
    )}
  </div>
);

const COLORS = ['#00ff9d', '#3b82f6', '#a855f7'];

export default function POSDashboard() {
  const { user, logout } = useStore();
  const {
    sales, addNotification, products, updateProduct, activeSite,
    transfers, sites, refreshData, shifts, startShift,
    workerPoints, employees, jobs, adjustStock, logSystemEvent,
    allProducts, addProduct, updateJob, updateTransfer, storePoints
  } = useData(); // Live Data

  // --- DATE FILTER ---
  const { dateRange, setDateRange, isWithinRange } = useDateFilter('This Quarter');

  // Filter Data
  const filteredSales = sales.filter(s => isWithinRange(s.date));

  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');

  // Find active shift for current user
  const activeShift = shifts.find(s => s.cashierId === user?.id && s.status === 'Open');

  // --- STATE ---
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
  const [isStockListOpen, setIsStockListOpen] = useState(false);
  const [receivingSummary, setReceivingSummary] = useState<any>(null);
  const [selectedTransferForReceiving, setSelectedTransferForReceiving] = useState<string | null>(null);
  const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [orderRefScanInput, setOrderRefScanInput] = useState('');
  const [transferScanBarcode, setTransferScanBarcode] = useState('');
  const [transferReceivingItems, setTransferReceivingItems] = useState<any[]>([]);

  // --- SHIFT CLOSING STATES ---
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [closingStep, setClosingStep] = useState(1);
  const [cashDenominations, setCashDenominations] = useState<Record<string, number>>({
    '200': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0
  });
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [isSubmittingShift, setIsSubmittingShift] = useState(false);

  // --- TRANSACATION PAGINATION ---
  const [txPage, setTxPage] = useState(1);
  const TX_PER_PAGE = 5;

  // --- POS Receiving Handlers ---
  const handleScanOrderRef = (ref: string) => {
    const transfer = transfers.find(t =>
      (t as any).orderRef?.toLowerCase() === ref.toLowerCase() ||
      t.id?.toLowerCase() === ref.toLowerCase()
    );
    if (transfer) {
      handleSelectTransferForReceiving(transfer.id);
      setOrderRefScanInput('');
      addNotification('success', `Found shipment ${ref}`);
    } else {
      addNotification('alert', `Shipment ${ref} not found`);
    }
  };

  const handleSelectTransferForReceiving = (transferId: string) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    setSelectedTransferForReceiving(transferId);

    const items = (transfer.items || []).map((item: any) => {
      const product = products.find(p => p.sku === item.sku || p.id === item.productId);
      return {
        productId: item.productId,
        sku: item.sku,
        name: product?.name || item.name || 'Unknown Product',
        expectedQty: item.quantity || (item as any).expectedQty || 0,
        receivedQty: 0, // Default to 0 for forced scanning
        condition: 'Good' as const,
        notes: ''
      };
    });

    setTransferReceivingItems(items);
  };

  const handleUpdateTransferItem = (index: number, field: string, value: any) => {
    setTransferReceivingItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleScanTransferItem = (barcode: string) => {
    const itemIndex = transferReceivingItems.findIndex(item =>
      item.sku.toLowerCase() === barcode.toLowerCase()
    );
    if (itemIndex !== -1) {
      handleUpdateTransferItem(itemIndex, 'receivedQty', transferReceivingItems[itemIndex].receivedQty + 1);
      setTransferScanBarcode('');
      addNotification('success', `Incremented count for ${transferReceivingItems[itemIndex].name}`);
    } else {
      addNotification('alert', `Item ${barcode} not in this shipment`);
    }
  };

  const handleConfirmTransferReceiving = async () => {
    if (!selectedTransferForReceiving || transferReceivingItems.length === 0) {
      addNotification('alert', 'No transfer selected');
      return;
    }

    setIsConfirmingReceive(true);

    try {
      const transferId = selectedTransferForReceiving;
      const transfer = transfers.find(t => t.id === transferId);
      if (!transfer) throw new Error('Transfer not found');

      // Check for discrepancies
      const discrepancies = transferReceivingItems.filter(
        item => item.receivedQty !== item.expectedQty || item.condition !== 'Good'
      );

      // Update each product with POS receiving timestamp
      for (const item of transferReceivingItems) {
        const product = products.find(p => p.sku === item.sku || p.id === item.productId);
        if (product) {
          await updateProduct({
            ...product,
            posReceivedAt: new Date().toISOString(),
            pos_received_at: new Date().toISOString(),
            posReceivedBy: user?.name || 'POS User',
            pos_received_by: user?.name || 'POS User',
            needsReview: item.condition === 'Damaged',
            receivingNotes: item.notes || undefined
          }, user?.name || 'POS User');
        }
      }

      // Show summary or notification
      if (discrepancies.length > 0) {
        const damagedCount = discrepancies.filter(d => d.condition === 'Damaged').length;
        const shortCount = discrepancies.filter(d => d.receivedQty < d.expectedQty).length;
        addNotification('alert', `Received with ${damagedCount} damaged and ${shortCount} short units.`);
      } else {
        addNotification('success', `✅ Successfully received all items from transfer.`);
      }

      // Record summary for display
      setReceivingSummary({
        orderRef: (transfer as any).orderRef || transfer.id,
        items: [...transferReceivingItems],
        timestamp: new Date().toISOString(),
        hasDiscrepancies: discrepancies.length > 0
      });

      // Clear selection but keep modal open to show summary
      setSelectedTransferForReceiving(null);
      setTransferReceivingItems([]);

      // Refresh data to update transfer status
      await refreshData();

    } catch (error) {
      console.error('Error confirming transfer receiving:', error);
      addNotification('alert', 'Failed to confirm receiving. Please try again.');
    } finally {
      setIsConfirmingReceive(false);
    }
  };

  const handleCloseReceivingModal = () => {
    setIsReceivingModalOpen(false);
    setReceivingSummary(null);
    setSelectedTransferForReceiving(null);
    setTransferReceivingItems([]);
  };

  // --- SHIFT LOGIC HELPERS ---
  const getShiftSummary = () => {
    if (!activeShift) return { cash: 0, card: 0, mobile: 0, total: 0, expected: 0 };
    const startTime = new Date(activeShift.startTime).getTime();
    const currentShiftSales = sales.filter(s => new Date(s.date).getTime() >= startTime);

    const cash = currentShiftSales.filter(s => s.method === 'Cash').reduce((sum, s) => sum + s.total, 0);
    const card = currentShiftSales.filter(s => s.method === 'Card').reduce((sum, s) => sum + s.total, 0);
    const mobile = currentShiftSales.filter(s => s.method === 'Mobile Money').reduce((sum, s) => sum + s.total, 0);

    return {
      cash,
      card,
      mobile,
      total: cash + card + mobile,
      expected: (activeShift.openingFloat || 0) + cash
    };
  };

  // --- CALCULATION LOGIC (Shift-Specific) ---
  const shiftSummary = getShiftSummary();
  const cashInDrawer = shiftSummary.expected;
  const personalSales = shiftSummary.total;
  const txCount = sales.filter(s =>
    new Date(s.date).getTime() >= (activeShift ? new Date(activeShift.startTime).getTime() : 0) &&
    s.cashierName === user?.name
  ).length;
  const returnCount = sales.filter(s =>
    new Date(s.date).getTime() >= (activeShift ? new Date(activeShift.startTime).getTime() : 0) &&
    s.status === 'Refunded'
  ).length;
  const totalRevenue = personalSales;

  // --- GAMIFICATION ---
  const myPoints = workerPoints.find(wp => wp.employeeId === user?.id || wp.employeeName === user?.name);
  const siteWorkerPoints = workerPoints.filter(wp => wp.siteId === activeSite?.id);

  // Chart Data Preparation (Using filteredSales)
  const methodStats = filteredSales.reduce((acc: any, curr) => {
    acc[curr.method] = (acc[curr.method] || 0) + 1;
    return acc;
  }, {});

  const paymentChartData = Object.keys(methodStats).map(key => ({
    name: key,
    value: Math.round((methodStats[key] / txCount) * 100) || 0
  }));

  // Hourly Mock derived from total (Simplification)
  const hourlyData = [
    { name: '09:00', amount: totalRevenue * 0.1 },
    { name: '10:00', amount: totalRevenue * 0.15 },
    { name: '11:00', amount: totalRevenue * 0.2 },
    { name: '12:00', amount: totalRevenue * 0.25 },
    { name: '13:00', amount: totalRevenue * 0.1 },
    { name: '14:00', amount: totalRevenue * 0.2 },
  ];

  // --- OPERATIONAL HANDLERS ---
  const handleLockScreen = () => setIsLocked(true);
  const handleReprint = () => addNotification('info', "Printing last receipt...");
  const handleEndShift = () => {
    if (!activeShift) {
      addNotification('alert', 'No active shift found to close.');
      return;
    }
    setClosingStep(1);
    setIsClosingShift(true);
  };

  const { closeShift } = useData();
  const handleSubmitShift = async () => {
    if (!activeShift) return;
    setIsSubmittingShift(true);

    try {
      const summary = getShiftSummary();
      const actualCash = Object.entries(cashDenominations).reduce(
        (sum, [value, count]) => sum + (parseInt(value) * count),
        0
      );

      const record: any = {
        ...activeShift,
        endTime: new Date().toISOString(),
        cashSales: summary.cash,
        cardSales: summary.card,
        mobileSales: summary.mobile,
        expectedCash: summary.expected,
        actualCash: actualCash,
        variance: actualCash - summary.expected,
        denominations: cashDenominations,
        discrepancyReason: discrepancyReason,
        status: 'Closed'
      };

      await closeShift(record);
      addNotification('success', 'Shift Closed & Reconciled Successfully');
      setIsClosingShift(false);
      logout();
      navigate('/');
    } catch (error) {
      console.error('Shift closure error:', error);
      addNotification('alert', 'Failed to close shift. Please try again.');
    } finally {
      setIsSubmittingShift(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="text-purple-400" />
            POS Command Center
          </h2>
          <div className="flex items-center gap-2 text-sm mt-1">
            {/* ... existing header info */}
            <span className="text-gray-400">Cashier:</span>
            <span className="text-white font-bold">{user?.name}</span>
            <span className="text-gray-600 mx-2">|</span>
            <span className="text-gray-400">Shift Status:</span>
            {activeShift ? (
              <span className="text-green-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                ACTIVE
              </span>
            ) : (
              <span className="text-gray-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                CLOSED
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* DATE FILTER DROPDOWN */}
          <DateRangeSelector
            value={dateRange}
            onChange={(val) => setDateRange(val)}
          />

          {activeShift && (
            <div className="bg-black/30 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3">
              <Clock size={16} className="text-cyber-primary" />
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Started At</p>
                <p className="text-sm font-mono text-white leading-none">
                  {formatDateTime(activeShift.startTime, { showTime: true })}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/pos')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeShift
              ? 'bg-cyber-primary text-black hover:bg-cyber-accent shadow-[0_0_20px_rgba(0,255,157,0.2)]'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
          >
            <ShoppingCart size={18} />
            {activeShift ? 'Resume Terminal' : 'Start New Shift'}
          </button>
        </div>
      </div>

      {/* Site Team Roster & Scheduling Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-cyber-gray border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent" />
          <SiteRoster layout="list" limit={6} highlightUser={user?.id} />
        </div>
        <div className="bg-cyber-gray border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent" />
          <RosterManager />
        </div>
      </div>

      {/* Motivation & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Performance Card */}
        <div className="lg:col-span-2">
          <StoreBonusDisplay
            storePoints={storePoints.find(sp => sp.siteId === activeSite?.id)}
            currentUserRole={user?.role}
            workerPoints={myPoints}
            leaderboard={siteWorkerPoints}
          />
        </div>

        {/* Top Store Performers */}
        <div className="lg:col-span-1">
          <LeaderboardWidget workers={siteWorkerPoints} currentUserId={user?.id} />
        </div>
      </div>

      {/* Shift Progress & Real-time Reconciliation */}
      <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap size={120} className="text-cyber-primary" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Active Shift Performance</p>
              <h2 className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
                {CURRENCY_SYMBOL} {getShiftSummary().total.toLocaleString()}
                <span className="text-sm font-medium text-gray-500">/ {CURRENCY_SYMBOL} 100,000 Target</span>
              </h2>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${activeShift ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {activeShift ? 'LIVE SESSION' : 'NO ACTIVE SHIFT'}
              </span>
            </div>
          </div>

          <div
            className={`h-full bg-gradient-to-r from-cyber-primary to-cyber-accent shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min((getShiftSummary().total / 100000) * 100, 100)}%` }}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <span className="text-xs text-gray-400">Cash: <span className="text-white font-mono">{CURRENCY_SYMBOL}{getShiftSummary().cash.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
              <span className="text-xs text-gray-400">Card: <span className="text-white font-mono">{CURRENCY_SYMBOL}{getShiftSummary().card.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
              <span className="text-xs text-gray-400">Mobile: <span className="text-white font-mono">{CURRENCY_SYMBOL}{getShiftSummary().mobile.toLocaleString()}</span></span>
            </div>
            <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>Elapsed: {activeShift ? `${Math.floor((new Date().getTime() - new Date(activeShift.startTime).getTime()) / (1000 * 60 * 60))}h ${Math.floor((new Date().getTime() - new Date(activeShift.startTime).getTime()) / (1000 * 60)) % 60}m` : '0h 0m'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Cash in Drawer"
          value={`${CURRENCY_SYMBOL} ${cashInDrawer.toLocaleString()} `}
          sub="No variance detected"
          icon={Archive}
          color="text-yellow-400"
          onClick={() => navigate('/finance')}
        />
        <KPICard
          title="Personal Sales"
          value={`${CURRENCY_SYMBOL} ${personalSales.toLocaleString()} `}
          sub="Current Session"
          icon={DollarSign}
          color="text-green-400"
          onClick={() => navigate('/sales-history')}
        />
        <KPICard
          title="Transactions"
          value={txCount}
          sub={`Avg value: ${txCount > 0 ? (totalRevenue / txCount).toFixed(0) : 0} `}
          icon={TrendingUp}
          color="text-blue-400"
          onClick={() => navigate('/sales-history')}
        />
        <KPICard
          title="Returns Processed"
          value={returnCount}
          sub="Requires Mgr Approval"
          icon={RotateCcw}
          color="text-red-400"
          onClick={() => navigate('/warehouse-operations?tab=RETURNS')}
        />
      </div>

      {/* Charts & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Performance */}
        <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-6">Hourly Performance (Est)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={0}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="amount" fill="#a855f7" radius={[4, 4, 0, 0]} name="Sales Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shift Actions Panel */}
        <div className="space-y-6">
          {/* Payment Split */}
          <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6 h-[200px]">
            <h3 className="font-bold text-white mb-2 text-sm">Payment Methods</h3>
            <div className="flex items-center">
              <div className="w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 pl-4">
                {paymentChartData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${i % COLORS.length === 0 ? 'bg-[#00ff9d]' : i % COLORS.length === 1 ? 'bg-[#3b82f6]' : 'bg-[#a855f7]'}`} />
                      {item.name}
                    </span>
                    <span className="text-white font-mono">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 text-sm">Shift Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsReceivingModalOpen(true)}
                className="p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Package size={20} className="text-blue-400" />
                <span className="text-xs text-blue-300">Receive Items</span>
              </button>
              <button
                onClick={() => setIsStockListOpen(true)}
                className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <List size={20} className="text-purple-400" />
                <span className="text-xs text-purple-300">Stock List</span>
              </button>
              <button
                onClick={handleLockScreen}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Lock size={20} className="text-yellow-400" />
                <span className="text-xs text-gray-300">Lock Screen</span>
              </button>
              <button
                onClick={() => navigate('/employees')}
                className="p-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 flex flex-col items-center justify-center gap-2 transition-colors"
                aria-label="Manage Employees"
              >
                <Users size={20} className="text-pink-400" />
                <span className="text-xs text-pink-300">Employees</span>
              </button>
              <button
                onClick={handleReprint}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Printer size={20} className="text-blue-400" />
                <span className="text-xs text-gray-300">Reprint Last</span>
              </button>
              <button
                onClick={handleEndShift}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col items-center justify-center gap-2 transition-colors col-span-2"
              >
                <LogOut size={20} className="text-red-400" />
                <span className="text-xs text-gray-300">End Shift & Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock List Modal */}
      <Modal isOpen={isStockListOpen} onClose={() => setIsStockListOpen(false)} title={`Stock Lookup - ${activeSite?.name || 'Current Location'} `} size="xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/10">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              className="bg-transparent border-none outline-none text-white w-full text-sm"
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto custom-scrollbar border border-white/5 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-white/5 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="p-3 text-xs text-gray-400 uppercase font-bold">Product</th>
                  <th className="p-3 text-xs text-gray-400 uppercase font-bold">Category</th>
                  <th className="p-3 text-xs text-gray-400 uppercase font-bold text-right">Price</th>
                  <th className="p-3 text-xs text-gray-400 uppercase font-bold text-center">Stock</th>
                  <th className="p-3 text-xs text-gray-400 uppercase font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products
                  .filter(p => {
                    // Filter by site
                    const matchesSite = p.siteId === activeSite?.id || p.site_id === activeSite?.id;
                    // Filter by search
                    const matchesSearch = p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(stockSearch.toLowerCase());
                    return matchesSite && matchesSearch;
                  })
                  .map(product => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/5 overflow-hidden flex items-center justify-center">
                            {product.image && !product.image.includes('placeholder.com') ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                }}
                              />
                            ) : (
                              <Package size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{product.name}</p>
                            <p className="text-[10px] text-gray-500">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-gray-400">{product.category}</td>
                      <td className="p-3 text-sm font-mono text-white text-right">{CURRENCY_SYMBOL} {product.price.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${product.status === 'active' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'
                          }`}>
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                {products.filter(p => (p.siteId === activeSite?.id || p.site_id === activeSite?.id)).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No products found for this location.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Advanced Shift Closure Modal */}
      <Modal
        isOpen={isClosingShift}
        onClose={() => !isSubmittingShift && setIsClosingShift(false)}
        title="Advanced Shift Reconciliation"
        size="lg"
      >
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between px-8 py-4 bg-black/20 rounded-2xl border border-white/5">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${closingStep === step
                  ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.4)] scale-110'
                  : closingStep > step ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'
                  }`}>
                  {closingStep > step ? <CheckCircle size={14} /> : step}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${closingStep === step ? 'text-white' : 'text-gray-600'
                  }`}>
                  {step === 1 ? 'Summary' : step === 2 ? 'Cash Tray' : 'Verify'}
                </span>
                {step < 3 && <div className="w-12 h-[1px] bg-white/5 mx-2" />}
              </div>
            ))}
          </div>

          {/* Step 1: Summary */}
          {closingStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Sales</p>
                  <p className="text-xl font-mono text-white">{CURRENCY_SYMBOL} {getShiftSummary().total.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Expected Cash</p>
                  <p className="text-xl font-mono text-cyber-primary">{CURRENCY_SYMBOL} {getShiftSummary().expected.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-1">Revenue Breakdown</p>
                <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                  {[
                    { label: 'Cash Sales', value: getShiftSummary().cash, icon: DollarSign, color: 'text-green-400' },
                    { label: 'Card sales', value: getShiftSummary().card, icon: CreditCard, color: 'text-blue-400' },
                    { label: 'Mobile Money', value: getShiftSummary().mobile, icon: Smartphone, color: 'text-purple-400' },
                    { label: 'Opening Float', value: activeShift?.openingFloat || 0, icon: Archive, color: 'text-yellow-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={item.color} />
                        <span className="text-sm text-gray-300 font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm font-mono text-white">{CURRENCY_SYMBOL} {item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setClosingStep(2)}
                className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Start Cash Count <ArrowLeft className="rotate-180" size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Cash Tray */}
          {closingStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="text-blue-400 mt-0.5" size={18} />
                <p className="text-xs text-blue-200/70 leading-relaxed">
                  Enter the exact quantity of each bill in your drawer. The system matches these against your digital records.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(cashDenominations).sort((a, b) => parseInt(b) - parseInt(a)).map((denom) => (
                  <div key={denom} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 focus-within:border-cyber-primary/50 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">{denom} Bill</span>
                      <span className="text-xs font-mono text-cyber-primary">={CURRENCY_SYMBOL} {(parseInt(denom) * cashDenominations[denom]).toLocaleString()}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center text-white font-mono outline-none focus:border-cyber-primary transition-all"
                      value={cashDenominations[denom] || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCashDenominations(prev => ({ ...prev, [denom]: val }));
                      }}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Counted Cash</span>
                <span className="text-2xl font-mono text-white">
                  {CURRENCY_SYMBOL} {Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0).toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setClosingStep(1)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setClosingStep(3)}
                  className="flex-[2] py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl shadow-lg transition-all"
                >
                  Verify Totals
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verify & Submit */}
          {closingStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {(() => {
                const summary = getShiftSummary();
                const actual = Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0);
                const variance = actual - summary.expected;
                const isVariance = Math.abs(variance) > 0;

                return (
                  <>
                    <div className={`p-6 rounded-2xl border ${!isVariance
                      ? 'bg-green-500/10 border-green-500/20'
                      : variance > 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
                      } text-center`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${!isVariance ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {Math.abs(variance) < 0.01 ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {!isVariance ? 'Reconciliation Perfect' : variance > 0 ? 'Cash Surplus' : 'Cash Shortage'}
                      </h3>
                      <p className={`text-2xl font-mono font-bold ${!isVariance ? 'text-green-400' : 'text-red-400'}`}>
                        {variance > 0 ? '+' : ''}{CURRENCY_SYMBOL} {variance.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-1">Reason for Variance (Required if any)</label>
                        <textarea
                          placeholder="Please document the cause of this variance..."
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-cyber-primary transition-all min-h-[100px]"
                          value={discrepancyReason}
                          onChange={(e) => setDiscrepancyReason(e.target.value)}
                        />
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Expected (Float + Cash Sales)</span>
                          <span className="text-white font-mono">{CURRENCY_SYMBOL} {summary.expected.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Actual Counted</span>
                          <span className="text-white font-mono">{CURRENCY_SYMBOL} {actual.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setClosingStep(2)}
                        disabled={isSubmittingShift}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        Recount
                      </button>
                      <button
                        onClick={handleSubmitShift}
                        disabled={isSubmittingShift || (isVariance && !discrepancyReason)}
                        className="flex-[2] py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                      >
                        {isSubmittingShift ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        Finalize & Close Shift
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </Modal>

      {/* Recent Transactions List */}
      <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-white">Recent Transactions</h3>
          <button
            onClick={() => navigate('/sales')}
            className="text-xs text-cyber-primary hover:underline"
          >
            View All History
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/20">
              <tr>
                <th className="p-4 text-xs text-gray-500 uppercase">Receipt ID</th>
                <th className="p-4 text-xs text-gray-500 uppercase">Time</th>
                <th className="p-4 text-xs text-gray-500 uppercase">Method</th>
                <th className="p-4 text-xs text-gray-500 uppercase text-right">Amount</th>
                <th className="p-4 text-xs text-gray-500 uppercase text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(() => {
                const startIndex = (txPage - 1) * TX_PER_PAGE;
                const paginatedTx = sales.slice(startIndex, startIndex + TX_PER_PAGE);

                return paginatedTx.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm font-mono text-white">{sale.receiptNumber || sale.id}</td>
                    <td className="p-4 text-xs text-gray-400">{sale.date.split(' ')[1] || 'N/A'}</td>
                    <td className="p-4 text-xs text-gray-400">{sale.method}</td>
                    <td className="p-4 text-sm font-mono text-white text-right">{CURRENCY_SYMBOL} {sale.total.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${sale.status === 'Completed' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                        }`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            Page {txPage} of {Math.max(1, Math.ceil(sales.length / TX_PER_PAGE))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTxPage(p => Math.max(1, p - 1))}
              disabled={txPage === 1}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold rounded border border-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setTxPage(p => Math.min(Math.ceil(sales.length / TX_PER_PAGE), p + 1))}
              disabled={txPage >= Math.ceil(sales.length / TX_PER_PAGE)}
              className="px-3 py-1 bg-cyber-primary hover:bg-cyber-accent text-black text-[10px] font-bold rounded border border-cyber-primary/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Receiving Modal - Enhanced with Transfers + Manual Mode */}
      <Modal isOpen={isReceivingModalOpen} onClose={handleCloseReceivingModal} title="Receive Inventory" size="xl">
        <div className="space-y-4 p-1">
          {/* Internal Tab State for Modal */}
          {(() => {
            const [activeTab, setActiveTab2] = useState<'pending' | 'history'>('pending');

            // Allow external reset when modal closes
            useEffect(() => {
              if (!isReceivingModalOpen) setActiveTab2('pending');
            }, [isReceivingModalOpen]);

            return (
              <>
                {/* Tabs */}
                {!receivingSummary && !selectedTransferForReceiving && (
                  <div className="flex p-1 bg-black/40 rounded-xl mb-4">
                    <button
                      onClick={() => setActiveTab2('pending')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'pending' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      Pending ({activeSite?.name})
                    </button>
                    <button
                      onClick={() => setActiveTab2('history')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      History
                    </button>
                  </div>
                )}

                {/* Receiving Summary View */}
                {receivingSummary && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={40} className="text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {(receivingSummary as any).isHistory ? 'Shipment Details' : 'Receiving Completed!'}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {(receivingSummary as any).isHistory
                          ? `Viewing details for shipment ${receivingSummary.orderRef}`
                          : `Shipment ${receivingSummary.orderRef} has been added to inventory.`
                        }
                      </p>
                    </div>

                    <div className="border border-white/10 rounded-xl overflow-hidden">
                      <div className="bg-black/20 p-3 flex items-center justify-between text-xs font-bold text-gray-400 uppercase border-b border-white/10">
                        <span>Received Details</span>
                        <span>{formatDateTime(receivingSummary.timestamp, { showTime: true })}</span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {receivingSummary.items.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${item.receivedQty < item.expectedQty ? 'text-red-400' : 'text-green-400'}`}>
                                  Received {item.receivedQty} out of {item.expectedQty}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-1 border ${item.condition === 'Good' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                item.condition === 'Damaged' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                } `}>
                                {item.condition}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {receivingSummary.hasDiscrepancies && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="text-yellow-400 flex-shrink-0" size={20} />
                        <div>
                          <p className="text-sm font-bold text-yellow-400">Discrepancies Reported</p>
                          <p className="text-xs text-yellow-200/70">The driver and warehouse have been notified of the missing/damaged items.</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleCloseReceivingModal}
                      className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      Close Summary
                    </button>
                  </div>
                )}

                {/* Pending Transfers List / Form */}
                {!receivingSummary && (
                  <>
                    {/* Active Transfer View (Form) */}
                    {selectedTransferForReceiving ? (
                      /* Existing Form Logic (Hidden when tab switching, shown when selected) */
                      null
                    ) : activeTab === 'history' ? (

                      /* HISTORY VIEW */
                      <div className="space-y-4">
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <Clock className="text-purple-400" size={20} />
                            <h3 className="text-white font-bold">Recently Completed</h3>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Showing last 10 shipments received at <span className="text-white font-bold">{activeSite?.name}</span>.
                          </p>
                        </div>

                        {(() => {
                          // REUSE logic to combine, but filter for COMPLETED
                          const wmsTransferJobs = jobs
                            .filter(j => j.type === 'TRANSFER')
                            .map(j => ({
                              id: j.id,
                              sourceSiteId: (j as any).sourceSiteId || (j as any).source_site_id || j.siteId,
                              destSiteId: (j as any).destSiteId || (j as any).dest_site_id,
                              status: j.status,
                              transferStatus: (j as any).transferStatus || j.status,
                              items: j.lineItems || (j as any).line_items || [],
                              orderRef: j.orderRef,
                              createdAt: j.createdAt,
                              assignedTo: j.assignedTo,
                              receivedAt: (j as any).receivedAt || (j as any).updatedAt
                            }));

                          const allTransferSources = [
                            ...(transfers || []),
                            ...wmsTransferJobs.filter(wj =>
                              !(transfers || []).some(t => t.id === wj.id)
                            )
                          ];

                          const historyItems = allTransferSources.filter(t => {
                            if (String(t.destSiteId) !== String(activeSite?.id)) return false;
                            const status = ((t as any).transferStatus || t.status || '').toLowerCase();
                            return status === 'received' || status === 'completed';
                          }).sort((a, b) => {
                            const dateA = new Date((a as any).receivedAt || (a as any).updatedAt || 0).getTime();
                            const dateB = new Date((b as any).receivedAt || (b as any).updatedAt || 0).getTime();
                            return dateB - dateA;
                          }).slice(0, 10);

                          if (historyItems.length === 0) {
                            return (
                              <div className="text-center py-12 text-gray-500">
                                <Clock size={40} className="mx-auto mb-4 opacity-50" />
                                <p>No receiving history found.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              {historyItems.map(item => (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    setReceivingSummary({
                                      orderRef: (item as any).orderRef || item.id,
                                      items: ((item as any).items || []).map((i: any) => {
                                        const expected = i.expectedQty || i.quantity || 0;
                                        return {
                                          sku: i.sku || 'Unknown',
                                          name: i.name || 'Unknown Product',
                                          expectedQty: expected,
                                          // Fallback to expected if received is missing (for historically completed items not saving specific output)
                                          receivedQty: i.receivedQty !== undefined ? i.receivedQty : expected,
                                          condition: i.condition || 'Good'
                                        };
                                      }),
                                      timestamp: (item as any).receivedAt || (item as any).updatedAt || new Date().toISOString(),
                                      hasDiscrepancies: false,
                                      isHistory: true
                                    });
                                  }}
                                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                  <div>
                                    <p className="font-mono font-bold text-white">{(item as any).orderRef || item.id.slice(0, 8).toUpperCase()}</p>
                                    <p className="text-xs text-gray-400">
                                      {(item as any).items?.length || 0} items • {formatDateTime((item as any).receivedAt || (item as any).updatedAt)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[10px] font-bold uppercase">
                                      RECEIVED
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                    ) : (
                      /* PENDING VIEW (Default) */
                      <>
                        {/* Order Ref Scanner */}
                        <div className="bg-cyber-primary/5 border border-cyber-primary/30 rounded-xl p-4 mb-2">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-cyber-primary uppercase flex items-center gap-2">
                              <Scan size={14} />
                              Quick Scan Handover
                            </label>
                            <span className="text-[10px] text-gray-500 italic">Scan Packing Label/Order Ref to start</span>
                          </div>
                          <div className="relative">
                            <input
                              autoFocus
                              type="text"
                              value={orderRefScanInput}
                              onChange={(e) => setOrderRefScanInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleScanOrderRef(orderRefScanInput);
                                }
                              }}
                              placeholder="Scan Order Ref (e.g. ORD-123456)..."
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:border-cyber-primary outline-none transition-all placeholder:text-gray-600"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                              <span className="text-[10px] text-cyber-primary font-bold uppercase tracking-widest">Awaiting Scan</span>
                            </div>
                          </div>
                        </div>



                        {(() => {
                          // Combine transfers from both sources:
                          // 1. Traditional transfers array
                          // 2. WMS jobs with type 'TRANSFER' (converted to transfer-like objects)
                          const wmsTransferJobs = jobs
                            .filter(j => j.type === 'TRANSFER')
                            .map(j => ({
                              id: j.id,
                              sourceSiteId: (j as any).sourceSiteId || (j as any).source_site_id || j.siteId,
                              destSiteId: (j as any).destSiteId || (j as any).dest_site_id,
                              status: j.status,
                              transferStatus: (j as any).transferStatus || j.status,
                              items: j.lineItems || (j as any).line_items || [],
                              orderRef: j.orderRef,
                              createdAt: j.createdAt,
                              assignedTo: j.assignedTo,
                              deliveryMethod: (j as any).deliveryMethod
                            }));

                          // Merge both sources, avoiding duplicates
                          const allTransferSources = [
                            ...(transfers || []),
                            ...wmsTransferJobs.filter(wj =>
                              !(transfers || []).some(t => t.id === wj.id)
                            )
                          ];

                          // Filter transfers destined for this site that are in-transit or delivered
                          const pendingTransfers = allTransferSources.filter(t => {
                            // Check destination matches current site (robust ID check)
                            if (String(t.destSiteId) !== String(activeSite?.id)) return false;

                            // Check status-catch-all for various WMS/Transfer statuses
                            // We want to show anything that is NOT 'Completed' or 'Cancelled' essentially
                            const status = ((t as any).transferStatus || t.status || '').toLowerCase();

                            // Statuses that should definitely appear
                            const validStatuses = [
                              'requested', 'pending', 'approved',
                              'packed', 'ready', 'staging',
                              'shipped', 'in-transit', 'dispatched',
                              'delivered', 'arrived', 'picking', 'packing'
                            ];

                            const isValidStatus = validStatuses.includes(status);

                            if (!isValidStatus) return false;

                            // Check if any items haven't been POS-received yet
                            // Don't require product to exist in local products array
                            const items = Array.isArray(t.items) ? t.items : [];
                            const hasUnreceivedItems = items.some((item: any) => {
                              const product = products.find(p => p.sku === item.sku || p.id === item.productId);
                              // If product exists, check if it hasn't been received
                              // If product doesn't exist yet, it still needs receiving
                              return !product || !(product.posReceivedAt || product.pos_received_at);
                            });

                            return hasUnreceivedItems || items.length === 0; // Also show if no items (newly created)
                          }).sort((a, b) => {
                            // Prioritize "Ready to Receive" items:
                            // 1. External Shipped
                            // 2. Delivered
                            // 3. Others (In-Transit)

                            const aStatus = ((a as any).transferStatus || a.status || '').toLowerCase();
                            const bStatus = ((b as any).transferStatus || b.status || '').toLowerCase();

                            const getPriority = (t: any, status: string) => {
                              const isExt = (t as any).deliveryMethod === 'External' ||
                                // Fallback check for linked dispatch
                                wmsTransferJobs.find(j => j.id === t.id && (j as any).deliveryMethod === 'External');

                              if (isExt && (status === 'shipped' || status === 'delivered')) return 3; // Highest
                              if (status === 'delivered' || status === 'arrived') return 2;
                              if (status === 'in-transit' || status === 'dispatched' || status === 'shipped') return 1;
                              return 0;
                            };

                            const pA = getPriority(a, aStatus);
                            const pB = getPriority(b, bStatus);

                            if (pA !== pB) return pB - pA; // Higher priority first

                            // Then by date
                            return new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime();
                          });

                          if (pendingTransfers.length === 0) {

                            // Count transfers for debugging
                            const transfersArrayCount = transfers?.length || 0;
                            const wmsTransferJobsCount = wmsTransferJobs.length;
                            // Use loose helpful filtering for debug stats
                            const siteTransfersFromArr = (transfers || []).filter(t => String(t.destSiteId) === String(activeSite?.id));
                            const siteTransfersFromJobs = wmsTransferJobs.filter(t => String(t.destSiteId) === String(activeSite?.id));

                            return (
                              <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                                <Package size={48} className="text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold">No pending transfers found</p>
                                <p className="text-gray-600 text-sm mt-2">All incoming shipments have been received</p>

                                {/* CEO Debug Info */}
                                {user?.role === 'super_admin' && (
                                  <div className="mt-4 p-3 bg-black/40 rounded-lg text-xs text-left font-mono space-y-1">
                                    <p className="text-gray-500 font-bold border-b border-gray-700 pb-1 mb-1">DEBUG INFO:</p>
                                    <p className="text-gray-400">Current Site ID: <span className="text-white">{activeSite?.id}</span></p>
                                    <p className="text-gray-400">Transfers Array: <span className="text-white">{transfersArrayCount}</span></p>
                                    <p className="text-gray-400">WMS Jobs (TRANSFER): <span className="text-cyan-400">{wmsTransferJobsCount}</span></p>
                                    <p className="text-gray-400">For This Site (Arr): <span className="text-white">{siteTransfersFromArr.length}</span></p>
                                    <p className="text-gray-400">For This Site (Jobs): <span className="text-cyan-400">{siteTransfersFromJobs.length}</span></p>


                                    {(siteTransfersFromArr.length > 0 || siteTransfersFromJobs.length > 0) && (
                                      <div className="mt-2 pt-2 border-t border-gray-700">
                                        <p className="text-gray-500 mb-1">Found statuses:</p>
                                        {Array.from(new Set([
                                          ...siteTransfersFromArr.map(t => (t as any).transferStatus || t.status),
                                          ...siteTransfersFromJobs.map(t => t.transferStatus || t.status)
                                        ])).map((s: any) => (
                                          <span key={String(s)} className="inline-block px-1 bg-white/10 rounded mr-1 mb-1">{String(s)}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }


                          return (
                            <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                              {pendingTransfers.map(transfer => {
                                const sourceSite = sites?.find(s => s.id === transfer.sourceSiteId);
                                const items = Array.isArray(transfer.items) ? transfer.items : [];
                                const itemCount = items.length;
                                const totalQty = items.reduce((sum: number, i: any) => sum + (i.quantity || i.expectedQty || 0), 0);

                                // Find dispatch job for this transfer to get driver info
                                const dispatchJob = jobs.find(j =>
                                  j.type === 'DISPATCH' &&
                                  (j.orderRef === transfer.id || j.id?.includes(transfer.id?.slice(-6) || '')) ||
                                  j.orderRef === (transfer as any).orderRef
                                );
                                const driver = dispatchJob?.assignedTo
                                  ? employees.find(e => e.id === dispatchJob.assignedTo)
                                  : null;

                                // Determine transfer type
                                const getTransferType = () => {
                                  const status = ((transfer as any).transferStatus || transfer.status || '').toLowerCase();
                                  const isStockArrival = status === 'delivered' || status === 'arrived';
                                  const ref = (transfer as any).orderRef || transfer.id || '';

                                  // If stock has arrived, it's no longer an "Alert" situation - downgrade to neutral
                                  if (isStockArrival && (ref.toLowerCase().includes('low') || (transfer as any).triggerType === 'LOW_STOCK')) {
                                    return { label: 'TRANSFER', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
                                  }

                                  if (ref.toLowerCase().includes('auto') || (transfer as any).autoGenerated) {
                                    return { label: 'AUTO-REPLENISH', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
                                  }
                                  if (ref.toLowerCase().includes('low') || (transfer as any).triggerType === 'LOW_STOCK') {
                                    return { label: 'LOW STOCK ALERT', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
                                  }
                                  return { label: 'MANUAL ORDER', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
                                };
                                const transferType = getTransferType();

                                // Get status color
                                const getStatusStyle = () => {
                                  const status = ((transfer as any).transferStatus || transfer.status || '').toLowerCase();
                                  if (status === 'delivered' || status === 'arrived' || status === 'shipped') {
                                    return 'bg-green-500/20 text-green-400 border-green-500/30';
                                  }
                                  if (status === 'in-transit' || status === 'dispatched') {
                                    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                                  }
                                  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                                };

                                return (
                                  <div
                                    key={transfer.id}
                                    className="bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-2xl overflow-hidden hover:border-cyber-primary/50 transition-all group"
                                  >
                                    {/* Header */}
                                    <div className="p-4 bg-black/20 border-b border-white/5">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-blue-500/20 rounded-xl">
                                            <Package size={20} className="text-blue-400" />
                                          </div>
                                          <div>
                                            <p className="font-mono font-bold text-white text-sm">
                                              {(transfer as any).orderRef || `TRF - ${transfer.id?.slice(-6).toUpperCase()} `}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                              Created: {(transfer as any).createdAt || (transfer as any).created_at ? formatDateTime((transfer as any).createdAt || (transfer as any).created_at) : 'Unknown'}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${transferType.color}`}>
                                            {transferType.label}
                                          </span>
                                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${getStatusStyle()}`}>
                                            {/* Mask 'Delivered' as 'Shipped' for External providers */}
                                            {((transfer as any).deliveryMethod === 'External' || (dispatchJob && (dispatchJob as any).deliveryMethod === 'External'))
                                              ? 'Shipped'
                                              : ((transfer as any).transferStatus || transfer.status)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 space-y-3">
                                      {/* Source */}
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                          <Archive size={14} className="text-green-400" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-xs text-gray-500 uppercase font-bold">From</p>
                                          <p className="text-sm font-bold text-white">{sourceSite?.name || 'Unknown Warehouse'}</p>
                                          {sourceSite?.address && <p className="text-xs text-gray-500 truncate">{sourceSite.address}</p>}
                                        </div>
                                      </div>

                                      {/* Driver Info */}
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${driver ? 'bg-cyber-primary/10' : 'bg-gray-500/10'}`}>
                                          <Truck size={14} className={driver ? 'text-cyber-primary' : 'text-gray-500'} />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-xs text-gray-500 uppercase font-bold">Driver</p>
                                          {driver ? (
                                            <div className="flex items-center gap-2">
                                              <p className="text-sm font-bold text-white">{driver.name}</p>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${driver.driverType === 'internal' ? 'bg-green-500/20 text-green-400' :
                                                driver.driverType === 'subcontracted' ? 'bg-blue-500/20 text-blue-400' :
                                                  'bg-purple-500/20 text-purple-400'
                                                }`}>
                                                {driver.driverType === 'internal' ? '🏢 Staff' :
                                                  driver.driverType === 'subcontracted' ? '📋 Contract' :
                                                    driver.driverType ? '🚗 Owner' : '🏢 Staff'}
                                              </span>
                                              {driver.vehicleType && <span className="text-xs text-gray-500">• {driver.vehicleType}</span>}
                                            </div>
                                          ) : ((transfer as any).deliveryMethod === 'External' || (dispatchJob && (dispatchJob as any).deliveryMethod === 'External')) ? (
                                            <div className="flex items-center gap-2">
                                              <p className="text-sm font-bold text-cyan-400">EXTERNAL PROVIDER</p>
                                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-400 uppercase">
                                                Shipped
                                              </span>
                                            </div>
                                          ) : (
                                            <p className="text-sm text-yellow-400 font-medium">⏳ Awaiting Driver Assignment</p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Items Summary */}
                                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-4 text-sm">
                                          <span className="text-gray-400">
                                            <span className="text-white font-bold">{itemCount}</span> products
                                          </span>
                                          <span className="text-gray-400">
                                            <span className="text-white font-bold">{totalQty}</span> units
                                          </span>
                                        </div>
                                        {/* Driver-type based receiving validation */}
                                        {(() => {
                                          const status = ((transfer as any).transferStatus || transfer.status || '').toLowerCase();
                                          const isInternalDriver = driver && (!driver.driverType || driver.driverType === 'internal');

                                          const isDispatchCompleted = dispatchJob?.status === 'Completed';

                                          const isDelivered = status === 'delivered' || status === 'arrived' || isDispatchCompleted;
                                          const isDispatched = status === 'dispatched' || status === 'shipped' || status === 'in-transit';

                                          // Internal driver: MUST be Delivered or Dispatch Job completed
                                          // External/No driver: Can receive as long as it's left the warehouse
                                          const canReceive = isInternalDriver ? isDelivered : (isDelivered || isDispatched);

                                          return canReceive ? (
                                            <button
                                              onClick={() => handleSelectTransferForReceiving(transfer.id)}
                                              className="px-4 py-2 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-all flex items-center gap-2 group-hover:shadow-lg group-hover:shadow-cyber-primary/20"
                                            >
                                              <CheckCircle size={16} />
                                              Receive Now
                                            </button>
                                          ) : (
                                            <div className="flex flex-col items-end gap-1">
                                              <span className="text-xs text-orange-400 flex items-center gap-1">
                                                <Clock size={12} />
                                                {isInternalDriver ? 'Awaiting Driver Delivery' : 'Preparing Shipment'}
                                              </span>
                                              <span className="text-[10px] text-gray-500">
                                                {isInternalDriver ? 'Internal driver must complete' : 'Wait for dispatch'}
                                              </span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {/* Selected Transfer - Receiving Form */}
                    {selectedTransferForReceiving && (() => {
                      // Get full transfer info for the enhanced header (search both sources)
                      const selectedTransfer = transfers?.find(t => t.id === selectedTransferForReceiving);
                      const selectedJob = jobs?.find(j => j.id === selectedTransferForReceiving && j.type === 'TRANSFER');
                      const source = selectedTransfer || selectedJob;

                      const sourceSiteId = source?.sourceSiteId || (source as any)?.source_site_id;
                      const sourceSite = sourceSiteId ? sites?.find(s => s.id === sourceSiteId) : null;

                      // Find dispatch job for driver info (robust search)
                      const transferIdStr = selectedTransferForReceiving;
                      const dispatchJob = jobs?.find(j =>
                        j.type === 'DISPATCH' &&
                        (j.orderRef === transferIdStr ||
                          j.orderRef === (source as any)?.orderRef ||
                          j.id?.includes(transferIdStr.slice(-6)) ||
                          (source as any)?.id?.includes(j.orderRef?.slice(-6)))
                      );
                      const driver = dispatchJob?.assignedTo ? employees?.find(e => e.id === dispatchJob.assignedTo) : null;

                      const status = source ? ((source as any).transferStatus || source.status || '').toLowerCase() : '';
                      const isVerifiedByDriver = status === 'delivered' || status === 'arrived' || dispatchJob?.status === 'Completed';

                      // Determine transfer type
                      const getTransferType = () => {
                        if (!selectedTransfer) return { label: 'TRANSFER', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
                        const ref = (selectedTransfer as any).orderRef || selectedTransfer.id || '';
                        const isStockArrival = status === 'delivered' || status === 'arrived' || dispatchJob?.status === 'Completed';

                        // If stock has arrived, it's no longer an "Alert" situation
                        if (isStockArrival && (ref.toLowerCase().includes('low') || (selectedTransfer as any).triggerType === 'LOW_STOCK')) {
                          return { label: 'TRANSFER', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
                        }

                        if (ref.toLowerCase().includes('auto') || (selectedTransfer as any).autoGenerated) {
                          return { label: 'AUTO-REPLENISH', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
                        }
                        if (ref.toLowerCase().includes('low') || (selectedTransfer as any).triggerType === 'LOW_STOCK') {
                          return { label: 'LOW STOCK ALERT', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
                        }
                        return { label: 'MANUAL ORDER', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
                      };
                      const transferType = getTransferType();

                      return (
                        <>
                          {/* Comprehensive Shipment Header */}
                          <div className="bg-gradient-to-br from-green-900/30 to-black border border-green-500/30 rounded-2xl overflow-hidden">
                            {/* Top Bar */}
                            <div className="p-4 bg-black/30 border-b border-green-500/20 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-xl">
                                  <CheckCircle size={24} className="text-green-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono font-bold text-white">
                                      {(source as any)?.orderRef || `TRF - ${selectedTransferForReceiving.slice(-6).toUpperCase()} `}
                                    </p>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${transferType.color}`}>
                                      {transferType.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400">
                                    {transferReceivingItems.length} items to verify • Created {
                                      (source as any)?.createdAt || (source as any)?.created_at
                                        ? formatDateTime((source as any)?.createdAt || (source as any)?.created_at)
                                        : 'Unknown'
                                    }
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedTransferForReceiving(null);
                                  setTransferReceivingItems([]);
                                }}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-bold rounded-lg transition-colors border border-white/10"
                              >
                                ← Back to List
                              </button>
                            </div>

                            {/* Details Grid */}
                            <div className="p-4 grid grid-cols-2 gap-4">
                              {/* Source */}
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
                                  <Archive size={14} className="text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Source Warehouse</p>
                                  <p className="text-sm font-bold text-white">{sourceSite?.name || 'Central Warehouse'}</p>
                                  {sourceSite?.address && <p className="text-xs text-gray-500">{sourceSite.address}</p>}
                                </div>
                              </div>

                              {/* Driver */}
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${driver ? 'bg-cyber-primary/10' : 'bg-gray-500/10'}`}>
                                  <Truck size={14} className={driver ? 'text-cyber-primary' : 'text-gray-500'} />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Delivery Driver</p>
                                  {driver ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-white">{driver.name}</p>
                                        <span className={`text - [10px] px-1.5 py-0.5 rounded font-bold ${driver.driverType === 'internal' ? 'bg-green-500/20 text-green-400' :
                                          driver.driverType === 'subcontracted' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-purple-500/20 text-purple-400'
                                          }`}>
                                          {driver.driverType === 'internal' ? 'Staff' :
                                            driver.driverType === 'subcontracted' ? 'Contract' :
                                              driver.driverType ? 'Owner' : 'Staff'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {driver.vehicleType && <span>🚐 {driver.vehicleType}</span>}
                                        {driver.phone && <span>📞 {driver.phone}</span>}
                                      </div>
                                    </>
                                  ) : ((source as any).deliveryMethod === 'External' || (dispatchJob && (dispatchJob as any).deliveryMethod === 'External')) ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <Truck size={16} className="text-cyan-400" />
                                        <p className="text-sm font-bold text-cyan-400">EXTERNAL PROVIDER</p>
                                      </div>
                                      <p className="text-xs text-cyan-500/70 mt-1">Shipped via 3rd Party Courier</p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-yellow-400">⏳ No driver assigned</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Scanning Interface */}
                          <div className="bg-black/40 border border-cyber-primary/30 rounded-xl p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-cyber-primary uppercase flex items-center gap-2">
                                <Scan size={14} />
                                Scan to Receive
                              </label>
                              <span className="text-[10px] text-gray-500 italic">Scan SKU/Barcode to increment count</span>
                            </div>
                            <div className="relative">
                              <input
                                autoFocus
                                type="text"
                                value={transferScanBarcode}
                                onChange={(e) => setTransferScanBarcode(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleScanTransferItem(transferScanBarcode);
                                  }
                                }}
                                placeholder="Focus here and scan item..."
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:border-cyber-primary outline-none transition-all placeholder:text-gray-600"
                              />
                              <button
                                title="Click to process manual scan"
                                onClick={() => handleScanTransferItem(transferScanBarcode)}
                                className="absolute right-2 top-2 bottom-2 px-3 bg-cyber-primary/20 hover:bg-cyber-primary/30 text-cyber-primary rounded-md transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Line Items Table */}
                          <div className="border border-white/10 rounded-xl overflow-hidden">
                            <div className="bg-black/20 p-3 flex items-center gap-4 text-xs font-bold text-gray-400 uppercase border-b border-white/10">
                              <span className="flex-1">Product</span>
                              <span className="w-20 text-center">Expected</span>
                              <span className="w-24 text-center">Received</span>
                              <div className="w-28 flex items-center justify-center">
                                <button
                                  onClick={() => {
                                    setTransferReceivingItems(prev => prev.map(item => ({
                                      ...item,
                                      receivedQty: item.expectedQty
                                    })));
                                    addNotification('success', 'All items set to expected quantity');
                                  }}
                                  className="px-2 py-1 bg-cyber-primary/20 hover:bg-cyber-primary text-cyber-primary hover:text-black text-[9px] font-bold rounded transition-all border border-cyber-primary/30"
                                >
                                  Receive All
                                </button>
                              </div>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                              {transferReceivingItems.map((item: any, idx: number) => {
                                const hasDiscrepancy = item.receivedQty !== item.expectedQty || item.condition !== 'Good';
                                return (
                                  <div
                                    key={idx}
                                    className={`p-3 flex items-center gap-4 border-b border-white/5 ${hasDiscrepancy ? 'bg-yellow-500/5' : ''
                                      }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-white truncate">{item.name}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                                        {isVerifiedByDriver && item.receivedQty === item.expectedQty && (
                                          <span className="text-[9px] px-1 bg-green-500/20 text-green-400 rounded border border-green-500/30 font-bold uppercase">
                                            ✓ Driver Verified
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-20 text-center">
                                      <span className="text-sm font-mono text-gray-300">{item.expectedQty}</span>
                                    </div>
                                    <div className="w-24 flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleUpdateTransferItem(idx, 'receivedQty', Math.max(0, item.receivedQty - 1))}
                                        className="w-8 h-8 rounded bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
                                        title="Decrease quantity"
                                      >
                                        <Minus size={14} />
                                      </button>
                                      <span className={`text-sm font-mono w-8 text-center ${item.receivedQty < item.expectedQty ? 'text-red-400 font-bold' :
                                        item.receivedQty > item.expectedQty ? 'text-purple-400 font-bold' : 'text-green-400'
                                        }`}>
                                        {item.receivedQty}
                                      </span>
                                      <button
                                        onClick={() => handleUpdateTransferItem(idx, 'receivedQty', item.receivedQty + 1)}
                                        className="w-8 h-8 rounded bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 flex items-center justify-center transition-colors"
                                        title="Increase quantity"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    </div>
                                    <div className="w-28">
                                      <select
                                        value={item.condition}
                                        onChange={(e) => handleUpdateTransferItem(idx, 'condition', e.target.value)}
                                        className={`w-full px-2 py-1 rounded bg-black/30 border text-xs font-bold ${item.condition === 'Good'
                                          ? 'border-green-500/30 text-green-400'
                                          : item.condition === 'Damaged'
                                            ? 'border-red-500/30 text-red-400'
                                            : 'border-yellow-500/30 text-yellow-400'
                                          }`}
                                        aria-label="Item condition"
                                        title="Select item condition"
                                      >
                                        <option value="Good">✓ Good</option>
                                        <option value="Damaged">⚠ Damaged</option>
                                        <option value="Short">📉 Short</option>
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Discrepancy Summary */}
                          {(() => {
                            const discrepancies = transferReceivingItems.filter(
                              item => item.receivedQty !== item.expectedQty || item.condition !== 'Good'
                            );
                            if (discrepancies.length === 0) return null;

                            return (
                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="text-yellow-400" size={16} />
                                  <span className="font-bold text-yellow-400">Discrepancies Detected</span>
                                </div>
                                <div className="text-xs text-gray-300 space-y-1">
                                  {discrepancies.filter(d => d.receivedQty < d.expectedQty).length > 0 && (
                                    <p>• {discrepancies.filter(d => d.receivedQty < d.expectedQty).length} item(s) with quantity shortage</p>
                                  )}
                                  {discrepancies.filter(d => d.condition === 'Damaged').length > 0 && (
                                    <p>• {discrepancies.filter(d => d.condition === 'Damaged').length} item(s) marked as damaged</p>
                                  )}
                                  <p className="text-gray-500 mt-2">These will be flagged for warehouse review.</p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Confirm Button */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => {
                                setSelectedTransferForReceiving(null);
                                setTransferReceivingItems([]);
                              }}
                              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleConfirmTransferReceiving}
                              disabled={isConfirmingReceive || transferReceivingItems.reduce((sum, i) => sum + i.receivedQty, 0) === 0}
                              className={`flex-1 py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${isConfirmingReceive || transferReceivingItems.reduce((sum, i) => sum + i.receivedQty, 0) === 0
                                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed border border-white/5'
                                : 'bg-cyber-primary text-black hover:bg-cyber-accent shadow-lg shadow-cyber-primary/20'
                                }`}
                              title={transferReceivingItems.reduce((sum, i) => sum + i.receivedQty, 0) === 0 ? "You must scan items before confirming" : "Confirm receipt of all scanned items"}
                            >
                              {isConfirmingReceive ? (
                                <>
                                  <Loader2 size={20} className="animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={20} />
                                  Confirm Receipt
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )
                    })()}
                  </>
                )}
              </>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}
