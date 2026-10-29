import React from 'react';
import { Crown, Building2, ShieldCheck, Zap } from 'lucide-react';

interface OrgMatrixKPIsProps {
    metrics: {
        total: number;
        active: number;
        onLeave: number;
        l1: number;
        l2: number;
        l3: number;
        l4: number;
    };
    isDark: boolean;
}

export const OrgMatrixKPIs: React.FC<OrgMatrixKPIsProps> = ({ metrics, isDark }) => {
    const cardBg = 'bg-[var(--theme-bg-card)] border-[var(--theme-border)] shadow-xs';

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Total Workforce */}
            <div className={`p-3 rounded-2xl border ${cardBg}`}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">Total Workforce</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-lg font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)]">{metrics.total}</span>
                    <span className="text-[10px] font-semibold text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">{metrics.active} active</span>
                </div>
            </div>

            {/* L1-L2 Executive */}
            <div className={`p-3 rounded-2xl border ${cardBg}`}>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-accent)]">
                    <Crown size={12} />
                    <span>L1-L2 Executive</span>
                </div>
                <div className="text-lg font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] mt-1">{metrics.l1}</div>
            </div>

            {/* L3-L5 Directors */}
            <div className={`p-3 rounded-2xl border ${cardBg}`}>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                    <Building2 size={12} />
                    <span>L3-L5 Directors</span>
                </div>
                <div className="text-lg font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] mt-1">{metrics.l2}</div>
            </div>

            {/* L6-L8 Supervisors */}
            <div className={`p-3 rounded-2xl border ${cardBg}`}>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">
                    <ShieldCheck size={12} />
                    <span>L6-L8 Managers</span>
                </div>
                <div className="text-lg font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] mt-1">{metrics.l3}</div>
            </div>

            {/* L9-L10 Frontline */}
            <div className={`p-3 rounded-2xl border ${cardBg}`}>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-status-info-text)]">
                    <Zap size={12} />
                    <span>L9-L10 Staff</span>
                </div>
                <div className="text-lg font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] mt-1">{metrics.l4}</div>
            </div>

            {/* On Leave */}
            <div className={`p-3 rounded-2xl border ${cardBg}`}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">On Leave</div>
                <div className="text-lg font-black text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] mt-1">{metrics.onLeave}</div>
            </div>
        </div>
    );
};
