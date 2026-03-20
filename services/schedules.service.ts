import { supabase } from '../lib/supabase';
import type { StaffSchedule } from '../types';

export const schedulesService = {
    async getAll(siteId?: string): Promise<StaffSchedule[]> {
        let query = supabase.from('staff_schedules').select('*');
        if (siteId) query = query.eq('site_id', siteId);

        const { data, error } = await query.order('date', { ascending: true });
        if (error) {
            console.warn('staff_schedules table unreachable:', error.message);
            return [];
        }
        return (data || []).map(this._mapSchedule);
    },

    async create(schedule: Omit<StaffSchedule, 'id'>): Promise<StaffSchedule | null> {
        const dbSchedule = {
            site_id: schedule.siteId,
            employee_id: schedule.employeeId,
            employee_name: schedule.employeeName,
            date: schedule.date,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            role: schedule.role,
            notes: schedule.notes,
            status: schedule.status
        };

        const { data, error } = await supabase
            .from('staff_schedules')
            .insert(dbSchedule)
            .select()
            .single();

        if (error) throw error;
        return this._mapSchedule(data);
    },

    async update(id: string, updates: Partial<StaffSchedule>): Promise<StaffSchedule | null> {
        const dbUpdates: any = {};
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.startTime) dbUpdates.start_time = updates.startTime;
        if (updates.endTime) dbUpdates.end_time = updates.endTime;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.notes) dbUpdates.notes = updates.notes;
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from('staff_schedules')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this._mapSchedule(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('staff_schedules').delete().eq('id', id);
        if (error) throw error;
    },

    _mapSchedule(data: any): StaffSchedule {
        return {
            id: data.id,
            siteId: data.site_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            date: data.date,
            startTime: data.start_time,
            endTime: data.end_time,
            role: data.role,
            notes: data.notes,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
    }
};
