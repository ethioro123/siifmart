import { BonusTier, POSRoleDistribution, WarehousePointRule, StorePointRule } from './gamification';

export interface Notification {
  id: string;
  type: 'alert' | 'success' | 'info' | 'warning';
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;     // [NEW] Target user ID
  isGlobal?: boolean;  // [NEW] Flag for global administrative alerts
}

export interface SystemLog {
  id: string;
  created_at: string;
  user_name: string;
  action: string;
  details: string;
  module: string;
  ip_address?: string;
}

export type SiteType = 'Administration' | 'Administrative' | 'Central Operations' | 'Warehouse' | 'Store' | 'Distribution Center' | 'Dark Store' | 'Online Store' | 'HQ' | 'Headquarters';

export interface TaxRule {
  name: string;
  rate: number;
  compound: boolean;
}

export interface TaxJurisdiction {
  id: string;
  name: string;
  type: 'National' | 'Region';
  rules: TaxRule[];
}

export type FulfillmentStrategy = 'LOCAL_ONLY' | 'NEAREST' | 'SPLIT' | 'MANUAL';

export interface Site {
  id: string;
  code: string; // Simplified Display ID (e.g., "001", "ADM")
  siteNumber?: number; // Numeric ID for receipt numbering
  site_number?: number; // DB field
  name: string;
  type: SiteType;
  address: string;
  contact?: string;
  status: 'Active' | 'Maintenance' | 'Closed';
  manager?: string;
  capacity?: number; // For Warehouses (%)
  terminalCount?: number; // For Stores
  language?: 'en' | 'am' | 'or'; // Site-specific language preference
  latitude?: number; // For map visualization
  longitude?: number; // For map visualization
  bonusEnabled?: boolean; // Whether this site earns POS team bonuses (default: true)
  warehouseBonusEnabled?: boolean; // Whether this site earns warehouse worker bonuses (default: true)
  zoneCount?: number;
  aisleCount?: number;
  bayCount?: number;
  binCount?: number;
  taxJurisdictionId?: string; // Links this site to a specific tax jurisdiction
  fulfillmentStrategy?: FulfillmentStrategy;
  isFulfillmentNode?: boolean;
  barcodePrefix?: string; // 4-digit unique prefix for location barcodes (e.g. "1001")
  replenishmentSourceId?: string; // ID of the warehouse/DC feeding this store (legacy single-source, kept for compatibility)
  replenishmentSourceIds?: string[]; // IDs of all warehouses/DCs feeding this store (many-to-many)
  logisticsZoneId?: string;
  region?: string; // User-defined logistics zone name (e.g. Harar Zone, Addis Ababa Zone)
}

