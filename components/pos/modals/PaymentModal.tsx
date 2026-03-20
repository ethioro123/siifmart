import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { PaymentMethod } from '../../../types';
import { Banknote, CreditCard, Smartphone, Search, RefreshCcw, Check } from 'lucide-react';

export const PaymentModal: React.FC = () => {
    const { t } = useLanguage();
    const {
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        total,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        amountTendered,
        setAmountTendered,
        handleSearchKeyDown,
        unknownBarcode,
        changeDue,
        handleProcessPayment,
        isPaymentValid,
        isProcessing,
    } = usePOS();

    return (
        <Modal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            title={t('pos.processPayment')}
            size="lg"
        >
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center p-8 bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-cyber-primary/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <p className="text-cyber-primary/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t('pos.totalAmountDue')}</p>
                    <p className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">{CURRENCY_SYMBOL} {total.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'Cash', icon: <Banknote size={24} />, label: t('pos.cash').toUpperCase() },
                        { id: 'Card', icon: <CreditCard size={24} />, label: t('pos.card').toUpperCase() },
                        { id: 'Mobile Money', icon: <Smartphone size={24} />, label: t('pos.mobile').toUpperCase() }
                    ].map(method => (
                        <button
                            key={method.id}
                            title={t('pos.initializePayment')}
                            onClick={() => setSelectedPaymentMethod(method.id as PaymentMethod)}
                            className={`p-6 rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] ${selectedPaymentMethod === method.id
                                ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary shadow-[0_0_20px_rgba(0,255,157,0.2)]'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/[0.08]'
                                }`}
                        >
                            <div className={`transition-transform duration-300 group-hover:scale-110 ${selectedPaymentMethod === method.id ? 'text-cyber-primary' : 'text-gray-500'}`}>
                                {method.icon}
                            </div>
                            <span className="text-[10px] font-black tracking-widest uppercase">{method.label}</span>
                        </button>
                    ))}
                </div>

                {selectedPaymentMethod === 'Cash' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label htmlFor="amount-tendered-input" className="block text-sm text-gray-400 mb-2">{t('pos.amountTendered')}</label>
                            <input
                                id="amount-tendered-input"
                                type="number"
                                value={amountTendered}
                                onChange={(e) => setAmountTendered(e.target.value)}
                                placeholder="Enter amount..."
                                className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white text-xl outline-none focus:border-cyber-primary transition-colors font-mono"
                                autoFocus
                            />
                        </div>
                        <div className="flex-1 max-w-xl relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                onKeyDown={handleSearchKeyDown}
                                placeholder={t('pos.searchPlaceholder')}
                                title={t('pos.searchPlaceholder')}
                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50 transition-all font-medium"
                            />
                            {!unknownBarcode && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600 font-mono">
                                    ENTER
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {[100, 500, 1000, total].map((amt, i) => (
                                <button
                                    key={i}
                                    onClick={() => setAmountTendered(Math.ceil(amt).toString())}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-sm font-mono text-gray-300 whitespace-nowrap"
                                >
                                    {amt === total ? 'Exact' : `${CURRENCY_SYMBOL} ${amt}`}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-gray-400">{t('pos.changeDue')}:</span>
                            <span className={`font-mono text-xl font-bold ${changeDue < 0 ? 'text-red-400' : 'text-cyber-primary'}`}>
                                {CURRENCY_SYMBOL} {changeDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}

                {selectedPaymentMethod !== 'Cash' && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <RefreshCcw className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-blue-400 text-sm font-bold">Waiting for Terminal...</p>
                            <p className="text-gray-400 text-xs mt-1">Ask customer to tap card or scan QR code.</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 pt-4 relative z-10">
                    <button
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-[1.5rem] font-bold transition-all active:scale-95 border border-white/5"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleProcessPayment}
                        disabled={!isPaymentValid || isProcessing}
                        className="flex-[2] py-4 px-6 bg-cyber-primary hover:bg-cyber-primary/90 disabled:bg-white/5 disabled:text-gray-600 disabled:cursor-not-allowed text-black font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 shadow-xl shadow-cyber-primary/20 active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Check size={20} className="relative z-10" />
                        )}
                        <span className="relative z-10">{t('pos.completeSale')}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
