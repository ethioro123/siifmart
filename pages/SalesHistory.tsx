
import React, { useState, useEffect, useCallback } from 'react';
import {
   Search, Filter, Download, Calendar, ChevronRight,
   FileText, CheckCircle, XCircle, RotateCcw, Clock, Printer,
   ChevronLeft, ChevronDown, MoreHorizontal, CreditCard, User, Tag,
   ArrowUpRight, ArrowDownRight, Shield, Loader
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { SaleRecord } from '../types';
import Modal from '../components/Modal';
import { useData } from '../contexts/DataContext';
import { salesService } from '../services/supabase.service';
import { Protected, ProtectedButton } from '../components/Protected';
import { formatDateTime } from '../utils/formatting';

// Pagination Config
const ITEMS_PER_PAGE = 20;

export default function SalesHistory() {
   const { movements, sites, addNotification, settings } = useData();

   // --- DATA STATE ---
   const [sales, setSales] = useState<SaleRecord[]>([]);
   const [loading, setLoading] = useState(true);
   const [totalCount, setTotalCount] = useState(0);

   // --- FILTER STATE ---
   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState('All');
   const [methodFilter, setMethodFilter] = useState('All');
   const [storeFilter, setStoreFilter] = useState('All');

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
         const offset = (currentPage - 1) * ITEMS_PER_PAGE;
         const filters = {
            search: searchTerm,
            status: statusFilter,
            method: methodFilter,
            startDate: dateRange.start,
            endDate: dateRange.end
         };

         // Call service with pagination and filters
         const { data, count } = await salesService.getAll(
            storeFilter === 'All' ? undefined : storeFilter,
            ITEMS_PER_PAGE,
            offset,
            filters
         );

         setSales(data);
         setTotalCount(count);
      } catch (error) {
         console.error('Error fetching sales history:', error);
         addNotification('alert', 'Failed to load sales history.');
      } finally {
         setLoading(false);
      }
   }, [currentPage, searchTerm, statusFilter, methodFilter, storeFilter, dateRange, addNotification]);

   // Debounce Search
   useEffect(() => {
      const timer = setTimeout(() => {
         fetchSales();
      }, 500);
      return () => clearTimeout(timer);
   }, [fetchSales]);

   // Reset page on filter change (handled by individual setters wrapping fetch? No, confusing dependencies)
   // Better: When filters change, setPage(1). But we need to separate effects.
   // Simplified: Just one effect on [fetchSales], and specific handlers for inputs that reset page.

   const handleFilterChange = (setter: any, value: any) => {
      setter(value);
      setCurrentPage(1); // Reset to page 1 on filter change
   };

   // --- METRICS (Page Level) ---
   const metrics = {
      totalRev: sales.reduce((sum, s) => sum + (s.status !== 'Refunded' ? s.total : 0), 0),
      txCount: sales.length,
      avgTicket: sales.length > 0 ? (sales.reduce((sum, s) => sum + (s.status !== 'Refunded' ? s.total : 0), 0) / sales.length) : 0,
      refundCount: sales.filter(s => s.status === 'Refunded').length
   };

   // --- AUDIT LOG FILTER ---
   const auditLogs = React.useMemo(() => {
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

      const {
         storeName = 'SIIFMART',
         posReceiptLogo,
         posReceiptShowLogo = true,
         posReceiptHeader = 'SIIFMART RETAIL',
         posReceiptFooter = 'Thank you for shopping with us!',
         posReceiptAddress,
         posReceiptPhone,
         posReceiptEmail,
         posReceiptTaxId,
         posReceiptPolicy,
         posReceiptSocialHandle,
         posReceiptEnableQR = true,
         posReceiptQRLink = 'https://siifmart.com/feedback',
         posReceiptWidth = '80mm',
         posReceiptFont = 'sans-serif'
      } = settings;

      const saleSite = sites.find(s => s.id === selectedSale.siteId);
      const displayStoreName = storeName || saleSite?.name || 'SIIFMART';
      const is80mm = posReceiptWidth === '80mm';
      const paperWidth = is80mm ? '80mm' : '58mm';

      // Use named window to share printer preference with POSTerminal
      const printWindow = window.open('', 'ReceiptPrinterWindow', 'width=400,height=600');
      if (printWindow) {
         printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Receipt - ${selectedSale.receiptNumber || 'TX'}</title>
              <style>
                @page { size: ${paperWidth} auto; margin: 0; }
                body { 
                  font-family: ${posReceiptFont === 'monospace' ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'system-ui, -apple-system, sans-serif'}; 
                  width: ${paperWidth}; 
                  margin: 0; 
                  padding: 24px; /* p-6 = 1.5rem = 24px */
                  color: #000;
                  background: #fff;
                  -webkit-print-color-adjust: exact;
                  font-size: 10px; /* Default text-[10px] */
                }
                
                /* Utilities matching Tailwind */
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .justify-center { justify-content: center; }
                .gap-2 { gap: 8px; }
                .mb-1 { margin-bottom: 4px; }
                .mb-4 { margin-bottom: 16px; }
                .pb-4 { padding-bottom: 16px; }
                .py-3 { padding-top: 12px; padding-bottom: 12px; }
                .pt-2 { padding-top: 8px; }
                .mt-2 { margin-top: 8px; }
                .space-y-05 > * + * { margin-top: 2px; }
                .space-y-1 > * + * { margin-top: 4px; }
                .space-y-2 > * + * { margin-top: 8px; }
                
                /* Typography */
                .font-bold { font-weight: 700; }
                .font-black { font-weight: 900; }
                .uppercase { text-transform: uppercase; }
                .tracking-tighter { letter-spacing: -0.05em; }
                .tracking-widest { letter-spacing: 0.1em; }
                .italic { font-style: italic; }
                .leading-none { line-height: 1; }
                .leading-tight { line-height: 1.25; }
                
                /* Font Sizes */
                .text-[9px] { font-size: 9px; }
                .text-[10px] { font-size: 10px; }
                .text-xs { font-size: 12px; } /* Tailwind default, though JSX uses text-[10px] mostly */
                .text-base { font-size: 16px; }
                .text-xl { font-size: 20px; }
                
                /* Opacity */
                .opacity-60 { opacity: 0.6; }
                .opacity-70 { opacity: 0.7; }
                .opacity-80 { opacity: 0.8; }
                
                /* Borders */
                .border-b-2-dashed { border-bottom: 2px dashed rgba(0,0,0,0.1); }
                .border-y { border-top: 1px solid rgba(0,0,0,0.1); border-bottom: 1px solid rgba(0,0,0,0.1); }
                .border-t-black { border-top: 1px solid #000; }
                .border-t-dashed { border-top: 1px dashed rgba(0,0,0,0.1); }
                
                /* Images */
                .logo { max-height: 48px; object-fit: contain; margin: 0 auto; filter: grayscale(1); display: block; }
                
              </style>
            </head>
            <body>
              
                <!-- Logo -->
                ${posReceiptShowLogo && posReceiptLogo ? `
                  <div class="flex justify-center mb-4">
                    <img src="${posReceiptLogo}" class="logo" />
                  </div>
                ` : ''}

                <!-- Store Name -->
                <div class="text-center border-b-2-dashed pb-4 mb-4">
                  <h2 class="text-xl font-black uppercase tracking-tighter leading-none mb-1">${displayStoreName}</h2>
                  <p class="text-[10px] font-bold uppercase tracking-widest opacity-80">${posReceiptHeader}</p>
                </div>

                <!-- Address Info -->
                <div class="text-[10px] text-center space-y-05 mb-4 border-b-2-dashed pb-4">
                   ${posReceiptAddress ? `<p>${posReceiptAddress}</p>` : ''}
                   <div class="flex justify-center gap-2">
                      ${posReceiptPhone ? `<p>Tel: ${posReceiptPhone}</p>` : ''}
                      ${posReceiptEmail ? `<p>Email: ${posReceiptEmail}</p>` : ''}
                   </div>
                   ${posReceiptTaxId ? `<p class="font-bold">TIN: ${posReceiptTaxId}</p>` : ''}
                </div>

                <!-- Metadata -->
                <div class="text-[10px] space-y-1 mb-4">
                   <div class="flex justify-between">
                      <span class="opacity-60">DATE:</span>
                      <span>${formatDateTime(selectedSale.date, { showTime: true })}</span>
                   </div>
                   <div class="flex justify-between">
                      <span class="opacity-60">RECEIPT #:</span>
                      <span class="font-bold">${selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).toUpperCase()}`}</span>
                   </div>
                   <div class="flex justify-between">
                      <span class="opacity-60">CASHIER:</span>
                      <span>${selectedSale.cashierName || 'ADMINISTRATOR'}</span>
                   </div>
                   ${selectedSale.customerName ? `
                   <div class="flex justify-between">
                      <span class="opacity-60">CUSTOMER:</span>
                      <span>${selectedSale.customerName}</span>
                   </div>` : ''}
                </div>

                <!-- Items List (Using Flex instead of Table to match JSX structure) -->
                <div class="border-y py-3 mb-4 space-y-2">
                   ${selectedSale.items.map(item => `
                      <div class="flex justify-between text-[10px]">
                         <div>
                            <div class="font-bold">${item.name}</div>
                            <div class="text-[9px] opacity-60">${item.quantity} x ${CURRENCY_SYMBOL}${item.price.toFixed(2)}</div>
                         </div>
                         <div class="font-bold">{(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                   `).join('')}
                </div>

                <!-- Totals -->
                <div class="space-y-1 text-right mb-4">
                   <div class="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>${selectedSale.subtotal.toLocaleString()}</span></div>
                   
                   ${selectedSale.taxBreakdown ? selectedSale.taxBreakdown.map(rule => `
                     <div class="flex justify-between text-[10px] opacity-60">
                       <span>${rule.name} (${rule.rate}%)</span>
                       <span>${rule.amount.toLocaleString()}</span>
                     </div>
                   `).join('') : `
                     <div class="flex justify-between text-[10px] opacity-60">
                       <span>Tax</span>
                       <span>${selectedSale.tax.toLocaleString()}</span>
                     </div>
                   `}
                   
                   ${(selectedSale.subtotal + selectedSale.tax - selectedSale.total) > 0.01 ? `
                     <div class="flex justify-between text-[10px] opacity-60">
                       <span>Discount</span>
                       <span>-${(selectedSale.subtotal + selectedSale.tax - selectedSale.total).toLocaleString()}</span>
                     </div>
                   ` : ''}

                   <div class="flex justify-between font-black text-base border-t-black pt-2 mt-2">
                      <span>TOTAL</span>
                      <span>${CURRENCY_SYMBOL} ${selectedSale.total.toLocaleString()}</span>
                   </div>
                </div>
                
                <!-- Paid -->
                <div class="text-[10px] font-bold border-t-dashed pt-4 mb-4">
                   <div class="flex justify-between">
                      <span>PAID (${selectedSale.method.toUpperCase()})</span>
                      <span>${CURRENCY_SYMBOL} ${selectedSale.total.toLocaleString()}</span>
                   </div>
                </div>

                <!-- Footer -->
                <div class="text-center space-y-1 pt-4 border-t-dashed">
                   <p class="text-xs font-bold leading-tight mb-2">${posReceiptFooter}</p>
                   ${posReceiptSocialHandle ? `<p class="text-[10px] opacity-70 font-medium">${posReceiptSocialHandle}</p>` : ''}
                   ${posReceiptPolicy ? `<p class="text-[9px] italic opacity-60 leading-tight">${posReceiptPolicy}</p>` : ''}
                   
                   ${posReceiptEnableQR ? `
                     <div class="flex justify-center mt-4">
                        <img src="https://chart.googleapis.com/chart?cht=qr&chs=100x100&chl=${encodeURIComponent(posReceiptQRLink)}" style="width: 64px; height: 64px;" />
                     </div>
                   ` : ''}
                </div>

            </body>
            </html>
         `);
         printWindow.document.close();

         // Onload protection
         printWindow.onload = () => {
            printWindow.print();
         };
         // Fallback
         setTimeout(() => {
            if (!printWindow.closed) printWindow.print();
         }, 800);
      }
   };

   return (
      <div className="space-y-6">{/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-cyber-primary" />
                  Audit Console (Server-Side)
               </h2>
               <p className="text-gray-400 text-sm">Search, audit, and report on full transaction history.</p>
            </div>
            <div className="flex items-center gap-3">
               <Protected permission="EXPORT_SALES_DATA">
                  <button
                     onClick={handleExportCSV}
                     className="bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 px-4 py-2 rounded-lg text-sm hover:bg-cyber-primary/20 flex items-center transition-colors font-bold"
                  >
                     <Download className="w-4 h-4 mr-2" />
                     Export Page Data
                  </button>
               </Protected>
            </div>
         </div>

         {/* --- ANALYTICS RIBBON (PAGE LEVEL) --- */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-cyber-gray border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] text-gray-500 uppercase font-bold">Page Revenue</p>
               <p className="text-xl font-mono font-bold text-white mt-1">{CURRENCY_SYMBOL} {metrics.totalRev.toLocaleString()}</p>
            </div>
            <div className="bg-cyber-gray border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] text-gray-500 uppercase font-bold">Page Transactions</p>
               <p className="text-xl font-mono font-bold text-blue-400 mt-1">{metrics.txCount}</p>
            </div>
            <div className="bg-cyber-gray border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] text-gray-500 uppercase font-bold">Avg Basket (Page)</p>
               <p className="text-xl font-mono font-bold text-yellow-400 mt-1">{CURRENCY_SYMBOL} {metrics.avgTicket.toFixed(0)}</p>
            </div>
            <div className="bg-cyber-gray border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] text-gray-500 uppercase font-bold">Total History Size</p>
               <p className="text-xl font-mono font-bold text-green-400 mt-1">{totalCount.toLocaleString()}</p>
            </div>
         </div>

         {/* --- SMART TOOLBAR --- */}
         <div className="bg-cyber-gray border border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
               {/* Search */}
               <div className="flex items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 flex-1 focus-within:border-cyber-primary/50 transition-colors">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                     type="text"
                     placeholder="Search Receipt ID, Cashier Name..."
                     className="bg-transparent border-none ml-3 flex-1 text-white text-sm outline-none placeholder-gray-500"
                     value={searchTerm}
                     onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                     aria-label="Search transactions"
                  />
               </div>

               {/* Date Range */}
               <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                  <Calendar size={16} className="text-gray-400" />
                  <input
                     type="date"
                     className="bg-transparent border-none text-white text-xs outline-none focus:ring-0"
                     value={dateRange.start}
                     onChange={e => handleFilterChange(setDateRange, { ...dateRange, start: e.target.value })}
                     aria-label="Start Date"
                  />
                  <span className="text-gray-500 text-xs">to</span>
                  <input
                     type="date"
                     className="bg-transparent border-none text-white text-xs outline-none focus:ring-0"
                     value={dateRange.end}
                     onChange={e => handleFilterChange(setDateRange, { ...dateRange, end: e.target.value })}
                     aria-label="End Date"
                  />
               </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
               {/* Method Filter */}
               <div className="relative">
                  <select
                     className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/10"
                     value={methodFilter}
                     onChange={(e) => handleFilterChange(setMethodFilter, e.target.value)}
                     aria-label="Filter by Payment Method"
                  >
                     <option value="All">All Methods</option>
                     <option value="Cash">Cash</option>
                     <option value="Card">Card</option>
                     <option value="Mobile Money">Mobile Money</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
               </div>

               {/* Status Filter */}
               <div className="relative">
                  <select
                     className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/10"
                     value={statusFilter}
                     onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                     aria-label="Filter by Status"
                  >
                     <option value="All">All Statuses</option>
                     <option value="Completed">Completed</option>
                     <option value="Pending">Pending</option>
                     <option value="Refunded">Refunded</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
               </div>

               {/* Store Filter */}
               <div className="relative">
                  <select
                     className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/10"
                     value={storeFilter}
                     onChange={(e) => handleFilterChange(setStoreFilter, e.target.value)}
                     aria-label="Filter by Store"
                  >
                     <option value="All">All Stores</option>
                     {sites.map(site => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                     ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" />
               </div>
            </div>
         </div>

         {/* --- DATA GRID --- */}
         <div className="bg-cyber-gray border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
            <div className="overflow-x-auto flex-1 relative">
               {loading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
                     <Loader className="w-8 h-8 text-cyber-primary animate-spin" />
                  </div>
               )}
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-black/20 border-b border-white/5 text-[10px] uppercase tracking-wider font-bold text-gray-500">
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
                  <tbody className="divide-y divide-white/5">
                     {sales.map((sale) => (
                        <tr
                           key={sale.id}
                           onClick={() => { setSelectedSale(sale); setDetailTab('receipt'); }}
                           className="hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 <FileText size={14} className="text-gray-500" />
                                 <span className="text-sm font-mono text-white group-hover:text-cyber-primary transition-colors">{sale.receiptNumber || `S${sale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="text-xs text-white font-medium">{formatDateTime(sale.date, { useRelative: true })}</div>
                           </td>
                           <td className="p-4">
                              <span className="text-xs text-gray-300">
                                 {sites.find(s => s.id === sale.siteId)?.name || 'Unknown'}
                              </span>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-300">
                                    {sale.cashierName?.charAt(0) || '?'}
                                 </div>
                                 <span className="text-xs text-gray-300">{sale.cashierName || 'Unknown'}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                 <CreditCard size={12} /> {sale.method}
                              </span>
                           </td>
                           <td className="p-4 text-xs text-gray-400 text-right">{sale.items.length}</td>
                           <td className="p-4 text-sm font-mono text-white font-bold text-right">
                              {CURRENCY_SYMBOL} {sale.total.toLocaleString()}
                           </td>
                           <td className="p-4 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-[4px] text-[10px] font-bold uppercase border ${sale.status === 'Completed' ? 'text-green-400 bg-green-900/20 border-green-500/30' :
                                 sale.status === 'Pending' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30' :
                                    'text-red-400 bg-red-900/20 border-red-500/30'
                                 }`}>
                                 {sale.status}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
                           </td>
                        </tr>
                     ))}
                     {!loading && sales.length === 0 && (
                        <tr><td colSpan={9} className="p-12 text-center text-gray-500">No transactions found matching criteria.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-white/5 flex justify-between items-center bg-black/20">
               <p className="text-xs text-gray-500">
                  Showing <span className="text-white font-bold">{totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of {totalCount} entries
               </p>
               <div className="flex gap-2">
                  <button
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1 || loading}
                     className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 text-white"
                     aria-label="Previous Page"
                  >
                     <ChevronLeft size={16} />
                  </button>
                  <button
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage >= totalPages || totalPages === 0 || loading}
                     className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 text-white"
                     aria-label="Next Page"
                  >
                     <ChevronRight size={16} />
                  </button>
               </div>
            </div>
         </div>

         {/* --- TRANSACTION DEEP DIVE MODAL --- */}
         <Modal
            isOpen={!!selectedSale}
            onClose={() => setSelectedSale(null)}
            title={`Transaction Details`}
            size="lg"
         >
            {selectedSale && (
               <div className="flex flex-col h-[600px]">
                  {/* Modal Header Info */}
                  <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                     <div>
                        <h3 className="text-xl font-bold text-white font-mono">{selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}</h3>
                        <p className="text-xs text-gray-400 mt-1">{formatDateTime(selectedSale.date, { showTime: true })}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
                        <p className="text-2xl font-mono text-cyber-primary font-bold">{CURRENCY_SYMBOL} {selectedSale.total.toLocaleString()}</p>
                     </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-white/10 mb-4">
                     <button
                        onClick={() => setDetailTab('receipt')}
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${detailTab === 'receipt' ? 'border-cyber-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                     >
                        Digital Receipt
                     </button>
                     <button
                        onClick={() => setDetailTab('audit')}
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${detailTab === 'audit' ? 'border-cyber-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                     >
                        Audit Log
                     </button>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 rounded-xl border border-white/5 p-6">

                     {/* TAB 1: RECEIPT VIEW */}
                     {detailTab === 'receipt' && (
                        <div className={`max-w-sm mx-auto bg-white text-black p-6 rounded shadow-xl relative ${settings.posReceiptFont === 'monospace' ? 'font-mono' : 'font-sans'}`}>
                           {/* Logo */}
                           {settings.posReceiptShowLogo && settings.posReceiptLogo && (
                              <div className="flex justify-center mb-4">
                                 <img src={settings.posReceiptLogo} className="max-h-12 object-contain grayscale" alt="logo" />
                              </div>
                           )}

                           {/* Receipt Paper styling */}
                           <div className="text-center border-b-2 border-black/10 pb-4 border-dashed mb-4">
                              <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">
                                 {settings.storeName || sites.find(s => s.id === selectedSale.siteId)?.name || 'SIIFMART'}
                              </h2>
                              <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                                 {settings.posReceiptHeader || 'SIIFMART RETAIL'}
                              </p>
                           </div>

                           <div className="text-[10px] text-center space-y-0.5 mb-4 border-b-2 border-black/10 pb-4 border-dashed">
                              {settings.posReceiptAddress && <p>{settings.posReceiptAddress}</p>}
                              <div className="flex justify-center gap-2">
                                 {settings.posReceiptPhone && <p>Tel: {settings.posReceiptPhone}</p>}
                                 {settings.posReceiptEmail && <p>Email: {settings.posReceiptEmail}</p>}
                              </div>
                              {settings.posReceiptTaxId && <p className="font-bold">TIN: {settings.posReceiptTaxId}</p>}
                           </div>

                           <div className="text-[10px] space-y-1 mb-4">
                              <div className="flex justify-between">
                                 <span className="opacity-60">DATE:</span>
                                 <span>{formatDateTime(selectedSale.date, { showTime: true })}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="opacity-60">RECEIPT #:</span>
                                 <span className="font-bold">{selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).toUpperCase()}`}</span>
                              </div>
                           </div>

                           <div className="border-y border-black/10 py-3 mb-4 space-y-2">
                              {selectedSale.items.map((item, i) => (
                                 <div key={i} className="flex justify-between text-xs">
                                    <div>
                                       <div className="font-bold">{item.name}</div>
                                       <div className="text-[9px] opacity-60">{item.quantity} x {CURRENCY_SYMBOL}{item.price.toFixed(2)}</div>
                                    </div>
                                    <div className="font-bold">{(item.price * item.quantity).toLocaleString()}</div>
                                 </div>
                              ))}
                           </div>

                           <div className="space-y-1 text-right mb-4">
                              <div className="flex justify-between text-[10px] opacity-60"><span>Subtotal</span><span>{selectedSale.subtotal.toLocaleString()}</span></div>
                              <div className="flex justify-between text-[10px] opacity-60"><span>Tax ({settings.taxRate || 0}%)</span><span>{selectedSale.tax.toLocaleString()}</span></div>
                              <div className="flex justify-between font-black text-base border-t border-black pt-2 mt-2"><span>TOTAL</span><span>{CURRENCY_SYMBOL} {selectedSale.total.toLocaleString()}</span></div>
                           </div>

                           {/* Footer Section */}
                           <div className="text-center space-y-3 pt-4 border-t border-black/10 border-dashed">
                              <p className="text-xs font-bold leading-tight">{settings.posReceiptFooter || 'Thank you for shopping with us!'}</p>
                              {settings.posReceiptSocialHandle && <p className="text-[10px] opacity-70 font-medium">{settings.posReceiptSocialHandle}</p>}
                              {settings.posReceiptPolicy && <p className="text-[9px] italic opacity-60 leading-tight">{settings.posReceiptPolicy}</p>}
                           </div>
                        </div>
                     )}

                     {/* TAB 2: REAL AUDIT LOG (Filtered from StockMovements) */}
                     {detailTab === 'audit' && (
                        <div className="space-y-6 relative">
                           <div className="absolute left-3 top-2 bottom-2 w-px bg-white/10"></div>

                           {/* Header Event */}
                           <div className="flex gap-4 relative">
                              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 border border-green-500/50 flex items-center justify-center z-10 shrink-0"><CheckCircle size={14} /></div>
                              <div>
                                 <p className="text-sm text-white font-bold">Transaction Completed</p>
                                 <p className="text-xs text-gray-500">{formatDateTime(selectedSale.date, { showTime: true })}</p>
                                 <p className="text-xs text-gray-400 mt-1">Payment verified via {selectedSale.method} gateway.</p>
                              </div>
                           </div>

                           {/* Dynamic Movements */}
                           {auditLogs.length > 0 ? (
                              auditLogs.map(log => (
                                 <div key={log.id} className="flex gap-4 relative">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50 flex items-center justify-center z-10 shrink-0"><Shield size={14} /></div>
                                    <div>
                                       <p className="text-sm text-white font-bold">{log.type === 'OUT' ? 'Stock Deducted' : 'Stock Return'}</p>
                                       <p className="text-xs text-gray-500">{formatDateTime(log.date, { showTime: true })}</p>
                                       <div className="mt-2 bg-white/5 p-2 rounded text-[10px] font-mono text-gray-300">
                                          {log.type === 'OUT' ? '-' : '+'} {log.quantity} {log.productName} (ID: {log.productId})
                                       </div>
                                    </div>
                                 </div>
                              ))
                           ) : (
                              <div className="flex gap-4 relative">
                                 <div className="w-6 h-6 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/50 flex items-center justify-center z-10 shrink-0"><User size={14} /></div>
                                 <div>
                                    <p className="text-sm text-white font-bold">System Log</p>
                                    <p className="text-xs text-gray-500">No detailed movement logs found for this legacy transaction.</p>
                                 </div>
                              </div>
                           )}

                           {/* Footer Event */}
                           <div className="flex gap-4 relative">
                              <div className="w-6 h-6 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/50 flex items-center justify-center z-10 shrink-0"><User size={14} /></div>
                              <div>
                                 <p className="text-sm text-white font-bold">Session Active</p>
                                 <p className="text-xs text-gray-500">Cashier: {selectedSale.cashierName}</p>
                                 <p className="text-xs text-gray-400 mt-1">Terminal ID: POS-01</p>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                     <button
                        onClick={handleReprint}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-colors"
                     >
                        <Printer size={18} /> Reprint
                     </button>
                     <Protected permission="REFUND_SALE">
                        <button
                           onClick={() => {
                              addNotification('info', `Initiating Return Workflow for ${selectedSale.receiptNumber || selectedSale.id.substring(0, 12)}...`);
                              setSelectedSale(null);
                           }}
                           className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                           <RotateCcw size={18} /> Issue Return
                        </button>
                     </Protected>
                  </div>
               </div>
            )}
         </Modal>
      </div>
   );
}
