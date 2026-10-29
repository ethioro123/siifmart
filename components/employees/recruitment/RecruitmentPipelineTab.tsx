import React, { useState, useEffect } from 'react';
import {
    Briefcase, Plus, CheckCircle2, Clock,
    ArrowRight, ShieldCheck, Banknote, UserPlus, Building2, Sparkles
} from 'lucide-react';
import { recruitmentService } from '../../../services/recruitment.service';
import type { JobRequisition, JobCandidate, CandidateStage } from '../../../types/hr-advanced';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { RequisitionModal } from './RequisitionModal';
import { CandidateModal } from './CandidateModal';
import { CandidateApprovalModal } from './CandidateApprovalModal';

export default function RecruitmentPipelineTab() {
    const { user, showToast } = useStore();
    const { effectiveCountry, activeSite } = useData();
    const country = effectiveCountry || 'ET';

    const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
    const [candidates, setCandidates] = useState<JobCandidate[]>([]);
    const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Modals
    const [isReqModalOpen, setIsReqModalOpen] = useState(false);
    const [isCandModalOpen, setIsCandModalOpen] = useState(false);
    const [approvalCandidate, setApprovalCandidate] = useState<JobCandidate | null>(null);

    const userRoleLevel = recruitmentService.getUserRoleLevel(user?.role || '');
    const isSiteManager = userRoleLevel === 3;
    const canManageHiring = recruitmentService.canManageHiring(user?.role || '');
    const canManageCandidates = recruitmentService.canManageCandidates(user?.role || '');
    const canApproveRequisition = ['group_ceo', 'country_managing_director', 'country_hr_director', 'hr_generalist', 'regional_hr_manager'].includes(user?.role || '');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [reqs, cands] = await Promise.all([
                recruitmentService.fetchRequisitions(country),
                recruitmentService.fetchCandidates(country)
            ]);
            setRequisitions(reqs);
            setCandidates(cands);
        } catch {
            // Handled
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [country]);

    const handleApproveRequisition = async (reqId: string) => {
        try {
            await recruitmentService.approveRequisition(
                reqId,
                {
                    id: user?.id || 'hq_approver',
                    name: user?.name || 'Operations Director',
                    role: user?.role || 'country_operations_director'
                }
            );
            showToast('Headcount requisition approved for active hiring', 'success');
            loadData();
        } catch {
            showToast('Failed to approve requisition', 'error');
        }
    };

    const handleStageUpdate = async (candId: string, nextStage: CandidateStage) => {
        try {
            await recruitmentService.updateCandidateStage(candId, nextStage);
            showToast(`Candidate moved to ${nextStage}`, 'info');
            loadData();
        } catch {
            showToast('Failed to update stage', 'error');
        }
    };

    // Scoped filtering: Site managers only see their branch's reqs & candidates
    const filteredRequisitions = isSiteManager && user?.siteId
        ? requisitions.filter(r => r.site_id === user.siteId)
        : requisitions;

    const filteredCandidates = isSiteManager && user?.siteId
        ? candidates.filter(c => {
            if (c.site_id && c.site_id !== user.siteId) return false;
            if (c.requisition_id) {
                const req = requisitions.find(r => r.id === c.requisition_id);
                if (req && req.site_id !== user.siteId) return false;
            }
            return true;
        })
        : candidates;

    return (
        <div className="space-y-5 sm:space-y-6">
            {/* Apple Section Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold tracking-tight text-[var(--theme-text-primary)]">
                                Delegated Recruitment & 4-Eyes Onboarding
                            </h3>
                            {['country_hr_director', 'country_operations_director', 'regional_operations_manager', 'country_managing_director', 'group_ceo'].includes(user?.role || '') ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                                    Checker • HR Compliance Sign-Off
                                </span>
                            ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-status-info-border)]">
                                    Maker • Talent Sourcing
                                </span>
                            )}
                            {isSiteManager && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-status-info-border)]">
                                    Branch Scope
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            {isSiteManager
                                ? `Location-locked to ${activeSite?.name || user?.siteId || 'your branch'}. You can recruit floor staff below your level.`
                                : 'Dual-control sign-offs: Recruiter sourcing -> HR compliance vetting -> Finance salary authorization -> Synaptic activation.'
                            }
                        </p>
                    </div>
                </div>

                {(canManageHiring || canManageCandidates) && (
                    <div className="flex items-center gap-2.5">
                        {canManageCandidates && (
                            <button
                                type="button"
                                onClick={() => setIsCandModalOpen(true)}
                                className="h-10 px-3.5 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                            >
                                <UserPlus size={14} />
                                <span>+ Candidate</span>
                            </button>
                        )}
                        {canManageHiring && (
                            <button
                                type="button"
                                onClick={() => setIsReqModalOpen(true)}
                                className="h-10 px-4 rounded-xl bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-95 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,113,227,0.25)] active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <Plus size={15} />
                                <span>New Requisition</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Requisitions List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        Headcount Requisitions ({filteredRequisitions.length})
                    </h4>
                    {isSiteManager && (
                        <span className="text-xs text-[var(--theme-text-muted)] flex items-center gap-1">
                            <Building2 size={12} />
                            <span>{activeSite?.name || 'Local Site'}</span>
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredRequisitions.map(req => {
                        const isSelected = selectedReqId === req.id;
                        return (
                            <div
                                key={req.id}
                                onClick={() => setSelectedReqId(isSelected ? null : req.id)}
                                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                        ? 'bg-[var(--theme-bg-card)] border-[var(--theme-border-focus)] dark:border-[var(--theme-border-focus)] ring-1 ring-[#0071E3]/20 shadow-[0_2px_12px_rgba(0,113,227,0.12)]'
                                        : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-[var(--shadow-sm)] hover:border-[var(--theme-border-strong)]'
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <h5 className="font-semibold text-sm text-[var(--theme-text-primary)]">
                                                {req.title}
                                            </h5>
                                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                                {req.department} • <span className="font-medium text-[var(--theme-text-primary)]">{req.role}</span> (<span className="font-mono tabular-nums">{req.headcount}</span> {req.headcount === 1 ? 'Opening' : 'Openings'})
                                            </p>
                                        </div>
                                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                                            req.status === 'approved' || req.status === 'active_recruiting'
                                                ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                                                : 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                                        }`}>
                                            {req.status === 'pending_hq_approval' ? 'Pending HQ' : req.status}
                                        </span>
                                    </div>

                                    <p className="text-xs text-[var(--theme-text-secondary)] italic mb-3 line-clamp-2">
                                        "{req.justification}"
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-xs text-[var(--theme-text-muted)] pt-3 border-t border-[var(--theme-border-subtle)]">
                                    <span className="font-mono tabular-nums">Budget: {req.target_salary?.toLocaleString()} {country === 'KE' ? 'KSh' : 'ETB'}</span>
                                    {req.status === 'pending_hq_approval' && canApproveRequisition && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleApproveRequisition(req.id); }}
                                            className="h-7 px-2.5 rounded-lg bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-95 text-white text-[11px] font-semibold cursor-pointer active:scale-[0.98] transition-all"
                                        >
                                            Approve HQ
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {filteredRequisitions.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] text-xs text-[var(--theme-text-muted)]">
                            No active headcount requisitions logged for this location.
                        </div>
                    )}
                </div>
            </div>

            {/* Candidate Pipeline Stages */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                        Applicant Tracking & 4-Eyes Sign-Off Pipeline ({filteredCandidates.length})
                    </h4>
                    {selectedReqId && (
                        <button
                            type="button"
                            onClick={() => setSelectedReqId(null)}
                            className="text-xs text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-medium hover:underline cursor-pointer"
                        >
                            Clear Requisition Filter
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {(['applied', 'screening', 'interview', 'offered', 'hired'] as CandidateStage[]).map(stage => {
                        const stageCandidates = filteredCandidates
                            .filter(c => !selectedReqId || c.requisition_id === selectedReqId)
                            .filter(c => c.stage === stage);

                        return (
                            <div key={stage} className="bg-[var(--theme-bg-subtle)] rounded-2xl p-3 border border-[var(--theme-border)] space-y-2.5 flex flex-col justify-between min-h-[220px]">
                                <div>
                                    <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-2 mb-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                            {stage}
                                        </span>
                                        <span className="text-xs font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">
                                            {stageCandidates.length}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {stageCandidates.map(cand => {
                                            const hasHR = Boolean(cand.hr_approved_at);
                                            const hasFin = Boolean(cand.finance_approved_at);

                                            return (
                                                <div
                                                    key={cand.id}
                                                    onClick={() => setApprovalCandidate(cand)}
                                                    className="p-3 bg-[var(--theme-bg-card)] rounded-xl border border-[var(--theme-border)] space-y-2 shadow-xs hover:border-[var(--theme-border-strong)] transition-all cursor-pointer"
                                                >
                                                    <div>
                                                        <p className="text-xs font-semibold text-[var(--theme-text-primary)] truncate">{cand.name}</p>
                                                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums truncate">{cand.phone || cand.email}</p>
                                                    </div>

                                                    {/* Dual 4-Eyes Compliance Badges */}
                                                    <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--theme-border-subtle)] text-[10px]">
                                                        <span className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${
                                                            hasHR ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]' : 'bg-stone-500/10 text-stone-500 border-stone-500/20'
                                                        }`}>
                                                            <ShieldCheck size={10} />
                                                            <span>HR {hasHR ? 'Verified' : 'Pending'}</span>
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${
                                                            hasFin ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]' : 'bg-stone-500/10 text-stone-500 border-stone-500/20'
                                                        }`}>
                                                            <Banknote size={10} />
                                                            <span>Fin {hasFin ? 'Approved' : 'Pending'}</span>
                                                        </span>
                                                    </div>

                                                    {/* Stage Transition & Details Button */}
                                                    <div className="flex items-center gap-1.5 pt-1">
                                                        {stage === 'offered' ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); setApprovalCandidate(cand); }}
                                                                className="w-full h-7 rounded-lg bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-95 text-white text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-xs"
                                                            >
                                                                <Sparkles size={11} />
                                                                <span>Review 4-Eyes</span>
                                                            </button>
                                                        ) : stage !== 'hired' ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const stages: CandidateStage[] = ['applied', 'screening', 'interview', 'offered', 'hired'];
                                                                    const next = stages[stages.indexOf(stage) + 1];
                                                                    if (next) handleStageUpdate(cand.id, next);
                                                                }}
                                                                className="w-full h-7 rounded-lg bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-border)] text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98] transition-all"
                                                            >
                                                                <span>Advance</span>
                                                                <ArrowRight size={11} />
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] font-semibold flex items-center gap-1 justify-center w-full py-0.5">
                                                                <CheckCircle2 size={12} />
                                                                <span>Active Staff</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {stageCandidates.length === 0 && (
                                            <div className="py-8 text-center text-xs text-[var(--theme-text-muted)] font-normal">
                                                No candidates
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Subcomponent Modals */}
            <RequisitionModal
                isOpen={isReqModalOpen}
                onClose={() => setIsReqModalOpen(false)}
                onSuccess={loadData}
                country={country}
            />

            <CandidateModal
                isOpen={isCandModalOpen}
                onClose={() => setIsCandModalOpen(false)}
                onSuccess={loadData}
                country={country}
                requisitions={filteredRequisitions}
                selectedReqId={selectedReqId}
            />

            <CandidateApprovalModal
                isOpen={Boolean(approvalCandidate)}
                onClose={() => setApprovalCandidate(null)}
                onSuccess={loadData}
                candidate={approvalCandidate}
                requisition={requisitions.find(r => r.id === approvalCandidate?.requisition_id)}
                country={country}
            />
        </div>
    );
}
