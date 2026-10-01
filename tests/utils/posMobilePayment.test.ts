// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePOSMobilePayment } from '../../components/pos/hooks/usePOSMobilePayment';

describe('usePOSMobilePayment Hook', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('defaults to MPESA_TILL in Kenya and TELEBIRR in Ethiopia', () => {
        const { result: kenyaResult } = renderHook(() =>
            usePOSMobilePayment({
                isKenya: true,
                isEthiopia: false,
                total: 1500,
                selectedCustomer: null
            })
        );
        expect(kenyaResult.current.channel).toBe('MPESA_TILL');

        const { result: ethResult } = renderHook(() =>
            usePOSMobilePayment({
                isKenya: false,
                isEthiopia: true,
                total: 1500,
                selectedCustomer: null
            })
        );
        expect(ethResult.current.channel).toBe('TELEBIRR');
    });

    it('pre-fills and normalizes customer phone number when customer is selected', () => {
        const { result } = renderHook(() =>
            usePOSMobilePayment({
                isKenya: true,
                isEthiopia: false,
                total: 2000,
                selectedCustomer: {
                    id: 'c1',
                    name: 'John Doe',
                    phone: '+254 712 345 678',
                    email: '',
                    loyaltyPoints: 0,
                    totalSpent: 0,
                    lastVisit: '',
                    tier: 'Bronze'
                }
            })
        );

        expect(result.current.customerPhone).toBe('712345678');
    });

    it('validates mobile payment readiness for MPESA_TILL correctly', () => {
        const { result } = renderHook(() =>
            usePOSMobilePayment({
                isKenya: true,
                isEthiopia: false,
                total: 1000,
                selectedCustomer: null
            })
        );

        expect(result.current.channel).toBe('MPESA_TILL');
        expect(result.current.isMobilePaymentReady()).toBe(false);

        // Under 6 chars should be not ready
        act(() => {
            result.current.setTransactionRef('ABC1');
        });
        expect(result.current.isMobilePaymentReady()).toBe(false);

        // 6 or more chars should be ready
        act(() => {
            result.current.setTransactionRef('SJK8192K1');
        });
        expect(result.current.isMobilePaymentReady()).toBe(true);
    });

    it('validates mobile payment readiness for AIRTEL_MONEY correctly', () => {
        const { result } = renderHook(() =>
            usePOSMobilePayment({
                isKenya: true,
                isEthiopia: false,
                total: 1000,
                selectedCustomer: null
            })
        );

        act(() => {
            result.current.setChannel('AIRTEL_MONEY');
        });

        expect(result.current.isMobilePaymentReady()).toBe(false);

        act(() => {
            result.current.setTransactionRef('AIR89283741');
        });
        expect(result.current.isMobilePaymentReady()).toBe(true);
    });

    it('handles STK push flow correctly: sending -> pending countdown -> success with auto reference', async () => {
        const { result } = renderHook(() =>
            usePOSMobilePayment({
                isKenya: true,
                isEthiopia: false,
                total: 2500,
                selectedCustomer: null
            })
        );

        act(() => {
            result.current.setChannel('MPESA_STK');
            result.current.setCustomerPhone('722000000');
        });

        expect(result.current.stkStatus).toBe('idle');

        // Trigger STK Push
        act(() => {
            result.current.triggerStkPush();
        });

        expect(result.current.stkStatus).toBe('sending');

        // Fast-forward initial network handshake delay (700ms)
        act(() => {
            vi.advanceTimersByTime(750);
        });

        expect(result.current.stkStatus).toBe('pending');
        expect(result.current.stkCountdown).toBe(6);

        // Advance through countdown to 0
        act(() => {
            vi.advanceTimersByTime(6500);
        });

        expect(result.current.stkStatus).toBe('success');
        expect(result.current.transactionRef.length).toBeGreaterThanOrEqual(10);
        expect(result.current.isMobilePaymentReady()).toBe(true);
    });

    it('correctly reports channel labels', () => {
        const { result } = renderHook(() =>
            usePOSMobilePayment({
                isKenya: true,
                isEthiopia: false,
                total: 500,
                selectedCustomer: null
            })
        );

        expect(result.current.getChannelLabel('MPESA_TILL')).toBe('M-Pesa (Buy Goods Till)');
        expect(result.current.getChannelLabel('MPESA_STK')).toBe('M-Pesa (STK Push Express)');
        expect(result.current.getChannelLabel('AIRTEL_MONEY')).toBe('Airtel Money');
        expect(result.current.getChannelLabel('MPESA_PAYBILL')).toBe('M-Pesa (Paybill)');
        expect(result.current.getChannelLabel('TELEBIRR')).toBe('Telebirr');
        expect(result.current.getChannelLabel('CBE_BIRR')).toBe('CBE Birr');
    });

    it('respects settings toggles for enabling and disabling payment channels', () => {
        // Disable M-Pesa Till, only enable STK Push and Airtel Money
        const { result } = renderHook(() =>
            usePOSMobilePayment({
                isKenya: true,
                isEthiopia: false,
                total: 1000,
                selectedCustomer: null,
                settings: {
                    mpesaTillEnabled: false,
                    mpesaStkEnabled: true,
                    airtelMoneyEnabled: true,
                    mpesaPaybillEnabled: false,
                    mpesaTillNumber: '112233',
                    airtelTillNumber: '998877'
                }
            })
        );

        expect(result.current.enabledChannels).toEqual(['MPESA_STK', 'AIRTEL_MONEY']);
        expect(result.current.channel).toBe('MPESA_STK');
        expect(result.current.mpesaTillNumber).toBe('112233');
        expect(result.current.airtelTillNumber).toBe('998877');
        expect(result.current.hasEnabledChannels).toBe(true);
    });

    it('handles all channels disabled in settings gracefully', () => {
        const { result } = renderHook(() =>
            usePOSMobilePayment({
                isKenya: true,
                isEthiopia: false,
                total: 500,
                selectedCustomer: null,
                settings: {
                    mpesaTillEnabled: false,
                    mpesaStkEnabled: false,
                    airtelMoneyEnabled: false,
                    mpesaPaybillEnabled: false
                }
            })
        );

        expect(result.current.enabledChannels).toEqual([]);
        expect(result.current.hasEnabledChannels).toBe(false);
    });
});

