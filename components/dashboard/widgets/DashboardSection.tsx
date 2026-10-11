import React from 'react';

interface DashboardSectionProps {
    title: string;
    icon: any;
    children: React.ReactNode;
    className?: string;
}

export const DashboardSection = ({ title, icon: Icon, children, className = "" }: DashboardSectionProps) => (
    <div className={`space-y-4 mb-10 ${className}`}>
        <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 flex items-center justify-center shrink-0">
                <Icon size={15} />
            </div>
            <h2 className="text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider">{title}</h2>
            <div className="flex-1 h-[1px] bg-[var(--theme-border)] ml-3" />
        </div>
        {children}
    </div>
);

