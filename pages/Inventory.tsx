import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpDown, MoreHorizontal, AlertTriangle, FileText, Download, Printer, Box, Trash2, Edit, RefreshCw, Map, TrendingUp, Layout, ClipboardList, Thermometer, Shield, XCircle, DollarSign, ChevronDown, Minus, Barcode, Package, Loader2, Clock, CheckCircle, User, ArrowRight } from 'lucide-react';
import { formatCompactNumber, formatDateTime } from '../utils/formatting';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { MOCK_ZONES, CURRENCY_SYMBOL, GROCERY_CATEGORIES, COMMON_UNITS } from '../constants';
import ImageUpload from '../components/ImageUpload';
import { Product, StockMovement, PendingInventoryChange } from '../types';
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

type Tab = 'overview' | 'stock' | 'zones' | 'movements' | 'pending';

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
    const { products, allProducts, sites, addProduct, updateProduct, deleteProduct, adjustStock, activeSite, setActiveSite, addNotification, refreshData, logSystemEvent, createPutawayJob } = useData();
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
    // If Read-Only (CEO, Store, HQ): Show ALL products (Global View) to allow lookup
    // If Write Access (Warehouse): Show only the active site's products
    const filteredProducts = useMemo(() => {
        const base = isReadOnly ? allProducts : filterBySite(products, user?.role || 'pos', activeSite?.id || '');
        // Standardize: Filter out archived products from inventory calculations and views
        return (Array.isArray(base) ? base : []).filter(p => (p.status || (p as any).status) !== 'archived');
    }, [products, allProducts, isReadOnly, user?.role, activeSite]);

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

    useEffect(() => {
        if (activeTab === 'movements') {
            const fetchMovements = async () => {
                setMovementsLoading(true);
                try {
                    const offset = (currentMovementsPage - 1) * MOVEMENTS_PER_PAGE;
                    const { data, count } = await stockMovementsService.getAll(activeSite?.id, undefined, MOVEMENTS_PER_PAGE, offset);
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
    }, [activeTab, currentMovementsPage, activeSite?.id]);



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

    // Server-side Pagination for Products
    const [localProducts, setLocalProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [totalProductCount, setTotalProductCount] = useState(0);
    const [currentProductPage, setCurrentProductPage] = useState(1);
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

            const { data, count } = await productsService.getAll(querySiteId, PRODUCTS_PER_PAGE, offset, serviceFilters);
            setLocalProducts(data || []);
            setTotalProductCount(count || 0);
        } catch (error) {
            console.error('Failed to fetch products', error);
            addNotification('alert', 'Failed to load products');
        } finally {
            setProductsLoading(false);
        }
    }, [activeSite?.id, currentProductPage, filters, searchTerm, PRODUCTS_PER_PAGE, addNotification]);

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

    const canApprove = user?.role === 'super_admin';
    const canViewPending = ['super_admin', 'admin', 'warehouse_manager', 'manager'].includes(user?.role || '');
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
                                    <span className="text-white text-sm font-medium">{String(value || 'N/A')}</span>
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

                            return (
                                <div key={prop as string} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg transition-all border ${isChanged ? 'bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/5' : 'bg-white/5 border-transparent'}`}>
                                    <div className="col-span-3 text-xs font-bold text-gray-400 uppercase">{prop as string}</div>
                                    <div className="col-span-4 text-sm text-gray-500 line-through truncate">{String(oldVal ?? 'None')}</div>
                                    <div className="col-span-1 flex justify-center text-blue-400">
                                        <ArrowRight size={14} />
                                    </div>
                                    <div className={`col-span-4 text-sm font-bold truncate ${isChanged ? 'text-green-400' : 'text-gray-300'}`}>
                                        {String(newVal ?? 'None')}
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
        console.log('🔍 Inventory Pending Products Check:', {
            totalFiltered: filteredProducts.length,
            pendingCount: pending.length,
            samplePending: pending[0]
        });
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
        console.log('🟦 Inventory: Opening Add Product Modal');
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
        setIsProductModalOpen(true);
    };

    const handleOpenEditProduct = (product: Product) => {
        setEditingProduct(product);
        setSkuInput(product.sku);
        setBarcodeInput(product.barcode || '');
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

                console.log('📦 Add Product Submission:', newProduct);
                const createdProduct = await addProduct(newProduct as Product);
                console.log('✅ Created Product Result:', createdProduct);

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
            // CEO can delete directly, others need approval
            if (canApprove) {
                await deleteProduct(productToDelete);
                addNotification('success', 'Product deleted permanently.');
            } else {
                // Create persistent delete request
                const request: Omit<PendingInventoryChange, 'id'> = {
                    productId: productToDelete,
                    productName: productDetails?.name || 'Unknown',
                    productSku: productDetails?.sku || 'Unknown',
                    siteId: activeSite?.id || user?.siteId || '',
                    changeType: 'delete',
                    requestedBy: user?.name || 'Unknown',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                };
                await inventoryRequestsService.create(request);
                addNotification('info', `Delete request submitted for approval. Product: ${productDetails?.name}`);
                loadPendingRequests();
            }
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            setDeleteInput('');
        } catch (error: any) {
            console.error(error);

            // Check for foreign key constraint violation
            if (error?.code === '23503' || error?.message?.includes('foreign key constraint') || error?.message?.includes('still referenced')) {
                addNotification('alert', `Cannot delete "${productDetails?.name}" - this product has transaction history (stock movements, sales, etc.). To remove it from active inventory, set its status to "Inactive" instead.`);
            } else {
                addNotification('alert', `Failed to delete product: ${error?.message || 'Unknown error'}`);
            }
        } finally {
            setIsSubmitting(false);
            refreshData();
        }
    };

    // --- APPROVAL HANDLERS ---
    const handleApproveProduct = async (product: Product) => {
        if (!canApprove) {
            addNotification('alert', 'Only CEO can approve products.');
            return;
        }
        setIsSubmitting(true);
        try {
            const approvedProduct: Product = {
                ...product,
                approvalStatus: 'approved',
                approvedBy: user?.name || 'Unknown',
                approvedAt: new Date().toISOString(),
            };
            await updateProduct(approvedProduct);

            // Create a PUTAWAY job if product has stock (similar to PO workflow)
            if (product.stock > 0) {
                const putawayJob = await createPutawayJob(
                    approvedProduct,
                    product.stock,
                    user?.name || 'Unknown',
                    'Inventory Approval'
                );

                if (putawayJob) {
                    addNotification('success', `Product "${product.name}" approved. Putaway job created for ${product.stock} units.`);
                } else {
                    addNotification('success', `Product "${product.name}" approved successfully.`);
                }
            } else {
                addNotification('success', `Product "${product.name}" approved successfully.`);
            }

            logSystemEvent('Product Approved', `New product "${product.name}" (SKU: ${product.sku}) approved`, user?.name || 'System', 'Inventory');

            setIsApprovalModalOpen(false);
            setSelectedPendingProduct(null);
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to approve product.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectProduct = async (product: Product) => {
        if (!canApprove) {
            addNotification('alert', 'Only CEO can reject products.');
            return;
        }
        if (!rejectionReason.trim()) {
            addNotification('alert', 'Please provide a reason for rejection.');
            return;
        }
        setIsSubmitting(true);
        try {
            const rejectedProduct: Product = {
                ...product,
                approvalStatus: 'rejected',
                rejectedBy: user?.name || 'Unknown',
                rejectedAt: new Date().toISOString(),
                rejectionReason: rejectionReason,
            };
            await updateProduct(rejectedProduct);
            addNotification('success', `Product "${product.name}" rejected.`);
            logSystemEvent('Product Rejected', `New product "${product.name}" (SKU: ${product.sku}) rejected. Reason: ${rejectionReason}`, user?.name || 'System', 'Inventory');
            setIsApprovalModalOpen(false);
            setSelectedPendingProduct(null);
            setRejectionReason('');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to reject product.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveChange = async (change: PendingInventoryChange) => {
        if (!canApprove) return;
        console.log('📝 handleApproveChange START:', change);
        console.log('📝 Change ID:', change.id);
        console.log('📝 Change Type:', change.changeType);
        setIsSubmitting(true);

        let success = false;

        try {
            // 1. Apply the change to production
            if (change.changeType === 'create' && change.proposedChanges) {
                console.log('🔹 Creating new product from request...');
                const productToCreate = {
                    ...change.proposedChanges,
                    approvalStatus: 'approved' as const,
                    approvedBy: user?.name,
                    approvedAt: new Date().toISOString()
                };
                const created = await addProduct(productToCreate as Product);

                if (created && created.id) {
                    success = true;
                    // Trigger putaway for new stock if needed
                    if ((change.adjustmentQty || 0) > 0) {
                        console.log('🔹 Creating putaway job for new product...');
                        await createPutawayJob(created, change.adjustmentQty || 0, user?.name || 'System', 'Approved Creation');
                    }
                }
            }
            else if (change.changeType === 'edit' && change.proposedChanges) {
                console.log('🔹 Updating product from edit request...');
                console.log('🔹 Proposed changes:', change.proposedChanges);
                const updateResult = await updateProduct({
                    ...change.proposedChanges,
                    id: change.productId,
                    approvalStatus: 'approved' as const,
                    approvedBy: user?.name,
                    approvedAt: new Date().toISOString()
                } as Product);
                console.log('🔹 Product update result:', updateResult);
                success = !!updateResult;
            }
            else if (change.changeType === 'delete') {
                console.log('🔹 Deleting product from request...');
                await deleteProduct(change.productId);
                success = true;
            }
            else if (change.changeType === 'stock_adjustment') {
                console.log('🔹 Adjusting stock from request...');
                await adjustStock(
                    change.productId,
                    change.adjustmentQty || 0,
                    change.adjustmentType || 'IN',
                    change.adjustmentReason || 'Approved Adjustment',
                    user?.name || 'System'
                );
                success = true;
            }

            // 2. If the production change succeeded, DELETE the pending request
            //    (This is more reliable than updating status, which may fail due to RLS)
            if (success) {
                console.log('🔹 Deleting completed request from pending queue...');
                try {
                    await inventoryRequestsService.delete(change.id);
                    console.log('✅ Request deleted from pending queue');
                } catch (deleteErr) {
                    console.warn('⚠️ Failed to delete request, trying update instead:', deleteErr);
                    // Fallback: try updating status
                    await inventoryRequestsService.update(change.id, {
                        status: 'approved',
                        approvedBy: user?.name,
                        approvedAt: new Date().toISOString()
                    });
                }

                console.log('✅ Request approved successfully!');
                addNotification('success', `Request approved: ${change.productName}`);
                logSystemEvent('Inventory Request Approved', `Request for ${change.changeType} "${change.productName}" approved`, user?.name || 'System', 'Inventory');
            } else {
                throw new Error('Failed to apply change to production');
            }

            // Reload pending requests to update the UI
            await loadPendingRequests();
            await refreshData();
        } catch (error) {
            console.error('❌ Approval failed:', error);
            addNotification('alert', `Failed to approve request: ${(error as any)?.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectChange = async (change: PendingInventoryChange) => {
        if (!canApprove) return;

        const reason = rejectionReason.trim() || "Rejected by administrator";
        console.log('📝 Rejecting change:', change, 'Reason:', reason);

        setIsSubmitting(true);
        try {
            // DELETE the request instead of updating status (more reliable)
            console.log('🔹 Deleting rejected request from pending queue...');
            try {
                await inventoryRequestsService.delete(change.id);
                console.log('✅ Request deleted from pending queue');
            } catch (deleteErr) {
                console.warn('⚠️ Failed to delete request, trying update instead:', deleteErr);
                // Fallback: try updating status
                await inventoryRequestsService.update(change.id, {
                    status: 'rejected',
                    rejectedBy: user?.name,
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: reason
                });
            }

            console.log('✅ Request rejected successfully!');
            addNotification('info', `Request rejected: ${change.productName}`);
            logSystemEvent('Inventory Request Rejected', `Request for ${change.changeType} "${change.productName}" rejected. Reason: ${reason}`, user?.name || 'System', 'Inventory');

            // CRITICAL: Reset modal state and refresh data
            setIsApprovalModalOpen(false);
            setSelectedPendingChange(null);
            setRejectionReason('');

            await loadPendingRequests();
        } catch (error) {
            console.error('❌ Rejection failed:', error);
            addNotification('alert', 'Failed to reject request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkCleanupRequests = async () => {
        if (!canApprove || pendingChanges.length === 0) return;

        if (!window.confirm(`Are you sure you want to reject all ${pendingChanges.length} pending requests? This will clear all "ghost" requests.`)) {
            return;
        }

        setIsSubmitting(true);
        try {
            const cleanupPromises = pendingChanges.map(change =>
                inventoryRequestsService.update(change.id, {
                    status: 'rejected',
                    rejectedBy: user?.name,
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: 'System Cleanup: Correcting role casing mismatch ghosts'
                })
            );

            await Promise.all(cleanupPromises);
            addNotification('success', `Successfully cleared ${pendingChanges.length} requests.`);
            loadPendingRequests();
        } catch (error) {
            console.error('Cleanup failed:', error);
            addNotification('alert', 'Failed to clear all requests');
        } finally {
            setIsSubmitting(false);
        }
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
            // CEO can adjust directly, others need approval
            if (canApprove) {
                await adjustStock(editingProduct.id, qty, adjustType, adjustReason, user?.name || 'System');
                addNotification('success', `Stock adjusted for "${editingProduct.name}".`);
                logSystemEvent('Stock Adjusted', `Manually adjusted stock for "${editingProduct.name}" by ${qty} units (${adjustType})`, user?.name || 'System', 'Inventory');
            } else {
                // Create persistent stock adjustment request
                const request: Omit<PendingInventoryChange, 'id'> = {
                    productId: editingProduct.id,
                    productName: editingProduct.name,
                    productSku: editingProduct.sku,
                    siteId: activeSite?.id || user?.siteId || '',
                    changeType: 'stock_adjustment',
                    requestedBy: user?.name || 'Unknown',
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                    adjustmentType: adjustType,
                    adjustmentQty: qty,
                    adjustmentReason: adjustReason
                };
                await inventoryRequestsService.create(request);
                addNotification('info', 'Stock adjustment request submitted for approval');
                loadPendingRequests();
            }
            setIsAdjustModalOpen(false);
            setEditingProduct(null);
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to process adjustment');
        } finally {
            setIsSubmitting(false);
            refreshData();
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
                        {isReadOnly ? "Global Inventory (Read-Only)" : `Inventory Command Center: ${activeSite?.name || 'Loading...'}`}
                    </h2>
                    <p className="text-gray-400 text-sm">Real-time stock levels, batch tracking, and warehouse positions.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => {
                            console.log('🟦 Inventory: Opening Print Hub');
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
                <TabButton id="overview" label="Dashboard" icon={TrendingUp} />
                <TabButton id="stock" label="Master List" icon={Layout} />
                <TabButton id="zones" label="Zone Map" icon={Map} />
                <TabButton id="movements" label="Audit Log" icon={ClipboardList} />
                {/* Pending Approvals Tab - Visible to CEO & Managers */}
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
                        <MetricCard title="Total Asset Value" value={formatCompactNumber(totalInventoryValueCost, { currency: CURRENCY_SYMBOL })} sub="Valued at Base Cost" icon={DollarSign} trend={12} />
                        <MetricCard title="Potential Revenue" value={formatCompactNumber(totalInventoryValueRetail, { currency: CURRENCY_SYMBOL })} sub="Retail Valuation" icon={TrendingUp} />
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
                                            {abcData.map((entry: any, index: number) => (
                                                <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} stroke="none" />
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
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-cyber-primary font-bold uppercase tracking-wider">{selectedIds.size} Selected</span>
                                    <Button onClick={() => handleBulkAction('Print Labels')} size="sm" variant="secondary" className="px-3 py-1.5 bg-black/20 hover:bg-black/40 rounded text-[10px] font-bold text-white">Print Labels</Button>
                                    <Button onClick={() => setSelectedIds(new Set())} size="sm" variant="ghost" className="px-3 py-1.5 text-[10px] text-gray-400 hover:text-white">Clear</Button>
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

                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-1">
                                                Product
                                                {sortConfig?.key === 'name' && (
                                                    <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('location')}>
                                            <div className="flex items-center gap-1">
                                                Warehouse Location
                                                {sortConfig?.key === 'location' && (
                                                    <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('stock')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Stock
                                                {sortConfig?.key === 'stock' && (
                                                    <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('costPrice')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Base Cost
                                                {sortConfig?.key === 'costPrice' && (
                                                    <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('price')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Retail Price
                                                {sortConfig?.key === 'price' && (
                                                    <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('assetValue')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Asset Value
                                                {sortConfig?.key === 'assetValue' && (
                                                    <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-center cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('abc')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Class
                                                {sortConfig?.key === 'abc' && (
                                                    <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-right cursor-pointer hover:text-white transition-colors group select-none" onClick={() => handleSort('createdAt')}>
                                            <div className="flex items-center justify-end gap-1">
                                                Date
                                                {sortConfig?.key === 'createdAt' && (
                                                    <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-4 text-xs font-medium text-gray-400 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredItems.map((product) => {
                                        const abc = getABCClass(product, totalInventoryValue);
                                        const isSelected = selectedIds.has(product.id);
                                        return (
                                            <tr key={product.id} className={`hover:bg-white/5 transition-colors group ${isSelected ? 'bg-cyber-primary/5' : ''}`}>
                                                <td className="p-4"><input type="checkbox" aria-label="Select row" className="accent-cyber-primary" checked={isSelected} onChange={() => toggleSelection(product.id)} /></td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-12 h-12 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {product.image && !product.image.includes('placeholder.com') ? (
                                                                <img
                                                                    src={product.image}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Package size={20} className="text-gray-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{product.name}</p>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className="text-[10px] font-mono text-gray-500 bg-black/30 px-1.5 py-0.5 rounded">{product.sku}</span>
                                                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{product.category}</span>
                                                                {/* Approval Status Badge */}
                                                                {product.approvalStatus === 'pending' && (
                                                                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">⏳ Pending</span>
                                                                )}
                                                                {product.approvalStatus === 'rejected' && (
                                                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">❌ Rejected</span>
                                                                )}
                                                            </div>
                                                            {/* Created By Info */}
                                                            {(product.createdBy || product.created_by) && (
                                                                <p className="text-[10px] text-cyan-400/70 mt-1 flex items-center gap-1">
                                                                    <User size={10} /> Created by: {product.createdBy || product.created_by}
                                                                </p>
                                                            )}
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
                                                    <div className="text-sm font-mono text-gray-400">{formatCompactNumber(product.costPrice || product.price * 0.7, { currency: CURRENCY_SYMBOL })}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-sm font-mono text-blue-400">{formatCompactNumber(product.price, { currency: CURRENCY_SYMBOL })}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="text-sm font-mono text-white font-bold">{formatCompactNumber(product.stock * (product.costPrice || product.price * 0.7), { currency: CURRENCY_SYMBOL })}</div>
                                                    <div className="text-[10px] text-gray-500 mt-0.5">Retail: {formatCompactNumber(product.price * product.stock, { currency: CURRENCY_SYMBOL })}</div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto border-2 ${abc === 'A' ? 'border-green-500 text-green-500 bg-green-500/10' : abc === 'B' ? 'border-blue-500 text-blue-500 bg-blue-500/10' : 'border-gray-500 text-gray-500 bg-gray-500/10'}`}>{abc}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {!isReadOnly && (
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Protected permission="EDIT_PRODUCT">
                                                                <div className="flex items-center gap-2">
                                                                    <Protected permission="ADJUST_STOCK">
                                                                        <Button onClick={() => handleOpenAdjust(product)} variant="ghost" size="sm" className="p-1.5 text-gray-400 hover:text-white" title="Adjust Stock" aria-label="Adjust Stock"><RefreshCw size={14} /></Button>
                                                                    </Protected>
                                                                    <Button onClick={() => handleDeleteProduct(product.id)} variant="ghost" size="sm" className="p-1.5 text-gray-400 hover:text-red-400" title="Delete Product" aria-label="Delete Product"><Trash2 size={14} /></Button>
                                                                    <Button onClick={() => handleOpenEditProduct(product)} variant="ghost" size="sm" className="p-1.5 text-gray-400 hover:text-yellow-400" title="Edit Product" aria-label="Edit Product"><Edit size={14} /></Button>
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
                        <div className="flex justify-between items-center p-4 border-t border-white/5 bg-black/20">
                            <div className="text-xs text-gray-400">
                                Showing {localProducts.length} of {formatCompactNumber(totalProductCount)} records
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentProductPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentProductPage === 1 || productsLoading}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white transition-colors border border-white/10"
                                >
                                    Previous
                                </button>
                                <span className="flex items-center px-2 text-xs text-gray-400 font-mono">
                                    Page {currentProductPage}
                                </span>
                                <button
                                    onClick={() => setCurrentProductPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(totalProductCount / PRODUCTS_PER_PAGE))))}
                                    disabled={currentProductPage >= Math.ceil(totalProductCount / PRODUCTS_PER_PAGE) || productsLoading}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs text-white transition-colors border border-white/10"
                                >
                                    Next
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
                                        <div className={`p - 3 rounded - xl ${zone.type === 'Cold' ? 'bg-blue-500/10 text-blue-400' : zone.type === 'Secure' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyber-primary/10 text-cyber-primary'} `}>
                                            {zone.type === 'Cold' ? <Thermometer size={24} /> : zone.type === 'Secure' ? <Shield size={24} /> : <Box size={24} />}
                                        </div>
                                        <div><h3 className="font-bold text-white text-lg">{zone.name}</h3><p className="text-xs text-gray-500 uppercase tracking-wider">{zone.type} Storage</p></div>
                                    </div>
                                    <div className="text-right"><span className={`text - 2xl font - mono font - bold ${usagePercent > 90 ? 'text-red-400' : 'text-white'} `}>{usagePercent.toFixed(1)}%</span></div>
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
                <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5"><h3 className="font-bold text-white">Transactional Ledger</h3><p className="text-xs text-gray-400 mt-1">Immutable history of stock movements.</p></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="bg-black/20 border-b border-white/5"><th className="p-4 text-xs text-gray-500 uppercase">Ref ID</th><th className="p-4 text-xs text-gray-500 uppercase">Time</th><th className="p-4 text-xs text-gray-500 uppercase">Type</th><th className="p-4 text-xs text-gray-500 uppercase">Product</th><th className="p-4 text-xs text-gray-500 uppercase text-right">Qty</th><th className="p-4 text-xs text-gray-500 uppercase">User</th><th className="p-4 text-xs text-gray-500 uppercase">Reason</th></tr></thead>
                            <tbody className="divide-y divide-white/5">
                                {localMovements.map((move) => (
                                    <tr key={move.id} className="hover:bg-white/5">
                                        <td className="p-4 text-xs font-mono text-gray-400">{move.id}</td>
                                        <td className="p-4 text-xs text-white">{move.date}</td>
                                        <td className="p-4"><span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${move.type === 'IN' ? 'text-green-400 border-green-400/20 bg-green-400/5' : move.type === 'OUT' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' : 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'} `}>{move.type}</span></td>
                                        <td className="p-4 text-sm text-white">{move.productName}</td>
                                        <td className={`p-4 text-sm font-mono text-right font-bold ${move.type === 'IN' ? 'text-green-400' : 'text-white'} `}>{move.type === 'IN' ? '+' : ''}{move.quantity}</td>
                                        <td className="p-4 text-xs text-gray-300">{move.performedBy}</td>
                                        <td className="p-4 text-xs text-gray-500 italic">{move.reason}</td>
                                    </tr>
                                ))}
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
            )}

            {/* --- PENDING APPROVALS TAB (Visible to CEO & Managers) --- */}
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
                                                    {formatDateTime(change.requestedAt || (change as any).requested_at || '')}
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
                <form onSubmit={handleSaveProduct} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2" noValidate>
                    {/* Product Image Upload */}
                    <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                        <ImageUpload
                            value={productImage}
                            onChange={setProductImage}
                            onError={(error) => addNotification('alert', error)}
                            placeholder="Add product photo"
                            size="lg"
                        />
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-sm mb-2">Product Image</h4>
                            <p className="text-gray-400 text-xs leading-relaxed mb-2">
                                Upload a clear photo of the product. You can:
                            </p>
                            <ul className="text-gray-500 text-[10px] space-y-1">
                                <li>• <strong className="text-gray-400">Browse</strong> - Select from your device</li>
                                <li>• <strong className="text-gray-400">Camera</strong> - Take a photo (mobile)</li>
                                <li>• <strong className="text-gray-400">URL</strong> - Paste an image link</li>
                                <li>• <strong className="text-gray-400">Drag & Drop</strong> - Drop an image file</li>
                            </ul>
                            <p className="text-gray-500 text-[10px] mt-2">Max 10MB • Supports JPG, PNG, HEIC (iPhone), WebP & more</p>
                        </div>
                    </div>

                    {/* Row 1: Category + Item Name + Brand */}
                    <div className="grid grid-cols-12 gap-2">
                        {/* Category */}
                        <div className="col-span-3">
                            <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Category *</label>
                            <select
                                aria-label="Category"
                                className="w-full bg-black/30 border border-white/20 rounded-lg px-2 py-2 text-sm text-white"
                                value={selectedMainCategory}
                                onChange={(e) => {
                                    setSelectedMainCategory(e.target.value);
                                    setSelectedSubCategory('');
                                }}
                                required
                            >
                                <option value="">Select...</option>
                                {Object.keys(GROCERY_CATEGORIES).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Item Name */}
                        <div className="col-span-5">
                            <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Item Name *</label>
                            <input
                                className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                                placeholder="e.g., Milk, Water..."
                                value={productNameInput}
                                onChange={(e) => setProductNameInput(e.target.value)}
                                required
                            />
                        </div>

                        {/* Brand */}
                        <div className="col-span-4">
                            <label className="text-[10px] text-gray-500 uppercase mb-1 block">Brand</label>
                            <input
                                className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                                placeholder="e.g., Coca-Cola..."
                                value={productBrand}
                                onChange={(e) => setProductBrand(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 2: Unit + Size + Pack Qty + Preview Box */}
                    <div className="grid grid-cols-12 gap-2">
                        {/* Unit */}
                        <div className="col-span-3">
                            <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Unit *</label>
                            <select
                                aria-label="Unit"
                                className="w-full bg-black/30 border border-cyber-primary/50 rounded-lg px-2 py-2 text-sm text-white"
                                value={productUnit}
                                onChange={(e) => setProductUnit(e.target.value)}
                            >
                                {COMMON_UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>

                        {/* Size */}
                        <div className="col-span-2">
                            <label className="text-[10px] text-cyber-primary uppercase mb-1 block">Size</label>
                            <input
                                type="text"
                                className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 text-center"
                                placeholder="500"
                                value={productSize}
                                onChange={(e) => setProductSize(e.target.value)}
                            />
                        </div>

                        {/* Pack Qty */}
                        <div className="col-span-3">
                            <label className="text-[10px] text-yellow-400 uppercase mb-1 block">Pack Qty</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Pack of</span>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-black/30 border border-yellow-500/30 rounded-lg pl-16 pr-3 py-2 text-sm text-white text-center"
                                    placeholder="0"
                                    value={packQuantity || ''}
                                    onChange={(e) => setPackQuantity(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        {/* Live Preview Text Box */}
                        <div className="col-span-4">
                            <label className="text-[10px] text-gray-500 uppercase mb-1 block">Preview</label>
                            <div className="w-full bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg px-3 py-2 text-sm text-cyber-primary font-medium truncate">
                                {previewProductName || 'Enter details...'}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: SKU & Barcode */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Internal SKU *</label>
                            <div className="flex gap-2">
                                <input
                                    aria-label="SKU"
                                    name="sku"
                                    value={skuInput}
                                    onChange={(e) => setSkuInput(e.target.value)}
                                    placeholder="Auto-generate or enter..."
                                    required
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono"
                                />
                                <Button type="button" onClick={handleGenerateSKU} variant="ghost" className="px-3 bg-cyber-primary/20 text-cyber-primary rounded-lg hover:bg-cyber-primary/30" aria-label="Generate SKU" title="Generate SKU">
                                    <RefreshCw size={14} />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Barcode (Supplier)</label>
                            <div className="flex gap-2">
                                <input
                                    aria-label="External Barcode"
                                    name="barcode"
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    placeholder="Scan or enter..."
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono"
                                />
                                <Button type="button" onClick={handleGenerateBarcode} variant="ghost" className="px-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30" aria-label="Generate Barcode" title="Generate Internal Barcode">
                                    <Barcode size={14} />
                                </Button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">
                                {barcodeInput?.startsWith('200') ? '🏷️ Internal barcode' : 'Scan supplier barcode or generate'}
                            </p>
                        </div>
                    </div>

                    {/* Barcode Type (only if barcode entered) */}
                    {barcodeInput && (
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Barcode Type</label>
                            <select
                                aria-label="Barcode Type"
                                name="barcodeType"
                                defaultValue={editingProduct?.barcodeType || 'EAN-13'}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                            >
                                <option value="EAN-13">EAN-13</option>
                                <option value="UPC-A">UPC-A</option>
                                <option value="CODE128">CODE128</option>
                                <option value="CODE39">CODE39</option>
                                <option value="QR">QR Code</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    )}

                    {/* Row 4: Pricing + Stock */}
                    <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-2 mt-2">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Cost Price ({CURRENCY_SYMBOL})</label>
                            <input
                                aria-label="Cost Price"
                                name="costPrice"
                                type="number"
                                step="0.01"
                                value={costPriceInput}
                                onChange={(e) => setCostPriceInput(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Retail Price ({CURRENCY_SYMBOL}) *</label>
                            <input
                                aria-label="Retail Price"
                                name="price"
                                type="number"
                                step="0.01"
                                value={retailPriceInput}
                                onChange={(e) => setRetailPriceInput(e.target.value)}
                                required
                                placeholder="0.00"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Stock Qty *</label>
                            <input
                                aria-label="Stock Quantity"
                                name="stock"
                                type="number"
                                value={stockInput}
                                onChange={(e) => setStockInput(e.target.value)}
                                required
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-cyber-primary font-mono"
                            />
                        </div>
                    </div>



                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* PRODUCT PREVIEW - Shows how the product will appear */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Box size={16} className="text-cyber-primary" />
                            <h4 className="text-cyber-primary font-bold text-sm uppercase tracking-wider">Product Preview</h4>
                        </div>
                        <div className="bg-gradient-to-br from-black/40 to-black/20 rounded-xl border border-white/10 p-4">
                            <div className="flex items-start gap-4">
                                {/* Product Image Preview */}
                                <div className="w-24 h-24 rounded-xl border border-white/20 overflow-hidden flex-shrink-0 bg-black/30">
                                    {productImage ? (
                                        <img src={productImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Box size={32} className="text-gray-600" />
                                        </div>
                                    )}
                                </div>
                                {/* Product Details Preview */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-lg truncate">
                                        {previewProductName}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {(selectedSubCategory || selectedMainCategory) && (
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">
                                                {selectedSubCategory || selectedMainCategory}
                                            </span>
                                        )}
                                        {skuInput && (
                                            <span className="text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded text-gray-400">
                                                SKU: {skuInput}
                                            </span>
                                        )}
                                        {barcodeInput && (
                                            <span className="text-[10px] font-mono bg-blue-500/10 px-2 py-0.5 rounded text-blue-400">
                                                📊 {barcodeInput}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div className="bg-black/20 rounded-lg p-2">
                                            <p className="text-[10px] text-gray-500 uppercase">Retail Price</p>
                                            <p className="text-lg font-bold text-cyber-primary">
                                                {retailPriceInput ? `${CURRENCY_SYMBOL}${parseFloat(retailPriceInput).toLocaleString()}` : '—'}
                                            </p>
                                        </div>
                                        <div className="bg-black/20 rounded-lg p-2">
                                            <p className="text-[10px] text-gray-500 uppercase">Cost Price</p>
                                            <p className="text-lg font-bold text-gray-300">
                                                {costPriceInput ? `${CURRENCY_SYMBOL}${parseFloat(costPriceInput).toLocaleString()}` : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Package size={12} className="text-gray-500" />
                                            <span className="text-gray-400">Stock:</span>
                                            <span className={`font-bold ${parseInt(stockInput) > 10 ? 'text-green-400' : parseInt(stockInput) > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                                {stockInput || '0'} units
                                            </span>
                                        </div>
                                        {locationInput && (
                                            <div className="flex items-center gap-1">
                                                <Map size={12} className="text-gray-500" />
                                                <span className="text-gray-400">Location:</span>
                                                <span className="font-mono text-white">{locationInput}</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Profit Margin Preview */}
                                    {retailPriceInput && costPriceInput && parseFloat(costPriceInput) > 0 && (
                                        <div className="mt-3 p-2 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg border border-green-500/20">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-green-400 uppercase font-bold">Profit Margin</span>
                                                <span className="text-green-400 font-bold">
                                                    {(((parseFloat(retailPriceInput) - parseFloat(costPriceInput)) / parseFloat(retailPriceInput)) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                Profit per unit: {CURRENCY_SYMBOL}{(parseFloat(retailPriceInput) - parseFloat(costPriceInput)).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6 mt-6 border-t border-white/10">
                        <Button
                            type="button"
                            onClick={() => setIsProductModalOpen(false)}
                            disabled={isSubmitting}
                            variant="secondary"
                            className="flex-1 py-3 text-white font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            icon={<CheckCircle size={18} />}
                            className="flex-1 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            {editingProduct ? 'Save Changes' : 'Create Product'}
                        </Button>
                    </div>
                </form>
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
                            disabled={isSubmitting}
                            loading={isSubmitting}
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
