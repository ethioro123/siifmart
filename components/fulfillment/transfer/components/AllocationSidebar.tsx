import React from 'react';
import {
    Warehouse, ShoppingBag, AlertTriangle, Trash2, ArrowRight, Plus, Minus, RefreshCw, Send, Package, Sparkles, X
} from 'lucide-react';
import { formatTransferStock, getTransferQuantityConfig, toTransferMeasureQuantity } from '../transferQuantity';
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
        <div className="lg:w-[45%] xl:w-[42%] bg-[var(--theme-bg-subtle)] flex flex-col h-full overflow-hidden">
            {/* Top Section: Available Warehouse Sources */}
            <div className="flex-1 flex flex-col overflow-hidden border-b border-[var(--theme-border)]">
                <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-bg-card)] shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-6 bg-primary rounded-full shadow-xs" />
                        <div>
                            <h3 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">Source Warehouse Allocation</h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold">Select supply source to fulfill store deficit</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {!distHubSelectedSku ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[var(--theme-text-secondary)]">
                            <Package size={32} className="mb-2 opacity-40" />
                            <p className="text-xs uppercase font-bold tracking-wider text-[var(--theme-text-primary)]">Awaiting Selection</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 max-w-[220px]">
                                Click a store gap on the left to view available warehouse inventory and stage replenishment.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Selected Product Summary */}
                            <div className="p-3.5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs flex flex-col gap-1.5 shrink-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                                        <Sparkles size={12} /> Target Item
                                    </span>
                                    <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2 py-0.5 rounded-md font-mono">
                                        {distHubSelectedSku}
                                    </span>
                                </div>
                                <div className="text-xs font-bold text-[var(--theme-text-primary)] truncate">
                                    {selectedProduct?.name || 'Selected Item'}
                                </div>
                                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[var(--theme-border)] font-semibold">
                                    <span className="text-[var(--theme-text-secondary)]">Destination:</span>
                                    <span className="text-primary uppercase font-bold">
                                        {destSiteObj?.name || 'Store'}
                                    </span>
                                </div>
                            </div>

                            {/* Available Warehouse Sources List */}
                            {distHubAvailableSources.length === 0 ? (
                                <div className="p-6 bg-[var(--theme-bg-card)] border border-dashed border-red-500/20 rounded-2xl text-center">
                                    <AlertTriangle size={24} className="mx-auto text-amber-500 mb-2" />
                                    <p className="text-xs text-red-500 font-bold uppercase tracking-wider">No Available Warehouse Stock</p>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">
                                        No warehouses in the network have available stock of this SKU.
                                    </p>
                                </div>
                            ) : (
                                distHubAvailableSources.map(source => {
                                    const isWarehouse = source.site?.type === 'Warehouse' || source.site?.type === 'Distribution Center';
                                    const allocQty = distHubAllocQty[source.id] ?? Math.min(10, source.stock);
                                    const quantityConfig = getTransferQuantityConfig(source);
                                    const isCrossZone = destSiteObj && source.site && (destSiteObj.logisticsZoneId || '') !== (source.site.logisticsZoneId || '');

                                    return (
                                        <div key={source.id} className="p-3.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:border-primary/40 rounded-2xl shadow-xs transition-all">
                                            {/* Source Warehouse Header */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {isWarehouse ? <Warehouse size={14} className="text-primary" /> : <ShoppingBag size={14} className="text-amber-500" />}
                                                        <span className="text-xs font-bold text-[var(--theme-text-primary)] truncate">
                                                            {source.site?.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-0.5">
                                                        Zone: <span className="text-[var(--theme-text-primary)] font-semibold">{getZoneName(source.site?.logisticsZoneId)}</span>
                                                    </div>
                                                    {isCrossZone && settings?.enforceRegionalZoning && (
                                                        <span className="inline-flex items-center gap-1 mt-1 text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-semibold tracking-wider uppercase">
                                                            <AlertTriangle size={12} /> Cross-Zone Override
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-right shrink-0 bg-[var(--theme-bg-subtle)] px-2.5 py-1 rounded-xl border border-[var(--theme-border)]">
                                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block leading-none mb-0.5">Available</span>
                                                    <span className="text-xs font-mono font-bold text-primary tabular-nums">{formatTransferStock(source.stock, source)}</span>
                                                </div>
                                            </div>

                                            {/* Quick Fill & Stepper & Stage Action */}
                                            <div className="mt-2.5 pt-2.5 border-t border-[var(--theme-border)] flex items-center justify-between gap-2">
                                                {/* Stepper */}
                                                <div className="flex items-center bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] p-0.5 shrink-0">
                                                    <button
                                                        onClick={() => decrementQty(source.id)}
                                                        className="min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-lg transition-colors active:scale-95 touch-manipulation"
                                                        title="Decrease quantity"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step={quantityConfig.step}
                                                        className="w-12 bg-transparent text-center font-mono font-bold text-[var(--theme-text-primary)] text-xs focus:ring-0 focus:outline-none touch-manipulation tabular-nums"
                                                        value={allocQty}
                                                        aria-label={`Allocation quantity in ${quantityConfig.quantityLabel}`}
                                                        title={`Allocation quantity in ${quantityConfig.quantityLabel}`}
                                                        onChange={(e) => handleQtyChange(source.id, parseFloat(e.target.value), source.stock)}
                                                    />
                                                    <span className="px-1 text-[10px] text-[var(--theme-text-secondary)]">{quantityConfig.quantityLabel}</span>
                                                    <button
                                                        onClick={() => incrementQty(source.id, source.stock)}
                                                        className="min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-lg transition-colors active:scale-95 touch-manipulation"
                                                        title="Increase quantity"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                {/* Stage to Manifest Button */}
                                                <button
                                                    onClick={() => addToDistDraft(source, allocQty)}
                                                    disabled={distHubLoading || allocQty <= 0}
                                                    className="flex-1 min-h-[44px] py-2 px-3 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all active:scale-[0.99] shadow-xs flex items-center justify-center gap-1.5 touch-manipulation cursor-pointer"
                                                >
                                                    <Plus size={14} />
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
            <div className="h-[46%] flex flex-col bg-[var(--theme-bg-card)] overflow-hidden shrink-0">
                <div className="p-3.5 border-b border-[var(--theme-border)] flex items-center justify-between bg-[var(--theme-bg-subtle)] shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-amber-500 rounded-full shadow-xs" />
                        <div>
                            <h3 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">Staged Manifests</h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold">Review transfer loads before deployment</p>
                        </div>
                    </div>
                    {dbDraftJobs.length > 0 && (
                        <div className="px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold shrink-0">
                            {dbDraftJobs.length} {dbDraftJobs.length === 1 ? 'LOAD' : 'LOADS'}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                    {dbDraftJobs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--theme-text-secondary)]">
                            <Send size={24} className="mb-2 opacity-40" />
                            <p className="text-[11px] uppercase font-bold tracking-wider text-[var(--theme-text-primary)]">No Staged Loads</p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5 max-w-[200px]">
                                Staged replenishment manifests will appear here for final authorization.
                            </p>
                        </div>
                    ) : (
                        dbDraftJobs.map((draft) => {
                            const sourceName = sites.find(s => s.id === draft.sourceSiteId)?.name || 'Source Warehouse';
                            const destName = sites.find(s => s.id === draft.destSiteId)?.name || 'Dest Store';
                            const totalQty = (draft.lineItems || []).reduce((sum: number, item: any) => sum + (item.expectedQty || 0), 0);

                            return (
                                <div key={draft.id} className="p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl shadow-xs space-y-2">
                                    {/* Route Header */}
                                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider pb-2 border-b border-[var(--theme-border)]">
                                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                                            <span className="text-[var(--theme-text-secondary)] truncate">{sourceName}</span>
                                            <ArrowRight size={12} className="text-primary shrink-0" />
                                            <span className="text-[var(--theme-text-primary)] font-bold truncate">{destName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="px-2 py-0.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] rounded-md font-mono text-[11px] tabular-nums">
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
                                                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-red-500 p-1 hover:bg-red-500/10 rounded-lg transition-colors touch-manipulation"
                                                title="Delete Manifest"
                                                aria-label="Delete Manifest"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Line Items List */}
                                    <div className="space-y-1.5">
                                        {(draft.lineItems || []).map((item: any, idx: number) => {
                                            const product = allProducts.find(p => p.id === item.productId || p.sku === item.sku);
                                            const resolvedSize = product?.size || allProducts.find(p => p.sku === item.sku && p.size && parseFloat(p.size) > 0)?.size;
                                            const transferProduct = { ...product, ...item, size: resolvedSize };
                                            const itemConfig = getTransferQuantityConfig(transferProduct);
                                            const isWeightVol = itemConfig.unit.category === 'weight' || itemConfig.unit.category === 'volume';
                                            const physicalMeasure = isWeightVol
                                                ? (item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : toTransferMeasureQuantity(item.expectedQty, transferProduct))
                                                : null;

                                            return (
                                                <div key={`${item.productId}-${idx}`} className="flex items-center justify-between text-xs bg-[var(--theme-bg-card)] p-2 rounded-xl border border-[var(--theme-border)]">
                                                    <div className="min-w-0 flex-1 pr-2">
                                                        <p className="text-[var(--theme-text-primary)] font-semibold truncate uppercase text-[11px] leading-tight">
                                                            {item.name}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[var(--theme-text-secondary)] font-mono text-[11px]">{item.sku}</span>
                                                            {physicalMeasure !== null && (
                                                                <span className="text-[11px] font-bold text-amber-500 font-mono">
                                                                    ({physicalMeasure} {itemConfig.unit.shortLabel})
                                                                </span>
                              )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <input
                                                            type="number"
                                                            min={itemConfig.step}
                                                            step={itemConfig.step}
                                                            className="w-16 min-h-[36px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg px-1.5 py-0.5 text-center text-[var(--theme-text-primary)] text-xs font-mono font-bold focus:border-primary focus:outline-none touch-manipulation tabular-nums"
                                                            value={item.expectedQty}
                                                            aria-label={`Replenish quantity in ${itemConfig.quantityLabel}`}
                                                            title={`Replenish quantity in ${itemConfig.quantityLabel}`}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (!isNaN(val) && val > 0) {
                                                                    updateDraftItemQty(draft.id, idx, val);
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => removeDraftItem(draft.id, idx)}
                                                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-red-500 p-1 rounded-lg transition-colors touch-manipulation"
                                                            title="Remove Item"
                                                            aria-label="Remove Item"
                                                        >
                                                            <X size={14} />
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
                <div className="p-3.5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shrink-0">
                    <button
                        onClick={submitDistTransfers}
                        disabled={dbDraftJobs.length === 0 || distHubLoading}
                        className={`w-full min-h-[44px] py-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-xs shadow-xs touch-manipulation ${
                            dbDraftJobs.length > 0
                                ? 'bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] cursor-pointer active:scale-[0.99]'
                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] opacity-50 cursor-not-allowed border border-[var(--theme-border)]'
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
