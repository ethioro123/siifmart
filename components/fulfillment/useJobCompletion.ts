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

            if (job.type === 'DISPATCH' || job.type === 'DRIVER') {
                throw new Error('Release shipments from Outbound dispatch and record arrival from Driver deliveries.');
            }

            // Use Optimistic Items if provided (Fixes Race Condition where state isn't updated yet)
            let itemsToValidate = optimisticLineItems || job.lineItems;

            // Validate that all items are actually completed (Picked or Short)
            if (!skipValidation && itemsToValidate && itemsToValidate.length > 0) {
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

            // CRITICAL FIX: When skipValidation=true (Force Complete), update lineItems to 'Picked' in DB
            if (skipValidation && itemsToValidate && itemsToValidate.length > 0) {
                const forcedLineItems = itemsToValidate.map((item: any) => ({
                    ...item,
                    status: (item.status === 'Short' ? 'Short' : 'Picked') as JobItem['status'],
                    pickedQty: item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : (item.expectedQty || 0)
                }));
                logger.debug('useJobCompletion', `🔧 Force Complete: Updating ${forcedLineItems.length} lineItems to 'Picked' status in DB`);
                await wmsJobsService.update(jobId, {
                    status: 'Completed',
                    lineItems: forcedLineItems,
                    completedBy: completedByValue,
                    completedAt: timestamp || new Date().toISOString()
                });

                itemsToValidate = forcedLineItems;
            } else {
                const isPack = job.type === 'PACK';
                await wmsJobsService.update(jobId, {
                    status: 'Completed',
                    lineItems: itemsToValidate.map((i: any) => ({
                        ...i,
                        status: (i.status === 'Short' ? 'Short' : 'Completed') as JobItem['status'],
                        ...(isPack ? {
                            packed: i.packed !== undefined ? i.packed : true,
                            packedQty: i.packedQty ?? (i.expectedQty || 0),
                            pickedQty: i.pickedQty || i.packedQty || i.expectedQty || 0
                        } : {})
                    })),
                    completedBy: completedByValue,
                    completedAt: timestamp || new Date().toISOString()
                });
            }
            logger.debug('useJobCompletion', `💾 Database updated for job ${jobId}`);

            // CLEANUP: Update assignment record to 'Completed' so it drops from active workload matrix
            try {
                const completedByEmployee = employees.find(e => 
                    e.name === completedByValue || e.email === completedByValue
                );
                const employeeIdToMatch = completedByEmployee?.id || user?.id; // Try to resolve current worker
                const assignment = jobAssignments.find(a => 
                    a.jobId === jobId && ['Assigned', 'Accepted', 'In-Progress'].includes(a.status) &&
                    (a.employeeId === employeeIdToMatch || !employeeIdToMatch) // best effort match if possible, otherwise any active
                );

                if (assignment) {
                    await jobAssignmentsService.update(assignment.id, { 
                        status: 'Completed',
                        completedAt: timestamp || new Date().toISOString()
                    });
                    
                    setJobAssignments(prev => prev.map(a => 
                        a.id === assignment.id ? { 
                            ...a, 
                            status: 'Completed',
                            completedAt: timestamp || new Date().toISOString()
                        } : a
                    ));
                    logger.debug('useJobCompletion', `✅ Job assignment ${assignment.id} marked Completed`);
                }
            } catch (assignError) {
                logger.error('useJobCompletion', `⚠️ Failed to complete job assignment for job ${jobId}:`, assignError);
            }

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
            if (job && job.type === 'PACK' && job.orderRef) {
                stage('Chaining: PACK -> DISPATCH');
                const sale = sales.find(s => s.id === job!.orderRef);
                const transfer = jobs.find(j => (j.id === job!.orderRef || j.jobNumber === job!.orderRef) && j.type === 'TRANSFER');
                const isTransfer = !!transfer || (job.orderRef && (job.orderRef.startsWith('TRF-')));
                const tId = transfer?.id || job.orderRef;

                const dispatchItems = itemsToValidate
                    .filter((item: any) => (item.packedQty || item.pickedQty || 0) > 0)
                    .map((item: any) => ({
                        ...item,
                        expectedQty: item.packedQty || item.pickedQty,
                        pickedQty: 0,
                        packedQty: 0,
                        packed: false,
                        status: 'Pending' as JobItem['status']
                    }));

                if (dispatchItems.length > 0) {
                    const existingDispatchJob = jobs.find(j => j.orderRef === job!.orderRef && j.type === 'DISPATCH' && j.status !== 'Cancelled');

                    if (existingDispatchJob) {
                        logger.warn('useJobCompletion', `⚠️ DISPATCH job already exists for ${job.orderRef}. Skipping creation.`);
                    } else {
                        const dispatchJob = await wmsJobsService.create({
                            siteId: job.siteId,
                            site_id: job.site_id,
                            type: 'DISPATCH',
                            priority: job.priority,
                            status: 'Pending',
                            items: Math.ceil(dispatchItems.reduce((acc: number, curr: any) => acc + (curr.expectedQty || 0), 0)) || dispatchItems.length,
                            lineItems: dispatchItems,
                            location: 'Dispatch Bay',
                            orderRef: job.orderRef,
                            sourceSiteId: job.sourceSiteId,
                            destSiteId: job.destSiteId,
                            transferStatus: 'Packed',
                            jobNumber: (job as any).jobNumber,
                            assignedBy: user?.name || 'System' // [NEW] Track creator
                        });

                        setJobs(prev => prev.find(j => j.id === dispatchJob.id) ? prev : [dispatchJob, ...prev]);
                    }
                } else {
                    logger.warn('useJobCompletion', `⚠️ Skipped creation of DISPATCH job for ${job.orderRef} because no items were packed.`);
                }

                if (sale) {
                    await salesService.update(sale.id, { fulfillmentStatus: 'Packing' });
                    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Packing' } : s));
                } else if (isTransfer) {
                    await wmsJobsService.update(tId, { transferStatus: 'Packed' });
                    setJobs(prev => prev.map(j => j.id === tId ? { ...j, transferStatus: 'Packed' } : j));
                    setTransfers((prev: any[]) => prev.map(t => t.id === tId ? { ...t, transferStatus: 'Packed' } : t));
                }
            }

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
            return job.type === 'PACK' ? { points: 0, breakdown: [], pendingConfirmation: true } : pointsResult;
        } catch (error) {
            logger.error('useJobCompletion', `❌ completeJob failed for ${jobId}:`, error);
            console.timeEnd(`completeJob-${jobId}`);
            addNotification('alert', isPickCompletion
                ? (error instanceof Error ? error.message : 'Picking completion was not confirmed. Refresh the job before retrying.')
                : getTranslation('warehouse.jobCompleteFailed'));
            throw error;
        }
    }, [jobs, sales, employees, user, allOrders, allProducts, setJobs, setTransfers, setOrders, setAllOrders, setSales, addNotification, adjustStock, queryClient, completePick]);

    return { completeJob };
};
