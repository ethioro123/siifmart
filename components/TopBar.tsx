import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Menu, Search, Sun, Moon, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { tasksService } from '../services/supabase.service';
import { supabase } from '../lib/supabase';
import { canAccessModule } from '../utils/permissions';

// Sub-components
import { LocationBadge } from './topbar/LocationBadge';
import { DesktopSearch } from './topbar/DesktopSearch';
import { MobileSearch } from './topbar/MobileSearch';
import { UserMenu } from './topbar/UserMenu';
import { ActivityCenter } from './topbar/ActivityCenter';

const NAVIGATION_TARGETS = [
    { title: 'Central Operations', path: '/admin', module: 'admin', keywords: ['hq', 'dashboard', 'control', 'central'] },
    { title: 'POS Terminal', path: '/pos', module: 'pos', keywords: ['register', 'sale', 'checkout', 'till'] },
    { title: 'POS Operations', path: '/pos-dashboard', module: 'pos', keywords: ['command center', 'store', 'retail'] },
    { title: 'Inventory Management', path: '/inventory', module: 'inventory', keywords: ['stock', 'items', 'products', 'inventory'] },
    { title: 'Network Inventory', path: '/network-inventory', module: 'inventory', keywords: ['network', 'global stock'] },
    { title: 'Warehouse Ops / Fulfillment', path: '/wms-ops', module: 'warehouse', keywords: ['picking', 'packing', 'receiving', 'wms', 'fulfillment'] },
    { title: 'Job History', path: '/wms-ops?view=history', module: 'warehouse', keywords: ['past jobs', 'history', 'completed', 'logs'] },
    { title: 'Active Mission', path: '/wms-ops', module: 'warehouse', keywords: ['active job', 'current task', 'my job', 'mission'] },
    { title: 'Warehouse Dashboard', path: '/wms-dashboard', module: 'warehouse', keywords: ['stats', 'metrics', 'wms dashboard'] },
    { title: 'Procurement', path: '/procurement', module: 'procurement', keywords: ['po', 'purchase orders', 'buying'] },
    { title: 'Pricing & Merchandising', path: '/pricing', module: 'pricing', keywords: ['pricing', 'promotions', 'discounts'] },
    { title: 'Financials', path: '/finance', module: 'finance', keywords: ['finance', 'expenses', 'accounting'] },
    { title: 'Sales History', path: '/sales', module: 'sales', keywords: ['receipts', 'past sales', 'transactions'] },
    { title: 'Customers', path: '/customers', module: 'customers', keywords: ['clients', 'crm', 'customers'] },
    { title: 'Employees', path: '/employees', module: 'employees', keywords: ['staff', 'team', 'hr'] },
    { title: 'Settings', path: '/settings', module: 'settings', keywords: ['config', 'setup', 'preferences'] },
    { title: 'My Profile', path: '/profile', module: 'profile', keywords: ['profile', 'account', 'me'] },
    { title: 'Roadmap', path: '/roadmap', module: 'admin', keywords: ['roadmap', 'planning', 'brainstorm'] },
    { title: 'Location Select', path: '/location-select', module: 'admin', keywords: ['location', 'switch site', 'sites'] },
];

