import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShieldAlert, KeyRound, Lock, CheckCircle2, X } from 'lucide-react';
import { Product } from '../../types';
import { useData } from '../../contexts/DataContext';
import PinPad from '../pos/PinPad';

import { matchStaffPin } from '../../utils/employeeIdGenerator';

interface UnknownBarcodeManagerPinStepProps {
    selectedProduct: Product;
    scannedBarcode: string;
    onAuthorized: () => void;
    onBack: () => void;
}

export const UnknownBarcodeManagerPinStep: React.FC<UnknownBarcodeManagerPinStepProps> = ({
    selectedProduct,
    scannedBarcode,
    onAuthorized,
    onBack
}) => {
    const { t } = useLanguage();
    const { settings, employees } = useData();
    const [managerPin, setManagerPin] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const customPin = settings?.managerSecurityPin?.trim();

    const handleVerifyPin = () => {
        const entered = managerPin.trim();
        const matchesConfigured = customPin && entered === customPin;

        // 4-Eyes Principle: Any authorized store supervisor/manager staff PIN
        const managerStaff = (employees || []).filter(e =>
            ['group_ceo', 'country_managing_director', 'store_manager', 'shift_supervisor', 'country_operations_director', 'regional_operations_manager'].includes(e.role?.toLowerCase() || '')
        );
        const matchesStaffPin = managerStaff.some(m => matchStaffPin(m.code, entered));

        if (matchesConfigured || matchesStaffPin) {
            setErrorMsg('');
            onAuthorized();
        } else {
            setErrorMsg(customPin || managerStaff.length > 0
                ? t('pos.barcodePinRejected')
                : t('pos.barcodePinMissing'));
            setManagerPin('');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] flex items-start gap-3">
                <ShieldAlert className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] shrink-0 mt-0.5" size={22} />
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] uppercase tracking-wider">
                        {t('pos.barcodeManagerRequired')}
                    </h4>
                    <p className="text-xs text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] leading-relaxed">
                        <b>{selectedProduct.name}</b> {t('pos.barcodeManagerHelp')}
                    </p>
                </div>
            </div>

            <div className="bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-2xl p-4 text-center">
                <span className="text-[10px] font-mono text-[var(--theme-text-secondary)] uppercase tracking-widest block mb-1">{t('pos.barcodeTarget')}</span>
                <span className="text-sm font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] block truncate">{selectedProduct.name}</span>
                <span className="text-xs font-mono text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] font-bold block mt-1">{scannedBarcode}</span>
            </div>

            {errorMsg && (
                <div className="p-3 rounded-xl bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] text-xs font-bold text-center animate-shake">
                    {errorMsg}
                </div>
            )}

            <div className="flex flex-col items-center">
                <PinPad
                    pin={managerPin}
                    setPin={(p) => {
                        setManagerPin(p);
                        if (errorMsg) setErrorMsg('');
                    }}
                    onEnter={handleVerifyPin}
                />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 text-[var(--theme-text-primary)] hover:text-[var(--theme-primary)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] font-bold text-sm transition-colors cursor-pointer"
                >
                    {t('pos.barcodeBack')}
                </button>
                <button
                    type="button"
                    onClick={handleVerifyPin}
                    disabled={managerPin.length < 4}
                    className="px-6 py-2.5 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-primary)] text-[var(--theme-text-primary)] hover:opacity-90 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider"
                >
                    <CheckCircle2 size={16} />
                    {t('pos.barcodeAuthorizeSubmit')}
                </button>
            </div>
        </div>
    );
};
