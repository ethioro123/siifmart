import { useCallback } from 'react';
import {
    WMSJob, JobItem, PurchaseOrder, Product, Site, User
} from '../../types';
import {
    wmsJobsService
} from '../../services/supabase.service';
import { supabase } from '../../lib/supabase';
import { QueryClient } from '@tanstack/react-query';
import { logger } from '../../utils/logger';

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

interface UseJobMaintenanceDeps {
    jobs: WMSJob[];
    orders: PurchaseOrder[];
    products: Product[];
    activeSite: Site | null;
    user: User | null;
    setJobs: React.Dispatch<React.SetStateAction<WMSJob[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    refreshJobs: () => void;
    queryClient: QueryClient;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useJobMaintenance = (deps: UseJobMaintenanceDeps) => {
    const { jobs, orders, products, activeSite, user, setJobs, addNotification, refreshJobs, queryClient } = deps;

    const resetJob = useCallback(async (jobId: string) => {
        try {
            logger.debug('useJobMaintenance', `🔄 Resetting job: ${jobId}`);
            const job = jobs.find(j => j.id === jobId);
            if (!job) {
                logger.error('useJobMaintenance', `❌ Job not found for reset: ${jobId}`, new Error(`Job ${jobId} not found`));
                return;
            }

            const updatedLineItems = job.lineItems?.map(item => ({
                ...item,
                status: 'Pending',
                pickedQty: 0
            })) || [];

            const dbUpdates = {
                status: 'Pending',
                assigned_to: null,
                line_items: updatedLineItems,
                items_count: job.items
            };

            logger.debug('useJobMaintenance', '💾 Sending reset updates to DB');

            const { data, error } = await supabase
                .from('wms_jobs')
                .update(dbUpdates)
                .eq('id', jobId)
                .select()
                .single();

            if (error) {
                logger.error('useJobMaintenance', '❌ DB Update failed', error as Error);
                throw error;
            }

            logger.debug('useJobMaintenance', '✅ DB Update successful');

            const updatedJobLocal = {
                ...job,
                status: 'Pending',
                assignedTo: undefined,
                lineItems: updatedLineItems
            };

            setJobs(prev => prev.map(j => j.id === jobId ? updatedJobLocal as WMSJob : j));
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            addNotification('success', getTranslation('warehouse.jobResetSuccess'));
        } catch (error) {
            logger.error('useJobMaintenance', 'Failed to reset job', error as Error);
            addNotification('alert', 'Failed to reset job: ' + (error as any).message);
        }
    }, [jobs, setJobs, addNotification, queryClient]);

    const fixBrokenJobs = useCallback(async () => {
        logger.debug('useJobMaintenance', 'Running Fix Broken Jobs...');
        let fixedPOs = 0;
        let fixedNumbers = 0;

        const receivedPOs = orders.filter(o => o.status === 'Received');

        for (const po of receivedPOs) {
            const poJobs = jobs.filter(j => j.orderRef === po.id);
            const hasValidJobs = poJobs.some(j => j.lineItems && j.lineItems.length > 0);

            if (!hasValidJobs) {
                logger.debug('useJobMaintenance', `Fixing PO ${po.id} - No valid jobs found`);

                for (const j of poJobs) {
                    await wmsJobsService.delete(j.id);
                }
                setJobs(prev => prev.filter(j => j.orderRef !== po.id));

                if (po.lineItems) {
                    const jobPromises = po.lineItems.map(async (item, index) => {
                        const product = products.find(p => p.id === item.productId);
                        const newJob: WMSJob = {
                            id: crypto.randomUUID(),
                            type: 'PUTAWAY',
                            jobNumber: po.poNumber || po.po_number || 'UNKNOWN',
                            siteId: po.siteId || activeSite?.id || 'SITE-001',
                            site_id: po.siteId || activeSite?.id,
                            status: 'Pending',
                            priority: 'Normal',
                            assignedTo: '',
                            location: 'Receiving Dock',
                            items: item.quantity,
                            orderRef: po.id,
                            lineItems: [{
                                productId: item.productId || '',
                                name: item.productName,
                                sku: product?.sku || item.productId || 'UNKNOWN',
                                image: product?.image || '',
                                expectedQty: item.quantity,
                                pickedQty: 0,
                                status: 'Pending'
                            }]
                        };
                        try {
                            const created = await wmsJobsService.create(newJob);
                            return created;
                        } catch (e) { logger.error('useJobMaintenance', 'caught error', e as Error); return newJob; }
                    });

                    const newJobs = await Promise.all(jobPromises);
                    setJobs(prev => [...prev, ...newJobs]);
                    fixedPOs++;
                }
            }
        }

        // 2. Fix Job Number Inheritance (Backfill)
        const childJobs = jobs.filter(j => ['PICK', 'PACK', 'DISPATCH'].includes(j.type));

        for (const child of childJobs) {
            if (!child.orderRef) continue;

            const parent = jobs.find(j => (j.id === child.orderRef || j.jobNumber === child.orderRef));

            if (parent && parent.jobNumber && child.jobNumber !== parent.jobNumber) {
                logger.debug('useJobMaintenance', `🔧 Syncing Job Number: ${child.type} ${child.id.slice(-4)} -> ${parent.jobNumber}`);
                try {
                    await wmsJobsService.update(child.id, { jobNumber: parent.jobNumber });
                    fixedNumbers++;
                } catch (e) {
                    logger.error('useJobMaintenance', `Failed to sync job ${child.id}`, e as Error);
                }
            }
        }

        // 3. Fix Orphaned RECEIVE Jobs
        const orphanedReceiveJobs = jobs.filter(j => 
            j.type === 'RECEIVE' && 
            ['Pending', 'In-Progress'].includes(j.status || '')
        );

        let fixedGhosts = 0;
        for (const job of orphanedReceiveJobs) {
            const po = orders.find(o => o.id === job.orderRef);
            if (!po || po.status !== 'Approved') {
                logger.debug('useJobMaintenance', `🔧 Syncing Ghost RECEIVE Job: ${job.id}`);
                try {
                    await wmsJobsService.update(job.id, { 
                        status: 'Completed',
                        completed_at: new Date().toISOString(),
                        completed_by: user?.id || 'System Manual-Fix'
                    } as any);
                    
                    setJobs(prev => prev.map(j => j.id === job.id ? { 
                        ...j, 
                        status: 'Completed', 
                        completedAt: new Date().toISOString(),
                        completedBy: user?.id || 'System Manual-Fix'
                    } as WMSJob : j));
                    
                    fixedGhosts++;
                } catch (e) {
                    logger.error('useJobMaintenance', `Failed to sync ghost job ${job.id}`, e as Error);
                }
            }
        }

        if (fixedPOs > 0 || fixedNumbers > 0 || fixedGhosts > 0) {
            addNotification('success', `Maintenance Complete: Fixed ${fixedPOs} POs, synced ${fixedNumbers} job numbers, and cleaned ${fixedGhosts} ghost jobs.`);
            refreshJobs();
        } else {
            addNotification('info', 'All jobs look healthy.');
        }
    }, [jobs, orders, products, activeSite, setJobs, addNotification, refreshJobs, user]);

    const createPutawayJob = useCallback(async (product: Product, quantity: number, user: string, source: string = 'Inventory') => {
        try {
            if (quantity <= 0) {
                logger.debug('useJobMaintenance', '📦 Skipping putaway job - no stock to put away');
                return undefined;
            }

            const targetSiteId = product.siteId || product.site_id || activeSite?.id;
            if (!targetSiteId) {
                logger.error('useJobMaintenance', '❌ Cannot create putaway job - no site ID', new Error('No site ID'));
                return undefined;
            }

            const lineItem = {
                productId: product.id,
                name: product.name,
                sku: product.sku || 'UNKNOWN',
                image: product.image || '',
                expectedQty: quantity,
                pickedQty: 0,
                status: 'Pending' as JobItem['status']
            };

            console.log('📦 Creating PUTAWAY job for Inventory product:', {
                productName: product.name,
                quantity,
                siteId: targetSiteId,
                source
            });

            try {
                const createdJob = await wmsJobsService.create({
                    siteId: targetSiteId,
                    site_id: targetSiteId,
                    type: 'PUTAWAY',
                    priority: 'Normal',
                    status: 'Pending',
                    items: quantity,
                    lineItems: [lineItem],
                    location: product.location || 'Receiving Dock',
                    orderRef: `INV-${product.id}`,
                    createdAt: new Date().toISOString(),
                    requestedBy: user
                });
                logger.debug('useJobMaintenance', `✅ Inventory PUTAWAY job created: ${createdJob.id}`);
                setJobs(prev => [createdJob, ...prev]);
                return createdJob;
            } catch (error) {
                logger.error('useJobMaintenance', '❌ Failed to create putaway job in DB', error as Error);
                const fallbackJob: WMSJob = {
                    id: crypto.randomUUID(),
                    siteId: targetSiteId,
                    site_id: targetSiteId,
                    type: 'PUTAWAY',
                    priority: 'Normal',
                    status: 'Pending',
                    items: quantity,
                    lineItems: [lineItem],
                    location: product.location || 'Receiving Dock',
                    orderRef: `INV-${product.id}`,
                    jobNumber: (product.sku || 'UNKNOWN').toUpperCase(),
                    createdAt: new Date().toISOString(),
                    requestedBy: user
                };
                setJobs(prev => [fallbackJob, ...prev]);
                return fallbackJob;
            }
        } catch (error) {
            logger.error('useJobMaintenance', 'Error creating putaway job', error as Error);
            return undefined;
        }
    }, [activeSite, setJobs]);

    const deleteJob = useCallback(async (id: string) => {
        try {
            await wmsJobsService.update(id, {
                status: 'Deleted',
                completedAt: new Date().toISOString(),
                completedBy: user?.id || 'System'
            } as any);
            setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'Deleted', completedAt: new Date().toISOString(), completedBy: user?.id || 'System' } : j));
            addNotification('success', 'Job deleted');
            queryClient.invalidateQueries({ queryKey: ['wms_jobs'] });
        } catch (error) {
            logger.error('useJobMaintenance', 'caught error', error as Error);
            addNotification('alert', 'Failed to delete job');
        }
    }, [setJobs, addNotification, queryClient, user]);

    return { resetJob, fixBrokenJobs, createPutawayJob, deleteJob };
};
