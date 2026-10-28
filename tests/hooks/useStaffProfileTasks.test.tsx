// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStaffProfile } from '../../hooks/useStaffProfile';
import { tasksService } from '../../services/tasks.service';
import type { Employee, EmployeeTask } from '../../types';

vi.mock('../../services/tasks.service', () => ({
    tasksService: {
        create: vi.fn(),
        update: vi.fn(),
        getByEmployee: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('../../utils/employeeProfileData', () => ({
    getEmployeeDocuments: vi.fn().mockReturnValue([]),
    addEmployeeDocument: vi.fn(),
    removeEmployeeDocument: vi.fn(),
    getEmployeeLeaveRequests: vi.fn().mockReturnValue([]),
    addEmployeeLeaveRequest: vi.fn(),
    updateEmployeeLeaveRequestStatus: vi.fn()
}));

describe('useStaffProfile tasks persistence & site scoping', () => {
    const mockEmployee: Employee = {
        id: 'emp-piassa-01',
        name: 'Abebe Bikila',
        role: 'stock_clerk',
        siteId: 'site-piassa-01',
        country: 'ET',
        status: 'Active',
        department: 'Operations',
        email: 'abebe@siifmart.com',
        phone: '+251911000000',
        code: 'EMP-01',
        homeSiteId: 'site-piassa-01',
        joinDate: '2025-01-01',
        avatar: '',
        performanceScore: 90,
        salary: 15000,
        emergencyContact: '+251911000001 (Sister)'
    };

    const mockManager = {
        id: 'mgr-01',
        name: 'Almaz Ayana',
        role: 'branch_manager',
        siteId: 'site-piassa-01'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(tasksService.getByEmployee).mockResolvedValue([]);
    });

    it('creates and persists task with employee site scope, updating state only on verified save', async () => {
        let currentTasks: EmployeeTask[] = [];
        const setTasks = vi.fn().mockImplementation((updater) => {
            if (typeof updater === 'function') {
                currentTasks = updater(currentTasks);
            } else {
                currentTasks = updater;
            }
        });
        const addNotification = vi.fn();
        const updateEmployee = vi.fn();
        const updateUserAvatar = vi.fn();

        const savedTask: EmployeeTask = {
            id: 'real-uuid-101',
            title: 'Audit Gondola 4',
            description: 'Manual Assignment',
            assignedTo: 'emp-piassa-01',
            status: 'Pending',
            priority: 'High',
            dueDate: '2026-10-31',
            siteId: 'site-piassa-01',
            createdBy: 'Almaz Ayana'
        };

        vi.mocked(tasksService.create).mockResolvedValue(savedTask);

        const { result } = renderHook(() =>
            useStaffProfile({
                employee: mockEmployee,
                user: mockManager,
                allTasks: currentTasks,
                setTasks,
                updateEmployee,
                addNotification,
                updateUserAvatar
            })
        );

        // Set input
        act(() => {
            result.current.setNewTaskTitle('Audit Gondola 4');
            result.current.setNewTaskPriority('High');
        });

        // Trigger add task
        await act(async () => {
            await result.current.handleAddTask();
        });

        // Verifies service was called with siteId and assignee
        expect(tasksService.create).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Audit Gondola 4',
                assignedTo: 'emp-piassa-01',
                siteId: 'site-piassa-01',
                priority: 'High'
            })
        );

        // Verifies success notification and state update
        expect(addNotification).toHaveBeenCalledWith('success', expect.stringContaining('Task assigned'));
        expect(setTasks).toHaveBeenCalled();
        expect(result.current.newTaskTitle).toBe('');
    });

    it('does not mutate state or report success when database task creation fails', async () => {
        const setTasks = vi.fn();
        const addNotification = vi.fn();

        vi.mocked(tasksService.create).mockResolvedValue(null);

        const { result } = renderHook(() =>
            useStaffProfile({
                employee: mockEmployee,
                user: mockManager,
                allTasks: [],
                setTasks,
                updateEmployee: vi.fn(),
                addNotification,
                updateUserAvatar: vi.fn()
            })
        );

        // Wait for initial sync effect and clear mock
        await act(async () => {
            await Promise.resolve();
        });
        setTasks.mockClear();

        act(() => {
            result.current.setNewTaskTitle('Rejected Task');
        });

        await act(async () => {
            await result.current.handleAddTask();
        });

        expect(addNotification).toHaveBeenCalledWith('alert', expect.stringContaining('Failed to assign task'));
        // Local state must not be falsely modified with an unpersisted task
        expect(setTasks).not.toHaveBeenCalled();
    });

    it('persists task completion to database before announcing success', async () => {
        const initialTask: EmployeeTask = {
            id: 'task-saved-101',
            title: 'Shelf Restock',
            description: 'Manual Assignment',
            assignedTo: 'emp-piassa-01',
            status: 'Pending',
            priority: 'Medium',
            dueDate: '2026-10-31',
            siteId: 'site-piassa-01'
        };

        let currentTasks: EmployeeTask[] = [initialTask];
        const setTasks = vi.fn().mockImplementation((updater) => {
            if (typeof updater === 'function') {
                currentTasks = updater(currentTasks);
            } else {
                currentTasks = updater;
            }
        });
        const addNotification = vi.fn();

        const completedTask: EmployeeTask = {
            ...initialTask,
            status: 'Completed'
        };
        vi.mocked(tasksService.update).mockResolvedValue(completedTask);

        const { result } = renderHook(() =>
            useStaffProfile({
                employee: mockEmployee,
                user: mockManager,
                allTasks: currentTasks,
                setTasks,
                updateEmployee: vi.fn(),
                addNotification,
                updateUserAvatar: vi.fn()
            })
        );

        await act(async () => {
            await result.current.handleCompleteTask('task-saved-101');
        });

        expect(tasksService.update).toHaveBeenCalledWith('task-saved-101', { status: 'Completed' });
        expect(addNotification).toHaveBeenCalledWith('success', 'Task marked as completed');
        expect(setTasks).toHaveBeenCalled();
    });
});
