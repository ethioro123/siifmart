import React, { useState, useMemo } from 'react';
import { usePOS } from '../POSContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import PinPad from '../PinPad';
import { CURRENCY_SYMBOL } from '../../../constants';
import { SaleRecord } from '../../../types';
import { matchStaffPin } from '../../../utils/employeeIdGenerator';
import { cashDropsService } from '../../../services/cash-drops.service';
import { SOVEREIGN_CASH_POLICIES } from '../../../types/pos-zero-trust';
import { audioFeedback } from '../../../utils/audioFeedback';
import { ShieldAlert, ArrowDownCircle, CheckCircle2, Lock, AlertTriangle, Loader2 } from 'lucide-react';

interface CashDropModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CashDropModal: React.FC<CashDropModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { activeSite, employees, addNotification, effectiveCountry, settings, allSales } = useData();
    const { activeShift } = usePOS();

    const countryCode = ((activeSite?.country || effectiveCountry || settings?.country || 'ET') as 'ET' | 'KE');
    const policy = SOVEREIGN_CASH_POLICIES[countryCode] || SOVEREIGN_CASH_POLICIES.ET;


    // Shift Cash Telemetry
    const shiftTelemetry = useMemo(() => {
        if (!activeShift) return { cashSales: 0, cashDrops: 0, cashOnHand: 0 };
        const startTime = new Date(activeShift.startTime).getTime();
        const siteId = activeShift?.siteId || activeSite?.id;
        const currentSales = (allSales || []).filter((s: SaleRecord) => {
            if (new Date(s.date).getTime() < startTime) return false;
            if (siteId && s.siteId !== siteId && (s as any).site_id !== siteId) return false;
            return s.method === 'Cash';
        });
        const cashSales = currentSales.reduce((sum: number, s: SaleRecord) => sum + s.total, 0);
        const cashDrops = Number(activeShift.cashDrops || (activeShift as any).cash_drops || 0);
        const cashOnHand = (activeShift.openingFloat || 0) + cashSales - cashDrops;
        return { cashSales, cashDrops, cashOnHand };
    }, [activeShift, allSales, activeSite]);


    // Form state
    const [dropAmount, setDropAmount] = useState<string>('');
    const [safeBagNumber, setSafeBagNumber] = useState<string>(() => `BAG-${Math.floor(100000 + Math.random() * 900000)}`);
    const [reason, setReason] = useState<string>('threshold_exceeded');
    const [dropNotes, setDropNotes] = useState<string>('');
    const [isPinStep, setIsPinStep] = useState(false);
    const [supervisorPin, setSupervisorPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const amountNum = parseFloat(dropAmount) || 0;
    const isOverThreshold = shiftTelemetry.cashOnHand >= policy.warning_threshold;

    const handleProceedToAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (amountNum <= 0) {
            addNotification('alert', 'Please enter a valid cash drop amount.');
            return;
        }
        if (amountNum > shiftTelemetry.cashOnHand) {
            addNotification('alert', `Cannot drop more cash than is currently in till (${CURRENCY_SYMBOL} ${shiftTelemetry.cashOnHand.toLocaleString()}).`);
            return;
        }
        setIsPinStep(true);
        setPinError('');
    };

    const handleConfirmDrop = async () => {
        if (!user || !activeShift) return;

        // Verify Supervisor PIN
        const enteredPin = supervisorPin.trim();
        const supervisors = (employees || []).filter(e =>
            ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'regional_operations_manager', 'store_manager', 'assistant_store_manager', 'shift_supervisor'].includes(e.role?.toLowerCase() || '')
        );

        const authorizedSupervisor = supervisors.find(s => s.code?.trim() && matchStaffPin(s.code.trim(), enteredPin));

        if (!authorizedSupervisor) {
            setPinError('Invalid Supervisor PIN. Only Store Managers or Shift Supervisors can authorize safe drops.');
            setSupervisorPin('');
            return;
        }

        // 4-Eyes Check: Supervisor cannot be the cashier on this shift
        if (authorizedSupervisor.id === user.id || (user.code && authorizedSupervisor.code === user.code)) {
            setPinError('4-Eyes Violation: Cashier cannot authorize their own safe cash drop. A secondary manager must sign.');
            setSupervisorPin('');
            return;
        }

        setIsSubmitting(true);
        try {
            await cashDropsService.createCashDrop({
                country_code: countryCode,
                site_id: activeSite?.id || 'SITE-001',
                shift_id: activeShift.id,
                amount: amountNum,
                currency: policy.currency,
                safe_bag_number: safeBagNumber,
                denominations: {},
                reason,
                notes: dropNotes,
                cashier: { id: user.id, name: user.name, code: user.code },
                supervisor: { id: authorizedSupervisor.id, name: authorizedSupervisor.name, role: authorizedSupervisor.role, code: authorizedSupervisor.code }
            });

            audioFeedback.playSaleComplete();

            // Electron drawer kick for drop deposit
            if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                window.electronAPI.openCashDrawer().catch(() => {});
            }

            addNotification('success', `Cash Drop Complete: ${policy.currency} ${amountNum.toLocaleString()} deposited in safe.`);
            onClose();
            setIsPinStep(false);
            setDropAmount('');
            setSupervisorPin('');
        } catch (err: any) {
            setPinError(err.message || 'Failed to process safe cash drop.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isPinStep ? t('pos.supervisorDualSignOff') : t('pos.safeCashDropTitle')}
            size="md"
        >
            <div className="space-y-5">
                {!isPinStep ? (
                    <form onSubmit={handleProceedToAuth} className="space-y-4">
                        {/* Till Telemetry Banner */}
                        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                            isOverThreshold
                                ? 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)]'
                                : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] text-[var(--theme-text-primary)]'
                        }`}>
                            <ArrowDownCircle size={20} className={isOverThreshold ? 'text-[var(--theme-status-warning)] mt-0.5' : 'text-[var(--theme-text-primary)] mt-0.5'} />
                            <div className="space-y-1 w-full">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider">{t('pos.drawerCashStatus')}</h4>
                                    <span className="text-xs font-mono font-bold tabular-nums">
                                        {t('pos.limitLabel', { amount: `${policy.currency} ${policy.maximum_threshold.toLocaleString()}` })}
                                    </span>
                                </div>
                                <p className="text-sm font-mono font-bold text-[var(--theme-text-primary)] tabular-nums">
                                    {t('pos.currentTillCash', { amount: `${policy.currency} ${shiftTelemetry.cashOnHand.toLocaleString()}` })}
                                </p>
                                {isOverThreshold && (
                                    <p className="text-xs text-[var(--theme-status-warning-text)] font-medium leading-tight inline-flex items-center gap-1.5 mt-0.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--theme-status-warning)] shrink-0" />
                                        <span>{t('pos.safetyLimitExceeded')}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-primary)]">
                                {t('pos.dropAmount')} ({policy.currency})
                            </label>
                            <input
                                type="number"
                                min="100"
                                max={shiftTelemetry.cashOnHand}
                                step="100"
                                value={dropAmount}
                                onChange={(e) => setDropAmount(e.target.value)}
                                placeholder="e.g. 15000"
                                className="w-full px-4 py-3 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-2xl font-mono text-2xl font-bold text-[var(--theme-input-text)] outline-none focus:border-[var(--theme-border-focus)] transition-colors"
                                autoFocus
                                required
                            />
                        </div>

                        {/* Safe Bag & Reason */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">{t('pos.safeBagNumber')}</label>
                                <input
                                    type="text"
                                    value={safeBagNumber}
                                    onChange={(e) => setSafeBagNumber(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl font-mono text-xs text-[var(--theme-input-text)] outline-none focus:border-[var(--theme-border-focus)]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">{t('pos.reasonForDrop')}</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl text-xs text-[var(--theme-input-text)] font-semibold outline-none focus:border-[var(--theme-border-focus)]"
                                >
                                    <option value="threshold_exceeded">Threshold Exceeded</option>
                                    <option value="excess_cash_skim">Excess Skim Before Rush</option>
                                    <option value="shift_handover">Shift Handover Skim</option>
                                    <option value="drawer_security_precaution">Security Precaution</option>
                                </select>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl font-bold uppercase text-xs cursor-pointer transition-colors shadow-xs"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={amountNum <= 0}
                                className="flex-2 py-3 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--theme-primary-text)] rounded-xl font-bold uppercase text-xs shadow-xs cursor-pointer transition-all"
                            >
                                {t('pos.proceedToSupervisorAuth')}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Step 2: 4-Eyes Supervisor Authentication */
                    <div className="space-y-5 animate-in fade-in">
                        <div className="p-4 bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] rounded-2xl flex items-start gap-3">
                            <Lock size={22} className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] uppercase tracking-wider">
                                    Supervisor Co-Sign Required (4-Eyes Principle)
                                </h4>
                                <p className="text-xs text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-medium leading-relaxed">
                                    Authorizing drop of <b>{policy.currency} {amountNum.toLocaleString()}</b> into Bag #{safeBagNumber}. Store Manager or Supervisor must enter their staff PIN to verify physical cash deposit into drop safe.
                                </p>
                            </div>
                        </div>

                        {pinError && (
                            <div className="p-3 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] text-xs font-bold text-center rounded-xl animate-shake">
                                {pinError}
                            </div>
                        )}

                        <div className="flex flex-col items-center">
                            <PinPad pin={supervisorPin} setPin={setSupervisorPin} onEnter={handleConfirmDrop} />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPinStep(false)}
                                className="flex-1 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDrop}
                                disabled={supervisorPin.length < 4 || isSubmitting}
                                className="flex-2 py-3 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--theme-primary-text)] rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                {t('pos.confirmCashDrop')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
