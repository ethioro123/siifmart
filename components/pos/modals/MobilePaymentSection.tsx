import React from 'react';
import { Smartphone, CheckCircle2, Send, Clock, AlertCircle, Copy, Check, QrCode } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../../../constants';
import { usePOSMobilePayment, MobilePaymentChannel } from '../hooks/usePOSMobilePayment';

interface MobilePaymentSectionProps {
    mobilePayment: ReturnType<typeof usePOSMobilePayment>;
    total: number;
    isKenya: boolean;
    isEthiopia: boolean;
}

export const MobilePaymentSection: React.FC<MobilePaymentSectionProps> = ({
    mobilePayment,
    total,
    isKenya,
    isEthiopia
}) => {
    const {
        channel,
        setChannel,
        customerPhone,
        setCustomerPhone,
        transactionRef,
        setTransactionRef,
        stkStatus,
        stkCountdown,
        stkErrorMessage,
        triggerStkPush,
        mpesaTillNumber,
        mpesaTillName,
        mpesaPaybillNumber,
        mpesaPaybillAccount,
        airtelTillNumber,
        airtelMerchantName,
        telebirrMerchantId,
        cbeBirrMerchantCode,
        enabledChannels,
        hasEnabledChannels,
        generateSafaricomRef,
        generateAirtelRef
    } = mobilePayment;

    const [copiedTill, setCopiedTill] = React.useState(false);

    const handleCopy = (val: string) => {
        navigator.clipboard?.writeText(val);
        setCopiedTill(true);
        setTimeout(() => setCopiedTill(false), 2000);
    };

    if (!hasEnabledChannels) {
        return (
            <div className="p-5 bg-[var(--theme-status-warning-bg)] dark:bg-amber-950/20 border border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)] rounded-2xl text-center space-y-2">
                <AlertCircle className="mx-auto text-[var(--theme-status-warning-text)]" size={24} />
                <h4 className="text-xs font-black uppercase text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                    No Mobile Gateways Configured
                </h4>
                <p className="text-[11px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                    No mobile payment methods are currently activated in Settings. An administrator can enable M-Pesa Till, STK Push, or Airtel Money in <strong>Settings &gt; POS & Retail Station &gt; Tender & Connectivity</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Kenya Channel Selector Tabs */}
            {isKenya && (
                <div className="flex gap-1.5 p-1 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                    {enabledChannels.includes('MPESA_TILL') && (
                        <button
                            type="button"
                            onClick={() => setChannel('MPESA_TILL')}
                            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer text-center leading-tight ${
                                channel === 'MPESA_TILL'
                                    ? 'bg-[var(--theme-status-success-bg)] text-white shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] text-[var(--theme-status-success-text)]'
                            }`}
                        >
                            M-Pesa Till
                        </button>
                    )}
                    {enabledChannels.includes('MPESA_STK') && (
                        <button
                            type="button"
                            onClick={() => setChannel('MPESA_STK')}
                            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer text-center leading-tight ${
                                channel === 'MPESA_STK'
                                    ? 'bg-[var(--theme-status-success-bg)] text-white shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] text-[var(--theme-status-success-text)]'
                            }`}
                        >
                            STK Push
                        </button>
                    )}
                    {enabledChannels.includes('AIRTEL_MONEY') && (
                        <button
                            type="button"
                            onClick={() => setChannel('AIRTEL_MONEY')}
                            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer text-center leading-tight ${
                                channel === 'AIRTEL_MONEY'
                                    ? 'bg-[var(--theme-status-danger-bg)] text-white shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] text-[var(--theme-status-danger-text)]'
                            }`}
                        >
                            Airtel Money
                        </button>
                    )}
                    {enabledChannels.includes('MPESA_PAYBILL') && (
                        <button
                            type="button"
                            onClick={() => setChannel('MPESA_PAYBILL')}
                            className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer text-center leading-tight ${
                                channel === 'MPESA_PAYBILL'
                                    ? 'bg-[var(--theme-status-warning-bg)] text-white shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] text-[var(--theme-status-warning-text)]'
                            }`}
                        >
                            Paybill
                        </button>
                    )}
                </div>
            )}

            {/* Ethiopia Channel Selector Tabs */}
            {isEthiopia && (
                <div className="flex gap-2 p-1 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                    {enabledChannels.includes('TELEBIRR') && (
                        <button
                            type="button"
                            onClick={() => setChannel('TELEBIRR')}
                            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${
                                channel === 'TELEBIRR'
                                    ? 'bg-[var(--theme-status-info-bg)] text-white shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] text-[var(--theme-status-info-text)]'
                            }`}
                        >
                            Telebirr (SuperApp/USSD)
                        </button>
                    )}
                    {enabledChannels.includes('CBE_BIRR') && (
                        <button
                            type="button"
                            onClick={() => setChannel('CBE_BIRR')}
                            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${
                                channel === 'CBE_BIRR'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-[var(--theme-text-secondary)] hover:text-purple-500'
                            }`}
                        >
                            CBE Birr
                        </button>
                    )}
                </div>
            )}

            {/* CHANNEL 1: M-PESA BUY GOODS (TILL) */}
            {channel === 'MPESA_TILL' && (
                <div className="p-4 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-status-success-bg)] animate-pulse" />
                            <span className="text-xs font-black uppercase text-[var(--theme-status-success-text)] tracking-wider">
                                Lipa Na M-Pesa • Buy Goods
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(mpesaTillNumber)}
                            className="text-xs font-semibold flex items-center gap-1 text-[var(--theme-status-success-text)] hover:underline cursor-pointer"
                        >
                            {copiedTill ? <Check size={12} /> : <Copy size={12} />}
                            {copiedTill ? 'Copied' : 'Copy Till'}
                        </button>
                    </div>

                    {/* Big Till Number Display Box */}
                    <div className="p-3 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-status-success-border)] flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase font-bold tracking-wider text-[var(--theme-text-secondary)]">Till Number</p>
                            <p className="text-2xl font-black font-mono tracking-widest text-[var(--theme-text-primary)]">
                                {mpesaTillNumber}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold tracking-wider text-[var(--theme-text-secondary)]">Amount to Pay</p>
                            <p className="text-base font-black font-mono text-[var(--theme-status-success-text)] tabular-nums">
                                {CURRENCY_SYMBOL} {total.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-[var(--theme-text-secondary)] font-medium leading-relaxed">
                        Direct customer to: <strong>M-Pesa &gt; Lipa na M-PESA &gt; Buy Goods &gt; Till {mpesaTillNumber}</strong>. No transaction fees for customer.
                    </p>

                    {/* M-Pesa SMS Confirmation Code Input */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                            <label className="text-xs font-bold uppercase tracking-wide text-[var(--theme-text-secondary)]">
                                M-Pesa Transaction Code
                            </label>
                            {transactionRef.length >= 8 && (
                                <span className="text-xs font-bold text-[var(--theme-status-success-text)] flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Code Ready
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                placeholder="e.g. SHK89X72K9 (10-digits)"
                                maxLength={12}
                                className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm font-mono font-bold uppercase text-[var(--theme-text-primary)] outline-none border-[var(--theme-status-success-border)]"
                            />
                            <button
                                type="button"
                                onClick={() => setTransactionRef(generateSafaricomRef())}
                                title="Auto-fill simulated reference"
                                className="px-3 py-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] border-[var(--theme-status-success-border)] text-xs font-mono font-bold text-[var(--theme-text-secondary)] rounded-xl cursor-pointer"
                            >
                                Quick Sim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHANNEL 2: M-PESA STK PUSH (API / EXPRESS) */}
            {channel === 'MPESA_STK' && (
                <div className="p-4 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-[var(--theme-status-success-text)]" />
                            <span className="text-xs font-black uppercase text-[var(--theme-status-success-text)] tracking-wider">
                                M-Pesa Express (STK Push)
                            </span>
                        </div>
                        <span className="text-xs font-mono font-bold bg-[var(--theme-status-success-bg)] text-white px-2.5 py-0.5 rounded-full">
                            Daraja API
                        </span>
                    </div>

                    <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        Prompt will appear automatically on customer phone asking for M-Pesa PIN for {CURRENCY_SYMBOL} {total.toLocaleString()}.
                    </p>

                    {/* Phone Input and Push Action */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-[var(--theme-text-secondary)]">
                            Customer Phone Number
                        </label>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 flex-1 focus-within:border-[var(--theme-status-success-border)]">
                                <span className="text-xs font-mono font-bold text-[var(--theme-text-muted)]">+254</span>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="7XX XXX XXX or 1XX XXX XXX"
                                    disabled={stkStatus === 'sending' || stkStatus === 'pending'}
                                    className="w-full bg-transparent text-sm font-mono font-bold text-[var(--theme-text-primary)] outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={triggerStkPush}
                                disabled={stkStatus === 'sending' || stkStatus === 'pending' || !customerPhone.trim()}
                                className="px-4 py-2 bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                            >
                                {stkStatus === 'sending' ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send size={13} />
                                )}
                                <span>{stkStatus === 'pending' ? 'Sent' : 'Push PIN'}</span>
                            </button>
                        </div>
                        {stkErrorMessage && (
                            <p className="text-[11px] text-[var(--theme-status-danger-text)] font-bold flex items-center gap-1 mt-1">
                                <AlertCircle size={12} /> {stkErrorMessage}
                            </p>
                        )}
                    </div>

                    {/* STK Status Feedback Box */}
                    {stkStatus === 'pending' && (
                        <div className="p-3 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-xl flex items-center gap-3 animate-pulse">
                            <Clock className="w-5 h-5 text-[var(--theme-status-warning-text)] animate-spin" />
                            <div className="flex-1">
                                <p className="text-xs font-black text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                                    Prompt sent to customer! ({stkCountdown}s)
                                </p>
                                <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
                                    Customer is entering M-Pesa PIN on their handset...
                                </p>
                            </div>
                        </div>
                    )}

                    {stkStatus === 'success' && (
                        <div className="p-3 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]" />
                            <div className="flex-1">
                                <p className="text-xs font-black text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                                    M-Pesa PIN Confirmed!
                                </p>
                                <p className="text-xs text-[var(--theme-text-secondary)] font-mono font-medium">
                                    Ref: <strong className="text-[var(--theme-text-primary)]">{transactionRef}</strong> • KES {total.toLocaleString()} Received
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CHANNEL 3: AIRTEL MONEY */}
            {channel === 'AIRTEL_MONEY' && (
                <div className="p-4 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-status-danger-bg)]" />
                            <span className="text-xs font-black uppercase text-[var(--theme-status-danger-text)] tracking-wider">
                                Airtel Money (Lipa Karo)
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(airtelTillNumber)}
                            className="text-xs font-semibold flex items-center gap-1 text-[var(--theme-status-danger-text)] hover:underline cursor-pointer"
                        >
                            {copiedTill ? <Check size={12} /> : <Copy size={12} />}
                            {copiedTill ? 'Copied' : 'Copy Till'}
                        </button>
                    </div>

                    <div className="p-3 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-status-danger-border)] flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase font-bold tracking-wider text-[var(--theme-text-secondary)]">Airtel Till</p>
                            <p className="text-2xl font-black font-mono tracking-widest text-[var(--theme-text-primary)]">
                                {airtelTillNumber}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold tracking-wider text-[var(--theme-text-secondary)]">Amount</p>
                            <p className="text-base font-black font-mono text-[var(--theme-status-danger-text)] tabular-nums">
                                {CURRENCY_SYMBOL} {total.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
                        Airtel Money customers can also dial <strong>*334# &gt; Lipa na Airtel &gt; Enter Till {airtelTillNumber}</strong>, or pay to Safaricom Till {mpesaTillNumber} via national interoperability.
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-[var(--theme-text-secondary)]">
                            Airtel Transaction Code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                placeholder="e.g. AIR19028374"
                                maxLength={16}
                                className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm font-mono font-bold uppercase text-[var(--theme-text-primary)] outline-none border-[var(--theme-status-danger-border)]"
                            />
                            <button
                                type="button"
                                onClick={() => setTransactionRef(generateAirtelRef())}
                                className="px-3 py-2 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] border-[var(--theme-status-danger-border)] text-xs font-mono font-bold text-[var(--theme-text-secondary)] rounded-xl cursor-pointer"
                            >
                                Quick Sim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHANNEL 4: M-PESA PAYBILL */}
            {channel === 'MPESA_PAYBILL' && (
                <div className="p-4 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-[var(--theme-status-warning-text)] tracking-wider">
                            Lipa Na M-Pesa • Paybill
                        </span>
                        <span className="text-xs font-mono font-bold text-[var(--theme-text-secondary)]">Business / Invoicing</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-status-warning-border)]">
                        <div>
                            <p className="text-xs uppercase font-bold tracking-wider text-[var(--theme-text-secondary)]">Business No (Paybill)</p>
                            <p className="text-xl font-black font-mono text-[var(--theme-text-primary)]">{mpesaPaybillNumber}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-bold tracking-wider text-[var(--theme-text-secondary)]">Account No</p>
                            <p className="text-xl font-black font-mono text-[var(--theme-text-primary)]">SIIFMART</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-[var(--theme-text-secondary)]">
                            M-Pesa Transaction Code
                        </label>
                        <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g. QKH78XK29M"
                            maxLength={12}
                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm font-mono font-bold uppercase text-[var(--theme-text-primary)] outline-none border-[var(--theme-status-warning-border)]"
                        />
                    </div>
                </div>
            )}

            {/* ETHIOPIA: TELEBIRR / CBE BIRR */}
            {(channel === 'TELEBIRR' || channel === 'CBE_BIRR') && (
                <div className="p-4 bg-[var(--theme-status-info-bg)] border border-[var(--theme-status-info-border)] rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase text-[var(--theme-status-info-text)]">
                            {channel === 'TELEBIRR' ? 'Telebirr SuperApp / USSD (*127#)' : 'CBE Birr (*847#)'}
                        </p>
                        <span className="text-xs font-mono font-bold text-[var(--theme-status-info-text)] bg-[var(--theme-bg-card)] px-2.5 py-0.5 rounded-lg border border-[var(--theme-border)]">
                            Shortcode: 778899
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-[var(--theme-text-secondary)]">
                            Confirmation Reference Number
                        </label>
                        <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g. TB998822 or CBE Ref"
                            className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-sm font-mono font-bold uppercase text-[var(--theme-text-primary)] outline-none border-[var(--theme-status-info-border)]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
