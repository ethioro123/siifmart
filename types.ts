import React from 'react';

declare global {
  interface Window {
    AndroidNative?: {
      printDocument: (documentName: string) => void;
      isPrintingAvailable: () => boolean;
      showToast: (message: string) => void;
      vibrate: (milliseconds: number) => void;
      getDeviceId: () => string;
      generateBarcode?: (content: string) => string;
    };
    isNativeApp?: boolean;
  }
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'warehouse_manager' | 'dispatcher' | 'pos' | 'picker' | 'packer' | 'hr' | 'auditor' | 'driver' | 'finance_manager' | 'procurement_manager' | 'store_supervisor' | 'inventory_specialist' | 'cs_manager' | 'it_support';
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
  created_at: string;
  user_name: string;
  action: string;
  details: string;
  module: string;
  ip_address?: string;
}

export type SiteType = 'Administration' | 'Administrative' | 'Central Operations' | 'Warehouse' | 'Store' | 'Distribution Center' | 'Dark Store' | 'HQ' | 'Headquarters';

export interface Site {
  id: string;
  code: string; // Simplified Display ID (e.g., "001", "ADM")
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
  // Gamification settings
  bonusEnabled?: boolean; // Whether this site earns POS team bonuses (default: true)
  warehouseBonusEnabled?: boolean; // Whether this site earns warehouse worker bonuses (default: true)
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
  // Branding
  slogan?: string;
  brandColor?: string;
  // Legal & Contact
  legalBusinessName?: string;
  registeredAddress?: string;
  supportPhone?: string;
  // POS
  posReceiptHeader?: string;
  posReceiptFooter?: string;
  posTerminalId?: string;
  posRegisterMode?: 'cashier' | 'kiosk';
  posGuestCheckout?: boolean;
  posBlockNegativeStock?: boolean;
  posDigitalReceipts?: boolean;
  posAutoPrint?: boolean;
  payment_cash?: boolean;
  payment_card?: boolean;
  payment_mobile_money?: boolean;
  payment_store_credit?: boolean;

  // Finance
  fiscalYearStart?: string;
  accountingMethod?: 'accrual' | 'cash';
  taxInclusive?: boolean;
  defaultVatRate?: number;
  withholdingTax?: number;
  maxPettyCash?: number;
  expenseApprovalLimit?: number;
  defaultCreditLimit?: number;

  // WMS
  receivingLogic?: 'blind' | 'verified';
  qcSamplingRate?: number;
  qcBlockOnFailure?: boolean;
  putawayLogic?: 'manual' | 'system';
  rotationPolicy?: 'fifo' | 'fefo' | 'lifo';
  requireExpiry?: boolean;
  cycleCountStrategy?: 'abc' | 'random';
  pickingMethod?: 'order' | 'wave' | 'zone';
  strictScanning?: boolean;

  // Advanced
  reserveStockBuffer?: number;
  language?: string;
  timezone?: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  numberFormat?: '1,000.00' | '1.000,00';
  // Additional Settings
  logoUrl?: string;
  taxVatNumber?: string;
  supportContact?: string;
  webhookOrderCreated?: string;
  webhookInventoryLow?: string;
  webhookCustomerSignup?: string;
  scaleIpAddress?: string;
  scannerComPort?: string;
  // Gamification & Bonus Settings (Warehouse)
  bonusEnabled?: boolean;
  bonusPayoutFrequency?: 'weekly' | 'biweekly' | 'monthly';
  bonusTiers?: BonusTier[];
  bonusCurrency?: string; // Default to main currency if not set
  // Warehouse Points Eligible Roles (which roles can earn points)
  warehousePointsEligibleRoles?: { role: string; enabled: boolean; label: string }[];
  warehousePointRules?: WarehousePointRule[];
  // POS Team Bonus Settings
  posBonusEnabled?: boolean;
  posBonusPayoutFrequency?: 'weekly' | 'biweekly' | 'monthly';
  posBonusTiers?: BonusTier[];
  posRoleDistribution?: POSRoleDistribution[];
  posPointRules?: StorePointRule[];
  // Site-specific eligibility (keyed by siteId)
  warehouseBonusEligibility?: Record<string, boolean>;
  posBonusEligibility?: Record<string, boolean>;
}

