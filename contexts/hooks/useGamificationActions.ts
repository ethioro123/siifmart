import { useCallback } from 'react';
import type { StorePoints, Site } from '../../types';
import { POINTS_CONFIG, DEFAULT_POS_ROLE_DISTRIBUTION, DEFAULT_POS_BONUS_TIERS } from '../../types';
import { calculateStoreBonus } from '../../components/StoreBonusDisplay';
import { storePointsService, pointsTransactionsService } from '../../services/supabase.service';
import { logger } from '../../utils/logger';

interface UseGamificationActionsDeps {
    sites: Site[];
    storePoints: StorePoints[];
    setStorePoints: React.Dispatch<React.SetStateAction<StorePoints[]>>;
    settings: any;
}

export function useGamificationActions(deps: UseGamificationActionsDeps) {
    const { sites, storePoints, setStorePoints, settings } = deps;

    const getStorePoints = useCallback((siteId: string) => {
        return storePoints.find(sp => sp.siteId === siteId);
    }, [storePoints]);

    const awardStorePoints = useCallback((siteId: string, points: number, revenue: number, transactionCount: number = 1) => {
        const bonusTiers = settings?.posBonusTiers && settings.posBonusTiers.length > 0
            ? settings.posBonusTiers
            : DEFAULT_POS_BONUS_TIERS;

        let recordToPersist: StorePoints | null = null;
        const nowIso = new Date().toISOString();

        setStorePoints(prev => {
            const existing = prev.find(sp => sp.siteId === siteId);
            if (existing) {
                const newTotalPoints = (existing.totalPoints || 0) + points;
                const newMonthlyPoints = (existing.monthlyPoints || 0) + points;
                const newRevenue = (existing.totalRevenue || 0) + revenue;
                const newTransactions = (existing.totalTransactions || 0) + transactionCount;
                const newAvgTicket = newTransactions > 0 ? Number((newRevenue / newTransactions).toFixed(2)) : 0;
                const { tier, bonus } = calculateStoreBonus(newMonthlyPoints, bonusTiers);

                const updated: StorePoints = {
                    ...existing,
                    totalPoints: newTotalPoints,
                    todayPoints: (existing.todayPoints || 0) + points,
                    weeklyPoints: (existing.weeklyPoints || 0) + points,
                    monthlyPoints: newMonthlyPoints,
                    totalRevenue: newRevenue,
                    totalTransactions: newTransactions,
                    averageTicketSize: newAvgTicket,
                    currentTier: tier.tierName,
                    estimatedBonus: bonus,
                    lastTransactionAt: nowIso,
                    lastUpdated: nowIso
                };
                recordToPersist = updated;
                return prev.map(sp => sp.siteId === siteId ? updated : sp);
            } else {
                const siteName = sites.find(s => s.id === siteId)?.name || 'Unknown Site';
                const { tier, bonus } = calculateStoreBonus(points, bonusTiers);

                const created: StorePoints = {
                    id: crypto.randomUUID(),
                    siteId,
                    siteName,
                    totalPoints: points,
                    todayPoints: points,
                    weeklyPoints: points,
                    monthlyPoints: points,
                    totalTransactions: transactionCount,
                    totalRevenue: revenue,
                    averageTicketSize: transactionCount > 0 ? Number((revenue / transactionCount).toFixed(2)) : 0,
                    customerSatisfaction: 100,
                    currentTier: tier.tierName,
                    estimatedBonus: bonus,
                    lastTransactionAt: nowIso,
                    lastUpdated: nowIso
                };
                recordToPersist = created;
                return [...prev, created];
            }
        });

        // Asynchronously persist to Supabase
        if (recordToPersist) {
            const toSave = recordToPersist;
            storePointsService.upsertBySite(toSave).catch(err => {
                logger.error('useGamificationActions', 'Failed to persist store points to Supabase', err);
            });

            pointsTransactionsService.create({
                id: crypto.randomUUID(),
                employeeId: `STORE-${siteId}`,
                points,
                type: 'BONUS',
                description: `POS Sales Award: +${points} pts (${revenue.toLocaleString()} ETB)`,
                timestamp: nowIso
            }).catch(err => {
                logger.error('useGamificationActions', 'Failed to log store points transaction', err);
            });
        }
    }, [sites, settings]);

    const calculateWorkerBonusShare = useCallback((siteId: string, employeeRole: string) => {
        const site = sites.find(s => s.id === siteId);
        if (!site) return undefined;

        const storePointsData = storePoints.find(sp => sp.siteId === siteId);
        const monthlyPoints = storePointsData?.monthlyPoints || 0;

        const bonusTiers = settings?.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
        const roleDistribution = settings?.posRoleDistribution || DEFAULT_POS_ROLE_DISTRIBUTION;

        // Calculate store bonus
        const { bonus: storeBonus } = calculateStoreBonus(monthlyPoints, bonusTiers);

        // Find role percentage share
        const roleConfig = roleDistribution.find((r: any) =>
            r.role.toLowerCase() === employeeRole.toLowerCase()
        );
        const rolePercentage = roleConfig ? roleConfig.percentage : 0;
        const personalShare = (storeBonus * rolePercentage) / 100;

        return {
            employeeId: '',
            employeeName: '',
            role: employeeRole,
            rolePercentage,
            storeBonus,
            personalShare,
            siteId
        };
    }, [sites, storePoints, settings]);

    const getStoreLeaderboard = useCallback(() => {
        return [...storePoints].sort((a, b) => b.totalPoints - a.totalPoints);
    }, [storePoints]);

    const getLevelFromPoints = useCallback((totalPoints: number) => {
        const levels = POINTS_CONFIG.LEVELS;
        let currentLevel = levels[0];
        for (let i = levels.length - 1; i >= 0; i--) {
            if (totalPoints >= levels[i].points) {
                currentLevel = levels[i];
                break;
            }
        }
        return currentLevel;
    }, []);

    return { getStorePoints, awardStorePoints, calculateWorkerBonusShare, getStoreLeaderboard, getLevelFromPoints };
}
