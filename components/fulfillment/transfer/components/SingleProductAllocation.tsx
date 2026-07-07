import React from 'react';
import { Search } from 'lucide-react';
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
    return (
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
    );
};