// Bonus tier configuration
export interface BonusTier {
  id: string;
  minPoints: number;
  maxPoints: number | null; // null = unlimited (top tier)
  bonusAmount: number; // Fixed amount
  bonusPerPoint?: number; // Optional: additional per-point bonus
  tierName: string;
  tierColor: string;
}

// POS Role-based bonus distribution
export interface POSRoleDistribution {
  id: string;
  role: string; // e.g., "Store Manager", "Cashier", "Sales Associate"
  percentage: number; // Percentage of store bonus pool (0-100)
  color: string;
}

// Default POS role distribution
export const DEFAULT_POS_ROLE_DISTRIBUTION: POSRoleDistribution[] = [
  { id: 'role-1', role: 'Store Manager', percentage: 30, color: 'yellow' },
  { id: 'role-2', role: 'Assistant Manager', percentage: 20, color: 'purple' },
  { id: 'role-3', role: 'Senior Cashier', percentage: 15, color: 'cyan' },
  { id: 'role-4', role: 'Cashier', percentage: 12, color: 'blue' },
  { id: 'role-5', role: 'Sales Associate', percentage: 10, color: 'green' },
  { id: 'role-6', role: 'Stock Clerk', percentage: 8, color: 'amber' },
  { id: 'role-8', role: 'Support Staff', percentage: 2, color: 'gray' },
];

export interface WarehousePointRule {
  id: string;
  action: 'PICK' | 'PACK' | 'PUTAWAY' | 'TRANSFER' | 'DISPATCH' | 'ITEM_BONUS' | 'ACCURACY_100' | 'ACCURACY_95' | 'STREAK_3' | 'STREAK_7' | 'STREAK_30';
  points: number;
  description: string;
  enabled: boolean;
}

export const DEFAULT_WAREHOUSE_POINT_RULES: WarehousePointRule[] = [
  { id: 'wpr-1', action: 'PICK', points: 15, description: 'Base points for picking a job', enabled: true },
  { id: 'wpr-2', action: 'PACK', points: 10, description: 'Base points for packing a job', enabled: true },
  { id: 'wpr-3', action: 'PUTAWAY', points: 8, description: 'Base points for putaway a job', enabled: true },
  { id: 'wpr-4', action: 'TRANSFER', points: 10, description: 'Base points for transfer a job', enabled: true },
  { id: 'wpr-5', action: 'DISPATCH', points: 8, description: 'Base points for dispatch a job', enabled: true },
  { id: 'wpr-6', action: 'ITEM_BONUS', points: 2, description: 'Points per item processed', enabled: true },
  { id: 'wpr-7', action: 'ACCURACY_100', points: 50, description: 'Bonus for 100% accuracy', enabled: true },
  { id: 'wpr-8', action: 'ACCURACY_95', points: 25, description: 'Bonus for 95%+ accuracy', enabled: true },
  { id: 'wpr-9', action: 'STREAK_3', points: 25, description: 'Bonus for 3-day active streak', enabled: true },
  { id: 'wpr-10', action: 'STREAK_7', points: 75, description: 'Bonus for 7-day active streak', enabled: true },
  { id: 'wpr-11', action: 'STREAK_30', points: 300, description: 'Bonus for 30-day active streak', enabled: true },
];

