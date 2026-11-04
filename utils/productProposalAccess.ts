/** Explicit product stewardship; seniority alone never grants proposal controls. */
const PRODUCT_PROPOSERS = new Set([
    'group_ceo', 'group_coo', 'group_cco', 'group_cmo', 'group_csco',
    'country_managing_director', 'country_operations_director', 'country_commercial_director',
    'country_supply_chain_director', 'regional_operations_manager', 'area_operations_manager',
    'regional_supply_chain_manager', 'regional_procurement_manager', 'regional_merchandising_manager',
    'store_manager', 'warehouse_manager', 'warehouse_operations_manager', 'inventory_manager',
    'merchandising_specialist'
]);
export function canProposeProductChanges(role?: string): boolean {
    return !!role && PRODUCT_PROPOSERS.has(role);
}
