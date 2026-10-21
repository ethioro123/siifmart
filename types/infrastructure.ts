import { BonusTier, POSRoleDistribution, WarehousePointRule, StorePointRule } from './gamification';
import type { Country } from '../utils/localization';
import type { RolePolicy, RolePermissionCategory, ManagedRoleId } from './roles';
export * from './wms';
export * from './roles';

export interface Notification {
  id: string;
  type: 'alert' | 'success' | 'info' | 'warning';
  message: string;
  title?: string;
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
  country?: Country; // Operating market (e.g. Ethiopia 'ET', Kenya 'KE', or any registered country)
  currency?: string; // Optional site currency override (ETB, KES, KSh, USh, etc.)
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
  regionCode?: string; // Standard operational region code (e.g. 'ke_mombasa', 'ke_nairobi')
  region_code?: string;
}

export interface Region {
  code: string;
  name: string;
  country: string;
  city?: string;
  default_currency?: string;
  default_language?: string;
  admin_hub_site_id?: string;
  regional_manager_id?: string;
  monthly_procurement_budget?: number;
  autonomous_po_limit?: number;
  monthly_expense_budget?: number;
  autonomous_expense_limit?: number;
  status: 'active' | 'suspended' | 'planning';
  created_at?: string;
  updated_at?: string;
}

export interface LogisticsZone {
  id: string;
  name: string;
  description?: string;
  country?: Country;
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
  enablePoDraftAutoSave?: boolean;
  multiCurrency: boolean;
  requireShiftClosure: boolean;
  taxJurisdictions?: TaxJurisdiction[];
  country?: Country;
  countryConfigs?: Record<string, Partial<SystemConfig>>;
  taxAuthority?: string;
  complianceStandard?: string;
  eTimsEnabled?: boolean;
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
  // Kenya Mobile Gateways
  mpesaTillEnabled?: boolean;
  mpesaTillNumber?: string;
  mpesaTillName?: string;
  mpesaStkEnabled?: boolean;
  mpesaStkShortcode?: string;
  mpesaPasskey?: string;
  mpesaConsumerKey?: string;
  mpesaConsumerSecret?: string;
  mpesaEnvironment?: 'sandbox' | 'production';
  mpesaPaybillEnabled?: boolean;
  mpesaPaybillNumber?: string;
  mpesaPaybillAccount?: string;
  airtelMoneyEnabled?: boolean;
  airtelTillNumber?: string;
  airtelMerchantName?: string;
  // Ethiopia Mobile Gateways
  telebirrEnabled?: boolean;
  telebirrMerchantId?: string;
  cbeBirrEnabled?: boolean;
  cbeBirrMerchantCode?: string;
  fiscalYearStart?: string;
  accountingMethod?: 'accrual' | 'cash';
  taxInclusive?: boolean;
  taxOnSelling?: boolean;
  taxOnPurchasing?: boolean;
  defaultVatRate?: number;
  compoundTax?: boolean;
  taxExemptions?: boolean;
  withholdingTax?: number;
  maxPettyCash?: number;
  expenseApprovalLimit?: number;
  defaultCreditLimit?: number;
  receivingLogic?: 'blind' | 'verified';
  qcSamplingRate?: number;
  overReceiveTolerancePct?: number;
  poPriceApplyAt?: 'receive' | 'putaway';
  printPriceTagAt?: 'receive' | 'putaway' | 'store';
  managerSecurityPin?: string;
  blindCloseEnforced?: boolean;
  requireRefundManagerPin?: boolean;
  highValueBarcodeLockThreshold?: number;
  qcBlockOnFailure?: boolean;
  putawayLogic?: 'manual' | 'system';
  requirePutawayQuantityEntry?: boolean;
  rotationPolicy?: 'fifo' | 'fefo' | 'lifo';
  requireExpiry?: boolean;
  cycleCountStrategy?: 'abc' | 'random';
  maxCycleCountRecounts?: number;
  requireSecondCounterOnVariance?: boolean;
  pickingMethod?: 'order' | 'wave' | 'zone';
  strictScanning?: boolean;
  requirePickQuantityEntry?: boolean;
  requirePackSecuritySeal?: boolean;
  requirePackCartonWeight?: boolean;
  packWeightTolerancePct?: number;
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
  posDailyRevenueTarget?: number;
  posDailyTxTarget?: number;
  rolePolicies?: Record<ManagedRoleId, RolePolicy>;
  rolePermissions?: RolePermissionCategory;
}

export type { ExpenseRecord, ExpenseStatus } from './expense';

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

export type TransferStatus = 'Requested' | 'Approved' | 'Picking' | 'Packed' | 'Shipped' | 'Dispatched' | 'In-Transit' | 'Delivered' | 'Completed' | 'Rejected' | 'Received' | 'Cancelled';

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
  deliveredAt?: string;
  delivered_at?: string;
  receivedAt?: string;
  completedAt?: string;
  createdAt?: string;
  requestedBy: string;
  approvedBy?: string;
  approved_by?: string;
  approved_at?: string;
  approvedByRole?: string;
  approved_by_role?: string;
  approvalNotes?: string;
  approval_notes?: string;
  items: TransferItem[];
  notes?: string;
  jobNumber?: string;
  orderRef?: string;
  hasDiscrepancy?: boolean;
  discrepancyDetails?: string;
  discrepancyResolutionType?: 'LOCAL_STORE_MANAGER' | 'ESCALATED_LOSS_PREVENTION';
  discrepancy_resolution_type?: string;
  discrepancyReasonCode?: string;
  discrepancy_reason_code?: string;
  discrepancyResolvedBy?: string;
  discrepancy_resolved_by?: string;
  discrepancyResolvedAt?: string;
  discrepancy_resolved_at?: string;
  sourceRegionCode?: string;
  source_region_code?: string;
  destRegionCode?: string;
  dest_region_code?: string;
  countryCode?: string;
  country_code?: string;
  isInterRegion?: boolean;
  is_inter_region?: boolean;
  receivedBy?: string;
  received_by?: string;
  driverType?: 'INTERNAL' | 'EXTERNAL';
  driver_type?: 'INTERNAL' | 'EXTERNAL' | string;
  driverId?: string;
  driver_id?: string;
  driverName?: string;
  driver_name?: string;
  dispatchedAt?: string;
  dispatched_at?: string;
  dispatchedBy?: string;
  dispatched_by?: string;
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
