import React, { useState } from 'react';
import { ShieldCheck, X, AlertTriangle, KeyRound } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { Employee } from '../../../../types';
import { matchStaffPin } from '../../../../utils/employeeIdGenerator';

interface RecountAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    productSku: string;
    employees: Employee[];
    currentUserId?: string;
    onAuthorize: (supervisorName: string, supervisorRole: string) => void;
}

export const RecountAuthModal: React.FC<RecountAuthModalProps> = ({
    isOpen,
    onClose,
    productName,
    productSku,
    employees,
    currentUserId,
    onAuthorize,
}) => {
    const { t } = useLanguage();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!pin.trim()) {
            setError('Please enter supervisor / second-counter PIN or Employee ID.');
            return;
        }

        // Supervisor / Manager roles allowed for dual-control sign-off
        const allowedRoles = [
            'super_admin',
            'ceo',
            'operations_manager',
            'warehouse_manager',
            'inventory_manager',
            'store_manager',
            'shift_supervisor',
            'inventory_specialist'
        ];

        // Find matching employee
        const verifier = employees.find(emp => {
            const matchesPin = matchStaffPin(emp.code || emp.id, pin) || pin === emp.code || pin === emp.id;
            const isDifferentUser = emp.id !== currentUserId && emp.name !== currentUserId;
            const hasRole = allowedRoles.includes((emp.role || '').toLowerCase());
            return matchesPin && isDifferentUser && hasRole;
        });

        if (verifier) {
            onAuthorize(verifier.name, verifier.role || 'Supervisor');
            onClose();
        } else {
            // Check if supervisor matched but was the same counter
            const sameUser = employees.find(emp => matchStaffPin(emp.code || emp.id, pin) && (emp.id === currentUserId || emp.name === currentUserId));
            if (sameUser) {
                setError('Dual-control violation: Second counter must be a different authorized staff member.');
            } else {
                setError('Invalid supervisor/second-counter credentials. Authorized supervisor PIN required.');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--theme-text-primary)] text-sm">Dual-Control Recount Authorization</h3>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase tracking-wider font-mono">4-Eyes Verification Required</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-xs">
                    <p className="font-semibold text-[var(--theme-text-primary)]">{productName}</p>
                    <p className="text-[11px] font-mono tabular-nums text-[var(--theme-text-secondary)] mt-0.5">SKU: {productSku}</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--theme-text-primary)] mb-1.5 flex items-center gap-1.5">
                            <KeyRound size={14} className="text-[var(--theme-accent)]" /> Supervisor / Second-Counter PIN or ID
                        </label>
                        <input
                            type="password"
                            autoFocus
                            placeholder="Enter 4-digit PIN or Employee ID..."
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] focus:border-[var(--theme-accent)] rounded-xl text-center font-mono tabular-nums tracking-widest text-lg py-3 px-4 text-[var(--theme-text-primary)] outline-none min-h-[48px] transition-colors"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] min-h-[44px] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-[var(--theme-accent)] hover:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] shadow-sm transition-opacity"
                        >
                            <ShieldCheck size={16} />
                            <span>Authorize Recount</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecountAuthModal;
