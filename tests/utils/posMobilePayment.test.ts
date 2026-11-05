// @vitest-environment jsdom
import { cleanup,renderHook,act } from '@testing-library/react';
import { afterEach,expect,it } from 'vitest';
import { usePOSMobilePayment } from '../../components/pos/hooks/usePOSMobilePayment';
afterEach(cleanup);
const props={isKenya:true,isEthiopia:false,total:100,selectedCustomer:null};
it('offers manual local channels and no simulated prompt channel',()=>{const {result}=renderHook(()=>usePOSMobilePayment(props));expect(result.current.enabledChannels).toEqual(['MPESA_TILL','AIRTEL_MONEY']);expect(result.current.isMobilePaymentReady()).toBe(false);});
it('uses Ethiopian methods in Ethiopia',()=>{const {result}=renderHook(()=>usePOSMobilePayment({...props,isKenya:false,isEthiopia:true}));expect(result.current.enabledChannels).toEqual(['TELEBIRR','CBE_BIRR']);});
it('requires both an actual reference and explicit manual confirmation',()=>{const {result}=renderHook(()=>usePOSMobilePayment(props));act(()=>result.current.setTransactionRef('ref123'));expect(result.current.isMobilePaymentReady()).toBe(false);act(()=>result.current.setPaymentVerified(true));expect(result.current.isMobilePaymentReady()).toBe(true);});
it('clears confirmation when the reference changes',()=>{const {result}=renderHook(()=>usePOSMobilePayment(props));act(()=>result.current.setTransactionRef('ref123'));act(()=>result.current.setPaymentVerified(true));act(()=>result.current.setTransactionRef('ref456'));expect(result.current.isMobilePaymentReady()).toBe(false);});
it('requires confirmation again when the total changes',()=>{const {result,rerender}=renderHook(({total})=>usePOSMobilePayment({...props,total}),{initialProps:{total:100}});act(()=>result.current.setTransactionRef('ref123'));act(()=>result.current.setPaymentVerified(true));rerender({total:200});expect(result.current.paymentVerified).toBe(false);});
it('clears reference and confirmation when the channel changes',()=>{const {result}=renderHook(()=>usePOSMobilePayment(props));act(()=>result.current.setTransactionRef('ref123'));act(()=>result.current.setPaymentVerified(true));act(()=>result.current.setChannel('AIRTEL_MONEY'));expect(result.current.transactionRef).toBe('');expect(result.current.paymentVerified).toBe(false);});
it('disables checkout when every local channel is disabled',()=>{const {result}=renderHook(()=>usePOSMobilePayment({...props,settings:{mpesaTillEnabled:false,airtelMoneyEnabled:false,mpesaPaybillEnabled:false}}));expect(result.current.hasEnabledChannels).toBe(false);expect(result.current.isMobilePaymentReady()).toBe(false);});
