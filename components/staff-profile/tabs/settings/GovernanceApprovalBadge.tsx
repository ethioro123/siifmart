import React from 'react';
import { Crown, ShieldCheck, Building2, DollarSign, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { GovernanceRuleResult } from '../../../../types/employee-change';

interface GovernanceApprovalBadgeProps {
    isCEO: boolean;
    ruleResult: GovernanceRuleResult;
    hasChanges: boolean;
}

export const GovernanceApprovalBadge: React.FC<GovernanceApprovalBadgeProps> = ({
    isCEO,
    ruleResult,
    hasChanges
}) => {
    if (!hasChanges) return null;

    if (ruleResult.blockedReason) {
        return (
            <div className="p-4 rounded-2xl bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] shadow-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                    <ShieldAlert size={18} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]">
                            Governance Action Blocked
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]">
                            Zero-Trust Enforcement
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                        {ruleResult.blockedReason}
                    </p>
                </div>
            </div>
        );
    }

    if (isCEO) {
        return (
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] flex items-center justify-center shrink-0">
                        <Crown size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                                Sovereign CEO Direct Update
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]">
                                Zero-Approval Bypass
                            </span>
                        </div>
                        <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">
                            As Chief Executive, all profile modifications apply immediately to master records with full audit trail logging.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!ruleResult.requiresApproval) {
        return (
            <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] flex items-center justify-center shrink-0">
                    <CheckIcon size={18} />
                </div>
                <div>
                    <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                        Standard Operational Update
                    </span>
                    <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">
                        These changes only affect non-governed operational contact fields and will apply immediately without departmental approval.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-status-warning-border)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <ShieldAlert size={18} />
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[var(--theme-text-primary)]">
                            Cross-Department Sign-Off Required
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                            Segregation of Duties
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">
                        Under Zero-Trust governance, HR profile alterations to governed fields must be confirmed by the respective department heads:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {ruleResult.requiredApprovers.map((dept, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]"
                            >
                                {dept.includes('Finance') && <DollarSign size={11} className="text-[var(--theme-status-danger-text)]" />}
                                {dept.includes('Logistics') && <Building2 size={11} className="text-[var(--theme-status-info-text)]" />}
                                {dept.includes('Operations') && <Building2 size={11} className="text-[var(--theme-status-warning-text)]" />}
                                {dept.includes('Compliance') && <ShieldCheck size={11} className="text-[var(--theme-accent)]" />}
                                {dept}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CheckIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
