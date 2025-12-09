
import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ShoppingCart, CreditCard, Clock, Lock, LogOut, Printer,
  TrendingUp, DollarSign, Archive, RotateCcw, Package, Scan,
  Truck, Plus, Minus, AlertTriangle, CheckCircle, RefreshCcw, Search, List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOL } from '../constants';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext'; // Use Live Data
import Modal from '../components/Modal';
import { Product } from '../types';

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
  const { sales, addNotification, products, updateProduct, activeSite, transfers, sites, refreshData, shifts, startShift } = useData(); // Live Data
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');

  // Find active shift for current user
  const activeShift = shifts.find(s => s.cashierId === user?.id && s.status === 'Open');

  const handleOpenTerminal = () => {
    if (!activeShift) {
      // Start a new shift with default float (e.g. 2000)
      startShift(user?.id || '', 2000);
    }
    navigate('/pos');
  };

  // --- RECEIVING LOGIC STATE ---
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [receivedItems, setReceivedItems] = useState<Array<{ product: Product; qty: number; timestamp: string }>>([]);

  // --- ENHANCED RECEIVING STATE (Transfer-based) ---
  const [receivingMode, setReceivingMode] = useState<'TRANSFERS' | 'MANUAL'>('TRANSFERS');
  const [selectedTransferForReceiving, setSelectedTransferForReceiving] = useState<string | null>(null);
  const [transferReceivingItems, setTransferReceivingItems] = useState<Array<{
    productId: string;
    sku: string;
    name: string;
    expectedQty: number;
    receivedQty: number;
    condition: 'Good' | 'Damaged' | 'Short';
    notes: string;
  }>>([]);
  const [isConfirmingReceive, setIsConfirmingReceive] = useState(false);

  // --- STOCK LIST STATE ---
  const [isStockListOpen, setIsStockListOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState('');


  const handleScanProduct = async (barcode: string) => {
    // Find product by SKU or barcode
    const product = products.find(p =>
      p.sku.toLowerCase() === barcode.toLowerCase() ||
      p.id === barcode ||
      p.name.toLowerCase().includes(barcode.toLowerCase())
    );

    if (!product) {
      addNotification('alert', `Product not found: ${barcode}`);
      return;
    }

    // Check if product is at this site
    const isAtThisSite = product.siteId === activeSite?.id || product.site_id === activeSite?.id;
    if (!isAtThisSite) {
      addNotification('alert', `Product ${product.name} is not at this location`);
      return;
    }

    // Check if product has already been POS-received
    const alreadyPosReceived = product.posReceivedAt || product.pos_received_at;
    if (alreadyPosReceived) {
      addNotification('info', `${product.name} has already been received and is available for sale.`);
      return;
    }

    // Check if product is from a completed/delivered transfer (location should be STORE-RECEIVED or Receiving Dock)
    const isFromTransfer = product.location === 'STORE-RECEIVED' ||
      product.location === 'Receiving Dock' ||
      product.location?.toLowerCase().includes('receiv');

    // STRICT SECURITY: Ensure this product is actually part of a transfer destined for this site
    const belongsToValidTransfer = transfers.some(t =>
      t.destSiteId === activeSite?.id &&
      (t.items.some(i => i.sku === product.sku || i.productId === product.id))
    );

    if (!isFromTransfer) {
      addNotification('alert', `${product.name} has not arrived at the store yet. Check transfer status.`);
      return;
    }

    if (!belongsToValidTransfer) {
      addNotification('error', `SECURITY ALERT: ${product.name} is not part of any incoming transfer to this store.`);
      return;
    }

    // Check if already received in this session
    const alreadyReceived = receivedItems.some(item => item.product.id === product.id);
    if (alreadyReceived) {
      // Update quantity
      setReceivedItems(prev => prev.map(item =>
        item.product.id === product.id
          ? { ...item, qty: item.qty + 1, timestamp: new Date().toISOString() }
          : item
      ));
      addNotification('success', `Updated quantity for ${product.name}`);
    } else {
      // Add new item
      setReceivedItems(prev => [...prev, {
        product,
        qty: 1,
        timestamp: new Date().toISOString()
      }]);
      addNotification('success', `Added ${product.name} to received items`);
    }
  };

  const handleConfirmReceiving = async () => {
    if (receivedItems.length === 0) {
      addNotification('alert', 'No items to confirm');
      return;
    }

    try {
      // Update each product with posReceivedAt timestamp and who received it
      for (const item of receivedItems) {
        await updateProduct({
          ...item.product,
          posReceivedAt: new Date().toISOString(),
          pos_received_at: new Date().toISOString(),
          posReceivedBy: user?.name || 'POS User',
          pos_received_by: user?.name || 'POS User'
        }, user?.name || 'POS User');
      }

      addNotification('success', `Confirmed ${receivedItems.length} item(s) as received. They are now available for sale.`);
      setIsReceivingModalOpen(false);
      setScannedBarcode('');
      setReceivedItems([]);
    } catch (error) {
      console.error('Error confirming receiving:', error);
      addNotification('alert', 'Failed to confirm receiving. Please try again.');
    }
  };

  // --- TRANSFER-BASED RECEIVING HANDLERS ---
  const handleSelectTransferForReceiving = (transferId: string) => {
    const transfer = transfers?.find(t => t.id === transferId);
    if (!transfer) return;

    // Initialize receiving items from transfer line items
    const items = transfer.items.map(item => {
      const product = products.find(p => p.sku === item.sku || p.id === item.productId);
      return {
        productId: item.productId,
        sku: item.sku,
        name: product?.name || item.sku,
        expectedQty: item.quantity,
        receivedQty: item.quantity, // Default to expected
        condition: 'Good' as const,
        notes: ''
      };
    });

    setSelectedTransferForReceiving(transferId);
    setTransferReceivingItems(items);
  };

  const handleUpdateTransferItem = (index: number, field: string, value: any) => {
    setTransferReceivingItems(prev => prev.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    ));
  };

  const handleConfirmTransferReceiving = async () => {
    if (!selectedTransferForReceiving || transferReceivingItems.length === 0) return;

    setIsConfirmingReceive(true);
    try {
      // Check for discrepancies
      const hasDiscrepancies = transferReceivingItems.some(
        item => item.receivedQty !== item.expectedQty || item.condition !== 'Good'
      );

      // Update products with received status
      for (const item of transferReceivingItems) {
        if (item.receivedQty <= 0) continue;

        const product = products.find(p => p.sku === item.sku || p.id === item.productId);
        if (product) {
          await updateProduct({
            ...product,
            posReceivedAt: new Date().toISOString(),
            pos_received_at: new Date().toISOString(),
            posReceivedBy: user?.name || 'POS User',
            pos_received_by: user?.name || 'POS User',
            needsReview: item.condition === 'Damaged',
            receivingNotes: item.condition !== 'Good' ? `${item.condition}: ${item.notes || 'No details'}` : undefined
          }, user?.name || 'POS User');
        }
      }

      // Refresh data
      if (refreshData) await refreshData();

      // Notify success
      if (hasDiscrepancies) {
        addNotification('info', `Received ${transferReceivingItems.length} items with discrepancies flagged for review.`);
      } else {
        addNotification('success', `Successfully received ${transferReceivingItems.length} items from transfer.`);
      }

      // Reset state
      setSelectedTransferForReceiving(null);
      setTransferReceivingItems([]);
      setIsReceivingModalOpen(false);
    } catch (error) {
      console.error('Error confirming transfer receiving:', error);
      addNotification('alert', 'Failed to confirm receiving. Please try again.');
    } finally {
      setIsConfirmingReceive(false);
    }
  };

  // --- CALCULATION LOGIC ---
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const cashInDrawer = sales.filter(s => s.method === 'Cash').reduce((sum, s) => sum + s.total, 0) + 2000; // Mock Float
  const personalSales = sales.filter(s => s.cashierName === user?.name).reduce((sum, s) => sum + s.total, 0);
  const txCount = sales.length;
  const returnCount = sales.filter(s => s.status === 'Refunded').length;

  // Chart Data Preparation
  const methodStats = sales.reduce((acc: any, curr) => {
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

  const handleLockScreen = () => {
    setIsLocked(true);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsLocked(false);
      setPin('');
    } else {
      addNotification('alert', 'Incorrect PIN. Try 1234');
      setPin('');
    }
  };

  const handleReprint = () => {
    addNotification('info', "Reprinting last transaction receipt...");
  };

  const handleEndShift = () => {
    addNotification('info', "Please navigate to the POS Terminal to perform formal Shift Closure and Reconciliation.");
    navigate('/pos');
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
        <div className="bg-cyber-gray border border-white/10 p-8 rounded-2xl w-full max-w-sm text-center shadow-2xl">
          <Lock size={48} className="mx-auto text-cyber-primary mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Terminal Locked</h2>
          <p className="text-gray-400 text-sm mb-6">Enter your PIN to resume session.</p>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-center text-white text-2xl font-mono outline-none focus:border-cyber-primary mb-4"
              placeholder="****"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            <button className="w-full bg-cyber-primary text-black font-bold py-3 rounded-xl hover:bg-cyber-accent transition-colors">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

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
          {activeShift && (
            <div className="bg-black/30 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3">
              <Clock size={16} className="text-cyber-primary" />
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Started At</p>
                <p className="text-sm font-mono text-white leading-none">
                  {new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
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
      <Modal isOpen={isStockListOpen} onClose={() => setIsStockListOpen(false)} title={`Stock Lookup - ${activeSite?.name || 'Current Location'}`} size="xl">
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
                          <div className="w-8 h-8 rounded bg-white/5 overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">IMG</div>
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
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm font-mono text-white">{sale.receiptNumber || sale.id}</td>
                  <td className="p-4 text-xs text-gray-400">{sale.date.split(' ')[1]}</td>
                  <td className="p-4 text-xs text-gray-400">{sale.method}</td>
                  <td className="p-4 text-sm font-mono text-white text-right">{CURRENCY_SYMBOL} {sale.total.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px - 2 py - 1 rounded text - [10px] font - bold uppercase border ${sale.status === 'Completed' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                      } `}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receiving Modal - Enhanced with Transfers + Manual Mode */}
      <Modal isOpen={isReceivingModalOpen} onClose={() => {
        setIsReceivingModalOpen(false);
        setSelectedTransferForReceiving(null);
        setTransferReceivingItems([]);
        setReceivedItems([]);
        setScannedBarcode('');
      }} title="Receive Inventory" size="xl">
        <div className="space-y-4">
          {/* Mode Toggle Tabs */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setReceivingMode('TRANSFERS')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${receivingMode === 'TRANSFERS'
                ? 'bg-cyber-primary text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Truck size={16} />
              From Transfers
            </button>
            <button
              onClick={() => setReceivingMode('MANUAL')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${receivingMode === 'MANUAL'
                ? 'bg-cyber-primary text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Scan size={16} />
              Manual Scan
            </button>
          </div>

          {/* TRANSFERS MODE */}
          {receivingMode === 'TRANSFERS' && (
            <div className="space-y-4">
              {/* Pending Transfers List */}
              {!selectedTransferForReceiving && (
                <>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Truck className="text-blue-400" size={20} />
                        <h3 className="text-white font-bold">Incoming Transfers</h3>
                      </div>
                      {/* Show current site for super admin */}
                      <div className="px-3 py-1 bg-cyber-primary/20 rounded-lg border border-cyber-primary/30">
                        <span className="text-xs font-bold text-cyber-primary">
                          {activeSite?.name || 'No Site Selected'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Showing transfers destined for <span className="text-white font-bold">{activeSite?.name || 'current location'}</span>.
                      {user?.role === 'super_admin' && (
                        <span className="text-yellow-400 ml-1">Change site from the top bar dropdown.</span>
                      )}
                    </p>
                  </div>

                  {(() => {
                    // Filter transfers destined for this site that are in-transit or delivered
                    const pendingTransfers = (transfers || []).filter(t => {
                      // Check destination matches current site (robust ID check)
                      if (String(t.destSiteId) !== String(activeSite?.id)) return false;

                      // Check status - catch-all for various WMS/Transfer statuses
                      // We want to show anything that is NOT 'Completed' or 'Cancelled' essentially
                      const status = ((t as any).transferStatus || t.status || '').toLowerCase();

                      // Statuses that should definitely appear
                      const validStatuses = [
                        'requested', 'pending', 'approved',
                        'packed', 'ready', 'staging',
                        'shipped', 'in-transit', 'dispatched',
                        'delivered', 'arrived'
                      ];

                      const isValidStatus = validStatuses.includes(status);

                      if (!isValidStatus) return false;

                      // Check if any items haven't been POS-received yet
                      // Don't require product to exist in local products array
                      const hasUnreceivedItems = t.items.some(item => {
                        const product = products.find(p => p.sku === item.sku || p.id === item.productId);
                        // If product exists, check if it hasn't been received
                        // If product doesn't exist yet, it still needs receiving
                        return !product || !(product.posReceivedAt || product.pos_received_at);
                      });

                      return hasUnreceivedItems;
                    });

                    if (pendingTransfers.length === 0) {
                      // Count transfers for debugging
                      const allTransfersCount = transfers?.length || 0;
                      // Use loose helpful filtering for debug stats
                      const siteTransfers = (transfers || []).filter(t => String(t.destSiteId) === String(activeSite?.id));

                      return (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                          <Package size={48} className="text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold">No pending transfers found</p>
                          <p className="text-gray-600 text-sm mt-2">All incoming shipments have been received</p>

                          {/* Super Admin Debug Info */}
                          {user?.role === 'super_admin' && (
                            <div className="mt-4 p-3 bg-black/40 rounded-lg text-xs text-left font-mono space-y-1">
                              <p className="text-gray-500 font-bold border-b border-gray-700 pb-1 mb-1">DEBUG INFO:</p>
                              <p className="text-gray-400">Current Site ID: <span className="text-white">{activeSite?.id}</span></p>
                              <p className="text-gray-400">Total System Transfers: <span className="text-white">{allTransfersCount}</span></p>
                              <p className="text-gray-400">Transfers for this Site: <span className="text-white">{siteTransfers.length}</span></p>

                              {siteTransfers.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                  <p className="text-gray-500 mb-1">Found statuses:</p>
                                  {Array.from(new Set(siteTransfers.map(t => (t as any).transferStatus || t.status))).map(s => (
                                    <span key={s} className="inline-block px-1 bg-white/10 rounded mr-1 mb-1">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }


                    return (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {pendingTransfers.map(transfer => {
                          const sourceSite = sites?.find(s => s.id === transfer.sourceSiteId);
                          const itemCount = transfer.items.length;
                          const totalQty = transfer.items.reduce((sum, i) => sum + i.quantity, 0);

                          return (
                            <button
                              key={transfer.id}
                              onClick={() => handleSelectTransferForReceiving(transfer.id)}
                              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:border-cyber-primary/50 hover:bg-white/10 transition-all text-left group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Truck size={20} className="text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-white">{transfer.id.slice(0, 12)}...</p>
                                    <p className="text-xs text-gray-400">From: {sourceSite?.name || 'Unknown'}</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${transfer.transferStatus === 'Delivered'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  }`}>
                                  {transfer.transferStatus}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">{itemCount} product(s) • {totalQty} units</span>
                                <span className="text-cyber-primary group-hover:translate-x-1 transition-transform">
                                  Receive →
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Selected Transfer - Receiving Form */}
              {selectedTransferForReceiving && (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Package size={20} className="text-green-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white">Receiving: {selectedTransferForReceiving.slice(0, 12)}...</p>
                          <p className="text-xs text-gray-400">{transferReceivingItems.length} items to verify</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTransferForReceiving(null);
                          setTransferReceivingItems([]);
                        }}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-black/20 p-3 flex items-center gap-4 text-xs font-bold text-gray-400 uppercase border-b border-white/10">
                      <span className="flex-1">Product</span>
                      <span className="w-20 text-center">Expected</span>
                      <span className="w-24 text-center">Received</span>
                      <span className="w-28 text-center">Condition</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {transferReceivingItems.map((item, idx) => {
                        const hasDiscrepancy = item.receivedQty !== item.expectedQty || item.condition !== 'Good';
                        return (
                          <div
                            key={idx}
                            className={`p-3 flex items-center gap-4 border-b border-white/5 ${hasDiscrepancy ? 'bg-yellow-500/5' : ''
                              }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                            </div>
                            <div className="w-20 text-center">
                              <span className="text-sm font-mono text-gray-300">{item.expectedQty}</span>
                            </div>
                            <div className="w-24 flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleUpdateTransferItem(idx, 'receivedQty', Math.max(0, item.receivedQty - 1))}
                                className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                                aria-label="Decrease received quantity"
                              >
                                <Minus size={12} />
                              </button>
                              <span className={`text-sm font-mono w-8 text-center ${item.receivedQty < item.expectedQty ? 'text-red-400' : 'text-green-400'
                                }`}>
                                {item.receivedQty}
                              </span>
                              <button
                                onClick={() => handleUpdateTransferItem(idx, 'receivedQty', item.receivedQty + 1)}
                                className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                                aria-label="Increase received quantity"
                              >
                                <Plus size={12} />
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
                      disabled={isConfirmingReceive}
                      className={`flex-1 py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${isConfirmingReceive
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-cyber-primary text-black hover:bg-cyber-accent shadow-lg shadow-cyber-primary/20'
                        }`}
                    >
                      {isConfirmingReceive ? (
                        <>
                          <RefreshCcw size={20} className="animate-spin" />
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
              )}
            </div>
          )}

          {/* MANUAL MODE */}
          {receivingMode === 'MANUAL' && (
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Scan className="text-blue-400" size={20} />
                  <h3 className="text-white font-bold">Manual Scan Mode</h3>
                </div>
                <p className="text-xs text-gray-400">
                  Scan items that have arrived at the store via transfer. Only items at the Receiving Dock can be received here.
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus-within:border-cyber-primary/50 transition-colors">
                  <Scan className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, or scan barcode..."
                    className="bg-transparent border-none ml-3 flex-1 text-white outline-none placeholder-gray-500"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter' && scannedBarcode.trim()) {
                        await handleScanProduct(scannedBarcode.trim());
                        setScannedBarcode('');
                      }
                    }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={async () => {
                    if (scannedBarcode.trim()) {
                      await handleScanProduct(scannedBarcode.trim());
                      setScannedBarcode('');
                    }
                  }}
                  className="px-6 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Product Grid - Only items awaiting POS receipt */}
              {scannedBarcode.trim() === '' && receivedItems.length === 0 && (() => {
                // Filter products that are at this site, from transfers, and not yet POS-received
                const awaitingReceipt = products.filter(p => {
                  const isAtThisSite = p.siteId === activeSite?.id || p.site_id === activeSite?.id;
                  const notPosReceived = !(p.posReceivedAt || p.pos_received_at);
                  const isFromTransfer = p.location === 'STORE-RECEIVED' ||
                    p.location === 'Receiving Dock' ||
                    p.location?.toLowerCase().includes('receiv');
                  return isAtThisSite && notPosReceived && isFromTransfer;
                });

                if (awaitingReceipt.length === 0) {
                  return (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                      <Package size={48} className="text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">No items awaiting receipt</p>
                      <p className="text-gray-600 text-sm mt-2">All transferred items have been received or no transfers pending.</p>
                      <p className="text-gray-500 text-xs mt-2">Use the "From Transfers" tab to receive incoming shipments.</p>
                    </div>
                  );
                }

                return (
                  <div className="border border-white/10 rounded-xl p-4 bg-black/20">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">
                      Awaiting Receipt ({awaitingReceipt.length} items)
                    </h4>
                    <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {awaitingReceipt.slice(0, 12).map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleScanProduct(product.sku)}
                          className="text-left bg-white/5 border border-white/10 rounded-lg p-2 hover:border-cyber-primary/50 hover:bg-white/10 transition-all group"
                        >
                          <div className="aspect-square rounded bg-white/5 mb-2 overflow-hidden">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <p className="text-xs font-bold text-white truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-500">{product.sku}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Filtered Search Results - Only items awaiting receipt */}
              {scannedBarcode.trim() !== '' && (() => {
                // Filter products that are at this site, from transfers, and not yet POS-received
                const awaitingReceipt = products.filter(p => {
                  const isAtThisSite = p.siteId === activeSite?.id || p.site_id === activeSite?.id;
                  const notPosReceived = !(p.posReceivedAt || p.pos_received_at);
                  const isFromTransfer = p.location === 'STORE-RECEIVED' ||
                    p.location === 'Receiving Dock' ||
                    p.location?.toLowerCase().includes('receiv');
                  const matchesSearch = p.name.toLowerCase().includes(scannedBarcode.toLowerCase()) ||
                    p.sku.toLowerCase().includes(scannedBarcode.toLowerCase());
                  return isAtThisSite && notPosReceived && isFromTransfer && matchesSearch;
                });

                if (awaitingReceipt.length === 0) {
                  return (
                    <div className="border border-white/10 rounded-xl p-4 bg-black/20">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Search Results</h4>
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">No items matching "{scannedBarcode}" awaiting receipt.</p>
                        <p className="text-gray-600 text-xs mt-1">Check the "From Transfers" tab for pending shipments.</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="border border-white/10 rounded-xl p-4 bg-black/20">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Search Results ({awaitingReceipt.length})</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {awaitingReceipt.slice(0, 8).map(product => (
                        <button
                          key={product.id}
                          onClick={() => {
                            handleScanProduct(product.sku);
                            setScannedBarcode('');
                          }}
                          className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:border-cyber-primary/50 hover:bg-white/10 transition-all text-left"
                        >
                          <div className="w-12 h-12 rounded bg-white/5 overflow-hidden flex-shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{product.name}</p>
                            <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                          </div>
                          <div className="text-xs text-yellow-400">
                            Awaiting Receipt
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Received Items List */}
              {receivedItems.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Package className="text-green-400" size={16} />
                    Received Items ({receivedItems.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {receivedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="w-12 h-12 rounded bg-white/5 overflow-hidden flex-shrink-0">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-400">SKU: {item.product.sku}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setReceivedItems(prev => prev.map((ri, i) =>
                                i === idx && ri.qty > 1 ? { ...ri, qty: ri.qty - 1 } : ri
                              ));
                            }}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-mono text-white w-8 text-center">{item.qty}</span>
                          <button
                            onClick={() => {
                              setReceivedItems(prev => prev.map((ri, i) =>
                                i === idx ? { ...ri, qty: ri.qty + 1 } : ri
                              ));
                            }}
                            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setReceivedItems(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="ml-2 text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsReceivingModalOpen(false);
                    setScannedBarcode('');
                    setReceivedItems([]);
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                {receivedItems.length > 0 && (
                  <button
                    onClick={handleConfirmReceiving}
                    className="flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Confirm & Save ({receivedItems.length} items)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal >
    </div >
  );
}
