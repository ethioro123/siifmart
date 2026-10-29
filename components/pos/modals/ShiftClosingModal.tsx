import React, { useState } from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import PinPad from '../PinPad';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatShiftId } from '../../../utils/jobIdFormatter';
import { audioFeedback } from '../../../utils/audioFeedback';
import { CheckCircle, DollarSign, CreditCard, Smartphone, Archive, ArrowLeft, AlertTriangle, Loader2, LogOut, ShieldAlert, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

export const ShiftClosingModal: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { settings } = useData();
    const {
        isShiftModalOpen,
        setIsShiftModalOpen,
        isProcessing,
        closingStep,
        setClosingStep,
        getShiftSummary,
        activeShift,
        cashDenominations,
        setCashDenominations,
        discrepancyReason,
        setDiscrepancyReason,
        handleSubmitShift,
    } = usePOS();

    const summary = getShiftSummary();
    const actualCashCounted = Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0);
    const variance = actualCashCounted - summary.expected;
    const hasVariance = Math.abs(variance) > 0.01;

    const handleFinalizeClick = () => {
        audioFeedback.playSaleComplete();
        handleSubmitShift();
    };

    return (
        <Modal
            isOpen={isShiftModalOpen}
            onClose={() => !isProcessing && setIsShiftModalOpen(false)}
            title={activeShift ? t('pos.blindShiftClose', { id: formatShiftId(activeShift) }) : t('pos.endOfShiftReconciliation')}
            size="lg"
        >
            <div className="space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-between px-6 py-3.5 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                    {[1, 2].map((step) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${closingStep === step
                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                                : closingStep > step ? 'bg-[var(--theme-pill-bg)] text-[var(--theme-primary)]' : 'bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-muted)]'
                                }`}>
                                {closingStep > step ? <CheckCircle size={14} /> : step}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${closingStep === step ? 'text-[var(--theme-text-primary)]' : 'text-[var(--theme-text-secondary)]'
                                }`}>
                                {step === 1 ? t('pos.blindCashTrayCount') : t('pos.reconciliationAndAudit')}
                            </span>
                            {step < 2 && <div className="w-12 h-[1px] bg-[var(--theme-border)] mx-3" />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Blind Physical Cash Count */}
                        {closingStep === 1 && (
                            <div className="space-y-6">
                                <div className="p-4 bg-[var(--theme-status-success-bg)] dark:bg-emerald-950/20 border border-[var(--theme-status-success-border)] border-[var(--theme-status-success-border)] rounded-2xl flex items-start gap-3">
                                    <EyeOff className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] mt-0.5 shrink-0" size={20} />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                                            {t('pos.blindDrawerProtocol')}
                                        </p>
                                        <p className="text-xs text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] leading-relaxed font-medium">
                                            {t('pos.blindDrawerInstruction')}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.keys(cashDenominations).sort((a, b) => parseInt(b) - parseInt(a)).map((denom) => (
                                        <div key={denom} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex flex-col gap-2 focus-within:border-[var(--theme-border-focus)] transition-all shadow-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-[var(--theme-text-secondary)] font-bold tracking-wider uppercase">{denom} {t('pos.note')}</span>
                                                <span className="text-xs font-mono text-[var(--theme-primary)] font-bold">{CURRENCY_SYMBOL}{(parseInt(denom) * cashDenominations[denom]).toLocaleString()}</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                className="bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl px-3 py-2 text-center text-[var(--theme-input-text)] font-mono outline-none focus:border-[var(--theme-border-focus)] transition-all text-sm"
                                                value={cashDenominations[denom] || ''}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setCashDenominations(prev => ({ ...prev, [denom]: val }));
                                                }}
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl flex justify-between items-center shadow-xs">
                                    <span className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">{t('pos.totalCountedInDrawer')}</span>
                                    <span className="text-2xl font-mono text-[var(--theme-text-primary)] font-bold">
                                        {CURRENCY_SYMBOL} {actualCashCounted.toLocaleString()}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (hasVariance) {
                                            audioFeedback.playWarning();
                                        } else {
                                            audioFeedback.playScanSuccess();
                                        }
                                        setClosingStep(2);
                                    }}
                                    className="w-full py-3.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                                >
                                    {t('pos.lockCountAndProceed')} <ArrowLeft className="rotate-180" size={16} />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Reconciliation & Audit */}
                        {closingStep === 2 && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="p-6 rounded-2xl border bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-[var(--theme-pill-bg)] text-[var(--theme-primary)]">
                                        <Lock size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-[var(--theme-text-primary)]">
                                            {t('pos.blindDrawerCountSealed')}
                                        </h3>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-md mx-auto">
                                            {t('pos.blindDrawerCountSealedDesc')}
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold block mb-0.5">{t('pos.sealedCashTotal')}</span>
                                        <p className="text-3xl font-mono font-bold text-[var(--theme-text-primary)]">
                                            {CURRENCY_SYMBOL} {actualCashCounted.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider px-1">
                                            {t('pos.shiftHandoverNotes')}
                                        </label>
                                        <textarea
                                            placeholder={t('pos.shiftNotesPlaceholder') || "Optional notes for HQ audit (e.g. damaged bill accepted, coin shortage)..."}
                                            className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-2xl p-4 text-sm text-[var(--theme-input-text)] outline-none focus:border-[var(--theme-border-focus)] min-h-[70px]"
                                            value={discrepancyReason}
                                            onChange={(e) => setDiscrepancyReason(e.target.value)}
                                        />
                                    </div>

                                    <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-4 flex items-center justify-between text-xs">
                                        <span className="text-[var(--theme-text-secondary)] font-medium flex items-center gap-1.5">
                                            <ShieldAlert size={14} className="text-[var(--theme-primary)]" />
                                            {t('pos.zeroTrustCompliance')}
                                        </span>
                                        <span className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-bold uppercase tracking-wider text-xs">
                                            {t('pos.directHqDispatch')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleFinalizeClick}
                                        disabled={isProcessing}
                                        className="w-full py-3.5 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-xs uppercase tracking-wider"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
                                        {t('pos.submitSealedCount')}
                                    </button>
                                </div>
                            </div>
                        )}
            </div>
        </Modal>
    );
};
