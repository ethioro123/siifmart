import React from 'react';
import { formatCompactNumber } from '../../utils/formatting';
import {
    ArrowUpRight,
    ArrowDownRight,
    Equal,
    CheckCircle2,
    Building2,
    Receipt,
    Users,
    Percent
} from 'lucide-react';

interface PnLWaterfallCardProps {
    totalRevenue: number;
    totalRefunds: number;
    totalOpEx: number;
    totalSalaries: number;
    estimatedTaxLiability: number;
    netProfit: number;
    currencySymbol: string;
    taxName: string;
}

export const PnLWaterfallCard: React.FC<PnLWaterfallCardProps> = ({
    totalRevenue,
    totalRefunds,
    totalOpEx,
    totalSalaries,
    estimatedTaxLiability,
    netProfit,
    currencySymbol,
    taxName
}) => {
    const netRevenue = Math.max(0, totalRevenue - totalRefunds);
    const operatingEbitda = netRevenue - totalOpEx - totalSalaries;

    const rows = [
        {
            id: 'gross_revenue',
            label: 'Gross Sales Billings',
            sublabel: 'Total point-of-sale & commercial invoices',
            amount: totalRevenue,
            type: 'add' as const,
            icon: ArrowUpRight,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10'
        },
        {
            id: 'refunds',
            label: 'Returns & Customer Credits',
            sublabel: 'Zero-trust verified RMA deductions & refunds',
            amount: totalRefunds,
            type: 'subtract' as const,
            icon: ArrowDownRight,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10'
        },
        {
            id: 'net_revenue',
            label: 'Net Operating Revenue',
            sublabel: 'Adjusted commercial volume baseline',
            amount: netRevenue,
            type: 'subtotal' as const,
            icon: Equal,
            color: 'text-[var(--theme-text-primary)]',
            bg: 'bg-[var(--theme-bg-subtle)]'
        },
        {
            id: 'opex',
            label: 'Operating Expenses (OpEx)',
            sublabel: 'Logistics, utilities, facility & administration outlays',
            amount: totalOpEx,
            type: 'subtract' as const,
            icon: Receipt,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-500/10'
        },
        {
            id: 'payroll',
            label: 'Payroll & Statutory Staff Compensation',
            sublabel: 'Verified gross wages, benefits & pension accruals',
            amount: totalSalaries,
            type: 'subtract' as const,
            icon: Users,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-500/10'
        },
        {
            id: 'ebitda',
            label: 'Operating Profit (EBITDA)',
            sublabel: 'Earnings before sovereign taxes & statutory levies',
            amount: operatingEbitda,
            type: 'subtotal' as const,
            icon: Building2,
            color: operatingEbitda >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            bg: 'bg-[var(--theme-bg-subtle)]'
        },
        {
            id: 'tax',
            label: `Sovereign Tax Provision (${taxName})`,
            sublabel: 'Estimated statutory obligation per fiscal period',
            amount: estimatedTaxLiability,
            type: 'subtract' as const,
            icon: Percent,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10'
        }
    ];

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 isolate overflow-hidden shadow-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[var(--theme-border)]">
                <div>
                    <h3 className="text-base font-semibold text-[var(--theme-text-primary)] tracking-tight">
                        Executive Income Statement
                    </h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 font-normal">
                        Reconciled P&L waterfall from gross turnover to net retained profit.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium w-fit">
                    <CheckCircle2 size={13} />
                    <span>Zero-Trust Ledger Verified</span>
                </div>
            </div>

            {/* Waterfall Rows */}
            <div className="divide-y divide-[var(--theme-border)] pt-2">
                {rows.map((row) => {
                    const Icon = row.icon;
                    const isSubtotal = row.type === 'subtotal';

                    return (
                        <div
                            key={row.id}
                            className={`py-3 px-3 rounded-xl flex items-center justify-between transition-colors ${
                                isSubtotal
                                    ? 'bg-[var(--theme-bg-subtle)] font-medium my-1'
                                    : 'hover:bg-[var(--theme-bg-subtle)]/50'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0 pr-3">
                                <div className={`w-7 h-7 rounded-lg ${row.bg} ${row.color} flex items-center justify-center shrink-0`}>
                                    <Icon size={14} />
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-xs ${isSubtotal ? 'font-semibold text-[var(--theme-text-primary)]' : 'font-normal text-[var(--theme-text-primary)]'} truncate`}>
                                        {row.label}
                                    </p>
                                    <p className="text-[11px] text-[var(--theme-text-secondary)] truncate font-normal">
                                        {row.sublabel}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <span className={`font-mono tabular-nums text-sm ${row.color} ${isSubtotal ? 'font-semibold' : 'font-normal'}`}>
                                    {row.type === 'subtract' ? '- ' : row.type === 'add' ? '+ ' : ''}
                                    {formatCompactNumber(row.amount, { currency: currencySymbol })}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* Final Retained Bottom Line */}
                <div className="pt-3 mt-2">
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-400/5 border border-emerald-500/20 flex items-center justify-between">
                        <div>
                            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
                                Net Operating Income (Bottom Line)
                            </span>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                Final retained operational margin after all allocations
                            </p>
                        </div>
                        <span className={`font-mono font-bold text-lg tabular-nums ${
                            netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                            {formatCompactNumber(netProfit, { currency: currencySymbol })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PnLWaterfallCard;
