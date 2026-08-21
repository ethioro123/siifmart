import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, CheckCircle, RotateCcw, Maximize2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { playBeep } from '../../../utils/audioUtils';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { isWeightBased, isVolumeBased, getEffectivePackageSize, getSellUnit, SELL_UNITS } from '../../../utils/units';
import { PackScannerStatusView } from './PackScannerStatusView';
import { PackScannerItemTally } from './PackScannerItemTally';

const normalizeSku = (s: string) => s.replace(/[-\/\s]/g, '').toUpperCase();

interface PackScannerProps {
    job: WMSJob;
    products: Product[];
    onClose: () => void;
    onConfirmPack: (itemIndex: number, qty: number) => Promise<void>;
    onCompleteJob: () => void;
    isProcessing: boolean;
}

export const PackScanner: React.FC<PackScannerProps> = ({
    job,
    products,
    onClose,
    onConfirmPack,
    onCompleteJob,
    isProcessing
}) => {
    const { t } = useLanguage();

    // 2-step flow: SCAN → CONFIRM_QTY
    const [step, setStep] = useState<'SCAN' | 'CONFIRM_QTY'>('SCAN');
    const [inputVal, setInputVal] = useState('');
    const [qtyVal, setQtyVal] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<string>('UNIT');
    const [matchedIndex, setMatchedIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Overlays
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);
    const qtyRef = useRef<HTMLInputElement>(null);
    const lastStepChangeRef = useRef<number>(0);

    // Scan-only enforcement for SCAN step
    const scanOnlyHandlers = useScanOnly(setInputVal, {
        onReject: (reason) => {
            setErrorMsg(reason);
            setShowError(true);
            setTimeout(() => setShowError(false), 2000);
        }
    });

    // Helpers
    const getProduct = (item: any) => {
        if (!item) return undefined;
        // 1. Direct productId exact match
        if (item.productId) {
            const byId = products.find(p => p.id === item.productId);
            if (byId) return byId;
        }
        // 2. Site-scoped SKU match
        const targetSiteId = job.siteId || (job as any).site_id;
        return products.find(p =>
            (p.sku === item.sku || (item.sku && p.sku && normalizeSku(p.sku) === normalizeSku(item.sku))) &&
            (!targetSiteId || p.siteId === targetSiteId || p.site_id === targetSiteId)
        ) || products.find(p => p.sku === item.sku || (item.sku && p.sku && normalizeSku(p.sku) === normalizeSku(item.sku)));
    };

    const getItemMeasureQty = (item: any, productInfo?: Product | null): number | null => {
        if (!item) return null;
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return (item as any).requestedMeasureQty;
        }
        // Use product if provided, otherwise attempt product lookup, finally fall back to item's own fields
        const prod = productInfo !== undefined ? productInfo : getProduct(item);
        const unit = prod?.unit || item.unit;
        const size = prod?.size || item.size;
        if (unit && size) {
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = getEffectivePackageSize(unit, size);
            if (isWeightVol && sizeNum > 1) {
                const expected = item.expectedQty || (item as any).quantity || 0;
                return expected * sizeNum;
            }
        }
        return null;
    };

    const totalItems = job.lineItems?.length || 0;
    // Items are "done" if: Completed, already Picked (verified in Pick phase), or packed in this session
    const packedItems = useMemo(() =>
        job.lineItems?.filter(i =>
            i.status === 'Completed' ||
            i.status === 'Picked' ||
            (i as any).packed === true
        ) || [],
        [job.lineItems]
    );
    const isFullyPacked = packedItems.length === totalItems && totalItems > 0;

    // Next item needing Pack-phase verification: only Pending or In-Progress items
    const nextUnpackedItem = useMemo(() =>
        job.lineItems?.find(i =>
            i.status !== 'Completed' &&
            i.status !== 'Picked' &&
            !(i as any).packed
        ),
        [job.lineItems]
    );

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (step === 'CONFIRM_QTY') {
                if (qtyRef.current) qtyRef.current.focus();
            } else {
                if (inputRef.current) inputRef.current.focus();
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, [step, isProcessing]);

    useEffect(() => {
        lastStepChangeRef.current = Date.now();
        setInputVal('');
        if (step === 'SCAN') {
            setQtyVal('');
        }
    }, [step, matchedIndex]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Date.now() - lastStepChangeRef.current < 250) return;

        const rawVal = inputVal.trim();
        if (step === 'SCAN' && !rawVal) return;
        if (isProcessing || isSubmitting) return;

        const val = rawVal.toUpperCase();
        const normVal = normalizeSku(val);

        if (step === 'SCAN') {
            let foundIndex = -1;

            if (job.lineItems) {
                for (let index = 0; index < job.lineItems.length; index++) {
                    const item = job.lineItems[index];
                    // Skip items already picked/completed — only scan Pending/In-Progress items
                    if (
                        item.status === 'Completed' ||
                        item.status === 'Picked' ||
                        (item as any).packed === true
                    ) continue;

                    const product = getProduct(item);
                    const normItemSku = item.sku ? normalizeSku(item.sku) : '';
                    const normProdSku = product?.sku ? normalizeSku(product.sku) : '';
                    const normBarcode = product?.barcode ? normalizeSku(product.barcode) : '';

                    const matchesItemSku = normItemSku !== '' && normItemSku === normVal;
                    const matchesProdSku = normProdSku !== '' && normProdSku === normVal;
                    const matchesBarcode = normBarcode !== '' && normBarcode === normVal;

                    if (matchesItemSku || matchesProdSku || matchesBarcode) {
                        foundIndex = index;
                        break; // Stop at FIRST matching unpacked line item
                    }
                }
            }

            if (foundIndex > -1) {
                setMatchedIndex(foundIndex);
                const matchedItem = job.lineItems![foundIndex];
                const prod = getProduct(matchedItem);
                const effectiveUnit = prod?.unit || matchedItem?.unit || 'UNIT';
                setSelectedUnit(effectiveUnit);
                playBeep('success');
                setStep('CONFIRM_QTY');
                // Always pre-fill with expected sellable unit count (e.g. 20 packs)
                const expectedCases = matchedItem.expectedQty || 1;
                setQtyVal(expectedCases.toString());
            } else {
                playBeep('error');
                setErrorMsg('Item not found in this Pack job.');
                setShowError(true);
                setInputVal('');
                setTimeout(() => {
                    setShowError(false);
                    scanOnlyHandlers.reset();
                }, 2000);
            }
        } else if (step === 'CONFIRM_QTY') {
            const qty = parseFloat(qtyVal);
            if (matchedIndex === null) return;

            const matchedItem = job.lineItems![matchedIndex];
            const expectedCases = matchedItem.expectedQty || 1;
            const displayMax = expectedCases;

            let finalQty = qty;
            if (isNaN(finalQty) || finalQty <= 0) {
                playBeep('error');
                setErrorMsg(`Invalid Quantity (1-${displayMax})`);
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
                return;
            }

            if (finalQty > displayMax + 0.001) {
                const confirmed = window.confirm(`Overpack detected. You entered ${finalQty} but expected ${displayMax}. Are you sure?`);
                if (!confirmed) return;
            } else if (finalQty < displayMax - 0.001) {
                const confirmed = window.confirm(`Short pack detected. You entered ${finalQty} but expected ${displayMax}. Are you sure?`);
                if (!confirmed) return;
            }

            setIsSubmitting(true);
            try {
                await onConfirmPack(matchedIndex, finalQty);
                setSuccessMsg(`Packed ${finalQty}x ${matchedItem.name}`);
                setShowSuccess(true);
                playBeep('success');
                setTimeout(() => {
                    setShowSuccess(false);
                    setStep('SCAN');
                    setMatchedIndex(null);
                    scanOnlyHandlers.reset();
                }, 1500);
            } catch (err: any) {
                playBeep('error');
                setErrorMsg(err.message || 'Saving failed');
                setShowError(true);
                setTimeout(() => {
                    setShowError(false);
                    setStep('SCAN');
                    setMatchedIndex(null);
                    scanOnlyHandlers.reset();
                }, 2500);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const matchedItem = matchedIndex !== null ? job.lineItems?.[matchedIndex] : null;
    const matchedProduct = matchedItem ? getProduct(matchedItem) : null;

    return (
        <div className="fixed inset-0 z-[200] bg-[#FAF8F5] dark:bg-[#1C2620] flex flex-col transition-colors duration-500">
            {/* Top Bar */}
            <div className="p-4 bg-[#EAE5D9] dark:bg-[#1C2620]/80 border-b border-[#E2DCCE] dark:border-[#A9CBA2]/10 flex justify-between items-center text-gray-900 dark:text-[#EAE5D9]">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-500 dark:text-[#A9CBA2]/70 hover:text-gray-900 dark:hover:text-[#EAE5D9]" aria-label={t('warehouse.dismiss')}>
                        <X size={24} />
                    </button>
                    <div>
                        <h3 className="font-bold text-lg uppercase tracking-wider">
                            {step === 'SCAN' ? t('warehouse.scanProductBarcode') : t('warehouse.putaway.progress')}
                        </h3>
                        <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-mono">JOB: {formatJobId(job)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-[#E2DCCE] dark:bg-[#2C5E3B]/20 px-2 py-1 rounded text-gray-700 dark:text-[#A9CBA2]">
                        {packedItems.length}/{totalItems}
                    </span>
                    <button
                        onClick={() => {
                            if (document.fullscreenElement) document.exitFullscreen();
                            else document.documentElement.requestFullscreen();
                        }}
                        title="Toggle Fullscreen"
                        aria-label="Toggle Fullscreen"
                        className="p-2 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 rounded-xl text-gray-550 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <Maximize2 size={20} />
                    </button>
                </div>
            </div>

            {/* Main View */}
            <div className="flex-1 relative w-full overflow-hidden flex flex-col">
                <div className={`absolute inset-0 opacity-20 blur-3xl transition-colors duration-700 pointer-events-none ${step === 'CONFIRM_QTY' ? 'bg-[#A9CBA2]' : 'bg-[#2C5E3B]'}`} />

                <div className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col items-center p-3 md:p-6 pb-6">

                    {/* Status / content area */}
                    <PackScannerStatusView
                        step={step}
                        showSuccess={showSuccess}
                        showError={showError}
                        successMsg={successMsg}
                        errorMsg={errorMsg}
                        isFullyPacked={isFullyPacked}
                        matchedItem={matchedItem}
                        matchedProduct={matchedProduct}
                        nextUnpackedItem={nextUnpackedItem}
                        job={job}
                        getItemMeasureQty={getItemMeasureQty}
                        getProduct={getProduct}
                    />

                    {/* Input Area */}
                    <form onSubmit={handleScan} className="w-full max-w-md relative z-20 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#2C5E3B] to-[#A9CBA2] rounded-xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />

                        {!isFullyPacked && (
                            <>
                                {step === 'CONFIRM_QTY' ? (
                                    <div className="relative flex items-stretch w-full bg-[#FAF8F5] dark:bg-[#1C2620]/90 border-2 border-[#2C5E3B] dark:border-[#A9CBA2]/40 rounded-xl overflow-hidden shadow-md focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] z-10">
                                        <input
                                            ref={qtyRef}
                                            type="number"
                                            inputMode="decimal"
                                            pattern="[0-9]*"
                                            aria-label="Confirm quantity"
                                            title="Confirm quantity"
                                            value={qtyVal}
                                            onChange={(e) => setQtyVal(e.target.value)}
                                            className="flex-1 bg-transparent py-2.5 px-3 text-center text-2xl md:text-3xl font-mono font-bold text-gray-900 dark:text-[#EAE5D9] placeholder:text-gray-300 dark:placeholder:text-[#A9CBA2]/30 outline-none"
                                            placeholder="QTY"
                                            autoFocus
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <div className="bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2] border-l border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 px-3.5 py-2.5 text-xs font-mono font-black uppercase flex items-center justify-center shrink-0">
                                            {(() => {
                                                const unitDef = getSellUnit(selectedUnit);
                                                const sizeStr = matchedProduct?.size || matchedItem?.size;
                                                const isWeightVol = (unitDef.category === 'weight' || unitDef.category === 'volume') && !!sizeStr;
                                                return isWeightVol ? `packs (${sizeStr}${unitDef.shortLabel})` : unitDef.shortLabel.toUpperCase();
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        aria-label="Scan barcode"
                                        title="Scan barcode"
                                        value={inputVal}
                                        onChange={(e) => setInputVal(e.target.value)}
                                        onKeyDown={scanOnlyHandlers.onKeyDown}
                                        onPaste={scanOnlyHandlers.onPaste}
                                        className="w-full bg-[#FAF8F5] dark:bg-[#1C2620]/90 border-2 rounded-xl py-3 px-4 text-center text-lg md:text-xl font-mono text-gray-900 dark:text-[#EAE5D9] placeholder:text-gray-300 dark:placeholder:text-[#A9CBA2]/30 focus:outline-none relative z-10 shadow-md transition-all border-[#E2DCCE] dark:border-[#A9CBA2]/10 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]/40"
                                        placeholder="SCAN BARCODE"
                                        autoFocus
                                        disabled={isProcessing}
                                    />
                                )}
                            </>
                        )}

                        {isProcessing && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30">
                                <RotateCcw className="animate-spin text-gray-900 dark:text-white opacity-50" size={18} />
                            </div>
                        )}

                        {/* Mobile Action Button */}
                        <button
                            type={isFullyPacked ? 'button' : 'submit'}
                            onClick={isFullyPacked ? onCompleteJob : undefined}
                            disabled={(!isFullyPacked && step === 'SCAN' && !inputVal.trim()) || isProcessing || isSubmitting}
                            className={`mt-3 w-full py-3.5 md:py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow-md border relative z-30 font-black text-xs md:text-sm uppercase tracking-widest ${
                                isProcessing || isSubmitting
                                    ? 'bg-gray-100 dark:bg-[#1C2620]/50 border-gray-200 dark:border-white/5 text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed'
                                    : isFullyPacked
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white shadow-green-500/25'
                                        : step === 'CONFIRM_QTY'
                                            ? 'bg-[#2C5E3B] border-[#A9CBA2]/40 text-white shadow-[#2C5E3B]/30'
                                            : !inputVal.trim()
                                                ? 'bg-gray-200 dark:bg-[#1C2620]/50 border-gray-100 dark:border-white/5 text-gray-400 dark:text-gray-600 grayscale opacity-50 cursor-not-allowed'
                                                : 'bg-[#2C5E3B] hover:bg-[#1B3520] border-[#2C5E3B]/20 text-white'
                            }`}
                        >
                            {isProcessing || isSubmitting ? (
                                <RotateCcw size={18} className="animate-spin" />
                            ) : (
                                <CheckCircle size={18} />
                            )}
                            {isProcessing || isSubmitting
                                ? 'Saving...'
                                : isFullyPacked
                                    ? t('warehouse.completed')
                                    : step === 'CONFIRM_QTY'
                                        ? 'CONFIRM PACK'
                                        : t('warehouse.scanSkuToConfirm')}
                        </button>
                    </form>

                    {/* Packed items tally — only shown while still scanning */}
                    {packedItems.length > 0 && !isFullyPacked && (
                        <PackScannerItemTally
                            packedItems={packedItems}
                            totalItems={totalItems}
                            getItemMeasureQty={getItemMeasureQty}
                            getProduct={getProduct}
                        />
                    )}

                </div>
            </div>
        </div>
    );
};
