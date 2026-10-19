import React, { useMemo } from 'react';
import { Crown, Award, User as UserIcon } from 'lucide-react';
import type { WorkerPoints } from '../../types';

interface LeaderboardWidgetProps {
    workers: WorkerPoints[];
    currentUserId?: string;
}

export function LeaderboardWidget({ workers, currentUserId }: LeaderboardWidgetProps) {
    const sortedWorkers = useMemo(() =>
        [...workers].sort((a, b) => {
            const diffWeekly = (b.weeklyPoints || 0) - (a.weeklyPoints || 0);
            if (diffWeekly !== 0) return diffWeekly;
            return (b.totalPoints || 0) - (a.totalPoints || 0);
        }).slice(0, 5),
        [workers]
    );

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
            <div className="p-4 border-b border-[var(--theme-border)] flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-2">
                    <Crown className="text-amber-500" size={15} />
                    <span>Top Performers</span>
                </h4>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)] bg-[var(--theme-bg-subtle)] px-2 py-0.5 rounded-full border border-[var(--theme-border)]">
                    This Week
                </span>
            </div>

            {sortedWorkers.length === 0 ? (
                <div className="p-8 text-center">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-text-secondary)]">
                        <Award size={20} className="text-amber-500/80" />
                    </div>
                    <p className="text-xs font-semibold text-[var(--theme-text-primary)]">No Activity Yet This Week</p>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 max-w-[210px] mx-auto leading-relaxed">
                        Cashiers and fulfillment staff will rank here as transactions and jobs are completed.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-[var(--theme-border)]">
                    {sortedWorkers.map((worker, index) => {
                        const rank = index + 1;
                        const isCurrentUser = worker.employeeId === currentUserId;

                        return (
                            <div
                                key={worker.id || worker.employeeId || index}
                                className={`flex items-center gap-3 p-3.5 transition-colors ${
                                    isCurrentUser
                                        ? 'bg-[#0071E3]/5 dark:bg-[#2997FF]/10'
                                        : 'hover:bg-[var(--theme-bg-subtle)]'
                                }`}
                            >
                                {/* Rank badge */}
                                <div
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                                        rank === 1
                                            ? 'bg-amber-500 text-white shadow-2xs'
                                            : rank === 2
                                            ? 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100'
                                            : rank === 3
                                            ? 'bg-amber-700 text-white'
                                            : 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                                    }`}
                                >
                                    {rank}
                                </div>

                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-secondary)] shrink-0 font-semibold text-xs overflow-hidden">
                                    {worker.employeeAvatar ? (
                                        <img src={worker.employeeAvatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        worker.employeeName?.charAt(0)?.toUpperCase() || <UserIcon size={14} />
                                    )}
                                </div>

                                {/* Name & Level */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-xs font-medium truncate flex items-center gap-1.5 ${
                                            isCurrentUser
                                                ? 'text-[#0071E3] dark:text-[#2997FF] font-semibold'
                                                : 'text-[var(--theme-text-primary)]'
                                        }`}
                                    >
                                        <span className="truncate">{worker.employeeName}</span>
                                        {isCurrentUser && (
                                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#2997FF]/15 dark:text-[#2997FF]">
                                                You
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-[var(--theme-text-secondary)]">
                                        Lv.{worker.level || 1} {worker.levelTitle || 'Rookie'}
                                    </p>
                                </div>

                                {/* Points */}
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                                        {(worker.weeklyPoints || worker.totalPoints || 0).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] font-semibold text-[var(--theme-text-secondary)] uppercase">
                                        pts
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default LeaderboardWidget;
