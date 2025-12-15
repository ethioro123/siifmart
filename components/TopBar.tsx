
import React, { useState, useMemo } from 'react';
import { Menu, Search, Sun, Moon, Bell, X, AlertTriangle, CheckCircle, Info, MapPin, ChevronDown, Building, Store, Package, Users, ShoppingCart, FileText, LayoutDashboard } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TopBar() {
   const { user, toggleSidebar, theme, toggleTheme } = useStore();
   const { activeSite, sites, setActiveSite, notifications, markNotificationsRead, addNotification, employees, allProducts, customers, allOrders, allSales } = useData();
   const navigate = useNavigate();
   const location = useLocation();

   const [isNotifOpen, setIsNotifOpen] = useState(false);
   const [searchValue, setSearchValue] = useState('');
   const [isSearchOpen, setIsSearchOpen] = useState(false);

   if (!user) return null;

   // Global search results
   const searchResults = useMemo(() => {
      if (!searchValue.trim() || searchValue.length < 2) return null;

      const query = searchValue.toLowerCase();

      const products = (allProducts || [])
         .filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query) ||
            p.barcode?.toLowerCase().includes(query)
         )
         .slice(0, 5);

      const customerResults = (customers || [])
         .filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query) ||
            c.phone?.toLowerCase().includes(query)
         )
         .slice(0, 5);

      const orders = (allOrders || [])
         .filter(o =>
            o.poNumber?.toLowerCase().includes(query) ||
            o.po_number?.toLowerCase().includes(query) ||
            o.id.toLowerCase().includes(query)
         )
         .slice(0, 5);

      const sales = (allSales || [])
         .filter(s =>
            s.receiptNumber?.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query)
         )
         .slice(0, 5);

      const employeeResults = (employees || [])
         .filter(e =>
            e.name.toLowerCase().includes(query) ||
            e.email?.toLowerCase().includes(query)
         )
         .slice(0, 5);

      return {
         products,
         customers: customerResults,
         orders,
         sales,
         employees: employeeResults,
         total: products.length + customerResults.length + orders.length + sales.length + employeeResults.length
      };
   }, [searchValue, allProducts, customers, allOrders, allSales, employees]);

   const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchValue.trim() && searchResults && searchResults.total > 0) {
         setIsSearchOpen(true);
      }
   };

   const handleResultClick = (type: string, id: string) => {
      setIsSearchOpen(false);
      setSearchValue('');

      switch (type) {
         case 'product':
            navigate('/inventory');
            break;
         case 'customer':
            navigate('/customers');
            break;
         case 'order':
            navigate('/procurement');
            break;
         case 'sale':
            navigate('/sales-history');
            break;
         case 'employee':
            navigate('/employees');
            break;
      }
   };

   const handleMarkAllRead = () => {
      markNotificationsRead();
      setIsNotifOpen(false);
   };

   return (
      <header className="h-16 bg-cyber-dark/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 px-6 flex items-center justify-between">
         <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="text-gray-400 hover:text-white" aria-label="Toggle sidebar">
               <Menu size={24} />
            </button>
            <div className="relative hidden md:block">
               <form onSubmit={handleSearch} className="flex items-center bg-cyber-gray rounded-full px-4 py-1.5 border border-white/5 focus-within:border-cyber-primary/50 transition-colors">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                     type="text"
                     placeholder="Global Search..."
                     className="bg-transparent border-none focus:ring-0 text-sm text-white ml-2 w-64 placeholder-gray-500 outline-none"
                     value={searchValue}
                     onChange={(e) => {
                        setSearchValue(e.target.value);
                        if (e.target.value.length >= 2) setIsSearchOpen(true);
                        else setIsSearchOpen(false);
                     }}
                     onFocus={() => searchValue.length >= 2 && setIsSearchOpen(true)}
                  />
               </form>

               {/* Search Results Dropdown */}
               {isSearchOpen && searchResults && searchResults.total > 0 && (
                  <>
                     <div className="fixed inset-0 z-30" onClick={() => setIsSearchOpen(false)} />
                     <div className="absolute left-0 mt-2 w-96 bg-cyber-gray border border-white/10 rounded-xl shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 overflow-hidden max-h-[500px] overflow-y-auto">
                        <div className="p-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
                           <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Search Results ({searchResults.total})
                           </h4>
                           <button onClick={() => setIsSearchOpen(false)} className="text-gray-500 hover:text-white" aria-label="Close search">
                              <X size={14} />
                           </button>
                        </div>

                        {/* Products */}
                        {searchResults.products.length > 0 && (
                           <div className="border-b border-white/5">
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <Package size={10} /> Products ({searchResults.products.length})
                                 </p>
                              </div>
                              {searchResults.products.map(p => (
                                 <button
                                    key={p.id}
                                    onClick={() => handleResultClick('product', p.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <Package size={16} className="text-green-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{p.name}</p>
                                       <p className="text-[10px] text-gray-500">{p.sku} • Stock: {p.stock}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}

                        {/* Orders */}
                        {searchResults.orders.length > 0 && (
                           <div className="border-b border-white/5">
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <FileText size={10} /> Purchase Orders ({searchResults.orders.length})
                                 </p>
                              </div>
                              {searchResults.orders.map(o => (
                                 <button
                                    key={o.id}
                                    onClick={() => handleResultClick('order', o.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <FileText size={16} className="text-blue-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{o.poNumber || o.po_number}</p>
                                       <p className="text-[10px] text-gray-500">{o.status} • {o.supplier}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}

                        {/* Sales */}
                        {searchResults.sales.length > 0 && (
                           <div className="border-b border-white/5">
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <ShoppingCart size={10} /> Sales ({searchResults.sales.length})
                                 </p>
                              </div>
                              {searchResults.sales.map(s => (
                                 <button
                                    key={s.id}
                                    onClick={() => handleResultClick('sale', s.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <ShoppingCart size={16} className="text-purple-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{s.receiptNumber || s.id.substring(0, 8)}</p>
                                       <p className="text-[10px] text-gray-500">${s.total} • {s.date}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}

                        {/* Customers */}
                        {searchResults.customers.length > 0 && (
                           <div className="border-b border-white/5">
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <Users size={10} /> Customers ({searchResults.customers.length})
                                 </p>
                              </div>
                              {searchResults.customers.map(c => (
                                 <button
                                    key={c.id}
                                    onClick={() => handleResultClick('customer', c.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <Users size={16} className="text-cyan-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{c.name}</p>
                                       <p className="text-[10px] text-gray-500">{c.email || c.phone}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}

                        {/* Employees */}
                        {searchResults.employees.length > 0 && (
                           <div>
                              <div className="px-3 py-2 bg-black/10">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                    <Users size={10} /> Employees ({searchResults.employees.length})
                                 </p>
                              </div>
                              {searchResults.employees.map(e => (
                                 <button
                                    key={e.id}
                                    onClick={() => handleResultClick('employee', e.id)}
                                    className="w-full p-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-left border-b border-white/5 last:border-0"
                                 >
                                    <Users size={16} className="text-yellow-400" />
                                    <div className="flex-1">
                                       <p className="text-sm font-bold text-white">{e.name}</p>
                                       <p className="text-[10px] text-gray-500">{e.role} • {e.email}</p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  </>
               )}
            </div>

            {/* LOCATION BADGE (Moved from Right Side) */}
            {(() => {
               // Find current user's employee record
               let currentEmployee = null;

               if (user && employees.length > 0) {
                  if (user.employeeId) {
                     currentEmployee = employees.find(emp => emp.id === user.employeeId);
                  }
                  if (!currentEmployee && user.id) {
                     currentEmployee = employees.find(emp => emp.id === user.id);
                  }
                  if (!currentEmployee && user.name) {
                     currentEmployee = employees.find(emp =>
                        emp.name.toLowerCase() === user.name.toLowerCase()
                     );
                  }
               }

               const employeeSite = currentEmployee
                  ? sites.find(s => s.id === currentEmployee.siteId || s.id === currentEmployee.site_id)
                  : null;

               const siteId = currentEmployee
                  ? (currentEmployee.siteId || currentEmployee.site_id)
                  : user?.siteId;

               const finalSite = employeeSite || (siteId ? sites.find(s => s.id === siteId) : null);
               const displaySite = activeSite || finalSite;
               const locationName = displaySite?.name || 'Administration';
               const siteType = displaySite?.type;

               if (!locationName) return null;

               const isWarehouse = siteType === 'Warehouse' || siteType === 'Distribution Center';

               // User sees static badge indicating current location context
               return (
                  <div className={`flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full border mx-auto md:mx-0 ${isWarehouse
                     ? 'bg-blue-900/20 border-blue-500/30 text-blue-400'
                     : 'bg-green-900/20 border-green-500/30 text-green-400'
                     }`}>
                     {isWarehouse ? <Building size={14} /> : <Store size={14} />}
                     <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide whitespace-nowrap truncate max-w-[100px] md:max-w-none">
                        {locationName}
                     </span>
                     {displaySite?.code && (
                        <div className={`ml-1 md:ml-2 flex items-center gap-1 md:gap-1.5 pl-2 border-l ${isWarehouse ? 'border-blue-500/30' : 'border-green-500/30'}`}>
                           <span className="hidden sm:inline text-[10px] text-gray-500 font-bold uppercase tracking-wider">ID</span>
                           <span className={`font-mono text-[10px] md:text-xs font-bold tracking-widest ${isWarehouse ? 'text-blue-200' : 'text-green-200'} shadow-sm`}>
                              {displaySite.code}
                           </span>
                        </div>
                     )}
                  </div>
               );
            })()}
         </div>

         <div className="flex items-center space-x-4">
            {/* USER INFO */}
            {/* USER INFO */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-white/5 to-transparent border border-white/10 hover:border-cyber-primary/50 transition-all duration-300 group cursor-pointer hover:shadow-[0_0_15px_rgba(0,255,157,0.1)]">
               <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyber-primary to-blue-600 flex items-center justify-center text-black font-black text-sm shadow-lg group-hover:scale-105 transition-transform">
                     {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse"></div>
               </div>

               <div className="flex flex-col">
                  <span className="text-sm font-bold text-white leading-none group-hover:text-cyber-primary transition-colors">{user.name}</span>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mt-0.5 leading-none">{user.role}</span>
               </div>

               <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors group-hover:rotate-180 duration-300" />
            </div>

            <button
               onClick={toggleTheme}
               className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
               title="Toggle Theme"
            >
               {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>



            {/* NOTIFICATIONS */}
            <div className="relative">
               <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`relative text-gray-400 hover:text-white transition-colors p-2 rounded-full ${isNotifOpen ? 'bg-white/10 text-white' : ''}`}
               >
                  <Bell className="w-6 h-6" />
                  {notifications.length > 0 && (
                     <span className="absolute top-2 right-2 w-2 h-2 bg-cyber-primary rounded-full"></span>
                  )}
               </button>

               {isNotifOpen && (
                  <>
                     <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                     <div className="absolute right-0 mt-2 w-80 bg-cyber-gray border border-white/10 rounded-xl shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                        <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                           <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                           <button onClick={() => setIsNotifOpen(false)} className="text-gray-500 hover:text-white" aria-label="Close notifications"><X size={14} /></button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                           {notifications.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-xs">No new alerts</div>
                           ) : (
                              notifications.map(notif => (
                                 <div key={notif.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 items-start">
                                    <div className={`mt-0.5 ${notif.type === 'alert' ? 'text-red-400' : notif.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                                       {notif.type === 'alert' ? <AlertTriangle size={16} /> : notif.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
                                    </div>
                                    <div>
                                       <p className="text-sm text-gray-200">{notif.message}</p>
                                       <p className="text-[10px] text-gray-500 mt-1">{notif.timestamp}</p>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                        {notifications.length > 0 && (
                           <div className="p-2 text-center border-t border-white/5 bg-black/20">
                              <button
                                 onClick={handleMarkAllRead}
                                 className="text-xs text-cyber-primary hover:underline"
                              >
                                 Mark All Read
                              </button>
                           </div>
                        )}
                     </div>
                  </>
               )}
            </div>
         </div>
      </header>
   );
}
