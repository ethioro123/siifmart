import { z } from 'zod';
import { supabase } from '../lib/supabase';
const exportSchema = z.object({ runId: z.string(), period: z.string(), country: z.enum(['ET', 'KE']), currency: z.string(), gross: z.number(), bonus: z.number(), deductions: z.number(), net: z.number(), roster: z.array(z.object({ id: z.string().uuid(), salary: z.number(), site: z.string().uuid() })) });
export type PayrollReviewExport = z.infer<typeof exportSchema>;
export async function getPayrollReviewExport(runId: string): Promise<PayrollReviewExport> {
    const { data, error } = await supabase.rpc('payroll_review_export', { p_run: runId });
    if (error) throw error;
    const saved = exportSchema.parse(data);
    if (saved.runId !== runId) throw new Error('Payroll review does not match the requested run');
    return saved;
}
