import { User } from '../types';

export const MOCK_USERS: User[] = [
  // CENTRAL OPS (ADMIN-001) - NOT an operational site
  { id: 'u1', name: 'Shukri Kamal', role: 'super_admin', avatar: 'https://ui-avatars.com/api/?name=Shukri+Kamal&background=0D8ABC&color=fff', title: 'Chief Executive Officer', siteId: 'Administration' },
  { id: 'u2', name: 'Sara Tesfaye', role: 'operations_manager', avatar: 'https://ui-avatars.com/api/?name=Sara+Tesfaye&background=6366F1&color=fff', title: 'System Administrator', siteId: 'Administration' },
  { id: 'u3', name: 'Tigist Alemayehu', role: 'hr_manager', avatar: 'https://ui-avatars.com/api/?name=Tigist+Alemayehu&background=EC4899&color=fff', title: 'HR Manager', siteId: 'Administration' },
  { id: 'u4', name: 'Rahel Tesfaye', role: 'finance_manager', avatar: 'https://ui-avatars.com/api/?name=Rahel+Tesfaye&background=10B981&color=fff', title: 'Finance Manager', siteId: 'Administration' },
  { id: 'u5', name: 'Yohannes Bekele', role: 'procurement_manager', avatar: 'https://ui-avatars.com/api/?name=Yohannes+Bekele&background=F59E0B&color=fff', title: 'Procurement Manager', siteId: 'Administration' },
  { id: 'u6', name: 'Selamawit Girma', role: 'customer_service', avatar: 'https://ui-avatars.com/api/?name=Selamawit+Girma&background=8B5CF6&color=fff', title: 'Customer Service Manager', siteId: 'Administration' },
  { id: 'u7', name: 'Dawit Haile', role: 'auditor', avatar: 'https://ui-avatars.com/api/?name=Dawit+Haile&background=EF4444&color=fff', title: 'Financial Auditor', siteId: 'Administration' },
  { id: 'u8', name: 'Elias Kebede', role: 'it_support', avatar: 'https://ui-avatars.com/api/?name=Elias+Kebede&background=3B82F6&color=fff', title: 'IT Support Specialist', siteId: 'Administration' },

  // WAREHOUSE - Main Distribution Hub (WH-001)
  { id: 'u9', name: 'Lensa Merga', role: 'warehouse_manager', avatar: 'https://ui-avatars.com/api/?name=Lensa+Merga&background=059669&color=fff', title: 'Warehouse Manager', siteId: 'WH-001' },
  { id: 'u10', name: 'Betelhem Bekele', role: 'dispatch_manager', avatar: 'https://ui-avatars.com/api/?name=Betelhem+Bekele&background=7C3AED&color=fff', title: 'Warehouse Dispatcher', siteId: 'WH-001' },
  { id: 'u11', name: 'Hanna Mulugeta', role: 'inventory_specialist', avatar: 'https://ui-avatars.com/api/?name=Hanna+Mulugeta&background=DB2777&color=fff', title: 'Inventory Specialist', siteId: 'WH-001' },
  { id: 'u12', name: 'Meron Yilma', role: 'picker', avatar: 'https://ui-avatars.com/api/?name=Meron+Yilma&background=0891B2&color=fff', title: 'Order Picker', siteId: 'WH-001' },
  { id: 'u13', name: 'Mulugeta Tadesse', role: 'driver', avatar: 'https://ui-avatars.com/api/?name=Mulugeta+Tadesse&background=2563EB&color=fff', title: 'Delivery Driver', siteId: 'WH-001' },

  // STORE - Bole Retail Branch (ST-001)
  { id: 'u14', name: 'Abdi Rahman', role: 'store_manager', avatar: 'https://ui-avatars.com/api/?name=Abdi+Rahman&background=0D9488&color=fff', title: 'Store Manager', siteId: 'ST-001' },
  { id: 'u15', name: 'Sara Bekele', role: 'shift_lead', avatar: 'https://ui-avatars.com/api/?name=Sara+Bekele&background=C026D3&color=fff', title: 'Store Supervisor', siteId: 'ST-001' },
  { id: 'u16', name: 'Tomas Tesfaye', role: 'cashier', avatar: 'https://ui-avatars.com/api/?name=Tomas+Tesfaye&background=0284C7&color=fff', title: 'Cashier', siteId: 'ST-001' },

  // STORE - Ambo Retail Store (ST-002)
  { id: 'u17', name: 'Sara Mohammed', role: 'store_manager', avatar: 'https://ui-avatars.com/api/?name=Sara+Mohammed&background=7C3AED&color=fff', title: 'Store Manager', siteId: 'ST-002' },
  { id: 'u18', name: 'Helen Kebede', role: 'shift_lead', avatar: 'https://ui-avatars.com/api/?name=Helen+Kebede&background=16A34A&color=fff', title: 'Store Supervisor', siteId: 'ST-002' },
  { id: 'u19', name: 'Tomas Dinka', role: 'cashier', avatar: 'https://ui-avatars.com/api/?name=Tomas+Dinka&background=CA8A04&color=fff', title: 'Cashier', siteId: 'ST-002' },

  // STORE - Adama Retail Outlet (ST-003)
  { id: 'u20', name: 'Hanna Girma', role: 'store_manager', avatar: 'https://ui-avatars.com/api/?name=Hanna+Girma&background=DB2777&color=fff', title: 'Store Manager', siteId: 'ST-003' },
  { id: 'u21', name: 'Yonas Tadesse', role: 'shift_lead', avatar: 'https://ui-avatars.com/api/?name=Yonas+Tadesse&background=2563EB&color=fff', title: 'Store Supervisor', siteId: 'ST-003' },
  { id: 'u22', name: 'Kebede Alemu', role: 'cashier', avatar: 'https://ui-avatars.com/api/?name=Kebede+Alemu&background=F97316&color=fff', title: 'Cashier', siteId: 'ST-003' },

  // STORE - Jimma Retail Hub (ST-004)
  { id: 'u23', name: 'Ahmed Hassan', role: 'store_manager', avatar: 'https://ui-avatars.com/api/?name=Ahmed+Hassan&background=0891B2&color=fff', title: 'Store Manager', siteId: 'ST-004' },
  { id: 'u24', name: 'Meseret Tadesse', role: 'shift_lead', avatar: 'https://ui-avatars.com/api/?name=Meseret+Tadesse&background=A855F7&color=fff', title: 'Store Supervisor', siteId: 'ST-004' },
  { id: 'u25', name: 'Dawit Bekele', role: 'cashier', avatar: 'https://ui-avatars.com/api/?name=Dawit+Bekele&background=14B8A6&color=fff', title: 'Cashier', siteId: 'ST-004' },

  // STORE - Harar Retail Center (ST-005)
  { id: 'u26', name: 'Solomon Tesfaye', role: 'store_manager', avatar: 'https://ui-avatars.com/api/?name=Solomon+Tesfaye&background=DC2626&color=fff', title: 'Store Manager', siteId: 'ST-005' },
  { id: 'u27', name: 'Almaz Haile', role: 'shift_lead', avatar: 'https://ui-avatars.com/api/?name=Almaz+Haile&background=EC4899&color=fff', title: 'Store Supervisor', siteId: 'ST-005' },
  { id: 'u28', name: 'Yared Girma', role: 'cashier', avatar: 'https://ui-avatars.com/api/?name=Yared+Girma&background=8B5CF6&color=fff', title: 'Cashier', siteId: 'ST-005' },

  // STORE - Dire Dawa Retail Store (ST-006)
  { id: 'u29', name: 'Fatima Yusuf', role: 'store_manager', avatar: 'https://ui-avatars.com/api/?name=Fatima+Yusuf&background=EA580C&color=fff', title: 'Store Manager', siteId: 'ST-006' },
  { id: 'u30', name: 'Biruk Tesfaye', role: 'shift_lead', avatar: 'https://ui-avatars.com/api/?name=Biruk+Tesfaye&background=10B981&color=fff', title: 'Store Supervisor', siteId: 'ST-006' },
  { id: 'u31', name: 'Selam Bekele', role: 'cashier', avatar: 'https://ui-avatars.com/api/?name=Selam+Bekele&background=3B82F6&color=fff', title: 'Cashier', siteId: 'ST-006' },
];
