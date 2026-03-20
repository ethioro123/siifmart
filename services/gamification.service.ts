import { supabase } from '../lib/supabase';
import type { WorkerPoints, PointsTransaction, StorePoints } from '../types';

export const workerPointsService = {
    async getAll(siteId?: string) {
        let query = supabase.from('worker_points').select('*');
        if (siteId) {
            query = query.eq('site_id', siteId);
        }
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching worker points:', error);
            return [];
        }

        return data.map((wp: any) => ({
            id: wp.id,
            siteId: wp.site_id,
            employeeId: wp.employee_id,
            employeeName: wp.employee_name,
            employeeAvatar: wp.employee_avatar,
            totalPoints: wp.total_points,
            weeklyPoints: wp.weekly_points,
            monthlyPoints: wp.monthly_points,
            todayPoints: wp.today_points,
            totalJobsCompleted: wp.total_jobs_completed,
            totalItemsPicked: wp.total_items_picked,
            averageAccuracy: wp.average_accuracy,
            averageTimePerJob: wp.average_time_per_job,
            currentStreak: wp.current_streak,
            longestStreak: wp.longest_streak,
            lastJobCompletedAt: wp.last_job_completed_at,
            lastUpdated: wp.last_updated,
            achievements: wp.achievements || [],
            rank: wp.rank || 0,
            level: wp.level || 1,
            levelTitle: wp.level_title || 'Rookie',
            currentBonusTier: wp.current_bonus_tier,
            estimatedBonus: wp.estimated_bonus,
            bonusPeriodPoints: wp.bonus_period_points
        }));
    },

    async getByEmployee(employeeId: string) {
        const { data, error } = await supabase
            .from('worker_points')
            .select('*')
            .eq('employee_id', employeeId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            siteId: data.site_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            employeeAvatar: data.employee_avatar,
            totalPoints: data.total_points,
            weeklyPoints: data.weekly_points,
            monthlyPoints: data.monthly_points,
            todayPoints: data.today_points,
            totalJobsCompleted: data.total_jobs_completed,
            totalItemsPicked: data.total_items_picked,
            averageAccuracy: data.average_accuracy,
            averageTimePerJob: data.average_time_per_job,
            currentStreak: data.current_streak,
            longestStreak: data.longest_streak,
            lastJobCompletedAt: data.last_job_completed_at,
            lastUpdated: data.last_updated,
            achievements: data.achievements || [],
            rank: data.rank || 0,
            level: data.level || 1,
            levelTitle: data.level_title || 'Rookie',
            currentBonusTier: data.current_bonus_tier,
            estimatedBonus: data.estimated_bonus,
            bonusPeriodPoints: data.bonus_period_points
        };
    },

    async create(points: WorkerPoints) {
        const dbPoints = {
            site_id: points.siteId,
            employee_id: points.employeeId,
            employee_name: points.employeeName,
            employee_avatar: points.employeeAvatar,
            total_points: points.totalPoints,
            weekly_points: points.weeklyPoints,
            monthly_points: points.monthlyPoints,
            today_points: points.todayPoints,
            total_jobs_completed: points.totalJobsCompleted,
            total_items_picked: points.totalItemsPicked,
            average_accuracy: points.averageAccuracy,
            average_time_per_job: points.averageTimePerJob,
            current_streak: points.currentStreak,
            longest_streak: points.longestStreak,
            last_job_completed_at: points.lastJobCompletedAt,
            last_updated: points.lastUpdated,
            achievements: points.achievements,
            rank: points.rank,
            level: points.level,
            level_title: points.levelTitle,
            current_bonus_tier: points.currentBonusTier,
            estimated_bonus: points.estimatedBonus,
            bonus_period_points: points.bonusPeriodPoints
        };

        const { data, error } = await supabase
            .from('worker_points')
            .upsert(dbPoints, { onConflict: 'employee_id' })
            .select()
            .single();
        if (error) throw error;

        // Return mapped object or just assume it worked and return input with ID if new
        return { ...points, id: data.id };
    },

    async update(id: string, updates: Partial<WorkerPoints>) {
        const dbUpdates: any = {};
        if (updates.totalPoints !== undefined) dbUpdates.total_points = updates.totalPoints;
        if (updates.weeklyPoints !== undefined) dbUpdates.weekly_points = updates.weeklyPoints;
        if (updates.monthlyPoints !== undefined) dbUpdates.monthly_points = updates.monthlyPoints;
        if (updates.todayPoints !== undefined) dbUpdates.today_points = updates.todayPoints;
        if (updates.totalJobsCompleted !== undefined) dbUpdates.total_jobs_completed = updates.totalJobsCompleted;
        if (updates.totalItemsPicked !== undefined) dbUpdates.total_items_picked = updates.totalItemsPicked;
        if (updates.averageAccuracy !== undefined) dbUpdates.average_accuracy = updates.averageAccuracy;
        if (updates.averageTimePerJob !== undefined) dbUpdates.average_time_per_job = updates.averageTimePerJob;
        if (updates.currentStreak !== undefined) dbUpdates.current_streak = updates.currentStreak;
        if (updates.longestStreak !== undefined) dbUpdates.longest_streak = updates.longestStreak;
        if (updates.lastJobCompletedAt !== undefined) dbUpdates.last_job_completed_at = updates.lastJobCompletedAt;
        if (updates.lastUpdated !== undefined) dbUpdates.last_updated = updates.lastUpdated;
        if (updates.achievements !== undefined) dbUpdates.achievements = updates.achievements;
        if (updates.rank !== undefined) dbUpdates.rank = updates.rank;
        if (updates.level !== undefined) dbUpdates.level = updates.level;
        if (updates.levelTitle !== undefined) dbUpdates.level_title = updates.levelTitle;
        if (updates.currentBonusTier !== undefined) dbUpdates.current_bonus_tier = updates.currentBonusTier;
        if (updates.estimatedBonus !== undefined) dbUpdates.estimated_bonus = updates.estimatedBonus;
        if (updates.bonusPeriodPoints !== undefined) dbUpdates.bonus_period_points = updates.bonusPeriodPoints;

        const { data, error } = await supabase.from('worker_points').update(dbUpdates).eq('id', id).select();
        if (error) throw error;
        return data?.[0] || null;
    }
};

