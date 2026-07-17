import { logger } from '../../../../utils/logger';

interface RepairShipmentInventoryParams {
    jobId: string;
    jobs: any[];
    allProducts: any[];
    activeSite: any;
    user: any;
    addProduct: (p: any) => Promise<any>;
    adjustStock: (pId: string, qty: number, type: 'IN' | 'OUT', reason: string, user: string) => any;
    refreshData: () => Promise<void>;
    addNotification: (type: 'info' | 'success' | 'alert', message: string) => void;
    formatJobId: (job: any) => string;
    t: (key: string) => string;
}

export const repairShipmentInventoryHelper = async ({
    jobId,
    jobs,
    allProducts,
    activeSite,
    user,
    addProduct,
    adjustStock,
    refreshData,
    addNotification,
    formatJobId,
    t
}: RepairShipmentInventoryParams) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        addNotification('alert', t('posCommand.recordNotFound'));
        return;
    }

    const items = job.lineItems || (job as any).line_items || [];
    if (items.length === 0) {
        addNotification('alert', t('posCommand.noItemsInRecord'));
        return;
    }

    addNotification('info', `${t('posCommand.startingRepair')} ${job.orderRef || job.id.substring(0, 8)}...`);

    try {
        const destSiteId = job.destSiteId || (job as any).dest_site_id || activeSite?.id;
        let repairCount = 0;

        for (const item of items) {
            const received = item.receivedQty || (item as any).quantity || item.expectedQty || item.pickedQty ||
                (item as any).received_qty || (item as any).qty || 0;

            if (received > 0) {
                const itemSku = item.sku?.trim()?.toUpperCase();
                const templateProduct = itemSku
                    ? allProducts.find(p => p.sku?.trim()?.toUpperCase() === itemSku)
                    : null;

                if (!templateProduct && !item.sku && !item.name) continue;

                const destProduct = allProducts.find(p =>
                    (p.sku === (item.sku || templateProduct?.sku)) &&
                    (p.siteId === destSiteId || p.site_id === destSiteId)
                );

                let targetId = destProduct?.id;

                if (!destProduct) {
                    const created = await addProduct({
                        name: item.name || templateProduct?.name || t('posCommand.restoredProduct'),
                        sku: item.sku || templateProduct?.sku || 'N/A',
                        price: templateProduct?.price || 0,
                        costPrice: (templateProduct as any)?.costPrice || (templateProduct as any)?.cost || 0,
                        stock: 0,
                        unit: templateProduct?.unit || 'pcs',
                        siteId: destSiteId,
                        category: templateProduct?.category || t('posCommand.uncategorized'),
                        productId: templateProduct?.productId || templateProduct?.id
                    } as any);
                    targetId = created?.id;
                    repairCount++;
                }

                if (targetId) {
                    await adjustStock(
                        targetId,
                        received,
                        'IN',
                        `${t('posCommand.startingRepair')}: ${formatJobId(job as any)}`,
                        user?.name || t('posCommand.posRepair')
                    );
                }
            }
        }

        await refreshData();
        addNotification('success', `${t('posCommand.repairComplete')} ${repairCount} missing records.`);
    } catch (err: any) {
        logger.error('usePOSReceiving', 'Repair failed:', err);
        addNotification('alert', `${t('posCommand.repairFailed')} ${err.message}`);
    }
};
