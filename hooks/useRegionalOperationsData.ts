import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { getUserRegion } from '../utils/userCountry';
import type { Region, Site, Employee, SaleRecord, PurchaseOrder, TransferRecord, ShiftRecord, Product } from '../types';
import { Country, getCountryProfile } from '../utils/localization';
import { normalizeCountryCode } from '../utils/siteIdGenerator';
import { useRegionalDataQueries } from './useRegionalDataQueries';

export interface OverrideVelocityBreach {
  siteId: string;
  siteName: string;
  managerName: string;
  totalOverrides: number;
  totalTransactions: number;
  velocityRate: number;
  isBreached: boolean;
}

export interface RegionalSitePerformance {
  id: string;
  name: string;
  type: string;
  revenue: number;
  transactionCount: number;
  staffCount: number;
  lowStockCount: number;
}

export interface RegionalOperationsData {
  regionCode: string;
  currentRegion: Region | null;
  sovereignRegions: Region[];
  isAuditInspection: boolean;
  activeCountry: Country;
  currencySymbol: string;
  regionalSites: Site[];
  siteCounts: {
    total: number;
    stores: number;
    warehouses: number;
  };
  regionalEmployees: Employee[];
  regionalSales: SaleRecord[];
  regionalOrders: PurchaseOrder[];
  regionalTransfers: TransferRecord[];
  intraRegionalTransfers: TransferRecord[];
  regionalShifts: ShiftRecord[];
  regionalProducts: Product[];
  inventoryMetrics: {
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    optimalStockCount: number;
    totalSKUs: number;
  };
  fulfillmentMetrics: {
    pendingPicks: number;
    inProgressPacks: number;
    pendingInboundShipments: number;
  };
  sitePerformance: RegionalSitePerformance[];
  topProducts: { name: string; sales: number; count: number }[];
  metrics: {
    openRegistersCount: number;
    activeShiftsCount: number;
    todaySalesTotal: number;
    todaySalesCount: number;
    monthlySalesTotal: number;
    monthlySpent: number;
    monthlyBudget: number;
    budgetPercent: number;
    isOverBudget: boolean;
    isNearCap: boolean;
    autonomousLimit: number;
    pendingAutonomousPOCount: number;
    pendingEscalatedPOCount: number;
    pendingCandidateCount: number;
    varianceShiftCount: number;
    discrepancyTransferCount: number;
    managerOverrideCount: number;
    overrideVelocityBreachCount: number;
  };
  pendingAutonomousPOs: PurchaseOrder[];
  pendingEscalatedPOs: PurchaseOrder[];
  pendingCandidateTalent: Employee[];
  varianceShifts: ShiftRecord[];
  discrepancyTransfers: TransferRecord[];
  overrideVelocityBreaches: OverrideVelocityBreach[];
}

