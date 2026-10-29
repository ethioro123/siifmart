import React, { useState, useMemo } from 'react';
import { Search, Package, X } from 'lucide-react';
import { Product } from '../../../types';
import { formatStockDisplay, formatProductSize, formatPackagingDescription } from '../../../utils/units';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProductSelectorProps {
    products: Product[];
    onSelect: (product: Product) => void;
    onCancel: () => void;
    title?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
    products,
    onSelect,
    onCancel,
    title
}) => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');

    const filteredProducts = useMemo(() => {
        if (!search) return products.slice(0, 10); // Show first 10 by default

        const term = search.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            (p.barcode && p.barcode.toLowerCase().includes(term))
        ).slice(0, 20); // Limit results for performance
    }, [products, search]);

    return (
        <div className="space-y-3 bg-[var(--theme-bg-subtle)] p-4 rounded-2xl border border-[var(--theme-border)] shadow-xs">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                    <Search size={16} className="text-primary" />
                    {title || t('warehouse.selectItem')}
                </h3>
                <button
                    onClick={onCancel}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors touch-manipulation"
                    aria-label="Close Product Selector"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`${t('warehouse.misc.scanBarcodeOrEnterSKU')}`}
                    className="w-full min-h-[44px] bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl pl-10 pr-4 py-2 text-sm text-[var(--theme-text-primary)] focus:outline-none focus:border-primary touch-manipulation"
                    aria-label="Search for products"
                />
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-[var(--theme-text-secondary)] text-xs">
                        {search ? "No products found." : "Start typing to search..."}
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <button
                            key={product.id}
                            onClick={() => onSelect(product)}
                            className="w-full min-h-[44px] text-left p-3 hover:bg-[var(--theme-bg-card)] rounded-xl border border-transparent hover:border-[var(--theme-border)] transition-all group flex items-center justify-between touch-manipulation"
                            aria-label={`Select ${product.name}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] shrink-0">
                                    {product.image ? (
                                        <img src={product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <Package size={16} />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-[var(--theme-text-primary)] group-hover:text-primary transition-colors truncate">
                                        {product.name}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                            {product.sku}
                                        </span>
                                        {formatProductSize(product) && (
                                            <span className="text-[11px] font-mono text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)] px-1.5 py-0.5 rounded border border-[var(--theme-status-success-border)]">
                                                {formatProductSize(product)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                                <div className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold">Stock</div>
                                {(() => {
                                    const displayStock = product.stock || 0;
                                    const packDesc = formatPackagingDescription(product, displayStock);
                                    return (
                                        <div className={`text-xs font-mono font-bold tabular-nums ${displayStock > 0 ? 'text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'text-[var(--theme-status-danger-text)]'}`}>
                                            <div>{formatStockDisplay(displayStock, product)}</div>
                                            {packDesc && (
                                                <div className="text-[11px] text-[var(--theme-text-secondary)] font-sans font-normal">
                                                    {packDesc}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="pt-2 border-t border-[var(--theme-border)] flex justify-end">
                <button
                    onClick={onCancel}
                    className="min-h-[44px] px-3 text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold transition-colors touch-manipulation"
                >
                    {t('warehouse.dismiss')}
                </button>
            </div>
        </div>
    );
};
