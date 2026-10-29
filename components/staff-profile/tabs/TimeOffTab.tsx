import React, { useMemo } from 'react';
import { Calendar, Plus, Clock, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { LeaveRequest } from '../../../utils/employeeProfileData';
import { getStatutoryLeaveConfig } from '../../../services/leave-requests.service';

interface TimeOffTabProps {
    isOwnProfile: boolean;
    canManageEmployees?: boolean;
    leaveRequests: LeaveRequest[];
    onRequestTimeOff: () => void;
    onApproveRequest?: (requestId: string) => void;
    onRejectRequest?: (requestId: string) => void;
    countryCode?: string;
}

export default function TimeOffTab({
    isOwnProfile,
    canManageEmployees = false,
    leaveRequests,
    onRequestTimeOff,
    onApproveRequest,
    onRejectRequest,
    countryCode = 'ET'
}: TimeOffTabProps) {
    // Statutory Leave Allowances Config-Gated by Sovereign Country
    const statutoryConfig = useMemo(() => getStatutoryLeaveConfig(countryCode), [countryCode]);
    const TOTAL_ANNUAL = statutoryConfig.annualLeaveDays;
    const TOTAL_SICK = statutoryConfig.sickLeaveDays;

    // Calculate used days from approved leaves (supporting both camelCase & snake_case)
    const usedAnnual = useMemo(() => {
        return leaveRequests
            .filter(r => {
                const type = (r as any).leave_type || r.type;
                const status = (r as any).status;
                return (type === 'Annual Leave' || type === 'annual') && status === 'Approved';
            })
            .reduce((sum, r) => sum + ((r as any).days_count ?? r.days ?? 0), 0);
    }, [leaveRequests]);

    const usedSick = useMemo(() => {
        return leaveRequests
            .filter(r => {
                const type = (r as any).leave_type || r.type;
                const status = (r as any).status;
                return (type === 'Sick Leave' || type === 'medical' || type === 'sick') && status === 'Approved';
            })
            .reduce((sum, r) => sum + ((r as any).days_count ?? r.days ?? 0), 0);
    }, [leaveRequests]);

    const remainingAnnual = Math.max(0, TOTAL_ANNUAL - usedAnnual);
    const remainingSick = Math.max(0, TOTAL_SICK - usedSick);

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Statutory Compliance Indicator */}
            <div className="flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] text-xs">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[var(--theme-accent)]" />
                    <span className="font-semibold text-[var(--theme-text-primary)]">
                        Statutory Labor Policy ({statutoryConfig.countryCode})
                    </span>
                </div>
                <span className="font-mono text-[var(--theme-text-secondary)] font-medium text-[11px] tabular-nums">
                    Statutory Baseline: {TOTAL_ANNUAL}d Annual • {TOTAL_SICK}d Medical • 4-Eyes Dual Control
                </span>
            </div>

            {/* Leave Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)]">
                            Annual Vacation Leave
                        </span>
                        <span className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums font-semibold">
                            {remainingAnnual} of {TOTAL_ANNUAL} Days Left
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden border border-[var(--theme-border)]">
                        <div
                            className="h-full bg-[var(--theme-accent)] transition-all rounded-full"
                            style={{ width: `${Math.min(100, (remainingAnnual / TOTAL_ANNUAL) * 100)}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-2 font-medium">
                        {usedAnnual} days taken this calendar year
                    </p>
                </div>

                <div className="p-6 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-xs">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)]">
                            Medical & Sick Leave
                        </span>
                        <span className="text-xs text-[var(--theme-text-secondary)] font-mono tabular-nums font-semibold">
                            {remainingSick} of {TOTAL_SICK} Days Left
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--theme-bg-subtle)] rounded-full overflow-hidden border border-[var(--theme-border)]">
                        <div
                            className="h-full bg-[var(--theme-status-warning-bg)] transition-all rounded-full"
                            style={{ width: `${Math.min(100, (remainingSick / TOTAL_SICK) * 100)}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-2 font-medium">
                        {usedSick} days medical leave taken
                    </p>
                </div>
            </div>

            {/* Leave Requests Header & Action */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h4 className="text-sm font-bold text-[var(--theme-text-primary)] uppercase tracking-wider">
                        Leave & Time-Off History
                    </h4>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                        Formal leave applications, medical time-off, and status
                    </p>
                </div>

                {(isOwnProfile || canManageEmployees) && (
                    <button
                        onClick={onRequestTimeOff}
                        className="h-10 px-4 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-accent)]/90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                        <Plus size={15} />
                        <span>Request Time Off</span>
                    </button>
                )}
            </div>

            {/* Leave Requests List */}
            {leaveRequests.length === 0 ? (
                <div className="text-center py-12 bg-[var(--theme-bg-card)] rounded-2xl border border-dashed border-[var(--theme-border)] space-y-2">
                    <Calendar size={36} className="mx-auto text-[var(--theme-text-muted)]" />
                    <p className="font-semibold text-sm text-[var(--theme-text-primary)]">
                        No Leave Requests Submitted
                    </p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                        Submitted vacation, medical, or personal leave requests will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {leaveRequests.map(req => {
                        const status = (req as any).status || 'Pending';
                        const type = (req as any).leave_type || req.type;
                        const startDate = (req as any).start_date || req.startDate;
                        const endDate = (req as any).end_date || req.endDate;
                        const days = (req as any).days_count ?? req.days ?? 1;
                        const reason = (req as any).reason;

                        const statusColors = {
                            Approved: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
                            Pending: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
                            Rejected: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                        }[status as 'Approved' | 'Pending' | 'Rejected'] || 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]';

                        return (
                            <div
                                key={req.id}
                                className="p-4 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-accent)] mt-0.5">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-semibold text-sm text-[var(--theme-text-primary)]">
                                                {type}
                                            </h5>
                                            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${statusColors}`}>
                                                {status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                            {startDate} to {endDate} ({days} {days === 1 ? 'day' : 'days'})
                                        </p>
                                        {reason && (
                                            <p className="text-xs text-[var(--theme-text-muted)] italic mt-1">
                                                "{reason}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Manager Approval Controls */}
                                {canManageEmployees && status === 'Pending' && onApproveRequest && onRejectRequest && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => onRejectRequest(req.id)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] transition-colors cursor-pointer"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => onApproveRequest(req.id)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--theme-text-primary)] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/90 transition-colors cursor-pointer shadow-xs"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
