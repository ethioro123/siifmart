/**
 * Enterprise Product Attributes Helper
 * Harmonizes the 6-layer attribute model across PO Creation, Inbound Receiving,
 * Putaway, and Inventory storage.
 */

export interface CustomAttributesModel {
    identity?: {
        variant?: string;
        type?: string;
        subcategory?: string;
        modelNumber?: string;
        brand?: string;
    };
    physical?: {
        netWeight?: string;
        grossWeight?: string;
        volume?: string;
        unit?: string;
        sizeType?: string;
        dims?: string;
        color?: string;
        form?: string;
        texture?: string;
    };
    packaging?: {
        unitSize?: string;
        packQty?: string;
        caseSize?: string;
        packagingLevel?: string;
        material?: string;
        isBreakable?: boolean;
        packageType?: string;
    };
    storage?: {
        type?: string;
        isPerishable?: boolean;
        stackLimit?: string | number;
        isHazardous?: boolean;
        isFragile?: boolean;
        isLightSensitive?: boolean;
    };
    commercial?: {
        isWeighted?: boolean;
        sellBy?: string;
        priceType?: string;
        isBundleEligible?: boolean;
        isReturnable?: boolean;
    };
    descriptive?: {
        usage?: string;
        audience?: string;
        ingredients?: string;
        keyFeatures?: string;
        scent?: string;
        flavor?: string;
        strength?: string;
    };
    categorySpecific?: Record<string, any>;
}

/**
 * Deeply merges custom attributes so partial records in inventory retain existing values
 * while receiving newly specified PO attributes.
 */
export function mergeCustomAttributes(existing: any, incoming: any): CustomAttributesModel | null {
    if (!incoming) return existing || null;
    if (!existing) return incoming;

    return {
        ...existing,
        ...incoming,
        identity: { ...(existing.identity || {}), ...(incoming.identity || {}) },
        physical: { ...(existing.physical || {}), ...(incoming.physical || {}) },
        packaging: { ...(existing.packaging || {}), ...(incoming.packaging || {}) },
        storage: { ...(existing.storage || {}), ...(incoming.storage || {}) },
        commercial: { ...(existing.commercial || {}), ...(incoming.commercial || {}) },
        descriptive: { ...(existing.descriptive || {}), ...(incoming.descriptive || {}) },
        categorySpecific: { ...(existing.categorySpecific || {}), ...(incoming.categorySpecific || {}) },
    };
}

/**
 * Extracts unified product attributes from PO line item for consistent ingestion
 * across receiving, putaway, and inventory synchronization.
 */
export function extractProductAttributesFromPOItem(lineItem: any) {
    const customAttrs = lineItem?.customAttributes || lineItem?.custom_attributes;
    const pkg = customAttrs?.packaging;

    const brand = (lineItem?.brand || customAttrs?.identity?.brand || '').trim();
    const size = (lineItem?.size || customAttrs?.physical?.netWeight || '').trim();
    const unit = (lineItem?.unit || customAttrs?.physical?.unit || 'UNIT').trim();
    const category = (lineItem?.category || '').trim();
    const description = (lineItem?.description || '').trim();
    const image = (lineItem?.image || '').trim();

    const rawPackQty = lineItem?.packQuantity ?? lineItem?.pack_quantity ?? pkg?.packQty;
    const packQuantity = (rawPackQty !== undefined && rawPackQty !== null && Number(rawPackQty) > 0)
        ? Number(rawPackQty)
        : 1;

    const packageType = (lineItem?.packageType || lineItem?.package_type || pkg?.packageType || '').trim();

    const rawCaseSize = lineItem?.caseSize ?? lineItem?.case_size ?? pkg?.caseSize;
    const caseSize = (rawCaseSize !== undefined && rawCaseSize !== null && Number(rawCaseSize) > 0)
        ? Number(rawCaseSize)
        : undefined;

    const minStock = Number(lineItem?.minStock) || 0;
    const maxStock = Number(lineItem?.maxStock) || 0;

    return {
        brand,
        size,
        unit,
        category,
        description,
        image,
        packQuantity,
        packageType,
        caseSize,
        minStock,
        maxStock,
        customAttributes: customAttrs || null
    };
}
