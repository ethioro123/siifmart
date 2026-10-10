import React, { useState } from 'react';
import { 
    X, ShieldCheck, CheckCircle2, Clock, AlertCircle, 
    Banknote, UserCheck, Sparkles, Building2, User 
} from 'lucide-react';
import { recruitmentService } from '../../../services/recruitment.service';
import type { JobCandidate, JobRequisition } from '../../../types/hr-advanced';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';

interface CandidateApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    candidate: JobCandidate | null;
    requisition?: JobRequisition;
    country: string;
}

export const CandidateApprovalModal: React.FC<CandidateApprovalModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    candidate,
    requisition,
    country
}) => {
    const { user, showToast } = useStore();
    const { sites, refreshData } = useData();

    const [hrNotes, setHrNotes] = useState('');
    const [financeSalary, setFinanceSalary] = useState(candidate?.offered_salary || (country === 'KE' ? 35000 : 12000));
    const [financeNotes, setFinanceNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !candidate) return null;

    const userRole = user?.role || '';
    const isHR = ['hr_manager', 'hr', 'super_admin', 'admin'].includes(userRole);
    const isFinance = ['finance_manager', 'super_admin', 'admin'].includes(userRole);
    const isCEO = userRole === 'super_admin' || userRole === 'admin';

    const targetRole = candidate.role || requisition?.role || 'stock_clerk';
    const targetSiteId = candidate.site_id || requisition?.site_id || user?.siteId || '';
    const siteObj = sites.find(s => s.id === targetSiteId);

    const hasHRApproval = Boolean(candidate.hr_approved_at);
    const hasFinanceApproval = Boolean(candidate.finance_approved_at);
    const canActivateHire = (hasHRApproval && hasFinanceApproval) || isCEO;

    const handleApproveHR = async () => {
        setIsProcessing(true);
        try {
            await recruitmentService.approveCandidateHR(
                candidate.id,
                { id: user?.id || 'hr', name: user?.name || 'HR Director', role: userRole },
                hrNotes.trim()
            );
            showToast('Candidate passed HR identity & compliance vetting', 'success');
            onSuccess();
        } catch (err: any) {
            showToast(err?.message || 'Failed HR approval', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApproveFinance = async () => {
        setIsProcessing(true);
        try {
            await recruitmentService.approveCandidateSalaryFinance(
                candidate.id,
                { id: user?.id || 'fin', name: user?.name || 'Finance Director', role: userRole },
                Number(financeSalary),
                financeNotes.trim()
            );
            showToast('Salary band and budget authorized by Finance', 'success');
            onSuccess();
        } catch (err: any) {
            showToast(err?.message || 'Failed Finance approval', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinalizeActivation = async () => {
        setIsProcessing(true);
        try {
            const newEmp = await recruitmentService.finalizeAndActivateHire(
                candidate.id,
                { id: user?.id || 'actor', name: user?.name || 'Director', role: userRole },
                targetSiteId,
                targetRole,
                requisition?.department || 'Operations'
            );
            showToast(`Synaptic Activation Complete: ${newEmp.name} enrolled as ${newEmp.code}!`, 'success');
            if (refreshData) refreshData();
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err?.message || 'Failed to finalize activation', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--theme-bg-panel)] rounded-3xl border border-[var(--theme-border)] shadow-[var(--shadow-modal)] p-6 max-w-xl w-full space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg tracking-tight text-[var(--theme-text-primary)]">
                                {candidate.name}
                            </h4>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]">
                                Stage: {candidate.stage.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            {candidate.email} • {candidate.phone}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Assignment Details */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs">
                    <div>
                        <span className="text-[var(--theme-text-muted)] block text-[10px] uppercase font-semibold">Location</span>
                        <span className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5 mt-0.5">
                            <Building2 size={13} className="text-[#0071E3] dark:text-[#2997FF]" />
                            {siteObj?.name || targetSiteId || 'Assigned Site'}
                        </span>
                    </div>
                    <div>
                        <span className="text-[var(--theme-text-muted)] block text-[10px] uppercase font-semibold">Target Position</span>
                        <span className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5 mt-0.5">
                            <User size={13} className="text-[#0071E3] dark:text-[#2997FF]" />
                            {targetRole}
                        </span>
                    </div>
                </div>

                {/* 4-Eyes Pipeline Cards */}
                <div className="space-y-3">
                    {/* HR Identity & Vetting Card */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                        hasHRApproval 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    hasHRApproval ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-[#0071E3]'
                                }`}>
                                    <ShieldCheck size={16} />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">
                                        1. HR Compliance & Identity Vetting
                                    </h5>
                                    <span className="text-[10px] text-[var(--theme-text-secondary)]">
                                        National ID check, background clearance, right-to-work verification.
                                    </span>
                                </div>
                            </div>
                            {hasHRApproval ? (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={13} />
                                    <span>Approved</span>
                                </span>
                            ) : (
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <Clock size={13} />
                                    <span>Pending</span>
                                </span>
                            )}
                        </div>

                        {hasHRApproval ? (
                            <p className="text-xs text-[var(--theme-text-secondary)] pl-9">
                                Verified by <strong className="text-[var(--theme-text-primary)]">{candidate.hr_approved_by}</strong> on {candidate.hr_approved_at?.slice(0, 10)}. {candidate.hr_notes && `"${candidate.hr_notes}"`}
                            </p>
                        ) : (
                            <div className="pl-9 pt-1 space-y-2">
                                {isHR ? (
                                    <>
                                        <input
                                            type="text"
                                            value={hrNotes}
                                            onChange={(e) => setHrNotes(e.target.value)}
                                            placeholder="Optional vetting reference or notes..."
                                            className="w-full h-8 px-2.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg text-xs text-[var(--theme-text-primary)] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApproveHR}
                                            disabled={isProcessing}
                                            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                                        >
                                            <ShieldCheck size={14} />
                                            <span>Sign Off HR Vetting</span>
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-xs text-[var(--theme-text-muted)] italic">
                                        Awaiting sign-off from HR Director or Corporate Admin.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Finance Salary & Budget Card */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                        hasFinanceApproval 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    hasFinanceApproval ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
                                }`}>
                                    <Banknote size={16} />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">
                                        2. Finance Salary & Budget Approval
                                    </h5>
                                    <span className="text-[10px] text-[var(--theme-text-secondary)]">
                                        Compensation band review, departmental budget fit, minimum wage law.
                                    </span>
                                </div>
                            </div>
                            {hasFinanceApproval ? (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={13} />
                                    <span>Authorized</span>
                                </span>
                            ) : (
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <Clock size={13} />
                                    <span>Pending</span>
                                </span>
                            )}
                        </div>

                        {hasFinanceApproval ? (
                            <p className="text-xs text-[var(--theme-text-secondary)] pl-9">
                                Authorized at <strong className="text-[var(--theme-text-primary)] font-mono tabular-nums">{candidate.offered_salary?.toLocaleString()} {country === 'KE' ? 'KSh' : 'ETB'}</strong> by <strong className="text-[var(--theme-text-primary)]">{candidate.finance_approved_by}</strong> on {candidate.finance_approved_at?.slice(0, 10)}.
                            </p>
                        ) : (
                            <div className="pl-9 pt-1 space-y-2">
                                {isFinance ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-[var(--theme-text-secondary)]">Authorized Salary:</label>
                                            <input
                                                type="number"
                                                min="1000"
                                                step="500"
                                                value={financeSalary}
                                                onChange={(e) => setFinanceSalary(Number(e.target.value))}
                                                className="w-32 h-8 px-2.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg text-xs font-mono tabular-nums text-[var(--theme-text-primary)] outline-none"
                                            />
                                            <span className="text-xs text-[var(--theme-text-muted)] font-mono">{country === 'KE' ? 'KSh' : 'ETB'}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleApproveFinance}
                                            disabled={isProcessing}
                                            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                                        >
                                            <Banknote size={14} />
                                            <span>Authorize Salary & Budget</span>
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-xs text-[var(--theme-text-muted)] italic">
                                        Proposed salary: <span className="font-mono tabular-nums">{candidate.offered_salary?.toLocaleString() || 'Pending'} {country === 'KE' ? 'KSh' : 'ETB'}</span>. Awaiting sign-off from Finance Director.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Synaptic Activation Banner */}
                {candidate.stage === 'hired' ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                        <div>
                            <p className="font-semibold">Worker Successfully Hired & Activated</p>
                            <p className="text-[11px] opacity-80 mt-0.5">
                                Active on floor rosters, WMS shifts, and Org Chart reporting lines.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="pt-2 border-t border-[var(--theme-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-[var(--theme-text-secondary)]">
                            {canActivateHire ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                                    <CheckCircle2 size={14} />
                                    <span>Dual-sign-off satisfied — ready for automatic activation.</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                    <AlertCircle size={14} />
                                    <span>Requires HR compliance + Finance salary authorization.</span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isProcessing}
                                className="h-10 px-4 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-secondary)] cursor-pointer"
                            >
                                Close
                            </button>
                            {canActivateHire && (
                                <button
                                    type="button"
                                    onClick={handleFinalizeActivation}
                                    disabled={isProcessing}
                                    className="h-10 px-4 rounded-xl bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                >
                                    <Sparkles size={14} />
                                    <span>Finalize & Activate Employee</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
