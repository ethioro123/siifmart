import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { mapWmsJobRow } from './wms-jobs.mapper';

const lineInput = z.object({
    jobId: z.string().uuid(), itemIndex: z.number().int().nonnegative(), quantity: z.number().finite().nonnegative(),
    locationBarcode: z.string().regex(/^\d{15}$/), itemBarcode: z.string().max(200),
    shortageReason: z.string().trim().min(3).max(500).optional()
}).strict();
export type PickLineInput = z.infer<typeof lineInput>;
export const pickingExecutionService = {
    async recordLine(input: PickLineInput) {
        const value = lineInput.parse(input);
        const { data, error } = await supabase.rpc('record_pick_line', {
            p_job_id: value.jobId, p_item_index: value.itemIndex, p_quantity: value.quantity,
            p_location_barcode: value.locationBarcode, p_item_barcode: value.itemBarcode,
            p_shortage_reason: value.shortageReason || null
        });
        if (error) throw error;
        if (!data?.id || data.type !== 'PICK') throw new Error('Server did not confirm the picking line.');
        return mapWmsJobRow(data);
    },
    async complete(jobId: string) {
        z.string().uuid().parse(jobId);
        const { data, error } = await supabase.rpc('complete_pick_job', { p_job_id: jobId });
        if (error) throw error;
        if (!data?.job?.id || data.job.status !== 'Completed') throw new Error('Server did not confirm picking completion.');
        return { job: mapWmsJobRow(data.job), pack: data.pack ? mapWmsJobRow(data.pack) : null };
    }
};
