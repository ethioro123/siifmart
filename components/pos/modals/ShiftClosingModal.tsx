import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
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
            title="Advanced Shift Reconciliation"
            size="lg"
        >
            <div className="space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-between px-8 py-4 bg-black/20 rounded-2xl border border-white/5">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${closingStep === step
                                ? 'bg-cyber-primary text-black shadow-[0_0_15px_rgba(0,255,157,0.4)] scale-110'
                                : closingStep > step ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'
                                }`}>
                                {closingStep > step ? <CheckCircle size={14} /> : step}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${closingStep === step ? 'text-white' : 'text-gray-600'
                                }`}>
                                {step === 1 ? t('pos.summary') : step === 2 ? t('pos.cashTray') : t('pos.verifyShift')}
                            </span>
                            {step < 3 && <div className="w-12 h-[1px] bg-white/5 mx-2" />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Summary */}
                {closingStep === 1 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{t('pos.totalSales')}</p>
                                <p className="text-xl font-mono text-white">{CURRENCY_SYMBOL} {getShiftSummary().total.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{t('pos.expectedCash')}</p>
                                <p className="text-xl font-mono text-cyber-primary">{CURRENCY_SYMBOL} {getShiftSummary().expected.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-1">{t('pos.revenueBreakdown')}</p>
                            <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                                {[
                                    { label: t('pos.cashSales'), value: getShiftSummary().cash, icon: DollarSign, color: 'text-green-400' },
                                    { label: t('pos.cardSales'), value: getShiftSummary().card, icon: CreditCard, color: 'text-blue-400' },
                                    { label: t('pos.mobileSales'), value: getShiftSummary().mobile, icon: Smartphone, color: 'text-purple-400' },
                                    { label: t('pos.openingFloat'), value: activeShift?.openingFloat || 0, icon: Archive, color: 'text-yellow-400' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} className={item.color} />
                                            <span className="text-sm text-gray-300 font-medium">{item.label}</span>
                                        </div>
                                        <span className="text-sm font-mono text-white">{CURRENCY_SYMBOL} {item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setClosingStep(2)}
                            className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {t('pos.startCashCount')} <ArrowLeft className="rotate-180" size={18} />
                        </button>
                    </div>
                )}

                {/* Step 2: Cash Tray */}
                {closingStep === 2 && (
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="text-blue-400 mt-0.5" size={18} />
                            <p className="text-xs text-blue-200/70 leading-relaxed">
                                {t('pos.cashTrayInstruction')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.keys(cashDenominations).sort((a, b) => parseInt(b) - parseInt(a)).map((denom) => (
                                <div key={denom} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 focus-within:border-cyber-primary/50 transition-all">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">{denom}</span>
                                        <span className="text-xs font-mono text-cyber-primary">{CURRENCY_SYMBOL}{(parseInt(denom) * cashDenominations[denom]).toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center text-white font-mono outline-none focus:border-cyber-primary transition-all"
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

                        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('pos.totalCounted')}</span>
                            <span className="text-2xl font-mono text-white">
                                {CURRENCY_SYMBOL} {Object.entries(cashDenominations).reduce((sum, [d, q]) => sum + (parseInt(d) * q), 0).toLocaleString()}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setClosingStep(1)}
                                className="flex-1 py-4 bg-white/5 border border-white/5 rounded-xl text-white font-bold"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setClosingStep(3)}
                                className="flex-[2] py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-bold rounded-xl shadow-lg"
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
                                        ? 'bg-green-500/10 border-green-500/20'
                                        : variance > 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
                                        } text-center`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${!isVariance ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {!isVariance ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">
                                            {!isVariance ? t('pos.shiftBalanced') : variance > 0 ? t('pos.cashSurplus') : t('pos.cashShortage')}
                                        </h3>
                                        <p className={`text-2xl font-mono font-bold ${!isVariance ? 'text-green-400' : 'text-red-400'}`}>
                                            {variance > 0 ? '+' : ''}{CURRENCY_SYMBOL} {variance.toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-1">{t('pos.varianceReason')}</label>
                                            <textarea
                                                placeholder="Document variance cause..."
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-cyber-primary min-h-[80px]"
                                                value={discrepancyReason}
                                                onChange={(e) => setDiscrepancyReason(e.target.value)}
                                            />
                                        </div>

                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Expected</span>
                                                <span className="text-white font-mono">{CURRENCY_SYMBOL} {summary.expected.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Actual</span>
                                                <span className="text-white font-mono">{CURRENCY_SYMBOL} {actual.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setClosingStep(2)}
                                            disabled={isProcessing}
                                            className="flex-1 py-4 bg-white/5 border border-white/5 rounded-xl text-white font-bold"
                                        >
                                            Recount
                                        </button>
                                        <button
                                            onClick={handleSubmitShift}
                                            disabled={isProcessing || (isVariance && !discrepancyReason.trim())}
                                            className="flex-[2] py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
