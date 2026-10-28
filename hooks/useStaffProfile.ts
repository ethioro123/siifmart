import { useState, useRef, useEffect } from 'react';
import { Employee, EmployeeTask } from '../types';
import { authService } from '../services/auth.service';
import {
    EmployeeDocument,
    LeaveRequest,
    PayslipRecord,
    getEmployeeDocuments,
    addEmployeeDocument,
    removeEmployeeDocument,
    getEmployeeLeaveRequests,
    addEmployeeLeaveRequest,
    updateEmployeeLeaveRequestStatus
} from '../utils/employeeProfileData';
import { leaveRequestsService } from '../services/leave-requests.service';
import { employeeDocumentsService } from '../services/employee-documents.service';
import { tasksService } from '../services/tasks.service';
import { getRoleHierarchy } from '../utils/roles';
import { isSovereignCEO } from '../utils/employeeGovernance';

interface UseStaffProfileProps {
    employee: Employee;
    user: any;
    allTasks: EmployeeTask[];
    setTasks: (tasks: EmployeeTask[] | ((prev: EmployeeTask[]) => EmployeeTask[])) => void;
    updateEmployee: (emp: Employee, user: string) => void | Promise<void>;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    updateUserAvatar: (url: string) => void;
}

export function useStaffProfile({
    employee,
    user,
    allTasks,
    setTasks,
    updateEmployee,
    addNotification,
    updateUserAvatar
}: UseStaffProfileProps) {
    const [activeProfileTab, setActiveProfileTab] = useState('overview');
    const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [salaryInput, setSalaryInput] = useState('');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isDeleteDocumentModalOpen, setIsDeleteDocumentModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<{ docIndex: number, docName: string } | null>(null);
    const [idCardOpen, setIdCardOpen] = useState(false);

    // Password fields
    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');

    // Photo avatar editor
    const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Tasks state
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [isSavingTask, setIsSavingTask] = useState(false);

    // Documents state
    const [documents, setDocuments] = useState<EmployeeDocument[]>(() => getEmployeeDocuments(employee.id));

    // Leave requests state
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => getEmployeeLeaveRequests(employee.id));

    // Payslip modal state
    const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(null);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

    const profilePhotoInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    // Sync documents, leaves, and persisted tasks when target employee switches
    useEffect(() => {
        setDocuments(getEmployeeDocuments(employee.id));
        setLeaveRequests(getEmployeeLeaveRequests(employee.id));

        let isMounted = true;
        tasksService.getByEmployee(employee.id).then(empTasks => {
            if (!isMounted || !Array.isArray(empTasks)) return;
            setTasks(prevTasks => {
                const currentTasks = Array.isArray(prevTasks) ? prevTasks : allTasks;
                const otherTasks = currentTasks.filter(t => t.assignedTo !== employee.id);
                return [...otherTasks, ...empTasks];
            });
        });
        return () => { isMounted = false; };
    }, [employee.id]);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || isSavingTask) return;
        setIsSavingTask(true);
        const targetSiteId = employee.siteId || (employee as any).site_id || user?.siteId || (user as any).site_id;
        const targetRegionCode = employee.regionCode || (employee as any).region_code || user?.regionCode || (user as any).region_code;
        const dueDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

        try {
            const savedTask = await tasksService.create({
                title: newTaskTitle.trim(),
                description: 'Manual Assignment',
                assignedTo: employee.id,
                status: 'Pending',
                priority: newTaskPriority,
                dueDate,
                siteId: targetSiteId,
                createdBy: user?.name || user?.id || 'Manager',
                regionCode: targetRegionCode,
                taskType: 'GENERAL'
            });

            if (savedTask && savedTask.id) {
                setTasks(prevTasks => {
                    const current = Array.isArray(prevTasks) ? prevTasks : allTasks;
                    return [...current.filter(t => t.id !== savedTask.id), savedTask];
                });
                setNewTaskTitle('');
                addNotification('success', `Task assigned to ${employee.name}`);
            } else {
                addNotification('alert', 'Failed to assign task. Please verify site assignment and permissions.');
            }
        } catch (error: any) {
            addNotification('alert', error?.message || 'Failed to assign task.');
        } finally {
            setIsSavingTask(false);
        }
    };

    const handleCompleteTask = async (taskId: string) => {
        try {
            const updated = await tasksService.update(taskId, { status: 'Completed' });
            if (updated) {
                setTasks(prevTasks => {
                    const current = Array.isArray(prevTasks) ? prevTasks : allTasks;
                    return current.map(t => t.id === taskId ? updated : t);
                });
                addNotification('success', 'Task marked as completed');
            } else {
                addNotification('alert', 'Failed to complete task. Please check permissions.');
            }
        } catch (error: any) {
            addNotification('alert', error?.message || 'Failed to complete task.');
        }
    };

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const sizeFormatted = file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            const newDoc = addEmployeeDocument(employee.id, file.name, sizeFormatted, dataUrl);
            setDocuments(prev => [newDoc, ...prev]);

            try {
                const docType = file.name.toLowerCase().includes('id') || file.name.toLowerCase().includes('passport')
                    ? 'national_id'
                    : (file.name.toLowerCase().includes('contract') ? 'contract' : 'other');

                await employeeDocumentsService.addDocument({
                    country_code: employee.country || (employee as any).country_code || 'ET',
                    employee_id: employee.id,
                    name: file.name,
                    doc_type: docType as any,
                    file_url: dataUrl,
                    file_size: file.size,
                    mime_type: file.type || 'application/octet-stream',
                    uploaded_by: user?.name || 'Authorized Staff'
                });
            } catch {
                // Service fallback handled
            }

            addNotification('success', `Uploaded document: ${file.name}`);
            if (documentInputRef.current) {
                documentInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteDocument = async (docId: string) => {
        removeEmployeeDocument(employee.id, docId);
        setDocuments(prev => prev.filter(d => d.id !== docId));
        try {
            await employeeDocumentsService.deleteDocument(docId, employee.id, user?.name || 'Authorized Staff');
        } catch {
            // Handled
        }
        addNotification('info', 'Document removed');
    };

    const handleRequestTimeOff = async (request: { type: string; startDate: string; endDate: string; reason?: string }) => {
        const newReq = addEmployeeLeaveRequest(employee.id, request);
        setLeaveRequests(prev => [newReq, ...prev]);
        setIsTimeOffModalOpen(false);

        try {
            const start = new Date(request.startDate);
            const end = new Date(request.endDate);
            const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

            let lType: any = 'annual';
            const reqTypeLower = request.type.toLowerCase();
            if (reqTypeLower.includes('sick') || reqTypeLower.includes('med')) lType = 'sick';
            else if (reqTypeLower.includes('emergency')) lType = 'emergency';
            else if (reqTypeLower.includes('unpaid')) lType = 'unpaid';

            await leaveRequestsService.createLeave({
                country_code: employee.country || (employee as any).country_code || 'ET',
                site_id: employee.siteId || employee.site_id,
                employee_id: employee.id,
                employee_name: employee.name,
                leave_type: lType,
                start_date: request.startDate,
                end_date: request.endDate,
                days: diffDays,
                reason: request.reason || 'Formal time-off request',
                requested_by: user?.name || employee.name
            });
        } catch {
            // Service fallback handled
        }

        addNotification('success', `Time off request submitted (${request.type})`);
    };

    const handleApproveLeave = async (requestId: string) => {
        try {
            await leaveRequestsService.reviewLeave(
                requestId,
                { id: user?.id || 'mgr', name: user?.name || 'Supervisory Manager', role: user?.role || 'hr' },
                'Approved'
            );
        } catch (err: any) {
            addNotification('alert', err.message || 'Maker-checker validation rejected leave approval.');
            return;
        }

        updateEmployeeLeaveRequestStatus(employee.id, requestId, 'Approved');
        setLeaveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Approved' } : r));
        addNotification('success', 'Leave request approved');
    };

    const handleRejectLeave = async (requestId: string) => {
        try {
            await leaveRequestsService.reviewLeave(
                requestId,
                { id: user?.id || 'mgr', name: user?.name || 'Supervisory Manager', role: user?.role || 'hr' },
                'Rejected'
            );
        } catch (err: any) {
            addNotification('alert', err.message || 'Action rejected');
            return;
        }

        updateEmployeeLeaveRequestStatus(employee.id, requestId, 'Rejected');
        setLeaveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Rejected' } : r));
        addNotification('info', 'Leave request rejected');
    };

    const handleViewPayslip = (payslip: PayslipRecord) => {
        setSelectedPayslip(payslip);
        setIsPayslipModalOpen(true);
    };

    const handleConfirmResetPassword = async () => {
        const isTargetCEO = isSovereignCEO(employee.role);
        const isActorCEO = isSovereignCEO(user?.role);
        const userLevel = user?.role ? getRoleHierarchy(user.role) : 0;
        const targetLevel = getRoleHierarchy(employee.role);

        if ((isTargetCEO && !isActorCEO) || (!isActorCEO && userLevel <= targetLevel)) {
            addNotification('alert', 'Hierarchy Violation: You are not authorized to reset the password of this employee.');
            return;
        }

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
        setIsChangingPassword(true);
        try {
            await authService.updatePassword(newPasswordInput);
            addNotification('success', 'Your password has been updated successfully!');
            setNewPasswordInput('');
            setConfirmPasswordInput('');
        } catch (error: any) {
            addNotification('alert', error.message || 'Failed to update password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPendingImageSrc(result);
            setIsEditorOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveEditedPhoto = async (croppedResult: string) => {
        try {
            await updateEmployee({ ...employee, avatar: croppedResult }, user?.name || 'Admin');
            if (user?.id === employee.id) updateUserAvatar(croppedResult);
            addNotification('success', 'Profile photo updated successfully!');
        } catch (error: any) {
            addNotification('alert', error.message || 'Failed to update profile photo');
        }
    };

    return {
        activeProfileTab, setActiveProfileTab,
        isTimeOffModalOpen, setIsTimeOffModalOpen,
        isMessageModalOpen, setIsMessageModalOpen,
        messageInput, setMessageInput,
        isSalaryModalOpen, setIsSalaryModalOpen,
        salaryInput, setSalaryInput,
        isPasswordModalOpen, setIsPasswordModalOpen,
        isResetting, isChangingPassword,
        isDeleteDocumentModalOpen, setIsDeleteDocumentModalOpen,
        documentToDelete, setDocumentToDelete,
        idCardOpen, setIdCardOpen,
        newPasswordInput, setNewPasswordInput,
        confirmPasswordInput, setConfirmPasswordInput,
        passwordInput, setPasswordInput,
        profilePhotoInputRef, documentInputRef,
        pendingImageSrc, setPendingImageSrc,
        isEditorOpen, setIsEditorOpen,
        newTaskTitle, setNewTaskTitle,
        newTaskPriority, setNewTaskPriority,
        isSavingTask,
        handleAddTask, handleCompleteTask,
        documents, handleDocumentUpload, handleDeleteDocument,
        leaveRequests, handleRequestTimeOff, handleApproveLeave, handleRejectLeave,
        selectedPayslip, setSelectedPayslip,
        isPayslipModalOpen, setIsPayslipModalOpen,
        handleViewPayslip,
        handleConfirmResetPassword, handleUpdatePassword, handleProfilePhotoSelect,
        handleSaveEditedPhoto
    };
}
