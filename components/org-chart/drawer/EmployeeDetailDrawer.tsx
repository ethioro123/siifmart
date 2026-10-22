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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 animate-fadeIn" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-md h-full flex flex-col shadow-2xl border-l animate-slideLeft ${
                    isDark ? 'bg-[#18201B] border-[#2C4D35] text-[#FAF8F5]' : 'bg-white border-[#E2DCCE] text-[#1E3F27]'
                }`}
            >
                {/* Header with Close */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Employee Hierarchy Profile
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 hover:text-stone-800 dark:hover:text-white transition-colors cursor-pointer"
                        title="Close profile drawer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Profile Overview Card */}
                <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center gap-4">
                    <div className="relative shrink-0">
                        <img
                            src={avatar}
                            alt={employee.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#2C5E3B]/30 dark:border-white/20 shadow-md"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=2C5E3B&color=EAE5D9&size=160`;
                            }}
                        />
                        <div
                            title={isOnline ? 'Online now' : 'Offline'}
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#18201B] transition-colors duration-500 ${
                                isOnline
                                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse'
                                    : 'bg-stone-300 dark:bg-stone-600'
                            }`}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg leading-tight truncate">
                                {employee.name}
                            </h3>
                            {employee.code && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-[#EAE5D9] dark:bg-black/40 text-[#2C5E3B] dark:text-emerald-400">
                                    {formatDisplayEmployeeId(employee)}
                                </span>
                            )}
                        </div>

                        <p className="text-sm font-semibold text-[#2C5E3B] dark:text-[#A9CBA2] mt-0.5">
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
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                        : employee.status === 'On Leave'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        : 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20'
                                }`}
                            >
                                {employee.status || 'Active'}
                            </span>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 truncate">
                                <MapPin size={11} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                                <span className="truncate">{siteName}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Performance & Metrics */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
                            Key Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1E2822] border-[#2C4D35]' : 'bg-[#FAF8F5] border-[#E2DCCE]'}`}>
                                <div className="text-[11px] text-stone-500 dark:text-stone-400">Performance Score</div>
                                <div className="text-lg font-bold text-[#2C5E3B] dark:text-[#A9CBA2] mt-0.5">
                                    {employee.performanceScore ? `${employee.performanceScore}%` : 'N/A'}
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1E2822] border-[#2C4D35]' : 'bg-[#FAF8F5] border-[#E2DCCE]'}`}>
                                <div className="text-[11px] text-stone-500 dark:text-stone-400">Attendance Rate</div>
                                <div className="text-lg font-bold text-[#2C5E3B] dark:text-[#A9CBA2] mt-0.5">
                                    {employee.attendanceRate ? `${employee.attendanceRate}%` : '98%'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {canEditReportingLines && onSaveReportingLines && (
                        <section className="rounded-xl border border-[#E2DCCE] dark:border-white/10 p-3.5 space-y-3" aria-label="Reporting relationships">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Reporting Relationships</h4>
                            <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                                Primary manager
                                <select value={primaryManagerId} onChange={event => setPrimaryManagerId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#E2DCCE] dark:border-white/10 bg-white dark:bg-black/30 px-3 py-2 text-sm text-stone-900 dark:text-white">
                                    <option value="">Unassigned</option>
                                    {reportableEmployees.map(manager => <option key={manager.id} value={manager.id}>{manager.name} · {getEmployeeJobTitle(manager)}</option>)}
                                </select>
                            </label>
                            <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                                Functional manager
                                <select value={functionalManagerId} onChange={event => setFunctionalManagerId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#E2DCCE] dark:border-white/10 bg-white dark:bg-black/30 px-3 py-2 text-sm text-stone-900 dark:text-white">
                                    <option value="">Unassigned</option>
                                    {reportableEmployees.map(manager => <option key={manager.id} value={manager.id}>{manager.name} · {getEmployeeJobTitle(manager)}</option>)}
                                </select>
                            </label>
                            {reportingMessage && <p role="status" className="text-[11px] text-stone-500 dark:text-stone-400">{reportingMessage}</p>}
                            <button type="button" onClick={saveReportingLines} disabled={savingReportingLines} className="w-full rounded-lg bg-[#2C5E3B] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                                {savingReportingLines ? 'Saving…' : 'Save reporting relationships'}
                            </button>
                        </section>
                    )}

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
                            Contact Information
                        </h4>
                        <div className="space-y-2.5">
                            {employee.email && (
                                <div className="flex items-center justify-between p-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                                    <a
                                        href={`mailto:${employee.email}`}
                                        className="flex items-center gap-2.5 min-w-0 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors"
                                    >
                                        <Mail size={15} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                                        <span className="text-xs truncate">{employee.email}</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={handleCopyEmail}
                                        className="p-1 rounded hover:bg-stone-200 dark:hover:bg-white/10 text-stone-500 transition-colors cursor-pointer"
                                        title="Copy email"
                                    >
                                        {copiedEmail ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            )}

                            {employee.phone && (
                                <div className="flex items-center justify-between p-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                                    <a
                                        href={`tel:${employee.phone}`}
                                        className="flex items-center gap-2.5 min-w-0 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors"
                                    >
                                        <Phone size={15} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                                        <span className="text-xs font-mono">{employee.phone}</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={handleCopyPhone}
                                        className="p-1 rounded hover:bg-stone-200 dark:hover:bg-white/10 text-stone-500 transition-colors cursor-pointer"
                                        title="Copy phone number"
                                    >
                                        {copiedPhone ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            )}

                            {employee.joinDate && (
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                                    <Calendar size={15} className="text-[#2C5E3B] dark:text-[#A9CBA2] shrink-0" />
                                    <span className="text-xs">Joined {new Date(employee.joinDate).toLocaleDateString()}</span>
                                </div>
                            )}

                            {employee.emergencyContact && (
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                                    <AlertCircle size={15} className="text-amber-500 shrink-0" />
                                    <span className="text-xs">Emergency: {employee.emergencyContact}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fleet Assignment if Driver */}
                    {employee.vehicleType && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
                                Fleet Assignment
                            </h4>
                            <div className="p-3 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 space-y-1.5 text-xs">
                                <div><span className="text-stone-500">Vehicle:</span> {employee.vehicleType}</div>
                                {employee.vehiclePlate && <div><span className="text-stone-500">Plate:</span> {employee.vehiclePlate}</div>}
                                {employee.licenseNumber && <div><span className="text-stone-500">License:</span> {employee.licenseNumber}</div>}
                            </div>
                        </div>
                    )}

                    {/* Skill Badges if present */}
                    {employee.badges && employee.badges.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
                                Credentials & Badges
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {employee.badges.map((b, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EAE5D9] dark:bg-black/30 text-[#2C5E3B] dark:text-emerald-300 border border-[#2C5E3B]/20">
                                        {b}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-[#2C5E3B]/30 hover:bg-[#2C5E3B]/10 text-[#2C5E3B] dark:text-[#A9CBA2] transition-colors cursor-pointer"
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
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#2C5E3B] hover:bg-[#1E3F27] text-white shadow-sm transition-all cursor-pointer"
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
