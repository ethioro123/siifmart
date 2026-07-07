export type UserRole =
  // Level 1 - Executive
  | 'super_admin'
  // Level 2 - Regional/Directors
  | 'regional_manager' | 'operations_manager' | 'finance_manager'
  | 'hr_manager' | 'procurement_manager' | 'supply_chain_manager'
  // Level 3 - Site Managers
  | 'store_manager' | 'warehouse_manager' | 'dispatch_manager'
  | 'assistant_manager' | 'shift_lead' | 'store_supervisor'
  // Level 4 - Staff
  | 'cashier' | 'sales_associate' | 'stock_clerk' | 'picker' | 'packer'
  | 'receiver' | 'driver' | 'forklift_operator' | 'inventory_specialist'
  | 'customer_service' | 'auditor' | 'it_support'
  // Legacy roles (for backwards compatibility during migration)
  | 'admin' | 'hr' | 'pos' | 'dispatcher'
  | 'cs_manager' | 'returns_clerk' | 'merchandiser' | 'loss_prevention'
  | 'accountant' | 'data_analyst' | 'training_coordinator'
  // New roles
  | 'buyer' | 'demand_planner' | 'inventory_manager' | 'logistics_manager' | 'security_manager';

export type PaymentMethod = 'Cash' | 'Card' | 'Mobile Money';

export type ThemeMode = 'dark' | 'light';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  title: string;
  siteId?: string;
  email?: string;
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
