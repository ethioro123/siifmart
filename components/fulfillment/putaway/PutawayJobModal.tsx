import React from 'react';
import {
    X, Package, Box, MapPin, CheckCircle, ArrowRight,
    Clock, Archive, Info, Barcode, Thermometer, Loader2
} from 'lucide-react';
import { WMSJob, User, Site, Product } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import Button from '../../shared/Button';
import { getSellUnit } from '../../../utils/units';

export const formatBeautifulLocation = (loc: string | undefined, theme: 'purple' | 'cyan' = 'cyan') => {
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
        <div className="fixed inset-0 z-[150] flex items-stretch md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f0f11] w-full md:max-w-4xl md:max-h-[90vh] md:rounded-3xl border-0 md:border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative p-4 md:p-6 border-b border-white/10 bg-black/40 overflow-hidden">
                    {/* Background Accent Glow — hidden on mobile */}
                    <div className="hidden md:block absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="hidden md:block absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative flex justify-between items-start">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="hidden md:flex w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                                <Archive size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 md:gap-3 mb-1">
                                    <h2 className="text-lg md:text-2xl font-black text-white tracking-tight uppercase italic">
                                        Putaway
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] md:text-xs font-mono text-gray-500">
                                        #{formatJobId(job)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 md:gap-4 text-xs font-medium text-gray-400 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border ${job.priority === 'Critical' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                        job.priority === 'High' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                            'border-white/10 text-gray-400'
                                        }`}>
                                        {job.priority}
                                    </span>
                                    <span className="hidden md:flex items-center gap-1.5">
                                        <MapPin size={12} className="text-blue-400" />
                                        {sourceSite?.name || 'Local Site'}
                                    </span>
                                    <span className="hidden md:flex items-center gap-1.5">
                                        <Clock size={12} className="text-gray-500" />
                                        {new Date(job.createdAt || (job as any).date || '').toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content - Robust Dashboard Layout */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.03),transparent)]">

                    {/* Status Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-white/[0.02] border border-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1 md:mb-2">Progress</span>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-xl md:text-2xl font-mono font-black text-white">{Math.round(progressPercent)}%</span>
                                <span className="text-xs text-gray-400 font-bold">{completedItems} / {totalItems} SKU's</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    ref={(el) => el?.style.setProperty('--progress-width', `${progressPercent}%`)}
                                    className="h-full bg-blue-500 transition-all duration-1000 ease-out w-[var(--progress-width)]"
                                />
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1 md:mb-2">Status</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${job.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'
                                    }`} />
                                <span className={`text-lg font-bold uppercase tracking-tight ${job.status === 'Completed' ? 'text-green-400' : 'text-blue-400'
                                    }`}>
                                    {job.status}
                                </span>
                            </div>
                        </div>
                        <div className="hidden md:block bg-white/[0.02] border border-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2">Job Number</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Info size={16} className="text-cyan-400" />
                                <span className="text-lg font-mono font-bold text-white truncate">
                                    {formatJobId(job)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Manifest */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Package size={16} className="text-blue-400" />
                                Putaway Manifest
                            </h3>
                            <span className="text-[10px] font-black text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase">
                                {totalItems} Distinct Items
                            </span>
                        </div>

                        <div className="space-y-3">
                            {job.lineItems?.map((item, idx) => {
                                const product = getProduct(item);
                                const isDone = item.status === 'Completed' || item.status === 'Picked';

                                return (
                                    <div key={idx} className={`group relative bg-white/[0.02] border ${isDone ? 'border-green-500/20 bg-green-500/[0.01]' : 'border-white/5'
                                        } rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/[0.04] transition-all duration-300 gap-3 md:gap-0`}>

                                        <div className="flex items-center gap-3 md:gap-5">
                                            {/* Item Thumbnail — hidden on mobile */}
                                            <div className="hidden md:block relative w-16 h-16 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
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
                                            <div>
                                                <h4 className="text-white font-bold tracking-tight mb-1 group-hover:text-blue-400 transition-colors">
                                                    {item.name || product?.name || 'Unknown SKU'}
                                                </h4>
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <span className="text-[10px] font-mono font-black text-gray-500 bg-black/40 px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter">
                                                        {item.sku || product?.sku || 'NO SKU'}
                                                    </span>
                                                    {product?.barcode && (
                                                        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-cyan-400/80 font-bold uppercase tracking-widest">
                                                            <Barcode size={10} />
                                                            {product.barcode}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deployment Details */}
                                        <div className="flex items-center gap-4 md:gap-10">
                                            {/* Target Location — hidden on mobile (shown below) */}
                                            <div className="hidden md:block text-right flex flex-col items-end">
                                                <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] block mb-1">Target Bay</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] mt-0.5" />
                                                    {formatBeautifulLocation(product?.location, 'cyan')}
                                                </div>
                                            </div>

                                            {/* Quantities & Scan */}
                                            <div className="flex items-center gap-3 md:gap-6 min-w-0 md:min-w-[180px] justify-end">
                                                <div className="text-right">
                                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] block mb-1">Expected</span>
                                                    <span className="text-lg font-mono font-black text-white">
                                                        {(() => {
                                                            const baseQty = item.expectedQty || (item as any).quantity || 0;
                                                            const unitDef = getSellUnit(item.unit);
                                                            const sizeNum = parseFloat((item as any).size || '') || 0;
                                                            if ((unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0) {
                                                                return `${baseQty} × ${sizeNum}${unitDef.shortLabel.toLowerCase()}`;
                                                            }
                                                            return `${baseQty} ${unitDef.code !== 'UNIT' ? unitDef.shortLabel : ''}`;
                                                        })()}
                                                    </span>
                                                </div>
                                                {isDone ? (
                                                    <div className="text-right">
                                                        <span className="text-[9px] text-green-600/60 font-black uppercase tracking-[0.2em] block mb-1">Verified</span>
                                                        <span className="text-lg font-mono font-black text-green-400">
                                                            {(() => {
                                                                const baseQty = item.pickedQty ?? item.expectedQty ?? 0;
                                                                const unitDef = getSellUnit(item.unit);
                                                                const sizeNum = parseFloat((item as any).size || '') || 0;
                                                                if ((unitDef.category === 'weight' || unitDef.category === 'volume') && sizeNum > 0) {
                                                                    return `${baseQty} × ${sizeNum}${unitDef.shortLabel.toLowerCase()}`;
                                                                }
                                                                return `${baseQty} ${unitDef.code !== 'UNIT' ? unitDef.shortLabel : ''}`;
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
                                                        className="h-10 px-4 bg-blue-600 font-black text-white rounded-xl text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        Scan
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
                <div className="p-4 md:p-6 border-t border-white/10 bg-black/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Assigned</span>
                            <span className="text-sm font-bold text-gray-300">{job.assignedTo || 'Unassigned / Available'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 md:px-6 py-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black text-xs uppercase tracking-widest transition-all"
                        >
                            Close Details
                        </button>

                        {job.status !== 'Completed' && (
                            <>
                                {progressPercent >= 100 ? (
                                    <button
                                        onClick={() => onCompleteJob(job)}
                                        disabled={isSubmitting}
                                        className="flex-1 md:flex-none px-6 md:px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl md:rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Complete Mission</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onStartPutaway(job)}
                                        disabled={isSubmitting}
                                        className="flex-1 md:flex-none px-6 md:px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl md:rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95 disabled:opacity-50 group"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                {job.status === 'In-Progress' ? 'Resume Scanning' : 'Start Scanning'}
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
