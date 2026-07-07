import { UserRole, Employee } from '../../types';

export interface HierarchyNode {
    role: string;
    label: string;
    dept: string;
    reportsTo: string | null;
    children?: HierarchyNode[];
}

export const DEPT_COLORS: Record<string, { bg: string; bgDark: string; border: string; borderDark: string; text: string; textDark: string; dot: string }> = {
    executive:   { bg: '#f0f4f0', bgDark: '#1a2e1e', border: '#2C5E3B', borderDark: '#A9CBA2', text: '#1a3a22', textDark: '#A9CBA2', dot: '#2C5E3B' },
    store:       { bg: '#faf8f5', bgDark: '#232E27', border: '#4D6E56', borderDark: '#6a8f72', text: '#2C4D35', textDark: '#b8d4bc', dot: '#4D6E56' },
    warehouse:   { bg: '#f2f7f2', bgDark: '#1d2c20', border: '#3a6644', borderDark: '#7aab82', text: '#1e4028', textDark: '#9dc4a4', dot: '#3a6644' },
    finance:     { bg: '#fdf9f0', bgDark: '#2a2618', border: '#8a7340', borderDark: '#c8aa60', text: '#5a4a20', textDark: '#d4bc7a', dot: '#8a7340' },
    hr:          { bg: '#faf5f0', bgDark: '#2a2018', border: '#8a5a30', borderDark: '#c47840', text: '#5a3018', textDark: '#d4945a', dot: '#8a5a30' },
    procurement: { bg: '#f5f8f5', bgDark: '#1e2c22', border: '#567a5e', borderDark: '#8ab492', text: '#2a4e32', textDark: '#a8c8b0', dot: '#567a5e' },
    support:     { bg: '#f5f5f3', bgDark: '#21271e', border: '#6b7a6e', borderDark: '#8ea090', text: '#3a4a3c', textDark: '#9eb0a0', dot: '#6b7a6e' },
};

export const ROLE_LABELS: Record<string, string> = {
    super_admin: 'CEO',
    regional_manager: 'Regional Manager',
    operations_manager: 'Operations Manager',
    finance_manager: 'Finance Manager',
    hr_manager: 'HR Manager',
    procurement_manager: 'Procurement Manager',
    supply_chain_manager: 'Supply Chain Mgr',
    store_manager: 'Store Manager',
    warehouse_manager: 'Warehouse Manager',
    logistics_manager: 'Logistics Manager',
    inventory_manager: 'Inventory Manager',
    security_manager: 'Security Manager',
    dispatch_manager: 'Dispatch Manager',
    assistant_manager: 'Asst. Manager',
    shift_lead: 'Shift Lead',
    cashier: 'Cashier',
    sales_associate: 'Sales Associate',
    stock_clerk: 'Stock Clerk',
    customer_service: 'Customer Service',
    auditor: 'Auditor',
    it_support: 'IT Support',
    picker: 'Picker',
    packer: 'Packer',
    receiver: 'Receiver',
    driver: 'Driver',
    forklift_operator: 'Forklift Op.',
    inventory_specialist: 'Inventory Spec.',
    buyer: 'Sourcing Buyer',
    demand_planner: 'Demand Planner',
    admin: 'Admin (Legacy)',
    manager: 'Manager',
    hr: 'HR',
    pos: 'POS Staff',
    dispatcher: 'Dispatcher',
    cs_manager: 'CS Manager',
    store_supervisor: 'Store Supervisor',
    returns_clerk: 'Returns Clerk',
    merchandiser: 'Merchandiser',
    loss_prevention: 'Loss Prevention',
    accountant: 'Accountant',
    data_analyst: 'Data Analyst',
    training_coordinator: 'Training Coord.',
};

