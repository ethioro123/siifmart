import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import PinPad from '../PinPad';
import { CURRENCY_SYMBOL } from '../../../constants';
import { matchStaffPin } from '../../../utils/employeeIdGenerator';
import { posOverridesService } from '../../../services/pos-overrides.service';
import { OverrideReasonCode, OVERRIDE_REASON_LABELS } from '../../../types/pos-zero-trust';
import { audioFeedback } from '../../../utils/audioFeedback';
import { ShieldAlert, Trash2, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

interface VoidAuthorizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthorized: () => void;
    itemsCount: number;
    voidTotal: number;
    itemsSummary: string;
}

export const VoidAuthorizationModal: React.FC<VoidAuthorizationModalProps> = ({
    isOpen,
    onClose,
    onAuthorized,
    itemsCount,
    voidTotal,
    itemsSummary
}) => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { activeSite, employees, addNotification, effectiveCountry } = useData();

    const [reasonCode, setReasonCode] = useState<OverrideReasonCode>('customer_walkout');
    const [reasonDetails, setReasonDetails] = useState('');
    const [supervisorPin, setSupervisorPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirmVoid = async () => {
        if (!user) return;
        const enteredPin = supervisorPin.trim();

        const supervisors = (employees || []).filter(e =>
            ['super_admin', 'admin', 'store_manager', 'assistant_manager', 'shift_lead', 'store_supervisor', 'operations_manager'].includes(e.role?.toLowerCase() || '')
        );

        const authorizedSupervisor = supervisors.find(s => s.code?.trim() && matchStaffPin(s.code.trim(), enteredPin));

        if (!authorizedSupervisor) {
            setPinError('Invalid Supervisor PIN. An authorized manager must approve sale cancellations.');
            setSupervisorPin('');
            return;
        }

        // 4-Eyes Check: Supervisor cannot be the cashier voiding the transaction
        if (authorizedSupervisor.id === user.id || (user.code && authorizedSupervisor.code === user.code)) {
            setPinError('4-Eyes Violation: Cashier cannot authorize their own void/cancellation.');
            setSupervisorPin('');
            return;
        }

        setIsSubmitting(true);
        try {
            await posOverridesService.logOverride({
                country_code: activeSite?.country || effectiveCountry || 'ET',
                site_id: activeSite?.id || 'SITE-001',
                cashier: { id: user.id, name: user.name, code: user.code },
                supervisor: { id: authorizedSupervisor.id, name: authorizedSupervisor.name, role: authorizedSupervisor.role, code: authorizedSupervisor.code },
                override_type: 'cart_void',
                reason_code: reasonCode,
                reason_details: reasonDetails || itemsSummary,
                original_value: voidTotal,
                override_value: 0
            });

            audioFeedback.playWarning();
            addNotification('info', `Transaction Void Authorized by ${authorizedSupervisor.name} (${OVERRIDE_REASON_LABELS[reasonCode]})`);
            onAuthorized();
            onClose();
            setSupervisorPin('');
            setPinError('');
        } catch (err: any) {
            setPinError(err.message || 'Failed to log supervisory override.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Zero-Trust Void & Cancellation Authorization"
            size="md"
        >
            <div className="p-4 sm:p-6 space-y-5">
                {/* Warning Banner */}
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3">
                    <ShieldAlert size={22} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h4 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                            Supervisory Approval Required (SOP-POS-008)
                        </h4>
                        <p className="text-xs font-medium text-rose-700 dark:text-rose-300 leading-relaxed">
                            Under Zero-Trust Loss Prevention, cashiers cannot unilaterally void sales. Voiding <b>{itemsCount} item(s)</b> worth <b>{CURRENCY_SYMBOL} {voidTotal.toLocaleString()}</b> requires on-duty supervisor co-sign.
                        </p>
                    </div>
                </div>

                {/* Reason Code Dropdown */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-[var(--theme-text-secondary)] tracking-wider">
                        Mandatory Reason Code
                    </label>
                    <select
                        value={reasonCode}
                        onChange={(e) => setReasonCode(e.target.value as OverrideReasonCode)}
                        className="w-full px-3 py-2.5 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl text-xs text-[var(--theme-input-text)] font-semibold outline-none focus:border-[var(--theme-border-focus)] transition-colors"
                    >
                        {Object.entries(OVERRIDE_REASON_LABELS).map(([code, label]) => (
                            <option key={code} value={code}>{label}</option>
                        ))}
                    </select>
                </div>

                {pinError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold text-center rounded-xl animate-shake">
                        {pinError}
                    </div>
                )}

                {/* Pin Pad */}
                <div className="flex flex-col items-center">
                    <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold mb-2">Supervisor Enter Staff PIN</p>
                    <PinPad pin={supervisorPin} setPin={setSupervisorPin} onEnter={handleConfirmVoid} />
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmVoid}
                        disabled={supervisorPin.length < 4 || isSubmitting}
                        className="flex-2 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        Authorize & Void Cart
                    </button>
                </div>
            </div>
        </Modal>
    );
};
