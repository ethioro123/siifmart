import React from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import Modal from '../../ui/Modal';
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
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                    Set a new secure password for <span className="text-gray-900 dark:text-white font-bold">{employee.name}</span>. The user will be notified.
                </p>
                <div className="relative mb-6">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type={showResetPassword ? "text" : "password"}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-10 py-3 text-gray-900 dark:text-white focus:border-cyber-primary outline-none font-mono placeholder:text-gray-400"
                        placeholder="New Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                        {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 font-bold text-xs uppercase">Cancel</button>
                    <button
                        onClick={handleConfirmResetPassword}
                        disabled={isResetting}
                        className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black rounded-lg text-xs uppercase tracking-widest transition-all"
                    >
                        {isResetting ? 'Processing...' : 'Reset Password'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
