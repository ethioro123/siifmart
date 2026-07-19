import React, { useState } from 'react';
import { X, Calendar, User, Package, Box, MapPin, ArrowRight, Undo2, FileEdit } from 'lucide-react';
import { WMSJob, Product } from '../../../types';
import { useFulfillment } from '../FulfillmentContext';
import { formatDateTime } from '../../../utils/formatting';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { formatProductSize, isWeightBased, isVolumeBased, getSellUnit } from '../../../utils/units';
import { PickAmendModal } from './PickAmendModal';
import { useLanguage } from '../../../contexts/LanguageContext';

interface PickDetailsModalProps {
    selectedItem: WMSJob;
    onClose: () => void;
    resolveOrderRef: (ref?: string) => string;
    employees: any[];
    products?: Product[];
    sites?: any[];
    onReturn?: (job: WMSJob) => void;
}

export const PickDetailsModal: React.FC<PickDetailsModalProps> = ({
    selectedItem,
    onClose,
    resolveOrderRef,
    employees,
    products,
    sites = [],
    onReturn
}) => {
    const { t } = useLanguage();
    const { user, jobs, wmsJobsService, addNotification, refreshData } = useFulfillment();
    const [amendModalOpen, setAmendModalOpen] = useState(false);

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

    const userName = userObj ? userObj.name : (userId ? t('warehouse.picking.unknownUser') : t('warehouse.picking.systemUser'));
    const userDisplayId = displayId;

    // For Pick, the destination is usually Pack/Shipping, but the SOURCE location is what we care about per item
    let rawItems = selectedItem.lineItems || selectedItem.items || [];
    if (typeof rawItems === 'string') {
        try {
            rawItems = JSON.parse(rawItems);
        } catch (e) {
            rawItems = [];
        }
    }
    const itemsArray = Array.isArray(rawItems) ? rawItems : [];

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

    const data = {
        id: selectedItem.id,
        reference: formatJobId(selectedItem),
        title: t('warehouse.pickJobs'),
        status: selectedItem.status,
        date: selectedItem.updatedAt || selectedItem.createdAt || new Date().toISOString(),
        user: userName,
        items: itemsArray,
        sourceSite: sites.find(s => s.id === (selectedItem.siteId || (selectedItem as any).site_id)),
        destSite: sites.find(s => s.id === (selectedItem.destSiteId || (selectedItem as any).dest_site_id)),
        userDisplay: (
            <>
                {userName} <span className="text-zinc-550 dark:text-zinc-655 font-normal">({userDisplayId})</span>
            </>
        )
    };

    const sourceDisplay = data.sourceSite ? (
        <>
            {data.sourceSite.name} <span className="text-emerald-600/50 dark:text-emerald-400/50 font-normal">({data.sourceSite.code || data.sourceSite.id})</span>
        </>
    ) : t('warehouse.unknownSite');

    const destDisplay = data.destSite ? (
        <>
            {data.destSite.name} <span className="text-[#2C5E3B]/50 dark:text-[#A9CBA2]/50 font-normal">({data.destSite.code || data.destSite.id})</span>
        </>
    ) : t('warehouse.picking.internalOrUnknown');

    return (
        <>
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-2 sm:p-4 overflow-x-hidden animate-in fade-in duration-200">
            <div className="bg-[#FAF8F5] dark:bg-[#1C2620] border border-[#E2DCCE] dark:border-emerald-950/20 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">

                {/* 🌿 Modal Ambient Glow - Forest Green Theme for Pick */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#A9CBA2]/10 dark:bg-[#A9CBA2]/25 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-[#E2DCCE]/60 dark:border-emerald-950/20 flex justify-between items-start bg-[#FAF8F5] dark:bg-[#1C2620]">
                    <div className="flex gap-4 relative z-10">
                        <div className="p-3 rounded-xl border border-[#E2DCCE]/20 dark:border-[#A9CBA2]/20 bg-[#2C5E3B]/15 dark:bg-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm transition-all duration-500">
                            <Package size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-mono">{data.reference}</h3>
                                <div className="flex gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${(data.status || '').toLowerCase() === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                                        {data.status}
                                    </span>
                                    {itemsArray.some(li => (li.returnedQty || 0) > 0) && (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-mono border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                                            {itemsArray.filter(li => (li.returnedQty || 0) > 0).length} {t('warehouse.packing.returned').toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-[#4D6E56] dark:text-[#7A9E83] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                                <Box size={12} className="text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60" />
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl bg-[#E2DCCE]/40 dark:bg-white/5 text-[#2C5E3B] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white hover:bg-[#E2DCCE]/60 dark:hover:bg-white/10 transition-colors" aria-label={t('warehouse.dismiss')}>
                        <X size={20} />
                    </button>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#E2DCCE]/60 dark:bg-emerald-950/20 border-b border-[#E2DCCE]/60 dark:border-emerald-950/20">
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-4 flex items-center gap-3">
                        <div className="p-2 bg-[#FAF8F5]/85 dark:bg-[#1C2620]/30 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#E2DCCE]/30 dark:border-white/5">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-1">{t('warehouse.timeSort')}</p>
                            <p className="text-xs text-slate-900 dark:text-zinc-200 font-mono tracking-tighter">{formatDateTime(data.date, { showTime: true })}</p>
                        </div>
                    </div>
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FAF8F5]/85 dark:bg-[#2C5E3B]/25 flex items-center justify-center border border-[#E2DCCE]/60 dark:border-[#2C5E3B]/45 shadow-inner">
                            <span className="text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2]">{(data.user || 'S').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-1">{t('warehouse.putaway.jobDetails').split(' ')[0]}</p>
                            <p className="text-xs text-slate-900 dark:text-zinc-200 font-black uppercase break-words leading-tight">{data.userDisplay}</p>
                        </div>
                    </div>
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-4 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50/10 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-1">{t('warehouse.from')}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black uppercase break-words leading-tight">{sourceDisplay}</p>
                        </div>
                    </div>
                    <div className="bg-white/40 dark:bg-[#1C2620]/40 p-4 flex items-center gap-3">
                        <div className="p-2 bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 rounded-lg text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-white/5">
                            <ArrowRight size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none mb-1">{t('warehouse.to')}</p>
                            <p className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase break-words leading-tight">{destDisplay}</p>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#FAF8F5]/30 dark:bg-[#18201B]/30">
                    <h4 className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">{t('warehouse.itemsToPick')}</h4>
                    <div className="space-y-3">
                        {data.items.map((item: any, idx: number) => {
                            const isShortPicked = item.orderedQty && item.orderedQty > (item.expectedQty || 1);

                            // Resolve full product info
                            const productInfo = products?.find(p =>
                                p.id === item.productId ||
                                p.sku === item.sku ||
                                p.productId === item.productId
                            );

                            return (
                                <div key={idx} className="bg-white/85 dark:bg-[#1C2620]/50 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-xl p-4 flex items-center justify-between group hover:bg-[#FAF8F5]/60 dark:hover:bg-[#1C2620]/80 transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[#FAF8F5]/80 dark:bg-[#1C2620]/30 rounded-lg border border-[#E2DCCE]/60 dark:border-[#A9CBA2]/[0.06] flex items-center justify-center text-[#2C5E3B]/60 dark:text-[#A9CBA2]/60 font-black text-xs shrink-0 font-mono">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div>
                                            <p className="text-slate-900 dark:text-white font-black uppercase tracking-tight break-words leading-tight">{item.name || item.product?.name || productInfo?.name || t('warehouse.picking.unknownItem')}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-mono tracking-widest bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 px-2 py-0.5 rounded uppercase border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20">
                                                    {item.sku || item.product?.sku || productInfo?.sku}
                                                </span>

                                                {(productInfo?.brand || (item as any).brand) && (
                                                    <span className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-widest bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded border border-dashed border-[#E2DCCE] dark:border-[#A9CBA2]/20">
                                                        {productInfo?.brand || (item as any).brand}
                                                    </span>
                                                )}

                                                {(productInfo?.category || item.category) && (
                                                    <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest border border-[#2C5E3B]/20 bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 px-2 py-0.5 rounded shadow-sm">
                                                        {productInfo?.category || item.category}
                                                    </span>
                                                )}

                                                {productInfo?.size && (
                                                    <span className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-black uppercase tracking-widest bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded border border-[#E2DCCE] dark:border-[#A9CBA2]/20">
                                                        {formatProductSize(productInfo)}
                                                    </span>
                                                )}

                                            </div>

                                            {/* Source Location */}
                                            {item.location && item.location !== 'Unknown' && (
                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                                                    <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">{t('warehouse.selectedStorageLocation')}:</span>
                                                    <span className="text-[9px] font-black font-mono bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <MapPin size={10} /> {item.location}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {item.returnedQty > 0 && (
                                            <div className="text-right">
                                                <p className="text-[9px] text-red-500 dark:text-red-400 uppercase font-black tracking-widest">{t('warehouse.packing.returned')}</p>
                                                <p className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums font-mono">
                                                    {item.returnedQty}
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-[9px] text-zinc-400 dark:text-zinc-655 uppercase font-black tracking-widest">{t('warehouse.picking.reqPkd')}</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                {isShortPicked && (
                                                    <span className="text-xs font-mono font-bold text-red-500 line-through opacity-80" title="Short Picked">{item.orderedQty}</span>
                                                )}
                                                <p className="text-lg font-black text-zinc-950 dark:text-[#A9CBA2] tabular-nums font-mono">
                                                    {(() => {
                                                        const expected = item.expectedQty || (item as any).quantity || 0;
                                                        const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0;

                                                        const measureQty = getItemMeasureQty(item, productInfo);
                                                        if (measureQty && expected === item.expectedQty) {
                                                            const unitDef = productInfo?.unit ? productInfo.unit : '';
                                                            const sizeNum = productInfo?.size ? parseFloat(productInfo.size as string) : 0;
                                                            const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                                                            return <span className="text-lg font-mono font-black text-green-400">{displayPickedCases} x {sizeNum} / {expected} x {sizeNum} <span className="text-[10px] text-green-500/60 font-bold uppercase tracking-widest">{unitDef}</span></span>;
                                                        }
                                                        return <span className="text-lg font-mono font-black text-green-400">{picked} / {expected}</span>;
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
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 flex justify-between items-center gap-3 shrink-0">
                    <div className="flex gap-2">
                        {((selectedItem as any).status || '').toLowerCase() === 'completed' && (
                            <button
                                onClick={() => onReturn?.(selectedItem)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                            >
                                <Undo2 size={14} />
                                {t('warehouse.picking.returnItems')}
                            </button>
                        )}
                        {/* Amend Pick — manager only */}
                        {((selectedItem as any).status || '').toLowerCase() === 'completed' && (
                            <button
                                onClick={() => setAmendModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                            >
                                <FileEdit size={14} />
                                {t('warehouse.picking.amendQuantities')}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-zinc-100 dark:bg-white text-zinc-955 dark:text-black hover:bg-zinc-200 dark:hover:bg-zinc-100 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md border border-zinc-300 dark:border-white/10"
                    >
                        {t('warehouse.dismiss')}
                    </button>
                </div>

            </div>
        </div>

        {/* Pick Amendment Modal — supervisor only */}
        <PickAmendModal
            isOpen={amendModalOpen}
            onClose={() => setAmendModalOpen(false)}
            job={selectedItem}
            currentUser={user}
            allJobs={jobs}
            wmsJobsService={wmsJobsService}
            addNotification={addNotification}
            refreshData={refreshData}
        />
        </>
    );
};
