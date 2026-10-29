import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { Employee, UserRole } from '../../../types';
import { SYSTEM_ROLES, canEmployRole } from '../../../utils/roles';
import { autoSelectSiteForRole, getRecommendedDepartment, canRoleBeAtSiteType, resolveEmployeeScopeLevel } from '../../../utils/roleSegregation';
import { logger } from '../../../utils/logger';
import { isSovereignCEO, evaluateEmployeeProfileChanges } from '../../../utils/employeeGovernance';
import { employeeChangesService } from '../../../services/employee-changes.service';

import { GovernanceApprovalBadge } from './settings/GovernanceApprovalBadge';
import { ProfileIdentityCard } from './settings/ProfileIdentityCard';
import { ProfileRoleDeptCard } from './settings/ProfileRoleDeptCard';
import { ProfileContactCard } from './settings/ProfileContactCard';
import { ProfileSecurityCard } from './settings/ProfileSecurityCard';
import { SubmitChangeRequestModal } from '../modals/SubmitChangeRequestModal';

type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated' | 'Pending Approval';

interface SettingsTabProps {
    employee: Employee;
    sites: any[];
    canEditStaff?: boolean;
    isOwnProfile?: boolean;
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
    isOwnProfile = false,
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
    // --- Editable State ---
    const [editName, setEditName] = useState(employee.name || '');
    const [editAge, setEditAge] = useState(employee.age?.toString() || '');
    const [editDateOfBirth, setEditDateOfBirth] = useState(employee.dateOfBirth || '');
    const [editNationalIdNumber, setEditNationalIdNumber] = useState(employee.nationalIdNumber || '');

    const [editRole, setEditRole] = useState<UserRole>(employee.role);
    const [editJobTitle, setEditJobTitle] = useState(employee.jobTitle || employee.job_title || '');
    const [editDepartment, setEditDepartment] = useState(employee.department || 'Retail Operations');
    const [editSiteId, setEditSiteId] = useState(employee.siteId || employee.site_id || '');
    const [editSalary, setEditSalary] = useState(employee.salary?.toString() || '0');
    const [editSpecialization, setEditSpecialization] = useState(employee.specialization || '');
    const [editStatus, setEditStatus] = useState<EmployeeStatus>(employee.status || 'Active');

    const [editPhone, setEditPhone] = useState(employee.phone || '');
    const [editAddress, setEditAddress] = useState(employee.address || '');
    const [editEmergencyContact, setEditEmergencyContact] = useState(employee.emergencyContact || '');

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

    // Reset when employee changes
    useEffect(() => {
        setEditName(employee.name || '');
        setEditAge(employee.age?.toString() || '');
        setEditDateOfBirth(employee.dateOfBirth || '');
        setEditNationalIdNumber(employee.nationalIdNumber || '');
        setEditRole(employee.role);
        setEditJobTitle(employee.jobTitle || employee.job_title || '');
        setEditDepartment(employee.department || 'Retail Operations');
        setEditSiteId(employee.siteId || employee.site_id || '');
        setEditSalary(employee.salary?.toString() || '0');
        setEditSpecialization(employee.specialization || '');
        setEditStatus((employee.status || 'Active') as EmployeeStatus);
        setEditPhone(employee.phone || '');
        setEditAddress(employee.address || '');
        setEditEmergencyContact(employee.emergencyContact || '');
    }, [employee.id]);

    const isCEO = isSovereignCEO(currentUser?.role);

    const getAssignableRoles = useCallback((): UserRole[] => {
        if (!currentUser) return [];
        return SYSTEM_ROLES
            .filter(r => canEmployRole(currentUser.role, r.id))
            .map(r => r.id);
    }, [currentUser]);

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

