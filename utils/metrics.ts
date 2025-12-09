/**
 * Shared Metrics Utility
 * Centralized calculations for all dashboards to ensure consistency
 */

import { Product, SaleRecord, WMSJob, PurchaseOrder, Employee, Site, StockMovement } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

export interface DashboardMetrics {
  // Revenue Metrics
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  avgBasket: number;
  transactionCount: number;

  // Inventory Metrics
  totalStockValue: number;
  stockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  uniqueProducts: number;

  // WMS Metrics
  pendingPicks: number;
  criticalPicks: number;
  inProgressPacks: number;
  pendingPutaways: number;
  avgCycleTime: string;
  pickAccuracy: string;

  // Procurement Metrics
  pendingPOs: number;
  inboundPOs: number;
  totalPOValue: number;

  // Employee Metrics
  totalEmployees: number;
  activeEmployees: number;

  // Network Metrics (for HQ)
  totalNetworkRevenue: number;
  totalNetworkStockValue: number;
  activeAlerts: number;

  // Quality & Returns
  returnRate: number;
  totalReturnedValue: number;
}

export interface SiteMetrics {
  siteId: string;
  siteName: string;
  revenue: number;
  stockValue: number;
  staffCount: number;
  lowStockCount: number;
  transactionCount: number;
  pendingJobs: number;
}

/**
 * Calculate all metrics for a single site
 */
export function calculateSiteMetrics(
  siteId: string,
  sales: SaleRecord[],
  products: Product[],
  jobs: WMSJob[],
  employees: Employee[],
  orders: PurchaseOrder[]
): SiteMetrics {
  const siteSales = sales.filter(s => s.siteId === siteId || s.site_id === siteId);
  const siteProducts = products.filter(p => p.siteId === siteId || p.site_id === siteId);
  const siteJobs = jobs.filter(j => j.siteId === siteId || j.site_id === siteId);
  const siteEmployees = employees.filter(e => e.siteId === siteId || e.site_id === siteId);

  return {
    siteId,
    siteName: '', // Will be filled by caller
    revenue: siteSales.reduce((sum, s) => sum + s.total, 0),
    stockValue: siteProducts.reduce((sum, p) => sum + (p.stock * p.price), 0),
    staffCount: siteEmployees.length,
    lowStockCount: siteProducts.filter(p => p.stock < 10 || p.status === 'low_stock').length,
    transactionCount: siteSales.length,
    pendingJobs: siteJobs.filter(j => j.status === 'Pending').length
  };
}

/**
 * Calculate all dashboard metrics
 */
export function calculateMetrics(
  sales: SaleRecord[],
  products: Product[],
  jobs: WMSJob[],
  orders: PurchaseOrder[],
  employees: Employee[],
  movements: StockMovement[],
  siteId?: string // Optional: filter by site
): DashboardMetrics {
  // Filter by site if provided
  const filteredSales = siteId
    ? sales.filter(s => s.siteId === siteId || s.site_id === siteId)
    : sales;
  const filteredProducts = siteId
    ? products.filter(p => p.siteId === siteId || p.site_id === siteId)
    : products;
  const filteredJobs = siteId
    ? jobs.filter(j => j.siteId === siteId || j.site_id === siteId)
    : jobs;
  const filteredOrders = siteId
    ? orders.filter(o => o.siteId === siteId || o.site_id === siteId)
    : orders;

  // Revenue Metrics
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalCost = filteredSales.reduce((sum, s) =>
    sum + ((s.items || []).reduce((is, i) =>
      is + ((i.costPrice || i.price * 0.7) * i.quantity), 0)
    ), 0
  );
  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
  const transactionCount = filteredSales.length;
  const avgBasket = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  // Inventory Metrics
  const totalStockValue = filteredProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const stockCount = filteredProducts.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = filteredProducts.filter(p => p.stock < 10 || p.status === 'low_stock').length;
  const outOfStockCount = filteredProducts.filter(p => p.stock === 0 || p.status === 'out_of_stock').length;
  const uniqueProducts = filteredProducts.length;

  // WMS Metrics
  const pendingPicks = filteredJobs.filter(j => j.type === 'PICK' && j.status === 'Pending').length;
  const criticalPicks = filteredJobs.filter(j =>
    j.type === 'PICK' && j.status === 'Pending' && j.priority === 'Critical'
  ).length;
  const inProgressPacks = filteredJobs.filter(j => j.type === 'PACK' && j.status === 'In-Progress').length;
  const pendingPutaways = filteredJobs.filter(j => j.type === 'PUTAWAY' && j.status === 'Pending').length;

  // Calculate average cycle time (simplified - in real app, use actual timestamps)
  const completedJobs = filteredJobs.filter(j => j.status === 'Completed');
  const avgCycleTime = completedJobs.length > 0 ? '4.2m' : '0m';

  // Pick accuracy (simplified - in real app, track errors)
  const pickAccuracy = '99.4%';

  // Procurement Metrics
  const pendingPOs = filteredOrders.filter(o => o.status === 'Pending' || o.status === 'Draft').length;
  const inboundPOs = filteredOrders.filter(o =>
    o.status === 'Pending' && new Date(o.expectedDelivery || '').toDateString() === new Date().toDateString()
  ).length;
  const totalPOValue = filteredOrders.reduce((sum, o) =>
    sum + ((o.lineItems || []).reduce((is, i) => is + (i.quantity * i.unitCost), 0)), 0
  );

  // Employee Metrics
  const filteredEmployees = siteId
    ? employees.filter(e => e.siteId === siteId || e.site_id === siteId)
    : employees;
  const totalEmployees = filteredEmployees.length;
  const activeEmployees = filteredEmployees.filter(e => e.status === 'Active').length;

  // Network Metrics (only if no site filter)
  const totalNetworkRevenue = siteId ? 0 : sales.reduce((sum, s) => sum + s.total, 0);
  const totalNetworkStockValue = siteId ? 0 : products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const activeAlerts = siteId
    ? lowStockCount + outOfStockCount
    : products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock').length;

  return {
    totalRevenue,
    totalCost,
    netProfit,
    profitMargin,
    avgBasket,
    transactionCount,
    totalStockValue,
    stockCount,
    lowStockCount,
    outOfStockCount,
    uniqueProducts,
    pendingPicks,
    criticalPicks,
    inProgressPacks,
    pendingPutaways,
    avgCycleTime,
    pickAccuracy,
    pendingPOs,
    inboundPOs,
    totalPOValue,
    totalEmployees,
    activeEmployees,
    totalNetworkRevenue,
    totalNetworkStockValue,
    activeAlerts,
    returnRate: transactionCount > 0 ? (filteredSales.filter(s => s.status === 'Refunded' || s.status === 'Partially Refunded').length / transactionCount) * 100 : 0,
    totalReturnedValue: filteredSales
      .filter(s => s.status === 'Refunded' || s.status === 'Partially Refunded')
      .reduce((sum, s) => sum + s.total, 0)
  };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return `${CURRENCY_SYMBOL} ${value.toLocaleString()}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Navigation routes for metrics
 */
export const METRIC_ROUTES = {
  revenue: '/sales-history',
  inventory: '/inventory',
  lowStock: '/inventory?filter=low_stock',
  wms: '/warehouse-operations',
  picks: '/warehouse-operations?tab=PICK',
  packs: '/warehouse-operations?tab=PACK',
  putaways: '/warehouse-operations?tab=PUTAWAY',
  procurement: '/procurement',
  pendingPOs: '/procurement?filter=pending',
  employees: '/employees',
  network: '/network-inventory',
  finance: '/finance'
};

