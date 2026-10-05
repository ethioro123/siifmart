import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
   ChevronRight, FileText, CheckCircle, ChevronLeft, CreditCard,
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

// Pagination Config
const ITEMS_PER_PAGE = 20;

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
      start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], // Default to last 1 year
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
      } catch (error) {
         logger.warn('SalesHistory', 'Network fetch failed or offline, falling back to local data:');

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
            // Add one day to end date to include the full day
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
            addNotification('info', 'Loaded from local cache (Network Error)');
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

   const handleFilterChange = (setter: any, value: any) => {
      setter(value);
      setCurrentPage(1); // Reset to page 1 on filter change
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
      <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-[var(--theme-text-primary)] flex items-center gap-2.5">
                  <FileText className="text-[var(--theme-text-primary)]" />
                  Audit Console
               </h2>
               <p className="text-[var(--theme-text-secondary)] text-sm font-medium">Search, audit, and report on store transaction history.</p>
            </div>
            <div className="flex items-center gap-3">
               {/* Sync Status Badge */}
               <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors duration-300 ${
                  posSyncStatus === 'offline' 
                     ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
                     : posSyncStatus === 'syncing' 
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' 
                        : (posPendingSyncCount || 0) > 0 
                           ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                           : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                  {posSyncStatus === 'syncing' ? (
                     <RefreshCw size={14} className="animate-spin" />
                  ) : posSyncStatus === 'offline' ? (
                     <WifiOff size={14} />
                  ) : (posPendingSyncCount || 0) > 0 ? (
                     <CloudOff size={14} />
                  ) : (
                     <CheckCircle size={14} />
                  )}
                  <span>
                     {posSyncStatus === 'offline' ? 'Offline Mode' :
                        posSyncStatus === 'syncing' ? 'Syncing...' :
                           (posPendingSyncCount || 0) > 0 ? 'Sync Pending' :
                              'System Online'}
                     {((posPendingSyncCount || 0) > 0) && ` (${posPendingSyncCount})`}
                  </span>
               </div>

               <Protected permission="EXPORT_SALES_DATA">
                  <button
                     type="button"
                     onClick={handleExportCSV}
                     className="bg-[var(--theme-bg-panel)] text-[var(--theme-text-primary)] border border-[var(--theme-border)] px-4 py-2 rounded-xl text-sm hover:bg-[var(--theme-bg-panel-hover)] flex items-center transition-all font-bold active:scale-[0.98] shadow-xs cursor-pointer"
                  >
                     <Download className="w-4 h-4 mr-2" />
                     Export Page Data
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
         <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl overflow-hidden flex flex-col min-h-[500px] shadow-xs">
            <div className="overflow-x-auto flex-1 relative">
               {loading && (
                  <div className="absolute inset-0 bg-[var(--theme-bg-card)]/50 backdrop-blur-xs z-10 flex items-center justify-center">
                     <Loader className="w-8 h-8 text-[var(--theme-text-primary)] animate-spin" />
                  </div>
               )}
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-[var(--theme-bg-panel)] border-b border-[var(--theme-border)] text-[10px] uppercase tracking-wider font-bold text-[var(--theme-text-secondary)]">
                        <th className="p-4">Receipt ID</th>
                        <th className="p-4">Date & Time</th>
                        <th className="p-4">Store</th>
                        <th className="p-4">Cashier</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4 text-right">Items</th>
                        <th className="p-4 text-right">Total</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--theme-border)]">
                     {sales.map((sale) => (
                        <tr
                           key={sale.id}
                           onClick={() => { setSelectedSale(sale); setDetailTab('receipt'); }}
                           className="hover:bg-[var(--theme-bg-panel-hover)] transition-colors cursor-pointer group text-[var(--theme-text-primary)]"
                        >
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 <FileText size={14} className="text-[var(--theme-text-secondary)]" />
                                 <span className="text-sm font-mono text-[var(--theme-text-primary)] font-bold group-hover:underline transition-colors">{sale.receiptNumber || `S${sale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="text-xs text-[var(--theme-text-secondary)] font-medium">{formatDateTime(sale.date, { useRelative: true })}</div>
                           </td>
                           <td className="p-4">
                              <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                                 {sites.find(s => s.id === sale.siteId)?.name || 'Unknown'}
                              </span>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] flex items-center justify-center text-[10px] font-bold text-[var(--theme-text-primary)]">
                                    {sale.cashierName?.charAt(0) || '?'}
                                 </div>
                                 <span className="text-xs text-[var(--theme-text-primary)] font-medium">{sale.cashierName || 'Unknown'}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <span className="text-xs text-[var(--theme-text-secondary)] flex items-center gap-1.5 font-medium">
                                 <CreditCard size={12} className="text-[var(--theme-text-secondary)]" /> {sale.method}
                              </span>
                           </td>
                           <td className="p-4 text-xs text-[var(--theme-text-secondary)] text-right font-mono font-bold">{sale.items.length}</td>
                           <td className="p-4 text-sm font-mono text-[var(--theme-text-primary)] font-bold text-right">
                              {currencySymbol} {sale.total.toLocaleString()}
                           </td>
                           <td className="p-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                 sale.status === 'Completed' 
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                    : sale.status === 'Pending' 
                                       ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' 
                                       : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                              }`}>
                                 {sale.status}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <ChevronRight size={16} className="text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)] transition-colors" />
                           </td>
                        </tr>
                     ))}
                     {!loading && sales.length === 0 && (
                        <tr><td colSpan={9} className="p-12 text-center text-[var(--theme-text-muted)] font-medium bg-transparent">No transactions found matching criteria.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-[var(--theme-border)] flex justify-between items-center bg-[var(--theme-bg-panel)]">
               <p className="text-xs text-[var(--theme-text-secondary)]">
                  Showing <span className="text-[var(--theme-text-primary)] font-bold">{totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="text-[var(--theme-text-primary)] font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of {totalCount} entries
               </p>
               <div className="flex gap-2">
                  <button
                     type="button"
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1 || loading}
                     className="p-2 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-panel-hover)] disabled:opacity-30 text-[var(--theme-text-primary)] transition-all active:scale-95 cursor-pointer"
                     aria-label="Previous Page"
                  >
                     <ChevronLeft size={16} />
                  </button>
                  <button
                     type="button"
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage >= totalPages || totalPages === 0 || loading}
                     className="p-2 rounded-xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] hover:bg-[var(--theme-bg-panel-hover)] disabled:opacity-30 text-[var(--theme-text-primary)] transition-all active:scale-95 cursor-pointer"
                     aria-label="Next Page"
                  >
                     <ChevronRight size={16} />
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
