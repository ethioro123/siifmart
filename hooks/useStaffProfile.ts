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

interface UseStaffProfileProps {
    employee: Employee;
    user: any;
    allTasks: EmployeeTask[];
    setTasks: (tasks: EmployeeTask[]) => void;
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
    const [isMobileTabsOpen, setIsMobileTabsOpen] = useState(false);

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

    // Documents state
    const [documents, setDocuments] = useState<EmployeeDocument[]>(() => getEmployeeDocuments(employee.id));

    // Leave requests state
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => getEmployeeLeaveRequests(employee.id));

    // Payslip modal state
    const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(null);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

    const profilePhotoInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    // Sync documents and leaves when target employee switches
    useEffect(() => {
        setDocuments(getEmployeeDocuments(employee.id));
        setLeaveRequests(getEmployeeLeaveRequests(employee.id));
    }, [employee.id]);

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        const newTask: EmployeeTask = {
            id: `T-${Date.now()}`,
            title: newTaskTitle.trim(),
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
        const updated = allTasks.map(t => (t.id === taskId ? { ...t, status: 'Completed' as const } : t));
        setTasks(updated);
        addNotification('success', 'Task marked as completed');
    };

    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const sizeFormatted = file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const newDoc = addEmployeeDocument(employee.id, file.name, sizeFormatted, dataUrl);
            setDocuments(prev => [newDoc, ...prev]);
            addNotification('success', `Uploaded document: ${file.name}`);
            if (documentInputRef.current) {
                documentInputRef.current.value = '';
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteDocument = (docId: string) => {
        removeEmployeeDocument(employee.id, docId);
        setDocuments(prev => prev.filter(d => d.id !== docId));
        addNotification('info', 'Document removed');
    };

    const handleRequestTimeOff = (request: { type: string; startDate: string; endDate: string; reason?: string }) => {
        const newReq = addEmployeeLeaveRequest(employee.id, request);
        setLeaveRequests(prev => [newReq, ...prev]);
        setIsTimeOffModalOpen(false);
        addNotification('success', `Time off request submitted (${request.type})`);
    };

    const handleApproveLeave = (requestId: string) => {
        updateEmployeeLeaveRequestStatus(employee.id, requestId, 'Approved');
        setLeaveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Approved' } : r));
        addNotification('success', 'Leave request approved');
    };

    const handleRejectLeave = (requestId: string) => {
        updateEmployeeLeaveRequestStatus(employee.id, requestId, 'Rejected');
        setLeaveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Rejected' } : r));
        addNotification('info', 'Leave request rejected');
    };

    const handleViewPayslip = (payslip: PayslipRecord) => {
        setSelectedPayslip(payslip);
        setIsPayslipModalOpen(true);
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
        isMobileTabsOpen, setIsMobileTabsOpen,
        newPasswordInput, setNewPasswordInput,
        confirmPasswordInput, setConfirmPasswordInput,
        passwordInput, setPasswordInput,
        profilePhotoInputRef, documentInputRef,
        pendingImageSrc, setPendingImageSrc,
        isEditorOpen, setIsEditorOpen,
        newTaskTitle, setNewTaskTitle,
        newTaskPriority, setNewTaskPriority,
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
