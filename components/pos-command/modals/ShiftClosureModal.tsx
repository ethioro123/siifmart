import React, { useState } from 'react';
import Modal from '../../Modal';
import { CheckCircle, AlertTriangle, ArrowLeft, ShieldAlert, CheckCircle2, Loader2, Lock, Printer } from 'lucide-react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import PinPad from '../../pos/PinPad';
import { CURRENCY_SYMBOL } from '../../../constants';
import { generateZReportReceiptHtml } from '../utils/receiptTemplate';
import { matchStaffPin } from '../../../utils/employeeIdGenerator';

export const ShiftClosureModal: React.FC = () => {
    const { t, currencySymbol } = useLanguage();
    const { user } = useStore();
    const { settings, employees, activeSite, effectiveCountry } = useData();
    const {
        isClosingShift, setIsClosingShift, closingStep, setClosingStep,
        cashDenominations, handleUpdateDenomination,
        getShiftSummary, isSubmittingShift, handleSubmitShift,
        discrepancyReason, setDiscrepancyReason, activeShift
    } = usePOSCommand();

    const currency = currencySymbol || (effectiveCountry === 'KE' ? 'KSh' : 'ETB');
    const denominations = effectiveCountry === 'KE'
        ? [1000, 500, 200, 100, 50, 20, 10, 5, 1]
        : [200, 100, 50, 20, 10, 5, 1];

    const [isManagerPinStep, setIsManagerPinStep] = useState(false);
    const [managerPin, setManagerPin] = useState('');
    const [pinError, setPinError] = useState('');

    const isManagerOrAdmin = [
        'super_admin',
        'admin',
        'store_manager',
        'head_of_operations',
        'ceo'
    ].includes(user?.role?.toLowerCase() || '');

    const actualCashCounted = Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0);
    const summary = getShiftSummary();
    const variance = actualCashCounted - (summary.expected || 0);
    const isVariance = Math.abs(variance) > 0.01;

    const handleClose = () => {
        setIsClosingShift(false);
        setIsManagerPinStep(false);
        setManagerPin('');
        setPinError('');
    };

    const handleFinalizeClick = () => {
        if (isVariance && !isManagerOrAdmin) {
            setIsManagerPinStep(true);
        } else {
            handleSubmitShift();
        }
    };

    const handlePrintZReport = () => {
        const html = generateZReportReceiptHtml(
            {
                ...activeShift,
                actualCash: actualCashCounted,
                variance,
                denominations: cashDenominations,
                discrepancyReason
            },
            summary,
            activeSite?.name || 'SIIFMART Store',
            user?.name
        );
        const printWindow = window.open('', '_blank', 'width=350,height=600');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 300);
        }
    };

    const handleVerifyManagerPin = () => {
        const entered = managerPin.trim();
        const customPin = settings?.managerSecurityPin?.trim();
        const matchesConfigured = customPin && entered === customPin;

        // 4-Eyes Principle: Any authorized store supervisor/manager staff PIN
        const managerStaff = (employees || []).filter(e =>
            ['super_admin', 'admin', 'store_manager', 'shift_lead', 'head_of_operations', 'regional_operations_manager', 'ceo'].includes(e.role?.toLowerCase() || '')
        );
        const matchesStaffPin = managerStaff.some(m => matchStaffPin(m.code, entered));

        if (matchesConfigured || matchesStaffPin) {
            setPinError('');
            setIsManagerPinStep(false);
            setManagerPin('');
            handleSubmitShift();
        } else {
            setPinError(customPin || managerStaff.length > 0
                ? 'Invalid Manager / Supervisor PIN. Variance authorization rejected.'
                : 'No Manager Security PIN configured in Settings. Authorization rejected.');
            setManagerPin('');
        }
    };

    return (
        <Modal
            isOpen={isClosingShift}
            onClose={handleClose}
            title={isManagerPinStep ? "Supervisor Variance Authorization" : t('posCommand.shiftReconciliationTitle')}
            size="lg"
        >
            <div className="space-y-5">
                {isManagerPinStep ? (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                            <ShieldAlert className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={22} />
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                                    Cash Discrepancy — Supervisor PIN Required
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                    The drawer has a cash discrepancy of <b>{currency} {Math.abs(variance).toLocaleString()} ({variance > 0 ? 'Surplus' : 'Shortage'})</b>. A Store Manager or Shift Lead PIN is required to authorize drawer closure.
                                </p>
                            </div>
                        </div>

                        {pinError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold text-center animate-shake">
                                {pinError}
                            </div>
                        )}

                        <div className="flex flex-col items-center">
                            <PinPad
                                pin={managerPin}
                                setPin={(p) => {
                                    setManagerPin(p);
                                    if (pinError) setPinError('');
                                }}
                                onEnter={handleVerifyManagerPin}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-[var(--theme-border)]">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsManagerPinStep(false);
                                    setManagerPin('');
                                    setPinError('');
                                }}
                                className="px-4 py-2.5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-bold text-xs transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyManagerPin}
                                disabled={managerPin.length < 4 || isSubmittingShift}
                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-xs cursor-pointer text-xs"
                            >
                                {isSubmittingShift ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Sign Off & Finalize
                            </button>
                        </div>
                    </div>
                ) : closingStep === 1 ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        {/* Denomination grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {denominations.map((den) => (
                                <div key={den} className="flex items-center justify-between p-3 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs transition-all">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs select-none bg-[var(--theme-pill-bg)] text-[var(--theme-primary)]">
                                            {den}
                                        </div>
                                        <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium select-none">{currency}</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cashDenominations[den] || ''}
                                        onChange={(e) => handleUpdateDenomination(den, parseInt(e.target.value) || 0)}
                                        className="w-16 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl p-2 text-right text-[var(--theme-input-text)] font-mono outline-none transition-all text-sm focus:border-[var(--theme-border-focus)]"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Total counted */}
                        <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl flex justify-between items-center shadow-xs">
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider select-none">{t('pos.totalCounted')}</span>
                            <span className="text-2xl font-mono font-bold text-[var(--theme-text-primary)]">
                                {currency} {actualCashCounted.toLocaleString()}
                            </span>
                        </div>

                        {/* Continue button */}
                        <button
                            onClick={() => setClosingStep(2)}
                            className="w-full py-3 text-[var(--theme-primary-text)] font-semibold rounded-2xl transition-all active:scale-[0.98] hover:opacity-90 select-none bg-[var(--theme-primary)] shadow-xs cursor-pointer text-sm"
                        >
                            {t('common.continue')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                        {/* Balance status banner */}
                        <div className={`p-6 rounded-2xl border text-center ${
                            !isVariance
                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                : 'bg-rose-500/10 border-rose-500/20'
                        }`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                                !isVariance
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            }`}>
                                {!isVariance ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                            </div>
                            <h3 className={`text-lg font-bold mb-1 ${!isVariance ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                {!isVariance ? t('pos.shiftBalanced') : variance > 0 ? t('pos.cashSurplus') : t('pos.cashShortage')}
                            </h3>
                            <p className={`text-xs ${!isVariance ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-rose-600/80 dark:text-rose-400/80'}`}>
                                {!isVariance ? t('pos.shiftBalancedDesc') : t('pos.varianceDetectedDesc')}
                            </p>
                        </div>

                        {/* Summary breakdown */}
                        <div className="p-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl space-y-2.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--theme-text-secondary)] font-medium">{t('posCommand.expectedFloatCash')}</span>
                                <span className="text-[var(--theme-text-primary)] font-mono font-bold">{currency} {summary.expected?.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-[var(--theme-border)]" />
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--theme-text-secondary)] font-medium">{t('posCommand.actualCounted')}</span>
                                <span className="text-[var(--theme-text-primary)] font-mono font-bold">{currency} {actualCashCounted.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Variance section */}
                        {isVariance && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{t('pos.variance')}</span>
                                    <span className="text-lg font-mono font-bold text-rose-600 dark:text-rose-400">
                                        {variance > 0 ? '+' : ''}{currency} {variance.toLocaleString()}
                                    </span>
                                </div>
                                <label className="block text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider select-none">{t('posCommand.varianceReasonText')}</label>
                                <textarea
                                    value={discrepancyReason}
                                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                                    className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-2xl p-3 text-[var(--theme-input-text)] placeholder:text-[var(--theme-text-muted)] outline-none transition-all text-xs focus:border-[var(--theme-border-focus)] shadow-2xs"
                                    placeholder={t('posCommand.varianceReasonPlaceholder')}
                                    rows={3}
                                />
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setClosingStep(1)}
                                className="flex-1 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-semibold rounded-2xl border border-[var(--theme-border)] transition-all flex items-center justify-center gap-2 select-none cursor-pointer text-xs shadow-2xs"
                            >
                                <ArrowLeft size={14} className="text-blue-500" />
                                {t('posCommand.recount')}
                            </button>
                            <button
                                type="button"
                                onClick={handlePrintZReport}
                                className="px-4 py-3 bg-[var(--theme-bg-card)] hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] font-semibold rounded-2xl border border-[var(--theme-border)] transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer text-xs shadow-2xs"
                                title="Print Physical Z-Report Slip"
                            >
                                <Printer size={14} className="text-purple-500" />
                                <span>Z-Report</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleFinalizeClick}
                                disabled={isSubmittingShift || (isVariance && !discrepancyReason)}
                                className="flex-1 py-3 disabled:opacity-40 border border-transparent disabled:cursor-not-allowed text-[var(--theme-primary-text)] font-semibold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:opacity-90 bg-[var(--theme-primary)] shadow-xs select-none cursor-pointer text-xs"
                            >
                                {isSubmittingShift ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : isVariance && !isManagerOrAdmin ? (
                                    <Lock size={14} className="text-amber-500" />
                                ) : null}
                                {isVariance && !isManagerOrAdmin ? "Authorize with Manager PIN" : t('posCommand.finalizeLogout')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
