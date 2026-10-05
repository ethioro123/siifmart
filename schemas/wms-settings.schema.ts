import { z } from 'zod';

export const InboundSettingsSchema = z.object({
  receivingLogic: z.enum(['blind', 'verified']),
  qcSamplingRate: z.number().min(0, 'Sampling rate cannot be negative').max(100, 'Sampling rate cannot exceed 100%'),
  qcBlockOnFailure: z.boolean(),
  putawayLogic: z.enum(['manual', 'system']),
  requirePutawayQuantityEntry: z.boolean().optional(),
  overReceiveTolerancePct: z.number().min(0).max(100).optional(),
  poPriceApplyAt: z.enum(['receive', 'putaway']).optional(),
  printPriceTagAt: z.enum(['receive', 'putaway', 'store']).optional(),
  country: z.enum(['ET', 'KE', 'UG', 'RW', 'TZ']).optional(),
}).passthrough();

export const HealthSettingsSchema = z.object({
  // FEFO and FIFO are permitted; LIFO is strictly prohibited per AGENTS.md §4
  rotationPolicy: z.enum(['fefo', 'fifo']),
  requireExpiry: z.boolean(),
  cycleCountStrategy: z.enum(['abc', 'random']),
  maxCycleCountRecounts: z.number().min(0).max(10).optional(),
  requireSecondCounterOnVariance: z.boolean().optional(),
  country: z.enum(['ET', 'KE', 'UG', 'RW', 'TZ']).optional(),
}).passthrough();

export const OutboundSettingsSchema = z.object({
  pickingMethod: z.enum(['order', 'wave', 'zone']),
  strictScanning: z.boolean(),
  bayScan: z.boolean(),
  requirePickQuantityEntry: z.boolean().optional(),
  requirePackSecuritySeal: z.boolean().optional(),
  requirePackCartonWeight: z.boolean().optional(),
  packWeightTolerancePct: z.number().min(0).max(100).optional(),
  country: z.enum(['ET', 'KE', 'UG', 'RW', 'TZ']).optional(),
}).passthrough();

export type InboundSettingsInput = z.infer<typeof InboundSettingsSchema>;
export type HealthSettingsInput = z.infer<typeof HealthSettingsSchema>;
export type OutboundSettingsInput = z.infer<typeof OutboundSettingsSchema>;
