import React from 'react';
import { Employee, Site } from '../../../types';
import { DEPT_COLORS } from '../types';
import { getRoleDept } from '../hooks/useOrgTreeLayout';
import { X, Mail, Phone, MapPin, Award, Calendar, Shield, ExternalLink, Copy, Check, CreditCard, UserCheck, AlertCircle } from 'lucide-react';
import { formatDisplayEmployeeId } from '../../../utils/employeeIdGenerator';
import { getEmployeeJobTitle, getRoleHierarchy } from '../../../utils/roles';

interface EmployeeDetailDrawerProps {
    employee: Employee | null;
    employees?: Employee[];
    sites?: Site[];
    canEditReportingLines?: boolean;
    onSaveReportingLines?: (employee: Employee) => Promise<void> | void;
    isDark: boolean;
    onlineIds?: Set<string>;
    onClose: () => void;
    onOpenProfile?: (employee: Employee) => void;
    onOpenIdCard?: (employee: Employee) => void;
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
    employee,
    employees = [],
    sites = [],
    canEditReportingLines = false,
    onSaveReportingLines,
    isDark,
    onlineIds,
    onClose,
    onOpenProfile,
    onOpenIdCard
}) => {
    const [copiedEmail, setCopiedEmail] = React.useState(false);
    const [copiedPhone, setCopiedPhone] = React.useState(false);
    const [primaryManagerId, setPrimaryManagerId] = React.useState('');
    const [functionalManagerId, setFunctionalManagerId] = React.useState('');
    const [savingReportingLines, setSavingReportingLines] = React.useState(false);
    const [reportingMessage, setReportingMessage] = React.useState('');

    React.useEffect(() => {
        setPrimaryManagerId(employee?.reportsToEmployeeId || employee?.reports_to_employee_id || '');
        setFunctionalManagerId(employee?.functionalManagerEmployeeId || employee?.functional_manager_employee_id || '');
        setReportingMessage('');
    }, [employee?.id, employee?.reportsToEmployeeId, employee?.reports_to_employee_id, employee?.functionalManagerEmployeeId, employee?.functional_manager_employee_id]);

    if (!employee) return null;

    const isOnline = onlineIds ? onlineIds.has(employee.id) : false;
    const roleTitle = getEmployeeJobTitle(employee);
    const dept = getRoleDept(employee.role, employee.department);
    const deptColors = DEPT_COLORS[dept] || DEPT_COLORS.support;
    const siteObj = sites.find(s => s.id === (employee.siteId || employee.site_id));
    const siteName = siteObj?.name || 'Central Operations / HQ';
    const employeeCountry = employee.country || employee.country_code || siteObj?.country;
    const reportableEmployees = employees.filter(candidate => {
        if (candidate.id === employee.id || candidate.status !== 'Active') return false;
        if (getRoleHierarchy(candidate.role) <= getRoleHierarchy(employee.role)) return false;
        const candidateSite = sites.find(site => site.id === (candidate.siteId || candidate.site_id));
        const candidateCountry = candidate.country || candidate.country_code || candidateSite?.country;
        const globalExecutives = ['group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae'];
        const countryMatches = !employeeCountry || (candidateCountry
            ? String(candidateCountry).toUpperCase() === String(employeeCountry).toUpperCase()
            : globalExecutives.includes(candidate.role));
        const employeeRegion = employee.regionCode || employee.region_code;
        const candidateRegion = candidate.regionCode || candidate.region_code || candidateSite?.regionCode || candidateSite?.region_code;
        const regionMatches = employee.scopeLevel !== 'REGIONAL'
            || candidate.scopeLevel !== 'REGIONAL'
            || !employeeRegion
            || !candidateRegion
            || employeeRegion.toLowerCase() === candidateRegion.toLowerCase();
        return countryMatches && regionMatches;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const saveReportingLines = async () => {
        if (!onSaveReportingLines) return;
        setSavingReportingLines(true);
        setReportingMessage('');
        try {
            await onSaveReportingLines({
                ...employee,
                reportsToEmployeeId: primaryManagerId || undefined,
                functionalManagerEmployeeId: functionalManagerId || undefined
            });
            setReportingMessage('Reporting relationships saved.');
        } catch {
            setReportingMessage('Could not save reporting relationships. Check the employee’s country and region scope.');
        } finally {
            setSavingReportingLines(false);
        }
    };

    const avatar = employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=2C5E3B&color=EAE5D9&size=160`;

    const handleCopyEmail = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (employee.email) {
            navigator.clipboard.writeText(employee.email);
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);
        }
    };

    const handleCopyPhone = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (employee.phone) {
            navigator.clipboard.writeText(employee.phone);
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] animate-fadeIn" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md h-full flex flex-col shadow-2xl border-l animate-slideLeft ${
                    isDark ? 'bg-[var(--theme-bg-panel)] border-[#2C4D35] text-[var(--theme-text-primary)]' : 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] text-[var(--theme-text-primary)]'
                }`}
            >
                {/* Header with Close */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                        Employee Hierarchy Profile
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer"
                        title="Close profile drawer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Profile Overview Card */}
                <div className="p-6 border-b border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] flex items-center gap-4">
                    <div className="relative shrink-0">
                        <img
                            src={avatar}
                            alt={employee.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--theme-border)]/30 border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)] shadow-md"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=2C5E3B&color=EAE5D9&size=160`;
                            }}
                        />
                        <div
                            title={isOnline ? 'Online now' : 'Offline'}
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--theme-border)] dark:border-[var(--theme-border)] transition-colors duration-500 ${
                                isOnline
                                    ? 'bg-[var(--theme-status-success-bg)] shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse'
                                    : 'bg-[var(--theme-bg-card-hover)] bg-[var(--theme-bg-card-hover)]'
                            }`}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg leading-tight truncate">
                                {employee.name}
                            </h3>
                            {employee.code && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_40%,transparent)] text-[var(--theme-primary)] text-[var(--theme-status-success-text)]">
                                    {formatDisplayEmployeeId(employee)}
                                </span>
                            )}
                        </div>

                        <p className="text-sm font-semibold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] mt-0.5">
                            {roleTitle}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                    backgroundColor: isDark ? deptColors.bgDark : deptColors.bg,
                                    color: isDark ? deptColors.textDark : deptColors.text,
                                    border: `1px solid ${isDark ? deptColors.borderDark : deptColors.border}`
                                }}
                            >
                                {dept.toUpperCase()}
                            </span>
                            <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    employee.status === 'Active'
                                        ? 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]'
                                        : employee.status === 'On Leave'
                                        ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]'
                                        : 'bg-[color-mix(in_srgb,var(--theme-bg-card-hover)_10%,transparent)] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] border border-[color-mix(in_srgb,var(--theme-border)_20%,transparent)]'
                                }`}
                            >
                                {employee.status || 'Active'}
                            </span>
                            <span className="text-[11px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] flex items-center gap-1 truncate">
                                <MapPin size={11} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] shrink-0" />
                                <span className="truncate">{siteName}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Performance & Metrics */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] mb-3">
                            Key Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)]' : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)]'}`}>
                                <div className="text-[11px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">Performance Score</div>
                                <div className="text-lg font-bold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] mt-0.5">
                                    {employee.performanceScore ? `${employee.performanceScore}%` : 'N/A'}
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[var(--theme-bg-panel)] border-[var(--theme-border)]' : 'bg-[var(--theme-bg-app)] border-[var(--theme-border)]'}`}>
                                <div className="text-[11px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">Attendance Rate</div>
                                <div className="text-lg font-bold text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] mt-0.5">
                                    {employee.attendanceRate ? `${employee.attendanceRate}%` : '98%'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {canEditReportingLines && onSaveReportingLines && (
                        <section className="rounded-xl border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] p-3.5 space-y-3" aria-label="Reporting relationships">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)]">Reporting Relationships</h4>
                            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                                Primary manager
                                <select value={primaryManagerId} onChange={event => setPrimaryManagerId(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] px-3 py-2 text-sm text-[var(--theme-text-primary)] text-[var(--theme-text-primary)]">
                                    <option value="">Unassigned</option>
                                    {reportableEmployees.map(manager => <option key={manager.id} value={manager.id}>{manager.name} · {getEmployeeJobTitle(manager)}</option>)}
                                </select>
                            </label>
                            <label className="block text-[11px] font-semibold text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                                Functional manager
                                <select value={functionalManagerId} onChange={event => setFunctionalManagerId(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] px-3 py-2 text-sm text-[var(--theme-text-primary)] text-[var(--theme-text-primary)]">
                                    <option value="">Unassigned</option>
                                    {reportableEmployees.map(manager => <option key={manager.id} value={manager.id}>{manager.name} · {getEmployeeJobTitle(manager)}</option>)}
                                </select>
                            </label>
                            {reportingMessage && <p role="status" className="text-[11px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">{reportingMessage}</p>}
                            <button type="button" onClick={saveReportingLines} disabled={savingReportingLines} className="w-full rounded-lg bg-[var(--theme-primary)] px-3 py-2 text-xs font-bold text-[var(--theme-text-primary)] disabled:opacity-50">
                                {savingReportingLines ? 'Saving…' : 'Save reporting relationships'}
                            </button>
                        </section>
                    )}

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] mb-3">
                            Contact Information
                        </h4>
                        <div className="space-y-2.5">
                            {employee.email && (
                                <div className="flex items-center justify-between p-2.5 rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)]">
                                    <a
                                        href={`mailto:${employee.email}`}
                                        className="flex items-center gap-2.5 min-w-0 hover:text-[var(--theme-primary)] dark:hover:text-[var(--theme-text-secondary)] transition-colors"
                                    >
                                        <Mail size={15} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] shrink-0" />
                                        <span className="text-xs truncate">{employee.email}</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={handleCopyEmail}
                                        className="p-1 rounded hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-secondary)] transition-colors cursor-pointer"
                                        title="Copy email"
                                    >
                                        {copiedEmail ? <Check size={14} className="text-[var(--theme-status-success-text)]" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            )}

                            {employee.phone && (
                                <div className="flex items-center justify-between p-2.5 rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)]">
                                    <a
                                        href={`tel:${employee.phone}`}
                                        className="flex items-center gap-2.5 min-w-0 hover:text-[var(--theme-primary)] dark:hover:text-[var(--theme-text-secondary)] transition-colors"
                                    >
                                        <Phone size={15} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] shrink-0" />
                                        <span className="text-xs font-mono">{employee.phone}</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={handleCopyPhone}
                                        className="p-1 rounded hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] text-[var(--theme-text-secondary)] transition-colors cursor-pointer"
                                        title="Copy phone number"
                                    >
                                        {copiedPhone ? <Check size={14} className="text-[var(--theme-status-success-text)]" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            )}

                            {employee.joinDate && (
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)]">
                                    <Calendar size={15} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] shrink-0" />
                                    <span className="text-xs">Joined {new Date(employee.joinDate).toLocaleDateString()}</span>
                                </div>
                            )}

                            {employee.emergencyContact && (
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)]">
                                    <AlertCircle size={15} className="text-[var(--theme-status-warning-text)] shrink-0" />
                                    <span className="text-xs">Emergency: {employee.emergencyContact}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fleet Assignment if Driver */}
                    {employee.vehicleType && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] mb-3">
                                Fleet Assignment
                            </h4>
                            <div className="p-3 rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_5%,transparent)] bg-[color-mix(in_srgb,var(--theme-bg-card)_5%,transparent)] space-y-1.5 text-xs">
                                <div><span className="text-[var(--theme-text-secondary)]">Vehicle:</span> {employee.vehicleType}</div>
                                {employee.vehiclePlate && <div><span className="text-[var(--theme-text-secondary)]">Plate:</span> {employee.vehiclePlate}</div>}
                                {employee.licenseNumber && <div><span className="text-[var(--theme-text-secondary)]">License:</span> {employee.licenseNumber}</div>}
                            </div>
                        </div>
                    )}

                    {/* Skill Badges if present */}
                    {employee.badges && employee.badges.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] mb-3">
                                Credentials & Badges
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {employee.badges.map((b, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] text-[var(--theme-primary)] text-[var(--theme-status-success-text)] border border-[var(--theme-border)]/20">
                                        {b}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-[var(--theme-border)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-subtle)] hover:bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] transition-colors cursor-pointer"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-2">
                        {onOpenIdCard && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onOpenIdCard(employee);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-[var(--theme-border)]/30 hover:bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] transition-colors cursor-pointer"
                                title="View & Print Employee ID Badge"
                            >
                                <CreditCard size={14} />
                                <span>ID Card</span>
                            </button>
                        )}

                        {onOpenProfile && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onOpenProfile(employee);
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)] text-[var(--theme-text-primary)] shadow-sm transition-all cursor-pointer"
                                title="Open full profile modal to edit credentials, shifts, or permissions"
                            >
                                <ExternalLink size={14} />
                                <span>Full Profile & Actions</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailDrawer;
