import { getProcurementScope, filterProcurementSites } from '../utils/procurementScope';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Truck, Plus, Filter, Download, RefreshCw, ShieldAlert, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { PurchaseOrder, Supplier, Product } from '../types';
import { purchaseOrdersService, suppliersService } from '../services/supabase.service';
import { realtimeService } from '../services/realtime.service';
import { useDateFilter } from '../hooks/useDateFilter';
import { ProcurementDashboard } from '../components/procurement/ProcurementDashboard';
import { PurchaseOrdersList } from '../components/procurement/PurchaseOrdersList';
import { SupplierManagement } from '../components/procurement/SupplierManagement';
import { CreatePOModal } from '../components/procurement/CreatePOModal';
import { Protected } from '../components/Protected';
import { formatDateTime } from '../utils/formatting';
import { logger } from '../utils/logger';
import { getCountryProfile, type Country } from '../utils/localization';
import { VendorRelationsTab } from '../components/procurement/VendorRelationsTab';
import { CustomsImportTab } from '../components/procurement/CustomsImportTab';
import { InboundQCTab } from '../components/procurement/InboundQCTab';
import { RegionalScopeBanner } from '../components/regional-ops/RegionalScopeBanner';
import { useSupplierMutations } from '../hooks/useSupplierMutations';

