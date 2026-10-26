import { supabase } from '../lib/supabase';
import { z } from 'zod';

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
    }
};
