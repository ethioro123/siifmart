import { z } from 'zod';
import { supabase } from '../lib/supabase';
const stateSchema = z.union([
    z.object({ needed: z.literal(false) }),
    z.object({ needed: z.literal(true), jobId: z.string().uuid(), fingerprint: z.string(), canDriver: z.boolean(), canApprove: z.boolean(),
        driverSigned: z.boolean().nullable().transform(Boolean), approved: z.boolean().nullable().transform(Boolean),
        items: z.array(z.object({ sku: z.string().nullable(), quantity: z.string(), condition: z.string() })) })
]);
export const transferVarianceService = {
    async get(jobId: string) {
        const { data, error } = await supabase.rpc('get_transfer_variance', { p_job: z.string().uuid().parse(jobId) });
        if (error) throw error;
        return stateSchema.parse(data);
    },
    async sign(input: { job: string; action: 'driver' | 'supervisor'; fingerprint: string; reason: string }) {
        const value = z.object({ job: z.string().uuid(), action: z.enum(['driver', 'supervisor']), fingerprint: z.string().min(1), reason: z.string().trim().min(10).max(1200) }).parse(input);
        const { data, error } = await supabase.rpc('sign_transfer_variance', { p_job: value.job, p_action: value.action, p_fingerprint: value.fingerprint, p_reason: value.reason });
        if (error) throw error;
        return stateSchema.parse(data);
    }
};
