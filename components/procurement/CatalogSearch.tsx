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
        <div className="space-y-2">
            <label className="text-[10px] text-[#2C5E3B]/70 dark:text-[#A9CBA2]/70 uppercase tracking-widest font-black ml-1 block">Search Product</label>
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                    type="text"
                    className={`w-full bg-white dark:bg-black/40 border ${errors.search ? 'border-red-500/50' : 'border-gray-200 dark:border-white/10'} rounded-lg pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-2 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 outline-none placeholder-gray-400 dark:placeholder-gray-700 font-bold transition-colors shadow-sm`}
                    placeholder="Type to search product..."
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
                {errors.search && <span className="absolute right-3 top-3.5 text-[10px] text-red-500 font-black">{errors.search}</span>}
                {isSearchOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/20 rounded-lg shadow-2xl max-h-60 overflow-y-auto ring-1 ring-black/5 dark:ring-white/10">
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
                                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer flex justify-between items-center group border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-900 dark:text-white group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors font-black">{p.name}</span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-tight">{p.sku || 'No SKU'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-black">Stock: {p.stock}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-500 text-center italic font-bold">No products found matching "{searchTerm}"</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
