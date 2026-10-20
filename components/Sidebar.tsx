
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
  const isRegionalStaff = isRegionalUser || user.scopeLevel === 'REGIONAL' || user.scope_level === 'REGIONAL' || [
    'regional_manager',
    'regional_procurement_lead',
    'regional_finance_officer',
    'regional_merchandising_lead',
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
      { to: "/wms-dashboard", icon: LayoutDashboard, label: "WMS Dashboard", section: "warehouse", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_operations', 'operations_head', 'operations_manager', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'warehouse_manager', 'dispatcher', 'inventory_specialist', 'regional_manager', 'regional_logistics_lead', 'inventory_manager', 'logistics_manager', 'fleet_maintenance_supervisor'] },

      // NETWORK INVENTORY - Executive & Supply Chain Leadership
      { to: "/network-inventory", icon: Globe, label: "Network View", section: "inventory", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'head_of_operations', 'operations_head', 'operations_manager', 'head_of_audit', 'audit_head', 'auditor', 'regional_manager', 'regional_procurement_lead', 'regional_logistics_lead', 'replenishment_planner'] },

      // INVENTORY - Strictly Warehouse & Distribution Center Only
      { to: "/inventory", icon: Package, label: "Inventory", section: "inventory", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_operations', 'operations_head', 'operations_manager', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'warehouse_manager', 'dispatcher', 'dispatch_manager', 'head_of_audit', 'audit_head', 'auditor', 'inventory_specialist', 'regional_manager', 'regional_procurement_lead', 'regional_logistics_lead', 'regional_security_supervisor', 'inventory_manager', 'inbound_qc_inspector', 'replenishment_planner', 'fleet_maintenance_supervisor', 'store_operations_auditor'] },

      // FULFILLMENT (WMS) - Warehouse staff & operations leadership
      { to: "/wms-ops", icon: ClipboardList, label: "Fulfillment", section: "warehouse", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_operations', 'operations_head', 'operations_manager', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'warehouse_manager', 'dispatch_manager', 'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'stock_clerk', 'returns_clerk', 'inventory_specialist', 'regional_manager', 'regional_logistics_lead', 'inventory_manager', 'logistics_manager', 'inbound_qc_inspector', 'replenishment_planner', 'fleet_maintenance_supervisor'] },

      // PROCUREMENT - Corporate administration, procurement & operational leadership
      { to: "/procurement", icon: Truck, label: "Procurement", section: "procurement", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_procurement', 'procurement_head', 'procurement_manager', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'head_of_operations', 'operations_head', 'operations_manager', 'buyer', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'regional_manager', 'regional_procurement_lead', 'regional_logistics_lead', 'replenishment_planner'] },

      // ROADMAP - CEO Only (Confidential Strategic Canvas)
      { to: "/roadmap", icon: Map, label: "Roadmap", section: "dashboard", roles: ['super_admin'] },

      // CENTRAL HQ vs REGIONAL COMMAND - Dynamic Persona Navigation
      ...(isRegionalStaff ? [
        {
          to: "/regional-ops",
          icon: Activity,
          label: `Regional Command (${regionDisplayName})`,
          section: "dashboard",
          roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_operations', 'operations_head', 'operations_manager', 'regional_manager', 'regional_procurement_lead', 'regional_finance_officer', 'regional_merchandising_lead', 'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor', 'store_operations_auditor', 'auditor', 'hr', 'hr_generalist', 'talent_recruiter', 'payroll_specialist', 'training_coordinator', 'it_support', 'security_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'buyer', 'demand_planner', 'replenishment_planner', 'merchandising_specialist', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'logistics_manager', 'inventory_manager', 'merchandiser', 'data_analyst', 'cs_manager']
        }
      ] : [
        {
          to: "/admin",
          icon: Activity,
          label: "Central Operations",
          section: "dashboard",
          roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_operations', 'operations_head', 'operations_manager', 'store_operations_auditor']
        }
      ]),

      // POS
      { to: "/pos", icon: ShoppingCart, label: "POS Terminal", section: "pos", roles: ['super_admin', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor'] },

      // POS COMMAND CENTER - Store management & regional operations
      { to: "/pos-dashboard", icon: Eye, label: "POS Command", section: "pos", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_operations', 'operations_head', 'operations_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'store_supervisor', 'regional_manager', 'regional_finance_officer', 'regional_security_supervisor', 'head_of_audit', 'audit_head', 'auditor', 'store_operations_auditor'] },

      // SALES - Management & Auditing (Cashiers blocked from historical revenue)
      { to: "/sales", icon: FileText, label: "Sales History", section: "sales", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_operations', 'operations_head', 'operations_manager', 'head_of_finance', 'finance_head', 'finance_manager', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'head_of_audit', 'audit_head', 'auditor', 'store_manager', 'assistant_manager', 'shift_lead', 'cs_manager', 'store_supervisor', 'regional_manager', 'regional_finance_officer', 'regional_security_supervisor', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'demand_planner', 'replenishment_planner', 'store_operations_auditor'] },

      // MERCHANDISING
      { to: "/pricing", icon: Tags, label: "Merchandising", section: "pricing", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_merchandising', 'merchandising_head', 'merchandising_manager', 'merchandising_specialist', 'regional_merchandising_lead', 'head_of_finance', 'finance_head', 'finance_manager', 'head_of_operations', 'operations_head', 'operations_manager', 'merchandiser', 'regional_manager', 'regional_procurement_lead', 'store_operations_auditor'] },
      { to: "/online-store", icon: Globe, label: "Online Store", section: "pricing", roles: ['head_of_merchandising', 'merchandising_head', 'merchandising_manager', 'merchandising_specialist', 'regional_merchandising_lead'] },

      // FINANCE
      { to: "/finance", icon: DollarSign, label: "Financials", section: "finance", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_finance', 'finance_head', 'finance_manager', 'head_of_audit', 'audit_head', 'auditor', 'head_of_operations', 'operations_head', 'operations_manager', 'regional_manager', 'regional_finance_officer', 'accountant', 'payroll_specialist', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'] },

      // CUSTOMERS
      { to: "/customers", icon: Users, label: "Customers", section: "customers", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_operations', 'operations_head', 'operations_manager', 'store_manager', 'assistant_manager', 'shift_lead', 'pos', 'cs_manager', 'store_supervisor', 'regional_manager', 'regional_procurement_lead', 'credit_control_officer'] },

      // EMPLOYEES - Corporate HR & Operations Executive Suite only (Site managers onboard via POS Command & WMS Dashboard)
      { to: "/employees", icon: Briefcase, label: "Employees", section: "employees", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_hr', 'hr_head', 'hr_manager', 'hr', 'head_of_operations', 'operations_head', 'operations_manager', 'regional_manager', 'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor', 'training_coordinator', 'payroll_specialist', 'talent_recruiter', 'hr_generalist'] },

      // SETTINGS
      { to: "/settings", icon: Settings, label: "Settings", section: "settings", roles: ['super_admin', 'country_managing_director', 'admin', 'head_of_it', 'it_head', 'it_support', 'head_of_audit', 'audit_head', 'auditor', 'security_manager', 'regional_manager', 'regional_security_supervisor', 'head_of_operations', 'operations_head', 'operations_manager'] },
    ];

    // Filter by role AND site-type context
    let filteredItems = allItems.filter(item => {
      const isExecutive = userRole === 'super_admin' || userRole === 'admin' || userRole === 'country_managing_director' || (userRole as string)?.toLowerCase() === 'ceo';
      const isSuperAdminOrCeo = userRole === 'super_admin' || (userRole as string)?.toLowerCase() === 'ceo';
      const hasRole = item.roles.includes(userRole) || isExecutive;

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
        // Departmental specialists and regional officers retain access to their respective modules.
        const isMerchandisingSpecialist = item.section === 'pricing' && ['head_of_merchandising', 'merchandising_head', 'merchandising_manager', 'merchandising_specialist', 'regional_merchandising_lead', 'merchandiser', 'regional_procurement_lead', 'regional_manager'].includes(userRole);
        const isFinanceSpecialist = item.section === 'finance' && ['head_of_finance', 'finance_head', 'finance_manager', 'regional_finance_officer', 'regional_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'head_of_audit', 'audit_head', 'auditor'].includes(userRole);
        const isSalesSpecialist = item.section === 'sales' && ['regional_finance_officer', 'regional_security_supervisor', 'regional_manager', 'head_of_audit', 'audit_head', 'auditor', 'store_operations_auditor'].includes(userRole);
        const isSettingsSpecialist = item.section === 'settings' && ['regional_security_supervisor', 'regional_manager', 'security_manager', 'head_of_it', 'it_head', 'it_support', 'head_of_audit', 'audit_head', 'auditor'].includes(userRole);
        const isCustomersSpecialist = item.section === 'customers' && ['regional_procurement_lead', 'regional_manager', 'cs_manager'].includes(userRole);
        const isPosCommandSpecialist = item.to === '/pos-dashboard' && ['regional_finance_officer', 'regional_security_supervisor', 'regional_manager', 'store_operations_auditor'].includes(userRole);

        if (['pos', 'sales', 'customers', 'pricing', 'finance', 'settings'].includes(item.section)) {
          if (!isMerchandisingSpecialist && !isFinanceSpecialist && !isSalesSpecialist && !isSettingsSpecialist && !isCustomersSpecialist && !isPosCommandSpecialist) {
            isAllowedForSite = false;
          }
        }
        if (item.to === '/network-inventory' && !['regional_manager', 'regional_procurement_lead', 'regional_logistics_lead', 'head_of_supply_chain', 'supply_chain_manager', 'replenishment_planner'].includes(userRole) && !isExecutive) {
          isAllowedForSite = false;
        }
        if (item.to === '/roadmap') {
          isAllowedForSite = false;
        }
        // Central Operations button is kept for CEO & operational leadership to return to HQ
        if (item.to === '/admin' && !isSuperAdminOrCeo && !['country_managing_director', 'admin', 'regional_manager', 'head_of_operations', 'operations_manager'].includes(userRole)) {
          isAllowedForSite = false;
        }
      } else if (isStore) {
        // ═══ STORE / POS SITE CONTEXT ═══
        // Store Manager view: POS Terminal, POS Command, Sales, Customers, Staff.
        // POS sites strictly DO NOT have access to inventory for store staff (strictly for warehouse and distribution center).
        const isRegionalInventoryOrLogistics = ['regional_manager', 'regional_logistics_lead', 'regional_procurement_lead', 'regional_security_supervisor', 'head_of_supply_chain', 'supply_chain_manager', 'replenishment_planner'].includes(userRole);

        if ((item.to === '/inventory' || item.section === 'inventory' || item.to === '/network-inventory') && !isRegionalInventoryOrLogistics && !isExecutive) {
          isAllowedForSite = false;
        }
        if (item.to === '/roadmap') {
          isAllowedForSite = false;
        }

        const isMerchandisingSpecialist = item.section === 'pricing' && ['head_of_merchandising', 'merchandising_head', 'merchandising_manager', 'merchandising_specialist', 'regional_merchandising_lead', 'merchandiser', 'regional_procurement_lead', 'regional_manager'].includes(userRole);
        const isFinanceSpecialist = item.section === 'finance' && ['head_of_finance', 'finance_head', 'finance_manager', 'regional_finance_officer', 'regional_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'head_of_audit', 'audit_head', 'auditor'].includes(userRole);
        const isProcurementSpecialist = item.section === 'procurement' && ['head_of_procurement', 'procurement_head', 'procurement_manager', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'regional_procurement_lead', 'regional_logistics_lead', 'regional_manager', 'buyer', 'vendor_relations_manager', 'inbound_qc_inspector'].includes(userRole);
        const isWarehouseSpecialist = item.section === 'warehouse' && ['regional_logistics_lead', 'regional_manager', 'head_of_supply_chain', 'supply_chain_manager', 'logistics_manager'].includes(userRole);
        const isSettingsSpecialist = item.section === 'settings' && ['regional_security_supervisor', 'regional_manager', 'security_manager', 'head_of_it', 'it_head', 'it_support', 'head_of_audit', 'audit_head', 'auditor'].includes(userRole);

        if (['warehouse', 'inventory', 'procurement', 'pricing', 'finance', 'settings'].includes(item.section)) {
          if (!isMerchandisingSpecialist && !isFinanceSpecialist && !isProcurementSpecialist && !isWarehouseSpecialist && !isSettingsSpecialist && !isRegionalInventoryOrLogistics && !isExecutive) {
            isAllowedForSite = false;
          }
        }
        // Central Operations button is kept for CEO & operational leadership to return to HQ
        if (item.to === '/admin' && !isSuperAdminOrCeo && !['country_managing_director', 'admin', 'regional_manager', 'head_of_operations', 'operations_manager'].includes(userRole)) {
          isAllowedForSite = false;
        }
      } else if (isHQ) {
        // ═══ ADMINISTRATION / HQ / REGIONAL HUB SITE CONTEXT ═══
        // Executive leadership & central/regional administration deck.
        // HIDE physical floor operational tools: POS Terminal and WMS Fulfillment scanning (except for regional logistics lead inspecting WMS ops).
        // Management overviews (WMS Dashboard, POS Command, Sales History, Network View, Procurement, Financials, HR) remain accessible.
        if (item.to === '/pos') {
          isAllowedForSite = false;
        }
        if (item.to === '/wms-ops' && userRole !== 'regional_logistics_lead') {
          isAllowedForSite = false;
        }
        if (item.to === '/inventory' && !['regional_logistics_lead', 'regional_security_supervisor'].includes(userRole)) {
          // In HQ, local single-facility inventory is replaced by Network View
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
