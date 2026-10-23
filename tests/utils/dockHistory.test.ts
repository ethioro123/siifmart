import { describe, expect, it } from 'vitest';
import type { PurchaseOrder } from '../../types';
import { hasRecordedDockReceipt } from '../../utils/dockHistory';
describe('dock receipt history',()=>{
 it('never treats procurement approval as physical unloading',()=>{
  expect(hasRecordedDockReceipt({status:'Approved',approvedAt:'2026-10-24'} as PurchaseOrder)).toBe(false);
  expect(hasRecordedDockReceipt({status:'Ordered'} as PurchaseOrder)).toBe(false);
 });
 it('includes recorded partial and complete receipts without requiring approval timestamps',()=>{
  expect(hasRecordedDockReceipt({status:'Partially Received'} as PurchaseOrder)).toBe(true);
  expect(hasRecordedDockReceipt({status:'Received'} as PurchaseOrder)).toBe(true);
 });
});
