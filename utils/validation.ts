
/**
 * Input Validation & Sanitization Utilities
 * Provides comprehensive validation for all business entities
 */

import { Product, Customer, Employee, Supplier, PurchaseOrder, SaleRecord, CartItem } from '../types';

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

export interface ValidationResult<T = any> {
    isValid: boolean;
    data?: T;
    errors: string[];
}

// ============================================================================
// SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize string input - remove dangerous characters
 */
export function sanitizeString(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and > to prevent XSS
        .replace(/[^\w\s\-.,@#$%&()]/g, ''); // Allow only safe characters
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(input: any): number | null {
    const num = parseFloat(input);
    return isNaN(num) ? null : num;
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

// ============================================================================
// PRODUCT VALIDATION
// ============================================================================

export function validateProduct(product: Partial<Product>): ValidationResult<Product> {
    const errors: string[] = [];

    // Required fields
    if (!product.name || product.name.trim().length === 0) {
        errors.push('Product name is required');
    } else if (product.name.length > 200) {
        errors.push('Product name must be less than 200 characters');
    }

    if (!product.sku || product.sku.trim().length === 0) {
        errors.push('SKU is required');
    } else if (!/^[A-Z0-9\-]+$/.test(product.sku)) {
        errors.push('SKU must contain only uppercase letters, numbers, and hyphens');
    }

    if (!product.category || product.category.trim().length === 0) {
        errors.push('Category is required');
    }

    // Price validation
    if (product.price === undefined || product.price === null) {
        errors.push('Price is required');
    } else if (product.price < 0) {
        errors.push('Price must be positive');
    } else if (product.price > 1000000) {
        errors.push('Price seems unreasonably high');
    }

    // Cost price validation
    if (product.costPrice !== undefined && product.costPrice !== null) {
        if (product.costPrice < 0) {
            errors.push('Cost price must be positive');
        }
        if (product.price && product.costPrice > product.price) {
            errors.push('Cost price should not exceed selling price');
        }
    }

    // Stock validation
    if (product.stock === undefined || product.stock === null) {
        errors.push('Stock quantity is required');
    } else if (product.stock < 0) {
        errors.push('Stock cannot be negative');
    } else if (!Number.isInteger(product.stock)) {
        errors.push('Stock must be a whole number');
    }

    // Expiry date validation
    if (product.expiryDate) {
        const expiryDate = new Date(product.expiryDate);
        if (isNaN(expiryDate.getTime())) {
            errors.push('Invalid expiry date format');
        } else if (expiryDate < new Date()) {
            errors.push('Expiry date cannot be in the past');
        }
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? (product as Product) : undefined,
        errors
    };
}

// ============================================================================
// CUSTOMER VALIDATION
// ============================================================================

export function validateCustomer(customer: Partial<Customer>): ValidationResult<Customer> {
    const errors: string[] = [];

    // Name validation
    if (!customer.name || customer.name.trim().length === 0) {
        errors.push('Customer name is required');
    } else if (customer.name.length > 100) {
        errors.push('Name must be less than 100 characters');
    }

    // Phone validation
    if (!customer.phone || customer.phone.trim().length === 0) {
        errors.push('Phone number is required');
    } else if (!/^\+?[\d\s\-()]{8,20}$/.test(customer.phone)) {
        errors.push('Invalid phone number format');
    }

    // Email validation
    if (customer.email && customer.email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customer.email)) {
            errors.push('Invalid email format');
        }
    }

    // Loyalty points validation
    if (customer.loyaltyPoints !== undefined && customer.loyaltyPoints < 0) {
        errors.push('Loyalty points cannot be negative');
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? (customer as Customer) : undefined,
        errors
    };
}

// ============================================================================
// EMPLOYEE VALIDATION
// ============================================================================

export function validateEmployee(employee: Partial<Employee>): ValidationResult<Employee> {
    const errors: string[] = [];

    // Name validation
    if (!employee.name || employee.name.trim().length === 0) {
        errors.push('Employee name is required');
    }

    // Email validation
    if (!employee.email || employee.email.trim().length === 0) {
        errors.push('Email is required');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(employee.email)) {
            errors.push('Invalid email format');
        }
    }

    // Phone validation
    if (!employee.phone || employee.phone.trim().length === 0) {
        errors.push('Phone number is required');
    }

    // Role validation
    const validRoles = ['super_admin', 'admin', 'manager', 'wms', 'pos', 'picker', 'hr', 'auditor', 'driver'];
    if (!employee.role || !validRoles.includes(employee.role)) {
        errors.push('Invalid role');
    }

    // Salary validation
    if (employee.salary !== undefined && employee.salary !== null) {
        if (employee.salary < 0) {
            errors.push('Salary cannot be negative');
        } else if (employee.salary > 1000000) {
            errors.push('Salary seems unreasonably high');
        }
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? (employee as Employee) : undefined,
        errors
    };
}

// ============================================================================
// SUPPLIER VALIDATION
// ============================================================================

export function validateSupplier(supplier: Partial<Supplier>): ValidationResult<Supplier> {
    const errors: string[] = [];

    // Name validation
    if (!supplier.name || supplier.name.trim().length === 0) {
        errors.push('Supplier name is required');
    }

    // Contact validation
    if (!supplier.contact || supplier.contact.trim().length === 0) {
        errors.push('Contact information is required');
    }

    // Type validation
    const validTypes = ['Business', 'Farmer', 'Individual', 'One-Time'];
    if (!supplier.type || !validTypes.includes(supplier.type)) {
        errors.push('Invalid supplier type');
    }

    // Email validation (if provided)
    if (supplier.email && supplier.email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(supplier.email)) {
            errors.push('Invalid email format');
        }
    }

    // Rating validation
    if (supplier.rating !== undefined && (supplier.rating < 0 || supplier.rating > 5)) {
        errors.push('Rating must be between 0 and 5');
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? (supplier as Supplier) : undefined,
        errors
    };
}

