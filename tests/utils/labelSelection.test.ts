import { describe, expect, it } from 'vitest';
import { findLabelProduct, validLabelCopies } from '../../utils/labelSelection';
import type { Product } from '../../types';
const products=[{id:'a',sku:'ET001',name:'Milk Small',siteId:'wh'},{id:'b',sku:'ET002',name:'Milk Large',siteId:'wh'},{id:'c',sku:'KE001',name:'Rice',siteId:'other'}] as Product[];
describe('label identity and copies',()=>{
 it('requires a unique SKU for name matches and prefers exact identifiers',()=>{
  expect(findLabelProduct(products,'Milk','wh')).toBeNull();
  expect(findLabelProduct(products,' et001 ','wh')?.id).toBe('a');
  expect(findLabelProduct(products,'Milk Large','wh')?.id).toBe('b');
 });
 it('does not print a product from another facility or missing scope',()=>{
  expect(findLabelProduct(products,'KE001','wh')).toBeNull();expect(findLabelProduct(products,'ET001')).toBeNull();
 });
 it('limits whole copy counts before label generation',()=>{
  for(const value of [0,-1,1.5,NaN,Infinity,1001])expect(validLabelCopies(value)).toBe(false);
  expect(validLabelCopies(1)).toBe(true);expect(validLabelCopies(1000)).toBe(true);
 });
});
