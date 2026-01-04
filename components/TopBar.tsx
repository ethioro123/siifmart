
import React, { useState, useMemo } from 'react';
import { Menu, Search, Sun, Moon, Bell, X, AlertTriangle, CheckCircle, Info, MapPin, ChevronDown, Building, Store, Package, Users, ShoppingCart, FileText, LayoutDashboard, LogOut, User, Crown, Zap, Trophy, TrendingUp, ClipboardCheck, Clock, Play, Check, Plus, Send, UserPlus, Trash2 } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { tasksService } from '../services/supabase.service';
import { formatRole } from '../utils/formatting';

export default function TopBar() {
   const { user, toggleSidebar, theme, toggleTheme, logout } = useStore();
   const { language, setLanguage } = useLanguage();
   const {
      activeSite, sites, setActiveSite, notifications, markNotificationsRead,
      addNotification, clearNotification, clearAllNotifications, employees, allProducts, customers, allOrders, allSales,
      workerPoints, getWorkerPoints, tasks, setTasks
   } = useData();
   const navigate = useNavigate();
   const location = useLocation();

   const [isNotifOpen, setIsNotifOpen] = useState(false);
   const [notifTab, setNotifTab] = useState<'notifications' | 'tasks'>('notifications');
   const [searchValue, setSearchValue] = useState('');
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
   const [showQuickAssign, setShowQuickAssign] = useState(false);
   const [quickTaskTitle, setQuickTaskTitle] = useState('');
   const [quickTaskPriority, setQuickTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
   const [quickTaskAssignee, setQuickTaskAssignee] = useState('');
   const dropdownRef = React.useRef<HTMLDivElement>(null);
   const notifRef = React.useRef<HTMLDivElement>(null);

   React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
         }
         if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
            setIsNotifOpen(false);
         }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   // Helper for relative time
   const timeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y ago";

      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo ago";

      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d ago";

      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h ago";

      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m ago";

      return Math.floor(seconds) + "s ago";
   };

   const handleClearAll = (e: React.MouseEvent) => {
      e.stopPropagation();
      clearAllNotifications();
      addNotification('success', 'All notifications cleared');
   };

   const handleClearSingle = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      clearNotification(id);
   };

   // ... (keeping return statement until Notifications section)

   // ... (keeping existing useEffects and memos)

   // Calculate points for current user (mirrors Fulfillment.tsx logic)
   const currentUserPoints = useMemo(() => {
      if (!user) return null;

      // Try to find matching employee
      const employee = employees.find(e => e.name === user.name || e.id === user.id);

      if (employee) {
         const points = getWorkerPoints(employee.id);
         if (points) return points;
      }

      // Fallback or Admin dummy
      return {
         totalPoints: 0,
         weeklyPoints: 0,
         rank: '-',
         level: 1,
         levelTitle: 'Rookie'
      } as any;
   }, [user, employees, getWorkerPoints, workerPoints]);

   // Find current employee for task filtering
   const currentEmployee = useMemo(() => {
      if (!user || employees.length === 0) return null;
      return employees.find(emp =>
         emp.id === (user as any).employeeId ||
         emp.id === user.id ||
         emp.name.toLowerCase() === user.name.toLowerCase()
      ) || null;
   }, [user, employees]);

   // Filter tasks for current user - both assigned to them AND created by them
   const { myTasks, tasksAssignedToMe, tasksICreated } = useMemo(() => {
      if (!currentEmployee && !user) return { myTasks: [], tasksAssignedToMe: [], tasksICreated: [] };

      const userId = currentEmployee?.id || user?.id || '';
      const userName = currentEmployee?.name || user?.name || '';

      // Tasks assigned to me (not completed)
      const assignedToMe = tasks.filter(t =>
         (t.assignedTo === userId || t.assignedTo === userName) &&
         t.status !== 'Completed'
      );

      // Tasks I created (not completed, and not assigned to myself)
      const createdByMe = tasks.filter(t =>
         (t.createdBy === userId || t.createdBy === userName) &&
         t.assignedTo !== userId && t.assignedTo !== userName &&
         t.status !== 'Completed'
      );

      // Combined unique tasks
      const allMyTasks = [...assignedToMe, ...createdByMe];

      return { myTasks: allMyTasks, tasksAssignedToMe: assignedToMe, tasksICreated: createdByMe };
   }, [tasks, currentEmployee, user]);

   // Restricted employee list for Managers (Quick Assign)
   const visibleEmployees = useMemo(() => {
      if (!user) return [];
      // CEOs see everyone
      if (user.role === 'super_admin') return employees;

      // Other managers see only their site's employees
      const userSiteId = currentEmployee?.siteId || currentEmployee?.site_id || user.siteId;
      if (!userSiteId) return employees; // Fallback if no site found

      return employees.filter(emp =>
         emp.siteId === userSiteId || emp.site_id === userSiteId
      );
   }, [user, currentEmployee, employees]);

   // Combined badge count
   const totalAlerts = notifications.length + myTasks.length;

   // Handle task status change
   const handleTaskStatusChange = async (taskId: string, newStatus: 'Pending' | 'In-Progress' | 'Completed') => {
      try {
         const updated = await tasksService.update(taskId, { status: newStatus });
         if (updated) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
            addNotification('success', `Task ${newStatus === 'Completed' ? 'completed' : 'updated'}!`);
         }
      } catch (error) {
         console.error('Failed to update task:', error);
         addNotification('alert', 'Failed to update task');
      }
   };

   // Handle quick task creation
   const handleQuickAssign = async () => {
      if (!quickTaskTitle.trim() || !quickTaskAssignee) {
         addNotification('alert', 'Please enter task title and select an assignee');
         return;
      }

      try {
         const creatorId = currentEmployee?.id || user?.id || user?.name || '';
         const newTask = await tasksService.create({
            title: quickTaskTitle.trim(),
            description: '',
            assignedTo: quickTaskAssignee,
            status: 'Pending',
            priority: quickTaskPriority,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            createdBy: creatorId
         });

         if (newTask) {
            setTasks([...tasks, newTask]);
            const assigneeName = employees.find(e => e.id === quickTaskAssignee)?.name || quickTaskAssignee;
            addNotification('success', `Task assigned to ${assigneeName}!`);
            setQuickTaskTitle('');
            setQuickTaskAssignee('');
            setQuickTaskPriority('Medium');
            setShowQuickAssign(false);
         }
      } catch (error) {
         console.error('Failed to create task:', error);
         addNotification('alert', 'Failed to create task');
      }
   };

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
      <header className="h-16 bg-cyber-dark/30 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between">
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
                                       <p className="text-[10px] text-gray-500">{o.status} • {o.supplierName}</p>
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
                                       <p className="text-sm font-bold text-white">{s.receiptNumber || `SALE-${s.id.substring(0, 8).toUpperCase()}`}</p>
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
            {/* USER INFO & DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
               <div
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 cursor-pointer hover:shadow-[0_0_15px_rgba(0,255,157,0.1)] ${isUserMenuOpen ? 'bg-white/10 border-cyber-primary/50' : 'bg-gradient-to-r from-white/5 to-transparent border-white/10 hover:border-cyber-primary/50'}`}
               >
                  <div className="relative">
                     <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyber-primary to-blue-600 flex items-center justify-center text-black font-black text-sm shadow-lg group-hover:scale-105 transition-transform overflow-hidden border border-white/20">
                        {user.avatar ? (
                           <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 e.currentTarget.parentElement!.innerHTML = user.name.charAt(0).toUpperCase();
                              }}
                           />
                        ) : (
                           user.name.charAt(0).toUpperCase()
                        )}
                     </div>
                     <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse"></div>
                  </div>

                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-white leading-none group-hover:text-cyber-primary transition-colors">{user.name}</span>
                     <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mt-0.5 leading-none">{formatRole(user.role)}</span>
                  </div>

                  <ChevronDown size={14} className={`text-gray-500 transition-colors duration-300 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} />
               </div>

               {/* Dropdown Menu */}
               {isUserMenuOpen && (
                  <>
                     <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
                     <div
                        className="absolute right-0 mt-2 w-56 bg-cyber-gray border border-white/10 rounded-xl shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 overflow-hidden"
                        onClick={() => setIsUserMenuOpen(false)}
                     >
                        <div className="p-4 border-b border-white/5 bg-black/20" onClick={(e) => e.stopPropagation()}>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                           <p className="text-sm font-bold text-white truncate">{user.name}</p>
                           <p className="text-[10px] font-mono text-cyber-primary uppercase mb-3">{formatRole(user.role)}</p>

                           {/* Performance Highlights */}
                           {currentUserPoints && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                 <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                       <Trophy size={10} className="text-yellow-400" />
                                       <span className="text-[9px] font-bold text-gray-400 uppercase">Points</span>
                                    </div>
                                    <p className="text-sm font-black text-white">{currentUserPoints.totalPoints?.toLocaleString() || 0}</p>
                                 </div>
                                 <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                       <TrendingUp size={10} className="text-cyber-primary" />
                                       <span className="text-[9px] font-bold text-gray-400 uppercase">Rank</span>
                                    </div>
                                    <p className="text-sm font-black text-white">#{currentUserPoints.rank || '-'}</p>
                                 </div>
                                 <div className="col-span-2 bg-gradient-to-r from-cyber-primary/10 to-transparent rounded-lg p-2 border border-cyber-primary/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                       <div className="w-6 h-6 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary">
                                          <Zap size={12} fill="currentColor" />
                                       </div>
                                       <div>
                                          <p className="text-[9px] font-bold text-cyber-primary uppercase leading-none">Level {currentUserPoints.level || 1}</p>
                                          <p className="text-[10px] font-black text-white leading-tight">{currentUserPoints.levelTitle || 'Rookie'}</p>
                                       </div>
                                    </div>
                                    <Crown size={14} className="text-yellow-400 opacity-50" />
                                 </div>
                              </div>
                           )}
                        </div>

                        <div className="p-2">
                           <button
                              onClick={() => { navigate('/profile'); setIsUserMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                           >
                              <User size={16} />
                              <span>My Profile</span>
                           </button>

                           {user.role === 'super_admin' && (
                              <button
                                 onClick={() => { navigate('/location-select'); setIsUserMenuOpen(false); }}
                                 className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              >
                                 <MapPin size={16} />
                                 <span>Switch Location</span>
                              </button>
                           )}

                           {/* Language Switcher */}
                           <div className="mt-2 px-3 py-2 border-t border-white/5">
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Display Language</p>
                              <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1.5 border border-white/5 hover:border-cyber-primary/30 transition-all">
                                 <Globe size={14} className="text-gray-400" />
                                 <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value as any)}
                                    className="bg-transparent text-white text-xs outline-none border-none flex-1 cursor-pointer font-bold"
                                    title="Select Language"
                                 >
                                    <option value="en" className="bg-gray-800">English</option>
                                    <option value="am" className="bg-gray-800">Amharic (አማርኛ)</option>
                                    <option value="or" className="bg-gray-800">Oromo (Afaan Oromoo)</option>
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div className="p-2 border-t border-white/5">
                           <button
                              onClick={() => { logout(); setIsUserMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                           >
                              <LogOut size={16} />
                              <span>Sign Out</span>
                           </button>
                        </div>
                     </div>
                  </>
               )}
            </div>

            <button
               onClick={toggleTheme}
               className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
               title="Toggle Theme"
            >
               {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>


            {/* NOTIFICATIONS + TASKS INTEGRATED */}
            <div className="relative" ref={notifRef}>
               <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`relative text-gray-400 hover:text-white transition-colors p-2 rounded-full ${isNotifOpen ? 'bg-white/10 text-white' : ''}`}
               >
                  <Bell className="w-6 h-6" />
                  {totalAlerts > 0 && (
                     <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-cyber-primary text-black text-[10px] font-bold rounded-full px-1">
                        {totalAlerts > 9 ? '9+' : totalAlerts}
                     </span>
                  )}
               </button>

               {isNotifOpen && (
                  <>
                     <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                     <div
                        className="absolute right-0 mt-2 w-96 bg-cyber-gray border border-white/10 rounded-xl shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                     >
                        {/* Header with Tabs */}
                        <div className="p-3 border-b border-white/5 bg-black/20">
                           <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Activity Center</h4>
                              <button onClick={() => setIsNotifOpen(false)} className="text-gray-500 hover:text-white" aria-label="Close">
                                 <X size={14} />
                              </button>
                           </div>
                           <div className="flex gap-1 bg-black/30 p-1 rounded-lg">
                              <button
                                 onClick={() => setNotifTab('notifications')}
                                 className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all ${notifTab === 'notifications'
                                    ? 'bg-cyber-primary/20 text-cyber-primary'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                              >
                                 <Bell size={12} />
                                 Alerts
                                 {notifications.length > 0 && (
                                    <span className="ml-1 bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full text-[10px]">
                                       {notifications.length}
                                    </span>
                                 )}
                              </button>
                              <button
                                 onClick={() => setNotifTab('tasks')}
                                 className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-bold transition-all ${notifTab === 'tasks'
                                    ? 'bg-cyber-primary/20 text-cyber-primary'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                              >
                                 <ClipboardCheck size={12} />
                                 My Tasks
                                 {myTasks.length > 0 && (
                                    <span className="ml-1 bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full text-[10px]">
                                       {myTasks.length}
                                    </span>
                                 )}
                              </button>
                           </div>
                        </div>

                        {/* Content Area */}
                        <div className="max-h-80 overflow-y-auto">
                           {/* NOTIFICATIONS TAB */}
                           {notifTab === 'notifications' && (
                              <>
                                 {notifications.length === 0 ? (
                                    <div className="p-6 text-center">
                                       <Bell size={32} className="mx-auto text-gray-600 mb-2" />
                                       <p className="text-gray-500 text-xs">No new alerts</p>
                                    </div>
                                 ) : (
                                    <>
                                       {/* Clear All Header */}
                                       <div className="px-3 py-2 border-b border-white/5 flex justify-end">
                                          <button
                                             onClick={handleClearAll}
                                             className="text-[10px] text-gray-400 hover:text-red-400 uppercase font-bold transition-colors flex items-center gap-1"
                                          >
                                             <Trash2 size={10} /> Clear All
                                          </button>
                                       </div>

                                       {notifications.map(notif => (
                                          <div key={notif.id} className="group p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 items-start relative">
                                             <div className={`mt-0.5 ${notif.type === 'alert' ? 'text-red-400' : notif.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                                                {notif.type === 'alert' ? <AlertTriangle size={16} /> : notif.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
                                             </div>
                                             <div className="flex-1 pr-4">
                                                <p className="text-sm text-gray-200">{notif.message}</p>
                                                <p className="text-[10px] text-gray-500 mt-1 font-mono">{timeAgo(notif.timestamp)}</p>
                                             </div>
                                             <button
                                                onClick={(e) => handleClearSingle(e, notif.id)}
                                                className="absolute top-2 right-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                title="Clear"
                                             >
                                                <X size={12} />
                                             </button>
                                          </div>
                                       ))}
                                    </>
                                 )}
                              </>
                           )}

                           {/* MY TASKS TAB */}
                           {notifTab === 'tasks' && (
                              <>
                                 {myTasks.length === 0 ? (
                                    <div className="p-6 text-center">
                                       <ClipboardCheck size={32} className="mx-auto text-gray-600 mb-2" />
                                       <p className="text-gray-500 text-xs">No active tasks</p>
                                    </div>
                                 ) : (
                                    <>
                                       {/* Tasks Assigned to Me */}
                                       {tasksAssignedToMe.length > 0 && (
                                          <div>
                                             <div className="px-3 py-1.5 bg-black/30 border-b border-white/5">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                                   📥 Assigned to Me ({tasksAssignedToMe.length})
                                                </p>
                                             </div>
                                             {tasksAssignedToMe.map(task => (
                                                <div key={task.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                                                   <div className="flex items-start gap-3">
                                                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'High' ? 'bg-red-400' :
                                                         task.priority === 'Medium' ? 'bg-yellow-400' : 'bg-gray-400'
                                                         }`} />
                                                      <div className="flex-1 min-w-0">
                                                         <p className="text-sm font-medium text-white truncate">{task.title}</p>
                                                         <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${task.status === 'Pending' ? 'bg-gray-500/20 text-gray-400' :
                                                               task.status === 'In-Progress' ? 'bg-blue-500/20 text-blue-400' :
                                                                  'bg-green-500/20 text-green-400'
                                                               }`}>
                                                               {task.status}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                               <Clock size={10} />
                                                               {new Date(task.dueDate).toLocaleDateString()}
                                                            </span>
                                                         </div>
                                                      </div>
                                                      {/* Quick Actions */}
                                                      <div className="flex gap-1">
                                                         {task.status === 'Pending' && (
                                                            <>
                                                               <button
                                                                  onClick={() => handleTaskStatusChange(task.id, 'In-Progress')}
                                                                  className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                                                  title="Start Task"
                                                               >
                                                                  <Play size={12} />
                                                               </button>
                                                               <button
                                                                  onClick={() => handleTaskStatusChange(task.id, 'Completed')}
                                                                  className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                                                  title="Complete Immediately"
                                                               >
                                                                  <Check size={12} />
                                                               </button>
                                                            </>
                                                         )}
                                                         {task.status === 'In-Progress' && (
                                                            <button
                                                               onClick={() => handleTaskStatusChange(task.id, 'Completed')}
                                                               className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                                               title="Complete Task"
                                                            >
                                                               <Check size={12} />
                                                            </button>
                                                         )}
                                                      </div>
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       )}

                                       {/* Tasks I Created / Delegated */}
                                       {tasksICreated.length > 0 && (
                                          <div>
                                             <div className="px-3 py-1.5 bg-black/30 border-b border-white/5">
                                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                                                   📤 Delegated by Me ({tasksICreated.length})
                                                </p>
                                             </div>
                                             {tasksICreated.map(task => (
                                                <div key={task.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                                                   <div className="flex items-start gap-3">
                                                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'High' ? 'bg-red-400' :
                                                         task.priority === 'Medium' ? 'bg-yellow-400' : 'bg-gray-400'
                                                         }`} />
                                                      <div className="flex-1 min-w-0">
                                                         <p className="text-sm font-medium text-white truncate">{task.title}</p>
                                                         <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${task.status === 'Pending' ? 'bg-gray-500/20 text-gray-400' :
                                                               task.status === 'In-Progress' ? 'bg-blue-500/20 text-blue-400' :
                                                                  'bg-green-500/20 text-green-400'
                                                               }`}>
                                                               {task.status}
                                                            </span>
                                                            <span className="text-[10px] text-purple-400">
                                                               → {task.assignedTo}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                               <Clock size={10} />
                                                               {new Date(task.dueDate).toLocaleDateString()}
                                                            </span>
                                                         </div>
                                                      </div>
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       )}
                                    </>
                                 )}
                              </>
                           )}
                        </div>

                        {/* Footer Actions */}
                        {notifTab === 'notifications' && notifications.length > 0 && (
                           <div className="p-2 text-center border-t border-white/5 bg-black/20">
                              <button
                                 onClick={handleMarkAllRead}
                                 className="text-xs text-cyber-primary hover:underline"
                              >
                                 Mark All Read
                              </button>
                           </div>
                        )}

                        {/* Quick Assign Task - Tasks Tab Footer */}
                        {notifTab === 'tasks' && (
                           <div className="border-t border-white/5 bg-black/30">
                              {!showQuickAssign ? (
                                 <button
                                    onClick={() => setShowQuickAssign(true)}
                                    className="w-full p-3 flex items-center justify-center gap-2 text-xs font-bold text-cyber-primary hover:bg-cyber-primary/10 transition-colors"
                                 >
                                    <Plus size={14} />
                                    Quick Assign Task
                                 </button>
                              ) : (
                                 <div className="p-3 space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                       <UserPlus size={14} className="text-cyber-primary" />
                                       <span className="text-xs font-bold text-white">Assign New Task</span>
                                       <button
                                          onClick={() => setShowQuickAssign(false)}
                                          className="ml-auto p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                          title="Close"
                                       >
                                          <X size={12} />
                                       </button>
                                    </div>
                                    <input
                                       value={quickTaskTitle}
                                       onChange={(e) => setQuickTaskTitle(e.target.value)}
                                       placeholder="Task title..."
                                       className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyber-primary"
                                    />
                                    <div className="flex gap-2">
                                       <select
                                          value={quickTaskPriority}
                                          onChange={(e) => setQuickTaskPriority(e.target.value as any)}
                                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-cyber-primary"
                                          title="Priority"
                                       >
                                          <option value="High">🔴 High</option>
                                          <option value="Medium">🟡 Medium</option>
                                          <option value="Low">🔵 Low</option>
                                       </select>
                                       <select
                                          value={quickTaskAssignee}
                                          onChange={(e) => setQuickTaskAssignee(e.target.value)}
                                          className="flex-[2] bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-cyber-primary"
                                          title="Assign to"
                                       >
                                          <option value="">Select employee...</option>
                                          {visibleEmployees.map(emp => (
                                             <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                                          ))}
                                       </select>
                                    </div>
                                    <button
                                       onClick={handleQuickAssign}
                                       disabled={!quickTaskTitle.trim() || !quickTaskAssignee}
                                       className="w-full py-2 bg-cyber-primary hover:bg-cyber-accent text-black font-bold text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                       <Send size={12} />
                                       Assign Task
                                    </button>
                                 </div>
                              )}
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
