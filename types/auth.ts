export type UserRole =
  // Level 1 - Global Executive
  | 'super_admin' | 'CEO' | 'ceo'
  // Level 2 - Country Executive
  | 'country_managing_director' | 'admin'
  // Level 3 - Corporate HQ Directorate Heads
  | 'head_of_operations' | 'operations_head' | 'operations_manager'
  | 'head_of_finance' | 'finance_head' | 'finance_manager'
  | 'head_of_hr' | 'hr_head' | 'hr_manager'
  | 'head_of_procurement' | 'procurement_head' | 'procurement_manager'
  | 'head_of_supply_chain' | 'supply_chain_head' | 'supply_chain_manager'
  | 'head_of_merchandising' | 'merchandising_head' | 'merchandising_manager'
  | 'head_of_it' | 'it_head'
  | 'head_of_audit' | 'audit_head'
  // Level 4 - Regional Territory Director
  | 'regional_manager'
  // Level 5 - Regional Functional Leads
  | 'regional_procurement_lead' | 'regional_finance_officer' | 'regional_hr_officer'
  | 'regional_merchandising_lead'
  | 'regional_logistics_lead' | 'regional_security_supervisor'
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
