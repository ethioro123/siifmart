import type { Region, Site, Employee, SaleRecord, PurchaseOrder, TransferRecord, ShiftRecord, Product } from '../types';
import type { Country } from '../utils/localization';
import type { RegionalOperatingSummaryRow } from '../hooks/useRegionalOperatingSummary';

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
  isAreaManager: boolean;
  areaMetricsUnavailable: boolean;
  summaryUnavailable: boolean;
  summaryRows: RegionalOperatingSummaryRow[];
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

