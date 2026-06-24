import React, { useState, useEffect } from 'react';
import { Truck, RefreshCw, X, Activity, ShieldCheck, Rocket, Trash2, ArrowRight, Warehouse, ShoppingBag, Plus, Minus, AlertTriangle } from 'lucide-react';
import { WMSJob, Product, Site, User } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatCompactNumber } from '../../../utils/formatting';
import { ProgressBar } from '../../shared/ProgressBar';
import { getSellUnit } from '../../../utils/units';
import { useData } from '../../../contexts/DataContext';
import { logisticsZonesService } from '../../../services/supabase.service';

interface SmartReplenishModalProps {
    isOpen: boolean;
    onClose: () => void;
    sites: Site[];
    products: Product[];
    allProducts: Product[];
    user: User | null;
    wmsJobsService: any;
    productsService: any;
    addNotification: (type: any, message: string) => void;
    refreshData: () => Promise<void>;
    renderTabs: () => React.ReactNode;
}

export const SmartReplenishModal: React.FC<SmartReplenishModalProps> = ({
    isOpen,
    onClose,
    sites,
    products,
    allProducts,
    user,
    wmsJobsService,
    productsService,
    addNotification,
    refreshData,
    renderTabs
}) => {
    const { settings } = useData();
    const [logisticsZones, setLogisticsZones] = useState<any[]>([]);
    const isRestricted = !['super_admin', 'admin'].includes(user?.role || '') && !!user?.siteId;
    const userSiteObj = sites.find(s => s.id === user?.siteId);
    const userZoneId = userSiteObj?.logisticsZoneId || '';

    // --- STATE ---
    const [distHubLoading, setDistHubLoading] = useState(false);
    const [distHubLowStockItems, setDistHubLowStockItems] = useState<any[]>([]);
    const [distHubSelectedSku, setDistHubSelectedSku] = useState('');
    const [distHubSelectedDestSite, setDistHubSelectedDestSite] = useState('');
    const [distHubAvailableSources, setDistHubAvailableSources] = useState<any[]>([]);
    const [dbDraftJobs, setDbDraftJobs] = useState<WMSJob[]>([]);
    const [distHubSectorIntegrity, setDistHubSectorIntegrity] = useState(100);
    const [distHubTimer, setDistHubTimer] = useState(0);
    const [distHubAllocQty, setDistHubAllocQty] = useState<Record<string, number>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICAL' | 'LOW'>('ALL');
    const [filterStoreId, setFilterStoreId] = useState<string>('ALL');

    // --- EFFECTS ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen) {
            setDistHubTimer(0);
            interval = setInterval(() => setDistHubTimer(prev => prev + 1), 1000);
            fetchDistHubData();

            // Fetch logistics zones
            const fetchZones = async () => {
                try {
                    const zones = await logisticsZonesService.getAll();
                    setLogisticsZones(zones);
                } catch (err) {
                    console.error('Failed to fetch logistics zones:', err);
                }
            };
            fetchZones();
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    const formatMissionTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getZoneName = (zoneId?: string) => {
        if (!zoneId) return 'Unassigned / Free Zone';
        const zone = logisticsZones.find(z => z.id === zoneId);
        return zone ? zone.name : 'Loading...';
    };

    const fetchDistHubData = async () => {
        setDistHubLoading(true);
        try {
            // 1. Analyze entire network stock
            const result = await productsService.getAll(); // Fetch ALL products across ALL sites
            const allSiteProducts = result.data || [];
            const lowStock: any[] = [];
            let totalItems = 0;
            let healthyItems = 0;

            allSiteProducts.forEach((p: any) => {
                const productSite = sites.find(s => s.id === (p.siteId || p.site_id));
                if (productSite?.type !== 'Store') {
                    return; // Skip warehouses/distribution centers
                }

                // If zoning is enforced and user is restricted, only show stores in the same zone as the user's site
                if (settings?.enforceRegionalZoning && isRestricted && userSiteObj) {
                    if ((productSite.logisticsZoneId || '') !== userZoneId) {
                        return; // Skip stores from other zones
                    }
                }

                totalItems++;
                if (p.minStock > 0 && p.stock < p.minStock) {
                    lowStock.push(p);
                } else {
                    healthyItems++;
                }
            });

            setDistHubLowStockItems(lowStock);
            setDistHubSectorIntegrity(totalItems > 0 ? (healthyItems / totalItems) * 100 : 100);

            // 2. Fetch staged draft WMS jobs from database
            const allJobs = await wmsJobsService.getAll(undefined, 1000);
            const drafts = allJobs.filter((j: WMSJob) => j.type === 'TRANSFER' && j.transferStatus === 'Draft' && j.status === 'Pending');
            setDbDraftJobs(drafts);
        } catch (err) {
            console.error('Dist Hub Analysis Failed', err);
            addNotification('alert', 'Network analysis failed');
        } finally {
            setDistHubLoading(false);
        }
    };

    const handleSelectLowStockProduct = (targetProduct: any) => {
        setDistHubSelectedSku(targetProduct.sku);
        const destId = targetProduct.siteId || targetProduct.site_id;
        setDistHubSelectedDestSite(destId);

        const targetStore = sites.find(s => s.id === destId);

        // Find sources with stock > 0 of this SKU
        let potentialSources = allProducts.filter(p => {
            if (p.sku !== targetProduct.sku) return false;
            if (p.stock <= 0) return false;
            if ((p.siteId || p.site_id) === destId) return false;

            const sourceSiteObj = sites.find(s => s.id === (p.siteId || p.site_id));
            const isWarehouseType = sourceSiteObj && (
                sourceSiteObj.type === 'Warehouse' || 
                sourceSiteObj.type === 'Distribution Center' || 
                sourceSiteObj.type === 'Storage & Fulfillment' || 
                sourceSiteObj.type === 'Regional Hub'
            );
            if (!isWarehouseType) return false;

            // Under regional zoning, we route by zone.
            // Regular managers can only target warehouses in the same zone.
            // CEOs can target any warehouse (with override warnings).
            if (settings?.enforceRegionalZoning) {
                if (user?.role !== 'super_admin' && targetStore && sourceSiteObj) {
                    return (sourceSiteObj.logisticsZoneId || '') === (targetStore.logisticsZoneId || '');
                }
            }

            return true;
        });

        const mappedSources = potentialSources.map(p => ({
            ...p,
            site: sites.find(s => s.id === (p.siteId || p.site_id))
        }));

        setDistHubAvailableSources(mappedSources);

        // Calculate actual store need gap to bring it to 70% capacity (converting stock to raw measure)
        const maxStock = targetProduct.maxStock || 0;
        const minStock = targetProduct.minStock || 0;
        
        // Find if this SKU has a valid size/unit on any other product (e.g. at the warehouse)
        const skuSize = targetProduct.size || allProducts.find(p => p.sku === targetProduct.sku && p.size && parseFloat(p.size) > 0)?.size;
        const skuUnit = targetProduct.unit || allProducts.find(p => p.sku === targetProduct.sku && p.unit)?.unit;

        const unitDef = getSellUnit(skuUnit || '');
        const sizeNum = parseFloat(skuSize || '0');
        const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;

        // In the database, if a product has a size, stock represents package cases.
        // If the product size is null/falsy, stock represents the raw physical unit (Liters or Kgs).
        const currentStockLiters = isWeightVol && targetProduct.size && parseFloat(targetProduct.size) > 0
            ? targetProduct.stock * parseFloat(targetProduct.size)
            : targetProduct.stock;

        const targetStockLiters = maxStock > 0 ? maxStock * 0.7 : minStock * 2;
        const gapLiters = Math.max(0, targetStockLiters - currentStockLiters);
        const gapCases = isWeightVol ? gapLiters / sizeNum : gapLiters;

        // Initialize allocation quantities based on the store need gap (in cases/packages)
        const initialQty: Record<string, number> = {};
        mappedSources.forEach(src => {
            initialQty[src.id] = Math.round(Math.max(1, Math.min(src.stock, gapCases)) * 100) / 100;
        });
        setDistHubAllocQty(initialQty);
    };

    const incrementQty = (sourceId: string, maxStock: number) => {
        setDistHubAllocQty(prev => {
            const current = prev[sourceId] || 1;
            if (current < maxStock) {
                return { ...prev, [sourceId]: current + 1 };
            }
            return prev;
        });
    };

    const decrementQty = (sourceId: string) => {
        setDistHubAllocQty(prev => {
            const current = prev[sourceId] || 1;
            if (current > 1) {
                return { ...prev, [sourceId]: current - 1 };
            }
            return prev;
        });
    };

    const handleQtyChange = (sourceId: string, value: number, maxStock: number) => {
        const parsed = isNaN(value) ? 1 : value;
        if (parsed < 1) {
            setDistHubAllocQty(prev => ({ ...prev, [sourceId]: 1 }));
        } else if (parsed > maxStock) {
            setDistHubAllocQty(prev => ({ ...prev, [sourceId]: maxStock }));
        } else {
            setDistHubAllocQty(prev => ({ ...prev, [sourceId]: parsed }));
        }
    };

    const addToDistDraft = async (sourceProd: any, qty: number) => {
        setDistHubLoading(true);
        try {
            const destSiteId = distHubSelectedDestSite;
            const sourceSiteId = sourceProd.siteId || sourceProd.site_id;

            const unitDef = getSellUnit(sourceProd.unit || '');
            const sizeNum = parseFloat(sourceProd.size || '0');
            const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;

            const finalExpectedQty = qty;
            const requestedMeasureQty = isWeightVol ? qty * sizeNum : undefined;

            // Search for existing draft manifest for this source/destination pair
            const existing = dbDraftJobs.find(j => j.sourceSiteId === sourceSiteId && j.destSiteId === destSiteId);

            if (existing) {
                // Check if product is already in the line items
                const lineItems = [...(existing.lineItems || [])];
                const existingItemIdx = lineItems.findIndex(i => i.productId === sourceProd.id || i.sku === sourceProd.sku);

                if (existingItemIdx > -1) {
                    lineItems[existingItemIdx].expectedQty = finalExpectedQty;
                    if (isWeightVol) {
                        (lineItems[existingItemIdx] as any).requestedMeasureQty = requestedMeasureQty;
                    }
                } else {
                    lineItems.push({
                        productId: sourceProd.id,
                        sku: sourceProd.sku,
                        name: sourceProd.name,
                        expectedQty: finalExpectedQty,
                        requestedMeasureQty,
                        pickedQty: 0,
                        status: 'Pending'
                    } as any);
                }

                await wmsJobsService.update(existing.id, {
                    lineItems,
                    items: lineItems.length
                });
            } else {
                // Create a new draft manifest
                const orderRef = `AUTO-REPL-${sourceProd.sku}-${Date.now().toString().slice(-4)}`;
                const newDraft = {
                    siteId: sourceSiteId,
                    type: 'TRANSFER' as const,
                    priority: 'Normal' as const,
                    status: 'Pending' as const,
                    transferStatus: 'Draft' as const,
                    orderRef,
                    items: 1,
                    lineItems: [{
                        productId: sourceProd.id,
                        sku: sourceProd.sku,
                        name: sourceProd.name,
                        expectedQty: finalExpectedQty,
                        requestedMeasureQty,
                        pickedQty: 0,
                        status: 'Pending' as const
                    }],
                    sourceSiteId,
                    destSiteId,
                    location: 'Staging'
                };
                await wmsJobsService.create(newDraft as any);
            }

            addNotification('success', 'Manifest draft updated');
            await fetchDistHubData();
        } catch (err) {
            console.error('Failed to add to draft:', err);
            addNotification('alert', 'Failed to update manifest draft');
        } finally {
            setDistHubLoading(false);
        }
    };

    const removeDraftItem = async (jobId: string, itemIndex: number) => {
        setDistHubLoading(true);
        try {
            const job = dbDraftJobs.find(j => j.id === jobId);
            if (!job) return;

            const lineItems = (job.lineItems || []).filter((_: any, idx: number) => idx !== itemIndex);
            if (lineItems.length === 0) {
                // Delete the whole draft job if no items are left
                await wmsJobsService.delete(jobId);
                addNotification('success', 'Draft manifest deleted');
            } else {
                await wmsJobsService.update(jobId, {
                    lineItems,
                    items: lineItems.length
                });
                addNotification('success', 'Item removed from draft');
            }
            await fetchDistHubData();
        } catch (err) {
            console.error('Failed to remove item from draft:', err);
            addNotification('alert', 'Failed to remove item from draft');
        } finally {
            setDistHubLoading(false);
        }
    };

    const updateDraftItemQty = async (jobId: string, itemIndex: number, newQty: number) => {
        if (newQty <= 0) {
            await removeDraftItem(jobId, itemIndex);
            return;
        }

        setDistHubLoading(true);
        try {
            const job = dbDraftJobs.find(j => j.id === jobId);
            if (!job) return;

            const lineItems = [...(job.lineItems || [])];
            const item = lineItems[itemIndex];
            if (item) {
                const product = allProducts.find(p => p.id === item.productId || p.sku === item.sku);
                const resolvedSize = product?.size || allProducts.find(p => p.sku === item.sku && p.size && parseFloat(p.size) > 0)?.size;
                const unitDef = getSellUnit(item.unit || product?.unit || '');
                const sizeNum = parseFloat(resolvedSize || '0');
                const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;

                item.expectedQty = newQty;
                if (isWeightVol) {
                    (item as any).requestedMeasureQty = newQty * sizeNum;
                }
            }

            await wmsJobsService.update(jobId, { lineItems });
            addNotification('success', 'Quantity updated');
            await fetchDistHubData();
        } catch (err) {
            console.error('Failed to update draft item quantity:', err);
            addNotification('alert', 'Failed to update quantity');
        } finally {
            setDistHubLoading(false);
        }
    };

    const submitDistTransfers = async () => {
        if (settings?.enforceRegionalZoning && user?.role !== 'super_admin') {
            const hasCrossZoneDraft = dbDraftJobs.some(draft => {
                const sourceSiteObj = sites.find(s => s.id === draft.sourceSiteId);
                const destSiteObj = sites.find(s => s.id === draft.destSiteId);
                return sourceSiteObj && destSiteObj && (sourceSiteObj.logisticsZoneId || '') !== (destSiteObj.logisticsZoneId || '');
            });
            if (hasCrossZoneDraft) {
                addNotification('alert', 'Cross-zone replenishment is restricted. Manifests can only be deployed between locations in the same Logistics Zone.');
                return;
            }
        }

        setDistHubLoading(true);
        try {
            let successCount = 0;
            for (const draft of dbDraftJobs) {
                // 1. Update the TRANSFER job's status to 'Approved'
                await wmsJobsService.update(draft.id, {
                    transferStatus: 'Approved'
                });

                // 2. Create the matching PICK job in the source site (warehouse)
                const pickJob: any = {
                    site_id: draft.sourceSiteId,
                    siteId: draft.sourceSiteId,
                    type: 'PICK',
                    sourceSiteId: draft.sourceSiteId,
                    destSiteId: draft.destSiteId,
                    priority: 'Normal',
                    status: 'Pending',
                    orderRef: draft.id,
                    items: draft.lineItems.length,
                    lineItems: draft.lineItems.map(item => ({
                        productId: item.productId,
                        sku: item.sku,
                        name: item.name,
                        expectedQty: item.expectedQty,
                        pickedQty: 0,
                        status: 'Pending',
                        requestedMeasureQty: (item as any).requestedMeasureQty
                    })),
                    jobNumber: draft.jobNumber
                };

                await wmsJobsService.create(pickJob);
                successCount++;
            }

            addNotification('success', `Successfully authorized ${successCount} staged manifests`);
            onClose();
            refreshData();
        } catch (err) {
            console.error('Failed to submit transfers:', err);
            addNotification('alert', 'Error authorizing replenishment deployments');
        } finally {
            setDistHubLoading(false);
        }
    };

    const ScanningAnimation = () => (
        <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-cyber-primary/30 rounded-lg animate-ping" />
            <div className="absolute inset-0 border-2 border-cyber-primary rounded-lg animate-pulse" />
            <RefreshCw className="text-cyber-primary relative z-10" size={24} />
        </div>
    );

    const filteredItems = distHubLowStockItems.filter(item => {
        const siteName = sites.find(s => s.id === (item.siteId || item.site_id))?.name || '';
        const matchQuery =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            siteName.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchQuery) return false;

        const stockRatio = item.stock / (item.minStock || 1);
        const isCritical = stockRatio <= 0.3;
        if (filterStatus === 'CRITICAL' && !isCritical) return false;
        if (filterStatus === 'LOW' && isCritical) return false;

        const storeId = item.siteId || item.site_id;
        if (filterStoreId !== 'ALL' && storeId !== filterStoreId) return false;

        return true;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full h-full md:p-8 flex flex-col">
                <div className="flex-1 bg-cyber-gray md:rounded-3xl border border-amber-500/20 shadow-[0_0_100px_rgba(245,158,11,0.1)] flex flex-col overflow-hidden relative">
                    {/* Compact Mission Control Header */}
                    <div className="py-3 px-6 border-b border-amber-500/20 bg-gradient-to-r from-amber-900/10 to-transparent flex flex-row items-center justify-between gap-4 relative z-10 glass-pattern">
                        <div className="flex items-center gap-3">
                            <Activity className="text-amber-500 animate-pulse shrink-0" size={20} />
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">
                                    DISTRIBUTION <span className="text-amber-500">HUB</span>
                                </h2>
                                <span className="text-amber-500/50 font-mono text-[9px] tracking-wider uppercase hidden sm:inline">Tactical Supply Deployment</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 px-4 py-1 bg-black/40 rounded-full border border-amber-500/10 shrink-0">
                                {renderTabs()} {/* Navigation tabs */}
                            </div>

                            {/* System Status info (merged and compact) */}
                            <div className="hidden lg:flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-full border border-amber-500/10 text-[10px] font-mono shrink-0">
                                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    ONLINE
                                </span>
                                <span className="text-white/20">|</span>
                                <span className="text-gray-400">
                                    SECTOR INTEGRITY: <span className="text-amber-400 font-bold">{distHubSectorIntegrity.toFixed(1)}%</span>
                                </span>
                                <span className="text-white/20">|</span>
                                <span className="text-gray-400">
                                    TIMER: <span className="text-white font-bold">{formatMissionTime(distHubTimer)}</span>
                                </span>
                            </div>

                            <button
                                onClick={onClose}
                                aria-label="Close modal"
                                title="Close modal"
                                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 flex items-center justify-center transition-all group shrink-0"
                            >
                                <X className="text-gray-400 group-hover:text-red-500 transition-colors" size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Tactical Grid */}
                    <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(245,158,11,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />

                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
                        {/* Left Panel: Store Needs High-Density Dashboard (60% to 65% width) */}
                        <div className="lg:w-[60%] xl:w-[65%] bg-black/20 border-r border-white/5 flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex flex-col gap-4 backdrop-blur-sm bg-black/10">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse" />
                                        <div>
                                            <h3 className="text-base font-bold text-white uppercase tracking-wider">Critical Store Needs</h3>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Select target to configure replenishment deployment</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                        <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black border border-amber-500/20 shadow-inner">
                                            {distHubLowStockItems.length} DETECTED
                                        </div>
                                        <button
                                            onClick={fetchDistHubData}
                                            disabled={distHubLoading}
                                            className="p-2.5 hover:bg-white/10 rounded-xl text-gray-400 transition-all hover:text-white group active:scale-95 border border-transparent hover:border-white/10"
                                            title="Rescan Network Gaps"
                                        >
                                            <RefreshCw size={14} className={`${distHubLoading ? 'animate-spin text-amber-500' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Filters and Search bar for managing high volumes (20-30+ items) */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Search needs by product name, SKU, or store..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/40 transition-all font-mono"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                title="Clear search"
                                                aria-label="Clear search"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <select
                                            value={filterStoreId}
                                            onChange={(e) => setFilterStoreId(e.target.value)}
                                            title="Filter by destination store"
                                            aria-label="Filter by destination store"
                                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/40 transition-all font-sans"
                                        >
                                            <option value="ALL">All Stores</option>
                                            {Array.from(new Set(distHubLowStockItems.map(item => item.siteId || item.site_id))).map(storeId => {
                                                const name = sites.find(s => s.id === storeId)?.name || 'Store';
                                                return <option key={storeId} value={storeId}>{name}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                {/* Severity Filters */}
                                <div className="flex items-center gap-1.5 bg-black/30 border border-white/5 rounded-lg p-0.5 self-start">
                                    <button
                                        onClick={() => setFilterStatus('ALL')}
                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                                            filterStatus === 'ALL'
                                                ? 'bg-white/10 text-white shadow-inner'
                                                : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                    >
                                        All ({distHubLowStockItems.length})
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('CRITICAL')}
                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                                            filterStatus === 'CRITICAL'
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                                                : 'text-gray-500 hover:text-red-400'
                                        }`}
                                    >
                                        Critical ({distHubLowStockItems.filter(item => (item.stock / (item.minStock || 1)) <= 0.3).length})
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('LOW')}
                                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                                            filterStatus === 'LOW'
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                                                : 'text-gray-500 hover:text-amber-400'
                                        }`}
                                    >
                                        Low Stock ({distHubLowStockItems.filter(item => (item.stock / (item.minStock || 1)) > 0.3).length})
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                                {filteredItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                        <p className="text-xs uppercase font-black tracking-widest text-gray-500">No matching needs found</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5 border border-white/5 rounded-2xl bg-black/10 overflow-hidden pb-12">
                                        {filteredItems.map(item => {
                                            const isSelected = distHubSelectedSku === item.sku && distHubSelectedDestSite === (item.siteId || item.site_id);
                                            const stockRatio = item.stock / (item.minStock || 1);
                                            const isCritical = stockRatio <= 0.3;
                                            const siteName = sites.find(s => s.id === (item.siteId || item.site_id))?.name || 'Local Store';

                                            return (
                                                <button
                                                    key={`${item.id}-${item.sku}`}
                                                    onClick={() => handleSelectLowStockProduct(item)}
                                                    title={`Select ${item.name} for distribution`}
                                                    className={`w-full text-left py-3 px-4 flex items-center justify-between transition-all duration-150 relative ${
                                                        isSelected
                                                            ? 'bg-amber-500/10 border-l-2 border-l-amber-500 shadow-[inset_4px_0_0_0_rgba(245,158,11,1)]'
                                                            : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                                                    }`}
                                                >
                                                    {/* Column 1: Info (Name, SKU, Store) */}
                                                    <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full shrink-0 ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                                        
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="text-[9px] font-mono font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded tracking-wider">{item.sku}</span>
                                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider truncate max-w-[150px]">{siteName}</span>
                                                            </div>
                                                            <div className="text-xs font-bold text-white uppercase tracking-tight truncate leading-tight">{item.name}</div>
                                                        </div>
                                                    </div>

                                                    {/* Column 2: Status Tag */}
                                                    <div className="shrink-0 mr-6 hidden sm:block">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${isCritical ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                            {isCritical ? 'CRITICAL' : 'LOW STOCK'}
                                                        </span>
                                                    </div>

                                                    {/* Column 3: Stock Levels & Progress Bar */}
                                                    <div className="flex items-center gap-4 shrink-0">
                                                        <div className="text-right shrink-0">
                                                            <div className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">Stock</div>
                                                            <div className="text-xs font-mono font-bold text-white">
                                                                <span className={isCritical ? 'text-red-400 font-extrabold' : 'text-amber-400'}>{item.stock}</span>
                                                                <span className="text-white/30 mx-0.5">/</span>
                                                                <span className="text-white/60">{item.minStock}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-16 h-1 rounded-full bg-black/50 overflow-hidden border border-white/5 hidden md:block">
                                                            <ProgressBar
                                                                progress={(item.stock / (item.minStock || 1)) * 100}
                                                                containerClassName="h-full w-full bg-transparent"
                                                                fillClassName={`h-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Deployment Control Panel (35% to 40% width) */}
                        <div className="lg:w-[40%] xl:w-[35%] bg-black/30 flex flex-col h-full overflow-hidden border-l border-white/5">
                            {/* Top Section: Available Sources (Payload Allocation) */}
                            <div className="flex-1 flex flex-col overflow-hidden border-b border-white/5">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-sm bg-black/15 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                                        <div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Stock Allocation</h3>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Select Source to Fulfill Store Gap</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {!distHubSelectedSku ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-45">
                                            <ScanningAnimation />
                                            <p className="mt-4 text-[10px] uppercase font-black tracking-widest text-amber-500 animate-pulse">Awaiting Target Selection</p>
                                            <p className="text-[9px] text-gray-500 mt-1 max-w-[200px]">Click a critical store need on the left to allocate inventory</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Header product info */}
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 mb-3 flex flex-col gap-1 shrink-0">
                                                <div className="text-[9px] text-amber-500 font-mono tracking-wider uppercase font-bold">Selected Item:</div>
                                                <div className="text-xs font-black text-white truncate uppercase">{distHubLowStockItems.find(p => p.sku === distHubSelectedSku)?.name || 'Target Product'}</div>
                                                <div className="flex justify-between items-center mt-1 text-[9px]">
                                                    <span className="text-gray-400 font-mono">SKU: {distHubSelectedSku}</span>
                                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                                                        To: {sites.find(s => s.id === distHubSelectedDestSite)?.name || 'Store'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {distHubAvailableSources.length === 0 ? (
                                                <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center">
                                                    <p className="text-xs text-red-400 font-bold uppercase tracking-widest">No Sources Available</p>
                                                    <p className="text-[9px] text-gray-500 mt-1">No warehouses in the network (or same Logistics Zone if zoning is enforced) have stock of this SKU.</p>
                                                </div>
                                            ) : (
                                                distHubAvailableSources.map(source => {
                                                    const isWarehouse = source.site?.type === 'Warehouse';
                                                    const allocQty = distHubAllocQty[source.id] || Math.min(10, source.stock);
                                                    const targetStoreObj = sites.find(s => s.id === distHubSelectedDestSite);
                                                    const isCrossZone = targetStoreObj && source.site && (targetStoreObj.logisticsZoneId || '') !== (source.site.logisticsZoneId || '');
                                                    return (
                                                        <div key={source.id} className="p-4 bg-white/[0.02] border border-white/5 hover:border-[#2C5E3B]/40 rounded-xl group transition-all duration-300">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="min-w-0 flex-1 pr-2">
                                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                        {isWarehouse ? <Warehouse size={12} className="text-[#A9CBA2]" /> : <ShoppingBag size={12} className="text-amber-400" />}
                                                                        <span className="text-xs font-bold text-white truncate uppercase tracking-wide">{source.site?.name}</span>
                                                                        {isCrossZone && settings?.enforceRegionalZoning && (
                                                                            <span className="text-[8px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase shrink-0">
                                                                                ⚠️ CROSS-ZONE OVERRIDE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">{source.site?.type}</div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <span className="text-[9px] text-gray-500 uppercase font-bold block tracking-widest">Available</span>
                                                                    <span className="text-base font-mono font-bold text-[#A9CBA2]">{source.stock}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Inline Quantity Input with Controls */}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => decrementQty(source.id)}
                                                                        className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                                                                        title="Decrease quantity"
                                                                    >
                                                                        <Minus size={12} />
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max={source.stock}
                                                                        value={allocQty}
                                                                        aria-label="Allocate quantity"
                                                                        onChange={(e) => handleQtyChange(source.id, parseInt(e.target.value), source.stock)}
                                                                        className="w-10 bg-transparent border-0 text-center text-xs font-mono text-white focus:ring-0 focus:outline-none p-0"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => incrementQty(source.id, source.stock)}
                                                                        className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                                                                        title="Increase quantity"
                                                                    >
                                                                        <Plus size={12} />
                                                                    </button>
                                                                </div>
                                                                
                                                                <button
                                                                    onClick={() => addToDistDraft(source, allocQty)}
                                                                    className="flex-1 py-1.5 bg-[#2C5E3B]/10 hover:bg-[#2C5E3B] text-[#A9CBA2] hover:text-white border border-[#2C5E3B]/20 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(44,94,59,0.05)] hover:shadow-[0_0_15px_rgba(44,94,59,0.3)]"
                                                                >
                                                                    <Plus size={12} /> STAGE LOAD
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Bottom Section: Mission Launchpad (Staged Manifests) */}
                            <div className="h-[48%] flex flex-col bg-black/25 overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-sm bg-black/15 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
                                        <div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Launch Pad</h3>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Mission Queue</p>
                                        </div>
                                    </div>
                                    {dbDraftJobs.length > 0 && (
                                        <div className="px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20 text-[9px] font-mono text-blue-400 font-bold shrink-0">
                                            {dbDraftJobs.length} MANIFESTS
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {dbDraftJobs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-6">
                                            <Rocket size={28} className="text-gray-500 mb-2.5" />
                                            <p className="text-[10px] uppercase font-black tracking-widest mb-1 text-gray-400">No Staged Manifests</p>
                                            <p className="text-[9px] text-gray-500 max-w-[200px]">Draft replenishment manifests will automatically stage here once items are added to loads.</p>
                                        </div>
                                    ) : (
                                        dbDraftJobs.map((draft) => {
                                            const sourceName = sites.find(s => s.id === draft.sourceSiteId)?.name || 'Source Warehouse';
                                            const destName = sites.find(s => s.id === draft.destSiteId)?.name || 'Dest Store';

                                            const sourceSiteObj = sites.find(s => s.id === draft.sourceSiteId);
                                            const destSiteObj = sites.find(s => s.id === draft.destSiteId);
                                            const isDraftCrossZone = sourceSiteObj && destSiteObj && (sourceSiteObj.logisticsZoneId || '') !== (destSiteObj.logisticsZoneId || '');

                                            return (
                                                <div key={draft.id} className={`p-4 bg-blue-500/[0.02] border rounded-xl relative overflow-hidden group ${
                                                    isDraftCrossZone && settings?.enforceRegionalZoning 
                                                        ? 'border-yellow-500/30 bg-yellow-500/[0.01]' 
                                                        : 'border-blue-500/15'
                                                }`}>
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                        isDraftCrossZone && settings?.enforceRegionalZoning ? 'bg-yellow-500' : 'bg-blue-500'
                                                    }`} />

                                                    {isDraftCrossZone && settings?.enforceRegionalZoning && (
                                                        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] p-2.5 rounded-lg mb-3 flex items-start gap-1.5 animate-pulse">
                                                            <AlertTriangle className="shrink-0 text-yellow-400 mt-0.5" size={12} />
                                                            <span>
                                                                Cross-Zone Override: {getZoneName(sourceSiteObj?.logisticsZoneId)} ➔ {getZoneName(destSiteObj?.logisticsZoneId)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Manifest Header */}
                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-2 pl-1 border-b border-white/5 pb-2">
                                                        <span className="text-blue-400 font-mono">{draft.jobNumber || 'TR-DRAFT'}</span>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('Delete this entire draft replenishment manifest?')) {
                                                                    setDistHubLoading(true);
                                                                    try {
                                                                        await wmsJobsService.delete(draft.id);
                                                                        addNotification('success', 'Draft manifest deleted');
                                                                        await fetchDistHubData();
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                    } finally {
                                                                        setDistHubLoading(false);
                                                                    }
                                                                }
                                                            }}
                                                            className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-colors"
                                                            title="Delete Manifest"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>

                                                    {/* Route */}
                                                    <div className="flex items-center justify-between text-[9px] pl-1 mb-3 font-bold">
                                                        <span className="text-gray-400 truncate max-w-[120px]" title={sourceName}>{sourceName}</span>
                                                        <ArrowRight size={10} className="text-blue-500 shrink-0 mx-2" />
                                                        <span className="text-white truncate max-w-[120px]" title={destName}>{destName}</span>
                                                    </div>

                                                    {/* Items List */}
                                                    <div className="space-y-1.5 pl-1">
                                                        {(draft.lineItems || []).map((item, idx) => {
                                                            const product = allProducts.find(p => p.id === item.productId || p.sku === item.sku);
                                                            const resolvedSize = product?.size || allProducts.find(p => p.sku === item.sku && p.size && parseFloat(p.size) > 0)?.size;
                                                            const unitDef = getSellUnit(item.unit || product?.unit || '');
                                                            const sizeNum = parseFloat(resolvedSize || '0');
                                                            const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0;
                                                            const physicalMeasure = isWeightVol
                                                                ? ((item as any).requestedMeasureQty !== undefined ? (item as any).requestedMeasureQty : (item.expectedQty * sizeNum))
                                                                : null;

                                                            return (
                                                                <div key={`${item.productId}-${idx}`} className="flex items-center justify-between text-xs bg-black/40 p-2 rounded-lg border border-white/5">
                                                                    <div className="flex-1 min-w-0 pr-2">
                                                                        <p className="text-white font-bold truncate leading-tight uppercase text-[9px]">{item.name}</p>
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <span className="text-gray-500 font-mono text-[8px]">{item.sku}</span>
                                                                            {physicalMeasure !== null && (
                                                                                <span className="text-[8.5px] font-black text-amber-400 font-mono">
                                                                                    ({physicalMeasure} {unitDef.shortLabel})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <input
                                                                            type="number"
                                                                            min={isWeightVol ? "0.01" : "1"}
                                                                            step={isWeightVol ? "0.01" : "1"}
                                                                            className="w-14 bg-black/50 border border-white/10 rounded px-1 py-0.5 text-center text-white text-[10px] font-mono focus:ring-0 focus:outline-none"
                                                                            value={item.expectedQty}
                                                                            aria-label="Replenish quantity"
                                                                            title="Replenish quantity"
                                                                            onChange={(e) => {
                                                                                const val = parseFloat(e.target.value);
                                                                                if (!isNaN(val) && val > 0) {
                                                                                    updateDraftItemQty(draft.id, idx, val);
                                                                                }
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => removeDraftItem(draft.id, idx)}
                                                                            className="text-gray-500 hover:text-red-400 p-0.5 rounded transition-colors"
                                                                            title="Remove Item"
                                                                        >
                                                                            <X size={11} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                
                                <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md shrink-0">
                                    <button
                                        onClick={submitDistTransfers}
                                        disabled={dbDraftJobs.length === 0 || distHubLoading}
                                        className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 relative overflow-hidden text-xs ${dbDraftJobs.length > 0
                                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] active:scale-95'
                                            : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                            }`}
                                    >
                                        {distHubLoading ? (
                                            <RefreshCw className="animate-spin" size={16} />
                                        ) : (
                                            <Rocket size={16} />
                                        )}
                                        <span>{distHubLoading ? 'Authorizing Deployment...' : 'Authorize Deployment'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
