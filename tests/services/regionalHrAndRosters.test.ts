import { describe, it, expect, vi, beforeEach } from 'vitest';
import { schedulesService } from '../../services/schedules.service';
import { employeesService } from '../../services/employees.service';
import { supabase } from '../../lib/supabase';

describe('Step 8: Regional HR & Roster Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('schedulesService.getByDateRange - Regional & Country Scoping', () => {
        it('queries staff schedules filtered by regionCode and countryCode', async () => {
            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                    data: [
                        {
                            id: 'sch-mombasa-1',
                            site_id: 'site-mombasa-store',
                            employee_id: 'emp-101',
                            employee_name: 'Mombasa Cashier',
                            date: '2026-10-12',
                            start_time: '08:00',
                            end_time: '16:00',
                            role: 'cashier',
                            region_code: 'ke_mombasa',
                            country_code: 'KE',
                            status: 'Scheduled'
                        }
                    ],
                    error: null
                })
            };

            vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

            const schedules = await schedulesService.getByDateRange(
                '2026-10-12',
                '2026-10-18',
                undefined,
                'ke_mombasa',
                'KE'
            );

            expect(mockQuery.gte).toHaveBeenCalledWith('date', '2026-10-12');
            expect(mockQuery.lte).toHaveBeenCalledWith('date', '2026-10-18');
            expect(mockQuery.eq).toHaveBeenCalledWith('region_code', 'ke_mombasa');
            expect(mockQuery.eq).toHaveBeenCalledWith('country_code', 'KE');
            expect(schedules.length).toBe(1);
            expect(schedules[0].regionCode).toBe('ke_mombasa');
            expect(schedules[0].countryCode).toBe('KE');
        });

        it('auto-resolves region_code and country_code from site when creating schedule if omitted', async () => {
            const insertMock = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {
                            id: 'sch-new',
                            site_id: 'site-dire-hub',
                            employee_id: 'emp-202',
                            employee_name: 'Dire Forklift Operator',
                            date: '2026-10-13',
                            start_time: '06:00',
                            end_time: '14:00',
                            role: 'forklift_operator',
                            region_code: 'et_dire',
                            country_code: 'ET',
                            status: 'Scheduled'
                        },
                        error: null
                    })
                })
            });

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                if (table === 'sites') {
                    return {
                        select: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                maybeSingle: vi.fn().mockResolvedValue({
                                    data: { region_code: 'et_dire', country: 'ET' },
                                    error: null
                                })
                            })
                        })
                    } as any;
                }
                if (table === 'staff_schedules') {
                    return { insert: insertMock } as any;
                }
                return {} as any;
            });

            const result = await schedulesService.create({
                siteId: 'site-dire-hub',
                employeeId: 'emp-202',
                employeeName: 'Dire Forklift Operator',
                date: '2026-10-13',
                startTime: '06:00',
                endTime: '14:00',
                role: 'forklift_operator',
                status: 'Scheduled'
            });

            expect(result?.regionCode).toBe('et_dire');
            expect(result?.countryCode).toBe('ET');
            expect(insertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    region_code: 'et_dire',
                    country_code: 'ET'
                })
            );
        });

        it('upsertBatch attaches region_code and country_code to bulk shift rows', async () => {
            const upsertMock = vi.fn().mockResolvedValue({ error: null });

            vi.spyOn(supabase, 'from').mockReturnValue({
                upsert: upsertMock
            } as any);

            await schedulesService.upsertBatch([
                {
                    siteId: 'site-1',
                    employeeId: 'emp-1',
                    date: '2026-10-14',
                    regionCode: 'ke_nairobi',
                    countryCode: 'KE'
                }
            ]);

            expect(upsertMock).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        region_code: 'ke_nairobi',
                        country_code: 'KE'
                    })
                ]),
                { onConflict: 'id' }
            );
        });
    });

    describe('employeesService.getPaginated - Regional Directory Filtering', () => {
        it('filters employee directory queries by regionCode', async () => {
            const mockQuery: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                then: (resolve: any) => Promise.resolve({
                    data: [
                        { id: 'emp-reg-1', role: 'regional_operations_manager', name: 'Mombasa RM' }
                    ],
                    error: null,
                    count: 1
                }).then(resolve)
            };

            vi.spyOn(supabase, 'from').mockReturnValue(mockQuery as any);

            await employeesService.getPaginated(
                undefined,
                1,
                20,
                '',
                {
                    country: 'KE' as any,
                    countrySiteIds: ['site-mombasa-1', 'site-mombasa-2'],
                    regionCode: 'ke_mombasa'
                }
            );

            expect(mockQuery.eq).toHaveBeenCalledWith('region_code', 'ke_mombasa');
        });
    });
});
