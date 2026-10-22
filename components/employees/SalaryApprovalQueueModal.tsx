import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck, UserCheck, ArrowRight, Loader2, History, Filter } from 'lucide-react';
import Modal from '../Modal';
import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { salaryRequestsService } from '../../services/salary-requests.service';
import type { SalaryChangeRequest } from '../../types';

interface SalaryApprovalQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRequestsUpdated?: () => void;
}

export default function SalaryApprovalQueueModal({
    isOpen,
    onClose,
    onRequestsUpdated
}: SalaryApprovalQueueModalProps) {
    const { user } = useStore();
    const { activeSite, effectiveCountry, addNotification } = useData();

    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [requests, setRequests] = useState<SalaryChangeRequest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [pendingCount, setPendingCount] = useState<number>(0);
    const PAGE_SIZE = 25;

    // Reject state
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [rejectError, setRejectError] = useState<string>('');

    const country = (effectiveCountry || 'ET').toUpperCase();
    const canApprove = ['group_ceo', 'country_managing_director', 'country_finance_director', 'cfo'].includes(user?.role || '');

    const loadRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const offset = (page - 1) * PAGE_SIZE;
            const fetchLimit = PAGE_SIZE + 1;
            const data = activeTab === 'pending'
                ? await salaryRequestsService.getPending(undefined, country, fetchLimit, offset)
                : await salaryRequestsService.getHistory(undefined, country, fetchLimit, offset);

            if (data.length > PAGE_SIZE) {
                setHasMore(true);
                setRequests(data.slice(0, PAGE_SIZE));
            } else {
                setHasMore(false);
                setRequests(data);
            }

            const pendingList = await salaryRequestsService.getPending(undefined, country, 100, 0);
            setPendingCount(pendingList.length);
        } catch {
            // Handled in service fallback
        } finally {
            setIsLoading(false);
        }
    }, [country, activeTab, page]);

    const handleTabChange = (tab: 'pending' | 'history') => {
        if (tab !== activeTab) {
            setActiveTab(tab);
            setPage(1);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadRequests();
            setRejectingId(null);
            setRejectionReason('');
        }
    }, [isOpen, loadRequests]);

    // Live update listeners
    useEffect(() => {
        const handleCreated = () => { if (isOpen) loadRequests(); };
        const handleApproved = () => { if (isOpen) loadRequests(); };
        const handleRejected = () => { if (isOpen) loadRequests(); };

        window.addEventListener('salary:request-created', handleCreated);
        window.addEventListener('salary:request-approved', handleApproved);
        window.addEventListener('salary:request-rejected', handleRejected);

        return () => {
            window.removeEventListener('salary:request-created', handleCreated);
            window.removeEventListener('salary:request-approved', handleApproved);
            window.removeEventListener('salary:request-rejected', handleRejected);
        };
    }, [isOpen, loadRequests]);

    const handleApprove = async (request: SalaryChangeRequest) => {
        if (!canApprove) {
            addNotification('alert', 'Only Country Finance Director or Executive Office can approve salary adjustments.');
            return;
        }

        if (request.employeeId === user?.id) {
            addNotification('alert', 'Zero-Trust Anti-Fraud Violation: You cannot approve your own salary adjustment.');
            return;
        }

        if (request.requestedBy === user?.name && !['group_ceo'].includes(user?.role || '')) {
            addNotification('alert', 'Separation of Duties violation: You cannot approve a request you initiated.');
            return;
        }

        setProcessingId(request.id);
        try {
            await salaryRequestsService.approve(request.id, {
                id: user?.id,
                name: user?.name || 'Approver',
                role: user?.role || 'country_finance_director'
            });

            addNotification('success', `Approved salary update for ${request.employeeName}.`);
            await loadRequests();
            if (onRequestsUpdated) onRequestsUpdated();
        } catch (err: any) {
            addNotification('alert', err.message || 'Failed to approve request.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleConfirmReject = async (requestId: string) => {
        if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
            setRejectError('Please state a reason for rejection (min 5 characters).');
            return;
        }

        setProcessingId(requestId);
        try {
            await salaryRequestsService.reject(
                requestId,
                { id: user?.id, name: user?.name || 'Reviewer', role: user?.role || 'country_finance_director' },
                rejectionReason.trim()
            );

            addNotification('info', 'Salary adjustment request rejected.');
            setRejectingId(null);
            setRejectionReason('');
            setRejectError('');
            await loadRequests();
            if (onRequestsUpdated) onRequestsUpdated();
        } catch (err: any) {
            setRejectError(err.message || 'Failed to reject request.');
        } finally {
            setProcessingId(null);
        }
    };

    const displayedRequests = requests;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Salary Approval Queue" size="lg">
            <div className="p-6 space-y-5">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-200 dark:border-white/10">
                    <div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
                            <h3 className="font-bold text-base text-stone-900 dark:text-white">
                                Dual-Control Compensation Governance
                            </h3>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                            Market: <strong>{country}</strong> • Requires Country Finance Director or CEO authorization
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-stone-100 dark:bg-black/40 p-1 rounded-xl border border-stone-200 dark:border-white/10 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleTabChange('pending')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'pending'
                                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                            <Clock size={14} />
                            <span>Pending</span>
                            {pendingCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('history')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                activeTab === 'history'
                                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                            }`}
                        >
                            <History size={14} />
                            <span>History</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-stone-400">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <p className="text-xs">Loading queue records...</p>
                    </div>
                ) : displayedRequests.length === 0 ? (
                    <div className="py-12 text-center text-stone-500">
                        <UserCheck size={36} className="mx-auto mb-3 opacity-40 text-emerald-600" />
                        <p className="font-bold text-sm text-stone-700 dark:text-stone-300">
                            {activeTab === 'pending' ? 'Zero Pending Salary Requests' : 'No Past Requests Recorded'}
                        </p>
                        <p className="text-xs mt-1 text-stone-400">
                            {activeTab === 'pending'
                                ? 'All employee salary adjustments have been reviewed and processed.'
                                : 'Salary adjustment proposals will appear here once submitted.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {displayedRequests.map((req) => {
                            const isPending = req.status === 'pending';
                            const diff = req.proposedSalary - req.currentSalary;
                            const pctChange = req.currentSalary > 0
                                ? ((diff / req.currentSalary) * 100).toFixed(1)
                                : '100.0';
                            const isRequester = req.requestedBy === user?.name;
                            const isOwnRecord = req.employeeId === user?.id;
                            const isActionDisabled = processingId === req.id || isOwnRecord || (!['group_ceo'].includes(user?.role || '') && isRequester);

                            return (
                                <div
                                    key={req.id}
                                    className="p-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-black/30 hover:border-emerald-500/40 transition-all shadow-xs space-y-3"
                                >
                                    {/* Top Row: Employee & Status */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                                                    {req.employeeName}
                                                </h4>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    req.status === 'approved'
                                                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                                        : req.status === 'rejected'
                                                        ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                                                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-400 mt-0.5">
                                                Proposed by <strong className="text-stone-700 dark:text-stone-300">{req.requestedBy}</strong> ({req.requestedByRole.replace(/_/g, ' ')}) • {new Date(req.requestedAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Compensation Change Badge */}
                                        <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-900/60 p-2 rounded-xl border border-stone-200 dark:border-white/5 font-mono text-xs">
                                            <span className="text-stone-500">{req.currency} {req.currentSalary.toLocaleString()}</span>
                                            <ArrowRight size={13} className="text-stone-400" />
                                            <span className="font-bold text-stone-900 dark:text-white">{req.currency} {req.proposedSalary.toLocaleString()}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                diff >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                                            }`}>
                                                {diff >= 0 ? '+' : ''}{pctChange}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Reason Quote */}
                                    <div className="p-3 bg-stone-50 dark:bg-black/40 rounded-xl border border-stone-200/60 dark:border-white/5 text-xs text-stone-700 dark:text-stone-300">
                                        <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block mb-1">
                                            HR Justification:
                                        </span>
                                        <p className="italic font-sans">"{req.reason}"</p>
                                    </div>

                                    {/* Approver or Rejector Note */}
                                    {req.status === 'approved' && req.approvedBy && (
                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <CheckCircle size={13} />
                                            Approved by {req.approvedBy} ({req.approvedByRole}) on {new Date(req.approvedAt || '').toLocaleString()}
                                        </p>
                                    )}

                                    {req.status === 'rejected' && (
                                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400">
                                            <p className="font-bold">Rejected by {req.rejectedBy || 'Reviewer'}:</p>
                                            <p className="italic mt-0.5">"{req.rejectionReason}"</p>
                                        </div>
                                    )}

                                    {/* Action Buttons for Pending */}
                                    {isPending && (
                                        <div>
                                            {rejectingId === req.id ? (
                                                <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-white/10">
                                                    <label className="block text-xs font-bold text-rose-600 dark:text-rose-400">
                                                        State Reason for Rejection:
                                                    </label>
                                                    <textarea
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        rows={2}
                                                        className="w-full bg-stone-50 dark:bg-black/50 border border-stone-300 dark:border-white/10 rounded-xl p-2.5 text-xs text-stone-900 dark:text-white outline-none focus:border-rose-500 resize-none"
                                                        placeholder="e.g. Budget ceiling reached, review scheduled next quarter..."
                                                    />
                                                    {rejectError && <p className="text-[11px] text-rose-500">{rejectError}</p>}
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setRejectingId(null); setRejectionReason(''); setRejectError(''); }}
                                                            className="px-3 py-1.5 text-xs text-stone-500 font-bold cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={processingId === req.id}
                                                            onClick={() => handleConfirmReject(req.id)}
                                                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                                                        >
                                                            {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                                            Confirm Rejection
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-white/10">
                                                    {isActionDisabled && processingId !== req.id && (
                                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                            <AlertTriangle size={13} />
                                                            Separation of Duties: Another manager must approve
                                                        </p>
                                                    )}
                                                    {!isActionDisabled && <div />}
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <button
                                                            type="button"
                                                            disabled={isActionDisabled || !canApprove}
                                                            onClick={() => { setRejectingId(req.id); setRejectionReason(''); }}
                                                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <XCircle size={13} />
                                                            Reject
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isActionDisabled || !canApprove}
                                                            onClick={() => handleApprove(req)}
                                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shadow-xs"
                                                        >
                                                            {processingId === req.id ? (
                                                                <Loader2 size={13} className="animate-spin" />
                                                            ) : (
                                                                <CheckCircle size={13} />
                                                            )}
                                                            Approve Update
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer & Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-mono">
                            Page {page} {requests.length > 0 ? `(${((page - 1) * PAGE_SIZE) + 1}–${((page - 1) * PAGE_SIZE) + requests.length})` : ''}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={page <= 1 || isLoading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 transition-colors cursor-pointer"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                disabled={!hasMore || isLoading}
                                onClick={() => setPage(p => p + 1)}
                                className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 transition-colors cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
