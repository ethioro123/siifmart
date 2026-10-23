import { InventoryPriceReadiness } from './InventoryPriceReadiness';
import React from 'react';
import {
    ArrowUpDown, CheckCircle, Package, RefreshCw, Edit, Trash2, Eye
} from 'lucide-react';
import { Product, Site } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { getABCClass, getInventoryValue, LocationDropdown } from '../utils/inventoryHelpers';
import { getSellUnit, formatStockDisplay, formatPackagingDescription } from '../../../utils/units';
import { CompactLocationDisplay } from '../../ProductLocationDisplay';
import { Protected } from '../../Protected';
import { useStore } from '../../../contexts/CentralStore';
import { canViewCostPrice } from '../../../utils/roles';
import { formatProductDisplayName } from '../../procurement/utils';

interface InventoryDesktopTableProps {
    products: Product[];
    selectedIds: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
    handleSort: (key: string) => void;
    sites: Site[];
    activeSite: Site | null;
    isReadOnly: boolean;
    totalInventoryValue: number;
    getOtherLocationsForSku: (sku: string, id: string, siteId?: string) => any;
    toggleSelection: (id: string) => void;
    handleOpenAdjust: (product: Product) => void;
    handleOpenEditProduct: (product: Product) => void;
    handleDeleteProduct: (id: string) => void;
    setSelectedViewProduct: (product: Product | null) => void;
    currencySymbol?: string;
}

