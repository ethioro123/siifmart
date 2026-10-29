import React, { useState, useEffect } from 'react';
import { X, Printer, Package, Settings, Search, Plus, Minus, Trash2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { Product } from '../types';
import { printHtmlContent } from '../utils/printHelper';
import { useData } from '../contexts/DataContext';
import { generateUnifiedBatchLabelsHTML } from '../utils/labels/ProductLabelGenerator';

type LabelSize = 'small' | 'medium' | 'large';

interface LabelData {
    product: Product;
    quantity: number;
    batchNumber?: string;
    expiryDate?: string;
    receivedDate?: string;
    location?: string;
}

interface LabelPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    labels: LabelData[];
    onPrint: () => void;
}

// Standardized label dimensions across SIIFMART (2"x1", 3"x2", 4"x3")
const LABEL_SIZES = {
    small: { width: 50.8, height: 25.4, barcodeHeight: 18, fontSize: 7, label: '2" × 1" (50.8 × 25.4 mm)' },
    medium: { width: 76.2, height: 50.8, barcodeHeight: 30, fontSize: 9, label: '3" × 2" (76.2 × 50.8 mm)' },
    large: { width: 101.6, height: 76.2, barcodeHeight: 45, fontSize: 11, label: '4" × 3" (101.6 × 76.2 mm)' },
};

