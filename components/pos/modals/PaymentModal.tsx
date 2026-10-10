import React from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import { CURRENCY_SYMBOL } from '../../../constants';
import { PaymentMethod } from '../../../types';
import { Banknote, CreditCard, Smartphone, RefreshCcw, Check } from 'lucide-react';
import { usePOSMobilePayment } from '../hooks/usePOSMobilePayment';
import { MobilePaymentSection } from './MobilePaymentSection';

export const PaymentModal: React.FC = () => {
    const { t, isKenya, isEthiopia, countryProfile } = useLanguage();
    const { settings } = useData();
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
        selectedCustomer
    } = usePOS();

    const mobilePayment = usePOSMobilePayment({
        isKenya,
        isEthiopia,
        total,
        selectedCustomer,
        settings
    });

    const isMobileReady = selectedPaymentMethod === 'Mobile Money' ? mobilePayment.isMobilePaymentReady() : true;
    const canComplete = isPaymentValid && isMobileReady && !isProcessing;

    const handleComplete = () => {
        if (selectedPaymentMethod === 'Mobile Money') {
            handleProcessPayment({
                channel: mobilePayment.getChannelLabel(mobilePayment.channel),
                ref: mobilePayment.transactionRef || undefined,
                phone: mobilePayment.customerPhone ? `+254${mobilePayment.customerPhone}` : undefined
            });
        } else {
            handleProcessPayment();
        }
    };

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
                <div className="text-center p-5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl relative overflow-hidden">
                    <p className="text-[var(--theme-text-secondary)] text-xs font-bold uppercase tracking-widest mb-1">{t('pos.totalAmountDue')}</p>
                    <p className="text-4xl sm:text-5xl font-black text-[var(--theme-text-primary)] font-mono tabular-nums tracking-tight">{CURRENCY_SYMBOL} {total.toLocaleString()}</p>
                </div>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'Cash', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: t('pos.cash') },
                        { id: 'Card', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10', label: t('pos.card') },
                        { id: 'Mobile Money', icon: Smartphone, color: 'text-amber-500', bg: 'bg-amber-500/10', label: isKenya ? 'M-Pesa' : t('pos.mobile') }
                    ].map(method => {
                        const Icon = method.icon;
                        const isSelected = selectedPaymentMethod === method.id;
                        return (
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
                                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                                    isSelected
                                        ? 'bg-[var(--theme-bg-card)] border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)] shadow-sm'
                                        : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-strong)]'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${method.bg} ${method.color} flex items-center justify-center shrink-0`}>
                                    <Icon size={20} />
                                </div>
                                <span className={`text-xs font-semibold tracking-tight ${isSelected ? 'text-[var(--theme-text-primary)] font-bold' : 'text-[var(--theme-text-secondary)]'}`}>
                                    {method.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Cash Tender Details */}
                {selectedPaymentMethod === 'Cash' && (
                    <div className="space-y-4 pt-1">
                        <div>
                            <div className="flex justify-between items-baseline mb-1.5">
                                <label htmlFor="amount-tendered-input" className="block text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                    {t('pos.amountTendered')}
                                </label>
                                {shortage > 0 && (
                                    <span className="text-[11px] font-bold text-rose-500 animate-pulse">
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
                                className={`w-full bg-[var(--theme-bg-subtle)] border rounded-2xl px-4 py-3 text-[var(--theme-text-primary)] text-2xl outline-none font-mono font-bold transition-all tabular-nums tracking-tight ${
                                    shortage > 0
                                        ? 'border-rose-400 focus:border-rose-500'
                                        : 'border-[var(--theme-border)] focus:border-[var(--theme-border-focus)] focus:ring-1 focus:ring-[var(--theme-border-focus)]'
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
                                        className={`py-2.5 rounded-xl border text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer tabular-nums active:scale-95 shadow-xs ${
                                            isSelected
                                                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-transparent'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] border-[var(--theme-border)]'
                                        }`}
                                    >
                                        {isExact ? 'Exact' : `${CURRENCY_SYMBOL} ${amt}`}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Change Due Box */}
                        <div className="flex justify-between items-center p-4 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                            <span className="text-sm font-bold text-[var(--theme-text-secondary)]">{t('pos.changeDue')}:</span>
                            <span className={`font-mono text-2xl font-black tabular-nums ${shortage > 0 ? 'text-red-500 text-lg' : 'text-[var(--theme-text-primary)]'}`}>
                                {shortage > 0
                                    ? `-${CURRENCY_SYMBOL} ${shortage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `${CURRENCY_SYMBOL} ${changeDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                        </div>
                    </div>
                )}

                {selectedPaymentMethod === 'Mobile Money' && (
                    <MobilePaymentSection
                        mobilePayment={mobilePayment}
                        total={total}
                        isKenya={isKenya}
                        isEthiopia={isEthiopia}
                    />
                )}

                {selectedPaymentMethod === 'Card' && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                        <RefreshCcw className="w-5 h-5 text-blue-500 mt-0.5 animate-spin" />
                        <div>
                            <p className="text-blue-500 text-sm font-bold">Waiting for Terminal...</p>
                            <p className="text-[var(--theme-text-secondary)] text-xs mt-0.5">Ask customer to tap card or swipe.</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="flex-1 py-3.5 px-5 bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl font-bold text-sm transition-all cursor-pointer"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleComplete}
                        disabled={!canComplete}
                        className="flex-[2] py-3.5 px-6 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--theme-primary-text)] rounded-2xl font-black text-sm uppercase tracking-wider disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Check size={18} />
                        )}
                        <span>{canComplete ? t('pos.completeSale') : selectedPaymentMethod === 'Cash' ? 'Enter Tendered Amount' : 'Enter Payment Details'}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};
