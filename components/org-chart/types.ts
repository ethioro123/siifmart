import { UserRole, Employee } from '../../types';
import { SYSTEM_ROLES } from '../../utils/systemRolesData';

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
    hr_generalist: { bg: '#faf5f0', bgDark: '#2a2018', border: '#8a5a30', borderDark: '#c47840', text: '#5a3018', textDark: '#d4945a', dot: '#8a5a30' },
    procurement: { bg: '#f5f8f5', bgDark: '#1e2c22', border: '#567a5e', borderDark: '#8ab492', text: '#2a4e32', textDark: '#a8c8b0', dot: '#567a5e' },
    support:     { bg: '#f5f5f3', bgDark: '#21271e', border: '#6b7a6e', borderDark: '#8ea090', text: '#3a4a3c', textDark: '#9eb0a0', dot: '#6b7a6e' },
};

export const ROLE_LABELS: Record<string, string> = {
    ...Object.fromEntries(SYSTEM_ROLES.map(({ id, label }) => [id, label])),
    group_ceo: 'Group CEO',
};

export const CARD_SIZES: Record<string, { width: number; height: number; level: number }> = {
    country_managing_director: { width: 190, height: 152, level: 2 },
    country_operations_director: { width: 180, height: 144, level: 3 },
    country_finance_director: { width: 180, height: 144, level: 3 },
    country_hr_director: { width: 180, height: 144, level: 3 },
    country_commercial_director: { width: 180, height: 144, level: 3 },
    country_supply_chain_director: { width: 180, height: 144, level: 3 },
    regional_operations_manager: { width: 176, height: 140, level: 4 },
    store_manager: { width: 168, height: 134, level: 6 },
    warehouse_manager: { width: 168, height: 134, level: 6 },
    area_operations_manager: { width: 162, height: 130, level: 5 },
    regional_supply_chain_manager: { width: 162, height: 130, level: 5 },
    inventory_manager: { width: 162, height: 130, level: 7 },
    regional_security_manager: { width: 162, height: 130, level: 7 },
    dispatch_supervisor: { width: 162, height: 130, level: 7 },
    cs_manager: { width: 162, height: 130, level: 7 },
    vendor_relations_manager: { width: 162, height: 130, level: 7 },
    assistant_store_manager: { width: 156, height: 126, level: 8 },
    fleet_maintenance_supervisor: { width: 156, height: 126, level: 8 },
    shift_supervisor: { width: 156, height: 126, level: 8 },
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
    returns_clerk: { width: 146, height: 117, level: 10 },
    merchandiser: { width: 146, height: 117, level: 10 },
    default: { width: 146, height: 117, level: 10 }
};

