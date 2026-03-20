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
  storePointsService,
  systemConfigService,
  tasksService,
  inventoryRequestsService,
  discrepancyService,
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

// --- Custom Hooks ---
import { useSiteActions } from './hooks/useSiteActions';
import { useProductActions } from './hooks/useProductActions';
import { usePOActions } from './hooks/usePOActions';
import { useSaleActions } from './hooks/useSaleActions';
import { useEmployeeActions } from './hooks/useEmployeeActions';
import { useCustomerActions } from './hooks/useCustomerActions';
import { useFinanceActions } from './hooks/useFinanceActions';
import { useGamificationActions } from './hooks/useGamificationActions';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

import { TRANSLATIONS, Language } from '../utils/translations';

const getTranslation = (path: string): string => {
  const lang = (localStorage.getItem('siifmart_language') as Language) || 'en';
  const keys = path.split('.');
  let current: any = TRANSLATIONS;

  for (const key of keys) {
    if (current[key] === undefined) return path;
    current = current[key];
  }

  if (typeof current === 'object' && current[lang]) return current[lang];
  if (typeof current === 'object' && current['en']) return current['en'];
  return path;
};



// Default config
const DEFAULT_CONFIG: SystemConfig = {
  storeName: 'SIIFMART',
  currency: 'ETB',
  taxRate: 0,
  lowStockThreshold: 10,
  fefoRotation: true,
  bayScan: false,
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

  // Exposed Setters (for Split Contexts like Fulfillment)
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setAllOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  setAllSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;

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

  addSupplier: (supplier: Supplier) => void;
  adjustStock: (productId: string, qty: number, type: 'IN' | 'OUT', reason: string, user: string) => void;

  // Finance Actions
  addExpense: (expense: ExpenseRecord) => void;
  deleteExpense: (id: string) => void;
  processPayroll: (siteId: string, user: string) => void;

  // WMS Actions


  // HR Actions
  addEmployee: (employee: Employee, user?: string) => void;
  updateEmployee: (employee: Employee, user: string) => void;
  deleteEmployee: (id: string, user: string) => void;

  // Rostering Actions


  // Gamification Actions (Warehouse - Individual)


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

  // Logistics Actions


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

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Global State for HQ
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allSales, setAllSales] = useState<SaleRecord[]>([]);
  const [allOrders, setAllOrders] = useState<PurchaseOrder[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [storePoints, setStorePoints] = useState<StorePoints[]>([]);

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

  const { syncStatus, pendingCount, triggerSync: posTriggerSync, checkQueue: posCheckQueue } = usePosSync((count) => {
    addNotification('success', `Successfully synced ${count} offline sale${count !== 1 ? 's' : ''} to database`);
  });
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

    if (queries.movements.data) setMovements(queries.movements.data);


    if (queries.storePoints.data) setStorePoints(queries.storePoints.data);
    if (queries.tasks.data) setTasks(queries.tasks.data);

    if (queries.expenses.data) setExpenses(queries.expenses.data);
    if (queries.systemLogs.data) setSystemLogs(queries.systemLogs.data);

    // If query hook is managing loading, sync it
    if (!queries.isLoadingCritical && isDataInitialLoading) {
      setIsDataInitialLoading(false);
    }
  }, [
    queries.products.data, queries.employees.data, queries.orders.data, queries.sales.data,
    queries.storePoints.data, queries.tasks.data, queries.expenses.data,
    queries.systemLogs.data, queries.suppliers.data, queries.customers.data,
    queries.movements.data, queries.isLoadingCritical, activeSiteId, sites
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
  const userSiteSyncRef = React.useRef<boolean>(false);

  useEffect(() => {
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

      if ((!canSwitchSites) && (!activeSiteId || activeSiteId !== user.siteId)) {
        console.log(`🔄 Syncing active site: "${activeSiteId || 'none'}" → "${userSite.name}" (${user.siteId})`);
        setActiveSiteId(user.siteId);
      } else if (canSwitchSites && !activeSiteId) {
        console.log('🌍 CEO/HQ Role - Staying in Global View');
      } else {
        console.log(`✅ Active site already set: ${activeSiteId}`);
      }

      userSiteSyncRef.current = true;
    } else {
      console.log('⏳ Waiting for user siteId or sites to load...');
    }
  }, [user, sites]);

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (user) {
      loadSites();
      loadSettings();
    } else {
      setIsDataInitialLoading(false);
    }
  }, [user]);

  // Load Global Data once on mount (background)
  useEffect(() => {
    if (!user) return;

    loadGlobalData();

    const quickTimeout = setTimeout(() => {
      if (isDataInitialLoading) {
        console.warn('⚡ 5s fail-safe triggered - Unblocking UI for authenticated user');
        setIsDataInitialLoading(false);
      }
    }, 5000);

    const timeout = setTimeout(() => {
      if (products.length === 0 && sites.length === 0) {
        console.warn('⚠️ Hydration taking long - No data loaded after 15s');
        setLoadError('Synchronization is taking longer than expected. Please check your connection.');
      }
    }, 15000);

    return () => {
      clearTimeout(quickTimeout);
      clearTimeout(timeout);
    };
  }, [user]);

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

      try {
        localStorage.setItem('siifmart_sites_cache', JSON.stringify(loadedSites));
      } catch (e) {
        console.warn('Failed to cache sites', e);
      }

      if (loadedSites.length === 0) {
        addNotification('info', 'No operational sites were found in the database.');
      }

    } catch (error: any) {
      console.error('❌ Failed to load sites:', error);

      const cached = localStorage.getItem('siifmart_sites_cache');
      if (cached) {
        console.log('⚠️ Network failed, loading sites from cache.');
        setSites(JSON.parse(cached));
        addNotification('info', 'Network unreachable. Loaded sites from local cache.');
        return;
      }

      const errorMsg = `Unable to connect to the logistics server (${error?.message || 'Network Error'}).`;
      addNotification('alert', `System Error: ${errorMsg} Retrying...`);
      setLoadError(errorMsg);

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
    console.log('⚠️ loadSiteData is deprecated. React Query is handling data fetching.');
    return;
  };


  const loadGlobalData = async () => {
    try {
      console.log('🌍 Loading Global HQ Data...');
      const [allProds, allSls, allOrds, allEmps, allSupps] = await Promise.all([
        productsService.getAll(undefined, 5000).then(res => res.data),
        salesService.getAll(undefined, 5000).then(res => res.data),
        purchaseOrdersService.getAll(undefined, 5000).then(res => res.data),
        employeesService.getAll(),
        suppliersService.getAll(1000).then(res => res.data)
      ]);

      setAllProducts(allProds);
      setAllSales(allSls);
      setAllOrders(allOrds);
      setEmployees(allEmps);
      setSuppliers(allSupps);

      console.log('✅ Global HQ Data Loaded');

      if (!activeSiteId) {
        setIsDataInitialLoading(false);
      }
    } catch (error) {
      console.error('❌ Failed to load global data:', error);
      if (!activeSiteId) {
        setLoadError('Failed to load global data. Check connection.');
        setIsDataInitialLoading(false);
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

  // ══════════════════════════════════════════════════════════════
  // CUSTOM HOOKS - Domain-specific actions
  // ══════════════════════════════════════════════════════════════

  const gamificationActions = useGamificationActions({ sites, storePoints, setStorePoints });

  const siteActions = useSiteActions({
    sites, activeSiteId, settings, setSites, setSettings, setActiveSiteId,
    addNotification, logSystemEvent
  });

  const productActions = useProductActions({
    activeSite, sites, products, allProducts, user,
    setProducts, setAllProducts, addNotification, logSystemEvent
  });

  const poActions = usePOActions({
    activeSite, activeSiteId, setOrders, setAllOrders,
    addNotification, logSystemEvent
  });

  const triggerSync = useCallback(() => {
    if (posTriggerSync) posTriggerSync();
    else refreshData();
  }, [posTriggerSync, refreshData]);

  const saleActions = useSaleActions({
    activeSite, settings, products, sites, employees, customers, storePoints,
    setSales, setAllSales, setProducts, setCustomers,
    addNotification, logSystemEvent, triggerSync, posCheckQueue,
    awardStorePoints: gamificationActions.awardStorePoints
  });

  const employeeActions = useEmployeeActions({
    activeSite, activeSiteId, employees, setEmployees, setShifts,
    addNotification, logSystemEvent
  });

  const customerActions = useCustomerActions({
    queries, addNotification, logSystemEvent
  });

  const financeActions = useFinanceActions({
    activeSiteId, activeSite, products, allProducts, employees,
    setProducts, setExpenses, setSuppliers,
    addNotification, logSystemEvent, queries
  });

  // ══════════════════════════════════════════════════════════════
  // REMAINING ACTIONS (small, kept inline)
  // ══════════════════════════════════════════════════════════════

  const holdOrder = useCallback((order: HeldOrder) => {
    setHeldOrders(prev => [order, ...prev]);
    addNotification('info', 'Order placed on hold');
  }, [addNotification]);

  const releaseHold = useCallback((orderId: string) => {
    setHeldOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const updatePromotion = useCallback((promotion: Partial<Promotion> & { id: string }) => {
    setPromotions(prev => prev.map(p => p.id === promotion.id ? { ...p, ...promotion } : p));
    addNotification('success', 'Promotion updated');
  }, [addNotification]);

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

    if (discountCode.status !== 'Active') {
      return { valid: false, error: 'This discount code is not active' };
    }

    const now = new Date();
    const validFrom = new Date(discountCode.validFrom);
    const validUntil = new Date(discountCode.validUntil);

    if (now < validFrom) {
      return { valid: false, error: 'This discount code is not yet valid' };
    }

    if (now > validUntil) {
      return { valid: false, error: 'This discount code has expired' };
    }

    if (discountCode.usageLimit !== undefined && discountCode.usageCount >= discountCode.usageLimit) {
      return { valid: false, error: 'This discount code has reached its usage limit' };
    }

    if (discountCode.minPurchaseAmount !== undefined && subtotal !== undefined && subtotal < discountCode.minPurchaseAmount) {
      return { valid: false, error: `Minimum purchase of ${discountCode.minPurchaseAmount} required` };
    }

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

  // Filter data by active site
  const filteredProducts = products;
  const filteredSales = sales;
  const filteredOrders = orders;
  const filteredEmployees = employees;
  const filteredExpenses = expenses;
  const filteredMovements = movements;

  const value = useMemo<DataContextType>(() => ({
    settings,
    products: filteredProducts,
    orders: filteredOrders,
    suppliers,
    sales: filteredSales,
    expenses: filteredExpenses,
    movements: filteredMovements,

    employees: filteredEmployees,
    customers,
    shifts,
    heldOrders,
    sites,
    activeSite,
    notifications,
    systemLogs,
    promotions,

    tasks,
    setTasks,
    allProducts,
    allSales,
    allOrders,
    setProducts,
    setOrders,
    setAllOrders,
    setSales,
    setAllSales,
    discountCodes,
    loadingProgress,
    isDataInitialLoading,
    loadError,

    // Site Actions (from hook)
    updateSettings: siteActions.updateSettings,
    setActiveSite: siteActions.setActiveSite,
    addSite: siteActions.addSite,
    updateSite: siteActions.updateSite,
    deleteSite: siteActions.deleteSite,
    getTaxForSite: siteActions.getTaxForSite,

    // Product Actions (from hook)
    addProduct: productActions.addProduct,
    updateProduct: productActions.updateProduct,
    updatePricesBySKU: productActions.updatePricesBySKU,
    deleteProduct: productActions.deleteProduct,
    relocateProduct: productActions.relocateProduct,
    cleanupAdminProducts: productActions.cleanupAdminProducts,
    cleanupDuplicateLocations: productActions.cleanupDuplicateLocations,

    // PO Actions (from hook)
    createPO: poActions.createPO,
    updatePO: poActions.updatePO,
    deletePO: poActions.deletePO,

    // Sale Actions (from hook)
    processSale: saleActions.processSale,
    processReturn: saleActions.processReturn,
    releaseOrder: saleActions.releaseOrder,

    // Employee Actions (from hook)
    closeShift: employeeActions.closeShift,
    startShift: employeeActions.startShift,
    addEmployee: employeeActions.addEmployee,
    updateEmployee: employeeActions.updateEmployee,
    deleteEmployee: employeeActions.deleteEmployee,

    // Customer Actions (from hook)
    addCustomer: customerActions.addCustomer,
    updateCustomer: customerActions.updateCustomer,
    deleteCustomer: customerActions.deleteCustomer,

    // Finance Actions (from hook)
    addSupplier: financeActions.addSupplier,
    adjustStock: financeActions.adjustStock,
    addExpense: financeActions.addExpense,
    deleteExpense: financeActions.deleteExpense,
    processPayroll: financeActions.processPayroll,

    // Gamification Actions (from hook)
    storePoints,
    getStorePoints: gamificationActions.getStorePoints,
    awardStorePoints: gamificationActions.awardStorePoints,
    calculateWorkerBonusShare: gamificationActions.calculateWorkerBonusShare,
    getStoreLeaderboard: gamificationActions.getStoreLeaderboard,

    triggerSync,
    posCheckQueue,

    // Inline Actions
    holdOrder,
    releaseHold,

    markNotificationsRead,
    addNotification,
    clearNotification,
    clearAllNotifications,

    logSystemEvent,
    exportSystemData,
    resetData,
    refreshData,

    addPromotion,
    updatePromotion,
    deletePromotion,

    addDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    validateDiscountCode,
    useDiscountCode,
    posSyncStatus: syncStatus,
    posPendingSyncCount: pendingCount
  }), [
    settings, products, orders, suppliers, sales, expenses, movements,
    employees, customers, shifts, heldOrders, sites, activeSite,
    notifications, systemLogs, promotions,
    tasks, storePoints, allProducts,
    allSales, allOrders, discountCodes, isDataInitialLoading, loadError, syncStatus, pendingCount,
    siteActions, productActions, poActions, saleActions, employeeActions, customerActions, financeActions, gamificationActions,
    triggerSync, holdOrder, releaseHold, markNotificationsRead, addNotification, clearNotification, clearAllNotifications,
    logSystemEvent, exportSystemData, resetData, refreshData, addPromotion, updatePromotion, deletePromotion,
    updateDiscountCode, deleteDiscountCode, validateDiscountCode, useDiscountCode
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
      employees: [],
      customers: [],
      shifts: [],
      heldOrders: [],
      sites: [],
      activeSite: undefined,
      notifications: [],
      systemLogs: [],
      promotions: [],
      tasks: [],
      setTasks: () => { },
      allProducts: [],
      allSales: [],
      allOrders: [],
      setProducts: () => { },
      setOrders: () => { },
      setAllOrders: () => { },
      setSales: () => { },
      setAllSales: () => { },
      updateSettings: () => { },
      setActiveSite: () => { },
      addSite: () => { },
      updateSite: () => { },
      deleteSite: () => { },
      getTaxForSite: () => [],
      addProduct: async () => undefined,
      updateProduct: async () => undefined,
      updatePricesBySKU: async () => { },
      deleteProduct: async () => { },
      relocateProduct: async () => { },
      cleanupAdminProducts: async () => { },
      cleanupDuplicateLocations: async () => { },
      createPO: async () => undefined,
      updatePO: async () => { },
      deletePO: () => { },
      processSale: async () => ({ saleId: '' }),
      processReturn: () => { },
      closeShift: () => { },
      startShift: () => { },
      triggerSync: () => { },
      posCheckQueue: async () => { },
      addSupplier: () => { },
      adjustStock: () => { },
      addExpense: () => { },
      deleteExpense: () => { },
      processPayroll: () => { },
      addEmployee: () => { },
      updateEmployee: () => { },
      deleteEmployee: () => { },
      storePoints: [],
      getStorePoints: () => undefined,
      awardStorePoints: () => { },
      calculateWorkerBonusShare: () => undefined,
      getStoreLeaderboard: () => [],
      addCustomer: () => { },
      updateCustomer: () => { },
      deleteCustomer: () => { },
      holdOrder: () => { },
      releaseHold: () => { },
      addNotification: () => { },
      clearNotification: () => { },
      clearAllNotifications: () => { },
      markNotificationsRead: () => { },
      logSystemEvent: () => { },
      exportSystemData: () => '',
      resetData: () => { },
      refreshData: async () => { },
      addPromotion: () => { },
      deletePromotion: () => { },
      discountCodes: [],
      addDiscountCode: () => { },
      updateDiscountCode: () => { },
      deleteDiscountCode: () => { },
      validateDiscountCode: () => ({ valid: false }),
      useDiscountCode: () => { },
      releaseOrder: async () => { },
      isDataInitialLoading: true,
      loadError: null,
      loadingProgress: { total: 0, loaded: 0, current: '', entities: {} },
      posSyncStatus: 'synced',
      posPendingSyncCount: 0
    } as unknown as DataContextType;
  }
  return context;
};
