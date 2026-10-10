import { supabase } from '../lib/supabase';
import type { PurchaseOrder } from '../types';
import { wmsJobsService } from './wms-jobs.service';
import { getById } from './purchase-orders.read';
import { logger } from '../utils/logger';

export const purchaseOrdersLifecycleService = {
    async receive(id: string, shouldCreateJob = true): Promise<PurchaseOrder | null> {
        const po = await getById(id);
        if (!po) throw new Error('Purchase Order not found');

        const { error } = await supabase
            .from('purchase_orders')
            .update({ status: 'Received', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            logger.error('PurchaseOrdersLifecycleService', 'Failed to update PO status', error);
            throw error;
        }

        if (!shouldCreateJob) {
            return await getById(id);
        }

        try {
            const { data: existingJobs } = await supabase
                .from('wms_jobs')
                .select('id')
                .eq('order_ref', id)
                .eq('type', 'PUTAWAY')
                .limit(1);

            if (existingJobs && existingJobs.length > 0) {
                return await getById(id);
            }

            const { data: receiveJob } = await supabase
                .from('wms_jobs')
                .select('job_number')
                .eq('order_ref', id)
                .eq('type', 'RECEIVE')
                .maybeSingle();

            const finalJobNumber = receiveJob?.job_number || po.poNumber || po.id;

            await wmsJobsService.create({
                siteId: po.siteId,
                countryCode: (po as any).country_code || (po as any).countryCode || 'ET',
                type: 'PUTAWAY',
                priority: (po as any).priority || 'Normal',
                status: 'Pending',
                items: po.itemsCount,
                orderRef: po.id,
                jobNumber: finalJobNumber,
                lineItems: po.lineItems.map((item: any) => ({
                    productId: item.productId,
                    name: item.productName,
                    sku: item.sku,
                    image: item.image || '',
                    expectedQty: item.quantity,
                    pickedQty: 0,
                    status: 'Pending',
                    receivedQty: 0,
                    cost: item.unitCost,
                    retailPrice: item.retailPrice,
                    unit: item.unit,
                    size: item.size,
                    brand: item.brand,
                    packQuantity: item.packQuantity,
                    category: item.category,
                    customAttributes: item.customAttributes,
                    description: item.description,
                    minStock: item.minStock,
                    maxStock: item.maxStock
                })),
                requestedBy: 'System (PO Receipt)',
                notes: `Auto-generated Putaway for PO ${po.poNumber || po.id}`
            } as any);
        } catch (e) {
            logger.error('PurchaseOrdersLifecycleService', 'Failed to create Putaway job during PO receive', e as Error);
        }

        // Close the associated RECEIVE job if it exists
        try {
            const { data: job } = await supabase
                .from('wms_jobs')
                .select('id')
                .eq('type', 'RECEIVE')
                .eq('order_ref', id)
                .neq('status', 'Completed')
                .maybeSingle();

            if (job) {
                await supabase.from('wms_jobs').update({ status: 'Completed' }).eq('id', job.id);
            }
        } catch (e) {
            logger.error('PurchaseOrdersLifecycleService', 'Failed to close WMS job during PO receive', e as Error);
        }

        const updated = await getById(id);
        if (!updated) throw new Error('Purchase Order not found after update');
        return updated;
    },

    async delete(id: string): Promise<PurchaseOrder> {
        // Zero-Trust Chain-of-Custody: Soft-cancel rather than destructive SQL deletion
        return await this.cancel(id, 'Deleted by manager');
    },

    async cancel(id: string, reason?: string): Promise<PurchaseOrder> {
        const currentPO = await getById(id);
        const currentNotes = currentPO?.notes || '';
        const cancelTag = reason ? `\n[CANCELLED: ${reason}]` : '\n[CANCELLED]';

        const { error } = await supabase
            .from('purchase_orders')
            .update({ 
                status: 'Cancelled',
                notes: currentNotes + cancelTag,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            logger.error('PurchaseOrdersLifecycleService', 'Failed to cancel PO', error as Error);
            throw error;
        }
        const updated = await getById(id);
        if (!updated) throw new Error('Purchase Order not found after update');
        return updated;
    }
};
