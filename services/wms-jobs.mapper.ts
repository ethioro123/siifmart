import type { WMSJob } from '../types';

/**
 * Maps raw database row from `wms_jobs` table to frontend `WMSJob` domain interface.
 * Normalizes snake_case database columns to camelCase domain properties.
 */
export const mapWmsJobRow = (row: any): WMSJob => {
    if (!row) return row;
    return {
        ...row,
        countryCode: row.country_code || 'ET',
        country_code: row.country_code || 'ET',
        siteId: row.site_id,
        items: row.items_count,
        assignedTo: row.assigned_to,
        orderRef: row.order_ref,
        lineItems: (row.line_items || []).map((item: any) => ({
            ...item,
            id: item.id,
            jobId: item.job_id || item.jobId,
            productId: item.product_id || item.productId,
            name: item.name,
            sku: item.sku,
            expectedQty: item.expected_qty !== undefined ? item.expected_qty : item.expectedQty,
            pickedQty: item.picked_qty !== undefined ? item.picked_qty : item.pickedQty,
            status: item.status,
            location: item.location,
            expiryDate: item.expiryDate || item.expiry_date,
            batchNumber: item.batchNumber || item.batch_number,
            condition: item.condition,
            packQuantity: item.packQuantity || item.pack_quantity,
            packageType: item.packageType || item.package_type,
            customAttributes: item.customAttributes || item.custom_attributes,
            requestedMeasureQty: item.requestedMeasureQty !== undefined ? item.requestedMeasureQty : item.requested_measure_qty,
            isMeasure: item.isMeasure !== undefined ? item.isMeasure : item.is_measure,
            minStock: item.minStock || item.min_stock,
            maxStock: item.maxStock || item.max_stock,
            retailPrice: item.retailPrice || item.retail_price
        })),
        jobNumber: row.job_number,
        sourceSiteId: row.source_site_id,
        destSiteId: row.dest_site_id,
        transferStatus: row.transfer_status,
        requestedBy: row.requested_by,
        approvedBy: row.approved_by,
        shippedAt: row.shipped_at,
        deliveredAt: row.delivered_at,
        receivedAt: row.received_at,
        receivedBy: row.received_by,
        trackingNumber: row.tracking_number,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deliveryMethod: row.delivery_method,
        hasDiscrepancy: row.has_discrepancy,
        discrepancyDetails: row.discrepancy_details,
        completedBy: row.completed_by,
        completedAt: row.completed_at,
        externalCarrierName: row.external_carrier_name,
        assignedBy: row.assigned_by,
        packSecuritySealSerial: row.pack_security_seal_serial,
        notes: row.notes
    };
};
