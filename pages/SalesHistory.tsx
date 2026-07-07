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

// --- Sub-Components ---
import { SalesAnalyticsRibbon } from './sales-history/components/SalesAnalyticsRibbon';
import { SalesToolbar } from './sales-history/components/SalesToolbar';
import { SalesDetailModal } from './sales-history/components/SalesDetailModal';
import { triggerReceiptPrint } from './sales-history/utils/receiptPrinter';
import { logger } from '../utils/logger';

// Pagination Config
const ITEMS_PER_PAGE = 20;

export default function SalesHistory() {
   const { movements, sites, addNotification, settings, allSales, posSyncStatus, posPendingSyncCount } = useData();

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
            endDate: dateRange.end
         };

         // Call service with pagination and filters
         const effectiveSiteId = restricted ? (user?.siteId || 'NONE') : (storeFilter === 'All' ? undefined : storeFilter);
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
         let filtered = [...(allSales || [])];

         // Apply Filters Locally
         const effectiveSiteId = restricted ? (user?.siteId || 'NONE') : storeFilter;
         if (effectiveSiteId !== 'All') {
            filtered = filtered.filter(s => s.siteId === effectiveSiteId);
         }
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
   }, [currentPage, searchTerm, statusFilter, methodFilter, storeFilter, dateRange, addNotification, allSales, restricted, user?.siteId]);

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
      triggerReceiptPrint(selectedSale, settings, sites);
   };

   return (
      <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-2.5">
                  <FileText className="text-[#2C5E3B] dark:text-[#A9CBA2]" />
                  Audit Console
               </h2>
               <p className="text-[#4D6E56] dark:text-gray-400 text-sm font-medium">Search, audit, and report on full transaction history.</p>
            </div>
            <div className="flex items-center gap-3">
               {/* Sync Status Badge */}
               <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors duration-300 ${
                  posSyncStatus === 'offline' 
                     ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border-rose-200/50 dark:border-rose-900/20' 
                     : posSyncStatus === 'syncing' 
                        ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-200/50 dark:border-sky-900/20' 
                        : (posPendingSyncCount || 0) > 0 
                           ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/20' 
                           : 'bg-emerald-50 dark:bg-[#2C5E3B]/10 text-emerald-700 dark:text-[#A9CBA2] border border-emerald-250/50 dark:border-[#2C5E3B]/25'
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
                     onClick={handleExportCSV}
                     className="bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 text-[#2C5E3B] dark:text-[#A9CBA2] border border-[#2C5E3B]/20 dark:border-[#A9CBA2]/25 px-4 py-2 rounded-xl text-sm hover:bg-[#2C5E3B]/20 dark:hover:bg-[#2C5E3B]/30 flex items-center transition-all font-bold active:scale-98 shadow-sm"
                  >
                     <Download className="w-4 h-4 mr-2" />
                     Export Page Data
                  </button>
               </Protected>
            </div>
         </div>

         {/* --- ANALYTICS RIBBON (PAGE LEVEL) --- */}
         <SalesAnalyticsRibbon metrics={metrics} totalCount={totalCount} />

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
            sites={sites}
            handleFilterChange={handleFilterChange}
         />

         {/* --- DATA GRID --- */}
         <div className="bg-white/80 dark:bg-[#18201B]/40 border border-[#E2DCCE] dark:border-emerald-950/20 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col min-h-[500px] shadow-sm">
            <div className="overflow-x-auto flex-1 relative">
               {loading && (
                  <div className="absolute inset-0 bg-[#FAF8F5]/40 dark:bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
                     <Loader className="w-8 h-8 text-[#2C5E3B] dark:text-[#A9CBA2] animate-spin" />
                  </div>
               )}
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-[#F4F0E6] dark:bg-black/20 border-b border-[#E2DCCE] dark:border-white/10 text-[10px] uppercase tracking-widest font-black text-stone-500 dark:text-gray-400">
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
                  <tbody className="divide-y divide-[#E2DCCE]/60 dark:divide-white/5">
                     {sales.map((sale) => (
                        <tr
                           key={sale.id}
                           onClick={() => { setSelectedSale(sale); setDetailTab('receipt'); }}
                           className="hover:bg-[#2C5E3B]/5 dark:hover:bg-white/5 transition-colors cursor-pointer group text-[#1E3F27] dark:text-white"
                        >
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 <FileText size={14} className="text-stone-400 dark:text-gray-550" />
                                 <span className="text-sm font-mono text-[#1E3F27] dark:text-[#EAE5D9] font-bold group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors">{sale.receiptNumber || `S${sale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="text-xs text-stone-600 dark:text-gray-300 font-semibold">{formatDateTime(sale.date, { useRelative: true })}</div>
                           </td>
                           <td className="p-4">
                              <span className="text-xs text-stone-600 dark:text-gray-300 font-medium">
                                 {sites.find(s => s.id === sale.siteId)?.name || 'Unknown'}
                              </span>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-[#FAF8F5] dark:bg-white/10 border border-[#E2DCCE] dark:border-white/10 flex items-center justify-center text-[10px] font-black text-[#2C5E3B] dark:text-[#A9CBA2]">
                                    {sale.cashierName?.charAt(0) || '?'}
                                 </div>
                                 <span className="text-xs text-stone-650 dark:text-gray-300 font-medium">{sale.cashierName || 'Unknown'}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <span className="text-xs text-stone-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                                 <CreditCard size={12} className="text-stone-400 dark:text-gray-550" /> {sale.method}
                              </span>
                           </td>
                           <td className="p-4 text-xs text-stone-650 dark:text-gray-400 text-right font-mono font-bold">{sale.items.length}</td>
                           <td className="p-4 text-sm font-mono text-[#1E3F27] dark:text-white font-bold text-right">
                              {CURRENCY_SYMBOL} {sale.total.toLocaleString()}
                           </td>
                           <td className="p-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-[4px] text-[10px] font-black uppercase border ${
                                 sale.status === 'Completed' 
                                    ? 'text-emerald-700 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
                                    : sale.status === 'Pending' 
                                       ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' 
                                       : 'text-rose-700 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 border-rose-200 dark:border-red-500/20'
                                 }`}>
                                 {sale.status}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <ChevronRight size={16} className="text-stone-455 dark:text-gray-600 group-hover:text-[#2C5E3B] dark:group-hover:text-[#A9CBA2] transition-colors" />
                           </td>
                        </tr>
                     ))}
                     {!loading && sales.length === 0 && (
                        <tr><td colSpan={9} className="p-12 text-center text-stone-400 dark:text-gray-500 font-medium bg-transparent">No transactions found matching criteria.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-[#E2DCCE] dark:border-white/10 flex justify-between items-center bg-[#FAF8F5]/80 dark:bg-black/25">
               <p className="text-xs text-stone-500 dark:text-gray-550">
                  Showing <span className="text-[#1E3F27] dark:text-white font-bold">{totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="text-[#1E3F27] dark:text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of {totalCount} entries
               </p>
               <div className="flex gap-2">
                  <button
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1 || loading}
                     className="p-2 rounded-xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 hover:bg-stone-50 dark:hover:bg-white/10 disabled:opacity-30 text-stone-700 dark:text-white transition-all active:scale-95 cursor-pointer"
                     aria-label="Previous Page"
                  >
                     <ChevronLeft size={16} />
                  </button>
                  <button
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage >= totalPages || totalPages === 0 || loading}
                     className="p-2 rounded-xl bg-white dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 hover:bg-stone-50 dark:hover:bg-white/10 disabled:opacity-30 text-stone-700 dark:text-white transition-all active:scale-95 cursor-pointer"
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
            sites={sites}
            auditLogs={auditLogs}
            handleReprint={handleReprint}
            addNotification={addNotification}
         />
      </div>
   );
}
