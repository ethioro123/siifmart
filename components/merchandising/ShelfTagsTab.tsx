import React, { useState, useMemo } from 'react';
import {
    Printer, CheckCircle2, AlertTriangle, Search, Filter, Tag,
    Layers, ScanLine, Eye, ShieldCheck, RefreshCw, X, ArrowRight
} from 'lucide-react';
import { useMerchandising } from './MerchandisingContext';
import type { Product } from '../../types';
import { generateShelfTagsHTML, ShelfTagItem, isProductHalal } from '../../utils/labels/ShelfTagGenerator';
import { printHtmlContent } from '../../utils/printHelper';

export const ShelfTagsTab: React.FC = () => {
    const {
        products,
        currencySymbol,
        addNotification
    } = useMerchandising();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedShelfPosition, setSelectedShelfPosition] = useState<string>('all');
    const [filterOnlySales, setFilterOnlySales] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    // Price Parity Fast Verifier State
    const [auditSku, setAuditSku] = useState('');
    const [auditShelfPrice, setAuditShelfPrice] = useState('');
    const [auditResult, setAuditResult] = useState<{
        product: Product;
        status: 'MATCH' | 'DISCREPANCY';
        systemPrice: number;
        shelfPrice: number;
    } | null>(null);

    // Categories available
    const categories = useMemo(() => {
        const set = new Set<string>();
        products.forEach(p => {
            if (p.category) set.add(p.category);
        });
        return Array.from(set).sort();
    }, [products]);

    // Filtered products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (p.status === 'archived') return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesName = (p.name || '').toLowerCase().includes(term);
                const matchesSku = (p.sku || '').toLowerCase().includes(term);
                if (!matchesName && !matchesSku) return false;
            }
            if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
            if (selectedShelfPosition !== 'all' && (p.shelfPosition || 'Unassigned') !== selectedShelfPosition) return false;
            if (filterOnlySales && !p.isOnSale) return false;
            return true;
        });
    }, [products, searchTerm, selectedCategory, selectedShelfPosition, filterOnlySales]);

    // Selection helpers
    const toggleSelect = (id: string) => {
        setSelectedProductIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    // Parity Checker
    const handleVerifyParity = (e: React.FormEvent) => {
        e.preventDefault();
        const skuTrimmed = auditSku.trim().toUpperCase();
        if (!skuTrimmed) return;

        const matched = products.find(p => (p.sku || '').toUpperCase() === skuTrimmed);
        if (!matched) {
            addNotification('alert', `Product SKU "${skuTrimmed}" not found in branch catalog.`);
            setAuditResult(null);
            return;
        }

        const effectiveSysPrice = matched.isOnSale && matched.salePrice && matched.salePrice > 0
            ? matched.salePrice
            : matched.price;
        const enteredShelfPrice = parseFloat(auditShelfPrice) || 0;

        const isMatch = Math.abs(effectiveSysPrice - enteredShelfPrice) < 0.01;
        setAuditResult({
            product: matched,
            status: isMatch ? 'MATCH' : 'DISCREPANCY',
            systemPrice: effectiveSysPrice,
            shelfPrice: enteredShelfPrice
        });

        if (!isMatch) {
            addNotification('alert', `Price discrepancy detected for ${matched.name}! POS: ${currencySymbol} ${effectiveSysPrice} vs Shelf: ${currencySymbol} ${enteredShelfPrice}`);
            setSelectedProductIds(prev => new Set(prev).add(matched.id));
        } else {
            addNotification('success', `Price Parity Confirmed for ${matched.sku}`);
        }
    };

    // Trigger Print
    const handlePrintSelected = async () => {
        if (selectedProductIds.size === 0) {
            addNotification('info', 'Please select at least one item to generate shelf tags.');
            return;
        }

        const itemsToPrint: ShelfTagItem[] = selectedProductsList.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            barcodeType: p.barcodeType,
            category: p.category,
            shelfPosition: p.shelfPosition,
            regularPrice: p.price,
            salePrice: p.salePrice,
            isOnSale: p.isOnSale,
            isHalal: isProductHalal(p)
        }));

        const html = generateShelfTagsHTML(itemsToPrint, {
            currency: currencySymbol,
            storeName: 'SIIFMART RETAIL'
        });

        const res = await printHtmlContent(html);
        if (res && !res.success && res.error) {
            addNotification('alert', `Printing alert: ${res.error}`);
        } else {
            addNotification('success', `${itemsToPrint.length} shelf tag${itemsToPrint.length > 1 ? 's' : ''} dispatched for printing`);
        }
    };

    const selectedProductsList = useMemo(() => {
        return products.filter(p => selectedProductIds.has(p.id));
    }, [products, selectedProductIds]);

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
                    <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Catalog Items</p>
                    <p className="text-2xl font-bold text-[var(--theme-text-primary)] mt-1 font-mono">{products.length}</p>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Active branch SKUs</p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
                    <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">On-Promotion Items</p>
                    <p className="text-2xl font-bold text-amber-500 mt-1 font-mono">{products.filter(p => p.isOnSale).length}</p>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Requires promotional shelf flags</p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
                    <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Selected For Print</p>
                    <p className="text-2xl font-bold text-indigo-400 mt-1 font-mono">{selectedProductIds.size}</p>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Queued for thermal tag printer</p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
                    <p className="text-[11px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Planogram Shelved</p>
                    <p className="text-2xl font-bold text-emerald-500 mt-1 font-mono">
                        {products.filter(p => p.shelfPosition && p.shelfPosition !== 'Unassigned').length}
                    </p>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Assigned to visual shelf tiers</p>
                </div>
            </div>

            {/* Quick Price Parity Scanner Bar */}
            <div className="p-5 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ScanLine size={18} className="text-[var(--theme-accent)]" />
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">Floor Price Parity Verification</h4>
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)]">SOP-MER-037 Compliance</span>
                </div>
                <form onSubmit={handleVerifyParity} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)] mb-1 block">Scan or Enter SKU</label>
                        <input
                            type="text"
                            placeholder="e.g. ET-COFFEE-01"
                            value={auditSku}
                            onChange={e => setAuditSku(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl text-xs font-mono text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)]"
                        />
                    </div>
                    <div className="w-full sm:w-44">
                        <label className="text-[10px] uppercase font-bold text-[var(--theme-text-secondary)] mb-1 block">Physical Shelf Tag Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-xs text-[var(--theme-text-secondary)]">{currencySymbol}</span>
                            <input
                                type="number"
                                step="1"
                                placeholder="0"
                                value={auditShelfPrice}
                                onChange={e => setAuditShelfPrice(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl text-xs font-mono text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)]"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-[var(--theme-accent)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                        <CheckCircle2 size={14} /> Verify Parity
                    </button>
                </form>

                {auditResult && (
                    <div className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        auditResult.status === 'MATCH'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400'
                    }`}>
                        <div className="flex items-center gap-2">
                            {auditResult.status === 'MATCH' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            <div>
                                <span className="font-bold">{auditResult.product.name} ({auditResult.product.sku})</span>: {' '}
                                {auditResult.status === 'MATCH' ? (
                                    <span>Shelf price perfectly matches active POS price ({currencySymbol} {auditResult.systemPrice}).</span>
                                ) : (
                                    <span>
                                        Discrepancy! Active POS price is <strong>{currencySymbol} {auditResult.systemPrice}</strong> but physical tag is <strong>{currencySymbol} {auditResult.shelfPrice}</strong>. Tag queued for print.
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAuditResult(null)}
                            className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] p-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Filter & Toolbar */}
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search size={15} className="text-[var(--theme-text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search product name or SKU..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="px-2.5 py-1.5 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] outline-none"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        value={selectedShelfPosition}
                        onChange={e => setSelectedShelfPosition(e.target.value)}
                        className="px-2.5 py-1.5 bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] outline-none"
                    >
                        <option value="all">All Shelf Tiers</option>
                        <option value="Eye Level">Eye Level (Prime)</option>
                        <option value="Top Shelf">Top Shelf</option>
                        <option value="Bottom Shelf">Bottom Shelf</option>
                        <option value="Unassigned">Unassigned</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setFilterOnlySales(!filterOnlySales)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            filterOnlySales
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                : 'bg-[var(--theme-bg-panel)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                        }`}
                    >
                        Promos Only
                    </button>

                    <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card-hover)] cursor-pointer"
                    >
                        {selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>

                    <button
                        type="button"
                        onClick={handlePrintSelected}
                        disabled={selectedProductIds.size === 0}
                        className="px-4 py-1.5 bg-[var(--theme-accent)] disabled:opacity-40 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                    >
                        <Printer size={14} /> Print Tags ({selectedProductIds.size})
                    </button>
                </div>
            </div>

            {/* Shelf Tags Grid / Table */}
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-[var(--theme-bg-panel)] border-b border-[var(--theme-border)]">
                                <th className="p-3.5 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded cursor-pointer"
                                    />
                                </th>
                                <th className="p-3.5 font-bold text-[var(--theme-text-secondary)] uppercase">Product</th>
                                <th className="p-3.5 font-bold text-[var(--theme-text-secondary)] uppercase">SKU</th>
                                <th className="p-3.5 font-bold text-[var(--theme-text-secondary)] uppercase">Category</th>
                                <th className="p-3.5 font-bold text-[var(--theme-text-secondary)] uppercase">Shelf Tier</th>
                                <th className="p-3.5 font-bold text-[var(--theme-text-secondary)] uppercase text-right">POS Price</th>
                                <th className="p-3.5 font-bold text-[var(--theme-text-secondary)] uppercase text-center">Shelf Tag Preview</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]">
                            {filteredProducts.map(p => {
                                const isSelected = selectedProductIds.has(p.id);
                                const effectivePrice = p.isOnSale && p.salePrice && p.salePrice > 0 ? p.salePrice : p.price;
                                return (
                                    <tr key={p.id} className={`hover:bg-[var(--theme-bg-panel-hover)] ${isSelected ? 'bg-[var(--theme-accent)]/5' : ''}`}>
                                        <td className="p-3.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(p.id)}
                                                className="rounded cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-3.5 font-bold text-[var(--theme-text-primary)]">
                                            <div className="flex items-center gap-2">
                                                <span>{p.name}</span>
                                                {p.isOnSale && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                        Sale
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3.5 font-mono text-[var(--theme-text-secondary)]">{p.sku}</td>
                                        <td className="p-3.5 text-[var(--theme-text-secondary)]">{p.category || 'General'}</td>
                                        <td className="p-3.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                p.shelfPosition === 'Eye Level'
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    : p.shelfPosition === 'Top Shelf'
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    : 'bg-[var(--theme-bg-panel)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
                                            }`}>
                                                {p.shelfPosition || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-right font-mono font-bold text-[var(--theme-text-primary)]">
                                            {p.isOnSale && p.salePrice ? (
                                                <div>
                                                    <span className="line-through text-[var(--theme-text-secondary)] text-[10px] mr-1.5 font-normal">
                                                        {currencySymbol} {p.price.toFixed(2)}
                                                    </span>
                                                    <span className="text-amber-500 font-bold">
                                                        {currencySymbol} {p.salePrice.toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span>{currencySymbol} {p.price.toFixed(2)}</span>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-center">
                                            {/* Mini Visual Shelf Tag Badge */}
                                            <div className="inline-block p-1.5 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-left min-w-[120px]">
                                                <div className="text-[8px] font-mono text-[var(--theme-text-secondary)] truncate">{p.sku}</div>
                                                <div className="text-[10px] font-bold text-[var(--theme-text-primary)] truncate max-w-[110px]">{p.name}</div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <span className="text-[11px] font-mono font-bold text-[var(--theme-accent)]">
                                                        {currencySymbol} {effectivePrice.toFixed(2)}
                                                    </span>
                                                    {isProductHalal(p) ? (
                                                        <span className="text-[7px] uppercase font-bold text-emerald-500">Halal</span>
                                                    ) : (
                                                        <span className="text-[7px] uppercase font-bold text-[var(--theme-text-muted)]">Verified</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-[var(--theme-text-secondary)]">
                                        No products found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
