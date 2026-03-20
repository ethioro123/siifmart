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
            <div className="space-y-6">
                {closingStep === 1 ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="grid grid-cols-2 gap-3">
                            {[200, 100, 50, 20, 10, 5].map((den) => (
                                <div key={den} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-siif-blue/10 flex items-center justify-center text-siif-blue font-bold">
                                            {den}
                                        </div>
                                        <span className="text-sm text-gray-400 font-medium">{t('posCommand.billLabel')}</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cashDenominations[den] || ''}
                                        onChange={(e) => handleUpdateDenomination(den, parseInt(e.target.value) || 0)}
                                        className="w-16 bg-black/40 border border-white/10 rounded-lg p-2 text-right text-white font-mono outline-none focus:border-siif-blue transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('pos.totalCounted')}</span>
                            <span className="text-2xl font-mono text-white">
                                {CURRENCY_SYMBOL} {actualCashCounted.toLocaleString()}
                            </span>
                        </div>

                        <button
                            onClick={() => setClosingStep(2)}
                            className="w-full py-4 bg-siif-blue hover:bg-siif-blue/90 text-white font-bold rounded-xl shadow-lg shadow-siif-blue/20 transition-all active:scale-[0.98]"
                        >
                            {t('common.continue')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        {(() => {
                            const summary = getShiftSummary();
                            const variance = actualCashCounted - summary.expected;
                            const isVariance = Math.abs(variance) > 0.01;

                            return (
                                <>
                                    <div className={`p-6 rounded-2xl border ${!isVariance ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                                        } text-center`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${!isVariance ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {!isVariance ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">
                                            {!isVariance ? t('pos.shiftBalanced') : variance > 0 ? t('pos.cashSurplus') : t('pos.cashShortage')}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {!isVariance ? t('pos.shiftBalancedDesc') : t('pos.varianceDetectedDesc')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">{t('posCommand.expectedFloatCash')}</span>
                                                <span className="text-white font-mono">{CURRENCY_SYMBOL} {summary.expected?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">{t('posCommand.actualCounted')}</span>
                                                <span className="text-white font-mono">{CURRENCY_SYMBOL} {actualCashCounted.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {isVariance && (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                    <span className="text-sm font-bold text-red-400">{t('pos.variance')}</span>
                                                    <span className="text-lg font-mono font-bold text-red-500">
                                                        {variance > 0 ? '+' : ''}{CURRENCY_SYMBOL} {variance.toLocaleString()}
                                                    </span>
                                                </div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('posCommand.varianceReasonText')}</label>
                                                <textarea
                                                    value={discrepancyReason}
                                                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:border-siif-blue outline-none transition-all"
                                                    placeholder={t('posCommand.varianceReasonPlaceholder')}
                                                    rows={3}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setClosingStep(1)}
                                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft size={18} />
                                            {t('posCommand.recount')}
                                        </button>
                                        <button
                                            onClick={handleSubmitShift}
                                            disabled={isSubmittingShift || (isVariance && !discrepancyReason)}
                                            className="flex-1 py-4 bg-siif-blue hover:bg-siif-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-siif-blue/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingShift && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
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
