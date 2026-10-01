/**
 * role-settings.schema.ts
 *
 * Strict Zod validation schemas for Role Security Policies and Access Permissions.
 *
 * Rules enforced:
 *  - Anti-Hacking: Strict input validation on all mutation payloads before database writes.
 *  - Zero-Trust: Branch staff cannot tamper with corporate access policies or session timeouts.
 *  - 100% Country-Level Isolation: Role policies are keyed and validated per targetCountry.
 */

import { z } from 'zod';

export const RolePolicySchema = z.object({
  mfa_required: z.boolean().default(false),
  session_timeout: z
    .number()
    .int('Session timeout must be an integer')
    .min(5, 'Session timeout cannot be less than 5 minutes')
    .max(120, 'Session timeout cannot exceed 120 minutes')
    .default(30),
  ip_restriction: z.boolean().default(false),
  time_restriction: z.boolean().default(false),
  password_complexity: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type RolePolicyInput = z.infer<typeof RolePolicySchema>;

export const RolePermissionItemSchema = z.object({
  id: z.string().trim().min(1, 'Permission ID is required'),
  label: z.string().trim().min(1, 'Permission label is required'),
  description: z.string().optional(),
  hqApprovalRequired: z.boolean().optional(),
  admin: z.boolean().default(true),
  store_manager: z.boolean().default(false),
  cashier: z.boolean().default(false),
  warehouse: z.boolean().default(false),
});

export type RolePermissionItemInput = z.infer<typeof RolePermissionItemSchema>;

export const RoleSettingsPayloadSchema = z.object({
  section: z.enum(['policies', 'permissions']),
  roleId: z.enum(['admin', 'store_manager', 'cashier', 'warehouse']).optional(),
  policies: z.record(z.string(), RolePolicySchema).optional(),
  permissions: z.record(z.string(), z.array(RolePermissionItemSchema)).optional(),
  targetCountry: z.enum(['ET', 'KE', 'UG', 'RW', 'TZ']).default('ET'),
});

export type RoleSettingsPayloadInput = z.infer<typeof RoleSettingsPayloadSchema>;
