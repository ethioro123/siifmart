import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Printer, Layout, ClipboardList, Map, TrendingUp, Barcode, Clock, Shield, Minus, AlertTriangle
} from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useFulfillmentData } from '../components/fulfillment/FulfillmentDataProvider';
import { Protected, ProtectedButton } from '../components/Protected';
import Button from '../components/shared/Button';
import { native } from '../utils/native';
import { Product, PendingInventoryChange, BarcodeApproval } from '../types';
import { productsService, inventoryRequestsService } from '../services/supabase.service';
import { useSaveProductMutation } from '../hooks/useSaveProductMutation';
import { useDeleteProductMutation } from '../hooks/useDeleteProductMutation';
import { useAdjustStockMutation } from '../hooks/useAdjustStockMutation';
import { useApproveBarcodeMutation, useRejectBarcodeMutation } from '../hooks/useBarcodeApprovalMutations';
import { useApproveInventoryRequestMutation, useRejectInventoryRequestMutation, useBulkCleanupRequestsMutation } from '../hooks/useInventoryRequestMutations';

// --- SUB-COMPONENTS ---
import { InventoryOverview } from '../components/inventory/InventoryOverview';
import { InventoryStockList } from '../components/inventory/InventoryStockList';
import { InventoryZones } from '../components/inventory/InventoryZones';
import { InventoryMovements } from '../components/inventory/InventoryMovements';
import { InventoryBarcodeAudit } from '../components/inventory/InventoryBarcodeAudit';
import { InventoryPending } from '../components/inventory/InventoryPending';

// --- MODALS ---
import { ProductForm } from '../components/ProductForm';
import Modal from '../components/Modal';
import LabelPrintModal from '../components/LabelPrintModal';
import { filterBySite } from '../utils/locationAccess';
// Constants
import { CURRENCY_SYMBOL } from '../constants';

type Tab = 'overview' | 'stock' | 'zones' | 'movements' | 'pending' | 'barcode_audit';

// Helper for ABC Analysis
const getABCClass = (product: Product, totalValue: number) => {
    const prodValue = product.price * product.stock;
    const share = prodValue / totalValue;
    if (share > 0.05) return 'A'; // High Value
    if (share > 0.02) return 'B'; // Medium Value
    return 'C'; // Low Value
};

