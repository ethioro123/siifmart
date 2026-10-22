import { useState, useEffect } from 'react';
import { Employee, UserRole } from '../types';
import { systemLogsService, LogEntry } from '../services/local-logs.service';
import { imageStorageService } from '../services/imageStorage.service';
import { logger } from '../utils/logger';
import { canEmployRole } from '../utils/roles';
import { terminationsService } from '../services/terminations.service';
import type { TerminationReasonCode } from '../types/hr-zero-trust';
import { createAuthAccountForNewHire } from '../utils/employeeAuthHelper';

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

      // Enforce regional boundary for regional approvers
      const isRegionalUser = ['regional_operations_manager', 'regional_hr_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_logistics_manager', 'regional_security_manager'].includes(user?.role || '') || (user as any)?.scopeLevel === 'REGIONAL' || (user as any)?.scope_level === 'REGIONAL';
      const userRegion = (user as any)?.regionCode || (user as any)?.region_code;
      const empRegion = employeeToApprove.regionCode || (employeeToApprove as any).region_code;
      if (isRegionalUser && userRegion && empRegion && empRegion !== userRegion) {
         addNotification('alert', `Unauthorized: You can only approve employees within your regional boundary (${userRegion}).`);
         setIsApproveModalOpen(false);
         setEmployeeToApprove(null);
         return;
      }

      // Provision auth credentials if missing or pending
      const empId = employeeToApprove.id;
      const empCode = employeeToApprove.code || empId;
      const nameKey = (employeeToApprove.name || '').toLowerCase();
      const codeKey = empCode.toLowerCase();

      let existingPassword = typeof window !== 'undefined'
         ? (localStorage.getItem(`siifmart_temp_pwd_${empId}`) ||
            localStorage.getItem(`siifmart_temp_pwd_by_code_${codeKey}`) ||
            localStorage.getItem(`siifmart_temp_pwd_by_name_${nameKey}`))
         : null;

      if (!existingPassword) {
         const numericPin = empCode.replace(/\D/g, '').slice(-4) || '1234';
         existingPassword = `SiifMart@${numericPin}`;
         if (typeof window !== 'undefined') {
            localStorage.setItem(`siifmart_temp_pwd_${empId}`, existingPassword);
            localStorage.setItem(`siifmart_temp_pwd_by_code_${codeKey}`, existingPassword);
            localStorage.setItem(`siifmart_temp_pwd_by_name_${nameKey}`, existingPassword);
         }
      }

      const nameParts = (employeeToApprove.name || '').trim().split(' ');
      const firstName = nameParts[0] || 'Staff';
      const lastName = nameParts.slice(1).join(' ') || 'Member';

      try {
         const authResult = await createAuthAccountForNewHire({
            signupEmail: employeeToApprove.email,
            password: existingPassword,
            firstName,
            lastName,
            role: employeeToApprove.role,
            siteId: employeeToApprove.siteId || (employeeToApprove as any).site_id || '',
            employeeCode: empCode,
            fallbackEmployeeId: empId
         });

         if (authResult.error && !authResult.accountCreated) {
            logger.warn('useEmployeeActions', 'Auth signup returned error during approval', { error: authResult.error });
            addNotification('alert', `Staff approved, but login provisioning returned an alert: ${authResult.error}. Please verify credentials in Handover.`);
         }
      } catch (authErr) {
         logger.warn('useEmployeeActions', 'Auth signup exception during approval', { error: authErr });
      }

      const updatedBadges = Array.isArray(employeeToApprove.badges)
         ? employeeToApprove.badges.filter(b => b !== 'Pending HR Review').concat('New Hire')
         : ['New Hire'];
      // Explicit column update without mass-assignment
      const result = updateEmployee({ ...employeeToApprove, status: 'Active', badges: updatedBadges }, user?.name || 'Admin');
      if (result instanceof Promise) await result;

      systemLogsService.logHR(
         'EMPLOYEE_APPROVED',
         `Approved recruit onboarding for ${employeeToApprove.name} (${employeeToApprove.code || employeeToApprove.id})`,
         { id: user?.id, role: user?.role, name: user?.name },
         'INFO',
         { employeeId: employeeToApprove.id, role: employeeToApprove.role }
      );

      if (typeof window !== 'undefined') {
         window.dispatchEvent(new CustomEvent('employee:approved', { detail: { employeeId: employeeToApprove.id } }));
         window.dispatchEvent(new CustomEvent('employee:updated'));
      }

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

   const handleTerminateEmployee = async (
      employee: Employee, 
      input: string,
      terminationDetails?: {
         reasonCode?: TerminationReasonCode;
         reasonDetails?: string;
         effectiveDate?: string;
         assetsReturned?: boolean;
         posAccessRevoked?: boolean;
         wmsBadgeDeactivated?: boolean;
         keysSurrendered?: boolean;
         cashDrawerReconciled?: boolean;
         reconciliationNotes?: string;
      }
   ) => {
      if (!employee) return false;
      if (input !== "TERMINATE") {
         addNotification('alert', 'Please type "TERMINATE" to confirm.');
         return false;
      }

      const reasonCode: TerminationReasonCode = terminationDetails?.reasonCode || 'gross_misconduct';
      const reasonDetails = terminationDetails?.reasonDetails || 'Structured offboarding under Zero-Trust dual control.';
      const effectiveDate = terminationDetails?.effectiveDate || new Date().toISOString().split('T')[0];

      try {
         // 1. Propose termination via Zero-Trust terminationsService (Rule 18 Audit & 4-Eyes Governance)
         const proposed = await terminationsService.proposeTermination({
            country_code: employee.country || (employee as any).country_code || 'ET',
            site_id: employee.siteId || employee.site_id,
            employee_id: employee.id,
            employee_name: employee.name,
            employee_role: employee.role,
            reason_code: reasonCode,
            reason_details: reasonDetails,
            effective_date: effectiveDate,
            assets_returned: Boolean(terminationDetails?.assetsReturned),
            pos_access_revoked: Boolean(terminationDetails?.posAccessRevoked),
            wms_badge_deactivated: Boolean(terminationDetails?.wmsBadgeDeactivated),
            keys_surrendered: Boolean(terminationDetails?.keysSurrendered),
            cash_drawer_reconciled: Boolean(terminationDetails?.cashDrawerReconciled),
            proposed_by: user?.id || 'unknown_manager',
            proposed_by_name: user?.name || 'Authorized Manager',
            proposed_by_role: user?.role || 'hr',
            reconciliation_notes: terminationDetails?.reconciliationNotes
         });

         // 2. If Super Admin, execute immediate sign-off under supervisory executive authority
         if (user?.role === 'super_admin') {
            await terminationsService.approveTermination(proposed.id, {
               id: user.id || 'super_admin',
               name: user.name || 'Super Admin',
               role: 'super_admin'
            });
            const result = updateEmployee({ ...employee, status: 'Terminated' }, user?.name || 'System');
            if (result instanceof Promise) await result;
            addNotification('success', `Employee ${employee.name} offboarded and terminated.`);
         } else {
            addNotification('info', `Termination proposal for ${employee.name} submitted for 4-Eyes dual approval.`);
         }

         return true;
      } catch (error: any) {
         logger.error('useEmployeeActions', 'Error terminating employee:', error);
         addNotification('alert', error.message || 'Failed to terminate employee');
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