export function useRegionalOperationsData(): RegionalOperationsData {
  const { user } = useStore();
  const {
    sites = [],
    employees = [],
    allSales = [],
    allOrders = [],
    shifts = [],
    regions = [],
    activeRegionCode,
    effectiveCountry,
    settings,
    allProducts = []
  } = useData();

  const [searchParams] = useSearchParams();
  const urlRegionParam = searchParams.get('regionCode');

  // Sovereign Country & Currency
  const activeCountry = (effectiveCountry || settings?.country || 'ET') as Country;
  const countryProfile = getCountryProfile(activeCountry);
  const currencySymbol = countryProfile.currencySymbol || countryProfile.currencyCode || 'KES';

  // Enforce zero cross-border leakage on regions list
  const sovereignRegions = useMemo(() => {
    const normActive = normalizeCountryCode(activeCountry);
    return regions.filter(r => normalizeCountryCode(r.country) === normActive);
  }, [regions, activeCountry]);

  // Resolve Territorial Lock
  // 1. Regional staff are strictly pinned to their sovereign territory
  const lockedUserRegion = useMemo(() => {
    return getUserRegion(user, sites, employees);
  }, [user, sites, employees]);

  // 2. HQ Executives (CEO / country_operations_director) may inspect territories via URL param or lens
  const isHQExecutive = useMemo(() => {
    const role = (user?.role || '').toLowerCase();
    const scope = user?.scopeLevel || user?.scope_level || 'HQ';
    return scope === 'HQ' && ['group_ceo', 'country_managing_director', 'country_operations_director'].includes(role);
  }, [user]);

  const effectiveRegionCode = useMemo(() => {
    if (lockedUserRegion) return lockedUserRegion;
    if (isHQExecutive && urlRegionParam) return urlRegionParam;
    if (isHQExecutive && activeRegionCode) return activeRegionCode;
    return sovereignRegions[0]?.code || `${normalizeCountryCode(activeCountry)}-REG01`;
  }, [lockedUserRegion, isHQExecutive, urlRegionParam, activeRegionCode, sovereignRegions, activeCountry]);

  const isAuditInspection = Boolean(isHQExecutive && !lockedUserRegion);

  const currentRegion = useMemo(() => {
    return sovereignRegions.find(r => r.code === effectiveRegionCode) || null;
  }, [sovereignRegions, effectiveRegionCode]);

  // Filter Facilities Pinned to Region
  const regionalSites = useMemo(() => {
    return sites.filter(s => {
      const siteRegion = s.regionCode || (s as any).region_code;
      return siteRegion === effectiveRegionCode;
    });
  }, [sites, effectiveRegionCode]);

  const regionalSiteIds = useMemo(() => {
    return new Set(regionalSites.map(s => s.id));
  }, [regionalSites]);

  const siteCounts = useMemo(() => {
    let stores = 0;
    let warehouses = 0;

    regionalSites.forEach(s => {
      const type = (s.type || '').toLowerCase();
      if (type.includes('store') || type.includes('retail') || type.includes('pos')) stores++;
      else if (type.includes('warehouse') || type.includes('distribution') || type.includes('wms') || type.includes('fulfillment')) warehouses++;
      else stores++;
    });

    return {
      total: regionalSites.length,
      stores,
      warehouses
    };
  }, [regionalSites]);

  const siteIdsArray = useMemo(() => Array.from(regionalSiteIds), [regionalSiteIds]);

  const {
    regionalProducts: queriedProducts,
    regionalEmployees: queriedEmployees,
    regionalShifts: queriedShifts,
    regionalOrders: queriedOrders,
    regionalSales: queriedSales,
    regionalTransfers: queriedTransfers = []
  } = useRegionalDataQueries({
    regionCode: effectiveRegionCode,
    siteIds: siteIdsArray,
    enabled: siteIdsArray.length > 0
  });

  // Filter Regional Workforce (prioritizing direct territorial query)
  const regionalEmployees = useMemo(() => {
    if (queriedEmployees.length > 0) return queriedEmployees;
    return employees.filter(e => {
      const empRegion = e.regionCode || (e as any).region_code;
      if (empRegion && empRegion === effectiveRegionCode) return true;
      if (e.siteId && regionalSiteIds.has(e.siteId)) return true;
      return false;
    });
  }, [queriedEmployees, employees, effectiveRegionCode, regionalSiteIds]);

  // Filter Regional Sales (prioritizing direct territorial query)
  const regionalSales = useMemo(() => {
    if (queriedSales.length > 0) return queriedSales;
    return allSales.filter(s => regionalSiteIds.has(s.siteId));
  }, [queriedSales, allSales, regionalSiteIds]);

  // Filter Regional Purchase Orders (prioritizing direct territorial query)
  const regionalOrders = useMemo(() => {
    if (queriedOrders.length > 0) return queriedOrders;
    return allOrders.filter(o => {
      const poRegion = o.regionCode || (o as any).region_code;
      if (poRegion && poRegion === effectiveRegionCode) return true;
      if (o.siteId && regionalSiteIds.has(o.siteId)) return true;
      return false;
    });
  }, [queriedOrders, allOrders, effectiveRegionCode, regionalSiteIds]);

  // Filter Regional Transfers (originating or terminating in region)
  const regionalTransfers = useMemo(() => {
    return queriedTransfers.filter(t => {
      const srcMatch = t.sourceRegionCode === effectiveRegionCode || regionalSiteIds.has(t.sourceSiteId);
      const dstMatch = t.destRegionCode === effectiveRegionCode || regionalSiteIds.has(t.destSiteId);
      return srcMatch || dstMatch;
    });
  }, [queriedTransfers, effectiveRegionCode, regionalSiteIds]);

  const intraRegionalTransfers = useMemo(() => {
    return regionalTransfers.filter(t => {
      const srcMatch = t.sourceRegionCode === effectiveRegionCode || regionalSiteIds.has(t.sourceSiteId);
      const dstMatch = t.destRegionCode === effectiveRegionCode || regionalSiteIds.has(t.destSiteId);
      return srcMatch && dstMatch;
    });
  }, [regionalTransfers, effectiveRegionCode, regionalSiteIds]);

  const discrepancyTransfers = useMemo(() => {
    return regionalTransfers.filter(t => Boolean(t.hasDiscrepancy));
  }, [regionalTransfers]);

  // Filter Regional Shifts (prioritizing direct territorial query)
  const regionalShifts = useMemo(() => {
    if (queriedShifts.length > 0) return queriedShifts;
    return shifts.filter(s => regionalSiteIds.has(s.siteId));
  }, [queriedShifts, shifts, regionalSiteIds]);

  // Real-time Metrics Aggregation
  const todayPrefix = useMemo(() => new Date().toISOString().split('T')[0], []);
  const monthPrefix = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const todaySales = useMemo(() => {
    return regionalSales.filter(s => (s.date || '').startsWith(todayPrefix));
  }, [regionalSales, todayPrefix]);

  const todaySalesTotal = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
  }, [todaySales]);

  const monthlySalesTotal = useMemo(() => {
    return regionalSales
      .filter(s => (s.date || '').startsWith(monthPrefix))
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }, [regionalSales, monthPrefix]);

  // Autonomous Procurement (SOP-MGT-020)
  const autonomousLimit = Number(currentRegion?.autonomous_po_limit ?? 0);
  const monthlyBudget = Number(currentRegion?.monthly_procurement_budget) || 0;

  const currentMonthOrders = useMemo(() => {
    return regionalOrders.filter(o => {
      const dateStr = o.createdAt || o.date || '';
      return dateStr.startsWith(monthPrefix) && o.status !== 'Cancelled' && o.status !== 'Rejected';
    });
  }, [regionalOrders, monthPrefix]);

  const monthlySpent = useMemo(() => {
    return currentMonthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [currentMonthOrders]);

  const budgetPercent = useMemo(() => {
    if (monthlyBudget <= 0) return 0;
    return Math.min(100, Math.round((monthlySpent / monthlyBudget) * 100));
  }, [monthlySpent, monthlyBudget]);

  const isOverBudget = monthlyBudget > 0 && monthlySpent > monthlyBudget;
  const isNearCap = monthlyBudget > 0 && monthlySpent >= monthlyBudget * 0.85;

  const pendingAutonomousPOs = useMemo(() => {
    return regionalOrders.filter(o => (o.status === 'Pending' || o.status === 'Draft') && (o.totalAmount || 0) <= autonomousLimit);
  }, [regionalOrders, autonomousLimit]);

  const pendingEscalatedPOs = useMemo(() => {
    return regionalOrders.filter(o => (o.status === 'Pending' || o.status === 'Draft') && (o.totalAmount || 0) > autonomousLimit);
  }, [regionalOrders, autonomousLimit]);

  // Frontline Talent Drafts
  const pendingCandidateTalent = useMemo(() => {
    return regionalEmployees.filter(e => e.status === 'Pending Approval');
  }, [regionalEmployees]);

  // Shift & Cash Drawer Variances
  const varianceShifts = useMemo(() => {
    return regionalShifts.filter(s => {
      const hasVariance = s.variance !== undefined && s.variance !== null && s.variance !== 0;
      const isFlagged = s.status === 'Flagged' || s.reconciliationStatus === 'Discrepancy_Flagged';
      return hasVariance || isFlagged;
    });
  }, [regionalShifts]);

  // Open Registers
  const openRegistersCount = useMemo(() => {
    return regionalShifts.filter(s => s.status === 'Open').length;
  }, [regionalShifts]);

  const activeShiftsCount = openRegistersCount;

  // 24-Hour Managerial Override Velocity Monitoring (SOP-MGT-020: < 3.0% ceiling)
  const overrideVelocityBreaches = useMemo(() => {
    const breaches: OverrideVelocityBreach[] = [];

    regionalSites.forEach(site => {
      const siteShifts = regionalShifts.filter(s => s.siteId === site.id);
      const siteSales = regionalSales.filter(s => s.siteId === site.id);
      
      const flaggedShifts = siteShifts.filter(s => {
        const hasVariance = s.variance !== undefined && s.variance !== null && s.variance !== 0;
        const isFlagged = s.status === 'Flagged' || s.reconciliationStatus === 'Discrepancy_Flagged';
        return hasVariance || isFlagged;
      });

      // Transactions baseline: sales count or shift transactions
      const totalTransactions = Math.max(siteSales.length, siteShifts.length * 15, 1);
      const totalOverrides = flaggedShifts.length;
      const velocityRate = Number(((totalOverrides / totalTransactions) * 100).toFixed(1));
      const isBreached = velocityRate >= 3.0;

      if (isBreached && totalOverrides > 0) {
        breaches.push({
          siteId: site.id,
          siteName: site.name,
          managerName: site.manager || flaggedShifts[0]?.supervisorName || flaggedShifts[0]?.cashierName || 'Branch Manager',
          totalOverrides,
          totalTransactions,
          velocityRate,
          isBreached: true
        });
      }
    });

    return breaches;
  }, [regionalSites, regionalShifts, regionalSales]);

  // Regional Catalog & Stock Valuation (prioritizing direct territorial query)
  const regionalProducts = useMemo(() => {
    if (queriedProducts.length > 0) return queriedProducts;
    return allProducts.filter(p => !p.siteId || regionalSiteIds.has(p.siteId));
  }, [queriedProducts, allProducts, regionalSiteIds]);

  const inventoryMetrics = useMemo(() => {
    const totalValue = regionalProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    const lowStock = regionalProducts.filter(p => (p.stock < 10 && p.stock > 0) || p.status === 'low_stock').length;
    const outOfStock = regionalProducts.filter(p => p.stock === 0 || p.status === 'out_of_stock').length;
    const optimal = regionalProducts.filter(p => p.stock >= 10 && p.status !== 'out_of_stock').length;

    return {
      totalValue,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      optimalStockCount: optimal,
      totalSKUs: regionalProducts.length
    };
  }, [regionalProducts]);

  // Regional Inbound Freight & Warehouse Workload
  const pendingInboundShipments = useMemo(() => {
    return regionalOrders.filter(o => o.status === 'Approved' || o.status === 'Partially Received' || o.status === 'Pending').length;
  }, [regionalOrders]);

  const fulfillmentMetrics = useMemo(() => {
    const processingSales = regionalSales.filter(s => s.status === 'Pending');
    return {
      pendingPicks: processingSales.length * 2,
      inProgressPacks: Math.max(processingSales.length > 0 ? 1 : 0, Math.floor(processingSales.length * 1.2)),
      pendingInboundShipments
    };
  }, [regionalSales, pendingInboundShipments]);

  // Regional Site Performance Ranking
  const sitePerformance: RegionalSitePerformance[] = useMemo(() => {
    return regionalSites.map(site => {
      const siteSales = regionalSales.filter(s => s.siteId === site.id);
      const revenue = siteSales.reduce((acc, curr) => acc + (curr.total || 0), 0);
      const staffCount = regionalEmployees.filter(e => e.siteId === site.id).length;
      const lowStock = regionalProducts.filter(p => p.siteId === site.id && ((p.stock < 10 && p.stock > 0) || p.status === 'low_stock')).length;

      return {
        id: site.id,
        name: site.name,
        type: site.type || 'Store',
        revenue,
        transactionCount: siteSales.length,
        staffCount,
        lowStockCount: lowStock
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [regionalSites, regionalSales, regionalEmployees, regionalProducts]);

  // Top Selling Products in Territory
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sales: number; count: number }>();
    regionalSales.forEach(sale => {
      if (sale.status !== 'Completed') return;
      (sale.items || []).forEach(item => {
        const cur = map.get(item.id) || { name: item.name, sales: 0, count: 0 };
        map.set(item.id, {
          name: item.name,
          sales: cur.sales + ((item.price || 0) * (item.quantity || 1)),
          count: cur.count + (item.quantity || 1)
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales).slice(0, 5);
  }, [regionalSales]);

  return {
    regionCode: effectiveRegionCode,
    currentRegion,
    sovereignRegions,
    isAuditInspection,
    activeCountry,
    currencySymbol,
    regionalSites,
    siteCounts,
    regionalEmployees,
    regionalSales,
    regionalOrders,
    regionalTransfers,
    intraRegionalTransfers,
    regionalShifts,
    regionalProducts,
    inventoryMetrics,
    fulfillmentMetrics,
    sitePerformance,
    topProducts,
    metrics: {
      openRegistersCount,
      activeShiftsCount,
      todaySalesTotal,
      todaySalesCount: todaySales.length,
      monthlySalesTotal,
      monthlySpent,
      monthlyBudget,
      budgetPercent,
      isOverBudget,
      isNearCap,
      autonomousLimit,
      pendingAutonomousPOCount: pendingAutonomousPOs.length,
      pendingEscalatedPOCount: pendingEscalatedPOs.length,
      pendingCandidateCount: pendingCandidateTalent.length,
      varianceShiftCount: varianceShifts.length,
      discrepancyTransferCount: discrepancyTransfers.length,
      managerOverrideCount: overrideVelocityBreaches.reduce((acc, b) => acc + b.totalOverrides, 0),
      overrideVelocityBreachCount: overrideVelocityBreaches.length
    },
    pendingAutonomousPOs,
    pendingEscalatedPOs,
    pendingCandidateTalent,
    varianceShifts,
    discrepancyTransfers,
    overrideVelocityBreaches
  };
}
