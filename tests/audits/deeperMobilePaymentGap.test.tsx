// @vitest-environment jsdom
import {act,cleanup,renderHook} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {usePOSMobilePayment} from '../../components/pos/hooks/usePOSMobilePayment';
afterEach(()=>{cleanup();vi.useRealTimers();});
it('time passing cannot invent a payment, reference or verification',async()=>{
 vi.useFakeTimers();const {result}=renderHook(()=>usePOSMobilePayment({isKenya:true,isEthiopia:false,total:100,selectedCustomer:null}));
 await act(async()=>{await vi.advanceTimersByTimeAsync(60000);});
 expect(result.current.transactionRef).toBe('');expect(result.current.paymentVerified).toBe(false);expect(result.current.isMobilePaymentReady()).toBe(false);
 expect(result.current.enabledChannels).not.toContain('MPESA_STK');
});
