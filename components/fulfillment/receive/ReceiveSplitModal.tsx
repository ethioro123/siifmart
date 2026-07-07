import React, { useState } from 'react';
import { X, Trash2, Plus, Box, Check, ScanBarcode, ChevronRight } from 'lucide-react';
import { Product, PurchaseOrder, WMSJob } from '../../../types';
import Badge from '../../shared/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../contexts/CentralStore';
import { logger } from '../../../utils/logger';

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
    receivePOSplit,
    handlePrintBatch,
    setReprintItem,
    isSubmitting,
    setIsSubmitting,
    jobs,
    t
}) => {
    const { user } = useStore();
    const [barcodeInput, setBarcodeInput] = useState<Record<string, string>>({});

    const handleAddBarcode = (variantId: string) => {
        const code = barcodeInput[variantId];
        if (!code) return;

        setSplitVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                const current = v.barcodes || [];
                if (current.includes(code)) return v; // No duplicates
                return { ...v, barcodes: [...current, code] };
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

    const previouslyReceived = React.useMemo(() => {
        if (!splitReceivingPO || !splitReceivingItem) return 0;
        const poJobs = jobs.filter(j => j.orderRef === splitReceivingPO.id && j.type === 'PUTAWAY');
        let count = 0;
        poJobs.forEach(job => {
            job.lineItems.forEach(item => {
                if (item.productId === splitReceivingItem.productId || item.sku === splitReceivingItem.sku) {
                    count += (item.expectedQty || 0);
                }
            });
        });
        return count;
    }, [splitReceivingPO, splitReceivingItem, jobs]);

    const totalScanned = splitVariants.reduce((acc, v) => acc + (v.quantity || 0), 0);
    const remaining = Math.max(0, splitReceivingItem.quantity - previouslyReceived - totalScanned);
    const progress = Math.min(100, ((previouslyReceived + totalScanned) / splitReceivingItem.quantity) * 100);

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-2xl flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-6xl max-h-[90vh] md:max-h-[95vh] rounded-3xl glass-panel relative overflow-hidden flex flex-col">

                {/* 🌟 Background Effects — hidden on mobile */}
                <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/10 dark:bg-amber-700/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Header (HUD Style) */}
                <div className="p-4 md:p-8 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 bg-[#FAF8F5]/30 dark:bg-[#1C2620]/30 backdrop-blur-md">
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
                            </div>
                            <div className="hidden md:flex items-center gap-4 mt-2">
                                <p className="text-sm font-black text-slate-500 dark:text-gray-400 font-mono tracking-wide uppercase">
                                    SKU: <span className="text-slate-900 dark:text-white">{splitReceivingItem.sku}</span>
                                </p>
                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-gray-600" />
                                <p className="text-sm font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                                    {t('warehouse.supplier')}: <span className="text-slate-900 dark:text-white">{splitReceivingPO.supplierName}</span>
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
                    <div className="absolute bottom-0 left-0 h-1 bg-slate-100 dark:bg-gray-800 w-full">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full ${remaining === 0 ? 'bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-[0_0_15px_rgba(44,94,59,0.35)] dark:shadow-[0_0_15px_rgba(169,203,162,0.35)]' : 'bg-[#2C5E3B]/70 dark:bg-[#A9CBA2]/70 shadow-[0_0_15px_rgba(44,94,59,0.2)] dark:shadow-[0_0_15px_rgba(169,203,162,0.2)]'}`}
                        />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-zinc-500 mb-1">{t('warehouse.expectedQty')}</span>
                        <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tabular-nums drop-shadow-sm font-mono">{splitReceivingItem.quantity}</span>
                    </div>

                    <div className="h-8 md:h-10 w-px bg-[#E2DCCE]/60 dark:bg-white/10" />

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black mb-1 text-slate-500 dark:text-zinc-500">
                            {t('warehouse.receivedQty')}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-2xl md:text-4xl font-black tabular-nums drop-shadow-sm font-mono ${remaining === 0 ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-stone-400 dark:text-stone-600'}`}>
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

                    <div className={`px-4 md:px-6 py-2 md:py-3 rounded-xl border backdrop-blur-md flex items-center gap-2 md:gap-3 shadow-lg transition-all ${remaining === 0 ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border-[#2C5E3B]/30 dark:border-[#A9CBA2]/30 text-[#2C5E3B] dark:text-[#A9CBA2]' : 'bg-[#FAF8F5]/50 dark:bg-[#1C2620]/30 border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-700 dark:text-[#EAE5D9]'}`}>
                        {remaining === 0 ? (
                            <Check className="text-[#2C5E3B] dark:text-[#A9CBA2]" size={16} />
                        ) : (
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-slate-200 dark:border-gray-500 border-t-slate-900 dark:border-t-white animate-spin" />
                        )}
                        <p className={`text-sm md:text-lg font-black tabular-nums font-mono ${remaining === 0 ? 'text-[#2C5E3B] dark:text-[#A9CBA2]' : 'text-slate-700 dark:text-white'}`}>
                            {remaining === 0 ? t('warehouse.matched') : remaining > 0 ? `${remaining} ${t('warehouse.left')}` : `${Math.abs(remaining)} ${t('warehouse.over')}`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* 📦 Main Content - List of Splits */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 md:space-y-4 custom-scrollbar">
                        <AnimatePresence>
                            {splitVariants.map((variant, index) => (
                                <motion.div
                                    key={variant.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative glass-panel-pushed hover:border-[#2C5E3B]/40 dark:hover:border-[#A9CBA2]/20 hover:bg-[#FAF8F5]/80 dark:hover:bg-[#1C2620]/40 rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 shadow-sm hover:shadow-md"
                                >
                                    <div className="hidden md:block absolute top-0 left-0 w-1 h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-l-2xl opacity-10 group-hover:opacity-100 transition-opacity shadow-[2px_0_10px_rgba(44,94,59,0.3)]" />

                                    <div className="flex flex-col gap-4 md:gap-8">
                                        {/* Qty & Condition */}
                                        <div className="flex-1 grid grid-cols-2 gap-3 md:gap-6 w-full">
                                            <div className="space-y-1.5 md:space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('warehouse.quantityToReceive')}</label>
                                                <div className="relative group/input">
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        pattern="[0-9]*"
                                                        min="0"
                                                        value={variant.quantity === 0 ? '' : variant.quantity}
                                                        onChange={(e) => setSplitVariants(prev => prev.map(v => v.id === variant.id ? { ...v, quantity: Math.max(0, parseInt(e.target.value) || 0) } : v))}
                                                        className="woody-input text-xl md:text-2xl font-black tabular-nums py-3 md:py-4 placeholder:text-slate-400 dark:placeholder:text-gray-750"
                                                        aria-label="Quantity"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 md:space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('warehouse.condition')}</label>
                                                <div className="relative group/select">
                                                    <select
                                                        value={variant.condition || 'Good'}
                                                        onChange={(e) => setSplitVariants(prev => prev.map(v => v.id === variant.id ? { ...v, condition: e.target.value } : v))}
                                                        className="woody-input text-xs md:text-sm font-black uppercase tracking-widest cursor-pointer py-3.5 md:py-4.5 pr-8 appearance-none"
                                                        aria-label="Condition"
                                                    >
                                                        <option value="Good">{t('warehouse.conditionGood')}</option>
                                                        <option value="Damaged">{t('warehouse.conditionDamaged')}</option>
                                                        <option value="Expired">{t('warehouse.conditionExpired')}</option>
                                                        <option value="Missing Parts">{t('warehouse.conditionMissing')}</option>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <ChevronRight className="rotate-90" size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Batch / Expiry */}
                                        <div className="flex-1 grid grid-cols-2 gap-3 md:gap-4 w-full">
                                            <div className="space-y-1.5 md:space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">{t('warehouse.expiryDate')}</label>
                                                <input
                                                    type="date"
                                                    value={variant.expiryDate || ''}
                                                    onChange={(e) => setSplitVariants(prev => prev.map(v => v.id === variant.id ? { ...v, expiryDate: e.target.value } : v))}
                                                    className="woody-input py-2 text-sm"
                                                    aria-label="Expiry Date"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest pl-1">Batch #</label>
                                                <input
                                                    type="text"
                                                    value={variant.batchNumber || ''}
                                                    readOnly
                                                    className="w-full bg-slate-100/40 dark:bg-black/10 border border-[#E2DCCE]/50 dark:border-emerald-950/10 rounded-lg px-3 py-2.5 text-sm text-stone-400 dark:text-stone-600 outline-none cursor-not-allowed font-mono tracking-wider"
                                                    aria-label="Batch Number"
                                                />
                                            </div>
                                        </div>

                                        {/* Barcodes */}
                                        <div className="flex-[1.5] space-y-3 w-full md:min-w-[300px]">
                                            <label className="text-[10px] font-black text-zinc-500 dark:text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                                <ScanBarcode size={12} className="text-zinc-400" /> {t('warehouse.barcodes')}
                                            </label>

                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        value={barcodeInput[variant.id] || ''}
                                                        onChange={(e) => setBarcodeInput(prev => ({ ...prev, [variant.id]: e.target.value }))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddBarcode(variant.id);
                                                            }
                                                        }}
                                                        placeholder={t('warehouse.scanBarcodePlaceholder')}
                                                        className="woody-input pl-10 font-mono py-2"
                                                        aria-label="New Barcode Input"
                                                    />
                                                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-gray-600" size={14} />
                                                </div>
                                                <button
                                                    onClick={() => handleAddBarcode(variant.id)}
                                                    className="woody-btn-secondary px-3 py-2 text-xs rounded-lg flex items-center justify-center"
                                                    aria-label="Add barcode"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2 min-h-[32px]">
                                                {variant.barcode && (
                                                    <Badge variant="neutral" className="bg-[#FAF8F5]/85 dark:bg-[#1C2620]/30 border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] text-stone-400 dark:text-[#A9CBA2]/60 font-mono text-[10px] pl-2 pr-3 py-1">
                                                        {variant.barcode} <span className="opacity-50 ml-2 text-[8px] uppercase tracking-wider">{t('warehouse.primary')}</span>
                                                    </Badge>
                                                )}
                                                {(variant.barcodes || []).map(code => (
                                                    <motion.span
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        key={code}
                                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-mono group/badge hover:bg-[#2C5E3B]/20 dark:hover:bg-[#A9CBA2]/20 transition-colors cursor-default shadow-sm"
                                                    >
                                                        {code}
                                                        <button
                                                            onClick={() => handleRemoveBarcode(variant.id, code)}
                                                            className="opacity-50 hover:opacity-100 hover:text-white transition-opacity"
                                                            aria-label="Remove barcode"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </motion.span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {splitVariants.length > 1 && (
                                            <div className="pt-2">
                                                <button
                                                    onClick={() => setSplitVariants(prev => prev.filter(v => v.id !== variant.id))}
                                                    className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-all border border-red-200 dark:border-red-500/20 shadow-sm"
                                                    title={t('warehouse.removeScan')}
                                                    aria-label="Remove split"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <button
                            onClick={() => {
                                const now = new Date();
                                const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
                                const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                                const newBatch = `BN-${dateStr}-${randomStr}`;

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
                <div className="p-4 md:p-8 border-t border-[#E2DCCE]/50 dark:border-emerald-950/20 relative z-10 flex gap-3 md:gap-4 bg-white/20 dark:bg-[#1C2620]/20 backdrop-blur-md">
                    <button
                        onClick={() => { setIsSplitReceiving(false); setSplitReceivingItem(null); setSplitReceivingPO(null); setSplitVariants([]); }}
                        className="woody-btn-secondary px-4 md:px-8 py-3 md:py-4 text-[10px] uppercase tracking-widest font-black"
                    >
                        {t('warehouse.cancel')}
                    </button>
                    <button
                        disabled={isSubmitting || totalScanned < 1}
                        onClick={async () => {
                            if (isSubmitting || totalScanned < 1) return;

                            const processedVariants = splitVariants.filter(v => (v.quantity || 0) > 0).map(v => {
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
                                    const now = new Date();
                                    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
                                    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                                    updatedVariant.batchNumber = `BN-${dateStr}-${randomStr}`;
                                }
                                return updatedVariant;
                            });

                            if (processedVariants.length === 0) {
                                alert("Please enter a quantity of at least 1 unit to receive.");
                                return;
                            }

                            const maxToReceive = splitReceivingItem.quantity - previouslyReceived;
                            if (totalScanned > maxToReceive) {
                                alert(`Cannot receive ${totalScanned} units. Only ${maxToReceive} units are remaining for this PO item.`);
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
                                    qty: processedVariants.reduce((sum: number, v: any) => sum + v.quantity, 0),
                                    price: splitReceivingItem.retailPrice,
                                    category: splitReceivingItem.category
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
                            }
                        }}
                        className={`flex-1 py-3 md:py-4 font-black uppercase tracking-widest text-[10px] rounded-xl md:rounded-2xl shadow-md active:scale-[0.98] transition-all border flex items-center justify-center gap-2 md:gap-3 ${isSubmitting || totalScanned < 1
                            ? 'bg-slate-100/50 dark:bg-black/25 text-stone-400 border-[#E2DCCE]/40 dark:border-emerald-950/10 cursor-not-allowed opacity-50'
                            : 'woody-btn-primary'
                            }`}
                    >
                        {isSubmitting ? (
                            <>{t('warehouse.processingStatus')}...</>
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
