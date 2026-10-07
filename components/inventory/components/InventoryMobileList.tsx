import React from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { Product, Site } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { getABCClass, getInventoryValue } from '../utils/inventoryHelpers';
import { getSellUnit, formatStockDisplay, formatProductSize, formatPackagingDescription } from '../../../utils/units';
import { useStore } from '../../../contexts/CentralStore';
import { canViewCostPrice } from '../../../utils/roles';
import { Protected } from '../../Protected';
import { formatProductDisplayName } from '../../procurement/utils';

interface InventoryMobileListProps {
    products: Product[];
    selectedIds: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    sites: Site[];
    activeSite: Site | null;
    isReadOnly: boolean;
    totalInventoryValue: number;
    toggleSelection: (id: string) => void;
    handleOpenAdjust: (product: Product) => void;
    handleOpenEditProduct: (product: Product) => void;
    handleDeleteProduct: (id: string) => void;
    setSelectedViewProduct: (product: Product | null) => void;
    currencySymbol?: string;
}

export const InventoryMobileList: React.FC<InventoryMobileListProps> = ({
    products,
    selectedIds,
    setSelectedIds,
    sites,
    activeSite,
    isReadOnly,
    totalInventoryValue,
    toggleSelection,
    handleOpenAdjust,
    handleOpenEditProduct,
    handleDeleteProduct,
    setSelectedViewProduct,
    currencySymbol = CURRENCY_SYMBOL
}) => {
    const { user } = useStore();
    const showCostPrice = canViewCostPrice(user?.role);

    return (

        <div className="block md:hidden divide-y divide-[var(--theme-border)]">
            {products.map((product) => {
                const abc = getABCClass(product, totalInventoryValue);
                const isSelected = selectedIds.has(product.id);
                const stockVal = product.stock || 0;
                const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                const isOutOfStock = stockVal <= 0;
                const isLowStock = stockVal < threshold;
                const colorClasses = isOutOfStock
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                    : isLowStock
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30';

                return (
                    <div
                        key={product.id}
                        onClick={() => setSelectedViewProduct(product)}
                        className={`p-4 space-y-4 hover:bg-[var(--theme-bg-subtle)] transition-all cursor-pointer ${isSelected ? 'bg-[var(--theme-pill-bg)]' : ''}`}
                    >
                        {/* Top Row: Select, Name, SKU, Image */}
                        <div className="flex items-start gap-3">
                            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        aria-label="Select row"
                                        className="peer appearance-none w-4 h-4 border border-[var(--theme-border)] rounded bg-[var(--theme-bg-subtle)] checked:bg-[var(--theme-primary)] checked:border-[var(--theme-primary)] transition-all cursor-pointer"
                                        checked={isSelected}
                                        onChange={() => toggleSelection(product.id)}
                                    />
                                    <CheckCircle size={10} className="absolute text-[var(--theme-primary-text)] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {product.image && !product.image.includes('placeholder.com') ? (
                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={20} className="text-[var(--theme-text-secondary)]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate uppercase">
                                    {formatProductDisplayName(product) || product.name}
                                </p>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                    <span className="text-[8px] font-bold font-mono text-[var(--theme-text-primary)] bg-[var(--theme-pill-bg)] border border-[var(--theme-pill-border)] px-1.5 py-0.5 rounded">
                                        {product.sku}
                                    </span>
                                    <span className="text-[8px] font-medium text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-1.5 py-0.5 rounded">
                                        {product.category}
                                    </span>
                                    {formatProductSize(product) && (
                                        <span className="text-[8px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                            {formatProductSize(product)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Status Badge */}
                            <div className={`flex flex-col items-end text-[10px] font-bold font-mono px-2 py-1 rounded-lg ${colorClasses}`}>
                                <span>{formatStockDisplay(stockVal, product)}</span>
                                {formatPackagingDescription(product, stockVal) && (
                                    <span className="text-[8px] font-sans font-medium text-[var(--theme-text-secondary)]">
                                        {formatPackagingDescription(product, stockVal)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Middle details: Location, Price, Total Value */}
                        <div className={`grid ${showCostPrice ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-left bg-[var(--theme-bg-subtle)] p-3 rounded-xl border border-[var(--theme-border)]`}>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[8px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">Location</span>
                                {(() => {
                                    const site = sites.find(s => s.id === product.siteId || s.id === (product as any).site_id);
                                    return (
                                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium truncate mt-0.5">
                                            {site ? site.name : product.location || 'No Loc'}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">Price</span>
                                <span className="text-[10px] text-[var(--theme-text-primary)] font-mono font-semibold mt-0.5">
                                    {product.price && product.price > 0 ? formatCompactNumber(product.price, { currency: currencySymbol }) : '—'}
                                </span>
                            </div>
                            {showCostPrice && (
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">Cost</span>
                                    <span className="text-[10px] text-[var(--theme-text-primary)] font-mono font-semibold mt-0.5">
                                        {product.costPrice && product.costPrice > 0 ? formatCompactNumber(product.costPrice, { currency: currencySymbol }) : '—'}
                                    </span>
                                </div>
                            )}
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] text-[var(--theme-text-muted)] font-medium uppercase tracking-wider">Value</span>
                                <span className="text-[10px] text-[var(--theme-text-primary)] font-mono font-semibold mt-0.5">
                                    {product.price && product.price > 0 ? formatCompactNumber(getInventoryValue(product), { currency: currencySymbol }) : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Bottom row: Actions & date */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-[var(--theme-text-muted)] font-mono">
                                {(() => {
                                    const dateVal = product.createdAt || (product as any).created_at;
                                    if (!dateVal) return '--';
                                    return new Date(dateVal).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric'
                                    });
                                })()}
                            </span>
                            {!isReadOnly && (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Protected permission="ADJUST_STOCK">
                                        <button
                                            onClick={() => handleOpenAdjust(product)}
                                            className="px-2.5 py-1 text-[10px] font-medium bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-lg transition-all"
                                        >
                                            Adjust
                                        </button>
                                    </Protected>
                                    <Protected permission="EDIT_PRODUCT">
                                        <button
                                            onClick={() => handleOpenEditProduct(product)}
                                            className="px-2.5 py-1 text-[10px] font-medium bg-[var(--theme-accent-muted)] hover:opacity-80 text-[var(--theme-accent)] rounded-lg transition-all"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="px-2.5 py-1 text-[10px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                        >
                                            Delete
                                        </button>
                                    </Protected>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
export default InventoryMobileList;
