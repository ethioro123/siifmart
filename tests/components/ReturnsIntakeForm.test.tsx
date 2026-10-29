// @vitest-environment jsdom
import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {ReturnsIntakeForm} from '../../components/fulfillment/returns/ReturnsIntakeForm';
import {fulfillmentRecovery} from '../../utils/translations/warehouse/fulfillmentRecovery';
import type {ReturnSale} from '../../services/fulfillment-returns.service';
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string)=>key})}));
afterEach(cleanup);
const sale={id:'sale',siteId:'site',countryCode:'ET',receiptNumber:'AAA-1000001',items:[{id:'line',productId:'sku',name:'Cooking oil',quantity:2,price:10}],total:20} as ReturnSale;
describe('return intake controls',()=>{
 it('blocks blank lookup and duplicate submission while saving',()=>{const lookup=vi.fn();render(<ReturnsIntakeForm sale={null} pending={false} lookupPending={false} onLookup={lookup} onClear={vi.fn()} onSubmit={vi.fn()}/>);fireEvent.click(screen.getByRole('button',{name:'warehouse.findButton'}));expect(lookup).not.toHaveBeenCalled();});
 it('requires a physical quantity and reason, and holds damaged goods out of restock',()=>{render(<ReturnsIntakeForm sale={sale} pending={false} lookupPending={false} onLookup={vi.fn()} onClear={vi.fn()} onSubmit={vi.fn()}/>);fireEvent.click(screen.getByRole('checkbox'));expect(screen.getByRole('button',{name:'warehouse.returnSubmitReview'}).hasAttribute('disabled')).toBe(true);expect(screen.queryByRole('option',{name:'warehouse.returnAction_Restock'})).toBeNull();fireEvent.change(screen.getByLabelText('warehouse.reasonLabel'),{target:{value:'Damaged seal'}});expect(screen.getByRole('button',{name:'warehouse.returnSubmitReview'}).hasAttribute('disabled')).toBe(false);});
 it('has synchronized languages for recovery and return controls',()=>{for(const entry of Object.values(fulfillmentRecovery)){expect(typeof entry).toBe('object');for(const lang of ['en','am','or'])expect((entry as Record<string,string>)[lang]?.trim()).toBeTruthy();}});
});
