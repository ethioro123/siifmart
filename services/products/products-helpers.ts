import type { Product } from '../../types';

// Helper to map DB record to Product interface
export function _mapProduct(data: any): Product {
    return {
        ...data,
        siteId: data.site_id,
        barcodes: data.barcodes || [],
        costPrice: data.cost_price,
        salePrice: data.sale_price,
        isOnSale: data.is_on_sale,
        expiryDate: data.expiry_date,
        batchNumber: data.batch_number,
        shelfPosition: data.shelf_position,
        competitorPrice: data.competitor_price,
        salesVelocity: data.sales_velocity,
        posReceivedAt: data.pos_received_at,
        pos_received_at: data.pos_received_at,
        approvalStatus: data.approval_status,
        approval_status: data.approval_status,
        createdBy: data.created_by,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        rejectedBy: data.rejected_by,
        rejectedAt: data.rejected_at,
        rejectionReason: data.rejection_reason,
        oldPrice: data.old_price,
        old_price: data.old_price,
        priceUpdatedAt: data.price_updated_at,
        productId: data.product_id,
        product_id: data.product_id,
        packQuantity: data.pack_quantity,
        pack_quantity: data.pack_quantity,
        customAttributes: data.custom_attributes,
        custom_attributes: data.custom_attributes,
        description: data.description,
        minStock: data.min_stock,
        maxStock: data.max_stock
    };
}

export function _calculateStatus(stock: number, minStock?: number | null, currentStatus?: string) {
    if (currentStatus === 'archived') return 'archived';
    if (stock <= 0) return 'out_of_stock';
    const minVal = minStock !== undefined && minStock !== null && minStock > 0 ? minStock : 10;
    if (stock < minVal) return 'low_stock';
    return 'active';
}
