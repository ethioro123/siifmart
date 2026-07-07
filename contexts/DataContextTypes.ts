import React from 'react';
import {
  Product, PurchaseOrder, Supplier, SaleRecord, ExpenseRecord,
  StockMovement, CartItem, PaymentMethod, WMSJob, JobItem, Employee, EmployeeTask, Customer,
  ReturnItem, ShiftRecord, HeldOrder, SystemConfig, Site, TransferRecord,
  Notification, SystemLog, JobAssignment, Promotion, DiscountCode, WorkerPoints, PointsTransaction,
  StorePoints, WorkerBonusShare, BonusTier, WarehouseZone, FulfillmentPlan,
  StaffSchedule, PendingInventoryChange, BarcodeApproval
} from '../types';

export interface DataContextType {
  // State
  settings: SystemConfig;
  products: Product[];
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  movements: StockMovement[];
  employees: Employee[];
  customers: Customer[];
  shifts: ShiftRecord[];
  heldOrders: HeldOrder[];
  sites: Site[];
  activeSite: Site | undefined;
  notifications: Notification[];
  systemLogs: SystemLog[];
  promotions: Promotion[];
  tasks: EmployeeTask[];
  setTasks: (tasks: EmployeeTask[]) => void;

  // Global Raw Data
  allProducts: Product[];
  allSales: SaleRecord[];
  allOrders: PurchaseOrder[];

  // Exposed Setters
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setAllProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setAllOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  setAllSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;

  // Actions
  updateSettings: (settings: Partial<SystemConfig>, user: string) => Promise<void>;
  setActiveSite: (id: string) => void;
  addSite: (site: Site, user: string) => Promise<void>;
  updateSite: (site: Site, user: string) => Promise<void>;
  deleteSite: (id: string, user: string) => Promise<void>;
  getTaxForSite: (siteId?: string) => { name: string, rate: number, compound: boolean }[];

  addProduct: (product: Product) => Promise<Product | undefined>;
  updateProduct: (product: Partial<Product> & { id: string }, updatedBy?: string) => Promise<Product | undefined>;
  updatePricesBySKU: (sku: string, updates: { price: number; costPrice?: number; salePrice?: number; isOnSale?: boolean }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  relocateProduct: (productId: string, newLocation: string, user: string) => Promise<void>;
  cleanupAdminProducts: () => Promise<void>;
  cleanupDuplicateLocations: () => Promise<void>;

  createPO: (po: PurchaseOrder) => Promise<PurchaseOrder | undefined>;
  updatePO: (po: PurchaseOrder) => Promise<void>;
  deletePO: (poId: string) => void;

  processSale: (cart: CartItem[], method: PaymentMethod, user: string, tendered: number, change: number, customerId?: string, pointsRedeemed?: number, type?: 'In-Store' | 'Delivery' | 'Pickup', taxBreakdown?: any[], receiptNumber?: string, roundedTotal?: number) => Promise<{ saleId: string; pointsResult?: any }>;
  processReturn: (saleId: string, items: ReturnItem[], totalRefund: number, user: string) => void;
  closeShift: (shift: ShiftRecord) => void;
  startShift: (cashierId: string, openingFloat: number) => void;
  triggerSync: () => void;
  posCheckQueue: () => Promise<void>;

  addSupplier: (supplier: Supplier) => Promise<void>;
  adjustStock: (productId: string, qty: number, type: 'IN' | 'OUT', reason: string, user: string) => Promise<void>;

  // Finance Actions
  addExpense: (expense: ExpenseRecord) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  processPayroll: (siteId: string, user: string) => Promise<void>;

  // HR Actions
  addEmployee: (employee: Employee, user?: string) => Promise<Employee | undefined>;
  updateEmployee: (employee: Employee, user: string) => Promise<void>;
  deleteEmployee: (id: string, user: string) => Promise<void>;

  // Gamification Actions (POS - Team)
  storePoints: StorePoints[];
  getStorePoints: (siteId: string) => StorePoints | undefined;
  awardStorePoints: (siteId: string, points: number, revenue: number, transactionCount?: number) => void;
  getStoreLeaderboard: () => StorePoints[];

  // Customer Actions
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // POS Actions
  holdOrder: (order: HeldOrder) => void;
  releaseHold: (orderId: string) => void;

  // System Actions
  addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markNotificationsRead: () => void;
  logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
  exportSystemData: () => string;
  resetData: () => void;
  refreshData: () => Promise<void>;

  // Merchandising
  addPromotion: (promo: Promotion) => void;
  deletePromotion: (id: string) => void;

  // Discount Codes
  discountCodes: DiscountCode[];
  addDiscountCode: (code: DiscountCode) => void;
  updateDiscountCode: (code: DiscountCode) => void;
  deleteDiscountCode: (id: string) => void;
  validateDiscountCode: (code: string, siteId?: string, subtotal?: number) => { valid: boolean; discountCode?: DiscountCode; error?: string };
  useDiscountCode: (codeId: string) => void;
  releaseOrder: (saleId: string) => Promise<void>;
  isDataInitialLoading: boolean;
  loadError: string | null;
  loadingProgress: {
    total: number;
    loaded: number;
    current: string;
    entities: Record<string, 'pending' | 'loading' | 'success' | 'error'>;
  };
  posSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error' | 'pending';
  posPendingSyncCount?: number;
  calculateWorkerBonusShare?: (...args: any[]) => any;
  updatePromotion?: (promo: Partial<Promotion> & { id: string }) => void;
}
