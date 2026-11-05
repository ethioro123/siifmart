import React from 'react';
import {
    Coins,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import type { PettyCashVoucher } from '../../types';

interface PettyCashMobileListProps {
    vouchers: PettyCashVoucher[];
    loading: boolean;
    currencySymbol: string;
}

export const PettyCashMobileList: React.FC<PettyCashMobileListProps> = ({
    vouchers,
    loading,
    currencySymbol
}) => {
    if (loading) {
        return (
            <div className="py-16 text-center text-[var(--theme-text-secondary)]">
                <Loader2 className="animate-spin inline mr-2 text-[var(--theme-accent)]" size={18} />
                <span className="text-xs">Loading petty cash vouchers...</span>
            </div>
        );
    }

    if (vouchers.length === 0) {
        return (
            <div className="py-12 px-4 text-center">
                <div className="flex flex-col items-center justify-center text-[var(--theme-text-secondary)]">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mb-3">
                        <Coins size={22} />
                    </div>
                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                        No petty cash vouchers recorded
                    </p>
                    <p className="text-[11px] mt-0.5">
                        No vouchers logged for this site or search query.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-3">
            {vouchers.map((v) => (
                <div
                    key={v.id}
                    className="rounded-2xl border border-[var(--theme-border)] p-4 bg-[var(--theme-bg-card)] shadow-xs space-y-3"
                >
                    {/* Top Row: Voucher #, Date & Receipt Status */}
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <span className="font-mono text-xs font-bold text-[var(--theme-accent)]">
                                {v.voucherNumber}
                            </span>
                            <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] block mt-0.5">
                                {v.voucherDate}
                            </span>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]">
                            <CheckCircle2 size={11} />
                            <span>Receipt Attached</span>
                        </span>
                    </div>

                    {/* Purpose Description */}
                    <div>
                        <p className="text-xs font-medium text-[var(--theme-text-primary)]">
                            {v.description}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)]">
                                {v.category.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] text-[var(--theme-text-secondary)]">
                                Paid to: <strong className="text-[var(--theme-text-primary)]">{v.paidTo}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Bottom: Amount */}
                    <div className="pt-2.5 border-t border-[var(--theme-border)] flex items-center justify-between">
                        <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider">
                            Disbursed Amount
                        </span>
                        <span className="text-sm font-bold font-mono tabular-nums text-[var(--theme-text-primary)]">
                            {currencySymbol} {v.amount.toLocaleString()}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};
