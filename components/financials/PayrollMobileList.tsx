import React from 'react';
import type { Employee } from '../../types';

interface PayrollMobileListProps {
    employees: Employee[];
    currencySymbol: string;
    calculateEmployeeBonus: (emp: Employee) => number;
    getEmployeeJobTitle: (emp: Employee) => string;
}

export const PayrollMobileList: React.FC<PayrollMobileListProps> = ({
    employees,
    currencySymbol,
    calculateEmployeeBonus,
    getEmployeeJobTitle
}) => {
    if (employees.length === 0) {
        return (
            <div className="p-8 text-center text-[var(--theme-text-secondary)] text-xs">
                No personnel matching the current filters.
            </div>
        );
    }

    return (
        <div className="space-y-3 p-3">
            {employees.map((emp) => {
                const bonus = calculateEmployeeBonus(emp);
                const salary = Number(emp.salary) || 0;
                const total = salary + bonus;

                return (
                    <div
                        key={emp.id}
                        className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-4 shadow-xs space-y-3"
                    >
                        {/* Top: Avatar, Name & Role */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] overflow-hidden shrink-0 flex items-center justify-center">
                                    {emp.avatar ? (
                                        <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[11px] font-bold text-[var(--theme-text-primary)]">
                                            {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-[var(--theme-text-primary)] leading-tight">
                                        {emp.name}
                                    </h4>
                                    <span className="text-[11px] text-[var(--theme-text-secondary)] block mt-0.5">
                                        {emp.department}
                                    </span>
                                </div>
                            </div>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] shrink-0">
                                {getEmployeeJobTitle(emp)}
                            </span>
                        </div>

                        {/* Financial Metrics Breakdown */}
                        <div className="pt-2.5 border-t border-[var(--theme-border)] grid grid-cols-3 gap-2 text-center font-mono">
                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    Base Salary
                                </span>
                                <span className="text-xs font-semibold text-[var(--theme-text-primary)] tabular-nums">
                                    {currencySymbol} {salary.toLocaleString()}
                                </span>
                            </div>

                            <div className="bg-[var(--theme-bg-subtle)] p-2 rounded-xl border border-[var(--theme-border)]">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    Bonus
                                </span>
                                <span className="text-xs font-semibold tabular-nums">
                                    {bonus > 0 ? (
                                        <span className="text-[var(--theme-status-success-text)]">
                                            +{currencySymbol} {bonus.toLocaleString()}
                                        </span>
                                    ) : (
                                        <span className="text-[var(--theme-text-secondary)] opacity-50">—</span>
                                    )}
                                </span>
                            </div>

                            <div className="bg-[var(--theme-status-success-bg)]/20 border border-[var(--theme-status-success-border)]/40 p-2 rounded-xl">
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-text-secondary)] tracking-wider block font-sans">
                                    Net Payout
                                </span>
                                <span className="text-xs font-bold text-[var(--theme-status-success-text)] tabular-nums">
                                    {currencySymbol} {total.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
