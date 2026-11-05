import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   ChevronRight, Receipt, ChevronLeft, CreditCard, Banknote, Smartphone,
   Loader, RefreshCw, WifiOff, CloudOff, Download
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { SaleRecord } from '../types';
import { useData } from '../contexts/DataContext';
import { salesService } from '../services/supabase.service';
import { Protected } from '../components/Protected';
import { formatDateTime } from '../utils/formatting';

import { useStore } from '../contexts/CentralStore';
import { canViewAllSites } from '../utils/permissions';
import { getCountryProfile, Country } from '../utils/localization';

import { SalesAnalyticsRibbon } from './sales-history/components/SalesAnalyticsRibbon';
import { SalesToolbar } from './sales-history/components/SalesToolbar';
import { SalesDetailModal } from './sales-history/components/SalesDetailModal';
import { SalesTable } from './sales-history/components/SalesTable';
import { SalesMobileList } from './sales-history/components/SalesMobileList';
import { triggerReceiptPrint } from './sales-history/utils/receiptPrinter';
import { logger } from '../utils/logger';
import { serializeSalesCsv } from './sales-history/utils/salesCsv';

const ITEMS_PER_PAGE = 25;

export default function SalesHistory() {
   const { movements, sites, addNotification, settings, allSales, posSyncStatus, posPendingSyncCount, effectiveCountry } = useData();

   const activeCountry = (effectiveCountry || settings?.country || 'ET') as Country;
   const countryProfile = useMemo(() => getCountryProfile(activeCountry), [activeCountry]);
   const currencySymbol = countryProfile.currencySymbol || CURRENCY_SYMBOL;

   const countrySites = useMemo(() => {
      return (sites || []).filter(s => (s.country || 'ET') === activeCountry);
   }, [sites, activeCountry]);

   const countrySiteIds = useMemo(() => countrySites.map(s => s.id), [countrySites]);

   const [sales, setSales] = useState<SaleRecord[]>([]);
   const [loading, setLoading] = useState(true);
   const [totalCount, setTotalCount] = useState(0);

   const { user } = useStore();
   const navigate = useNavigate();
   const fetchRequestId = useRef(0);
   const restricted = !canViewAllSites(user?.role);

   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState('All');
   const [methodFilter, setMethodFilter] = useState('All');
   const [storeFilter, setStoreFilter] = useState(restricted && user?.siteId ? user.siteId : 'All');

   // Auto reset storeFilter when country changes
   useEffect(() => {
      if (storeFilter !== 'All' && !countrySiteIds.includes(storeFilter)) {
         setStoreFilter('All');
         setCurrentPage(1);
      }
   }, [countrySiteIds, storeFilter]);

   const [dateRange, setDateRange] = useState({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // RULE 10: Default to recent 30 days
      end: new Date().toISOString().split('T')[0]
   });

   const [currentPage, setCurrentPage] = useState(1);
   const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

   const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
   const [detailTab, setDetailTab] = useState<'receipt' | 'audit'>('receipt');

   const fetchSales = useCallback(async () => {
      const requestId = ++fetchRequestId.current;
      setLoading(true);
      const effectiveSiteId = restricted ? (user?.siteId || 'NONE') : (storeFilter === 'All' ? undefined : storeFilter);
      const targetSiteIds = effectiveSiteId ? [effectiveSiteId] : countrySiteIds;
      if (targetSiteIds.length === 0 || (restricted && (!user?.siteId || !countrySiteIds.includes(user.siteId)))) {
         setSales([]);
         setTotalCount(0);
         setLoading(false);
         return;
      }
      try {
         if (!navigator.onLine) {
            throw new Error('Offline');
         }

         const offset = (currentPage - 1) * ITEMS_PER_PAGE;
         const filters = {
            search: searchTerm,
            status: statusFilter,
            method: methodFilter,
            startDate: dateRange.start,
            endDate: dateRange.end,
            siteIds: targetSiteIds
         };

         // Call service with pagination and filters
         const { data, count } = await salesService.getAll(
            effectiveSiteId,
            ITEMS_PER_PAGE,
            offset,
            filters
         );

         if (requestId !== fetchRequestId.current) return;
         setSales(data);
         setTotalCount(count);
      } catch {
         if (requestId !== fetchRequestId.current) return;
         logger.warn('SalesHistory', 'Network fetch failed or offline, falling back to local data');

         let filtered = [...(allSales || [])].filter(s => targetSiteIds.includes(s.siteId));

         // Apply Filters Locally
         if (statusFilter !== 'All') {
            filtered = filtered.filter(s => s.status === statusFilter);
         }
         if (methodFilter !== 'All') {
            filtered = filtered.filter(s => s.method === methodFilter);
         }
         if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(s =>
               (s.receiptNumber && s.receiptNumber.toLowerCase().includes(lower)) ||
               (s.id && s.id.toLowerCase().includes(lower)) ||
               (s.cashierName && s.cashierName.toLowerCase().includes(lower)) ||
               (s.customerName && s.customerName.toLowerCase().includes(lower))
            );
         }
         if (dateRange.start) {
            filtered = filtered.filter(s => s.date >= dateRange.start);
         }
         if (dateRange.end) {
            const nextDay = new Date(dateRange.end);
            nextDay.setDate(nextDay.getDate() + 1);
            filtered = filtered.filter(s => s.date < nextDay.toISOString());
         }

         // Sort by Date Descending
         filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

         // Apply Pagination
         const offset = (currentPage - 1) * ITEMS_PER_PAGE;
         setTotalCount(filtered.length);
         setSales(filtered.slice(offset, offset + ITEMS_PER_PAGE));

         if (navigator.onLine) {
            addNotification('info', 'Live sales history was unavailable; showing locally available sales.');
         }
      } finally {
         if (requestId === fetchRequestId.current) setLoading(false);
      }
   }, [currentPage, searchTerm, statusFilter, methodFilter, storeFilter, dateRange, addNotification, allSales, restricted, user?.siteId, countrySiteIds]);

   // Debounce Search
   useEffect(() => {
      const timer = setTimeout(() => {
         fetchSales();
      }, 500);
      return () => {
         clearTimeout(timer);
         fetchRequestId.current += 1;
      };
   }, [fetchSales]);

   const handleFilterChange = (setter: (val: any) => void, value: any) => {
      setter(value);
      setCurrentPage(1); // Reset to page 1 on filter change
   };

   // RULE 10: Lazy loading — load line items on-demand only when a sale is opened
   const handleOpenSaleDetail = async (sale: SaleRecord) => {
      setDetailTab('receipt');
      setSelectedSale(sale);
      if (!sale.items || sale.items.length === 0) {
         try {
            const fullSale = await salesService.getById(sale.id);
            if (fullSale) setSelectedSale(previous => previous?.id === sale.id ? fullSale : previous);
         } catch (err) {
            logger.warn('SalesHistory', 'Failed to lazy-fetch sale items', { id: sale.id, err });
         }
      }
   };

   // --- METRICS (Page Level) ---
   const metrics = useMemo(() => {
      const nonRefundedSales = sales.filter(s => s.status !== 'Refunded');
      const nonRefundedRevenue = nonRefundedSales.reduce((sum, sale) => sum + sale.total, 0);
      return {
         totalRev: nonRefundedRevenue,
         txCount: sales.length,
         avgTicket: nonRefundedSales.length > 0 ? nonRefundedRevenue / nonRefundedSales.length : 0,
      };
   }, [sales]);

   // --- AUDIT LOG FILTER ---
   const auditLogs = useMemo(() => {
      if (!selectedSale) return [];
      return (movements || []).filter(m => m.reason?.includes(selectedSale.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   }, [selectedSale, movements]);

   // --- ACTIONS ---
   const handleExportCSV = () => {
      addNotification('info', 'Exporting visible records...');
      const headers = ['Receipt Number', 'Date', 'Time', 'Cashier', 'Customer', 'Items', 'Method', 'Total', 'Status', 'Site'];
      const rows = sales.map(s => {
         const saleDate = new Date(s.date);
         const siteName = sites.find(site => site.id === s.siteId)?.name || 'Unknown';
         return [
            s.receiptNumber || `S${s.id.substring(0, 8).toUpperCase()}`,
            formatDateTime(saleDate),
            formatDateTime(saleDate, { showTime: true }).split(', ')[1],
            s.cashierName || 'Unknown',
            s.customerName || 'Walk-in',
            s.itemCount ?? s.items.length,
            s.method,
            s.total,
            s.status,
            siteName
         ];
      });

      const csvContent = serializeSalesCsv(headers, rows);
      const encodedUri = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sales_export_${dateRange.start}_to_${dateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(encodedUri), 1000);
   };

   const handleReprint = () => {
      if (!selectedSale) return;
      triggerReceiptPrint(selectedSale, settings, countrySites, currencySymbol);
   };

   return (
      <div className="space-y-5 sm:space-y-6">
         {/* Apple Section Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                  <Receipt size={20} />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)]">
                     Sales History
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] font-normal mt-0.5">
                     Audit, inspect, and export verified store transaction records.
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2.5">
               {/* Apple Sync Status Pill */}
               <div role="status" aria-live="polite" className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  posSyncStatus === 'offline'
                     ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]'
                     : posSyncStatus === 'syncing'
                        ? 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]'
                        : (posPendingSyncCount || 0) > 0
                           ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]'
                           : 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]'
                  }`}>
                  {posSyncStatus === 'syncing' ? (
                     <RefreshCw size={13} className="animate-spin" />
                  ) : posSyncStatus === 'offline' ? (
                     <WifiOff size={13} />
                  ) : (posPendingSyncCount || 0) > 0 ? (
                     <CloudOff size={13} />
                  ) : (
                     <span className="w-2 h-2 rounded-full bg-[var(--theme-status-success)] inline-block" />
                  )}
                  <span>
                     {posSyncStatus === 'offline' ? 'Offline Mode' :
                        posSyncStatus === 'syncing' ? 'Syncing...' :
                           (posPendingSyncCount || 0) > 0 ? `Pending Sync (${posPendingSyncCount})` :
                              'No pending changes'}
                  </span>
               </div>

               {/* Export Action Button */}
               <Protected permission="EXPORT_SALES_DATA">
                  <button
                     type="button"
                     onClick={handleExportCSV}
                     className="min-h-11 px-4 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] text-[var(--theme-text-primary)] text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  >
                     <Download size={14} />
                     <span>Export CSV</span>
                  </button>
               </Protected>
            </div>
         </div>

         {/* --- ANALYTICS RIBBON (PAGE LEVEL) --- */}
         <SalesAnalyticsRibbon metrics={metrics} totalCount={totalCount} currencySymbol={currencySymbol} />

         {/* --- SMART TOOLBAR --- */}
         <SalesToolbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateRange={dateRange}
            setDateRange={setDateRange}
            methodFilter={methodFilter}
            setMethodFilter={setMethodFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            storeFilter={storeFilter}
            setStoreFilter={setStoreFilter}
            restricted={restricted}
            sites={countrySites}
            handleFilterChange={handleFilterChange}
         />

         {/* --- DATA GRID & MOBILE CARDS --- */}
         <div aria-busy={loading} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl isolate overflow-hidden shadow-[var(--shadow-sm)] flex flex-col min-h-[500px]">
            <div className="flex-1 relative">
               {loading && (
                  <div role="status" className="absolute inset-0 bg-[var(--theme-bg-card)]/85 z-20 flex items-center justify-center gap-2">
                     <Loader className="w-7 h-7 text-[var(--theme-accent)] animate-spin" aria-hidden="true" />
                     <span className="sr-only">Loading sales records</span>
                  </div>
               )}

               {/* Mobile Card View (Phone Screens) */}
               <div className="block md:hidden">
                  <SalesMobileList
                     sales={sales}
                     currencySymbol={currencySymbol}
                     sites={countrySites}
                     loading={loading}
                     onOpenSaleDetail={handleOpenSaleDetail}
                  />
               </div>

               {/* Desktop Data Grid (Tablet / Desktop Screens) */}
               <div className="hidden md:block overflow-x-auto">
                  <SalesTable
                     sales={sales}
                     currencySymbol={currencySymbol}
                     sites={countrySites}
                     loading={loading}
                     onOpenSaleDetail={handleOpenSaleDetail}
                  />
               </div>
            </div>

            {/* Apple Pagination Footer */}
            <div className="h-14 px-4 sm:px-6 border-t border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-card)]">
               <p className="text-xs text-[var(--theme-text-secondary)]">
                  Showing <span className="text-[var(--theme-text-primary)] font-semibold font-mono tabular-nums">{totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="text-[var(--theme-text-primary)] font-semibold font-mono tabular-nums">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of <span className="text-[var(--theme-text-primary)] font-semibold font-mono tabular-nums">{totalCount}</span> entries
               </p>
               <div className="flex items-center gap-2">
                  <button
                     type="button"
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1 || loading}
                     className="min-h-11 px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] disabled:opacity-30 disabled:pointer-events-none text-[var(--theme-text-primary)] text-xs font-medium flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                     aria-label="Previous Page"
                  >
                     <ChevronLeft size={14} />
                     <span className="hidden sm:inline">Previous</span>
                  </button>
                  <span className="text-xs text-[var(--theme-text-secondary)] px-2 font-mono tabular-nums">
                     {currentPage} / {Math.max(totalPages, 1)}
                  </span>
                  <button
                     type="button"
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage >= totalPages || totalPages === 0 || loading}
                     className="min-h-11 px-3 rounded-xl bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-panel-hover)] border border-[var(--theme-border)] disabled:opacity-30 disabled:pointer-events-none text-[var(--theme-text-primary)] text-xs font-medium flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                     aria-label="Next Page"
                  >
                     <span className="hidden sm:inline">Next</span>
                     <ChevronRight size={14} />
                  </button>
               </div>
            </div>
         </div>

         {/* --- DETAIL MODAL --- */}
         <SalesDetailModal
            selectedSale={selectedSale}
            onClose={() => setSelectedSale(null)}
            detailTab={detailTab}
            setDetailTab={setDetailTab}
            settings={settings}
            sites={countrySites}
            auditLogs={auditLogs}
            handleReprint={handleReprint}
            onIssueReturn={() => {
               if (!selectedSale) return;
               const returnReference = selectedSale.receiptNumber || selectedSale.id;
               setSelectedSale(null);
               navigate(`/pos?return=${encodeURIComponent(returnReference)}`);
            }}
            currencySymbol={currencySymbol}
         />
      </div>
   );
}