export const CARD_SIZES: Record<string, { width: number; height: number; level: number }> = {
    super_admin: { width: 200, height: 160, level: 1 },
    regional_manager: { width: 180, height: 144, level: 2 },
    operations_manager: { width: 180, height: 144, level: 2 },
    finance_manager: { width: 180, height: 144, level: 2 },
    hr_manager: { width: 180, height: 144, level: 2 },
    procurement_manager: { width: 180, height: 144, level: 2 },
    supply_chain_manager: { width: 180, height: 144, level: 2 },
    store_manager: { width: 162, height: 130, level: 3 },
    warehouse_manager: { width: 162, height: 130, level: 3 },
    logistics_manager: { width: 162, height: 130, level: 3 },
    inventory_manager: { width: 162, height: 130, level: 3 },
    security_manager: { width: 162, height: 130, level: 3 },
    dispatch_manager: { width: 162, height: 130, level: 3 },
    assistant_manager: { width: 162, height: 130, level: 3 },
    shift_lead: { width: 162, height: 130, level: 3 },
    cashier: { width: 146, height: 117, level: 4 },
    sales_associate: { width: 146, height: 117, level: 4 },
    stock_clerk: { width: 146, height: 117, level: 4 },
    customer_service: { width: 146, height: 117, level: 4 },
    auditor: { width: 146, height: 117, level: 4 },
    it_support: { width: 146, height: 117, level: 4 },
    picker: { width: 146, height: 117, level: 4 },
    packer: { width: 146, height: 117, level: 4 },
    receiver: { width: 146, height: 117, level: 4 },
    driver: { width: 146, height: 117, level: 4 },
    forklift_operator: { width: 146, height: 117, level: 4 },
    inventory_specialist: { width: 146, height: 117, level: 4 },
    buyer: { width: 146, height: 117, level: 4 },
    demand_planner: { width: 146, height: 117, level: 4 },
    admin: { width: 180, height: 144, level: 2 },
    manager: { width: 162, height: 130, level: 3 },
    hr: { width: 180, height: 144, level: 2 },
    pos: { width: 146, height: 117, level: 4 },
    dispatcher: { width: 162, height: 130, level: 3 },
    cs_manager: { width: 162, height: 130, level: 3 },
    store_supervisor: { width: 162, height: 130, level: 3 },
    returns_clerk: { width: 146, height: 117, level: 4 },
    merchandiser: { width: 146, height: 117, level: 4 },
    loss_prevention: { width: 146, height: 117, level: 4 },
    accountant: { width: 146, height: 117, level: 4 },
    data_analyst: { width: 146, height: 117, level: 4 },
    training_coordinator: { width: 146, height: 117, level: 4 },
    default: { width: 146, height: 117, level: 4 }
};

export const ROLE_COLORS: Record<string, string> = {
    super_admin: '#6366f1',
    regional_manager: '#3b82f6',
    operations_manager: '#3b82f6',
    finance_manager: '#3b82f6',
    hr_manager: '#3b82f6',
    procurement_manager: '#3b82f6',
    supply_chain_manager: '#3b82f6',
    store_manager: '#14b8a6',
    warehouse_manager: '#14b8a6',
    logistics_manager: '#4f46e5',
    inventory_manager: '#0d9488',
    security_manager: '#e11d48',
    dispatch_manager: '#14b8a6',
    assistant_manager: '#14b8a6',
    shift_lead: '#14b8a6',
    buyer: '#d97706',
    demand_planner: '#7c3aed',
    default: '#64748b',
};

