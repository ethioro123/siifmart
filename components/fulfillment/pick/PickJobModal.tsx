import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    X, Package, MapPin, CheckCircle, ArrowRight, ArrowLeft, Loader2, Lock, Trash2
} from 'lucide-react';
import { WMSJob, User, Site, Product, Employee } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { sortPickItemsByOptimalRoute } from '../../../utils/fulfillmentRoute';
import { PickStepIndicator, PickStep } from './steps/PickStepIndicator';
import { Step1PickRoute } from './steps/Step1PickRoute';
import { Step2PickCollect } from './steps/Step2PickCollect';
import { Step3PickStaging } from './steps/Step3PickStaging';

const resolveLoc = (t: ((key: string) => string) | undefined, key: string, fallback: string) => {
    if (!t) return fallback;
    const res = t(key);
    return !res || res === key || res.startsWith('warehouse.') ? fallback : res;
};

export const formatBeautifulLocation = (loc: string | undefined, theme: 'purple' | 'cyan' | 'woody' = 'woody', t?: (key: string) => string) => {
    if (!loc || loc === 'PENDING') {
        return <span className="text-xs sm:text-sm font-mono font-semibold text-[var(--theme-text-primary)] tracking-wider">{loc || 'PENDING'}</span>;
    }

    const parts = loc.split('-').map(p => p.trim());

    if (parts.length >= 3) {
        const zoneLabel = resolveLoc(t, 'warehouse.zone', 'Zone');
        const aisleLabel = resolveLoc(t, 'warehouse.aisle', 'Aisle');
        const bayLabel = resolveLoc(t, 'warehouse.bay', 'Bay');

        return (
            <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 flex-nowrap shrink-0">
                <span className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-mono font-semibold border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] whitespace-nowrap">
                    {zoneLabel} {parts[0]}
                </span>
                <span className="text-[var(--theme-text-secondary)] opacity-40 font-semibold text-[10px] sm:text-[11px] select-none">/</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-mono font-semibold border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] whitespace-nowrap">
                    {aisleLabel} {parts[1]}
                </span>
                <span className="text-[var(--theme-text-secondary)] opacity-40 font-semibold text-[10px] sm:text-[11px] select-none">/</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-mono font-semibold border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] whitespace-nowrap">
                    {bayLabel} {parts[2]}
                </span>
            </div>
        );
    }

    return <span className="text-xs sm:text-sm font-mono font-semibold text-[var(--theme-text-primary)] tracking-wider truncate">{loc}</span>;
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
    onUpdateItemPick?: (item: any, qty: number) => void;
    onDeleteJob?: (jobId: string) => void;
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
    resolveOrderRef,
    onUpdateItemPick,
    onDeleteJob,
}) => {
    const { t } = useLanguage();

    const [step, setStep] = useState<PickStep>('ROUTE');

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
    const isFullyPicked = completedItems === totalItems && totalItems > 0;
    const isCompleted = job?.status === 'Completed';

    const totalUnits = useMemo(() => {
        return (job?.lineItems || []).reduce((sum, item) => sum + (item.expectedQty || (item as any).quantity || 1), 0);
    }, [job?.lineItems]);

    const sortedLineItems = useMemo(() => {
        if (!job?.lineItems) return [];
        return sortPickItemsByOptimalRoute(job.lineItems, (item) => {
            const prod = getProduct(item);
            return item.location || prod?.location;
        });
    }, [job?.lineItems, products]);

    // Auto-select initial step on open
    const prevOpenRef = useRef(false);
    useEffect(() => {
        if (isOpen && !prevOpenRef.current) {
            if (isFullyPicked || isCompleted) {
                setStep('STAGING');
            } else {
                setStep('ROUTE');
            }
        }
        prevOpenRef.current = isOpen;
    }, [isOpen, isFullyPicked, isCompleted]);

    const handleItemPickUpdate = (item: any, qty: number) => {
        if (onUpdateItemPick) {
            onUpdateItemPick(item, qty);
        } else {
            onStartPick(job);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/70 overflow-x-hidden">
            <div className="bg-[var(--theme-bg-card)] w-full max-w-4xl h-[92dvh] md:h-[88vh] rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                {/* Header */}
                <div className="p-3.5 sm:p-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 z-10 flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
                        <div className={`w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border ${
                            isFullyPicked
                                ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                                : 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                        }`}>
                            <Package size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                                <h2 className="text-sm sm:text-xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase truncate font-mono">
                                    {formatJobId(job)}
                                </h2>
                                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)]">
                                    {job.priority || 'Normal'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider flex-wrap">
                                <span className="flex items-center gap-1 text-[var(--theme-text-primary)] truncate max-w-[150px] sm:max-w-none">
                                    <MapPin size={12} className="text-[var(--theme-accent)] shrink-0" />
                                    <span className="truncate">{sourceSite?.name || 'Warehouse'}</span>
                                </span>
                                {job.orderRef && (
                                    <span className="font-mono text-[10px] sm:text-[11px] text-[var(--theme-text-muted)] truncate">
                                        Ref: {resolveOrderRef(job.orderRef)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                        aria-label={t('warehouse.dismiss')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Step Indicator */}
                <PickStepIndicator
                    currentStep={step}
                    setStep={setStep}
                    isFullyPicked={isFullyPicked}
                    t={t}
                />

                {/* Step Content */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {step === 'ROUTE' && (
                        <Step1PickRoute
                            job={job}
                            sortedLineItems={sortedLineItems}
                            sourceSite={sourceSite}
                            totalItems={totalItems}
                            totalUnits={totalUnits}
                            getProduct={getProduct}
                            onAdvanceToCollect={() => setStep('COLLECT')}
                            onStartPick={onStartPick}
                            t={t}
                        />
                    )}

                    {step === 'COLLECT' && (
                        <Step2PickCollect
                            job={job}
                            products={products}
                            sortedLineItems={sortedLineItems}
                            totalItems={totalItems}
                            completedItems={completedItems}
                            progressPercent={progressPercent}
                            isFullyPicked={isFullyPicked}
                            getProduct={getProduct}
                            onUpdateItemPick={handleItemPickUpdate}
                            onStartPick={onStartPick}
                            onAdvanceToStaging={() => setStep('STAGING')}
                            t={t}
                        />
                    )}

                    {step === 'STAGING' && (
                        <Step3PickStaging
                            job={job}
                            sourceSite={sourceSite}
                            totalItems={totalItems}
                            completedItems={completedItems}
                            isSubmitting={isSubmitting}
                            onCompleteJob={onCompleteJob}
                            resolveOrderRef={resolveOrderRef}
                            t={t}
                        />
                    )}
                </div>

                {/* Bottom Navigation Toolbar */}
                <div className="p-3 md:p-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex items-center justify-between gap-2 sm:gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {step === 'ROUTE' ? (
                            <button
                                type="button"
                                onClick={onClose}
                                className="min-h-[44px] px-3.5 sm:px-5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold text-xs uppercase tracking-wider transition-colors active:scale-95 cursor-pointer touch-manipulation"
                            >
                                {t('warehouse.dismiss') || 'Dismiss'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    if (step === 'STAGING') setStep('COLLECT');
                                    else if (step === 'COLLECT') setStep('ROUTE');
                                }}
                                className="min-h-[44px] px-3.5 sm:px-5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 hover:border-[var(--theme-accent)]/30 transition-colors active:scale-95 cursor-pointer touch-manipulation"
                            >
                                <ArrowLeft size={16} />
                                <span>Back</span>
                            </button>
                        )}

                        {['super_admin', 'warehouse_manager', 'operations_manager', 'regional_manager'].includes(user?.role as string) && onDeleteJob && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (confirm(t('warehouse.picking.jobDeleteConfirmPrompt') || 'Are you sure you want to delete this pick job?')) {
                                        await onDeleteJob(job.id);
                                        onClose();
                                    }
                                }}
                                className="min-h-[44px] px-2.5 sm:px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer touch-manipulation"
                                title="Delete Job"
                            >
                                <Trash2 size={14} />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {step === 'ROUTE' && (
                            <button
                                type="button"
                                onClick={() => onStartPick(job)}
                                className="min-h-[48px] px-4 sm:px-7 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
                            >
                                <Package size={16} />
                                <span>Start Scanning</span>
                            </button>
                        )}

                        {step === 'COLLECT' && (
                            <button
                                type="button"
                                disabled={!isFullyPicked}
                                onClick={() => setStep('STAGING')}
                                className={`min-h-[44px] px-4 sm:px-7 rounded-xl font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all touch-manipulation ${
                                    isFullyPicked
                                        ? 'bg-[var(--theme-accent)] hover:opacity-90 text-white cursor-pointer active:scale-95'
                                        : 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] cursor-not-allowed opacity-50'
                                }`}
                            >
                                {!isFullyPicked && <Lock size={14} className="text-[var(--theme-text-muted)]" />}
                                <span>{isFullyPicked ? 'Staging Handover' : 'Pick All Items to Proceed'}</span>
                                <ArrowRight size={16} />
                            </button>
                        )}

                        {step === 'STAGING' && (
                            <button
                                type="button"
                                onClick={() => onCompleteJob(job)}
                                disabled={isSubmitting}
                                className="min-h-[44px] px-5 sm:px-8 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        <span>Complete Mission</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PickJobModal;
