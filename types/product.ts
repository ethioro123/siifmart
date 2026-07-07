
export type ShelfPosition = 'Eye Level' | 'Top Shelf' | 'Bottom Shelf' | 'End Cap' | 'Checkout' | 'Back Aisle' | 'Secure';

export type ProductApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Product {
  id: string;
  productId?: string; // Compatibility alias
  siteId: string; // Multi-site support
  site_id?: string; // Supabase compatibility
  name: string;
  category: string;
  price: number; // Retail Price
  retailPrice?: number; // Alias for price (common in integrations)
  costPrice?: number; // COGS
  salePrice?: number; // Discounted Price
  isOnSale?: boolean;
  stock: number;
  sku: string; // Internal SKU (generated or manual)
  barcode?: string; // Legacy: Primary External Barcode
  barcodes?: string[]; // [NEW] Multi-Barcode Support (Aliases)
  barcodeType?: 'EAN-13' | 'UPC-A' | 'CODE128' | 'CODE39' | 'QR' | 'OTHER'; // Type of barcode
  barcode_type?: string; // Supabase compatibility
  image: string;
  status: 'active' | 'low_stock' | 'out_of_stock' | 'archived';
  location?: string;
  minStock?: number;
  maxStock?: number;
  zoneId?: string; // Hardened: Link to WarehouseZone
  zone_id?: string; // Supabase compatibility
  expiryDate?: string;
  batchNumber?: string;
  shelfPosition?: ShelfPosition | string;
  competitorPrice?: number;
  salesVelocity?: 'High' | 'Medium' | 'Low';
  posReceivedAt?: string; // Timestamp when product was received/scanned at POS
  pos_received_at?: string; // Supabase compatibility
  posReceivedBy?: string; // Who received the product at POS
  pos_received_by?: string; // Supabase compatibility

  // Approval workflow fields
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'archived';
  approval_status?: string; // Supabase compatibility
  createdBy?: string;
  created_by?: string; // Supabase compatibility
  createdAt?: string;
  created_at?: string; // Supabase compatibility
  approvedBy?: string;
  approved_by?: string; // Supabase compatibility
  approvedAt?: string;
  approved_at?: string; // Supabase compatibility
  rejectedBy?: string;
  rejected_by?: string; // Supabase compatibility
  rejectedAt?: string;
  rejected_at?: string; // Supabase compatibility
  rejectionReason?: string;
  rejection_reason?: string; // Supabase compatibility

  // Price Change Tracking
  priceUpdatedAt?: string;
  price_updated_at?: string; // Supabase compatibility
  oldPrice?: number;
  old_price?: number; // Supabase compatibility

  // Extended fields for PO consistency
  brand?: string;
  size?: string;
  unit?: string;
  packQuantity?: number;
  customAttributes?: any;    // Full 6-layer PO attribute model
  description?: string;      // PO attribute description summary
  needsReview?: boolean;
  receivingNotes?: string;
  pack_quantity?: number; // Supabase compatibility
  custom_attributes?: any; // Supabase compatibility
  preferredSupplierId?: string;
}

export interface BarcodeApproval {
  id: string;
  productId: string;
  product_id?: string;
  barcode: string;
  imageUrl?: string;
  image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  siteId: string;
  site_id?: string;
  createdBy: string;
  created_by?: string;
  createdAt: string;
  created_at?: string;
  reviewedBy?: string;
  reviewed_by?: string;
  reviewedAt?: string;
  reviewed_at?: string;
  rejectionReason?: string;
  rejection_reason?: string;
  resolutionTime?: number; // seconds
  resolution_time?: number; // Supabase compatibility
  product?: Partial<Product>;
}

export type InventoryChangeType = 'create' | 'edit' | 'delete' | 'stock_adjustment';

