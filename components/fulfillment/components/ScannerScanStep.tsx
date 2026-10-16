import React, { useState, useEffect } from 'react';
import { Package, Scan, CheckCircle, RefreshCw, AlertTriangle, ArrowLeft, Plus, Minus } from 'lucide-react';
import { JobItem, Product } from '../../../types';

const MetricBadge = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-center ${color}`}>
        <span className="text-[11px] uppercase font-semibold opacity-80">{label}</span>
        <span className="text-base font-mono tabular-nums font-bold">{value}</span>
    </div>
);

interface ScannerScanStepProps {
    currentItem: JobItem;
    currentProduct: Product | null | undefined;
    t: (key: string) => string;
    itemInputRef: React.RefObject<HTMLInputElement | null>;
    scannedItem: string;
    setScannedItem: (val: string) => void;
    scanOnlyItemHandlers: {
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    };
    handleItemScan: (val?: string, quantity?: number) => void;
    isProcessingScan: boolean;
    requireQuantityEntry?: boolean;
}

export const ScannerScanStep: React.FC<ScannerScanStepProps> = ({
    currentItem,
    currentProduct,
    t,
    itemInputRef,
    scannedItem,
    setScannedItem,
    scanOnlyItemHandlers,
    handleItemScan,
    isProcessingScan,
    requireQuantityEntry = true
}) => {
    const [isVerifyingQty, setIsVerifyingQty] = useState(false);
    const [enteredQty, setEnteredQty] = useState<number>(currentItem.expectedQty || 1);
    const [qtyError, setQtyError] = useState<string | null>(null);

    // Reset verification state when current item changes
    useEffect(() => {
        setIsVerifyingQty(false);
        setEnteredQty(currentItem.expectedQty || 1);
        setQtyError(null);
    }, [currentItem.productId, currentItem.sku]);

    // Fast-path scanner submission: validate barcode, then decide whether to prompt for qty
    const handleInitialBarcodeSubmit = () => {
        const raw = scannedItem.trim();
        if (!raw) return;

        const normalizedScan = raw.toUpperCase();
        const expectedSku = (currentItem.sku || '').toUpperCase();
        const expectedBarcode = (currentProduct?.barcode || '').toUpperCase();

        const isMatch = normalizedScan === expectedSku ||
            normalizedScan === expectedBarcode ||
            raw === currentItem.productId ||
            raw === currentProduct?.id;

        if (!isMatch) {
            handleItemScan(raw);
            return;
        }

        if (requireQuantityEntry && (currentItem.expectedQty || 1) > 1) {
            setIsVerifyingQty(true);
            setQtyError(null);
            return;
        }

        handleItemScan(raw, currentItem.expectedQty || 1);
    };

    const handleConfirmQuantity = () => {
        if (enteredQty <= 0) {
            setQtyError('Quantity must be greater than zero');
            return;
        }
        if (enteredQty > (currentItem.expectedQty || 1)) {
            setQtyError(`Cannot pick more than requested (${currentItem.expectedQty} units)`);
            return;
        }
        setQtyError(null);
        handleItemScan(scannedItem, enteredQty);
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-24 md:pb-0 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative inline-block shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] overflow-hidden flex items-center justify-center">
                    {currentItem.image && !currentItem.image.includes('placeholder') ? (
                        <img src={currentItem.image} className="w-full h-full object-cover" alt={currentItem.name} />
                    ) : (
                        <Package size={48} className="text-[var(--theme-text-muted)]" />
                    )}
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--theme-text-primary)] text-center">{currentItem.name}</h2>
                    <p className="text-center text-[var(--theme-text-muted)] font-mono tabular-nums text-xs mt-1">{currentItem.sku}</p>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <MetricBadge label="Qty" value={currentItem.expectedQty} color="border-primary/20 text-primary bg-primary/10" />
                <MetricBadge label="Stock" value={currentProduct?.stock || 0} color="border-[var(--theme-border)] text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)]" />
            </div>

            {!isVerifyingQty ? (
                /* Scanner Input */
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Scan className="text-primary" size={18} />
                        <p className="text-xs text-primary uppercase font-semibold">{t('warehouse.scanProductBarcode')}</p>
                    </div>
                    <input
                        ref={itemInputRef}
                        aria-label="Item Scanner Input"
                        type="text"
                        value={scannedItem}
                        onChange={(e) => setScannedItem(e.target.value)}
                        onKeyDown={(e) => {
                            scanOnlyItemHandlers.onKeyDown(e);
                            if (e.key === 'Enter') handleInitialBarcodeSubmit();
                        }}
                        onPaste={scanOnlyItemHandlers.onPaste}
                        className="woody-input font-mono text-base text-center min-h-[44px] rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] w-full"
                        autoFocus
                    />
                    <button
                        disabled={isProcessingScan || !scannedItem.trim()}
                        onClick={handleInitialBarcodeSubmit}
                        className="w-full mt-4 min-h-[44px] bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold py-3.5 text-base rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all touch-manipulation cursor-pointer"
                    >
                        {isProcessingScan ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        {t('warehouse.confirm')}
                    </button>
                </div>
            ) : (
                /* Zero-Trust Physical Quantity Verification */
                <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={() => setIsVerifyingQty(false)}
                            className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center gap-1.5 min-h-[38px] touch-manipulation"
                        >
                            <ArrowLeft size={14} /> Re-scan
                        </button>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Barcode Verified
                        </span>
                    </div>

                    <div className="text-center">
                        <p className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-1">
                            Physical Units Picked
                        </p>
                        <p className="text-xs text-[var(--theme-text-muted)] mb-3">
                            Requested by order: <span className="font-mono tabular-nums font-bold text-[var(--theme-text-primary)]">{currentItem.expectedQty} units</span>
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setEnteredQty(prev => Math.max(1, prev - 1))}
                                className="w-12 h-12 min-h-[44px] min-w-[44px] rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] active:scale-95 text-lg font-bold touch-manipulation"
                            >
                                <Minus size={18} />
                            </button>
                            <input
                                type="number"
                                min={1}
                                max={currentItem.expectedQty}
                                value={enteredQty}
                                onChange={(e) => setEnteredQty(parseInt(e.target.value, 10) || 0)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmQuantity();
                                }}
                                className="w-24 h-12 text-center text-xl font-mono tabular-nums font-bold rounded-xl bg-[var(--theme-bg-app)] border border-primary text-[var(--theme-text-primary)] focus:outline-none"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setEnteredQty(prev => Math.min(currentItem.expectedQty, prev + 1))}
                                className="w-12 h-12 min-h-[44px] min-w-[44px] rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)] active:scale-95 text-lg font-bold touch-manipulation"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {enteredQty < currentItem.expectedQty && (
                            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                                <AlertTriangle size={14} />
                                <span>Short pick: {enteredQty} of {currentItem.expectedQty} units</span>
                            </div>
                        )}

                        {qtyError && (
                            <p className="text-xs font-semibold text-rose-500 mt-2">{qtyError}</p>
                        )}
                    </div>

                    <button
                        disabled={isProcessingScan || enteredQty <= 0}
                        onClick={handleConfirmQuantity}
                        className="w-full mt-2 min-h-[44px] bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-semibold py-3.5 text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all touch-manipulation cursor-pointer"
                    >
                        {isProcessingScan ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        Confirm Pick of {enteredQty} Units
                    </button>
                </div>
            )}
        </div>
    );
};
