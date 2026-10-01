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
            <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-950/40 rounded-2xl text-center space-y-2">
                <AlertCircle className="mx-auto text-amber-600" size={24} />
                <h4 className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">
                    No Mobile Gateways Configured
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    No mobile payment methods are currently activated in Settings. An administrator can enable M-Pesa Till, STK Push, or Airtel Money in <strong>Settings &gt; POS & Retail Station &gt; Tender & Connectivity</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Kenya Channel Selector Tabs */}
            {isKenya && (
                <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-black/30 rounded-2xl border border-stone-200 dark:border-white/10">
                    {enabledChannels.includes('MPESA_TILL') && (
                        <button
                            type="button"
                            onClick={() => setChannel('MPESA_TILL')}
                            className={`flex-1 py-2 px-1 text-[11px] font-black rounded-xl transition-all cursor-pointer text-center leading-tight ${
                                channel === 'MPESA_TILL'
                                    ? 'bg-[#00A859] text-white shadow-sm'
                                    : 'text-stone-600 dark:text-stone-300 hover:text-[#00A859]'
                            }`}
                        >
                            M-Pesa Till
                        </button>
                    )}
                    {enabledChannels.includes('MPESA_STK') && (
                        <button
                            type="button"
                            onClick={() => setChannel('MPESA_STK')}
                            className={`flex-1 py-2 px-1 text-[11px] font-black rounded-xl transition-all cursor-pointer text-center leading-tight ${
                                channel === 'MPESA_STK'
                                    ? 'bg-[#00A859] text-white shadow-sm'
                                    : 'text-stone-600 dark:text-stone-300 hover:text-[#00A859]'
                            }`}
                        >
                            STK Push
                        </button>
                    )}
                    {enabledChannels.includes('AIRTEL_MONEY') && (
                        <button
                            type="button"
                            onClick={() => setChannel('AIRTEL_MONEY')}
                            className={`flex-1 py-2 px-1 text-[11px] font-black rounded-xl transition-all cursor-pointer text-center leading-tight ${
                                channel === 'AIRTEL_MONEY'
                                    ? 'bg-[#ED1C24] text-white shadow-sm'
                                    : 'text-stone-600 dark:text-stone-300 hover:text-[#ED1C24]'
                            }`}
                        >
                            Airtel Money
                        </button>
                    )}
                    {enabledChannels.includes('MPESA_PAYBILL') && (
                        <button
                            type="button"
                            onClick={() => setChannel('MPESA_PAYBILL')}
                            className={`flex-1 py-2 px-1 text-[11px] font-black rounded-xl transition-all cursor-pointer text-center leading-tight ${
                                channel === 'MPESA_PAYBILL'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-stone-600 dark:text-stone-300 hover:text-amber-600'
                            }`}
                        >
                            Paybill
                        </button>
                    )}
                </div>
            )}

            {/* Ethiopia Channel Selector Tabs */}
            {isEthiopia && (
                <div className="flex gap-2 p-1 bg-stone-100 dark:bg-black/30 rounded-2xl border border-stone-200 dark:border-white/10">
                    {enabledChannels.includes('TELEBIRR') && (
                        <button
                            type="button"
                            onClick={() => setChannel('TELEBIRR')}
                            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${
                                channel === 'TELEBIRR'
                                    ? 'bg-[#0072CE] text-white shadow-sm'
                                    : 'text-stone-600 dark:text-stone-300'
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
                                    ? 'bg-[#5B2C6F] text-white shadow-sm'
                                    : 'text-stone-600 dark:text-stone-300'
                            }`}
                        >
                            CBE Birr
                        </button>
                    )}
                </div>
            )}

            {/* CHANNEL 1: M-PESA BUY GOODS (TILL) */}
            {channel === 'MPESA_TILL' && (
                <div className="p-4 bg-[#00A859]/10 border border-[#00A859]/30 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#00A859] animate-pulse" />
                            <span className="text-xs font-black uppercase text-[#00A859] tracking-wider">
                                Lipa Na M-Pesa • Buy Goods
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(mpesaTillNumber)}
                            className="text-[10px] font-bold flex items-center gap-1 text-[#00A859] hover:underline cursor-pointer"
                        >
                            {copiedTill ? <Check size={12} /> : <Copy size={12} />}
                            {copiedTill ? 'Copied' : 'Copy Till'}
                        </button>
                    </div>

                    {/* Big Till Number Display Box */}
                    <div className="p-3 bg-white dark:bg-black/40 rounded-xl border border-[#00A859]/30 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-stone-500 dark:text-gray-400">Till Number</p>
                            <p className="text-2xl font-black font-mono tracking-widest text-[#1E3F27] dark:text-white">
                                {mpesaTillNumber}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-stone-500 dark:text-gray-400">Amount to Pay</p>
                            <p className="text-base font-black font-mono text-[#00A859]">
                                {CURRENCY_SYMBOL} {total.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <p className="text-[10px] text-stone-500 dark:text-gray-400 leading-relaxed">
                        Direct customer to: <strong>M-Pesa &gt; Lipa na M-PESA &gt; Buy Goods &gt; Till {mpesaTillNumber}</strong>. No transaction fees for customer.
                    </p>

                    {/* M-Pesa SMS Confirmation Code Input */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline">
                            <label className="text-xs font-bold uppercase tracking-wide text-stone-700 dark:text-stone-300">
                                M-Pesa Transaction Code
                            </label>
                            {transactionRef.length >= 8 && (
                                <span className="text-[10px] font-bold text-[#00A859] flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Code Ready
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
                                className="flex-1 bg-white dark:bg-black/40 border border-stone-300 dark:border-white/20 rounded-xl px-3 py-2 text-sm font-mono font-bold uppercase text-[#1E3F27] dark:text-white outline-none focus:border-[#00A859]"
                            />
                            <button
                                type="button"
                                onClick={() => setTransactionRef(generateSafaricomRef())}
                                title="Auto-fill simulated reference"
                                className="px-3 py-2 bg-white dark:bg-black/40 border border-stone-200 dark:border-white/10 hover:border-[#00A859] text-[10px] font-mono font-bold text-stone-600 dark:text-stone-300 rounded-xl cursor-pointer"
                            >
                                Quick Sim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHANNEL 2: M-PESA STK PUSH (API / EXPRESS) */}
            {channel === 'MPESA_STK' && (
                <div className="p-4 bg-[#00A859]/10 border border-[#00A859]/30 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-[#00A859]" />
                            <span className="text-xs font-black uppercase text-[#00A859] tracking-wider">
                                M-Pesa Express (STK Push)
                            </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-[#00A859] text-white px-2 py-0.5 rounded-full">
                            Daraja API
                        </span>
                    </div>

                    <p className="text-[10px] text-stone-500 dark:text-gray-400">
                        Prompt will appear automatically on customer phone asking for M-Pesa PIN for {CURRENCY_SYMBOL} {total.toLocaleString()}.
                    </p>

                    {/* Phone Input and Push Action */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-stone-700 dark:text-stone-300">
                            Customer Phone Number
                        </label>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 bg-white dark:bg-black/40 border border-stone-300 dark:border-white/20 rounded-xl px-3 py-2 flex-1 focus-within:border-[#00A859]">
                                <span className="text-xs font-mono font-bold text-stone-400">+254</span>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="7XX XXX XXX or 1XX XXX XXX"
                                    disabled={stkStatus === 'sending' || stkStatus === 'pending'}
                                    className="w-full bg-transparent text-sm font-mono font-bold text-[#1E3F27] dark:text-white outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={triggerStkPush}
                                disabled={stkStatus === 'sending' || stkStatus === 'pending' || !customerPhone.trim()}
                                className="px-4 py-2 bg-[#00A859] hover:bg-[#008F4C] disabled:bg-stone-300 dark:disabled:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
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
                            <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 mt-1">
                                <AlertCircle size={12} /> {stkErrorMessage}
                            </p>
                        )}
                    </div>

                    {/* STK Status Feedback Box */}
                    {stkStatus === 'pending' && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 animate-pulse">
                            <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                            <div className="flex-1">
                                <p className="text-xs font-black text-amber-700 dark:text-amber-400">
                                    Prompt sent to customer! ({stkCountdown}s)
                                </p>
                                <p className="text-[10px] text-stone-500 dark:text-gray-400">
                                    Customer is entering M-Pesa PIN on their handset...
                                </p>
                            </div>
                        </div>
                    )}

                    {stkStatus === 'success' && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <div className="flex-1">
                                <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                                    M-Pesa PIN Confirmed!
                                </p>
                                <p className="text-[10px] text-stone-500 dark:text-gray-400 font-mono">
                                    Ref: <strong>{transactionRef}</strong> • KES {total.toLocaleString()} Received
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CHANNEL 3: AIRTEL MONEY */}
            {channel === 'AIRTEL_MONEY' && (
                <div className="p-4 bg-[#ED1C24]/10 border border-[#ED1C24]/30 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24]" />
                            <span className="text-xs font-black uppercase text-[#ED1C24] tracking-wider">
                                Airtel Money (Lipa Karo)
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(airtelTillNumber)}
                            className="text-[10px] font-bold flex items-center gap-1 text-[#ED1C24] hover:underline cursor-pointer"
                        >
                            {copiedTill ? <Check size={12} /> : <Copy size={12} />}
                            {copiedTill ? 'Copied' : 'Copy Till'}
                        </button>
                    </div>

                    <div className="p-3 bg-white dark:bg-black/40 rounded-xl border border-[#ED1C24]/30 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-stone-500 dark:text-gray-400">Airtel Till</p>
                            <p className="text-2xl font-black font-mono tracking-widest text-[#1E3F27] dark:text-white">
                                {airtelTillNumber}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-stone-500 dark:text-gray-400">Amount</p>
                            <p className="text-base font-black font-mono text-[#ED1C24]">
                                {CURRENCY_SYMBOL} {total.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <p className="text-[10px] text-stone-500 dark:text-gray-400">
                        Airtel Money customers can also dial <strong>*334# &gt; Lipa na Airtel &gt; Enter Till {airtelTillNumber}</strong>, or pay to Safaricom Till {mpesaTillNumber} via national interoperability.
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-stone-700 dark:text-stone-300">
                            Airtel Transaction Code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                placeholder="e.g. AIR19028374"
                                maxLength={16}
                                className="flex-1 bg-white dark:bg-black/40 border border-stone-300 dark:border-white/20 rounded-xl px-3 py-2 text-sm font-mono font-bold uppercase text-[#1E3F27] dark:text-white outline-none focus:border-[#ED1C24]"
                            />
                            <button
                                type="button"
                                onClick={() => setTransactionRef(generateAirtelRef())}
                                className="px-3 py-2 bg-white dark:bg-black/40 border border-stone-200 dark:border-white/10 hover:border-[#ED1C24] text-[10px] font-mono font-bold text-stone-600 dark:text-stone-300 rounded-xl cursor-pointer"
                            >
                                Quick Sim
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHANNEL 4: M-PESA PAYBILL */}
            {channel === 'MPESA_PAYBILL' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                            Lipa Na M-Pesa • Paybill
                        </span>
                        <span className="text-[10px] font-mono font-bold text-stone-500">Business / Invoicing</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-black/40 rounded-xl border border-amber-500/20">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-stone-500">Business No (Paybill)</p>
                            <p className="text-xl font-black font-mono text-[#1E3F27] dark:text-white">{mpesaPaybillNumber}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-stone-500">Account No</p>
                            <p className="text-xl font-black font-mono text-[#1E3F27] dark:text-white">SIIFMART</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-stone-700 dark:text-stone-300">
                            M-Pesa Transaction Code
                        </label>
                        <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g. QKH78XK29M"
                            maxLength={12}
                            className="w-full bg-white dark:bg-black/40 border border-stone-300 dark:border-white/20 rounded-xl px-3 py-2 text-sm font-mono font-bold uppercase text-[#1E3F27] dark:text-white outline-none focus:border-amber-500"
                        />
                    </div>
                </div>
            )}

            {/* ETHIOPIA: TELEBIRR / CBE BIRR */}
            {(channel === 'TELEBIRR' || channel === 'CBE_BIRR') && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase text-blue-700 dark:text-blue-400">
                            {channel === 'TELEBIRR' ? 'Telebirr SuperApp / USSD (*127#)' : 'CBE Birr (*847#)'}
                        </p>
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-white dark:bg-black/40 px-2 py-0.5 rounded">
                            Shortcode: 778899
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wide text-stone-700 dark:text-stone-300">
                            Confirmation Reference Number
                        </label>
                        <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g. TB998822 or CBE Ref"
                            className="w-full bg-white dark:bg-black/40 border border-stone-300 dark:border-white/20 rounded-xl px-3 py-2 text-sm font-mono font-bold uppercase text-[#1E3F27] dark:text-white outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
