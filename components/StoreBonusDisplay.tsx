import React, { useMemo } from 'react';
import {
    Store, Trophy, Users, TrendingUp, Star, Gift, Crown,
    DollarSign, Target, Award, ChevronRight, Sparkles, Zap
} from 'lucide-react';
import { StorePoints, BonusTier, POSRoleDistribution, WorkerPoints, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION, POINTS_CONFIG } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { formatCompactNumber } from '../utils/formatting';

interface StoreBonusDisplayProps {
    storePoints: StorePoints | undefined;
    currentUserRole?: string;
    bonusTiers?: BonusTier[];
    roleDistribution?: POSRoleDistribution[];
    compact?: boolean;
    workerPoints?: WorkerPoints;
    leaderboard?: WorkerPoints[];
}

// Calculate store bonus from points and tiers
export const calculateStoreBonus = (points: number, tiers: BonusTier[] = DEFAULT_POS_BONUS_TIERS): { tier: BonusTier; bonus: number } => {
    const tier = (tiers.length > 0
        ? tiers.find(t => points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints))
        : null) || tiers[0] || DEFAULT_POS_BONUS_TIERS[0];

    const bonus = tier.bonusAmount + (points * (tier.bonusPerPoint || 0));
    return { tier, bonus };
};

// Get tier color class
const getTierColor = (tierColor: string) => {
    const colors: Record<string, string> = {
        gray: 'from-gray-400 to-gray-500',
        amber: 'from-amber-500 to-amber-600',
        bronze: 'from-orange-700 to-orange-500',
        silver: 'from-gray-300 to-gray-400',
        gold: 'from-yellow-400 to-amber-500',
        platinum: 'from-cyan-400 to-blue-500',
        diamond: 'from-blue-400 to-purple-500',
        yellow: 'from-yellow-400 to-yellow-500',
        cyan: 'from-cyan-400 to-cyan-500',
        purple: 'from-purple-400 to-purple-600',
        blue: 'from-blue-400 to-blue-600',
        green: 'from-green-400 to-green-600',
    };
    return colors[tierColor] || 'from-gray-400 to-gray-500';
};

// Get level info
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

