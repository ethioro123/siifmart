import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, ArrowRight, Loader2, User, Building2, DollarSign, AlertCircle, Clock } from 'lucide-react';
import Modal from '../../Modal';
import { EmployeeProfileChangeRequest } from '../../../types/employee-change';
import { employeeChangesService } from '../../../services/employee-changes.service';
import { canApproveChangeRequest, isSovereignCEO } from '../../../utils/employeeGovernance';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';

interface EmployeeChangeApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRequestsUpdated?: () => void;
}

export const EmployeeChangeApprovalModal: React.FC<EmployeeChangeApprovalModalProps> = ({
    isOpen,
    onClose,
    onRequestsUpdated
}) => {
    const { user } = useStore();
    const { effectiveCountry, employees, updateEmployee, addNotification } = useData();

    const [requests, setRequests] = useState<EmployeeProfileChangeRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

    const isCEO = isSovereignCEO(user?.role);

    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const data = await employeeChangesService.getAll(undefined, effectiveCountry);
            setRequests(data);
        } catch (err) {
            console.error('Failed to load employee change requests:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadRequests();
        }
    }, [isOpen, effectiveCountry]);

    const handleApprove = async (req: EmployeeProfileChangeRequest) => {
        setActionId(req.id);
        try {
            const updated = await employeeChangesService.approve(
                req.id,
                user?.name || (isCEO ? 'CEO Executive' : 'Authorized Approver'),
                user?.role || 'admin',
                'Approved via Cross-Department Governance Portal'
            );

            // Update employee through DataContext
            const targetEmp = employees.find(e => e.id === req.employeeId);
            if (targetEmp && updateEmployee) {
                await updateEmployee({
                    ...targetEmp,
                    ...req.fullProposedEmployee
                } as any, user?.name || 'Approver');
            }

            setRequests(prev => prev.map(r => r.id === req.id ? updated : r));
            addNotification('success', `Approved: Profile changes applied to ${req.employeeName}`);
            onRequestsUpdated?.();
        } catch (err: any) {
            addNotification('alert', `Approval failed: ${err.message || 'Unknown error'}`);
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (req: EmployeeProfileChangeRequest) => {
        if (!rejectionReason.trim()) return;
        setActionId(req.id);
        try {
            const updated = await employeeChangesService.reject(
                req.id,
                user?.name || 'Authorized Approver',
                rejectionReason.trim()
            );

            setRequests(prev => prev.map(r => r.id === req.id ? updated : r));
            setRejectionModalId(null);
            setRejectionReason('');
            addNotification('info', `Rejected change request for ${req.employeeName}`);
            onRequestsUpdated?.();
        } catch (err: any) {
            addNotification('alert', `Rejection failed: ${err.message || 'Unknown error'}`);
        } finally {
            setActionId(null);
        }
    };

    const filteredRequests = requests.filter(r => r.status === filterStatus);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Employee Governance & Cross-Department Approvals" size="xl">
            <div className="space-y-5 p-2">
                {/* Header overview */}
                <div className="p-4 rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--theme-text-primary)]">
                                Segregation of Duties (SoD) Authorization Ledger
                            </span>
                            {isCEO && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    CEO Universal Sign-Off
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">
                            Cross-department sign-offs for HR modifications affecting identity, compensation, and organizational transfers ({effectiveCountry}).
                        </p>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl p-1 shrink-0">
                        {(['pending', 'approved', 'rejected'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                                    filterStatus === status
                                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]'
                                        : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List of Requests */}
                {isLoading ? (
                    <div className="py-12 flex justify-center items-center">
                        <Loader2 className="animate-spin text-[var(--theme-text-muted)]" size={24} />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[var(--theme-text-muted)] bg-[var(--theme-bg-panel)] rounded-2xl border border-[var(--theme-border)]">
                        No {filterStatus} change requests found for {effectiveCountry}.
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        {filteredRequests.map(req => {
                            const targetEmp = employees.find(e => e.id === req.employeeId);
                            const targetRegion = targetEmp?.regionCode || targetEmp?.region_code;
                            const userRegion = user?.regionCode || user?.region_code;
                            const userCanApprove = isCEO || req.requiredApprovers.some(auth => 
                                canApproveChangeRequest(user?.role || '', auth, {
                                    userRegionCode: userRegion,
                                    targetRegionCode: targetRegion
                                })
                            );
                            const isBusy = actionId === req.id;

                            return (
                                <div 
                                    key={req.id} 
                                    className="p-4 rounded-2xl bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] space-y-3"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-2.5">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                                                    {req.employeeName}
                                                </h4>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                                    {req.countryCode}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-[var(--theme-text-muted)] flex items-center gap-1.5 mt-0.5">
                                                <Clock size={11} />
                                                Requested by {req.requestedBy} ({req.requestedByRole}) on {new Date(req.requestedAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-1">
                                            {req.requiredApprovers.map((dept, i) => (
                                                <span 
                                                    key={i} 
                                                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]"
                                                >
                                                    {dept}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Operational Justification */}
                                    <div className="text-xs bg-[var(--theme-bg-card)] p-2.5 rounded-xl border border-[var(--theme-border)]">
                                        <span className="text-[10px] font-bold uppercase text-[var(--theme-text-muted)] block mb-0.5">
                                            Operational Reason
                                        </span>
                                        <p className="text-[var(--theme-text-primary)] italic">"{req.reason}"</p>
                                    </div>

                                    {/* Diffs Table */}
                                    <div className="border border-[var(--theme-border)] rounded-xl overflow-hidden divide-y divide-[var(--theme-border)] bg-[var(--theme-bg-card)]">
                                        {req.diffs.map((diff, idx) => (
                                            <div key={idx} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[var(--theme-text-primary)]">{diff.label}</span>
                                                    <span className="text-[10px] text-[var(--theme-text-muted)]">({diff.approvingDepartment})</span>
                                                </div>
                                                <div className="flex items-center gap-2 font-mono text-[11px]">
                                                    <span className="text-[var(--theme-text-muted)] line-through">
                                                        {String(diff.oldValue || 'None')}
                                                    </span>
                                                    <ArrowRight size={11} className="text-[var(--theme-text-muted)]" />
                                                    <span className="text-emerald-500 font-bold">
                                                        {String(diff.newValue || 'None')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Status or Action Footer */}
                                    {req.status === 'pending' ? (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                            <div className="text-[11px] text-[var(--theme-text-muted)]">
                                                {userCanApprove ? (
                                                    <span className="text-emerald-500 font-bold">✓ Authorized to approve this request</span>
                                                ) : (
                                                    <span>Requires sign-off from {req.requiredApprovers.join(', ')}</span>
                                                )}
                                            </div>

                                            {userCanApprove && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setRejectionModalId(req.id)}
                                                        disabled={isBusy}
                                                        className="px-3 py-1.5 rounded-lg border border-[var(--theme-border)] hover:bg-[var(--theme-bg-card)] text-rose-500 font-bold text-xs transition-colors cursor-pointer"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(req)}
                                                        disabled={isBusy}
                                                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-40"
                                                    >
                                                        {isBusy ? (
                                                            <Loader2 size={13} className="animate-spin" />
                                                        ) : (
                                                            <><Check size={14} /> Approve & Apply</>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-[var(--theme-text-muted)] flex items-center justify-between pt-1">
                                            <span>Status: <strong className="capitalize">{req.status}</strong></span>
                                            {req.approvedBy && (
                                                <span>Signed off by: {req.approvedBy} ({req.approvedByRole})</span>
                                            )}
                                            {req.rejectedBy && (
                                                <span>Rejected by: {req.rejectedBy} — Reason: "{req.rejectionReason}"</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Rejection input dropdown */}
                                    {rejectionModalId === req.id && (
                                        <div className="p-3 bg-[var(--theme-bg-card)] rounded-xl border border-rose-500/20 space-y-2 animate-in fade-in">
                                            <label className="text-[10px] font-bold uppercase text-rose-500 block">
                                                Reason for Rejection <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="State why this change was denied..."
                                                className="w-full bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--theme-text-primary)] outline-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setRejectionModalId(null)}
                                                    className="px-3 py-1 rounded-lg text-xs font-bold text-[var(--theme-text-secondary)]"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req)}
                                                    disabled={!rejectionReason.trim() || isBusy}
                                                    className="px-3 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold"
                                                >
                                                    Confirm Rejection
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
};