    // Proposed employee changes payload
    const proposedChanges = useMemo((): Partial<Employee> => {
        const targetSite = sites.find(s => s.id === editSiteId);
        const siteRegionCode = targetSite?.region_code || targetSite?.regionCode || undefined;
        const resolvedScope = resolveEmployeeScopeLevel(editRole, siteRegionCode);
        const resolvedRegionCode = resolvedScope === 'REGIONAL' ? siteRegionCode : undefined;

        return {
            name: editName.trim(),
            age: editAge ? parseInt(editAge, 10) : undefined,
            dateOfBirth: editDateOfBirth,
            nationalIdNumber: editNationalIdNumber.trim(),
            role: editRole,
            jobTitle: editJobTitle.trim(),
            department: editDepartment,
            siteId: editSiteId,
            scopeLevel: resolvedScope,
            regionCode: resolvedRegionCode,
            region_code: resolvedRegionCode,
            salary: parseFloat(editSalary) || 0,
            specialization: editSpecialization.trim(),
            status: editStatus,
            phone: editPhone.trim(),
            address: editAddress.trim(),
            emergencyContact: editEmergencyContact.trim()
        };
    }, [
        sites, editName, editAge, editDateOfBirth, editNationalIdNumber,
        editRole, editJobTitle, editDepartment, editSiteId, editSalary, editSpecialization, editStatus,
        editPhone, editAddress, editEmergencyContact
    ]);

    const hasChanges =
        editName.trim() !== employee.name.trim() ||
        editAge !== (employee.age?.toString() || '') ||
        editDateOfBirth !== (employee.dateOfBirth || '') ||
        editNationalIdNumber.trim() !== (employee.nationalIdNumber || '').trim() ||
        editRole !== employee.role ||
        editJobTitle.trim() !== (employee.jobTitle || employee.job_title || '').trim() ||
        editDepartment !== (employee.department || 'Retail Operations') ||
        editSiteId !== (employee.siteId || employee.site_id || '') ||
        editSalary !== (employee.salary?.toString() || '0') ||
        editSpecialization !== (employee.specialization || '') ||
        editStatus !== (employee.status || 'Active') ||
        editPhone !== (employee.phone || '') ||
        editAddress !== (employee.address || '') ||
        editEmergencyContact !== (employee.emergencyContact || '');

    // Evaluate governance rules
    const governanceResult = useMemo(() => {
        return evaluateEmployeeProfileChanges(employee, proposedChanges, currentUser?.role, currentUser?.id);
    }, [employee, proposedChanges, currentUser?.role, currentUser?.id]);
    const requiresReview = governanceResult.requiresApproval || currentUser?.role === 'hr_generalist';
    const requiredApprovers = governanceResult.requiredApprovers.length
        ? governanceResult.requiredApprovers
        : (['Human Resources'] as const);

    // Handle Direct Save (CEO or HR non-governed changes)
    const handleDirectSave = async () => {
        if (!updateEmployee || !hasChanges) return;
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const fullUpdatedEmployee: Employee = {
                ...employee,
                ...proposedChanges
            } as Employee;

            const result = updateEmployee(
                fullUpdatedEmployee,
                currentUser?.name || (isCEO ? 'CEO Sovereign Executive' : 'HR Officer')
            );
            if (result instanceof Promise) await result;
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            logger.error('SettingsTab', 'Failed to save employee changes:', err as Error);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle primary action click
    const handleSaveClick = () => {
        if (!hasChanges || governanceResult.blockedReason) return;
        if (requiresReview && !isCEO) {
            setIsApprovalModalOpen(true);
        } else {
            handleDirectSave();
        }
    };

    // Confirm and submit change request to other departments
    const handleConfirmSubmitRequest = async (reason: string) => {
        setIsSubmittingApproval(true);
        try {
            await employeeChangesService.create({
                employeeId: employee.id,
                employeeName: employee.name,
                countryCode: employee.country || (employee as any).country_code || 'ET',
                siteId: editSiteId || employee.siteId,
                requestedBy: currentUser?.name || 'HR Officer',
                requestedByRole: currentUser?.role || 'hr',
                requestedAt: new Date().toISOString(),
                status: 'pending',
                governanceCategory: governanceResult.governanceCategories.length === 1
                    ? governanceResult.governanceCategories[0]
                    : (governanceResult.governanceCategories.length ? 'composite' : 'contact_general'),
                requiredApprovers: [...requiredApprovers],
                diffs: governanceResult.diffs,
                fullProposedEmployee: proposedChanges,
                reason
            });

            setIsApprovalModalOpen(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
        } catch (err) {
            logger.error('SettingsTab', 'Failed to submit change request:', err as Error);
        } finally {
            setIsSubmittingApproval(false);
        }
    };

    const assignableRoles = getAssignableRoles();

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Real-time Governance Status Callout */}
            <GovernanceApprovalBadge
                isCEO={isCEO}
                ruleResult={governanceResult}
                hasChanges={hasChanges}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Identity & Authentication */}
                <div className="space-y-6">
                    <ProfileIdentityCard
                        employee={employee}
                        sites={sites}
                        canEdit={canEditStaff}
                        isCEO={isCEO}
                        name={editName}
                        setName={setEditName}
                        age={editAge}
                        setAge={setEditAge}
                        dateOfBirth={editDateOfBirth}
                        setDateOfBirth={setEditDateOfBirth}
                        nationalIdNumber={editNationalIdNumber}
                        setNationalIdNumber={setEditNationalIdNumber}
                    />

