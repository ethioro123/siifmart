import React from 'react';
import { Search, ArrowRight, AlertTriangle } from 'lucide-react';
import { Product, Site, User } from '../../../../types';
import { ProductSelector } from '../ProductSelector';
import { getSellUnit } from '../../../../utils/units';

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
        if (actualSourceSite === activeSite?.id && products.length > 0) return products;
        const siteSpecific = allProducts.filter(p => (p.siteId || (p as any).site_id) === actualSourceSite);
        if (siteSpecific.length > 0) return siteSpecific;
        return products.length > 0 ? products : allProducts;
    }, [actualSourceSite, activeSite?.id, products, allProducts]);

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
                        <div className="w-full min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--theme-text-primary)] flex justify-between items-center hover:border-primary transition-colors touch-manipulation">
                            <span>
                                {bulkDistributionProductId
                                    ? (availableProducts.find(p => p.id === bulkDistributionProductId)?.name || products.find(p => p.id === bulkDistributionProductId)?.name || allProducts.find(p => p.id === bulkDistributionProductId)?.name)
                                    : "Select Product to Distribute..."}
                            </span>
                            <Search size={16} className="text-[var(--theme-text-secondary)]" />
                        </div>
                    </div>
                )}
            </div>

            {bulkDistributionProductId && (
                <div className="bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] overflow-hidden shadow-xs">
                    <div className="p-3.5 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] font-semibold text-xs text-[var(--theme-text-primary)] uppercase tracking-wider flex justify-between items-center">
                        <span>Store Allocation</span>
                        <div className="flex items-center gap-3">
                            {(() => {
                                const prod = availableProducts.find(p => p.id === bulkDistributionProductId)
                                    || products.find(p => p.id === bulkDistributionProductId)
                                    || allProducts.find(p => p.id === bulkDistributionProductId);
                                const sourceStockItem = availableProducts.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                    || products.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                    || allProducts.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                    || prod;
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
                                    <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 tabular-nums ${isWarning ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
                                        Stock: {displayStock.toLocaleString()}{unitLabel} <ArrowRight size={10} /> Rem: {displayRemaining.toLocaleString()}{unitLabel}
                                    </span>
                                );
                            })()}
                            <span className="text-[var(--theme-text-secondary)] font-mono text-[11px]">Total: {bulkDistributionAllocations.reduce((acc, curr) => acc + curr.quantity, 0)} Units</span>
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
                                return (
                                    <div key={alloc.storeId} className="p-3.5 flex items-center justify-between hover:bg-[var(--theme-bg-card)] transition-colors">
                                        <span className="text-sm font-medium text-[var(--theme-text-primary)]">{site?.name}</span>
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
                                            className="w-24 min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-1.5 text-right font-mono font-bold text-sm text-[var(--theme-text-primary)] focus:border-primary focus:outline-none touch-manipulation tabular-nums"
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
    );
};
