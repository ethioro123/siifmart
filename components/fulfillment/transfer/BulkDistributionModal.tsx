import React, { useState, useEffect } from 'react';
import { Truck, RotateCcw, X, Layers, AlertOctagon, Search, AlertTriangle } from 'lucide-react';
import { WMSJob, Product, Site, User } from '../../../types';
import { ProductSelector } from './ProductSelector';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';
import { useData } from '../../../contexts/DataContext';
import { logisticsZonesService } from '../../../services/supabase.service';
import { logger } from '../../../utils/logger';

interface BulkDistributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sites: Site[];
    products: Product[];
    allProducts: Product[];
    user: User | null;
    activeSite: Site | null;
    wmsJobsService: any;
    addNotification: (type: any, message: string) => void;
    refreshData: () => Promise<void>;
    logSystemEvent: (event: string, details: string, user: string, module: string) => void;
    renderTabs: () => React.ReactNode;
}

export const BulkDistributionModal: React.FC<BulkDistributionModalProps> = ({
    isOpen,
    onClose,
    sites,
    products,
    allProducts,
    user,
    activeSite,
    wmsJobsService,
    addNotification,
    refreshData,
    logSystemEvent,
    renderTabs
}) => {
    const { settings } = useData();
    const isRestricted = !['super_admin', 'admin'].includes(user?.role || '') && !!user?.siteId;
    const [logisticsZones, setLogisticsZones] = useState<any[]>([]);

    // --- STATE ---
    const [bulkDistributionMode, setBulkDistributionMode] = useState<'single' | 'wave'>('single');
    const [bulkDistributionSourceSite, setBulkDistributionSourceSite] = useState('');
    const [bulkDistributionProductId, setBulkDistributionProductId] = useState('');
    const [isSearchingProduct, setIsSearchingProduct] = useState(false);
    const [bulkDistributionAllocations, setBulkDistributionAllocations] = useState<{ storeId: string; quantity: number }[]>([]);
    const [waveProducts, setWaveProducts] = useState<{ productId: string; allocations: { storeId: string; quantity: number }[] }[]>([]);

    useEffect(() => {
        if (isOpen) {
            setBulkDistributionSourceSite(isRestricted ? (user?.siteId || '') : (activeSite?.id || ''));
            setBulkDistributionProductId('');
            setBulkDistributionAllocations([]);
            setWaveProducts([]);
            setBulkDistributionMode('single');

            // Fetch logistics zones
            const fetchZones = async () => {
                try {
                    const zones = await logisticsZonesService.getAll();
                    setLogisticsZones(zones);
                } catch (err) {
                    logger.error('BulkDistributionModal', 'Failed to fetch logistics zones:', err);
                }
            };
            fetchZones();
        }
    }, [isOpen, activeSite, user, isRestricted]);

    const sourceSiteObj = sites.find(s => s.id === (bulkDistributionSourceSite || activeSite?.id));

    const getZoneName = (zoneId?: string) => {
        if (!zoneId) return 'Unassigned / Free Zone';
        const zone = logisticsZones.find(z => z.id === zoneId);
        return zone ? zone.name : 'Loading...';
    };

    const getCrossZoneStores = () => {
        if (!settings?.enforceRegionalZoning || !sourceSiteObj) return [];
        const sourceZone = sourceSiteObj.logisticsZoneId || '';

        if (bulkDistributionMode === 'single') {
            return bulkDistributionAllocations
                .filter(alloc => alloc.quantity > 0)
                .map(alloc => sites.find(s => s.id === alloc.storeId))
                .filter((s): s is Site => !!s && (s.logisticsZoneId || '') !== sourceZone);
        } else {
            const storeIds = new Set<string>();
            waveProducts.forEach(wp => {
                wp.allocations.forEach(alloc => {
                    if (alloc.quantity > 0) {
                        storeIds.add(alloc.storeId);
                    }
                });
            });
            return Array.from(storeIds)
                .map(id => sites.find(s => s.id === id))
                .filter((s): s is Site => !!s && (s.logisticsZoneId || '') !== sourceZone);
        }
    };

    const crossZoneStores = getCrossZoneStores();
    const isCrossZone = crossZoneStores.length > 0;

    const handleCreateDistribution = async () => {
        const actualSourceSite = bulkDistributionSourceSite || activeSite?.id;

        if (settings?.enforceRegionalZoning && user?.role !== 'super_admin') {
            if (isCrossZone) {
                addNotification('alert', 'Cross-zone distribution is restricted. Stores can only receive stock from warehouses in the same Logistics Zone.');
                return;
            }
        }

        try {
            let createdJobs = 0;
            if (bulkDistributionMode === 'single') {
                const product = allProducts.find(p => p.id === bulkDistributionProductId);
                for (const allocation of bulkDistributionAllocations) {
                    if (allocation.quantity > 0) {
                        const transferJob: any = {
                            id: `DIST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            siteId: actualSourceSite,
                            site_id: actualSourceSite,
                            sourceSiteId: actualSourceSite,
                            source_site_id: actualSourceSite,
                            destSiteId: allocation.storeId,
                            dest_site_id: allocation.storeId,
                            type: 'TRANSFER',
                            status: 'Pending',
                            priority: 'Normal',
                            location: 'Bulk Distribution',
                            assignedTo: '',
                            items: 1,
                            lineItems: [{
                                productId: bulkDistributionProductId,
                                sku: product?.sku || '',
                                name: product?.name || '',
                                image: product?.image || '',
                                expectedQty: allocation.quantity,
                                pickedQty: 0,
                                status: 'Pending'
                            }],
                            orderRef: `${Date.now()}`,
                            transferStatus: 'Approved',
                            requestedBy: user?.name || 'System',
                            jobNumber: undefined
                        };

                        const createdBulkJob = await wmsJobsService.create(transferJob);
                        const pickJob: any = {
                            site_id: actualSourceSite,
                            siteId: actualSourceSite,
                            type: 'PICK',
                            sourceSiteId: actualSourceSite,
                            destSiteId: allocation.storeId,
                            priority: 'Normal',
                            status: 'Pending',
                            orderRef: createdBulkJob.id,
                            items: 1,
                            lineItems: [{
                                productId: bulkDistributionProductId,
                                sku: product?.sku || '',
                                name: product?.name || '',
                                expectedQty: allocation.quantity,
                                pickedQty: 0,
                                status: 'Pending'
                            }],
                            jobNumber: createdBulkJob.job_number
                        };
                        await wmsJobsService.create(pickJob);
                        createdJobs++;
                    }
                }
            } else {
                // Wave Implementation
                const storeAllocations: Record<string, { productId: string; quantity: number }[]> = {};
                for (const wp of waveProducts) {
                    for (const alloc of wp.allocations) {
                        if (alloc.quantity > 0) {
                            if (!storeAllocations[alloc.storeId]) storeAllocations[alloc.storeId] = [];
                            storeAllocations[alloc.storeId].push({ productId: wp.productId, quantity: alloc.quantity });
                        }
                    }
                }

                for (const [storeId, items] of Object.entries(storeAllocations)) {
                    const transferJob: any = {
                        id: `WAVE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        siteId: actualSourceSite,
                        site_id: actualSourceSite,
                        sourceSiteId: actualSourceSite,
                        source_site_id: actualSourceSite,
                        destSiteId: storeId,
                        dest_site_id: storeId,
                        type: 'TRANSFER',
                        status: 'Pending',
                        priority: 'Normal',
                        location: 'Wave Distribution',
                        assignedTo: '',
                        items: items.length,
                        lineItems: items.map(item => {
                            const product = allProducts.find(p => p.id === item.productId);
                            return {
                                productId: item.productId,
                                sku: product?.sku || '',
                                name: product?.name || '',
                                image: product?.image || '',
                                expectedQty: item.quantity,
                                pickedQty: 0,
                                status: 'Pending'
                            };
                        }),
                        orderRef: `${Date.now()}`,
                        transferStatus: 'Approved',
                        requestedBy: user?.name || 'System',
                        jobNumber: undefined
                    };

                    const createdWaveJob = await wmsJobsService.create(transferJob);
                    const pickJob: any = {
                        site_id: actualSourceSite,
                        siteId: actualSourceSite,
                        type: 'PICK',
                        sourceSiteId: actualSourceSite,
                        destSiteId: storeId,
                        priority: 'Normal',
                        status: 'Pending',
                        orderRef: createdWaveJob.id,
                        items: items.length,
                        lineItems: items.map(item => {
                            const prod = allProducts.find(p => p.id === item.productId);
                            return {
                                productId: item.productId,
                                sku: prod?.sku || '',
                                name: prod?.name || '',
                                expectedQty: item.quantity,
                                pickedQty: 0,
                                status: 'Pending'
                            };
                        }),
                        jobNumber: createdWaveJob.job_number
                    };
                    await wmsJobsService.create(pickJob);
                    createdJobs++;
                }
            }

            logSystemEvent(
                'Bulk Distribution Created',
                `Created ${createdJobs} distribution transfers. Mode: ${bulkDistributionMode}`,
                user?.name || 'System',
                'Inventory'
            );

            addNotification('success', `Created ${createdJobs} distribution transfers!`);
            onClose();
            setBulkDistributionAllocations([]);
            setWaveProducts([]);
            refreshData();
        } catch (e) {
            logger.error('BulkDistributionModal', 'caught error', e as Error);
            addNotification('alert', 'Failed to create distribution jobs');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full h-full md:p-8 flex flex-col">
                <div className="flex-1 bg-cyber-gray md:rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.1)] flex flex-col overflow-hidden relative">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Layers className="text-[#A9CBA2]" />
                                Bulk Distribution Center
                            </h2>
                            <p className="text-gray-400 text-xs mt-1">Push stock to multiple locations simultaneously</p>
                        </div>
                        {renderTabs()}
                        <button onClick={onClose} aria-label="Close Modal" className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Mode Selection */}
                        <div className="flex gap-4 mb-4">
                            <button
                                onClick={() => setBulkDistributionMode('single')}
                                className={`flex-1 p-4 rounded-xl border transition-all ${bulkDistributionMode === 'single'
                                    ? 'bg-[#2C5E3B]/10 border-[#2C5E3B]/50 shadow-[0_0_20px_rgba(44,94,59,0.2)]'
                                    : 'bg-black/20 border-white/5 hover:bg-white/5'
                                    }`}
                            >
                                <div className="text-sm font-bold text-white mb-1">Single Product Push</div>
                                <div className="text-xs text-gray-400">Distribute one SKU across all stores</div>
                            </button>
                            <button
                                onClick={() => setBulkDistributionMode('wave')}
                                className={`flex-1 p-4 rounded-xl border transition-all ${bulkDistributionMode === 'wave'
                                    ? 'bg-[#2C5E3B]/10 border-[#2C5E3B]/50 shadow-[0_0_20px_rgba(44,94,59,0.2)]'
                                    : 'bg-black/20 border-white/5 hover:bg-white/5'
                                    }`}
                            >
                                <div className="text-sm font-bold text-white mb-1">Multi-SKU Wave</div>
                                <div className="text-xs text-gray-400">Create complex distribution waves for multiple items</div>
                            </button>
                        </div>

                        {/* Source Selection */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <label htmlFor="source-warehouse-select" className="block text-xs font-bold text-gray-400 uppercase mb-2">Distribution Source</label>
                            <select
                                id="source-warehouse-select"
                                value={bulkDistributionSourceSite}
                                onChange={(e) => {
                                    setBulkDistributionSourceSite(e.target.value);
                                    setBulkDistributionProductId('');
                                    setBulkDistributionAllocations([]);
                                    setWaveProducts([]);
                                }}
                                className={`w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none ${
                                    isRestricted 
                                        ? 'text-white/55 cursor-not-allowed' 
                                        : 'text-white focus:border-[#2C5E3B]'
                                }`}
                                aria-label="Select Distribution Source"
                                disabled={isRestricted}
                            >
                                {isRestricted ? (
                                    <option value={activeSite?.id || bulkDistributionSourceSite}>{activeSite?.name || 'Current Site'}</option>
                                ) : (
                                    <>
                                        <option value="">Select Distribution Source</option>
                                        {sites.map(site => (
                                            <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>

                        {isCrossZone && settings?.enforceRegionalZoning && user?.role === 'super_admin' && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-xl flex items-start gap-3 animate-pulse">
                                <AlertTriangle className="shrink-0 mt-0.5 text-yellow-400" size={18} />
                                <div>
                                    <h4 className="font-bold text-sm text-yellow-400">⚠️ Cross-Zone Allocation Override</h4>
                                    <p className="text-xs mt-1 text-yellow-500/90 leading-relaxed">
                                        You are distributing stock from <span className="font-bold text-white">{getZoneName(sourceSiteObj?.logisticsZoneId)}</span> to stores in different Logistics Zones: {crossZoneStores.map(s => `${s.name} (${getZoneName(s.logisticsZoneId)})`).join(', ')}. As CEO, you are authorized to override this restriction.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Single Mode Content */}
                        {bulkDistributionMode === 'single' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Product to Distribute</label>
                                    {isSearchingProduct ? (
                                        <div className="mt-2">
                                            <ProductSelector
                                                products={allProducts}
                                                onSelect={(product) => {
                                                    setBulkDistributionProductId(product.id);
                                                    const warehouseId = bulkDistributionSourceSite || activeSite?.id;
                                                    const stores = sites.filter(s => {
                                                        if (s.type !== 'Store') return false;

                                                        if (settings?.enforceRegionalZoning) {
                                                            if (user?.role !== 'super_admin' && sourceSiteObj) {
                                                                return (s.logisticsZoneId || '') === (sourceSiteObj.logisticsZoneId || '');
                                                            }
                                                        }
                                                        return true;
                                                    });
                                                    setBulkDistributionAllocations(stores.map(s => ({ storeId: s.id, quantity: 0 })));
                                                    setIsSearchingProduct(false);
                                                }}
                                                onCancel={() => setIsSearchingProduct(false)}
                                            />
                                        </div>
                                    ) : (
                                        <div onClick={() => setIsSearchingProduct(true)} className="cursor-pointer">
                                            <div className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex justify-between items-center hover:border-blue-500/50 transition-colors">
                                                <span>
                                                    {bulkDistributionProductId
                                                        ? products.find(p => p.id === bulkDistributionProductId)?.name
                                                        : "Select Product to Distribute..."}
                                                </span>
                                                <Search size={14} className="text-gray-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {bulkDistributionProductId && (
                                    <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                        <div className="p-3 bg-white/5 border-b border-white/5 font-bold text-xs text-white uppercase tracking-wider flex justify-between items-center">
                                            <span>Store Allocation</span>
                                            <div className="flex items-center gap-3">
                                                {(() => {
                                                    const prod = allProducts.find(p => p.id === bulkDistributionProductId);
                                                    const sourceStockItem = allProducts.find(p => p.sku === prod?.sku && p.siteId === bulkDistributionSourceSite);
                                                    const rawStock = sourceStockItem?.stock || 0;
                                                    const unitDef = getSellUnit(sourceStockItem?.unit || prod?.unit || '');
                                                    const sizeNum = parseFloat(sourceStockItem?.size || prod?.size || '0');
                                                    const isWeightVol = unitDef.category === 'weight' || unitDef.category === 'volume';
                                                    const displayStock = isWeightVol && sizeNum > 0 ? rawStock * sizeNum : rawStock;
                                                    const totalAllocated = bulkDistributionAllocations.reduce((acc, curr) => acc + curr.quantity, 0);
                                                    const displayRemaining = displayStock - (isWeightVol && sizeNum > 0 ? totalAllocated * sizeNum : totalAllocated);
                                                    const unitLabel = unitDef.code !== 'UNIT' ? ` ${unitDef.shortLabel}` : '';
                                                    const isWarning = displayRemaining < 0;
                                                    return (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${isWarning ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                                            Stock: {displayStock.toLocaleString()}{unitLabel} ➔ Rem: {displayRemaining.toLocaleString()}{unitLabel}
                                                        </span>
                                                    );
                                                })()}
                                                <span className="text-gray-400">Total: {bulkDistributionAllocations.reduce((acc, curr) => acc + curr.quantity, 0)} Units</span>
                                            </div>
                                        </div>
                                        <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {bulkDistributionAllocations.length === 0 ? (
                                                <div className="p-6 text-center text-red-400 font-bold text-xs uppercase tracking-wider">
                                                    ⚠️ No stores have this warehouse configured as a replenishment source.
                                                </div>
                                            ) : (
                                                bulkDistributionAllocations.map(alloc => {
                                                    const site = sites.find(s => s.id === alloc.storeId);
                                                    return (
                                                        <div key={alloc.storeId} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                                                            <span className="text-sm text-gray-300">{site?.name}</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={alloc.quantity}
                                                                onChange={(e) => {
                                                                    const newAllocs = [...bulkDistributionAllocations];
                                                                    const target = newAllocs.find(a => a.storeId === alloc.storeId);
                                                                    if (target) target.quantity = parseInt(e.target.value) || 0;
                                                                    setBulkDistributionAllocations(newAllocs);
                                                                }}
                                                                className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-right text-white focus:border-blue-500 focus:outline-none"
                                                                aria-label={`Quantity for ${site?.name}`}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Wave Mode Content */}
                        {bulkDistributionMode === 'wave' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 rounded-xl p-4 flex items-start gap-3">
                                    <AlertOctagon className="text-[#A9CBA2] shrink-0" size={20} />
                                    <div>
                                        <h4 className="font-bold text-[#A9CBA2] text-sm">Wave Distribution Mode</h4>
                                        <p className="text-xs text-[#A9CBA2]/80 mt-1">Add multiple products to build a distribution wave. Each product can have unique store allocations.</p>
                                    </div>
                                </div>

                                {isSearchingProduct ? (
                                    <div className="mt-2">
                                        <ProductSelector
                                            products={allProducts}
                                            onSelect={(product) => {
                                                const warehouseId = bulkDistributionSourceSite || activeSite?.id;
                                                let stores = sites.filter(s => {
                                                    if (s.type !== 'Store') return false;

                                                    if (settings?.enforceRegionalZoning) {
                                                        if (user?.role !== 'super_admin' && sourceSiteObj) {
                                                            return (s.logisticsZoneId || '') === (sourceSiteObj.logisticsZoneId || '');
                                                        }
                                                    }
                                                    return true;
                                                });
                                                setWaveProducts([...waveProducts, {
                                                    productId: product.id,
                                                    allocations: stores.map(s => ({ storeId: s.id, quantity: 0 }))
                                                }]);
                                                setIsSearchingProduct(false);
                                            }}
                                            onCancel={() => setIsSearchingProduct(false)}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsSearchingProduct(true)}
                                        className="w-full py-3 border border-dashed border-white/20 rounded-xl hover:bg-white/5 hover:border-white/40 text-gray-400 hover:text-white transition-all text-sm font-bold"
                                    >
                                        + Add Product to Wave
                                    </button>
                                )}

                                <div className="space-y-4">
                                    {waveProducts.map((wp, idx) => {
                                        const prod = allProducts.find(p => p.id === wp.productId);
                                        return (
                                            <div key={idx} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                                                <div className="p-3 bg-white/5 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="font-bold text-white text-sm">{prod?.name}</div>
                                                        {(() => {
                                                            const sourceStockItem = allProducts.find(p => p.sku === prod?.sku && p.siteId === bulkDistributionSourceSite);
                                                            const rawStock = sourceStockItem?.stock || 0;
                                                            const unitDef = getSellUnit(sourceStockItem?.unit || prod?.unit || '');
                                                            const sizeNum = parseFloat(sourceStockItem?.size || prod?.size || '0');
                                                            const isWeightVol = unitDef.category === 'weight' || unitDef.category === 'volume';
                                                            const displayStock = isWeightVol && sizeNum > 0 ? rawStock * sizeNum : rawStock;
                                                            const totalAllocated = wp.allocations.reduce((acc, curr) => acc + curr.quantity, 0);
                                                            const displayRemaining = displayStock - (isWeightVol && sizeNum > 0 ? totalAllocated * sizeNum : totalAllocated);
                                                            const unitLabel = unitDef.code !== 'UNIT' ? ` ${unitDef.shortLabel}` : '';
                                                            const isWarning = displayRemaining < 0;
                                                            return (
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${isWarning ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                                                    Stock: {displayStock.toLocaleString()}{unitLabel} ➔ Rem: {displayRemaining.toLocaleString()}{unitLabel}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    <button onClick={() => {
                                                        const newWp = [...waveProducts];
                                                        newWp.splice(idx, 1);
                                                        setWaveProducts(newWp);
                                                    }} className="text-red-400 hover:text-red-300" aria-label={`Remove ${prod?.name} from wave`}><X size={16} /></button>
                                                </div>
                                                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {wp.allocations.length === 0 ? (
                                                        <div className="col-span-full p-4 text-center text-red-400 font-bold text-[10px] uppercase tracking-wider">
                                                            ⚠️ No stores have this warehouse configured as a replenishment source.
                                                        </div>
                                                    ) : (
                                                        wp.allocations.map(alloc => {
                                                            const site = sites.find(s => s.id === alloc.storeId);
                                                            return (
                                                                <div key={alloc.storeId} className="flex items-center justify-between text-xs bg-black/40 p-2 rounded">
                                                                    <span className="text-gray-400 truncate max-w-[80px]">{site?.name}</span>
                                                                    <input
                                                                        type="number"
                                                                        className="w-12 bg-transparent border-b border-white/20 text-right text-white focus:outline-none focus:border-blue-500"
                                                                        value={alloc.quantity}
                                                                        onChange={(e) => {
                                                                            const newWp = [...waveProducts];
                                                                            const targetIndex = newWp[idx].allocations.findIndex(a => a.storeId === alloc.storeId);
                                                                            if (targetIndex !== -1) {
                                                                                newWp[idx].allocations[targetIndex].quantity = parseInt(e.target.value) || 0;
                                                                                setWaveProducts(newWp);
                                                                            }
                                                                        }}
                                                                        aria-label={`Quantity for ${site?.name}`}
                                                                    />
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/10 bg-black/20 flex gap-3 justify-end items-center">
                        <div className="mr-auto text-xs text-gray-500">
                            {bulkDistributionMode === 'single'
                                ? `${bulkDistributionAllocations.filter(a => a.quantity > 0).length} stores targeted`
                                : `${waveProducts.length} items in wave`
                            }
                        </div>
                        <button
                            onClick={() => {
                                setBulkDistributionAllocations([]);
                                setWaveProducts([]);
                            }}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Reset Form"
                        >
                            <RotateCcw size={20} />
                        </button>
                        <button
                            onClick={handleCreateDistribution}
                            disabled={bulkDistributionMode === 'single'
                                ? (!bulkDistributionProductId || bulkDistributionAllocations.filter(a => a.quantity > 0).length === 0)
                                : (waveProducts.length === 0 || !waveProducts.some(wp => wp.allocations.some(a => a.quantity > 0)))
                            }
                            className={`px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${((bulkDistributionMode === 'single' && bulkDistributionProductId && bulkDistributionAllocations.filter(a => a.quantity > 0).length > 0) ||
                                (bulkDistributionMode === 'wave' && waveProducts.length > 0 && waveProducts.some(wp => wp.allocations.some(a => a.quantity > 0))))
                                ? 'bg-[#2C5E3B] text-white hover:bg-[#3a7a4d] shadow-lg shadow-[#2C5E3B]/20'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <Truck size={16} />
                            Create Distribution
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
