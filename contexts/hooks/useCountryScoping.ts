import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import {
  Site, PurchaseOrder, SaleRecord, Employee,
  StockMovement, ShiftRecord, ExpenseRecord, Product, Supplier, Customer,
  DiscountCode, Region
} from '../../types';
import { canSwitchCountry, getUserCountry, canSwitchRegion, getUserRegion } from '../../utils/permissions';
import { Country, getCountryProfile, COUNTRY_LEGAL_DEFAULTS } from '../../utils/localization';
import { logger } from '../../utils/logger';
import { findCountryAdminSite } from '../../utils/countryAdmin';
import { setCurrencySymbol } from '../../constants/categories';
import { regionsService } from '../../services/regions.service';

function getSiteCountry(s: Site): Country {
  if (s.country) return s.country;
  if (s.currency === 'KES' || s.currency === 'KSh') return 'KE';
  if (s.currency === 'UGX' || s.currency === 'USh') return 'UG';
  if (s.currency === 'RWF') return 'RW';
  if (s.currency === 'TZS' || s.currency === 'TSh') return 'TZ';
  return 'ET';
}

interface UseCountryScopingProps {
  country?: Country;
  settings?: any;
  user?: any;
  sites: Site[];
  activeSiteId: string;
  setActiveSiteId: (id: string) => void;
  allOrders: PurchaseOrder[];
  allSales: SaleRecord[];
  employees: Employee[];
  movements: StockMovement[];
  shifts: ShiftRecord[];
  expenses: ExpenseRecord[];
  allProducts: Product[];
  products?: Product[];
  suppliers: Supplier[];
  customers?: Customer[];
  discountCodes?: DiscountCode[];
}

