import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    X, Package, MapPin, CheckCircle, ArrowRight, ArrowLeft, Loader2, Lock, Trash2
} from 'lucide-react';
import { WMSJob, User, Site, Product, Employee } from '../../../types';
import { formatJobId } from '../../../utils/jobIdFormatter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { PutawayStepIndicator, PutawayStep } from './steps/PutawayStepIndicator';
import { Step1PutawayIntake } from './steps/Step1PutawayIntake';
import { Step2PutawayRouting } from './steps/Step2PutawayRouting';
import { Step3PutawayPlacement } from './steps/Step3PutawayPlacement';

export const formatBeautifulLocation = (loc: string | undefined, theme: 'purple' | 'cyan' | 'woody' = 'woody') => {
    if (!loc || loc === 'PENDING' || loc === 'Unassigned') {
        return <span className="text-sm font-semibold font-mono text-[var(--theme-text-primary)] tracking-wider">{loc || 'PENDING'}</span>;
    }

    const parts = loc.split('-').map(p => p.trim());

    if (parts.length >= 3) {
        return (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
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
    onUpdateItemSlot?: (item: any, qty: number) => void;
    onDeleteJob?: (jobId: string) => void;
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
    t,
    onUpdateItemSlot,
    onDeleteJob,
}) => {
    const [step, setStep] = useState<PutawayStep>('INTAKE');
    const canDelete = ['group_ceo', 'country_managing_director', 'warehouse_manager', 'country_operations_director', 'regional_operations_manager'].includes(user?.role || '');

    const getProduct = (item: any) => {
        const targetSiteId = job?.siteId || (job as any)?.site_id;
        return products.find(p => (p.id === item.productId || p.sku === item.sku) && (p.siteId === targetSiteId || p.site_id === targetSiteId));
    };

    const sourceSite = sites.find(s => s.id === job?.sourceSiteId || s.id === (job as any)?.site_id);
    const totalItems = job?.lineItems?.length || 0;
    const completedItems = job?.lineItems?.filter(i => i.status === 'Completed' || i.status === 'Picked').length || 0;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const isFullySlotted = completedItems === totalItems && totalItems > 0;
    const isCompleted = job?.status === 'Completed';

    const totalUnits = useMemo(() => {
        return (job?.lineItems || []).reduce((sum, item) => sum + (item.expectedQty || (item as any).quantity || 1), 0);
    }, [job?.lineItems]);

    const hasColdItems = useMemo(() => {
        return (job?.lineItems || []).some(item => ['Frozen', 'Dairy', 'Chilled'].includes(getProduct(item)?.category || ''));
    }, [job?.lineItems, products]);

    // Auto-select initial step on open
    const prevOpenRef = useRef(false);
    useEffect(() => {
        if (isOpen && !prevOpenRef.current) {
            if (isFullySlotted || isCompleted) {
                setStep('PLACEMENT');
            } else {
                setStep('INTAKE');
            }
        }
        prevOpenRef.current = isOpen;
    }, [isOpen, isFullySlotted, isCompleted]);

    const handleItemSlotUpdate = (item: any, qty: number) => {
        if (onUpdateItemSlot) {
            onUpdateItemSlot(item, qty);
        } else {
            onStartPutaway(job);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-black/70 overflow-x-hidden">
            <div className="bg-[var(--theme-bg-card)] w-full max-w-4xl h-[92dvh] md:h-[88vh] rounded-3xl border border-[var(--theme-border)] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg-card)] shrink-0 z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isFullySlotted
                                ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                                : 'bg-[var(--theme-accent)]/10 border-[var(--theme-accent)]/20 text-[var(--theme-accent)]'
                        }`}>
                            <Package size={22} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h2 className="text-base sm:text-xl font-bold text-[var(--theme-text-primary)] tracking-tight uppercase truncate font-mono">
                                    {formatJobId(job)}
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)]">
                                    {job.priority || 'Normal'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-[var(--theme-text-secondary)] font-medium uppercase tracking-wider flex-wrap">
                                <span className="flex items-center gap-1 text-[var(--theme-text-primary)]">
                                    <MapPin size={12} className="text-[var(--theme-accent)]" />
                                    {sourceSite?.name || 'Warehouse Floor'}
                                </span>
                                {job.orderRef && (
                                    <span className="font-mono text-[11px]">
                                        Ref: {resolveOrderRef(job.orderRef)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors shrink-0"
                        aria-label={t('warehouse.dismiss')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Step Indicator */}
                <PutawayStepIndicator
                    currentStep={step}
                    setStep={setStep}
                    isFullySlotted={isFullySlotted}
                    t={t}
                />

                {/* Step Content */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {step === 'INTAKE' && (
                        <Step1PutawayIntake
                            job={job}
                            sourceSite={sourceSite}
                            totalItems={totalItems}
                            totalUnits={totalUnits}
                            hasColdItems={hasColdItems}
                            getProduct={getProduct}
                            onAdvanceToRouting={() => setStep('SLOTTING')}
                            onStartPutaway={onStartPutaway}
                            resolveOrderRef={resolveOrderRef}
                            t={t}
                        />
                    )}

                    {step === 'SLOTTING' && (
                        <Step2PutawayRouting
                            job={job}
                            products={products}
                            totalItems={totalItems}
                            completedItems={completedItems}
                            progressPercent={progressPercent}
                            isFullySlotted={isFullySlotted}
                            getProduct={getProduct}
                            onUpdateItemSlot={handleItemSlotUpdate}
                            onStartPutaway={onStartPutaway}
                            onAdvanceToPlacement={() => setStep('PLACEMENT')}
                            t={t}
                        />
                    )}

                    {step === 'PLACEMENT' && (
                        <Step3PutawayPlacement
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
                <div className="p-3 md:p-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        {step === 'INTAKE' ? (
                            <button
                                type="button"
                                onClick={onClose}
                                className="min-h-[44px] px-4 md:px-5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold text-xs uppercase tracking-wider transition-colors active:scale-95 cursor-pointer touch-manipulation"
                            >
                                {t('warehouse.dismiss') || 'Dismiss'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    if (step === 'PLACEMENT') setStep('SLOTTING');
                                    else if (step === 'SLOTTING') setStep('INTAKE');
                                }}
                                className="min-h-[44px] px-4 md:px-5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-semibold text-xs uppercase tracking-wider flex items-center gap-2 hover:border-[var(--theme-accent)]/30 transition-colors active:scale-95 cursor-pointer touch-manipulation"
                            >
                                <ArrowLeft size={16} />
                                <span>Back</span>
                            </button>
                        )}

                        {canDelete && onDeleteJob && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm(t('warehouse.putaway.deleteJobConfirm') || 'Are you sure you want to delete this job?')) {
                                        onDeleteJob(job.id);
                                        onClose();
                                    }
                                }}
                                className="min-h-[44px] px-3.5 md:px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
                                title={t('common.delete') || 'Delete Job'}
                            >
                                <Trash2 size={14} />
                                <span>{t('common.delete') || 'Delete'}</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {step === 'INTAKE' && (
                            <button
                                type="button"
                                onClick={() => setStep('SLOTTING')}
                                className="min-h-[44px] px-5 md:px-7 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
                            >
                                <span>Start Scanning & Route</span>
                                <ArrowRight size={16} />
                            </button>
                        )}

                        {step === 'SLOTTING' && (
                            <button
                                type="button"
                                disabled={!isFullySlotted}
                                onClick={() => setStep('PLACEMENT')}
                                className={`min-h-[44px] px-5 md:px-7 rounded-xl font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all touch-manipulation ${
                                    isFullySlotted
                                        ? 'bg-[var(--theme-accent)] hover:opacity-90 text-white cursor-pointer active:scale-95'
                                        : 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] cursor-not-allowed opacity-50'
                                }`}
                            >
                                {!isFullySlotted && <Lock size={14} className="text-[var(--theme-text-muted)]" />}
                                <span>{isFullySlotted ? 'Shelf Lock' : 'Slot All Items to Proceed'}</span>
                                <ArrowRight size={16} />
                            </button>
                        )}

                        {step === 'PLACEMENT' && (
                            <button
                                type="button"
                                onClick={() => onCompleteJob(job)}
                                disabled={isSubmitting}
                                className="min-h-[44px] px-6 md:px-8 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        <span>Complete Putaway</span>
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

export default PutawayJobModal;
