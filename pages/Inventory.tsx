import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpDown, MoreHorizontal, AlertTriangle, FileText, Download, Printer, Box, Trash2, Edit, RefreshCw, Map, TrendingUp, Layout, ClipboardList, Thermometer, Shield, XCircle, DollarSign, ChevronDown, ChevronLeft, ChevronRight, Minus, Barcode, Package, Loader2, Clock, CheckCircle, User, ArrowRight, Link, Info, Scan, X, Camera, SlidersHorizontal } from 'lucide-react';
import { formatCompactNumber, formatDateTime } from '../utils/formatting';
import { formatJobId } from '../utils/jobIdFormatter';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { MOCK_ZONES, CURRENCY_SYMBOL, GROCERY_CATEGORIES, COMMON_UNITS } from '../constants';
import ImageUpload from '../components/ImageUpload';
import { Product, StockMovement, PendingInventoryChange, BarcodeApproval } from '../types';
import { inventoryRequestsService, stockMovementsService, productsService } from '../services/supabase.service';
import Modal from '../components/Modal';
import LabelPrintModal from '../components/LabelPrintModal';
import { motion } from 'framer-motion';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { Protected, ProtectedButton } from '../components/Protected';
import Button from '../components/shared/Button';
import { filterBySite } from '../utils/locationAccess';
import { native } from '../utils/native';
import { generateUniqueSKU, isSKUUnique } from '../utils/skuUtils';
import { generateInternalBarcode } from '../utils/barcodeNumberGenerator';
import { ProductForm } from '../components/ProductForm';
import { useSaveProductMutation } from '../hooks/useSaveProductMutation';
import { useDeleteProductMutation } from '../hooks/useDeleteProductMutation';
import { useAdjustStockMutation } from '../hooks/useAdjustStockMutation';
import { useApproveBarcodeMutation, useRejectBarcodeMutation } from '../hooks/useBarcodeApprovalMutations';
import { useApproveInventoryRequestMutation, useRejectInventoryRequestMutation, useBulkCleanupRequestsMutation } from '../hooks/useInventoryRequestMutations';