export default function Inventory() {
    const { user } = useStore();
    const { products, allProducts, sites, employees, activeSite, addNotification, refreshData } = useData();
    const { createPutawayJob, barcodeApprovals } = useFulfillmentData();

    // --- MUTATIONS ---
    const deleteMutation = useDeleteProductMutation();
    const adjustStockMutation = useAdjustStockMutation();
    const rejectBarcodeMutation = useRejectBarcodeMutation();
    const approveRequestMutation = useApproveInventoryRequestMutation(createPutawayJob);
    const rejectRequestMutation = useRejectInventoryRequestMutation();
    const bulkCleanupMutation = useBulkCleanupRequestsMutation();

    // --- TAB STATE ---
    const isNativeApp = native.isNative();
    const [activeTab, setActiveTab] = useState<Tab>(isNativeApp ? 'stock' : 'overview');

    // --- READ-ONLY & PERMISSIONS ---
    const isReadOnly = useMemo(() => {
        if (!activeSite) return true; // HQ View is Read-Only
        const type = activeSite.type;
        return !(type === 'Warehouse' || type === 'Distribution Center');
    }, [activeSite]);

    // --- DATA PREPARATION (Overview) ---
    const [serverMetrics, setServerMetrics] = useState<any>(null);

    // Filter products (client-side for charts, might need server-side for large data in future)
    const filteredProducts = useMemo(() => {
        const base = isReadOnly ? allProducts : filterBySite(products, user?.role || 'pos', activeSite?.id || '');
        return (Array.isArray(base) ? base : []).filter(p => (p.status || (p as any).status) !== 'archived');
    }, [products, allProducts, isReadOnly, user?.role, activeSite]);

    // Pending (needed for Badge)
    const [pendingChanges, setPendingChanges] = useState<PendingInventoryChange[]>([]);
    const loadPendingRequests = useCallback(async () => {
        try {
            const requests = await inventoryRequestsService.getAll(activeSite?.id);
            setPendingChanges(requests.filter(r => r.status === 'pending'));
        } catch (err) {
            console.error('Failed to load pending requests:', err);
        }
    }, [activeSite?.id]);

    useEffect(() => {
        loadPendingRequests();
    }, [loadPendingRequests, activeTab]); // Reload occasionally

    const pendingProducts = useMemo(() => {
        return filteredProducts.filter(p => p.approvalStatus === 'pending' || (p as any).approval_status === 'pending');
    }, [filteredProducts]);
    const pendingCount = pendingProducts.length + pendingChanges.length;


    // --- STOCK LIST STATE ---
    const [localProducts, setLocalProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [totalProductCount, setTotalProductCount] = useState(0);
    const [currentProductPage, setCurrentProductPage] = useState(1);
    const PRODUCTS_PER_PAGE = 20;

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        category: 'All',
        status: 'All',
        abc: 'All',
        priceRange: 'All',
        siteId: 'All'
    });
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchProducts = useCallback(async () => {
        if (activeTab !== 'stock') return;
        setProductsLoading(true);
        try {
            const offset = (currentProductPage - 1) * PRODUCTS_PER_PAGE;
            const serviceFilters = {
                search: searchTerm,
                category: filters.category,
                status: filters.status
            };
            let querySiteId = activeSite?.id;
            if (!querySiteId && filters.siteId !== 'All') querySiteId = filters.siteId;

            const { data, count } = await productsService.getAll(querySiteId, PRODUCTS_PER_PAGE, offset, serviceFilters, sortConfig || undefined);
            setLocalProducts(data || []);
            setTotalProductCount(count || 0);
        } catch (error) {
            console.error('Failed to fetch products', error);
            addNotification('alert', 'Failed to load products');
        } finally {
            setProductsLoading(false);
        }
    }, [activeSite?.id, currentProductPage, filters, searchTerm, activeTab, sortConfig, addNotification]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    useEffect(() => { setCurrentProductPage(1); }, [activeSite?.id, filters, searchTerm]); // Reset page on filter change

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current && current.key === key) return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            return { key, direction: 'asc' };
        });
    };

    // --- OVERVIEW DATA FETCH ---
    useEffect(() => {
        const fetchMetrics = async () => {
            if (activeTab === 'overview') {
                try {
                    let metricSiteId = activeSite?.id;
                    if (!metricSiteId && filters.siteId !== 'All') metricSiteId = filters.siteId;
                    const metrics = await productsService.getMetrics(metricSiteId);
                    setServerMetrics(metrics);
                } catch (err) {
                    console.error('Failed inventory metrics:', err);
                }
            }
        };
        fetchMetrics();
    }, [activeSite?.id, activeTab, filters.siteId]);

    const totalInventoryValueCost = serverMetrics?.total_value_cost || 0;
    const totalInventoryValueRetail = serverMetrics?.total_value_retail || 0;

    // Define permission helper
    const canApprove = user?.role === 'super_admin';

    const categoryData = useMemo(() => {
        const data: Record<string, number> = {};
        filteredProducts.forEach(p => { data[p.category] = (data[p.category] || 0) + 1; });
        return Object.entries(data).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    }, [filteredProducts]);
    const abcData = useMemo(() => {
        const data = { A: 0, B: 0, C: 0 };
        filteredProducts.forEach(p => {
            const grade = getABCClass(p, totalInventoryValueCost);
            if (grade) data[grade]++;
        });
        return [
            { name: 'Class A (High Value)', value: data.A, color: '#00ff9d' },
            { name: 'Class B (Medium Value)', value: data.B, color: '#3b82f6' },
            { name: 'Class C (Low Value)', value: data.C, color: '#f59e0b' },
        ];
    }, [filteredProducts, totalInventoryValueCost]);


    // --- MODAL STATE ---
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [deleteInput, setDeleteInput] = useState('');

    // Adjust Modal
    const [adjustQty, setAdjustQty] = useState<string>('');
    const [adjustReason, setAdjustReason] = useState<string>('Stock Correction');
    const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');

    // Print Modal
    const [isPrintHubOpen, setIsPrintHubOpen] = useState(false);
    const [labelsToPrint, setLabelsToPrint] = useState<any[]>([]);

    // --- HANDLERS ---
    const handleOpenAddProduct = () => { setEditingProduct(null); setIsProductModalOpen(true); };
    const handleOpenEditProduct = (product: Product) => { setEditingProduct(product); setIsProductModalOpen(true); };
    const handleDeleteProduct = (id: string) => { setProductToDelete(id); setDeleteInput(''); setIsDeleteModalOpen(true); };
    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            // Find the product details for the deletion request
            const product = localProducts.find(p => p.id === productToDelete) || allProducts.find(p => p.id === productToDelete);

            await deleteMutation.mutateAsync({
                productId: productToDelete,
                productName: product?.name || 'Unknown Product',
                productSku: product?.sku || 'UNKNOWN',
                siteId: activeSite?.id || '',
                canApprove: canApprove
            });
            setIsDeleteModalOpen(false); setProductToDelete(null); fetchProducts(); refreshData();
        } catch (e) { }
    };

    const handleOpenAdjust = (product: Product) => {
        setEditingProduct(product); setAdjustQty(''); setAdjustReason('Stock Correction'); setAdjustType('IN'); setIsAdjustModalOpen(true);
    };
    const handleAdjustStock = async () => {
        if (!editingProduct || !adjustQty) return;
        const qty = parseInt(adjustQty);
        if (isNaN(qty) || qty <= 0) { addNotification('alert', 'Invalid quantity'); return; }
        try {
            await adjustStockMutation.mutateAsync({
                productId: editingProduct.id,
                quantity: qty,
                type: adjustType,
                reason: adjustReason,
                productName: editingProduct.name,
                productSku: editingProduct.sku,
                siteId: editingProduct.siteId || activeSite?.id || '',
                canApprove: canApprove
            });
            setIsAdjustModalOpen(false); setEditingProduct(null); fetchProducts(); refreshData();
        } catch (e) { }
    };

    const handleBulkAction = (action: string) => {
        if (action === 'Print Labels' && selectedIds.size > 0) {
            const selected = localProducts.filter(p => selectedIds.has(p.id));
            const labels = selected.map(p => ({ product: p, quantity: 1 }));
            setLabelsToPrint(labels);
            setIsPrintHubOpen(true);
        } else {
            addNotification('info', `Bulk action ${action} not implemented yet`);
        }
    };

    // Pending Handlers
    const handleApproveProduct = async (product: Product) => {
        const change: PendingInventoryChange = {
            id: 'view-only',
            productId: product.id,
            changeType: 'create',
            proposedChanges: product,
            productName: product.name,
            productSku: product.sku,
            requestedBy: product.createdBy || 'Unknown',
            requestedAt: product.createdAt || new Date().toISOString(),
            status: 'pending',
            siteId: product.siteId || ''
        };
        try { await approveRequestMutation.mutateAsync(change); refreshData(); } catch (e) { }
    };
    const handleRejectProduct = async (product: Product, reason: string) => {
        const change: PendingInventoryChange = {
            id: 'view-only',
            productId: product.id,
            changeType: 'create',
            proposedChanges: product,
            productName: product.name,
            productSku: product.sku,
            requestedBy: product.createdBy || 'Unknown',
            requestedAt: product.createdAt || new Date().toISOString(),
            status: 'pending',
            siteId: product.siteId || ''
        };
        try { await rejectRequestMutation.mutateAsync({ change, reason }); refreshData(); } catch (e) { }
    };
    const handleApproveChange = async (change: PendingInventoryChange) => {
        try { await approveRequestMutation.mutateAsync(change); loadPendingRequests(); refreshData(); } catch (e) { }
    };
    const handleRejectChange = async (change: PendingInventoryChange, reason: string) => {
        try { await rejectRequestMutation.mutateAsync({ change, reason }); loadPendingRequests(); refreshData(); } catch (e) { }
    };
    const handleBulkCleanup = () => {
        if (confirm(`Reject all ${pendingChanges.length} pending requests?`)) {
            bulkCleanupMutation.mutate(pendingChanges);
            setTimeout(loadPendingRequests, 1000);
        }
    };

    const handleDeleteAuditRecord = (record: BarcodeApproval) => {
        if (confirm('Remove this barcode mapping?')) {
            rejectBarcodeMutation.mutate({
                id: record.id,
                userId: user?.id || 'system',
                reason: 'Manual deletion from audit'
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white transition-colors duration-300">
            {/* --- HEADER --- */}
            <div className="flex-none p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary via-blue-500 to-purple-600 animate-gradient-x drop-shadow-sm">
                            Inventory Command
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-2 text-sm">
                            <Shield size={14} className={isReadOnly ? "text-amber-500" : "text-green-500"} />
                            {isReadOnly ? 'Read-Only Mode' : 'Live Management Mode'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ProtectedButton
                            permission="ADD_PRODUCT"
                            onClick={handleOpenAddProduct}
                            disabled={isReadOnly}
                            className="flex items-center gap-2 bg-cyber-primary hover:bg-cyber-primary/80 text-black font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all px-4 py-2 rounded-lg"
                        >
                            <Plus size={18} />
                            Add Product
                        </ProtectedButton>
                        <Button
                            onClick={() => { setLabelsToPrint([]); setIsPrintHubOpen(true); }}
                            variant="secondary"
                            icon={<Printer size={18} />}
                            className="bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white border border-gray-200 dark:border-white/10 font-bold"
                        >
                            Print Hub
                        </Button>
                    </div>
                </div>

                {/* --- TABS --- */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'overview', label: 'Overview', icon: Layout },
                        { id: 'stock', label: 'Stock List', icon: ClipboardList },
                        { id: 'zones', label: 'Zones', icon: Map },
                        { id: 'movements', label: 'Movements', icon: TrendingUp },
                        { id: 'barcode_audit', label: 'Barcode Audit', icon: Barcode, count: barcodeApprovals.length },
                        { id: 'pending', label: 'Pending', icon: Clock, count: pendingCount }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id
                                ? 'bg-cyber-primary text-black shadow-[0_0_20px_rgba(0,255,157,0.3)] scale-105'
                                : 'bg-white dark:bg-white/[0.02] text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-cyber-primary border border-transparent hover:border-cyber-primary/20'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold border ${activeTab === tab.id
                                    ? 'bg-black text-cyber-primary border-black'
                                    : 'bg-red-500 text-white border-red-600'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 px-6 md:px-8 pb-8 overflow-hidden flex flex-col">
                {activeTab === 'overview' && (
                    <InventoryOverview serverMetrics={serverMetrics || null} categoryData={categoryData} abcData={abcData} totalInventoryValueCost={totalInventoryValueCost} totalInventoryValueRetail={totalInventoryValueRetail} filteredProducts={localProducts} />
                )}
                {activeTab === 'stock' && (
                    <InventoryStockList
                        products={localProducts} totalCount={totalProductCount} currentPage={currentProductPage}
                        setCurrentPage={setCurrentProductPage} isLoading={productsLoading} filters={filters}
                        setFilters={setFilters} sortConfig={sortConfig} handleSort={handleSort}
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds} handleBulkAction={handleBulkAction}
                        handleOpenEditProduct={handleOpenEditProduct} handleDeleteProduct={handleDeleteProduct}
                        handleOpenAdjust={handleOpenAdjust} sites={sites} activeSite={activeSite || null}
                        isReadOnly={isReadOnly} allProducts={allProducts} user={user} itemsPerPage={PRODUCTS_PER_PAGE}
                    />
                )}
                {activeTab === 'zones' && <InventoryZones />}
                {activeTab === 'movements' && (
                    <InventoryMovements sites={sites} activeSite={activeSite || null} isReadOnly={isReadOnly} addNotification={addNotification} />
                )}
                {activeTab === 'barcode_audit' && (
                    <InventoryBarcodeAudit
                        barcodeApprovals={barcodeApprovals} sites={sites} employees={employees}
                        isReadOnly={isReadOnly} user={user} handleDeleteAuditRecord={handleDeleteAuditRecord}
                    />
                )}
                {activeTab === 'pending' && (
                    <InventoryPending
                        pendingProducts={pendingProducts} pendingChanges={pendingChanges} allProducts={allProducts}
                        canApprove={['super_admin', 'procurement_manager', 'procurement', 'warehouse_manager', 'manager', 'warehouse'].includes(user?.role?.toLowerCase() || '')}
                        userRole={user?.role}
                        isSubmitting={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                        onApproveProduct={handleApproveProduct} onApproveChange={handleApproveChange}
                        onRejectProduct={handleRejectProduct} onRejectChange={handleRejectChange} onBulkCleanup={handleBulkCleanup}
                    />
                )}
            </div>

            {/* --- MODALS --- */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? "Edit Product" : "Add New Product"} size="2xl">
                <div className="max-h-[85vh] overflow-y-auto custom-scrollbar p-1">
                    <ProductForm
                        initialData={editingProduct || undefined}
                        onSubmit={async () => {
                            if (editingProduct && isReadOnly) addNotification('info', `Request submitted for ${editingProduct.name}`);
                            else addNotification('success', editingProduct ? 'Product updated' : 'Product created');
                            setIsProductModalOpen(false); fetchProducts(); refreshData();
                        }}
                        onCancel={() => setIsProductModalOpen(false)}
                        isSubmitting={false}
                        isReadOnly={isReadOnly}
                    />
                </div>
            </Modal>

            <Modal isOpen={isAdjustModalOpen} onClose={() => { setIsAdjustModalOpen(false); setEditingProduct(null); }} title="Adjust Stock Level" size="md">
                <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-black/20 overflow-hidden">
                            {editingProduct?.image && <img src={editingProduct.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">{editingProduct?.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{editingProduct?.sku}</p>
                            <div className="mt-2 text-xs font-bold text-cyber-primary bg-cyber-primary/10 px-2 py-0.5 rounded inline-block">Current Stock: {editingProduct?.stock}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setAdjustType('IN')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${adjustType === 'IN' ? 'bg-green-500/10 border-green-500 text-green-500' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}>
                            <div className="p-2 rounded-full bg-current bg-opacity-10"><Plus size={20} /></div>
                            <span className="font-bold text-sm">Stock In (+)</span>
                        </button>
                        <button onClick={() => setAdjustType('OUT')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${adjustType === 'OUT' ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}>
                            <div className="p-2 rounded-full bg-current bg-opacity-10"><Minus size={20} /></div>
                            <span className="font-bold text-sm">Stock Out (-)</span>
                        </button>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Quantity</label>
                        <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-cyber-primary/50" placeholder="0" min="1" autoFocus />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Reason</label>
                        <select aria-label="Adjustment Reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-cyber-primary/50">
                            <option>Stock Correction</option><option>Damaged Goods</option><option>Received Shipment</option><option>Return</option><option>Other</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
                        <Button variant={adjustType === 'IN' ? 'success' : 'danger'} onClick={handleAdjustStock} disabled={!adjustQty || parseInt(adjustQty) <= 0 || adjustStockMutation.isPending} loading={adjustStockMutation.isPending}>Confirm Adjustment</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setProductToDelete(null); }} title="Delete Product">
                <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400">
                        <AlertTriangle size={24} />
                        <div><h4 className="font-bold">Permanent Deletion</h4><p className="text-sm mt-1">This cannot be undone.</p></div>
                    </div>
                    <p className="text-sm text-gray-400">Type <span className="text-white font-mono font-bold">DELETE</span> to confirm:</p>
                    <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white font-mono focus:border-red-500/50 outline-none" placeholder="Type DELETE" />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" disabled={deleteInput !== 'DELETE' || deleteMutation.isPending} loading={deleteMutation.isPending} onClick={confirmDeleteProduct}>Delete Product</Button>
                    </div>
                </div>
            </Modal>

            <LabelPrintModal isOpen={isPrintHubOpen} onClose={() => setIsPrintHubOpen(false)} labels={labelsToPrint} onPrint={() => { setIsPrintHubOpen(false); setSelectedIds(new Set()); }} />
        </div>
    );
}
