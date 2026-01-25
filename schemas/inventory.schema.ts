import { z } from 'zod';

// --- Shared Utility Schemas ---
export const optionalString = z.string().optional().nullable();
export const optionalNumber = z.number().optional().nullable();

export const ProductSchema = z.object({
    id: z.string().optional(),
    siteId: z.string().uuid(),
    name: z.string().min(1, 'Name is required'),
    sku: z.string().min(2, 'SKU is required'),
    barcode: optionalString,
    barcodes: z.array(z.string()).optional(),
    barcodeType: z.enum(['EAN-13', 'UPC-A', 'CODE128', 'CODE39', 'QR', 'OTHER']).optional(),
    category: z.string().min(1, 'Category is required'),
    price: z.number().positive('Price must be greater than zero'),
    costPrice: optionalNumber,
    stock: z.number().default(0),
    location: optionalString,
    expiryDate: optionalString,
    status: z.enum(['active', 'archived', 'out_of_stock', 'discontinued']).default('active'),
    image: optionalString,
    brand: optionalString,
    size: optionalString,
    unit: z.string().default('piece'),
    packQuantity: optionalNumber,
    approvalStatus: z.enum(['pending', 'approved', 'rejected', 'archived']).optional(),
    createdBy: optionalString,
    createdAt: optionalString,
    approvedBy: optionalString,
    approvedAt: optionalString,
}).passthrough();

export const BarcodeApprovalSchema = z.object({
    id: z.string().uuid(),
    product_id: z.string().uuid(),
    barcode: z.string().min(1),
    image_url: optionalString,
    status: z.enum(['pending', 'approved', 'rejected', 'logged']).default('pending'),
    site_id: z.string().uuid().optional(),
    created_by: optionalString,
    created_at: optionalString,
    reviewed_by: optionalString,
    reviewed_at: optionalString,
    rejection_reason: optionalString,
}).passthrough();

export type ProductInput = z.infer<typeof ProductSchema>;
export type BarcodeApprovalInput = z.infer<typeof BarcodeApprovalSchema>;
