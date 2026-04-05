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
}

export default function EmployeeModals({
   selectedEmployee, setSelectedEmployee,
   idCardEmployee, setIdCardEmployee,
   isAddModalOpen, sites, employees, wizardProps,
   terminateProps, deleteProps,
   approveProps, validationProps,
   cropperProps, isProcessingImage, processingStatus
}: EmployeeModalsProps) {
   return (
      <>
         {/* Image Processing Overlay */}
         {isProcessingImage && (
            <div className="fixed inset-0 bg-black/80 z-[10001] flex items-center justify-center">
               <div className="bg-cyber-gray border border-white/10 rounded-2xl p-8 max-w-sm text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyber-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-white font-bold mb-2">Processing Image</p>
                  <p className="text-gray-400 text-sm">{processingStatus || 'Please wait...'}</p>
               </div>
            </div>
         )}

         {/* Image Cropper */}
         <ImageCropper {...cropperProps} />

         {/* Onboarding Wizard */}
         <AddEmployeeWizard isOpen={isAddModalOpen} {...wizardProps} />

         {/* Staff Profile Modal */}
         <Modal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title="Staff Profile" size="2xl">
            {selectedEmployee && (
               <StaffProfileView
                  employee={selectedEmployee}
                  onClose={() => setSelectedEmployee(null)}
                  {...terminateProps}
               />
            )}
         </Modal>

         {/* ID Card Generator */}
         {idCardEmployee && (
            <Modal isOpen={!!idCardEmployee} onClose={() => setIdCardEmployee(null)} title="Identity Verification Card" size="xl">
               <EmployeeIDCard employee={idCardEmployee} onClose={() => setIdCardEmployee(null)} />
            </Modal>
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