type Tab = 'overview' | 'stock' | 'zones' | 'movements' | 'pending' | 'barcode_audit';

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
    const { products, allProducts, sites, employees, addProduct, updateProduct, deleteProduct, adjustStock, activeSite, setActiveSite, addNotification, refreshData, logSystemEvent, createPutawayJob, barcodeApprovals, approveBarcode, rejectBarcode } = useData();
    const navigate = useNavigate();
    const saveMutation = useSaveProductMutation();
    const deleteMutation = useDeleteProductMutation();
    const adjustStockMutation = useAdjustStockMutation();
    const approveBarcodeMutation = useApproveBarcodeMutation();
    const rejectBarcodeMutation = useRejectBarcodeMutation();
    const approveRequestMutation = useApproveInventoryRequestMutation(createPutawayJob);
    const rejectRequestMutation = useRejectInventoryRequestMutation();
    const bulkCleanupMutation = useBulkCleanupRequestsMutation();

    // Helper to lookup employee name by ID
    const getEmployeeName = (employeeId: string | undefined | null) => {
        if (!employeeId) return 'Unknown';
        const emp = employees.find(e => e.id === employeeId);
        return emp?.name || 'Unknown';
    };

    // --- BARCODE AUDIT STATE ---
    const [barcodeSearch, setBarcodeSearch] = useState('');
    const [barcodeSiteFilter, setBarcodeSiteFilter] = useState('All');
    const [barcodeSort, setBarcodeSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    // Track viewed items to "clear" notification
    const [lastViewedBarcodeCount, setLastViewedBarcodeCount] = useState(0);

    // --- READ-ONLY & PERMISSIONS ---
    // Rule: Warehouses & DCs have write access. Stores & Admin (HQ) are Read-Only.
    const isReadOnly = useMemo(() => {
        if (!activeSite) return true; // Global/HQ View is Read-Only
        const type = activeSite.type;
        // Only Warehouses and DCs can edit inventory
        return !(type === 'Warehouse' || type === 'Distribution Center');
    }, [activeSite]);

    // 🔒 LOCATION-BASED ACCESS CONTROL
    // If Read-Only (CEO, Store, HQ): Show ALL products (Global View) to allow lookup
    // If Write Access (Warehouse): Show only the active site's products
    const filteredProducts = useMemo(() => {
        const base = isReadOnly ? allProducts : filterBySite(products, user?.role || 'pos', activeSite?.id || '');
        // Standardize: Filter out archived products from inventory calculations and views
        return (Array.isArray(base) ? base : []).filter(p => (p.status || (p as any).status) !== 'archived');
    }, [products, allProducts, isReadOnly, user?.role, activeSite]);

    // --- FILTERED BARCODES ---
    const filteredBarcodes = useMemo(() => {
        let result = [...barcodeApprovals];

        // 🔍 Search
        if (barcodeSearch) {
            const lowSearch = barcodeSearch.toLowerCase();
            result = result.filter(b =>
                b.barcode.toLowerCase().includes(lowSearch) ||
                (b.product?.name || '').toLowerCase().includes(lowSearch) ||
                (b.product?.sku || '').toLowerCase().includes(lowSearch)
            );
        }

        // Hide deleted/rejected mappings
        result = result.filter(b => b.status !== 'rejected');

        // 📍 Site Filter
        if (barcodeSiteFilter !== 'All') {
            result = result.filter(b => (b.site_id || b.siteId) === barcodeSiteFilter);
        }

        // 📊 Sort
        result.sort((a, b) => {
            let valA: any, valB: any;

            if (barcodeSort.key === 'date') {
                valA = new Date(a.created_at || 0).getTime();
                valB = new Date(b.created_at || 0).getTime();
            } else if (barcodeSort.key === 'product') {
                valA = (a.product?.name || '').toLowerCase();
                valB = (b.product?.name || '').toLowerCase();
            } else if (barcodeSort.key === 'duration') {
                valA = a.resolution_time || 0;
                valB = b.resolution_time || 0;
            }

            if (valA < valB) return barcodeSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return barcodeSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [barcodeApprovals, barcodeSearch, barcodeSiteFilter, barcodeSort]);

    // PDA Mode Detection
    const isNativeApp = native.isNative();

    // Default to 'stock' tab for PDA, 'overview' for desktop
    const [activeTab, setActiveTab] = useState<Tab>(isNativeApp ? 'stock' : 'overview');

    // Server-side Pagination State for Movements
    const [localMovements, setLocalMovements] = useState<StockMovement[]>([]);
    const [movementsLoading, setMovementsLoading] = useState(false);
    const [totalMovementsCount, setTotalMovementsCount] = useState(0);
    const [currentMovementsPage, setCurrentMovementsPage] = useState(1);
    const MOVEMENTS_PER_PAGE = 20;

    // --- MOVEMENTS FILTER STATE ---
    const [movementsSearch, setMovementsSearch] = useState('');
    const [movementsTypeFilter, setMovementsTypeFilter] = useState('All');
    const [movementsSiteFilter, setMovementsSiteFilter] = useState('All');
    const [movementsSort, setMovementsSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    useEffect(() => {
        if (activeTab === 'movements') {
            const fetchMovements = async () => {
                setMovementsLoading(true);
                try {
                    const offset = (currentMovementsPage - 1) * MOVEMENTS_PER_PAGE;
                    const { data, count } = await stockMovementsService.getAll(
                        isReadOnly ? movementsSiteFilter : activeSite?.id,
                        undefined,
                        MOVEMENTS_PER_PAGE,
                        offset,
                        { search: movementsSearch, type: movementsTypeFilter },
                        movementsSort
                    );
                    setLocalMovements(data);
                    setTotalMovementsCount(count);
                } catch (error) {
                    console.error('Failed to fetch movements', error);
                    addNotification('alert', 'Failed to load movements');
                } finally {
                    setMovementsLoading(false);
                }
            };
            fetchMovements();
        }
    }, [activeTab, currentMovementsPage, activeSite?.id, movementsSearch, movementsTypeFilter, movementsSiteFilter, movementsSort, isReadOnly]);

    useEffect(() => {
        setCurrentMovementsPage(1);
    }, [movementsSearch, movementsTypeFilter, movementsSiteFilter, movementsSort]);
    useEffect(() => {
        setCurrentBarcodePage(1);
    }, [barcodeApprovals.length, activeSite?.id]);

    // Clear notification badge when tab is opened
    useEffect(() => {
        if (activeTab === 'barcode_audit') {
            setLastViewedBarcodeCount(barcodeApprovals.length);
        }
    }, [activeTab, barcodeApprovals.length]);



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

    // --- SORT STATE ---
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' }); // Default to recent

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current && current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // Server-side Pagination for Products
    const [localProducts, setLocalProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [totalProductCount, setTotalProductCount] = useState(0);
    const [currentProductPage, setCurrentProductPage] = useState(1);
    const [currentBarcodePage, setCurrentBarcodePage] = useState(1);
    const BARCODE_PER_PAGE = 15;
    const PRODUCTS_PER_PAGE = 20;


    const fetchProducts = useCallback(async () => {
        setProductsLoading(true);
        try {
            const offset = (currentProductPage - 1) * PRODUCTS_PER_PAGE;
            // Map generic filters to service filters
            const serviceFilters = {
                search: searchTerm,
                category: filters.category,
                status: filters.status
            };

            // Site ID logic: If activeSite is set (Warehouse view), force that siteId.
            // If activeSite is null (Global view), allow filters.siteId.
            let querySiteId = activeSite?.id;
            if (!querySiteId && filters.siteId !== 'All') {
                querySiteId = filters.siteId;
            }

            const { data, count } = await productsService.getAll(querySiteId, PRODUCTS_PER_PAGE, offset, serviceFilters, sortConfig || undefined);
            setLocalProducts(data || []);
            setTotalProductCount(count || 0);
        } catch (error) {
            console.error('Failed to fetch products', error);
            addNotification('alert', 'Failed to load products');
        } finally {
            setProductsLoading(false);
        }
    }, [activeSite?.id, currentProductPage, filters, searchTerm, PRODUCTS_PER_PAGE, addNotification, sortConfig]);

    // --- SERVER-SIDE METRICS ---
    const [serverMetrics, setServerMetrics] = useState<any>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Same site logic as products
                let metricSiteId = activeSite?.id;
                if (!metricSiteId && filters.siteId !== 'All') {
                    metricSiteId = filters.siteId;
                }
                const metrics = await productsService.getMetrics(metricSiteId);
                setServerMetrics(metrics);
            } catch (err) {
                console.error('Failed to load inventory metrics:', err);
            }
        };
        fetchMetrics();
    }, [activeSite?.id, filters.siteId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setCurrentProductPage(1);
    }, [activeSite?.id, filters, searchTerm]);



    // --- SELECTION STATE ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // --- MODAL STATE ---
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isPrintHubOpen, setIsPrintHubOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [deleteInput, setDeleteInput] = useState('');


    // Form State
    const [skuInput, setSkuInput] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const [barcodeAliases, setBarcodeAliases] = useState<string[]>([]);
    const [newBarcodeAlias, setNewBarcodeAlias] = useState('');
    const [testBarcodeInput, setTestBarcodeInput] = useState('');
    const [adjustQty, setAdjustQty] = useState<string>('');
    const [adjustReason, setAdjustReason] = useState<string>('Stock Correction');
    const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');

    // New Product Form State (synced with PO structure)
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [productBrand, setProductBrand] = useState('');
    const [productSize, setProductSize] = useState('');
    const [productUnit, setProductUnit] = useState('piece');
    const [costPriceInput, setCostPriceInput] = useState('');
    const [productImage, setProductImage] = useState('');
    const [productNameInput, setProductNameInput] = useState('');
    const [retailPriceInput, setRetailPriceInput] = useState('');
    const [stockInput, setStockInput] = useState('');
    const [locationInput, setLocationInput] = useState('');

    const [packQuantity, setPackQuantity] = useState<number>(0);

    // Computed preview name - matches how the product will appear
    const previewProductName = useMemo(() => {
        const parts: string[] = [];
        if (productBrand) parts.push(productBrand);
        if (productNameInput) parts.push(productNameInput);
        else if (selectedMainCategory) parts.push(selectedMainCategory); // Fallback to category if no name

        if (productSize && productUnit) parts.push(`${productSize}${productUnit}`);
        else if (productSize) parts.push(productSize);
        else if (productUnit && productUnit !== 'piece') parts.push(productUnit);

        let name = parts.length > 0 ? parts.join(' ') : 'Product Name';

        if (packQuantity > 1) {
            name += ` – Pack of ${packQuantity}`;
        }

        return name;
    }, [productBrand, productNameInput, productSize, productUnit, packQuantity, selectedMainCategory]);

    const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

    // --- DATA STATE ---
    const [pendingChanges, setPendingChanges] = useState<PendingInventoryChange[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [selectedBarcodeApproval, setSelectedBarcodeApproval] = useState<BarcodeApproval | null>(null);
    const [isBarcodeRejectionModalOpen, setIsBarcodeRejectionModalOpen] = useState(false);
    const [isApprovalDetailsOpen, setIsApprovalDetailsOpen] = useState(false);
    const [selectedAuditRecord, setSelectedAuditRecord] = useState<BarcodeApproval | null>(null);

    const loadPendingRequests = async () => {
        try {
            const requests = await inventoryRequestsService.getAll(activeSite?.id);
            // Only show requests that are still pending
            setPendingChanges(requests.filter(r => r.status === 'pending'));
        } catch (err) {
            console.error('Failed to load pending requests:', err);
            addNotification('alert', 'Failed to load pending approvals');
        } finally {
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        loadPendingRequests();
    }, [activeSite]);

    const canApprove = ['super_admin', 'CEO'].includes(user?.role || '');
    const canViewPending = canApprove;
    const canViewAuditLog = ['super_admin', 'CEO', 'warehouse_manager', 'store_manager', 'regional_manager', 'operations_manager'].includes(user?.role || '');
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [selectedPendingProduct, setSelectedPendingProduct] = useState<Product | null>(null);
    const [selectedPendingChange, setSelectedPendingChange] = useState<PendingInventoryChange | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRequestDetailsModalOpen, setIsRequestDetailsModalOpen] = useState(false);
    const [requestForDetails, setRequestForDetails] = useState<PendingInventoryChange | null>(null);

    const renderDetailedComparison = () => {
        if (!requestForDetails) return null;

        if (requestForDetails.changeType === 'create') {
            return (
                <div className="space-y-4">
                    <p className="text-amber-400 text-sm font-medium bg-amber-400/10 p-3 rounded-lg border border-amber-400/20 flex items-center gap-2">
                        <AlertTriangle size={16} /> This is a request to create a NEW product. Review the information carefully.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        {requestForDetails.proposedChanges && Object.entries(requestForDetails.proposedChanges).map(([key, value]) => {
                            if (['id', 'created_at', 'site_id', 'siteId', 'approval_status', 'approvalStatus', 'createdAt', 'createdBy', 'image'].includes(key)) return null;
                            if (typeof value === 'object') return null;
                            return (
                                <div key={key} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
                                    <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                                    <span className="text-white text-sm font-medium">
                                        {['price', 'costPrice', 'salePrice'].includes(key)
                                            ? formatCompactNumber(Number(value || 0), { currency: CURRENCY_SYMBOL })
                                            : String(value || 'N/A')
                                        }
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (requestForDetails.changeType === 'edit') {
            const original = allProducts.find(p => p.id === requestForDetails.productId);
            const props: (keyof Product)[] = ['name', 'category', 'sku', 'price', 'costPrice', 'salePrice', 'stock', 'location'];

            return (
                <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-500 uppercase px-4 bg-black/20 py-2 rounded-lg">
                        <div className="col-span-3">Field</div>
                        <div className="col-span-4">Current</div>
                        <div className="col-span-1 flex justify-center"></div>
                        <div className="col-span-4">Proposed</div>
                    </div>
                    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {props.map(prop => {
                            const oldVal = original ? original[prop] : 'N/A';
                            const newVal = requestForDetails.proposedChanges ? (requestForDetails.proposedChanges as any)[prop] : undefined;
                            const isChanged = newVal !== undefined && String(newVal) !== String(oldVal);

                            if (newVal === undefined) return null;

                            const isPriceField = ['price', 'costPrice', 'salePrice'].includes(prop as string);
                            const formattedOld = isPriceField && oldVal !== 'N/A'
                                ? formatCompactNumber(Number(oldVal), { currency: CURRENCY_SYMBOL })
                                : String(oldVal ?? 'None');
                            const formattedNew = isPriceField && newVal !== undefined
                                ? formatCompactNumber(Number(newVal), { currency: CURRENCY_SYMBOL })
                                : String(newVal ?? 'None');

                            return (
                                <div key={prop as string} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg transition-all border ${isChanged ? 'bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/5' : 'bg-white/5 border-transparent'}`}>
                                    <div className="col-span-3 text-xs font-bold text-gray-400 uppercase">{prop as string}</div>
                                    <div className="col-span-4 text-sm text-gray-500 line-through truncate">{formattedOld}</div>
                                    <div className="col-span-1 flex justify-center text-blue-400">
                                        <ArrowRight size={14} />
                                    </div>
                                    <div className={`col-span-4 text-sm font-bold truncate ${isChanged ? 'text-green-400' : 'text-gray-300'}`}>
                                        {formattedNew}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (requestForDetails.changeType === 'stock_adjustment') {
            return (
                <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl space-y-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ${requestForDetails.adjustmentType === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            <RefreshCw size={28} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-white">{requestForDetails.adjustmentType === 'IN' ? 'Stock Inbound' : 'Stock Outbound'}</h4>
                            <p className="text-gray-400 text-sm">Inventory level correction request</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Change Quantity</label>
                            <span className={`text-4xl font-black tracking-tighter ${requestForDetails.adjustmentType === 'IN' ? '+' : '-'}`}>{requestForDetails.adjustmentQty}</span>
                        </div>
                        <div className="p-5 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                            <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2">Stated Reason</label>
                            <span className="text-white text-lg font-bold block leading-tight">{requestForDetails.adjustmentReason}</span>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderChangeDiff = (change: PendingInventoryChange) => {
        if (change.changeType !== 'edit' || !change.proposedChanges) return null;

        const original = allProducts.find(p => p.id === change.productId);
        if (!original) return <span className="text-gray-500 italic">Original product not found</span>;

        const diffs: React.ReactNode[] = [];
        const propsToCompare: (keyof Product)[] = ['name', 'category', 'price', 'costPrice', 'salePrice', 'stock', 'sku', 'location', 'image'];

        propsToCompare.forEach(prop => {
            const oldValue = original[prop];
            const newValue = change.proposedChanges![prop];

            if (newValue !== undefined && newValue !== oldValue) {
                diffs.push(
                    <div key={prop as string} className="flex items-center gap-2 text-[10px] bg-black/40 rounded px-1.5 py-0.5 border border-white/5">
                        <span className="text-gray-500 uppercase font-bold">{prop as string}:</span>
                        <span className="text-red-400 line-through truncate max-w-[60px]">{String(oldValue || 'None')}</span>
                        <ArrowRight size={10} className="text-blue-400 shrink-0" />
                        <span className="text-green-400 font-bold truncate max-w-[80px]">{String(newValue)}</span>
                    </div>
                );
            }
        });

        if (diffs.length === 0) return <span className="text-amber-400/50 italic text-[10px]">No visible differences</span>;

        return (
            <div className="flex flex-wrap gap-1 mt-1">
                {diffs}
            </div>
        );
    };

    // Filter products by approval status
    const pendingProducts = useMemo(() => {
        const pending = filteredProducts.filter(p => p.approvalStatus === 'pending' || p.approval_status === 'pending');
        return pending;
    }, [filteredProducts]);

    const approvedProducts = useMemo(() => {
        return filteredProducts.filter(p => !p.approvalStatus || p.approvalStatus === 'approved' || p.approval_status === 'approved');
    }, [filteredProducts]);

    // Pending changes count for badge
    const pendingCount = pendingProducts.length + pendingChanges.length;

    // --- DATA PROCESSING (Server-Side) ---
    const totalInventoryValueCost = serverMetrics?.total_value_cost || 0;
    const totalInventoryValueRetail = serverMetrics?.total_value_retail || 0;
    const totalInventoryValue = totalInventoryValueCost; // Primary for Asset Value

    const filteredItems = useMemo(() => {
        // Server has already applied filters and sorting. 
        // We ensure localProducts is an array.
        let processed = Array.isArray(localProducts) ? localProducts : [];

        // Client-side ABC filter (imperfect but requested)
        if (filters.abc !== 'All') {
            processed = processed.filter(p => {
                const abc = getABCClass(p, totalInventoryValue);
                return abc === filters.abc;
            });
        }

        // No client-side sorting needed for most fields as server does it.
        // But for calculated fields (assetValue, abc), we sort client-side on the current page.
        if (sortConfig && ['assetValue', 'abc'].includes(sortConfig.key)) {
            processed.sort((a: Product, b: Product) => {
                let aValue: any = a[sortConfig.key as keyof Product];
                let bValue: any = b[sortConfig.key as keyof Product];

                // Handle special cases
                if (sortConfig.key === 'assetValue') {
                    aValue = a.stock * (a.costPrice || a.price * 0.7);
                    bValue = b.stock * (b.costPrice || b.price * 0.7);
                } else if (sortConfig.key === 'abc') {
                    aValue = getABCClass(a, totalInventoryValue);
                    bValue = getABCClass(b, totalInventoryValue);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [localProducts, filters.abc, sortConfig, totalInventoryValue]);



    // Analytics Data (Server-Side)
    const categoryData = useMemo(() => {
        if (serverMetrics?.category_stats) return serverMetrics.category_stats;
        return [];
    }, [serverMetrics]);

    const abcData = useMemo(() => {
        if (serverMetrics?.abc_stats) return serverMetrics.abc_stats;
        return [
            { name: 'Class A (Vital)', value: 0 },
            { name: 'Class B (Important)', value: 0 },
            { name: 'Class C (Standard)', value: 0 },
        ];
    }, [serverMetrics]);

    // --- HANDLERS ---

    const handleOpenAddProduct = () => {
        setEditingProduct(null);
        setSkuInput('');
        setBarcodeInput('');
        setSelectedMainCategory('');
        setSelectedSubCategory('');
        setProductBrand('');
        setProductSize('');
        setProductUnit('piece');
        setCostPriceInput('');
        setProductImage('');
        setProductNameInput('');
        setRetailPriceInput('');
        setStockInput('');
        setLocationInput('');
        setBarcodeAliases([]);
        setNewBarcodeAlias('');
        setTestBarcodeInput('');
        setIsProductModalOpen(true);
    };

    const handleOpenEditProduct = (product: Product) => {
        setEditingProduct(product);
        setSkuInput(product.sku);
        setBarcodeInput(product.barcode || '');
        setBarcodeAliases(product.barcodes || []);
        setNewBarcodeAlias('');
        setTestBarcodeInput('');
        // Parse category - check if it's a main category
        const mainCat = Object.keys(GROCERY_CATEGORIES).find(cat =>
            cat === product.category || GROCERY_CATEGORIES[cat].includes(product.category)
        );
        setSelectedMainCategory(mainCat || product.category);
        setSelectedSubCategory(GROCERY_CATEGORIES[mainCat || '']?.includes(product.category) ? product.category : '');
        setProductBrand((product as any).brand || '');
        setProductSize((product as any).size || '');
        setProductUnit((product as any).unit || 'piece');
        setCostPriceInput(product.costPrice?.toString() || '');
        setProductImage(product.image || '');
        // Parse the name to extract the base product name (without brand, size, unit)
        setProductNameInput(product.name || '');
        setRetailPriceInput(product.price?.toString() || '');
        setStockInput(product.stock?.toString() || '');
        setLocationInput(product.location || '');
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

    const handleDeleteAuditRecord = async (approval: BarcodeApproval) => {
        if (!window.confirm('Are you sure you want to delete this barcode mapping? This will remove the alias from the product.')) {
            return;
        }

        try {
            await rejectBarcodeMutation.mutateAsync({
                id: approval.id,
                userId: user?.id || 'system',
                reason: 'Manual deletion from Audit Log'
            });
        } catch (error) {
            // Already handled in hook
        }
    };

    const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const name = productNameInput;
        const price = parseFloat(retailPriceInput);

        if (!name || !skuInput || isNaN(price) || !selectedMainCategory || !stockInput) {
            addNotification('alert', "Please fill in all required fields: Category, Name, SKU, Price, and Stock.");
            return;
        }

        if (!activeSite?.id) {
            addNotification('alert', 'Please select a specific site (Warehouse or DC) before adding products.');
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

        // Build full product name (similar to PO): Brand + Name + Size + Unit + Pack
        const nameParts: string[] = [];
        if (productBrand?.trim()) nameParts.push(productBrand.trim());
        nameParts.push(name.trim());
        if (productSize?.trim()) {
            nameParts.push(`${productSize.trim()}${productUnit || ''}`);
        }
        let fullProductName = nameParts.join(' ');

        // Add Pack info if applicable
        const packQtyVal = packQuantity || 0;
        if (packQtyVal > 1) {
            fullProductName += ` – Pack of ${packQtyVal}`;
        }

        // Use sub-category if selected, otherwise main category
        const finalCategory = selectedSubCategory || selectedMainCategory;

        setIsSubmitting(true);
        try {
            const isNewProduct = !editingProduct;
            const stockQty = parseInt(stockInput) || 0;

            const newProduct: Product & { brand?: string; size?: string; unit?: string; packQuantity?: number } = {
                id: editingProduct ? editingProduct.id : `PROD-${Math.floor(Math.random() * 10000)}`,
                siteId: activeSite.id,
                name: fullProductName,
                sku: skuInput,
                barcode: barcodeInput || undefined,
                barcodes: barcodeAliases.length > 0 ? barcodeAliases : undefined,
                barcodeType: barcodeInput ? (formData.get('barcodeType') as 'EAN-13' | 'UPC-A' | 'CODE128' | 'CODE39' | 'QR' | 'OTHER') : undefined,
                category: finalCategory,
                price: price,
                costPrice: costPriceInput ? parseFloat(costPriceInput) : undefined,
                stock: 0, // CRITICAL: Initialize to 0. Stock will be added via Putaway Job to avoid double-counting.
                location: locationInput,
                expiryDate: formData.get('expiryDate') as string,
                status: 'active', // Default to active, availability depends on physical stock
                image: productImage || editingProduct?.image || '/placeholder.png',
                // Extended fields for PO consistency
                brand: productBrand || undefined,
                size: productSize || undefined,
                unit: productUnit || undefined,
                packQuantity: packQtyVal > 0 ? packQtyVal : undefined,
                // Approval workflow - super_admin auto-approves, others need approval
                approvalStatus: isNewProduct ? (canApprove ? 'approved' : 'pending') : editingProduct?.approvalStatus,
                createdBy: isNewProduct ? (user?.name || 'Unknown') : editingProduct?.createdBy,
                createdAt: isNewProduct ? new Date().toISOString() : editingProduct?.createdAt,
                approvedBy: isNewProduct && canApprove ? user?.name : editingProduct?.approvedBy,
                approvedAt: isNewProduct && canApprove ? new Date().toISOString() : editingProduct?.approvedAt,
            };

            if (editingProduct) {
                // For edits by non-super_admin, create a persistent pending change request
                if (!canApprove) {
                    const request: Omit<PendingInventoryChange, 'id'> = {
                        productId: editingProduct.id,
                        productName: editingProduct.name,
                        productSku: editingProduct.sku,
                        siteId: activeSite?.id || '',
                        changeType: 'edit',
                        requestedBy: user?.name || 'Unknown',
                        requestedAt: new Date().toISOString(),
                        status: 'pending',
                        proposedChanges: newProduct as Product,
                        adjustmentType: 'IN',
                        adjustmentQty: stockQty,
                        adjustmentReason: 'Initial stock on creation'
                    };

                    await inventoryRequestsService.create(request);
                    addNotification('info', `Edit request submitted for approval. Product: ${editingProduct.name}`);
                    loadPendingRequests(); // Refresh the list
                } else {
                    await updateProduct(newProduct);
                    addNotification('success', `Product "${fullProductName}" updated successfully.`);
                }
            } else {
                // Determine approval status based on role
                // If not canApprove, we create a persistent Request instead of a Product
                if (!canApprove) {
                    const request: Omit<PendingInventoryChange, 'id'> = {
                        productId: '', // New product
                        productName: fullProductName,
                        productSku: skuInput,
                        siteId: activeSite?.id || '',
                        changeType: 'create',
                        requestedBy: user?.name || 'Unknown',
                        requestedAt: new Date().toISOString(),
                        status: 'pending',
                        proposedChanges: newProduct as Product,
                        adjustmentType: 'IN',
                        adjustmentQty: stockQty,
                        adjustmentReason: 'Initial stock on creation'
                    };

                    await inventoryRequestsService.create(request);
                    addNotification('info', `Approval request for "${fullProductName}" submitted.`);
                    loadPendingRequests(); // Refresh the list
                    setIsProductModalOpen(false);
                    return;
                }

                const createdProduct = await addProduct(newProduct as Product);

                if (canApprove) {
                    addNotification('success', `Product "${fullProductName}" created. Putaway job queued.`);

                    // Automatically create Putaway Job if stock was added
                    if (stockQty > 0 && createdProduct?.id) {
                        try {
                            await createPutawayJob(createdProduct, stockQty, user?.name || 'System', 'Direct Entry');
                        } catch (jobError) {
                            console.error('Failed to auto-create putaway job:', jobError);
                            addNotification('alert', 'Product created but putaway job failed to queue.');
                        }
                    }
                }
            }

            setIsProductModalOpen(false);
            setEditingProduct(null);
            setSkuInput('');
            setBarcodeInput('');
            setSelectedMainCategory('');
            setSelectedSubCategory('');
            setProductBrand('');
            setProductSize('');
            setProductUnit('piece');
            setCostPriceInput('');
            setProductImage('');
            setProductNameInput('');
            setRetailPriceInput('');
            setStockInput('');
            setLocationInput('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = (id: string) => {
        setProductToDelete(id);
        setDeleteInput('');
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        if (deleteInput !== "DELETE") {
            addNotification('alert', 'Please type "DELETE" to confirm.');
            return;
        }
        const productDetails = filteredProducts.find(p => p.id === productToDelete);

        setIsSubmitting(true);
        try {
            await deleteMutation.mutateAsync({
                productId: productToDelete,
                productName: productDetails?.name || 'Unknown',
                productSku: productDetails?.sku || 'Unknown',
                siteId: activeSite?.id || user?.siteId || '',
                canApprove
            });
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            setDeleteInput('');
        } catch (error) {
            // Error handled by mutation onError
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveProduct = (product: Product) => {
        if (!canApprove) {
            addNotification('alert', 'Only CEO can approve products.');
            return;
        }
        approveRequestMutation.mutate({
            id: 'view-only',
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            changeType: 'create',
            proposedChanges: product as any,
            requestedBy: (product as any).createdBy || (product as any).created_by || 'Unknown',
            requestedAt: (product as any).createdAt || (product as any).created_at || '',
            status: 'pending',
            siteId: product.siteId || (product as any).site_id || ''
        } as PendingInventoryChange);
    };

    const handleRejectProduct = (product: Product) => {
        if (!canApprove) {
            addNotification('alert', 'Only CEO can reject products.');
            return;
        }
        if (!rejectionReason.trim()) {
            addNotification('alert', 'Please provide a reason for rejection.');
            return;
        }
        rejectRequestMutation.mutate({
            change: {
                id: 'view-only',
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                changeType: 'create',
                proposedChanges: product as any,
                requestedBy: (product as any).createdBy || (product as any).created_by || 'Unknown',
                requestedAt: (product as any).createdAt || (product as any).created_at || '',
                status: 'pending',
                siteId: product.siteId || (product as any).site_id || ''
            } as PendingInventoryChange,
            reason: rejectionReason
        });
        setIsApprovalModalOpen(false);
        setSelectedPendingProduct(null);
        setRejectionReason('');
    };

    const handleApproveChange = (change: PendingInventoryChange) => {
        if (!canApprove) return;
        approveRequestMutation.mutate(change);
    };

    const handleRejectChange = (change: PendingInventoryChange) => {
        if (!canApprove) return;
        const reason = rejectionReason.trim() || "Rejected by administrator";
        rejectRequestMutation.mutate({ change, reason });
        setIsApprovalModalOpen(false);
        setSelectedPendingChange(null);
        setRejectionReason('');
    };

    const handleBulkCleanupRequests = () => {
        if (!canApprove || pendingChanges.length === 0) return;
        if (!window.confirm(`Are you sure you want to reject all ${pendingChanges.length} pending requests? This will clear all "ghost" requests.`)) {
            return;
        }
        bulkCleanupMutation.mutate(pendingChanges);
    };

    const handleOpenAdjust = (product: Product) => {
        setEditingProduct(product);
        setAdjustQty('');
        setIsAdjustModalOpen(true);
    };

    const handleSubmitAdjustment = async () => {
        if (!editingProduct || !adjustQty) return;
        const qty = parseInt(adjustQty);
        if (isNaN(qty) || qty <= 0) return;

        setIsSubmitting(true);
        try {
            await adjustStockMutation.mutateAsync({
                productId: editingProduct.id,
                productName: editingProduct.name,
                productSku: editingProduct.sku,
                siteId: activeSite?.id || user?.siteId || '',
                quantity: qty,
                type: adjustType,
                reason: adjustReason,
                canApprove
            });
            setIsAdjustModalOpen(false);
            setEditingProduct(null);
        } catch (error) {
            // Error handled by mutation onError
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBulkAction = (action: string) => {
        addNotification('info', `${action} triggered for ${selectedIds.size} items.`);
        setSelectedIds(new Set());
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <Button onClick={() => setActiveTab(id)} variant={activeTab === id ? 'primary' : 'ghost'} className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'} `}>
            <Icon size={16} /><span>{label}</span>
        </Button>
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
                        {activeSite ? activeSite.name : "Global Inventory"}
                    </h2>
                    <p className="text-gray-400 text-sm">Real-time stock levels, warehouse positions, and audit tracking.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => {
                            setIsPrintHubOpen(true);
                        }}
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
                                <Plus className="w-4 h-4 mr-2" /> New Product
                            </button>
                        </Protected>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-cyber-gray p-1 rounded-xl border border-white/5 w-fit overflow-x-auto">
                <TabButton id="overview" label="Overview" icon={TrendingUp} />
                <TabButton id="stock" label="Products" icon={Layout} />
                <TabButton id="zones" label="Zones" icon={Map} />
                <TabButton id="movements" label="Movements" icon={ClipboardList} />
                {/* Barcode Audit Tab - Visible to Managers */}
                {canViewAuditLog && (
                    <Button onClick={() => setActiveTab('barcode_audit')} variant={activeTab === 'barcode_audit' ? 'primary' : 'ghost'} className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'barcode_audit' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-blue-400 hover:text-white hover:bg-white/5'} `}>
                        <Barcode size={16} />
                        <span>Barcode Mappings</span>
                        {barcodeApprovals.length > lastViewedBarcodeCount && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{barcodeApprovals.length - lastViewedBarcodeCount}</span>
                        )}
                    </Button>
                )}
                {/* Pending Approvals Tab - Visible to CEO Only */}
                {canViewPending && (
                    <Button onClick={() => setActiveTab('pending')} variant={activeTab === 'pending' ? 'primary' : 'ghost'} className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-amber-400 hover:text-white hover:bg-white/5'} `}>
                        <Clock size={16} />
                        <span>Pending Approvals</span>
                        {pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{pendingCount}</span>
                        )}
                    </Button>
                )}
            </div>

            {/* --- OVERVIEW TAB (ANALYTICS) --- */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <MetricCard title="Total Asset Value" value={formatCompactNumber(totalInventoryValueCost, { currency: CURRENCY_SYMBOL })} sub="Valued at Base Cost" icon={DollarSign} />
                        <MetricCard title="Potential Revenue" value={formatCompactNumber(totalInventoryValueRetail, { currency: CURRENCY_SYMBOL })} sub="Retail Valuation" icon={TrendingUp} />
                        <MetricCard title="Stock Turn Rate" value={`${serverMetrics?.stock_turnover_rate || 0}x`} sub="Annualized Ratio" icon={RefreshCw} />
                        <MetricCard title="Low Stock SKUs" value={serverMetrics?.low_stock_count ?? filteredProducts.filter(p => p.status === 'low_stock').length} sub="Requires Action" icon={AlertTriangle} />
                        <MetricCard title="Dead Stock Value" value={formatCompactNumber(serverMetrics?.dead_stock_value || 0, { currency: CURRENCY_SYMBOL })} sub="> 90 Days No Move" icon={XCircle} />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Value by Category */}
                        <div className="lg:col-span-2 bg-cyber-gray border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-6">Valuation by Category</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
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
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                                    <PieChart>
                                        <Pie data={abcData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {abcData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 mt-4">
                                {abcData.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <motion.div
                                                animate={{ backgroundColor: COLORS[i % COLORS.length] }}
                                                className="w-2 h-2 rounded-full"
                                            />
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
                        {/* Toolbar with Filters - Redesigned for Premium Elegance */}
                        <div className="p-6 border-b border-white/5 space-y-4 bg-white/2">
                            {/* Refined Search Bar */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl px-5 py-2.5 flex-1 focus-within:border-cyber-primary/50 transition-all shadow-inner group">
                                    <Search className="w-5 h-5 text-gray-500 group-focus-within:text-cyber-primary transition-colors" />
                                    <input
                                        type="text"
                                        aria-label="Search"
                                        placeholder="Search SKU, Name, or Warehouse Location..."
                                        className="bg-transparent border-none ml-3 flex-1 text-white outline-none placeholder:text-gray-600 font-medium text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="text-[11px] text-gray-500 font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                    {filteredItems.length} Records
                                </div>
                            </div>

                            {/* Elegant Filter System */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2 pr-4 border-r border-white/5">
                                    <SlidersHorizontal size={14} className="text-cyber-primary" />
                                    <span className="text-[11px] text-white font-black uppercase tracking-[0.15em]">Filters</span>
                                </div>

                                {/* NEW: Site Location Filter (Global View Only) */}
                                {(!activeSite || isReadOnly) && (
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Map size={12} className="text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <select
                                            value={filters.siteId}
                                            aria-label="Filter by Site"
                                            onChange={(e) => setFilters({ ...filters, siteId: e.target.value })}
                                            className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-8 pr-10 py-2 text-xs font-bold text-gray-300 outline-none cursor-pointer hover:bg-white/10 hover:border-blue-500/30 hover:text-white transition-all min-w-[160px]"
                                        >
                                            <option value="All">All Locations</option>
                                            {sites.filter(s => s.type !== 'Store' && s.type !== 'Administration').map(s => (
                                                <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors pointer-events-none" />
                                    </div>
                                )}

                                {/* Category Filter */}
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Package size={12} className="text-cyber-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <select
                                        value={filters.category}
                                        aria-label="Filter by Category"
                                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                        className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-8 pr-10 py-2 text-xs font-bold text-gray-300 outline-none cursor-pointer hover:bg-white/10 hover:border-cyber-primary/30 hover:text-white transition-all min-w-[160px]"
                                    >
                                        <option value="All">All Categories</option>
                                        {Array.from(new Set(filteredProducts.map(p => p.category))).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-cyber-primary transition-colors pointer-events-none" />
                                </div>

                                {/* Status Filter */}
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <div className="w-2 h-2 rounded-full border border-green-500/50 group-hover:bg-green-500 transition-all" />
                                    </div>
                                    <select
                                        value={filters.status}
                                        aria-label="Filter by Status"
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-8 pr-10 py-2 text-xs font-bold text-gray-300 outline-none cursor-pointer hover:bg-white/10 hover:border-green-500/30 hover:text-white transition-all min-w-[140px]"
                                    >
                                        <option value="All">All Inventory</option>
                                        <option value="Active">In Stock</option>
                                        <option value="Low Stock">Low Stock</option>
                                        <option value="Out of Stock">Out of Stock</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-green-400 transition-colors pointer-events-none" />
                                </div>

                                {/* Clear Filters */}
                                {(filters.category !== 'All' || filters.status !== 'All' || filters.abc !== 'All' || filters.siteId !== 'All') && (
                                    <button
                                        onClick={() => setFilters({ category: 'All', status: 'All', abc: 'All', priceRange: 'All', siteId: 'All' })}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase text-red-400 hover:text-white hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all ml-auto"
                                    >
                                        Reset Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bulk Action Bar */}
                        {selectedIds.size > 0 && (
                            <div className="bg-cyber-primary/10 border-b border-cyber-primary/20 p-2 flex items-center justify-between px-4 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-cyber-primary font-bold uppercase tracking-wider">{selectedIds.size} Selected</span>
                                    <Button onClick={() => handleBulkAction('Print Labels')} size="sm" variant="secondary" className="px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded text-[10px] font-bold text-white">Print Labels</Button>
                                    <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="ghost" className="px-3 py-1.5 text-[10px] text-gray-400 hover:text-white">Clear</Button>
                                </div>
                            </div>
                        )}

                        {/* Master Inventory Table - Refined for High-End Look */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-white/10 shadow-lg">
                                    <tr className="bg-white/[0.02]">
                                        <th className="p-5 w-10">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    aria-label="Select All"
                                                    className="peer appearance-none w-4 h-4 border border-white/20 rounded bg-white/5 checked:bg-cyber-primary checked:border-cyber-primary transition-all cursor-pointer"
                                                    onChange={() => {
                                                        if (selectedIds.size === filteredItems.length) setSelectedIds(new Set());
                                                        else setSelectedIds(new Set(filteredItems.map(i => i.id)));
                                                    }}
                                                    checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                                                />
                                                <CheckCircle size={10} className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                            </div>
                                        </th>

                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-2">
                                                Product
                                                <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'name' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                                    <ArrowUpDown size={10} className={sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                </div>
                                            </div>
                                        </th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('location')}>
                                            <div className="flex items-center gap-2">
                                                Location
                                                <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'location' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                                    <ArrowUpDown size={10} className={sortConfig?.key === 'location' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                </div>
                                            </div>
                                        </th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('stock')}>
                                            <div className="flex items-center justify-center gap-2">
                                                Stock Level
                                                <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'stock' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                                    <ArrowUpDown size={10} className={sortConfig?.key === 'stock' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                </div>
                                            </div>
                                        </th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('costPrice')}>
                                            <div className="flex items-center justify-end gap-2">
                                                Cost
                                                <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'costPrice' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                                    <ArrowUpDown size={10} className={sortConfig?.key === 'costPrice' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                </div>
                                            </div>
                                        </th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('price')}>
                                            <div className="flex items-center justify-end gap-2">
                                                Price
                                                <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'price' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                                    <ArrowUpDown size={10} className={sortConfig?.key === 'price' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                </div>
                                            </div>
                                        </th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('assetValue')}>
                                            <div className="flex items-center justify-end gap-2">
                                                Value
                                                <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'assetValue' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                                    <ArrowUpDown size={10} className={sortConfig?.key === 'assetValue' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                </div>
                                            </div>
                                        </th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('abc')}>
                                            <div className="flex items-center justify-center gap-2">
                                                Class
                                                <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'abc' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                                    <ArrowUpDown size={10} className={sortConfig?.key === 'abc' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                </div>
                                            </div>
                                        </th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('createdAt')}>
                                            <div className="flex items-center justify-end gap-2">
                                                Date
                                                <div className={`p-1 rounded transition-colors ${sortConfig?.key === 'createdAt' ? 'bg-cyber-primary/20 text-cyber-primary' : 'text-gray-600 group-hover:text-gray-400'}`}>
                                                    <ArrowUpDown size={10} className={sortConfig?.key === 'createdAt' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                </div>
                                            </div>
                                        </th>
                                        <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredItems.map((product) => {
                                        const abc = getABCClass(product, totalInventoryValue);
                                        const isSelected = selectedIds.has(product.id);
                                        const displayCostPrice = product.costPrice && product.costPrice > 0
                                            ? product.costPrice
                                            : (product.price && product.price > 0 ? product.price * 0.7 : 0);

                                        return (
                                            <tr key={product.id} className={`group hover:bg-white/[0.03] transition-all duration-300 ${isSelected ? 'bg-cyber-primary/[0.08]' : ''}`}>
                                                <td className="p-5">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            aria-label="Select row"
                                                            className="peer appearance-none w-4 h-4 border border-white/10 rounded bg-white/5 checked:bg-cyber-primary checked:border-cyber-primary transition-all cursor-pointer"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelection(product.id)}
                                                        />
                                                        <CheckCircle size={10} className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner group-hover:border-cyber-primary/30 transition-colors">
                                                            {product.image && !product.image.includes('placeholder.com') ? (
                                                                <img
                                                                    src={product.image}
                                                                    alt=""
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-700"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Package size={24} className="text-gray-700 group-hover:text-cyber-primary/40 transition-colors" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-black text-white tracking-tight group-hover:text-cyber-primary transition-colors">{product.name}</p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <span className="text-[9px] font-black font-mono text-gray-500 bg-black/40 px-2 py-0.5 rounded-md border border-white/5 uppercase tracking-tighter">{product.sku}</span>
                                                                <span className="text-[9px] font-black bg-white/5 px-2 py-0.5 rounded-md text-gray-400 uppercase tracking-tighter">{product.category}</span>
                                                                {product.approvalStatus === 'pending' && (
                                                                    <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-tighter">⏳ Review</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    {(!activeSite || isReadOnly) ? (
                                                        (() => {
                                                            const site = sites.find(s => s.id === product.siteId || s.id === (product as any).site_id);
                                                            return site ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                                        {site.name}
                                                                    </span>
                                                                    <span className="text-[9px] text-gray-600 font-bold uppercase mt-0.5 ml-3">{site.type}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-600 font-black uppercase italic tracking-widest">Unmapped Site</span>
                                                            );
                                                        })()
                                                    ) : (
                                                        product.location ? (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyber-primary/30 transition-all">
                                                                <Map size={10} className="text-cyber-primary" />
                                                                <span className="text-[11px] font-black text-white font-mono">{product.location}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest bg-red-500/5 px-3 py-1.5 rounded-xl border border-red-500/10">No Cell Assigned</span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className={`inline-flex items-center justify-center min-w-[50px] px-3 py-1.5 rounded-2xl text-[12px] font-black font-mono shadow-sm transition-all ${product.stock === 0 ? 'bg-red-500/10 text-red-500 border border-red-500/30' : product.stock < 10 ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-yellow-500/5' : 'bg-green-500/10 text-green-500 border border-green-500/30'}`}>
                                                        {product.stock}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[12px] font-black text-gray-400 font-mono tracking-tighter">
                                                            {displayCostPrice > 0 ? formatCompactNumber(displayCostPrice, { currency: CURRENCY_SYMBOL }) : '—'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Unit Cost</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[13px] font-black text-white font-mono tracking-tighter group-hover:text-cyber-primary transition-colors">
                                                            {product.price && product.price > 0 ? formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL }) : '—'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Retail Price</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="inline-flex flex-col items-end bg-black/20 p-2 rounded-xl border border-white/[0.03]">
                                                        <span className="text-[12px] font-black text-cyber-primary font-mono tracking-tighter">
                                                            {displayCostPrice > 0 ? formatCompactNumber(product.stock * displayCostPrice, { currency: CURRENCY_SYMBOL }) : '—'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Inventory Value</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black border transition-all ${abc === 'A' ? 'bg-green-500/10 text-green-500 border-green-500/30 shadow-lg shadow-green-500/5' : abc === 'B' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}`}>
                                                        {abc}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-gray-500 font-mono">
                                                            {product.createdAt ? formatDateTime(product.createdAt) :
                                                                (product as any).created_at ? formatDateTime((product as any).created_at) : '--'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-0.5">Date Added</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    {!isReadOnly && (
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                            <Protected permission="EDIT_PRODUCT">
                                                                <div className="flex items-center gap-1">
                                                                    <Protected permission="ADJUST_STOCK">
                                                                        <button
                                                                            onClick={() => handleOpenAdjust(product)}
                                                                            className="p-2 hover:bg-cyber-primary/10 hover:text-cyber-primary text-gray-500 rounded-xl transition-all"
                                                                            title="Adjust Stock"
                                                                        >
                                                                            <RefreshCw size={14} />
                                                                        </button>
                                                                    </Protected>
                                                                    <button
                                                                        onClick={() => handleOpenEditProduct(product)}
                                                                        className="p-2 hover:bg-blue-500/10 hover:text-blue-400 text-gray-500 rounded-xl transition-all"
                                                                        title="Edit Product"
                                                                    >
                                                                        <Edit size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteProduct(product.id)}
                                                                        className="p-2 hover:bg-red-500/10 hover:text-red-500 text-gray-500 rounded-xl transition-all"
                                                                        title="Delete Product"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
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

                        {/* Product Pagination Controls */}
                        <div className="flex justify-between items-center p-6 border-t border-white/5 bg-black/40 backdrop-blur-md rounded-b-3xl">
                            <div className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary animate-pulse" />
                                Displays: <span className="text-white">{localProducts.length}</span> <span className="text-gray-700">/</span> <span className="text-gray-400">{formatCompactNumber(totalProductCount)}</span> Records
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setCurrentProductPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentProductPage === 1 || productsLoading}
                                    className="px-4 py-2 bg-white/5 hover:bg-cyber-primary/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl text-[11px] font-black text-white transition-all border border-white/10 hover:border-cyber-primary/40 flex items-center gap-2 group"
                                >
                                    <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                                    Prev
                                </button>

                                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Page</span>
                                    <span className="text-[12px] font-black text-cyber-primary font-mono">{currentProductPage}</span>
                                    <span className="text-gray-700 mx-1 text-[10px]">/</span>
                                    <span className="text-[12px] font-black text-gray-500 font-mono">{Math.max(1, Math.ceil(totalProductCount / PRODUCTS_PER_PAGE))}</span>
                                </div>

                                <button
                                    onClick={() => setCurrentProductPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(totalProductCount / PRODUCTS_PER_PAGE))))}
                                    disabled={currentProductPage >= Math.ceil(totalProductCount / PRODUCTS_PER_PAGE) || productsLoading}
                                    className="px-4 py-2 bg-white/5 hover:bg-cyber-primary/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl text-[11px] font-black text-white transition-all border border-white/10 hover:border-cyber-primary/40 flex items-center gap-2 group"
                                >
                                    Next
                                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
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
                                        <div className={`p-3 rounded-xl ${zone.type === 'Cold' ? 'bg-blue-500/10 text-blue-400' : zone.type === 'Secure' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyber-primary/10 text-cyber-primary'}`}>
                                            {zone.type === 'Cold' ? <Thermometer size={24} /> : zone.type === 'Secure' ? <Shield size={24} /> : <Box size={24} />}
                                        </div>
                                        <div><h3 className="font-bold text-white text-lg">{zone.name}</h3><p className="text-xs text-gray-500 uppercase tracking-wider">{zone.type} Storage</p></div>
                                    </div>
                                    <div className="text-right"><span className={`text-2xl font-mono font-bold ${usagePercent > 90 ? 'text-red-400' : 'text-white'}`}>{usagePercent.toFixed(1)}%</span></div>
                                </div>
                                <div className="relative z-10">
                                    <div className="w-full bg-black/50 rounded-full h-4 border border-white/10 overflow-hidden relative">
                                        <motion.div
                                            animate={{ width: `${usagePercent}%` }}
                                            className={`h-full transition-all duration-1000 ${colorClass}`}
                                        />
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
                <div className="space-y-4">
                    {/* --- ADVANCED CONTROLS --- */}
                    <div className="p-4 bg-cyber-gray border border-white/5 rounded-2xl flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[300px] relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyber-primary transition-colors" size={16} />
                            <input
                                type="text"
                                value={movementsSearch}
                                onChange={(e) => setMovementsSearch(e.target.value)}
                                placeholder="Search by Product name or Reference ID..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/20 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Site Filter (Global Only) */}
                            {isReadOnly && (
                                <select
                                    aria-label="Filter Movement Site"
                                    value={movementsSiteFilter}
                                    onChange={(e) => setMovementsSiteFilter(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-primary/50"
                                >
                                    <option value="All">All Sites</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                </select>
                            )}

                            {/* Type Filter */}
                            <select
                                aria-label="Filter Movement Type"
                                value={movementsTypeFilter}
                                onChange={(e) => setMovementsTypeFilter(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-primary/50"
                            >
                                <option value="All">All Types</option>
                                <option value="IN">Inbound (Stock In)</option>
                                <option value="OUT">Outbound (Stock Out)</option>
                                <option value="ADJUSTMENT">Adjustments</option>
                                <option value="TRANSFER">Transfers</option>
                            </select>

                            {/* Sort */}
                            <select
                                aria-label="Sort Movements"
                                value={`${movementsSort.key}-${movementsSort.direction}`}
                                onChange={(e) => {
                                    const [key, direction] = e.target.value.split('-');
                                    setMovementsSort({ key, direction: direction as 'asc' | 'desc' });
                                }}
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-primary/50"
                            >
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="quantity-desc">Highest Qty</option>
                                <option value="quantity-asc">Lowest Qty</option>
                            </select>

                            {(movementsSearch || movementsTypeFilter !== 'All' || (isReadOnly && movementsSiteFilter !== 'All')) && (
                                <button
                                    onClick={() => {
                                        setMovementsSearch('');
                                        setMovementsTypeFilter('All');
                                        setMovementsSiteFilter('All');
                                    }}
                                    className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors shrink-0"
                                    title="Clear All Filters"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5"><h3 className="font-bold text-white">Stock Movements</h3><p className="text-xs text-gray-400 mt-1">Immutable history of inventory changes.</p></div>
                        <div className="overflow-x-auto relative min-h-[400px]">
                            {movementsLoading && (
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                                    <div className="w-10 h-10 border-4 border-cyber-primary/20 border-t-cyber-primary rounded-full animate-spin" />
                                </div>
                            )}
                            <table className="w-full text-left">
                                <thead><tr className="bg-black/20 border-b border-white/5"><th className="p-4 text-xs text-gray-500 uppercase">Ref ID</th><th className="p-4 text-xs text-gray-500 uppercase">Time</th><th className="p-4 text-xs text-gray-500 uppercase">Type</th><th className="p-4 text-xs text-gray-500 uppercase">Product</th><th className="p-4 text-xs text-gray-500 uppercase text-right">Qty</th><th className="p-4 text-xs text-gray-500 uppercase">User</th><th className="p-4 text-xs text-gray-500 uppercase">Reason</th></tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {localMovements.map((move) => (
                                        <tr key={move.id} className="hover:bg-white/5">
                                            <td className="p-4 text-xs font-mono text-gray-400">{move.id?.slice(0, 8).toUpperCase()}</td>
                                            <td className="p-4 text-xs text-white">{formatDateTime(move.date, { showTime: true })}</td>
                                            <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${move.type === 'IN' ? 'text-green-400 border-green-400/20 bg-green-400/5' : move.type === 'OUT' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' : 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'} `}>{move.type}</span></td>
                                            <td className="p-4 text-sm text-white">{move.productName}</td>
                                            <td className={`p-4 text-sm font-mono text-right font-bold ${move.type === 'IN' ? 'text-green-400' : 'text-white'} `}>{move.type === 'IN' ? '+' : ''}{move.quantity}</td>
                                            <td className="p-4 text-xs text-gray-300">{move.performedBy}</td>
                                            <td className="p-4 text-xs text-gray-500 italic">{move.reason}</td>
                                        </tr>
                                    ))}
                                    {!movementsLoading && localMovements.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-10 text-center text-gray-500 italic text-sm">
                                                No stock movements found matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center p-4 border-t border-white/5 bg-black/20">
                            <div className="text-xs text-gray-400">
                                Showing {localMovements.length} of {formatCompactNumber(totalMovementsCount)} records
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentMovementsPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentMovementsPage === 1 || movementsLoading}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white transition-colors border border-white/10"
                                >
                                    Previous
                                </button>
                                <span className="flex items-center px-2 text-xs text-gray-400 font-mono">
                                    Page {currentMovementsPage}
                                </span>
                                <button
                                    onClick={() => setCurrentMovementsPage(prev => (localMovements.length === MOVEMENTS_PER_PAGE ? prev + 1 : prev))}
                                    disabled={localMovements.length < MOVEMENTS_PER_PAGE || movementsLoading}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white transition-colors border border-white/10"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- BARCODE AUDIT TAB (Visible to Managers) --- */}
            {activeTab === 'barcode_audit' && canViewAuditLog && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="font-bold text-blue-400 flex items-center gap-2">
                                <Barcode size={18} /> Barcode Mapping Audit Log
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">{filteredBarcodes.length} barcode mappings matched</p>
                        </div>

                        {/* Advanced Filters */}
                        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by product, barcode, or SKU..."
                                    value={barcodeSearch}
                                    onChange={(e) => {
                                        setBarcodeSearch(e.target.value);
                                        setCurrentBarcodePage(1);
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                {isReadOnly && (
                                    <div className="relative group min-w-[180px]">
                                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                        <select
                                            aria-label="Filter by Location"
                                            value={barcodeSiteFilter}
                                            onChange={(e) => {
                                                setBarcodeSiteFilter(e.target.value);
                                                setCurrentBarcodePage(1);
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-10 pr-10 text-[11px] font-black uppercase tracking-widest text-gray-300 appearance-none focus:border-blue-500/50 transition-all cursor-pointer"
                                        >
                                            <option value="All">All Locations</option>
                                            {sites.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                                    </div>
                                )}

                                <div className="relative group min-w-[180px]">
                                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                    <select
                                        aria-label="Sort Audit Log"
                                        value={`${barcodeSort.key}-${barcodeSort.direction}`}
                                        onChange={(e) => {
                                            const [key, direction] = e.target.value.split('-');
                                            setBarcodeSort({ key, direction: direction as 'asc' | 'desc' });
                                        }}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-10 pr-10 text-[11px] font-black uppercase tracking-widest text-gray-300 appearance-none focus:border-blue-500/50 transition-all cursor-pointer"
                                    >
                                        <option value="date-desc">Newest First</option>
                                        <option value="date-asc">Oldest First</option>
                                        <option value="product-asc">Product (A-Z)</option>
                                        <option value="product-desc">Product (Z-A)</option>
                                        <option value="duration-desc">Longest Duration</option>
                                        <option value="duration-asc">Fastest Duration</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                                </div>

                                {(barcodeSearch || barcodeSiteFilter !== 'All') && (
                                    <button
                                        onClick={() => {
                                            setBarcodeSearch('');
                                            setBarcodeSiteFilter('All');
                                            setCurrentBarcodePage(1);
                                        }}
                                        className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                        title="Clear all filters"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {filteredBarcodes.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Barcode size={48} className="mx-auto opacity-30 mb-4" />
                                    <p>{barcodeSearch || barcodeSiteFilter !== 'All' ? 'No mappings match your search.' : 'No barcode mappings recorded yet.'}</p>
                                    <p className="text-xs mt-2">When cashiers map unknown barcodes to products, they will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredBarcodes.slice((currentBarcodePage - 1) * BARCODE_PER_PAGE, currentBarcodePage * BARCODE_PER_PAGE).map((approval) => (
                                        <div
                                            key={approval.id}
                                            className="group bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/30 rounded-2xl transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="p-4 flex flex-col md:flex-row md:items-center gap-6">
                                                {/* Left: Product Info & Thumb */}
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-blue-500/30 transition-colors">
                                                        {approval.image_url ? (
                                                            <img src={approval.image_url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-700 bg-black/20">
                                                                <Barcode size={24} className="opacity-20" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-[14px] font-black text-white tracking-tight group-hover:text-blue-400 transition-colors truncate">
                                                            {approval.product?.name || 'Unknown Product'}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black font-mono text-gray-500 bg-black/40 px-2 py-0.5 rounded-md border border-white/5 uppercase tracking-tighter">
                                                                {approval.product?.sku || 'NO SKU'}
                                                            </span>
                                                            <span className="text-[10px] font-black text-blue-400/80 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded-md">
                                                                Mapped to {approval.barcode}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Middle: Attribution */}
                                                <div className="flex flex-wrap items-center gap-8 text-[11px] font-medium text-gray-400">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">Recorded By</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                                                <User size={10} className="text-cyan-400" />
                                                            </div>
                                                            <span className="text-gray-300 font-bold">{getEmployeeName(approval.created_by)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">Timestamp</span>
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={12} className="text-gray-500" />
                                                            <span className="text-gray-300 font-mono tracking-tighter">{formatDateTime(approval.created_at || '', { showTime: true })}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600 font-bold">Status</span>
                                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse" />
                                                            <span className="text-green-400 font-black text-[9px] uppercase tracking-wider">Synced</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Actions */}
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAuditRecord(approval);
                                                            setIsApprovalDetailsOpen(true);
                                                        }}
                                                        className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest group/btn"
                                                    >
                                                        Details
                                                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </button>
                                                    {user?.role === 'super_admin' && (
                                                        <button
                                                            onClick={() => handleDeleteAuditRecord(approval)}
                                                            className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center group/del"
                                                            title="Delete Mapping"
                                                        >
                                                            <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {filteredBarcodes.length > 0 && (
                                <div className="flex justify-between items-center mt-8 p-4 border-t border-white/5 bg-black/20 rounded-b-2xl">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3 ml-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Showing {(currentBarcodePage - 1) * BARCODE_PER_PAGE + 1} - {Math.min(currentBarcodePage * BARCODE_PER_PAGE, filteredBarcodes.length)} of {filteredBarcodes.length} Records
                                    </div>
                                    {filteredBarcodes.length > BARCODE_PER_PAGE && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentBarcodePage(prev => Math.max(1, prev - 1))}
                                                disabled={currentBarcodePage === 1}
                                                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setCurrentBarcodePage(prev => (currentBarcodePage * BARCODE_PER_PAGE < filteredBarcodes.length ? prev + 1 : prev))}
                                                disabled={currentBarcodePage * BARCODE_PER_PAGE >= filteredBarcodes.length}
                                                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- PENDING APPROVALS TAB (Visible to CEO Only) --- */}
            {activeTab === 'pending' && canViewPending && (
                <div className="space-y-6 animate-in fade-in">
                    {/* Pending Products Section */}
                    <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-amber-400 flex items-center gap-2">
                                    <Package size={18} /> New Products Awaiting Approval
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">{pendingProducts.length} products pending review</p>
                            </div>
                        </div>


                        {pendingProducts.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <CheckCircle size={48} className="mx-auto opacity-30 mb-4" />
                                <p>No pending products awaiting approval.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead><tr className="bg-black/20 border-b border-white/5">
                                        <th className="p-4 text-xs text-gray-500 uppercase">Product</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase">SKU</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase">Category</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase text-right">Price</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase">Created By</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase">Created At</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase text-center">Actions</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pendingProducts.map((prod) => (
                                            <tr key={prod.id} className="hover:bg-white/5">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {prod.image && !prod.image.includes('placeholder.com') ? (
                                                                <img
                                                                    src={prod.image}
                                                                    alt={prod.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Package size={16} className="text-gray-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-white text-sm">{prod.name}</p>
                                                            <p className="text-[10px] text-gray-400">{prod.brand}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-gray-400">{prod.sku}</td>
                                                <td className="p-4 text-xs text-gray-300">{prod.category}</td>
                                                <td className="p-4 text-sm font-bold text-white text-right">{CURRENCY_SYMBOL}{prod.price?.toLocaleString()}</td>
                                                <td className="p-4 text-xs text-cyan-400 flex items-center gap-1">
                                                    <User size={12} /> {prod.createdBy || prod.created_by || 'Unknown'}
                                                </td>
                                                <td className="p-4 text-xs text-gray-400">
                                                    {prod.createdAt || prod.created_at ? formatDateTime(prod.createdAt || prod.created_at || '') : '-'}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {canApprove ? (
                                                            <>
                                                                <Button
                                                                    onClick={() => handleApproveProduct(prod)}
                                                                    disabled={isSubmitting}
                                                                    loading={isSubmitting}
                                                                    variant="success"
                                                                    size="sm"
                                                                    icon={<CheckCircle size={14} />}
                                                                    className="px-3 py-1.5"
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    onClick={() => {
                                                                        const pseudoRequest: PendingInventoryChange = {
                                                                            id: 'view-only',
                                                                            productId: prod.id,
                                                                            productName: prod.name,
                                                                            productSku: prod.sku,
                                                                            changeType: 'create',
                                                                            proposedChanges: prod as any,
                                                                            requestedBy: (prod as any).createdBy || (prod as any).created_by || 'Unknown',
                                                                            requestedAt: (prod as any).createdAt || (prod as any).created_at || '',
                                                                            status: 'pending',
                                                                            siteId: prod.siteId || (prod as any).site_id || ''
                                                                        };
                                                                        setRequestForDetails(pseudoRequest);
                                                                        setIsRequestDetailsModalOpen(true);
                                                                    }}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    icon={<Search size={14} />}
                                                                    className="px-3 py-1.5 bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500/20"
                                                                >
                                                                    Details
                                                                </Button>
                                                                <Button
                                                                    onClick={() => { setSelectedPendingProduct(prod); setIsApprovalModalOpen(true); }}
                                                                    variant="danger"
                                                                    size="sm"
                                                                    icon={<XCircle size={14} />}
                                                                    className="px-3 py-1.5"
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center justify-center">
                                                                <span className="text-xs text-amber-500/50 italic border border-amber-500/10 px-3 py-1 bg-amber-500/5 rounded-lg flex items-center gap-1">
                                                                    <Clock size={12} /> Awaiting CEO
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}


                    </div>

                    {/* Pending Changes Section (Edits, Deletes, Stock Adjustments) */}
                    <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-orange-400 flex items-center gap-2">
                                    <Edit size={18} /> Change Requests Awaiting Approval
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">{pendingChanges.length} change requests pending review</p>
                            </div>
                            {canApprove && pendingChanges.length > 0 && (
                                <Button
                                    onClick={handleBulkCleanupRequests}
                                    variant="danger"
                                    size="sm"
                                    icon={<Trash2 size={14} />}
                                    className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20"
                                >
                                    Clear Ghost Requests
                                </Button>
                            )}
                        </div>
                        {pendingChanges.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <CheckCircle size={48} className="mx-auto opacity-30 mb-4" />
                                <p>No pending change requests.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead><tr className="bg-black/20 border-b border-white/5">
                                        <th className="p-4 text-xs text-gray-500 uppercase">Request Type</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase">Product</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase">SKU</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase">Details</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase">Requested By</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase">Requested At</th>
                                        <th className="p-4 text-xs text-gray-500 uppercase text-center">Actions</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pendingChanges.map((change) => (
                                            <tr key={change.id} className="hover:bg-white/5">
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${change.changeType === 'edit' ? 'text-blue-400 border-blue-400/20 bg-blue-400/10' :
                                                        change.changeType === 'delete' ? 'text-red-400 border-red-400/20 bg-red-400/10' :
                                                            'text-yellow-400 border-yellow-400/20 bg-yellow-400/10'
                                                        }`}>
                                                        {change.changeType === 'stock_adjustment' ? 'Stock Adj.' : change.changeType}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-semibold text-white text-sm">{change.productName}</td>
                                                <td className="p-4 font-mono text-xs text-gray-400">{change.productSku}</td>
                                                <td className="p-4 text-xs text-gray-300">
                                                    {change.changeType === 'delete' && (
                                                        <span className="flex items-center gap-2 text-red-400 font-medium">
                                                            <Trash2 size={12} /> Permanently delete this product
                                                        </span>
                                                    )}
                                                    {change.changeType === 'edit' && (
                                                        <div className="space-y-1">
                                                            <span className="text-blue-400 font-medium flex items-center gap-1">
                                                                <Edit size={12} /> Field Updates Requested:
                                                            </span>
                                                            {renderChangeDiff(change)}
                                                        </div>
                                                    )}
                                                    {change.changeType === 'stock_adjustment' && (
                                                        <div className="space-y-1">
                                                            <span className="text-yellow-400 font-medium flex items-center gap-1">
                                                                <RefreshCw size={12} /> Stock Adjustment:
                                                            </span>
                                                            <span className={change.adjustmentType === 'IN' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                                                {change.adjustmentType === 'IN' ? '+' : '-'}{change.adjustmentQty} units
                                                            </span>
                                                            <p className="text-[10px] text-gray-500 italic mt-0.5">Reason: {change.adjustmentReason}</p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-xs text-cyan-400 flex items-center gap-1">
                                                    <User size={12} /> {change.requestedBy}
                                                </td>
                                                <td className="p-4 text-xs text-gray-400">
                                                    {formatDateTime(change.requestedAt || (change as any).requested_at || '', { showTime: true })}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {canApprove ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                onClick={() => handleApproveChange(change)}
                                                                disabled={isSubmitting}
                                                                loading={isSubmitting}
                                                                variant="success"
                                                                size="sm"
                                                                icon={<CheckCircle size={14} />}
                                                                className="px-3 py-1.5"
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setRequestForDetails(change);
                                                                    setIsRequestDetailsModalOpen(true);
                                                                }}
                                                                variant="ghost"
                                                                size="sm"
                                                                icon={<Search size={14} />}
                                                                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500/20"
                                                            >
                                                                Details
                                                            </Button>
                                                            <Button
                                                                onClick={() => { setSelectedPendingChange(change); setIsApprovalModalOpen(true); }}
                                                                variant="danger"
                                                                size="sm"
                                                                icon={<XCircle size={14} />}
                                                                className="px-3 py-1.5"
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-amber-500/50 italic">Awaiting CEO</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Detailed Request Modal */}
            <Modal
                isOpen={isRequestDetailsModalOpen}
                onClose={() => {
                    setIsRequestDetailsModalOpen(false);
                    setRequestForDetails(null);
                }}
                title={`Request Details: ${requestForDetails?.productName || 'Inventory Change'}`}
                size="lg"
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${requestForDetails?.changeType === 'edit' ? 'bg-blue-500/20 text-blue-400' :
                                requestForDetails?.changeType === 'delete' ? 'bg-red-500/20 text-red-400' :
                                    requestForDetails?.changeType === 'stock_adjustment' ? 'bg-yellow-500/20 text-yellow-500' :
                                        'bg-green-500/20 text-green-400'
                                }`}>
                                {requestForDetails?.changeType === 'edit' && <Edit size={20} />}
                                {requestForDetails?.changeType === 'delete' && <Trash2 size={20} />}
                                {requestForDetails?.changeType === 'stock_adjustment' && <RefreshCw size={20} />}
                                {requestForDetails?.changeType === 'create' && <Plus size={20} />}
                            </div>
                            <div>
                                <h4 className="text-white font-bold">{requestForDetails?.productName}</h4>
                                <p className="text-gray-400 text-xs">SKU: {requestForDetails?.productSku}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Requested By</p>
                            <p className="text-cyan-400 text-sm font-medium">{requestForDetails?.requestedBy}</p>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {renderDetailedComparison()}
                    </div>

                    {canApprove && (
                        <div className="flex gap-4 pt-4 border-t border-white/5">
                            <Button
                                onClick={() => {
                                    setIsRequestDetailsModalOpen(false);
                                    if (requestForDetails) {
                                        if (requestForDetails.id === 'view-only') {
                                            const original = pendingProducts.find(p => p.id === requestForDetails.productId);
                                            if (original) handleApproveProduct(original);
                                        } else {
                                            handleApproveChange(requestForDetails);
                                        }
                                    }
                                }}
                                variant="success"
                                icon={<CheckCircle size={18} />}
                                className="flex-1 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold transition-all shadow-lg shadow-green-500/20"
                            >
                                Approve Request
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsRequestDetailsModalOpen(false);
                                    if (requestForDetails) {
                                        if (requestForDetails.id === 'view-only') {
                                            const original = pendingProducts.find(p => p.id === requestForDetails.productId);
                                            if (original) setSelectedPendingProduct(original);
                                        } else {
                                            setSelectedPendingChange(requestForDetails);
                                        }
                                        setIsApprovalModalOpen(true);
                                    }
                                }}
                                variant="danger"
                                icon={<XCircle size={18} />}
                                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 font-bold"
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Rejection Reason Modal */}
            <Modal isOpen={isApprovalModalOpen} onClose={() => { setIsApprovalModalOpen(false); setSelectedPendingProduct(null); setSelectedPendingChange(null); setRejectionReason(''); }} title="Reject Request" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                        Please provide a reason for rejecting this {selectedPendingProduct ? 'product' : 'change request'}.
                    </p>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Rejection Reason</label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection..."
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm h-24 resize-none"
                            required
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => { setIsApprovalModalOpen(false); setSelectedPendingProduct(null); setSelectedPendingChange(null); setRejectionReason(''); }}
                            variant="secondary"
                            className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedPendingProduct) handleRejectProduct(selectedPendingProduct);
                                else if (selectedPendingChange) handleRejectChange(selectedPendingChange);
                            }}
                            disabled={isSubmitting || !rejectionReason.trim()}
                            variant="danger"
                            className="flex-1 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white font-bold disabled:opacity-50"
                        >
                            Confirm Rejection
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modals - Add/Edit Product */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Inbound Stock Entry'} size="lg">
                <ProductForm
                    initialData={editingProduct || undefined}
                    isSubmitting={isSubmitting}
                    onCancel={() => setIsProductModalOpen(false)}
                    onSubmit={async (data) => {
                        setIsSubmitting(true);
                        try {
                            await saveMutation.mutateAsync({
                                product: data,
                                isNew: !editingProduct,
                                activeSite: activeSite as any,
                                user,
                                canApprove,
                                stockToAdjust: data.stock
                            });
                            addNotification('success', `Product "${data.name}" processed.`);
                            setIsProductModalOpen(false);
                            refreshData();
                        } catch (err: any) {
                            addNotification('alert', err.message || 'Failed to save product');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                />
            </Modal>

            {/* Adjustment Modal */}
            <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Stock Adjustment">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={() => setAdjustType('IN')}
                            variant={adjustType === 'IN' ? 'success' : 'ghost'}
                            icon={<Plus size={16} />}
                            className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 ${adjustType === 'IN' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                        >
                            Add
                        </Button>
                        <Button
                            onClick={() => setAdjustType('OUT')}
                            variant={adjustType === 'OUT' ? 'danger' : 'ghost'}
                            icon={<Minus size={16} />}
                            className={`p-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 ${adjustType === 'OUT' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                        >
                            Remove
                        </Button>
                    </div>
                    <input aria-label="Adjustment Quantity" type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-lg font-mono focus:border-cyber-primary" placeholder="Quantity" />
                    <Button
                        onClick={handleSubmitAdjustment}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        fullWidth
                        className="py-3 bg-cyber-primary text-black font-bold rounded-xl"
                    >
                        Confirm Adjustment
                    </Button>
                </div>
            </Modal>
            {/* --- Barcode Rejection Modal --- */}
            {isBarcodeRejectionModalOpen && selectedBarcodeApproval && (
                <Modal
                    isOpen={isBarcodeRejectionModalOpen}
                    onClose={() => setIsBarcodeRejectionModalOpen(false)}
                    title="Reject Barcode Mapping"
                >
                    <div className="p-6">
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3">
                            <AlertTriangle className="text-red-500 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Confirm Rejection</h4>
                                <p className="text-xs text-gray-400">
                                    Rejecting this mapping for <span className="text-white font-mono font-bold">{selectedBarcodeApproval.barcode}</span> will
                                    immediately remove it from {selectedBarcodeApproval.product?.name}'s catalog.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rejection Reason</label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain why this mapping is incorrect (e.g., Wrong product, blurry image, invalid barcode)..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500/50 min-h-[120px]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={() => setIsBarcodeRejectionModalOpen(false)}
                                    variant="ghost"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!rejectionReason.trim()) {
                                            addNotification('alert', 'Please provide a reason for rejection');
                                            return;
                                        }
                                        if (selectedBarcodeApproval) {
                                            await rejectBarcodeMutation.mutateAsync({
                                                id: selectedBarcodeApproval.id,
                                                userId: user?.id || '',
                                                reason: rejectionReason
                                            });
                                        }
                                        setIsBarcodeRejectionModalOpen(false);
                                        setRejectionReason('');
                                    }}
                                    variant="danger"
                                    className="flex-[2]"
                                    disabled={!rejectionReason.trim()}
                                >
                                    Confirm Rejection
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* --- Barcode Audit Details Modal --- */}
            <Modal
                isOpen={isApprovalDetailsOpen}
                onClose={() => setIsApprovalDetailsOpen(false)}
                title="Mapping Verification"
                size="2xl"
            >
                {selectedAuditRecord && (
                    <div className="p-1 sm:p-2 space-y-6 animate-in fade-in zoom-in duration-300">
                        {/* Evidence Viewer Section */}
                        <div className="relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shadow-2xl w-full">
                            {selectedAuditRecord.image_url ? (
                                <div className="flex flex-col w-full">
                                    <div className="relative max-h-[75vh] flex items-center justify-center p-2 bg-black/20">
                                        <img
                                            src={selectedAuditRecord.image_url}
                                            alt="Evidence"
                                            className="max-w-full max-h-[75vh] object-contain rounded-2xl"
                                        />

                                        {/* Floating Badge instead of gradient overlay */}
                                        <div className="absolute top-4 right-4 px-4 py-2 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 text-blue-400 font-black text-xs tracking-widest flex items-center gap-2 shadow-2xl">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            EVIDENCE: {selectedAuditRecord.barcode}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-gray-600 gap-4">
                                    <Camera size={64} strokeWidth={1} />
                                    <p className="text-xs uppercase tracking-widest font-black">No evidence photo available</p>
                                </div>
                            )}
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Product Info Card */}
                            <div className="col-span-1 md:col-span-2 bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex items-start gap-6 hover:bg-white/[0.05] transition-colors">
                                <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {selectedAuditRecord.product?.image ? (
                                        <img src={selectedAuditRecord.product.image} alt="Ref" className="w-full h-full object-cover opacity-60" />
                                    ) : (
                                        <Package size={32} className="text-gray-700" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1 block">Linked Product</span>
                                    <h3 className="text-xl font-black text-white truncate mb-2">{selectedAuditRecord.product?.name || 'Unknown Item'}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-black/40 rounded-lg text-xs font-mono text-gray-400 border border-white/5">SKU: {selectedAuditRecord.product?.sku || 'N/A'}</span>
                                        <span className="px-3 py-1 bg-black/40 rounded-lg text-xs font-bold text-gray-400 border border-white/5 uppercase">{selectedAuditRecord.product?.category || 'General'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Attribution Details */}
                            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-6">
                                <div>
                                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-3 block">Logged By</span>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                                            <User size={18} className="text-cyan-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">{getEmployeeName(selectedAuditRecord.created_by)}</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-black">Verified Session</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-white/5">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 block">Site Location</span>
                                    <div>
                                        <div className="flex items-center gap-2 text-white font-bold text-sm">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                            {sites.find(s => s.id === (selectedAuditRecord.site_id || selectedAuditRecord.siteId))?.name || 'Unknown Site'}
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-mono mt-1 ml-4 uppercase tracking-wider">
                                            ID: {sites.find(s => s.id === (selectedAuditRecord.site_id || selectedAuditRecord.siteId))?.code || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 block">Audit Details</span>
                                    <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Date</span>
                                            <span className="text-white font-mono">
                                                {selectedAuditRecord.created_at ? new Date(selectedAuditRecord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-gray-500 font-bold uppercase tracking-wider">Time</span>
                                            <span className="text-white font-mono">
                                                {selectedAuditRecord.created_at ? new Date(selectedAuditRecord.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                                            </span>
                                        </div>
                                        {selectedAuditRecord.resolution_time !== undefined && selectedAuditRecord.resolution_time !== null && (
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-gray-500 font-bold uppercase tracking-wider">Duration</span>
                                                <span className="text-cyber-primary font-black uppercase">
                                                    {selectedAuditRecord.resolution_time >= 60
                                                        ? `${Math.floor(selectedAuditRecord.resolution_time / 60)}m ${selectedAuditRecord.resolution_time % 60}s`
                                                        : `${selectedAuditRecord.resolution_time}s`}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-gray-500 font-bold uppercase tracking-wider">Method</span>
                                            <span className="text-orange-400 font-black uppercase">POS Entry</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <div className="w-full py-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center">
                                        <span className="text-[32px] font-black tracking-tighter text-blue-500/20 font-mono">#{selectedAuditRecord.id?.slice(0, 8).toUpperCase()}</span>
                                        <span className="text-[8px] uppercase tracking-widest text-gray-600 font-black">Audit Reference</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={() => setIsApprovalDetailsOpen(false)}
                                className="px-12 py-4 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform"
                            >
                                Dismiss Log
                            </button>
                        </div>
                    </div>
                )}
            </Modal>


            {/* Label Print Modal */}
            <LabelPrintModal isOpen={isPrintHubOpen} onClose={() => setIsPrintHubOpen(false)} labels={Array.from(selectedIds).map(id => { const p = filteredProducts.find(p => p.id === id); return p ? { product: p, quantity: 1, location: p.location, receivedDate: new Date().toISOString().split('T')[0] } : null; }).filter(Boolean) as any[]} onPrint={() => { addNotification('success', `${selectedIds.size} labels sent.`); setIsPrintHubOpen(false); setSelectedIds(new Set()); }} />

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                        <AlertTriangle size={24} />
                        <div>
                            <h3 className="font-bold text-white">⚠️ Permanent Cascade Delete</h3>
                            <p className="text-xs opacity-80">This will permanently delete the product AND all related records including:</p>
                        </div>
                    </div>
                    <ul className="text-sm text-gray-300 list-disc list-inside space-y-1 pl-2 bg-black/20 p-3 rounded-lg">
                        <li>All stock movement history</li>
                        <li>Related sale records</li>
                        <li>Pending inventory requests</li>
                        <li>Audit trail for this product</li>
                    </ul>
                    <p className="text-sm text-gray-300">Type <span className="font-bold text-white">DELETE</span> below to confirm:</p>
                    <input aria-label="Confirmation Text" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 transition-colors" placeholder="Type DELETE" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isSubmitting}
                            variant="secondary"
                            className="flex-1 py-3 text-white font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            disabled={isSubmitting || deleteMutation.isPending}
                            loading={isSubmitting || deleteMutation.isPending}
                            variant="danger"
                            className="flex-1 py-3 text-white font-bold"
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}
