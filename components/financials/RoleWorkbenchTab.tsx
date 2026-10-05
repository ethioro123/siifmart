import React, { useState } from 'react';
import { ShieldCheck, FileCheck, UserX, DollarSign } from 'lucide-react';
import { useFinance } from './FinanceContext';

export const RoleWorkbenchTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry } = useFinance();
    const userRole = user?.role || 'finance_manager';

    const defaultWorkbench =
        userRole === 'treasury_officer' ? 'treasury' :
        userRole === 'tax_compliance_officer' ? 'tax' :
        userRole === 'credit_control_officer' ? 'credit' :
        userRole === 'auditor' ? 'audit' : 'treasury';

    const [activeWorkbench, setActiveWorkbench] = useState<'treasury' | 'tax' | 'credit' | 'audit'>(defaultWorkbench);

    // Shared stat card styling
    const statCard = 'p-3 bg-stone-100/80 dark:bg-black/40 border border-[#E2DCCE] dark:border-white/5 rounded-xl';

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Workbench Selector */}
            <div className="flex gap-2 border-b border-[#E2DCCE] dark:border-white/5 pb-3 overflow-x-auto">
                <button
                    onClick={() => setActiveWorkbench('treasury')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeWorkbench === 'treasury'
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                            : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white bg-stone-100/60 dark:bg-white/5'
                    }`}
                >
                    <DollarSign size={14} /> Treasury Officer Desk
                </button>
                <button
                    onClick={() => setActiveWorkbench('tax')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeWorkbench === 'tax'
                            ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                            : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white bg-stone-100/60 dark:bg-white/5'
                    }`}
                >
                    <FileCheck size={14} /> Tax Compliance Desk
                </button>
                <button
                    onClick={() => setActiveWorkbench('credit')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeWorkbench === 'credit'
                            ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                            : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white bg-stone-100/60 dark:bg-white/5'
                    }`}
                >
                    <UserX size={14} /> Credit Control Desk
                </button>
                <button
                    onClick={() => setActiveWorkbench('audit')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeWorkbench === 'audit'
                            ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                            : 'text-stone-500 dark:text-gray-400 hover:text-[#1E3F27] dark:hover:text-white bg-stone-100/60 dark:bg-white/5'
                    }`}
                >
                    <ShieldCheck size={14} /> Internal Audit Desk
                </button>
            </div>

            {/* 1. Treasury Desk */}
            {activeWorkbench === 'treasury' && (
                <div className="space-y-4">
                    <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-2 flex items-center gap-2">
                            <DollarSign className="text-emerald-600 dark:text-emerald-400" size={16} />
                            Daily Cash Sweeps &amp; Electronic Settlement Reconciliation
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-gray-400 mb-4">
                            Consolidated view of branch vaults, Telebirr/M-Pesa digital float sweeps, and commercial bank deposits.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Vault Cash Balance</span>
                                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                                    {currencySymbol} 485,000
                                </span>
                                <span className="text-[10px] text-stone-400 dark:text-gray-500 mt-1 block">Across 8 retail store vaults</span>
                            </div>
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Pending Float Replenishments</span>
                                <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                                    {currencySymbol} 25,000
                                </span>
                                <span className="text-[10px] text-stone-400 dark:text-gray-500 mt-1 block">2 branch requests pending</span>
                            </div>
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Gateway Settlement Status</span>
                                <span className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">99.8% Matched</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">Zero anomalous leakage detected</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Tax Compliance Desk */}
            {activeWorkbench === 'tax' && (
                <div className="space-y-4">
                    <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-2 flex items-center gap-2">
                            <FileCheck className="text-blue-600 dark:text-blue-400" size={16} />
                            Sovereign Fiscal Authority Filing Desk ({effectiveCountry === 'ET' ? 'ERCA Form 21' : 'KRA iTax VAT'})
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-gray-400 mb-4">
                            Monthly VAT return liability, input tax credit verification from registered POs, and withholding tax certificates.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Output VAT Collected</span>
                                <span className="text-lg font-bold font-mono text-[#1E3F27] dark:text-white mt-1 block">
                                    {currencySymbol} 142,500
                                </span>
                                <span className="text-[10px] text-stone-400 dark:text-gray-500 mt-1 block">POS sales standard rate</span>
                            </div>
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Input VAT Tax Credits</span>
                                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                                    {currencySymbol} 68,200
                                </span>
                                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">Verified supplier receipts</span>
                            </div>
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Net Tax Payable</span>
                                <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                                    {currencySymbol} 74,300
                                </span>
                                <span className="text-[10px] text-stone-400 dark:text-gray-500 mt-1 block">Filing due on 20th</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Credit Control Desk */}
            {activeWorkbench === 'credit' && (
                <div className="space-y-4">
                    <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-2 flex items-center gap-2">
                            <UserX className="text-amber-600 dark:text-amber-400" size={16} />
                            B2B Credit Limits &amp; Collections Risk Workbench
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-gray-400 mb-4">
                            Monitors wholesale customer credit ceilings, payment velocity, and enforces automated orders lock on breach.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Accounts on Credit Hold</span>
                                <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 block">3 Accounts</span>
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 block">Overdue &gt; 60 days</span>
                            </div>
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Near-Limit Accounts (&gt;85%)</span>
                                <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">5 Accounts</span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-300 mt-1 block">Credit warning dispatched</span>
                            </div>
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Average Collection Days (DSO)</span>
                                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">26 Days</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">Target: &le; 30 Days</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Internal Audit Desk */}
            {activeWorkbench === 'audit' && (
                <div className="space-y-4">
                    <div className="bg-white/90 dark:bg-stone-900/60 border border-[#E2DCCE] dark:border-white/5 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-[#1E3F27] dark:text-white mb-2 flex items-center gap-2">
                            <ShieldCheck className="text-purple-600 dark:text-purple-400" size={16} />
                            Zero-Trust Internal Audit &amp; Velocity Sentinel
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-gray-400 mb-4">
                            Surfaces supervisory override velocities exceeding 3%, soft-voided transactions, and drawer variance patterns.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Supervisory Override Velocity</span>
                                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">1.4%</span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">Within zero-trust threshold (&le; 3%)</span>
                            </div>
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Voided Expenses This Quarter</span>
                                <span className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 block">4 Records</span>
                                <span className="text-[10px] text-stone-400 dark:text-gray-500 mt-1 block">All with authenticated reason codes</span>
                            </div>
                            <div className={statCard}>
                                <span className="text-stone-500 dark:text-gray-400 block">Unresolved Drawer Discrepancies</span>
                                <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">1 Shift</span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-300 mt-1 block">Flagged for CCTV co-inspection</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleWorkbenchTab;
