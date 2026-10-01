import { useState, useCallback, useEffect, useRef } from 'react';
import { Customer, SystemConfig } from '../../../types';

export type KenyaMobileChannel = 'MPESA_TILL' | 'MPESA_STK' | 'AIRTEL_MONEY' | 'MPESA_PAYBILL';
export type EthiopiaMobileChannel = 'TELEBIRR' | 'CBE_BIRR';
export type MobilePaymentChannel = KenyaMobileChannel | EthiopiaMobileChannel;

export interface UsePOSMobilePaymentProps {
    isKenya: boolean;
    isEthiopia: boolean;
    total: number;
    selectedCustomer: Customer | null;
    settings?: Partial<SystemConfig>;
}

export function usePOSMobilePayment({
    isKenya,
    isEthiopia,
    total,
    selectedCustomer,
    settings
}: UsePOSMobilePaymentProps) {
    // Settings-driven active channel flags
    const isMpesaTillEnabled = settings?.mpesaTillEnabled !== false;
    const isMpesaStkEnabled = settings?.mpesaStkEnabled !== false;
    const isAirtelMoneyEnabled = settings?.airtelMoneyEnabled !== false;
    const isMpesaPaybillEnabled = Boolean(settings?.mpesaPaybillEnabled);
    const isTelebirrEnabled = settings?.telebirrEnabled !== false;
    const isCbeBirrEnabled = settings?.cbeBirrEnabled !== false;

    // Derived list of enabled channels for current country market
    const enabledChannels: MobilePaymentChannel[] = [];
    if (isKenya) {
        if (isMpesaTillEnabled) enabledChannels.push('MPESA_TILL');
        if (isMpesaStkEnabled) enabledChannels.push('MPESA_STK');
        if (isAirtelMoneyEnabled) enabledChannels.push('AIRTEL_MONEY');
        if (isMpesaPaybillEnabled) enabledChannels.push('MPESA_PAYBILL');
    } else {
        if (isTelebirrEnabled) enabledChannels.push('TELEBIRR');
        if (isCbeBirrEnabled) enabledChannels.push('CBE_BIRR');
    }

    const defaultChannel: MobilePaymentChannel = enabledChannels[0] || (isKenya ? 'MPESA_TILL' : 'TELEBIRR');
    const [channel, setChannel] = useState<MobilePaymentChannel>(defaultChannel);
    const [customerPhone, setCustomerPhone] = useState<string>('');
    const [transactionRef, setTransactionRef] = useState<string>('');
    const [stkStatus, setStkStatus] = useState<'idle' | 'sending' | 'pending' | 'success' | 'failed'>('idle');
    const [stkCountdown, setStkCountdown] = useState<number>(0);
    const [stkErrorMessage, setStkErrorMessage] = useState<string>('');
    const countdownTimerRef = useRef<any>(null);

    // Sync active channel if current channel is disabled in settings or market switched
    useEffect(() => {
        if (enabledChannels.length > 0 && !enabledChannels.includes(channel)) {
            setChannel(enabledChannels[0]);
        }
    }, [enabledChannels, channel]);

    // Pre-fill phone if customer has a valid phone
    useEffect(() => {
        if (selectedCustomer?.phone && !customerPhone) {
            // Strip any leading country code if present for cleaner input
            let clean = selectedCustomer.phone.replace(/[\s-]/g, '');
            if (clean.startsWith('+254')) clean = clean.substring(4);
            else if (clean.startsWith('254')) clean = clean.substring(3);
            else if (clean.startsWith('+251')) clean = clean.substring(4);
            else if (clean.startsWith('251')) clean = clean.substring(3);
            else if (clean.startsWith('0')) clean = clean.substring(1);
            setCustomerPhone(clean);
        }
    }, [selectedCustomer, customerPhone]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };
    }, []);

    // Configuration values from settings with defaults
    const mpesaTillNumber = settings?.mpesaTillNumber || '882910';
    const mpesaTillName = settings?.mpesaTillName || 'SIIFMART MAIN STORE';
    const mpesaPaybillNumber = settings?.mpesaPaybillNumber || '400200';
    const mpesaPaybillAccount = settings?.mpesaPaybillAccount || 'SIIFMART';
    const airtelTillNumber = settings?.airtelTillNumber || '554433';
    const airtelMerchantName = settings?.airtelMerchantName || 'SIIFMART AIRTEL';
    const telebirrMerchantId = settings?.telebirrMerchantId || 'TB-998811';
    const cbeBirrMerchantCode = settings?.cbeBirrMerchantCode || 'CBE-445566';

    // Generate realistic Safaricom M-Pesa reference code (e.g. SHK89X72K9)
    const generateSafaricomRef = useCallback(() => {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const numbers = '0123456789';
        let ref = '';
        for (let i = 0; i < 3; i++) ref += letters.charAt(Math.floor(Math.random() * letters.length));
        for (let i = 0; i < 4; i++) ref += numbers.charAt(Math.floor(Math.random() * numbers.length));
        for (let i = 0; i < 3; i++) ref += letters.charAt(Math.floor(Math.random() * letters.length));
        return ref;
    }, []);

    // Generate realistic Airtel Money reference code (e.g. AIR92019384)
    const generateAirtelRef = useCallback(() => {
        return `AIR${Math.floor(10000000 + Math.random() * 90000000)}`;
    }, []);

    // Trigger STK Push (API Simulation)
    const triggerStkPush = useCallback(async () => {
        const cleanPhone = customerPhone.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 9) {
            setStkErrorMessage('Please enter a valid Kenyan phone number (e.g. 712345678 or 110123456)');
            return;
        }

        setStkErrorMessage('');
        setStkStatus('sending');

        // Step 1: Simulate Daraja API network handshake (700ms)
        setTimeout(() => {
            setStkStatus('pending');
            setStkCountdown(6);

            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

            let remaining = 6;
            countdownTimerRef.current = setInterval(() => {
                remaining -= 1;
                setStkCountdown(remaining);

                if (remaining <= 0) {
                    clearInterval(countdownTimerRef.current);
                    // Step 2: Customer entered PIN -> Success
                    const autoRef = generateSafaricomRef();
                    setTransactionRef(autoRef);
                    setStkStatus('success');
                }
            }, 1000);
        }, 700);
    }, [customerPhone, generateSafaricomRef]);

    const resetMobileState = useCallback(() => {
        setStkStatus('idle');
        setStkCountdown(0);
        setStkErrorMessage('');
        setTransactionRef('');
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }, []);

    // Format human-readable channel label
    const getChannelLabel = useCallback((ch: MobilePaymentChannel) => {
        switch (ch) {
            case 'MPESA_TILL': return 'M-Pesa (Buy Goods Till)';
            case 'MPESA_STK': return 'M-Pesa (STK Push Express)';
            case 'MPESA_PAYBILL': return 'M-Pesa (Paybill)';
            case 'AIRTEL_MONEY': return 'Airtel Money';
            case 'TELEBIRR': return 'Telebirr';
            case 'CBE_BIRR': return 'CBE Birr';
            default: return 'Mobile Money';
        }
    }, []);

    // Determine if mobile payment inputs are valid for completing the sale
    const isMobilePaymentReady = useCallback(() => {
        if (channel === 'MPESA_STK') {
            return stkStatus === 'success' || Boolean(transactionRef.trim());
        }
        if (channel === 'MPESA_TILL') {
            return transactionRef.trim().length >= 6;
        }
        if (channel === 'AIRTEL_MONEY') {
            return transactionRef.trim().length >= 6;
        }
        if (channel === 'MPESA_PAYBILL') {
            return transactionRef.trim().length >= 6;
        }
        // Ethiopia Telebirr / CBE Birr
        return transactionRef.trim().length >= 4;
    }, [channel, stkStatus, transactionRef]);

    return {
        channel,
        setChannel,
        customerPhone,
        setCustomerPhone,
        transactionRef,
        setTransactionRef: (val: string) => setTransactionRef(val.toUpperCase()),
        stkStatus,
        stkCountdown,
        stkErrorMessage,
        triggerStkPush,
        resetMobileState,
        mpesaTillNumber,
        mpesaTillName,
        mpesaPaybillNumber,
        mpesaPaybillAccount,
        airtelTillNumber,
        airtelMerchantName,
        telebirrMerchantId,
        cbeBirrMerchantCode,
        enabledChannels,
        hasEnabledChannels: enabledChannels.length > 0,
        isMobilePaymentReady,
        getChannelLabel,
        generateAirtelRef,
        generateSafaricomRef
    };
}
