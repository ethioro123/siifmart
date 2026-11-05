import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { usePOSMobilePayment, type MobilePaymentChannel } from '../hooks/usePOSMobilePayment';
interface Props { mobilePayment: ReturnType<typeof usePOSMobilePayment>; total: number; isKenya: boolean; isEthiopia: boolean }
export function MobilePaymentSection({ mobilePayment: payment, total }: Props) {
 const { t, countryProfile } = useLanguage();
 if (!payment.hasEnabledChannels) return <p role="status">{t('pos.manualPaymentUnavailable')}</p>;
 return <fieldset className="space-y-4 border border-[var(--theme-border)] rounded-xl p-4">
  <legend className="px-1 font-semibold">{t('pos.manualPaymentTitle')}</legend>
  <p className="text-sm text-[var(--theme-text-secondary)]">{t('pos.manualPaymentNotice')}</p>
  <label className="block text-sm">{t('pos.manualPaymentChannel')}
   <select className="mt-1 w-full min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3" value={payment.channel} onChange={e => payment.setChannel(e.target.value as MobilePaymentChannel)}>
    {payment.enabledChannels.map(channel => <option key={channel} value={channel}>{payment.getChannelLabel(channel)}</option>)}
   </select>
  </label>
  <label className="block text-sm">{t('pos.manualPaymentReference')}
   <input className="mt-1 w-full min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3" value={payment.transactionRef} minLength={4} maxLength={200} autoComplete="off" onChange={e => payment.setTransactionRef(e.target.value)} />
  </label>
  <label className="flex min-h-11 items-start gap-3 text-sm">
   <input className="mt-1 size-5 shrink-0" type="checkbox" checked={payment.paymentVerified} onChange={e => payment.setPaymentVerified(e.target.checked)} />
   <span>{t('pos.manualPaymentConfirm', { amount: total.toLocaleString(), currency: countryProfile.currencyCode })}</span>
  </label>
 </fieldset>;
}