// ============================================================================
// PURCHASE ORDER VALIDATION
// ============================================================================

export function validatePurchaseOrder(po: Partial<PurchaseOrder>): ValidationResult<PurchaseOrder> {
    const errors: string[] = [];

    // Supplier validation
    if (!po.supplierId || !po.supplierName) {
        errors.push('Supplier information is required');
    }

    // Items validation
    if (!po.lineItems || po.lineItems.length === 0) {
        errors.push('Purchase order must have at least one item');
    }

    // Amount validation
    if (po.totalAmount === undefined || po.totalAmount <= 0) {
        errors.push('Total amount must be positive');
    }

    // Expected delivery validation
    if (po.expectedDelivery) {
        const deliveryDate = new Date(po.expectedDelivery);
        if (isNaN(deliveryDate.getTime())) {
            errors.push('Invalid delivery date format');
        } else if (deliveryDate < new Date()) {
            errors.push('Expected delivery date cannot be in the past');
        }
    }

    return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? (po as PurchaseOrder) : undefined,
        errors
    };
}

// ============================================================================
// SALE VALIDATION
// ============================================================================

export function validateSale(cart: CartItem[], method: string, tendered: number): ValidationResult {
    const errors: string[] = [];

    // Cart validation
    if (!cart || cart.length === 0) {
        errors.push('Cart cannot be empty');
    }

    // Cart items validation
    for (const item of cart) {
        if (item.quantity <= 0) {
            errors.push(`Invalid quantity for ${item.name}`);
        }
        if (item.price < 0) {
            errors.push(`Invalid price for ${item.name}`);
        }
        if (item.stock < item.quantity) {
            errors.push(`Insufficient stock for ${item.name}`);
        }
    }

    // Payment method validation
    const validMethods = ['Cash', 'Card', 'Mobile Money'];
    if (!validMethods.includes(method)) {
        errors.push('Invalid payment method');
    }

    // Cash payment validation
    if (method === 'Cash') {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (tendered < total) {
            errors.push('Tendered amount is less than total');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================================
// BUSINESS RULE VALIDATORS
// ============================================================================

/**
 * Check if product can be deleted (no pending orders, etc.)
 */
export function canDeleteProduct(productId: string, orders: PurchaseOrder[], sales: SaleRecord[]): ValidationResult {
    const errors: string[] = [];

    // Check for pending purchase orders
    const pendingOrders = orders.filter(o =>
        o.status === 'Pending' &&
        o.lineItems?.some(item => item.productId === productId)
    );

    if (pendingOrders.length > 0) {
        errors.push(`Cannot delete product with ${pendingOrders.length} pending purchase order(s)`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Check if employee can be deleted
 */
export function canDeleteEmployee(employeeId: string, employees: Employee[]): ValidationResult {
    const errors: string[] = [];

    // Prevent deleting the last admin
    const admins = employees.filter(e => e.role === 'super_admin' || e.role === 'admin');
    const employee = employees.find(e => e.id === employeeId);

    if (employee && (employee.role === 'super_admin' || employee.role === 'admin') && admins.length <= 1) {
        errors.push('Cannot delete the last administrator');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate stock adjustment
 */
export function validateStockAdjustment(
    productId: string,
    quantity: number,
    type: 'IN' | 'OUT',
    products: Product[]
): ValidationResult {
    const errors: string[] = [];

    const product = products.find(p => p.id === productId);
    if (!product) {
        errors.push('Product not found');
        return { isValid: false, errors };
    }

    if (quantity <= 0) {
        errors.push('Quantity must be positive');
    }

    if (type === 'OUT' && product.stock < quantity) {
        errors.push(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Check for duplicate SKU
 */
export function isDuplicateSKU(sku: string, products: Product[], excludeId?: string): boolean {
    return products.some(p => p.sku === sku && p.id !== excludeId);
}

/**
 * Check for duplicate email
 */
export function isDuplicateEmail(email: string, employees: Employee[], excludeId?: string): boolean {
    return employees.some(e => e.email.toLowerCase() === email.toLowerCase() && e.id !== excludeId);
}

/**
 * Check for duplicate customer phone
 */
export function isDuplicatePhone(phone: string, customers: Customer[], excludeId?: string): boolean {
    return customers.some(c => c.phone === phone && c.id !== excludeId);
}