export const InventoryDesktopTable: React.FC<InventoryDesktopTableProps> = ({
    products,
    selectedIds,
    setSelectedIds,
    sortConfig,
    handleSort,
    sites,
    activeSite,
    isReadOnly,
    totalInventoryValue,
    getOtherLocationsForSku,
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
        <table className="w-full text-left border-collapse hidden md:table">
            <thead className="sticky top-0 bg-[var(--theme-bg-subtle)] z-10 border-b border-[var(--theme-border)]">
                <tr className="bg-[var(--theme-bg-subtle)]">
                    <th className="py-3 px-3.5 w-10">
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                aria-label="Select All"
                                className="peer appearance-none w-4 h-4 border border-[var(--theme-border)] rounded-md bg-[var(--theme-bg-card)] checked:bg-[var(--theme-accent)] checked:border-[var(--theme-accent)] transition-all cursor-pointer"
                                onChange={() => {
                                    if (selectedIds.size === products.length) setSelectedIds(new Set());
                                    else setSelectedIds(new Set(products.map(i => i.id)));
                                }}
                                checked={selectedIds.size === products.length && products.length > 0}
                            />
                            <CheckCircle size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    </th>

                    <th className="py-3 px-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors group select-none" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1.5">
                            Product
                            <div className={`p-1 rounded-md transition-colors ${sortConfig?.key === 'name' ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-secondary)]'}`}>
                                <ArrowUpDown size={11} className={sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="py-3 px-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors group select-none" onClick={() => handleSort('location')}>
                        <div className="flex items-center gap-1.5">
                            Location
                            <div className={`p-1 rounded-md transition-colors ${sortConfig?.key === 'location' ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-secondary)]'}`}>
                                <ArrowUpDown size={11} className={sortConfig?.key === 'location' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="py-3 px-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors group select-none" onClick={() => handleSort('stock')}>
                        <div className="flex items-center justify-center gap-1.5">
                            Stock
                            <div className={`p-1 rounded-md transition-colors ${sortConfig?.key === 'stock' ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-secondary)]'}`}>
                                <ArrowUpDown size={11} className={sortConfig?.key === 'stock' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>

                    <th className="py-3 px-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors group select-none" onClick={() => handleSort('price')}>
                        <div className="flex items-center justify-end gap-1.5">
                            Selling price
                            <div className={`p-1 rounded-md transition-colors ${sortConfig?.key === 'price' ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-secondary)]'}`}>
                                <ArrowUpDown size={11} className={sortConfig?.key === 'price' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    {showCostPrice && (
                        <th className="py-3 px-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors group select-none" onClick={() => handleSort('costPrice')}>
                            <div className="flex items-center justify-end gap-1.5">
                                Cost
                                <div className={`p-1 rounded-md transition-colors ${sortConfig?.key === 'costPrice' ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-secondary)]'}`}>
                                    <ArrowUpDown size={11} className={sortConfig?.key === 'costPrice' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                                </div>
                            </div>
                        </th>
                    )}
                    <th className="py-3 px-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors group select-none" onClick={() => handleSort('assetValue')}>
                        <div className="flex items-center justify-end gap-1.5">
                            Total Value
                            <div className={`p-1 rounded-md transition-colors ${sortConfig?.key === 'assetValue' ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-secondary)]'}`}>
                                <ArrowUpDown size={11} className={sortConfig?.key === 'assetValue' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="py-3 px-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-center cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors group select-none" onClick={() => handleSort('abc')}>
                        <div className="flex items-center justify-center gap-1.5">
                            Class
                            <div className={`p-1 rounded-md transition-colors ${sortConfig?.key === 'abc' ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-secondary)]'}`}>
                                <ArrowUpDown size={11} className={sortConfig?.key === 'abc' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="py-3 px-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right cursor-pointer hover:text-[var(--theme-text-primary)] transition-colors group select-none" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center justify-end gap-1.5">
                            Date
                            <div className={`p-1 rounded-md transition-colors ${sortConfig?.key === 'createdAt' ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-secondary)]'}`}>
                                <ArrowUpDown size={11} className={sortConfig?.key === 'createdAt' && sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
                            </div>
                        </div>
                    </th>
                    <th className="py-3 px-3.5 text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider text-right w-24">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--theme-border)]">
                {products.map((product) => {
                    const abc = getABCClass(product, totalInventoryValue);
                    const isSelected = selectedIds.has(product.id);
                    const stockVal = product.stock || 0;
                    const threshold = product.minStock !== undefined && product.minStock !== null && product.minStock > 0 ? product.minStock : 10;
                    const isOutOfStock = stockVal <= 0;
                    const isLowStock = stockVal < threshold;
                    const stockColor = isOutOfStock
                        ? 'bg-[#FF3B30]/10 text-[var(--theme-status-error-text)] border-[#FF3B30]/25'
                        : isLowStock
                        ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[#FF9F0A]/25'
                        : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[#34C759]/25';
                    const packDesc = formatPackagingDescription(product, stockVal);

                    return (
                        <tr
                            key={product.id}
                            onClick={() => setSelectedViewProduct(product)}
                            className={`group hover:bg-[var(--theme-bg-subtle)] transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-[var(--theme-bg-subtle)]' : ''}`}
                        >
                            {/* Checkbox */}
                            <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        aria-label="Select row"
                                        className="peer appearance-none w-4 h-4 border border-[var(--theme-border)] rounded-md bg-[var(--theme-bg-card)] checked:bg-[var(--theme-accent)] checked:border-[var(--theme-accent)] transition-all cursor-pointer"
                                        checked={isSelected}
                                        onChange={() => toggleSelection(product.id)}
                                    />
                                    <CheckCircle size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                            </td>

                            {/* Product Name & SKU */}
                            <td className="py-4 px-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs group-hover:border-[var(--theme-accent)]/40 transition-colors">
                                        {product.image && !product.image.includes('placeholder.com') ? (
                                            <img
                                                src={product.image}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-[var(--theme-text-muted)]"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                                }}
                                            />
                                        ) : (
                                            <Package size={18} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-accent)] transition-colors" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-[var(--theme-text-primary)] leading-relaxed tracking-tight group-hover:text-[var(--theme-accent)] transition-colors duration-150 break-words max-w-[280px]">
                                            {formatProductDisplayName(product) || product.name}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                            <span className="text-[11px] font-semibold font-mono text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] px-1.5 py-0.5 rounded border border-[var(--theme-status-success-border)] tracking-tight">
                                                {product.sku}
                                            </span>
                                            <span className="text-[11px] text-[var(--theme-text-muted)] font-medium truncate max-w-[140px]">
                                                {product.category}
                                            </span>
                                            <InventoryPriceReadiness price={product.price} />
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* Location */}
                            <td className="py-4 px-4">
                                {(!activeSite || isReadOnly) ? (
                                    (() => {
                                        const site = sites.find(s => s.id === product.siteId || s.id === (product as any).site_id);
                                        const otherLocs = getOtherLocationsForSku(product.sku, product.id, product.siteId || (product as any).site_id);

                                        if (site) {
                                            return (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-semibold text-[var(--theme-accent)] uppercase tracking-wider flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)]" />
                                                        {site.name}
                                                    </span>
                                                    {otherLocs.count > 0 && (
                                                        <div className="ml-3">
                                                            <LocationDropdown count={otherLocs.count} details={otherLocs.details} sites={sites} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } else {
                                            return product.location ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <CompactLocationDisplay product={product} sites={sites} />
                                                    {otherLocs.count > 0 && (
                                                        <LocationDropdown count={otherLocs.count} details={otherLocs.details} sites={sites} />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-[var(--theme-text-muted)] font-medium italic">Unmapped</span>
                                            );
                                        }
                                    })()
                                ) : (
                                    (() => {
                                        const otherLocs = getOtherLocationsForSku(product.sku, product.id, product.siteId || (product as any).site_id);
                                        return product.location ? (
                                            <div className="flex flex-col gap-0.5">
                                                <CompactLocationDisplay product={product} sites={sites} />
                                                {otherLocs.count > 0 && (
                                                    <LocationDropdown count={otherLocs.count} details={otherLocs.details} sites={sites} />
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[11px] font-medium text-[var(--theme-status-error-text)] bg-[#FF3B30]/10 px-2 py-0.5 rounded border border-[#FF3B30]/20">Not assigned</span>
                                        );
                                    })()
                                )}
                            </td>

                            {/* Stock Level */}
                            <td className="py-4 px-4 text-center">
                                <div className="min-w-[150px] max-w-[220px] space-y-1.5 text-left">
                                    <p className="text-base font-semibold tabular-nums text-[var(--theme-text-primary)]">{formatStockDisplay(stockVal, product)}</p>
                                    {packDesc && <p className="text-xs leading-relaxed text-[var(--theme-text-secondary)] break-words">{packDesc}</p>}
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${stockColor}`}>{isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock' : 'In stock'}</span>
                                </div>
                            </td>

                            {/* Retail Price */}
                            <td className="py-4 px-4 text-right">
                                <span className="text-sm font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums group-hover:text-[var(--theme-accent)] transition-colors">
                                    {product.price && product.price > 0 ? formatCompactNumber(product.price, { currency: currencySymbol }) : '—'}
                                    {product.unit && product.price > 0 && getSellUnit(product.unit).code !== 'UNIT' && (
                                        <span className="text-xs text-[var(--theme-text-muted)] font-normal ml-0.5">/{getSellUnit(product.unit).shortLabel}</span>
                                    )}
                                </span>
                            </td>

                            {/* Cost Price (privileged) */}
                            {showCostPrice && (
                                <td className="py-4 px-4 text-right">
                                    <span className="text-sm font-medium text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                        {product.costPrice && product.costPrice > 0 ? formatCompactNumber(product.costPrice, { currency: currencySymbol }) : '—'}
                                        {product.costPrice !== undefined && product.costPrice !== null && product.costPrice > 0 && getSellUnit(product.unit || '').code !== 'UNIT' && (
                                            <span className="text-xs text-[var(--theme-text-muted)] font-normal ml-0.5">/{getSellUnit(product.unit || '').shortLabel}</span>
                                        )}
                                    </span>
                                </td>
                            )}

                            {/* Total Inventory Value */}
                            <td className="py-4 px-4 text-right">
                                <span className="text-sm font-bold text-[var(--theme-status-success-text)] font-mono tabular-nums">
                                    {product.price && product.price > 0 ? formatCompactNumber(getInventoryValue(product), { currency: currencySymbol }) : '—'}
                                </span>
                            </td>

                            {/* Class */}
                            <td className="py-4 px-4 text-center">
                                <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold border transition-all ${
                                    abc === 'A' ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[#34C759]/30' :
                                    abc === 'B' ? 'bg-[#2997FF]/10 text-[#2997FF] border-[#2997FF]/30' :
                                    'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                }`}>
                                    {abc}
                                </div>
                            </td>

                            {/* Date Added */}
                            <td className="py-4 px-4 text-right">
                                <span className="text-xs font-mono text-[var(--theme-text-muted)] tabular-nums">
                                    {(() => {
                                        const dateVal = product.createdAt || (product as any).created_at;
                                        if (!dateVal) return '—';
                                        return new Date(dateVal).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        });
                                    })()}
                                </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-100" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => setSelectedViewProduct(product)}
                                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-[var(--theme-accent)]/10 hover:text-[var(--theme-accent)] text-[var(--theme-text-muted)] rounded-lg transition-colors cursor-pointer"
                                        aria-label="View Product Details" title="View Product Details"
                                    >
                                        <Eye size={14} />
                                    </button>
                                    {!isReadOnly && (
                                        <Protected permission="EDIT_PRODUCT">
                                            <div className="flex items-center gap-1">
                                                <Protected permission="ADJUST_STOCK">
                                                    <button
                                                        onClick={() => handleOpenAdjust(product)}
                                                        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-[var(--theme-bg-card-hover)] hover:text-[var(--theme-text-primary)] text-[var(--theme-text-muted)] rounded-lg transition-colors cursor-pointer"
                                                        aria-label="Adjust Stock" title="Adjust Stock"
                                                    >
                                                        <RefreshCw size={14} />
                                                    </button>
                                                </Protected>
                                                <button
                                                    onClick={() => handleOpenEditProduct(product)}
                                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-[var(--theme-accent)]/10 hover:text-[var(--theme-accent)] text-[var(--theme-text-muted)] rounded-lg transition-colors cursor-pointer"
                                                    aria-label="Edit Product" title="Edit Product"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-[#FF3B30]/10 hover:text-[var(--theme-status-error-text)] text-[var(--theme-text-muted)] rounded-lg transition-colors cursor-pointer"
                                                    aria-label="Delete Product" title="Delete Product"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </Protected>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
