import React from 'react';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'warehouse_manager' | 'dispatcher' | 'pos' | 'picker' | 'hr' | 'auditor' | 'driver' | 'finance_manager' | 'procurement_manager' | 'store_supervisor' | 'inventory_specialist' | 'cs_manager' | 'it_support';
export type ThemeMode = 'dark' | 'light';
export type PaymentMethod = 'Cash' | 'Card' | 'Mobile Money';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  title: string;
  siteId?: string;
}

export interface Notification {
  id: string;
  type: 'alert' | 'success' | 'info' | 'warning';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  module: 'Settings' | 'HR' | 'Sites' | 'Security' | 'Finance' | 'Inventory';
  ip?: string;
}

export type SiteType = 'Administration' | 'Warehouse' | 'Store' | 'Distribution Center' | 'Dark Store';

export interface Site {
  id: string;
  code: string; // Simplified Display ID (e.g., "001", "ADM")
  name: string;
  type: SiteType;
  address: string;
  status: 'Active' | 'Maintenance' | 'Closed';
  manager?: string;
  capacity?: number; // For Warehouses (%)
  terminalCount?: number; // For Stores
  language?: 'en' | 'am' | 'or'; // Site-specific language preference
  latitude?: number; // For map visualization
  longitude?: number; // For map visualization
}

export interface SystemConfig {
  storeName: string;
  currency: string;
  taxRate: number;
  fefoRotation: boolean;
  binScan: boolean;
  lowStockThreshold: number;
  enableLoyalty: boolean;
  enableWMS: boolean;
  multiCurrency: boolean;
  requireShiftClosure: boolean;
  // POS Settings
  posReceiptHeader: string;
  posReceiptFooter: string;
  posTerminalId: string;
  // Finance Settings
  fiscalYearStart: string;
  accountingMethod: 'Cash' | 'Accrual';
  // Localization
  language?: string;
  timezone?: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  numberFormat?: '1,000.00' | '1.000,00';
  // Additional Settings
  logoUrl?: string;
  taxVatNumber?: string;
  supportContact?: string;
  reserveStockBuffer?: number;
  webhookOrderCreated?: string;
  webhookInventoryLow?: string;
  webhookCustomerSignup?: string;
  scaleIpAddress?: string;
  scannerComPort?: string;
}

export interface StoreContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  loading: boolean;
}

export type ShelfPosition = 'Eye Level' | 'Top Shelf' | 'Bottom Shelf' | 'End Cap' | 'Checkout' | 'Back Aisle' | 'Secure';

export interface Product {
  id: string;
  siteId: string; // Multi-site support
  site_id?: string; // Supabase compatibility
  name: string;
  category: string;
  price: number; // Retail Price
  costPrice?: number; // COGS
  salePrice?: number; // Discounted Price
  isOnSale?: boolean;
  stock: number;
  sku: string; // Internal SKU (generated or manual)
  barcode?: string; // External barcode (EAN-13, UPC, supplier barcode)
  barcodeType?: 'EAN-13' | 'UPC-A' | 'CODE128' | 'CODE39' | 'QR' | 'OTHER'; // Type of barcode
  image: string;
  status: 'active' | 'low_stock' | 'out_of_stock';
  location?: string;
  zoneId?: string; // Hardened: Link to WarehouseZone
  zone_id?: string; // Supabase compatibility
  expiryDate?: string;
  batchNumber?: string;
  shelfPosition?: ShelfPosition;
  competitorPrice?: number;
  salesVelocity?: 'High' | 'Medium' | 'Low';
  posReceivedAt?: string; // Timestamp when product was received/scanned at POS
  pos_received_at?: string; // Supabase compatibility
  posReceivedBy?: string; // Who received the product at POS
  pos_received_by?: string; // Supabase compatibility
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

export interface WarehouseZone {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  siteId: string; // Hardened: Zone must belong to a site
  site_id?: string; // Supabase compatibility
  temperature?: string;
  type: 'Dry' | 'Cold' | 'Secure';
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
  reason: string;
  batchNumber?: string;
}

export interface JobItem {
  productId: string;
  name: string;
  sku: string;
  image: string;
  expectedQty: number;
  pickedQty: number;
  status: 'Pending' | 'Picked' | 'Short' | 'Skipped';
  batchNumber?: string;
  expiryDate?: string;
}

export interface WMSJob {
  id: string;
  siteId: string;
  site_id?: string; // Supabase compatibility - Warehouse/Site where job is fulfilled
  type: 'PICK' | 'PACK' | 'PUTAWAY' | 'TRANSFER' | 'DISPATCH';
  priority: 'Critical' | 'High' | 'Normal';
  status: 'Pending' | 'In-Progress' | 'Completed';
  items: number;
  lineItems: JobItem[];
  assignedTo?: string;
  location: string;
  orderRef: string;
  sourceSiteId?: string; // Store/Site where order was placed / items shipped FROM
  source_site_id?: string; // Supabase compatibility
  destSiteId?: string; // Store/Site where goods are going / items shipped TO
  dest_site_id?: string; // Supabase compatibility
  jobNumber?: string; // Friendly ID (e.g., JOB-0001)
  // Transfer-specific fields
  transferStatus?: 'Requested' | 'Approved' | 'Picking' | 'Picked' | 'Packed' | 'In-Transit' | 'Delivered' | 'Received';
  requestedBy?: string; // Who requested the transfer
  approvedBy?: string; // Who approved the transfer
  shippedAt?: string; // When items were shipped
  receivedAt?: string; // When items were received at destination
  trackingNumber?: string; // Optional tracking/reference number
}

export type JobAssignmentStatus = 'Assigned' | 'Accepted' | 'In-Progress' | 'Paused' | 'Completed' | 'Cancelled';

export interface JobAssignment {
  id: string;
  jobId: string;
  job_id?: string; // Supabase compatibility
  employeeId: string;
  employee_id?: string; // Supabase compatibility
  employeeName: string;
  employee_name?: string; // Supabase compatibility
  assignedAt: string;
  assigned_at?: string; // Supabase compatibility
  startedAt?: string;
  started_at?: string; // Supabase compatibility
  completedAt?: string;
  completed_at?: string; // Supabase compatibility
  status: JobAssignmentStatus;
  notes?: string;
  // Performance metrics
  estimatedDuration?: number; // minutes
  estimated_duration?: number; // Supabase compatibility
  actualDuration?: number; // minutes
  actual_duration?: number; // Supabase compatibility
  unitsProcessed?: number;
  units_processed?: number; // Supabase compatibility
  accuracyRate?: number; // percentage
  accuracy_rate?: number; // Supabase compatibility
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
  taxId?: string;      // For Business
  nationalId?: string; // For Farmer/Individual
  location?: string;   // Farm Location / Address
}

export interface POItem {
  id?: string | number; // PO Item ID
  productId?: string; // Optional - null for manual/ad-hoc items
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  po_number?: string; // Simple sequential number (PO-0001, PO-0002)
  poNumber?: string; // Camel case alias
  siteId: string;
  site_id?: string; // Supabase compatibility
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Received' | 'Cancelled';
  totalAmount: number;
  itemsCount: number;
  expectedDelivery: string;
  lineItems?: POItem[];
  shippingCost?: number;
  taxAmount?: number;
  notes?: string;
  // Approval Workflow
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  // New Enterprise Fields
  paymentTerms?: 'Net 30' | 'Net 60' | 'Immediate' | 'Cash on Delivery' | string;
  incoterms?: 'EXW' | 'FOB' | 'CIF' | 'DDP' | string;
  destination?: string;
  discount?: number;
  // Logistics
  tempReq?: 'Ambient' | 'Chilled' | 'Frozen';
  shelfLife?: string;
  dockSlot?: string;
}

export interface ReceivingItem {
  id?: string | number; // Support matching by PO Item ID
  productId: string;
  quantity: number; // Accepted
  rejectedQty: number;
  expiryDate: string;
  batchNumber: string;
  vendorLotNumber?: string; // External Supplier Lot
  temperature?: string;
  damageNote?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastVisit: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  notes?: string;
}

export interface EmployeeTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // Employee ID
  status: 'Pending' | 'In-Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
}

export interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent' | 'Leave';
  hoursWorked: number;
}

export interface Employee {
  id: string;
  code: string; // Simplified Display ID
  siteId: string;
  site_id?: string; // Supabase compatibility
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated' | 'Pending Approval';
  joinDate: string;
  department: string;
  avatar: string;
  performanceScore: number;
  specialization?: string;
  salary?: number;
  badges?: string[];
  attendanceRate?: number;
  address?: string;
  emergencyContact?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleRecord {
  id: string;
  siteId: string;
  site_id?: string; // Supabase compatibility
  date: string;
  subtotal: number;
  tax: number;
  total: number;
  method: PaymentMethod;
  status: 'Completed' | 'Pending' | 'Refunded' | 'Partially Refunded';
  items: CartItem[];
  amountTendered?: number;
  change?: number;
  cashierName?: string;
  type?: 'In-Store' | 'Delivery' | 'Pickup';
  customerId?: string;
  customer_id?: string; // Supabase compatibility
  fulfillmentStatus?: 'Pending' | 'Picking' | 'Packing' | 'Shipped' | 'Delivered';
  receiptNumber?: string; // Friendly ID (e.g., REC-0001)
}

export type ReturnReason = 'Defective' | 'Expired' | 'Customer Changed Mind' | 'Wrong Item';
export type ReturnCondition = 'Resalable' | 'Damaged';

export interface ReturnItem {
  productId: string;
  quantity: number;
  reason: ReturnReason;
  condition: ReturnCondition;
  refundAmount: number;
}

export interface ReturnRequest {
  id: string;
  originalSaleId: string;
  date: string;
  items: ReturnItem[];
  totalRefund: number;
  processedBy: string;
  queryId?: string; // Helper for search
}

export interface ShiftRecord {
  id: string;
  siteId: string;
  site_id?: string; // Supabase compatibility
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  cashSales: number;
  expectedCash?: number;
  actualCash?: number;
  variance?: number;
  notes?: string;
  status: 'Open' | 'Closed';
}

export interface ExpenseRecord {
  id: string;
  siteId: string;
  site_id?: string; // Supabase compatibility
  date: string;
  category: 'Rent' | 'Utilities' | 'Marketing' | 'Maintenance' | 'Software' | 'Salaries' | 'Other';
  description: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  approvedBy: string;
}

export interface HeldOrder {
  id: string;
  siteId: string;
  time: string;
  items: CartItem[];
  note: string;
  customerName?: string;
}

export interface StatMetric {
  label: string;
  value: string | number;
  trend: number;
  icon: React.ElementType;
}

export interface TransferItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}

export type TransferStatus = 'Requested' | 'In-Transit' | 'Completed' | 'Rejected';

export interface TransferRecord {
  id: string;
  sourceSiteId: string;
  sourceSiteName: string;
  destSiteId: string;
  destSiteName: string;
  status: TransferStatus;
  date: string;
  items: TransferItem[];
  notes?: string;
}

export enum NavSection {
  DASHBOARD = 'dashboard',
  POS = 'pos',
  INVENTORY = 'inventory',
  PROCUREMENT = 'procurement',
  CUSTOMERS = 'customers',
  SETTINGS = 'settings',
  EMPLOYEES = 'employees',
  FINANCE = 'finance'
}