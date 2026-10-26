import { z } from 'zod';
const count = z.number().finite().min(0).max(1_000_000_000);
export const floorReportInput = z.object({ jobId: z.string().uuid(), itemIndex: z.number().int().nonnegative(), firstCount: count, recount: count, reason: z.string().trim().min(3).max(500) }).strict();
export const floorResolutionInput = z.object({ jobId: z.string().uuid(), discrepancyId: z.string().uuid(), resolution: z.enum(['count_corrected','goods_recovered','excess_segregated','short_pick']), quantity: count, notes: z.string().trim().min(3).max(500) }).strict();
export const floorDiscrepancy = z.object({
    id: z.string().uuid(), job_id: z.string().uuid(), item_index: z.number().int(), stage: z.enum(['PICK','PACK']),
    expected_qty: count, first_count: count, recount: count, reason: z.string(), reporter_id: z.string().uuid(), reporter_name: z.string(), reported_at: z.string(),
    resolution: z.string().nullable(), resolved_qty: count.nullable(), resolution_notes: z.string().nullable(), resolver_id: z.string().nullable(), resolver_name: z.string().nullable(), resolved_at: z.string().nullable()
});
export type FloorDiscrepancy = z.infer<typeof floorDiscrepancy>;
export type FloorReportInput = z.infer<typeof floorReportInput>;
export type FloorResolutionInput = z.infer<typeof floorResolutionInput>;