export interface PendingInventoryChange {
  id: string;
  productId: string;
  product_id?: string; // Supabase compatibility
  productName: string;
  product_name?: string; // Supabase compatibility
  productSku: string;
  product_sku?: string; // Supabase compatibility
  siteId: string;
  site_id?: string; // Supabase compatibility
  changeType: InventoryChangeType;
  change_type?: InventoryChangeType; // Supabase compatibility
  requestedBy: string;
  requested_by?: string; // Supabase compatibility
  requestedAt: string;
  requested_at?: string; // Supabase compatibility
  status: 'pending' | 'approved' | 'rejected';
  proposedChanges?: Partial<Product>;
  proposed_changes?: Partial<Product>; // Supabase compatibility
  adjustmentType?: 'IN' | 'OUT';
  adjustment_type?: 'IN' | 'OUT'; // Supabase compatibility
  adjustmentQty?: number;
  adjustment_qty?: number; // Supabase compatibility
  adjustmentReason?: string;
  adjustment_reason?: string; // Supabase compatibility
  approvedBy?: string;
  approved_by?: string; // Supabase compatibility
  approvedAt?: string;
  approved_at?: string; // Supabase compatibility
  rejectionReason?: string;
  rejection_reason?: string; // Supabase compatibility
  rejectedBy?: string;
  rejected_by?: string; // Supabase compatibility
  rejectedAt?: string;
  rejected_at?: string; // Supabase compatibility
  approvalRole?: 'warehouse_manager' | 'procurement_manager'; // Role required to approve
  approval_role?: 'warehouse_manager' | 'procurement_manager'; // Supabase compatibility
  createdAt?: string;
  created_at?: string; // Supabase compatibility
}

export interface PricingRule {
  id: string;
  name: string;
  targetCategory: string;
  condition: 'Stock > X' | 'Expiry < X Days' | 'Sales < X';
  threshold: number;
  action: 'Decrease Price %' | 'Increase Price %' | 'Set to Cost + Margin';
  value: number;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  status: 'Active' | 'Expired' | 'Scheduled';
  usageCount: number;
  expiryDate: string;
}

export interface DiscountCode {
  id: string;
  code: string; // The actual code customers receive (e.g., "SAVE10", "VIP2024")
  name: string; // Friendly name for display
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minPurchaseAmount?: number; // Minimum cart subtotal to apply
  maxDiscountAmount?: number; // Cap on discount for percentage types
  validFrom: string;
  validUntil: string;
  usageLimit?: number; // Max times this code can be used (undefined = unlimited)
  usageCount: number;
  perCustomerLimit?: number; // Max times per customer
  status: 'Active' | 'Expired' | 'Disabled' | 'Scheduled';
  applicableSites?: string[]; // Site IDs where valid (undefined = all sites)
  createdBy: string;
  createdAt: string;
  description?: string;
}

export interface WarehouseZone {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  allowPicking?: boolean;
  allow_picking?: boolean;
  allowPutaway?: boolean;
  allow_putaway?: boolean;
  siteId: string; // Hardened: Zone must belong to a site
  site_id?: string; // Supabase compatibility
  temperature?: string;
  type: 'Dry' | 'Cold' | 'Secure' | 'Bulk' | 'Forward' | 'Staging' | 'Damaged';
  pickingPriority: number; // Lower = Higher Priority
  zoneType: string; // Advanced type override
  status?: 'Active' | 'Maintenance';
  isLocked?: boolean | null;
  is_locked?: boolean | null;
  lockReason?: string | null;
  lock_reason?: string | null;
  lockedAt?: string | null;
  locked_at?: string | null;
  lockedBy?: string | null;
  locked_by?: string | null;
}

export interface StockMovement {
  id: string;
  siteId: string;
  site_id?: string; // Supabase compatibility
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  date: string;
  performedBy: string;
  user?: string; // Compatibility alias for history
  reason: string;
  batchNumber?: string;
}

export type BoxSize = 'Small (10x10x10)' | 'Medium (20x20x20)' | 'Large (50x50x50)' | 'Pallet';

