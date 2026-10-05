import { supabase } from '../lib/supabase';
import type { EmployeeAttendanceRecord, AttendanceStatus } from '../types/hr-zero-trust';
import { systemLogsService } from './system-logs.service';
import { logger } from '../utils/logger';

const LOCAL_STORAGE_KEY = 'siifmart_attendance_backup';

let inMemoryAttendance: EmployeeAttendanceRecord[] = [];

const getLocalBackup = (): EmployeeAttendanceRecord[] => {
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        }
    } catch {
        // Fallback
    }
    return inMemoryAttendance;
};

const saveLocalBackup = (records: EmployeeAttendanceRecord[]): void => {
    const map = new Map<string, EmployeeAttendanceRecord>();
    for (const r of inMemoryAttendance) map.set(r.id, r);
    for (const r of records) map.set(r.id, r);
    inMemoryAttendance = Array.from(map.values());
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryAttendance));
        }
    } catch {
        // Safe
    }
};

const mapDBToAttendance = (row: any): EmployeeAttendanceRecord => ({
    id: row.id,
    country_code: (row.country_code || 'ET').toUpperCase(),
    site_id: row.site_id,
    employee_id: row.employee_id,
    employee_name: row.employee_name,
    date: row.date,
    clock_in: row.clock_in,
    clock_out: row.clock_out || undefined,
    status: row.status as AttendanceStatus,
    hours_worked: Number(row.hours_worked) || 0,
    device_info: row.device_info || undefined,
    gps_coordinates: row.gps_coordinates || undefined,
    verified_by: row.verified_by || undefined,
    notes: row.notes || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
});

export const attendanceService = {
    async fetchAttendance(countryCode: string = 'ET', employeeId?: string, siteId?: string): Promise<EmployeeAttendanceRecord[]> {
        const country = (countryCode || 'ET').toUpperCase();
        try {
            let query = supabase
                .from('employee_attendance')
                .select('*')
                .eq('country_code', country)
                .order('date', { ascending: false });

            if (employeeId) query = query.eq('employee_id', employeeId);
            if (siteId && siteId !== 'All') query = query.eq('site_id', siteId);

            const { data, error } = await query;
            if (error) {
                logger.warn('attendanceService', 'Supabase fetch error, using local fallback', { message: error.message });
                return getLocalBackup().filter(a => 
                    (a.country_code || 'ET').toUpperCase() === country &&
                    (!employeeId || a.employee_id === employeeId) &&
                    (!siteId || siteId === 'All' || a.site_id === siteId)
                );
            }

            const mapped = (data || []).map(mapDBToAttendance);
            saveLocalBackup(mapped);
            return mapped;
        } catch (err) {
            logger.warn('attendanceService', 'Exception fetching attendance', { error: String(err) });
            return getLocalBackup().filter(a => 
                (a.country_code || 'ET').toUpperCase() === country &&
                (!employeeId || a.employee_id === employeeId)
            );
        }
    },

    async clockIn(data: {
        country_code: string;
        site_id: string;
        employee_id: string;
        employee_name: string;
        gps_coordinates?: string;
        device_info?: string;
        isLate?: boolean;
    }): Promise<EmployeeAttendanceRecord> {
        const country = (data.country_code || 'ET').toUpperCase();
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const status: AttendanceStatus = data.isLate ? 'Late' : 'Present';

        const newRecord: EmployeeAttendanceRecord = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            country_code: country,
            site_id: data.site_id,
            employee_id: data.employee_id,
            employee_name: data.employee_name,
            date: todayStr,
            clock_in: now.toISOString(),
            status,
            hours_worked: 0,
            gps_coordinates: data.gps_coordinates,
            device_info: data.device_info,
            created_at: now.toISOString()
        };

        try {
            const { data: dbData, error } = await supabase
                .from('employee_attendance')
                .insert([{
                    id: newRecord.id,
                    country_code: country,
                    site_id: newRecord.site_id,
                    employee_id: newRecord.employee_id,
                    employee_name: newRecord.employee_name,
                    date: newRecord.date,
                    clock_in: newRecord.clock_in,
                    status: newRecord.status,
                    hours_worked: 0,
                    gps_coordinates: newRecord.gps_coordinates,
                    device_info: newRecord.device_info
                }])
                .select()
                .single();

            if (error) {
                logger.warn('attendanceService', 'Supabase clock-in insert error, saved locally', { message: error.message });
                saveLocalBackup([newRecord]);
            } else if (dbData) {
                saveLocalBackup([mapDBToAttendance(dbData)]);
            }
        } catch (err) {
            logger.warn('attendanceService', 'Exception in clockIn, saved locally', { error: String(err) });
            saveLocalBackup([newRecord]);
        }

        // Synaptic Neural Mesh: Audit log
        try {
            await systemLogsService.create({
                user_name: data.employee_name,
                action: 'EMPLOYEE_CLOCK_IN',
                module: 'Human Resources',
                details: JSON.stringify({
                    attendanceId: newRecord.id,
                    employeeId: data.employee_id,
                    siteId: data.site_id,
                    status,
                    time: newRecord.clock_in,
                    gps: data.gps_coordinates
                })
            });
        } catch (logErr) {
            logger.warn('attendanceService', 'Audit log failed', { error: String(logErr) });
        }

        return newRecord;
    },

    async clockOut(recordId: string, clockOutTime?: string): Promise<EmployeeAttendanceRecord | null> {
        const outTime = clockOutTime || new Date().toISOString();
        const records = getLocalBackup();
        const existing = records.find(r => r.id === recordId);
        
        let hoursWorked = 8.0;
        if (existing?.clock_in) {
            const start = new Date(existing.clock_in).getTime();
            const end = new Date(outTime).getTime();
            hoursWorked = parseFloat((Math.max(0, end - start) / (1000 * 60 * 60)).toFixed(2));
        }

        try {
            const { error } = await supabase
                .from('employee_attendance')
                .update({
                    clock_out: outTime,
                    hours_worked: hoursWorked,
                    updated_at: new Date().toISOString()
                })
                .eq('id', recordId);

            if (error) {
                logger.warn('attendanceService', 'Supabase clock-out update error', { message: error.message });
            }
        } catch (err) {
            logger.warn('attendanceService', 'Exception in clockOut', { error: String(err) });
        }

        let updatedRecord: EmployeeAttendanceRecord | null = null;
        const updatedList = records.map(r => {
            if (r.id === recordId) {
                updatedRecord = {
                    ...r,
                    clock_out: outTime,
                    hours_worked: hoursWorked,
                    updated_at: new Date().toISOString()
                };
                return updatedRecord;
            }
            return r;
        });
        saveLocalBackup(updatedList);

        return updatedRecord;
    },

    /**
     * Dynamically calculates true attendance rate from recorded sessions
     */
    calculateDynamicAttendanceRate(records: EmployeeAttendanceRecord[]): number {
        if (!records || records.length === 0) return 100;
        const total = records.length;
        const successful = records.filter(r => r.status === 'Present' || r.status === 'On-Leave').length;
        const late = records.filter(r => r.status === 'Late').length * 0.8; // Partial credit for late arrival
        return Math.min(100, Math.round(((successful + late) / total) * 100));
    }
};
