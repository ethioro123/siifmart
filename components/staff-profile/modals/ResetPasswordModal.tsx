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
            <div className="space-y-4">
                <p className="text-[var(--theme-text-secondary)] text-sm">
                    Set a new secure password for <span className="text-[var(--theme-text-primary)] font-bold">{employee.name}</span>.
                </p>
                <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)]" size={16} />
                    <input
                        type={showResetPassword ? "text" : "password"}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        autoComplete="new-password"
                        minLength={12}
                        maxLength={128}
                        className="w-full min-h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl pl-10 pr-10 py-2.5 text-[var(--theme-text-primary)] text-sm focus:border-[var(--theme-accent)] focus:ring-1 focus:ring-[var(--theme-accent)]/20 outline-none font-mono placeholder:text-[var(--theme-text-muted)] transition-all"
                        placeholder="New Secure Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                        aria-label={showResetPassword ? "Hide password" : "Show password"}
                    >
                        {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 px-4 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] font-semibold text-xs transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmResetPassword}
                        disabled={isResetting || !passwordInput.trim()}
                        className="min-h-11 px-5 bg-[var(--theme-status-warning-bg)] hover:bg-[var(--theme-status-warning)]/20 border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] font-semibold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-[0.98]"
                    >
                        {isResetting ? 'Processing...' : 'Reset Password'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
