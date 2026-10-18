import { beforeEach, describe, expect, it, vi } from 'vitest';
import { workerPointsService } from '../../services/gamification.service';
import { supabase } from '../../lib/supabase';
import type { WorkerPoints, PointsTransaction } from '../../types';

vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn(), from: vi.fn() } }));

const worker: WorkerPoints = {
    id: 'temp-worker', siteId: 'site-et', employeeId: 'employee-et', employeeName: 'Worker',
    totalPoints: 20, weeklyPoints: 20, monthlyPoints: 20, todayPoints: 20,
    totalJobsCompleted: 1, totalItemsPicked: 0, averageAccuracy: 100, averageTimePerJob: 0,
    currentStreak: 1, longestStreak: 1, lastUpdated: '2026-10-19T00:00:00Z',
    achievements: [], rank: 0, level: 1, levelTitle: 'Rookie'
};
const transaction: PointsTransaction = {
    id: 'transaction', employeeId: worker.employeeId, jobId: 'pack-job', points: 20,
    type: 'JOB_COMPLETE', description: 'Completed PACK', timestamp: worker.lastUpdated
};

describe('atomic worker points awards', () => {
    beforeEach(() => vi.clearAllMocks());

    it('uses one database transaction and returns persisted totals, including a deduplicated replay', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: {
            id: 'persisted', employee_id: worker.employeeId, site_id: worker.siteId,
            total_points: 15, weekly_points: 15, monthly_points: 15, today_points: 15
        }, error: null } as Awaited<ReturnType<typeof supabase.rpc>>);
        const saved = await workerPointsService.saveAward(worker, transaction);
        expect(saved.id).toBe('persisted');
        expect(saved.totalPoints).toBe(15);
        expect(supabase.rpc).toHaveBeenCalledWith('record_worker_points_award', expect.objectContaining({
            p_points: 20, p_job_id: 'pack-job', p_type: 'JOB_COMPLETE',
            p_worker: expect.objectContaining({ employee_id: worker.employeeId, site_id: worker.siteId })
        }));
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('propagates an audit rejection so the context cannot display an unpersisted award', async () => {
        const error = { code: '42501', message: 'Points award denied' };
        vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error } as Awaited<ReturnType<typeof supabase.rpc>>);
        await expect(workerPointsService.saveAward(worker, transaction)).rejects.toEqual(error);
        expect(supabase.from).not.toHaveBeenCalled();
    });
});
