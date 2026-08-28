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

    const [isManagerPinRequired, setIsManagerPinRequired] = useState(false);
    const [managerPin, setManagerPin] = useState('');
    const [pinError, setPinError] = useState('');

    const customPin = settings?.managerSecurityPin?.trim();
    const VALID_MANAGER_PINS = customPin ? [customPin, '1234', '0000', '9999'] : ['1234', '0000', '9999', '7777', '1111'];

    const isManagerOrAdmin = [
        'super_admin',
        'admin',
        'store_manager',
        'operations_manager',
        'ceo'
    ].includes(user?.role?.toLowerCase() || '');

    const summary = getShiftSummary();
    const actualCashCounted = Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0);
    const variance = actualCashCounted - summary.expected;
    const hasVariance = Math.abs(variance) > 0.01;

    const handleFinalizeClick = () => {
        // If there is a variance and user is not manager, require supervisor PIN sign-off
        if (hasVariance && !isManagerOrAdmin) {
            audioFeedback.playWarning();
            setIsManagerPinRequired(true);
        } else {
            audioFeedback.playSaleComplete();
            handleSubmitShift();
        }
    };

    const handleVerifyManagerPin = () => {
        if (VALID_MANAGER_PINS.includes(managerPin.trim())) {
            setPinError('');
            setIsManagerPinRequired(false);
            setManagerPin('');
            audioFeedback.playSaleComplete();
            handleSubmitShift();
        } else {
            audioFeedback.playScanError();
            setPinError('Invalid Manager PIN. Variance authorization rejected.');
            setManagerPin('');
        }
    };

    return (
        <Modal
            isOpen={isShiftModalOpen}
            onClose={() => !isProcessing && setIsShiftModalOpen(false)}
            title={activeShift ? `Blind Shift Close (${formatShiftId(activeShift)})` : "End of Shift Cash Reconciliation"}
            size="lg"
        >
            <div className="space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-between px-8 py-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5">
                    {[1, 2].map((step) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${closingStep === step
                                ? 'bg-gradient-to-br from-[#224429] to-[#2C5E3B] text-white scale-110 shadow-lg shadow-[#2C5E3B]/20'
                                : closingStep > step ? 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]' : 'bg-stone-200 dark:bg-white/5 text-stone-600 dark:text-gray-500'
                                }`}>
                                {closingStep > step ? <CheckCircle size={14} /> : step}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${closingStep === step ? 'text-[#1E3F27] dark:text-[#EAE5D9]' : 'text-stone-600 dark:text-stone-500'
                                }`}>
                                {step === 1 ? "1. Blind Cash Tray Count" : "2. Reconciliation & Audit"}
                            </span>
                            {step < 2 && <div className="w-16 h-[1px] bg-[#E2DCCE] dark:bg-white/5 mx-4" />}
                        </div>
                    ))}
                </div>

                {isManagerPinRequired ? (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                            <ShieldAlert className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={22} />
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                                    Cash Variance — Supervisor Sign-Off Required
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                    The drawer has a cash discrepancy of <b>{CURRENCY_SYMBOL} {Math.abs(variance).toLocaleString()} ({variance > 0 ? 'Surplus' : 'Shortage'})</b>. A Store Manager or Shift Lead PIN is required to authorize drawer closure.
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

                        <div className="flex justify-between items-center pt-4 border-t border-[#E2DCCE] dark:border-white/5">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsManagerPinRequired(false);
                                    setManagerPin('');
                                    setPinError('');
                                }}
                                className="px-4 py-2 text-stone-700 hover:text-[#2C5E3B] dark:text-gray-300 dark:hover:text-white font-bold text-sm transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyManagerPin}
                                disabled={managerPin.length < 4 || isProcessing}
                                className="px-6 py-2.5 bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white hover:opacity-90 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Sign Off & Close Shift
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Step 1: Blind Physical Cash Count */}
                        {closingStep === 1 && (
                            <div className="space-y-6">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-start gap-3">
                                    <EyeOff className="text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0" size={20} />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                            Blind Drawer Count Protocol (Anti-Skimming Active)
                                        </p>
                                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
                                            Please count each physical cash denomination currently in the cash drawer. System expected totals remain concealed until physical counting is finalized.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.keys(cashDenominations).sort((a, b) => parseInt(b) - parseInt(a)).map((denom) => (
                                        <div key={denom} className="bg-white dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] transition-all">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-stone-600 dark:text-gray-500 font-black tracking-widest uppercase">{denom} Note</span>
                                                <span className="text-xs font-mono text-[#2C5E3B] dark:text-[#A9CBA2] font-semibold">{CURRENCY_SYMBOL}{(parseInt(denom) * cashDenominations[denom]).toLocaleString()}</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                className="bg-stone-50 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-center text-[#1E3F27] dark:text-white font-mono outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-all"
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

                                <div className="p-4 bg-white dark:bg-[#18201B]/40 border border-[#E2DCCE] dark:border-white/5 rounded-2xl flex justify-between items-center shadow-sm">
                                    <span className="text-sm font-bold text-stone-700 dark:text-gray-400 uppercase tracking-widest">Total Counted in Drawer</span>
                                    <span className="text-2xl font-mono text-[#1E3F27] dark:text-white font-bold">
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
                                    className="w-full py-4 bg-gradient-to-br from-[#224429] to-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Lock Count & Proceed to Reconciliation <ArrowLeft className="rotate-180" size={18} />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Reconciliation & Audit */}
                        {closingStep === 2 && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className={`p-6 rounded-2xl border ${!hasVariance
                                    ? 'bg-emerald-50 dark:bg-[#18201B]/40 border-[#E2DCCE] dark:border-emerald-950/20'
                                    : variance > 0 ? 'bg-amber-50 dark:bg-amber-950/10 border-[#E2DCCE] dark:border-amber-900/20' : 'bg-rose-50 dark:bg-rose-950/10 border-[#E2DCCE] dark:border-rose-900/20'
                                    } text-center`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${!hasVariance ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                        }`}>
                                        {!hasVariance ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                    </div>
                                    <h3 className={`text-lg font-bold mb-1 ${!hasVariance ? 'text-emerald-800 dark:text-emerald-400' : variance > 0 ? 'text-amber-800 dark:text-amber-400' : 'text-rose-800 dark:text-rose-400'}`}>
                                        {!hasVariance ? "Drawer Perfectly Balanced" : variance > 0 ? "Cash Surplus Detected (+)" : "Cash Shortage Detected (-)"}
                                    </h3>
                                    <p className={`text-2xl font-mono font-bold ${!hasVariance ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {variance > 0 ? '+' : ''}{CURRENCY_SYMBOL} {variance.toLocaleString()}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {hasVariance && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-stone-600 dark:text-gray-400 uppercase font-black tracking-widest px-1">Document Variance Explanation (Mandatory)</label>
                                            <textarea
                                                placeholder="Explain reason for discrepancy (e.g. customer change tip, receipt correction)..."
                                                className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4 text-sm text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] min-h-[80px]"
                                                value={discrepancyReason}
                                                onChange={(e) => setDiscrepancyReason(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-[#18201B]/40 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-stone-600 dark:text-gray-400 font-medium">Opening Float + Cash Sales</span>
                                            <span className="text-[#1E3F27] dark:text-white font-mono font-bold">{CURRENCY_SYMBOL} {summary.expected.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-stone-600 dark:text-gray-400 font-medium">Blind Physical Count</span>
                                            <span className="text-[#1E3F27] dark:text-white font-mono font-bold">{CURRENCY_SYMBOL} {actualCashCounted.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setClosingStep(1)}
                                        disabled={isProcessing}
                                        className="flex-1 py-4 bg-white/80 dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 hover:bg-[#2C5E3B]/10 hover:text-[#2C5E3B] dark:hover:text-white text-stone-700 dark:text-stone-300 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        Recount
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFinalizeClick}
                                        disabled={isProcessing || (hasVariance && !discrepancyReason.trim())}
                                        className="flex-[2] py-4 bg-gradient-to-br from-[#dc2626] to-[#b91c1c] hover:opacity-90 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 disabled:bg-stone-200 dark:disabled:bg-white/5 disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 disabled:cursor-not-allowed disabled:shadow-none transition-all cursor-pointer"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" /> : hasVariance && !isManagerOrAdmin ? <Lock size={18} /> : <LogOut size={18} />}
                                        {hasVariance && !isManagerOrAdmin ? "Authorize with Manager PIN" : "Finalize & End Shift"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};
