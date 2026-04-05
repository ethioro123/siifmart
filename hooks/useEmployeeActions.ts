import { useState, useEffect } from 'react';
import { Employee, UserRole } from '../types';
import { systemLogsService } from '../services/systemLogs.service';
import { imageStorageService } from '../services/imageStorage.service';

interface UseEmployeeActionsProps {
   user: any;
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
   const [photoRequests, setPhotoRequests] = useState<any[]>([]);
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
      const userLogs: Record<string, any[]> = {};
      
      logs.forEach(log => {
         if (['PHOTO_CHANGE_REQUEST', 'PHOTO_CHANGE_PROCESSED', 'PHOTO_CHANGE_REJECTED'].includes(log.action)) {
            if (!userLogs[log.userId]) userLogs[log.userId] = [];
            userLogs[log.userId].push(log);
         }
      });

      const pendingRequests: any[] = [];
      Object.keys(userLogs).forEach(userId => {
         const sorted = userLogs[userId].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
         const latest = sorted[0];
         if (latest.action === 'PHOTO_CHANGE_REQUEST') {
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

   const handleApprovePhoto = async (request: any) => {
      try {
         const employeeToUpdate = employees.find(e => e.id === request.userId);
         const oldAvatarUrl = employeeToUpdate?.avatar;
         let newAvatarUrl = request.newUrl;

         try {
            const uploadResult = await imageStorageService.uploadProfilePhoto(
               request.userId,
               request.newUrl,
               oldAvatarUrl
            );
            if (uploadResult.success && uploadResult.url) {
               newAvatarUrl = uploadResult.url;
            }
         } catch (storageError) {
            console.warn('📷 Storage service unavailable:', storageError);
         }

         if (employeeToUpdate) {
            const updatedEmployee = { ...employeeToUpdate, avatar: newAvatarUrl };
            const result = updateEmployee(updatedEmployee, user?.name || 'System');
            if (result instanceof Promise) await result;
            
            const isCurrentUser = employeeToUpdate.id === user?.id || employeeToUpdate.id === (user as any)?.employeeId;
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
      } catch (err: any) {
         addNotification('alert', `Failed to approve: ${err.message}`);
      }
   };

   const handleRejectPhoto = (request: any) => {
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
      const result = updateEmployee({ ...employeeToApprove, status: 'Active' }, user?.name || 'Admin');
      if (result instanceof Promise) await result;
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
         addNotification('success', `Employee ${employeeToDelete.name} has been permanently deleted.`);
         setIsDeleteModalOpen(false);
         setEmployeeToDelete(null);
         setDeleteInput('');
      } catch (error) {
         console.error('Error deleting employee:', error);
         addNotification('alert', 'Failed to delete employee');
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
      handleConfirmDelete
   };
}
