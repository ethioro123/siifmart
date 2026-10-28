import React, { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sitesService, systemConfigService, productsService, salesService, purchaseOrdersService } from '../../services/supabase.service';
import { posDB } from '../../services/db/pos.db';
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
  const missingSiteWarningRef = React.useRef<string | null>(null);

  useEffect(() => {
    const role = user?.role || '';
    const canSwitchSites = ['group_ceo', 'auditor'].includes(role);
    const isRegionalSiteSwitcher =
      role === 'regional_operations_manager' ||
      role === 'area_operations_manager' ||
      role.startsWith('regional_') ||
      role === 'vendor_relations_manager' ||
      role === 'cs_manager';

    if (user && sites.length > 0 && !activeSiteId) {
      if (canSwitchSites) {
        // The group_ceo role defaults to the Administration / Central Operations site for the active country
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
        // The site directory is access scoped; a stale assignment can be absent
        // while country scoping has already selected an accessible site.
        if (!sites.some(s => s.id === activeSiteId) && missingSiteWarningRef.current !== user.siteId) {
          logger.warn('useDataInitialization', 'Assigned site is unavailable in the accessible site directory', { siteId: user.siteId });
          missingSiteWarningRef.current = user.siteId;
        }
        return;
      }

      missingSiteWarningRef.current = null;
      const userRegionCode = (user as any)?.region_code || (user as any)?.regionCode || (userSite as any)?.region_code || userSite?.regionCode;
      const activeSiteObj = activeSiteId ? sites.find(s => s.id === activeSiteId || (s as any).code === activeSiteId) : null;
      const activeSiteRegionCode = (activeSiteObj as any)?.region_code || activeSiteObj?.regionCode;
      const isValidRegionalSwitch = Boolean(
        userSiteSyncRef.current &&
        isRegionalSiteSwitcher &&
        userRegionCode &&
        activeSiteObj &&
        activeSiteRegionCode === userRegionCode
      );

      if ((!canSwitchSites && !isValidRegionalSwitch) && (!activeSiteId || (activeSiteId !== userSite.id && activeSiteId !== userSite.code))) {
        setActiveSiteId(userSite.id);
      }
      userSiteSyncRef.current = true;
    }
  }, [user, sites, activeSiteId, setActiveSiteId]);

  const loadSites = useCallback(async () => {
    try {
      if (!navigator.onLine) {
        throw new Error('Offline mode — hydrating sites from local cache');
      }
      const activeCountry = (settings?.country || 'ET') as Country;
      const loadedSites = await queryClient.fetchQuery({
        queryKey: ['sites', user?.id || 'anon', activeCountry],
        queryFn: () => sitesService.getAll(),
        staleTime: 5 * 60 * 1000
      });

      // Ensure active country has its Administration HQ provisioned
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
        localStorage.setItem(`siifmart_sites_cache_${user?.id || 'anon'}`, JSON.stringify(loadedSites));
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
        cached = localStorage.getItem(`siifmart_sites_cache_${user?.id || 'anon'}`);
      } catch (e) {}
      if (cached) {
        setSites(JSON.parse(cached));
        if (navigator.onLine) {
          addNotification('info', 'Could not load the latest sites. Showing cached site data.');
        }
        return;
      }

      if (user?.siteId) {
        const activeCountry = ((user as any)?.country_code || (user as any)?.country || settings?.country || 'ET') as Country;
        const prof = getCountryProfile(activeCountry);
        const fallbackSite: Site = {
          id: user.siteId,
          code: user.siteId,
          name: 'Assigned Branch',
          type: 'Store',
          address: '',
          status: 'Active',
          manager: user.name || '',
          country: activeCountry,
          currency: prof.currency,
          isFulfillmentNode: false
        };
        setSites([fallbackSite]);
        setActiveSiteId(user.siteId);
        return;
      }

      const errorMsg = 'Could not load sites. Try refreshing.';
      addNotification('alert', errorMsg);
      setLoadError(errorMsg);

      if (navigator.onLine) {
        setTimeout(loadSites, 5000);
      }
    }
  }, [setSites, setActiveSiteId, addNotification, setLoadError, queryClient, user, settings?.country]);

  const loadSettings = useCallback(async () => {
    const applyResolvedSettings = (resolved: SystemConfig) => {
      setSettings(resolved);
      if (resolved.country === 'KE' || resolved.currency === 'KES' || resolved.currency === 'KSh') {
        setCurrencySymbol('KSh');
      } else if (resolved.currency) {
        setCurrencySymbol(resolved.currency);
      } else {
        const prof = getCountryProfile(resolved.country);
        setCurrencySymbol(prof.currencySymbol);
      }
    };

    try {
      if (!navigator.onLine) {
        const cachedOffline = await posDB.getCachedSettings();
        if (cachedOffline) {
          applyResolvedSettings(cachedOffline);
          return;
        }
      }
      const loadedSettings = await systemConfigService.getSettings();
      applyResolvedSettings(loadedSettings);
      void posDB.cacheSettings(loadedSettings);
    } catch (error: any) {
      logger.error('useDataInitialization', '❌ Failed to load system settings:', error?.message || error);
      const cachedOffline = await posDB.getCachedSettings();
      if (cachedOffline) {
        applyResolvedSettings(cachedOffline);
      } else {
        applyResolvedSettings(DEFAULT_CONFIG);
      }
    }
  }, [setSettings]);

  const hasLoadedGlobalRef = React.useRef(false);

  const loadGlobalData = useCallback(async () => {
    if (!navigator.onLine) {
      setIsDataInitialLoading(false);
      return;
    }
    try {
      // Egress optimization: Only global administrative roles need multi-site global batches on startup.
      // Branch workers only require local activeSite data (fetched via useDataQueries).
      const normalizedRole = (user?.role || '').toLowerCase().trim().replace(/[\s-]/g, '_');
      const canSwitchSites = [
        'group_ceo',
        'country_managing_director',
        'auditor',
        'country_commercial_director',
        'buyer',
        'country_supply_chain_director',
        'regional_operations_manager',
        'area_operations_manager',
        'regional_supply_chain_manager',
        'regional_procurement_manager',
        'regional_logistics_manager'
      ].includes(normalizedRole);

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

  const queriesRef = React.useRef(queries);
  queriesRef.current = queries;

  const refreshData = useCallback(async (scopes?: import('../DataContextTypes').RefreshDataScope[]) => {
    if (activeSiteId) {
      await queriesRef.current.refetchAll(scopes);
    } else {
      await loadGlobalData();
    }
  }, [activeSiteId, loadGlobalData]);

  return {
    loadSites,
    loadSettings,
    loadGlobalData,
    refreshData
  };
}
