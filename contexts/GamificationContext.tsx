import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
    WorkerPoints,
    PointsTransaction,
    WorkerBonusShare,
    DEFAULT_BONUS_TIERS,
    DEFAULT_POS_BONUS_TIERS,
    DEFAULT_POS_ROLE_DISTRIBUTION
} from '../types';
import { workerPointsService } from '../services/supabase.service';
import { useData } from './DataContext';
import { calculateStoreBonus } from '../components/StoreBonusDisplay';
import { calculateBonus, getLevelInfo } from '../components/settings/gamification/workerPointsHelpers';
import {
    calculateWarehousePoints,
    calculateStreakUpdate,
    evaluateAchievements,
    calculateDiscrepancyPenalty
} from '../utils/warehouseGamification';
import { logger } from '../utils/logger';

interface GamificationContextType {
    workerPoints: WorkerPoints[];
    getWorkerPoints: (employeeId: string) => WorkerPoints | undefined;
    awardPoints: (
        employeeId: string,
        points: number,
        type: PointsTransaction['type'],
        description: string,
        jobId?: string,
        meta?: {
            employeeName?: string;
            employeeAvatar?: string;
            siteId?: string;
            itemsPicked?: number;
            accuracy?: number;
            jobDurationMinutes?: number;
        }
    ) => Promise<void>;
    getLeaderboard: (siteId?: string, period?: 'today' | 'week' | 'month' | 'all') => WorkerPoints[];
    calculateWorkerBonusShare: (siteId: string, employeeRole: string) => WorkerBonusShare | undefined;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
    const { activeSite, settings, addNotification, sites, employees, getStorePoints } = useData();
    const activeSiteId = activeSite?.id;
    const [workerPoints, setWorkerPoints] = useState<WorkerPoints[]>([]);

    useEffect(() => {
        if (!activeSiteId) return;

        let cancelled = false;
        setWorkerPoints([]);
        const loadPoints = async () => {
            try {
                const data = await workerPointsService.getAll(activeSiteId);
                if (!cancelled) setWorkerPoints(data);
            } catch (error) {
                logger.error('GamificationContext', 'Failed to load worker points', error);
            }
        };

        loadPoints();
        const refreshReviewed = (event: Event) => {
            const detail = (event as CustomEvent<{siteId:string;country:string}>).detail;
            if (detail?.siteId === activeSiteId && detail.country === activeSite?.country) loadPoints();
        };
        window.addEventListener('warehouse-points-review-saved', refreshReviewed);
        return () => { cancelled = true; window.removeEventListener('warehouse-points-review-saved', refreshReviewed); };
    }, [activeSiteId, activeSite?.country]);

    const getWorkerPoints = useCallback((employeeId: string) => {
        return workerPoints.find(wp => wp.employeeId === employeeId);
    }, [workerPoints]);

