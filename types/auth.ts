export type UserRole =
  // Level 1 - Global Executive
  | 'group_ceo' | 'group_coo' | 'group_cfo' | 'group_cco' | 'group_cmo' | 'group_csco'
  | 'group_chro' | 'group_cto' | 'group_cio' | 'group_clco' | 'group_cae'
  | 'super_admin' | 'CEO' | 'ceo'
  // Level 2 - Country Executive
  | 'country_managing_director' | 'admin'
  | 'country_operations_director' | 'country_finance_director'
  | 'country_commercial_director' | 'country_supply_chain_director'
  | 'country_hr_director' | 'country_technology_director'
  | 'country_compliance_manager'
  // Level 3 - Corporate HQ Directorate Heads
  | 'head_of_operations' | 'head_of_finance' | 'head_of_hr'
  | 'head_of_procurement' | 'head_of_supply_chain' | 'head_of_merchandising'
  | 'head_of_it' | 'head_of_audit'
  // Level 4 - Regional Operations & Area Managers
  | 'regional_operations_manager' | 'area_operations_manager'
  // Level 5 - Regional Department Managers
  | 'regional_supply_chain_manager'
  | 'regional_procurement_manager' | 'regional_finance_manager' | 'regional_hr_manager'
  | 'regional_merchandising_manager'
  | 'regional_logistics_manager' | 'regional_security_manager'
  | 'regional_it_manager' | 'regional_compliance_manager'
  // Level 6 - Facility Captains
  | 'store_manager' | 'warehouse_manager'
  // Level 7 - Functional & Department Managers
  | 'warehouse_operations_manager' | 'transport_fleet_manager'
  | 'logistics_manager' | 'inventory_manager' | 'security_manager'
  | 'dispatch_manager' | 'cs_manager' | 'vendor_relations_manager'
  // Level 8 - Deputy & Shift Supervisors & Team Leaders
  | 'assistant_store_manager' | 'assistant_manager'
  | 'shift_supervisor' | 'store_supervisor' | 'shift_lead'
  | 'receiving_supervisor' | 'stock_control_supervisor' | 'pos_supervisor'
  | 'inventory_control_supervisor' | 'putaway_replenishment_supervisor'
  | 'picking_supervisor' | 'packing_supervisor' | 'dispatch_supervisor'
  | 'returns_waste_supervisor' | 'fleet_maintenance_supervisor'
  | 'inbound_operations_supervisor' | 'outbound_operations_supervisor'
  | 'receiving_team_leader' | 'picking_team_leader' | 'packing_team_leader'
  | 'dispatch_team_leader'
  // Level 9 - Corporate, Audit & Planning Specialists
  | 'store_operations_auditor' | 'auditor' | 'payroll_specialist'
  | 'treasury_officer' | 'tax_compliance_officer' | 'credit_control_officer'
  | 'cash_office_officer' | 'accountant' | 'data_analyst' | 'training_coordinator'
  | 'talent_recruiter' | 'hr_generalist' | 'merchandising_specialist'
  | 'customs_import_specialist' | 'it_support' | 'dispatcher' | 'buyer'
  | 'demand_planner' | 'replenishment_planner' | 'inbound_qc_inspector'
  | 'loss_prevention'
  // Level 10 - Frontline Store, Warehouse & Fleet Staff
  | 'cashier' | 'store_associate' | 'sales_associate' | 'pos' | 'merchandiser'
  | 'inventory_specialist' | 'customer_service' | 'stock_clerk'
  | 'receiving_operator' | 'putaway_operator' | 'replenishment_operator'
  | 'inventory_controller' | 'stock_counter' | 'dispatch_operator'
  | 'returns_operator' | 'fleet_mechanic'
  | 'picker' | 'packer' | 'receiver' | 'returns_clerk'
  | 'driver' | 'forklift_operator' | 'warehouse_administrator'
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
  reports_to_employee_id?: string;
  functional_manager_employee_id?: string;
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
