import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  Product, PurchaseOrder, Supplier, SaleRecord, ExpenseRecord,
  StockMovement, Employee, Customer, ShiftRecord, HeldOrder, SystemConfig, Site,
  Notification, SystemLog, EmployeeTask, StorePoints, Promotion, DiscountCode
} from '../types';
import { systemLogsService } from '../services/supabase.service';
import { useStore } from './CentralStore';
import { posDB } from '../services/db/pos.db';
import { usePosSync } from '../hooks/usePosSync';
import { useDataQueries } from '../hooks/useDataQueries';
import { DEFAULT_CONFIG } from './DataContextDefaults';
import { DATA_CONTEXT_FALLBACK } from './DataContextFallback';
import { DataContextType } from './DataContextTypes';

// --- Custom Hooks ---
import { useSiteActions } from './hooks/useSiteActions';
import { useProductActions } from './hooks/useProductActions';
import { usePOActions } from './hooks/usePOActions';
import { useSaleActions } from './hooks/useSaleActions';
import { useEmployeeActions } from './hooks/useEmployeeActions';
import { useCustomerActions } from './hooks/useCustomerActions';
import { useFinanceActions } from './hooks/useFinanceActions';
import { useGamificationActions } from './hooks/useGamificationActions';
import { useNotificationState } from './hooks/useNotificationState';
import { useDiscountCodesState } from './hooks/useDiscountCodesState';
import { useRealtimeUpdates } from './hooks/useRealtimeUpdates';
import { useDataInitialization } from './hooks/useDataInitialization';
import { usePromotionsAndPOSState } from './hooks/usePromotionsAndPOSState';
import { useLoadingProgress } from './hooks/useLoadingProgress';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

import { TRANSLATIONS, Language } from '../utils/translations';
import { logger } from '../utils/logger';

const getTranslation = (path: string): string => {
  let lang: Language = 'en';
  try {
    lang = (localStorage.getItem('siifmart_language') as Language) || 'en';
  } catch (e) {
    logger.warn('DataContext', 'Failed to read language settings from localStorage in getTranslation');
  }
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
      logger.error('DataContext', 'Failed to load settings from localStorage', e);
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
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);


  const {
    notifications,
    setNotifications,
    addNotification,
    clearNotification,
    clearAllNotifications,
    markNotificationsRead
  } = useNotificationState({ user: user || undefined });

  const {
    discountCodes,
    setDiscountCodes,
    addDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    validateDiscountCode,
    useDiscountCode
  } = useDiscountCodesState({ addNotification });

  const {
    promotions,
    setPromotions,
    heldOrders,
    setHeldOrders,
    loadHeldOrders,
    holdOrder,
    releaseHold,
    addPromotion,
    updatePromotion,
    deletePromotion
  } = usePromotionsAndPOSState({ addNotification });

  useEffect(() => {
    loadHeldOrders();
  }, [loadHeldOrders]);

  // Global State for HQ
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allSales, setAllSales] = useState<SaleRecord[]>([]);
  const [allOrders, setAllOrders] = useState<PurchaseOrder[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [storePoints, setStorePoints] = useState<StorePoints[]>([]);

  const {
    isDataInitialLoading,
    setIsDataInitialLoading,
    loadError,
    setLoadError,
    loadingProgress,
    setLoadingProgress,
    onQueryProgress
  } = useLoadingProgress();

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
    onProgress: onQueryProgress
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
      setSystemLogs(prev => [newLog as SystemLog, ...prev]);
    } catch (error) {
      logger.error('DataContext', 'Failed to log system event:', error);
    }
  }, []);

  const { refreshData, loadSites } = useDataInitialization({
    user: user || undefined,
    activeSiteId,
    setActiveSiteId,
    sites,
    setSites,
    settings,
    setSettings,
    products,
    setAllProducts,
    setAllSales,
    setAllOrders,
    setEmployees,
    setSuppliers,
    isDataInitialLoading,
    setIsDataInitialLoading,
    setLoadError,
    addNotification,
    queries
  });


  // --- REAL-TIME UPDATES ---
  useRealtimeUpdates({
    activeSiteId,
    setProducts,
    setAllProducts,
    setSales,
    setCustomers,
    setOrders
  });

  // ══════════════════════════════════════════════════════════════
  // CUSTOM HOOKS - Domain-specific actions
  // ══════════════════════════════════════════════════════════════

  const gamificationActions = useGamificationActions({ sites, storePoints, setStorePoints, settings });

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

  const value = useMemo<DataContextType>(() => ({
    settings,
    products,
    orders,
    suppliers,
    sales,
    expenses,
    movements,

    employees,
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
    setAllProducts,
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
    logger.warn('DataContext', 'useData called outside DataProvider - returning safe defaults');
    return DATA_CONTEXT_FALLBACK;
  }
  return context;
};
