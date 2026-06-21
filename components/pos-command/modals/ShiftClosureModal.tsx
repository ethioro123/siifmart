import React from 'react';
import Modal from '../../Modal';
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { usePOSCommand } from '../POSCommandContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CURRENCY_SYMBOL } from '../../../constants';

export const ShiftClosureModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isClosingShift, setIsClosingShift, closingStep, setClosingStep,
        cashDenominations, handleUpdateDenomination,
        getShiftSummary, isSubmittingShift, handleSubmitShift,
        discrepancyReason, setDiscrepancyReason
    } = usePOSCommand();

    const actualCashCounted = Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0);

    return (
        <Modal
            isOpen={isClosingShift}
            onClose={() => setIsClosingShift(false)}
            title={t('posCommand.shiftReconciliationTitle')}
            size="lg"
        >
            <div className="space-y-5">
                {closingStep === 1 ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        {/* Denomination grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {[200, 100, 50, 20, 10, 5].map((den) => (
                                <div key={den} className="flex items-center justify-between p-3 bg-[#FAF8F5] dark:bg-white/[0.03] rounded-2xl border border-[#E2DCCE] dark:border-white/8 hover:border-[#2C5E3B]/30 dark:hover:border-[#2C5E3B]/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm select-none bg-[#2C5E3B]/10 text-[#2C5E3B]">
                                            {den}
                                        </div>
                                        <span className="text-sm text-[#4D6E56] dark:text-[#7A9E83] font-medium select-none">{t('posCommand.billLabel')}</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cashDenominations[den] || ''}
                                        onChange={(e) => handleUpdateDenomination(den, parseInt(e.target.value) || 0)}
                                        className="w-16 bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl p-2 text-right text-[#1E3F27] dark:text-white font-mono outline-none transition-all text-sm focus:border-[#2C5E3B] focus:ring-1 focus:ring-[#2C5E3B] dark:focus:border-[#A9CBA2] dark:focus:ring-[#A9CBA2]"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Total counted */}
                        <div className="p-4 bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl flex justify-between items-center">
                            <span className="text-xs font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-widest select-none">{t('pos.totalCounted')}</span>
                            <span className="text-2xl font-mono font-black text-[#1E3F27] dark:text-[#EAE5D9]">
                                {CURRENCY_SYMBOL} {actualCashCounted.toLocaleString()}
                            </span>
                        </div>

                        {/* Continue button */}
                        <button
                            onClick={() => setClosingStep(2)}
                            className="w-full py-4 text-white font-bold rounded-2xl transition-all active:scale-[0.98] hover:opacity-90 select-none bg-gradient-to-br from-[#224429] to-[#2C5E3B] shadow-[0_4px_20px_rgba(44,94,59,0.25)]"
                        >
                            {t('common.continue')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                        {(() => {
                            const summary = getShiftSummary();
                            const variance = actualCashCounted - summary.expected;
                            const isVariance = Math.abs(variance) > 0.01;

                            return (
                                <>
                                    {/* Balance status banner */}
                                    <div className={`p-6 rounded-2xl border text-center ${
                                        !isVariance
                                            ? 'bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/20'
                                            : 'bg-red-50 dark:bg-red-500/8 border-red-200 dark:border-red-500/20'
                                    }`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                                            !isVariance
                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                        }`}>
                                            {!isVariance ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                        </div>
                                        <h3 className={`text-lg font-extrabold mb-1 ${!isVariance ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                            {!isVariance ? t('pos.shiftBalanced') : variance > 0 ? t('pos.cashSurplus') : t('pos.cashShortage')}
                                        </h3>
                                        <p className={`text-sm ${!isVariance ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-red-500/70 dark:text-red-400/70'}`}>
                                            {!isVariance ? t('pos.shiftBalancedDesc') : t('pos.varianceDetectedDesc')}
                                        </p>
                                    </div>

                                    {/* Summary breakdown */}
                                    <div className="p-4 bg-[#FAF8F5] dark:bg-white/[0.03] border border-[#E2DCCE] dark:border-white/8 rounded-2xl space-y-2.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#4D6E56] dark:text-[#7A9E83] font-medium">{t('posCommand.expectedFloatCash')}</span>
                                            <span className="text-[#1E3F27] dark:text-[#EAE5D9] font-mono font-bold">{CURRENCY_SYMBOL} {summary.expected?.toLocaleString()}</span>
                                        </div>
                                        <div className="h-px bg-[#E2DCCE]/60 dark:bg-white/5" />
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#4D6E56] dark:text-[#7A9E83] font-medium">{t('posCommand.actualCounted')}</span>
                                            <span className="text-[#1E3F27] dark:text-[#EAE5D9] font-mono font-bold">{CURRENCY_SYMBOL} {actualCashCounted.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Variance section */}
                                    {isVariance && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 rounded-2xl">
                                                <span className="text-sm font-bold text-red-600 dark:text-red-400">{t('pos.variance')}</span>
                                                <span className="text-lg font-mono font-black text-red-600 dark:text-red-400">
                                                    {variance > 0 ? '+' : ''}{CURRENCY_SYMBOL} {variance.toLocaleString()}
                                                </span>
                                            </div>
                                            <label className="block text-[10px] font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-wider select-none">{t('posCommand.varianceReasonText')}</label>
                                            <textarea
                                                value={discrepancyReason}
                                                onChange={(e) => setDiscrepancyReason(e.target.value)}
                                                className="w-full bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4 text-[#1E3F27] dark:text-white placeholder:text-[#4D6E56]/40 dark:placeholder:text-gray-600 outline-none transition-all text-sm focus:border-[#2C5E3B] focus:ring-1 focus:ring-[#2C5E3B] dark:focus:border-[#A9CBA2] dark:focus:ring-[#A9CBA2]"
                                                placeholder={t('posCommand.varianceReasonPlaceholder')}
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setClosingStep(1)}
                                            className="flex-1 py-3.5 bg-[#FAF8F5] dark:bg-white/5 hover:bg-[#2C5E3B]/8 dark:hover:bg-white/10 text-[#4D6E56] dark:text-gray-400 hover:text-[#2C5E3B] font-bold rounded-2xl border border-[#E2DCCE] dark:border-white/8 transition-all flex items-center justify-center gap-2 select-none"
                                        >
                                            <ArrowLeft size={16} />
                                            {t('posCommand.recount')}
                                        </button>
                                        <button
                                            onClick={handleSubmitShift}
                                            disabled={isSubmittingShift || (isVariance && !discrepancyReason)}
                                            className="flex-1 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 hover:opacity-90 bg-gradient-to-br from-[#224429] to-[#2C5E3B] shadow-[0_4px_20px_rgba(44,94,59,0.25)] select-none"
                                        >
                                            {isSubmittingShift && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                            {t('posCommand.finalizeLogout')}
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
