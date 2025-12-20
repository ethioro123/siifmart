import React, { useState, useRef } from 'react';
import { X, Printer, Package, Settings } from 'lucide-react';
import Barcode from 'react-barcode';
import { Product } from '../types';

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
    const [labelSize, setLabelSize] = useState<LabelSize>('medium');
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const totalLabels = labels.reduce((sum, label) => sum + label.quantity, 0);
    const config = LABEL_SIZES[labelSize];

    const handlePrint = () => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('Please allow popups for printing');
            return;
        }

        // Get all label HTML
        const labelContent = printRef.current?.innerHTML || '';

        // Write the print document
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Labels</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    @page {
                        size: ${config.width}mm ${config.height}mm;
                        margin: 0;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        background: white;
                        color: black;
                    }
                    
                    .label {
                        width: ${config.width}mm;
                        height: ${config.height}mm;
                        padding: 2mm;
                        border: 0.2mm solid #000;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        page-break-after: always;
                        page-break-inside: avoid;
                        break-inside: avoid;
                        overflow: hidden;
                        background: white;
                    }
                    
                    .label:last-child {
                        page-break-after: auto;
                    }
                    
                    .label-header {
                        border-bottom: 0.2mm solid #000;
                        padding-bottom: 1mm;
                        margin-bottom: 1mm;
                    }
                    
                    .label-header h3 {
                        font-size: ${config.fontSize}pt;
                        font-weight: bold;
                        margin: 0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    
                    .label-header .category {
                        font-size: ${config.fontSize - 2}pt;
                        color: #666;
                    }
                    
                    .barcode-container {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 0.2mm solid #000;
                        border-radius: 1mm;
                        margin: 1mm 0;
                        overflow: hidden;
                        min-height: 0;
                        max-height: ${config.barcodeHeight + 5}mm;
                    }
                    
                    .barcode-container svg {
                        max-width: 100%;
                        max-height: ${config.barcodeHeight}mm;
                        height: auto !important;
                    }
                    
                    .label-footer {
                        display: flex;
                        justify-content: space-between;
                        border-top: 0.2mm solid #000;
                        padding-top: 1mm;
                        font-size: ${config.fontSize - 2}pt;
                        font-family: monospace;
                    }
                    
                    /* Small label simplified layout */
                    .label-small {
                        text-align: center;
                        justify-content: center;
                        gap: 1mm;
                    }
                    
                    .label-small .name {
                        font-size: ${config.fontSize}pt;
                        font-weight: bold;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    
                    .label-small .sku {
                        font-size: ${config.fontSize - 2}pt;
                        font-family: monospace;
                    }
                    
                    .label-small .barcode-container {
                        border: none;
                        margin: 0;
                        flex: unset;
                    }
                    
                    @media print {
                        body {
                            width: ${config.width}mm;
                        }
                        .label {
                            border: 0.1mm solid #ccc;
                        }
                    }
                </style>
            </head>
            <body>
                ${labelContent}
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };

        onPrint();
    };

    // Generate all label elements
    const renderLabels = () => {
        const allLabels: React.ReactElement[] = [];

        labels.forEach((labelData: LabelData, labelIndex: number) => {
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
                                    <span style={{ color: 'red', fontSize: '8pt' }}>NO BARCODE</span>
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
                                    <div style={{ color: 'red', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold' }}>NO BARCODE</div>
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
                    <div className="flex-1 overflow-y-auto p-6 bg-black/40">
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400">
                            <strong>Tip:</strong> Label size: {config.width}mm × {config.height}mm ({labelSize === 'small' ? '2" × 1"' : labelSize === 'medium' ? '4" × 2"' : '4" × 3"'})
                        </div>
                        <div className="space-y-4">
                            {labels.map((labelData, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 hover:border-cyber-primary/30 transition-colors">
                                    {/* Product Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
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
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{labelData.product.name}</h4>
                                                <div className="flex items-center gap-3 mt-1">
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
                                    <div className="bg-white p-2 rounded w-48 opacity-90 border-4 border-dashed border-gray-300 transform scale-90 origin-right">
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

                                    {/* Quantity Control */}
                                    <div className="flex flex-col items-center justify-center px-4 border-l border-white/10">
                                        <span className="text-2xl font-bold text-cyber-primary">{labelData.quantity}</span>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Copies</span>
                                    </div>
                                </div>
                            ))}
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
                            className="flex-[2] py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transform hover:scale-[1.01]"
                        >
                            <Printer size={20} />
                            <span>Print {totalLabels} Labels ({labelSize.toUpperCase()})</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden container for print content */}
            <div ref={printRef} style={{ display: 'none' }}>
                {renderLabels()}
            </div>
        </>
    );
}
