import React from 'react';
import { Trophy, Crown, User, Medal, Award } from 'lucide-react';

interface DashboardLeaderboardProps {
    siteLeaderboard: any[];
    activeSite: any;
    t: (key: string) => string;
}

export const DashboardLeaderboard: React.FC<DashboardLeaderboardProps> = ({
    siteLeaderboard,
    activeSite
}) => {
    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] p-5 sm:p-6 md:p-8 rounded-2xl shadow-xs relative overflow-hidden mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">
                            Performance Elite Hub
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Site Command: {activeSite?.name || 'Central Network'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[var(--theme-bg-subtle)] rounded-full border border-[var(--theme-border)] shrink-0 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-[var(--theme-status-success)] animate-pulse" />
                    <span className="text-xs font-medium text-[var(--theme-text-secondary)]">Live Feed Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {siteLeaderboard.slice(0, 5).map((worker: any, idx: number) => {
                    const rank = idx + 1;
                    const getRankBadge = () => {
                        if (rank === 1) return { icon: <Crown size={14} className="text-[var(--theme-status-warning-text)]" />, label: 'Rank 1', border: 'border-[var(--theme-status-warning-border)]' };
                        if (rank === 2) return { icon: <Medal size={14} className="text-slate-400" />, label: 'Rank 2', border: 'border-slate-400/30' };
                        if (rank === 3) return { icon: <Medal size={14} className="text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]" />, label: 'Rank 3', border: 'border-[var(--theme-status-warning-border)]' };
                        return { icon: <Award size={14} className="text-[var(--theme-text-secondary)]" />, label: `Rank ${rank}`, border: 'border-[var(--theme-border)]' };
                    };
                    const badge = getRankBadge();

                    return (
                        <div
                            key={worker.id}
                            className={`relative flex flex-col p-4 rounded-xl bg-[var(--theme-bg-subtle)] border ${badge.border} hover:bg-[var(--theme-bg-card)] transition-colors group/card`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-primary)]">
                                    {badge.icon}
                                    <span>#{rank}</span>
                                </span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/10/10 text-[var(--theme-accent)]">
                                    LVL {worker.level}
                                </span>
                            </div>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center mb-3 shadow-xs">
                                    <User size={24} className="text-[var(--theme-text-secondary)]" />
                                </div>
                                <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] truncate w-full">
                                    {worker.employeeName}
                                </h4>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                    {worker.levelTitle}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="p-2 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-center">
                                    <p className="text-[10px] text-[var(--theme-text-secondary)]">Accuracy</p>
                                    <span className="text-xs font-semibold font-mono text-[var(--theme-text-primary)]">
                                        {worker.averageAccuracy > 0 ? `${worker.averageAccuracy}%` : '--'}
                                    </span>
                                </div>
                                <div className="p-2 rounded-lg bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-center">
                                    <p className="text-[10px] text-[var(--theme-text-secondary)]">Speed</p>
                                    <span className="text-xs font-semibold font-mono text-[var(--theme-text-primary)]">
                                        {worker.averageTimePerJob > 0 ? `${worker.averageTimePerJob}m` : '--'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="flex justify-between items-baseline mb-1.5">
                                    <span className="text-[11px] text-[var(--theme-text-secondary)]">Weekly Target</span>
                                    <span className="text-xs font-semibold font-mono text-[var(--theme-text-primary)]">
                                        {worker.weeklyPoints.toLocaleString()} <span className="text-[10px] text-[var(--theme-accent)]">PTS</span>
                                    </span>
                                </div>
                                <div className="h-1.5 bg-[var(--theme-bg-card)] rounded-full overflow-hidden border border-[var(--theme-border)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--theme-accent)] transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(0, (worker.weeklyPoints / 2000) * 100))}%` }}
                                    />
                                </div>
                            </div>

                            {(worker.achievements && worker.achievements.length > 0) && (
                                <div className="mt-3 flex gap-1.5 items-center justify-center pt-3 border-t border-[var(--theme-border)]">
                                    {worker.achievements.slice(0, 3).map((ach: any, i: number) => (
                                        <div
                                            key={i}
                                            className="w-6 h-6 rounded-md bg-[var(--theme-bg-card)] border border-[var(--theme-border)] flex items-center justify-center"
                                            title={ach.name}
                                        >
                                            <Award size={13} className="text-[var(--theme-accent)]" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DashboardLeaderboard;
