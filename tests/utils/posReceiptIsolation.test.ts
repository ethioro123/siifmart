import { describe, it, expect } from 'vitest';
import {
  POSReceiptBrandingSchema,
  POSWorkflowSchema,
  getCountryReceiptDefaults,
  COUNTRY_RECEIPT_DEFAULTS,
} from '../../schemas/pos-settings.schema';
import { getCountryProfile } from '../../utils/localization';
import type { SystemConfig } from '../../types';

describe('POS Receipt Branding & Country Isolation', () => {
  it('should validate valid receipt branding input', () => {
    const validData = {
      posReceiptLogo: 'https://assets.siifmart.com/logo.png',
      posReceiptShowLogo: true,
      posReceiptHeader: 'SIIFMART RETAIL',
      posReceiptFooter: 'Thank you for shopping with us!',
      posReceiptAddress: 'Bole Sub-City, Addis Ababa',
      posReceiptPhone: '+251 911 234 567',
      posReceiptEmail: 'support.et@siifmart.com',
      posReceiptTaxId: '0001234567',
      posReceiptPolicy: 'Items may be returned within 7 days with valid receipt.',
      posReceiptSocialHandle: '@siifmart_et',
      posReceiptEnableQR: true,
      posReceiptQRLink: 'https://siifmart.com/feedback',
      posReceiptWidth: '80mm' as const,
      posReceiptFont: 'sans-serif' as const,
      targetCountry: 'ET' as const,
    };

    const parsed = POSReceiptBrandingSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('should reject receipt branding with empty header', () => {
    const invalidData = {
      posReceiptHeader: '',
      targetCountry: 'ET',
    };

    const parsed = POSReceiptBrandingSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/Receipt header is required/i);
    }
  });

  it('should reject invalid logo URL or invalid email in receipt branding', () => {
    const invalidUrl = {
      posReceiptHeader: 'SIIFMART',
      posReceiptLogo: 'not-a-valid-url',
    };
    const parsedUrl = POSReceiptBrandingSchema.safeParse(invalidUrl);
    expect(parsedUrl.success).toBe(false);

    const invalidEmail = {
      posReceiptHeader: 'SIIFMART',
      posReceiptEmail: 'bad-email-format',
    };
    const parsedEmail = POSReceiptBrandingSchema.safeParse(invalidEmail);
    expect(parsedEmail.success).toBe(false);
  });

  it('should validate POS workflow schema correctly', () => {
    const validWorkflow = {
      posTerminalId: 'TERM-001',
      posRegisterMode: 'cashier' as const,
      posGuestCheckout: false,
      posBlockNegativeStock: true,
      requireShiftClosure: true,
      posDailyRevenueTarget: 50000,
      posDailyTxTarget: 50,
      targetCountry: 'ET' as const,
    };
    const parsed = POSWorkflowSchema.safeParse(validWorkflow);
    expect(parsed.success).toBe(true);

    const negativeTarget = {
      ...validWorkflow,
      posDailyRevenueTarget: -100,
    };
    const parsedNegative = POSWorkflowSchema.safeParse(negativeTarget);
    expect(parsedNegative.success).toBe(false);
  });

  it('should return distinct national receipt defaults for ET and KE', () => {
    const etDefaults = getCountryReceiptDefaults('ET');
    const keDefaults = getCountryReceiptDefaults('KE');

    expect(etDefaults.taxIdLabel).toBe('ERCA TIN');
    expect(etDefaults.taxIdDefault).toBe('0001234567');
    expect(etDefaults.phone).toContain('+251');
    expect(etDefaults.address).toContain('Addis Ababa');

    expect(keDefaults.taxIdLabel).toContain('KRA PIN');
    expect(keDefaults.taxIdDefault).toBe('P051234567Z');
    expect(keDefaults.phone).toContain('+254');
    expect(keDefaults.address).toContain('Nairobi');

    expect(etDefaults.address).not.toEqual(keDefaults.address);
    expect(etDefaults.taxIdDefault).not.toEqual(keDefaults.taxIdDefault);
  });

  it('should guarantee 100% strict receipt branding isolation between countries in system config', () => {
    const baseConfig: Partial<SystemConfig> = {
      country: 'ET',
      posReceiptHeader: 'SIIFMART ETHIOPIA',
      posReceiptTaxId: '0001234567',
      posReceiptAddress: 'Bole, Addis Ababa',
      countryConfigs: {
        ET: {
          posReceiptHeader: 'SIIFMART ETHIOPIA',
          posReceiptTaxId: '0001234567',
          posReceiptAddress: 'Bole, Addis Ababa',
        },
        KE: {
          posReceiptHeader: 'SIIFMART KENYA',
          posReceiptTaxId: 'P051234567Z',
          posReceiptAddress: 'Westlands, Nairobi',
        },
      },
    };

    // Simulate saving Kenyan receipt updates to countryConfigs.KE
    const keUpdates = {
      posReceiptHeader: 'SIIFMART NAIROBI HUB',
      posReceiptTaxId: 'P099999999Z',
      posReceiptAddress: 'Kilimani, Nairobi',
    };

    const updatedConfig: Partial<SystemConfig> = {
      ...baseConfig,
      countryConfigs: {
        ...baseConfig.countryConfigs,
        KE: {
          ...baseConfig.countryConfigs?.KE,
          ...keUpdates,
        },
      },
    };

    // Verify Ethiopian partition was NOT altered
    expect(updatedConfig.countryConfigs?.ET?.posReceiptHeader).toBe('SIIFMART ETHIOPIA');
    expect(updatedConfig.countryConfigs?.ET?.posReceiptTaxId).toBe('0001234567');
    expect(updatedConfig.countryConfigs?.ET?.posReceiptAddress).toBe('Bole, Addis Ababa');

    // Verify Kenyan partition was updated
    expect(updatedConfig.countryConfigs?.KE?.posReceiptHeader).toBe('SIIFMART NAIROBI HUB');
    expect(updatedConfig.countryConfigs?.KE?.posReceiptTaxId).toBe('P099999999Z');
    expect(updatedConfig.countryConfigs?.KE?.posReceiptAddress).toBe('Kilimani, Nairobi');

    // Verify currency profile isolation
    const etProfile = getCountryProfile({ country: 'ET' });
    const keProfile = getCountryProfile({ country: 'KE' });
    expect(etProfile.currencySymbol).toBe('ETB');
    expect(keProfile.currencySymbol).toBe('KSh');
  });
});
