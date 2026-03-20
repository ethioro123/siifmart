import React, { useState, useMemo } from 'react';
import Modal from '../../components/Modal';
import { Product, Supplier } from '../../types';
import { Package, Search, Plus, Star } from 'lucide-react'; // Added Star if needed, checked usage
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { CURRENCY_SYMBOL } from '../../constants';

interface ProductCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
    onAddToPO: (product: Product) => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({ isOpen, onClose, supplier, onAddToPO }) => {
    const { products, allProducts } = useData();
    const { showToast } = useStore();
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogCategory, setCatalogCategory] = useState('All');
    const [catalogSort, setCatalogSort] = useState<'name' | 'priceAsc' | 'priceDesc' | 'stockAsc'>('name');
    const [catalogStockFilter, setCatalogStockFilter] = useState<'all' | 'low' | 'out'>('all');

    const filteredCatalogProducts = useMemo(() => {
        // Ensure products is available
        let filtered = products || [];

        // 1. Filter by Supplier (currently just generic matching as per original code note)

        // 2. Search
        if (catalogSearch.trim()) {
            const q = catalogSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q))
            );
        }

        // 3. Category
        if (catalogCategory !== 'All') {
            filtered = filtered.filter(p => p.category === catalogCategory);
        }

        // 4. Stock Filter
        if (catalogStockFilter === 'low') {
            filtered = filtered.filter(p => (p.stock || 0) <= (p.minStock || 10) && (p.stock || 0) > 0);
        } else if (catalogStockFilter === 'out') {
            filtered = filtered.filter(p => (p.stock || 0) === 0);
        }

        // 5. Sort
        return [...filtered].sort((a, b) => { // Create copy to avoid mutating original if sort mutates (JS sort usually mutates)
            switch (catalogSort) {
                case 'priceAsc': return a.price - b.price;
                case 'priceDesc': return b.price - a.price;
                case 'stockAsc': return (a.stock || 0) - (b.stock || 0);
                case 'name': default: return a.name.localeCompare(b.name);
            }
        });
    }, [products, catalogSearch, catalogCategory, catalogSort, catalogStockFilter]);

    const catalogCategories = useMemo(() => {
        if (!allProducts) return ['All'];
        const cats = new Set(allProducts.map(p => p.category || 'Uncategorized'));
        return ['All', ...Array.from(cats)].sort();
    }, [allProducts]);

    if (!supplier) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Products from ${supplier.name || 'Supplier'}`} size="xl">
            <div className="space-y-4">
                {/* Header Banner */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="text-blue-400" size={20} />
                        <h3 className="text-white font-bold">Supplier Product Catalog</h3>
                    </div>
                    <p className="text-xs text-gray-400">
                        Products available from {supplier.name}.
                    </p>
                </div>

                {/* 🔍 Search & Filter Bar */}
                <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search products by name or SKU..."
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-primary/50 transition-colors"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Category Chips (Horizontal Scroll) */}
                        <div className="flex-1 overflow-x-auto pb-2 -mb-2 no-scrollbar">
                            <div className="flex gap-2">
                                {catalogCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCatalogCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${catalogCategory === cat
                                            ? 'bg-cyber-primary text-black'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Controls Right */}
                        <div className="flex gap-2 shrink-0">
                            {/* Sort */}
                            <select
                                aria-label="Sort by"
                                value={catalogSort}
                                onChange={(e) => setCatalogSort(e.target.value as any)}
                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyber-primary/50"
                            >
                                <option value="name">Name (A-Z)</option>
                                <option value="priceAsc">Price (Low-High)</option>
                                <option value="priceDesc">Price (High-Low)</option>
                                <option value="stockAsc">Stock (Low-High)</option>
                            </select>

                            {/* Stock Filter */}
                            <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'low', label: 'Low' },
                                    { id: 'out', label: 'Out' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setCatalogStockFilter(opt.id as any)}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${catalogStockFilter === opt.id
                                            ? 'bg-cyber-primary/20 text-cyber-primary shadow-sm'
                                            : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredCatalogProducts.map(product => (
                        <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyber-primary/50 transition-colors group">
                            <div className="flex items-start gap-3">
                                {product.image && !product.image.includes('placeholder.com') ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-16 h-16 rounded-lg object-cover bg-black/20"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-16 h-16 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package text-gray-600"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                        }}
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-black/30 flex items-center justify-center flex-shrink-0">
                                        <Package size={24} className="text-gray-600" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-white font-bold text-sm truncate pr-2 group-hover:text-cyber-primary transition-colors">{product.name}</h4>
                                        {/* Stock Badge */}
                                        {(product.stock || 0) <= (product.minStock || 10) && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${(product.stock || 0) === 0 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {(product.stock || 0) === 0 ? 'Out' : 'Low'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">SKU: {product.sku || product.id}</p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">Retail</span>
                                            <span className="text-white font-bold text-sm">{CURRENCY_SYMBOL} {product.price.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold border-l border-white/10 pl-4">Base Cost</span>
                                            <span className="text-cyber-primary font-bold text-sm">
                                                {CURRENCY_SYMBOL} {(product.costPrice || (product.price * 0.7)).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 border-l border-white/10 pl-4">
                                            Stock: {product.stock || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    onAddToPO(product);
                                    showToast(`Add "${product.name}" to your purchase order`, 'info');
                                }}
                                className="w-full mt-3 py-2 bg-cyber-primary/10 hover:bg-cyber-primary text-cyber-primary hover:text-black text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={14} />
                                Add to PO
                            </button>
                        </div>
                    ))}
                </div>

                {filteredCatalogProducts.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <Package size={48} className="mx-auto mb-4 opacity-50 text-gray-600" />
                        <p className="text-sm font-bold text-gray-400">No products found</p>
                        <p className="text-xs mt-1">Try adjusting your filters or search terms</p>
                        <button
                            onClick={() => {
                                setCatalogSearch('');
                                setCatalogCategory('All');
                                setCatalogStockFilter('all');
                            }}
                            className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white border border-white/10 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
