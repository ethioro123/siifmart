import React, { useMemo } from 'react';
import {
    Store, Trophy, Users, TrendingUp, Star, Gift, Crown,
    DollarSign, Target, Award, ChevronRight, Sparkles
} from 'lucide-react';
import { StorePoints, BonusTier, POSRoleDistribution, DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { formatCompactNumber } from '../utils/formatting';

interface StoreBonusDisplayProps {
    storePoints: StorePoints | undefined;
    currentUserRole?: string;
    bonusTiers?: BonusTier[];
    roleDistribution?: POSRoleDistribution[];
    compact?: boolean;
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
        yellow: 'from-yellow-400 to-yellow-500',
        cyan: 'from-cyan-400 to-cyan-500',
        purple: 'from-purple-400 to-purple-600',
        blue: 'from-blue-400 to-blue-600',
        green: 'from-green-400 to-green-600',
    };
    return colors[tierColor] || 'from-gray-400 to-gray-500';
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
    compact = false
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
        <div className="bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 border border-blue-500/20 rounded-2xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTierColor(bonusInfo.tier.tierColor)} flex items-center justify-center shadow-lg`}>
                        <Store size={28} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            {storePoints.siteName}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r ${getTierColor(bonusInfo.tier.tierColor)} text-white`}>
                                {bonusInfo.tier.tierName}
                            </span>
                        </h3>
                        <p className="text-xs text-gray-400">Team Bonus Progress</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Store Bonus Pool</p>
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        {formatCompactNumber(bonusInfo.bonus, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3">
                <div className="bg-black/30 rounded-xl p-3 text-center">
                    <Target className="mx-auto text-blue-400 mb-1" size={18} />
                    <p className="text-lg font-bold text-white">{storePoints.monthlyPoints.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">Monthly Points</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center">
                    <TrendingUp className="mx-auto text-green-400 mb-1" size={18} />
                    <p className="text-lg font-bold text-white">{storePoints.todayPoints.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">Today</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center">
                    <DollarSign className="mx-auto text-yellow-400 mb-1" size={18} />
                    <p className="text-lg font-bold text-white">{formatCompactNumber(storePoints.averageTicketSize, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-gray-500">Avg Ticket</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center">
                    <Star className="mx-auto text-purple-400 mb-1" size={18} />
                    <p className="text-lg font-bold text-white">{storePoints.totalTransactions.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">Transactions</p>
                </div>
            </div>

            {/* Progress to Next Tier */}
            {nextTier && (
                <div className="bg-black/20 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Progress to {nextTier.tierName}</span>
                        <span className="text-xs text-blue-400 font-bold">
                            {(nextTier.minPoints - storePoints.monthlyPoints).toLocaleString()} pts to go
                        </span>
                    </div>
                    <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getTierColor(nextTier.tierColor)} transition-all duration-500`}
                            style={{ width: `${tierProgress}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                        Next tier unlocks: {formatCompactNumber(nextTier.bonusAmount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })} pool + {formatCompactNumber(nextTier.bonusPerPoint || 0, { currency: CURRENCY_SYMBOL, maxFractionDigits: 2 })}/point
                    </p>
                </div>
            )}

            {/* Your Personal Share */}
            {userShare && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTierColor(userShare.color)} flex items-center justify-center`}>
                                <Gift size={24} className="text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    Your Estimated Share
                                    <span className="text-[10px] font-normal text-gray-400">({userShare.role})</span>
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {userShare.percentage}% of store bonus pool
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-green-400">
                                {formatCompactNumber(userShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                            </p>
                            <p className="text-[10px] text-gray-500">this period</p>
                        </div>
                    </div>
                </div>
            )}

            {!userShare && currentUserRole && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                    <p className="text-yellow-400 text-sm">
                        Your role "{currentUserRole}" is not configured for bonus distribution.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Contact your manager to set up your bonus share.
                    </p>
                </div>
            )}

            {/* Team Distribution Preview */}
            <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs text-gray-400 font-bold uppercase mb-3 flex items-center gap-2">
                    <Users size={14} />
                    Team Distribution Preview
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {roleDistribution.sort((a, b) => b.percentage - a.percentage).slice(0, 4).map(role => {
                        const share = (bonusInfo.bonus * role.percentage) / 100;
                        const isCurrentUser = currentUserRole?.toLowerCase() === role.role.toLowerCase();
                        return (
                            <div
                                key={role.id}
                                className={`bg-black/30 rounded-lg p-2 text-center transition-all ${isCurrentUser ? 'ring-2 ring-green-400/50' : ''}`}
                            >
                                <p className="text-[10px] text-gray-400 truncate flex items-center justify-center gap-1">
                                    {role.role}
                                    {isCurrentUser && <Sparkles size={10} className="text-green-400" />}
                                </p>
                                <p className="text-sm font-bold text-white">
                                    {formatCompactNumber(share, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                                </p>
                                <p className="text-[10px] text-gray-500">{role.percentage}%</p>
                            </div>
                        );
                    })}
                </div>
            </div>
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