// Default POS bonus tiers (based on store revenue/transactions)
export const DEFAULT_POS_BONUS_TIERS: BonusTier[] = [
  { id: 'pos-tier-1', minPoints: 0, maxPoints: 499, bonusAmount: 0, bonusPerPoint: 0, tierName: 'Starting', tierColor: 'gray' },
  { id: 'pos-tier-2', minPoints: 500, maxPoints: 1499, bonusAmount: 2000, bonusPerPoint: 0.5, tierName: 'Bronze', tierColor: 'amber' },
  { id: 'pos-tier-3', minPoints: 1500, maxPoints: 2999, bonusAmount: 5000, bonusPerPoint: 0.75, tierName: 'Silver', tierColor: 'gray' },
  { id: 'pos-tier-4', minPoints: 3000, maxPoints: 5999, bonusAmount: 10000, bonusPerPoint: 1.0, tierName: 'Gold', tierColor: 'yellow' },
  { id: 'pos-tier-5', minPoints: 6000, maxPoints: 9999, bonusAmount: 20000, bonusPerPoint: 1.25, tierName: 'Platinum', tierColor: 'cyan' },
  { id: 'pos-tier-6', minPoints: 10000, maxPoints: null, bonusAmount: 40000, bonusPerPoint: 1.5, tierName: 'Diamond', tierColor: 'purple' },
];

// Store Points (team-based for POS)
export interface StorePoints {
  id: string;
  siteId: string;
  siteName: string;
  // Points breakdown
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  todayPoints: number;
  // Store stats
  totalTransactions: number;
  totalRevenue: number;
  averageTicketSize: number;
  customerSatisfaction: number; // percentage
  // Time tracking
  lastTransactionAt?: string;
  lastUpdated: string;
  // Current tier
  currentTier?: string;
  estimatedBonus?: number;
}

// Individual worker's share from store bonus
export interface WorkerBonusShare {
  employeeId: string;
  employeeName: string;
  role: string;
  rolePercentage: number;
  storeBonus: number; // Total store bonus
  personalShare: number; // Their calculated share
  siteId: string;
}

// ==================== STORE POINT RULES ====================

// Point earning rule types
export type PointRuleType = 'category' | 'product' | 'revenue' | 'quantity' | 'promotion';

// Individual point rule
export interface StorePointRule {
  id: string;
  name: string;
  type: PointRuleType;
  enabled: boolean;
  // For category/product specific rules
  categoryId?: string; // Category name or 'all'
  productId?: string; // Product ID or 'all'
  productSku?: string; // For display purposes
  // Point configuration
  pointsPerUnit: number; // Points per item/unit sold
  pointsPerRevenue?: number; // Points per X currency (e.g., 1 point per 100 ETB)
  revenueThreshold?: number; // Revenue amount for pointsPerRevenue
  minQuantity?: number; // Minimum quantity to trigger bonus
  maxPointsPerTransaction?: number; // Cap on points from this rule per transaction
  // Multipliers
  multiplier?: number; // Bonus multiplier (e.g., 2x points during promotion)
  // Time restrictions
  validFrom?: string;
  validTo?: string;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  // Display
  description?: string;
  color?: string;
  priority?: number; // Higher priority rules override lower
}

// Default store point rules
export const DEFAULT_STORE_POINT_RULES: StorePointRule[] = [
  {
    id: 'rule-base',
    name: 'Base Points',
    type: 'quantity',
    enabled: true,
    categoryId: 'all',
    pointsPerUnit: 1,
    description: 'Earn 1 point for each item sold',
    color: 'blue',
    priority: 1,
  },
  {
    id: 'rule-revenue',
    name: 'Revenue Bonus',
    type: 'revenue',
    enabled: true,
    pointsPerUnit: 0,
    pointsPerRevenue: 1,
    revenueThreshold: 100,
    description: 'Earn 1 bonus point per 100 ETB in sales',
    color: 'green',
    priority: 2,
  },
  {
    id: 'rule-premium',
    name: 'Premium Products',
    type: 'category',
    enabled: true,
    categoryId: 'Electronics',
    pointsPerUnit: 5,
    description: 'Earn 5 points per electronics item (high-value category)',
    color: 'purple',
    priority: 3,
  },
  {
    id: 'rule-grocery',
    name: 'Grocery Items',
    type: 'category',
    enabled: true,
    categoryId: 'Groceries',
    pointsPerUnit: 2,
    description: 'Earn 2 points per grocery item',
    color: 'emerald',
    priority: 3,
  },
  {
    id: 'rule-bulk',
    name: 'Bulk Sale Bonus',
    type: 'quantity',
    enabled: true,
    categoryId: 'all',
    pointsPerUnit: 0,
    minQuantity: 10,
    multiplier: 1.5,
    description: 'Get 1.5x points when selling 10+ items in one transaction',
    color: 'amber',
    priority: 10,
  },
];

