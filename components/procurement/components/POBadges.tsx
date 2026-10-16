import React from 'react';

export const renderPriorityBadge = (priority?: string) => {
    const p = (priority || 'Normal').toLowerCase();
    const isUrgent = p === 'urgent' || p === 'high';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${isUrgent ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)]'}`}>
            {priority || 'Normal'}
        </span>
    );
};

export const renderStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; border: string }> = {
        Received: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
        'Partially Received': { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
        Approved: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
        Ordered: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
        Draft: { bg: 'bg-[var(--theme-bg-subtle)]', text: 'text-[var(--theme-text-secondary)]', border: 'border-[var(--theme-border)]' },
        Pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
        Cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
        Rejected: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
    };
    const c = config[status] || config.Draft;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.bg} ${c.text} border ${c.border}`}>
            {status}
        </span>
    );
};
