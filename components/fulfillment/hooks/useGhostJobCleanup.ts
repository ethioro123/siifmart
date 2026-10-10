import { useEffect, useRef } from 'react';
import type { WMSJob, PurchaseOrder } from '../../../types';
import { wmsJobsService } from '../../../services/wms-jobs.service';
import { logger } from '../../../utils/logger';

interface UseGhostJobCleanupParams {
    jobs: WMSJob[];
    orders: PurchaseOrder[];
    user: any;
    setJobs: React.Dispatch<React.SetStateAction<WMSJob[]>>;
}

/**
 * Auto-cleanup hook for ghost WMS jobs.
 * Cleans up orphaned RECEIVE jobs where the PO was finalized,
 * but the RECEIVE WMS job was stuck in Pending/In-Progress due to UI disconnects.
 */
export const useGhostJobCleanup = ({
    jobs,
    orders,
    user,
    setJobs
}: UseGhostJobCleanupParams) => {
    const hasRunGhostCleanup = useRef(false);

    useEffect(() => {
        if (!hasRunGhostCleanup.current && jobs.length > 0 && orders.length > 0) {
            hasRunGhostCleanup.current = true;
            let cleanupCount = 0;

            const ghostReceiveJobs = jobs.filter(j =>
                j.type === 'RECEIVE' &&
                ['Pending', 'In-Progress'].includes(j.status || '')
            );

            for (const job of ghostReceiveJobs) {
                const po = orders.find(o => o.id === job.orderRef);
                // If PO is missing or status is no longer 'Approved', map it as ghost job
                if (!po || po.status !== 'Approved') {
                    logger.debug('useGhostJobCleanup', `🧹 [Auto-Cleanup] Completing orphaned ghost job: ${job.jobNumber} (${job.id})`);
                    cleanupCount++;

                    wmsJobsService.update(job.id, {
                        status: 'Completed',
                        completed_at: new Date().toISOString(),
                        completed_by: user?.id || 'System Auto-Cleanup'
                    } as any).catch(e => logger.error('useGhostJobCleanup', 'Failed to auto-cleanup ghost job:', e as Error));

                    setJobs(prev => prev.map(j => j.id === job.id ? {
                        ...j,
                        status: 'Completed',
                        completedAt: new Date().toISOString(),
                        completedBy: user?.id || 'System Auto-Cleanup'
                    } as WMSJob : j));
                }
            }
            if (cleanupCount > 0) {
                logger.debug('useGhostJobCleanup', `✅ [Auto-Cleanup] Successfully cleared ${cleanupCount} ghost jobs.`);
            }
        }
    }, [jobs, orders, user, setJobs]);
};
