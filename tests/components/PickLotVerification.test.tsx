// @vitest-environment jsdom
import React,{useState} from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {PickLotVerification,PickLotProof,emptyPickLotProof} from '../../components/fulfillment/pick/components/PickLotVerification';
import {fefo} from '../../utils/translations/warehouse/fefo';
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({t:(key:string)=>key})}));
afterEach(cleanup);
function Form(){const [value,setValue]=useState<PickLotProof>(emptyPickLotProof);return <PickLotVerification batch="LOT-A" expiry="2027-01-01" location="A-01-01" value={value} onChange={setValue}/>;}
describe('physical lot proof',()=>{
 it('shows the allocated identity and requires fresh confirmation after an edit',()=>{
  render(<Form/>);expect(screen.getByText(/LOT-A/).textContent).toContain('2027-01-01');
  const batch=screen.getByLabelText('warehouse.fefoPhysicalBatch') as HTMLInputElement;expect(batch.value).toBe('');
  const confirm=screen.getByRole('checkbox') as HTMLInputElement;fireEvent.click(confirm);expect(confirm.checked).toBe(true);
  fireEvent.change(batch,{target:{value:'LOT-B'}});expect(confirm.checked).toBe(false);
 });
 it('provides all three UI languages',()=>{for(const entry of Object.values(fefo)){for(const lang of ['en','am','or'])expect((entry as Record<string,string>)[lang]?.trim()).toBeTruthy();}});
});
