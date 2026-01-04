import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { useNavigate } from 'react-router-dom';
import { generateQuarterlyReport } from '../utils/reportGenerator';
import { productsService } from '../services/supabase.service'; // Added service import
import {
    Users, TrendingUp, AlertTriangle, Map as MapIcon, DollarSign,
    ShoppingBag, Truck, Activity, ArrowRight, BarChart3, PieChart as PieChartIcon,
    Target, Award, ShoppingCart, Zap, Globe, Package, Box, Layers, Clock, ShieldCheck,
    Cpu, Server, Radio, Terminal, Undo, UserPlus, Download
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { CURRENCY_SYMBOL } from '../constants';
import { calculateMetrics, formatCurrency, METRIC_ROUTES, DashboardMetrics } from '../utils/metrics';
import { formatCompactNumber, formatDateTime, formatRelativeTime } from '../utils/formatting';
import WidgetErrorBoundary from '../components/WidgetErrorBoundary';
import DashboardSkeleton from '../components/DashboardSkeleton';
import PointsPerformanceDashboard from '../components/PointsPerformanceDashboard';

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
        return formatDateTime(date, { showTime: true }).split(', ')[1];
    };

    const formatDate = (date: Date) => {
        return formatDateTime(date).toUpperCase();
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
                {formatDate(time)}
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

    const metrics = [
        { label: 'CPU CORE_01', value: load.cpu, color: 'cyan', text: 'text-cyan-400', bg: 'bg-cyan-500', from: 'from-cyan-600', to: 'to-cyan-400' },
        { label: 'MEM_ALLOC', value: load.mem, color: 'purple', text: 'text-purple-400', bg: 'bg-purple-500', from: 'from-purple-600', to: 'to-purple-400' },
        { label: 'NET_THROUGHPUT', value: load.net, unit: ' MB/s', color: 'green', text: 'text-green-400', bg: 'bg-green-500', from: 'from-green-600', to: 'to-green-400' }
    ];

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] h-full w-full min-w-0">
            <div className="flex items-center justify-between mb-4 relative z-10 w-full">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors shrink-0">
                        <Server className="text-cyan-400" size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest block truncate">Status</span>
                        <span className="text-[9px] text-cyan-400 font-mono tracking-wider truncate block">OPTIMAL</span>
                    </div>
                </div>
                <div className="flex gap-1.5">
                    <span className="w-1.5 h-6 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
                    <span className="w-1.5 h-4 bg-cyan-500/40 rounded-full my-auto"></span>
                    <span className="w-1.5 h-2 bg-cyan-500/20 rounded-full my-auto"></span>
                </div>
            </div>

            <div className="space-y-5 relative z-10">
                {metrics.map((m, i) => (
                    <div key={i} className="group/bar">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1.5 tracking-wider">
                            <span>{m.label}</span>
                            <span className={`${m.text} font-mono text-xs group-hover/bar:scale-110 transition-transform`}>
                                {m.value}{m.unit || '%'}
                            </span>
                        </div>
                        <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                            {/* eslint-disable-next-line react/forbid-dom-props */}
                            <div
                                className={`h-full bg-gradient-to-r ${m.from} ${m.to} shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out relative`}
                                style={{ width: `${m.value}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Background FX */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-colors duration-700"></div>
        </div>
    );
};

// --- NEW COMPONENT: Stat Card ---
const StatCard = ({ icon: Icon, title, value, color, delay }: any) => {
    // Map color props to distinct Tailwind classes to ensure they exist/purge correctly
    const colorStyles: any = {
        blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'bg-blue-500/20', hoverBorder: 'hover:border-blue-500/30' },
        purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'bg-purple-500/20', hoverBorder: 'hover:border-purple-500/30' },
        orange: { icon: 'text-orange-400', bg: 'bg-orange-500/10', glow: 'bg-orange-500/20', hoverBorder: 'hover:border-orange-500/30' },
        green: { icon: 'text-green-400', bg: 'bg-green-500/10', glow: 'bg-green-500/20', hoverBorder: 'hover:border-green-500/30' },
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <div className={`relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-3 flex flex-col justify-center items-center text-center group hover:bg-white/10 transition-all duration-500 ${style.hoverBorder} hover:shadow-lg h-full w-full min-w-0`}>
            <div className={`p-2.5 rounded-2xl ${style.bg} mb-2 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 relative shrink-0`}>
                <Icon className={style.icon} size={20} />
                <div className={`absolute inset-0 ${style.glow} blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            </div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5 group-hover:text-gray-300 transition-colors w-full truncate px-1">{title}</p>
            <p className="text-lg font-mono font-bold text-white group-hover:scale-105 transition-transform w-full truncate px-1">{value}</p>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </div>
    );
};

// --- NEW COMPONENT: Dashboard Section Wrapper ---
const DashboardSection = ({ title, icon: Icon, children, className = "" }: { title: string, icon: any, children: React.ReactNode, className?: string }) => (
    <div className={`space-y-4 mb-12 ${className}`}>
        <div className="flex items-center gap-3 px-2">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                <Icon size={16} className="text-gray-400" />
            </div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">{title}</h2>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
        </div>
        {children}
    </div>
);

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
                                    {formatRelativeTime(log.created_at || log.timestamp)}
                                </div>
                            </div>
                            <div>
                                <p className="text-white text-xs font-bold leading-tight">{log.action}</p>
                                <p className="text-[10px] text-gray-500 leading-tight">{log.details} • <span className="text-gray-400">{(log.user_name || log.user)?.split(' ')[0]}</span></p>
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
                    <Zap className="text-yellow-400" size={16} />
                    Top Performing Products
                </h3>
            </div>

            <div className="space-y-2 relative z-10 overflow-y-auto custom-scrollbar pr-1">
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
                                {/* eslint-disable-next-line react/forbid-dom-props */}
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

// --- DATE TYPES ---
import { useDateFilter, DateRangeOption } from '../hooks/useDateFilter';
import DateRangeSelector from '../components/DateRangeSelector';
import FiscalYearDeck from '../components/FiscalYearDeck';

export default function CentralOperations() {
    const { sites, employees, allSales, allOrders, allProducts, setActiveSite, jobs, systemLogs, activeSite, workerPoints, storePoints } = useData();
    const { loading, theme } = useStore();
    const navigate = useNavigate();

    // --- SERVER-SIDE METRICS ---
    const [serverMetrics, setServerMetrics] = useState<any>(null); // Inventory Snapshot
    const [serverFinancials, setServerFinancials] = useState<any>(null); // Date-Filtered Financials

    // Default to 'This Quarter' as requested
    const defaultRange: DateRangeOption = 'This Quarter';
    const { dateRange, setDateRange, isWithinRange, startDate: filterStartDate, endDate: filterEndDate } = useDateFilter(defaultRange);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // 1. Fetch Inventory Snapshot (Always current)
                const invData = await productsService.getMetrics();
                setServerMetrics(invData);

                // 2. Fetch Financials (Filtered by Date)
                // Need to convert Date objects to string matching SQL timestamp if filterStartDate is valid
                const startStr = filterStartDate ? filterStartDate.toISOString() : undefined;
                const endStr = filterEndDate ? filterEndDate.toISOString() : undefined;

                const finData = await productsService.getFinancialMetrics(undefined, startStr, endStr);
                setServerFinancials(finData);
            } catch (err) {
                console.error('Failed to load server metrics:', err);
            }
        };
        fetchMetrics();
    }, [dateRange, filterStartDate, filterEndDate]);

    // --- DATE FILTERING STATE ---
    // Default to 'This Quarter' as requested
    // const defaultRange: DateRangeOption = 'This Quarter'; // Removed duplicate
    // const { dateRange, setDateRange, isWithinRange } = useDateFilter(defaultRange); // Removed duplicate call

    // --- REPORT GENERATION ---
    // Use metrics calculated below for report
    const handleGenerateReport = () => {
        // Calculating metrics here again just for report generation context if needed, or pass current metrics
        // ideally we regenerate metrics based on filter for the report
        const filteredMetrics = calculateMetrics(
            allSales.filter(s => isWithinRange(s.date)),
            allProducts, // Products usually snapshot, not filtered by date unless 'created_at'
            jobs.filter(j => isWithinRange(j.createdAt || '')),
            allOrders.filter(o => isWithinRange(o.date || o.createdAt || '')),
            employees, // Employees typically active/inactive, not date range filtered for metrics usually
            [], // Movements not loaded globally usually
            undefined
        );
        generateQuarterlyReport(filteredMetrics, dateRange, 'Operations');
    };

    // --- FILTERED DATA ---
    const filteredSales = useMemo(() => (allSales || []).filter(s => isWithinRange(s.date)), [allSales, dateRange]);
    const filteredOrders = useMemo(() => (allOrders || []).filter(o => isWithinRange(o.createdAt || new Date().toISOString())), [allOrders, dateRange]);



    // --- LOADING STATE ---
    if (loading) {
        return <DashboardSkeleton />;
    }

    // --- AGGREGATED METRICS (Using Filtered Data) ---
    const metrics: DashboardMetrics = useMemo(() => {
        try {
            return calculateMetrics(
                filteredSales,
                allProducts || [], // Products are snapshot state, usually not filtered by transaction date unless "Inventory Movement"
                jobs || [],
                filteredOrders,
                employees || [], // Employees are snapshot
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
    }, [filteredSales, allProducts, jobs, filteredOrders, employees]); // Deps updated

    // Use filtered METRICS for Financials to respect Date Range
    // Modified to prefer Server-Side Filtered Financials if available, then Client-Side Filtered
    const totalRevenue = serverFinancials?.total_revenue !== undefined ? serverFinancials.total_revenue : (metrics?.totalNetworkRevenue || 0);
    const totalEmployees = metrics?.totalEmployees || 0;
    const totalSites = sites?.length || 0;
    const activeAlerts = serverMetrics?.active_alerts !== undefined ? serverMetrics.active_alerts : (metrics?.activeAlerts || 0);

    // Override with Server-Side Accurate Metric if available (Inventory Value is snapshot based, usually current)
    const inventoryValue = serverMetrics?.total_value_cost || metrics?.totalNetworkStockValue || 0;
    const avgOrderValue = metrics?.avgBasket || 0;

    // Stock Status Data (Server-Side Snapshot)
    const stockStatusData = useMemo(() => {
        if (serverMetrics) {
            return [
                { name: 'Optimal', value: serverMetrics.total_count - (serverMetrics.low_stock_count + serverMetrics.out_of_stock_count), color: '#10b981' },
                { name: 'Low Stock', value: serverMetrics.low_stock_count, color: '#f59e0b' },
                { name: 'Out of Stock', value: serverMetrics.out_of_stock_count, color: '#ef4444' },
            ].filter(d => d.value > 0);
        }

        // Fallback
        const goodStock = (allProducts || []).filter(p => p.stock >= 10 && p.status !== 'out_of_stock').length;
        const lowStock = (allProducts || []).filter(p => (p.stock < 10 && p.stock > 0) || p.status === 'low_stock').length;
        const outStock = (allProducts || []).filter(p => p.stock === 0 || p.status === 'out_of_stock').length;

        return [
            { name: 'Optimal', value: goodStock, color: '#10b981' },
            { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
            { name: 'Out of Stock', value: outStock, color: '#ef4444' },
        ].filter(d => d.value > 0);
    }, [allProducts, metrics, serverMetrics]);

    // --- SITE PERFORMANCE (Filtered) ---
    // Fallback logic for site performance when server metrics are not loaded or incomplete
    const sitePerformance: SitePerformance[] = useMemo(() => {
        if (!sites || !filteredSales || !employees || !allProducts) return [];

        // Filter out Administration/HQ sites
        const operationalSites = sites.filter(s => s.type !== 'Administration' && s.type !== 'HQ' && s.type !== 'Administrative');

        return operationalSites.map(site => {
            const siteSales = filteredSales.filter(s => s.siteId === site.id);
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
    }, [sites, filteredSales, employees, allProducts]);

    // If server metrics available, use them directly for charts
    const revenueBySiteData = useMemo(() => {
        // REMOVED serverMetrics override to ensure Date Range filtering works
        // if (serverMetrics?.site_performance) { return serverMetrics.site_performance; }

        if (!sitePerformance) return [];
        return sitePerformance.slice(0, 10).map(site => ({
            name: site.name.length > 15 ? site.name.substring(0, 12) + '...' : site.name,
            revenue: site.revenue,
            transactions: site.transactionCount
        }));
    }, [sitePerformance]);

    const revenueByCategory = useMemo(() => {
        // REMOVED serverMetrics override to ensure Date Range filtering works
        // if (serverMetrics?.sales_by_category) { return serverMetrics.sales_by_category; }

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

    // --- TOP PRODUCTS (Filtered) ---
    const topProducts = useMemo(() => {
        // REMOVED serverMetrics override to ensure Date Range filtering works
        // if (serverMetrics?.top_products) { return serverMetrics.top_products; }

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
            className="group relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
        >
            <div className={`absolute -right-10 -top-10 p-16 rounded-full ${color.replace('text-', 'bg-')}/10 blur-3xl group-hover:blur-[60px] transition-all duration-700`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3.5 rounded-2xl ${color.replace('text-', 'bg-')}/10 text-white border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} className={color} />
                </div>
                {trend && (
                    <span className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur-sm ${trend.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                        <TrendingUp size={10} className={`mr-1 ${trend.startsWith('-') ? 'rotate-180' : ''}`} /> {trend}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl lg:text-3xl font-mono font-bold text-white tracking-tight truncate drop-shadow-sm">
                    {typeof value === 'number' ? formatCompactNumber(value) : value}
                </h3>
                {sub && <p className="text-[11px] text-gray-500 mt-2 font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-gray-600"></span>{sub}</p>}
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
                    {/* NEW DATE SELECTOR */}
                    <DateRangeSelector
                        value={dateRange}
                        onChange={setDateRange}
                        className="hidden md:block"
                    />

                    <CyberClock />

                    <div className="text-right px-6 py-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 h-[42px] flex flex-col justify-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-none mb-0.5">Active Sites</p>
                        <p className="text-lg font-mono font-bold text-white leading-none">{totalSites}</p>
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        className="hidden md:flex items-center gap-2 bg-cyber-primary text-black px-4 py-2.5 rounded-xl font-bold hover:bg-cyber-primary/90 transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] h-[42px]"
                    >
                        <Download size={18} />
                        <span className="hidden lg:inline">Report</span>
                    </button>
                </div>
            </div>

            {/* --- SYSTEM TICKER --- */}
            <SystemTicker />

            {/* --- FISCAL YEAR DECK (Condition: Year View) --- */}
            {(dateRange === 'This Year' || dateRange === 'Last Year') && (
                <div className="max-w-[1700px] mx-auto mb-6">
                    <FiscalYearDeck
                        year={dateRange === 'Last Year' ? new Date().getFullYear() - 1 : new Date().getFullYear()}
                        currentQuarter={dateRange === 'Last Year' ? 4 : Math.floor(new Date().getMonth() / 3) + 1}
                        metrics={{
                            q1: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() < 3 }).reduce((a, b) => a + b.total, 0), { currency: '$' }), label: 'Revenue', trend: '+10%' },
                            q2: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() >= 3 && d.getMonth() < 6 }).reduce((a, b) => a + b.total, 0), { currency: '$' }), label: 'Revenue' },
                            q3: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() >= 6 && d.getMonth() < 9 }).reduce((a, b) => a + b.total, 0), { currency: '$' }), label: 'Revenue' },
                            q4: { value: formatCompactNumber(filteredSales.filter(s => { const d = new Date(s.date); return d.getMonth() >= 9 }).reduce((a, b) => a + b.total, 0), { currency: '$' }), label: 'Revenue' }
                        }}
                    />
                </div>
            )}

            {/* --- BENTO GRID LAYOUT --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-[1700px] mx-auto">

                {/* 1. FINANCIAL COMMAND CENTER */}
                <DashboardSection title="Financial Command Center" icon={DollarSign} className="col-span-1 md:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <WidgetErrorBoundary title="Total Revenue">
                            <GlassKPICard
                                title={dateRange === 'All Time' ? "Total Revenue" : `${dateRange} Revenue`}
                                value={formatCompactNumber(serverFinancials?.total_revenue !== undefined ? serverFinancials.total_revenue : metrics.totalNetworkRevenue, { currency: CURRENCY_SYMBOL })}
                                trend="+12.5%"
                                sub="vs. Last Month"
                                icon={DollarSign}
                                color="text-green-400"
                            />
                        </WidgetErrorBoundary>
                        <WidgetErrorBoundary title="Net Profit">
                            <GlassKPICard
                                title="Net Profit"
                                value={formatCompactNumber(serverFinancials?.net_profit !== undefined ? serverFinancials.net_profit : metrics.netProfit, { currency: CURRENCY_SYMBOL })}
                                trend={(serverFinancials?.net_profit || metrics.netProfit) > 0 ? "+15%" : "-2%"}
                                sub="Net Earnings"
                                icon={Award}
                                color="text-emerald-400"
                            />
                        </WidgetErrorBoundary>
                        <WidgetErrorBoundary title="Profit Margin">
                            <GlassKPICard
                                title="Profit Margin"
                                value={serverFinancials?.profit_margin !== undefined ? `${serverFinancials.profit_margin}%` : `${metrics.profitMargin.toFixed(1)}%`}
                                trend="+1.2%"
                                sub="Efficiency Rate"
                                icon={TrendingUp}
                                color="text-teal-400"
                            />
                        </WidgetErrorBoundary>
                        <WidgetErrorBoundary title="Inventory Value">
                            <GlassKPICard
                                title="Network Asset Value"
                                value={formatCompactNumber(inventoryValue, { currency: CURRENCY_SYMBOL })}
                                trend="+5.2%"
                                sub={`Valued at Base Cost (Retail: ${formatCompactNumber(metrics.totalNetworkStockValueRetail, { currency: CURRENCY_SYMBOL })})`}
                                icon={Package}
                                color="text-blue-400"
                            />
                        </WidgetErrorBoundary>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[400px]">
                        {/* Revenue Velocity Chart */}
                        <div className="lg:col-span-3 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
                            <WidgetErrorBoundary title="Revenue Chart">
                                {revenueBySiteData.length === 0 && <EmptyState message="No revenue data available" />}
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Activity className="text-cyber-primary" size={20} />
                                        Revenue Velocity <span className="text-xs font-normal text-gray-500 ml-2">(Top 10 Sites)</span>
                                    </h3>
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
                                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, backdropFilter: 'blur(10px)', border: `1px solid ${tooltipBorder}`, borderRadius: '12px' }} itemStyle={{ color: tooltipText, fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="revenue" stroke="#00ff9d" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </WidgetErrorBoundary>
                        </div>

                        {/* Category Sales Bar Chart */}
                        <div className="lg:col-span-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 flex flex-col overflow-hidden relative">
                            <WidgetErrorBoundary title="Category Performance">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                                    <Layers className="text-yellow-400" size={18} />
                                    Category Sales
                                </h3>
                                <div className="flex-1 w-full min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueByCategory} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fill: chartAxisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}` }} itemStyle={{ color: tooltipText }} />
                                            <Bar dataKey="value" fill="#f59e0b" barSize={12} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </WidgetErrorBoundary>
                        </div>
                    </div>
                </DashboardSection>

                {/* 2. INVENTORY & LOGISTICS HUB */}
                <DashboardSection title="Inventory & Logistics Hub" icon={Box} className="col-span-1 md:col-span-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <WidgetErrorBoundary title="Active Orders">
                            <GlassKPICard
                                title="Active Orders"
                                value={serverMetrics?.active_orders !== undefined ? serverMetrics.active_orders : (allOrders.filter(o => o.status !== 'Received' && o.status !== 'Cancelled').length)}
                                trend="-2.4%"
                                sub="Pending Fulfillment"
                                icon={ShoppingCart}
                                color="text-purple-400"
                            />
                        </WidgetErrorBoundary>
                        <WidgetErrorBoundary title="Return Rate">
                            <GlassKPICard
                                title="Return Rate"
                                value={serverMetrics?.return_rate !== undefined ? `${serverMetrics.return_rate}%` : `${metrics.returnRate.toFixed(1)}%`}
                                trend={metrics.returnRate < 2 ? "-0.5%" : "+0.2%"}
                                sub={`${formatCompactNumber(serverMetrics?.total_returned_value || metrics.totalReturnedValue, { currency: CURRENCY_SYMBOL })} Refunded`}
                                icon={Undo}
                                color="text-rose-400"
                            />
                        </WidgetErrorBoundary>
                        <WidgetErrorBoundary title="Cycle Time">
                            <GlassKPICard
                                title="Avg. Cycle Time"
                                value={serverMetrics?.avg_cycle_time || metrics?.avgCycleTime || '0m'}
                                trend="-12%"
                                sub="Processing Speed"
                                icon={Clock}
                                color="text-blue-400"
                            />
                        </WidgetErrorBoundary>
                        <WidgetErrorBoundary title="Inbound POs">
                            <GlassKPICard
                                title="Inbound POs"
                                value={serverMetrics?.inbound_pos !== undefined ? serverMetrics.inbound_pos : (metrics?.inboundPOs || 0)}
                                trend="+5%"
                                sub="Pending Shipments"
                                icon={Truck}
                                color="text-orange-400"
                            />
                        </WidgetErrorBoundary>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[400px]">
                        {/* Stock Health */}
                        <div className="lg:col-span-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 relative flex flex-col">
                            <WidgetErrorBoundary title="Stock Health">
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
                                    <PieChartIcon className="text-purple-400" size={16} />
                                    Stock Health
                                </h3>
                                <div className="flex-1 w-full min-h-0 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={stockStatusData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                                {stockStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
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

                        {/* Critical Alerts */}
                        <div className="lg:col-span-1 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 relative flex flex-col justify-between group">
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

                        {/* Top Products */}
                        <div className="lg:col-span-2">
                            <WidgetErrorBoundary title="Top Products">
                                <TopProductsWidget products={topProducts} />
                            </WidgetErrorBoundary>
                        </div>
                    </div>
                </DashboardSection>

                {/* 3. NETWORK & RESOURCE MANAGEMENT */}
                <DashboardSection title="Network & Resource Management" icon={MapIcon} className="col-span-1 md:col-span-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Site Matrix */}
                        <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 overflow-hidden flex flex-col relative h-[400px]">
                            <WidgetErrorBoundary title="Network Performance">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <MapIcon className="text-blue-400" size={20} />
                                    Network Performance
                                </h3>
                                <div className="overflow-y-auto custom-scrollbar pr-2">
                                    <div className="space-y-3">
                                        {sitePerformance.map((site) => (
                                            <div key={site.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 border border-white/5 group hover:border-white/20 hover:shadow-lg hover:shadow-black/20 hover:-translate-x-1 cursor-pointer">
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
                                                    <p className="font-mono font-bold text-green-400 text-sm">{formatCompactNumber(site.revenue, { currency: CURRENCY_SYMBOL })}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </WidgetErrorBoundary>
                        </div>

                        {/* KPIs */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <WidgetErrorBoundary title="Staff Efficiency">
                                <GlassKPICard
                                    title="Staff Efficiency"
                                    value={formatCompactNumber(metrics.totalEmployees > 0 ? metrics.totalNetworkRevenue / metrics.totalEmployees : 0, { currency: CURRENCY_SYMBOL })}
                                    sub="Rev. Per Employee"
                                    icon={Users}
                                    color="text-pink-400"
                                />
                            </WidgetErrorBoundary>
                            <WidgetErrorBoundary title="Active Staff">
                                <GlassKPICard
                                    title="Active Staff"
                                    value={metrics?.activeEmployees || 0}
                                    sub="Currently On-Site"
                                    icon={Users}
                                    color="text-purple-400"
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
                            <WidgetErrorBoundary title="Inbound Velocity">
                                <GlassKPICard
                                    title="Arrival Rate"
                                    value="8.2"
                                    sub="Shipments / Day"
                                    icon={Truck}
                                    color="text-cyan-400"
                                />
                            </WidgetErrorBoundary>
                        </div>
                    </div>
                </DashboardSection>

                {/* 4. OPERATIONAL PERFORMANCE & GAMIFICATION */}
                <PointsPerformanceDashboard
                    workerPoints={workerPoints}
                    storePoints={storePoints}
                />

                {/* 5. SYSTEM MONITORING & AUDIT */}
                <DashboardSection title="System Monitoring & Audit" icon={Activity} className="col-span-1 md:col-span-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                        <WidgetErrorBoundary title="System Load">
                            <SystemLoadWidget />
                        </WidgetErrorBoundary>
                        <WidgetErrorBoundary title="Live Activity Log">
                            <ActivityLogWidget logs={systemLogs} />
                        </WidgetErrorBoundary>
                    </div>
                </DashboardSection>
            </div>

        </div>
    );
}
