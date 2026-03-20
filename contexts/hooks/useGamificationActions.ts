import { useCallback } from 'react';
import type { StorePoints, Site } from '../../types';
import { POINTS_CONFIG } from '../../types';

interface UseGamificationActionsDeps {
    sites: Site[];
    storePoints: StorePoints[];
    setStorePoints: React.Dispatch<React.SetStateAction<StorePoints[]>>;
}

export function useGamificationActions(deps: UseGamificationActionsDeps) {
    const { sites, storePoints, setStorePoints } = deps;

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
        return {
            employeeId: '',
            employeeName: '',
            role: employeeRole,
            rolePercentage: 0,
            storeBonus: 0,
            personalShare: 0,
            siteId,
            eligible: true,
            share: 0,
            estimatedAmount: 0
        };
    }, []);

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
