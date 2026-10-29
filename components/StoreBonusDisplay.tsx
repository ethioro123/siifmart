import React, { useMemo } from 'react';
import {
    Store, Trophy, TrendingUp, Crown,
    DollarSign, Sparkles, Zap
} from 'lucide-react';
import type { StorePoints, BonusTier, POSRoleDistribution, WorkerPoints } from '../types';
import { DEFAULT_POS_BONUS_TIERS, DEFAULT_POS_ROLE_DISTRIBUTION, POINTS_CONFIG } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { formatCompactNumber } from '../utils/formatting';
import { useLanguage } from '../contexts/LanguageContext';

export interface StoreBonusDisplayProps {
    storePoints?: StorePoints;
    siteName?: string;
    siteId?: string;
    currentUserRole?: string;
    bonusTiers?: BonusTier[];
    roleDistribution?: POSRoleDistribution[];
    compact?: boolean;
    workerPoints?: WorkerPoints;
    leaderboard?: WorkerPoints[];
}

// Calculate store bonus from points and tiers
export const calculateStoreBonus = (points: number = 0, tiers: BonusTier[] = DEFAULT_POS_BONUS_TIERS): { tier: BonusTier; bonus: number } => {
    const tier = (tiers.length > 0
        ? tiers.find(t => points >= t.minPoints && (t.maxPoints === null || points <= t.maxPoints))
        : null) || tiers[0] || DEFAULT_POS_BONUS_TIERS[0];

    const bonus = tier.bonusAmount + (points * (tier.bonusPerPoint || 0));
    return { tier, bonus };
};

// Get tier gradient class
const getTierColor = (tierColor: string) => {
    const colors: Record<string, string> = {
        gray: 'from-[var(--theme-accent)] to-[var(--theme-accent)]',
        amber: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]',
        bronze: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]',
        silver: 'from-[var(--theme-accent)] to-[var(--theme-accent)]',
        gold: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]',
        platinum: 'from-[var(--theme-status-info)] to-[var(--theme-status-info)]',
        diamond: 'from-[var(--theme-status-info)] to-[var(--theme-accent)]',
        yellow: 'from-[var(--theme-status-warning)] to-[var(--theme-status-warning)]',
        cyan: 'from-[var(--theme-status-info)] to-[var(--theme-status-info)]',
        purple: 'from-[var(--theme-accent)] to-[var(--theme-accent)]',
        blue: 'from-[var(--theme-status-info)] to-[var(--theme-status-info)]',
        green: 'from-[var(--theme-status-success)] to-[var(--theme-status-success)]',
    };
    return colors[tierColor] || 'from-[var(--theme-accent)] to-[var(--theme-accent)]';
};

