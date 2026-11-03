import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { getUserRegion } from '../utils/userCountry';
import { Country, getCountryProfile } from '../utils/localization';
import { normalizeCountryCode } from '../utils/siteIdGenerator';
import { useRegionalDataQueries } from './useRegionalDataQueries';
import { useAreaStoreMetrics } from './useAreaStoreMetrics';
import { useRegionalOperatingSummary } from './useRegionalOperatingSummary';

export type { OverrideVelocityBreach, RegionalSitePerformance, RegionalOperationsData } from '../types/regionalOperations';
import type { OverrideVelocityBreach, RegionalSitePerformance, RegionalOperationsData } from '../types/regionalOperations';

export function useRegionalOperationsData(): RegionalOperationsData {
  const { user } = useStore();
  const {
    sites = [],
    regions = [],
    activeRegionCode,
    effectiveCountry,
    settings
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
  const isAreaManager = user?.role === 'area_operations_manager';
  const { data: areaStoreMetrics = [], isPending: areaMetricsPending, isError: areaMetricsError } =
    useAreaStoreMetrics(user?.id, activeCountry, isAreaManager);
  const areaMetricsUnavailable = isAreaManager && (areaMetricsPending || areaMetricsError);

  const currentRegion = useMemo(() => {
    return sovereignRegions.find(r => r.code === effectiveRegionCode) || null;
  }, [sovereignRegions, effectiveRegionCode]);

  // Filter Facilities Pinned to Region
  const regionalSites = useMemo(() => {
    return sites.filter(s => {
      const siteRegion = s.regionCode || (s as any).region_code;
      return siteRegion === effectiveRegionCode && normalizeCountryCode(s.country) === normalizeCountryCode(activeCountry)
        && (!isAreaManager || (s.type === 'Store' && s.areaManagerId === user?.id));
    });
  }, [sites, effectiveRegionCode, activeCountry, isAreaManager, user?.id]);

  const { data: summaryRows = [], isPending: summaryPending, isError: summaryError } =
    useRegionalOperatingSummary(user?.id, effectiveRegionCode, normalizeCountryCode(activeCountry), !isAreaManager && Boolean(currentRegion));
  const summaryUnavailable = !isAreaManager && (summaryPending || summaryError);
  const sumSummary = (key: Exclude<keyof typeof summaryRows[number], 'site_id'>) =>
    summaryRows.reduce((total, row) => total + row[key], 0);

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
    regionalTransfers: queriedTransfers = [],
    isLoading: listsLoading,
    isError: listsError
  } = useRegionalDataQueries({
    regionCode: effectiveRegionCode,
    siteIds: siteIdsArray,
    enabled: siteIdsArray.length > 0
  });

  const regionalEmployees = queriedEmployees.filter(e => e.siteId && regionalSiteIds.has(e.siteId));
  const regionalSales = queriedSales.filter(s => regionalSiteIds.has(s.siteId));
  const regionalOrders = queriedOrders.filter(o => o.siteId && regionalSiteIds.has(o.siteId));

  // Filter Regional Transfers (originating or terminating in region)
  const regionalTransfers = useMemo(() => {
    return queriedTransfers.filter(t => {
      const srcMatch = t.sourceRegionCode === effectiveRegionCode || regionalSiteIds.has(t.sourceSiteId);
      const dstMatch = t.destRegionCode === effectiveRegionCode || regionalSiteIds.has(t.destSiteId);
      return isAreaManager ? (regionalSiteIds.has(t.sourceSiteId) || regionalSiteIds.has(t.destSiteId)) : (srcMatch || dstMatch);
    });
  }, [queriedTransfers, effectiveRegionCode, regionalSiteIds, isAreaManager]);

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

  const regionalShifts = queriedShifts.filter(s => regionalSiteIds.has(s.siteId));

  // Autonomous Procurement (SOP-MGT-020)
  const autonomousLimit = Number(currentRegion?.autonomous_po_limit ?? 0);
  const monthlyBudget = Number(currentRegion?.monthly_procurement_budget) || 0;

  const monthlySpent = sumSummary('monthly_po_spend');
  const budgetPercent = monthlyBudget > 0 ? Math.min(100, Math.round(monthlySpent / monthlyBudget * 100)) : 0;
  const isOverBudget = monthlyBudget > 0 && monthlySpent > monthlyBudget;
  const isNearCap = monthlyBudget > 0 && monthlySpent >= monthlyBudget * 0.85;
  const pendingAutonomousPOs = regionalOrders.filter(o => o.status === 'Pending' && (o.totalAmount || 0) <= autonomousLimit);
  const pendingEscalatedPOs = regionalOrders.filter(o => o.status === 'Pending' && (o.totalAmount || 0) > autonomousLimit);

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

  const overrideVelocityBreaches = useMemo(() => summaryRows.flatMap(row => {
    const site = regionalSites.find(candidate => candidate.id === row.site_id);
    if (!site || row.sales_24h === 0 || row.overrides_24h === 0) return [];
    const velocityRate = Number((row.overrides_24h / row.sales_24h * 100).toFixed(1));
    return velocityRate >= 3 ? [{
      siteId: site.id, siteName: site.name, managerName: site.manager || 'Unassigned',
      totalOverrides: row.overrides_24h, totalTransactions: row.sales_24h, velocityRate, isBreached: true
    }] : [];
  }), [summaryRows, regionalSites]);

  const regionalProducts = queriedProducts.filter(p => p.siteId && regionalSiteIds.has(p.siteId));

  const inventoryMetrics = {
    totalValue: sumSummary('inventory_value'), lowStockCount: sumSummary('low_stock_count'),
    outOfStockCount: sumSummary('out_of_stock_count'), optimalStockCount: sumSummary('optimal_stock_count'),
    totalSKUs: sumSummary('total_skus')
  };
  const fulfillmentMetrics = {
    pendingPicks: sumSummary('pending_picks'), inProgressPacks: sumSummary('in_progress_packs'),
    pendingInboundShipments: sumSummary('pending_receives')
  };
  const sitePerformance: RegionalSitePerformance[] = regionalSites.map(site => {
    const exact = isAreaManager ? areaStoreMetrics.find(m => m.site_id === site.id) : summaryRows.find(m => m.site_id === site.id);
    return { id: site.id, name: site.name, type: site.type || 'Store',
      revenue: exact?.monthly_sales_total ?? 0, transactionCount: exact?.today_sales_count ?? 0,
      staffCount: exact?.staff_count ?? 0, lowStockCount: isAreaManager ? 0 : (summaryRows.find(m => m.site_id === site.id)?.low_stock_count ?? 0) };
  }).sort((a,b) => b.revenue-a.revenue);

  return {
    regionCode: effectiveRegionCode,
    currentRegion,
    sovereignRegions,
    isAuditInspection,
    isAreaManager,
    areaMetricsUnavailable,
    summaryUnavailable,
    regionalListsUnavailable: listsLoading || listsError,
    summaryRows,
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
    metrics: {
      openRegistersCount: isAreaManager ? areaStoreMetrics.reduce((sum, m) => sum + m.open_register_count, 0) : sumSummary('open_register_count'),
      activeShiftsCount: isAreaManager ? areaStoreMetrics.reduce((sum, m) => sum + m.open_register_count, 0) : sumSummary('open_register_count'),
      todaySalesTotal: isAreaManager ? areaStoreMetrics.reduce((sum, m) => sum + m.today_sales_total, 0) : sumSummary('today_sales_total'),
      todaySalesCount: isAreaManager ? areaStoreMetrics.reduce((sum, m) => sum + m.today_sales_count, 0) : sumSummary('today_sales_count'),
      monthlySalesTotal: isAreaManager ? areaStoreMetrics.reduce((sum, m) => sum + m.monthly_sales_total, 0) : sumSummary('monthly_sales_total'),
      monthlySpent: isAreaManager ? areaStoreMetrics.reduce((sum, m) => sum + m.monthly_po_spend, 0) : monthlySpent,
      monthlyBudget,
      budgetPercent,
      isOverBudget,
      isNearCap,
      autonomousLimit,
      pendingAutonomousPOCount: isAreaManager ? 0 : sumSummary('pending_po_count'),
      pendingEscalatedPOCount: isAreaManager ? areaStoreMetrics.reduce((sum, m) => sum + m.escalated_po_count, 0) : sumSummary('escalated_po_count'),
      pendingCandidateCount: pendingCandidateTalent.length,
      varianceShiftCount: isAreaManager ? varianceShifts.length : sumSummary('variance_shift_count'),
      discrepancyTransferCount: discrepancyTransfers.length,
      managerOverrideCount: sumSummary('overrides_24h'),
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
