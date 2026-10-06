import React from 'react';
import { Search } from 'lucide-react';
import { Product } from '../../types';

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
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const CatalogSearch: React.FC<CatalogSearchProps> = ({
    products, searchTerm, setSearchTerm,
    isSearchOpen, setIsSearchOpen,
    currentProductToAdd, setCurrentProductToAdd,
    setCurrentCost, setCurrentRetailPrice, setCustomItemUnit,
    errors, setErrors,
}) => {
    const filteredProducts = searchTerm
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : products.slice(0, 50);

    return (
        <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-semibold ml-1 block">
                Search Product Catalog
            </label>
            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                <input
                    type="text"
                    className={`w-full h-11 bg-[var(--theme-bg-subtle)] border ${errors.search ? 'border-rose-500/50' : 'border-[var(--theme-border)]'} rounded-full pl-10 pr-4 text-xs text-[var(--theme-text-primary)] focus:border-[var(--theme-accent)] outline-none placeholder:text-[var(--theme-text-secondary)]/70 font-semibold transition-all`}
                    placeholder="Type product name, brand, or SKU to search catalog..."
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
                {errors.search && <span className="absolute right-3.5 top-3 text-[10px] text-rose-500 font-bold">{errors.search}</span>}
                {isSearchOpen && (
                    <div className="absolute z-50 w-full mt-1.5 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-1.5">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setCurrentProductToAdd(p.id);
                                        setSearchTerm(p.name);
                                        setIsSearchOpen(false);
                                        if (p.costPrice) setCurrentCost(p.costPrice);
                                        if (p.price) setCurrentRetailPrice(p.price);
                                        if (p.unit) setCustomItemUnit(p.unit);
                                    }}
                                    className="px-3.5 py-2.5 hover:bg-[var(--theme-bg-subtle)] rounded-xl cursor-pointer flex justify-between items-center group transition-colors"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs text-[var(--theme-text-primary)] font-semibold group-hover:text-[var(--theme-accent)] transition-colors">{p.name}</span>
                                        <span className="text-[10px] text-[var(--theme-text-secondary)] font-mono font-semibold uppercase">{p.sku || 'No SKU'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full font-mono font-semibold">Stock: {p.stock}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-[var(--theme-text-secondary)] font-medium text-center italic">No catalog products found matching "{searchTerm}"</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
