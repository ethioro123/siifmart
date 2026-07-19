import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatShiftId } from '../../../utils/jobIdFormatter';
import { CheckCircle, DollarSign, CreditCard, Smartphone, Archive, ArrowLeft, AlertTriangle, Loader2, LogOut } from 'lucide-react';

export const ShiftClosingModal: React.FC = () => {
    const { t } = useLanguage();
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

    return (
        <Modal
            isOpen={isShiftModalOpen}
            onClose={() => !isProcessing && setIsShiftModalOpen(false)}
            title={activeShift ? `Shift Reconciliation (${formatShiftId(activeShift)})` : "Advanced Shift Reconciliation"}
            size="lg"
        >
            <div className="space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-between px-8 py-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-[#E2DCCE] dark:border-white/5">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${closingStep === step
                                ? 'bg-gradient-to-br from-[#224429] to-[#2C5E3B] text-white scale-110 shadow-lg shadow-[#2C5E3B]/20'
                                : closingStep > step ? 'bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2]' : 'bg-stone-200 dark:bg-white/5 text-stone-600 dark:text-gray-500'
                                }`}>
                                {closingStep > step ? <CheckCircle size={14} /> : step}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${closingStep === step ? 'text-[#1E3F27] dark:text-[#EAE5D9]' : 'text-stone-600 dark:text-stone-500'
                                }`}>
                                {step === 1 ? t('pos.summary') : step === 2 ? t('pos.cashTray') : t('pos.verifyShift')}
                            </span>
                            {step < 3 && <div className="w-12 h-[1px] bg-[#E2DCCE] dark:bg-white/5 mx-2" />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Summary */}
                {closingStep === 1 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#18201B]/40 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-4 shadow-sm">
                                <p className="text-[10px] text-[#4D6E56] dark:text-gray-400 uppercase font-black tracking-widest mb-1">{t('pos.totalSales')}</p>
                                <p className="text-xl font-mono text-[#1E3F27] dark:text-[#EAE5D9]">{CURRENCY_SYMBOL} {getShiftSummary().total.toLocaleString()}</p>
                            </div>
                            <div className="bg-white dark:bg-[#18201B]/40 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-2xl p-4 shadow-sm">
                                <p className="text-[10px] text-[#4D6E56] dark:text-gray-400 uppercase font-black tracking-widest mb-1">{t('pos.expectedCash')}</p>
                                <p className="text-xl font-mono text-[#2C5E3B] dark:text-[#A9CBA2] font-semibold">{CURRENCY_SYMBOL} {getShiftSummary().expected.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] text-stone-400 dark:text-gray-500 uppercase font-black tracking-widest px-1">{t('pos.revenueBreakdown')}</p>
                            <div className="bg-white/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-white/5 rounded-2xl overflow-hidden">
                                {[
                                    { label: t('pos.cashSales'), value: getShiftSummary().cash, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400' },
                                    { label: t('pos.cardSales'), value: getShiftSummary().card, icon: CreditCard, color: 'text-sky-600 dark:text-sky-400' },
                                    { label: t('pos.mobileSales'), value: getShiftSummary().mobile, icon: Smartphone, color: 'text-purple-600 dark:text-purple-400' },
                                    { label: t('pos.openingFloat'), value: activeShift?.openingFloat || 0, icon: Archive, color: 'text-amber-600 dark:text-amber-400' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border-b border-[#E2DCCE] dark:border-white/5 last:border-0 hover:bg-[#2C5E3B]/5 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} className={item.color} />
                                            <span className="text-sm text-[#1E3F27] dark:text-gray-300 font-medium">{item.label}</span>
                                        </div>
                                        <span className="text-sm font-mono text-[#1E3F27] dark:text-white">{CURRENCY_SYMBOL} {item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setClosingStep(2)}
                            className="w-full py-4 bg-gradient-to-br from-[#224429] to-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            {t('pos.startCashCount')} <ArrowLeft className="rotate-180" size={18} />
                        </button>
                    </div>
                )}

                {/* Step 2: Cash Tray */}
                {closingStep === 2 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="text-amber-600 dark:text-amber-400 mt-0.5" size={18} />
                            <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
                                {t('pos.cashTrayInstruction')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.keys(cashDenominations).sort((a, b) => parseInt(b) - parseInt(a)).map((denom) => (
                                <div key={denom} className="bg-white dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2 focus-within:border-[#2C5E3B] dark:focus-within:border-[#A9CBA2] transition-all">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-stone-600 dark:text-gray-500 font-black tracking-widest uppercase">{denom}</span>
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
                            <span className="text-sm font-bold text-stone-700 dark:text-gray-400 uppercase tracking-widest">{t('pos.totalCounted')}</span>
                            <span className="text-2xl font-mono text-[#1E3F27] dark:text-white">
                                {CURRENCY_SYMBOL} {Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0).toLocaleString()}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setClosingStep(1)}
                                className="flex-1 py-4 bg-white/80 dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 hover:bg-[#2C5E3B]/10 hover:text-[#2C5E3B] dark:hover:text-white text-stone-700 dark:text-stone-300 font-bold transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setClosingStep(3)}
                                className="flex-[2] py-4 bg-gradient-to-br from-[#224429] to-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all"
                            >
                                Verify
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Verify & Submit */}
                {closingStep === 3 && (
                    <div className="space-y-6">
                        {(() => {
                            const summary = getShiftSummary();
                            const actual = Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0);
                            const variance = actual - summary.expected;
                            const isVariance = Math.abs(variance) > 0.01;

                            return (
                                <>
                                    <div className={`p-6 rounded-2xl border ${!isVariance
                                        ? 'bg-emerald-50 dark:bg-[#18201B]/40 border-[#E2DCCE] dark:border-emerald-950/20'
                                        : variance > 0 ? 'bg-amber-50 dark:bg-amber-950/10 border-[#E2DCCE] dark:border-amber-900/20' : 'bg-rose-50 dark:bg-rose-950/10 border-[#E2DCCE] dark:border-rose-900/20'
                                        } text-center`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${!isVariance ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                            }`}>
                                            {!isVariance ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                        </div>
                                        <h3 className={`text-lg font-bold mb-1 ${!isVariance ? 'text-emerald-800 dark:text-emerald-400' : variance > 0 ? 'text-amber-800 dark:text-amber-400' : 'text-rose-800 dark:text-rose-400'}`}>
                                            {!isVariance ? t('pos.shiftBalanced') : variance > 0 ? t('pos.cashSurplus') : t('pos.cashShortage')}
                                        </h3>
                                        <p className={`text-2xl font-mono font-bold ${!isVariance ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {variance > 0 ? '+' : ''}{CURRENCY_SYMBOL} {variance.toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-stone-600 dark:text-gray-400 uppercase font-black tracking-widest px-1">{t('pos.varianceReason')}</label>
                                            <textarea
                                                placeholder="Document variance cause..."
                                                className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4 text-sm text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] min-h-[80px]"
                                                value={discrepancyReason}
                                                onChange={(e) => setDiscrepancyReason(e.target.value)}
                                            />
                                        </div>

                                        <div className="bg-white dark:bg-[#18201B]/40 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-4 space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-stone-600 dark:text-gray-400 font-medium">Expected</span>
                                                <span className="text-[#1E3F27] dark:text-white font-mono">{CURRENCY_SYMBOL} {summary.expected.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-stone-600 dark:text-gray-400 font-medium">Actual</span>
                                                <span className="text-[#1E3F27] dark:text-white font-mono">{CURRENCY_SYMBOL} {actual.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setClosingStep(2)}
                                            disabled={isProcessing}
                                            className="flex-1 py-4 bg-white/80 dark:bg-black/35 border border-[#E2DCCE] dark:border-white/10 hover:bg-[#2C5E3B]/10 hover:text-[#2C5E3B] dark:hover:text-white text-stone-700 dark:text-stone-300 rounded-xl font-bold transition-all disabled:opacity-50"
                                        >
                                            Recount
                                        </button>
                                        <button
                                            onClick={handleSubmitShift}
                                            disabled={isProcessing || (isVariance && !discrepancyReason.trim())}
                                            className="flex-[2] py-4 bg-gradient-to-br from-[#dc2626] to-[#b91c1c] hover:opacity-90 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 disabled:bg-stone-200 dark:disabled:bg-white/5 disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin" /> : <LogOut size={18} />}
                                            Finalize & Logout
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </Modal>
    );
};