export interface LogisticsZone {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SystemConfig {
  storeName: string;
  currency: string;
  taxRate: number;
  fefoRotation: boolean;
  bayScan?: boolean;
  binScan?: boolean;
  lowStockThreshold: number;
  enableLoyalty: boolean;
  loyaltyPointsRate?: number; // ETB spent per 1 loyalty point earned (0 or undefined = disabled)
  enableWMS: boolean;
  multiCurrency: boolean;
  requireShiftClosure: boolean;
  taxJurisdictions?: TaxJurisdiction[];
  timezone?: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  numberFormat?: '1,000.00' | '1.000,00';
  language?: string;
  logoUrl?: string;
  slogan?: string;
  brandColor?: string;
  legalBusinessName?: string;
  taxVatNumber?: string;
  registeredAddress?: string;
  supportContact?: string;
  supportPhone?: string;
  exchangeRates?: { code: string; rate: number }[];
  posReceiptHeader?: string;
  posReceiptFooter?: string;
  posTerminalId?: string;
  posRegisterMode?: 'cashier' | 'kiosk';
  posGuestCheckout?: boolean;
  posBlockNegativeStock?: boolean;
  posDigitalReceipts?: boolean;
  posAutoPrint?: boolean;
  posReceiptLogo?: string;
  posReceiptShowLogo?: boolean;
  posReceiptAddress?: string;
  posReceiptPhone?: string;
  posReceiptEmail?: string;
  posReceiptTaxId?: string;
  posReceiptPolicy?: string;
  posReceiptSocialHandle?: string;
  posReceiptEnableQR?: boolean;
  posReceiptQRLink?: string;
  posReceiptWidth?: '80mm' | '58mm';
  posReceiptFont?: 'monospace' | 'sans-serif';
  payment_cash?: boolean;
  payment_card?: boolean;
  payment_mobile_money?: boolean;
  payment_store_credit?: boolean;
  fiscalYearStart?: string;
  accountingMethod?: 'accrual' | 'cash';
  taxInclusive?: boolean;
  defaultVatRate?: number;
  withholdingTax?: number;
  maxPettyCash?: number;
  expenseApprovalLimit?: number;
  defaultCreditLimit?: number;
  receivingLogic?: 'blind' | 'verified';
  qcSamplingRate?: number;
  qcBlockOnFailure?: boolean;
  putawayLogic?: 'manual' | 'system';
  rotationPolicy?: 'fifo' | 'fefo' | 'lifo';
  requireExpiry?: boolean;
  cycleCountStrategy?: 'abc' | 'random';
  pickingMethod?: 'order' | 'wave' | 'zone';
  strictScanning?: boolean;
  reserveStockBuffer?: number;
  webhookOrderCreated?: string;
  webhookInventoryLow?: string;
  webhookCustomerSignup?: string;
  scaleIpAddress?: string;
  scannerComPort?: string;
  defaultPrinter?: string;
  scaleUnit?: 'KG' | 'LBS';
  bonusEnabled?: boolean;
  bonusPayoutFrequency?: 'weekly' | 'biweekly' | 'monthly';
  bonusTiers?: BonusTier[];
  bonusCurrency?: string;
  warehousePointsEligibleRoles?: { role: string; enabled: boolean; label: string }[];
  warehousePointRules?: WarehousePointRule[];
  posBonusEnabled?: boolean;
  posBonusPayoutFrequency?: 'weekly' | 'biweekly' | 'monthly';
  posBonusTiers?: BonusTier[];
  posRoleDistribution?: POSRoleDistribution[];
  posPointRules?: StorePointRule[];
  warehouseBonusEligibility?: Record<string, boolean>;
  posBonusEligibility?: Record<string, boolean>;
  enforceRegionalZoning?: boolean;
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

export interface StatMetric {
  label: string;
  value: string | number;
  trend: number;
  icon: React.ElementType;
}

export interface TransferItem {
  productId: string;
  sku?: string;
  name?: string;
  productName: string;
  quantity: number;
  receivedQty?: number;
  condition?: 'Good' | 'Damaged' | 'Short';
  receivedAt?: string;
}

export type TransferStatus = 'Requested' | 'Approved' | 'Picking' | 'Packed' | 'Shipped' | 'In-Transit' | 'Delivered' | 'Completed' | 'Rejected' | 'Received' | 'Cancelled';

export interface TransferRecord {
  id: string;
  sourceSiteId: string;
  source_site_id?: string; // Supabase compatibility
  sourceSiteName?: string;
  destSiteId: string;
  dest_site_id?: string; // Supabase compatibility
  destSiteName?: string;
  status: TransferStatus;
  transferStatus?: string;
  date?: string;
  requestedAt: string;
  approvedAt?: string;
  shippedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  createdAt?: string;
  requestedBy: string;
  approvedBy?: string;
  items: TransferItem[];
  notes?: string;
  jobNumber?: string;
  orderRef?: string;
  hasDiscrepancy?: boolean;
  discrepancyDetails?: string;
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

export type DiscrepancyType = 'shortage' | 'overage' | 'damaged' | 'wrong_item' | 'missing';
export type ResolutionType = 'accept' | 'investigate' | 'claim' | 'adjust' | 'reject' | 'recount' | 'dispose' | 'replace';
export type ResolutionStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'closed';

export interface DiscrepancyResolution {
  id: string;
  transferId: string;
  transfer_id?: string; // Supabase compatibility
  lineItemIndex: number;
  line_item_index?: number; // Supabase compatibility
  productId: string;
  product_id?: string; // Supabase compatibility
  expectedQty: number;
  expected_qty?: number; // Supabase compatibility
  receivedQty: number;
  received_qty?: number; // Supabase compatibility
  variance: number;
  discrepancyType: DiscrepancyType;
  discrepancy_type?: DiscrepancyType; // Supabase compatibility
  resolveQty?: number;
  resolve_qty?: number; // Supabase compatibility
  resolutionType: ResolutionType;
  resolution_type?: ResolutionType; // Supabase compatibility
  resolutionStatus: ResolutionStatus;
  resolution_status?: ResolutionStatus; // Supabase compatibility
  resolutionNotes?: string;
  resolution_notes?: string; // Supabase compatibility
  reasonCode?: string;
  reason_code?: string; // Supabase compatibility
  estimatedValue?: number;
  estimated_value?: number; // Supabase compatibility
  claimAmount?: number;
  claim_amount?: number; // Supabase compatibility
  photoUrls?: string[];
  photo_urls?: string[]; // Supabase compatibility
  replacementJobId?: string;
  replacement_job_id?: string; // Supabase compatibility
  reportedBy?: string;
  reported_by?: string; // Supabase compatibility
  resolvedBy?: string;
  resolved_by?: string; // Supabase compatibility
  approvedBy?: string;
  approved_by?: string; // Supabase compatibility
  createdAt: string;
  created_at?: string; // Supabase compatibility
  resolvedAt?: string;
  resolved_at?: string; // Supabase compatibility
  siteId?: string;
  site_id?: string; // Supabase compatibility
}

export interface FulfillmentPlan {
  siteId: string;
  items: {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    sourceSiteId: string;
    zoneId?: string;
  }[];
  isSplit: boolean;
  strategy: FulfillmentStrategy;
}

export interface DiscrepancyClaim {
  id: string;
  resolutionId: string;
  resolution_id?: string; // Supabase compatibility
  claimType: 'carrier' | 'supplier' | 'internal';
  claim_type?: 'carrier' | 'supplier' | 'internal'; // Supabase compatibility
  claimNumber?: string;
  claim_number?: string; // Supabase compatibility
  claimStatus: 'submitted' | 'under_review' | 'approved' | 'denied' | 'paid';
  claim_status?: 'submitted' | 'under_review' | 'approved' | 'denied' | 'paid'; // Supabase compatibility
  claimAmount: number;
  claim_amount?: number; // Supabase compatibility
  approvedAmount?: number;
  approved_amount?: number; // Supabase compatibility
  submittedAt: string;
  submitted_at?: string; // Supabase compatibility
  reviewedAt?: string;
  reviewed_at?: string; // Supabase compatibility
  paidAt?: string;
  paid_at?: string; // Supabase compatibility
  carrierName?: string;
  carrier_name?: string; // Supabase compatibility
  trackingNumber?: string;
  tracking_number?: string; // Supabase compatibility
  documents?: any;
  notes?: string;
}

export interface ServerMetrics {
  total_count: number;
  total_value_cost: number;
  total_value_retail: number;
  stock_turnover_rate: number;
  low_stock_count: number;
  out_of_stock_count: number;
  active_alerts: number;
  dead_stock_value: number;
  total_revenue: number;
  net_profit: number;
  profit_margin: number;
  active_orders: number;
  return_rate: number;
  total_returned_value: number;
  inbound_pos: number;
  avg_cycle_time: string;
  category_stats: Array<{ name: string; value: number }>;
  abc_stats: Array<{ name: string; value: number }>;
  site_performance: Array<{ name: string; revenue: number; transactions: number }>;
  sales_by_category: Array<{ name: string; value: number }>;
  top_products: Array<{ name: string; sales: number; count: number }>;
}

export interface JobItem {
  productId: string;
  name: string;
  sku: string;
  image?: string;
  expectedQty: number;
  orderedQty?: number;
  quantity?: number;
  pickedQty: number;
  status: 'Pending' | 'Picked' | 'Short' | 'Skipped' | 'Completed' | 'Resolved' | 'Discrepancy' | 'Discontinued';
  batchNumber?: string;
  expiryDate?: string;
  receivedQty?: number;
  condition?: 'Good' | 'Damaged' | 'Short';
  receivedAt?: string;
  cost?: number;
  retailPrice?: number;
  unit?: string;
  containerId?: string;
  barcode?: string;
  startedAt?: string;
  started_at?: string;
  location?: string;
  returnedQty?: number;
  returnedAt?: string;
  size?: string;
  brand?: string;
  packed?: boolean;
  packedQty?: number;
  packQuantity?: number;
  category?: string;
  customAttributes?: any;
  description?: string;
  minStock?: number;
  maxStock?: number;
}

export interface WMSJob {
  id: string;
  siteId: string;
  site_id?: string;
  type: 'PICK' | 'PACK' | 'PUTAWAY' | 'TRANSFER' | 'DISPATCH' | 'REPLENISH' | 'COUNT' | 'WASTE' | 'RETURNS' | 'DRIVER' | 'RECEIVE';
  priority: 'Critical' | 'High' | 'Normal';
  status: 'Pending' | 'In-Progress' | 'Completed' | 'Cancelled' | 'Dispatched' | 'Deleted';
  items: number;
  items_count?: number;
  lineItems: JobItem[];
  line_items?: JobItem[];
  assignedTo?: string;
  startedAt?: string;
  location: string;
  orderRef: string;
  notes?: string;
  sourceSiteId?: string;
  source_site_id?: string;
  destSiteId?: string;
  dest_site_id?: string;
  jobNumber?: string;
  poNumber?: string;
  transferStatus?: 'Draft' | 'Requested' | 'Approved' | 'Picking' | 'Picked' | 'Packed' | 'Shipped' | 'In-Transit' | 'Delivered' | 'Received' | 'Completed' | 'Cancelled' | 'Rejected';
  requestedBy?: string;
  approvedBy?: string;
  shippedAt?: string;
  shipped_at?: string;
  deliveredAt?: string;
  delivered_at?: string;
  receivedAt?: string;
  receivedBy?: string;
  received_by?: string;
  trackingNumber?: string;
  tracking_number?: string;
  hasDiscrepancy?: boolean;
  discrepancyDetails?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  deliveryMethod?: 'Internal' | 'External';
  createdBy?: string;
  created_by?: string;
  completedBy?: string;
  completed_by?: string;
  completedAt?: string;
  completed_at?: string;
  externalCarrierName?: string;
  external_carrier_name?: string;
  assignedBy?: string;
  assigned_by?: string;
}

export type JobAssignmentStatus = 'Assigned' | 'Accepted' | 'In-Progress' | 'Paused' | 'Completed' | 'Cancelled';

export interface JobAssignment {
  id: string;
  jobId: string;
  job_id?: string;
  employeeId: string;
  employee_id?: string;
  employeeName: string;
  employee_name?: string;
  assignedAt: string;
  assigned_at?: string;
  startedAt?: string;
  started_at?: string;
  completedAt?: string;
  completed_at?: string;
  status: JobAssignmentStatus;
  notes?: string;
  estimatedDuration?: number;
  estimated_duration?: number;
  actualDuration?: number;
  actual_duration?: number;
  unitsProcessed?: number;
  units_processed?: number;
  accuracyRate?: number;
  accuracy_rate?: number;
}
