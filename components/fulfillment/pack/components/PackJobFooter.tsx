import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Lock, Trash2 } from 'lucide-react';
import { WMSJob } from '../../../../types';
import { PackStep } from '../steps/PackStepIndicator';

interface PackJobFooterProps {
    step: PackStep;
    setStep: (step: PackStep) => void;
    onClose: () => void;
    job: WMSJob;
    onAdvanceToScanning: () => void | Promise<void>;
    isFullyPacked: boolean;
    handleFinalComplete: () => void;
    isSubmitting: boolean;
    canDelete?: boolean;
    onDeleteJob?: (jobId: string) => void;
    t: (key: string) => string;
}

export const PackJobFooter: React.FC<PackJobFooterProps> = ({
    step,
    setStep,
    onClose,
    job,
    onAdvanceToScanning,
    isFullyPacked,
    handleFinalComplete,
    isSubmitting,
    canDelete,
    onDeleteJob,
    t
}) => {
    return (
        <div className="p-3 md:p-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-card)] flex items-center justify-between gap-2 sm:gap-3 shrink-0">
            {/* Back / Dismiss / Delete Buttons */}
            <div className="flex items-center gap-2 shrink-0">
                {step === 'DETAILS' ? (
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
                            if (step === 'FINISH') setStep('WEIGH');
                            else if (step === 'WEIGH') setStep('BOX');
                            else if (step === 'BOX') setStep('ITEMS');
                            else if (step === 'ITEMS') setStep('DETAILS');
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
                            if (window.confirm(t('warehouse.confirmDeleteJob') || 'Are you sure you want to delete this job? This action cannot be undone.')) {
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

            {/* Next / Action Button */}
            <div className="flex min-w-0 flex-1 sm:flex-none items-center justify-end gap-2">
                {step === 'DETAILS' && (
                    <button
                        type="button"
                        onClick={() => void onAdvanceToScanning()}
                        className="min-h-[48px] w-full sm:w-auto min-w-0 px-3 sm:px-5 md:px-7 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wide sm:tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation whitespace-nowrap"
                    >
                        <span>Start Scanning &amp; Pack</span>
                        <ArrowRight size={16} />
                    </button>
                )}

                {step === 'ITEMS' && (
                    <button
                        type="button"
                        disabled={!isFullyPacked}
                        onClick={() => setStep('BOX')}
                        className={`min-h-[44px] px-5 md:px-7 rounded-xl font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all touch-manipulation ${
                            isFullyPacked
                                ? 'bg-[var(--theme-accent)] hover:opacity-90 text-white cursor-pointer active:scale-95'
                                : 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] cursor-not-allowed opacity-50'
                        }`}
                    >
                        {!isFullyPacked && <Lock size={14} className="text-[var(--theme-text-muted)]" />}
                        <span>{isFullyPacked ? 'Carton & Prep' : 'Scan All Items to Proceed'}</span>
                        <ArrowRight size={16} />
                    </button>
                )}

                {step === 'BOX' && (
                    <button
                        type="button"
                        onClick={() => setStep('WEIGH')}
                        className="min-h-[44px] px-5 md:px-7 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
                    >
                        <span>Weigh & Seal</span>
                        <ArrowRight size={16} />
                    </button>
                )}

                {step === 'WEIGH' && (
                    <button
                        type="button"
                        onClick={() => setStep('FINISH')}
                        className="min-h-[44px] px-5 md:px-7 rounded-xl bg-[var(--theme-accent)] hover:opacity-90 text-white font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
                    >
                        <span>Label & Finish</span>
                        <ArrowRight size={16} />
                    </button>
                )}

                {step === 'FINISH' && (
                    <button
                        type="button"
                        onClick={handleFinalComplete}
                        disabled={isSubmitting}
                        className="min-h-[44px] px-6 md:px-8 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs md:text-sm uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer touch-manipulation disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                <span>Complete & Seal</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
