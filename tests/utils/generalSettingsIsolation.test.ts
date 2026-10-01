import { describe, it, expect } from 'vitest';
import {
  getCountryLegalDefaults,
  getCountryBrandingDefaults,
  COUNTRY_LEGAL_DEFAULTS,
  COUNTRY_BRANDING_DEFAULTS,
} from '../../utils/localization';
import {
  BrandingSettingsSchema,
  LegalSettingsSchema,
  LocalizationSettingsSchema,
} from '../../schemas/general-settings.schema';

describe('General Settings Country Isolation', () => {
  it('should isolate Ethiopian legal entity from Kenyan legal entity', () => {
    const etLegal = getCountryLegalDefaults('ET');
    const keLegal = getCountryLegalDefaults('KE');

    // Ethiopia expectations
    expect(etLegal.legalBusinessName).toBe('SiifMart Technologies PLC');
    expect(etLegal.taxId).toBe('0001234567');
    expect(etLegal.taxVatNumber).toContain('ERCA');
    expect(etLegal.registeredAddress).toContain('Addis Ababa');
    expect(etLegal.supportPhone).toContain('+251');

    // Kenya expectations
    expect(keLegal.legalBusinessName).toBe('SiifMart Kenya Limited');
    expect(keLegal.taxId).toBe('P051234567Z');
    expect(keLegal.taxVatNumber).toContain('KRA PIN');
    expect(keLegal.registeredAddress).toContain('Nairobi');
    expect(keLegal.supportPhone).toContain('+254');

    // Zero cross-country bleeding
    expect(keLegal.registeredAddress).not.toContain('Addis Ababa');
    expect(keLegal.taxId).not.toBe(etLegal.taxId);
    expect(etLegal.registeredAddress).not.toContain('Nairobi');
  });

  it('should isolate branding profiles across countries', () => {
    const etBranding = getCountryBrandingDefaults('ET');
    const keBranding = getCountryBrandingDefaults('KE');

    expect(etBranding.storeName).toBe('SIIFMART Ethiopia');
    expect(etBranding.slogan).toBe('Your Trusted Marketplace');

    expect(keBranding.storeName).toBe('SIIFMART Kenya');
    expect(keBranding.slogan).toBe('Karibu Sana');

    // Both should use sand/emerald brand color, never cyber tokens
    expect(etBranding.brandColor).toBe('#2C5E3B');
    expect(keBranding.brandColor).toBe('#2C5E3B');
    expect(keBranding.brandColor).not.toBe('#00ff9d');
  });

  it('should validate branding settings via Zod schema', () => {
    const valid = BrandingSettingsSchema.safeParse({
      storeName: 'SIIFMART Kenya',
      slogan: 'Karibu Sana',
      brandColor: '#2C5E3B',
      country: 'KE',
    });
    expect(valid.success).toBe(true);

    // Invalid hex color should fail
    const invalidColor = BrandingSettingsSchema.safeParse({
      storeName: 'SIIFMART',
      brandColor: 'not-a-color',
    });
    expect(invalidColor.success).toBe(false);

    // Empty store name should fail
    const emptyName = BrandingSettingsSchema.safeParse({
      storeName: '',
      brandColor: '#2C5E3B',
    });
    expect(emptyName.success).toBe(false);
  });

  it('should validate legal entity settings via Zod schema', () => {
    const valid = LegalSettingsSchema.safeParse({
      legalBusinessName: 'SiifMart Kenya Limited',
      taxId: 'P051234567Z',
      taxVatNumber: 'VAT-KRA PIN',
      registeredAddress: 'Westlands Commercial Centre, Nairobi',
      supportContact: 'support.ke@siifmart.com',
      supportPhone: '+254 712 345 678',
      country: 'KE',
    });
    expect(valid.success).toBe(true);

    // Invalid email should fail
    const invalidEmail = LegalSettingsSchema.safeParse({
      legalBusinessName: 'SiifMart',
      registeredAddress: 'Nairobi',
      supportContact: 'not-an-email',
      supportPhone: '+254 712 345 678',
    });
    expect(invalidEmail.success).toBe(false);
  });

  it('should validate localization settings via Zod schema', () => {
    const valid = LocalizationSettingsSchema.safeParse({
      country: 'KE',
      currency: 'KSh',
      timezone: 'Africa/Nairobi',
      dateFormat: 'DD/MM/YYYY',
      language: 'en',
      taxRate: 16,
      defaultVatRate: 16,
      taxAuthority: 'Kenya Revenue Authority (KRA)',
      complianceStandard: 'KRA Electronic Tax Invoice Management System (eTIMS)',
      eTimsEnabled: true,
    });
    expect(valid.success).toBe(true);
  });
});
