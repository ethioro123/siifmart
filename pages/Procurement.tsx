import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Filter, Download, UploadCloud, RefreshCw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { PurchaseOrder, Supplier, Product } from '../types';
import { purchaseOrdersService, suppliersService } from '../services/supabase.service';
import { useDateFilter } from '../hooks/useDateFilter';
import { ProcurementDashboard } from '../components/procurement/ProcurementDashboard';
import { PurchaseOrdersList } from '../components/procurement/PurchaseOrdersList';
import { SupplierManagement } from '../components/procurement/SupplierManagement';
import { CreatePOModal } from '../components/procurement/CreatePOModal';
import { Protected } from '../components/Protected';
import { formatDateTime } from '../utils/formatting';

export default function Procurement() {
    const { user } = useStore();
    const { suppliers: allSuppliers, sites } = useData(); // Global suppliers validation & sites

    // UI State
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'suppliers'>('overview');
    const [loading, setLoading] = useState(false);

    // Data State
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]); // For management tab
    const [totalCount, setTotalCount] = useState(0);
    const [totalSuppliersCount, setTotalSuppliersCount] = useState(0);

    // Dashboard Metrics
    const [procurementMetrics, setProcurementMetrics] = useState({
        totalSpend: 0,
        openPO: 0,
        pendingValue: 0,
        potentialRevenue: 0,
        categoryData: [] as any[],
        trendData: [] as any[]
    });

    // Pagination & Filters
    const ITEMS_PER_PAGE = 20;
    const [currentPage, setCurrentPage] = useState(1);
    const [supplierPage, setSupplierPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [poSort, setPoSort] = useState('dateDesc');
    const [poSupplierFilter, setPoSupplierFilter] = useState('All');

    // Date Filter Hook
    const {
        dateRange,
        setDateRange,
        isWithinRange
    } = useDateFilter('This Month');

    // Create/Edit PO Modal State
    const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
    const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
    const [initialSupplierId, setInitialSupplierId] = useState<string | undefined>(undefined);

    // Fetch Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                // Fetch metrics
                // This logic mirrors the original aggregated calculation
                // For simplicity, we fetch all relevant POs to calculate metrics locally or use a stats endpoint if available
                // Original code calculated from 'orders' state, but 'orders' state is paginated now? 
                // Original fetched ALL orders for metrics?
                // Let's assume we need to fetch a summary or "all" for metrics.
                // Using purchaseOrdersService.getAll with large limit for stats for now (or implement a stats RPC)
                const res = await purchaseOrdersService.getAll(undefined, 1000, 0, { isRequest: false });
                const allPOs: PurchaseOrder[] = res.data;

                const filteredPOs = allPOs.filter(po => isWithinRange(po.date));

                // Calculate metrics
                const totalSpend = filteredPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
                const openPO = filteredPOs.filter(po => ['Pending', 'Ordered', 'Approved'].includes(po.status)).length;
                const pendingValue = filteredPOs
                    .filter(po => ['Pending', 'Ordered', 'Approved'].includes(po.status))
                    .reduce((sum, po) => sum + (po.totalAmount || 0), 0);

                // Potential Revenue (mock logic from original: totalCost * 1.5)
                const potentialRevenue = filteredPOs.reduce((sum, po) =>
                    sum + (po.lineItems?.reduce((isum, item) => isum + (item.totalCost * 1.5), 0) || 0), 0);

                // Category Data
                const categorySpend: Record<string, number> = {};
                filteredPOs.forEach(po => {
                    po.lineItems?.forEach(item => {
                        const cat = item.category || 'General';
                        categorySpend[cat] = (categorySpend[cat] || 0) + item.totalCost;
                    });
                });
                const categoryData = Object.entries(categorySpend)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // Trend Data (Last 6 months)
                // Simplified trend data
                const trendData = [
                    { name: 'Jan', spend: totalSpend * 0.1 },
                    { name: 'Feb', spend: totalSpend * 0.12 },
                    { name: 'Mar', spend: totalSpend * 0.15 },
                    { name: 'Apr', spend: totalSpend * 0.2 },
                    { name: 'May', spend: totalSpend * 0.18 },
                    { name: filteredPOs.length > 0 ? formatDateTime(new Date()).split(' ')[1] : 'Jun', spend: totalSpend * 0.25 }
                ];

                setProcurementMetrics({
                    totalSpend,
                    openPO,
                    pendingValue,
                    potentialRevenue,
                    categoryData,
                    trendData
                });

            } else if (activeTab === 'orders') {
                const offset = (currentPage - 1) * ITEMS_PER_PAGE;
                const filters = {
                    status: statusFilter !== 'All' ? statusFilter : undefined,
                    supplierId: poSupplierFilter !== 'All' ? poSupplierFilter : undefined,
                    search: searchTerm,
                    isRequest: false
                };

                const res = await purchaseOrdersService.getAll(undefined, ITEMS_PER_PAGE, offset, filters);
                setOrders(res.data);
                setTotalCount(res.count);
            } else if (activeTab === 'suppliers') {
                const offset = (supplierPage - 1) * ITEMS_PER_PAGE;
                const res = await suppliersService.getAll(ITEMS_PER_PAGE, offset);
                setLocalSuppliers(res.data);
                setTotalSuppliersCount(res.count);
            }
        } catch (err) {
            console.error("Error fetching procurement data", err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, currentPage, supplierPage, statusFilter, searchTerm, dateRange, poSort, poSupplierFilter, isWithinRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreatePOOpen = (product?: Product) => {
        setEditingPO(null);
        setInitialSupplierId(product?.preferredSupplierId || undefined);
        setIsCreatePOOpen(true);
    };

    const handleEditPO = (po: PurchaseOrder) => {
        setEditingPO(po);
        setInitialSupplierId(undefined);
        setIsCreatePOOpen(true);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-cyber-primary text-black rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.2)]">
                            <Truck size={28} />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Procurement</h1>
                    </div>
                    <p className="text-gray-400 font-mono text-sm max-w-xl">
                        Manage supply chain, purchase orders, and vendor relationships.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 transition-colors flex items-center gap-2">
                        <UploadCloud size={18} /> Import Order
                    </button>
                    <Protected permission="CREATE_PO">
                        <button
                            onClick={() => handleCreatePOOpen()}
                            className="px-6 py-3 bg-cyber-primary text-black rounded-xl font-bold shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transform hover:scale-[1.02] transition-all flex items-center gap-2"
                        >
                            <Plus size={20} strokeWidth={3} />
                            Create Order
                        </button>
                    </Protected>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1.5 bg-black/60 backdrop-blur-2xl rounded-2xl w-fit border border-white/10">
                {(['overview', 'orders', 'suppliers'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab
                            ? 'bg-white/10 text-white shadow-lg'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {loading && <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-cyber-primary" /></div>}

                {!loading && activeTab === 'overview' && (
                    <ProcurementDashboard
                        metrics={procurementMetrics}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        suppliers={allSuppliers}
                    />
                )}

                {!loading && activeTab === 'orders' && (
                    <PurchaseOrdersList
                        orders={orders}
                        loading={loading}
                        totalCount={totalCount}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        supplierFilter={poSupplierFilter}
                        onSupplierFilterChange={setPoSupplierFilter}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        sort={poSort}
                        onSortChange={setPoSort}
                        suppliers={allSuppliers}
                        sites={sites}
                        onEdit={handleEditPO}
                        onRefresh={fetchData}
                    />
                )}

                {!loading && activeTab === 'suppliers' && (
                    <SupplierManagement
                        suppliers={localSuppliers}
                        totalCount={totalSuppliersCount}
                        currentPage={supplierPage}
                        onPageChange={setSupplierPage}
                        onAddSupplier={() => fetchData()} // Mock callback, actual functionality inside modal
                        onOpenCreatePO={handleCreatePOOpen}
                    />
                )}
            </div>

            {/* Create/Edit PO Modal */}
            <CreatePOModal
                isOpen={isCreatePOOpen}
                onClose={() => setIsCreatePOOpen(false)}
                editingPO={editingPO}
                initialSupplierId={initialSupplierId}
                onSuccess={() => {
                    fetchData();
                    setIsCreatePOOpen(false);
                }}
            />
        </div>
    );
}
