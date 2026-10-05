import React, { useState, useEffect, useMemo } from 'react';
import { 
    Briefcase, Plus, CheckCircle2, Clock, UserCheck, Star, 
    FileText, ArrowRight, ShieldCheck, AlertCircle, XCircle 
} from 'lucide-react';
import { recruitmentService } from '../../../services/recruitment.service';
import type { JobRequisition, JobCandidate, CandidateStage } from '../../../types/hr-advanced';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';

export default function RecruitmentPipelineTab() {
    const { user, showToast } = useStore();
    const { effectiveCountry, activeSite } = useData();
    const country = effectiveCountry || 'ET';

    const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
    const [candidates, setCandidates] = useState<JobCandidate[]>([]);
    const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Requisition modal
    const [isReqModalOpen, setIsReqModalOpen] = useState(false);
    const [reqTitle, setReqTitle] = useState('');
    const [reqDept, setReqDept] = useState('Operations');
    const [reqRole, setReqRole] = useState('picker');
    const [reqHeadcount, setReqHeadcount] = useState(1);
    const [reqSalary, setReqSalary] = useState(12000);
    const [reqJustification, setReqJustification] = useState('');

    // Candidate modal
    const [isCandModalOpen, setIsCandModalOpen] = useState(false);
    const [candName, setCandName] = useState('');
    const [candEmail, setCandEmail] = useState('');
    const [candPhone, setCandPhone] = useState('');

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

    const handleCreateRequisition = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await recruitmentService.createRequisition({
                country_code: country,
                site_id: activeSite?.id || 'SITE-01',
                title: reqTitle,
                department: reqDept,
                role: reqRole,
                headcount: reqHeadcount,
                target_salary: reqSalary,
                justification: reqJustification,
                requested_by: user?.name || 'HR Officer',
                requested_by_role: user?.role || 'talent_recruiter'
            });
            showToast('Headcount requisition submitted for HQ approval', 'success');
            setIsReqModalOpen(false);
            setReqTitle('');
            setReqJustification('');
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Failed to submit requisition', 'error');
        }
    };

    const handleApproveRequisition = async (reqId: string) => {
        try {
            await recruitmentService.approveRequisition(reqId, {
                id: user?.id || 'hq_approver',
                name: user?.name || 'Executive HQ',
                role: user?.role || 'super_admin'
            });
            showToast('Requisition approved for active recruitment', 'success');
            loadData();
        } catch (err: any) {
            showToast(err.message || 'Approval rejected under 4-Eyes rule', 'error');
        }
    };

    const handleCreateCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await recruitmentService.createCandidate({
                country_code: country,
                requisition_id: selectedReqId || undefined,
                name: candName,
                email: candEmail,
                phone: candPhone
            });
            showToast('Candidate added to talent pipeline', 'success');
            setIsCandModalOpen(false);
            setCandName('');
            setCandEmail('');
            setCandPhone('');
            loadData();
        } catch {
            showToast('Failed to add candidate', 'error');
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

    const isHQ = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'operations_manager';

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/80 dark:bg-black/30 rounded-3xl border border-[#E2DCCE] dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#2C5E3B]/10 rounded-2xl text-[#2C5E3B] dark:text-[#A9CBA2]">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-[#1E3F27] dark:text-[#EAE5D9]">
                            Recruitment Pipeline & Headcount Requisitions
                        </h3>
                        <p className="text-xs text-stone-500 font-medium">
                            Dual-control requisition sign-off, applicant scoring rubrics, and formal offers
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCandModalOpen(true)}
                        className="px-4 py-2 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                    >
                        + Add Candidate
                    </button>
                    <button
                        onClick={() => setIsReqModalOpen(true)}
                        className="woody-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                        <Plus size={15} />
                        <span>New Requisition</span>
                    </button>
                </div>
            </div>

            {/* Requisitions List */}
            <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-500">
                    Active Headcount Requisitions ({requisitions.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requisitions.map(req => (
                        <div
                            key={req.id}
                            className={`p-5 rounded-2xl border transition-all ${
                                selectedReqId === req.id
                                    ? 'bg-[#2C5E3B]/5 border-[#2C5E3B] shadow-xs'
                                    : 'bg-white/80 dark:bg-black/30 border-[#E2DCCE] dark:border-white/10'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <h5 className="font-bold text-sm text-[#1E3F27] dark:text-[#EAE5D9]">
                                        {req.title}
                                    </h5>
                                    <p className="text-xs text-stone-500 font-medium">
                                        {req.department} • {req.role} ({req.headcount} {req.headcount === 1 ? 'Opening' : 'Openings'})
                                    </p>
                                </div>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                    req.status === 'approved' || req.status === 'active_recruiting'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                    {req.status === 'pending_hq_approval' ? 'Pending HQ' : req.status}
                                </span>
                            </div>

                            <p className="text-xs text-stone-600 dark:text-stone-400 italic mb-3 line-clamp-2">
                                "{req.justification}"
                            </p>

                            <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-100 dark:border-white/5">
                                <span>Target: {req.target_salary?.toLocaleString()} {country === 'KE' ? 'KSh' : 'ETB'}</span>
                                {req.status === 'pending_hq_approval' && isHQ && (
                                    <button
                                        onClick={() => handleApproveRequisition(req.id)}
                                        className="woody-btn-primary px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                                    >
                                        Approve HQ
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Candidate Pipeline Stages */}
            <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-500">
                    Applicant Tracking Pipeline ({candidates.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {(['applied', 'screening', 'interview', 'offered', 'hired'] as CandidateStage[]).map(stage => {
                        const stageCandidates = candidates.filter(c => c.stage === stage);
                        return (
                            <div key={stage} className="bg-stone-50 dark:bg-black/20 rounded-2xl p-3 border border-[#E2DCCE] dark:border-white/10 space-y-2.5">
                                <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/5 pb-2">
                                    <span className="text-[11px] font-black uppercase text-stone-600 dark:text-stone-300">
                                        {stage}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-stone-400">
                                        {stageCandidates.length}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {stageCandidates.map(cand => (
                                        <div key={cand.id} className="p-3 bg-white dark:bg-black/40 rounded-xl border border-stone-200 dark:border-white/10 space-y-1.5 shadow-2xs">
                                            <p className="text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9]">{cand.name}</p>
                                            <p className="text-[10px] text-stone-400 font-mono">{cand.phone || cand.email}</p>
                                            
                                            {stage !== 'hired' && (
                                                <button
                                                    onClick={() => {
                                                        const stages: CandidateStage[] = ['applied', 'screening', 'interview', 'offered', 'hired'];
                                                        const next = stages[stages.indexOf(stage) + 1];
                                                        if (next) handleStageUpdate(cand.id, next);
                                                    }}
                                                    className="w-full mt-1 py-1 rounded bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                                >
                                                    <span>Advance</span>
                                                    <ArrowRight size={10} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Requisition Modal */}
            {isReqModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleCreateRequisition} className="bg-white dark:bg-[#18201B] rounded-3xl border border-[#E2DCCE] dark:border-white/10 p-6 max-w-md w-full space-y-4">
                        <h4 className="font-black text-sm text-[#1E3F27] dark:text-[#EAE5D9]">
                            Submit Headcount Requisition
                        </h4>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Job Title</label>
                            <input
                                type="text"
                                value={reqTitle}
                                onChange={(e) => setReqTitle(e.target.value)}
                                placeholder="e.g. Senior Inventory Specialist"
                                required
                                className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Headcount</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={reqHeadcount}
                                    onChange={(e) => setReqHeadcount(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Target Salary</label>
                                <input
                                    type="number"
                                    value={reqSalary}
                                    onChange={(e) => setReqSalary(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Business Justification</label>
                            <textarea
                                value={reqJustification}
                                onChange={(e) => setReqJustification(e.target.value)}
                                placeholder="Explain the operational necessity for this opening..."
                                rows={3}
                                required
                                className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsReqModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="woody-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                            >
                                Submit Requisition
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Candidate Modal */}
            {isCandModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleCreateCandidate} className="bg-white dark:bg-[#18201B] rounded-3xl border border-[#E2DCCE] dark:border-white/10 p-6 max-w-md w-full space-y-4">
                        <h4 className="font-black text-sm text-[#1E3F27] dark:text-[#EAE5D9]">
                            Add Candidate to Pipeline
                        </h4>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Full Name</label>
                            <input
                                type="text"
                                value={candName}
                                onChange={(e) => setCandName(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Email Address</label>
                            <input
                                type="email"
                                value={candEmail}
                                onChange={(e) => setCandEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">Phone Number</label>
                            <input
                                type="text"
                                value={candPhone}
                                onChange={(e) => setCandPhone(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-stone-50 dark:bg-black/30 border border-stone-200 dark:border-white/10 rounded-xl text-xs"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsCandModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="woody-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                            >
                                Add Candidate
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
