import { describe, expect, it } from 'vitest';
import { eligibleDistributionStores, toggleDistributionStore } from '../../utils/distributionStores';
import type { Site } from '../../types';
const source={id:'dc',country:'ET',type:'Distribution Center',logisticsZoneId:'north'} as Site;
const stores=[{id:'a',country:'ET',type:'Store',logisticsZoneId:'north'},{id:'b',country:'ET',type:'Store',logisticsZoneId:'south'},{id:'c',country:'KE',type:'Store',logisticsZoneId:'north'}] as Site[];
describe('explicit distribution store selection',()=>{
 it('deselection removes quantity and reselection starts at zero',()=>{
  const selected=toggleDistributionStore([{storeId:'a',quantity:20}], 'a', false);
  expect(selected).toEqual([]);
  expect(toggleDistributionStore(selected,'a',true)).toEqual([{storeId:'a',quantity:0}]);
 });
 it('never duplicates a selected destination or changes its entered quantity',()=>{
  const allocations=[{storeId:'a',quantity:20}];
  expect(toggleDistributionStore(allocations,'a',true)).toEqual(allocations);
 });
 it('preserves country boundaries and applies zone restrictions with existing leadership overrides',()=>{
  expect(eligibleDistributionStores(stores,source,true,'warehouse_manager').map(s=>s.id)).toEqual(['a']);
  expect(eligibleDistributionStores(stores,source,true,'country_operations_director').map(s=>s.id)).toEqual(['a','b']);
  expect(eligibleDistributionStores(stores,source,false,'warehouse_manager').map(s=>s.id)).toEqual(['a','b']);
  expect(eligibleDistributionStores(stores,undefined,false)).toEqual([]);
 });
});
