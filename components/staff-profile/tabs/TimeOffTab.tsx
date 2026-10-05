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
            <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] dark:bg-black/30 rounded-xl border border-[#E2DCCE] dark:border-white/10 text-xs">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                    <span className="font-bold text-[#1E3F27] dark:text-[#EAE5D9]">
                        Statutory Labor Policy ({statutoryConfig.countryCode})
                    </span>
                </div>
                <span className="font-mono text-stone-500 font-medium text-[11px]">
                    Statutory Baseline: {TOTAL_ANNUAL}d Annual • {TOTAL_SICK}d Medical • 4-Eyes Dual Control
                </span>
            </div>

            {/* Leave Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black uppercase tracking-wider text-[#1E3F27] dark:text-[#EAE5D9]">
                            Annual Vacation Leave
                        </span>
                        <span className="text-xs text-stone-500 font-mono font-bold">
                            {remainingAnnual} of {TOTAL_ANNUAL} Days Left
                        </span>
                    </div>
                    <div className="w-full h-3 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#2C5E3B] transition-all rounded-full"
                            style={{ width: `${Math.min(100, (remainingAnnual / TOTAL_ANNUAL) * 100)}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-2 font-medium">
                        {usedAnnual} days taken this calendar year
                    </p>
                </div>

                <div className="p-6 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black uppercase tracking-wider text-[#1E3F27] dark:text-[#EAE5D9]">
                            Medical & Sick Leave
                        </span>
                        <span className="text-xs text-stone-500 font-mono font-bold">
                            {remainingSick} of {TOTAL_SICK} Days Left
                        </span>
                    </div>
                    <div className="w-full h-3 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-500 transition-all rounded-full"
                            style={{ width: `${Math.min(100, (remainingSick / TOTAL_SICK) * 100)}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-2 font-medium">
                        {usedSick} days medical leave taken
                    </p>
                </div>
            </div>

            {/* Leave Requests Header & Action */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h4 className="text-sm font-black text-[#1E3F27] dark:text-[#EAE5D9] uppercase tracking-wider">
                        Leave & Time-Off History
                    </h4>
                    <p className="text-xs text-stone-500">
                        Formal leave applications, medical time-off, and status
                    </p>
                </div>

                {(isOwnProfile || canManageEmployees) && (
                    <button
                        onClick={onRequestTimeOff}
                        className="woody-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                        <Plus size={15} />
                        <span>Request Time Off</span>
                    </button>
                )}
            </div>

            {/* Leave Requests List */}
            {leaveRequests.length === 0 ? (
                <div className="text-center py-12 bg-[#FAF8F5] dark:bg-black/20 rounded-2xl border border-dashed border-[#E2DCCE] dark:border-white/10 space-y-2">
                    <Calendar size={36} className="mx-auto text-stone-300 dark:text-stone-600" />
                    <p className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9]">
                        No Leave Requests Submitted
                    </p>
                    <p className="text-xs text-stone-400">
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
                            Approved: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
                            Pending: 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
                            Rejected: 'bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300 border-red-200 dark:border-red-800/40'
                        }[status as 'Approved' | 'Pending' | 'Rejected'] || 'bg-stone-50 text-stone-700 border-stone-200';

                        return (
                            <div
                                key={req.id}
                                className="p-4 bg-[#FAF8F5] dark:bg-black/30 rounded-2xl border border-[#E2DCCE] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-[#2C5E3B] dark:text-[#A9CBA2] mt-0.5">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9]">
                                                {type}
                                            </h5>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${statusColors}`}>
                                                {status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                                            {startDate} to {endDate} ({days} {days === 1 ? 'day' : 'days'})
                                        </p>
                                        {reason && (
                                            <p className="text-xs text-stone-500 italic mt-1">
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
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => onApproveRequest(req.id)}
                                            className="woody-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
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
