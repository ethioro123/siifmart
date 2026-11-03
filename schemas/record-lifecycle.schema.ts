import { z } from 'zod';
export const lifecycleRequestSchema = z.object({
  kind: z.enum(['employee', 'site', 'purchase_order', 'transfer', 'warehouse_job']),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(10).max(1200),
  evidence: z.record(z.string(), z.union([z.string().max(1200), z.boolean()]))
}).strict();
export const lifecycleDecisionSchema = z.object({
  id: z.string().uuid(), decision: z.enum(['approve', 'reject', 'withdraw']), reason: z.string().trim().min(10).max(1200)
}).strict();
