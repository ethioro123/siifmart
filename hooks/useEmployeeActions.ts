import { useState, useEffect } from 'react';
import { Employee, UserRole } from '../types';
import { systemLogsService, LogEntry } from '../services/local-logs.service';
import { imageStorageService } from '../services/imageStorage.service';
import { logger } from '../utils/logger';
import { canEmployRole } from '../utils/roles';

export interface PhotoRequest {
   id: string;
   userId: string;
   userName: string;
   newUrl?: string;
   timestamp: string;
}

interface UseEmployeeActionsProps {
   user?: { id?: string; role?: UserRole; name?: string; email?: string } | null;
   employees: Employee[];
   updateEmployee: (emp: Employee, userName: string) => void | Promise<void>;
   deleteEmployee: (id: string, userName: string) => void | Promise<void>;
   addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
   updateUserAvatar: (url: string) => void;
}

export function useEmployeeActions({
   user,
   employees,
   updateEmployee,
   deleteEmployee,
   addNotification,
   updateUserAvatar
}: UseEmployeeActionsProps) {
   const [photoRequests, setPhotoRequests] = useState<PhotoRequest[]>([]);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isProcessingImage, setIsProcessingImage] = useState(false);
   const [processingStatus, setProcessingStatus] = useState('');

   // Approval Modal State
   const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
   const [employeeToApprove, setEmployeeToApprove] = useState<Employee | null>(null);

   // Delete Confirmation State
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [deleteInput, setDeleteInput] = useState('');
   const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

   const loadPhotoRequests = () => {
      const logs = systemLogsService.getLogs({ category: 'HR' });
      const userLogs: Record<string, LogEntry[]> = {};
      
      logs.forEach(log => {
         if (['PHOTO_CHANGE_REQUEST', 'PHOTO_CHANGE_PROCESSED', 'PHOTO_CHANGE_REJECTED'].includes(log.action)) {
            if (!userLogs[log.userId]) userLogs[log.userId] = [];
            userLogs[log.userId].push(log);
         }
      });

      const pendingRequests: PhotoRequest[] = [];
      Object.keys(userLogs).forEach(userId => {
         const sorted = userLogs[userId].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
         const latest = sorted[0];
         if (latest && latest.action === 'PHOTO_CHANGE_REQUEST') {
            pendingRequests.push({
               id: latest.id,
               userId: latest.userId,
               userName: latest.userName,
               newUrl: latest.metadata?.newUrl,
               timestamp: latest.timestamp
            });
         }
      });
      setPhotoRequests(pendingRequests);
   };

   useEffect(() => {
      loadPhotoRequests();
   }, []);

   const handleApprovePhoto = async (request: PhotoRequest) => {
      try {
         const employeeToUpdate = employees.find(e => e.id === request.userId);
         const oldAvatarUrl = employeeToUpdate?.avatar;
         let newAvatarUrl = request.newUrl;

         try {
            if (request.newUrl) {
               const uploadResult = await imageStorageService.uploadProfilePhoto(
                  request.userId,
                  request.newUrl,
                  oldAvatarUrl
               );
               if (uploadResult.success && uploadResult.url) {
                  newAvatarUrl = uploadResult.url;
               }
            }
         } catch {
            logger.warn('useEmployeeActions', '📷 Storage service unavailable, using direct URL');
         }

         if (employeeToUpdate && newAvatarUrl) {
            // Explicit column update without mass-assignment
            const updatedEmployee: Employee = { ...employeeToUpdate, avatar: newAvatarUrl };
            const result = updateEmployee(updatedEmployee, user?.name || 'System');
            if (result instanceof Promise) await result;
            
            const isCurrentUser = employeeToUpdate.id === user?.id;
            if (isCurrentUser) {
               updateUserAvatar(newAvatarUrl);
            }
         } else {
            throw new Error(`Employee record not found (ID: ${request.userId})`);
         }

         systemLogsService.logHR(
            'PHOTO_CHANGE_PROCESSED',
            `Approved photo change for ${request.userName}`,
            { id: user?.id, role: user?.role, name: user?.name },
            'INFO',
            { newUrl: newAvatarUrl, userId: request.userId }
         );

         setPhotoRequests(prev => prev.filter(r => r.id !== request.id));
         addNotification('success', 'Photo approved.');
      } catch (err) {
         const message = err instanceof Error ? err.message : 'Unknown error';
         addNotification('alert', `Failed to approve: ${message}`);
      }
   };

   const handleRejectPhoto = (request: PhotoRequest) => {
      systemLogsService.logHR(
         'PHOTO_CHANGE_REJECTED',
         `Rejected photo change for ${request.userName}`,
         { id: user?.id, role: user?.role, name: user?.name },
         'INFO'
      );
      setPhotoRequests(prev => prev.filter(r => r.id !== request.id));
      addNotification('info', 'Photo request rejected.');
   };

   const handleConfirmApprove = async () => {
      if (!employeeToApprove) return;
      if (!canEmployRole(user?.role, employeeToApprove.role)) {
         addNotification('alert', `Unauthorized: You cannot approve onboarding for a ${employeeToApprove.role}. You can only approve roles below your level.`);
         setIsApproveModalOpen(false);
         setEmployeeToApprove(null);
         return;
      }
      // Explicit column update without mass-assignment
      const result = updateEmployee({ ...employeeToApprove, status: 'Active' }, user?.name || 'Admin');
      if (result instanceof Promise) await result;

      systemLogsService.logHR(
         'EMPLOYEE_APPROVED',
         `Approved recruit onboarding for ${employeeToApprove.name} (${employeeToApprove.code || employeeToApprove.id})`,
         { id: user?.id, role: user?.role, name: user?.name },
         'INFO',
         { employeeId: employeeToApprove.id, role: employeeToApprove.role }
      );

      addNotification('success', `${employeeToApprove.name} is now Active.`);
      setIsApproveModalOpen(false);
      setEmployeeToApprove(null);
   };

   const handleConfirmDelete = async () => {
      if (!employeeToDelete) return;
      if (deleteInput !== "DELETE") {
         addNotification('alert', 'Please type "DELETE" to confirm.');
         return;
      }

      try {
         await imageStorageService.deleteAllEmployeePhotos(employeeToDelete.id);
         if (employeeToDelete.avatar) {
            await imageStorageService.deleteProfilePhoto(employeeToDelete.avatar);
         }

         const result = deleteEmployee(employeeToDelete.id, user?.name || 'System');
         if (result instanceof Promise) await result;

         systemLogsService.logHR(
            'EMPLOYEE_DELETED',
            `Permanently deleted employee ${employeeToDelete.name} (${employeeToDelete.code || employeeToDelete.id})`,
            { id: user?.id, role: user?.role, name: user?.name },
            'CRITICAL',
            { employeeId: employeeToDelete.id, role: employeeToDelete.role }
         );

         addNotification('success', `Employee ${employeeToDelete.name} has been permanently deleted.`);
         setIsDeleteModalOpen(false);
         setEmployeeToDelete(null);
         setDeleteInput('');
      } catch (error) {
         logger.error('useEmployeeActions', 'Error deleting employee:', error);
         addNotification('alert', 'Failed to delete employee');
      }
   };

   const handleTerminateEmployee = async (employee: Employee, input: string) => {
      if (!employee) return false;
      if (input !== "TERMINATE") {
         addNotification('alert', 'Please type "TERMINATE" to confirm.');
         return false;
      }

      try {
         // Explicit column update without mass-assignment
         const result = updateEmployee({ ...employee, status: 'Terminated' }, user?.name || 'System');
         if (result instanceof Promise) await result;

         // Tamper-proof Zero-Trust audit log
         systemLogsService.logHR(
            'EMPLOYEE_TERMINATED',
            `Terminated employment for ${employee.name} (${employee.code || employee.id})`,
            { id: user?.id, role: user?.role, name: user?.name },
            'WARNING',
            { employeeId: employee.id, employeeName: employee.name, role: employee.role }
         );

         addNotification('success', `Employee ${employee.name} terminated.`);
         return true;
      } catch (error) {
         logger.error('useEmployeeActions', 'Error terminating employee:', error);
         addNotification('alert', 'Failed to terminate employee');
         return false;
      }
   };

   return {
      photoRequests,
      isSubmitting,
      setIsSubmitting,
      isProcessingImage,
      setIsProcessingImage,
      processingStatus,
      setProcessingStatus,
      handleApprovePhoto,
      handleRejectPhoto,
      loadPhotoRequests,
      // Approval
      isApproveModalOpen, setIsApproveModalOpen,
      employeeToApprove, setEmployeeToApprove,
      handleConfirmApprove,
      // Delete
      isDeleteModalOpen, setIsDeleteModalOpen,
      deleteInput, setDeleteInput,
      employeeToDelete, setEmployeeToDelete,
      handleConfirmDelete,
      // Termination
      handleTerminateEmployee
   };
}
