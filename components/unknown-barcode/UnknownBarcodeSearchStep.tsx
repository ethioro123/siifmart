import React from 'react';
import { Search, Loader2, Link as LinkIcon } from 'lucide-react';
import { Product, User } from '../../types';

interface UnknownBarcodeSearchStepProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    filteredProducts: Product[];
    selectedProduct: Product | null;
    setSelectedProduct: (p: Product) => void;
    user: User | null;
    isUploading: boolean;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onBack: () => void;
    onConfirmMap: () => void;
}

export const UnknownBarcodeSearchStep: React.FC<UnknownBarcodeSearchStepProps> = ({
    searchTerm,
    setSearchTerm,
    filteredProducts,
    selectedProduct,
    setSelectedProduct,
    user,
    isUploading,
    searchInputRef,
    onKeyDown,
    onBack,
    onConfirmMap
}) => {
    return (
        <div className="space-y-4">
            <p className="text-[#1E3F27] dark:text-gray-300 text-sm">
                Search for the existing product name or SKU to link this barcode to.
            </p>

            <div className="relative">
                <Search className="absolute left-3 top-3 text-[#4D6E56] dark:text-gray-500" size={18} />
                <input
                    ref={searchInputRef as any}
                    type="text"
                    placeholder="Search product name or SKU..."
                    aria-label="Search products"
                    className="w-full bg-white dark:bg-black/50 border border-[#E2DCCE] dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-[#1E3F27] dark:text-white focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:outline-none transition-colors"
                    value={searchTerm || ''}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={onKeyDown}
                    autoFocus
                />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredProducts.map(product => {
                    const isLocalStock = product.siteId === user?.siteId || product.site_id === user?.siteId;
                    return (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => setSelectedProduct(product)}
                            className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${selectedProduct?.id === product.id
                                ? 'bg-[#2C5E3B]/10 border-[#2C5E3B] dark:border-[#A9CBA2] text-[#2C5E3B] dark:text-[#A9CBA2]'
                                : 'bg-white dark:bg-black/25 border border-[#E2DCCE] dark:border-white/5 text-stone-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#18201B]/40 hover:border-[#2C5E3B]/30'
                                }`}
                        >
                            <div className="font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{product.name}</div>
                            <div className="text-xs text-[#4D6E56] dark:text-gray-400 flex justify-between items-center mt-1">
                                <span className="font-mono">{product.sku}</span>
                                <div className="flex items-center gap-2">
                                    {isLocalStock ? (
                                        <span className="px-2 py-0.5 bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] rounded text-[10px] font-bold">Store: {product.stock}</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded text-[10px] font-bold">Global: {product.stock}</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
                {searchTerm && filteredProducts.length === 0 && (
                    <div className="text-center text-[#4D6E56] dark:text-gray-400 font-medium py-4">No products found</div>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DCCE] dark:border-white/5">
                {selectedProduct ? (
                    <div className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-semibold truncate max-w-[200px]">
                        Linking to: <b>{selectedProduct.name}</b>
                    </div>
                ) : <div />}
                
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-stone-700 hover:text-[#2C5E3B] dark:text-gray-300 dark:hover:text-white font-bold text-sm transition-colors cursor-pointer"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmMap}
                        disabled={!selectedProduct || isUploading}
                        className="px-6 py-2.5 bg-gradient-to-br from-[#224429] to-[#2C5E3B] text-white hover:opacity-90 font-bold rounded-xl disabled:bg-stone-200 dark:disabled:bg-white/5 disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md disabled:shadow-none cursor-pointer text-xs uppercase tracking-wider"
                    >
                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <LinkIcon size={16} />}
                        Map Barcode
                    </button>
                </div>
            </div>
        </div>
    );
};
