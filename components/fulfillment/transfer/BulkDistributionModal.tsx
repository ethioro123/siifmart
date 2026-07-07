import React, { useState, useEffect } from 'react';
import { Truck, RotateCcw, X, Layers, AlertOctagon, Search, AlertTriangle } from 'lucide-react';
import { WMSJob, Product, Site, User } from '../../../types';
import { ProductSelector } from './ProductSelector';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { getSellUnit } from '../../../utils/units';
import { useData } from '../../../contexts/DataContext';
import { logisticsZonesService } from '../../../services/supabase.service';
import { logger } from '../../../utils/logger';
import { SingleProductAllocation } from './components/SingleProductAllocation';
import { WaveDistributionAllocations } from './components/WaveDistributionAllocations';

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
