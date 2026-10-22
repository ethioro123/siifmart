import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Menu, Search, Sun, Moon, RefreshCw } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { tasksService } from '../services/supabase.service';
import { authService } from '../services/auth.service';
import { supabase } from '../lib/supabase';
import { canAccessModule, canViewAllEmployees } from '../utils/permissions';

// Sub-components
import { LocationBadge } from './topbar/LocationBadge';
import { RegionBadge } from './topbar/RegionBadge';
import { DesktopSearch } from './topbar/DesktopSearch';
import { MobileSearch } from './topbar/MobileSearch';
import { UserMenu } from './topbar/UserMenu';
import { ActivityCenter } from './topbar/ActivityCenter';
import Logo from './Logo';
import { NAVIGATION_TARGETS } from './topbar/navigationTargets';

export default function TopBar() {
   const { user, isSidebarOpen, toggleSidebar, theme, toggleTheme, logout } = useStore();
   const { language, setLanguage } = useLanguage();
   const {
      activeSite, sites, setActiveSite, notifications, markNotificationsRead,
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
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
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
         document.addEventListener('touchstart', handleClickOutside, { passive: true });
      }
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
         document.removeEventListener('touchstart', handleClickOutside);
      };
   }, [isSearchOpen, isNotifOpen, isUserMenuOpen]);

   // Global shortcut: Cmd+K / Ctrl+K to focus desktop search
   useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
            e.preventDefault();
            const input = searchRef.current?.querySelector('input');
            if (input) {
               input.focus();
               setIsSearchOpen(true);
            }
         }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
   }, []);

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
      if (canViewAllEmployees(user.role)) return employees;
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
      const isPrivileged = user.role === 'group_ceo' || user.role === 'country_managing_director' || user.role === 'hr_generalist' || user.role === 'country_hr_director' || user.role === 'regional_operations_manager' || user.role === 'country_operations_director';
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

   const totalAlerts = filteredNotifications.filter(notification => !notification.read).length
      + tasksAssignedToMe.filter(task => task.status === 'Pending').length;

   // Search Logic
   const searchResults = useMemo(() => {
      if (!searchValue.trim() || searchValue.length < 2 || !user) return null;
      const query = searchValue.toLowerCase();
      const userRole = user.role;
      const isJobIdPattern = /^(JOB|J|T)-\d{1,8}$/i.test(query.trim());

      // 1. Navigation & Command Search
      const siteType = activeSite?.type || '';
      const isStore = ['Store', 'Retail', 'POS'].includes(siteType);
      const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
      const isHQ = !isStore && !isWarehouse;
      const isCeo = ['group_ceo', 'country_managing_director', 'regional_operations_manager', 'country_operations_director'].includes(userRole);
      const isRegionalLead = userRole.startsWith('regional_');

      const navigation = NAVIGATION_TARGETS.filter(nav => {
         if (!canAccessModule(userRole, nav.module)) return false;
         
         if (isWarehouse && !isCeo && !isRegionalLead) {
            if (['pos', 'customers', 'sales', 'pricing', 'finance', 'settings'].includes(nav.module)) return false;
            if (nav.path === '/network-inventory' || nav.path === '/roadmap') return false;
            if (nav.module === 'admin' && nav.path === '/admin') return false;
         } else if (isStore && !isCeo && !isRegionalLead) {
            if (['warehouse', 'procurement', 'pricing', 'finance', 'settings'].includes(nav.module)) return false;
            if (nav.path === '/network-inventory' || nav.path === '/roadmap') return false;
            if (nav.module === 'admin' && nav.path === '/admin') return false;
         } else if (isHQ && !isCeo) {
            if (nav.path === '/pos' || (nav.path === '/wms-ops' && userRole !== 'regional_logistics_manager')) return false;
            if (nav.path === '/inventory' && !['regional_logistics_manager', 'regional_security_manager'].includes(userRole)) return false; // In HQ, local inventory is replaced by Network Inventory
         }

         return nav.title.toLowerCase().includes(query) || nav.keywords.some(k => k.toLowerCase().includes(query));
      }).slice(0, 4); // Max 4 nav results

      // 2. Deep Linking (Job/Order ID matching)
      const deepLinks: { title: string, path: string, type: string, id: string }[] = [];
      if (isJobIdPattern && canAccessModule(userRole, 'warehouse') && !isStore) {
         deepLinks.push({ title: `Open Job: ${query.toUpperCase()}`, path: `/wms-ops?search=${query.toUpperCase()}`, type: 'job', id: query });
      }

      // 3. Data Entities
      const products = canAccessModule(userRole, 'inventory') 
         ? allProducts.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)).slice(0, 5) 
         : [];
      
      const customersResults = canAccessModule(userRole, 'customers') && !isWarehouse
         ? customers.filter(c => c.name.toLowerCase().includes(query) || (c.email && c.email.toLowerCase().includes(query))).slice(0, 5)
         : [];
      
      const orders = canAccessModule(userRole, 'procurement') && !isStore
         ? allOrders.filter(o => (o.poNumber && o.poNumber.toLowerCase().includes(query)) || (o.po_number && o.po_number.toLowerCase().includes(query))).slice(0, 5)
         : [];
      
      const sales = canAccessModule(userRole, 'sales') && !isWarehouse
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
   }, [searchValue, allProducts, customers, allOrders, allSales, employees, user, activeSite]);

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
         case 'sale': navigate('/sales'); break;
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
         // Verify active session before reloading to guarantee user is never logged out
         const session = await authService.getSession();
         if (session) {
            window.location.reload();
            return;
         }
         await refreshData();
      } catch {
         window.location.reload();
      } finally {
         setTimeout(() => setIsRefreshing(false), 800);
      }
   };

   if (!user) return null;

   return (
      <header
         className="sticky top-0 z-[100] px-2 sm:px-4 md:px-6 flex items-center justify-between transition-colors duration-300 min-h-[56px] h-14 sm:h-16 border-0 border-transparent shadow-none"
         style={{ backgroundColor: 'var(--bg-app)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
         <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 sm:flex-initial">
            <button
               type="button"
               onClick={toggleSidebar}
               className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] p-2 min-w-11 min-h-11 flex items-center justify-center cursor-pointer transition-colors rounded-xl active:bg-[var(--theme-bg-subtle)] flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]"
               aria-label="Toggle sidebar"
               aria-expanded={isSidebarOpen}
               aria-controls="main-navigation-drawer"
            >
               <Menu size={22} className="md:w-6 md:h-6" />
            </button>

            <Logo size={20} className="mr-1" />

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
               setActiveSite={setActiveSite}
            />

            <RegionBadge />
         </div>

         <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-shrink-0 ml-2">
            {/* Mobile Search Trigger */}
            <button
               onClick={() => setIsMobileSearchVisible(true)}
               className="lg:hidden p-2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation"
               aria-label="Search"
            >
               <Search size={18} />
            </button>

            {/* Refresh Button */}
            <button 
               onClick={handleRefresh}
               className={`hidden sm:flex p-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-focus)] transition-all cursor-pointer ${isRefreshing ? 'animate-spin text-[var(--theme-text-primary)]' : ''}`}
               title="Reload Page"
               aria-label="Reload Page"
            >
               <RefreshCw size={16} />
            </button>

            {/* Dark/Light Toggle */}
            <button
               onClick={toggleTheme}
               className="hidden sm:flex p-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-focus)] transition-all cursor-pointer"
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
               theme={theme}
               toggleTheme={toggleTheme}
               onRefresh={handleRefresh}
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
