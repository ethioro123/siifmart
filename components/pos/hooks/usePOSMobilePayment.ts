import { useState, useEffect } from 'react';
import type { Customer, SystemConfig } from '../../../types';
export type MobilePaymentChannel = 'MPESA_TILL' | 'MPESA_PAYBILL' | 'AIRTEL_MONEY' | 'TELEBIRR' | 'CBE_BIRR';
export interface UsePOSMobilePaymentProps { isKenya: boolean; isEthiopia: boolean; total: number; selectedCustomer: Customer | null; settings?: Partial<SystemConfig> }
export function usePOSMobilePayment({ isKenya, total, selectedCustomer, settings }: UsePOSMobilePaymentProps) {
 const enabledChannels: MobilePaymentChannel[] = isKenya
  ? [...(settings?.mpesaTillEnabled !== false ? ['MPESA_TILL' as const] : []), ...(settings?.mpesaPaybillEnabled ? ['MPESA_PAYBILL' as const] : []), ...(settings?.airtelMoneyEnabled !== false ? ['AIRTEL_MONEY' as const] : [])]
  : [...(settings?.telebirrEnabled !== false ? ['TELEBIRR' as const] : []), ...(settings?.cbeBirrEnabled !== false ? ['CBE_BIRR' as const] : [])];
 const [channel, setChannel] = useState<MobilePaymentChannel>(isKenya ? 'MPESA_TILL' : 'TELEBIRR');
 const [customerPhone, setCustomerPhone] = useState(selectedCustomer?.phone || '');
 const [transactionRef, setRef] = useState('');
 const [paymentVerified, setPaymentVerified] = useState(false);
 useEffect(() => { setPaymentVerified(false); }, [channel, total]);
 useEffect(() => { setRef(''); }, [channel]);
 useEffect(() => { if (enabledChannels.length && !enabledChannels.includes(channel)) setChannel(enabledChannels[0]); }, [channel, isKenya, settings]);
 const setTransactionRef = (value: string) => { setRef(value.toUpperCase()); setPaymentVerified(false); };
 const getChannelLabel = (value: MobilePaymentChannel) => ({ MPESA_TILL: 'M-Pesa Till', MPESA_PAYBILL: 'M-Pesa Paybill', AIRTEL_MONEY: 'Airtel Money', TELEBIRR: 'Telebirr', CBE_BIRR: 'CBE Birr' })[value];
 return { channel, setChannel, customerPhone, setCustomerPhone, transactionRef, setTransactionRef, paymentVerified, setPaymentVerified, enabledChannels, hasEnabledChannels: enabledChannels.length > 0, getChannelLabel,
  isMobilePaymentReady: () => enabledChannels.includes(channel) && transactionRef.trim().length >= 4 && transactionRef.trim().length <= 200 && paymentVerified };
}
