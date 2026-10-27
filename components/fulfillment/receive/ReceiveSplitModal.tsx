import { hasValidReceivingCounts } from '../../../utils/receivingCountValidation';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Box, Check, ArrowRight, ArrowLeft, Loader2, Package, Lock } from 'lucide-react';
import { Product, PurchaseOrder, WMSJob } from '../../../types';
import Badge from '../../shared/Badge';
import { useStore } from '../../../contexts/CentralStore';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { logger } from '../../../utils/logger';
import { generateBatchNumber } from '../../../utils/batchNumber';
import { convertToSellableUnits } from '../useReceiving';
import { formatPackBadge, formatPOItemDescription } from '../../procurement/utils';
import { useData } from '../../../contexts/DataContext';
import { resolveReceivingPolicy } from '../../../utils/receivingPolicy';
import { ItemAttributeBadges } from '../ItemAttributeBadges';
import { ReceiveStepIndicator, ReceiveStep } from './steps/ReceiveStepIndicator';
import { Step1ReceiveIntake } from './steps/Step1ReceiveIntake';
import { Step2ReceiveQualityBatch } from './steps/Step2ReceiveQualityBatch';
import { Step3ReceiveHandover } from './steps/Step3ReceiveHandover';
import { SplitVariant } from './ReceiveSplitCard';

interface ReceiveSplitModalProps {
    splitReceivingItem: any;
    splitReceivingPO: PurchaseOrder;
    splitVariants: Array<SplitVariant>;
    setSplitVariants: React.Dispatch<React.SetStateAction<any[]>>;
    setIsSplitReceiving: (val: boolean) => void;
    setSplitReceivingItem: (val: any) => void;
    setSplitReceivingPO: (val: any) => void;
    allProducts: Product[];
    receivePOSplit: (poId: string, lineItemId: string, variants: any[], locationId?: string, user?: { name: string; email: string }) => Promise<void>;
    handlePrintBatch: (items: any[]) => Promise<boolean>;
    setReprintItem: (item: any) => void;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
    jobs: WMSJob[];
    t: (key: string) => string;
}

