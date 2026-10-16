import React from 'react';
import {
    X, Package, Box, MapPin, CheckCircle, ArrowRight,
    Info, Barcode, Loader2
} from 'lucide-react';
import { WMSJob, User, Site, Product, Employee } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatProductSize, formatPackagingDescription, getSellUnit } from '../../../utils/units';
import { sortPickItemsByOptimalRoute } from '../../../utils/fulfillmentRoute';

export const formatBeautifulLocation = (loc: string | undefined, theme: 'purple' | 'cyan' | 'woody' = 'woody', t?: (key: string) => string) => {
    if (!loc || loc === 'PENDING') {
        return <span className="text-sm font-mono font-semibold text-[var(--theme-text-primary)] tracking-wider">{loc || 'PENDING'}</span>;
    }

    const parts = loc.split('-').map(p => p.trim());

    if (parts.length >= 3) {
        return (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] whitespace-nowrap">
                    {t ? t('warehouse.zone') : 'Zone'} {parts[0]}
                </span>
                <span className="text-[var(--theme-text-secondary)] opacity-40 font-semibold text-[11px] select-none">/</span>
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] whitespace-nowrap">
                    {t ? t('warehouse.aisle') : 'Aisle'} {parts[1]}
                </span>
                <span className="text-[var(--theme-text-secondary)] opacity-40 font-semibold text-[11px] select-none">/</span>
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] whitespace-nowrap">
                    {t ? t('warehouse.bay') : 'Bay'} {parts[2]}
                </span>
            </div>
        );
    }

    return <span className="text-sm font-mono font-semibold text-[var(--theme-text-primary)] tracking-wider">{loc}</span>;
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

    const getProduct = (item: any) => {
        const targetSiteId = job?.siteId || (job as any)?.site_id;
        return products.find(p => (p.id === item.productId || p.sku === item.sku) && (p.siteId === targetSiteId || p.site_id === targetSiteId));
    };

    const getItemMeasureQty = (item: any, product?: any) => {
        if ((item as any)?.requestedMeasureQty !== undefined && (item as any)?.requestedMeasureQty !== null) {
            return (item as any).requestedMeasureQty;
        }
        const prod = product || getProduct(item);
        const customAttrs = prod?.customAttributes || prod?.custom_attributes;
        const sellBy = customAttrs?.commercial?.sellBy || '';
        const isWeighted = customAttrs?.commercial?.isWeighted === true;

        if (sellBy === 'Weight' || sellBy === 'Volume' || isWeighted) {
            return item.expectedQty || (item as any)?.quantity || null;
        }
        return null;
    };

    const sourceSite = sites.find(s => s.id === job?.sourceSiteId || s.id === (job as any)?.site_id);
    const totalItems = job?.lineItems?.length || 0;
    const completedItems = job?.lineItems?.filter(i => {
        const isDone = i.status === 'Completed' || i.status === 'Picked';
        const measureQty = getItemMeasureQty(i);
        const requiredAmount = measureQty || i.expectedQty || 1;
        return isDone || (i.pickedQty || 0) >= requiredAmount;
    }).length || 0;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const isCompleted = job?.status === 'Completed';

    const sortedLineItems = React.useMemo(() => {
        if (!job?.lineItems) return [];
        return sortPickItemsByOptimalRoute(job.lineItems, (item) => {
            const prod = getProduct(item);
            return item.location || prod?.location;
        });
    }, [job?.lineItems, products]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/60 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] w-full max-w-4xl max-h-[92dvh] rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)] shrink-0">
                                <Package size={24} strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                                    <h2 className="text-lg sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase truncate font-mono">
                                        {formatJobId(job)}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider flex-wrap">
                                    <span className="flex items-center gap-1.5 font-mono bg-[var(--theme-bg-subtle)] px-2.5 py-0.5 rounded-lg border border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                                        <MapPin size={11} className="text-[var(--theme-accent)]" />
                                        {sourceSite?.name || t('warehouse.thisWarehouse')}
                                    </span>
                                    {job.orderRef && (
                                        <span className="font-mono">
                                            Ref: {resolveOrderRef(job.orderRef)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
                                job.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                job.priority === 'High' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border-[var(--theme-accent)]/20'
                            }`}>
                                {job.priority || 'Normal'}
                            </span>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                                aria-label={t('warehouse.dismiss')}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 custom-scrollbar bg-[var(--theme-bg-subtle)]">
                    {/* Metrics Strip */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-3 rounded-2xl min-w-0">
                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block mb-1 truncate">{t('warehouse.progress')}</span>
                            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[var(--theme-text-primary)] mb-1.5">
                                <span className="font-mono">{Math.round(progressPercent)}%</span>
                                <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">{completedItems}/{totalItems}</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden border border-[var(--theme-border)]">
                                <div
                                    className={`h-full transition-all duration-500 ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-[var(--theme-accent)]'}`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-3 rounded-2xl min-w-0">
                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block mb-1 truncate">{t('warehouse.status')}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${isCompleted ? 'bg-emerald-500' : 'bg-[var(--theme-accent)]'}`} />
                                <span className={`text-xs sm:text-base font-bold uppercase tracking-tight truncate ${isCompleted ? 'text-emerald-500' : 'text-[var(--theme-text-primary)]'}`}>
                                    {job.status}
                                </span>
                            </div>
                        </div>

                        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-3 rounded-2xl min-w-0">
                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block mb-1 truncate">{t('warehouse.items')}</span>
                            <div className="flex items-center gap-1.5 mt-1 min-w-0">
                                <Box size={14} className="text-[var(--theme-accent)] shrink-0" />
                                <span className="text-xs sm:text-base font-mono font-bold text-[var(--theme-text-primary)] truncate">
                                    {totalItems} {totalItems === 1 ? t('warehouse.itemSingular') : t('warehouse.itemPlural')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <h3 className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-2 text-xs uppercase tracking-wider">
                                <Box size={14} className="text-[var(--theme-accent)]" />
                                <span>{t('warehouse.pickJobs')} (Smart Route Sequence)</span>
                            </h3>
                            <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-card)] px-2.5 py-1 rounded-xl border border-[var(--theme-border)] uppercase font-mono">
                                {totalItems} {t('warehouse.itemPlural')}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {sortedLineItems.map((item, idx) => {
                                const product = getProduct(item);
                                const isDone = item.status === 'Completed' || item.status === 'Picked';

                                return (
                                    <div
                                        key={idx}
                                        className={`bg-[var(--theme-bg-card)] border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
                                            isDone ? 'border-emerald-500/30' : 'border-[var(--theme-border)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
                                            {/* Stop sequence badge */}
                                            <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] font-mono text-[11px] font-bold">
                                                #{idx + 1}
                                            </div>

                                            <div className="relative w-14 h-14 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center overflow-hidden shrink-0">
                                                {product?.image ? (
                                                    <img src={product.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-secondary)] opacity-40">
                                                        <Package size={22} strokeWidth={1.5} />
                                                    </div>
                                                )}
                                                {isDone && (
                                                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                        <div className="p-1 bg-[var(--theme-bg-card)] rounded-full border border-emerald-500/40">
                                                            <CheckCircle size={16} className="text-emerald-500" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <h4 className={`text-sm font-semibold tracking-tight mb-1 truncate ${isDone ? 'line-through text-[var(--theme-text-secondary)]' : 'text-[var(--theme-text-primary)]'}`}>
                                                    {item.name || product?.name || t('warehouse.picking.unknownSKU')}
                                                </h4>
                                                <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2">
                                                    <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--theme-border)] uppercase tracking-wider w-fit">
                                                        {item.sku || product?.sku || t('warehouse.picking.noSKUCaps')}
                                                    </span>
                                                    {formatProductSize(product || item) && (
                                                        <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-wider w-fit">
                                                            {formatProductSize(product || item)}
                                                        </span>
                                                    )}
                                                    {product?.barcode && (
                                                        <div className="flex items-center gap-1 text-[11px] text-[var(--theme-text-secondary)] font-mono">
                                                            <Barcode size={12} className="opacity-50" />
                                                            {product.barcode}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between xl:justify-end gap-3 xl:gap-6 pt-3 xl:pt-0 border-t xl:border-t-0 border-[var(--theme-border)] w-full xl:w-auto shrink-0">
                                            <div className="text-left md:text-right flex flex-col items-start md:items-end">
                                                <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block mb-1">{t('warehouse.selectedStorageLocation')}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)]" />
                                                    {formatBeautifulLocation(product?.location, 'woody', t)}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto md:min-w-[160px]">
                                                <div className="text-left md:text-right">
                                                    <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider block mb-1">{t('warehouse.expected')}</span>
                                                    {(() => {
                                                        const expected = item.expectedQty || (item as any).quantity || 0;
                                                        const packDesc = formatPackagingDescription(product, expected);
                                                        const unitDef = getSellUnit(product?.unit || item.unit);
                                                        const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

                                                        return (
                                                            <div className="flex flex-col items-start md:items-end">
                                                                <span className="text-base font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">
                                                                    {expected} <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase">{unitLabel}</span>
                                                                </span>
                                                                {packDesc && (
                                                                    <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                                                                        ({packDesc})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {isDone ? (
                                                    <div className="text-right border-l border-[var(--theme-border)] pl-4">
                                                        <span className="text-[11px] text-emerald-500 font-semibold uppercase tracking-wider block mb-1">{t('warehouse.picking')}</span>
                                                        {(() => {
                                                            const picked = item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : 0;
                                                            const packDesc = formatPackagingDescription(product, picked);
                                                            const unitDef = getSellUnit(product?.unit || item.unit);
                                                            const unitLabel = unitDef.category === 'count' && unitDef.code !== 'UNIT' ? unitDef.shortLabel : 'pk';

                                                            return (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-base font-mono font-bold text-emerald-500 tabular-nums">
                                                                        {picked} <span className="text-[11px] text-emerald-500/80 font-semibold uppercase">{unitLabel}</span>
                                                                    </span>
                                                                    {packDesc && (
                                                                        <span className="text-[11px] font-mono text-emerald-500/80">
                                                                            ({packDesc})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onStartPick(job); }}
                                                        disabled={isSubmitting}
                                                        className="px-4 py-2 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs uppercase tracking-wider transition-colors min-h-[40px]"
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
                <div className="p-4 sm:p-5 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 z-20">
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-0.5">
                                {isCompleted ? (t('warehouse.completedBy') || 'Completed By') : (t('warehouse.assignedTo') || 'Assigned To')}
                            </span>
                            <span className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wide">
                                {(() => {
                                    const targetUserId = (isCompleted && (job.completedBy || (job as any).completed_by))
                                        ? (job.completedBy || (job as any).completed_by)
                                        : job.assignedTo;
                                    if (!targetUserId) return isCompleted ? 'System' : (t('warehouse.putaway.unassigned') || 'Unassigned');
                                    const emp = employees.find(e => e.id === targetUserId || e.name === targetUserId || (e as any).email === targetUserId || e.code === targetUserId);
                                    return emp?.name || targetUserId;
                                })()}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse md:flex-row items-stretch md:items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold uppercase tracking-wider min-h-[44px] transition-colors"
                        >
                            {t('warehouse.dismiss')}
                        </button>

                        {job.status !== 'Completed' && (
                            <>
                                {progressPercent >= 100 ? (
                                    <button
                                        onClick={() => onCompleteJob(job)}
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40 min-h-[44px]"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> {t('warehouse.completed')}</>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onStartPick(job)}
                                        disabled={isSubmitting}
                                        className="px-8 py-3 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 min-h-[44px] transition-all"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>{job.status === 'In-Progress' ? t('warehouse.continueArrow') : t('warehouse.startArrow')}</span>
                                                <ArrowRight size={16} />
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