export default function LabelPrintModal({ isOpen, onClose, labels, onPrint }: LabelPrintModalProps) {
    const { products, activeSite, effectiveCountry, settings, allProducts } = useData();
    const activeCurrency = (activeSite as any)?.currency || (effectiveCountry === 'KE' || settings?.country === 'KE' ? 'KSh' : 'ETB');
    const [labelSize, setLabelSize] = useState<LabelSize>('medium');
    const [activeLabels, setActiveLabels] = useState<LabelData[]>(labels || []);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActiveLabels(labels || []);
            setSearchQuery('');
        }
    }, [labels, isOpen]);

    if (!isOpen) return null;

    const availableProducts: Product[] = (products && products.length > 0) ? products : (allProducts || []);
    const searchResults = searchQuery.trim()
        ? availableProducts.filter((p: Product) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
        ).slice(0, 6)
        : [];

    const handleAddProduct = (product: Product) => {
        setActiveLabels(prev => {
            const existingIdx = prev.findIndex(l => l.product.id === product.id || l.product.sku === product.sku);
            if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + 1 };
                return updated;
            }
            return [...prev, { product, quantity: 1 }];
        });
        setSearchQuery('');
    };

    const handleUpdateQuantity = (index: number, delta: number) => {
        setActiveLabels(prev => {
            const updated = [...prev];
            const newQty = updated[index].quantity + delta;
            if (newQty <= 0) {
                return updated.filter((_, i) => i !== index);
            }
            updated[index] = { ...updated[index], quantity: newQty };
            return updated;
        });
    };

    const handleRemoveLabel = (index: number) => {
        setActiveLabels(prev => prev.filter((_, i) => i !== index));
    };

    const totalLabels = activeLabels.reduce((sum, label) => sum + label.quantity, 0);
    const activeSizeConfig = LABEL_SIZES[labelSize];

    const handlePrint = async () => {
        if (activeLabels.length === 0) return;
        const items = activeLabels.map(l => ({
            value: (l.product.sku || '').trim(),
            label: l.product.name,
            sku: l.product.sku,
            barcode: l.product.barcode,
            barcodeType: l.product.barcodeType,
            quantity: l.quantity,
            price: (l.product.price || '0.00').toString(),
            currency: activeCurrency,
            category: l.product.category || 'General',
            date: ''
        }));

        const printOptions = {
            size: labelSize === 'small' ? 'Small' : labelSize === 'large' ? 'Large' : 'Medium',
            format: 'Barcode' as const,
            currency: activeCurrency,
            showPrice: true,
            showCategory: true,
            showName: true
        };

        const html = await generateUnifiedBatchLabelsHTML(items, printOptions);
        const res = await printHtmlContent(html);
        if (res && !res.success && res.error) {
            console.error('Print direct failed:', res.error);
        } else {
            onPrint();
            onClose();
        }
    };


    return (
        <>
            {/* Modal Overlay */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    {/* Header */}
                    <div className="p-5 border-b border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-card)]">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5">
                                <Package className="text-[var(--theme-accent)]" size={24} />
                                Print Product Labels
                            </h2>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                {totalLabels} label{totalLabels !== 1 ? 's' : ''} ready to print
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Size Selector */}
                            <div className="flex items-center gap-2 bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)]">
                                <Settings size={14} className="text-[var(--theme-text-secondary)] ml-1.5" />
                                <span className="text-[11px] text-[var(--theme-text-muted)] font-bold uppercase tracking-wider mr-1">Size</span>
                                <div className="flex bg-[var(--theme-bg-app)] rounded-lg p-0.5">
                                    {(['small', 'medium', 'large'] as LabelSize[]).map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setLabelSize(size)}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${labelSize === size
                                                ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                                                }`}
                                        >
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors p-2 hover:bg-[var(--theme-bg-card-hover)] rounded-xl cursor-pointer"
                                aria-label="Close Modal"
                                title="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Label Preview Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-[var(--theme-bg-app)] space-y-4">
                        {/* Product Search & Add Bar */}
                        <div className="relative">
                            <div className="flex items-center bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 focus-within:border-[var(--theme-accent)] focus-within:ring-1 focus-within:ring-[var(--theme-accent)]/30 transition-all">
                                <Search size={16} className="text-[var(--theme-text-secondary)] mr-2.5 shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products by Name, SKU or Barcode to add to print queue..."
                                    className="w-full bg-transparent text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] text-xs focus:outline-none"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] p-1 cursor-pointer"
                                        aria-label="Clear search"
                                        title="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Results */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[var(--theme-border)] max-h-60 overflow-y-auto">
                                    {searchResults.map((product: Product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleAddProduct(product)}
                                            className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--theme-bg-card-hover)] transition-colors group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] overflow-hidden flex items-center justify-center shrink-0">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="text-[var(--theme-text-muted)]" size={16} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[var(--theme-text-primary)] text-xs truncate max-w-xs">{product.name}</p>
                                                    <p className="text-[11px] font-mono text-[var(--theme-text-secondary)]">SKU: {product.sku} {product.barcode ? `| ${product.barcode}` : ''}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-semibold text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 px-2.5 py-1 rounded-lg group-hover:bg-[var(--theme-accent)] group-hover:text-white transition-all flex items-center gap-1">
                                                <Plus size={12} /> Add
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 rounded-xl text-xs text-[var(--theme-text-primary)] flex items-center gap-2 font-medium">
                            <strong className="text-[var(--theme-accent)]">Tip:</strong> Label size: {activeSizeConfig.label}
                        </div>

                        <div className="space-y-3">
                            {activeLabels.map((labelData, index) => (
                                <div key={index} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex gap-4 hover:border-[var(--theme-accent)]/40 transition-colors items-center shadow-xs">
                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-14 h-14 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] overflow-hidden flex items-center justify-center shrink-0">
                                                {labelData.product.image ? (
                                                    <img
                                                        src={labelData.product.image}
                                                        alt={labelData.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="text-[var(--theme-text-muted)]" size={24} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-[var(--theme-text-primary)] text-sm truncate">{labelData.product.name}</h4>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-[11px] font-mono text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-md border border-[var(--theme-accent)]/20">
                                                        {labelData.product.sku || 'NO SKU'}
                                                    </span>
                                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                                        {labelData.product.barcode || 'No Barcode'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview of Label Layout */}
                                    <div className="bg-white p-2.5 rounded-xl w-52 shrink-0 text-slate-900 border border-slate-300 font-sans shadow-xs">
                                        <div className="bg-slate-100 p-1 border-b border-dashed border-slate-300 text-[11px] font-bold uppercase tracking-wider truncate text-center text-slate-900 rounded-t-sm">
                                            {labelData.product.name}
                                        </div>
                                        <div className="py-2 flex flex-col items-center justify-center">
                                            {labelData.product.sku ? (
                                                <Barcode
                                                    value={labelData.product.sku}
                                                    format="CODE128"
                                                    displayValue={false}
                                                    height={22}
                                                    width={1.2}
                                                    margin={0}
                                                />
                                            ) : <span className="text-[var(--theme-status-danger-text)] font-bold text-[11px]">NO DATA</span>}
                                            <div className="font-mono font-bold text-[11px] mt-1 text-slate-800 tracking-wider">
                                                {labelData.product.sku}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 border-t border-dashed border-slate-300 pt-1.5 text-[11px]">
                                            <div className="text-center bg-slate-50 p-1 rounded border border-slate-200">
                                                <span className="block font-bold text-slate-500 text-[11px] uppercase tracking-wider">PRICE</span>
                                                <span className="block font-extrabold text-slate-900 text-xs">{activeCurrency} {labelData.product.price}</span>
                                            </div>
                                            <div className="text-center bg-slate-50 p-1 rounded border border-slate-200">
                                                <span className="block font-bold text-slate-500 text-[11px] uppercase tracking-wider">CAT</span>
                                                <span className="block font-extrabold text-slate-900 text-xs truncate">{(labelData.product.category || 'General').toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 px-3 border-l border-[var(--theme-border)] shrink-0">
                                        <div className="flex items-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-1">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateQuantity(index, -1)}
                                                className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-colors cursor-pointer"
                                                title="Decrease copies"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center text-xs font-bold text-[var(--theme-text-primary)] font-mono">{labelData.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateQuantity(index, 1)}
                                                className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] transition-colors cursor-pointer"
                                                title="Increase copies"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLabel(index)}
                                            className="p-2 text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] rounded-xl transition-colors cursor-pointer"
                                            title="Remove label"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {activeLabels.length === 0 && (
                                <div className="p-12 text-center border-2 border-dashed border-[var(--theme-border)] rounded-2xl bg-[var(--theme-bg-card)]">
                                    <Package size={36} className="mx-auto text-[var(--theme-text-muted)] mb-3 opacity-60" />
                                    <p className="text-[var(--theme-text-primary)] font-bold text-sm">No labels in print queue</p>
                                    <p className="text-[var(--theme-text-secondary)] text-xs mt-1">Use the search bar above to find and add products to print.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-[var(--theme-border)] flex gap-3 bg-[var(--theme-bg-card)]">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] font-semibold text-xs transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={totalLabels === 0}
                            className="flex-[2] py-2.5 bg-[var(--theme-accent)] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
                        >
                            <Printer size={16} />
                            <span>Print {totalLabels} Label{totalLabels !== 1 ? 's' : ''} ({labelSize.toUpperCase()})</span>
                        </button>
                    </div>
                </div>
            </div>

        </>
    );
}
