import React from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import Modal from '../../Modal';
import { Employee } from '../../../types';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
    showResetPassword: boolean;
    setShowResetPassword: (val: boolean) => void;
    passwordInput: string;
    setPasswordInput: (val: string) => void;
    handleConfirmResetPassword: () => void;
    isResetting: boolean;
}

export default function ResetPasswordModal({
    isOpen,
    onClose,
    employee,
    showResetPassword,
    setShowResetPassword,
    passwordInput,
    setPasswordInput,
    handleConfirmResetPassword,
    isResetting
}: ResetPasswordModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reset Security Credentials" size="sm">
            <div className="p-6">
                <p className="text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] mb-4 text-sm">
                    Set a new secure password for <span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">{employee.name}</span>. The user will be notified.
                </p>
                <div className="relative mb-6">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)]" size={16} />
                    <input
                        type={showResetPassword ? "text" : "password"}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        autoComplete="new-password"
                        className="w-full bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_50%,transparent)] border border-[var(--theme-border-subtle)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-xl pl-10 pr-10 py-3 text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] focus:border-[var(--theme-border)] border-[var(--theme-status-success-border)] outline-none font-mono placeholder:text-[var(--theme-text-muted)]"
                        placeholder="New Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-muted)] transition-colors"
                    >
                        {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-[var(--theme-text-muted)] font-bold text-xs uppercase">Cancel</button>
                    <button
                        onClick={handleConfirmResetPassword}
                        disabled={isResetting}
                        className="px-6 py-2 bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] font-black rounded-lg text-xs uppercase tracking-widest transition-all"
                    >
                        {isResetting ? 'Processing...' : 'Reset Password'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
