import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, Copy, Check, QrCode, ScanLine, Layers, Minus, Plus } from 'lucide-react';
import { BarcodeLabelPreviewCard, BarcodeLabelPreviewCardProps } from './BarcodeLabelPreviewCard';
import { validateBarcodeFormat } from '../../../utils/barcodeValidation';

interface BarcodeLabelPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    previewData: Omit<BarcodeLabelPreviewCardProps, 'isModal'>;
    quantity: number;
    onQuantityChange?: (qty: number) => void;
    onFormatChange?: (format: 'BARCODE' | 'QR') => void;
    onPrint: () => void;
    isPrinting?: boolean;
}

export const BarcodeLabelPreviewModal: React.FC<BarcodeLabelPreviewModalProps> = ({
    isOpen,
    onClose,
    previewData,
    quantity,
    onQuantityChange,
    onFormatChange,
    onPrint,
    isPrinting = false
}) => {
    const [copied, setCopied] = useState(false);

    // Keyboard support: Escape closes modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const validation = validateBarcodeFormat(previewData.code || '');
    const isCodeValid = validation.isValid || previewData.type === 'BAY' || previewData.format === 'QR';

    const handleCopyPayload = () => {
        if (!previewData.code) return;
        navigator.clipboard.writeText(previewData.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="barcode-preview-title"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-xl shrink-0">
                            <ScanLine size={20} />
                        </div>
                        <div className="min-w-0">
                            <h3 id="barcode-preview-title" className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] truncate">
                                Barcode & Thermal Label Preview
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] truncate">
                                Live scannability check & 1:1 thermal layout before physical print
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Live Format Switch in Modal */}
                        {onFormatChange && (
                            <div className="hidden sm:flex bg-[var(--theme-bg-card)] p-0.5 rounded-xl border border-[var(--theme-border)] text-xs">
                                <button
                                    onClick={() => onFormatChange('BARCODE')}
                                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${previewData.format === 'BARCODE'
                                        ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                >
                                    <ScanLine size={13} /> Barcode
                                </button>
                                <button
                                    onClick={() => onFormatChange('QR')}
                                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${previewData.format === 'QR'
                                        ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                        }`}
                                >
                                    <QrCode size={13} /> QR Code
                                </button>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                            aria-label="Close Preview"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[var(--theme-bg-app)]">
                    {/* Format switch for mobile */}
                    {onFormatChange && (
                        <div className="flex sm:hidden bg-[var(--theme-bg-card)] p-1 rounded-xl border border-[var(--theme-border)] text-xs">
                            <button
                                onClick={() => onFormatChange('BARCODE')}
                                className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${previewData.format === 'BARCODE'
                                    ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                    : 'text-[var(--theme-text-secondary)]'
                                    }`}
                            >
                                <ScanLine size={13} /> Barcode
                            </button>
                            <button
                                onClick={() => onFormatChange('QR')}
                                className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${previewData.format === 'QR'
                                    ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                                    : 'text-[var(--theme-text-secondary)]'
                                    }`}
                            >
                                <QrCode size={13} /> QR Code
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* Thermal Sticker Visual Card */}
                        <div className="md:col-span-7 flex flex-col items-center justify-center bg-[var(--theme-bg-subtle)] p-4 sm:p-6 rounded-2xl border border-[var(--theme-border)]">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-3 flex items-center gap-1.5">
                                <Layers size={13} className="text-[var(--theme-accent)]" /> 1:1 Thermal Output Simulation
                            </div>
                            <BarcodeLabelPreviewCard
                                {...previewData}
                                isModal={true}
                                className="w-full"
                            />
                        </div>

                        {/* Scanner Validation & Print Specs */}
                        <div className="md:col-span-5 space-y-4">
                            {/* Scannability Verification Card */}
                            <div className="p-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                        Optical Verification
                                    </span>
                                    {isCodeValid ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            <CheckCircle2 size={12} /> Scannable
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                            <AlertTriangle size={12} /> Review
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <div className="text-[11px] text-[var(--theme-text-secondary)] mb-1">
                                        Scanner Emitted Value:
                                    </div>
                                    <div className="flex items-center gap-2 p-2.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                                        <span className="font-mono text-xs font-bold text-[var(--theme-text-primary)] truncate flex-1 tabular-nums">
                                            {previewData.code || '--'}
                                        </span>
                                        <button
                                            onClick={handleCopyPayload}
                                            className="p-1.5 hover:bg-[var(--theme-bg-card)] rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                                            title="Copy scanner payload"
                                            aria-label="Copy scanner payload"
                                        >
                                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="text-[11px] text-[var(--theme-text-secondary)] space-y-1 pt-1 border-t border-[var(--theme-border)]">
                                    <div className="flex justify-between">
                                        <span>Symbology:</span>
                                        <span className="font-mono font-semibold text-[var(--theme-text-primary)]">
                                            {previewData.format === 'QR' ? 'QR Matrix 2D' : 'Code 128 (GS1)'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Label Preset:</span>
                                        <span className="font-mono font-semibold text-[var(--theme-text-primary)]">
                                            {previewData.size || 'MEDIUM'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity Adjuster */}
                            {onQuantityChange && (
                                <div className="p-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                            Print Copies
                                        </div>
                                        <div className="text-[11px] text-[var(--theme-text-muted)]">Batch quantity</div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-[var(--theme-bg-subtle)] p-1 rounded-xl border border-[var(--theme-border)]">
                                        <button
                                            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                                            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors"
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-10 text-center font-mono font-bold text-sm text-[var(--theme-text-primary)] tabular-nums">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={() => onQuantityChange(quantity + 1)}
                                            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors"
                                            aria-label="Increase quantity"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors min-h-[44px]"
                    >
                        Close Preview
                    </button>
                    <button
                        onClick={() => {
                            onPrint();
                        }}
                        disabled={isPrinting || !previewData.code?.trim()}
                        className="px-6 py-2.5 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 active:scale-95 text-white font-semibold text-xs min-h-[44px] flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 touch-manipulation"
                    >
                        <Printer size={16} />
                        <span>Print {quantity > 1 ? `${quantity} Labels` : 'Label'} Now</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
