import { describe, it, expect, vi, beforeEach } from 'vitest';
import { schedulesService } from '../../services/schedules.service';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
vi.mock('../../lib/supabase', () => {
    const mockFrom = vi.fn();
    return {
        supabase: {
            from: mockFrom
        },
        isSupabaseConfigured: () => true
    };
});

describe('schedulesService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('maps database schedule row to camelCase StaffSchedule object', () => {
        const rawDbRow = {
            id: 'uuid-1',
            site_id: 'site-1',
            employee_id: 'emp-1',
            employee_name: 'John Doe',
            date: '2026-10-12',
            start_time: '08:00',
            end_time: '16:00',
            role: 'Cashier',
            notes: 'Register 1',
            status: 'Scheduled',
            created_at: '2026-10-10T10:00:00Z',
            updated_at: '2026-10-10T10:00:00Z'
        };

        const mapped = schedulesService._mapSchedule(rawDbRow);
        expect(mapped).toEqual({
            id: 'uuid-1',
            siteId: 'site-1',
            employeeId: 'emp-1',
            employeeName: 'John Doe',
            date: '2026-10-12',
            startTime: '08:00',
            endTime: '16:00',
            role: 'Cashier',
            notes: 'Register 1',
            status: 'Scheduled',
            created_at: '2026-10-10T10:00:00Z',
            updated_at: '2026-10-10T10:00:00Z'
        });
    });

    it('calls getByDateRange with proper gte and lte filters', async () => {
        const mockOrder = vi.fn().mockResolvedValue({
            data: [
                {
                    id: 'uuid-1',
                    site_id: 'site-1',
                    employee_id: 'emp-1',
                    employee_name: 'John Doe',
                    date: '2026-10-12',
                    start_time: '08:00',
                    end_time: '16:00',
                    role: 'Cashier',
                    notes: '',
                    status: 'Scheduled'
                }
            ],
            error: null
        });

        const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
        const mockLte = vi.fn().mockReturnValue({ eq: mockEq, order: mockOrder });
        const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
        const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });

        (supabase.from as any).mockReturnValue({ select: mockSelect });

        const result = await schedulesService.getByDateRange('2026-10-12', '2026-10-18', 'site-1');

        expect(supabase.from).toHaveBeenCalledWith('staff_schedules');
        expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id, site_id'));
        expect(mockGte).toHaveBeenCalledWith('date', '2026-10-12');
        expect(mockLte).toHaveBeenCalledWith('date', '2026-10-18');
        expect(mockEq).toHaveBeenCalledWith('site_id', 'site-1');
        expect(result).toHaveLength(1);
        expect(result[0].employeeName).toBe('John Doe');
    });

    it('create preserves client ID and returns mapped schedule', async () => {
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                id: 'custom-uuid-1',
                site_id: 'site-1',
                employee_id: 'emp-1',
                employee_name: 'John Doe',
                date: '2026-10-12',
                start_time: '08:00',
                end_time: '17:00',
                role: 'Cashier',
                notes: 'Morning shift',
                status: 'Scheduled',
                country_code: 'ET',
                region_code: 'ET-ADD'
            },
            error: null
        });
        const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
        const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
        (supabase.from as any).mockReturnValue({ insert: mockInsert });

        const created = await schedulesService.create({
            id: 'custom-uuid-1',
            siteId: 'site-1',
            employeeId: 'emp-1',
            employeeName: 'John Doe',
            date: '2026-10-12',
            startTime: '08:00',
            endTime: '17:00',
            role: 'Cashier',
            notes: 'Morning shift',
            status: 'Scheduled',
            countryCode: 'ET',
            regionCode: 'ET-ADD'
        });

        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            id: 'custom-uuid-1',
            site_id: 'site-1',
            employee_id: 'emp-1',
            employee_name: 'John Doe',
            country_code: 'ET'
        }));
        expect(created?.id).toBe('custom-uuid-1');
    });

    it('update maps employee_id and employee_name to dbUpdates', async () => {
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                id: 'sched-1',
                site_id: 'site-1',
                employee_id: 'emp-2',
                employee_name: 'Jane Smith',
                date: '2026-10-12',
                start_time: '09:00',
                end_time: '18:00',
                role: 'Supervisor',
                status: 'Scheduled'
            },
            error: null
        });
        const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
        const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
        (supabase.from as any).mockReturnValue({ update: mockUpdate });

        const updated = await schedulesService.update('sched-1', {
            employeeId: 'emp-2',
            employeeName: 'Jane Smith',
            role: 'Supervisor'
        });

        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            employee_id: 'emp-2',
            employee_name: 'Jane Smith',
            role: 'Supervisor'
        }));
        expect(updated?.employeeId).toBe('emp-2');
    });

    it('upsertBatch sends normalized payload with onConflict id', async () => {
        const mockUpsert = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ upsert: mockUpsert });

        await schedulesService.upsertBatch([
            {
                id: 'uuid-1',
                siteId: 'site-1',
                employeeId: 'emp-1',
                employeeName: 'John',
                date: '2026-10-12',
                startTime: '08:00',
                endTime: '16:00',
                role: 'Cashier',
                notes: 'Morning shift',
                status: 'Confirmed'
            }
        ]);

        expect(supabase.from).toHaveBeenCalledWith('staff_schedules');
        expect(mockUpsert).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    id: 'uuid-1',
                    site_id: 'site-1',
                    employee_id: 'emp-1',
                    employee_name: 'John',
                    date: '2026-10-12',
                    start_time: '08:00',
                    end_time: '16:00',
                    role: 'Cashier',
                    notes: 'Morning shift',
                    status: 'Confirmed'
                })
            ],
            { onConflict: 'id' }
        );
    });

    it('deleteByEmployeeAndDate filters by employee_id and date', async () => {
        const mockEqDate = vi.fn().mockResolvedValue({ error: null });
        const mockEqEmp = vi.fn().mockReturnValue({ eq: mockEqDate });
        const mockDelete = vi.fn().mockReturnValue({ eq: mockEqEmp });

        (supabase.from as any).mockReturnValue({ delete: mockDelete });

        await schedulesService.deleteByEmployeeAndDate('emp-1', '2026-10-12');

        expect(supabase.from).toHaveBeenCalledWith('staff_schedules');
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEqEmp).toHaveBeenCalledWith('employee_id', 'emp-1');
        expect(mockEqDate).toHaveBeenCalledWith('date', '2026-10-12');
    });
});
