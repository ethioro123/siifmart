import {describe,expect,it} from 'vitest';
import {productLocationRows,productSaleIssues,validateStockThresholds} from '../../utils/productDetailLogic';
import type {Product,Site} from '../../types';
const product={id:'lot-a',sku:'ETBB002',siteId:'store',stock:23,price:0,status:'active',approvalStatus:'pending'} as Product;
const sites=[{id:'store',country:'ET',name:'Store'},{id:'warehouse',country:'ET',name:'Warehouse'},{id:'foreign',country:'KE',name:'Other country'}] as Site[];
describe('truthful product details',()=>{
 it('retains all same-country lots and deduplicates by row identity',()=>{
  const rows=productLocationRows(product,[product,{...product,id:'lot-b',stock:12,location:'A-01-02'},{...product,id:'other',siteId:'foreign',stock:100}],sites,'ET');
  expect(rows).toHaveLength(2);expect(rows.reduce((n,r)=>n+r.stock,0)).toBe(35);expect(rows[0].location).toBe('');
 });
 it('includes the selected record even when the shared cache is empty',()=>{expect(productLocationRows(product,[],sites,'ET')[0].id).toBe(product.id);});
 it('shows concurrent approval price and expiry blockers without assuming approval',()=>{
  expect(productSaleIssues({...product,expiryDate:'2020-01-01'})).toEqual(['Awaiting catalog approval','Selling price not set','Product has expired']);
  expect(productSaleIssues({...product,approvalStatus:undefined})).toContain('Catalog approval not confirmed');
 });
 it('accepts zero thresholds and rejects inverted or invalid limits',()=>{
  expect(()=>validateStockThresholds(0,0)).not.toThrow();expect(()=>validateStockThresholds(20,10)).toThrow('Maximum');
  expect(()=>validateStockThresholds(-1,10)).toThrow();expect(()=>validateStockThresholds(NaN,10)).toThrow();
 });
});
