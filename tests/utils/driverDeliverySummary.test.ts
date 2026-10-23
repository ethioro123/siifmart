import { describe, expect, it } from 'vitest';
import type { WMSJob } from '../../types';
import { summarizeDriverDeliveries } from '../../utils/driverDeliverySummary';
const job=(id:string,status:string,phase:string)=>({id,type:'DISPATCH',status,transferStatus:phase,items:2,lineItems:[{expectedQty:2}]} as WMSJob);
describe('loaded driver delivery summary',()=>{
 it('counts each mission once across active and history data',()=>{
  const arrived=job('one','Completed','Delivered');
  expect(summarizeDriverDeliveries([arrived],[arrived])).toEqual({completed:1,active:0,items:2});
 });
 it('counts arrivals as transport completion without requiring receiving acceptance',()=>{
  expect(summarizeDriverDeliveries([job('one','In-Progress','Shipped')],[job('two','Completed','Partially Delivered')])).toEqual({completed:1,active:1,items:4});
 });
 it('excludes cancelled and external transport',()=>{
  expect(summarizeDriverDeliveries([job('one','Cancelled','Cancelled'),{...job('two','In-Progress','Shipped'),deliveryMethod:'External'}],[])).toEqual({completed:0,active:0,items:0});
 });
});
