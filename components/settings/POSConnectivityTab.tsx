import React from 'react';
import { Globe, Smartphone, CreditCard, UserCheck, Printer, Save, Banknote } from 'lucide-react';
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
      <GlassCard className="p-6 lg:p-8">
        <SectionHeader
          title="Connectivity & Tender"
          desc="Payments, digital receipts, and hardware printer integration"
          icon={Globe}
        />

        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] text-[#2C5E3B] dark:text-[#A9CBA2] font-black uppercase tracking-[0.25em] pl-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#2C5E3B] dark:bg-[#A9CBA2] animate-pulse" />
              Active Tender Methods
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Cash', 'Card', 'Mobile Money', 'Store Credit'].map(method => {
                const methodKey = `payment_${method.toLowerCase().replace(' ', '_')}` as keyof typeof payments;
                const isActive = payments[methodKey];
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayments(prev => ({ ...prev, [methodKey]: !isActive }))}
                    className={`h-32 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer ${isActive
                      ? 'bg-[#2C5E3B]/10 dark:bg-[#2C5E3B]/20 text-[#1E3F27] dark:text-white border-[#2C5E3B] dark:border-[#A9CBA2] shadow-sm'
                      : 'bg-[#FAF8F5] dark:bg-black/20 text-stone-400 dark:text-gray-500 border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/40'
                    }`}
                  >
                    <div className={`p-3.5 rounded-xl transition-transform ${isActive ? 'bg-[#2C5E3B] text-white scale-105' : 'bg-stone-200/60 dark:bg-white/5 text-stone-500'}`}>
                      {method === 'Cash' ? <Banknote size={22} /> : method === 'Card' ? <CreditCard size={22} /> : method === 'Mobile Money' ? <Smartphone size={22} /> : <UserCheck size={22} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-center px-2">{method}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#E2DCCE]/60 dark:border-white/10">
            <ToggleRow
              label="Digital Receipts"
              sub="SMS & Email checkout slips"
              checked={payments.posDigitalReceipts}
              onChange={() => setPayments(prev => ({ ...prev, posDigitalReceipts: !prev.posDigitalReceipts }))}
              icon={Smartphone}
              help="Allows sending digital e-receipts directly to the customer's phone or email after transaction completion."
            />
            <ToggleRow
              label="Auto-Print Slip"
              sub="Trigger thermal print on pay"
              checked={payments.posAutoPrint}
              onChange={() => setPayments(prev => ({ ...prev, posAutoPrint: !prev.posAutoPrint }))}
              icon={Printer}
              help="The connected ESC/POS thermal printer will automatically print the receipt when payment succeeds."
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveSection('payments')}
            disabled={isSavingPayments}
            className="px-8 py-3 bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            {isSavingPayments ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Save Payment Settings
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
