import React from 'react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import { hasPermission } from '../utils/permissions';
import { getRoleHierarchy, canEmployRole } from '../utils/roles';
import { isSovereignCEO } from '../utils/employeeGovernance';
import { useStaffProfile } from '../hooks/useStaffProfile';
import { AlertCircle, CheckCircle } from 'lucide-react';

import StaffProfileHeader from './staff-profile/StaffProfileHeader';
import StaffProfileNavigation from './staff-profile/StaffProfileNavigation';
import OverviewTab from './staff-profile/tabs/OverviewTab';
import GamificationTab from './staff-profile/tabs/GamificationTab';
import TasksTab from './staff-profile/tabs/TasksTab';
import TimeOffTab from './staff-profile/tabs/TimeOffTab';
import DocumentsTab from './staff-profile/tabs/DocumentsTab';
import PayrollTab from './staff-profile/tabs/PayrollTab';
import SettingsTab from './staff-profile/tabs/SettingsTab';

import ResetPasswordModal from './staff-profile/modals/ResetPasswordModal';
import SendMessageModal from './staff-profile/modals/SendMessageModal';
import AdjustSalaryModal from './staff-profile/modals/AdjustSalaryModal';
import { RequestTimeOffModal } from './staff-profile/modals/RequestTimeOffModal';
import { PayslipModal } from './staff-profile/modals/PayslipModal';
import EmployeeIDCard from './EmployeeIDCard';
import ImageEditorModal from './ImageEditorModal';
import { Employee } from '../types';

interface StaffProfileViewProps {
    employee: Employee;
    isOwnProfile?: boolean;
    onClose?: () => void;
    onRequestPhotoChange?: () => void;
    // Termination props passed from Employees.tsx
    terminateInput?: string;
    setTerminateInput?: (val: string) => void;
    handleConfirmTermination?: () => void;
    onApprove?: () => void;
}

