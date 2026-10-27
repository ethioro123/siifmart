import type { PendingInventoryChange, Product } from '../types';

export const PRODUCT_EDIT_APPROVERS = {
    regional_operations_manager: 'Operations',
    regional_supply_chain_manager: 'Supply Chain',
    regional_merchandising_manager: 'Merchandising',
} as const;

export function productEditFields(product: Partial<Product>): Partial<Product> {
    const fields = ['name', 'sku', 'category', 'brand', 'description', 'image', 'size', 'unit',
        'barcode', 'barcodes', 'barcodeType', 'price', 'costPrice', 'salePrice', 'isOnSale',
        'minStock', 'maxStock', 'packQuantity', 'customAttributes', 'shelfPosition'] as const;
    const result = Object.fromEntries(fields.filter(key => product[key] !== undefined).map(key => [key, product[key]]));
    if (product.packageType !== undefined || product.caseSize !== undefined) {
        result.customAttributes = {
            ...(product.customAttributes || {}),
            ...(product.packageType !== undefined ? { package_type: product.packageType, packageType: product.packageType } : {}),
            ...(product.caseSize !== undefined ? { case_size: product.caseSize, caseSize: product.caseSize } : {}),
        };
    }
    return result;
}

export function canVoteProductEdit(request: PendingInventoryChange, role?: string, employeeId?: string): boolean {
    return Boolean(role && role in PRODUCT_EDIT_APPROVERS && employeeId &&
        request.requestedByEmployeeId !== employeeId &&
        !request.productEditApprovals?.some(vote => vote.role === role || vote.employeeId === employeeId));
}
