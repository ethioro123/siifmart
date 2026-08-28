
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Truck, Users,
  Briefcase, Map, Settings, X, FileText, ClipboardList, Tags, Eye,
  DollarSign, Globe, Activity, Sliders
} from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { UserRole } from '../types';
import { getAvailableSections } from '../services/auth.service';
import { native } from '../utils/native';
import Logo from './Logo';

interface SidebarItemProps {
  to: string;
  icon: any;
  label: string;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
          ? 'bg-[#2C5E3B]/10 dark:bg-[#A9CBA2]/10 text-[#2C5E3B] dark:text-[#A9CBA2] border-r-2 border-[#2C5E3B] dark:border-[#A9CBA2]'
          : 'text-stone-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-white/5 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2]'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium tracking-wide">{label}</span>
    </NavLink>
  );
};

export default function Sidebar() {
  const { user, isSidebarOpen, toggleSidebar } = useStore();
  const { activeSite, sites, setActiveSite } = useData();
  const navigate = useNavigate();

  if (!user) return null;

  // Get available sections based on role AND site type
  const availableSections = getAvailableSections(user.role, activeSite?.type);

  // CEO clicking "Central Operations": switch to the Administration site (SITE-0001)
  const handleAdminClick = () => {
    const adminSite = sites.find(s =>
      s.code === 'SITE-0001' ||
      s.name === 'Central Operations' ||
      ['Administrative', 'Administration', 'HQ', 'Headquarters', 'Head Office'].includes(s.type || '')
    );
    if (adminSite) {
      setActiveSite(adminSite.id);
    }
    navigate('/admin');
    toggleSidebar();
  };


  // --- ADVANCED NAVIGATION LOGIC ---
  // Map each nav item to its required permission section
  const getNavItems = (userRole: UserRole) => {
    const allItems = [
      // WMS DASHBOARD - Overview (Managers Only)
      { to: "/wms-dashboard", icon: LayoutDashboard, label: "WMS Dashboard", section: "warehouse", roles: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist'] },

      // NETWORK INVENTORY - All users can view (Except low-level ops)
      { to: "/network-inventory", icon: Globe, label: "Network View", section: "inventory", roles: ['super_admin', 'warehouse_manager', 'dispatcher', 'dispatch_manager', 'pos', 'hr', 'auditor', 'finance_manager', 'procurement_manager', 'store_supervisor', 'inventory_specialist', 'cs_manager', 'it_support'] },

      // INVENTORY
      { to: "/inventory", icon: Package, label: "Inventory", section: "inventory", roles: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'warehouse_manager', 'dispatcher', 'dispatch_manager', 'auditor', 'procurement_manager', 'inventory_specialist', 'store_supervisor', 'pos'] },

      // FULFILLMENT (WMS) - Warehouse staff only
      { to: "/wms-ops", icon: ClipboardList, label: "Fulfillment", section: "warehouse", roles: ['super_admin', 'admin', 'warehouse_manager', 'operations_manager', 'dispatch_manager', 'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'inventory_specialist'] },

      // PROCUREMENT - Warehouse and procurement only
      { to: "/procurement", icon: Truck, label: "Procurement", section: "procurement", roles: ['super_admin', 'warehouse_manager', 'dispatcher', 'procurement_manager', 'finance_manager'] },

      // ROADMAP
      { to: "/roadmap", icon: Map, label: "Roadmap", section: "dashboard", roles: ['super_admin', 'admin', 'store_manager', 'assistant_manager', 'shift_lead', 'warehouse_manager', 'dispatcher', 'dispatch_manager', 'pos', 'hr', 'auditor', 'finance_manager', 'procurement_manager', 'store_supervisor', 'inventory_specialist', 'cs_manager', 'it_support'] },

      // CENTRAL OPERATIONS - CEO Only (handled separately via handleAdminClick)
      { to: "/admin", icon: Activity, label: "Central Operations", section: "dashboard", roles: ['super_admin'] },

      // POS
      { to: "/pos", icon: ShoppingCart, label: "POS Terminal", section: "pos", roles: ['store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor'] },

      // POS COMMAND CENTER - Store management
      { to: "/pos-dashboard", icon: Eye, label: "POS Command", section: "pos", roles: ['store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor'] },

      // SALES
      { to: "/sales", icon: FileText, label: "Sales History", section: "sales", roles: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'auditor', 'finance_manager', 'cs_manager', 'store_supervisor'] },

      // MERCHANDISING
      { to: "/pricing", icon: Tags, label: "Merchandising", section: "pricing", roles: ['super_admin', 'finance_manager', 'procurement_manager'] },

      // FINANCE
      { to: "/finance", icon: DollarSign, label: "Financials", section: "finance", roles: ['super_admin', 'auditor', 'finance_manager'] },

      // CUSTOMERS
      { to: "/customers", icon: Users, label: "Customers", section: "customers", roles: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'cs_manager', 'store_supervisor'] },

      // EMPLOYEES
      { to: "/employees", icon: Briefcase, label: "Employees", section: "employees", roles: ['super_admin', 'admin', 'hr', 'store_manager', 'assistant_manager', 'shift_lead', 'store_supervisor'] },

      // SETTINGS
      { to: "/settings", icon: Settings, label: "Settings", section: "settings", roles: ['super_admin', 'admin', 'hr', 'it_support'] },
    ];

    // Filter by role AND site-type context
    let filteredItems = allItems.filter(item => {
      const hasRole = item.roles.includes(userRole) || userRole === 'super_admin';

      const siteType = activeSite?.type || '';
      const isStore = ['Store', 'Dark Store', 'Retail', 'POS'].includes(siteType);
      const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
      const isHQ = !isStore && !isWarehouse;

      let isAllowedForSite = true;

      if (isWarehouse) {
        // In WMS site: strictly WMS & Inventory menu options ONLY. Hide Administration HQ & POS.
        if (item.to === '/admin' || ['pos', 'pricing', 'finance', 'settings', 'customers'].includes(item.section)) {
          isAllowedForSite = false;
        }
      } else if (isStore) {
        // In POS store site: strictly POS, Sales & Customers menu options ONLY. Hide Administration HQ & WMS.
        if (item.to === '/admin' || ['warehouse', 'procurement', 'finance', 'pricing', 'settings'].includes(item.section)) {
          isAllowedForSite = false;
        }
      } else if (isHQ) {
        // In Administration HQ site (e.g. SITE-0001): SHOW Central Operations & HQ tools; HIDE WMS-only & POS-only site ops.
        if (['warehouse', 'pos'].includes(item.section)) {
          isAllowedForSite = false;
        }
      }

      return hasRole && isAllowedForSite;
    });

    // --- ANDROID & CLEAN MOBILE RESTRICTIONS (FULFILLMENT & POS ONLY) ---
    if (native.isCleanMobileMode()) {
      const allowedMobilePaths = ['/wms-ops', '/pos', '/inventory', '/pos-dashboard', '/wms-dashboard'];
      filteredItems = filteredItems.filter(item => allowedMobilePaths.includes(item.to));
    }

    return filteredItems;
  };

  const navItems = getNavItems(user.role);

  return (
    <>
      {/* Mobile Overlay - Only visible on small screens to prevent "dark thing" effect on desktop */}
      <div
        className={`fixed inset-0 bg-black/40 lg:bg-black/20 z-[1000] backdrop-blur-sm lg:backdrop-blur-none transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-[1001]
        w-72 bg-white dark:bg-[#1E2822] border-r border-[#E2DCCE] dark:border-white/5
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-[#E2DCCE] dark:border-white/5">
          <Logo size={32} />
          <button onClick={toggleSidebar} className="text-stone-400 dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] transition-colors" aria-label="Close Sidebar">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar py-4">
          <p className="px-4 text-xs font-bold text-stone-400 dark:text-gray-500 uppercase tracking-wider mb-3">Menu</p>
          {navItems.map(item => {
            const Icon = item.icon;
            // "Central Operations" for CEO: clear activeSite before navigating
            if (item.to === '/admin' && user.role === 'super_admin') {
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={handleAdminClick}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group text-stone-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-white/5 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2]"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium tracking-wide">Central Operations</span>
                </button>
              );
            }
            return (
              <SidebarItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                onClick={toggleSidebar}
              />
            );
          })}
        </nav>

      </aside >
    </>
  );
}
