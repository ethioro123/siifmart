import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    stats?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions, stats }: PageHeaderProps) {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)] mb-1">{title}</h1>
                    {subtitle && <p className="text-sm text-[var(--theme-text-secondary)]">{subtitle}</p>}
                </div>
                {actions && <div className="flex gap-3">{actions}</div>}
            </div>
            {stats && <div>{stats}</div>}
        </div>
    );
}
