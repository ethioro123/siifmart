interface POCreationInput {
    isEditMode: boolean; canCreate: boolean; hasUnsavedItem: boolean; itemCount: number;
    destinations: readonly string[]; receivingSites: readonly { id: string }[];
    fromRequest: boolean; manualVendor: boolean; vendorName: string; supplierId: string;
}
export function validatePOCreation(input: POCreationInput): string | null {
    if (!input.isEditMode && !input.canCreate) return 'Your role is not authorized to create purchase orders.';
    if (input.hasUnsavedItem) return 'Add the unfinished item to the order or clear it before submitting.';
    if (!input.itemCount) return 'Please add items to the order.';
    if (!input.destinations.length) return 'Select a receiving Warehouse or Distribution Center.';
    if (input.fromRequest && input.destinations.length !== 1) return 'A purchase request can create a PO for one destination only.';
    if (input.destinations.some(id => !input.receivingSites.some(site => site.id === id))) return 'Choose an active receiving facility within your assigned scope.';
    if (!input.manualVendor && !input.supplierId) return 'Please select a supplier.';
    if (input.manualVendor && !input.vendorName.trim()) return 'Please enter the supplier name.';
    return null;
}
