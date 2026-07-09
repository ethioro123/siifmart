import React from 'react';
import { X, Calendar, User, Package, Archive, Box, MapPin, Printer, ArrowRight, Undo2 } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatProductSize, isWeightBased, isVolumeBased } from '../../../utils/units';
import { useLanguage } from '../../../contexts/LanguageContext';

import { useStore } from '../../../contexts/CentralStore';

interface PackDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    sites: any[];
    products: Product[];
    onReturn?: (job: WMSJob) => void;
    onReprintLabel?: (job: WMSJob, labelSize: string) => void;
}

export const PackDetailsModal: React.FC<PackDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    sites,
    products,
    onReturn,
    onReprintLabel
}) => {
    const { t } = useLanguage();
    const { user } = useStore();
    // Resolve User Name
    const userId = selectedItem.completedBy || selectedItem.assignedTo;
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
    // Use code if available, otherwise fallback to full ID unless it's a UUID
    const displayId = userObj?.code || (userId ? (isUUID(userId) ? userId.slice(0, 8).toUpperCase() : userId) : '');

    const userName = userObj ? userObj.name : (userId ? 'Unknown' : 'System');
    const userDisplayId = displayId;

    const sourceSite = sites.find(s => s.id === selectedItem.siteId);
    const destSite = sites.find(s => s.id === selectedItem.destSiteId);
    const trackingNum = selectedItem.trackingNumber || 'Not Generated';

    const [isPrintMenuOpen, setIsPrintMenuOpen] = React.useState(false);

    const getItemMeasureQty = (item: any, productInfo?: any) => {
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return (item as any).requestedMeasureQty;
        }
        if (productInfo) {
            const unit = productInfo.unit;
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = productInfo.size ? parseFloat(productInfo.size as string) : 0;
            if (isWeightVol && sizeNum > 0) {
                const expected = item.expectedQty || (item as any).quantity || 0;
                return expected * sizeNum;
            }
        }
        return null;
    };

    // Prioritize array fields. If selectedItem.items is a number, ignore it for the array.
    let rawItems = selectedItem.lineItems || (selectedItem as any).line_items ||
        (Array.isArray(selectedItem.items) ? selectedItem.items : null) || [];

    if (typeof rawItems === 'string') {
        try {
            rawItems = JSON.parse(rawItems);
        } catch (e) {
            rawItems = [];
        }
    }
    const itemsArray = Array.isArray(rawItems) ? rawItems : [];

    const data = {
        id: selectedItem.id,
        reference: formatJobId(selectedItem),
        title: t('warehouse.packJobTitle'),
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        userName: userName,
        userDisplayId: displayId,
        sourceSite: sourceSite,
        destSite: destSite,
        trackingNumber: trackingNum,
        items: itemsArray,
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-0 md:p-4 animate-in fade-in duration-200">
            <div className="bg-[#FAF8F5]/95 dark:bg-[#1C2620]/95 border-0 md:border border-[#E2DCCE] dark:border-emerald-950/20 w-full max-w-4xl h-[100dvh] md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                {/* 🌟 Modal Ambient Glow - Cyan Theme for Pack */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 dark:bg-teal-550/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-3 md:p-6 border-b border-[#E2DCCE]/60 dark:border-emerald-950/20 flex justify-between items-start bg-[#FAF8F5]/30 dark:bg-[#1C2620]/30 backdrop-blur-sm shrink-0">
                    <div className="flex gap-3 md:gap-4 relative z-10">
                        <div className="p-2 md:p-3 rounded-lg md:rounded-xl border border-[#E2DCCE]/25 dark:border-[#A9CBA2]/20 bg-[#2C5E3B]/15 dark:bg-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm transition-all duration-500">
                            <Archive size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono leading-none">{data.reference}</h3>
                                <div className="flex gap-1 md:gap-2">
                                    <span className={`px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[9px] font-mono border ${data.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                                        {data.status}
                                    </span>
                                    {itemsArray.some(li => (li.returnedQty || 0) > 0) && (
                                        <span className="px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[9px] font-mono border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                                            {itemsArray.filter(li => (li.returnedQty || 0) > 0).length} {t('warehouse.packing.ret')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-[#4D6E56] dark:text-[#7A9E83] text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 md:gap-2 md:mt-1">
                                <Box size={10} className="md:w-3 md:h-3 text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60" />
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 md:p-2.5 rounded-xl bg-[#E2DCCE]/40 dark:bg-white/5 text-[#2C5E3B] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white hover:bg-[#E2DCCE]/60 dark:hover:bg-white/10 transition-colors" aria-label={t('warehouse.dismiss')}>
                        <X size={18} className="md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-[#E2DCCE]/60 dark:bg-emerald-950/20 border-b border-[#E2DCCE]/60 dark:border-emerald-950/20 shrink-0">
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-3 md:p-4 flex items-center gap-2 md:gap-3 lg:col-span-1">
                        <div className="p-1.5 md:p-2 bg-[#FAF8F5]/85 dark:bg-[#1C2620]/30 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE]/30 dark:border-white/5">
                            <Calendar size={14} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">{t('warehouse.completed')}</p>
                            <p className="text-[10px] md:text-xs text-slate-900 dark:text-zinc-200 font-mono tracking-tighter truncate">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-3 md:p-4 flex items-center gap-2 md:gap-3 lg:col-span-1">
                        <div className="w-6 h-6 md:w-8 md:h-8 shrink-0 rounded-full bg-[#FAF8F5]/85 dark:bg-[#2C5E3B]/25 flex items-center justify-center border border-[#E2DCCE]/60 dark:border-[#2C5E3B]/45 shadow-inner">
                            <span className="text-[8px] md:text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2]">{(data.userName || 'S').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">{t('warehouse.putaway.jobDetails').split(' ')[0]}</p>
                            <p className="text-[10px] md:text-xs text-slate-900 dark:text-zinc-200 font-black uppercase break-words leading-tight">
                                {data.userName} <span className="text-stone-400 dark:text-stone-500 font-normal">({data.userDisplayId})</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-3 md:p-4 flex items-center gap-2 md:gap-3 col-span-2 lg:col-span-1">
                        <div className="p-1.5 md:p-2 bg-[#FAF8F5]/85 dark:bg-[#1C2620]/30 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE]/30 dark:border-white/5 shrink-0">
                            <Printer size={14} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">{t('warehouse.labelSize').split(' ')[0]}</p>
                            <p className="text-[10px] md:text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-mono tracking-tight font-black truncate">{data.trackingNumber}</p>
                        </div>
                    </div>

                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-3 md:p-4 flex items-center gap-2 md:gap-3 lg:col-span-1">
                        <div className="p-1.5 md:p-2 bg-[#FAF8F5]/85 dark:bg-[#1C2620]/30 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE]/30 dark:border-white/5 shrink-0">
                            <MapPin size={14} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">{t('warehouse.from')}</p>
                            <p className="text-[10px] md:text-xs text-slate-900 dark:text-zinc-200 font-black uppercase break-words leading-tight">
                                {data.sourceSite ? (
                                    <>
                                        {data.sourceSite.name} <span className="text-stone-400 dark:text-stone-500 font-normal lowercase">({data.sourceSite.code || data.sourceSite.id})</span>
                                    </>
                                ) : t('warehouse.packing.unknownSource')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-3 md:p-4 flex items-center gap-2 md:gap-3 lg:col-span-1">
                        <div className="p-1.5 md:p-2 bg-[#FAF8F5]/85 dark:bg-[#1C2620]/30 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE]/30 dark:border-white/5 shrink-0">
                            <ArrowRight size={14} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-0.5 md:mb-1 truncate">{t('warehouse.to')}</p>
                            <p className="text-[10px] md:text-xs text-slate-900 dark:text-zinc-200 font-black uppercase break-words leading-tight">
                                {data.destSite ? (
                                    <>
                                        {data.destSite.name} <span className="text-stone-400 dark:text-stone-500 font-normal lowercase">({data.destSite.code || data.destSite.id})</span>
                                    </>
                                ) : t('warehouse.packing.unknownDestination')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar bg-[#FAF8F5]/30 dark:bg-[#18201B]/30">
                    <h4 className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 md:mb-4">{t('warehouse.picking')}</h4>
                    <div className="space-y-2 md:space-y-3">
                        {itemsArray.map((item: any, idx: number) => {
                            const isShortPicked = item.orderedQty && item.orderedQty > (item.expectedQty || item.quantity || 1);

                            // Resolve full product info
                            const productInfo = products?.find(p =>
                                p.id === item.productId ||
                                p.sku === item.sku ||
                                p.productId === item.productId
                            );

                            return (
                                <div key={idx} className="bg-white/85 dark:bg-[#1C2620]/50 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl p-2.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-[#FAF8F5]/60 dark:hover:bg-[#1C2620]/80 transition-all shadow-sm">
                                    <div className="flex flex-row items-center gap-3 md:gap-4 min-w-0">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/30 rounded-lg border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] flex items-center justify-center text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60 font-black text-[10px] md:text-xs shrink-0 mt-0.5 sm:mt-0 self-start sm:self-center font-mono">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div className="min-w-0 pr-2">
                                            <p className="text-[11px] md:text-sm text-slate-900 dark:text-white font-black uppercase tracking-tight break-words leading-tight">{item.name || item.product?.name || productInfo?.name || 'Unknown Item'}</p>
                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 md:mt-2">
                                                <span className="text-[8px] md:text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-mono tracking-widest bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-1.5 md:px-2 py-0.5 rounded uppercase border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 shrink-0">
                                                    {item.sku || item.product?.sku || productInfo?.sku}
                                                </span>

                                                {(productInfo?.brand || (item as any).brand) && (
                                                    <span className="text-[8px] md:text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-widest bg-stone-100 dark:bg-white/5 px-1.5 md:px-2 py-0.5 rounded border border-dashed border-[#E2DCCE] dark:border-[#A9CBA2]/20 shrink-0 hidden sm:inline-flex">
                                                        {productInfo?.brand || (item as any).brand}
                                                    </span>
                                                )}

                                                {(productInfo?.category || item.category) && (
                                                    <span className="text-[8px] md:text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest border border-[#2C5E3B]/20 bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 px-1.5 md:px-2 py-0.5 rounded shadow-sm shrink-0">
                                                        {productInfo?.category || item.category}
                                                    </span>
                                                )}

                                                {productInfo?.size && (
                                                    <span className="text-[8px] md:text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-widest bg-stone-100 dark:bg-white/5 px-1.5 md:px-2 py-0.5 rounded border border-[#E2DCCE] dark:border-[#A9CBA2]/20 shrink-0">
                                                        {formatProductSize(productInfo)}
                                                    </span>
                                                )}

                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 sm:gap-6 ml-11 sm:ml-0 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-black/5 dark:border-white/5 justify-end">
                                        {item.returnedQty > 0 && (
                                            <div className="text-right">
                                                <p className="text-[8px] md:text-[9px] text-red-500 dark:text-red-400 uppercase font-black tracking-widest">{t('warehouse.packing.returned')}</p>
                                                <p className="text-sm md:text-lg font-black text-red-600 dark:text-red-400 tabular-nums font-mono leading-none">
                                                    {item.returnedQty}
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-[8px] md:text-[9px] text-zinc-400 dark:text-zinc-655 uppercase font-black tracking-widest">{t('warehouse.packing.reqPkd')}</p>
                                            <div className="flex items-center gap-1.5 md:gap-2 justify-end">
                                                {isShortPicked && (
                                                    <span className="text-[10px] md:text-xs font-mono font-bold text-red-500 line-through opacity-80 leading-none" title={t('warehouse.packing.shortPicked')}>{item.orderedQty}</span>
                                                )}
                                                <p className="text-sm md:text-lg font-black text-zinc-955 dark:text-[#A9CBA2] tabular-nums font-mono leading-none">
                                                    {(() => {
                                                        const expected = item.expectedQty || (item as any).quantity || 0;
                                                        const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0;
                                                        const measureQty = getItemMeasureQty(item, productInfo);
                                                        if (measureQty) {
                                                            const unitDef = productInfo?.unit ? productInfo.unit : '';
                                                            const sizeNum = productInfo?.size ? parseFloat(productInfo.size as string) : 0;
                                                            const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                                                            return <span className="text-sm md:text-lg font-mono font-black text-teal-400">{displayPickedCases} x {sizeNum} / {expected} x {sizeNum} <span className="text-[8px] md:text-[10px] text-teal-500/60 font-bold uppercase tracking-widest leading-none">{unitDef}</span></span>;
                                                        }
                                                        return <span className="text-sm md:text-lg font-mono font-black text-teal-400">{picked} / {expected}</span>;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 md:p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-955/40 flex justify-between items-center gap-3 shrink-0">
                    <div className="flex gap-2">
                        {data.status === 'Completed' && (
                            <>
                                <button
                                    onClick={() => onReturn?.(selectedItem)}
                                    className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all"
                                >
                                    <Undo2 size={12} className="md:w-3.5 md:h-3.5" />
                                    <span className="hidden sm:inline">{t('warehouse.packing.returnItems')}</span><span className="sm:hidden">{t('warehouse.driverHub.return')}</span>
                                </button>

                            </>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all"
                            >
                                <Printer size={12} className="md:w-3.5 md:h-3.5" />
                                <span className="hidden sm:inline">{t('warehouse.reprintPackLabel')}</span><span className="sm:hidden">{t('warehouse.reprintPackLabel').split(' ').slice(-1)[0]}</span>
                            </button>

                            {isPrintMenuOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-32 md:w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in slide-in-from-bottom-2 duration-200">
                                    {(['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'XL'] as const).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                onReprintLabel?.(selectedItem, size);
                                                setIsPrintMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 md:px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-[#2C5E3B] transition-colors"
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-6 md:px-8 py-2 md:py-2.5 bg-zinc-100 dark:bg-white text-zinc-955 dark:text-black hover:bg-zinc-200 dark:hover:bg-zinc-100 font-black uppercase tracking-widest text-[9px] md:text-[10px] rounded-xl transition-all shadow-md border border-zinc-300 dark:border-white/10"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>

            </div>
        </div>
    );
};