    const awardPoints = useCallback(async (
        employeeId: string,
        points: number,
        type: PointsTransaction['type'],
        description: string,
        jobId?: string,
        meta?: {
            employeeName?: string;
            employeeAvatar?: string;
            siteId?: string;
            itemsPicked?: number;
            accuracy?: number;
            jobDurationMinutes?: number;
        }
    ) => {
        try {
            if (type === 'JOB_COMPLETE') {
                if (!jobId) throw new Error('A completed job is required for automatic points');
                const persisted = await workerPointsService.awardCompletedJob(jobId);
                if (persisted && 'pendingReview' in persisted) { addNotification('info', 'Job completion points are pending discrepancy review.'); return; }
                if (persisted) setWorkerPoints(prev => [...prev.filter(wp => wp.employeeId !== persisted.employeeId), persisted]);
                return;
            }
            const currentPoints = workerPoints.find(wp => wp.employeeId === employeeId);
            const empRecord = employees.find(e => e.id === employeeId || e.name === meta?.employeeName);
            const employeeName = meta?.employeeName || empRecord?.name || currentPoints?.employeeName || 'Warehouse Worker';
            const employeeAvatar = meta?.employeeAvatar || empRecord?.avatar || currentPoints?.employeeAvatar || '';
            const targetSiteId = meta?.siteId || empRecord?.siteId || currentPoints?.siteId || activeSiteId || 'SITE-001';

            const activeBonusTiers = settings?.bonusTiers && settings.bonusTiers.length > 0
                ? settings.bonusTiers
                : DEFAULT_BONUS_TIERS;
            const activeWarehouseRules = settings?.warehousePointRules;

            // 1. Streak updates
            const streakInfo = calculateStreakUpdate(
                currentPoints?.lastJobCompletedAt,
                currentPoints?.currentStreak || 0,
                currentPoints?.longestStreak || 0,
                activeWarehouseRules
            );

            // 2. Total points calculation including streak bonus
            const baseAndStreakPoints = points + streakInfo.streakBonus;
            const newTotalJobs = currentPoints?.totalJobsCompleted || 0;

            // 3. Evaluate achievements
            const accuracyVal = meta?.accuracy !== undefined ? meta.accuracy : (currentPoints?.averageAccuracy || 100);
            const achResult = evaluateAchievements(
                currentPoints?.achievements || [],
                {
                    totalJobsCompleted: newTotalJobs,
                    currentStreak: streakInfo.currentStreak,
                    accuracy: accuracyVal,
                    jobDurationMinutes: meta?.jobDurationMinutes
                }
            );

            const totalPointsToAdd = baseAndStreakPoints + achResult.pointsAwarded;
            const newTotal = (currentPoints?.totalPoints || 0) + totalPointsToAdd;
            const newMonthly = (currentPoints?.monthlyPoints || 0) + totalPointsToAdd;
            const newToday = (currentPoints?.todayPoints || 0) + totalPointsToAdd;
            const newWeekly = (currentPoints?.weeklyPoints || 0) + totalPointsToAdd;

            const newLevelInfo = getLevelInfo(newTotal);
            const bonusInfo = calculateBonus(newMonthly, activeBonusTiers);
            const timestamp = new Date().toISOString();

            const itemsPickedToAdd = meta?.itemsPicked || 0;
            const newItemsPicked = (currentPoints?.totalItemsPicked || 0) + itemsPickedToAdd;

            let optimisticUpdate: WorkerPoints;

            if (currentPoints) {
                optimisticUpdate = {
                    ...currentPoints,
                    employeeName,
                    employeeAvatar,
                    totalPoints: newTotal,
                    todayPoints: newToday,
                    weeklyPoints: newWeekly,
                    monthlyPoints: newMonthly,
                    totalJobsCompleted: newTotalJobs,
                    totalItemsPicked: newItemsPicked,
                    currentStreak: streakInfo.currentStreak,
                    longestStreak: streakInfo.longestStreak,
                    averageAccuracy: accuracyVal,
                    level: newLevelInfo.currentLevel.level,
                    levelTitle: newLevelInfo.currentLevel.title,
                    currentBonusTier: bonusInfo.tier.tierName,
                    estimatedBonus: bonusInfo.bonus,
                    bonusPeriodPoints: newMonthly,
                    achievements: achResult.allAchievements,
                    lastJobCompletedAt: currentPoints.lastJobCompletedAt,
                    lastUpdated: timestamp
                };
            } else {
                optimisticUpdate = {
                    id: 'temp-' + crypto.randomUUID(),
                    siteId: targetSiteId,
                    employeeId,
                    employeeName,
                    employeeAvatar,
                    totalPoints: newTotal,
                    weeklyPoints: newWeekly,
                    monthlyPoints: newMonthly,
                    todayPoints: newToday,
                    totalJobsCompleted: newTotalJobs,
                    totalItemsPicked: newItemsPicked,
                    averageAccuracy: accuracyVal,
                    averageTimePerJob: 0,
                    currentStreak: streakInfo.currentStreak,
                    longestStreak: streakInfo.longestStreak,
                    achievements: achResult.allAchievements,
                    rank: 0,
                    level: newLevelInfo.currentLevel.level,
                    levelTitle: newLevelInfo.currentLevel.title,
                    currentBonusTier: bonusInfo.tier.tierName,
                    estimatedBonus: bonusInfo.bonus,
                    bonusPeriodPoints: newMonthly,
                    lastJobCompletedAt: undefined,
                    lastUpdated: timestamp
                };
            }

            // Save totals and audit together; failed awards never enter the local leaderboard.
            const persisted = await workerPointsService.saveAward(optimisticUpdate, {
                id: crypto.randomUUID(),
                employeeId,
                points: totalPointsToAdd,
                type,
                description,
                jobId,
                timestamp
            });
            setWorkerPoints(prev => {
                const index = prev.findIndex(wp => wp.employeeId === employeeId);
                if (index >= 0) return prev.map((wp, i) => i === index ? persisted : wp);
                return [...prev, persisted];
            });

            // Trigger notification for streak milestone or achievement
            if (streakInfo.streakMilestone) {
                addNotification('success', `🔥 Streak Milestone: ${streakInfo.streakMilestone} (+${streakInfo.streakBonus} pts)`);
            }
            if (achResult.newAchievements.length > 0) {
                achResult.newAchievements.forEach(a => {
                    addNotification('success', `🏆 Achievement Unlocked: ${a.name}! (+${a.pointsAwarded} pts)`);
                });
            }
        } catch (error) {
            logger.error('GamificationContext', 'Failed to award worker points', error);
            addNotification('alert', 'Failed to update points');
        }
    }, [workerPoints, employees, activeSiteId, settings, addNotification]);

