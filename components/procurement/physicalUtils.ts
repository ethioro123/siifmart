import { getCategorySpecGroup } from './categoryAttributes';

export interface POItemPhysicalSummary {
    netWeightFormatted: string | null;
    grossWeightFormatted: string | null;
    dimensionsFormatted: string | null;
    form: string | null;
    specBadge: string | null;
    domainId?: string;
    domainLabel?: string;
    sizeOrVolume?: string | null;
    materialOrContainer?: string | null;
    colorOrFinish?: string | null;
}

/**
 * Returns structured physical specifications for a product or PO item
 * strictly separated from packaging hierarchy (GS1 / Walmart Item 360 standard).
 * Category-aware: automatically adapts spec badges and physical layers per domain archetype.
 */
export const getPOItemPhysicalSummary = (item: any, allProducts?: any[]): POItemPhysicalSummary => {
    const matchedProduct = allProducts?.find(p => (item.productId && p.id === item.productId) || (item.sku && p.sku === item.sku) || (item.productName && p.name === item.productName));
    const attrs = item.customAttributes || item.custom_attributes || matchedProduct?.customAttributes || (matchedProduct as any)?.custom_attributes;
    const physical = attrs?.physical || {};
    const catSpecific = attrs?.categorySpecific || {};

    const rawCategory = (item.category || attrs?.identity?.category || matchedProduct?.category || '').toString();
    const rawSubcategory = (item.subcategory || attrs?.identity?.subcategory || matchedProduct?.subcategory || '').toString();
    const specGroup = getCategorySpecGroup(rawCategory, rawSubcategory);
    const domainId = specGroup.id;

    const rawNet = (physical.netWeight || item.size || matchedProduct?.size || '').toString().trim();
    const sizeType = (physical.sizeType || physical.unit || '').toString().trim();
    let netWeightFormatted: string | null = null;
    if (rawNet) {
        if (/[a-zA-Z]/.test(rawNet)) {
            netWeightFormatted = rawNet;
        } else if (sizeType) {
            netWeightFormatted = `${rawNet} ${sizeType}`;
        } else {
            netWeightFormatted = rawNet;
        }
    }

    const rawGross = (physical.grossWeight || '').toString().trim();
    const grossWeightFormatted = rawGross ? (/[a-zA-Z]/.test(rawGross) ? rawGross : `${rawGross} kg`) : null;

    const rawDims = (physical.dims || '').toString().trim();
    const dimensionsFormatted = rawDims ? (/[a-zA-Z]/.test(rawDims) ? rawDims : `${rawDims} cm`) : null;

    const form = physical.form || null;

    // Domain-aware physical summary badge
    const specParts: string[] = [];
    let sizeOrVolume: string | null = null;
    let materialOrContainer: string | null = null;
    let colorOrFinish: string | null = null;

    if (domainId === 'apparel') {
        const apparelSize = catSpecific.apparelSize || catSpecific.clothing_size || (physical.sizeType && !['g', 'kg', 'ml', 'L'].includes(physical.sizeType) ? physical.sizeType : null);
        const color = physical.color || catSpecific.color || attrs?.identity?.variant || null;
        const fabric = catSpecific.fabricMaterial || catSpecific.material || (form && !['Solid', 'Liquid'].includes(form) ? form : null);
        sizeOrVolume = apparelSize;
        colorOrFinish = color;
        materialOrContainer = fabric;
        if (apparelSize) specParts.push(`Size: ${apparelSize}`);
        if (color) specParts.push(color);
        if (fabric) specParts.push(fabric);
        if (netWeightFormatted && !specParts.some(p => p.includes(netWeightFormatted!))) specParts.push(netWeightFormatted);
    } else if (domainId === 'beverages') {
        const container = catSpecific.containerType || catSpecific.container_type || physical.containerType || (form && !['Liquid', 'Solid'].includes(form) ? form : null);
        sizeOrVolume = netWeightFormatted;
        materialOrContainer = container;
        if (netWeightFormatted) specParts.push(`Vol: ${netWeightFormatted}`);
        if (container) specParts.push(container);
        if (grossWeightFormatted) specParts.push(`Gross: ${grossWeightFormatted}`);
    } else if (domainId === 'electronics') {
        const color = physical.color || catSpecific.color || attrs?.identity?.variant || null;
        colorOrFinish = color;
        if (dimensionsFormatted) specParts.push(`Dims: ${dimensionsFormatted}`);
        if (netWeightFormatted) specParts.push(netWeightFormatted);
        if (color) specParts.push(color);
    } else if (domainId === 'homewares_kitchen') {
        const capacity = catSpecific.capacity || physical.capacity || null;
        const mat = catSpecific.material || physical.material || (form && !['Solid', 'Liquid'].includes(form) ? form : null);
        sizeOrVolume = capacity;
        materialOrContainer = mat;
        if (capacity) specParts.push(`Cap: ${capacity}`);
        if (mat) specParts.push(mat);
        if (dimensionsFormatted) specParts.push(`Dims: ${dimensionsFormatted}`);
        if (netWeightFormatted) specParts.push(netWeightFormatted);
    } else {
        if (netWeightFormatted) specParts.push(`Net: ${netWeightFormatted}`);
        if (grossWeightFormatted) specParts.push(`Gross: ${grossWeightFormatted}`);
        if (dimensionsFormatted) specParts.push(`Dims: ${dimensionsFormatted}`);
        if (form && !['Solid', 'Device / Hardware'].includes(form)) specParts.push(form);
    }

    const specBadge = specParts.length > 0 ? specParts.join(' • ') : null;

    return {
        netWeightFormatted,
        grossWeightFormatted,
        dimensionsFormatted,
        form,
        specBadge,
        domainId,
        domainLabel: specGroup.domainTitle,
        sizeOrVolume,
        materialOrContainer,
        colorOrFinish
    };
};
