
import { Product, SaleRecord, User, WarehouseZone, StockMovement, WMSJob, Supplier, PurchaseOrder, Customer, Employee, Promotion, PricingRule, EmployeeTask, ExpenseRecord, Site } from './types';

export const MOCK_USERS: User[] = [
  // ============================================================================
  // CENTRAL OPS (ADMIN-001) - NOT an operational site
  // ============================================================================
  {
    id: 'u1',
    name: 'Shukri Kamal',
    role: 'super_admin',
    avatar: 'https://ui-avatars.com/api/?name=Shukri+Kamal&background=0D8ABC&color=fff',
    title: 'Chief Executive Officer',
    siteId: 'Administration'
  },
  {
    id: 'u2',
    name: 'Sara Tesfaye',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Sara+Tesfaye&background=6366F1&color=fff',
    title: 'System Administrator',
    siteId: 'Administration'
  },
  {
    id: 'u3',
    name: 'Tigist Alemayehu',
    role: 'hr',
    avatar: 'https://ui-avatars.com/api/?name=Tigist+Alemayehu&background=EC4899&color=fff',
    title: 'HR Manager',
    siteId: 'Administration'
  },
  {
    id: 'u4',
    name: 'Rahel Tesfaye',
    role: 'finance_manager',
    avatar: 'https://ui-avatars.com/api/?name=Rahel+Tesfaye&background=10B981&color=fff',
    title: 'Finance Manager',
    siteId: 'Administration'
  },
  {
    id: 'u5',
    name: 'Yohannes Bekele',
    role: 'procurement_manager',
    avatar: 'https://ui-avatars.com/api/?name=Yohannes+Bekele&background=F59E0B&color=fff',
    title: 'Procurement Manager',
    siteId: 'Administration'
  },
  {
    id: 'u6',
    name: 'Selamawit Girma',
    role: 'cs_manager',
    avatar: 'https://ui-avatars.com/api/?name=Selamawit+Girma&background=8B5CF6&color=fff',
    title: 'Customer Service Manager',
    siteId: 'Administration'
  },
  {
    id: 'u7',
    name: 'Dawit Haile',
    role: 'auditor',
    avatar: 'https://ui-avatars.com/api/?name=Dawit+Haile&background=EF4444&color=fff',
    title: 'Financial Auditor',
    siteId: 'Administration'
  },
  {
    id: 'u8',
    name: 'Elias Kebede',
    role: 'it_support',
    avatar: 'https://ui-avatars.com/api/?name=Elias+Kebede&background=3B82F6&color=fff',
    title: 'IT Support Specialist',
    siteId: 'Administration'
  },

  // ============================================================================
  // WAREHOUSE - Main Distribution Hub (WH-001)
  // ============================================================================
  {
    id: 'u9',
    name: 'Lensa Merga',
    role: 'warehouse_manager',
    avatar: 'https://ui-avatars.com/api/?name=Lensa+Merga&background=059669&color=fff',
    title: 'Warehouse Manager',
    siteId: 'WH-001'
  },
  {
    id: 'u10',
    name: 'Betelhem Bekele',
    role: 'dispatcher',
    avatar: 'https://ui-avatars.com/api/?name=Betelhem+Bekele&background=7C3AED&color=fff',
    title: 'Warehouse Dispatcher',
    siteId: 'WH-001'
  },
  {
    id: 'u11',
    name: 'Hanna Mulugeta',
    role: 'inventory_specialist',
    avatar: 'https://ui-avatars.com/api/?name=Hanna+Mulugeta&background=DB2777&color=fff',
    title: 'Inventory Specialist',
    siteId: 'WH-001'
  },
  {
    id: 'u12',
    name: 'Meron Yilma',
    role: 'picker',
    avatar: 'https://ui-avatars.com/api/?name=Meron+Yilma&background=0891B2&color=fff',
    title: 'Order Picker',
    siteId: 'WH-001'
  },
  {
    id: 'u13',
    name: 'Mulugeta Tadesse',
    role: 'driver',
    avatar: 'https://ui-avatars.com/api/?name=Mulugeta+Tadesse&background=2563EB&color=fff',
    title: 'Delivery Driver',
    siteId: 'WH-001'
  },

  // ============================================================================
  // STORE - Bole Retail Branch (ST-001)
  // ============================================================================
  {
    id: 'u14',
    name: 'Abdi Rahman',
    role: 'manager',
    avatar: 'https://ui-avatars.com/api/?name=Abdi+Rahman&background=0D9488&color=fff',
    title: 'Store Manager',
    siteId: 'ST-001'
  },
  {
    id: 'u15',
    name: 'Sara Bekele',
    role: 'store_supervisor',
    avatar: 'https://ui-avatars.com/api/?name=Sara+Bekele&background=C026D3&color=fff',
    title: 'Store Supervisor',
    siteId: 'ST-001'
  },
  {
    id: 'u16',
    name: 'Tomas Tesfaye',
    role: 'pos',
    avatar: 'https://ui-avatars.com/api/?name=Tomas+Tesfaye&background=0284C7&color=fff',
    title: 'Cashier',
    siteId: 'ST-001'
  },

  // ============================================================================
  // STORE - Ambo Retail Store (ST-002)
  // ============================================================================
  {
    id: 'u17',
    name: 'Sara Mohammed',
    role: 'manager',
    avatar: 'https://ui-avatars.com/api/?name=Sara+Mohammed&background=7C3AED&color=fff',
    title: 'Store Manager',
    siteId: 'ST-002'
  },
  {
    id: 'u18',
    name: 'Helen Kebede',
    role: 'store_supervisor',
    avatar: 'https://ui-avatars.com/api/?name=Helen+Kebede&background=16A34A&color=fff',
    title: 'Store Supervisor',
    siteId: 'ST-002'
  },
  {
    id: 'u19',
    name: 'Tomas Dinka',
    role: 'pos',
    avatar: 'https://ui-avatars.com/api/?name=Tomas+Dinka&background=CA8A04&color=fff',
    title: 'Cashier',
    siteId: 'ST-002'
  },

  // ============================================================================
  // STORE - Adama Retail Outlet (ST-003)
  // ============================================================================
  {
    id: 'u20',
    name: 'Hanna Girma',
    role: 'manager',
    avatar: 'https://ui-avatars.com/api/?name=Hanna+Girma&background=DB2777&color=fff',
    title: 'Store Manager',
    siteId: 'ST-003'
  },
  {
    id: 'u21',
    name: 'Yonas Tadesse',
    role: 'store_supervisor',
    avatar: 'https://ui-avatars.com/api/?name=Yonas+Tadesse&background=2563EB&color=fff',
    title: 'Store Supervisor',
    siteId: 'ST-003'
  },
  {
    id: 'u22',
    name: 'Kebede Alemu',
    role: 'pos',
    avatar: 'https://ui-avatars.com/api/?name=Kebede+Alemu&background=F97316&color=fff',
    title: 'Cashier',
    siteId: 'ST-003'
  },

  // ============================================================================
  // STORE - Jimma Retail Hub (ST-004)
  // ============================================================================
  {
    id: 'u23',
    name: 'Ahmed Hassan',
    role: 'manager',
    avatar: 'https://ui-avatars.com/api/?name=Ahmed+Hassan&background=0891B2&color=fff',
    title: 'Store Manager',
    siteId: 'ST-004'
  },
  {
    id: 'u24',
    name: 'Meseret Tadesse',
    role: 'store_supervisor',
    avatar: 'https://ui-avatars.com/api/?name=Meseret+Tadesse&background=A855F7&color=fff',
    title: 'Store Supervisor',
    siteId: 'ST-004'
  },
  {
    id: 'u25',
    name: 'Dawit Bekele',
    role: 'pos',
    avatar: 'https://ui-avatars.com/api/?name=Dawit+Bekele&background=14B8A6&color=fff',
    title: 'Cashier',
    siteId: 'ST-004'
  },

  // ============================================================================
  // STORE - Harar Retail Center (ST-005)
  // ============================================================================
  {
    id: 'u26',
    name: 'Solomon Tesfaye',
    role: 'manager',
    avatar: 'https://ui-avatars.com/api/?name=Solomon+Tesfaye&background=DC2626&color=fff',
    title: 'Store Manager',
    siteId: 'ST-005'
  },
  {
    id: 'u27',
    name: 'Almaz Haile',
    role: 'store_supervisor',
    avatar: 'https://ui-avatars.com/api/?name=Almaz+Haile&background=EC4899&color=fff',
    title: 'Store Supervisor',
    siteId: 'ST-005'
  },
  {
    id: 'u28',
    name: 'Yared Girma',
    role: 'pos',
    avatar: 'https://ui-avatars.com/api/?name=Yared+Girma&background=8B5CF6&color=fff',
    title: 'Cashier',
    siteId: 'ST-005'
  },

  // ============================================================================
  // STORE - Dire Dawa Retail Store (ST-006)
  // ============================================================================
  {
    id: 'u29',
    name: 'Fatima Yusuf',
    role: 'manager',
    avatar: 'https://ui-avatars.com/api/?name=Fatima+Yusuf&background=EA580C&color=fff',
    title: 'Store Manager',
    siteId: 'ST-006'
  },
  {
    id: 'u30',
    name: 'Biruk Tesfaye',
    role: 'store_supervisor',
    avatar: 'https://ui-avatars.com/api/?name=Biruk+Tesfaye&background=10B981&color=fff',
    title: 'Store Supervisor',
    siteId: 'ST-006'
  },
  {
    id: 'u31',
    name: 'Selam Bekele',
    role: 'pos',
    avatar: 'https://ui-avatars.com/api/?name=Selam+Bekele&background=3B82F6&color=fff',
    title: 'Cashier',
    siteId: 'ST-006'
  }
];

