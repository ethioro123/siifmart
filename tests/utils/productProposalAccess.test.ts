import { expect, it } from 'vitest';
import { canProposeProductChanges } from '../../utils/productProposalAccess';
it.each(['group_ceo','regional_operations_manager','regional_supply_chain_manager','regional_procurement_manager','regional_merchandising_manager','warehouse_manager','store_manager','inventory_manager','merchandising_specialist'])('permits product steward %s to prepare proposals', role => {
    expect(canProposeProductChanges(role)).toBe(true);
});
it.each(['group_cfo','group_chro','country_finance_director','regional_finance_manager','regional_hr_manager','regional_it_manager','regional_security_manager','regional_logistics_manager','transport_fleet_manager','picker','cashier','unknown',''])('denies unrelated or unknown role %s', role => {
    expect(canProposeProductChanges(role)).toBe(false);
});