export const ROLE_COLORS: Record<string, string> = {
    regional_operations_manager: '#3b82f6',
    store_manager: '#14b8a6',
    warehouse_manager: '#14b8a6',
    inventory_manager: '#0d9488',
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
        role: 'group_ceo', label: 'Group CEO', dept: 'executive', reportsTo: 'Board / Ownership',
        children: [
            {
                role: 'group_coo', label: 'Group COO', dept: 'executive', reportsTo: 'Group CEO',
                children: [
                    {
                        role: 'country_managing_director', label: 'Country Managing Director', dept: 'executive', reportsTo: 'Group COO',
                        children: [
                            {
                                role: 'country_operations_director', label: 'Country Operations Director', dept: 'executive', reportsTo: 'Group COO',
                                children: [
                                    {
                                        role: 'regional_operations_manager', label: 'Regional Operations Manager', dept: 'executive', reportsTo: 'Country Operations Director',
                                        children: [
                                            {
                                                role: 'area_operations_manager', label: 'Area Manager', dept: 'executive', reportsTo: 'Regional Operations Manager',
                                                children: [
                                                    {
                                                        role: 'store_manager', label: 'Store Manager', dept: 'store', reportsTo: 'Area Manager',
                                                        children: [
                                                            {
                                                                role: 'assistant_store_manager', label: 'Assistant Store Manager', dept: 'store', reportsTo: 'Store Manager',
                                                                children: [
                                                                    {
                                                                        role: 'shift_supervisor', label: 'Shift Supervisor', dept: 'store', reportsTo: 'Assistant Store Manager',
                                                                        children: [
                                                                            { role: 'cashier', label: 'Cashier', dept: 'store', reportsTo: 'Shift Supervisor' },
                                                                            { role: 'sales_associate', label: 'Sales Associate', dept: 'store', reportsTo: 'Shift Supervisor' },
                                                                            { role: 'customer_service', label: 'Customer Service', dept: 'store', reportsTo: 'Shift Supervisor' },
                                                                        ]
                                                                    },
                                                                ]
                                                            },
                                                            { role: 'merchandiser', label: 'Merchandiser', dept: 'store', reportsTo: 'Store Manager' },
                                                            { role: 'returns_clerk', label: 'Returns Clerk', dept: 'store', reportsTo: 'Store Manager' },
                                                        ]
                                                    }
                                                ]
                                            },
                                        ]
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        role: 'country_finance_director', label: 'Country Finance Director', dept: 'finance', reportsTo: 'Group CFO',
                        children: [
                            { role: 'accountant', label: 'Accountant', dept: 'finance', reportsTo: 'Country Finance Director' },
                            { role: 'treasury_officer', label: 'Treasury Officer', dept: 'finance', reportsTo: 'Country Finance Director' },
                            { role: 'auditor', label: 'Auditor', dept: 'finance', reportsTo: 'Country Finance Director' },
                        ]
                    },
                    {
                        role: 'country_commercial_director', label: 'Country Commercial Director', dept: 'procurement', reportsTo: 'Group CCO',
                        children: [
                            { role: 'buyer', label: 'Buyer', dept: 'procurement', reportsTo: 'Country Commercial Director' },
                            { role: 'vendor_relations_manager', label: 'Vendor Relations Manager', dept: 'procurement', reportsTo: 'Country Commercial Director' },
                                                    ]
                    },
                    {
                        role: 'country_supply_chain_director', label: 'Country Supply Chain Director', dept: 'warehouse', reportsTo: 'Group CSCO',
                        children: [
                            { role: 'demand_planner', label: 'Demand Planner', dept: 'procurement', reportsTo: 'Country Supply Chain Director' },
                            { role: 'replenishment_planner', label: 'Replenishment Planner', dept: 'procurement', reportsTo: 'Country Supply Chain Director' },
                            {
                                role: 'regional_supply_chain_manager', label: 'Regional Supply Chain Manager', dept: 'warehouse', reportsTo: 'Country Supply Chain Director',
                                children: [
                                    {
                                        role: 'warehouse_manager', label: 'Warehouse Manager', dept: 'warehouse', reportsTo: 'Regional Supply Chain Manager',
                                        children: [
                                            {
                                                role: 'receiving_supervisor', label: 'Receiving Supervisor', dept: 'warehouse', reportsTo: 'Warehouse Manager',
                                                children: [{ role: 'receiving_team_leader', label: 'Receiving Team Leader', dept: 'warehouse', reportsTo: 'Receiving Supervisor', children: [{ role: 'receiver', label: 'Receiver', dept: 'warehouse', reportsTo: 'Receiving Team Leader' }] }]
                                            },
                                            {
                                                role: 'picking_supervisor', label: 'Picking Supervisor', dept: 'warehouse', reportsTo: 'Warehouse Manager',
                                                children: [{ role: 'picking_team_leader', label: 'Picking Team Leader', dept: 'warehouse', reportsTo: 'Picking Supervisor', children: [{ role: 'picker', label: 'Picker', dept: 'warehouse', reportsTo: 'Picking Team Leader' }] }]
                                            },
                                            {
                                                role: 'packing_supervisor', label: 'Packing Supervisor', dept: 'warehouse', reportsTo: 'Warehouse Manager',
                                                children: [{ role: 'packing_team_leader', label: 'Packing Team Leader', dept: 'warehouse', reportsTo: 'Packing Supervisor', children: [{ role: 'packer', label: 'Packer', dept: 'warehouse', reportsTo: 'Packing Team Leader' }] }]
                                            },
                                            {
                                                role: 'dispatch_supervisor', label: 'Dispatch Supervisor', dept: 'warehouse', reportsTo: 'Warehouse Manager',
                                                children: [{ role: 'dispatch_team_leader', label: 'Dispatch Team Leader', dept: 'warehouse', reportsTo: 'Dispatch Supervisor', children: [{ role: 'dispatcher', label: 'Dispatcher', dept: 'warehouse', reportsTo: 'Dispatch Team Leader' }] }]
                                            },
                                            {
                                                role: 'putaway_replenishment_supervisor', label: 'Putaway & Replenishment Supervisor', dept: 'warehouse', reportsTo: 'Warehouse Manager',
                                                children: [{ role: 'forklift_operator', label: 'Forklift Operator', dept: 'warehouse', reportsTo: 'Putaway & Replenishment Supervisor' }]
                                            },
                                        ]
                                    },
                                    {
                                        role: 'regional_logistics_manager', label: 'Regional Logistics Manager', dept: 'warehouse', reportsTo: 'Regional Supply Chain Manager',
                                        children: [{ role: 'fleet_maintenance_supervisor', label: 'Fleet Maintenance Supervisor', dept: 'warehouse', reportsTo: 'Regional Logistics Manager' }]
                                    },
                                    {
                                        role: 'inventory_manager', label: 'Inventory Manager', dept: 'warehouse', reportsTo: 'Regional Supply Chain Manager',
                                        children: [{ role: 'inventory_specialist', label: 'Inventory Specialist', dept: 'warehouse', reportsTo: 'Inventory Manager' }]
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        role: 'country_hr_director', label: 'Country HR Director', dept: 'hr', reportsTo: 'Group CHRO',
                        children: [
                            { role: 'hr_generalist', label: 'HR Generalist', dept: 'hr', reportsTo: 'Country HR Director' },
                            { role: 'training_coordinator', label: 'Training Coordinator', dept: 'hr', reportsTo: 'Country HR Director' },
                        ]
                    },
                ]
            },
            { role: 'group_cfo', label: 'Group CFO', dept: 'finance', reportsTo: 'Group CEO' },
            {
                role: 'group_cco', label: 'Group CCO', dept: 'procurement', reportsTo: 'Group CEO',
                children: [{ role: 'group_cmo', label: 'Group Chief Marketing Officer', dept: 'procurement', reportsTo: 'Group CCO' }]
            },
            { role: 'group_csco', label: 'Group CSCO', dept: 'warehouse', reportsTo: 'Group CEO' },
            { role: 'group_chro', label: 'Group CHRO', dept: 'hr', reportsTo: 'Group CEO' },
            {
                role: 'group_cio', label: 'Group CIO', dept: 'support', reportsTo: 'Group CEO',
                children: [
                    { role: 'group_cto', label: 'Group CTO', dept: 'support', reportsTo: 'Group CIO' },
                    { role: 'country_technology_director', label: 'Country Technology Director', dept: 'support', reportsTo: 'Group CIO' }
                ]
            },
            {
                role: 'group_clco', label: 'Group General Counsel & Compliance', dept: 'support', reportsTo: 'Group CEO',
                children: [{
                    role: 'country_compliance_manager', label: 'Country Compliance Manager', dept: 'support', reportsTo: 'Group General Counsel & Compliance',
                    children: [{
                        role: 'regional_security_manager', label: 'Regional Security Manager', dept: 'support', reportsTo: 'Country Compliance Manager',
                        children: [{ role: 'loss_prevention', label: 'Loss Prevention', dept: 'store', reportsTo: 'Regional Security Manager' }]
                    }]
                }]
            },
            { role: 'group_cae', label: 'Chief Audit Executive', dept: 'support', reportsTo: 'Board Audit Committee' },
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
