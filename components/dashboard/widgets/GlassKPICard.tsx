import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { formatCompactNumber } from '../../../utils/formatting';
import { GlassKPICardProps, NeutralSwatch } from '../types';

export const GlassKPICard = ({ title, value, icon: Icon, color, swatch, sub, route, trend }: GlassKPICardProps) => {
    const navigate = useNavigate();

    // Map color string or explicit swatch to one of the semantic swatches
    const resolvedSwatch: NeutralSwatch = swatch || (
        color?.includes('emerald') || color?.includes('green') ? 'silk' :
        color?.includes('teal') ? 'slate' :
        color?.includes('blue') ? 'graphite' :
        color?.includes('amber') || color?.includes('yellow') ? 'obsidian' :
        'silk'
    );

    const swatchStyles = {
        silk: {
            topBar: 'bg-[var(--theme-primary)]',
            iconBox: 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border border-[var(--theme-border)]',
            trendPill: 'text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] font-bold',
            iconColor: 'text-[var(--theme-primary-text)]'
        },
        slate: {
            topBar: 'bg-[#86868B]',
            iconBox: 'bg-[#86868B] text-white border border-[#86868B]',
            trendPill: 'text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] font-bold',
            iconColor: 'text-white'
        },
        graphite: {
            topBar: 'bg-[#0071E3] dark:bg-[#2997FF]',
            iconBox: 'bg-[#0071E3] dark:bg-[#2997FF] text-white border border-transparent',
            trendPill: 'text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] font-bold',
            iconColor: 'text-white'
        },
        obsidian: {
            topBar: 'bg-[#1D1D1F] dark:bg-[#86868B]',
            iconBox: 'bg-[#1D1D1F] dark:bg-[#2C2C2E] text-[var(--theme-text-primary)] border border-[var(--theme-border)]',
            trendPill: 'text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] font-bold',
            iconColor: 'text-white dark:text-[#F5F5F7]'
        },
        // Backward-compatible aliases
        champagne: {
            topBar: 'bg-[var(--theme-primary)]',
            iconBox: 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] border border-[var(--theme-border)]',
            trendPill: 'text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] font-bold',
            iconColor: 'text-[var(--theme-primary-text)]'
        },
        mocha: {
            topBar: 'bg-[#86868B]',
            iconBox: 'bg-[#86868B] text-white border border-[#86868B]',
            trendPill: 'text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] font-bold',
            iconColor: 'text-white'
        },
        cashmere: {
            topBar: 'bg-[#0071E3] dark:bg-[#2997FF]',
            iconBox: 'bg-[#0071E3] dark:bg-[#2997FF] text-white border border-transparent',
            trendPill: 'text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] font-bold',
            iconColor: 'text-white'
        },
        walnut: {
            topBar: 'bg-[#1D1D1F] dark:bg-[#86868B]',
            iconBox: 'bg-[#1D1D1F] dark:bg-[#2C2C2E] text-[var(--theme-text-primary)] border border-[var(--theme-border)]',
            trendPill: 'text-[var(--theme-text-primary)] bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] font-bold',
            iconColor: 'text-white dark:text-[#F5F5F7]'
        }
    }[resolvedSwatch];

    return (
        <div
            onClick={() => route && navigate(route)}
            className="group relative overflow-hidden rounded-3xl p-6 cursor-pointer bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm hover:shadow-md hover:border-[var(--theme-border-focus)] transition-all duration-200 hover:-translate-y-0.5"
        >
            {/* Architectural solid swatch top hairline (NO gradient) */}
            <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${swatchStyles.topBar}`} />

            <div className="flex justify-between items-start mb-4 relative z-10 pt-1">
                <div className={`p-3 rounded-2xl ${swatchStyles.iconBox} group-hover:scale-105 transition-transform duration-200`}>
                    <Icon size={22} className={swatchStyles.iconColor} />
                </div>
                {trend && (
                    <span className={`flex items-center text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${swatchStyles.trendPill}`}>
                        <TrendingUp size={10} className={`mr-1 ${trend.startsWith('-') ? 'rotate-180' : ''}`} /> {trend}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-[var(--theme-text-muted)] text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl lg:text-3xl font-mono font-bold text-[var(--theme-text-primary)] tracking-tight truncate">
                    {typeof value === 'number' ? formatCompactNumber(value) : value}
                </h3>
                {sub && (
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-2 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-text-muted)]"></span>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
};
