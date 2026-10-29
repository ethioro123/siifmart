import React, { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import Modal from '../../Modal';
import PinPad from '../PinPad';
import { matchStaffPin } from '../../../utils/employeeIdGenerator';
import { posOverridesService } from '../../../services/pos-overrides.service';
import { OverrideReasonCode } from '../../../types/pos-zero-trust';
import { audioFeedback } from '../../../utils/audioFeedback';
import { KeyRound, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

interface NoSaleKickModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NoSaleKickModal: React.FC<NoSaleKickModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { user } = useStore();
    const { activeSite, employees, addNotification, effectiveCountry } = useData();

    const [reasonCode, setReasonCode] = useState<OverrideReasonCode>('change_making');
    const [reasonDetails, setReasonDetails] = useState('');
    const [supervisorPin, setSupervisorPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirmKick = async () => {
        if (!user) return;
        const enteredPin = supervisorPin.trim();

        const supervisors = (employees || []).filter(e =>
            ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'regional_operations_manager', 'store_manager', 'assistant_store_manager', 'shift_supervisor'].includes(e.role?.toLowerCase() || '')
        );

        const authorizedSupervisor = supervisors.find(s => s.code?.trim() && matchStaffPin(s.code.trim(), enteredPin));

        if (!authorizedSupervisor) {
            setPinError('Invalid Supervisor PIN. An authorized manager must sign off on opening the drawer without a sale.');
            setSupervisorPin('');
            return;
        }

        // 4-Eyes Check
        if (authorizedSupervisor.id === user.id || (user.code && authorizedSupervisor.code === user.code)) {
            setPinError('4-Eyes Violation: Cashier cannot self-authorize a no-sale drawer kick.');
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
                override_type: 'no_sale_drawer_kick',
                reason_code: reasonCode,
                reason_details: reasonDetails || 'Manual cash drawer kick without sale'
            });

            // Auto-kick drawer via Electron API
            if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                window.electronAPI.openCashDrawer().catch(() => {});
            }

            audioFeedback.playScanSuccess();
            addNotification('info', `No-Sale Drawer Kick Authorized by ${authorizedSupervisor.name}`);
            onClose();
            setSupervisorPin('');
            setPinError('');
        } catch (err: any) {
            setPinError(err.message || 'Failed to authorize drawer kick.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('pos.manualDrawerKickTitle')}
            size="md"
        >
            <div className="space-y-4">
                <div className="p-4 bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] rounded-2xl flex items-start gap-3">
                    <ShieldAlert size={20} className="text-[var(--theme-status-warning)] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                            {t('pos.antiSkimmingProtocol')}
                        </h4>
                        <p className="text-xs font-medium text-[var(--theme-status-warning-text)] leading-relaxed">
                            {t('pos.noSaleWarning')}
                        </p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-[var(--theme-text-secondary)] tracking-wider">
                        {t('pos.operationalReason')}
                    </label>
                    <select
                        value={reasonCode}
                        onChange={(e) => setReasonCode(e.target.value as OverrideReasonCode)}
                        className="w-full px-3 py-2.5 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-xl text-xs text-[var(--theme-input-text)] font-semibold outline-none focus:border-[var(--theme-border-focus)] transition-colors"
                    >
                        <option value="change_making">{t('pos.changeMaking')}</option>
                        <option value="till_audit_inspection">{t('pos.tillAuditInspection')}</option>
                        <option value="cash_drawer_jam">{t('pos.cashDrawerJam')}</option>
                        <option value="other_authorized">{t('pos.otherAuthorized')}</option>
                    </select>
                </div>

                {pinError && (
                    <div className="p-3 bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-xs font-bold text-center rounded-xl animate-shake">
                        {pinError}
                    </div>
                )}

                <div className="flex flex-col items-center">
                    <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-wider font-bold mb-2">{t('pos.supervisorEnterPin')}</p>
                    <PinPad pin={supervisorPin} setPin={setSupervisorPin} onEnter={handleConfirmKick} />
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-border)] rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmKick}
                        disabled={supervisorPin.length < 4 || isSubmitting}
                        className="flex-2 py-3 bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--theme-primary-text)] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
                        {t('pos.authorizeDrawerKick')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
