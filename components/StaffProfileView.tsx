import React from 'react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import { hasPermission } from '../utils/permissions';
import { getRoleHierarchy } from '../utils/roles';
import { useStaffProfile } from '../hooks/useStaffProfile';

import StaffProfileHeader from './staff-profile/StaffProfileHeader';
import StaffProfileNavigation from './staff-profile/StaffProfileNavigation';
import OverviewTab from './staff-profile/tabs/OverviewTab';
import GamificationTab from './staff-profile/tabs/GamificationTab';
import TasksTab from './staff-profile/tabs/TasksTab';
import TimeOffTab from './staff-profile/tabs/TimeOffTab';
import DocumentsTab from './staff-profile/tabs/DocumentsTab';
import PayrollTab from './staff-profile/tabs/PayrollTab';
import SettingsTab from './staff-profile/tabs/SettingsTab';

import Modal from './Modal';
import ResetPasswordModal from './staff-profile/modals/ResetPasswordModal';
import SendMessageModal from './staff-profile/modals/SendMessageModal';
import AdjustSalaryModal from './staff-profile/modals/AdjustSalaryModal';
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

    // Permission Logic
    const userRoleLevel = user ? getRoleHierarchy(user.role) : 0;
    const targetRoleLevel = getRoleHierarchy(employee.role);
    const canManage = hasPermission(user?.role, 'EDIT_EMPLOYEE');
    const canViewPayroll = hasPermission(user?.role, 'VIEW_PAYROLL') || isOwnProfile;
    const canTerminate = (user?.role === 'super_admin' || user?.role === 'hr' || user?.role === 'hr_manager') && userRoleLevel > targetRoleLevel && !isOwnProfile;
    const canDelete = user?.role === 'super_admin' && userRoleLevel > targetRoleLevel && !isOwnProfile;

    return (
        <div className="bg-white dark:bg-cyber-gray border border-gray-200 dark:border-white/5 rounded-2xl p-4 md:p-6 shadow-lg shadow-2xl animate-in fade-in duration-500">
            <StaffProfileHeader 
                employee={employee} isOwnProfile={isOwnProfile} canManageEmployees={canManage} 
                canResetPassword={userRoleLevel > targetRoleLevel} canTerminate={canTerminate} canDelete={canDelete}
                isOnline={isOnline}
                onPhotoRequest={onRequestPhotoChange || (() => profile.profilePhotoInputRef.current?.click())}
                onIdCard={() => profile.setIdCardOpen(true)} onMessage={() => profile.setIsMessageModalOpen(true)}
                onResetPassword={() => profile.setIsPasswordModalOpen(true)} 
                onTerminate={props.handleConfirmTermination || (() => {})} onDelete={() => {}}
                photoInputRef={profile.profilePhotoInputRef} handleProfilePhotoSelect={profile.handleProfilePhotoSelect}
            />

            <StaffProfileNavigation 
                activeProfileTab={profile.activeProfileTab} setActiveProfileTab={profile.setActiveProfileTab}
                isMobileTabsOpen={profile.isMobileTabsOpen} setIsMobileTabsOpen={profile.setIsMobileTabsOpen}
                canViewPayroll={canViewPayroll}
            />

            <div className="min-h-[400px]">
                {profile.activeProfileTab === 'overview' && <OverviewTab employee={employee} employeeTasks={allTasks.filter(t => t.assignedTo === employee.id)} sites={sites} isOwnProfile={isOwnProfile} />}
                {profile.activeProfileTab === 'gamification' && <GamificationTab employee={employee} settings={settings} sites={sites} getWorkerPoints={getWorkerPoints} getStorePoints={getStorePoints} />}
                {profile.activeProfileTab === 'tasks' && <TasksTab canManageEmployees={canManage} isOwnProfile={isOwnProfile} employeeTasks={allTasks.filter(t => t.assignedTo === employee.id)} newTaskTitle={''} setNewTaskTitle={() => {}} newTaskPriority="Medium" setNewTaskPriority={() => {}} handleAddTask={() => {}} handleCompleteTask={() => {}} />}
                {profile.activeProfileTab === 'timeoff' && <TimeOffTab isOwnProfile={isOwnProfile} onRequestTimeOff={() => profile.setIsTimeOffModalOpen(true)} />}
                {profile.activeProfileTab === 'docs' && <DocumentsTab documentInputRef={profile.documentInputRef} handleDocumentUpload={() => {}} />}
                {profile.activeProfileTab === 'payroll' && <PayrollTab employee={employee} canManageEmployees={canManage && !isOwnProfile} handleEditSalary={() => profile.setIsSalaryModalOpen(true)} handleDownloadPayslip={() => {}} />}
                {profile.activeProfileTab === 'settings' && <SettingsTab employee={employee} sites={sites} currentPasswordInput={''} setCurrentPasswordInput={() => {}} newPasswordInput={profile.newPasswordInput} setNewPasswordInput={profile.setNewPasswordInput} confirmPasswordInput={profile.confirmPasswordInput} setConfirmPasswordInput={profile.setConfirmPasswordInput} isChangingPassword={profile.isChangingPassword} handleUpdatePassword={profile.handleUpdatePassword} />}
            </div>

            {/* ACTION MODALS */}
            {profile.isMessageModalOpen && <SendMessageModal isOpen={profile.isMessageModalOpen} onClose={() => profile.setIsMessageModalOpen(false)} employee={employee} messageInput={profile.messageInput} setMessageInput={profile.setMessageInput} handleConfirmSendMessage={() => { profile.setIsMessageModalOpen(false); addNotification('success', 'Message sent.'); }} />}
            {profile.isPasswordModalOpen && <ResetPasswordModal isOpen={profile.isPasswordModalOpen} onClose={() => profile.setIsPasswordModalOpen(false)} employee={employee} showResetPassword={true} setShowResetPassword={() => {}} passwordInput={profile.passwordInput} setPasswordInput={profile.setPasswordInput} handleConfirmResetPassword={profile.handleConfirmResetPassword} isResetting={profile.isResetting} />}
            {profile.isSalaryModalOpen && <AdjustSalaryModal isOpen={profile.isSalaryModalOpen} onClose={() => profile.setIsSalaryModalOpen(false)} salaryInput={profile.salaryInput} setSalaryInput={profile.setSalaryInput} handleConfirmSalary={() => { updateEmployee({ ...employee, salary: parseFloat(profile.salaryInput) }, user?.name || 'Admin'); profile.setIsSalaryModalOpen(false); addNotification('success', 'Salary updated.'); }} />}
            {profile.idCardOpen && <EmployeeIDCard employee={employee} siteCode={sites.find(s => s.id === employee.siteId)?.code || 'HQ'} onClose={() => profile.setIdCardOpen(false)} />}
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
        </div>
    );
}
