import { useSidebarDismiss } from '../hooks/useSidebarDismiss';

import React, { useEffect, useRef } from 'react';
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
import { ACTION_PERMISSIONS } from '../services/permissions.matrix';

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
        `flex min-h-11 items-center gap-3 border-l-2 px-4 py-3 rounded-xl transition-colors duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${isActive
          ? 'bg-[var(--theme-accent-muted)] text-[var(--theme-text-primary)] border-[var(--theme-accent)] font-semibold'
          : 'border-transparent text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)]'
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
  const drawerRef = useRef<HTMLElement>(null);
  useSidebarDismiss(drawerRef, isSidebarOpen, toggleSidebar);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasSidebarOpenRef = useRef(false);

  useEffect(() => {
    if (isSidebarOpen) {
      closeButtonRef.current?.focus();
    } else if (wasSidebarOpenRef.current) {
      document.querySelector<HTMLButtonElement>('[aria-label="Toggle sidebar"]')?.focus();
    }
    wasSidebarOpenRef.current = isSidebarOpen;
  }, [isSidebarOpen]);

  if (!user) return null;

  // Regional Scope & Dynamic Persona Navigation
  const isRegionalStaff = isRegionalUser || user.scopeLevel === 'REGIONAL' || user.scope_level === 'REGIONAL' || ['regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_merchandising_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'regional_it_manager', 'regional_compliance_manager'].includes(user.role);

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

  // Regional leadership clicking "Regional Command": return activeSite to the Regional Hub for their region
  const handleRegionalCommandClick = () => {
    if (targetRegionCode) {
      const regionalHub = sites.find(s =>
        (s.regionCode === targetRegionCode || (s as any).region_code === targetRegionCode) &&
        (s.type === 'Administration' || s.type === 'Administrative')
      );
      if (regionalHub && activeSite?.id !== regionalHub.id) {
        setActiveSite(regionalHub.id);
      }
    }
    toggleSidebar();
  };


  // --- ADVANCED NAVIGATION LOGIC ---
  // Map each nav item to its required permission section
  const getNavItems = (userRole: UserRole) => {
    const allItems = [
      // WMS DASHBOARD - Overview (Managers Only)
      { to: "/wms-dashboard", icon: LayoutDashboard, label: "WMS Dashboard", section: "warehouse", roles: ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_supply_chain_director', 'warehouse_manager', 'dispatcher', 'inventory_specialist', 'regional_operations_manager', 'area_operations_manager', 'regional_logistics_manager', 'inventory_manager', 'regional_supply_chain_manager', 'fleet_maintenance_supervisor'] },

      // NETWORK INVENTORY - Executive & Supply Chain Leadership
      { to: "/network-inventory", icon: Globe, label: "Network View", section: "inventory", roles: ['group_ceo', 'country_managing_director', 'country_supply_chain_director', 'country_operations_director', 'country_compliance_manager', 'auditor', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_merchandising_manager', 'regional_logistics_manager', 'replenishment_planner', 'demand_planner'] },

      // INVENTORY - Strictly Warehouse & Distribution Center Only
      { to: "/inventory", icon: Package, label: "Inventory", section: "inventory", roles: ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_supply_chain_director', 'warehouse_manager', 'dispatcher', 'dispatch_supervisor', 'country_compliance_manager', 'auditor', 'inventory_specialist', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_merchandising_manager', 'regional_logistics_manager', 'inventory_manager', 'inbound_qc_inspector', 'replenishment_planner', 'demand_planner', 'fleet_maintenance_supervisor', 'store_operations_auditor'] },

      // FULFILLMENT (WMS) - Warehouse staff & operations leadership
      { to: "/wms-ops", icon: ClipboardList, label: "Fulfillment", section: "warehouse", roles: ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_supply_chain_director', 'warehouse_manager', 'dispatch_supervisor', 'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'stock_clerk', 'returns_clerk', 'inventory_specialist', 'regional_operations_manager', 'area_operations_manager', 'regional_logistics_manager', 'inventory_manager', 'regional_supply_chain_manager', 'inbound_qc_inspector', 'replenishment_planner', 'fleet_maintenance_supervisor'] },
      { to: "/online-store", icon: Globe, label: "Online Operations", section: "warehouse", roles: ['group_ceo', 'country_managing_director', 'warehouse_manager', 'country_operations_director', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_logistics_manager'] },

      // PROCUREMENT - Corporate administration, procurement & operational leadership
      { to: "/procurement", icon: Truck, label: "Procurement", section: "procurement", roles: ['group_ceo', 'country_managing_director', 'country_commercial_director', 'country_finance_director', 'country_supply_chain_director', 'country_operations_director', 'buyer', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_logistics_manager', 'replenishment_planner'] },
      { to: "/purchase-requests", icon: ClipboardList, label: "Purchase Requests", section: "requests", roles: Object.keys(ACTION_PERMISSIONS) },

      // ROADMAP - CEO Only (Confidential Strategic Canvas)
      { to: "/roadmap", icon: Map, label: "Roadmap", section: "dashboard", roles: ['group_ceo'] },

      // CENTRAL HQ vs REGIONAL COMMAND - Dynamic Persona Navigation
      ...(isRegionalStaff ? [
        {
          to: "/regional-ops",
          icon: Activity,
          label: `Regional Command (${regionDisplayName})`,
          section: "dashboard",
          roles: ['group_ceo', 'country_managing_director', 'country_operations_director', 'regional_operations_manager', 'area_operations_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_merchandising_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'regional_it_manager', 'regional_compliance_manager', 'store_operations_auditor', 'auditor', 'hr_generalist', 'talent_recruiter', 'payroll_specialist', 'training_coordinator', 'it_support', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'buyer', 'demand_planner', 'replenishment_planner', 'merchandising_specialist', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'regional_supply_chain_manager', 'inventory_manager', 'merchandiser', 'data_analyst', 'cs_manager']
        }
      ] : [
        {
          to: "/admin",
          icon: Activity,
          label: "Central Operations",
          section: "dashboard",
          roles: ['group_ceo', 'country_managing_director', 'country_operations_director', 'store_operations_auditor']
        }
      ]),

      // POS
      { to: "/pos", icon: ShoppingCart, label: "POS Terminal", section: "pos", roles: ['group_ceo', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cashier', 'sales_associate'] },

      // POS COMMAND CENTER - Store management & regional operations
      { to: "/pos-dashboard", icon: Eye, label: "POS Command", section: "pos", roles: ['group_ceo', 'country_managing_director', 'country_operations_director', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cashier', 'regional_operations_manager', 'area_operations_manager', 'regional_finance_manager', 'regional_security_manager', 'country_compliance_manager', 'auditor', 'store_operations_auditor'] },

      // SALES - Management & Auditing (Cashiers blocked from historical revenue)
      { to: "/sales", icon: FileText, label: "Sales History", section: "sales", roles: ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_supply_chain_director', 'country_compliance_manager', 'auditor', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cs_manager', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_merchandising_manager', 'regional_finance_manager', 'regional_security_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'demand_planner', 'replenishment_planner', 'store_operations_auditor'] },

      // MERCHANDISING
      { to: "/pricing", icon: Tags, label: "Merchandising", section: "pricing", roles: ['group_ceo', 'country_managing_director', 'country_commercial_director', 'merchandising_specialist', 'regional_merchandising_manager', 'country_finance_director', 'country_operations_director', 'country_supply_chain_director', 'merchandiser', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_finance_manager', 'regional_procurement_manager', 'store_operations_auditor'] },

      // FINANCE
      { to: "/finance", icon: DollarSign, label: "Financials", section: "finance", roles: ['group_ceo', 'country_managing_director', 'country_finance_director', 'country_compliance_manager', 'auditor', 'country_operations_director', 'regional_operations_manager', 'area_operations_manager', 'regional_finance_manager', 'accountant', 'payroll_specialist', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'] },

      // CUSTOMERS
      { to: "/customers", icon: Users, label: "Customers", section: "customers", roles: ['group_ceo', 'country_managing_director', 'country_operations_director', 'store_manager', 'assistant_store_manager', 'shift_supervisor', 'cashier', 'sales_associate', 'cs_manager', 'regional_operations_manager', 'area_operations_manager', 'credit_control_officer'] },

      // EMPLOYEES - Corporate HR & Operations Executive Suite only (Site managers onboard via POS Command & WMS Dashboard)
      { to: "/employees", icon: Briefcase, label: "Employees", section: "employees", roles: ['group_ceo', 'country_managing_director', 'country_hr_director', 'hr_generalist', 'country_operations_director', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_merchandising_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_logistics_manager', 'regional_security_manager', 'training_coordinator', 'payroll_specialist', 'talent_recruiter'] },

      // SETTINGS
      { to: "/settings", icon: Settings, label: "Settings", section: "settings", roles: ['group_ceo', 'country_managing_director', 'country_operations_director', 'country_finance_director', 'country_hr_director', 'country_commercial_director', 'country_supply_chain_director', 'country_technology_director', 'it_support', 'country_compliance_manager', 'auditor', 'regional_security_manager', 'regional_operations_manager', 'area_operations_manager'] },
    ];

    // Filter by role AND site-type context
    let filteredItems = allItems.filter(item => {
      const isExecutive = userRole === 'group_ceo' || userRole === 'country_managing_director';
      const isSuperAdminOrCeo = userRole === 'group_ceo';
      const hasRole = item.roles.includes(userRole) || isExecutive;

      const siteType = activeSite?.type || '';
      const isStore = ['Store', 'Retail', 'POS'].includes(siteType);
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

      // Global CEO has 100% complete access and operation to all modules
      if (isSuperAdminOrCeo) {
        return true;
      }

      let isAllowedForSite = true;

      if (isWarehouse) {
        // ═══ WAREHOUSE / FULFILLMENT SITE CONTEXT ═══
        // Warehouse Manager view: WMS Dashboard, Fulfillment, Inventory, Procurement, Staff.
        // POS, Sales, Customers, Merchandising, Financials, and Settings are strictly hidden for floor workers.
        // Departmental specialists and regional officers retain access to their respective modules.
        const isMerchandisingSpecialist = item.section === 'pricing' && ['country_commercial_director', 'merchandising_specialist', 'regional_merchandising_manager', 'merchandiser', 'regional_procurement_manager', 'regional_operations_manager', 'area_operations_manager'].includes(userRole);
        const isFinanceSpecialist = item.section === 'finance' && ['country_finance_director', 'regional_finance_manager', 'regional_operations_manager', 'area_operations_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'country_compliance_manager', 'auditor'].includes(userRole);
        const isSalesSpecialist = item.section === 'sales' && ['regional_finance_manager', 'regional_security_manager', 'regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'country_supply_chain_director', 'demand_planner', 'replenishment_planner', 'country_compliance_manager', 'auditor', 'store_operations_auditor'].includes(userRole);
        const isSettingsSpecialist = item.section === 'settings' && ['regional_security_manager', 'regional_operations_manager', 'area_operations_manager', 'country_technology_director', 'it_support', 'country_compliance_manager', 'auditor', 'country_finance_director', 'country_hr_director', 'country_commercial_director', 'country_supply_chain_director'].includes(userRole);
        const isCustomersSpecialist = item.section === 'customers' && ['regional_operations_manager', 'area_operations_manager', 'cs_manager'].includes(userRole);
        const isPosCommandSpecialist = item.to === '/pos-dashboard' && ['regional_finance_manager', 'regional_security_manager', 'regional_operations_manager', 'area_operations_manager', 'store_operations_auditor'].includes(userRole);

        if (['pos', 'sales', 'customers', 'pricing', 'finance', 'settings'].includes(item.section)) {
          if (!isMerchandisingSpecialist && !isFinanceSpecialist && !isSalesSpecialist && !isSettingsSpecialist && !isCustomersSpecialist && !isPosCommandSpecialist) {
            isAllowedForSite = false;
          }
        }
        if (item.to === '/network-inventory' && !['regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_logistics_manager', 'country_supply_chain_director', 'replenishment_planner'].includes(userRole) && !isExecutive) {
          isAllowedForSite = false;
        }
        if (item.to === '/roadmap') {
          isAllowedForSite = false;
        }
        // Central Operations button is kept for CEO & national operational leadership to return to HQ
        if (item.to === '/admin' && !isSuperAdminOrCeo && !['country_managing_director', 'country_operations_director'].includes(userRole)) {
          isAllowedForSite = false;
        }
      } else if (isStore) {
        // ═══ STORE / POS SITE CONTEXT ═══
        // Store Manager view: POS Terminal, POS Command, Sales, Customers, Staff.
        // POS sites strictly DO NOT have access to inventory for store staff (strictly for warehouse and distribution center).
        const isRegionalInventoryOrLogistics = ['regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager', 'regional_logistics_manager', 'regional_procurement_manager', 'regional_security_manager', 'country_supply_chain_director', 'replenishment_planner'].includes(userRole);

        if ((item.to === '/inventory' || item.section === 'inventory' || item.to === '/network-inventory') && !isRegionalInventoryOrLogistics && !isExecutive) {
          isAllowedForSite = false;
        }
        if (item.to === '/roadmap') {
          isAllowedForSite = false;
        }

        const isMerchandisingSpecialist = item.section === 'pricing' && ['country_commercial_director', 'merchandising_specialist', 'regional_merchandising_manager', 'merchandiser', 'regional_procurement_manager', 'regional_operations_manager', 'area_operations_manager'].includes(userRole);
        const isFinanceSpecialist = item.section === 'finance' && ['country_finance_director', 'regional_finance_manager', 'regional_operations_manager', 'area_operations_manager', 'accountant', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'country_compliance_manager', 'auditor'].includes(userRole);
        const isProcurementSpecialist = item.section === 'procurement' && ['country_commercial_director', 'country_finance_director', 'country_supply_chain_director', 'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_logistics_manager', 'regional_operations_manager', 'area_operations_manager', 'buyer', 'vendor_relations_manager', 'inbound_qc_inspector'].includes(userRole);
        const isWarehouseSpecialist = item.section === 'warehouse' && ['regional_logistics_manager', 'regional_operations_manager', 'area_operations_manager', 'country_supply_chain_director', 'regional_supply_chain_manager'].includes(userRole);
        const isSettingsSpecialist = item.section === 'settings' && ['regional_security_manager', 'regional_operations_manager', 'area_operations_manager', 'country_technology_director', 'it_support', 'country_compliance_manager', 'auditor', 'country_finance_director', 'country_hr_director', 'country_commercial_director', 'country_supply_chain_director'].includes(userRole);

        if (['warehouse', 'inventory', 'procurement', 'pricing', 'finance', 'settings'].includes(item.section)) {
          if (!isMerchandisingSpecialist && !isFinanceSpecialist && !isProcurementSpecialist && !isWarehouseSpecialist && !isSettingsSpecialist && !isRegionalInventoryOrLogistics && !isExecutive) {
            isAllowedForSite = false;
          }
        }
        // Central Operations button is kept for CEO & national operational leadership to return to HQ
        if (item.to === '/admin' && !isSuperAdminOrCeo && !['country_managing_director', 'country_operations_director'].includes(userRole)) {
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
        if (item.to === '/wms-ops' && !['regional_logistics_manager', 'regional_supply_chain_manager', 'country_supply_chain_director'].includes(userRole)) {
          isAllowedForSite = false;
        }
        if (item.to === '/inventory' && !['regional_logistics_manager', 'regional_supply_chain_manager', 'regional_security_manager'].includes(userRole)) {
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
        aria-hidden="true"
        className={`fixed inset-0 z-[1000] bg-black/40 transition-opacity duration-200 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-[1001]
        w-72 bg-[var(--theme-bg-card)] border-r border-[var(--theme-border)]
        transform transition-transform duration-200 ease-out
        flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        ref={drawerRef}
        id="main-navigation-drawer"
        role="dialog"
        aria-label="Navigation menu"
        aria-modal={isSidebarOpen}
        aria-hidden={!isSidebarOpen}
        inert={!isSidebarOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            toggleSidebar();
            return;
          }
          if (event.key !== 'Tab' || !isSidebarOpen) return;
          const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[var(--theme-border)]">
          <Logo size={22} />
          <button ref={closeButtonRef} type="button" onClick={toggleSidebar} className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-3 sm:px-4 space-y-1 overflow-y-auto custom-scrollbar py-4">
          <p className="px-4 text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-3">Menu</p>
          {navItems.map(item => {
            const Icon = item.icon;
            // "Central Operations" for national multi-site leadership: switch to Admin site before navigating
            if (item.to === '/admin' && ['group_ceo', 'country_managing_director', 'country_operations_director'].includes(user.role)) {
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={handleAdminClick}
                  className="w-full min-h-11 flex items-center gap-3 border-l-2 border-transparent px-4 py-3 rounded-xl transition-colors duration-200 group text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-subtle)] hover:text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
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
                onClick={item.to === '/regional-ops' ? handleRegionalCommandClick : toggleSidebar}
              />
            );
          })}
        </nav>

      </aside >
    </>
  );
}
