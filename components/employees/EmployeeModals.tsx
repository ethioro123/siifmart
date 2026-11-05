import React from 'react';
import Modal from '../Modal';
import StaffProfileView from '../StaffProfileView';
import EmployeeIDCard from '../EmployeeIDCard';
import AddEmployeeWizard from './modals/AddEmployeeWizard';
import TerminateEmployeeModal from './modals/TerminateEmployeeModal';
import DeleteEmployeeModal from './modals/DeleteEmployeeModal';
import ApproveEmployeeModal from './modals/ApproveEmployeeModal';
import ValidationWarningModal from './modals/ValidationWarningModal';
import ImageCropper from '../ImageCropper';
import ImageEditorModal from '../ImageEditorModal';
import { Loader2 } from 'lucide-react';
import { Employee, UserRole } from '../../types';

interface EmployeeModalsProps {
   selectedEmployee: Employee | null;
   setSelectedEmployee: (emp: Employee | null) => void;
   idCardEmployee: Employee | null;
   setIdCardEmployee: (emp: Employee | null) => void;
   isAddModalOpen: boolean;
   sites: any[];
   employees: Employee[];
   wizardProps: any;
   terminateProps: any;
   deleteProps: any;
   approveProps: any;
   validationProps: any;
   cropperProps: any;
   isProcessingImage: boolean;
   processingStatus: string;
   user?: any;
   isOnboardingEditorOpen: boolean;
   setIsOnboardingEditorOpen: (open: boolean) => void;
   pendingOnboardingImageSrc: string | null;
   setPendingOnboardingImageSrc: (src: string | null) => void;
   handleSaveOnboardingPhoto: (croppedImage: string) => void;
}

export default function EmployeeModals({
   selectedEmployee, setSelectedEmployee,
   idCardEmployee, setIdCardEmployee,
   isAddModalOpen, sites, employees, wizardProps,
   terminateProps, deleteProps,
   approveProps, validationProps,
   cropperProps, isProcessingImage, processingStatus,
   user,
   isOnboardingEditorOpen,
   setIsOnboardingEditorOpen,
   pendingOnboardingImageSrc,
   setPendingOnboardingImageSrc,
   handleSaveOnboardingPhoto
}: EmployeeModalsProps) {
   return (
      <>
         {/* Image Editor for Onboarding */}
         {isOnboardingEditorOpen && pendingOnboardingImageSrc && (
            <ImageEditorModal
               isOpen={isOnboardingEditorOpen}
               imageSrc={pendingOnboardingImageSrc}
               onClose={() => {
                  setIsOnboardingEditorOpen(false);
                  setPendingOnboardingImageSrc(null);
               }}
               onSave={handleSaveOnboardingPhoto}
            />
         )}

         {/* Image Processing Overlay */}
         {isProcessingImage && (
            <div className="fixed inset-0 bg-[var(--theme-overlay)] z-[10001] flex items-center justify-center p-4">
               <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-2xl p-8 max-w-sm text-center shadow-[var(--shadow-modal)]">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--theme-accent)] border-t-transparent mx-auto mb-4"></div>
                  <p className="text-[var(--theme-text-primary)] font-bold mb-2">Processing Image</p>
                  <p className="text-[var(--theme-text-secondary)] text-sm">{processingStatus || 'Please wait...'}</p>
               </div>
            </div>
         )}

         {/* Image Cropper */}
         <ImageCropper {...cropperProps} />

         {/* Onboarding Wizard */}
         <AddEmployeeWizard isOpen={isAddModalOpen} {...wizardProps} user={user} sites={sites} />

         {/* Staff Profile Modal */}
         <Modal
            isOpen={!!selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            title={selectedEmployee ? `${selectedEmployee.name} · Staff Profile` : 'Staff Profile'}
            size="3xl"
            mobileFullScreen={true}
         >
            {selectedEmployee && (
               <StaffProfileView
                  employee={selectedEmployee}
                  onClose={() => setSelectedEmployee(null)}
                  onApprove={approveProps?.onOpen ? () => approveProps.onOpen(selectedEmployee) : undefined}
                  {...terminateProps}
               />
            )}
         </Modal>

         {/* ID Card Generator */}
         {idCardEmployee && (
            <EmployeeIDCard employee={idCardEmployee} onClose={() => setIdCardEmployee(null)} />
         )}

         {/* Termination Confirmation */}
         <TerminateEmployeeModal {...terminateProps} employee={selectedEmployee} />

         {/* Permanent Deletion (CEO Only) */}
         <DeleteEmployeeModal {...deleteProps} />

         {/* Approval Modal */}
         <ApproveEmployeeModal {...approveProps} sites={sites} />

         {/* Role-Site Validation Warning */}
         <ValidationWarningModal {...validationProps} />
      </>
   );
}