export default function TopBar() {
   const { user, toggleSidebar, theme, toggleTheme, logout } = useStore();
   const { language, setLanguage } = useLanguage();
   const {
      activeSite, sites, notifications, markNotificationsRead,
      addNotification, clearNotification, clearAllNotifications, employees, allProducts, customers, allOrders, allSales,
      tasks, setTasks, refreshData
   } = useData();
   const { getWorkerPoints, workerPoints } = useGamification();
   const navigate = useNavigate();
   const location = useLocation();

   // State
   const [isNotifOpen, setIsNotifOpen] = useState(false);
   const [notifTab, setNotifTab] = useState<'all' | 'tasks'>('all');
   const [searchValue, setSearchValue] = useState('');
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
   const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

   // Refs
   const searchRef = useRef<HTMLDivElement>(null);
   const notifRef = useRef<HTMLDivElement>(null);
   const userMenuRef = useRef<HTMLDivElement>(null);

   // Auto-close dropdowns on click outside
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         const target = event.target as Node;
         
         // Search
         if (isSearchOpen && searchRef.current && !searchRef.current.contains(target)) {
            setIsSearchOpen(false);
         }
         
         // Notifications
         if (isNotifOpen && notifRef.current && !notifRef.current.contains(target)) {
            setIsNotifOpen(false);
         }
         
         // User Menu
         if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
            setIsUserMenuOpen(false);
         }
      };

      if (isSearchOpen || isNotifOpen || isUserMenuOpen) {
         document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, [isSearchOpen, isNotifOpen, isUserMenuOpen]);
   const [showQuickAssign, setShowQuickAssign] = useState(false);
   const [quickTaskTitle, setQuickTaskTitle] = useState('');
   const [quickTaskPriority, setQuickTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
   const [quickTaskAssignee, setQuickTaskAssignee] = useState('');
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [todayJobs, setTodayJobs] = useState<{ type: string; count: number }[]>([]);
   const [todayJobsTotal, setTodayJobsTotal] = useState(0);

   // Fetch today's mission summary for User Menu

   // Today's Missions Fetcher

   // Today's Missions Fetcher
   useEffect(() => {
      if (!isUserMenuOpen || !user) return;
      const fetchTodayJobs = async () => {
         try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data } = await supabase
               .from('wms_jobs')
               .select('type')
               .eq('status', 'Completed')
               .gte('completed_at', today.toISOString())
               .or(`assigned_to.eq.${user.id},assigned_to.eq.${user.name},completed_by.eq.${user.id},completed_by.eq.${user.name}`);
            
            if (data && data.length > 0) {
               const counts: Record<string, number> = {};
               data.forEach(j => { counts[j.type] = (counts[j.type] || 0) + 1; });
               const sorted = Object.entries(counts)
                  .map(([type, count]) => ({ type, count }))
                  .sort((a, b) => b.count - a.count);
               setTodayJobs(sorted);
               setTodayJobsTotal(data.length);
            } else {
               setTodayJobs([]);
               setTodayJobsTotal(0);
            }
         } catch { 
            setTodayJobs([]); 
            setTodayJobsTotal(0); 
         }
      };
      fetchTodayJobs();
   }, [isUserMenuOpen, user]);

   // Employee Visibility
   const currentEmployee = useMemo(() => {
      if (!user || employees.length === 0) return null;
      return employees.find(emp =>
         emp.id === (user as any).employeeId ||
         emp.id === user.id ||
         emp.name.toLowerCase() === user.name.toLowerCase()
      ) || null;
   }, [user, employees]);

   const visibleEmployees = useMemo(() => {
      if (!user) return [];
      if (user.role === 'super_admin') return employees;
      const userSiteId = currentEmployee?.siteId || currentEmployee?.site_id || user.siteId;
      if (!userSiteId) return employees;
      return employees.filter(emp => emp.siteId === userSiteId || emp.site_id === userSiteId);
   }, [user, currentEmployee, employees]);

   // Gamification
   const currentUserPoints = useMemo(() => {
      if (!user) return null;
      const employee = employees.find(e => e.name === user.name || e.id === user.id);
      if (employee) {
         const points = getWorkerPoints(employee.id);
         if (points) return points;
      }
      return { totalPoints: 0, weeklyPoints: 0, rank: '-', level: 1, levelTitle: 'Rookie' } as any;
   }, [user, employees, getWorkerPoints, workerPoints]);

   // Notifications & Tasks
   const filteredNotifications = useMemo(() => {
      if (!user) return [];
      const isPrivileged = user.role === 'super_admin' || user.role === 'admin' || user.role === 'hr';
      const userId = user.id;
      const employeeId = currentEmployee?.id;

      return notifications
         .filter(n => {
            if (isPrivileged) return true;
            return n.userId === userId || (employeeId && n.userId === employeeId);
         })
         .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
   }, [notifications, user, currentEmployee]);

   const { tasksAssignedToMe, tasksICreated, myTasks } = useMemo(() => {
      if (!currentEmployee && !user) return { tasksAssignedToMe: [], tasksICreated: [], myTasks: [] };
      const userId = currentEmployee?.id || user?.id || '';
      const userName = currentEmployee?.name || user?.name || '';
      
      const assigned = tasks.filter(t => (t.assignedTo === userId || t.assignedTo === userName) && t.status !== 'Completed');
      const created = tasks.filter(t => (t.createdBy === userId || t.createdBy === userName) && t.assignedTo !== userId && t.assignedTo !== userName && t.status !== 'Completed');
      
      return { tasksAssignedToMe: assigned, tasksICreated: created, myTasks: [...assigned, ...created] };
   }, [tasks, currentEmployee, user]);

   const totalAlerts = filteredNotifications.length + tasksAssignedToMe.length;

   // Search Logic
   const searchResults = useMemo(() => {
      if (!searchValue.trim() || searchValue.length < 2 || !user) return null;
      const query = searchValue.toLowerCase();
      const userRole = user.role;
      const isJobIdPattern = /^(JOB|J|T)-\d{1,8}$/i.test(query.trim());

      // 1. Navigation & Command Search
      const navigation = NAVIGATION_TARGETS.filter(nav => {
         if (!canAccessModule(userRole, nav.module)) return false;
         return nav.title.toLowerCase().includes(query) || nav.keywords.some(k => k.toLowerCase().includes(query));
      }).slice(0, 4); // Max 4 nav results

      // 2. Deep Linking (Job/Order ID matching)
      const deepLinks: { title: string, path: string, type: string, id: string }[] = [];
      if (isJobIdPattern && canAccessModule(userRole, 'warehouse')) {
         deepLinks.push({ title: `Open Job: ${query.toUpperCase()}`, path: `/wms-ops?search=${query.toUpperCase()}`, type: 'job', id: query });
      }

      // 3. Data Entities
      const products = canAccessModule(userRole, 'inventory') 
         ? allProducts.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)).slice(0, 5) 
         : [];
      
      const customersResults = canAccessModule(userRole, 'customers')
         ? customers.filter(c => c.name.toLowerCase().includes(query) || (c.email && c.email.toLowerCase().includes(query))).slice(0, 5)
         : [];
      
      const orders = canAccessModule(userRole, 'procurement')
         ? allOrders.filter(o => (o.poNumber && o.poNumber.toLowerCase().includes(query)) || (o.po_number && o.po_number.toLowerCase().includes(query))).slice(0, 5)
         : [];
      
      const sales = canAccessModule(userRole, 'sales')
         ? allSales.filter(s => (s.receiptNumber && s.receiptNumber.toLowerCase().includes(query)) || (s.id && s.id.toLowerCase().includes(query))).slice(0, 5)
         : [];
      
      const employeesResults = canAccessModule(userRole, 'employees')
         ? employees.filter(e => e.name.toLowerCase().includes(query) || (e.email && e.email.toLowerCase().includes(query))).slice(0, 5)
         : [];

      return {
         navigation,
         deepLinks,
         products,
         customers: customersResults,
         orders,
         sales,
         employees: employeesResults,
         total: navigation.length + deepLinks.length + products.length + customersResults.length + orders.length + sales.length + employeesResults.length
      };
   }, [searchValue, allProducts, customers, allOrders, allSales, employees, user]);

   // Handlers
   const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchValue.trim() && searchResults && searchResults.total > 0) setIsSearchOpen(true);
   };

   const handleResultClick = (type: string, id: string, path?: string) => {
      setIsSearchOpen(false);
      setSearchValue('');
      
      if (type === 'navigation' || type === 'job') {
         if (path) navigate(path);
         return;
      }

      switch (type) {
         case 'product': navigate('/inventory'); break;
         case 'customer': navigate('/customers'); break;
         case 'order': navigate('/procurement'); break;
         case 'sale': navigate('/sales-history'); break;
         case 'employee': navigate('/employees'); break;
      }
   };

   const handleTaskStatusChange = async (taskId: string, newStatus: 'Pending' | 'In-Progress' | 'Completed') => {
      try {
         const updated = await tasksService.update(taskId, { status: newStatus });
         if (updated) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t) as any);
            addNotification('success', `Task ${newStatus === 'Completed' ? 'completed' : 'updated'}!`);
         }
      } catch (err) {
         addNotification('alert', 'Failed to update task');
      }
   };

   const handleQuickAssign = async () => {
      if (!quickTaskTitle.trim() || !quickTaskAssignee) return;
      try {
         const creatorId = currentEmployee?.id || user?.id || '';
         const newTask = await tasksService.create({
            title: quickTaskTitle.trim(),
            description: '',
            assignedTo: quickTaskAssignee,
            status: 'Pending',
            priority: quickTaskPriority,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdBy: creatorId
         });
         if (newTask) {
            setTasks([...tasks, newTask]);
            addNotification('success', 'Task assigned successfully!');
            setQuickTaskTitle('');
            setQuickTaskAssignee('');
            setShowQuickAssign(false);
         }
      } catch (err) {
         addNotification('alert', 'Failed to create task');
      }
   };

   const handleRefresh = async () => {
      if (isRefreshing) return;
      setIsRefreshing(true);
      try {
         await refreshData();
         addNotification('success', 'Data refreshed successfully');
      } catch {
         addNotification('alert', 'Failed to refresh data');
      } finally {
         setTimeout(() => setIsRefreshing(false), 800);
      }
   };

   if (!user) return null;

   return (
      <header className="h-14 md:h-16 sticky top-0 z-[100] px-2 sm:px-4 md:px-6 flex items-center justify-between transition-colors duration-500">
         <div className="flex items-center space-x-2 sm:space-x-4">
            <button onClick={toggleSidebar} className="text-[#4D6E56] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white p-1 cursor-pointer transition-colors" aria-label="Toggle sidebar">
               <Menu size={20} className="md:w-6 md:h-6" />
            </button>
            
            {/* Logo / Brand */}
            <div className="flex items-center gap-2 mr-2 cursor-pointer group" onClick={() => navigate('/')}>
               <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1E3F27] via-[#2C5E3B] to-amber-700 flex items-center justify-center shadow-[0_3px_10px_rgba(44,94,59,0.15)] group-hover:scale-105 transition-transform duration-300">
                  <LayoutDashboard size={16} className="text-white" />
               </div>
               <span className="hidden sm:inline font-black text-lg text-[#1E3F27] dark:text-[#EAE5D9] tracking-tighter select-none">SIIF<span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2C5E3B] to-amber-600 dark:from-[#A9CBA2] dark:to-[#DFD5C6] font-black">MART</span></span>
            </div>

            <DesktopSearch 
               searchValue={searchValue}
               setSearchValue={setSearchValue}
               isSearchOpen={isSearchOpen}
               setIsSearchOpen={setIsSearchOpen}
               searchResults={searchResults}
               handleSearch={handleSearch}
               handleResultClick={handleResultClick}
               containerRef={searchRef}
            />

            <LocationBadge 
               user={user}
               sites={sites}
               employees={employees}
               activeSite={activeSite}
            />
         </div>

         <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            {/* Mobile Search Trigger */}
            <button
               onClick={() => setIsMobileSearchVisible(true)}
               className="lg:hidden p-2 text-[#4D6E56] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white transition-colors cursor-pointer"
               aria-label="Search"
            >
               <Search size={20} />
            </button>

            {/* Refresh Button */}
            <button 
               onClick={handleRefresh}
               className={`hidden sm:flex p-2 rounded-xl border border-[#E2DCCE] dark:border-emerald-950/20 bg-white/50 dark:bg-black/10 text-[#4D6E56] dark:text-[#A9CBA2] hover:text-[#2C5E3B] dark:hover:text-white hover:border-[#2C5E3B]/30 dark:hover:border-emerald-800/30 transition-all cursor-pointer ${isRefreshing ? 'animate-spin text-[#2C5E3B] dark:text-[#A9CBA2]' : ''}`}
               title="Refresh Intelligence"
            >
               <RefreshCw size={16} />
            </button>

            {/* Dark/Light Toggle */}
            <button
               onClick={toggleTheme}
               className="p-2 rounded-xl border border-[#E2DCCE] dark:border-emerald-950/20 bg-white/50 dark:bg-black/10 text-[#4D6E56] dark:text-[#A9CBA2] hover:text-amber-600 dark:hover:text-amber-500 hover:border-amber-600/30 dark:hover:border-amber-500/20 transition-all cursor-pointer"
               aria-label="Toggle Theme"
            >
               {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <ActivityCenter 
               notifRef={notifRef}
               isNotifOpen={isNotifOpen}
               setIsNotifOpen={setIsNotifOpen}
               totalAlerts={totalAlerts}
               notifTab={notifTab}
               setNotifTab={setNotifTab}
               filteredNotifications={filteredNotifications}
               myTasks={myTasks}
               handleClearAll={() => clearAllNotifications()}
               handleClearSingle={(id) => clearNotification(id)}
               tasksAssignedToMe={tasksAssignedToMe}
               handleTaskStatusChange={handleTaskStatusChange}
               tasksICreated={tasksICreated}
               handleMarkAllRead={() => { markNotificationsRead(); setIsNotifOpen(false); }}
               showQuickAssign={showQuickAssign}
               setShowQuickAssign={setShowQuickAssign}
               quickTaskTitle={quickTaskTitle}
               setQuickTaskTitle={setQuickTaskTitle}
               quickTaskPriority={quickTaskPriority}
               setQuickTaskPriority={setQuickTaskPriority}
               quickTaskAssignee={quickTaskAssignee}
               setQuickTaskAssignee={setQuickTaskAssignee}
               handleQuickAssign={handleQuickAssign}
               visibleEmployees={visibleEmployees}
            />

            <UserMenu 
               user={user}
               isUserMenuOpen={isUserMenuOpen}
               setIsUserMenuOpen={setIsUserMenuOpen}
               logout={logout}
               currentUserPoints={currentUserPoints}
               todayJobs={todayJobs}
               todayJobsTotal={todayJobsTotal}
               dropdownRef={userMenuRef}
               navigate={navigate}
               language={language}
               setLanguage={setLanguage}
            />
         </div>

         <MobileSearch 
            isMobileSearchVisible={isMobileSearchVisible}
            setIsMobileSearchVisible={setIsMobileSearchVisible}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            searchResults={searchResults}
            handleResultClick={handleResultClick}
         />
      </header>
   );
}
