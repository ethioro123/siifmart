import React from 'react';
import { X, Printer, Package } from 'lucide-react';
import Barcode from 'react-barcode';
import { Product } from '../types';
import { getBarcodeProps } from '../utils/barcodeConfig';

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

export default function LabelPrintModal({ isOpen, onClose, labels, onPrint }: LabelPrintModalProps) {
    if (!isOpen) return null;

    const totalLabels = labels.reduce((sum, label) => sum + label.quantity, 0);

    const handlePrint = () => {
        // Trigger browser print dialog
        window.print();
        onPrint();
    };

    return (
        <>
            {/* Modal Overlay */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
                <div className="bg-cyber-gray border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Package className="text-cyber-primary" size={28} />
                                Print Product Labels
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {totalLabels} label{totalLabels !== 1 ? 's' : ''} ready to print
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Label Preview */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-4">
                            {labels.map((labelData, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={labelData.product.image}
                                                alt={labelData.product.name}
                                                className="w-12 h-12 rounded-lg object-cover border border-white/10"
                                            />
                                            <div>
                                                <p className="font-bold text-white">{labelData.product.name}</p>
                                                <div className="mt-1 bg-white p-1 rounded w-fit">
                                                    <Barcode value={labelData.product.sku} {...getBarcodeProps('tiny')} />
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">SKU: {labelData.product.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-cyber-primary">{labelData.quantity}</p>
                                            <p className="text-xs text-gray-500">labels</p>
                                        </div>
                                    </div>

                                    {/* Label Details */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {labelData.batchNumber && (
                                            <div className="bg-black/20 rounded p-2">
                                                <span className="text-gray-500">Batch:</span>
                                                <span className="text-white ml-2 font-mono">{labelData.batchNumber}</span>
                                            </div>
                                        )}
                                        {labelData.expiryDate && (
                                            <div className="bg-black/20 rounded p-2">
                                                <span className="text-gray-500">Expiry:</span>
                                                <span className="text-white ml-2">{labelData.expiryDate}</span>
                                            </div>
                                        )}
                                        {labelData.location && (
                                            <div className="bg-black/20 rounded p-2">
                                                <span className="text-gray-500">Location:</span>
                                                <span className="text-white ml-2 font-mono">{labelData.location}</span>
                                            </div>
                                        )}
                                        {labelData.receivedDate && (
                                            <div className="bg-black/20 rounded p-2">
                                                <span className="text-gray-500">Received:</span>
                                                <span className="text-white ml-2">{labelData.receivedDate}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 py-3 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                        >
                            <Printer size={20} />
                            Print {totalLabels} Label{totalLabels !== 1 ? 's' : ''}
                        </button>
                    </div>
                </div>
            </div>

            {/* Print-only Labels */}
            <div className="hidden print:block">
                {labels.map((labelData, labelIndex) =>
                    Array.from({ length: labelData.quantity }).map((_, unitIndex) => (
                        <div
                            key={`${labelIndex}-${unitIndex}`}
                            className="page-break-after border-2 border-black p-4 bg-white text-black"
                            style={{
                                width: '4in',
                                height: '2in',
                                pageBreakAfter: 'always',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-black pb-2">
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">{labelData.product.name}</h3>
                                    <p className="text-xs text-gray-700 mt-1">Category: {labelData.product.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold">Unit {unitIndex + 1}/{labelData.quantity}</p>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 py-2">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {/* SKU - Prominent Barcode */}
                                    <div className="col-span-2 border border-gray-300 rounded p-2 flex flex-col items-center justify-center bg-white">
                                        <Barcode
                                            value={labelData.product.sku}
                                            {...getBarcodeProps('medium', { margin: 0 })}
                                        />
                                    </div>

                                    {/* Price */}
                                    <div className="border border-gray-300 rounded p-2">
                                        <p className="text-xs text-gray-600">Price</p>
                                        <p className="font-bold text-lg">${labelData.product.price.toFixed(2)}</p>
                                    </div>

                                    {/* Batch Number */}
                                    {labelData.batchNumber && (
                                        <div className="border border-gray-300 rounded p-2">
                                            <p className="text-xs text-gray-600">Batch</p>
                                            <p className="font-mono text-sm font-bold">{labelData.batchNumber}</p>
                                        </div>
                                    )}

                                    {/* Expiry Date */}
                                    {labelData.expiryDate && (
                                        <div className="border border-gray-300 rounded p-2">
                                            <p className="text-xs text-gray-600">Expiry</p>
                                            <p className="text-sm font-bold">{labelData.expiryDate}</p>
                                        </div>
                                    )}

                                    {/* Location */}
                                    {labelData.location && (
                                        <div className="border border-gray-300 rounded p-2">
                                            <p className="text-xs text-gray-600">Location</p>
                                            <p className="font-mono text-sm font-bold">{labelData.location}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t-2 border-black pt-2 flex justify-between items-center text-xs">
                                <div>
                                    <p className="font-bold">SIIFMART</p>
                                    {labelData.receivedDate && (
                                        <p className="text-gray-600">Received: {labelData.receivedDate}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-600">Printed: {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Print Styles */}
            <style jsx>{`
        @media print {
          @page {
            size: 4in 2in;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .page-break-after {
            page-break-after: always;
          }
        }
      `}</style>
        </>
    );
}
