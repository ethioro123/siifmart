import { PurchaseOrder, POItem, Supplier, Product } from '../../types';
import { getEffectiveCountry } from '../../utils/localization';
import { suppliersService } from '../../services/supabase.service';

/**
 * Computes how many sellable units are contained in a single order unit (case/pack/bulk).
 * Handles both count-based units (UNIT, PACK, DOZEN) and physical weight/volume conversions (KG, G, L, ML).
 */
export function computeSellUnitsPerOrderUnit(
    sizeValue: string,
    sizeType: string,
    sellUnitCode: string,
    packQty: number,
    caseSize: number
): number {
    const hasCases = caseSize >= 1;
    const hasPacks = packQty > 1 && !hasCases;
    const packagingUnits = hasCases ? (caseSize * packQty) : (hasPacks ? packQty : 1);

    if (!sellUnitCode) return Math.max(1, packagingUnits);
    const su = sellUnitCode.toUpperCase().trim();

    let sellCategory = '';
    let sellInBase = 1;

    if (su === 'KG') { sellInBase = 1000; sellCategory = 'weight'; }
    else if (su === 'G') { sellInBase = 1; sellCategory = 'weight'; }
    else if (su === 'L') { sellInBase = 1000; sellCategory = 'volume'; }
    else if (su === 'ML') { sellInBase = 1; sellCategory = 'volume'; }
    else if (['UNIT', 'PACK', 'DOZEN'].includes(su)) { sellInBase = 1; sellCategory = 'count'; }

    if (!sellCategory || sellCategory === 'count') {
        if (su === 'DOZEN') {
            return packagingUnits / 12;
        }
        return Math.max(1, packagingUnits);
    }

    const size = parseFloat(sizeValue);
    if (!size || size <= 0 || !sizeType) return Math.max(1, packagingUnits);

    const st = sizeType.trim().toLowerCase();
    let sizeInBase = size;
    let sizeCategory = '';

    if (['kg', 'kilogram', 'kilograms', 'kgs'].includes(st)) { sizeInBase = size * 1000; sizeCategory = 'weight'; }
    else if (['g', 'gram', 'grams', 'gr'].includes(st)) { sizeInBase = size; sizeCategory = 'weight'; }
    else if (['l', 'litre', 'liter', 'litres', 'liters', 'lt'].includes(st)) { sizeInBase = size * 1000; sizeCategory = 'volume'; }
    else if (['ml', 'millilitre', 'milliliter', 'millilitres', 'milliliters'].includes(st)) { sizeInBase = size; sizeCategory = 'volume'; }

    if (!sizeCategory || sizeCategory !== sellCategory) {
        return Math.max(1, packagingUnits);
    }

    const totalPhysicalInBase = sizeInBase * packagingUnits;
    const sellUnitsInPackage = totalPhysicalInBase / sellInBase;
    return sellUnitsInPackage > 0 ? sellUnitsInPackage : Math.max(1, packagingUnits);
}

/**
 * Converts the bulk purchase cost (order-unit cost) into a cost-per-sell-unit.
 */
export function computeCostPerSellUnit(
    unitCost: number,
    sizeValue: string,
    sizeType: string,
    sellUnitCode: string,
    packQty: number,
    caseSize: number
): number | null {
    if (!unitCost || unitCost <= 0 || !sellUnitCode) return null;

    const su = sellUnitCode.toUpperCase().trim();
    let sellCategory = '';
    if (su === 'KG' || su === 'G') sellCategory = 'weight';
    else if (su === 'L' || su === 'ML') sellCategory = 'volume';
    else if (['UNIT', 'PACK', 'DOZEN'].includes(su)) sellCategory = 'count';

    if (!sellCategory) return null;

    if (sellCategory !== 'count') {
        const size = parseFloat(sizeValue);
        if (!size || size <= 0 || !sizeType) return null;
        const st = sizeType.trim().toLowerCase();
        let sizeCategory = '';
        if (['kg', 'kilogram', 'kilograms', 'kgs', 'g', 'gram', 'grams', 'gr'].includes(st)) sizeCategory = 'weight';
        else if (['l', 'litre', 'liter', 'litres', 'liters', 'lt', 'ml', 'millilitre', 'milliliter', 'millilitres', 'milliliters'].includes(st)) sizeCategory = 'volume';
        if (!sizeCategory || sizeCategory !== sellCategory) return null;
    }

    const sellUnitsInPackage = computeSellUnitsPerOrderUnit(sizeValue, sizeType, sellUnitCode, packQty, caseSize);
    if (sellUnitsInPackage <= 0) return null;
    return unitCost / sellUnitsInPackage;
}

