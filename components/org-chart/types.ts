import { UserRole, Employee } from '../../types';
import { SYSTEM_ROLES } from '../../utils/roles';

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
    ...Object.fromEntries(SYSTEM_ROLES.map(({ id, label }) => [id, label])),
    ceo: 'Chief Executive Officer',
    CEO: 'Chief Executive Officer',
    manager: 'Manager',
};

export const CARD_SIZES: Record<string, { width: number; height: number; level: number }> = {
    super_admin: { width: 200, height: 160, level: 1 },
    admin: { width: 190, height: 152, level: 2 },
    country_managing_director: { width: 190, height: 152, level: 2 },
    head_of_operations: { width: 180, height: 144, level: 3 },
    head_of_finance: { width: 180, height: 144, level: 3 },
    head_of_hr: { width: 180, height: 144, level: 3 },
    hr: { width: 180, height: 144, level: 3 },
    head_of_procurement: { width: 180, height: 144, level: 3 },
    head_of_supply_chain: { width: 180, height: 144, level: 3 },
    head_of_merchandising: { width: 180, height: 144, level: 3 },
    regional_operations_manager: { width: 176, height: 140, level: 4 },
    store_manager: { width: 168, height: 134, level: 6 },
    warehouse_manager: { width: 168, height: 134, level: 6 },
    logistics_manager: { width: 162, height: 130, level: 7 },
    inventory_manager: { width: 162, height: 130, level: 7 },
    security_manager: { width: 162, height: 130, level: 7 },
    dispatch_manager: { width: 162, height: 130, level: 7 },
    cs_manager: { width: 162, height: 130, level: 7 },
    vendor_relations_manager: { width: 162, height: 130, level: 7 },
    manager: { width: 162, height: 130, level: 7 },
    assistant_manager: { width: 156, height: 126, level: 8 },
    fleet_maintenance_supervisor: { width: 156, height: 126, level: 8 },
    store_supervisor: { width: 156, height: 126, level: 8 },
    shift_lead: { width: 156, height: 126, level: 8 },
    store_operations_auditor: { width: 150, height: 120, level: 9 },
    auditor: { width: 150, height: 120, level: 9 },
    it_support: { width: 150, height: 120, level: 9 },
    buyer: { width: 150, height: 120, level: 9 },
    demand_planner: { width: 150, height: 120, level: 9 },
    replenishment_planner: { width: 150, height: 120, level: 9 },
    dispatcher: { width: 150, height: 120, level: 9 },
    accountant: { width: 150, height: 120, level: 9 },
    data_analyst: { width: 150, height: 120, level: 9 },
    training_coordinator: { width: 150, height: 120, level: 9 },
    loss_prevention: { width: 150, height: 120, level: 9 },
    cashier: { width: 146, height: 117, level: 10 },
    sales_associate: { width: 146, height: 117, level: 10 },
    stock_clerk: { width: 146, height: 117, level: 10 },
    customer_service: { width: 146, height: 117, level: 10 },
    picker: { width: 146, height: 117, level: 10 },
    packer: { width: 146, height: 117, level: 10 },
    receiver: { width: 146, height: 117, level: 10 },
    driver: { width: 146, height: 117, level: 10 },
    forklift_operator: { width: 146, height: 117, level: 10 },
    inventory_specialist: { width: 146, height: 117, level: 10 },
    pos: { width: 146, height: 117, level: 10 },
    returns_clerk: { width: 146, height: 117, level: 10 },
    merchandiser: { width: 146, height: 117, level: 10 },
    default: { width: 146, height: 117, level: 10 }
};

export const ROLE_COLORS: Record<string, string> = {
    super_admin: '#6366f1',
    regional_operations_manager: '#3b82f6',
    head_of_operations: '#3b82f6',
    head_of_finance: '#3b82f6',
    head_of_hr: '#3b82f6',
    head_of_procurement: '#3b82f6',
    head_of_supply_chain: '#3b82f6',
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
    replenishment_planner: '#7c3aed',
    fleet_maintenance_supervisor: '#4f46e5',
    treasury_officer: '#10b981',
    tax_compliance_officer: '#0d9488',
    credit_control_officer: '#059669',
    store_operations_auditor: '#8b5cf6',
    default: '#64748b',
};

