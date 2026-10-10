import React, { useState } from 'react';
import { X, ShieldAlert, Building2 } from 'lucide-react';
import { recruitmentService } from '../../../services/recruitment.service';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';

interface RequisitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    country: string;
}

export const RequisitionModal: React.FC<RequisitionModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    country
}) => {
    const { user, showToast } = useStore();
    const { sites, activeSite } = useData();

    const allowedRoles = recruitmentService.getAllowedRolesForManager(user?.role || '');
    const userRoleLevel = recruitmentService.getUserRoleLevel(user?.role || '');
    const isSiteManager = userRoleLevel === 3;

    // Default site locked for site managers
    const defaultSiteId = isSiteManager 
        ? (user?.siteId || activeSite?.id || '') 
        : (activeSite?.id || sites[0]?.id || '');

    const [siteId, setSiteId] = useState(defaultSiteId);
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState('Operations');
    const [role, setRole] = useState<string>(allowedRoles[0]?.id || 'stock_clerk');
    const [headcount, setHeadcount] = useState(1);
    const [targetSalary, setTargetSalary] = useState(country === 'KE' ? 35000 : 12000);
    const [justification, setJustification] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (allowedRoles.length === 0) {
            showToast('Your role level does not permit initiating headcount requisitions', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await recruitmentService.createRequisition({
                country_code: country,
                site_id: siteId || user?.siteId || 'HQ',
                title: title.trim(),
                department,
                role,
                headcount: Number(headcount),
                target_salary: Number(targetSalary),
                justification: justification.trim(),
                requested_by: user?.name || 'Manager',
                requested_by_role: user?.role || 'manager'
            });
            showToast('Requisition logged and forwarded to HR for 4-Eyes sign-off', 'success');
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err?.message || 'Failed to create requisition', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeSiteObj = sites.find(s => s.id === siteId);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-[var(--theme-bg-panel)] rounded-3xl border border-[var(--theme-border)] shadow-[var(--shadow-modal)] p-6 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
                    <div>
                        <h4 className="font-semibold text-base tracking-tight text-[var(--theme-text-primary)]">
                            Submit Headcount Requisition
                        </h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Delegated sourcing strictly restricted to roles below your rank at your location.
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

                {allowedRoles.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <ShieldAlert size={16} className="shrink-0" />
                        <span>Staff-level roles are restricted from opening headcount requisitions.</span>
                    </div>
                ) : (
                    <>
                        {/* Location Lock Indicator */}
                        <div className="p-3 rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-[var(--theme-text-secondary)]">
                                <Building2 size={15} className="text-[#0071E3] dark:text-[#2997FF]" />
                                <span className="font-medium">Assigned Location:</span>
                            </div>
                            {isSiteManager ? (
                                <span className="font-semibold font-mono text-[var(--theme-text-primary)]">
                                    {activeSiteObj?.name || user?.siteId || 'Assigned Site'} (Locked)
                                </span>
                            ) : (
                                <select
                                    value={siteId}
                                    onChange={(e) => setSiteId(e.target.value)}
                                    className="bg-transparent font-semibold text-[var(--theme-text-primary)] outline-none cursor-pointer"
                                >
                                    {sites.filter(s => !s.country || s.country === country).map(s => (
                                        <option key={s.id} value={s.id} className="bg-[var(--theme-bg-panel)]">
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Title & Department */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--theme-text-secondary)]">Job Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Day Shift Order Picker"
                                    required
                                    className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--theme-text-secondary)]">Department</label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal cursor-pointer"
                                >
                                    <option value="Operations">Operations / WMS</option>
                                    <option value="Store Operations">Store Operations</option>
                                    <option value="Logistics">Logistics & Dispatch</option>
                                    <option value="Customer Support">Customer Support</option>
                                    <option value="Inventory Control">Inventory Control</option>
                                </select>
                            </div>
                        </div>

                        {/* Role selection strictly filtered below manager's level */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                Position Role (Strictly &lt; Your Level)
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal cursor-pointer"
                            >
                                {allowedRoles.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.label} (Level {r.level}) — {r.desc}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Headcount and Salary */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--theme-text-secondary)]">Headcount Openings</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={headcount}
                                    onChange={(e) => setHeadcount(Number(e.target.value))}
                                    className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] font-mono tabular-nums focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-[var(--theme-text-secondary)]">
                                    Target Salary ({country === 'KE' ? 'KSh' : 'ETB'})
                                </label>
                                <input
                                    type="number"
                                    min="1000"
                                    step="500"
                                    value={targetSalary}
                                    onChange={(e) => setTargetSalary(Number(e.target.value))}
                                    className="w-full h-10 px-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] font-mono tabular-nums focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal"
                                />
                            </div>
                        </div>

                        {/* Justification */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[var(--theme-text-secondary)]">Operational Justification</label>
                            <textarea
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                placeholder="Explain why your department or floor needs this headcount..."
                                rows={2}
                                required
                                className="w-full p-3 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] resize-none focus:ring-2 focus:ring-[#0071E3]/25 outline-none font-normal"
                            />
                        </div>

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
                                disabled={isSubmitting || !title.trim()}
                                className="h-10 px-4 rounded-xl bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit to HR & Finance'}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};