export default function Procurement() {
    const { user } = useStore();
    const { createSupplier, verifySupplier } = useSupplierMutations();
    const { suppliers: allSuppliers, sites, settings, effectiveCountry, regions } = useData(); // Global suppliers validation & sites

    const procurementScope = getProcurementScope(user, sites);
    const isRegionalStaff = !['global', 'country'].includes(procurementScope.kind);

    const activeCountry: Country = (effectiveCountry || (settings?.country as Country) || 'ET');
    const countryProfile = getCountryProfile(activeCountry);
    const currencySymbol = countryProfile.currencySymbol;
    const targetRegionCode = procurementScope.regionCode;
    const activeRegion = useMemo(() => {
        return (regions || []).find(r => r.code === targetRegionCode);
    }, [regions, targetRegionCode]);
    const regionalAutonomousPoLimit = activeRegion?.autonomous_po_limit ?? (activeCountry === 'KE' ? 500000 : 150000);
    const countrySiteIds = filterProcurementSites(sites, activeCountry, procurementScope).map(site => site.id);
    const countrySiteIdsKey = countrySiteIds.join(',');

    // UI State
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'suppliers' | 'vendor_relations' | 'customs_import' | 'inbound_qc'>('overview');
    const [loading, setLoading] = useState(false);

    // Data State
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]); // For management tab
    const [totalCount, setTotalCount] = useState(0);
    const [totalSuppliersCount, setTotalSuppliersCount] = useState(0);
    const [pendingSignOffsCount, setPendingSignOffsCount] = useState(0);

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
    const [initialProduct, setInitialProduct] = useState<Product | null>(null);

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
                // RULE 10: Cap metrics query to 50 lightweight header records
                const res = await purchaseOrdersService.getAll(undefined, 50, 0, {
                    isRequest: false,
                    siteIds: countrySiteIds,
                    countryCode: activeCountry
                });
                const allPOs: PurchaseOrder[] = res.data;

                const filteredPOs = allPOs.filter(po => isWithinRange(po.date || po.created_at || ''));

                // Calculate metrics
                const totalSpend = filteredPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
                const openPO = filteredPOs.filter(po => ['Pending', 'Ordered', 'Approved'].includes(po.status)).length;
                const pendingValue = filteredPOs
                    .filter(po => ['Pending', 'Ordered', 'Approved'].includes(po.status))
                    .reduce((sum, po) => sum + (po.totalAmount || 0), 0);

                // Potential Revenue (Calculated from line items retail prices where available, or estimated margin)
                const potentialRevenue = filteredPOs.reduce((sum, po) =>
                    sum + (po.lineItems?.reduce((isum, item) => isum + (item.retailPrice ? item.quantity * item.retailPrice : (item.totalCost || 0)), 0) || ((po.totalAmount || 0) * 1.25)), 0);

                // Category Data
                const categorySpend: Record<string, number> = {};
                filteredPOs.forEach(po => {
                    if (po.lineItems && po.lineItems.length > 0) {
                        po.lineItems.forEach(item => {
                            const cat = item.category || 'General';
                            categorySpend[cat] = (categorySpend[cat] || 0) + (item.totalCost || 0);
                        });
                    } else if (po.supplierName) {
                        const cat = po.supplierName || 'General';
                        categorySpend[cat] = (categorySpend[cat] || 0) + (po.totalAmount || 0);
                    }
                });
                const categoryData = Object.entries(categorySpend)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);

                // Trend Data (Grouped from actual PO order dates)
                const monthlySpend: Record<string, number> = {};
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                filteredPOs.forEach(po => {
                    if (po.date || po.created_at) {
                        const d = new Date(po.date || po.created_at || Date.now());
                        const m = monthNames[d.getMonth()] || 'Month';
                        monthlySpend[m] = (monthlySpend[m] || 0) + (po.totalAmount || 0);
                    }
                });
                const trendData = Object.keys(monthlySpend).length > 0
                    ? Object.entries(monthlySpend).map(([name, spend]) => ({ name, spend }))
                    : [{ name: 'Current', spend: totalSpend }];

                setProcurementMetrics({
                    totalSpend,
                    openPO,
                    pendingValue,
                    potentialRevenue,
                    categoryData,
                    trendData
                });
                setPendingSignOffsCount(allPOs.filter(po => po.status === 'Draft' || po.status === 'Pending').length);

            } else if (activeTab === 'orders') {
                const offset = (currentPage - 1) * ITEMS_PER_PAGE;
                const filters = {
                    status: statusFilter !== 'All' ? statusFilter : undefined,
                    supplierId: poSupplierFilter !== 'All' ? poSupplierFilter : undefined,
                    search: searchTerm,
                    isRequest: false,
                    siteIds: countrySiteIds,
                    countryCode: activeCountry
                };

                const res = await purchaseOrdersService.getAll(undefined, ITEMS_PER_PAGE, offset, filters);
                setOrders(res.data);
                setTotalCount(res.count);
                setPendingSignOffsCount((res.data || []).filter((po: PurchaseOrder) => po.status === 'Draft' || po.status === 'Pending').length);
            } else if (activeTab === 'suppliers') {
                const offset = (supplierPage - 1) * ITEMS_PER_PAGE;
                const res = await suppliersService.getAll(ITEMS_PER_PAGE, offset, activeCountry);
                setLocalSuppliers(res.data);
                setTotalSuppliersCount(res.count);
            }
        } catch (err) {
            logger.error('Procurement', "Error fetching procurement data", err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, currentPage, supplierPage, statusFilter, searchTerm, dateRange, poSort, poSupplierFilter, isWithinRange, countrySiteIdsKey, activeCountry]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Live Real-Time Updates: synchronizes PO status changes (approvals, warehouse receiving, item check-ins)
    useEffect(() => {
        const sub = realtimeService.subscribeToPurchaseOrders((event, payload) => {
            logger.debug('Procurement', `Live PO update received (${event}):`, payload?.id);
            fetchData();
        });

        return () => {
            sub.unsubscribe();
        };
    }, [fetchData]);

    const handleCreatePOOpen = (product?: Product, supplierId?: string) => {
        setEditingPO(null);
        setInitialProduct(product || null);
        setInitialSupplierId(supplierId || product?.preferredSupplierId || (product as any)?.supplier_id || undefined);
        setIsCreatePOOpen(true);
    };

    const handleEditPO = (po: PurchaseOrder) => {
        setEditingPO(po);
        setInitialProduct(null);
        setInitialSupplierId(undefined);
        setIsCreatePOOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent text-[var(--theme-text-primary)] transition-colors duration-300">
            <div className="flex-none p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 pb-20 sm:pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3.5 mb-1.5">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] flex items-center justify-center shadow-sm">
                            <Truck size={24} strokeWidth={2} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--theme-text-primary)] tracking-tight">Procurement</h1>
                    </div>
                    <p className="text-[var(--theme-text-secondary)] text-xs sm:text-sm font-normal max-w-xl">
                        Manage supply chain, purchase orders, and vendor relationships.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Maker-Checker Sign-off Hub Badge */}
                    {(() => {
                        const isApproverRole = Boolean(user?.role && ['country_commercial_director', 'regional_procurement_manager', 'country_managing_director', 'group_ceo'].includes(user.role));
                        if (pendingSignOffsCount === 0) return null;

                        return isApproverRole ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('orders');
                                    setStatusFilter('Draft');
                                }}
                                className="min-h-11 px-4 flex items-center gap-2 bg-[var(--theme-status-warning-bg)] hover:opacity-90 border border-[var(--theme-status-warning-border)] rounded-full transition-colors cursor-pointer shadow-xs text-xs font-semibold text-[var(--theme-status-warning-text)] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-warning)]"
                                title={`${pendingSignOffsCount} PO draft(s) awaiting manager sign-off`}
                            >
                                <ShieldAlert size={16} className="text-[var(--theme-status-warning-text)] shrink-0" />
                                <span className="font-mono tabular-nums">{pendingSignOffsCount} Pending Sign-Off{pendingSignOffsCount > 1 ? 's' : ''}</span>
                            </button>
                        ) : (
                            <div
                                className="min-h-11 px-4 flex items-center gap-2 bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] rounded-full text-xs font-semibold text-[var(--theme-status-info-text)] shrink-0"
                                title={`${pendingSignOffsCount} PO draft(s) in supervisory review`}
                            >
                                <Clock size={16} className="text-[var(--theme-status-info-text)] shrink-0" />
                                <span className="font-mono tabular-nums">{pendingSignOffsCount} In Review</span>
                            </div>
                        );
                    })()}

                    <Protected permission="CREATE_PO">
                        <button
                            type="button"
                            onClick={() => handleCreatePOOpen()}
                            className="min-h-11 px-5 rounded-full bg-[var(--theme-btn-primary-bg)] text-[var(--theme-btn-primary-text)] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-colors flex items-center gap-2 shadow-xs shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            Create Order
                        </button>
                    </Protected>
                </div>
            </div>

            {/* Adaptive Regional Territory Lens */}
            <RegionalScopeBanner
                moduleName="Procurement"
                guardrailBadge={
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-xs font-semibold">
                        <span>Autonomous PO Limit: {currencySymbol} {Number(regionalAutonomousPoLimit).toLocaleString()}</span>
                    </div>
                }
            />

            {/* Navigation Tabs */}
            <div role="group" aria-label="Procurement sections" className="inline-flex p-1 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border-subtle)] gap-1 flex-wrap w-fit">
                {(isRegionalStaff
                    ? (['overview', 'orders', 'suppliers', 'inbound_qc'] as const)
                    : (['overview', 'orders', 'suppliers', 'vendor_relations', 'customs_import', 'inbound_qc'] as const)
                ).map(tab => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            aria-pressed={isActive}
                            className={`min-h-11 px-4 py-2 rounded-full text-xs sm:text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                                isActive
                                    ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] font-semibold shadow-xs border border-[var(--theme-accent)]'
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] font-medium border border-transparent'
                            }`}
                        >
                            {tab === 'vendor_relations' ? 'Vendor Relations' :
                             tab === 'customs_import' ? 'Customs & Port' :
                             tab === 'inbound_qc' ? 'Inbound QC Dock' :
                             tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {loading && <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-[var(--theme-accent)]" /></div>}

                {!loading && activeTab === 'overview' && (
                    <ProcurementDashboard
                        metrics={procurementMetrics}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        suppliers={allSuppliers}
                        currencySymbol={currencySymbol}
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
                        currencySymbol={currencySymbol}
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
                        onAddSupplier={async supplier => {
                            await createSupplier.mutateAsync(supplier);
                            await fetchData();
                        }}
                        onVerifySupplier={async supplier => {
                            if (!user?.id) throw new Error('Employee identity is required');
                            await verifySupplier.mutateAsync({ id: supplier.id, employeeId: user.id });
                            await fetchData();
                        }}
                        canVerify={Boolean(user?.role && ['group_ceo', 'country_managing_director', 'country_commercial_director', 'regional_procurement_manager'].includes(user.role))}
                        viewerEmployeeId={user?.id}
                        onOpenCreatePO={handleCreatePOOpen}
                    />
                )}

                {!loading && activeTab === 'vendor_relations' && (
                    <VendorRelationsTab
                        countryCode={activeCountry}
                        suppliers={allSuppliers}
                    />
                )}

                {!loading && activeTab === 'customs_import' && (
                    <CustomsImportTab
                        countryCode={activeCountry}
                    />
                )}

                {!loading && activeTab === 'inbound_qc' && (
                    <InboundQCTab
                        countryCode={activeCountry}
                    />
                )}
            </div>

            {/* Create/Edit PO Modal */}
            <CreatePOModal
                isOpen={isCreatePOOpen}
                onClose={() => {
                    setIsCreatePOOpen(false);
                    setInitialProduct(null);
                }}
                editingPO={editingPO}
                initialSupplierId={initialSupplierId}
                initialProduct={initialProduct}
                onSuccess={() => {
                    fetchData();
                    setIsCreatePOOpen(false);
                    setInitialProduct(null);
                }}
            />
            </div>
        </div>
    );
}
