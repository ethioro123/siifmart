import React from 'react';
import {
    Warehouse, ShoppingBag, AlertTriangle, Trash2, ArrowRight, Plus, Minus, RefreshCw, Send, X, Package, Check, Sparkles
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

export const AllocationSidebar: React.FC<AllocationSidebarProps> = ({
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
}) => {
    const selectedProduct = distHubLowStockItems.find(p => p.sku === distHubSelectedSku);
    const destSiteObj = sites.find(s => s.id === distHubSelectedDestSite);

    return (
        <div className="lg:w-[45%] xl:w-[42%] bg-stone-50/80 dark:bg-[#121915]/90 flex flex-col h-full overflow-hidden">
            {/* Top Section: Available Warehouse Sources */}
            <div className="flex-1 flex flex-col overflow-hidden border-b border-[#E2DCCE] dark:border-white/10">
                <div className="p-4 border-b border-[#E2DCCE] dark:border-white/10 flex items-center justify-between bg-white/70 dark:bg-[#161F1A]/70 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-6 bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-full shadow-xs" />
                        <div>
                            <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">Source Warehouse Allocation</h3>
                            <p className="text-[9px] text-stone-500 dark:text-stone-400 uppercase tracking-widest font-bold">Select supply source to fulfill store deficit</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {!distHubSelectedSku ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-stone-400 dark:text-stone-500">
                            <Package size={32} className="mb-2 text-stone-300 dark:text-stone-600" />
                            <p className="text-xs uppercase font-black tracking-widest text-stone-600 dark:text-stone-300">Awaiting Selection</p>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 max-w-[220px]">
                                Click a store gap on the left to view available warehouse inventory and stage replenishment.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Selected Product Summary */}
                            <div className="p-3.5 bg-white dark:bg-[#1C2620] rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs flex flex-col gap-1.5 shrink-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#2C5E3B] dark:text-[#A9CBA2] flex items-center gap-1">
                                        <Sparkles size={10} /> Target Item
                                    </span>
                                    <span className="text-[9px] font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-white/10 px-2 py-0.5 rounded-md font-mono">
                                        {distHubSelectedSku}
                                    </span>
                                </div>
                                <div className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight truncate">
                                    {selectedProduct?.name || 'Selected Item'}
                                </div>
                                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#E2DCCE]/60 dark:border-white/5 font-bold">
                                    <span className="text-stone-500 dark:text-stone-400">Destination:</span>
                                    <span className="text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-black">
                                        {destSiteObj?.name || 'Store'}
                                    </span>
                                </div>
                            </div>

                            {/* Available Warehouse Sources List */}
                            {distHubAvailableSources.length === 0 ? (
                                <div className="p-6 bg-white dark:bg-[#1C2620] border border-dashed border-red-200 dark:border-red-500/20 rounded-2xl text-center">
                                    <AlertTriangle size={24} className="mx-auto text-amber-500 mb-2" />
                                    <p className="text-xs text-red-600 dark:text-red-400 font-black uppercase tracking-wider">No Available Warehouse Stock</p>
                                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                                        No warehouses in the network have available stock of this SKU.
                                    </p>
                                </div>
                            ) : (
                                distHubAvailableSources.map(source => {
                                    const isWarehouse = source.site?.type === 'Warehouse' || source.site?.type === 'Distribution Center';
                                    const allocQty = distHubAllocQty[source.id] || Math.min(10, source.stock);
                                    const isCrossZone = destSiteObj && source.site && (destSiteObj.logisticsZoneId || '') !== (source.site.logisticsZoneId || '');

                                    return (
                                        <div key={source.id} className="p-3.5 bg-white dark:bg-[#1C2620] border border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/30 rounded-2xl shadow-xs transition-all">
                                            {/* Source Warehouse Header */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {isWarehouse ? <Warehouse size={13} className="text-[#2C5E3B] dark:text-[#A9CBA2]" /> : <ShoppingBag size={13} className="text-amber-500" />}
                                                        <span className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight truncate">
                                                            {source.site?.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-[9px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                                                        Zone: <span className="text-stone-800 dark:text-stone-200 font-black">{getZoneName(source.site?.logisticsZoneId)}</span>
                                                    </div>
                                                    {isCrossZone && settings?.enforceRegionalZoning && (
                                                        <span className="inline-block mt-1 text-[8px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                                                            ⚠️ Cross-Zone Override
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-right shrink-0 bg-stone-50 dark:bg-black/30 px-2.5 py-1 rounded-xl border border-[#E2DCCE] dark:border-white/5">
                                                    <span className="text-[8px] text-stone-400 dark:text-stone-500 font-black uppercase tracking-widest block leading-none mb-0.5">Available</span>
                                                    <span className="text-xs font-mono font-black text-[#2C5E3B] dark:text-[#A9CBA2]">{source.stock}</span>
                                                </div>
                                            </div>

                                            {/* Quick Fill & Stepper & Stage Action */}
                                            <div className="mt-2.5 pt-2.5 border-t border-[#E2DCCE]/60 dark:border-white/5 flex items-center justify-between gap-2">
                                                {/* Stepper */}
                                                <div className="flex items-center bg-stone-100 dark:bg-black/40 rounded-xl border border-[#E2DCCE] dark:border-white/10 p-0.5 shrink-0">
                                                    <button
                                                        onClick={() => decrementQty(source.id)}
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 rounded-lg transition-colors active:scale-95"
                                                        title="Decrease quantity"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        className="w-12 bg-transparent text-center font-mono font-black text-stone-900 dark:text-white text-xs focus:ring-0 focus:outline-none"
                                                        value={allocQty}
                                                        aria-label="Allocation quantity"
                                                        title="Allocation quantity"
                                                        onChange={(e) => handleQtyChange(source.id, parseFloat(e.target.value), source.stock)}
                                                    />
                                                    <button
                                                        onClick={() => incrementQty(source.id, source.stock)}
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 rounded-lg transition-colors active:scale-95"
                                                        title="Increase quantity"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>

                                                {/* Stage to Manifest Button */}
                                                <button
                                                    onClick={() => addToDistDraft(source, allocQty)}
                                                    disabled={distHubLoading}
                                                    className="flex-1 py-2 px-3 bg-[#2C5E3B] hover:bg-[#234b2f] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
                                                >
                                                    <Plus size={12} />
                                                    Stage to Manifest
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

            {/* Bottom Section: Staged Manifests & Authorization */}
            <div className="h-[46%] flex flex-col bg-white/70 dark:bg-[#141C17]/80 overflow-hidden shrink-0">
                <div className="p-3.5 border-b border-[#E2DCCE] dark:border-white/10 flex items-center justify-between bg-stone-50/90 dark:bg-[#161F1A]/90 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-5 bg-amber-500 rounded-full shadow-xs" />
                        <div>
                            <h3 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">Staged Manifests</h3>
                            <p className="text-[8px] text-stone-500 dark:text-stone-400 uppercase tracking-widest font-bold">Review transfer loads before deployment</p>
                        </div>
                    </div>
                    {dbDraftJobs.length > 0 && (
                        <div className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/15 rounded-lg border border-amber-200 dark:border-amber-500/30 text-[9px] font-mono text-amber-800 dark:text-amber-300 font-black shrink-0">
                            {dbDraftJobs.length} {dbDraftJobs.length === 1 ? 'LOAD' : 'LOADS'}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                    {dbDraftJobs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 dark:text-stone-500">
                            <Send size={24} className="mb-2 text-stone-300 dark:text-stone-600" />
                            <p className="text-[10px] uppercase font-black tracking-widest text-stone-600 dark:text-stone-300">No Staged Loads</p>
                            <p className="text-[9px] text-stone-400 dark:text-stone-500 mt-0.5 max-w-[200px]">
                                Staged replenishment manifests will appear here for final authorization.
                            </p>
                        </div>
                    ) : (
                        dbDraftJobs.map((draft) => {
                            const sourceName = sites.find(s => s.id === draft.sourceSiteId)?.name || 'Source Warehouse';
                            const destName = sites.find(s => s.id === draft.destSiteId)?.name || 'Dest Store';
                            const totalQty = (draft.lineItems || []).reduce((sum: number, item: any) => sum + (item.expectedQty || 0), 0);

                            return (
                                <div key={draft.id} className="p-3 bg-white dark:bg-[#1C2620] border border-[#E2DCCE] dark:border-white/10 rounded-2xl shadow-xs space-y-2">
                                    {/* Route Header */}
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider pb-2 border-b border-[#E2DCCE]/60 dark:border-white/5">
                                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                                            <span className="text-stone-700 dark:text-stone-300 truncate">{sourceName}</span>
                                            <ArrowRight size={10} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                                            <span className="text-stone-900 dark:text-white font-black truncate">{destName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 rounded font-mono text-[8.5px]">
                                                {totalQty} units
                                            </span>
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
                                                className="text-stone-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Manifest"
                                                aria-label="Delete Manifest"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Line Items List */}
                                    <div className="space-y-1.5">
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
                                                <div key={`${item.productId}-${idx}`} className="flex items-center justify-between text-xs bg-stone-50 dark:bg-black/30 p-2 rounded-xl border border-[#E2DCCE]/60 dark:border-white/5">
                                                    <div className="min-w-0 flex-1 pr-2">
                                                        <p className="text-stone-900 dark:text-white font-black truncate uppercase text-[9.5px] leading-tight">
                                                            {item.name}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-stone-400 font-mono text-[8px]">{item.sku}</span>
                                                            {physicalMeasure !== null && (
                                                                <span className="text-[8.5px] font-black text-amber-600 dark:text-amber-400 font-mono">
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
                                                            className="w-14 bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-lg px-1.5 py-0.5 text-center text-stone-900 dark:text-white text-[10px] font-mono font-bold focus:ring-0 focus:outline-none"
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
                                                            className="text-stone-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                                                            title="Remove Item"
                                                            aria-label="Remove Item"
                                                        >
                                                            <X size={12} />
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

                {/* Primary Authorization Bar */}
                <div className="p-3.5 border-t border-[#E2DCCE] dark:border-white/10 bg-white/90 dark:bg-[#161F1A]/90 backdrop-blur-md shrink-0">
                    <button
                        onClick={submitDistTransfers}
                        disabled={dbDraftJobs.length === 0 || distHubLoading}
                        className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-xs shadow-md active:scale-95 ${
                            dbDraftJobs.length > 0
                                ? 'bg-[#2C5E3B] hover:bg-[#234b2f] text-white shadow-[#2C5E3B]/20 cursor-pointer'
                                : 'bg-stone-200 dark:bg-white/5 text-stone-400 dark:text-stone-600 cursor-not-allowed border border-transparent'
                        }`}
                    >
                        {distHubLoading ? (
                            <RefreshCw className="animate-spin" size={15} />
                        ) : (
                            <Send size={15} />
                        )}
                        <span>{distHubLoading ? 'Deploying Transfers...' : `Authorize Deployment (${dbDraftJobs.length})`}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

