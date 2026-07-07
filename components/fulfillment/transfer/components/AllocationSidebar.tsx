import React from 'react';
import {
    Warehouse, ShoppingBag, AlertTriangle, Trash2, ArrowRight, Plus, Minus, RefreshCw, Rocket, X
} from 'lucide-react';
import { getSellUnit } from '../../../../utils/units';
import { Site, Product, User } from '../../../../types';
import { logger } from '../../../../utils/logger';

interface AllocationSidebarProps {
    distHubSelectedSku: string;
    distHubSelectedDestSite: string;
    distHubAvailableSources: any[];
    distHubAllocQty: Record<string, number>;
    incrementQty: (sourceId: string, maxStock: number) => void;
    decrementQty: (sourceId: string) => void;
    handleQtyChange: (sourceId: string, val: number, maxStock: number) => void;
    addToDistDraft: (sourceProd: any, qty: number) => Promise<void>;
    dbDraftJobs: any[];
    settings: any;
    user: User | null;
    sites: Site[];
    allProducts: Product[];
    distHubLoading: boolean;
    setDistHubLoading: (val: boolean) => void;
    wmsJobsService: any;
    addNotification: (type: any, msg: string) => void;
    fetchDistHubData: () => Promise<void>;
    updateDraftItemQty: (jobId: string, itemIdx: number, val: number) => Promise<void>;
    removeDraftItem: (jobId: string, itemIdx: number) => Promise<void>;
    submitDistTransfers: () => Promise<void>;
    getZoneName: (zoneId?: string) => string;
    distHubLowStockItems: any[];
}

export const AllocationSidebar = ({
    distHubSelectedSku,
    distHubSelectedDestSite,
    distHubAvailableSources,
    distHubAllocQty,
    incrementQty,
    decrementQty,
    handleQtyChange,
    addToDistDraft,
    dbDraftJobs,
    settings,
    user,
    sites,
    allProducts,
    distHubLoading,
    setDistHubLoading,
    wmsJobsService,
    addNotification,
    fetchDistHubData,
    updateDraftItemQty,
    removeDraftItem,
    submitDistTransfers,
    getZoneName,
    distHubLowStockItems
}: AllocationSidebarProps) => {

    const ScanningAnimation = () => (
        <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-cyber-primary/30 rounded-lg animate-ping" />
            <div className="absolute inset-0 border-2 border-cyber-primary rounded-lg animate-pulse" />
            <RefreshCw className="text-cyber-primary relative z-10" size={24} />
        </div>
    );

    return (
        <div className="lg:w-[40%] xl:w-[35%] bg-black/30 flex flex-col h-full overflow-hidden border-l border-white/5">
            {/* Top Section: Available Sources */}
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
                                                    <div className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">
                                                        Zone: <span className="text-white font-bold">{getZoneName(source.site?.logisticsZoneId)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block leading-none mb-0.5">Avail</span>
                                                    <span className="text-xs font-mono font-black text-emerald-400">{source.stock}</span>
                                                </div>
                                            </div>

                                            {/* Quantity Selector & Staging button */}
                                            <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/5">
                                                <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-0.5">
                                                    <button
                                                        onClick={() => decrementQty(source.id)}
                                                        className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded transition-colors"
                                                        title="Decrease allocation quantity"
                                                        aria-label="Decrease allocation quantity"
                                                    >
                                                        <Minus size={11} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        className="w-12 bg-transparent text-center font-mono font-bold text-white text-xs focus:ring-0 focus:outline-none"
                                                        value={allocQty}
                                                        aria-label="Allocation quantity"
                                                        title="Allocation quantity"
                                                        onChange={(e) => handleQtyChange(source.id, parseFloat(e.target.value), source.stock)}
                                                    />
                                                    <button
                                                        onClick={() => incrementQty(source.id, source.stock)}
                                                        className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded transition-colors"
                                                        title="Increase allocation quantity"
                                                        aria-label="Increase allocation quantity"
                                                    >
                                                        <Plus size={11} />
                                                    </button>
                                                </div>
                                                
                                                <button
                                                    onClick={() => addToDistDraft(source, allocQty)}
                                                    disabled={distHubLoading}
                                                    className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 text-center flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus size={12} />
                                                    Stage Load
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
            
            {/* Bottom Section: Launchpad (Staged Manifests) */}
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
                                                        logger.error('AllocationSidebar', 'caught error', err as Error);
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
                                        {(draft.lineItems || []).map((item: any, idx: number) => {
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
    );
};
