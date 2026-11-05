// @vitest-environment jsdom
// Audit reproduction: a passing test demonstrates unverified payment success.
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { usePOSMobilePayment } from '../../components/pos/hooks/usePOSMobilePayment';
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
it('reports M-Pesa STK success and creates a reference after timers without contacting a provider', async () => {
 vi.useFakeTimers(); const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
 const { result } = renderHook(() => usePOSMobilePayment({ isKenya: true, isEthiopia: false, total: 100, selectedCustomer: null }));
 act(() => { result.current.setCustomerPhone('712345678'); result.current.setChannel('MPESA_STK'); });
 await act(async () => { await result.current.triggerStkPush(); });
 await act(async () => { await vi.advanceTimersByTimeAsync(6700); });
 expect(result.current.stkStatus).toBe('success'); expect(result.current.transactionRef).toMatch(/^[A-Z]{3}[0-9]{4}[A-Z]{3}$/);
 expect(result.current.isMobilePaymentReady()).toBe(true); expect(fetch).not.toHaveBeenCalled();
});
