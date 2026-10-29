import React, { useState, useMemo } from 'react';
import { X, ClipboardCheck, DollarSign, ShieldAlert, CheckCircle2, AlertTriangle, Building2, UserCheck } from 'lucide-react';
import type { Site, Employee } from '../../../types';
import type { Country } from '../../../utils/localization';
import type { StoreOperationsAudit, StoreAuditType, StoreAuditStatus } from '../types';
import { storeAuditsService } from '../../../services/store-audits.service';
import { logger } from '../../../utils/logger';

interface StoreAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuditSubmitted: (audit: StoreOperationsAudit) => void;
    sites: Site[];
    employees: Employee[];
    activeCountry: Country;
    currentUserId?: string;
    currentUserName?: string;
}

export const StoreAuditModal: React.FC<StoreAuditModalProps> = ({
    isOpen,
    onClose,
    onAuditSubmitted,
    sites,
    employees,
    activeCountry,
    currentUserId = 'EMP-OPS-001',
    currentUserName = 'Operations Specialist'
}) => {
    // Only retail stores
    const retailStores = useMemo(() => {
        return sites.filter(s => s.type === 'Store');
    }, [sites]);

    const [selectedSiteId, setSelectedSiteId] = useState<string>(retailStores[0]?.id || '');
    const [managerOnDutyId, setManagerOnDutyId] = useState<string>('');
    const [auditType, setAuditType] = useState<StoreAuditType>('unannounced_walkthrough');
    const [planogramScore, setPlanogramScore] = useState<number>(95);
    const [shelfHygieneScore, setShelfHygieneScore] = useState<number>(92);
    const [halalCompliant, setHalalCompliant] = useState<boolean>(true);
    const [planogramNotes, setPlanogramNotes] = useState<string>('Shelf tags aligned with HQ pricing; endcaps verified.');

    // Cash Spot Audit
    const [registerId, setRegisterId] = useState<string>('POS-REG-01');
    const [cashCounted, setCashCounted] = useState<string>('2450');
    const [cashExpected, setCashExpected] = useState<string>('2450');

    // Findings & Actions
    const [findings, setFindings] = useState<string>('');
    const [correctiveActions, setCorrectiveActions] = useState<string>('');
    const [status, setStatus] = useState<StoreAuditStatus>('passed');
    const [managerCoSigned, setManagerCoSigned] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Filter staff for selected site
    const siteManagers = useMemo(() => {
        return employees.filter(e =>
            (!e.site_id || e.site_id === selectedSiteId || e.siteId === selectedSiteId) &&
            ['store_manager', 'assistant_store_manager', 'shift_supervisor'].includes(e.role || '')
        );
    }, [employees, selectedSiteId]);

    const selectedSite = useMemo(() => {
        return sites.find(s => s.id === selectedSiteId);
    }, [sites, selectedSiteId]);

    const selectedManager = useMemo(() => {
        return siteManagers.find(m => m.id === managerOnDutyId);
    }, [siteManagers, managerOnDutyId]);

    const countedNum = parseFloat(cashCounted) || 0;
    const expectedNum = parseFloat(cashExpected) || 0;
    const cashVariance = countedNum - expectedNum;

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSiteId) return;

        setIsSubmitting(true);
        try {
            const audit = await storeAuditsService.createAudit({
                country_code: activeCountry,
                site_id: selectedSiteId,
                site_name: selectedSite?.name || selectedSiteId,
                auditor_id: currentUserId,
                auditor_name: currentUserName,
                manager_on_duty_id: managerOnDutyId || undefined,
                manager_on_duty_name: selectedManager?.name || undefined,
                audit_type: auditType,
                planogram_score: planogramScore,
                planogram_notes: planogramNotes,
                shelf_hygiene_score: shelfHygieneScore,
                halal_catalog_compliant: halalCompliant,
                cash_counted: countedNum,
                cash_expected: expectedNum,
                cash_variance: cashVariance,
                register_id: registerId,
                findings: findings || 'Routine spot inspection completed without critical deviations.',
                corrective_actions: correctiveActions || undefined,
                status: status
            });

            onAuditSubmitted(audit);
            onClose();
        } catch (err) {
            logger.error('StoreAuditModal', 'Failed to save audit', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-2xl p-6 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--theme-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] flex items-center justify-center shrink-0">
                            <ClipboardCheck size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
                                Unannounced Store Walkthrough & Cash Spot Audit
                            </h3>
                            <p className="text-xs text-[var(--theme-text-muted)]">
                                Central Operations Zero-Trust Field Inspection Suite • Sovereign Instance ({activeCountry})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] transition-colors active:scale-95"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[72vh] overflow-y-auto pr-1">
                    {/* Facility & Auditor Line */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-1">
                                Target Retail Facility
                            </label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-2.5 text-[var(--theme-text-muted)]" />
                                <select
                                    value={selectedSiteId}
                                    onChange={(e) => {
                                        setSelectedSiteId(e.target.value);
                                        setManagerOnDutyId('');
                                    }}
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium focus:ring-1 focus:ring-[var(--theme-primary)] focus:outline-none"
                                    required
                                >
                                    {retailStores.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code || s.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-1">
                                Manager On Duty (Supervisory Co-Signer)
                            </label>
                            <div className="relative">
                                <UserCheck size={16} className="absolute left-3 top-2.5 text-[var(--theme-text-muted)]" />
                                <select
                                    value={managerOnDutyId}
                                    onChange={(e) => setManagerOnDutyId(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-medium focus:ring-1 focus:ring-[var(--theme-primary)] focus:outline-none"
                                >
                                    <option value="">Select On-Duty Lead / Manager</option>
                                    {siteManagers.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.role?.replace(/_/g, ' ')})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Inspection Type Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-1">
                            Inspection Protocol
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: 'unannounced_walkthrough', label: 'Walkthrough' },
                                { id: 'cash_spot_audit', label: 'Cash Spot Audit' },
                                { id: 'planogram_check', label: 'Planogram' },
                                { id: 'full_inspection', label: 'Full Audit' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setAuditType(t.id as StoreAuditType)}
                                    className={`px-3 py-2 text-xs rounded-xl font-semibold border transition-all text-center active:scale-[0.98] ${
                                        auditType === t.id
                                            ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border-transparent shadow-sm'
                                            : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:border-[var(--theme-border-strong)]'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Planogram & Hygiene Scores */}
                    <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                                <ClipboardCheck size={14} className="text-[var(--theme-primary)]" />
                                Planogram & Shelf Hygiene Standards
                            </span>
                            <span className="text-xs font-mono tabular-nums font-semibold text-[var(--theme-primary)]">
                                Score: {planogramScore}%
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                                    Planogram Compliance ({planogramScore}%)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={planogramScore}
                                    onChange={(e) => setPlanogramScore(Number(e.target.value))}
                                    className="w-full accent-[var(--theme-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                                    Shelf Hygiene & Tagging ({shelfHygieneScore}%)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={shelfHygieneScore}
                                    onChange={(e) => setShelfHygieneScore(Number(e.target.value))}
                                    className="w-full accent-[var(--theme-primary)]"
                                />
                            </div>
                        </div>

                        {/* Halal / Non-Alcoholic Rule 17 Compliance */}
                        <label className="flex items-center gap-2 pt-1 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={halalCompliant}
                                onChange={(e) => setHalalCompliant(e.target.checked)}
                                className="rounded text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                            />
                            <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                                Verified Zero-Alcohol & Halal Catalog Compliance (Rule 17 passed)
                            </span>
                        </label>
                    </div>

                    {/* Cash Drawer Spot Audit */}
                    <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                                <DollarSign size={14} className="text-[var(--theme-primary)]" />
                                Cash Register Drawer Spot Count
                            </span>
                            <span className={`text-xs font-mono tabular-nums font-semibold px-2 py-0.5 rounded-full ${
                                cashVariance === 0
                                    ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]'
                                    : cashVariance > 0
                                    ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]'
                                    : 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]'
                            }`}>
                                Variance: {cashVariance >= 0 ? `+${cashVariance.toFixed(2)}` : cashVariance.toFixed(2)} {activeCountry === 'KE' ? 'KSh' : 'ETB'}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                                    Register ID
                                </label>
                                <input
                                    type="text"
                                    value={registerId}
                                    onChange={(e) => setRegisterId(e.target.value)}
                                    placeholder="POS-REG-01"
                                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                                    Cash Counted
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={cashCounted}
                                    onChange={(e) => setCashCounted(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] mb-1">
                                    Expected Balance
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={cashExpected}
                                    onChange={(e) => setCashExpected(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Findings & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-1">
                                Key Audit Findings
                            </label>
                            <textarea
                                value={findings}
                                onChange={(e) => setFindings(e.target.value)}
                                rows={2}
                                placeholder="Shelf facing, stock alignment, price tag accuracy..."
                                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] mb-1">
                                Required Corrective Actions
                            </label>
                            <textarea
                                value={correctiveActions}
                                onChange={(e) => setCorrectiveActions(e.target.value)}
                                rows={2}
                                placeholder="Actions required within 24 hours..."
                                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
                            />
                        </div>
                    </div>

                    {/* Status & Co-Sign */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--theme-text-secondary)]">
                                Audit Result:
                            </span>
                            <div className="flex items-center gap-1">
                                {[
                                    { id: 'passed', label: 'Pass', color: 'emerald' },
                                    { id: 'action_required', label: 'Action Req.', color: 'amber' },
                                    { id: 'escalated_to_hq', label: 'Escalate HQ', color: 'rose' }
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setStatus(s.id as StoreAuditStatus)}
                                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all active:scale-[0.98] ${
                                            status === s.id
                                                ? s.id === 'passed' ? 'bg-[var(--theme-status-success-bg)] text-white' : s.id === 'action_required' ? 'bg-[var(--theme-status-warning-bg)] text-white' : 'bg-[var(--theme-status-danger-bg)] text-white'
                                                : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={managerCoSigned}
                                onChange={(e) => setManagerCoSigned(e.target.checked)}
                                className="rounded text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
                                required
                            />
                            <span className="text-xs text-[var(--theme-text-secondary)] font-semibold">
                                Manager on duty acknowledges findings
                            </span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--theme-border)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] rounded-xl hover:bg-[var(--theme-bg-subtle)] active:scale-98 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !managerCoSigned}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--theme-primary)] hover:opacity-90 disabled:opacity-50 text-[var(--theme-primary-text)] text-xs font-semibold transition-all shadow-sm active:scale-98 cursor-pointer"
                        >
                            <ClipboardCheck size={16} />
                            <span>{isSubmitting ? 'Recording Audit...' : 'Submit & Sign Off Audit'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
