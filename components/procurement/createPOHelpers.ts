import { purchaseAmount } from '../../utils/productCosts';
import { PurchaseOrder, POItem, Supplier, Product } from '../../types';
import { getEffectiveCountry } from '../../utils/localization';
import { suppliersService } from '../../services/supabase.service';

export { resolveOrderUnitLabels, computeSellUnitsPerOrderUnit, computeCostPerSellUnit } from '../../utils/productPackaging';

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
    purchaseRequisitionId?: string;
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
        regionalAutonomousPoLimit = 0,
        purchaseRequisitionId
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
                total = purchaseAmount(qty * item.unitCost);
            }

            return {
                ...item,
                quantity: qty,
                totalCost: total
            };
        }).filter(item => item.quantity > 0);

        if (siteItems.length === 0) continue;

        let siteShippingCost = purchaseAmount(shippingCost);
        if (quantityDistribution === 'split' && siteCount > 1 && shippingCost > 0) {
            const baseSplit = Math.floor(shippingCost * 100 / siteCount) / 100;
            const remainder = purchaseAmount(shippingCost - baseSplit * siteCount);
            siteShippingCost = idx === 0 ? baseSplit + remainder : baseSplit;
        }

        const siteSubtotal = purchaseAmount(siteItems.reduce((sum, item) => sum + item.totalCost, 0));
        const siteDiscount = purchaseAmount(siteSubtotal * (discountRate / 100));
        const siteTax = purchaseAmount(siteSubtotal * (taxRate / 100));
        const siteTotalAmount = purchaseAmount(siteSubtotal + siteShippingCost - siteDiscount + siteTax);

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
            purchaseRequisitionId,
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
