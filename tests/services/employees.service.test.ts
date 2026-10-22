import { describe, it, expect, vi, beforeEach } from 'vitest';
import { employeesService } from '../../services/employees.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn()
    }
}));

vi.mock('../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('employeesService - Code Generation & Conflict Resilience', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('generates next employee code above baseline 39 when DB has codes up to 39 for Ethiopia', async () => {
        (supabase.rpc as any).mockResolvedValue({
            data: 'ET-SIIF0040',
            error: null
        });

        const nextCode = await employeesService.getNextCode('ET');
        expect(nextCode).toBe('ET-SIIF0040');
        expect(supabase.rpc).toHaveBeenCalledWith('reserve_next_employee_code', {
            p_country_code: 'ET'
        });
    });

    it('falls back to at least ET-SIIF0040 when DB query returns empty data for Ethiopia', async () => {
        (supabase.rpc as any).mockResolvedValue({
            data: 'ET-SIIF0040',
            error: null
        });

        const nextCode = await employeesService.getNextCode();
        expect(nextCode).toBe('ET-SIIF0040');
        expect(supabase.rpc).toHaveBeenCalledWith('reserve_next_employee_code', {
            p_country_code: 'ET'
        });
    });

    it('generates KE-SIIF0001 for fresh Kenya tenant with zero cross-country bleed', async () => {
        (supabase.rpc as any).mockResolvedValue({
            data: 'KE-SIIF0001',
            error: null
        });

        const nextCode = await employeesService.getNextCode('KE');
        expect(nextCode).toBe('KE-SIIF0001');
        expect(supabase.rpc).toHaveBeenCalledWith('reserve_next_employee_code', {
            p_country_code: 'KE'
        });
    });

    it('increments Kenya sequence when existing Kenyan workers are present', async () => {
        (supabase.rpc as any).mockResolvedValue({
            data: 'KE-SIIF0044',
            error: null
        });

        const nextCode = await employeesService.getNextCode('KE');
        expect(nextCode).toBe('KE-SIIF0044');
        expect(supabase.rpc).toHaveBeenCalledWith('reserve_next_employee_code', {
            p_country_code: 'KE'
        });
    });

    it('retries with incremented code if 23505 unique constraint violation occurs on employees_code_key', async () => {
        let callCount = 0;
        (supabase.rpc as any).mockResolvedValue({
            data: 'ET-SIIF0040',
            error: null
        });

        (supabase.from as any).mockImplementation((table: string) => {
            if (table === 'employees') {
                return {
                    insert: vi.fn().mockImplementation((payload: any) => ({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockImplementation(async () => {
                                callCount++;
                                if (callCount === 1) {
                                    return {
                                        data: null,
                                        error: {
                                            code: '23505',
                                            message: 'duplicate key value violates unique constraint "employees_code_key"'
                                        }
                                    };
                                }
                                return {
                                    data: {
                                        ...payload,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString()
                                    },
                                    error: null
                                };
                            })
                        })
                    })),
                    select: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                            limit: vi.fn().mockResolvedValue({
                                data: [{ code: 'ET-SIIF0039' }],
                                error: null
                            })
                        })
                    })
                };
            }
            return {};
        });

        const result = await employeesService.create({
            id: '6c38f106-4590-4ff3-ae68-b9ab657fff8e',
            code: 'ET-SIIF0039',
            siteId: 'site-et-1',
            name: 'New Officer',
            role: 'cashier',
            email: 'officer@siifmart.com',
            phone: '+251911000039',
            status: 'Active',
            joinDate: '2026-09-30',
            department: 'Retail Operations',
            avatar: 'https://avatar.com/test.png',
            performanceScore: 100,
            specialization: 'Generalist',
            salary: 35000,
            badges: ['New Recruit'],
            attendanceRate: 100
        });

        expect(callCount).toBe(2);
        expect(result.code).toBe('ET-SIIF0040');
    });

    it('rejects employee creation when workplace location (siteId) is missing or empty', async () => {
        await expect(employeesService.create({
            id: 'test-id-no-site',
            code: 'SIIF-0041',
            siteId: '',
            name: 'No Site Employee',
            role: 'cashier',
            email: 'nosite@siifmart.com',
            phone: '+254700000001',
            status: 'Active',
            joinDate: '2026-09-30',
            department: 'Retail Operations',
            avatar: '',
            performanceScore: 100,
            specialization: 'Generalist',
            salary: 30000,
            badges: ['New Recruit'],
            attendanceRate: 100
        })).rejects.toThrow('Workplace location is mandatory');
    });
});

describe('country employee directory excludes global leadership', () => {
    beforeEach(() => vi.clearAllMocks());

    it.each(['ET', 'KE'] as const)('uses only assigned country facilities for %s', async (country) => {
        const query = {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
            or: vi.fn(),
            is: vi.fn()
        };
        vi.mocked(supabase.from).mockReturnValue(query as unknown as ReturnType<typeof supabase.from>);
        const siteIds = [`${country}-HQ`, `${country}-REGION`];
        const result = await employeesService.getPaginated('All', 1, 50, '', { country, countrySiteIds: siteIds });
        expect(query.in).toHaveBeenCalledWith('site_id', siteIds);
        expect(query.or).not.toHaveBeenCalled();
        expect(query.is).not.toHaveBeenCalled();
        expect(result).toEqual({ data: [], count: 0 });
    });

    it.each(['ET', 'KE'] as const)('returns no country employees without authorized facilities for %s', async (country) => {
        const query = { select: vi.fn().mockReturnThis(), is: vi.fn(), or: vi.fn() };
        vi.mocked(supabase.from).mockReturnValue(query as unknown as ReturnType<typeof supabase.from>);
        const result = await employeesService.getPaginated('All', 1, 50, '', { country, countrySiteIds: [] });
        expect(result).toEqual({ data: [], count: 0 });
        expect(query.is).not.toHaveBeenCalled();
        expect(query.or).not.toHaveBeenCalled();
    });
});
