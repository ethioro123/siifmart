import { supabase } from '../lib/supabase';

export const jobAssignmentsService = {
    async getAll(siteId?: string, employeeId?: string, limit?: number) {
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

        return data.map((a: any) => ({
            ...a,
            jobId: a.job_id,
            employeeId: a.employee_id,
            employeeName: a.employee_name,
            assignedAt: a.assigned_at,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            estimatedDuration: a.estimated_duration,
            actualDuration: a.actual_duration,
            unitsProcessed: a.units_processed,
            accuracyRate: a.accuracy_rate
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('job_assignments')
            .select('*')
            .eq('id', id)
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

    async getByJobId(jobId: string) {
        const { data, error } = await supabase
            .from('job_assignments')
            .select('*')
            .eq('job_id', jobId)
            .order('assigned_at', { ascending: false });

        if (error) throw error;
        return data.map((a: any) => ({
            ...a,
            jobId: a.job_id,
            employeeId: a.employee_id,
            employeeName: a.employee_name,
            assignedAt: a.assigned_at,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            estimatedDuration: a.estimated_duration,
            actualDuration: a.actual_duration,
            unitsProcessed: a.units_processed,
            accuracyRate: a.accuracy_rate
        }));
    },

    async getByEmployeeId(employeeId: string, status?: string) {
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

        return data.map((a: any) => ({
            ...a,
            jobId: a.job_id,
            employeeId: a.employee_id,
            employeeName: a.employee_name,
            assignedAt: a.assigned_at,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            estimatedDuration: a.estimated_duration,
            actualDuration: a.actual_duration,
            unitsProcessed: a.units_processed,
            accuracyRate: a.accuracy_rate
        }));
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
