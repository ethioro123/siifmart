import React from 'react';
import { Monitor, UserCheck, ShoppingBag, ShieldAlert, Lock, Save, DollarSign, Target, AlertTriangle, Percent } from 'lucide-react';
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
    taxOnSelling: boolean;
  };
  setWorkflow: React.Dispatch<React.SetStateAction<{
    posTerminalId: string;
    posRegisterMode: 'cashier' | 'kiosk';
    posGuestCheckout: boolean;
    posBlockNegativeStock: boolean;
    requireShiftClosure: boolean;
    posDailyRevenueTarget?: number;
    posDailyTxTarget?: number;
    taxOnSelling: boolean;
  }>>;
  isSavingWorkflow: boolean;
  handleSaveSection: (section: 'workflow' | 'payments' | 'branding') => void;
  /** Currency symbol from active country profile (e.g. 'ETB', 'KSh') */
  currencySymbol?: string;
  /** Only HQ admin (CEO/group_ceo) can disable safety toggles */
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

          <div className="space-y-3 md:col-span-2 xl:col-span-3">
            <label className="text-xs text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider pl-0.5">Operational Mode</label>
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

        <div className="mt-8 pt-8 border-t border-[var(--theme-border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[11px] font-medium col-span-full p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <AlertTriangle size={14} className="shrink-0" />
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
          {/* ── SALES TAX / VAT AT POS (CONFIG-GATED) ── */}
          <ToggleRow
            label="Sales Tax / VAT"
            sub="Calculate tax at checkout"
            checked={workflow.taxOnSelling}
            onChange={() => setWorkflow(prev => ({ ...prev, taxOnSelling: !prev.taxOnSelling }))}
            icon={Percent}
            help="When OFF, POS checkout will not apply or display tax. When ON, tax is calculated using the country or store tax rules."
          />
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--theme-border)] flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveSection('workflow')}
            disabled={isSavingWorkflow}
            className="h-10 px-5 bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] hover:opacity-90 active:scale-[0.98] text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-40"
          >
            {isSavingWorkflow ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
            Apply Changes
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
