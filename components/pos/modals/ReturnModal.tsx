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
import { matchStaffPin } from '../../../utils/employeeIdGenerator';
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

        // Zero-Trust Rule: All returns and refunds require supervisory dual-authorization
        setIsPinStep(true);
        setPinError('');
    };

    const handleVerifyHqOtp = () => {
        const entered = hqOtp.trim();
        const customPin = settings?.managerSecurityPin?.trim();

        // 4-Eyes / Central HQ Dual Control: Manager cannot approve their own refund
        if (user?.code && matchStaffPin(user.code, entered)) {
            setPinError('4-Eyes Violation: You cannot approve your own refund. A secondary supervisor or manager must authenticate.');
            setHqOtp('');
            return;
        }

        const matchesConfigured = customPin && entered === customPin;

        const hqStaff = (employees || []).filter(e =>
            e.id !== user?.id &&
            (!user?.code || e.code !== user.code) &&
            ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_compliance_manager', 'auditor', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'regional_operations_manager'].includes(e.role?.toLowerCase() || '')
        );
        const matchesHqStaff = hqStaff.some(m => m.code?.trim() && matchStaffPin(m.code.trim(), entered));

        if (matchesConfigured || matchesHqStaff) {
            setPinError('');
            setIsPinStep(false);
            const verifiedOtp = entered;
            setHqOtp('');
            handleProcessReturn(refundMethod, customerPhone, verifiedOtp);
        } else {
            setPinError(customPin || hqStaff.length > 0 
                ? 'Invalid Authorization PIN. A secondary manager or supervisor must authenticate.' 
                : 'No Manager Security PIN configured in Settings. Refund rejected under Zero-Trust policy.');
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

                        <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-4 text-center">
                            <span className="text-xs font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1">Receipt Reference</span>
                            <span className="text-sm font-black text-[var(--theme-text-primary)] font-mono block truncate">
                                {foundSaleForReturn?.receiptNumber || `TX-${foundSaleForReturn?.id}`}
                            </span>
                            <span className="text-lg font-mono text-rose-500 font-black block mt-1 tabular-nums">
                                Cash Payout: {CURRENCY_SYMBOL} {totalRefundAmount.toLocaleString()}
                            </span>
                        </div>

                        {pinError && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold text-center animate-shake">
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

                        <div className="flex justify-between items-center pt-4 border-t border-[var(--theme-border)]">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPinStep(false);
                                    setHqOtp('');
                                    setPinError('');
                                }}
                                className="px-4 py-2.5 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] font-bold text-xs transition-colors cursor-pointer"
                            >
                                Back to Tenders
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifyHqOtp}
                                disabled={hqOtp.length < 4 || isProcessing}
                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-xs cursor-pointer text-xs uppercase tracking-wider"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Verify HQ OTP & Dispense Cash
                            </button>
                        </div>
                    </div>
                ) : !foundSaleForReturn ? (
                    <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center mx-auto text-[var(--theme-text-primary)]">
                            <RotateCcw size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--theme-text-primary)]">{t('pos.findTransaction')}</h3>
                        <p className="text-[var(--theme-text-secondary)] text-sm max-w-xs mx-auto">{t('pos.returnInstruction')}</p>

                        <div className="flex max-w-md mx-auto gap-2 mt-4">
                            <input
                                type="text"
                                placeholder="Scan receipt barcode or enter e.g. TX-9981"
                                className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-border-focus)] transition-colors font-mono text-sm"
                                value={returnSearchId}
                                onChange={(e) => setReturnSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchForReturn()}
                            />
                            <Button
                                onClick={handleSearchForReturn}
                                className="bg-[var(--theme-primary)] text-[var(--theme-primary-text)] px-6 rounded-xl font-bold hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                            >
                                Lookup
                            </Button>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-2 inline-flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>All refund transactions require supervisor authorization and are logged.</span>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex items-center justify-between bg-[var(--theme-bg-subtle)] p-4 rounded-xl border border-[var(--theme-border)]">
                            <div>
                                <p className="text-xs text-[var(--theme-text-secondary)] uppercase font-mono">Transaction ID</p>
                                <p className="text-[var(--theme-text-primary)] font-mono font-bold">{foundSaleForReturn.receiptNumber || `SALE-${foundSaleForReturn.id.substring(0, 8).toUpperCase()}`}</p>
                                <p className="text-xs text-[var(--theme-text-secondary)]">{foundSaleForReturn.date}</p>
                            </div>
                            <button onClick={() => setFoundSaleForReturn(null)} className="text-xs text-[var(--theme-primary)] hover:underline cursor-pointer font-bold">
                                Change Transaction
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-bold text-[var(--theme-text-primary)]">{t('pos.selectItemsToReturn')}</p>
                            <div className="bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] overflow-hidden">
                                {foundSaleForReturn.items.map(item => {
                                    const itemConfig = returnConfig[item.id] || { qty: 0, condition: 'Resalable', reason: 'Customer Changed Mind' };
                                    return (
                                        <div key={item.id} className="p-4 border-b border-[var(--theme-border)] last:border-0 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm text-[var(--theme-text-primary)] font-medium">{item.name}</p>
                                                    <p className="text-xs text-[var(--theme-text-secondary)]">Sold: {item.quantity} @ {formatCompactNumber(item.price, { currency: CURRENCY_SYMBOL })}</p>
                                                </div>
                                                <div className="flex items-center bg-[var(--theme-bg-card)] rounded-lg p-1 border border-[var(--theme-border)]">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateReturnConfig(item.id, 'qty', Math.max(0, itemConfig.qty - 1))}
                                                        className="w-8 h-8 flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded cursor-pointer"
                                                        aria-label="Decrease return quantity"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center font-mono text-[var(--theme-text-primary)] tabular-nums">{itemConfig.qty}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateReturnConfig(item.id, 'qty', Math.min(item.quantity, itemConfig.qty + 1))}
                                                        className="w-8 h-8 flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded cursor-pointer"
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
                                                        className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs text-[var(--theme-text-primary)] outline-none"
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
                                                        className={`bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs outline-none font-bold ${itemConfig.condition === 'Damaged' ? 'text-red-500' : 'text-emerald-500'}`}
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

                        <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-4 space-y-4">
                            {/* Refund Tender Method Selector */}
                            <div className="space-y-2">
                                <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider block">
                                    Select Refund Tender (Zero-Trust Policy)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRefundMethod('STORE_CREDIT')}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${refundMethod === 'STORE_CREDIT'
                                            ? 'bg-[var(--theme-text-primary)] text-[var(--theme-bg-app)] border-[var(--theme-text-primary)] shadow-xs'
                                            : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:border-[var(--theme-border-strong)]'
                                            }`}
                                    >
                                        Store Credit
                                    </button>
                                    {isKenya ? (
                                        <button
                                            type="button"
                                            onClick={() => setRefundMethod('M_PESA')}
                                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${refundMethod === 'M_PESA'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:border-emerald-500/40'
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
                                                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                                    : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:border-sky-500/40'
                                                    }`}
                                            >
                                                Telebirr
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRefundMethod('CBE_BIRR')}
                                                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${refundMethod === 'CBE_BIRR'
                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                                    : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:border-purple-500/40'
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
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                            : 'bg-[var(--theme-bg-card)] text-rose-500 border-rose-500/20 hover:border-rose-500/50'
                                            }`}
                                    >
                                        Cash (HQ OTP)
                                    </button>
                                </div>
                            </div>

                            {/* Customer Phone Input for Digital / Store Credit */}
                            {refundMethod !== 'CASH' && (
                                <div className="space-y-1">
                                    <label className="text-xs text-[var(--theme-text-secondary)] uppercase font-bold tracking-wider block">
                                        Customer Mobile Number (For Credit / Digital Reversal)
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="0911234567"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-border-focus)] tabular-nums"
                                    />
                                </div>
                            )}

                            {/* Total Refund Display */}
                            <div className="flex justify-between items-center pt-2 border-t border-[var(--theme-border)]">
                                <span className="text-[var(--theme-text-secondary)] font-medium">{t('pos.totalRefund')}</span>
                                <span className="text-2xl font-mono font-bold text-[var(--theme-primary)] tabular-nums">
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
                                    className="flex-1 py-3 bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl hover:bg-[var(--theme-bg-card-hover)] transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleInitiateRefund}
                                    disabled={totalRefundAmount === 0 || isProcessing || (refundMethod !== 'CASH' && !customerPhone.trim())}
                                    className={`flex-1 py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 border border-transparent disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs disabled:shadow-none text-xs uppercase tracking-wider ${refundMethod === 'CASH'
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : 'bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)]'
                                        }`}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : refundMethod === 'CASH' ? <Lock size={16} /> : <RotateCcw size={16} />}
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
