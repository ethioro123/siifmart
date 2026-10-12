import React from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Product } from '../../../../types';
import { ProductSelector } from '../ProductSelector';
import { getSellUnit } from '../../../../utils/units';

interface TransferItemsSectionProps {
    t: (key: string) => string;
    transferItems: Array<{ productId: string; quantity: number; isMeasure?: boolean }>;
    setTransferItems: React.Dispatch<React.SetStateAction<Array<{ productId: string; quantity: number; isMeasure?: boolean }>>>;
    availableProducts: Product[];
    allProducts: Product[];
    products: Product[];
    actualSourceSite: string;
    isSearchingProduct: boolean;
    setIsSearchingProduct: (searching: boolean) => void;
    isLoadingProducts?: boolean;
    addNotification: (type: any, message: string) => void;
}

export const TransferItemsSection: React.FC<TransferItemsSectionProps> = ({
    t,
    transferItems,
    setTransferItems,
    availableProducts,
    allProducts,
    products,
    actualSourceSite,
    isSearchingProduct,
    setIsSearchingProduct,
    isLoadingProducts,
    addNotification,
}) => {
    // Helper to find product from all available pools
    const findProduct = (productId: string): Product | undefined => {
        return (
            availableProducts.find(p => p.id === productId) ||
            products.find(p => p.id === productId) ||
            allProducts.find(p => p.id === productId)
        );
    };

    // Helper to find stock at source site
    const findSourceStock = (sku?: string): Product | undefined => {
        if (!sku) return undefined;
        return (
            availableProducts.find(p => p.sku === sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite)) ||
            products.find(p => p.sku === sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite)) ||
            allProducts.find(p => p.sku === sku && (p.siteId === actualSourceSite || (p as any).site_id === actualSourceSite))
        );
    };

    return (
        <div>
            <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2">
                {t('warehouse.putaway.itemsToPutaway')}
            </label>
            <div className="bg-[var(--theme-bg-subtle)] rounded-2xl p-4 border border-[var(--theme-border)] space-y-3">
                {transferItems.map((item, idx) => {
                    const prod = findProduct(item.productId);
                    const sourceStockItem = findSourceStock(prod?.sku) || prod;
                    const rawStock = sourceStockItem?.stock || 0;
                    const unitDef = getSellUnit(sourceStockItem?.unit || prod?.unit || '');
                    const sizeStr = sourceStockItem?.size || prod?.size;
                    const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && !!sizeStr;
                    const displayStock = rawStock;
                    const deduction = item.quantity;
                    const displayRemaining = displayStock - deduction;
                    const unitLabel = isWeightVol
                        ? ` packs (${sizeStr}${unitDef.shortLabel})`
                        : unitDef.code !== 'UNIT'
                        ? ` ${unitDef.shortLabel}`
                        : '';
                    const isWarning = displayRemaining < 0;

                    return (
                        <div key={idx} className="flex items-center gap-3 bg-[var(--theme-bg-card)] p-3 rounded-xl border border-[var(--theme-border)]">
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-[var(--theme-text-primary)] mb-0.5 truncate">
                                    {prod?.name || 'Unknown Item'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded border border-[var(--theme-border)]">
                                        {prod?.sku}
                                    </span>
                                    <span
                                        className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1 tabular-nums ${
                                            isWarning
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                        }`}
                                    >
                                        Source: {displayStock.toLocaleString()}{unitLabel} <ArrowRight size={10} /> Rem:{' '}
                                        {displayRemaining.toLocaleString()}{unitLabel}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-[var(--theme-text-secondary)]">Qty:</span>
                                <div className="flex gap-1">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const newItems = [...transferItems];
                                            newItems[idx].quantity = parseFloat(e.target.value) || 1;
                                            setTransferItems(newItems);
                                        }}
                                        className="w-16 min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 py-1 text-sm text-[var(--theme-text-primary)] text-center font-mono font-bold focus:border-primary focus:outline-none touch-manipulation tabular-nums"
                                        aria-label={`Quantity for ${prod?.name || 'item'}`}
                                    />
                                    {isWeightVol && (
                                        <select
                                            value={item.isMeasure ? 'measure' : 'units'}
                                            onChange={(e) => {
                                                const newItems = [...transferItems];
                                                newItems[idx].isMeasure = e.target.value === 'measure';
                                                setTransferItems(newItems);
                                            }}
                                            className="min-h-[44px] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-2 py-1 text-[11px] font-semibold uppercase text-[var(--theme-text-primary)] focus:border-primary focus:outline-none ml-1 cursor-pointer hover:bg-[var(--theme-bg-card)] transition-colors touch-manipulation"
                                            aria-label="Select unit format"
                                        >
                                            <option value="units">Units</option>
                                            <option value="measure">{unitDef.shortLabel}</option>
                                        </select>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        const newItems = [...transferItems];
                                        newItems.splice(idx, 1);
                                        setTransferItems(newItems);
                                    }}
                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors touch-manipulation"
                                    aria-label="Remove Item"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {isSearchingProduct ? (
                    <div className="mt-4">
                        <ProductSelector
                            products={availableProducts}
                            title={isLoadingProducts ? `${t('warehouse.selectItem')} (Loading...)` : undefined}
                            onSelect={(product) => {
                                const existingIdx = transferItems.findIndex(i => i.productId === product.id);
                                if (existingIdx >= 0) {
                                    const newItems = [...transferItems];
                                    newItems[existingIdx].quantity += 1;
                                    setTransferItems(newItems);
                                    addNotification('success', `Increased ${product.name} quantity to ${newItems[existingIdx].quantity}`);
                                } else {
                                    setTransferItems([...transferItems, { productId: product.id, quantity: 1 }]);
                                    addNotification('success', `Added ${product.name} to request`);
                                }
                            }}
                            onCancel={() => setIsSearchingProduct(false)}
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => setIsSearchingProduct(true)}
                        className="w-full min-h-[44px] py-3 border border-dashed border-[var(--theme-border)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-primary hover:bg-[var(--theme-bg-card)] transition-all flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-wider touch-manipulation"
                    >
                        <Plus size={16} /> {t('warehouse.addTransferItem')}
                    </button>
                )}
            </div>
        </div>
    );
};
