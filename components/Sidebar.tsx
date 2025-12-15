
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Truck, Users,
  Briefcase, Map, MapPin, Settings, X, LogOut, FileText, ClipboardList, Tags, Eye,
  DollarSign, Globe, Activity
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
          ? 'bg-cyber-primary/10 text-cyber-primary border-r-2 border-cyber-primary'
          : 'text-gray-400 hover:bg-cyber-gray hover:text-cyber-primary'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium tracking-wide">{label}</span>
    </NavLink>
  );
};

export default function Sidebar() {
  const { user, logout, isSidebarOpen, toggleSidebar } = useStore();

  if (!user) return null;

  // Get activeSite - it might be null during initial load
  const { activeSite } = useData();

  // Get available sections based on role AND site type
  const availableSections = getAvailableSections(user.role, activeSite?.type);

  // --- ADVANCED NAVIGATION LOGIC ---
  // Map each nav item to its required permission section
  const getNavItems = (userRole: UserRole) => {
    const allItems = [
      // CENTRAL OPERATIONS - Super Admin Only
      { to: "/admin", icon: Activity, label: "Central Operations", section: "dashboard", roles: ['super_admin'] },

      // POS
      { to: "/pos", icon: ShoppingCart, label: "POS Terminal", section: "pos", roles: ['manager', 'pos', 'store_supervisor'] },

      // POS COMMAND CENTER - Store management
      { to: "/pos-dashboard", icon: Eye, label: "POS Command", section: "pos", roles: ['manager', 'pos', 'store_supervisor'] },

      // SALES
      { to: "/sales", icon: FileText, label: "Sales History", section: "sales", roles: ['super_admin', 'manager', 'pos', 'auditor', 'finance_manager', 'cs_manager', 'store_supervisor'] },

      // INVENTORY
      { to: "/inventory", icon: Package, label: "Inventory", section: "inventory", roles: ['super_admin', 'manager', 'warehouse_manager', 'dispatcher', 'auditor', 'procurement_manager', 'inventory_specialist', 'store_supervisor', 'pos'] },

      // NETWORK INVENTORY - All users can view
      { to: "/network-inventory", icon: Globe, label: "Network View", section: "inventory", roles: ['super_admin', 'manager', 'warehouse_manager', 'dispatcher', 'pos', 'hr', 'auditor', 'driver', 'finance_manager', 'procurement_manager', 'store_supervisor', 'inventory_specialist', 'cs_manager', 'it_support'] },

      // WMS DASHBOARD - Overview
      { to: "/wms-dashboard", icon: LayoutDashboard, label: "WMS Dashboard", section: "warehouse", roles: ['super_admin', 'warehouse_manager', 'dispatcher', 'picker', 'driver', 'inventory_specialist'] },

      // FULFILLMENT (WMS) - Warehouse staff only
      { to: "/wms-ops", icon: ClipboardList, label: "Fulfillment", section: "warehouse", roles: ['warehouse_manager', 'dispatcher', 'picker', 'driver', 'inventory_specialist'] },

      // PROCUREMENT - Warehouse and procurement only
      { to: "/procurement", icon: Truck, label: "Procurement", section: "procurement", roles: ['super_admin', 'warehouse_manager', 'dispatcher', 'procurement_manager', 'finance_manager'] },

      // MERCHANDISING
      { to: "/pricing", icon: Tags, label: "Merchandising", section: "pricing", roles: ['super_admin', 'finance_manager', 'procurement_manager'] },

      // FINANCE
      { to: "/finance", icon: DollarSign, label: "Financials", section: "finance", roles: ['super_admin', 'auditor', 'finance_manager'] },

      // CUSTOMERS
      { to: "/customers", icon: Users, label: "Customers", section: "customers", roles: ['super_admin', 'manager', 'pos', 'cs_manager', 'store_supervisor'] },

      // EMPLOYEES
      { to: "/employees", icon: Briefcase, label: "Employees", section: "employees", roles: ['super_admin', 'admin', 'hr', 'manager', 'store_supervisor'] },

      // ROADMAP
      { to: "/roadmap", icon: Map, label: "Roadmap", section: "dashboard", roles: ['super_admin', 'admin', 'manager', 'warehouse_manager', 'dispatcher', 'pos', 'picker', 'hr', 'auditor', 'driver', 'finance_manager', 'procurement_manager', 'store_supervisor', 'inventory_specialist', 'cs_manager', 'it_support'] },

      // SETTINGS
      { to: "/settings", icon: Settings, label: "Settings", section: "settings", roles: ['super_admin', 'admin', 'hr', 'it_support'] },

      // SWITCH LOCATION - Context Switching for Super Admin
      { to: "/location-select", icon: MapPin, label: "Switch Location", section: "dashboard", roles: ['super_admin'] },
    ];

    // DETERMINE EFFECTIVE ROLE FOR CONTEXTUAL NAVIGATION
    // If a Global Admin is viewing a specific Site, downgrade their view to matching local role
    let effectiveRole = userRole;
    if (userRole === 'super_admin' && activeSite) {
      if (['Store', 'Dark Store'].includes(activeSite.type)) {
        effectiveRole = 'manager';
      } else if (['Warehouse', 'Distribution Center'].includes(activeSite.type)) {
        effectiveRole = 'warehouse_manager';
      }
    }

    // Filter by role AND available sections (site-type filtering)
    let filteredItems = allItems.filter(item => {
      // CONTEXTUAL ROLE CHECK
      // If the item is "Switch Location", use the REAL userRole (so Admin can always switch back)
      // For all other items, use the effectiveRole (simulate local manager)
      const roleToCheck = (item.to === '/location-select') ? userRole : effectiveRole;
      const hasRole = item.roles.includes(roleToCheck);

      // Check if section is available for this site type
      // Super admin (*) bypasses section filtering in auth.service, so we enforce it here visually
      let hasSection = availableSections.includes('*') || availableSections.includes(item.section);

      // --- STRICT VISUAL FILTERING BASED ON ACTIVE SITE ---
      // This ensures that even Super Admins only see relevant tools for the selected context
      if (activeSite) {
        const isStore = activeSite.type === 'Store' || activeSite.type === 'Dark Store';
        const isWarehouse = activeSite.type === 'Warehouse' || activeSite.type === 'Distribution Center';

        if (isStore) {
          // Stores: HIDE Warehouse Ops, Procurement
          if (['warehouse', 'procurement'].includes(item.section)) {
            hasSection = false;
          }
        }

        if (isWarehouse) {
          // Warehouses: HIDE POS, Pricing, Customers
          // We keep Sales visible for Dispatchers/Managers to check order history if needed, 
          // but hide POS which is irrelevant.
          if (['pos', 'pricing', 'customers'].includes(item.section)) {
            hasSection = false;
          }
        }
      } else {
        // --- GLOBAL / CENTRAL CONTEXT (No Site Selected) ---
        // Hide strictly operational site tools like POS Terminal and WMS Fulfillment
        // Central Ops should assume a Management/Oversight role, not an Operator role
        if (['pos', 'warehouse'].includes(item.section)) {
          hasSection = false;
        }
      }

      return hasRole && hasSection;
    });

    // --- NATIVE APP RESTRICTIONS ---
    // If running in the Android Native App (PDA Mode), restrict to operational tools only
    if (native.isNative()) {
      const allowedNativePaths = ['/pos', '/inventory', '/wms-ops'];
      filteredItems = filteredItems.filter(item => allowedNativePaths.includes(item.to));
    }

    return filteredItems;
  };

  const navItems = getNavItems(user.role);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 z-40 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-72 bg-cyber-dark border-r border-white/5
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <Logo size={32} />
          <button onClick={toggleSidebar} className="text-gray-400" aria-label="Close Sidebar">
            <X size={24} />
          </button>
        </div>

        <div className="px-4 mb-6">
          <div className="bg-cyber-gray p-4 rounded-xl border border-white/5">
            <div className="flex items-center space-x-3">
              <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-cyber-primary object-cover" />
              <div>
                <p className="text-sm font-bold text-white truncate w-32">{user.name}</p>
                <p className="text-xs text-gray-400 truncate w-32">{user.title}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map(item => (
            <SidebarItem key={item.to} to={item.to} icon={item.icon} label={item.label} onClick={toggleSidebar} />
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={logout} className="flex items-center space-x-3 text-red-400 hover:bg-red-500/10 w-full px-4 py-3 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
