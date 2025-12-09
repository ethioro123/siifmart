
import React, { useState, useMemo } from 'react';
import {
   Search, Filter, Download, Calendar, ChevronRight,
   FileText, CheckCircle, XCircle, RotateCcw, Clock, Printer,
   ChevronLeft, ChevronDown, MoreHorizontal, CreditCard, User, Tag,
   ArrowUpRight, ArrowDownRight, Shield
} from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';
import { SaleRecord } from '../types';
import Modal from '../components/Modal';
import { useData } from '../contexts/DataContext';
import { Protected, ProtectedButton } from '../components/Protected';

// Pagination Config
const ITEMS_PER_PAGE = 10;

export default function SalesHistory() {
   const { allSales: sales, movements, sites, addNotification } = useData(); // Use allSales for admin view

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

   // --- MODAL STATE ---
   const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
   const [detailTab, setDetailTab] = useState<'receipt' | 'audit'>('receipt');

   // --- ADVANCED FILTERING LOGIC ---
   const filteredSales = useMemo(() => {
      return (sales || []).filter(sale => {
         // Validate date before processing
         if (!sale.date) return false;

         const saleDateTime = new Date(sale.date);
         if (isNaN(saleDateTime.getTime())) return false; // Invalid date

         const saleDate = saleDateTime.toISOString().split('T')[0];

         // 1. Text Search (Receipt Number, ID, Cashier, Customer)
         const matchesSearch =
            sale.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.cashierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

         // 2. Dropdown Filters
         const matchesStatus = statusFilter === 'All' || sale.status === statusFilter;
         const matchesMethod = methodFilter === 'All' || sale.method === methodFilter;
         const matchesStore = storeFilter === 'All' || sale.siteId === storeFilter;

         // 3. Date Range
         const matchesDate = saleDate >= dateRange.start && saleDate <= dateRange.end;

         return matchesSearch && matchesStatus && matchesMethod && matchesStore && matchesDate;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
   }, [sales, searchTerm, statusFilter, methodFilter, storeFilter, dateRange]);

   // --- PAGINATION LOGIC ---
   const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
   const paginatedSales = filteredSales.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
   );

   // --- AGGREGATE METRICS (Dynamic) ---
   const metrics = useMemo(() => {
      const totalRev = filteredSales.reduce((sum, s) => sum + (s.status !== 'Refunded' ? s.total : 0), 0);
      const txCount = filteredSales.length;
      const avgTicket = txCount > 0 ? totalRev / txCount : 0;
      const refundCount = filteredSales.filter(s => s.status === 'Refunded').length;

      return { totalRev, txCount, avgTicket, refundCount };
   }, [filteredSales]);

   // --- AUDIT LOG FILTER ---
   const auditLogs = useMemo(() => {
      if (!selectedSale) return [];
      return (movements || []).filter(m => m.reason?.includes(selectedSale.id)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   }, [selectedSale, movements]);

   // --- ACTIONS ---

   const handleExportCSV = () => {
      const headers = ['Receipt Number', 'Date', 'Time', 'Cashier', 'Customer', 'Items', 'Method', 'Total', 'Status', 'Site'];
      const rows = filteredSales.map(s => {
         const saleDate = new Date(s.date);
         const siteName = sites.find(site => site.id === s.siteId)?.name || 'Unknown';
         return [
            s.receiptNumber || `S${s.id.substring(0, 8).toUpperCase()}`,
            saleDate.toLocaleDateString(),
            saleDate.toLocaleTimeString(),
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
      const printWindow = window.open('', '', 'width=400,height=600');
      if (printWindow) {
         printWindow.document.write(`
            <html>
              <head><title>Receipt ${selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}</title></head>
              <body style="font-family:monospace; padding:20px;">
                <h2 style="text-align:center;">SIIFMART</h2>
                <p style="text-align:center;">Receipt #: ${selectedSale.receiptNumber || `S${selectedSale.id.substring(0, 8).replace(/-/g, '').toUpperCase()}`}</p>
                <p style="text-align:center;">${selectedSale.date}</p>
                <hr/>
                ${selectedSale.items.map(i => `<div style="display:flex; justify-content:space-between;"><span>${i.quantity} x ${i.name}</span><span>${i.price * i.quantity}</span></div>`).join('')}
                <hr/>
                <div style="display:flex; justify-content:space-between; font-weight:bold;"><span>TOTAL</span><span>${CURRENCY_SYMBOL} ${selectedSale.total}</span></div>
                <p style="text-align:center; margin-top:20px;">Thank You!</p>
              </body>
            </html>
          `);
         printWindow.document.close();
         printWindow.print();
      }
   };

   return (
      <div className="space-y-6">{/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-cyber-primary" />
                  Audit Console
               </h2>
               <p className="text-gray-400 text-sm">Search, audit, and report on transaction history.</p>
            </div>
            <div className="flex items-center gap-3">
               <Protected permission="EXPORT_SALES_DATA">
                  <button
                     onClick={handleExportCSV}
                     className="bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 px-4 py-2 rounded-lg text-sm hover:bg-cyber-primary/20 flex items-center transition-colors font-bold"
                  >
                     <Download className="w-4 h-4 mr-2" />
                     Export Filtered Data
                  </button>
               </Protected>
            </div>
         </div>

         {/* --- ANALYTICS RIBBON --- */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-cyber-gray border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] text-gray-500 uppercase font-bold">Period Revenue</p>
               <p className="text-xl font-mono font-bold text-white mt-1">{CURRENCY_SYMBOL} {metrics.totalRev.toLocaleString()}</p>
            </div>
            <div className="bg-cyber-gray border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] text-gray-500 uppercase font-bold">Transactions</p>
               <p className="text-xl font-mono font-bold text-blue-400 mt-1">{metrics.txCount}</p>
            </div>
            <div className="bg-cyber-gray border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] text-gray-500 uppercase font-bold">Avg Basket</p>
               <p className="text-xl font-mono font-bold text-yellow-400 mt-1">{CURRENCY_SYMBOL} {metrics.avgTicket.toFixed(0)}</p>
            </div>
            <div className="bg-cyber-gray border border-white/5 p-4 rounded-xl">
               <p className="text-[10px] text-gray-500 uppercase font-bold">Returns</p>
               <p className="text-xl font-mono font-bold text-red-400 mt-1">{metrics.refundCount}</p>
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
                     onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
                     onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                     aria-label="Start Date"
                  />
                  <span className="text-gray-500 text-xs">to</span>
                  <input
                     type="date"
                     className="bg-transparent border-none text-white text-xs outline-none focus:ring-0"
                     value={dateRange.end}
                     onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
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
                     onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
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
                     onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
                     onChange={(e) => { setStoreFilter(e.target.value); setCurrentPage(1); }}
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
            <div className="overflow-x-auto flex-1">
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
                     {paginatedSales.map((sale) => (
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
                              <div className="text-xs text-white font-medium">{sale.date.split(',')[0]}</div>
                              <div className="text-[10px] text-gray-500">{sale.date.split(',')[1]}</div>
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
                     {paginatedSales.length === 0 && (
                        <tr><td colSpan={9} className="p-12 text-center text-gray-500">No transactions found matching criteria.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-white/5 flex justify-between items-center bg-black/20">
               <p className="text-xs text-gray-500">
                  Showing <span className="text-white font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length)}</span> of {filteredSales.length} entries
               </p>
               <div className="flex gap-2">
                  <button
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1}
                     className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 text-white"
                     aria-label="Previous Page"
                  >
                     <ChevronLeft size={16} />
                  </button>
                  <button
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage === totalPages || totalPages === 0}
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
                        <p className="text-xs text-gray-400 mt-1">{selectedSale.date}</p>
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
                        <div className="max-w-sm mx-auto bg-white text-black p-6 rounded shadow-xl font-mono text-sm relative">
                           {/* Receipt Paper styling */}
                           <div className="text-center border-b-2 border-black/10 pb-4 border-dashed mb-4">
                              <h2 className="text-xl font-bold tracking-widest">SIIFMART</h2>
                              <p className="text-xs text-gray-600">Official Tax Invoice</p>
                           </div>
                           <div className="space-y-2 mb-4 border-b-2 border-black/10 pb-4 border-dashed">
                              {selectedSale.items.map((item, i) => (
                                 <div key={i} className="flex justify-between">
                                    <span>{item.quantity} x {item.name.substring(0, 18)}</span>
                                    <span>{(item.price * item.quantity).toLocaleString()}</span>
                                 </div>
                              ))}
                           </div>
                           <div className="space-y-1 text-right mb-4">
                              <div className="flex justify-between text-xs text-gray-600"><span>Subtotal</span><span>{selectedSale.subtotal.toLocaleString()}</span></div>
                              <div className="flex justify-between text-xs text-gray-600"><span>Tax (15%)</span><span>{selectedSale.tax.toLocaleString()}</span></div>
                              <div className="flex justify-between font-bold text-lg mt-2"><span>TOTAL</span><span>{CURRENCY_SYMBOL} {selectedSale.total.toLocaleString()}</span></div>
                           </div>
                           <div className="text-xs text-gray-500 text-center">
                              <p>Paid via {selectedSale.method}</p>
                              <p className="mt-1">Cashier: {selectedSale.cashierName}</p>
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
                                 <p className="text-xs text-gray-500">{selectedSale.date}</p>
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
                                       <p className="text-xs text-gray-500">{log.date}</p>
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
