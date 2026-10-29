import React from 'react';
import { Scale, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import type { DisciplinaryRecord } from '../../../types/hr-advanced';

interface DisciplinaryKPIsProps {
    records: DisciplinaryRecord[];
}

export function DisciplinaryKPIs({ records }: DisciplinaryKPIsProps) {
    const totalCount = records.length;
    const activeWarnings = records.filter(r =>
        ['Verbal Warning', 'Written Warning', 'Final Warning', 'Suspension'].includes(r.record_type) &&
        r.appeal_status !== 'Overturned'
    ).length;
    const pendingAppeals = records.filter(r => r.appeal_status === 'Pending Appeal').length;
    const highCritical = records.filter(r => r.severity === 'Critical' || r.severity === 'High').length;

    const cards = [
        {
            label: 'Total Notices',
            value: totalCount,
            sub: 'All formal disciplinary files',
            icon: Scale,
            color: 'text-[var(--theme-accent)] dark:text-[var(--theme-accent)]',
            bg: 'bg-[var(--theme-status-info-bg)]'
        },
        {
            label: 'Active Warnings',
            value: activeWarnings,
            sub: 'Policy violations & sanctions',
            icon: AlertTriangle,
            color: 'text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]',
            bg: 'bg-[var(--theme-status-warning-bg)]'
        },
        {
            label: 'Appeals Pending',
            value: pendingAppeals,
            sub: 'Awaiting independent 4-Eyes review',
            icon: Clock,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500/10',
            highlight: pendingAppeals > 0
        },
        {
            label: 'High & Critical',
            value: highCritical,
            sub: 'Severe misconduct investigations',
            icon: ShieldAlert,
            color: 'text-[var(--theme-status-danger-text)] text-[var(--theme-status-danger-text)]',
            bg: 'bg-[var(--theme-status-danger-bg)]'
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div
                        key={i}
                        className={`p-4 rounded-2xl bg-[var(--theme-bg-card)] border transition-all ${
                            card.highlight
                                ? 'border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                                : 'border-[var(--theme-border)] shadow-[var(--shadow-sm)]'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                {card.label}
                            </span>
                            <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                                <Icon size={16} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)]">
                                {card.value}
                            </span>
                        </div>
                        <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 truncate">
                            {card.sub}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
