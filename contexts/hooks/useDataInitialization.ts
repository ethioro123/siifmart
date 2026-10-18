import React, { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sitesService, systemConfigService, productsService, salesService, purchaseOrdersService } from '../../services/supabase.service';
import { setGlobalTimezone } from '../../utils/formatting';
import { DEFAULT_CONFIG } from '../DataContextDefaults';
import { setCurrencySymbol } from '../../constants/categories';
import type { User, Site, SystemConfig, Product, SaleRecord, PurchaseOrder, Employee, Supplier } from '../../types';
import type { Country } from '../../utils/localization';
import { getCountryProfile } from '../../utils/localization';
import { findCountryAdminSite, isAdminSite, getCountryAdminDefaults } from '../../utils/countryAdmin';
import { logger } from '../../utils/logger';

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
  const queryClient = useQueryClient();

  // --- SYNC USER'S SITE ---
  const userSiteSyncRef = React.useRef<boolean>(false);

  useEffect(() => {
    const canSwitchSites = ['super_admin', 'CEO', 'Super Admin', 'Admin', 'Auditor'].includes(user?.role || '');

    if (user && sites.length > 0 && !activeSiteId) {
      if (canSwitchSites) {
        // CEO / super_admin: default to the Administration / Central Operations site for the active country
        const activeCountry = (settings?.country || 'ET') as Country;
        const countrySites = sites.filter(s => (s.country || 'ET') === activeCountry);
        const adminSite = findCountryAdminSite(countrySites, activeCountry) || countrySites[0];
        if (adminSite) {
          setActiveSiteId(adminSite.id);
        }
        userSiteSyncRef.current = true;
        return;
      }
    }

    if (canSwitchSites && userSiteSyncRef.current && activeSiteId) {
      return;
    }

    if (user?.siteId && sites.length > 0) {
      const userSite = sites.find(s => s.id === user.siteId || (s as any).code === user.siteId);

      if (!userSite) {
        logger.error('useDataInitialization', `❌ User's siteId "${user.siteId}" not found in sites list!`, new Error(String(`❌ User's siteId "${user.siteId}" not found in sites list!`)));
        return;
      }

      if ((!canSwitchSites) && (!activeSiteId || (activeSiteId !== userSite.id && activeSiteId !== userSite.code))) {
        setActiveSiteId(userSite.id);
      }
      userSiteSyncRef.current = true;
    }
  }, [user, sites, activeSiteId, setActiveSiteId]);

  const loadSites = useCallback(async () => {
    try {
      const loadedSites = await queryClient.fetchQuery({
        queryKey: ['sites'],
        queryFn: () => sitesService.getAll(),
        staleTime: 5 * 60 * 1000
      });

      // Ensure active country has its Administration HQ provisioned
      const activeCountry = (settings?.country || 'ET') as Country;
      const hasActiveAdmin = loadedSites.some(s => (s.country || 'ET').toUpperCase() === activeCountry.toUpperCase() && isAdminSite(s));
      if (!hasActiveAdmin) {
        try {
          const autoAdmin = await sitesService.ensureCountryAdministrationSite(activeCountry);
          if (autoAdmin) {
            loadedSites.unshift(autoAdmin);
          } else {
            const defaults = getCountryAdminDefaults(activeCountry);
            const fallbackAdmin: Site = {
              id: `${activeCountry}-ADMIN`,
              code: defaults.code,
              name: defaults.name,
              type: defaults.type as any,
              address: defaults.address,
              status: defaults.status as any,
              manager: defaults.manager,
              country: defaults.country,
              currency: defaults.currency,
              region: defaults.region,
              isFulfillmentNode: false
            };
            loadedSites.unshift(fallbackAdmin);
          }
        } catch {
          const defaults = getCountryAdminDefaults(activeCountry);
          const fallbackAdmin: Site = {
            id: `${activeCountry}-ADMIN`,
            code: defaults.code,
            name: defaults.name,
            type: defaults.type as any,
            address: defaults.address,
            status: defaults.status as any,
            manager: defaults.manager,
            country: defaults.country,
            currency: defaults.currency,
            region: defaults.region,
            isFulfillmentNode: false
          };
          loadedSites.unshift(fallbackAdmin);
        }
      }

      setSites(loadedSites);

      try {
        localStorage.setItem('siifmart_sites_cache', JSON.stringify(loadedSites));
      } catch (e) {
        logger.warn('useDataInitialization', 'Failed to cache sites');
      }

      if (loadedSites.length === 0) {
        addNotification('info', 'No operational sites were found in the database.');
      }
    } catch (error: any) {
      logger.error('useDataInitialization', '❌ Failed to load sites:', error);
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
  }, [setSites, addNotification, setLoadError, queryClient]);

  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = await systemConfigService.getSettings();
      setSettings(loadedSettings);
      if (loadedSettings.country === 'KE' || loadedSettings.currency === 'KES' || loadedSettings.currency === 'KSh') {
        setCurrencySymbol('KSh');
      } else if (loadedSettings.currency) {
        setCurrencySymbol(loadedSettings.currency);
      } else {
        const prof = getCountryProfile(loadedSettings.country);
        setCurrencySymbol(prof.currencySymbol);
      }
    } catch (error: any) {
      logger.error('useDataInitialization', '❌ Failed to load system settings:', error?.message || error);
      setSettings(DEFAULT_CONFIG);
      const prof = getCountryProfile(DEFAULT_CONFIG.country);
      setCurrencySymbol(prof.currencySymbol);
    }
  }, [setSettings]);

  const hasLoadedGlobalRef = React.useRef(false);

  const loadGlobalData = useCallback(async () => {
    try {
      // Egress optimization: Only global administrative roles need multi-site global batches on startup.
      // Branch workers only require local activeSite data (fetched via useDataQueries).
      const normalizedRole = (user?.role || '').toLowerCase().trim().replace(/[\s-]/g, '_');
      const canSwitchSites = ['super_admin', 'ceo', 'admin', 'auditor', 'procurement_manager', 'buyer', 'supply_chain_manager', 'merchandising_manager'].includes(normalizedRole);

      // RULE 10: Lists/history default to 25 records on boot
      const [allProds, allSls, allOrds] = await Promise.all([
        canSwitchSites ? productsService.getAll(undefined, 25, 0, undefined, undefined, false).then(res => res.data) : Promise.resolve([]),
        canSwitchSites ? salesService.getAll(undefined, 25).then(res => res.data) : Promise.resolve([]),
        canSwitchSites ? purchaseOrdersService.getAll(undefined, 25).then(res => res.data) : Promise.resolve([])
      ]);

      setAllProducts(allProds);
      setAllSales(allSls);
      setAllOrders(allOrds);
      // These are loaded once by the active-site React Query below. Preserve any
      // cached/session values here instead of issuing duplicate, unscoped reads.
      setEmployees(current => current);
      setSuppliers(current => current);

      if (!activeSiteId) {
        setIsDataInitialLoading(false);
      }
    } catch (error) {
      logger.error('useDataInitialization', 'Failed to load global data:', error);
      if (!activeSiteId) {
        setLoadError('Failed to load global data. Check connection.');
        setIsDataInitialLoading(false);
      }
    }
  }, [user?.role, activeSiteId, setAllProducts, setAllSales, setAllOrders, setEmployees, setSuppliers, setIsDataInitialLoading, setLoadError]);

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
    if (hasLoadedGlobalRef.current) return;
    hasLoadedGlobalRef.current = true;

    loadGlobalData();

    const quickTimeout = setTimeout(() => {
      if (isDataInitialLoading) {
        logger.warn('useDataInitialization', '5s fail-safe triggered - Unblocking UI for authenticated user');
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

  const refreshData = useCallback(async (scopes?: import('../DataContextTypes').RefreshDataScope[]) => {
    if (activeSiteId) {
      await queries.refetchAll(scopes);
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
