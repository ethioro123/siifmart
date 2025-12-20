import React, { useMemo } from 'react';
import {
    Trophy, Star, Zap, Target, Flame, Award, TrendingUp,
    Clock, Package, CheckCircle, Sparkles, Crown, Medal, DollarSign, Gift, TrendingDown, User
} from 'lucide-react';
import { WorkerPoints, POINTS_CONFIG, WorkerAchievement, BonusTier, DEFAULT_BONUS_TIERS } from '../types';

interface WorkerPointsDisplayProps {
    points: WorkerPoints;
    compact?: boolean;
    showLeaderboard?: boolean;
    bonusTiers?: BonusTier[];
    currency?: string;
    showBonus?: boolean;
}

// Calculate bonus from points and tiers
export const calculateBonus = (points: number, tiers: BonusTier[] = DEFAULT_BONUS_TIERS): { tier: BonusTier; bonus: number } => {
    // Find the applicable tier
    const tier = (tiers.length > 0
        ? tiers.find(t => points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints))
        : null) || tiers[0] || DEFAULT_BONUS_TIERS[0];

    // Calculate bonus: base amount + (points * per-point bonus)
    const bonus = tier.bonusAmount + (points * (tier.bonusPerPoint || 0));

    return { tier, bonus };
};

// Get bonus tier color classes
const getBonusTierColor = (tierColor: string) => {
    const colors: Record<string, string> = {
        gray: 'from-gray-400 to-gray-500',
        amber: 'from-amber-500 to-amber-600',
        yellow: 'from-yellow-400 to-yellow-500',
        cyan: 'from-cyan-400 to-cyan-500',
        purple: 'from-purple-400 to-purple-600',
    };
    return colors[tierColor] || 'from-gray-400 to-gray-500';
};

// Get level info from points
const getLevelInfo = (totalPoints: number) => {
    const levels = POINTS_CONFIG.LEVELS;
    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = levels.length - 1; i >= 0; i--) {
        if (totalPoints >= levels[i].points) {
            currentLevel = levels[i];
            nextLevel = levels[i + 1] || levels[i];
            break;
        }
    }

    const pointsToNext = nextLevel.points - totalPoints;
    const progressPercent = currentLevel.level === nextLevel.level
        ? 100
        : ((totalPoints - currentLevel.points) / (nextLevel.points - currentLevel.points)) * 100;

    return { currentLevel, nextLevel, pointsToNext, progressPercent };
};

// Get rank medal color
const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'from-yellow-400 to-amber-500', text: 'text-yellow-900', icon: '🥇' };
    if (rank === 2) return { bg: 'from-gray-300 to-gray-400', text: 'text-gray-800', icon: '🥈' };
    if (rank === 3) return { bg: 'from-amber-600 to-amber-700', text: 'text-amber-100', icon: '🥉' };
    return { bg: 'from-white/10 to-white/5', text: 'text-white', icon: `#${rank}` };
};

// Level badge colors
const getLevelColor = (level: number) => {
    const colors = [
        'from-gray-500 to-gray-600', // 1 - Rookie
        'from-green-500 to-green-600', // 2 - Apprentice
        'from-blue-500 to-blue-600', // 3 - Worker
        'from-purple-500 to-purple-600', // 4 - Skilled
        'from-pink-500 to-pink-600', // 5 - Expert
        'from-orange-500 to-orange-600', // 6 - Pro
        'from-red-500 to-red-600', // 7 - Master
        'from-cyan-400 to-cyan-500', // 8 - Elite
        'from-amber-400 to-amber-500', // 9 - Champion
        'from-yellow-300 via-yellow-400 to-amber-500', // 10 - Legend
    ];
    return colors[Math.min(level - 1, colors.length - 1)];
};

// Achievement icons
const getAchievementIcon = (type: string) => {
    const icons: Record<string, string> = {
        first_job: '🎉',
        speed_demon: '⚡',
        perfect_accuracy: '🎯',
        streak_3: '🔥',
        streak_7: '🔥🔥',
        streak_30: '🔥🔥🔥',
        centurion: '💯',
        veteran: '⭐',
        legend: '👑',
        early_bird: '🌅',
        night_owl: '🦉',
        team_player: '🤝',
    };
    return icons[type] || '🏆';
};

