import { generateInboundPutawayLabelHTML } from '../utils/labels/InboundPutawayLabelGenerator';
import { generateUnifiedBatchLabelsHTML } from '../utils/labels/ProductLabelGenerator';
import { printHtmlContent } from '../utils/printHelper';
import { buildReceivingPalletLabels, validateReceivingPrintItems, type ReceivingPrintItem } from '../utils/receivingLabelData';
import type { LabelSize } from '../utils/labels/types';
import type { Product, PurchaseOrder, User } from '../types';
import { logger } from '../utils/logger';
interface Options {
    products: Product[]; allProducts: Product[]; country?: string; user: User | null;
    receivingPO: PurchaseOrder | null; size: string; format: 'QR' | 'Barcode' | 'Both';
    options: { showPrice: boolean; showCategory: boolean; showName: boolean }; allowPrice: boolean;
    setIsSubmitting: (value: boolean) => void;
    addNotification: (type: 'success' | 'alert' | 'info', message: string) => void;
}
export function useReceivingLabelPrinting(config: Options) {
    return async (items: ReceivingPrintItem[], type: 'LPN' | 'ITEM' = 'LPN'): Promise<boolean> => {
        config.setIsSubmitting(true);
        try {
            validateReceivingPrintItems(items);
            const currency = config.country === 'KE' ? 'KSh' : 'ETB';
            const size = ({ TINY: 'Tiny', SMALL: 'Small', MEDIUM: 'Medium', LARGE: 'Large', XL: 'XL' } as Record<string, LabelSize>)[config.size] || 'Medium';
            let html: string;
            if (type === 'LPN') {
                const labels = buildReceivingPalletLabels(items.map(item => ({ ...item, poNumber: item.poNumber || config.receivingPO?.poNumber })), config.user?.name, config.user?.code);
                html = await generateInboundPutawayLabelHTML(labels, { size, format: config.format });
            } else {
                const labels = items.map(item => {
                    const product = [...config.products, ...config.allProducts].find(product => product.sku === item.sku);
                    return { value: item.sku, label: item.name, sku: item.sku, barcode: item.sku,
                        quantity: item.copies ?? 1, price: String(item.price ?? product?.price ?? ''),
                        currency, category: item.category || product?.category || '', date: item.expiry || '' };
                });
                html = await generateUnifiedBatchLabelsHTML(labels, { size, format: config.format, currency, ...config.options,
                    showPrice: config.allowPrice && config.options.showPrice });
            }
            const result = await printHtmlContent(html);
            if (!result.success) throw new Error(result.error || 'The print request failed.');
            config.addNotification('info', 'Label print request opened. Check the printer or print dialog to confirm output.');
            return true;
        } catch (error) {
            logger.error('ReceivingLabels', 'Label printing failed', error);
            config.addNotification('alert', error instanceof Error ? error.message : 'Could not print receiving labels.');
            return false;
        } finally { config.setIsSubmitting(false); }
    };
}
