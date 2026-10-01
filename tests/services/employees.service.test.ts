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

    it('generates next employee code above baseline 39 when DB has codes up to 39', async () => {
        const mockSelect = vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                    data: [
                        { code: 'SIIF-0039' },
                        { code: 'SIIF-0038' },
                        { code: 'SIIF-0037' }
                    ],
                    error: null
                })
            })
        });

        (supabase.from as any).mockReturnValue({
            select: mockSelect
        });

        const nextCode = await employeesService.getNextCode();
        expect(nextCode).toBe('SIIF-0040');
    });

    it('falls back to at least SIIF-0040 when DB query returns empty data', async () => {
        const mockSelect = vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                })
            })
        });

        (supabase.from as any).mockReturnValue({
            select: mockSelect
        });

        const nextCode = await employeesService.getNextCode();
        expect(nextCode).toBe('SIIF-0040');
    });

    it('retries with incremented code if 23505 unique constraint violation occurs on employees_code_key', async () => {
        let callCount = 0;

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
                                data: [{ code: 'SIIF-0039' }],
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
            code: 'SIIF-0039',
            siteId: 'site-ke-1',
            name: 'New Officer',
            role: 'cashier',
            email: 'officer@siifmart.com',
            phone: '+254700000000',
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
        expect(result.code).toBe('SIIF-0040');
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