                    <ProfileSecurityCard
                        currentPasswordInput={currentPasswordInput}
                        setCurrentPasswordInput={setCurrentPasswordInput}
                        newPasswordInput={newPasswordInput}
                        setNewPasswordInput={setNewPasswordInput}
                        confirmPasswordInput={confirmPasswordInput}
                        setConfirmPasswordInput={setConfirmPasswordInput}
                        isChangingPassword={isChangingPassword}
                        handleUpdatePassword={handleUpdatePassword}
                    />
                </div>

                {/* Column 2: Role, Department & Contact Details */}
                <div className="space-y-6">
                    <ProfileRoleDeptCard
                        employee={employee}
                        sites={sites}
                        canEdit={canEditStaff}
                        isCEO={isCEO}
                        assignableRoles={assignableRoles}
                        role={editRole}
                        onRoleChange={handleRoleChange}
                    jobTitle={editJobTitle}
                    setJobTitle={setEditJobTitle}
                        department={editDepartment}
                        setDepartment={setEditDepartment}
                        siteId={editSiteId}
                        setSiteId={setEditSiteId}
                        salary={editSalary}
                        setSalary={setEditSalary}
                        specialization={editSpecialization}
                        setSpecialization={setEditSpecialization}
                        status={editStatus}
                        setStatus={setEditStatus}
                    />

                    <ProfileContactCard
                        employee={employee}
                        canEdit={canEditStaff || isOwnProfile}
                        phone={editPhone}
                        setPhone={setEditPhone}
                        address={editAddress}
                        setAddress={setEditAddress}
                        emergencyContact={editEmergencyContact}
                        setEmergencyContact={setEditEmergencyContact}
                    />
                </div>
            </div>

            {/* Bottom Action Suite */}
            {(canEditStaff || isOwnProfile) && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm">
                    <div className="text-xs text-[var(--theme-text-muted)]">
                        {governanceResult.blockedReason ? (
                            <span className="text-[var(--theme-status-danger-text)] font-semibold">{governanceResult.blockedReason}</span>
                        ) : isCEO ? (
                            <span>CEO Sovereign Authority: Changes apply directly to personnel ledger.</span>
                        ) : requiresReview && hasChanges ? (
                            <span>Change request will route to {requiredApprovers.join(', ')}.</span>
                        ) : (
                            <span>No governed fields modified: Changes will apply immediately.</span>
                        )}
                    </div>

                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving || !hasChanges || Boolean(governanceResult.blockedReason)}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-40 ${
                            saveSuccess
                                ? 'bg-[var(--theme-status-success-bg)] text-white'
                                : requiresReview && !isCEO
                                    ? 'bg-[var(--theme-status-warning-bg)] bg-[var(--theme-status-warning-bg)] text-black'
                                    : 'bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)]'
                        }`}
                    >
                        {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : saveSuccess ? (
                            <><Check size={16} /> {requiresReview && !isCEO ? 'Request Submitted' : 'Saved Successfully'}</>
                        ) : requiresReview && !isCEO ? (
                            <><Save size={15} /> Submit for Department Sign-Off</>
                        ) : (
                            <><Save size={15} /> Save Changes (Direct Update)</>
                        )}
                    </button>
                </div>
            )}

            {/* Submit Change Request Modal */}
            {isApprovalModalOpen && (
                <SubmitChangeRequestModal
                    isOpen={isApprovalModalOpen}
                    onClose={() => setIsApprovalModalOpen(false)}
                    employeeName={employee.name}
                    ruleResult={governanceResult}
                    onConfirm={handleConfirmSubmitRequest}
                    isSubmitting={isSubmittingApproval}
                />
            )}
        </div>
    );
}
