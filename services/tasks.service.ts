import { supabase } from '../lib/supabase';
import type { EmployeeTask } from '../types';
import { logger } from '../utils/logger';

const TASK_COLUMNS = 'id, title, description, assigned_to, status, priority, due_date, site_id, created_by, region_code, task_type';

export const tasksService = {
    async getAll(siteId?: string, limit: number = 25, regionCode?: string): Promise<EmployeeTask[]> {
        try {
            let query = supabase
                .from('employee_tasks')
                .select(TASK_COLUMNS)
                .order('due_date', { ascending: true });

            if (siteId) {
                query = query.eq('site_id', siteId);
            }
            if (regionCode) {
                query = query.eq('region_code', regionCode);
            }
            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('tasksService', 'Error fetching tasks:', error);
                return [];
            }

            return (data || []).map(this._mapTask);
        } catch (error) {
            logger.error('tasksService', 'Error in tasksService.getAll:', error as Error);
            return [];
        }
    },

    async getByRegion(regionCode: string, limit: number = 25): Promise<EmployeeTask[]> {
        return this.getAll(undefined, limit, regionCode);
    },

    async getById(id: string): Promise<EmployeeTask | null> {
        try {
            const { data, error } = await supabase
                .from('employee_tasks')
                .select(TASK_COLUMNS)
                .eq('id', id)
                .single();

            if (error) {
                logger.error('tasksService', 'Error fetching task by id:', error);
                return null;
            }

            return this._mapTask(data);
        } catch (error) {
            logger.error('tasksService', 'Error in tasksService.getById:', error as Error);
            return null;
        }
    },

    async getByEmployee(employeeId: string): Promise<EmployeeTask[]> {
        try {
            const { data, error } = await supabase
                .from('employee_tasks')
                .select(TASK_COLUMNS)
                .eq('assigned_to', employeeId)
                .order('due_date', { ascending: true });

            if (error) {
                logger.error('tasksService', 'Error fetching tasks for employee:', error);
                return [];
            }

            return (data || []).map(this._mapTask);
        } catch (error) {
            logger.error('tasksService', 'Error in tasksService.getByEmployee:', error as Error);
            return [];
        }
    },

    async create(task: Omit<EmployeeTask, 'id'>): Promise<EmployeeTask | null> {
        try {
            let siteId = task.siteId || (task as any).site_id || null;
            let regionCode = task.regionCode || (task as any).region_code || null;

            // Resolve site_id from assigned employee if omitted
            if (!siteId && task.assignedTo) {
                const { data: emp } = await supabase
                    .from('employees')
                    .select('site_id, region_code')
                    .eq('id', task.assignedTo)
                    .maybeSingle();

                if (emp?.site_id) {
                    siteId = emp.site_id;
                    if (!regionCode && emp.region_code) {
                        regionCode = emp.region_code;
                    }
                }
            }

            // Fallback to active creator's site scope if still missing
            if (!siteId) {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser?.id) {
                    const { data: creatorEmp } = await supabase
                        .from('employees')
                        .select('site_id, region_code')
                        .eq('id', authUser.id)
                        .maybeSingle();

                    if (creatorEmp?.site_id) {
                        siteId = creatorEmp.site_id;
                        if (!regionCode && creatorEmp.region_code) {
                            regionCode = creatorEmp.region_code;
                        }
                    }
                }
            }

            const dbTask: any = {
                title: task.title,
                description: task.description || '',
                assigned_to: task.assignedTo,
                status: task.status || 'Pending',
                priority: task.priority || 'Medium',
                due_date: task.dueDate,
                site_id: siteId,
                created_by: task.createdBy || null,
                region_code: regionCode,
                task_type: task.taskType || (task as any).task_type || 'GENERAL'
            };

            const { data, error } = await supabase
                .from('employee_tasks')
                .insert(dbTask)
                .select(TASK_COLUMNS)
                .single();

            if (error) {
                logger.error('tasksService', 'Error creating task in database:', error);
                return null;
            }

            return this._mapTask(data);
        } catch (error) {
            logger.error('tasksService', 'Error in tasksService.create:', error as Error);
            return null;
        }
    },

    async update(id: string, updates: Partial<EmployeeTask>): Promise<EmployeeTask | null> {
        try {
            const dbUpdates: any = {};

            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
            if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
            if (updates.regionCode !== undefined) dbUpdates.region_code = updates.regionCode;
            if (updates.taskType !== undefined) dbUpdates.task_type = updates.taskType;
            if (updates.siteId !== undefined) dbUpdates.site_id = updates.siteId;
            if ((updates as any).site_id !== undefined) dbUpdates.site_id = (updates as any).site_id;
            if (updates.createdBy !== undefined) dbUpdates.created_by = updates.createdBy;

            dbUpdates.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('employee_tasks')
                .update(dbUpdates)
                .eq('id', id)
                .select(TASK_COLUMNS)
                .single();

            if (error) {
                logger.error('tasksService', 'Error updating task in database:', error);
                return null;
            }

            return this._mapTask(data);
        } catch (error) {
            logger.error('tasksService', 'Error in tasksService.update:', error as Error);
            return null;
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('employee_tasks')
                .delete()
                .eq('id', id);

            if (error) {
                logger.error('tasksService', 'Error deleting task:', error);
                return false;
            }

            return true;
        } catch (error) {
            logger.error('tasksService', 'Error in tasksService.delete:', error as Error);
            return false;
        }
    },

    _mapTask(data: any): EmployeeTask {
        return {
            id: data.id,
            title: data.title,
            description: data.description || '',
            assignedTo: data.assigned_to,
            status: data.status as EmployeeTask['status'],
            priority: data.priority as EmployeeTask['priority'],
            dueDate: data.due_date,
            siteId: data.site_id,
            site_id: data.site_id,
            createdBy: data.created_by,
            regionCode: data.region_code,
            region_code: data.region_code,
            taskType: data.task_type,
            task_type: data.task_type
        };
    }
};
