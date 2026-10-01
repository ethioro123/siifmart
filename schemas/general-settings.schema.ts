import { z } from 'zod';

export const optionalString = z.string().optional().nullable();

export const BrandingSettingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(100),
  slogan: z.string().max(200).optional().default(''),
  brandColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color code'),
  logoUrl: optionalString,
  country: z.enum(['ET', 'KE', 'UG', 'RW', 'TZ']).optional(),
}).passthrough();

export const LegalSettingsSchema = z.object({
  legalBusinessName: z.string().min(1, 'Legal business name is required').max(150),
  taxId: z.string().max(50).optional().default(''),
  taxVatNumber: z.string().max(50).optional().default(''),
  registeredAddress: z.string().min(1, 'Registered address is required').max(255),
  supportContact: z.string().email('Invalid support email address').max(100),
  supportPhone: z.string().min(5, 'Support phone is required').max(30),
  country: z.enum(['ET', 'KE', 'UG', 'RW', 'TZ']).optional(),
}).passthrough();

export const LocalizationSettingsSchema = z.object({
  country: z.enum(['ET', 'KE', 'UG', 'RW', 'TZ']),
  currency: z.string().min(1).max(10),
  timezone: z.string().min(1).max(50),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  language: z.string().min(2).max(10),
  taxRate: z.number().nonnegative(),
  defaultVatRate: z.number().nonnegative(),
  taxAuthority: z.string().min(1),
  complianceStandard: z.string().min(1),
  eTimsEnabled: z.boolean().optional(),
}).passthrough();

export type BrandingSettingsInput = z.infer<typeof BrandingSettingsSchema>;
export type LegalSettingsInput = z.infer<typeof LegalSettingsSchema>;
export type LocalizationSettingsInput = z.infer<typeof LocalizationSettingsSchema>;
