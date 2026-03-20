import { useState, useCallback } from 'react';
import { WMSJob, Product, User } from '../types';
import { formatJobId } from '../utils/jobIdFormatter';

interface UseJobExecutionProps {
    user: User | null;
    filteredProducts: Product[];
    updateJobStatus: (jobId: string, status: any) => Promise<void>;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
    setSelectedJob: (job: WMSJob | null) => void;
    setIsDetailsOpen: (isOpen: boolean) => void;
    setIsScannerMode: (isScanner: boolean) => void;
    logSystemEvent: (action: string, details: string, user: string, category: string) => void;
    t: (key: string) => string;
}

export const useJobExecution = ({
    user,
    filteredProducts,
    updateJobStatus,
    addNotification,
    setSelectedJob,
    setIsDetailsOpen,
    setIsScannerMode,
    logSystemEvent,
    t
}: UseJobExecutionProps) => {
    const [isStarting, setIsStarting] = useState(false);

    const startJobExecution = useCallback(async (job: WMSJob) => {
        setIsStarting(true);
        try {
            // Update status to In-Progress if Pending
            if (job.status === 'Pending') {
                updateJobStatus(job.id, 'In-Progress');
            }

            // SAFETY CHECK: Ensure lineItems exists
            const jobLineItems = job.lineItems || (job as any).line_items || [];
            if (!jobLineItems || jobLineItems.length === 0) {
                addNotification('alert', t('warehouse.errorJobNoItems') || 'Job has no items. Cannot start.');
                return;
            }

            // Normalize the job
            const normalizedJob = { ...job, lineItems: jobLineItems };

            // OPTIMIZATION: Inject original index before sorting
            const indexedItems = jobLineItems.map((item: any, idx: number) => ({ ...item, originalIndex: idx }));

            // Sort items by bay location (Pick Path Optimization)
            const sortedItems = [...indexedItems].sort((a: any, b: any) => {
                const prodA = filteredProducts.find(p => p.id === a.productId);
                const prodB = filteredProducts.find(p => p.id === b.productId);
                return (prodA?.location || '').localeCompare(prodB?.location || '');
            });

            const optimizedJob = { ...normalizedJob, lineItems: sortedItems, assignedTo: job.assignedTo || user?.name };

            // Check if job is already complete
            const allItemsAlreadyProcessed = optimizedJob.lineItems.every((i: any) =>
                i.status === 'Picked' || i.status === 'Short'
            );

            if (allItemsAlreadyProcessed && job.status === 'Completed') {
                addNotification('info', 'This job is already complete');
                return;
            }

            // Activate Job in UI
            setSelectedJob(optimizedJob);
            // Let each tab manage its own modal/scanner state
            // (Removed setIsDetailsOpen and setIsScannerMode to avoid conflicts)

            logSystemEvent(
                'Job Started',
                `Started ${job.type} job ${formatJobId(job)} with ${optimizedJob.lineItems.length} items`,
                user?.name || 'Worker',
                'Inventory'
            );
        } finally {
            setIsStarting(false);
        }
    }, [user, filteredProducts, updateJobStatus, addNotification, setSelectedJob, setIsDetailsOpen, setIsScannerMode, logSystemEvent, t]);

    return { isStarting, startJobExecution };
};
