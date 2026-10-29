import React from 'react';

export const renderPriorityBadge = (priority?: string) => {
    const p = (priority || 'Normal').toLowerCase();
    const isUrgent = p === 'urgent' || p === 'high';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${isUrgent ? 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'}`}>
            {priority || 'Normal'}
        </span>
    );
};

export const renderStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; border: string }> = {
        Received: { bg: 'bg-[var(--theme-status-success-bg)]', text: 'text-[var(--theme-status-success-text)]', border: 'border-[var(--theme-status-success-border)]' },
        'Partially Received': { bg: 'bg-[var(--theme-status-warning-bg)]', text: 'text-[var(--theme-status-warning-text)]', border: 'border-[var(--theme-status-warning-border)]' },
        Approved: { bg: 'bg-[var(--theme-status-info-bg)]', text: 'text-[var(--theme-status-info-text)]', border: 'border-[var(--theme-status-info-border)]' },
        Ordered: { bg: 'bg-[var(--theme-accent-muted)]', text: 'text-[var(--theme-accent)]', border: 'border-[var(--theme-border-accent)]' },
        Draft: { bg: 'bg-[var(--theme-bg-subtle)]', text: 'text-[var(--theme-text-secondary)]', border: 'border-[var(--theme-border)]' },
        Pending: { bg: 'bg-[var(--theme-status-warning-bg)]', text: 'text-[var(--theme-status-warning-text)]', border: 'border-[var(--theme-status-warning-border)]' },
        Cancelled: { bg: 'bg-[var(--theme-status-danger-bg)]', text: 'text-[var(--theme-status-danger-text)]', border: 'border-[var(--theme-status-danger-border)]' },
        Rejected: { bg: 'bg-[var(--theme-status-danger-bg)]', text: 'text-[var(--theme-status-danger-text)]', border: 'border-[var(--theme-status-danger-border)]' },
    };
    const c = config[status] || config.Draft;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.bg} ${c.text} border ${c.border}`}>
            {status}
        </span>
    );
};
