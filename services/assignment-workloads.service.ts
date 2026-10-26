import { supabase } from '../lib/supabase';
import { z } from 'zod';
import { mapWmsJobRow } from './wms-jobs.mapper';
import { mapJobAssignmentRow } from './job-assignments.service';

export const MAX_ACTIVE_JOBS = 100;
const snapshot = z.object({
    workers: z.array(z.object({ employeeId: z.string().uuid(), active: z.number().int().nonnegative(), completedToday: z.number().int().nonnegative() })),
    timezone: z.string(), day: z.string()
});
export type AssignmentWorkload = z.infer<typeof snapshot>['workers'][number];
export const assignmentWorkloadsService = {
    async load(siteId: string, country: string, employeeIds: string[]) {
        z.string().uuid().parse(siteId);
        const workers: AssignmentWorkload[] = [];
        let timezone = '', day = '';
        const ids = [...new Set(employeeIds)].sort();
        for (let start = 0; start < ids.length; start += 100) {
            const { data, error } = await supabase.rpc('assignment_workloads', {
                p_site_id: siteId, p_country_code: country, p_employee_ids: ids.slice(start, start + 100)
            });
            if (error) throw error;
            const value = snapshot.parse(data);
            workers.push(...value.workers); timezone = value.timezone; day = value.day;
        }
        return { workers, timezone, day };
    },
    async assign(jobId: string, employeeId: string, source?: string) {
        z.string().uuid().parse(jobId); z.string().uuid().parse(employeeId);
        const { data, error } = await supabase.rpc('assign_wms_job', { p_job_id: jobId, p_employee_id: employeeId, p_source: source || null });
        if (error) throw error;
        if (data?.job?.id !== jobId || data.job.assigned_to !== employeeId || !data.assignment?.id) throw new Error('Server did not confirm the assignment.');
        return { job: mapWmsJobRow(data.job), assignment: mapJobAssignmentRow(data.assignment) };
    }
};
