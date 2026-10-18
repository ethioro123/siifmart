import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
    onClick?: () => void;
}

export default function StatCard({
    label,
    value,
    icon,
    trend,
    color = 'primary',
    onClick
}: StatCardProps) {
    const colorClasses = {
        primary: 'text-[var(--theme-text-primary)]',
        blue: 'text-[var(--theme-status-info-text)]',
        green: 'text-[var(--theme-status-success-text)]',
        yellow: 'text-[var(--theme-status-warning-text)]',
        red: 'text-[var(--theme-status-danger-text)]',
        purple: 'text-purple-400',
        gray: 'text-[var(--theme-text-secondary)]'
    };

    return (
        <div
            className={`bg-[var(--theme-bg-card)] rounded-2xl p-4 border border-[var(--theme-border)] shadow-sm ${onClick ? 'cursor-pointer hover:bg-[var(--theme-bg-card-hover)] transition-colors' : ''
                }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[var(--theme-text-secondary)] uppercase font-semibold tracking-wider">{label}</p>
                {icon && <div className="text-[var(--theme-text-muted)]">{icon}</div>}
            </div>
            <div className="flex items-end justify-between">
                <p className={`text-2xl font-mono font-bold tracking-tight ${colorClasses[color]}`}>
                    {value}
                </p>
                {trend && (
                    <span className={`text-xs font-semibold ${trend.isPositive ? 'text-[var(--theme-status-success-text)]' : 'text-[var(--theme-status-danger-text)]'
                        }`}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                )}
            </div>
        </div>
    );
}
