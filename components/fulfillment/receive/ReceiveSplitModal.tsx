import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, History, Box, AlertCircle, Check, ScanBarcode, ArrowRight, ChevronRight } from 'lucide-react';
import { Product, PurchaseOrder } from '../../../types';
import Badge from '../../shared/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../contexts/CentralStore';

interface ReceiveSplitModalProps {
    splitReceivingItem: any;
    splitReceivingPO: PurchaseOrder;
    splitVariants: Array<{
        id: string;
        // Restored fields required by receivePOSplit
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
    allProducts: Product[]; // Kept for interface compat but unused
    receivePOSplit: (poId: string, lineItemId: string, variants: any[], locationId?: string, user?: { name: string; email: string }) => Promise<void>;
    handlePrintBatch: (items: any[]) => Promise<void>;
    setReprintItem: (item: any) => void;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
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
    setIsSubmitting
}) => {
    const { user } = useStore(); // Get current user
    const [showHistory, setShowHistory] = useState(false);
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

    const totalScanned = splitVariants.reduce((acc, v) => acc + (v.quantity || 0), 0);
    const remaining = splitReceivingItem.quantity - totalScanned;
    const progress = Math.min(100, (totalScanned / splitReceivingItem.quantity) * 100);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[200] animate-in fade-in duration-300">
            <div className="w-full h-full md:h-[95vh] md:w-[95vw] md:max-w-6xl md:rounded-[2rem] bg-white dark:bg-black border border-zinc-950 dark:border-white/10 shadow-2xl relative overflow-hidden flex flex-col">

                {/* 🌟 Background Effects — hidden on mobile */}
                <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 dark:bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 dark:bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Header (HUD Style) */}
                <div className="p-4 md:p-8 border-b border-zinc-200 dark:border-white/5 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-6 bg-zinc-50 dark:bg-zinc-950/50 backdrop-blur-md">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="relative group hidden md:block">
                            <div className="absolute -inset-1 bg-cyan-500 dark:bg-cyan-400 rounded-2xl blur opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition duration-1000"></div>
                            <div className="relative p-4 bg-zinc-100 dark:bg-cyan-500 rounded-2xl border border-zinc-300 dark:border-cyan-400 shadow-md dark:shadow-cyan-500/20">
                                <Box size={32} className="text-white dark:text-black" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                <h3 className="text-lg md:text-3xl font-black text-zinc-950 dark:text-white tracking-tight truncate">{splitReceivingItem.productName}</h3>
                                <Badge variant="neutral" className="bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-gray-400 font-mono text-[9px] md:text-xs">PO #{splitReceivingPO.poNumber}</Badge>
                            </div>
                            <div className="hidden md:flex items-center gap-4 mt-2">
                                <p className="text-sm font-black text-zinc-500 dark:text-gray-400 font-mono tracking-wide uppercase">
                                    SKU: <span className="text-zinc-900 dark:text-white">{splitReceivingItem.sku}</span>
                                </p>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-gray-600" />
                                <p className="text-sm font-black text-zinc-500 dark:text-gray-400 uppercase tracking-widest">
                                    Supplier: <span className="text-zinc-900 dark:text-white">{splitReceivingPO.supplierName}</span>
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
                <div className="px-4 md:px-8 py-4 md:py-6 bg-white dark:bg-white/[0.02] border-b border-zinc-300 dark:border-white/5 flex flex-wrap gap-4 md:gap-8 items-center relative overflow-hidden">
                    {/* Progress Bar Background */}
                    <div className="absolute bottom-0 left-0 h-1 bg-zinc-200 dark:bg-gray-800 w-full">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full ${remaining === 0 ? 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-violet-500 dark:bg-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]'}`}
                        />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400 mb-1">Expected</span>
                        <span className="text-2xl md:text-4xl font-black text-zinc-950 dark:text-white tabular-nums drop-shadow-sm font-mono">{splitReceivingItem.quantity}</span>
                    </div>

                    <div className="h-8 md:h-10 w-px bg-zinc-100 dark:bg-white/10" />

                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black mb-1 text-zinc-600 dark:text-zinc-500">
                            Scanned
                        </span>
                        <span className={`text-2xl md:text-4xl font-black tabular-nums drop-shadow-sm font-mono ${remaining === 0 ? 'text-zinc-950 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-400'}`}>
                            {totalScanned}
                        </span>
                    </div>

                    <div className="flex-1" />

                    <div className={`px-4 md:px-6 py-2 md:py-3 rounded-xl border backdrop-blur-md flex items-center gap-2 md:gap-3 shadow-lg transition-all ${remaining === 0 ? 'bg-zinc-100 dark:bg-cyan-500 border-zinc-300 dark:border-cyan-400 shadow-cyan-500/20' : 'bg-white dark:bg-black/40 border-zinc-300 dark:border-white/10'}`}>
                        {remaining === 0 ? (
                            <Check className="text-white dark:text-black" size={16} />
                        ) : (
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-zinc-200 dark:border-gray-500 border-t-zinc-900 dark:border-t-white animate-spin" />
                        )}
                        <p className={`text-sm md:text-lg font-black tabular-nums font-mono ${remaining === 0 ? 'text-white dark:text-black' : 'text-zinc-950 dark:text-white'}`}>
                            {remaining === 0 ? 'Matched' : remaining > 0 ? `${remaining} Left` : `${Math.abs(remaining)} Over`}
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
                                    className="group relative bg-white dark:bg-black border border-zinc-100 dark:border-white/5 hover:border-zinc-900 dark:hover:border-zinc-700 rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 shadow-sm hover:shadow-xl"
                                >
                                    <div className="hidden md:block absolute top-0 left-0 w-1 h-full bg-cyan-500 dark:bg-cyan-400 rounded-l-2xl opacity-10 group-hover:opacity-100 transition-opacity shadow-[2px_0_10px_rgba(34,211,238,0.3)]" />

                                    <div className="flex flex-col gap-4 md:gap-8">

                                        {/* Qty & Condition */}
                                        <div className="flex-1 grid grid-cols-2 gap-3 md:gap-6 w-full">
                                            <div className="space-y-1.5 md:space-y-2">
                                                <label className="text-[10px] font-black text-zinc-600 dark:text-gray-500 uppercase tracking-widest pl-1">Quantity</label>
                                                <div className="relative group/input">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={variant.quantity}
                                                        onChange={(e) => setSplitVariants(prev => prev.map(v => v.id === variant.id ? { ...v, quantity: Math.max(1, parseInt(e.target.value) || 1) } : v))}
                                                        className="w-full bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 group-hover/input:border-cyan-500/50 dark:group-hover/input:border-cyan-400/50 rounded-xl px-3 md:px-4 py-3 md:py-4 text-xl md:text-2xl font-black text-zinc-950 dark:text-white tabular-nums focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all placeholder:text-zinc-500 dark:placeholder:text-gray-700"
                                                        aria-label="Quantity"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 md:space-y-2">
                                                <label className="text-[10px] font-black text-zinc-600 dark:text-gray-500 uppercase tracking-widest pl-1">Condition</label>
                                                <div className="relative group/select">
                                                    <select
                                                        value={variant.condition || 'Good'}
                                                        onChange={(e) => setSplitVariants(prev => prev.map(v => v.id === variant.id ? { ...v, condition: e.target.value } : v))}
                                                        className="w-full h-full bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 group-hover/select:border-zinc-950 dark:group-hover/select:border-zinc-600 rounded-xl px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-black text-zinc-950 dark:text-white uppercase tracking-widest outline-none focus:ring-2 focus:ring-zinc-950/20 transition-all appearance-none cursor-pointer"
                                                        aria-label="Condition"
                                                    >
                                                        <option value="Good">Good Condition</option>
                                                        <option value="Damaged">Damaged / Defective</option>
                                                        <option value="Expired">Expired Stock</option>
                                                        <option value="Missing Parts">Missing Parts</option>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                                        <ChevronRight className="rotate-90" size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Batch / Expiry */}
                                        <div className="flex-1 grid grid-cols-2 gap-3 md:gap-4 w-full">
                                            <div className="space-y-1.5 md:space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 dark:text-gray-500 uppercase tracking-widest pl-1">Expiry Date</label>
                                                <input
                                                    type="date"
                                                    value={variant.expiryDate || ''}
                                                    onChange={(e) => setSplitVariants(prev => prev.map(v => v.id === variant.id ? { ...v, expiryDate: e.target.value } : v))}
                                                    className="w-full bg-zinc-50 dark:bg-black/20 border-b-2 border-zinc-300 dark:border-white/10 focus:border-zinc-950 dark:focus:border-zinc-400 rounded-lg px-3 py-3 text-sm text-zinc-950 dark:text-gray-300 focus:text-zinc-950 dark:focus:text-white outline-none transition-colors"
                                                    aria-label="Expiry Date"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 dark:text-gray-500 uppercase tracking-widest pl-1">Batch #</label>
                                                <input
                                                    type="text"
                                                    value={variant.batchNumber || ''}
                                                    readOnly
                                                    className="w-full bg-zinc-100 dark:bg-black/40 border-b-2 border-zinc-200 dark:border-white/5 rounded-lg px-3 py-3 text-sm text-zinc-500 dark:text-zinc-500 outline-none cursor-not-allowed font-mono tracking-wider"
                                                    aria-label="Batch Number"
                                                />
                                            </div>
                                        </div>

                                        {/* Barcodes */}
                                        <div className="flex-[1.5] space-y-3 w-full md:min-w-[300px]">
                                            <label className="text-[10px] font-black text-zinc-500 dark:text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                                <ScanBarcode size={12} className="text-zinc-400" /> Barcodes
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
                                                        placeholder="Scan barcode..."
                                                        className="w-full bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-zinc-950 dark:text-white font-mono focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all"
                                                        aria-label="New Barcode Input"
                                                    />
                                                    <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-gray-600" size={14} />
                                                </div>
                                                <button
                                                    onClick={() => handleAddBarcode(variant.id)}
                                                    className="px-3 py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-white/10 rounded-lg text-zinc-950 dark:text-white transition-all shadow-sm"
                                                    aria-label="Add barcode"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap gap-2 min-h-[32px]">
                                                {variant.barcode && (
                                                    <Badge variant="neutral" className="bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] pl-2 pr-3 py-1">
                                                        {variant.barcode} <span className="opacity-50 ml-2 text-[8px] uppercase tracking-wider">Primary</span>
                                                    </Badge>
                                                )}
                                                {(variant.barcodes || []).map(code => (
                                                    <motion.span
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        key={code}
                                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-cyan-500/10 border border-zinc-300 dark:border-cyan-500/20 text-xs text-zinc-950 dark:text-cyan-400 font-mono group/badge hover:bg-zinc-200 dark:hover:bg-cyan-500/20 transition-colors cursor-default shadow-sm"
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
                                                    className="p-3 bg-zinc-100 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-300 rounded-xl transition-all border border-zinc-300 dark:border-white/10 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm"
                                                    title="Remove Variant"
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
                                    quantity: 1,
                                    sku: splitReceivingItem.sku,
                                    skuType: 'existing',
                                    productId: splitReceivingItem.productId,
                                    productName: splitReceivingItem.productName,
                                    batchNumber: newBatch // Auto-generate on add
                                }]);
                            }}
                            className="w-full py-6 border-2 border-dashed border-zinc-300 dark:border-white/10 hover:border-zinc-950 dark:hover:border-white/30 rounded-2xl text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-all flex items-center justify-center gap-3 group hover:bg-zinc-50 dark:hover:bg-white/5"
                        >
                            <div className="p-2 bg-zinc-100 dark:bg-white/5 rounded-full group-hover:bg-cyan-500 dark:group-hover:bg-cyan-400 group-hover:scale-110 transition-all shadow-lg group-hover:shadow-cyan-500/30">
                                <Plus size={20} className="group-hover:text-white dark:group-hover:text-black" />
                            </div>
                            <span className="font-black uppercase tracking-[0.2em] text-[10px]">Add Another Split (Condition / Batch)</span>
                        </button>
                    </div>
                </div>

                {/* 🦶 Footer */}
                <div className="p-4 md:p-8 border-t border-white/10 relative z-10 flex gap-3 md:gap-4 bg-black/40 backdrop-blur-md">
                    <button
                        onClick={() => { setIsSplitReceiving(false); setSplitReceivingItem(null); setSplitReceivingPO(null); setSplitVariants([]); }}
                        className="px-4 md:px-8 py-3 md:py-4 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-xl md:rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-950 dark:hover:text-white transition-colors border border-zinc-300 dark:border-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={isSubmitting}
                        onClick={async () => {
                            if (isSubmitting) return;

                            // Ensure all variants have a batch number (fallback auto-gen if somehow missed)
                            const processedVariants = splitVariants.map(v => {
                                if (!v.batchNumber) {
                                    const now = new Date();
                                    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
                                    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                                    return { ...v, batchNumber: `BN-${dateStr}-${randomStr}` };
                                }
                                return v;
                            });

                            setIsSubmitting(true);
                            try {
                                await receivePOSplit(
                                    splitReceivingPO.id,
                                    splitReceivingItem.productId || splitReceivingItem.id,
                                    processedVariants,
                                    undefined, // locationId
                                    user ? { name: user.name, email: user.email || '' } : undefined
                                );

                                // Instead of auto-printing, set up the reprint item so user can print from the reprint modal
                                const firstVariant = processedVariants[0];
                                const reprintSku = firstVariant?.sku || splitReceivingItem.sku || 'UNKNOWN';
                                const reprintName = firstVariant?.productName || splitReceivingItem.productName || 'Unknown Product';

                                // Open the reprint modal with the received item's data
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
                            } catch (error) {
                                console.error('Split error:', error);
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                        className={`flex-1 py-3 md:py-4 font-black uppercase tracking-widest text-[10px] rounded-xl md:rounded-2xl shadow-md active:scale-[0.98] transition-all border flex items-center justify-center gap-2 md:gap-3 ${isSubmitting
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-white/5 cursor-not-allowed'
                            : 'bg-zinc-100 dark:bg-cyan-500 hover:bg-zinc-200 dark:hover:bg-cyan-400 text-zinc-950 dark:text-black border-zinc-300 dark:border-cyan-400/30'
                            }`}
                    >
                        {isSubmitting ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Check size={20} />
                                Confirm Receive
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
