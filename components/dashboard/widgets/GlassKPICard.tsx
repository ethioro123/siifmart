import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { formatCompactNumber } from '../../../utils/formatting';
import { GlassKPICardProps, NeutralSwatch } from '../types';

export const GlassKPICard = ({ title, value, icon: Icon, color, swatch, sub, route, trend }: GlassKPICardProps) => {
    const navigate = useNavigate();

    // Map color string or explicit swatch to one of the semantic swatches
    const resolvedSwatch: NeutralSwatch = swatch || (
        color?.includes('blue') ? 'silk' :
        color?.includes('emerald') || color?.includes('green') ? 'slate' :
        color?.includes('indigo') || color?.includes('purple') || color?.includes('teal') ? 'graphite' :
        color?.includes('amber') || color?.includes('yellow') || color?.includes('orange') ? 'obsidian' :
        'silk'
    );

    const swatchStyles = {
        silk: { // Apple System Blue - Revenue & Primary Action
            topBar: 'bg-[#0071E3] dark:bg-[#2997FF]',
            iconBox: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            dotColor: 'bg-blue-500 dark:bg-blue-400'
        },
        slate: { // Apple System Emerald - Operating Profit & Margins
            topBar: 'bg-[#34C759] dark:bg-[#30D158]',
            iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500 dark:bg-emerald-400'
        },
        graphite: { // Apple System Indigo - Fulfillment & Velocity
            topBar: 'bg-[#5E5CE6] dark:bg-[#AF52DE]',
            iconBox: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            dotColor: 'bg-indigo-500 dark:bg-indigo-400'
        },
        obsidian: { // Apple System Amber - Network Assets & Supply
            topBar: 'bg-[#FF9500] dark:bg-[#FF9F0A]',
            iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500 dark:bg-amber-400'
        },
        // Backward-compatible aliases
        champagne: {
            topBar: 'bg-[#0071E3] dark:bg-[#2997FF]',
            iconBox: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            dotColor: 'bg-blue-500 dark:bg-blue-400'
        },
        mocha: {
            topBar: 'bg-[#34C759] dark:bg-[#30D158]',
            iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            dotColor: 'bg-emerald-500 dark:bg-emerald-400'
        },
        cashmere: {
            topBar: 'bg-[#5E5CE6] dark:bg-[#AF52DE]',
            iconBox: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            dotColor: 'bg-indigo-500 dark:bg-indigo-400'
        },
        walnut: {
            topBar: 'bg-[#FF9500] dark:bg-[#FF9F0A]',
            iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
            dotColor: 'bg-amber-500 dark:bg-amber-400'
        }
    }[resolvedSwatch];

    const isNegativeTrend = trend ? trend.trim().startsWith('-') : false;
    const trendBadgeClass = isNegativeTrend
        ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20'
        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';

    return (
        <div
            onClick={() => route && navigate(route)}
            className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer bg-[var(--theme-bg-card)] border border-[var(--theme-border)] shadow-sm hover:shadow-md hover:border-[var(--theme-border-focus)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99]"
        >
            {/* Architectural solid swatch top hairline (NO gradient) */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${swatchStyles.topBar}`} />

            <div className="flex justify-between items-start mb-4 relative z-10 pt-1">
                <div className={`p-2.5 rounded-xl ${swatchStyles.iconBox} group-hover:scale-105 transition-transform duration-200`}>
                    <Icon size={20} className={swatchStyles.iconColor} />
                </div>
                {trend && (
                    <span className={`flex items-center text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border ${trendBadgeClass}`}>
                        <TrendingUp size={12} className={`mr-1 ${isNegativeTrend ? 'rotate-180' : ''}`} /> {trend}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-[var(--theme-text-muted)] text-[11px] font-semibold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl lg:text-3xl font-mono font-bold text-[var(--theme-text-primary)] tracking-tight truncate tabular-nums">
                    {typeof value === 'number' ? formatCompactNumber(value) : value}
                </h3>
                {sub && (
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-2 font-medium flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${swatchStyles.dotColor}`}></span>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
};
