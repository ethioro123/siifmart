import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Eye, EyeOff, Save, ScanLine } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { Country, getCountryProfile } from '../../../utils/localization';

export const RetailLossPreventionCard: React.FC = () => {
    const { settings, updateSettings, effectiveCountry } = useData();
    const { user, showToast } = useStore();

    const activeCountry: Country = (effectiveCountry || settings?.country || 'ET') as Country;
    const countryProfile = getCountryProfile(activeCountry);
    const currency = countryProfile.currencySymbol || (activeCountry === 'ET' ? 'ETB' : 'KES');

    const [pin, setPin] = useState(settings?.managerSecurityPin || '1234');
    const [showPin, setShowPin] = useState(false);
    const [threshold, setThreshold] = useState(settings?.highValueBarcodeLockThreshold?.toString() || '3000');
    const [blindClose, setBlindClose] = useState(settings?.blindCloseEnforced ?? true);
    const [requireRefundPin, setRequireRefundPin] = useState(settings?.requireRefundManagerPin ?? true);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (pin.length < 4) {
            showToast('PIN must be at least 4 digits', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            await updateSettings({
                managerSecurityPin: pin.trim(),
                highValueBarcodeLockThreshold: parseFloat(threshold) || 3000,
                blindCloseEnforced: blindClose,
                requireRefundManagerPin: requireRefundPin
            }, user?.name || 'Manager');

            showToast('Retail Security & PIN settings saved', 'success');
        } catch {
            showToast('Failed to save security settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 space-y-6 shadow-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--theme-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 dark:bg-[#2997FF]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
                            Retail Loss Prevention & POS Security
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)]">
                            Manage Supervisor PIN overrides, blind drawer reconciliation, and anti-fraud lock thresholds.
                        </p>
                    </div>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-semibold tracking-wide">
                    Loss Prevention Active
                </span>
            </div>

            {/* Manager PIN Setup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <KeyRound size={15} className="text-[#0071E3] dark:text-[#2997FF]" />
                            Manager Override PIN
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="text-xs text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] flex items-center gap-1 cursor-pointer font-medium"
                        >
                            {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showPin ? 'Hide' : 'Reveal'}
                        </button>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                        4-8 digit authorization PIN used for approving cash refunds, shift variances, and high-value barcode overrides.
                    </p>
                    <input
                        type={showPin ? "text" : "password"}
                        maxLength={8}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="1234"
                        className="w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 font-mono text-base font-bold text-[var(--theme-text-primary)] outline-none focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-colors"
                    />
                </div>

                {/* High Value Barcode Lock Threshold */}
                <div className="p-4 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] space-y-3">
                    <label className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                        <ScanLine size={15} className="text-[#0071E3] dark:text-[#2997FF]" />
                        High-Value Barcode Anomaly Lock
                    </label>
                    <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                        Items priced at or above this amount require mandatory live verification and Supervisor PIN before barcode mapping.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[var(--theme-text-secondary)] px-2 py-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-lg">
                            {currency}
                        </span>
                        <input
                            type="number"
                            min="100"
                            step="100"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            placeholder="3000"
                            className="flex-1 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl px-3.5 py-2.5 font-mono text-sm font-semibold text-[var(--theme-text-primary)] outline-none focus:border-[#0071E3] dark:focus:border-[#2997FF] transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Policy Toggles */}
            <div className="space-y-3 pt-1">
                <h4 className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">
                    Anti-Fraud Enforcements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => setBlindClose(!blindClose)}
                        className="p-4 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between cursor-pointer hover:border-[#0071E3]/30 transition-all"
                    >
                        <div className="pr-4 space-y-0.5">
                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">Enforce Blind Shift Close</p>
                            <p className="text-xs text-[var(--theme-text-secondary)]">Conceal expected cash tallies in POS to eliminate drawer skimming.</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={blindClose}
                            onClick={(e) => {
                                e.stopPropagation();
                                setBlindClose(!blindClose);
                            }}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${blindClose ? 'bg-[#0071E3] dark:bg-[#2997FF]' : 'bg-[var(--theme-border)]'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${blindClose ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div
                        onClick={() => setRequireRefundPin(!requireRefundPin)}
                        className="p-4 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between cursor-pointer hover:border-[#0071E3]/30 transition-all"
                    >
                        <div className="pr-4 space-y-0.5">
                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">Require PIN on Cash Refunds</p>
                            <p className="text-xs text-[var(--theme-text-secondary)]">Prevent phantom returns by requiring supervisor authorization.</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={requireRefundPin}
                            onClick={(e) => {
                                e.stopPropagation();
                                setRequireRefundPin(!requireRefundPin);
                            }}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer flex-shrink-0 ${requireRefundPin ? 'bg-[#0071E3] dark:bg-[#2997FF]' : 'bg-[var(--theme-border)]'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${requireRefundPin ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Action */}
            <div className="flex justify-end pt-4 border-t border-[var(--theme-border)]">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-9 px-4 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                    Save Security Policies
                </button>
            </div>
        </div>
    );
};
