import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpDown, MoreHorizontal, AlertTriangle, FileText, Download, Printer, Box, Trash2, Edit, RefreshCw, Truck, Map, TrendingUp, Layout, ClipboardList, Thermometer, Shield, XCircle, DollarSign, ChevronDown, Minus, Barcode, Package } from 'lucide-react';
import { formatCompactNumber } from '../utils/formatting';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { MOCK_ZONES, CURRENCY_SYMBOL } from '../constants';
import { Product, StockMovement, TransferRecord, TransferItem } from '../types';
import Modal from '../components/Modal';
import LabelPrintModal from '../components/LabelPrintModal';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { Protected, ProtectedButton } from '../components/Protected';
import { filterBySite } from '../utils/locationAccess';
import { native } from '../utils/native';
import { generateUniqueSKU, isSKUUnique } from '../utils/skuUtils';
import { generateInternalBarcode } from '../utils/barcodeNumberGenerator';

type Tab = 'overview' | 'stock' | 'zones' | 'movements';

// --- COLORS & HELPERS ---
const COLORS = ['#00ff9d', '#3b82f6', '#f59e0b', '#ef4444'];

// ABC Analysis Helper
const getABCClass = (product: Product, totalValue: number) => {
    const prodValue = product.price * product.stock;
    const share = prodValue / totalValue;
    if (share > 0.05) return 'A'; // High Value
    if (share > 0.02) return 'B'; // Medium Value
    return 'C'; // Low Value
};

