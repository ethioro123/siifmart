import React, { useState } from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import Button from '../../shared/Button';
import PinPad from '../PinPad';
import { CURRENCY_SYMBOL } from '../../../constants';
import { formatCompactNumber } from '../../../utils/formatting';
import { RotateCcw, Minus, Plus, AlertTriangle, Loader2, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

export const ReturnModal: React.FC = () => {
    const { t, isKenya } = useLanguage();
    const { user } = useStore();
    const { settings, employees } = useData();
    const {
        isReturnModalOpen,
        setIsReturnModalOpen,
        foundSaleForReturn,
        setFoundSaleForReturn,
        returnSearchId,
        setReturnSearchId,
        handleSearchForReturn,
        returnConfig,
        updateReturnConfig,
        handleProcessReturn,
        isProcessing,
    } = usePOS();

    const [isPinStep, setIsPinStep] = useState(false);
    const [hqOtp, setHqOtp] = useState('');
    const [pinError, setPinError] = useState('');
    const [refundMethod, setRefundMethod] = useState<'STORE_CREDIT' | 'TELEBIRR' | 'CBE_BIRR' | 'M_PESA' | 'CASH'>('STORE_CREDIT');
    const [customerPhone, setCustomerPhone] = useState('');

    const totalRefundAmount = foundSaleForReturn
        ? foundSaleForReturn.items.reduce((sum, item) => sum + (item.price * (returnConfig[item.id]?.qty || 0)), 0)
        : 0;

    const handleClose = () => {
        setIsReturnModalOpen(false);
        setIsPinStep(false);
        setHqOtp('');
        setPinError('');
    };

    const handleInitiateRefund = () => {
        if (totalRefundAmount === 0) return;

        // Zero-Trust Rule: Physical cash payout requires Central HQ OTP authorization
        if (refundMethod === 'CASH') {
            setIsPinStep(true);
        } else {
            handleProcessReturn(refundMethod, customerPhone);
        }
    };

    const handleVerifyHqOtp = () => {
        const entered = hqOtp.trim();
        const customPin = settings?.managerSecurityPin?.trim();
        const matchesConfigured = customPin && entered === customPin;

        // 4-Eyes / Central HQ Dual Control: HQ Admin or Store Manager authorized OTP
        const hqStaff = (employees || []).filter(e =>
            ['super_admin', 'admin', 'store_manager', 'finance_manager', 'auditor', 'ceo'].includes(e.role?.toLowerCase() || '')
        );
        const matchesHqStaff = hqStaff.some(m => m.code?.trim() === entered);

        if (matchesConfigured || matchesHqStaff) {
            setPinError('');
            setIsPinStep(false);
            const verifiedOtp = entered;
            setHqOtp('');
            handleProcessReturn('CASH', customerPhone, verifiedOtp);
        } else {
            setPinError(customPin || hqStaff.length > 0 
                ? 'Invalid Central HQ Authorization OTP. Cash refund rejected.' 
                : 'No Manager Security PIN configured in Settings. Cash refund rejected.');
            setHqOtp('');
        }
    };

    return (
        <Modal
            isOpen={isReturnModalOpen}
            onClose={handleClose}
            title={isPinStep ? "Central HQ Cash Refund Authorization" : "Returns & Refund Manager (Zero-Trust)"}
            size="lg"
        >
            <div className="space-y-6">
                {isPinStep ? (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                            <ShieldAlert className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" size={22} />
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                                    Central HQ Authorization OTP Required
                                </h4>
                                <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                                    Zero-Trust Anti-Collusion Policy: Store Manager PIN cannot authorize cash withdrawals from the drawer. A cash refund of <b>{CURRENCY_SYMBOL} {totalRefundAmount.toLocaleString()}</b> requires a 6-digit One-Time Passcode (OTP) issued directly by Central HQ Finance or the Store Owner.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/80 dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-2xl p-4 text-center">
                            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">Receipt Reference</span>
                            <span className="text-sm font-black text-[#1E3F27] dark:text-white font-mono block truncate">
                                {foundSaleForReturn?.receiptNumber || `TX-${foundSaleForReturn?.id}`}
                            </span>
                            <span className="text-lg font-mono text-rose-600 dark:text-rose-400 font-black block mt-1">
                                Cash Payout: {CURRENCY_SYMBOL} {totalRefundAmount.toLocaleString()}
                            </span>
                        </div>

                        {pinError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold text-center animate-shake">
                                {pinError}
                            </div>
                        )}

                        <div className="flex flex-col items-center">
                            <PinPad
                                pin={hqOtp}
                                setPin={(p) => {
                                    setHqOtp(p);
                                    if (pinError) setPinError('');
                                }}
                                onEnter={handleVerifyHqOtp}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-[#E2DCCE] dark:border-white/5">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPinStep(false);
                                    setHqOtp('');
                                    setPinError('');
                                }}
                                className="px-4 py-2 text-stone-700 hover:text-[#2C5E3B] dark:text-gray-300 dark:hover:text-white font-bold text-sm transition-colors cursor-pointer"
                            >
                                Back to Tenders
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyHqOtp}
                                disabled={hqOtp.length < 4 || isProcessing}
                                className="px-6 py-2.5 bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white hover:opacity-90 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Verify HQ OTP & Dispense Cash
                            </button>
                        </div>
                    </div>
                ) : !foundSaleForReturn ? (
                    <div className="bg-white/50 dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[#2C5E3B]/10 flex items-center justify-center mx-auto">
                            <RotateCcw size={32} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{t('pos.findTransaction')}</h3>
                        <p className="text-[#4D6E56] dark:text-gray-400 text-sm max-w-xs mx-auto">{t('pos.returnInstruction')}</p>

                        <div className="flex max-w-md mx-auto gap-2 mt-4">
                            <input
                                type="text"
                                placeholder="Scan receipt barcode or enter e.g. TX-9981"
                                className="flex-1 bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/20 rounded-xl px-4 py-3 text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors font-mono text-sm"
                                value={returnSearchId}
                                onChange={(e) => setReturnSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchForReturn()}
                            />
                            <Button
                                onClick={handleSearchForReturn}
                                className="bg-[#2C5E3B] text-white px-6 rounded-xl font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm"
                            >
                                Lookup
                            </Button>
                        </div>
                        <p className="text-xs text-[#4D6E56] dark:text-gray-500 mt-2">🔒 All refund transactions require supervisor validation and are logged.</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex items-center justify-between bg-[#FAF8F5] dark:bg-white/5 p-4 rounded-xl border border-[#E2DCCE] dark:border-white/5">
                            <div>
                                <p className="text-xs text-[#4D6E56] dark:text-gray-400 uppercase font-mono">Transaction ID</p>
                                <p className="text-[#1E3F27] dark:text-white font-mono font-bold">{foundSaleForReturn.receiptNumber || `SALE-${foundSaleForReturn.id.substring(0, 8).toUpperCase()}`}</p>
                                <p className="text-xs text-[#4D6E56] dark:text-gray-500">{foundSaleForReturn.date}</p>
                            </div>
                            <button onClick={() => setFoundSaleForReturn(null)} className="text-xs text-[#2C5E3B] dark:text-[#A9CBA2] hover:underline cursor-pointer font-bold">
                                Change Transaction
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-bold text-[#1E3F27] dark:text-white">{t('pos.selectItemsToReturn')}</p>
                            <div className="bg-[#FAF8F5] dark:bg-black/20 rounded-xl border border-[#E2DCCE] dark:border-white/5 overflow-hidden">
                                {foundSaleForReturn.items.map(item => {
                                    const itemConfig = returnConfig[item.id] || { qty: 0, condition: 'Resalable', reason: 'Customer Changed Mind' };
                                    return (
                                        <div key={item.id} className="p-4 border-b border-[#E2DCCE]/50 dark:border-white/5 last:border-0 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm text-[#1E3F27] dark:text-white font-medium">{item.name}</p>
                                                    <p className="text-xs text-[#4D6E56] dark:text-gray-500">Sold: {item.quantity} @ {formatCompactNumber(item.price, { currency: CURRENCY_SYMBOL })}</p>
                                                </div>
                                                <div className="flex items-center bg-white/90 dark:bg-black/35 rounded-lg p-1 border border-[#E2DCCE]/50 dark:border-white/5">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateReturnConfig(item.id, 'qty', Math.max(0, itemConfig.qty - 1))}
                                                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/10 rounded cursor-pointer"
                                                        aria-label="Decrease return quantity"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center font-mono text-[#1E3F27] dark:text-white">{itemConfig.qty}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateReturnConfig(item.id, 'qty', Math.min(item.quantity, itemConfig.qty + 1))}
                                                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-[#1E3F27] dark:hover:text-white hover:bg-white/10 rounded cursor-pointer"
                                                        aria-label="Increase return quantity"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {itemConfig.qty > 0 && (
                                                <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                                                    <select
                                                        value={itemConfig.reason}
                                                        onChange={(e) => updateReturnConfig(item.id, 'reason', e.target.value)}
                                                        className="bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E3F27] dark:text-gray-300 outline-none"
                                                        aria-label="Return reason"
                                                    >
                                                        <option>Defective</option>
                                                        <option>Expired</option>
                                                        <option>Customer Changed Mind</option>
                                                        <option>Wrong Item</option>
                                                    </select>
                                                    <select
                                                        value={itemConfig.condition}
                                                        onChange={(e) => updateReturnConfig(item.id, 'condition', e.target.value)}
                                                        className={`bg-white dark:bg-black/30 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none font-bold ${itemConfig.condition === 'Damaged' ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-green-400'}`}
                                                        aria-label="Condition"
                                                    >
                                                        <option value="Resalable">Return to Stock (Resalable)</option>
                                                        <option value="Damaged">Write-off (Damaged)</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white/50 dark:bg-black/25 border border-[#E2DCCE] dark:border-white/10 rounded-xl p-4 space-y-4">
                            {/* Refund Tender Method Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] text-stone-600 dark:text-gray-400 uppercase font-black tracking-widest block">
                                    Select Refund Tender (Zero-Trust Policy)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRefundMethod('STORE_CREDIT')}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${refundMethod === 'STORE_CREDIT'
                                            ? 'bg-[#2C5E3B] text-white border-[#2C5E3B] shadow-sm'
                                            : 'bg-white dark:bg-black/20 text-stone-700 dark:text-gray-300 border-[#E2DCCE] dark:border-white/10 hover:border-[#2C5E3B]/40'
                                            }`}
                                    >
                                        Store Credit
                                    </button>
                                    {isKenya ? (
                                        <button
                                            type="button"
                                            onClick={() => setRefundMethod('M_PESA')}
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${refundMethod === 'M_PESA'
                                                ? 'bg-[#00A859] text-white border-[#00A859] shadow-sm'
                                                : 'bg-white dark:bg-black/20 text-stone-700 dark:text-gray-300 border-[#E2DCCE] dark:border-white/10 hover:border-emerald-500/40'
                                                }`}
                                        >
                                            M-Pesa (Safaricom)
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setRefundMethod('TELEBIRR')}
                                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${refundMethod === 'TELEBIRR'
                                                    ? 'bg-[#0070BA] text-white border-[#0070BA] shadow-sm'
                                                    : 'bg-white dark:bg-black/20 text-stone-700 dark:text-gray-300 border-[#E2DCCE] dark:border-white/10 hover:border-blue-500/40'
                                                    }`}
                                            >
                                                Telebirr
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRefundMethod('CBE_BIRR')}
                                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${refundMethod === 'CBE_BIRR'
                                                    ? 'bg-[#6A1B9A] text-white border-[#6A1B9A] shadow-sm'
                                                    : 'bg-white dark:bg-black/20 text-stone-700 dark:text-gray-300 border-[#E2DCCE] dark:border-white/10 hover:border-purple-500/40'
                                                    }`}
                                            >
                                                CBE Birr
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setRefundMethod('CASH')}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${refundMethod === 'CASH'
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                            : 'bg-white dark:bg-black/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 hover:border-rose-500/50'
                                            }`}
                                    >
                                        Cash (HQ OTP)
                                    </button>
                                </div>
                            </div>

                            {/* Customer Phone Input for Digital / Store Credit */}
                            {refundMethod !== 'CASH' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] text-stone-600 dark:text-gray-400 uppercase font-black tracking-widest block">
                                        Customer Mobile Number (For Credit / Digital Reversal)
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="0911234567"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2]"
                                    />
                                </div>
                            )}

                            {/* Total Refund Display */}
                            <div className="flex justify-between items-center pt-2 border-t border-[#E2DCCE]/50 dark:border-white/5">
                                <span className="text-[#4D6E56] dark:text-gray-400 font-medium">{t('pos.totalRefund')}</span>
                                <span className="text-2xl font-mono font-bold text-[#2C5E3B] dark:text-[#A9CBA2]">
                                    {CURRENCY_SYMBOL} {totalRefundAmount.toLocaleString()}
                                </span>
                            </div>

                            {totalRefundAmount > 0 && (
                                <div className={`p-3 rounded-lg flex items-start gap-3 border ${refundMethod === 'CASH'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                    }`}>
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium leading-relaxed">
                                        {refundMethod === 'CASH'
                                            ? "Zero-Trust Warning: Physical cash refunds require a 6-digit Central HQ Finance OTP. Store Manager PIN cannot approve cash payouts."
                                            : "Digital/Credit Refund: Zero cash will leave the register drawer. Full audit trail logged to Central Operations."
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setFoundSaleForReturn(null)}
                                    className="flex-1 py-3 bg-white/90 dark:bg-black/35 text-stone-700 dark:text-stone-300 border border-[#E2DCCE] dark:border-white/10 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-colors font-bold text-sm cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleInitiateRefund}
                                    disabled={totalRefundAmount === 0 || isProcessing || (refundMethod !== 'CASH' && !customerPhone.trim())}
                                    className={`flex-1 py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:bg-stone-200 dark:disabled:bg-white/5 disabled:text-stone-400 dark:disabled:text-stone-600 border border-transparent disabled:border-stone-300 dark:disabled:border-white/10 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:shadow-none ${refundMethod === 'CASH'
                                        ? 'bg-gradient-to-r from-rose-600 to-red-700'
                                        : 'bg-gradient-to-r from-[#224429] to-[#2C5E3B]'
                                        }`}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : refundMethod === 'CASH' ? <Lock size={18} /> : <RotateCcw size={18} />}
                                    {isProcessing
                                        ? t('pos.processing')
                                        : refundMethod === 'CASH'
                                            ? "Request HQ OTP"
                                            : "Issue Digital Refund"
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
