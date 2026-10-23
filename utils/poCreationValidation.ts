interface POCreationInput {
    isEditMode: boolean; canCreate: boolean; hasUnsavedItem: boolean; itemCount: number;
    destinations: readonly string[]; receivingSites: readonly { id: string }[];
    fromRequest: boolean; manualVendor: boolean; vendorName: string; supplierId: string;
}
export function getPOCreationIssue(input: POCreationInput): { message: string; selector: string } | null {
    if (!input.isEditMode && !input.canCreate) return { message: 'Your role is not authorized to create purchase orders.', selector: '#po-validation-summary' };
    if (input.hasUnsavedItem) return { message: 'Add the unfinished item to the order or clear it before submitting.', selector: '#po-item-form-container' };
    if (!input.itemCount) return { message: 'Please add items to the order.', selector: '#po-item-form-container' };
    if (!input.destinations.length) return { message: 'Select a receiving Warehouse or Distribution Center.', selector: '#po-receiving' };
    if (input.fromRequest && input.destinations.length !== 1) return { message: 'A purchase request can create a PO for one destination only.', selector: '#po-receiving' };
    if (input.destinations.some(id => !input.receivingSites.some(site => site.id === id))) return { message: 'Choose an active receiving facility within your assigned scope.', selector: '#po-receiving' };
    if (!input.manualVendor && !input.supplierId) return { message: 'Please select a supplier.', selector: '#po-supplier' };
    if (input.manualVendor && !input.vendorName.trim()) return { message: 'Please enter the supplier name.', selector: '#po-vendor-name' };
    return null;
}

export function validatePOCreation(input: POCreationInput): string | null {
    return getPOCreationIssue(input)?.message ?? null;
}
