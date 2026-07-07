import React, { useEffect, useCallback } from 'react';
import { sitesService, systemConfigService, productsService, salesService, purchaseOrdersService, employeesService, suppliersService } from '../../services/supabase.service';
import { setGlobalTimezone } from '../../utils/formatting';
import { DEFAULT_CONFIG } from '../DataContextDefaults';
import type { User, Site, SystemConfig, Product, SaleRecord, PurchaseOrder, Employee, Supplier } from '../../types';

interface UseDataInitializationProps {
  user: User | undefined;
  activeSiteId: string;
  setActiveSiteId: (id: string) => void;
  sites: Site[];
  setSites: React.Dispatch<React.SetStateAction<Site[]>>;
  settings: SystemConfig;
  setSettings: React.Dispatch<React.SetStateAction<SystemConfig>>;
  products: Product[];
  setAllProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setAllSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  setAllOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  isDataInitialLoading: boolean;
  setIsDataInitialLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadError: React.Dispatch<React.SetStateAction<string | null>>;
  addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
  queries: any;
}

export function useDataInitialization({
  user,
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
}: UseDataInitializationProps) {

  // --- SYNC USER'S SITE ---
  const userSiteSyncRef = React.useRef<boolean>(false);

  useEffect(() => {
    const canSwitchSites = ['super_admin', 'CEO', 'Super Admin', 'Admin', 'Auditor'].includes(user?.role || '');

    if (canSwitchSites && userSiteSyncRef.current && activeSiteId) {
      return;
    }

    if (user?.siteId && sites.length > 0) {
      const userSite = sites.find(s => s.id === user.siteId);

      if (!userSite) {
        console.error(`❌ User's siteId "${user.siteId}" not found in sites list!`);
        return;
      }

      if ((!canSwitchSites) && (!activeSiteId || activeSiteId !== user.siteId)) {
        setActiveSiteId(user.siteId);
      }
      userSiteSyncRef.current = true;
    }
  }, [user, sites, activeSiteId, setActiveSiteId]);

  const loadSites = useCallback(async () => {
    try {
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
      let cached = null;
      try {
        cached = localStorage.getItem('siifmart_sites_cache');
      } catch (e) {}
      if (cached) {
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
  }, [setSites, addNotification, setLoadError]);

  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = await systemConfigService.getSettings();
      setSettings(loadedSettings);
    } catch (error: any) {
      console.error('❌ Failed to load system settings:', error?.message || error);
      try {
        const saved = localStorage.getItem('siifmart_system_config');
        if (saved) {
          setSettings({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
        }
      } catch (e) {}
    }
  }, [setSettings]);

  const loadGlobalData = useCallback(async () => {
    try {
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
  }, [activeSiteId, setAllProducts, setAllSales, setAllOrders, setEmployees, setSuppliers, setIsDataInitialLoading, setLoadError]);

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (user) {
      loadSites();
      loadSettings();
    } else {
      setIsDataInitialLoading(false);
    }
  }, [user, loadSites, loadSettings, setIsDataInitialLoading]);

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
        setLoadError('Synchronization is taking longer than expected. Please check your connection.');
      }
    }, 15000);

    return () => {
      clearTimeout(quickTimeout);
      clearTimeout(timeout);
    };
  }, [user, loadGlobalData, products.length, sites.length, isDataInitialLoading, setLoadError, setIsDataInitialLoading]);

  // --- SYNC TIMEZONE ---
  useEffect(() => {
    if (settings.timezone) {
      setGlobalTimezone(settings.timezone);
    }
  }, [settings.timezone]);

  const refreshData = useCallback(async () => {
    if (activeSiteId) {
      queries.refetchAll();
    } else {
      await loadGlobalData();
    }
  }, [activeSiteId, queries, loadGlobalData]);

  return {
    loadSites,
    loadSettings,
    loadGlobalData,
    refreshData
  };
}
