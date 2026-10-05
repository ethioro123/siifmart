import React, { useState, useEffect } from 'react';
import { Package, Scan, CheckCircle, RefreshCw, AlertTriangle, ArrowLeft, Plus, Minus } from 'lucide-react';
import { JobItem, Product } from '../../../types';

const MetricBadge = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className={`px-3 py-1 rounded-lg border flex flex-col items-center ${color}`}>
        <span className="text-[10px] uppercase font-bold opacity-80">{label}</span>
        <span className="text-lg font-mono font-bold">{value}</span>
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

    const handleInitialBarcodeSubmit = () => {
        if (!scannedItem.trim()) return;

        if (!requireQuantityEntry) {
            handleItemScan(scannedItem, currentItem.expectedQty);
            return;
        }

        // Verify barcode matches current item before prompting for quantity
        const normalized = scannedItem.toUpperCase().trim();
        const normSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();
        const normalizedInput = normSku(normalized);

        const getBarcodesArray = (barcodes: any): string[] => {
            if (!barcodes) return [];
            if (Array.isArray(barcodes)) return barcodes.filter(b => typeof b === 'string');
            if (typeof barcodes === 'string') {
                try {
                    const parsed = JSON.parse(barcodes);
                    if (Array.isArray(parsed)) return parsed;
                } catch {
                    return [barcodes.trim()];
                }
            }
            return [];
        };

        const aliasList = getBarcodesArray(currentProduct?.barcodes);
        const hasAliasMatch = aliasList.some(b => {
            const cleanB = b.toUpperCase().trim();
            return normalized === cleanB || normalizedInput === normSku(cleanB);
        });

        const isValid =
            normalized === currentItem.sku?.toUpperCase() ||
            normalized === currentProduct?.barcode?.toUpperCase() ||
            hasAliasMatch ||
            normalizedInput === normSku(currentItem.sku || '') ||
            normalizedInput === normSku(currentProduct?.barcode || '');

        if (isValid) {
            setIsVerifyingQty(true);
            setEnteredQty(currentItem.expectedQty || 1);
            setQtyError(null);
        } else {
            handleItemScan(scannedItem); // Will trigger the existing error handling & alert
        }
    };

    const handleConfirmQuantity = () => {
        if (enteredQty <= 0) {
            setQtyError('Quantity must be greater than zero');
            return;
        }
        if (enteredQty > currentItem.expectedQty) {
            setQtyError(`Cannot pick more than requested (${currentItem.expectedQty} units)`);
            return;
        }
        setQtyError(null);
        handleItemScan(scannedItem, enteredQty);
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6 pb-24 md:pb-0 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative inline-block shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-3xl border border-[#E2DCCE]/30 dark:border-[#A9CBA2]/10 bg-[#1C2620]/60 overflow-hidden flex items-center justify-center">
                    {currentItem.image && !currentItem.image.includes('placeholder') ? (
                        <img src={currentItem.image} className="w-full h-full object-cover" alt={currentItem.name} />
                    ) : (
                        <Package size={48} className="text-stone-500" />
                    )}
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#EAE5D9] text-center">{currentItem.name}</h2>
                    <p className="text-center text-stone-400 font-mono mt-1">{currentItem.sku}</p>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <MetricBadge label="Qty" value={currentItem.expectedQty} color="border-[#2C5E3B]/30 text-[#2C5E3B] dark:text-[#A9CBA2] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10" />
                <MetricBadge label="Stock" value={currentProduct?.stock || 0} color="border-stone-500 text-stone-450 bg-stone-100/10 dark:bg-white/5" />
            </div>

            {!isVerifyingQty ? (
                /* Scanner Input */
                <div className="glass-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Scan className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={20} />
                        <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] uppercase font-bold">{t('warehouse.scanProductBarcode')}</p>
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
                        className="woody-input font-mono text-lg text-center"
                        autoFocus
                    />
                    <button
                        disabled={isProcessingScan || !scannedItem.trim()}
                        onClick={handleInitialBarcodeSubmit}
                        className="w-full mt-4 woody-btn-primary py-4 text-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessingScan ? <RefreshCw className="animate-spin" /> : <CheckCircle />}
                        {t('warehouse.confirm')}
                    </button>
                </div>
            ) : (
                /* Zero-Trust Physical Quantity Verification */
                <div className="glass-panel p-5 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2DCCE]/40 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsVerifyingQty(false)}
                            className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1.5"
                        >
                            <ArrowLeft size={14} /> Re-scan
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Barcode Verified
                        </span>
                    </div>

                    <div className="text-center">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                            Physical Units Picked
                        </p>
                        <p className="text-[10px] text-stone-500 mb-3">
                            Requested by order: <span className="font-mono font-bold text-stone-300">{currentItem.expectedQty} units</span>
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setEnteredQty(prev => Math.max(1, prev - 1))}
                                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 text-lg font-bold"
                            >
                                <Minus size={20} />
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
                                className="w-24 h-12 text-center text-2xl font-mono font-black rounded-xl bg-[#1C2620] border-2 border-[#2C5E3B] text-white focus:outline-none"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setEnteredQty(prev => Math.min(currentItem.expectedQty, prev + 1))}
                                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 text-lg font-bold"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {enteredQty < currentItem.expectedQty && (
                            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 text-amber-400 text-xs font-bold">
                                <AlertTriangle size={14} />
                                <span>Short pick: {enteredQty} of {currentItem.expectedQty} units</span>
                            </div>
                        )}

                        {qtyError && (
                            <p className="text-xs font-bold text-rose-400 mt-2">{qtyError}</p>
                        )}
                    </div>

                    <button
                        disabled={isProcessingScan || enteredQty <= 0}
                        onClick={handleConfirmQuantity}
                        className="w-full mt-2 woody-btn-primary py-4 text-lg font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessingScan ? <RefreshCw className="animate-spin" /> : <CheckCircle />}
                        Confirm Pick of {enteredQty} Units
                    </button>
                </div>
            )}
        </div>
    );
};
