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
            <label className="text-[10px] text-stone-500 dark:text-gray-400 uppercase tracking-wider font-bold ml-1 block">Search Product Catalog</label>
            <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                    type="text"
                    className={`w-full bg-[#FAF8F5] dark:bg-black/30 border ${errors.search ? 'border-red-500/50' : 'border-[#E2DCCE] dark:border-white/10'} rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] outline-none placeholder:text-stone-400 font-bold transition-colors`}
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
                {errors.search && <span className="absolute right-3.5 top-2.5 text-[10px] text-red-500 font-bold">{errors.search}</span>}
                {isSearchOpen && (
                    <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#18201B] border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-1">
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
                                    className="px-3.5 py-2.5 hover:bg-[#FAF8F5] dark:hover:bg-white/5 rounded-xl cursor-pointer flex justify-between items-center group transition-colors"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs text-[#1E3F27] dark:text-white font-bold group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">{p.name}</span>
                                        <span className="text-[10px] text-stone-400 font-mono uppercase">{p.sku || 'No SKU'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded-md font-bold">Stock: {p.stock}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-stone-400 text-center italic">No catalog products found matching "{searchTerm}"</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
