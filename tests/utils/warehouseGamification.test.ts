import { describe, it, expect } from 'vitest';
import {
    calculateWarehousePoints,
    calculateStreakUpdate,
    evaluateAchievements
} from '../../utils/warehouseGamification';
import { DEFAULT_WAREHOUSE_POINT_RULES } from '../../types';

describe('warehouseGamification', () => {
    describe('calculateWarehousePoints', () => {
        it('calculates base points for PICK jobs correctly', () => {
            const result = calculateWarehousePoints({ type: 'PICK', priority: 'Normal' }, DEFAULT_WAREHOUSE_POINT_RULES, 100);
            // Base 15 + 100% accuracy 50 = 65
            expect(result.points).toBe(65);
            expect(result.breakdown).toHaveLength(2);
            expect(result.breakdown[0].label).toContain('PICK Job Base');
            expect(result.breakdown[0].points).toBe(15);
            expect(result.breakdown[1].label).toBe('100% Accuracy Bonus');
            expect(result.breakdown[1].points).toBe(50);
        });

        it('calculates item bonus when items are processed', () => {
            const result = calculateWarehousePoints(
                { type: 'PACK', priority: 'Normal', items: 10 },
                DEFAULT_WAREHOUSE_POINT_RULES,
                90
            );
            // Base 10 + 10 items * 2 pts = 30 pts (no accuracy bonus below 95%)
            expect(result.points).toBe(30);
            expect(result.breakdown).toHaveLength(2);
            expect(result.breakdown[1].label).toContain('10 items processed');
            expect(result.breakdown[1].points).toBe(20);
        });

        it('applies 1.5x multiplier for High priority jobs', () => {
            const result = calculateWarehousePoints(
                { type: 'PUTAWAY', priority: 'High' },
                DEFAULT_WAREHOUSE_POINT_RULES,
                90
            );
            // Base 8 * 1.5 = 12
            expect(result.points).toBe(12);
            expect(result.breakdown[0].points).toBe(12);
            expect(result.breakdown[0].label).toContain('High Priority 1.5x');
        });

        it('applies 95%+ accuracy bonus', () => {
            const result = calculateWarehousePoints(
                { type: 'DISPATCH', priority: 'Normal' },
                DEFAULT_WAREHOUSE_POINT_RULES,
                96
            );
            // Base 8 + Accuracy 95+ (25) = 33
            expect(result.points).toBe(33);
            expect(result.breakdown[1].label).toBe('95%+ Accuracy Bonus');
            expect(result.breakdown[1].points).toBe(25);
        });
    });

    describe('calculateStreakUpdate', () => {
        it('starts streak at 1 if no previous job completion', () => {
            const streak = calculateStreakUpdate(undefined, 0, 0, DEFAULT_WAREHOUSE_POINT_RULES);
            expect(streak.currentStreak).toBe(1);
            expect(streak.longestStreak).toBe(1);
            expect(streak.streakBonus).toBe(0);
        });

        it('maintains streak on same day completions', () => {
            const now = new Date().toISOString();
            const streak = calculateStreakUpdate(now, 5, 8, DEFAULT_WAREHOUSE_POINT_RULES);
            expect(streak.currentStreak).toBe(5);
            expect(streak.longestStreak).toBe(8);
            expect(streak.streakBonus).toBe(0);
        });

        it('increments streak and awards bonus at 3 days', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const streak = calculateStreakUpdate(yesterday.toISOString(), 2, 2, DEFAULT_WAREHOUSE_POINT_RULES);
            expect(streak.currentStreak).toBe(3);
            expect(streak.longestStreak).toBe(3);
            expect(streak.streakBonus).toBe(25);
            expect(streak.streakMilestone).toBe('3-Day Active Streak!');
        });

        it('resets streak to 1 if more than 1 day has passed', () => {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const streak = calculateStreakUpdate(threeDaysAgo.toISOString(), 10, 15, DEFAULT_WAREHOUSE_POINT_RULES);
            expect(streak.currentStreak).toBe(1);
            expect(streak.longestStreak).toBe(15);
            expect(streak.streakBonus).toBe(0);
        });
    });

    describe('evaluateAchievements', () => {
        it('awards first_job on first completion', () => {
            const result = evaluateAchievements([], {
                totalJobsCompleted: 1,
                currentStreak: 1,
                accuracy: 90
            });
            expect(result.newAchievements).toHaveLength(1);
            expect(result.newAchievements[0].type).toBe('first_job');
            expect(result.pointsAwarded).toBe(25);
        });

        it('awards streak_3 when streak reaches 3', () => {
            const result = evaluateAchievements(
                [{ id: '1', type: 'first_job', name: 'First Mission', description: '', icon: '', unlockedAt: '', pointsAwarded: 25 }],
                { totalJobsCompleted: 5, currentStreak: 3, accuracy: 90 }
            );
            expect(result.newAchievements.some(a => a.type === 'streak_3')).toBe(true);
        });

        it('does not award duplicate achievements', () => {
            const existing = [{ id: '1', type: 'first_job' as const, name: 'First Mission', description: '', icon: '', unlockedAt: '', pointsAwarded: 25 }];
            const result = evaluateAchievements(existing, {
                totalJobsCompleted: 5,
                currentStreak: 1,
                accuracy: 90
            });
            expect(result.newAchievements.find(a => a.type === 'first_job')).toBeUndefined();
        });
    });
});
