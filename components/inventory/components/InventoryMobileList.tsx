import { InventoryPriceReadiness } from './InventoryPriceReadiness';
import React from 'react';
import { Product, Site } from '../../../types';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { getInventoryValue } from '../utils/inventoryHelpers';
import { formatStockDisplay, formatPackagingDescription } from '../../../utils/units';
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

    return <div className="md:hidden space-y-3 bg-[var(--theme-bg-app)] p-3">
        {products.map(product => {
            const stock = product.stock || 0;
            const low = stock > 0 && stock < (product.minStock && product.minStock > 0 ? product.minStock : 10);
            const health = stock <= 0 ? 'Out of stock' : low ? 'Low stock' : 'In stock';
            const tone = stock <= 0 ? 'text-[var(--theme-status-error-text)] bg-[var(--theme-status-error-bg)]' : low ? 'text-[var(--theme-status-warning-text)] bg-[var(--theme-status-warning-bg)]' : 'text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)]';
            const site = sites.find(s => s.id === (product.siteId || product.site_id));
            return <article key={product.id} className={`min-w-0 rounded-2xl border bg-[var(--theme-bg-card)] p-4 ${selectedIds.has(product.id) ? 'border-[var(--theme-accent)]' : 'border-[var(--theme-border)]'}`}>
                <div className="flex items-start gap-3">
                    <label className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[var(--theme-bg-subtle)]">
                        <input type="checkbox" aria-label={`Select ${product.name}`} checked={selectedIds.has(product.id)} onChange={() => toggleSelection(product.id)} className="h-5 w-5 accent-[var(--theme-accent)]" />
                    </label>
                    <div className="min-w-0 flex-1">
                        <button type="button" onClick={() => setSelectedViewProduct(product)} className="min-h-[44px] text-left text-sm font-semibold leading-relaxed text-[var(--theme-text-primary)] break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">{formatProductDisplayName(product) || product.name}</button>
                        <p className="text-xs font-mono text-[var(--theme-text-secondary)] break-all">{product.sku}</p>
                        <p className="mt-1 text-xs text-[var(--theme-text-muted)] break-words">{product.category}</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-[var(--theme-border)] pt-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-[var(--theme-text-secondary)]">On hand</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--theme-text-primary)] break-words">{formatStockDisplay(stock, product)}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-secondary)] break-words">{formatPackagingDescription(product, stock)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{health}</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="min-w-0"><dt className="text-xs text-[var(--theme-text-secondary)]">Storage bin</dt><dd className="mt-1 break-words font-mono font-medium text-[var(--theme-text-primary)]">{product.location || 'Not assigned'}</dd><dd className="mt-0.5 break-words text-xs text-[var(--theme-text-muted)]">{site?.name || 'Facility unavailable'}</dd></div>
                    <div className="min-w-0"><dt className="text-xs text-[var(--theme-text-secondary)]">Selling price</dt><dd className="mt-1 font-medium tabular-nums text-[var(--theme-text-primary)] break-words">{product.price > 0 ? formatCompactNumber(product.price, { currency: currencySymbol }) : '—'}</dd><InventoryPriceReadiness price={product.price} /></div>
                    {showCostPrice && <div className="min-w-0"><dt className="text-xs text-[var(--theme-text-secondary)]">Unit cost</dt><dd className="mt-1 tabular-nums text-[var(--theme-text-primary)] break-words">{product.costPrice ? formatCompactNumber(product.costPrice, { currency: currencySymbol }) : '—'}</dd></div>}
                    <div className="min-w-0"><dt className="text-xs text-[var(--theme-text-secondary)]">Retail stock value</dt><dd className="mt-1 tabular-nums text-[var(--theme-text-primary)] break-words">{product.price > 0 ? formatCompactNumber(getInventoryValue(product), { currency: currencySymbol }) : '—'}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--theme-border)] pt-3">
                    <button type="button" onClick={() => setSelectedViewProduct(product)} className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-3 text-xs font-semibold text-[var(--theme-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">View details</button>
                    {!isReadOnly && <>
                        <Protected permission="ADJUST_STOCK"><button type="button" onClick={() => handleOpenAdjust(product)} className="min-h-[44px] rounded-xl bg-[var(--theme-accent)] px-3 text-xs font-semibold text-[var(--theme-btn-primary-text)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Adjust stock</button></Protected>
                        <Protected permission="EDIT_PRODUCT"><button type="button" onClick={() => handleOpenEditProduct(product)} className="min-h-[44px] rounded-xl border border-[var(--theme-border)] px-3 text-xs text-[var(--theme-text-primary)]">Edit</button><button type="button" onClick={() => handleDeleteProduct(product.id)} className="min-h-[44px] rounded-xl px-3 text-xs text-[var(--theme-status-error-text)]">Delete</button></Protected>
                    </>}
                </div>
            </article>;
        })}
    </div>;
};
