
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
import { findCountryAdminSite } from '../utils/countryAdmin';
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
  const { activeSite, sites, setActiveSite, effectiveCountry, regions, activeRegionCode, isRegionalUser } = useData();
  const navigate = useNavigate();

  if (!user) return null;

  // Regional Scope & Dynamic Persona Navigation
  const userScope = user.scopeLevel || user.scope_level || (isRegionalUser ? 'REGIONAL' : 'HQ');
  const isRegionalStaff = userScope === 'REGIONAL' || [
    'regional_manager',
    'regional_procurement_lead',
    'regional_finance_officer',
    'regional_hr_officer',
    'regional_logistics_lead',
    'regional_security_supervisor'
  ].includes(user.role);

  const targetRegionCode = activeRegionCode || user.regionCode || user.region_code;
  const activeRegion = (regions || []).find(r => r.code === targetRegionCode);
  const regionDisplayName = activeRegion?.name ? activeRegion.name.replace(/ Territory| Region/gi, '') : (targetRegionCode || 'Territory');

  // Get available sections based on role AND site type
  const availableSections = getAvailableSections(user.role, activeSite?.type);

  // CEO clicking "Central Operations": switch to the Administration site for effective country
  const handleAdminClick = () => {
    const targetCountry = effectiveCountry || 'ET';
    const adminSite = findCountryAdminSite(sites, targetCountry) || sites.find(s => (s.country || 'ET') === targetCountry);
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
      { to: "/wms-dashboard", icon: LayoutDashboard, label: "WMS Dashboard", section: "warehouse", roles: ['super_admin', 'warehouse_manager', 'dispatcher', 'inventory_specialist', 'operations_manager', 'regional_manager', 'supply_chain_manager', 'inventory_manager', 'logistics_manager', 'fleet_maintenance_supervisor'] },

      // NETWORK INVENTORY - Executive & Supply Chain Leadership
      { to: "/network-inventory", icon: Globe, label: "Network View", section: "inventory", roles: ['super_admin', 'admin', 'supply_chain_manager', 'operations_manager', 'auditor', 'regional_manager', 'replenishment_planner'] },

      // INVENTORY - Strictly Warehouse & Distribution Center Only
      { to: "/inventory", icon: Package, label: "Inventory", section: "inventory", roles: ['super_admin', 'admin', 'warehouse_manager', 'dispatcher', 'dispatch_manager', 'auditor', 'inventory_specialist', 'operations_manager', 'regional_manager', 'supply_chain_manager', 'inventory_manager', 'inbound_qc_inspector', 'replenishment_planner', 'store_operations_auditor'] },

      // FULFILLMENT (WMS) - Warehouse staff & operations leadership
      { to: "/wms-ops", icon: ClipboardList, label: "Fulfillment", section: "warehouse", roles: ['super_admin', 'admin', 'warehouse_manager', 'operations_manager', 'dispatch_manager', 'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'stock_clerk', 'returns_clerk', 'inventory_specialist', 'regional_manager', 'regional_logistics_lead', 'supply_chain_manager', 'inventory_manager', 'logistics_manager', 'inbound_qc_inspector', 'replenishment_planner', 'fleet_maintenance_supervisor'] },

      // PROCUREMENT - Corporate administration, procurement & operational leadership
      { to: "/procurement", icon: Truck, label: "Procurement", section: "procurement", roles: ['super_admin', 'admin', 'procurement_manager', 'buyer', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'supply_chain_manager', 'operations_manager', 'regional_manager', 'replenishment_planner'] },

      // ROADMAP - CEO Only (Confidential Strategic Canvas)
      { to: "/roadmap", icon: Map, label: "Roadmap", section: "dashboard", roles: ['super_admin'] },

      // CENTRAL HQ vs REGIONAL COMMAND - Dynamic Persona Navigation
      ...(isRegionalStaff ? [
        {
          to: "/regional-ops",
          icon: Activity,
          label: `Regional Command (${regionDisplayName})`,
          section: "dashboard",
          roles: ['super_admin', 'admin', 'operations_manager', 'regional_manager', 'regional_procurement_lead', 'regional_finance_officer', 'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor', 'store_operations_auditor']
        }
      ] : [
        {
          to: "/admin",
          icon: Activity,
          label: "Central Operations",
          section: "dashboard",
          roles: ['super_admin', 'admin', 'operations_manager', 'store_operations_auditor']
        }
      ]),

      // POS
      { to: "/pos", icon: ShoppingCart, label: "POS Terminal", section: "pos", roles: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor'] },

      // POS COMMAND CENTER - Store management & regional operations
      { to: "/pos-dashboard", icon: Eye, label: "POS Command", section: "pos", roles: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor', 'operations_manager', 'regional_manager', 'auditor', 'store_operations_auditor'] },

      // SALES - Management & Auditing (Cashiers blocked from historical revenue)
      { to: "/sales", icon: FileText, label: "Sales History", section: "sales", roles: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'auditor', 'finance_manager', 'cs_manager', 'store_supervisor', 'operations_manager', 'regional_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'demand_planner', 'replenishment_planner', 'store_operations_auditor'] },

      // MERCHANDISING
      { to: "/pricing", icon: Tags, label: "Merchandising", section: "pricing", roles: ['super_admin', 'merchandising_manager', 'merchandiser', 'finance_manager', 'regional_manager', 'operations_manager', 'store_operations_auditor'] },

      // FINANCE
      { to: "/finance", icon: DollarSign, label: "Financials", section: "finance", roles: ['super_admin', 'auditor', 'finance_manager', 'regional_manager', 'operations_manager', 'accountant', 'payroll_specialist', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'] },

      // CUSTOMERS
      { to: "/customers", icon: Users, label: "Customers", section: "customers", roles: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'cs_manager', 'store_supervisor', 'operations_manager', 'regional_manager', 'credit_control_officer'] },

      // EMPLOYEES - Corporate HR & Operations Executive Suite only (Site managers onboard via POS Command & WMS Dashboard)
      { to: "/employees", icon: Briefcase, label: "Employees", section: "employees", roles: ['super_admin', 'admin', 'hr', 'hr_manager', 'operations_manager', 'regional_manager', 'training_coordinator', 'payroll_specialist', 'talent_recruiter'] },

      // SETTINGS
      { to: "/settings", icon: Settings, label: "Settings", section: "settings", roles: ['super_admin', 'admin', 'it_support', 'security_manager', 'regional_manager', 'operations_manager', 'auditor'] },
    ];

    // Filter by role AND site-type context
    let filteredItems = allItems.filter(item => {
      const isSuperAdminOrCeo = userRole === 'super_admin' || (userRole as string)?.toLowerCase() === 'ceo';
      const hasRole = item.roles.includes(userRole) || isSuperAdminOrCeo;

      const siteType = activeSite?.type || '';
      const isStore = ['Store', 'Dark Store', 'Retail', 'POS'].includes(siteType);
      const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
      const isHQ = !isStore && !isWarehouse;

      if (native.isCleanMobileMode()) {
        // On Mobile/Android: retail stores get POS & sales; warehouses get WMS & inventory
        if (isStore) {
          return ['/pos', '/pos-dashboard', '/sales'].includes(item.to);
        }
        const mobileAllowed = ['/wms-ops', '/wms-dashboard', '/inventory', '/sales'];
        return mobileAllowed.includes(item.to);
      }

      let isAllowedForSite = true;

      if (isWarehouse) {
        // ═══ WAREHOUSE / FULFILLMENT SITE CONTEXT ═══
        // Warehouse Manager view: WMS Dashboard, Fulfillment, Inventory, Procurement, Staff.
        // POS, Sales, Customers, Merchandising, Financials, and Settings are strictly hidden for floor workers.
        // Departmental specialists retain access to their respective modules.
        const isMerchandisingSpecialist = item.section === 'pricing' && ['merchandising_manager', 'merchandiser'].includes(userRole);
        const isFinanceSpecialist = item.section === 'finance' && ['finance_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'auditor'].includes(userRole);

        if (['pos', 'sales', 'customers', 'pricing', 'finance', 'settings'].includes(item.section)) {
          if (!isMerchandisingSpecialist && !isFinanceSpecialist) {
            isAllowedForSite = false;
          }
        }
        if (item.to === '/network-inventory' || item.to === '/roadmap') {
          isAllowedForSite = false;
        }
        // Central Operations button is kept for CEO & operational leadership to return to HQ
        if (item.to === '/admin' && !isSuperAdminOrCeo && !['regional_manager', 'operations_manager'].includes(userRole)) {
          isAllowedForSite = false;
        }
      } else if (isStore) {
        // ═══ STORE / POS SITE CONTEXT ═══
        // Store Manager view: POS Terminal, POS Command, Sales, Customers, Staff.
        // POS sites strictly DO NOT have access to inventory (strictly for warehouse and distribution center).
        if (item.to === '/inventory' || item.section === 'inventory' || item.to === '/network-inventory' || item.to === '/roadmap') {
          isAllowedForSite = false;
        }

        const isMerchandisingSpecialist = item.section === 'pricing' && ['merchandising_manager', 'merchandiser'].includes(userRole);
        const isFinanceSpecialist = item.section === 'finance' && ['finance_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'auditor'].includes(userRole);
        const isProcurementSpecialist = item.section === 'procurement' && ['procurement_manager', 'supply_chain_manager', 'buyer', 'vendor_relations_manager', 'inbound_qc_inspector'].includes(userRole);

        if (['warehouse', 'inventory', 'procurement', 'pricing', 'finance', 'settings'].includes(item.section)) {
          if (!isMerchandisingSpecialist && !isFinanceSpecialist && !isProcurementSpecialist) {
            isAllowedForSite = false;
          }
        }
        // Central Operations button is kept for CEO & operational leadership to return to HQ
        if (item.to === '/admin' && !isSuperAdminOrCeo && !['regional_manager', 'operations_manager'].includes(userRole)) {
          isAllowedForSite = false;
        }
      } else if (isHQ) {
        // ═══ ADMINISTRATION / HQ SITE CONTEXT ═══
        // Executive leadership & central administration deck.
        // HIDE local physical site floor terminals: POS Terminal, POS Command, WMS Dashboard, WMS Ops.
        // Central Procurement, Network Inventory, Merchandising, Financials, and HR are fully active at Administration.
        if (['warehouse', 'pos'].includes(item.section) || item.to === '/sales') {
          isAllowedForSite = false;
        }
        if (item.to === '/inventory') {
          // In HQ, local inventory is replaced by Network View
          isAllowedForSite = false;
        }
      }

      return hasRole && isAllowedForSite;
    });

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
            // "Central Operations" for multi-site leadership: switch to Admin site before navigating
            if (item.to === '/admin' && ['super_admin', 'admin', 'regional_manager', 'operations_manager'].includes(user.role)) {
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
