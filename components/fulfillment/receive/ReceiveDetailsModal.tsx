import React, { useState } from 'react';
import { X, Calendar, User, Box, Printer, FileText, Package, Truck, ArrowRight, ScanBarcode } from 'lucide-react';
import { PurchaseOrder, WMSJob } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import Badge from '../../shared/Badge';
import { formatDateTime } from '../../../utils/formatting';
import { getSellUnit } from '../../../utils/units';

interface ReceiveDetailsModalProps {
    selectedItem: WMSJob | PurchaseOrder;
    onClose: () => void;
    resolveOrderRef: (ref: string) => string;
    setReprintItem: (item: any) => void;
    sites: any[];
    t: (key: string) => string;
}

export const ReceiveDetailsModal: React.FC<ReceiveDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    setReprintItem,
    sites,
    t
}) => {
    const { addNotification, isSubmitting, setIsSubmitting, employees, user } = useFulfillment();
    const [printingId, setPrintingId] = useState<string | null>(null);

    const isPO = (item: any): item is PurchaseOrder => {
        return (item as PurchaseOrder).poNumber !== undefined || (item as PurchaseOrder).supplierName !== undefined;
    };

    const resolveUser = (userId?: string) => {
        if (!userId || userId === 'System') return { name: 'System', displayId: '' };
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        let userObj = employees.find(e => 
            e.id === userId || 
            (e.name && userId && e.name.toLowerCase() === userId.toLowerCase()) || 
            (e.email && userId && e.email.toLowerCase() === userId.toLowerCase()) ||
            (e.code && userId && e.code.toLowerCase() === userId.toLowerCase())
        );
        if (!userObj && user && userId && (
            userId.toLowerCase() === user.id?.toLowerCase() || 
            userId.toLowerCase() === user.email?.toLowerCase() || 
            userId.toLowerCase() === user.name?.toLowerCase() || 
            userId.toLowerCase() === user.employeeId?.toLowerCase()
        )) {
            userObj = employees.find(e => 
                (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase()) || 
                (e.name && user.name && e.name.toLowerCase() === user.name.toLowerCase()) || 
                e.id === user.employeeId
            );
        }
        const displayId = userObj?.code || (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId);
        return {
            name: userObj ? userObj.name : userId,
            displayId: displayId
        };
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
        items: selectedItem.lineItems || [],
        destination: sites.find(s => s.id === (selectedItem as any).siteId)?.name || 'Unknown'
    };

    const destSite = isPO(selectedItem) ? sites.find(s => s.id === selectedItem.siteId) : sites.find(s => s.id === (selectedItem as any).siteId);
    const destDisplay = destSite ? (
        <>
            {destSite.name} <span className="text-[#2C5E3B]/50 dark:text-[#A9CBA2]/50 font-normal lowercase">({destSite.code || destSite.id})</span>
        </>
    ) : 'Unknown Site';

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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
            <div className="glass-panel rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
                {/* 🌟 Modal Ambient Glow — hidden on mobile */}
                <div className="hidden md:block absolute -top-24 -right-24 w-64 h-64 bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="hidden md:block absolute -bottom-24 -left-24 w-64 h-64 bg-amber-600/10 dark:bg-amber-700/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] flex justify-between items-start bg-[#FAF8F5]/30 dark:bg-[#1C2620]/30 backdrop-blur-sm">
                    <div className="flex gap-3 md:gap-4 relative z-10">
                        <div className={`hidden md:flex p-3 rounded-xl border border-[#E2DCCE]/20 dark:border-[#A9CBA2]/20 transition-all duration-500 ${data.type === 'PO' ? 'bg-[#2C5E3B]/15 dark:bg-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-100'}`}>
                            {data.type === 'PO' ? <FileText size={24} /> : <Box size={24} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono">{data.reference}</h3>
                                <Badge variant="neutral" className="border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] bg-[#FAF8F5]/80 dark:bg-[#1C2620]/60 text-[9px] font-mono text-slate-600 dark:text-gray-400">
                                    {data.status}
                                </Badge>
                            </div>
                            <p className="text-slate-500 dark:text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                                {data.type === 'PO' ? <Truck size={12} className="text-slate-400 dark:text-zinc-500" /> : <Package size={12} className="text-slate-400 dark:text-zinc-500" />}
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Close details">
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-px bg-[#E2DCCE]/50 dark:bg-emerald-950/20 border-b border-[#E2DCCE]/50 dark:border-emerald-950/20">
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-3 md:p-4 flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex p-2 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/30 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE]/30 dark:border-white/5">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-1.5">{t('warehouse.date')}</p>
                            <p className="text-xs text-slate-900 dark:text-zinc-200 font-mono tracking-tighter font-black">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-3 md:p-4 flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex p-2 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/30 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE]/30 dark:border-white/5">
                            <User size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-1.5">{t('warehouse.processedBy')}</p>
                            <p className="text-xs text-slate-900 dark:text-zinc-200 font-black uppercase break-words leading-tight">
                                {data.user.name} {data.user.displayId && <span className="text-slate-400 dark:text-[#A9CBA2]/60 font-normal">({data.user.displayId})</span>}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-3 md:p-4 flex items-center gap-2 md:gap-3 col-span-2">
                        <div className="hidden md:flex p-2 bg-[#2C5E3B]/15 dark:bg-[#A9CBA2]/15 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20">
                            <ArrowRight size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60 uppercase font-black tracking-widest leading-none mb-1.5">{t('warehouse.destinationSite')}</p>
                            <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase break-words leading-tight">{destDisplay}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-[#FAF8F5]/30 dark:bg-[#18201B]/30">
                    <h4 className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Package size={12} className="text-slate-400" /> {t('warehouse.itemsReceived')}
                    </h4>
                    <div className="space-y-3">
                        {data.items.map((item: any, idx: number) => (
                            <div key={idx} className="group glass-panel-pushed hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 p-3 md:p-4 flex items-center justify-between transition-all shadow-sm">
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    <div className="hidden md:flex w-10 h-10 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/30 rounded-lg border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] items-center justify-center text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60 font-black text-xs font-mono">
                                        {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 dark:text-white font-black uppercase tracking-tight text-xs md:text-sm truncate">{item.name || item.productName || 'Unknown Item'}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                            <span className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black font-mono tracking-widest bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-1.5 py-0.5 rounded uppercase border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20">
                                                {item.sku}
                                            </span>
                                            {item.barcode && (
                                                <span className="text-[9px] text-slate-400 dark:text-zinc-600 font-black uppercase tracking-widest flex items-center gap-1">
                                                    <ScanBarcode size={10} /> {item.barcode}
                                                </span>
                                            )}
                                            {item.condition && (
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${item.condition === 'Good' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                                                    item.condition === 'Damaged' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' :
                                                        'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
                                                    }`}>
                                                    {item.condition}
                                                </span>
                                            )}
                                        </div>

                                        {/* Granular Metadata (Batch / Expiry) */}
                                        <div className="flex items-center gap-3 mt-2">
                                            {item.batchNumber && (
                                                <div className="flex items-center gap-1.5">
                                                    <Box size={10} className="text-slate-400 dark:text-zinc-600" />
                                                    <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Batch:</span>
                                                    <span className="text-[9px] font-black text-slate-900 dark:text-zinc-300 font-mono">{item.batchNumber}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Extra Barcodes */}
                                        {item.barcodes && item.barcodes.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {item.barcodes.map((code: string, cIdx: number) => (
                                                    <span key={cIdx} className="text-[8px] font-mono text-slate-400 dark:text-zinc-600 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 px-1.5 py-0.5 rounded">
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 md:gap-6 flex-shrink-0 ml-2">
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-400 dark:text-zinc-600 uppercase font-black tracking-widest mb-1.5">{t('warehouse.quantityToReceive')}</p>
                                        <p className="text-lg font-black text-[#2C5E3B] dark:text-[#A9CBA2] tabular-nums font-mono leading-none">
                                            {(() => {
                                                const baseQty = item.receivedQty || item.quantity || item.expectedQty || 0;
                                                const itemUnit = getSellUnit(item.unit);
                                                const sizeNum = parseFloat(item.size || '') || 0;
                                                const isWeightOrVolume = itemUnit.category === 'weight' || itemUnit.category === 'volume';

                                                if (isWeightOrVolume && sizeNum > 0) {
                                                    return (
                                                        <>
                                                            {baseQty}
                                                            <span className="text-[10px] text-[#2C5E3B]/70 dark:text-[#A9CBA2]/70 font-bold ml-1 uppercase">× {sizeNum}{itemUnit.shortLabel.toLowerCase()}</span>
                                                        </>
                                                    );
                                                }
                                                return (
                                                    <>
                                                        {baseQty}
                                                        {itemUnit.code !== 'UNIT' && (
                                                            <span className="text-[10px] text-[#2C5E3B]/70 dark:text-[#A9CBA2]/70 font-bold ml-1 uppercase">{itemUnit.shortLabel}</span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </p>
                                    </div>

                                    <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-white/10" />

                                    <button
                                        onClick={() => handleOpenReprint(item)}
                                        className="woody-btn-primary rounded-lg p-2.5 md:p-3 active:scale-95 text-[#FAF8F5] dark:text-[#1E3B24] flex items-center justify-center"
                                        title={t('warehouse.reprintLabel')}
                                    >
                                        <Printer size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-[#E2DCCE]/50 dark:border-emerald-950/20 bg-white/20 dark:bg-[#1C2620]/20 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="woody-btn-secondary w-full md:w-auto px-10 py-3.5 text-[10px] uppercase tracking-widest font-black"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>
            </div>
        </div>
    );
};
