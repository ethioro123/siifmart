import { useCallback } from 'react';
import { WMSJob } from '../types';

interface UseTransferLogicProps {
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
}

export const useTransferLogic = ({
    addNotification
}: UseTransferLogicProps) => {

    const validateTransferStart = useCallback((job: WMSJob) => {
        // APPROVAL CHECK: Block unapproved transfer jobs
        if (job.type === 'TRANSFER' && job.transferStatus && job.transferStatus !== 'Approved') {
            addNotification('alert', 'This transfer must be approved by a manager before work can begin.');
            return false;
        }
        return true;
    }, [addNotification]);

    return { validateTransferStart };
};
