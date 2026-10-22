import React, { useState } from 'react';
import { ShieldCheck, FileCheck, UserX, DollarSign, Coins } from 'lucide-react';
import { useFinance } from './FinanceContext';
import { TreasuryDesk } from './workbenches/TreasuryDesk';
import { TaxComplianceDesk } from './workbenches/TaxComplianceDesk';
import { CreditControlDesk } from './workbenches/CreditControlDesk';
import { InternalAuditDesk } from './workbenches/InternalAuditDesk';

export const RoleWorkbenchTab: React.FC = () => {
    const { user, currencySymbol, effectiveCountry } = useFinance();
    const userRole = user?.role || 'head_of_finance';

    const defaultWorkbench =
        userRole === 'treasury_officer' ? 'treasury' :
        userRole === 'tax_compliance_officer' ? 'tax' :
        userRole === 'credit_control_officer' ? 'credit' :
        userRole === 'auditor' ? 'audit' : 'treasury';

    const [activeWorkbench, setActiveWorkbench] = useState<'treasury' | 'tax' | 'credit' | 'audit'>(defaultWorkbench);

    const DESKS = [
        { id: 'treasury', label: 'Treasury Officer Desk', icon: Coins },
        { id: 'tax', label: 'Tax Compliance Desk', icon: FileCheck },
        { id: 'credit', label: 'Credit Control Desk', icon: UserX },
        { id: 'audit', label: 'Internal Audit Desk', icon: ShieldCheck }
    ] as const;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Apple Segmented Desk Selector */}
            <div className="flex items-center p-1 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl w-fit max-w-full overflow-x-auto shadow-xs gap-1">
                {DESKS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setActiveWorkbench(id)}
                        className={`px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                            activeWorkbench === id
                                ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xs border border-[var(--theme-border)] font-semibold'
                                : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card)]/50 font-medium'
                        }`}
                    >
                        <Icon size={14} className="shrink-0" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* Render Active Desk */}
            {activeWorkbench === 'treasury' && (
                <TreasuryDesk
                    currencySymbol={currencySymbol}
                    effectiveCountry={effectiveCountry}
                />
            )}

            {activeWorkbench === 'tax' && (
                <TaxComplianceDesk
                    currencySymbol={currencySymbol}
                    effectiveCountry={effectiveCountry}
                />
            )}

            {activeWorkbench === 'credit' && (
                <CreditControlDesk
                    currencySymbol={currencySymbol}
                />
            )}

            {activeWorkbench === 'audit' && (
                <InternalAuditDesk
                    currencySymbol={currencySymbol}
                />
            )}
        </div>
    );
};

export default RoleWorkbenchTab;
