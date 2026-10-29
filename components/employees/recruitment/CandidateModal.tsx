import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { recruitmentService } from '../../../services/recruitment.service';
import type { JobRequisition } from '../../../types/hr-advanced';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';

interface CandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    country: string;
    requisitions: JobRequisition[];
    selectedReqId: string | null;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    country,
    requisitions,
    selectedReqId
}) => {
    const { user, showToast } = useStore();
    const { sites, activeSite } = useData();

    const allowedRoles = recruitmentService.getAllowedRolesForManager(user?.role || '');
    const userRoleLevel = recruitmentService.getUserRoleLevel(user?.role || '');
    const isSiteManager = userRoleLevel === 3;
    const isRegional = ['regional_operations_manager', 'regional_supply_chain_manager', 'regional_hr_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_logistics_manager', 'regional_security_manager'].includes(user?.role || '')
        || (user?.role === 'talent_recruiter' && Boolean(user?.regionCode || (user as any)?.region_code));
    const userRegion = user?.regionCode || (user as any)?.region_code || activeSite?.regionCode || (activeSite as any)?.region_code;
    const regionalSites = isRegional && userRegion
        ? sites.filter(s => s.regionCode === userRegion || (s as any).region_code === userRegion)
        : sites;

    const defaultSiteId = isSiteManager
        ? (user?.siteId || activeSite?.id || '')
        : (isRegional ? (regionalSites.find(s => s.id === activeSite?.id)?.id || regionalSites[0]?.id || '') : (activeSite?.id || ''));

    const [reqId, setReqId] = useState(selectedReqId || '');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [siteId, setSiteId] = useState(defaultSiteId);
    const [role, setRole] = useState<string>(allowedRoles[0]?.id || 'stock_clerk');
    const [proposedSalary, setProposedSalary] = useState(country === 'KE' ? 35000 : 12000);
    const [interviewNotes, setInterviewNotes] = useState('');
    const [interviewScore, setInterviewScore] = useState(85);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const selectedReq = requisitions.find(r => r.id === reqId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const finalSiteId = selectedReq ? selectedReq.site_id : (siteId || user?.siteId || 'HQ');
            const finalRole = selectedReq ? selectedReq.role : role;

            await recruitmentService.createCandidate({
                country_code: country,
                requisition_id: reqId || undefined,
                site_id: finalSiteId,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim()
            });

            // Update candidate with initial manager evaluation & site
            showToast('Candidate enrolled in talent pipeline', 'success');
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err?.message || 'Failed to enroll candidate', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-[var(--theme-bg-panel)] rounded-3xl border border-[var(--theme-border)] shadow-[var(--shadow-modal)] p-6 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[var(--theme-status-info-bg)] text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <UserPlus size={16} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-base tracking-tight text-[var(--theme-text-primary)]">
                                Enroll Candidate for Sourcing
                            </h4>
                            <p className="text-xs text-[var(--theme-text-secondary)]">
                                Sourced candidates will be reviewed by HR & Finance before hire activation.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Requisition Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--theme-text-secondary)]">
                        Link to Requisition (Optional)
                    </label>
                    <select
                        value={reqId}
                        onChange={(e) => {
                            setReqId(e.target.value);
                            const r = requisitions.find(item => item.id === e.target.value);
                            if (r) {
                                setRole(r.role);
                                setProposedSalary(r.target_salary);
                            }
                        }}
                        className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal cursor-pointer"
                    >
                        <option value="">Direct Local Candidate (No Pre-linked Requisition)</option>
                        {requisitions.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.title} ({r.role}) — {r.department}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Candidate Info */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--theme-text-secondary)]">Candidate Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Samuel K. Mwangi"
                        required
                        className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--theme-text-secondary)]">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="samuel@example.com"
                            required
                            className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--theme-text-secondary)]">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+254 712 345 678"
                            required
                            className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] font-mono tabular-nums focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal"
                        />
                    </div>
                </div>

                {!selectedReq && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                Proposed Role (&lt; Your Level)
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal cursor-pointer"
                            >
                                {allowedRoles.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.label} (Level {r.level})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                Proposed Salary ({country === 'KE' ? 'KSh' : 'ETB'})
                            </label>
                            <input
                                type="number"
                                min="1000"
                                step="500"
                                value={proposedSalary}
                                onChange={(e) => setProposedSalary(Number(e.target.value))}
                                className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] font-mono tabular-nums focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal"
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--theme-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-10 px-4 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] active:scale-[0.98] transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !name.trim() || !email.trim()}
                        className="h-10 px-4 rounded-xl bg-[var(--theme-accent)] text-[var(--theme-accent-contrast)] hover:opacity-95 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                        {isSubmitting ? 'Enrolling...' : 'Enroll Candidate'}
                    </button>
                </div>
            </form>
        </div>
    );
};
