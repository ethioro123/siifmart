// @vitest-environment jsdom
import React from 'react';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {pos} from '../../utils/translations/pos';
vi.mock('../../contexts/LanguageContext',()=>({useLanguage:()=>({countryProfile:{currencyCode:'ETB'},t:(key:string,values?:Record<string,string>)=>{
 const value=pos[key.replace('pos.','')]?.en;let text=typeof value==='string'?value:key;for(const [name,value] of Object.entries(values||{}))text=text.replace('{'+name+'}',value);return text;
}})}));
import {usePOSMobilePayment} from '../../components/pos/hooks/usePOSMobilePayment';
import {MobilePaymentSection} from '../../components/pos/modals/MobilePaymentSection';
afterEach(cleanup);
function Entry(){const payment=usePOSMobilePayment({isKenya:false,isEthiopia:true,total:100,selectedCustomer:null});return <><MobilePaymentSection mobilePayment={payment} total={100} isKenya={false} isEthiopia/><button disabled={!payment.isMobilePaymentReady()}>Complete recorded sale</button></>;}
it('presents manual verification with labeled input and an unchecked confirmation',()=>{
 render(<Entry/>);expect(screen.getByText(/does not send payment prompts/)).toBeTruthy();const complete=screen.getByRole('button',{name:'Complete recorded sale'}) as HTMLButtonElement;expect(complete.disabled).toBe(true);
 fireEvent.change(screen.getByLabelText('Actual transaction reference'),{target:{value:'REAL-1234'}});expect(complete.disabled).toBe(true);fireEvent.click(screen.getByRole('checkbox'));expect(complete.disabled).toBe(false);
 fireEvent.change(screen.getByLabelText('Actual transaction reference'),{target:{value:'REAL-5678'}});expect(complete.disabled).toBe(true);
});
it('synchronizes manual payment and receipt copy across all active languages',()=>{
 for(const [key,copy]of Object.entries(pos).filter(([key])=>key.startsWith('manualPayment')))for(const language of ['en','am','or'] as const)expect(copy[language],key+' '+language).toBeTruthy();
});
