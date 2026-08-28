import React, { useState, useEffect, useCallback } from 'react';
import { Key, User, Shield, MapPin, Building, Briefcase, DollarSign, Save, Loader2, ChevronDown, Star } from 'lucide-react';
import { Employee, UserRole } from '../../../types';
import { SYSTEM_ROLES, getRoleHierarchy } from '../../../utils/roles';
import { autoSelectSiteForRole, getRecommendedDepartment, canRoleBeAtSiteType } from '../../../utils/roleSegregation';
import { formatRole } from '../../../utils/formatting';
import { logger } from '../../../utils/logger';

const DEPARTMENTS = ['Retail Operations', 'Logistics & Warehouse', 'Management', 'Human Resources', 'Security', 'Transport', 'Procurement'];
type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated' | 'Pending Approval';
const STATUS_OPTIONS: EmployeeStatus[] = ['Active', 'On Leave', 'Terminated', 'Pending Approval'];

interface SettingsTabProps {
    employee: Employee;
    sites: any[];
    canEditStaff?: boolean;
    currentUser?: any;
    updateEmployee?: (emp: Employee, user: string) => Promise<void> | void;
    currentPasswordInput: string;
    setCurrentPasswordInput: (value: string) => void;
    newPasswordInput: string;
    setNewPasswordInput: (value: string) => void;
    confirmPasswordInput: string;
    setConfirmPasswordInput: (value: string) => void;
    isChangingPassword: boolean;
    handleUpdatePassword: () => void;
}

