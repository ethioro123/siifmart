import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { useNavigate } from 'react-router-dom';
import {
    Users, TrendingUp, AlertTriangle, Map as MapIcon, DollarSign,
    ShoppingBag, Truck, Activity, ArrowRight, BarChart3, PieChart as PieChartIcon,
    Target, Award, ShoppingCart, Zap, Globe, Package, Box, Layers, Clock, ShieldCheck,
    Cpu, Server, Radio, Terminal, Undo, UserPlus
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { CURRENCY_SYMBOL } from '../constants';
import { calculateMetrics, formatCurrency, METRIC_ROUTES, DashboardMetrics } from '../utils/metrics';
import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import DashboardSkeleton from '../components/DashboardSkeleton';

// --- INTERFACES ---
interface SitePerformance {
    id: string;
    name: string;
    type: string;
    address: string;
    revenue: number;
    staffCount: number;
    lowStock: number;
    transactionCount: number;
}

interface GlassKPICardProps {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    sub?: string;
    route?: string;
    trend?: string;
}

// --- NEW COMPONENTS ---

const CyberClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    };

    return (
        <div className="flex flex-col items-end font-mono">
            <div className="text-3xl font-bold text-white tracking-widest leading-none flex gap-1">
                {formatTime(time).split('').map((char, i) => (
                    <span key={i} className={`inline-block ${char === ':' ? 'animate-pulse text-cyber-primary' : ''}`}>
                        {char}
                    </span>
                ))}
            </div>
            <div className="text-xs text-cyber-primary font-bold tracking-[0.2em] mt-1 opacity-80">
                {formatDate(time)} • UTC {time.getUTCHours()}:{time.getUTCMinutes().toString().padStart(2, '0')}
            </div>
        </div>
    );
};

