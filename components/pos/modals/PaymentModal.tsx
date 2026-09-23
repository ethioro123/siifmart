import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { PaymentMethod } from '../../../types';
import { Banknote, CreditCard, Smartphone, RefreshCcw, Check } from 'lucide-react';

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
        changeDue,
        handleProcessPayment,
        isPaymentValid,
        isProcessing,
    } = usePOS();

    const quickCashAmounts = React.useMemo(() => {
        const exact = Math.ceil(total);
        const options = new Set<number>([exact]);
        if (exact < 500) {
            options.add(100);
            options.add(200);
            options.add(500);
        } else if (exact < 1000) {
            options.add(Math.ceil(exact / 100) * 100);
            options.add(1000);
        } else {
            options.add(Math.ceil(exact / 100) * 100);
            options.add(Math.ceil(exact / 500) * 500);
            options.add(Math.ceil(exact / 1000) * 1000);
        }
        return Array.from(options).filter(v => v > 0).sort((a, b) => a - b).slice(0, 4);
    }, [total]);

    const shortage = selectedPaymentMethod === 'Cash' ? Math.max(0, total - parseFloat(amountTendered || '0')) : 0;

    return (
        <Modal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            title={t('pos.processPayment')}
            size="md"
        >
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                {/* Total Amount Card */}
                <div className="text-center p-5 bg-[#2C5E3B]/5 dark:bg-[#A9CBA2]/5 border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/20 rounded-2xl relative overflow-hidden">
                    <p className="text-[#2C5E3B] dark:text-[#A9CBA2] text-xs font-black uppercase tracking-widest mb-1">{t('pos.totalAmountDue')}</p>
                    <p className="text-4xl sm:text-5xl font-black text-[#1E3F27] dark:text-white font-mono tracking-tight">{CURRENCY_SYMBOL} {total.toLocaleString()}</p>
                </div>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'Cash', icon: <Banknote size={22} />, label: t('pos.cash') },
                        { id: 'Card', icon: <CreditCard size={22} />, label: t('pos.card') },
                        { id: 'Mobile Money', icon: <Smartphone size={22} />, label: t('pos.mobile') }
                    ].map(method => (
                        <button
                            key={method.id}
                            type="button"
                            title={t('pos.initializePayment')}
                            onClick={() => {
                                setSelectedPaymentMethod(method.id as PaymentMethod);
                                if (method.id === 'Cash' && (!amountTendered || parseFloat(amountTendered) < total)) {
                                    setAmountTendered(Math.ceil(total).toString());
                                }
                            }}
                            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                                selectedPaymentMethod === method.id
                                    ? 'bg-[#2C5E3B] border-[#2C5E3B] text-white shadow-md'
                                    : 'bg-stone-50 dark:bg-black/20 border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-[#2C5E3B]/40'
                            }`}
                        >
                            {method.icon}
                            <span className="text-xs font-black uppercase tracking-wider">{method.label}</span>
                        </button>
                    ))}
                </div>

                {/* Cash Tender Details */}
                {selectedPaymentMethod === 'Cash' && (
                    <div className="space-y-4 pt-1">
                        <div>
                            <div className="flex justify-between items-baseline mb-1.5">
                                <label htmlFor="amount-tendered-input" className="block text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
                                    {t('pos.amountTendered')}
                                </label>
                                {shortage > 0 && (
                                    <span className="text-[11px] font-bold text-red-500 animate-pulse">
                                        Need {CURRENCY_SYMBOL} {shortage.toLocaleString()} more
                                    </span>
                                )}
                            </div>
                            <input
                                id="amount-tendered-input"
                                type="number"
                                value={amountTendered}
                                onChange={(e) => setAmountTendered(e.target.value)}
                                placeholder="Enter amount..."
                                className={`w-full bg-white dark:bg-black/40 border rounded-2xl px-4 py-3 text-[#1E3F27] dark:text-white text-2xl outline-none font-mono font-bold shadow-inner transition-colors ${
                                    shortage > 0
                                        ? 'border-red-400 focus:border-red-500'
                                        : 'border-stone-300 dark:border-white/20 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]'
                                }`}
                                autoFocus
                            />
                        </div>

                        {/* Quick Cash Buttons */}
                        <div className="grid grid-cols-4 gap-2.5">
                            {quickCashAmounts.map((amt, i) => {
                                const isExact = amt === Math.ceil(total);
                                const isSelected = parseFloat(amountTendered || '0') === amt;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setAmountTendered(amt.toString())}
                                        className={`py-2.5 rounded-xl border text-sm font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
                                            isSelected
                                                ? 'bg-[#2C5E3B] text-white border-[#2C5E3B]'
                                                : 'bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-stone-200 hover:bg-[#2C5E3B]/10 border-stone-200 dark:border-white/10'
                                        }`}
                                    >
                                        {isExact ? 'Exact' : `${CURRENCY_SYMBOL} ${amt}`}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Change Due Box */}
                        <div className="flex justify-between items-center p-4 bg-stone-50 dark:bg-black/30 rounded-2xl border border-stone-200 dark:border-white/10">
                            <span className="text-sm font-bold text-stone-600 dark:text-stone-300">{t('pos.changeDue')}:</span>
                            <span className={`font-mono text-2xl font-black ${shortage > 0 ? 'text-red-500 text-lg' : 'text-[#2C5E3B] dark:text-[#A9CBA2]'}`}>
                                {shortage > 0
                                    ? `-${CURRENCY_SYMBOL} ${shortage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `${CURRENCY_SYMBOL} ${changeDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                        </div>
                    </div>
                )}

                {selectedPaymentMethod !== 'Cash' && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                        <RefreshCcw className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 animate-spin" />
                        <div>
                            <p className="text-blue-700 dark:text-blue-400 text-sm font-bold">Waiting for Terminal...</p>
                            <p className="text-stone-500 dark:text-gray-400 text-xs mt-0.5">Ask customer to tap card or scan QR code.</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="flex-1 py-3.5 px-5 bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/20 rounded-2xl font-bold text-sm transition-all cursor-pointer"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleProcessPayment}
                        disabled={!isPaymentValid || isProcessing}
                        className="flex-[2] py-3.5 px-6 bg-[#2C5E3B] hover:bg-[#1B3520] disabled:bg-stone-200 dark:disabled:bg-white/5 text-white disabled:text-stone-400 dark:disabled:text-stone-600 rounded-2xl font-black text-sm uppercase tracking-wider disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Check size={18} />
                        )}
                        <span>{isPaymentValid ? t('pos.completeSale') : 'Enter Tendered Amount'}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
