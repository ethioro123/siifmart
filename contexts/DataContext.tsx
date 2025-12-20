
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Product, PurchaseOrder, Supplier, SaleRecord, ExpenseRecord,
  StockMovement, CartItem, PaymentMethod, WMSJob, JobItem, Employee, EmployeeTask, Customer,
  ReturnItem, ShiftRecord, HeldOrder, ReceivingItem, SystemConfig, Site, TransferRecord,
  Notification, SystemLog, JobAssignment, Promotion, DiscountCode, WorkerPoints, PointsTransaction, POINTS_CONFIG,
  StorePoints, WorkerBonusShare, BonusTier, DEFAULT_BONUS_TIERS, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION,
  StorePointRule, DEFAULT_STORE_POINT_RULES, WarehousePointRule, DEFAULT_WAREHOUSE_POINT_RULES
} from '../types';
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
  systemConfigService
} from '../services/supabase.service';
import { supabase } from '../lib/supabase';
import { realtimeService } from '../services/realtime.service';
import { useStore } from './CentralStore';
import { generateSKU, registerExistingSKU } from '../utils/skuGenerator';



// Default config
const DEFAULT_CONFIG: SystemConfig = {
  storeName: 'SIIFMART',
  currency: 'ETB',
  taxRate: 0.15,
  lowStockThreshold: 10,
  fefoRotation: true,
  binScan: false,
  enableLoyalty: true,
  enableWMS: true,
  multiCurrency: false,
  requireShiftClosure: true,
  posReceiptHeader: 'SIIFMART',
  posReceiptFooter: 'Thank you for shopping with us!',
  posTerminalId: 'POS-01',
  fiscalYearStart: '2024-01-01',
  accountingMethod: 'cash',
  language: 'en',
  warehouseBonusEligibility: {},
  posBonusEligibility: {}
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

  addProduct: (product: Product) => Promise<Product | undefined>;
  updateProduct: (product: Product, updatedBy?: string) => Promise<Product | undefined>;
  deleteProduct: (id: string) => Promise<void>;
  relocateProduct: (productId: string, newLocation: string, user: string) => Promise<void>;
  cleanupAdminProducts: () => Promise<void>;

  createPO: (po: PurchaseOrder) => Promise<PurchaseOrder | undefined>;
  updatePO: (po: PurchaseOrder) => Promise<void>;
  receivePO: (poId: string, receivedItems?: ReceivingItem[], skuDecisions?: Record<string, 'keep' | 'generate'>, scannedSkus?: Record<string, string>) => Promise<any>;
  deletePO: (poId: string) => void;

  processSale: (cart: CartItem[], method: PaymentMethod, user: string, tendered: number, change: number, customerId?: string, pointsRedeemed?: number, type?: 'In-Store' | 'Delivery' | 'Pickup') => Promise<{ saleId: string; pointsResult?: any }>;
  processReturn: (saleId: string, items: ReturnItem[], totalRefund: number, user: string) => void;
  closeShift: (shift: ShiftRecord) => void;
  startShift: (cashierId: string, openingFloat: number) => void;

  addSupplier: (supplier: Supplier) => void;
  adjustStock: (productId: string, qty: number, type: 'IN' | 'OUT', reason: string, user: string) => void;

  // Finance Actions
  addExpense: (expense: ExpenseRecord) => void;
  deleteExpense: (id: string) => void;
  processPayroll: (siteId: string, user: string) => void;

  // WMS Actions
  assignJob: (jobId: string, employeeIdOrName: string) => Promise<void>;
  updateJobItem: (jobId: string, itemId: number, status: 'Pending' | 'Picked' | 'Short' | 'Skipped', qty: number) => Promise<void>;
  updateJobStatus: (jobId: string, status: WMSJob['status']) => Promise<void>;
  completeJob: (jobId: string, user: string, skipValidation?: boolean) => Promise<any>;
  resetJob: (jobId: string) => Promise<void>;
  fixBrokenJobs: () => Promise<void>;
  createPutawayJob: (product: Product, quantity: number, user: string, source?: string) => Promise<WMSJob | undefined>;

  // HR Actions
  addEmployee: (employee: Employee, user?: string) => void;
  updateEmployee: (employee: Employee, user: string) => void;
  deleteEmployee: (id: string, user: string) => void;

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

  // System Actions
  addNotification: (type: 'alert' | 'success' | 'info', message: string) => void;
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
  // Get user from CentralStore (safely)
  const storeContext = useStore();
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

  // Derived state
  const activeSite = React.useMemo(() =>
    sites.find(s => s.id === activeSiteId),
    [sites, activeSiteId]
  );

  const addNotification = (type: 'alert' | 'success' | 'info', message: string) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Auto remove after 5s
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  };

  // Guard to prevent concurrent loadData calls
  const loadingRef = React.useRef(false);
  const loadedSiteRef = React.useRef<string>('');

  const logSystemEvent = async (action: string, details: string, user: string, module: SystemLog['module']) => {
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
  };

  // --- SYNC USER'S SITE ---
  // When user logs in or changes, update active site to match their assigned location
  // IMPORTANT: Skip sync for roles that can manually switch sites (Super Admin, Admin, Auditor)
  const userSiteSyncRef = React.useRef<boolean>(false); // Track if initial sync has been done

  useEffect(() => {
    // Roles that can switch sites should NOT have their site auto-synced after initial load
    const canSwitchSites = ['super_admin', 'Super Admin', 'Admin', 'Auditor'].includes(user?.role || '');

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
        console.log('🌍 Super Admin/HQ Role - Staying in Global View');
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
  // --- LOAD SITE DATA WHEN ACTIVE SITE CHANGES ---
  useEffect(() => {
    if (activeSiteId) {
      loadSiteData(activeSiteId);
    }
  }, [activeSiteId]);

  // Load Global Data once on mount (background)
  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadSites = async () => {
    try {
      console.log('🔄 Loading sites...');
      const loadedSites = await sitesService.getAll();
      setSites(loadedSites);

      if (loadedSites.length === 0) {
        throw new Error('No sites found. Triggering Demo Mode.');
      }

      // NOTE: We do NOT set activeSiteId here anymore. 
      // We rely on the `useEffect` observing `user` and `sites` to set the initial site.
      // This prevents race conditions where we might default to site[0] before the user profile is loaded.

    } catch (error) {
      console.error('❌ Failed to load sites:', error);
      // Fallback to demo mode if sites fail to load
      generateDemoData();
    }
  };

  const loadSettings = async () => {
    try {
      console.log('🔄 Loading system settings...');
      const loadedSettings = await systemConfigService.getSettings();
      setSettings(loadedSettings);
      console.log('✅ System settings loaded');
    } catch (error) {
      console.error('❌ Failed to load system settings:', error);
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
    // Prevent concurrent calls
    if (loadingRef.current) {
      console.log('⏭️ Skipping loadData - already loading');
      return;
    }

    // Prevent redundant loads for the same site
    if (!force && loadedSiteRef.current === siteId) {
      console.log(`⏭️ Skipping loadData - already loaded for site ${siteId}`);
      return;
    }

    loadingRef.current = true;
    try {
      console.log(`🔄 Loading data for site: ${siteId}...`);

      // Load all data in parallel, filtered by siteId where applicable
      const [
        loadedProducts,
        loadedOrders,
        loadedSuppliers,
        loadedSales,
        loadedExpenses,
        loadedMovements,
        loadedJobs,
        loadedEmployees,
        loadedCustomers,
        loadedLogs,
        loadedTransfers,
        loadedJobAssignments,
        loadedWorkerPoints
      ] = await Promise.all([
        productsService.getAll(siteId),
        purchaseOrdersService.getAll(siteId),
        suppliersService.getAll(), // Global
        salesService.getAll(siteId),
        expensesService.getAll(siteId),
        stockMovementsService.getAll(siteId),
        wmsJobsService.getAll(siteId),
        employeesService.getAll(), // Global - Always load all employees
        customersService.getAll(), // Global
        systemLogsService.getAll(), // Global
        transfersService.getAll(siteId),
        jobAssignmentsService.getAll(siteId),
        workerPointsService.getAll(siteId)
      ]);

      setProducts(loadedProducts);
      setOrders(loadedOrders);
      setSuppliers(loadedSuppliers);
      setSales(loadedSales);
      setExpenses(loadedExpenses);
      setMovements(loadedMovements);
      setJobs(loadedJobs);
      setEmployees(loadedEmployees);
      setCustomers(loadedCustomers);
      setSystemLogs(loadedLogs);
      setJobAssignments(loadedJobAssignments);
      setWorkerPoints(loadedWorkerPoints);

      // Map site names to transfers
      const enrichedTransfers = loadedTransfers.map((t: any) => ({
        ...t,
        sourceSiteName: sites.find(s => s.id === t.sourceSiteId)?.name || 'Unknown',
        destSiteName: sites.find(s => s.id === t.destSiteId)?.name || 'Unknown'
      }));
      setTransfers(enrichedTransfers);

      // Mark this site as loaded
      loadedSiteRef.current = siteId;

      console.log('✅ Data loaded successfully!');
      console.log(`   - Products: ${loadedProducts.length}`);
      console.log(`   - Employees: ${loadedEmployees.length}`);
      console.log(`   - Orders: ${loadedOrders.length}`);
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      addNotification('alert', 'Failed to load site data.');
    } finally {
      loadingRef.current = false;
    }
  };

  const loadGlobalData = async () => {
    try {
      console.log('🌍 Loading Global HQ Data...');
      // In a real app, these would be optimized aggregate queries
      // For now, we fetch all and aggregate on client (careful with volume)
      const [allProds, allSls, allOrds, allEmps] = await Promise.all([
        productsService.getAll(),
        salesService.getAll(),
        purchaseOrdersService.getAll(),
        employeesService.getAll()
      ]);

      setAllProducts(allProds);
      setAllSales(allSls);
      setAllOrders(allOrds);
      setEmployees(allEmps); // HQ sees all employees

      console.log('✅ Global HQ Data Loaded');
    } catch (error) {
      console.error('❌ Failed to load global data:', error);
    }
  };

  const generateDemoData = () => {
    addNotification('alert', 'Failed to connect to server. Loading DEMO DATA.');

    // --- GENERATE MOCK DATA FOR TESTING ---
    const mockSites: Site[] = [
      { id: 'WH-01', code: 'WH-01', name: 'Adama Distribution Center', type: 'Warehouse', address: 'Adama, Ethiopia', status: 'Active', manager: 'Ahmed Hassan', capacity: 10000, terminalCount: 5 },
      { id: 'WH-02', code: 'WH-02', name: 'Harar Logistics Hub', type: 'Warehouse', address: 'Harar, Ethiopia', status: 'Active', manager: 'Fatima Yusuf', capacity: 8000, terminalCount: 4 },
      { id: 'WH-03', code: 'WH-03', name: 'Dire Dawa Storage Facility', type: 'Warehouse', address: 'Dire Dawa, Ethiopia', status: 'Active', manager: 'Solomon Tesfaye', capacity: 12000, terminalCount: 6 },
      { id: 'WH-04', code: 'WH-04', name: 'Bedeno Fulfillment Center', type: 'Warehouse', address: 'Bedeno, Ethiopia', status: 'Active', manager: 'Maryam Ibrahim', capacity: 9000, terminalCount: 5 },
      { id: 'WH-05', code: 'WH-05', name: 'Burqa Cold Chain Warehouse', type: 'Warehouse', address: 'Burqa, Ethiopia', status: 'Active', manager: 'Dawit Bekele', capacity: 5000, terminalCount: 3 },
      { id: 'ST-01', code: 'ST-01', name: 'Bole Supermarket', type: 'Store', address: 'Bole, Addis Ababa', status: 'Active', manager: 'Sara Mohammed', capacity: 2000, terminalCount: 3 },
      { id: 'ST-02', code: 'ST-02', name: 'Ambo Retail Store', type: 'Store', address: 'Ambo, Ethiopia', status: 'Active', manager: 'Yonas Alemayehu', capacity: 1500, terminalCount: 2 },
      { id: 'ST-03', code: 'ST-03', name: 'Aratanya Market', type: 'Store', address: 'Aratanya, Ethiopia', status: 'Active', manager: 'Hanna Girma', capacity: 1800, terminalCount: 2 },
      { id: 'ST-04', code: 'ST-04', name: 'Awaday Grocery', type: 'Store', address: 'Awaday, Ethiopia', status: 'Active', manager: 'Abdi Rahman', capacity: 1600, terminalCount: 2 },
      { id: 'ST-05', code: 'ST-05', name: 'Fadis Supercenter', type: 'Store', address: 'Fadis, Ethiopia', status: 'Active', manager: 'Tigist Haile', capacity: 3000, terminalCount: 4 },
    ];

    const mockProducts: Product[] = Array.from({ length: 50 }).map((_, i) => ({
      id: `PROD-${i + 1}`,
      siteId: mockSites[Math.floor(Math.random() * mockSites.length)].id,
      name: `Product ${i + 1}`,
      sku: `SKU-${1000 + i}`,
      category: ['Electronics', 'Food', 'Beverages', 'Fresh'][Math.floor(Math.random() * 4)],
      price: Math.floor(Math.random() * 100) + 10,
      costPrice: Math.floor(Math.random() * 80) + 5,
      salePrice: Math.floor(Math.random() * 120) + 15,
      stock: Math.floor(Math.random() * 100),
      status: 'active',
      location: `A-${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 5)}`,
      image: `https://picsum.photos/200?random=${i}`,
      salesVelocity: 'Medium'
    }));

    const mockEmployees: Employee[] = mockSites.flatMap(site => [
      { id: `EMP-${site.id}-1`, code: `SIIF-${site.id}-1`, siteId: site.id, name: `${site.manager}`, role: 'manager', email: `mgr@${site.id}.com`, phone: '555-0100', avatar: '', status: 'Active', joinDate: '2023-01-01', department: 'Management', performanceScore: 95, attendanceRate: 98 },
      { id: `EMP-${site.id}-2`, code: `SIIF-${site.id}-2`, siteId: site.id, name: `Worker ${site.id}`, role: 'picker', email: `wkr@${site.id}.com`, phone: '555-0101', avatar: '', status: 'Active', joinDate: '2023-02-01', department: 'Operations', performanceScore: 88, attendanceRate: 95 }
    ]);

    setSites(mockSites);

    // Check if user is Admin/HQ before forcing a site
    const isHQRole = ['super_admin', 'admin', 'auditor', 'finance_manager', 'hr', 'procurement_manager', 'it_support'].includes(user?.role || '');
    if (!isHQRole) {
      setActiveSiteId(mockSites[0].id);
    } else {
      console.log('🌍 Demo Mode: HQ Role detected - Defaulting to Global View');
    }
    setProducts(mockProducts);
    setEmployees(mockEmployees);
    setTransfers([]);
    setJobs([]);
    setSales([]);
    setCustomers([]);
    setSuppliers([]);
    setOrders([]);
    setExpenses([]);
    setMovements([]);
    setSystemLogs([]);
  };

  // --- REAL-TIME UPDATES ---
  useEffect(() => {
    if (!activeSiteId) return;

    console.log(`📡 Subscribing to real-time updates for site: ${activeSiteId}`);

    const subscriptions = realtimeService.subscribeToSite(activeSiteId, {
      onProductChange: (event, payload) => {
        if (event === 'INSERT') setProducts(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setProducts(prev => prev.map(p => p.id === payload.id ? payload : p));
        else if (event === 'DELETE') setProducts(prev => prev.filter(p => p.id !== payload.id));
      },
      onSaleChange: (event, payload) => {
        if (event === 'INSERT') setSales(prev => [payload, ...prev]);
      },
      onStockChange: (event, payload) => {
        if (event === 'INSERT') setMovements(prev => [payload, ...prev]);
      },
      onCustomerChange: (event, payload) => {
        if (event === 'INSERT') setCustomers(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setCustomers(prev => prev.map(c => c.id === payload.id ? payload : c));
      },
      onWMSJobChange: (event, payload) => {
        if (event === 'INSERT') setJobs(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setJobs(prev => prev.map(j => j.id === payload.id ? payload : j));
      },
      onJobAssignmentChange: (event, payload) => {
        if (event === 'INSERT') setJobAssignments(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setJobAssignments(prev => prev.map(a => a.id === payload.id ? payload : a));
        else if (event === 'DELETE') setJobAssignments(prev => prev.filter(a => a.id !== payload.id));
      }
    });

    return () => {
      console.log('Unsubscribing from real-time updates...');
      realtimeService.unsubscribeAll(subscriptions);
    };
  }, [activeSiteId]);

  // --- ACTIONS ---

  const updateSettings = async (newSettings: Partial<SystemConfig>, user: string) => {
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
  };

  const setActiveSite = (id: string) => setActiveSiteId(id);

  const addSite = async (site: Site, user: string) => {
    try {
      const newSite = await sitesService.create(site);
      setSites(prev => [newSite, ...prev]);
      logSystemEvent('Site Added', `New site created: ${site.name}`, user, 'Sites');
      addNotification('success', `Site ${site.name} created successfully`);
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to create site');
    }
  };

  const updateSite = async (site: Site, user: string) => {
    try {
      const updated = await sitesService.update(site.id, site);
      setSites(prev => prev.map(s => s.id === site.id ? updated : s));
      logSystemEvent('Site Updated', `Site updated: ${site.name}`, user, 'Sites');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update site');
    }
  };

  const deleteSite = async (id: string, user: string) => {
    try {
      await sitesService.delete(id);
      setSites(prev => prev.filter(s => s.id !== id));
      logSystemEvent('Site Deleted', `Site deleted: ${id}`, user, 'Sites');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete site');
    }
  };

  const addProduct = async (product: Product): Promise<Product | undefined> => {
    console.log('🧪 DataContext: addProduct called with:', product);
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

      // 2. Get the target site to check its type
      const targetSiteId = product.siteId || product.site_id || activeSite.id;
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

      addNotification('success', `Product ${product.name} added`);
      logSystemEvent('Product Added', `Product "${product.name}" (SKU: ${product.sku}) created in site ${targetSiteId}`, user?.name || 'System', 'Inventory');
      return newProduct; // Return the created product
    } catch (error: any) {
      console.error('Error adding product:', error);
      if (error?.code === '23505' || error?.message?.includes('unique constraints')) {
        addNotification('alert', `Duplicate SKU! A product with SKU "${product.sku}" already exists in this site.`);
      } else {
        addNotification('alert', `Failed to add product: ${error.message || 'Unknown error'}`);
      }
      return undefined;
    }
  };

  const updateProduct = async (product: Product, updatedBy?: string): Promise<Product | undefined> => {
    try {
      // ============================================================
      // VALIDATION: Prevent common data quality issues
      // ============================================================

      // 1. Validate price is set and greater than 0
      if (!product.price || product.price <= 0) {
        addNotification('alert', 'Product price must be greater than 0. Please set a valid price.');
        return;
      }

      // 2. Check if trying to move product to HQ site
      const targetSiteId = product.siteId || (product as any).site_id;
      if (user?.siteId) {
        const s = sites.find(site => site.id === user.siteId);
        if (s) setActiveSiteId(s.id);
      }
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

      await productsService.update(product.id, product);

      // Update local state immediately
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      setAllProducts(prev => prev.map(p => p.id === product.id ? product : p));

      addNotification('success', `Product ${product.name} updated`);
      logSystemEvent('Product Updated', `Product "${product.name}" (SKU: ${product.sku}) updated`, updatedBy || user?.name || 'System', 'Inventory');
      return product;
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update product');
      throw error; // Re-throw to allow caller to handle error
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      // Use cascade delete to remove related records (stock_movements, etc.) first
      await productsService.cascadeDelete(id);

      // Update local state
      setProducts(prev => prev.filter(p => p.id !== id));
      setAllProducts(prev => prev.filter(p => p.id !== id));

      addNotification('success', 'Product and related records deleted permanently');
      logSystemEvent('Product Deleted', `Product with ID ${id} and all related records deleted permanently`, user?.name || 'System', 'Inventory');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete product');
      throw error; // Re-throw to allow caller to handle error
    }
  };

  const relocateProduct = async (productId: string, newLocation: string, user: string) => {
    try {
      await productsService.update(productId, { location: newLocation });

      // Update local state immediately
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, location: newLocation } : p));
      setAllProducts(prev => prev.map(p => p.id === productId ? { ...p, location: newLocation } : p));

      logSystemEvent('Product Relocated', `Product ${productId} moved to ${newLocation}`, user, 'Inventory');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to relocate product');
    }
  };

  const cleanupAdminProducts = async () => {
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
  };

  const createPO = async (po: PurchaseOrder): Promise<PurchaseOrder | undefined> => {
    try {
      // Extract line items from the PO
      const items = po.lineItems || [];

      console.log('Creating PO with data:', po);

      // Create the PO in the database
      // NOTE: We pass po.siteId directly. DataContext should not override it if it's already set.
      const newPO = await purchaseOrdersService.create({
        ...po,
        poNumber: po.poNumber || po.id, // Pass Human ID as poNumber
        site_id: po.siteId || activeSite?.id
      }, items);

      // Update local state (both site-specific and global)
      setOrders(prev => [newPO, ...prev]);
      setAllOrders(prev => [newPO, ...prev]);
      addNotification('success', `PO #${newPO.id.slice(0, 8)} created successfully`);

      // Refresh orders from DB to ensure consistency
      const allUpdatedOrders = await purchaseOrdersService.getAll(); // Get all orders
      setAllOrders(allUpdatedOrders); // Update global orders

      // Update site-specific orders (filter by active site)
      if (activeSiteId) {
        const siteOrders = await purchaseOrdersService.getAll(activeSiteId);
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
        id: po.id || `PO-${Date.now()}`,
        siteId: po.siteId || activeSite?.id || 'SITE-001'
      };

      setOrders(prev => [localPO, ...prev]);
      setAllOrders(prev => [localPO, ...prev]); // Also update allOrders
      addNotification('success', `PO #${localPO.id.slice(0, 8)} created (local - DB Failed: ${error instanceof Error ? error.message : String(error)})`);
    }
  };

  const updatePO = async (po: PurchaseOrder) => {
    try {
      await purchaseOrdersService.update(po.id, po);
      setOrders(prev => prev.map(o => o.id === po.id ? po : o));
      setAllOrders(prev => prev.map(o => o.id === po.id ? po : o)); // Also update allOrders
      addNotification('success', `PO ${po.id} updated`);
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update PO');
    }
  };

  const receivePO = async (poId: string, receivedItems?: ReceivingItem[], skuDecisions?: Record<string, 'keep' | 'generate'>, scannedSkus?: Record<string, string>) => {
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

        const jobPromises = itemsToProcess.map(async (item, index) => {
          let targetProductId = item.productId;

          // Get the received data for this item (qty, etc)
          const receivedData = receivedItems?.find(r =>
            (r.productId && r.productId === item.productId) ||
            (r.id && r.id === item.id)
          );
          const qtyToReceive = receivedData ? receivedData.quantity : item.quantity; // Default to full PO qty if not specified

          // Try to find the source product to get SKU
          const sourceProduct = allProducts.find(p => p.id === item.productId);

          if (sourceProduct) {
            // It's a catalog product. Check if it exists at the destination site.
            const sku = sourceProduct.sku;
            const existingSiteProduct = allProducts.find(p =>
              p.sku === sku && (p.siteId === targetSiteId || p.site_id === targetSiteId)
            );

            if (existingSiteProduct) {
              targetProductId = existingSiteProduct.id;
              console.log(`✅ Product ${sku} exists at site, using ID:`, targetProductId);
            } else {
              // Product exists in catalog but NOT at this site. Auto-create it.
              try {
                console.log(`🆕 Auto-creating product ${sku} for site ${targetSiteId}`);
                const newProductData = {
                  ...sourceProduct,
                  id: undefined, // Generate new ID
                  siteId: targetSiteId,
                  site_id: targetSiteId,
                  stock: 0, // Will be updated by Putaway
                  posReceivedAt: null, // Reset receiving status
                  pos_received_at: null
                };
                // Remove ID to let DB generate it
                delete (newProductData as any).id;
                delete (newProductData as any).created_at;
                delete (newProductData as any).updated_at;

                const newProduct = await productsService.create(newProductData as any);
                targetProductId = newProduct.id;
                setAllProducts(prev => [...prev, newProduct]);
                // Update local products if relevant to current view
                if (targetSiteId === activeSiteId) {
                  setProducts(prev => [...prev, newProduct]);
                }
                console.log(`✅ Created product at site:`, newProduct.id);
              } catch (err) {
                console.error("❌ Failed to auto-create site product:", err);
                // Fallback to original ID (will likely fail stock update but keeps job valid)
              }
            }
          }

          const product = allProducts.find(p => p.id === targetProductId) || sourceProduct;

          // Fallback to PO item data if product not found (handles custom products)
          const productName = product?.name || item.productName;
          const productCategory = product?.category || 'General';

          // SKU GENERATION & REGISTRATION LOGIC WITH DECISIONS & SCANS
          let productSku: string;
          let needsSkuUpdate = false;
          const userDecision = item.productId ? skuDecisions?.[item.productId] : undefined;
          const scannedSku = item.productId ? scannedSkus?.[item.productId] : undefined; // Get scanned SKU for this product

          if (scannedSku && scannedSku.trim() !== '') {
            // 1. Manual/Scanned SKU (Highest Priority)
            productSku = scannedSku.trim().toUpperCase();
            needsSkuUpdate = true; // Always save scanned SKU
            console.log(`✅ Using SCANNED SKU: ${productSku} for product: ${productName}`);
          } else if (product?.sku && product.sku.trim() !== '' && product.sku !== 'MISC') {
            // 2. Existing Product SKU
            if (userDecision === 'generate') {
              // User chose to DISCARD and generate new
              // Pass allProducts for live check
              productSku = generateSKU(productCategory, allProducts);
              needsSkuUpdate = true;
              console.log(`🔄 User chose to generate NEW SKU: ${productSku} (replacing ${product.sku}) for product: ${productName}`);
            } else {
              // User chose to KEEP existing (default)
              productSku = product.sku;
              console.log(`✅ User chose to KEEP existing SKU: ${productSku} for product: ${productName}`);
            }
          } else if (item.sku && item.sku.trim() !== '' && item.sku !== 'MISC') {
            // 3. PO PO Item SKU (Supplier provided)
            productSku = item.sku;
            needsSkuUpdate = true; // Mark to save to product
            console.log(`✅ Using PO item SKU: ${productSku} for product: ${productName}`);
          } else {
            // 4. Fallback: Auto-Generate
            // Pass allProducts for live check
            productSku = generateSKU(productCategory, allProducts);
            needsSkuUpdate = true; // Mark to save to product
            console.log(`🆕 Generated new SKU: ${productSku} for product: ${productName} (Category: ${productCategory})`);
          }


          // ✅ HANDLE MANUAL ITEMS: If no product exists, create it now
          if (!product && !targetProductId) {
            // First, check if a product with this name already exists at this site
            const existingByName = allProducts.find(p =>
              p.name.toLowerCase() === productName.toLowerCase() &&
              (p.siteId === targetSiteId || p.site_id === targetSiteId)
            );

            if (existingByName) {
              // Reuse existing product
              targetProductId = existingByName.id;
              console.log(`♻️ Reusing existing product: ${existingByName.name} (${existingByName.id})`);

              // Link PO Item to this product
              if (item.id) {
                const { error: linkErr } = await supabase
                  .from('po_items')
                  .update({ product_id: existingByName.id })
                  .eq('id', item.id);
                if (linkErr) console.error('Failed to link PO item to existing product', linkErr);

                // Update local orders state
                setOrders(prev => prev.map(o => {
                  if (o.id === poId) {
                    return {
                      ...o,
                      lineItems: o.lineItems?.map(li =>
                        li.id === item.id ? { ...li, productId: existingByName.id } : li
                      )
                    };
                  }
                  return o;
                }));
              }
            } else {
              // Create new product
              try {
                console.log(`🆕 Creating NEW Manual Product: ${productName} (SKU: ${productSku})`);
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

                needsSkuUpdate = false; // Already created with correct SKU
                console.log(`✅ Manual Product Created: ${newP.id}`);

                // 🔗 Link PO Item to new Product so it tracks correctly
                if (item.id) {
                  console.log(`🔗 Linking PO Item ${item.id} to new Product ${newP.id}`);
                  const { error: linkErr } = await supabase
                    .from('po_items')
                    .update({ product_id: newP.id })
                    .eq('id', item.id);
                  if (linkErr) console.error('Failed to link PO item', linkErr);

                  // Update local orders state so UI reflects the link immediately
                  setOrders(prev => prev.map(o => {
                    if (o.id === poId) {
                      return {
                        ...o,
                        lineItems: o.lineItems?.map(li =>
                          li.id === item.id ? { ...li, productId: newP.id } : li
                        )
                      };
                    }
                    return o;
                  }));
                }
              } catch (err) {
                console.error('Failed to create manual product', err);
                addNotification('alert', `Failed to create product for ${productName}`);
              }
            }
          } // Close outer if (!product && !targetProductId)

          // ✅ SAVE THE SKU AND BARCODE TO THE PRODUCT IN THE DATABASE
          if (needsSkuUpdate && (product || targetProductId)) {
            const pidToUpdate = product?.id || targetProductId;
            if (pidToUpdate) {
              try {
                // If the scanned SKU looks like a barcode (EAN-13, UPC, etc.), save it as barcode too
                const updateData: any = { sku: productSku };

                // Detect if scanned value is likely a barcode
                if (scannedSku && scannedSku.trim() !== '') {
                  const cleanScan = scannedSku.trim();
                  // Check if it's numeric (EAN-13/UPC) or follows barcode patterns
                  const isEAN = /^\d{12,13}$/.test(cleanScan); // EAN-13 or UPC-A
                  const isUPC = /^\d{8,12}$/.test(cleanScan); // UPC variations
                  const isCODE = /^[A-Z0-9]{6,20}$/i.test(cleanScan); // CODE128/CODE39

                  if (isEAN || isUPC || isCODE) {
                    updateData.barcode = cleanScan;
                    updateData.barcodeType = isEAN ? 'EAN-13' : isUPC ? 'UPC-A' : 'CODE128';
                    console.log(`📊 Saving barcode: ${cleanScan} (type: ${updateData.barcodeType})`);
                  }
                }

                console.log(`💾 Saving SKU ${productSku} to product ${pidToUpdate}...`, updateData);
                await productsService.update(pidToUpdate, updateData);
                // Update local state
                setAllProducts(prev => prev.map(p => p.id === pidToUpdate ? { ...p, ...updateData } : p));
                setProducts(prev => prev.map(p => p.id === pidToUpdate ? { ...p, ...updateData } : p));
                console.log(`✅ SKU ${productSku} saved to product ${productName}`);
              } catch (updateError) {
                console.error(`❌ Failed to save SKU to product:`, updateError);
                // Continue anyway - use the SKU for the job even if DB update failed
              }
            }
          }

          const productImage = product?.image || '/placeholder.png';

          const newJob: Omit<WMSJob, 'id' | 'created_at' | 'updated_at'> = {
            siteId: targetSiteId,
            site_id: targetSiteId, // Ensure snake_case for Supabase
            type: 'PUTAWAY',
            status: 'Pending',
            priority: 'Normal',
            assignedTo: '',
            location: 'Receiving Dock',
            items: 1, // Number of distinct products (line items), not total quantity
            orderRef: poId,
            jobNumber: `PW-${(po.poNumber || poId.slice(0, 8)).replace(/[^A-Z0-9-]/gi, '')}-${Date.now().toString(36).toUpperCase()}`,
            lineItems: [{
              productId: targetProductId!, // Use the SITE-SPECIFIC ID
              name: productName,
              sku: productSku, // ✅ Use finalized SKU
              image: productImage,
              expectedQty: qtyToReceive || 0, // Use ACTUAL received qty, not PO expected
              pickedQty: 0,
              status: 'Pending'
            }]
          };

          // Persist to DB (DB will generate UUID)
          try {
            console.log('💾 Creating WMS job in database...', newJob);
            const createdJob = await wmsJobsService.create(newJob as any);
            console.log('✅ Job created:', createdJob.id);
            return { job: createdJob, productId: targetProductId, sku: productSku };
          } catch (e) {
            console.error('❌ Failed to create WMS job:', e);
            // Fallback: create with temp ID for local state
            return { job: { ...newJob, id: crypto.randomUUID() } as WMSJob, productId: targetProductId, sku: productSku };
          }
        });

        const results = await Promise.all(jobPromises);
        const createdJobs = results.map(r => r.job);

        // Create map of finalized SKUs to return
        const finalizedSkus: Record<string, string> = {};
        results.forEach(r => {
          if (r.productId && r.sku) {
            finalizedSkus[r.productId] = r.sku;
          }
        });

        console.log(`✅ Created ${createdJobs.length} PUTAWAY jobs`);

        // Log Successful Reception
        const receivedCount = itemsToProcess.length;
        if (receivedCount > 0) {
          logSystemEvent(
            'Stock Received',
            `Received ${receivedCount} items for PO ${po.poNumber || poId}`,
            user?.name || 'Inventory Manager',
            'Inventory'
          );
        }

        // Force refresh jobs from DB SYNCHRONOUSLY to ensure visibility
        if (targetSiteId) {
          const js = await wmsJobsService.getAll(targetSiteId);
          console.log('🔄 Refreshed jobs from DB. Count:', js.length);
          setJobs(js);
        } else {
          setJobs(prev => [...prev, ...createdJobs]);
        }

        // Return the finalized SKUs so UI can use them immediately
        try {
          // Check if ALL items have been fully received
          // Fetch all jobs for this PO again to include the new ones
          const allJobsForPO = [...jobs, ...createdJobs].filter(j => j.orderRef === poId && j.status !== 'Completed');

          let allReceived = true;
          po.lineItems?.forEach(item => {
            const totalJobQty = allJobsForPO.reduce((sum, job) => {
              const jobItem = job.lineItems.find((ji: any) => ji.productId === item.productId);
              return sum + (jobItem ? jobItem.expectedQty : 0);
            }, 0);

            if (totalJobQty < item.quantity) {
              allReceived = false;
            }
          });

          if (allReceived) {
            console.log('✅ PO fully received. Updating status to RECEIVED.');
            await purchaseOrdersService.receive(poId);
            setOrders(prev => prev.map(o => o.id === poId ? { ...o, status: 'Received' } : o));
            setAllOrders(prev => prev.map(o => o.id === poId ? { ...o, status: 'Received' } : o));
            addNotification('success', `PO ${poId} fully received! All items processed.`);
          } else {
            console.log('⚠️ PO partially received. Status remains APPROVED.');
            addNotification('success', `Items received. PO remains open for remaining items.`);
          }

          return finalizedSkus; // ✅ RETURN SKUS!
        } catch (error) {
          console.error(error);
          addNotification('alert', 'Failed to update PO status');
          return finalizedSkus; // Return SKUs even if status update fails
        }
      }


    } catch (error) {
      console.error('Error in receivePO:', error);
      addNotification('alert', 'Error processing reception');
    }
  };

  const deletePO = async (poId: string) => {
    try {
      await purchaseOrdersService.delete(poId);
      setOrders(prev => prev.filter(o => o.id !== poId));
      setAllOrders(prev => prev.filter(o => o.id !== poId)); // Also update allOrders
      addNotification('success', 'PO deleted');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete PO');
    }
  };

  const fixBrokenJobs = async () => {
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
              id: `PUT-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
              siteId: po.siteId || activeSite?.id || 'SITE-001',
              site_id: po.siteId || activeSite?.id,
              type: 'PUTAWAY',
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
                image: product?.image || '/placeholder.png',
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
  };

  /**
   * Create a PUTAWAY job for a product added through Inventory.
   * This allows products created in Inventory to flow through Fulfillment just like PO items.
   */
  const createPutawayJob = async (
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

      const jobId = `PUT-INV-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

      const newJob: WMSJob = {
        id: jobId,
        siteId: targetSiteId,
        site_id: targetSiteId,
        type: 'PUTAWAY',
        status: 'Pending',
        priority: 'Normal',
        assignedTo: '',
        location: product.location || 'Receiving Dock',
        items: quantity,
        orderRef: `INV-${product.id}`, // Reference to track source
        lineItems: [{
          productId: product.id,
          name: product.name,
          sku: product.sku || 'UNKNOWN',
          image: product.image || '/placeholder.png',
          expectedQty: quantity,
          pickedQty: 0,
          status: 'Pending'
        }],
        createdAt: new Date().toISOString(),
        requestedBy: userName
      };

      console.log('📦 Creating PUTAWAY job for Inventory product:', {
        jobId,
        productName: product.name,
        quantity,
        siteId: targetSiteId,
        source
      });

      try {
        const createdJob = await wmsJobsService.create(newJob as any);
        console.log('✅ Inventory PUTAWAY job created:', createdJob.id);

        // Update local state
        setJobs(prev => [createdJob, ...prev]);

        return createdJob;
      } catch (error) {
        console.error('❌ Failed to create putaway job in DB:', error);
        // Fallback: add to local state with temp ID
        const fallbackJob = { ...newJob, id: crypto.randomUUID() } as WMSJob;
        setJobs(prev => [fallbackJob, ...prev]);
        return fallbackJob;
      }
    } catch (error) {
      console.error('Error creating putaway job:', error);
      return undefined;
    }
  };

  const processSale = async (
    cart: CartItem[],
    method: PaymentMethod,
    user: string,
    tendered: number,
    change: number,
    customerId?: string,
    pointsRedeemed?: number,
    type: 'In-Store' | 'Delivery' | 'Pickup' = 'In-Store'
  ): Promise<{ saleId: string; pointsResult?: any }> => {
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * settings.taxRate;
      const total = subtotal + tax;

      const sale = await salesService.create({
        siteId: activeSite?.id || '',
        site_id: activeSite?.id,
        customer_id: customerId,
        date: new Date().toISOString(),
        items: cart,
        subtotal,
        tax,
        total,
        method: method,
        status: 'Completed',
        amountTendered: tendered,
        change,
        cashierName: user,
        type, // Save the type
        fulfillmentStatus: type === 'In-Store' ? 'Delivered' : 'Picking'
      }, cart);

      // --- GAMIFICATION: Award Points for Sale ---
      let pointsResult = null;
      if (settings.bonusEnabled !== false) {
        // 1. Calculate Store Points (Team-based)
        const storeRules = settings.posPointRules || DEFAULT_STORE_POINT_RULES;
        let totalStorePoints = 0;

        cart.forEach(item => {
          // Rule Matcher
          const categoryRules = storeRules.filter(r => r.enabled && r.type === 'category' && r.categoryId === item.category);
          const quantityRules = storeRules.filter(r => r.enabled && r.type === 'quantity' && r.categoryId === 'all');

          // Apply highest priority category rule or base rule
          const activeRule = categoryRules.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] ||
            storeRules.find(r => r.id === 'rule-base');

          if (activeRule) {
            let itemPoints = item.quantity * activeRule.pointsPerUnit;
            if (activeRule.multiplier) itemPoints *= activeRule.multiplier;
            totalStorePoints += Math.floor(itemPoints);
          }
        });

        // Revenue based points
        const revenueRule = storeRules.find(r => r.type === 'revenue' && r.enabled);
        if (revenueRule && revenueRule.revenueThreshold) {
          totalStorePoints += Math.floor((subtotal / revenueRule.revenueThreshold) * (revenueRule.pointsPerRevenue || 1));
        }

        // Award to Store
        awardStorePoints(activeSite?.id || '', totalStorePoints, subtotal);

        // 2. Calculate Individual Cashier Points
        // Cashiers get a smaller individual award for each transaction to drive their personal level/rank
        const individualPoints = 5 + Math.floor(subtotal / 500); // Base 5 + 1 per 500 ETB

        const cashierEmployee = employees.find(e => e.name === user || e.id === user || e.email === user);
        if (cashierEmployee) {
          awardPoints(
            cashierEmployee.id,
            individualPoints,
            'job_complete',
            `Processed sale ${sale.receiptNumber || sale.id}`,
            sale.id
          );

          pointsResult = {
            points: individualPoints,
            storePoints: totalStorePoints,
            breakdown: [
              { label: 'Transaction Base', points: 5 },
              { label: 'Revenue Bonus', points: Math.floor(subtotal / 500) },
              { label: 'Team Contribution', points: totalStorePoints }
            ].filter(b => b.points > 0)
          };
        }
      }

      // --- OPTIMISTIC UPDATE: Update local state immediately ---
      setSales(prev => [sale, ...prev]);

      // --- STOCK LEVEL CHECK (RETAIL -> WAREHOUSE CONNECTION) ---
      // Check if any item dropped below threshold to trigger replenishment
      cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const newStock = product.stock - item.quantity;
          if (newStock <= settings.lowStockThreshold) {
            // Trigger Warehouse Alert
            addNotification('alert', `⚠️ Low Stock Alert: ${product.name} is down to ${newStock}. Replenishment needed!`);
            // In a real system, this would create a 'Replenish' task automatically
          }
        }
      });

      // --- AUTO-GENERATE WMS JOBS (ALL SALES - IN-STORE IS PRIORITY) ---
      // Supports CROSS-WAREHOUSE FULFILLMENT: Any store can source from any warehouse
      if (settings.enableWMS && cart.length > 0) {
        try {
          // Store where order was placed (requesting store)
          const requestingStoreId = sale.siteId || activeSite?.id || '';
          const requestingStore = sites.find(s => s.id === requestingStoreId);

          // --- CROSS-WAREHOUSE FULFILLMENT LOGIC ---
          // Priority:
          // 1) Local warehouse (same site)
          // 2) Single Nearest Warehouse (Distance-based)
          // 3) Split Fulfillment (Multiple warehouses if needed)

          const warehouses = sites.filter(s => s.type === 'Warehouse' && s.status === 'Active');

          // Helper: Calculate distance between two coordinates (Haversine formula)
          const getDistance = (lat1?: number, lon1?: number, lat2?: number, lon2?: number): number => {
            if (!lat1 || !lon1 || !lat2 || !lon2) return 99999; // Return huge distance if coords missing
            const R = 6371; // Radius of the earth in km
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distance in km
          };

          // Function to check if a warehouse can fulfill specific items
          const canFulfillItems = (warehouseId: string, itemsToCheck: typeof cart): boolean => {
            // In a real app, check site-specific inventory.
            // For simulation, we assume global stock is available at all warehouses
            // UNLESS we want to simulate split fulfillment.
            // TODO: Connect to real site-specific inventory table
            return itemsToCheck.every(item => {
              const product = products.find(p => p.id === item.id);
              return product && product.stock >= item.quantity;
            });
          };

          let fulfillmentPlan: { warehouseId: string, items: typeof cart }[] = [];

          // STRATEGY 1: Local Fulfillment
          if (requestingStore?.type === 'Warehouse' && canFulfillItems(requestingStoreId, cart)) {
            fulfillmentPlan.push({ warehouseId: requestingStoreId, items: cart });
          }

          // STRATEGY 2: Single Nearest Warehouse
          else {
            // Sort warehouses by distance to requesting store
            const sortedWarehouses = warehouses.map(wh => ({
              ...wh,
              distance: getDistance(requestingStore?.latitude, requestingStore?.longitude, wh.latitude, wh.longitude)
            })).sort((a, b) => a.distance - b.distance);

            // Find first one that can fulfill ALL items
            const bestWarehouse = sortedWarehouses.find(wh => canFulfillItems(wh.id, cart));

            if (bestWarehouse) {
              fulfillmentPlan.push({ warehouseId: bestWarehouse.id, items: cart });
              console.log(`📍 Distance Routing: Selected ${bestWarehouse.name} (${bestWarehouse.distance.toFixed(1)}km away)`);
            }

            // STRATEGY 3: Split Fulfillment
            else {
              console.log('🔀 Split Fulfillment Triggered: No single warehouse has all items.');

              // For each item, find the nearest warehouse that has it
              const warehouseMap = new Map<string, typeof cart>();

              cart.forEach(item => {
                // Find nearest warehouse for THIS item
                const nearestForProduct = sortedWarehouses.find(wh => canFulfillItems(wh.id, [item]));

                if (nearestForProduct) {
                  const existingItems = warehouseMap.get(nearestForProduct.id) || [];
                  warehouseMap.set(nearestForProduct.id, [...existingItems, item]);
                } else {
                  // Fallback: Assign to active site if no one has it (backorder)
                  const fallbackId = activeSite?.id || '';
                  const existingItems = warehouseMap.get(fallbackId) || [];
                  warehouseMap.set(fallbackId, [...existingItems, item]);
                }
              });

              // Convert map to plan
              warehouseMap.forEach((items, warehouseId) => {
                fulfillmentPlan.push({ warehouseId, items });
              });
            }
          }

          // Execute Fulfillment Plan (Create Jobs)
          for (const plan of fulfillmentPlan) {
            const { warehouseId, items } = plan;
            const warehouse = sites.find(s => s.id === warehouseId);

            // Log
            if (warehouseId !== requestingStoreId) {
              console.log(`🏭 CROSS-WAREHOUSE: Order from ${requestingStore?.name} → Fulfilling ${items.length} items from ${warehouse?.name}`);
            }

            // Create PICK Job
            const pickJobId = `PICK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const pickJob: WMSJob = {
              id: pickJobId,
              siteId: warehouseId,
              site_id: warehouseId,
              sourceSiteId: warehouseId,
              source_site_id: warehouseId,
              destSiteId: requestingStoreId,
              dest_site_id: requestingStoreId,
              type: 'PICK',
              status: 'Pending',
              priority: type === 'In-Store' ? 'Critical' : 'High',
              location: 'Zone A', // Simplified
              assignedTo: '',
              items: items.length,
              lineItems: items.map((item, index) => ({
                productId: item.id,
                name: item.name,
                sku: products.find(p => p.id === item.id)?.sku || 'UNKNOWN',
                image: item.image || '',
                expectedQty: item.quantity,
                pickedQty: 0,
                status: 'Pending'
              })),
              orderRef: sale.id, // Changed from newSale.id to sale.id
              jobNumber: `PICK-${sale.id.slice(-4)}` // Changed from newSale.id to sale.id
            };

            await wmsJobsService.create(pickJob);
            console.log(`✅ Generated PICK job ${pickJobId} for ${type} sale ${sale.id} (Priority: ${pickJob.priority})${warehouseId !== requestingStoreId ? ' [CROSS-WAREHOUSE]' : ''}`);

            // Update local state
            setJobs(prev => [pickJob, ...prev]);

            // Create PACK Job (if not In-Store, or if Cross-Warehouse)
            // Even In-Store orders need packing if they come from another warehouse
            if (type !== 'In-Store' || warehouseId !== requestingStoreId) {
              const packJobId = `PACK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const packJob: WMSJob = {
                id: packJobId,
                siteId: warehouseId,
                site_id: warehouseId,
                sourceSiteId: warehouseId,
                source_site_id: warehouseId,
                destSiteId: requestingStoreId,
                dest_site_id: requestingStoreId,
                type: 'PACK',
                status: 'Pending',
                priority: type === 'Pickup' ? 'High' : 'Normal',
                location: 'Packing Station 1',
                assignedTo: '',
                items: items.length,
                lineItems: items.map((item, index) => ({
                  productId: item.id,
                  name: item.name,
                  sku: products.find(p => p.id === item.id)?.sku || 'UNKNOWN',
                  image: item.image || '',
                  expectedQty: item.quantity,
                  pickedQty: 0,
                  status: 'Pending'
                })),
                orderRef: sale.id, // Changed from newSale.id to sale.id
                jobNumber: `PACK-${sale.id.slice(-4)}` // Changed from newSale.id to sale.id
              };
              await wmsJobsService.create(packJob);
              console.log(`✅ Generated PACK job ${packJobId} for ${type} sale ${sale.id}`);
              setJobs(prev => [packJob, ...prev]);
            }
          }
        } catch (jobError) {
          console.error('Failed to create WMS jobs:', jobError);
          addNotification('info', 'Sale completed but fulfillment jobs could not be created');
        }
      }

      addNotification('success', 'Sale processed successfully');

      // Award store points for POS team bonus using configured rules
      // Check if the store is eligible for bonuses
      const saleStore = sites.find(s => s.id === sale.siteId);
      const storeIsEligible = saleStore?.bonusEnabled !== false;

      if (settings.posBonusEnabled !== false && sale.siteId && storeIsEligible) {
        const pointRules = settings.posPointRules || DEFAULT_STORE_POINT_RULES;
        const enabledRules = pointRules.filter(r => r.enabled).sort((a, b) => (b.priority || 0) - (a.priority || 0));

        let totalPoints = 0;
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

        // Process each cart item
        cart.forEach(cartItem => {
          const product = products.find(p => p.id === cartItem.id);
          const itemCategory = product?.category || 'Unknown';
          const itemSku = product?.sku;

          // Find applicable rules for this item
          let itemPoints = 0;

          enabledRules.forEach(rule => {
            let ruleApplies = false;
            let rulePoints = 0;

            switch (rule.type) {
              case 'category':
                // Category-specific or all categories
                if (rule.categoryId === 'all' || rule.categoryId === itemCategory) {
                  ruleApplies = true;
                  rulePoints = (rule.pointsPerUnit || 0) * cartItem.quantity;
                }
                break;

              case 'product':
                // Specific product by SKU
                if (rule.productSku && itemSku === rule.productSku) {
                  ruleApplies = true;
                  rulePoints = (rule.pointsPerUnit || 0) * cartItem.quantity;
                }
                break;

              case 'quantity':
                // Quantity-based bonuses (applies to all items if criteria met)
                if (rule.categoryId === 'all' || rule.categoryId === itemCategory) {
                  if (!rule.minQuantity || totalQuantity >= rule.minQuantity) {
                    ruleApplies = true;
                    rulePoints = (rule.pointsPerUnit || 0) * cartItem.quantity;
                  }
                }
                break;
            }

            if (ruleApplies) {
              // Apply max cap if configured
              if (rule.maxPointsPerTransaction && rulePoints > rule.maxPointsPerTransaction) {
                rulePoints = rule.maxPointsPerTransaction;
              }
              itemPoints += rulePoints;
            }
          });

          totalPoints += itemPoints;
        });

        // Apply revenue-based rules (calculated on total)
        enabledRules.filter(r => r.type === 'revenue').forEach(rule => {
          if (rule.revenueThreshold && rule.pointsPerRevenue) {
            const revenuePoints = Math.floor(total / rule.revenueThreshold) * rule.pointsPerRevenue;
            totalPoints += rule.maxPointsPerTransaction
              ? Math.min(revenuePoints, rule.maxPointsPerTransaction)
              : revenuePoints;
          }
        });

        // Apply quantity multipliers (for bulk sales)
        const multiplierRule = enabledRules.find(r =>
          r.type === 'quantity' &&
          r.multiplier &&
          r.multiplier > 1 &&
          r.minQuantity &&
          totalQuantity >= r.minQuantity
        );
        if (multiplierRule && multiplierRule.multiplier) {
          totalPoints = Math.floor(totalPoints * multiplierRule.multiplier);
        }

        // Ensure at least 1 point per transaction if any items sold
        if (totalPoints < 1 && cart.length > 0) {
          totalPoints = 1;
        }

        awardStorePoints(sale.siteId, totalPoints, total, 1);
      }

      return sale.id;
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to process sale');
      throw error;
    }
  };

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

  const adjustStock = async (productId: string, qty: number, type: 'IN' | 'OUT', reason: string, user: string) => {
    try {
      await productsService.adjustStock(productId, qty, type === 'IN' ? 'IN' : 'OUT');

      // Force fetch latest data from DB to ensure UI is 100% accurate
      // This prevents issues where local state might drift or have type errors (e.g. string/number)
      try {
        const latestProduct = await productsService.getById(productId);
        if (latestProduct) {
          setProducts(prev => prev.map(p => p.id === productId ? latestProduct : p));
          setAllProducts(prev => prev.map(p => p.id === productId ? latestProduct : p));
        }
      } catch (fetchErr) {
        console.warn('Failed to refresh product after stock adjustment, falling back to local update', fetchErr);
        // Fallback optimistic update
        const stockChange = type === 'IN' ? qty : -qty;
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, stock: Math.max(0, Number(p.stock || 0) + stockChange) } : p
        ));
      }

      console.log(`📦 Stock adjusted: ${productId} ${type} ${qty} (${reason})`);
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
        assignedTo: employee.name,
        status: 'In-Progress'
      });

      setJobs(prev => prev.map(j => j.id === jobId ? updatedJob : j));

      addNotification('success', `Job assigned to ${employee.name}`);
    } catch (error) {
      console.error('Failed to assign job:', error);
      addNotification('alert', 'Failed to assign job');
    }
  };

  const updateJobItem = async (jobId: string, itemId: number, status: 'Pending' | 'Picked' | 'Short' | 'Skipped', qty: number) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      const updatedLineItems = [...job.lineItems];
      if (updatedLineItems[itemId]) {
        updatedLineItems[itemId] = {
          ...updatedLineItems[itemId],
          status,
          pickedQty: qty
        };
      }

      // Optimistic update
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, lineItems: updatedLineItems } : j));

      await wmsJobsService.update(jobId, { lineItems: updatedLineItems });
      addNotification('success', 'Item updated');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update job item');
      // Revert optimistic update if needed (omitted for brevity, but recommended in prod)
    }
  };

  const updateJobStatus = async (jobId: string, status: WMSJob['status']) => {
    // Optimistic update
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));

    try {
      await wmsJobsService.update(jobId, { status });
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
      addNotification('success', 'Job reset successfully');
    } catch (error) {
      console.error('Failed to reset job:', error);
      addNotification('alert', 'Failed to reset job: ' + (error as any).message);
    }
  };

  const completeJob = async (jobId: string, employeeName: string, skipValidation = false) => {
    let pointsResult = null;
    try {
      console.log(`🏁 completeJob called for: ${jobId} (skipValidation: ${skipValidation})`);
      const job = jobs.find(j => j.id === jobId);

      if (!job) {
        console.error(`❌ Job ${jobId} not found in local state`);
        return;
      }

      // Validate that all items are actually completed (Picked or Short)
      // Skip validation if caller already verified (e.g., handleItemScan)
      if (!skipValidation && job.lineItems && job.lineItems.length > 0) {
        const allItemsProcessed = job.lineItems.every(item =>
          item.status === 'Picked' || item.status === 'Short'
        );

        if (!allItemsProcessed) {
          console.warn(`⚠️ Job ${jobId} has unprocessed items, not completing yet`);
          const pendingItems = job.lineItems.filter(i => i.status === 'Pending');
          console.log(`   Pending items: ${pendingItems.length}`, pendingItems.map(i => i.name));
          return;
        }
      }

      console.log(`✅ All items processed. Completing job ${jobId} (${job.type})`);

      // Update in database
      await wmsJobsService.complete(jobId);
      console.log(`💾 Database updated for job ${jobId}`);

      // Update local state immediately - this ensures the UI updates
      // Use functional update to ensure we preserve the latest lineItems from previous updates
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'Completed' as const } : j));
      console.log(`🔄 Local state updated for job ${jobId}`);

      addNotification('success', `Job ${job.jobNumber || jobId} completed!`);

      // ═══════════════════════════════════════════════════════════════
      // PUTAWAY LOGIC - Update Product Location
      // ═══════════════════════════════════════════════════════════════
      if (job.type === 'PUTAWAY' && job.location) {
        console.log(`📦 Updating product location for PUTAWAY job ${jobId} to ${job.location}`);

        // Use Promise.all to update all items in parallel
        await Promise.all(job.lineItems.map(async (item) => {
          if (item.status === 'Picked' && item.productId) {
            // Update product location in DB
            try {
              // We use updateProduct which handles both local state and Supabase
              const product = products.find(p => p.id === item.productId);
              if (product) {
                await updateProduct({ ...product, location: job.location! });
                console.log(`✅ Updated location for product ${product.name} to ${job.location}`);
              }
            } catch (err) {
              console.error(`❌ Failed to update location for product ${item.productId}`, err);
            }
          }
        }));
      }

      // ═══════════════════════════════════════════════════════════════
      // GAMIFICATION - Award Points for Job Completion
      // ═══════════════════════════════════════════════════════════════
      // Check if warehouse bonus is enabled globally and for this specific site
      const jobSite = sites.find(s => s.id === job.siteId);
      const warehouseIsEligible = jobSite?.warehouseBonusEnabled !== false;

      if (employeeName && job.assignedTo && settings.bonusEnabled !== false && warehouseIsEligible) {
        const assignedEmployee = employees.find(
          e => e.name === job.assignedTo || e.id === job.assignedTo
        );

        if (assignedEmployee) {
          // Check if the employee's role is eligible for points
          const eligibleRoles = settings.warehousePointsEligibleRoles || [];
          const employeeRoleLower = assignedEmployee.role?.toLowerCase() || '';
          const isRoleEligible = eligibleRoles.length === 0 ||
            eligibleRoles.find(r => r.role.toLowerCase() === employeeRoleLower)?.enabled !== false;

          if (!isRoleEligible) {
            console.log(`🎮 Skipping points for ${assignedEmployee.name} - role "${assignedEmployee.role}" is not eligible`);
          } else {
            // Calculate points based on configurable rules
            const rules = settings.warehousePointRules || DEFAULT_WAREHOUSE_POINT_RULES;
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
              if (accuracy === 100) {
                accuracyBonus = getPointsForAction('ACCURACY_100');
              } else if (accuracy >= 95) {
                accuracyBonus = getPointsForAction('ACCURACY_95');
              }
            }

            const totalPoints = basePoints + itemBonus + accuracyBonus;

            // Award the points
            awardPoints(
              assignedEmployee.id,
              totalPoints,
              'job_complete',
              `Completed ${job.type} job ${job.jobNumber || jobId}`,
              jobId
            );


            console.log(`🎮 Awarded ${totalPoints} points to ${assignedEmployee.name} for completing job`);

            // Return points data for UI popup
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

      // Log Job Completion
      logSystemEvent(
        'Job Completed',
        `Completed ${job.type} job ${job.jobNumber || jobId}`,
        employeeName || 'System',
        'Inventory'
      );

      // --- JOB CHAINING LOGIC ---
      if (job && job.type === 'PICK' && job.orderRef) {
        // 1. Create PACK Job
        const packJob: WMSJob = {
          id: `PACK-${Date.now()}`,
          siteId: job.siteId,
          site_id: job.site_id,
          type: 'PACK',
          status: 'Pending',
          priority: job.priority,
          location: 'Packing Station 1',
          assignedTo: '',
          items: job.items,
          lineItems: job.lineItems.map(item => ({ ...item, status: 'Pending', pickedQty: 0 })), // Reset for packing
          orderRef: job.orderRef,
          sourceSiteId: job.sourceSiteId,
          source_site_id: job.source_site_id,
          destSiteId: job.destSiteId,
          dest_site_id: job.dest_site_id
        };

        await wmsJobsService.create(packJob);
        setJobs(prev => [packJob, ...prev]); // Optimistic add

        // 2. Check if this is for a SALE or a TRANSFER
        const sale = sales.find(s => s.id === job.orderRef);
        // Robust check: Check jobs list OR if orderRef looks like a Transfer ID
        const transfer = jobs.find(j => j.id === job.orderRef && j.type === 'TRANSFER');
        const isTransfer = transfer || (job.orderRef && (job.orderRef.startsWith('TRF-') || job.orderRef.includes('TRANSFER')));

        if (sale) {
          // Update Sale Status to Packing
          await salesService.update(sale.id, { fulfillmentStatus: 'Packing' });
          setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Packing' } : s));
          addNotification('success', 'Pick complete! Pack job created for Sale.');
        } else if (isTransfer) {
          // Update Transfer Status to Picked (ready for packing)
          // We can send partial update without needing the full transfer object
          const transferId = transfer?.id || job.orderRef!;
          console.log(`📦 Updating Transfer ${transferId} to Picked`);

          await wmsJobsService.update(transferId, { transferStatus: 'Picked' });

          setJobs(prev => prev.map(j => j.id === transferId ? { ...j, transferStatus: 'Picked' } : j));
          // Also update transfers list if it exists there
          setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, transferStatus: 'Picked' } : t));

          // 🔥 REDUCE STOCK at source when PICK is completed
          // This ensures inventory reflects picked items immediately
          console.log(`📦 Reducing stock for ${job.lineItems?.length || 0} picked items at source...`);
          if (job.lineItems) {
            for (const item of job.lineItems) {
              if (item.productId && item.expectedQty > 0) {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                  const pickedQty = item.pickedQty || item.expectedQty;

                  // Use adjustStock which properly updates DB and logs movement
                  await adjustStock(
                    product.id,
                    pickedQty,
                    'OUT',
                    `Transfer to ${sites.find(s => s.id === job.destSiteId)?.name || 'destination store'}`,
                    employeeName
                  );

                  console.log(`  📤 Reduced ${product.name}: -${pickedQty}`);
                }
              }
            }
          }

          addNotification('success', 'Transfer picked! Stock reduced. Pack job created.');
        } else {
          addNotification('success', 'Pick complete! Pack job created.');
        }
      } else if (job && job.type === 'PACK' && job.orderRef) {
        // PACK Complete -> Check if cross-warehouse (needs dispatch) or local (direct shipped)
        const isCrossWarehouse = job.sourceSiteId && job.destSiteId && job.sourceSiteId !== job.destSiteId;
        const sale = sales.find(s => s.id === job.orderRef);

        // Robust check for transfer
        const transfer = jobs.find(j => j.id === job.orderRef && j.type === 'TRANSFER');
        const isTransfer = transfer || (job.orderRef && (job.orderRef.startsWith('TRF-') || job.orderRef.includes('TRANSFER')));
        const transferId = transfer?.id || job.orderRef!;

        if (isCrossWarehouse) {
          // CROSS-WAREHOUSE: Create DISPATCH job for driver delivery
          const dispatchJobId = `DISPATCH-${Date.now()}`;
          const dispatchJob: WMSJob = {
            id: dispatchJobId,
            siteId: job.siteId,
            site_id: job.site_id,
            type: 'DISPATCH',
            status: 'Pending',
            priority: job.priority,
            location: 'Dispatch Bay',
            assignedTo: '',
            items: job.items,
            lineItems: job.lineItems.map(item => ({ ...item, status: 'Pending' })),
            orderRef: job.orderRef,
            sourceSiteId: job.sourceSiteId,
            source_site_id: job.source_site_id,
            destSiteId: job.destSiteId,
            dest_site_id: job.dest_site_id,
            jobNumber: `DSP-${job.orderRef?.slice(-4) || dispatchJobId.slice(-4)}`,
            transferStatus: 'Packed' // Ready for dispatch
          };

          await wmsJobsService.create(dispatchJob);
          setJobs(prev => [dispatchJob, ...prev]);

          // Update status based on whether it's a sale or transfer
          if (sale) {
            await salesService.update(sale.id, { fulfillmentStatus: 'Shipped' });
            setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Shipped' } : s));
          } else if (isTransfer) {
            // Update Transfer status to Packed
            await wmsJobsService.update(transferId, { transferStatus: 'Packed' });
            setJobs(prev => prev.map(j => j.id === transferId ? { ...j, transferStatus: 'Packed' } : j));
            setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, transferStatus: 'Packed' } : t));
          }

          const destSite = sites.find(s => s.id === job.destSiteId);
          addNotification('success', `Packed! Dispatch job created for delivery to ${destSite?.name || 'destination'}`);
          console.log(`🚚 Created DISPATCH job ${dispatchJobId} for cross-warehouse delivery to ${destSite?.name}`);
        } else {
          // LOCAL: Direct fulfillment (no dispatch needed)
          if (sale) {
            await salesService.update(sale.id, { fulfillmentStatus: 'Delivered' });
            setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Delivered' } : s));
          } else if (isTransfer) {
            // For local transfers (same site), mark as Packed directly
            await wmsJobsService.update(transferId, { transferStatus: 'Packed' });
            setJobs(prev => prev.map(j => j.id === transferId ? { ...j, transferStatus: 'Packed' } : j));
            setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, transferStatus: 'Packed' } : t));
          }
          addNotification('success', 'Packed and ready!');
        }
      } else if (job && job.type === 'PUTAWAY') {
        // PUTAWAY Complete - Stock was already updated in handleItemScan via adjustStock()
        // Just log completion and update product locations if needed
        for (const item of job.lineItems) {
          if (item.status === 'Picked') {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              // Only update location if job has a destination location
              if (job.location && job.location !== 'Receiving Dock') {
                await productsService.update(product.id, { location: job.location });
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, location: job.location } : p));
              }
            }
          }
        }
        addNotification('success', 'Putaway complete! Items stored successfully.');
      } else if (job && job.type === 'DISPATCH') {
        // DISPATCH Complete -> Mark as Delivered and update inventory
        const sale = sales.find(s => s.id === job.orderRef);
        // Robust check for transfer
        const transfer = jobs.find(j => j.id === job.orderRef && j.type === 'TRANSFER');
        const isTransfer = transfer || (job.orderRef && (job.orderRef.startsWith('TRF-') || job.orderRef.includes('TRANSFER')));
        const transferId = transfer?.id || job.orderRef!;

        const destSite = sites.find(s => s.id === job.destSiteId);
        const sourceSite = sites.find(s => s.id === job.sourceSiteId);

        // Update sale or transfer status to Delivered
        if (sale) {
          await salesService.update(sale.id, { fulfillmentStatus: 'Delivered' });
          setSales(prev => prev.map(s => s.id === sale.id ? { ...s, fulfillmentStatus: 'Delivered' } : s));
        } else if (isTransfer) {
          await wmsJobsService.update(transferId, { transferStatus: 'In-Transit' });
          setJobs(prev => prev.map(j => j.id === transferId ? { ...j, transferStatus: 'In-Transit' } : j));
          setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, transferStatus: 'In-Transit' } : t));
        }

        // Process inventory updates
        if (job.destSiteId && job.lineItems) {
          console.log(`📦 DISPATCH Complete: Processing inventory for ${destSite?.name || job.destSiteId}`);

          for (const item of job.lineItems) {
            if (item.productId && item.expectedQty > 0) {
              // Find source product to get details
              const sourceProduct = products.find(p => p.id === item.productId);

              if (sourceProduct) {
                // NOTE: Stock was already decremented at PICK completion
                // DISPATCH now only handles destination increment

                // 2. INCREMENT destination store inventory
                const destProduct = products.find(p =>
                  p.siteId === job.destSiteId && p.sku === sourceProduct.sku
                );

                if (destProduct) {
                  // Update existing product stock at destination
                  const newStock = destProduct.stock + item.expectedQty;
                  await productsService.update(destProduct.id, { stock: newStock });
                  setProducts(prev => prev.map(p =>
                    p.id === destProduct.id ? { ...p, stock: newStock } : p
                  ));
                  console.log(`  📥 Incremented ${sourceProduct.name} at ${destSite?.name}: +${item.expectedQty} (now ${newStock})`);
                } else {
                  // Create new product entry at destination store
                  const newProduct = {
                    ...sourceProduct,
                    id: `${sourceProduct.sku}-${job.destSiteId}-${Date.now()}`,
                    siteId: job.destSiteId,
                    site_id: job.destSiteId,
                    stock: item.expectedQty,
                    location: '', // New location at store
                    posReceivedAt: new Date().toISOString(),
                    posReceivedBy: employeeName
                  };

                  const createdProduct = await productsService.create(newProduct);
                  setProducts(prev => [createdProduct, ...prev]);
                  console.log(`  ✅ Created ${sourceProduct.name} at ${destSite?.name} with stock ${item.expectedQty}`);
                }

                // Log IN movement at destination
                const inMovement: StockMovement = {
                  id: `MOV-IN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  siteId: job.destSiteId,
                  site_id: job.destSiteId,
                  productId: item.productId,
                  productName: sourceProduct.name,
                  type: 'IN',
                  quantity: item.expectedQty,
                  date: new Date().toISOString(),
                  performedBy: employeeName,
                  reason: `Transfer received from ${sourceSite?.name || 'warehouse'}`
                };
                setMovements(prev => [inMovement, ...prev]);
              }
            }
          }
        }

        addNotification('success', `Dispatch complete! Delivered to ${destSite?.name || 'destination store'}`);
        console.log(`🎉 DISPATCH job ${jobId} completed - delivered to ${destSite?.name}`);
      }

      addNotification('success', 'Job completed');
      logSystemEvent('Job Completed', `Job ${jobId} completed`, employeeName, 'Inventory');

      return pointsResult;
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to complete job');
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

  // ═══════════════════════════════════════════════════════════════
  // GAMIFICATION - Worker Points System
  // ═══════════════════════════════════════════════════════════════

  const getLevelFromPoints = (totalPoints: number) => {
    const levels = POINTS_CONFIG.LEVELS;
    let currentLevel = levels[0];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalPoints >= levels[i].points) {
        currentLevel = levels[i];
        break;
      }
    }
    return currentLevel;
  };

  const getWorkerPoints = (employeeId: string): WorkerPoints | undefined => {
    return workerPoints.find(wp => wp.employeeId === employeeId);
  };

  const awardPoints = async (
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
      id: `TXN-${Date.now()}`,
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

      if (existing) {
        // Update existing
        const isNewDay = !existing.lastJobCompletedAt ||
          existing.lastJobCompletedAt.split('T')[0] !== today;

        const updatedPoints = existing.totalPoints + points;
        const level = getLevelFromPoints(updatedPoints);

        // Calculate bonus for warehouse workers (Individual based)
        const bonusTiers = settings.bonusTiers || DEFAULT_BONUS_TIERS;
        const currentPointsForPeriod = existing.monthlyPoints + points; // Use monthly points as the period
        const tier = bonusTiers.find(t =>
          currentPointsForPeriod >= t.minPoints && (t.maxPoints === null || currentPointsForPeriod <= t.maxPoints)
        );

        updatedOrNewPoint = {
          ...existing,
          totalPoints: updatedPoints,
          todayPoints: isNewDay ? points : existing.todayPoints + points,
          weeklyPoints: existing.weeklyPoints + points,
          monthlyPoints: currentPointsForPeriod,
          totalJobsCompleted: type === 'job_complete' ? existing.totalJobsCompleted + 1 : existing.totalJobsCompleted,
          lastJobCompletedAt: type === 'job_complete' ? now : existing.lastJobCompletedAt,
          lastUpdated: now,
          level: level.level,
          levelTitle: level.title,
          currentBonusTier: tier?.tierName,
          estimatedBonus: tier ? tier.bonusAmount + (currentPointsForPeriod * (tier.bonusPerPoint || 0)) : 0,
          bonusPeriodPoints: currentPointsForPeriod,
        };

        // Persist Update
        workerPointsService.update(existing.id, updatedOrNewPoint).catch(err =>
          console.error('Failed to update worker points:', err)
        );

        return prev.map(wp => wp.employeeId === employeeId ? updatedOrNewPoint : wp);
      } else {
        // Create new
        const level = getLevelFromPoints(points);

        // Calculate bonus for warehouse workers
        const bonusTiers = settings.bonusTiers || DEFAULT_BONUS_TIERS;
        const currentPointsForPeriod = points;
        const tier = bonusTiers.find(t =>
          currentPointsForPeriod >= t.minPoints && (t.maxPoints === null || currentPointsForPeriod <= t.maxPoints)
        );

        const newWorkerPoints: WorkerPoints = {
          id: `WP-${Date.now()}`,
          siteId: employee.siteId || employee.site_id || '',
          employeeId,
          employeeName: employee.name,
          employeeAvatar: employee.avatar,
          totalPoints: points,
          weeklyPoints: points,
          monthlyPoints: points,
          todayPoints: points,
          totalJobsCompleted: type === 'job_complete' ? 1 : 0,
          totalItemsPicked: 0,
          averageAccuracy: 100,
          averageTimePerJob: 0,
          currentStreak: 1,
          longestStreak: 1,
          lastJobCompletedAt: type === 'job_complete' ? now : undefined,
          lastUpdated: now,
          achievements: [],
          rank: prev.length + 1,
          level: level.level,
          levelTitle: level.title,
          currentBonusTier: tier?.tierName,
          estimatedBonus: tier ? tier.bonusAmount + (currentPointsForPeriod * (tier.bonusPerPoint || 0)) : 0,
          bonusPeriodPoints: currentPointsForPeriod,
        };

        updatedOrNewPoint = newWorkerPoints;

        // Persist Creation
        workerPointsService.create(newWorkerPoints).catch(err =>
          console.error('Failed to create worker points:', err)
        );

        return [...prev, newWorkerPoints];
      }
    });

    console.log(`🎮 Awarded ${points} points to ${employee.name}: ${description}`);
  };

  const getLeaderboard = (siteId?: string, period: 'today' | 'week' | 'month' | 'all' = 'week'): WorkerPoints[] => {
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
  };

  // ==================== STORE POINTS (POS TEAM BONUS) ====================

  const getStorePoints = (siteId: string): StorePoints | undefined => {
    return storePoints.find(sp => sp.siteId === siteId);
  };

  const awardStorePoints = (
    siteId: string,
    points: number,
    revenue: number,
    transactionCount: number = 1
  ) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];

    setStorePoints(prev => {
      const existing = prev.find(sp => sp.siteId === siteId);

      if (existing) {
        // Check if it's a new day - reset today's points
        const lastUpdateDay = existing.lastUpdated.split('T')[0];
        const isNewDay = lastUpdateDay !== today;

        // Check if it's a new week - reset weekly points
        const lastUpdateDate = new Date(existing.lastUpdated);
        const currentDate = new Date();
        const weekDiff = Math.floor((currentDate.getTime() - lastUpdateDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const isNewWeek = weekDiff >= 1 || (currentDate.getDay() < lastUpdateDate.getDay() && !isNewDay);

        // Check if it's a new month - reset monthly points
        const isNewMonth = lastUpdateDate.getMonth() !== currentDate.getMonth() ||
          lastUpdateDate.getFullYear() !== currentDate.getFullYear();

        const updatedTodayPoints = isNewDay ? points : existing.todayPoints + points;
        const updatedWeeklyPoints = isNewWeek ? points : existing.weeklyPoints + points;
        const updatedMonthlyPoints = isNewMonth ? points : existing.monthlyPoints + points;

        // Calculate current tier and bonus
        const tiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
        const tier = tiers.find(t =>
          updatedMonthlyPoints >= t.minPoints && (t.maxPoints === null || updatedMonthlyPoints <= t.maxPoints)
        );
        const estimatedBonus = tier
          ? tier.bonusAmount + (updatedMonthlyPoints * (tier.bonusPerPoint || 0))
          : 0;

        return prev.map(sp => sp.siteId === siteId ? {
          ...sp,
          totalPoints: sp.totalPoints + points,
          todayPoints: updatedTodayPoints,
          weeklyPoints: updatedWeeklyPoints,
          monthlyPoints: updatedMonthlyPoints,
          totalTransactions: sp.totalTransactions + transactionCount,
          totalRevenue: sp.totalRevenue + revenue,
          averageTicketSize: (sp.totalRevenue + revenue) / (sp.totalTransactions + transactionCount),
          lastTransactionAt: now,
          lastUpdated: now,
          currentTier: tier?.tierName,
          estimatedBonus,
        } : sp);
      } else {
        // Create new store points record
        const tiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
        const tier = tiers.find(t =>
          points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints)
        );

        const newStorePoints: StorePoints = {
          id: `SP-${Date.now()}`,
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

        return [...prev, newStorePoints];
      }
    });
  };

  const calculateWorkerBonusShare = (siteId: string, employeeRole: string): WorkerBonusShare | undefined => {
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
  };

  const getStoreLeaderboard = (): StorePoints[] => {
    return [...storePoints].sort((a, b) => b.monthlyPoints - a.monthlyPoints);
  };

  const addCustomer = async (customer: Customer) => {
    try {
      const newCustomer = await customersService.create(customer);
      setCustomers(prev => [newCustomer, ...prev]);
      addNotification('success', `Customer ${customer.name} added`);
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to add customer');
    }
  };

  const updateCustomer = async (customer: Customer) => {
    try {
      await customersService.update(customer.id, customer);
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      addNotification('success', 'Customer updated');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to update customer');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await customersService.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      addNotification('success', 'Customer deleted');
    } catch (error) {
      console.error(error);
      addNotification('alert', 'Failed to delete customer');
    }
  };

  const holdOrder = (order: HeldOrder) => {
    setHeldOrders(prev => [order, ...prev]);
    addNotification('info', 'Order placed on hold');
  };

  const releaseHold = (orderId: string) => {
    setHeldOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const requestTransfer = async (transfer: TransferRecord) => {
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
  };

  const shipTransfer = async (id: string, user: string) => {
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
  };

  const receiveTransfer = async (id: string, user: string, receivedQuantities?: Record<string, number>) => {
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
  };



  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };



  const exportSystemData = () => {
    const data = {
      settings,
      products,
      sales,
      customers,
      employees,
      suppliers
    };
    return JSON.stringify(data, null, 2);
  };

  const resetData = () => {
    // In Supabase context, this might be dangerous or restricted
    // For now, we'll just reload data
    if (activeSiteId) {
      loadSiteData(activeSiteId);
      addNotification('info', 'Data reloaded from server');
    } else {
      loadSites();
    }
  };

  const refreshData = async () => {
    if (activeSiteId) {
      console.log('🔄 Manual Refresh Triggered');
      await loadSiteData(activeSiteId, true);
    }
  };

  const addPromotion = (promo: Promotion) => {
    setPromotions(prev => [...prev, promo]);
    addNotification('success', `Promotion ${promo.code} Created`);
  };

  const deletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    addNotification('info', 'Promotion Deleted');
  };

  // --- Discount Code Functions ---
  const addDiscountCode = (code: DiscountCode) => {
    setDiscountCodes(prev => [...prev, code]);
    addNotification('success', `Discount code "${code.code}" created`);
  };

  const updateDiscountCode = (code: DiscountCode) => {
    setDiscountCodes(prev => prev.map(c => c.id === code.id ? code : c));
    addNotification('success', `Discount code "${code.code}" updated`);
  };

  const deleteDiscountCode = (id: string) => {
    setDiscountCodes(prev => prev.filter(c => c.id !== id));
    addNotification('info', 'Discount code deleted');
  };

  const validateDiscountCode = (code: string, siteId?: string, subtotal?: number): { valid: boolean; discountCode?: DiscountCode; error?: string } => {
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
  };

  const useDiscountCode = (codeId: string) => {
    setDiscountCodes(prev => prev.map(c =>
      c.id === codeId
        ? { ...c, usageCount: c.usageCount + 1 }
        : c
    ));
  };

  // Filter data by active site
  // Data is now pre-filtered by loadSiteData, so we just pass the state directly
  // keeping these variables to match the value object structure if needed, or we can update the value object
  const filteredProducts = products;
  const filteredSales = sales;
  const filteredOrders = orders;
  const filteredEmployees = employees;
  const filteredExpenses = expenses;
  const filteredMovements = movements;
  const filteredJobs = jobs;

  const value: DataContextType = {
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
    updateSettings,
    setActiveSite,
    addSite,
    updateSite,
    deleteSite,
    addProduct,
    updateProduct,
    deleteProduct,
    relocateProduct,
    cleanupAdminProducts,
    createPO,
    updatePO,
    receivePO,
    deletePO,
    processSale,
    processReturn,
    closeShift,
    startShift,
    addPromotion,
    deletePromotion,
    discountCodes,
    addDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    validateDiscountCode,
    useDiscountCode,
    addSupplier,
    adjustStock,
    addExpense,
    deleteExpense,
    processPayroll,
    assignJob,
    updateJobItem,
    updateJobStatus,
    completeJob,
    resetJob,
    fixBrokenJobs,
    createPutawayJob,
    addEmployee,
    updateEmployee,
    deleteEmployee,
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
    addNotification,
    markNotificationsRead,
    logSystemEvent,
    exportSystemData,
    resetData,
    refreshData
  };

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
      updateJobItem: async () => { },
      updateJobStatus: async () => { },
      completeJob: async () => { },
      resetJob: async () => { },
      fixBrokenJobs: async () => { },
      createPutawayJob: async () => undefined,
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
      resetData: () => { }
    } as unknown as DataContextType;
  }
  return context;
};
