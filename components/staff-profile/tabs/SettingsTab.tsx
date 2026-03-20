import React from 'react';
import { Key, User, Shield, MapPin } from 'lucide-react';
import { Employee } from '../../../types';

interface SettingsTabProps {
    employee: Employee;
    sites: any[];
    currentPasswordInput: string;
    setCurrentPasswordInput: (value: string) => void;
    newPasswordInput: string;
    setNewPasswordInput: (value: string) => void;
    confirmPasswordInput: string;
    setConfirmPasswordInput: (value: string) => void;
    isChangingPassword: boolean;
    handleUpdatePassword: () => void;
}

export default function SettingsTab({
    employee,
    sites,
    currentPasswordInput,
    setCurrentPasswordInput,
    newPasswordInput,
    setNewPasswordInput,
    confirmPasswordInput,
    setConfirmPasswordInput,
    isChangingPassword,
    handleUpdatePassword
}: SettingsTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Security Section */}
                <div className="bg-gray-50 dark:bg-black/30 p-8 rounded-2xl border border-gray-200 dark:border-white/5">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <Key size={18} />
                        </div>
                        Security & Access
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block px-1">Current Password</label>
                            <input
                                type="password"
                                value={currentPasswordInput}
                                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-yellow-400 transition-colors placeholder:text-gray-400"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block px-1">New Password</label>
                            <input
                                type="password"
                                value={newPasswordInput}
                                onChange={(e) => setNewPasswordInput(e.target.value)}
                                placeholder="Minimum 6 characters"
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-yellow-400 transition-colors placeholder:text-gray-400"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block px-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPasswordInput}
                                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                                placeholder="Confirm your new password"
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-yellow-400 transition-colors placeholder:text-gray-400"
                            />
                        </div>

                        <button
                            onClick={handleUpdatePassword}
                            disabled={isChangingPassword || !newPasswordInput || newPasswordInput !== confirmPasswordInput}
                            className="w-full mt-4 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-30 border border-yellow-500/20 shadow-lg shadow-yellow-400/20"
                        >
                            {isChangingPassword ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>Update Password</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Account Info Section */}
                <div className="bg-gray-50 dark:bg-black/30 p-8 rounded-2xl border border-gray-200 dark:border-white/5">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-cyber-primary/20 rounded-lg text-cyber-primary">
                            <User size={18} />
                        </div>
                        Account Information
                    </h4>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Employee ID</p>
                                <p className="text-gray-900 dark:text-white font-mono text-sm">{employee.code || 'EMP-' + employee.id.substring(0, 5).toUpperCase()}</p>
                            </div>
                            <div className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">Personnel Code</div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Access Role</p>
                                <p className="text-gray-900 dark:text-white font-bold">{employee.role}</p>
                            </div>
                            <Shield size={16} className="text-cyber-primary" />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Primary Site</p>
                                <p className="text-gray-900 dark:text-white font-bold">{sites.find(s => s.id === employee.siteId || s.id === employee.site_id)?.name || 'HQ'}</p>
                            </div>
                            <MapPin size={16} className="text-cyber-primary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
