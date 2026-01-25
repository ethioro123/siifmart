import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Product, PurchaseOrder, Supplier, SaleRecord, ExpenseRecord,
  StockMovement, CartItem, PaymentMethod, WMSJob, JobItem, Employee, EmployeeTask, Customer,
  ReturnItem, ShiftRecord, HeldOrder, ReceivingItem, SystemConfig, Site, TransferRecord,
  Notification, SystemLog, JobAssignment, Promotion, DiscountCode, WorkerPoints, PointsTransaction, POINTS_CONFIG,
  StorePoints, WorkerBonusShare, BonusTier, DEFAULT_BONUS_TIERS, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION,
  StorePointRule, DEFAULT_STORE_POINT_RULES, WarehousePointRule, DEFAULT_WAREHOUSE_POINT_RULES, WarehouseZone, FulfillmentPlan,
  StaffSchedule, PendingInventoryChange, BarcodeApproval
} from '../types';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_SYMBOL } from '../constants';
import {
  sitesService,
  productsService,
  customersService,
  employeesService,
  suppliersService,
  purchaseOrdersService,
  salesService,
  stockMovementsService,
  expensesService,
  wmsJobsService,
  systemLogsService,
  transfersService,
  jobAssignmentsService,
  workerPointsService,
  pointsTransactionsService,
  storePointsService,
  systemConfigService,
  tasksService,
  warehouseZonesService,
  inventoryRequestsService,
  discrepancyService,
  schedulesService,
  barcodeApprovalsService
} from '../services/supabase.service';
import { supabase } from '../lib/supabase';
import { realtimeService } from '../services/realtime.service';
import { useStore } from './CentralStore';
import { posDB } from '../services/db/pos.db';
import { usePosSync } from '../hooks/usePosSync';
import { useDataQueries } from '../hooks/useDataQueries';
import { generateSKU, registerExistingSKU } from '../utils/skuGenerator';
import { setGlobalTimezone } from '../utils/formatting';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);



// Default config
const DEFAULT_CONFIG: SystemConfig = {
  storeName: 'SIIFMART',
  currency: 'ETB',
  taxRate: 0,
  lowStockThreshold: 10,
  fefoRotation: true,
  binScan: false,
  enableLoyalty: true,
  enableWMS: true,
  multiCurrency: false,
  requireShiftClosure: true,
  posDigitalReceipts: true,
  posAutoPrint: false,
  posReceiptHeader: 'SIIFMART RETAIL',
  posReceiptFooter: 'Thank you for shopping with us!',
  posReceiptLogo: 'https://siifmart.com/logo.png',
  posReceiptShowLogo: true,
  posReceiptAddress: 'Addis Ababa, Ethiopia',
  posReceiptPhone: '+251 911 223 344',
  posReceiptEmail: 'contact@siifmart.com',
  posReceiptTaxId: 'TIN-0012345678',
  posReceiptPolicy: 'No refunds after 7 days without receipt.',
  posReceiptSocialHandle: '@siifmart',
  posReceiptEnableQR: true,
  posReceiptQRLink: 'https://siifmart.com/feedback',
  posReceiptFont: 'sans-serif',
  posTerminalId: 'POS-01',
  fiscalYearStart: '2024-01-01',
  accountingMethod: 'cash',
  language: 'en',
  warehouseBonusEligibility: {},
  posBonusEligibility: {},
  taxJurisdictions: [] // Empty by default - sites use settings.taxRate unless assigned a jurisdiction
};

interface DataContextType {
  // State
  settings: SystemConfig;
  products: Product[];
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  movements: StockMovement[];
  jobs: WMSJob[];
  employees: Employee[];
  customers: Customer[];
  shifts: ShiftRecord[];
  heldOrders: HeldOrder[];
  sites: Site[];
  activeSite: Site | undefined;
  transfers: TransferRecord[];
  notifications: Notification[];
  systemLogs: SystemLog[];
  jobAssignments: JobAssignment[];
  promotions: Promotion[];
  workerPoints: WorkerPoints[];
  pointsTransactions: PointsTransaction[];
  tasks: EmployeeTask[];
  setTasks: (tasks: EmployeeTask[]) => void;
  zones: WarehouseZone[];
  allZones: WarehouseZone[];
  schedules: StaffSchedule[];
  barcodeApprovals: BarcodeApproval[];

  // Global Raw Data
  allProducts: Product[];
  allSales: SaleRecord[];
  allOrders: PurchaseOrder[];

  // Actions
  updateSettings: (settings: Partial<SystemConfig>, user: string) => void;
  setActiveSite: (id: string) => void;
  addSite: (site: Site, user: string) => void;
  updateSite: (site: Site, user: string) => void;
  deleteSite: (id: string, user: string) => void;
  getTaxForSite: (siteId?: string) => { name: string, rate: number, compound: boolean }[];

