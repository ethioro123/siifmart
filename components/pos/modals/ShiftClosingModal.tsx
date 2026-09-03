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
                                <div className="p-6 rounded-2xl border bg-emerald-50 dark:bg-[#18201B]/40 border-emerald-200 dark:border-emerald-950/20 text-center space-y-3">
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                        <Lock size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">
                                            Blind Drawer Count Sealed
                                        </h3>
                                        <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-1 max-w-md mx-auto">
                                            Anti-Skimming Protocol: Total physical cash count is permanently locked. Register variance and expected totals are audited independently by Central HQ Finance.
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black block mb-0.5">Sealed Cash Total</span>
                                        <p className="text-3xl font-mono font-black text-[#1E3F27] dark:text-white">
                                            {CURRENCY_SYMBOL} {actualCashCounted.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-stone-600 dark:text-gray-400 uppercase font-black tracking-widest px-1">
                                            Shift Handover Notes (Optional)
                                        </label>
                                        <textarea
                                            placeholder="Optional notes for HQ audit (e.g. damaged bill accepted, coin shortage)..."
                                            className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4 text-sm text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] min-h-[70px]"
                                            value={discrepancyReason}
                                            onChange={(e) => setDiscrepancyReason(e.target.value)}
                                        />
                                    </div>

                                    <div className="bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex items-center justify-between text-xs">
                                        <span className="text-[#4D6E56] dark:text-[#7A9E83] font-medium flex items-center gap-1.5">
                                            <ShieldAlert size={14} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                                            Zero-Trust Compliance
                                        </span>
                                        <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                                            Direct HQ Dispatch
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleFinalizeClick}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-gradient-to-br from-[#224429] to-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 disabled:bg-stone-200 dark:disabled:bg-white/5 disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 disabled:cursor-not-allowed disabled:shadow-none transition-all cursor-pointer"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" /> : <LogOut size={18} />}
                                        Submit Sealed Count & Close Register
                                    </button>
                                </div>
                            </div>
                        )}
            </div>
        </Modal>
    );
};