export const ReceiveSplitModal: React.FC<ReceiveSplitModalProps> = ({
    splitReceivingItem,
    splitReceivingPO,
    splitVariants,
    setSplitVariants,
    setIsSplitReceiving,
    setSplitReceivingItem,
    setSplitReceivingPO,
    allProducts,
    receivePOSplit,
    handlePrintBatch,
    setReprintItem,
    isSubmitting,
    setIsSubmitting,
    jobs,
    t
}) => {
    const { user } = useStore();
    const { settings, effectiveCountry } = useData();
    const isBlindReceiving = resolveReceivingPolicy(settings, effectiveCountry).blind;

    const [step, setStep] = useState<ReceiveStep>('INTAKE');
    const [barcodeInput, setBarcodeInput] = useState<{ [variantId: string]: string }>({});
    const [activeVariantForScan, setActiveVariantForScan] = useState<string | null>(null);
    const [localSubmitting, setLocalSubmitting] = useState(false);

    const scanOnlyHandlers = useScanOnly((val) => {
        if (activeVariantForScan) {
            setBarcodeInput(prev => ({ ...prev, [activeVariantForScan]: val }));
        }
    });

    const cleanSku = (s?: string) => s ? s.replace(/[-\s]/g, '').toUpperCase() : '';

    const expectedSellable = useMemo(() => {
        if (!splitReceivingItem) return 0;
        const conv = convertToSellableUnits(splitReceivingItem.orderedPackages || splitReceivingItem.quantity, splitReceivingItem);
        return Math.max(splitReceivingItem.quantity || 0, conv);
    }, [splitReceivingItem]);

    const previouslyReceived = useMemo(() => {
        if (!splitReceivingPO || !splitReceivingItem) return 0;
        const poJobs = jobs.filter(j => (j.orderRef === splitReceivingPO.id || (splitReceivingPO.poNumber && j.orderRef === splitReceivingPO.poNumber) || (splitReceivingPO.po_number && j.orderRef === splitReceivingPO.po_number)) && j.type === 'PUTAWAY');
        let count = 0;
        const targetKey = cleanSku(splitReceivingItem.sku) || splitReceivingItem.productId;
        poJobs.forEach(job => {
            job.lineItems.forEach(item => {
                const jobKey = cleanSku(item.sku) || item.productId;
                if (jobKey && targetKey && jobKey === targetKey) {
                    count += (item.expectedQty || 0);
                }
            });
        });
        return count;
    }, [splitReceivingPO, splitReceivingItem, jobs]);

    const totalScanned = splitVariants.reduce((acc, v) => acc + (v.quantity || 0), 0);
    const countsValid = hasValidReceivingCounts(splitVariants);
    const remaining = Math.max(0, expectedSellable - previouslyReceived - totalScanned);
    const progress = Math.min(100, expectedSellable > 0 ? ((previouslyReceived + totalScanned) / expectedSellable) * 100 : 0);

    const handleAddBarcode = (variantId: string) => {
        const code = barcodeInput[variantId];
        if (!code) return;

        const matchedProduct = allProducts?.find(p => 
            (p.siteId || p.site_id) === splitReceivingPO.siteId && (p.barcode === code || (Array.isArray(p.barcodes) && p.barcodes.includes(code)))
        );

        setSplitVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                const current = v.barcodes || [];
                if (current.includes(code)) return v;
                return { 
                    ...v, 
                    barcodes: [...current, code],
                    sku: (v.sku && v.sku !== 'UNKNOWN') ? v.sku : (matchedProduct?.sku || v.sku),
                    productId: v.productId || matchedProduct?.id
                };
            }
            return v;
        }));
        setBarcodeInput(prev => ({ ...prev, [variantId]: '' }));
    };

    const handleRemoveBarcode = (variantId: string, code: string) => {
        setSplitVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                return { ...v, barcodes: (v.barcodes || []).filter((b: string) => b !== code) };
            }
            return v;
        }));
    };

    const handleAddSplit = () => {
        const newId = `split-${Date.now()}`;
        const newLot = generateBatchNumber({
            sku: splitReceivingItem?.sku,
            sequence: splitVariants.length + 1
        });
        setSplitVariants(prev => [
            ...prev,
            {
                id: newId,
                sku: splitReceivingItem?.sku,
                skuType: 'existing',
                productId: splitReceivingItem?.productId || splitReceivingItem?.id,
                productName: splitReceivingItem?.name || splitReceivingItem?.productName,
                // Blind receiving must start every split with an empty physical count.
                quantity: isBlindReceiving ? 0 : Math.max(1, remaining),
                batchNumber: newLot,
                condition: 'Good',
                barcodes: []
            }
        ]);
    };

    const handleRemoveSplit = (id: string) => {
        if (splitVariants.length <= 1) return;
        setSplitVariants(prev => prev.filter(v => v.id !== id));
    };

    const handleUpdateVariant = (id: string, updated: Partial<SplitVariant>) => {
        setSplitVariants(prev => prev.map(v => v.id === id ? { ...v, ...updated } : v));
    };

    const receiptLock = useRef(false);
    const handleConfirmReceipt = async () => {
        if (isSubmitting || localSubmitting || receiptLock.current) return;
        if (!countsValid) {
            alert('Enter a valid positive physical count for every split, or remove unused splits.');
            return;
        }

        const processedVariants = splitVariants.map((v, i) => ({
            ...v,
            batchNumber: v.batchNumber || generateBatchNumber({
                sku: v.sku || splitReceivingItem?.sku,
                sequence: i + 1
            })
        }));

        receiptLock.current = true;
        setIsSubmitting(true);
        setLocalSubmitting(true);
        try {
            await receivePOSplit(
                splitReceivingPO.id,
                splitReceivingItem.id || splitReceivingItem.productId,
                processedVariants,
                undefined,
                user ? { name: user.name, email: user.email || '' } : undefined
            );

            const firstVariant = processedVariants[0];
            const reprintSku = firstVariant?.sku || splitReceivingItem.sku || 'UNKNOWN';
            const reprintName = firstVariant?.productName || splitReceivingItem.productName || 'Unknown Product';

            setReprintItem({
                sku: reprintSku,
                name: reprintName,
                qty: firstVariant.quantity,
                copies: 1,
                receiptSaved: true,
                condition: firstVariant.condition,
                price: splitReceivingItem.retailPrice,
                category: splitReceivingItem.category,
                batchNumber: firstVariant?.batchNumber,
                expiry: firstVariant?.expiryDate,
                packQuantity: splitReceivingItem.packQuantity || 1,
                poNumber: splitReceivingPO.poNumber || (splitReceivingPO as any).po_number
            });

            setIsSplitReceiving(false);
            setSplitReceivingItem(null);
            setSplitReceivingPO(null);
            setSplitVariants([]);
        } catch (error: any) {
            logger.error('ReceiveSplitModal', 'Split error:', error);
            alert(error.message || 'Failed to receive split: an unexpected error occurred.');
        } finally {
            receiptLock.current = false;
            setIsSubmitting(false);
            setLocalSubmitting(false);
        }
    };

    const handlePrintPalletLabels = async () => {
        const itemsToPrint = splitVariants.map(v => ({
            sku: v.sku || splitReceivingItem.sku,
            name: v.productName || splitReceivingItem.name || splitReceivingItem.productName,
            qty: v.quantity,
            copies: 1,
            receiptSaved: false,
            condition: v.condition,
            packQuantity: splitReceivingItem.packQuantity,
            batchNumber: v.batchNumber,
            expiry: v.expiryDate,
            poNumber: splitReceivingPO.poNumber || (splitReceivingPO as any).po_number
        }));
        await handlePrintBatch(itemsToPrint);
    };

    const handleClose = () => {
        setIsSplitReceiving(false);
        setSplitReceivingItem(null);
        setSplitReceivingPO(null);
        setSplitVariants([]);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[92dvh] md:h-[88vh] rounded-3xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-2xl relative overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <Box size={22} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h2 className="text-base sm:text-xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase truncate">
                                    {formatPOItemDescription(splitReceivingItem) || splitReceivingItem.productName}
                                </h2>
                                <Badge variant="neutral" className="bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] font-mono text-[11px] rounded-full px-2.5 py-0.5">
                                    PO #{splitReceivingPO.poNumber || splitReceivingPO.id}
                                </Badge>
                                {(() => {
                                    const badge = formatPackBadge(splitReceivingItem);
                                    return badge ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                                            <Package size={12} className="shrink-0" /> {badge}
                                        </span>
                                    ) : null;
                                })()}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider flex-wrap">
                                <span className="font-mono text-[11px]">
                                    SKU: <strong className="text-[var(--theme-text-primary)]">{splitReceivingItem.sku}</strong>
                                </span>
                                <span>·</span>
                                <span>Supplier: {splitReceivingPO.supplierName}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Step Indicator */}
                <ReceiveStepIndicator
                    currentStep={step}
                    setStep={setStep}
                    hasQuantityEntered={countsValid}
                    t={t}
                />

                {/* Step Content */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {step === 'INTAKE' && (
                        <Step1ReceiveIntake
                            splitReceivingItem={splitReceivingItem}
                            splitReceivingPO={splitReceivingPO}
                            allProducts={allProducts}
                            isBlindReceiving={isBlindReceiving}
                            expectedSellable={expectedSellable}
                            previouslyReceived={previouslyReceived}
                            t={t}
                        />
                    )}

                    {step === 'QUALITY' && (
                        <Step2ReceiveQualityBatch
                            splitVariants={splitVariants}
                            setSplitVariants={setSplitVariants}
                            totalScanned={totalScanned}
                            expectedSellable={expectedSellable}
                            previouslyReceived={previouslyReceived}
                            isBlindReceiving={isBlindReceiving}
                            remaining={remaining}
                            progress={progress}
                            barcodeInput={barcodeInput}
                            setBarcodeInput={setBarcodeInput}
                            setActiveVariantForScan={setActiveVariantForScan}
                            scanOnlyHandlers={scanOnlyHandlers}
                            handleAddSplit={handleAddSplit}
                            handleRemoveSplit={handleRemoveSplit}
                            handleUpdateVariant={handleUpdateVariant}
                            handleAddBarcode={handleAddBarcode}
                            handleRemoveBarcode={handleRemoveBarcode}
                            t={t}
                        />
                    )}

                    {step === 'HANDOVER' && (
                        <Step3ReceiveHandover
                            splitReceivingPO={splitReceivingPO}
                            splitReceivingItem={splitReceivingItem}
                            splitVariants={splitVariants}
                            totalScanned={totalScanned}
                            isSubmitting={isSubmitting || localSubmitting}
                            onPrintLabels={handlePrintPalletLabels}
                            t={t}
                        />
                    )}
                </div>

                {step === 'QUALITY' && !countsValid && <p role="status" className="px-4 py-2 text-xs text-[var(--theme-text-secondary)]">{t('warehouse.enterPositiveCountAlert') || 'Enter a positive physical count for each split, or remove unused splits, before continuing.'}</p>}
                {/* Bottom Navigation Toolbar */}
                <div className="p-3 md:p-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex items-center justify-between gap-3 shrink-0">
                    <div>
                        {step === 'INTAKE' ? (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="min-h-[44px] px-4 md:px-5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold text-xs uppercase tracking-wider transition-colors active:scale-95 cursor-pointer touch-manipulation"
                            >
                                {t('warehouse.dismiss') || 'Dismiss'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    if (step === 'HANDOVER') setStep('QUALITY');
                                    else if (step === 'QUALITY') setStep('INTAKE');
                                }}
                                className="min-h-[44px] px-4 md:px-5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-semibold text-xs uppercase tracking-wider flex items-center gap-2 hover:border-[var(--theme-accent)]/30 transition-colors active:scale-95 cursor-pointer touch-manipulation"
                            >
                                <ArrowLeft size={16} />
                                <span>{t('warehouse.back') || 'Back'}</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {step === 'INTAKE' && (
                            <button
                                type="button"
                                onClick={() => setStep('QUALITY')}
                                className="min-h-[44px] px-5 md:px-7 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
                            >
                                <span>{t('warehouse.startQualityAndCount') || 'Start Quality & Count'}</span>
                                <ArrowRight size={16} />
                            </button>
                        )}

                        {step === 'QUALITY' && (
                            <button
                                type="button"
                                disabled={!countsValid}
                                onClick={() => setStep('HANDOVER')}
                                className={`min-h-[44px] px-5 md:px-7 rounded-xl font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all touch-manipulation ${
                                    countsValid
                                        ? 'bg-[var(--theme-accent)] hover:opacity-90 text-white cursor-pointer active:scale-95'
                                        : 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] cursor-not-allowed opacity-50'
                                }`}
                            >
                                {!countsValid && <Lock size={14} className="text-[var(--theme-text-muted)]" />}
                                <span>{countsValid ? (t('warehouse.reviewAndHandover') || 'Review & Handover') : (t('warehouse.countItemsToProceed') || 'Count Items to Proceed')}</span>
                                <ArrowRight size={16} />
                            </button>
                        )}

                        {step === 'HANDOVER' && (
                            <button
                                type="button"
                                onClick={handleConfirmReceipt}
                                disabled={isSubmitting || localSubmitting || !countsValid}
                                className="min-h-[44px] px-6 md:px-8 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation disabled:opacity-50"
                            >
                                {isSubmitting || localSubmitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <Check size={18} />
                                        <span>{t('warehouse.confirmAndCreatePutaway') || 'Confirm & Create Putaway'}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiveSplitModal;
