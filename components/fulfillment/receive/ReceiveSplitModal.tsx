import React, { useState } from 'react';
import { X, Trash2, Plus, Box, Check, ScanBarcode, ChevronRight, Clock, AlertTriangle, Loader2, Package } from 'lucide-react';
import { Product, PurchaseOrder, WMSJob } from '../../../types';
import Badge from '../../shared/Badge';
import { useStore } from '../../../contexts/CentralStore';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { logger } from '../../../utils/logger';
import { ReceiveSplitCard } from './ReceiveSplitCard';
import { generateBatchNumber } from '../../../utils/batchNumber';
import { convertToSellableUnits } from '../useReceiving';
import { formatPackBadge, formatPOItemDescription, getPOItemPackagingSummary } from '../../procurement/utils';
import { useData } from '../../../contexts/DataContext';
import { resolveReceivingPolicy } from '../../../utils/receivingPolicy';

interface ReceiveSplitModalProps {
    splitReceivingItem: any;
    splitReceivingPO: PurchaseOrder;
    splitVariants: Array<{
        id: string;
        sku: string;
        skuType: 'existing' | 'new';
        productId?: string;
        productName?: string;
        quantity: number;
        barcode?: string;
        barcodes?: string[];
        expiryDate?: string;
        batchNumber?: string;
        temperature?: string;
        condition?: string;
    }>;
    setSplitVariants: React.Dispatch<React.SetStateAction<any[]>>;
    setIsSplitReceiving: (val: boolean) => void;
    setSplitReceivingItem: (val: any) => void;
    setSplitReceivingPO: (val: any) => void;
    allProducts: Product[];
    receivePOSplit: (poId: string, lineItemId: string, variants: any[], locationId?: string, user?: { name: string; email: string }) => Promise<void>;
    handlePrintBatch: (items: any[]) => Promise<void>;
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
    const [barcodeInput, setBarcodeInput] = useState<{ [variantId: string]: string }>({});
    const [activeVariantForScan, setActiveVariantForScan] = useState<string | null>(null);
    const scanOnlyHandlers = useScanOnly((val) => {
        if (activeVariantForScan) {
            setBarcodeInput(prev => ({ ...prev, [activeVariantForScan]: val }));
        }
    });
    const [localSubmitting, setLocalSubmitting] = useState(false);