  addProduct: (product: Product) => Promise<Product | undefined>;
  updateProduct: (product: Partial<Product> & { id: string }, updatedBy?: string) => Promise<Product | undefined>;
  updatePricesBySKU: (sku: string, updates: { price: number; costPrice?: number; salePrice?: number; isOnSale?: boolean }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  relocateProduct: (productId: string, newLocation: string, user: string) => Promise<void>;
  cleanupAdminProducts: () => Promise<void>;

  createPO: (po: PurchaseOrder) => Promise<PurchaseOrder | undefined>;
  updatePO: (po: PurchaseOrder) => Promise<void>;
  receivePO: (poId: string, receivedItems?: ReceivingItem[], skuDecisions?: Record<string, 'keep' | 'generate'>, scannedSkus?: Record<string, string>) => Promise<any>;
  receivePOSplit: (poId: string, itemId: string, variants: Array<{ sku: string; skuType: 'existing' | 'new'; productId?: string; productName?: string; quantity: number; barcode?: string; }>) => Promise<void>;
  deletePO: (poId: string) => void;

  processSale: (cart: CartItem[], method: PaymentMethod, user: string, tendered: number, change: number, customerId?: string, pointsRedeemed?: number, type?: 'In-Store' | 'Delivery' | 'Pickup', taxBreakdown?: any[], receiptNumber?: string) => Promise<{ saleId: string; pointsResult?: any }>;
  processReturn: (saleId: string, items: ReturnItem[], totalRefund: number, user: string) => void;
  closeShift: (shift: ShiftRecord) => void;
  startShift: (cashierId: string, openingFloat: number) => void;
  triggerSync: () => void;

  addSupplier: (supplier: Supplier) => void;
  adjustStock: (productId: string, qty: number, type: 'IN' | 'OUT', reason: string, user: string) => void;

  // Finance Actions
  addExpense: (expense: ExpenseRecord) => void;
  deleteExpense: (id: string) => void;
  processPayroll: (siteId: string, user: string) => void;

  // WMS Actions
  assignJob: (jobId: string, employeeIdOrName: string) => Promise<void>;
  updateJobItem: (jobId: string, itemId: number, status: JobItem['status'], qty: number) => Promise<void>;
  updateJobStatus: (jobId: string, status: WMSJob['status']) => Promise<void>;
  updateJob: (id: string, updates: Partial<WMSJob>) => Promise<void>;
  completeJob: (jobId: string, user: string, skipValidation?: boolean, optimisticLineItems?: any[]) => Promise<any>;
  resetJob: (jobId: string) => Promise<void>;
  fixBrokenJobs: () => Promise<void>;
  createPutawayJob: (product: Product, quantity: number, user: string, source?: string) => Promise<WMSJob | undefined>;
  deleteJob: (id: string) => Promise<void>;

  // HR Actions
  addEmployee: (employee: Employee, user?: string) => void;
  updateEmployee: (employee: Employee, user: string) => void;
  deleteEmployee: (id: string, user: string) => void;

  // Rostering Actions
  addSchedule: (schedule: StaffSchedule, user: string) => Promise<StaffSchedule | undefined>;
  updateSchedule: (id: string, updates: Partial<StaffSchedule>, user: string) => Promise<StaffSchedule | undefined>;
  deleteSchedule: (id: string, user: string) => Promise<void>;

  // Gamification Actions (Warehouse - Individual)
  getWorkerPoints: (employeeId: string) => WorkerPoints | undefined;
  awardPoints: (employeeId: string, points: number, type: PointsTransaction['type'], description: string, jobId?: string) => void;
  getLeaderboard: (siteId?: string, period?: 'today' | 'week' | 'month' | 'all') => WorkerPoints[];

  // Gamification Actions (POS - Team)
  storePoints: StorePoints[];
  getStorePoints: (siteId: string) => StorePoints | undefined;
  awardStorePoints: (siteId: string, points: number, revenue: number, transactionCount?: number) => void;
  calculateWorkerBonusShare: (siteId: string, employeeRole: string) => WorkerBonusShare | undefined;
  getStoreLeaderboard: () => StorePoints[];

  // Customer Actions
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;

  // POS Actions
  holdOrder: (order: HeldOrder) => void;
  releaseHold: (orderId: string) => void;

  // Logistics Actions
  requestTransfer: (transfer: TransferRecord) => void;
  shipTransfer: (id: string, user: string) => void;
  receiveTransfer: (id: string, user: string, receivedQuantities?: Record<string, number>) => void;
  updateTransfer: (id: string, updates: Partial<TransferRecord>) => Promise<void>;

  // System Actions
  addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markNotificationsRead: () => void;
  logSystemEvent: (action: string, details: string, user: string, module: SystemLog['module']) => void;
  exportSystemData: () => string;
  resetData: () => void;
  refreshData: () => Promise<void>;

  // Data Audit Actions
  approveBarcode: (id: string, userId: string) => Promise<void>;
  rejectBarcode: (id: string, userId: string, reason: string) => Promise<void>;

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
  // Get user from CentralStore (safely)
  const storeContext = useStore();
  const queryClient = useQueryClient();
  const user = storeContext?.user;

  // --- STATE ---
  const [settings, setSettings] = useState<SystemConfig>(() => {
    // PERSISTENCE: Try to load from localStorage
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('siifmart_system_config');
        if (saved) {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
    return DEFAULT_CONFIG;
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [activeSiteId, setActiveSiteId] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([
    // Sample discount codes
    {
      id: 'DC-001',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      type: 'PERCENTAGE',
      value: 10,
      validFrom: '2024-01-01',
      validUntil: '2025-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      description: '10% off for new customers'
    },
    {
      id: 'DC-002',
      code: 'SAVE50',
      name: 'Fixed Discount',
      type: 'FIXED',
      value: 50,
      minPurchaseAmount: 200,
      validFrom: '2024-01-01',
      validUntil: '2025-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      description: '50 ETB off on orders over 200 ETB'
    },
    {
      id: 'DC-003',
      code: 'VIP2024',
      name: 'VIP Member Discount',
      type: 'PERCENTAGE',
      value: 15,
      maxDiscountAmount: 500,
      validFrom: '2024-01-01',
      validUntil: '2025-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      description: '15% off (max 500 ETB) for VIP members'
    }
  ]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [jobs, setJobs] = useState<WMSJob[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Global State for HQ
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allSales, setAllSales] = useState<SaleRecord[]>([]);
  const [allOrders, setAllOrders] = useState<PurchaseOrder[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [jobAssignments, setJobAssignments] = useState<JobAssignment[]>([]);
  const [workerPoints, setWorkerPoints] = useState<WorkerPoints[]>([]);
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransaction[]>([]);
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [storePoints, setStorePoints] = useState<StorePoints[]>([]);
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [allZones, setAllZones] = useState<WarehouseZone[]>([]);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [barcodeApprovals, setBarcodeApprovals] = useState<BarcodeApproval[]>([]);
  const [isDataInitialLoading, setIsDataInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Loading Progress State - tracks per-entity loading for UI feedback
  const [loadingProgress, setLoadingProgress] = useState<{
    total: number;
    loaded: number;
    current: string;
    entities: Record<string, 'pending' | 'loading' | 'success' | 'error'>;
  }>({
    total: 0,
    loaded: 0,
    current: '',
    entities: {}
  });

  // Derived state
  const activeSite = React.useMemo(() =>
    sites.find(s => s.id === activeSiteId),
    [sites, activeSiteId]
  );

  // --- NOTIFICATION PERSISTENCE ---

  // React Query Hook for Data Fetching
  const queries = useDataQueries({
    siteId: activeSiteId,
    enabled: navigator.onLine,
    onProgress: (entity, status) => {
      // Sync React Query progress with our local progress state
      if (status === 'loading') {
        setLoadingProgress(prev => ({
          ...prev,
          current: entity,
          entities: { ...prev.entities, [entity]: 'loading' }
        }));
      } else if (status === 'success') {
        setLoadingProgress(prev => ({
          ...prev,
          loaded: prev.loaded + 1,
          entities: { ...prev.entities, [entity]: 'success' }
        }));
      } else if (status === 'error') {
        setLoadingProgress(prev => ({
          ...prev,
          loaded: prev.loaded + 1,
          entities: { ...prev.entities, [entity]: 'error' }
        }));
      }
    }
  });

  // Sync React Query data to local state
  useEffect(() => {
    if (queries.products.data) {
      // Apply sanitization
      const finalProducts = queries.products.data.map(p =>
        p.category?.toLowerCase() === 'alcohol' ? { ...p, category: 'Beverages' } : p
      );
      setProducts(finalProducts);
    }
    if (queries.employees.data) setEmployees(queries.employees.data);
    if (queries.orders.data) setOrders(queries.orders.data);
    if (queries.sales.data) {
      const sanitizedSales = queries.sales.data.map(s => ({
        ...s,
        items: s.items?.map((i: any) => i.category?.toLowerCase() === 'alcohol' ? { ...i, category: 'Beverages' } : i) || []
      }));
      setSales(sanitizedSales);
    }
    if (queries.customers.data) setCustomers(queries.customers.data);
    if (queries.suppliers.data) setSuppliers(queries.suppliers.data);
    if (queries.jobs.data) setJobs(queries.jobs.data);
    if (queries.movements.data) setMovements(queries.movements.data);
    if (queries.transfers.data) {
      const enrichedTransfers = queries.transfers.data.map((t: any) => ({
        ...t,
        sourceSiteName: sites.find(s => s.id === t.sourceSiteId)?.name || 'Unknown',
        destSiteName: sites.find(s => s.id === t.destSiteId)?.name || 'Unknown'
      }));
      setTransfers(enrichedTransfers);
    }
    if (queries.assignments.data) setJobAssignments(queries.assignments.data);
    if (queries.workerPoints.data) setWorkerPoints(queries.workerPoints.data);
    if (queries.storePoints.data) setStorePoints(queries.storePoints.data);
    if (queries.tasks.data) setTasks(queries.tasks.data);
    if (queries.schedules.data) setSchedules(queries.schedules.data);
    if (queries.barcodeApprovals.data) setBarcodeApprovals(queries.barcodeApprovals.data);
    if (queries.zones.data) setZones(queries.zones.data);
    if (queries.expenses.data) setExpenses(queries.expenses.data);
    if (queries.systemLogs.data) setSystemLogs(queries.systemLogs.data);

    // If query hook is managing loading, sync it
    if (!queries.isLoadingCritical && isDataInitialLoading) {
      setIsDataInitialLoading(false);
    }
  }, [
    queries.products.data, queries.employees.data, queries.orders.data, queries.sales.data,
    queries.customers.data, queries.suppliers.data, queries.jobs.data, queries.movements.data,
    queries.transfers.data, queries.assignments.data, queries.workerPoints.data,
    queries.storePoints.data, queries.tasks.data, queries.schedules.data,
    queries.barcodeApprovals.data, queries.zones.data, queries.expenses.data,
    queries.systemLogs.data, queries.isLoadingCritical, activeSiteId, sites
  ]);

  useEffect(() => {
    try {
      const savedNotifs = localStorage.getItem('siifmart_notifications');
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  }, []);

  // Save notifs to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('siifmart_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Check for expired notifications (older than 24h) every minute
  useEffect(() => {
    const checkExpiration = () => {
      const now = new Date().getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;

      setNotifications(prev => {
        const filtered = prev.filter(n => {
          // Parse timestamp - handle both ISO string and number
          const notifTime = new Date(n.timestamp).getTime();
          return (now - notifTime) < oneDayMs;
        });

        // Only update if count changed to prevent render loops
        return filtered.length !== prev.length ? filtered : prev;
      });
    };

    // Check immediately and then every minute
    checkExpiration();
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = useCallback((type: 'alert' | 'success' | 'info', message: string) => {
    const newNotif: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    // NO AUTO REMOVAL - Persist for 24h
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Guard to prevent concurrent loadData calls
  const loadingRef = React.useRef(false);
  const loadedSiteRef = React.useRef<string>('');

  // --- UNIVERSAL JOB ENRICHMENT ---
  // 1. Hydrate PO numbers for Inbound Jobs
  // 2. Hydrate Customer/Site details for Outbound Jobs (Pack/Dispatch)
  const enrichedJobs = useMemo(() => {
    return jobs.map(j => {
      // Clone job to allow extension
      const enhancedJob = { ...j } as any;

      // --- OUTBOUND ENRICHMENT (Pack/Dispatch) ---
      if (j.type === 'PACK' || j.type === 'DISPATCH' || j.type === 'PICK') {
        const orderRef = (j.orderRef || '').trim();

        // 1. Try finding linked Sale (for Customer details)
        const sale = sales.find(s => s.id === orderRef) || allSales.find(s => s.id === orderRef);
        if (sale) {
          const cust = customers.find(c => c.id === sale.customerId);
          if (cust) {
            enhancedJob.customerName = cust.name;
            enhancedJob.shippingAddress = (cust as any).address || (cust as any).shipping_address;
            enhancedJob.city = (cust as any).city || ((cust as any).address ? (cust as any).address.split(',').pop()?.trim() : 'Addis Ababa');
          } else if (sale.customerId === 'WALK_IN') {
            enhancedJob.customerName = 'Walk-In Customer';
            enhancedJob.city = 'In-Store';
          }
        } else {
          // 2. Try finding linked Transfer (for Site details)
          const transfer = transfers.find(t => t.id === orderRef);
          if (transfer) {
            const destSite = sites.find(s => s.id === transfer.destSiteId);
            if (destSite) {
              enhancedJob.destSiteName = destSite.name;
              enhancedJob.shippingAddress = destSite.address;
              enhancedJob.city = destSite.address?.split(',').pop()?.trim();
            }
          }
        }
      }

      // --- INBOUND / PO ENRICHMENT (Existing Logic) ---
      if (j.poNumber) return enhancedJob; // Already has it

      const jRef = (j.orderRef || '').trim().toUpperCase();
      if (!jRef || jRef.length < 3) return enhancedJob;

      // Fuzzy Matcher logic...
      const findPO = (list: PurchaseOrder[]) => list.find(o => {
        const pRef = (o.poNumber || o.po_number || '').trim().toUpperCase();
        if (!pRef) return false;
        if (pRef === jRef) return true;
        if (pRef.endsWith(jRef) || jRef.endsWith(pRef)) return true;
        const pId = (o.id || '').toLowerCase().trim();
        const jId = (j.orderRef || '').toLowerCase().trim();
        if (pId && jId && pId === jId) return true;
        return false;
      });

      const po = findPO(orders) || findPO(allOrders);

      if (po && (po.poNumber || po.po_number)) {
        return {
          ...enhancedJob,
          poNumber: po.poNumber || po.po_number,
          orderRef: (po.poNumber || po.po_number || j.orderRef) as string
        };
      }

      // Traceability Lite logic...
      if (j.lineItems && j.lineItems.length > 0) {
        const firstItem = j.lineItems[0] as any;
        const pid = firstItem.productId || firstItem.product_id;
        if (pid) {
          const sourcePO = orders.find(o => o.lineItems?.some((i: any) => i.product_id === pid || i.productId === pid)) ||
            allOrders.find(o => o.lineItems?.some((i: any) => i.product_id === pid || i.productId === pid));

          if (sourcePO && (sourcePO.poNumber || sourcePO.po_number)) {
            return { ...enhancedJob, poNumber: sourcePO.poNumber || sourcePO.po_number };
          }
        }
      }

      // Fallback logic...
      const possibleSku = (j.orderRef || '').replace('REPLENISH-', '').trim();
      if (possibleSku && possibleSku.length > 3 && !possibleSku.includes('-')) {
        const prod = allProducts.find(p => p.sku === possibleSku);
        if (prod) {
          const sourcePO = orders.find(o => o.lineItems?.some((i: any) => i.product_id === prod.id || i.productId === prod.id)) ||
            allOrders.find(o => o.lineItems?.some((i: any) => i.product_id === prod.id || i.productId === prod.id));
          if (sourcePO && (sourcePO.poNumber || sourcePO.po_number)) {
            return { ...enhancedJob, poNumber: sourcePO.poNumber || sourcePO.po_number };
          }
        }
      }

      return enhancedJob;
    });
  }, [jobs, orders, allOrders, sales, allSales, customers, transfers, sites, allProducts]);


  const logSystemEvent = useCallback(async (action: string, details: string, user: string, module: SystemLog['module']) => {
    try {
      const newLog = await systemLogsService.create({
        action,
        details,
        user_name: user,
        module
      });
      setSystemLogs(prev => [newLog, ...prev]);
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }, []);

  // --- SYNC USER'S SITE ---
  // When user logs in or changes, update active site to match their assigned location
  // IMPORTANT: Skip sync for roles that can manually switch sites (CEO, Admin, Auditor)
  const userSiteSyncRef = React.useRef<boolean>(false); // Track if initial sync has been done

  useEffect(() => {
    // Roles that can switch sites should NOT have their site auto-synced after initial load
    const canSwitchSites = ['super_admin', 'CEO', 'Super Admin', 'Admin', 'Auditor'].includes(user?.role || '');

    console.log('🔍 User Site Sync Check:', {
      userExists: !!user,
      userName: user?.name,
      userRole: user?.role,
      userSiteId: user?.siteId,
      sitesLoaded: sites.length,
      currentActiveSiteId: activeSiteId,
      canSwitchSites,
      initialSyncDone: userSiteSyncRef.current
    });

    // If user can switch sites and we've already done the initial sync, don't override their selection
    if (canSwitchSites && userSiteSyncRef.current && activeSiteId) {
      console.log('⏭️ Skipping site sync - user can switch sites and has already selected one');
      return;
    }

    if (user?.siteId && sites.length > 0) {
      const userSite = sites.find(s => s.id === user.siteId);

      if (!userSite) {
        console.error(`❌ User's siteId "${user.siteId}" not found in sites list!`);
        console.log('Available sites:', sites.map(s => ({ id: s.id, name: s.name })));
        return;
      }

      // Only sync if activeSiteId is not set OR if this is an initial sync for non-switchable roles
      if ((!canSwitchSites) && (!activeSiteId || activeSiteId !== user.siteId)) {
        console.log(`🔄 Syncing active site: "${activeSiteId || 'none'}" → "${userSite.name}" (${user.siteId})`);
        setActiveSiteId(user.siteId);
      } else if (canSwitchSites && !activeSiteId) {
        console.log('🌍 CEO/HQ Role - Staying in Global View');
      } else {
        console.log(`✅ Active site already set: ${activeSiteId}`);
      }

      // Mark initial sync as done
      userSiteSyncRef.current = true;
    } else {
      console.log('⏳ Waiting for user siteId or sites to load...');
    }
  }, [user, sites]); // Removed activeSiteId from dependencies to prevent loops

  // --- INITIAL LOAD ---
  useEffect(() => {
    loadSites();
    loadSettings();
  }, []);

  // --- LOAD SITE DATA WHEN ACTIVE SITE CHANGES ---
  // React Query Hook (useDataQueries) now handles site data loading 
  // automatically when activeSiteId changes.

  // Load Global Data once on mount (background)
  useEffect(() => {
    loadGlobalData();

    // FAIL-SAFE: If hydration takes more than 15s (slow network), we warn but DO NOT unblock
    // Strict Sync means we wait for data (cache or network)
    const timeout = setTimeout(() => {
      if (isDataInitialLoading) {
        console.warn('⚠️ Hydration taking long - Checking for partial data...');
        // Only unblock if we actually have something useful (e.g. products)
        // Otherwise, stay blocked to prevent empty dashboard
        if (products.length > 0 || sites.length > 0) {
          setIsDataInitialLoading(false);
        } else {
          setLoadError('Synchronization is taking longer than expected. Please check your connection.');
        }
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, []);

  // --- SYNC TIMEZONE ---
  useEffect(() => {
    if (settings.timezone) {
      setGlobalTimezone(settings.timezone);
      console.log('🌍 Global timezone updated to:', settings.timezone);
    }
  }, [settings.timezone]);

  const loadSites = async () => {
    try {
      console.log('🔄 Loading sites...');
      const loadedSites = await sitesService.getAll();
      setSites(loadedSites);

      // Cache for offline use
      try {
        localStorage.setItem('siifmart_sites_cache', JSON.stringify(loadedSites));
      } catch (e) {
        console.warn('Failed to cache sites', e);
      }

      try {
        const loadedAllZones = await warehouseZonesService.getAll();
        setAllZones(loadedAllZones);
        // Cache zones
        localStorage.setItem('siifmart_zones_cache', JSON.stringify(loadedAllZones));
      } catch (zoneError) {
        console.warn('⚠️ Failed to load warehouse zones:', zoneError);
        // Try fallback cache
        const cachedZones = localStorage.getItem('siifmart_zones_cache');
        if (cachedZones) {
          setAllZones(JSON.parse(cachedZones));
        } else {
          setAllZones([]);
        }
      }

      if (loadedSites.length === 0) {
        addNotification('info', 'No operational sites were found in the database.');
      }

    } catch (error: any) {
      console.error('❌ Failed to load sites:', error);

      // FALLBACK TO CACHE
      const cached = localStorage.getItem('siifmart_sites_cache');
      if (cached) {
        console.log('⚠️ Network failed, loading sites from cache.');
        setSites(JSON.parse(cached));
        // Also try zones cache
        const cachedZones = localStorage.getItem('siifmart_zones_cache');
        if (cachedZones) setAllZones(JSON.parse(cachedZones));

        addNotification('info', 'Network unreachable. Loaded sites from local cache.');
        return; // Successfully recovered via cache, no retry needed
      }

      const errorMsg = `Unable to connect to the logistics server (${error?.message || 'Network Error'}).`;
      // Only alert if we really have no data
      addNotification('alert', `System Error: ${errorMsg} Retrying...`);
      setLoadError(errorMsg);

      // Retry in 5 seconds only if online (otherwise wait for online event)
      if (navigator.onLine) {
        setTimeout(loadSites, 5000);
      }
    }
  };

  const loadSettings = async () => {
    try {
      console.log('🔄 Loading system settings...');
      const loadedSettings = await systemConfigService.getSettings();
      setSettings(loadedSettings);
      console.log('✅ System settings loaded');
    } catch (error: any) {
      console.error('❌ Failed to load system settings:', error?.message || error);
      // Fallback to DEFAULT_CONFIG or localStorage if DB fails
      try {
        const saved = localStorage.getItem('siifmart_system_config');
        if (saved) {
          setSettings({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
        }
      } catch (e) {
        console.error('Failed to load settings from localStorage fallback', e);
      }
    }
  };

  const loadSiteData = async (siteId: string, force = false) => {
    // Deprecated: Data fetching is now handled by useDataQueries hook
    console.log('⚠️ loadSiteData is deprecated. React Query is handling data fetching.');
    return;
  };


  const loadGlobalData = async () => {
    // ------------------------------------------------------------
    // OFFLINE-FIRST: Global Cache
    // ------------------------------------------------------------
    // ------------------------------------------------------------
    // GLOBAL CACHE REMOVED (Online-Only Mode)
    // ------------------------------------------------------------

    try {
      console.log('🌍 Loading Global HQ Data...');
      // For now, we fetch all and aggregate on client (careful with volume)
      const [allProds, allSls, allOrds, allEmps, allSupps] = await Promise.all([
        productsService.getAll(undefined, 5000).then(res => res.data), // Scalability: Limit global view to 5000
        salesService.getAll(undefined, 5000).then(res => res.data), // Scalability: increased for global
        purchaseOrdersService.getAll(undefined, 5000).then(res => res.data), // increased for global
        employeesService.getAll(),
        suppliersService.getAll(1000).then(res => res.data) // Load all active partners for HQ
      ]);

      setAllProducts(allProds);
      setAllSales(allSls);
      setAllOrders(allOrds);
      setEmployees(allEmps); // HQ sees all employees
      setSuppliers(allSupps);

      const allSchedules = await schedulesService.getAll();
      setSchedules(allSchedules);

      console.log('✅ Global HQ Data Loaded');

      // Update Global Cache
      // Cache update removed (Online-Only Mode)

      // If no site is active yet (e.g. CEO), global load finishes the hydration
      if (!activeSiteId) {
        setIsDataInitialLoading(false);
      }
    } catch (error) {
      console.error('❌ Failed to load global data:', error);
      // Even if global fails, don't lock the user out forever
      if (!activeSiteId) {
        // Only unblock if we have cached data
        setLoadError('Failed to load global data. Check connection.');
        setIsDataInitialLoading(false); // CRITICAL: Unblock UI even on error
      }
    }
  };

  const refreshData = useCallback(async () => {
    if (activeSiteId) {
      console.log('🔄 Manual Refresh Triggered (Site) - via React Query');
      queries.refetchAll();
    } else {
      console.log('🔄 Manual Refresh Triggered (Global)');
      await loadGlobalData();
    }
  }, [activeSiteId, queries]);


  // --- REAL-TIME UPDATES ---
  useEffect(() => {
    if (!activeSiteId) return;

    console.log(`📡 Subscribing to real-time updates for site: ${activeSiteId}`);

    const subscriptions = realtimeService.subscribeToSite(activeSiteId, {
      onProductChange: (event, payload) => {
        // [FIX] Map raw DB payload (snake_case) to Product interface (camelCase)
        const mapRealtimeProduct = (data: any): Product => ({
          ...data,
          siteId: data.site_id,
          barcodes: data.barcodes || [],
          costPrice: data.cost_price,
          salePrice: data.sale_price,
          isOnSale: data.is_on_sale,
          expiryDate: data.expiry_date,
          batchNumber: data.batch_number,
          shelfPosition: data.shelf_position,
          competitorPrice: data.competitor_price,
          salesVelocity: data.sales_velocity,
          posReceivedAt: data.pos_received_at,
          posReceivedBy: data.pos_received_by,
          approvalStatus: data.approval_status,
          createdBy: data.created_by,
          approvedBy: data.approved_by,
          approvedAt: data.approved_at,
          rejectedBy: data.rejected_by,
          rejectedAt: data.rejected_at,
          rejectionReason: data.rejection_reason,
          priceUpdatedAt: data.price_updated_at // [NEW] Map timestamp
        });

        if (event === 'INSERT') {
          const mapped = mapRealtimeProduct(payload);
          setProducts(prev => [mapped, ...prev]);
        }
        else if (event === 'UPDATE') {
          const mapped = mapRealtimeProduct(payload);
          setProducts(prev => prev.map(p => p.id === payload.id ? { ...p, ...mapped } : p));
        }
        else if (event === 'DELETE') setProducts(prev => prev.filter(p => p.id !== payload.id));
      },
      onSaleChange: (event, payload) => {
        if (event === 'INSERT') setSales(prev => [payload, ...prev]);
      },
      // --- BANDWIDTH OPTIMIZATION ---
      // We DISABLED stock movement listening because at 100k sales/day, 
      // this generates ~500k events/day (500MB egress per device).
      // Stock levels still update via 'onProductChange' above.
      // onStockChange: (event, payload) => {
      //   if (event === 'INSERT') setMovements(prev => [payload, ...prev]);
      // },
      onCustomerChange: (event, payload) => {
        if (event === 'INSERT') setCustomers(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setCustomers(prev => prev.map(c => c.id === payload.id ? payload : c));
      },
      onWMSJobChange: (event, payload) => {
        // Prevent duplicates: Only add if job doesn't already exist (may have been added by manual setJobs call)
        if (event === 'INSERT') setJobs(prev => prev.find(j => j.id === payload.id) ? prev : [payload, ...prev]);
        else if (event === 'UPDATE') setJobs(prev => prev.map(j => j.id === payload.id ? payload : j));
        else if (event === 'DELETE') setJobs(prev => prev.filter(j => j.id !== payload.id));
      },
      onJobAssignmentChange: (event, payload) => {
        if (event === 'INSERT') setJobAssignments(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setJobAssignments(prev => prev.map(a => a.id === payload.id ? payload : a));
        else if (event === 'DELETE') setJobAssignments(prev => prev.filter(a => a.id !== payload.id));
      },
      onTransferChange: (event, payload) => {
        if (event === 'INSERT') setTransfers(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setTransfers(prev => prev.map(t => t.id === payload.id ? payload : t));
        else if (event === 'DELETE') setTransfers(prev => prev.filter(t => t.id !== payload.id));
      },
      onPurchaseOrderChange: (event, payload) => {
        if (event === 'INSERT') setOrders(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.id ? payload : o));
        else if (event === 'DELETE') setOrders(prev => prev.filter(o => o.id !== payload.id));
      }
    });

    return () => {
      console.log('Unsubscribing from real-time updates...');
      realtimeService.unsubscribeAll(subscriptions);
    };
  }, [activeSiteId]);

  // --- ACTIONS ---

  const updateSettings = useCallback(async (newSettings: Partial<SystemConfig>, user: string) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Keep localStorage as a backup
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('siifmart_system_config', JSON.stringify(updated));
        }
      } catch (e) {
        console.error('Failed to save settings to localStorage', e);
      }
      return updated;
    });

    try {
      await systemConfigService.updateSettings(newSettings, user);
      logSystemEvent('Settings Updated', 'System configuration changed', user, 'Settings');
    } catch (error) {
      console.error('❌ Failed to persist settings to database:', error);
      addNotification('alert', 'Failed to save settings to server. Changes kept locally.');
    }
  }, []);

  const setActiveSite = useCallback((id: string) => setActiveSiteId(id), []);

  const getTaxForSite = useCallback((siteId?: string) => {
    const id = siteId || activeSiteId;
    const site = sites.find(s => s.id === id);
    if (!site?.taxJurisdictionId) {
      return [{ name: 'Standard Tax', rate: settings.taxRate ?? 0, compound: false }];
    }
    const jurisdiction = settings.taxJurisdictions?.find(j => j.id === site.taxJurisdictionId);
    if (!jurisdiction || !jurisdiction.rules || jurisdiction.rules.length === 0) {
      return [{ name: 'Standard Tax', rate: settings.taxRate ?? 0, compound: false }];
    }
    return jurisdiction.rules;
  }, [activeSiteId, sites, settings.taxRate, settings.taxJurisdictions]);

  const addSite = useCallback(async (site: Site, user: string) => {
    try {
      const newSite = await sitesService.create(site);
      setSites(prev => [newSite, ...prev]);
      logSystemEvent('Site Added', `New site created: ${site.name}`, user, 'Sites');
      addNotification('success', `Site ${site.name} created successfully`);
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to create site');
    }
  }, []);

  const updateSite = useCallback(async (site: Site, user: string) => {
    try {
      const updated = await sitesService.update(site.id, site);
      setSites(prev => prev.map(s => s.id === site.id ? updated : s));
      logSystemEvent('Site Updated', `Site updated: ${site.name}`, user, 'Sites');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update site');
    }
  }, []);

  const deleteSite = useCallback(async (id: string, user: string) => {
    try {
      await sitesService.delete(id);
      setSites(prev => prev.filter(s => s.id !== id));
      logSystemEvent('Site Deleted', `Site deleted: ${id}`, user, 'Sites');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete site');
    }
  }, []);

  const addProduct = useCallback(async (product: Product): Promise<Product | undefined> => {
    console.log('🧪 DataContext: addProduct called with:', product);
    const targetSiteId = product.siteId || product.site_id || activeSite?.id;
    try {
      if (!activeSite?.id) {
        addNotification('alert', 'No active site selected. Cannot add product.');
        return undefined;
      }

      // ============================================================
      // VALIDATION: Prevent common data quality issues
      // ============================================================

      // 1. Validate price is set (Warn only, allow 0 for initial receiving)
      if (!product.price || product.price <= 0) {
        console.warn(`Creating product "${product.name}" with invalid price: ${product.price}. Proceeding anyway.`);
      }

      // 2. Get the targetSite to check its type
      const targetSite = sites.find(s => s.id === targetSiteId);

      // 3. Prevent products from being assigned to HQ/Administrative sites
      if (targetSite) {
        const isHQSite = targetSite.type === 'Administration' ||
          targetSite.type === 'Administrative' ||
          targetSite.name?.toLowerCase().includes('hq') ||
          targetSite.name?.toLowerCase().includes('headquarters');

        if (isHQSite) {
          addNotification('alert', `Cannot add products to "${targetSite.name}". HQ/Administrative sites do not hold inventory. Please select a Warehouse or Store.`);
          return undefined;
        }
      }

      // 4. Warn if cost price is not set
      if (!product.costPrice) {
        console.warn(`Product "${product.name}" created without cost price. Profit margins cannot be calculated.`);
      }

      // ============================================================

      const newProduct = await productsService.create({
        ...product,
        site_id: targetSiteId
      });

      console.log('🧪 DataContext: Product created in DB:', newProduct);

      // Update local state immediately
      setProducts(prev => {
        const next = [...prev, newProduct];
        console.log('🧪 DataContext: Local products updated. Count:', next.length);
        return next;
      });
      setAllProducts(prev => [...prev, newProduct]);

      // [FIX] Also update React Query cache
      queryClient.setQueryData(['products', targetSiteId], (old: Product[] | undefined) =>
        old ? [...old, newProduct] : [newProduct]
      );

      addNotification('success', `Product ${product.name} added`);
      logSystemEvent('Product Added', `Product "${product.name}" (SKU: ${product.sku}) created in site ${targetSiteId}`, user?.name || 'System', 'Inventory');
      return newProduct; // Return the created product
    } catch (error: any) {
      console.error('Error adding product:', error);

      // HANDLE DUPLICATE SKU (409 Conflict)
      // If product already exists, fetch and return it so operations can continue
      if (error?.code === '23505' || error?.message?.includes('unique constraints') || error?.status === 409) {
        console.warn(`Product with SKU "${product.sku}" already exists. Fetching existing record...`);
        try {
          // Attempt to find the existing product in the target site
          const existing = await productsService.getBySKU(product.sku, targetSiteId);
          if (existing) {
            // If we found it, verify site match if needed, but for now just return it to unblock flow
            addNotification('info', `Product ${product.sku} already exists. Using existing record.`);

            // Update local state to ensure it's visible
            setProducts(prev => {
              const exists = prev.find(p => p.id === existing.id);
              if (exists) return prev;
              return [existing, ...prev];
            });

            return existing;
          }
        } catch (fetchErr) {
          console.error('Failed to recover existing product:', fetchErr);
        }
        addNotification('alert', `Duplicate SKU! A product with SKU "${product.sku}" already exists but could not be retrieved.`);
      } else {
        addNotification('alert', `Failed to add product: ${error.message || 'Unknown error'}`);
      }
      return undefined;
    }
  }, [activeSite, sites, addNotification, logSystemEvent]);

  const updateProduct = useCallback(async (product: Partial<Product> & { id: string }, updatedBy?: string): Promise<Product | undefined> => {
    try {
      // ============================================================
      // VALIDATION: Prevent common data quality issues
      // ============================================================

      // 1. Validate price is set and greater than 0 (Only if price is being updated)
      if (product.price !== undefined && product.price <= 0) {
        addNotification('alert', 'Product price must be greater than 0. Please set a valid price.');
        return;
      }

      // 2. Check if trying to move product to HQ site
      const targetSiteId = product.siteId || (product as any).site_id;

      // [FIX] Removed auto-reset of activeSiteId to user.siteId.
      // This was causing the view to snap back to home site during global updates.
      if (targetSiteId) {
        const targetSite = sites.find(s => s.id === targetSiteId);
        if (targetSite) {
          const isHQSite = targetSite.type === 'Administration' ||
            targetSite.type === 'Administrative' ||
            targetSite.name?.toLowerCase().includes('hq') ||
            targetSite.name?.toLowerCase().includes('headquarters');

          if (isHQSite) {
            addNotification('alert', `Cannot move product to "${targetSite.name}". HQ/Administrative sites do not hold inventory.`);
            return;
          }
        }
      }

      // ============================================================

      // ============================================================
      // SANITIZATION: Remove fields that shouldn't be sent to DB
      // ============================================================
      const { createdBy, updatedBy, ...sanitizedProduct } = product as any;

      const updated = await productsService.update(product.id, sanitizedProduct);

      // Update local state immediately (Merge updates)
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updated } : p));
      setAllProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updated } : p));

      // [FIX] Also update React Query cache to prevent stale data overwrite
      const updatedSiteId = updated.siteId || updated.site_id;
      if (updatedSiteId) {
        queryClient.setQueryData(['products', updatedSiteId], (old: Product[] | undefined) =>
          old ? old.map(p => p.id === product.id ? { ...p, ...updated } : p) : old
        );
      }

      addNotification('success', `Product ${product.name || updated.name} updated`);
      logSystemEvent('Product Updated', `Product "${product.name || updated.name}" updated`, updatedBy || user?.name || 'System', 'Inventory');
      return updated;
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update product');
      throw error; // Re-throw to allow caller to handle error
    }
  }, [addNotification, logSystemEvent, user, sites]);

  const updatePricesBySKU = useCallback(async (sku: string, updates: { price: number; costPrice?: number; salePrice?: number; isOnSale?: boolean }) => {
    try {
      const updatedProducts = await productsService.updatePricesBySKU(sku, updates);

      // Update local state for all matching products
      const updatedIds = new Set(updatedProducts.map(p => p.id));

      setProducts(prev => prev.map(p => updatedIds.has(p.id) ? { ...p, ...updates } : p));
      setAllProducts(prev => prev.map(p => updatedIds.has(p.id) ? { ...p, ...updates } : p));

      // [FIX] Also update React Query cache for all affected sites
      const affectedSiteIds = new Set(updatedProducts.map(p => p.siteId || p.site_id).filter(Boolean));
      affectedSiteIds.forEach(siteId => {
        queryClient.setQueryData(['products', siteId], (old: Product[] | undefined) =>
          old ? old.map(p => updatedIds.has(p.id) ? { ...p, ...updates } : p) : old
        );
      });

      addNotification('success', `Synchronized prices for SKU ${sku} across ${updatedProducts.length} locations`);
      logSystemEvent('Global Price Sync', `SKU ${sku} prices updated network-wide`, user?.name || 'System', 'Inventory');
    } catch (error) {
      console.error('Global Price Sync Error:', error);
      addNotification('alert', 'Failed to synchronize prices globally');
      throw error;
    }
  }, [addNotification, logSystemEvent, user]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await productsService.cascadeDelete(id);

      // Invalidate products query instead of manual state updates
      queryClient.invalidateQueries({ queryKey: ['products'] });

      addNotification('success', 'Product and related records deleted permanently');
      logSystemEvent('Product Deleted', `Product with ID ${id} and all related records deleted permanently`, user?.name || 'System', 'Inventory');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete product');
      throw error;
    }
  }, [addNotification, logSystemEvent, user, queryClient]);

  const relocateProduct = useCallback(async (productId: string, newLocation: string, user: string) => {
    try {
      const product = allProducts.find(p => p.id === productId);
      const currentLocations = product?.location ? product.location.split(',').map(l => l.trim()) : [];

      if (currentLocations.includes(newLocation.trim())) {
        console.log(`📍 Product ${productId} already assigned to location ${newLocation}. Skipping append.`);
        return;
      }

      const updatedLocation = product?.location
        ? `${product.location}, ${newLocation.trim()}`
        : newLocation.trim();

      await productsService.update(productId, { location: updatedLocation });

      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['products'] });

      logSystemEvent('Product Relocated', `Product ${productId} added to location ${newLocation}`, user, 'Inventory');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to relocate product');
    }
  }, [allProducts, queryClient, logSystemEvent, addNotification]);

  const cleanupAdminProducts = useCallback(async () => {
    try {
      // Find all products assigned to HQ
      const hqProducts = allProducts.filter(p => p.siteId === 'Administration' || p.site_id === 'Administration');

      if (hqProducts.length === 0) {
        addNotification('info', 'No HQ products found. Database is clean!');
        return;
      }

      console.log(`🧹 Found ${hqProducts.length} products in HQ. Removing...`);

      // Delete each HQ product
      const deletePromises = hqProducts.map(product => productsService.delete(product.id));
      await Promise.all(deletePromises);

      // Update local state
      setProducts(prev => prev.filter(p => p.siteId !== 'Administration' && p.site_id !== 'Administration'));
      setAllProducts(prev => prev.filter(p => p.siteId !== 'Administration' && p.site_id !== 'Administration'));

      addNotification('success', `✅ Removed ${hqProducts.length} products from HQ. Database cleaned!`);
      logSystemEvent('Data Cleanup', `Removed ${hqProducts.length} HQ products`, 'System', 'Inventory');
    } catch (error) {
      console.error('Failed to cleanup HQ products:', error);
      addNotification('alert', 'Failed to cleanup HQ products');
    }
  }, [allProducts, addNotification, logSystemEvent]);

  const createPO = useCallback(async (po: PurchaseOrder): Promise<PurchaseOrder | undefined> => {
    try {
      // Extract line items from the PO
      const items = po.lineItems || [];

      console.log('Creating PO with data:', po);

      // Create the PO in the database
      // NOTE: We pass po.siteId directly. DataContext should not override it if it's already set.
      const newPO = await purchaseOrdersService.create({
        ...po,
        poNumber: po.poNumber || po.id, // Pass Human ID as poNumber
        siteId: po.siteId || activeSite?.id || 'HQ'
      }, items);

      // Update local state (both site-specific and global)
      setOrders(prev => [newPO, ...prev]);
      setAllOrders(prev => [newPO, ...prev]);
      addNotification('success', `PO #${newPO.id.slice(0, 8)} created successfully`);

      // Refresh orders from DB to ensure consistency
      const allUpdatedOrders = await purchaseOrdersService.getAll().then(res => res.data); // Get all orders
      setAllOrders(allUpdatedOrders); // Update global orders

      // Update site-specific orders (filter by active site)
      if (activeSiteId) {
        const siteOrders = await purchaseOrdersService.getAll(activeSiteId).then(res => res.data);
        setOrders(siteOrders);
      } else {
        setOrders(allUpdatedOrders); // Fallback to all if no site selected
      }
      return newPO;
    } catch (error) {
      console.error('Error creating PO:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('PO data that failed:', JSON.stringify(po, null, 2));

      // Fallback: Save to local state even if database fails
      const localPO: PurchaseOrder = {
        ...po,
        id: po.id || `REF-${Date.now()}`,
        siteId: po.siteId || activeSite?.id || 'SITE-001'
      };

      setOrders(prev => [localPO, ...prev]);
      setAllOrders(prev => [localPO, ...prev]); // Also update allOrders
      addNotification('success', `PO #${localPO.id.slice(0, 8)} created (local - DB Failed: ${error instanceof Error ? error.message : String(error)})`);
    }
  }, [activeSite, activeSiteId, addNotification]);

  const updatePO = useCallback(async (po: PurchaseOrder) => {
    try {
      await purchaseOrdersService.update(po.id, po);
      setOrders(prev => prev.map(o => o.id === po.id ? po : o));
      setAllOrders(prev => prev.map(o => o.id === po.id ? po : o)); // Also update allOrders
      addNotification('success', `PO ${po.id} updated`);
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update PO');
    }
  }, [addNotification]);

  const receivePO = useCallback(async (poId: string, receivedItems?: ReceivingItem[], skuDecisions?: Record<string, 'keep' | 'generate'>, scannedSkus?: Record<string, string>) => {
    try {
      // Find the PO to get line items
      const po = orders.find(o => o.id === poId);
      if (!po) {
        console.error('PO not found:', poId);
        addNotification('alert', 'Purchase Order not found');
        return;
      }

      console.log('📦 Receiving PO:', {
        poId,
        siteId: po.siteId,
        lineItems: po.lineItems?.length,
        skuDecisions,
        scannedSkus
      });

      // Check if VALID jobs already exist for this PO to prevent duplicates
      // REMOVED: Aggressive check for valid jobs. We now rely on explicit receivedItems filter to control what gets created.
      // This allows creating jobs for Item B even if Item A was already received.

      if (po.lineItems && po.lineItems.length > 0) {
        // Use PO's siteId (which should be a UUID from database)
        const targetSiteId = po.siteId || po.site_id;

        if (!targetSiteId) {
          console.error('❌ PO has no siteId!', po);
          addNotification('alert', 'PO has no site assignment');
          return;
        }

        // STRICT SITE ISOLATION: Prevent receiving POs if active site doesn't match
        if (activeSiteId && targetSiteId !== activeSiteId) {
          console.error(`❌ SITE MISMATCH: PO Site (${targetSiteId}) !== Active Site (${activeSiteId})`);
          addNotification('alert', 'Cannot receive PO for different site. Please switch to correct site.');
          return;
        }

        console.log('📦 receivePO called. ReceivedItems:', receivedItems?.length, JSON.stringify(receivedItems, null, 2));

        // Create putaway jobs for each line item
        // Filter items if targetProductIds is provided (for partial receiving)
        let itemsToProcess = po.lineItems;

        if (receivedItems && receivedItems.length > 0) {
          const targetIds = new Set(receivedItems.map(r => r.productId).filter(Boolean));
          const targetItemIds = new Set(receivedItems.map(r => r.id).filter(Boolean)); // Support matching by PO Item ID (for new products)

          console.log('🎯 Filtering targets:', {
            productIds: Array.from(targetIds),
            itemIds: Array.from(targetItemIds)
          });

          itemsToProcess = po.lineItems.filter(item =>
            (item.productId && targetIds.has(item.productId)) ||
            (item.id && targetItemIds.has(item.id))
          );
        }

        console.log('📋 PO LineItems:', po.lineItems?.map(i => ({ id: i.id, productId: i.productId, name: i.productName })));
        console.log('🏗️ Processing Items Count:', itemsToProcess.length, itemsToProcess.map(i => ({ id: i.id, productId: i.productId })));
        console.log('🏗️ Creating PUTAWAY jobs for site:', targetSiteId);

        // 🔢 FIND PERSISTENT JOB NUMBER
        // Use initial RECEIVE job number if it exists, otherwise use PO number
        const { data: receiveJob } = await supabase
          .from('wms_jobs')
          .select('job_number')
          .eq('order_ref', poId)
          .eq('type', 'RECEIVE')
          .maybeSingle();

        // STRICT: User requires PO Number to be the primary identifier
        // If receiveJob exists, checks if it has a properly formatted number, else defaults to PO
        const persistentJobNumber = po.poNumber || po.po_number || poId;

        const jobPromises = itemsToProcess.map(async (item, index) => {
          let targetProductId = item.productId;

          // Get the received data for this item (qty, etc)
          const receivedData = receivedItems?.find(r =>
            (r.productId && r.productId === item.productId) ||
            (r.id && r.id === item.id)
          );
          const qtyToReceive = receivedData ? receivedData.quantity : item.quantity;

          // 🛡️ [DUPLICATE CHECK] Skip if identical putaway job was created recently
          // This allows partial receipts (different quantities) but blocks rapid double-clicks.
          const existingJob = jobs.find(j => {
            const isSamePO = (j.orderRef === poId || j.orderRef === persistentJobNumber);
            const isPutaway = j.type === 'PUTAWAY';
            const hasProduct = j.lineItems?.some((li: any) => li.productId === item.productId);
            if (!isSamePO || !isPutaway || !hasProduct) return false;

            const sameQty = j.lineItems?.some((li: any) => li.productId === item.productId && li.expectedQty === qtyToReceive);
            const createdTime = new Date(j.createdAt || Date.now()).getTime();
            const isRecent = (Date.now() - createdTime) < 10000; // 10s window

            return sameQty && isRecent;
          });

          if (existingJob) {
            console.log(`⚠️ Skipping duplicate: Recent identical PUTAWAY job exists for ${item.productName} (Job: ${existingJob.id})`);
            addNotification('info', `${item.productName} already had a job created recently`);
            return { job: existingJob, productId: item.productId, sku: existingJob.lineItems?.[0]?.sku || 'UNKNOWN' };
          }

          // Try to find the source product to get info
          const sourceProduct = allProducts.find(p => p.id === item.productId);

          if (sourceProduct) {
            // It's a catalog product. Check if it exists at the destination site.
            const sku = sourceProduct.sku;
            const existingSiteProduct = allProducts.find(p =>
              p.sku === sku && (p.siteId === targetSiteId || p.site_id === targetSiteId)
            );

            if (existingSiteProduct) {
              targetProductId = existingSiteProduct.id;
            } else {
              // Auto-create product for site
              try {
                const newProductData = {
                  ...sourceProduct,
                  id: undefined,
                  siteId: targetSiteId,
                  site_id: targetSiteId,
                  stock: 0,
                  posReceivedAt: null,
                  pos_received_at: null
                };
                delete (newProductData as any).id;
                delete (newProductData as any).created_at;
                delete (newProductData as any).updated_at;

                const newProduct = await productsService.create(newProductData as any);
                targetProductId = newProduct.id;
                setAllProducts(prev => [...prev, newProduct]);
                if (targetSiteId === activeSiteId) setProducts(prev => [...prev, newProduct]);
              } catch (err) {
                console.error("❌ Failed to auto-create site product:", err);
              }
            }
          }

          const product = allProducts.find(p => p.id === targetProductId) || sourceProduct;
          const productName = product?.name || item.productName;
          const productCategory = product?.category || 'General';

          // SKU & Barcode Logic
          let productSku: string;
          let needsSkuUpdate = false;
          const userDecision = item.productId ? skuDecisions?.[item.productId] : undefined;
          const scannedSku = item.productId ? scannedSkus?.[item.productId] : undefined;

          if (scannedSku && scannedSku.trim() !== '') {
            productSku = scannedSku.trim().toUpperCase();
            needsSkuUpdate = true;
          } else if (product?.sku && product.sku.trim() !== '' && product.sku !== 'MISC') {
            if (userDecision === 'generate') {
              productSku = generateSKU(productCategory, allProducts);
              needsSkuUpdate = true;
            } else {
              productSku = product.sku;
            }
          } else if (item.sku && item.sku.trim() !== '' && item.sku !== 'MISC') {
            productSku = item.sku;
            needsSkuUpdate = true;
          } else {
            productSku = generateSKU(productCategory, allProducts);
            needsSkuUpdate = true;
          }

          // Handle Manual Items
          if (!product && !targetProductId) {
            const existingByName = allProducts.find(p =>
              p.name.toLowerCase() === productName.toLowerCase() &&
              (p.siteId === targetSiteId || p.site_id === targetSiteId)
            );

            if (existingByName) {
              targetProductId = existingByName.id;
              if (item.id) {
                await supabase.from('po_items').update({ product_id: existingByName.id }).eq('id', item.id);
                setOrders(prev => prev.map(o => o.id === poId ? {
                  ...o,
                  lineItems: o.lineItems?.map(li => li.id === item.id ? { ...li, productId: existingByName.id } : li)
                } : o));
              }
            } else {
              try {
                const newP = await productsService.create({
                  name: productName,
                  sku: productSku,
                  category: productCategory,
                  price: item.retailPrice || item.unitCost || 0,
                  costPrice: item.unitCost || 0,
                  siteId: targetSiteId,
                  site_id: targetSiteId,
                  stock: 0,
                  status: 'active'
                } as any);
                targetProductId = newP.id;
                setAllProducts(prev => [...prev, newP]);
                if (targetSiteId === activeSiteId) setProducts(prev => [...prev, newP]);
                if (item.id) {
                  await supabase.from('po_items').update({ product_id: newP.id }).eq('id', item.id);
                  setOrders(prev => prev.map(o => o.id === poId ? {
                    ...o,
                    lineItems: o.lineItems?.map(li => li.id === item.id ? { ...li, productId: newP.id } : li)
                  } : o));
                }
              } catch (err) {
                console.error('Failed to create manual product', err);
              }
            }
          }

          // Sync Product Pricing & Identity (Critical for Real-Time Valuation)
          if (product || targetProductId) {
            const pidToUpdate = product?.id || targetProductId;
            if (pidToUpdate) {
              const updateData: any = {};

              // 1. Sync Valuation - ALWAYS update from latest PO receipt
              if (item.unitCost && item.unitCost > 0) {
                const currentCost = (product as any)?.costPrice || 0;
                if (item.unitCost !== currentCost) {
                  console.log(`💰 Updating costPrice: ${currentCost} → ${item.unitCost}`);
                  updateData.costPrice = item.unitCost;
                }
              }
              if (item.retailPrice && item.retailPrice > 0) {
                const currentPrice = product?.price || 0;
                if (item.retailPrice !== currentPrice) {
                  console.log(`💰 Updating retailPrice: ${currentPrice} → ${item.retailPrice}`);
                  updateData.price = item.retailPrice;
                }
              }

              // 2. Sync SKU if needed
              if (needsSkuUpdate) updateData.sku = productSku;

              // 3. Sync Barcodes (Robust Multi-Barcode Logic)
              if (scannedSku && scannedSku.trim() !== '') {
                const cleanScan = scannedSku.trim();
                const isEAN = /^\d{12,13}$/.test(cleanScan);
                const isUPC = /^\d{8,12}$/.test(cleanScan);
                if (isEAN || isUPC || /^[A-Z0-9]{6,20}$/i.test(cleanScan)) {
                  const currentBarcodes = product?.barcodes || [];
                  const currentPrimary = product?.barcode;

                  // Maintain Legacy Primary if missing
                  if (!currentPrimary) {
                    updateData.barcode = cleanScan;
                    updateData.barcodeType = isEAN ? 'EAN-13' : isUPC ? 'UPC-A' : 'CODE128';
                  }

                  // Append to Aliases if new
                  if (!currentBarcodes.includes(cleanScan) && cleanScan !== currentPrimary) {
                    updateData.barcodes = [...currentBarcodes, cleanScan];
                  }
                }
              }

              if (Object.keys(updateData).length > 0) {
                console.log(`🔄 Syncing product ${productSku} details from PO:`, updateData);
                try {
                  const updatedP = await productsService.update(pidToUpdate, updateData);
                  setAllProducts(prev => prev.map(p => p.id === pidToUpdate ? updatedP : p));
                  if (targetSiteId === activeSiteId) setProducts(prev => prev.map(p => p.id === pidToUpdate ? updatedP : p));
                } catch (err) {
                  console.error('❌ Failed to sync product details from PO:', err);
                }
              }
            }
          }

          // [NEW] robust: Persist received_qty to po_items for History accuracy
          if (item.id) {
            await supabase.from('po_items').update({
              received_qty: qtyToReceive
              // updated_at: new Date().toISOString() // Removed: Column does not exist in po_items
            }).eq('id', item.id);
          }

          // 🏗️ CREATE PUTAWAY JOB
          const jobNotes = [
            (po as any).notes,
            receivedData?.temperature ? `Temp: ${receivedData.temperature}°C` : null
          ].filter(Boolean).join(' | ');

          const newJob: Omit<WMSJob, 'id' | 'created_at' | 'updated_at'> = {
            siteId: targetSiteId,
            site_id: targetSiteId,
            type: 'PUTAWAY',
            status: 'Pending',
            priority: (po as any).priority || 'Normal',
            assignedTo: '',
            location: 'Receiving Dock',
            items: 1,
            // 🛡️ CHANGED: Use UUID for data integrity (User Request)
            orderRef: poId,
            // jobNumber: Auto-generated by service (Standard 4-char)
            notes: jobNotes,
            lineItems: [{
              productId: targetProductId!,
              name: productName,
              sku: product?.sku || productSku, // Use product's SKU if available, otherwise the determined one
              image: product?.image || '',
              expectedQty: qtyToReceive || 0,
              pickedQty: 0,
              status: 'Pending',
              expiryDate: receivedData?.expiryDate,
              batchNumber: receivedData?.batchNumber,
              condition: (receivedData?.condition as any) || 'Good'
            }]
          };

          try {
            const createdJob = await wmsJobsService.create(newJob as any);
            return { job: createdJob, productId: targetProductId, sku: productSku };
          } catch (e) {
            console.error('❌ Failed to create WMS job:', e);
            return { job: { ...newJob, id: crypto.randomUUID() } as WMSJob, productId: targetProductId, sku: productSku };
          }
        });

        const results = await Promise.all(jobPromises);
        const createdJobs = results.map(r => r.job);

        const finalizedSkus: Record<string, string> = {};
        results.forEach(r => { if (r.productId && r.sku) finalizedSkus[r.productId] = r.sku; });

        logSystemEvent('Stock Received', `Received ${itemsToProcess.length} items for PO ${po.poNumber || poId}`, user?.name || 'Manager', 'Inventory');

        // 🔥 CRITICAL: Complete the RECEIVE job now that PUTAWAY jobs have been created
        try {
          console.log('🔍 [receivePO] Searching for RECEIVE job to complete:', { poId, persistentJobNumber });

          // Try finding by PO ID first, then by PO Number
          let { data: receiveJobToComplete } = await supabase
            .from('wms_jobs')
            .select('id, order_ref, status')
            .eq('order_ref', poId)
            .eq('type', 'RECEIVE')
            .neq('status', 'Completed')
            .maybeSingle();

          // Fallback: Try with PO Number if not found by UUID
          if (!receiveJobToComplete && persistentJobNumber && persistentJobNumber !== poId) {
            console.log('🔍 [receivePO] Fallback: searching by PO Number:', persistentJobNumber);
            const fallback = await supabase
              .from('wms_jobs')
              .select('id, order_ref, status')
              .eq('order_ref', persistentJobNumber)
              .eq('type', 'RECEIVE')
              .neq('status', 'Completed')
              .maybeSingle();
            receiveJobToComplete = fallback.data;
          }

          if (receiveJobToComplete) {
            console.log('✅ [receivePO] Found RECEIVE job to complete:', receiveJobToComplete);
            const { error: updateError } = await supabase
              .from('wms_jobs')
              .update({
                status: 'Completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', receiveJobToComplete.id);

            if (updateError) {
              console.error('❌ [receivePO] Failed to update job status:', updateError);
            } else {
              console.log('✅ [receivePO] Successfully marked RECEIVE job as Completed:', receiveJobToComplete.id);
            }
          } else {
            console.log('⚠️ [receivePO] No pending RECEIVE job found for this PO');
          }
        } catch (jobErr) {
          console.error('⚠️ Could not complete RECEIVE job:', jobErr);
        }

        if (targetSiteId) {
          const js = await wmsJobsService.getAll(targetSiteId);
          setJobs(js);
        } else {
          setJobs(prev => [...prev, ...createdJobs]);
        }

        try {
          const allJobsForPO = [...jobs, ...createdJobs].filter(j => j.orderRef === poId); // Count ALL jobs (Pending, In Progress, Completed)
          let allReceived = true;
          po.lineItems?.forEach(item => {
            const totalJobQty = allJobsForPO.reduce((sum, job) => {
              const jobItem = job.lineItems.find((ji: any) => ji.productId === item.productId);
              return sum + (jobItem ? jobItem.expectedQty : 0);
            }, 0);
            if (totalJobQty < item.quantity) allReceived = false;
          });

          if (allReceived) {
            const updatedPo = await purchaseOrdersService.receive(poId, false);
            if (updatedPo) {
              setOrders(prev => prev.map(o => o.id === poId ? updatedPo : o));
              setAllOrders(prev => prev.map(o => o.id === poId ? updatedPo : o));
            }
            addNotification('success', `PO ${poId} fully received!`);
          } else {
            addNotification('success', `Items received. PO remains open for remaining inventory.`);
          }
          return finalizedSkus;
        } catch (error) {
          console.error(error);
          return finalizedSkus;
        }
      }


    } catch (error) {
      console.error('Error in receivePO:', error);
      addNotification('alert', 'Error processing reception');
    }
  }, [orders, addNotification, activeSiteId, allProducts, sites, logSystemEvent]);

  const deletePO = useCallback(async (poId: string) => {
    try {
      await purchaseOrdersService.delete(poId);
      setOrders(prev => prev.filter(o => o.id !== poId));
      setAllOrders(prev => prev.filter(o => o.id !== poId)); // Also update allOrders
      addNotification('success', 'PO deleted');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete PO');
    }
  }, [addNotification]);

  // Split Receiving: Receive one PO line item as multiple SKU variants
  const receivePOSplit = useCallback(async (
    poId: string,
    itemId: string,
    variants: Array<{
      sku: string;
      skuType: 'existing' | 'new';
      productId?: string;
      productName?: string;
      quantity: number;
      barcode?: string;
    }>
  ) => {
    try {
      const po = orders.find(o => o.id === poId);
      if (!po) {
        addNotification('alert', 'Purchase Order not found');
        return;
      }

      const item = po.lineItems?.find(i => i.id === itemId);
      if (!item) {
        addNotification('alert', 'Item not found in PO');
        return;
      }

      // Validate total quantities - compare against REMAINING qty (not original qty)
      const remainingQty = item.quantity - (item.receivedQty || 0);
      const totalQty = variants.reduce((sum, v) => sum + v.quantity, 0);

      console.log('📊 Quantity validation:', {
        originalQty: item.quantity,
        receivedQty: item.receivedQty,
        remainingQty,
        variantTotalQty: totalQty,
        variants: variants.map(v => ({ sku: v.sku, qty: v.quantity }))
      });

      // Allow receiving up to the remaining quantity (not exact match required)
      // Check if item is already fully (or over) received
      if (remainingQty <= 0) {
        addNotification('alert', `This item has already been fully received (${item.receivedQty || 0}/${item.quantity}). No more units needed.`);
        return;
      }
      if (totalQty <= 0) {
        addNotification('alert', `Please enter a valid quantity to receive`);
        return;
      }
      if (totalQty > remainingQty) {
        addNotification('alert', `Cannot receive ${totalQty} units. Only ${remainingQty} remaining to receive.`);
        return;
      }

      const targetSiteId = po.siteId || po.site_id || activeSiteId;
      if (!targetSiteId) {
        addNotification('alert', 'No site ID available');
        return;
      }

      const persistentJobNumber = po.poNumber || po.po_number || poId;

      console.log('🔍 receivePOSplit: Starting variant processing', {
        persistentJobNumber,
        targetSiteId,
        variantsCount: variants.length,
        variants: variants.map(v => ({ sku: v.sku, qty: v.quantity, productId: v.productId }))
      });

      // Process each variant
      const jobPromises = variants.map(async (variant, index) => {
        let targetProductId = variant.productId;

        // ROBUST SKU RESOLUTION
        // 1. Prefer variant SKU if explicitly provided
        // 2. Fallback to existing Product SKU if we have a productId
        // 3. Fallback to PO Item SKU if valid
        let productSku: string = variant.sku || '';

        if (!productSku && targetProductId) {
          const existingProduct = allProducts.find(p => p.id === targetProductId);
          if (existingProduct && existingProduct.sku) productSku = existingProduct.sku;
        }

        if (!productSku && (variant.skuType === 'existing' || !variant.skuType)) {
          productSku = item.sku || '';
        }

        // Final Fallback to prevent "N/A"
        if (!productSku) productSku = 'UNKNOWN-SKU';

        console.log(`🔄 Processing variant ${index + 1}:`, {
          sku: productSku,
          skuType: variant.skuType,
          productId: targetProductId,
          quantity: variant.quantity
        });

        // 🛡️ DUPLICATE CHECK: Skip if RECENT identical putaway job exists (prevent double-submit)
        // We only block if it's the SAME product, SAME quantity, and created < 2 mins ago involved in the same PO.
        // This allows split receiving (receiving more later) but stops accidental double-clicks.
        if (targetProductId) {
          const existingJob = jobs.find(j => {
            const isSamePO = (j.orderRef === persistentJobNumber || j.orderRef === poId);
            const isPutaway = j.type === 'PUTAWAY';
            const hasProduct = j.lineItems?.some((li: any) => li.productId === targetProductId);

            if (!isSamePO || !isPutaway || !hasProduct) return false;

            // Check for identical quantity in the line item
            const sameQty = j.lineItems?.some((li: any) => li.productId === targetProductId && li.expectedQty === variant.quantity);

            // Check if created recently (< 5 seconds)
            const createdTime = new Date(j.createdAt || Date.now()).getTime();
            const isRecent = (Date.now() - createdTime) < 5000;

            return sameQty && isRecent;
          });

          if (existingJob) {
            console.log(`⚠️ Skipping match: Recent identical PUTAWAY job exists (Job: ${existingJob.id})`);
            addNotification('info', `A Putaway job for this item was just created.`);
            return existingJob; // Return existing job so UI updates
          }
        }

        // Handle NEW products during Procurement Receiving
        // The PO itself is authorization - no CEO approval needed. Auto-create the product.
        if (variant.skuType === 'new' && !targetProductId) {
          const templateProduct = allProducts.find(p => p.id === item.productId);

          console.log('🆕 Creating new product for Procurement receiving:', {
            sku: productSku,
            name: variant.productName || item.productName,
            siteId: targetSiteId
          });

          try {
            const newProduct = await productsService.create({
              name: variant.productName || item.productName,
              sku: productSku,
              category: templateProduct?.category || 'General',
              price: templateProduct?.price || 0,
              costPrice: templateProduct?.costPrice || templateProduct?.price || 0,
              stock: 0, // Will be updated by Putaway job
              minStock: 0,
              siteId: targetSiteId,
              site_id: targetSiteId,
              location: '',
              image: templateProduct?.image || '/placeholder.png',
              barcode: variant.barcode || '',
              unit: 'pcs',
              status: 'active'
            } as any);

            // CRITICAL: Validate that we got a valid UUID
            if (newProduct?.id && typeof newProduct.id === 'string' && newProduct.id.length > 10) {
              console.log('✅ New product created with valid ID:', newProduct.id, productSku);
              targetProductId = newProduct.id;

              // Update local products state so it's available for subsequent operations
              setAllProducts(prev => [...prev, newProduct as any]);
              addNotification('success', `Created new product: ${productSku}`);
            } else {
              console.error('❌ Product creation returned invalid ID:', newProduct);
              addNotification('alert', `Product creation failed for ${productSku} - invalid ID returned`);
              return null;
            }
          } catch (createErr) {
            console.error('❌ Failed to create new product:', createErr);
            addNotification('alert', `Failed to create product ${productSku}`);
            return null;
          }
        }

        // CRITICAL FIX: If productId is still missing, try to find product by SKU
        // This handles cases where product exists but wasn't linked properly
        if (!targetProductId && productSku) {
          console.log(`🔍 ProductId missing for SKU: ${productSku}. Searching in allProducts...`);
          const existingProduct = allProducts.find(p =>
            p.sku === productSku ||
            p.sku?.toLowerCase() === productSku.toLowerCase()
          );

          if (existingProduct) {
            console.log(`✅ Found existing product by SKU: ${existingProduct.id}`);
            targetProductId = existingProduct.id;
          }
        }

        // For existing products (or newly created above), create PUTAWAY job
        if (!targetProductId) {
          console.error(`❌ FATAL: Product ID not found for SKU: ${productSku}. Cannot create PUTAWAY job.`);
          addNotification('alert', `Cannot create Putaway job - Product not linked for SKU: ${productSku}`);
          return null;
        }

        // Sync Product Pricing (Valuation Accuracy)
        const variantProduct = allProducts.find(p => p.id === targetProductId);
        if (variantProduct && variant.skuType !== 'new') { // Optimization: don't re-sync if just created
          const syncData: any = {};
          // Sync Valuation - ALWAYS update from latest PO receipt
          if (item.unitCost && item.unitCost > 0) {
            const currentCost = (variantProduct as any)?.costPrice || 0;
            if (item.unitCost !== currentCost) {
              console.log(`💰 Split: Updating costPrice: ${currentCost} → ${item.unitCost}`);
              syncData.costPrice = item.unitCost;
            }
          }
          if (item.retailPrice && item.retailPrice > 0) {
            const currentPrice = variantProduct?.price || 0;
            if (item.retailPrice !== currentPrice) {
              console.log(`💰 Split: Updating retailPrice: ${currentPrice} → ${item.retailPrice}`);
              syncData.price = item.retailPrice;
            }
          }

          if (Object.keys(syncData).length > 0) {
            console.log(`🔄 receivePOSplit: Syncing product valuation for ${productSku}:`, syncData);
            try {
              const updatedP = await productsService.update(targetProductId, syncData);
              setAllProducts(prev => prev.map(p => p.id === targetProductId ? updatedP : p));
              if (targetSiteId === activeSiteId) setProducts(prev => prev.map(p => p.id === targetProductId ? updatedP : p));
            } catch (err) {
              console.error('❌ Failed to sync product details in split receive:', err);
            }
          }
        }

        const newJob: Omit<WMSJob, 'id'> = {
          type: 'PUTAWAY',
          status: 'Pending',
          siteId: targetSiteId,
          site_id: targetSiteId,
          sourceSiteId: targetSiteId,
          destSiteId: targetSiteId,
          assignedTo: null as any,
          createdAt: new Date().toISOString(),
          // 🛡️ CHANGED: Use UUID for data integrity (User Request)
          orderRef: po.id,
          // jobNumber: Auto-generated by service now
          notes: `Split receiving - Variant ${index + 1}/${variants.length}`,
          location: 'Receiving Dock',
          priority: 'Normal',
          items: variant.quantity,
          lineItems: [{
            productId: targetProductId,
            name: variantProduct?.name || variant.productName || item.productName,
            sku: productSku,
            image: variantProduct?.image || '',
            expectedQty: variant.quantity,
            pickedQty: 0,
            status: 'Pending',
            barcode: variant.barcode,
            condition: 'Good'
          } as any]
        };

        try {
          const createdJob = await wmsJobsService.create(newJob as any);
          return createdJob;
        } catch (e) {
          console.error('❌ Failed to create WMS job for variant:', e);
          return null;
        }
      });

      const results = await Promise.all(jobPromises);
      const createdJobs = results.filter(j => j !== null) as WMSJob[];

      console.log('📤 receivePOSplit: Job creation results:', {
        totalVariants: variants.length,
        createdJobsCount: createdJobs.length,
        jobIds: createdJobs.map(j => j.id),
        nulls: results.filter(j => j === null).length
      });

      if (createdJobs.length > 0) {
        // 🔥 UPDATE LOCAL STATE: Add created jobs to state so they're immediately visible
        // Filter out any duplicates (realtime subscription may also add these)
        setJobs(prev => {
          const newJobIds = new Set(createdJobs.map(j => j.id));
          const filteredPrev = prev.filter(j => !newJobIds.has(j.id));
          return [...createdJobs, ...filteredPrev];
        });

        // 🔥 CRITICAL FIX: Update received_qty in po_items table
        // Calculate total received quantity ONLY for successfully created jobs (Fixes integrity bug)
        const totalReceivedQty = createdJobs.reduce((sum, job) => sum + (job.items || 0), 0);

        try {
          await supabase
            .from('po_items')
            .update({ received_qty: (item.receivedQty || 0) + totalReceivedQty })
            .eq('id', itemId);

          console.log(`✅ Updated po_items.received_qty for item ${itemId}: ${(item.receivedQty || 0)} + ${totalReceivedQty} = ${(item.receivedQty || 0) + totalReceivedQty}`);

          // Update local state to reflect the change immediately
          setOrders(prev => prev.map(o => {
            if (o.id !== poId) return o;
            return {
              ...o,
              lineItems: o.lineItems?.map(li =>
                li.id === itemId
                  ? { ...li, receivedQty: (li.receivedQty || 0) + totalReceivedQty }
                  : li
              )
            };
          }));

          setAllOrders(prev => prev.map(o => {
            if (o.id !== poId) return o;
            return {
              ...o,
              lineItems: o.lineItems?.map(li =>
                li.id === itemId
                  ? { ...li, receivedQty: (li.receivedQty || 0) + totalReceivedQty }
                  : li
              )
            };
          }));
        } catch (err) {
          console.error('❌ Failed to update po_items.received_qty:', err);
        }

        logSystemEvent(
          'Split Receiving',
          `Split received ${item.productName} into ${variants.length} variants for PO ${persistentJobNumber}`,
          user?.name || 'Manager',
          'Inventory'
        );

        // 🔥 NEW: Explicitly complete the RECEIVE job for this PO
        try {
          console.log('🔍 Searching for RECEIVE job to complete:', { poId, persistentJobNumber });

          // Try finding by PO ID first, then by PO Number
          let { data: receiveJob } = await supabase
            .from('wms_jobs')
            .select('id, order_ref, status')
            .eq('order_ref', poId)
            .eq('type', 'RECEIVE')
            .neq('status', 'Completed')
            .maybeSingle();

          // Fallback: Try with PO Number if not found by UUID
          if (!receiveJob && persistentJobNumber && persistentJobNumber !== poId) {
            console.log('🔍 Fallback: searching by PO Number:', persistentJobNumber);
            const fallback = await supabase
              .from('wms_jobs')
              .select('id, order_ref, status')
              .eq('order_ref', persistentJobNumber)
              .eq('type', 'RECEIVE')
              .neq('status', 'Completed')
              .maybeSingle();
            receiveJob = fallback.data;
          }

          if (receiveJob) {
            console.log('✅ Found RECEIVE job to complete:', receiveJob);
            const { error: updateError } = await supabase
              .from('wms_jobs')
              .update({
                status: 'Completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', receiveJob.id);

            if (updateError) {
              console.error('❌ Failed to update job status:', updateError);
            } else {
              console.log('✅ Successfully marked RECEIVE job as Completed:', receiveJob.id);
            }
          } else {
            console.log('⚠️ No pending RECEIVE job found for this PO');
          }
        } catch (jobErr) {
          console.error('⚠️ Could not complete associated RECEIVE job:', jobErr);
        }

        // Check if PO is fully received (using updated received quantities)
        const updatedPO = orders.find(o => o.id === poId);
        if (!updatedPO) return;

        let allReceived = true;
        updatedPO.lineItems?.forEach(poItem => {
          const currentReceivedQty = (poItem.id === itemId)
            ? (poItem.receivedQty || 0) + totalReceivedQty
            : (poItem.receivedQty || 0);

          if (currentReceivedQty < poItem.quantity) {
            allReceived = false;
          }
        });

        if (allReceived) {
          const updatedPo = await purchaseOrdersService.receive(poId, false);
          if (updatedPo) {
            setOrders(prev => prev.map(o => o.id === poId ? updatedPo : o));
            setAllOrders(prev => prev.map(o => o.id === poId ? updatedPo : o));
          }
          addNotification('success', `PO ${persistentJobNumber} fully received!`);
        } else {
          addNotification('success', `Received ${totalReceivedQty} units. ${createdJobs.length} PUTAWAY job(s) created.`);
          // Refresh data to show updated PO status/quantities
          await refreshData();
        }
      }

    } catch (error) {
      console.error('Error in receivePOSplit:', error);
      addNotification('alert', 'Error processing split reception');
    }
  }, [orders, addNotification, activeSiteId, allProducts, user, logSystemEvent, jobs, refreshData]);

  const fixBrokenJobs = useCallback(async () => {
    console.log('Running Fix Broken Jobs...');
    let fixedCount = 0;

    // Find Received POs
    const receivedPOs = orders.filter(o => o.status === 'Received');

    for (const po of receivedPOs) {
      // Check if valid jobs exist
      const poJobs = jobs.filter(j => j.orderRef === po.id);
      const hasValidJobs = poJobs.some(j => j.lineItems && j.lineItems.length > 0);

      if (!hasValidJobs) {
        console.log(`Fixing PO ${po.id} - No valid jobs found`);

        // Delete invalid jobs first
        for (const j of poJobs) {
          await wmsJobsService.delete(j.id);
        }
        setJobs(prev => prev.filter(j => j.orderRef !== po.id));

        // Re-create jobs
        if (po.lineItems) {
          const jobPromises = po.lineItems.map(async (item, index) => {
            const product = products.find(p => p.id === item.productId);
            const newJob: WMSJob = {
              id: crypto.randomUUID(),
              type: 'PUTAWAY',
              // STRICT: No ID slicing fallback
              jobNumber: po.poNumber || po.po_number || 'UNKNOWN',
              siteId: po.siteId || activeSite?.id || 'SITE-001',
              site_id: po.siteId || activeSite?.id,
              status: 'Pending',
              priority: 'Normal',
              assignedTo: '',
              location: 'Receiving Dock',
              items: item.quantity,
              orderRef: po.id,
              lineItems: [{
                productId: item.productId || '',
                name: item.productName,
                sku: product?.sku || item.productId || 'UNKNOWN',
                image: product?.image || '',
                expectedQty: item.quantity,
                pickedQty: 0,
                status: 'Pending'
              }]
            };
            try {
              const created = await wmsJobsService.create(newJob);
              return created;
            } catch (e) { console.error(e); return newJob; }
          });

          const newJobs = await Promise.all(jobPromises);
          setJobs(prev => [...prev, ...newJobs]);
          fixedCount++;
        }
      }
    }

    if (fixedCount > 0) {
      addNotification('success', `Fixed ${fixedCount} broken POs. Check Putaway tab.`);
    } else {
      addNotification('info', 'No broken POs found.');
    }
  }, [orders, jobs, products, activeSite, addNotification]);

  /**
   * Create a PUTAWAY job for a product added through Inventory.
   * This allows products created in Inventory to flow through Fulfillment just like PO items.
   */
  const createPutawayJob = useCallback(async (
    product: Product,
    quantity: number,
    userName: string,
    source: string = 'Inventory'
  ): Promise<WMSJob | undefined> => {
    try {
      if (quantity <= 0) {
        console.log('📦 Skipping putaway job - no stock to put away');
        return undefined;
      }

      const targetSiteId = product.siteId || product.site_id || activeSite?.id;
      if (!targetSiteId) {
        console.error('❌ Cannot create putaway job - no site ID');
        return undefined;
      }

      const lineItem = {
        productId: product.id,
        name: product.name,
        sku: product.sku || 'UNKNOWN',
        image: product.image || '',
        expectedQty: quantity,
        pickedQty: 0,
        status: 'Pending' as JobItem['status']
      };

      console.log('📦 Creating PUTAWAY job for Inventory product:', {
        productName: product.name,
        quantity,
        siteId: targetSiteId,
        source
      });

      try {
        const createdJob = await wmsJobsService.create({
          siteId: targetSiteId,
          site_id: targetSiteId,
          type: 'PUTAWAY',
          priority: 'Normal',
          status: 'Pending',
          items: quantity,
          lineItems: [lineItem],
          location: product.location || 'Receiving Dock',
          orderRef: `INV-${product.id}`,
          // STRICT: SKU only, no ID slicing
          // jobNumber: (product.sku || 'UNKNOWN').toUpperCase(), // Fixed: Let system generate unique ID (PUT-SKU)
          createdAt: new Date().toISOString(),
          requestedBy: userName
        });
        console.log('✅ Inventory PUTAWAY job created:', createdJob.id);

        // Update local state
        setJobs(prev => [createdJob, ...prev]);

        return createdJob;
      } catch (error) {
        console.error('❌ Failed to create putaway job in DB:', error);
        // Fallback: add to local state with temp ID
        const fallbackJob: WMSJob = {
          id: crypto.randomUUID(),
          siteId: targetSiteId,
          site_id: targetSiteId,
          type: 'PUTAWAY',
          priority: 'Normal',
          status: 'Pending',
          items: quantity,
          lineItems: [lineItem],
          location: product.location || 'Receiving Dock',
          orderRef: `INV-${product.id}`,
          // STRICT: SKU only, no ID slicing
          jobNumber: (product.sku || 'UNKNOWN').toUpperCase(),
          createdAt: new Date().toISOString(),
          requestedBy: userName
        };
        setJobs(prev => [fallbackJob, ...prev]);
        return fallbackJob;
      }
    } catch (error) {
      console.error('Error creating putaway job:', error);
      return undefined;
    }
  }, [activeSite]);

  /**
   * Calculates how an order should be fulfilled based on advanced picking rules.
   * Respects site-specific strategies, distance, and zone priorities.
   */
  const calculateFulfillmentPlan = useCallback(async (
    requestingSiteId: string,
    cart: CartItem[]
  ): Promise<FulfillmentPlan[]> => {
    return await salesService.calculateFulfillmentPlan(requestingSiteId, cart);
  }, []);


  const releaseOrder = useCallback(async (saleId: string) => {
    try {
      const sale = allSales.find(s => s.id === saleId) || sales.find(s => s.id === saleId);
      if (!sale) throw new Error('Sale not found');

      console.log(`🚀 Releasing order via Backend: ${saleId} (${sale.receiptNumber})`);

      await salesService.releaseOrder(saleId);

      // Refresh data to get new jobs and updated sale status
      await refreshData();

      addNotification('success', `Order ${sale.receiptNumber} released successfully.`);
    } catch (error) {
      console.error('Failed to release order:', error);
      addNotification('alert', 'Failed to release order.');
    }
  }, [allSales, sales, refreshData, addNotification]);

  const processReturn = async (saleId: string, items: ReturnItem[], totalRefund: number, user: string) => {
    try {
      await salesService.refund(saleId, items, totalRefund);
      addNotification('success', 'Return processed successfully');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to process return');
    }
  };

  const startShift = (cashierId: string, openingFloat: number) => {
    // Check if user already has open shift
    const existingOpenShift = shifts.find(s => s.cashierId === cashierId && s.status === 'Open');
    if (existingOpenShift) {
      addNotification('info', 'You already have an active shift.');
      return;
    }

    const newShift: ShiftRecord = {
      id: `SHIFT-${Date.now()}`,
      siteId: activeSite?.id || '',
      cashierId,
      cashierName: user?.name || 'Unknown',
      startTime: new Date().toISOString(),
      openingFloat,
      cashSales: 0,
      status: 'Open'
    };

    setShifts(prev => [newShift, ...prev]);
    addNotification('success', 'Shift Started Successfully');
  };

  const closeShift = (shift: ShiftRecord) => {
    setShifts(prev => prev.map(s => s.id === shift.id ? { ...shift, status: 'Closed', endTime: new Date().toISOString() } : s));
  };

  const addSupplier = async (supplier: Supplier) => {
    try {
      const newSupplier = await suppliersService.create(supplier);
      setSuppliers(prev => [newSupplier, ...prev]);
      addNotification('success', `Supplier ${supplier.name} added`);
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to add supplier');
    }
  };

  const adjustStock = async (productId: string, quantity: number, type: 'IN' | 'OUT', reason: string, user: string) => {
    try {
      if (isNaN(Number(quantity))) {
        addNotification('alert', 'Invalid stock quantity');
        return;
      }
      await productsService.adjustStock(productId, Number(quantity), type === 'IN' ? 'IN' : 'OUT', reason, user);

      // Invalidate products query
      queryClient.invalidateQueries({ queryKey: ['products'] });

      console.log(`📦 Stock adjusted: ${productId} ${type} ${quantity} (${reason})`);
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to adjust stock');
    }
  };

  const addExpense = async (expense: ExpenseRecord) => {
    try {
      const newExpense = await expensesService.create({
        ...expense,
        site_id: activeSite?.id
      });
      setExpenses(prev => [newExpense, ...prev]);
      addNotification('success', 'Expense recorded');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to add expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await expensesService.delete(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      addNotification('success', 'Expense deleted');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete expense');
    }
  };

  const processPayroll = async (siteId: string, user: string) => {
    try {
      const activeEmployees = employees.filter(e => (e.siteId === siteId || e.site_id === siteId) && e.status === 'Active');
      const totalSalary = activeEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);

      if (totalSalary === 0) {
        addNotification('info', 'No active employees with salary to process.');
        return;
      }

      const expense: ExpenseRecord = {
        id: `PAYROLL-${Date.now()}`,
        siteId,
        site_id: siteId,
        date: new Date().toISOString().split('T')[0],
        category: 'Salaries',
        description: `Monthly Payroll for ${activeEmployees.length} employees`,
        amount: totalSalary,
        status: 'Paid',
        approvedBy: user
      };

      await addExpense(expense);
      addNotification('success', `Payroll processed: ${CURRENCY_SYMBOL}${totalSalary.toLocaleString()}`);
      logSystemEvent('Payroll', `Processed payroll for ${activeEmployees.length} employees`, user, 'Finance');
    } catch (error) {
      console.error('Payroll failed:', error);
      addNotification('alert', 'Failed to process payroll');
    }
  };

  const assignJob = async (jobId: string, employeeIdOrName: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) {
        addNotification('alert', 'Job not found');
        return;
      }

      // Find employee by ID or name
      const employee = employees.find(e =>
        e.id === employeeIdOrName || e.name === employeeIdOrName
      );

      if (!employee) {
        addNotification('alert', 'Employee not found');
        return;
      }

      // Check if employee already has active assignments
      const activeAssignments = jobAssignments.filter(
        a => a.employeeId === employee.id &&
          ['Assigned', 'Accepted', 'In-Progress'].includes(a.status)
      );

      if (activeAssignments.length >= 3) {
        addNotification('alert', `${employee.name} already has ${activeAssignments.length} active jobs`);
        return;
      }

      // Estimate duration based on job type and items
      let estimatedDuration = 15; // base minutes
      if (job.type === 'PICK') {
        estimatedDuration = Math.max(15, job.items * 3); // 3 min per item
      } else if (job.type === 'PACK') {
        estimatedDuration = Math.max(10, job.items * 2); // 2 min per item
      } else if (job.type === 'PUTAWAY') {
        estimatedDuration = Math.max(20, job.items * 4); // 4 min per item
      }

      // Create job assignment (optional - proceed even if this fails due to permissions)
      try {
        const assignment: Partial<JobAssignment> = {
          jobId: job.id,
          employeeId: employee.id,
          employeeName: employee.name,
          assignedAt: new Date().toISOString(),
          status: 'Assigned',
          estimatedDuration
        };

        const createdAssignment = await jobAssignmentsService.create(assignment);
        setJobAssignments(prev => [createdAssignment, ...prev]);
      } catch (assignError) {
        console.warn('Failed to create job assignment record (likely permissions), proceeding with job update:', assignError);
      }

      // Update job status
      const updatedJob = await wmsJobsService.update(jobId, {
        assignedTo: employee.id,
        status: 'In-Progress'
      });

      setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));

      // Invalidate jobs query
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      addNotification('success', `Job assigned to ${employee.name}`);
    } catch (error) {
      console.error('Failed to assign job:', error);
      addNotification('alert', 'Failed to assign job');
    }
  };

  const updateJobItem = async (jobId: string, itemId: number, status: JobItem['status'], qty: number) => {
    console.log(`📝 updateJobItem called: Job=${jobId}, ItemIdx=${itemId}, Status=${status}, Qty=${qty}`);
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) {
        console.error(`❌ updateJobItem: Job ${jobId} not found in local state!`);
        addNotification('alert', 'Job not found - please refresh and try again.');
        return;
      }

      const updatedLineItems = [...job.lineItems];
      if (updatedLineItems[itemId]) {
        const oldStatus = updatedLineItems[itemId].status;
        updatedLineItems[itemId] = {
          ...updatedLineItems[itemId],
          status,
          pickedQty: qty
        };
        console.log(`📝 Item ${itemId} (${updatedLineItems[itemId].name}): ${oldStatus} → ${status}, pickedQty=${qty}`);
      } else {
        console.error(`❌ updateJobItem: Item at index ${itemId} not found in job lineItems!`);
        addNotification('alert', 'Item not found in job - please refresh and try again.');
        return;
      }

      // Optimistic update
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, lineItems: updatedLineItems } : j));

      const result = await wmsJobsService.update(jobId, { lineItems: updatedLineItems });

      // Invalidate jobs query
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      console.log(`✅ updateJobItem: DB updated successfully for Job ${jobId}. DB response:`, result?.lineItems?.length || 'N/A', 'items');
      addNotification('success', 'Item updated');
    } catch (error) {
      console.error(`❌ updateJobItem FAILED for Job ${jobId}:`, error);
      addNotification('alert', 'Failed to update job item - please try again.');
      // Revert optimistic update if needed (omitted for brevity, but recommended in prod)
    }
  };

