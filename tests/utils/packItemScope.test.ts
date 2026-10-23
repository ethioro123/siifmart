import { describe, expect, it } from 'vitest';
import { getProductForItem } from '../../components/fulfillment/pack/utils/packItemHelpers';
import type { Product, WMSJob } from '../../types';
describe('packing catalog scope',()=>{
 const job={siteId:'dc'} as WMSJob;
 const products=[{id:'foreign',sku:'SKU',siteId:'other'},{id:'local1',sku:'SKU',siteId:'dc',location:'A-01-01'},{id:'local2',sku:'SKU',siteId:'dc',location:'B-01-01'}] as Product[];
 it('prefers the manifest lot even when another lot shares its SKU',()=>{
  expect(getProductForItem({productId:'local2',sku:'SKU'},job,products)?.id).toBe('local2');
 });
 it('never falls back to another facility',()=>{
  expect(getProductForItem({productId:'foreign',sku:'SKU'},job,[products[0]])).toBeUndefined();
 });
 it('prefers the source bin when no manifest product record is present',()=>{
  expect(getProductForItem({sku:'SKU',location:'B-01-01'},job,products)?.id).toBe('local2');
 });
});
