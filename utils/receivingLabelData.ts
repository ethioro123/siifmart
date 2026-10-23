import type { InboundPutawayLabelItem } from './labels/InboundPutawayLabelGenerator';
export interface ReceivingPrintItem {
    sku: string; name: string; qty: number; copies?: number;
    price?: string | number; category?: string; expiry?: string; batchNumber?: string;
    targetLocation?: string; targetZone?: string; poNumber?: string; packQuantity?: number;
    condition?: string; receiptSaved?: boolean;
}
export function validateReceivingPrintItems(items: readonly ReceivingPrintItem[]) {
    if (!items.length) throw new Error('Select an item to print.');
    for (const item of items) {
        if (!item.sku?.trim() || item.sku === 'UNKNOWN') throw new Error('A valid SKU is required for receiving labels.');
        if (!Number.isFinite(item.qty) || item.qty <= 0) throw new Error('Enter a positive counted quantity before printing.');
        if (!Number.isSafeInteger(item.copies ?? 1) || (item.copies ?? 1) < 1 || (item.copies ?? 1) > 500) throw new Error('Print between 1 and 500 label copies.');
    }
}
export function buildReceivingPalletLabels(items: readonly ReceivingPrintItem[], receiver?: string, receiverCode?: string): InboundPutawayLabelItem[] {
    validateReceivingPrintItems(items);
    return items.flatMap(item => Array.from({ length: item.copies ?? 1 }, () => ({
        sku: item.sku.trim(), productName: item.name, barcode: item.sku.trim(),
        poNumber: item.poNumber, quantity: item.qty, packQuantity: item.packQuantity || 1,
        batchNumber: item.batchNumber, expiryDate: item.expiry, targetLocation: item.targetLocation,
        targetZone: item.targetZone || item.category || 'General', receivedBy: receiver,
        receiverCode, receivedDate: new Date().toISOString().slice(0,10),
        condition: item.receiptSaved ? `RECEIVED · ${item.condition || 'Condition not recorded'}` : 'COUNTED · NOT SAVED'
    })));
}