  const updateJobStatus = async (jobId: string, status: WMSJob['status']) => {
    // Optimistic update
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));

    try {
      await wmsJobsService.update(jobId, { status });
      // Invalidate jobs query
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (e) {
      console.error('Failed to update job status in DB (keeping local)', e);
    }
  };

  const resetJob = async (jobId: string) => {
    try {
      console.log('🔄 Resetting job:', jobId);
      const job = jobs.find(j => j.id === jobId);
      if (!job) {
        console.error('❌ Job not found for reset:', jobId);
        return;
      }

      // Reset all line items
      const updatedLineItems = job.lineItems?.map(item => ({
        ...item,
        status: 'Pending',
        pickedQty: 0
      })) || [];

      // Prepare updates for DB (snake_case)
      const dbUpdates = {
        status: 'Pending',
        assigned_to: null,
        line_items: updatedLineItems, // Supabase expects snake_case
        items_count: job.items // Ensure items count is preserved
      };

      console.log('💾 Sending reset updates to DB:', dbUpdates);

      // Update in DB
      const { data, error } = await supabase
        .from('wms_jobs')
        .update(dbUpdates)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        console.error('❌ DB Update failed:', error);
        throw error;
      }

      console.log('✅ DB Update successful:', data);

      // Update local state immediately
      const updatedJobLocal = {
        ...job,
        status: 'Pending',
        assignedTo: undefined,
        lineItems: updatedLineItems
      };

      setJobs(prev => prev.map(j => j.id === jobId ? updatedJobLocal as WMSJob : j));

      // Invalidate jobs query
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      addNotification('success', 'Job reset successfully');
    } catch (error) {
      console.error('Failed to reset job:', error);
      addNotification('alert', 'Failed to reset job: ' + (error as any).message);
    }
  };

  const completeJob = async (jobId: string, employeeName: string, skipValidation = false, optimisticLineItems?: JobItem[]) => {
    let pointsResult = null;
    const stage = (name: string) => console.log(`[ST-PACK] 🕒 Stage: ${name} (Job: ${jobId})`);
    console.time(`completeJob-${jobId}`);

    try {
      stage('Start');
      console.log(`🏁 completeJob called for: ${jobId} (skipValidation: ${skipValidation})`);
      let job = jobs.find(j => j.id === jobId);

      // Fix: For PUTAWAY, if location is missing in local state (race condition), fetch fresh from DB
      if (job && job.type === 'PUTAWAY' && !job.location) {
        try {
          const freshJob = await wmsJobsService.getById(jobId);
          if (freshJob) {
            job = freshJob;
            console.log(`🔄 Refreshed job ${jobId} from DB to get location: ${freshJob.location}`);
          }
        } catch (e) {
          console.error('Failed to refresh job from DB', e);
        }
      }

      if (!job) {
        console.error(`❌ Job ${jobId} not found in local state`);
        return;
      }

      // Use Optimistic Items if provided (Fixes Race Condition where state isn't updated yet)
      let itemsToValidate = optimisticLineItems || job.lineItems;

      // Validate that all items are actually completed (Picked or Short)
      if (!skipValidation && itemsToValidate && itemsToValidate.length > 0) {
        const allItemsProcessed = itemsToValidate.every(item =>
          item.status === 'Picked' || item.status === 'Short' || item.status === 'Discontinued'
        );

        if (!allItemsProcessed) {
          console.warn(`⚠️ Job ${jobId} has unprocessed items, not completing yet (Checked ${itemsToValidate.length} items)`);
          // Additional logging to help verify exactly which item is blocking
          itemsToValidate.forEach(i => {
            if (i.status !== 'Picked' && i.status !== 'Short' && i.status !== 'Discontinued') {
              console.warn(`   ❌ Blocking Item: ${i.name} [${i.status}]`);
            }
          });
          return;
        }
      }

      stage('DB Update WMS Job');

      // CRITICAL FIX: When skipValidation=true (Force Complete), update lineItems to 'Picked' in DB
      // This ensures the job doesn't reappear on refresh. Use itemsToValidate (optimistic).
      if (skipValidation && itemsToValidate && itemsToValidate.length > 0) {
        const forcedLineItems = itemsToValidate.map(item => ({
          ...item,
          status: (item.status === 'Short' ? 'Short' : 'Picked') as JobItem['status'],
          pickedQty: item.pickedQty || item.expectedQty || 0
        }));
        console.log(`🔧 Force Complete: Updating ${forcedLineItems.length} lineItems to 'Picked' status in DB`);
        await wmsJobsService.update(jobId, { status: 'Completed', lineItems: forcedLineItems });

        // CRITICAL: Update itemsToValidate so Job Chaining uses the forced quantities
        itemsToValidate = forcedLineItems;
      } else {
        await wmsJobsService.update(jobId, { status: 'Completed' });
      }
      console.log(`💾 Database updated for job ${jobId}`);

      stage('Local State Update');
      // Update local state immediately - this ensures the UI updates
      setJobs(prev => prev.map(j => {
        if (j.id === jobId) {
          const updatedLineItems = itemsToValidate.map(item => ({
            ...item,
            status: (item.status === 'Short' ? 'Short' : 'Completed') as any
          }));
          return { ...j, status: 'Completed' as const, lineItems: updatedLineItems };
        }
        return j;
      }));

      addNotification('success', `Job ${job.jobNumber || jobId} completed!`);

      // ═══════════════════════════════════════════════════════════════
      // PUTAWAY LOGIC
      // ═══════════════════════════════════════════════════════════════
      if (job.type === 'PUTAWAY') { // Moved check inside for better logging
        console.log(`📦 DEBUG: Putaway Logic Triggered for Job ${job.id}`);
        console.log(`   - Location: ${job.location || 'MISSING'}`);
        console.log(`   - Items: ${job.lineItems?.length || 0}`);

        if (job.location) {
          console.log('ℹ️ Bulk Putaway Update skipped in favor of granular item scanning/relocation.');
          // stage('Putaway Location Update');
          // await Promise.all(job.lineItems.map(async (item) => {
          //   console.log(`   - Processing Item: ${item.name} (${item.status})`);
          //   // Fix: Allow Pending items too, in case user completes job without scanning each item individually
          //   const isEligibleStatus = item.status === 'Picked' || item.status === 'Pending';

          //   if (isEligibleStatus && item.productId) {
          //     try {
          //       console.log(`     -> Updating Product ${item.productId} to location ${job.location}`);
          //       const product = products.find(p => p.id === item.productId);
          //       if (product) {
          //         // Using sanitized update via updateProduct (already fixed)
          //         // BUT disabling entirely to prevent overwriting individual scans handled in Fulfillment.tsx
          //         // await updateProduct({ ...product, location: job.location! }); 
          //         console.log(`     -> Success`);
          //       } else {
          //         console.error(`     -> Product not found in local state`);
          //       }
          //     } catch (err) {
          //       console.error(`❌ Failed to update location for product ${item.productId}`, err);
          //     }
          //   } else {
          //     console.log(`     -> Skipped (Status: ${item.status}, PID: ${item.productId})`);
          //   }
          // }));
        } else {
          console.log('ℹ️ Job has no target location. Relying on individual item scans.');
        }

        // ═══════════════════════════════════════════════════════════════
        // CHECK IF ALL PUTAWAY JOBS FOR THIS PO ARE COMPLETE
        // ═══════════════════════════════════════════════════════════════
        stage('Check PO Completion');
        if (job.orderRef) {
          // Get all PUTAWAY jobs for this PO (including the one we just completed)
          const allPutawayJobsForPO = jobs
            .filter(j => j.orderRef === job.orderRef && j.type === 'PUTAWAY')
            .map(j => j.id === jobId ? { ...j, status: 'Completed' as const } : j); // Include the just-completed job

          // Check if all PUTAWAY jobs are now complete
          const allPutawayJobsComplete = allPutawayJobsForPO.length > 0 &&
            allPutawayJobsForPO.every(j => j.status === 'Completed');

          if (allPutawayJobsComplete) {
            console.log(`✅ All PUTAWAY jobs for PO ${job.orderRef} are complete. Updating PO status to 'Received'...`);

            // Validate if orderRef is a valid UUID before calling Supabase
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.orderRef || '');

            if (isUUID) {
              try {
                const updatedPo = await purchaseOrdersService.receive(job.orderRef, false);
                if (updatedPo) {
                  setOrders(prev => prev.map(o => o.id === job.orderRef ? updatedPo : o));
                  setAllOrders(prev => prev.map(o => o.id === job.orderRef ? updatedPo : o));
                  addNotification('success', `PO ${updatedPo.poNumber || job.orderRef} fully received and moved to history!`);
                }
              } catch (err) {
                console.error(`❌ Failed to update PO status for ${job.orderRef}:`, err);
              }
            } else {
              // RETRY: If not a UUID, it might be the PO Number (e.g. AAAA0027). Try to find the UUID.
              console.log(`ℹ️ PO Ref ${job.orderRef} is not a UUID. Attempting lookup by PO Number...`);
              const poByNumber = allOrders.find(o => o.poNumber === job.orderRef || o.po_number === job.orderRef);

              if (poByNumber && poByNumber.id) {
                try {
                  console.log(`✅ Found PO UUID ${poByNumber.id} for ref ${job.orderRef}. Updating status...`);
                  const updatedPo = await purchaseOrdersService.receive(poByNumber.id, false);
                  if (updatedPo) {
                    setOrders(prev => prev.map(o => o.id === poByNumber.id ? updatedPo : o));
                    setAllOrders(prev => prev.map(o => o.id === poByNumber.id ? updatedPo : o));
                    addNotification('success', `PO ${updatedPo.poNumber} fully received!`);
                  }
                } catch (err) {
                  console.error(`❌ Failed to update PO status by number ${job.orderRef}:`, err);
                }
              } else {
                console.warn(`⚠️ PO ID ${job.orderRef} is not a valid UUID and not found in local orders. Skipping backend update.`);
                // Update local state only for mock/legacy IDs
                setOrders(prev => prev.map(o => o.id === job.orderRef ? { ...o, status: 'Received' } : o));
                setAllOrders(prev => prev.map(o => o.id === job.orderRef ? { ...o, status: 'Received' } : o));
                addNotification('success', `PO ${job.orderRef} received (Local Update Only)`);
              }
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // GAMIFICATION
      // ═══════════════════════════════════════════════════════════════
      stage('Gamification Points');
      const jobSite = sites.find(s => s.id === job.siteId);
      const warehouseIsEligible = jobSite?.warehouseBonusEnabled !== false;

      if (employeeName && job.assignedTo && settings.bonusEnabled !== false && warehouseIsEligible) {
        const assignedEmployee = employees.find(
          e => e.name === job.assignedTo || e.id === job.assignedTo
        );

        if (assignedEmployee) {
          const eligibleRoles = settings.warehousePointsEligibleRoles || [];
          const employeeRoleLower = assignedEmployee.role?.toLowerCase() || '';
          const isRoleEligible = eligibleRoles.length === 0 ||
            eligibleRoles.find(r => r.role.toLowerCase() === employeeRoleLower)?.enabled !== false;

          if (isRoleEligible) {
            const rules = settings.warehousePointRules || []; // No defaults - only user-configured rules
            const getPointsForAction = (action: WarehousePointRule['action']) => {
              const rule = rules.find(r => r.action === action && r.enabled);
              return rule ? rule.points : 0;
            };

            const basePoints = getPointsForAction(job.type as any);
            const itemBonusPoints = getPointsForAction('ITEM_BONUS');
            const itemBonus = (job.lineItems?.length || 0) * itemBonusPoints;

            let accuracyBonus = 0;
            if (job.lineItems && job.lineItems.length > 0) {
              const pickedItems = job.lineItems.filter(i => i.status === 'Picked').length;
              const accuracy = (pickedItems / job.lineItems.length) * 100;
              if (accuracy === 100) accuracyBonus = getPointsForAction('ACCURACY_100');
            }

            const totalPoints = basePoints + itemBonus + accuracyBonus;
            awardPoints(assignedEmployee.id, totalPoints, 'JOB_COMPLETE', `Completed ${job.type} job ${job.jobNumber || jobId}`, jobId);

            pointsResult = {
              points: totalPoints,
              breakdown: [
                { label: 'Base Points', points: basePoints },
                { label: 'Item Bonus', points: itemBonus },
                { label: 'Accuracy Bonus', points: accuracyBonus }
              ].filter(b => b.points > 0)
            };
          }
        }
      }

      // --- JOB CHAINING LOGIC ---
      stage('Job Chaining');
      if (job && job.type === 'PICK' && job.orderRef) {
        stage('Chaining: PICK -> PACK');
        // Fix: Use itemsToValidate (optimistic) to ensure the PACK job has correct items
        // CRITICAL FIX: Only include items that were actually picked (qty > 0)
        // AND set expectedQty for PACK job to be equal to the pickedQty from the PICK job
        const packItems = itemsToValidate
          .filter(item => (item.pickedQty || 0) > 0)
          .map(item => ({
            ...item,
            expectedQty: item.pickedQty, // Packer expects what was picked
            pickedQty: 0, // Reset for packing
            status: 'Pending' as JobItem['status']
          }));

        if (packItems.length > 0) {
          // Idempotency: Check if a PACK job already exists for this orderRef that is not cancelled
          const existingPackJob = jobs.find(j => j.orderRef === job.orderRef && j.type === 'PACK' && j.status !== 'Cancelled');
          if (existingPackJob) {
            console.warn(`⚠️ PACK job already exists for ${job.orderRef}. Skipping creation.`);
          } else {
            const packJob = await wmsJobsService.create({
              siteId: job.siteId,
              site_id: job.site_id,
              type: 'PACK',
              priority: job.priority,
              status: 'Pending',
              items: packItems.length,
              lineItems: packItems,
              location: 'Packing Station 1',
              orderRef: job.orderRef,
              // jobNumber: job.jobNumber || job.orderRef, // Fixed: Let system generate unique ID (PAK-...)
              sourceSiteId: job.sourceSiteId,
              destSiteId: job.destSiteId
            });
            // Add to state only if it doesn't already exist (prevent double entries from real-time)
            setJobs(prev => prev.find(j => j.id === packJob.id) ? prev : [packJob, ...prev]);
          }
        } else {
          console.warn(`⚠️ Skipped creation of PACK job for ${job.orderRef} because no items were picked.`);
        }

        const sale = sales.find(s => s.id === job.orderRef);
        const transfer = jobs.find(j => (j.id === job.orderRef || j.jobNumber === job.orderRef) && j.type === 'TRANSFER');
        const isTransfer = !!transfer || (job.orderRef && (job.orderRef.startsWith('TRF-')));

        if (sale) {
          await salesService.update(sale.id, { fulfillmentStatus: 'Packing' });
          setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Packing' } : s));
        } else if (isTransfer) {
          const tId = transfer?.id || job.orderRef;
          await wmsJobsService.update(tId, { transferStatus: 'Picked' });
          setJobs(prev => prev.map(j => j.id === tId ? { ...j, transferStatus: 'Picked' } : j));
          setTransfers(prev => prev.map(t => t.id === tId ? { ...t, transferStatus: 'Picked' } : t));

          if (job.lineItems) {
            for (const item of job.lineItems) {
              if (item.productId && item.expectedQty > 0) {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                  await adjustStock(product.id, item.pickedQty || item.expectedQty, 'OUT', `Transfer to ${sites.find(s => s.id === job.destSiteId)?.name || 'store'}`, employeeName);
                }
              }
            }
          }
        }
      } else if (job && job.type === 'PACK' && job.orderRef) {
        stage('Chaining: PACK -> Next');
        const isCrossWarehouse = job.sourceSiteId && job.destSiteId && job.sourceSiteId !== job.destSiteId;
        const sale = sales.find(s => s.id === job.orderRef);
        const transfer = jobs.find(j => (j.id === job.orderRef || j.jobNumber === job.orderRef) && j.type === 'TRANSFER');
        const isTransfer = !!transfer || (job.orderRef && (job.orderRef.startsWith('TRF-')));
        const tId = transfer?.id || job.orderRef;

        if (isCrossWarehouse) {
          stage('Cross-Warehouse Dispatch');
          // Fix: Use itemsToValidate (optimistic)
          // CRITICAL FIX: Only include items that were actually packed (qty > 0 -- using pickedQty field for pack count)
          // AND set expectedQty for DISPATCH job to be equal to the packedQty
          const dispatchItems = itemsToValidate
            .filter(item => (item.pickedQty || 0) > 0) // pickedQty stores "packed amount" in PACK jobs
            .map(item => ({
              ...item,
              expectedQty: item.pickedQty, // Driver expects what was packed
              pickedQty: 0,
              status: 'Pending' as JobItem['status']
            }));

          if (dispatchItems.length > 0) {
            // Idempotency: Check if a DISPATCH job already exists for this orderRef
            const existingDispatchJob = jobs.find(j => j.orderRef === job.orderRef && j.type === 'DISPATCH' && j.status !== 'Cancelled');
            if (existingDispatchJob) {
              console.warn(`⚠️ DISPATCH job already exists for ${job.orderRef}. Skipping creation.`);
            } else {
              const dispatchJob = await wmsJobsService.create({
                siteId: job.siteId,
                site_id: job.site_id,
                type: 'DISPATCH',
                priority: job.priority,
                status: 'Pending',
                items: dispatchItems.length,
                lineItems: dispatchItems,
                location: 'Dispatch Bay',
                orderRef: job.orderRef,
                // jobNumber: job.jobNumber || job.orderRef, // Fixed: Let system generate unique ID (DSP-...)
                sourceSiteId: job.sourceSiteId,
                destSiteId: job.destSiteId,
                transferStatus: 'Packed'
              });

              setJobs(prev => prev.find(j => j.id === dispatchJob.id) ? prev : [dispatchJob, ...prev]);
            }
          } else {
            console.warn(`⚠️ Skipped creation of DISPATCH job for ${job.orderRef} because no items were packed.`);
          }

          if (sale) {
            await salesService.update(sale.id, { fulfillmentStatus: 'Shipped' });
            setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Shipped' } : s));
          } else if (isTransfer) {
            await wmsJobsService.update(tId, { transferStatus: 'Packed' });
            setJobs(prev => prev.map(j => j.id === tId ? { ...j, transferStatus: 'Packed' } : j));
            setTransfers(prev => prev.map(t => t.id === tId ? { ...t, transferStatus: 'Packed' } : t));
          }
        } else {
          stage('Local Fulfillment');
          if (sale) {
            await salesService.update(sale.id, { fulfillmentStatus: 'Delivered' });
            setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Delivered' } : s));
          } else if (isTransfer) {
            await wmsJobsService.update(tId, { transferStatus: 'Packed' });
            setJobs(prev => prev.map(j => j.id === tId ? { ...j, transferStatus: 'Packed' } : j));
            setTransfers(prev => prev.map(t => t.id === tId ? { ...t, transferStatus: 'Packed' } : t));
          }
        }
      } else if (job && job.type === 'DISPATCH') {
        stage('Dispatch Completion');
        const sale = sales.find(s => s.id === job.orderRef);
        const transfer = jobs.find(j => (j.id === job.orderRef || j.jobNumber === job.orderRef) && j.type === 'TRANSFER');
        const isTransfer = !!transfer || (job.orderRef && (job.orderRef.startsWith('TRF-')));
        const tId = transfer?.id || job.orderRef;

        if (sale) {
          await salesService.update(sale.id, { fulfillmentStatus: 'Delivered' });
          setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Delivered' } : s));
        } else if (isTransfer) {
          await wmsJobsService.update(tId, { transferStatus: 'Delivered' });
          setJobs(prev => prev.map(j => j.id === tId ? { ...j, transferStatus: 'Delivered' } : j));
          setTransfers(prev => prev.map(t => t.id === tId ? { ...t, transferStatus: 'Delivered' } : t));
        }
      }

      stage('Final Logs');

      // Invalidate jobs query (Ensures PICK status update and PACK job creation are fresh)
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      logSystemEvent('Job Completed', `Job ${job.jobNumber || jobId} completed`, employeeName, 'Inventory');
      console.timeEnd(`completeJob-${jobId}`);
      return pointsResult;
    } catch (error) {
      console.error(`❌ completeJob failed for ${jobId}:`, error);
      console.timeEnd(`completeJob-${jobId}`);
      addNotification('alert', 'Failed to complete job');
      throw error;
    }
  };

  const addEmployee = async (employee: Employee, user?: string) => {
    try {
      const newEmployee = await employeesService.create({
        ...employee,
        siteId: employee.siteId || activeSite?.id || ''
      });
      setEmployees(prev => [newEmployee, ...prev]);
      addNotification('success', `Employee ${employee.name} added`);
      return newEmployee;
    } catch (error: any) {
      console.error('addEmployee error:', error);
      const errorMessage = error?.message || 'Failed to add employee';
      addNotification('alert', `Failed to add employee: ${errorMessage}`);
      throw error; // Rethrow so the caller knows it failed
    }
  };

  const updateEmployee = async (employee: Employee, user: string) => {
    try {
      await employeesService.update(employee.id, employee);
      setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
      addNotification('success', 'Employee updated');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update employee');
    }
  };

  const deleteEmployee = async (id: string, user: string) => {
    try {
      await employeesService.delete(id);
      setEmployees(prev => prev.filter(e => e.id !== id));
      addNotification('success', 'Employee deleted');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete employee');
    }
  };

  const addSchedule = useCallback(async (schedule: StaffSchedule, user: string) => {
    try {
      const newSchedule = await schedulesService.create(schedule);
      if (newSchedule) {
        setSchedules(prev => [...prev, newSchedule]);
        addNotification('success', `Schedule created for ${schedule.employeeName}`);
        logSystemEvent('Create Schedule', `Scheduled ${schedule.employeeName} for ${schedule.date}`, user, 'HR');
      }
      return newSchedule || undefined;
    } catch (error) {
      console.error('Failed to add schedule:', error);
      addNotification('alert', 'Failed to create schedule');
      return undefined;
    }
  }, [addNotification, logSystemEvent]);

  const updateSchedule = useCallback(async (id: string, updates: Partial<StaffSchedule>, user: string) => {
    try {
      const updated = await schedulesService.update(id, updates);
      if (updated) {
        setSchedules(prev => prev.map(s => s.id === id ? updated : s));
        addNotification('success', 'Schedule updated');
        logSystemEvent('Update Schedule', `Updated schedule ${id}`, user, 'HR');
      }
      return updated || undefined;
    } catch (error) {
      console.error('Failed to update schedule:', error);
      addNotification('alert', 'Failed to update schedule');
      return undefined;
    }
  }, [addNotification, logSystemEvent]);

  const deleteSchedule = useCallback(async (id: string, user: string) => {
    try {
      await schedulesService.delete(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      addNotification('success', 'Schedule removed');
      logSystemEvent('Delete Schedule', `Deleted schedule ${id}`, user, 'HR');
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      addNotification('alert', 'Failed to remove schedule');
    }
  }, [addNotification, logSystemEvent]);

  // ═══════════════════════════════════════════════════════════════
  // GAMIFICATION - Worker Points System
  // ═══════════════════════════════════════════════════════════════

  const getLevelFromPoints = useCallback((totalPoints: number) => {
    const levels = POINTS_CONFIG.LEVELS;
    let currentLevel = levels[0];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalPoints >= levels[i].points) {
        currentLevel = levels[i];
        break;
      }
    }
    return currentLevel;
  }, []);

  const getWorkerPoints = useCallback((employeeId: string): WorkerPoints | undefined => {
    return workerPoints.find(wp => wp.employeeId === employeeId);
  }, [workerPoints]);

  const awardPoints = useCallback(async (
    employeeId: string,
    points: number,
    type: PointsTransaction['type'],
    description: string,
    jobId?: string
  ) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];

    // Create transaction
    const transaction: PointsTransaction = {
      id: crypto.randomUUID(),
      employeeId,
      jobId,
      points,
      type,
      description,
      timestamp: now,
    };

    // Optimistic Update
    setPointsTransactions(prev => [transaction, ...prev]);

    // Persist Transaction
    pointsTransactionsService.create(transaction).catch(err =>
      console.error('Failed to persist points transaction:', err)
    );

    // Update or create worker points
    setWorkerPoints(prev => {
      const existing = prev.find(wp => wp.employeeId === employeeId);
      let updatedOrNewPoint: WorkerPoints;

      // Logic for period reset
      const checkReset = (wp: WorkerPoints) => {
        const lastUpdate = new Date(wp.lastUpdated);
        const currentDate = new Date();

        // Reset Today
        const isNewDay = lastUpdate.toDateString() !== currentDate.toDateString();

        // Reset Weekly (Monday starts week)
        const getWeekNumber = (date: Date) => {
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };
        const isNewWeek = getWeekNumber(lastUpdate) !== getWeekNumber(currentDate);

        // Reset Monthly
        const isNewMonth = lastUpdate.getMonth() !== currentDate.getMonth() || lastUpdate.getFullYear() !== currentDate.getFullYear();

        return {
          todayPoints: isNewDay ? 0 : wp.todayPoints,
          weeklyPoints: isNewWeek ? 0 : wp.weeklyPoints,
          monthlyPoints: isNewMonth ? 0 : wp.monthlyPoints,
          isNewDay
        };
      };

      if (existing) {
        const resetData = checkReset(existing);
        const updatedPoints = existing.totalPoints + points;
        const level = getLevelFromPoints(updatedPoints);

        const currentMonthly = resetData.monthlyPoints + points;
        const bonusTiers = settings.bonusTiers || DEFAULT_BONUS_TIERS;
        const tier = bonusTiers.find(t =>
          currentMonthly >= t.minPoints && (t.maxPoints === null || currentMonthly <= t.maxPoints)
        );

        updatedOrNewPoint = {
          ...existing,
          totalPoints: updatedPoints,
          todayPoints: resetData.todayPoints + points,
          weeklyPoints: resetData.weeklyPoints + points,
          monthlyPoints: currentMonthly,
          totalJobsCompleted: type === 'JOB_COMPLETE' ? existing.totalJobsCompleted + 1 : existing.totalJobsCompleted,
          lastJobCompletedAt: type === 'JOB_COMPLETE' ? now : existing.lastJobCompletedAt,
          lastUpdated: now,
          level: level.level,
          levelTitle: level.title,
          currentBonusTier: tier?.tierName,
          estimatedBonus: tier ? tier.bonusAmount + (currentMonthly * (tier.bonusPerPoint || 0)) : 0,
          bonusPeriodPoints: currentMonthly,
        };

        workerPointsService.update(existing.id, updatedOrNewPoint).catch(err =>
          console.error('Failed to update worker points:', err)
        );

        return prev.map(wp => wp.employeeId === employeeId ? updatedOrNewPoint : wp);
      } else {
        // Create new
        const level = getLevelFromPoints(points);
        const bonusTiers = settings.bonusTiers || DEFAULT_BONUS_TIERS;
        const tier = bonusTiers.find(t =>
          points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints)
        );

        const newWorkerPoints: WorkerPoints = {
          id: crypto.randomUUID(),
          siteId: employee.siteId || employee.site_id || '',
          employeeId,
          employeeName: employee.name,
          employeeAvatar: employee.avatar,
          totalPoints: points,
          weeklyPoints: points,
          monthlyPoints: points,
          todayPoints: points,
          totalJobsCompleted: type === 'JOB_COMPLETE' ? 1 : 0,
          totalItemsPicked: 0,
          averageAccuracy: 100,
          averageTimePerJob: 0,
          currentStreak: 1,
          longestStreak: 1,
          lastJobCompletedAt: type === 'JOB_COMPLETE' ? now : undefined,
          lastUpdated: now,
          achievements: [],
          rank: prev.length + 1,
          level: level.level,
          levelTitle: level.title,
          currentBonusTier: tier?.tierName,
          estimatedBonus: tier ? tier.bonusAmount + (points * (tier.bonusPerPoint || 0)) : 0,
          bonusPeriodPoints: points,
        };

        updatedOrNewPoint = newWorkerPoints;
        workerPointsService.create(newWorkerPoints).catch(err =>
          console.error('Failed to create worker points:', err)
        );

        return [...prev, newWorkerPoints];
      }
    });

    console.log(`🎮 Awarded ${points} points to ${employee.name}: ${description}`);
  }, [employees, settings, getLevelFromPoints]);

  const getLeaderboard = useCallback((siteId?: string, period: 'today' | 'week' | 'month' | 'all' = 'week'): WorkerPoints[] => {
    let filtered = workerPoints;

    if (siteId) {
      filtered = filtered.filter(wp => wp.siteId === siteId);
    }

    // Sort by appropriate period
    return [...filtered].sort((a, b) => {
      switch (period) {
        case 'today': return b.todayPoints - a.todayPoints;
        case 'week': return b.weeklyPoints - a.weeklyPoints;
        case 'month': return b.monthlyPoints - a.monthlyPoints;
        default: return b.totalPoints - a.totalPoints;
      }
    }).map((wp, index) => ({ ...wp, rank: index + 1 }));
  }, [workerPoints]);

  // ==================== STORE POINTS (POS TEAM BONUS) ====================

  const getStorePoints = useCallback((siteId: string): StorePoints | undefined => {
    return storePoints.find(sp => sp.siteId === siteId);
  }, [storePoints]);

  const awardStorePoints = useCallback((
    siteId: string,
    points: number,
    revenue: number,
    transactionCount: number = 1
  ) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    const now = new Date().toISOString();

    setStorePoints(prev => {
      const existing = prev.find(sp => sp.siteId === siteId);
      let updatedOrNew: StorePoints;

      if (existing) {
        // Check if it's a new day - reset today's points
        const lastUpdateDate = new Date(existing.lastUpdated);
        const currentDate = new Date();
        const isNewDay = lastUpdateDate.toDateString() !== currentDate.toDateString();

        // Check if it's a new week - reset weekly points
        const getWeekNumber = (date: Date) => {
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };
        const isNewWeek = getWeekNumber(lastUpdateDate) !== getWeekNumber(currentDate);

        // Check if it's a new month - reset monthly points
        const isNewMonth = lastUpdateDate.getMonth() !== currentDate.getMonth() || lastUpdateDate.getFullYear() !== currentDate.getFullYear();

        const updatedTodayPoints = isNewDay ? points : (existing.todayPoints || 0) + points;
        const updatedWeeklyPoints = isNewWeek ? points : (existing.weeklyPoints || 0) + points;
        const updatedMonthlyPoints = isNewMonth ? points : (existing.monthlyPoints || 0) + points;

        // Calculate current tier and bonus
        const tiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
        const tier = tiers.find(t =>
          updatedMonthlyPoints >= t.minPoints && (t.maxPoints === null || updatedMonthlyPoints <= t.maxPoints)
        );
        const estimatedBonus = tier
          ? tier.bonusAmount + (updatedMonthlyPoints * (tier.bonusPerPoint || 0))
          : 0;

        updatedOrNew = {
          ...existing,
          totalPoints: existing.totalPoints + points,
          todayPoints: updatedTodayPoints,
          weeklyPoints: updatedWeeklyPoints,
          monthlyPoints: updatedMonthlyPoints,
          totalTransactions: existing.totalTransactions + transactionCount,
          totalRevenue: existing.totalRevenue + revenue,
          averageTicketSize: (existing.totalRevenue + revenue) / (existing.totalTransactions + transactionCount),
          lastTransactionAt: currentDate.toISOString(),
          lastUpdated: currentDate.toISOString(),
          currentTier: tier?.tierName,
          estimatedBonus,
        };

        storePointsService.update(existing.id, updatedOrNew).catch(err =>
          console.error('Failed to update store points:', err)
        );

        return prev.map(sp => sp.siteId === siteId ? updatedOrNew : sp);
      } else {
        // Create new store points record
        const tiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
        const tier = tiers.find(t =>
          points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints)
        );

        const newStorePoints: StorePoints = {
          id: crypto.randomUUID(),
          siteId,
          siteName: site.name,
          totalPoints: points,
          weeklyPoints: points,
          monthlyPoints: points,
          todayPoints: points,
          totalTransactions: transactionCount,
          totalRevenue: revenue,
          averageTicketSize: revenue / transactionCount,
          customerSatisfaction: 100,
          lastTransactionAt: now,
          lastUpdated: now,
          currentTier: tier?.tierName,
          estimatedBonus: tier ? tier.bonusAmount + (points * (tier.bonusPerPoint || 0)) : 0,
        };

        storePointsService.create(newStorePoints).catch(err =>
          console.error('Failed to create store points:', err)
        );

        return [...prev, newStorePoints];
      }
    });
  }, [sites, settings]);

  const calculateWorkerBonusShare = useCallback((siteId: string, employeeRole: string): WorkerBonusShare | undefined => {
    const sp = storePoints.find(s => s.siteId === siteId);
    if (!sp || !sp.estimatedBonus) return undefined;

    const roleDistribution = settings.posRoleDistribution || DEFAULT_POS_ROLE_DISTRIBUTION;
    const roleConfig = roleDistribution.find(r => r.role.toLowerCase() === employeeRole.toLowerCase());

    if (!roleConfig) return undefined;

    const employee = employees.find(e => e.role === employeeRole && e.siteId === siteId);

    return {
      employeeId: employee?.id || '',
      employeeName: employee?.name || employeeRole,
      role: employeeRole,
      rolePercentage: roleConfig.percentage,
      storeBonus: sp.estimatedBonus,
      personalShare: (sp.estimatedBonus * roleConfig.percentage) / 100,
      siteId,
    };
  }, [storePoints, settings, employees]);

  const getStoreLeaderboard = useCallback((): StorePoints[] => {
    return [...storePoints].sort((a, b) => b.monthlyPoints - a.monthlyPoints);
  }, [storePoints]);

  const addCustomer = useCallback(async (customer: Customer) => {
    try {
      const newCustomer = await customersService.create(customer);
      setCustomers(prev => [newCustomer, ...prev]);
      addNotification('success', `Customer ${customer.name} added`);
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to add customer');
    }
  }, [addNotification]);

  const updateCustomer = useCallback(async (customer: Customer) => {
    try {
      await customersService.update(customer.id, customer);
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      addNotification('success', 'Customer updated');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update customer');
    }
  }, [addNotification]);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      await customersService.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      addNotification('success', 'Customer deleted');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete customer');
    }
  }, [addNotification]);

  // Initialize Sync Manager
  const { triggerSync, syncStatus, pendingCount } = usePosSync();

  const processSale = useCallback(async (
    cart: CartItem[],
    method: PaymentMethod,
    user: string,
    tendered: number,
    change: number,
    customerId?: string,
    pointsRedeemed?: number,
    type: 'In-Store' | 'Delivery' | 'Pickup' = 'In-Store',
    taxBreakdown: { name: string; rate: number; amount: number; compound: boolean }[] = [],
    receiptNumber?: string // Optional receipt number
  ): Promise<{ saleId: string; pointsResult?: any }> => {
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxRate = settings.taxRate || 0;
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;
      const saleId = crypto.randomUUID();

      // --- DATA OPTIMIZATION: Sanitize Items ---
      const sanitizedItems = cart.map(item => ({
        id: item.id,
        siteId: item.siteId,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        status: item.status,
        stock: item.stock,
        category: item.category,
        unit: item.unit,
        size: item.size,
        brand: item.brand,
        image: ''
      })) as CartItem[];

      const saleRecord: SaleRecord = {
        id: saleId,
        siteId: activeSite?.id || '',
        customerId: customerId,
        date: new Date().toISOString(),
        items: sanitizedItems,
        subtotal,
        tax,
        taxBreakdown,
        total,
        method: method,
        status: 'Completed',
        amountTendered: tendered,
        change,
        cashierName: user,
        type,
        fulfillmentStatus: type === 'In-Store' ? 'Delivered' : 'Picking',
        receiptNumber: receiptNumber || `TX-${Date.now()}` // Use custom or fallback
      };

      // 1. Offline Save
      await posDB.saveSale(saleRecord);
      await posDB.enqueueOperation('CREATE_SALE', saleRecord);

      // 2. Optimistic Update
      const uiSaleRecord: SaleRecord = { ...saleRecord, items: cart };
      setSales(prev => [uiSaleRecord, ...prev]);
      setAllSales(prev => [uiSaleRecord, ...prev]);

      // 3. Trigger Sync (if online)
      if (navigator.onLine) {
        triggerSync();
      }

      // 4. Gamification Logic (Calculated locally for immediate feedback)
      let pointsResult = null;
      if (settings.posBonusEnabled !== false && activeSite?.id) {
        const storeRules = settings.posPointRules || [];
        let totalStorePoints = 0;
        const pointsBreakdown: { item: string; rule: string; points: number }[] = [];

        cart.forEach(item => {
          let itemPoints = 0;
          let appliedRuleName = 'none';

          // Find rules
          const categoryRule = storeRules.find(r => r.enabled && r.type === 'category' && r.categoryId === item.category);
          const productRule = storeRules.find(r => r.enabled && r.type === 'product' && r.productSku === item.sku);
          // Product rule takes precedence
          const activeRule = productRule || categoryRule;

          if (activeRule) {
            itemPoints = item.quantity * (activeRule.pointsPerUnit || 1);
            if (activeRule.multiplier) itemPoints *= activeRule.multiplier;
            if (activeRule.minQuantity && item.quantity < activeRule.minQuantity) itemPoints = 0;
            if (activeRule.maxPointsPerTransaction && itemPoints > activeRule.maxPointsPerTransaction) itemPoints = activeRule.maxPointsPerTransaction;
            appliedRuleName = activeRule.name;
          }

          if (itemPoints > 0) {
            pointsBreakdown.push({ item: item.name, rule: appliedRuleName, points: Math.floor(itemPoints) });
            totalStorePoints += Math.floor(itemPoints);
          }
        });

        // Revenue Rule
        const revenueRule = storeRules.find(r => r.type === 'revenue' && r.enabled);
        if (revenueRule && revenueRule.revenueThreshold) {
          const revenuePoints = Math.floor((subtotal / revenueRule.revenueThreshold) * (revenueRule.pointsPerRevenue || 1));
          totalStorePoints += revenuePoints;
          pointsBreakdown.push({ item: 'Revenue Bonus', rule: revenueRule.name, points: revenuePoints });
        }

        if (totalStorePoints > 0) {
          awardStorePoints(activeSite.id, totalStorePoints, total, 1);
          pointsResult = { points: totalStorePoints, storePoints: totalStorePoints, breakdown: pointsBreakdown };

          // Award to Cashier (Individual)
          const cashierEmployee = employees.find(e => e.name === user || e.id === user);
          if (cashierEmployee) {
            awardPoints(cashierEmployee.id, totalStorePoints, 'JOB_COMPLETE', `Sale ${saleRecord.receiptNumber}`, saleId);
          }
        }
      }

      // 5. Loyalty (Online Only for now)
      if (customerId && settings.enableLoyalty !== false && navigator.onLine) {
        try {
          const customer = customers.find(c => c.id === customerId);
          if (customer) {
            const loyaltyRate = settings.loyaltyPointsRate || 0;
            const pointsEarned = loyaltyRate > 0 ? Math.floor(subtotal / loyaltyRate) : 0;
            const currentPoints = customer.loyaltyPoints || 0;
            const redeemed = pointsRedeemed || 0;
            const newLoyaltyPoints = Math.max(0, currentPoints + pointsEarned - redeemed);

            await customersService.update(customerId, {
              loyaltyPoints: newLoyaltyPoints,
              totalSpent: (customer.totalSpent || 0) + total,
              lastVisit: new Date().toISOString()
            });

            setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, loyaltyPoints: newLoyaltyPoints, totalSpent: (c.totalSpent || 0) + total, lastVisit: new Date().toISOString() } : c));
          }
        } catch (e) {
          console.error("Loyalty update failed", e);
        }
      }

      // 6. Stock Decrement & Alerts
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          const newStatus = newStock === 0 ? 'out_of_stock' : newStock < settings.lowStockThreshold ? 'low_stock' : 'active';

          console.log('📦 Stock update:', { productId: item.id, name: product.name, oldStock: product.stock, newStock, newStatus });

          // Optimistic local update
          setProducts(prev => prev.map(p =>
            p.id === item.id ? { ...p, stock: newStock, status: newStatus as any } : p
          ));

          // Queue database update (online or offline)
          if (navigator.onLine) {
            try {
              await productsService.update(item.id, { stock: newStock, status: newStatus });
            } catch (e) {
              console.error('Stock update failed (will retry)', e);
            }
          } else {
            console.warn('⚠️ Offline: Transfer stock update skipped (Strict Online Mode)');
            // Offline logic removed per user request
          }

          // Low stock alert
          if (newStock <= settings.lowStockThreshold && newStock > 0) {
            addNotification('alert', `Low Stock: ${product.name} (${newStock} remaining)`);
          } else if (newStock === 0) {
            addNotification('alert', `Out of Stock: ${product.name}`);
          }
        }
      }

      addNotification('success', 'Sale processed successfully');
      return { saleId, pointsResult };

    } catch (error) {
      console.error("Process Sale Failed:", error);
      addNotification('alert', 'Failed to process sale');
      throw error;
    }
  }, [
    activeSite, settings, addNotification, triggerSync, products, sites,
    employees, customers, awardPoints, awardStorePoints
  ]);

  const holdOrder = useCallback((order: HeldOrder) => {
    setHeldOrders(prev => [order, ...prev]);
    addNotification('info', 'Order placed on hold');
  }, [addNotification]);

  const releaseHold = useCallback((orderId: string) => {
    setHeldOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const requestTransfer = useCallback(async (transfer: TransferRecord) => {
    console.log('📦 requestTransfer called:', {
      id: transfer.id,
      sourceSiteId: transfer.sourceSiteId,
      destSiteId: transfer.destSiteId,
      status: transfer.status,
      itemsCount: transfer.items?.length
    });

    try {
      const created = await transfersService.create(transfer);
      console.log('✅ Transfer created in DB:', created);

      const enriched = {
        ...created,
        sourceSiteName: sites.find(s => s.id === created.sourceSiteId)?.name || 'Unknown',
        destSiteName: sites.find(s => s.id === created.destSiteId)?.name || 'Unknown'
      };
      console.log('🏷️ Enriched transfer:', enriched);

      setTransfers(prev => {
        console.log('📊 Current transfers count:', prev.length);
        const newTransfers = [enriched, ...prev];
        console.log('📊 New transfers count:', newTransfers.length);
        return newTransfers;
      });

      addNotification('success', 'Transfer requested');
      console.log('✅ requestTransfer complete, state updated');
    } catch (error) {
      console.error('❌ requestTransfer failed:', error);
      addNotification('alert', 'Failed to request transfer');
    }
  }, [sites, addNotification]);

  const shipTransfer = useCallback(async (id: string, user: string) => {
    const transfer = transfers.find(t => t.id === id);
    if (!transfer) {
      addNotification('alert', 'Transfer not found');
      return;
    }

    // Check if transfer is already shipped or completed
    if (transfer.status === 'In-Transit' || transfer.status === 'Completed') {
      addNotification('alert', `Transfer is already ${transfer.status.toLowerCase()}`);
      return;
    }

    try {
      // 1. Validate Stock Availability Before Shipping
      const stockIssues: string[] = [];
      for (const item of transfer.items) {
        const sourceProduct = products.find(p => p.id === item.productId);
        if (!sourceProduct) {
          stockIssues.push(`${item.sku}: Product not found at source`);
        } else if (sourceProduct.stock < item.quantity) {
          stockIssues.push(`${item.sku}: Insufficient stock (Available: ${sourceProduct.stock}, Requested: ${item.quantity})`);
        }
      }

      if (stockIssues.length > 0) {
        addNotification('alert', `Cannot ship transfer. Stock issues:\n${stockIssues.join('\n')}`);
        return;
      }

      // 2. Deduct Stock from Source
      for (const item of transfer.items) {
        const sourceProduct = products.find(p => p.id === item.productId);
        if (sourceProduct) {
          const newStock = Math.max(0, sourceProduct.stock - item.quantity);
          const updated = await productsService.update(sourceProduct.id, {
            ...sourceProduct,
            stock: newStock,
            status: newStock === 0 ? 'out_of_stock' : newStock < 10 ? 'low_stock' : 'active'
          });
          setProducts(prev => prev.map(p => p.id === sourceProduct.id ? updated : p));

          // Log movement
          logSystemEvent('Stock Transfer OUT', `Transferred ${item.quantity} of ${item.sku} to ${transfer.destSiteName}`, user, 'Inventory');
        }
      }

      // 3. Update Transfer Status
      await transfersService.update(id, { status: 'In-Transit' });
      setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'In-Transit' } : t));
      addNotification('success', `Transfer shipped! ${transfer.items.length} products deducted from inventory`);
    } catch (error) {
      console.error('Error shipping transfer:', error);
      addNotification('alert', 'Failed to ship transfer. Please try again.');
    }
  }, [transfers, products, addNotification, logSystemEvent]);

  const updateJob = useCallback(async (id: string, updates: Partial<WMSJob>) => {
    try {
      const updated = await wmsJobsService.update(id, updates);
      setJobs(prev => prev.map(j => j.id === id ? updated : j));

      // Invalidate jobs query
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      return;
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update job');
    }
  }, [addNotification]);

  const receiveTransfer = useCallback(async (id: string, user: string, receivedQuantities?: Record<string, number>) => {
    const transfer = transfers.find(t => t.id === id);
    if (!transfer) {
      addNotification('alert', 'Transfer not found');
      return;
    }

    // Check if transfer is already completed
    if (transfer.status === 'Completed') {
      addNotification('alert', 'Transfer has already been received');
      return;
    }

    // Check if transfer is in correct status
    if (transfer.status !== 'In-Transit') {
      addNotification('alert', `Cannot receive transfer. Current status: ${transfer.status}`);
      return;
    }

    try {
      // 1. Add Stock to Destination (use receivedQuantities if provided, otherwise use transfer quantities)
      for (const item of transfer.items) {
        const receivedQty = receivedQuantities?.[item.sku] ?? item.quantity;

        // Skip if quantity is 0 or negative
        if (typeof receivedQty === 'number' && receivedQty <= 0) {
          continue;
        }

        // Use receivedQty or fallback to item.quantity
        const qtyToAdd = typeof receivedQty === 'number' ? receivedQty : item.quantity;

        // Find matching product at destination by SKU
        const destProduct = products.find(p => p.siteId === transfer.destSiteId && p.sku === item.sku);

        // Check if destination is a store or warehouse for location marker
        const destSite = sites.find(s => s.id === transfer.destSiteId);
        const locationMarker = destSite?.type === 'Store' || destSite?.type === 'Dark Store'
          ? 'STORE-RECEIVED' // Marker for stores that product was received via transfer
          : 'Receiving Dock'; // For warehouses, will be updated during PUTAWAY

        if (destProduct) {
          // Update existing product stock and location
          const updated = await productsService.update(destProduct.id, {
            ...destProduct,
            stock: destProduct.stock + qtyToAdd,
            // Update location to mark as received if it was "Receiving Dock" or empty
            location: (destProduct.location === 'Receiving Dock' || !destProduct.location)
              ? locationMarker
              : destProduct.location
          });
          setProducts(prev => prev.map(p => p.id === destProduct.id ? updated : p));
        } else {
          // Create new product at destination
          // Use allProducts to find source details as it might not be in current site list
          const sourceProduct = allProducts.find(p => p.id === item.productId) || products.find(p => p.id === item.productId);

          if (sourceProduct) {
            const newProduct = await productsService.create({
              siteId: transfer.destSiteId,
              name: sourceProduct.name,
              sku: sourceProduct.sku,
              category: sourceProduct.category,
              price: sourceProduct.price,
              costPrice: sourceProduct.costPrice,
              salePrice: sourceProduct.salePrice,
              isOnSale: sourceProduct.isOnSale,
              stock: qtyToAdd,
              status: qtyToAdd > 0 ? 'active' : 'out_of_stock',
              location: locationMarker,
              image: sourceProduct.image
            });
            setProducts(prev => [newProduct, ...prev]);
          }
        }

        // Log movement (note if quantity differs)
        const qtyNote = qtyToAdd !== item.quantity ? ` (Expected: ${item.quantity}, Received: ${qtyToAdd})` : '';
        logSystemEvent('Stock Transfer IN', `Received ${qtyToAdd} of ${item.sku} from ${transfer.sourceSiteName}${qtyNote}`, user, 'Inventory');
      }

      // 2. Update Transfer Status
      await transfersService.update(id, { status: 'Completed' });
      setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
      addNotification('success', `Transfer received! ${transfer.items.length} products added to inventory`);
    } catch (error) {
      console.error('Error receiving transfer:', error);
      addNotification('alert', 'Failed to receive transfer. Please try again.');
    }
  }, [transfers, products, sites, allProducts, addNotification, logSystemEvent]);

  const updateTransfer = useCallback(async (id: string, updates: Partial<TransferRecord>) => {
    try {
      const updated = await transfersService.update(id, updates);
      setTransfers(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update transfer');
    }
  }, [addNotification]);


  const createTransfer = useCallback(async (transfer: TransferRecord) => {
    // Re-use logic from requestTransfer or simple create
    try {
      const created = await transfersService.create(transfer);
      const enriched = {
        ...created,
        sourceSiteName: sites.find(s => s.id === created.sourceSiteId)?.name || 'Unknown',
        destSiteName: sites.find(s => s.id === created.destSiteId)?.name || 'Unknown'
      };
      setTransfers(prev => [enriched, ...prev]);
      addNotification('success', 'Transfer created');
      return created;
    } catch (e) {
      console.error(e);
      addNotification('alert', 'Failed to create transfer');
      throw e;
    }
  }, [sites, addNotification]);

  const deleteTransfer = useCallback(async (id: string, user: string) => {
    try {
      await transfersService.delete(id);
      setTransfers(prev => prev.filter(t => t.id !== id));
      addNotification('info', 'Transfer deleted');
    } catch (e) {
      console.error(e);
      addNotification('alert', 'Failed to delete transfer');
    }
  }, [addNotification]);

  const cancelTransfer = useCallback(async (id: string, user: string) => {
    try {
      // Cast 'Cancelled' to any to bypass strict type check on Partial<TransferRecord> if needed, 
      // or assume TransferStatus includes 'Cancelled' (it might be missing in type def)
      await transfersService.update(id, { status: 'Cancelled' as any });
      setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'Cancelled' as any } : t));
      addNotification('info', 'Transfer cancelled');
    } catch (e) {
      console.error(e);
      addNotification('alert', 'Failed to cancel transfer');
    }
  }, [addNotification]);

  // NOTE: shipTransfer and requestTransfer are already defined above (lines ~3107 and ~3142)
  // We utilize those existing robust implementations.

  // Missing Job Functions
  const deleteJob = useCallback(async (id: string) => {
    try {
      await wmsJobsService.delete(id);
      setJobs(prev => prev.filter(j => j.id !== id));

      // Invalidate jobs query
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      addNotification('success', 'Job deleted');
    } catch (e) {
      console.error(e);
      addNotification('alert', 'Failed to delete job');
    }
  }, [addNotification]);

  const markJobComplete = useCallback(async (id: string, user: string) => {
    // Wrapper for updateJobStatus
    await updateJobStatus(id, 'Completed');
  }, [updateJobStatus]);

  const updatePromotion = useCallback((promotion: Partial<Promotion> & { id: string }) => {
    setPromotions(prev => prev.map(p => p.id === promotion.id ? { ...p, ...promotion } : p));
    addNotification('success', 'Promotion updated');
  }, [addNotification]);

  // Alias rejection to cancellation for now or implement specific logic
  const rejectTransfer = useCallback(async (id: string, user: string) => {
    await cancelTransfer(id, user);
  }, [cancelTransfer]);

  // Fix: Add deletePO implementation if missing or ensure it exists
  // It is defined in lines 124 but might be missing implementation body or standard placement

  const markNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const exportSystemData = useCallback(() => {
    const data = {
      settings,
      products,
      sales,
      customers,
      employees,
      suppliers
    };
    return JSON.stringify(data, null, 2);
  }, [settings, products, sales, customers, employees, suppliers]);

  const resetData = useCallback(() => {
    // In Supabase context, this might be dangerous or restricted
    // For now, we'll just reload data
    if (activeSiteId) {
      queries.refetchAll();
      addNotification('info', 'Data reloaded from server');
    } else {
      loadSites();
    }
  }, [activeSiteId, queries, loadSites, addNotification]);

  const addPromotion = useCallback((promo: Promotion) => {
    setPromotions(prev => [...prev, promo]);
    addNotification('success', `Promotion ${promo.code} Created`);
  }, [addNotification]);

  const deletePromotion = useCallback((id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    addNotification('info', 'Promotion Deleted');
  }, [addNotification]);

  // --- Discount Code Functions ---
  const addDiscountCode = useCallback((code: DiscountCode) => {
    setDiscountCodes(prev => [...prev, code]);
    addNotification('success', `Discount code "${code.code}" created`);
  }, [addNotification]);

  const updateDiscountCode = useCallback((code: DiscountCode) => {
    setDiscountCodes(prev => prev.map(c => c.id === code.id ? code : c));
    addNotification('success', `Discount code "${code.code}" updated`);
  }, [addNotification]);

  const deleteDiscountCode = useCallback((id: string) => {
    setDiscountCodes(prev => prev.filter(c => c.id !== id));
    addNotification('info', 'Discount code deleted');
  }, [addNotification]);

  const validateDiscountCode = useCallback((code: string, siteId?: string, subtotal?: number): { valid: boolean; discountCode?: DiscountCode; error?: string } => {
    const discountCode = discountCodes.find(dc => dc.code.toUpperCase() === code.toUpperCase());

    if (!discountCode) {
      return { valid: false, error: 'Invalid discount code' };
    }

    // Check status
    if (discountCode.status !== 'Active') {
      return { valid: false, error: 'This discount code is not active' };
    }

    // Check validity dates
    const now = new Date();
    const validFrom = new Date(discountCode.validFrom);
    const validUntil = new Date(discountCode.validUntil);

    if (now < validFrom) {
      return { valid: false, error: 'This discount code is not yet valid' };
    }

    if (now > validUntil) {
      return { valid: false, error: 'This discount code has expired' };
    }

    // Check usage limit
    if (discountCode.usageLimit !== undefined && discountCode.usageCount >= discountCode.usageLimit) {
      return { valid: false, error: 'This discount code has reached its usage limit' };
    }

    // Check minimum purchase amount
    if (discountCode.minPurchaseAmount !== undefined && subtotal !== undefined && subtotal < discountCode.minPurchaseAmount) {
      return { valid: false, error: `Minimum purchase of ${discountCode.minPurchaseAmount} required` };
    }

    // Check applicable sites
    if (discountCode.applicableSites && discountCode.applicableSites.length > 0 && siteId) {
      if (!discountCode.applicableSites.includes(siteId)) {
        return { valid: false, error: 'This discount code is not valid at this location' };
      }
    }

    return { valid: true, discountCode };
  }, [discountCodes]);

  const useDiscountCode = useCallback((codeId: string) => {
    setDiscountCodes(prev => prev.map(c =>
      c.id === codeId
        ? { ...c, usageCount: c.usageCount + 1 }
        : c
    ));
  }, []);

  // Note: approveBarcode and rejectBarcode are deprecated - barcode mappings no longer require approval
  const approveBarcode = useCallback(async (_id: string, _userId: string) => {
    console.warn('approveBarcode is deprecated - barcode mappings are now instant');
  }, []);

  const rejectBarcode = useCallback(async (_id: string, _userId: string, _reason: string) => {
    console.warn('rejectBarcode is deprecated - barcode mappings are now instant');
  }, []);

  // Filter data by active site
  // Data is now pre-filtered by loadSiteData, so we just pass the state directly
  // keeping these variables to match the value object structure if needed, or we can update the value object
  const filteredProducts = products;
  const filteredSales = sales;
  const filteredOrders = orders;
  const filteredEmployees = employees;
  const filteredExpenses = expenses;
  const filteredMovements = movements;
  // 🛡️ CRITICAL FIX: Export enrichedJobs (with PO hydration) instead of raw jobs
  const filteredJobs = enrichedJobs;

  const value = useMemo<DataContextType>(() => ({
    settings,
    products: filteredProducts,
    orders: filteredOrders,
    suppliers,
    sales: filteredSales,
    expenses: filteredExpenses,
    movements: filteredMovements,
    jobs: filteredJobs,
    employees: filteredEmployees,
    customers,
    shifts,
    heldOrders,
    sites,
    activeSite,
    transfers,
    notifications,
    systemLogs,
    jobAssignments,
    promotions,
    workerPoints,
    pointsTransactions,
    tasks,
    setTasks,
    allProducts,
    allSales,
    allOrders,
    discountCodes,
    zones,
    allZones,
    barcodeApprovals,
    loadingProgress,
    isDataInitialLoading,
    loadError,

    // Actions
    updateSettings,
    setActiveSite,
    addSite,
    updateSite,
    deleteSite,
    getTaxForSite,

    addProduct,
    updateProduct,
    updatePricesBySKU,
    deleteProduct,
    relocateProduct,
    cleanupAdminProducts,

    createPO,
    updatePO,
    receivePO,
    receivePOSplit,
    deletePO,

    processSale,
    processReturn,
    closeShift,
    startShift,
    triggerSync, // Expose sync trigger


    addSupplier,
    adjustStock,

    addExpense,
    deleteExpense,
    processPayroll,

    assignJob,
    updateJobItem,
    updateJobStatus,
    updateJob,
    completeJob,
    resetJob,
    fixBrokenJobs,
    deleteJob,
    markJobComplete,
    createPutawayJob,

    addEmployee,
    updateEmployee,
    deleteEmployee,
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,

    getWorkerPoints,
    awardPoints,
    getLeaderboard,
    storePoints,
    getStorePoints,
    awardStorePoints,
    calculateWorkerBonusShare,
    getStoreLeaderboard,

    addCustomer,
    updateCustomer,
    deleteCustomer,

    holdOrder,
    releaseHold,

    requestTransfer,
    shipTransfer,
    receiveTransfer,
    rejectTransfer,
    updateTransfer,
    createTransfer,
    deleteTransfer,
    cancelTransfer,

    markNotificationsRead,
    addNotification,
    clearNotification,
    clearAllNotifications,

    logSystemEvent,
    exportSystemData,
    resetData,
    refreshData,
    approveBarcode,
    rejectBarcode,

    addPromotion,
    updatePromotion,
    deletePromotion,

    addDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    validateDiscountCode,
    useDiscountCode,
    releaseOrder,
    posSyncStatus: syncStatus,
    posPendingSyncCount: pendingCount
  }), [
    settings, products, orders, suppliers, sales, expenses, movements, enrichedJobs,
    employees, customers, shifts, heldOrders, sites, activeSite, transfers,
    notifications, systemLogs, jobAssignments, promotions, workerPoints,
    pointsTransactions, tasks, schedules, storePoints, zones, allZones, allProducts,
    allSales, allOrders, discountCodes, isDataInitialLoading, loadError, syncStatus, pendingCount,
    updateSettings, setActiveSite, addSite, updateSite, deleteSite, getTaxForSite,
    addProduct, updateProduct, deleteProduct, relocateProduct, cleanupAdminProducts,
    createPO, updatePO, receivePO, deletePO, processSale, processReturn, closeShift,
    startShift, addSupplier, adjustStock, addExpense, deleteExpense, processPayroll,
    assignJob, updateJobItem, updateJobStatus, updateJob, completeJob, resetJob, fixBrokenJobs,
    deleteJob, markJobComplete, createPutawayJob, addEmployee, updateEmployee, deleteEmployee,
    getWorkerPoints, awardPoints, getLeaderboard, storePoints, getStorePoints, awardStorePoints,
    calculateWorkerBonusShare, getStoreLeaderboard, addCustomer, updateCustomer, deleteCustomer,
    holdOrder, releaseHold, requestTransfer, shipTransfer, receiveTransfer, rejectTransfer,
    updateTransfer, createTransfer, deleteTransfer, cancelTransfer, markNotificationsRead,
    addNotification, clearNotification, clearAllNotifications, logSystemEvent, exportSystemData,
    resetData, refreshData, addPromotion, updatePromotion, deletePromotion, addDiscountCode,
    updateDiscountCode, deleteDiscountCode, validateDiscountCode, useDiscountCode,
    releaseOrder, addSchedule, updateSchedule, deleteSchedule,
    barcodeApprovals, approveBarcode, rejectBarcode
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    // During initial render or provider setup, context might be undefined
    // Return a safe default instead of throwing to prevent crashes
    console.warn('useData called outside DataProvider - returning safe defaults');
    return {
      settings: DEFAULT_CONFIG,
      products: [],
      orders: [],
      suppliers: [],
      sales: [],
      expenses: [],
      movements: [],
      jobs: [],
      employees: [],
      customers: [],
      shifts: [],
      heldOrders: [],
      sites: [],
      activeSite: null,
      transfers: [],
      notifications: [],
      systemLogs: [],
      allProducts: [],
      allSales: [],
      allOrders: [],
      jobAssignments: [],
      workerPoints: [],
      pointsTransactions: [],
      tasks: [],
      setTasks: () => { },
      zones: [],
      allZones: [],
      // Add all required functions as no-ops
      updateSettings: () => { },
      refreshData: async () => { },
      loadSites: () => { },
      loadSiteData: () => { },
      addProduct: async () => ({} as Product),
      updateProduct: async () => ({} as Product),
      deleteProduct: async () => { },
      relocateProduct: async () => { },
      cleanupAdminProducts: async () => { },
      createPO: async () => ({} as PurchaseOrder),
      updatePO: async () => { },
      receivePO: async () => [],
      deletePO: async () => { },
      processSale: async () => ({} as any),
      processReturn: async () => ({} as any),
      closeShift: async () => { },
      addSupplier: async () => { },
      adjustStock: async () => { },
      addExpense: async () => { },
      deleteExpense: async () => { },
      processPayroll: async () => { },
      assignJob: async () => { },
      updateJobItem: async (jobId: string, itemId: number, status: JobItem['status'], qty: number) => { },
      updateJobStatus: async () => { },
      completeJob: async () => { },
      resetJob: async () => { },
      fixBrokenJobs: async () => { },
      createPutawayJob: async () => undefined,
      updateJob: async () => { },
      updateTransfer: async () => { },
      addEmployee: async () => { },
      updateEmployee: async () => { },
      deleteEmployee: async () => { },
      getWorkerPoints: () => undefined,
      awardPoints: () => { },
      getLeaderboard: () => [],
      storePoints: [],
      getStorePoints: () => undefined,
      awardStorePoints: () => { },
      getStoreLeaderboard: () => [],
      calculateWorkerBonusShare: () => undefined,
      addCustomer: async () => { },
      updateCustomer: async () => { },
      deleteCustomer: async () => { },
      holdOrder: async () => { },
      releaseHold: async () => { },
      requestTransfer: async () => { },
      shipTransfer: async () => { },
      receiveTransfer: async () => { },
      addNotification: () => { },
      markNotificationsRead: () => { },
      logSystemEvent: () => { },
      exportSystemData: () => '',
      resetData: () => { },
      releaseOrder: async () => { },
      posSyncStatus: 'synced',
      posPendingSyncCount: 0,
      barcodeApprovals: [],
      approveBarcode: async () => { },
      rejectBarcode: async () => { }
    } as unknown as DataContextType;
  }
  return context;
};
