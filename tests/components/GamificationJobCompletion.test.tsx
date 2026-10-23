// @vitest-environment jsdom
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GamificationProvider, useGamification } from '../../contexts/GamificationContext';

const mocks = vi.hoisted(() => ({
    getAll: vi.fn(), awardCompletedJob: vi.fn(), saveAward: vi.fn(), notification: vi.fn()
}));
vi.mock('../../services/supabase.service', () => ({ workerPointsService: mocks }));
vi.mock('../../contexts/DataContext', () => ({ useData: () => ({
    activeSite: { id: 'et-dc' }, settings: {}, sites: [], employees: [], addNotification: mocks.notification
}) }));
vi.mock('../../components/StoreBonusDisplay', () => ({ calculateStoreBonus: vi.fn() }));
vi.mock('../../utils/logger', () => ({ logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => <GamificationProvider>{children}</GamificationProvider>;

describe('automatic completion points', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getAll.mockResolvedValue([]);
    });

    it('uses the persisted job award instead of the supervisor-only manual award API', async () => {
        const saved = { id: 'points', employeeId: 'worker', siteId: 'et-dc', totalPoints: 85 };
        mocks.awardCompletedJob.mockResolvedValue(saved);
        const { result } = renderHook(() => useGamification(), { wrapper });
        await waitFor(() => expect(mocks.getAll).toHaveBeenCalled());
        await act(async () => { await result.current.awardPoints('worker', 999999, 'JOB_COMPLETE', 'client estimate', 'job-id'); });
        expect(mocks.awardCompletedJob).toHaveBeenCalledWith('job-id');
        expect(mocks.saveAward).not.toHaveBeenCalled();
        expect(result.current.getWorkerPoints('worker')?.totalPoints).toBe(85);
    });

    it('never displays a rejected or disabled automatic award as earned points', async () => {
        mocks.awardCompletedJob.mockRejectedValueOnce(new Error('Not authorized')).mockResolvedValueOnce(null);
        const { result } = renderHook(() => useGamification(), { wrapper });
        await waitFor(() => expect(mocks.getAll).toHaveBeenCalled());
        await act(async () => { await result.current.awardPoints('worker', 100, 'JOB_COMPLETE', '', 'job-id'); });
        expect(result.current.workerPoints).toEqual([]);
        expect(mocks.notification).toHaveBeenCalledWith('alert', 'Failed to update points');
        mocks.notification.mockClear();
        await act(async () => { await result.current.awardPoints('worker', 100, 'JOB_COMPLETE', '', 'job-id'); });
        expect(result.current.workerPoints).toEqual([]);
        expect(mocks.notification).not.toHaveBeenCalled();
    });
});