// Get level info
const getLevelInfo = (totalPoints: number = 0) => {
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
    siteName,
    siteId,
    currentUserRole,
    roleDistribution = DEFAULT_POS_ROLE_DISTRIBUTION,
    bonusTiers = DEFAULT_POS_BONUS_TIERS
}: StoreBonusDisplayProps) {
    const { t } = useLanguage();

    const effectiveStore = useMemo<StorePoints | undefined>(() => {
        if (storePoints) return storePoints;
        if (siteName || siteId) {
            return {
                id: `init-${siteId || 'branch'}`,
                siteId: siteId || '',
                siteName: siteName || 'Active Branch',
                totalPoints: 0,
                todayPoints: 0,
                weeklyPoints: 0,
                monthlyPoints: 0,
                totalTransactions: 0,
                totalRevenue: 0,
                averageTicketSize: 0,
                customerSatisfaction: 100,
                currentTier: bonusTiers[0]?.tierName || 'Starting',
                estimatedBonus: 0,
                lastTransactionAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
        }
        return undefined;
    }, [storePoints, siteName, siteId, bonusTiers]);

    const bonusInfo = useMemo(() =>
        calculateStoreBonus(effectiveStore?.monthlyPoints || 0, bonusTiers),
        [effectiveStore?.monthlyPoints, bonusTiers]
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

    if (!effectiveStore) return null;

    return (
        <div className="flex items-center gap-2.5 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl px-3.5 py-1.5 shadow-2xs">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getTierColor(bonusInfo.tier.tierColor)} flex items-center justify-center shrink-0 shadow-2xs`}>
                <Store size={15} className="text-[var(--theme-text-primary)]" />
            </div>
            <div>
                <p className="text-xs font-semibold text-[var(--theme-text-primary)] flex items-center gap-1.5">
                    <span>{effectiveStore.siteName}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold bg-gradient-to-r ${getTierColor(bonusInfo.tier.tierColor)} text-[var(--theme-text-primary)]`}>
                        {bonusInfo.tier.tierName}
                    </span>
                </p>
                <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium">
                    {effectiveStore.monthlyPoints.toLocaleString()} {t('posCommand.ptsThisMonth')}
                </p>
            </div>
            {userShare && (
                <div className="text-right pl-2.5 border-l border-[var(--theme-border)] ml-auto">
                    <p className="text-xs text-[var(--theme-accent)] dark:text-[var(--theme-accent)] font-black font-mono">
                        {formatCompactNumber(userShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] text-[var(--theme-text-secondary)]">{t('posCommand.yourShare')} ({userShare.percentage}%)</p>
                </div>
            )}
        </div>
    );
}

// Full display component for dashboards
export default function StoreBonusDisplay({
    storePoints,
    siteName,
    siteId,
    currentUserRole,
    bonusTiers = DEFAULT_POS_BONUS_TIERS,
    roleDistribution = DEFAULT_POS_ROLE_DISTRIBUTION,
    compact = false,
    workerPoints,
    leaderboard
}: StoreBonusDisplayProps) {
    const { t } = useLanguage();

    const effectiveStore = useMemo<StorePoints | undefined>(() => {
        if (storePoints) return storePoints;
        if (siteName || siteId) {
            return {
                id: `init-${siteId || 'branch'}`,
                siteId: siteId || '',
                siteName: siteName || 'Active Branch',
                totalPoints: 0,
                todayPoints: 0,
                weeklyPoints: 0,
                monthlyPoints: 0,
                totalTransactions: 0,
                totalRevenue: 0,
                averageTicketSize: 0,
                customerSatisfaction: 100,
                currentTier: bonusTiers[0]?.tierName || 'Starting',
                estimatedBonus: 0,
                lastTransactionAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
        }
        return undefined;
    }, [storePoints, siteName, siteId, bonusTiers]);

    const monthlyPoints = effectiveStore?.monthlyPoints || 0;

    const bonusInfo = useMemo(() =>
        calculateStoreBonus(monthlyPoints, bonusTiers),
        [monthlyPoints, bonusTiers]
    );

    const nextTier = useMemo(() => {
        const sortedTiers = [...bonusTiers].sort((a, b) => a.minPoints - b.minPoints);
        return sortedTiers.find(t => t.minPoints > monthlyPoints);
    }, [monthlyPoints, bonusTiers]);

    const tierProgress = useMemo(() => {
        if (!nextTier) return 100;
        const range = nextTier.minPoints - bonusInfo.tier.minPoints;
        const progress = monthlyPoints - bonusInfo.tier.minPoints;
        return Math.min(100, Math.max(0, (progress / (range || 1)) * 100));
    }, [monthlyPoints, bonusInfo.tier, nextTier]);

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

    const levelInfo = useMemo(() =>
        workerPoints ? getLevelInfo(workerPoints.totalPoints) : null,
        [workerPoints]
    );

    if (compact) {
        return (
            <StoreBonusWidget
                storePoints={effectiveStore}
                siteName={siteName}
                siteId={siteId}
                currentUserRole={currentUserRole}
                bonusTiers={bonusTiers}
                roleDistribution={roleDistribution}
            />
        );
    }

    if (!effectiveStore) {
        return (
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-8 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center mx-auto mb-3 text-[var(--theme-text-secondary)]">
                    <Store size={22} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                </div>
                <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">Branch Performance &amp; Team Bonus</h4>
                <p className="text-xs text-[var(--theme-text-secondary)] mt-1 max-w-sm mx-auto leading-relaxed">
                    Select an active branch to track live team points, tier progression, and personal share allocations.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 shadow-xs relative overflow-hidden space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--theme-accent)]/10 dark:bg-[var(--theme-accent)]/15 text-[var(--theme-accent)] dark:text-[var(--theme-accent)] border border-[var(--theme-border-focus)]/20 flex items-center justify-center shrink-0">
                        <Store size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                                Store Team Bonus &amp; Performance
                            </h3>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]">
                                {bonusInfo.tier.tierName} Tier
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--theme-text-secondary)]">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--theme-status-success-bg)] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--theme-status-success-bg)]"></span>
                            </span>
                            <span className="font-medium text-[var(--theme-text-primary)]">{effectiveStore.siteName}</span>
                            <span>•</span>
                            <span>Monthly Performance Cycle</span>
                        </div>
                    </div>
                </div>

                <div className="text-left sm:text-right bg-[var(--theme-bg-subtle)] sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-[var(--theme-border)]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">Store Bonus Pool</p>
                    <p className="text-2xl font-black font-mono text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                        {formatCompactNumber(bonusInfo.bonus, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Store Points */}
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">Team Points</span>
                        <Trophy size={14} className="text-[var(--theme-status-warning-text)]" />
                    </div>
                    <p className="text-2xl font-black font-mono text-[var(--theme-text-primary)]">
                        {effectiveStore.monthlyPoints.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] flex items-center gap-1 font-medium mt-1">
                        <TrendingUp size={11} className="text-[var(--theme-status-success-text)]" />
                        <span>+{effectiveStore.todayPoints.toLocaleString()} today</span>
                    </p>
                </div>

                {/* Personal Score */}
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">Your Score</span>
                        <Zap size={14} className="text-[var(--theme-accent)] dark:text-[var(--theme-accent)]" />
                    </div>
                    <p className="text-2xl font-black font-mono text-[var(--theme-text-primary)]">
                        {(workerPoints?.totalPoints || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-1 truncate">
                        Lv.{levelInfo?.currentLevel.level || 1} {levelInfo?.currentLevel.title || 'Rookie'}
                    </p>
                </div>

                {/* Rank */}
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">Branch Rank</span>
                        <Crown size={14} className="text-[var(--theme-status-warning-text)]" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <p className="text-2xl font-black font-mono text-[var(--theme-text-primary)]">
                            #{workerPoints?.rank && workerPoints.rank > 0 ? workerPoints.rank : '-'}
                        </p>
                        <span className="text-xs text-[var(--theme-text-secondary)] font-medium">
                            of {leaderboard?.length || 0} active
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--theme-text-secondary)] font-medium mt-1">
                        Live leaderboard position
                    </p>
                </div>
            </div>

            {/* Progress to Next Tier */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-[var(--theme-text-secondary)]">
                        Current: <strong className="text-[var(--theme-text-primary)] font-semibold">{bonusInfo.tier.tierName}</strong>
                    </span>
                    {nextTier ? (
                        <span className="text-xs font-semibold text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                            {(nextTier.minPoints - effectiveStore.monthlyPoints).toLocaleString()} pts to {nextTier.tierName}
                        </span>
                    ) : (
                        <span className="text-xs font-semibold text-[var(--theme-status-warning-text)]">Maximum Tier Achieved</span>
                    )}
                </div>

                <div className="h-2 bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-gradient-to-r from-[#0071E3] to-[#2997FF] rounded-full transition-all duration-700"
                        style={{ width: `${tierProgress}%` }}
                    />
                </div>

                {nextTier && (
                    <p className="text-[11px] text-[var(--theme-text-secondary)] text-center font-medium">
                        Reaching <strong className="text-[var(--theme-text-primary)]">{nextTier.tierName}</strong> unlocks{' '}
                        <strong className="text-[var(--theme-text-primary)] font-mono font-semibold">
                            {formatCompactNumber(nextTier.bonusAmount, { currency: CURRENCY_SYMBOL })}
                        </strong>{' '}
                        base team bonus pool.
                    </p>
                )}
            </div>

            {/* Personal Share Estimate & Info Note */}
            {userShare ? (
                <div className="bg-[var(--theme-accent)]/5 dark:bg-[var(--theme-accent)]/10 border border-[var(--theme-border-focus)]/20 dark:border-[var(--theme-border-focus)]/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--theme-accent)] dark:bg-[var(--theme-accent)] text-[var(--theme-text-primary)] flex items-center justify-center shrink-0 shadow-2xs">
                            <DollarSign size={17} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[var(--theme-text-primary)]">
                                Estimated Role Allocation ({userShare.percentage}% Share)
                            </p>
                            <p className="text-[11px] text-[var(--theme-text-secondary)] mt-0.5">
                                Proportional distribution for <span className="capitalize font-medium text-[var(--theme-text-primary)]">{userShare.role}</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right pl-12 sm:pl-0">
                        <p className="text-xl font-black font-mono text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
                            {formatCompactNumber(userShare.amount, { currency: CURRENCY_SYMBOL, maxFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] text-[var(--theme-text-secondary)] font-medium">Est. Personal Payout</p>
                    </div>
                </div>
            ) : (
                <div className="bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-xl p-3.5 flex items-center gap-3 text-xs text-[var(--theme-text-secondary)]">
                    <Sparkles size={16} className="text-[var(--theme-status-warning-text)] shrink-0" />
                    <span>
                        Team points accrue automatically on completed checkout sales, revenue milestones, and priority catalog items.
                    </span>
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
    const { t } = useLanguage();
    const sortedStores = useMemo(() =>
        [...stores].sort((a, b) => b.monthlyPoints - a.monthlyPoints),
        [stores]
    );

    if (sortedStores.length === 0) {
        return (
            <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 text-center shadow-xs">
                <Trophy className="mx-auto text-[var(--theme-text-secondary)] mb-2" size={28} />
                <p className="text-xs font-semibold text-[var(--theme-text-primary)]">{t('posCommand.noStoreRankings')}</p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-5 shadow-xs">
            <h3 className="font-semibold text-xs text-[var(--theme-text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Trophy className="text-[var(--theme-status-warning-text)]" size={15} />
                <span>{t('posCommand.storeRankings')}</span>
            </h3>
            <div className="space-y-2">
                {sortedStores.slice(0, 5).map((store, index) => {
                    const bonus = calculateStoreBonus(store.monthlyPoints, bonusTiers);
                    const isCurrentStore = store.siteId === currentSiteId;

                    return (
                        <div
                            key={store.id}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                                isCurrentStore
                                    ? 'bg-[var(--theme-accent)]/5 dark:bg-[var(--theme-accent)]/10 border-[var(--theme-border-focus)]/30 dark:border-[var(--theme-border-focus)]/30'
                                    : 'bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:border-[var(--theme-border-focus)]/20'
                            }`}
                        >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                                index === 0 ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)] shadow-2xs' :
                                index === 1 ? 'bg-[var(--theme-bg-card-hover)] bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-[var(--theme-text-muted)]' :
                                index === 2 ? 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-text-primary)]' :
                                'bg-[var(--theme-bg-card)] border border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                            }`}>
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[var(--theme-text-primary)] text-xs truncate flex items-center gap-1.5">
                                    <span>{store.siteName}</span>
                                    {isCurrentStore && (
                                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-[var(--theme-accent)]/15 dark:text-[var(--theme-accent)]">
                                            {t('posCommand.you')}
                                        </span>
                                    )}
                                </p>
                                <p className="text-[10px] text-[var(--theme-text-secondary)]">
                                    {store.monthlyPoints.toLocaleString()} pts • {bonus.tier.tierName}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black font-mono text-[var(--theme-accent)] dark:text-[var(--theme-accent)]">
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
