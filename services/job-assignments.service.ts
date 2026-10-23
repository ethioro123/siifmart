import { supabase } from '../lib/supabase';
import type { JobAssignment } from '../types';

export const mapJobAssignmentRow = (row: any): JobAssignment => {
    if (!row) return row;
    return {
        ...row,
        jobId: row.job_id || row.jobId,
        job_id: row.job_id || row.jobId,
        employeeId: row.employee_id || row.employeeId,
        employee_id: row.employee_id || row.employeeId,
        employeeName: row.employee_name || row.employeeName,
        employee_name: row.employee_name || row.employeeName,
        assignedAt: row.assigned_at || row.assignedAt,
        assigned_at: row.assigned_at || row.assignedAt,
        startedAt: row.started_at || row.startedAt,
        started_at: row.started_at || row.startedAt,
        completedAt: row.completed_at || row.completedAt,
        completed_at: row.completed_at || row.completedAt,
        status: row.status,
        notes: row.notes,
        estimatedDuration: row.estimated_duration ?? row.estimatedDuration,
        estimated_duration: row.estimated_duration ?? row.estimatedDuration,
        actualDuration: row.actual_duration ?? row.actualDuration,
        actual_duration: row.actual_duration ?? row.actualDuration,
        unitsProcessed: row.units_processed ?? row.unitsProcessed,
        units_processed: row.units_processed ?? row.unitsProcessed,
        accuracyRate: row.accuracy_rate ?? row.accuracyRate,
        accuracy_rate: row.accuracy_rate ?? row.accuracyRate
    };
};

export const jobAssignmentsService = {
    /** Call with IDs from the authorized active-job read; avoid rejoining WMS RLS. */
    async getForJobs(jobs: readonly { id: string; siteId: string }[], siteId: string): Promise<JobAssignment[]> {
        if (!siteId) return [];
        const ids = [...new Set(jobs.filter(job => job.siteId === siteId).map(job => job.id))];
        const assignments: JobAssignment[] = [];
        const projection = 'id,job_id,employee_id,employee_name,assigned_at,started_at,completed_at,status,notes,estimated_duration,actual_duration,units_processed,accuracy_rate';
        for (let start = 0; start < ids.length; start += 50) {
            const batch = ids.slice(start, start + 50);
            for (let offset = 0; ; offset += 100) {
                const { data, error } = await supabase.from('job_assignments').select(projection)
                    .in('job_id', batch).order('assigned_at', { ascending: false }).order('id')
                    .range(offset, offset + 99);
                if (error) throw error;
                assignments.push(...(data || []).map(mapJobAssignmentRow));
                if (!data || data.length < 100) break;
            }
        }
        return assignments;
    },
    async getAll(siteId?: string, employeeId?: string, limit?: number): Promise<JobAssignment[]> {
        let query = supabase
            .from('job_assignments')
            .select(`
                *,
                wms_jobs!inner(site_id, type, priority, status, location, order_ref)
            `)
            .order('assigned_at', { ascending: false });

        if (siteId) {
            query = query.eq('wms_jobs.site_id', siteId);
        }

        if (employeeId) {
            query = query.eq('employee_id', employeeId);
        }

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map(mapJobAssignmentRow);
    },

    async getById(id: string): Promise<JobAssignment | null> {
        const { data, error } = await supabase
            .from('job_assignments')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? mapJobAssignmentRow(data) : null;
    },

    async getByJobId(jobId: string): Promise<JobAssignment[]> {
        const { data, error } = await supabase
            .from('job_assignments')
            .select('*')
            .eq('job_id', jobId)
            .order('assigned_at', { ascending: false });

        if (error) throw error;
        return data.map(mapJobAssignmentRow);
    },

    async getByEmployeeId(employeeId: string, status?: string): Promise<JobAssignment[]> {
        let query = supabase
            .from('job_assignments')
            .select('*')
            .eq('employee_id', employeeId)
            .order('assigned_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map(mapJobAssignmentRow);
    },

    async create(assignment: any) {
        const dbAssignment = {
            job_id: assignment.jobId,
            employee_id: assignment.employeeId,
            employee_name: assignment.employeeName,
            assigned_at: assignment.assignedAt || new Date().toISOString(),
            status: assignment.status || 'Assigned',
            notes: assignment.notes,
            estimated_duration: assignment.estimatedDuration
        };

        const { data, error } = await supabase
            .from('job_assignments')
            .insert(dbAssignment)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            jobId: data.job_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            assignedAt: data.assigned_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            estimatedDuration: data.estimated_duration,
            actualDuration: data.actual_duration,
            unitsProcessed: data.units_processed,
            accuracyRate: data.accuracy_rate
        };
    },

    async update(id: string, updates: any) {
        const dbUpdates: any = {};

        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
        if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.unitsProcessed !== undefined) dbUpdates.units_processed = updates.unitsProcessed;
        if (updates.accuracyRate !== undefined) dbUpdates.accuracy_rate = updates.accuracyRate;

        const { data, error } = await supabase
            .from('job_assignments')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            jobId: data.job_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            assignedAt: data.assigned_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            estimatedDuration: data.estimated_duration,
            actualDuration: data.actual_duration,
            unitsProcessed: data.units_processed,
            accuracyRate: data.accuracy_rate
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('job_assignments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Helper: Get active assignments for an employee
    async getActiveAssignments(employeeId: string) {
        return this.getByEmployeeId(employeeId, 'In-Progress');
    },

    // Helper: Get employee performance metrics
    async getEmployeeMetrics(employeeId: string) {
        const { data, error } = await supabase
            .from('employee_performance_metrics')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (error) {
            // View might not exist or no data
            return null;
        }

        return {
            ...data,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            totalJobs: data.total_jobs,
            completedJobs: data.completed_jobs,
            avgDurationMinutes: data.avg_duration_minutes,
            avgAccuracyRate: data.avg_accuracy_rate,
            totalUnitsProcessed: data.total_units_processed,
            lastCompletedAt: data.last_completed_at
        };
    }
};
