import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { formatCompactNumber } from '../../../utils/formatting';
import { GlassKPICardProps, NeutralSwatch } from '../types';

const SWATCH_STYLES: Record<NeutralSwatch, { accent: string; surface: string; text: string; dot: string }> = {
    silk: { accent: 'bg-[var(--theme-accent)]', surface: 'bg-[var(--theme-accent-muted)] border-[var(--theme-accent)]/20', text: 'text-[var(--theme-accent)]', dot: 'bg-[var(--theme-accent)]' },
    champagne: { accent: 'bg-[var(--theme-accent)]', surface: 'bg-[var(--theme-accent-muted)] border-[var(--theme-accent)]/20', text: 'text-[var(--theme-accent)]', dot: 'bg-[var(--theme-accent)]' },
    slate: { accent: 'bg-[var(--theme-status-success)]', surface: 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]', text: 'text-[var(--theme-status-success-text)]', dot: 'bg-[var(--theme-status-success)]' },
    mocha: { accent: 'bg-[var(--theme-status-success)]', surface: 'bg-[var(--theme-status-success-bg)] border-[var(--theme-status-success-border)]', text: 'text-[var(--theme-status-success-text)]', dot: 'bg-[var(--theme-status-success)]' },
    graphite: { accent: 'bg-[var(--theme-status-info)]', surface: 'bg-[var(--theme-status-info-bg)] border-[var(--theme-status-info-border)]', text: 'text-[var(--theme-status-info-text)]', dot: 'bg-[var(--theme-status-info)]' },
    cashmere: { accent: 'bg-[var(--theme-status-info)]', surface: 'bg-[var(--theme-status-info-bg)] border-[var(--theme-status-info-border)]', text: 'text-[var(--theme-status-info-text)]', dot: 'bg-[var(--theme-status-info)]' },
    obsidian: { accent: 'bg-[var(--theme-status-warning)]', surface: 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]', text: 'text-[var(--theme-status-warning-text)]', dot: 'bg-[var(--theme-status-warning)]' },
    walnut: { accent: 'bg-[var(--theme-status-warning)]', surface: 'bg-[var(--theme-status-warning-bg)] border-[var(--theme-status-warning-border)]', text: 'text-[var(--theme-status-warning-text)]', dot: 'bg-[var(--theme-status-warning)]' },
};

export const GlassKPICard = ({ title, value, icon: Icon, color, swatch, sub, route, trend }: GlassKPICardProps) => {
    const navigate = useNavigate();
    const resolvedSwatch: NeutralSwatch = swatch || (
        color?.includes('blue') ? 'silk' :
        color?.includes('emerald') || color?.includes('green') ? 'slate' :
        color?.includes('indigo') || color?.includes('purple') || color?.includes('teal') ? 'graphite' :
        color?.includes('amber') || color?.includes('yellow') || color?.includes('orange') ? 'obsidian' : 'silk'
    );
    const styles = SWATCH_STYLES[resolvedSwatch];
    const isNegativeTrend = trend ? trend.trim().startsWith('-') : false;
    const trendBadgeClass = isNegativeTrend
        ? 'text-[var(--theme-status-danger-text)] bg-[var(--theme-status-danger-bg)]'
        : 'text-[var(--theme-status-success-text)] bg-[var(--theme-status-success-bg)]';

    return (
        <article className={`group relative overflow-hidden rounded-2xl p-4 sm:p-6 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-xs ${route ? 'hover:bg-[var(--theme-bg-card-hover)] transition-colors' : ''}`}>
            <div aria-hidden="true" className={`absolute top-0 left-0 right-0 h-0.5 ${styles.accent}`} />
            <div className="flex justify-between items-start mb-4 relative z-10 pt-1">
                <div className={`p-2.5 rounded-xl border ${styles.surface}`}>
                    <Icon size={20} className={styles.text} aria-hidden="true" />
                </div>
                {trend && (
                    <span className={`flex items-center text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full ${trendBadgeClass}`} aria-label={`Trend ${trend}`}>
                        <TrendingUp size={12} aria-hidden="true" className={`mr-1 ${isNegativeTrend ? 'rotate-180' : ''}`} /> {trend}
                    </span>
                )}
            </div>
            <div className="relative z-10 pointer-events-none">
                <p className="text-[var(--theme-text-muted)] text-[11px] font-semibold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl lg:text-3xl font-mono font-bold text-[var(--theme-text-primary)] tracking-tight truncate tabular-nums">
                    {typeof value === 'number' ? formatCompactNumber(value) : value}
                </h3>
                {sub && (
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-2 font-medium flex items-center gap-1.5">
                        <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                        {sub}
                    </p>
                )}
            </div>
            {route && <button type="button" onClick={() => navigate(route)} className="absolute inset-0 z-20 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-accent)]" aria-label={`Open ${title}`} />}
        </article>
    );
};
