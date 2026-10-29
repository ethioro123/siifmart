import React, { useMemo } from 'react';
import {
    Trophy, Star, Zap, Target, Flame, Award, TrendingUp,
    Clock, Package, CheckCircle, Sparkles, Crown, Medal, DollarSign, Gift, User as UserIcon
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useGamification } from '../contexts/GamificationContext';
import { useStore } from '../contexts/CentralStore';
import { WorkerPoints, WorkerAchievement, BonusTier, DEFAULT_BONUS_TIERS } from '../types';
import {
    calculateBonus,
    getBonusTierColor,
    getLevelInfo,
    getRankStyle,
    getLevelColor,
    getAchievementIcon
} from './settings/gamification/workerPointsHelpers';

export {
    calculateBonus,
    getBonusTierColor,
    getLevelInfo,
    getRankStyle,
    getLevelColor,
    getAchievementIcon
};

interface WorkerPointsDisplayProps {
    points: WorkerPoints;
    compact?: boolean;
    showLeaderboard?: boolean;
    bonusTiers?: BonusTier[];
    currency?: string;
    showBonus?: boolean;
    employeeId?: string; // Added employeeId
    showHistory?: boolean; // Changed from showLeaderboard
}



const WorkerPointsDisplay: React.FC<WorkerPointsDisplayProps> = ({ employeeId, compact = false, showHistory = false, points, bonusTiers = DEFAULT_BONUS_TIERS, currency = 'ETB ', showBonus = true }) => {
    const { activeSite, settings } = useData();
    const { getWorkerPoints, calculateWorkerBonusShare } = useGamification();
    const { user } = useStore();

    const levelInfo = useMemo(() => getLevelInfo(points.totalPoints), [points.totalPoints]);
    const rankStyle = useMemo(() => getRankStyle(points.rank), [points.rank]);
    const levelColor = useMemo(() => getLevelColor(levelInfo.currentLevel.level), [levelInfo.currentLevel.level]);

    // Calculate bonus info based on monthly points
    const bonusInfo = useMemo(() =>
        calculateBonus(points.monthlyPoints, bonusTiers),
        [points.monthlyPoints, bonusTiers]
    );

    // Find next bonus tier
    const nextBonusTier = useMemo(() => {
        const sortedTiers = [...bonusTiers].sort((a, b) => a.minPoints - b.minPoints);
        return sortedTiers.find(t => t.minPoints > points.monthlyPoints);
    }, [points.monthlyPoints, bonusTiers]);

    // Calculate progress to next tier
    const pointsToNextTier = nextBonusTier ? nextBonusTier.minPoints - points.monthlyPoints : 0;
    const bonusTierProgress = useMemo(() => {
        if (!nextBonusTier) return 100;
        const currentTier = bonusInfo.tier;
        const range = nextBonusTier.minPoints - currentTier.minPoints;
        const progress = points.monthlyPoints - currentTier.minPoints;
        return Math.min(100, (progress / range) * 100);
    }, [points.monthlyPoints, bonusInfo.tier, nextBonusTier]);

    // Compact version for sidebar/header
    if (compact) {
        return (
            <div className="group relative flex items-center gap-3 bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] hover:bg-[var(--theme-bg-card)] hover:bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-md border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] hover:border-[var(--theme-border)]/30 rounded-full py-1.5 pr-5 pl-1.5 transition-all duration-300 cursor-default">
                {/* Level Badge with Ring */}
                <div className={`relative w-9 h-9 flex items-center justify-center`}>
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${levelColor} opacity-20 animate-pulse`} />
                    <div className={`relative w-full h-full rounded-full bg-gradient-to-br ${levelColor} flex items-center justify-center shadow-lg border border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]`}>
                        <span className="text-xs font-black text-[var(--theme-text-primary)]">{levelInfo.currentLevel.level}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] leading-none tracking-tight">{points.totalPoints.toLocaleString()}</span>
                        <span className="text-[10px] text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] font-bold uppercase tracking-wider">PTS</span>
                    </div>
                    {/* Micro Progress Bar */}
                    <div className="w-24 h-1 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-bg-card)_10%,transparent)] rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${levelColor} transition-all duration-500`}
                            ref={(el) => { if (el) el.style.width = `${levelInfo.progressPercent}%`; }}
                        />
                    </div>
                </div>

                {/* Rank Indicator (Subtle) */}
                {points.rank <= 3 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--theme-status-warning-bg)] flex items-center justify-center shadow-lg animate-bounce">
                        <Crown size={10} className="text-[var(--theme-text-primary)]" />
                    </div>
                )}

                {/* Hover Tooltip for Details */}
                <div className="absolute top-full right-0 mt-3 w-56 bg-[var(--theme-bg-card)] bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] rounded-2xl p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl translate-y-2 group-hover:translate-y-0 scale-95 group-hover:scale-100 origin-top-right">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${levelColor} text-[var(--theme-text-primary)]`}>
                            {levelInfo.currentLevel.title}
                        </span>
                        <span className="text-xs text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">Rank #{points.rank}</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] mb-1">Level Progress</p>
                    <div className="h-2 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_50%,transparent)] rounded-full overflow-hidden mb-2">
                        <div className={`h-full bg-gradient-to-r ${levelColor}`} ref={(el) => { if (el) el.style.width = `${levelInfo.progressPercent}%`; }} />
                    </div>
                    <p className="text-[10px] text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)] text-right">
                        {levelInfo.pointsToNext > 0
                            ? <><span className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">{levelInfo.pointsToNext}</span> more for Level Up</>
                            : 'Max Level Reached!'}
                    </p>
                </div>
            </div>
        );
    }

    // Full display
    return (
        <div className="space-y-4">
            {/* Main Points Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[var(--theme-accent)] via-[var(--theme-accent)] to-[var(--theme-primary)]/5 dark:from-[var(--theme-bg-panel)]/40 dark:via-[#18201B]/30 to-[var(--theme-status-success)] rounded-2xl border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] shadow-sm">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--theme-primary)]/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--theme-status-success-bg)] rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                </div>

                <div className="relative p-6">
                    {/* Header with avatar and level */}
                    <div className="flex items-start gap-4 mb-6">
                        {/* Avatar with level ring */}
                        <div className="relative">
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${levelColor} p-1 animate-spin-slow [animation-duration:8s]`}>
                                <div className="w-full h-full rounded-full bg-[var(--theme-bg-subtle)] dark:bg-[var(--theme-bg-panel)]" />
                            </div>
                            <div className="relative w-20 h-20 rounded-full bg-[var(--theme-bg-card)] dark:bg-[var(--theme-bg-panel)] border-2 border-[var(--theme-border-subtle)] border-[var(--theme-border)] flex items-center justify-center shadow-inner">
                                <UserIcon size={40} className="text-[var(--theme-text-muted)] text-[var(--theme-text-muted)]" />
                            </div>
                            {/* Level badge */}
                            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${levelColor} flex items-center justify-center shadow-lg border-2 border-[var(--theme-border)] dark:border-[var(--theme-border)]`}>
                                <span className="text-sm font-black text-[var(--theme-text-primary)]">{levelInfo.currentLevel.level}</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-primary)]">{points.employeeName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${levelColor} text-[var(--theme-text-primary)] shadow-lg`}>
                                    {levelInfo.currentLevel.title}
                                </span>
                                {/* Rank badge */}
                                <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${rankStyle.bg} ${rankStyle.text}`}>
                                    {rankStyle.icon} Rank {points.rank}
                                </span>
                            </div>
                        </div>

                        {/* Today's points */}
                        <div className="text-right">
                            <p className="text-xs text-[var(--theme-text-muted)] uppercase font-bold">Today</p>
                            <p className="text-2xl font-black text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)]">+{points.todayPoints}</p>
                        </div>
                    </div>

                    {/* Total Points Display */}
                    <div className="bg-[var(--theme-primary)]/5 bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] rounded-xl p-4 mb-4 border border-[var(--theme-border)]/10 dark:border-transparent">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[#4D6E56] text-[var(--theme-text-muted)] text-sm font-bold uppercase flex items-center gap-2">
                                <Sparkles size={16} className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)]" /> Total Points
                            </span>
                            <span className="text-4xl font-black bg-gradient-to-r from-[var(--theme-status-warning)] to-[var(--theme-status-warning)] from-[var(--theme-status-warning)] to-[var(--theme-status-warning)] text-transparent bg-clip-text">
                                {points.totalPoints.toLocaleString()}
                            </span>
                        </div>
                        {/* Progress to next level */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)]">
                                <span>Level {levelInfo.currentLevel.level}</span>
                                <span>Level {levelInfo.nextLevel.level}</span>
                            </div>
                            <div className="h-3 bg-[var(--theme-bg-subtle)] bg-[color-mix(in_srgb,var(--theme-overlay)_50%,transparent)] rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${levelColor} transition-all duration-1000 ease-out relative`}
                                    ref={(el) => { if (el) el.style.width = `${levelInfo.progressPercent}%`; }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-accent)] via-[var(--theme-accent)] to-[var(--theme-accent)] animate-shimmer" />
                                </div>
                            </div>
                            <p className="text-center text-xs text-[var(--theme-text-secondary)] text-[var(--theme-text-muted)]">
                                {levelInfo.pointsToNext > 0
                                    ? <><strong className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">{levelInfo.pointsToNext}</strong> points to reach <strong className="text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">{levelInfo.nextLevel.title}</strong></>
                                    : <span className="text-[var(--theme-primary)] dark:text-[var(--theme-text-secondary)] font-bold">🎉 Maximum Level Achieved!</span>
                                }
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <StatCard
                            icon={<Package size={18} />}
                            label="Jobs Done"
                            value={points.totalJobsCompleted}
                            color="text-[var(--theme-status-info-text)]"
                        />
                        <StatCard
                            icon={<Target size={18} />}
                            label="Accuracy"
                            value={`${points.averageAccuracy}%`}
                            color="text-[var(--theme-status-success-text)]"
                        />
                        <StatCard
                            icon={<Flame size={18} />}
                            label="Streak"
                            value={`${points.currentStreak} days`}
                            color="text-[var(--theme-status-warning-text)]"
                        />
                        <StatCard
                            icon={<Clock size={18} />}
                            label="Avg Time"
                            value={`${points.averageTimePerJob}m`}
                            color="text-[var(--theme-accent)]"
                        />
                    </div>

                    {/* Time Period Points */}
                    <div className="grid grid-cols-3 gap-3">
                        <TimeCard label="Today" points={points.todayPoints} icon="🌟" />
                        <TimeCard label="This Week" points={points.weeklyPoints} icon="📊" />
                        <TimeCard label="This Month" points={points.monthlyPoints} icon="📅" />
                    </div>

                    {/* Bonus Earnings Section */}
                    {showBonus && bonusInfo && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-[var(--theme-status-success)] to-[var(--theme-status-success)] rounded-xl border border-[var(--theme-status-success-border)]">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getBonusTierColor(bonusInfo.tier.tierColor)} flex items-center justify-center`}>
                                        <Gift size={20} className="text-[var(--theme-text-primary)]" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] text-sm flex items-center gap-2">
                                            Estimated Bonus
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r ${getBonusTierColor(bonusInfo.tier.tierColor)} text-[var(--theme-text-primary)]`}>
                                                {bonusInfo.tier.tierName}
                                            </span>
                                        </h4>
                                        <p className="text-[10px] text-[#4D6E56] text-[var(--theme-text-muted)]">Based on your {points.monthlyPoints} monthly points</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-[var(--theme-status-success-text)] text-[var(--theme-status-success-text)]">
                                        {currency}{bonusInfo.bonus.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[10px] text-[#4D6E56]/70 text-[var(--theme-text-secondary)]">this period</p>
                                </div>
                            </div>

                            {/* Bonus breakdown */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] rounded-lg p-2 border border-[var(--theme-border)]/50 dark:border-transparent">
                                    <span className="text-[#4D6E56] text-[var(--theme-text-muted)]">Base:</span>
                                    <span className="float-right text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">{currency}{bonusInfo.tier.bonusAmount.toLocaleString()}</span>
                                </div>
                                <div className="bg-[color-mix(in_srgb,var(--theme-bg-card)_80%,transparent)] bg-[color-mix(in_srgb,var(--theme-overlay)_80%,transparent)] rounded-lg p-2 border border-[var(--theme-border)]/50 dark:border-transparent">
                                    <span className="text-[#4D6E56] text-[var(--theme-text-muted)]">Per Point:</span>
                                    <span className="float-right text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] font-bold">{currency}{(bonusInfo.tier.bonusPerPoint || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Next tier progress */}
                            {nextBonusTier && (
                                <div className="mt-3 pt-3 border-t border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)]">
                                    <div className="flex justify-between text-[10px] text-[var(--theme-text-muted)] mb-1">
                                        <span>Next: {nextBonusTier.tierName} ({nextBonusTier.minPoints} pts)</span>
                                        <span>{pointsToNextTier} pts to go</span>
                                    </div>
                                    <div className="h-1.5 bg-[color-mix(in_srgb,var(--theme-overlay)_30%,transparent)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[var(--theme-status-success)] to-[var(--theme-status-success)] transition-all"
                                            ref={(el) => { if (el) el.style.width = `${bonusTierProgress}%`; }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Achievements Section */}
            {points.achievements && points.achievements.length > 0 && (
                <div className="bg-[color-mix(in_srgb,var(--theme-overlay)_60%,transparent)] backdrop-blur-2xl rounded-2xl border border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] p-6">
                    <h4 className="text-lg font-bold text-[var(--theme-text-primary)] mb-4 flex items-center gap-2">
                        <Trophy className="text-[var(--theme-status-warning-text)]" size={20} />
                        Achievements ({points.achievements.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {points.achievements.slice(0, 8).map((achievement) => (
                            <AchievementBadge key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                    {points.achievements.length > 8 && (
                        <p className="text-center text-[var(--theme-text-muted)] text-sm mt-3">
                            +{points.achievements.length - 8} more achievements
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// Sub-components
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    return (
        <div className="bg-[var(--theme-bg-card)] bg-[color-mix(in_srgb,var(--theme-overlay)_20%,transparent)] rounded-xl p-3 border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] hover:border-[var(--theme-border)]/20 hover:border-[color-mix(in_srgb,var(--theme-border)_10%,transparent)] transition-colors shadow-sm">
            <div className={`${color} mb-1`}>{icon}</div>
            <p className="text-lg font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-primary)]">{value}</p>
            <p className="text-[10px] text-[var(--theme-text-muted)] text-[var(--theme-text-secondary)] uppercase">{label}</p>
        </div>
    );
}

function TimeCard({ label, points, icon }: { label: string; points: number; icon: string }) {
    return (
        <div className="bg-gradient-to-br from-[var(--theme-accent)] to-[var(--theme-accent)] from-[var(--theme-accent)] to-[var(--theme-accent)] rounded-xl p-3 border border-[var(--theme-border)] border-[color-mix(in_srgb,var(--theme-border)_5%,transparent)] text-center shadow-sm">
            <span className="text-xl">{icon}</span>
            <p className="text-xl font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] mt-1">+{points.toLocaleString()}</p>
            <p className="text-[10px] text-[var(--theme-text-muted)] text-[var(--theme-text-muted)] uppercase">{label}</p>
        </div>
    );
}

function AchievementBadge({ achievement }: { achievement: WorkerAchievement }) {
    return (
        <div className="bg-gradient-to-br from-[var(--theme-status-warning)] to-[var(--theme-status-warning)] rounded-xl p-3 border border-[var(--theme-status-warning-border)] border-[var(--theme-status-warning-border)] hover:border-[var(--theme-border)]/30 hover:bg-[var(--theme-primary)]/5 transition-all group cursor-pointer">
            <div className="text-2xl mb-1">{getAchievementIcon(achievement.type)}</div>
            <p className="text-sm font-bold text-[var(--theme-text-primary)] text-[var(--theme-text-primary)] truncate">{achievement.name}</p>
            <p className="text-[10px] text-[#4D6E56] text-[var(--theme-text-muted)] truncate">{achievement.description}</p>
            <p className="text-[10px] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] mt-1 font-bold">+{achievement.pointsAwarded} pts</p>
        </div>
    );
}

// Re-export modern Apple Design LeaderboardWidget
export { LeaderboardWidget } from './gamification/LeaderboardWidget';

// Points earned toast/popup
export function PointsEarnedPopup({
    points,
    message,
    bonuses = [],
    onClose
}: {
    points: number;
    message: string;
    bonuses?: { label: string; points: number }[];
    onClose: () => void;
}) {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
            <div className="bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-xl backdrop-blur-lg rounded-2xl p-4 border border-[var(--theme-border)] min-w-[280px]">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] flex items-center justify-center border border-[var(--theme-border-focus)]/20 shrink-0">
                        <Sparkles size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-[var(--theme-text-secondary)] font-medium">{message}</p>
                        <p className="text-2xl font-black font-mono text-[var(--theme-status-warning-text)]">+{points}</p>
                        <p className="text-[11px] text-[var(--theme-text-secondary)]">points earned!</p>
                    </div>
                </div>
                {bonuses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[var(--theme-border)] space-y-1">
                        {bonuses.map((bonus, i) => (
                            <div key={i} className="flex justify-between text-xs">
                                <span className="text-[var(--theme-text-secondary)]">{bonus.label}</span>
                                <span className="text-[var(--theme-status-warning-text)] font-bold font-mono">+{bonus.points}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkerPointsDisplay;

