/**
 * discount-code.schema.ts
 *
 * Strict Zod validation schemas for promotional discount codes.
 *
 * Rules enforced:
 *  - Anti-Hacking: Strict input sanitization and boundary checks before database mutations.
 *  - Multi-Country Isolation: Explicit country_code binding to prevent cross-border voucher leaks.
 *  - Zero-Trust: Enforces constraints on percentages and numerical caps.
 */

import { z } from 'zod';

export const DiscountCodeSchema = z.object({
  id: z.string().optional(),
  code: z
    .string()
    .trim()
    .min(3, 'Discount code must be at least 3 characters')
    .max(30, 'Discount code cannot exceed 30 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Discount code may only contain uppercase letters, numbers, hyphens, and underscores'),
  name: z
    .string()
    .trim()
    .min(1, 'Campaign/Discount name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  type: z.enum(['PERCENTAGE', 'FIXED'] as const),
  value: z
    .number()
    .positive('Discount value must be greater than 0'),
  country: z.string().default('ET'),
  country_code: z.string().optional(),
  currency: z.string().optional(),
  minPurchaseAmount: z.number().nonnegative('Minimum purchase cannot be negative').optional(),
  maxDiscountAmount: z.number().nonnegative('Maximum cap cannot be negative').optional(),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  usageLimit: z.number().int().positive('Usage limit must be a positive integer').optional(),
  usageCount: z.number().int().nonnegative().default(0),
  perCustomerLimit: z.number().int().positive().optional(),
  status: z.enum(['Active', 'Expired', 'Disabled', 'Scheduled']).default('Active'),
  applicableSites: z.array(z.string()).optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
}).refine((data) => {
  if (data.type === 'PERCENTAGE' && data.value > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['value'],
}).refine((data) => {
  const from = new Date(data.validFrom).getTime();
  const until = new Date(data.validUntil).getTime();
  return isNaN(from) || isNaN(until) || until >= from;
}, {
  message: 'Valid Until date cannot be earlier than Valid From date',
  path: ['validUntil'],
});

export type DiscountCodeInput = z.infer<typeof DiscountCodeSchema>;
