import { useCallback } from 'react';
import { User, WMSJob } from '../types';

interface UseJobAssignmentProps {
    user: User | null;
    assignJob: (jobId: string, userId: string) => Promise<void>;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    t: (key: string) => string;
}

export const useJobAssignment = ({
    user,
    assignJob,
    addNotification,
    t
}: UseJobAssignmentProps) => {

    const checkAndAssignJob = useCallback(async (job: WMSJob) => {
        // Auto-assign if not assigned
        if (!job.assignedTo && user) {
            try {
                await assignJob(job.id, user.id || user.name);
                addNotification('success', t('warehouse.jobAssignedToYou').replace('{name}', user.name));
                return true;
            } catch (e) {
                console.error('Failed to auto-assign job', e);
                return false;
            }
        }
        return false;
    }, [user, assignJob, addNotification, t]);

    return { checkAndAssignJob };
};
