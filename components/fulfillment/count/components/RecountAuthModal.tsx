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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#FAF8F5] dark:bg-[#1C2620] border border-[#E2DCCE] dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2DCCE]/60 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Dual-Control Recount Authorization</h3>
                            <p className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">4-Eyes Verification Required</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-white" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-3 bg-stone-100 dark:bg-black/20 rounded-xl border border-stone-200 dark:border-white/5 text-xs text-stone-600 dark:text-stone-300">
                    <p className="font-semibold text-stone-900 dark:text-white">{productName}</p>
                    <p className="text-[10px] font-mono text-stone-500">SKU: {productSku}</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                            <KeyRound size={14} /> Supervisor / Second-Counter PIN or ID
                        </label>
                        <input
                            type="password"
                            autoFocus
                            placeholder="Enter 4-digit PIN or Employee ID..."
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="woody-input w-full text-center font-mono tracking-widest text-lg py-2.5"
                        />
                    </div>

                    {error && (
                        <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="woody-btn-secondary flex-1 py-2.5 text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="woody-btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                        >
                            <ShieldCheck size={16} /> Authorize Recount
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
