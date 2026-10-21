import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// --- Sub-Components ---
import { SalesAnalyticsRibbon } from './sales-history/components/SalesAnalyticsRibbon';
import { SalesToolbar } from './sales-history/components/SalesToolbar';
import { SalesDetailModal } from './sales-history/components/SalesDetailModal';
import { triggerReceiptPrint } from './sales-history/utils/receiptPrinter';
import { logger } from '../utils/logger';

// Pagination Config (Rule 10: 25-Item Shelf Rule)
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

   // --- DATA STATE ---
   const [sales, setSales] = useState<SaleRecord[]>([]);
   const [loading, setLoading] = useState(true);
   const [totalCount, setTotalCount] = useState(0);

   const { user } = useStore();
   const restricted = !canViewAllSites(user?.role);

   // --- FILTER STATE ---
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

   // --- PAGINATION STATE ---
   const [currentPage, setCurrentPage] = useState(1);
   const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

   // --- MODAL STATE ---
   const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
   const [detailTab, setDetailTab] = useState<'receipt' | 'audit'>('receipt');

   // --- FETCH DATA ---
   const fetchSales = useCallback(async () => {
      setLoading(true);
      try {
         // Determine target site IDs for country isolation
         const effectiveSiteId = restricted ? (user?.siteId || 'NONE') : (storeFilter === 'All' ? undefined : storeFilter);
         const targetSiteIds = effectiveSiteId ? [effectiveSiteId] : countrySiteIds;

         // If restricted user has no site, or there are no sites in this country, return empty
         if (targetSiteIds.length === 0 || (restricted && (!user?.siteId || !countrySiteIds.includes(user.siteId)))) {
            setSales([]);
            setTotalCount(0);
            setLoading(false);
            return;
         }

         // Check if online before attempting fetch
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

         setSales(data);
         setTotalCount(count);
      } catch {
         logger.warn('SalesHistory', 'Network fetch failed or offline, falling back to local data');

         // Fallback to local allSales filtering
         const effectiveSiteId = restricted ? (user?.siteId || 'NONE') : (storeFilter === 'All' ? undefined : storeFilter);
         const targetSiteIds = effectiveSiteId ? [effectiveSiteId] : countrySiteIds;
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
               (s.cashierName && s.cashierName.toLowerCase().includes(lower))
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
         setLoading(false);
      }
   }, [currentPage, searchTerm, statusFilter, methodFilter, storeFilter, dateRange, addNotification, allSales, restricted, user?.siteId, countrySiteIds]);

   // Debounce Search
   useEffect(() => {
      const timer = setTimeout(() => {
         fetchSales();
      }, 500);
      return () => clearTimeout(timer);
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
            if (fullSale) setSelectedSale(fullSale);
         } catch (err) {
            logger.warn('SalesHistory', 'Failed to lazy-fetch sale items', { id: sale.id, err });
         }
      }
   };

   // --- METRICS (Page Level) ---
   const metrics = useMemo(() => {
      return {
         totalRev: sales.reduce((sum, s) => sum + (s.status !== 'Refunded' ? s.total : 0), 0),
         txCount: sales.length,
         avgTicket: sales.length > 0 ? (sales.reduce((sum, s) => sum + (s.status !== 'Refunded' ? s.total : 0), 0) / sales.length) : 0,
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
            s.items.length,
            s.method,
            s.total,
            s.status,
            siteName
         ];
      });

      const csvContent = "data:text/csv;charset=utf-8,"
         + headers.join(",") + "\n"
         + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sales_export_${dateRange.start}_to_${dateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

         {/* --- DATA GRID --- */}
         <div aria-busy={loading} className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl isolate overflow-hidden shadow-[var(--shadow-sm)] flex flex-col min-h-[500px]">
            <div className="overflow-x-auto flex-1 relative">
               {loading && (
                  <div role="status" className="absolute inset-0 bg-[var(--theme-bg-card)]/85 z-20 flex items-center justify-center gap-2">
                     <Loader className="w-7 h-7 text-[var(--theme-accent)] animate-spin" aria-hidden="true" />
                     <span className="sr-only">Loading sales records</span>
                  </div>
               )}
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-[var(--theme-thead-bg)] border-b border-[var(--theme-border)] text-[11px] font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider sticky top-0 z-10">
                        <th className="py-3.5 px-4">Receipt ID</th>
                        <th className="py-3.5 px-4">Date & Time</th>
                        <th className="py-3.5 px-4">Store</th>
                        <th className="py-3.5 px-4">Cashier</th>
                        <th className="py-3.5 px-4">Payment</th>
                        <th className="py-3.5 px-4 text-right">Items</th>
                        <th className="py-3.5 px-4 text-right">Total</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th aria-label="Open transaction details" className="py-3.5 px-4 w-10"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--theme-border)]">
                     {sales.map((sale) => (
                        <tr
                           key={sale.id}
                           tabIndex={0}
                           aria-label={`Sale ${sale.receiptNumber || sale.id}, ${sale.status}, ${currencySymbol} ${sale.total.toLocaleString()}. Open details.`}
                           onClick={() => handleOpenSaleDetail(sale)}
                           onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleOpenSaleDetail(sale); } }}
                           className="hover:bg-[var(--theme-table-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-accent)] transition-colors cursor-pointer group text-[var(--theme-text-primary)]"
                        >
                           <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                 <div className="w-7 h-7 rounded-lg bg-[var(--theme-bg-subtle)] group-hover:bg-blue-500/10 text-[var(--theme-text-secondary)] group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] flex items-center justify-center shrink-0 transition-colors">
                                    <Receipt size={14} />
                                 </div>
                                 <span className="text-xs sm:text-sm font-mono tabular-nums text-[var(--theme-text-primary)] font-semibold group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] transition-colors">
                                    {sale.receiptNumber || `S${sale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}
                                 </span>
                              </div>
                           </td>
                           <td className="py-3.5 px-4">
                              <div className="text-xs text-[var(--theme-text-primary)] font-medium">
                                 {formatDateTime(sale.date, { showTime: true }).split(', ')[0]}
                              </div>
                              <div className="text-[11px] text-[var(--theme-text-secondary)] font-mono tabular-nums">
                                 {formatDateTime(sale.date, { showTime: true }).split(', ')[1] || ''}
                              </div>
                           </td>
                           <td className="py-3.5 px-4">
                              <span className="text-xs text-[var(--theme-text-primary)] font-medium">
                                 {sites.find(s => s.id === sale.siteId)?.name || 'Primary Store'}
                              </span>
                           </td>
                           <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[11px] font-semibold text-[var(--theme-text-primary)]">
                                    {sale.cashierName?.charAt(0) || 'C'}
                                 </div>
                                 <span className="text-xs text-[var(--theme-text-primary)] font-medium">
                                    {sale.cashierName || 'Cashier'}
                                 </span>
                              </div>
                           </td>
                           <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--theme-bg-subtle)] text-xs text-[var(--theme-text-secondary)] font-medium">
                                 {sale.method === 'Cash' ? (
                                    <Banknote size={12} className="text-[var(--theme-text-secondary)]" />
                                 ) : sale.method === 'Card' ? (
                                    <CreditCard size={12} className="text-[var(--theme-text-secondary)]" />
                                 ) : (
                                    <Smartphone size={12} className="text-[var(--theme-text-secondary)]" />
                                 )}
                                 <span>{sale.method}</span>
                              </span>
                           </td>
                           <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-[var(--theme-text-secondary)] text-right font-medium">
                              {sale.items.length}
                           </td>
                           <td className="py-3.5 px-4 text-sm font-mono tabular-nums text-[var(--theme-text-primary)] font-semibold text-right">
                              {currencySymbol} {sale.total.toLocaleString()}
                           </td>
                           <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                 sale.status === 'Completed' 
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                    : sale.status === 'Pending' 
                                       ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' 
                                       : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                              }`}>
                                 {sale.status}
                              </span>
                           </td>
                           <td className="py-3.5 px-4 text-right">
                              <ChevronRight size={15} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] group-hover:translate-x-0.5 transition-all" />
                           </td>
                        </tr>
                     ))}
                     {!loading && sales.length === 0 && (
                        <tr>
                           <td colSpan={9} className="py-16 px-4">
                              <div className="flex flex-col items-center justify-center text-center">
                                 <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] mb-3">
                                    <Receipt size={22} />
                                 </div>
                                 <p className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                    No sales match this view
                                 </p>
                                 <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-sm">
                                    Try changing the date range, search, or filters to see other transactions.
                                 </p>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
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
            addNotification={addNotification}
            currencySymbol={currencySymbol}
         />
      </div>
   );
}
