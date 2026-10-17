import { useCallback } from 'react';
import { WMSJob } from '../types';

interface UseTransferLogicProps {
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
}

export const useTransferLogic = ({
    addNotification
}: UseTransferLogicProps) => {

    const validateTransferStart = useCallback((job: WMSJob) => {
        // APPROVAL CHECK: A transfer job CANNOT start work unless it has been explicitly Approved
        if (job.type === 'TRANSFER') {
            const currentStatus = job.transferStatus || (job as any).status;
            const isApprovedOrActive = ['Approved', 'Picking', 'Picked', 'Packed', 'Shipped', 'In-Transit'].includes(currentStatus || '');
            if (!isApprovedOrActive) {
                addNotification('alert', 'This transfer must be approved by a manager before work can begin.');
                return false;
            }
        }
        return true;
    }, [addNotification]);

    return { validateTransferStart };
};
