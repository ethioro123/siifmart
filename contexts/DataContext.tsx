import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  Product, PurchaseOrder, Supplier, SaleRecord, ExpenseRecord,
  StockMovement, Employee, Customer, ShiftRecord, HeldOrder, SystemConfig, Site,
  Notification, SystemLog, EmployeeTask, StorePoints, Promotion, DiscountCode
} from '../types';
import { useStore } from './CentralStore';
import { posDB } from '../services/db/pos.db';
import { usePosSync } from '../hooks/usePosSync';
import { useDataQueries } from '../hooks/useDataQueries';
import { DEFAULT_CONFIG } from './DataContextDefaults';
import { DATA_CONTEXT_FALLBACK } from './DataContextFallback';
import { DataContextType } from './DataContextTypes';
import { useAuditLogger } from './hooks/useAuditLogger';

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
import { useCountryScoping } from './hooks/useCountryScoping';
import { useZeroTrustSync } from '../hooks/useZeroTrustSync';
import { logger } from '../utils/logger';

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
  // Get user from CentralStore (safely)
  const storeContext = useStore();
  const user = storeContext?.user;

  // --- STATE ---
  const [settings, setSettings] = useState<SystemConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('siifmart_system_config');
      } catch {
        // Safe ignore
      }
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
  } = useNotificationState({ user: user || undefined, activeSiteId, countryCode: settings.country });

  const {
    discountCodes, setDiscountCodes, addDiscountCode, updateDiscountCode,
    deleteDiscountCode, validateDiscountCode, useDiscountCode
  } = useDiscountCodesState({ addNotification });

  const {
    promotions, setPromotions, heldOrders, setHeldOrders,
    loadHeldOrders, holdOrder, releaseHold, addPromotion,
    updatePromotion, deletePromotion
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

  const { syncStatus, pendingCount, latencyMs: posLatencyMs, triggerSync: posTriggerSync, checkQueue: posCheckQueue } = usePosSync((count) => {
    addNotification('success', `Successfully synced ${count} offline sale${count !== 1 ? 's' : ''} to database`);
  });
  const queries = useDataQueries({
    siteId: activeSiteId,
    enabled: navigator.onLine && Boolean(user),
    onProgress: onQueryProgress
  });

  // Sync React Query products to local state only when products query data changes
  useEffect(() => {
    if (queries.products.data) {
      const finalProducts = queries.products.data.map(p =>
        p.category?.toLowerCase() === 'alcohol' ? { ...p, category: 'Beverages' } : p
      );
      setProducts(finalProducts);
      if (activeSiteId) posDB.cacheProducts(activeSiteId, finalProducts);
    }
  }, [queries.products.data, activeSiteId]);

  // Sync remaining React Query data to local state
  useEffect(() => {
    if (queries.employees.data) setEmployees(queries.employees.data);
    if (queries.orders.data) setOrders(queries.orders.data);
    if (queries.sales.data) {
      const sanitizedSales = queries.sales.data.map(s => ({
        ...s,
        items: s.items?.map((i: any) => i.category?.toLowerCase() === 'alcohol' ? { ...i, category: 'Beverages' } : i) || []
      }));
      setSales(sanitizedSales);
    }
    if (queries.customers.data) {
      setCustomers(queries.customers.data);
      posDB.cacheCustomers(queries.customers.data);
    }
    if (queries.suppliers.data) setSuppliers(queries.suppliers.data);
    if (queries.movements.data) setMovements(queries.movements.data);
    if (queries.storePoints.data) setStorePoints(queries.storePoints.data);
    if (queries.tasks.data) setTasks(queries.tasks.data);
    if (queries.expenses.data) setExpenses(queries.expenses.data);
    if (queries.systemLogs.data) setSystemLogs(queries.systemLogs.data);
    if (queries.shifts.data) setShifts(queries.shifts.data);

    if (!queries.isLoadingCritical && isDataInitialLoading) {
      setIsDataInitialLoading(false);
    }
  }, [
    queries.employees.data, queries.orders.data, queries.sales.data,
    queries.storePoints.data, queries.tasks.data, queries.expenses.data,
    queries.systemLogs.data, queries.suppliers.data, queries.customers.data,
    queries.movements.data, queries.shifts.data, queries.isLoadingCritical, activeSiteId, sites
  ]);


  // Offline cold-start hydration from posDB
  useEffect(() => {
    if (!navigator.onLine && activeSiteId) {
      posDB.getCachedProducts(activeSiteId).then(cached => {
        if (cached && cached.length > 0) setProducts(cached);
      });
      posDB.getCachedCustomers().then(cached => {
        if (cached && cached.length > 0) setCustomers(cached);
      });
    }
  }, [activeSiteId]);



  // Guard to prevent concurrent loadData calls
  const loadingRef = React.useRef(false);
  const loadedSiteRef = React.useRef<string>('');

  // --- UNIVERSAL JOB ENRICHMENT ---
  // 1. Hydrate PO numbers for Inbound Jobs
  // 2. Hydrate Customer/Site details for Outbound Jobs (Pack/Dispatch)


  const { logSystemEvent } = useAuditLogger({ user, activeSiteId, setSystemLogs });

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
    setOrders,
    setShifts
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
    setSales, setAllSales, setProducts, setAllProducts, setCustomers,
    addNotification, logSystemEvent, triggerSync, posCheckQueue,
    awardStorePoints: gamificationActions.awardStorePoints
  });

  const employeeActions = useEmployeeActions({
    activeSite, activeSiteId, employees, shifts, setEmployees, setShifts,
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
    } else {
      loadSites();
    }
  }, [activeSiteId, queries, loadSites, addNotification]);

  const {
    scopedSites,
    scopedAllOrders,
    scopedAllSales,
    scopedEmployees,
    scopedMovements,
    scopedShifts,
    scopedExpenses, scopedAllProducts, scopedProducts, scopedCustomers, scopedSuppliers,
    scopedDiscountCodes, scopedSettings, effectiveCountry, isCeo,
    regions, activeRegionCode, setActiveRegionCode, canSwitchRegion, isRegionalUser
  } = useCountryScoping({
    country: settings?.country || 'ET',
    settings,
    user,
    sites,
    activeSiteId,
    setActiveSiteId,
    allOrders,
    allSales,
    employees,
    movements,
    shifts,
    expenses,
    allProducts,
    products,
    suppliers,
    customers,
    discountCodes
  });

  useZeroTrustSync(scopedSettings || settings, effectiveCountry);

  const value = useMemo<DataContextType>(() => ({
    settings: scopedSettings || settings,
    products: scopedProducts,
    orders,
    suppliers: scopedSuppliers,
    sales,
    expenses: scopedExpenses,
    movements: scopedMovements,

    employees: scopedEmployees,
    customers: scopedCustomers,
    shifts: scopedShifts,
    heldOrders,
    sites: scopedSites,
    activeSite,
    effectiveCountry,
    isCeo,
    regions,
    activeRegionCode,
    setActiveRegionCode,
    canSwitchRegion,
    isRegionalUser,
    notifications,
    systemLogs,
    promotions,

    tasks,
    setTasks,
    allProducts: scopedAllProducts,
    allSales: scopedAllSales,
    allOrders: scopedAllOrders,
    setProducts,
    setAllProducts,
    setOrders,
    setAllOrders,
    setSales,
    setAllSales,
    discountCodes: scopedDiscountCodes,
    loadingProgress,
    isDataInitialLoading,
    loadError,

    // Site Actions (from hook)
    updateSettings: async (settings, user) => { await siteActions.updateSettings(settings, user); },
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
    reconcileShift: employeeActions.reconcileShift,
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
    posPendingSyncCount: pendingCount,
    posLatencyMs
  }), [
    settings, scopedSettings, scopedProducts, orders, scopedSuppliers, sales, scopedExpenses, scopedMovements,
    scopedEmployees, scopedCustomers, scopedShifts, heldOrders, scopedSites, activeSite,
    effectiveCountry, isCeo, regions, activeRegionCode, setActiveRegionCode, canSwitchRegion, isRegionalUser, notifications, systemLogs, promotions, tasks, storePoints, scopedAllProducts,
    scopedAllSales, scopedAllOrders, scopedDiscountCodes, isDataInitialLoading, loadError, syncStatus, pendingCount, posLatencyMs,
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