export type SupplierType = 'Business' | 'Farmer' | 'Individual' | 'One-Time';

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  contact: string;
  email?: string;
  phone?: string;
  category: string;
  status: 'Active' | 'Inactive';
  rating: number;
  leadTime: number;
  paymentTerms?: string;
  taxId?: string;      // For Business
  nationalId?: string; // For Farmer/Individual
  location?: string;   // Farm Location / Address
}

export type PurchaseOrderItem = POItem; // Alias for clarity

export interface POItem {
  id?: string | number; // PO Item ID
  productId?: string; // Optional - null for manual/ad-hoc items
  productName: string;
  quantity: number;
  unitCost: number;
  retailPrice?: number; // Retail price to be set for the product
  totalCost: number;
  image?: string; // Product image (base64 or URL)
  brand?: string;
  size?: string;
  unit?: string;
  packQuantity?: number; // Added for PO consistency
  category?: string;
  description?: string;
  minStock?: number;
  maxStock?: number;
  sku?: string; // Missing but used in DataContext
  receivedQty?: number;
  rejectedQty?: number;
  identityType?: 'known' | 'variant' | 'new'; // Product identity declaration for receiving
  expiryDate?: string;
  batchNumber?: string;
  customAttributes?: {
    identity?: { variant?: string; type?: string; subcategory?: string };
    physical?: { netWeight?: string; grossWeight?: string; volume?: string; unit?: string; sizeType?: string; dims?: string; color?: string; form?: string; texture?: string };
    packaging?: { unitSize?: string; packQty?: string; caseSize?: string; packagingLevel?: string; material?: string; isBreakable?: boolean; packageType?: string };
    storage?: { type?: string; isPerishable?: boolean; stackLimit?: string; isHazardous?: boolean; isFragile?: boolean; isLightSensitive?: boolean };
    commercial?: { isWeighted?: boolean; sellBy?: string; priceType?: string; isBundleEligible?: boolean; isReturnable?: boolean };
    descriptive?: { usage?: string; audience?: string; ingredients?: string; keyFeatures?: string; scent?: string; flavor?: string; strength?: string };
  };
  po_id?: string;
  product_id?: string;
  quantity_received?: number;
}

export interface PurchaseOrder {
  id: string;
  po_number?: string; // Sequential identifier (AAAA0000 format)
  poNumber?: string; // Camel case alias
  siteId: string;
  site_id?: string; // Supabase compatibility
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Received' | 'Partially Received' | 'Ordered' | 'Cancelled' | 'Rejected';
  totalAmount: number;
  itemsCount: number;
  expectedDelivery: string | null;
  requestedBy?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  lineItems: PurchaseOrderItem[];
  shippingCost?: number;
  taxAmount?: number;
  notes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  paymentTerms?: 'Net 30' | 'Net 60' | 'Immediate' | 'Cash on Delivery' | string;
  incoterms?: 'EXW' | 'FOB' | 'CIF' | 'DDP' | string;
  destination?: string;
  discount?: number;
  tempReq?: 'Ambient' | 'Chilled' | 'Frozen';
  shelfLife?: string;
  dockSlot?: string;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  createdAt?: string;
  created_at?: string; // Supabase compatibility
  updatedAt?: string;
  updated_at?: string; // Supabase compatibility
  isRequest?: boolean; // Distinguishes between PO and PR
}

export interface ReceivingItem {
  id?: string | number;
  productId?: string;
  productName?: string;
  quantity?: number; // Accepted quantity (optional to match Fulfillment)
  receivedQty?: number;
  expectedQty?: number;
  rejectedQty?: number;
  expiryDate?: string;
  batchNumber?: string;
  vendorLotNumber?: string; // External Supplier Lot
  temperature?: string;
  damageNote?: string;
  condition?: 'Good' | 'Damaged' | 'Short';
  verifiedCount?: number; // Scanned quantity
  manualCount?: number;   // Typed quantity
  barcode?: string;       // Barcode used for verification
}

export interface POReceivingInput {
  index: number;
  received: number;
}
