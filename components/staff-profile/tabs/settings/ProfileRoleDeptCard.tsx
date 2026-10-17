import React from 'react';
import { Shield, Briefcase, Building, DollarSign, UserCheck, Star, ChevronDown, DollarSign as FinanceIcon } from 'lucide-react';
import { Employee, UserRole } from '../../../../types';
import { getEmployeeJobTitle, SYSTEM_ROLES } from '../../../../utils/roles';
import { formatRole } from '../../../../utils/formatting';

const DEPARTMENTS = [
    'Retail Operations',
    'Logistics & Warehouse',
    'Management',
    'Human Resources',
    'Security',
    'Transport',
    'Procurement',
    'Finance & Accounting'
];

type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated' | 'Pending Approval';
const STATUS_OPTIONS: EmployeeStatus[] = ['Active', 'On Leave', 'Terminated', 'Pending Approval'];

interface ProfileRoleDeptCardProps {
    employee: Employee;
    sites: any[];
    canEdit: boolean;
    isCEO: boolean;
    assignableRoles: UserRole[];
    role: UserRole;
    onRoleChange: (newRole: UserRole) => void;
    department: string;
    setDepartment: (dept: string) => void;
    siteId: string;
    setSiteId: (siteId: string) => void;
    salary: string;
    setSalary: (salary: string) => void;
    specialization: string;
    setSpecialization: (spec: string) => void;
    status: EmployeeStatus;
    setStatus: (status: EmployeeStatus) => void;
}

export const ProfileRoleDeptCard: React.FC<ProfileRoleDeptCardProps> = ({
    employee,
    sites,
    canEdit,
    isCEO,
    assignableRoles,
    role,
    onRoleChange,
    department,
    setDepartment,
    siteId,
    setSiteId,
    salary,
    setSalary,
    specialization,
    setSpecialization,
    status,
    setStatus
}) => {
    const selectClasses = "w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 text-xs text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)] transition-colors appearance-none cursor-pointer";
    const inputClasses = "w-full h-11 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl px-4 text-xs text-[var(--theme-text-primary)] outline-none focus:border-[var(--theme-accent)] transition-colors";
    const labelClasses = "text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider mb-1.5 block px-1";
    const readOnlyClasses = "flex items-center justify-between p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)]";

    const isSalaryChanged = Number(salary) !== Number(employee.salary || 0);
    const isDeptChanged = department !== (employee.department || 'Retail Operations');
    const isRoleChanged = role !== employee.role;

    return (
        <div className="bg-[var(--theme-bg-card)] p-6 rounded-2xl border border-[var(--theme-border)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)]">
                            Organizational Assignment & Compensation
                        </h4>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">
                            Department headcount, operational facility, access role, and payroll tier.
                        </p>
                    </div>
                </div>
            </div>

            {/* Access Role */}
            <div>
                <label className={labelClasses}>
                    <Shield size={12} className="inline mr-1" /> System Access Role
                </label>
                {canEdit && assignableRoles.length > 0 ? (
                    <div className="relative">
                        <select
                            value={role}
                            onChange={(e) => onRoleChange(e.target.value as UserRole)}
                            className={selectClasses}
                        >
                            {assignableRoles.map(roleId => {
                                const roleMeta = SYSTEM_ROLES.find(r => r.id === roleId);
                                return (
                                    <option key={roleId} value={roleId}>
                                        {roleMeta?.label || formatRole(roleId)} — {roleMeta?.desc || roleId}
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                    </div>
                ) : (
                    <div className={readOnlyClasses}>
                        <p className="text-xs font-bold text-[var(--theme-text-primary)]">{getEmployeeJobTitle(employee)}</p>
                        <Shield size={15} className="text-blue-500" />
                    </div>
                )}
            </div>

            {/* Department */}
            <div>
                <label className={labelClasses}>
                    <Briefcase size={12} className="inline mr-1" /> Assigned Department
                </label>
                {canEdit ? (
                    <div className="relative">
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className={selectClasses}
                        >
                            {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                    </div>
                ) : (
                    <div className={readOnlyClasses}>
                        <p className="text-xs font-bold text-[var(--theme-text-primary)]">{employee.department || 'Retail Operations'}</p>
                    </div>
                )}
            </div>

            {/* Primary Site */}
            <div>
                <label className={labelClasses}>
                    <Building size={12} className="inline mr-1" /> Primary Operating Facility
                </label>
                {canEdit ? (
                    <div className="relative">
                        <select
                            value={siteId}
                            onChange={(e) => setSiteId(e.target.value)}
                            className={selectClasses}
                        >
                            {sites.map(site => (
                                <option key={site.id} value={site.id}>
                                    {site.name} ({site.type || 'site'})
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                    </div>
                ) : (
                    <div className={readOnlyClasses}>
                        <p className="text-xs font-bold text-[var(--theme-text-primary)]">
                            {sites.find(s => s.id === employee.siteId || s.id === employee.site_id)?.name || 'HQ'}
                        </p>
                    </div>
                )}
            </div>

            {/* Monthly Salary & Employment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                    <label className={labelClasses}>
                        <DollarSign size={12} className="inline mr-1" /> Monthly Salary (ETB/KSh)
                    </label>
                    {canEdit ? (
                        <input
                            type="number"
                            min="0"
                            step="100"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            className={inputClasses}
                        />
                    ) : (
                        <div className={readOnlyClasses}>
                            <p className="text-xs font-mono font-bold text-[var(--theme-text-primary)]">
                                {employee.salary?.toLocaleString() || '0'}
                            </p>
                        </div>
                    )}
                </div>

                <div>
                    <label className={labelClasses}>
                        <UserCheck size={12} className="inline mr-1" /> Employment Status
                    </label>
                    {canEdit ? (
                        <div className="relative">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                                className={selectClasses}
                            >
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-muted)] pointer-events-none" />
                        </div>
                    ) : (
                        <div className={readOnlyClasses}>
                            <p className="text-xs font-bold text-[var(--theme-text-primary)]">{employee.status || 'Active'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Specialization */}
            {canEdit && (
                <div>
                    <label className={labelClasses}>
                        <Star size={12} className="inline mr-1" /> Domain Specialization
                    </label>
                    <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Cold Chain, Inventory Audit, Fresh Deli"
                        className={inputClasses}
                    />
                </div>
            )}
        </div>
    );
};
