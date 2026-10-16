// Role Hierarchy & Department Categorization Engine for Org Chart & Matrix

export const ROLE_LEVELS: Record<string, number> = {
    super_admin: 1,
    admin: 1,
    operations_manager: 2,
    regional_manager: 2,
    finance_manager: 2,
    hr_manager: 2,
    procurement_manager: 2,
    supply_chain_manager: 2,
    merchandising_manager: 2,
    regional_procurement_lead: 2,
    regional_finance_officer: 2,
    regional_hr_officer: 2,
    regional_logistics_lead: 2,
    regional_security_supervisor: 2,
    store_manager: 3,
    warehouse_manager: 3,
    logistics_manager: 3,
    inventory_manager: 3,
    security_manager: 3,
    dispatch_manager: 3,
    manager: 3,
    assistant_manager: 3,
    shift_lead: 3,
    store_supervisor: 3,
    cs_manager: 3,
    fleet_maintenance_supervisor: 3,
    training_coordinator: 4,
    payroll_specialist: 4,
    talent_recruiter: 4,
    treasury_officer: 4,
    tax_compliance_officer: 4,
    credit_control_officer: 4,
    replenishment_planner: 4,
    store_operations_auditor: 4,
    default: 4
};

export const getRoleLevel = (role: string): number => {
    return ROLE_LEVELS[role] || 4;
};

// Fine-grained position ranking inside Matrix department swimlanes
export const ROLE_MATRIX_RANK: Record<string, number> = {
    // 1. Executive Leadership (10-19)
    super_admin: 10,
    admin: 11,
    operations_manager: 12,
    regional_manager: 13,

    // 2. Department Heads & Directors (20-29)
    finance_manager: 20,
    hr_manager: 21,
    procurement_manager: 22,
    supply_chain_manager: 23,
    merchandising_manager: 24,
    regional_procurement_lead: 25,
    regional_finance_officer: 26,
    regional_hr_officer: 27,
    regional_logistics_lead: 28,
    regional_security_supervisor: 29,

    // 3. Facility Managers (30-39)
    store_manager: 30,
    warehouse_manager: 31,
    logistics_manager: 32,
    inventory_manager: 33,
    dispatch_manager: 34,
    security_manager: 35,
    cs_manager: 36,
    manager: 37,

    // 4. Assistant Managers & Shift Leads (40-49)
    assistant_manager: 40,
    store_supervisor: 41,
    shift_lead: 42,
    dispatcher: 43,
    training_coordinator: 44,
    fleet_maintenance_supervisor: 45,

    // 5. Senior Staff & Specialists (50-59)
    auditor: 50,
    accountant: 51,
    treasury_officer: 51,
    data_analyst: 52,
    tax_compliance_officer: 52,
    payroll_specialist: 53,
    credit_control_officer: 53,
    buyer: 54,
    talent_recruiter: 55,
    demand_planner: 56,
    replenishment_planner: 56,
    inventory_specialist: 57,
    store_operations_auditor: 48,
    it_support: 58,
    loss_prevention: 59,

    // 6. Frontline Specialists & Associates (60+)
    customer_service: 60,
    merchandiser: 61,
    cashier: 62,
    sales_associate: 63,
    stock_clerk: 64,
    returns_clerk: 65,
    pos: 66,
    forklift_operator: 67,
    receiver: 68,
    picker: 69,
    packer: 70,
    driver: 71,

    default: 99
};

export const getRoleRank = (role: string): number => {
    return ROLE_MATRIX_RANK[role] || 99;
};

// Authoritative corporate department resolution
export const getRoleDept = (role: string, empDept?: string): string => {
    const r = (role || '').toLowerCase();

    // 1. Check explicit employee department if specified
    if (empDept && empDept.trim()) {
        const d = empDept.toLowerCase();
        if (d.includes('store') || d.includes('retail') || d.includes('sales') || d.includes('shop') || d.includes('pos') || d.includes('front')) return 'store';
        if (d.includes('ware') || d.includes('logist') || d.includes('fleet') || d.includes('dispatch') || d.includes('inbound') || d.includes('outbound') || d.includes('inventory') || d.includes('fulfillment')) return 'warehouse';
        if (d.includes('fin') || d.includes('acc') || d.includes('audit') || d.includes('tax')) return 'finance';
        if (d.includes('hr') || d.includes('human') || d.includes('people') || d.includes('talent') || d.includes('recruit')) return 'hr';
        if (d.includes('proc') || d.includes('purch') || d.includes('sourc') || d.includes('supply')) return 'procurement';
        if (d.includes('exec') || d.includes('hq') || d.includes('board') || d.includes('director') || d.includes('c-suite')) return 'executive';
        if (d.includes('it') || d.includes('tech') || d.includes('secur') || d.includes('support') || d.includes('loss')) return 'support';
        
        // If role unequivocally dictates core department, prioritize core
        if (['cashier', 'sales_associate', 'stock_clerk', 'store_manager', 'shift_lead'].includes(r)) return 'store';
        if (['picker', 'packer', 'receiver', 'driver', 'warehouse_manager'].includes(r)) return 'warehouse';
        if (['accountant', 'finance_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'].includes(r)) return 'finance';
        if (['hr_manager', 'hr', 'payroll_specialist', 'talent_recruiter', 'training_coordinator'].includes(r)) return 'hr';
        if (['super_admin', 'regional_manager', 'operations_manager'].includes(r)) return 'executive';

        return d;
    }

    // 2. Authoritative role-based department mapping
    if (['super_admin', 'admin', 'regional_manager', 'operations_manager', 'merchandising_manager', 'store_operations_auditor'].includes(r)) return 'executive';
    if (['finance_manager', 'accountant', 'auditor', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'regional_finance_officer'].includes(r)) return 'finance';
    if (['hr_manager', 'hr', 'payroll_specialist', 'talent_recruiter', 'training_coordinator', 'regional_hr_officer'].includes(r)) return 'hr';
    if (['procurement_manager', 'supply_chain_manager', 'buyer', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'replenishment_planner', 'regional_procurement_lead'].includes(r)) return 'procurement';
    if (['store_manager', 'assistant_manager', 'shift_lead', 'store_supervisor', 'cashier', 'sales_associate', 'stock_clerk', 'customer_service', 'merchandiser', 'returns_clerk', 'pos'].includes(r)) return 'store';
    if (['warehouse_manager', 'logistics_manager', 'inventory_manager', 'dispatch_manager', 'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist', 'fleet_maintenance_supervisor', 'regional_logistics_lead'].includes(r)) return 'warehouse';
    if (['it_support', 'security_manager', 'loss_prevention', 'regional_security_supervisor'].includes(r)) return 'support';

    return 'support';
};
