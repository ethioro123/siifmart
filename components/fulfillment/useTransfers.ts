import { useCallback } from 'react';
import {
    WMSJob, JobItem, TransferRecord, Site
} from '../../types';
import {
    wmsJobsService,
    transfersService
} from '../../services/supabase.service';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

// ─── Hook Dependencies ──────────────────────────────────────────────────────

interface UseTransfersDeps {
    transfers: TransferRecord[];
    sites: Site[];
    setJobs: React.Dispatch<React.SetStateAction<WMSJob[]>>;
    setTransfers: React.Dispatch<React.SetStateAction<TransferRecord[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    logSystemEvent: (event: string, details: string, user: string, category: string) => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useTransfers = (deps: UseTransfersDeps) => {
    const { transfers, sites, setJobs, setTransfers, addNotification, logSystemEvent } = deps;

    const requestTransfer = useCallback(async (transfer: TransferRecord) => {
        console.log('📦 requestTransfer called:', {
            id: transfer.id,
            sourceSiteId: transfer.sourceSiteId,
            destSiteId: transfer.destSiteId,
            status: transfer.status,
            itemsCount: transfer.items?.length
        });

        try {
            const created = await transfersService.create(transfer);
            logger.debug('useTransfers', '✅ Transfer created in DB');

            const enriched = {
                ...created,
                sourceSiteName: sites.find(s => s.id === created.sourceSiteId)?.name || 'Unknown',
                destSiteName: sites.find(s => s.id === created.destSiteId)?.name || 'Unknown'
            };

            setTransfers(prev => [enriched, ...prev]);
            addNotification('success', 'Transfer request created');
        } catch (error) {
            logger.error('useTransfers', 'Failed to create transfer', error as Error);
            addNotification('alert', 'Failed to create transfer request');
        }
    }, [sites, setTransfers, addNotification]);

    const shipTransfer = useCallback(async (id: string, user: string) => {
        try {
            await transfersService.update(id, { status: 'Shipped', shippedAt: new Date().toISOString() });
            setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'Shipped', shippedAt: new Date().toISOString() } : t));
            addNotification('success', 'Transfer marked as shipped');
            logSystemEvent('Transfer Shipped', `Transfer ${id} shipped`, user, 'Inventory');
        } catch (error) {
            logger.error('useTransfers', 'caught error', error as Error);
            addNotification('alert', 'Failed to update transfer');
        }
    }, [setTransfers, addNotification, logSystemEvent]);

    const receiveTransfer = useCallback(async (id: string, user: string, receivedQuantities?: Record<string, number>) => {
        try {
            const transfer = transfers.find(t => t.id === id);
            if (!transfer) return;

            logger.debug('useTransfers', `📦 Receiving transfer ${id} with quantities`);

            if (transfer.items && transfer.items.length > 0) {
                const receivedItemsMap = receivedQuantities || {};

                const itemsToPutaway = transfer.items.filter(item => {
                    const qty = receivedItemsMap[item.productId] ?? item.quantity;
                    return qty > 0;
                });

                if (itemsToPutaway.length > 0) {
                    const jobLineItems = itemsToPutaway.map(item => ({
                        productId: item.productId,
                        name: item.productName || 'Unknown Product',
                        sku: item.productId,
                        image: '',
                        expectedQty: receivedItemsMap[item.productId] ?? item.quantity,
                        pickedQty: 0,
                        status: 'Pending' as JobItem['status']
                    }));

                    const putawayJob = {
                        type: 'PUTAWAY',
                        status: 'Pending',
                        siteId: transfer.destSiteId,
                        site_id: transfer.destSiteId,
                        priority: 'Normal',
                        items: Math.ceil(jobLineItems.reduce((acc, i) => acc + i.expectedQty, 0)),
                        lineItems: jobLineItems,
                        location: 'Receiving Dock',
                        orderRef: transfer.id,
                        createdBy: user,
                        createdAt: new Date().toISOString()
                    };

                    try {
                        const createdJob = await wmsJobsService.create(putawayJob as any);
                        setJobs(prev => [createdJob, ...prev]);
                        logger.debug('useTransfers', `✅ Auto-created Putaway Job for Transfer ${id}: ${createdJob.id}`);
                        addNotification('success', 'Putaway job created for received transfer');
                    } catch (e) {
                        logger.error('useTransfers', 'Failed to create Putaway Job for transfer', e as Error);
                    }
                }
            }

            const timestampStr = new Date().toISOString();

            // Also complete associated WMS jobs in wms_jobs table if they exist
            try {
                const { data: associatedJobs } = await supabase
                    .from('wms_jobs')
                    .select('id, type')
                    .or(`id.eq.${id},order_ref.eq.${id},job_number.eq.${transfer.jobNumber || ''}`);

                if (associatedJobs && associatedJobs.length > 0) {
                    for (const job of associatedJobs) {
                        await wmsJobsService.update(job.id, {
                            status: 'Completed',
                            transferStatus: 'Received',
                            receivedAt: timestampStr,
                            receivedBy: user
                        } as any);
                    }
                    
                    setJobs(prev => prev.map(j => {
                        const isAssociated = j.id === id || j.orderRef === id || (transfer.jobNumber && j.jobNumber === transfer.jobNumber) || (transfer.jobNumber && j.orderRef === transfer.jobNumber);
                        if (isAssociated) {
                            return {
                                ...j,
                                status: 'Completed',
                                transferStatus: 'Received',
                                receivedAt: timestampStr,
                                receivedBy: user
                            };
                        }
                        return j;
                    }));
                }
            } catch (jobErr) {
                logger.warn('useTransfers', '⚠️ Failed to complete associated WMS jobs during POS receive');
            }

            await transfersService.update(id, { status: 'Completed', receivedAt: timestampStr });
            setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed', receivedAt: timestampStr } : t));
            addNotification('success', 'Transfer received successfully');
            logSystemEvent('Transfer Received', `Transfer ${id} received`, user, 'Inventory');
        } catch (error) {
            logger.error('useTransfers', 'caught error', error as Error);
            addNotification('alert', 'Failed to receive transfer');
        }
    }, [transfers, setJobs, setTransfers, addNotification, logSystemEvent]);

    const updateTransfer = useCallback(async (id: string, updates: Partial<TransferRecord>) => {
        try {
            await transfersService.update(id, updates);
            setTransfers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
            addNotification('success', 'Transfer updated');
        } catch (error) {
            logger.error('useTransfers', 'caught error', error as Error);
            addNotification('alert', 'Failed to update transfer');
        }
    }, [setTransfers, addNotification]);

    return { requestTransfer, shipTransfer, receiveTransfer, updateTransfer };
};
