import React from 'react';
import {
    X, Package, Box, MapPin, CheckCircle, ArrowRight,
    Clock, Archive, Info, Barcode, Thermometer, Loader2,
    User as UserIcon
} from 'lucide-react';
import { WMSJob, User, Site, Product, Employee } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import Button from '../../shared/Button';
import { getSellUnit } from '../../../utils/units';

export const formatBeautifulLocation = (loc: string | undefined, theme: 'purple' | 'cyan' | 'woody' = 'woody') => {
    if (!loc || loc === 'PENDING' || loc === 'Unassigned') {
        return <span className="text-base font-black font-mono text-gray-900 dark:text-white tracking-widest">{loc || 'PENDING'}</span>;
    }

    const parts = loc.split('-').map(p => p.trim());

    if (parts.length >= 3) {
        const themeClass = theme === 'woody'
            ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/25 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 shadow-sm'
            : theme === 'purple'
                ? 'bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border-[#2C5E3B]/20 dark:border-[#A9CBA2]/30'
                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
        const dimThemeClass = theme === 'woody'
            ? 'bg-[#FAF8F5] dark:bg-[#A9CBA2]/10 border-[#E2DCCE]/60 dark:border-[#A9CBA2]/15 text-[#2C5E3B] dark:text-[#A9CBA2]'
            : theme === 'purple'
                ? 'bg-[#2C5E3B]/5 dark:bg-[#2C5E3B]/10 text-[#2C5E3B]/80 dark:text-[#A9CBA2]/80 border-[#2C5E3B]/10 dark:border-[#A9CBA2]/20'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600/80 dark:text-amber-300/80 border-amber-100 dark:border-amber-500/20';

        return (
            <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border whitespace-nowrap ${themeClass}`}>
                    {parts[0]}
                </span>
                <span className="text-gray-300 dark:text-white/10 font-black text-[10px] select-none">/</span>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border whitespace-nowrap ${dimThemeClass}`}>
                    {parts[1]}
                </span>
                <span className="text-gray-300 dark:text-white/10 font-black text-[10px] select-none">/</span>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border whitespace-nowrap ${dimThemeClass}`}>
                    {parts[2]}
                </span>
            </div>
        );
    }

    return <span className="text-base font-black font-mono text-gray-900 dark:text-white tracking-widest uppercase">{loc}</span>;
};

interface PutawayJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    user: User | null;
    sites: Site[];
    products: Product[];
    onStartPutaway: (job: WMSJob) => void;
    onCompleteJob: (job: WMSJob) => void;
    isSubmitting: boolean;
    currentItem?: any;
    resolveOrderRef: (ref?: string) => string;
    employees?: Employee[];
}

export const PutawayJobModal: React.FC<PutawayJobModalProps> = ({
    isOpen,
    onClose,
    job,
    user,
    sites,
    products,
    onStartPutaway,
    onCompleteJob,
    isSubmitting,
    currentItem,
    resolveOrderRef,
    employees = []
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const getProduct = (item: any) => {
        const targetSiteId = job.siteId || (job as any).site_id;
        return products.find(p => (p.id === item.productId || p.sku === item.sku) && (p.siteId === targetSiteId || p.site_id === targetSiteId));
    };

    const sourceSite = sites.find(s => s.id === job.sourceSiteId || s.id === (job as any).site_id);
    const totalItems = job.lineItems?.length || 0;
    const completedItems = job.lineItems?.filter(i => i.status === 'Completed' || i.status === 'Picked').length || 0;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[160] flex items-stretch md:items-center justify-center p-0 md:p-4 bg-gray-900/60 dark:bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#0a0a0a] w-full md:max-w-5xl md:max-h-[92vh] md:rounded-[3rem] border-0 md:border-2 border-[#E2DCCE]/60 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">

                {/* Header Section */}
                <div className="relative p-5 md:p-10 border-b border-[#E2DCCE]/60 dark:border-white/10 bg-[#FAF8F5]/50 dark:bg-black/40 overflow-hidden shrink-0">
                    <div className="hidden md:block absolute -top-16 -right-16 w-80 h-80 bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 blur-[120px] rounded-full pointer-events-none" />
                    <div className="hidden md:block absolute -bottom-16 -left-16 w-80 h-80 bg-[#A9CBA2]/10 dark:bg-[#A9CBA2]/20 blur-[120px] rounded-full pointer-events-none" />

                    <div className="relative flex justify-between items-start">
                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex w-20 h-20 rounded-[2rem] bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/25 border-2 border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm transition-all duration-700 active:scale-95">
                                <Archive size={40} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">
                                        Job Details
                                    </h2>
                                    <span className="px-3 py-1 rounded-xl bg-white dark:bg-white/5 border-2 border-[#E2DCCE]/60 dark:border-white/10 text-[10px] md:text-xs font-black font-mono text-gray-900 dark:text-[#A9CBA2] shadow-inner uppercase tracking-[0.1em] transition-all group hover:border-[#2C5E3B]/30">
                                        #{formatJobId(job)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-5 text-[10px] font-black text-gray-400 dark:text-gray-500 flex-wrap uppercase tracking-[0.15em]">
                                    <span className={`px-3 py-1.5 rounded-xl border-2 shadow-sm transition-all ${job.priority === 'Critical' ? 'border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 animate-pulse' :
                                        job.priority === 'High' ? 'border-orange-200 dark:border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10' :
                                            'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5'
                                        }`}>
                                        {job.priority} Priority
                                    </span>
                                    <span className="flex items-center gap-2.5 font-mono bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10">
                                        <MapPin size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                        {sourceSite?.name || 'Automated Hub'}
                                    </span>
                                    <span className="hidden md:flex items-center gap-2.5 font-mono bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10">
                                        <Clock size={14} className="text-gray-400 dark:text-gray-600" />
                                        {new Date(job.createdAt || (job as any).date || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Close" className="p-3.5 bg-white dark:bg-white/5 border-2 border-[#E2DCCE]/65 dark:border-white/10 rounded-2xl text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-90">
                            <X size={24} />
                        </button>
                    </div>
                </div>


                {/* Simplified Mobile View */}
                <div className="md:hidden flex-1 flex flex-col justify-center px-4 py-4 space-y-4 bg-[radial-gradient(circle_at_50%_0%,rgba(44,94,59,0.05),transparent)]">
                    <div className="bg-[#FAF8F5]/85 dark:bg-white/[0.02] border-2 border-[#E2DCCE]/60 dark:border-white/10 p-5 rounded-[2rem] shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#2C5E3B]/5 blur-3xl rounded-full" />
                        <Package size={36} className="mx-auto mb-4 text-[#2C5E3B] dark:text-[#A9CBA2] opacity-50" />
                        
                        <div className="space-y-2 mb-4">
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] block">Total Inventory</span>
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                    <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums block tracking-tighter">{totalItems}</span>
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Items</span>
                                </div>
                                <div className="w-px h-8 bg-gray-100 dark:bg-white/10" />
                                <div className="text-center">
                                    <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums block tracking-tighter">
                                        {job.lineItems?.reduce((acc, curr) => acc + (curr.expectedQty || 0), 0)}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Units</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Job Progress</span>
                                <span className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black tabular-nums">{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner border border-gray-200 dark:border-white/10">
                                <div
                                    className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-full transition-all duration-1000 ease-out shadow-sm"
                                    ref={(el) => { if (el) el.style.width = `${progressPercent}%`; }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 text-center">
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                            <MapPin size={16} />
                            <span className="text-sm font-black uppercase tracking-widest">{sourceSite?.name || 'Local Matrix'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                            <Clock size={16} />
                            <span className="text-sm font-mono">{new Date(job.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Dashboard - Desktop Only */}
                <div className="hidden md:block flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(44,94,59,0.05),transparent)] relative">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        <div className="bg-[#FAF8F5]/50 dark:bg-white/[0.02] border-2 border-[#E2DCCE]/65 dark:border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#2C5E3B]/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#2C5E3B]/5 blur-3xl rounded-full" />
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] block mb-3">Progress</span>
                            <div className="flex items-baseline justify-between mb-3 gap-2">
                                <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{Math.round(progressPercent)}%</span>
                                <span className="text-[9px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-widest bg-[#2C5E3B]/10 dark:bg-white/5 px-2 py-1 rounded-lg border border-[#2C5E3B]/20 dark:border-white/10 whitespace-nowrap">{completedItems} / {totalItems}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner border border-gray-200 dark:border-white/10">
                                <div
                                    className="h-full bg-[#2C5E3B] dark:bg-[#A9CBA2] rounded-full transition-all duration-1000 ease-out shadow-sm"
                                    ref={(el) => { if (el) el.style.width = `${progressPercent}%`; }}
                                />
                            </div>
                        </div>

                        <div className="bg-[#FAF8F5]/50 dark:bg-white/[0.02] border-2 border-[#E2DCCE]/65 dark:border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] block mb-3">Status</span>
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] animate-pulse border-2 border-white/20 ${job.status === 'Completed' ? 'text-emerald-500 bg-emerald-500' : 'text-[#2C5E3B] bg-[#2C5E3B] dark:text-[#A9CBA2] dark:bg-[#A9CBA2]'}`} />
                                <span className={`text-xl font-black uppercase tracking-tight transition-colors ${job.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>
                                    {job.status}
                                </span>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <div className="p-1 bg-gray-50 dark:bg-white/5 rounded-md border border-gray-100 dark:border-white/10">
                                    <Clock size={11} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                </div>
                                <span className="text-[9px] text-gray-550 dark:text-gray-500 font-black uppercase tracking-[0.15em]">Updated</span>
                            </div>
                        </div>

                        <div className="bg-[#FAF8F5]/50 dark:bg-white/[0.02] border-2 border-[#E2DCCE]/65 dark:border-white/10 p-5 rounded-2xl shadow-lg group hover:border-[#2C5E3B]/20 transition-all duration-500">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] block mb-3">Reference</span>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#FAF8F5] dark:bg-[#A9CBA2]/10 border border-[#E2DCCE] dark:border-[#A9CBA2]/25 text-[#2C5E3B] dark:text-[#A9CBA2] shadow-sm transition-all group-hover:scale-105">
                                    <Barcode size={20} className="stroke-[2]" />
                                </div>
                                <span className="text-lg font-black font-mono text-gray-900 dark:text-white truncate uppercase tracking-tighter">
                                    {formatJobId(job).slice(-8)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Payload Manifest */}
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-4 text-xs uppercase tracking-[0.4em]">
                                <span className="w-8 h-8 rounded-xl bg-[#2C5E3B] flex items-center justify-center text-white shadow-md">
                                    <Package size={18} strokeWidth={2.5} />
                                </span>
                                Item Manifest
                            </h3>
                            <div className="flex items-center gap-3 bg-[#FAF8F5] dark:bg-white/5 px-4 py-2 rounded-2xl border-2 border-[#E2DCCE]/60 dark:border-white/10 shadow-lg">
                                <span className="text-[10px] font-black text-gray-900 dark:text-[#A9CBA2] uppercase tracking-widest tabular-nums">
                                    {totalItems} Verified Unit{totalItems !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            {job.lineItems?.map((item, idx) => {
                                const product = getProduct(item);
                                const isDone = item.status === 'Completed' || item.status === 'Picked';

                                return (
                                    <div key={idx} className={`group relative bg-white dark:bg-white/[0.03] border-2 ${isDone ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-500/5' : 'border-[#E2DCCE]/65 dark:border-white/10 shadow-xl'
                                        } rounded-[2rem] p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between hover:border-[#2C5E3B]/30 dark:hover:border-[#A9CBA2]/30 hover:shadow-2xl transition-all duration-700 gap-6 animate-in slide-in-from-bottom-4 duration-500 opacity-100`}>

                                        <div className="flex items-center gap-6">
                                            {/* Specimen Visual */}
                                            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gray-50 dark:bg-black/60 border-2 border-gray-100 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform duration-700">
                                                {product?.image ? (
                                                    <img src={product.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-200 dark:text-white/10">
                                                        <Package size={40} className="stroke-[1]" />
                                                    </div>
                                                )}
                                                {isDone && (
                                                    <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center">
                                                        <div className="p-2.5 bg-white dark:bg-black/80 rounded-full shadow-2xl border-2 border-emerald-500/50 scale-110">
                                                            <CheckCircle size={32} className="text-emerald-500 dark:text-emerald-400 stroke-[3]" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Specimen Analytics */}
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm md:text-base text-gray-900 dark:text-white font-black tracking-tight mb-2 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors uppercase truncate drop-shadow-sm leading-tight leading-normal whitespace-pre-wrap sm:whitespace-nowrap">
                                                    {item.name || product?.name || 'Unknown Item'}
                                                </h4>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="text-[10px] font-mono font-black text-gray-950 dark:text-[#A9CBA2] bg-[#FAF8F5] dark:bg-[#2C5E3B]/10 px-3 py-1.5 rounded-xl border border-[#E2DCCE]/60 dark:border-[#2C5E3B]/20 uppercase tracking-widest shadow-inner">
                                                        SKU: {item.sku || product?.sku || 'NULL-ID'}
                                                    </span>
                                                    {product?.barcode && (
                                                        <div className="flex items-center gap-2.5 text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest font-mono group-hover:text-gray-950 dark:group-hover:text-gray-300 transition-colors">
                                                            <Barcode size={14} className="opacity-50" />
                                                            {product.barcode}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                         {/* Deployment Logic */}
                                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between xl:justify-end gap-4 xl:gap-8 pl-0 xl:pl-4 border-t xl:border-t-0 border-gray-50 dark:border-white/5 pt-4 xl:pt-0 w-full xl:w-auto shrink-0">
                                            <div className="text-left xl:text-right flex flex-col items-start xl:items-end flex-1 xl:flex-none">
                                                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] block mb-1 sm:mb-2">Storage Location</span>
                                                <div className="relative group/loc">
                                                    <div className="absolute inset-0 bg-[#2C5E3B]/10 rounded-2xl blur-lg transition-all opacity-0 group-hover/loc:opacity-100" />
                                                    <div className="relative">
                                                        {formatBeautifulLocation(product?.location, 'woody')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 sm:gap-8 justify-between xl:justify-end">
                                                <div className="text-left xl:text-right">
                                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] block mb-1 sm:mb-2">Exp Quantity</span>
                                                    <span className="text-base sm:text-lg font-mono font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                                                        {(() => {
                                                            const baseQty = item.expectedQty || (item as any).quantity || 0;
                                                            const unitDef = getSellUnit(item.unit);
                                                            return `${baseQty}${unitDef.code !== 'UNIT' ? unitDef.shortLabel.slice(0, 2).toUpperCase() : ''}`;
                                                        })()}
                                                    </span>
                                                </div>
                                                {isDone ? (
                                                    <div className="text-right">
                                                        <span className="text-[9px] text-emerald-500 dark:text-emerald-800 font-black uppercase tracking-[0.3em] block mb-2 sm:mb-3">Processed</span>
                                                        <span className="text-lg sm:text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tighter">
                                                            {(() => {
                                                                const baseQty = item.pickedQty ?? item.expectedQty ?? 0;
                                                                const unitDef = getSellUnit(item.unit);
                                                                return `${baseQty}${unitDef.code !== 'UNIT' ? unitDef.shortLabel.slice(0, 2).toUpperCase() : ''}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStartPutaway(job);
                                                        }}
                                                        disabled={isSubmitting}
                                                        className="woody-btn-primary h-10 sm:h-12 px-4 sm:px-6 text-[10px] sm:text-[11px]"
                                                    >
                                                        Start Job
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

                {/* Secure Footer Interface */}
                <div className="p-6 md:p-10 border-t-2 border-[#E2DCCE]/60 dark:border-white/10 bg-[#FAF8F5]/50 dark:bg-black/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 shrink-0 relative z-20">
                    <div className="hidden md:flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-300 dark:text-gray-750 shadow-inner group transition-all">
                            <UserIcon size={28} className="group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 dark:text-gray-650 font-black uppercase tracking-[0.4em] mb-1">Assigned To</span>
                            <span className="text-sm font-black text-gray-950 dark:text-gray-300 uppercase tracking-[0.1em]">{(() => {
                                if (!job.assignedTo) return 'Unassigned';
                                const emp = employees.find(e => e.id === job.assignedTo || e.name === job.assignedTo);
                                return emp?.name || job.assignedTo;
                            })()}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-4">
                        <button
                            onClick={onClose}
                            className="woody-btn-secondary px-6 md:px-10 py-5 text-[11px]"
                        >
                            Close
                        </button>

                        {job.status !== 'Completed' && (
                            <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-4">
                                {progressPercent >= 100 ? (
                                    <button
                                        onClick={() => onCompleteJob(job)}
                                        disabled={isSubmitting}
                                        className="w-full px-6 md:px-16 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-md transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-40 border border-emerald-400/50"
                                    >
                                        {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <><CheckCircle size={24} strokeWidth={3} /> Complete Job</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onStartPutaway(job)}
                                        disabled={isSubmitting}
                                        className="woody-btn-primary px-6 md:px-16 py-5 text-[11px] flex items-center justify-center gap-4"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span className="whitespace-nowrap">{job.status === 'In-Progress' ? 'Continue Job' : 'Start Job'}</span>
                                                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-500 hidden xs:block" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
