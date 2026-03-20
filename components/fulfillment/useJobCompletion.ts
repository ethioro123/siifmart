import { useCallback } from 'react';
import {
    WMSJob, JobItem, TransferRecord, PurchaseOrder,
    SaleRecord, Product
} from '../../types';
import {
    wmsJobsService,
    purchaseOrdersService,
    salesService
} from '../../services/supabase.service';
import { QueryClient } from '@tanstack/react-query';

// Helper for translations
const getTranslation = (path: string): string => {
    try {
        const { TRANSLATIONS } = require('../../utils/translations');
        const lang = localStorage.getItem('language') || 'en';
        const keys = path.split('.');
        let result: any = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
        for (const key of keys) {
            result = result?.[key];
        }
        return typeof result === 'string' ? result : path;
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
    setJobs: React.Dispatch<React.SetStateAction<WMSJob[]>>;
    setTransfers: React.Dispatch<React.SetStateAction<TransferRecord[]>>;
    setOrders: (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => void;
    setAllOrders: (updater: (prev: PurchaseOrder[]) => PurchaseOrder[]) => void;
    setSales: (updater: (prev: SaleRecord[]) => SaleRecord[]) => void;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    adjustStock: (productId: string, quantity: number, type: 'IN' | 'OUT', reason: string, user: string) => void;
    queryClient: QueryClient;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useJobCompletion = (deps: UseJobCompletionDeps) => {
    const {
        jobs, sales, employees, user, allOrders, allProducts,
        setJobs, setTransfers, setOrders, setAllOrders, setSales,
        addNotification, adjustStock, queryClient
    } = deps;

    const completeJob = useCallback(async (jobId: string, employeeName: string, skipValidation = false, optimisticLineItems?: any[], timestamp?: string) => {
        let pointsResult = null;
        const stage = (name: string) => console.log(`[ST-PACK] 🕒 Stage: ${name} (Job: ${jobId})`);
        console.time(`completeJob-${jobId}`);

        try {
            stage('Start');
            console.log(`🏁 completeJob called for: ${jobId} (skipValidation: ${skipValidation})`);
            let job = jobs.find(j => j.id === jobId);

            // Fix: For PUTAWAY, if location is missing in local state (race condition), fetch fresh from DB
            if (job && job.type === 'PUTAWAY' && !job.location) {
                try {
                    const freshJob = await wmsJobsService.getById(jobId);
                    if (freshJob) {
                        job = freshJob;
                        console.log(`🔄 Refreshed job ${jobId} from DB to get location: ${freshJob.location}`);
                    }
                } catch (e) {
                    console.error('Failed to refresh job from DB', e);
                }
            }

            if (!job) {
                console.error(`❌ Job ${jobId} not found in local state`);
                return;
            }

            // Use Optimistic Items if provided (Fixes Race Condition where state isn't updated yet)
            let itemsToValidate = optimisticLineItems || job.lineItems;

            // Validate that all items are actually completed (Picked or Short)
            if (!skipValidation && itemsToValidate && itemsToValidate.length > 0) {
                const allItemsProcessed = itemsToValidate.every((item: any) =>
                    item.status === 'Picked' || item.status === 'Short' || item.status === 'Discontinued' || item.status === 'Completed'
                );

                if (!allItemsProcessed) {
                    console.warn(`⚠️ Job ${jobId} has unprocessed items, not completing yet (Checked ${itemsToValidate.length} items)`);
                    itemsToValidate.forEach((i: any) => {
                        if (i.status !== 'Picked' && i.status !== 'Short' && i.status !== 'Discontinued' && i.status !== 'Completed') {
                            console.warn(`   ❌ Blocking Item: ${i.name} [${i.status}]`);
                        }
                    });
                    return;
                }
            }

            stage('DB Update WMS Job');

            const completedByValue = user?.id || employeeName;
            console.log(`📝 [completeJob] completedBy will be saved as: "${completedByValue}" (user.id: ${user?.id}, user.name: ${user?.name}, fallback: ${employeeName})`);

            // CRITICAL FIX: When skipValidation=true (Force Complete), update lineItems to 'Picked' in DB
            if (skipValidation && itemsToValidate && itemsToValidate.length > 0) {
                const forcedLineItems = itemsToValidate.map((item: any) => ({
                    ...item,
                    status: (item.status === 'Short' ? 'Short' : 'Picked') as JobItem['status'],
                    pickedQty: item.pickedQty !== undefined && item.pickedQty !== null ? item.pickedQty : (item.expectedQty || 0)
                }));
                console.log(`🔧 Force Complete: Updating ${forcedLineItems.length} lineItems to 'Picked' status in DB`);
                await wmsJobsService.update(jobId, {
                    status: 'Completed',
                    lineItems: forcedLineItems,
                    completedBy: completedByValue,
                    completedAt: timestamp || new Date().toISOString()
                });

                itemsToValidate = forcedLineItems;
            } else {
                await wmsJobsService.update(jobId, {
                    status: 'Completed',
                    lineItems: itemsToValidate.map((i: any) => ({
                        ...i,
                        status: (i.status === 'Short' ? 'Short' : 'Completed') as JobItem['status']
                    })),
                    completedBy: completedByValue,
                    completedAt: timestamp || new Date().toISOString()
                });
            }
            console.log(`💾 Database updated for job ${jobId}`);

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
            // GAMIFICATION TRIGGER (Decoupled)
            // ═══════════════════════════════════════════════════════════════
            const eventPayload = {
                job: { ...job, status: 'Completed', completedBy: completedByValue, completedAt: completionTime },
                userId: user?.id,
                employeeId: user?.employeeId || (employees.find((e: any) => e.id === user?.id || e.name === user?.name || e.name === employeeName)?.id)
            };

            console.log('📣 Dispatching fulfillment:job-completed event', eventPayload);
            window.dispatchEvent(new CustomEvent('fulfillment:job-completed', { detail: eventPayload }));

            // PUTAWAY LOGIC
            if (job.type === 'PUTAWAY') {
                console.log(`📦 DEBUG: Putaway Logic Triggered for Job ${job.id}`);
                console.log(`   - Location: ${job.location || 'MISSING'}`);
                console.log(`   - Items: ${job.lineItems?.length || 0}`);

                if (job.location) {
                    console.log('ℹ️ Bulk Putaway Update skipped in favor of granular item scanning/relocation.');
                } else {
                    console.log('ℹ️ Job has no target location. Relying on individual item scans.');
                }

                // CHECK IF ALL PUTAWAY JOBS FOR THIS PO ARE COMPLETE
                stage('Check PO Completion');
                if (job.orderRef) {
                    const allPutawayJobsForPO = jobs
                        .filter(j => j.orderRef === job!.orderRef && j.type === 'PUTAWAY')
                        .map(j => j.id === jobId ? { ...j, status: 'Completed' as const } : j);

                    const allPutawayJobsComplete = allPutawayJobsForPO.length > 0 &&
                        allPutawayJobsForPO.every(j => j.status === 'Completed');

                    if (allPutawayJobsComplete) {
                        console.log(`✅ All PUTAWAY jobs for PO ${job.orderRef} are complete. Updating PO status to 'Received'...`);

                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.orderRef || '');

                        if (isUUID) {
                            try {
                                const updatedPo = await purchaseOrdersService.receive(job.orderRef, false);
                                if (updatedPo) {
                                    setOrders(prev => prev.map(o => o.id === job!.orderRef ? updatedPo : o));
                                    setAllOrders(prev => prev.map(o => o.id === job!.orderRef ? updatedPo : o));
                                    addNotification('success', getTranslation('warehouse.poFullyReceived').replace('{id}', updatedPo.poNumber || job!.orderRef || ''));
                                }
                            } catch (err) {
                                console.error(`❌ Failed to update PO status for ${job.orderRef}:`, err);
                            }
                        } else {
                            console.log(`ℹ️ PO Ref ${job.orderRef} is not a UUID. Attempting lookup by PO Number...`);
                            const poByNumber = allOrders.find(o => o.poNumber === job!.orderRef || o.po_number === job!.orderRef);

                            if (poByNumber && poByNumber.id) {
                                try {
                                    console.log(`✅ Found PO UUID ${poByNumber.id} for ref ${job.orderRef}. Updating status...`);
                                    const updatedPo = await purchaseOrdersService.receive(poByNumber.id, false);
                                    if (updatedPo) {
                                        setOrders(prev => prev.map(o => o.id === poByNumber.id ? updatedPo : o));
                                        setAllOrders(prev => prev.map(o => o.id === poByNumber.id ? updatedPo : o));
                                        addNotification('success', `PO ${updatedPo.poNumber} fully received!`);
                                    }
                                } catch (err) {
                                    console.error(`❌ Failed to update PO status by number ${job.orderRef}:`, err);
                                }
                            } else {
                                console.warn(`⚠️ PO ID ${job.orderRef} is not a valid UUID and not found in local orders. Skipping backend update.`);
                                setOrders(prev => prev.map(o => o.id === job!.orderRef ? { ...o, status: 'Received' } : o));
                                setAllOrders(prev => prev.map(o => o.id === job!.orderRef ? { ...o, status: 'Received' } : o));
                                addNotification('success', getTranslation('warehouse.poReceivedLocalOnly').replace('{id}', job.orderRef || ''));
                            }
                        }
                    }
                }
            }

            // --- JOB CHAINING LOGIC ---
            stage('Job Chaining');
            if (job && job.type === 'PICK' && job.orderRef) {
                stage('Chaining: PICK -> PACK');
                const packItems = itemsToValidate
                    .filter((item: any) => (item.pickedQty || 0) > 0)
                    .map((item: any) => ({
                        ...item,
                        orderedQty: item.orderedQty || item.expectedQty,
                        expectedQty: item.pickedQty,
                        pickedQty: 0,
                        status: 'Pending' as JobItem['status']
                    }));

                if (packItems.length > 0) {
                    const existingPackJob = jobs.find(j => j.orderRef === job!.orderRef && j.type === 'PACK' && j.status !== 'Cancelled');
                    if (existingPackJob) {
                        console.warn(`⚠️ PACK job already exists for ${job.orderRef}. Skipping creation.`);
                    } else {
                        const packJob = await wmsJobsService.create({
                            siteId: job.siteId,
                            site_id: job.site_id,
                            type: 'PACK',
                            priority: job.priority,
                            status: 'Pending',
                            items: packItems.length,
                            lineItems: packItems,
                            location: 'Packing Station 1',
                            orderRef: job.orderRef,
                            sourceSiteId: job.sourceSiteId,
                            destSiteId: job.destSiteId,
                            jobNumber: job.jobNumber,
                            notes: job.notes?.includes('[STRICT_SCAN]') ? '[STRICT_SCAN]' : undefined
                        });
                        setJobs(prev => prev.find(j => j.id === packJob.id) ? prev : [packJob, ...prev]);
                    }
                } else {
                    console.warn(`⚠️ Skipped creation of PACK job for ${job.orderRef} because no items were picked.`);
                }

                const sale = sales.find(s => s.id === job!.orderRef);
                const transfer = jobs.find(j => (j.id === job!.orderRef || j.jobNumber === job!.orderRef) && j.type === 'TRANSFER');
                const isTransfer = !!transfer || (job.orderRef && (job.orderRef.startsWith('TRF-')));

                if (sale) {
                    await salesService.update(sale.id, { fulfillmentStatus: 'Packing' });
                    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Packing' } : s));
                } else if (isTransfer) {
                    const tId = transfer?.id || job.orderRef;
                    setJobs(prev => prev.map(j => j.id === tId ? { ...j, transferStatus: 'Picked' } : j));
                    setTransfers((prev: any[]) => prev.map(t => t.id === tId ? { ...t, transferStatus: 'Picked' } : t));
                    await wmsJobsService.update(tId, { transferStatus: 'Picked' });
                }

                // --- INVENTORY DEDUCTION (Internal & Sales) ---
                if (itemsToValidate && itemsToValidate.length > 0) {
                    for (const item of itemsToValidate) {
                        if ((item.pickedQty || 0) > 0) {
                            const productId = item.productId || item.id;
                            if (productId) {
                                let deductUnits = item.pickedQty;

                                // EXACT MEASURE DEDUCTION OVERRIDE
                                if ((item as any).requestedMeasureQty) {
                                    const product = allProducts.find((p: Product) => p.id === productId);
                                    if (product && product.size) {
                                        const sizeNumeric = Number(product.size);
                                        if (sizeNumeric > 0) {
                                            const expected = item.expectedQty || 1;
                                            const picked = item.pickedQty || 0;
                                            const fillRatio = expected > 0 ? (picked / expected) : 1;
                                            const actualMeasurePicked = (item as any).requestedMeasureQty * fillRatio;
                                            deductUnits = actualMeasurePicked / sizeNumeric;
                                        }
                                    }
                                }

                                await adjustStock(
                                    productId,
                                    deductUnits,
                                    'OUT',
                                    `Pick Job ${job.jobNumber || job.id} completed`,
                                    user?.name || 'System'
                                );
                            }
                        }
                    }
                }
            } else if (job && job.type === 'PACK' && job.orderRef) {
                stage('Chaining: PACK -> DISPATCH');
                const sale = sales.find(s => s.id === job!.orderRef);
                const transfer = jobs.find(j => (j.id === job!.orderRef || j.jobNumber === job!.orderRef) && j.type === 'TRANSFER');
                const isTransfer = !!transfer || (job.orderRef && (job.orderRef.startsWith('TRF-')));
                const tId = transfer?.id || job.orderRef;

                const dispatchItems = itemsToValidate
                    .filter((item: any) => (item.pickedQty || 0) > 0)
                    .map((item: any) => ({
                        ...item,
                        expectedQty: item.pickedQty,
                        pickedQty: 0,
                        status: 'Pending' as JobItem['status']
                    }));

                if (dispatchItems.length > 0) {
                    const existingDispatchJob = jobs.find(j => j.orderRef === job!.orderRef && j.type === 'DISPATCH' && j.status !== 'Cancelled');

                    if (existingDispatchJob) {
                        console.warn(`⚠️ DISPATCH job already exists for ${job.orderRef}. Skipping creation.`);
                    } else {
                        const dispatchJob = await wmsJobsService.create({
                            siteId: job.siteId,
                            site_id: job.site_id,
                            type: 'DISPATCH',
                            priority: job.priority,
                            status: 'Pending',
                            items: dispatchItems.length,
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
                    console.warn(`⚠️ Skipped creation of DISPATCH job for ${job.orderRef} because no items were packed.`);
                }

                if (sale) {
                    await salesService.update(sale.id, { fulfillmentStatus: 'Shipped' });
                    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Shipped' } : s));
                } else if (isTransfer) {
                    await wmsJobsService.update(tId, { transferStatus: 'Packed' });
                    setJobs(prev => prev.map(j => j.id === tId ? { ...j, transferStatus: 'Packed' } : j));
                    setTransfers((prev: any[]) => prev.map(t => t.id === tId ? { ...t, transferStatus: 'Packed' } : t));
                }
            } else if (job && job.type === 'DISPATCH') {
                stage('Dispatch Completion');
                const sale = sales.find(s => s.id === job.orderRef);
                const transfer = jobs.find(j => (j.id === job!.orderRef || j.jobNumber === job!.orderRef) && j.type === 'TRANSFER');
                const isTransfer = !!transfer || (job.orderRef && (job.orderRef.startsWith('TRF-')));
                const tId = transfer?.id || job.orderRef;

                if (sale) {
                    await salesService.update(sale.id, { fulfillmentStatus: 'Delivered' });
                    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Delivered' } : s));
                } else if (isTransfer) {
                    await wmsJobsService.update(tId, { transferStatus: 'Shipped' });
                    setJobs(prev => prev.map(j => j.id === tId ? { ...j, transferStatus: 'Shipped' } : j));
                    setTransfers((prev: any[]) => prev.map(t => t.id === tId ? { ...t, transferStatus: 'Shipped' } : t));
                }
            }

            stage('Final Logs');
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            console.timeEnd(`completeJob-${jobId}`);
            return pointsResult;
        } catch (error) {
            console.error(`❌ completeJob failed for ${jobId}:`, error);
            console.timeEnd(`completeJob-${jobId}`);
            addNotification('alert', getTranslation('warehouse.jobCompleteFailed'));
            throw error;
        }
    }, [jobs, sales, employees, user, allOrders, allProducts, setJobs, setTransfers, setOrders, setAllOrders, setSales, addNotification, adjustStock, queryClient]);

    return { completeJob };
};
