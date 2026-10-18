import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function Badge({
    children,
    variant = 'neutral',
    size = 'md',
    className = ''
}: BadgeProps) {
    const variants = {
        primary: 'bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] border-[var(--theme-border)]',
        success: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border-[var(--theme-status-success-border)]',
        warning: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border-[var(--theme-status-warning-border)]',
        danger: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border-[var(--theme-status-danger-border)]',
        info: 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border-[var(--theme-status-info-border)]',
        neutral: 'bg-[var(--theme-status-neutral-bg)] text-[var(--theme-status-neutral-text)] border-[var(--theme-status-neutral-border)]'
    };

    const sizes = {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5'
    };

    return (
        <span
            className={`inline-flex items-center font-medium rounded-lg border ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </span>
    );
}