const SystemTicker = () => {
    // Replaced by real logs if available, but keeping for aesthetic "background noise" in header if desired
    // Will be updated/removed in next steps if we replace completely.
    // For now, let's keep it as is, we will add a LOGS widget separately.
    const messages = [
        "SYSTEM OPTIMAL",
        "WMS SYNC: ACTIVE",
        "NETWORK LATENCY: 12MS",
        "SECURITY SHIELD: ENGAGED",
        "BACKUP: COMPLETED 04:00Z",
        "NEW NODES DETECTED: 0",
        "AI CO-PILOT: STANDBY"
    ];

    return (
        <div className="w-full bg-black/40 border-y border-white/5 backdrop-blur-md h-8 flex items-center overflow-hidden relative mb-6">
            <div className="absolute left-0 bg-cyber-primary/20 px-2 h-full flex items-center z-10 border-r border-cyber-primary/30">
                <Terminal size={12} className="text-cyber-primary mr-1" />
                <span className="text-[10px] font-bold text-cyber-primary">SYS.LOG</span>
            </div>
            <div className="animate-marquee whitespace-nowrap flex gap-12 items-center pl-24">
                {messages.concat(messages).map((msg, i) => (
                    <span key={i} className="text-[10px] font-mono font-medium text-gray-400 flex items-center">
                        <span className="w-1.5 h-1.5 bg-cyber-primary/50 rounded-full mr-2 animate-pulse"></span>
                        {msg}
                    </span>
                ))}
            </div>
            <style>{`
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};

const SystemLoadWidget = () => {
    // Mock system metrics
    const [load, setLoad] = useState({ cpu: 24, mem: 41, net: 68 });

    useEffect(() => {
        const interval = setInterval(() => {
            setLoad({
                cpu: 20 + Math.floor(Math.random() * 15),
                mem: 40 + Math.floor(Math.random() * 5),
                net: 60 + Math.floor(Math.random() * 20),
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <Server className="text-cyan-400" size={20} />
                    <span className="text-xs text-gray-500 font-bold uppercase">System Load</span>
                </div>
                <div className="flex gap-1">
                    <span className="w-1 h-3 bg-cyan-500/50 rounded-full animate-pulse"></span>
                    <span className="w-1 h-3 bg-cyan-500/30 rounded-full"></span>
                    <span className="w-1 h-3 bg-cyan-500/10 rounded-full"></span>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                        <span>CPU_CORE_01</span>
                        <span className="text-cyan-400">{load.cpu}%</span>
                    </div>
                    <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-1000 ease-out" style={{ width: `${load.cpu}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                        <span>MEM_ALLOC</span>
                        <span className="text-purple-400">{load.mem}%</span>
                    </div>
                    <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-1000 ease-out" style={{ width: `${load.mem}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                        <span>NET_THROUGHPUT</span>
                        <span className="text-green-400">{load.net} MB/s</span>
                    </div>
                    <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-1000 ease-out" style={{ width: `${load.net}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute right-0 top-0 w-32 h-full opacity-5 pointer-events-none">
                <svg width="100%" height="100%">
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: Activity Log Widget ---
const ActivityLogWidget = ({ logs }: { logs?: any[] }) => {
    const displayLogs = logs?.slice(0, 5) || [];

    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 h-full relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Activity className="text-blue-400" size={16} />
                    Live System Activity
                </h3>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            </div>

            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 relative z-10">
                {displayLogs.length === 0 ? (
                    <div className="text-xs text-gray-500 font-mono text-center py-4">NO RECENT ACTIVITY</div>
                ) : (
                    displayLogs.map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 items-start border-l-2 border-white/10 pl-3 py-1 hover:bg-white/5 hover:border-blue-500/50 transition-all rounded-r">
                            <div className="pt-0.5">
                                <div className="text-[10px] font-bold text-cyber-primary font-mono leading-none">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div>
                                <p className="text-white text-xs font-bold leading-tight">{log.action}</p>
                                <p className="text-[10px] text-gray-500 leading-tight">{log.details} • <span className="text-gray-400">{log.user?.split(' ')[0]}</span></p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0)_1px,transparent_1px)] bg-[size:20px_20px] opacity-10 pointer-events-none"></div>
        </div>
    );
};

// --- NEW COMPONENT: Top Products Widget ---
const TopProductsWidget = ({ products }: { products: any[] }) => {
    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 h-full relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Award className="text-yellow-400" size={16} />
                    Top Performing Items
                </h3>
                <div className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-400 font-bold uppercase">
                    Sales Vol
                </div>
            </div>

            <div className="space-y-4 relative z-10 overflow-y-auto custom-scrollbar pr-1">
                {products.length === 0 ? (
                    <div className="text-xs text-gray-500 font-mono text-center py-4">NO SALES DATA</div>
                ) : (
                    products.map((p, i) => (
                        <div key={i} className="group relative">
                            <div className="flex justify-between items-end mb-1 text-xs">
                                <span className="font-bold text-gray-300 truncate w-2/3 flex items-center gap-2">
                                    <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                                        {i + 1}
                                    </span>
                                    {p.name}
                                </span>
                                <span className="font-mono text-cyber-primary">{formatCurrency(p.sales)}</span>
                            </div>
                            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyber-primary to-cyan-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${(p.sales / products[0].sales) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default function CentralOperations() {
    const { sites, employees, allSales, allOrders, allProducts, setActiveSite, jobs, systemLogs, activeSite } = useData(); // Added systemLogs & activeSite
    const { loading, theme } = useStore(); // Access theme to adjust chart colors if needed
    const navigate = useNavigate();

    // --- LOADING STATE ---
    if (loading) {
        return <DashboardSkeleton />;
    }

    // --- AGGREGATED METRICS ---
    const metrics: DashboardMetrics = useMemo(() => {
        try {
            return calculateMetrics(
                allSales || [],
                allProducts || [],
                jobs || [],
                allOrders || [],
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
    }, [allSales, allProducts, jobs, allOrders, employees]);

    const totalRevenue = metrics?.totalNetworkRevenue || 0;
    const totalEmployees = metrics?.totalEmployees || 0;
    const totalSites = sites?.length || 0;
    const activeAlerts = metrics?.activeAlerts || 0;
    const inventoryValue = metrics?.totalNetworkStockValue || 0;
    const avgOrderValue = metrics?.avgBasket || 0;

    // Stock Status Data
    const stockStatusData = useMemo(() => {
        const goodStock = (allProducts || []).filter(p => p.stock >= 10 && p.status !== 'out_of_stock').length;
        const lowStock = (allProducts || []).filter(p => (p.stock < 10 && p.stock > 0) || p.status === 'low_stock').length;
        const outStock = (allProducts || []).filter(p => p.stock === 0 || p.status === 'out_of_stock').length;

        return [
            { name: 'Optimal', value: goodStock, color: '#10b981' },
            { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
            { name: 'Out of Stock', value: outStock, color: '#ef4444' },
        ].filter(d => d.value > 0);
    }, [allProducts, metrics]);

    // --- SITE PERFORMANCE ---
    // --- SITE PERFORMANCE ---
    const sitePerformance: SitePerformance[] = useMemo(() => {
        if (!sites || !allSales || !employees || !allProducts) return [];

        // Filter out Administration/HQ sites - they shouldn't appear in performance matrix
        const operationalSites = sites.filter(s => s.type !== 'Administration' && s.type !== 'HQ' && s.type !== 'Administrative');

        return operationalSites.map(site => {
            const siteSales = allSales.filter(s => s.siteId === site.id);
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
    }, [sites, allSales, employees, allProducts]);

    // --- CHART DATA ---
    const revenueBySiteData = useMemo(() => {
        if (!sitePerformance) return [];
        // Limit to Top 10 for readability regardless of network size
        return sitePerformance.slice(0, 10).map(site => ({
            name: site.name.length > 15 ? site.name.substring(0, 12) + '...' : site.name,
            revenue: site.revenue,
            transactions: site.transactionCount
        }));
    }, [sitePerformance]);

    const revenueByCategory = useMemo(() => {
        if (!allSales) return [];
        const categoryData = new Map();
        allSales.forEach(sale => {
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
    }, [allSales]);

    // --- TOP PRODUCTS ---
    // New Feature: Leaderboard of top selling items
    const topProducts = useMemo(() => {
        if (!allSales) return [];
        const productStats = new Map<string, { name: string, sales: number, count: number }>();

        allSales.forEach(sale => {
            // Only count completed sales
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
    }, [allSales]);

    // --- COLORS & CHART STYLES ---
    const isDark = theme === 'dark';
    const chartAxisColor = isDark ? '#555' : '#9ca3af';
    const chartGridColor = isDark ? '#222' : '#e5e7eb';
    const tooltipBg = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)';
    const tooltipBorder = isDark ? '#333' : '#e5e7eb';
    const tooltipText = isDark ? '#fff' : '#111827';

    // --- COMPONENT: Glass KPI Card ---
    const GlassKPICard = ({ title, value, icon: Icon, color, sub, route, trend }: GlassKPICardProps) => (
        <div
            onClick={() => route && navigate(route)}
            className="group relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,255,157,0.1)]"
        >
            <div className={`absolute -right-6 -top-6 p-8 rounded-full ${color.replace('text-', 'bg-')}/5 blur-2xl group-hover:blur-3xl transition-all duration-500`}></div>

            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${color.replace('text-', 'bg-')}/10 text-white border border-white/5`}>
                    <Icon size={24} className={color} />
                </div>
                {trend && (
                    <span className="flex items-center text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                        <TrendingUp size={12} className="mr-1" /> {trend}
                    </span>
                )}
            </div>

            <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl lg:text-3xl font-mono font-bold text-white tracking-tight truncate">{value}</h3>
                {sub && <p className="text-xs text-gray-500 mt-2 font-medium">{sub}</p>}
            </div>
        </div>
    );

    // --- COMPONENT: Empty State Overlay ---
    const EmptyState = ({ message }: { message: string }) => (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 rounded-2xl">
            <Package className="text-gray-600 mb-2" size={32} />
            <p className="text-gray-400 text-sm font-medium">{message}</p>
        </div>
    );

    return (
        <div className="min-h-screen p-6 pb-20 animate-in fade-in duration-700 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyber-dark via-cyber-black to-cyber-black">

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
                        <Radio size={14} className="text-green-400 animate-pulse" />
                        <span className="text-xs font-mono text-gray-400">LIVE FEED CONNECTED</span>
                    </p>
                </div>

                <div className="flex items-end gap-6 mt-4 md:mt-0">
                    <CyberClock />

                    <button className="hidden md:block px-6 py-3 bg-cyber-primary text-cyber-black font-bold rounded-xl hover:bg-cyber-primary/90 transition-colors shadow-[0_0_20px_rgba(0,255,157,0.3)]">
                        Generate Report
                    </button>
                    <div className="text-right px-6 py-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                        <p className="text-xs text-gray-500 font-bold uppercase">Active Sites</p>
                        <p className="text-2xl font-mono font-bold text-white">{totalSites}</p>
                    </div>
                </div>
            </div>

            {/* --- SYSTEM TICKER --- */}
            <SystemTicker />

            {/* --- BENTO GRID LAYOUT --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-[1700px] mx-auto">

                {/* Financial KPI Row */}
                <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <WidgetErrorBoundary title="Total Revenue">
                        <GlassKPICard
                            title="Total Revenue"
                            value={formatCurrency(metrics.totalNetworkRevenue)}
                            trend="+12.5%"
                            sub="vs. Last Month"
                            icon={DollarSign}
                            color="text-green-400"
                        />
                    </WidgetErrorBoundary>

                    <WidgetErrorBoundary title="Inventory Value">
                        <GlassKPICard
                            title="Inventory Value"
                            value={formatCurrency(allProducts.reduce((sum, p) => sum + (p.costPrice || 0) * (p.stock || 0), 0))}
                            trend="+5.2%"
                            sub="Total Asset Valuation"
                            icon={Package}
                            color="text-blue-400"
                        />
                    </WidgetErrorBoundary>

                    <WidgetErrorBoundary title="Active Orders">
                        <GlassKPICard
                            title="Active Orders"
                            value={allOrders.filter(o => o.status !== 'Received' && o.status !== 'Cancelled').length}
                            trend="-2.4%"
                            sub="Pending Fulfillment"
                            icon={ShoppingCart}
                            color="text-purple-400"
                        />
                    </WidgetErrorBoundary>

                    <WidgetErrorBoundary title="Avg Order Value">
                        <GlassKPICard
                            title="Avg. Order Value"
                            value={formatCurrency(allSales.length > 0 ? allSales.reduce((sum, s) => sum + s.total, 0) / allSales.length : 0)}
                            trend="+8.1%"
                            sub="Per Transaction"
                            icon={Activity}
                            color="text-yellow-400"
                        />
                    </WidgetErrorBoundary>
                </div>
                {/* 2. MAIN CHART (Large Area) - Spans 3 cols */}
                <div className="md:col-span-3 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 h-[450px] relative overflow-hidden">
                    <WidgetErrorBoundary title="Revenue Chart">
                        {revenueBySiteData.length === 0 && <EmptyState message="No revenue data available" />}

                        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-primary/50 to-transparent opacity-50"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Activity className="text-cyber-primary" size={20} />
                                Revenue Velocity <span className="text-xs font-normal text-gray-500 ml-2">(Top 10 Performing Sites)</span>
                            </h3>
                            <div className="flex gap-2">
                                <span className="text-xs font-mono text-cyber-primary/70 bg-cyber-primary/10 px-2 py-1 rounded">LIVE</span>
                                <span className="text-xs font-mono text-gray-500 border border-white/10 px-2 py-1 rounded">Last 24h</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={revenueBySiteData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#00ff9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                <XAxis dataKey="name" stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: tooltipBg, backdropFilter: 'blur(10px)', border: `1px solid ${tooltipBorder}`, borderRadius: '12px' }}
                                    itemStyle={{ color: tooltipText, fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#00ff9d" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </WidgetErrorBoundary>
                </div>

                {/* 3. PERFORMANCE STATS (Side) - Spans 1 col */}
                <div className="flex flex-col gap-6">
                    {/* Stock Health Pie */}
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 h-[213px] relative flex flex-col">
                        <WidgetErrorBoundary title="Stock Health">
                            {stockStatusData.length === 0 && <EmptyState message="No stock data" />}
                            <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
                                <PieChartIcon className="text-purple-400" size={16} />
                                Stock Health
                            </h3>
                            <div className="flex-1 w-full min-h-0 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stockStatusData}
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stockStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, fontSize: '12px' }} itemStyle={{ color: tooltipText }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-lg font-bold text-white">{metrics?.stockCount > 0 ? '100%' : '0%'}</span>
                                </div>
                            </div>
                        </WidgetErrorBoundary>
                    </div>

                    {/* Alerts Card */}
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 h-[213px] relative flex flex-col justify-between group">
                        <div className="absolute -right-6 -top-6 p-8 rounded-full bg-red-500/5 blur-2xl group-hover:blur-3xl transition-all"></div>
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                            <AlertTriangle className="text-red-400" size={16} />
                            Critical Alerts
                        </h3>
                        <div>
                            <p className="text-4xl font-mono font-bold text-white">{activeAlerts}</p>
                            <p className="text-xs text-red-400 mt-1">{metrics?.lowStockCount} Low Stock Items</p>
                            <p className="text-xs text-red-400">{metrics?.outOfStockCount} Out of Stock</p>
                        </div>
                        <button onClick={() => navigate(METRIC_ROUTES.lowStock)} className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-colors">
                            View Alerts
                        </button>
                    </div>
                </div>

                {/* 4. OPERATIONAL EFFICIENCY ROW (New) */}
                <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-2">
                    <WidgetErrorBoundary title="Net Profit">
                        <GlassKPICard
                            title="Net Profit"
                            value={formatCurrency(metrics.netProfit)}
                            trend={metrics.netProfit > 0 ? "+15%" : "-2%"}
                            sub="Net Earnings"
                            icon={Award}
                            color="text-emerald-400"
                        />
                    </WidgetErrorBoundary>

                    <WidgetErrorBoundary title="Profit Margin">
                        <GlassKPICard
                            title="Profit Margin"
                            value={`${metrics.profitMargin.toFixed(1)}%`}
                            trend="+1.2%"
                            sub="Efficiency Rate"
                            icon={TrendingUp}
                            color="text-teal-400"
                        />
                    </WidgetErrorBoundary>

                    <WidgetErrorBoundary title="Return Rate">
                        <GlassKPICard
                            title="Return Rate"
                            value={`${metrics.returnRate.toFixed(1)}%`}
                            trend={metrics.returnRate < 2 ? "-0.5%" : "+0.2%"} // Logic: Lower is better, so trend down is good (green?) - keep color neutral or handle trend logic elsewhere
                            sub={`${formatCurrency(metrics.totalReturnedValue)} Refunded`}
                            icon={Undo}
                            color="text-rose-400"
                        />
                    </WidgetErrorBoundary>

                    <WidgetErrorBoundary title="Basket Size">
                        <GlassKPICard
                            title="Avg Basket Size"
                            value={(allSales?.reduce((acc, sale) => acc + (sale.items?.reduce((iAcc, i) => iAcc + i.quantity, 0) || 0), 0) / (allSales?.length || 1)).toFixed(1) || "0"}
                            sub="Items Per Order"
                            icon={ShoppingBag}
                            color="text-orange-400"
                        />
                    </WidgetErrorBoundary>

                    <WidgetErrorBoundary title="Staff Efficiency">
                        <GlassKPICard
                            title="Staff Efficiency"
                            value={formatCurrency(metrics.totalEmployees > 0 ? metrics.totalNetworkRevenue / metrics.totalEmployees : 0)}
                            sub="Rev. Per Employee"
                            icon={Users}
                            color="text-pink-400"
                        />
                    </WidgetErrorBoundary>
                </div>

                {/* 5. SITE MATRIX + TOP PRODUCTS + ACTIVITY LOG */}
                <div className="col-span-1 md:col-span-4 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[400px]">
                    {/* Site Matrix - Spans 2 cols */}
                    <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 overflow-hidden flex flex-col relative">
                        <WidgetErrorBoundary title="Network Performance">
                            {sitePerformance.length === 0 && <EmptyState message="No sites connected" />}

                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <MapIcon className="text-blue-400" size={20} />
                                Network Performance
                            </h3>
                            <div className="overflow-y-auto custom-scrollbar pr-2">
                                <div className="space-y-3">
                                    {sitePerformance.map((site) => (
                                        <div key={site.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl hover:bg-white/5 transition-colors border border-white/5 group">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${site.type === 'Warehouse' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    <Package size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{site.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{site.type} • {site.staffCount} Staff</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono font-bold text-green-400 text-sm">{formatCurrency(site.revenue)}</p>
                                                {site.lowStock > 0 && (
                                                    <p className="text-[10px] font-bold text-red-400 flex items-center justify-end gap-1">
                                                        <AlertTriangle size={10} /> {site.lowStock} Alerts
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setActiveSite(site.id)}
                                                aria-label={`Manage ${site.name}`}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-cyber-primary hover:text-black rounded-lg text-white"
                                            >
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </WidgetErrorBoundary>
                    </div>

                    {/* Top Products - Spans 1 col */}
                    <div className="lg:col-span-1">
                        <WidgetErrorBoundary title="Top Products">
                            <TopProductsWidget products={topProducts} />
                        </WidgetErrorBoundary>
                    </div>

                    {/* Activity Log - Spans 1 col */}
                    <div className="lg:col-span-1 flex flex-col gap-6 h-full">
                        <div className="h-full">
                            <WidgetErrorBoundary title="System Activity">
                                <ActivityLogWidget logs={systemLogs} />
                            </WidgetErrorBoundary>
                        </div>
                    </div>
                </div>

                {/* 6. CATEGORY SALES & QUICK STATS ROW */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 flex flex-col overflow-hidden relative">
                        <WidgetErrorBoundary title="Category Performance">
                            {revenueByCategory.length === 0 && <EmptyState message="No category data" />}

                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Layers className="text-yellow-400" size={18} />
                                Category Sales
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueByCategory} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fill: chartAxisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }}
                                            itemStyle={{ color: tooltipText }}
                                        />
                                        <Bar dataKey="value" fill="#f59e0b" barSize={12} radius={[0, 4, 4, 0]}>
                                            <Cell fill="#f59e0b" />
                                            <Cell fill="#eab308" />
                                            <Cell fill="#fbbf24" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </WidgetErrorBoundary>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 h-full">
                        {/* REPLACED WMS Accuracy with SYSTEM LOAD WIDGET */}
                        <SystemLoadWidget />

                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-5 flex flex-col justify-center items-center text-center hover:bg-white/10 transition-colors">
                            <Clock className="text-blue-400 mb-2" size={24} />
                            <p className="text-xs text-gray-500 font-bold uppercase">Cycle Time</p>
                            <p className="text-xl font-mono font-bold text-white">{metrics?.avgCycleTime || '0m'}</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-5 flex flex-col justify-center items-center text-center hover:bg-white/10 transition-colors">
                            <Users className="text-purple-400 mb-2" size={24} />
                            <p className="text-xs text-gray-500 font-bold uppercase">Active Staff</p>
                            <p className="text-xl font-mono font-bold text-white">{metrics?.activeEmployees || 0}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-5 flex flex-col justify-center items-center text-center hover:bg-white/10 transition-colors">
                            <Truck className="text-orange-400 mb-2" size={24} />
                            <p className="text-xs text-gray-500 font-bold uppercase">Inbound POs</p>
                            <p className="text-xl font-mono font-bold text-white">{metrics?.inboundPOs || 0}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
