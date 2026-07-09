import { useCallback } from 'react';
import type { StorePoints, Site } from '../../types';
import { POINTS_CONFIG, DEFAULT_POS_ROLE_DISTRIBUTION, DEFAULT_POS_BONUS_TIERS } from '../../types';
import { calculateStoreBonus } from '../../components/StoreBonusDisplay';

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
        setStorePoints(prev => {
            const existing = prev.find(sp => sp.siteId === siteId);
            if (existing) {
                return prev.map(sp => sp.siteId === siteId ? {
                    ...sp,
                    totalPoints: (sp.totalPoints || 0) + points,
                    todayPoints: (sp.todayPoints || 0) + points,
                    weeklyPoints: (sp.weeklyPoints || 0) + points,
                    monthlyPoints: (sp.monthlyPoints || 0) + points,
                    totalRevenue: (sp.totalRevenue || 0) + revenue,
                    totalTransactions: (sp.totalTransactions || 0) + transactionCount,
                    lastUpdated: new Date().toISOString()
                } : sp);
            } else {
                const siteName = sites.find(s => s.id === siteId)?.name || 'Unknown Site';
                return [...prev, {
                    id: crypto.randomUUID(),
                    siteId,
                    siteName,
                    totalPoints: points,
                    todayPoints: points,
                    weeklyPoints: points,
                    monthlyPoints: points,
                    totalTransactions: transactionCount,
                    totalRevenue: revenue,
                    averageTicketSize: transactionCount > 0 ? revenue / transactionCount : 0,
                    customerSatisfaction: 100,
                    lastUpdated: new Date().toISOString()
                }];
            }
        });
    }, [sites]);
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
