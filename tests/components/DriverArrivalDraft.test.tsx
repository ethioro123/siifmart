// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PartialDeliveryModal } from '../../components/fulfillment/drivers/PartialDeliveryModal';
import type { WMSJob } from '../../types';
vi.mock('../../hooks/useShipmentWorkflow',()=>({useShipmentWorkflow:()=>({mutateAsync:vi.fn()})}));
afterEach(cleanup);
it('preserves entered arrival counts during a background refresh but resets for a different mission',()=>{
 const job={id:'one',type:'DISPATCH',siteId:'origin',transferStatus:'Shipped',lineItems:[{sku:'SKU',name:'Item',expectedQty:10}]} as WMSJob;
 const props={t:(key:string)=>key === 'warehouse.driverHub.deliveredQuantities' ? 'Delivered quantity' : key,isOpen:true,onClose:vi.fn(),user:null,products:[],sites:[],addNotification:vi.fn(),refreshData:vi.fn()};
 const {rerender}=render(<PartialDeliveryModal {...props} job={job}/>);
 fireEvent.change(screen.getByRole('spinbutton',{name:'Delivered quantity'}),{target:{value:'6'}});
 rerender(<PartialDeliveryModal {...props} job={{...job,lineItems:[...job.lineItems]}}/>);
 expect((screen.getByRole('spinbutton',{name:'Delivered quantity'}) as HTMLInputElement).value).toBe('6');
 rerender(<PartialDeliveryModal {...props} job={{...job,id:'two'}}/>);
 expect((screen.getByRole('spinbutton',{name:'Delivered quantity'}) as HTMLInputElement).value).toBe('10');
});
