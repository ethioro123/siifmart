import React from 'react';
import { Search, ArrowRight, AlertTriangle } from 'lucide-react';
import { Product, Site, User } from '../../../../types';
import { ProductSelector } from '../ProductSelector';
import { formatTransferStock, getTransferQuantityConfig, normalizeTransferEntry } from '../transferQuantity';

interface SingleProductAllocationProps {
    isSearchingProduct: boolean;
    setIsSearchingProduct: (searching: boolean) => void;
    allProducts: Product[];
    products: Product[];
    bulkDistributionProductId: string;
    setBulkDistributionProductId: (productId: string) => void;
    bulkDistributionSourceSite: string;
    activeSite: Site | null;
    sites: Site[];
    settings: any;
    user: User | null;
    sourceSiteObj: Site | undefined;
    bulkDistributionAllocations: { storeId: string; quantity: number }[];
    setBulkDistributionAllocations: (allocs: { storeId: string; quantity: number }[]) => void;
}

export const SingleProductAllocation: React.FC<SingleProductAllocationProps> = ({
    isSearchingProduct,
    setIsSearchingProduct,
    allProducts,
    products,
    bulkDistributionProductId,
    setBulkDistributionProductId,
    bulkDistributionSourceSite,
    activeSite,
    sites,
    settings,
    user,
    sourceSiteObj,
    bulkDistributionAllocations,
    setBulkDistributionAllocations,
}) => {
    const actualSourceSite = bulkDistributionSourceSite || activeSite?.id;
    const availableProducts = React.useMemo(() => {
        const seen = new Set<string>();
        return [...allProducts, ...products].filter(p => {
            if ((p.siteId || p.site_id) !== actualSourceSite || p.stock <= 0 || seen.has(p.id)) return false;
            seen.add(p.id); return true;
        });
    }, [actualSourceSite, products, allProducts]);

    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div>
                <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">Select Product to Distribute</label>
                {isSearchingProduct ? (
                    <div className="mt-2">
                        <ProductSelector
                            products={availableProducts}
                            onSelect={(product) => {
                                setBulkDistributionProductId(product.id);
                                const warehouseId = bulkDistributionSourceSite || activeSite?.id;
                                const stores = sites.filter(s => {
                                    if (s.type !== 'Store' || s.country !== sourceSiteObj?.country || s.id === actualSourceSite) return false;

                                    if (settings?.enforceRegionalZoning) {
                                        if (user?.role !== 'group_ceo' && sourceSiteObj) {
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
                    <button type="button" onClick={() => setIsSearchingProduct(true)} className="w-full text-left focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] rounded-xl">
                        <div className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--theme-text-primary)] flex flex-wrap justify-between items-center gap-3 hover:border-primary transition-colors touch-manipulation">
                            <span>
                                {bulkDistributionProductId
                                    ? (availableProducts.find(p => p.id === bulkDistributionProductId)?.name || products.find(p => p.id === bulkDistributionProductId)?.name || allProducts.find(p => p.id === bulkDistributionProductId)?.name)
                                    : "Select Product to Distribute..."}
                            </span>
                            <Search size={16} className="text-[var(--theme-text-secondary)]" />
                        </div>
                    </button>
                )}
            </div>

            {bulkDistributionProductId && (
                <div className="bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] overflow-hidden shadow-xs">
                    <div className="p-3.5 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] font-semibold text-xs text-[var(--theme-text-primary)] uppercase tracking-wider flex flex-wrap justify-between items-center gap-3">
                        <span>Store Allocation</span>
                        <div className="flex items-center gap-3">
                            {(() => {
                                const prod = availableProducts.find(p => p.id === bulkDistributionProductId)
                                    || products.find(p => p.id === bulkDistributionProductId)
                                    || allProducts.find(p => p.id === bulkDistributionProductId);
                                const sourceStockItem = ((prod?.siteId || prod?.site_id) === actualSourceSite ? prod : undefined) || availableProducts.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                    || products.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                    || allProducts.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                    || prod;
                                const rawStock = sourceStockItem?.stock || 0;
                                const unitProduct = sourceStockItem || prod;
                                const unitConfig = getTransferQuantityConfig(unitProduct);
                                const totalAllocated = bulkDistributionAllocations.reduce((acc, curr) => acc + curr.quantity, 0);
                                const displayRemaining = rawStock - totalAllocated;
                                const isWarning = displayRemaining < 0;
                                return (
                                    <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 tabular-nums ${isWarning ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
                                        Stock: {formatTransferStock(rawStock, unitProduct)} <ArrowRight size={10} /> Rem: {formatTransferStock(displayRemaining, unitProduct)}
                                    </span>
                                );
                            })()}
                            <span className="text-[var(--theme-text-secondary)] font-mono text-[11px]">Total: {bulkDistributionAllocations.reduce((acc, curr) => acc + curr.quantity, 0)} {(() => { const p = availableProducts.find(item => item.id === bulkDistributionProductId) || products.find(item => item.id === bulkDistributionProductId) || allProducts.find(item => item.id === bulkDistributionProductId); return getTransferQuantityConfig(p).quantityLabel; })()}</span>
                        </div>
                    </div>
                    <div className="divide-y divide-[var(--theme-border)] max-h-[300px] overflow-y-auto custom-scrollbar">
                        {bulkDistributionAllocations.length === 0 ? (
                            <div className="p-6 text-center text-red-500 font-semibold text-xs tracking-wider flex items-center justify-center gap-2">
                                <AlertTriangle size={16} />
                                No stores have this warehouse configured as a replenishment source.
                            </div>
                        ) : (
                            bulkDistributionAllocations.map(alloc => {
                                const site = sites.find(s => s.id === alloc.storeId);
                                const selectedProduct = availableProducts.find(p => p.id === bulkDistributionProductId)
                                    || products.find(p => p.id === bulkDistributionProductId)
                                    || allProducts.find(p => p.id === bulkDistributionProductId);
                                const sourceProduct = ((selectedProduct?.siteId || selectedProduct?.site_id) === actualSourceSite ? selectedProduct : undefined) || availableProducts.find(p => p.sku === selectedProduct?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                    || products.find(p => p.sku === selectedProduct?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                    || allProducts.find(p => p.sku === selectedProduct?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                    || selectedProduct;
                                const unitConfig = getTransferQuantityConfig(sourceProduct);
                                return (
                                    <div key={alloc.storeId} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--theme-bg-card)] transition-colors">
                                        <span className="min-w-0 flex-1 break-words text-sm font-medium text-[var(--theme-text-primary)]">{site?.name} <span className="text-[11px] text-[var(--theme-text-secondary)]">({unitConfig.quantityLabel})</span></span>
                                        <input
                                            type="number" inputMode="decimal"
                                            min="0"
                                            step={unitConfig.step}
                                            value={alloc.quantity}
                                            onChange={(e) => {
                                                const newAllocs = bulkDistributionAllocations.map(a => a.storeId === alloc.storeId ? { ...a, quantity: normalizeTransferEntry(e.target.value, sourceProduct) } : a);
                                                setBulkDistributionAllocations(newAllocs);
                                            }}
                                            className="w-24 shrink-0 min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-right font-mono font-bold text-sm text-[var(--theme-text-primary)] focus:border-primary focus:outline-none touch-manipulation tabular-nums"
                                            aria-label={`Quantity in ${unitConfig.quantityLabel} for ${site?.name}`}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
