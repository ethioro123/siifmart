import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StaffSchedule } from '../types';
import { schedulesService } from '../services/supabase.service';
import { useData } from './DataContext';
import { useStore } from './CentralStore';
import { logger } from '../utils/logger';

interface RosterContextType {
    schedules: StaffSchedule[];
    addSchedule: (schedule: StaffSchedule, user: string) => Promise<boolean>;
    updateSchedule: (id: string, updates: Partial<StaffSchedule>, user: string) => Promise<boolean>;
    deleteSchedule: (id: string, user: string) => Promise<boolean>;
    refreshSchedules: () => Promise<void>;
}

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export const RosterProvider = ({ children }: { children: ReactNode }) => {
    const { activeSite, addNotification } = useData();
    const { user } = useStore();
    const activeSiteId = activeSite?.id;
    const activeCountry = activeSite?.country;
    const queryClient = useQueryClient();
    const scheduleQueryKey = ['schedules', user?.id, activeSiteId, activeCountry];
    const { data: schedules = [] } = useQuery({
        queryKey: scheduleQueryKey,
        queryFn: () => schedulesService.getAll(activeSiteId as string, undefined, activeCountry),
        enabled: Boolean(user?.id && activeSiteId),
        staleTime: 5 * 60 * 1000
    });

    const loadSchedules = useCallback(async () => {
        if (!activeSiteId) return;
        try {
            await queryClient.invalidateQueries({ queryKey: scheduleQueryKey, exact: true });
        } catch (error) {
            logger.error('RosterContext', 'Failed to load schedules', error as Error);
        }
    }, [activeSiteId, queryClient, scheduleQueryKey]);

    useEffect(() => {
        const handleRosterUpdate = () => {
            loadSchedules();
        };

        window.addEventListener('roster-updated', handleRosterUpdate);
        return () => window.removeEventListener('roster-updated', handleRosterUpdate);
    }, [activeSiteId, loadSchedules]);

    const addSchedule = async (schedule: StaffSchedule, user: string): Promise<boolean> => {
        try {
            const created = await schedulesService.create(schedule);
            const savedSchedule = created || schedule;
            queryClient.setQueryData<StaffSchedule[]>(scheduleQueryKey, current => {
                const list = current || [];
                const filtered = list.filter(s => s.id !== savedSchedule.id);
                return [...filtered, savedSchedule];
            });
            addNotification('success', 'Shift scheduled successfully');
            return true;
        } catch (error) {
            logger.error('RosterContext', 'Failed to schedule shift', error as Error);
            addNotification('alert', 'Failed to schedule shift');
            return false;
        }
    };

    const updateSchedule = async (id: string, updates: Partial<StaffSchedule>, user: string): Promise<boolean> => {
        try {
            const updated = await schedulesService.update(id, updates);
            queryClient.setQueryData<StaffSchedule[]>(scheduleQueryKey, current =>
                (current || []).map(s => (s.id === id ? { ...s, ...(updated || updates) } : s))
            );
            addNotification('success', 'Shift updated');
            return true;
        } catch (error) {
            logger.error('RosterContext', 'Failed to update shift', error as Error);
            addNotification('alert', 'Failed to update shift');
            return false;
        }
    };

    const deleteSchedule = async (id: string, user: string): Promise<boolean> => {
        try {
            await schedulesService.delete(id);
            queryClient.setQueryData<StaffSchedule[]>(scheduleQueryKey, current =>
                (current || []).filter(s => s.id !== id)
            );
            addNotification('success', 'Shift deleted');
            return true;
        } catch (error) {
            logger.error('RosterContext', 'Failed to delete shift', error as Error);
            addNotification('alert', 'Failed to delete shift');
            return false;
        }
    };

    return (
        <RosterContext.Provider value={{
            schedules,
            addSchedule,
            updateSchedule,
            deleteSchedule,
            refreshSchedules: loadSchedules
        }}>
            {children}
        </RosterContext.Provider>
    );
};

export const useRoster = () => {
    const context = useContext(RosterContext);
    if (context === undefined) {
        throw new Error('useRoster must be used within a RosterProvider');
    }
    return context;
};
