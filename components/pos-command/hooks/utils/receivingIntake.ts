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

export const processReceivingStockIntake = async ({
    destSiteId,
    transferReceivingItems,
    allProducts,
    receiverName,
    timestampStr,
    addProduct,
    addNotification,
    t
}: ProcessReceivingStockParams): Promise<void> => {
    const failedItems: string[] = [];

    if (!destSiteId) return;

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
                const newStock = (destProduct.stock || 0) + item.receivedQty;
                await productsService.update(destProduct.id, {
                    stock: newStock,
                    pos_received_by: receiverName,
                    pos_received_at: timestampStr,
                    updated_by: receiverName
                } as any);
            } else {
                const templateProduct = itemSku
                    ? allProducts.find(p => p.sku?.trim()?.toUpperCase() === itemSku)
                    : null;

                try {
                    await addProduct({
                        name: item.name || templateProduct?.name || t('posCommand.newProduct'),
                        sku: item.sku,
                        price: templateProduct?.price || 0,
                        costPrice: (templateProduct as any)?.costPrice || (templateProduct as any)?.cost || 0,
                        stock: item.receivedQty,
                        unit: templateProduct?.unit || 'pcs',
                        siteId: destSiteId,
                        category: templateProduct?.category || t('posCommand.uncategorized'),
                        minStockLevel: 5,
                        image: templateProduct?.image || '',
                        productId: templateProduct?.productId || templateProduct?.id,
                        createdBy: receiverName,
                        posReceivedBy: receiverName,
                        posReceivedAt: timestampStr
                    } as any);
                } catch (err) {
                    logger.error('usePOSReceiving', 'Failed to auto-create product:', err);
                    failedItems.push(item.sku || item.name);
                }
            }
        }
    }

    if (failedItems.length > 0) {
        addNotification('alert', `Failed to create: ${failedItems.join(', ')}. Please add manually.`);
    }
};
