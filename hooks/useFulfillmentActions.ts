import { useState } from 'react';
import { WMSJob, User, Product } from '../types';
import { useJobAssignment } from './useJobAssignment';
import { useTransferLogic } from './useTransferLogic';
import { useJobExecution } from './useJobExecution';

interface UseFulfillmentActionsProps {
    user: User | null;
    filteredProducts: Product[];
    assignJob: (jobId: string, userId: string) => Promise<void>;
    updateJobStatus: (jobId: string, status: any) => Promise<void>;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    setIsScannerMode: (isScanner: boolean) => void;
    logSystemEvent: (action: string, details: string, user: string, category: string) => void;
    t: (key: string) => string;
}

export const useFulfillmentActions = ({
    user,
    filteredProducts,
    assignJob,
    updateJobStatus,
    addNotification,
    setSelectedJob,
    setIsDetailsOpen,
    setIsScannerMode,
    logSystemEvent,
    t
}: UseFulfillmentActionsProps) => {

    const { checkAndAssignJob } = useJobAssignment({ user, assignJob, addNotification, t });
    const { validateTransferStart } = useTransferLogic({ addNotification });
    const { startJobExecution, isStarting } = useJobExecution({
        user,
        filteredProducts,
        updateJobStatus,
        addNotification,
        setSelectedJob,
        setIsDetailsOpen,
        setIsScannerMode,
        logSystemEvent,
        t
    });

    const handleStartJob = async (job: WMSJob) => {
        // 1. Validate Transfer
        if (!validateTransferStart(job)) return;

        // 2. Auto-Assign
        await checkAndAssignJob(job);

        // 3. Execute
        await startJobExecution(job);
    };

    return {
        isSubmitting: isStarting,
        setIsSubmitting: () => { }, // No-op, managed internally now or strictly read-only? 
        // Keeping legacy setter for compatibility if needed, but 'isStarting' drives the loading state.
        handleStartJob
    };
};
