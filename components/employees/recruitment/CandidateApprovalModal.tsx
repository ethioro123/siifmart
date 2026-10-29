import React, { useState, useEffect } from 'react';
import {
    X, ShieldCheck, CheckCircle2, Clock, AlertCircle,
    Banknote, Sparkles, Building2, User, UserCheck, Flame
} from 'lucide-react';
import { recruitmentService } from '../../../services/recruitment.service';
import type { JobCandidate, JobRequisition } from '../../../types/hr-advanced';
import type { CandidateHiringRoute } from '../../../services/recruitment-delegation';
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
    const [managerNotes, setManagerNotes] = useState('');
    const [financeSalary, setFinanceSalary] = useState(candidate?.offered_salary || (country === 'KE' ? 35000 : 12000));
    const [financeNotes, setFinanceNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [route, setRoute] = useState<CandidateHiringRoute | null>(null);

    const targetRole = candidate?.role || requisition?.role || 'stock_clerk';
    const targetSiteId = candidate?.site_id || requisition?.site_id || user?.siteId || '';
    const siteObj = sites.find(s => s.id === targetSiteId);

    useEffect(() => {
        if (candidate && isOpen) {
            setFinanceSalary(candidate.offered_salary || (country === 'KE' ? 35000 : 12000));
            recruitmentService.evaluateCandidateRoute({
                siteId: targetSiteId,
                role: targetRole,
                offeredSalary: candidate.offered_salary,
                countryCode: country
            }).then(setRoute).catch(() => setRoute(null));
        }
    }, [candidate, isOpen, targetSiteId, targetRole, country]);

    if (!isOpen || !candidate) return null;

    const userRole = user?.role || '';
    const isHR = ['country_hr_director', 'regional_hr_manager', 'hr_generalist', 'group_ceo', 'group_chro', 'country_managing_director'].includes(userRole);
    const isHiringManager = [
        'store_manager', 'warehouse_manager', 'facility_director', 'operations_manager',
        'regional_operations_manager', 'country_operations_director', 'country_managing_director',
        'country_hr_director', 'regional_hr_manager', 'hr_generalist', 'group_ceo', 'group_chro'
    ].includes(userRole);
    const isFinance = ['country_finance_director', 'regional_finance_manager', 'group_ceo', 'group_cfo', 'country_managing_director'].includes(userRole);
    const isCEO = ['group_ceo', 'group_chro'].includes(userRole);

    const isOwnRecord = Boolean(
        user?.name && candidate.name.toLowerCase() === user.name.toLowerCase() ||
        user?.email && candidate.email.toLowerCase() === user.email.toLowerCase()
    );

    const isException = Boolean(candidate.is_salary_exception || candidate.is_quota_exception || route?.isException);
    const hasHRApproval = Boolean(candidate.hr_approved_at);
    const hasManagerConfirm = Boolean(candidate.hiring_manager_approved_at);
    const hasFinanceApproval = Boolean(candidate.finance_approved_at);
    const hasCMDApproval = Boolean(candidate.cmd_approved_at || candidate.group_approved_at);

    const canActivateHire = isCEO || (
        isException
            ? (hasHRApproval && hasFinanceApproval && (hasCMDApproval || ['country_managing_director'].includes(userRole)))
            : (hasHRApproval && (hasManagerConfirm || isHiringManager))
    );

    const handleApproveHR = async () => {
        setIsProcessing(true);
        try {
            await recruitmentService.approveCandidateHR(
                candidate.id,
                { id: user?.id || 'hr', name: user?.name || 'HR Lead', role: userRole },
                hrNotes.trim()
            );
            showToast('Candidate passed HR credential & compensation band vetting', 'success');
            onSuccess();
        } catch (err: any) {
            showToast(err?.message || 'Failed HR clearance', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmManager = async () => {
        setIsProcessing(true);
        try {
            await recruitmentService.confirmCandidateHiringManager(
                candidate.id,
                { id: user?.id || 'mgr', name: user?.name || 'Hiring Manager', role: userRole },
                managerNotes.trim()
            );
            showToast('Hiring offer confirmed by Authorized Hiring Manager', 'success');
            onSuccess();
        } catch (err: any) {
            showToast(err?.message || 'Failed hiring manager confirmation', 'error');
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
            showToast('Salary exception authorized by Finance', 'success');
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
            if (refreshData) refreshData(['employees']);
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err?.message || 'Failed to finalize activation', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--theme-bg-panel)] rounded-3xl border border-[var(--theme-border)] shadow-[var(--shadow-modal)] p-6 max-w-xl w-full space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
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
                            {isException ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-status-warning-bg)] border border-[var(--theme-status-warning-border)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-1">
                                    <Flame size={11} /> Exception Path
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center gap-1">
                                    <CheckCircle2 size={11} /> Delegated Fast-Path
                                </span>
                            )}
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

                {/* Anti-Self-Approval Alert */}
                {isOwnRecord && (
                    <div className="p-3 rounded-2xl bg-[var(--theme-status-danger-bg)] border border-[var(--theme-status-danger-border)] text-xs text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>Separation of Duties: You cannot approve, clear, or confirm your own candidate profile.</span>
                    </div>
                )}

                {/* Assignment & Governance Details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs">
                    <div>
                        <span className="text-[var(--theme-text-muted)] block text-[10px] uppercase font-semibold">Location</span>
                        <span className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5 mt-0.5">
                            <Building2 size={13} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                            {siteObj?.name || targetSiteId || 'Assigned Site'}
                        </span>
                    </div>
                    <div>
                        <span className="text-[var(--theme-text-muted)] block text-[10px] uppercase font-semibold">Target Position</span>
                        <span className="font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5 mt-0.5">
                            <User size={13} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                            {targetRole}
                        </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <span className="text-[var(--theme-text-muted)] block text-[10px] uppercase font-semibold">Capacity Quota</span>
                        <span className="font-semibold text-[var(--theme-text-primary)] mt-0.5 block">
                            {route ? `${route.currentActive}/${route.approvedQuota} slots (${route.openSlots} open)` : 'Evaluating...'}
                        </span>
                    </div>
                </div>

                {/* Governance Routing Steps */}
                <div className="space-y-3">
                    {/* Step 1: HR Credentials & Salary Band Clearance */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                        hasHRApproval ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    hasHRApproval ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)]'
                                }`}>
                                    <ShieldCheck size={16} />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">
                                        1. HR Clearance (Credentials & Salary Band)
                                    </h5>
                                    <span className="text-[10px] text-[var(--theme-text-secondary)]">
                                        Identity verification, credentials, right-to-work, and standard pay band check.
                                    </span>
                                </div>
                            </div>
                            {hasHRApproval ? (
                                <span className="text-[11px] font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center gap-1">
                                    <CheckCircle2 size={13} />
                                    <span>Cleared</span>
                                </span>
                            ) : (
                                <span className="text-[11px] font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-1">
                                    <Clock size={13} />
                                    <span>Pending</span>
                                </span>
                            )}
                        </div>

                        {hasHRApproval ? (
                            <p className="text-xs text-[var(--theme-text-secondary)] pl-9">
                                Cleared by <strong className="text-[var(--theme-text-primary)]">{candidate.hr_approved_by}</strong> on {candidate.hr_approved_at?.slice(0, 10)}. {candidate.hr_notes && `"${candidate.hr_notes}"`}
                            </p>
                        ) : (
                            <div className="pl-9 pt-1 space-y-2">
                                {isHR && !isOwnRecord ? (
                                    <>
                                        <input
                                            type="text"
                                            value={hrNotes}
                                            onChange={(e) => setHrNotes(e.target.value)}
                                            placeholder="Identity verified, background clear, salary within site band..."
                                            className="w-full h-8 px-2.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg text-xs text-[var(--theme-text-primary)] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApproveHR}
                                            disabled={isProcessing}
                                            className="h-8 px-3 rounded-lg bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-text-primary)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                                        >
                                            <ShieldCheck size={14} />
                                            <span>Sign Off HR Clearance</span>
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-xs text-[var(--theme-text-muted)] italic">
                                        Awaiting credential & compensation band clearance from HR Officer.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 2 for Routine Hiring: Authorized Hiring Manager Confirmation */}
                    {!isException ? (
                        <div className={`p-4 rounded-2xl border transition-all ${
                            hasManagerConfirm ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                        hasManagerConfirm ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)]'
                                    }`}>
                                        <UserCheck size={16} />
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">
                                            2. Authorized Hiring Manager Confirmation
                                        </h5>
                                        <span className="text-[10px] text-[var(--theme-text-secondary)]">
                                            Facility / Store Manager confirms role offer within approved site headcount quota.
                                        </span>
                                    </div>
                                </div>
                                {hasManagerConfirm ? (
                                    <span className="text-[11px] font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center gap-1">
                                        <CheckCircle2 size={13} />
                                        <span>Confirmed</span>
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-1">
                                        <Clock size={13} />
                                        <span>Pending</span>
                                    </span>
                                )}
                            </div>

                            {hasManagerConfirm ? (
                                <p className="text-xs text-[var(--theme-text-secondary)] pl-9">
                                    Offer confirmed by <strong className="text-[var(--theme-text-primary)]">{candidate.hiring_manager_approved_by}</strong> on {candidate.hiring_manager_approved_at?.slice(0, 10)}. {candidate.hiring_manager_notes && `"${candidate.hiring_manager_notes}"`}
                                </p>
                            ) : (
                                <div className="pl-9 pt-1 space-y-2">
                                    {isHiringManager && !isOwnRecord ? (
                                        <>
                                            <input
                                                type="text"
                                                value={managerNotes}
                                                onChange={(e) => setManagerNotes(e.target.value)}
                                                placeholder="Offer confirmed for frontline shift roster..."
                                                className="w-full h-8 px-2.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-lg text-xs text-[var(--theme-text-primary)] outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleConfirmManager}
                                                disabled={isProcessing || !hasHRApproval}
                                                className="h-8 px-3 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 disabled:opacity-50 text-[var(--theme-text-primary)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                                            >
                                                <UserCheck size={14} />
                                                <span>Confirm Hiring Offer</span>
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-xs text-[var(--theme-text-muted)] italic">
                                            Awaiting confirmation from Store Manager or Facility Operations Lead.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Step 2 for Exception Hiring: Finance Budget & Salary Exception Clearance */
                        <div className={`p-4 rounded-2xl border transition-all ${
                            hasFinanceApproval ? 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)]'
                        }`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                        hasFinanceApproval ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]' : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)]'
                                    }`}>
                                        <Banknote size={16} />
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-xs text-[var(--theme-text-primary)]">
                                            2. Finance Clearance (Salary & Quota Exception)
                                        </h5>
                                        <span className="text-[10px] text-[var(--theme-text-secondary)]">
                                            Budget variance clearance & compensation variance authorization.
                                        </span>
                                    </div>
                                </div>
                                {hasFinanceApproval ? (
                                    <span className="text-[11px] font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center gap-1">
                                        <CheckCircle2 size={13} />
                                        <span>Authorized</span>
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-semibold text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center gap-1">
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
                                    {isFinance && !isOwnRecord ? (
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
                                                className="h-8 px-3 rounded-lg bg-[var(--theme-status-success-bg)] bg-[var(--theme-status-success-bg)] text-[var(--theme-text-primary)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                                            >
                                                <Banknote size={14} />
                                                <span>Authorize Salary & Exception</span>
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-xs text-[var(--theme-text-muted)] italic">
                                            Proposed salary: <span className="font-mono tabular-nums">{candidate.offered_salary?.toLocaleString() || 'Pending'} {country === 'KE' ? 'KSh' : 'ETB'}</span>. Awaiting Finance clearance.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Activation Banner / Controls */}
                {candidate.stage === 'hired' ? (
                    <div className="p-4 rounded-2xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-xs text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="shrink-0 text-[var(--theme-status-success-text)]" />
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
                                <span className="text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-medium flex items-center gap-1.5">
                                    <CheckCircle2 size={14} />
                                    <span>Governance requirements satisfied — ready for automatic activation.</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                                    <AlertCircle size={14} />
                                    <span>
                                        {isException
                                            ? 'Requires HR clearance + Finance authorization + Country MD approval.'
                                            : 'Requires HR clearance + Authorized Hiring Manager confirmation.'}
                                    </span>
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
                            {canActivateHire && !isOwnRecord && (
                                <button
                                    type="button"
                                    onClick={handleFinalizeActivation}
                                    disabled={isProcessing}
                                    className="h-10 px-4 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-95 text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
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
