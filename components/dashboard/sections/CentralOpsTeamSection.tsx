import React, { useState, useEffect } from 'react';
import {
    Users, BarChart3, ShieldCheck, Headphones, ClipboardCheck,
    Store, Plus, CheckCircle2, AlertTriangle
} from 'lucide-react';
import type { Employee, Site } from '../../../types';
import type { Country } from '../../../utils/localization';
import type { StoreOperationsAudit } from '../types';
import { storeAuditsService } from '../../../services/store-audits.service';
import { StoreAuditModal } from '../modals/StoreAuditModal';

interface CentralOpsTeamSectionProps {
    employees: Employee[];
    sites: Site[];
    activeCountry: Country;
    currencySymbol: string;
}

export const CentralOpsTeamSection: React.FC<CentralOpsTeamSectionProps> = ({
    employees,
    sites,
    activeCountry,
    currencySymbol
}) => {
    const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
    const [audits, setAudits] = useState<StoreOperationsAudit[]>([]);
    const [loadingAudits, setLoadingAudits] = useState<boolean>(true);

    // Filter team members based on active country
    const countryEmployees = employees.filter(e => {
        const empCountry = (((e as any).country_code || (e as any).countryCode || 'ET') as string).toUpperCase();
        return empCountry === activeCountry;
    });

    const opsManager = countryEmployees.find(e => e.role === 'operations_manager');
    const dataAnalysts = countryEmployees.filter(e => e.role === 'data_analyst');
    const securityTeam = countryEmployees.filter(e => e.role === 'security_manager' || e.role === 'loss_prevention');
    const csTeam = countryEmployees.filter(e => e.role === 'cs_manager' || e.role === 'customer_service');
    const auditors = countryEmployees.filter(e => e.role === 'store_operations_auditor');
    const storeManagers = countryEmployees.filter(e => e.role === 'store_manager');
    const whManagers = countryEmployees.filter(e => e.role === 'warehouse_manager');

    const loadAudits = async () => {
        setLoadingAudits(true);
        try {
            const data = await storeAuditsService.fetchAudits(activeCountry);
            setAudits(data);
        } catch {
            // Handled in service
        } finally {
            setLoadingAudits(false);
        }
    };

    useEffect(() => {
        loadAudits();
    }, [activeCountry]);

    const handleAuditSubmitted = (newAudit: StoreOperationsAudit) => {
        setAudits(prev => [newAudit, ...prev]);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header & Command Charter */}
            <div className="p-6 bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] rounded-3xl border border-[var(--theme-border)] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Users size={160} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]">
                                Operations Directorate • Level 2 (Rank 90)
                            </span>
                            <span className="text-xs text-[var(--theme-text-muted)] font-mono">SOP-MGT-021</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-[var(--theme-text-primary)]">
                            Central Operations Team
                        </h2>
                        <p className="text-xs text-[var(--theme-text-secondary)] max-w-2xl mt-1 leading-relaxed">
                            Command control room orchestrating enterprise network fulfillment, shift velocity, loss prevention, customer advocacy, and unannounced field walkthroughs across all sovereign facilities.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAuditModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>New Walkthrough / Spot Audit</span>
                        </button>
                    </div>
                </div>

                {/* Operations Manager In-Charge Card */}
                <div className="mt-6 pt-6 border-t border-[var(--theme-border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Commanding Officer</span>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] mt-0.5">
                            {opsManager ? opsManager.name : 'Operations Manager (HQ)'}
                        </p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">Head of Central Operations</p>
                    </div>
                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Field Leadership</span>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] mt-0.5">
                            {storeManagers.length} Stores • {whManagers.length} Hubs
                        </p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">Direct Supervisory Line</p>
                    </div>
                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Field Audit Force</span>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] mt-0.5">
                            {auditors.length} Store Operations Auditors
                        </p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">Unannounced Inspections</p>
                    </div>
                    <div className="p-3 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)]">
                        <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Central Desk Force</span>
                        <p className="text-sm font-bold text-[var(--theme-text-primary)] mt-0.5">
                            {dataAnalysts.length} Analysts • {securityTeam.length} LP • {csTeam.length} CS
                        </p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium">HQ Operational Control</p>
                    </div>
                </div>
            </div>

            {/* The 4 Functional Pods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Analytics & Telemetry Pod */}
                <div className="p-5 bg-[var(--theme-bg-card)] rounded-3xl border border-[var(--theme-border)] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] flex items-center justify-center">
                                <BarChart3 size={20} />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                telemetry
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">
                            Analytics & Telemetry Pod
                        </h3>
                        <p className="text-xs text-[var(--theme-text-muted)] font-medium mt-1">
                            Role: <span className="font-bold text-[var(--theme-text-secondary)]">data_analyst</span>
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-2 leading-relaxed">
                            Central Ops dashboards, shift velocity metrics, gross margin telemetry, and regional demand forecasting.
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] text-[11px] text-[var(--theme-text-muted)] flex items-center justify-between">
                        <span>Staff Assigned:</span>
                        <span className="font-bold text-[var(--theme-text-primary)]">{dataAnalysts.length} Active</span>
                    </div>
                </div>

                {/* 2. Loss Prevention & Security Pod */}
                <div className="p-5 bg-[var(--theme-bg-card)] rounded-3xl border border-[var(--theme-border)] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] flex items-center justify-center">
                                <ShieldCheck size={20} />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                security
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">
                            Security & Loss Prevention
                        </h3>
                        <p className="text-xs text-[var(--theme-text-muted)] font-medium mt-1">
                            Role: <span className="font-bold text-[var(--theme-text-secondary)]">security_manager</span> (Level 3)
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-2 leading-relaxed">
                            Loss prevention, CCTV incident reports, security guard coordination, and tamper-proof shrink alerts.
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] text-[11px] text-[var(--theme-text-muted)] flex items-center justify-between">
                        <span>Staff Assigned:</span>
                        <span className="font-bold text-[var(--theme-text-primary)]">{securityTeam.length} Active</span>
                    </div>
                </div>

                {/* 3. Customer Care & Advocacy Pod */}
                <div className="p-5 bg-[var(--theme-bg-card)] rounded-3xl border border-[var(--theme-border)] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] flex items-center justify-center">
                                <Headphones size={20} />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                cs_desk
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">
                            Customer Care & Support
                        </h3>
                        <p className="text-xs text-[var(--theme-text-muted)] font-medium mt-1">
                            Role: <span className="font-bold text-[var(--theme-text-secondary)]">cs_manager & cs</span>
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-2 leading-relaxed">
                            Customer complaints, dual-control refund reviews, loyalty desk operations, and service quality ratings.
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] text-[11px] text-[var(--theme-text-muted)] flex items-center justify-between">
                        <span>Staff Assigned:</span>
                        <span className="font-bold text-[var(--theme-text-primary)]">{csTeam.length} Active</span>
                    </div>
                </div>

                {/* 4. Store Operations Auditor Pod */}
                <div className="p-5 bg-[var(--theme-bg-card)] rounded-3xl border border-[var(--theme-border)] shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-[var(--theme-primary)]" />
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] flex items-center justify-center">
                                <ClipboardCheck size={20} />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]">
                                audit force
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-[var(--theme-text-primary)]">
                            Store Operations Auditor
                        </h3>
                        <p className="text-xs text-[var(--theme-text-muted)] font-medium mt-1">
                            Role: <span className="font-bold text-[var(--theme-text-secondary)]">store_operations_auditor</span>
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-2 leading-relaxed">
                            Conducts unannounced store walkthroughs, planogram & merchandising checks, and cash handling spot audits.
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--theme-border)] text-[11px] text-[var(--theme-text-muted)] flex items-center justify-between">
                        <span>Auditors Fielded:</span>
                        <span className="font-bold text-[var(--theme-text-primary)]">{auditors.length} Active</span>
                    </div>
                </div>
            </div>

            {/* Direct Reporting Lines Bar */}
            <div className="p-4 bg-[var(--theme-bg-subtle)] rounded-2xl border border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)]">
                        <Store size={16} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-[var(--theme-text-primary)]">
                            Direct Field Reporting Doctrine
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            All Store Managers ({storeManagers.length}) and Warehouse Managers ({whManagers.length}) report directly to the Operations Manager under Captain Owns the Ship accountability.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[11px] font-bold text-[var(--theme-text-secondary)]">
                        Zero-Trust Compliance:
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--theme-text-primary)]">
                        <CheckCircle2 size={13} /> Active
                    </span>
                </div>
            </div>

            {/* Unannounced Walkthroughs & Cash Audits Feed */}
            <div className="bg-[var(--theme-bg-card)] rounded-3xl border border-[var(--theme-border)] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[var(--theme-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--theme-text-primary)] flex items-center gap-2">
                            <ClipboardCheck size={18} className="text-[var(--theme-text-primary)]" />
                            Recent Field Inspections & Cash Spot Audits
                        </h3>
                        <p className="text-xs text-[var(--theme-text-muted)] mt-0.5">
                            Audit log recorded by Store Operations Auditors • Sovereign Instance ({activeCountry})
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAuditModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:opacity-90 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                        <Plus size={14} />
                        <span>Perform Walkthrough</span>
                    </button>
                </div>

                {loadingAudits ? (
                    <div className="p-8 text-center text-xs text-[var(--theme-text-muted)]">
                        Loading audit logs...
                    </div>
                ) : audits.length === 0 ? (
                    <div className="p-8 text-center">
                        <ClipboardCheck size={36} className="mx-auto text-[var(--theme-text-muted)] mb-2" />
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">No Audits Recorded Yet</h4>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-sm mx-auto">
                            Store Operations Auditors conduct unannounced store walkthroughs, planogram verification, and cash handling spot audits.
                        </p>
                        <button
                            onClick={() => setIsAuditModalOpen(true)}
                            className="mt-4 px-4 py-2 rounded-xl bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-xs font-bold cursor-pointer"
                        >
                            Launch First Walkthrough
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] font-semibold border-b border-[var(--theme-border)]">
                                <tr>
                                    <th className="py-3 px-4">Date & Time</th>
                                    <th className="py-3 px-4">Target Store</th>
                                    <th className="py-3 px-4">Auditor / Co-Sign</th>
                                    <th className="py-3 px-4">Planogram</th>
                                    <th className="py-3 px-4">Cash Variance</th>
                                    <th className="py-3 px-4">Halal Status</th>
                                    <th className="py-3 px-4">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--theme-border)] text-[var(--theme-text-secondary)] font-medium">
                                {audits.map(audit => (
                                    <tr key={audit.id} className="hover:bg-[var(--theme-bg-subtle)]">
                                        <td className="py-3 px-4 font-mono text-[11px] text-[var(--theme-text-primary)]">
                                            {new Date(audit.created_at).toLocaleDateString()} {new Date(audit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-[var(--theme-text-primary)]">
                                            {audit.site_name || audit.site_id}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-[var(--theme-text-primary)]">{audit.auditor_name}</div>
                                            {audit.manager_on_duty_name && (
                                                <div className="text-[10px] text-[var(--theme-text-muted)]">
                                                    Co-Signed: {audit.manager_on_duty_name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 font-mono">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                audit.planogram_score >= 90
                                                    ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                                                    : audit.planogram_score >= 75
                                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                                            }`}>
                                                {audit.planogram_score}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-[11px]">
                                            {audit.cash_variance !== undefined && audit.cash_variance !== null ? (
                                                <span className={`font-bold ${
                                                    audit.cash_variance === 0
                                                        ? 'text-[var(--theme-text-primary)]'
                                                        : audit.cash_variance > 0
                                                        ? 'text-blue-500'
                                                        : 'text-rose-500'
                                                }`}>
                                                    {audit.cash_variance >= 0 ? `+${audit.cash_variance.toFixed(2)}` : audit.cash_variance.toFixed(2)} {currencySymbol}
                                                </span>
                                            ) : (
                                                <span className="text-[var(--theme-text-muted)]">N/A</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {audit.halal_catalog_compliant ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--theme-text-primary)]">
                                                    <CheckCircle2 size={12} /> Compliant
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-rose-500">
                                                    <AlertTriangle size={12} /> Violation
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                audit.status === 'passed'
                                                    ? 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                                                    : audit.status === 'action_required'
                                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                                            }`}>
                                                {audit.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Audit Modal */}
            <StoreAuditModal
                isOpen={isAuditModalOpen}
                onClose={() => setIsAuditModalOpen(false)}
                onAuditSubmitted={handleAuditSubmitted}
                sites={sites}
                employees={employees}
                activeCountry={activeCountry}
                currentUserId={opsManager?.id}
                currentUserName={opsManager?.name}
            />
        </div>
    );
};