export const HIERARCHY_TREE: HierarchyNode[] = [
    {
        role: 'super_admin', label: 'CEO', dept: 'executive', reportsTo: null,
        children: [
            {
                role: 'regional_operations_manager', label: 'Regional Manager', dept: 'executive', reportsTo: 'CEO',
                children: [
                    {
                        role: 'head_of_operations', label: 'Head of Operations', dept: 'executive', reportsTo: 'Regional Manager',
                        children: [
                            // Central Operations Team
                            { role: 'head_of_merchandising', label: 'Head of Merchandising', dept: 'executive', reportsTo: 'Head of Operations' },
                            { role: 'data_analyst', label: 'Data Analyst', dept: 'executive', reportsTo: 'Head of Operations' },
                            { role: 'security_manager', label: 'Security & LP Manager', dept: 'support', reportsTo: 'Head of Operations' },
                            {
                                role: 'cs_manager', label: 'CS Manager', dept: 'store', reportsTo: 'Head of Operations',
                                children: [
                                    { role: 'customer_service', label: 'Customer Service', dept: 'store', reportsTo: 'CS Manager' }
                                ]
                            },
                            { role: 'store_operations_auditor', label: 'Store Operations Auditor', dept: 'executive', reportsTo: 'Head of Operations' },

                            // Direct Facility Oversight Lines
                            {
                                role: 'store_manager', label: 'Store Manager', dept: 'store', reportsTo: 'Head of Operations',
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
                                role: 'warehouse_manager', label: 'Warehouse Manager', dept: 'warehouse', reportsTo: 'Head of Operations',
                                children: [
                                    { role: 'receiver', label: 'Receiver', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                    { role: 'picker', label: 'Picker', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                    { role: 'packer', label: 'Packer', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                    { role: 'forklift_operator', label: 'Forklift Operator', dept: 'warehouse', reportsTo: 'Warehouse Manager' },
                                ]
                            },
                            {
                                role: 'logistics_manager', label: 'Logistics Manager', dept: 'warehouse', reportsTo: 'Head of Operations',
                                children: [
                                    {
                                        role: 'dispatch_manager', label: 'Dispatch Manager', dept: 'warehouse', reportsTo: 'Logistics Manager',
                                        children: [
                                            { role: 'driver', label: 'Driver', dept: 'warehouse', reportsTo: 'Dispatch Manager' },
                                            { role: 'dispatcher', label: 'Dispatcher', dept: 'warehouse', reportsTo: 'Dispatch Manager' },
                                        ]
                                    },
                                    { role: 'fleet_maintenance_supervisor', label: 'Fleet Maint. Supervisor', dept: 'warehouse', reportsTo: 'Logistics Manager' }
                                ]
                            },
                            {
                                role: 'inventory_manager', label: 'Inventory Manager', dept: 'warehouse', reportsTo: 'Head of Operations',
                                children: [
                                    { role: 'inventory_specialist', label: 'Inventory Specialist', dept: 'warehouse', reportsTo: 'Inventory Manager' },
                                    { role: 'stock_clerk', label: 'Stock Clerk', dept: 'warehouse', reportsTo: 'Inventory Manager' },
                                ]
                            },
                            {
                                role: 'security_manager', label: 'Security & LP Manager', dept: 'support', reportsTo: 'Head of Operations',
                                children: [
                                    { role: 'loss_prevention', label: 'Loss Prevention', dept: 'store', reportsTo: 'Security & LP Manager' }
                                ]
                            }
                        ]
                    },
                    {
                        role: 'head_of_supply_chain', label: 'Head of Supply Chain', dept: 'procurement', reportsTo: 'Regional Manager',
                        children: [
                            { role: 'demand_planner', label: 'Demand Planner', dept: 'procurement', reportsTo: 'Head of Supply Chain' },
                            { role: 'replenishment_planner', label: 'Replenishment Planner', dept: 'procurement', reportsTo: 'Head of Supply Chain' }
                        ]
                    },
                ]
            },
            {
                role: 'head_of_finance', label: 'Head of Finance', dept: 'finance', reportsTo: 'CEO',
                children: [
                    { role: 'auditor', label: 'Auditor', dept: 'finance', reportsTo: 'Head of Finance' },
                    { role: 'accountant', label: 'Accountant', dept: 'finance', reportsTo: 'Head of Finance' },
                    { role: 'data_analyst', label: 'Data Analyst', dept: 'finance', reportsTo: 'Head of Finance' },
                    { role: 'treasury_officer', label: 'Treasury Officer', dept: 'finance', reportsTo: 'Head of Finance' },
                    { role: 'tax_compliance_officer', label: 'Tax Compliance Officer', dept: 'finance', reportsTo: 'Head of Finance' },
                    { role: 'credit_control_officer', label: 'Credit Control Officer', dept: 'finance', reportsTo: 'Head of Finance' },
                ]
            },
            {
                role: 'head_of_hr', label: 'Head of Human Resources', dept: 'hr', reportsTo: 'CEO',
                children: [
                    { role: 'hr', label: 'HR', dept: 'hr', reportsTo: 'Head of Human Resources' },
                    { role: 'training_coordinator', label: 'Training Coordinator', dept: 'hr', reportsTo: 'Head of Human Resources' },
                ]
            },
            {
                role: 'head_of_procurement', label: 'Head of Procurement', dept: 'procurement', reportsTo: 'CEO',
                children: [
                    { role: 'buyer', label: 'Sourcing Buyer', dept: 'procurement', reportsTo: 'Head of Procurement' },
                    { role: 'vendor_relations_manager', label: 'Vendor Relations Manager', dept: 'procurement', reportsTo: 'Head of Procurement' },
                    { role: 'customs_import_specialist', label: 'Customs & Import Specialist', dept: 'procurement', reportsTo: 'Head of Procurement' },
                    { role: 'inbound_qc_inspector', label: 'Inbound QC Inspector', dept: 'procurement', reportsTo: 'Head of Procurement' }
                ]
            },
            {
                role: 'it_support', label: 'IT Support', dept: 'support', reportsTo: 'CEO',
            },
        ]
    }
];

export type OrgViewMode = 'matrix' | 'tree';

export interface OrgTreeNode {
    id: string;
    employee?: Employee;
    role: string;
    label: string;
    department: string;
    siteId?: string;
    siteName?: string;
    level: number;
    parentId?: string | null;
    children: OrgTreeNode[];
    directReportCount: number;
    totalSubordinateCount: number;
    isVacant?: boolean;
}

export interface OrgLayoutNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    node: OrgTreeNode;
    isCollapsed: boolean;
    hasChildren: boolean;
    isSearchMatch: boolean;
}

export interface OrgConnectorPath {
    id: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    d: string;
}

export interface OrgChartFilterState {
    searchTerm: string;
    siteId: string;
    department: string;
    status: string;
    hierarchyLevel?: number | null;
}
