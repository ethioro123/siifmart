import React, { useState } from 'react';
import { X, Trash2, Plus, Box, Check, ScanBarcode, ChevronRight, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Product, PurchaseOrder, WMSJob } from '../../../types';
import Badge from '../../shared/Badge';
import { useStore } from '../../../contexts/CentralStore';
import { useScanOnly } from '../../../hooks/useScanOnly';
import { logger } from '../../../utils/logger';
import { ReceiveSplitCard } from './ReceiveSplitCard';
import { generateBatchNumber } from '../../../utils/batchNumber';
import { convertToSellableUnits } from '../useReceiving';
import { formatPackBadge } from '../../procurement/utils';
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-300">
            <div className="w-full max-w-6xl max-h-[90vh] md:max-h-[95vh] rounded-3xl glass-panel relative overflow-hidden flex flex-col">

                {/* 🌟 Background Effects — hidden on mobile */}
                <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/10 dark:bg-amber-700/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Header (HUD Style) */}
                <div className="p-4 md:p-8 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 bg-[#FAF8F5] dark:bg-[#1C2620]">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="relative group hidden md:block">
                            <div className="absolute -inset-1 bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-2xl blur opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition duration-1000"></div>
                            <div className="relative p-4 bg-[#2C5E3B]/15 dark:bg-[#A9CBA2]/15 rounded-2xl border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 shadow-sm transition-colors">
                                <Box size={32} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                <h3 className="text-lg md:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">{splitReceivingItem.productName}</h3>
                                <Badge variant="neutral" className="bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-600 dark:text-gray-400 font-mono text-[9px] md:text-xs">PO #{splitReceivingPO.poNumber}</Badge>
                                {(() => {
                                    const badge = formatPackBadge(splitReceivingItem);
                                    return badge ? (
                                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                                            📦 {badge}
                                        </span>
                                    ) : null;
                                })()}
                            </div>
                            <div className="hidden md:flex items-center gap-4 mt-2">
                                <p className="text-sm font-black text-slate-500 dark:text-gray-400 font-mono tracking-wide uppercase">
                                    SKU: <span className="text-slate-900 dark:text-white">{splitReceivingItem.sku}</span>
                                </p>
                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-gray-600" />
                                <p className="text-sm font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                                    {t('warehouse.supplier')}: <span className="text-slate-900 dark:text-white">{splitReceivingPO.supplierName}</span>
                                </p>
                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-gray-600" />
                                <p className="text-sm font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest">
                                    Target: <span className="font-mono">{expectedSellable} units</span>
                                    {splitReceivingItem.orderedPackages && splitReceivingItem.orderedPackages !== expectedSellable && (
                                        <span className="text-stone-400 text-xs ml-1 font-normal">({splitReceivingItem.orderedPackages} pkgs)</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => { setIsSplitReceiving(false); setSplitReceivingItem(null); setSplitReceivingPO(null); setSplitVariants([]); }}
                        className="p-2 md:p-3 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-gray-400 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-950 dark:hover:text-white hover:scale-110 transition-all border border-zinc-300 dark:border-white/10 shadow-sm absolute top-4 right-4 md:relative md:top-auto md:right-auto"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 📊 Progress Dashboard */}
                <div className="px-4 md:px-8 py-4 md:py-6 bg-white/40 dark:bg-[#1C2620]/20 border-b border-[#E2DCCE]/40 dark:border-[#A9CBA2]/[0.04] flex flex-wrap gap-4 md:gap-8 items-center relative overflow-hidden">
                    {/* Progress Bar Background */}
                    {!isBlindReceiving && (
                        <div className="absolute bottom-0 left-0 h-1 bg-slate-100 dark:bg-gray-800 w-full overflow-hidden">
                            <div
                                ref={el => el?.style.setProperty('width', `${Math.min(100, Math.max(0, progress))}%`)}
                                className={`h-full transition-all duration-300 ${remaining === 0 ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2]' : 'bg-[#2C5E3B]/70 dark:bg-[#A9CBA2]/70'}`}
                            />
                        </div>
                    )}

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-zinc-500 mb-1">{t('warehouse.expectedQty')}</span>
                        <div className="flex items-baseline gap-1.5">
                            {isBlindReceiving ? (
                                <span className="text-xl md:text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums drop-shadow-sm font-mono tracking-widest">
                                    *** <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-amber-700 dark:text-amber-300">(Blind)</span>
                                </span>
                            ) : (
                                <>
                                    <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums drop-shadow-sm font-mono">{expectedSellable}</span>
                                    {splitReceivingItem.orderedPackages && splitReceivingItem.orderedPackages !== expectedSellable && (
                                        <span className="text-[10px] text-stone-400 font-mono">({splitReceivingItem.orderedPackages} pkgs)</span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="h-8 md:h-10 w-px bg-[#E2DCCE]/60 dark:bg-white/10" />

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black mb-1 text-slate-500 dark:text-zinc-500">
                            {t('warehouse.receivedQty')}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-2xl md:text-4xl font-black tabular-nums drop-shadow-sm font-mono ${!isBlindReceiving && remaining === 0 ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-slate-900 dark:text-white'}`}>
                                {previouslyReceived + totalScanned}
                            </span>
                            {previouslyReceived > 0 && (
                                <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 font-mono">
                                    ({previouslyReceived} prev + {totalScanned} new)
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1" />

                    <div className={`px-4 md:px-6 py-2 md:py-3 rounded-xl border flex items-center gap-2 md:gap-3 shadow-lg transition-all ${isBlindReceiving ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400' : remaining === 0 ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30 text-[#2C5E3B] dark:text-[#A9CBA2]' : 'bg-[#FAF8F5]/80 dark:bg-[#1C2620]/80 border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-700 dark:text-[#EAE5D9]'}`}>
                        {isBlindReceiving ? (
                            <Clock className="text-amber-600 dark:text-amber-400" size={16} />
                        ) : remaining === 0 ? (
                            <Check className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={16} />
                        ) : remaining > 0 ? (
                            <Clock className="text-amber-600 dark:text-amber-400 animate-pulse" size={16} />
                        ) : (
                            <AlertTriangle className="text-red-500 dark:text-red-400" size={16} />
                        )}
                        <p className={`text-sm md:text-lg font-black tabular-nums font-mono ${isBlindReceiving ? 'text-amber-700 dark:text-amber-300' : remaining === 0 ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-slate-700 dark:text-white'}`}>
                            {isBlindReceiving ? 'Blind Mode Active' : remaining === 0 ? t('warehouse.matched') : remaining > 0 ? `${remaining} ${t('warehouse.left')}` : `${Math.abs(remaining)} ${t('warehouse.over')}`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* 📦 Main Content - List of Splits */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 md:space-y-4 custom-scrollbar">
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
                            className="w-full py-6 border-2 border-dashed border-[#E2DCCE] dark:border-emerald-950/30 hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] rounded-2xl text-[#2C4D35]/60 dark:text-[#A9CBA2]/60 hover:text-[#1E3F27] dark:hover:text-white transition-all flex items-center justify-center gap-3 group hover:bg-[#FAF8F5]/40 dark:hover:bg-[#1C2620]/20"
                        >
                            <div className="p-2 bg-white/80 dark:bg-[#1C2620]/30 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-full group-hover:bg-[#2C5E3B] dark:hover:bg-[#A9CBA2] group-hover:scale-110 transition-all shadow-sm group-hover:shadow-[#2C5E3B]/30">
                                <Plus size={20} className="group-hover:text-white dark:group-hover:text-[#1E3B24]" />
                            </div>
                            <span className="font-black uppercase tracking-[0.2em] text-[10px]">{t('warehouse.addAnotherSplit')}</span>
                        </button>
                    </div>
                </div>

                {/* 🦶 Footer */}
                <div className="p-4 md:p-8 border-t border-[#E2DCCE]/50 dark:border-emerald-950/20 relative z-10 flex gap-3 md:gap-4 bg-[#FAF8F5] dark:bg-[#1C2620]">
                    <button
                        onClick={() => { setIsSplitReceiving(false); setSplitReceivingItem(null); setSplitReceivingPO(null); setSplitVariants([]); }}
                        className="woody-btn-secondary px-4 md:px-8 py-3 md:py-4 text-[10px] uppercase tracking-widest font-black"
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
                        className={`flex-1 py-3 md:py-4 font-black uppercase tracking-widest text-[10px] rounded-xl md:rounded-2xl shadow-md active:scale-[0.98] transition-all border flex items-center justify-center gap-2 md:gap-3 ${isSubmitting || localSubmitting || totalScanned < 1
                            ? 'bg-slate-100/50 dark:bg-black/25 text-stone-400 border-[#E2DCCE]/40 dark:border-emerald-950/10 cursor-not-allowed opacity-50'
                            : 'woody-btn-primary'
                            }`}
                    >
                        {isSubmitting || localSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin text-stone-450 dark:text-stone-400" />
                                <span>{t('warehouse.processingStatus')}...</span>
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                {t('warehouse.confirmReceipt')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
