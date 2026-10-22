import React, { useState } from 'react';
import {
    ShieldCheck,
    AlertTriangle,
    Eye,
    Fingerprint,
    FileSearch,
    Download,
    Shield,
    Clock
} from 'lucide-react';
import { useFinance } from '../FinanceContext';

interface InternalAuditDeskProps {
    currencySymbol: string;
}

export const InternalAuditDesk: React.FC<InternalAuditDeskProps> = ({
    currencySymbol
}) => {
    const { user, addNotification } = useFinance();
    const isAuditor = user?.role === 'auditor';
    const isManager = Boolean(user?.role && ['head_of_audit', 'auditor', 'head_of_finance', 'country_managing_director', 'admin', 'super_admin', 'CEO', 'ceo'].includes(user.role));

    const [inquiryDispatched, setInquiryDispatched] = useState(false);

    const handleIssueInquiry = () => {
        setInquiryDispatched(true);
        addNotification?.('info', 'Formal audit inquiry logged on Shift #REC-0042 drawer shortage for store supervisor response.');
    };

    return (
        <div className="space-y-5 animate-in fade-in">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            Zero-Trust Internal Audit &amp; Velocity Sentinel
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Surfaces supervisory override velocities exceeding 3%, soft-voided transactions, and drawer variance patterns.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-semibold font-mono">
                        ZERO-TRUST AUDIT LOGS
                    </span>
                    {isAuditor ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[11px] font-semibold">
                            <Eye size={12} />
                            <span>Independent Auditor • Surveillance</span>
                        </span>
                    ) : isManager ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-semibold">
                            <Shield size={12} />
                            <span>Supervisory Review • Audit Target</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 text-[11px] font-semibold">
                            <Clock size={12} />
                            <span>Staff Telemetry Stream</span>
                        </span>
                    )}
                </div>
            </div>

            {/* 3 Metric KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Supervisory Override Velocity
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                        1.4%
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
                        Within zero-trust threshold (&le; 3%)
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Voided Expenses This Quarter
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-purple-600 dark:text-purple-400 mt-1">
                        4 Records
                    </div>
                    <span className="text-[11px] text-[var(--theme-text-secondary)] mt-1 block">
                        All with authenticated reason codes
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)]">
                    <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] uppercase tracking-wider block">
                        Unresolved Shift Variances
                    </span>
                    <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                        {inquiryDispatched ? '0 Pending Inquiries' : '1 Shift'}
                    </div>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
                        {inquiryDispatched ? 'Formal inquiry registered for supervisor' : 'Flagged for CCTV co-inspection'}
                    </span>
                </div>
            </div>

            {/* Audit Log Sentinel Feed */}
            <div className="rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            High-Risk Supervisory Override Event Stream
                        </h5>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Real-time zero-trust capture of dual authorizations, drawer kicks, and margin floor overrides.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {isAuditor && !inquiryDispatched && (
                            <button
                                type="button"
                                onClick={handleIssueInquiry}
                                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                                <Eye size={13} />
                                Issue Audit Inquiry
                            </button>
                        )}

                        <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-border)] text-xs font-medium text-[var(--theme-text-primary)] border border-[var(--theme-border)] transition-all flex items-center gap-1.5"
                        >
                            <Download size={13} /> Export Forensic Log
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-[var(--theme-border)] text-xs">
                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <AlertTriangle size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Drawer Cash Variance Co-Attribution (Shift #REC-0042)
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Variance of -{currencySymbol} 450 co-signed by Manager (MGR-02) • Reason: Till shortage under review
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {inquiryDispatched && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                    AUDIT INQUIRY PENDING RESPONSE
                                </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                CCTV REVIEW
                            </span>
                        </div>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Fingerprint size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Promotional Low-Margin Floor Clearance
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Finance Director OTP authorized promotional markdown on Organic Honey 500g (Rule 2)
                                </span>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            AUTHENTICATED
                        </span>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-[var(--theme-bg-subtle)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <FileSearch size={16} />
                            </div>
                            <div>
                                <span className="font-semibold text-[var(--theme-text-primary)] block">
                                    Voucher Nullification Audit (EXP-0081)
                                </span>
                                <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                    Voided expense #{currencySymbol} 3,200 with maker-checker audit trail preserved
                                </span>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            IMMUTABLE
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternalAuditDesk;
