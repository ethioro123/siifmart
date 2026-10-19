import { supabase } from '../lib/supabase';
import type { StaffSchedule } from '../types';
import { logger } from '../utils/logger';

const SCHEDULE_COLUMNS = 'id, site_id, employee_id, employee_name, date, start_time, end_time, role, notes, status, region_code, country_code, created_at, updated_at';

export const schedulesService = {
    async getAll(siteId?: string, regionCode?: string, countryCode?: string): Promise<StaffSchedule[]> {
        let query = supabase.from('staff_schedules').select(SCHEDULE_COLUMNS);
        if (siteId) query = query.eq('site_id', siteId);
        if (regionCode) query = query.eq('region_code', regionCode);
        if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());

        const { data, error } = await query.order('date', { ascending: true });
        if (error) {
            logger.warn('schedules.service', 'staff_schedules table unreachable', { error: error.message });
            return [];
        }
        return (data || []).map(this._mapSchedule);
    },

    async create(schedule: Partial<StaffSchedule> & { siteId: string; employeeId: string; date: string }): Promise<StaffSchedule | null> {
        let regionCode = schedule.regionCode || (schedule as any).region_code;
        let countryCode = schedule.countryCode || (schedule as any).country_code;

        if ((!regionCode || !countryCode) && schedule.siteId) {
            try {
                const { data: site } = await supabase
                    .from('sites')
                    .select('region_code, country')
                    .eq('id', schedule.siteId)
                    .maybeSingle();
                if (site) {
                    if (!regionCode && site.region_code) regionCode = site.region_code;
                    if (!countryCode && site.country) countryCode = site.country;
                }
            } catch {
                // Non-blocking metadata resolution
            }
        }

        const scheduleId = schedule.id || crypto.randomUUID();

        const dbSchedule = {
            id: scheduleId,
            site_id: schedule.siteId,
            employee_id: schedule.employeeId,
            employee_name: schedule.employeeName || 'Staff Member',
            date: schedule.date,
            start_time: schedule.startTime || '08:00',
            end_time: schedule.endTime || '17:00',
            role: schedule.role || 'Staff',
            notes: schedule.notes || '',
            status: schedule.status || 'Scheduled',
            region_code: regionCode || null,
            country_code: countryCode ? countryCode.toUpperCase() : null
        };

        const { data, error } = await supabase
            .from('staff_schedules')
            .insert(dbSchedule)
            .select(SCHEDULE_COLUMNS)
            .single();

        if (error) throw error;
        return this._mapSchedule(data);
    },

    async update(id: string, updates: Partial<StaffSchedule>): Promise<StaffSchedule | null> {
        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        };
        if (updates.employeeId) dbUpdates.employee_id = updates.employeeId;
        if (updates.employeeName) dbUpdates.employee_name = updates.employeeName;
        if (updates.siteId) dbUpdates.site_id = updates.siteId;
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.startTime) dbUpdates.start_time = updates.startTime;
        if (updates.endTime) dbUpdates.end_time = updates.endTime;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.regionCode || (updates as any).region_code) {
            dbUpdates.region_code = updates.regionCode || (updates as any).region_code;
        }
        if (updates.countryCode || (updates as any).country_code) {
            dbUpdates.country_code = (updates.countryCode || (updates as any).country_code).toUpperCase();
        }

        const { data, error } = await supabase
            .from('staff_schedules')
            .update(dbUpdates)
            .eq('id', id)
            .select(SCHEDULE_COLUMNS)
            .single();

        if (error) throw error;
        return this._mapSchedule(data);
    },

    async getByDateRange(startDate: string, endDate: string, siteId?: string, regionCode?: string, countryCode?: string): Promise<StaffSchedule[]> {
        let query = supabase.from('staff_schedules')
            .select(SCHEDULE_COLUMNS)
            .gte('date', startDate)
            .lte('date', endDate);
        if (siteId && siteId !== 'All') {
            query = query.eq('site_id', siteId);
        }
        if (regionCode) {
            query = query.eq('region_code', regionCode);
        }
        if (countryCode) {
            query = query.eq('country_code', countryCode.toUpperCase());
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
            status: s.status || 'Scheduled',
            region_code: s.regionCode || (s as any).region_code || null,
            country_code: (s.countryCode || (s as any).country_code || '').toUpperCase() || null
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
            regionCode: data.region_code,
            region_code: data.region_code,
            countryCode: data.country_code,
            country_code: data.country_code,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
    }
};
