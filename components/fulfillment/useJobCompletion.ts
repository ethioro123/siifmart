import { useCompletePackJob } from '../../hooks/useCompletePackJob';
import { useCallback } from 'react';
import {
    WMSJob, JobItem, TransferRecord, PurchaseOrder,
    SaleRecord, Product
} from '../../types';
import {
    wmsJobsService,
    purchaseOrdersService,
    salesService,
    jobAssignmentsService,
    systemLogsService
} from '../../services/supabase.service';
import { QueryClient } from '@tanstack/react-query';
import { logger } from '../../utils/logger';
import { calculateWarehousePoints } from '../../utils/warehouseGamification';
import { checkAndSyncPOCompletion } from './receive/utils/poCompletionHelper';
import { useCompletePickJob } from '../../hooks/useCompletePickJob';


// Helper for translations
const getTranslation = (path: string): string => {
    try {
        const { TRANSLATIONS } = require('../../utils/translations');
        const lang = localStorage.getItem('language') || 'en';
        return path.split('.').reduce((acc: any, key) => acc?.[key], TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.en) || path;
    } catch { return path; }
};

// ─── Hook Dependencies ──────────────────────────────────────────────────────

interface UseJobCompletionDeps {
    jobs: WMSJob[];
    sales: SaleRecord[];
    employees: any[];
    user: any;
    allOrders: PurchaseOrder[];
    allProducts: Product[];
    jobAssignments: any[];
    setJobs: React.Dispatch<React.SetStateAction<WMSJob[]>>;
    setTransfers: React.Dispatch<React.SetStateAction<TransferRecord[]>>;
    setOrders: (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => void;
    setAllOrders: (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => void;
    setSales: (updater: (prev: SaleRecord[]) => SaleRecord[]) => void;
    setJobAssignments: React.Dispatch<React.SetStateAction<any[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    adjustStock: (productId: string, quantity: number, type: 'IN' | 'OUT', reason: string, user: string) => void;
    queryClient: QueryClient;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useJobCompletion = (deps: UseJobCompletionDeps) => {
    const {
        jobs, sales, employees, user, allOrders, allProducts, jobAssignments,
        setJobs, setTransfers, setOrders, setAllOrders, setSales, setJobAssignments,
        addNotification, adjustStock, queryClient
    } = deps;

    const completePack = useCompletePackJob({ setJobs, queryClient, addNotification });
    const completePick = useCompletePickJob({ setJobs, queryClient, addNotification });

    const completeJob = useCallback(async (jobId: string, employeeName: string, skipValidation = false, optimisticLineItems?: any[], timestamp?: string) => {
        let pointsResult = null;
        let isPickCompletion = false;
        const stage = (name: string) => logger.debug('useJobCompletion', `[ST-PACK] 🕒 Stage: ${name} (Job: ${jobId})`);
        console.time(`completeJob-${jobId}`);

        try {
            stage('Start');
            logger.debug('useJobCompletion', `🏁 completeJob called for: ${jobId} (skipValidation: ${skipValidation})`);
            let job = jobs.find(j => j.id === jobId);
            isPickCompletion = job?.type === 'PICK';

            // Fix: For PUTAWAY, if location is missing in local state (race condition), fetch fresh from DB
            if (job && job.type === 'PUTAWAY' && !job.location) {
                try {
                    const freshJob = await wmsJobsService.getById(jobId);
                    if (freshJob) {
                        job = freshJob;
                        logger.debug('useJobCompletion', `🔄 Refreshed job ${jobId} from DB to get location: ${freshJob.location}`);
                    }
                } catch (e) {
                    logger.error('useJobCompletion', 'Failed to refresh job from DB', e);
                }
            }

            if (!job) {
                logger.error('useJobCompletion', `❌ Job ${jobId} not found in local state`, new Error(String(`❌ Job ${jobId} not found in local state`)));
                throw new Error('Job not found; refresh the job queue.');
            }

            if (job.type === 'PICK') return await completePick(job.id);
            if (job.type === 'PACK') return await completePack(job.id);

            if (job.type === 'DISPATCH' || job.type === 'DRIVER') {
                throw new Error('Release shipments from Outbound dispatch and record arrival from Driver deliveries.');
            }

            // Use Optimistic Items if provided (Fixes Race Condition where state isn't updated yet)
            let itemsToValidate = optimisticLineItems || job.lineItems;

            // Validate that all items are actually completed (Picked or Short)
            if (itemsToValidate && itemsToValidate.length > 0) {
                const allItemsProcessed = itemsToValidate.every((item: any) =>
                    item.status === 'Picked' || item.status === 'Short' || item.status === 'Discontinued' || item.status === 'Completed'
                );

                if (!allItemsProcessed) {
                    logger.warn('useJobCompletion', `⚠️ Job ${jobId} has unprocessed items, not completing yet (Checked ${itemsToValidate.length} items)`);
                    itemsToValidate.forEach((i: any) => {
                        if (i.status !== 'Picked' && i.status !== 'Short' && i.status !== 'Discontinued' && i.status !== 'Completed') {
                            logger.warn('useJobCompletion', `   ❌ Blocking Item: ${i.name} [${i.status}]`);
                        }
                    });
                    throw new Error('Verify every job line before completion.');
                }
            }

            stage('DB Update WMS Job');

            const completedByValue = user?.id || employeeName;
            logger.debug('useJobCompletion', `📝 [completeJob] completedBy will be saved as: "${completedByValue}" (user.id: ${user?.id}, user.name: ${user?.name}, fallback: ${employeeName})`);

                await wmsJobsService.update(jobId, {
                    status: 'Completed',
                    lineItems: itemsToValidate.map((i: any) => ({
                        ...i,
                        status: (i.status === 'Short' ? 'Short' : 'Completed') as JobItem['status'],

                    })),
                    completedBy: completedByValue,
                    completedAt: timestamp || new Date().toISOString()
                });
            logger.debug('useJobCompletion', `💾 Database updated for job ${jobId}`);

            // The database closes active assignments in the same transaction as the job.
            setJobAssignments(prev => prev.map(a => a.jobId === jobId && ['Assigned','Accepted','In-Progress'].includes(a.status) ? {...a,status:'Completed',completedAt:timestamp || new Date().toISOString()} : a));

            stage('Local State Update');
            const completionTime = timestamp || new Date().toISOString();
            setJobs(prev => prev.map(j => {
                if (j.id === jobId) {
                    const updatedLineItems = itemsToValidate.map((item: any) => ({
                        ...item,
                        status: (item.status === 'Short' ? 'Short' : 'Completed') as any
                    }));
                    return {
                        ...j,
                        status: 'Completed' as const,
                        lineItems: updatedLineItems,
                        completedBy: completedByValue,
                        completedAt: completionTime
                    };
                }
                return j;
            }));

            addNotification('success', getTranslation('warehouse.jobCompletedSuccess').replace('{id}', job.jobNumber || jobId));

            // ═══════════════════════════════════════════════════════════════
            // GAMIFICATION TRIGGER (Decoupled & Returned)
            // ═══════════════════════════════════════════════════════════════
            const totalCount = itemsToValidate.length;
            const shortCount = itemsToValidate.filter((i: any) => i.status === 'Short').length;
            const jobAccuracy = totalCount > 0 ? Math.round(((totalCount - shortCount) / totalCount) * 100) : 100;

            const calculatedPoints = calculateWarehousePoints(
                { ...job, items: totalCount, lineItems: itemsToValidate },
                undefined,
                jobAccuracy
            );
            pointsResult = calculatedPoints;

            const eventPayload = {
                job: { ...job, status: 'Completed', completedBy: completedByValue, completedAt: completionTime },
                userId: user?.id,
                employeeId: user?.employeeId || (employees.find((e: any) => e.id === user?.id || e.name === user?.name || e.name === employeeName)?.id),
                employeeName: employeeName || user?.name,
                pointsResult,
                accuracy: jobAccuracy
            };

            logger.debug('useJobCompletion', '📣 Dispatching fulfillment:job-completed event', eventPayload);
            window.dispatchEvent(new CustomEvent('fulfillment:job-completed', { detail: eventPayload }));

            // PUTAWAY LOGIC
            if (job.type === 'PUTAWAY') {
                logger.debug('useJobCompletion', `📦 DEBUG: Putaway Logic Triggered for Job ${job.id}`);
                logger.debug('useJobCompletion', `   - Location: ${job.location || 'MISSING'}`);
                logger.debug('useJobCompletion', `   - Items: ${job.lineItems?.length || 0}`);

                if (job.location) {
                    logger.debug('useJobCompletion', 'ℹ️ Bulk Putaway Update skipped in favor of granular item scanning/relocation.');
                } else {
                    logger.debug('useJobCompletion', 'Job has no target location. Relying on individual item scans.');
                }

                // CHECK IF ALL PUTAWAY JOBS FOR THIS PO ARE COMPLETE
                stage('Check PO Completion');
                if (job.orderRef) {
                    await checkAndSyncPOCompletion({
                        job,
                        jobs,
                        allOrders,
                        setOrders,
                        setAllOrders,
                        addNotification,
                        getTranslation
                    });
                    queryClient.invalidateQueries({ queryKey: ['orders', job.siteId] });
                    queryClient.invalidateQueries({ queryKey: ['purchase_orders', job.countryCode || job.country_code] });
                }
            }

            // --- JOB CHAINING LOGIC ---
            stage('Job Chaining');


            stage('Final Logs');
            try {
                await systemLogsService.create({
                    action: `${job.type}_JOB_COMPLETED`,
                    module: 'Fulfillment',
                    user_name: user?.name || employeeName || 'System',
                    employee_id: user?.id,
                    site_id: job.siteId || (job as any).site_id,
                    country_code: job.countryCode || (job as any).country_code || 'ET',
                    entity_type: 'wms_job',
                    entity_id: jobId,
                    details: {
                        jobType: job.type,
                        jobNumber: job.jobNumber,
                        itemsCount: job.items,
                        completedBy: completedByValue,
                        hasDiscrepancy: job.hasDiscrepancy || false,
                        orderRef: job.orderRef,
                    },
                });
            } catch (auditErr) {
                logger.warn('useJobCompletion', 'Non-blocking audit log failure:', { error: auditErr instanceof Error ? auditErr.message : String(auditErr) });
            }

            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            console.timeEnd(`completeJob-${jobId}`);
            return pointsResult;
        } catch (error) {
            logger.error('useJobCompletion', `❌ completeJob failed for ${jobId}:`, error);
            console.timeEnd(`completeJob-${jobId}`);
            addNotification('alert', isPickCompletion
                ? (error instanceof Error ? error.message : 'Picking completion was not confirmed. Refresh the job before retrying.')
                : getTranslation('warehouse.jobCompleteFailed'));
            throw error;
        }
    }, [jobs, sales, employees, user, allOrders, allProducts, setJobs, setTransfers, setOrders, setAllOrders, setSales, addNotification, adjustStock, queryClient, completePick, completePack]);

    return { completeJob };
};
