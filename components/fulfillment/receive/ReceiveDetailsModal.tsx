import React, { useState } from 'react';
import { X, Calendar, User, Box, Printer, FileText, Package, Truck, ArrowRight, ScanBarcode } from 'lucide-react';
import { PurchaseOrder, WMSJob } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../../shared/Badge';
import { formatDateTime } from '../../../utils/formatting';
import { generateUnifiedBatchLabelsHTML } from '../../../utils/labels/ProductLabelGenerator';
import { LabelSize, LabelFormat } from '../../../utils/labels/types';
import { getSellUnit } from '../../../utils/units';

interface ReceiveDetailsModalProps {
    selectedItem: WMSJob | PurchaseOrder;
    onClose: () => void;
    resolveOrderRef: (ref: string) => string;
    setReprintItem: (item: any) => void;
}

export const ReceiveDetailsModal: React.FC<ReceiveDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    setReprintItem
}) => {
    const { addNotification, isSubmitting, setIsSubmitting, employees } = useFulfillment();
    const [printingId, setPrintingId] = useState<string | null>(null);

    const isPO = (item: any): item is PurchaseOrder => {
        return (item as PurchaseOrder).poNumber !== undefined || (item as PurchaseOrder).supplierName !== undefined;
    };

    const resolveUser = (userId?: string) => {
        if (!userId || userId === 'System') return 'System';
        const userObj = employees.find(e => e.id === userId || e.name === userId);
        const displayId = userObj?.code || (userId.length > 20 ? userId.slice(0, 5).toUpperCase() : userId);
        return userObj ? `${userObj.name} (${displayId})` : `${userId} (${displayId})`;
    };

    const data = isPO(selectedItem) ? {
        type: 'PO',
        id: selectedItem.id,
        reference: selectedItem.poNumber || selectedItem.id.slice(0, 8),
        title: selectedItem.supplierName || 'Unknown Supplier',
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt,
        user: resolveUser(selectedItem.approvedBy || selectedItem.createdBy),
        items: selectedItem.lineItems || []
    } : {
        type: 'JOB',
        id: selectedItem.id,
        reference: resolveOrderRef(selectedItem.orderRef) || selectedItem.jobNumber,
        title: selectedItem.type === 'PUTAWAY' ? 'Item Receipt' : selectedItem.type,
        status: selectedItem.status,
        date: selectedItem.completedAt || selectedItem.updatedAt || selectedItem.createdAt,
        user: resolveUser(selectedItem.completedBy || selectedItem.createdBy),
        items: selectedItem.lineItems || []
    };

    const handleOpenReprint = (item: any) => {
        setReprintItem({
            sku: item.sku,
            name: item.name || item.productName || 'Unknown Item',
            qty: 1,
            price: item.retailPrice || item.price || 0,
            category: item.category || 'General'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-stretch md:items-center justify-center z-[200] p-0 md:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-black md:border-2 border-zinc-900 dark:border-white/10 md:rounded-3xl w-full md:max-w-2xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] overflow-hidden relative">
                {/* 🌟 Modal Ambient Glow — hidden on mobile */}
                <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/5 dark:bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-white/10 flex justify-between items-start bg-zinc-50/80 dark:bg-zinc-950/50 backdrop-blur-sm">
                    <div className="flex gap-3 md:gap-4 relative z-10">
                        <div className={`hidden md:flex p-3 rounded-xl border border-zinc-300 dark:border-white/10 transition-all duration-500 ${data.type === 'PO' ? 'bg-zinc-100 dark:bg-cyan-500 text-zinc-950 dark:text-black shadow-md dark:shadow-cyan-500/20' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'}`}>
                            {data.type === 'PO' ? <FileText size={24} /> : <Box size={24} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base md:text-xl font-black text-zinc-950 dark:text-zinc-100 uppercase tracking-tight font-mono">{data.reference}</h3>
                                <Badge variant="neutral" className="border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-white/5 text-[9px] font-mono">
                                    {data.status}
                                </Badge>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                                {data.type === 'PO' ? <Truck size={12} className="text-zinc-950 dark:text-zinc-400" /> : <Package size={12} className="text-zinc-950 dark:text-zinc-400" />}
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-600 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors" aria-label="Close details">
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/10">
                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-zinc-900 dark:text-zinc-400">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">Date</p>
                            <p className="text-xs text-zinc-950 dark:text-zinc-200 font-mono tracking-tighter">{formatDateTime(data.date)}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-black p-3 md:p-4 flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex p-2 bg-zinc-50 dark:bg-white/5 rounded-lg text-zinc-900 dark:text-zinc-400">
                            <User size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">Processed By</p>
                            <p className="text-xs text-zinc-950 dark:text-zinc-200 font-black uppercase tracking-tight">{data.user}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-white dark:bg-black/50">
                    <h4 className="text-[10px] font-black text-zinc-600 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 md:mb-4">Items Received</h4>
                    <div className="space-y-2 md:space-y-3">
                        {data.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-zinc-50/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg md:rounded-xl p-3 md:p-4 flex items-center justify-between group hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-all">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className="hidden md:flex w-10 h-10 bg-zinc-100 dark:bg-black/40 rounded-lg border border-zinc-200 dark:border-white/10 items-center justify-center text-zinc-600 dark:text-zinc-600 font-black text-xs">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-zinc-950 dark:text-zinc-100 font-black uppercase tracking-tight text-xs md:text-sm truncate">{item.name || item.productName || 'Unknown Item'}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-widest bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase">
                                                {item.sku}
                                            </span>
                                            {item.barcode && (
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-widest flex items-center gap-1">
                                                    <ScanBarcode size={10} /> {item.barcode}
                                                </span>
                                            )}
                                            {item.condition && (
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${item.condition === 'Good' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                                    item.condition === 'Damaged' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
                                                        'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                    {item.condition}
                                                </span>
                                            )}
                                        </div>

                                        {/* Granular Metadata (Batch / Expiry) — hidden on mobile */}
                                        <div className="hidden md:flex items-center gap-3 mt-1.5">
                                            {item.batchNumber && (
                                                <div className="flex items-center gap-1.5">
                                                    <Box size={10} className="text-zinc-400" />
                                                    <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">Batch:</span>
                                                    <span className="text-[9px] font-black text-zinc-900 dark:text-zinc-300 font-mono">{item.batchNumber}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Extra Barcodes — hidden on mobile */}
                                        {item.barcodes && item.barcodes.length > 0 && (
                                            <div className="hidden md:flex flex-wrap gap-1.5 mt-2">
                                                {item.barcodes.map((code: string, cIdx: number) => (
                                                    <span key={cIdx} className="text-[8px] font-mono text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 px-1.5 py-0.5 rounded">
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 md:gap-6 flex-shrink-0 ml-2">
                                    <div className="text-right">
                                        <p className="text-[9px] text-zinc-400 dark:text-zinc-600 uppercase font-black tracking-widest">Qty</p>
                                        <p className="text-lg font-black text-zinc-950 dark:text-cyan-400 tabular-nums font-mono">
                                            {(() => {
                                                const baseQty = item.receivedQty || item.quantity || item.expectedQty || 0;
                                                const itemUnit = getSellUnit(item.unit);
                                                const sizeNum = parseFloat(item.size || '') || 0;
                                                const isWeightOrVolume = itemUnit.category === 'weight' || itemUnit.category === 'volume';

                                                if (isWeightOrVolume && sizeNum > 0) {
                                                    return (
                                                        <>
                                                            {baseQty}
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold ml-1">× {sizeNum}{itemUnit.shortLabel.toLowerCase()}</span>
                                                        </>
                                                    );
                                                }
                                                return (
                                                    <>
                                                        {baseQty}
                                                        {itemUnit.code !== 'UNIT' && (
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold ml-1 uppercase">{itemUnit.shortLabel}</span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </p>
                                    </div>

                                    <div className="hidden md:block w-px h-8 bg-zinc-200 dark:bg-white/10" />

                                    <button
                                        onClick={() => handleOpenReprint(item)}
                                        className="p-2.5 md:p-2 bg-zinc-100 dark:bg-cyan-500 text-zinc-950 dark:text-black rounded-lg hover:bg-zinc-200 dark:hover:bg-cyan-400 transition-all shadow-md dark:shadow-cyan-500/20 active:scale-95 border border-zinc-300 dark:border-cyan-400/30"
                                        title="Print Label"
                                    >
                                        <Printer size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto px-8 py-3 bg-zinc-100 dark:bg-white text-zinc-950 dark:text-black hover:bg-zinc-200 dark:hover:bg-zinc-100 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md border border-zinc-300 dark:border-white/10"
                    >
                        Dismiss
                    </button>
                </div>

            </div>
        </div>
    );
};
