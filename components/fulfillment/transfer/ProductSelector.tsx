import React, { useState, useMemo } from 'react';
import { Search, Package, Plus, X, AlertTriangle } from 'lucide-react';
import { Product } from '../../../types';
import { getSellUnit } from '../../../utils/units';

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
    title = "Select Product"
}) => {
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
        <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Search size={16} className="text-blue-400" />
                    {title}
                </h3>
                <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors" aria-label="Close Product Selector">
                    <X size={16} />
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by Name, SKU, or Barcode..."
                    className="w-full bg-black/60 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    aria-label="Search for products"
                />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs">
                        {filteredProducts.length === 0 && search ? "No products found." : "Start typing to search..."}
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <button
                            key={product.id}
                            onClick={() => onSelect(product)}
                            className="w-full text-left p-3 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all group flex items-center justify-between"
                            aria-label={`Select ${product.name}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-gray-400">
                                    {product.image ? (
                                        <img src={product.image} alt="" className="w-full h-full object-cover rounded" />
                                    ) : (
                                        <Package size={16} />
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                        {product.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono">
                                        {product.sku}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 uppercase font-bold">Stock</div>
                                {(() => {
                                    const unitDef = getSellUnit(product.unit || '');
                                    const sizeNum = parseFloat(product.size || '0');
                                    const isWeightVol = unitDef.category === 'weight' || unitDef.category === 'volume';
                                    const displayStock = isWeightVol && sizeNum > 0 ? product.stock * sizeNum : product.stock;
                                    const unitLabel = unitDef.code !== 'UNIT' ? ` ${unitDef.shortLabel}` : '';
                                    return (
                                        <div className={`text-xs font-mono font-bold ${displayStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {displayStock.toLocaleString()}{unitLabel}
                                        </div>
                                    );
                                })()}
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="pt-2 border-t border-white/5 flex justify-end">
                <button
                    onClick={onCancel}
                    className="text-xs text-gray-500 hover:text-white"
                >
                    Cancel Selection
                </button>
            </div>
        </div>
    );
};
