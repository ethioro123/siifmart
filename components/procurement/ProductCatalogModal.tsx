import React, { useState, useMemo } from 'react';
import Modal from '../../components/Modal';
import { Product, Supplier } from '../../types';
import { Package, Search, Plus } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { getCountryProfile } from '../../utils/localization';

interface ProductCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: Supplier | null;
    onAddToPO: (product: Product) => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({ isOpen, onClose, supplier, onAddToPO }) => {
    const { products, allProducts, settings, effectiveCountry } = useData();
    const { showToast } = useStore();
    const currencySymbol = getCountryProfile(effectiveCountry || settings?.country || 'ET').currencySymbol;
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogCategory, setCatalogCategory] = useState('All');
    const [catalogSort, setCatalogSort] = useState<'name' | 'priceAsc' | 'priceDesc' | 'stockAsc'>('name');
    const [catalogStockFilter, setCatalogStockFilter] = useState<'all' | 'low' | 'out'>('all');

    const filteredCatalogProducts = useMemo(() => {
        let filtered = products || [];

        // Search
        if (catalogSearch.trim()) {
            const q = catalogSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q))
            );
        }

        // Category
        if (catalogCategory !== 'All') {
            filtered = filtered.filter(p => p.category === catalogCategory);
        }

        // Stock Filter
        if (catalogStockFilter === 'low') {
            filtered = filtered.filter(p => (p.stock || 0) <= (p.minStock || 10) && (p.stock || 0) > 0);
        } else if (catalogStockFilter === 'out') {
            filtered = filtered.filter(p => (p.stock || 0) === 0);
        }

        // Sort
        return [...filtered].sort((a, b) => {
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
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] shrink-0">
                        <Package size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">Supplier Master Catalog</h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium mt-0.5">
                            Active SKUs available from {supplier.name}. Select items to attach directly to your purchase order.
                        </p>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" size={16} />
                        <input
                            type="text"
                            placeholder="Search products by title, brand, or SKU..."
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)]/70 focus:outline-none focus:border-[var(--theme-accent)] transition-all font-medium"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                        {/* Category Chips */}
                        <div className="flex-1 overflow-x-auto pb-1 no-scrollbar">
                            <div className="flex gap-1.5">
                                {catalogCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCatalogCategory(cat)}
                                        className={`h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                            catalogCategory === cat
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Controls Right */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Sort */}
                            <select
                                aria-label="Sort by"
                                value={catalogSort}
                                onChange={(e) => setCatalogSort(e.target.value as any)}
                                className="h-8 px-3 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs text-[var(--theme-text-primary)] font-semibold focus:outline-none focus:border-[var(--theme-accent)] cursor-pointer"
                            >
                                <option value="name" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Name (A-Z)</option>
                                <option value="priceAsc" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Price (Low-High)</option>
                                <option value="priceDesc" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Price (High-Low)</option>
                                <option value="stockAsc" className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)]">Stock (Low-High)</option>
                            </select>

                            {/* Stock Filter */}
                            <div className="flex bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full p-0.5">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'low', label: 'Low' },
                                    { id: 'out', label: 'Out' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setCatalogStockFilter(opt.id as any)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                            catalogStockFilter === opt.id
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm'
                                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                    {filteredCatalogProducts.map(product => (
                        <div key={product.id} className="p-4 rounded-2xl bg-[var(--theme-bg-subtle)]/60 border border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50 transition-all flex flex-col justify-between group">
                            <div className="flex items-start gap-3">
                                {product.image && !product.image.includes('placeholder.com') ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-14 h-14 rounded-xl object-cover bg-black/20 shrink-0"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] flex items-center justify-center shrink-0 text-[var(--theme-text-secondary)]">
                                        <Package size={22} strokeWidth={1.5} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-1">
                                        <h4 className="text-[var(--theme-text-primary)] font-bold text-xs truncate pr-1 group-hover:text-[var(--theme-accent)] transition-colors">{product.name}</h4>
                                        {(product.stock || 0) <= (product.minStock || 10) && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0 ${
                                                (product.stock || 0) === 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            }`}>
                                                {(product.stock || 0) === 0 ? 'Out' : 'Low'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-mono text-[var(--theme-text-secondary)] mt-0.5">SKU: {product.sku || product.id}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                                         <div className="flex items-center gap-1 font-mono">
                                             <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold">Retail</span>
                                             <span className="text-[var(--theme-text-primary)] font-bold tabular-nums">{currencySymbol} {product.price.toLocaleString()}</span>
                                         </div>
                                         <div className="flex items-center gap-1 font-mono border-l border-[var(--theme-border)] pl-3">
                                             <span className="text-[10px] text-[var(--theme-text-secondary)] uppercase font-semibold">Cost</span>
                                             <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                                                 {currencySymbol} {(product.costPrice || (product.price * 0.7)).toLocaleString()}
                                             </span>
                                         </div>
                                         <div className="text-[10px] text-[var(--theme-text-secondary)] font-mono border-l border-[var(--theme-border)] pl-3">
                                             Stock: <span className="text-[var(--theme-text-primary)] font-bold tabular-nums">{product.stock || 0}</span>
                                         </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    onAddToPO(product);
                                    showToast(`Added "${product.name}" to PO`, 'info');
                                }}
                                className="w-full mt-3 h-9 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold text-xs rounded-full transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Plus size={14} strokeWidth={2} /> Add to Order
                            </button>
                        </div>
                    ))}
                </div>

                {filteredCatalogProducts.length === 0 && (
                    <div className="text-center py-16 text-[var(--theme-text-secondary)] rounded-2xl bg-[var(--theme-bg-subtle)] border border-dashed border-[var(--theme-border)]">
                        <Package size={36} className="mx-auto mb-3 opacity-30 text-[var(--theme-text-secondary)]" strokeWidth={1.5} />
                        <p className="text-xs font-semibold text-[var(--theme-text-primary)]">No products match your filter</p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1">Try adjusting your search query or reset filter selections</p>
                        <button
                            onClick={() => {
                                setCatalogSearch('');
                                setCatalogCategory('All');
                                setCatalogStockFilter('all');
                            }}
                            className="mt-3.5 h-8 px-4 rounded-full bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] hover:bg-[var(--theme-border)]/40 transition-colors cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