/**
 * Scopes catalog products to the active country and deduplicates by SKU,
 * preferring rows from the selected destination warehouse(s).
 */
export function deduplicateCatalogProducts(
    products: Product[],
    preferredSiteIds: string[],
    countrySiteIds: Set<string>,
    activeCountry: string
): Product[] {
    const preferredSet = new Set(preferredSiteIds);
    const otherCountryPrefix = activeCountry === 'KE' ? 'ET-' : 'KE-';
    const byKey = new Map<string, Product>();

    for (const p of products) {
        const pSiteId = p.siteId || (p as any).site_id;
        if (pSiteId && countrySiteIds.size > 0 && !countrySiteIds.has(pSiteId)) {
            continue;
        }
        const skuUpper = (p.sku || '').toUpperCase().trim();
        if (skuUpper.startsWith(otherCountryPrefix)) {
            continue;
        }

        const key = skuUpper || `${(p.name || '').toLowerCase().trim()}|${(p.brand || '').toLowerCase().trim()}|${(p.size || '').toLowerCase().trim()}`;
        if (!key) continue;

        const existing = byKey.get(key);
        if (!existing) {
            byKey.set(key, p);
            continue;
        }

        const existingSiteId = existing.siteId || (existing as any).site_id;
        const existingIsPreferred = Boolean(existingSiteId && preferredSet.has(existingSiteId));
        const currentIsPreferred = Boolean(pSiteId && preferredSet.has(pSiteId));

        if (currentIsPreferred && !existingIsPreferred) {
            byKey.set(key, p);
        } else if (currentIsPreferred === existingIsPreferred && (p.costPrice || 0) > 0 && !(existing.costPrice || 0)) {
            byKey.set(key, p);
        }
    }

    return Array.from(byKey.values());
}

export interface BuildPurchaseOrdersParams {
    destinationSiteIds: string[];
    processedItems: POItem[];
    quantityDistribution: string;
    shippingCost: number;
    discountRate: number;
    taxRate: number;
    editingPO?: PurchaseOrder | null;
    sites: any[];
    currencySymbol: string;
    vendorId: string;
    vendorName: string;
    expectedDate: string;
    poNotes: string;
    paymentTerms: string;
    poPriority: 'Normal' | 'High' | 'Urgent' | 'Low';
    userName?: string;
    poRequestedBy?: string;
    incoterms?: string;
    tempReq?: 'Ambient' | 'Chilled' | 'Frozen';
    shelfLife?: string;
    dockSlot?: string;
    isRegionalUser?: boolean;
    regionalAutonomousPoLimit?: number;
}

export interface GeneratedPurchaseOrder {
    po: PurchaseOrder;
    items: POItem[];
}

