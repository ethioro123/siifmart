import React from 'react';
import { Key, Loader2, Check } from 'lucide-react';

interface ProfileSecurityCardProps {
    currentPasswordInput: string;
    setCurrentPasswordInput: (val: string) => void;
    newPasswordInput: string;
    setNewPasswordInput: (val: string) => void;
    confirmPasswordInput: string;
    setConfirmPasswordInput: (val: string) => void;
    isChangingPassword: boolean;
    handleUpdatePassword: () => void;
}

export const ProfileSecurityCard: React.FC<ProfileSecurityCardProps> = ({
    currentPasswordInput,
    setCurrentPasswordInput,
    newPasswordInput,
    setNewPasswordInput,
    confirmPasswordInput,
    setConfirmPasswordInput,
    isChangingPassword,
    handleUpdatePassword
}) => {
    const inputClasses = "w-full bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-primary)] transition-colors";
    const labelClasses = "text-[10px] text-[var(--theme-text-muted)] font-black uppercase tracking-wider mb-1 block px-1";

    const canSubmit = !isChangingPassword && !!newPasswordInput && newPasswordInput.length >= 6 && newPasswordInput === confirmPasswordInput;

    return (
        <div className="bg-[var(--theme-bg-card)] p-6 rounded-2xl border border-[var(--theme-border)] space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[var(--theme-border)] pb-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Key size={18} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                        Authentication & Security Credentials
                    </h4>
                    <p className="text-[11px] text-[var(--theme-text-muted)]">
                        Update session login password and cryptographic credentials.
                    </p>
                </div>
            </div>

            <div className="space-y-3.5">
                <div>
                    <label className={labelClasses}>Current Password</label>
                    <input
                        type="password"
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className={inputClasses}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                        <label className={labelClasses}>New Password</label>
                        <input
                            type="password"
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            autoComplete="new-password"
                            placeholder="Min. 6 characters"
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPasswordInput}
                            onChange={(e) => setConfirmPasswordInput(e.target.value)}
                            autoComplete="new-password"
                            placeholder="Repeat password"
                            className={inputClasses}
                        />
                    </div>
                </div>

                <button
                    onClick={handleUpdatePassword}
                    disabled={!canSubmit}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-[var(--theme-primary)] text-white hover:opacity-95 font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                >
                    {isChangingPassword ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <>Update Password Credentials</>
                    )}
                </button>
            </div>
        </div>
    );
};