// Default bonus tiers
export const DEFAULT_BONUS_TIERS: BonusTier[] = [
  { id: 'tier-1', minPoints: 0, maxPoints: 99, bonusAmount: 0, bonusPerPoint: 0, tierName: 'Training', tierColor: 'gray' },
  { id: 'tier-2', minPoints: 100, maxPoints: 299, bonusAmount: 500, bonusPerPoint: 0.5, tierName: 'Bronze', tierColor: 'amber' },
  { id: 'tier-3', minPoints: 300, maxPoints: 599, bonusAmount: 1200, bonusPerPoint: 0.75, tierName: 'Silver', tierColor: 'gray' },
  { id: 'tier-4', minPoints: 600, maxPoints: 999, bonusAmount: 2500, bonusPerPoint: 1.0, tierName: 'Gold', tierColor: 'yellow' },
  { id: 'tier-5', minPoints: 1000, maxPoints: 1999, bonusAmount: 5000, bonusPerPoint: 1.25, tierName: 'Platinum', tierColor: 'cyan' },
  { id: 'tier-6', minPoints: 2000, maxPoints: null, bonusAmount: 10000, bonusPerPoint: 1.5, tierName: 'Diamond', tierColor: 'purple' },
];

// Default warehouse roles eligible for points
export const DEFAULT_WAREHOUSE_POINTS_ROLES: { role: string; enabled: boolean; label: string }[] = [
  { role: 'picker', enabled: true, label: 'Picker' },
  { role: 'dispatcher', enabled: true, label: 'Dispatcher' },
  { role: 'warehouse_manager', enabled: true, label: 'Warehouse Manager' },
  { role: 'inventory_specialist', enabled: true, label: 'Inventory Specialist' },
  { role: 'forklift_operator', enabled: true, label: 'Forklift Operator' },
  { role: 'receiver', enabled: true, label: 'Receiver' },
  { role: 'packer', enabled: true, label: 'Packer' },
];

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

export type ProductApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Product {
  id: string;
  productId?: string; // Compatibility alias
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
  shelfPosition?: ShelfPosition;
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

  // Extended fields for PO consistency
  brand?: string;
  size?: string;
  unit?: string;
  packQuantity?: number;
  needsReview?: boolean;
  receivingNotes?: string;
  pack_quantity?: number; // Supabase compatibility
}

// Pending Inventory Change Request - for edits, deletes, and stock adjustments awaiting approval
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

// Discount codes that can be given to customers
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
  user?: string; // Compatibility alias for history
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
  status: 'Pending' | 'Picked' | 'Short' | 'Skipped' | 'Completed';
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
  items_count?: number; // Compatibility alias
  lineItems: JobItem[];
  line_items?: JobItem[]; // Compatibility alias
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
  createdAt?: string;
  created_at?: string; // Supabase compatibility
  updatedAt?: string;
  updated_at?: string; // Supabase compatibility
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

// ═══════════════════════════════════════════════════════════════
// GAMIFICATION SYSTEM - Worker Points & Achievements
// ═══════════════════════════════════════════════════════════════

export type AchievementType =
  | 'first_job'
  | 'speed_demon'
  | 'perfect_accuracy'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'centurion' // 100 jobs
  | 'veteran' // 500 jobs
  | 'legend' // 1000 jobs
  | 'early_bird' // Completed before 8am
  | 'night_owl' // Completed after 8pm
  | 'team_player'; // Helped on 10+ jobs

export interface WorkerAchievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  unlockedAt: string;
  pointsAwarded: number;
}