export default function StaffProfileView(props: StaffProfileViewProps) {
    const { employee, isOwnProfile = false, onClose, onRequestPhotoChange } = props;
    const { user, updateUserAvatar, onlineIds } = useStore();
    const { tasks: allTasks, setTasks, sites, addNotification, updateEmployee, settings, getStorePoints } = useData();
    const { getWorkerPoints } = useGamification();

    const profile = useStaffProfile({
        employee, user, allTasks, setTasks, updateEmployee, addNotification, updateUserAvatar
    });

    const isOnline = onlineIds.has(employee.id);

    // Permission Logic & Hierarchy Enforcement
    const userRoleLevel = user ? getRoleHierarchy(user.role) : 0;
    const targetRoleLevel = getRoleHierarchy(employee.role);
    const isTargetCEO = isSovereignCEO(employee.role);
    const isActorCEO = isSovereignCEO(user?.role);
    const isSuperiorToTarget = userRoleLevel > targetRoleLevel;

    // Subordinate roles (including Country MD) cannot manage or adjust Global CEO.
    // Non-CEOs cannot manage anyone of equal or higher hierarchy. Self cannot manage self.
    const canManageTarget = !isOwnProfile && (isActorCEO || (hasPermission(user?.role, 'EDIT_EMPLOYEE') && !isTargetCEO && isSuperiorToTarget));
    const canManageTasks = hasPermission(user?.role, 'EDIT_EMPLOYEE') && (isActorCEO || !isTargetCEO);
    const canViewPayroll = hasPermission(user?.role, 'VIEW_PAYROLL') || isOwnProfile;
    const canTerminate = (['group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'regional_hr_manager', 'regional_operations_manager', 'country_operations_director'].includes(user?.role || '')) && userRoleLevel > targetRoleLevel && !isOwnProfile && !isTargetCEO;
    const canDelete = user?.role === 'group_ceo' && userRoleLevel > targetRoleLevel && !isOwnProfile && !isTargetCEO;
    const canApprove = (['group_ceo', 'country_managing_director', 'hr_generalist', 'country_hr_director', 'regional_hr_manager', 'regional_operations_manager', 'country_operations_director'].includes(user?.role || '')) &&
        canEmployRole(user?.role, employee.role) &&
        employee.status === 'Pending Approval' &&
        !isOwnProfile && !isTargetCEO;

    const handleApprove = () => {
        if (props.onApprove) {
            props.onApprove();
        } else {
            handleDirectApprove();
        }
    };

    const handleDirectApprove = async () => {
        try {
            await updateEmployee({ ...employee, status: 'Active' }, user?.name || 'Admin');
            addNotification('success', `Approved: ${employee.name} is now Active.`);
        } catch (err: any) {
            addNotification('alert', `Failed to approve employee: ${err?.message || 'Unknown error'}`);
        }
    };

    const siteName = sites.find(s => s.id === employee.siteId || s.id === (employee as any).site_id)?.name || 'Headquarters';
    const currencySymbol = (employee as any).salaryCurrency || settings?.currency || 'ETB';

    return (
        <div className="space-y-5 sm:space-y-6">
            <StaffProfileHeader 
                employee={employee} sites={sites} isOwnProfile={isOwnProfile} canManageEmployees={canManageTarget} 
                canResetPassword={userRoleLevel > targetRoleLevel && !isTargetCEO} canTerminate={canTerminate} canDelete={canDelete}
                canApprove={canApprove} onApprove={handleApprove}
                isOnline={isOnline}
                onPhotoRequest={onRequestPhotoChange || (() => profile.profilePhotoInputRef.current?.click())}
                onIdCard={() => profile.setIdCardOpen(true)} onMessage={() => profile.setIsMessageModalOpen(true)}
                onResetPassword={() => profile.setIsPasswordModalOpen(true)} 
                onTerminate={props.handleConfirmTermination || (() => {})} onDelete={() => {}}
                photoInputRef={profile.profilePhotoInputRef} handleProfilePhotoSelect={profile.handleProfilePhotoSelect}
            />

            {employee.status === 'Pending Approval' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <AlertCircle size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">Pending Onboarding Approval</h4>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                This employee was onboarded with "Pending Approval" status and requires HR / Super Admin sign-off before being granted active system access.
                            </p>
                        </div>
                    </div>
                    {canApprove && (
                        <button
                            type="button"
                            onClick={handleApprove}
                            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                            <CheckCircle size={15} />
                            <span>Approve Talent</span>
                        </button>
                    )}
                </div>
            )}

            <StaffProfileNavigation 
                activeProfileTab={profile.activeProfileTab} setActiveProfileTab={profile.setActiveProfileTab}
                canViewPayroll={canViewPayroll}
            />

            <div className="min-h-[400px]">
                {profile.activeProfileTab === 'overview' && (
                    <OverviewTab
                        employee={employee}
                        employeeTasks={allTasks.filter(t => t.assignedTo === employee.id)}
                        sites={sites}
                        isOwnProfile={isOwnProfile}
                    />
                )}
                {profile.activeProfileTab === 'gamification' && (
                    <GamificationTab
                        employee={employee}
                        settings={settings}
                        sites={sites}
                        getWorkerPoints={getWorkerPoints}
                        getStorePoints={getStorePoints}
                    />
                )}
                {profile.activeProfileTab === 'tasks' && (
                    <TasksTab
                        canManageEmployees={canManageTasks}
                        isOwnProfile={isOwnProfile}
                        employeeTasks={allTasks.filter(t => t.assignedTo === employee.id)}
                        newTaskTitle={profile.newTaskTitle}
                        setNewTaskTitle={profile.setNewTaskTitle}
                        newTaskPriority={profile.newTaskPriority}
                        setNewTaskPriority={profile.setNewTaskPriority}
                        handleAddTask={profile.handleAddTask}
                        handleCompleteTask={profile.handleCompleteTask}
                    />
                )}
                {profile.activeProfileTab === 'timeoff' && (
                    <TimeOffTab
                        isOwnProfile={isOwnProfile}
                        canManageEmployees={canManageTarget}
                        leaveRequests={profile.leaveRequests}
                        onRequestTimeOff={() => profile.setIsTimeOffModalOpen(true)}
                        onApproveRequest={profile.handleApproveLeave}
                        onRejectRequest={profile.handleRejectLeave}
                        countryCode={employee.country || (employee as any).country_code || 'ET'}
                    />
                )}
                {profile.activeProfileTab === 'docs' && (
                    <DocumentsTab
                        documents={profile.documents}
                        documentInputRef={profile.documentInputRef}
                        handleDocumentUpload={profile.handleDocumentUpload}
                        handleDeleteDocument={profile.handleDeleteDocument}
                        canUpload={canManageTarget || isOwnProfile}
                    />
                )}
                {profile.activeProfileTab === 'payroll' && (
                    <PayrollTab
                        employee={employee}
                        canManageEmployees={canManageTarget}
                        handleEditSalary={() => profile.setIsSalaryModalOpen(true)}
                        onViewPayslip={profile.handleViewPayslip}
                    />
                )}
                {profile.activeProfileTab === 'settings' && (
                    <SettingsTab
                        employee={employee}
                        sites={sites}
                        canEditStaff={canManageTarget}
                        isOwnProfile={isOwnProfile}
                        currentUser={user}
                        updateEmployee={updateEmployee}
                        currentPasswordInput={''}
                        setCurrentPasswordInput={() => {}}
                        newPasswordInput={profile.newPasswordInput}
                        setNewPasswordInput={profile.setNewPasswordInput}
                        confirmPasswordInput={profile.confirmPasswordInput}
                        setConfirmPasswordInput={profile.setConfirmPasswordInput}
                        isChangingPassword={profile.isChangingPassword}
                        handleUpdatePassword={profile.handleUpdatePassword}
                    />
                )}
            </div>

            {/* ACTION MODALS */}
            {profile.isMessageModalOpen && (
                <SendMessageModal
                    isOpen={profile.isMessageModalOpen}
                    onClose={() => profile.setIsMessageModalOpen(false)}
                    employee={employee}
                    messageInput={profile.messageInput}
                    setMessageInput={profile.setMessageInput}
                    handleConfirmSendMessage={() => {
                        profile.setIsMessageModalOpen(false);
                        addNotification('success', 'Message sent.');
                    }}
                />
            )}
            {profile.isPasswordModalOpen && (
                <ResetPasswordModal
                    isOpen={profile.isPasswordModalOpen}
                    onClose={() => profile.setIsPasswordModalOpen(false)}
                    employee={employee}
                    showResetPassword={true}
                    setShowResetPassword={() => {}}
                    passwordInput={profile.passwordInput}
                    setPasswordInput={profile.setPasswordInput}
                    handleConfirmResetPassword={profile.handleConfirmResetPassword}
                    isResetting={profile.isResetting}
                />
            )}
            {profile.isSalaryModalOpen && (
                <AdjustSalaryModal
                    isOpen={profile.isSalaryModalOpen}
                    onClose={() => profile.setIsSalaryModalOpen(false)}
                    employee={employee}
                    salaryInput={profile.salaryInput}
                    setSalaryInput={profile.setSalaryInput}
                    onSuccess={() => {
                        profile.setIsSalaryModalOpen(false);
                    }}
                />
            )}
            {profile.idCardOpen && (
                <EmployeeIDCard
                    employee={employee}
                    siteCode={sites.find(s => s.id === employee.siteId)?.code || 'HQ'}
                    onClose={() => profile.setIdCardOpen(false)}
                />
            )}
            {profile.isEditorOpen && profile.pendingImageSrc && (
                <ImageEditorModal
                    isOpen={profile.isEditorOpen}
                    imageSrc={profile.pendingImageSrc}
                    onClose={() => {
                        profile.setIsEditorOpen(false);
                        profile.setPendingImageSrc(null);
                    }}
                    onSave={(croppedResult) => {
                        profile.handleSaveEditedPhoto(croppedResult);
                    }}
                />
            )}
            {profile.isTimeOffModalOpen && (
                <RequestTimeOffModal
                    isOpen={profile.isTimeOffModalOpen}
                    onClose={() => profile.setIsTimeOffModalOpen(false)}
                    onSubmit={profile.handleRequestTimeOff}
                />
            )}
            {profile.isPayslipModalOpen && profile.selectedPayslip && (
                <PayslipModal
                    isOpen={profile.isPayslipModalOpen}
                    onClose={() => profile.setIsPayslipModalOpen(false)}
                    employee={employee}
                    payslip={profile.selectedPayslip}
                    siteName={siteName}
                    currencySymbol={currencySymbol}
                />
            )}
        </div>
    );
}
