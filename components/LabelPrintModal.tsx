import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Package, Settings, Search, Plus, Minus, Trash2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { Product } from '../types';
import { printHtmlContent } from '../utils/printHelper';
import { useData } from '../contexts/DataContext';
import { buildLabelPrintHtml } from '../utils/labels/LabelPrintStyleBuilder';

// Map internal barcode types to react-barcode formats
const getBarcodeFormat = (type?: string): any => {
    switch (type) {
        case 'EAN-13': return 'EAN13';
        case 'UPC-A': return 'UPC';
        case 'CODE39': return 'CODE39';
        case 'CODE128': default: return 'CODE128';
    }
};

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

// Fixed label dimensions in mm for precise printing
const LABEL_SIZES = {
    small: { width: 50, height: 25, barcodeHeight: 18, fontSize: 7 },   // 2" x 1"
    medium: { width: 100, height: 50, barcodeHeight: 30, fontSize: 9 }, // 4" x 2"
    large: { width: 100, height: 75, barcodeHeight: 45, fontSize: 11 }, // 4" x 3"
};

export default function LabelPrintModal({ isOpen, onClose, labels, onPrint }: LabelPrintModalProps) {
    const { products } = useData();
    const [labelSize, setLabelSize] = useState<LabelSize>('medium');
    const [activeLabels, setActiveLabels] = useState<LabelData[]>(labels || []);
    const [searchQuery, setSearchQuery] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveLabels(labels || []);
            setSearchQuery('');
        }
    }, [labels, isOpen]);

    if (!isOpen) return null;

    const searchResults = searchQuery.trim()
        ? products.filter(p =>
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
    const config = LABEL_SIZES[labelSize];

    const handlePrint = () => {
        const labelContent = printRef.current?.innerHTML || '';
        const html = buildLabelPrintHtml(labelContent, config);
        printHtmlContent(html);
        onPrint();
    };

    // Generate all label elements
    const renderLabels = () => {
        const allLabels: React.ReactElement[] = [];

        activeLabels.forEach((labelData: LabelData, labelIndex: number) => {
            for (let i = 0; i < labelData.quantity; i++) {
                const key = `${labelIndex}-${i}`;
                const barcodeValue = labelData.product.barcode || labelData.product.sku;

                if (labelSize === 'small') {
                    // Compact layout for small labels - just name and barcode
                    allLabels.push(
                        <div key={key} className="label label-small">
                            <div className="name">{labelData.product.name.substring(0, 20)}</div>
                            <div className="barcode-container">
                                {barcodeValue ? (
                                    <Barcode
                                        value={barcodeValue}
                                        format={getBarcodeFormat(labelData.product.barcodeType || 'CODE128')}
                                        width={1}
                                        height={config.barcodeHeight}
                                        fontSize={6}
                                        margin={0}
                                        displayValue={false}
                                    />
                                ) : (
                                    <span className="text-red-500 text-[8pt]">NO BARCODE</span>
                                )}
                            </div>
                            <div className="sku">{barcodeValue}</div>
                        </div>
                    );
                } else {
                    // Full layout for medium/large labels - no price, no duplicate details
                    allLabels.push(
                        <div key={key} className="label">
                            <div className="label-header">
                                <div>
                                    <h3>{labelData.product.name}</h3>
                                    <div className="category">{labelData.product.category}</div>
                                </div>
                            </div>
                            <div className="barcode-container">
                                {barcodeValue ? (
                                    <Barcode
                                        value={barcodeValue}
                                        format={getBarcodeFormat(labelData.product.barcodeType || 'CODE128')}
                                        width={labelSize === 'medium' ? 1.5 : 2}
                                        height={config.barcodeHeight}
                                        fontSize={config.fontSize - 1}
                                        margin={0}
                                        displayValue={false}
                                    />
                                ) : (
                                    <div className="text-red-500 text-center">
                                        <div className="font-bold">NO BARCODE</div>
                                    </div>
                                )}
                            </div>
                            <div className="label-footer">
                                <span><strong>SKU:</strong> {labelData.product.sku}</span>
                                {labelData.location && <span><strong>LOC:</strong> {labelData.location}</span>}
                            </div>
                        </div>
                    );
                }
            }
        });

        return allLabels;
    };

    return (
        <>
            {/* Modal Overlay */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-cyber-gray border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Package className="text-cyber-primary" size={28} />
                                Print Product Labels
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {totalLabels} label{totalLabels !== 1 ? 's' : ''} ready to print
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Size Selector */}
                            <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-lg border border-white/10">
                                <Settings size={16} className="text-cyber-primary ml-2" />
                                <span className="text-xs text-gray-400 font-bold uppercase mr-2">Size</span>
                                <div className="flex bg-black/40 rounded p-0.5">
                                    {(['small', 'medium', 'large'] as LabelSize[]).map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setLabelSize(size)}
                                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${labelSize === size
                                                ? 'bg-cyber-primary text-black shadow-lg shadow-cyber-primary/20'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                                aria-label="Close Modal"
                                title="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Label Preview Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-black/40 space-y-4">
                        {/* Product Search & Add Bar */}
                        <div className="relative">
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-cyber-primary/50 transition-colors">
                                <Search size={18} className="text-gray-400 mr-2 shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products by Name, SKU or Barcode to add to print queue..."
                                    className="w-full bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white p-1">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Results */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#18201B] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 max-h-60 overflow-y-auto">
                                    {searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleAddProduct(product)}
                                            className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="text-gray-500" size={18} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-xs truncate max-w-xs">{product.name}</p>
                                                    <p className="text-[10px] font-mono text-gray-400">SKU: {product.sku} {product.barcode ? `| ${product.barcode}` : ''}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-cyber-primary bg-cyber-primary/10 border border-cyber-primary/20 px-2.5 py-1 rounded-lg group-hover:bg-cyber-primary group-hover:text-black transition-all flex items-center gap-1">
                                                <Plus size={12} /> Add
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400">
                            <strong>Tip:</strong> Label size: {config.width}mm × {config.height}mm ({labelSize === 'small' ? '2" × 1"' : labelSize === 'medium' ? '4" × 2"' : '4" × 3"'})
                        </div>

                        <div className="space-y-4">
                            {activeLabels.map((labelData, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 hover:border-cyber-primary/30 transition-colors items-center">
                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                                {labelData.product.image ? (
                                                    <img
                                                        src={labelData.product.image}
                                                        alt={labelData.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="text-gray-600" size={32} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-white text-base truncate">{labelData.product.name}</h4>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20">
                                                        {labelData.product.sku || 'NO SKU'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {labelData.product.barcode || 'No Barcode'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview of Label Layout */}
                                    <div className="bg-white p-2 rounded w-44 shrink-0 opacity-90 border-4 border-dashed border-gray-300 transform scale-90">
                                        <div className="h-full flex flex-col items-center justify-center text-black text-[10px] leading-tight text-center">
                                            <p className="font-bold truncate w-full px-1">{labelData.product.name}</p>
                                            <div className="my-1 w-full flex justify-center overflow-hidden">
                                                {(labelData.product.barcode || labelData.product.sku) ? (
                                                    <Barcode
                                                        value={labelData.product.barcode || labelData.product.sku}
                                                        format={getBarcodeFormat(labelData.product.barcodeType || 'CODE128')}
                                                        displayValue={false}
                                                        height={20}
                                                        width={1}
                                                        margin={0}
                                                    />
                                                ) : <span className="text-red-500 font-bold text-[8px]">NO DATA</span>}
                                            </div>
                                            <div className="font-mono font-bold text-[8px] text-gray-500">
                                                {labelData.product.sku}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 px-4 border-l border-white/10 shrink-0">
                                        <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateQuantity(index, -1)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                                title="Decrease copies"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-extrabold text-cyber-primary font-mono">{labelData.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateQuantity(index, 1)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                                title="Increase copies"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLabel(index)}
                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                                            title="Remove label"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {activeLabels.length === 0 && (
                                <div className="p-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                    <Package size={40} className="mx-auto text-gray-600 mb-3 opacity-60" />
                                    <p className="text-white font-bold text-base">No labels in print queue</p>
                                    <p className="text-gray-400 text-xs mt-1">Use the search bar above to find and add products to print.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 flex gap-3 bg-black/20">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={totalLabels === 0}
                            className="flex-[2] py-4 bg-cyber-primary hover:bg-cyber-accent disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transform hover:scale-[1.01]"
                        >
                            <Printer size={20} />
                            <span>Print {totalLabels} Label{totalLabels !== 1 ? 's' : ''} ({labelSize.toUpperCase()})</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden container for print content */}
            <div ref={printRef} className="hidden">
                {renderLabels()}
            </div>
        </>
    );
}
