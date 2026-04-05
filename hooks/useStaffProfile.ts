import { useState, useRef } from 'react';
import { Employee, EmployeeTask } from '../types';
import { authService } from '../services/auth.service';

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

    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');

    const profilePhotoInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const handleAddTask = (title: string, priority: 'Low' | 'Medium' | 'High') => {
        if (!title) return;
        const newTask: EmployeeTask = {
            id: `T-${Date.now()}`,
            title,
            description: 'Manual Assignment',
            assignedTo: employee.id,
            status: 'Pending',
            priority,
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
        };
        setTasks([...allTasks, newTask]);
        addNotification('success', `Task assigned to ${employee.name}`);
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
        reader.onloadend = async () => {
            const result = reader.result as string;
            await updateEmployee({ ...employee, avatar: result }, user?.name || 'Admin');
            if (user?.id === employee.id) updateUserAvatar(result);
            addNotification('success', 'Profile photo updated successfully!');
        };
        reader.readAsDataURL(file);
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
        handleAddTask, handleConfirmResetPassword, handleUpdatePassword, handleProfilePhotoSelect
    };
}
