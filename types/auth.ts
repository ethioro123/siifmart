export type UserRole =
  // Level 1 - Global Executive
  | 'group_ceo' | 'group_coo' | 'group_cfo' | 'group_cco' | 'group_csco'
  | 'group_chro' | 'group_cto' | 'group_cio' | 'group_clco' | 'group_cae'
  | 'super_admin' | 'CEO' | 'ceo'
  // Level 2 - Country Executive
  | 'country_managing_director' | 'admin'
  // Level 3 - Corporate HQ Directorate Heads
  | 'head_of_operations' | 'head_of_finance' | 'head_of_hr'
  | 'head_of_procurement' | 'head_of_supply_chain' | 'head_of_merchandising'
  | 'head_of_it' | 'head_of_audit'
  // Level 4 - Regional Operations Manager
  | 'regional_operations_manager'
  // Level 5 - Regional Department Managers
  | 'regional_procurement_manager' | 'regional_finance_manager' | 'regional_hr_manager'
  | 'regional_merchandising_manager'
  | 'regional_logistics_manager' | 'regional_security_manager'
  // Level 6 - Facility Captains
  | 'store_manager' | 'warehouse_manager'
  // Level 7 - Functional & Department Managers
  | 'logistics_manager' | 'inventory_manager' | 'security_manager'
  | 'dispatch_manager' | 'cs_manager' | 'vendor_relations_manager'
  // Level 8 - Deputy & Shift Supervisors
  | 'assistant_manager' | 'fleet_maintenance_supervisor'
  | 'store_supervisor' | 'shift_lead'
  // Level 9 - Corporate, Audit & Planning Specialists
  | 'store_operations_auditor' | 'auditor' | 'payroll_specialist'
  | 'treasury_officer' | 'tax_compliance_officer' | 'credit_control_officer'
  | 'accountant' | 'data_analyst' | 'training_coordinator' | 'talent_recruiter'
  | 'hr_generalist' | 'merchandising_specialist' | 'customs_import_specialist'
  | 'it_support' | 'dispatcher' | 'buyer' | 'demand_planner'
  | 'replenishment_planner' | 'inbound_qc_inspector' | 'loss_prevention'
  // Level 10 - Frontline Store, Warehouse & Fleet Staff
  | 'cashier' | 'sales_associate' | 'pos' | 'merchandiser'
  | 'inventory_specialist' | 'customer_service' | 'stock_clerk'
  | 'picker' | 'packer' | 'receiver' | 'returns_clerk'
  | 'driver' | 'forklift_operator'
  // Legacy roles (for backwards compatibility during migration)
  | 'hr';

export type PaymentMethod = 'Cash' | 'Card' | 'Mobile Money';

export type ThemeMode = 'dark' | 'light';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  title: string;
  jobTitle?: string;
  siteId?: string;
  email?: string;
  employeeId?: string;
  code?: string;
  country?: string;
  country_code?: string;
  regionCode?: string;
  region_code?: string;
  scopeLevel?: 'HQ' | 'REGIONAL';
  scope_level?: 'HQ' | 'REGIONAL';
  loginLocation?: string;
}

export interface StoreContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  loading: boolean;
}
