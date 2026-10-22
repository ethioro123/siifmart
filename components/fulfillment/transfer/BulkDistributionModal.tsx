import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Truck, RotateCcw, X, Layers, AlertTriangle } from 'lucide-react';
import { Product, Site, User } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { logisticsZonesService } from '../../../services/supabase.service';
import { logger } from '../../../utils/logger';
import { SingleProductAllocation } from './components/SingleProductAllocation';
import { WaveDistributionAllocations } from './components/WaveDistributionAllocations';
import { buildTransferLineItem } from './transferQuantity';

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
    const isRestricted = !['group_ceo', 'country_managing_director'].includes(user?.role || '') && !!user?.siteId;
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

        const canOverrideZoning = ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'country_supply_chain_director'].includes(user?.role || '');
        if (settings?.enforceRegionalZoning && !canOverrideZoning) {
            if (isCrossZone) {
                addNotification('alert', 'Cross-zone distribution is restricted. Stores can only receive stock from warehouses in the same Logistics Zone.');
                return;
            }
        }

        const selectedProduct = bulkDistributionMode === 'single'
            ? allProducts.find(p => p.id === bulkDistributionProductId) || products.find(p => p.id === bulkDistributionProductId)
            : undefined;
        const sourceProductFor = (productId: string) => {
            const selected = allProducts.find(p => p.id === productId) || products.find(p => p.id === productId);
            return allProducts.find(p => p.sku === selected?.sku && (p.siteId || p.site_id) === actualSourceSite)
                || products.find(p => p.sku === selected?.sku && (p.siteId || p.site_id) === actualSourceSite)
                || selected;
        };
        if (bulkDistributionMode === 'single') {
            const sourceProduct = sourceProductFor(bulkDistributionProductId) || selectedProduct;
            const total = bulkDistributionAllocations.reduce((sum, allocation) => sum + allocation.quantity, 0);
            if (!sourceProduct || total <= 0 || total > (sourceProduct.stock || 0) + 1e-9) {
                addNotification('alert', 'Enter a distribution quantity within the available source stock.');
                return;
            }
        } else {
            if (!waveProducts.some(waveProduct => waveProduct.allocations.some(allocation => allocation.quantity > 0))) {
                addNotification('alert', 'Enter at least one product quantity to create a distribution wave.');
                return;
            }
            const overAllocated = waveProducts.some(waveProduct => {
                const sourceProduct = sourceProductFor(waveProduct.productId);
                const total = waveProduct.allocations.reduce((sum, allocation) => sum + allocation.quantity, 0);
                return !sourceProduct || total > (sourceProduct.stock || 0) + 1e-9;
            });
            if (overAllocated) {
                addNotification('alert', 'A wave allocation exceeds the available source stock for a product.');
                return;
            }
        }

        try {
            let createdJobs = 0;
            if (bulkDistributionMode === 'single') {
                const selectedProduct = allProducts.find(p => p.id === bulkDistributionProductId) || products.find(p => p.id === bulkDistributionProductId);
                const product = (allProducts.find(p => p.sku === selectedProduct?.sku && (p.siteId || p.site_id) === actualSourceSite)
                    || products.find(p => p.sku === selectedProduct?.sku && (p.siteId || p.site_id) === actualSourceSite)
                    || selectedProduct);
                for (const allocation of bulkDistributionAllocations) {
                    if (allocation.quantity > 0) {
                        const transferLineItem = buildTransferLineItem(product, allocation.quantity);
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
                            lineItems: [transferLineItem],
                            orderRef: `${Date.now()}`,
                            transferStatus: 'Requested',
                            requestedBy: user?.name || 'System',
                            jobNumber: undefined
                        };

                        await wmsJobsService.create(transferJob);
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

                const sourceSiteObj = sites.find(s => s.id === actualSourceSite);
                const siteCountry = sourceSiteObj?.country || (sourceSiteObj as any)?.country_code || activeSite?.country || (activeSite as any)?.country_code || 'ET';

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
                        countryCode: siteCountry,
                        country_code: siteCountry,
                        items: items.length,
                        lineItems: items.map(item => {
                            const selected = allProducts.find(p => p.id === item.productId) || products.find(p => p.id === item.productId);
                            const product = allProducts.find(p => p.sku === selected?.sku && (p.siteId || p.site_id) === actualSourceSite)
                                || products.find(p => p.sku === selected?.sku && (p.siteId || p.site_id) === actualSourceSite)
                                || selected;
                            return buildTransferLineItem(product, item.quantity);
                        }),
                        orderRef: `${Date.now()}`,
                        transferStatus: 'Requested',
                        requestedBy: user?.name || 'System',
                        jobNumber: undefined
                    };

                    await wmsJobsService.create(transferJob);
                    createdJobs++;
                }
            }

            logSystemEvent(
                'Bulk Distribution Created',
                `Created ${createdJobs} distribution transfers. Mode: ${bulkDistributionMode}`,
                user?.name || 'System',
                'Inventory'
            );

            addNotification('success', `Submitted ${createdJobs} distribution transfers for warehouse manager approval.`);
            onClose();
            setBulkDistributionAllocations([]);
            setWaveProducts([]);
            refreshData();
        } catch (e) {
            logger.error('BulkDistributionModal', 'caught error', e as Error);
            addNotification('alert', 'Failed to create distribution jobs');
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-200">
            <div className="w-full h-full max-w-[1700px] max-h-[96vh] md:max-h-[92vh] flex flex-col">
                <div className="flex-1 bg-[var(--theme-bg-card)] rounded-2xl md:rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden relative">
                    <div className="p-3.5 sm:p-4 md:p-5 border-b border-[var(--theme-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--theme-bg-subtle)] shrink-0">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base sm:text-lg md:text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2 tracking-tight">
                                    <Layers className="text-primary shrink-0" size={20} />
                                    <span className="truncate">Bulk Distribution <span className="text-primary">Push</span></span>
                                </h2>
                                <p className="text-[var(--theme-text-secondary)] text-[11px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5 truncate">
                                    Push stock from warehouse to multiple stores simultaneously
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close Modal"
                                className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs touch-manipulation shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex-1 md:flex-none w-full">
                                {renderTabs()}
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close Modal"
                                className="hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors border border-[var(--theme-border)] shadow-xs touch-manipulation shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                        {/* Mode Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                            <button
                                onClick={() => setBulkDistributionMode('single')}
                                className={`min-h-[44px] p-4 rounded-xl border transition-all text-left touch-manipulation ${bulkDistributionMode === 'single'
                                    ? 'bg-primary/10 border-primary text-[var(--theme-text-primary)] shadow-xs'
                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)]'
                                    }`}
                            >
                                <div className="text-sm font-bold text-[var(--theme-text-primary)] mb-1">Single Product Push</div>
                                <div className="text-xs text-[var(--theme-text-secondary)]">Distribute one SKU across all stores</div>
                            </button>
                            <button
                                onClick={() => setBulkDistributionMode('wave')}
                                className={`min-h-[44px] p-4 rounded-xl border transition-all text-left touch-manipulation ${bulkDistributionMode === 'wave'
                                    ? 'bg-primary/10 border-primary text-[var(--theme-text-primary)] shadow-xs'
                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)]'
                                    }`}
                            >
                                <div className="text-sm font-bold text-[var(--theme-text-primary)] mb-1">Multi-SKU Wave</div>
                                <div className="text-xs text-[var(--theme-text-secondary)]">Create complex distribution waves for multiple items</div>
                            </button>
                        </div>

                        {/* Source Selection */}
                        <div className="bg-[var(--theme-bg-subtle)] p-4 rounded-xl border border-[var(--theme-border)]">
                            <label htmlFor="source-warehouse-select" className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">Distribution Source</label>
                            <select
                                id="source-warehouse-select"
                                value={bulkDistributionSourceSite}
                                onChange={(e) => {
                                    setBulkDistributionSourceSite(e.target.value);
                                    setBulkDistributionProductId('');
                                    setBulkDistributionAllocations([]);
                                    setWaveProducts([]);
                                }}
                                className={`w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm focus:outline-none touch-manipulation ${
                                    isRestricted 
                                        ? 'text-[var(--theme-text-secondary)] opacity-60 cursor-not-allowed' 
                                        : 'text-[var(--theme-text-primary)] focus:border-primary'
                                }`}
                                aria-label="Select Distribution Source"
                                disabled={isRestricted}
                            >
                                {isRestricted ? (
                                    <option value={activeSite?.id || bulkDistributionSourceSite}>{activeSite?.name || 'Current Site'}</option>
                                ) : (
                                    <>
                                        <option value="">Select Distribution Source</option>
                                        {sites.filter(site => ['Warehouse', 'Distribution Center'].includes(site.type)).map(site => (
                                            <option key={site.id} value={site.id}>{site.name} ({site.type})</option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>

                        {isCrossZone && settings?.enforceRegionalZoning && ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director', 'country_supply_chain_director'].includes(user?.role || '') && (
                             <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3">
                                 <AlertTriangle className="shrink-0 mt-0.5 text-amber-500" size={18} />
                                 <div>
                                     <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400">Cross-Zone Allocation Override</h4>
                                     <p className="text-xs mt-1 text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                                         You are distributing stock from <span className="font-bold text-[var(--theme-text-primary)]">{getZoneName(sourceSiteObj?.logisticsZoneId)}</span> to stores in different Logistics Zones: {crossZoneStores.map(s => `${s.name} (${getZoneName(s.logisticsZoneId)})`).join(', ')}. Emergency leadership authorization active.
                                     </p>
                                 </div>
                             </div>
                        )}

                        {/* Single Mode Content */}
                        {bulkDistributionMode === 'single' && (
                            <SingleProductAllocation
                                isSearchingProduct={isSearchingProduct}
                                setIsSearchingProduct={setIsSearchingProduct}
                                allProducts={allProducts}
                                products={products}
                                bulkDistributionProductId={bulkDistributionProductId}
                                setBulkDistributionProductId={setBulkDistributionProductId}
                                bulkDistributionSourceSite={bulkDistributionSourceSite}
                                activeSite={activeSite}
                                sites={sites}
                                settings={settings}
                                user={user}
                                sourceSiteObj={sourceSiteObj}
                                bulkDistributionAllocations={bulkDistributionAllocations}
                                setBulkDistributionAllocations={setBulkDistributionAllocations}
                            />
                        )}

                        {/* Wave Mode Content */}
                        {bulkDistributionMode === 'wave' && (
                            <WaveDistributionAllocations
                                isSearchingProduct={isSearchingProduct}
                                setIsSearchingProduct={setIsSearchingProduct}
                                allProducts={allProducts}
                                products={products}
                                bulkDistributionSourceSite={bulkDistributionSourceSite}
                                activeSite={activeSite}
                                sites={sites}
                                settings={settings}
                                user={user}
                                sourceSiteObj={sourceSiteObj}
                                waveProducts={waveProducts}
                                setWaveProducts={setWaveProducts}
                            />
                        )}
                    </div>

                    <div className="p-4 md:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex gap-3 justify-end items-center">
                        <div className="mr-auto text-xs text-[var(--theme-text-secondary)] font-mono font-medium">
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
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] rounded-xl transition-colors border border-[var(--theme-border)] touch-manipulation"
                            title="Reset Form"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button
                            onClick={handleCreateDistribution}
                            disabled={bulkDistributionMode === 'single'
                                ? (!bulkDistributionProductId || bulkDistributionAllocations.filter(a => a.quantity > 0).length === 0)
                                : (waveProducts.length === 0 || !waveProducts.some(wp => wp.allocations.some(a => a.quantity > 0)))
                            }
                            className={`min-h-[44px] px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center gap-2 text-xs shadow-xs touch-manipulation ${((bulkDistributionMode === 'single' && bulkDistributionProductId && bulkDistributionAllocations.filter(a => a.quantity > 0).length > 0) ||
                                (bulkDistributionMode === 'wave' && waveProducts.length > 0 && waveProducts.some(wp => wp.allocations.some(a => a.quantity > 0))))
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 active:scale-95 cursor-pointer'
                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] opacity-50 cursor-not-allowed border border-[var(--theme-border)]'
                                }`}
                        >
                            <Truck size={16} />
                            Submit for Approval
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
