import { supabase } from '../lib/supabase';
import type { StaffSchedule } from '../types';
import { logger } from '../utils/logger';

export const schedulesService = {
    async getAll(siteId?: string): Promise<StaffSchedule[]> {
        let query = supabase.from('staff_schedules').select('*');
        if (siteId) query = query.eq('site_id', siteId);

        const { data, error } = await query.order('date', { ascending: true });
        if (error) {
            logger.warn('schedules.service', 'staff_schedules table unreachable', { error: error.message });
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
            .select('id, site_id, employee_id, employee_name, date, start_time, end_time, role, notes, status, created_at, updated_at')
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
            .select('id, site_id, employee_id, employee_name, date, start_time, end_time, role, notes, status, created_at, updated_at')
            .single();

        if (error) throw error;
        return this._mapSchedule(data);
    },

    async getByDateRange(startDate: string, endDate: string, siteId?: string): Promise<StaffSchedule[]> {
        let query = supabase.from('staff_schedules')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate);
        if (siteId && siteId !== 'All') {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query.order('date', { ascending: true });
        if (error) {
            logger.warn('schedules.service', 'Failed to fetch schedules by date range', { error: error.message });
            return [];
        }
        return (data || []).map(this._mapSchedule);
    },

    async upsertBatch(schedules: (Partial<StaffSchedule> & { siteId: string; employeeId: string; date: string })[]): Promise<void> {
        if (!schedules.length) return;
        const dbRows = schedules.map(s => ({
            id: s.id || crypto.randomUUID(),
            site_id: s.siteId,
            employee_id: s.employeeId,
            employee_name: s.employeeName || 'Staff Member',
            date: s.date,
            start_time: s.startTime || '08:00',
            end_time: s.endTime || '16:00',
            role: s.role || 'Staff',
            notes: s.notes || '',
            status: s.status || 'Scheduled'
        }));

        const { error } = await supabase
            .from('staff_schedules')
            .upsert(dbRows, { onConflict: 'id' });

        if (error) throw error;
    },

    async deleteByEmployeeAndDate(employeeId: string, date: string): Promise<void> {
        const { error } = await supabase
            .from('staff_schedules')
            .delete()
            .eq('employee_id', employeeId)
            .eq('date', date);
        if (error) throw error;
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
