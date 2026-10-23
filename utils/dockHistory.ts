import type { PurchaseOrder } from '../types';
/** Approval is not evidence of physical receipt. */
export const hasRecordedDockReceipt = (order: PurchaseOrder): boolean =>
    ['Partially Received', 'Received'].includes(order.status);
