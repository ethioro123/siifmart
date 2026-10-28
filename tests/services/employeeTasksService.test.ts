import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tasksService } from '../../services/tasks.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn()
        }
    }
}));

describe('tasksService with required site scope', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates task with explicitly provided siteId', async () => {
        let insertedPayload: any = null;
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                id: 'task-101',
                title: 'Inspect aisle 3',
                description: 'Check stock levels',
                assigned_to: 'emp-1',
                status: 'Pending',
                priority: 'High',
                due_date: '2026-10-31',
                site_id: 'site-bole',
                created_by: 'manager-1',
                region_code: 'ET-AA',
                task_type: 'GENERAL'
            },
            error: null
        });

        const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
        const mockInsert = vi.fn().mockImplementation((payload) => {
            insertedPayload = payload;
            return { select: mockSelect };
        });

        vi.mocked(supabase.from).mockReturnValue({
            insert: mockInsert
        } as any);

        const result = await tasksService.create({
            title: 'Inspect aisle 3',
            description: 'Check stock levels',
            assignedTo: 'emp-1',
            status: 'Pending',
            priority: 'High',
            dueDate: '2026-10-31',
            siteId: 'site-bole',
            regionCode: 'ET-AA',
            createdBy: 'manager-1'
        });

        expect(insertedPayload).toBeDefined();
        expect(insertedPayload.site_id).toBe('site-bole');
        expect(insertedPayload.region_code).toBe('ET-AA');
        expect(result).toBeDefined();
        expect(result?.id).toBe('task-101');
        expect(result?.siteId).toBe('site-bole');
    });

    it('resolves site_id from assigned employee when siteId is omitted', async () => {
        let insertedPayload: any = null;

        // Mock employee lookup
        const mockEmpMaybeSingle = vi.fn().mockResolvedValue({
            data: { site_id: 'site-piassa', region_code: 'ET-AA' },
            error: null
        });
        const mockEmpSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                maybeSingle: mockEmpMaybeSingle
            })
        });

        // Mock task insert
        const mockTaskSingle = vi.fn().mockResolvedValue({
            data: {
                id: 'task-102',
                title: 'Inventory count',
                description: 'Manual Assignment',
                assigned_to: 'emp-2',
                status: 'Pending',
                priority: 'Medium',
                due_date: '2026-11-01',
                site_id: 'site-piassa',
                created_by: 'manager-2',
                region_code: 'ET-AA',
                task_type: 'GENERAL'
            },
            error: null
        });
        const mockTaskSelect = vi.fn().mockReturnValue({ single: mockTaskSingle });
        const mockTaskInsert = vi.fn().mockImplementation((payload) => {
            insertedPayload = payload;
            return { select: mockTaskSelect };
        });

        vi.mocked(supabase.from).mockImplementation((table: string) => {
            if (table === 'employees') {
                return { select: mockEmpSelect } as any;
            }
            if (table === 'employee_tasks') {
                return { insert: mockTaskInsert } as any;
            }
            return {} as any;
        });

        const result = await tasksService.create({
            title: 'Inventory count',
            description: 'Manual Assignment',
            assignedTo: 'emp-2',
            status: 'Pending',
            priority: 'Medium',
            dueDate: '2026-11-01',
            createdBy: 'manager-2'
        });

        expect(insertedPayload).toBeDefined();
        expect(insertedPayload.site_id).toBe('site-piassa');
        expect(insertedPayload.region_code).toBe('ET-AA');
        expect(result?.siteId).toBe('site-piassa');
    });

    it('updates task status and returns verified confirmed record', async () => {
        let updatePayload: any = null;
        const mockSingle = vi.fn().mockResolvedValue({
            data: {
                id: 'task-103',
                title: 'Clean bay',
                description: '',
                assigned_to: 'emp-3',
                status: 'Completed',
                priority: 'Low',
                due_date: '2026-10-30',
                site_id: 'site-cmc',
                created_by: 'manager-1',
                region_code: 'ET-AA',
                task_type: 'GENERAL'
            },
            error: null
        });

        const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
        const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
        const mockUpdate = vi.fn().mockImplementation((payload) => {
            updatePayload = payload;
            return { eq: mockEq };
        });

        vi.mocked(supabase.from).mockReturnValue({
            update: mockUpdate
        } as any);

        const result = await tasksService.update('task-103', { status: 'Completed' });

        expect(updatePayload).toBeDefined();
        expect(updatePayload.status).toBe('Completed');
        expect(updatePayload.updated_at).toBeDefined();
        expect(result?.status).toBe('Completed');
        expect(result?.siteId).toBe('site-cmc');
    });
});
