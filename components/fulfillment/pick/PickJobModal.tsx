import React from 'react';
import {
    X, Package, Box, MapPin, CheckCircle, ArrowRight,
    Clock, Archive, Info, Barcode, Loader2
} from 'lucide-react';
import { WMSJob, User, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';

export const formatBeautifulLocation = (loc: string | undefined, theme: 'purple' | 'cyan' = 'purple') => {
    if (!loc || loc === 'PENDING') {
        return <span className="text-base font-mono font-black text-white tracking-widest">{loc || 'PENDING'}</span>;
    }

    const parts = loc.split('-').map(p => p.trim());

    if (parts.length >= 3) {
        const themeClass = theme === 'purple'
            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
        const dimThemeClass = theme === 'purple'
            ? 'bg-purple-500/10 text-purple-300/80 border-purple-500/20'
            : 'bg-cyan-500/10 text-cyan-300/80 border-cyan-500/20';

        return (
            <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border whitespace-nowrap ${themeClass}`}>
                    Zone {parts[0]}
                </span>
                <span className="text-gray-600/50 font-black text-[10px]">-</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border whitespace-nowrap ${dimThemeClass}`}>
                    Aisle {parts[1]}
                </span>
                <span className="text-gray-600/50 font-black text-[10px]">-</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border whitespace-nowrap ${dimThemeClass}`}>
                    Bay {parts[2]}
                </span>
            </div>
        );
    }

    return <span className="text-base font-mono font-black text-white tracking-widest">{loc}</span>;
};

interface PickJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: WMSJob;
    user: User | null;
    sites: Site[];
    products: Product[];
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
    onStartPick,
    onCompleteJob,
    isSubmitting,
    currentItem,
    resolveOrderRef
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    // Helper: Get Product Details (Site-Aware)
    const getProduct = (item: any) => {
        const targetSiteId = job.siteId || (job as any).site_id;
        return products.find(p => (p.id === item.productId || p.sku === item.sku) && (p.siteId === targetSiteId || p.site_id === targetSiteId));
    };

    const sourceSite = sites.find(s => s.id === job.sourceSiteId || s.id === (job as any).site_id);
    const totalItems = job.lineItems?.length || 0;
    const completedItems = job.lineItems?.filter(i => i.status === 'Completed' || i.status === 'Picked').length || 0;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f0f11] w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header - Glassmorphic Pick Theme */}
                <div className="relative p-3 md:p-6 border-b border-white/10 bg-black/40 overflow-hidden shrink-0">
                    {/* Background Accent Glow (Purple/Pink for Pick) */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative flex justify-between items-start">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)] shrink-0">
                                <Package size={20} className="md:w-7 md:h-7" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 md:gap-3 mb-0.5 md:mb-1">
                                    <h2 className="text-sm md:text-2xl font-black text-white tracking-tight uppercase italic truncate">
                                        Pick Mission
                                    </h2>
                                    <span className="px-1.5 md:px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] md:text-xs font-mono text-gray-500 shrink-0">
                                        #{formatJobId(job)}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-4 text-[9px] md:text-xs font-medium text-gray-400">
                                    <span className={`px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[10px] uppercase font-black tracking-widest border ${job.priority === 'Critical' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                        job.priority === 'High' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                            'border-white/10 text-gray-400'
                                        }`}>
                                        {job.priority} Priority
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={12} className="text-purple-400" />
                                        {sourceSite?.name || 'Local Site'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={10} className="text-gray-500 md:w-3 md:h-3" />
                                        {new Date(job.createdAt || (job as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Close" className="p-1.5 md:p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors shrink-0">
                            <X size={20} className="md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>

                {/* Content - Robust Dashboard Layout */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.03),transparent)]">

                    {/* Status Dashboard (Hidden on Mobile to save massive vertical space) */}
                    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2">Overall Progress</span>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-2xl font-mono font-black text-white">{Math.round(progressPercent)}%</span>
                                <span className="text-xs text-gray-400 font-bold">{completedItems} / {totalItems} SKU's</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    ref={(el) => el?.style.setProperty('--progress-width', `${progressPercent}%`)}
                                    className="h-full bg-purple-500 transition-all duration-1000 ease-out w-[var(--progress-width)]"
                                />
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2">Job Status</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${job.status === 'Completed' ? 'bg-green-500' : 'bg-purple-500'
                                    }`} />
                                <span className={`text-lg font-bold uppercase tracking-tight ${job.status === 'Completed' ? 'text-green-400' : 'text-purple-400'
                                    }`}>
                                    {job.status}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2">Job Number</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Info size={16} className="text-pink-400" />
                                <span className="text-lg font-mono font-bold text-white truncate">
                                    {formatJobId(job)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Manifest */}
                    <div>
                        <div className="flex items-center justify-between mb-2 md:mb-4 shrink-0">
                            <h3 className="font-bold text-white flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm uppercase tracking-widest">
                                <Box size={14} className="text-purple-400 md:w-4 md:h-4" />
                                Pick Manifest
                            </h3>
                            <span className="text-[8px] md:text-[10px] font-black text-gray-500 bg-white/5 px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-white/5 uppercase">
                                {totalItems} Distinct Items
                            </span>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                            {job.lineItems?.map((item, idx) => {
                                const product = getProduct(item);
                                const isDone = item.status === 'Completed' || item.status === 'Picked';

                                return (
                                    <div key={idx} className={`group relative bg-white/[0.02] border ${isDone ? 'border-green-500/20 bg-green-500/[0.01]' : 'border-white/5'
                                        } rounded-xl md:rounded-2xl p-2 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-white/[0.04] transition-all duration-300 gap-2 md:gap-0`}>

                                        <div className="flex items-center gap-2 md:gap-5 w-full md:w-auto">
                                            {/* Item Thumbnail */}
                                            <div className="hidden md:flex relative w-16 h-16 rounded-xl bg-black/40 border border-white/10 items-center justify-center overflow-hidden shrink-0">
                                                {product?.image ? (
                                                    <img src={product.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full bg-white/[0.03] flex items-center justify-center text-white/20">
                                                        <Package size={28} strokeWidth={1.5} />
                                                    </div>
                                                )}
                                                {isDone && (
                                                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                                        <CheckCircle size={20} className="text-green-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Item Info */}
                                            <div className="min-w-0">
                                                <h4 className="text-white text-xs md:text-base font-bold tracking-tight mb-0.5 md:mb-1 group-hover:text-purple-400 transition-colors truncate">
                                                    {item.name || product?.name || 'Unknown SKU'}
                                                </h4>
                                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                                    <span className="text-[8px] md:text-[10px] font-mono font-black text-gray-500 bg-black/40 px-1.5 md:px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter w-fit">
                                                        {item.sku || product?.sku || 'NO SKU'}
                                                    </span>
                                                    {product?.barcode && (
                                                        <div className="flex items-center gap-1 md:gap-1.5 text-[8px] md:text-[10px] text-pink-400/80 font-bold uppercase tracking-widest w-fit">
                                                            <Barcode size={8} className="md:w-[10px] md:h-[10px]" />
                                                            {product.barcode}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Picking Details */}
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-10 w-full md:w-auto">
                                            {/* Source Location */}
                                            <div className="text-left md:text-right flex flex-col items-start md:items-end w-full md:w-auto">
                                                <span className="text-[8px] md:text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] block mb-0.5 md:mb-1">Source Bay</span>
                                                <div className="flex items-center gap-1.5 md:gap-2">
                                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] mt-0.5" />
                                                    {formatBeautifulLocation(product?.location, 'purple')}
                                                </div>
                                            </div>

                                            {/* Quantities & Scan */}
                                            <div className="flex items-center justify-between md:justify-end gap-3 md:gap-6 w-full md:w-auto md:min-w-[180px]">
                                                <div className="text-left md:text-right">
                                                    <span className="text-[8px] md:text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] block mb-0.5 md:mb-1">Required</span>
                                                    {(() => {
                                                        let expected = item.expectedQty || (item as any).quantity || 0;
                                                        if ((item as any).requestedMeasureQty && expected === item.expectedQty) {
                                                            const unitDef = product?.unit ? product.unit : ''; // Fallback since we don't have getSellUnit imported natively here, we'll just use the raw string
                                                            return <span className="text-sm md:text-lg font-mono font-black text-white">{(item as any).requestedMeasureQty} <span className="text-[8px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest">{unitDef}</span></span>;
                                                        }
                                                        return <span className="text-sm md:text-lg font-mono font-black text-white">{expected}</span>;
                                                    })()}
                                                </div>
                                                {isDone ? (
                                                    <div className="text-right">
                                                        <span className="text-[8px] md:text-[9px] text-green-600/60 font-black uppercase tracking-[0.2em] block mb-0.5 md:mb-1">Picked</span>
                                                        {(() => {
                                                            const expected = item.expectedQty || (item as any).quantity || 0;
                                                            const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0;
                                                            let displayPicked = picked;

                                                            if ((item as any).requestedMeasureQty && expected === item.expectedQty) {
                                                                const unitDef = product?.unit ? product.unit : '';
                                                                // Calculate proportional volume picked.
                                                                if (expected > 0) {
                                                                    const fillRatio = picked / expected;
                                                                    displayPicked = (item as any).requestedMeasureQty * fillRatio;
                                                                }
                                                                return <span className="text-sm md:text-lg font-mono font-black text-green-400">{displayPicked} <span className="text-[8px] md:text-[10px] text-green-500/60 font-bold uppercase tracking-widest">{unitDef}</span></span>;
                                                            }
                                                            return <span className="text-sm md:text-lg font-mono font-black text-green-400">{picked}</span>;
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStartPick(job);
                                                        }}
                                                        disabled={isSubmitting}
                                                        className="h-8 md:h-10 px-3 md:px-4 bg-purple-600 font-black text-white rounded-lg md:rounded-xl text-[8px] md:text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:bg-purple-500 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        Pick
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

                {/* Footer Actions */}
                <div className="p-3 md:p-6 border-t border-white/10 bg-black/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 shrink-0">
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Assigned Specialist</span>
                            <span className="text-sm font-bold text-gray-300">{job.assignedTo || 'Unassigned / Available'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black text-[10px] md:text-xs uppercase tracking-widest transition-all w-full md:w-auto text-center"
                        >
                            Close Details
                        </button>

                        {job.status !== 'Completed' && (
                            <>
                                {progressPercent >= 100 ? (
                                    <button
                                        onClick={() => onCompleteJob(job)}
                                        disabled={isSubmitting}
                                        className="justify-center px-4 md:px-8 py-2 md:py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 md:gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" /> : <><CheckCircle size={16} className="md:w-[18px] md:h-[18px]" /> Complete Pick</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onStartPick(job)}
                                        disabled={isSubmitting}
                                        className="justify-center px-4 md:px-8 py-2 md:py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2 md:gap-3 active:scale-95 disabled:opacity-50 group"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" />
                                        ) : (
                                            <>
                                                {job.status === 'In-Progress' ? 'Resume Picking' : 'Start Picking'}
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
        </div >
    );
};
