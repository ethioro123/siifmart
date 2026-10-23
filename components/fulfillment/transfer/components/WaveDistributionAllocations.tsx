import { StoreAllocationEditor } from './StoreAllocationEditor';
import { eligibleDistributionStores } from '../../../../utils/distributionStores';
import React from 'react';
import { AlertOctagon, ArrowRight, AlertTriangle, Plus, X } from 'lucide-react';
import { Product, Site, User } from '../../../../types';
import { ProductSelector } from '../ProductSelector';
import { formatTransferStock, getTransferQuantityConfig, normalizeTransferEntry } from '../transferQuantity';

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
        const seen = new Set<string>();
        return [...allProducts, ...products].filter(p => {
            if ((p.siteId || p.site_id) !== actualSourceSite || p.stock <= 0 || seen.has(p.id)) return false;
            seen.add(p.id); return true;
        });
    }, [actualSourceSite, products, allProducts]);

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
                        products={availableProducts.filter(p => !waveProducts.some(row => row.productId === p.id))}
                        onSelect={(product) => {
                            setWaveProducts([...waveProducts, {
                                productId: product.id,
                                allocations: []
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
                            <div className="p-3.5 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] flex flex-wrap justify-between items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-[var(--theme-text-primary)] text-sm">{prod?.name}</div>
                                    {(() => {
                                        const sourceStockItem = ((prod?.siteId || prod?.site_id) === actualSourceSite ? prod : undefined) || availableProducts.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                            || products.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                            || allProducts.find(p => p.sku === prod?.sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
                                            || prod;
                                        const rawStock = sourceStockItem?.stock || 0;
                                        const unitProduct = sourceStockItem || prod;
                                        const totalAllocated = wp.allocations.reduce((acc, curr) => acc + curr.quantity, 0);
                                        const displayRemaining = rawStock - totalAllocated;
                                        const isWarning = displayRemaining < 0;
                                        return (
                                            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 tabular-nums ${isWarning ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
                                                Stock: {formatTransferStock(rawStock, unitProduct)} <ArrowRight size={10} /> Rem: {formatTransferStock(displayRemaining, unitProduct)}
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
                            <StoreAllocationEditor stores={eligibleDistributionStores(sites, sourceSiteObj, !!settings?.enforceRegionalZoning, user?.role)} allocations={wp.allocations} product={prod} onChange={allocations => setWaveProducts(waveProducts.map((row, rowIndex) => rowIndex === idx ? { ...row, allocations } : row))} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
