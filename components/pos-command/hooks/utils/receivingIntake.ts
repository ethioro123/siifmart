import { logger } from '../../../../utils/logger';

interface ProcessReceivingStockParams {
    destSiteId: string;
    transferReceivingItems: any[];
    allProducts: any[];
    receiverName: string;
    timestampStr: string;
    addProduct: (p: any) => Promise<any>;
    addNotification: (type: 'info' | 'success' | 'alert', message: string) => void;
    t: (key: string) => string;
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
    destSiteId,
    transferReceivingItems,
    allProducts,
    receiverName,
    timestampStr,
    addProduct,
    addNotification,
    t
}: ProcessReceivingStockParams): Promise<ReceivingStockIntakeResult> => {
    const failedItems: string[] = [];
    const appliedItems: AppliedStockItem[] = [];

    if (!destSiteId) return { success: true, failedItems: [], appliedItems: [] };

    const { productsService } = await import('../../../../services/supabase.service');

    for (const item of transferReceivingItems) {
        if (item.receivedQty > 0) {
            const itemSku = item.sku?.trim()?.toUpperCase();
            const destProduct = itemSku
                ? allProducts.find(p =>
                    p.sku?.trim()?.toUpperCase() === itemSku &&
                    (p.siteId === destSiteId || p.site_id === destSiteId)
                )
                : null;

            if (destProduct) {
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
                    failedItems.push(item.sku || item.name || 'Unknown Item');
                }
            } else {
                let templateProduct = itemSku
                    ? allProducts.find(p => p.sku?.trim()?.toUpperCase() === itemSku)
                    : null;

                if (!templateProduct && itemSku) {
                    try {
                        templateProduct = await productsService.getBySKU(itemSku);
                    } catch (e) { }
                }

                const effectivePrice = (item as any).retailPrice || (item as any).price || templateProduct?.price || 0;
                const effectiveCost = (item as any)?.costPrice || (item as any)?.cost || (templateProduct as any)?.costPrice || (templateProduct as any)?.cost || 0;
                const effectiveCategory = (item.category && item.category !== 'Uncategorized' && item.category !== t('posCommand.uncategorized'))
                    ? item.category
                    : ((templateProduct?.category && templateProduct.category !== 'Uncategorized') ? templateProduct.category : t('posCommand.uncategorized'));

                try {
                    await addProduct({
                        name: item.name || templateProduct?.name || t('posCommand.newProduct'),
                        sku: item.sku,
                        price: effectivePrice,
                        costPrice: effectiveCost,
                        stock: item.receivedQty,
                        unit: item.unit || templateProduct?.unit || 'pcs',
                        siteId: destSiteId,
                        category: effectiveCategory,
                        brand: item.brand || templateProduct?.brand || '',
                        size: item.size || templateProduct?.size || '',
                        barcode: item.barcode || templateProduct?.barcode || '',
                        minStockLevel: 5,
                        image: item.image || templateProduct?.image || '',
                        productId: templateProduct?.productId || templateProduct?.id,
                        createdBy: receiverName,
                        posReceivedBy: receiverName,
                        posReceivedAt: timestampStr
                    } as any);
                } catch (err) {
                    logger.error('usePOSReceiving', 'Failed to auto-create product:', err as Error);
                    failedItems.push(item.sku || item.name || 'Unknown Item');
                }
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
