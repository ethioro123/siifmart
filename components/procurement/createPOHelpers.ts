import { PurchaseOrder, POItem, Supplier } from '../../types';
import { getEffectiveCountry } from '../../utils/localization';
import { suppliersService } from '../../services/supabase.service';

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
        poRequestedBy
    } = params;

    const results: GeneratedPurchaseOrder[] = [];
    const siteCount = destinationSiteIds.length;

    for (const siteId of destinationSiteIds) {
        // Clone items to avoid reference issues
        const siteItems = processedItems.map(item => {
            let qty = item.quantity;
            let total = item.totalCost;

            // Apply split logic if enabled
            if (quantityDistribution === 'split' && siteCount > 1) {
                qty = Math.floor(item.quantity / siteCount);

                // Handle remainder on first site
                if (item.quantity % siteCount !== 0 && siteId === destinationSiteIds[0]) {
                    qty += item.quantity % siteCount;
                }

                // Recalculate total cost
                total = Math.round(qty * item.unitCost * 100) / 100;
            }

            return {
                ...item,
                quantity: qty,
                totalCost: total
            };
        }).filter(item => item.quantity > 0);

        if (siteItems.length === 0) continue;

        const siteSubtotal = siteItems.reduce((sum, item) => sum + item.totalCost, 0);
        const siteTotalAmount = siteSubtotal + shippingCost - (siteSubtotal * discountRate / 100) + (siteSubtotal * taxRate / 100);

        const isEditMode = Boolean(editingPO?.id);
        const destSite = sites.find(s => s.id === siteId);
        const poCurrency = destSite?.currency || (destSite?.country === 'KE' ? 'KSh' : currencySymbol);

        const newPO: PurchaseOrder = {
            id: (isEditMode && editingPO?.id) ? editingPO.id : crypto.randomUUID(),
            siteId: siteId,
            supplierId: vendorId,
            supplierName: vendorName,
            date: new Date().toISOString().split('T')[0],
            status: 'Draft',
            totalAmount: siteTotalAmount,
            itemsCount: siteItems.reduce((acc, item) => acc + item.quantity, 0),
            expectedDelivery: expectedDate || null,
            lineItems: siteItems,
            shippingCost: shippingCost,
            taxAmount: siteSubtotal * (taxRate / 100),
            discount: siteSubtotal * (discountRate / 100),
            notes: poNotes,
            paymentTerms: paymentTerms,
            priority: poPriority,
            createdBy: userName,
            requestedBy: poRequestedBy,
            currency: poCurrency,
            countryCode: destSite?.country || getEffectiveCountry({ country: destSite?.country, currency: poCurrency }),
            country_code: destSite?.country || getEffectiveCountry({ country: destSite?.country, currency: poCurrency }),
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
}

export async function resolvePOVendor({
    isManualVendor,
    manualVendorName,
    newPOSupplier,
    allSuppliers,
    activeCountry
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
            status: 'Active',
            rating: 3,
            location: 'Manual Entry',
            leadTime: 0,
            taxId: '',
            nationalId: '',
            countryCode: activeCountry
        });
        return { vendorId: newSupplier.id, vendorName };
    }

    if (newPOSupplier) {
        const s = allSuppliers.find(sup => sup.id === newPOSupplier);
        return { vendorId: newPOSupplier, vendorName: s?.name || 'Unknown' };
    }

    return { vendorId: crypto.randomUUID(), vendorName: 'Unspecified' };
}
