import React, { useState, useRef, useEffect } from 'react';
import {
    Briefcase, Mail, Phone, Shield, Star, Calendar, Award, CheckCircle, Clock,
    AlertTriangle, DollarSign, ClipboardList, TrendingUp, User, Plus, Trash2,
    ArrowRight, MapPin, Upload, CreditCard, MessageSquare, Download, XCircle,
    Key, Camera, Trophy, Zap, Target, Gift, Crown, Building, LayoutDashboard, 
    FileText, Settings, Store, UserCheck, Package, Loader2, Eye, EyeOff, ChevronDown
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, Tooltip
} from 'recharts';
import { CURRENCY_SYMBOL } from '../constants';
import { formatCompactNumber, formatRole } from '../utils/formatting';
import { SYSTEM_ROLES, getRoleHierarchy } from '../utils/roles';
import { authService } from '../services/auth.service';
import OverviewTab from './staff-profile/tabs/OverviewTab';
import GamificationTab from './staff-profile/tabs/GamificationTab';
import PayrollTab from './staff-profile/tabs/PayrollTab';
import SettingsTab from './staff-profile/tabs/SettingsTab';
import TasksTab from './staff-profile/tabs/TasksTab';
import TimeOffTab from './staff-profile/tabs/TimeOffTab';
import DocumentsTab from './staff-profile/tabs/DocumentsTab';
import ResetPasswordModal from './staff-profile/modals/ResetPasswordModal';
import SendMessageModal from './staff-profile/modals/SendMessageModal';
import AdjustSalaryModal from './staff-profile/modals/AdjustSalaryModal';
import TerminateEmployeeModal from './staff-profile/modals/TerminateEmployeeModal';
import {
    Employee,
    EmployeeTask,
    UserRole,
    DEFAULT_POS_BONUS_TIERS,
    DEFAULT_POS_ROLE_DISTRIBUTION,
    DEFAULT_BONUS_TIERS
} from '../types';
import { calculateBonus } from './WorkerPointsDisplay';
import { calculateStoreBonus } from './StoreBonusDisplay';
import { hasPermission } from '../utils/permissions';
import Modal from './Modal';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import EmployeeIDCard from './EmployeeIDCard';

// --- CONSTANTS ---
const ATTENDANCE_DATA = [
    { day: 'Mon', hours: 8.5 },
    { day: 'Tue', hours: 8.0 },
    { day: 'Wed', hours: 7.5 },
    { day: 'Thu', hours: 9.0 },
    { day: 'Fri', hours: 8.0 },
];



type ProfileTab = 'overview' | 'tasks' | 'timeoff' | 'payroll' | 'docs' | 'gamification' | 'settings';

const PROFILE_TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'gamification', label: 'Gamification', icon: Trophy },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'timeoff', label: 'Leave', icon: Calendar },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings }
];

interface StaffProfileViewProps {
    employee: Employee;
    isOwnProfile?: boolean;
    onClose?: () => void;
    terminateInput?: string;
    setTerminateInput?: (val: string) => void;
    handleConfirmTermination?: () => void;
}

