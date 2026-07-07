import React from 'react';
import { Monitor, UserCheck, ShoppingBag, ShieldAlert, Lock, Save } from 'lucide-react';
import Button from '../shared/Button';
import { GlassCard, SectionHeader, InputGroup, RadioCard, ToggleRow } from './POSSettingsUI';

interface POSStationTabProps {
  workflow: {
    posTerminalId: string;
    posRegisterMode: 'cashier' | 'kiosk';
    posGuestCheckout: boolean;
    posBlockNegativeStock: boolean;
    requireShiftClosure: boolean;
  };
  setWorkflow: React.Dispatch<React.SetStateAction<{
    posTerminalId: string;
    posRegisterMode: 'cashier' | 'kiosk';
    posGuestCheckout: boolean;
    posBlockNegativeStock: boolean;
    requireShiftClosure: boolean;
  }>>;
  isSavingWorkflow: boolean;
  handleSaveSection: (section: 'workflow' | 'payments' | 'branding') => void;
}

export function POSStationTab({
  workflow,
  setWorkflow,
  isSavingWorkflow,
  handleSaveSection
}: POSStationTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="p-8">
        <SectionHeader
          title="Retail Station"
          desc="Core behavior and terminal logic"
          icon={Monitor}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
          <InputGroup
            label="Terminal Identifier"
            value={workflow.posTerminalId}
            onChange={(e: any) => setWorkflow(prev => ({ ...prev, posTerminalId: e.target.value }))}
            icon={Monitor}
            placeholder="TERM-001"
            sub="Unique hardware ID for audit trails"
          />

          <div className="space-y-4 md:col-span-1 xl:col-span-2">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] pl-1">Operational Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RadioCard
                value={workflow.posRegisterMode}
                onChange={(val: 'cashier' | 'kiosk') => setWorkflow(prev => ({ ...prev, posRegisterMode: val }))}
                options={[
                  { value: 'cashier', label: 'Cashier POS', desc: 'Managed staff interface', icon: UserCheck },
                  { value: 'kiosk', label: 'Self Service', desc: 'Secure customer face', icon: ShoppingBag },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="mt-16 pt-16 border-t border-white/[0.05] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ToggleRow
            label="Guest Checkout"
            sub="Allow anonymous sales"
            checked={workflow.posGuestCheckout}
            onChange={() => setWorkflow(prev => ({ ...prev, posGuestCheckout: !prev.posGuestCheckout }))}
            icon={UserCheck}
            help="Enable this to process sales without requiring a customer profile. Ideal for quick retail transactions."
          />
          <ToggleRow
            label="Stock Compliance"
            sub="Block sales @ zero"
            checked={workflow.posBlockNegativeStock}
            onChange={() => setWorkflow(prev => ({ ...prev, posBlockNegativeStock: !prev.posBlockNegativeStock }))}
            warning="Strict validation"
            icon={ShieldAlert}
            help="When active, the terminal will prevent adding items to a cart if they have zero or negative inventory."
          />
          <ToggleRow
            label="Shift Enforcement"
            sub="Z-Report on exit"
            checked={workflow.requireShiftClosure}
            onChange={() => setWorkflow(prev => ({ ...prev, requireShiftClosure: !prev.requireShiftClosure }))}
            icon={Lock}
            help="Forces cashiers to generate a Z-Report (Shift Closure) before they can log out of the station."
          />
        </div>

        <div className="mt-12 flex justify-end">
          <Button
            onClick={() => handleSaveSection('workflow')}
            loading={isSavingWorkflow}
            icon={<Save size={18} />}
            variant="primary"
            className="px-10 h-12 shadow-[0_0_20px_rgba(0,255,157,0.15)] rounded-2xl"
          >
            Apply Changes
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
