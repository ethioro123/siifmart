import { z } from 'zod';
export const operations = ['ALL','RECEIVE','PUTAWAY','PICK','PACK','DISPATCH','TRANSFER','REPLENISH','COUNT','RETURNS','WASTE','LABELS'] as const;
export const operationSources = ['receipt','job','inventory','return','count','transfer'] as const;
export const operationsReviewRoles = ['group_ceo','country_managing_director','country_operations_director','warehouse_manager','store_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager','picking_supervisor','packing_supervisor','dispatch_supervisor','inventory_control_supervisor','returns_waste_supervisor','warehouse_operations_manager'];
export const operationRow = z.object({source:z.enum(operationSources),id:z.string().uuid(),operation:z.enum(operations),reference:z.string().nullable(),status:z.string(),handler:z.string().nullable(),occurred_at:z.string(),exception:z.boolean(),site_id:z.string().uuid().optional(),site_name:z.string().optional()});
const scalar = z.union([z.string(),z.number(),z.boolean(),z.null()]);
export const operationReport = z.object({id:z.string().uuid(),item_index:z.number(),expected_qty:z.number(),first_count:z.number(),recount:z.number(),reason:z.string(),reporter_name:z.string(),reported_at:z.string(),resolution:z.string().nullable(),resolved_qty:z.number().nullable(),resolution_notes:z.string().nullable(),resolver_name:z.string().nullable(),resolved_at:z.string().nullable(),finding:z.string().nullable(),review_notes:z.string().nullable(),reviewed_at:z.string().nullable(),can_resolve:z.boolean(),can_review:z.boolean()});
export const receivingReviewEvidence = z.object({
 po_number:z.string().nullable(),supplier_name:z.string().nullable(),partial:z.boolean(),
 items:z.array(z.object({id:z.string().uuid(),product_name:z.string().nullable(),sku:z.string().nullable(),received:z.number(),ordered:z.number().nullable(),outstanding:z.number().nullable()})).max(25),
 submissions:z.array(z.object({id:z.string().uuid(),item_id:z.string().uuid(),created_at:z.string(),employee_name:z.string().nullable(),has_snapshot:z.boolean(),original_quantity:z.number().nullable()})).max(25),
 putaway:z.array(z.object({id:z.string().uuid(),reference:z.string(),status:z.string(),quantity:z.number(),employee_name:z.string().nullable()})).max(25)
});
export type ReceivingReviewEvidence = z.infer<typeof receivingReviewEvidence>;
export const operationDetail = z.object({summary:operationRow,receiving:receivingReviewEvidence.nullish(),fields:z.record(z.string(),scalar),lines:z.array(z.record(z.string(),scalar)).max(25),reports:z.array(operationReport).max(25),fingerprint:z.string(),can_note:z.boolean(),can_credit:z.boolean(),notes:z.array(z.object({reviewer_name:z.string(),reason:z.string(),created_at:z.string()})).max(25)});
export const reviewScope = z.object({site:z.string().uuid(),country:z.string().regex(/^[A-Z]{2}$/)});
export const reviewSelection = z.object({source:z.enum(operationSources),id:z.string().uuid()});
export const reviewNoteInput = reviewScope.merge(reviewSelection).extend({fingerprint:z.string().min(1),reason:z.string().trim().min(3).max(1200)}).strict();
export type OperationRow = z.infer<typeof operationRow>;
export type OperationDetail = z.infer<typeof operationDetail>;
export type OperationReport = z.infer<typeof operationReport>;
export type ReviewScope = z.infer<typeof reviewScope>;
export type ReviewSelection = z.infer<typeof reviewSelection> & { site_id?: string; site_name?: string };
export type ReviewNoteInput = z.infer<typeof reviewNoteInput>;
export type Operation = typeof operations[number];
export type OperationMode = 'exceptions'|'active'|'history'|'partial';
