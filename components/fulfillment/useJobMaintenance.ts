import { useCallback } from 'react';
import {
    WMSJob, JobItem, PurchaseOrder, Product
} from '../../types';
import {
    wmsJobsService
} from '../../services/supabase.service';
import { supabase } from '../../lib/supabase';
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

interface UseJobMaintenanceDeps {
    jobs: WMSJob[];
    orders: PurchaseOrder[];
    products: Product[];
    activeSite: any;
    setJobs: React.Dispatch<React.SetStateAction<WMSJob[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    refreshJobs: () => void;
    queryClient: QueryClient;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useJobMaintenance = (deps: UseJobMaintenanceDeps) => {
    const { jobs, orders, products, activeSite, setJobs, addNotification, refreshJobs, queryClient } = deps;

    const resetJob = useCallback(async (jobId: string) => {
        try {
            console.log('🔄 Resetting job:', jobId);
            const job = jobs.find(j => j.id === jobId);
            if (!job) {
                console.error('❌ Job not found for reset:', jobId);
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

            console.log('💾 Sending reset updates to DB:', dbUpdates);

            const { data, error } = await supabase
                .from('wms_jobs')
                .update(dbUpdates)
                .eq('id', jobId)
                .select()
                .single();

            if (error) {
                console.error('❌ DB Update failed:', error);
                throw error;
            }

            console.log('✅ DB Update successful:', data);

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
            console.error('Failed to reset job:', error);
            addNotification('alert', 'Failed to reset job: ' + (error as any).message);
        }
    }, [jobs, setJobs, addNotification, queryClient]);

    const fixBrokenJobs = useCallback(async () => {
        console.log('Running Fix Broken Jobs...');
        let fixedPOs = 0;
        let fixedNumbers = 0;

        const receivedPOs = orders.filter(o => o.status === 'Received');

        for (const po of receivedPOs) {
            const poJobs = jobs.filter(j => j.orderRef === po.id);
            const hasValidJobs = poJobs.some(j => j.lineItems && j.lineItems.length > 0);

            if (!hasValidJobs) {
                console.log(`Fixing PO ${po.id} - No valid jobs found`);

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
                        } catch (e) { console.error(e); return newJob; }
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
                console.log(`🔧 Syncing Job Number: ${child.type} ${child.id.slice(-4)} -> ${parent.jobNumber}`);
                try {
                    await wmsJobsService.update(child.id, { jobNumber: parent.jobNumber });
                    fixedNumbers++;
                } catch (e) {
                    console.error(`Failed to sync job ${child.id}:`, e);
                }
            }
        }

        if (fixedPOs > 0 || fixedNumbers > 0) {
            addNotification('success', `Maintenance Complete: Fixed ${fixedPOs} POs and synced ${fixedNumbers} job numbers.`);
            refreshJobs();
        } else {
            addNotification('info', 'All jobs look healthy.');
        }
    }, [jobs, orders, products, activeSite, setJobs, addNotification, refreshJobs]);

    const createPutawayJob = useCallback(async (product: Product, quantity: number, user: string, source: string = 'Inventory') => {
        try {
            if (quantity <= 0) {
                console.log('📦 Skipping putaway job - no stock to put away');
                return undefined;
            }

            const targetSiteId = product.siteId || product.site_id || activeSite?.id;
            if (!targetSiteId) {
                console.error('❌ Cannot create putaway job - no site ID');
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
                console.log('✅ Inventory PUTAWAY job created:', createdJob.id);
                setJobs(prev => [createdJob, ...prev]);
                return createdJob;
            } catch (error) {
                console.error('❌ Failed to create putaway job in DB:', error);
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
            console.error('Error creating putaway job:', error);
            return undefined;
        }
    }, [activeSite, setJobs]);

    const deleteJob = useCallback(async (id: string) => {
        try {
            await wmsJobsService.delete(id);
            setJobs(prev => prev.filter(j => j.id !== id));
            addNotification('success', 'Job deleted');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to delete job');
        }
    }, [setJobs, addNotification]);

    return { resetJob, fixBrokenJobs, createPutawayJob, deleteJob };
};