    const handleAddBarcode = (variantId: string) => {
        const code = barcodeInput[variantId];
        if (!code) return;

        const matchedProduct = allProducts?.find(p => 
            p.barcode === code || (Array.isArray(p.barcodes) && p.barcodes.includes(code))
        );

        setSplitVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                const current = v.barcodes || [];
                if (current.includes(code)) return v; // No duplicates
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

    const cleanSku = (s?: string) => s ? s.replace(/[-\s]/g, '').toUpperCase() : '';
    const expectedSellable = React.useMemo(() => {
        if (!splitReceivingItem) return 0;
        const conv = convertToSellableUnits(splitReceivingItem.orderedPackages || splitReceivingItem.quantity, splitReceivingItem);
        return Math.max(splitReceivingItem.quantity || 0, conv);
    }, [splitReceivingItem]);

    const previouslyReceived = React.useMemo(() => {
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
    const remaining = Math.max(0, expectedSellable - previouslyReceived - totalScanned);
    const progress = Math.min(100, expectedSellable > 0 ? ((previouslyReceived + totalScanned) / expectedSellable) * 100 : 0);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="w-full max-w-6xl max-h-[90vh] md:max-h-[95vh] rounded-3xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-2xl relative overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[var(--theme-border)] relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 bg-[var(--theme-bg-subtle)]">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="hidden md:flex p-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] items-center justify-center shadow-sm">
                            <Box size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                <h3 className="text-lg md:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight truncate">{formatPOItemDescription(splitReceivingItem) || splitReceivingItem.productName}</h3>
                                <Badge variant="neutral" className="bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] font-mono text-[11px] rounded-full px-2.5 py-0.5">PO #{splitReceivingPO.poNumber}</Badge>
                                {(() => {
                                    const badge = formatPackBadge(splitReceivingItem);
                                    return badge ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                                            <Package size={12} className="shrink-0" /> {badge}
                                        </span>
                                    ) : null;
                                })()}
                            </div>
                            <div className="hidden md:flex items-center gap-3 mt-1.5 text-xs text-[var(--theme-text-secondary)] font-medium">
                                <p className="font-mono">
                                    SKU: <span className="text-[var(--theme-text-primary)] font-semibold">{splitReceivingItem.sku}</span>
                                </p>
                                <span className="w-1 h-1 rounded-full bg-[var(--theme-border)]" />
                                <p>
                                    {t('warehouse.supplier')}: <span className="text-[var(--theme-text-primary)] font-semibold">{splitReceivingPO.supplierName}</span>
                                </p>
                                <span className="w-1 h-1 rounded-full bg-[var(--theme-border)]" />
                                <p>
                                    Target: <span className="text-[var(--theme-text-primary)] font-semibold font-mono">{expectedSellable} units</span>
                                    {splitReceivingItem.orderedPackages && splitReceivingItem.orderedPackages !== expectedSellable && (
                                        <span className="text-[var(--theme-text-secondary)] ml-1">({splitReceivingItem.orderedPackages} pkgs)</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => { setIsSplitReceiving(false); setSplitReceivingItem(null); setSplitReceivingPO(null); setSplitVariants([]); }}
                        className="p-2.5 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center absolute top-4 right-4 md:relative md:top-auto md:right-auto"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Dashboard */}
                <div className="px-4 md:px-6 py-4 bg-[var(--theme-bg-card)] border-b border-[var(--theme-border)] flex flex-wrap gap-4 md:gap-8 items-center relative overflow-hidden">
                    {/* Progress Bar Background */}
                    {!isBlindReceiving && (
                        <div className="absolute bottom-0 left-0 h-1 bg-[var(--theme-bg-subtle)] w-full overflow-hidden">
                            <div
                                ref={el => el?.style.setProperty('width', `${Math.min(100, Math.max(0, progress))}%`)}
                                className={`h-full transition-all duration-300 ${remaining === 0 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            />
                        </div>
                    )}

                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--theme-text-secondary)] mb-1">{t('warehouse.expectedQty')}</span>
                        <div className="flex items-baseline gap-1.5">
                            {isBlindReceiving ? (
                                <span className="text-xl md:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums font-mono tracking-widest">
                                    *** <span className="text-[11px] uppercase font-sans font-medium text-amber-700 dark:text-amber-300">(Blind)</span>
                                </span>
                            ) : (
                                <>
                                    <span className="text-2xl md:text-3xl font-bold text-[var(--theme-text-primary)] tabular-nums font-mono">{expectedSellable}</span>
                                    {splitReceivingItem.orderedPackages && splitReceivingItem.orderedPackages !== expectedSellable && (
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono">({splitReceivingItem.orderedPackages} pkgs)</span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="h-8 md:h-10 w-px bg-[var(--theme-border)]" />

                    <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider font-semibold mb-1 text-[var(--theme-text-secondary)]">
                            {t('warehouse.receivedQty')}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-2xl md:text-3xl font-bold tabular-nums font-mono ${!isBlindReceiving && remaining === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--theme-text-primary)]'}`}>
                                {previouslyReceived + totalScanned}
                            </span>
                            {previouslyReceived > 0 && (
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                    ({previouslyReceived} prev + {totalScanned} new)
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1" />

                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 shadow-sm transition-all font-semibold font-mono text-sm ${isBlindReceiving ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400' : remaining === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)]'}`}>
                        {isBlindReceiving ? (
                            <Clock className="text-amber-600 dark:text-amber-400" size={16} />
                        ) : remaining === 0 ? (
                            <Check className="text-emerald-600 dark:text-emerald-400" size={16} />
                        ) : remaining > 0 ? (
                            <Clock className="text-amber-600 dark:text-amber-400 animate-pulse" size={16} />
                        ) : (
                            <AlertTriangle className="text-rose-500 dark:text-rose-400" size={16} />
                        )}
                        <p className="tabular-nums">
                            {isBlindReceiving ? 'Blind Mode Active' : remaining === 0 ? t('warehouse.matched') : remaining > 0 ? `${remaining} ${t('warehouse.left')}` : `${Math.abs(remaining)} ${t('warehouse.over')}`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Main Content - List of Splits */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-[var(--theme-bg-app)]">
                        {splitVariants.map((variant, index) => (
                            <ReceiveSplitCard
                                key={variant.id}
                                variant={variant}
                                index={index}
                                totalSplits={splitVariants.length}
                                barcodeInput={barcodeInput[variant.id] || ''}
                                onUpdateVariant={(updated) => setSplitVariants(prev => prev.map(v => v.id === variant.id ? { ...v, ...updated } : v))}
                                onRemoveVariant={() => setSplitVariants(prev => prev.filter(v => v.id !== variant.id))}
                                onBarcodeInput={(val) => setBarcodeInput(prev => ({ ...prev, [variant.id]: val }))}
                                onAddBarcode={() => handleAddBarcode(variant.id)}
                                onRemoveBarcode={(code) => handleRemoveBarcode(variant.id, code)}
                                onFocusScan={() => setActiveVariantForScan(variant.id)}
                                scanOnlyHandlers={scanOnlyHandlers}
                                t={t}
                            />
                        ))}

                        <button
                            type="button"
                            onClick={() => {
                                const newBatch = generateBatchNumber({
                                    sku: splitReceivingItem.sku,
                                    sequence: splitVariants.length + 1
                                });

                                setSplitVariants(prev => [...prev, {
                                    id: `variant-${Date.now()}`,
                                    quantity: 0,
                                    sku: splitReceivingItem.sku,
                                    skuType: 'existing',
                                    productId: splitReceivingItem.productId,
                                    productName: splitReceivingItem.productName,
                                    batchNumber: newBatch
                                }]);
                            }}
                            className="w-full py-4 border border-dashed border-[var(--theme-border)] hover:border-[var(--theme-text-primary)] rounded-2xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] transition-all flex items-center justify-center gap-2.5 group min-h-[48px]"
                        >
                            <div className="p-1.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-text-primary)] transition-all shadow-sm">
                                <Plus size={16} />
                            </div>
                            <span className="font-semibold uppercase tracking-wider text-xs">{t('warehouse.addAnotherSplit')}</span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-[var(--theme-border)] relative z-10 flex gap-3 md:gap-4 bg-[var(--theme-bg-subtle)]">
                    <button
                        onClick={() => { setIsSplitReceiving(false); setSplitReceivingItem(null); setSplitReceivingPO(null); setSplitVariants([]); }}
                        className="px-6 md:px-8 py-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs uppercase tracking-wider font-semibold min-h-[44px] transition-colors"
                    >
                        {t('warehouse.cancel')}
                    </button>
                    <button
                        disabled={isSubmitting || localSubmitting || totalScanned < 1}
                        onClick={async () => {
                            if (isSubmitting || localSubmitting || totalScanned < 1) return;

                            setLocalSubmitting(true);

                            const processedVariants = splitVariants.filter(v => (v.quantity || 0) > 0).map((v, idx) => {
                                let updatedVariant = { ...v };
                                const pendingBarcode = (barcodeInput[v.id] || '').trim();
                                if (pendingBarcode) {
                                    if (!updatedVariant.barcode) {
                                        updatedVariant.barcode = pendingBarcode;
                                    } else {
                                        const current = updatedVariant.barcodes || [];
                                        if (!current.includes(pendingBarcode)) {
                                            updatedVariant.barcodes = [...current, pendingBarcode];
                                        }
                                    }
                                }

                                if (!updatedVariant.batchNumber) {
                                    updatedVariant.batchNumber = generateBatchNumber({
                                        sku: updatedVariant.sku || splitReceivingItem.sku,
                                        sequence: idx + 1
                                    });
                                }
                                return updatedVariant;
                            });

                            if (processedVariants.length === 0) {
                                alert("Please enter a quantity of at least 1 unit to receive.");
                                setLocalSubmitting(false);
                                return;
                            }

                            const maxToReceive = expectedSellable - previouslyReceived;
                            if (totalScanned > maxToReceive) {
                                alert(`Cannot receive ${totalScanned} units. Only ${maxToReceive} units are remaining for this PO item.`);
                                setLocalSubmitting(false);
                                return;
                            }

                            setIsSubmitting(true);
                            try {
                                await receivePOSplit(
                                    splitReceivingPO.id,
                                    splitReceivingItem.productId || splitReceivingItem.id,
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
                                    qty: 1,
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
                                setIsSubmitting(false);
                                setLocalSubmitting(false);
                            }
                        }}
                        className={`flex-1 py-3 px-6 font-semibold uppercase tracking-wider text-xs md:text-sm rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px] ${isSubmitting || localSubmitting || totalScanned < 1
                            ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {isSubmitting || localSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin text-white" />
                                <span>{t('warehouse.processingStatus')}...</span>
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                {t('warehouse.confirmReceipt')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
