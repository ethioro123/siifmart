import React from 'react';
import { AlertOctagon, ArrowRight, AlertTriangle, Plus, X } from 'lucide-react';
import { Product, Site, User } from '../../../../types';
import { ProductSelector } from '../ProductSelector';
import { getSellUnit } from '../../../../utils/units';

interface WaveDistributionAllocationsProps {
    isSearchingProduct: boolean;
    setIsSearchingProduct: (searching: boolean) => void;
    allProducts: Product[];
    products?: Product[];
    bulkDistributionSourceSite: string;
    activeSite: Site | null;
    sites: Site[];
    settings: any;
    user: User | null;
    sourceSiteObj: Site | undefined;
    waveProducts: { productId: string; allocations: { storeId: string; quantity: number }[] }[];
    setWaveProducts: (wps: { productId: string; allocations: { storeId: string; quantity: number }[] }[]) => void;
}

export const WaveDistributionAllocations: React.FC<WaveDistributionAllocationsProps> = ({
    isSearchingProduct,
    setIsSearchingProduct,
    allProducts,
    products = [],
    bulkDistributionSourceSite,
    activeSite,
    sites,
    settings,
    user,
    sourceSiteObj,
    waveProducts,
    setWaveProducts,
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
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                <AlertOctagon className="text-primary shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold text-primary text-sm">Wave Distribution Mode</h4>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">Add multiple products to build a distribution wave. Each product can have unique store allocations.</p>
                </div>
            </div>

            {isSearchingProduct ? (
                <div className="mt-2">
                    <ProductSelector
                        products={availableProducts}
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
                    className="w-full min-h-[44px] py-3 border border-dashed border-[var(--theme-border)] rounded-2xl hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 touch-manipulation"
                >
                    <Plus size={16} />
                    Add Product to Wave
                </button>
            )}

            <div className="space-y-3.5">
                {waveProducts.map((wp, idx) => {
                    const prod = availableProducts.find(p => p.id === wp.productId)
                        || products.find(p => p.id === wp.productId)
                        || allProducts.find(p => p.id === wp.productId);
                    return (
                        <div key={idx} className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                            <div className="p-3.5 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-[var(--theme-text-primary)] text-sm">{prod?.name}</div>
                                    {(() => {
                                        const sourceStockItem = availableProducts.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                            || products.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                            || allProducts.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                            || prod;
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
                                            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 tabular-nums ${isWarning ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
                                                Stock: {displayStock.toLocaleString()}{unitLabel} <ArrowRight size={10} /> Rem: {displayRemaining.toLocaleString()}{unitLabel}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <button
                                    onClick={() => {
                                        const newWp = [...waveProducts];
                                        newWp.splice(idx, 1);
                                        setWaveProducts(newWp);
                                    }}
                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-red-500 rounded-xl transition-colors touch-manipulation"
                                    aria-label={`Remove ${prod?.name} from wave`}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {wp.allocations.length === 0 ? (
                                    <div className="col-span-full p-4 text-center text-red-500 font-semibold text-xs tracking-wider flex items-center justify-center gap-2">
                                        <AlertTriangle size={16} />
                                        No stores have this warehouse configured as a replenishment source.
                                    </div>
                                ) : (
                                    wp.allocations.map(alloc => {
                                        const site = sites.find(s => s.id === alloc.storeId);
                                        return (
                                            <div key={alloc.storeId} className="flex items-center justify-between text-xs bg-[var(--theme-bg-card)] p-2.5 rounded-xl border border-[var(--theme-border)]">
                                                <span className="text-[var(--theme-text-secondary)] truncate max-w-[90px] font-medium">{site?.name}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-16 min-h-[36px] bg-transparent border-b border-[var(--theme-border)] text-right font-mono font-bold text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-primary touch-manipulation tabular-nums"
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
    );
};