export default function StaffProfileView({ employee, isOwnProfile = false, onClose, terminateInput = '', setTerminateInput = () => {}, handleConfirmTermination = () => {} }: StaffProfileViewProps) {
    const { user, updateUserAvatar } = useStore();
    const {
        tasks: allTasks,
        setTasks,
        sites,
        addNotification,
        updateEmployee,
        deleteEmployee,
        settings,
        getStorePoints
    } = useData();

    const { getWorkerPoints } = useGamification();

    const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('overview');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

    // Modal states
    const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [salaryInput, setSalaryInput] = useState('');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [currentPasswordInput, setCurrentPasswordInput] = useState('');
    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isDeleteDocumentModalOpen, setIsDeleteDocumentModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<{ docIndex: number, docName: string } | null>(null);
    const [idCardOpen, setIdCardOpen] = useState(false);

    // Terminate / Delete states
    const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMobileTabsOpen, setIsMobileTabsOpen] = useState(false);

    // Refs
    const profilePhotoInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    // Filtered tasks for this employee
    const employeeTasks = allTasks.filter(t => t.assignedTo === employee.id);

    // Permissions
    const canManageEmployees = hasPermission(user?.role, 'EDIT_EMPLOYEE');
    const canViewPayroll = hasPermission(user?.role, 'VIEW_PAYROLL') || isOwnProfile;
    const userRoleLevel = user ? getRoleHierarchy(user.role) : 0;
    const targetRoleLevel = getRoleHierarchy(employee.role);
    const isSuperAdmin = user?.role === 'super_admin';
    const isHR = user?.role === 'hr' || user?.role === 'hr_manager';
    const isAdmin = user?.role === 'admin';
    const canAdjustPayroll = (isSuperAdmin || isHR || isAdmin) && !isOwnProfile;
    const canResetPassword = isSuperAdmin || (userRoleLevel > targetRoleLevel);
    const canTerminate = (isSuperAdmin || isHR) && userRoleLevel > targetRoleLevel && !isOwnProfile;
    const canDelete = isSuperAdmin && userRoleLevel > targetRoleLevel && !isOwnProfile;

    // --- ACTIONS ---

    const handleAddTask = () => {
        if (!newTaskTitle) return;
        const newTask: EmployeeTask = {
            id: `T-${Date.now()}`,
            title: newTaskTitle,
            description: 'Manual Assignment',
            assignedTo: employee.id,
            status: 'Pending',
            priority: newTaskPriority,
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
        };
        setTasks([...allTasks, newTask]);
        setNewTaskTitle('');
        addNotification('success', `Task assigned to ${employee.name}`);
    };

    const handleCompleteTask = (taskId: string) => {
        setTasks(allTasks.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
    };

    const handleRequestPhotoChange = () => {
        profilePhotoInputRef.current?.click();
    };

    const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real app, we would upload to storage. 
        // For now, we'll use a local URL or mock upload
        const reader = new FileReader();
        reader.onloadend = async () => {
            const result = reader.result as string;
            // Update employee record
            const updatedEmp = { ...employee, avatar: result };
            await updateEmployee(updatedEmp, user?.name || 'Admin');

            // If it's the current user, update global state
            if (isOwnProfile || user?.id === employee.id) {
                updateUserAvatar(result);
            }

            addNotification('success', 'Profile photo updated successfully!');
        };
        reader.readAsDataURL(file);
    };

    const handleSendMessage = () => {
        setIsMessageModalOpen(true);
    };

    const handleConfirmSendMessage = () => {
        if (!messageInput.trim()) return;
        addNotification('success', `Message sent to ${employee.name}`);
        setMessageInput('');
        setIsMessageModalOpen(false);
    };

    const handleResetPassword = () => {
        setIsPasswordModalOpen(true);
    };

    const handleConfirmResetPassword = async () => {
        if (passwordInput.length < 6) {
            addNotification('alert', 'Password must be at least 6 characters');
            return;
        }
        setIsResetting(true);
        try {
            await authService.adminResetPassword(employee.id, passwordInput);
            setPasswordInput('');
            setIsPasswordModalOpen(false);
            addNotification('success', `Password updated for ${employee.name}`);
        } catch (error: any) {
            addNotification('alert', error.message || 'Failed to reset password');
        } finally {
            setIsResetting(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPasswordInput || newPasswordInput !== confirmPasswordInput) {
            addNotification('alert', 'Passwords do not match');
            return;
        }
        if (newPasswordInput.length < 6) {
            addNotification('alert', 'Password must be at least 6 characters');
            return;
        }

        setIsChangingPassword(true);
        try {
            if (isOwnProfile) {
                // Update own password
                await authService.updatePassword(newPasswordInput);
                addNotification('success', 'Your password has been updated successfully!');
            } else {
                // Trigger password reset email for another user
                await authService.resetPassword(employee.email);
                addNotification('success', `Password reset email sent to ${employee.email}`);
            }

            setNewPasswordInput('');
            setConfirmPasswordInput('');
            setCurrentPasswordInput('');
        } catch (error: any) {
            addNotification('alert', error.message || 'Failed to update password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleEditSalary = () => {
        setSalaryInput(employee.salary?.toString() || '');
        setIsSalaryModalOpen(true);
    };

    const handleConfirmSalary = async () => {
        const val = parseFloat(salaryInput);
        if (isNaN(val)) return;
        await updateEmployee({ ...employee, salary: val }, user?.name || 'Admin');
        setIsSalaryModalOpen(false);
        addNotification('success', `Salary updated for ${employee.name}`);
    };

    const handleDownloadPayslip = (id: number) => {
        addNotification('info', `Downloading payslip #${id}...`);
    };

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        addNotification('success', `Document "${file.name}" uploaded successfully!`);
    };

    const handleDocumentDownload = (doc: any) => {
        addNotification('info', `Downloading ${doc.name}...`);
    };

    const handleDocumentDelete = (index: number, name: string) => {
        // Assuming 'documents' state and 'setDocuments' function exist in the actual component
        // For this change, we'll simulate the deletion and close the modal.
        // In a real app, you'd filter the documents array.
        // setDocuments(prev => prev.filter((_, i) => i !== documentToDelete.docIndex));
        setIsDeleteDocumentModalOpen(false);
        setDocumentToDelete(null); // Clear the document to delete
        addNotification('success', 'Document deleted.'); // Add a success notification
    };

    const handleTerminate = async () => {
        setIsTerminateModalOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteEmployee(employee.id, user?.name || 'System');
            addNotification('success', `${employee.name} has been permanently deleted`);
            setIsDeleteModalOpen(false);
            if (onClose) onClose();
        } catch (error) {
            console.error('Failed to delete employee:', error);
            addNotification('alert', 'Failed to delete employee');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleConfirmDocumentDelete = () => {
        setIsDeleteDocumentModalOpen(false);
        setDocumentToDelete(null);
        addNotification('success', 'Document deleted.');
    };

    // --- RENDER HELPERS ---





    return (
        <div className="bg-white dark:bg-cyber-gray border border-gray-200 dark:border-white/5 rounded-2xl p-4 md:p-6 shadow-lg dark:shadow-2xl animate-in fade-in duration-500">
            {/* Header Profile */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-8 p-4 md:p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyber-primary/10 transition-all"></div>

                <div className="relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-cyber-primary/30 shadow-lg dark:shadow-2xl relative bg-gray-200 dark:bg-gray-800">
                        {employee.avatar ? (
                            <img src={employee.avatar} className="w-full h-full object-cover" alt={employee.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                                <User size={48} />
                            </div>
                        )}
                        {(isOwnProfile || canManageEmployees) && (
                            <button
                                onClick={handleRequestPhotoChange}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                title="Change Photo"
                            >
                                <Camera size={28} className="text-white" />
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={profilePhotoInputRef}
                        onChange={handleProfilePhotoSelect}
                        className="hidden"
                        accept="image/*"
                        title="Upload Profile Photo"
                    />
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tight">{employee.name}</h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center mt-2">
                                <span className="px-3 py-1 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {formatRole(employee.role)}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 text-sm font-medium flex items-center gap-1.5">
                                    <Building size={14} /> {employee.department}
                                </span>
                                <span className="text-cyan-600 dark:text-cyan-400 font-mono text-xs font-bold bg-cyan-100 dark:bg-cyan-400/10 px-2 py-0.5 rounded">
                                    ID: {employee.code || 'EMP-' + employee.id.substring(0, 5).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-center gap-2">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-widest uppercase ${employee.status === 'Active' ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20' :
                                employee.status === 'Pending Approval' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20' :
                                    'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                                }`}>
                                {employee.status}
                            </span>
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center md:justify-start gap-2 mt-6 w-full md:w-auto">
                        {/* Generate ID - Available for all profiles */}
                        <button onClick={() => setIdCardOpen(true)} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white px-3 md:px-4 py-3 md:py-2 rounded-xl border border-gray-200 dark:border-white/10 transition-all uppercase tracking-widest">
                            <CreditCard size={14} /> ID Card
                        </button>

                        {/* Manager-only actions */}
                        {!isOwnProfile && (
                            <>
                                <button onClick={handleSendMessage} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white px-3 md:px-4 py-3 md:py-2 rounded-xl border border-gray-200 dark:border-white/10 transition-all uppercase tracking-widest">
                                    <MessageSquare size={14} /> Message
                                </button>
                                {canResetPassword && (
                                    <button onClick={handleResetPassword} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-yellow-100 dark:bg-yellow-400/10 hover:bg-yellow-200 dark:hover:bg-yellow-400/20 text-yellow-600 dark:text-yellow-500 px-3 md:px-4 py-3 md:py-2 rounded-xl border border-yellow-200 dark:border-yellow-400/20 transition-all uppercase tracking-widest">
                                        <Key size={14} /> Reset
                                    </button>
                                )}
                                {canTerminate && employee.status !== 'Terminated' && (
                                    <button onClick={() => setIsTerminateModalOpen(true)} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-orange-100 dark:bg-orange-500/10 hover:bg-orange-200 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-500 px-3 md:px-4 py-3 md:py-2 rounded-xl border border-orange-200 dark:border-orange-500/20 transition-all uppercase tracking-widest">
                                        <AlertTriangle size={14} /> Terminate
                                    </button>
                                )}
                                {canDelete && (
                                    <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 px-3 md:px-4 py-3 md:py-2 rounded-xl border border-red-200 dark:border-red-500/20 transition-all uppercase tracking-widest">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation - Desktop */}
            <div className="hidden md:flex border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto no-scrollbar" role="tablist">
                {PROFILE_TABS.map((tab) => {
                    const isSelected = activeProfileTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isSelected ? "true" : "false"}
                            onClick={() => setActiveProfileTab(tab.id as ProfileTab)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${isSelected
                                ? 'text-cyber-primary border-cyber-primary bg-cyber-primary/5'
                                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                } ${tab.id === 'payroll' && !canViewPayroll ? 'hidden' : ''}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tabs Navigation - Mobile Dropdown */}
            <div className="md:hidden mb-6 relative">
                <button 
                    onClick={() => setIsMobileTabsOpen(!isMobileTabsOpen)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-black uppercase tracking-widest text-sm shadow-lg overflow-hidden"
                >
                    <div className="flex items-center gap-3">
                        {(() => {
                            const TabIcon = PROFILE_TABS.find(t => t.id === activeProfileTab)?.icon || LayoutDashboard;
                            return <TabIcon size={20} className="text-cyber-primary" />;
                        })()}
                        {PROFILE_TABS.find(t => t.id === activeProfileTab)?.label}
                    </div>
                    <ChevronDown size={20} className={`text-cyber-primary transition-transform duration-300 ${isMobileTabsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMobileTabsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-cyber-dark border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                        {PROFILE_TABS.map((tab) => {
                            const isSelected = activeProfileTab === tab.id;
                            if (tab.id === 'payroll' && !canViewPayroll) return null;
                            
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveProfileTab(tab.id as ProfileTab);
                                        setIsMobileTabsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-4 px-6 py-4 text-sm font-bold transition-all transition-colors ${isSelected
                                        ? 'bg-cyber-primary/10 text-cyber-primary'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeProfileTab === 'overview' && (
                    <OverviewTab employee={employee} employeeTasks={employeeTasks} sites={sites} />
                )}

                {activeProfileTab === 'gamification' && (
                    <GamificationTab
                        employee={employee}
                        settings={settings}
                        sites={sites}
                        getWorkerPoints={getWorkerPoints}
                        getStorePoints={getStorePoints}
                    />
                )}

                {activeProfileTab === 'tasks' && (
                    <TasksTab
                        canManageEmployees={canManageEmployees}
                        isOwnProfile={isOwnProfile}
                        employeeTasks={employeeTasks}
                        newTaskTitle={newTaskTitle}
                        setNewTaskTitle={setNewTaskTitle}
                        newTaskPriority={newTaskPriority}
                        setNewTaskPriority={setNewTaskPriority}
                        handleAddTask={handleAddTask}
                        handleCompleteTask={handleCompleteTask}
                    />
                )}
                {activeProfileTab === 'timeoff' && (
                    <TimeOffTab 
                        isOwnProfile={isOwnProfile} 
                        onRequestTimeOff={() => setIsTimeOffModalOpen(true)} 
                    />
                )}

                {activeProfileTab === 'docs' && (
                    <DocumentsTab 
                        documentInputRef={documentInputRef} 
                        handleDocumentUpload={handleDocumentUpload} 
                    />
                )}


                {activeProfileTab === 'payroll' && (
                    <PayrollTab 
                        employee={employee}
                        canManageEmployees={canAdjustPayroll}
                        handleEditSalary={handleEditSalary}
                        handleDownloadPayslip={handleDownloadPayslip}
                    />
                )}

                {activeProfileTab === 'settings' && (
                    <SettingsTab 
                        employee={employee}
                        sites={sites}
                        currentPasswordInput={currentPasswordInput}
                        setCurrentPasswordInput={setCurrentPasswordInput}
                        newPasswordInput={newPasswordInput}
                        setNewPasswordInput={setNewPasswordInput}
                        confirmPasswordInput={confirmPasswordInput}
                        setConfirmPasswordInput={setConfirmPasswordInput}
                        isChangingPassword={isChangingPassword}
                        handleUpdatePassword={handleUpdatePassword}
                    />
                )}
            </div >

            {/* ACTION MODALS */}

            {/* Time Off Modal */}
            <Modal isOpen={isTimeOffModalOpen} onClose={() => setIsTimeOffModalOpen(false)} title="Request Time Off" size="md">
                <TimeOffRequestForm
                    employee={employee}
                    onSubmit={(data) => {
                        addNotification('success', `Time off request for ${data.days} days submitted.`);
                        setIsTimeOffModalOpen(false);
                    }}
                />
            </Modal>

            {/* Message Modal */}
            <SendMessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                employee={employee}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                handleConfirmSendMessage={handleConfirmSendMessage}
            />

            {/* Reset Password Modal */}
            <ResetPasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                employee={employee}
                showResetPassword={showResetPassword}
                setShowResetPassword={setShowResetPassword}
                passwordInput={passwordInput}
                setPasswordInput={setPasswordInput}
                handleConfirmResetPassword={handleConfirmResetPassword}
                isResetting={isResetting}
            />

            {/* Edit Salary Modal */}
            <AdjustSalaryModal
                isOpen={isSalaryModalOpen}
                onClose={() => setIsSalaryModalOpen(false)}
                salaryInput={salaryInput}
                setSalaryInput={setSalaryInput}
                handleConfirmSalary={handleConfirmSalary}
            />

            {/* Delete Document Confirmation */}
            <Modal isOpen={isDeleteDocumentModalOpen} onClose={() => setIsDeleteDocumentModalOpen(false)} title="Security Confirmation" size="sm">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <Trash2 className="text-red-500" size={32} />
                        <div>
                            <h4 className="text-gray-900 dark:text-white font-bold">Delete Document?</h4>
                            <p className="text-xs text-red-500 dark:text-red-200">Permanently remove "{documentToDelete?.docName}"?</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsDeleteDocumentModalOpen(false)} className="px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase">Keep</button>
                        <button onClick={handleConfirmDocumentDelete} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-black rounded-lg text-xs uppercase">Delete Securely</button>
                    </div>
                </div>
            </Modal>

            {/* ID Card Modal - Uses Portal internally */}
            {idCardOpen && (
                <EmployeeIDCard
                    employee={employee}
                    siteCode={sites.find(s => s.id === employee.siteId)?.code || sites.find(s => s.id === employee.siteId)?.name || 'HQ'}
                    onClose={() => setIdCardOpen(false)}
                />
            )}

            {/* Terminate Employee Confirmation */}
            <TerminateEmployeeModal
                isOpen={isTerminateModalOpen}
                onClose={() => setIsTerminateModalOpen(false)}
                employee={employee}
                terminateInput={terminateInput}
                setTerminateInput={setTerminateInput}
                handleConfirmTermination={handleConfirmTermination}
            />

            {/* Permanent Delete Confirmation */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="System Action: Permanent Deletion" size="sm">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <Trash2 className="text-red-500" size={32} />
                        <div>
                            <h4 className="text-gray-900 dark:text-white font-bold">Permanent Deletion?</h4>
                            <p className="text-xs text-red-600 dark:text-red-200 dark:opacity-80">This action CANNOT be undone. All database records will be erased.</p>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl mb-6">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Record to Erase</p>
                        <p className="text-gray-900 dark:text-white font-bold">{employee.name}</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            disabled={isDeleting}
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Abort
                        </button>
                        <button
                            disabled={isDeleting}
                            onClick={handleDelete}
                            className="px-8 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-xs uppercase shadow-lg shadow-red-500/20 flex items-center gap-2"
                        >
                            {isDeleting ? (
                                <><Loader2 size={14} className="animate-spin" /> Erasing...</>
                            ) : (
                                "Execute Deletion"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}

// Sub-component for Time Off Request
function TimeOffRequestForm({ employee, onSubmit }: { employee: Employee; onSubmit: (data: any) => void }) {
    const [type, setType] = useState('Annual Leave');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [days, setDays] = useState(0);

    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            setDays(diff > 0 ? diff : 0);
        }
    }, [startDate, endDate]);

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Leave Category</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyber-primary"
                        title="Leave Category"
                    >
                        <option value="Annual Leave">Annual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Personal Leave">Personal Leave</option>
                        <option value="Emergency">Emergency</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyber-primary font-mono"
                        title="Start Date"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyber-primary font-mono"
                        title="End Date"
                    />
                </div>
            </div>

            <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Reason / Justification</label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Specify reason for absence..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-cyber-primary min-h-[100px]"
                />
            </div>

            <div className="flex items-center justify-between p-4 bg-cyber-primary/5 rounded-xl border border-cyber-primary/20">
                <span className="text-gray-400 text-xs font-bold font-mono">Total Duration:</span>
                <span className="text-cyber-primary font-black">{days} Days</span>
            </div>

            <button
                onClick={() => onSubmit({ type, startDate, endDate, reason, days })}
                disabled={!startDate || !endDate || days <= 0}
                className="w-full py-4 bg-cyber-primary hover:bg-cyber-accent text-black font-black uppercase tracking-widest rounded-xl disabled:opacity-30 transition-all"
            >
                Confirm Request
            </button>
        </div>
    );
}
