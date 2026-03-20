import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WorkerPoints, PointsTransaction, WorkerBonusShare, POINTS_CONFIG } from '../types';
import { workerPointsService, pointsTransactionsService } from '../services/supabase.service';
import { useData } from './DataContext';

interface GamificationContextType {
    workerPoints: WorkerPoints[];
    getWorkerPoints: (employeeId: string) => WorkerPoints | undefined;
    awardPoints: (employeeId: string, points: number, type: PointsTransaction['type'], description: string, jobId?: string) => void;
    getLeaderboard: (siteId?: string, period?: 'today' | 'week' | 'month' | 'all') => WorkerPoints[];
    calculateWorkerBonusShare: (siteId: string, employeeRole: string) => WorkerBonusShare | undefined;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
    const { activeSite, settings, addNotification } = useData();
    const activeSiteId = activeSite?.id;
    const [workerPoints, setWorkerPoints] = useState<WorkerPoints[]>([]);

    useEffect(() => {
        if (!activeSiteId) return;

        const loadPoints = async () => {
            try {
                const data = await workerPointsService.getAll(activeSiteId);
                setWorkerPoints(data);
            } catch (error) {
                console.error("Failed to load points", error);
            }
        };

        loadPoints();
    }, [activeSiteId]);

    // Listen for fulfillment events (Decoupled Logic)
    useEffect(() => {
        const handleJobCompletion = (event: CustomEvent) => {
            console.log('🏆 Gamification: Job Completion Event Received', event.detail);
            const { job, userId, employeeId } = event.detail;

            if (!employeeId) {
                console.warn('⚠️ No employeeId provided for gamification event');
                return;
            }

            // Calculate points based on job type and complexity
            let points = 10; // Base points
            if (job.type === 'PICK') points += (job.items || 0) * 2;
            if (job.type === 'PACK') points += (job.items || 0) * 1;
            if (job.type === 'PUTAWAY') points += (job.items || 0) * 3;
            if (job.priority === 'High' || job.priority === 'Urgent') points = Math.round(points * 1.5);

            awardPoints(
                employeeId,
                points,
                'JOB_COMPLETE',
                `Completed ${job.type} job: ${job.jobNumber || job.id}`,
                job.id
            );
        };

        window.addEventListener('fulfillment:job-completed', handleJobCompletion as EventListener);
        return () => window.removeEventListener('fulfillment:job-completed', handleJobCompletion as EventListener);
    }, [activeSiteId]);

    const getWorkerPoints = (employeeId: string) => {
        return workerPoints.find(wp => wp.employeeId === employeeId);
    };

    const awardPoints = async (employeeId: string, points: number, type: PointsTransaction['type'], description: string, jobId?: string) => {
        try {
            // Optimistic update
            const currentPoints = workerPoints.find(wp => wp.employeeId === employeeId);
            const newTotal = (currentPoints?.totalPoints || 0) + points;
            const newLevelInfo = getLevelFromPoints(newTotal);
            const timestamp = new Date().toISOString();

            let optimisticUpdate: WorkerPoints;

            if (currentPoints) {
                optimisticUpdate = {
                    ...currentPoints,
                    totalPoints: newTotal,
                    todayPoints: (currentPoints.todayPoints || 0) + points,
                    weeklyPoints: (currentPoints.weeklyPoints || 0) + points,
                    monthlyPoints: (currentPoints.monthlyPoints || 0) + points,
                    totalJobsCompleted: type === 'JOB_COMPLETE' ? (currentPoints.totalJobsCompleted || 0) + 1 : (currentPoints.totalJobsCompleted || 0),
                    level: newLevelInfo.level,
                    levelTitle: newLevelInfo.title,
                    lastUpdated: timestamp,
                    lastJobCompletedAt: type === 'JOB_COMPLETE' ? timestamp : currentPoints.lastJobCompletedAt
                };
            } else {
                // New entry
                optimisticUpdate = {
                    id: 'temp-' + crypto.randomUUID(),
                    siteId: activeSiteId!,
                    employeeId,
                    employeeName: 'Unknown', // TODO: Fetch from EmployeeService if needed
                    totalPoints: newTotal,
                    weeklyPoints: points,
                    monthlyPoints: points,
                    todayPoints: points,
                    totalJobsCompleted: type === 'JOB_COMPLETE' ? 1 : 0,
                    totalItemsPicked: 0,
                    averageAccuracy: 100, // Default start
                    averageTimePerJob: 0,
                    currentStreak: 1,
                    longestStreak: 1,
                    achievements: [],
                    rank: 0,
                    level: newLevelInfo.level,
                    levelTitle: newLevelInfo.title,
                    lastUpdated: timestamp,
                    lastJobCompletedAt: type === 'JOB_COMPLETE' ? timestamp : undefined
                };
            }

            setWorkerPoints(prev => {
                const index = prev.findIndex(wp => wp.employeeId === employeeId);
                if (index >= 0) {
                    const newArr = [...prev];
                    newArr[index] = optimisticUpdate;
                    return newArr;
                }
                return [...prev, optimisticUpdate];
            });

            // DB Updates
            if (currentPoints) {
                await workerPointsService.update(currentPoints.id, {
                    totalPoints: newTotal,
                    level: newLevelInfo.level,
                    levelTitle: newLevelInfo.title,
                    todayPoints: optimisticUpdate.todayPoints,
                    weeklyPoints: optimisticUpdate.weeklyPoints,
                    monthlyPoints: optimisticUpdate.monthlyPoints,
                    totalJobsCompleted: optimisticUpdate.totalJobsCompleted,
                    lastJobCompletedAt: optimisticUpdate.lastJobCompletedAt,
                    lastUpdated: timestamp
                });
            } else {
                // For create, we pass the full object which satisfies the WorkerPoints interface
                // The service will ignore the temp ID and generate a real one
                await workerPointsService.create(optimisticUpdate);
            }

            await pointsTransactionsService.create({
                id: crypto.randomUUID(),
                employeeId,
                points,
                type,
                description,
                jobId,
                timestamp
            });

        } catch (error) {
            console.error('Failed to award points', error);
            addNotification('alert', 'Failed to update points');
        }
    };

    const getLevelFromPoints = (totalPoints: number) => {
        const levels = POINTS_CONFIG.LEVELS;
        let currentLevel = levels[0];
        for (let i = levels.length - 1; i >= 0; i--) {
            if (totalPoints >= levels[i].points) {
                currentLevel = levels[i];
                break;
            }
        }
        return currentLevel;
    };

    const getLeaderboard = (siteId?: string, period: 'today' | 'week' | 'month' | 'all' = 'all') => {
        let filtered = workerPoints;
        if (siteId) {
            filtered = filtered.filter(wp => wp.siteId === siteId);
        }
        // Fix sort to use totalPoints
        return filtered.sort((a, b) => b.totalPoints - a.totalPoints);
    };

    const calculateWorkerBonusShare = (siteId: string, employeeRole: string): WorkerBonusShare | undefined => {
        // Validation logic for bonus eligibility
        if (!settings.bonusEnabled) return undefined;
        // Simplified Logic: Just return a placeholder or implement fully if needed
        return undefined;
    };

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
