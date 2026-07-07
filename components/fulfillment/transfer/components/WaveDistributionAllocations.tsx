import React from 'react';
import { AlertOctagon, X } from 'lucide-react';
import { Product, Site, User } from '../../../../types';
import { ProductSelector } from '../ProductSelector';
import { getSellUnit } from '../../../../utils/units';

interface WaveDistributionAllocationsProps {
    isSearchingProduct: boolean;
    setIsSearchingProduct: (searching: boolean) => void;
    allProducts: Product[];
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
    bulkDistributionSourceSite,
    activeSite,
    sites,
    settings,
    user,
    sourceSiteObj,
    waveProducts,
    setWaveProducts,
}) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#2C5E3B]/10 border border-[#2C5E3B]/20 rounded-xl p-4 flex items-start gap-3">
                <AlertOctagon className="text-[#A9CBA2] shrink-0" size={20} />
                <div>
                    <h4 className="font-bold text-[#A9CBA2] text-sm">Wave Distribution Mode</h4>
                    <p className="text-xs text-[#A9CBA2]/80 mt-1">Add multiple products to build a distribution wave. Each product can have unique store allocations.</p>
                </div>
            </div>

            {isSearchingProduct ? (
                <div className="mt-2">
                    <ProductSelector
                        products={allProducts}
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
                    className="w-full py-3 border border-dashed border-white/20 rounded-xl hover:bg-white/5 hover:border-white/40 text-gray-400 hover:text-white transition-all text-sm font-bold"
                >
                    + Add Product to Wave
                </button>
            )}

            <div className="space-y-4">
                {waveProducts.map((wp, idx) => {
                    const prod = allProducts.find(p => p.id === wp.productId);
                    return (
                        <div key={idx} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-3 bg-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-white text-sm">{prod?.name}</div>
                                    {(() => {
                                        const sourceStockItem = allProducts.find(p => p.sku === prod?.sku && p.siteId === bulkDistributionSourceSite);
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
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${isWarning ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                                Stock: {displayStock.toLocaleString()}{unitLabel} ➔ Rem: {displayRemaining.toLocaleString()}{unitLabel}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <button onClick={() => {
                                    const newWp = [...waveProducts];
                                    newWp.splice(idx, 1);
                                    setWaveProducts(newWp);
                                }} className="text-red-400 hover:text-red-300" aria-label={`Remove ${prod?.name} from wave`}><X size={16} /></button>
                            </div>
                            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {wp.allocations.length === 0 ? (
                                    <div className="col-span-full p-4 text-center text-red-400 font-bold text-[10px] uppercase tracking-wider">
                                        ⚠️ No stores have this warehouse configured as a replenishment source.
                                    </div>
                                ) : (
                                    wp.allocations.map(alloc => {
                                        const site = sites.find(s => s.id === alloc.storeId);
                                        return (
                                            <div key={alloc.storeId} className="flex items-center justify-between text-xs bg-black/40 p-2 rounded">
                                                <span className="text-gray-400 truncate max-w-[80px]">{site?.name}</span>
                                                <input
                                                    type="number"
                                                    className="w-12 bg-transparent border-b border-white/20 text-right text-white focus:outline-none focus:border-blue-500"
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
