import {
    WMSJob,
    WarehousePointRule,
    DEFAULT_WAREHOUSE_POINT_RULES,
    WorkerAchievement,
    AchievementType
} from '../types';

export interface WarehousePointsResult {
    points: number;
    breakdown: { label: string; points: number }[];
}

/**
 * Calculates warehouse points earned for completing a job based on configured point rules.
 */
export function calculateWarehousePoints(
    job: Partial<WMSJob> & { type: string },
    rules: WarehousePointRule[] = DEFAULT_WAREHOUSE_POINT_RULES,
    accuracyRate: number = 100
): WarehousePointsResult {
    const activeRules = (rules && rules.length > 0) ? rules : DEFAULT_WAREHOUSE_POINT_RULES;
    const breakdown: { label: string; points: number }[] = [];
    let totalPoints = 0;

    // 1. Base Job Points
    const jobType = job.type?.toUpperCase();
    const baseRule = activeRules.find(r => r.enabled && r.action === jobType);
    const basePoints = baseRule ? baseRule.points : 10;
    
    // Priority multiplier
    const isHighPriority = job.priority === 'High' || job.priority === 'Critical';
    const effectiveBasePoints = isHighPriority ? Math.round(basePoints * 1.5) : basePoints;
    
    totalPoints += effectiveBasePoints;
    breakdown.push({
        label: `${job.type} Job Base${isHighPriority ? ' (High Priority 1.5x)' : ''}`,
        points: effectiveBasePoints
    });

    // 2. Item Bonus
    const itemCount = job.items || job.items_count || job.lineItems?.length || 0;
    const itemBonusRule = activeRules.find(r => r.enabled && r.action === 'ITEM_BONUS');
    if (itemCount > 0 && itemBonusRule && itemBonusRule.points > 0) {
        const itemPoints = itemCount * itemBonusRule.points;
        totalPoints += itemPoints;
        breakdown.push({
            label: `${itemCount} items processed (+${itemBonusRule.points}/item)`,
            points: itemPoints
        });
    }

    // 3. Accuracy Bonus
    if (accuracyRate >= 100) {
        const acc100Rule = activeRules.find(r => r.enabled && r.action === 'ACCURACY_100');
        if (acc100Rule && acc100Rule.points > 0) {
            totalPoints += acc100Rule.points;
            breakdown.push({
                label: '100% Accuracy Bonus',
                points: acc100Rule.points
            });
        }
    } else if (accuracyRate >= 95) {
        const acc95Rule = activeRules.find(r => r.enabled && r.action === 'ACCURACY_95');
        if (acc95Rule && acc95Rule.points > 0) {
            totalPoints += acc95Rule.points;
            breakdown.push({
                label: '95%+ Accuracy Bonus',
                points: acc95Rule.points
            });
        }
    }

    return {
        points: Math.max(1, totalPoints),
        breakdown
    };
}

/**
 * Calculates updated streaks and streak milestone bonus points.
 */
export function calculateStreakUpdate(
    lastJobCompletedAt: string | undefined,
    currentStreak: number,
    longestStreak: number,
    rules: WarehousePointRule[] = DEFAULT_WAREHOUSE_POINT_RULES
): {
    currentStreak: number;
    longestStreak: number;
    streakBonus: number;
    streakMilestone?: string;
} {
    const activeRules = (rules && rules.length > 0) ? rules : DEFAULT_WAREHOUSE_POINT_RULES;
    const now = new Date();

    if (!lastJobCompletedAt) {
        return {
            currentStreak: 1,
            longestStreak: Math.max(1, longestStreak),
            streakBonus: 0
        };
    }

    const lastDate = new Date(lastJobCompletedAt);
    
    // Normalize to date string (YYYY-MM-DD) in local time
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lastStr = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;

    if (todayStr === lastStr) {
        // Same day completion, streak persists without increment
        return {
            currentStreak: Math.max(1, currentStreak),
            longestStreak: Math.max(currentStreak, longestStreak),
            streakBonus: 0
        };
    }

    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let newStreak = 1;
    if (lastStr === yesterdayStr) {
        newStreak = currentStreak + 1;
    }

    const newLongest = Math.max(newStreak, longestStreak);
    let streakBonus = 0;
    let streakMilestone: string | undefined;

    if (newStreak === 3) {
        const rule = activeRules.find(r => r.enabled && r.action === 'STREAK_3');
        if (rule) {
            streakBonus = rule.points;
            streakMilestone = '3-Day Active Streak!';
        }
    } else if (newStreak === 7) {
        const rule = activeRules.find(r => r.enabled && r.action === 'STREAK_7');
        if (rule) {
            streakBonus = rule.points;
            streakMilestone = '7-Day Active Streak!';
        }
    } else if (newStreak === 30) {
        const rule = activeRules.find(r => r.enabled && r.action === 'STREAK_30');
        if (rule) {
            streakBonus = rule.points;
            streakMilestone = '30-Day Master Streak!';
        }
    }

    return {
        currentStreak: newStreak,
        longestStreak: newLongest,
        streakBonus,
        streakMilestone
    };
}

