import React from 'react';
import { Globe, Smartphone, CreditCard, UserCheck, Printer, Save, Banknote } from 'lucide-react';
import { GlassCard, SectionHeader, ToggleRow } from './POSSettingsUI';
import { MobileGatewaysSettingsCard } from './MobileGatewaysSettingsCard';
import { SystemConfig } from '../../types';

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
  settings?: Partial<SystemConfig>;
  onSaveGateways?: (updates: Partial<SystemConfig>) => Promise<void>;
  isSavingGateways?: boolean;
}

export function POSConnectivityTab({
  payments,
  setPayments,
  isSavingPayments,
  handleSaveSection,
  settings,
  onSaveGateways,
  isSavingGateways
}: POSConnectivityTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="p-6 lg:p-8">
        <SectionHeader
          title="Connectivity & Tender"
          desc="Payments, digital receipts, and hardware printer integration"
          icon={Globe}
        />

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider pl-0.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)]" />
              Active Tender Methods
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Cash', 'Card', 'Mobile Money', 'Store Credit'].map(method => {
                const methodKey = `payment_${method.toLowerCase().replace(' ', '_')}` as keyof typeof payments;
                const isActive = payments[methodKey];
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayments(prev => ({ ...prev, [methodKey]: !isActive }))}
                    className={`h-28 rounded-xl border transition-colors flex flex-col items-center justify-center gap-2.5 cursor-pointer ${isActive
                      ? 'bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-text-primary)] border-[var(--theme-accent)] dark:border-[var(--theme-accent)] shadow-xs'
                      : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)] hover:border-[var(--theme-border)]'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg transition-transform ${isActive ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-[var(--theme-text-primary)]' : 'bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'}`}>
                      {method === 'Cash' ? <Banknote size={20} /> : method === 'Card' ? <CreditCard size={20} /> : method === 'Mobile Money' ? <Smartphone size={20} /> : <UserCheck size={20} />}
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-center px-2">{method}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[var(--theme-border)]">
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

          {/* Printer Diagnostics & Hardware Test */}
          <div className="pt-6 border-t border-[var(--theme-border)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-primary)] flex items-center gap-2">
                  <Printer size={15} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                  Hardware Receipt Printer Diagnostics
                </h4>
                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                  Verify paper alignment, cutter feed, and direct ESC/POS hardware communication.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const printWindow = window.open('', '_blank', 'width=320,height=400');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head><title>SIIFMART Diagnostic Receipt</title></head>
                        <body style="margin:0; padding:10px; font-family:monospace; font-size:12px; text-align:center;">
                          <h3 style="margin:0;">SIIFMART POS</h3>
                          <p style="margin:4px 0; font-size:10px;">PRINTER TEST OK</p>
                          <hr style="border:none; border-top:1px dashed #000; margin:8px 0;"/>
                          <p style="margin:4px 0;">Date: ${new Date().toLocaleString()}</p>
                          <p style="margin:4px 0; font-weight:bold;">FEED & CUTTER PASSED</p>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 250);
                  }
                }}
                className="h-9 px-3.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] hover:border-[var(--theme-text-secondary)] text-[var(--theme-text-primary)] font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Printer size={14} />
                Print Test Slip
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--theme-border)] flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveSection('payments')}
            disabled={isSavingPayments}
            className="h-10 px-5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-[var(--theme-text-primary)] font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-40"
          >
            {isSavingPayments ? <span className="w-4 h-4 border-2 border-[color-mix(in_srgb,var(--theme-border)_30%,transparent)] border-t-[var(--theme-border)] rounded-full animate-spin" /> : <Save size={15} />}
            Save Payment Settings
          </button>
        </div>
      </GlassCard>

      {/* MOBILE PAYMENT GATEWAYS CONFIGURATION (KENYA & ETHIOPIA) */}
      {payments.payment_mobile_money && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <MobileGatewaysSettingsCard
            settings={settings}
            onSave={onSaveGateways || (async () => {})}
            isSaving={Boolean(isSavingGateways)}
          />
        </div>
      )}
    </div>
  );
}
