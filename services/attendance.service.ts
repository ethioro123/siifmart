import { supabase } from '../lib/supabase';
import type { EmployeeAttendanceRecord } from '../types/hr-zero-trust';
const columns = 'id,country_code,site_id,employee_id,employee_name,date,clock_in,clock_out,status,hours_worked,device_info,gps_coordinates,verified_by,notes,created_at,updated_at';
if (typeof localStorage !== 'undefined') { try { localStorage.removeItem('siifmart_attendance_backup'); } catch { /* Legacy cache is never used. */ } }
function confirmed(value: unknown): EmployeeAttendanceRecord {
    if (!value || typeof value !== 'object' || !('id' in value) || !('clock_in' in value)) throw new Error('Attendance save was not confirmed');
    return value as EmployeeAttendanceRecord;
}
export const attendanceService = {
    async fetchAttendance(countryCode = 'ET', employeeId?: string, siteId?: string, limit = 25, offset = 0): Promise<EmployeeAttendanceRecord[]> {
        let query = supabase.from('employee_attendance').select(columns).eq('country_code', countryCode.toUpperCase());
        if (employeeId) query = query.eq('employee_id', employeeId);
        if (siteId && siteId !== 'All') query = query.eq('site_id', siteId);
        const { data, error } = await query.order('date', { ascending: false }).order('id').range(offset, offset + Math.min(Math.max(limit, 1), 100) - 1);
        if (error) throw error;
        return (data || []).map(confirmed);
    },
    async clockIn(input: { country_code: string; site_id: string; employee_id: string; employee_name: string; gps_coordinates?: string; device_info?: string; isLate?: boolean }): Promise<EmployeeAttendanceRecord> {
        const { data, error } = await supabase.rpc('record_employee_attendance', { p_employee: input.employee_id, p_site: input.site_id, p_country: input.country_code.toUpperCase(), p_record: null });
        if (error) throw error;
        return confirmed(data);
    },
    async clockOut(recordId: string, _untrustedClockOutTime?: string): Promise<EmployeeAttendanceRecord> {
        const { data: session, error: readError } = await supabase.from('employee_attendance').select('id,employee_id,site_id,country_code').eq('id', recordId).single();
        if (readError) throw readError;
        if (!session?.id) throw new Error('Attendance session unavailable');
        const { data, error } = await supabase.rpc('record_employee_attendance', { p_employee: session.employee_id, p_site: session.site_id, p_country: session.country_code, p_record: session.id });
        if (error) throw error;
        return confirmed(data);
    },
    calculateDynamicAttendanceRate(records: EmployeeAttendanceRecord[]): number {
        if (!records.length) return 0;
        const present = records.filter(r => r.status === 'Present' || r.status === 'On-Leave').length;
        const late = records.filter(r => r.status === 'Late').length * 0.8;
        return Math.min(100, Math.round((present + late) / records.length * 100));
    }
};