export default function WorkerPointsDisplay({
    points,
    compact = false,
    showLeaderboard = false,
    bonusTiers = DEFAULT_BONUS_TIERS,
    currency = 'ETB ',
    showBonus = true
}: WorkerPointsDisplayProps) {
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
            <div className="group relative flex items-center gap-3 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/5 hover:border-cyber-primary/30 rounded-full py-1.5 pr-5 pl-1.5 transition-all duration-300 cursor-default">
                {/* Level Badge with Ring */}
                <div className={`relative w-9 h-9 flex items-center justify-center`}>
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${levelColor} opacity-20 animate-pulse`} />
                    <div className={`relative w-full h-full rounded-full bg-gradient-to-br ${levelColor} flex items-center justify-center shadow-lg border border-white/10`}>
                        <span className="text-xs font-black text-white">{levelInfo.currentLevel.level}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-white leading-none tracking-tight">{points.totalPoints.toLocaleString()}</span>
                        <span className="text-[10px] text-cyber-primary font-bold uppercase tracking-wider">PTS</span>
                    </div>
                    {/* Micro Progress Bar */}
                    <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${levelColor} transition-all duration-500`}
                            style={{ width: `${levelInfo.progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Rank Indicator (Subtle) */}
                {points.rank <= 3 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg animate-bounce">
                        <Crown size={10} className="text-black" />
                    </div>
                )}

                {/* Hover Tooltip for Details */}
                <div className="absolute top-full right-0 mt-3 w-56 bg-gray-900/95 border border-white/10 rounded-2xl p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl translate-y-2 group-hover:translate-y-0 scale-95 group-hover:scale-100 origin-top-right">
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${levelColor} text-white`}>
                            {levelInfo.currentLevel.title}
                        </span>
                        <span className="text-xs text-gray-400">Rank #{points.rank}</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Level Progress</p>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden mb-2">
                        <div className={`h-full bg-gradient-to-r ${levelColor}`} style={{ width: `${levelInfo.progressPercent}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 text-right">
                        {levelInfo.pointsToNext > 0
                            ? <><span className="text-white font-bold">{levelInfo.pointsToNext}</span> more for Next Level</>
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
            <div className="relative overflow-hidden bg-gradient-to-br from-cyber-gray via-cyber-gray to-purple-900/20 rounded-2xl border border-white/10">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                </div>

                <div className="relative p-6">
                    {/* Header with avatar and level */}
                    <div className="flex items-start gap-4 mb-6">
                        {/* Avatar with level ring */}
                        <div className="relative">
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${levelColor} p-1 animate-spin-slow [animation-duration:8s]`}>
                                <div className="w-full h-full rounded-full bg-cyber-gray" />
                            </div>
                            <div className="relative w-20 h-20 rounded-full bg-cyber-gray border-2 border-cyber-gray flex items-center justify-center">
                                <User size={40} className="text-gray-400" />
                            </div>
                            {/* Level badge */}
                            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${levelColor} flex items-center justify-center shadow-lg border-2 border-cyber-gray`}>
                                <span className="text-sm font-black text-white">{levelInfo.currentLevel.level}</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">{points.employeeName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${levelColor} text-white shadow-lg`}>
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
                            <p className="text-xs text-gray-400 uppercase font-bold">Today</p>
                            <p className="text-2xl font-black text-cyber-primary">+{points.todayPoints}</p>
                        </div>
                    </div>

                    {/* Total Points Display */}
                    <div className="bg-black/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm font-bold uppercase flex items-center gap-2">
                                <Sparkles size={16} className="text-cyber-primary" /> Total Points
                            </span>
                            <span className="text-4xl font-black bg-gradient-to-r from-cyber-primary to-purple-400 text-transparent bg-clip-text">
                                {points.totalPoints.toLocaleString()}
                            </span>
                        </div>
                        {/* Progress to next level */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Level {levelInfo.currentLevel.level}</span>
                                <span>Level {levelInfo.nextLevel.level}</span>
                            </div>
                            <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${levelColor} transition-all duration-1000 ease-out relative`}
                                    style={{ width: `${levelInfo.progressPercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                                </div>
                            </div>
                            <p className="text-center text-xs text-gray-400">
                                {levelInfo.pointsToNext > 0
                                    ? <><strong className="text-white">{levelInfo.pointsToNext}</strong> points to reach <strong className="text-white">{levelInfo.nextLevel.title}</strong></>
                                    : <span className="text-cyber-primary font-bold">🎉 Maximum Level Achieved!</span>
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
                            color="text-blue-400"
                        />
                        <StatCard
                            icon={<Target size={18} />}
                            label="Accuracy"
                            value={`${points.averageAccuracy}%`}
                            color="text-green-400"
                        />
                        <StatCard
                            icon={<Flame size={18} />}
                            label="Streak"
                            value={`${points.currentStreak} days`}
                            color="text-orange-400"
                        />
                        <StatCard
                            icon={<Clock size={18} />}
                            label="Avg Time"
                            value={`${points.averageTimePerJob}m`}
                            color="text-purple-400"
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
                        <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-xl border border-green-500/20">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getBonusTierColor(bonusInfo.tier.tierColor)} flex items-center justify-center`}>
                                        <Gift size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                            Estimated Bonus
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r ${getBonusTierColor(bonusInfo.tier.tierColor)} text-white`}>
                                                {bonusInfo.tier.tierName}
                                            </span>
                                        </h4>
                                        <p className="text-[10px] text-gray-400">Based on your {points.monthlyPoints} monthly points</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-green-400">
                                        {currency}{bonusInfo.bonus.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[10px] text-gray-500">this period</p>
                                </div>
                            </div>

                            {/* Bonus breakdown */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-black/20 rounded-lg p-2">
                                    <span className="text-gray-400">Base:</span>
                                    <span className="float-right text-white font-bold">{currency}{bonusInfo.tier.bonusAmount.toLocaleString()}</span>
                                </div>
                                <div className="bg-black/20 rounded-lg p-2">
                                    <span className="text-gray-400">Per Point:</span>
                                    <span className="float-right text-white font-bold">{currency}{(bonusInfo.tier.bonusPerPoint || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Next tier progress */}
                            {nextBonusTier && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                        <span>Next: {nextBonusTier.tierName} ({nextBonusTier.minPoints} pts)</span>
                                        <span>{pointsToNextTier} pts to go</span>
                                    </div>
                                    <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all"
                                            style={{ width: `${bonusTierProgress}%` }}
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
                <div className="bg-cyber-gray rounded-2xl border border-white/10 p-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={20} />
                        Achievements ({points.achievements.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {points.achievements.slice(0, 8).map((achievement) => (
                            <AchievementBadge key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                    {points.achievements.length > 8 && (
                        <p className="text-center text-gray-400 text-sm mt-3">
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
        <div className="bg-black/20 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
            <div className={`${color} mb-1`}>{icon}</div>
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-[10px] text-gray-500 uppercase">{label}</p>
        </div>
    );
}

function TimeCard({ label, points, icon }: { label: string; points: number; icon: string }) {
    return (
        <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-xl p-3 border border-white/5 text-center">
            <span className="text-xl">{icon}</span>
            <p className="text-xl font-bold text-white mt-1">+{points.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 uppercase">{label}</p>
        </div>
    );
}

function AchievementBadge({ achievement }: { achievement: WorkerAchievement }) {
    return (
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-xl p-3 border border-yellow-500/20 hover:border-yellow-500/40 transition-all group cursor-pointer">
            <div className="text-2xl mb-1">{getAchievementIcon(achievement.type)}</div>
            <p className="text-sm font-bold text-white truncate">{achievement.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{achievement.description}</p>
            <p className="text-[10px] text-yellow-400 mt-1 font-bold">+{achievement.pointsAwarded} pts</p>
        </div>
    );
}

// Compact leaderboard widget
export function LeaderboardWidget({ workers, currentUserId }: { workers: WorkerPoints[]; currentUserId?: string }) {
    const sortedWorkers = useMemo(() =>
        [...workers].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 5),
        [workers]
    );

    return (
        <div className="bg-cyber-gray rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h4 className="font-bold text-white flex items-center gap-2">
                    <Crown className="text-yellow-400" size={18} />
                    Top Performers
                </h4>
                <span className="text-xs text-gray-400">This Week</span>
            </div>
            <div className="divide-y divide-white/5">
                {sortedWorkers.map((worker, index) => {
                    const rank = index + 1;
                    const isCurrentUser = worker.employeeId === currentUserId;
                    const rankStyle = getRankStyle(rank);

                    return (
                        <div
                            key={worker.id}
                            className={`flex items-center gap-3 p-3 transition-colors ${isCurrentUser ? 'bg-cyber-primary/10' : 'hover:bg-white/5'}`}
                        >
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${rankStyle.bg} flex items-center justify-center font-bold text-sm ${rankStyle.text}`}>
                                {rank <= 3 ? rankStyle.icon : rank}
                            </div>
                            {/* Avatar */}
                            {/* Avatar Replaced with Icon */}
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                <User size={16} className="text-gray-400" />
                            </div>
                            {/* Name & Level */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-cyber-primary' : 'text-white'}`}>
                                    {worker.employeeName} {isCurrentUser && '(You)'}
                                </p>
                                <p className="text-[10px] text-gray-400">Lv.{worker.level} {worker.levelTitle}</p>
                            </div>
                            {/* Points */}
                            <div className="text-right">
                                <p className="text-sm font-bold text-cyber-primary">{worker.weeklyPoints.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-500">pts</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

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
            <div className="bg-gradient-to-r from-cyber-primary/90 to-purple-500/90 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-white/20 min-w-[280px]">
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-white/80 font-medium">{message}</p>
                        <p className="text-3xl font-black text-white">+{points}</p>
                        <p className="text-xs text-white/70">points earned!</p>
                    </div>
                </div>
                {bonuses.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
                        {bonuses.map((bonus, i) => (
                            <div key={i} className="flex justify-between text-xs">
                                <span className="text-white/70">{bonus.label}</span>
                                <span className="text-white font-bold">+{bonus.points}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

