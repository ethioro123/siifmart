import type { PurchaseOrder } from '../types';
import { purchaseOrdersService } from '../services/purchase-orders.service';

/** Receipt validation uses fresh authorized details, never the header-only queue. */
export async function loadReceivingPOItem(poId: string, itemId: string, siteId?: string, country?: string) {
    const po: PurchaseOrder | null = await purchaseOrdersService.getById(poId);
    if (!po) throw new Error('Purchase order could not be loaded. Reopen the receiving manifest and retry.');
    if (!siteId || po.siteId !== siteId || !country || (po.countryCode || po.country_code) !== country) {
        throw new Error('This purchase order is outside the receiving facility.');
    }
    if (!['Approved', 'Ordered', 'Partially Received'].includes(po.status)) throw new Error('This purchase order is not open for receiving.');
    const items = po.lineItems || [];
    // Prefer the immutable PO line ID; product IDs can occur on multiple lines.
    let itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex < 0) {
        const matches = items.map((item, index) => ({ item, index })).filter(({ item }) => item.productId === itemId || item.sku === itemId);
        if (matches.length > 1) throw new Error('Select the specific PO line before receiving this product.');
        itemIndex = matches[0]?.index ?? -1;
    }
    if (itemIndex < 0) throw new Error('The item is no longer present on this purchase order. Reopen the manifest and select it again.');
    return { po, itemIndex, item: items[itemIndex] };
}
