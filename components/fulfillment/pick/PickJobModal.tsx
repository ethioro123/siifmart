import React from 'react';
import {
    X, Package, Box, MapPin, CheckCircle, ArrowRight,
    Clock, Info, Barcode, Loader2
} from 'lucide-react';
import { WMSJob, User, Site, Product, Employee } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { isWeightBased, isVolumeBased } from '../../../utils/units';

export const formatBeautifulLocation = (loc: string | undefined, theme: 'purple' | 'cyan' | 'woody' = 'woody', t?: (key: string) => string) => {
    if (!loc || loc === 'PENDING') {
        return <span className="text-base font-mono font-black text-gray-900 dark:text-white tracking-widest">{loc || 'PENDING'}</span>;
    }

    const parts = loc.split('-').map(p => p.trim());

    if (parts.length >= 3) {
        const themeClass = theme === 'woody'
            ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/25 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 shadow-sm'
            : theme === 'purple'
                ? 'bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30'
                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
        const dimThemeClass = theme === 'woody'
            ? 'bg-[#FAF8F5] dark:bg-[#A9CBA2]/10 border-[#E2DCCE]/65 dark:border-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2]'
            : theme === 'purple'
                ? 'bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 text-[#2C5E3B]/80 dark:text-[#A9CBA2]/80 border-[#2C5E3B]/10 dark:border-[#A9CBA2]/20'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600/80 dark:text-amber-300/80 border-amber-100 dark:border-amber-500/20';

        return (
            <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border whitespace-nowrap ${themeClass}`}>
                    {t ? t('warehouse.zone') : 'Zone'} {parts[0]}
                </span>
                <span className="text-gray-400 dark:text-gray-600/50 font-black text-[10px]">-</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border whitespace-nowrap ${dimThemeClass}`}>
                    {t ? t('warehouse.aisle') : 'Aisle'} {parts[1]}
                </span>
                <span className="text-gray-400 dark:text-gray-600/50 font-black text-[10px]">-</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border whitespace-nowrap ${dimThemeClass}`}>
                    {t ? t('warehouse.bay') : 'Bay'} {parts[2]}
                </span>
            </div>
        );
    }

    return <span className="text-base font-mono font-black text-gray-900 dark:text-white tracking-widest">{loc}</span>;
};

interface PickJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    user: User | null;
    sites: Site[];
    products: Product[];
    employees?: Employee[];
    onStartPick: (job: WMSJob) => void;
    onCompleteJob: (job: WMSJob) => void;
    isSubmitting: boolean;
    currentItem?: any;
    resolveOrderRef: (ref?: string) => string;
}

export const PickJobModal: React.FC<PickJobModalProps> = ({
    isOpen,
    onClose,
    job,
    user,
    sites,
    products,
    employees = [],
    onStartPick,
    onCompleteJob,
    isSubmitting,
    currentItem,
    resolveOrderRef
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const getProduct = (item: any) => {
        const targetSiteId = job.siteId || (job as any).site_id;
        return products.find(p => (p.id === item.productId || p.sku === item.sku) && (p.siteId === targetSiteId || p.site_id === targetSiteId));
    };

    const getItemMeasureQty = (item: any, product?: any) => {
        if ((item as any).requestedMeasureQty !== undefined && (item as any).requestedMeasureQty !== null) {
            return (item as any).requestedMeasureQty;
        }
        const prod = product || getProduct(item);
        if (prod) {
            const unit = prod.unit;
            const isWeightVol = isWeightBased(unit) || isVolumeBased(unit);
            const sizeNum = prod.size ? parseFloat(prod.size as string) : 0;
            if (isWeightVol && sizeNum > 0) {
                const expected = item.expectedQty || (item as any).quantity || 0;
                return expected * sizeNum;
            }
        }
        return null;
    };

    const sourceSite = sites.find(s => s.id === job.sourceSiteId || s.id === (job as any).site_id);
    const totalItems = job.lineItems?.length || 0;
    const completedItems = job.lineItems?.filter(i => {
        const isDone = i.status === 'Completed' || i.status === 'Picked';
        const measureQty = getItemMeasureQty(i);
        const requiredAmount = measureQty || i.expectedQty || 1;
        return isDone || (i.pickedQty || 0) >= requiredAmount;
    }).length || 0;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 md:p-4 bg-black/40 dark:bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] rounded-3xl border border-[#E2DCCE]/60 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative p-3 md:p-6 border-b border-[#E2DCCE]/60 dark:border-white/10 bg-[#FAF8F5]/50 dark:bg-black/40 overflow-hidden shrink-0">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#2C5E3B]/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#A9CBA2]/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative flex justify-between items-start">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/25 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm shrink-0">
                                <Package size={20} className="md:w-7 md:h-7" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 md:gap-3 mb-0.5 md:mb-1">
                                    <h2 className="text-sm md:text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase truncate">
                                        {t('warehouse.pickJobs')}
                                    </h2>
                                    <span className="px-1.5 md:px-2 py-0.5 rounded-lg bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-[10px] md:text-xs font-mono text-gray-655 dark:text-gray-500 shrink-0">
                                        #{formatJobId(job)}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-4 text-[9px] md:text-xs font-medium text-gray-550 dark:text-gray-400">
                                    <span className={`px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[10px] uppercase font-black tracking-widest border ${job.priority === 'Critical' ? 'border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10' :
                                        job.priority === 'High' ? 'border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' :
                                            'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {job.priority} {t('warehouse.prioritySort')}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={12} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                        <span className="break-words leading-tight text-gray-700 dark:text-gray-400">
                                            {sourceSite ? (
                                                <>
                                                    {sourceSite.name} <span className="text-gray-500 dark:text-zinc-600 font-normal lowercase">({sourceSite.code || sourceSite.id})</span>
                                                </>
                                            ) : t('warehouse.picking.localSite')}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-gray-500">
                                        <Clock size={10} className="md:w-3 md:h-3 text-gray-400" />
                                        {new Date(job.createdAt || (job as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label={t('warehouse.dismiss')} className="p-1.5 md:p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0">
                            <X size={20} className="md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-6 custom-scrollbar dark:bg-[radial-gradient(circle_at_50%_0%,rgba(44,94,59,0.03),transparent)]">
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                        <div className="bg-[#FAF8F5]/50 dark:bg-white/[0.02] border border-[#E2DCCE]/65 dark:border-white/5 p-4 rounded-2xl">
                            <span className="text-[10px] text-gray-550 dark:text-gray-500 font-black uppercase tracking-widest block mb-2">{t('warehouse.putaway.progress')}</span>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-2xl font-mono font-black text-gray-900 dark:text-white">{Math.round(progressPercent)}%</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">{completedItems} / {totalItems} SKU's</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                                <div ref={(el) => { if (el) el.style.width = `${progressPercent}%`; }} className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] transition-all duration-1000 ease-out" />
                            </div>
                        </div>
                        <div className="bg-[#FAF8F5]/50 dark:bg-white/[0.02] border border-[#E2DCCE]/65 dark:border-white/5 p-4 rounded-2xl">
                            <span className="text-[10px] text-gray-550 dark:text-gray-500 font-black uppercase tracking-widest block mb-2">{t('warehouse.status')}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${job.status === 'Completed' ? 'bg-green-500' : 'bg-[#2C5E3B] dark:bg-[#A9CBA2]'}`} />
                                <span className={`text-lg font-bold uppercase tracking-tight ${job.status === 'Completed' ? 'text-green-600 dark:text-green-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>
                                    {job.status}
                                </span>
                            </div>
                        </div>
                        <div className="bg-[#FAF8F5]/50 dark:bg-white/[0.02] border border-[#E2DCCE]/65 dark:border-white/5 p-4 rounded-2xl">
                            <span className="text-[10px] text-gray-550 dark:text-gray-500 font-black uppercase tracking-widest block mb-2">{t('warehouse.jobId')}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Info size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                <span className="text-lg font-mono font-bold text-gray-900 dark:text-white truncate">
                                    {formatJobId(job)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2 md:mb-4 shrink-0">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm uppercase tracking-widest">
                                <Box size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2] md:w-4 md:h-4" />
                                {t('warehouse.pickJobs')}
                            </h3>
                            <span className="text-[8px] md:text-[10px] font-black text-gray-500 bg-[#FAF8F5] dark:bg-white/5 px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-[#E2DCCE]/60 dark:border-white/5 uppercase">
                                {totalItems} {t('warehouse.itemPlural')}
                            </span>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                            {job.lineItems?.map((item, idx) => {
                                const product = getProduct(item);
                                const isDone = item.status === 'Completed' || item.status === 'Picked';

                                return (
                                    <div key={idx} className={`group relative bg-white dark:bg-white/[0.02] border ${isDone ? 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/[0.01]' : 'border-[#E2DCCE]/60 dark:border-white/5'} rounded-xl md:rounded-2xl p-2 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-[#FAF8F5] dark:hover:bg-white/[0.04] transition-all duration-300 gap-2 md:gap-0 shadow-sm dark:shadow-none`}>

                                        <div className="flex items-center gap-2 md:gap-5 w-full md:w-auto">
                                            <div className="hidden md:flex relative w-16 h-16 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 items-center justify-center overflow-hidden shrink-0">
                                                {product?.image ? (
                                                    <img src={product.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-white/20">
                                                        <Package size={28} strokeWidth={1.5} />
                                                    </div>
                                                )}
                                                {isDone && (
                                                    <div className="absolute inset-0 bg-green-100/50 dark:bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                                        <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <h4 className={`text-xs md:text-base font-bold tracking-tight mb-0.5 md:mb-1 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors truncate ${isDone ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                                    {item.name || product?.name || t('warehouse.picking.unknownSKU')}
                                                </h4>
                                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                                    <span className="text-[8px] md:text-[10px] font-mono font-black text-gray-955 dark:text-[#A9CBA2] bg-stone-50 dark:bg-black/40 px-1.5 md:px-2 py-0.5 rounded border border-[#E2DCCE]/60 dark:border-white/5 uppercase tracking-tighter w-fit">
                                                        {item.sku || product?.sku || t('warehouse.picking.noSKUCaps')}
                                                    </span>
                                                    {product?.barcode && (
                                                        <div className="flex items-center gap-1 md:gap-1.5 text-[8px] md:text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-bold uppercase tracking-widest w-fit">
                                                            <Barcode size={8} className="md:w-[10px] md:h-[10px]" />
                                                            {product.barcode}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between xl:justify-end gap-4 xl:gap-8 pl-0 xl:pl-4 border-t xl:border-t-0 border-gray-50 dark:border-white/5 pt-4 xl:pt-0 w-full xl:w-auto shrink-0">
                                            <div className="text-left md:text-right flex flex-col items-start md:items-end w-full md:w-auto">
                                                <span className="text-[8px] md:text-[9px] text-gray-500 dark:text-gray-600 font-black uppercase tracking-[0.2em] block mb-0.5 md:mb-1">{t('warehouse.selectedStorageLocation')}</span>
                                                <div className="flex items-center gap-1.5 md:gap-2">
                                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] shadow-sm mt-0.5" />
                                                    {formatBeautifulLocation(product?.location, 'woody', t)}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6 w-full md:w-auto md:min-w-[180px]">
                                                <div className="text-left md:text-right">
                                                    <span className="text-[8px] md:text-[9px] text-gray-550 dark:text-gray-600 font-black uppercase tracking-[0.2em] block mb-0.5 md:mb-1">{t('warehouse.expected')}</span>
                                                    {(() => {
                                                        let expected = item.expectedQty || (item as any).quantity || 0;
                                                        const measureQty = getItemMeasureQty(item, product);
                                                        if (measureQty && expected === item.expectedQty) {
                                                            const unitDef = product?.unit ? product.unit : '';
                                                            const sizeNum = product?.size ? parseFloat(product.size as string) : 0;
                                                            return <span className="text-sm md:text-lg font-mono font-black text-gray-900 dark:text-white">{expected} x {sizeNum} <span className="text-[8px] md:text-[10px] text-gray-555 font-bold uppercase tracking-widest">{unitDef}</span></span>;
                                                        }
                                                        return <span className="text-sm md:text-lg font-mono font-black text-gray-900 dark:text-white">{expected}</span>;
                                                    })()}
                                                </div>
                                                {isDone ? (
                                                    <div className="text-right border-l border-gray-200 dark:border-white/10 pl-4">
                                                        <span className="text-[8px] md:text-[9px] text-green-600 dark:text-green-600/60 font-black uppercase tracking-[0.2em] block mb-0.5 md:mb-1">{t('warehouse.picking')}</span>
                                                        {(() => {
                                                            const expected = item.expectedQty || (item as any).quantity || 0;
                                                            const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0;
                                                            const measureQty = getItemMeasureQty(item, product);

                                                            if (measureQty && expected === item.expectedQty) {
                                                                const unitDef = product?.unit ? product.unit : '';
                                                                const sizeNum = product?.size ? parseFloat(product.size as string) : 0;
                                                                const displayPickedCases = picked <= expected ? picked : (sizeNum > 0 ? picked / sizeNum : picked);
                                                                return <span className="text-sm md:text-lg font-mono font-black text-green-600 dark:text-green-400">{displayPickedCases} x {sizeNum} <span className="text-[8px] md:text-[10px] text-green-600/60 dark:text-green-500/60 font-bold uppercase tracking-widest">{unitDef}</span></span>;
                                                            }
                                                            return <span className="text-sm md:text-lg font-mono font-black text-green-600 dark:text-green-400">{picked}</span>;
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onStartPick(job); }}
                                                        disabled={isSubmitting}
                                                        className="woody-btn-primary h-8 md:h-10 px-3 md:px-4 text-[8px] md:text-[10px]"
                                                    >
                                                        {t('warehouse.pickJobs').split(' ')[0]}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 md:p-6 border-t border-[#E2DCCE]/60 dark:border-white/10 bg-[#FAF8F5]/50 dark:bg-black/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 shrink-0">
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-550 font-black uppercase tracking-widest">{t('warehouse.putaway.jobDetails').split(' ')[0]} {t('warehouse.assignedTo') || 'Assigned'}</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-300">
                                {(() => {
                                    if (!job.assignedTo) return t('warehouse.putaway.unassigned') || 'Unassigned / Available';
                                    const emp = employees.find(e => e.id === job.assignedTo || e.name === job.assignedTo || (e as any).email === job.assignedTo);
                                    return emp?.name || job.assignedTo.slice(-8).toUpperCase();
                                })()}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                        <button
                            onClick={onClose}
                            className="woody-btn-secondary px-4 md:px-6 py-2 md:py-3 text-[10px] md:text-xs"
                        >
                            {t('warehouse.dismiss')}
                        </button>

                        {job.status !== 'Completed' && (
                            <>
                                {progressPercent >= 100 ? (
                                    <button
                                        onClick={() => onCompleteJob(job)}
                                        disabled={isSubmitting}
                                        className="justify-center px-4 md:px-8 py-2 md:py-3 bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest shadow-md border border-emerald-400/50 transition-all flex items-center gap-2 md:gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" /> : <><CheckCircle size={16} className="md:w-[18px] md:h-[18px]" /> {t('warehouse.completed')}</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onStartPick(job)}
                                        disabled={isSubmitting}
                                        className="woody-btn-primary px-4 md:px-8 py-2 md:py-3 text-[10px] md:text-sm flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" />
                                        ) : (
                                            <>
                                                {job.status === 'In-Progress' ? t('warehouse.continueArrow') : t('warehouse.startArrow')}
                                                <ArrowRight size={16} className="md:w-[18px] md:h-[18px] group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
