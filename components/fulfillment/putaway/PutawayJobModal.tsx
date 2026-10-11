import React from 'react';
import {
    X, Package, Box, MapPin, CheckCircle, ArrowRight,
    Clock, Archive, Info, Barcode, Thermometer, Loader2,
    User as UserIcon, Zap
} from 'lucide-react';
import { WMSJob, User, Site, Product, Employee } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getSellUnit } from '../../../utils/units';

export const formatBeautifulLocation = (loc: string | undefined, theme: 'purple' | 'cyan' | 'woody' = 'woody') => {
    if (!loc || loc === 'PENDING' || loc === 'Unassigned') {
        return <span className="text-sm font-semibold font-mono text-[var(--theme-text-primary)] tracking-wider">{loc || 'PENDING'}</span>;
    }

    const parts = loc.split('-').map(p => p.trim());

    if (parts.length >= 3) {
        return (
            <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] whitespace-nowrap">
                    {parts[0]}
                </span>
                <span className="text-[var(--theme-text-secondary)] opacity-40 font-semibold text-[11px] select-none">/</span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] whitespace-nowrap">
                    {parts[1]}
                </span>
                <span className="text-[var(--theme-text-secondary)] opacity-40 font-semibold text-[11px] select-none">/</span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] whitespace-nowrap">
                    {parts[2]}
                </span>
            </div>
        );
    }

    return <span className="text-sm font-semibold font-mono text-[var(--theme-text-primary)] tracking-wider uppercase">{loc}</span>;
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
    t: (key: string) => string;
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
    employees = [],
    t
}) => {
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
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-black/60 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] w-full max-w-5xl h-full max-h-[92dvh] rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
                {/* Header Section */}
                <div className="p-4 sm:p-6 md:p-8 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="hidden md:flex w-16 h-16 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 items-center justify-center text-[var(--theme-accent)] shrink-0">
                                <Box size={28} strokeWidth={1.75} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h2 className="text-xl md:text-2xl font-bold text-[var(--theme-text-primary)] uppercase tracking-tight font-mono">{formatJobId(job)}</h2>
                                    {job.priority === 'Critical' && (
                                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                            <Zap size={11} className="fill-current" /> {t('warehouse.priority')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--theme-text-secondary)] flex-wrap uppercase tracking-wider">
                                    {job.orderRef && (
                                        <span className="font-mono">
                                            Ref: {resolveOrderRef(job.orderRef)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 font-mono bg-[var(--theme-bg-subtle)] px-2.5 py-1 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                                        <MapPin size={12} className="text-[var(--theme-accent)]" />
                                        {sourceSite?.name || t('warehouse.thisWarehouse')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-3">
                            <div className="text-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-2.5 sm:p-3 rounded-xl min-w-[64px] hidden xs:block">
                                <span className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] tabular-nums block font-mono">{totalItems}</span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">{t('warehouse.items')}</span>
                            </div>
                            <div className="text-center bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] p-2.5 sm:p-3 rounded-xl min-w-[64px] hidden xs:block">
                                <span className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] tabular-nums block font-mono">
                                    {job.lineItems?.reduce((acc, curr) => acc + (curr.expectedQty || 0), 0)}
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">{t('warehouse.qty')}</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                                aria-label={t('warehouse.dismiss')}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Progress tracking */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center px-0.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">{t('warehouse.putaway.progress')}</p>
                            <span className="text-[11px] text-[var(--theme-accent)] font-semibold uppercase tracking-wider bg-[var(--theme-accent)]/10 px-2 py-0.5 rounded-md border border-[var(--theme-accent)]/20 tabular-nums font-mono whitespace-nowrap">
                                {completedItems} / {totalItems}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden border border-[var(--theme-border)] mt-2">
                            <div
                                className={`h-full transition-all duration-500 ease-out ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-[var(--theme-accent)]'}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar space-y-5 bg-[var(--theme-bg-subtle)]">
                    {/* Items Manifest */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-2.5 text-xs uppercase tracking-wider">
                                <span className="w-6 h-6 rounded-lg bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
                                    <Package size={14} />
                                </span>
                                {t('warehouse.putaway.jobDetails')}
                            </h3>
                            <div className="flex items-center gap-2 bg-[var(--theme-bg-card)] px-3 py-1.5 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider tabular-nums font-mono">
                                    {totalItems} {t('warehouse.inboundVerified')}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            {job.lineItems?.map((item, idx) => {
                                const product = getProduct(item);
                                const isDone = item.status === 'Completed' || item.status === 'Picked';

                                return (
                                    <div
                                        key={idx}
                                        className={`bg-[var(--theme-bg-card)] border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                                            isDone ? 'border-emerald-500/30' : 'border-[var(--theme-border)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Specimen Visual */}
                                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                                                {product?.image ? (
                                                    <img src={product.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-secondary)] opacity-40">
                                                        <Package size={30} strokeWidth={1.5} />
                                                    </div>
                                                )}
                                                {isDone && (
                                                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                        <div className="p-1.5 bg-[var(--theme-bg-card)] rounded-full border border-emerald-500/40">
                                                            <CheckCircle size={22} className="text-emerald-500" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Specimen Analytics */}
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)] tracking-tight mb-1 truncate">
                                                    {item.name || product?.name || 'Unknown Item'}
                                                </h4>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)] uppercase tracking-wider">
                                                        SKU: {item.sku || product?.sku || 'NULL-ID'}
                                                    </span>
                                                    {product?.barcode && (
                                                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                                            <Barcode size={13} className="opacity-50" />
                                                            {product.barcode}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deployment Logic */}
                                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between xl:justify-end gap-3 xl:gap-6 pt-3 xl:pt-0 border-t xl:border-t-0 border-[var(--theme-border)] w-full xl:w-auto shrink-0">
                                            <div className="text-left xl:text-right flex flex-col items-start xl:items-end">
                                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block mb-1">{t('warehouse.location')}</span>
                                                <div>
                                                    {item.suggestedLocation ? (
                                                        <div className="flex flex-col items-start xl:items-end gap-0.5">
                                                            <span className="text-[11px] text-emerald-500 font-semibold uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <Zap size={10} /> Smart Suggestion
                                                            </span>
                                                            {formatBeautifulLocation(item.suggestedLocation, 'purple')}
                                                        </div>
                                                    ) : (
                                                        formatBeautifulLocation(product?.location, 'woody')
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 sm:gap-6 justify-between xl:justify-end">
                                                <div className="text-left xl:text-right">
                                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block mb-1">{t('warehouse.expectedAbbr')} {t('warehouse.qty')}</span>
                                                    <span className="text-base font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">
                                                        {(() => {
                                                            const baseQty = item.expectedQty || (item as any).quantity || 0;
                                                            const unitDef = getSellUnit(item.unit);
                                                            return `${baseQty}${unitDef.code !== 'UNIT' ? unitDef.shortLabel.slice(0, 2).toUpperCase() : ''}`;
                                                        })()}
                                                    </span>
                                                </div>
                                                {isDone ? (
                                                    <div className="text-right">
                                                        <span className="text-[11px] text-emerald-500 font-semibold uppercase tracking-wider block mb-1">{t('warehouse.completed')}</span>
                                                        <span className="text-base font-mono font-bold text-emerald-500 tabular-nums">
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
                                                        className="h-10 px-4 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] transition-all"
                                                    >
                                                        {isSubmitting ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            t('warehouse.startJob')
                                                        )}
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

                {/* Footer Interface */}
                <div className="p-4 sm:p-5 md:p-6 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0 z-20">
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)]">
                            <UserIcon size={20} />
                        </div>
                        <div className="flex flex-col">
                            {(() => {
                                const isCompleted = job.status === 'Completed' || (job.status || '').toLowerCase() === 'completed';
                                const completedUserId = job.completedBy || (job as any).completed_by;
                                const assignedUserId = job.assignedTo || (job as any).assigned_to;
                                const targetUserId = (isCompleted || completedUserId) ? (completedUserId || assignedUserId) : (assignedUserId || completedUserId);
                                const workerLabel = (isCompleted || Boolean(completedUserId))
                                    ? (t('warehouse.completedBy') || 'Completed By')
                                    : (t('warehouse.assignedTo') || 'Assigned To');
                                const emp = employees.find(e => e.id === targetUserId || e.name === targetUserId || e.code === targetUserId);
                                const displayName = emp?.name || (targetUserId ? targetUserId : (isCompleted ? 'System' : t('warehouse.putaway.unassigned')));
                                return (
                                    <>
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider">{workerLabel}</span>
                                        <span className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wide">{displayName}</span>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold uppercase tracking-wider min-h-[44px] transition-colors"
                        >
                            {t('warehouse.dismiss')}
                        </button>

                        {job.status !== 'Completed' && (
                            <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-3">
                                {progressPercent >= 100 ? (
                                    <button
                                        onClick={() => onCompleteJob(job)}
                                        disabled={isSubmitting}
                                        className="w-full px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]"
                                    >
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> {t('warehouse.completeJob')}</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onStartPutaway(job)}
                                        disabled={isSubmitting}
                                        className="px-8 py-3 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 min-h-[44px] transition-all"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span className="whitespace-nowrap">{job.status === 'In-Progress' ? `${t('warehouse.continue')} ${t('warehouse.jobId')}` : t('warehouse.startJob')}</span>
                                                <ArrowRight size={18} />
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