export interface WorkerPoints {
  id: string;
  siteId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  // Points breakdown
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  todayPoints: number;
  // Job stats
  totalJobsCompleted: number;
  totalItemsPicked: number;
  averageAccuracy: number; // percentage
  averageTimePerJob: number; // minutes
  currentStreak: number; // consecutive days with completed job
  longestStreak: number;
  // Time tracking
  lastJobCompletedAt?: string;
  lastUpdated: string;
  // Achievements unlocked
  achievements: WorkerAchievement[];
  // Rank
  rank: number; // Current position on leaderboard
  level: number; // Based on total points
  levelTitle: string; // e.g., "Rookie", "Pro", "Elite", "Legend"
  // Bonus info (calculated from settings)
  currentBonusTier?: string;
  estimatedBonus?: number;
  bonusPeriodPoints?: number; // Points in current bonus period
}

export interface PointsTransaction {
  id: string;
  employeeId: string;
  jobId?: string;
  points: number;
  type: 'job_complete' | 'bonus' | 'achievement' | 'speed_bonus' | 'accuracy_bonus' | 'streak_bonus';
  description: string;
  timestamp: string;
}

// Points configuration
export const POINTS_CONFIG = {
  // Base points per job type
  JOB_PICK: 15, // Increased from 10
  JOB_PACK: 10,  // Increased from 8
  JOB_PUTAWAY: 8, // Increased from 6
  JOB_TRANSFER: 10, // Increased from 7
  JOB_DISPATCH: 8,  // Increased from 5
  // Bonuses
  ITEM_BONUS: 2, // Per item picked (Increased from 1)
  ACCURACY_100_BONUS: 50, // Perfect accuracy (Increased from 20)
  ACCURACY_95_BONUS: 25, // 95%+ accuracy (Increased from 10)
  SPEED_BONUS_FAST: 15, // Completed 50%+ faster than average
  SPEED_BONUS_QUICK: 8, // Completed 25%+ faster than average
  // Streak bonuses
  STREAK_3_DAYS: 25,
  STREAK_7_DAYS: 75,
  STREAK_30_DAYS: 300,
  // Level thresholds
  LEVELS: [
    { level: 1, points: 0, title: 'Rookie' },
    { level: 2, points: 100, title: 'Apprentice' },
    { level: 3, points: 300, title: 'Worker' },
    { level: 4, points: 600, title: 'Skilled' },
    { level: 5, points: 1000, title: 'Expert' },
    { level: 6, points: 2000, title: 'Pro' },
    { level: 7, points: 4000, title: 'Master' },
    { level: 8, points: 7000, title: 'Elite' },
    { level: 9, points: 12000, title: 'Champion' },
    { level: 10, points: 20000, title: 'Legend' },
  ],
};

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
  sku?: string; // Missing but used in DataContext
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
  requestedBy?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  lineItems: PurchaseOrderItem[];
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
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  createdAt?: string;
  created_at?: string; // Supabase compatibility
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
  // Driver-specific fields
  driverType?: 'internal' | 'subcontracted' | 'owner_operator';
  vehicleType?: string; // e.g., "Van", "Truck", "Motorcycle"
  vehiclePlate?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
}

export interface CartItem extends Product {
  productId?: string; // Compatibility alias
  quantity: number;
}

export interface SaleRecord {
  id: string;
  siteId: string;
  site_id?: string; // Supabase compatibility
  date: string;
  created_at?: string; // Supabase compatibility
  createdAt?: string;

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
  customerName?: string;
  customer_name?: string;
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
  sku: string;
  name: string;
  productName?: string;
  quantity: number;
}

export type TransferStatus = 'Requested' | 'Approved' | 'In-Transit' | 'Delivered' | 'Completed' | 'Rejected' | 'Received';

export interface TransferRecord {
  id: string;
  sourceSiteId: string;
  sourceSiteName: string;
  destSiteId: string;
  destSiteName: string;
  status: TransferStatus;
  transferStatus?: string; // legacy support
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