import React, { useState } from 'react';
import { ShieldAlert, Lock, KeyRound, Eye, EyeOff, Save, CheckCircle2, ScanLine, AlertCircle } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { CURRENCY_SYMBOL } from '../../../constants';

export const RetailLossPreventionCard: React.FC = () => {
    const { settings, updateSettings } = useData();
    const { user, showToast } = useStore();

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
        <div className="bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-6 lg:p-8 space-y-6 shadow-[0_4px_24px_-4px_rgba(34,50,38,0.04)] dark:shadow-[0_8px_32px_-4px_rgba(5,8,6,0.5)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DCCE]/60 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 border border-[#2C5E3B]/20 flex items-center justify-center text-[#2C5E3B] dark:text-[#A9CBA2]">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[#1E3F27] dark:text-[#EAE5D9] tracking-tight">
                            Retail Loss Prevention & POS Security
                        </h3>
                        <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83]">
                            Manage Supervisor PIN overrides, Blind Drawer count, and anti-fraud thresholds.
                        </p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-[#2C5E3B]/20 text-emerald-800 dark:text-[#A9CBA2] border border-emerald-200 dark:border-emerald-950/30 rounded-full text-xs font-black uppercase tracking-wider">
                    Loss Prevention Active
                </span>
            </div>

            {/* Manager PIN Setup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <KeyRound size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                            Manager Override PIN
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="text-xs text-stone-500 hover:text-[#2C5E3B] dark:hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                        >
                            {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showPin ? 'Hide' : 'Reveal'}
                        </button>
                    </div>
                    <p className="text-[11px] text-[#4D6E56] dark:text-gray-400 leading-relaxed">
                        4-digit authorization PIN used for approving cash refunds, shift variances, and high-value barcode mappings.
                    </p>
                    <input
                        type={showPin ? "text" : "password"}
                        maxLength={8}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="1234"
                        className="w-full bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-3 font-mono text-lg font-black text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors"
                    />
                </div>

                {/* High Value Barcode Lock Threshold */}
                <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 space-y-3">
                    <label className="text-xs font-black text-[#1E3F27] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <ScanLine size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                        High-Value Barcode Anomaly Lock
                    </label>
                    <p className="text-[11px] text-[#4D6E56] dark:text-gray-400 leading-relaxed">
                        Items priced at or above this amount require mandatory live camera proof and Supervisor PIN before barcode mapping.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-500">{CURRENCY_SYMBOL}</span>
                        <input
                            type="number"
                            min="100"
                            step="100"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            placeholder="3000"
                            className="flex-1 bg-white dark:bg-black/40 border border-[#E2DCCE] dark:border-white/10 rounded-xl px-4 py-3 font-mono text-base font-black text-[#1E3F27] dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Policy Toggles */}
            <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-wider">
                    Anti-Fraud Enforcements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => setBlindClose(!blindClose)}
                        className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-[#2C5E3B]/30 transition-all"
                    >
                        <div className="pr-4 space-y-0.5">
                            <p className="text-xs font-black text-[#1E3F27] dark:text-white">Enforce Blind Shift Close</p>
                            <p className="text-[11px] text-stone-500 dark:text-gray-400">Conceal expected cash tallies in POS to eliminate drawer skimming.</p>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-all ${blindClose ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${blindClose ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div
                        onClick={() => setRequireRefundPin(!requireRefundPin)}
                        className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-black/20 border border-[#E2DCCE] dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-[#2C5E3B]/30 transition-all"
                    >
                        <div className="pr-4 space-y-0.5">
                            <p className="text-xs font-black text-[#1E3F27] dark:text-white">Require PIN on Cash Refunds</p>
                            <p className="text-[11px] text-stone-500 dark:text-gray-400">Prevent phantom returns by requiring supervisor authorization.</p>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-all ${requireRefundPin ? 'bg-[#2C5E3B]' : 'bg-stone-300 dark:bg-stone-700'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${requireRefundPin ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Action */}
            <div className="flex justify-end pt-4 border-t border-[#E2DCCE]/60 dark:border-white/10">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gradient-to-r from-[#224429] to-[#2C5E3B] text-white font-bold rounded-xl flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
                >
                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    Save Security Policies
                </button>
            </div>
        </div>
    );
};
