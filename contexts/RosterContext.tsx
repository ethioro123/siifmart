import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StaffSchedule } from '../types';
import { schedulesService } from '../services/supabase.service';
import { useData } from './DataContext';
import { logger } from '../utils/logger';

interface RosterContextType {
    schedules: StaffSchedule[];
    addSchedule: (schedule: StaffSchedule, user: string) => Promise<void>;
    updateSchedule: (id: string, updates: Partial<StaffSchedule>, user: string) => Promise<void>;
    deleteSchedule: (id: string, user: string) => Promise<void>;
    refreshSchedules: () => Promise<void>;
}

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export const RosterProvider = ({ children }: { children: ReactNode }) => {
    const { activeSite, addNotification } = useData();
    const activeSiteId = activeSite?.id;
    const queryClient = useQueryClient();
    const scheduleQueryKey = ['schedules', activeSiteId];
    const { data: schedules = [] } = useQuery({
        queryKey: scheduleQueryKey,
        queryFn: () => schedulesService.getAll(activeSiteId as string),
        enabled: Boolean(activeSiteId),
        staleTime: 5 * 60 * 1000
    });

    const loadSchedules = useCallback(async () => {
        if (!activeSiteId) return;
        try {
            await queryClient.invalidateQueries({ queryKey: scheduleQueryKey, exact: true });
        } catch (error) {
            logger.error('RosterContext', 'Failed to load schedules', error as Error);
        }
    }, [activeSiteId, queryClient]);

    useEffect(() => {
        const handleRosterUpdate = () => {
            loadSchedules();
        };

        window.addEventListener('roster-updated', handleRosterUpdate);
        return () => window.removeEventListener('roster-updated', handleRosterUpdate);
    }, [activeSiteId, loadSchedules]);

    const addSchedule = async (schedule: StaffSchedule, user: string) => {
        try {
            await schedulesService.create(schedule);
            queryClient.setQueryData<StaffSchedule[]>(scheduleQueryKey, current => [...(current || []), schedule]);
            addNotification('success', 'Shift added');
        } catch (error) {
            logger.error('RosterContext', 'caught error', error as Error);
            addNotification('alert', 'Failed to add shift');
        }
    };

    const updateSchedule = async (id: string, updates: Partial<StaffSchedule>, user: string) => {
        try {
            await schedulesService.update(id, updates);
            queryClient.setQueryData<StaffSchedule[]>(scheduleQueryKey, current =>
                (current || []).map(s => s.id === id ? { ...s, ...updates } : s)
            );
            addNotification('success', 'Shift updated');
        } catch (error) {
            logger.error('RosterContext', 'caught error', error as Error);
            addNotification('alert', 'Failed to update shift');
        }
    };

    const deleteSchedule = async (id: string, user: string) => {
        try {
            await schedulesService.delete(id);
            queryClient.setQueryData<StaffSchedule[]>(scheduleQueryKey, current =>
                (current || []).filter(s => s.id !== id)
            );
            addNotification('success', 'Shift deleted');
        } catch (error) {
            logger.error('RosterContext', 'caught error', error as Error);
            addNotification('alert', 'Failed to delete shift');
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
