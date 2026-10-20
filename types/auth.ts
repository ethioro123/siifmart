export type UserRole =
  // Level 1 - Executive
  | 'super_admin' | 'CEO' | 'ceo'
  // Level 2 - Regional/Directors
  | 'regional_manager' | 'operations_manager' | 'finance_manager'
  | 'hr_manager' | 'procurement_manager' | 'supply_chain_manager'
  | 'merchandising_manager'
  // Level 3 - Site Managers & Supervisors
  | 'store_manager' | 'warehouse_manager' | 'dispatch_manager'
  | 'assistant_manager' | 'shift_lead' | 'store_supervisor'
  | 'fleet_maintenance_supervisor'
  // Level 4 - Staff
  | 'cashier' | 'sales_associate' | 'stock_clerk' | 'picker' | 'packer'
  | 'receiver' | 'driver' | 'forklift_operator' | 'inventory_specialist'
  | 'customer_service' | 'auditor' | 'it_support'
  // Legacy roles (for backwards compatibility during migration)
  | 'admin' | 'hr' | 'pos' | 'dispatcher'
  | 'cs_manager' | 'returns_clerk' | 'merchandiser' | 'loss_prevention'
  | 'accountant' | 'data_analyst' | 'training_coordinator' | 'hr_generalist'
  // Regional Administration Roles (Flexible Territorial Team)
  | 'regional_procurement_lead' | 'regional_finance_officer' | 'regional_hr_officer'
  | 'regional_logistics_lead' | 'regional_security_supervisor'
  // New roles
  | 'buyer' | 'demand_planner' | 'inventory_manager' | 'logistics_manager' | 'security_manager'
  | 'payroll_specialist' | 'talent_recruiter' | 'replenishment_planner'
  | 'vendor_relations_manager' | 'customs_import_specialist' | 'inbound_qc_inspector'
  | 'treasury_officer' | 'tax_compliance_officer' | 'credit_control_officer'
  | 'store_operations_auditor';

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
