import React from 'react';
import { Globe, Smartphone, CreditCard, UserCheck, Printer, Save } from 'lucide-react';
import Button from '../shared/Button';
import { GlassCard, SectionHeader, ToggleRow } from './POSSettingsUI';

interface POSConnectivityTabProps {
  payments: {
    payment_cash: boolean;
    payment_card: boolean;
    payment_mobile_money: boolean;
    payment_store_credit: boolean;
    posDigitalReceipts: boolean;
    posAutoPrint: boolean;
  };
  setPayments: React.Dispatch<React.SetStateAction<{
    payment_cash: boolean;
    payment_card: boolean;
    payment_mobile_money: boolean;
    payment_store_credit: boolean;
    posDigitalReceipts: boolean;
    posAutoPrint: boolean;
  }>>;
  isSavingPayments: boolean;
  handleSaveSection: (section: 'workflow' | 'payments' | 'branding') => void;
}

export function POSConnectivityTab({
  payments,
  setPayments,
  isSavingPayments,
  handleSaveSection
}: POSConnectivityTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="p-8">
        <SectionHeader
          title="Connectivity"
          desc="Payments and transaction flow"
          icon={Globe}
        />

        <div className="space-y-12">
          <div className="space-y-6">
            <label className="text-[10px] text-cyber-primary font-black uppercase tracking-[0.3em] pl-1 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
              Active Payment Gateways
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
              {['Cash', 'Card', 'Mobile Money', 'Store Credit'].map(method => {
                const methodKey = `payment_${method.toLowerCase().replace(' ', '_')}` as keyof typeof payments;
                const isActive = payments[methodKey];
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayments(prev => ({ ...prev, [methodKey]: !isActive }))}
                    className={`h-36 rounded-[2rem] border-2 transition-all duration-700 flex flex-col items-center justify-center gap-4 group/gate ${isActive
                      ? 'bg-cyber-primary/10 text-white border-cyber-primary shadow-[0_0_30px_rgba(0,255,157,0.1)]'
                      : 'bg-white/[0.02] text-gray-600 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`p-4 rounded-2xl transition-all duration-500 shadow-xl ${isActive ? 'bg-cyber-primary text-black scale-110' : 'bg-white/5 text-gray-600 group-hover/gate:scale-110'}`}>
                      {method === 'Cash' ? <Smartphone size={24} /> : method === 'Card' ? <CreditCard size={24} /> : method === 'Mobile Money' ? <Smartphone size={24} /> : <UserCheck size={24} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center px-2">{method}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pt-10 border-t border-white/[0.05]">
            <ToggleRow
              label="Cloud Receipts"
              sub="Digital SMS/Email delivery"
              checked={payments.posDigitalReceipts}
              onChange={() => setPayments(prev => ({ ...prev, posDigitalReceipts: !prev.posDigitalReceipts }))}
              icon={Smartphone}
              help="Automatically sends a digital copy of the receipt to the customer's phone or email after checkout."
            />
            <ToggleRow
              label="Auto-Print Logic"
              sub="Hardware-trigger on total"
              checked={payments.posAutoPrint}
              onChange={() => setPayments(prev => ({ ...prev, posAutoPrint: !prev.posAutoPrint }))}
              icon={Printer}
              help="The connected station printer will automatically start printing once the 'Complete Order' button is pressed."
            />
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <Button
            onClick={() => handleSaveSection('payments')}
            loading={isSavingPayments}
            icon={<Save size={18} />}
            variant="primary"
            className="px-10 h-12 shadow-[0_0_20px_rgba(0,255,157,0.15)] rounded-2xl"
          >
            Sync Configuration
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
