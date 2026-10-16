import React from 'react';
import SalaryApprovalQueueModal from './SalaryApprovalQueueModal';
import { EmployeeChangeApprovalModal } from './modals/EmployeeChangeApprovalModal';
import { HeadcountQuotaApprovalModal } from './modals/HeadcountQuotaApprovalModal';

interface EmployeeGovernanceModalsProps {
  isSalaryQueueOpen: boolean;
  onCloseSalaryQueue: () => void;
  onRefreshSalaryQueue: () => void;
  isChangeModalOpen: boolean;
  onCloseChangeModal: () => void;
  onRefreshChangeModal: () => void;
  isQuotaModalOpen: boolean;
  onCloseQuotaModal: () => void;
  onRefreshQuotaModal: () => void;
}

export const EmployeeGovernanceModals: React.FC<EmployeeGovernanceModalsProps> = ({
  isSalaryQueueOpen,
  onCloseSalaryQueue,
  onRefreshSalaryQueue,
  isChangeModalOpen,
  onCloseChangeModal,
  onRefreshChangeModal,
  isQuotaModalOpen,
  onCloseQuotaModal,
  onRefreshQuotaModal
}) => {
  return (
    <>
      {isSalaryQueueOpen && (
        <SalaryApprovalQueueModal
          isOpen={isSalaryQueueOpen}
          onClose={onCloseSalaryQueue}
          onRequestsUpdated={onRefreshSalaryQueue}
        />
      )}

      {isChangeModalOpen && (
        <EmployeeChangeApprovalModal
          isOpen={isChangeModalOpen}
          onClose={onCloseChangeModal}
          onRequestsUpdated={onRefreshChangeModal}
        />
      )}

      {isQuotaModalOpen && (
        <HeadcountQuotaApprovalModal
          isOpen={isQuotaModalOpen}
          onClose={onCloseQuotaModal}
          onRequestsUpdated={onRefreshQuotaModal}
        />
      )}
    </>
  );
};
