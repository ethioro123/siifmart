// Role Hierarchy & Department Categorization Engine for Org Chart & Matrix

export const ROLE_LEVELS: Record<string, number> = {
    // Level 1: Global Executive
    super_admin: 1,
    CEO: 1,
    ceo: 1,
    // Level 2: Country Executive
    country_managing_director: 2,
    admin: 2,
    // Level 3: Corporate HQ Directorate Heads
    head_of_operations: 3,
    operations_head: 3,
    operations_manager: 3,
    head_of_finance: 3,
    finance_head: 3,
    finance_manager: 3,
    head_of_hr: 3,
    hr_head: 3,
    hr_manager: 3,
    hr: 3,
    head_of_procurement: 3,
    procurement_head: 3,
    procurement_manager: 3,
    head_of_supply_chain: 3,
    supply_chain_head: 3,
    supply_chain_manager: 3,
    head_of_merchandising: 3,
    merchandising_head: 3,
    merchandising_manager: 3,
    head_of_it: 3,
    it_head: 3,
    head_of_audit: 3,
    audit_head: 3,
    // Level 4: Regional Territory Director
    regional_manager: 4,
    // Level 5: Regional Functional Leads
    regional_procurement_lead: 5,
    regional_merchandising_lead: 5,
    regional_finance_officer: 5,
    regional_hr_officer: 5,
    regional_logistics_lead: 5,
    regional_security_supervisor: 5,
    // Level 6: Facility Captains
    store_manager: 6,
    warehouse_manager: 6,
    // Level 7: Functional & Department Managers
    logistics_manager: 7,
    inventory_manager: 7,
    security_manager: 7,
    dispatch_manager: 7,
    cs_manager: 7,
    vendor_relations_manager: 7,
    manager: 7,
    // Level 8: Deputy & Shift Supervisors
    assistant_manager: 8,
    fleet_maintenance_supervisor: 8,
    store_supervisor: 8,
    shift_lead: 8,
    // Level 9: Corporate, Audit & Planning Specialists
    store_operations_auditor: 9,
    auditor: 9,
    payroll_specialist: 9,
    treasury_officer: 9,
    tax_compliance_officer: 9,
    credit_control_officer: 9,
    accountant: 9,
    data_analyst: 9,
    training_coordinator: 9,
    talent_recruiter: 9,
    hr_generalist: 9,
    merchandising_specialist: 9,
    customs_import_specialist: 9,
    it_support: 9,
    dispatcher: 9,
    buyer: 9,
    demand_planner: 9,
    replenishment_planner: 9,
    inbound_qc_inspector: 9,
    loss_prevention: 9,
    // Level 10: Frontline Store, Warehouse & Fleet Staff
    cashier: 10,
    sales_associate: 10,
    pos: 10,
    merchandiser: 10,
    inventory_specialist: 10,
    customer_service: 10,
    stock_clerk: 10,
    picker: 10,
    packer: 10,
    receiver: 10,
    returns_clerk: 10,
    driver: 10,
    forklift_operator: 10,
    default: 10
};

export const getRoleLevel = (role: string): number => {
    return ROLE_LEVELS[role] || 10;
};

// Fine-grained position ranking inside Matrix department swimlanes
export const ROLE_MATRIX_RANK: Record<string, number> = {
    // 1. Executive Leadership (10-19)
    super_admin: 10,
    CEO: 10,
    ceo: 10,
    country_managing_director: 11,
    admin: 11,
    head_of_operations: 12,
    operations_head: 12,
    operations_manager: 12,
    regional_manager: 13,

    // 2. Department Heads & Directors (20-29)
    head_of_finance: 20,
    finance_head: 20,
    finance_manager: 20,
    head_of_hr: 21,
    hr_head: 21,
    hr_manager: 21,
    head_of_procurement: 22,
    procurement_head: 22,
    procurement_manager: 22,
    head_of_supply_chain: 23,
    supply_chain_head: 23,
    supply_chain_manager: 23,
    head_of_merchandising: 24,
    merchandising_head: 24,
    merchandising_manager: 24,
    head_of_it: 24,
    it_head: 24,
    head_of_audit: 24,
    audit_head: 24,
    regional_procurement_lead: 25,
    regional_merchandising_lead: 25.5,
    regional_finance_officer: 26,
    regional_hr_officer: 27,
    regional_logistics_lead: 28,
    regional_security_supervisor: 29,
    merchandising_specialist: 59,

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
    hr_generalist: 55,
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
        if (['accountant', 'head_of_finance', 'finance_head', 'finance_manager', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'].includes(r)) return 'finance';
        if (['head_of_hr', 'hr_head', 'hr_manager', 'hr', 'payroll_specialist', 'talent_recruiter', 'training_coordinator', 'hr_generalist'].includes(r)) return 'hr';
        if (['super_admin', 'CEO', 'ceo', 'country_managing_director', 'admin', 'regional_manager', 'head_of_operations', 'operations_head', 'operations_manager'].includes(r)) return 'executive';

        return d;
    }

    // 2. Authoritative role-based department mapping
    if (['super_admin', 'CEO', 'ceo', 'country_managing_director', 'admin', 'regional_manager', 'head_of_operations', 'operations_head', 'operations_manager', 'head_of_merchandising', 'merchandising_head', 'merchandising_manager', 'regional_merchandising_lead', 'merchandising_specialist', 'store_operations_auditor'].includes(r)) return 'executive';
    if (['head_of_finance', 'finance_head', 'finance_manager', 'accountant', 'head_of_audit', 'audit_head', 'auditor', 'data_analyst', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer', 'regional_finance_officer'].includes(r)) return 'finance';
    if (['head_of_hr', 'hr_head', 'hr_manager', 'hr', 'payroll_specialist', 'talent_recruiter', 'training_coordinator', 'hr_generalist', 'regional_hr_officer'].includes(r)) return 'hr';
    if (['head_of_procurement', 'procurement_head', 'procurement_manager', 'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'buyer', 'demand_planner', 'vendor_relations_manager', 'customs_import_specialist', 'inbound_qc_inspector', 'replenishment_planner', 'regional_procurement_lead'].includes(r)) return 'procurement';
    if (['store_manager', 'assistant_manager', 'shift_lead', 'store_supervisor', 'cashier', 'sales_associate', 'stock_clerk', 'customer_service', 'merchandiser', 'returns_clerk', 'pos'].includes(r)) return 'store';
    if (['warehouse_manager', 'logistics_manager', 'inventory_manager', 'dispatch_manager', 'dispatcher', 'picker', 'packer', 'receiver', 'driver', 'forklift_operator', 'inventory_specialist', 'fleet_maintenance_supervisor', 'regional_logistics_lead'].includes(r)) return 'warehouse';
    if (['head_of_it', 'it_head', 'it_support', 'security_manager', 'loss_prevention', 'regional_security_supervisor'].includes(r)) return 'support';

    return 'support';
};
