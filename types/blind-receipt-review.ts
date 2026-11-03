import { z } from 'zod';
const count = z.number().finite().nonnegative();
export const receiptSummary = z.object({
    id: z.string().uuid(), po_number: z.string().nullable(), product_name: z.string().nullable(), sku: z.string().nullable(),
    employee_name: z.string(), physical_qty: count, created_at: z.string(), reviewed: z.boolean(), needs_review: z.boolean()
});
export const receiptDetail = z.object({
    id: z.string().uuid(), po_id: z.string().uuid(), item_id: z.string().uuid(), site_id: z.string().uuid(), country_code: z.string(),
    po_number: z.string().nullable(), product_name: z.string().nullable(), sku: z.string().nullable(), employee_name: z.string(),
    physical_qty: count, expected_qty: count.optional(), previous_qty: count.optional(), created_at: z.string(),
    needs_review: z.boolean(), can_review: z.boolean(), can_correct: z.boolean(), issue: z.string().nullable(),
    lines: z.array(z.object({ jobId: z.string().uuid(), quantity: count, condition: z.string(), batch: z.string().nullable(), expiry: z.string().nullable() })),
    corrections: z.array(z.object({ id: z.string().uuid(), job_id: z.string().uuid(), quantity: count, reason: z.string(), created_at: z.string() })),
    decisions: z.array(z.object({ id: z.string().uuid(), correction_id: z.string().uuid().nullable(), approve: z.boolean(), reason: z.string(), reviewer_name: z.string(), created_at: z.string() }))
});
export const correctionInput = z.object({ requestId: z.string().uuid(), receiptId: z.string().uuid(), jobId: z.string().uuid(), quantity: count.positive().lt(1e9), reason: z.string().trim().min(3).max(1200) }).strict();
export const receiptDecisionInput = z.object({ receiptId: z.string().uuid(), correctionId: z.string().uuid().nullable(), approve: z.boolean(), reason: z.string().trim().min(3).max(1200) }).strict();
export type ReceiptSummary = z.infer<typeof receiptSummary>;
export type ReceiptDetail = z.infer<typeof receiptDetail>;
export type ReceiptCorrectionInput = z.infer<typeof correctionInput>;
export type ReceiptDecisionInput = z.infer<typeof receiptDecisionInput>;
export const receiptManagerRoles = ['warehouse_manager','store_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager','country_operations_director','country_managing_director','group_ceo'];
