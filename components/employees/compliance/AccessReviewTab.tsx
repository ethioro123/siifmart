import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Landmark, Search, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { useStore } from '../../../contexts/CentralStore';
import { hrAnalyticsService } from '../../../services/hr-analytics.service';
import { formatRole } from '../../../utils/formatting';

const PAGE_SIZE = 25;

export default function AccessReviewTab() {
    const { user, showToast } = useStore();
    const { employees, effectiveCountry } = useData();
    const country = (effectiveCountry || 'ET').toUpperCase();
    const currency = country === 'KE' ? 'KES' : 'ETB';

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All');
    const [filterDormantOnly, setFilterDormantOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [requestedUserIds, setRequestedUserIds] = useState<Set<string>>(new Set());

    // Compute Access Audit Records
    const accessRecords = useMemo(() => {
        return hrAnalyticsService.getAccessAuditReport(employees, country, 30);
    }, [employees, country]);

    // Unique Roles for Filter Selector
    const availableRoles = useMemo(() => {
        const roles = new Set<string>();
        accessRecords.forEach(r => {
            if (r.role) roles.add(r.role);
        });
        return Array.from(roles).sort();
    }, [accessRecords]);

    // Compute Statutory Report
    const statutoryReport = useMemo(() => {
        return hrAnalyticsService.getStatutoryComplianceReport(employees, country);
    }, [employees, country]);

    // Filter Records
    const filteredRecords = useMemo(() => {
        return accessRecords.filter(r => {
            const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.role.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = selectedRole === 'All' || r.role === selectedRole;
            const matchesDormant = !filterDormantOnly || r.is_dormant;
            return matchesSearch && matchesRole && matchesDormant;
        });
    }, [accessRecords, searchTerm, selectedRole, filterDormantOnly]);

    // Reset pagination when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRole, filterDormantOnly]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
    const pagedRecords = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredRecords.slice(start, start + PAGE_SIZE);
    }, [filteredRecords, currentPage]);

    const dormantCount = useMemo(() => {
        return accessRecords.filter(r => r.is_dormant).length;
    }, [accessRecords]);

    const handleRequestDeactivation = async (targetUserId: string, targetName: string) => {
        try {
            const success = await hrAnalyticsService.requestAccountDeactivation(
                targetUserId,
                { id: user?.id || 'hr_officer', name: user?.name || 'HR Officer', role: user?.role || 'hr' },
                'Dormant account inactivity > 30 days identified in HR security audit.'
            );
            if (success) {
                setRequestedUserIds(prev => new Set(prev).add(targetUserId));
                showToast(`Deactivation request logged for ${targetName}. Sent to CEO/Admin for 4-Eyes sign-off.`, 'success');
            } else {
                showToast('Failed to log deactivation request', 'error');
            }
        } catch {
            showToast('Failed to log deactivation request', 'error');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] flex items-center justify-center shrink-0">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                            Access Review & Dormant Account Audit
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            Role attribution, dormant account detection, and statutory compliance ({country})
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] text-xs font-semibold">
                        {dormantCount} Dormant Accounts Flagged
                    </span>
                </div>
            </div>

            {/* Statutory Compliance Executive Card */}
            <div className="p-5 bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] shadow-[var(--shadow-sm)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                            <Landmark size={16} />
                        </div>
                        <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                            National Statutory Compliance Overview: {statutoryReport.statutoryAuthority}
                        </h4>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] tabular-nums">
                        Active Roster: {statutoryReport.employeeCount} Personnel
                    </span>
                </div>

                <div className={`grid grid-cols-2 ${country === 'KE' ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-4'} gap-3`}>
                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                        <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1">
                            Gross Payroll
                        </span>
                        <p className="text-base font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">
                            {statutoryReport.totalGrossPayroll.toLocaleString()} {currency}
                        </p>
                    </div>

                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                        <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1">
                            {country === 'KE' ? 'PAYE Tax Withheld (KRA)' : 'Statutory Tax Withheld (ERCA)'}
                        </span>
                        <p className="text-base font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">
                            {statutoryReport.totalTaxWithheld.toLocaleString()} {currency}
                        </p>
                    </div>

                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                        <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1">
                            {country === 'KE' ? 'Pension Fund (NSSF)' : 'Pension Fund (POESSA 7%)'}
                        </span>
                        <p className="text-base font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">
                            {statutoryReport.totalPensionContributions.toLocaleString()} {currency}
                        </p>
                    </div>

                    {country === 'KE' && (
                        <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                            <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1">
                                SHIF (2.75%)
                            </span>
                            <p className="text-base font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">
                                {(statutoryReport.totalShifContributions || 0).toLocaleString()} {currency}
                            </p>
                        </div>
                    )}

                    <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]">
                        <span className="text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider block mb-1">
                            Net Disbursed
                        </span>
                        <p className="text-base font-semibold text-[var(--theme-text-primary)] font-mono tabular-nums">
                            {statutoryReport.netPayrollDisbursed.toLocaleString()} {currency}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] pointer-events-none" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search employee, email, or role..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] placeholder-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20"
                    />
                </div>

                <div className="sm:w-48">
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 cursor-pointer"
                    >
                        <option value="All">All Roles ({accessRecords.length})</option>
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{formatRole(role)}</option>
                        ))}
                    </select>
                </div>

                <label className="flex items-center gap-2 px-3.5 py-2.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-xs font-medium text-[var(--theme-text-primary)] cursor-pointer select-none shrink-0 hover:bg-[var(--theme-bg-subtle)] transition-colors">
                    <input
                        type="checkbox"
                        checked={filterDormantOnly}
                        onChange={(e) => setFilterDormantOnly(e.target.checked)}
                        className="rounded border-[var(--theme-border)] text-[var(--theme-accent)] focus:ring-0"
                    />
                    <span>Dormant Only (&gt; 30 Days)</span>
                </label>
            </div>

            {/* Audit Table */}
            <div className="bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] isolate overflow-hidden shadow-[var(--shadow-sm)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                        <thead className="bg-[var(--theme-bg-subtle)] border-b border-[var(--theme-border)] text-[var(--theme-text-secondary)] font-semibold text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="py-3.5 px-4">Personnel</th>
                                <th className="py-3.5 px-4">Assigned Role</th>
                                <th className="py-3.5 px-4">Last Login</th>
                                <th className="py-3.5 px-4">Security Status</th>
                                <th className="py-3.5 px-4 text-right">Zero-Trust Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--theme-border)]/60">
                            {pagedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-xs text-[var(--theme-text-secondary)]">
                                        No employee records match the active criteria.
                                    </td>
                                </tr>
                            ) : (
                                pagedRecords.map(rec => {
                                    const isPending = requestedUserIds.has(rec.user_id) || rec.deactivation_requested;
                                    return (
                                        <tr key={rec.user_id} className="hover:bg-[var(--theme-bg-subtle)]/50 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <p className="font-semibold text-[var(--theme-text-primary)]">{rec.name}</p>
                                                <p className="text-[11px] text-[var(--theme-text-secondary)] font-mono">{rec.email}</p>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono font-medium text-[var(--theme-text-primary)]">
                                                {formatRole(rec.role)}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono tabular-nums text-[var(--theme-text-secondary)]">
                                                {rec.last_login_at ? (
                                                    <span>{rec.days_since_last_login} days ago</span>
                                                ) : (
                                                    <span className="text-[var(--theme-text-secondary)]/70 italic">Never logged in</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {rec.is_dormant ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] text-[11px] font-semibold tracking-wide uppercase">
                                                        Dormant
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)] text-[11px] font-semibold tracking-wide uppercase">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                {rec.is_dormant && (
                                                    isPending ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)] text-[11px] font-semibold">
                                                            <Clock size={12} />
                                                            Pending 4-Eyes Sign-Off
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRequestDeactivation(rec.user_id, rec.name)}
                                                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[var(--theme-status-danger-bg)] bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.98]"
                                                        >
                                                            Request Deactivation
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Rule 10: 25 items default) */}
                {filteredRecords.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-secondary)]">
                        <span className="font-mono tabular-nums">
                            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length} records
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--theme-bg-subtle)] transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="font-mono tabular-nums font-semibold text-[var(--theme-text-primary)]">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--theme-bg-subtle)] transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