export function useCountryScoping({
  country = 'ET',
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
  products = [],
  suppliers,
  customers = [],
  discountCodes = []
}: UseCountryScopingProps) {
  // 0. Role-based Country Authority:
  // ONLY CEO / Super Admin can check both sides of the country.
  // Regular employees from another country CANNOT access a different country.
  // Their country is strictly pinned to their assigned site.
  const isCeo = canSwitchCountry(user);
  const canSwitchRegionUser = canSwitchRegion(user);

  const effectiveCountry: Country = useMemo(() => {
    // If no user context (e.g. system init/testing) or user is CEO/Super Admin, respect active country setting
    if (!user || isCeo) {
      return (country || 'ET') as Country;
    }
    // Regular employees from another country CANNOT access a different country. Locked to branch.
    return getUserCountry(user, sites, employees);
  }, [isCeo, country, user, sites, employees]);

  // Regional Authority & Lens State
  const userRegionCode = useMemo(() => {
    return getUserRegion(user, sites, employees);
  }, [user, sites, employees]);

  const isRegionalUser = Boolean(!canSwitchRegionUser && userRegionCode);

  const [activeRegionCode, setActiveRegionCodeState] = useState<string | null>(() => {
    if (isRegionalUser && userRegionCode) return userRegionCode;
    return null;
  });

  const [regions, setRegions] = useState<Region[]>([]);

  // Fetch regions for effective sovereign country
  useEffect(() => {
    let isMounted = true;
    regionsService.getRegions(effectiveCountry).then(data => {
      if (isMounted) setRegions(data);
    }).catch(err => {
      logger.warn('useCountryScoping', 'Failed to load regions for country:', err);
    });
    return () => { isMounted = false; };
  }, [effectiveCountry]);

  // Sync regional lock for regional users or reset on country change for HQ
  useEffect(() => {
    if (isRegionalUser && userRegionCode) {
      setActiveRegionCodeState(userRegionCode);
    } else if (canSwitchRegionUser) {
      setActiveRegionCodeState(null);
    }
  }, [effectiveCountry, isRegionalUser, userRegionCode, canSwitchRegionUser]);

  const setActiveRegionCode = useCallback((code: string | null) => {
    if (isRegionalUser) {
      logger.warn('useCountryScoping', 'Regional user cannot switch regional lens');
      return;
    }
    setActiveRegionCodeState(code);
  }, [isRegionalUser]);

  // 1. Site Country Lookup Map (all existing/unassigned sites default to Ethiopia ET)
  const siteCountryMap = useMemo(() => {
    const map = new Map<string, Country>();
    sites.forEach(s => {
      map.set(s.id, getSiteCountry(s));
      if (s.code) {
        map.set(s.code, getSiteCountry(s));
      }
    });
    return map;
  }, [sites]);

  // 2. Scoped Sites: facilities in effective country matching activeRegionCode (if selected)
  const scopedSites = useMemo(() => {
    const countrySites = sites.filter(s => getSiteCountry(s) === effectiveCountry);
    if (!activeRegionCode) return countrySites;
    const regionalSites = countrySites.filter(s => s.regionCode === activeRegionCode || s.region_code === activeRegionCode);
    return regionalSites.length > 0 ? regionalSites : countrySites;
  }, [sites, effectiveCountry, activeRegionCode]);

  // 3. Auto-switch active site when effective country changes
  const prevCountryRef = useRef<Country>(effectiveCountry);
  useEffect(() => {
    if (sites.length === 0) return;
    const currentSite = sites.find(s => s.id === activeSiteId);
    const currentSiteCountry = currentSite ? getSiteCountry(currentSite) : undefined;

    // If active site doesn't match the effective country, switch to that country's Administration HQ first
    if (!currentSite || currentSiteCountry !== effectiveCountry) {
      const countrySites = sites.filter(s => getSiteCountry(s) === effectiveCountry);
      // For non-CEO staff, prioritize their assigned branch if located within sovereign country
      let targetSite = null;
      if (!isCeo && user?.siteId) {
        targetSite = countrySites.find(s => s.id === user.siteId || (s as any).code === user.siteId);
      }
      if (!targetSite) {
        const adminSite = findCountryAdminSite(countrySites, effectiveCountry);
        targetSite = adminSite || countrySites[0];
      }
      if (targetSite) {
        logger.info('useCountryScoping', `Switching active site to ${targetSite.name} (${targetSite.id}) for country ${effectiveCountry}`);
        setActiveSiteId(targetSite.id);
      }
    }
    prevCountryRef.current = effectiveCountry;
  }, [effectiveCountry, sites, activeSiteId, setActiveSiteId, isCeo, user?.siteId]);

  // 4. Scoped Purchase Orders (Procurement History)
  const scopedAllOrders = useMemo(() => {
    return allOrders.filter(po => {
      if (!po.siteId) return effectiveCountry === 'ET'; // fallback legacy unassigned to ET
      const poCountry = siteCountryMap.get(po.siteId) || 'ET';
      if (poCountry !== effectiveCountry) return false;
      if (!activeRegionCode) return true;
      const poSite = sites.find(s => s.id === po.siteId || s.code === po.siteId);
      if (!poSite) return true;
      return poSite.regionCode === activeRegionCode || poSite.region_code === activeRegionCode;
    });
  }, [allOrders, siteCountryMap, effectiveCountry, activeRegionCode, sites]);

  // Helper: check if a site belongs to the currently active region (if any)
  const isSiteInActiveRegion = useCallback((siteId?: string): boolean => {
    if (!activeRegionCode) return true;
    if (!siteId) return false;
    const site = sites.find(s => s.id === siteId || (s as any).code === siteId);
    if (!site) return false;
    return site.regionCode === activeRegionCode || (site as any).region_code === activeRegionCode;
  }, [activeRegionCode, sites]);

  // 5. Scoped Sales History
  const scopedAllSales = useMemo(() => {
    return allSales.filter(sale => {
      if (!sale.siteId) return effectiveCountry === 'ET';
      const saleCountry = siteCountryMap.get(sale.siteId) || 'ET';
      if (saleCountry !== effectiveCountry) return false;
      return isSiteInActiveRegion(sale.siteId);
    });
  }, [allSales, siteCountryMap, effectiveCountry, isSiteInActiveRegion]);

  // 6. Scoped Employees (All existing employees default to Ethiopia ET)
  const scopedEmployees = useMemo(() => {
    return employees.filter(emp => {
      let empCountry = (emp as any).country;
      if (!empCountry && emp.siteId) {
        empCountry = siteCountryMap.get(emp.siteId);
      }
      const finalCountry = empCountry || 'ET';
      if (finalCountry !== effectiveCountry) return false;
      if (!activeRegionCode) return true;
      const empRegion = emp.regionCode || (emp as any).region_code;
      if (empRegion) return empRegion === activeRegionCode;
      return isSiteInActiveRegion(emp.siteId);
    });
  }, [employees, siteCountryMap, effectiveCountry, activeRegionCode, isSiteInActiveRegion]);

  // 7. Scoped Goods / Stock Movements
  const scopedMovements = useMemo(() => {
    return movements.filter(m => {
      const siteId = m.siteId || (m as any).site_id;
      if (!siteId) return effectiveCountry === 'ET';
      const mCountry = siteCountryMap.get(siteId) || 'ET';
      if (mCountry !== effectiveCountry) return false;
      return isSiteInActiveRegion(siteId);
    });
  }, [movements, siteCountryMap, effectiveCountry, isSiteInActiveRegion]);

  // 8. Scoped Shifts (POS Cash Drawer & Reconciliations)
  const scopedShifts = useMemo(() => {
    return shifts.filter(sh => {
      if (!sh.siteId) return effectiveCountry === 'ET';
      const shCountry = siteCountryMap.get(sh.siteId) || 'ET';
      if (shCountry !== effectiveCountry) return false;
      return isSiteInActiveRegion(sh.siteId);
    });
  }, [shifts, siteCountryMap, effectiveCountry, isSiteInActiveRegion]);

  // 9. Scoped Expenses
  const scopedExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (!exp.siteId) return effectiveCountry === 'ET';
      const expCountry = siteCountryMap.get(exp.siteId) || 'ET';
      if (expCountry !== effectiveCountry) return false;
      return isSiteInActiveRegion(exp.siteId);
    });
  }, [expenses, siteCountryMap, effectiveCountry, isSiteInActiveRegion]);

  // 10. Scoped Products (Multi-site catalog inventory & POS)
  const isProductInCountry = useCallback((p: Product): boolean => {
    // 1. Check explicit country or country_code on product
    const explicitCountry = (p as any).country || (p as any).country_code;
    if (explicitCountry) return explicitCountry === effectiveCountry;

    // 2. Check national SKU prefix (ET-, KE-, UG-, RW-, TZ- or unhyphenated KECN..., ETCN...)
    if (p.sku?.startsWith('KE-') || /^[kK][eE][A-Za-z]{2,4}\d+/.test(p.sku || '')) return effectiveCountry === 'KE';
    if (p.sku?.startsWith('ET-') || /^[eE][tT][A-Za-z]{2,4}\d+/.test(p.sku || '')) return effectiveCountry === 'ET';
    if (p.sku?.startsWith('UG-') || /^[uU][gG][A-Za-z]{2,4}\d+/.test(p.sku || '')) return effectiveCountry === 'UG';
    if (p.sku?.startsWith('RW-') || /^[rR][wW][A-Za-z]{2,4}\d+/.test(p.sku || '')) return effectiveCountry === 'RW';
    if (p.sku?.startsWith('TZ-') || /^[tT][zZ][A-Za-z]{2,4}\d+/.test(p.sku || '')) return effectiveCountry === 'TZ';

    // 3. Check site mapping if assigned
    if (p.siteId) {
      const prodCountry = siteCountryMap.get(p.siteId) || 'ET';
      return prodCountry === effectiveCountry;
    }

    // 4. Default unassigned catalog items to Ethiopia (HQ baseline)
    return effectiveCountry === 'ET';
  }, [effectiveCountry, siteCountryMap]);

  const scopedAllProducts = useMemo(() => {
    return allProducts.filter(isProductInCountry);
  }, [allProducts, isProductInCountry]);

  const scopedProducts = useMemo(() => {
    return (products || []).filter(isProductInCountry);
  }, [products, isProductInCountry]);

  // 11. Scoped Customers
  const scopedCustomers = useMemo(() => {
    return customers.filter(c => {
      const explicitCountry = (c as any).country;
      let custCountry = explicitCountry;
      if (!custCountry) {
        const isKeCustomer = c.phone?.startsWith('+254') || c.phone?.startsWith('07') || c.phone?.startsWith('01');
        const isUgCustomer = c.phone?.startsWith('+256');
        custCountry = isKeCustomer ? 'KE' : isUgCustomer ? 'UG' : 'ET';
      }
      if (custCountry !== effectiveCountry) return false;
      if (activeRegionCode) {
        const custRegion = (c as any).regionCode || (c as any).region_code;
        if (custRegion && custRegion !== activeRegionCode) return false;
      }
      return true;
    });
  }, [customers, effectiveCountry, activeRegionCode]);

  // 12. Scoped Suppliers
  const scopedSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const explicitCountry = (s as any).country;
      let suppCountry = explicitCountry;
      if (!suppCountry) {
        const isKeSupplier = s.phone?.startsWith('+254') || s.phone?.startsWith('07') || s.phone?.startsWith('01') || (s.location && /kenya|nairobi|mombasa|kisumu|eldoret|nakuru/i.test(s.location));
        const isUgSupplier = s.phone?.startsWith('+256') || (s.location && /uganda|kampala|entebbe|jinja/i.test(s.location));
        suppCountry = isKeSupplier ? 'KE' : isUgSupplier ? 'UG' : 'ET';
      }
      if (suppCountry !== effectiveCountry) return false;
      if (activeRegionCode) {
        const suppRegion = (s as any).regionCode || (s as any).region_code;
        if (suppRegion && suppRegion !== activeRegionCode) return false;
      }
      return true;
    });
  }, [suppliers, effectiveCountry, activeRegionCode]);

  // 13. Scoped Discount Codes (Multi-Country Voucher Isolation)
  const scopedDiscountCodes = useMemo(() => {
    return discountCodes.filter(dc => {
      const codeCountry = dc.country || dc.country_code || 'ET';
      return codeCountry === effectiveCountry;
    });
  }, [discountCodes, effectiveCountry]);

  // 14. Scoped Settings: If non-CEO staff is locked to effectiveCountry (e.g. 'ET'),
  // their system settings MUST reflect their country even if global settings were set to another country.
  const scopedSettings = useMemo(() => {
    if (!settings) return settings;
    if (isCeo || settings.country === effectiveCountry) return settings;

    const profile = getCountryProfile(effectiveCountry);
    const partition = settings.countryConfigs?.[effectiveCountry] || {};
    const isKe = effectiveCountry === 'KE';

    return {
      ...settings,
      country: effectiveCountry,
      currency: partition.currency || profile.currency,
      timezone: partition.timezone || profile.timezone,
      dateFormat: partition.dateFormat || profile.dateFormat || 'DD/MM/YYYY',
      taxRate: partition.taxRate ?? profile.taxRate,
      defaultVatRate: partition.taxRate ?? profile.taxRate,
      taxAuthority: partition.taxAuthority || profile.taxAuthority,
      complianceStandard: partition.complianceStandard || profile.complianceStandard,
      eTimsEnabled: isKe,
      storeName: partition.storeName || settings.storeName,
      legalBusinessName: partition.legalBusinessName || COUNTRY_LEGAL_DEFAULTS[effectiveCountry]?.legalBusinessName || settings.legalBusinessName,
      registeredAddress: partition.registeredAddress || COUNTRY_LEGAL_DEFAULTS[effectiveCountry]?.registeredAddress || settings.registeredAddress,
      supportContact: partition.supportContact || settings.supportContact,
      supportPhone: partition.supportPhone || settings.supportPhone,
      posReceiptTaxId: partition.posReceiptTaxId || settings.posReceiptTaxId,
      posReceiptHeader: partition.posReceiptHeader || settings.posReceiptHeader,
      posReceiptFooter: partition.posReceiptFooter || settings.posReceiptFooter,
      posReceiptAddress: partition.posReceiptAddress || settings.posReceiptAddress,
      posReceiptPhone: partition.posReceiptPhone || settings.posReceiptPhone,
      posReceiptEmail: partition.posReceiptEmail || settings.posReceiptEmail,
    };
  }, [settings, isCeo, effectiveCountry]);

  // Synchronize category CURRENCY_SYMBOL to the active sovereign country
  useEffect(() => {
    const profile = getCountryProfile(effectiveCountry);
    const partition = settings?.countryConfigs?.[effectiveCountry];
    const resolvedSymbol = partition?.currency || profile.currencySymbol || (effectiveCountry === 'KE' ? 'KSh' : effectiveCountry === 'UG' ? 'USh' : 'ETB');
    setCurrencySymbol(resolvedSymbol);
  }, [effectiveCountry, settings?.countryConfigs]);

  return {
    scopedSites,
    scopedAllOrders,
    scopedAllSales,
    scopedEmployees,
    scopedMovements,
    scopedShifts,
    scopedExpenses,
    scopedAllProducts,
    scopedProducts,
    scopedCustomers,
    scopedSuppliers,
    scopedDiscountCodes,
    scopedSettings,
    siteCountryMap,
    effectiveCountry,
    isCeo,
    regions,
    activeRegionCode,
    setActiveRegionCode,
    canSwitchRegion: canSwitchRegionUser,
    isRegionalUser
  };
}
