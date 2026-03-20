import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StaffSchedule } from '../types';
import { schedulesService } from '../services/supabase.service';
import { useData } from './DataContext';

interface RosterContextType {
    schedules: StaffSchedule[];
    addSchedule: (schedule: StaffSchedule, user: string) => Promise<void>;
    updateSchedule: (id: string, updates: Partial<StaffSchedule>, user: string) => Promise<void>;
    deleteSchedule: (id: string, user: string) => Promise<void>;
}

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export const RosterProvider = ({ children }: { children: ReactNode }) => {
    const { activeSite, addNotification } = useData();
    const activeSiteId = activeSite?.id;
    const [schedules, setSchedules] = useState<StaffSchedule[]>([]);

    useEffect(() => {
        if (!activeSiteId) return;

        const loadSchedules = async () => {
            try {
                const data = await schedulesService.getAll(activeSiteId);
                setSchedules(data);
            } catch (error) {
                console.error("Failed to load schedules", error);
            }
        };

        loadSchedules();
    }, [activeSiteId]);

    const addSchedule = async (schedule: StaffSchedule, user: string) => {
        try {
            await schedulesService.create(schedule);
            setSchedules(prev => [...prev, schedule]);
            addNotification('success', 'Shift added');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to add shift');
        }
    };

    const updateSchedule = async (id: string, updates: Partial<StaffSchedule>, user: string) => {
        try {
            await schedulesService.update(id, updates);
            setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            addNotification('success', 'Shift updated');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to update shift');
        }
    };

    const deleteSchedule = async (id: string, user: string) => {
        try {
            await schedulesService.delete(id);
            setSchedules(prev => prev.filter(s => s.id !== id));
            addNotification('success', 'Shift deleted');
        } catch (error) {
            console.error(error);
            addNotification('alert', 'Failed to delete shift');
        }
    };

    return (
        <RosterContext.Provider value={{
            schedules,
            addSchedule,
            updateSchedule,
            deleteSchedule
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
