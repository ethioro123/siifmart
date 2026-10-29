export type ApprovalWorkspaceTarget = 'catalog' | 'requisitions' | 'orders' | 'people' | 'specialist' | 'personnel' | 'expenses' | 'campaigns' | 'suggestions';
const targets: Record<string, ApprovalWorkspaceTarget> = {
 product_suggestions: 'suggestions', inventory: 'catalog', product: 'catalog', price: 'catalog', planogram: 'catalog', price_finance: 'catalog',
 purchase_requests: 'requisitions', purchase_orders: 'orders', po_finance: 'orders',
 salary: 'people', headcount: 'people', employee_changes: 'people',
 hiring_requests: 'specialist', candidate_hr: 'specialist', candidate_finance: 'specialist', payroll_hr: 'specialist', payroll_finance: 'specialist', margin: 'specialist',
 leave: 'personnel', payroll_attestation: 'personnel', expenses: 'expenses', campaigns: 'campaigns'
};
export function approvalWorkspaceTarget(key: string): ApprovalWorkspaceTarget | undefined { return targets[key]; }
