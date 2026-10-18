import React from 'react';

export interface FulfillmentHeaderMetricsProps {
    pending: number;
    active: number;
    completed: number;
    labels?: {
        pending?: string;
        active?: string;
        completed?: string;
    };
    className?: string;
}

/**
 * Modern Apple-style operational metrics component for fulfillment headers.
 * Displays high-contrast tabular figures paired with semantic micro-indicators.
 * Strictly hidden on mobile (`hidden sm:grid`) to preserve mobile ergonomics.
 */
export const FulfillmentHeaderMetrics: React.FC<FulfillmentHeaderMetricsProps> = ({
    pending,
    active,
    completed,
    labels,
    className = ''
}) => {
    const stats = [
        {
            value: pending,
            label: labels?.pending || 'Pending',
            numColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500'
        },
        {
            value: active,
            label: labels?.active || 'In Progress',
            numColor: 'text-[var(--theme-accent)]',
            dotColor: 'bg-[var(--theme-accent)]'
        },
        {
            value: completed,
            label: labels?.completed || 'Completed',
            numColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500'
        }
    ];

    return (
        <div className={`hidden sm:grid grid-cols-3 gap-1.5 sm:gap-2 w-auto shrink-0 select-none ${className}`}>
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="bg-[var(--theme-bg-subtle)]/80 hover:bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]/80 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-left min-w-[72px] sm:min-w-[82px] transition-all duration-150 flex flex-col justify-center shadow-2xs"
                >
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${stat.dotColor} shrink-0`} />
                        <span className={`text-sm sm:text-base md:text-lg font-mono font-bold tabular-nums leading-none tracking-tight ${stat.numColor}`}>
                            {stat.value}
                        </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-[var(--theme-text-secondary)] font-semibold uppercase tracking-wider leading-none">
                        {stat.label}
                    </p>
                </div>
            ))}
        </div>
    );
};
