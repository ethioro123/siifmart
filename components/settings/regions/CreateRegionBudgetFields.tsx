import React from 'react';
import { DollarSign, ShieldAlert } from 'lucide-react';

interface CreateRegionBudgetFieldsProps {
    currency: string;
    monthlyBudget: string;
    setMonthlyBudget: (v: string) => void;
    autonomousLimit: string;
    setAutonomousLimit: (v: string) => void;
    monthlyExpenseBudget: string;
    setMonthlyExpenseBudget: (v: string) => void;
    autonomousExpenseLimit: string;
    setAutonomousExpenseLimit: (v: string) => void;
}

export const CreateRegionBudgetFields: React.FC<CreateRegionBudgetFieldsProps> = ({
    currency,
    monthlyBudget,
    setMonthlyBudget,
    autonomousLimit,
    setAutonomousLimit,
    monthlyExpenseBudget,
    setMonthlyExpenseBudget,
    autonomousExpenseLimit,
    setAutonomousExpenseLimit
}) => {
    return (
        <div className="p-3.5 bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] space-y-3">
            <div className="flex items-center gap-2">
                <DollarSign size={15} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                <h4 className="text-xs font-semibold text-[var(--theme-text-primary)]">
                    Dynamic HQ Budget & Autonomous Spend Limits
                </h4>
            </div>
            <p className="text-[11px] text-[var(--theme-text-secondary)]">
                Values are stored dynamically in the central database and can be adjusted anytime by National HQ.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                        Monthly Procurement Budget ({currency})
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="10000"
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(e.target.value)}
                        placeholder="5000000"
                        className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                        Autonomous PO Limit ({currency})
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="5000"
                        value={autonomousLimit}
                        onChange={(e) => setAutonomousLimit(e.target.value)}
                        placeholder="Set a regional limit"
                        className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[var(--theme-border)]/50">
                <div>
                    <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                        Monthly Expense Budget ({currency})
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="5000"
                        value={monthlyExpenseBudget}
                        onChange={(e) => setMonthlyExpenseBudget(e.target.value)}
                        placeholder="500000"
                        className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-medium text-[var(--theme-text-primary)] mb-1">
                        Autonomous Expense Limit ({currency})
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={autonomousExpenseLimit}
                        onChange={(e) => setAutonomousExpenseLimit(e.target.value)}
                        placeholder="25000"
                        className="w-full px-3 py-2 text-xs font-mono bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-xl text-[var(--theme-text-primary)] focus:outline-none focus:border-[var(--theme-accent)]"
                    />
                </div>
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-[var(--theme-text-secondary)] pt-1">
                <ShieldAlert size={13} className="shrink-0 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] mt-0.5" />
                <span>
                    Orders or expenses exceeding regional autonomous limits automatically require 4-eyes approval from National HQ before issuance.
                </span>
            </div>
        </div>
    );
};