// Compact widget for header/sidebar
export function StoreBonusWidget({
    storePoints,
    currentUserRole,
    roleDistribution = DEFAULT_POS_ROLE_DISTRIBUTION,
    bonusTiers = DEFAULT_POS_BONUS_TIERS
}: StoreBonusDisplayProps) {
    if (!storePoints) return null;

    const bonusInfo = useMemo(() =>
        calculateStoreBonus(storePoints.monthlyPoints, bonusTiers),
        [storePoints.monthlyPoints, bonusTiers]
    );

    const userShare = useMemo(() => {
        if (!currentUserRole) return null;
        const roleConfig = roleDistribution.find(r =>
            r.role.toLowerCase() === currentUserRole.toLowerCase()
        );
        if (!roleConfig) return null;
        return {
            percentage: roleConfig.percentage,
            amount: (bonusInfo.bonus * roleConfig.percentage) / 100
        };
    }, [currentUserRole, roleDistribution, bonusInfo.bonus]);

    return (
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl px-3 py-1.5">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTierColor(bonusInfo.tier.tierColor)} flex items-center justify-center`}>
                <Store size={16} className="text-white" />
            </div>
            <div>
                <p className="text-xs font-bold text-white">
                    {storePoints.siteName}
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r ${getTierColor(bonusInfo.tier.tierColor)} text-white`}>
                        {bonusInfo.tier.tierName}
                    </span>
                </p>
                <p className="text-[10px] text-gray-400">
                    {storePoints.monthlyPoints.toLocaleString()} pts this month
                </p>
            </div>
            {userShare && (
                <div className="text-right pl-2 border-l border-green-500/30">
                    <p className="text-xs text-green-400 font-bold">
                        {formatCompactNumber(userShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-gray-500">your share ({userShare.percentage}%)</p>
                </div>
            )}
        </div>
    );
}

// Full display component for dashboards
export default function StoreBonusDisplay({
    storePoints,
    currentUserRole,
    bonusTiers = DEFAULT_POS_BONUS_TIERS,
    roleDistribution = DEFAULT_POS_ROLE_DISTRIBUTION,
    compact = false,
    workerPoints,
    leaderboard
}: StoreBonusDisplayProps) {
    if (!storePoints) {
        return (
            <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-2xl p-6 text-center">
                <Store className="mx-auto text-gray-500 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No store bonus data available yet</p>
                <p className="text-gray-500 text-xs mt-1">Complete transactions to start earning team points!</p>
            </div>
        );
    }

    const bonusInfo = useMemo(() =>
        calculateStoreBonus(storePoints.monthlyPoints, bonusTiers),
        [storePoints.monthlyPoints, bonusTiers]
    );

    // Find next tier
    const nextTier = useMemo(() => {
        const sortedTiers = [...bonusTiers].sort((a, b) => a.minPoints - b.minPoints);
        return sortedTiers.find(t => t.minPoints > storePoints.monthlyPoints);
    }, [storePoints.monthlyPoints, bonusTiers]);

    // Calculate progress to next tier
    const tierProgress = useMemo(() => {
        if (!nextTier) return 100;
        const range = nextTier.minPoints - bonusInfo.tier.minPoints;
        const progress = storePoints.monthlyPoints - bonusInfo.tier.minPoints;
        return Math.min(100, (progress / range) * 100);
    }, [storePoints.monthlyPoints, bonusInfo.tier, nextTier]);

    // Calculate user's personal share
    const userShare = useMemo(() => {
        if (!currentUserRole) return null;
        const roleConfig = roleDistribution.find(r =>
            r.role.toLowerCase() === currentUserRole.toLowerCase()
        );
        if (!roleConfig) return null;
        return {
            role: roleConfig.role,
            percentage: roleConfig.percentage,
            amount: (bonusInfo.bonus * roleConfig.percentage) / 100,
            color: roleConfig.color
        };
    }, [currentUserRole, roleDistribution, bonusInfo.bonus]);

    // Personal Level Info
    const levelInfo = useMemo(() =>
        workerPoints ? getLevelInfo(workerPoints.totalPoints) : null,
        [workerPoints]
    );

    if (compact) {
        return (
            <StoreBonusWidget
                storePoints={storePoints}
                currentUserRole={currentUserRole}
                bonusTiers={bonusTiers}
                roleDistribution={roleDistribution}
            />
        );
    }

    return (
        <div className="bg-gradient-to-br from-cyber-gray to-blue-900/10 border border-white/10 rounded-2xl p-6 h-full relative overflow-hidden group">
            {/* Animated Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTierColor(bonusInfo.tier.tierColor)} flex items-center justify-center shadow-lg relative`}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl" />
                        <Store size={28} className="text-white relative z-10" />
                        <div className="absolute -bottom-2 -right-2 bg-black/80 border border-white/10 rounded-lg px-1.5 py-0.5">
                            <span className="text-[10px] font-bold text-white">Lvl {levelInfo?.currentLevel.level || '-'}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            Team Performance
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r ${getTierColor(bonusInfo.tier.tierColor)} text-white shadow shadow-white/10`}>
                                {bonusInfo.tier.tierName}
                            </span>
                        </h3>
                        <p className="text-xs text-blue-300 flex items-center gap-1">
                            <Sparkles size={10} />
                            {storePoints.siteName}
                        </p>
                    </div>
                </div>
                {/* Points / Bonus Toggle View */}
                <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Store Pool</p>
                    <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        {formatCompactNumber(bonusInfo.bonus, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Total Store Sales/Points */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Store Points</p>
                        <Trophy size={14} className="text-yellow-500" />
                    </div>
                    <p className="text-2xl font-black text-white">{storePoints.monthlyPoints.toLocaleString()}</p>
                    <p className="text-[10px] text-green-400 flex items-center gap-1">
                        <TrendingUp size={10} />
                        +{storePoints.todayPoints.toLocaleString()} today
                    </p>
                </div>

                {/* Personal Contribution (Gamified) */}
                <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-4 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-blue-300 uppercase font-bold">Your Score</p>
                        <Zap size={14} className="text-blue-400" />
                    </div>
                    <p className="text-2xl font-black text-white">{workerPoints?.totalPoints.toLocaleString() || 0}</p>
                    <p className="text-[10px] text-blue-300">
                        {levelInfo?.currentLevel.title || 'Rookie'} • Lvl {levelInfo?.currentLevel.level || 1}
                    </p>
                </div>

                {/* Rank */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Store Rank</p>
                        <Crown size={14} className="text-purple-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black text-white">#{workerPoints?.rank || '-'}</p>
                        <span className="text-xs text-gray-500">of {leaderboard?.length || '-'}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">Top 10% of staff</p>
                </div>
            </div>

            {/* Progress to Next Store Tier */}
            <div className="relative space-y-2 mb-6">
                <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                    <span>Current: {bonusInfo.tier.tierName}</span>
                    {nextTier ? (
                        <span className="text-blue-400">{nextTier.minPoints - storePoints.monthlyPoints} pts to {nextTier.tierName}</span>
                    ) : (
                        <span className="text-purple-400">Max Tier Reached!</span>
                    )}
                </div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 relative">
                    <div
                        className={`h-full bg-gradient-to-r ${getTierColor(bonusInfo.tier.tierColor)} transition-all duration-1000 relative overflow-hidden`}
                        style={{ width: `${tierProgress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                    </div>
                </div>
                {nextTier && (
                    <p className="text-[10px] text-gray-500 text-center">
                        Next tier unlocks <span className="text-white font-bold">{formatCompactNumber(nextTier.bonusAmount, { currency: CURRENCY_SYMBOL })}</span> base bonus
                    </p>
                )}
            </div>

            {/* Personal Share Estimate */}
            {userShare && (
                <div className="relative bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <DollarSign className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-300 font-bold">Est. Personal Bonus</p>
                                <p className="text-[10px] text-green-400/80">{userShare.percentage}% Share ({userShare.role})</p>
                            </div>
                        </div>
                        <p className="text-2xl font-black text-green-400">
                            {formatCompactNumber(userShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Leaderboard for stores
export function StoreLeaderboard({
    stores,
    currentSiteId,
    bonusTiers = DEFAULT_POS_BONUS_TIERS
}: {
    stores: StorePoints[];
    currentSiteId?: string;
    bonusTiers?: BonusTier[];
}) {
    const sortedStores = useMemo(() =>
        [...stores].sort((a, b) => b.monthlyPoints - a.monthlyPoints),
        [stores]
    );

    if (sortedStores.length === 0) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <Trophy className="mx-auto text-gray-500 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No store rankings yet</p>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-400" size={20} />
                Store Rankings
            </h3>
            <div className="space-y-2">
                {sortedStores.slice(0, 5).map((store, index) => {
                    const bonus = calculateStoreBonus(store.monthlyPoints, bonusTiers);
                    const isCurrentStore = store.siteId === currentSiteId;

                    return (
                        <div
                            key={store.id}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrentStore
                                ? 'bg-blue-500/10 border border-blue-500/30'
                                : 'bg-black/30 hover:bg-black/40'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-black' :
                                index === 1 ? 'bg-gray-400 text-black' :
                                    index === 2 ? 'bg-amber-600 text-white' :
                                        'bg-white/10 text-gray-400'
                                }`}>
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm truncate flex items-center gap-1">
                                    {store.siteName}
                                    {isCurrentStore && <span className="text-[10px] text-blue-400">(You)</span>}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                    {store.monthlyPoints.toLocaleString()} pts • {bonus.tier.tierName}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-green-400">
                                    {formatCompactNumber(bonus.bonus, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
