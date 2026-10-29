import React from 'react';
import { Search } from 'lucide-react';
import { Product } from '../../types';
import { formatProductDisplayName } from './utils';
import { formatStockDisplay } from '../../utils/units';
import { resolveSmartProductAttributes } from '../../utils/groceryAttributes';
import { SmartProductAttributeStrip } from '../SmartProductAttributeStrip';

interface CatalogSearchProps {
    products: Product[];
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    isSearchOpen: boolean;
    setIsSearchOpen: (v: boolean) => void;
    currentProductToAdd: string;
    setCurrentProductToAdd: (v: string) => void;
    setCurrentCost: (v: number) => void;
    setCurrentRetailPrice: (v: number) => void;
    setCustomItemUnit: (v: string) => void;
    onSelectProduct?: (p: Product) => void;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const CatalogSearch: React.FC<CatalogSearchProps> = ({
    products, searchTerm, setSearchTerm,
    isSearchOpen, setIsSearchOpen,
    currentProductToAdd, setCurrentProductToAdd,
    setCurrentCost, setCurrentRetailPrice, setCustomItemUnit,
    onSelectProduct,
    errors, setErrors,
}) => {
    const filteredProducts = searchTerm
        ? products.filter(p => {
            const q = searchTerm.toLowerCase();
            const smart = resolveSmartProductAttributes(p);
            return (
                p.name.toLowerCase().includes(q) ||
                Boolean(p.sku && p.sku.toLowerCase().includes(q)) ||
                Boolean(smart.brand && smart.brand.toLowerCase().includes(q)) ||
                Boolean(p.category && p.category.toLowerCase().includes(q)) ||
                Boolean(smart.subcategory && smart.subcategory.toLowerCase().includes(q)) ||
                Boolean(smart.netContent && smart.netContent.toLowerCase().includes(q)) ||
                Boolean(smart.packBadge && smart.packBadge.toLowerCase().includes(q))
            );
        })
        : products.slice(0, 50);

    const selectedCatalogItem = currentProductToAdd
        ? products.find(p => p.id === currentProductToAdd)
        : undefined;

    return (
        <div className="space-y-1.5">
            <label className="text-[11px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold ml-1 block">
                Search Product Catalog
            </label>
            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                <input
                    type="text"
                    className={`w-full h-11 bg-[var(--theme-bg-subtle)] border ${errors.search ? 'border-[var(--theme-status-danger-border)]' : 'border-[var(--theme-border)]'} rounded-full pl-10 pr-4 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[var(--theme-text-muted)] font-semibold transition-all`}
                    placeholder="Type product name, brand, size, pack, or SKU..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsSearchOpen(true);
                        if (!e.target.value) setCurrentProductToAdd('');
                        if (errors.search) setErrors(prev => ({ ...prev, search: '' }));
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onBlur={() => setIsSearchOpen(false)}
                />
                {errors.search && <span className="absolute right-3.5 top-3 text-[11px] text-[var(--theme-status-danger-text)] font-bold">{errors.search}</span>}
                {isSearchOpen && (
                    <div className="absolute z-50 w-full mt-1.5 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl shadow-2xl max-h-72 overflow-y-auto p-1.5">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(p => {
                                const smart = resolveSmartProductAttributes(p);
                                return (
                                    <div
                                        key={p.id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setCurrentProductToAdd(p.id);
                                            setSearchTerm(formatProductDisplayName(p) || p.name);
                                            setIsSearchOpen(false);
                                            setCurrentCost(p.costPrice || 0);
                                            setCurrentRetailPrice(Math.round(p.price || 0));
                                            setCustomItemUnit(p.unit || '');
                                            onSelectProduct?.(p);
                                        }}
                                        className="px-3.5 py-2.5 hover:bg-[var(--theme-bg-subtle)] rounded-xl cursor-pointer flex justify-between items-start gap-3 group transition-colors"
                                    >
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-xs text-[var(--theme-text-primary)] font-semibold group-hover:text-[var(--theme-accent)] transition-colors truncate">
                                                {formatProductDisplayName(p) || p.name}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono font-semibold uppercase">
                                                    {p.sku || 'No SKU'}
                                                </span>
                                                <span className="text-[11px] text-[var(--theme-text-muted)]">·</span>
                                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium truncate">
                                                    {smart.subcategory ? `${p.category} › ${smart.subcategory}` : p.category}
                                                </span>
                                            </div>
                                            <SmartProductAttributeStrip
                                                item={p}
                                                maxPills={4}
                                                showDomainSpecs={true}
                                                showUnitPrice={false}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 gap-1">
                                            <span className="text-[11px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full font-mono font-semibold">
                                                Stock: {formatStockDisplay(p.stock || 0, p)}
                                            </span>
                                            {smart.stockBreakdown && (
                                                <span className="text-[11px] text-[var(--theme-text-muted)] font-mono">
                                                    {smart.stockBreakdown}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-3 text-xs text-[var(--theme-text-secondary)] font-medium text-center italic">No catalog products found matching "{searchTerm}"</div>
                        )}
                    </div>
                )}
            </div>
            {selectedCatalogItem && !isSearchOpen && (
                <SmartProductAttributeStrip
                    item={selectedCatalogItem}
                    maxPills={6}
                    showDomainSpecs={true}
                    showUnitPrice={true}
                    className="pt-1 pl-1"
                />
            )}
        </div>
    );
};

