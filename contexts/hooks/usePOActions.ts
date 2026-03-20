import { useCallback } from 'react';
import type { PurchaseOrder, Site, SystemLog } from '../../types';
import { purchaseOrdersService } from '../../services/supabase.service';

interface UsePOActionsDeps {
    activeSite: Site | undefined;
    activeSiteId: string;
    setOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
    setAllOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
    addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
    logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
}

export function usePOActions(deps: UsePOActionsDeps) {
    const { activeSite, activeSiteId, setOrders, setAllOrders, addNotification } = deps;

    const createPO = useCallback(async (po: PurchaseOrder): Promise<PurchaseOrder | undefined> => {
        try {
            const items = po.lineItems || [];

            console.log('Creating PO with data:', po);

            const newPO = await purchaseOrdersService.create({
                ...po,
                poNumber: po.poNumber || po.id,
                siteId: po.siteId || activeSite?.id || 'HQ'
            }, items);

            setOrders(prev => [newPO, ...prev]);
            setAllOrders(prev => [newPO, ...prev]);
            addNotification('success', `PO #${newPO.id.slice(0, 8)} created successfully`);

            const allUpdatedOrders = await purchaseOrdersService.getAll().then(res => res.data);
            setAllOrders(allUpdatedOrders);

            if (activeSiteId) {
                const siteOrders = await purchaseOrdersService.getAll(activeSiteId).then(res => res.data);
                setOrders(siteOrders);
            } else {
                setOrders(allUpdatedOrders);
            }
            return newPO;
        } catch (error) {
            console.error('Error creating PO:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            console.error('PO data that failed:', JSON.stringify(po, null, 2));

            const localPO: PurchaseOrder = {
                ...po,
                id: po.id || `REF-${Date.now()}`,
                siteId: po.siteId || activeSite?.id || 'SITE-001'
            };

            setOrders(prev => [localPO, ...prev]);
            setAllOrders(prev => [localPO, ...prev]);
            addNotification('success', `PO #${localPO.id.slice(0, 8)} created (local - DB Failed: ${error instanceof Error ? error.message : String(error)})`);
        }
    }, [activeSite, activeSiteId, addNotification]);

    const updatePO = useCallback(async (po: PurchaseOrder) => {
        try {
            await purchaseOrdersService.update(po.id, po);
            setOrders(prev => prev.map(o => o.id === po.id ? po : o));
            setAllOrders(prev => prev.map(o => o.id === po.id ? po : o));
            addNotification('success', `PO ${po.id} updated`);
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to update PO');
        }
    }, [addNotification]);

    const deletePO = useCallback(async (poId: string) => {
        try {
            await purchaseOrdersService.delete(poId);
            setOrders(prev => prev.filter(o => o.id !== poId));
            setAllOrders(prev => prev.filter(o => o.id !== poId));
            addNotification('success', 'PO deleted');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to delete PO');
        }
    }, [addNotification]);

    return { createPO, updatePO, deletePO };
}
