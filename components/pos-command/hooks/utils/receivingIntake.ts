import { logger } from '../../../../utils/logger';

interface ProcessReceivingStockParams {
    transferId: string;
    destSiteId: string;
    transferReceivingItems: any[];
    allProducts: any[];
    receiverName: string;
    timestampStr: string;
    addNotification: (type: 'info' | 'success' | 'alert', message: string) => void;
}

export interface AppliedStockItem {
    productId: string;
    previousStock: number;
    addedQty: number;
}

export interface ReceivingStockIntakeResult {
    success: boolean;
    failedItems: string[];
    appliedItems: AppliedStockItem[];
}

export const rollbackReceivingStockIntake = async (appliedItems: AppliedStockItem[]) => {
    if (!appliedItems || appliedItems.length === 0) return;
    try {
        const { productsService } = await import('../../../../services/supabase.service');
        for (const item of appliedItems) {
            try {
                await productsService.update(item.productId, {
                    stock: item.previousStock
                } as any);
            } catch (err) {
                logger.error('receivingIntake', `Rollback stock failed for ${item.productId}`, err as Error);
            }
        }
    } catch { }
};

export const processReceivingStockIntake = async ({
    transferId,
    destSiteId,
    transferReceivingItems,
    allProducts,
    receiverName,
    timestampStr,
    addNotification
}: ProcessReceivingStockParams): Promise<ReceivingStockIntakeResult> => {
    const failedItems: string[] = [];
    const appliedItems: AppliedStockItem[] = [];

    if (!destSiteId) return { success: true, failedItems: [], appliedItems: [] };

    const { productsService } = await import('../../../../services/supabase.service');

    for (const item of transferReceivingItems) {
        if (item.receivedQty > 0) {
            const itemSku = item.sku?.trim()?.toUpperCase();
            const itemLabel = item.sku || item.name || 'Unknown Item';

            // Branch users do not preload other products into the global cache, so resolve the
            // destination record from the database (site-scoped by RLS) to get fresh stock.
            let destProduct: any = null;
            if (itemSku) {
                try {
                    destProduct = await productsService.getBySKU(itemSku, destSiteId);
                } catch (lookupErr) {
                    logger.warn('receivingIntake', `Destination lookup failed for ${itemSku}; falling back to cache`);
                }
                if (!destProduct) {
                    destProduct = allProducts.find(p =>
                        p.sku?.trim()?.toUpperCase() === itemSku &&
                        (p.siteId === destSiteId || p.site_id === destSiteId)
                    ) || null;
                }
            }

            if (!destProduct && itemSku) {
                // Genuinely missing at the destination: the server creates a zero-stock record
                // from the source product after validating this transfer and the receiver.
                try {
                    await productsService.ensureTransferReceiptProduct(transferId, itemSku);
                    destProduct = await productsService.getBySKU(itemSku, destSiteId);
                } catch (createErr) {
                    logger.error('receivingIntake', `Failed to prepare destination product ${itemSku}:`, createErr as Error);
                }
            }

            if (!destProduct) {
                addNotification('alert', `Product ${itemLabel} is missing at the destination or you do not have catalog access. Ask an inventory administrator to add it, then retry receipt.`);
                failedItems.push(itemLabel);
                continue;
            }

            const prevStock = Number(destProduct.stock || 0);
            const newStock = prevStock + item.receivedQty;
            try {
                await productsService.update(destProduct.id, {
                    stock: newStock,
                    pos_received_by: receiverName,
                    pos_received_at: timestampStr,
                    updated_by: receiverName
                } as any);
                appliedItems.push({
                    productId: destProduct.id,
                    previousStock: prevStock,
                    addedQty: item.receivedQty
                });
            } catch (updateErr) {
                logger.error('receivingIntake', `Failed to update stock for ${item.sku}:`, updateErr as Error);
                failedItems.push(itemLabel);
            }
        }
    }

    if (failedItems.length > 0) {
        addNotification('alert', `Failed to process stock for: ${failedItems.join(', ')}.`);
    }

    return {
        success: failedItems.length === 0,
        failedItems,
        appliedItems
    };
};
