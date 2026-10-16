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
                let templateProduct = itemSku
                    ? allProducts.find(p => p.sku?.trim()?.toUpperCase() === itemSku)
                    : null;

                if (!templateProduct && itemSku) {
                    try {
                        const { productsService } = await import('../../../../services/supabase.service');
                        templateProduct = await productsService.getBySKU(itemSku);
                    } catch (e) { }
                }

                if (!templateProduct && !item.sku && !item.name) continue;

                let destProduct = allProducts.find(p =>
                    (p.sku === (item.sku || templateProduct?.sku)) &&
                    (p.siteId === destSiteId || p.site_id === destSiteId)
                );

                if (!destProduct && (item.sku || templateProduct?.sku) && destSiteId) {
                    try {
                        const { productsService } = await import('../../../../services/supabase.service');
                        destProduct = await productsService.getBySKU(item.sku || templateProduct?.sku, destSiteId);
                    } catch (e) { }
                }

                let targetId = destProduct?.id;

                if (!destProduct) {
                    const effectivePrice = (item as any).retailPrice || (item as any).price || templateProduct?.price || 0;
                    const effectiveCost = (item as any)?.costPrice || (item as any)?.cost || (templateProduct as any)?.costPrice || (templateProduct as any)?.cost || 0;
                    const effectiveCategory = (item.category && item.category !== 'Uncategorized' && item.category !== t('posCommand.uncategorized'))
                        ? item.category
                        : ((templateProduct?.category && templateProduct.category !== 'Uncategorized') ? templateProduct.category : t('posCommand.uncategorized'));

                    const created = await addProduct({
                        name: item.name || templateProduct?.name || t('posCommand.restoredProduct'),
                        sku: item.sku || templateProduct?.sku || 'N/A',
                        price: effectivePrice,
                        costPrice: effectiveCost,
                        stock: 0,
                        unit: item.unit || templateProduct?.unit || 'pcs',
                        siteId: destSiteId,
                        category: effectiveCategory,
                        brand: item.brand || templateProduct?.brand || '',
                        size: item.size || templateProduct?.size || '',
                        barcode: item.barcode || templateProduct?.barcode || '',
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