export function buildPurchaseOrders(params: BuildPurchaseOrdersParams): GeneratedPurchaseOrder[] {
    const {
        destinationSiteIds,
        processedItems,
        quantityDistribution,
        shippingCost,
        discountRate,
        taxRate,
        editingPO,
        sites,
        currencySymbol,
        vendorId,
        vendorName,
        expectedDate,
        poNotes,
        paymentTerms,
        poPriority,
        userName,
        poRequestedBy,
        incoterms,
        tempReq,
        shelfLife,
        dockSlot,
        isRegionalUser = false,
        regionalAutonomousPoLimit = 0
    } = params;

    const results: GeneratedPurchaseOrder[] = [];
    const siteCount = destinationSiteIds.length;
    const isEditMode = Boolean(editingPO?.id);

    for (let idx = 0; idx < destinationSiteIds.length; idx++) {
        const siteId = destinationSiteIds[idx];
        const siteItems = processedItems.map(item => {
            let qty = item.quantity;
            let total = item.totalCost;

            if (quantityDistribution === 'split' && siteCount > 1) {
                qty = Math.floor(item.quantity / siteCount);
                if (item.quantity % siteCount !== 0 && idx === 0) {
                    qty += item.quantity % siteCount;
                }
                total = Math.round(qty * item.unitCost * 100) / 100;
            }

            return {
                ...item,
                quantity: qty,
                totalCost: total
            };
        }).filter(item => item.quantity > 0);

        if (siteItems.length === 0) continue;

        let siteShippingCost = shippingCost;
        if (quantityDistribution === 'split' && siteCount > 1 && shippingCost > 0) {
            const baseSplit = Math.floor((shippingCost / siteCount) * 100) / 100;
            const remainder = Math.round((shippingCost - baseSplit * siteCount) * 100) / 100;
            siteShippingCost = idx === 0 ? Math.round((baseSplit + remainder) * 100) / 100 : baseSplit;
        }

        const siteSubtotal = siteItems.reduce((sum, item) => sum + item.totalCost, 0);
        const siteDiscount = Math.round(siteSubtotal * (discountRate / 100) * 100) / 100;
        const siteTax = Math.round(siteSubtotal * (taxRate / 100) * 100) / 100;
        const siteTotalAmount = Math.round((siteSubtotal + siteShippingCost - siteDiscount + siteTax) * 100) / 100;

        const destSite = sites.find(s => s.id === siteId);
        const poCurrency = destSite?.currency || (destSite?.country === 'KE' ? 'KSh' : currencySymbol);
        const effectiveRegion = destSite?.region_code || destSite?.regionCode || editingPO?.regionCode || editingPO?.region_code || null;
        const exceedsRegionalCap = Boolean(
            isRegionalUser &&
            regionalAutonomousPoLimit > 0 &&
            siteTotalAmount > regionalAutonomousPoLimit
        );
        const requiresHqApproval = Boolean(
            exceedsRegionalCap ||
            editingPO?.requiresHqApproval ||
            editingPO?.requires_hq_approval
        );

        const newPO: PurchaseOrder = {
            id: (isEditMode && editingPO?.id) ? editingPO.id : crypto.randomUUID(),
            poNumber: isEditMode ? (editingPO?.poNumber || editingPO?.po_number) : undefined,
            po_number: isEditMode ? (editingPO?.po_number || editingPO?.poNumber) : undefined,
            siteId: isEditMode && editingPO?.siteId ? editingPO.siteId : siteId,
            site_id: isEditMode && editingPO?.siteId ? editingPO.siteId : siteId,
            supplierId: vendorId,
            supplierName: vendorName,
            date: (isEditMode && editingPO?.date) ? editingPO.date : new Date().toISOString().split('T')[0],
            status: (isEditMode && editingPO?.status) ? editingPO.status : 'Draft',
            totalAmount: siteTotalAmount,
            itemsCount: siteItems.reduce((acc, item) => acc + item.quantity, 0),
            expectedDelivery: expectedDate || null,
            lineItems: siteItems,
            shippingCost: siteShippingCost,
            taxAmount: siteTax,
            discount: siteDiscount,
            notes: poNotes,
            paymentTerms: paymentTerms,
            priority: poPriority,
            createdBy: (isEditMode && editingPO?.createdBy) ? editingPO.createdBy : userName,
            requestedBy: poRequestedBy,
            currency: poCurrency,
            countryCode: destSite?.country || getEffectiveCountry({ country: destSite?.country, currency: poCurrency }),
            country_code: destSite?.country || getEffectiveCountry({ country: destSite?.country, currency: poCurrency }),
            regionCode: effectiveRegion || undefined,
            region_code: effectiveRegion || undefined,
            requiresHqApproval,
            requires_hq_approval: requiresHqApproval,
            destination: destSite?.name || editingPO?.destination || undefined,
            incoterms: incoterms || undefined,
            tempReq: tempReq || undefined,
            shelfLife: shelfLife || undefined,
            dockSlot: isEditMode ? (editingPO?.dockSlot || dockSlot || undefined) : (dockSlot || undefined),
        };

        results.push({ po: newPO, items: siteItems });
    }

    return results;
}

export interface ResolvePOVendorParams {
    isManualVendor: boolean;
    manualVendorName: string;
    newPOSupplier: string;
    allSuppliers: Supplier[];
    activeCountry: string;
    regionCode?: string | null;
}

export async function resolvePOVendor({
    isManualVendor,
    manualVendorName,
    newPOSupplier,
    allSuppliers,
    activeCountry,
    regionCode
}: ResolvePOVendorParams): Promise<{ vendorId: string; vendorName: string }> {
    if (isManualVendor) {
        const vendorName = manualVendorName.trim() || 'Unspecified';
        const existing = allSuppliers.find(
            s => s.name?.toLowerCase().trim() === vendorName.toLowerCase().trim() &&
            (!s.countryCode || s.countryCode === activeCountry)
        );
        if (existing) {
            return { vendorId: existing.id, vendorName };
        }
        const newSupplier = await suppliersService.create({
            name: vendorName,
            type: 'One-Time',
            contact: 'Manual Entry',
            email: '',
            phone: '',
            category: 'Other',
            location: 'Manual Entry',
            leadTime: 0,
            taxId: '',
            nationalId: '',
            countryCode: activeCountry,
            regionCode: regionCode || undefined
        });
        return { vendorId: newSupplier.id, vendorName };
    }

    if (newPOSupplier) {
        const s = allSuppliers.find(sup => sup.id === newPOSupplier);
        return { vendorId: newPOSupplier, vendorName: s?.name || 'Unknown' };
    }

    return { vendorId: 'UNSPECIFIED', vendorName: 'Unspecified' };
}
