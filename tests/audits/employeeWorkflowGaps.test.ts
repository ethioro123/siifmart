// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), update: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: mock }));
vi.mock('../../services/employees.service', () => ({ employeesService: { update: mock.update } }));
vi.mock('../../utils/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
import { attendanceService } from '../../services/attendance.service';
import { employeeChangesService } from '../../services/employee-changes.service';
import { payrollRunsService } from '../../services/payroll-runs.service';
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
it('propagates rejected clock-in without a local attendance record', async () => {
 mock.rpc.mockResolvedValue({ data: null, error: new Error('Clock-in refused') });
 await expect(attendanceService.clockIn({ country_code: 'ET', site_id: 'warehouse', employee_id: 'worker', employee_name: 'Audit worker' })).rejects.toThrow('Clock-in refused');
 expect(localStorage.getItem('siifmart_attendance_backup')).toBeNull();
 expect(mock.from).not.toHaveBeenCalled();
});
it('never substitutes another site cached attendance for a failed scoped query', async () => {
 localStorage.setItem('siifmart_attendance_backup', JSON.stringify([{ site_id: 'other-site' }]));
 mock.from.mockImplementation(() => { throw new Error('Network unavailable'); });
 await expect(attendanceService.fetchAttendance('ET', undefined, 'warehouse')).rejects.toThrow('Network unavailable');
});
it('clocks out using the server session and does not submit invented hours or client time', async () => {
 mock.from.mockReturnValue({ select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'session', employee_id: 'worker', site_id: 'warehouse', country_code: 'ET' }, error: null }) }) }) });
 mock.rpc.mockResolvedValue({ data: { id: 'session', clock_in: '2026-11-06T06:00:00Z', hours_worked: 0 }, error: null });
 await attendanceService.clockOut('session', '2099-01-01');
 expect(mock.rpc).toHaveBeenCalledWith('record_employee_attendance', { p_employee: 'worker', p_site: 'warehouse', p_country: 'ET', p_record: 'session' });
});
it('employee approval failure never applies a separate employee snapshot', async () => {
 mock.rpc.mockResolvedValue({ data: null, error: new Error('Review transaction refused') });
 await expect(employeeChangesService.approve('request', 'Untrusted name', 'group_ceo')).rejects.toThrow('Review transaction refused');
 expect(mock.update).not.toHaveBeenCalled(); expect(mock.from).not.toHaveBeenCalled();
});
it('propagates rejection of completed/rejected request replay', async () => {
 mock.rpc.mockResolvedValue({ data: null, error: new Error('Pending proposal required') });
 await expect(employeeChangesService.approve('request', 'HR', 'country_hr_director')).rejects.toThrow('Pending proposal required');
 expect(mock.rpc).toHaveBeenCalledWith('review_employee_change', { p_request: 'request', p_approve: true, p_notes: 'Employee changes reviewed' });
});
it('selects the requested payroll month on the server and returns no unrelated batch', async () => {
 const query = { eq: vi.fn(), neq: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(async () => ({ data: null, error: null })) };
 query.eq.mockReturnValue(query); query.neq.mockReturnValue(query); query.order.mockReturnValue(query); query.limit.mockReturnValue(query); mock.from.mockReturnValue({ select: () => query });
 expect(await payrollRunsService.getLatestRun('warehouse', 'ET', 'November 2026')).toBeNull();
 expect(query.eq).toHaveBeenCalledWith('period', 'November 2026'); expect(query.limit).toHaveBeenCalledWith(1);
});