export const HIERARCHY_TREE: HierarchyNode[] = [
    {
        role: 'super_admin', label: 'CEO', dept: 'executive', reportsTo: null,
        children: [
            {
                role: 'regional_manager', label: 'Regional Manager', dept: 'executive', reportsTo: 'CEO',
                children: [
                    {
                        role: 'operations_manager', label: 'Operations Manager', dept: 'executive', reportsTo: 'Regional Manager',
                        children: [
                            {
                                role: 'store_manager', label: 'Store Manager', dept: 'store', reportsTo: 'Operations Manager',
                                children: [
                                    {
                                        role: 'assistant_manager', label: 'Assistant Manager', dept: 'store', reportsTo: 'Store Manager',
                                        children: [
                                            { role: 'shift_lead', label: 'Shift Lead', dept: 'store', reportsTo: 'Assistant Manager',
                                              children: [
                                                { role: 'cashier', label: 'Cashier', dept: 'store', reportsTo: 'Shift Lead' },
                                                { role: 'sales_associate', label: 'Sales Associate', dept: 'store', reportsTo: 'Shift Lead' },
                                                { role: 'customer_service', label: 'Customer Service', dept: 'store', reportsTo: 'Shift Lead' },
                                              ]
                                            },
                                        ]
                                    },
                                    { role: 'store_supervisor', label: 'Store Supervisor', dept: 'store', reportsTo: 'Store Manager' },
                                    { role: 'merchandiser', label: 'Merchandiser', dept: 'store', reportsTo: 'Store Manager' },
                                    { role: 'returns_clerk', label: 'Returns Clerk', dept: 'store', reportsTo: 'Store Manager' },
                                ]
                            },
                            {
                                role: 'warehouse_manager', label: 'Warehouse Manager', dept: 'warehouse', reportsTo: 'Operations Manager',
                                children: [
                                    { role: 'receiver', label: 'Receiver', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                    { role: 'picker', label: 'Picker', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                    { role: 'packer', label: 'Packer', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                    { role: 'forklift_operator', label: 'Forklift Operator', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                ]
                            },
                            {
                                role: 'logistics_manager', label: 'Logistics Manager', dept: 'warehouse', reportsTo: 'Operations Manager',
                                children: [
                                    {
                                        role: 'dispatch_manager', label: 'Dispatch Manager', dept: 'warehouse', reportsTo: 'Logistics Manager',
                                        children: [
                                            { role: 'driver', label: 'Driver', dept: 'warehouse', reportsTo: 'Dispatch Manager' },
                                            { role: 'dispatcher', label: 'Dispatcher', dept: 'warehouse', reportsTo: 'Dispatch Manager' },
                                        ]
                                    }
                                ]
                            },
                            {
                                role: 'inventory_manager', label: 'Inventory Manager', dept: 'warehouse', reportsTo: 'Operations Manager',
                                children: [
                                    { role: 'inventory_specialist', label: 'Inventory Specialist', dept: 'warehouse', reportsTo: 'Inventory Manager' },
                                    { role: 'stock_clerk', label: 'Stock Clerk', dept: 'warehouse', reportsTo: 'Inventory Manager' },
                                ]
                            },
                            {
                                role: 'security_manager', label: 'Security & LP Manager', dept: 'support', reportsTo: 'Operations Manager',
                                children: [
                                    { role: 'loss_prevention', label: 'Loss Prevention', dept: 'store', reportsTo: 'Security & LP Manager' }
                                ]
                            }
                        ]
                    },
                    {
                        role: 'supply_chain_manager', label: 'Supply Chain Manager', dept: 'procurement', reportsTo: 'Regional Manager',
                        children: [
                            { role: 'demand_planner', label: 'Demand Planner', dept: 'procurement', reportsTo: 'Supply Chain Manager' }
                        ]
                    },
                ]
            },
            {
                role: 'finance_manager', label: 'Finance Manager', dept: 'finance', reportsTo: 'CEO',
                children: [
                    { role: 'auditor', label: 'Auditor', dept: 'finance', reportsTo: 'Finance Manager' },
                    { role: 'accountant', label: 'Accountant', dept: 'finance', reportsTo: 'Finance Manager' },
                    { role: 'data_analyst', label: 'Data Analyst', dept: 'finance', reportsTo: 'Finance Manager' },
                ]
            },
            {
                role: 'hr_manager', label: 'HR Manager', dept: 'hr', reportsTo: 'CEO',
                children: [
                    { role: 'hr', label: 'HR', dept: 'hr', reportsTo: 'HR Manager' },
                    { role: 'training_coordinator', label: 'Training Coordinator', dept: 'hr', reportsTo: 'HR Manager' },
                ]
            },
            {
                role: 'procurement_manager', label: 'Procurement Manager', dept: 'procurement', reportsTo: 'CEO',
                children: [
                    { role: 'buyer', label: 'Sourcing Buyer', dept: 'procurement', reportsTo: 'Procurement Manager' }
                ]
            },
            {
                role: 'it_support', label: 'IT Support', dept: 'support', reportsTo: 'CEO',
            },
        ]
    }
];

export interface OrgNode {
    id: string;
    x: number;
    y: number;
    role: UserRole;
    label: string;
    employee?: Employee;
}

export interface Connection {
    id: string;
    from: string;
    to: string;
    fromHandle: 'top' | 'bottom' | 'left' | 'right';
    toHandle: 'top' | 'bottom' | 'left' | 'right';
}