export const MOCK_SITES: Site[] = [
  // Administrative Ops
  { id: 'Administration', code: 'ADMIN', name: 'Central Operations', type: 'Administration', address: 'Addis Ababa, Bole', status: 'Active', manager: 'Shukri Kamal' },
  // Warehouses & Stores
  { id: 'WH-001', code: 'WH-001', name: 'Main Distribution Hub', type: 'Warehouse', address: 'Addis Ababa, Zone 4', status: 'Active', capacity: 85, manager: 'Lensa Merga' },
  { id: 'ST-001', code: 'ST-001', name: 'Bole Retail Branch', type: 'Store', address: 'Bole Road, Addis Ababa', status: 'Active', terminalCount: 4, manager: 'Abdi Rahman' },
  { id: 'ST-002', code: 'ST-002', name: 'Ambo Retail Store', type: 'Store', address: 'Ambo, West Shewa', status: 'Active', terminalCount: 3, manager: 'Sara Mohammed' },
  { id: 'ST-003', code: 'ST-003', name: 'Adama Retail Outlet', type: 'Store', address: 'Adama, East Shewa', status: 'Active', terminalCount: 3, manager: 'Hanna Girma' },
  { id: 'ST-004', code: 'ST-004', name: 'Jimma Retail Hub', type: 'Store', address: 'Jimma, Oromia', status: 'Active', terminalCount: 3, manager: 'Ahmed Hassan' },
  { id: 'ST-005', code: 'ST-005', name: 'Harar Retail Center', type: 'Store', address: 'Harar, Harari', status: 'Active', terminalCount: 3, manager: 'Solomon Tesfaye' },
  { id: 'ST-006', code: 'ST-006', name: 'Dire Dawa Retail Store', type: 'Store', address: 'Dire Dawa', status: 'Active', terminalCount: 3, manager: 'Fatima Yusuf' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  // ============================================================================
  // EXECUTIVE LEADERSHIP (ADMIN)
  // ============================================================================
  {
    id: 'EMP-001', code: 'SIIF-001',
    siteId: 'WH-001',
    name: 'Shukri Kamal',
    role: 'super_admin',
    email: 'shukri.kamal@siifmart.com',
    phone: '+251 911 000 001',
    status: 'Active',
    joinDate: '2020-01-01',
    department: 'Executive',
    avatar: 'https://ui-avatars.com/api/?name=Shukri+Kamal&background=0D8ABC&color=fff',
    performanceScore: 100,
    specialization: 'Strategic Leadership',
    salary: 120000,
    badges: ['Founder', 'Visionary', 'CEO'],
    attendanceRate: 100
  },
  {
    id: 'EMP-002', code: 'SIIF-002',
    siteId: 'WH-001',
    name: 'Sara Tesfaye',
    role: 'admin',
    email: 'sara.tesfaye@siifmart.com',
    phone: '+251 911 000 002',
    status: 'Active',
    joinDate: '2020-02-01',
    department: 'IT & Systems',
    avatar: 'https://ui-avatars.com/api/?name=Sara+Tesfaye&background=6366F1&color=fff',
    performanceScore: 98,
    specialization: 'System Administration',
    salary: 45000,
    badges: ['Tech Lead', 'Security Expert'],
    attendanceRate: 100
  },

  // ============================================================================
  // MANAGEMENT TEAM (ADMIN)
  // ============================================================================
  {
    id: 'EMP-003', code: 'SIIF-003',
    siteId: 'WH-001',
    name: 'Tigist Alemayehu',
    role: 'hr',
    email: 'tigist.alemayehu@siifmart.com',
    phone: '+251 911 000 003',
    status: 'Active',
    joinDate: '2020-03-15',
    department: 'Human Resources',
    avatar: 'https://ui-avatars.com/api/?name=Tigist+Alemayehu&background=EC4899&color=fff',
    performanceScore: 96,
    specialization: 'Talent Management',
    salary: 38000,
    badges: ['People Champion', 'Culture Builder'],
    attendanceRate: 99
  },
  {
    id: 'EMP-004', code: 'SIIF-004',
    siteId: 'WH-001',
    name: 'Rahel Tesfaye',
    role: 'finance_manager',
    email: 'rahel.tesfaye@siifmart.com',
    phone: '+251 911 000 004',
    status: 'Active',
    joinDate: '2020-04-01',
    department: 'Finance',
    avatar: 'https://ui-avatars.com/api/?name=Rahel+Tesfaye&background=10B981&color=fff',
    performanceScore: 97,
    specialization: 'Financial Planning',
    salary: 42000,
    badges: ['CFO', 'Budget Master'],
    attendanceRate: 100
  },
  {
    id: 'EMP-005', code: 'SIIF-005',
    siteId: 'WH-001',
    name: 'Yohannes Bekele',
    role: 'procurement_manager',
    email: 'yohannes.bekele@siifmart.com',
    phone: '+251 911 000 005',
    status: 'Active',
    joinDate: '2020-05-01',
    department: 'Procurement',
    avatar: 'https://ui-avatars.com/api/?name=Yohannes+Bekele&background=F59E0B&color=fff',
    performanceScore: 95,
    specialization: 'Supply Chain',
    salary: 40000,
    badges: ['Negotiator', 'Supplier Relations'],
    attendanceRate: 98
  },
  {
    id: 'EMP-006', code: 'SIIF-006',
    siteId: 'WH-001',
    name: 'Selamawit Girma',
    role: 'cs_manager',
    email: 'selamawit.girma@siifmart.com',
    phone: '+251 911 000 006',
    status: 'Active',
    joinDate: '2020-06-01',
    department: 'Customer Service',
    avatar: 'https://ui-avatars.com/api/?name=Selamawit+Girma&background=8B5CF6&color=fff',
    performanceScore: 94,
    specialization: 'Customer Experience',
    salary: 36000,
    badges: ['Customer First', 'Service Excellence'],
    attendanceRate: 97
  },
  {
    id: 'EMP-007', code: 'SIIF-007',
    siteId: 'WH-001',
    name: 'Dawit Haile',
    role: 'auditor',
    email: 'dawit.haile@siifmart.com',
    phone: '+251 911 000 007',
    status: 'Active',
    joinDate: '2021-01-15',
    department: 'Finance',
    avatar: 'https://ui-avatars.com/api/?name=Dawit+Haile&background=EF4444&color=fff',
    performanceScore: 96,
    specialization: 'Financial Auditing',
    salary: 38000,
    badges: ['Compliance Expert', 'Detail Oriented'],
    attendanceRate: 99
  },
  {
    id: 'EMP-008', code: 'SIIF-008',
    siteId: 'WH-001',
    name: 'Elias Kebede',
    role: 'it_support',
    email: 'elias.kebede@siifmart.com',
    phone: '+251 911 000 008',
    status: 'Active',
    joinDate: '2021-02-01',
    department: 'IT & Systems',
    avatar: 'https://ui-avatars.com/api/?name=Elias+Kebede&background=3B82F6&color=fff',
    performanceScore: 93,
    specialization: 'Technical Support',
    salary: 32000,
    badges: ['Problem Solver', 'Quick Response'],
    attendanceRate: 96
  },

  // ============================================================================
  // WAREHOUSE OPERATIONS - Main Distribution Hub (WH-001)
  // ============================================================================
  {
    id: 'EMP-009', code: 'SIIF-009',
    siteId: 'WH-001',
    name: 'Lensa Merga',
    role: 'warehouse_manager',
    email: 'lensa.merga@siifmart.com',
    phone: '+251 911 000 009',
    status: 'Active',
    joinDate: '2021-03-01',
    department: 'Logistics & Warehouse',
    avatar: 'https://ui-avatars.com/api/?name=Lensa+Merga&background=059669&color=fff',
    performanceScore: 92,
    specialization: 'Warehouse Operations',
    salary: 35000,
    badges: ['Efficiency Guru', 'Safety First'],
    attendanceRate: 96
  },
  {
    id: 'EMP-010', code: 'SIIF-010',
    siteId: 'WH-001',
    name: 'Betelhem Bekele',
    role: 'dispatcher',
    email: 'betelhem.bekele@siifmart.com',
    phone: '+251 911 000 010',
    status: 'Active',
    joinDate: '2021-04-01',
    department: 'Logistics & Warehouse',
    avatar: 'https://ui-avatars.com/api/?name=Betelhem+Bekele&background=7C3AED&color=fff',
    performanceScore: 90,
    specialization: 'Job Coordination',
    salary: 28000,
    badges: ['Coordinator', 'Team Player'],
    attendanceRate: 95
  },
  {
    id: 'EMP-011', code: 'SIIF-011',
    siteId: 'WH-001',
    name: 'Hanna Mulugeta',
    role: 'inventory_specialist',
    email: 'hanna.mulugeta@siifmart.com',
    phone: '+251 911 000 011',
    status: 'Active',
    joinDate: '2021-05-01',
    department: 'Logistics & Warehouse',
    avatar: 'https://ui-avatars.com/api/?name=Hanna+Mulugeta&background=DB2777&color=fff',
    performanceScore: 91,
    specialization: 'Inventory Management',
    salary: 26000,
    badges: ['Accuracy Expert', 'Detail Master'],
    attendanceRate: 97
  },
  {
    id: 'EMP-012', code: 'SIIF-012',
    siteId: 'WH-001',
    name: 'Meron Yilma',
    role: 'picker',
    email: 'meron.yilma@siifmart.com',
    phone: '+251 911 000 012',
    status: 'Active',
    joinDate: '2022-01-15',
    department: 'Logistics & Warehouse',
    avatar: 'https://ui-avatars.com/api/?name=Meron+Yilma&background=0891B2&color=fff',
    performanceScore: 88,
    specialization: 'Order Picking',
    salary: 18000,
    badges: ['Speed Picker', 'Accuracy'],
    attendanceRate: 94
  },
  {
    id: 'EMP-013', code: 'SIIF-013',
    siteId: 'WH-001',
    name: 'Betelhem Yilma',
    role: 'picker',
    email: 'betelhem.yilma@siifmart.com',
    phone: '+251 911 000 013',
    status: 'Active',
    joinDate: '2022-02-01',
    department: 'Logistics & Warehouse',
    avatar: 'https://ui-avatars.com/api/?name=Betelhem+Yilma&background=DC2626&color=fff',
    performanceScore: 87,
    specialization: 'Order Picking',
    salary: 18000,
    badges: ['Fast Worker'],
    attendanceRate: 93
  },
  {
    id: 'EMP-014', code: 'SIIF-014',
    siteId: 'WH-001',
    name: 'Helen Getachew',
    role: 'picker',
    email: 'helen.getachew@siifmart.com',
    phone: '+251 911 000 014',
    status: 'Active',
    joinDate: '2022-03-01',
    department: 'Logistics & Warehouse',
    avatar: 'https://ui-avatars.com/api/?name=Helen+Getachew&background=EA580C&color=fff',
    performanceScore: 89,
    specialization: 'Order Picking',
    salary: 18000,
    badges: ['Reliable', 'Team Player'],
    attendanceRate: 95
  },
  {
    id: 'EMP-015', code: 'SIIF-015',
    siteId: 'WH-001',
    name: 'Abebe Yilma',
    role: 'picker',
    email: 'abebe.yilma@siifmart.com',
    phone: '+251 911 000 015',
    status: 'Active',
    joinDate: '2022-04-01',
    department: 'Logistics & Warehouse',
    avatar: 'https://ui-avatars.com/api/?name=Abebe+Yilma&background=16A34A&color=fff',
    performanceScore: 86,
    specialization: 'Order Picking',
    salary: 18000,
    badges: ['Consistent'],
    attendanceRate: 92
  },
  {
    id: 'EMP-016', code: 'SIIF-016',
    siteId: 'WH-001',
    name: 'Mulugeta Tadesse',
    role: 'driver',
    email: 'mulugeta.tadesse@siifmart.com',
    phone: '+251 911 000 016',
    status: 'Active',
    joinDate: '2022-05-01',
    department: 'Logistics & Warehouse',
    avatar: 'https://ui-avatars.com/api/?name=Mulugeta+Tadesse&background=2563EB&color=fff',
    performanceScore: 90,
    specialization: 'Delivery Operations',
    salary: 20000,
    badges: ['Safe Driver', 'On-Time Delivery'],
    attendanceRate: 96
  },

  // ============================================================================
  // STORE OPERATIONS - Bole Retail Branch (ST-001)
  // ============================================================================
  {
    id: 'EMP-017', code: 'SIIF-017',
    siteId: 'ST-001',
    name: 'Abdi Rahman',
    role: 'manager',
    email: 'abdi.rahman@siifmart.com',
    phone: '+251 911 000 017',
    status: 'Active',
    joinDate: '2021-06-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Abdi+Rahman&background=0D9488&color=fff',
    performanceScore: 94,
    specialization: 'Store Management',
    salary: 32000,
    badges: ['Sales Leader', 'Customer Focus'],
    attendanceRate: 98
  },
  {
    id: 'EMP-018', code: 'SIIF-018',
    siteId: 'ST-001',
    name: 'Sara Bekele',
    role: 'store_supervisor',
    email: 'sara.bekele@siifmart.com',
    phone: '+251 911 000 018',
    status: 'Active',
    joinDate: '2021-07-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Sara+Bekele&background=C026D3&color=fff',
    performanceScore: 91,
    specialization: 'Shift Management',
    salary: 24000,
    badges: ['Team Leader', 'Organized'],
    attendanceRate: 96
  },
  {
    id: 'EMP-019', code: 'SIIF-019',
    siteId: 'ST-001',
    name: 'Tomas Tesfaye',
    role: 'pos',
    email: 'tomas.tesfaye@siifmart.com',
    phone: '+251 911 000 019',
    status: 'Active',
    joinDate: '2022-06-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Tomas+Tesfaye&background=0284C7&color=fff',
    performanceScore: 85,
    specialization: 'Customer Service',
    salary: 16000,
    badges: ['Friendly Face', 'Top Seller'],
    attendanceRate: 92
  },
  {
    id: 'EMP-020', code: 'SIIF-020',
    siteId: 'ST-001',
    name: 'Tomas Dinka',
    role: 'pos',
    email: 'tomas.dinka@siifmart.com',
    phone: '+251 911 000 020',
    status: 'Active',
    joinDate: '2022-07-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Tomas+Dinka&background=CA8A04&color=fff',
    performanceScore: 83,
    specialization: 'POS Operations',
    salary: 16000,
    badges: ['Quick Learner'],
    attendanceRate: 90
  },

  // ============================================================================
  // ADDITIONAL STORE MANAGERS (Various Stores)
  // ============================================================================
  {
    id: 'EMP-021', code: 'SIIF-021',
    siteId: 'ST-002',
    name: 'Sara Mohammed',
    role: 'manager',
    email: 'sara.mohammed@siifmart.com',
    phone: '+251 911 000 021',
    status: 'Active',
    joinDate: '2021-08-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Sara+Mohammed&background=7C3AED&color=fff',
    performanceScore: 93,
    specialization: 'Store Management',
    salary: 32000,
    badges: ['Growth Driver', 'Mentor'],
    attendanceRate: 97
  },
  {
    id: 'EMP-022', code: 'SIIF-022',
    siteId: 'ST-003',
    name: 'Hanna Girma',
    role: 'manager',
    email: 'hanna.girma@siifmart.com',
    phone: '+251 911 000 022',
    status: 'Active',
    joinDate: '2021-09-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Hanna+Girma&background=DB2777&color=fff',
    performanceScore: 92,
    specialization: 'Store Management',
    salary: 32000,
    badges: ['Community Builder'],
    attendanceRate: 96
  },
  {
    id: 'EMP-023', code: 'SIIF-023',
    siteId: 'ST-004',
    name: 'Ahmed Hassan',
    role: 'manager',
    email: 'ahmed.hassan@siifmart.com',
    phone: '+251 911 000 023',
    status: 'Active',
    joinDate: '2021-10-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Ahmed+Hassan&background=0891B2&color=fff',
    performanceScore: 91,
    specialization: 'Store Management',
    salary: 32000,
    badges: ['Innovator'],
    attendanceRate: 95
  },
  {
    id: 'EMP-024', code: 'SIIF-024',
    siteId: 'ST-005',
    name: 'Solomon Tesfaye',
    role: 'manager',
    email: 'solomon.tesfaye@siifmart.com',
    phone: '+251 911 000 024',
    status: 'Active',
    joinDate: '2021-11-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Solomon+Tesfaye&background=DC2626&color=fff',
    performanceScore: 90,
    specialization: 'Store Management',
    salary: 32000,
    badges: ['Reliable'],
    attendanceRate: 94
  },
  {
    id: 'EMP-025', code: 'SIIF-025',
    siteId: 'ST-006',
    name: 'Fatima Yusuf',
    role: 'manager',
    email: 'fatima.yusuf@siifmart.com',
    phone: '+251 911 000 025',
    status: 'Active',
    joinDate: '2021-12-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Fatima+Yusuf&background=EA580C&color=fff',
    performanceScore: 89,
    specialization: 'Store Management',
    salary: 32000,
    badges: ['Customer Champion'],
    attendanceRate: 93
  },

  // ============================================================================
  // ADDITIONAL STORE SUPERVISORS
  // ============================================================================
  {
    id: 'EMP-026', code: 'SIIF-026',
    siteId: 'ST-002',
    name: 'Helen Kebede',
    role: 'store_supervisor',
    email: 'helen.kebede@siifmart.com',
    phone: '+251 911 000 026',
    status: 'Active',
    joinDate: '2022-08-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Helen+Kebede&background=16A34A&color=fff',
    performanceScore: 88,
    specialization: 'Shift Management',
    salary: 24000,
    badges: ['Organized', 'Supportive'],
    attendanceRate: 94
  },
  {
    id: 'EMP-027', code: 'SIIF-027',
    siteId: 'ST-003',
    name: 'Yonas Tadesse',
    role: 'store_supervisor',
    email: 'yonas.tadesse@siifmart.com',
    phone: '+251 911 000 027',
    status: 'Active',
    joinDate: '2022-09-01',
    department: 'Retail Operations',
    avatar: 'https://ui-avatars.com/api/?name=Yonas+Tadesse&background=2563EB&color=fff',
    performanceScore: 87,
    specialization: 'Shift Management',
    salary: 24000,
    badges: ['Dependable'],
    attendanceRate: 93
  }
];

export const MOCK_TASKS: EmployeeTask[] = [
  { id: 'T-101', title: 'Monthly Stock Audit', description: 'Count all items in Zone A and update WMS.', assignedTo: 'EMP-002', status: 'In-Progress', priority: 'High', dueDate: '2024-03-25' },
  { id: 'T-102', title: 'Organize Checkout 3', description: 'Clean and restock bags at Counter 3.', assignedTo: 'EMP-003', status: 'Pending', priority: 'Low', dueDate: '2024-03-20' },
  { id: 'T-103', title: 'Verify PO-9002', description: 'Check incoming shipment from GreenFields.', assignedTo: 'EMP-002', status: 'Completed', priority: 'High', dueDate: '2024-03-15' },
  { id: 'T-104', title: 'Train New Cashier', description: 'Onboarding session for Mike.', assignedTo: 'EMP-003', status: 'Pending', priority: 'Medium', dueDate: '2024-03-22' },
];

export const MOCK_PRODUCTS: Product[] = [
  // WAREHOUSE PRODUCTS
  { id: '1', siteId: 'WH-001', name: 'Neon Energy Drink', category: 'Beverages', price: 450, costPrice: 250, isOnSale: false, stock: 1200, sku: 'BV-001-W', image: 'https://picsum.photos/200/200?random=1', status: 'active', location: 'A-01-04', expiryDate: '2024-12-01', shelfPosition: 'Eye Level', competitorPrice: 480, salesVelocity: 'High' },
  { id: '2', siteId: 'WH-001', name: 'Cyber Chipset v2', category: 'Electronics', price: 15000, costPrice: 9000, isOnSale: true, salePrice: 13500, stock: 150, sku: 'EL-099-W', image: 'https://picsum.photos/200/200?random=2', status: 'active', location: 'S-02-01', shelfPosition: 'Secure', competitorPrice: 14500, salesVelocity: 'Medium' },
  { id: '3', siteId: 'WH-001', name: 'Quantum Cereal', category: 'Food', price: 850, costPrice: 500, isOnSale: false, stock: 2000, sku: 'FD-102-W', image: 'https://picsum.photos/200/200?random=3', status: 'active', location: 'A-03-12', expiryDate: '2024-08-15', shelfPosition: 'Top Shelf', competitorPrice: 800, salesVelocity: 'Medium' },
  { id: '4', siteId: 'WH-001', name: 'Holo-Projector', category: 'Electronics', price: 45000, costPrice: 30000, isOnSale: false, stock: 50, sku: 'EL-200-W', image: 'https://picsum.photos/200/200?random=4', status: 'active', location: 'S-01-01', shelfPosition: 'Secure', competitorPrice: 46000, salesVelocity: 'Low' },

  // STORE PRODUCTS
  { id: '5', siteId: 'ST-001', name: 'Neon Energy Drink', category: 'Beverages', price: 450, costPrice: 250, isOnSale: false, stock: 120, sku: 'BV-001', image: 'https://picsum.photos/200/200?random=1', status: 'active', location: 'A-01-04', expiryDate: '2024-12-01', shelfPosition: 'Eye Level', competitorPrice: 480, salesVelocity: 'High' },
  { id: '6', siteId: 'ST-001', name: 'Synth-Fruit Basket', category: 'Fresh', price: 1200, costPrice: 600, isOnSale: true, salePrice: 999, stock: 45, sku: 'FR-005', image: 'https://picsum.photos/200/200?random=5', status: 'active', location: 'C-01-02', expiryDate: '2023-11-05', shelfPosition: 'End Cap', competitorPrice: 1100, salesVelocity: 'High' },
  { id: '7', siteId: 'ST-001', name: 'Data Cable 3M', category: 'Accessories', price: 300, costPrice: 50, isOnSale: false, stock: 0, sku: 'AC-999', image: 'https://picsum.photos/200/200?random=6', status: 'out_of_stock', location: 'B-05-05', shelfPosition: 'Bottom Shelf', competitorPrice: 350, salesVelocity: 'Low' },
  { id: '8', siteId: 'ST-001', name: 'Smart Water', category: 'Beverages', price: 100, costPrice: 40, isOnSale: false, stock: 500, sku: 'BV-002', image: 'https://picsum.photos/200/200?random=8', status: 'active', location: 'A-01-02', expiryDate: '2025-01-01', shelfPosition: 'Checkout', competitorPrice: 90, salesVelocity: 'High' },
];

export const MOCK_PROMOTIONS: Promotion[] = [
  { id: 'PR-01', code: 'SUMMER20', type: 'PERCENTAGE', value: 20, status: 'Active', usageCount: 145, expiryDate: '2024-06-30' },
  { id: 'PR-02', code: 'WELCOME10', type: 'FIXED', value: 100, status: 'Active', usageCount: 50, expiryDate: '2024-12-31' },
  { id: 'PR-03', code: 'FLASH50', type: 'PERCENTAGE', value: 50, status: 'Expired', usageCount: 800, expiryDate: '2023-12-31' },
];

export const MOCK_PRICING_RULES: PricingRule[] = [
  { id: 'R-01', name: 'Clearance for Old Stock', targetCategory: 'Beverages', condition: 'Expiry < X Days', threshold: 30, action: 'Decrease Price %', value: 25, isActive: true },
  { id: 'R-02', name: 'High Demand Markup', targetCategory: 'Electronics', condition: 'Stock > X', threshold: 5, action: 'Increase Price %', value: 10, isActive: false },
];

export const MOCK_ZONES: WarehouseZone[] = [
  { id: 'Z1', name: 'Zone A (General)', capacity: 1000, occupied: 750, type: 'Dry' },
  { id: 'Z2', name: 'Zone B (Small Items)', capacity: 5000, occupied: 1200, type: 'Dry' },
  { id: 'Z3', name: 'Zone C (Cold Chain)', capacity: 500, occupied: 450, temperature: '-4°C', type: 'Cold' },
  { id: 'Z4', name: 'Zone S (Secure)', capacity: 100, occupied: 25, type: 'Secure' },
];

export const MOCK_MOVEMENTS: StockMovement[] = [
  { id: 'MV-1001', siteId: 'WH-001', productId: '1', productName: 'Neon Energy Drink', type: 'IN', quantity: 200, date: '2023-10-24 08:30', performedBy: 'Sarah Connor', reason: 'PO #9921 Delivery' },
  { id: 'MV-1002', siteId: 'ST-001', productId: '6', productName: 'Synth-Fruit Basket', type: 'ADJUSTMENT', quantity: -2, date: '2023-10-24 10:00', performedBy: 'Alex Mercer', reason: 'Spoilage / Damage' },
];

export const MOCK_WMS_JOBS: WMSJob[] = [
  {
    id: 'JOB-101',
    siteId: 'WH-001',
    type: 'PICK',
    priority: 'Critical',
    status: 'In-Progress',
    items: 3,
    location: 'Zone A',
    orderRef: 'ORD-5521',
    assignedTo: 'Bob Builder',
    lineItems: [
      { productId: '1', name: 'Neon Energy Drink', sku: 'BV-001', image: 'https://picsum.photos/200/200?random=1', expectedQty: 12, pickedQty: 0, status: 'Pending' },
      { productId: '3', name: 'Quantum Cereal', sku: 'FD-102', image: 'https://picsum.photos/200/200?random=3', expectedQty: 5, pickedQty: 0, status: 'Pending' }
    ]
  },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'SUP-01', name: 'Neo-Tokyo Distrib', type: 'Business', contact: 'Mr. Tanaka', email: 'orders@neotokyo.com', category: 'Electronics', status: 'Active', rating: 4.8, leadTime: 5, taxId: 'JP-88921' },
  { id: 'SUP-02', name: 'GreenFields Corp', type: 'Business', contact: 'Sarah J.', email: 'sales@greenfields.com', category: 'Fresh', status: 'Active', rating: 4.5, leadTime: 2, taxId: 'US-55210' },
  { id: 'SUP-03', name: 'CyberBev Inc', type: 'Business', contact: 'Automated Bot', email: 'api@cyberbev.io', category: 'Beverages', status: 'Inactive', rating: 3.2, leadTime: 7 },
  { id: 'SUP-04', name: 'Adama Farmer Assoc.', type: 'Farmer', contact: 'Kebede T.', phone: '+251 911 555 444', category: 'Cereals', status: 'Active', rating: 4.9, leadTime: 3, location: 'Adama, Oromia', nationalId: 'NAT-998811' },
  { id: 'SUP-05', name: 'Spot Vendor #22', type: 'One-Time', contact: 'Unknown', category: 'Packaging', status: 'Active', rating: 3.0, leadTime: 0, location: 'Local Market' },
];

