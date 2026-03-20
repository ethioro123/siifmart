import { supabase } from '../lib/supabase';
import type { EmployeeTask } from '../types';

export const tasksService = {
    async getAll(siteId?: string, limit?: number): Promise<EmployeeTask[]> {
        try {
            let query = supabase
                .from('employee_tasks')
                .select('*')
                .order('due_date', { ascending: true });

            if (siteId) {
                query = query.eq('site_id', siteId);
            }

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching tasks:', error);
                return [];
            }

            return (data || []).map(this._mapTask);
        } catch (error) {
            console.error('Error in tasksService.getAll:', error);
            return [];
        }
    },

    async getById(id: string): Promise<EmployeeTask | null> {
        try {
            const { data, error } = await supabase
                .from('employee_tasks')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching task:', error);
                return null;
            }

            return this._mapTask(data);
        } catch (error) {
            console.error('Error in tasksService.getById:', error);
            return null;
        }
    },

    async getByEmployee(employeeId: string): Promise<EmployeeTask[]> {
        try {
            const { data, error } = await supabase
                .from('employee_tasks')
                .select('*')
                .eq('assigned_to', employeeId)
                .order('due_date', { ascending: true });

            if (error) {
                console.error('Error fetching tasks for employee:', error);
                return [];
            }

            return (data || []).map(this._mapTask);
        } catch (error) {
            console.error('Error in tasksService.getByEmployee:', error);
            return [];
        }
    },

    async create(task: Omit<EmployeeTask, 'id'>): Promise<EmployeeTask | null> {
        try {
            const dbTask = {
                title: task.title,
                description: task.description,
                assigned_to: task.assignedTo,
                status: task.status || 'Pending',
                priority: task.priority || 'Medium',
                due_date: task.dueDate
            };

            const { data, error } = await supabase
                .from('employee_tasks')
                .insert(dbTask)
                .select()
                .single();

            if (error) {
                console.error('Error creating task:', error);
                return null;
            }

            return this._mapTask(data);
        } catch (error) {
            console.error('Error in tasksService.create:', error);
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

            dbUpdates.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('employee_tasks')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating task:', error);
                return null;
            }

            return this._mapTask(data);
        } catch (error) {
            console.error('Error in tasksService.update:', error);
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
                console.error('Error deleting task:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in tasksService.delete:', error);
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
            createdBy: data.created_by
        };
    }
};