export default function Inventory() {
    const { user } = useStore();
    const { products, allProducts, sites, movements, addProduct, updateProduct, deleteProduct, adjustStock, activeSite, setActiveSite, transfers, requestTransfer, shipTransfer, receiveTransfer, addNotification, refreshData } = useData();
    const navigate = useNavigate();

    // --- READ-ONLY & PERMISSIONS ---
    // Rule: Warehouses & DCs have write access. Stores & Admin (HQ) are Read-Only.
    const isReadOnly = useMemo(() => {
        if (!activeSite) return true; // Global/HQ View is Read-Only
        const type = activeSite.type;
        // Only Warehouses and DCs can edit inventory
        return !(type === 'Warehouse' || type === 'Distribution Center');
    }, [activeSite]);

    // 🔒 LOCATION-BASED ACCESS CONTROL
    // If Read-Only (Super Admin, Store, HQ): Show ALL products (Global View) to allow lookup
    // If Write Access (Warehouse): Show only the active site's products
    const filteredProducts = useMemo(() => {
        if (isReadOnly) return allProducts;
        return filterBySite(products, user?.role || 'pos', activeSite?.id || '');
    }, [products, allProducts, isReadOnly, user?.role, activeSite]);

    // PDA Mode Detection
    const isNativeApp = native.isNative();

    // Default to 'stock' tab for PDA, 'overview' for desktop
    const [activeTab, setActiveTab] = useState<Tab>(isNativeApp ? 'stock' : 'overview');

    // --- FILTER STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: 'All',
        status: 'All',
        abc: 'All',
        priceRange: 'All', // 0-100, 100-1000, 1000+
        siteId: 'All' // New Location Filter
    });

    // --- SELECTION STATE ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // --- MODAL STATE ---
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isPrintHubOpen, setIsPrintHubOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [deleteInput, setDeleteInput] = useState('');

    const [isShipModalOpen, setIsShipModalOpen] = useState(false);
    const [transferToShip, setTransferToShip] = useState<string | null>(null);

    // Form State
    const [skuInput, setSkuInput] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [adjustQty, setAdjustQty] = useState<string>('');
    const [adjustReason, setAdjustReason] = useState<string>('Stock Correction');
    const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');

    // Transfer Form State
    const [transferTargetSite, setTransferTargetSite] = useState('');
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
    const [transferProdId, setTransferProdId] = useState('');
    const [transferQty, setTransferQty] = useState(1);

    // --- DATA PROCESSING ---
    const totalInventoryValue = filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);

    const filteredItems = useMemo(() => {
        return filteredProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = filters.category === 'All' || p.category === filters.category;
            const matchesStatus = filters.status === 'All' ||
                (filters.status === 'Active' && p.status === 'active') ||
                (filters.status === 'Low Stock' && p.status === 'low_stock') ||
                (filters.status === 'Out of Stock' && p.status === 'out_of_stock');

            const abc = getABCClass(p, totalInventoryValue);
            const matchesABC = filters.abc === 'All' || abc === filters.abc;

            // Site Filter Logic
            const matchesSite = filters.siteId === 'All' || p.siteId === filters.siteId || p.site_id === filters.siteId;

            return matchesSearch && matchesCat && matchesStatus && matchesABC && matchesSite;
        });
    }, [filteredProducts, searchTerm, filters, totalInventoryValue]); // Updated dependency

    // Analytics Data
    const categoryData = useMemo(() => {
        const data: Record<string, number> = {};
        // Use filteredItems for analytics to reflect site choice? 
        // Or keep it global? Usually filters affect the list. 
        // user probably wants to see analytics for selected "view" too.
        // Let's stick to filteredProducts (which is either Global or Active Site) for high level charts
        // unless we want charts to react to the dropdown?
        // Let's use filteredProducts for now to keep charts stable unless context changes.
        filteredProducts.forEach(p => { data[p.category] = (data[p.category] || 0) + (p.price * p.stock); });
        return Object.keys(data).map(k => ({ name: k, value: data[k] }));
    }, [filteredProducts]);

    const abcData = useMemo(() => {
        const counts = { A: 0, B: 0, C: 0 };
        filteredProducts.forEach(p => {
            const c = getABCClass(p, totalInventoryValue);
            counts[c as keyof typeof counts]++;
        });
        return [
            { name: 'Class A (Vital)', value: counts.A },
            { name: 'Class B (Important)', value: counts.B },
            { name: 'Class C (Standard)', value: counts.C },
        ];
    }, [filteredProducts, totalInventoryValue]);

    // --- HANDLERS ---

    const handleOpenAddProduct = () => {
        setEditingProduct(null);
        setSkuInput('');
        setIsProductModalOpen(true);
    };

    const handleOpenEditProduct = (product: Product) => {
        setEditingProduct(product);
        setSkuInput(product.sku);
        setBarcodeInput(product.barcode || '');
        setIsProductModalOpen(true);
    };

    const handleGenerateSKU = () => {
        const siteName = activeSite?.name || 'Central Operations';

        // Category prefix from the selected category in the form
        // Use a safer selection method or ref if possible, but existing code used querySelector
        const catSelect = document.querySelector('select[name="category"]') as HTMLSelectElement;
        const category = catSelect ? catSelect.value : 'GENERAL';

        const generated = generateUniqueSKU(siteName, category, products);
        setSkuInput(generated);
    };

    const handleGenerateBarcode = () => {
        // Generate a valid EAN-13 barcode for internal use (200 prefix)
        const generated = generateInternalBarcode(products);
        setBarcodeInput(generated);
        addNotification('success', `Generated internal barcode: ${generated} `);
    };

    const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const name = formData.get('name') as string;
        const price = parseFloat(formData.get('price') as string);

        if (!name || !skuInput || isNaN(price)) {
            addNotification('alert', "Please fill in required fields (Name, SKU, Price).");
            return;
        }

        // Check for duplicate SKU
        // Ensure we check against ALL products globally to avoid collisions
        if (!isSKUUnique(skuInput, products, editingProduct?.id)) {
            // Find the duplicate to show its name
            const duplicate = products.find(p => p.sku === skuInput && p.id !== (editingProduct?.id || ''));
            addNotification('alert', `SKU ${skuInput} is already in use by "${duplicate?.name}".`);
            return;
        }

        const newProduct: Product = {
            id: editingProduct ? editingProduct.id : `PROD - ${Math.floor(Math.random() * 10000)} `,
            siteId: activeSite?.id || user?.siteId || 'WH-001',
            name: name,
            sku: skuInput,
            barcode: barcodeInput || undefined, // External barcode from supplier
            barcodeType: barcodeInput ? (formData.get('barcodeType') as 'EAN-13' | 'UPC-A' | 'CODE128' | 'CODE39' | 'QR' | 'OTHER') : undefined,
            category: formData.get('category') as string,
            price: price,
            stock: parseInt(formData.get('stock') as string) || 0,
            location: formData.get('location') as string,
            expiryDate: formData.get('expiryDate') as string,
            status: (parseInt(formData.get('stock') as string) || 0) > 10 ? 'active' : 'low_stock',
            image: editingProduct?.image || 'https://picsum.photos/200/200?random=' + Math.floor(Math.random() * 100)
        };

        if (editingProduct) updateProduct(newProduct);
        else addProduct(newProduct);

        setIsProductModalOpen(false);
        setEditingProduct(null);
        setSkuInput('');
        setBarcodeInput('');
    };

    const handleDeleteProduct = (id: string) => {
        setProductToDelete(id);
        setDeleteInput('');
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!productToDelete) return;

        if (deleteInput !== "DELETE") {
            addNotification('alert', 'Please type "DELETE" to confirm.');
            return;
        }

        deleteProduct(productToDelete);
        addNotification('success', 'Product deleted permanently.');
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
        setDeleteInput('');
    };

    const handleOpenAdjust = (product: Product) => {
        setEditingProduct(product);
        setAdjustQty('');
        setIsAdjustModalOpen(true);
    };

    const handleSubmitAdjustment = () => {
        if (!editingProduct || !adjustQty) return;
        const qty = parseInt(adjustQty);
        if (isNaN(qty) || qty <= 0) return;

        adjustStock(editingProduct.id, qty, adjustType, adjustReason, user?.name || 'System');
        setIsAdjustModalOpen(false);
        setEditingProduct(null);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkAction = (action: string) => {
        if (action === 'Move Stock') {
            const itemsToTransfer: TransferItem[] = [];
            selectedIds.forEach(id => {
                const product = filteredProducts.find(p => p.id === id);
                if (product) {
                    itemsToTransfer.push({
                        productId: product.id,
                        productName: product.name,
                        sku: product.sku,
                        quantity: 1 // Default to 1 for bulk add
                    });
                }
            });
            setTransferItems(itemsToTransfer);
            setIsTransferModalOpen(true);
            return;
        }

        addNotification('info', `${action} triggered for ${selectedIds.size} items.`);
        setSelectedIds(new Set());
    };

    // Transfer Handlers
    const handleAddTransferItem = () => {
        if (!transferProdId) return;
        const product = filteredProducts.find(p => p.id === transferProdId);
        if (!product) return;

        setTransferItems(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: transferQty
        }]);
        setTransferProdId('');
        setTransferQty(1);
    };

    const handleSubmitTransfer = async () => {
        if (!transferTargetSite || transferItems.length === 0) {
            addNotification('alert', "Please select target site and add items.");
            return;
        }

        const targetSite = sites.find(s => s.id === transferTargetSite);

        const transfer: TransferRecord = {
            id: `TR - ${Date.now()} `,
            sourceSiteId: activeSite?.id || '',
            sourceSiteName: activeSite?.name || '',
            destSiteId: transferTargetSite,
            destSiteName: targetSite?.name || 'Unknown',
            status: 'Requested',
            date: new Date().toISOString().split('T')[0],
            items: transferItems
        };

        // IMPORTANT: Await the async requestTransfer to ensure state is updated
        // before closing the modal and allowing navigation
        await requestTransfer(transfer);

        setIsTransferModalOpen(false);
        setTransferItems([]);
        setTransferTargetSite('');
        // requestTransfer handles notification
    };

    const handleShip = (id: string) => {
        setTransferToShip(id);
        setIsShipModalOpen(true);
    };

    const handleConfirmShip = () => {
        if (transferToShip) {
            shipTransfer(transferToShip, user?.name || 'Admin');
            setIsShipModalOpen(false);
            setTransferToShip(null);
        }
    };

    // Receiving modal state
    const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
    const [receivingTransfer, setReceivingTransfer] = useState<TransferRecord | null>(null);
    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

    const handleReceive = (id: string) => {
        const transfer = transfers.find(t => t.id === id);
        if (!transfer) {
            addNotification('alert', 'Transfer not found');
            return;
        }

        // Check if already completed
        if (transfer.status === 'Completed') {
            addNotification('alert', 'Transfer has already been received');
            return;
        }

        // Initialize received quantities with expected quantities
        const initialQuantities: Record<string, number> = {};
        transfer.items.forEach(item => {
            initialQuantities[item.sku] = item.quantity;
        });
        setReceivedQuantities(initialQuantities);
        setReceivingTransfer(transfer);
        setIsReceivingModalOpen(true);
    };

    const handleConfirmReceive = async () => {
        if (!receivingTransfer) return;

        // Validate quantities
        const hasInvalidQuantities = Object.values(receivedQuantities).some(qty => typeof qty === 'number' && qty < 0);
        if (hasInvalidQuantities) {
            addNotification('alert', 'Quantities cannot be negative');
            return;
        }

        // Check if all quantities are zero
        const allZero = Object.values(receivedQuantities).every(qty => qty === 0);
        if (allZero) {
            addNotification('alert', 'Please enter at least one quantity to receive');
            return;
        }

        await receiveTransfer(receivingTransfer.id, user?.name || 'Admin', receivedQuantities);
        setIsReceivingModalOpen(false);
        setReceivingTransfer(null);
        setReceivedQuantities({});
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button onClick={() => setActiveTab(id)} className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'} `}>
            <Icon size={16} /><span>{label}</span>
        </button>
    );

    const MetricCard = ({ title, value, sub, icon: Icon, trend }: any) => (
        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-white/5 group-hover:bg-cyber-primary/10 transition-colors text-cyber-primary"><Icon size={20} /></div>
                {trend && <span className={`text-[10px] font-bold px-2 py-1 rounded ${trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} `}>{trend > 0 ? '+' : ''}{trend}%</span>}
            </div>
            <div><p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p><h3 className="text-2xl font-mono font-bold text-white mt-1">{value}</h3><p className="text-xs text-gray-500 mt-1">{sub}</p></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Box className="text-cyber-primary" />
                        {isReadOnly ? 'Global Inventory (Read-Only)' : `Inventory Command: ${activeSite?.name || 'Loading...'} `}
                    </h2>
                    <p className="text-gray-400 text-sm">Real-time stock intelligence and control.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsPrintHubOpen(true)}
                        className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/10 flex items-center transition-colors font-bold"
                    >
                        <Printer className="w-4 h-4 mr-2" /> Print Hub
                    </button>
                    {!isReadOnly && (
                        <Protected permission="ADD_PRODUCT">
                            <button
                                onClick={handleOpenAddProduct}
                                className="bg-cyber-primary text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-cyber-accent transition-colors flex items-center shadow-[0_0_15px_rgba(0,255,157,0.2)]"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Inbound Item
                            </button>
                        </Protected>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-cyber-gray p-1 rounded-xl border border-white/5 w-fit overflow-x-auto">
                <TabButton id="overview" label="Dashboard" icon={TrendingUp} />
                <TabButton id="stock" label="Master List" icon={Layout} />
                <TabButton id="zones" label="Zone Map" icon={Map} />
                <TabButton id="movements" label="Audit Log" icon={ClipboardList} />
            </div>

            {/* --- OVERVIEW TAB (ANALYTICS) --- */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard title="Total Asset Value" value={formatCompactNumber(totalInventoryValue, { currency: CURRENCY_SYMBOL })} sub="Current Valuation" icon={DollarSign} trend={12} />
                        <MetricCard title="Stock Turn Rate" value="4.2x" sub="Annualized" icon={RefreshCw} trend={5} />
                        <MetricCard title="Low Stock SKUs" value={filteredProducts.filter(p => p.status === 'low_stock').length} sub="Requires Action" icon={AlertTriangle} trend={-2} />
                        <MetricCard title="Dead Stock Value" value={`${CURRENCY_SYMBOL} 45K`} sub="> 90 Days No Move" icon={XCircle} />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Value by Category */}
                        <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-6">Valuation by Category</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                                    <BarChart data={categoryData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Bar dataKey="value" fill="#00ff9d" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ABC Analysis */}
                        <div className="bg-cyber-gray border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-6">ABC Classification</h3>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                                    <PieChart>
                                        <Pie data={abcData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {abcData.map((entry, index) => (
                                                <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 mt-4">
                                {abcData.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                            <span className="text-gray-300">{item.name}</span>
                                        </div>
                                        <span className="font-mono text-white font-bold">{item.value} SKUs</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STOCK TAB (MASTER LIST) --- */}
            {activeTab === 'stock' && (
                <div className="flex flex-col h-[calc(100vh-280px)]">
                    {/* Main List */}
                    <div className="flex-1 bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                        {/* Toolbar with Filters */}
                        <div className="p-4 border-b border-white/5 space-y-3">
                            {/* Search Bar */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 flex-1">
                                    <Search className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        aria-label="Search"
                                        placeholder="Search SKU, Name, Location..."
                                        className="bg-transparent border-none ml-3 flex-1 text-white outline-none placeholder-gray-500 text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="text-xs text-gray-400 font-mono whitespace-nowrap">
                                    {filteredItems.length} items
                                </div>
                            </div>

                            {/* Filter Dropdowns */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs text-gray-500 font-bold uppercase">Filters:</span>

                                {/* NEW: Site Location Filter (Global View Only) */}
                                {(!activeSite || isReadOnly) && (
                                    <div className="relative">
                                        <select
                                            value={filters.siteId}
                                            aria-label="Filter by Site"
                                            onChange={(e) => setFilters({ ...filters, siteId: e.target.value })}
                                            className="appearance-none bg-blue-900/20 border border-blue-500/30 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-blue-400 outline-none cursor-pointer hover:bg-blue-900/30 transition-colors"
                                        >
                                            <option value="All">All Locations</option>
                                            {sites.filter(s => s.type !== 'Store' && s.type !== 'Administration').map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-2.5 text-blue-400 pointer-events-none" />
                                    </div>
                                )}

                                {/* Category Filter */}
                                <div className="relative">
                                    <select
                                        value={filters.category}
                                        aria-label="Filter by Category"
                                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                        className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/10 transition-colors"
                                    >
                                        <option value="All">All Categories</option>
                                        {Array.from(new Set(filteredProducts.map(p => p.category))).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
                                </div>

                                {/* Status Filter */}
                                <div className="relative">
                                    <select
                                        value={filters.status}
                                        aria-label="Filter by Status"
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/10 transition-colors"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Active">In Stock</option>
                                        <option value="Low Stock">Low Stock</option>
                                        <option value="Out of Stock">Out of Stock</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
                                </div>

                                {/* Clear Filters */}
                                {(filters.category !== 'All' || filters.status !== 'All' || filters.abc !== 'All' || filters.siteId !== 'All') && (
                                    <button
                                        onClick={() => setFilters({ category: 'All', status: 'All', abc: 'All', priceRange: 'All', siteId: 'All' })}
                                        className="text-xs text-gray-400 hover:text-white underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bulk Action Bar */}
                        {selectedIds.size > 0 && (
                            <div className="bg-cyber-primary/10 border-b border-cyber-primary/20 p-2 flex items-center justify-between px-4 animate-in slide-in-from-top-2">
                                <span className="text-xs font-bold text-cyber-primary">{selectedIds.size} Selected</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleBulkAction('Print Labels')} className="px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded text-[10px] font-bold text-white">Print Labels</button>
                                    {!isReadOnly && (
                                        <Protected permission="TRANSFER_STOCK">
                                            <button onClick={() => handleBulkAction('Move Stock')} className="px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded text-[10px] font-bold text-white">Move</button>
                                        </Protected>
                                    )}
                                    <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-[10px] text-gray-400 hover:text-white">Clear</button>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-black/90 backdrop-blur-sm z-10 border-b border-white/10">
                                    <tr>
                                        <th className="p-4 w-10"><input type="checkbox" aria-label="Select All" className="accent-cyber-primary" onChange={() => {
                                            if (selectedIds.size === filteredItems.length) setSelectedIds(new Set());
                                            else setSelectedIds(new Set(filteredItems.map(i => i.id)));
                                        }} checked={selectedIds.size === filteredItems.length && filteredItems.length > 0} /></th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase">Product</th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase">Warehouse Location</th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-center">Stock</th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-right">Value</th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-center">Class</th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredItems.map((product) => {
                                        const abc = getABCClass(product, totalInventoryValue);
                                        const isSelected = selectedIds.has(product.id);
                                        return (
                                            <tr key={product.id} className={`hover: bg - white / 5 transition - colors group ${isSelected ? 'bg-cyber-primary/5' : ''} `}>
                                                <td className="p-4"><input type="checkbox" aria-label="Select row" className="accent-cyber-primary" checked={isSelected} onChange={() => toggleSelection(product.id)} /></td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <img src={product.image} alt="" className="w-12 h-12 rounded-lg bg-black object-cover border border-white/10" />
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{product.name}</p>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className="text-[10px] font-mono text-gray-500 bg-black/30 px-1.5 py-0.5 rounded">{product.sku}</span>
                                                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{product.category}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {(!activeSite || isReadOnly) ? (
                                                        // Global/Read-Only View: Show Site Name
                                                        (() => {
                                                            const site = sites.find(s => s.id === product.siteId || s.id === (product as any).site_id);
                                                            return site ? (
                                                                <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-400">
                                                                    🏢 {site.name}
                                                                </span>
                                                            ) : (
                                                                <span className="font-mono text-xs text-gray-500">Unknown Site</span>
                                                            );
                                                        })()
                                                    ) : (
                                                        // Active Warehouse View: Show Shelf/Bin Location
                                                        product.location ? (
                                                            <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg border bg-white/5 border-white/10 text-white">📍 {product.location}</span>
                                                        ) : (
                                                            <span className="font-mono text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30">⚠️ UNASSIGNED</span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`text-sm font-bold font-mono px-3 py-1 rounded-lg ${product.stock === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : product.stock < 10 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'}`}>{product.stock}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-sm font-mono text-white font-bold">{formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL })}</div>
                                                    <div className="text-[10px] text-gray-500 mt-0.5">Total: {formatCompactNumber(product.price * product.stock, { currency: CURRENCY_SYMBOL })}</div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto border-2 ${abc === 'A' ? 'border-green-500 text-green-500 bg-green-500/10' : abc === 'B' ? 'border-blue-500 text-blue-500 bg-blue-500/10' : 'border-gray-500 text-gray-500 bg-gray-500/10'}`}>{abc}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {!isReadOnly && (
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Protected permission="TRANSFER_STOCK">
                                                                <button onClick={() => { setTransferItems([{ productId: product.id, productName: product.name, sku: product.sku, quantity: 10 }]); setIsTransferModalOpen(true); }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-blue-400" title="Request Stock Transfer" aria-label="Request Stock Transfer"><Truck size={14} /></button>
                                                            </Protected>
                                                            <Protected permission="EDIT_PRODUCT">
                                                                <div className="flex items-center gap-2">
                                                                    <Protected permission="ADJUST_STOCK">
                                                                        <button onClick={() => handleOpenAdjust(product)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Adjust Stock" aria-label="Adjust Stock"><RefreshCw size={14} /></button>
                                                                    </Protected>
                                                                    <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400" title="Delete Product" aria-label="Delete Product"><Trash2 size={14} /></button>
                                                                    <button onClick={() => handleOpenEditProduct(product)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-yellow-400" title="Edit Product" aria-label="Edit Product"><Edit size={14} /></button>
                                                                </div>
                                                            </Protected>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredItems.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Box size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="font-bold">No products found</p>
                                    <p className="text-xs mt-2">Try adjusting your filters or search term</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* --- ZONE MAP (Interactive) --- */}
            {activeTab === 'zones' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {MOCK_ZONES.map((zone) => {
                        const usagePercent = (zone.occupied / zone.capacity) * 100;
                        let colorClass = "bg-cyber-primary";
                        if (usagePercent > 90) colorClass = "bg-red-500";
                        else if (usagePercent > 70) colorClass = "bg-yellow-400";

                        return (
                            <div key={zone.id} className="bg-cyber-gray border border-white/5 rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all">
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`p - 3 rounded - xl ${zone.type === 'Cold' ? 'bg-blue-500/10 text-blue-400' : zone.type === 'Secure' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyber-primary/10 text-cyber-primary'} `}>
                                            {zone.type === 'Cold' ? <Thermometer size={24} /> : zone.type === 'Secure' ? <Shield size={24} /> : <Box size={24} />}
                                        </div>
                                        <div><h3 className="font-bold text-white text-lg">{zone.name}</h3><p className="text-xs text-gray-500 uppercase tracking-wider">{zone.type} Storage</p></div>
                                    </div>
                                    <div className="text-right"><span className={`text - 2xl font - mono font - bold ${usagePercent > 90 ? 'text-red-400' : 'text-white'} `}>{usagePercent.toFixed(1)}%</span></div>
                                </div>
                                <div className="relative z-10">
                                    <div className="w-full bg-black/50 rounded-full h-4 border border-white/10 overflow-hidden relative">
                                        {/* eslint-disable-next-line react-dom/no-unsafe-inline-styles */}
                                        <div className={`h - full transition - all duration - 1000 ${colorClass} `} style={{ width: `${usagePercent}% ` }} />
                                    </div>
                                    {zone.temperature && <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm bg-blue-500/5 px-3 py-2 rounded-lg border border-blue-500/10 w-fit"><Thermometer size={14} /> <span>Current Temp: {zone.temperature}</span></div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- AUDIT LOG --- */}
            {activeTab === 'movements' && (
                <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5"><h3 className="font-bold text-white">Transactional Ledger</h3><p className="text-xs text-gray-400 mt-1">Immutable history of stock movements.</p></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-black/20 border-b border-white/5"><th className="p-4 text-xs text-gray-500 uppercase">Ref ID</th><th className="p-4 text-xs text-gray-500 uppercase">Time</th><th className="p-4 text-xs text-gray-500 uppercase">Type</th><th className="p-4 text-xs text-gray-500 uppercase">Product</th><th className="p-4 text-xs text-gray-500 uppercase text-right">Qty</th><th className="p-4 text-xs text-gray-500 uppercase">User</th><th className="p-4 text-xs text-gray-500 uppercase">Reason</th></tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {movements.map((move) => (
                                    <tr key={move.id} className="hover:bg-white/5">
                                        <td className="p-4 text-xs font-mono text-gray-400">{move.id}</td>
                                        <td className="p-4 text-xs text-white">{move.date}</td>
                                        <td className="p-4"><span className={`text - [10px] font - bold px - 2 py - 1 rounded uppercase border ${move.type === 'IN' ? 'text-green-400 border-green-400/20 bg-green-400/5' : move.type === 'OUT' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' : 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'} `}>{move.type}</span></td>
                                        <td className="p-4 text-sm text-white">{move.productName}</td>
                                        <td className={`p - 4 text - sm font - mono text - right font - bold ${move.type === 'IN' ? 'text-green-400' : 'text-white'} `}>{move.type === 'IN' ? '+' : ''}{move.quantity}</td>
                                        <td className="p-4 text-xs text-gray-300">{move.performedBy}</td>
                                        <td className="p-4 text-xs text-gray-500 italic">{move.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals - Add/Edit Product */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Inbound Stock Entry'} size="lg">
                <form onSubmit={handleSaveProduct} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Product Name</label><input aria-label="Product Name" name="name" defaultValue={editingProduct?.name} required className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary" /></div>
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Internal SKU</label><div className="flex gap-2"><input aria-label="SKU" name="sku" value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="Internal SKU..." required className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono" /><button type="button" onClick={handleGenerateSKU} className="px-3 bg-cyber-primary/20 text-cyber-primary rounded-lg" aria-label="Generate SKU" title="Generate SKU"><Barcode size={16} /></button></div></div>
                    </div>
                    {/* Barcode Fields - Supports both supplier barcodes AND internal generation */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Barcode</label>
                            <div className="flex gap-2">
                                <input
                                    aria-label="External Barcode"
                                    name="barcode"
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    placeholder="Scan or enter barcode..."
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateBarcode}
                                    className="px-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                    aria-label="Generate Barcode"
                                    title="Generate Internal Barcode (EAN-13)"
                                >
                                    <Barcode size={16} />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">
                                {barcodeInput?.startsWith('200')
                                    ? '🏷️ Internal barcode (generated)'
                                    : 'Scan supplier barcode or click button to generate'
                                }
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Barcode Type</label>
                            <select
                                aria-label="Barcode Type"
                                name="barcodeType"
                                defaultValue={editingProduct?.barcodeType || 'EAN-13'}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                disabled={!barcodeInput}
                            >
                                <option value="EAN-13">EAN-13</option>
                                <option value="UPC-A">UPC-A</option>
                                <option value="CODE128">CODE128</option>
                                <option value="CODE39">CODE39</option>
                                <option value="QR">QR Code</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Price ({CURRENCY_SYMBOL})</label><input aria-label="Price" name="price" type="number" defaultValue={editingProduct?.price} required className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono" /></div>
                        <div><label className="text-xs text-gray-400 uppercase font-bold">Stock Qty</label><input aria-label="Stock Quantity" name="stock" type="number" defaultValue={editingProduct?.stock || 0} required className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono" /></div>
                    </div>
                    <div><label className="text-xs text-gray-400 uppercase font-bold">Category</label><select aria-label="Category" name="category" defaultValue={editingProduct?.category || 'Electronics'} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"><option>Electronics</option><option>Beverages</option><option>Food</option><option>Fresh</option><option>Accessories</option></select></div>
                    <div><label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Warehouse Location</label><input aria-label="Warehouse Location" name="location" defaultValue={editingProduct?.location} placeholder="e.g., A-01-05" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono" /></div>
                    <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold">Cancel</button><button type="submit" className="flex-1 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl">Save</button></div>
                </form>
            </Modal>

            {/* Adjustment Modal */}
            <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Stock Adjustment">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3"><button onClick={() => setAdjustType('IN')} className={`p - 3 rounded - lg border text - sm font - bold flex items - center justify - center gap - 2 ${adjustType === 'IN' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-gray-400'} `}><Plus size={16} /> Add</button><button onClick={() => setAdjustType('OUT')} className={`p - 3 rounded - lg border text - sm font - bold flex items - center justify - center gap - 2 ${adjustType === 'OUT' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-gray-400'} `}><Minus size={16} /> Remove</button></div>
                    <input aria-label="Adjustment Quantity" type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-lg font-mono focus:border-cyber-primary" placeholder="Quantity" />
                    <button onClick={handleSubmitAdjustment} className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl">Confirm</button>
                </div>
            </Modal>

            {/* Label Print Modal */}
            <LabelPrintModal isOpen={isPrintHubOpen} onClose={() => setIsPrintHubOpen(false)} labels={Array.from(selectedIds).map(id => { const p = filteredProducts.find(p => p.id === id); return p ? { product: p, quantity: 1, location: p.location, receivedDate: new Date().toISOString().split('T')[0] } : null; }).filter(Boolean) as any[]} onPrint={() => { addNotification('success', `${selectedIds.size} labels sent.`); setIsPrintHubOpen(false); setSelectedIds(new Set()); }} />

            {/* Transfer Modal */}
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Request Stock Transfer" size="lg">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl"><p className="text-xs text-gray-500 uppercase font-bold mb-1">Source Location</p><p className="text-white font-bold">{activeSite?.name}</p></div>
                        <div><label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Destination Site</label><select aria-label="Destination Site" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" value={transferTargetSite} onChange={e => setTransferTargetSite(e.target.value)}><option value="">Select Site...</option>{sites.filter(s => s.id !== activeSite?.id).map(s => (<option key={s.id} value={s.id}>{s.name} ({s.type})</option>))}</select></div>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-xl p-4"><h4 className="text-sm font-bold text-white mb-3">Add Items</h4><div className="flex gap-3"><select aria-label="Select Product" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" value={transferProdId} onChange={e => setTransferProdId(e.target.value)}><option value="">Select Product...</option>{filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}</select><input aria-label="Transfer Quantity" type="number" className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center" value={transferQty} onChange={e => setTransferQty(parseInt(e.target.value) || 1)} min={1} /><button onClick={handleAddTransferItem} className="px-4 bg-cyber-primary/20 text-cyber-primary rounded-lg font-bold text-sm hover:bg-cyber-primary/30">Add</button></div></div>
                    <div className="min-h-[150px] bg-white/5 rounded-xl border border-white/5 overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-black/20 text-gray-500"><tr><th className="p-3">Product</th><th className="p-3 text-right">Qty</th><th className="p-3 w-10"></th></tr></thead><tbody className="divide-y divide-white/5">{transferItems.map((item, i) => (<tr key={i}><td className="p-3 text-white">{item.productName} <span className="text-gray-500 text-xs ml-2">{item.sku}</span></td><td className="p-3 text-right font-mono">{item.quantity}</td><td className="p-3 text-center"><button onClick={() => setTransferItems(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button></td></tr>))}</tbody></table></div>
                    <button onClick={handleSubmitTransfer} className="w-full py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors shadow-lg shadow-cyber-primary/20">Submit Transfer Request</button>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20"><AlertTriangle size={24} /><div><h3 className="font-bold text-white">Warning: Permanent Action</h3><p className="text-xs opacity-80">This product will be permanently removed.</p></div></div>
                    <p className="text-sm text-gray-300">Type <span className="font-bold text-white">DELETE</span> below:</p>
                    <input aria-label="Confirmation Text" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 transition-colors" placeholder="Type DELETE" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
                    <div className="flex gap-3 pt-2"><button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">Cancel</button><button onClick={handleConfirmDelete} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors">Confirm Delete</button></div>
                </div>
            </Modal>

            {/* Ship Modal */}
            <Modal isOpen={isShipModalOpen} onClose={() => setIsShipModalOpen(false)} title="Confirm Shipment">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-blue-400 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20"><Truck size={24} /><div><h3 className="font-bold text-white">Approve & Ship Transfer</h3><p className="text-xs opacity-80">Stock will be deducted immediately.</p></div></div>
                    <div className="flex gap-3 pt-2"><button onClick={() => setIsShipModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">Cancel</button><button onClick={handleConfirmShip} className="flex-1 py-3 bg-cyber-primary text-black font-bold rounded-xl hover:bg-cyber-accent transition-colors">Approve & Ship</button></div>
                </div>
            </Modal>

            {/* Receive Modal */}
            <Modal
                isOpen={isReceivingModalOpen}
                onClose={() => { setIsReceivingModalOpen(false); setReceivingTransfer(null); setReceivedQuantities({}); }}
                title="Receive Transfer - Verify Quantities"
                size="lg"
            >
                {receivingTransfer && (
                    <div className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2"><Package className="text-blue-400" size={20} /><h3 className="text-white font-bold">Transfer {receivingTransfer.id}</h3></div>
                            <div className="text-xs text-gray-400 space-y-1"><p><span className="font-bold">From:</span> {receivingTransfer.sourceSiteName}</p><p><span className="font-bold">To:</span> {receivingTransfer.destSiteName}</p><p><span className="font-bold">Items:</span> {receivingTransfer.items.length}</p></div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-white">Verify Received Quantities</h4>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {receivingTransfer.items.map((item, idx) => {
                                    const expectedQty = item.quantity;
                                    const receivedQty = receivedQuantities[item.sku] ?? expectedQty;
                                    return (
                                        <div key={idx} className="p-3 rounded-lg border bg-white/5 border-white/10">
                                            <div className="flex items-center justify-between mb-2"><div className="flex-1"><p className="text-sm font-bold text-white">{item.productName}</p><p className="text-xs text-gray-400">SKU: {item.sku}</p></div><div className="text-right"><p className="text-xs text-gray-400">Expected</p><p className="text-sm font-bold text-white">{expectedQty}</p></div></div>
                                            <div className="flex items-center gap-3"><label className="text-xs text-gray-400 flex-1">Received Quantity:</label><input type="number" min="0" value={typeof receivedQty === 'number' ? receivedQty : expectedQty} onChange={(e) => { const newQty = Math.max(0, parseInt(e.target.value) || 0); setReceivedQuantities(prev => ({ ...prev, [item.sku]: newQty })); }} className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-cyber-primary focus:outline-none" /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-white/10"><button onClick={() => { setIsReceivingModalOpen(false); setReceivingTransfer(null); setReceivedQuantities({}); }} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">Cancel</button><button onClick={handleConfirmReceive} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"><Package size={16} /> Confirm Receive</button></div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