export const MOCK_PO: PurchaseOrder[] = [
  {
    id: 'PO-9001',
    siteId: 'WH-001',
    supplierId: 'SUP-01',
    supplierName: 'Neo-Tokyo Distrib',
    date: '2024-03-15',
    status: 'Pending',
    totalAmount: 450000,
    itemsCount: 50,
    expectedDelivery: '2024-03-20',
    lineItems: [
      { productId: '2', productName: 'Cyber Chipset v2', quantity: 50, unitCost: 9000, totalCost: 450000 }
    ]
  },
  {
    id: 'PO-9002',
    siteId: 'ST-001',
    supplierId: 'SUP-02',
    supplierName: 'GreenFields Corp',
    date: '2024-03-14',
    status: 'Received',
    totalAmount: 12500,
    itemsCount: 200,
    expectedDelivery: '2024-03-16',
    lineItems: [
      { productId: '5', productName: 'Synth-Fruit Basket', quantity: 200, unitCost: 62.5, totalCost: 12500 }
    ]
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', name: 'Hiro Protagonist', phone: '+251 911 111 111', email: 'hiro@meta.verse', loyaltyPoints: 1250, totalSpent: 45000, lastVisit: '2024-03-15', tier: 'Gold' },
  { id: 'CUST-002', name: 'Y.T. Courier', phone: '+251 922 222 222', email: 'yt@radiocity.com', loyaltyPoints: 450, totalSpent: 12000, lastVisit: '2024-03-14', tier: 'Silver' },
  { id: 'CUST-003', name: 'Raven Unit', phone: '+251 933 333 333', email: 'raven@security.net', loyaltyPoints: 50, totalSpent: 1500, lastVisit: '2024-02-28', tier: 'Bronze' },
];

export const RECENT_SALES: SaleRecord[] = [
  { id: 'TX-9981', siteId: 'ST-001', date: '2023-10-24 14:30', total: 4500, subtotal: 3913, tax: 587, method: 'Card', status: 'Completed', items: [], cashierName: 'John Doe' },
  { id: 'TX-9982', siteId: 'ST-001', date: '2023-10-24 14:45', total: 1200, subtotal: 1043, tax: 157, method: 'Cash', status: 'Completed', items: [], cashierName: 'John Doe' },
];

export const MOCK_EXPENSES: ExpenseRecord[] = [
  { id: 'EXP-001', siteId: 'WH-001', date: '2024-03-01', category: 'Rent', description: 'Monthly Warehouse Lease', amount: 150000, status: 'Paid', approvedBy: 'Alex Mercer' },
  { id: 'EXP-002', siteId: 'ST-001', date: '2024-03-05', category: 'Utilities', description: 'Electricity Bill (Feb)', amount: 12500, status: 'Paid', approvedBy: 'Elena Fisher' },
];

export const CURRENCY_SYMBOL = 'ETB';
