import React from 'react';
import { Monitor, UserCheck, ShoppingBag, ShieldAlert, Lock, Save, DollarSign, Target, AlertTriangle } from 'lucide-react';
import Button from '../shared/Button';
import { GlassCard, SectionHeader, InputGroup, RadioCard, ToggleRow } from './POSSettingsUI';

interface POSStationTabProps {
  workflow: {
    posTerminalId: string;
    posRegisterMode: 'cashier' | 'kiosk';
    posGuestCheckout: boolean;
    posBlockNegativeStock: boolean;
    requireShiftClosure: boolean;
    posDailyRevenueTarget?: number;
    posDailyTxTarget?: number;
  };
  setWorkflow: React.Dispatch<React.SetStateAction<{
    posTerminalId: string;
    posRegisterMode: 'cashier' | 'kiosk';
    posGuestCheckout: boolean;
    posBlockNegativeStock: boolean;
    requireShiftClosure: boolean;
    posDailyRevenueTarget?: number;
    posDailyTxTarget?: number;
  }>>;
  isSavingWorkflow: boolean;
  handleSaveSection: (section: 'workflow' | 'payments' | 'branding') => void;
  /** Currency symbol from active country profile (e.g. 'ETB', 'KSh') */
  currencySymbol?: string;
  /** Only HQ admin (CEO/super_admin) can disable safety toggles */
  isHQAdmin?: boolean;
}

export function POSStationTab({
  workflow,
  setWorkflow,
  isSavingWorkflow,
  handleSaveSection,
  currencySymbol = 'ETB',
  isHQAdmin = false,
}: POSStationTabProps) {
  return (
    <div className="space-y-6 transition-opacity duration-200">
      <GlassCard className="p-8">
        <SectionHeader
          title="Retail Station"
          desc="Core behavior and terminal logic"
          icon={Monitor}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <InputGroup
            label="Terminal Identifier"
            value={workflow.posTerminalId}
            onChange={(e: any) => setWorkflow(prev => ({ ...prev, posTerminalId: e.target.value }))}
            icon={Monitor}
            placeholder="TERM-001"
            sub="Unique hardware ID for audit trails"
          />

          {/* ── MULTI-COUNTRY: Dynamic currency symbol (RULES.md §3 Settings Separation) ──
               Never hardcode ETB — Kenyan terminals must show KSh, Ugandan USh, etc. */}
          <InputGroup
            label={`Shift Target Revenue (${currencySymbol})`}
            value={workflow.posDailyRevenueTarget !== undefined ? String(workflow.posDailyRevenueTarget) : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkflow(prev => ({ ...prev, posDailyRevenueTarget: parseFloat(e.target.value) || 0 }))}
            icon={DollarSign}
            placeholder={currencySymbol === 'KSh' ? '150000' : '50000'}
            sub="Daily register sales benchmark"
          />

          <InputGroup
            label="Shift Target Orders"
            value={workflow.posDailyTxTarget !== undefined ? String(workflow.posDailyTxTarget) : '50'}
            onChange={(e: any) => setWorkflow(prev => ({ ...prev, posDailyTxTarget: parseInt(e.target.value, 10) || 0 }))}
            icon={Target}
            placeholder="50"
            sub="Target transactions per shift"
          />

          <div className="space-y-4 md:col-span-2 xl:col-span-3">
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
          {/* ── GUEST CHECKOUT (ZERO-TRUST: default OFF) ──
               Anonymous sales are untraceable — enabling requires HQ-level decision. */}
          <ToggleRow
            label="Guest Checkout"
            sub="Allow anonymous sales"
            checked={workflow.posGuestCheckout}
            onChange={() => setWorkflow(prev => ({ ...prev, posGuestCheckout: !prev.posGuestCheckout }))}
            icon={UserCheck}
            help="Enable this to process sales without requiring a customer profile. Ideal for quick retail transactions."
          />
          {workflow.posGuestCheckout && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[10px] font-semibold col-span-full">
              <AlertTriangle size={12} />
              <span>Guest checkout is ON — anonymous cash sales are untraceable. HQ audit visibility required.</span>
            </div>
          )}
          {/* ── STOCK COMPLIANCE (ZERO-TRUST: default ON) ──
               Disabling allows selling zero-stock items = conceals shrinkage/theft.
               Only HQ admin may disable. (AGENTS.md §1 / 4-Eyes) */}
          <ToggleRow
            label="Stock Compliance"
            sub="Block sales @ zero"
            checked={workflow.posBlockNegativeStock}
            onChange={() => {
              // Guard: non-HQ-admin cannot disable stock compliance
              if (workflow.posBlockNegativeStock && !isHQAdmin) return;
              setWorkflow(prev => ({ ...prev, posBlockNegativeStock: !prev.posBlockNegativeStock }));
            }}
            warning={!isHQAdmin ? 'HQ Admin required to disable' : 'Strict validation'}
            icon={ShieldAlert}
            help="When active, the terminal will prevent adding items to a cart if they have zero or negative inventory."
          />
          {/* ── SHIFT ENFORCEMENT (MANDATORY HQ OVERSIGHT) ──
               Disabling means cashiers can log out without Z-Report reconciliation.
               This is a critical dual-control action. (AGENTS.md §2 / §3 4-Eyes) */}
          <ToggleRow
            label="Shift Enforcement"
            sub="Z-Report on exit"
            checked={workflow.requireShiftClosure}
            onChange={() => {
              // Guard: non-HQ-admin cannot disable mandatory shift closure
              if (workflow.requireShiftClosure && !isHQAdmin) return;
              setWorkflow(prev => ({ ...prev, requireShiftClosure: !prev.requireShiftClosure }));
            }}
            warning={!isHQAdmin ? 'HQ Admin required to disable' : undefined}
            icon={Lock}
            help="Forces cashiers to generate a Z-Report (Shift Closure) before they can log out of the station."
          />
        </div>

        <div className="mt-10 pt-6 border-t border-[#E2DCCE]/60 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveSection('workflow')}
            disabled={isSavingWorkflow}
            className="px-8 min-h-[44px] bg-[#2C5E3B] hover:opacity-90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-opacity disabled:opacity-50"
          >
            {isSavingWorkflow ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Apply Changes
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