export const pointsTransactionsService = {
    async create(transaction: PointsTransaction) {
        const dbTxn = {
            employee_id: transaction.employeeId,
            job_id: transaction.jobId,
            points: transaction.points,
            type: transaction.type,
            description: transaction.description,
            created_at: transaction.timestamp
        };
        const { data, error } = await supabase.from('points_transactions').insert(dbTxn).select().single();
        if (error) throw error;
        return { ...transaction, id: data.id };
    },

    async getAll(employeeId?: string, limit?: number) {
        let query = supabase.from('points_transactions').select('*').order('created_at', { ascending: false });
        if (employeeId) query = query.eq('employee_id', employeeId);
        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching points transactions:', error);
            return [];
        }

        return data.map((t: any) => ({
            id: t.id,
            employeeId: t.employee_id,
            jobId: t.job_id,
            points: t.points,
            type: t.type,
            description: t.description,
            timestamp: t.created_at
        }));
    }
};

export const storePointsService = {
    async getAll() {
        const { data, error } = await supabase.from('store_points').select('*');
        if (error) {
            console.error('Error fetching store points:', error);
            return [];
        }
        return data.map((sp: any) => ({
            id: sp.id,
            siteId: sp.site_id,
            siteName: sp.site_name,
            totalPoints: sp.total_points,
            weeklyPoints: sp.weekly_points,
            monthlyPoints: sp.monthly_points,
            todayPoints: sp.today_points,
            totalTransactions: sp.total_transactions,
            totalRevenue: sp.total_revenue,
            averageTicketSize: sp.average_ticket_size,
            customerSatisfaction: sp.customer_satisfaction,
            lastTransactionAt: sp.last_transaction_at,
            lastUpdated: sp.last_updated,
            currentTier: sp.current_tier,
            estimated_bonus: sp.estimated_bonus
        }));
    },

    async create(points: StorePoints) {
        const dbPoints = {
            site_id: points.siteId,
            site_name: points.siteName,
            total_points: points.totalPoints,
            weekly_points: points.weeklyPoints,
            monthly_points: points.monthlyPoints,
            today_points: points.todayPoints,
            total_transactions: points.totalTransactions,
            total_revenue: points.totalRevenue,
            average_ticket_size: points.averageTicketSize,
            customer_satisfaction: points.customerSatisfaction,
            last_transaction_at: points.lastTransactionAt,
            last_updated: points.lastUpdated,
            current_tier: points.currentTier,
            estimated_bonus: points.estimatedBonus
        };
        const { data, error } = await supabase.from('store_points').insert(dbPoints).select().single();
        if (error) throw error;
        return { ...points, id: data.id };
    },

    async update(id: string, updates: Partial<StorePoints>) {
        const dbUpdates: any = {};
        if (updates.totalPoints !== undefined) dbUpdates.total_points = updates.totalPoints;
        if (updates.weeklyPoints !== undefined) dbUpdates.weekly_points = updates.weeklyPoints;
        if (updates.monthlyPoints !== undefined) dbUpdates.monthly_points = updates.monthlyPoints;
        if (updates.todayPoints !== undefined) dbUpdates.today_points = updates.todayPoints;
        if (updates.totalTransactions !== undefined) dbUpdates.total_transactions = updates.totalTransactions;
        if (updates.totalRevenue !== undefined) dbUpdates.total_revenue = updates.totalRevenue;
        if (updates.averageTicketSize !== undefined) dbUpdates.average_ticket_size = updates.averageTicketSize;
        if (updates.customerSatisfaction !== undefined) dbUpdates.customer_satisfaction = updates.customerSatisfaction;
        if (updates.lastTransactionAt !== undefined) dbUpdates.last_transaction_at = updates.lastTransactionAt;
        if (updates.lastUpdated !== undefined) dbUpdates.last_updated = updates.lastUpdated;
        if (updates.currentTier !== undefined) dbUpdates.current_tier = updates.currentTier;
        if (updates.estimatedBonus !== undefined) dbUpdates.estimated_bonus = updates.estimatedBonus;

        const { data, error } = await supabase.from('store_points').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
};