const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, { name: string; description: string; points: number; icon: string }> = {
    first_job: { name: 'First Mission', description: 'Completed your very first warehouse job', points: 25, icon: '🚀' },
    speed_demon: { name: 'Speed Demon', description: 'Completed a job with lightning speed', points: 50, icon: '⚡' },
    perfect_accuracy: { name: 'Eagle Eye', description: 'Maintained 100% accuracy on job verification', points: 75, icon: '🎯' },
    streak_3: { name: 'On Fire', description: 'Worked 3 consecutive days without missing a beat', points: 25, icon: '🔥' },
    streak_7: { name: 'Unstoppable', description: 'Worked 7 consecutive days active streak', points: 75, icon: '🛡️' },
    streak_30: { name: 'Warehouse Legend', description: '30 consecutive days of operational excellence', points: 300, icon: '👑' },
    centurion: { name: 'Centurion', description: 'Completed 100 fulfillment jobs', points: 150, icon: '💯' },
    veteran: { name: 'Warehouse Veteran', description: 'Completed 500 fulfillment jobs', points: 500, icon: '🎖️' },
    legend: { name: 'Mythic Operator', description: 'Completed 1,000 fulfillment jobs', points: 1000, icon: '🌟' },
    early_bird: { name: 'Early Bird', description: 'Completed a shift before 8 AM', points: 30, icon: '🌅' },
    night_owl: { name: 'Night Owl', description: 'Completed operations during evening shift', points: 30, icon: '🦉' },
    team_player: { name: 'Team Dynamo', description: 'Assisted in multi-department warehouse transfers', points: 40, icon: '🤝' }
};

/**
 * Checks for any newly unlocked achievements based on worker metrics.
 */
export function evaluateAchievements(
    currentAchievements: WorkerAchievement[] = [],
    stats: {
        totalJobsCompleted: number;
        currentStreak: number;
        accuracy: number;
        jobDurationMinutes?: number;
    }
): {
    newAchievements: WorkerAchievement[];
    allAchievements: WorkerAchievement[];
    pointsAwarded: number;
} {
    const existingTypes = new Set(currentAchievements.map(a => a.type));
    const newAchievements: WorkerAchievement[] = [];
    const timestamp = new Date().toISOString();

    const tryUnlock = (type: AchievementType) => {
        if (!existingTypes.has(type)) {
            const def = ACHIEVEMENT_DEFINITIONS[type];
            if (def) {
                const achievement: WorkerAchievement = {
                    id: `ach-${type}-${Date.now()}`,
                    type,
                    name: def.name,
                    description: def.description,
                    icon: def.icon,
                    unlockedAt: timestamp,
                    pointsAwarded: def.points
                };
                newAchievements.push(achievement);
                existingTypes.add(type);
            }
        }
    };

    if (stats.totalJobsCompleted >= 1) tryUnlock('first_job');
    if (stats.totalJobsCompleted >= 100) tryUnlock('centurion');
    if (stats.totalJobsCompleted >= 500) tryUnlock('veteran');
    if (stats.totalJobsCompleted >= 1000) tryUnlock('legend');

    if (stats.currentStreak >= 3) tryUnlock('streak_3');
    if (stats.currentStreak >= 7) tryUnlock('streak_7');
    if (stats.currentStreak >= 30) tryUnlock('streak_30');

    if (stats.accuracy >= 100 && stats.totalJobsCompleted >= 3) {
        tryUnlock('perfect_accuracy');
    }

    if (stats.jobDurationMinutes !== undefined && stats.jobDurationMinutes > 0 && stats.jobDurationMinutes <= 4) {
        tryUnlock('speed_demon');
    }

    const pointsAwarded = newAchievements.reduce((sum, a) => sum + a.pointsAwarded, 0);

    return {
        newAchievements,
        allAchievements: [...currentAchievements, ...newAchievements],
        pointsAwarded
    };
}