export default function SettingsTab({
    employee,
    sites,
    canEditStaff = false,
    currentUser,
    updateEmployee,
    currentPasswordInput,
    setCurrentPasswordInput,
    newPasswordInput,
    setNewPasswordInput,
    confirmPasswordInput,
    setConfirmPasswordInput,
    isChangingPassword,
    handleUpdatePassword
}: SettingsTabProps) {
    // ---------- Editable state ----------
    const [editRole, setEditRole] = useState<UserRole>(employee.role);
    const [editDepartment, setEditDepartment] = useState(employee.department || 'Retail Operations');
    const [editSiteId, setEditSiteId] = useState(employee.siteId || employee.site_id || '');
    const [editSpecialization, setEditSpecialization] = useState(employee.specialization || '');
    const [editSalary, setEditSalary] = useState(employee.salary?.toString() || '0');
    const [editStatus, setEditStatus] = useState<EmployeeStatus>(employee.status || 'Active');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Reset form when employee changes
    useEffect(() => {
        setEditRole(employee.role);
        setEditDepartment(employee.department || 'Retail Operations');
        setEditSiteId(employee.siteId || employee.site_id || '');
        setEditSpecialization(employee.specialization || '');
        setEditSalary(employee.salary?.toString() || '0');
        setEditStatus((employee.status || 'Active') as EmployeeStatus);
    }, [employee.id]);

    // ---------- Role logic ----------
    const currentUserLevel = currentUser ? getRoleHierarchy(currentUser.role) : 0;

    const getAssignableRoles = useCallback((): UserRole[] => {
        if (!currentUser) return [];
        return SYSTEM_ROLES
            .filter(r => getRoleHierarchy(r.id) < currentUserLevel)
            .map(r => r.id);
    }, [currentUser, currentUserLevel]);

    const canAdjustPayroll = ['super_admin', 'hr_manager', 'hr', 'admin'].includes(currentUser?.role || '');

    const handleRoleChange = (newRole: UserRole) => {
        setEditRole(newRole);
        const recommended = getRecommendedDepartment(newRole);
        if (recommended) setEditDepartment(recommended);
        const currentSite = sites.find(s => s.id === editSiteId);
        if (currentSite && !canRoleBeAtSiteType(newRole, currentSite.type)) {
            const autoSite = autoSelectSiteForRole(newRole, sites);
            if (autoSite) setEditSiteId(autoSite);
        }
    };

    const hasChanges = editRole !== employee.role ||
        editDepartment !== (employee.department || 'Retail Operations') ||
        editSiteId !== (employee.siteId || employee.site_id || '') ||
        editSpecialization !== (employee.specialization || '') ||
        editSalary !== (employee.salary?.toString() || '0') ||
        editStatus !== (employee.status || 'Active');

    const handleSave = async () => {
        if (!updateEmployee || !hasChanges) return;
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const updatedEmployee: Employee = {
                ...employee,
                role: editRole,
                department: editDepartment,
                siteId: editSiteId,
                specialization: editSpecialization,
                salary: parseFloat(editSalary) || 0,
                status: editStatus,
            };
            const result = updateEmployee(updatedEmployee, currentUser?.name || 'HR Admin');
            if (result instanceof Promise) await result;
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            logger.error('SettingsTab', 'Failed to save employee changes', err as Error);
        } finally {
            setIsSaving(false);
        }
    };

    const assignableRoles = getAssignableRoles();
    const selectClasses = 'w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-emerald-500 transition-colors appearance-none cursor-pointer';
    const inputClasses = 'w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-[#2C5E3B] dark:focus:border-emerald-500 transition-colors';
    const labelClasses = 'text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5 block px-1';
    const readOnlyClasses = 'flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none';

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Security Section */}
                <div className="bg-gray-50 dark:bg-black/30 p-8 rounded-2xl border border-gray-200 dark:border-white/5">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <Key size={18} />
                        </div>
                        Security & Access
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Current Password</label>
                            <input
                                type="password"
                                value={currentPasswordInput}
                                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>New Password</label>
                            <input
                                type="password"
                                value={newPasswordInput}
                                onChange={(e) => setNewPasswordInput(e.target.value)}
                                autoComplete="new-password"
                                placeholder="Minimum 6 characters"
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPasswordInput}
                                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                                autoComplete="new-password"
                                placeholder="Confirm your new password"
                                className={inputClasses}
                            />
                        </div>

                        <button
                            onClick={handleUpdatePassword}
                            disabled={isChangingPassword || !newPasswordInput || newPasswordInput !== confirmPasswordInput}
                            className="w-full mt-4 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-30 border border-yellow-500/20 shadow-lg shadow-yellow-400/20"
                        >
                            {isChangingPassword ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>Update Password</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Account Info / Edit Section */}
                <div className="bg-gray-50 dark:bg-black/30 p-8 rounded-2xl border border-gray-200 dark:border-white/5">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-[#2C5E3B]/20 rounded-lg text-[#2C5E3B] dark:text-emerald-400">
                            <User size={18} />
                        </div>
                        {canEditStaff ? 'Edit Employee Profile' : 'Account Information'}
                    </h4>

                    <div className="space-y-5">
                        {/* Employee ID — always read-only */}
                        <div className={readOnlyClasses}>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Employee ID</p>
                                <p className="text-gray-900 dark:text-white font-mono text-sm">{employee.code || 'EMP-' + employee.id.substring(0, 5).toUpperCase()}</p>
                            </div>
                            <div className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">Personnel Code</div>
                        </div>

                        {/* ROLE */}
                        {canEditStaff && assignableRoles.length > 0 ? (
                            <div>
                                <label className={labelClasses}>
                                    <Shield size={10} className="inline mr-1" />
                                    Access Role
                                </label>
                                <div className="relative">
                                    <select
                                        value={editRole}
                                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
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
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        ) : (
                            <div className={readOnlyClasses}>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Access Role</p>
                                    <p className="text-gray-900 dark:text-white font-bold">{formatRole(employee.role)}</p>
                                </div>
                                <Shield size={16} className="text-[#2C5E3B] dark:text-emerald-400" />
                            </div>
                        )}

                        {/* DEPARTMENT */}
                        {canEditStaff ? (
                            <div>
                                <label className={labelClasses}>
                                    <Briefcase size={10} className="inline mr-1" />
                                    Department
                                </label>
                                <div className="relative">
                                    <select
                                        value={editDepartment}
                                        onChange={(e) => setEditDepartment(e.target.value)}
                                        className={selectClasses}
                                    >
                                        {DEPARTMENTS.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        ) : (
                            <div className={readOnlyClasses}>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Department</p>
                                    <p className="text-gray-900 dark:text-white font-bold">{employee.department || 'Retail Operations'}</p>
                                </div>
                                <Briefcase size={16} className="text-[#2C5E3B] dark:text-emerald-400" />
                            </div>
                        )}

                        {/* PRIMARY SITE */}
                        {canEditStaff ? (
                            <div>
                                <label className={labelClasses}>
                                    <Building size={10} className="inline mr-1" />
                                    Primary Site
                                </label>
                                <div className="relative">
                                    <select
                                        value={editSiteId}
                                        onChange={(e) => setEditSiteId(e.target.value)}
                                        className={selectClasses}
                                    >
                                        {sites.map(site => (
                                            <option key={site.id} value={site.id}>
                                                {site.name} ({site.type || 'site'})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        ) : (
                            <div className={readOnlyClasses}>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Primary Site</p>
                                    <p className="text-gray-900 dark:text-white font-bold">{sites.find(s => s.id === employee.siteId || s.id === employee.site_id)?.name || 'HQ'}</p>
                                </div>
                                <MapPin size={16} className="text-[#2C5E3B] dark:text-emerald-400" />
                            </div>
                        )}

                        {/* SPECIALIZATION — only in edit mode */}
                        {canEditStaff && (
                            <div>
                                <label className={labelClasses}>
                                    <Star size={10} className="inline mr-1" />
                                    Specialization
                                </label>
                                <input
                                    type="text"
                                    value={editSpecialization}
                                    onChange={(e) => setEditSpecialization(e.target.value)}
                                    placeholder="e.g. Deli, Bakery, Produce"
                                    className={inputClasses}
                                />
                            </div>
                        )}

                        {/* SALARY — only for payroll-eligible roles */}
                        {canEditStaff && canAdjustPayroll && (
                            <div>
                                <label className={labelClasses}>
                                    <DollarSign size={10} className="inline mr-1" />
                                    Monthly Salary (ETB)
                                </label>
                                <input
                                    type="number"
                                    value={editSalary}
                                    onChange={(e) => setEditSalary(e.target.value)}
                                    min="0"
                                    step="100"
                                    className={inputClasses}
                                />
                            </div>
                        )}

                        {/* STATUS */}
                        {canEditStaff ? (
                            <div>
                                <label className={labelClasses}>
                                    <User size={10} className="inline mr-1" />
                                    Employment Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value as EmployeeStatus)}
                                        className={selectClasses}
                                    >
                                        {STATUS_OPTIONS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        ) : null}

                        {/* SAVE BUTTON */}
                        {canEditStaff && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !hasChanges}
                                className={`w-full mt-2 flex items-center justify-center gap-2 font-black uppercase tracking-widest py-3 rounded-xl transition-all border shadow-lg ${
                                    saveSuccess
                                        ? 'bg-green-500 border-green-600/20 text-white shadow-green-500/20'
                                        : 'bg-[#2C5E3B] hover:bg-[#224429] border-emerald-700/20 text-white shadow-emerald-500/20 disabled:opacity-30'
                                }`}
                            >
                                {isSaving ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : saveSuccess ? (
                                    <>✓ Saved Successfully</>
                                ) : (
                                    <><Save size={16} /> Save Changes</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
