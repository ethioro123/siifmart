import { useCallback } from 'react';
import {
    WMSJob, JobItem, TransferRecord, Site
} from '../../types';
import {
    wmsJobsService,
    transfersService
} from '../../services/supabase.service';

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
            console.log('✅ Transfer created in DB:', created);

            const enriched = {
                ...created,
                sourceSiteName: sites.find(s => s.id === created.sourceSiteId)?.name || 'Unknown',
                destSiteName: sites.find(s => s.id === created.destSiteId)?.name || 'Unknown'
            };

            setTransfers(prev => [enriched, ...prev]);
            addNotification('success', 'Transfer request created');
        } catch (error) {
            console.error('Failed to create transfer:', error);
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
            console.error(error);
            addNotification('alert', 'Failed to update transfer');
        }
    }, [setTransfers, addNotification, logSystemEvent]);

    const receiveTransfer = useCallback(async (id: string, user: string, receivedQuantities?: Record<string, number>) => {
        try {
            const transfer = transfers.find(t => t.id === id);
            if (!transfer) return;

            console.log(`📦 Receiving transfer ${id} with quantities:`, receivedQuantities);

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
                        items: jobLineItems.reduce((acc, i) => acc + i.expectedQty, 0),
                        lineItems: jobLineItems,
                        location: 'Receiving Dock',
                        orderRef: transfer.id,
                        createdBy: user,
                        createdAt: new Date().toISOString()
                    };

                    try {
                        const createdJob = await wmsJobsService.create(putawayJob as any);
                        setJobs(prev => [createdJob, ...prev]);
                        console.log(`✅ Auto-created Putaway Job for Transfer ${id}:`, createdJob.id);
                        addNotification('success', 'Putaway job created for received transfer');
                    } catch (e) {
                        console.error("Failed to create Putaway Job for transfer:", e);
                    }
                }
            }

            await transfersService.update(id, { status: 'Completed', receivedAt: new Date().toISOString() });
            setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed', receivedAt: new Date().toISOString() } : t));
            addNotification('success', 'Transfer received successfully');
            logSystemEvent('Transfer Received', `Transfer ${id} received`, user, 'Inventory');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to receive transfer');
        }
    }, [transfers, setJobs, setTransfers, addNotification, logSystemEvent]);

    const updateTransfer = useCallback(async (id: string, updates: Partial<TransferRecord>) => {
        try {
            await transfersService.update(id, updates);
            setTransfers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
            addNotification('success', 'Transfer updated');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to update transfer');
        }
    }, [setTransfers, addNotification]);

    return { requestTransfer, shipTransfer, receiveTransfer, updateTransfer };
};