    // Decoupled listener for job completions
    useEffect(() => {
        const handleJobCompletion = (event: CustomEvent) => {
            logger.debug('GamificationContext', '🏆 Gamification: Job Completion Event Received', event.detail);
            const { job, employeeId, employeeName, pointsResult, accuracy } = event.detail || {};

            if (!employeeId) {
                logger.warn('GamificationContext', '⚠️ No employeeId provided for gamification event');
                return;
            }

            // Check if site and settings allow warehouse bonus
            const targetSiteId = job?.siteId || activeSiteId;
            const targetSite = sites.find(s => s.id === targetSiteId);
            const isWarehouseBonusAllowed = settings.bonusEnabled !== false &&
                targetSite?.warehouseBonusEnabled !== false &&
                (targetSite as any)?.warehouse_bonus_enabled !== false;

            if (!isWarehouseBonusAllowed) {
                logger.debug('GamificationContext', 'Warehouse bonus disabled for this site or globally.');
                return;
            }

            // Use calculated points from completion, or compute from active rules
            const resolvedPointsResult = pointsResult || calculateWarehousePoints(
                job,
                settings.warehousePointRules,
                accuracy !== undefined ? accuracy : 100
            );

            const pickedCount = job.type === 'PICK'
                ? (job.items || job.lineItems?.reduce((sum: number, i: any) => sum + (i.pickedQty || 0), 0) || 0)
                : 0;

            awardPoints(
                employeeId,
                resolvedPointsResult.points,
                'JOB_COMPLETE',
                `Completed ${job.type} job: ${job.jobNumber || job.id}`,
                job.id,
                {
                    employeeName,
                    siteId: targetSiteId,
                    itemsPicked: pickedCount,
                    accuracy: accuracy !== undefined ? accuracy : 100
                }
            );
        };

        window.addEventListener('fulfillment:job-completed', handleJobCompletion as EventListener);
        return () => window.removeEventListener('fulfillment:job-completed', handleJobCompletion as EventListener);
    }, [activeSiteId, settings, sites, awardPoints]);

    // Chain of Custody Discrepancy Listener: Penalizes accuracy and points for cargo discrepancies
    useEffect(() => {
        const handleDiscrepancy = (e: CustomEvent) => {
            const { employeeId, employeeName, siteId, discrepancyCount, totalExpected, transferId } = e.detail || {};
            if (!employeeId || !discrepancyCount) return;

            const current = workerPoints.find(w => w.employeeId === employeeId);
            const currentAccuracy = current?.averageAccuracy !== undefined ? current.averageAccuracy : 100;
            const penalty = calculateDiscrepancyPenalty(currentAccuracy, discrepancyCount, totalExpected || 10);

            awardPoints(
                employeeId,
                penalty.penaltyPoints,
                'DISCREPANCY_PENALTY',
                penalty.description,
                transferId,
                {
                    employeeName: employeeName || current?.employeeName || 'Staff',
                    siteId: siteId || activeSiteId,
                    accuracy: penalty.newAccuracy
                }
            );
        };

        window.addEventListener('fulfillment:chain-of-custody-discrepancy', handleDiscrepancy as EventListener);
        return () => window.removeEventListener('fulfillment:chain-of-custody-discrepancy', handleDiscrepancy as EventListener);
    }, [workerPoints, activeSiteId, awardPoints]);

    const getLeaderboard = useCallback((siteId?: string, period: 'today' | 'week' | 'month' | 'all' = 'all') => {
        let filtered = [...workerPoints];
        if (siteId) {
            filtered = filtered.filter(wp => wp.siteId === siteId);
        }

        switch (period) {
            case 'today':
                filtered.sort((a, b) => (b.todayPoints || 0) - (a.todayPoints || 0));
                break;
            case 'week':
                filtered.sort((a, b) => (b.weeklyPoints || 0) - (a.weeklyPoints || 0));
                break;
            case 'month':
                filtered.sort((a, b) => (b.monthlyPoints || 0) - (a.monthlyPoints || 0));
                break;
            case 'all':
            default:
                filtered.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
                break;
        }

        return filtered.map((wp, idx) => ({
            ...wp,
            rank: idx + 1
        }));
    }, [workerPoints]);

    const calculateWorkerBonusShare = useCallback((siteId: string, employeeRole: string): WorkerBonusShare | undefined => {
        if (!settings.bonusEnabled) return undefined;

        const site = sites.find(s => s.id === siteId);
        if (!site) return undefined;

        const storePointsData = getStorePoints ? getStorePoints(siteId) : undefined;
        const monthlyPoints = storePointsData?.monthlyPoints || 0;

        const bonusTiers = settings.posBonusTiers || DEFAULT_POS_BONUS_TIERS;
        const roleDistribution = settings.posRoleDistribution || DEFAULT_POS_ROLE_DISTRIBUTION;

        const { bonus: storeBonus } = calculateStoreBonus(monthlyPoints, bonusTiers);

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
    }, [settings, sites, getStorePoints]);

    return (
        <GamificationContext.Provider value={{
            workerPoints,
            getWorkerPoints,
            awardPoints,
            getLeaderboard,
            calculateWorkerBonusShare
        }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};
