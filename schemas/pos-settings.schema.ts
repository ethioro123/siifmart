/**
 * pos-settings.schema.ts
 *
 * Strict Zod validation schemas for POS settings and receipt layout branding.
 *
 * Rules enforced:
 *  - Anti-Hacking: Strict input validation on all mutation payloads before database writes.
 *  - 100% Country-Level Setting Isolation: Every setting is keyed and validated per targetCountry.
 *  - Zero-Trust: Branch staff cannot tamper with thermal formatting or fiscal IDs.
 */

import { z } from 'zod';
import type { Country } from '../utils/localization';

export const POSReceiptBrandingSchema = z.object({
  posReceiptLogo: z.string().url('Invalid logo URL').or(z.literal('')).default(''),
  posReceiptShowLogo: z.boolean().default(true),
  posReceiptHeader: z.string().trim().min(1, 'Receipt header is required').max(60, 'Header must be under 60 characters'),
  posReceiptFooter: z.string().trim().max(200, 'Footer note must be under 200 characters').default(''),
  posReceiptAddress: z.string().trim().max(200, 'Store address must be under 200 characters').default(''),
  posReceiptPhone: z.string().trim().max(50, 'Support phone must be under 50 characters').default(''),
  posReceiptEmail: z.string().trim().email('Invalid email address').or(z.literal('')).default(''),
  posReceiptTaxId: z.string().trim().max(50, 'Tax/VAT identifier must be under 50 characters').default(''),
  posReceiptPolicy: z.string().trim().max(500, 'Return policy must be under 500 characters').default(''),
  posReceiptSocialHandle: z.string().trim().max(100, 'Social handle must be under 100 characters').default(''),
  posReceiptEnableQR: z.boolean().default(true),
  posReceiptQRLink: z.string().url('Invalid feedback QR link').or(z.literal('')).default(''),
  posReceiptWidth: z.enum(['80mm', '58mm']).default('80mm'),
  posReceiptFont: z.enum(['monospace', 'sans-serif']).default('sans-serif'),
  targetCountry: z.enum(['ET', 'KE', 'UG', 'RW', 'TZ']).default('ET'),
});

export type POSReceiptBrandingInput = z.infer<typeof POSReceiptBrandingSchema>;

export const POSWorkflowSchema = z.object({
  posTerminalId: z.string().trim().max(50, 'Terminal identifier must be under 50 characters').default(''),
  posRegisterMode: z.enum(['cashier', 'kiosk']).default('cashier'),
  posGuestCheckout: z.boolean().default(false),
  posBlockNegativeStock: z.boolean().default(true),
  requireShiftClosure: z.boolean().default(true),
  posDailyRevenueTarget: z.number().nonnegative('Daily revenue target cannot be negative').optional(),
  posDailyTxTarget: z.number().int().nonnegative('Daily transaction target cannot be negative').optional(),
  targetCountry: z.enum(['ET', 'KE', 'UG', 'RW', 'TZ']).default('ET'),
});

export type POSWorkflowInput = z.infer<typeof POSWorkflowSchema>;

export interface CountryReceiptDefaults {
  header: string;
  footer: string;
  address: string;
  phone: string;
  email: string;
  taxIdLabel: string;
  taxIdDefault: string;
  policy: string;
  qrLink: string;
  width: '80mm' | '58mm';
  font: 'monospace' | 'sans-serif';
  showLogo: boolean;
  enableQR: boolean;
}

export const COUNTRY_RECEIPT_DEFAULTS: Record<Country, CountryReceiptDefaults> = {
  ET: {
    header: 'SIIFMART RETAIL',
    footer: 'Thank you for shopping with us!',
    address: 'Bole Sub-City, Addis Ababa, Ethiopia',
    phone: '+251 911 234 567',
    email: 'support.et@siifmart.com',
    taxIdLabel: 'ERCA TIN',
    taxIdDefault: '0001234567',
    policy: 'Items may be returned within 7 days with valid receipt.',
    qrLink: 'https://siifmart.com/feedback',
    width: '80mm',
    font: 'sans-serif',
    showLogo: true,
    enableQR: true,
  },
  KE: {
    header: 'SIIFMART KENYA RETAIL',
    footer: 'Asante kwa ununuzi wako!',
    address: 'Westlands Commercial Centre, Nairobi, Kenya',
    phone: '+254 712 345 678',
    email: 'support.ke@siifmart.com',
    taxIdLabel: 'KRA PIN (eTIMS)',
    taxIdDefault: 'P051234567Z',
    policy: 'Items may be returned within 7 days with valid receipt.',
    qrLink: 'https://siifmart.com/feedback/ke',
    width: '80mm',
    font: 'sans-serif',
    showLogo: true,
    enableQR: true,
  },
  UG: {
    header: 'SIIFMART UGANDA RETAIL',
    footer: 'Thank you for shopping with us!',
    address: 'Plot 14, Jinja Road, Kampala, Uganda',
    phone: '+256 700 123 456',
    email: 'support.ug@siifmart.com',
    taxIdLabel: 'URA TIN',
    taxIdDefault: '1001234567',
    policy: 'Items may be returned within 7 days with valid receipt.',
    qrLink: 'https://siifmart.com/feedback/ug',
    width: '80mm',
    font: 'sans-serif',
    showLogo: true,
    enableQR: true,
  },
  RW: {
    header: 'SIIFMART RWANDA RETAIL',
    footer: 'Murakoze cyane guhaha natwe!',
    address: 'KG 7 Ave, Boulevard de l\'OUA, Kigali, Rwanda',
    phone: '+250 780 123 456',
    email: 'support.rw@siifmart.com',
    taxIdLabel: 'RRA TIN',
    taxIdDefault: '100023456',
    policy: 'Items may be returned within 7 days with valid receipt.',
    qrLink: 'https://siifmart.com/feedback/rw',
    width: '80mm',
    font: 'sans-serif',
    showLogo: true,
    enableQR: true,
  },
  TZ: {
    header: 'SIIFMART TANZANIA RETAIL',
    footer: 'Asante kwa kufanya manunuzi nasi!',
    address: 'Ali Hassan Mwinyi Road, Dar es Salaam, Tanzania',
    phone: '+255 754 123 456',
    email: 'support.tz@siifmart.com',
    taxIdLabel: 'TRA TIN',
    taxIdDefault: '123-456-789',
    policy: 'Items may be returned within 7 days with valid receipt.',
    qrLink: 'https://siifmart.com/feedback/tz',
    width: '80mm',
    font: 'sans-serif',
    showLogo: true,
    enableQR: true,
  },
};

export function getCountryReceiptDefaults(country: Country): CountryReceiptDefaults {
  return COUNTRY_RECEIPT_DEFAULTS[country] || COUNTRY_RECEIPT_DEFAULTS.ET;
}
